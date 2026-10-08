// Pre-rendered fallback: frames recorded from the real 3D scene by scripts/capture-frames.mjs.
export const FRAMES = 120;
export const frameUrl = (i) => `/frames/f${String(i).padStart(3, "0")}.webp`;
