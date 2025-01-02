export class Canvas {
  private _element: HTMLCanvasElement;

  public constructor({ id }: { id: string }) {
    const element: HTMLElement | null = document.getElementById(id);
    if (null === element) {
      throw new Error(`Element "${id}" is not found`);
    }
    this._element = element as HTMLCanvasElement;
  }

  public getContext(): WebGL2RenderingContext {
    const element: HTMLCanvasElement = this._element;
    const gl: WebGL2RenderingContext | null = element.getContext("webgl2", {
      preserveDrawingBuffer: false,
    });
    if (null === gl) {
      throw new Error("Failed to fetch WebGL2 context");
    }
    if (!gl.getExtension("EXT_color_buffer_float")) {
      throw new Error("FLOAT color buffer is not supported");
    }
    return gl;
  }

  public syncSize() {
    const element: HTMLCanvasElement = this._element;
    const rect: DOMRect = element.getBoundingClientRect();
    const width: number = rect.width;
    const height: number = rect.height;
    element.width = width;
    element.height = height;
  }

  public getSize(): { width: number; height: number } {
    const element: HTMLCanvasElement = this._element;
    return {
      width: element.width,
      height: element.height,
    };
  }

  public checkIfReadPixelsR32FAvailable({
    gl,
  }: {
    gl: WebGL2RenderingContext;
  }): boolean {
    const texture = gl.createTexture();
    gl.bindTexture(gl.TEXTURE_2D, texture);
    gl.texImage2D(gl.TEXTURE_2D, 0, gl.R32F, 1, 1, 0, gl.RED, gl.FLOAT, null);
    const framebuffer = gl.createFramebuffer();
    gl.bindFramebuffer(gl.FRAMEBUFFER, framebuffer);
    gl.framebufferTexture2D(
      gl.FRAMEBUFFER,
      gl.COLOR_ATTACHMENT0,
      gl.TEXTURE_2D,
      texture,
      0,
    );
    gl.viewport(0, 0, 1, 1);
    const pixels = new Float32Array(1);
    gl.readPixels(0, 0, 1, 1, gl.RED, gl.FLOAT, pixels);
    const isAvailable = gl.getError() === gl.NO_ERROR;
    // Cleanup code
    gl.deleteFramebuffer(framebuffer);
    gl.deleteTexture(texture);
    gl.bindFramebuffer(gl.FRAMEBUFFER, null);
    gl.bindTexture(gl.TEXTURE_2D, null);
    return isAvailable;
  }
}
