"use client";

import { useFrame } from "@react-three/fiber";
import { useEffect, useLayoutEffect, useMemo, useRef } from "react";
import * as THREE from "three";
import { LightShaft, Particles, glowMap } from "./fx";
import { LID_PROFILE, POT_PROFILE, meatGeometry, spiceGeometries } from "./geometry";
import { clamp01, doughBump, fbm3, hammeredBump, woodTexture } from "./textures";

const { damp } = THREE.MathUtils;
export const STATIONS = { meat: [0, 0, 0], spice: [0, 1.2, -12], pot: [0, -0.2, -24] };

// Hide a chapter's group when the camera is nowhere near it (saves draw calls),
// except while shaders are being pre-compiled.
function useChapterVisibility(ref, story, from, to) {
  useFrame(() => {
    ref.current.visible = story.forceVisible || (story.t >= from && story.t <= to);
  });
}

function useSpot(position, target, props) {
  return useMemo(() => {
    const s = new THREE.SpotLight(props.color, 0, 0, props.angle, props.penumbra, 2);
    s.position.set(...position);
    s.target.position.set(...target);
    return s;
  }, []); // eslint-disable-line react-hooks/exhaustive-deps
}

const meatMaterial = (cooked) =>
  new THREE.MeshPhysicalMaterial({
    vertexColors: true,
    roughness: cooked ? 0.55 : 0.42,
    clearcoat: cooked ? 0.15 : 0.45,
    clearcoatRoughness: 0.35,
    sheen: cooked ? 0.1 : 0.4,
    sheenColor: new THREE.Color(cooked ? "#7a3a12" : "#ff9b9b"),
    sheenRoughness: 0.5,
  });

// Distance-based level of detail: full-res fibres up close, a light mesh once the camera pulls away.
function MeatCut({ geo, material, position, rotation }) {
  const lod = useMemo(() => {
    const l = new THREE.LOD();
    l.addLevel(new THREE.Mesh(geo.hi, material), 0);
    l.addLevel(new THREE.Mesh(geo.lo, material), 5.5);
    l.position.set(...position);
    l.rotation.set(...rotation);
    return l;
  }, [geo, material, position, rotation]);
  return <primitive object={lod} />;
}

/* ───────────────────────── 01 The Cut ───────────────────────── */

