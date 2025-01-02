import { Program } from "../webgl/program";
import { Framebuffer } from "../webgl/framebuffer";
import { FloatingPointTexture } from "../webgl/floatingPointTexture";
import { PingPongBuffers } from "../pingPongBuffers";
import { VertexBufferObject } from "../webgl/vertexBufferObject";
import { defineAndSetUniform } from "../webgl/uniform";
import { setVertexPosition } from "./domain";
import vertexShaderSource from "./domain.vs.glsl?raw";
import fragmentShaderSource from "./correctUy.fs.glsl?raw";

export class CorrectUy {
  private _program: Program;
  private _vertexBufferObject: VertexBufferObject;

  public constructor({
    gl,
    ly,
    height,
  }: {
    gl: WebGL2RenderingContext;
    ly: number;
    height: number;
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
      dataType: "INT32",
      name: "u_ny",
      data: [height],
    });
    defineAndSetUniform({
      gl,
      program,
      dataType: "FLOAT32",
      name: "u_dy",
      data: [ly / height],
    });
    defineAndSetUniform({
      gl,
      program,
      dataType: "INT32",
      name: "uy",
      data: [0],
    });
    defineAndSetUniform({
      gl,
      program,
      dataType: "INT32",
      name: "pressure",
      data: [1],
    });
    this._program = program;
    this._vertexBufferObject = vertexBufferObject;
  }

  public run({
    gl,
    width,
    height,
    uys,
    pressures,
  }: {
    gl: WebGL2RenderingContext;
    width: number;
    height: number;
    uys: PingPongBuffers;
    pressures: PingPongBuffers;
  }) {
    const program: Program = this._program;
    const vertexBufferObject: VertexBufferObject = this._vertexBufferObject;
    const {
      texture: uy,
      framebuffer,
    }: { texture: FloatingPointTexture; framebuffer: Framebuffer } =
      uys.getCurrentField();
    const { texture: pressure }: { texture: FloatingPointTexture } =
      pressures.getCurrentField();
    program.use({
      gl,
      callback: () => {
        framebuffer.bindAndExecute({
          gl,
          callback: () => {
            gl.disable(gl.BLEND);
            gl.viewport(0, 0, width, height);
            gl.activeTexture(gl.TEXTURE0);
            uy.bindAndExecute({
              gl,
              callback: () => {
                gl.activeTexture(gl.TEXTURE1);
                pressure.bindAndExecute({
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
            gl.activeTexture(gl.TEXTURE0);
            gl.enable(gl.BLEND);
          },
        });
      },
    });
    uys.flip();
  }
}
