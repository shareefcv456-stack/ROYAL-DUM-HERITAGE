"use client";

import dynamic from "next/dynamic";
import { useEffect, useRef, useState } from "react";
import gsap from "gsap";
import { ScrollTrigger } from "gsap/ScrollTrigger";
import { FIRST_CHAPTER, OPENING, PLATES, SECTIONS, shot } from "./plates";
import { story } from "./state";
import SpiceVault from "./SpiceVault";
import Menu from "./Menu";

// Lazy: the WebGL bundle (three + R3F) only downloads once we know the device can run it.
const Stage = dynamic(() => import("./Stage"), { ssr: false });

export const ORDER_URL = "#menu"; // TODO: the brand's ordering / WhatsApp link

// Documentary lower-thirds over the opening kitchen shots.
const OPENING_SHOTS = [
  { time: "05:40", place: "Kozhikode", line: "The stoves are lit before the city wakes." },
  { time: "06:15", place: "The wash", line: "Kaima rice, rinsed three times by hand until the water runs clear." },
  { time: "06:50", place: "The long table", line: "Shallots, garlic, mint and coriander. Many hands, one table." },
];

const HERO = {
  kicker: "Kerala · Malabar · Dum",
  title: ["Royal Dum", "Heritage"],
  body: "A Malabar dum biriyani, filmed from the butcher's block to your door. Scroll slowly; the embers are already lit.",
};

const CHAPTERS = [
  {
    n: "01", label: "The Butcher's Block",
    title: ["Before the fire,", "the raw truth."],
    body: "Bone-in mutton and chicken, cut that morning. Green cardamom, cloves, cassia bark, star anise and a few threads of saffron.",
  },
  {
    n: "02", label: "The Kitchen & Firewood",
    title: ["Layered by hand,", "over open embers."],
    body: "Masala and marinated meat first, then fragrant Kaima rice, then a slow stream of golden ghee, all in a heavy copper handi over firewood.",
  },
  {
    n: "03", label: "The Dum Seal",
    title: ["Sealed in dough.", "Then, patience."],
    body: "A ring of wheat dough locks the lid, and the pot cooks in its own steam. Keep scrolling: when the seal gives, the aroma escapes first.",
  },
  {
    n: "04", label: "The Grand Feast",
    title: ["The lid lifts.", "The room goes quiet."],
    body: "Separate, glistening grains, tender meat, golden fried onions, cashews, raisins and a boiled egg, served on a fresh banana leaf.",
  },
  {
    n: "05", label: "Packaging & Supply",
    title: ["Sealed again,", "for the journey."],
    body: "Packed hot into plant-fibre boxes and stamped with our gold seal, so it reaches your table the way it left our kitchen.",
  },
];

const reducedMotion = () => typeof window !== "undefined" && matchMedia("(prefers-reduced-motion: reduce)").matches;

// "static": no WebGL, a software rasteriser, or reduced motion → plain photographs. "low": phones and weak GPUs.
function detectTier() {
  if (reducedMotion()) return "static";
  try {
    const gl = document.createElement("canvas").getContext("webgl2") || document.createElement("canvas").getContext("webgl");
    if (!gl) return "static";
    const info = gl.getExtension("WEBGL_debug_renderer_info");
    const renderer = String(gl.getParameter(info ? info.UNMASKED_RENDERER_WEBGL : gl.RENDERER));
    gl.getExtension("WEBGL_lose_context")?.loseContext();
    if (/swiftshader|llvmpipe|softpipe|software|basic render/i.test(renderer)) return "static";
    const weak = (navigator.hardwareConcurrency || 4) <= 4 || (navigator.deviceMemory || 8) <= 4 || matchMedia("(pointer: coarse)").matches;
    return weak ? "low" : "high";
  } catch {
    return "static";
  }
}

function Backdrop({ tier, plate, onFail }) {
  return (
    <div className="fixed inset-0 z-0 bg-charcoal">
      {tier === "static"
        ? // Without a GPU: the same photographs, cross-faded by CSS. Only the current and next plates load.
          PLATES.map((p, i) =>
            p.name && Math.abs(i - plate) <= 1 ? (
              // eslint-disable-next-line @next/next/no-img-element
              <img
                key={p.name}
                src={`/plates/${p.name}.jpg`}
                alt={i === plate ? p.alt : ""}
                className={`absolute inset-0 h-full w-full object-cover transition-opacity duration-1000 ${i === plate ? "opacity-100" : "opacity-0"}`}
                style={{ objectPosition: `${p.focus * 100}% 50%` }}
              />
            ) : null
          )
        : tier && (
            <div role="img" aria-label={PLATES[plate].alt || undefined} aria-hidden={!PLATES[plate].alt} className="absolute inset-0">
              <Stage tier={tier} onFail={onFail} />
            </div>
          )}
      <div className="absolute inset-0 bg-[linear-gradient(90deg,rgba(10,10,10,0.8)_0%,rgba(10,10,10,0.3)_36%,transparent_58%)] max-md:bg-[linear-gradient(0deg,rgba(10,10,10,0.95)_0%,rgba(10,10,10,0.55)_38%,transparent_62%)]" />
      <div className="grain pointer-events-none absolute inset-0 opacity-[0.08] mix-blend-overlay" />
    </div>
  );
}

