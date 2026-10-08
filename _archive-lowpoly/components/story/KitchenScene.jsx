"use client";

import { Canvas, useFrame, useThree } from "@react-three/fiber";
import { useEffect, useLayoutEffect, useMemo, useRef } from "react";
import * as THREE from "three";
import { RoomEnvironment } from "three/examples/jsm/environments/RoomEnvironment.js";
import { mergeVertices } from "three/examples/jsm/utils/BufferGeometryUtils.js";
import { story } from "./state";

const { damp, smoothstep, lerp, clamp } = THREE.MathUtils;
const ease = (x) => x * x * (3 - 2 * x);
const v2 = (pts) => pts.map(([x, y]) => new THREE.Vector2(x, y));

// Piecewise eased keyframes: key(t, [[t0, v0], [t1, v1], ...]).
const key = (t, ks) => {
  for (let i = 1; i < ks.length; i++) {
    if (t <= ks[i][0]) return lerp(ks[i - 1][1], ks[i][1], ease((t - ks[i - 1][0]) / (ks[i][0] - ks[i - 1][0])));
  }
  return ks[ks.length - 1][1];
};

// Wide, heavy copper dum vessel: outer wall to a rolled rim, then back down the inner wall.
const POT_PROFILE = v2([
  [0, 0], [0.9, 0], [1.3, 0.12], [1.55, 0.4], [1.6, 0.7], [1.55, 0.95], [1.62, 1.03], [1.67, 1.08], [1.6, 1.12],
  [1.5, 1.03], [1.48, 0.7], [1.42, 0.4], [1.2, 0.16], [0.8, 0.08], [0, 0.08],
]);
const LID_PROFILE = v2([
  [0, 0.34], [0.5, 0.3], [1.0, 0.18], [1.5, 0.06], [1.72, 0], [1.72, -0.04], [1.5, 0.01], [1.0, 0.13], [0.5, 0.25], [0, 0.29],
]);
const RIM_Y = 1.1;
const RIM_R = 1.6;
const INNER = [[0.16, 1.2], [0.4, 1.42], [0.7, 1.48], [1.02, 1.5]];
const innerR = (y) => key(clamp(y, 0.16, 1.02), INNER);

// Per-frame scene values derived from scroll, shared by every component inside the canvas.
const S = { t: 0, fire: 0.6, steam: 0.15, steamY: 0.35, steamR: 1.2, sealed: 0, surfaceY: 0.3 };

// Camera keyframe per integer t: prologue, fire, marination, dum, reveal, close-up, menu.
const CAM = [
  [[0, 1.5, 8.5], [0, 0.35, 0]],
  [[2.5, 0.2, 4.3], [0, -0.05, 0]],
  [[-1.8, 2.9, 3.9], [0, 0.4, 0]],
  [[2.3, 2.6, 4.3], [0, 0.75, 0]],
  [[0.3, 3.7, 2.7], [0, 0.6, 0]],
  [[0.1, 2.5, 1.95], [0, 0.72, 0]],
  [[-0.6, 2.6, 7.2], [0, 0.5, 0]],
].map(([p, l]) => [new THREE.Vector3(...p), new THREE.Vector3(...l)]);

