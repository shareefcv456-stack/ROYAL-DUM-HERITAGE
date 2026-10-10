"use client";

import { useEffect, useRef, useState } from "react";
import {
  ADDONS, DELIVERY_FEE, DISHES, MAX_QTY, PICKUP, SAMPLE, WHATSAPP, add, dish, inr, orderMessage, pinStatus, placeOrder, setDraft, setFlavor, setFulfil, setOpen,
  setQty, setStep, totals, useShop,
} from "./cart";

// The light editorial shop: flavour switcher with the layer breakdown, the full menu, add-ons, and the slide-over
// cart with checkout. Sits on the cream "paper" that Story.jsx fades in over the dark stage.

function Heat({ n }) {
  return (
    <span className="flex gap-1" role="img" aria-label={`Heat ${n} of 4`}>
      {[0, 1, 2, 3].map((i) => (
        <span key={i} className={`h-1.5 w-4 rounded-full ${i < n ? "bg-copper" : "bg-ink/10"}`} />
      ))}
    </span>
  );
}

// − n + with 40px touch targets.
function Qty({ value, onChange, label, min = 0 }) {
  return (
    <div className="flex w-fit items-center self-start rounded-full border border-ink/15" role="group" aria-label={`${label} quantity`}>
      <button type="button" onClick={() => onChange(value - 1)} disabled={value <= min} className="grid h-10 w-10 place-items-center text-lg leading-none disabled:opacity-30" aria-label={`One fewer ${label}`}>
        −
      </button>
      <span className="w-7 text-center text-sm tabular-nums" aria-live="polite">{value}</span>
      <button type="button" onClick={() => onChange(value + 1)} disabled={value >= MAX_QTY} className="grid h-10 w-10 place-items-center text-lg leading-none disabled:opacity-30" aria-label={`One more ${label}`}>
        +
      </button>
    </div>
  );
}

function Availability({ ok }) {
  return <span className={`text-[10px] uppercase tracking-[0.3em] ${ok ? "text-emerald-700" : "text-ink/40"}`}>{ok ? "Available" : "Sold out"}</span>;
}

// Shown while the menu is a sample or orders go nowhere, so nobody mistakes the demo for a live shop.
export function DemoNotice({ className = "" }) {
  if (!SAMPLE && WHATSAPP) return null;
  return (
    <p className={`rounded-lg border border-copper/30 bg-copper/5 px-4 py-3 text-xs leading-relaxed text-ink/70 ${className}`}>
      <strong className="font-semibold text-ink">Demo store.</strong>{" "}
      {SAMPLE && "Menu, portions and prices are samples, not the restaurant's. "}
      {!WHATSAPP && "Checkout confirms on screen only: no order is sent and no payment is taken."}
    </p>
  );
}

// Add, with immediate feedback: the button becomes a quantity stepper and "Added" flashes beside it.
function AddControl({ x, qty }) {
  const [flash, setFlash] = useState(0);
  useEffect(() => {
    if (!flash) return;
    const id = setTimeout(() => setFlash(0), 1400);
    return () => clearTimeout(id);
  }, [flash]);
  if (!x.available) return <span className="text-sm text-ink/45">Sold out</span>;
  return qty ? (
    <span className="flex items-center gap-3">
      <Qty value={qty} onChange={(n) => setQty(x.id, n)} label={x.full} />
      {flash ? <span className="text-xs font-medium text-emerald-700" role="status">Added ✓</span> : null}
    </span>
  ) : (
    <button
      onClick={() => {
        add(x.id);
        setFlash(Date.now());
      }}
      className="min-h-11 rounded-full bg-ink px-6 text-sm font-medium text-paper transition hover:bg-copper-deep"
      aria-label={`Add ${x.full} to cart`}
    >
      Add
    </button>
  );
}

