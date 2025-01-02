import { Program } from "../webgl/program";
import { Framebuffer } from "../webgl/framebuffer";
import { FloatingPointTexture } from "../webgl/floatingPointTexture";
import { PingPongBuffers } from "../pingPongBuffers";
import { VertexBufferObject } from "../webgl/vertexBufferObject";
import { defineAndSetUniform } from "../webgl/uniform";
import { setVertexPosition } from "./domain";
import vertexShaderSource from "./domain.vs.glsl?raw";
import fragmentShaderSource from "./updateUx.fs.glsl?raw";

export class UpdateUx {
  private _program: Program;
  private _vertexBufferObject: VertexBufferObject;

  public constructor({
    gl,
    lx,
    ly,
    width,
    height,
    timeStepSize,
    diffusivity,
  }: {
    gl: WebGL2RenderingContext;
    lx: number;
    ly: number;
    width: number;
    height: number;
    timeStepSize: number;
    diffusivity: number;
  }) {
    const program = new Program({
      gl,
      vertexShaderSource,
      fragmentShaderSource,
    });
    const vertexBufferObject: VertexBufferObject = setVertexPosition({
      gl,
      program,
    });
    // initialize and send uniform values
    defineAndSetUniform({
      gl,
      program,
      dataType: "FLOAT32",
      name: "u_diffusivity",
      data: [diffusivity],
    });
    defineAndSetUniform({
      gl,
      program,
      dataType: "FLOAT32",
      name: "u_time_step_size",
      data: [timeStepSize],
    });
    defineAndSetUniform({
      gl,
      program,
      dataType: "INT32",
      name: "u_resolution",
      data: [width, height],
    });
    defineAndSetUniform({
      gl,
      program,
      dataType: "FLOAT32",
      name: "u_grid_size",
      data: [lx / width, ly / height],
    });
    defineAndSetUniform({
      gl,
      program,
      dataType: "INT32",
      name: "ux",
      data: [0],
    });
    defineAndSetUniform({
      gl,
      program,
      dataType: "INT32",
      name: "uy",
      data: [1],
    });
    defineAndSetUniform({
      gl,
      program,
      dataType: "INT32",
      name: "temp",
      data: [2],
    });
    this._program = program;
    this._vertexBufferObject = vertexBufferObject;
  }

  public run({
    gl,
    width,
    height,
    uxs,
    uys,
    temps,
  }: {
    gl: WebGL2RenderingContext;
    width: number;
    height: number;
    uxs: PingPongBuffers;
    uys: PingPongBuffers;
    temps: PingPongBuffers;
  }) {
    const program: Program = this._program;
    const vertexBufferObject: VertexBufferObject = this._vertexBufferObject;
    const {
      texture: ux,
      framebuffer,
    }: { texture: FloatingPointTexture; framebuffer: Framebuffer } =
      uxs.getCurrentField();
    const { texture: uy }: { texture: FloatingPointTexture } =
      uys.getCurrentField();
    const { texture: temp }: { texture: FloatingPointTexture } =
      temps.getCurrentField();
    program.use({
      gl,
      callback: () => {
        framebuffer.bindAndExecute({
          gl,
          callback: () => {
            gl.disable(gl.BLEND);
            gl.viewport(0, 0, width, height);
            gl.activeTexture(gl.TEXTURE0);
            ux.bindAndExecute({
              gl,
              callback: () => {
                gl.activeTexture(gl.TEXTURE1);
                uy.bindAndExecute({
                  gl,
                  callback: () => {
                    gl.activeTexture(gl.TEXTURE2);
                    temp.bindAndExecute({
                      gl,
                      callback: () => {
                        vertexBufferObject.bindAndExecute({
                          gl,
                          callback: (boundBuffer: VertexBufferObject) => {
                            boundBuffer.draw({ gl, mode: gl.TRIANGLES });
                          },
                        });
                      },
                    });
                  },
                });
              },
            });
            gl.activeTexture(gl.TEXTURE0);
            gl.enable(gl.BLEND);
          },
        });
      },
    });
    // NOTE: flipping buffers should be deferred,
    //       as previous field will be used
    //       to update other fields
  }
}
