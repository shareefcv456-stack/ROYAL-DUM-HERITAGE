"use client";

import { useState } from "react";

// Square crops [x, y, size] of the studio spice sheet (1376×768), the same photographs that float in the background.
const SHEET = { src: "/plates/spices.jpg", w: 1376, h: 768 };
const SPICES = [
  {
    name: "Green Cardamom", local: "Elakka", crop: [130, 48, 140],
    origin: "Idukki, Western Ghats",
    note: "Bloomed whole in hot ghee at the very start, so every grain of rice carries its cool, floral perfume.",
  },
  {
    name: "Cloves", local: "Grambu", crop: [1136, 118, 120],
    origin: "Western Ghats, Kerala",
    note: "A few buds in the masala for depth and a faint numbing warmth; too many and they take over.",
  },
  {
    name: "Star Anise", local: "Thakkolam", crop: [125, 315, 200],
    origin: "Southern China & Vietnam",
    note: "One or two pods only. A quiet liquorice sweetness that rounds out the meat.",
  },
  {
    name: "Cinnamon", local: "Karuvapatta", crop: [695, 292, 180],
    origin: "Kerala & Sri Lanka",
    note: "Thin, papery bark that sweetens the oil and the marinade without any sugar.",
  },
  {
    name: "Saffron", local: "Kunkumapoovu", crop: [927, 455, 140],
    origin: "Pampore, Kashmir",
    note: "Steeped in warm milk and streaked over the top layer of rice just before the pot is sealed.",
  },
];

// CSS background that shows exactly one square crop of the sheet.
function cropStyle([x, y, size]) {
  return {
    backgroundImage: `url(${SHEET.src})`,
    backgroundSize: `${(SHEET.w / size) * 100}% auto`,
    backgroundPosition: `${(x / (SHEET.w - size)) * 100}% ${(y / (SHEET.h - size)) * 100}%`,
  };
}

export default function SpiceVault() {
  const [sel, setSel] = useState(0);
  const [tilt, setTilt] = useState({ x: 0, y: 0 });
  const s = SPICES[sel];

  const onMove = (e) => {
    const r = e.currentTarget.getBoundingClientRect();
    setTilt({ x: ((e.clientX - r.left) / r.width - 0.5) * 2, y: ((e.clientY - r.top) / r.height - 0.5) * 2 });
  };

  return (
    <section id="spice-vault" className="px-5 py-28 sm:px-10 md:py-36">
      <div className="mx-auto max-w-6xl">
        <p className="lift text-[11px] uppercase tracking-[0.35em] text-gold">The Spice Vault</p>
        <h2 className="lift mt-4 max-w-2xl font-serif text-5xl font-medium leading-[0.98] text-ivory sm:text-6xl">
          Five spices. <em className="text-saffron">Nothing ground in advance.</em>
        </h2>

        <div className="lift mt-14 grid gap-10 md:grid-cols-[1fr_1.1fr] md:items-center">
          <div
            className="relative mx-auto aspect-square w-full max-w-[300px]"
            onPointerMove={onMove}
            onPointerLeave={() => setTilt({ x: 0, y: 0 })}
          >
            <div className="absolute inset-[12%] rounded-full bg-saffron/15 blur-3xl" />
            <div
              role="img"
              aria-label={`${s.name}, macro photograph`}
              className="relative h-full w-full rounded-full transition-transform duration-500 ease-out [mask-image:radial-gradient(circle,#000_52%,transparent_70%)]"
              style={{ ...cropStyle(s.crop), transform: `perspective(800px) rotateY(${tilt.x * 10}deg) rotateX(${-tilt.y * 10}deg) scale(1.04)` }}
            />
          </div>

          <div>
            <p className="font-serif text-lg italic text-gold-soft">{s.local}</p>
            <h3 className="mt-1 font-serif text-4xl text-ivory">{s.name}</h3>
            <p className="mt-2 text-[11px] uppercase tracking-[0.3em] text-stone-400">{s.origin}</p>
            <p className="mt-6 max-w-md leading-relaxed text-stone-300">{s.note}</p>

            <div role="tablist" aria-label="Spices" className="mt-10 flex flex-wrap gap-3">
              {SPICES.map((x, i) => (
                <button
                  key={x.name}
                  role="tab"
                  aria-selected={i === sel}
                  aria-label={x.name}
                  onClick={() => setSel(i)}
                  className={`h-16 w-16 rounded-full border bg-charcoal transition duration-300 hover:scale-105 ${i === sel ? "border-gold shadow-[0_0_24px_rgba(212,175,55,0.35)]" : "border-white/10 opacity-70 hover:opacity-100"}`}
                  style={cropStyle(x.crop)}
                />
              ))}
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