function Director({ onFail }) {
  const look = useMemo(() => new THREE.Vector3(), []);
  const perf = useRef({ frames: 0, acc: 0, n: 0, dropped: false });
  const setDpr = useThree((s) => s.setDpr);

  useFrame((state, delta) => {
    const dt = Math.min(delta, 0.1);
    // Scroll damping: the camera glides to where the scroll is, so wheel, trackpad and touch all feel equally weighted.
    S.t = damp(S.t, story.t, 2.4, dt);
    const t = S.t;

    S.fire = key(t, [[0, 0.55], [1, 0.8], [1.45, 1.2], [2.3, 0.9], [3.5, 0.45], [6, 0.4]]);
    S.steam = key(t, [[0, 0.15], [1.5, 0.35], [2.6, 0.5], [3.4, 0.6], [3.62, 0.15], [4.1, 0.2], [4.4, 1], [6, 0.7]]);
    S.surfaceY = key(t, [[2, 0.3], [2.3, 0.5], [3, 0.5], [3.25, 0.78]]);
    S.sealed = smoothstep(t, 3.6, 3.75) * (1 - smoothstep(t, 4.1, 4.25));
    S.steamY = lerp(S.surfaceY + 0.05, RIM_Y, S.sealed);
    S.steamR = lerp(innerR(S.surfaceY) * 0.85, RIM_R + 0.05, S.sealed);

    const i = Math.min(Math.floor(t), CAM.length - 2);
    const f = ease(clamp(t - i, 0, 1));
    const [p0, l0] = CAM[i];
    const [p1, l1] = CAM[i + 1];
    const { camera, size, clock } = state;
    look.lerpVectors(l0, l1, f);
    camera.position.lerpVectors(p0, p1, f);
    const portrait = size.width < size.height;
    if (portrait) camera.position.sub(look).multiplyScalar(1.45).add(look);
    // Slow handheld drift, documentary style.
    const time = clock.elapsedTime;
    camera.position.x += Math.sin(time * 0.37) * 0.04;
    camera.position.y += Math.sin(time * 0.53) * 0.03;
    camera.lookAt(look);
    // Frame the subject right of the text column on wide screens, in the upper half on phones.
    if (size.width >= 900) camera.setViewOffset(size.width, size.height, -size.width * 0.17, 0, size.width, size.height);
    else camera.setViewOffset(size.width, size.height, 0, size.height * (portrait ? 0.14 : 0), size.width, size.height);

    // Watchdog: if frames run long, drop resolution once; if still slow, hand over to the pre-rendered loop.
    const p = perf.current;
    if (++p.frames < 60) return;
    p.acc += Math.min(delta, 0.25);
    if (++p.n < 90) return;
    const avg = p.acc / p.n;
    p.acc = p.n = 0;
    if (avg > 1 / 24 && !p.dropped) {
      p.dropped = true;
      setDpr(1);
    } else if (avg > 1 / 14 && p.dropped) onFail();
  });
  return null;
}

function Environment() {
  const { gl, scene } = useThree();
  useEffect(() => {
    const pmrem = new THREE.PMREMGenerator(gl);
    const env = pmrem.fromScene(new RoomEnvironment(), 0.04).texture;
    scene.environment = env;
    scene.environmentIntensity = 0.35;
    return () => {
      scene.environment = null;
      env.dispose();
      pmrem.dispose();
    };
  }, [gl, scene]);
  return null;
}

// Renders on demand at most `fps` times a second. rAF already stops in background tabs.
function FrameCap({ fps }) {
  const invalidate = useThree((s) => s.invalidate);
  useEffect(() => {
    const step = 1000 / fps;
    let last = 0;
    let id = requestAnimationFrame(function loop(now) {
      id = requestAnimationFrame(loop);
      if (now - last < step - 1) return;
      last = now - ((now - last) % step);
      invalidate();
    });
    return () => cancelAnimationFrame(id);
  }, [fps, invalidate]);
  return null;
}

/* ---------- textures (procedural, so there is nothing to download or decompress) ---------- */

function canvasTexture(size, draw) {
  const cv = document.createElement("canvas");
  cv.width = cv.height = size;
  draw(cv.getContext("2d"), size);
  return new THREE.CanvasTexture(cv);
}
const blob = (g, x, y, r, a, rgb = "255,255,255") => {
  const gr = g.createRadialGradient(x, y, 0, x, y, r);
  gr.addColorStop(0, `rgba(${rgb},${a})`);
  gr.addColorStop(1, `rgba(${rgb},0)`);
  g.fillStyle = gr;
  g.fillRect(x - r, y - r, r * 2, r * 2);
};

function useTextures() {
  const tex = useMemo(
    () => ({
      soft: canvasTexture(64, (g, s) => blob(g, s / 2, s / 2, s / 2, 1)),
      puff: canvasTexture(128, (g, s) => {
        for (let i = 0; i < 8; i++) blob(g, s / 2 + (Math.random() - 0.5) * 44, s / 2 + (Math.random() - 0.5) * 44, 18 + Math.random() * 26, 0.3);
      }),
      // Hammered copper: a field of shallow dents used as a bump map.
      hammered: canvasTexture(256, (g, s) => {
        g.fillStyle = "#808080";
        g.fillRect(0, 0, s, s);
        for (let i = 0; i < 900; i++) blob(g, Math.random() * s, Math.random() * s, 3 + Math.random() * 7, 0.35, "40,40,40");
      }),
    }),
    []
  );
  useEffect(() => () => Object.values(tex).forEach((t) => t.dispose()), [tex]);
  return tex;
}

/* ---------- particles: one tiny shader shared by fire, embers and steam ---------- */

