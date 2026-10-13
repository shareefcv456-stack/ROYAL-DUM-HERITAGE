"use client";

import { useEffect, useRef, useState } from "react";
import { DISHES, add, setFlavor, setFulfil } from "./cart";
import { flyToCart } from "./fly";
import { useOnScreen } from "./hooks";

// Two animated posters just before the footer, after the user's Pinterest references: "This or That" (two biriyanis on
// diagonal pills on an orange that shifts shade, a new pair every few seconds rolling in along the pills and rocking
// on them; the names are the add buttons) and "walking to your doorstep" (a handi of each biriyani marching
// across a crossing on little legs). CSS transforms only; both hold still off screen and under reduced motion.

const LABEL = { fish: "Fish Neymeen" };
const name = (x) => LABEL[x.id] || x.name;
const reduced = () => matchMedia("(prefers-reduced-motion: reduce)").matches;
const pick = (x, e) => {
  setFlavor(x.id);
  add(x.id);
  flyToCart(e.currentTarget, `/plates/dish/${x.id}.webp`);
};

// ---------------------------------------------------------------- This or That

// Where each half of the pair sits in the square stage (% of its width): the cream pill, the dish on one end and the
// name on the other, as in the reference.
// `roll` is the far end of the pill the plate rolls in from (along the pill's 40° line) and which way it spins.
const SIDES = [
  { pill: "left-[39%] top-[28%]", img: "left-[29%] top-[1%]", text: "left-[82%] top-[57%]", roll: { "--rx": "92%", "--ry": "77%", "--rr": "300deg", "--dx": "14%", "--dy": "12%", "--dr": "50deg" } },
  { pill: "left-[5%] top-[50%]", img: "left-[39%] top-[57%]", text: "left-[20%] top-[45%]", roll: { "--rx": "-92%", "--ry": "-77%", "--rr": "-300deg", "--dx": "-14%", "--dy": "-12%", "--dr": "-50deg" } },
];

// The orange the section cross-fades to with each pair (deep enough for ivory type).
const ORANGES = ["#d9622a", "#c9502a", "#d4702a", "#c4452a", "#d05a2c"];

