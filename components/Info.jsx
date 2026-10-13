"use client";

import { useEffect, useRef, useState } from "react";
import gsap from "gsap";
import { ScrollTrigger } from "gsap/ScrollTrigger";
import { DrawSVGPlugin } from "gsap/DrawSVGPlugin";
import { magnet, unmagnet } from "./Shop";
import { DELIVERY_FEE, DELIVERY_PINS, DISHES, FEATURES, HOURS, OFFERS, PHONE, PICKUP, WHATSAPP, add, dish, inr, setFulfil, setOpen, setStep, totals, useShop } from "./cart";
import { flyToCart } from "./fly";
import { useOnScreen } from "./hooks";
import Dust from "./Dust";

// The marquee band under the hero (apricot): the line repeats twice so the loop is seamless; it only runs while on screen, and holds still
// under reduced motion. Content comes from the menu and the business's own offers.
export function Ticker({ reverse = false }) {
  const ref = useRef(null);
  useEffect(() => {
    const io = new IntersectionObserver(([e]) => ref.current?.style.setProperty("animation-play-state", e.isIntersecting ? "running" : "paused"));
    io.observe(ref.current.parentElement);
    return () => io.disconnect();
  }, []);
  const items = [...OFFERS.map((o) => ["offer", o]), ...FEATURES.map((f) => ["", f.text]), ...DISHES.map((d) => ["", d.full]), ["", "Delivery or pickup"]];
  const line = items.map(([k, t], i) => (
    <span key={i} className="flex shrink-0 items-center gap-6 pr-6">
      <span className={k ? "rounded-full bg-crimson px-3 py-0.5 text-ivory" : ""}>{t}</span>
      <span aria-hidden className="text-crimson">✦</span>
    </span>
  ));
  return (
    <div
      aria-label={items.map(([, t]) => t).join(", ")}
      role="marquee"
      className={`relative z-10 overflow-hidden whitespace-nowrap py-3.5 font-serif text-xl sm:text-2xl bg-amber text-ink`}
    >
      <div ref={ref} className={`marquee flex w-max ${reverse ? "marquee-rev" : ""}`} aria-hidden>
        {line}
        {line}
      </div>
    </div>
  );
}

// "To your door, or ours" and the FAQ: one continuous cream band after the menu. Each fulfilment card leads straight
// into checkout with that option already chosen.
const Check = () => (
  <svg aria-hidden viewBox="0 0 16 16" className="mt-1 h-4 w-4 shrink-0 text-copper" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <path d="m3.5 8.5 3 3 6-7" />
  </svg>
);

