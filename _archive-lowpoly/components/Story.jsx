"use client";

import gsap from "gsap";
import { ScrollTrigger } from "gsap/ScrollTrigger";
import Lenis from "lenis";
import dynamic from "next/dynamic";
import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import FrameSequence from "./story/FrameSequence";
import { frameUrl } from "./story/frames.mjs";
import { detectTier } from "./story/gpu";
import { CHAPTERS, buildTimeline, createStory } from "./story/timeline";

const Scene = dynamic(() => import("./story/Scene"), { ssr: false });

export default function Story() {
  const section = useRef(null);
  const captions = useRef([]);
  const fill = useRef(null);
  const lenis = useRef(null);
  const story = useMemo(createStory, []);
  const [tier, setTier] = useState(null);
  const [ready, setReady] = useState(false);
  const [active, setActive] = useState(-1);

  useEffect(() => setTier(detectTier()), []);

  useEffect(() => {
    gsap.registerPlugin(ScrollTrigger);
    ScrollTrigger.config({ ignoreMobileResize: true });
    const reduced = matchMedia("(prefers-reduced-motion: reduce)").matches;

    // Wheel/trackpad get inertial smoothing; touch keeps the device's own native momentum.
    let tick;
    if (!reduced) {
      lenis.current = new Lenis({ lerp: 0.09, wheelMultiplier: 0.85, anchors: true });
      lenis.current.on("scroll", ScrollTrigger.update);
      tick = (time) => lenis.current.raf(time * 1000);
      gsap.ticker.add(tick);
      gsap.ticker.lagSmoothing(0);
    }

    const tl = buildTimeline(story, captions.current);
    const st = ScrollTrigger.create({
      trigger: section.current,
      start: "top top",
      end: "bottom bottom",
      animation: tl,
      scrub: reduced ? true : 0.7,
      onUpdate(self) {
        story.velocity = gsap.utils.clamp(-1, 1, self.getVelocity() / 2500);
        fill.current.style.transform = `scaleY(${self.progress})`;
        setActive(self.progress < 0.04 ? -1 : Math.min(3, Math.floor(self.progress * 4)));
      },
    });

    const onPointer = (e) => {
      story.pointer.x = (e.clientX / innerWidth) * 2 - 1;
      story.pointer.y = -(e.clientY / innerHeight) * 2 + 1;
    };
    addEventListener("pointermove", onPointer, { passive: true });
    const io = new IntersectionObserver(([e]) => (story.onScreen = e.isIntersecting));
    io.observe(section.current);

    return () => {
      st.kill();
      tl.kill();
      io.disconnect();
      removeEventListener("pointermove", onPointer);
      if (tick) gsap.ticker.remove(tick);
      lenis.current?.destroy();
    };
  }, [story]);

  const goTo = (i) => {
    const el = section.current;
    const y = el.offsetTop + ((i + 0.55) / 4) * (el.offsetHeight - innerHeight);
    lenis.current ? lenis.current.scrollTo(y, { duration: 1.6 }) : scrollTo({ top: y });
  };

  const onReady = useCallback(() => setReady(true), []);
  const onFail = useCallback(() => setTier("frames"), []);

  return (
    <section ref={section} id="top" className="relative h-[700svh]">
      <div className="sticky top-0 h-[100svh] overflow-hidden bg-charcoal">
        {/* First frame shows instantly while the 3D scene boots behind it. */}
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img src={frameUrl(0)} alt="" fetchPriority="high" className={`absolute inset-0 h-full w-full object-cover transition-opacity duration-1000 ${ready ? "opacity-0" : "opacity-100"}`} />
        <div className={`absolute inset-0 transition-opacity duration-1000 ${ready ? "opacity-100" : "opacity-0"}`}>
          {tier === "frames" && <FrameSequence story={story} onReady={onReady} />}
          {(tier === "high" || tier === "low") && <Scene story={story} tier={tier} onReady={onReady} onFail={onFail} />}
        </div>

        {/* Film treatment: vignette, bottom fade for captions, grain */}
        <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(ellipse_at_center,transparent_50%,rgba(10,10,10,0.85)_100%)]" />
        <div className="pointer-events-none absolute inset-x-0 bottom-0 h-3/5 bg-gradient-to-t from-charcoal via-charcoal/75 to-transparent md:hidden" />
        <div className="pointer-events-none absolute inset-y-0 left-0 hidden w-1/2 bg-gradient-to-r from-charcoal/80 to-transparent md:block" />
        <div className="grain pointer-events-none absolute inset-0 opacity-[0.07] mix-blend-overlay" />

        {/* Title card */}
        <div ref={(el) => (captions.current[0] = el)} className="pointer-events-none absolute inset-0 flex items-end px-5 pb-[12svh] sm:px-10 md:items-center md:pb-0 md:pl-[6vw]">
          <div className="max-w-xl">
          <p className="mb-4 text-[11px] uppercase tracking-[0.45em] text-saffron">A film in four courses</p>
          <h1 className="gold-text font-serif text-6xl font-semibold leading-[0.92] sm:text-7xl lg:text-[7.5rem]">Royal Dum Heritage</h1>
          <p className="mt-6 max-w-sm text-stone-300">From the butcher&apos;s block to the sealed handi. Scroll to begin.</p>
          <div className="mt-10 h-12 w-px animate-pulse bg-gradient-to-b from-gold to-transparent" />
          </div>
        </div>

        {/* Chapter cards */}
        {CHAPTERS.map((c, i) => (
          <div
            key={c.n}
            ref={(el) => (captions.current[i + 1] = el)}
            className="invisible pointer-events-none absolute inset-0 flex items-end px-5 pb-[8svh] sm:px-10 md:items-center md:pb-0 md:pl-[6vw]"
          >
            <div className="pointer-events-auto max-w-md pr-16 md:pr-0">
            <p className="text-[11px] uppercase tracking-[0.4em] text-saffron">{c.kicker}</p>
            <h2 className="mt-4 font-serif text-4xl font-semibold leading-tight text-gold-soft sm:text-5xl lg:text-6xl">{c.title}</h2>
            <p className="mt-5 max-w-sm leading-relaxed text-stone-300">{c.body}</p>
            {c.cta && (
              <a href="#menu" className="mt-8 inline-block rounded-full bg-gold px-7 py-3 text-sm font-semibold text-charcoal transition hover:bg-gold-soft">
                Order the feast
              </a>
            )}
            </div>
          </div>
        ))}

        {/* Chapter markers */}
        <nav aria-label="Chapters" className="absolute right-4 top-1/2 flex -translate-y-1/2 gap-4 sm:right-8 md:right-10">
          <div className="relative w-px bg-white/15">
            <div ref={fill} className="absolute inset-0 origin-top scale-y-0 bg-gradient-to-b from-saffron to-gold" />
          </div>
          <ol className="flex flex-col gap-7 md:gap-9">
            {CHAPTERS.map((c, i) => (
              <li key={c.n}>
                <button
                  onClick={() => goTo(i)}
                  aria-current={active === i ? "step" : undefined}
                  className={`group flex items-baseline gap-3 text-left transition-colors duration-500 ${active === i ? "text-gold" : "text-stone-500 hover:text-stone-300"}`}
                >
                  <span className="font-serif text-lg italic">{c.n}</span>
                  <span className={`hidden text-[10px] uppercase tracking-[0.3em] transition-opacity duration-500 md:inline ${active === i ? "opacity-100" : "opacity-60"}`}>{c.label}</span>
                </button>
              </li>
            ))}
          </ol>
        </nav>
      </div>
    </section>
  );
}
