"use client";

import { useState } from "react";

const SPICES = [
  { name: "Kashmiri Saffron", origin: "Pampore, Kashmir", hue: "#e8541e", heat: 0, aroma: 5, role: "Bloomed in warm milk and streaked through the top layer of rice.", note: "Hand-picked Mongra threads, three stigmas per crocus, dried over embers." },
  { name: "Green Cardamom", origin: "Idukki, Kerala", hue: "#8fa84a", heat: 1, aroma: 5, role: "Cracked into the ghee before the meat goes in.", note: "8mm bold pods from the Cardamom Hills, shade-grown and sun-cured." },
  { name: "Ceylon Cinnamon", origin: "Southern Sri Lanka", hue: "#c58a52", heat: 1, aroma: 4, role: "Quills simmered with the rice to give it a gentle sweetness.", note: "Paper-thin inner bark, rolled by hand into soft multi-layer quills." },
  { name: "Cloves", origin: "Kanyakumari, Tamil Nadu", hue: "#5b2e1c", heat: 3, aroma: 4, role: "Tempered whole to give the masala its warm, numbing base.", note: "Unopened buds harvested pink and dried until they turn deep brown." },
  { name: "Star Anise", origin: "Arunachal Pradesh", hue: "#7a3b22", heat: 1, aroma: 4, role: "One star per handi, so its liquorice note stays in the background.", note: "Eight-pointed pods from the eastern Himalayan foothills." },
  { name: "Shahi Jeera", origin: "Kinnaur, Himachal", hue: "#3d2b1f", heat: 2, aroma: 3, role: "Black cumin crackled in ghee, the signature of the Mughal kitchen.", note: "Wild-grown, slimmer and sweeter than common cumin." },
  { name: "Kewra Water", origin: "Kannauj, Uttar Pradesh", hue: "#cfe3c4", heat: 0, aroma: 5, role: "Sprinkled over the layers just before the dough seal goes on.", note: "Screw-pine flowers distilled in copper deg-bhapka stills." },
  { name: "Aged Basmati", origin: "Dehradun foothills", hue: "#f3ead6", heat: 0, aroma: 3, role: "Each grain stretches to nearly twice its length without breaking.", note: "Aged for two years so it absorbs stock without turning sticky." },
];

function Meter({ label, value }) {
  return (
    <div>
      <div className="mb-1.5 flex justify-between text-xs uppercase tracking-[0.2em] text-stone-400">
        <span>{label}</span>
        <span>{value}/5</span>
      </div>
      <div className="h-1.5 overflow-hidden rounded-full bg-white/10">
        <div className="h-full rounded-full bg-gradient-to-r from-gold/60 to-gold transition-[width] duration-700 ease-out" style={{ width: `${value * 20}%` }} />
      </div>
    </div>
  );
}

const orb = (hue) => ({ background: `radial-gradient(circle at 32% 30%, #fff8, ${hue} 45%, #0008 100%)` });

export default function SpiceVault() {
  const [active, setActive] = useState(0);
  const s = SPICES[active];

  return (
    <section id="vault" className="mx-auto max-w-6xl px-4 py-24 sm:px-8 md:py-32">
      <p className="text-xs uppercase tracking-[0.3em] text-gold">The Spice Vault</p>
      <h2 className="mt-3 max-w-xl font-serif text-4xl font-semibold leading-tight sm:text-5xl">
        Eight ingredients. <span className="gold-text italic">Sourced at origin.</span>
      </h2>

      <div className="mt-12 grid gap-6 lg:grid-cols-[1fr_1.05fr]">
        <div className="grid grid-cols-2 gap-3 sm:grid-cols-4 lg:grid-cols-2" role="tablist" aria-label="Spices">
          {SPICES.map((sp, i) => (
            <button
              key={sp.name}
              role="tab"
              aria-selected={i === active}
              aria-controls="spice-panel"
              onClick={() => setActive(i)}
              className={`glass group flex items-center gap-3 rounded-xl p-3 text-left transition duration-300 hover:-translate-y-0.5 hover:border-gold/50 focus-visible:outline-2 focus-visible:outline-gold ${i === active ? "border-gold/70! bg-gold/10" : ""}`}
            >
              <span className="h-9 w-9 shrink-0 rounded-full transition-transform duration-500 group-hover:scale-110" style={orb(sp.hue)} />
              <span className="text-sm leading-tight text-stone-200">{sp.name}</span>
            </button>
          ))}
        </div>

        <div id="spice-panel" role="tabpanel" className="glass relative overflow-hidden rounded-2xl p-7 sm:p-10">
          <div className="absolute -right-16 -top-16 h-56 w-56 rounded-full opacity-40 blur-2xl transition-colors duration-700" style={{ background: s.hue }} />
          <div key={s.name} className="relative animate-[fade_0.5s_ease-out]">
            <div className="h-20 w-20 rounded-full shadow-[0_20px_50px_-10px_rgba(212,175,55,0.5)]" style={orb(s.hue)} />
            <h3 className="mt-6 font-serif text-4xl font-semibold text-gold-soft">{s.name}</h3>
            <p className="mt-1 text-xs uppercase tracking-[0.25em] text-stone-400">{s.origin}</p>
            <p className="mt-5 leading-relaxed text-stone-300">{s.note}</p>
            <p className="mt-3 font-serif text-lg italic text-stone-200">“{s.role}”</p>
            <div className="mt-8 grid gap-4 sm:grid-cols-2">
              <Meter label="Aroma" value={s.aroma} />
              <Meter label="Heat" value={s.heat} />
            </div>
          </div>
        </div>
      </div>
      <style>{`@keyframes fade{from{opacity:0;transform:translateY(8px)}to{opacity:1;transform:none}}`}</style>
    </section>
  );
}