// Card illustrations, line-drawn in the page palette (crimson, amber, copper on cream). Gently animated (globals.css
// .ride/.handi-art), a little livelier while the card is hovered; still under reduced motion.
const INK = "#1c1814", CRIMSON = "#d2401f", AMBER = "#f7a46f", COPPER = "#e8693f";
function DeliveryArt() {
  return (
    <svg viewBox="0 0 160 110" className="ride h-auto w-full" aria-hidden fill="none" strokeLinecap="round" strokeLinejoin="round">
      <path className="ride-road" d="M2 99H158" stroke={COPPER} strokeOpacity=".45" strokeWidth="2" />
      <g className="ride-speed" stroke={CRIMSON} strokeOpacity=".5" strokeWidth="2">
        <path d="M4 52h16M0 62h20M6 72h12" />
      </g>
      <g className="ride-body">
        {/* The sealed biriyani box on the rack, with a little steam. */}
        <g className="ride-steam" stroke={COPPER} strokeWidth="1.6">
          <path d="M40 28c-3-4 3-6 0-10M48 28c-3-4 3-6 0-10" />
        </g>
        <rect x="28" y="32" width="32" height="26" rx="4" fill={AMBER} stroke={CRIMSON} strokeWidth="2" />
        <path d="M28 41h32" stroke={CRIMSON} strokeWidth="2" />
        <circle cx="44" cy="49" r="4.5" fill={CRIMSON} />
        {/* Scooter: deck, seat, body, stem and bars. */}
        <path d="M42 86h30l10-22h24c6 0 9 4 11 9l4 13" stroke={INK} strokeWidth="2.4" />
        <path d="M62 60h22" stroke={INK} strokeWidth="4" />
        <path d="M30 64h32l6 10H30Z" fill={CRIMSON} stroke={CRIMSON} strokeWidth="2" />
        <path d="M110 64 118 34h10" stroke={INK} strokeWidth="2.4" />
        <circle cx="124" cy="44" r="2.5" fill={AMBER} />
      </g>
      {[40, 122].map((cx) => (
        <g key={cx}>
          <circle cx={cx} cy="86" r="12" fill="#fff7ec" stroke={INK} strokeWidth="2.4" />
          <g className="ride-wheel" stroke={COPPER} strokeWidth="1.6">
            <path d={`M${cx - 7} 86h14M${cx} 79v14`} />
          </g>
          <circle cx={cx} cy="86" r="2.4" fill={INK} />
        </g>
      ))}
    </svg>
  );
}
function PickupArt() {
  return (
    <svg viewBox="0 0 160 110" className="handi-art h-auto w-full" aria-hidden fill="none" strokeLinecap="round" strokeLinejoin="round">
      <g className="handi-steam" stroke={COPPER} strokeWidth="1.6">
        <path d="M66 22c-4-5 4-7 0-12M80 18c-4-5 4-7 0-12M94 22c-4-5 4-7 0-12" />
      </g>
      {/* The copper handi peeking out of the takeaway bag. */}
      <path d="M58 40c0-8 10-12 22-12s22 4 22 12" fill={COPPER} stroke={INK} strokeWidth="2" />
      <ellipse cx="80" cy="40" rx="25" ry="5" fill={AMBER} stroke={INK} strokeWidth="2" />
      <path d="M77 27h6" stroke={INK} strokeWidth="3" />
      <g className="handi-bag">
        <path d="M66 44c0-16 28-16 28 0" stroke={CRIMSON} strokeWidth="3" />
        <path d="M44 46h72l-7 56H51Z" fill="#fff7ec" stroke={CRIMSON} strokeWidth="2.4" />
        <path d="M44 46l4 8h64l4-8" stroke={CRIMSON} strokeWidth="2" />
        <circle cx="80" cy="76" r="11" fill={AMBER} stroke={CRIMSON} strokeWidth="2" />
        <text x="80" y="80" textAnchor="middle" fontSize="10" fontFamily="Georgia, serif" fill={CRIMSON}>RD</text>
      </g>
      <path d="M30 104h100" stroke={COPPER} strokeOpacity=".45" strokeWidth="2" />
    </svg>
  );
}

// The option icons, animated on card hover/focus (globals.css .di-*, .pk-*). Delivery: a parcel that hops onto a
// scooter's rack as the scooter rolls in, wheels spinning, speed lines trailing. Pickup: a takeaway bag that swells
// and glows while the handi lid in it bobs, being packed.
const DeliveryIcon = () => (
  <svg viewBox="0 0 48 48" className="h-10 w-10 overflow-visible" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round" aria-hidden>
    <g className="di-speed">
      <path d="M1 25h5M2 30h4" />
    </g>
    <g className="di-scooter">
      <path d="M9 35h15l4-9h8c3 0 5 2 6 5l1 4" />
      <path d="M36 26l3-10h4" />
      <path d="M8 26h12" />
      {[13, 39].map((cx) => (
        <g key={cx}>
          <circle cx={cx} cy="37" r="4" />
          <path className="di-wheel" d={`M${cx - 2.5} 37h5`} />
        </g>
      ))}
    </g>
    <g className="di-parcel">
      <rect x="13" y="12" width="22" height="18" rx="2.5" />
      <path d="M13 19h22M24 12v7" />
    </g>
  </svg>
);
const PickupIcon = () => (
  <svg viewBox="0 0 48 48" className="h-10 w-10 overflow-visible" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round" aria-hidden>
    <g className="pk-lid">
      <path d="M17 14c0-4 3-6 7-6s7 2 7 6Z" />
      <path d="M24 5v3" />
    </g>
    <g className="pk-bag">
      <path d="M19 19c0-5 10-5 10 0" />
      <path d="M11 19h26l-3 22H14Z" />
      <circle cx="24" cy="30" r="4" />
    </g>
  </svg>
);

// An embossed RD seal sunk into each card; it drifts against the cursor (the card's --mx/--my from magnet) and rings
// ripple out from it while the card is hovered.
const CardMark = () => (
  <svg viewBox="0 0 200 200" aria-hidden className="card-mark pointer-events-none absolute -bottom-16 -right-16 h-72 w-72 text-crimson-deep">
    {[0, 1, 2].map((k) => (
      <circle key={k} className="mark-ripple" cx="100" cy="100" r="70" fill="none" stroke="currentColor" strokeOpacity=".18" strokeWidth="1.2" style={{ animationDelay: `${k * 0.8}s` }} />
    ))}
    <g fill="none" stroke="currentColor" strokeOpacity=".09" strokeWidth="2">
      <circle cx="100" cy="100" r="72" />
      <circle cx="100" cy="100" r="60" />
    </g>
    <text x="100" y="116" textAnchor="middle" fontSize="48" fontFamily="Georgia, serif" fill="currentColor" fillOpacity=".08">RD</text>
  </svg>
);

