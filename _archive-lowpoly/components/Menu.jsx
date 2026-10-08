"use client";

import { useState } from "react";

const DISHES = [
  { name: "Hyderabadi Kacchi Gosht", price: 649, tag: "Signature", hue: "#8a3a17", desc: "Raw-marinated goat layered with aged basmati and cooked together under one dough seal." },
  { name: "Lucknowi Awadhi Murgh", price: 529, tag: "Delicate", hue: "#c89a52", desc: "Pakki-style chicken in a light yakhni with kewra, rose and saffron." },
  { name: "Thalassery Chicken Dum", price: 489, tag: "Bestseller", hue: "#b5651d", desc: "Short-grain kaima rice, fried shallots and Malabar spices, finished with cashew and raisin." },
  { name: "Kolkata Mutton & Aloo", price: 599, tag: "Heritage", hue: "#9c5b2e", desc: "Nawabi-style mutton with a golden potato and a boiled egg, perfumed with mace and attar." },
  { name: "Malabar Prawn Dum", price: 699, tag: "Coastal", hue: "#d9822b", desc: "Tiger prawns marinated in coconut, curry leaf and black pepper, layered with saffron rice." },
  { name: "Subz Nizami", price: 429, tag: "Vegetarian", hue: "#6f8a3a", desc: "Seasonal vegetables, paneer and dried apricot in a fragrant layer of saffron basmati." },
];

const inr = (n) => `₹${n.toLocaleString("en-IN")}`;

export default function Menu() {
  const [order, setOrder] = useState({});
  const items = Object.values(order).reduce((a, b) => a + b, 0);
  const total = DISHES.reduce((sum, d) => sum + (order[d.name] || 0) * d.price, 0);
  const add = (name) => setOrder((o) => ({ ...o, [name]: (o[name] || 0) + 1 }));

  return (
    <section id="menu" className="mx-auto max-w-6xl px-4 py-24 sm:px-8 md:py-32">
      <p className="text-xs uppercase tracking-[0.3em] text-gold">The Royal Menu</p>
      <h2 className="mt-3 font-serif text-4xl font-semibold sm:text-5xl">
        One handi, <span className="gold-text italic">sealed to order.</span>
      </h2>

      <div className="mt-12 grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
        {DISHES.map((d, i) => (
          <article
            key={d.name}
            className="glass group relative flex flex-col overflow-hidden rounded-2xl p-6 transition duration-500 ease-out hover:-translate-y-1.5 hover:border-gold/60 hover:shadow-[0_30px_60px_-20px_rgba(212,175,55,0.35)]"
          >
            <div
              className="pointer-events-none absolute -right-10 -top-10 h-40 w-40 rounded-full opacity-30 blur-2xl transition duration-700 group-hover:scale-150 group-hover:opacity-60"
              style={{ background: d.hue }}
            />
            <div className="relative flex items-start justify-between">
              <span className="font-serif text-5xl italic text-gold/30">{String(i + 1).padStart(2, "0")}</span>
              <span className="rounded-full border border-gold/30 px-3 py-1 text-[10px] uppercase tracking-[0.2em] text-gold">{d.tag}</span>
            </div>
            <h3 className="relative mt-6 font-serif text-2xl font-semibold text-stone-100">{d.name}</h3>
            <p className="relative mt-2 flex-1 text-sm leading-relaxed text-stone-400">{d.desc}</p>
            <div className="relative mt-6 flex items-center justify-between">
              <span className="font-serif text-2xl text-gold-soft">{inr(d.price)}</span>
              <button
                onClick={() => add(d.name)}
                className="rounded-full border border-gold/60 px-5 py-2 text-sm font-medium text-gold transition hover:bg-gold hover:text-charcoal active:scale-95 focus-visible:outline-2 focus-visible:outline-gold"
              >
                {order[d.name] ? `Added · ${order[d.name]}` : "Order Now"}
              </button>
            </div>
          </article>
        ))}
      </div>

      <div
        aria-live="polite"
        className={`glass fixed inset-x-4 bg-charcoal/90! bottom-4 z-40 mx-auto flex max-w-md items-center justify-between rounded-full py-2 pl-6 pr-2 shadow-2xl transition duration-500 ${items ? "translate-y-0 opacity-100" : "pointer-events-none translate-y-8 opacity-0"}`}
      >
        <span className="text-sm text-stone-200">
          {items} {items === 1 ? "handi" : "handis"} · <span className="text-gold-soft">{inr(total)}</span>
        </span>
        {/* ponytail: no checkout backend yet — wire this to your order/payment flow. */}
        <a href="#order" className="rounded-full bg-gold px-5 py-2.5 text-sm font-semibold text-charcoal hover:bg-gold-soft">
          Checkout
        </a>
      </div>
    </section>
  );
}