export default function Shop() {
  const { flavor, cart } = useShop();
  return (
    <section id="menu" className="relative z-10 bg-paper px-5 pb-24 pt-24 text-ink sm:px-10 xl:px-16">
      <div className="mx-auto max-w-7xl">
        <div className="flex flex-wrap items-end justify-between gap-6">
          <div>
            <p className="lift text-[11px] uppercase tracking-[0.35em] text-copper-deep">The menu</p>
            <h2 className="lift mt-3 font-serif text-5xl font-medium leading-[0.98] sm:text-6xl">
              Choose your <em className="text-copper-deep">biriyani</em>
            </h2>
          </div>
          <DemoNotice className="lift max-w-md" />
        </div>

        <ul className="mt-12 grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
          {DISHES.map((x) => (
            <li key={x.id} className="lift">
              <article
                className={`flex h-full flex-col overflow-hidden rounded-2xl bg-white/70 ring-1 transition duration-300 hover:-translate-y-1 hover:shadow-[0_24px_40px_-24px_rgba(28,24,20,0.35)] focus-within:-translate-y-1 focus-within:shadow-[0_24px_40px_-24px_rgba(28,24,20,0.35)] ${x.id === flavor ? "ring-copper/60" : "ring-ink/10"}`}
              >
                <button onClick={() => setFlavor(x.id)} className="block overflow-hidden" aria-label={`Show ${x.full} in the hero`} tabIndex={-1}>
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  <img src={`/plates/shop/${x.id}.jpg`} alt={x.full} loading="lazy" decoding="async" width="814" height="1010" className="aspect-[4/3] w-full object-cover transition duration-700 hover:scale-[1.03]" />
                </button>
                <div className="flex flex-1 flex-col p-5">
                  <div className="flex items-center justify-between gap-3">
                    <Availability ok={x.available} />
                    <span className="text-xs text-ink/55">{x.serves} · {x.weight}</span>
                  </div>
                  <h3 className="mt-2 font-serif text-2xl leading-tight">{x.full}</h3>
                  <p className="mt-1.5 text-sm leading-relaxed text-ink/65">{x.note}</p>
                  <details className="mt-3 text-sm text-ink/70">
                    <summary className="flex min-h-10 cursor-pointer select-none items-center text-xs uppercase tracking-[0.2em] text-copper-deep">What's in it</summary>
                    <ol className="mt-2 space-y-1">
                      {[...x.layers].reverse().map((l) => (
                        <li key={l}>· {l}</li>
                      ))}
                    </ol>
                    <p className="mt-2 flex items-center gap-2 text-xs text-ink/50">Heat <Heat n={x.heat} /></p>
                  </details>
                  <div className="mt-auto flex items-center justify-between gap-3 pt-5">
                    <span className="text-xl font-semibold tabular-nums">{inr(x.price)}</span>
                    <AddControl x={x} qty={cart[x.id]} />
                  </div>
                </div>
              </article>
            </li>
          ))}
        </ul>

        <div className="mt-20 flex items-end justify-between gap-6">
          <h3 className="lift font-serif text-3xl sm:text-4xl">On the side</h3>
          <p className="text-sm text-ink/50">Optional add-ons</p>
        </div>
        <ul className="mt-6 grid gap-4 sm:grid-cols-3">
          {ADDONS.map((x) => (
            <li key={x.id} className="lift flex flex-col justify-between gap-4 rounded-2xl bg-white/70 p-5 ring-1 ring-ink/10 transition hover:-translate-y-0.5 focus-within:-translate-y-0.5">
              <div>
                <div className="flex items-baseline justify-between gap-3">
                  <span className="font-serif text-2xl">{x.full}</span>
                  <span className="font-semibold tabular-nums">{inr(x.price)}</span>
                </div>
                <p className="mt-1 text-sm text-ink/60">{x.note}</p>
                <p className="mt-2 text-xs text-ink/45">{x.weight}</p>
              </div>
              <AddControl x={x} qty={cart[x.id]} />
            </li>
          ))}
        </ul>
      </div>
    </section>
  );
}

// The header's cart button (page.jsx).
export function CartButton({ className = "" }) {
  const { cart, bump } = useShop();
  const { count } = totals(cart);
  return (
    <button onClick={() => setOpen(true)} className={`relative inline-flex min-h-11 items-center gap-2 text-sm font-medium transition hover:text-gold ${className}`} aria-label={`Cart, ${count} items`}>
      Cart
      <span key={bump} className={`inline-grid h-6 min-w-6 place-items-center rounded-full bg-saffron px-1.5 text-xs font-semibold tabular-nums text-ink ${bump ? "pop" : ""}`}>{count}</span>
    </button>
  );
}