export function MeatChapter({ story, low }) {
  const group = useRef();
  const spice = useRef();
  useChapterVisibility(group, story, -1, 1.8);

  const assets = useMemo(() => {
    const hi = low ? 16 : 30, lo = low ? 6 : 9;
    const variant = (seed, scale) => ({ hi: meatGeometry({ detail: hi, seed, scale }), lo: meatGeometry({ detail: lo, seed, scale }) });
    const wood = woodTexture();
    wood.repeat.set(1, 1);
    return {
      steak: variant(1.3, [0.78, 0.2, 0.56]),
      chunks: [variant(4.1, [0.22, 0.17, 0.2]), variant(7.7, [0.2, 0.19, 0.24]), variant(9.2, [0.25, 0.16, 0.18])],
      mat: meatMaterial(false),
      wood,
    };
  }, [low]);
  useEffect(() => () => {
    [assets.steak, ...assets.chunks].forEach((v) => (v.hi.dispose(), v.lo.dispose()));
    assets.mat.dispose();
    assets.wood.dispose();
  }, [assets]);

  const key = useSpot([1.2, 4.2, 1.4], [0, 0, 0], { color: "#ffd6a6", angle: 0.42, penumbra: 0.75 });
  const rim = useRef();

  const chunkLayout = useMemo(
    () => [
      [0.55, 0.15, -0.35], [0.95, 0.15, 0.05], [0.62, 0.15, 0.42], [1.05, 0.14, -0.45], [0.25, 0.15, 0.62],
    ].map((p, i) => ({ p, r: [Math.random() * 0.4, i * 1.3, Math.random() * 0.3], v: i % 3 })),
    [],
  );

  const floaters = useMemo(() => {
    const kinds = ["anise", "cardamom", "clove", "cardamom", "anise", "clove", "saffron", "cardamom"];
    return kinds.map((k, i) => ({
      k, pos: [(i / kinds.length - 0.5) * 3.6, 0.9 + Math.random() * 0.9, -0.6 - Math.random() * 1.2],
      spin: 0.2 + Math.random() * 0.3, phase: Math.random() * 6,
    }));
  }, []);
  const spices = spiceGeometries();

  useFrame((state) => {
    const t = state.clock.elapsedTime;
    key.intensity = 25 + story.meat * 75;
    rim.current.intensity = 3 + story.meat * 9;
    spice.current.children.forEach((m, i) => {
      const f = floaters[i];
      m.position.y = f.pos[1] + Math.sin(t * 0.6 + f.phase) * 0.08;
      m.rotation.set(t * f.spin, t * f.spin * 0.7 + f.phase, 0.4);
    });
  });

  return (
    <group ref={group} position={STATIONS.meat}>
      <primitive object={key} />
      <primitive object={key.target} />
      <pointLight ref={rim} position={[-2.2, 1.4, -1.8]} color="#ff9a52" distance={8} />
      <LightShaft position={[0.35, 2.4, 0.25]} height={5} radius={1.5} intensity={() => story.meat} />

      <mesh position={[0.2, -0.1, 0]}>
        <boxGeometry args={[3.4, 0.2, 2.1]} />
        <meshStandardMaterial map={assets.wood} roughness={0.8} color="#c9a07a" />
      </mesh>

      <MeatCut geo={assets.steak} material={assets.mat} position={[-0.55, 0.17, 0.05]} rotation={[0, 0.3, 0]} />
      <mesh position={[-0.42, 0.18, 0.02]}>
        <cylinderGeometry args={[0.1, 0.1, 0.43, 24]} />
        <meshPhysicalMaterial color="#efe3cc" roughness={0.45} clearcoat={0.3} />
      </mesh>
      <mesh position={[-0.42, 0.401, 0.02]} rotation-x={-Math.PI / 2}>
        <circleGeometry args={[0.065, 24]} />
        <meshStandardMaterial color="#7a2e22" roughness={0.6} />
      </mesh>
      {chunkLayout.map((c, i) => (
        <MeatCut key={i} geo={assets.chunks[c.v]} material={assets.mat} position={c.p} rotation={c.r} />
      ))}

      <group ref={spice}>
        {floaters.map((f, i) => (
          <mesh key={i} geometry={spices[f.k]} position={f.pos} scale={1.6}>
            <meshStandardMaterial vertexColors roughness={0.7} emissive={f.k === "saffron" ? "#ff4d0d" : "#000"} emissiveIntensity={0.6} />
          </mesh>
        ))}
      </group>

      <Particles count={low ? 60 : 140} amount={() => story.meat} emitter="disc" radius={2} height={2.5} position={[0.3, -0.2, 0]} rise={0.6} speed={0.03} spread={0.1} size={0.05} color="#ffd9a0" opacity={0.9} additive texture="glow" />
    </group>
  );
}

/* ───────────────────────── 02 The Spice ───────────────────────── */

const SPICE_KINDS = [
  { k: "anise", n: 14, scale: 1.25, glow: "#ff9a3c", emissive: "#000" },
  { k: "cardamom", n: 18, scale: 1.3, glow: "#c8e07a", emissive: "#000" },
  { k: "saffron", n: 34, scale: 1.5, glow: "#ff5a1a", emissive: "#d42a00" },
  { k: "clove", n: 18, scale: 1.4, glow: "#ffb46a", emissive: "#000" },
];

