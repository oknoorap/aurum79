import { createCanvas as $createCanvas, Canvas } from "canvas";

export const createCanvas = (
  width: number = 800,
  height: number = 800
): [Canvas, Record<string, unknown>] => {
  const canvas = $createCanvas(width, height);
  return [canvas, { width, height }];
};

export const clearCanvas = (canvas: Canvas, w: number, h: number) => {
  const ctx = canvas.getContext("2d");
  ctx.clearRect(0, 0, w, h);
  return ctx;
};
