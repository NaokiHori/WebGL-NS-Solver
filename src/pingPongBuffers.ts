import {
  FloatingPointTexture,
  FloatingPointTextureType,
} from "./webgl/floatingPointTexture";
import { Framebuffer } from "./webgl/framebuffer";

export class PingPongBuffers {
  public isFliped: boolean;
  public textures: [FloatingPointTexture, FloatingPointTexture];
  public framebuffers: [Framebuffer, Framebuffer];

  public constructor({
    gl,
    floatingPointTextureType,
    width,
    height,
  }: {
    gl: WebGL2RenderingContext;
    floatingPointTextureType: FloatingPointTextureType;
    width: number;
    height: number;
  }) {
    // prepare two frame buffers
    //   and attach the given floating-point texture
    //   to each frame buffer
    const framebuffers: [Framebuffer, Framebuffer] = [
      new Framebuffer({ gl }),
      new Framebuffer({ gl }),
    ];
    const textures: [FloatingPointTexture, FloatingPointTexture] = [
      new FloatingPointTexture({ gl, floatingPointTextureType, width, height }),
      new FloatingPointTexture({ gl, floatingPointTextureType, width, height }),
    ];
    framebuffers[0].attachFloatingPointTexture({
      gl,
      floatingPointTexture: textures[0],
      attachment: gl.COLOR_ATTACHMENT0,
    });
    framebuffers[1].attachFloatingPointTexture({
      gl,
      floatingPointTexture: textures[1],
      attachment: gl.COLOR_ATTACHMENT0,
    });
    this.isFliped = false;
    this.textures = textures;
    this.framebuffers = framebuffers;
  }

  public flip() {
    this.isFliped = !this.isFliped;
  }

  public getCurrentField(): {
    texture: FloatingPointTexture;
    framebuffer: Framebuffer;
  } {
    const isFliped: boolean = this.isFliped;
    return {
      texture: this.textures[isFliped ? 1 : 0],
      framebuffer: this.framebuffers[isFliped ? 0 : 1],
    };
  }

  public getBackField(): {
    texture: FloatingPointTexture;
    framebuffer: Framebuffer;
  } {
    const isFliped: boolean = this.isFliped;
    return {
      texture: this.textures[isFliped ? 0 : 1],
      framebuffer: this.framebuffers[isFliped ? 1 : 0],
    };
  }
}
