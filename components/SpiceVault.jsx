"use client";

import { useEffect, useRef, useState } from "react";
import gsap from "gsap";
import { ScrollTrigger } from "gsap/ScrollTrigger";

// Transparent macro cut-outs, keyed from the studio spice sheet (the same photographs that float in the background).
const SPICES = [
  {
    name: "Green Cardamom", local: "Elakka", img: "/plates/spice/cardamom.png",
    origin: "Idukki, Western Ghats",
    note: "Bloomed whole in hot ghee at the very start, so every grain of rice carries its cool, floral perfume.",
  },
  {
    name: "Cloves", local: "Grambu", img: "/plates/spice/clove.png",
    origin: "Western Ghats, Kerala",
    note: "A few buds in the masala for depth and a faint numbing warmth; too many and they take over.",
  },
  {
    name: "Star Anise", local: "Thakkolam", img: "/plates/spice/star-anise.png",
    origin: "Southern China & Vietnam",
    note: "One or two pods only. A quiet liquorice sweetness that rounds out the meat.",
  },
  {
    name: "Cinnamon", local: "Karuvapatta", img: "/plates/spice/cinnamon.png",
    origin: "Kerala & Sri Lanka",
    note: "Thin, papery bark that sweetens the oil and the marinade without any sugar.",
  },
  {
    name: "Saffron", local: "Kunkumapoovu", img: "/plates/spice/saffron.png",
    origin: "Pampore, Kashmir",
    note: "Steeped in warm milk and streaked over the top layer of rice just before the pot is sealed.",
  },
];

// Where each spice flies in from: [x, y] in multiples of its own size, out in the dark margins.
const ENTRY = [[-2.6, -0.9], [2.6, 0.7], [-2.4, 1], [2.5, -1], [0.4, -2.4]];

