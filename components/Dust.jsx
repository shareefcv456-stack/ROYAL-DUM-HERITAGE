"use client";

import { useEffect, useRef } from "react";

// Saffron dust: a few dozen warm motes rising and swaying, drawn from one pre-rendered glow sprite on a canvas that
// fills its parent. `light`: for pale grounds (Delivery), deeper saffron drawn normally instead of glowing additively
// as on dark ones (the hero). Runs only while `run`; nothing under reduced motion.
export default function Dust({ run, light = false, count = 46 }) {
  const ref = useRef(null);
  const live = useRef(run);
  live.current = run;
  useEffect(() => {
    if (matchMedia("(prefers-reduced-motion: reduce)").matches) return;
    const c = ref.current, g = c.getContext("2d");
    const sprite = document.createElement("canvas");
    sprite.width = sprite.height = 32;
    const s = sprite.getContext("2d"), gr = s.createRadialGradient(16, 16, 0, 16, 16, 16);
    const [core, mid, edge] = light ? ["rgba(214,120,40,1)", "rgba(232,140,60,0.5)", "rgba(232,140,60,0)"] : ["rgba(255,214,150,1)", "rgba(244,177,90,0.55)", "rgba(244,140,60,0)"];
    gr.addColorStop(0, core);
    gr.addColorStop(0.35, mid);
    gr.addColorStop(1, edge);
    s.fillStyle = gr;
    s.fillRect(0, 0, 32, 32);
    let w = 0, h = 0, raf = 0, last = performance.now();
    const dpr = Math.min(devicePixelRatio, 2);
    const fit = () => {
      w = c.clientWidth;
      h = c.clientHeight;
      c.width = w * dpr;
      c.height = h * dpr;
      g.setTransform(dpr, 0, 0, dpr, 0, 0);
    };
    const ro = new ResizeObserver(fit);
    ro.observe(c);
    fit();
    const motes = Array.from({ length: count }, () => ({ x: Math.random(), y: Math.random(), r: 1.5 + Math.random() * 4.5, v: 8 + Math.random() * 22, p: Math.random() * 6.28, a: 0.25 + Math.random() * 0.6 }));
    const tick = (now) => {
      raf = requestAnimationFrame(tick);
      const dt = Math.min((now - last) / 1000, 0.05);
      last = now;
      if (!live.current) return;
      g.clearRect(0, 0, w, h);
      g.globalCompositeOperation = light ? "source-over" : "lighter";
      for (const m of motes) {
        m.y -= (m.v * dt) / h;
        if (m.y < -0.05) (m.y = 1.05), (m.x = Math.random());
        const x = m.x * w + Math.sin(now / 1400 + m.p) * 14, y = m.y * h;
        g.globalAlpha = m.a * (light ? 0.6 : 1) * (0.7 + 0.3 * Math.sin(now / 500 + m.p)) * Math.min(1, Math.max(0, m.y * 3));
        g.drawImage(sprite, x - m.r * 2, y - m.r * 2, m.r * 4, m.r * 4);
      }
    };
    raf = requestAnimationFrame(tick);
    return () => (cancelAnimationFrame(raf), ro.disconnect());
  }, [light, count]);
  return <canvas ref={ref} aria-hidden className="pointer-events-none absolute inset-0 h-full w-full" />;
}
