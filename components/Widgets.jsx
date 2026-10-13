"use client";

import { useEffect, useState } from "react";
import { KITCHEN_HOURS, OFFERS, SAMPLE } from "./cart";
import { Bag, Scooter, Tag } from "./icons";

// "12:00" → minutes after midnight, and → a local clock label ("12:00 pm").
const mins = (hm) => {
  const [h, m] = hm.split(":").map(Number);
  return h * 60 + m;
};
const label = (hm) => {
  const [h, m] = hm.split(":").map(Number);
  return new Date(2000, 0, 1, h, m).toLocaleTimeString([], { hour: "numeric", minute: "2-digit" });
};

// Live kitchen status for the header: computed in the browser (time zones differ), refreshed each minute. With no
// KITCHEN_HOURS set it claims nothing live and just names the two ways to get an order.
export function KitchenStatus() {
  const [now, setNow] = useState(null);
  useEffect(() => {
    if (!KITCHEN_HOURS) return;
    const tick = () => setNow(new Date());
    tick();
    const id = setInterval(tick, 60000);
    return () => clearInterval(id);
  }, []);

  if (!KITCHEN_HOURS)
    return (
      <span className="hidden items-center gap-3 text-xs text-ink/65 xl:flex">
        <span className="flex items-center gap-1.5"><Scooter /> Delivery</span>
        <span className="flex items-center gap-1.5"><Bag /> Pickup</span>
      </span>
    );
  if (!now) return null; // renders after mount only, so server and client markup match
  const m = now.getHours() * 60 + now.getMinutes();
  const o = mins(KITCHEN_HOURS.open);
  const c = mins(KITCHEN_HOURS.close);
  const open = o < c ? m >= o && m < c : m >= o || m < c; // closing after midnight
  return (
    <span role="status" className="hidden items-center gap-2 text-xs text-ink/75 xl:flex">
      <span className="relative flex h-2 w-2">
        <span className={`relative h-2 w-2 rounded-full ${open ? "bg-[#6fa352]" : "bg-[#c0313a]"}`} />
      </span>
      {open ? `Open now · until ${label(KITCHEN_HOURS.close)}` : `Closed · opens ${label(KITCHEN_HOURS.open)}`}
    </span>
  );
}

// A slim tab on the right edge (xl screens, where the page margin clears it) that opens the business's current offers. Only real offers
// (cart.js OFFERS) are listed; in the demo store, the panel says where they will appear instead of inventing one.
export function OfferRail() {
  const [open, setOpen] = useState(false);
  useEffect(() => {
    if (!open) return;
    const key = (e) => e.key === "Escape" && setOpen(false);
    addEventListener("keydown", key);
    return () => removeEventListener("keydown", key);
  }, [open]);
  if (!OFFERS.length && !SAMPLE) return null;

  return (
    <div className="fixed right-0 top-1/2 z-30 hidden -translate-y-1/2 items-center xl:flex">
      {/* The panel slides out from the tab (transform and opacity only); inert while closed. */}
      <div
        id="offer-panel"
        role="region"
        aria-label="Offers"
        inert={!open}
        className={`mr-3 w-80 origin-right rounded-2xl border border-ink/10 bg-white/95 p-6 text-ink shadow-[0_30px_60px_-24px_rgba(150,50,20,0.45)] backdrop-blur-md transition-[opacity,transform] duration-300 ease-out ${open ? "translate-x-0 opacity-100" : "pointer-events-none translate-x-4 opacity-0"}`}
      >
        <div className="flex items-center justify-between">
          <p className="flex items-center gap-2 text-[11px] uppercase tracking-[0.3em] text-crimson"><Tag /> Offers</p>
          <button onClick={() => setOpen(false)} aria-label="Close offers" className="grid h-10 w-10 place-items-center rounded-full text-lg text-ink/50 transition hover:bg-ink/5 hover:text-ink">×</button>
        </div>
        {OFFERS.length ? (
          <ul className="mt-4 space-y-2.5">
            {OFFERS.map((o) => (
              <li key={o} className="rounded-xl border-l-2 border-crimson bg-peach px-4 py-3 font-serif text-lg leading-snug">
                {o}
              </li>
            ))}
          </ul>
        ) : (
          <p className="mt-4 rounded-xl border-l-2 border-crimson/50 bg-peach px-4 py-3 text-sm leading-relaxed text-ink/70">
            No offers are running in this demo. Offers the restaurant adds will appear here.
          </p>
        )}
        <a href="#combos" onClick={() => setOpen(false)} className="mt-5 flex min-h-11 items-center justify-between rounded-full bg-crimson px-5 text-sm font-semibold text-ivory transition hover:bg-crimson-deep">
          See combos & packs <span aria-hidden>→</span>
        </a>
      </div>
      <button
        onClick={() => setOpen((v) => !v)}
        aria-expanded={open}
        aria-controls="offer-panel"
        className="group flex min-h-11 flex-col items-center gap-2.5 rounded-l-2xl border border-r-0 border-crimson-deep/30 bg-crimson px-2.5 py-5 text-[11px] font-semibold uppercase tracking-[0.25em] text-ivory shadow-lg transition hover:pr-3.5"
      >
        <Tag className="h-4 w-4 text-ivory" />
        <span className="[writing-mode:vertical-rl]">Offers</span>
        {OFFERS.length > 0 && <span className="grid h-5 min-w-5 place-items-center rounded-full bg-ivory px-1 text-[10px] text-crimson">{OFFERS.length}</span>}
      </button>
    </div>
  );
}

// Phones and tablets: the header's links behind one toggle. A native popover, so Esc and a tap outside close it; a
// link closes it too as the page scrolls to its section.
export function MobileNav({ links }) {
  return (
    <>
      <button popoverTarget="mobile-nav" aria-label="Open navigation" className="grid h-11 w-11 place-items-center rounded-full transition hover:bg-ink/5 lg:hidden">
        <svg viewBox="0 0 24 24" className="h-5 w-5" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round"><path d="M4 8h16M4 16h16" /></svg>
      </button>
      <div id="mobile-nav" popover="auto" className="nav-pop m-0 ml-auto mr-4 mt-[4.25rem] w-56 rounded-2xl bg-paper p-2 text-ink shadow-[0_24px_48px_-20px_rgb(56_37_30/0.45)] ring-1 ring-ink/10">
        {links.map(([h, l]) => (
          <a key={h} href={h} onClick={(e) => e.currentTarget.parentElement.hidePopover()} className="flex min-h-12 items-center rounded-xl px-4 font-serif text-xl transition hover:bg-ink/5">
            {l}
          </a>
        ))}
      </div>
    </>
  );
}