const VERT = `
attribute float aSize; attribute float aAlpha; attribute vec3 aColor;
uniform float uScale; varying float vAlpha; varying vec3 vColor;
void main() {
  vec4 mv = modelViewMatrix * vec4(position, 1.0);
  gl_Position = projectionMatrix * mv;
  gl_PointSize = aSize * uScale / -mv.z;
  vAlpha = aAlpha; vColor = aColor;
}`;
const FRAG = `
uniform sampler2D uMap; varying float vAlpha; varying vec3 vColor;
void main() {
  float a = texture2D(uMap, gl_PointCoord).a * vAlpha;
  if (a < 0.004) discard;
  gl_FragColor = vec4(vColor, a);
}`;

function Particles({ count, texture, update, blending = THREE.AdditiveBlending }) {
  const ref = useRef();
  const buf = useMemo(
    () => ({
      pos: new Float32Array(count * 3),
      size: new Float32Array(count),
      alpha: new Float32Array(count),
      color: new Float32Array(count * 3),
      seeds: Array.from({ length: count }, () => ({ life: Math.random(), a: Math.random() * Math.PI * 2, r: Math.random(), s: Math.random() })),
    }),
    [count]
  );
  const uniforms = useMemo(() => ({ uMap: { value: texture }, uScale: { value: 1 } }), [texture]);

  useFrame((state, delta) => {
    update(buf, Math.min(delta, 0.05), state.clock.elapsedTime);
    const at = ref.current.geometry.attributes;
    at.position.needsUpdate = at.aSize.needsUpdate = at.aAlpha.needsUpdate = at.aColor.needsUpdate = true;
    uniforms.uScale.value = (state.size.height * state.viewport.dpr) / (2 * Math.tan(THREE.MathUtils.degToRad(state.camera.fov / 2)));
  });

  return (
    <points ref={ref} frustumCulled={false}>
      <bufferGeometry>
        <bufferAttribute attach="attributes-position" args={[buf.pos, 3]} />
        <bufferAttribute attach="attributes-aSize" args={[buf.size, 1]} />
        <bufferAttribute attach="attributes-aAlpha" args={[buf.alpha, 1]} />
        <bufferAttribute attach="attributes-aColor" args={[buf.color, 3]} />
      </bufferGeometry>
      <shaderMaterial uniforms={uniforms} vertexShader={VERT} fragmentShader={FRAG} transparent depthWrite={false} blending={blending} />
    </points>
  );
}

const respawn = (s) => {
  s.life -= 1;
  s.a = Math.random() * Math.PI * 2;
  s.r = Math.random();
};

function updateFlames(b, dt, time) {
  b.seeds.forEach((s, i) => {
    s.life += dt * (1.1 + s.s);
    if (s.life >= 1) respawn(s);
    const l = s.life;
    const rad = (0.25 + s.r * 0.95) * (1 - l * 0.35);
    b.pos[i * 3] = Math.cos(s.a) * rad + Math.sin(time * 7 + i) * 0.04;
    b.pos[i * 3 + 1] = -0.6 + l * (0.35 + 0.55 * S.fire);
    b.pos[i * 3 + 2] = Math.sin(s.a) * rad;
    b.size[i] = (0.22 + 0.42 * (1 - l)) * (0.6 + 0.5 * S.fire) * (0.7 + 0.6 * s.s);
    b.alpha[i] = Math.sin(l * Math.PI) * 0.8;
    // White-hot core, cooling through orange to deep red.
    b.color[i * 3] = 1;
    b.color[i * 3 + 1] = lerp(0.8, 0.2, l);
    b.color[i * 3 + 2] = lerp(0.45, 0.02, Math.min(l * 2, 1));
  });
}

function updateEmbers(b, dt, time) {
  b.seeds.forEach((s, i) => {
    s.life += dt * (0.16 + s.s * 0.22);
    if (s.life >= 1) respawn(s);
    const l = s.life;
    const rad = 0.3 + s.r * 1.4;
    b.pos[i * 3] = Math.cos(s.a) * rad + Math.sin(time * 0.9 + i) * 0.35 * l;
    b.pos[i * 3 + 1] = -0.5 + l * 4.5;
    b.pos[i * 3 + 2] = Math.sin(s.a) * rad + Math.cos(time * 0.7 + i) * 0.3 * l;
    b.size[i] = 0.03 + s.s * 0.03;
    b.alpha[i] = (1 - l) * (0.55 + 0.45 * Math.sin(time * 18 + i * 3)) * Math.min(1, S.fire * 1.2);
    b.color[i * 3] = 1;
    b.color[i * 3 + 1] = 0.45 + 0.25 * s.s;
    b.color[i * 3 + 2] = 0.1;
  });
}

