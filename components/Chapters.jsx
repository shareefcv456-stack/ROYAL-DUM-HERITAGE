"use client";

import { useEffect, useRef } from "react";
import gsap from "gsap";
import { ScrollTrigger } from "gsap/ScrollTrigger";

// Scene F, the story, after the user's soda landing-page reference (pin 3): each chapter is its own colour band that
// tears in over the last along a ragged paper edge; one giant word runs sideways behind it as you scroll through, and
// its photograph opens out of a circle. Split layout, alternating sides on wide screens; stacked on phones. Scrubbed by
// scroll (GSAP), so it plays back in reverse; without motion everything simply sits in place.
const CHAPTERS = [
  { n: "I", title: "The Fire", word: "FIRE", img: "hearth", alt: "A handi over a low wood fire", band: "bg-paper text-paper", tone: "text-copper/15",
    line: "Wood-fired and slow: an even heat under the handi, never a flame that rushes it." },
  { n: "II", title: "The Malabar Rice", word: "KAIMA", img: "rice", alt: "Rice tipped into the pot, steam rising", band: "bg-peach text-peach", tone: "text-crimson/10",
    line: "Malabar Kaima rice, layered over a handmade dum masala so every grain takes the flavour." },
  { n: "III", title: "The Sealed Dum", word: "DUM", img: "sealed", alt: "A sealed handi resting on the coals", band: "bg-saffron text-saffron", tone: "text-crimson-deep/15",
    line: "The lid goes on, the seal closes, and the pot is left alone to cook in its own steam." },
];

// A torn-paper edge along a band's top, in the band's own colour (currentColor).
const Tear = () => (
  <svg aria-hidden viewBox="0 0 1440 40" preserveAspectRatio="none" className="pointer-events-none absolute inset-x-0 -top-[39px] h-10 w-full fill-current">
    <path d="M0 40V22l38-9 31 11 44-14 27 10 52-17 33 15 41-8 30 12 55-19 25 13 47-7 36 10 29-16 48 12 33-9 40 14 51-18 27 11 45-6 30 13 52-15 26 9 43-12 35 14 49-10 28 8 46-16 34 12 41-9 38 15 50-13 29 10 44-11 33 9 21-6V40Z" />
  </svg>
);

export default function Chapters() {
  const root = useRef(null);

  useEffect(() => {
    if (matchMedia("(prefers-reduced-motion: reduce)").matches) return;
    gsap.registerPlugin(ScrollTrigger);
    const ctx = gsap.context(() => {
      gsap.utils.toArray(".ch-band").forEach((band, i) => {
        gsap.fromTo(band.querySelector(".ch-word"), { xPercent: i % 2 ? -30 : 10 }, { xPercent: i % 2 ? 10 : -30, ease: "none", scrollTrigger: { trigger: band, start: "top bottom", end: "bottom top", scrub: 0.6 } });
        gsap.fromTo(band.querySelector(".ch-photo"), { clipPath: "circle(12% at 50% 50%)" }, { clipPath: "circle(71% at 50% 50%)", ease: "none", scrollTrigger: { trigger: band, start: "top 85%", end: "center 55%", scrub: 0.6 } });
      });
    }, root);
    return () => ctx.revert();
  }, []);

  return (
    <section ref={root} id="story" aria-label="How the biriyani is made" className="relative z-10 text-ink">
      <div className="bg-paper px-5 pb-4 pt-20 sm:px-10 sm:pt-24 xl:px-16">
        <div className="mx-auto max-w-7xl">
          <p className="lift text-[11px] uppercase tracking-[0.35em] text-copper-deep">Our story, in three chapters</p>
          <h2 className="lift mt-3 max-w-3xl font-serif text-[clamp(2.75rem,6vw,4.5rem)] font-medium leading-[0.98]">
            How a handi <em className="text-copper-deep">comes to dum</em>
          </h2>
        </div>
      </div>
      <ol>
        {CHAPTERS.map((c, i) => (
          <li key={c.n} className={`ch-band relative ${c.band}`}>
            {i > 0 && <Tear />}
            <div className="relative overflow-hidden px-5 py-14 text-ink sm:px-10 sm:py-20 xl:px-16">
              <span aria-hidden className={`ch-word pointer-events-none absolute left-0 top-1/2 -translate-y-1/2 whitespace-nowrap font-serif text-[clamp(8rem,26vw,22rem)] font-semibold leading-none ${c.tone}`}>
                {c.word} {c.word}
              </span>
              <div className="relative mx-auto grid max-w-7xl items-center gap-10 md:grid-cols-12 md:gap-12">
                <div className={`md:col-span-5 ${i % 2 ? "md:order-2 md:col-start-8" : ""}`}>
                  <p className="lift flex items-center gap-4 text-[11px] uppercase tracking-[0.35em] text-crimson-deep">
                    Chapter {c.n} <span aria-hidden className="h-px w-12 bg-crimson-deep/40" />
                  </p>
                  <h3 className="lift mt-4 font-serif text-[clamp(3rem,6vw,5.5rem)] font-medium leading-[0.95]">{c.title}</h3>
                  <p className="lift mt-5 max-w-sm text-lg leading-relaxed text-ink/75">{c.line}</p>
                </div>
                <div className={`ch-photo mx-auto aspect-square w-[min(100%,32rem)] overflow-hidden rounded-full md:col-span-7 ${i % 2 ? "md:order-1" : ""}`}>
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  <img src={`/plates/${c.img}.jpg`} alt={c.alt} loading="lazy" decoding="async" width="1376" height="768" data-zoom className="h-full w-full object-cover" />
                </div>
              </div>
            </div>
          </li>
        ))}
      </ol>
    </section>
  );
}
