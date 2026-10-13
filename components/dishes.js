// The biriyanis on the menu, as plain data (no React), so server code (the product pages, app/products/[slug]) and
// the client store (cart.js, which re-exports them) read the same list. Part of the SAMPLE menu (cart.js).
// theme is presentation only (the hero, Intro.jsx): a light background tint per dish and the colour of the ring round
// it, which both cross-fade as the flavour changes (saffron, maroon-rose, rust, herb green, coral).
export const DISHES = [
  {
    id: "chicken", theme: { tint: "#fde9cf", ring: "#e07a26" }, name: "Chicken", full: "Chicken Dum Biriyani", price: 349,
    note: "Bone-in chicken in a yoghurt, green chilli and ginger masala, layered under Kaima rice.",
    layers: ["Chicken, masala", "Kaima rice, ghee & saffron", "Cardamom, clove, cinnamon, star anise", "Fried shallots, cashews, raisins"],
    heat: 2, serves: "Serves 1–2", weight: "650 g", meat: "Marinated chicken", available: true,
  },
  {
    id: "mutton", theme: { tint: "#f9dfe0", ring: "#b3343f" }, name: "Mutton", full: "Mutton Dum Biriyani", price: 449,
    note: "Bone-in mutton in a peppery masala, slow-cooked under the rice.",
    layers: ["Bone-in mutton, pepper masala", "Kaima rice, ghee & saffron", "Cinnamon, clove, black cardamom", "Fried shallots, mint, cashews"],
    heat: 3, serves: "Serves 1–2", weight: "650 g", meat: "Bone-in mutton", available: true,
  },
  {
    id: "beef", theme: { tint: "#fbe2d2", ring: "#c4491e" }, name: "Beef", full: "Beef Dum Biriyani", price: 399,
    note: "Beef braised with green chilli, ginger and curry leaf.",
    layers: ["Beef, green chilli & ginger masala", "Kaima rice, ghee", "Fennel, clove, cardamom, curry leaf", "Fried shallots, green chilli"],
    heat: 3, serves: "Serves 1–2", weight: "650 g", meat: "Beef", available: true,
  },
  {
    id: "fish", theme: { tint: "#e7efdc", ring: "#5f8f45" }, name: "Fish", full: "Fish (Neymeen) Dum Biriyani", price: 529,
    note: "Seer fish in red chilli and kokum, pan-seared, then laid on the rice.",
    layers: ["Seer fish, red chilli & kokum", "Kaima rice, ghee & saffron", "Fennel, pepper, curry leaf", "Fried shallots, lime"],
    heat: 3, serves: "Serves 1–2", weight: "600 g", meat: "Seer fish", available: true,
  },
  {
    id: "prawn", theme: { tint: "#fde3d6", ring: "#e4572e" }, name: "Prawn", full: "Prawn (Chemmeen) Dum Biriyani", price: 499,
    note: "Prawns in coconut, curry leaf and black pepper.",
    layers: ["Prawns, coconut & pepper masala", "Kaima rice, ghee & saffron", "Curry leaf, clove, cardamom", "Fried shallots, coconut slivers"],
    heat: 2, serves: "Serves 1–2", weight: "600 g", meat: "Tiger prawns", available: true,
  },
];

// Each dish's page address, from its full name: "Fish (Neymeen) Dum Biriyani" → "fish-neymeen-dum-biriyani".
export const slugOf = (x) => x.full.toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/^-|-$/g, "");
export const bySlug = (slug) => DISHES.find((x) => slugOf(x) === slug);