function updateSteam(b, dt, time) {
  b.seeds.forEach((s, i) => {
    s.life += dt * (0.1 + s.s * 0.08);
    if (s.life >= 1) respawn(s);
    const l = s.life;
    // Open pot: steam rises from the whole surface. Sealed: thin wisps escape at the rim.
    const rad = lerp(S.steamR * Math.sqrt(s.r), S.steamR, S.sealed) + l * 0.5;
    b.pos[i * 3] = Math.cos(s.a) * rad + Math.sin(time * 0.4 + i) * 0.3 * l;
    b.pos[i * 3 + 1] = S.steamY + l * 3;
    b.pos[i * 3 + 2] = Math.sin(s.a) * rad;
    b.size[i] = 0.45 + l * 1.3 + s.s * 0.3;
    b.alpha[i] = Math.pow(Math.sin(l * Math.PI), 1.5) * 0.11 * S.steam;
    b.color[i * 3] = 1;
    b.color[i * 3 + 1] = 0.94;
    b.color[i * 3 + 2] = 0.86;
  });
}

/* ---------- ingredients ---------- */

// Ingredients that fall into the pot between scroll times t0 and t1. Pure function of scroll, so it reverses cleanly.
function Drop({ count, geometry, colors, t0, t1, y, radius = 1.15, roughness = 0.6, scale = 1 }) {
  const ref = useRef();
  const last = useRef(-1);
  const o = useMemo(() => new THREE.Object3D(), []);
  const items = useMemo(
    () =>
      Array.from({ length: count }, (_, i) => {
        const r = radius * Math.sqrt(Math.random());
        const a = Math.random() * Math.PI * 2;
        return {
          x: r * Math.cos(a),
          z: r * Math.sin(a),
          delay: (i / count) * 0.7 + Math.random() * 0.1,
          rot: [Math.random() * 6, Math.random() * 6, Math.random() * 6],
          spin: (Math.random() - 0.5) * 8,
          s: scale * (0.75 + Math.random() * 0.5),
        };
      }),
    [count, radius, scale]
  );

  useLayoutEffect(() => {
    const c = new THREE.Color();
    items.forEach((_, i) => ref.current.setColorAt(i, c.set(colors[i % colors.length])));
    ref.current.instanceColor.needsUpdate = true;
  }, [items, colors]);

  useFrame(() => {
    if (Math.abs(S.t - last.current) < 1e-4) return;
    last.current = S.t;
    const k = (S.t - t0) / (t1 - t0);
    items.forEach((it, i) => {
      const f = clamp((k - it.delay) / 0.2, 0, 1);
      const spin = it.spin * (1 - f);
      o.position.set(it.x, lerp(y + 2.6, y, f * f), it.z);
      o.rotation.set(it.rot[0] + spin, it.rot[1], it.rot[2] + spin);
      o.scale.setScalar(f > 0 ? it.s : 0);
      o.updateMatrix();
      ref.current.setMatrixAt(i, o.matrix);
    });
    ref.current.instanceMatrix.needsUpdate = true;
  });

  return (
    <instancedMesh ref={ref} args={[geometry, undefined, count]} frustumCulled={false}>
      <meshStandardMaterial roughness={roughness} side={THREE.DoubleSide} />
    </instancedMesh>
  );
}

// A static bed of rice grains.
function Grains({ count, geometry, colors, radius }) {
  const ref = useRef();
  useLayoutEffect(() => {
    const o = new THREE.Object3D();
    const c = new THREE.Color();
    for (let i = 0; i < count; i++) {
      const r = radius * Math.sqrt(Math.random());
      const a = Math.random() * Math.PI * 2;
      o.position.set(r * Math.cos(a), Math.random() * 0.03, r * Math.sin(a));
      o.rotation.set(Math.PI / 2 + (Math.random() - 0.5) * 0.6, 0, Math.random() * Math.PI * 2);
      o.scale.setScalar(0.85 + Math.random() * 0.35);
      o.updateMatrix();
      ref.current.setMatrixAt(i, o.matrix);
      ref.current.setColorAt(i, c.set(colors[(Math.random() * colors.length) | 0]));
    }
    ref.current.instanceMatrix.needsUpdate = true;
    ref.current.instanceColor.needsUpdate = true;
  }, [count, colors, radius]);
  return (
    <instancedMesh ref={ref} args={[geometry, undefined, count]}>
      <meshStandardMaterial roughness={0.5} />
    </instancedMesh>
  );
}