function Rail({ active, visible, fills }) {
  const go = (i) => document.getElementById(`chapter-${i + 1}`)?.scrollIntoView({ behavior: "smooth" });
  return (
    <nav aria-label="Chapters" className={`fixed right-3 top-1/2 z-30 -translate-y-1/2 transition-opacity duration-700 md:right-8 ${visible ? "opacity-100" : "pointer-events-none opacity-0"}`}>
      <ol className="flex flex-col gap-5 md:gap-6">
        {CHAPTERS.map((c, i) => (
          <li key={c.n}>
            <button onClick={() => go(i)} className="group flex items-center justify-end gap-3 text-right" aria-current={i === active ? "step" : undefined}>
              <span className={`hidden text-[11px] uppercase tracking-[0.25em] transition duration-500 lg:block ${i === active ? "text-gold-soft opacity-100" : "text-stone-500 opacity-0 group-hover:opacity-100"}`}>
                {c.label}
              </span>
              <span className={`font-serif text-sm tabular-nums transition duration-500 ${i === active ? "text-gold" : "text-stone-500"}`}>{c.n}</span>
              <span className="relative h-9 w-px overflow-hidden bg-white/15">
                <span ref={(el) => (fills.current[i] = el)} className="absolute inset-0 origin-top scale-y-0 bg-gold" />
              </span>
            </button>
          </li>
        ))}
      </ol>
    </nav>
  );
}

function Copy({ c, big }) {
  return (
    <div className="max-w-[34rem] pr-12 md:pr-0">
      <p className="reveal mb-5 flex items-center gap-4 text-[11px] uppercase tracking-[0.35em] text-gold">
        {c.n && <span className="font-serif text-base tracking-normal">{c.n}</span>}
        {c.n && <span className="h-px w-10 bg-gold/60" />}
        {c.label || c.kicker}
      </p>
      {big ? (
        <h1 className="reveal font-serif text-7xl font-medium leading-[0.92] text-ivory sm:text-8xl lg:text-[8.5rem]">
          {c.title[0]}
          <br />
          <em className="text-saffron">{c.title[1]}</em>
        </h1>
      ) : (
        <h2 className="reveal font-serif text-5xl font-medium leading-[0.98] text-ivory sm:text-6xl lg:text-7xl">
          {c.title[0]}
          <br />
          <em className="text-saffron">{c.title[1]}</em>
        </h2>
      )}
      <p className="reveal mt-6 max-w-md text-base leading-relaxed text-stone-300 sm:text-lg">{c.body}</p>
    </div>
  );
}

