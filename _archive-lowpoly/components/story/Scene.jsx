"use client";

import { Canvas, useFrame, useThree } from "@react-three/fiber";
import { useEffect, useMemo, useRef, useState } from "react";
import * as THREE from "three";
import { RoomEnvironment } from "three/examples/jsm/environments/RoomEnvironment.js";
import { DumChapter, MeatChapter, SpiceChapter } from "./chapters";

const { damp } = THREE.MathUtils;
const idle = (cb) => (window.requestIdleCallback ? requestIdleCallback(cb, { timeout: 600 }) : setTimeout(cb, 80));
const cancelIdle = (id) => (window.cancelIdleCallback ? cancelIdleCallback(id) : clearTimeout(id));

function Environment() {
  const { gl, scene } = useThree();
  useEffect(() => {
    const pmrem = new THREE.PMREMGenerator(gl);
    const env = pmrem.fromScene(new RoomEnvironment(), 0.04).texture;
    scene.environment = env;
    scene.environmentIntensity = 0.28;
    return () => {
      scene.environment = null;
      env.dispose();
      pmrem.dispose();
    };
  }, [gl, scene]);
  return null;
}

// Drives rendering itself (frameloop="never"): at most `fps` frames a second, and only while
// the story is on screen. advance() renders synchronously; invalidate() would let R3F's demand
// loop swallow every other request and halve the frame rate.
function FrameCap({ fps, story }) {
  const advance = useThree((s) => s.advance);
  useEffect(() => {
    const step = 1000 / fps;
    let last = 0;
    let id = requestAnimationFrame(function loop(t) {
      id = requestAnimationFrame(loop);
      // 20% tolerance so vsync jitter doesn't drop frames, and 120Hz screens get every 2nd frame.
      if (!story.onScreen || t - last < step * 0.8) return;
      last = t;
      advance(t / 1000, true);
    });
    return () => cancelAnimationFrame(id);
  }, [fps, story, advance]);
  return null;
}

// Watches real frame rate: steps resolution down first, then bails out to the frame sequence.
function PerfGuard({ cap, onFail }) {
  const acc = useRef({ n: 0, sum: 0, strikes: 0, warm: 0 });
  useFrame((state, dt) => {
    const a = acc.current;
    if (dt > 0.25) return; // tab switch / scrolled away
    a.n++;
    a.sum += dt;
    if (a.n < 60) return;
    const fps = a.n / a.sum;
    a.n = a.sum = 0;
    if (a.warm++ < 1) return; // first window includes shader compile
    const dpr = state.viewport.dpr;
    if (fps < cap * 0.7 && dpr > 1) state.setDpr(Math.max(1, dpr - 0.25));
    else if (fps < cap * 0.45) ++a.strikes >= 2 && onFail();
    else a.strikes = 0;
  });
  return null;
}

// Camera follows the GSAP-driven rig, plus a slight handheld drift and cursor parallax.
function Director({ story, capture }) {
  const target = useMemo(() => new THREE.Vector3(), []);
  useFrame(({ camera, size, clock }, dt) => {
    dt = Math.min(dt, 0.1);
    const t = clock.elapsedTime;
    story.ps.x = damp(story.ps.x, capture ? 0 : story.pointer.x, 4, dt);
    story.ps.y = damp(story.ps.y, capture ? 0 : story.pointer.y, 4, dt);
    story.vel = damp(story.vel, story.velocity, 3, dt);
    story.velocity = damp(story.velocity, 0, 2, dt);

    const drift = capture ? 0 : 1;
    camera.position.set(
      story.camX + (Math.sin(t * 0.37) * 0.025 + story.ps.x * 0.12) * drift,
      story.camY + (Math.sin(t * 0.53) * 0.018 + story.ps.y * 0.07) * drift,
      story.camZ,
    );
    const portrait = size.width < size.height;
    // Phones: aim lower so the subject sits in the upper half, above the caption.
    camera.lookAt(target.set(story.tgtX, story.tgtY - (portrait ? 0.55 : 0), story.tgtZ));

    camera.fov = portrait ? 55 : 36;
    // On wide screens push the subject right, leaving the left third for captions.
    camera.filmOffset = !capture && size.width >= 1024 ? -3 : 0;
    camera.updateProjectionMatrix();
  });
  return null;
}

// Mount chapter 1 immediately, the rest during idle time, then pre-compile every
// shader so later chapters never stall the first time they come into view.
function Chapters({ story, low, onReady }) {
  const [stage, setStage] = useState(1);
  const { gl, scene, camera } = useThree();
  const first = useRef(false);

  useEffect(() => {
    if (stage < 3) {
      const id = idle(() => setStage(stage + 1));
      return () => cancelIdle(id);
    }
    story.forceVisible = true;
    gl.compileAsync(scene, camera).finally(() => {
      story.forceVisible = false;
      story.compiled = true;
    });
  }, [stage, gl, scene, camera, story]);

  useFrame(() => {
    if (first.current) return;
    first.current = true;
    requestAnimationFrame(() => onReady?.());
  });

  return (
    <>
      <MeatChapter story={story} low={low} />
      {stage >= 2 && <SpiceChapter story={story} low={low} />}
      {stage >= 3 && <DumChapter story={story} low={low} />}
    </>
  );
}

export default function Scene({ story, tier, onReady, onFail, capture = false }) {
  const low = tier === "low";
  const cap = low ? 30 : 60;
  return (
    <Canvas
      frameloop={capture ? "always" : "never"}
      dpr={low ? [1, 1.5] : [1, 1.75]}
      camera={{ fov: 36, near: 0.1, far: 40, position: [-0.2, 1.15, 3.7] }}
      gl={{ antialias: !low, powerPreference: "high-performance", preserveDrawingBuffer: capture }}
      onCreated={({ gl }) => {
        gl.toneMapping = THREE.ACESFilmicToneMapping;
        gl.toneMappingExposure = 1.05;
        gl.domElement.addEventListener("webglcontextlost", (e) => {
          e.preventDefault();
          onFail?.();
        });
      }}
      style={{ touchAction: "pan-y" }}
    >
      <color attach="background" args={["#0A0A0A"]} />
      <fog attach="fog" args={["#0A0A0A", 5.5, 15]} />
      {!capture && <FrameCap fps={cap} story={story} />}
      {!capture && <PerfGuard cap={cap} onFail={onFail} />}
      <Environment />
      <Director story={story} capture={capture} />
      <ambientLight intensity={0.08} />
      <mesh rotation-x={-Math.PI / 2} position={[0, -0.2, -12]}>
        <planeGeometry args={[30, 50]} />
        <meshStandardMaterial color="#14100d" roughness={0.9} />
      </mesh>
      <Chapters story={story} low={low} onReady={onReady} />
    </Canvas>
  );
}