export function ThisOrThat() {
  const root = useRef(null);
  const on = useOnScreen(root);
  const [k, setK] = useState(0);
  const [hold, setHold] = useState(false);
  const next = () => setK((v) => (v + 1) % DISHES.length);
  useEffect(() => {
    if (!on || hold || reduced()) return;
    const id = setTimeout(next, 3800);
    return () => clearTimeout(id);
  }, [k, on, hold]);
  const pair = [DISHES[k], DISHES[(k + 1) % DISHES.length]];

  return (
    <section ref={root} aria-label="This or that" className="relative z-10 overflow-hidden px-5 py-24 text-ivory transition-colors duration-1000 ease-[cubic-bezier(.2,.8,.2,1)] sm:px-10 xl:px-16" style={{ backgroundColor: ORANGES[k] }}>
      <div className="mx-auto grid max-w-7xl items-center gap-10 md:grid-cols-[0.8fr_1.2fr]">
        <div className="relative">
          <h2 className="font-sans text-7xl font-black uppercase leading-[0.9] tracking-tight sm:text-8xl">
            This <span className="font-serif text-4xl font-medium normal-case italic text-ivory/85 sm:text-5xl">or</span>
            <span className="block">That?</span>
          </h2>
          {/* Dashed arrows that keep flowing toward the dishes. */}
          <svg aria-hidden viewBox="0 0 220 90" className="mt-6 w-56 text-ivory/80" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round">
            <path className="dash-flow" strokeDasharray="6 9" d="M6 70C50 10 120 6 196 40" />
            <path d="m184 28 14 13-18 6" />
          </svg>
          <p className="mt-4 max-w-sm text-lg font-medium text-ivory/95">Two biriyanis, one craving. Tap the one you want and it goes straight in the cart.</p>
          <button onClick={next} className="mt-6 inline-flex min-h-11 items-center gap-2 rounded-full border border-ivory/60 px-5 text-sm font-semibold transition hover:bg-ivory/15">
            Show another pair <span aria-hidden>↻</span>
          </button>
        </div>

        <div
          onPointerEnter={() => setHold(true)}
          onPointerLeave={() => setHold(false)}
          onFocus={() => setHold(true)}
          onBlur={() => setHold(false)}
          className="relative mx-auto aspect-square w-[min(92vw,38rem)]"
        >
          {pair.map((x, i) => (
            <div key={i}>
              <span aria-hidden className={`absolute h-[24%] w-[62%] rotate-[40deg] rounded-full bg-ivory shadow-[0_24px_40px_-26px_rgba(150,50,20,0.5)] ${SIDES[i].pill}`} />
              <button
                key={`img-${x.id}`}
                onClick={(e) => pick(x, e)}
                tabIndex={-1}
                aria-hidden
                className={`roll-in absolute aspect-square w-[40%] rounded-full ${SIDES[i].img}`}
                style={SIDES[i].roll}
              >
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img src={`/plates/dish/${x.id}.webp`} alt="" width="360" height="360" loading="lazy" className="h-full w-full rounded-full object-cover shadow-[0_26px_40px_-18px_rgba(42,26,20,0.65)]" />
              </button>
              {/* The name is the button: a coral pill that adds the dish. */}
              <button
                key={`name-${x.id}`}
                onClick={(e) => pick(x, e)}
                aria-label={`Add ${x.full} to cart`}
                className={`intro-line absolute -translate-x-1/2 -translate-y-1/2 rounded-full bg-crimson px-5 py-2.5 text-center text-ivory shadow-[0_16px_28px_-14px_rgba(90,20,0,0.75)] transition-[background-color,scale] duration-200 hover:bg-crimson-deep active:scale-95 sm:px-7 sm:py-3 ${SIDES[i].text}`}
              >
                <span className="block font-sans text-base font-black uppercase tracking-tight sm:text-2xl">{name(x)}</span>
                <span className="mt-0.5 flex items-center justify-center gap-1.5 text-[11px] font-semibold uppercase tracking-[0.2em] text-ivory/85">
                  Biriyani <span aria-hidden className="grid h-4 w-4 place-items-center rounded-full bg-ivory text-[11px] leading-none text-crimson">+</span>
                </span>
              </button>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}

// ---------------------------------------------------------------- Walking handis

// A copper handi with a dome of biriyani heaped over its brass rim (the middle of the dish photo, clipped to rim +
// mound), walking on two
// jointed legs: each thigh swings from the hip and each shin bends at the knee as the foot lifts (globals.css
// .walk-*), the pot bobs on every step and waddles side to side, and its shadow breathes with the step.
function Handi({ x, copy }) {
  const id = `${x.id}-${copy}`;
  const leg = (hip, b) => (
    <g className={`walk-leg ${b ? "walk-leg-b" : ""}`} style={{ transformOrigin: `${hip}px 176px` }}>
      <path d={`M${hip} 176V214`} stroke="#fff" strokeWidth="9" strokeLinecap="round" />
      <g className="walk-shin" style={{ transformOrigin: `${hip}px 214px` }}>
        <path d={`M${hip} 214V250`} stroke="#fff" strokeWidth="9" strokeLinecap="round" />
        <path d={`M${hip - 7} 247h25a7.5 7.5 0 0 1 0 15h-25a7 7 0 0 1 0-15Z`} fill="#fff" />
      </g>
    </g>
  );
  return (
    <svg viewBox="0 0 200 270" className="w-full overflow-visible" aria-hidden>
      <defs>
        <clipPath id={`heap-${id}`}>
          <ellipse cx="100" cy="80" rx="78" ry="16" />
          <path d="M22 81C30 26 170 26 178 81Z" />
        </clipPath>
        <linearGradient id={`cu-${id}`} x1="0" x2="1">
          <stop offset="0" stopColor="#5e2a12" />
          <stop offset=".32" stopColor="#b5622f" />
          <stop offset=".5" stopColor="#e6a066" />
          <stop offset=".7" stopColor="#a8532a" />
          <stop offset="1" stopColor="#4f220e" />
        </linearGradient>
        <linearGradient id={`brass-${id}`} x1="0" x2="1">
          <stop offset="0" stopColor="#8a5a1c" />
          <stop offset=".5" stopColor="#f1c97a" />
          <stop offset="1" stopColor="#7a4c16" />
        </linearGradient>
      </defs>
      <ellipse className="walk-shadow" cx="100" cy="262" rx="72" ry="8" fill="#3a0d04" fillOpacity=".28" />
      {leg(80, false)}
      {leg(120, true)}
      <g className="walk-sway">
        <g className="walk-body">
          {/* Handi: a narrow neck flaring to a round belly, hammered copper with a darker band. */}
          <path d="M30 86C22 100 4 112 6 138c4 34 48 50 94 50s90-16 94-50c2-26-16-38-24-52Z" fill={`url(#cu-${id})`} />
          <path d="M14 116c26 10 146 10 172 0" stroke="#4f220e" strokeOpacity=".55" strokeWidth="5" fill="none" />
          {[[46, 140], [70, 160], [104, 150], [134, 166], [152, 136], [84, 128]].map(([cx, cy]) => (
            <ellipse key={cx} cx={cx} cy={cy} rx="5" ry="3" fill="#fff" fillOpacity=".14" />
          ))}
          <ellipse cx="100" cy="82" rx="90" ry="20" fill={`url(#brass-${id})`} />
          <ellipse cx="100" cy="81" rx="80" ry="16" fill="#3a1a0c" />
          <image href={`/plates/dish/${x.id}.webp`} x="-60" y="-90" width="320" height="320" preserveAspectRatio="xMidYMid slice" clipPath={`url(#heap-${id})`} />
          <path d="M10 82a90 20 0 0 0 180 0" stroke={`url(#brass-${id})`} strokeWidth="7" fill="none" />
        </g>
      </g>
    </svg>
  );
}

const Cloud = ({ className }) => (
  <svg aria-hidden viewBox="0 0 120 60" className={`absolute fill-white ${className}`}>
    <path d="M24 56a20 20 0 0 1 2-40 26 26 0 0 1 48-6 22 22 0 0 1 32 22 12 12 0 0 1-2 24Z" />
  </svg>
);

// Pedestrian signal figures (24×24).
const StandMan = ({ className }) => (
  <svg viewBox="0 0 24 24" fill="currentColor" className={className}>
    <circle cx="12" cy="4" r="2.6" />
    <path d="M8.6 8h6.8l1.2 8h-2.2l-.7 7h-3.4l-.7-7H7.4Z" />
  </svg>
);
const WalkMan = ({ className }) => (
  <svg viewBox="0 0 24 24" fill="currentColor" className={className}>
    <circle cx="13.4" cy="3.6" r="2.5" />
    <path d="m10.6 7.4 3.4-.5 2.2 4.2 3.2 1.1-.7 1.9-4-1.4-1-1.7-.9 3.9 2.7 2.7 1 6.2H14l-.9-4.8-2.7-2.5-1.1 3.6-3.5 3.8-1.6-1.5 3.1-3.5 1.7-7.3-1.9 1-1 3.3-2.1-.6 1.5-4.6Z" />
  </svg>
);

// A modern pedestrian signal at the near kerb (in front of the parade): red standing man, green walking man (flashing
// as time runs out) and a countdown.
function Signal({ walking, left }) {
  const lamp = "grid h-11 w-11 place-items-center rounded-xl bg-black/50 sm:h-16 sm:w-16";
  return (
    <div aria-hidden className="absolute bottom-24 left-[3%] z-20 flex flex-col items-center sm:left-[6%]">
      <div className="flex flex-col gap-2 rounded-2xl bg-[#1f1b1a] p-2.5 shadow-[0_24px_40px_-20px_rgba(40,8,0,0.8)] ring-4 ring-[#1f1b1a]/30">
        <span className={lamp}>
          <StandMan className={`h-8 w-8 sm:h-11 sm:w-11 transition-[color,filter] duration-300 ${walking ? "text-[#4a1610]" : "text-[#ff4d36] drop-shadow-[0_0_8px_rgba(255,77,54,0.8)]"}`} />
        </span>
        <span className={lamp}>
          <WalkMan className={`h-8 w-8 sm:h-11 sm:w-11 transition-[color,filter] duration-300 ${walking ? `text-[#46e07c] drop-shadow-[0_0_8px_rgba(70,224,124,0.8)] ${left <= 3 ? "blink" : ""}` : "text-[#173a22]"}`} />
        </span>
        <span className={`rounded-md bg-black/60 py-0.5 text-center font-mono text-xl font-bold tabular-nums ${walking ? "text-[#46e07c]" : "text-[#ff4d36]"}`}>
          {String(left).padStart(2, "0")}
        </span>
      </div>
      <span className="h-20 w-3 rounded-b bg-[#1f1b1a] sm:h-32" />
      <span className="mt-1 rounded-full bg-ivory px-3 py-1 text-[11px] font-bold uppercase tracking-[0.18em] text-crimson">{walking ? "Walk" : "Wait"}</span>
    </div>
  );
}

// Seconds of the signal cycle: the handis cross on green, then stand and wait on red.
const WALK_S = 8;
const WAIT_S = 4;

export function Walk() {
  const root = useRef(null);
  const on = useOnScreen(root);
  const [t, setT] = useState(0); // seconds into the cycle
  useEffect(() => {
    if (!on || reduced()) return;
    const id = setInterval(() => setT((v) => (v + 1) % (WALK_S + WAIT_S)), 1000);
    return () => clearInterval(id);
  }, [on]);
  const walking = t < WALK_S;
  const left = walking ? WALK_S - t : WALK_S + WAIT_S - t;

  return (
    <section ref={root} aria-label="Biriyani walking to your doorstep" className={`relative z-10 overflow-hidden bg-crimson text-ivory ${on ? "" : "walk-paused"} ${walking ? "" : "walk-stopped"}`}>
      <Cloud className="drift left-[6%] top-8 w-24 opacity-35" />
      <Cloud className="drift drift-slow left-[58%] top-24 w-16 opacity-30" />
      <Cloud className="drift left-[30%] top-48 hidden w-28 opacity-35 [animation-delay:-14s] sm:block" />
      <div className="relative mx-auto max-w-7xl px-5 pt-20 text-center sm:px-10 md:text-right xl:px-16">
        <h2 className="font-sans font-extrabold leading-[0.95] tracking-tight">
          <span className="block text-3xl sm:text-5xl">All you need is</span>
          <span className="block text-6xl font-black text-[#ffd27a] sm:text-8xl">BIRIYANI!</span>
          <span className="mt-2 block text-2xl font-medium sm:text-4xl">walking to your doorstep.</span>
        </h2>
        <p className="mt-3 text-sm font-medium text-ivory/85">It even waits for the green man.</p>
        <div className="mt-6 flex flex-wrap items-center justify-center gap-3 text-sm font-semibold md:justify-end">
          <a href="#menu" className="inline-flex min-h-11 items-center rounded-full bg-ivory px-6 text-crimson transition-[scale] active:scale-95">
            Order now
          </a>
          <span className="text-ivory/80">or</span>
          <a href="#menu" onClick={() => setFulfil("pickup")} className="inline-flex min-h-11 items-center rounded-full border-2 border-ivory px-6 transition-[scale] active:scale-95">
            Takeaway
          </a>
        </div>
      </div>

      {/* The zebra crossing laid back in perspective, the signal at its far side, and the parade (two copies for a
          seamless loop; hovering holds it so a handi can be tapped). On red, everyone stops and stands. */}
      {/* The road runs under the footer's wave, so the parade walks clear of it. */}
      <div className="relative mt-4 h-[28rem] sm:h-[35rem]">
        <div aria-hidden className="absolute -inset-x-1/4 bottom-28 h-[40%] origin-bottom bg-[repeating-linear-gradient(90deg,var(--color-ivory)_0_56px,#3a3330_56px_112px)] [transform:perspective(420px)_rotateX(56deg)]" />
        <div aria-hidden className="absolute inset-x-0 bottom-0 h-28 bg-[#3a3330]" />
        <Signal walking={walking} left={left} />
        <div className="walk-track absolute bottom-[4.5rem] flex w-max">
          {[0, 1].map((copy) => (
            <ul key={copy} aria-hidden={copy === 1} className="flex gap-6 pr-6 sm:gap-12 sm:pr-12">
              {DISHES.map((x) => (
                <li key={x.id}>
                  <button tabIndex={copy ? -1 : 0} onClick={(e) => pick(x, e)} aria-label={`Add ${x.full} to cart`} className="group flex w-48 flex-col items-center sm:w-64">
                    <span className="block w-full transition-[scale] duration-300 group-hover:scale-105 group-active:scale-95">
                      <Handi x={x} copy={copy} />
                    </span>
                    <span className="-mt-1 rounded-full bg-ivory px-3 py-1 text-xs font-bold uppercase tracking-wide text-crimson shadow">{name(x)}</span>
                  </button>
                </li>
              ))}
            </ul>
          ))}
        </div>
      </div>
    </section>
  );
}
