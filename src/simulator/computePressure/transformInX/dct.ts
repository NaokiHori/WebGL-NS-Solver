import { Program } from "../../../webgl/program";
import { Framebuffer } from "../../../webgl/framebuffer";
import { FloatingPointTexture } from "../../../webgl/floatingPointTexture";
import { PingPongBuffers } from "../../../pingPongBuffers";
import { VertexBufferObject } from "../../../webgl/vertexBufferObject";
import { defineAndSetUniform } from "../../../webgl/uniform";
import { setVertexPosition } from "../../domain";
import vertexShaderSource from "../../domain.vs.glsl?raw";
import forwardFragmentShaderSource from "./dctForward.fs.glsl?raw";
import backwardFragmentShaderSource from "./dctBackward.fs.glsl?raw";

export class DCT {
  private _forwardProgram: Program;
  private _backwardProgram: Program;
  private _forwardVertexBufferObject: VertexBufferObject;
  private _backwardVertexBufferObject: VertexBufferObject;

  public constructor({
    gl,
    width,
  }: {
    gl: WebGL2RenderingContext;
    width: number;
  }) {
    const forwardProgram = new Program({
      gl,
      vertexShaderSource,
      fragmentShaderSource: forwardFragmentShaderSource,
    });
    const backwardProgram = new Program({
      gl,
      vertexShaderSource,
      fragmentShaderSource: backwardFragmentShaderSource,
    });
    const forwardVertexBufferObject: VertexBufferObject = setVertexPosition({
      gl,
      program: forwardProgram,
    });
    const backwardVertexBufferObject: VertexBufferObject = setVertexPosition({
      gl,
      program: backwardProgram,
    });
    // initialize and send uniform values
    for (const program of [forwardProgram, backwardProgram]) {
      defineAndSetUniform({
        gl,
        program,
        dataType: "INT32",
        name: "u_nx",
        data: [width],
      });
      defineAndSetUniform({
        gl,
        program,
        dataType: "INT32",
        name: "in_seq",
        data: [0],
      });
    }
    this._forwardProgram = forwardProgram;
    this._backwardProgram = backwardProgram;
    this._forwardVertexBufferObject = forwardVertexBufferObject;
    this._backwardVertexBufferObject = backwardVertexBufferObject;
  }

  public run({
    gl,
    width,
    height,
    pressures,
    isForward,
  }: {
    gl: WebGL2RenderingContext;
    width: number;
    height: number;
    pressures: PingPongBuffers;
    isForward: boolean;
  }) {
    const program: Program = isForward
      ? this._forwardProgram
      : this._backwardProgram;
    const vertexBufferObject: VertexBufferObject = isForward
      ? this._forwardVertexBufferObject
      : this._backwardVertexBufferObject;
    gl.disable(gl.BLEND);
    gl.viewport(0, 0, width / 4, height);
    const {
      texture: inSeq,
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
            gl.activeTexture(gl.TEXTURE0);
            inSeq.bindAndExecute({
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
    pressures.flip();
    gl.enable(gl.BLEND);
    gl.activeTexture(gl.TEXTURE0);
  }
}
