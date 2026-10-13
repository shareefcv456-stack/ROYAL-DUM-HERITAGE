"use client";

import { flyToCart } from "./fly";
import { useEffect, useRef, useState } from "react";
import gsap from "gsap";
import {
  ADDONS, DELIVERY_FEE, DISHES, slugOf, MAX_QTY, PICKUP, SAMPLE, WHATSAPP, add, dish, inr, orderMessage, pinStatus, placeOrder, setDraft, setFulfil, setOpen,
  setQty, setStep, totals, useShop,
} from "./cart";
import { Bucket, Heat, Price, PriceBadge } from "./icons";

// The light editorial shop: flavour switcher with the layer breakdown, the full menu, add-ons, and the slide-over
// cart with checkout, on the cream "paper".

// − n + with 40px touch targets.
export function Qty({ value, onChange, label, min = 0 }) {
  return (
    <div className="qty-in flex w-fit items-center self-start rounded-full bg-white shadow-[0_8px_20px_-12px_rgb(56_37_30/0.45)] ring-1 ring-ink/10" role="group" aria-label={`${label} quantity`}>
      <button type="button" onClick={() => onChange(value - 1)} disabled={value <= min} className="grid h-10 w-10 place-items-center rounded-full text-lg leading-none transition hover:bg-ink/5 active:scale-90 disabled:opacity-30" aria-label={`One fewer ${label}`}>
        −
      </button>
      <span className="w-8 text-center text-sm font-semibold tabular-nums" aria-live="polite">{value}</span>
      <button type="button" onClick={() => onChange(value + 1)} disabled={value >= MAX_QTY} className="grid h-10 w-10 place-items-center rounded-full bg-crimson text-lg leading-none text-ivory transition hover:bg-crimson-deep active:scale-90 disabled:opacity-30" aria-label={`One more ${label}`}>
        +
      </button>
    </div>
  );
}

function Availability({ ok }) {
  return <span className={`text-[10px] uppercase tracking-[0.3em] ${ok ? "text-heritage" : "text-ink/40"}`}>{ok ? "Available" : "Sold out"}</span>;
}

// Shown while the menu is a sample or orders go nowhere, so nobody mistakes the demo for a live shop.
export function DemoNotice({ className = "" }) {
  if (!SAMPLE && WHATSAPP) return null;
  return (
    <p className={`rounded-lg border border-copper/30 bg-ivory px-4 py-3 text-xs leading-relaxed text-ink/75 ${className}`}>
      <strong className="font-semibold text-ink">Demo store.</strong>{" "}
      {SAMPLE && "Menu, portions and prices are samples, not the restaurant's. "}
      {!WHATSAPP && "Checkout confirms on screen only: no order is sent and no payment is taken."}
    </p>
  );
}

// Magnetic cards: lean a few pixels toward a mouse cursor (not touch, not reduced motion); CSS does the easing.
export const magnet = (e) => {
  if (e.pointerType !== "mouse" || matchMedia("(prefers-reduced-motion: reduce)").matches) return;
  const el = e.currentTarget;
  const r = el.getBoundingClientRect();
  el.style.setProperty("--mx", `${((e.clientX - r.left) / r.width - 0.5) * 12}px`);
  el.style.setProperty("--my", `${((e.clientY - r.top) / r.height - 0.5) * 12}px`);
};
export const unmagnet = (e) => ["--mx", "--my"].forEach((k) => e.currentTarget.style.removeProperty(k));

// Add: the button becomes a quantity stepper at once; AddedNote confirms page-wide.
export function AddControl({ x, qty, compact }) {
  if (!x.available) return <span className="text-sm text-ink/45">Sold out</span>;
  return qty ? (
    <Qty value={qty} onChange={(n) => setQty(x.id, n)} label={x.full} />
  ) : (
    <button
      onClick={(e) => {
        add(x.id);
        flyToCart(e.currentTarget, dish(x.id) && `/plates/dish/${x.id}.webp`);
      }}
      className="group/add inline-flex min-h-11 items-center gap-2 rounded-full bg-crimson pl-2 pr-5 text-sm font-semibold text-ivory shadow-[0_12px_24px_-12px_rgb(168_48_26/0.8)] transition-[background-color,scale,box-shadow] duration-300 hover:bg-crimson-deep hover:shadow-[0_16px_30px_-12px_rgb(168_48_26/0.9)] active:scale-[0.95]"
      aria-label={`Add ${x.full} to cart, ${inr(x.price)}`}
    >
      <span aria-hidden className="grid h-7 w-7 place-items-center rounded-full bg-ivory/20 text-base leading-none transition-transform duration-300 group-hover/add:rotate-90">+</span>
      {compact ? "Add" : "Add to cart"}
    </button>
  );
}

