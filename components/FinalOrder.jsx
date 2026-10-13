"use client";

import { inr, setOpen, totals, useShop } from "./cart";

// Scene G, the last call, set like a fine-dining room at night: grained deep charcoal, warm amber spotlights (one over
// the plate, one washing the words), a large dark ROYAL DUM HERITAGE watermark behind, and the biriyani from above on
// its copper plate (its black ground dropped out with a lighten blend, so the plate sits in the room's light) with steam rising off it. Palette: charcoal, cream,
// aged bronze, saffron gold. One line, and the way to order: the menu, or the cart once something is in it.
// Steam wisps over the plate: left %, loop seconds, start offset, sway.
const WISPS = [[24, 7.5, 0, "-12%"], [40, 8.5, -2.4, "14%"], [56, 7, -4.6, "-10%"], [72, 9, -1.2, "8%"], [32, 8, -5.8, "16%"], [64, 6.5, -3.3, "-16%"], [48, 9.5, -6.9, "-6%"]];

export default function FinalOrder() {
  const { cart } = useShop();
  const { count, total } = totals(cart);
  return (
    <section aria-label="Order" className="grain-dark relative isolate z-10 overflow-hidden bg-[#1a1411] text-[#f6e9d4]">
      {/* Amber spotlights from above: over the plate, and a softer one on the words. */}
      <div aria-hidden className="pointer-events-none absolute inset-0 bg-[radial-gradient(38%_60%_at_74%_42%,rgb(232_170_90/0.32),transparent_70%),radial-gradient(34%_50%_at_22%_30%,rgb(201_150_80/0.14),transparent_70%),linear-gradient(to_bottom,rgb(0_0_0/0.35),transparent_30%,transparent_70%,rgb(0_0_0/0.45))]" />
      {/* The watermark: dark, large, barely there. */}
      <p aria-hidden style={{ whiteSpace: "nowrap" }} className="pointer-events-none absolute inset-x-0 bottom-[-0.1em] select-none text-center font-serif text-[8.4vw] font-semibold leading-none tracking-[0.02em] text-[#2a201b]">
        ROYAL DUM HERITAGE
      </p>
      <div className="relative mx-auto grid max-w-7xl items-center gap-6 px-5 py-16 sm:px-10 md:grid-cols-2 md:py-0 xl:px-16">
        <div className="order-2 md:order-1 md:py-24">
          <p className="lift flex items-center gap-3 text-[11px] uppercase tracking-[0.35em] text-[#d9a54a]">Your table <span aria-hidden className="h-px w-10 bg-[#a8743f]" /></p>
          <h2 className="lift mt-3 font-serif text-[clamp(2.75rem,6vw,5rem)] font-medium leading-[0.95]">
            The handi is ready. <em className="text-[#e8bb62]">Are you?</em>
          </h2>
          <p className="lift mt-5 max-w-md text-lg leading-relaxed text-[#e9dcc6]">Sealed, slow-cooked and opened at your table: pick your biriyani and we&apos;ll have it ready.</p>
          <div className="lift mt-8 flex flex-wrap items-center gap-3">
            <a href="#menu" className="inline-flex min-h-13 items-center rounded-full bg-[#d9a54a] px-8 text-sm font-semibold text-[#1a1411] shadow-[0_16px_34px_-14px_rgb(217_165_74/0.6)] transition-[background-color,scale] duration-200 hover:bg-[#e8bb62] active:scale-[0.97]">
              Order Biriyani
            </a>
            {count > 0 && (
              <button onClick={() => setOpen(true)} className="inline-flex min-h-13 items-center rounded-full border border-[#a8743f] px-7 text-sm font-semibold text-[#f6e9d4] transition hover:border-[#d9a54a]">
                View cart · {count} · {inr(total)}
              </button>
            )}
          </div>
        </div>
        {/* The plate, with live steam rising off the biriyani (globals.css .smoke). */}
        <div className="relative order-1 mx-auto aspect-square w-full max-w-xl md:order-2">
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img src="/plates/plated.jpg" alt="Chicken dum biriyani from above on a hammered copper plate" width="1024" height="1024" loading="lazy" decoding="async" data-zoom className="h-full w-full object-cover mix-blend-lighten" />
          <div aria-hidden className="pointer-events-none absolute left-[22%] top-[-6%] h-[62%] w-[56%]">
            {WISPS.map(([left, t, delay, sway], k) => (
              <span key={k} className="smoke" style={{ left: `${left}%`, "--t": `${t}s`, "--dl": `${delay}s`, "--sx": sway }} />
            ))}
          </div>
        </div>
      </div>
    </section>
  );
}
