"use client";

import { useState } from "react";
import { DISHES, add, dish, inr, setFlavor, useShop } from "./cart";

// Spices peeking in at the far edges on wide screens, each drifting at its own pace; never near the copy.
const EDGE_SPICES = [
  { n: "cardamom", at: "-left-6 top-[24%] w-20", dur: "9s", spin: "10deg" },
  { n: "clove", at: "-left-4 bottom-[16%] w-14", dur: "11s", spin: "-9deg" },
  { n: "star-anise", at: "-right-8 top-[14%] w-24", dur: "12s", spin: "-12deg" },
  { n: "cinnamon", at: "-right-10 bottom-[10%] w-28", dur: "14s", spin: "6deg" },
];

// The selected biriyani: the visitor picks it; it never changes on its own.
function Selector({ flavor, className }) {
  return (
    <div role="radiogroup" aria-label="Choose a biriyani" className={`flex gap-2 overflow-x-auto pb-1 [scrollbar-width:none] ${className}`}>
      {DISHES.map((x) => (
        <button
          key={x.id}
          role="radio"
          aria-checked={x.id === flavor}
          onClick={() => setFlavor(x.id)}
          className={`group flex min-h-12 shrink-0 items-center gap-2.5 rounded-full border py-1 pl-1 pr-4 text-sm transition duration-300 ${x.id === flavor ? "border-gold bg-ivory text-ink" : "border-ivory/20 text-ivory/80 hover:border-ivory/50 hover:text-ivory"}`}
        >
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img src={`/plates/dish/${x.id}.webp`} alt="" width="40" height="40" className="h-10 w-10 rounded-full object-cover" />
          {x.name}
        </button>
      ))}
    </div>
  );
}

export default function Hero() {
  const { flavor, cart } = useShop();
  const d = dish(flavor);
  const [added, setAdded] = useState(0);

  return (
    <section id="top" className="leaf relative z-10 overflow-hidden text-ivory">
      {EDGE_SPICES.map((s) => (
        // eslint-disable-next-line @next/next/no-img-element
        <img key={s.n} src={`/plates/spice/${s.n}.webp`} alt="" aria-hidden width="160" height="160" className={`drift pointer-events-none absolute hidden opacity-80 xl:block ${s.at}`} style={{ "--dur": s.dur, "--spin": s.spin }} />
      ))}

      <div className="mx-auto grid max-w-7xl gap-x-12 gap-y-8 px-5 pb-14 pt-24 sm:px-10 md:min-h-[100svh] md:grid-cols-[5fr_7fr] md:content-center md:pb-20 md:pt-28 xl:px-16">
        <div className="md:col-start-1 md:row-start-1">
          <p className="text-[11px] uppercase tracking-[0.35em] text-gold">Malabar dum biriyani · Kerala</p>
          <h1 className="mt-4 font-serif text-6xl font-medium leading-[0.92] sm:text-7xl lg:text-[5.5rem]">
            Royal Dum <em className="text-saffron">Heritage</em>
          </h1>
          <p className="mt-4 font-serif text-2xl italic text-ivory/85">From our chembu to your doorstep.</p>
        </div>

        {/* The dish: rotates in when picked, on a copper-rimmed plate with a glow in the dish's own accent. */}
        <div className="relative md:col-start-2 md:row-span-3 md:row-start-1">
          <div className="relative mx-auto aspect-square w-full max-w-[min(84vw,560px)]">
            <div className="absolute inset-[8%] rounded-full opacity-50 blur-3xl transition-colors duration-700" style={{ backgroundColor: d.accent }} />
            <div className="absolute inset-[4%] rounded-full shadow-[0_40px_80px_-24px_rgba(0,0,0,0.7)] ring-[10px] ring-copper/85" />
            {DISHES.map((x) => (
              // eslint-disable-next-line @next/next/no-img-element
              <img
                key={x.id}
                src={`/plates/dish/${x.id}.webp`}
                alt={x.id === flavor ? `${x.full}, seen from above` : ""}
                aria-hidden={x.id !== flavor}
                width="720"
                height="720"
                fetchPriority={x.id === "chicken" ? "high" : "low"}
                className={`absolute inset-[4%] h-[92%] w-[92%] rounded-full object-cover transition-[opacity,transform] duration-[900ms] ease-[cubic-bezier(.2,.8,.2,1)] ${x.id === flavor ? "rotate-0 scale-100 opacity-100" : "-rotate-[28deg] scale-[0.92] opacity-0"}`}
              />
            ))}
            <div className="pointer-events-none absolute inset-[4%] rounded-full shadow-[inset_0_0_40px_rgba(0,0,0,0.45)]" />
          </div>
        </div>

        <Selector flavor={flavor} className="md:col-start-1 md:row-start-3 md:flex-wrap md:overflow-visible" />

        <div className="md:col-start-1 md:row-start-2">
          <div key={flavor} className="settle" aria-live="polite">
            <h2 className="font-serif text-3xl leading-tight sm:text-4xl">{d.full}</h2>
            <p className="mt-2 max-w-md text-ivory/75">{d.note}</p>
            <p className="mt-3 flex flex-wrap items-baseline gap-x-4 gap-y-1">
              <span className="text-2xl font-semibold tabular-nums text-gold">{inr(d.price)}</span>
              <span className="text-sm text-ivory/65">{d.serves} · {d.weight}</span>
              {!d.available && <span className="text-sm text-ivory/65">Sold out</span>}
            </p>
          </div>
          <div className="mt-6 flex flex-wrap gap-3">
            <a href="#menu" className="inline-flex min-h-12 items-center rounded-full bg-saffron px-7 text-sm font-semibold text-ink transition hover:bg-gold-soft">
              Order Biriyani
            </a>
            <a href="#story" className="inline-flex min-h-12 items-center rounded-full border border-ivory/35 px-7 text-sm font-semibold transition hover:border-gold hover:text-gold">
              Watch the Dum
            </a>
            <button
              onClick={() => {
                add(d.id);
                setAdded((n) => n + 1);
              }}
              disabled={!d.available}
              className="inline-flex min-h-12 items-center gap-2 rounded-full px-4 text-sm font-medium text-ivory/85 underline-offset-4 transition hover:text-gold hover:underline disabled:opacity-40"
            >
              <span key={added} className={added ? "pop" : ""} aria-hidden>
                {cart[d.id] ? "✓" : "+"}
              </span>
              {cart[d.id] ? `In cart (${cart[d.id]}) · add another` : "Add to cart"}
            </button>
          </div>
        </div>
      </div>
      <div className="trim" aria-hidden />
    </section>
  );
}