// A dish, opened (from the menu or the Flavours strip): large photo, the recipe layer by layer, portion, quantity
// and the sides, added together. A native <dialog>, so focus, Esc and the backdrop come with it; the backdrop closes it.
export function DishDialog({ x, onClose }) {
  const ref = useRef(null);
  const [qty, setN] = useState(1);
  const [sides, setSides] = useState([]);
  useEffect(() => {
    if (!x) return;
    setN(1);
    setSides([]);
    if (!ref.current.open) ref.current.showModal();
  }, [x]);
  const total = x ? x.price * qty + ADDONS.filter((a) => sides.includes(a.id)).reduce((t, a) => t + a.price, 0) : 0;
  return (
    <dialog
      ref={ref}
      onClose={onClose}
      onClick={(e) => e.target === e.currentTarget && e.currentTarget.close()}
      aria-label={x?.full}
      className="card-pop m-auto max-h-[92dvh] w-[min(92vw,52rem)] overflow-y-auto rounded-[2rem] bg-transparent p-0 backdrop:bg-ink/55 backdrop:backdrop-blur-sm"
    >
      {x && (
        <article className="grid overflow-hidden rounded-[2rem] bg-white text-ink shadow-[0_50px_90px_-30px_rgba(60,15,0,0.7)] sm:grid-cols-[1fr_1.05fr]">
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img src={`/plates/shop/${x.id}.jpg`} alt={x.full} width="928" height="1152" className="aspect-[5/4] h-full w-full object-cover sm:aspect-auto" />
          <div className="flex flex-col p-6 sm:p-8">
            <div className="flex items-start justify-between gap-4">
              <h3 className="font-serif text-4xl font-medium leading-[1.02]">{x.full}</h3>
              <button onClick={() => ref.current.close()} aria-label="Close" className="-mr-2 -mt-1 grid h-11 w-11 shrink-0 place-items-center rounded-full text-2xl text-ink/50 transition hover:bg-ink/5 hover:text-ink">×</button>
            </div>
            <p className="mt-2 text-sm text-ink/60">{x.serves} · {x.weight} · {x.meat}</p>
            <Heat n={x.heat} className="mt-2 text-ink/60" />
            <p className="mt-4 leading-relaxed text-ink/75">{x.note}</p>
            <p className="mt-5 text-[11px] uppercase tracking-[0.3em] text-copper-deep">Layer by layer</p>
            <ol className="mt-2 space-y-1 text-sm text-ink/70">
              {[...x.layers].reverse().map((l) => <li key={l}>· {l}</li>)}
            </ol>
            <fieldset className="mt-5">
              <legend className="text-[11px] uppercase tracking-[0.3em] text-copper-deep">On the side</legend>
              <div className="mt-2 flex flex-wrap gap-2">
                {ADDONS.filter((a) => a.available).map((a) => {
                  const on = sides.includes(a.id);
                  return (
                    <button key={a.id} type="button" aria-pressed={on} onClick={() => setSides(on ? sides.filter((i) => i !== a.id) : [...sides, a.id])} className={`min-h-10 rounded-full border px-4 text-sm transition ${on ? "border-heritage bg-heritage text-ivory" : "border-ink/15 hover:border-ink/40"}`}>
                      {on ? "✓" : "+"} {a.full} · {inr(a.price)}
                    </button>
                  );
                })}
              </div>
            </fieldset>
            <div className="mt-auto flex flex-wrap items-center justify-between gap-3 pt-6">
              <Qty value={qty} onChange={setN} label={x.full} min={1} />
              <button
                onClick={(e) => {
                  add(x.id, qty);
                  sides.forEach((id) => add(id));
                  flyToCart(e.currentTarget, `/plates/dish/${x.id}.webp`);
                  ref.current.close();
                }}
                disabled={!x.available}
                className="min-h-12 flex-1 rounded-full bg-crimson px-6 text-sm font-semibold text-ivory transition-[background-color,scale] duration-200 hover:bg-crimson-deep active:scale-[0.96] disabled:opacity-40"
              >
                {x.available ? `Add to cart · ${inr(total)}` : "Sold out"}
              </button>
            </div>
          </div>
        </article>
      )}
    </dialog>
  );
}

// The floating confirmation after every add: names the item and offers the cart. Re-keyed on bump so it replays.
export function AddedNote() {
  const { bump, last } = useShop();
  if (!bump || !last) return null;
  return (
    <div key={bump} role="status" className="added-note pointer-events-none fixed inset-x-0 bottom-20 z-50 flex justify-center px-4 md:bottom-8">
      <div className="pointer-events-auto flex items-center gap-4 rounded-full bg-ink py-2 pl-5 pr-2 text-sm text-paper shadow-[0_20px_40px_-18px_rgba(28,24,20,0.7)]">
        <span><span className="text-paper/55">Added</span> {last}</span>
        <button onClick={() => setOpen(true)} className="min-h-9 rounded-full bg-paper px-4 text-xs font-semibold text-ink transition hover:bg-ivory">
          View cart
        </button>
      </div>
    </div>
  );
}

// The finder's chips: each a test on a dish (cart.js DISHES).
const SEA = ["fish", "prawn"];
const FINDS = [
  ["All", () => true],
  ["Meat", (x) => !SEA.includes(x.id)],
  ["Seafood", (x) => SEA.includes(x.id)],
  ["Spicy", (x) => x.heat >= 3],
  ["Under ₹450", (x) => x.price < 450],
];
// The menu filters as a segmented control: a dark pill slides under the chosen one.
function Filters({ find, setFind }) {
  const box = useRef(null);
  const [pill, setPill] = useState(null);
  useEffect(() => {
    const place = () => {
      const b = box.current?.children[find + 1];
      if (b) setPill({ left: b.offsetLeft, width: b.offsetWidth });
    };
    place();
    addEventListener("resize", place);
    document.fonts?.ready.then(place);
    return () => removeEventListener("resize", place);
  }, [find]);
  return (
    <div ref={box} role="group" aria-label="Filter the menu" className="relative mt-2 flex shrink-0 overflow-x-auto rounded-full bg-ink/5 p-1 [scrollbar-width:none] sm:mt-0">
      <span aria-hidden className="absolute inset-y-1 rounded-full bg-ink shadow-[0_8px_18px_-8px_rgb(56_37_30/0.7)] transition-[left,width] duration-500 ease-[cubic-bezier(.2,.8,.2,1)]" style={pill ? { left: pill.left, width: pill.width } : { opacity: 0 }} />
      {FINDS.map(([label], i) => (
        <button key={label} aria-pressed={find === i} onClick={() => setFind(i)} className={`relative min-h-10 shrink-0 rounded-full px-4 text-sm font-medium transition-colors duration-500 ${find === i ? "text-ivory" : "text-ink/65 hover:text-ink"}`}>
          {label}
        </button>
      ))}
    </div>
  );
}

