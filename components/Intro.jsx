"use client";

import { useEffect, useRef, useState } from "react";
import gsap from "gsap";
import { ScrollTrigger } from "gsap/ScrollTrigger";
import { DISHES, add, inr, setFlavor, useShop } from "./cart";
import { Heat } from "./icons";
import { flyToCart } from "./fly";
import { useOnScreen } from "./hooks";
import { magnet, unmagnet } from "./Shop";
import Dust from "./Dust";

// Scene A: a split hero. The words' half takes each dish's own light palette (THEMES); the other half is matte
// charcoal carrying the selected biriyani's own photograph (SLIDES: dark kitchen and daylight overhead shots in turn), with
// live steam drifting up out of its pot (CSS) and a slow drift of saffron dust (Dust). The dishes slide in from the side and
// out the other (direction-aware), each held about 3.5 s, on a loop while on screen (pause button); dots, arrows, a
// sideways swipe or scroll change it by hand. The flavours panel opens only from its floating button. As you scroll
// away the photograph eases closer and the words lift away (GSAP scrub). The next photo loads ahead of its turn.
const STEP_MS = 4600; // about 3.5 s on show, plus the slide
const SEA = ["fish", "prawn"];
const FILTERS = [
  ["All", () => true],
  ["Meat", (x) => !SEA.includes(x.id)],
  ["Seafood", (x) => SEA.includes(x.id)],
  ["Spicy", (x) => x.heat >= 3],
];
// Each dish's light palette for the words' half: ground, accent (headline, price, buttons, dots; dark enough to carry
// white text) and ink. Applied as animatable colour properties (globals.css .hero-theme), so all of it shifts together.
const THEMES = {
  chicken: { bg: "#fbe3b0", accent: "#a8500f", ink: "#47290c" }, // warm golden cream
  mutton: { bg: "#f1bea3", accent: "#8f3418", ink: "#45190c" }, // spiced terracotta
  beef: { bg: "#f6cfc4", accent: "#9b2a1c", ink: "#43150e" }, // smoked chilli rose
  fish: { bg: "#d8e8d0", accent: "#2f6040", ink: "#1d3826" }, // herb and sage
  prawn: { bg: "#ffdcbd", accent: "#c2410c", ink: "#4a220a" }, // light citrus orange
};
// Each dish's own photograph for the hero, keyed by dish id (never by position), alternating two real shoots so the
// slides differ: "side" is the low, dark kitchen shot (the dish on a banana leaf, its opened handi steaming behind),
// "top" the daylight overhead shot on cream stone. Steam sits over that photo's own pot (left, top, width, height in %
// of the photo frame). Chosen for the clearest view of each dish's meat: chicken legs, bone-in mutton, beef with green
// chilli, whole fish fillets, prawns. A missing photo falls back to the dish's plate from above.
const SLIDES = {
  chicken: { src: "/plates/reveal.jpg", look: "side", alt: "chicken legs on biriyani on a banana leaf, the opened handi steaming behind" },
  mutton: { src: "/plates/shop/mutton.jpg", look: "top", pos: "50% 45%", steam: [26, 18, 48, 34], alt: "bone-in mutton biriyani in a copper pot, from above" },
  beef: { src: "/plates/reveal-beef.jpg", look: "side", alt: "beef biriyani with green chilli and ginger on a banana leaf, the opened handi steaming behind" },
  fish: { src: "/plates/shop/fish.jpg", look: "top", pos: "50% 48%", steam: [26, 20, 48, 34], alt: "fish biriyani with seared seer fish in a copper pot, from above" },
  prawn: { src: "/plates/reveal-prawn.jpg", look: "side", alt: "prawn biriyani on a banana leaf, the opened handi steaming behind" },
};
const fallback = (id) => (e) => {
  const img = e.currentTarget;
  if (img.dataset.fb) return;
  img.dataset.fb = "1";
  img.src = `/plates/dish/${id}.webp`;
  img.style.objectFit = "contain";
};
// Steam wisps: left %, loop seconds, start offset, sway.
const WISPS = [[22, 7, 0, "-14%"], [38, 8.5, -2.2, "12%"], [52, 6.5, -4.1, "-10%"], [30, 9, -5.6, "16%"], [46, 7.5, -1.3, "-18%"], [60, 8, -3.4, "8%"]];
const C = (pct) => `color-mix(in srgb, var(--hero-ink) ${pct}%, transparent)`;