const C = {
  cardamom: ["#7d8f3e", "#6c7d34", "#8fa04a"],
  clove: ["#3a2216", "#4a2b1a"],
  anise: ["#5a2e18", "#6b3a1e"],
  shallot: ["#c27a6e", "#b0605a", "#d79a5a"],
  curry: ["#2f5a22", "#3b6b2b"],
  meat: ["#7a3518", "#8a4220", "#6a2c12", "#93502a"],
  mint: ["#4f8f3a", "#3f7a2e"],
  rice: ["#f5efe2", "#efe4cc", "#f8f3e8", "#e8c88a", "#d9a24a"],
  cashew: ["#e6c08a", "#d9a865", "#efcf9a"],
  onion: ["#7a3e12", "#9a5418", "#5e2c0c"],
  coriander: ["#3e8a2c", "#2f7522"],
  raisin: ["#4a1c14", "#5a2418"],
};
const OIL = new THREE.Color("#c98d1c");
const MASALA = new THREE.Color("#6b2a12");
const RICE = new THREE.Color("#ece2cc");
const DOUGH = new THREE.Color("#ddc9a0");
const BAKED = new THREE.Color("#c39a5e");

function chunkGeometry() {
  // Irregular meat chunk: a welded icosphere with jittered vertices.
  const g = new THREE.IcosahedronGeometry(0.12, 1);
  g.deleteAttribute("normal");
  g.deleteAttribute("uv");
  const m = mergeVertices(g);
  const p = m.attributes.position;
  for (let i = 0; i < p.count; i++) {
    const k = 0.75 + Math.random() * 0.5;
    p.setXYZ(i, p.getX(i) * k * 1.2, p.getY(i) * k * 0.8, p.getZ(i) * k);
  }
  m.computeVertexNormals();
  return m;
}

function sooty(geometry, copper, soot) {
  // Vertex colours: bright copper on top, fire-blackened toward the base.
  const p = geometry.attributes.position;
  const col = new Float32Array(p.count * 3);
  const c = new THREE.Color();
  for (let i = 0; i < p.count; i++) {
    c.lerpColors(soot, copper, smoothstep(p.getY(i), 0.05, 0.5));
    c.toArray(col, i * 3);
  }
  geometry.setAttribute("color", new THREE.BufferAttribute(col, 3));
  return geometry;
}