// One dish as a large horizontal card (after the user's menu reference): a peach, cream or saffron surface, the dish's
// plate oversized and breaking out over its left edge (on top, on phones), a price seal on the plate, a small
// category label, the name in large serif, its line, spice, portion and weight, and Add with a separate View. The card
// at the centre of the rail (`active`) pops up once it has settled (a touch larger, deeper shadow); the others step
// back, smaller and quieter.
// Light cards on the burnt-orange ground, alternating warm ivory and light peach.
const TONES = ["bg-ivory", "bg-peach"];
function MenuCard({ x, tone, active, qty }) {
  return (
    <article className={`group relative flex h-full flex-col rounded-[2rem] px-6 pb-6 pt-40 text-ink transition-[scale,opacity,box-shadow,filter] sm:min-h-[20rem] sm:pl-[44%] sm:pr-7 sm:pt-7 ${TONES[tone]} ${active === false ? "scale-[0.92] opacity-90 duration-500" : active ? "z-10 scale-[1.04] shadow-[0_50px_80px_-34px_rgb(50_12_4/0.75)] ring-[3px] ring-orange delay-[800ms] duration-[600ms] ease-[cubic-bezier(.3,1.35,.5,1)]" : "shadow-[0_30px_60px_-36px_rgb(50_12_4/0.6)]"}`}>
      <a href={`/products/${slugOf(x)}`} draggable="false" className="absolute -top-16 left-1/2 block w-52 -translate-x-1/2 rounded-full sm:-left-10 sm:top-1/2 sm:w-[50%] sm:-translate-y-1/2 sm:translate-x-0" aria-label={`View ${x.full}`}>
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img src={`/plates/dish/${x.id}.webp`} alt={x.full} loading="lazy" decoding="async" width="720" height="720" draggable="false" className="aspect-square w-full rounded-full object-cover shadow-[0_34px_50px_-22px_rgb(56_37_30/0.65)] transition-[rotate,scale] duration-[1200ms] ease-[cubic-bezier(.2,.8,.2,1)] group-hover:rotate-[16deg] group-hover:scale-[1.04]" />
        <PriceBadge value={x.price} className={`absolute -right-3 -top-2 w-[34%] min-w-[4.5rem] sm:-bottom-1 sm:left-0 sm:right-auto sm:top-auto sm:w-[32%] `} />
      </a>
      <div className="flex flex-1 flex-col">
        <p className="text-[10px] font-semibold uppercase tracking-[0.3em] text-crimson-deep">{x.meat}</p>
        <h3 className="mt-2 font-serif text-[2.1rem] font-semibold leading-[0.95]"><a href={`/products/${slugOf(x)}`} draggable="false" className="transition-colors hover:text-crimson">{x.full}</a></h3>
        <p className="mt-3 line-clamp-3 text-sm leading-relaxed text-ink/70">{x.note}</p>
        <p className="mt-3 flex flex-wrap items-center gap-x-3 gap-y-1 text-xs text-ink/60">
          <Heat n={x.heat} className="text-crimson-deep" />
          <span>{x.serves}</span>
          <span>{x.weight}</span>
          {!x.available && <Availability ok={false} />}
        </p>
        <div className="mt-auto flex items-center justify-between gap-2 pt-5">
          <AddControl x={x} qty={qty} compact />
          <a href={`/products/${slugOf(x)}`} draggable="false" className="inline-flex min-h-11 items-center rounded-full px-4 text-[11px] font-semibold uppercase tracking-[0.2em] text-ink/70 ring-1 ring-ink/15 transition hover:bg-ink hover:text-ivory">View</a>
        </div>
      </div>
    </article>
  );
}

