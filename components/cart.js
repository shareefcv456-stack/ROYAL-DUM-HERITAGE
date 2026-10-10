"use client";
// The shop's shared state: the selected flavour (also read by the WebGL assembly, via story.flavor), the cart and the
// checkout. A tiny external store so the header, the shop, the cart drawer and the assembly stay in sync without a provider.
import { useSyncExternalStore } from "react";
import { story } from "./state.js";

// SAMPLE MENU. Every name, portion and price below is a placeholder, not business information: the shop shows a
// "demo" notice while this is true. Replace the items with the real menu, then set SAMPLE to false.
export const SAMPLE = true;

export const DISHES = [
  {
    id: "chicken", accent: "#d39a32", name: "Chicken", full: "Chicken Dum Biriyani", price: 349,
    note: "Bone-in chicken in a yoghurt, green chilli and ginger masala, layered under Kaima rice.",
    layers: ["Chicken, masala", "Kaima rice, ghee & saffron", "Cardamom, clove, cinnamon, star anise", "Fried shallots, cashews, raisins"],
    heat: 2, serves: "Serves 1–2", weight: "650 g", meat: "Marinated chicken", available: true,
  },
  {
    id: "mutton", accent: "#a0603e", name: "Mutton", full: "Mutton Dum Biriyani", price: 449,
    note: "Bone-in mutton in a peppery masala, slow-cooked under the rice.",
    layers: ["Bone-in mutton, pepper masala", "Kaima rice, ghee & saffron", "Cinnamon, clove, black cardamom", "Fried shallots, mint, cashews"],
    heat: 3, serves: "Serves 1–2", weight: "650 g", meat: "Bone-in mutton", available: true,
  },
  {
    id: "beef", accent: "#9a4433", name: "Beef", full: "Beef Dum Biriyani", price: 399,
    note: "Beef braised with green chilli, ginger and curry leaf.",
    layers: ["Beef, green chilli & ginger masala", "Kaima rice, ghee", "Fennel, clove, cardamom, curry leaf", "Fried shallots, green chilli"],
    heat: 3, serves: "Serves 1–2", weight: "650 g", meat: "Beef", available: true,
  },
  {
    id: "fish", accent: "#c8662f", name: "Fish", full: "Fish (Neymeen) Dum Biriyani", price: 529,
    note: "Seer fish in red chilli and kokum, pan-seared, then laid on the rice.",
    layers: ["Seer fish, red chilli & kokum", "Kaima rice, ghee & saffron", "Fennel, pepper, curry leaf", "Fried shallots, lime"],
    heat: 3, serves: "Serves 1–2", weight: "600 g", meat: "Seer fish", available: true,
  },
  {
    id: "prawn", accent: "#d07a52", name: "Prawn", full: "Prawn (Chemmeen) Dum Biriyani", price: 499,
    note: "Prawns in coconut, curry leaf and black pepper.",
    layers: ["Prawns, coconut & pepper masala", "Kaima rice, ghee & saffron", "Curry leaf, clove, cardamom", "Fried shallots, coconut slivers"],
    heat: 2, serves: "Serves 1–2", weight: "600 g", meat: "Tiger prawns", available: true,
  },
];
export const ADDONS = [
  { id: "raita", full: "Raita", note: "Curd with onion and cucumber.", price: 40, weight: "150 ml", available: true },
  { id: "pickle", full: "Pickle", note: "A small pot of pickle.", price: 30, weight: "50 g", available: true },
  { id: "payasam", full: "Payasam", note: "Sweet payasam to finish.", price: 90, weight: "200 ml", available: true },
];
const ITEMS = [...DISHES, ...ADDONS];
export const dish = (id) => DISHES.find((d) => d.id === id);
export const item = (id) => ITEMS.find((d) => d.id === id);
export const inr = (n) => `₹${n.toLocaleString("en-IN")}`;

// BUSINESS DETAILS. Everything here must come from the business; empty values are simply not shown.
// WHATSAPP: country code first, digits only (e.g. "919876543210"). Empty → checkout is a demo that sends nothing.
export const WHATSAPP = "";
export const PHONE = ""; // shown in the footer, e.g. "+91 98765 43210"
export const PICKUP = ""; // pickup address as it should be shown
export const HOURS = ""; // e.g. "Daily, 12 pm – 10 pm"
// Delivery areas as 6-digit PIN codes. Empty → any valid PIN is accepted and the area is confirmed with the order.
export const DELIVERY_PINS = [];
export const DELIVERY_FEE = null; // a number in rupees, or null → "confirmed with your order"

