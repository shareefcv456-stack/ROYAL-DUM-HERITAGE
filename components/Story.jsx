"use client";

import dynamic from "next/dynamic";
import { useEffect, useRef, useState } from "react";
import gsap from "gsap";
import { ScrollTrigger } from "gsap/ScrollTrigger";
import { CLIMAX, COSMOS, FINALE, FIRST_CHAPTER, PLATES, SECTIONS, shot } from "./plates";
import { story } from "./state";
import SpiceVault from "./SpiceVault";
import Menu from "./Menu";

// Lazy: the WebGL bundle (three + R3F) only downloads once we know the device can run it.
const Stage = dynamic(() => import("./Stage"), { ssr: false });

export const ORDER_URL = "#menu"; // TODO: the brand's ordering / WhatsApp link

// Documentary lower-thirds over the ten opening shots (PLATES 0–9).
const OPENING_SHOTS = [
  { time: "05:12", place: "Kozhikode", line: "The teak doors open on mist and red Malabar soil." },
  { time: "05:40", place: "First fire", line: "Firewood catches beneath the copper handis." },
  { time: "05:58", place: "The mortar", line: "Cardamom, star anise and clove, crushed in granite." },
  { time: "06:10", place: "Saffron", line: "Crimson threads bleed gold into warm milk." },
  { time: "06:25", place: "The block", line: "Clean cuts on tamarind wood, made that morning." },
  { time: "06:40", place: "The lineup", line: "Beef ribs, mutton, and the star of the house: masala chicken." },
  { time: "07:05", place: "Kaima rice", line: "Short-grain Malabar Kaima, poured like rain." },
  { time: "07:20", place: "Pure ghee", line: "Amber ghee on hot metal. The kitchen starts to smell of home." },
  { time: "07:34", place: "Ulli & cashew", line: "Shallots fried slow until golden, cashews until they snap." },
  { time: "07:50", place: "The dum", line: "Dough seals the copper rim. Then, steam." },
];

// Captions for the assembly sequence, keyed to the same timeline as Stage.jsx (section progress 0–1).
const ASSEMBLY = [
  { at: 0, step: "Malabar chicken dum biriyani", title: "One handi.", em: "Four layers.", line: "Scroll to bring them in." },
  { at: 0.12, step: "From the margins", title: "Every layer,", em: "in motion.", line: "Garnish on top, ghee, saffron and whole spices, Kaima rice, then beef and mutton over a marinated chicken base." },
  { at: 0.42, step: "Reassembly", title: "Back into", em: "the handi.", line: "Chicken first, then rice, ghee and saffron, then the garnish." },
  { at: 0.66, step: "The dum", title: "Sealed", em: "with dough.", line: "Nothing escapes until it is ready." },
];

// Captions for the climax, keyed to section progress (see CL in Stage.jsx).
const CLIMAX_CAPTIONS = [
  { at: 0, kicker: "The Biriyani Cosmos", title: "Every element,", em: "in orbit." },
  { at: 0.32, kicker: "The Biriyani Cosmos", title: "All of it,", em: "into one uruli." },
];

