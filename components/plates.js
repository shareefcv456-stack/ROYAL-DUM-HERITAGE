// Photographic plates and the edit that cuts between them. No three.js here, so the GPU-less path stays tiny.
//
// Plate-space coordinates run 0–1, x from the left, y from the bottom.
//   focus   x to keep in frame when a narrow screen crops the sides (focusTall: on portrait screens, if different)
//   steam   [x, y, width, strength]  where steam rises from
//   fire    [x, y, radius, strength] embers, heat shimmer and flicker
//   glisten 0–1 cursor-light reflections on fat, oil, ghee and water
//   sticker [x, y, radius]           where the brand seal is stamped (radius in widths)
//   dust    0–1 floating spice dust / bokeh      spices 0–1 floating real spices (cardamom, saffron…)
//   spiceSides  keep the floating spices in the outer side bands (a shot with copy over it)
//   video   optional live-action loop of the same framing (e.g. "/plates/stove.mp4"); replaces the still once it plays
//   cam     [dollyX, dollyY, focusFrom, focusTo, blur]  scroll-driven camera move through the shot (depth 0 far – 1 near)
//   push    0–1 how far the shot pushes in while on screen (default 0.1)
//   pan     [fromX, toX] the framing travels across the shot while on screen (replaces focus)
//   heart   [x, y] the shot's focal point: where split ingredients burst from and converge into (the uruli, the plate…)
//   name    null = ambient: no photo, just the live charcoal/steam/ember layer
//   still   for an ambient plate, the photo to show instead when there is no GPU
//   flat    no depth parallax (where the bright-is-near depth guess is wrong, e.g. a dark pot before a lit wall)
export const PLATES = [
  // Scene 1, the dum: a black handi over firewood in a lamplit courtyard (art-src/hearth.py), pot right of centre.
  { name: "hearth", flat: true, alt: "A black handi steaming over firewood embers in a lamplit Kerala heritage courtyard, carved pillar and brass vessels beside it", focus: 0.5, focusTall: 0.6, steam: [0.63, 0.57, 0.06, 0.65], fire: [0.6, 0.17, 0.045, 1], glisten: 0.3, dust: 0.3, spices: 0.6, spiceSides: true, cam: [0, 0.25, 0.5, 0.5, 0.0005], push: 0.06, heart: [0.6, 0.4] },
  // Scene 2, the layers: near-black stage where every layer erupts from the margins and spirals into the handi,
  // which is then sealed (drawn by Cosmos() in Stage.jsx; the still is the GPU-less stand-in).
  { name: null, still: "pot-sealed", alt: "Malabar dum biriyani assembled layer by layer in a copper handi, then sealed with dough", focus: 0.5, steam: [0, 0, 0, 0], fire: [0.5, -0.08, 0.35, 0.25], glisten: 0, dust: 0.5, spices: 0 },
  // Scene 3, the reveal: the opened handi and the selected biriyani; the camera pushes in.
  { name: "reveal", flavored: true, alt: "The opened handi steaming beside Malabar dum biriyani on a banana leaf", focus: 0.66, focusTall: 0.72, steam: [0.51, 0.62, 0.12, 1], fire: [0, 0, 0, 0], glisten: 1, dust: 0.4, spices: 0.4, spiceSides: true, cam: [0.4, 0.3, 0.72, 0.62, 0.004], push: 0.22, heart: [0.66, 0.5] },
  // Scene 4, pack and seal: biriyani spooned into a takeaway pack beside one already sealed (the RD seal is stamped on it).
  { name: "packing", alt: "A cook spooning biriyani into an open takeaway pack beside a closed pack with a gold seal", focus: 0.62, focusTall: 0.62, steam: [0.66, 0.45, 0.1, 0.45], fire: [0, 0, 0, 0], glisten: 0.3, sticker: [0.42, 0.206, 0.031], dust: 0.3, spices: 0.3, spiceSides: true, cam: [0.8, 0, 0.6, 0.78, 0.004], push: 0.12, heart: [0.6, 0.26] },
];

// The photo for a plate: `flavored` plates have a variant per biriyani (reveal-fish.jpg …, made by
// art-src/flavor-plates.py from the shop photos); chicken is the original.
export const plateSrc = (p, flavor) => {
  const n = p.name || p.still;
  return n && p.flavored && flavor !== "chicken" ? `${n}-${flavor}` : n;
};

// Story time t, one unit per scene in #story: 0–1 the dum · 1–2 the layers · 2–3 the reveal · 3–4 pack and seal.
export const COSMOS = 1; // the layers scene (Cosmos() in Stage.jsx keys its own timeline off this)
// Each cut: [from plate, to plate, starts at t, ends at t, style] (style 0 liquid morph · 1 split · 2 converge).
export const CUTS = [
  [0, 1, 0.55, 0.95], // the hearth sinks into the dark stage as the empty handi rises
  [1, 2, 1.78, 1.98], // the sealed handi glides into place and the lid is off: the reveal
  [2, 3, 2.62, 2.95], // from the handi to the pack
];
const END = 4;

const smooth = (x) => (x <= 0 ? 0 : x >= 1 ? 1 : x * x * (3 - 2 * x));

// Which plates are on screen at story time t, how far the cut between them has gone, and how far
// through its own screen time each plate is (drives the slow push-in).
export function shot(t) {
  let i = 0;
  while (i < CUTS.length && t >= CUTS[i][3]) i++;
  const cut = CUTS[i];
  const a = cut ? cut[0] : PLATES.length - 1;
  const b = cut ? cut[1] : a;
  const mix = cut ? smooth((t - cut[2]) / (cut[3] - cut[2])) : 0;
  const life = (p) => {
    const start = p === 0 ? 0 : CUTS[p - 1][2];
    const end = p < CUTS.length ? CUTS[p][3] : END;
    return Math.min(Math.max((t - start) / (end - start), 0), 1);
  };
  return { a, b, mix, lifeA: life(a), lifeB: life(b), style: cut?.[4] ?? 0 };
}

// Steam bursts as the dough seal goes on (PH.seal in Stage.jsx) and again as the lid comes off.
const puff = (t, at) => smooth((t - at) / 0.12) * (1 - smooth((t - at - 0.25) / 0.25));
export const burst = (t) => Math.max(puff(t, COSMOS + 0.66), puff(t, COSMOS + 0.95));
