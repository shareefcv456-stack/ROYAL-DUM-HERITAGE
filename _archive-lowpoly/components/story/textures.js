import * as THREE from "three";
import { SimplexNoise } from "three/examples/jsm/math/SimplexNoise.js";

const simplex = new SimplexNoise();

export function fbm3(x, y, z, octaves = 4) {
  let sum = 0, amp = 0.5, f = 1;
  for (let i = 0; i < octaves; i++) {
    sum += amp * simplex.noise3d(x * f, y * f, z * f);
    amp *= 0.5;
    f *= 2;
  }
  return sum;
}

export const clamp01 = (v) => Math.min(Math.max(v, 0), 1);
export const smooth = (a, b, v) => {
  const t = clamp01((v - a) / (b - a));
  return t * t * (3 - 2 * t);
};

function toTexture(canvas, srgb) {
  const t = new THREE.CanvasTexture(canvas);
  if (srgb) t.colorSpace = THREE.SRGBColorSpace;
  t.wrapS = t.wrapT = THREE.RepeatWrapping;
  t.anisotropy = 4;
  return t;
}

// Per-pixel painter: fn(u, v) -> [r, g, b, a] in 0..255.
function pixels(w, h, fn, srgb = true) {
  const c = document.createElement("canvas");
  c.width = w;
  c.height = h;
  const g = c.getContext("2d");
  const img = g.createImageData(w, h);
  for (let y = 0; y < h; y++)
    for (let x = 0; x < w; x++) img.data.set(fn(x / w, y / h), (y * w + x) * 4);
  g.putImageData(img, 0, 0);
  return toTexture(c, srgb);
}

// Sprites are sampled with rotated coords, so repeat-wrapping would show square edges.
function clampEdges(t) {
  t.wrapS = t.wrapT = THREE.ClampToEdgeWrapping;
  return t;
}

// Hammered copper: hundreds of soft dimples, used as a bump map.
export function hammeredBump() {
  const c = document.createElement("canvas");
  c.width = c.height = 512;
  const g = c.getContext("2d");
  g.fillStyle = "#808080";
  g.fillRect(0, 0, 512, 512);
  for (let i = 0; i < 1400; i++) {
    const x = Math.random() * 512, y = Math.random() * 512, r = 5 + Math.random() * 11;
    const grad = g.createRadialGradient(x, y, 0, x, y, r);
    grad.addColorStop(0, "rgba(40,40,40,0.55)");
    grad.addColorStop(0.7, "rgba(120,120,120,0.15)");
    grad.addColorStop(1, "rgba(128,128,128,0)");
    g.fillStyle = grad;
    g.fillRect(x - r, y - r, r * 2, r * 2);
  }
  return toTexture(c, false);
}

export function woodTexture() {
  return pixels(256, 512, (u, v) => {
    const n = fbm3(u * 3, v * 14, 0.5, 4);
    const ring = 0.5 + 0.5 * Math.sin(u * 90 + n * 9);
    const k = 0.55 + ring * 0.3 + n * 0.25;
    return [62 * k + 8, 38 * k + 4, 22 * k + 2, 255];
  });
}

export function doughBump() {
  return pixels(128, 128, (u, v) => {
    const n = 128 + fbm3(u * 8, v * 8, 2, 4) * 120;
    return [n, n, n, 255];
  }, false);
}

// Soft, lumpy puff for steam particles.
export function puffTexture() {
  return clampEdges(pixels(128, 128, (u, v) => {
    const d = Math.hypot(u - 0.5, v - 0.5) * 2;
    const n = 0.55 + 0.45 * fbm3(u * 4, v * 4, 7, 4);
    const a = clamp01((1 - d) * 1.4) ** 1.6 * n;
    return [255, 255, 255, a * 255];
  }));
}

export function glowTexture() {
  return clampEdges(pixels(64, 64, (u, v) => {
    const d = Math.hypot(u - 0.5, v - 0.5) * 2;
    return [255, 255, 255, clamp01(1 - d) ** 2.2 * 255];
  }));
}
