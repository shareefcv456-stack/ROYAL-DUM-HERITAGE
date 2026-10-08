import gsap from "gsap";

export const CHAPTERS = [
  { n: "01", label: "The Cut", kicker: "01 — The Butcher's Craft", title: "Cut by hand, before dawn", body: "Shoulder and leg of young goat, cut on a tamarind-wood block into pieces that stay tender through hours of dum." },
  { n: "02", label: "The Spice", kicker: "02 — The Spice Vault", title: "Gathered from where they grow", body: "Star anise from Arunachal, green cardamom from Idukki, saffron from Pampore and clove from Kanyakumari. Move your cursor through them." },
  { n: "03", label: "The Dum", kicker: "03 — The Slow Dum", title: "Sealed in copper, over coals", body: "A ring of atta dough locks the handi. When the seal breaks, steam heavy with saffron and kewra comes out." },
  { n: "04", label: "The Royal Feast", kicker: "04 — The Grand Reveal", title: "Served from the handi", body: "Long-grain basmati, tender meat and golden fried onions, carried to the table still in the pot they were cooked in.", cta: true },
];

// Everything the 3D scene (or the frame-sequence fallback) reads each frame.
export const createStory = () => ({
  t: 0,
  camX: -0.2, camY: 1.15, camZ: 3.7, tgtX: 0.1, tgtY: 0.05, tgtZ: 0,
  meat: 0, spice: 0, pot: 0, seal: 0, steam: 0, lid: 0, feast: 0,
  velocity: 0, vel: 0,
  pointer: { x: 0, y: 0 }, ps: { x: 0, y: 0 },
  onScreen: true, forceVisible: false, compiled: false,
});

/**
 * The storyboard. One unit of timeline time = one chapter, so `t` runs 0 → 4.
 * Scrubbed by ScrollTrigger on the page; driven directly by the frame-capture script.
 * `captions[0]` is the title card, `captions[1..4]` the chapter cards.
 */
export function buildTimeline(s, captions = []) {
  const tl = gsap.timeline({ paused: true, defaults: { ease: "sine.inOut" } });
  const cam = (at, duration, [camX, camY, camZ], [tgtX, tgtY, tgtZ], ease) =>
    tl.to(s, { camX, camY, camZ, tgtX, tgtY, tgtZ, duration, ease }, at);

  tl.to(s, { t: 4, duration: 4, ease: "none" }, 0);

  // 01 The Cut: macro on the meat, slow orbit as the key light comes up.
  tl.to(s, { meat: 1, duration: 0.6 }, 0);
  cam(0, 1, [1.9, 1.6, 2.6], [0.15, 0.05, 0]);

  // 02 The Spice: dolly over the block and into the spice cloud.
  cam(1, 0.55, [0, 1.3, -8.0], [0, 1.2, -12], "power2.inOut");
  tl.to(s, { spice: 1, duration: 0.6 }, 1.15);
  cam(1.55, 0.45, [0.5, 1.45, -9.4], [0, 1.15, -12.4]);

  // 03 The Dum: the handi emerges from the dark, the seal cracks, steam escapes.
  cam(2, 0.45, [0, 3.1, -18.9], [0, 1.0, -24], "power2.inOut");
  tl.to(s, { pot: 1, duration: 0.4 }, 1.95);
  tl.to(s, { seal: 1, duration: 0.5 }, 2.4);
  tl.to(s, { steam: 1, duration: 0.35 }, 2.45);
  cam(2.45, 0.55, [2.4, 2.5, -20.4], [0, 1.35, -24]);

  // 04 The Royal Feast: the lid swings away and the camera rises over the rice.
  tl.to(s, { lid: 1, duration: 0.5 }, 3);
  cam(3, 1, [0.35, 4.3, -21.6], [0, 1.55, -24]);
  tl.to(s, { feast: 1, duration: 0.5 }, 3.4);

  captions.forEach((el, i) => {
    if (!el) return;
    if (i > 0) tl.fromTo(el, { autoAlpha: 0, y: 40 }, { autoAlpha: 1, y: 0, duration: 0.18, ease: "power2.out" }, i - 1 + (i === 1 ? 0.3 : 0.1));
    if (i < captions.length - 1) tl.to(el, { autoAlpha: 0, y: -40, duration: 0.15, ease: "power2.in" }, i === 0 ? 0.12 : i - 1 + 0.82);
  });

  return tl;
}
