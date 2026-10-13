"use client";

import { useEffect } from "react";
import gsap from "gsap";
import { ScrollTrigger } from "gsap/ScrollTrigger";

// Page-wide scroll motion, set up once (page.jsx): reveals (.lift), parallax ([data-speed]), image scaling
// ([data-zoom]), rising reveals ([data-rise]) and sections receding into the next ([data-recede]). Nothing under reduced motion.
export default function Motion() {
  useEffect(() => {
    gsap.registerPlugin(ScrollTrigger);
    // Text-driven heights (the opening on phones) change when the web fonts arrive: re-measure every trigger then.
    document.fonts?.ready.then(() => ScrollTrigger.refresh());
    if (matchMedia("(prefers-reduced-motion: reduce)").matches) return;
    const ctx = gsap.context(() => {
      // Headings and cards rise in, a few at a time. Opacity only (never visibility), so they stay focusable, and
      // anything that receives keyboard focus before it has scrolled in is revealed at once. Headings cut in from a
      // mask; everything else fades up. Inline styles are cleared afterwards so hover effects own the transform again.
      // A jump (anchor) fires every trigger it passes at once: those already above the viewport just appear, and only
      // what is on screen animates, with the stagger capped so nothing waits behind unseen elements.
      const show = (els) => {
        els = [].concat(els);
        const above = els.filter((el) => el.getBoundingClientRect().bottom < 0);
        if (above.length) gsap.set(above, { clearProps: "all" });
        const shown = els.filter((el) => !above.includes(el));
        if (shown.length) gsap.to(shown, { opacity: 1, y: 0, clipPath: "inset(0% 0% 0% 0%)", duration: 0.9, ease: "expo.out", stagger: Math.min(0.08, 0.4 / shown.length), overwrite: true, clearProps: "all" });
      };
      gsap.set(".lift", { opacity: 0, y: 34 });
      gsap.set("h2.lift", { opacity: 1, y: 48, clipPath: "inset(0% 0% 100% 0%)" });
      // Parallax: [data-speed] elements drift against the scroll (speed > 0 lags behind, < 0 runs ahead).
      gsap.utils.toArray("[data-speed]").forEach((el) =>
        gsap.fromTo(el, { y: () => -Number(el.dataset.speed) * 60 }, { y: () => Number(el.dataset.speed) * 60, ease: "none", scrollTrigger: { trigger: el, start: "top bottom", end: "bottom top", scrub: 0.6, invalidateOnRefresh: true } })
      );
      // Organic image scaling: [data-zoom] images ease from slightly close to rest as they cross the viewport.
      gsap.utils.toArray("[data-zoom]").forEach((el) =>
        gsap.fromTo(el, { scale: 1.12 }, { scale: 1, ease: "none", scrollTrigger: { trigger: el, start: "top bottom", end: "center 55%", scrub: 0.6 } })
      );
      // Section blending: [data-recede] content sinks back and dims as the next section scrolls over it.
      gsap.utils.toArray("[data-recede]").forEach((el) =>
        gsap.to(el, { scale: 0.94, opacity: 0.35, y: 60, ease: "none", scrollTrigger: { trigger: el, start: "bottom 85%", end: "bottom top", scrub: 0.6 } })
      );
      // Rise: [data-rise] frames open upward from their foot as they scroll in (Heritage.jsx).
      gsap.utils.toArray("[data-rise]").forEach((el) =>
        gsap.fromTo(el, { clipPath: "inset(100% 0% 0% 0% round 1rem)" }, { clipPath: "inset(0% 0% 0% 0% round 1rem)", ease: "none", scrollTrigger: { trigger: el, start: "top 95%", end: "top 55%", scrub: 0.6 } })
      );
      ScrollTrigger.batch(".lift", { start: "top 90%", once: true, onEnter: show });
      // Only for elements still hidden (their inline opacity is cleared once revealed): re-running it on a revealed card
      // would clip it to its box mid-click.
      const onFocus = (e) => {
        const el = e.target.closest?.(".lift");
        if (el?.style.opacity) show(el);
      };
      addEventListener("focusin", onFocus);
      return () => removeEventListener("focusin", onFocus);
    });
    return () => ctx.revert();
  }, []);
  return null;
}