function Pot({ lowTier, tex }) {
  const lid = useRef();
  const seal = useRef();
  const coals = useRef();
  const surface = useRef();
  const rice = useRef();
  const ghee = useRef();

  const geo = useMemo(() => {
    const seg = lowTier ? 64 : 128;
    const copper = new THREE.Color("#b8683a");
    return {
      pot: sooty(new THREE.LatheGeometry(POT_PROFILE, seg), copper, new THREE.Color("#24150d")),
      lid: sooty(new THREE.LatheGeometry(LID_PROFILE, seg), copper, copper),
      disc: new THREE.CircleGeometry(1, 64).rotateX(-Math.PI / 2),
      grain: new THREE.CapsuleGeometry(0.014, 0.075, 2, 5),
      pod: new THREE.SphereGeometry(0.035, 8, 6).scale(1, 1, 2),
      clove: new THREE.CapsuleGeometry(0.012, 0.06, 2, 5),
      anise: new THREE.CylinderGeometry(0.06, 0.06, 0.014, 8),
      ring: new THREE.TorusGeometry(0.038, 0.009, 6, 14),
      leaf: new THREE.CircleGeometry(0.04, 7).scale(1, 2.1, 1),
      chunk: chunkGeometry(),
      cashew: new THREE.TorusGeometry(0.03, 0.016, 8, 12, Math.PI),
      sliver: new THREE.BoxGeometry(0.08, 0.008, 0.016),
      raisin: new THREE.SphereGeometry(0.018, 8, 6),
      grains: lowTier ? 700 : 1600,
    };
  }, [lowTier]);
  useEffect(() => () => Object.values(geo).forEach((g) => g.dispose?.()), [geo]);

  const copperMat = useMemo(
    () => new THREE.MeshStandardMaterial({ vertexColors: true, metalness: 1, roughness: 0.3, bumpMap: tex.hammered, bumpScale: 0.6, side: THREE.DoubleSide }),
    [tex]
  );
  useEffect(() => () => copperMat.dispose(), [copperMat]);

  useFrame(() => {
    const t = S.t;
    const y = S.surfaceY;

    // Food surface: golden oil → red masala → kaima rice.
    surface.current.position.y = y;
    surface.current.scale.setScalar(innerR(y) - 0.02);
    const masala = smoothstep(t, 2, 2.3);
    const r = smoothstep(t, 3, 3.25);
    const m = surface.current.material;
    m.color.lerpColors(OIL, MASALA, masala).lerp(RICE, r);
    m.roughness = lerp(0.12, 0.75, Math.max(masala, r));
    m.metalness = lerp(0.3, 0, Math.max(masala, r));
    rice.current.visible = r > 0.001;
    rice.current.position.y = y;
    rice.current.scale.set(1, Math.max(r, 0.001), 1);

    // Golden ghee poured over the rice before sealing.
    const pour = smoothstep(t, 3.18, 3.24) * (1 - smoothstep(t, 3.36, 3.42));
    ghee.current.visible = pour > 0.001;
    const len = (3 - y) * smoothstep(t, 3.18, 3.24);
    ghee.current.scale.set(pour, Math.max(len, 0.001), pour);
    ghee.current.position.y = 3 - len / 2;

    // Lid lowers from above (3.4–3.6), dough seal is pressed on, coals go on top; lifted again in chapter IV.
    const lower = smoothstep(t, 3.4, 3.6);
    const lift = smoothstep(t, 4.1, 4.45);
    const h = 1 - lower + lift;
    lid.current.visible = lower > 0 && lift < 1;
    lid.current.position.set(-lift * 1.4, RIM_Y + h * h * 4.5, -lift * 0.6);
    lid.current.rotation.set(-lift * 0.5, 0, lift * 0.3);
    const s = smoothstep(t, 3.6, 3.75);
    seal.current.visible = s > 0.001;
    seal.current.scale.set(1, 1, Math.max(s, 0.001));
    seal.current.material.color.lerpColors(DOUGH, BAKED, smoothstep(t, 3.75, 4.1));
    coals.current.scale.setScalar(Math.max(smoothstep(t, 3.75, 3.9), 0.001));
    coals.current.children.forEach((c, i) => (c.material.emissiveIntensity = 1.5 + Math.sin(performance.now() / 300 + i) * 0.5));
  });

  return (
    <group>
      <mesh geometry={geo.pot} material={copperMat} />
      {/* Brass band below the rim and two ring handles. */}
      <mesh position-y={0.95} rotation-x={Math.PI / 2}>
        <torusGeometry args={[1.555, 0.02, 8, 128]} />
        <meshStandardMaterial color="#c9a14a" metalness={1} roughness={0.28} />
      </mesh>
      {[1, -1].map((side) => (
        <mesh key={side} position={[side * 1.7, 0.82, 0]} rotation-y={Math.PI / 2}>
          <torusGeometry args={[0.18, 0.03, 10, 28]} />
          <meshStandardMaterial color="#9a5a2e" metalness={1} roughness={0.35} />
        </mesh>
      ))}

      <mesh ref={surface} geometry={geo.disc}>
        <meshStandardMaterial color={OIL} roughness={0.12} metalness={0.3} />
      </mesh>

      <Drop count={14} geometry={geo.pod} colors={C.cardamom} t0={1.25} t1={1.9} y={0.32} />
      <Drop count={16} geometry={geo.clove} colors={C.clove} t0={1.3} t1={1.95} y={0.32} />
      <Drop count={6} geometry={geo.anise} colors={C.anise} t0={1.35} t1={1.95} y={0.32} />
      <Drop count={40} geometry={geo.ring} colors={C.shallot} t0={1.1} t1={1.7} y={0.31} />
      <Drop count={14} geometry={geo.leaf} colors={C.curry} t0={1.4} t1={1.95} y={0.33} />

      <Drop count={18} geometry={geo.chunk} colors={C.meat} t0={2.2} t1={2.85} y={0.54} radius={1.05} roughness={0.5} />
      <Drop count={22} geometry={geo.leaf} colors={C.mint} t0={2.4} t1={2.95} y={0.6} />

      <group ref={rice}>
        <Grains count={geo.grains} geometry={geo.grain} colors={C.rice} radius={1.38} />
      </group>
      <mesh ref={ghee}>
        <cylinderGeometry args={[0.028, 0.02, 1, 10, 1, true]} />
        <meshStandardMaterial color="#f2b33d" emissive="#6a3a00" roughness={0.05} metalness={0.1} />
      </mesh>

      <Drop count={36} geometry={geo.cashew} colors={C.cashew} t0={4.3} t1={4.85} y={0.83} radius={1.2} roughness={0.45} />
      <Drop count={60} geometry={geo.sliver} colors={C.onion} t0={4.25} t1={4.8} y={0.82} radius={1.25} roughness={0.5} />
      <Drop count={30} geometry={geo.leaf} colors={C.coriander} t0={4.4} t1={4.95} y={0.84} radius={1.2} scale={0.8} />
      <Drop count={16} geometry={geo.raisin} colors={C.raisin} t0={4.35} t1={4.9} y={0.82} radius={1.15} roughness={0.3} />

      <mesh ref={seal} position-y={RIM_Y} rotation-x={Math.PI / 2}>
        <torusGeometry args={[RIM_R + 0.04, 0.07, 10, 96]} />
        <meshStandardMaterial color={DOUGH} roughness={1} />
      </mesh>

      <group ref={lid} visible={false}>
        <mesh geometry={geo.lid} material={copperMat} />
        <mesh position-y={0.42}>
          <sphereGeometry args={[0.12, 24, 16]} />
          <meshStandardMaterial color="#c9a14a" metalness={1} roughness={0.25} />
        </mesh>
        {/* Embers on the lid: heat from above as well as below, the Malabar way. */}
        <group ref={coals} position-y={0.2}>
          {Array.from({ length: 9 }, (_, i) => {
            const a = (i / 9) * Math.PI * 2;
            const rr = 0.55 + (i % 3) * 0.25;
            return (
              <mesh key={i} position={[Math.cos(a) * rr, 0.16 - rr * 0.12, Math.sin(a) * rr]} scale={[1, 0.6, 1]}>
                <dodecahedronGeometry args={[0.1]} />
                <meshStandardMaterial color="#1a0c06" emissive="#ff4a10" emissiveIntensity={1.5} roughness={1} />
              </mesh>
            );
          })}
        </group>
      </group>
    </group>
  );
}