// The cards as a stepped rail: MOVE → POP UP → SETTLE → PAUSE, one card at a time. The active card glides (GSAP, ~0.9 s,
// eased in and out) into the featured position at the centre with its neighbours visible either side, then pops up a
// little (scale and shadow, after it has settled), holds about 2 s for a read, and the next one comes. After the last
// it carries on to the first without a rewind (the list is laid out three times; on reaching a copy the track resets
// to the matching original unseen). One tween and one scheduled call at a time, both killed on unmount. Auto-play
// starts when the rail is on screen and holds while pointed at, focused, paused, hidden in a background tab, or for a
// few seconds after any manual move (arrows, drag, swipe). Fewer than three cards, or reduced motion: a plain row.
const MOVE_S = 0.9;
const HOLD_S = 2.1;
const RESUME_MS = 4000;
function MenuRail({ items, render }) {
  const box = useRef(null);
  const view = useRef(null);
  const track = useRef(null);
  const tween = useRef(null);
  const call = useRef(null);
  const idxRef = useRef(0);
  const auto = useRef(false);
  const coolT = useRef(null);
  const down = useRef(null);
  const dragged = useRef(false);
  const [idx, setIdx] = useState(0);
  const [jump, setJump] = useState(false); // the unseen reset: no card transitions for a frame
  const [hold, setHold] = useState(false);
  const [paused, setPaused] = useState(false);
  const [cool, setCool] = useState(false);
  const [hidden, setHidden] = useState(false);
  const [still, setStill] = useState(false);
  const [on, setOn] = useState(false);
  const n = items.length;
  const slide = n >= 3 && !still;
  const key = items.map((x) => x.id).join();

  // Where the track sits for card k to be centred in the view.
  const xFor = (k) => {
    const li = track.current?.children[k];
    if (!li) return 0;
    const pl = parseFloat(getComputedStyle(view.current).paddingLeft) || 0;
    return (view.current.clientWidth - li.offsetWidth) / 2 - pl - li.offsetLeft;
  };
  const show = (k) => {
    idxRef.current = k;
    setIdx(k);
  };
  // Back into the middle copy without anything visible changing.
  const settle = () => {
    let k = idxRef.current;
    if (k >= 2 * n) k -= n;
    else if (k < n) k += n;
    if (k !== idxRef.current) {
      setJump(true);
      if (track.current) gsap.set(track.current, { x: xFor(k) });
      show(k);
    }
  };
  const schedule = () => {
    call.current?.kill();
    if (auto.current) call.current = gsap.delayedCall(HOLD_S, () => goTo(idxRef.current + 1));
  };
  const goTo = (k) => {
    call.current?.kill();
    if (!track.current) return; // the rail has gone (page change)
    show(k);
    tween.current = gsap.to(track.current, { x: xFor(k), duration: MOVE_S, ease: "power3.inOut", overwrite: true, onComplete: () => (settle(), schedule()) });
  };
  // A manual move: go, and hold auto-play for a few seconds.
  const go = (d) => {
    setCool(true);
    clearTimeout(coolT.current);
    coolT.current = setTimeout(() => setCool(false), RESUME_MS);
    goTo(idxRef.current + d);
  };

  useEffect(() => setStill(matchMedia("(prefers-reduced-motion: reduce)").matches), []);
  useEffect(() => {
    const v = () => setHidden(document.hidden);
    document.addEventListener("visibilitychange", v);
    const io = new IntersectionObserver(([e]) => setOn(e.isIntersecting), { threshold: 0.3 });
    io.observe(box.current);
    return () => (document.removeEventListener("visibilitychange", v), io.disconnect(), clearTimeout(coolT.current), call.current?.kill(), tween.current?.kill());
  }, []);
  // Start (or restart, when the filter changes the cards) on the first card, centred; keep it centred on resize.
  useEffect(() => {
    if (!slide) return;
    call.current?.kill();
    tween.current?.kill();
    show(n);
    gsap.set(track.current, { x: xFor(n) });
    const ro = new ResizeObserver(() => track.current && gsap.set(track.current, { x: xFor(idxRef.current) }));
    ro.observe(view.current);
    return () => ro.disconnect();
  }, [key, slide]); // eslint-disable-line react-hooks/exhaustive-deps
  // Auto-play on or off; turning on waits the full pause before the next move.
  const can = slide && on && !hold && !paused && !cool && !hidden;
  useEffect(() => {
    auto.current = can;
    if (!can) call.current?.kill();
    else if (!tween.current?.isActive()) schedule();
  }, [can]); // eslint-disable-line react-hooks/exhaustive-deps
  useEffect(() => {
    if (!jump) return;
    const r = requestAnimationFrame(() => requestAnimationFrame(() => setJump(false)));
    return () => cancelAnimationFrame(r);
  }, [jump]);

  const list = slide ? [...items, ...items, ...items] : items;
  return (
    <div ref={box} className="relative mt-6" onPointerEnter={(e) => e.pointerType === "mouse" && setHold(true)} onPointerLeave={() => setHold(false)} onFocus={() => setHold(true)} onBlur={() => setHold(false)}>
      {slide && (
        <div className="mb-2 flex items-center justify-end gap-2">
          <button onClick={() => go(-1)} aria-label="Previous dish" className="grid h-11 w-11 place-items-center rounded-full bg-ivory text-ink ring-1 ring-white/40 transition hover:bg-ink hover:text-ivory">←</button>
          <button onClick={() => go(1)} aria-label="Next dish" className="grid h-11 w-11 place-items-center rounded-full bg-ivory text-ink ring-1 ring-white/40 transition hover:bg-ink hover:text-ivory">→</button>
          <button onClick={() => setPaused((p) => !p)} aria-pressed={paused} aria-label={paused ? "Play the menu" : "Pause the menu"} className="grid h-11 w-11 place-items-center rounded-full text-xs text-ivory/80 transition hover:bg-white/10 hover:text-ivory">
            {paused ? "▶" : "❚❚"}
          </button>
        </div>
      )}
      <div
        ref={view}
        className={`-mx-5 px-5 pb-12 pt-20 sm:-mx-10 sm:px-14 sm:pt-12 xl:-mx-16 xl:px-20 ${slide ? "overflow-hidden" : "overflow-x-auto [scrollbar-width:none]"}`}
        onPointerDown={(e) => (down.current = e.clientX)}
        onPointerUp={(e) => {
          const dx = e.clientX - (down.current ?? e.clientX);
          if (slide && Math.abs(dx) > 60) go(dx < 0 ? 1 : -1);
          dragged.current = Math.abs(dx) > 8;
          down.current = null;
        }}
        onClickCapture={(e) => {
          // A drag that ends on a card is not a click on it (so it never opens the dish).
          if (dragged.current) (e.preventDefault(), e.stopPropagation(), (dragged.current = false));
        }}
      >
        <ul ref={track} aria-label="Biriyanis" className={`menu-rail flex gap-6 ${jump ? "[&_article]:!transition-none" : ""}`}>
          {list.map((x, i) => {
            const copy = slide && (i < n || i >= 2 * n);
            return (
              <li key={`${x.id}-${Math.floor(i / n)}`} aria-hidden={copy || undefined} inert={copy || undefined} className="w-[min(84vw,20rem)] shrink-0 sm:w-[34rem]">
                {render(x, i % n, slide ? i === idx : undefined)}
              </li>
            );
          })}
        </ul>
      </div>
      {slide && <p aria-live="polite" className="sr-only">{items[idx % n].full}, {inr(items[idx % n].price)}</p>}
    </div>
  );
}