export function SpiceChapter({ story, low }) {
  const group = useRef();
  const meshes = useRef([]);
  const glowPoints = useRef();
  useChapterVisibility(group, story, 0.8, 2.6);
  const geos = spiceGeometries();

  const items = useMemo(
    () =>
      SPICE_KINDS.flatMap((kind, ki) =>
        Array.from({ length: low ? Math.ceil(kind.n / 2) : kind.n }, () => ({
          ki,
          base: new THREE.Vector3((Math.random() - 0.5) * 5.6, (Math.random() - 0.5) * 2.8, (Math.random() - 0.5) * 3.2),
          off: new THREE.Vector3(),
          rot: new THREE.Euler(Math.random() * 6, Math.random() * 6, Math.random() * 6),
          spin: new THREE.Vector3(Math.random() - 0.5, Math.random() - 0.5, Math.random() - 0.5).multiplyScalar(0.8),
          phase: Math.random() * 6,
          delay: Math.random() * 0.5,
          scale: kind.scale * (0.75 + Math.random() * 0.5),
        })),
      ),
    [low],
  );
  const counts = SPICE_KINDS.map((_, ki) => items.filter((it) => it.ki === ki).length);

  const glowData = useMemo(() => {
    const pos = new Float32Array(items.length * 3);
    const col = new Float32Array(items.length * 3);
    const c = new THREE.Color();
    items.forEach((it, i) => col.set(c.set(SPICE_KINDS[it.ki].glow).toArray(), i * 3));
    return { pos, col };
  }, [items]);

  const o = useMemo(() => new THREE.Object3D(), []);
  const mouse = useMemo(() => new THREE.Vector3(), []);
  const push = useMemo(() => new THREE.Vector3(), []);

  useFrame((state, dt) => {
    dt = Math.min(dt, 0.1);
    const t = state.clock.elapsedTime;
    const vel = story.vel;
    mouse.set(story.ps.x * 3.2, story.ps.y * 1.6, 0.8);
    const idx = [0, 0, 0, 0];

    items.forEach((it, i) => {
      const reveal = clamp01((story.spice - it.delay) / 0.5);
      // Repel from the cursor, then spring back.
      push.copy(it.base).sub(mouse);
      push.z *= 0.4;
      const d = push.length();
      push.normalize().multiplyScalar(Math.max(0, 1 - d / 1.3) * 0.9);
      push.y -= vel * 0.9 * (0.5 + it.phase / 12);
      it.off.x = damp(it.off.x, push.x, 3.5, dt);
      it.off.y = damp(it.off.y, push.y, 3.5, dt);
      it.off.z = damp(it.off.z, push.z, 3.5, dt);

      const spinBoost = 1 + Math.abs(vel) * 6;
      it.rot.x += it.spin.x * dt * spinBoost;
      it.rot.y += it.spin.y * dt * spinBoost;
      it.rot.z += it.spin.z * dt * spinBoost;

      o.position.copy(it.base).add(it.off);
      o.position.y += Math.sin(t * 0.7 + it.phase) * 0.1 - (1 - reveal) * 1.5;
      o.rotation.copy(it.rot);
      o.scale.setScalar(it.scale * Math.max(reveal, 0.0001));
      o.updateMatrix();
      meshes.current[it.ki].setMatrixAt(idx[it.ki]++, o.matrix);
      glowData.pos.set([o.position.x, o.position.y, o.position.z], i * 3);
    });
    meshes.current.forEach((m) => (m.instanceMatrix.needsUpdate = true));
    glowPoints.current.geometry.attributes.position.needsUpdate = true;
    glowPoints.current.material.opacity = 0.55 * story.spice;
  });

  return (
    <group ref={group} position={STATIONS.spice}>
      <pointLight position={[0, 2.6, 1.5]} intensity={30} color="#ffcf8a" distance={10} />
      <pointLight position={[-2.5, -1, -1]} intensity={14} color="#d4af37" distance={8} />
      {SPICE_KINDS.map((kind, ki) => (
        <instancedMesh key={kind.k} ref={(m) => (meshes.current[ki] = m)} args={[geos[kind.k], undefined, counts[ki]]} frustumCulled={false}>
          <meshPhysicalMaterial vertexColors roughness={kind.k === "cardamom" ? 0.55 : 0.7} clearcoat={0.2} emissive={kind.emissive} emissiveIntensity={0.9} />
        </instancedMesh>
      ))}
      <points ref={glowPoints} frustumCulled={false}>
        <bufferGeometry>
          <bufferAttribute attach="attributes-position" args={[glowData.pos, 3]} />
          <bufferAttribute attach="attributes-color" args={[glowData.col, 3]} />
        </bufferGeometry>
        <pointsMaterial map={glowMap()} vertexColors size={0.8} transparent depthWrite={false} blending={THREE.AdditiveBlending} />
      </points>
    </group>
  );
}

