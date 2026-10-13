"use client";

import { useEffect, useRef, useState } from "react";

// The opening loader (layout.jsx), after the user's mock-up: warm cream, the RD mark and wordmark over "Crafting Authentic
// Flavours…" on the left with a Kerala backwater at sunset (drawn: palms, a houseboat, the sun on the water) beneath;
// in the centre a large ring with a steaming handi, the percentage and "Preparing your experience…", a glowing bead
// riding the end of the arc; under it four steps that tick as the count passes each quarter (labels only: nothing is
// actually being cooked or checked); on the right the chicken biriyani in its copper pot, bleeding off the edge; a
// terracotta wave along the foot. It is in the server HTML, so it covers the page from the first paint, and shows on
// a fresh load or reload only (the layout persists across page changes, which use the Shutter instead).
//
// The percentage is a visual estimate tied to real readiness, not a timer: the web fonts, the hero photograph and the
// window's load event each raise its ceiling, and the number eases toward that ceiling (no stalls, no jumps). It
// reaches 100 only once all three are done, and never before MIN_MS. At 100 it holds a beat, then the loader fades
// away and the hero's entrance (paused under `html.is-loading`, set by a small script in layout.jsx) starts. Anything
// stuck: MAX_MS forces completion, and a CSS failsafe hides the overlay even if this script never runs.
const MIN_MS = 1500;
const MAX_MS = 8000;
const R = 92; // ring radius in the 200-unit viewBox
const CIRC = 2 * Math.PI * R;
const STEPS = [
  ["Fresh Ingredients", "M7 17C7 10 12 6 18 6c0 7-4 11-11 11ZM7 17l7-7"],
  ["Slow Cooking", "M5 11h14M6.5 11c0 4 2.5 7 5.5 7s5.5-3 5.5-7M8.5 9.5q3.5-2.5 7 0M12 8V6.5M10 4.5q-1-1 0-2M14 4.5q-1-1 0-2"],
  ["Dum Perfection", "M4 13h16M5 13a7 7 0 0 0 14 0M12 9v-.5M9 10q3-2 6 0M8 6.5q4-2 8 0"],
  ["A Royal Experience", "M4 17h16M5 17l-1-9 5 4 3-6 3 6 5-4-1 9"],
];