// Mobile: Menu and Cart always one tap away, above the device's home indicator. The page reserves the same height
// at its foot (page.jsx), so this never covers content.
export function BottomBar() {
  const { cart, bump } = useShop();
  const { count, total } = totals(cart);
  return (
    <nav aria-label="Shop" className="fixed inset-x-0 bottom-0 z-40 border-t border-ivory/10 bg-leaf-deep/95 pb-[env(safe-area-inset-bottom)] text-ivory backdrop-blur md:hidden">
      <div className="grid h-16 grid-cols-2">
        <a href="#menu" className="grid place-items-center text-sm font-medium">
          Menu
        </a>
        <button onClick={() => setOpen(true)} className="flex items-center justify-center gap-2 border-l border-ivory/10 text-sm font-medium" aria-label={`Cart, ${count} items, ${inr(total)}`}>
          Cart
          <span key={bump} className={`inline-grid h-6 min-w-6 place-items-center rounded-full bg-saffron px-1.5 text-xs font-semibold tabular-nums text-ink ${bump ? "pop" : ""}`}>{count}</span>
          {count ? <span className="tabular-nums text-ivory/70">{inr(total)}</span> : null}
        </button>
      </div>
    </nav>
  );
}

// What delivery costs, as far as it is known: a fixed fee, or confirmed with the order.
const feeNote = DELIVERY_FEE == null ? "Delivery fee, if any, is confirmed with your order." : `Delivery fee: ${inr(DELIVERY_FEE)}.`;

const field = "mt-1 w-full rounded-lg border border-ink/15 bg-white/60 px-3.5 py-3 text-sm outline-none transition focus:border-ink";

function CartStep({ lines, total, cart }) {
  const missing = ADDONS.filter((a) => !cart[a.id] && a.available);
  return (
    <>
      {lines.length ? (
        <div className="flex-1 overflow-y-auto px-6">
          <ul className="divide-y divide-ink/10">
            {lines.map((l) => (
              <li key={l.id} className="flex gap-4 py-5">
                {dish(l.id) ? (
                  // eslint-disable-next-line @next/next/no-img-element
                  <img src={`/plates/shop/${l.id}.jpg`} alt="" className="h-20 w-16 shrink-0 object-cover" />
                ) : (
                  <span className="grid h-20 w-16 shrink-0 place-items-center bg-[#ece6db] font-serif text-xs text-ink/50">Side</span>
                )}
                <div className="flex-1">
                  <p className="font-serif text-lg leading-tight">{l.full}</p>
                  <p className="mt-1 text-xs text-ink/50">{l.serves ? `${l.serves} · ` : ""}{l.weight} · {inr(l.price)} each</p>
                  <div className="mt-3 flex items-center justify-between gap-3">
                    <Qty value={l.qty} onChange={(n) => setQty(l.id, n)} label={l.full} />
                    <span className="text-sm tabular-nums">{inr(l.price * l.qty)}</span>
                  </div>
                  <button onClick={() => setQty(l.id, 0)} className="mt-2 min-h-8 text-xs text-ink/50 underline underline-offset-2 hover:text-ink">
                    Remove
                  </button>
                </div>
              </li>
            ))}
          </ul>
          {missing.length > 0 && (
            <div className="border-t border-ink/10 py-5">
              <p className="text-[11px] uppercase tracking-[0.3em] text-ink/45">Add a side</p>
              <div className="mt-3 flex flex-wrap gap-2">
                {missing.map((a) => (
                  <button key={a.id} onClick={() => add(a.id)} className="min-h-10 rounded-full border border-ink/15 px-4 text-sm transition hover:border-ink">
                    + {a.full} · {inr(a.price)}
                  </button>
                ))}
              </div>
            </div>
          )}
        </div>
      ) : (
        <div className="grid flex-1 place-items-center px-6 text-center">
          <div>
            <p className="font-serif text-2xl">Your cart is empty.</p>
            <p className="mt-2 text-sm text-ink/55">Pick a biriyani and it will appear here.</p>
          </div>
        </div>
      )}
      <div className="border-t border-ink/10 px-6 py-6">
        <div className="flex items-baseline justify-between">
          <span className="text-sm text-ink/60">Items total</span>
          <span className="font-serif text-3xl tabular-nums">{inr(total)}</span>
        </div>
        <p className="mt-1 text-xs text-ink/50">Pickup has no delivery fee. {feeNote}</p>
        <button
          onClick={() => setStep("details")}
          disabled={!lines.length}
          className="mt-5 min-h-12 w-full rounded-full bg-ink text-sm font-medium tracking-wide text-paper transition hover:bg-copper-deep disabled:bg-ink/10 disabled:text-ink/40"
        >
          Continue to checkout
        </button>
      </div>
    </>
  );
}

