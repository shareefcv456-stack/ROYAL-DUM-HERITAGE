// Add to cart, in slow motion: a round thumbnail of the dish is tossed from the button and drifts down into whichever
// cart counter is on screen ([data-cart-target]: the header's on desktop, the bottom bar's on phones). The path is
// real projectile motion: given the flight time and how high the arc should peak, gravity and launch speed are solved
// so it peaks on screen and lands exactly on the counter (arc()). Played linearly, so the physics is the easing;
// the counter (the cart bucket) then takes it with a soft scale-bounce (.catch). Web Animations on transform and
// opacity only, removed when done; nothing under reduced motion. Resolves once the dish has landed.
const LIFT = 150; // px the arc peaks above the higher of start and counter
const TOP = 12; // never peak closer than this to the top of the screen

// A ballistic arc from (0, 0) to (dx, dy) (screen axes, y down) that peaks at y = h (h ≤ min(0, dy)) after T seconds.
// From y = vy·t + ½g·t², apex −vy²/2g = h and y(T) = dy: √g = √2·(a + √(a² + dy)) / T with a = √−h (the root that
// lands after the peak, coming down into the counter).
export function arc(dx, dy, h, T) {
  const a = Math.sqrt(-h);
  const s = (Math.SQRT2 * (a + Math.sqrt(a * a + dy))) / T;
  const g = s * s, vy = -s * Math.SQRT2 * a, vx = dx / T;
  return (t) => [vx * t, vy * t + 0.5 * g * t * t, Math.atan2(vy + g * t, vx)];
}

export function flyToCart(from, src) {
  if (!from || matchMedia("(prefers-reduced-motion: reduce)").matches) return Promise.resolve();
  const target = [...document.querySelectorAll("[data-cart-target]")].find((el) => el.offsetParent !== null);
  if (!target) return Promise.resolve();
  const badge = target.querySelector("[data-count]") || target;
  const a = from.getBoundingClientRect();
  const b = badge.getBoundingClientRect();
  const size = 60;
  const dot = document.createElement(src ? "img" : "span");
  if (src) dot.src = src;
  Object.assign(dot.style, {
    position: "fixed",
    left: `${a.left + a.width / 2 - size / 2}px`,
    top: `${a.top + a.height / 2 - size / 2}px`,
    width: `${size}px`,
    height: `${size}px`,
    borderRadius: "50%",
    objectFit: "cover",
    background: "var(--color-paper)",
    boxShadow: "0 0 0 3px var(--color-paper), 0 18px 34px -12px rgba(28,24,20,0.55)",
    zIndex: "60",
    pointerEvents: "none",
  });
  document.body.appendChild(dot);
  const y0 = a.top + a.height / 2;
  const dx = b.left + b.width / 2 - (a.left + a.width / 2);
  // A bucket ([data-mouth]) takes the dish into its open top; anything else, at its centre.
  const dy = b.top + b.height * (badge.hasAttribute("data-mouth") ? 0.28 : 0.5) - y0;
  const peak = Math.max(TOP, Math.min(y0, y0 + dy) - LIFT); // on-screen y of the top of the arc
  const T = Math.min(1.8, Math.max(1.3, Math.hypot(dx, dy) / 700)); // slow motion: well over a second in the air
  const at = arc(dx, dy, Math.min(peak - y0, Math.min(0, dy)), T);
  const N = 48;
  const frames = Array.from({ length: N + 1 }, (_, i) => {
    const k = i / N;
    const [x, y, dir] = at(k * T);
    const tilt = ((dir * 180) / Math.PI) * 0.12; // leans a little into its direction of travel
    return {
      transform: `translate(${x.toFixed(1)}px, ${y.toFixed(1)}px) rotate(${tilt.toFixed(1)}deg) scale(${(1 - k * 0.74).toFixed(3)})`,
      opacity: k < 0.05 ? k / 0.05 : k > 0.94 ? (1 - k) / 0.06 : 1,
    };
  });
  // A saffron trail: thin strands dropped along the arc as the dish passes, each drifting down and fading out.
  const x0 = a.left + a.width / 2;
  for (let i = 1; i < 16; i++) {
    const t = (i / 16) * T * 0.92;
    const [x, y, dir] = at(t);
    const s = document.createElement("span");
    Object.assign(s.style, {
      position: "fixed", left: `${x0 + x - 6}px`, top: `${y0 + y - 1}px`, width: "12px", height: "2px", borderRadius: "2px",
      background: "linear-gradient(90deg, #c2261c, #e8693f 45%, #f7b48a)", zIndex: "59", pointerEvents: "none", opacity: "0",
    });
    document.body.appendChild(s);
    const r = (dir * 180) / Math.PI + (i % 2 ? 35 : -35);
    s.animate(
      [
        { opacity: 0, transform: `rotate(${r}deg)` },
        { opacity: 0.9, transform: `rotate(${r}deg)`, offset: 0.12 },
        { opacity: 0, transform: `translateY(${14 + (i % 3) * 6}px) rotate(${r + (i % 2 ? 40 : -40)}deg)` },
      ],
      { duration: 700, delay: t * 1000, easing: "ease-out", fill: "both" }
    ).finished.finally(() => s.remove());
  }
  return dot.animate(frames, { duration: T * 1000, easing: "linear" }).finished.then(
    () => {
      dot.remove();
      badge.classList.remove("catch");
      void badge.offsetWidth; // restarts the bounce on rapid adds
      badge.classList.add("catch");
    },
    () => dot.remove()
  );
}
