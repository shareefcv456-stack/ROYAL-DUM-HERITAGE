"use client";

import { useRef, useState } from "react";
import { DISHES, add } from "./cart";
import { Heat, Price } from "./icons";
import { flyToCart } from "./fly";
import { useOnScreen } from "./hooks";
import { DishDialog } from "./Shop";

// The flavour strip, after the user's "Biryani Biryani" reference: peach above, coral below with wavy lines, and the
// five biriyani cards gliding left without end, laid out like prints from a food shoot (each tilted a little; it
// straightens and lifts when pointed at). Two copies of the row make the loop seamless (globals.css .marquee). It runs
// only while on screen; the pause button holds it, and under reduced motion it is a row you scroll by hand. Tapping a
// card's photo or name opens the dish (Shop.jsx DishDialog).
const LABEL = { fish: "Fish Neymeen" };
const TILT = ["-rotate-2", "rotate-1", "-rotate-1", "rotate-2", "-rotate-[1.5deg]"];

function Card({ x, i, copy, onOpen }) {
  return (
    <li className="w-[min(72vw,22rem)] shrink-0 px-2.5 sm:px-3.5">
      <article className={`group flex h-full flex-col overflow-hidden rounded-[2rem] bg-white shadow-[0_34px_60px_-32px_rgba(150,50,20,0.55)] transition-[rotate,translate] duration-500 ease-[cubic-bezier(.2,.8,.2,1)] hover:-translate-y-2 hover:rotate-0 ${TILT[i]}`}>
        <button onClick={() => onOpen(x)} tabIndex={copy ? -1 : 0} aria-label={`See ${x.full}`} className="block cursor-zoom-in text-left">
          <div className="px-6 pb-5 pt-8 text-center">
            <h3 className="font-serif text-4xl font-medium leading-[1.02] text-crimson">
              {LABEL[x.id] || x.name}
              <span className="block">Biriyani</span>
            </h3>
            <p className="mt-3 text-sm text-crimson/80">
              {x.meat} · {x.weight}
            </p>
          </div>
          <div className="relative aspect-[5/4] overflow-hidden rounded-t-[1.75rem]">
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img src={`/plates/shop/${x.id}.jpg`} alt="" width="928" height="1152" loading="lazy" className="h-full w-full object-cover transition-[scale] duration-[1200ms] ease-[cubic-bezier(.2,.8,.2,1)] group-hover:scale-105" />
          </div>
        </button>
        <div className="flex items-center justify-between gap-3 px-5 py-4">
          <span className="flex flex-col">
            <Price value={x.price} className="text-2xl text-ink" />
            <Heat n={x.heat} className="text-ink/60" />
          </span>
          <button
            onClick={(e) => {
              add(x.id);
              flyToCart(e.currentTarget, `/plates/dish/${x.id}.webp`);
            }}
            disabled={!x.available}
            tabIndex={copy ? -1 : 0}
            className="min-h-11 rounded-full bg-crimson px-5 text-sm font-semibold text-ivory transition-[background-color,scale] duration-200 hover:bg-crimson-deep active:scale-[0.96] disabled:opacity-40"
            aria-label={`Add ${x.full} to cart`}
          >
            {x.available ? "Add to cart" : "Sold out"}
          </button>
        </div>
      </article>
    </li>
  );
}

export default function Flavours() {
  const root = useRef(null);
  const on = useOnScreen(root);
  const [paused, setPaused] = useState(false);
  const [open, setOpen] = useState(null); // the dish whose card is popped up
  const still = !on || paused || open;
  return (
    <section ref={root} id="flavours" aria-label="Choose your biriyani" className="relative z-10 overflow-hidden bg-[linear-gradient(to_bottom,var(--color-peach)_0_50%,var(--color-crimson)_50%_100%)] pb-14 pt-20">
      <div aria-hidden className="waves absolute inset-x-0 bottom-0 top-1/2" />
      <div className="relative px-5 text-center">
        <p className="lift text-[11px] uppercase tracking-[0.35em] text-copper-deep">Fresh from the handi</p>
        <h2 className="lift mt-3 font-serif text-5xl font-medium leading-[0.98] text-crimson sm:text-6xl">
          Flavour in <em>every bite.</em>
        </h2>
      </div>

      <div className="relative mt-10 overflow-hidden py-8 motion-reduce:overflow-x-auto">
        <div className="marquee flex w-max" style={{ animationDuration: "48s", animationPlayState: still ? "paused" : "running" }}>
          {[0, 1].map((copy) => (
            <ul key={copy} aria-hidden={copy === 1} aria-label={copy ? undefined : "Biriyanis"} className="flex">
              {DISHES.map((x, i) => (
                <Card key={x.id} x={x} i={i} copy={copy} onOpen={setOpen} />
              ))}
            </ul>
          ))}
        </div>
      </div>

      <div className="relative mt-2 flex justify-center text-ivory">
        <button onClick={() => setPaused((v) => !v)} aria-pressed={paused} className="inline-flex min-h-11 items-center gap-2 rounded-full px-4 text-xs font-semibold uppercase tracking-[0.2em] text-ivory/85 transition hover:bg-ivory/15 motion-reduce:hidden">
          {paused ? "▶ Play" : "❚❚ Pause"}
        </button>
      </div>

      <DishDialog x={open} onClose={() => setOpen(null)} />
    </section>
  );
}