// Delivery-area check for a PIN code: "bad" (not a PIN), "out" (outside the listed areas), or "ok".
export const pinStatus = (pin) => (!/^\d{6}$/.test(String(pin || "").trim()) ? "bad" : DELIVERY_PINS.length && !DELIVERY_PINS.includes(String(pin).trim()) ? "out" : "ok");

let state = { flavor: "chicken", cart: {}, open: false, step: "cart", fulfil: "delivery", draft: {}, order: null, bump: 0 };
const subs = new Set();
const set = (patch) => {
  state = { ...state, ...patch };
  story.flavor = state.flavor;
  try {
    localStorage.setItem("rdh-cart", JSON.stringify(state.cart));
  } catch {}
  subs.forEach((f) => f());
};
const subscribe = (f) => {
  if (!subs.size) {
    try {
      const saved = JSON.parse(localStorage.getItem("rdh-cart") || "{}");
      if (saved && typeof saved === "object") state = { ...state, cart: Object.fromEntries(Object.entries(saved).filter(([id, n]) => item(id) && Number.isInteger(n) && n > 0)) };
    } catch {}
  }
  subs.add(f);
  return () => subs.delete(f);
};
const server = { flavor: "chicken", cart: {}, open: false, step: "cart", fulfil: "delivery", draft: {}, order: null, bump: 0 };
export const useShop = () => useSyncExternalStore(subscribe, () => state, () => server);

export const MAX_QTY = 20;
export const setFlavor = (flavor) => set({ flavor });
// Opening the drawer always starts at the cart, unless an order was just confirmed.
export const setOpen = (open) => set({ open, step: open ? "cart" : state.step === "done" ? "cart" : state.step });
export const setStep = (step) => set({ step });
export const setFulfil = (fulfil) => set({ fulfil });
// The checkout form as typed so far, so stepping back to the cart and forward again keeps it.
export const setDraft = (patch) => set({ draft: { ...state.draft, ...patch } });
export const setQty = (id, n) => {
  const q = Math.min(MAX_QTY, Math.max(0, Math.round(n) || 0));
  const cart = { ...state.cart, [id]: q };
  if (!q) delete cart[id];
  set({ cart });
};
// Adding bumps a counter the cart button animates on, so every add gets visible feedback.
export const add = (id, n = 1) => {
  setQty(id, (state.cart[id] || 0) + n);
  set({ bump: state.bump + 1 });
};

export const lines = (cart) => ITEMS.filter((d) => cart[d.id]).map((d) => ({ ...d, qty: cart[d.id] }));
export const totals = (cart) => {
  const ls = lines(cart);
  return { count: ls.reduce((a, l) => a + l.qty, 0), total: ls.reduce((a, l) => a + l.qty * l.price, 0), lines: ls };
};
// The delivery fee as known now: a number, or null when it is confirmed with the order.
export const fee = (fulfil) => (fulfil === "delivery" ? DELIVERY_FEE : 0);

// The order as text: what goes to WhatsApp, and what the confirmation shows.
export const orderMessage = ({ ref, lines: ls, total, fulfil, details: d }) =>
  [
    `Royal Dum Heritage order ${ref}`,
    ...ls.map((l) => `• ${l.qty} × ${l.full} (${inr(l.price * l.qty)})`),
    `Items total: ${inr(total)}`,
    fulfil === "delivery" ? (DELIVERY_FEE == null ? "Delivery fee: to be confirmed" : `Delivery fee: ${inr(DELIVERY_FEE)} · Total: ${inr(total + DELIVERY_FEE)}`) : "",
    fulfil === "delivery" ? `Delivery to: ${d.address}${d.landmark ? ` (near ${d.landmark})` : ""}, PIN ${d.pin}` : "Pickup",
    `Name: ${d.name} · Phone: ${d.phone}`,
    d.notes ? `Notes: ${d.notes}` : "",
  ]
    .filter(Boolean)
    .join("\n");

// Place the order: with a WhatsApp number, open WhatsApp with the order ready to send; without one, a demo
// confirmation only. Either way the cart empties and the drawer shows the confirmation.
export const placeOrder = () => {
  const { lines: ls, total } = totals(state.cart);
  const details = state.draft;
  if (!ls.length || (state.fulfil === "delivery" && pinStatus(details.pin) !== "ok")) return;
  const order = { ref: `RDH-${Date.now().toString(36).slice(-6).toUpperCase()}`, lines: ls, total, fulfil: state.fulfil, details, sent: !!WHATSAPP };
  if (WHATSAPP) window.open(`https://wa.me/${WHATSAPP}?text=${encodeURIComponent(orderMessage(order))}`, "_blank", "noopener");
  set({ order, cart: {}, step: "done" });
};