// Must match LAYERS in Stage.jsx (kept here so the page doesn't import the WebGL bundle).
const LAYER_LABELS = [
  { name: "Fried shallots & cashews", band: 0.62 },
  { name: "Ghee, saffron & spices", band: 0.24 },
  { name: "Kaima rice", band: -0.12 },
  { name: "Beef, mutton & chicken", band: -0.5 },
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
            (p.name || p.still) && Math.abs(i - plate) <= 1 ? (
              // eslint-disable-next-line @next/next/no-img-element
              <img
                key={i}
                src={`/plates/${p.name || p.still}.jpg`}
                alt={i === plate ? p.alt : ""}
                className={`absolute inset-0 h-full w-full transition-opacity duration-1000 ${p.name ? "object-cover" : "object-contain p-[18vh]"} ${i === plate ? "opacity-100" : "opacity-0"}`}
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
  const [step, setStep] = useState(0);
  const [climaxStep, setClimaxStep] = useState(0);
  const [labelsOn, setLabelsOn] = useState(false);

  useEffect(() => setTier(detectTier()), []);

  useEffect(() => {
    gsap.registerPlugin(ScrollTrigger);
    const sync = (t) => {
      story.t = t;
      setActive(Math.floor(t) - FIRST_CHAPTER);
      setRailOn(t >= FIRST_CHAPTER - 0.3 && t < SECTIONS + 0.5);
      const s = shot(t);
      setPlate(s.mix < 0.5 ? s.a : s.b);
      const p = t - COSMOS;
      setStep(p > 0.74 ? -1 : ASSEMBLY.reduce((k, a, i) => (p >= a.at ? i : k), 0)); // caption clears before the reveal
      setLabelsOn(p > 0.2 && p < 0.44);
      const cp = t - CLIMAX;
      setClimaxStep(cp > 0.5 ? CLIMAX_CAPTIONS.length : CLIMAX_CAPTIONS.reduce((k, a, i) => (cp >= a.at ? i : k), 0));
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
        const tl = gsap.timeline({ scrollTrigger: { trigger: section, start: i === 0 ? "top top" : "top 70%", end: "bottom 30%", scrub: true } });
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
          <section key={o.time} data-t={i} id={i ? undefined : "opening"} className="chapter relative h-[115svh]">
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

        <section data-t={COSMOS} id="cosmos" className="relative h-[420svh]">
          {/* Burger-reel layer labels, aligned with the exploded bands drawn in Stage.jsx (LAYERS[].band). */}
          <div aria-hidden={!labelsOn} className={`pointer-events-none sticky top-0 -mb-[100svh] h-[100svh] transition-opacity duration-500 ${labelsOn ? "opacity-100" : "opacity-0"}`}>
            {LAYER_LABELS.map((l, i) => (
              <div
                key={l.name}
                className={`absolute left-4 flex items-center gap-3 transition-all duration-500 [--lift:6.5svh] sm:left-[6vw] md:[--lift:0px] ${labelsOn ? "translate-x-0" : "-translate-x-6"}`}
                style={{ top: `calc(${50 - l.band * 45}% - var(--lift))`, transitionDelay: `${i * 80}ms` }}
              >
                <span className="font-serif text-xs tabular-nums text-gold/80">0{i + 1}</span>
                <span className="h-px w-6 bg-gold/50 sm:w-10" />
                <span className="text-[10px] uppercase tracking-[0.25em] text-ivory/85 sm:text-[11px]">{l.name}</span>
              </div>
            ))}
          </div>
          <div className="pointer-events-none sticky top-0 flex h-[100svh] flex-col items-center justify-end px-5 pb-[7svh] text-center">
            <p className={`text-[11px] uppercase tracking-[0.35em] text-gold transition-opacity duration-700 ${step < 0 ? "opacity-0" : ""}`}>{ASSEMBLY[Math.max(step, 0)].step}</p>
            <div className="relative mt-3 h-24 w-full max-w-xl sm:h-28">
              {ASSEMBLY.map((a, i) => (
                <div key={a.title} className={`absolute inset-0 transition-all duration-700 ${i === step ? "translate-y-0 opacity-100" : i < step || step < 0 ? "-translate-y-4 opacity-0" : "translate-y-4 opacity-0"}`}>
                  <h2 className="font-serif text-3xl font-medium leading-tight text-ivory sm:text-5xl">
                    {a.title} <em className="text-saffron">{a.em}</em>
                  </h2>
                  <p className="mt-2 text-sm text-stone-400">{a.line}</p>
                </div>
              ))}
            </div>
          </div>
        </section>

        {[HERO, ...CHAPTERS].map((c, i) => (
          <section key={c.label || "hero"} data-t={COSMOS + 1 + i} id={i ? `chapter-${i}` : "hero"} className="chapter relative h-[170svh]">
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

      <div data-t={SECTIONS + 1} className="relative z-10">
        <SpiceVault />
      </div>

      {/* The Biriyani Cosmos climax: drawn by the WebGL stage; this section only paces it and carries the captions. */}
      <section data-t={CLIMAX} id="cosmos-climax" className="relative z-10 h-[420svh]">
        <div className="pointer-events-none sticky top-0 flex h-[100svh] flex-col items-center justify-end px-5 pb-[7svh] text-center">
          <div className="relative h-28 w-full max-w-xl sm:h-32">
            {CLIMAX_CAPTIONS.map((a, i) => (
              <div key={a.title} className={`absolute inset-0 transition-all duration-700 ${i === climaxStep ? "translate-y-0 opacity-100" : i < climaxStep ? "-translate-y-4 opacity-0" : "translate-y-4 opacity-0"}`}>
                <p className="text-[11px] uppercase tracking-[0.35em] text-gold">{a.kicker}</p>
                <h2 className="mt-3 font-serif text-3xl font-medium leading-tight text-ivory sm:text-5xl">
                  {a.title} <em className="text-saffron">{a.em}</em>
                </h2>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* The grand finale: the steaming handi and the plated biriyani (a WebGL plate), with the title scrubbed in over it. */}
      <section data-t={FINALE} id="finale" className="chapter relative z-10 h-[300svh]">
        <div className="sticky top-0 flex h-[100svh] flex-col items-center px-5 pt-[13svh] text-center">
          <div aria-hidden className="reveal pointer-events-none absolute inset-x-0 top-0 -z-10 h-[62svh] bg-[linear-gradient(180deg,rgba(10,10,10,0.85)_0%,rgba(10,10,10,0.45)_55%,transparent)]" />
          <div aria-hidden className="reveal pointer-events-none absolute inset-x-0 top-[50svh] -z-10 h-[45svh] bg-[radial-gradient(ellipse_40%_50%_at_50%_50%,rgba(10,10,10,0.85),transparent)]" />
          <p className="reveal text-[11px] uppercase tracking-[0.4em] text-gold/90">Royal Dum Heritage · Kozhikode</p>
          <p className="reveal mt-6 font-serif text-2xl italic text-ivory/90 sm:text-4xl">Savor the Authentic Taste of</p>
          <h2 className="reveal mt-2 font-serif font-medium uppercase leading-[0.9] tracking-[0.04em] drop-shadow-[0_0_28px_rgba(212,175,55,0.35)]">
            <span className="flex items-center justify-center gap-4 text-[13vw] sm:text-7xl lg:text-8xl">
              <span className="hidden h-px w-24 bg-gradient-to-r from-transparent to-gold sm:block" />
              <span className="bg-[linear-gradient(180deg,#f8e9b8_0%,#d4af37_48%,#9a6424_100%)] bg-clip-text text-transparent">Royal</span>
              <span className="hidden h-px w-24 bg-gradient-to-l from-transparent to-gold sm:block" />
            </span>
            <span className="block bg-[linear-gradient(180deg,#f8e9b8_0%,#d4af37_48%,#9a6424_100%)] bg-clip-text text-[15vw] text-transparent sm:text-8xl lg:text-[9rem]">Biriyani</span>
          </h2>
          <p className="reveal mt-4 flex items-center gap-3 text-gold/80" aria-hidden>
            <span className="h-px w-16 bg-gold/50" />✦<span className="h-px w-16 bg-gold/50" />
          </p>
          <p className="reveal mt-4 max-w-md text-sm text-stone-300 sm:text-base">Served on banana leaf with raita and coconut chammanthi, the seal still warm. Malabar dum biriyani, the way Kozhikode has always made it.</p>
          <div className="reveal pointer-events-auto mt-8 flex flex-wrap justify-center gap-3">
            <a href={ORDER_URL} className="rounded-full bg-gold px-8 py-3.5 text-sm font-semibold tracking-wide text-charcoal transition hover:bg-gold-soft">
              Order your handi
            </a>
            <a href="#delivery" className="rounded-full border border-gold/60 bg-charcoal/70 px-8 py-3.5 backdrop-blur-sm text-sm font-semibold tracking-wide text-gold transition hover:bg-gold/10">
              Delivery areas
            </a>
          </div>
        </div>
      </section>

      {/* Behind the Menu the live layer runs in ambient mode: no photo, just steam, embers and spices. */}
      <div data-t={FINALE + 1} className="relative z-10">
        <Menu orderUrl={ORDER_URL} />
      </div>
    </div>
  );
}
