"use client";

import { FEATURES } from "./cart";

// Scene B, ingredients and heritage: three photographs set like an editorial spread (the masala in the mortar large,
// whole spices and fried shallots beside it), each rising out of its own frame as it scrolls in ([data-rise],
// Motion.jsx), then the restaurant's own three descriptors (cart.js FEATURES) as numbered lines.
const SHOTS = [
  ["mortar", "Whole spices pounded in a stone mortar", "Handmade dum masala", "md:col-span-7 md:row-span-2 aspect-[4/3] md:aspect-auto"],
  ["spices", "Cardamom, clove, star anise and cinnamon laid out in rows", "Whole spices", "md:col-span-5 aspect-[16/9]"],
  ["shallots", "Fried shallots, cashews and raisins falling onto stone", "Fried shallots, cashews, raisins", "md:col-span-5 aspect-[16/9]"],
];

export default function Heritage() {
  return (
    <section id="heritage" aria-label="Ingredients and heritage" className="relative z-10 bg-paper px-5 py-20 text-ink sm:px-10 sm:py-24 xl:px-16">
      <div className="mx-auto max-w-7xl">
        <div className="grid gap-6 md:grid-cols-12 md:items-end">
          <div className="md:col-span-7">
            <p className="lift text-[11px] uppercase tracking-[0.35em] text-copper-deep">Ingredients & heritage</p>
            <h2 className="lift mt-3 font-serif text-[clamp(2.75rem,6vw,4.5rem)] font-medium leading-[0.98]">
              Malabar flavour, <em className="text-crimson">ground by hand.</em>
            </h2>
          </div>
          <p className="lift text-lg leading-relaxed text-ink/70 md:col-span-5">
            Kaima rice, a masala made by hand and a slow fire: the three things every handi starts with.
          </p>
        </div>
        <div className="mt-12 grid gap-4 md:grid-cols-12 md:grid-rows-2">
          {SHOTS.map(([img, alt, cap, cls]) => (
            <figure key={img} data-rise className={`group relative overflow-hidden rounded-2xl bg-[#140c08] ${cls}`}>
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img src={`/plates/${img}.jpg`} alt={alt} width="1376" height="768" loading="lazy" decoding="async" data-zoom className="absolute inset-0 h-full w-full object-cover" />
              <figcaption className="absolute bottom-0 left-0 m-3 rounded-full bg-paper/90 px-4 py-2 text-xs font-medium text-ink backdrop-blur">{cap}</figcaption>
            </figure>
          ))}
        </div>
        <ol className="mt-12 grid gap-8 border-t border-ink/10 pt-10 sm:grid-cols-3">
          {FEATURES.map((f, i) => (
            <li key={f.text} className="lift">
              <span className="font-serif text-4xl text-copper">0{i + 1}</span>
              <p className="mt-2 font-serif text-2xl leading-tight">{f.text}</p>
            </li>
          ))}
        </ol>
      </div>
    </section>
  );
}
