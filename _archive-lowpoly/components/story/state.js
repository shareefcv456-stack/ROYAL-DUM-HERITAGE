// Shared scroll state: written by GSAP ScrollTrigger, read every frame by the 3D scene.
// Mutable on purpose so scrolling never triggers React renders.
// t: 0 = prologue, 1–4 = chapters I–IV, 5 = end of the story, 6 = menu.
export const story = { t: 0, footage: false };
