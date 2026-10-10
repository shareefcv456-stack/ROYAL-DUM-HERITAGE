"use client";

import { DELIVERY_FEE, DELIVERY_PINS, HOURS, PHONE, PICKUP, WHATSAPP, inr } from "./cart";

// General knowledge about Malabar biriyani and its spices; nothing here is a claim about the business.
const SPICES = [
  { n: "cardamom", name: "Green cardamom", local: "Elakka", note: "Cool and floral; perfumes the rice." },
  { n: "clove", name: "Clove", local: "Grambu", note: "Deep and warming, used sparingly." },
  { n: "cinnamon", name: "Cinnamon", local: "Karuvapatta", note: "Sweetens the oil and the masala." },
  { n: "star-anise", name: "Star anise", local: "Thakkolam", note: "A quiet liquorice note." },
  { n: "saffron", name: "Saffron", local: "Kunkumapoovu", note: "Colour and aroma on the top layer." },
];
const STEPS = [
  { n: "01", t: "Masala", d: "The meat or seafood is cooked down in its masala at the bottom of the pot." },
  { n: "02", t: "Layer", d: "Kaima, the short-grain Malabar rice, goes over it with ghee, whole spices and fried shallots." },
  { n: "03", t: "Dum", d: "The lid is sealed, traditionally with dough, and the pot rests over low heat so it cooks in its own steam." },
];

export function Craft() {
  return (
    <section id="craft" className="leaf relative z-10 px-5 py-24 text-ivory sm:px-10 xl:px-16">
      <div className="mx-auto max-w-7xl">
        <p className="lift text-[11px] uppercase tracking-[0.35em] text-gold">Ingredients & craft</p>
        <h2 className="lift mt-3 max-w-2xl font-serif text-5xl font-medium leading-[0.98] sm:text-6xl">
          What goes <em className="text-saffron">into the pot</em>
        </h2>
        <ol className="mt-12 grid gap-8 md:grid-cols-3">
          {STEPS.map((s) => (
            <li key={s.n} className="lift border-t border-ivory/15 pt-5">
              <span className="font-serif text-lg text-gold">{s.n}</span>
              <h3 className="mt-1 font-serif text-3xl">{s.t}</h3>
              <p className="mt-2 leading-relaxed text-ivory/75">{s.d}</p>
            </li>
          ))}
        </ol>
        <ul className="mt-16 grid grid-cols-2 gap-6 sm:grid-cols-3 lg:grid-cols-5">
          {SPICES.map((s) => (
            <li key={s.n} className="lift text-center">
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img src={`/plates/spice/${s.n}.webp`} alt="" width="160" height="160" loading="lazy" className="mx-auto h-24 w-24 object-contain drop-shadow-[0_12px_18px_rgba(0,0,0,0.45)]" />
              <p className="mt-3 font-serif text-xl">{s.name}</p>
              <p className="text-xs uppercase tracking-[0.25em] text-gold/90">{s.local}</p>
              <p className="mt-1 text-sm text-ivory/70">{s.note}</p>
            </li>
          ))}
        </ul>
      </div>
    </section>
  );
}

export function Delivery() {
  return (
    <section id="delivery" className="relative z-10 bg-ivory px-5 py-24 text-ink sm:px-10 xl:px-16">
      <div className="mx-auto max-w-7xl">
        <p className="lift text-[11px] uppercase tracking-[0.35em] text-copper-deep">Delivery & pickup</p>
        <h2 className="lift mt-3 font-serif text-5xl font-medium leading-[0.98] sm:text-6xl">
          To your door, <em className="text-copper-deep">or ours.</em>
        </h2>
        <div className="mt-12 grid gap-6 md:grid-cols-2">
          <div className="lift rounded-2xl bg-paper p-7 ring-1 ring-ink/10">
            <h3 className="font-serif text-3xl">Delivery</h3>
            <ul className="mt-4 space-y-2 text-ink/75">
              <li>Enter your PIN code at checkout. {DELIVERY_PINS.length ? "We check it against our delivery areas before you order." : "Delivery to your area is confirmed with your order."}</li>
              <li>{DELIVERY_FEE == null ? "Any delivery fee is confirmed with your order." : `Delivery fee: ${inr(DELIVERY_FEE)}.`}</li>
            </ul>
          </div>
          <div className="lift rounded-2xl bg-paper p-7 ring-1 ring-ink/10">
            <h3 className="font-serif text-3xl">Pickup</h3>
            <ul className="mt-4 space-y-2 text-ink/75">
              <li>{PICKUP ? `Collect from ${PICKUP}.` : "The pickup address is confirmed with your order."}</li>
              {HOURS && <li>Open {HOURS}.</li>}
              <li>No delivery fee.</li>
            </ul>
          </div>
        </div>
      </div>
    </section>
  );
}