export default function Loader() {
  const [p, setP] = useState(0);
  const [phase, setPhase] = useState("load"); // load → done (100, held) → out (fading) → gone
  const ready = useRef({ fonts: false, hero: false, page: false });

  useEffect(() => {
    const still = matchMedia("(prefers-reduced-motion: reduce)").matches;
    const r = ready.current;
    const t0 = performance.now();
    let raf = 0, val = 0, finished = false;
    const timers = [];
    const unpause = () => document.documentElement.classList.remove("is-loading");

    document.fonts?.ready.then(() => (r.fonts = true));
    const img = document.querySelector("#top img");
    if (!img || img.complete) r.hero = true;
    else img.addEventListener("load", () => (r.hero = true), { once: true }), img.addEventListener("error", () => (r.hero = true), { once: true });
    if (document.readyState === "complete") r.page = true;
    else addEventListener("load", () => (r.page = true), { once: true });

    const tick = (now) => {
      const t = now - t0;
      const done = [r.fonts, r.hero, r.page].filter(Boolean).length;
      const all = done === 3 || t > MAX_MS;
      // The ceiling: each finished step opens up more of the bar; everything done (and the minimum shown) opens 100.
      const ceil = all && t >= MIN_MS ? 100 : Math.min(15 + done * 25, 90, 20 + (t / MIN_MS) * 70);
      val = Math.min(ceil, val + Math.max((ceil - val) * Math.min(1, (still ? 12 : 4.5) / 60), ceil > val ? 0.35 : 0));
      setP(val);
      if (val >= 99.95 && !finished) {
        finished = true;
        setP(100);
        setPhase("done");
        timers.push(setTimeout(() => setPhase("out"), still ? 150 : 400));
        timers.push(setTimeout(unpause, still ? 200 : 550));
        timers.push(setTimeout(() => setPhase("gone"), still ? 500 : 1100));
        return;
      }
      raf = requestAnimationFrame(tick);
    };
    raf = requestAnimationFrame(tick);
    return () => (cancelAnimationFrame(raf), timers.forEach(clearTimeout), unpause());
  }, []);

  if (phase === "gone") return null;
  const n = Math.round(p);
  // The bead at the end of the arc (the ring is drawn rotated -90°, so angle 0 is the top).
  const ang = (p / 100) * 2 * Math.PI;
  return (
    <div role="status" aria-live="polite" aria-label={`Loading Royal Dum Heritage, ${n}%`} className="loader fixed inset-0 z-[80] overflow-hidden bg-[radial-gradient(80%_70%_at_45%_40%,#fffaf4,var(--color-paper)_55%,#f6e3d0)]" data-phase={phase}>
      {/* A blurred palm frond in the top-left corner. */}
      <svg aria-hidden viewBox="0 0 200 200" className="pointer-events-none absolute -left-10 -top-10 hidden w-72 opacity-50 blur-[3px] md:block">
        <path d="M10 10C60 40 110 80 170 150" fill="none" stroke="#3f5a35" strokeWidth="3" />
        {Array.from({ length: 11 }, (_, i) => {
          const t = 0.12 + i * 0.075, x = 10 + 160 * t, y = 10 + 140 * t * t * 1.1;
          return <path key={i} d={`M${x} ${y}q${-18 + i} ${26 - i} ${-34 + i * 2} ${44 - i * 2}M${x} ${y}q${26 - i} ${-6} ${46 - i * 2} ${-4}`} fill="none" stroke="#557a45" strokeWidth={5 - i * 0.25} strokeLinecap="round" />;
        })}
      </svg>

      {/* The backwater at sunset, bottom-left. */}
      <svg aria-hidden viewBox="0 0 600 340" preserveAspectRatio="xMinYMax slice" className="pointer-events-none absolute bottom-0 left-0 hidden h-[32vh] w-[36vw] [mask-image:radial-gradient(120%_100%_at_0%_100%,#000_45%,transparent_80%)] md:block">
        <defs>
          <linearGradient id="bw-sky" x1="0" y1="0" x2="0" y2="1">
            <stop offset="0" stopColor="#fbe2d2" stopOpacity="0" />
            <stop offset="0.6" stopColor="#f7c39a" />
            <stop offset="1" stopColor="#f0a777" />
          </linearGradient>
          <linearGradient id="bw-water" x1="0" y1="0" x2="0" y2="1">
            <stop offset="0" stopColor="#e9a27a" />
            <stop offset="1" stopColor="#b9714f" />
          </linearGradient>
        </defs>
        <rect width="600" height="250" fill="url(#bw-sky)" />
        <circle cx="330" cy="236" r="34" fill="#fbd6a8" opacity=".9" />
        <path d="M240 250q60-30 120-14t140-6 100 4V250Z" fill="#c98a6a" opacity=".45" />
        <rect y="248" width="600" height="92" fill="url(#bw-water)" />
        <path d="M300 262h60M290 276h80M305 292h50M60 300h120M400 310h90" stroke="#fbd6a8" strokeWidth="2" strokeLinecap="round" opacity=".55" />
        <path d="M0 250h260q-10 10-60 12t-200 4Z" fill="#7a4a32" opacity=".55" />
        {/* Palms. */}
        {[[40, 250, 150, -6], [95, 252, 120, 8], [150, 250, 170, -10], [215, 254, 95, 12], [470, 250, 80, -8], [520, 252, 100, 6]].map(([x, y, h, lean], i) => (
          <g key={i} fill="none" stroke="#6b4632" strokeLinecap="round" opacity=".8">
            <path d={`M${x} ${y}q${lean} ${-h * 0.5} ${lean * 2} ${-h}`} strokeWidth="3" />
            {[-70, -35, -5, 30, 60, 95, 130].map((a) => {
              const tx = x + lean * 2, ty = y - h, r = (a * Math.PI) / 180, L = h * 0.32;
              return <path key={a} d={`M${tx} ${ty}q${Math.cos(r) * L * 0.6} ${Math.sin(r) * L * 0.6 - 8} ${Math.cos(r) * L} ${Math.sin(r) * L + 6}`} strokeWidth="2.4" />;
            })}
          </g>
        ))}
        {/* Houseboat. */}
        <g fill="#4e2f22">
          <path d="M120 300q70 14 150 0l18-16q-90 10-190 0Z" />
          <path d="M140 286v-26q55-14 110 0v26Z" opacity=".85" />
          <path d="M136 262q60-22 122 0" fill="none" stroke="#4e2f22" strokeWidth="4" />
        </g>
        <path d="M120 304q70 12 150 0" stroke="#fbd6a8" strokeWidth="1.5" fill="none" opacity=".6" />
      </svg>

      {/* The chicken biriyani on the right. */}
      {/* eslint-disable-next-line @next/next/no-img-element */}
      <img src="/plates/shop/chicken.jpg" alt="" width="928" height="1152" fetchPriority="high" className="pointer-events-none absolute -right-[5vw] top-[12%] hidden h-[66%] w-auto max-w-none [mask-image:radial-gradient(closest-side,#000_62%,transparent)] md:block xl:top-[9%] xl:h-[72%]" />

      {/* The wave along the foot. */}
      <svg aria-hidden viewBox="0 0 1440 120" preserveAspectRatio="none" className="pointer-events-none absolute inset-x-0 bottom-0 h-[11vh] w-full">
        <path className="loader-wave" d="M-120 70C200 30 520 110 840 80s420-70 720-50V120H-120Z" fill="#c94b24" opacity=".9" />
        <path className="loader-wave loader-wave-2" d="M-120 96C260 70 600 120 900 106s380-36 660-28V120H-120Z" fill="#8f321d" />
      </svg>

      <div className="relative mx-auto grid h-full max-w-7xl grid-cols-1 content-center items-center gap-6 px-5 pb-[12vh] md:grid-cols-[1fr_auto_1fr] md:gap-8 md:px-10">
        {/* Left: the name and the headline. */}
        <div className="text-center text-ink md:self-start md:pt-[6vh] md:text-left">
          <div className="flex flex-col items-center whitespace-nowrap md:ml-[8%] md:w-fit">
            <span className="grid h-14 w-14 place-items-center rounded-full bg-crimson font-serif text-2xl text-ivory shadow-[0_12px_24px_-10px_rgb(143_50_29/0.7)] sm:h-16 sm:w-16">RD</span>
            <p className="mt-4 whitespace-nowrap font-serif text-xl tracking-[0.3em] sm:text-2xl">ROYAL DUM HERITAGE</p>
            <span aria-hidden className="mt-2 flex items-center gap-2 text-copper">
              <span className="h-px w-12 bg-copper/50" />◆<span className="h-px w-12 bg-copper/50" />
            </span>
            <p className="mt-2 text-[10px] uppercase tracking-[0.3em] text-muted sm:text-[11px]">Malabar dum biriyani · Kerala</p>
          </div>
          <h2 className="mt-6 hidden font-serif text-[clamp(2.75rem,4.6vw,4.5rem)] font-medium leading-[0.98] md:mt-[6vh] md:block">
            Crafting
            <em className="block text-crimson">Authentic</em>
            <span className="block md:pl-[1.6em]">Flavours…</span>
          </h2>
          <p className="mt-5 hidden max-w-xs font-serif text-lg leading-snug text-ink/70 md:block">Slow-cooked traditions from the Malabar coast, prepared just for you.</p>
        </div>

        {/* Centre: the ring and the steps. */}
        <div className="flex flex-col items-center">
          <div className="relative aspect-square w-[min(68vw,20rem)]">
            <svg viewBox="0 0 200 200" className="absolute inset-0 h-full w-full -rotate-90 overflow-visible">
              <defs>
                <linearGradient id="ld-g" x1="0" y1="0" x2="1" y2="1">
                  <stop offset="0" stopColor="#c94b24" />
                  <stop offset="1" stopColor="#f7a066" />
                </linearGradient>
              </defs>
              <circle cx="100" cy="100" r={R} fill="#fffaf4" fillOpacity=".75" stroke="#38251e" strokeOpacity=".07" strokeWidth="6" />
              <circle cx="100" cy="100" r={R} fill="none" stroke="url(#ld-g)" strokeWidth="6" strokeLinecap="round" strokeDasharray={CIRC} strokeDashoffset={CIRC * (1 - p / 100)} />
              <circle cx={100 + R * Math.cos(ang)} cy={100 + R * Math.sin(ang)} r="5.5" fill="#fff" stroke="#f7a066" strokeWidth="2" className="drop-shadow-[0_0_6px_rgb(237_106_53/0.9)]" />
            </svg>
            <div className="absolute inset-0 flex flex-col items-center justify-center">
              <svg aria-hidden viewBox="0 0 64 64" className="h-14 w-14 text-burnt sm:h-16 sm:w-16" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <path className="shutter-steam" d="M26 20q-4-5 0-10t0-8M34 18q-4-5 0-10t0-8M42 20q-4-5 0-10t0-8" />
                <path d="M14 34h40M18 34c0 12 6 20 18 20s18-8 18-20M24 30q12-6 24 0M34 26v-2" fill="#f7b184" fillOpacity=".35" />
              </svg>
              <span className="mt-1 font-serif text-[clamp(3.5rem,13vw,5.25rem)] font-semibold leading-none text-ink [font-variant-numeric:lining-nums_tabular-nums]">
                {n}
                <span className="text-[0.5em] font-medium">%</span>
              </span>
              <p className="mt-3 text-center text-[10px] uppercase leading-relaxed tracking-[0.32em] text-ink/70 sm:text-[11px]">
                Preparing
                <br />
                your experience…
              </p>
            </div>
          </div>

          {/* Four steps, ticking as the count passes each quarter. */}
          <ol className="mt-8 flex items-start gap-1 sm:gap-3">
            {STEPS.map(([label, d], i) => {
              const done = n >= (i + 1) * 25;
              const now = !done && n >= i * 25;
              return (
                <li key={label} className="flex items-start">
                  {i > 0 && <span aria-hidden className="mt-6 hidden h-px w-4 bg-ink/20 sm:block lg:w-6" />}
                  <div className="flex w-[4.75rem] flex-col items-center text-center sm:w-24">
                    <span className={`grid h-12 w-12 place-items-center rounded-full transition-[background-color,box-shadow] duration-500 ${now ? "bg-peach shadow-[0_0_0_2px_#ed6a35,0_0_18px_rgb(237_106_53/0.45)]" : "bg-peach/70"}`}>
                      <svg viewBox="0 0 24 24" className="h-6 w-6 text-burnt" fill="none" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round">
                        <path d={d} />
                      </svg>
                    </span>
                    <span className="mt-2 font-serif text-[13px] leading-tight text-ink sm:text-[15px]">{label}</span>
                    <span className={`mt-2 grid h-5 w-5 place-items-center rounded-full border transition-colors duration-500 ${done ? "border-crimson bg-crimson text-ivory" : "border-ink/30"}`}>
                      {done && (
                        <svg viewBox="0 0 16 16" className="h-3 w-3" fill="none" stroke="currentColor" strokeWidth="2.4" strokeLinecap="round" strokeLinejoin="round">
                          <path d="m4 8.5 2.5 2.5L12 5.5" />
                        </svg>
                      )}
                    </span>
                  </div>
                </li>
              );
            })}
          </ol>
        </div>

        <div aria-hidden className="hidden md:block" />
      </div>
    </div>
  );
}
