"use client";

import { useEffect, useRef, useState } from "react";
import { WHATSAPP, dish, setOpen, useShop } from "./cart";

// "It's Biriyani O'Clock": a silver alarm clock whose face is the selected biriyani, with a knife and fork for hands
// showing the visitor's real time. It shakes in short bursts with sound waves either side (only while on screen,
// never under reduced motion), rings on click, and leads to a WhatsApp order.
// Every SVG coordinate below is an integer or a constant string, so server and client markup always match.

const TICKS = Array.from({ length: 60 }, (_, i) => i);
const HOURS = Array.from({ length: 12 }, (_, i) => i);
const MESSAGE = "Hello Royal Dum Heritage, I'd like to order biriyani.";

export default function Clock() {
  const { flavor } = useShop();
  const d = dish(flavor);
  const root = useRef(null);
  // 10:10 until mounted (the classic clock-face pose); the real time only exists in the browser.
  const [time, setTime] = useState(null);
  const [ringing, setRinging] = useState(false);
  const [onScreen, setOnScreen] = useState(false);

  useEffect(() => {
    const tick = () => setTime(new Date());
    tick();
    const id = setInterval(tick, 15000);
    const io = new IntersectionObserver(([e]) => setOnScreen(e.isIntersecting));
    io.observe(root.current);
    return () => (clearInterval(id), io.disconnect());
  }, []);
  useEffect(() => {
    if (!ringing) return;
    const id = setTimeout(() => setRinging(false), 1600);
    return () => clearTimeout(id);
  }, [ringing]);

  const m = time ? time.getMinutes() : 10;
  const h = time ? time.getHours() % 12 : 10;
  const minute = m * 6;
  const hour = h * 30 + m * 0.5;
  const motion = ringing ? "alarm-ring" : onScreen ? "alarm-idle" : "";

  return (
    <section ref={root} id="oclock" aria-labelledby="oclock-title" className="relative z-10 overflow-hidden bg-[linear-gradient(115deg,#2c080c_0%,#5f1018_48%,#2c080c_100%)] px-5 py-24 text-ivory sm:px-10 xl:px-16">
      {/* Soft diagonal light, as in a studio poster. */}
      <div aria-hidden className="pointer-events-none absolute inset-0 bg-[linear-gradient(115deg,transparent_30%,rgba(255,255,255,0.06)_42%,transparent_54%)]" />
      <div className="relative mx-auto grid max-w-7xl items-center gap-12 md:grid-cols-2">
        <div className="order-2 md:order-1">
          <p className="lift text-[11px] uppercase tracking-[0.35em] text-gold">Order now</p>
          <h2 id="oclock-title" className="lift mt-3 font-serif text-6xl font-medium leading-[0.95] sm:text-7xl">
            It&rsquo;s Biriyani <em className="block text-saffron">O&rsquo;Clock.</em>
          </h2>
          <p className="lift mt-5 max-w-md text-lg text-ivory/80">
            {time ? `${time.toLocaleTimeString([], { hour: "numeric", minute: "2-digit" })} here, and ` : ""}
            the {d.full} is on the clock face.
          </p>
          <div className="lift mt-8 flex flex-wrap items-center gap-3">
            {WHATSAPP ? (
              <a
                href={`https://wa.me/${WHATSAPP}?text=${encodeURIComponent(MESSAGE)}`}
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex min-h-12 items-center gap-2 rounded-full bg-[#25d366] px-7 text-sm font-semibold text-[#0b2a17] transition hover:brightness-110"
              >
                Order on WhatsApp
              </a>
            ) : (
              <button onClick={() => setOpen(true)} className="inline-flex min-h-12 items-center rounded-full bg-saffron px-7 text-sm font-semibold text-ink transition hover:bg-gold-soft">
                Order now
              </button>
            )}
            <a href="#menu" className="inline-flex min-h-12 items-center rounded-full border border-ivory/35 px-7 text-sm font-semibold transition hover:border-gold hover:text-gold">
              See the menu
            </a>
          </div>
          {!WHATSAPP && <p className="mt-3 text-xs text-ivory/55">WhatsApp ordering goes live once the restaurant&rsquo;s number is added; for now this opens your cart.</p>}
        </div>

        <button
          onClick={() => setRinging(true)}
          aria-label="Ring the biriyani alarm"
          className="order-1 mx-auto w-full max-w-[min(86vw,440px)] rounded-[2rem] md:order-2"
        >
          <svg viewBox="0 0 400 440" className="h-auto w-full overflow-visible" role="img" aria-label={`An alarm clock whose face is ${d.full}`}>
            <defs>
              <linearGradient id="silver" x1="0" y1="0" x2="1" y2="1">
                <stop offset="0" stopColor="#fbfbfa" />
                <stop offset="0.45" stopColor="#c9cdd1" />
                <stop offset="0.7" stopColor="#8b9298" />
                <stop offset="1" stopColor="#eef0f1" />
              </linearGradient>
              <radialGradient id="dome" cx="0.35" cy="0.3" r="0.8">
                <stop offset="0" stopColor="#ffffff" />
                <stop offset="0.6" stopColor="#cfd3d7" />
                <stop offset="1" stopColor="#7d848a" />
              </radialGradient>
              <clipPath id="face">
                <circle cx="200" cy="250" r="122" />
              </clipPath>
              <filter id="drop" x="-20%" y="-20%" width="140%" height="140%">
                <feDropShadow dx="0" dy="18" stdDeviation="16" floodColor="#000" floodOpacity="0.45" />
              </filter>
            </defs>

            {/* Sound waves either side. */}
            <g className={`alarm-waves ${motion}`} fill="none" stroke="#f5efe2" strokeLinecap="round" strokeWidth="8" opacity="0.85">
              <path d="M44 186 A110 110 0 0 0 44 314" />
              <path d="M14 166 A140 140 0 0 0 14 334" opacity="0.6" />
              <path d="M356 186 A110 110 0 0 1 356 314" />
              <path d="M386 166 A140 140 0 0 1 386 334" opacity="0.6" />
            </g>

            <g className={`alarm-body ${motion}`} filter="url(#drop)">
              {/* Feet, handle and bells. */}
              <path d="M128 372 L100 416 M272 372 L300 416" stroke="url(#silver)" strokeWidth="14" strokeLinecap="round" />
              <path d="M150 104 Q200 58 250 104" fill="none" stroke="url(#silver)" strokeWidth="9" strokeLinecap="round" />
              <g transform="rotate(-30 118 112)">
                <path d="M66 128 A52 52 0 0 1 170 128 Z" fill="url(#dome)" />
                <rect x="110" y="68" width="16" height="12" rx="3" fill="url(#silver)" />
              </g>
              <g transform="rotate(30 282 112)">
                <path d="M230 128 A52 52 0 0 1 334 128 Z" fill="url(#dome)" />
                <rect x="274" y="68" width="16" height="12" rx="3" fill="url(#silver)" />
              </g>
              {/* Case, bezel and the biriyani face. */}
              <circle cx="200" cy="250" r="150" fill="url(#silver)" />
              <circle cx="200" cy="250" r="134" fill="#e8eaec" />
              <image href={`/plates/dish/${d.id}.webp`} x="78" y="128" width="244" height="244" clipPath="url(#face)" preserveAspectRatio="xMidYMid slice" />
              <circle cx="200" cy="250" r="122" fill="none" stroke="#000" strokeOpacity="0.25" strokeWidth="6" />
              {TICKS.map((i) => (
                <line key={i} x1="200" y1="132" x2="200" y2={i % 5 ? 139 : 146} stroke="#fff" strokeOpacity={i % 5 ? 0.6 : 0.95} strokeWidth={i % 5 ? 2 : 4} transform={`rotate(${i * 6} 200 250)`} />
              ))}
              {HOURS.map((i) => (
                <g key={i} transform={`rotate(${i * 30} 200 250)`}>
                  <text x="200" y="172" transform={`rotate(${-i * 30} 200 162)`} textAnchor="middle" className="font-sans" fontSize="22" fontWeight="700" fill="#fff" stroke="#000" strokeOpacity="0.35" strokeWidth="1" paintOrder="stroke">
                    {i || 12}
                  </text>
                </g>
              ))}
              {/* Hands: a knife for the hours, a fork for the minutes. */}
              <g transform={`rotate(${hour} 200 250)`} className="transition-transform duration-700">
                <path d="M196 262 L196 190 Q200 168 205 190 L204 262 Z" fill="url(#silver)" stroke="#6b7177" strokeWidth="1" />
              </g>
              <g transform={`rotate(${minute} 200 250)`} className="transition-transform duration-700">
                <rect x="197" y="182" width="6" height="80" rx="3" fill="url(#silver)" stroke="#6b7177" strokeWidth="1" />
                <path d="M190 186 L190 152 M196.5 186 L196.5 148 M203.5 186 L203.5 148 M210 186 L210 152 M190 184 Q200 196 210 184" fill="none" stroke="#dfe2e5" strokeWidth="3" strokeLinecap="round" />
              </g>
              <circle cx="200" cy="250" r="9" fill="url(#silver)" stroke="#6b7177" />
            </g>
          </svg>
        </button>
      </div>
    </section>
  );
}
