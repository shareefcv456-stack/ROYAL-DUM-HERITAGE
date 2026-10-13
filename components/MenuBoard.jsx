"use client";

import { useEffect, useRef } from "react";
import gsap from "gsap";
import { ScrollTrigger } from "gsap/ScrollTrigger";
import { DISHES, add } from "./cart";
import { Price } from "./icons";
import { flyToCart } from "./fly";

// The biriyani menu board, after the user's poster reference (dark pills on a warm block, a round dish breaking out of
// one end, sides alternating). As each row scrolls in, its dish rolls in from its own side of the screen and the pill
// slides in from the other, scrubbed with the scroll. Reduced motion: the board, still.
const LABEL = { fish: "Fish Neymeen" };

export default function MenuBoard() {
  const root = useRef(null);
  useEffect(() => {
    if (matchMedia("(prefers-reduced-motion: reduce)").matches) return;
    gsap.registerPlugin(ScrollTrigger);
    const ctx = gsap.context(() => {
      gsap.utils.toArray("[data-side]").forEach((row) => {
        const s = Number(row.dataset.side); // 1: the dish comes from the right, -1: from the left
        const st = { trigger: row, start: "top bottom", end: "center 60%", scrub: 0.7, invalidateOnRefresh: true };
        gsap.fromTo(row.querySelector(".mb-dish"), { x: () => s * innerWidth * 0.6, rotate: s * 220 }, { x: 0, rotate: 0, ease: "none", scrollTrigger: st });
        gsap.fromTo(row.querySelector(".mb-pill"), { x: () => -s * innerWidth * 0.35, opacity: 0 }, { x: 0, opacity: 1, ease: "none", scrollTrigger: st });
      });
    }, root);
    return () => ctx.revert();
  }, []);

  return (
    <section ref={root} aria-label="The biriyani menu board" className="relative z-10 overflow-hidden bg-amber px-5 py-20 text-ink sm:px-10 xl:px-16">
      <div className="mx-auto max-w-3xl">
        <h2 className="flex flex-wrap items-end gap-x-5 font-sans font-black uppercase leading-[0.85] tracking-tight">
          <span className="text-6xl text-ivory [text-shadow:0_5px_0_rgb(168_48_26/0.35)] sm:text-8xl">Menu</span>
          <span className="pb-1.5 text-2xl text-crimson-deep sm:text-4xl">Biriyani</span>
        </h2>

        <ul className="mt-10 space-y-5 sm:space-y-6">
          {DISHES.map((x, i) => {
            const right = i % 2 === 0; // the dish sits at the right end on even rows, the left on odd
            return (
              <li key={x.id} data-side={right ? 1 : -1} className={`relative flex items-center ${right ? "" : "flex-row-reverse"}`}>
                <div className={`mb-pill flex min-h-24 flex-1 flex-col justify-center rounded-full bg-ink py-4 text-ivory sm:min-h-28 ${right ? "pl-7 pr-[34%] sm:pl-10 sm:pr-[30%]" : "pl-[34%] pr-7 text-right sm:pl-[30%] sm:pr-10"}`}>
                  <h3 className="font-sans text-lg font-extrabold leading-tight tracking-tight sm:text-2xl">{LABEL[x.id] || x.name} Biriyani</h3>
                  <div className={`mt-1 flex items-center gap-3 ${right ? "" : "justify-end"}`}>
                    <Price value={x.price} className="font-serif text-3xl sm:text-4xl" />
                    <button
                      onClick={(e) => {
                        add(x.id);
                        flyToCart(e.currentTarget, `/plates/dish/${x.id}.webp`);
                      }}
                      disabled={!x.available}
                      aria-label={`Add ${x.full} to cart`}
                      className="grid h-10 w-10 shrink-0 place-items-center rounded-full bg-amber text-xl font-bold text-ink transition-[scale] duration-200 hover:scale-110 active:scale-95 disabled:opacity-40"
                    >
                      +
                    </button>
                  </div>
                </div>
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img
                  src={`/plates/dish/${x.id}.webp`}
                  alt={x.full}
                  width="480"
                  height="480"
                  loading="lazy"
                  className={`mb-dish absolute top-1/2 aspect-square w-[30%] max-w-40 -translate-y-1/2 rounded-full object-cover shadow-[0_24px_40px_-18px_rgba(42,26,20,0.7)] ring-[6px] ring-ink sm:max-w-44 ${right ? "right-0" : "left-0"}`}
                />
              </li>
            );
          })}
        </ul>
      </div>
    </section>
  );
}
