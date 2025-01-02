export type FloatingPointTextureType = "SINGLE_CHANNEL" | "FOUR_CHANNELS";

export class FloatingPointTexture {
  private _webGLTexture: WebGLTexture;
  private _floatingPointTextureType: FloatingPointTextureType;

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
    const webGLTexture: WebGLTexture = gl.createTexture();
    this._webGLTexture = webGLTexture;
    this._floatingPointTextureType = floatingPointTextureType;
    this.bindAndExecute({
      gl,
      callback: () => {
        const levels: GLint = 1;
        gl.texStorage2D(
          this.target,
          levels,
          this.internalFormat,
          width,
          height,
        );
        gl.texParameteri(this.target, gl.TEXTURE_MAG_FILTER, gl.NEAREST);
        gl.texParameteri(this.target, gl.TEXTURE_MIN_FILTER, gl.NEAREST);
      },
    });
  }

  public bindAndExecute({
    gl,
    callback,
  }: {
    gl: WebGL2RenderingContext;
    callback: (webGLTexture: WebGLTexture) => void;
  }) {
    const webGLTexture: WebGLTexture = this._webGLTexture;
    gl.bindTexture(this.target, webGLTexture);
    callback(webGLTexture);
    gl.bindTexture(this.target, null);
  }

  public get target(): GLenum {
    return WebGL2RenderingContext.TEXTURE_2D;
  }

  public get internalFormat(): GLenum {
    const floatingPointTextureType: FloatingPointTextureType =
      this._floatingPointTextureType;
    if ("FOUR_CHANNELS" === floatingPointTextureType) {
      return WebGL2RenderingContext.RGBA32F;
    } else {
      return WebGL2RenderingContext.R32F;
    }
  }

  public get format(): GLenum {
    const floatingPointTextureType: FloatingPointTextureType =
      this._floatingPointTextureType;
    if ("FOUR_CHANNELS" === floatingPointTextureType) {
      return WebGL2RenderingContext.RGBA;
    } else {
      return WebGL2RenderingContext.RED;
    }
  }

  public get type(): GLenum {
    return WebGL2RenderingContext.FLOAT;
  }
}
