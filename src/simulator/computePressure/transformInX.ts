import { PingPongBuffers } from "../../pingPongBuffers";
import { DCT } from "./transformInX/dct";

export class TransformInX {
  private _dct: DCT;

  public constructor({
    gl,
    width,
  }: {
    gl: WebGL2RenderingContext;
    width: number;
  }) {
    this._dct = new DCT({ gl, width });
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
    if (isForward) {
      this._dct.run({
        gl,
        width,
        height,
        pressures,
        isForward,
      });
    } else {
      this._dct.run({
        gl,
        width,
        height,
        pressures,
        isForward,
      });
    }
  }
}
