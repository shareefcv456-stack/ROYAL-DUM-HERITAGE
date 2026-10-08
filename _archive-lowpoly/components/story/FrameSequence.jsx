"use client";

import { useEffect, useRef } from "react";
import { FRAMES, frameUrl } from "./frames.mjs";

/**
 * Scroll-scrubbed playback of frames pre-rendered from the 3D scene.
 * Loads progressively (every 8th frame, then 4th, 2nd, all) so scrubbing works
 * within the first few hundred KB and sharpens as the rest arrive.
 */
export default function FrameSequence({ story, onReady }) {
  const canvas = useRef(null);

  useEffect(() => {
    const cv = canvas.current;
    const ctx = cv.getContext("2d");
    const imgs = new Array(FRAMES);
    let shown = -1, raf, alive = true;

    const load = (i) =>
      new Promise((done) => {
        const im = new Image();
        im.decoding = "async";
        im.onload = () => {
          if (alive) imgs[i] = im;
          done();
        };
        im.onerror = done;
        im.src = frameUrl(i);
      });

    (async () => {
      for (const step of [8, 4, 2, 1]) {
        const batch = [];
        for (let i = 0; i < FRAMES; i += step) if (!imgs[i]) batch.push(load(i));
        await Promise.all(batch);
        if (!alive) return;
        if (step === 8) onReady?.();
        shown = -1;
      }
    })();

    const resize = () => {
      const dpr = Math.min(devicePixelRatio, 2);
      cv.width = cv.clientWidth * dpr;
      cv.height = cv.clientHeight * dpr;
      shown = -1;
    };
    resize();
    addEventListener("resize", resize);

    const draw = () => {
      raf = requestAnimationFrame(draw);
      if (!story.onScreen) return;
      const want = Math.round((story.t / 4) * (FRAMES - 1));
      let i = -1;
      for (let d = 0; d < FRAMES && i < 0; d++) i = imgs[want - d] ? want - d : imgs[want + d] ? want + d : -1;
      if (i < 0 || i === shown) return;
      shown = i;
      const im = imgs[i];
      // object-fit: cover
      const s = Math.max(cv.width / im.width, cv.height / im.height);
      const w = im.width * s, h = im.height * s;
      ctx.drawImage(im, (cv.width - w) / 2, (cv.height - h) / 2, w, h);
    };
    raf = requestAnimationFrame(draw);

    return () => {
      alive = false;
      cancelAnimationFrame(raf);
      removeEventListener("resize", resize);
    };
  }, [story, onReady]);

  return <canvas ref={canvas} className="h-full w-full" />;
}