const SORTS = [
  ["Menu order", null],
  ["Price: low to high", (a, b) => a.price - b.price],
  ["Price: high to low", (a, b) => b.price - a.price],
  ["Spiciest first", (a, b) => b.heat - a.heat],
];

export default function Shop() {
  const { cart } = useShop();
  const [q, setQ] = useState("");
  const [find, setFind] = useState(0);
  const [sort, setSort] = useState(0);
  const words = q.trim().toLowerCase();
  const shown = DISHES.filter((x) => FINDS[find][1](x) && (!words || [x.full, x.meat, x.note, ...x.layers].join(" ").toLowerCase().includes(words)));
  if (SORTS[sort][1]) shown.sort(SORTS[sort][1]);
  return (
    <section id="menu" className="relative z-10 overflow-hidden bg-[linear-gradient(172deg,var(--color-terracotta)_0%,var(--color-burnt)_48%,#d85a2b_100%)] px-5 pb-32 pt-20 text-ivory sm:px-10 xl:px-16">
      {/* Soft edges into the dark Signature scene above and the peach Combos below; a warm glow behind the cards. */}
      <div aria-hidden className="pointer-events-none absolute inset-x-0 top-0 h-28 bg-[linear-gradient(to_bottom,rgb(0_0_0/0.45),transparent)]" />
      <div aria-hidden className="pointer-events-none absolute inset-x-0 bottom-0 h-28 bg-[linear-gradient(to_bottom,transparent,var(--color-peach))]" />
      <div aria-hidden className="pointer-events-none absolute left-1/2 top-[45%] h-[38rem] w-[70rem] -translate-x-1/2 -translate-y-1/2 rounded-full bg-[radial-gradient(closest-side,rgb(247_177_132/0.28),transparent)]" />
      <div className="relative mx-auto max-w-7xl">
        <div className="flex flex-wrap items-end justify-between gap-6">
          <div>
            <p className="lift text-[11px] uppercase tracking-[0.35em] text-apricot">The menu</p>
            <h2 className="lift mt-3 font-serif text-5xl font-medium leading-[0.98] sm:text-6xl">
              Choose your <em className="text-apricot">biriyani</em>
            </h2>
          </div>
          <DemoNotice className="lift max-w-md" />
        </div>

        {/* The finder: type or tap a chip and the handis below filter instantly. Sticks under the header from sm up; on
            phones it scrolls away so it never covers the cards. */}
        <div className="z-20 mt-10 rounded-[1.75rem] bg-ivory/95 p-2 text-ink shadow-[0_20px_40px_-24px_rgb(60_15_5/0.7)] ring-1 ring-white/50 backdrop-blur sm:sticky sm:top-[4.5rem] sm:flex sm:items-center sm:gap-3 sm:rounded-full">
          <label className="flex min-h-12 flex-1 items-center gap-3 rounded-full bg-white pl-5 pr-1.5 ring-1 ring-ink/10 transition focus-within:ring-ink/40">
            <span className="sr-only">Find a biriyani</span>
            <input type="search" value={q} onChange={(e) => setQ(e.target.value)} placeholder="What is your fav. biriyani dish?" className="min-w-0 flex-1 bg-transparent text-sm outline-none placeholder:text-ink/45" />
            <span aria-hidden className="grid h-9 w-9 shrink-0 place-items-center rounded-full bg-amber text-ink">
              <svg viewBox="0 0 24 24" className="h-4 w-4" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round"><circle cx="11" cy="11" r="6.5" /><path d="m16 16 4.5 4.5" /></svg>
            </span>
          </label>
          <Filters find={find} setFind={setFind} />
          <a href="#combos" className="mt-2 hidden min-h-10 shrink-0 items-center rounded-full px-4 text-sm text-ink/65 transition hover:bg-ink/5 hover:text-ink sm:mt-0 sm:flex">Combos ↓</a>
          <label className="mt-2 flex min-h-10 shrink-0 items-center gap-2 rounded-full px-4 text-sm text-ink/65 sm:mt-0">
            <span className="sr-only sm:not-sr-only">Sort</span>
            <select value={sort} onChange={(e) => setSort(+e.target.value)} className="min-h-10 cursor-pointer bg-transparent font-medium text-ink outline-none">
              {SORTS.map(([l], i) => <option key={l} value={i}>{l}</option>)}
            </select>
          </label>
        </div>
        <p aria-live="polite" className="sr-only">{shown.length} of {DISHES.length} biriyanis shown</p>
        {!shown.length && (
          <p className="mt-16 text-center font-serif text-2xl text-ivory/85">
            Nothing matches that yet.{" "}
            <button onClick={() => { setQ(""); setFind(0); }} className="min-h-11 text-apricot underline underline-offset-4">Show every biriyani</button>
          </p>
        )}

        {shown.length > 0 && <MenuRail items={shown} render={(x, i, active) => <MenuCard x={x} tone={i % 2} active={active} qty={cart[x.id]} />} />}

        <div className="mt-20 flex items-end justify-between gap-6">
          <h3 className="lift font-serif text-3xl sm:text-4xl">On the side</h3>
          <p className="text-sm text-ivory/75">Optional add-ons</p>
        </div>
        <ul className="mt-6 grid gap-4 sm:grid-cols-3">
          {ADDONS.map((x) => (
            <li key={x.id} onPointerMove={magnet} onPointerLeave={unmagnet} className="lift magnetic flex flex-col justify-between gap-4 rounded-2xl bg-ivory p-5 text-ink shadow-[0_24px_40px_-26px_rgb(60_15_5/0.7)] ring-1 ring-white/60">
              <div>
                <div className="flex items-baseline justify-between gap-3">
                  <span className="font-serif text-2xl">{x.full}</span>
                  <Price value={x.price} className="text-2xl" />
                </div>
                <p className="mt-1 text-sm text-ink/60">{x.note}</p>
                <p className="mt-2 text-xs text-ink/45">{x.weight}</p>
              </div>
              <AddControl x={x} qty={cart[x.id]} />
            </li>
          ))}
        </ul>
      </div>
    </section>
  );
}

