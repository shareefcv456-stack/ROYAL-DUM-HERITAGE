"use client";

import { useEffect, useRef, useState } from "react";
import gsap from "gsap";
import { ScrollTrigger } from "gsap/ScrollTrigger";
import { DISHES, add, inr, useShop } from "./cart";

// The Flavour Wheel: a short pinned section where scrolling turns a ring of the five biriyanis. The one at the focal
// point takes over the stage: its background, highlight colour, name (cut in with a mask) and its own ingredients
// floating round the wheel at different parallax speeds. Scroll writes CSS variables directly (--x: position along
// the menu, --p: 0–1); React only re-renders when the active flavour changes.

const N = DISHES.length;
const STEP = 360 / N;
// Thumb positions round the ring, rounded once here: the browser normalises CSS numbers to 6 significant digits,
// so unrounded trig (9.549150281252622%) would differ from the server's HTML and break hydration. `+` drops
// trailing zeros the same way the browser does ("50%", not "50.00%").
const RING = DISHES.map((_, i) => {
  const a = (i * STEP * Math.PI) / 180;
  return { left: `${+(50 + 50 * Math.cos(a)).toFixed(2)}%`, top: `${+(50 + 50 * Math.sin(a)).toFixed(2)}%` };
});
// Where each floating sprite sits round the wheel (% of the wheel box), its size, and its parallax speed. On phones
// the copy sits right under the wheel, so only the top two show there.
const SPOTS = [
  { at: "left-[-6%] top-[2%]", w: "w-[24%]", speed: 1.4, dur: "9s", spin: "12deg" },
  { at: "right-[-8%] top-[12%]", w: "w-[28%]", speed: -1, dur: "11s", spin: "-10deg" },
  { at: "left-[-2%] bottom-[0%]", w: "w-[20%]", speed: -1.6, dur: "10s", spin: "8deg" },
  { at: "right-[-4%] bottom-[-4%]", w: "w-[17%]", speed: 1.1, dur: "13s", spin: "-14deg" },
];
const SPICES = new Set(["cardamom", "cinnamon", "clove", "star-anise", "saffron"]);
const sprite = (n) => `/plates/${SPICES.has(n) ? "spice" : "float"}/${n}.webp`;

