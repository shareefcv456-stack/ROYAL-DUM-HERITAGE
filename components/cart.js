"use client";
// The shop's shared state: the selected flavour, the cart and the
// checkout. A tiny external store so the header, the shop, the cart drawer and the assembly stay in sync without a provider.
import { useSyncExternalStore } from "react";

// SAMPLE MENU. Every name, portion and price below is a placeholder, not business information: the shop shows a
// "demo" notice while this is true. Replace the items with the real menu, then set SAMPLE to false.
export const SAMPLE = true;

import { DISHES } from "./dishes.js";

export { DISHES };
export { slugOf, bySlug } from "./dishes.js";
export const ADDONS = [
  { id: "raita", full: "Raita", note: "Curd with onion and cucumber.", price: 40, weight: "150 ml", available: true },
  { id: "pickle", full: "Pickle", note: "A small pot of pickle.", price: 30, weight: "50 g", available: true },
  { id: "payasam", full: "Payasam", note: "Sweet payasam to finish.", price: 90, weight: "200 ml", available: true },
];
const ITEMS = [...DISHES, ...ADDONS];

// The restaurant's own descriptors, as supplied by the business (2026-10-10). Shown as feature callouts.
export const FEATURES = [
  { icon: "rice", text: "100% Malabar Kaima Rice" },
  { icon: "masala", text: "Handmade Dum Masala" },
  { icon: "fire", text: "Wood-fired Slow Cooked" },
];

// Combos: fixed sets of menu items. Priced at the plain sum of their items unless the business sets `price`
// (a real combo or festival discount); never invent one. These three are samples, like the menu (SAMPLE).
export const COMBOS = [
  { id: "family", name: "Family Dum Pack", tag: "Combo", items: { chicken: 2, mutton: 1, raita: 2 }, note: "Three handis and raita for the table." },
  { id: "coast", name: "Coastal Pair", tag: "Combo", items: { fish: 1, prawn: 1, pickle: 1 }, note: "Both seafood biriyanis, with pickle." },
  { id: "festival", name: "Festival Spread", tag: "Festival", items: { chicken: 1, mutton: 1, beef: 1, raita: 3, payasam: 3 }, note: "One of each meat, with raita and payasam to finish." },
];
export const comboPrice = (c) => c.price ?? Object.entries(c.items).reduce((a, [id, n]) => a + item(id).price * n, 0);
// The whole pack in one store write, confirmed by its own name.
export const addCombo = (c) => {
  const cart = { ...state.cart };
  for (const [id, n] of Object.entries(c.items)) cart[id] = Math.min(MAX_QTY, (cart[id] || 0) + n);
  set({ cart, bump: state.bump + 1, last: c.name });
};
export const dish = (id) => DISHES.find((d) => d.id === id);
export const item = (id) => ITEMS.find((d) => d.id === id);
export const inr = (n) => `₹${n.toLocaleString("en-IN")}`;

// BUSINESS DETAILS. Everything here must come from the business; empty values are simply not shown.
// WHATSAPP: country code first, digits only (e.g. "919876543210"). Empty → checkout is a demo that sends nothing.
export const WHATSAPP = "";
export const PHONE = ""; // shown in the footer, e.g. "+91 98765 43210"
export const PICKUP = ""; // pickup address as it should be shown
export const HOURS = ""; // e.g. "Daily, 12 pm – 10 pm"
// Kitchen hours in 24h local time, e.g. { open: "12:00", close: "22:30" }; powers the live "Open now" status.
// null → no live status is claimed (the header shows "Delivery & pickup" instead).
export const KITCHEN_HOURS = null;
// Delivery areas as 6-digit PIN codes. Empty → any valid PIN is accepted and the area is confirmed with the order.
export const DELIVERY_PINS = [];
export const DELIVERY_FEE = null; // a number in rupees, or null → "confirmed with your order"
// Current offers, exactly as the business words them (e.g. "Family combo: 2 biriyanis + raita, ₹…"). Shown in the
// ticker only when set; never make one up.
export const OFFERS = [];

// Delivery-area check for a PIN code: "bad" (not a PIN), "out" (outside the listed areas), or "ok".
export const pinStatus = (pin) => (!/^\d{6}$/.test(String(pin || "").trim()) ? "bad" : DELIVERY_PINS.length && !DELIVERY_PINS.includes(String(pin).trim()) ? "out" : "ok");

let state = { flavor: "chicken", cart: {}, open: false, step: "cart", fulfil: "delivery", draft: {}, order: null, bump: 0 };
const subs = new Set();
const set = (patch) => {
  state = { ...state, ...patch };
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
// One store write per add (cart, count and confirmation together), so every view updates in the same frame.
export const add = (id, n = 1) => {
  const q = Math.min(MAX_QTY, (state.cart[id] || 0) + n);
  set({ cart: { ...state.cart, [id]: q }, bump: state.bump + 1, last: item(id)?.full });
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
