"use client";

import { useEffect, useState } from "react";
import { DISHES, setFlavor, useShop } from "./cart";

// Whether an element (a ref) is on screen. Starts false, so nothing animates before it has been seen.
export function useOnScreen(ref) {
  const [on, setOn] = useState(false);
  useEffect(() => {
    const io = new IntersectionObserver(([e]) => setOn(e.isIntersecting));
    io.observe(ref.current);
    return () => io.disconnect();
  }, [ref]);
  return on;
}

// Moves the selected flavour on to the next one every `ms` while `run` is true (on screen, not held, not paused).
// Any flavour change, from a tap or a swipe, restarts the count. Never runs under reduced motion.
export function useFlavorLoop(run, ms = 3500) {
  const { flavor } = useShop();
  useEffect(() => {
    if (!run || matchMedia("(prefers-reduced-motion: reduce)").matches) return;
    const id = setTimeout(() => setFlavor(DISHES[(DISHES.findIndex((x) => x.id === flavor) + 1) % DISHES.length].id), ms);
    return () => clearTimeout(id);
  }, [flavor, run, ms]);
}