export default function Story() {
  const root = useRef(null);
  const fills = useRef([]);
  const [tier, setTier] = useState(null);
  const [active, setActive] = useState(-1);
  const [railOn, setRailOn] = useState(false);
  const [plate, setPlate] = useState(0);

  useEffect(() => setTier(detectTier()), []);

  useEffect(() => {
    gsap.registerPlugin(ScrollTrigger);
    const sync = (t) => {
      story.t = t;
      setActive(Math.floor(t) - FIRST_CHAPTER);
      setRailOn(t >= FIRST_CHAPTER - 0.3 && t < SECTIONS + 0.5);
      const s = shot(t);
      setPlate(s.mix < 0.5 ? s.a : s.b);
      fills.current.forEach((el, i) => el && (el.style.transform = `scaleY(${Math.min(Math.max(t - FIRST_CHAPTER - i, 0), 1)})`));
    };

    const ctx = gsap.context(() => {
      // Every [data-t] block owns one unit of story time while it scrolls past, so blocks can differ in height.
      const blocks = gsap.utils.toArray("[data-t]");
      blocks.forEach((el, i) => {
        const base = Number(el.dataset.t);
        ScrollTrigger.create({
          trigger: el,
          start: "top top",
          end: i === blocks.length - 1 ? "bottom bottom" : "bottom top",
          onUpdate: (s) => s.isActive && sync(base + s.progress),
          onRefresh: (s) => s.isActive && sync(base + s.progress),
        });
      });
      // Scroll velocity feeds the floating dust and spices.
      ScrollTrigger.create({
        onUpdate: (s) => {
          story.v = s.getVelocity();
          story.vt = performance.now();
        },
      });

      if (reducedMotion()) return;
      gsap.utils.toArray(".chapter").forEach((section, i) => {
        const lines = section.querySelectorAll(".reveal");
        const tl = gsap.timeline({ scrollTrigger: { trigger: section, start: i === 0 ? "top top" : "top 70%", end: "bottom 30%", scrub: 1 } });
        if (i > 0) tl.from(lines, { autoAlpha: 0, y: 48, stagger: 0.12, duration: 1, ease: "power2.out" });
        tl.to({}, { duration: 1.6 }).to(lines, { autoAlpha: 0, y: -36, stagger: 0.06, duration: 1, ease: "power2.in" });
      });
      gsap.utils.toArray(".lift").forEach((el) =>
        gsap.from(el, { autoAlpha: 0, y: 40, duration: 1.1, ease: "power3.out", scrollTrigger: { trigger: el, start: "top 85%", once: true } })
      );
    }, root);
    return () => ctx.revert();
  }, []);

  return (
    <div ref={root}>
      <Backdrop tier={tier} plate={plate} onFail={() => setTier("static")} />
      <Rail active={active} visible={railOn} fills={fills} />

      <div id="story" className="relative z-10">
        {OPENING_SHOTS.map((o, i) => (
          <section key={o.time} data-t={i} id={i ? undefined : "opening"} className="chapter relative h-[130svh]">
            <div className="pointer-events-none sticky top-0 flex h-[100svh] items-end px-5 pb-[10svh] sm:px-10 md:pl-[7vw]">
              <div className="max-w-md">
                <p className="reveal flex items-center gap-3 font-mono text-[11px] uppercase tracking-[0.3em] text-gold/90">
                  <span className="inline-block h-2 w-2 animate-pulse rounded-full bg-red-500/80" />
                  {o.time} · {o.place}
                </p>
                <p className="reveal mt-3 font-serif text-2xl italic leading-snug text-ivory/90 sm:text-3xl">{o.line}</p>
                {i === 0 && <p className="reveal mt-8 text-[11px] uppercase tracking-[0.3em] text-stone-400">Scroll to enter the kitchen</p>}
              </div>
            </div>
          </section>
        ))}

        {[HERO, ...CHAPTERS].map((c, i) => (
          <section key={c.label || "hero"} data-t={OPENING + i} id={i ? `chapter-${i}` : "hero"} className="chapter relative h-[170svh]">
            <div className="pointer-events-none sticky top-0 flex h-[100svh] items-end px-5 pb-[12svh] sm:px-10 md:items-center md:pb-0 md:pl-[7vw]">
              <Copy c={c} big={i === 0} />
            </div>
          </section>
        ))}
      </div>

      <section data-t={SECTIONS} id="delivery" className="relative isolate z-10 flex min-h-[100svh] items-center px-5 py-24 sm:px-10 md:pl-[7vw]">
        {/* Wash behind the copy, feathered at the top so the plate shows through as the section scrolls in. */}
        <div aria-hidden className="absolute inset-0 -z-10 bg-[linear-gradient(90deg,rgba(10,10,10,0.9)_0%,rgba(10,10,10,0.65)_42%,transparent_70%)] [mask-image:linear-gradient(180deg,transparent,#000_45%)] max-md:bg-[linear-gradient(0deg,rgba(10,10,10,0.95)_0%,rgba(10,10,10,0.6)_55%,transparent_85%)]" />
        <div className="max-w-xl">
          <p className="lift text-[11px] uppercase tracking-[0.35em] text-gold">Doorstep delivery</p>
          <h2 className="lift mt-5 font-serif text-5xl font-medium leading-[0.98] text-ivory sm:text-7xl">
            Still steaming
            <br />
            <em className="text-saffron">when it arrives.</em>
          </h2>
          <p className="lift mt-6 max-w-md text-stone-300">Every handi is sealed to order and delivered within the hour, still under its seal.</p>
          <div className="lift mt-10 flex flex-wrap gap-4">
            <a href="#menu" className="rounded-full bg-gold px-8 py-3.5 text-sm font-semibold tracking-wide text-charcoal transition hover:bg-gold-soft">
              Choose your handi
            </a>
            <a href="#spice-vault" className="rounded-full border border-gold/40 px-8 py-3.5 text-sm tracking-wide text-gold-soft transition hover:border-gold hover:text-gold">
              Open the Spice Vault
            </a>
          </div>
        </div>
      </section>

      {/* The live layer keeps running behind these in ambient mode: no photo, just steam, embers and spices. */}
      <div data-t={SECTIONS + 1} className="relative z-10">
        <SpiceVault />
        <Menu orderUrl={ORDER_URL} />
      </div>
    </div>
  );
}
