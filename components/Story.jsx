"use client";

import dynamic from "next/dynamic";
import { useEffect, useRef, useState } from "react";
import gsap from "gsap";
import { ScrollTrigger } from "gsap/ScrollTrigger";
import { PLATES, plateSrc, shot } from "./plates";
import { story } from "./state";
import { dish, useShop } from "./cart";

// Lazy: the WebGL bundle (three + R3F) only downloads once the story is near and the device can run it.
const Stage = dynamic(() => import("./Stage"), { ssr: false });

// Chembu to pack, one caption per scene (PLATES 0–2). Describes what is on screen; no claims about the business.
const SCENES = [
  { k: "The dum", title: "Sealed,", em: "over a low flame.", line: () => "Dum: the pot is sealed so the biriyani cooks in its own steam." },
  { k: "The reveal", title: "The lid", em: "comes off.", line: (d) => `${d.full}, straight from the pot.` },
  { k: "Pack & seal", title: "Packed and", em: "sealed.", line: () => "Spooned into the pack, closed, and sealed for the journey." },
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

// Fixed behind the page; the opaque hero and menu cover it, so it only shows through the story.
function Backdrop({ tier, plate, near, onFail }) {
  const { flavor } = useShop();
  return (
    <div className="fixed inset-0 z-0 bg-charcoal" aria-hidden>
      {!near || !tier
        ? null // nothing loads until the story is within a screen of the viewport
        : tier === "static"
        ? // No GPU or reduced motion: the same photographs as static panels, cross-faded. Only the current and next load.
          PLATES.map((p, i) =>
            Math.abs(i - plate) <= 1 ? (
              // eslint-disable-next-line @next/next/no-img-element
              <img
                key={i}
                src={`/plates/${plateSrc(p, flavor)}.jpg`}
                alt=""
                width="1376"
                height="768"
                className={`absolute inset-0 h-full w-full object-cover transition-opacity duration-700 ${i === plate ? "opacity-100" : "opacity-0"}`}
                style={{ objectPosition: `${p.focus * 100}% 50%` }}
              />
            ) : null
          )
        : <Stage tier={tier} onFail={onFail} />}
      <div className="absolute inset-0 bg-[linear-gradient(90deg,rgba(11,13,11,0.85)_0%,rgba(11,13,11,0.35)_38%,transparent_60%)] max-md:bg-[linear-gradient(0deg,rgba(11,13,11,0.95)_0%,rgba(11,13,11,0.55)_40%,transparent_65%)]" />
      <div className="grain pointer-events-none absolute inset-0 opacity-[0.07] mix-blend-overlay" />
    </div>
  );
}

export default function Story() {
  const root = useRef(null);
  const [tier, setTier] = useState(null);
  const [near, setNear] = useState(false);
  const [plate, setPlate] = useState(0);
  const [scene, setScene] = useState(0);
  const { flavor } = useShop();
  const d = dish(flavor);

  useEffect(() => setTier(detectTier()), []);

  // Load the WebGL stage (and its first photos) once the story is within a screen of the viewport.
  useEffect(() => {
    const io = new IntersectionObserver(([e]) => e.isIntersecting && (setNear(true), io.disconnect()), { rootMargin: "100% 0px" });
    io.observe(root.current);
    return () => io.disconnect();
  }, []);

  useEffect(() => {
    gsap.registerPlugin(ScrollTrigger);
    const sync = (t) => {
      story.t = t;
      const s = shot(t);
      setPlate(s.mix < 0.5 ? s.a : s.b);
      setScene(Math.min(SCENES.length - 1, Math.max(0, Math.floor(t + 0.25))));
    };
    const ctx = gsap.context(() => {
      // One trigger for the whole story: one unit of story time per screen of scroll, scrubbed both ways. It also
      // fires on jumps (anchors, Skip to Menu), so the scene is never left stale. The last unit is the menu sliding
      // up over the sealed pack.
      const st = { trigger: root.current, start: "top top", end: "bottom top", onUpdate: (s) => sync(s.progress * (SCENES.length + 1)) };
      ScrollTrigger.create({ ...st, onRefresh: st.onUpdate });
      // The stage renders only while the story is on screen.
      ScrollTrigger.create({ trigger: root.current, start: "top bottom", end: "bottom top", onToggle: (s) => (story.live = s.isActive) });
      // Scroll velocity feeds the floating dust and spices.
      ScrollTrigger.create({
        onUpdate: (s) => {
          story.v = s.getVelocity();
          story.vt = performance.now();
        },
      });
      if (reducedMotion()) return;
      // Headings and cards across the page rise in, a few at a time. Opacity only (never visibility), so they stay
      // focusable, and anything that receives keyboard focus before it has scrolled in is revealed at once.
      const show = (els) => gsap.to(els, { opacity: 1, y: 0, duration: 0.7, ease: "power3.out", stagger: 0.07, overwrite: true });
      gsap.set(".lift", { opacity: 0, y: 24 });
      ScrollTrigger.batch(".lift", { start: "top 90%", once: true, onEnter: show });
      const onFocus = (e) => e.target.closest?.(".lift") && show(e.target.closest(".lift"));
      addEventListener("focusin", onFocus);
      return () => removeEventListener("focusin", onFocus);
    });
    return () => ctx.revert();
  }, []);

  const sc = SCENES[scene];
  return (
    <section id="story" ref={root} aria-label="From chembu to pack" className="relative text-ivory">
      <Backdrop tier={tier} plate={plate} near={near} onFail={() => setTier("static")} />
      {/* Captions, progress and Skip to Menu stay on screen through the three scenes. */}
      <div className="pointer-events-none sticky top-0 z-10 -mb-[100svh] flex h-[100svh] flex-col justify-end px-5 pb-[calc(6rem+env(safe-area-inset-bottom))] sm:px-10 md:justify-center md:pb-0 md:pl-[7vw]">
        <div className="max-w-md" aria-live="polite">
          <p className="flex items-center gap-3 text-[11px] uppercase tracking-[0.35em] text-gold">
            <span className="font-serif text-base tracking-normal">0{scene + 1}</span>
            <span className="h-px w-8 bg-gold/60" />
            {sc.k}
          </p>
          <h2 key={scene} className="settle mt-4 font-serif text-5xl font-medium leading-[0.98] sm:text-6xl">
            <span className="block">{sc.title}</span>
            <em className="block text-saffron">{sc.em}</em>
          </h2>
          <p className="mt-4 text-base leading-relaxed text-ivory/80">{sc.line(d)}</p>
          <ol className="mt-6 flex gap-2" aria-label="Story progress">
            {SCENES.map((s, i) => (
              <li key={s.k} className={`h-1 w-10 rounded-full transition-colors duration-500 ${i <= scene ? "bg-gold" : "bg-ivory/20"}`}>
                <span className="sr-only">{s.k}{i === scene ? " (current)" : ""}</span>
              </li>
            ))}
          </ol>
        </div>
        <a
          href="#menu"
          className="pointer-events-auto absolute right-5 top-20 min-h-11 rounded-full border border-ivory/30 bg-charcoal/50 px-5 py-3 text-sm font-medium backdrop-blur transition hover:border-gold hover:text-gold sm:right-10 md:bottom-10 md:top-auto"
        >
          Skip to Menu ↓
        </a>
      </div>
      {/* Scroll length: a screen per scene, plus one for the menu rising over the last. */}
      <div className="h-[400svh]" />
    </section>
  );
}