// The frosted quick-selector: flavour filters, each dish with its spice and price, and the order button.
function QuickOrder({ list, d, filter, setFilter, pick }) {
  return (
    <div className="rounded-3xl bg-[#1b1512]/55 p-4 text-ivory shadow-[0_30px_60px_-30px_rgb(0_0_0/0.8)] ring-1 ring-white/20 backdrop-blur-xl">
      <div role="group" aria-label="Filter by flavour" className="flex flex-wrap gap-1.5">
        {FILTERS.map(([label], k) => (
          <button key={label} aria-pressed={filter === k} onClick={() => setFilter(k)} className={`min-h-9 rounded-full px-3 text-xs font-medium transition ${filter === k ? "bg-ivory text-ink" : "bg-white/10 hover:bg-white/20"}`}>
            {label}
          </button>
        ))}
      </div>
      <ul className="mt-3 space-y-0.5">
        {list.map((x) => {
          const on = x.id === d.id;
          return (
            <li key={x.id}>
              <button onClick={() => pick(x.id)} aria-pressed={on} className={`flex w-full items-center gap-3 rounded-2xl p-1.5 text-left transition ${on ? "bg-white/15 ring-1 ring-white/30" : "hover:bg-white/10"}`}>
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img src={`/plates/dish/${x.id}.webp`} alt="" width="80" height="80" className="h-9 w-9 shrink-0 rounded-full object-cover" />
                <span className="min-w-0 flex-1">
                  <span className="block truncate text-sm font-medium">{x.full}</span>
                  <Heat n={x.heat} className="text-saffron" />
                </span>
                <span className="shrink-0 text-sm tabular-nums text-ivory/85">{inr(x.price)}</span>
              </button>
            </li>
          );
        })}
      </ul>
      <button
        onPointerMove={magnet}
        onPointerLeave={unmagnet}
        onClick={(e) => {
          add(d.id);
          flyToCart(e.currentTarget, `/plates/dish/${d.id}.webp`);
        }}
        disabled={!d.available}
        className="magnetic-btn mt-3 flex min-h-12 w-full items-center justify-between rounded-full bg-crimson pl-5 pr-1.5 text-sm font-semibold text-ivory shadow-[0_16px_30px_-14px_rgb(0_0_0/0.8)] disabled:opacity-50"
      >
        {d.available ? "Order Biriyani" : "Sold out"}
        <span className="rounded-full bg-ivory px-3.5 py-2 tabular-nums text-crimson-deep">{inr(d.price)}</span>
      </button>
    </div>
  );
}