// Whole spices drifting in the Delivery band: image, position, width, loop offset.
const SPICES = [
  ["star-anise", "left-[6%] top-[14%]", "3.5rem", "0s"],
  ["cardamom", "right-[30%] top-[8%]", "2.75rem", "-3s"],
  ["cinnamon", "right-[5%] top-[48%]", "4.5rem", "-6s"],
  ["clove", "left-[44%] bottom-[6%]", "2.5rem", "-2s"],
  ["saffron", "left-[3%] top-[58%]", "3.5rem", "-8s"],
];

export function Delivery() {
  const { cart } = useShop();
  const list = useRef(null);
  const band = useRef(null);
  const on = useOnScreen(band);
  // Entrance: each card rises, scales and tips upright with a soft overshoot, one after the other.
  useEffect(() => {
    if (matchMedia("(prefers-reduced-motion: reduce)").matches) return;
    gsap.registerPlugin(ScrollTrigger);
    const cards = list.current.querySelectorAll(".deliver-card");
    const tween = gsap.fromTo(
      cards,
      { opacity: 0, y: 70, scale: 0.9, rotateX: 12, transformPerspective: 900 },
      { opacity: 1, y: 0, scale: 1, rotateX: 0, duration: 1.3, ease: "back.out(1.5)", stagger: 0.16, clearProps: "opacity,transform", scrollTrigger: { trigger: list.current, start: "top 85%", once: true } }
    );
    return () => (tween.scrollTrigger?.kill(), tween.kill());
  }, []);
  const ready = totals(cart).count > 0;
  // With something in the cart: open checkout on the chosen option. Empty: go and pick a biriyani first (same label,
  // so the button never wraps on a phone).
  const start = (fulfil) => {
    setFulfil(fulfil);
    if (ready) {
      setOpen(true);
      setStep("details");
    } else document.getElementById("menu")?.scrollIntoView({ behavior: matchMedia("(prefers-reduced-motion: reduce)").matches ? "auto" : "smooth" });
  };
  const OPTIONS = [
    {
      id: "delivery",
      Icon: DeliveryIcon,
      title: "Delivery",
      points: [
        DELIVERY_PINS.length ? "Enter your PIN code at checkout; we check it against our delivery areas before you order." : "Enter your PIN code at checkout; delivery to your area is confirmed with your order.",
        DELIVERY_FEE == null ? "Any delivery fee is confirmed with your order." : `Delivery fee: ${inr(DELIVERY_FEE)}.`,
      ],
      cta: "Order for delivery",
      Art: DeliveryArt,
    },
    {
      id: "pickup",
      Icon: PickupIcon,
      title: "Pickup",
      points: [PICKUP ? `Collect from ${PICKUP}.` : "The pickup address is confirmed with your order.", ...(HOURS ? [`Open ${HOURS}.`] : []), "No delivery fee."],
      cta: "Order for pickup",
      Art: PickupArt,
    },
  ];
  return (
    <section ref={band} id="delivery" className="relative z-10 overflow-hidden bg-peach px-5 pb-24 pt-20 text-ink sm:px-10 xl:px-16">
      {/* Behind everything: two biriyanis turning slowly off the edges, whole spices drifting, saffron dust rising. */}
      <div aria-hidden className="pointer-events-none absolute inset-0">
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img src="/plates/dish/mutton.webp" alt="" width="720" height="720" loading="lazy" className="spin-slow absolute -right-36 -top-40 w-[17rem] sm:-right-40 sm:-top-36 rounded-full opacity-80 [mask-image:radial-gradient(closest-side,#000_80%,transparent)] sm:w-[34rem]" />
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img src="/plates/dish/prawn.webp" alt="" width="720" height="720" loading="lazy" className="spin-slow absolute -bottom-48 -left-44 w-[24rem] rounded-full opacity-75 [animation-direction:reverse] [mask-image:radial-gradient(closest-side,#000_80%,transparent)] sm:w-[30rem]" />
        {SPICES.map(([src, pos, w, delay]) => (
          // eslint-disable-next-line @next/next/no-img-element
          <img key={pos} src={`/plates/spice/${src}.webp`} alt="" width="320" height="320" loading="lazy" className={`spice-float absolute opacity-95 ${pos}`} style={{ width: w, animationDelay: delay }} />
        ))}
        <Dust run={on} light count={30} />
      </div>
      <div className="relative mx-auto max-w-6xl">
        <p className="lift text-[11px] uppercase tracking-[0.4em] text-crimson-deep">Delivery & pickup</p>
        <h2 className="lift mt-4 font-serif text-5xl font-medium leading-[0.95] tracking-[-0.01em] sm:text-7xl">
          To your door, <em className="text-crimson-deep">or ours.</em>
        </h2>
        <ul ref={list} className="mt-14 grid gap-6 md:grid-cols-2 lg:gap-8">
          {OPTIONS.map(({ id, Icon, title, points, cta, Art }) => (
            <li key={id}>
              <article
                onPointerMove={magnet}
                onPointerLeave={unmagnet}
                className="deliver-card magnetic on-dark group relative isolate flex h-full flex-col overflow-hidden rounded-[2rem] bg-[#fff5ea]/35 p-7 shadow-[0_30px_60px_-36px_rgba(110,40,10,0.45),inset_0_1px_0_rgb(255_255_255/0.7)] ring-1 ring-white/60 backdrop-blur-md transition-[box-shadow,background-color] duration-500 hover:bg-[#fff5ea]/55 hover:shadow-[0_60px_90px_-44px_rgba(110,40,10,0.55),inset_0_1px_0_rgb(255_255_255/0.8)] sm:p-10"
              >
                <CardMark />
                <div className="flex items-start justify-between gap-6">
                  <div>
                    <span className="grid h-16 w-16 place-items-center rounded-full bg-crimson-deep text-amber shadow-[0_14px_24px_-12px_rgba(110,40,10,0.75)] transition-colors duration-500 group-hover:bg-[#3b2418]">
                      <Icon />
                    </span>
                    <h3 className="mt-6 font-serif text-[2.6rem] font-medium leading-none tracking-[-0.01em] sm:text-5xl">{title}</h3>
                  </div>
                  <div className="w-28 shrink-0 sm:w-40">
                    <Art />
                  </div>
                </div>
                <ul className="mt-7 max-w-md space-y-3.5 text-[15px] leading-relaxed text-ink/75">
                  {points.map((pt) => (
                    <li key={pt} className="flex gap-3">
                      <Check />
                      {pt}
                    </li>
                  ))}
                </ul>
                <div className="mt-auto pt-9">
                  <button
                    onClick={() => start(id)}
                    onPointerMove={magnet}
                    onPointerLeave={unmagnet}
                    className="magnetic-btn group/btn flex min-h-13 w-full items-center justify-between gap-6 rounded-full bg-crimson-deep pl-7 pr-2 text-sm font-semibold tracking-wide text-ivory shadow-[0_14px_26px_-14px_rgba(110,40,10,0.7)] transition-[background-color,box-shadow] duration-500 hover:bg-[#3b2418] hover:shadow-[0_20px_34px_-14px_rgba(59,36,24,0.7)] sm:w-auto"
                  >
                    {cta}
                    {/* The arrow slides out to the right as a fresh one slides in from the left. */}
                    <span aria-hidden className="relative grid h-10 w-10 place-items-center overflow-hidden rounded-full bg-ivory/15">
                      <span className="transition-transform duration-500 ease-[cubic-bezier(.2,.8,.2,1)] group-hover/btn:translate-x-[220%]">→</span>
                      <span className="absolute -translate-x-[220%] transition-transform duration-500 ease-[cubic-bezier(.2,.8,.2,1)] group-hover/btn:translate-x-0">→</span>
                    </span>
                  </button>
                </div>
              </article>
            </li>
          ))}
        </ul>
      </div>
    </section>
  );
}

