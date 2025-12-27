import { clamp } from "./time";

export function makeCanvas(w: number, h: number): HTMLCanvasElement {
  const c = document.createElement("canvas");
  c.width = w;
  c.height = h;
  return c;
}

export function canvasToDataUrl(c: HTMLCanvasElement): string {
  return c.toDataURL("image/png");
}

export function drawNoise(ctx: CanvasRenderingContext2D, amount: number, rng: () => number) {
  if (amount <= 0) return;
  const { width, height } = ctx.canvas;
  const img = ctx.getImageData(0, 0, width, height);
  const d = img.data;
  const a = clamp(amount, 0, 1);
  const amp = 40 * a;
  for (let i = 0; i < d.length; i += 4) {
    const n = (rng() - 0.5) * amp;
    d[i] = clamp(d[i] + n, 0, 255);
    d[i + 1] = clamp(d[i + 1] + n, 0, 255);
    d[i + 2] = clamp(d[i + 2] + n, 0, 255);
  }
  ctx.putImageData(img, 0, 0);
}

export function applySimpleFisheyeApprox(ctx: CanvasRenderingContext2D, strength: number) {
  // Lightweight “fisheye-ish” vignette and radial scale approximation.
  // (True lens warping is expensive; this is a visual proxy.)
  const { width: w, height: h } = ctx.canvas;
  const cx = w / 2;
  const cy = h / 2;
  const maxR = Math.sqrt(cx * cx + cy * cy);
  const g = ctx.createRadialGradient(cx, cy, maxR * 0.2, cx, cy, maxR);
  const s = clamp(strength, 0, 1);
  g.addColorStop(0, `rgba(0,0,0,0)`);
  g.addColorStop(1, `rgba(0,0,0,${0.25 * s})`);
  ctx.save();
  ctx.fillStyle = g;
  ctx.fillRect(0, 0, w, h);
  ctx.restore();
}

export function cropCanvas(src: HTMLCanvasElement, x: number, y: number, w: number, h: number): HTMLCanvasElement {
  const c = makeCanvas(Math.max(1, Math.floor(w)), Math.max(1, Math.floor(h)));
  const ctx = c.getContext("2d")!;
  ctx.drawImage(src, x, y, w, h, 0, 0, c.width, c.height);
  return c;
}