const FAQ = [
  { q: "How do I order?", a: "Pick your biriyani and any sides, open the cart, choose delivery or pickup, and add your details. Your order summary is shown before you confirm." },
  { q: "Can I collect it myself?", a: "Yes, choose Pickup at checkout. There is no delivery fee for pickup." },
  { q: "Do you deliver to my area?", a: "Enter your PIN code at checkout; it is checked before the order is placed." },
  { q: "How do I pay?", a: WHATSAPP ? "Payment is arranged when the restaurant confirms your order on WhatsApp." : "Online ordering and payment are not connected yet: this store is currently a demo." },
  { q: "What is Kaima rice?", a: "A short-grain, fragrant rice traditionally used for Malabar biriyani in north Kerala." },
];

export function Faq() {
  return (
    <section id="faq" className="relative z-10 bg-paper px-5 py-24 text-ink sm:px-10 xl:px-16">
      <div className="mx-auto grid max-w-7xl gap-10 md:grid-cols-[1fr_1.4fr]">
        <h2 className="lift font-serif text-5xl font-medium leading-[0.98] sm:text-6xl">
          Questions, <em className="text-copper-deep">answered.</em>
        </h2>
        <div className="divide-y divide-ink/10 border-y border-ink/10">
          {FAQ.map((f) => (
            <details key={f.q} className="lift group py-2">
              <summary className="flex min-h-12 cursor-pointer list-none items-center justify-between gap-4 font-serif text-xl">
                {f.q}
                <span aria-hidden className="text-copper-deep transition group-open:rotate-45">+</span>
              </summary>
              <p className="pb-4 pr-8 leading-relaxed text-ink/70">{f.a}</p>
            </details>
          ))}
        </div>
      </div>
    </section>
  );
}

export function Footer() {
  const contact = [PHONE && ["Phone", PHONE, `tel:${PHONE.replace(/\s/g, "")}`], WHATSAPP && ["WhatsApp", `+${WHATSAPP}`, `https://wa.me/${WHATSAPP}`], PICKUP && ["Address", PICKUP], HOURS && ["Hours", HOURS]].filter(Boolean);
  return (
    <footer className="relative z-10 bg-leaf-deep px-5 pt-16 text-ivory sm:px-10 xl:px-16">
      <div className="trim mb-12" aria-hidden />
      <div className="mx-auto grid max-w-7xl gap-10 pb-12 md:grid-cols-3">
        <div>
          <p className="font-serif text-2xl tracking-[0.2em]">ROYAL DUM HERITAGE</p>
          <p className="mt-2 text-ivory/65">Malabar dum biriyani. From our chembu to your doorstep.</p>
        </div>
        <nav aria-label="Footer" className="flex flex-col gap-1 text-ivory/80">
          {[["#menu", "Menu"], ["#story", "The Dum"], ["#craft", "Ingredients & craft"], ["#delivery", "Delivery & pickup"], ["#faq", "FAQ"]].map(([h, l]) => (
            <a key={h} href={h} className="min-h-10 w-fit content-center transition hover:text-gold">
              {l}
            </a>
          ))}
        </nav>
        {contact.length > 0 && (
          <dl className="grid grid-cols-[auto_1fr] gap-x-4 gap-y-2 text-sm">
            {contact.map(([k, v, href]) => (
              <div key={k} className="contents">
                <dt className="text-ivory/50">{k}</dt>
                <dd>{href ? <a href={href} className="hover:text-gold">{v}</a> : v}</dd>
              </div>
            ))}
          </dl>
        )}
      </div>
      <p className="mx-auto max-w-7xl border-t border-ivory/10 py-6 text-xs text-ivory/45">Imagery is AI-generated for illustration.</p>
      {/* Room for the mobile Menu/Cart bar, so it never covers the last of the page. */}
      <div className="h-[calc(4.25rem+env(safe-area-inset-bottom))] md:hidden" aria-hidden />
    </footer>
  );
}