// The header's cart button (page.jsx).
export function CartButton({ className = "" }) {
  const { cart } = useShop();
  const { count } = totals(cart);
  return (
    <button data-cart-target onClick={() => setOpen(true)} className={`relative inline-flex min-h-11 items-center gap-2 text-sm font-medium transition hover:text-crimson ${className}`} aria-label={`Cart, ${count} items`}>
      Cart
      <Bucket count={count} />
    </button>
  );
}

// Mobile: Menu and Cart always one tap away, above the device's home indicator. The page reserves the same height
// at its foot (page.jsx), so this never covers content.
export function BottomBar() {
  const { cart } = useShop();
  const { count, total } = totals(cart);
  return (
    <nav aria-label="Shop" className="fixed inset-x-0 bottom-0 z-40 border-t border-ink/10 bg-white/95 pb-[env(safe-area-inset-bottom)] text-ink backdrop-blur md:hidden">
      <div className="grid h-16 grid-cols-2">
        <a href="/#menu" className="grid place-items-center text-sm font-medium">
          Menu
        </a>
        <button data-cart-target onClick={() => setOpen(true)} className="flex items-center justify-center gap-2 border-l border-ink/10 text-sm font-medium" aria-label={`Cart, ${count} items, ${inr(total)}`}>
          Cart
          <Bucket count={count} />
          {count ? <span className="tabular-nums text-ink/60">{inr(total)}</span> : null}
        </button>
      </div>
    </nav>
  );
}

// What delivery costs, as far as it is known: a fixed fee, or confirmed with the order.
const feeNote = DELIVERY_FEE == null ? "Delivery fee, if any, is confirmed with your order." : `Delivery fee: ${inr(DELIVERY_FEE)}.`;

const field = "mt-1 w-full rounded-lg border border-ink/15 bg-white/60 px-3.5 py-3 text-sm outline-none transition focus:border-ink";

