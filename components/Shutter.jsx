"use client";

import { usePathname, useRouter } from "next/navigation";
import { useEffect, useRef, useState } from "react";

// The page transition (layout.jsx), after the user's reference site: a click on a link to another page of the site
// raises a shutter over the page from below (deep terracotta, a warm ivory leaf just ahead of it), the route changes behind it
// (Next's client router), and once the new page has rendered the shutter carries on upward and away. Only real page changes
// trigger it: same-page hash links, new tabs, downloads and other sites are left alone, as are back/forward (the
// browser's own, instant). If the new page is slow to arrive, a small handi with rising steam and "Preparing your
// table" appear (an honest wait, no fake percentage). A failed or stuck navigation falls back to a normal page load
// after a few seconds, so the shutter can never stay down. Reduced motion: no shutter, just the navigation.
const COVER_MS = 520;
const SLOW_MS = 350; // show the waiting mark only if the page takes longer than this behind the shutter
const GIVE_UP_MS = 6000;

export default function Shutter() {
  const router = useRouter();
  const path = usePathname();
  const [phase, setPhase] = useState("idle"); // idle → cover → (wait) → reveal → idle
  const [slow, setSlow] = useState(false);
  const pending = useRef(null); // the URL we are going to while covered
  const timers = useRef([]);
  const later = (fn, ms) => timers.current.push(setTimeout(fn, ms));
  const clear = () => (timers.current.forEach(clearTimeout), (timers.current = []));

  useEffect(() => {
    const click = (e) => {
      if (e.defaultPrevented || e.button !== 0 || e.metaKey || e.ctrlKey || e.shiftKey || e.altKey) return;
      const a = e.target.closest?.("a[href]");
      if (!a || a.target === "_blank" || a.hasAttribute("download")) return;
      const url = new URL(a.href, location.href);
      if (url.origin !== location.origin || url.pathname === location.pathname) return; // another site, or this page
      e.preventDefault();
      const to = url.pathname + url.search + url.hash;
      if (matchMedia("(prefers-reduced-motion: reduce)").matches) return router.push(to);
      if (pending.current) return; // one transition at a time
      pending.current = to;
      router.prefetch(to);
      clear();
      setSlow(false);
      setPhase("cover");
      later(() => {
        router.push(to);
        later(() => setSlow(true), SLOW_MS);
        // Stuck? Load the page the ordinary way.
        later(() => pending.current && (location.href = pending.current), GIVE_UP_MS);
      }, COVER_MS);
    };
    document.addEventListener("click", click);
    return () => (document.removeEventListener("click", click), clear());
  }, [router]);

  // The new route has rendered: lift the shutter (after two frames, so its first paint is on screen beneath).
  useEffect(() => {
    if (!pending.current) return;
    pending.current = null;
    clear();
    const r = requestAnimationFrame(() =>
      requestAnimationFrame(() => {
        setPhase("reveal");
        later(() => (setPhase("idle"), setSlow(false)), 900);
      })
    );
    return () => cancelAnimationFrame(r);
  }, [path]);

  return (
    <div aria-hidden={phase === "idle"} className={`shutter pointer-events-none fixed inset-0 z-[70] ${phase === "idle" ? "invisible" : ""}`} data-phase={phase}>
      <div className="shutter-leaf absolute inset-0 bg-ivory" />
      <div className="shutter-main absolute inset-0 grid place-items-center bg-terracotta text-ivory">
        <div className={`flex flex-col items-center transition-opacity duration-300 ${slow && phase === "cover" ? "opacity-100" : "opacity-0"}`} role={slow ? "status" : undefined}>
          <svg viewBox="0 0 64 64" className="h-14 w-14" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <path className="shutter-steam" d="M26 20q-4-5 0-10t0-8M34 18q-4-5 0-10t0-8M42 20q-4-5 0-10t0-8" />
            <path d="M14 34h40M18 34c0 12 6 20 18 20s18-8 18-20M24 30q12-6 24 0M34 26v-2" />
          </svg>
          <p className="mt-3 font-serif text-lg italic text-apricot">Preparing your table</p>
        </div>
      </div>
    </div>
  );
}