const FAQ = [
  { q: "How do I order?", a: "Pick your biriyani and any sides, open the cart, choose delivery or pickup, and add your details. Your order summary is shown before you confirm." },
  { q: "Can I collect it myself?", a: "Yes, choose Pickup at checkout. There is no delivery fee for pickup." },
  { q: "Do you deliver to my area?", a: "Enter your PIN code at checkout; it is checked before the order is placed." },
  { q: "How do I pay?", a: WHATSAPP ? "Payment is arranged when the restaurant confirms your order on WhatsApp." : "Online ordering and payment are not connected yet: this store is currently a demo." },
  { q: "What is Kaima rice?", a: "A short-grain, fragrant rice traditionally used for Malabar biriyani in north Kerala." },
];

export function Faq() {
  return (
    <section id="faq" className="faq relative z-10 bg-paper px-5 pb-28 text-ink sm:px-10 xl:px-16">
      <div className="mx-auto grid max-w-7xl gap-10 border-t border-ink/10 pt-16 md:grid-cols-[1fr_1.5fr] md:gap-16">
        <div className="md:sticky md:top-28 md:self-start">
          <h2 className="lift font-serif text-5xl font-medium leading-[0.98] sm:text-6xl">
            Questions, <em className="text-copper-deep">answered.</em>
          </h2>
          <a href="#menu" className="lift mt-8 inline-flex min-h-12 items-center rounded-full bg-amber px-7 text-sm font-semibold text-ink transition hover:brightness-110">
            Order Biriyani
          </a>
        </div>
        <div className="border-b border-ink/10">
          {FAQ.map((f, i) => (
            <details key={f.q} className="lift group border-t border-ink/10">
              {/* Number and question share a baseline; the toggle sits centred on the row. */}
              <summary className="flex min-h-16 cursor-pointer list-none items-center gap-4 py-5 [&::-webkit-details-marker]:hidden">
                <span className="flex flex-1 items-baseline gap-4">
                  <span className="w-8 shrink-0 text-sm font-semibold tabular-nums tracking-[0.12em] text-copper-deep/55 transition-colors duration-300 group-hover:text-copper-deep group-open:text-copper-deep">0{i + 1}</span>
                  <span className="font-serif text-2xl leading-snug transition-[color,translate] duration-300 group-hover:translate-x-1 group-hover:text-copper-deep">{f.q}</span>
                </span>
                <span aria-hidden className="grid h-10 w-10 shrink-0 place-items-center rounded-full border border-ink/15 text-lg transition-[rotate,background-color,color,border-color] duration-300 group-hover:border-ink/40 group-open:rotate-45 group-open:border-ink group-open:bg-ink group-open:text-paper">
                  +
                </span>
              </summary>
              <p className="faq-answer max-w-prose pb-7 pl-12 pr-14 text-[15px] leading-relaxed text-ink/70">{f.a}</p>
            </details>
          ))}
        </div>
      </div>
    </section>
  );
}