/* ───────────────────────── 03 The Dum + 04 The Royal Feast ───────────────────────── */

const RIM_Y = 1.45;
const POT_LIFT = 0.32; // pot sits on a ring above the coals
const SEAL_SEGMENTS = 16;
const DOME_Y = 1.2, DOME_H = 0.17, DOME_R = 0.95; // rice mound inside the pot

// Scatter instances over the rice dome. `fn(i, o, color)` can tweak each instance.
function Scatter({ count, geometry, colors, material, lift = 0, flat = true, colorFn }) {
  const ref = useRef();
  useLayoutEffect(() => {
    const o = new THREE.Object3D(), c = new THREE.Color();
    for (let i = 0; i < count; i++) {
      const r = 0.9 * Math.sqrt(Math.random()), a = Math.random() * Math.PI * 2;
      const x = r * Math.cos(a), z = r * Math.sin(a);
      const y = DOME_Y + DOME_H * Math.sqrt(1 - (r / DOME_R) ** 2) + 0.012 + lift - Math.random() * 0.012;
      o.position.set(x, y, z);
      if (flat) o.rotation.set(Math.PI / 2 + (Math.random() - 0.5) * 0.7, 0, Math.random() * Math.PI * 2);
      else o.rotation.set(Math.random() * 6, Math.random() * 6, Math.random() * 6);
      o.scale.setScalar(0.85 + Math.random() * 0.35);
      o.updateMatrix();
      ref.current.setMatrixAt(i, o.matrix);
      if (colorFn) colorFn(x, z, c);
      else c.set(colors[(Math.random() * colors.length) | 0]);
      ref.current.setColorAt(i, c);
    }
    ref.current.instanceMatrix.needsUpdate = true;
    ref.current.instanceColor.needsUpdate = true;
  }, [count, colors, lift, flat, colorFn]);
  return <instancedMesh ref={ref} args={[geometry, material, count]} />;
}

const SAFFRON = ["#f8f2e4", "#fbf6ea", "#f1c24e", "#e8890f", "#d9670a"].map((h) => new THREE.Color(h));
// Saffron streaks follow noise patches, like the milk was poured in ribbons.
const riceColor = (x, z, c) => {
  const n = fbm3(x * 2.2, z * 2.2, 3.3, 3) + (Math.random() - 0.5) * 0.25;
  c.copy(n > 0.28 ? SAFFRON[4] : n > 0.16 ? SAFFRON[3] : n > 0.04 ? SAFFRON[2] : SAFFRON[(Math.random() * 2) | 0]);
};

