// Small culinary line icons, drawn to one grid (24px, 1.6 stroke, currentColor) so they sit with the type.
const Svg = ({ children, className = "h-4 w-4", style, label }) => (
  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round" className={className} style={style} role={label ? "img" : undefined} aria-label={label} aria-hidden={label ? undefined : true}>
    {children}
  </svg>
);

export const Chili = (p) => (
  <Svg {...p}>
    <path d="M14.5 6.5c2.8.4 4.5 2.6 4.2 5.6-.5 4.9-6 8.6-12.7 8.4 4.3-1.9 6.4-4.5 6.6-8.2.1-2.7.6-4.6 1.9-5.8Z" />
    <path d="M14.5 6.5c.1-1.6.9-2.8 2.3-3.5" />
  </Svg>
);
export const Bowl = (p) => (
  <Svg {...p}>
    <path d="M3 11h18a9 9 0 0 1-18 0Z" />
    <path d="M8 8c1-1.5 2.5-2.2 4-2.2S15 6.5 16 8" />
  </Svg>
);
export const Scale = (p) => (
  <Svg {...p}>
    <path d="M5 8h14l-1.5 12h-11Z" />
    <path d="M9 8a3 3 0 0 1 6 0" />
  </Svg>
);
export const Scooter = (p) => (
  <Svg {...p}>
    <circle cx="6" cy="17" r="2.5" />
    <circle cx="18" cy="17" r="2.5" />
    <path d="M8.5 17h7M15 7h2l2.5 7.5M13 12h-6l-1.5 2.5M12 7.5h3" />
  </Svg>
);
export const Bag = (p) => (
  <Svg {...p}>
    <path d="M5 8h14l-1 12H6Z" />
    <path d="M9 8V6.5a3 3 0 0 1 6 0V8" />
  </Svg>
);
export const Pot = (p) => (
  <Svg {...p}>
    <path d="M4 10h16v3a8 8 0 0 1-16 0Z" />
    <path d="M6 10a6 3 0 0 1 12 0M12 5.5v1.5M2.5 11.5H4M20 11.5h1.5" />
  </Svg>
);
export const Tag = (p) => (
  <Svg {...p}>
    <path d="M3.5 12.5 12 4h7.5v7.5L11 20Z" />
    <circle cx="15.5" cy="8" r="1.3" />
  </Svg>
);

export const Rice = (p) => (
  <Svg {...p}>
    <path d="M12 3c2 3 2 6 0 9-2-3-2-6 0-9ZM6.5 8c2.6 1.7 3.4 4.4 2.2 7.4-2.6-1.7-3.4-4.4-2.2-7.4ZM17.5 8c1.2 3 .4 5.7-2.2 7.4-1.2-3-.4-5.7 2.2-7.4Z" />
    <path d="M12 12v9" />
  </Svg>
);
export const Mortar = (p) => (
  <Svg {...p}>
    <path d="M4 12h16a8 7 0 0 1-16 0Z" />
    <path d="M13 12 19 3.5M9 20h6" />
  </Svg>
);
export const Flame = (p) => (
  <Svg {...p}>
    <path d="M12 3c3 4 6 6.5 6 10.5A6 6 0 0 1 6 13.5c0-2.4 1.2-4 2.6-5.3.2 2 1 3.2 2.4 3.8C10.6 9 11 6 12 3Z" />
  </Svg>
);
export const Door = (p) => (
  <Svg {...p}>
    <path d="M6 21V4h12v17M3 21h18" />
    <circle cx="14.5" cy="13" r=".8" />
  </Svg>
);
export const FEATURE_ICON = { rice: Rice, masala: Mortar, fire: Flame };

// Heat as chillies: filled up to n of 4, crimson by default (`on` recolours them for a crimson background).
export function Heat({ n, className = "", on = "text-[#c0313a]" }) {
  return (
    <span className={`inline-flex items-center gap-0.5 ${className}`} role="img" aria-label={`Heat ${n} of 4`}>
      {[0, 1, 2, 3].map((i) => (
        <Chili key={i} className={`h-3.5 w-3.5 ${i < n ? on : "text-current opacity-25"}`} />
      ))}
    </span>
  );
}