function CartStep({ lines, total, cart }) {
  const missing = ADDONS.filter((a) => !cart[a.id] && a.available);
  return (
    <>
      {lines.length ? (
        <div className="flex-1 overflow-y-auto px-6">
          <ul className="divide-y divide-ink/10">
            {lines.map((l) => (
              <li key={l.id} className="flex gap-4 py-5">
                {dish(l.id) ? (
                  // eslint-disable-next-line @next/next/no-img-element
                  <img src={`/plates/shop/${l.id}.jpg`} alt="" className="h-20 w-16 shrink-0 object-cover" />
                ) : (
                  <span className="grid h-20 w-16 shrink-0 place-items-center bg-[#ece6db] font-serif text-xs text-ink/50">Side</span>
                )}
                <div className="flex-1">
                  <p className="font-serif text-lg leading-tight">{dish(l.id) ? <a href={`/products/${slugOf(l)}`} onClick={() => setOpen(false)} className="hover:text-crimson">{l.full}</a> : l.full}</p>
                  <p className="mt-1 text-xs text-ink/50">{l.serves ? `${l.serves} · ` : ""}{l.weight} · {inr(l.price)} each</p>
                  <div className="mt-3 flex items-center justify-between gap-3">
                    <Qty value={l.qty} onChange={(n) => setQty(l.id, n)} label={l.full} />
                    <span className="text-sm tabular-nums">{inr(l.price * l.qty)}</span>
                  </div>
                  <button onClick={() => setQty(l.id, 0)} className="mt-2 min-h-8 text-xs text-ink/50 underline underline-offset-2 hover:text-ink">
                    Remove
                  </button>
                </div>
              </li>
            ))}
          </ul>
          {missing.length > 0 && (
            <div className="border-t border-ink/10 py-5">
              <p className="text-[11px] uppercase tracking-[0.3em] text-ink/45">Add a side</p>
              <div className="mt-3 flex flex-wrap gap-2">
                {missing.map((a) => (
                  <button key={a.id} onClick={() => add(a.id)} className="min-h-10 rounded-full border border-ink/15 px-4 text-sm transition hover:border-ink">
                    + {a.full} · {inr(a.price)}
                  </button>
                ))}
              </div>
            </div>
          )}
        </div>
      ) : (
        <div className="grid flex-1 place-items-center px-6 text-center">
          <div>
            <p className="font-serif text-2xl">Your cart is empty.</p>
            <p className="mt-2 text-sm text-ink/55">Pick a biriyani and it will appear here.</p>
            <a href="/#menu" onClick={() => setOpen(false)} className="mt-6 inline-flex min-h-12 items-center rounded-full bg-crimson px-7 text-sm font-semibold text-ivory transition hover:bg-crimson-deep">
              Browse the menu
            </a>
          </div>
        </div>
      )}
      {lines.length > 0 && (
        <div className="border-t border-ink/10 px-6 py-6">
          <div className="flex items-baseline justify-between">
            <span className="text-sm text-ink/60">Items total</span>
            <span className="font-serif text-3xl tabular-nums">{inr(total)}</span>
          </div>
          <p className="mt-1 text-xs text-ink/50">Pickup has no delivery fee. {feeNote}</p>
          <button onClick={() => setStep("details")} className="mt-5 min-h-12 w-full rounded-full bg-crimson text-sm font-semibold tracking-wide text-ivory transition hover:bg-crimson-deep">
            Continue to checkout
          </button>
          <a href="/#menu" onClick={() => setOpen(false)} className="mt-2 flex min-h-11 items-center justify-center text-sm text-ink/65 underline-offset-4 transition hover:text-ink hover:underline">
            Continue shopping
          </a>
        </div>
      )}
    </>
  );
}

function DetailsStep({ total, fulfil, draft }) {
  const [pinError, setPinError] = useState("");
  const onInput = (e) => {
    if (!e.target.name) return;
    setDraft({ [e.target.name]: e.target.value });
    if (e.target.name === "pin") setPinError("");
  };
  return (
    <form
      className="flex flex-1 flex-col overflow-hidden"
      onInput={onInput}
      onSubmit={(e) => {
        e.preventDefault();
        // Delivery-area check before the order goes anywhere.
        if (fulfil === "delivery" && pinStatus(draft.pin) === "out") {
          setPinError(`Sorry, we don't deliver to ${draft.pin.trim()} yet. Choose pickup, or a different address.`);
          e.currentTarget.elements.pin.focus();
          return;
        }
        placeOrder();
      }}
    >
      <div className="flex-1 space-y-5 overflow-y-auto px-6 py-5">
        <DemoNotice />
        <fieldset>
          <legend className="text-[11px] uppercase tracking-[0.3em] text-ink/45">Delivery or pickup</legend>
          <div role="radiogroup" aria-label="Delivery or pickup" className="mt-2 grid grid-cols-2 gap-2">
            {[["delivery", "Delivery"], ["pickup", "Pickup"]].map(([id, label]) => (
              <button
                key={id}
                type="button"
                role="radio"
                aria-checked={fulfil === id}
                onClick={() => setFulfil(id)}
                className={`min-h-12 rounded-lg border text-sm transition ${fulfil === id ? "border-ink bg-ink text-paper" : "border-ink/15 hover:border-ink/40"}`}
              >
                {label}
              </button>
            ))}
          </div>
        </fieldset>
        <label className="block text-sm">
          Name
          <input name="name" required autoComplete="name" defaultValue={draft.name} className={field} />
        </label>
        <label className="block text-sm">
          Phone
          <input name="phone" type="tel" required inputMode="tel" autoComplete="tel" pattern="[+0-9 ]{10,16}" title="10 to 15 digits" defaultValue={draft.phone} className={field} />
        </label>
        {fulfil === "delivery" ? (
          <>
            <label className="block text-sm">
              Delivery address
              <textarea name="address" required rows={3} autoComplete="street-address" defaultValue={draft.address} className={field} />
            </label>
            <label className="block text-sm">
              PIN code
              <input
                name="pin"
                required
                inputMode="numeric"
                autoComplete="postal-code"
                pattern="[0-9]{6}"
                maxLength={6}
                title="6-digit PIN code"
                defaultValue={draft.pin}
                aria-invalid={!!pinError}
                aria-describedby="pin-msg"
                className={`${field} max-w-40 ${pinError ? "border-red-700" : ""}`}
              />
              <span id="pin-msg" role={pinError ? "alert" : undefined} className={`mt-1 block text-xs ${pinError ? "text-red-800" : "text-ink/50"}`}>
                {pinError || "We check it against our delivery areas."}
              </span>
            </label>
            <label className="block text-sm">
              Landmark <span className="text-ink/40">(optional)</span>
              <input name="landmark" defaultValue={draft.landmark} className={field} />
            </label>
          </>
        ) : (
          <p className="rounded-lg bg-ink/5 px-4 py-3 text-sm text-ink/70">{PICKUP ? `Pickup from ${PICKUP}.` : "The pickup address and time are confirmed with your order."}</p>
        )}
        <label className="block text-sm">
          Notes <span className="text-ink/40">(optional)</span>
          <textarea name="notes" rows={2} defaultValue={draft.notes} className={field} />
        </label>
      </div>
      <div className="border-t border-ink/10 px-6 py-6">
        <div className="flex items-baseline justify-between">
          <span className="text-sm text-ink/60">Items total</span>
          <span className="font-serif text-3xl tabular-nums">{inr(total)}</span>
        </div>
        {fulfil === "delivery" && (
          <p className="mt-1 text-xs text-ink/50">
            {feeNote}
            {DELIVERY_FEE != null && ` Total ${inr(total + DELIVERY_FEE)}.`}
          </p>
        )}
        <div className="mt-5 flex gap-3">
          <button type="button" onClick={() => setStep("cart")} className="min-h-12 rounded-full border border-ink/20 px-5 text-sm transition hover:border-ink">
            Back
          </button>
          <button type="submit" className="min-h-12 flex-1 rounded-full bg-crimson text-sm font-semibold tracking-wide text-ivory transition hover:bg-crimson-deep">
            {WHATSAPP ? "Send order on WhatsApp" : "Place demo order"}
          </button>
        </div>
      </div>
    </form>
  );
}