// Pinned for the whole section; scroll scrubs one timeline: each spice bursts in from the dark margin in slow motion,
// spinning and catching a sweep of light, its name riding in beside it; it holds, then tears down the middle and
// both halves slide off to the left as the next spice arrives.
export default function SpiceVault() {
  const root = useRef(null);
  const [current, setCurrent] = useState(0);

  useEffect(() => {
    gsap.registerPlugin(ScrollTrigger);
    const ctx = gsap.context(() => {
      const tl = gsap.timeline({
        defaults: { ease: "none" },
        scrollTrigger: {
          trigger: root.current,
          start: "top top",
          end: "bottom bottom",
          scrub: true,
          onUpdate: (s) => setCurrent(Math.min(SPICES.length - 1, Math.floor(s.progress * SPICES.length * 0.999))),
        },
      });
      // The title's words rise in one by one alongside the first spice's entry.
      tl.from(".vault-title p", { autoAlpha: 0, y: 20, duration: 0.5 }, 0).from(".vault-word", { autoAlpha: 0, yPercent: 60, rotateX: -50, stagger: 0.09, duration: 0.7, ease: "power3.out" }, 0.15);
      SPICES.forEach((_, i) => {
        const halves = `.spice-${i} .half`;
        const left = `.spice-${i} .half-l`;
        const right = `.spice-${i} .half-r`;
        const text = `.spice-text-${i} > *`;
        const at = i === 0 ? 0.25 : ">-0.35"; // each spice arrives as the previous one leaves
        const [ex, ey] = ENTRY[i];
        const side = ex < 0 ? -1 : 1;
        // In: flies in from the dark margin, spinning, and brakes hard into place (power4.out reads as slow motion
        // under scrub). Only transform and opacity animate: compositor-only, 60fps.
        tl.fromTo(
          `.spice-${i}`,
          { autoAlpha: 0, xPercent: ex * 100, yPercent: ey * 100, rotate: side * -540, scale: 0.35 },
          { autoAlpha: 1, xPercent: 0, yPercent: 0, rotate: 0, scale: 1, duration: 1.7, ease: "power4.out" },
          at
        )
          // A sweep of warm light travels across the spice as it settles.
          .fromTo(`.spice-${i} .glint`, { xPercent: -120 * side, autoAlpha: 0 }, { xPercent: 120 * side, autoAlpha: 1, duration: 1.4, ease: "power1.inOut" }, "<0.45")
          .to(`.spice-${i} .glint`, { autoAlpha: 0, duration: 0.4 }, ">-0.4")
          // Its name rides in from the same side, in step with the spice.
          .fromTo(text, { autoAlpha: 0, x: side * 70 }, { autoAlpha: 1, x: 0, stagger: 0.1, duration: 0.9, ease: "power3.out" }, "<-0.9")
          .to({}, { duration: 1 }); // hold
        if (i === SPICES.length - 1) return;
        // Out: the halves part along the seam and slide off to the left margin, tumbling and defocusing.
        tl.to(left, { xPercent: -170, yPercent: -6, rotate: -14, autoAlpha: 0, duration: 1.2, ease: "power1.in" })
          .to(right, { xPercent: -95, yPercent: 8, rotate: 9, autoAlpha: 0, duration: 1.2, ease: "power1.in" }, "<0.08")
          .to(text, { autoAlpha: 0, y: -24, stagger: 0.05, duration: 0.5 }, "<");
      });
    }, root);
    return () => ctx.revert();
  }, []);

  return (
    <section id="spice-vault" ref={root} className="relative isolate h-[700svh]">
      <div className="sticky top-0 flex h-[100svh] flex-col overflow-hidden px-5 pb-10 pt-28 sm:px-10">
        {/* Dark wash so the spice and its notes read over the packing shot behind. */}
        <div aria-hidden className="absolute inset-0 -z-10 bg-[radial-gradient(ellipse_70%_60%_at_45%_55%,rgba(10,10,10,0.82),rgba(10,10,10,0.45)_70%,transparent)]" />
        <div className="vault-title mx-auto w-full max-w-6xl">
          <p className="text-[11px] uppercase tracking-[0.35em] text-gold">The Spice Vault</p>
          <h2 className="mt-4 max-w-2xl [perspective:600px] font-serif text-4xl font-medium leading-[0.98] text-ivory sm:text-6xl">
            {["Five", "spices."].map((w) => (
              <span key={w} className="vault-word inline-block will-change-transform">{w}&nbsp;</span>
            ))}
            {["Nothing", "ground", "in", "advance."].map((w) => (
              <em key={w} className="vault-word inline-block text-saffron will-change-transform">{w}&nbsp;</em>
            ))}
          </h2>
        </div>

        <div className="mx-auto grid w-full max-w-6xl flex-1 items-center gap-6 md:grid-cols-[1fr_1.1fr] md:gap-10">
          <div className="relative mx-auto aspect-square w-[62vw] max-w-[380px] md:w-full">
            <div className="absolute inset-[18%] rounded-full bg-saffron/10 blur-3xl" />
            {SPICES.map((s, i) => (
              <div key={s.name} role="img" aria-label={`${s.name}, macro photograph`} aria-hidden={i !== current} className={`spice-${i} invisible absolute inset-0 will-change-transform`}>
                {["half-l [clip-path:inset(0_50%_0_0)]", "half-r [clip-path:inset(0_0_0_50%)]"].map((cls) => (
                  <div key={cls} className={`half ${cls} absolute inset-0 will-change-transform`}>
                    {/* eslint-disable-next-line @next/next/no-img-element */}
                    <img src={s.img} alt="" loading="lazy" decoding="async" className="absolute inset-0 h-full w-full" />
                  </div>
                ))}
                {/* Light sweep, masked to the spice's own silhouette. */}
                <div
                  aria-hidden
                  className="pointer-events-none absolute inset-0 overflow-hidden mix-blend-screen"
                  style={{ maskImage: `url(${s.img})`, WebkitMaskImage: `url(${s.img})`, maskSize: "100% 100%", WebkitMaskSize: "100% 100%" }}
                >
                  <div className="glint invisible absolute inset-y-0 -left-1/4 w-[150%] bg-[linear-gradient(105deg,transparent_38%,rgba(255,226,170,0.75)_50%,transparent_62%)] will-change-transform" />
                </div>
              </div>
            ))}
          </div>

          <div className="relative min-h-[13rem] md:min-h-[16rem]">
            {SPICES.map((s, i) => (
              <div key={s.name} className={`spice-text-${i} absolute inset-0`} aria-hidden={i !== current}>
                <p className="invisible font-serif text-lg italic text-gold-soft">{s.local}</p>
                <h3 className="invisible mt-1 font-serif text-4xl text-ivory sm:text-5xl">{s.name}</h3>
                <p className="invisible mt-2 text-[11px] uppercase tracking-[0.3em] text-stone-400">{s.origin}</p>
                <p className="invisible mt-5 max-w-md leading-relaxed text-stone-300">{s.note}</p>
              </div>
            ))}
            <p className="absolute -top-7 left-0 font-serif text-sm tabular-nums tracking-widest text-gold/70">
              {String(current + 1).padStart(2, "0")} <span className="text-stone-600">/ {String(SPICES.length).padStart(2, "0")}</span>
            </p>
          </div>
        </div>
      </div>
    </section>
  );
}