const FOOTER_NAV = [["/#menu", "Menu"], ["/#combos", "Combos"], ["/#delivery", "Delivery & pickup"], ["/#faq", "FAQ"]];

// The footer: dark, quiet and spare. Wordmark and tagline, one row of links, contact only when the business has set
// it, and a hairline with the imagery note. Entered through the same soft wave as the other section changes.
// The footer's story sketch: the Malabar biriyani told in four line drawings across one wide panorama. The spice
// ships come in to the coast; palms, a dotted spice route and the sacks ashore; cardamom and star anise crushed in a
// stone mortar; the chembu sealed with dough over the fire, steaming. On screen it draws itself scene by scene (GSAP
// DrawSVG), each caption fading in under its picture, holds, erases and starts again, on a loop that runs only while the
// footer is visible. Where the panorama is wider than the screen (phones) the view pans along with the pen (--pan, with
// container units so it adapts to any width). Reduced motion: the whole drawing, still and fitted to the width.
const SCENES = [
  ["The ships come in", [
    "M0 204q20-8 40 0t40 0 40 0 40 0 40 0 40 0 40 0 40 0 40 0",
    "M18 92a22 22 0 1 0 44 0a22 22 0 1 0-44 0",
    "M70 52q6-6 12 0q6-6 12 0M104 38q5-5 10 0q5-5 10 0",
    "M86 186q74 24 156 0l-14-18H100Z",
    "M162 168V68M162 68l16-6-16-6",
    "M162 74q54 30 72 86H122q26-40 40-86Z",
    "M268 180q32 10 66 0l-6-8h-54ZM300 172v-44M300 130q22 14 28 38h-42q8-18 14-38Z",
  ]],
  ["Along the spice coast", [
    "M372 204Q520 188 640 196t170 2",
    "M345 138l4 -1 M357 132l4 -1 M369 126l4 -1 M381 121l4 -1 M393 116l4 -1 M405 112l4 -1 M416 108l4 -1 M428 105l4 -1 M440 102l4 -1 M452 101l4 -1 M464 99l4 -1 M476 98l4 -1 M487 98l4 -1 M499 98l4 -1 M511 99l4 -1 M523 100l4 -1 M535 102l4 -1 M546 104l4 -1 M558 107l4 -1 M570 111l4 -1 M582 115l4 -1 M593 119l4 -1 M605 124l4 -1 M617 130l4 -1 M629 136l4 -1 M640 143l4 -1 M652 150l4 -1",
    "M470 198c4-36 10-68 24-96M494 102c-18-8-36-2-46 10M494 102c-8-18-2-34 8-42M494 102c16-12 34-12 46-4M494 102c18 2 28 14 30 28M494 102c-12 8-18 20-18 34",
    "M566 198c2-26 6-46 16-66M582 132c-14-4-26 2-32 10M582 132c-4-14 0-24 8-30M582 132c12-8 24-8 32-2M582 132c12 2 18 10 20 20",
    "M640 198v-22q0-10 12-12-4-6 2-8h12q6 2 2 8 12 2 12 12v22ZM684 198v-18q0-8 10-10-3-5 2-7h10q5 2 2 7 10 2 10 10v18Z",
    "M726 164l40-28 40 28M736 164l-12 8M796 164l12 8M738 164v34M794 164v34M758 198v-20h16v20",
  ]],
  ["Ground by hand", [
    "M830 204h350",
    "M896 160q74-16 148 0M896 160q4 38 38 44h72q34-6 38-44",
    "M1012 162 1062 72q8-10 16-4 8 8 0 16l-48 82",
    "M872 122q10-14 22-6-8 14-22 6ZM876 120l14-4M1086 132q12-10 22 0-10 10-22 0ZM1088 132h18",
    "M1114.0 79.0 L1115.9 87.4 L1123.2 82.8 L1118.6 90.1 L1127.0 92.0 L1118.6 93.9 L1123.2 101.2 L1115.9 96.6 L1114.0 105.0 L1112.1 96.6 L1104.8 101.2 L1109.4 93.9 L1101.0 92.0 L1109.4 90.1 L1104.8 82.8 L1112.1 87.4ZM1114 92m-3 0a3 3 0 1 0 6 0a3 3 0 1 0-6 0",
    "M926.0 76.0 L927.5 82.3 L933.1 78.9 L929.7 84.5 L936.0 86.0 L929.7 87.5 L933.1 93.1 L927.5 89.7 L926.0 96.0 L924.5 89.7 L918.9 93.1 L922.3 87.5 L916.0 86.0 L922.3 84.5 L918.9 78.9 L924.5 82.3Z",
    "M956 120l-6-14M976 112v-16M996 118l6-14",
  ]],
  ["Sealed for dum", [
    "M1260 204h330M1296 204q10-14 22 0M1478 204q10-14 22 0",
    "M1336 204q5-10 0-18 10 6 8 18M1362 204q6-14 0-24 13 9 9 24M1390 204q7-16 0-28 15 10 10 28M1418 204q6-14 0-24 13 9 9 24M1446 204q5-10 0-18 10 6 8 18",
    "M1350 112c-34 8-48 26-48 46 0 20 30 30 88 30s88-10 88-30c0-20-14-38-48-46",
    "M1352 112v-10h76v10M1352 112h76",
    "M1336 140h.1M1358 130h.1M1382 126h.1M1406 128h.1M1428 134h.1M1446 146h.1M1330 162h.1M1352 156h.1M1376 152h.1M1400 152h.1M1424 156h.1M1448 164h.1M1346 176h.1M1372 172h.1M1398 172h.1M1424 176h.1",
    "M1352 90q38-30 76 0M1384 66q6-9 12 0",
    "M1344 98q5-7 10 0t10 0 10 0 10 0 10 0 10 0 10 0 10 0 10 0 10 0",
    "M1366 52q-8-12 0-22t0-20M1390 46q-8-12 0-22t0-20M1414 52q-8-12 0-22t0-20",
  ]],
];
const CAPTION_X = [170, 590, 1000, 1400];

