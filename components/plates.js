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
//   cam     [dollyX, dollyY, focusFrom, focusTo, blur]  scroll-driven camera move through the shot (depth 0 far – 1 near)
//   push    0–1 how far the shot pushes in while on screen (default 0.1)
//   pan     [fromX, toX] the framing travels across the shot while on screen (replaces focus)
//   heart   [x, y] the shot's focal point: where split ingredients burst from and converge into (the uruli, the plate…)
//   name    null = ambient: no photo, just the live charcoal/steam/ember layer
//   still   for an ambient plate, the photo to show instead when there is no GPU
export const PLATES = [
  // Opening: the ten-shot cold open, dawn to dum seal (captions in Story.jsx OPENING_SHOTS).
  { name: "doors", alt: "Carved teak kitchen doors cracking open on morning mist and red Malabar soil", focus: 0.55, steam: [0.6, 0.35, 0.3, 0.35], fire: [0, 0, 0, 0], glisten: 0.1, dust: 0.8, spices: 0, cam: [0.6, 0.2, 0.7, 0.55, 0.004], push: 0.18 },
  { name: "stove", alt: "Kitchen helpers stoking a firewood brick stove under three copper handis", focus: 0.6, steam: [0.86, 0.62, 0.18, 0.6], fire: [0.71, 0.24, 0.05, 1], glisten: 0.2, dust: 0.5, spices: 0.3, video: null, cam: [-0.8, 0.15, 0.75, 0.55, 0.004] },
  { name: "mortar", alt: "Green cardamom, star anise and cloves crushed in a granite mortar, spice dust in the air", focus: 0.66, steam: [0, 0, 0, 0], fire: [0, 0, 0, 0], glisten: 0.3, dust: 1, spices: 0.6, cam: [-0.5, 0.4, 0.8, 0.65, 0.006], push: 0.14 },
  { name: "saffron", alt: "Crimson saffron threads falling into warm milk in a copper bowl", focus: 0.6, steam: [0.6, 0.6, 0.12, 0.35], fire: [0, 0, 0, 0], glisten: 0.8, dust: 0.3, saffron: 1, spices: 0, cam: [0.4, -0.3, 0.85, 0.7, 0.006], push: 0.16 },
  { name: "butcher", alt: "Raw bone-in mutton and chicken on a butcher's block with whole spices", focus: 0.68, steam: [0, 0, 0, 0], fire: [0, 0, 0, 0], glisten: 1, dust: 0.6, spices: 0.4, cam: [-0.9, 0.3, 0.9, 0.6, 0.006], push: 0.14 },
  { name: "meats", alt: "Mutton chunks, beef ribs and masala-marinated chicken legs lined up under spotlights", focus: 0.66, steam: [0, 0, 0, 0], fire: [0, 0, 0, 0], glisten: 1, dust: 0.3, spices: 0.2, cam: [0, 0.2, 0.7, 0.75, 0.004], push: 0.4, pan: [0.38, 0.74] }, // beef & mutton → chicken
  { name: "rice", alt: "A cascade of short-grain Kaima rice pouring into a copper vessel", focus: 0.7, steam: [0, 0, 0, 0], fire: [0, 0, 0, 0], glisten: 0.5, dust: 0.6, spices: 0, cam: [0, 0.8, 0.7, 0.8, 0.005], push: 0.14 },
  { name: "ghee", alt: "Amber ghee splashing in a crown on hot metal", focus: 0.62, steam: [0.62, 0.3, 0.15, 0.5], fire: [0.62, 0.05, 0.2, 0.4], glisten: 1, dust: 0.3, spices: 0, cam: [0.5, 0.3, 0.75, 0.68, 0.006], push: 0.16 },
  { name: "shallots", alt: "Golden fried shallots, cashews and raisins scattering onto dark stone", focus: 0.72, steam: [0, 0, 0, 0], fire: [0, 0, 0, 0], glisten: 0.7, dust: 0.5, spices: 0.3, cam: [-0.6, -0.4, 0.8, 0.7, 0.006], push: 0.14 },
  { name: "sealed", alt: "Copper handi sealed with a ring of wheat dough over glowing embers", focus: 0.7, steam: [0.71, 0.72, 0.24, 0.45], fire: [0.62, 0.08, 0.2, 1], glisten: 0.3, dust: 0.5, spices: 0.25, cam: [0, 0.9, 0.72, 0.72, 0.004], push: 0.12 },
  // The Biriyani Cosmos: near-black stage for the orbiting ingredients (drawn by Stage.jsx).
  { name: null, still: "pot-sealed", alt: "Malabar chicken biriyani assembled layer by layer in a copper handi, then sealed with dough", focus: 0.5, steam: [0, 0, 0, 0], fire: [0.5, -0.08, 0.35, 0.25], glisten: 0, dust: 0.5, spices: 0 },
  // Hero: the grand reveal, where the assembly lands: served on a banana leaf beside the opened handi.
  { name: "reveal", alt: "Malabar chicken dum biriyani on a banana leaf beside the opened, steaming copper handi", focus: 0.66, steam: [0.51, 0.62, 0.12, 0.9], fire: [0, 0, 0, 0], glisten: 1, dust: 0.5, spices: 0.3, cam: [0.4, 0.3, 0.72, 0.62, 0.004], heart: [0.505, 0.5] },


  // The story.
  { name: "butcher", alt: "Raw bone-in mutton and chicken on a butcher's block with whole spices", focus: 0.68, steam: [0, 0, 0, 0], fire: [0, 0, 0, 0], glisten: 1, dust: 1, saffron: 1, spices: 1, cam: [-0.9, 0.3, 0.9, 0.6, 0.006], push: 0.14, heart: [0.6, 0.45] },
  { name: "chef", alt: "Chef pouring ghee over layered rice in a copper handi over firewood", focus: 0.5, steam: [0.48, 0.34, 0.1, 0.6], fire: [0.52, 0.09, 0.1, 1], glisten: 0.15, dust: 0.5, spices: 0.25, video: null, cam: [0.6, 0.2, 0.65, 0.78, 0.004], heart: [0.48, 0.3] },
  { name: "sealed", alt: "Copper handi sealed with a ring of wheat dough over glowing embers", focus: 0.7, steam: [0.71, 0.72, 0.24, 0.45], fire: [0.62, 0.08, 0.2, 1], glisten: 0.3, dust: 0.5, spices: 0.25, cam: [0, 0.9, 0.72, 0.72, 0.004], push: 0.12, heart: [0.66, 0.6] },
  { name: "feast", alt: "Malabar dum biriyani on a banana leaf with fried onions, cashews and a boiled egg", focus: 0.68, steam: [0.68, 0.6, 0.2, 0.6], fire: [0, 0, 0, 0], glisten: 1, dust: 0.45, saffron: 0.2, spices: 0.4, cam: [-0.7, -0.25, 0.9, 0.72, 0.006], push: 0.14, heart: [0.65, 0.5] },
  { name: "packing", alt: "Chef packing biriyani into black fibre containers sealed with a gold sticker", focus: 0.62, steam: [0.66, 0.45, 0.1, 0.45], fire: [0, 0, 0, 0], glisten: 0.3, sticker: [0.42, 0.206, 0.031], dust: 0.3, spices: 0.25, cam: [0.8, 0, 0.6, 0.78, 0.004], heart: [0.6, 0.26] },
  // Behind Spice Vault, Menu and the footer.
  // The Biriyani Cosmos climax: a near-black void for the orbiting ingredients (drawn by Climax() in Stage.jsx).
  { name: null, still: "plated", alt: "Every ingredient orbiting a copper uruli, converging, and the plated Malabar dum biriyani rising from the steam", focus: 0.5, steam: [0, 0, 0, 0], fire: [0.5, -0.1, 0.3, 0.15], glisten: 0, dust: 0.25, spices: 0 },
  // The grand finale: the opened, steaming handi and the plated biriyani under warm light, gold title over it (Story.jsx).
  { name: "table", alt: "Malabar chicken dum biriyani on a banana leaf with raita, chammanthi, a steaming copper handi and brass lanterns", focus: 0.68, steam: [0.6, 0.62, 0.14, 1.2], fire: [0, 0, 0, 0], glisten: 1, dust: 0.9, saffron: 0.3, spices: 0.35, cam: [0.3, 0.5, 0.7, 0.62, 0.004], push: 0.16, heart: [0.66, 0.4] },
  // The dining shot: a silver spoon lifts a steaming scoop, under the same title and CTAs.
  { name: "spoon", alt: "A silver spoon lifting a steaming scoop of chicken dum biriyani from a banana leaf", focus: 0.7, steam: [0.6, 0.72, 0.1, 1.3], fire: [0, 0, 0, 0], glisten: 1, dust: 0.6, saffron: 0.2, spices: 0.2, cam: [-0.4, 0.4, 0.8, 0.7, 0.006], push: 0.18, heart: [0.66, 0.55] },
  { name: null, alt: "", focus: 0.5, steam: [0.84, 0.02, 0.22, 0.25], fire: [0.5, -0.06, 0.3, 0.35], glisten: 0, dust: 0.55, saffron: 0.3, spices: 0.7 },
];

