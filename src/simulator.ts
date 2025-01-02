import { FloatingPointTexture } from "./webgl/floatingPointTexture";
import { PingPongBuffers } from "./pingPongBuffers";
import { UpdateUx } from "./simulator/updateUx";
import { UpdateUy } from "./simulator/updateUy";
import { UpdateTemp } from "./simulator/updateTemp";
import { ComputePressure } from "./simulator/computePressure";
import { CorrectUx } from "./simulator/correctUx";
import { CorrectUy } from "./simulator/correctUy";

export class Simulator {
  private _uxs: PingPongBuffers;
  private _uys: PingPongBuffers;
  private _temps: PingPongBuffers;
  private _pressures: PingPongBuffers;
  private _timeStepSize: number;
  private _updateUx: UpdateUx;
  private _updateUy: UpdateUy;
  private _updateTemp: UpdateTemp;
  private _computePressure: ComputePressure;
  private _correctUx: CorrectUx;
  private _correctUy: CorrectUy;

  public constructor({
    ra,
    pr,
    lx,
    ly,
    width,
    height,
    gl,
    uxData,
    uyData,
    tempData,
  }: {
    ra: number;
    pr: number;
    lx: number;
    ly: number;
    width: number;
    height: number;
    gl: WebGL2RenderingContext;
    uxData: Float32Array;
    uyData: Float32Array;
    tempData: Float32Array;
  }) {
    if (0 !== width % 4) {
      throw new Error(`Width should be a multiple of 4: ${width.toString()}`);
    }
    // time-step size given by the stability limit
    const timeStepSize = computeTimeStepSize(ra, pr, lx, ly, width, height);
    // scalar fields, utilizing the ping-pong buffering
    const uxs = new PingPongBuffers({
      gl,
      floatingPointTextureType: "SINGLE_CHANNEL",
      width,
      height,
    });
    const uys = new PingPongBuffers({
      gl,
      floatingPointTextureType: "SINGLE_CHANNEL",
      width,
      height,
    });
    const temps = new PingPongBuffers({
      gl,
      floatingPointTextureType: "SINGLE_CHANNEL",
      width,
      height,
    });
    const pressures = new PingPongBuffers({
      gl,
      floatingPointTextureType: "FOUR_CHANNELS",
      width: width / 4,
      height,
    });
    // send initial fields
    (function () {
      const texture: FloatingPointTexture = temps.textures[0];
      texture.bindAndExecute({
        gl,
        callback: () => {
          gl.texSubImage2D(
            texture.target,
            0,
            0,
            0,
            width,
            height,
            texture.format,
            texture.type,
            tempData,
          );
        },
      });
    })();
    (function () {
      const texture: FloatingPointTexture = uxs.textures[0];
      texture.bindAndExecute({
        gl,
        callback: () => {
          gl.texSubImage2D(
            texture.target,
            0,
            0,
            0,
            width,
            height,
            texture.format,
            texture.type,
            uxData,
          );
        },
      });
    })();
    (function () {
      const texture: FloatingPointTexture = uys.textures[0];
      texture.bindAndExecute({
        gl,
        callback: () => {
          gl.texSubImage2D(
            texture.target,
            0,
            0,
            0,
            width,
            height,
            texture.format,
            texture.type,
            uyData,
          );
        },
      });
    })();
    this._uxs = uxs;
    this._uys = uys;
    this._temps = temps;
    this._pressures = pressures;
    this._timeStepSize = timeStepSize;
    this._updateUx = new UpdateUx({
      gl,
      lx,
      ly,
      width,
      height,
      timeStepSize,
      diffusivity: Math.sqrt((1 / ra) * pr),
    });
    this._updateUy = new UpdateUy({
      gl,
      lx,
      ly,
      width,
      height,
      timeStepSize,
      diffusivity: Math.sqrt((1 / ra) * pr),
    });
    this._updateTemp = new UpdateTemp({
      gl,
      lx,
      ly,
      width,
      height,
      timeStepSize,
      diffusivity: Math.sqrt(1 / ra / pr),
    });
    this._computePressure = new ComputePressure({
      gl,
      lx,
      ly,
      width,
      height,
    });
    this._correctUx = new CorrectUx({ gl, lx, width });
    this._correctUy = new CorrectUy({ gl, ly, height });
  }

