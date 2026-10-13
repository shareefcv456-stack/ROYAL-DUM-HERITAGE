"use client";

import { useEffect, useRef } from "react";
import gsap from "gsap";
import { ScrollTrigger } from "gsap/ScrollTrigger";
import { DISHES, add, inr, setOpen } from "./cart";
import { flyToCart } from "./fly";

// Scene C, the one pinned moment: the signature biriyani built in the handi by scroll. On a black stage (the pot photo's
// own ground) the copper handi is lowered in on a cord and swings to rest (the user's LightUp reference). Then each of
// the dish's layers (cart.js, bottom to top) lights up on the left and its real ingredient cut-outs glide down into the
// pot's mouth and stay there, so the pot visibly fills at every step: 01 the masala chicken lands; 02 a rice layer
// (a crop of the real biriyani photograph) rises over it as saffron falls on top; 03 the whole spices settle on the rice;
// 04 the fried shallots and cashews. Then the full photographic surface (handi-fill.jpg) settles in, a glisten runs
// across it, steam rises, and the price and order button arrive. A tall section with a sticky stage, scrubbed both
// ways, released by plain scrolling. Phones, reduced motion and no-script get the filled, steaming handi, still.
const D = DISHES[0];
// [layer index (D.layers order), image, left %, top %, width %, rotation]: landing spots inside the mouth's ellipse.
const DROPS = [
  [0, "float/chicken-1", 30, 24, 20, -24],
  [0, "float/chicken-2", 50, 26, 20, 18],
  [1, "spice/saffron", 34, 25, 14, -10],
  [1, "spice/saffron", 54, 31, 14, 40],
  [2, "spice/cardamom", 27, 30, 11, 30],
  [2, "spice/star-anise", 41, 22, 13, -40],
  [2, "spice/cinnamon", 53, 28, 15, 12],
  [2, "spice/clove", 66, 31, 9, -30],
  [3, "float/onion", 33, 25, 13, 20],
  [3, "float/cashew", 47, 31, 11, -35],
  [3, "float/onion", 60, 22, 13, -12],
];
// pot.jpg's inner rim, as a box in the pot frame: centre (50%, 35.75%), half-size 31% × 16%.
const MOUTH = "absolute left-[19%] top-[19.75%] h-[32%] w-[62%] overflow-hidden rounded-[50%]";
const WISPS = [[30, 7, 0, "-12%"], [50, 8, -2.6, "10%"], [70, 6.5, -4.4, "-8%"], [42, 7.5, -1.4, "14%"]];