function StorySketch() {
  const root = useRef(null);
  useEffect(() => {
    if (matchMedia("(prefers-reduced-motion: reduce)").matches) return;
    gsap.registerPlugin(ScrollTrigger, DrawSVGPlugin);
    const ctx = gsap.context(() => {
      const q = gsap.utils.selector(root);
      const art = q("svg")[0];
      gsap.set(q(".sk-line"), { drawSVG: 0 });
      gsap.set(q(".sk-cap"), { opacity: 0 });
      gsap.set(art, { "--pan": 0 });
      const tl = gsap.timeline({ repeat: -1, repeatDelay: 0.6, paused: true });
      q(".sk-scene").forEach((g, i) => {
        tl.addLabel(`s${i}`)
          .to(art, { "--pan": i / (SCENES.length - 1), duration: 1.4, ease: "sine.inOut" }, `s${i}`)
          .to(g.querySelectorAll(".sk-line"), { drawSVG: "100%", duration: 1.1, stagger: 0.22, ease: "power1.inOut" }, `s${i}+=0.2`)
          .to(g.querySelector(".sk-cap"), { opacity: 1, duration: 0.6 }, `s${i}+=0.8`);
      });
      tl.to({}, { duration: 2.2 }) // the finished story, held
        .to(q(".sk-line"), { drawSVG: "100% 100%", duration: 0.9, stagger: 0.015, ease: "power1.in" })
        .to(q(".sk-cap"), { opacity: 0, duration: 0.5 }, "<")
        .to(art, { "--pan": 0, duration: 1.2, ease: "sine.inOut" }, "<");
      ScrollTrigger.create({ trigger: root.current, start: "top bottom", end: "bottom top", onToggle: (st) => (st.isActive ? tl.play() : tl.pause()) });
    }, root);
    return () => ctx.revert();
  }, []);
  return (
    <div ref={root} aria-hidden className="relative w-full overflow-hidden [container-type:inline-size]">
      <svg
        viewBox="0 0 1600 250"
        className="block w-[max(100%,62rem)] text-[#e9b872] [filter:drop-shadow(0_0_5px_rgb(233_184_114/0.5))] [transform:translateX(calc((100cqw-100%)*var(--pan,0)))] motion-reduce:w-full"
        fill="none"
        stroke="currentColor"
        strokeWidth="2.4"
        strokeLinecap="round"
        strokeLinejoin="round"
      >
        {SCENES.map(([cap, lines], i) => (
          <g key={cap} className="sk-scene">
            {lines.map((d) => (
              <path key={d} className="sk-line" d={d} />
            ))}
            <text className="sk-cap font-serif" x={CAPTION_X[i]} y="240" textAnchor="middle" fill="currentColor" stroke="none" fontStyle="italic" fontSize="21">
              {cap}
            </text>
          </g>
        ))}
      </svg>
    </div>
  );
}