export function DumChapter({ story, low }) {
  const group = useRef();
  const lid = useRef();
  const seal = useRef([]);
  const coalLight = useRef();
  const keyRef = useRef();
  useChapterVisibility(group, story, 1.7, 5);

  const assets = useMemo(() => {
    const bump = hammeredBump();
    bump.repeat.set(8, 4);
    const dough = doughBump();
    const segment = new THREE.TorusGeometry(1.07, 0.075, 10, 14, ((Math.PI * 2) / SEAL_SEGMENTS) * 0.985);
    const p = segment.attributes.position;
    for (let i = 0; i < p.count; i++) {
      const k = 1 + fbm3(p.getX(i) * 6, p.getY(i) * 6, p.getZ(i) * 6, 3) * 0.12;
      p.setXYZ(i, p.getX(i), p.getY(i), p.getZ(i) * k);
    }
    segment.computeVertexNormals();
    const copper = new THREE.MeshPhysicalMaterial({ color: "#b8693a", metalness: 1, roughness: 0.3, bumpMap: bump, bumpScale: 1.4, side: THREE.DoubleSide, clearcoat: 0.25 });
    return {
      pot: new THREE.LatheGeometry(POT_PROFILE, low ? 64 : 128),
      lid: new THREE.LatheGeometry(LID_PROFILE, low ? 64 : 128),
      copper, bump, dough, segment,
      grain: new THREE.CapsuleGeometry(0.0115, 0.085, 3, 6),
      grainMat: new THREE.MeshPhysicalMaterial({ roughness: 0.32, clearcoat: 0.6, clearcoatRoughness: 0.25 }),
      onion: new THREE.TorusGeometry(0.04, 0.006, 4, 12, Math.PI * 0.9).scale(1, 1.6, 1),
      leaf: new THREE.CircleGeometry(0.04, 7).scale(1, 1.9, 1),
      chunk: meatGeometry({ detail: low ? 6 : 12, seed: 3.1, scale: [0.14, 0.1, 0.15], cooked: true }),
      cookedMat: meatMaterial(true),
      coal: new THREE.DodecahedronGeometry(0.11, 0),
      seals: Array.from({ length: SEAL_SEGMENTS }, (_, i) => ({ a: (i / SEAL_SEGMENTS) * Math.PI * 2, delay: Math.random() * 0.45, tumble: (Math.random() - 0.5) * 3 })),
    };
  }, [low]);
  useEffect(() => () => Object.values(assets).forEach((a) => a?.dispose?.()), [assets]);

  const key = useSpot([2.2, 6.5, 3], [0, 1.2, 0], { color: "#ffd9a8", angle: 0.38, penumbra: 0.8 });

  useFrame((state) => {
    const t = state.clock.elapsedTime;
    key.intensity = story.pot * 110 + story.feast * 40;
    coalLight.current.intensity = story.pot * (7 + Math.sin(t * 9) * 1.2 + Math.sin(t * 23) * 0.8);

    // The dough seal cracks segment by segment, slides outward, and drops.
    seal.current.forEach((m, i) => {
      const s = assets.seals[i];
      const k = clamp01((story.seal - s.delay) / 0.45);
      const r = k * 0.45, mid = s.a + Math.PI / SEAL_SEGMENTS;
      m.position.set(Math.cos(mid) * r, RIM_Y - 0.02 - k * k * (RIM_Y + POT_LIFT - 0.08), Math.sin(mid) * r);
      m.rotation.set(Math.PI / 2 + k * s.tumble, 0, s.a + k * s.tumble * 0.5);
    });

    // Lid: a small lift as the steam pushes, then it swings off to the side.
    const l = story.lid;
    const swing = clamp01((l - 0.15) / 0.85);
    lid.current.position.set(Math.sin(swing * Math.PI * 0.5) * 2.5, RIM_Y + Math.min(l, 0.15) * 1.2 + Math.sin(swing * Math.PI) * 1.1 - swing * 0.6, swing * 0.6);
    lid.current.rotation.set(Math.sin(t * 40) * 0.01 * (1 - swing) * (l > 0 ? 1 : 0), 0, -swing * 1.2);
  });

  const potY = POT_LIFT;
  return (
    <group ref={group} position={STATIONS.pot}>
      <primitive object={key} />
      <primitive object={key.target} />
      <pointLight ref={coalLight} position={[0, 0.15, 0.9]} color="#ff5a1a" distance={4} />

      {/* Coals and embers */}
      <Coals geometry={assets.coal} count={low ? 40 : 70} />
      <Particles count={low ? 40 : 90} amount={() => story.pot} radius={1.5} height={0.1} rise={0.9} speed={0.25} spread={0.2} size={0.06} color="#ff7a2a" opacity={1} additive texture="glow" />

      <group position-y={potY}>
        <mesh geometry={assets.pot} material={assets.copper} />
        {[[1.262, 1.02], [1.357, 0.72]].map(([r, y]) => (
          <mesh key={y} position-y={y} rotation-x={Math.PI / 2}>
            <torusGeometry args={[r, 0.022, 10, 128]} />
            <meshStandardMaterial color="#d4af37" metalness={1} roughness={0.18} />
          </mesh>
        ))}
        {[1, -1].map((s) => (
          <mesh key={s} position={[s * 1.16, 1.12, 0]} rotation-z={(-s * Math.PI) / 2}>
            <torusGeometry args={[0.17, 0.034, 12, 32, Math.PI]} />
            <meshStandardMaterial color="#d4af37" metalness={1} roughness={0.22} />
          </mesh>
        ))}
        <mesh position-y={-0.02} rotation-x={Math.PI / 2}>
          <torusGeometry args={[0.85, 0.05, 8, 48]} />
          <meshStandardMaterial color="#1c1714" metalness={0.8} roughness={0.5} />
        </mesh>

        {assets.seals.map((s, i) => (
          <mesh key={i} ref={(m) => (seal.current[i] = m)} geometry={assets.segment}>
            <meshStandardMaterial color="#dcc497" roughness={0.95} bumpMap={assets.dough} bumpScale={2} />
          </mesh>
        ))}

        <group ref={lid}>
          <mesh geometry={assets.lid} material={assets.copper} />
          <mesh position-y={0.4}>
            <sphereGeometry args={[0.11, 24, 16]} />
            <meshStandardMaterial color="#d4af37" metalness={1} roughness={0.15} />
          </mesh>
        </group>

        {/* The biriyani: a dome of rice, with meat, fried onions and mint on top */}
        <mesh position-y={DOME_Y} scale={[DOME_R, DOME_H, DOME_R]}>
          <sphereGeometry args={[1, 40, 12, 0, Math.PI * 2, 0, Math.PI / 2]} />
          <meshStandardMaterial color="#b8955a" roughness={0.85} />
        </mesh>
        <Scatter count={low ? 2200 : 5200} geometry={assets.grain} material={assets.grainMat} colorFn={riceColor} />
        <Scatter count={8} geometry={assets.chunk} material={assets.cookedMat} lift={0.01} flat={false} colors={null} colorFn={(x, z, c) => c.set("#ffffff")} />
        <Scatter count={low ? 50 : 90} geometry={assets.onion} material={assets.grainMat} lift={0.02} colors={["#6e3010", "#8f4515", "#b0621f", "#7d3a12"]} />
        <Scatter count={30} geometry={assets.leaf} material={assets.grainMat} lift={0.025} colors={["#2f6a2e", "#3f7d3a", "#285a26"]} />

        <Particles count={low ? 40 : 90} amount={() => story.steam * (1 - story.lid * 0.7)} emitter="ring" radius={1.07} position={[0, RIM_Y, 0]} rise={2.2} speed={0.16} spread={0.5} size={0.75} opacity={0.32} />
        <Particles count={low ? 50 : 120} amount={() => story.lid} radius={0.8} position={[0, RIM_Y - 0.05, 0]} rise={3} speed={0.12} spread={0.9} size={1.1} opacity={0.3} />
        <Particles count={low ? 50 : 110} amount={() => Math.max(story.steam, story.lid) * 0.9} radius={0.9} position={[0, RIM_Y, 0]} rise={2.8} speed={0.1} spread={0.4} swirl={1.2} size={0.05} color="#ffb627" opacity={1} additive texture="glow" />
      </group>
    </group>
  );
}