/* ---------- hearth & kitchen ---------- */

function Hearth({ tex }) {
  const fireLight = useRef();
  const frontLight = useRef();
  const bed = useRef();
  const embers = useRef();

  const stones = useMemo(
    () =>
      Array.from({ length: 7 }, (_, i) => {
        const a = (i / 7) * Math.PI * 2 + 0.3;
        return { p: [Math.cos(a) * 1.15, -0.42, Math.sin(a) * 1.15], r: [Math.random(), Math.random() * 6, Math.random()], s: [1, 0.8 + Math.random() * 0.3, 0.9] };
      }),
    []
  );
  const logs = useMemo(() => [0.2, 1.4, 2.6, 3.7, 5.0].map((a) => ({ a, len: 1.6 + Math.random() * 0.5 })), []);

  useFrame(({ clock }) => {
    const t = clock.elapsedTime;
    const flicker = 0.8 + 0.12 * Math.sin(t * 13) + 0.08 * Math.sin(t * 7.3 + 1) + 0.06 * Math.sin(t * 23);
    fireLight.current.intensity = 22 * S.fire * flicker;
    frontLight.current.intensity = 9 * S.fire * flicker;
    bed.current.material.opacity = 0.55 * S.fire * flicker;
    embers.current.material.emissiveIntensity = 2 * S.fire * flicker;
  });

  return (
    <group>
      <pointLight ref={fireLight} position={[0, -0.3, 0]} color="#ff7a1f" distance={9} decay={2} />
      <pointLight ref={frontLight} position={[0.5, -0.2, 1.6]} color="#ff9a3c" distance={6} decay={2} />

      {stones.map((s, i) => (
        <mesh key={i} position={s.p} rotation={s.r} scale={s.s}>
          <dodecahedronGeometry args={[0.32, 0]} />
          <meshStandardMaterial color="#3a332d" roughness={1} />
        </mesh>
      ))}
      {logs.map(({ a, len }) => (
        <mesh key={a} position={[Math.cos(a) * 1.0, -0.6, Math.sin(a) * 1.0]} rotation={[0, -a, Math.PI / 2]}>
          <cylinderGeometry args={[0.09, 0.11, len, 9]} />
          <meshStandardMaterial color="#2b1c12" roughness={1} />
        </mesh>
      ))}
      <mesh ref={embers} position-y={-0.62}>
        <icosahedronGeometry args={[0.45, 1]} />
        <meshStandardMaterial color="#1a0c06" emissive="#ff4a10" roughness={1} flatShading />
      </mesh>
      {/* Glow of the ember bed on the floor. */}
      <mesh ref={bed} position-y={-0.68} rotation-x={-Math.PI / 2}>
        <planeGeometry args={[4.5, 4.5]} />
        <meshBasicMaterial map={tex.soft} color="#ff6a1a" transparent depthWrite={false} blending={THREE.AdditiveBlending} />
      </mesh>

      <mesh position-y={-0.7} rotation-x={-Math.PI / 2}>
        <planeGeometry args={[40, 40]} />
        <meshStandardMaterial color="#17110d" roughness={0.92} />
      </mesh>
      {/* Laterite back wall and a shelf of clay and brass vessels, mostly lost in shadow. */}
      <mesh position={[0, 3, -6]}>
        <planeGeometry args={[30, 12]} />
        <meshStandardMaterial color="#2a1810" roughness={1} />
      </mesh>
      <mesh position={[-2.6, 0.25, -4.6]}>
        <boxGeometry args={[4.2, 0.1, 0.9]} />
        <meshStandardMaterial color="#2e1f14" roughness={0.9} />
      </mesh>
      {[[-4, "#6a3420", 0], [-3.1, "#c9a14a", 1], [-2.2, "#7a3d22", 0], [-1.3, "#b8683a", 1]].map(([x, color, metal]) => (
        <mesh key={x} position={[x, 0.3, -4.6]} scale={0.32}>
          <latheGeometry args={[POT_PROFILE.slice(0, 9), 32]} />
          <meshStandardMaterial color={color} metalness={metal} roughness={metal ? 0.35 : 0.9} />
        </mesh>
      ))}
      {/* Shaft of window light through the smoke. */}
      <mesh position={[-3.2, 3.2, -1.5]} rotation={[0.25, 0, 0.55]}>
        <cylinderGeometry args={[0.35, 1.8, 9, 24, 1, true]} />
        <meshBasicMaterial color="#ffcf9a" transparent opacity={0.035} side={THREE.DoubleSide} depthWrite={false} blending={THREE.AdditiveBlending} />
      </mesh>
    </group>
  );
}

