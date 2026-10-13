"use client";

import { useEffect, useRef } from "react";
import gsap from "gsap";
import { ScrollTrigger } from "gsap/ScrollTrigger";
import { add, dish, useShop } from "./cart";
import { flyToCart } from "./fly";

// "From pack to plate", just before the footer (after the user's Nutrich Pinterest reference): on an orange ground of
// spice doodles, the sealed biriyani pack turns in edge-on, faces you, then flips over to the selected biriyani on
// its plate, all scrubbed from scroll (--f, 0–1; globals.css .pack-card). Reduced motion: the plate, still.
export default function Pack() {
  const card = useRef(null);
  const { flavor } = useShop();
  const d = dish(flavor);

  useEffect(() => {
    if (matchMedia("(prefers-reduced-motion: reduce)").matches) return;
    gsap.registerPlugin(ScrollTrigger);
    const t = gsap.fromTo(card.current, { "--f": 0 }, { "--f": 1, ease: "none", scrollTrigger: { trigger: card.current, start: "top 90%", end: "center 40%", scrub: 0.8 } });
    return () => (t.scrollTrigger?.kill(), t.kill());
  }, []);

  return (
    <section aria-label="From pack to plate" className="doodles relative z-10 overflow-hidden bg-copper px-5 py-24 text-ivory sm:px-10 xl:px-16">
      <div className="mx-auto grid max-w-7xl items-center gap-14 md:grid-cols-2">
        <div>
          <p className="lift text-[11px] uppercase tracking-[0.35em] text-ivory/85">From pack to plate</p>
          <h2 className="lift mt-3 font-serif text-5xl font-medium leading-[0.98] sm:text-6xl">
            Sealed at the fire. <em className="block">Opened at your table.</em>
          </h2>
          <p className="lift mt-5 max-w-md text-lg leading-relaxed text-ivory/90">Every layer stays where the handi left it: tear the seal, tip it onto a plate, and serve.</p>
          <button
            onClick={(e) => {
              add(d.id);
              flyToCart(e.currentTarget, `/plates/dish/${d.id}.webp`);
            }}
            disabled={!d.available}
            className="lift mt-8 inline-flex min-h-13 items-center gap-3 rounded-full bg-ivory pl-7 pr-2 text-sm font-semibold text-crimson shadow-[0_18px_34px_-18px_rgba(90,20,0,0.7)] transition-[scale] duration-200 active:scale-[0.97] disabled:opacity-50"
          >
            Order {d.name} biriyani
            <span aria-hidden className="grid h-9 w-9 place-items-center rounded-full bg-crimson text-ivory">→</span>
          </button>
        </div>

        <div className="mx-auto w-[min(76vw,22rem)] [perspective:1200px]">
          <div ref={card} className="pack-card relative aspect-[3/4]" style={{ "--f": 1 }}>
            {/* The pack: kraft-cream box, coral band, the RD seal. */}
            <div aria-hidden className="pack-face flex flex-col overflow-hidden rounded-[1.75rem] bg-[#f6e6d0] text-ink shadow-[0_40px_60px_-30px_rgba(90,20,0,0.75)]">
              <div className="waves bg-crimson px-6 py-5 text-center font-serif text-xl tracking-[0.22em] text-ivory">ROYAL DUM</div>
              <div className="flex flex-1 flex-col items-center justify-center gap-4 px-6 text-center">
                <span className="grid h-24 w-24 place-items-center rounded-full border-4 border-double border-crimson font-serif text-3xl text-crimson">RD</span>
                <p className="font-serif text-3xl leading-tight">{d.full}</p>
                <p className="text-[11px] uppercase tracking-[0.3em] text-ink/55">Malabar · sealed handi pack</p>
              </div>
              <div className="h-3 bg-[repeating-linear-gradient(90deg,var(--color-crimson)_0_10px,transparent_10px_18px)]" />
            </div>
            {/* The plate. */}
            <div className="pack-face pack-back flex flex-col items-center justify-center gap-6 rounded-[1.75rem] bg-ivory p-6 text-center text-ink shadow-[0_40px_60px_-30px_rgba(90,20,0,0.75)]">
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img src={`/plates/dish/${d.id}.webp`} alt={`${d.full} on a plate`} width="720" height="720" loading="lazy" className="aspect-square w-[86%] rounded-full object-cover shadow-[0_24px_40px_-20px_rgba(42,26,20,0.6)]" />
              <p className="font-serif text-2xl leading-tight text-crimson">{d.full}</p>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