function Coals({ geometry, count }) {
  const ref = useRef();
  useLayoutEffect(() => {
    const o = new THREE.Object3D(), c = new THREE.Color();
    for (let i = 0; i < count; i++) {
      const r = 0.35 + Math.random() * 1.25, a = Math.random() * Math.PI * 2;
      o.position.set(Math.cos(a) * r, 0.04 + Math.random() * 0.05, Math.sin(a) * r);
      o.rotation.set(Math.random() * 6, Math.random() * 6, Math.random() * 6);
      o.scale.set(0.7 + Math.random() * 0.6, 0.5 + Math.random() * 0.4, 0.7 + Math.random() * 0.6);
      o.updateMatrix();
      ref.current.setMatrixAt(i, o.matrix);
      ref.current.setColorAt(i, Math.random() < 0.25 ? c.setHSL(0.04, 0.95, 0.32) : c.setHSL(0.05, 0.25, 0.05));
    }
    ref.current.instanceMatrix.needsUpdate = true;
    ref.current.instanceColor.needsUpdate = true;
  }, [count]);
  return (
    <instancedMesh ref={ref} args={[geometry, undefined, count]}>
      <meshStandardMaterial roughness={0.95} emissive="#ff3d0a" emissiveIntensity={0.06} />
    </instancedMesh>
  );
}