// "Swipe to taste it" (after the user's reference): drag the selected biriyani along the pill to the end and it goes
// in the cart; it rolls as it slides and springs back. Idle, it nudges right to show the gesture. A tap or the keyboard
// adds it too (the dish is a button).
function Swipe() {
  const { flavor } = useShop();
  const d = dish(flavor);
  const track = useRef(null);
  const knob = useRef(null);
  const start = useRef(null); // pointer x where the drag began, while dragging
  const moved = useRef(false);
  const [x, setX] = useState(0);
  const max = () => track.current.clientWidth - knob.current.offsetWidth - 12;
  const done = () => {
    add(d.id);
    flyToCart(knob.current, `/plates/dish/${d.id}.webp`);
  };
  const end = () => {
    if (start.current === null) return;
    if (x >= max() * 0.85) done();
    start.current = null;
    setX(0);
  };
  return (
    <div ref={track} className="relative h-20 w-full overflow-hidden rounded-full bg-ivory shadow-[0_24px_40px_-24px_rgba(60,0,0,0.6)] sm:h-24">
      <span aria-hidden className="absolute inset-y-0 left-0 rounded-full bg-amber/40" style={{ width: `calc(${x}px + 5.5rem)`, transition: start.current === null ? "width .5s cubic-bezier(.2,.8,.2,1)" : "none" }} />
      <span aria-hidden className="absolute inset-y-0 right-8 flex items-center font-sans text-lg font-bold text-ink/55 sm:text-2xl" style={{ opacity: x ? Math.max(0, 1 - x / 160) : 1 }}>
        swipe to taste it <span className="ml-2 text-crimson">»</span>
      </span>
      <button
        ref={knob}
        onPointerDown={(e) => {
          start.current = e.clientX;
          moved.current = false;
          e.currentTarget.setPointerCapture(e.pointerId);
        }}
        onPointerMove={(e) => {
          if (start.current === null) return;
          const dx = Math.min(max(), Math.max(0, e.clientX - start.current));
          if (dx > 4) moved.current = true;
          setX(dx);
        }}
        onPointerUp={end}
        onPointerCancel={end}
        onClick={() => (moved.current ? (moved.current = false) : done())}
        aria-label={`Add ${d.full} to cart`}
        className={`absolute left-1.5 top-1.5 aspect-square h-[calc(100%-0.75rem)] cursor-grab touch-none rounded-full active:cursor-grabbing ${x ? "" : "swipe-hint"}`}
        style={{ transform: `translateX(${x}px) rotate(${x * 0.8}deg)`, transition: start.current === null ? "transform .5s cubic-bezier(.2,.8,.2,1)" : "none" }}
      >
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img key={d.id} src={`/plates/dish/${d.id}.webp`} alt="" width="160" height="160" draggable="false" className="intro-line h-full w-full rounded-full object-cover shadow-[0_12px_20px_-8px_rgba(60,10,0,0.6)] ring-4 ring-[#7a2a12]" />
      </button>
    </div>
  );
}

