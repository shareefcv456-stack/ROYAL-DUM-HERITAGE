"use client";

import { useState } from "react";

// ponytail: sample dishes and prices; replace with the brand's real menu.
const DISHES = [
  { name: "Thalassery Chicken Dum", note: "Kaima rice, bone-in chicken, fried shallots, cashews and raisins.", price: 349, tag: "Signature" },
  { name: "Kozhikode Mutton Dum", note: "Slow-cooked mutton in a deeper, peppery masala.", price: 449 },
  { name: "Malabar Prawn Dum", note: "Tiger prawns in coconut, curry leaf and black pepper.", price: 499, tag: "Coastal" },
  { name: "Neymeen Dum", note: "Seer fish marinated in red chilli and kokum, layered gently.", price: 529 },
  { name: "Beef Dum, Malabar Style", note: "Tender beef with green chilli, ginger and whole spices.", price: 399 },
  { name: "Kaima Vegetable Dum", note: "Seasonal vegetables and paneer under the same dough seal.", price: 299, tag: "Vegetarian" },
];

const inr = (n) => `₹${n.toLocaleString("en-IN")}`;

export default function Menu({ orderUrl }) {
  const [order, setOrder] = useState({});
  const items = Object.values(order).reduce((a, b) => a + b, 0);
  const total = DISHES.reduce((sum, d) => sum + (order[d.name] || 0) * d.price, 0);

  return (
    <section id="menu" className="px-5 pb-36 pt-10 sm:px-10">
      <div className="mx-auto max-w-4xl">
        <p className="lift text-[11px] uppercase tracking-[0.35em] text-gold">The Menu</p>
        <h2 className="lift mt-4 font-serif text-5xl font-medium leading-[0.98] text-ivory sm:text-6xl">
          One handi, <em className="text-saffron">sealed to order.</em>
        </h2>

        <ul className="mt-14 divide-y divide-white/10 border-y border-white/10">
          {DISHES.map((d) => (
            <li key={d.name} className="lift group flex flex-col gap-4 py-7 transition-colors duration-500 hover:bg-white/[0.02] sm:flex-row sm:items-center sm:gap-8">
              <div className="flex-1">
                <div className="flex flex-wrap items-baseline gap-3">
                  <h3 className="font-serif text-2xl text-ivory transition-colors duration-500 group-hover:text-gold-soft sm:text-3xl">{d.name}</h3>
                  {d.tag && <span className="text-[10px] uppercase tracking-[0.3em] text-gold/80">{d.tag}</span>}
                </div>
                <p className="mt-2 text-sm text-stone-400">{d.note}</p>
              </div>
              <div className="flex items-center gap-6">
                <span className="font-serif text-2xl tabular-nums text-gold-soft">{inr(d.price)}</span>
                <button
                  onClick={() => setOrder((o) => ({ ...o, [d.name]: (o[d.name] || 0) + 1 }))}
                  className="rounded-full border border-gold/50 px-5 py-2 text-xs uppercase tracking-[0.2em] text-gold transition hover:bg-gold hover:text-charcoal"
                >
                  {order[d.name] ? `Added · ${order[d.name]}` : "Order"}
                </button>
              </div>
            </li>
          ))}
        </ul>
      </div>

      <div
        className={`fixed inset-x-4 bottom-4 z-40 mx-auto flex max-w-md items-center justify-between rounded-full border border-gold/30 bg-charcoal/90 py-2 pl-6 pr-2 shadow-2xl backdrop-blur transition duration-500 ${items ? "translate-y-0 opacity-100" : "pointer-events-none translate-y-8 opacity-0"}`}
        aria-live="polite"
      >
        <span className="text-sm text-stone-300">
          {items} {items === 1 ? "handi" : "handis"} · <span className="text-gold-soft">{inr(total)}</span>
        </span>
        <a href={orderUrl} className="rounded-full bg-gold px-5 py-2.5 text-sm font-semibold text-charcoal transition hover:bg-gold-soft">
          Checkout
        </a>
      </div>
    </section>
  );
}
