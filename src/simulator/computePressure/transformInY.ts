import { PingPongBuffers } from "../../pingPongBuffers";
import { DFT } from "./transformInY/dft";

export class TransformInY {
  private _dft: DFT;

  public constructor({
    gl,
    height,
  }: {
    gl: WebGL2RenderingContext;
    height: number;
  }) {
    this._dft = new DFT({ gl, height });
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
      this._dft.run({
        gl,
        width,
        height,
        pressures,
        isForward,
      });
    } else {
      this._dft.run({
        gl,
        width,
        height,
        pressures,
        isForward,
      });
    }
  }
}