// The footer on a deep terracotta-bronze ground: the line, then the story sketch drawing itself edge to edge, the
// swipe-to-order pill and ORDER NOW, then the wordmark, links and contact, clear of the drawing.
export function Footer() {
  const contact = [PHONE && ["Phone", PHONE, `tel:${PHONE.replace(/\s/g, "")}`], WHATSAPP && ["WhatsApp", `+${WHATSAPP}`, `https://wa.me/${WHATSAPP}`], PICKUP && ["Address", PICKUP], HOURS && ["Hours", HOURS]].filter(Boolean);
  return (
    <footer className="relative z-10 bg-[linear-gradient(180deg,var(--color-terracotta)_0%,#6b2413_55%,#43170b_100%)] px-5 text-ivory sm:px-10 xl:px-16">
      <svg aria-hidden viewBox="0 0 1440 60" preserveAspectRatio="none" className="pointer-events-none absolute inset-x-0 -top-[59px] h-[60px] w-full text-terracotta">
        <path d="M0 60V28C240 2 460 0 700 22s460 38 620 16 100-20 120-18V60Z" fill="currentColor" />
      </svg>
      <div className="mx-auto max-w-7xl pb-10 pt-16">
        <div className="mx-auto flex max-w-2xl flex-col items-center text-center">
          <p className="font-serif text-4xl font-medium sm:text-5xl">
            Hungry? <em>Have a taste.</em>
          </p>
        </div>
        {/* Full-bleed: the drawing runs edge to edge. */}
        <div className="-mx-5 mt-8 sm:-mx-10 xl:-mx-16">
          <StorySketch />
        </div>
        <div className="mx-auto flex max-w-2xl flex-col items-center text-center">
          <div className="mt-8 w-full max-w-xl">
            <Swipe />
          </div>
          <a href="/#menu" className="mt-10 inline-flex min-h-13 items-center rounded-full bg-ivory px-10 text-base font-black uppercase tracking-wide text-terracotta shadow-[0_18px_30px_-18px_rgba(60,0,0,0.7)] transition-[scale] active:scale-95">
            Order now
          </a>
        </div>
        <div className="mt-20 grid gap-10 md:grid-cols-[1.3fr_1fr] md:items-end md:gap-16">
          <div>
            <p className="font-serif text-3xl tracking-[0.26em] sm:text-4xl">ROYAL DUM HERITAGE</p>
            <p className="mt-4 max-w-md font-serif text-xl italic leading-snug text-ivory/80">Malabar dum biriyani. From our chembu to your doorstep.</p>
          </div>
          <nav aria-label="Footer">
            <ul className="grid grid-cols-2 gap-x-6 sm:flex sm:flex-wrap sm:justify-end sm:gap-x-8">
              {FOOTER_NAV.map(([h, l]) => (
                <li key={h}>
                  <a href={h} className="inline-flex min-h-11 items-center text-sm tracking-wide text-ivory/85 underline decoration-ivory/0 decoration-1 underline-offset-[6px] transition-[color,text-decoration-color] duration-300 hover:text-ivory hover:decoration-ivory">
                    {l}
                  </a>
                </li>
              ))}
            </ul>
          </nav>
        </div>
        {contact.length > 0 && (
          <dl className="mt-12 flex flex-wrap gap-x-10 gap-y-3 text-sm">
            {contact.map(([k, v, href]) => (
              <div key={k}>
                <dt className="text-[11px] uppercase tracking-[0.25em] text-ivory/70">{k}</dt>
                <dd className="mt-1">{href ? <a href={href} className="underline-offset-4 hover:underline">{v}</a> : v}</dd>
              </div>
            ))}
          </dl>
        )}
        <div className="mt-14 flex flex-col gap-3 border-t border-ivory/20 pt-6 text-xs text-ivory/80 sm:flex-row sm:items-center sm:justify-between">
          <p>Imagery is AI-generated for illustration.</p>
          <a href="#" onClick={(e) => (e.preventDefault(), scrollTo({ top: 0, behavior: "smooth" }))} className="inline-flex min-h-11 w-fit items-center underline-offset-4 hover:underline">
            Back to top ↑
          </a>
        </div>
      </div>
      {/* Room for the mobile Menu/Cart bar, so it never covers the last of the page. */}
      <div className="h-[calc(4.25rem+env(safe-area-inset-bottom))] md:hidden" aria-hidden />
    </footer>
  );
}
