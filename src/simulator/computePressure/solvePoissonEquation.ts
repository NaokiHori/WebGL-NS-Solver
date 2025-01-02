import { Program } from "../../webgl/program";
import { Framebuffer } from "../../webgl/framebuffer";
import { FloatingPointTexture } from "../../webgl/floatingPointTexture";
import { PingPongBuffers } from "../../pingPongBuffers";
import { VertexBufferObject } from "../../webgl/vertexBufferObject";
import { defineAndSetUniform } from "../../webgl/uniform";
import { setVertexPosition } from "../domain";
import vertexShaderSource from "../domain.vs.glsl?raw";
import fragmentShaderSource from "./solvePoissonEquation.fs.glsl?raw";

export class SolvePoissonEquation {
  private _program: Program;
  private _vertexBufferObject: VertexBufferObject;

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
      name: "rhs",
      data: [0],
    });
    this._program = program;
    this._vertexBufferObject = vertexBufferObject;
  }

  public run({
    gl,
    width,
    height,
    pressures,
  }: {
    gl: WebGL2RenderingContext;
    width: number;
    height: number;
    pressures: PingPongBuffers;
  }) {
    const program: Program = this._program;
    const vertexBufferObject: VertexBufferObject = this._vertexBufferObject;
    const {
      texture: rhs,
      framebuffer,
    }: {
      texture: FloatingPointTexture;
      framebuffer: Framebuffer;
    } = pressures.getCurrentField();
    program.use({
      gl,
      callback: () => {
        framebuffer.bindAndExecute({
          gl,
          callback: () => {
            gl.disable(gl.BLEND);
            gl.viewport(0, 0, width / 4, height);
            gl.activeTexture(gl.TEXTURE0);
            rhs.bindAndExecute({
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
            gl.enable(gl.BLEND);
            gl.activeTexture(gl.TEXTURE0);
          },
        });
      },
    });
    pressures.flip();
  }
}
