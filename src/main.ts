import { Canvas } from "./canvas";
import { FloatingPointTexture } from "./webgl/floatingPointTexture";
import { Simulator } from "./simulator";
import { Visualizer } from "./visualizer";
import { Timer } from "./timer";

function render(
  canvas: Canvas,
  gl: WebGL2RenderingContext,
  lx: number,
  ly: number,
  width: number,
  height: number,
  simulator: Simulator,
  visualizer: Visualizer,
  timer: Timer,
) {
  const drawFrequency = 0.025;
  let time = 0;
  for (;;) {
    const dt: number = simulator.update({ gl, width, height });
    time += dt;
    if (drawFrequency < time) {
      break;
    }
  }
  const temp: FloatingPointTexture = simulator.getCurrentTemp();
  visualizer.draw({ canvas, gl, floatingPointTexture: temp });
  timer.update();
  requestAnimationFrame(() => {
    render(canvas, gl, lx, ly, width, height, simulator, visualizer, timer);
  });
}

function main(
  canvas: Canvas,
  ra: number,
  pr: number,
  lx: number,
  ly: number,
  width: number,
  height: number,
) {
  const gl: WebGL2RenderingContext = canvas.getContext();
  const ux: Float32Array = (function () {
    const ux = new Float32Array(width * height);
    for (let j = 0; j < height; j++) {
      for (let i = 0; i < width; i++) {
        ux[j * width + i] = 0;
      }
    }
    return ux;
  })();
  const uy: Float32Array = (function () {
    const uy = new Float32Array(width * height);
    for (let j = 0; j < height; j++) {
      for (let i = 0; i < width; i++) {
        uy[j * width + i] = 0;
      }
    }
    return uy;
  })();
  const temp: Float32Array = (function () {
    const temp = new Float32Array(width * height);
    for (let j = 0; j < height; j++) {
      for (let i = 0; i < width; i++) {
        temp[j * width + i] = Math.random();
      }
    }
    return temp;
  })();
  const simulator = new Simulator({
    ra,
    pr,
    lx,
    ly,
    width,
    height,
    gl,
    uxData: ux,
    uyData: uy,
    tempData: temp,
  });
  const visualizer = new Visualizer({
    gl,
    width,
    height,
  });
  const isReadPixelsR32FAvailable: boolean =
    canvas.checkIfReadPixelsR32FAvailable({ gl });
  const timer = new Timer(1000, () => {
    if (import.meta.env.DEV && isReadPixelsR32FAvailable) {
      const maxDiv = simulator.checkDivergence({ gl, lx, ly, width, height });
      console.log(`Maximum divergence: ${maxDiv.toExponential(1)}`);
    }
  });
  window.addEventListener("resize", (): void => {
    visualizer.handleResizeEvent({ canvas, gl, lx, ly });
  });
  timer.start();
  visualizer.handleResizeEvent({ canvas, gl, lx, ly });
  render(canvas, gl, lx, ly, width, height, simulator, visualizer, timer);
}

window.addEventListener("load", (): void => {
  const canvas = new Canvas({ id: "canvas" });
  canvas.syncSize();
  const {
    width: canvasWidth,
    height: canvasHeight,
  }: { width: number; height: number } = canvas.getSize();
  const canvasAspectRatio = canvasWidth / canvasHeight;
  const ra = 5e6;
  const pr = 4;
  const lx = 1;
  const ly = canvasAspectRatio;
  const nGrids = 1 << 14;
  const width = 4 * Math.floor(Math.sqrt(nGrids / canvasAspectRatio) / 4);
  const height = 4 * Math.floor((width * canvasAspectRatio) / 4);
  console.log(`Width: ${width.toString()}, Height: ${height.toString()}`);
  main(canvas, ra, pr, lx, ly, width, height);
});
