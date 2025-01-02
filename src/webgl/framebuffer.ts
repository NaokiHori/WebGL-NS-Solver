import { FloatingPointTexture } from "./floatingPointTexture";

export const FRAMEBUFFER_CONFIG = {
  target: WebGL2RenderingContext.FRAMEBUFFER,
};

export class Framebuffer {
  private _webGLFramebuffer: WebGLFramebuffer;
  private _floatingPointTexture: FloatingPointTexture | null;

  public constructor({ gl }: { gl: WebGL2RenderingContext }) {
    const webGLFramebuffer = gl.createFramebuffer();
    const framebufferStatus: GLenum = gl.checkFramebufferStatus(
      FRAMEBUFFER_CONFIG.target,
    );
    if (gl.FRAMEBUFFER_COMPLETE !== framebufferStatus) {
      throw new Error(
        `Failed to create a framebuffer: ${framebufferStatus.toString()}`,
      );
    }
    this._webGLFramebuffer = webGLFramebuffer;
    this._floatingPointTexture = null;
  }

  public bindAndExecute<T>({
    gl,
    callback,
  }: {
    gl: WebGL2RenderingContext;
    callback: (webGLFramebuffer: WebGLFramebuffer) => T;
  }) {
    const webGLFramebuffer: WebGLFramebuffer = this._webGLFramebuffer;
    gl.bindFramebuffer(FRAMEBUFFER_CONFIG.target, webGLFramebuffer);
    const result = callback(webGLFramebuffer);
    gl.bindFramebuffer(FRAMEBUFFER_CONFIG.target, null);
    return result;
  }

  public attachFloatingPointTexture({
    gl,
    floatingPointTexture,
    attachment,
  }: {
    gl: WebGL2RenderingContext;
    floatingPointTexture: FloatingPointTexture;
    attachment: GLenum;
  }) {
    this.bindAndExecute({
      gl,
      callback: () => {
        floatingPointTexture.bindAndExecute({
          gl,
          callback: (webGLTexture: WebGLTexture) => {
            const level: GLint = 0;
            gl.framebufferTexture2D(
              FRAMEBUFFER_CONFIG.target,
              attachment,
              floatingPointTexture.target,
              webGLTexture,
              level,
            );
          },
        });
      },
    });
    const framebufferStatus: GLenum = gl.checkFramebufferStatus(
      FRAMEBUFFER_CONFIG.target,
    );
    if (gl.FRAMEBUFFER_COMPLETE !== framebufferStatus) {
      throw new Error(
        `Failed to create a framebuffer: ${framebufferStatus.toString()}`,
      );
    }
    this._floatingPointTexture = floatingPointTexture;
  }

  public getTextureData({
    gl,
    width,
    height,
  }: {
    gl: WebGL2RenderingContext;
    width: number;
    height: number;
  }): Float32Array {
    const floatingPointTexture: FloatingPointTexture | null =
      this._floatingPointTexture;
    if (null === floatingPointTexture) {
      throw new Error("Floating-point texture is not attached");
    }
    return this.bindAndExecute<Float32Array>({
      gl,
      callback: () => {
        gl.viewport(0, 0, width, height);
        const pixels = new Float32Array(width * height);
        gl.readPixels(
          0,
          0,
          width,
          height,
          floatingPointTexture.format,
          gl.FLOAT,
          pixels,
        );
        return pixels;
      },
    });
  }
}
