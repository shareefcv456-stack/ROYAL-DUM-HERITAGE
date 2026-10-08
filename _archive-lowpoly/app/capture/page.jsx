"use client";

import dynamic from "next/dynamic";
import { notFound } from "next/navigation";
import { useEffect, useMemo } from "react";
import { buildTimeline, createStory } from "@/components/story/timeline";

const Scene = dynamic(() => import("@/components/story/Scene"), { ssr: false });

// Dev-only: renders the bare 3D scene for scripts/capture-frames.mjs.
export default function Capture() {
  if (process.env.NODE_ENV === "production") notFound();
  const story = useMemo(createStory, []);
  useEffect(() => {
    const tl = buildTimeline(story);
    window.__story = story;
    window.__seek = (p) => void tl.progress(p);
  }, [story]);
  return (
    <div style={{ position: "fixed", inset: 0 }}>
      <Scene story={story} tier="high" capture />
    </div>
  );
}