export default function Intro() {
  const { flavor } = useShop();
  const root = useRef(null);
  const onScreen = useOnScreen(root);
  const [filter, setFilter] = useState(0);
  const [paused, setPaused] = useState(false);
  const [seen, setSeen] = useState(["chicken"]);
  const [menu, setMenu] = useState(false); // the flavours panel, closed until asked for
  const panel = useRef(null);
  const swipeAt = useRef({ x: null, wheel: 0 });
  const stack = useRef(null);
  const shown = useRef(null); // the dish on screen before this change
  const dir = useRef(1); // 1: the next dish comes in from the right; -1: from the left
  const list = DISHES.filter(FILTERS[filter][1]);
  const d = list.find((x) => x.id === flavor) || list[0];
  const i = list.indexOf(d);
  const t = THEMES[d.id];
  const pick = (id, step = DISHES.findIndex((x) => x.id === id) >= DISHES.findIndex((x) => x.id === d.id) ? 1 : -1) => {
    dir.current = step > 0 ? 1 : -1;
    setFlavor(id);
  };
  const go = (step) => pick(list[(i + step + list.length) % list.length].id, step);

  useEffect(() => {
    if (d.id !== flavor) setFlavor(d.id);
    // This dish's photo, and the next one's ahead of time so it never slides in blank.
    const next = list[(i + 1) % list.length].id;
    setSeen((s) => [...new Set([...s, d.id, next])]);
  }, [d.id, flavor]); // eslint-disable-line react-hooks/exhaustive-deps
  // The slide: the new photo comes in from one side as the last one leaves by the other.
  useEffect(() => {
    const from = shown.current;
    shown.current = d.id;
    if (!from || from === d.id || matchMedia("(prefers-reduced-motion: reduce)").matches) return;
    const el = (id) => stack.current?.querySelector(`[data-id="${id}"]`);
    const opts = { duration: 1100, easing: "cubic-bezier(.7,0,.2,1)" };
    el(d.id)?.animate([{ transform: `translateX(${dir.current * 100}%)`, opacity: 1 }, { transform: "none", opacity: 1 }], opts);
    el(from)?.animate([{ transform: "none", opacity: 1 }, { transform: `translateX(${-dir.current * 100}%)`, opacity: 1 }], opts);
  }, [d.id]);
  useEffect(() => {
    if (!onScreen || paused || matchMedia("(prefers-reduced-motion: reduce)").matches) return;
    const tm = setTimeout(() => go(1), STEP_MS);
    return () => clearTimeout(tm);
  }, [onScreen, paused, d.id, filter]); // eslint-disable-line react-hooks/exhaustive-deps
  // Esc or a click elsewhere closes the flavours panel.
  useEffect(() => {
    if (!menu) return;
    const key = (e) => e.key === "Escape" && setMenu(false);
    const away = (e) => !panel.current?.contains(e.target) && setMenu(false);
    addEventListener("keydown", key);
    addEventListener("pointerdown", away);
    return () => (removeEventListener("keydown", key), removeEventListener("pointerdown", away));
  }, [menu]);
  // As you scroll away, the photograph eases closer and the words lift away.
  useEffect(() => {
    if (matchMedia("(prefers-reduced-motion: reduce)").matches) return;
    gsap.registerPlugin(ScrollTrigger);
    const q = gsap.utils.selector(root);
    const st = { trigger: root.current, start: "top top", end: "bottom top", scrub: 0.5 };
    const a = gsap.to(q(".hero-zoom"), { scale: 1.1, yPercent: 5, ease: "none", scrollTrigger: st });
    const b = gsap.to(q(".hero-words"), { yPercent: -14, opacity: 0, ease: "none", scrollTrigger: { ...st, end: "70% top" } });
    return () => [a, b].forEach((tw) => (tw.scrollTrigger?.kill(), tw.kill()));
  }, []);

  const swipe = {
    onPointerDown: (e) => (swipeAt.current.x = e.clientX),
    onPointerUp: (e) => {
      const dx = e.clientX - (swipeAt.current.x ?? e.clientX);
      if (Math.abs(dx) > 70) go(dx < 0 ? 1 : -1);
      swipeAt.current.x = null;
    },
    onWheel: (e) => {
      if (Math.abs(e.deltaX) < 30 || Math.abs(e.deltaX) < Math.abs(e.deltaY) || Date.now() - swipeAt.current.wheel < 700) return;
      swipeAt.current.wheel = Date.now();
      go(e.deltaX > 0 ? 1 : -1);
    },
  };

  return (
    <section ref={root} id="top" aria-label="Royal Dum Heritage" className="hero-theme relative z-10 overflow-hidden bg-paper text-[var(--hero-ink)]" style={{ "--hero-bg": t.bg, "--hero-accent": t.accent, "--hero-ink": t.ink }}>
      <div className="grid min-h-[100svh] grid-cols-1 md:grid-cols-[minmax(0,1fr)_minmax(0,1fr)]">
        {/* The words, on the dish's palette. */}
        <div className="grain relative z-10 flex flex-col justify-center bg-[var(--hero-bg)] px-5 pb-8 pt-24 sm:px-10 md:pb-12 md:pl-[max(2.5rem,calc((100vw-80rem)/2+2.5rem))] md:pr-10">
          <div className="hero-words">
            <p className="intro-line text-[11px] uppercase tracking-[0.35em] text-[var(--hero-accent)]" style={{ "--d": "0s" }}>Malabar dum biriyani · Kerala</p>
            <h1 className="mt-4 font-serif text-[clamp(3.4rem,6.6vw,6rem)] font-semibold leading-[0.88] tracking-[-0.01em]">
              <span className="block overflow-hidden pb-1"><span className="intro-cut block" style={{ "--d": "0.1s" }}>Royal Dum</span></span>
              <span className="block overflow-hidden pb-2"><em className="intro-cut block font-medium text-[var(--hero-accent)]" style={{ "--d": "0.2s" }}>Heritage</em></span>
            </h1>
            <p className="intro-line mt-4 max-w-sm font-serif text-xl italic leading-snug" style={{ "--d": "0.35s", color: C(75) }}>
              From our chembu to your doorstep.
            </p>
            <div className="intro-line mt-8 overflow-hidden border-t pt-6" style={{ "--d": "0.45s", borderColor: C(15) }}>
              <div key={d.id} aria-live="polite" className="slide-in" style={{ "--dir": dir.current }}>
                <p className="font-serif text-3xl leading-tight sm:text-4xl">
                  {d.full} <span className="text-[var(--hero-accent)]">· {inr(d.price)}</span>
                </p>
                <p className="mt-2 max-w-md text-sm leading-relaxed" style={{ color: C(75) }}>{d.note}</p>
                <p className="mt-2 flex flex-wrap items-center gap-x-3 gap-y-1 text-xs" style={{ color: C(65) }}>
                  <span>{d.serves}</span>
                  <span>{d.weight}</span>
                  <span>{d.meat}</span>
                  <Heat n={d.heat} className="text-[var(--hero-accent)]" />
                </p>
              </div>
            </div>
            <div className="intro-line mt-7 flex flex-wrap items-center gap-3" style={{ "--d": "0.55s" }}>
              <a href="#menu" className="inline-flex min-h-13 items-center rounded-full bg-[var(--hero-accent)] px-7 text-sm font-semibold text-ivory shadow-[0_16px_30px_-16px_rgba(60,20,5,0.7)] transition-[filter,scale] duration-200 hover:brightness-90 active:scale-[0.97]">
                Explore the Menu
              </a>
              <a href="#story" className="inline-flex min-h-13 items-center rounded-full border px-6 text-sm font-semibold transition hover:border-[var(--hero-ink)]" style={{ borderColor: C(25) }}>
                Discover Our Story
              </a>
            </div>
            <div className="intro-line mt-6 flex items-center gap-2" style={{ "--d": "0.65s" }}>
              <button onClick={() => go(-1)} aria-label="Previous biriyani" className="grid h-11 w-11 place-items-center rounded-full ring-1 transition hover:bg-white/40" style={{ "--tw-ring-color": C(20) }}>←</button>
              <div role="group" aria-label="Choose a biriyani" className="flex items-center">
                {list.map((x) => (
                  <button key={x.id} onClick={() => pick(x.id)} aria-label={x.full} aria-pressed={x.id === d.id} className="grid h-11 w-7 place-items-center">
                    <span className={`block h-2 rounded-full transition-all duration-500 ${x.id === d.id ? "w-6 bg-[var(--hero-accent)]" : "w-2"}`} style={x.id === d.id ? undefined : { backgroundColor: C(30) }} />
                  </button>
                ))}
              </div>
              <button onClick={() => go(1)} aria-label="Next biriyani" className="grid h-11 w-11 place-items-center rounded-full ring-1 transition hover:bg-white/40" style={{ "--tw-ring-color": C(20) }}>→</button>
              <button onClick={() => setPaused((p) => !p)} aria-pressed={paused} aria-label={paused ? "Play the showcase" : "Pause the showcase"} className="grid h-11 w-11 place-items-center rounded-full text-xs transition hover:bg-white/40 motion-reduce:hidden" style={{ color: C(55) }}>
                {paused ? "▶" : "❚❚"}
              </button>
            </div>
          </div>
        </div>

        {/* Charcoal: the food, the steam, the dust, the flavours button. */}
        <div className="grain-dark relative isolate min-h-[64svh] touch-pan-y overflow-hidden bg-[#1b1512] md:min-h-0" {...swipe}>
          <div className="hero-zoom absolute inset-0">
            <div ref={stack} className="intro-photo absolute inset-0">
              {DISHES.filter((x) => seen.includes(x.id)).map((x) => {
                const sl = SLIDES[x.id];
                const on = x.id === d.id;
                const steam = (light) =>
                  WISPS.map(([left, tt, delay, sway], k) => <span key={k} className={`smoke ${light ? "smoke-light" : ""}`} style={{ left: `${left}%`, "--t": `${tt}s`, "--dl": `${delay}s`, "--sx": sway }} />);
                return (
                  <div key={x.id} data-id={x.id} aria-hidden={!on} className={`absolute inset-0 overflow-hidden ${on ? "opacity-100" : "opacity-0"}`}>
                    {sl.look === "side" ? (
                      // The wide kitchen shot, framed on the dish (its right side) with the steaming handi's edge beside it.
                      <div className="absolute inset-y-0 left-1/2 aspect-[1376/768] h-full -translate-x-[68%]">
                        {/* eslint-disable-next-line @next/next/no-img-element */}
                        <img src={sl.src} alt={on ? `${x.full}: ${sl.alt}` : ""} width="1376" height="768" fetchPriority={x.id === "chicken" ? "high" : "auto"} onError={fallback(x.id)} className="absolute inset-0 h-full w-full object-cover" />
                        <div aria-hidden className="absolute left-[30%] top-0 h-[40%] w-[34%]">{steam(false)}</div>
                      </div>
                    ) : (
                      // The overhead shot fills the frame (a touch of zoom trims the photo's own edge); steam over the pot.
                      <>
                        {/* eslint-disable-next-line @next/next/no-img-element */}
                        <img src={sl.src} alt={on ? `${x.full}: ${sl.alt}` : ""} width="928" height="1152" onError={fallback(x.id)} className="absolute inset-0 h-full w-full scale-[1.04] object-cover" style={{ objectPosition: sl.pos }} />
                        <div aria-hidden className="absolute" style={{ left: `${sl.steam[0]}%`, top: `${sl.steam[1]}%`, width: `${sl.steam[2]}%`, height: `${sl.steam[3]}%` }}>{steam(true)}</div>
                      </>
                    )}
                  </div>
                );
              })}
            </div>
          </div>
          {/* Warm light from below in the dish's accent, and a soft seam where the two halves meet. */}
          <div aria-hidden className="pointer-events-none absolute inset-0" style={{ background: "radial-gradient(60% 45% at 60% 100%, color-mix(in srgb, var(--hero-accent) 40%, transparent), transparent), linear-gradient(to right, color-mix(in srgb, var(--hero-bg) 55%, transparent), transparent 14%)" }} />
          <Dust run={onScreen} />
          {/* The flavours, on request: a floating button, and the panel sliding in beside it. */}
          <div ref={panel} className="absolute right-4 top-20 z-10 flex w-[min(19rem,calc(100%-2rem))] flex-col items-end sm:right-5">
            <button
              onClick={() => setMenu((m) => !m)}
              aria-expanded={menu}
              aria-controls="hero-flavours"
              className="intro-line flex min-h-11 items-center gap-2 rounded-full bg-[#1b1512]/60 px-4 text-sm font-medium text-ivory ring-1 ring-white/25 backdrop-blur-xl transition hover:bg-[#1b1512]/80"
              style={{ "--d": "0.6s" }}
            >
              <span aria-hidden className="grid h-5 w-5 place-items-center">
                {menu ? "×" : <svg viewBox="0 0 20 20" className="h-4 w-4" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round"><path d="M4 6h12M4 10h12M4 14h8" /></svg>}
              </span>
              {menu ? "Close" : "View flavours"}
            </button>
            <aside
              id="hero-flavours"
              aria-label="Quick order"
              inert={!menu}
              className={`mt-2 w-full transition-[opacity,translate] duration-500 ease-[cubic-bezier(.2,.8,.2,1)] ${menu ? "translate-x-0 opacity-100" : "pointer-events-none translate-x-[110%] opacity-0"}`}
            >
              <QuickOrder list={list} d={d} filter={filter} setFilter={setFilter} pick={pick} />
            </aside>
          </div>
        </div>
      </div>
    </section>
  );
}