// Story time t, one unit per scroll section:
//   0–10 ten-shot opening · 10–11 taskflow · 11–12 hero · 12–17 chapters 01–05 · 17–18 delivery · 18–19 Spice Vault
//   · 19–20 Biriyani Cosmos climax · 20–21 grand finale (table, then the spoon) · 21–22 Menu.
export const OPENING = 10;
export const COSMOS = OPENING;
export const FIRST_CHAPTER = COSMOS + 2;
export const SECTIONS = FIRST_CHAPTER + 5; // sections inside #story

// Each cut: [from plate, to plate, starts at t, ends at t, style, ingredients].
//   style 0 liquid morph · 1 split: the outgoing shot tears down the middle and its halves fly to the margins
//   · 2 converge: the incoming shot's halves sweep in from the margins and close over the old one.
//   ingredients: atlas cells (see Stage.jsx) that burst out, orbit and reassemble during the cut.
export const CUTS = [
  // The opening: a quick liquid morph at the end of each shot, then the seal gives into the cosmos.
  ...Array.from({ length: OPENING - 1 }, (_, i) => [i, i + 1, i + 0.8, i + 1]),
  [OPENING - 1, OPENING, OPENING - 0.28, OPENING], // the dum seal, a flash of steam, into the cosmos
  [10, 11, 10.78, 10.98], // the sealed handi glides into place → the banana-leaf reveal
  [11, 12, 11.72, 12.1, 1, [0, 1, 2, 3, 10, 12, 13, 11]], // hero → butcher's block: raw meat and whole spices
  [12, 13, 12.72, 13.1, 2, [0, 1, 4, 5, 6, 7, 8, 10]], // → firewood kitchen: meat, rice, ghee, onion into the handi
  [13, 14, 13.74, 14.1, 1, [4, 5, 6, 7, 11, 10]], // → dum seal: rice, ghee, saffron
  [14, 15, 14.76, 15.12, 2, [4, 5, 8, 9, 11, 6, 0]], // → grand feast: garnish lands on the rice
  [15, 16, 15.76, 16.12, 1, [4, 5, 8, 9, 2, 10]], // → packaging
  [16, 17, 18.86, 19.06], // packing holds through delivery and the Spice Vault, then falls away into the void
  [17, 18, 19.64, 19.88], // the plated biriyani rising from the steam pours into the grand finale
  [18, 19, 20.28, 20.46], // the table → the spoon scooping in
  [19, 20, 20.88, 21.1], // after the finale, the ambient layer behind the Menu
];
const END = OPENING + 12;
export const CLIMAX = SECTIONS + 2; // story time of the Biriyani Cosmos climax
export const FINALE = CLIMAX + 1;

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

// The ingredient flight around a split/converge cut, which starts a little before the photo moves and lands after it.
const LEAD = 0.22;
export function transit(t) {
  for (const c of CUTS) {
    if (!c[4] || t < c[2] - LEAD || t > c[3] + LEAD) continue;
    return { from: c[0], to: c[1], u: (t - c[2] + LEAD) / (c[3] - c[2] + 2 * LEAD), cells: c[5] };
  }
  return null;
}

// Steam burst as the dough seal gives way: once at the end of the opening (the gateway into the cosmos), once mid-chapter 03.
const SEAL = FIRST_CHAPTER + 2;
const puff = (t, at) => smooth((t - at) / 0.12) * (1 - smooth((t - at - 0.25) / 0.25));
export const burst = (t) => Math.max(puff(t, OPENING - 0.4), puff(t, SEAL + 0.45));