  public update({
    gl,
    width,
    height,
  }: {
    gl: WebGL2RenderingContext;
    width: number;
    height: number;
  }): number {
    const uxs: PingPongBuffers = this._uxs;
    const uys: PingPongBuffers = this._uys;
    const temps: PingPongBuffers = this._temps;
    const pressures: PingPongBuffers = this._pressures;
    // update scalar fields
    this._updateUx.run({
      gl,
      width,
      height,
      uxs,
      uys,
      temps,
    });
    this._updateUy.run({
      gl,
      width,
      height,
      uxs,
      uys,
    });
    this._updateTemp.run({
      gl,
      width,
      height,
      uxs,
      uys,
      temps,
    });
    // flipping ping-pong buffers are deferred, which is done here
    uxs.flip();
    uys.flip();
    temps.flip();
    // correct velocity field to enforce incompressibility
    this._computePressure.run({
      gl,
      width,
      height,
      uxs,
      uys,
      pressures,
    });
    this._correctUx.run({
      gl,
      width,
      height,
      uxs,
      pressures,
    });
    this._correctUy.run({
      gl,
      width,
      height,
      uys,
      pressures,
    });
    return this._timeStepSize;
  }

  public getCurrentTemp(): FloatingPointTexture {
    const { texture }: { texture: FloatingPointTexture } =
      this._temps.getCurrentField();
    return texture;
  }

  public checkDivergence({
    gl,
    lx,
    ly,
    width,
    height,
  }: {
    gl: WebGL2RenderingContext;
    lx: number;
    ly: number;
    width: number;
    height: number;
  }): number {
    // NOTE: this is for debug use,
    //       since this method copies GPU-stored data to CPU side,
    //       which is time-consuming
    const ux = this._uxs
      .getBackField()
      .framebuffer.getTextureData({ gl, width, height });
    const uy = this._uys
      .getBackField()
      .framebuffer.getTextureData({ gl, width, height });
    const dx = lx / width;
    const dy = ly / height;
    let maxDiv = 0;
    for (let j = 0; j < height; j++) {
      for (let i = 0; i < width; i++) {
        const ux_xm = ux[j * width + i];
        const ux_xp = width - 1 === i ? 0 : ux[j * width + i + 1];
        const uy_ym = uy[j * width + i];
        const uy_yp =
          height - 1 === j ? uy[0 * width + i] : uy[(j + 1) * width + i];
        const duxdx = (ux_xp - ux_xm) / dx;
        const duydy = (uy_yp - uy_ym) / dy;
        const div = duxdx + duydy;
        maxDiv = Math.max(maxDiv, Math.abs(div));
      }
    }
    return maxDiv;
  }
}

function computeTimeStepSize(
  ra: number,
  pr: number,
  lx: number,
  ly: number,
  width: number,
  height: number,
): number {
  const NDIMS = 2;
  const safetyFactors = {
    adv: 0.25,
    dif: 0.5,
  };
  const diffusivity = Math.max(
    Math.sqrt((1 / ra) * pr),
    Math.sqrt(1 / ra / pr),
  );
  const maxVelocity = 1;
  const gridSize = Math.min(lx / width, ly / height);
  const advTimeStepSize = safetyFactors.adv * (gridSize / maxVelocity);
  const difTimeStepSize =
    safetyFactors.dif * (0.5 / NDIMS / diffusivity) * Math.pow(gridSize, 2);
  console.log(
    `Advective restriction on dt: ${advTimeStepSize.toExponential(2)}`,
  );
  console.log(
    `Diffusive restriction on dt: ${difTimeStepSize.toExponential(2)}`,
  );
  return Math.min(advTimeStepSize, difTimeStepSize);
}