function DoneStep({ order }) {
  return (
    <div className="flex flex-1 flex-col overflow-y-auto px-6 py-6">
      <p className="text-[11px] uppercase tracking-[0.3em] text-copper-deep">{order.sent ? "Order ready to send" : "Demo order confirmed"}</p>
      <h3 className="mt-2 font-serif text-3xl">Order {order.ref}</h3>
      <p className="mt-3 text-sm text-ink/65">
        {order.sent
          ? "WhatsApp opened with your order filled in. Send the message there to place it; the restaurant confirms the total and timing."
          : "This was a demo: no order was sent and no payment was taken."}
      </p>
      <pre className="mt-5 whitespace-pre-wrap rounded-lg bg-ink/5 p-4 font-sans text-sm leading-relaxed text-ink/80">{orderMessage(order)}</pre>
      {!order.sent && (
        <div className="mt-5 rounded-lg border border-copper/30 p-4 text-sm text-ink/70">
          <p className="font-semibold text-ink">To take real orders, connect:</p>
          <ul className="mt-2 list-disc space-y-1 pl-5">
            <li>The business WhatsApp number, or an ordering service that receives orders.</li>
            <li>A payment service (for example a UPI or card gateway) if orders are paid online.</li>
            <li>The real menu, portions, prices, availability and pickup address.</li>
          </ul>
        </div>
      )}
      <button onClick={() => setOpen(false)} className="mt-6 min-h-12 rounded-full bg-crimson text-sm font-semibold text-ivory transition hover:bg-crimson-deep">
        Done
      </button>
    </div>
  );
}

// Mounted at the page root (page.jsx) so it stacks above the fixed header.
export function Cart() {
  const { cart, open, step, fulfil, draft, order } = useShop();
  const { lines, total, count } = totals(cart);
  const panel = useRef();

  useEffect(() => {
    if (!open) return;
    const prev = document.activeElement;
    panel.current?.focus();
    const key = (e) => e.key === "Escape" && setOpen(false);
    addEventListener("keydown", key);
    return () => {
      removeEventListener("keydown", key);
      prev?.focus?.();
    };
  }, [open]);

  const title = step === "details" ? "Checkout" : step === "done" ? "Thank you" : <>Your cart <span className="text-ink/40">({count})</span></>;
  return (
    <div className={`fixed inset-0 z-50 ${open ? "" : "pointer-events-none"}`} aria-hidden={!open} inert={!open}>
      <div onClick={() => setOpen(false)} className={`absolute inset-0 bg-ink/40 backdrop-blur-[2px] transition-opacity duration-500 ${open ? "opacity-100" : "opacity-0"}`} />
      <aside
        ref={panel}
        tabIndex={-1}
        role="dialog"
        aria-modal="true"
        aria-label="Cart and checkout"
        className={`absolute inset-y-0 right-0 flex w-full max-w-md flex-col bg-paper text-ink outline-none transition-[translate,box-shadow] duration-500 ease-[cubic-bezier(.2,.8,.2,1)] ${open ? "translate-x-0 shadow-2xl" : "translate-x-full shadow-none"}`}
      >
        <div className="flex items-center justify-between border-b border-ink/10 px-6 py-5">
          <h2 className="font-serif text-2xl">{title}</h2>
          <button onClick={() => setOpen(false)} className="grid h-10 w-10 place-items-center rounded-full text-xl transition hover:bg-ink/5" aria-label="Close">
            ×
          </button>
        </div>
        {step === "done" && order ? <DoneStep order={order} /> : step === "details" && lines.length ? <DetailsStep total={total} fulfil={fulfil} draft={draft} /> : <CartStep lines={lines} total={total} cart={cart} />}
      </aside>
    </div>
  );
}
