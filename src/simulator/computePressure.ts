import { PingPongBuffers } from "../pingPongBuffers";
import { ComputeRightHandSide } from "./computePressure/computeRightHandSide";
import { TransformInX } from "./computePressure/transformInX";
import { TransformInY } from "./computePressure/transformInY";
import { SolvePoissonEquation } from "./computePressure/solvePoissonEquation";

export class ComputePressure {
  private _computeRightHandSide: ComputeRightHandSide;
  private _transformInX: TransformInX;
  private _transformInY: TransformInY;
  private _solvePoissonEquation: SolvePoissonEquation;

  public constructor({
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
  }) {
    this._computeRightHandSide = new ComputeRightHandSide({
      gl,
      lx,
      ly,
      width,
      height,
    });
    this._transformInX = new TransformInX({
      gl,
      width,
    });
    this._transformInY = new TransformInY({
      gl,
      height,
    });
    this._solvePoissonEquation = new SolvePoissonEquation({
      gl,
      lx,
      ly,
      width,
      height,
    });
  }

  public run({
    gl,
    width,
    height,
    uxs,
    uys,
    pressures,
  }: {
    gl: WebGL2RenderingContext;
    width: number;
    height: number;
    uxs: PingPongBuffers;
    uys: PingPongBuffers;
    pressures: PingPongBuffers;
  }) {
    this._computeRightHandSide.run({
      gl,
      width,
      height,
      uxs,
      uys,
      pressures,
    });
    this._transformInX.run({
      gl,
      width,
      height,
      pressures,
      isForward: true,
    });
    this._transformInY.run({
      gl,
      width,
      height,
      pressures,
      isForward: true,
    });
    this._solvePoissonEquation.run({
      gl,
      width,
      height,
      pressures,
    });
    this._transformInY.run({
      gl,
      width,
      height,
      pressures,
      isForward: false,
    });
    this._transformInX.run({
      gl,
      width,
      height,
      pressures,
      isForward: false,
    });
  }
}