function DetailsStep({ total, fulfil, draft }) {
  const [pinError, setPinError] = useState("");
  const onInput = (e) => {
    if (!e.target.name) return;
    setDraft({ [e.target.name]: e.target.value });
    if (e.target.name === "pin") setPinError("");
  };
  return (
    <form
      className="flex flex-1 flex-col overflow-hidden"
      onInput={onInput}
      onSubmit={(e) => {
        e.preventDefault();
        // Delivery-area check before the order goes anywhere.
        if (fulfil === "delivery" && pinStatus(draft.pin) === "out") {
          setPinError(`Sorry, we don't deliver to ${draft.pin.trim()} yet. Choose pickup, or a different address.`);
          e.currentTarget.elements.pin.focus();
          return;
        }
        placeOrder();
      }}
    >
      <div className="flex-1 space-y-5 overflow-y-auto px-6 py-5">
        <DemoNotice />
        <fieldset>
          <legend className="text-[11px] uppercase tracking-[0.3em] text-ink/45">Delivery or pickup</legend>
          <div role="radiogroup" aria-label="Delivery or pickup" className="mt-2 grid grid-cols-2 gap-2">
            {[["delivery", "Delivery"], ["pickup", "Pickup"]].map(([id, label]) => (
              <button
                key={id}
                type="button"
                role="radio"
                aria-checked={fulfil === id}
                onClick={() => setFulfil(id)}
                className={`min-h-12 rounded-lg border text-sm transition ${fulfil === id ? "border-ink bg-ink text-paper" : "border-ink/15 hover:border-ink/40"}`}
              >
                {label}
              </button>
            ))}
          </div>
        </fieldset>
        <label className="block text-sm">
          Name
          <input name="name" required autoComplete="name" defaultValue={draft.name} className={field} />
        </label>
        <label className="block text-sm">
          Phone
          <input name="phone" type="tel" required inputMode="tel" autoComplete="tel" pattern="[+0-9 ]{10,16}" title="10 to 15 digits" defaultValue={draft.phone} className={field} />
        </label>
        {fulfil === "delivery" ? (
          <>
            <label className="block text-sm">
              Delivery address
              <textarea name="address" required rows={3} autoComplete="street-address" defaultValue={draft.address} className={field} />
            </label>
            <label className="block text-sm">
              PIN code
              <input
                name="pin"
                required
                inputMode="numeric"
                autoComplete="postal-code"
                pattern="[0-9]{6}"
                maxLength={6}
                title="6-digit PIN code"
                defaultValue={draft.pin}
                aria-invalid={!!pinError}
                aria-describedby="pin-msg"
                className={`${field} max-w-40 ${pinError ? "border-red-700" : ""}`}
              />
              <span id="pin-msg" role={pinError ? "alert" : undefined} className={`mt-1 block text-xs ${pinError ? "text-red-800" : "text-ink/50"}`}>
                {pinError || "We check it against our delivery areas."}
              </span>
            </label>
            <label className="block text-sm">
              Landmark <span className="text-ink/40">(optional)</span>
              <input name="landmark" defaultValue={draft.landmark} className={field} />
            </label>
          </>
        ) : (
          <p className="rounded-lg bg-ink/5 px-4 py-3 text-sm text-ink/70">{PICKUP ? `Pickup from ${PICKUP}.` : "The pickup address and time are confirmed with your order."}</p>
        )}
        <label className="block text-sm">
          Notes <span className="text-ink/40">(optional)</span>
          <textarea name="notes" rows={2} defaultValue={draft.notes} className={field} />
        </label>
      </div>
      <div className="border-t border-ink/10 px-6 py-6">
        <div className="flex items-baseline justify-between">
          <span className="text-sm text-ink/60">Items total</span>
          <span className="font-serif text-3xl tabular-nums">{inr(total)}</span>
        </div>
        {fulfil === "delivery" && (
          <p className="mt-1 text-xs text-ink/50">
            {feeNote}
            {DELIVERY_FEE != null && ` Total ${inr(total + DELIVERY_FEE)}.`}
          </p>
        )}
        <div className="mt-5 flex gap-3">
          <button type="button" onClick={() => setStep("cart")} className="min-h-12 rounded-full border border-ink/20 px-5 text-sm transition hover:border-ink">
            Back
          </button>
          <button type="submit" className="min-h-12 flex-1 rounded-full bg-ink text-sm font-medium tracking-wide text-paper transition hover:bg-copper-deep">
            {WHATSAPP ? "Send order on WhatsApp" : "Place demo order"}
          </button>
        </div>
      </div>
    </form>
  );
}

