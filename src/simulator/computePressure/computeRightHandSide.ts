import { Program } from "../../webgl/program";
import { defineAndSetUniform } from "../../webgl/uniform";
import { Framebuffer } from "../../webgl/framebuffer";
import { FloatingPointTexture } from "../../webgl/floatingPointTexture";
import { PingPongBuffers } from "../../pingPongBuffers";
import { VertexBufferObject } from "../../webgl/vertexBufferObject";
import { setVertexPosition } from "../domain";
import vertexShaderSource from "../domain.vs.glsl?raw";
import fragmentShaderSource from "./computeRightHandSide.fs.glsl?raw";

export class ComputeRightHandSide {
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
    this._program = program;
    this._vertexBufferObject = vertexBufferObject;
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
    const program: Program = this._program;
    const vertexBufferObject: VertexBufferObject = this._vertexBufferObject;
    const { texture: ux }: { texture: FloatingPointTexture } =
      uxs.getCurrentField();
    const { texture: uy }: { texture: FloatingPointTexture } =
      uys.getCurrentField();
    const { framebuffer }: { framebuffer: Framebuffer } =
      pressures.getCurrentField();
    program.use({
      gl,
      callback: () => {
        framebuffer.bindAndExecute({
          gl,
          callback: () => {
            gl.disable(gl.BLEND);
            gl.viewport(0, 0, width / 4, height);
            gl.activeTexture(gl.TEXTURE0);
            ux.bindAndExecute({
              gl,
              callback: () => {
                gl.activeTexture(gl.TEXTURE1);
                uy.bindAndExecute({
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
    pressures.flip();
  }
}