function Kitchen({ lowTier, onFail }) {
  const tex = useTextures();
  const world = useRef();
  // When real footage covers the current chapter, keep only the atmosphere (embers + steam) over the video.
  useFrame(() => (world.current.visible = !story.footage));

  return (
    <>
      <Director onFail={onFail} />
      <Environment />
      <color attach="background" args={["#0a0a0a"]} />
      <fog attach="fog" args={["#0a0a0a", 9, 20]} />
      <ambientLight intensity={0.06} />
      <spotLight position={[-3, 6, 2.5]} angle={0.55} penumbra={1} intensity={45} color="#ffd2a1" />
      <directionalLight position={[2, 3, -5]} intensity={0.35} color="#8aa0c8" />
      <group ref={world}>
        <Hearth tex={tex} />
        <Pot lowTier={lowTier} tex={tex} />
        <Particles count={lowTier ? 60 : 140} texture={tex.soft} update={updateFlames} />
      </group>
      <Particles count={lowTier ? 30 : 70} texture={tex.soft} update={updateEmbers} />
      <Particles count={lowTier ? 28 : 64} texture={tex.puff} update={updateSteam} blending={THREE.NormalBlending} />
    </>
  );
}

export default function KitchenScene({ tier, onFail }) {
  const low = tier === "low";
  return (
    <Canvas
      frameloop="demand"
      dpr={low ? [1, 1.25] : [1, 1.75]}
      camera={{ fov: 35, near: 0.1, far: 40, position: CAM[0][0].toArray() }}
      gl={{ antialias: !low, powerPreference: "high-performance" }}
      onCreated={({ gl }) => {
        gl.toneMapping = THREE.ACESFilmicToneMapping;
        gl.toneMappingExposure = 1.15;
        gl.domElement.addEventListener("webglcontextlost", (e) => {
          e.preventDefault();
          onFail();
        });
      }}
    >
      <FrameCap fps={low ? 30 : 60} />
      <Kitchen lowTier={low} onFail={onFail} />
    </Canvas>
  );
}
