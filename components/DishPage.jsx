"use client";

import { useState } from "react";
import { ADDONS, DISHES, add, dish, inr, slugOf, useShop } from "./cart";
import { Heat, PriceBadge } from "./icons";
import { flyToCart } from "./fly";
import { AddControl, DemoNotice, Qty } from "./Shop";

// A biriyani's own page (app/products/[slug]): the dish large on the left (its photograph, with the plate from above
// and the price seal), and beside it its name, price, line, what goes into it layer by layer, portion, weight, spice,
// availability, a quantity and Add to cart (the sides can go in with it). Below: the other biriyanis, each linking to
// its own page, and the sides to add straight from here. Phones: the photo first, then the details and the order.
export default function DishPage({ id }) {
  const x = dish(id);
  const { cart } = useShop();
  const [qty, setN] = useState(1);
  const [sides, setSides] = useState([]);
  const others = DISHES.filter((o) => o.id !== id);
  const total = x.price * qty + ADDONS.filter((a) => sides.includes(a.id)).reduce((t, a) => t + a.price, 0);
  const inCart = cart[id] || 0;

  return (
    <main id="main" className="bg-paper text-ink">
      <section className="mx-auto max-w-7xl px-5 pb-16 pt-24 sm:px-10 sm:pt-28 xl:px-16">
        <a href="/#menu" className="inline-flex min-h-11 items-center gap-2 text-sm text-ink/65 transition hover:text-ink">
          <span aria-hidden>←</span> Back to the menu
        </a>
        <div className="mt-4 grid items-start gap-10 md:grid-cols-[1.05fr_1fr] md:gap-14">
          {/* The dish. */}
          <div className="relative">
            <div className="overflow-hidden rounded-[2rem] bg-peach">
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img src={`/plates/shop/${x.id}.jpg`} alt={`${x.full}, served in its handi`} width="928" height="1152" fetchPriority="high" className="aspect-[4/5] w-full object-cover" />
            </div>
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img src={`/plates/dish/${x.id}.webp`} alt="" width="720" height="720" className="absolute -bottom-8 -right-3 w-[32%] rounded-full shadow-[0_30px_50px_-20px_rgb(56_37_30/0.6)] ring-[6px] ring-paper" />
            <PriceBadge value={x.price} className="absolute -left-3 -top-4 w-24 sm:w-28" />
          </div>

          {/* The details and the order. */}
          <div className="md:sticky md:top-24">
            <p className="text-[11px] font-semibold uppercase tracking-[0.3em] text-copper-deep">{x.meat}</p>
            <h1 className="mt-3 font-serif text-[clamp(2.75rem,5vw,4.25rem)] font-semibold leading-[0.95]">{x.full}</h1>
            <p className="mt-4 font-serif text-4xl tabular-nums">{inr(x.price)}</p>
            <p className="mt-4 max-w-lg text-lg leading-relaxed text-ink/75">{x.note}</p>
            <dl className="mt-6 grid max-w-lg grid-cols-3 gap-3 text-sm">
              {[["Serves", x.serves.replace(/^Serves /, "")], ["Weight", x.weight], ["Spice", <Heat key="h" n={x.heat} className="text-crimson" />]].map(([k, v]) => (
                <div key={k} className="rounded-2xl bg-white px-4 py-3 ring-1 ring-ink/10">
                  <dt className="text-[10px] uppercase tracking-[0.25em] text-ink/50">{k}</dt>
                  <dd className="mt-1 font-medium">{v}</dd>
                </div>
              ))}
            </dl>
            <p className="mt-6 text-[11px] uppercase tracking-[0.3em] text-copper-deep">Layer by layer</p>
            <ol className="mt-2 max-w-lg space-y-1.5 border-l border-copper/40 pl-4 text-sm text-ink/75">
              {[...x.layers].reverse().map((l) => <li key={l}>{l}</li>)}
            </ol>

            <fieldset className="mt-7">
              <legend className="text-[11px] uppercase tracking-[0.3em] text-copper-deep">Add a side</legend>
              <div className="mt-2 flex flex-wrap gap-2">
                {ADDONS.filter((a) => a.available).map((a) => {
                  const on = sides.includes(a.id);
                  return (
                    <button key={a.id} type="button" aria-pressed={on} onClick={() => setSides(on ? sides.filter((i) => i !== a.id) : [...sides, a.id])} className={`min-h-10 rounded-full border px-4 text-sm transition ${on ? "border-heritage bg-heritage text-ivory" : "border-ink/15 bg-white hover:border-ink/40"}`}>
                      {on ? "✓" : "+"} {a.full} · {inr(a.price)}
                    </button>
                  );
                })}
              </div>
            </fieldset>

            {x.available ? (
              <div className="mt-7 flex flex-wrap items-center gap-3">
                <Qty value={qty} onChange={setN} label={x.full} min={1} />
                <button
                  onClick={(e) => {
                    add(x.id, qty);
                    sides.forEach((a) => add(a));
                    flyToCart(e.currentTarget, `/plates/dish/${x.id}.webp`);
                    setN(1);
                    setSides([]);
                  }}
                  className="inline-flex min-h-13 flex-1 items-center justify-center rounded-full bg-crimson px-7 text-sm font-semibold text-ivory shadow-[0_16px_30px_-16px_rgb(143_50_29/0.8)] transition-[background-color,scale] duration-200 hover:bg-crimson-deep active:scale-[0.97] sm:flex-none"
                >
                  Add to cart · {inr(total)}
                </button>
              </div>
            ) : (
              <p className="mt-7 rounded-2xl bg-ink/5 px-5 py-4 text-sm text-ink/70">Sold out today.</p>
            )}
            <p className="mt-3 text-xs text-ink/55" aria-live="polite">
              {x.available ? "Available" : "Not available"}
              {inCart > 0 && ` · ${inCart} already in your cart`}
            </p>
            <DemoNotice className="mt-6 max-w-lg" />
          </div>
        </div>
      </section>

      {/* More from the menu. */}
      <section className="bg-peach px-5 py-16 sm:px-10 xl:px-16">
        <div className="mx-auto max-w-7xl">
          <div className="flex flex-wrap items-end justify-between gap-4">
            <h2 className="font-serif text-4xl font-medium sm:text-5xl">
              You might <em className="text-crimson">also like</em>
            </h2>
            <a href="/#menu" className="inline-flex min-h-11 items-center text-sm font-semibold text-crimson underline-offset-4 hover:underline">The full menu →</a>
          </div>
          <ul className="mt-14 grid gap-x-6 gap-y-20 sm:grid-cols-2 lg:grid-cols-4">
            {others.map((o) => (
              <li key={o.id}>
                <article className="group relative flex h-full flex-col rounded-[1.75rem] bg-ivory px-5 pb-5 pt-28 shadow-[0_24px_40px_-30px_rgb(56_37_30/0.5)] ring-1 ring-ink/5 transition-[translate,box-shadow] duration-500 hover:-translate-y-1.5 hover:shadow-[0_34px_50px_-30px_rgb(56_37_30/0.6)]">
                  <a href={`/products/${slugOf(o)}`} className="absolute -top-14 left-1/2 block w-36 -translate-x-1/2 rounded-full" aria-label={`View ${o.full}`}>
                    {/* eslint-disable-next-line @next/next/no-img-element */}
                    <img src={`/plates/dish/${o.id}.webp`} alt="" width="720" height="720" loading="lazy" className="aspect-square w-full rounded-full object-cover shadow-[0_20px_34px_-16px_rgb(56_37_30/0.6)] transition-[rotate] duration-1000 group-hover:rotate-12" />
                  </a>
                  <p className="text-[10px] font-semibold uppercase tracking-[0.3em] text-copper-deep">{o.meat}</p>
                  <h3 className="mt-1 font-serif text-2xl leading-tight">
                    <a href={`/products/${slugOf(o)}`} className="hover:text-crimson">{o.full}</a>
                  </h3>
                  <p className="mt-2 line-clamp-2 text-sm text-ink/65">{o.note}</p>
                  <div className="mt-auto flex items-center justify-between gap-2 pt-5">
                    <span className="font-serif text-2xl tabular-nums">{inr(o.price)}</span>
                    <AddControl x={o} qty={cart[o.id]} compact />
                  </div>
                </article>
              </li>
            ))}
          </ul>
        </div>
      </section>
    </main>
  );
}
