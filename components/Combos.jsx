"use client";

import { useEffect, useState } from "react";
import { COMBOS, OFFERS, SAMPLE, addCombo, comboPrice, dish, inr, item, totals } from "./cart";
import { Tag } from "./icons";
import { flyToCart } from "./fly";

// On the peach band, the tiers above the single handis (Shop.jsx): a clean white combo, a warm apricot one, and the
// festival pack in coral across the full width. Each shows its dishes' own photographs side by side, the item list,
// and one add button carrying the price. Prices are the plain sum of the items unless the business sets a real combo
// price (cart.js COMBOS); only then is the sum struck through with "Save".
const LOOKS = [
  { block: "bg-white text-ink", button: "bg-crimson text-ivory", tag: "bg-peach text-crimson" },
  { block: "bg-amber text-ink", button: "bg-crimson text-ivory", tag: "bg-white/60" },
];
const FESTIVAL = { block: "bg-crimson text-ivory", button: "bg-ivory text-crimson", tag: "bg-ivory text-crimson" };

function Card({ c, look, wide, done, onAdd }) {
  const sum = totals(c.items).total;
  const price = comboPrice(c);
  const pics = Object.keys(c.items).filter(dish).slice(0, 3);
  return (
    <article className={`group relative flex h-full flex-col overflow-hidden rounded-[1.75rem] p-5 ring-1 ring-ink/5 sm:p-6 ${look.block} ${wide ? "md:grid md:grid-cols-[1fr_1.1fr] md:items-stretch md:gap-10 md:p-8" : ""}`}>
      <div aria-hidden className={`grid gap-1.5 overflow-hidden rounded-[1.25rem] ${wide ? "aspect-[4/3] md:order-2 md:aspect-auto" : "aspect-[16/9]"}`} style={{ gridTemplateColumns: `repeat(${pics.length}, 1fr)` }}>
        {pics.map((id) => (
          // eslint-disable-next-line @next/next/no-img-element
          <img key={id} src={`/plates/shop/${id}.jpg`} alt="" width="928" height="1152" loading="lazy" decoding="async" className="h-full w-full object-cover transition-[scale] duration-[1200ms] ease-[cubic-bezier(.2,.8,.2,1)] group-hover:scale-[1.04]" />
        ))}
      </div>
      <div className="flex flex-1 flex-col px-1 pt-6 md:pt-2">
        <div className="flex flex-wrap items-center gap-2">
          <span className={`rounded-full px-3 py-1 text-[11px] font-semibold uppercase tracking-[0.2em] ${look.tag}`}>{wide ? "Festival pack" : "Combo"}</span>
          {price < sum && <span className="rounded-full bg-ivory px-3 py-1 text-[11px] font-semibold uppercase tracking-[0.2em] text-crimson">Save {inr(sum - price)}</span>}
          {SAMPLE && <span className="rounded-full border border-current/30 px-3 py-1 text-[11px] uppercase tracking-[0.2em] opacity-70">Sample</span>}
        </div>
        <h3 className={`mt-4 font-serif leading-[1.02] ${wide ? "text-[clamp(2.5rem,5vw,3.75rem)]" : "text-[2.25rem]"}`}>{c.name}</h3>
        <p className="mt-2 text-[15px] leading-relaxed opacity-80">{c.note}</p>
        <ul className={`mt-5 text-sm ${wide ? "grid gap-x-8 gap-y-2 sm:grid-cols-2" : "space-y-2"}`}>
          {Object.entries(c.items).map(([id, n]) => (
            <li key={id} className="flex items-baseline justify-between gap-4 border-b border-current/15 pb-2">
              <span>{item(id).full}</span>
              <span className="shrink-0 font-semibold tabular-nums opacity-80">× {n}</span>
            </li>
          ))}
        </ul>
        <div className="mt-auto flex items-center justify-between gap-4 pt-7">
          <p className="font-serif text-3xl tabular-nums">
            {inr(price)}
            {price < sum && <s className="ml-2 text-base opacity-60">{inr(sum)}</s>}
          </p>
          <button
            onClick={onAdd}
            className={`min-h-12 rounded-full px-6 text-sm font-semibold transition-[scale] duration-200 active:scale-[0.97] ${look.button}`}
            aria-label={`Add ${c.name} to cart, ${inr(price)}`}
          >
            <span aria-live="polite">{done ? "Added ✓" : wide ? "Add the pack" : "Add combo"}</span>
          </button>
        </div>
      </div>
    </article>
  );
}

export default function Combos() {
  const [added, setAdded] = useState(null);
  useEffect(() => {
    if (!added) return;
    const id = setTimeout(() => setAdded(null), 1600);
    return () => clearTimeout(id);
  }, [added]);
  if (!COMBOS.length) return null;

  let n = 0; // combos alternate their looks; festival packs have their own
  return (
    <section id="combos" className="relative z-10 bg-peach px-5 pb-24 pt-20 text-ink sm:px-10 xl:px-16">
      <div data-recede className="mx-auto max-w-7xl">
        <p className="lift text-[11px] uppercase tracking-[0.35em] text-copper-deep">Combos & festival packs</p>
        <h2 className="lift mt-3 font-serif text-5xl font-medium leading-[0.98] sm:text-6xl">
          Made for <em className="text-crimson">the table.</em>
        </h2>
        {/* The business's live offers, if any, in one slim strip: the first thing seen in this section. */}
        {OFFERS.length > 0 && (
          <ul className="lift mt-8 flex flex-wrap gap-2" aria-label="Current offers">
            {OFFERS.map((o) => (
              <li key={o} className="flex items-center gap-2 rounded-full bg-crimson px-4 py-2 text-sm font-medium text-ivory">
                <Tag className="h-4 w-4 text-ivory" /> {o}
              </li>
            ))}
          </ul>
        )}
        <ul className="mt-10 grid gap-6 md:grid-cols-2">
          {COMBOS.map((c) => {
            const wide = c.tag === "Festival";
            return (
              <li key={c.id} className={`lift ${wide ? "md:col-span-2" : ""}`}>
                <Card
                  c={c}
                  wide={wide}
                  look={wide ? FESTIVAL : LOOKS[n++ % LOOKS.length]}
                  done={added === c.id}
                  onAdd={(e) => {
                    addCombo(c);
                    setAdded(c.id);
                    const first = Object.keys(c.items).find(dish);
                    flyToCart(e.currentTarget, first && `/plates/dish/${first}.webp`);
                  }}
                />
              </li>
            );
          })}
        </ul>
      </div>
    </section>
  );
}