function DoneStep({ order }) {
  return (
    <div className="flex flex-1 flex-col overflow-y-auto px-6 py-6">
      <p className="text-[11px] uppercase tracking-[0.3em] text-copper-deep">{order.sent ? "Order ready to send" : "Demo order confirmed"}</p>
      <h3 className="mt-2 font-serif text-3xl">Order {order.ref}</h3>
      <p className="mt-3 text-sm text-ink/65">
        {order.sent
          ? "WhatsApp opened with your order filled in. Send the message there to place it; the restaurant confirms the total and timing."
          : "This was a demo: no order was sent and no payment was taken."}
      </p>
      <pre className="mt-5 whitespace-pre-wrap rounded-lg bg-ink/5 p-4 font-sans text-sm leading-relaxed text-ink/80">{orderMessage(order)}</pre>
      {!order.sent && (
        <div className="mt-5 rounded-lg border border-copper/30 p-4 text-sm text-ink/70">
          <p className="font-semibold text-ink">To take real orders, connect:</p>
          <ul className="mt-2 list-disc space-y-1 pl-5">
            <li>The business WhatsApp number, or an ordering service that receives orders.</li>
            <li>A payment service (for example a UPI or card gateway) if orders are paid online.</li>
            <li>The real menu, portions, prices, availability and pickup address.</li>
          </ul>
        </div>
      )}
      <button onClick={() => setOpen(false)} className="mt-6 min-h-12 rounded-full bg-ink text-sm font-medium text-paper transition hover:bg-copper-deep">
        Done
      </button>
    </div>
  );
}

// Mounted at the page root (page.jsx) so it stacks above the fixed header.
export function Cart() {
  const { cart, open, step, fulfil, draft, order } = useShop();
  const { lines, total, count } = totals(cart);
  const panel = useRef();

  useEffect(() => {
    if (!open) return;
    const prev = document.activeElement;
    panel.current?.focus();
    const key = (e) => e.key === "Escape" && setOpen(false);
    addEventListener("keydown", key);
    return () => {
      removeEventListener("keydown", key);
      prev?.focus?.();
    };
  }, [open]);

  const title = step === "details" ? "Checkout" : step === "done" ? "Thank you" : <>Your cart <span className="text-ink/40">({count})</span></>;
  return (
    <div className={`fixed inset-0 z-50 ${open ? "" : "pointer-events-none"}`} aria-hidden={!open} inert={!open}>
      <div onClick={() => setOpen(false)} className={`absolute inset-0 bg-ink/40 backdrop-blur-[2px] transition-opacity duration-500 ${open ? "opacity-100" : "opacity-0"}`} />
      <aside
        ref={panel}
        tabIndex={-1}
        role="dialog"
        aria-modal="true"
        aria-label="Cart and checkout"
        className={`absolute inset-y-0 right-0 flex w-full max-w-md flex-col bg-paper text-ink shadow-2xl outline-none transition-transform duration-500 ease-[cubic-bezier(.2,.8,.2,1)] ${open ? "translate-x-0" : "translate-x-full"}`}
      >
        <div className="flex items-center justify-between border-b border-ink/10 px-6 py-5">
          <h2 className="font-serif text-2xl">{title}</h2>
          <button onClick={() => setOpen(false)} className="grid h-10 w-10 place-items-center rounded-full text-xl transition hover:bg-ink/5" aria-label="Close">
            ×
          </button>
        </div>
        {step === "done" && order ? <DoneStep order={order} /> : step === "details" && lines.length ? <DetailsStep total={total} fulfil={fulfil} draft={draft} /> : <CartStep lines={lines} total={total} cart={cart} />}
      </aside>
    </div>
  );
}