// A price, set like a menu card: a small raised rupee sign, lining tabular figures, an optional struck-through
// original (`was`, only for a real discount) and a quiet unit ("per handi").
export function Price({ value, was, unit, className = "" }) {
  const n = (v) => v.toLocaleString("en-IN");
  return (
    <span className={`inline-flex items-baseline gap-2 ${className}`}>
      <span className="font-semibold tabular-nums tracking-tight">
        <span className="mr-0.5 align-[0.4em] text-[0.55em] font-medium opacity-75">₹</span>
        {n(value)}
      </span>
      {was > value && (
        <s className="text-[0.5em] font-medium tabular-nums opacity-55">
          <span className="sr-only">was </span>₹{n(was)}
        </s>
      )}
      {unit && <span className="text-[0.42em] font-medium uppercase tracking-[0.2em] opacity-60">{unit}</span>}
    </span>
  );
}

// The price seal: a round amber badge, as on a menu poster ("PRICE ₹349"). Holds still; the dish carries the motion.
export function PriceBadge({ value, was, label = "Price", className = "" }) {
  return (
    <span className={`grid aspect-square place-items-center rounded-full bg-amber text-ink shadow-[0_12px_26px_-12px_rgba(0,0,0,0.55)] ${className}`}>
      <span className="flex flex-col items-center leading-none">
        <span className="text-[9px] font-semibold uppercase tracking-[0.25em] opacity-70">{label}</span>
        <Price value={value} className="mt-1 text-2xl" />
        {was > value && (
          <s className="mt-0.5 text-[10px] font-medium tabular-nums opacity-60">
            <span className="sr-only">was </span>₹{was.toLocaleString("en-IN")}
          </s>
        )}
      </span>
    </span>
  );
}

// The cart counter as a biriyani bucket (Shop.jsx CartButton, BottomBar): coral with white stripes, the count on its
// round label, and a heap of biriyani that rises over the rim once something is in it (higher as the cart fills).
// It is the fly-to-cart target ([data-count]); `data-mouth` makes the dish drop into its open top, not its middle.
export function Bucket({ count }) {
  const heap = Math.min(count, 8) / 8; // 0–1
  return (
    <span data-count data-mouth className="relative inline-block h-10 w-10" aria-hidden>
      <svg viewBox="0 0 40 44" className="h-full w-full overflow-visible">
        {count > 0 && (
          <g style={{ transform: `translateY(${(1 - heap) * 4}px)`, transition: "transform 0.5s cubic-bezier(.2,.8,.2,1)" }}>
            <path d="M7 14c1-8 25-8 26 0Z" fill="#e8b450" />
            <path d="M12 10.5h2M18 8.6h2.4M25 10h2M15 12.6h2M22 12.4h2.2" stroke="#fff6dc" strokeWidth="1.3" strokeLinecap="round" />
            <circle cx="22" cy="9.2" r="1.6" fill="#a54a21" />
            <path d="M13 8.6c1.4-1.6 2.8-1.6 3.6 0" stroke="#5f8f45" strokeWidth="1.4" fill="none" strokeLinecap="round" />
          </g>
        )}
        <path d="M5.5 14h29l-3.8 25.4a3 3 0 0 1-3 2.6H12.3a3 3 0 0 1-3-2.6Z" fill="var(--color-crimson)" />
        <path d="M13.2 14l1.6 28M26.8 14l-1.6 28" stroke="#fff" strokeOpacity=".85" strokeWidth="2.6" />
        <rect x="4" y="12" width="32" height="4.4" rx="2.2" fill="var(--color-crimson-deep)" />
        <circle cx="20" cy="28" r="7.6" fill="var(--color-ivory)" />
        <text x="20" y="31.4" textAnchor="middle" fontSize={count > 99 ? 6.5 : 9.5} fontWeight="800" fill="var(--color-crimson)" fontFamily="var(--font-sans)">
          {count}
        </text>
      </svg>
    </span>
  );
}