export default function Flavours() {
  const root = useRef(null);
  const [active, setActive] = useState(0);
  const [added, setAdded] = useState(-1);
  const { cart } = useShop();
  const d = DISHES[active];

  useEffect(() => {
    gsap.registerPlugin(ScrollTrigger);
    const el = root.current;
    let current = 0;
    const st = ScrollTrigger.create({
      trigger: el,
      start: "top top",
      end: "bottom bottom",
      onUpdate: (s) => {
        const x = s.progress * (N - 1);
        el.style.setProperty("--x", x.toFixed(4));
        el.style.setProperty("--p", s.progress.toFixed(4));
        const i = Math.round(x);
        if (i !== current) setActive((current = i));
      },
    });
    return () => st.kill();
  }, []);

  useEffect(() => {
    if (added < 0) return;
    const id = setTimeout(() => setAdded(-1), 1400);
    return () => clearTimeout(id);
  }, [added]);

  // Jump the scroll to a flavour's stop on the wheel.
  const go = (i) => {
    const el = root.current;
    const top = el.getBoundingClientRect().top + scrollY;
    scrollTo({ top: top + (i / (N - 1)) * (el.offsetHeight - innerHeight), behavior: matchMedia("(prefers-reduced-motion: reduce)").matches ? "auto" : "smooth" });
  };

  return (
    <section id="flavours" ref={root} aria-label="The five biriyanis" className="relative z-10" style={{ height: `${N * 70 + 30}svh`, "--x": 0, "--p": 0 }}>
      <div className="veins sticky top-0 flex h-[100svh] flex-col overflow-hidden text-ivory transition-colors duration-700 md:flex-row md:items-center" style={{ backgroundColor: d.theme.bg }}>
        {/* Highlight glow and the big outlined number, both in the flavour's own colour. */}
        <div className="pointer-events-none absolute right-[-10%] top-1/2 h-[90vmin] w-[90vmin] -translate-y-1/2 rounded-full opacity-25 blur-3xl transition-colors duration-700" style={{ backgroundColor: d.theme.hi }} />
        <span
          aria-hidden
          className="pointer-events-none absolute -bottom-[0.18em] left-[2vw] font-serif text-[38vmin] leading-none text-transparent transition-[-webkit-text-stroke-color] duration-700 md:left-auto md:right-[2vw]"
          style={{ WebkitTextStroke: `1px ${d.theme.hi}66` }}
        >
          0{active + 1}
        </span>

        {/* The wheel: the ring turns with scroll; thumbs stay upright and jump to their flavour. */}
        <div className="relative order-1 mx-auto mt-[calc(4rem+3svh)] aspect-square w-[min(74vw,40svh)] shrink-0 md:order-2 md:mx-0 md:ml-auto md:mr-[8vw] md:mt-0 md:w-[min(40vw,72svh)]">
          {DISHES.map((x, i) =>
            SPOTS.map((s, k) => (
              // eslint-disable-next-line @next/next/no-img-element
              <img
                key={`${x.id}${k}`}
                src={sprite(x.floats[k])}
                alt=""
                aria-hidden
                width="256"
                height="256"
                loading="lazy"
                className={`pointer-events-none absolute z-20 ${s.at} ${s.w} transition-opacity duration-700 ${k > 1 ? "max-md:hidden" : ""} ${i === active ? "opacity-100" : "opacity-0"}`}
                style={{ transform: `translate3d(0, calc((var(--p) - 0.5) * ${s.speed * -160}px), 0)` }}
              />
            ))
          )}
          <div className="absolute inset-0 rounded-full border border-dashed transition-colors duration-700" style={{ borderColor: `${d.theme.hi}55`, transform: `rotate(calc(180deg - var(--x) * ${STEP}deg))` }}>
            {DISHES.map((x, i) => {
              return (
                <button
                  key={x.id}
                  onClick={() => go(i)}
                  aria-label={`Show ${x.title}`}
                  aria-current={i === active}
                  className={`absolute z-10 h-[16%] w-[16%] -translate-x-1/2 -translate-y-1/2 overflow-hidden rounded-full ring-2 transition-[box-shadow,filter] duration-500 ${i === active ? "ring-ivory" : "ring-transparent brightness-75 hover:brightness-100"}`}
                  style={{ ...RING[i], rotate: `calc(var(--x) * ${STEP}deg - 180deg)` }}
                >
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  <img src={`/plates/dish/${x.id}.webp`} alt="" width="120" height="120" loading="lazy" className="h-full w-full object-cover" />
                </button>
              );
            })}
          </div>
          <div className="absolute inset-[17%] rounded-full shadow-[0_40px_70px_-20px_rgba(0,0,0,0.8)] ring-8 ring-copper/85" />
          {DISHES.map((x, i) => (
            // eslint-disable-next-line @next/next/no-img-element
            <img
              key={x.id}
              src={`/plates/dish/${x.id}.webp`}
              alt={i === active ? `${x.full}, seen from above` : ""}
              aria-hidden={i !== active}
              width="720"
              height="720"
              loading="lazy"
              className={`absolute inset-[17%] h-[66%] w-[66%] rounded-full object-cover transition-[opacity,transform] duration-700 ease-[cubic-bezier(.2,.8,.2,1)] ${i === active ? "rotate-0 scale-100 opacity-100" : i < active ? "-rotate-45 scale-90 opacity-0" : "rotate-45 scale-90 opacity-0"}`}
            />
          ))}
        </div>

        {/* The copy: kicker, the name cut in line by line, the dish, and ordering. */}
        <div className="relative order-2 px-5 pb-[calc(5rem+env(safe-area-inset-bottom))] pt-6 sm:px-10 md:order-1 md:max-w-[34rem] md:pb-0 md:pl-[7vw] md:pt-0">
          <p className="text-[11px] uppercase tracking-[0.35em]" style={{ color: d.theme.hi }}>
            Flavour {active + 1} / {N}
          </p>
          <div key={d.id} className="cut-in" aria-live="polite">
            <h2 className="mt-3 font-serif text-5xl font-medium leading-[0.95] sm:text-7xl">
              <span className="block overflow-hidden pb-1">
                <span className="block">{d.title.split(" ")[0]}</span>
              </span>
              <span className="block overflow-hidden pb-2">
                <em className="block" style={{ color: d.theme.hi }}>{d.title.split(" ").slice(1).join(" ") || "Biriyani"}</em>
              </span>
            </h2>
            <p className="mt-3 max-w-md text-ivory/80">{d.note}</p>
            <ul className="mt-4 hidden flex-wrap gap-2 sm:flex">
              {d.layers.map((l) => (
                <li key={l} className="rounded-full border border-ivory/20 px-3 py-1 text-xs text-ivory/75">
                  {l}
                </li>
              ))}
            </ul>
            <p className="mt-5 flex items-baseline gap-4">
              <span className="text-2xl font-semibold tabular-nums">{inr(d.price)}</span>
              <span className="text-sm text-ivory/65">{d.serves} · {d.weight}</span>
            </p>
          </div>
          <div className="mt-5 flex flex-wrap items-center gap-3">
            <button
              onClick={() => {
                add(d.id);
                setAdded(active);
              }}
              disabled={!d.available}
              className="min-h-12 rounded-full px-7 text-sm font-semibold text-ink transition hover:brightness-110 disabled:opacity-40"
              style={{ backgroundColor: d.theme.hi }}
            >
              {added === active ? "Added ✓" : cart[d.id] ? `Add another · ${cart[d.id]} in cart` : "Add to cart"}
            </button>
            <a href="#menu" className="inline-flex min-h-12 items-center rounded-full border border-ivory/30 px-6 text-sm font-semibold transition hover:border-ivory">
              Full menu
            </a>
          </div>
          {/* Step through the five without scrolling: keyboard and switch users. */}
          <div className="mt-6 hidden gap-2 md:flex" role="group" aria-label="Flavours">
            {DISHES.map((x, i) => (
              <button key={x.id} onClick={() => go(i)} aria-label={x.title} aria-current={i === active} className="grid h-10 w-10 place-items-center">
                <span className={`h-1 w-8 rounded-full transition-colors duration-500 ${i === active ? "bg-ivory" : "bg-ivory/25"}`} />
              </button>
            ))}
          </div>
        </div>
      </div>
    </section>
  );
}
