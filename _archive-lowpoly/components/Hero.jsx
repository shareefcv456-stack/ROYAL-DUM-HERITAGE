"use client";

import dynamic from "next/dynamic";
import { useEffect, useRef, useState } from "react";

const PotScene = dynamic(() => import("./PotScene"), { ssr: false });

// "static" = no WebGL, software rasteriser, or reduced motion. "low" = weak/mobile hardware.
function detectTier() {
  if (matchMedia("(prefers-reduced-motion: reduce)").matches) return "static";
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

const CHAPTERS = [
  { kicker: "Est. in the kitchens of the Nizam", title: "Royal Dum Heritage", body: "Biriyani sealed in copper and slow-cooked on dum, the way it was made for kings.", hero: true },
  { kicker: "Chapter I — The Seal", title: "Breaking the dum", body: "A ring of atta dough locks in the steam. Opening it releases saffron, kewra and ghee." },
  { kicker: "Chapter II — The Layers", title: "Built in strata", body: "Saffron-streaked basmati on top, plain rice in the middle, 24-hour marinated meat in masala at the base." },
  { kicker: "Chapter III — The Table", title: "Served from the handi", body: "Every order is sealed and cooked as its own pot, so the layers reach your table intact.", cta: true },
];

function StaticPot() {
  return (
    <svg viewBox="0 0 200 180" className="h-[46vh] max-h-[420px] w-auto drop-shadow-[0_30px_60px_rgba(212,175,55,0.25)]" aria-hidden>
      <defs>
        <radialGradient id="cu" cx="35%" cy="35%" r="80%">
          <stop offset="0" stopColor="#f2b27a" />
          <stop offset=".45" stopColor="#b87333" />
          <stop offset="1" stopColor="#4a2410" />
        </radialGradient>
      </defs>
      <ellipse cx="100" cy="58" rx="62" ry="10" fill="#d8c39a" />
      <path d="M38 58c0-26 124-26 124 0z" fill="url(#cu)" />
      <circle cx="100" cy="30" r="6" fill="#d4af37" />
      <path d="M44 66c-30 20-30 80 20 100h72c50-20 50-80 20-100z" fill="url(#cu)" />
      <path d="M30 112h140M27 128h146" stroke="#d4af37" strokeWidth="2" opacity=".8" />
    </svg>
  );
}

export default function Hero() {
  const wrap = useRef(null);
  const progress = useRef(0);
  const active = useRef(true);
  const [tier, setTier] = useState(null);

  useEffect(() => {
    setTier(detectTier());

    const onScroll = () => {
      const r = wrap.current.getBoundingClientRect();
      progress.current = Math.min(Math.max(-r.top / (r.height - innerHeight), 0), 1);
    };
    onScroll();
    addEventListener("scroll", onScroll, { passive: true });
    addEventListener("resize", onScroll);

    const io = new IntersectionObserver(([e]) => (active.current = e.isIntersecting));
    io.observe(wrap.current);

    return () => {
      removeEventListener("scroll", onScroll);
      removeEventListener("resize", onScroll);
      io.disconnect();
    };
  }, []);

  return (
    <section ref={wrap} id="top" className="relative h-[400svh]">
      <div className="sticky top-0 h-[100svh] overflow-hidden">
        <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_50%_55%,rgba(212,175,55,0.16),transparent_60%)]" />
        <div className="absolute inset-0 flex items-center justify-center">
          {tier === "static" ? (
            <StaticPot />
          ) : (
            tier && <PotScene progress={progress} active={active} tier={tier} onFail={() => setTier("static")} />
          )}
        </div>
        <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(ellipse_at_center,transparent_45%,#121212_100%)]" />
      </div>

      <div className="absolute inset-0">
        {CHAPTERS.map((c, i) => (
          <div key={c.title} className={`flex h-[100svh] px-4 pb-10 sm:px-8 md:items-center md:pb-0 ${c.hero ? "items-end md:items-center" : "items-end"} ${i % 2 ? "md:justify-end" : ""}`}>
            <div className={`max-w-md md:mx-[6vw] ${c.hero ? "" : "glass rounded-2xl p-6 md:p-8"}`}>
              <p className="mb-3 text-xs uppercase tracking-[0.3em] text-gold">{c.kicker}</p>
              {c.hero ? (
                <h1 className="gold-text font-serif text-6xl font-semibold leading-[0.95] sm:text-7xl lg:text-8xl">{c.title}</h1>
              ) : (
                <h2 className="font-serif text-4xl font-semibold text-gold-soft sm:text-5xl">{c.title}</h2>
              )}
              <p className="mt-4 text-base leading-relaxed text-stone-300 sm:text-lg">{c.body}</p>
              {c.hero && <p className="mt-10 text-xs uppercase tracking-[0.3em] text-stone-500">Scroll to unseal ↓</p>}
              {c.cta && (
                <a href="#menu" className="mt-6 inline-block rounded-full bg-gold px-6 py-3 text-sm font-semibold text-charcoal transition hover:bg-gold-soft">
                  Explore the menu
                </a>
              )}
            </div>
          </div>
        ))}
      </div>
    </section>
  );
}
