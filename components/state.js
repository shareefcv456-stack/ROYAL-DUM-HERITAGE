// Shared scroll state: written by GSAP ScrollTrigger, read every frame by the WebGL stage.
// Mutable on purpose so scrolling never triggers React renders.
// t: story time (see plates.js) · v: scroll velocity in px/s · vt: when v was measured (ms).
export const story = { t: 0, v: 0, vt: 0 };