export default function Assembly() {
  const root = useRef(null);

  useEffect(() => {
    gsap.registerPlugin(ScrollTrigger);
    const mm = gsap.matchMedia();
    mm.add("(min-width: 768px) and (prefers-reduced-motion: no-preference)", () => {
      const q = gsap.utils.selector(root);
      const tl = gsap.timeline({ defaults: { ease: "none" }, scrollTrigger: { trigger: root.current, start: "top top", end: "bottom bottom", scrub: 0.6, invalidateOnRefresh: true } });
      tl.set(q(".as-full, .as-steam, .as-chembu"), { opacity: 0 }, 0)
        .set(q(".as-rice"), { clipPath: "inset(100% 0% 0% 0%)" }, 0)
        .set(q(".as-step"), { opacity: 0.25 }, 0)
        .set(q(".as-buy"), { opacity: 0, y: 24 }, 0)
        // Lowered on its cord, the pivot high above: overshoot, swing back, settle; then the cord goes.
        .fromTo(q(".as-pot"), { yPercent: -130, rotate: -14, transformOrigin: "50% -80%" }, { yPercent: 0, rotate: 8, duration: 0.7, ease: "power2.out" }, 0)
        .to(q(".as-pot"), { rotate: -4, duration: 0.2, ease: "sine.inOut" })
        .to(q(".as-pot"), { rotate: 0, duration: 0.15, ease: "sine.out" })
        .fromTo(q(".as-cord"), { opacity: 1 }, { opacity: 0, duration: 0.2 }, 0.9);
      D.layers.forEach((_, k) => {
        const at = 1.2 + k * 1.6;
        tl.to(q(`.as-step-${k}`), { opacity: 1, duration: 0.3 }, at);
        // Each piece glides down from above the screen, sways as it lands, and stays.
        q(`.as-drop-${k}`).forEach((el, j) => {
          const r = Number(el.dataset.r), t = at + j * 0.15;
          tl.fromTo(el, { opacity: 1, y: () => -innerHeight, rotate: r - 60, scale: 1.25 }, { y: 0, rotate: r + 12, scale: 1, duration: 0.8, ease: "power2.in" }, t).to(el, { rotate: r, duration: 0.15, ease: "sine.out" }, t + 0.8);
        });
        if (k === 1) tl.to(q(".as-rice"), { clipPath: "inset(0% 0% 0% 0%)", duration: 0.9, ease: "power1.inOut" }, at + 0.2); // the rice rises over the chicken
      });
      const end = 1.2 + D.layers.length * 1.6;
      tl.to(q(".as-full"), { opacity: 1, duration: 0.6 }, end)
        .to(q(".as-steam"), { opacity: 1, duration: 0.5 }, end + 0.3)
        .to(q(".as-pot"), { scale: 1.08, duration: 0.8, ease: "power1.out" }, end + 0.4)
        // The served chembu takes over: the photograph of the finished handi on the fire.
        .fromTo(q(".as-chembu"), { opacity: 0, scale: 0.92 }, { opacity: 1, scale: 1, duration: 0.9, ease: "power1.out" }, end + 1)
        .to(q(".as-pot"), { opacity: 0, duration: 0.6 }, end + 1.2)
        .to(q(".as-buy"), { opacity: 1, y: 0, duration: 0.5 }, end + 0.8)
        .to({}, { duration: 0.6 }); // a beat to look at it before the section scrolls on
    });
    return () => mm.revert();
  }, []);

  return (
    <section ref={root} id="signature" aria-label={`Signature dum: ${D.full}`} className="relative z-10 bg-black text-ivory md:h-[460vh] md:motion-reduce:h-auto">
      <div className="md:sticky md:top-0 md:h-[100svh] md:overflow-hidden">
        <div className="mx-auto grid h-full max-w-7xl items-center gap-10 px-5 py-20 sm:px-10 md:grid-cols-[2fr_3fr] md:py-0 xl:px-16">
          <div className="order-2 md:order-1">
            <p className="text-[11px] uppercase tracking-[0.35em] text-saffron">Signature dum</p>
            <h2 className="mt-3 font-serif text-[clamp(2.6rem,5vw,4.5rem)] font-medium leading-[0.95]">{D.full}</h2>
            <ol className="mt-7 space-y-2 border-l border-saffron/40 pl-4">
              {D.layers.map((l, k) => (
                <li key={l} className={`as-step as-step-${k} text-sm text-ivory/85`}>
                  <span className="mr-2 font-serif text-saffron">0{k + 1}</span>
                  {l}
                </li>
              ))}
            </ol>
            <div className="as-buy mt-8">
              <p className="max-w-sm leading-relaxed text-ivory/75">{D.note}</p>
              <div className="mt-6 flex flex-wrap items-center gap-4">
                <span className="font-serif text-4xl tabular-nums">{inr(D.price)}</span>
                <button
                  onClick={(e) => {
                    add(D.id);
                    flyToCart(e.currentTarget, `/plates/dish/${D.id}.webp`).then(() => setOpen(true));
                  }}
                  disabled={!D.available}
                  className="inline-flex min-h-13 items-center rounded-full bg-crimson px-8 text-sm font-semibold text-ivory transition-[background-color,scale] duration-200 hover:bg-crimson-deep active:scale-[0.97] disabled:opacity-50"
                >
                  Order now
                </button>
              </div>
            </div>
          </div>

          {/* The stage. Static: the served chembu, steaming. Animated: lowered in empty, filled layer by layer, then served. */}
          <div aria-hidden className="relative order-1 mx-auto aspect-square w-full max-w-[34rem] md:order-2 md:h-[min(80svh,40rem)] md:w-auto md:max-w-none">
            <div className="as-pot absolute inset-x-[6%] bottom-0 top-[12%] will-change-transform">
              <span className="as-cord absolute bottom-[78%] left-1/2 h-[120svh] w-px bg-saffron/50 opacity-0" />
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img src="/plates/pot.jpg" alt="" width="1024" height="1024" loading="lazy" decoding="async" className="absolute inset-0 h-full w-full object-contain" />
              {/* 01 lands first, under the rice. */}
              {DROPS.filter(([k]) => k === 0).map(([k, src, left, top, w, r], n) => (
                // eslint-disable-next-line @next/next/no-img-element
                <img key={`a${n}`} src={`/plates/${src}.webp`} alt="" width="256" height="256" loading="lazy" decoding="async" data-r={r} className={`as-drop-${k} absolute opacity-0 drop-shadow-[0_8px_8px_rgb(0_0_0/0.5)]`} style={{ left: `${left}%`, top: `${top}%`, width: `${w}%` }} />
              ))}
              <div className={`${MOUTH} shadow-[inset_0_12px_22px_rgb(0_0_0/0.6)]`}>
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img src="/plates/fill-rice.jpg" alt="" width="380" height="120" loading="lazy" decoding="async" className="as-rice h-full w-full object-cover [clip-path:inset(100%_0_0_0)]" />
              </div>
              {DROPS.filter(([k]) => k > 0).map(([k, src, left, top, w, r], n) => (
                // eslint-disable-next-line @next/next/no-img-element
                <img key={`b${n}`} src={`/plates/${src}.webp`} alt="" width="256" height="256" loading="lazy" decoding="async" data-r={r} className={`as-drop-${k} absolute opacity-0 drop-shadow-[0_8px_8px_rgb(0_0_0/0.5)]`} style={{ left: `${left}%`, top: `${top}%`, width: `${w}%` }} />
              ))}
              {/* The finished surface, glistening. */}
              <div className={`as-full ${MOUTH} shadow-[inset_0_10px_18px_rgb(0_0_0/0.55)]`}>
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img src="/plates/handi-fill.jpg" alt="" width="1024" height="412" loading="lazy" decoding="async" className="h-full w-full object-cover" />
                <span className="glint absolute inset-y-[-20%] left-0 w-1/3 bg-[linear-gradient(90deg,transparent,rgb(255_236_200/0.35),transparent)] mix-blend-screen" />
              </div>
              <div className="as-steam pointer-events-none absolute left-[15%] top-[-30%] h-[62%] w-[70%]">
                {WISPS.map(([left, t, delay, sway], n) => (
                  <span key={n} className="smoke" style={{ left: `${left}%`, "--t": `${t}s`, "--dl": `${delay}s`, "--sx": sway }} />
                ))}
              </div>
            </div>
            {/* The finished chembu (the user's photograph), its edges feathered into the stage, with live steam. */}
            <div className="as-chembu absolute inset-0">
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img src="/plates/chembu.jpg" alt="" width="500" height="500" loading="lazy" decoding="async" className="h-full w-full object-cover [mask-image:radial-gradient(closest-side,#000_68%,transparent)]" />
              <div className="pointer-events-none absolute left-[28%] top-[2%] h-[40%] w-[52%]">
                {WISPS.map(([left, t, delay, sway], n) => (
                  <span key={n} className="smoke" style={{ left: `${left}%`, "--t": `${t}s`, "--dl": `${delay}s`, "--sx": sway }} />
                ))}
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
