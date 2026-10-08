// Photographic plates and the edit that cuts between them. No three.js here, so the GPU-less path stays tiny.
//
// Plate-space coordinates run 0–1, x from the left, y from the bottom.
//   focus   x to keep in frame when a narrow screen crops the sides
//   steam   [x, y, width, strength]  where steam rises from
//   fire    [x, y, radius, strength] embers, heat shimmer and flicker
//   glisten 0–1 cursor-light reflections on fat, oil, ghee and water
//   sticker [x, y, radius]           where the brand seal is stamped (radius in widths)
//   dust    0–1 floating spice dust / bokeh      spices 0–1 floating real spices (cardamom, saffron…)
//   video   optional live-action loop of the same framing (e.g. "/plates/stove.mp4"); replaces the still once it plays
//   name    null = ambient: no photo, just the live charcoal/steam/ember layer behind the lower sections
export const PLATES = [
  // Opening: the kitchen before dawn.
  { name: "stove", alt: "Kitchen helpers stoking a firewood brick stove under three copper handis", focus: 0.6, steam: [0.86, 0.62, 0.18, 0.6], fire: [0.71, 0.24, 0.05, 1], glisten: 0.2, dust: 0.5, spices: 0.3, video: null },
  { name: "washing", alt: "Hands washing Kaima rice in a hammered copper vessel, water splashing", focus: 0.68, steam: [0, 0, 0, 0], fire: [0, 0, 0, 0], glisten: 1, dust: 0.35, spices: 0.3, video: null },
  { name: "prep", alt: "Kitchen helpers slicing shallots and tearing herbs at a long wooden table", focus: 0.7, steam: [0.31, 0.57, 0.05, 0.5], fire: [0.32, 0.43, 0.02, 0.6], glisten: 0.3, dust: 0.4, spices: 0.4, video: null },
  // The story.
  { name: "butcher", alt: "Raw bone-in mutton and chicken on a butcher's block with whole spices", focus: 0.68, steam: [0, 0, 0, 0], fire: [0, 0, 0, 0], glisten: 1, dust: 1, saffron: 1, spices: 1 },
  { name: "chef", alt: "Chef pouring ghee over layered rice in a copper handi over firewood", focus: 0.5, steam: [0.48, 0.34, 0.1, 0.6], fire: [0.52, 0.09, 0.1, 1], glisten: 0.15, dust: 0.5, spices: 0.25, video: null },
  { name: "sealed", alt: "Copper handi sealed with a ring of wheat dough over glowing embers", focus: 0.7, steam: [0.71, 0.72, 0.24, 0.45], fire: [0.62, 0.08, 0.2, 1], glisten: 0.3, dust: 0.5, spices: 0.25 },
  { name: "feast", alt: "Malabar dum biriyani on a banana leaf with fried onions, cashews and a boiled egg", focus: 0.68, steam: [0.68, 0.6, 0.2, 0.6], fire: [0, 0, 0, 0], glisten: 1, dust: 0.45, saffron: 0.2, spices: 0.4 },
  { name: "packing", alt: "Chef packing biriyani into black fibre containers sealed with a gold sticker", focus: 0.62, steam: [0.66, 0.45, 0.1, 0.45], fire: [0, 0, 0, 0], glisten: 0.3, sticker: [0.42, 0.206, 0.031], dust: 0.3, spices: 0.25 },
  // Behind Spice Vault, Menu and the footer.
  { name: null, alt: "", focus: 0.5, steam: [0.84, 0.02, 0.22, 0.25], fire: [0.5, -0.06, 0.3, 0.35], glisten: 0, dust: 0.55, saffron: 0.3, spices: 0.7 },
];

// Story time t, one unit per scroll section:
//   0–3 opening (three kitchen shots) · 3–4 hero · 4–9 chapters 01–05 · 9–10 delivery · 10–11 lower sections.
export const OPENING = 3;
export const FIRST_CHAPTER = OPENING + 1;
export const SECTIONS = FIRST_CHAPTER + 5; // sections inside #story

// Each cut: [from plate, to plate, starts at t, ends at t].
const CUTS = [
  [0, 1, 0.8, 1.0],
  [1, 2, 1.8, 2.0],
  [2, 3, 2.75, 3.0], // into the hero
  [3, 4, 4.85, 5.05], // hero and chapter 01 share the butcher's block
  [4, 5, 5.85, 6.05],
  [5, 6, 6.9, 7.08],
  [6, 7, 7.9, 8.08],
  [7, 8, 9.7, 10.02], // packing holds through delivery, then fades to the ambient layer as the Spice Vault arrives
];
const END = 11;

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
  return { a, b, mix, lifeA: life(a), lifeB: life(b) };
}

// Steam burst as the dough seal gives way, mid-chapter 03.
const SEAL = FIRST_CHAPTER + 2;
export const burst = (t) => smooth((t - SEAL - 0.45) / 0.12) * (1 - smooth((t - SEAL - 0.7) / 0.25));
