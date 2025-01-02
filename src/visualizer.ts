import { Canvas } from "./canvas";
import { Program } from "./webgl/program";
import { VertexBufferObject } from "./webgl/vertexBufferObject";
import { VertexAttribute } from "./webgl/vertexAttribute";
import { IndexBufferObject } from "./webgl/indexBufferObject";
import { Uniform, defineAndSetUniform } from "./webgl/uniform";
import { FloatingPointTexture } from "./webgl/floatingPointTexture";
import vertexShaderSource from "./visualizer/vertexShader.glsl?raw";
import fragmentShaderSource from "./visualizer/fragmentShader.glsl?raw";

interface Uniforms {
  scale: Uniform;
}

export class Visualizer {
  private _program: Program;
  private _uniforms: Uniforms;
  private _indexBufferObject: IndexBufferObject;

  public constructor({
    gl,
    width,
    height,
  }: {
    gl: WebGL2RenderingContext;
    width: number;
    height: number;
  }) {
    const program = new Program({
      gl,
      vertexShaderSource,
      fragmentShaderSource,
    });
    const scale = new Uniform({
      gl,
      program,
      dataType: "FLOAT32",
      name: "u_scale",
      nitems: 2,
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
      dataType: "INT32",
      name: "scalar",
      data: [0],
    });
    const indexBufferObject: IndexBufferObject = program.use({
      gl,
      callback: (webGLProgram: WebGLProgram) => {
        const positions = [
          [-1, -1],
          [+1, -1],
          [-1, +1],
          [+1, +1],
        ];
        const numberOfVertices = positions.length;
        const numberOfItemsForEachVertex = positions[0].length;
        const indices = [0, 1, 2, 1, 3, 2];
        const attribute = new VertexAttribute({
          gl,
          program: webGLProgram,
          attributeName: "a_position",
        });
        new VertexBufferObject({
          gl,
          numberOfVertices,
          numberOfItemsForEachVertex,
          usage: gl.STATIC_DRAW,
        }).bindAndExecute({
          gl,
          callback: (boundBuffer: VertexBufferObject) => {
            attribute.bindWithArrayBuffer({
              gl,
              program: webGLProgram,
              size: numberOfItemsForEachVertex,
              vertexBufferObject: boundBuffer,
            });
            boundBuffer.updateData({
              gl,
              data: new Float32Array(positions.flat()),
            });
          },
        });
        const indexBufferObject = new IndexBufferObject({
          gl,
          size: indices.length,
          usage: gl.STATIC_DRAW,
        });
        indexBufferObject.bindAndExecute({
          gl,
          callback: (boundBuffer: IndexBufferObject) => {
            boundBuffer.updateData({ gl, data: new Int16Array(indices) });
          },
        });
        return indexBufferObject;
      },
    });
    this._program = program;
    this._uniforms = {
      scale,
    };
    this._indexBufferObject = indexBufferObject;
  }

  public draw({
    canvas,
    gl,
    floatingPointTexture,
  }: {
    canvas: Canvas;
    gl: WebGL2RenderingContext;
    floatingPointTexture: FloatingPointTexture;
  }) {
    const program: Program = this._program;
    const indexBufferObject: IndexBufferObject = this._indexBufferObject;
    const {
      width: canvasWidth,
      height: canvasHeight,
    }: { width: number; height: number } = canvas.getSize();
    program.use({
      gl,
      callback: () => {
        gl.viewport(0, 0, canvasWidth, canvasHeight);
        floatingPointTexture.bindAndExecute({
          gl,
          callback: () => {
            indexBufferObject.bindAndExecute({
              gl,
              callback: (boundBuffer: IndexBufferObject) => {
                boundBuffer.draw({ gl, mode: gl.TRIANGLES });
              },
            });
          },
        });
      },
    });
  }

  public handleResizeEvent({
    canvas,
    gl,
    lx,
    ly,
  }: {
    canvas: Canvas;
    gl: WebGL2RenderingContext;
    lx: number;
    ly: number;
  }) {
    const program: Program = this._program;
    // transpose scalar so that vertical direction is wall-bounded
    const scalarAspectRatio: number = ly / lx;
    const scale: Uniform = this._uniforms.scale;
    canvas.syncSize();
    const {
      width: canvasWidth,
      height: canvasHeight,
    }: { width: number; height: number } = canvas.getSize();
    program.use({
      gl,
      callback: () => {
        gl.viewport(0, 0, canvasWidth, canvasHeight);
        const canvasAspectRatio: number = canvasWidth / canvasHeight;
        scale.set({
          data:
            canvasAspectRatio < scalarAspectRatio
              ? [1, canvasAspectRatio / scalarAspectRatio]
              : [scalarAspectRatio / canvasAspectRatio, 1],
        });
      },
    });
  }
}
