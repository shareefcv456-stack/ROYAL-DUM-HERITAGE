"use client";

import { Canvas, useFrame, useThree } from "@react-three/fiber";
import { useEffect, useLayoutEffect, useMemo, useRef } from "react";
import * as THREE from "three";
import { RoomEnvironment } from "three/examples/jsm/environments/RoomEnvironment.js";

const { damp, smoothstep, lerp } = THREE.MathUtils;
const v2 = (pts) => pts.map(([x, y]) => new THREE.Vector2(x, y));

// Handi silhouette: outer wall up to a flared rim, then back down the inner wall.
const POT_PROFILE = v2([
  [0, 0.02], [0.7, 0], [1.05, 0.12], [1.3, 0.45], [1.36, 0.72], [1.26, 1.02], [1.06, 1.22],
  [1.02, 1.32], [1.16, 1.42], [1.14, 1.47], [0.97, 1.38], [0.96, 1.22], [1.18, 1.0],
  [1.27, 0.72], [1.22, 0.47], [0.98, 0.18], [0.65, 0.08], [0, 0.1],
]);
const LID_PROFILE = v2([
  [0, 0.3], [0.35, 0.27], [0.75, 0.16], [1.05, 0.04], [1.18, 0], [1.18, -0.03], [1.0, 0], [0.7, 0.12], [0, 0.25],
]);
const RIM_Y = 1.45;

// Three dum layers, bottom to top: masala & meat, plain rice, saffron rice.
const LAYERS = [
  { y: 0.55, base: "#4a1d0c", label: "masala" },
  { y: 0.8, base: "#eee4cf", label: "rice" },
  { y: 1.05, base: "#efd193", label: "saffron" },
];

function Environment() {
  const { gl, scene } = useThree();
  useEffect(() => {
    const pmrem = new THREE.PMREMGenerator(gl);
    const env = pmrem.fromScene(new RoomEnvironment(), 0.04).texture;
    scene.environment = env;
    return () => {
      scene.environment = null;
      env.dispose();
      pmrem.dispose();
    };
  }, [gl, scene]);
  return null;
}

// Renders on demand, at most `fps` times a second, and only while the hero is on screen.
function FrameCap({ fps, active }) {
  const invalidate = useThree((s) => s.invalidate);
  useEffect(() => {
    const step = 1000 / fps;
    let last = 0;
    let id = requestAnimationFrame(function loop(t) {
      id = requestAnimationFrame(loop);
      if (!active.current || t - last < step - 1) return;
      last = t - ((t - last) % step);
      invalidate();
    });
    return () => cancelAnimationFrame(id);
  }, [fps, active, invalidate]);
  return null;
}

// Scatters `count` instances of `geometry` across a disc on top of a layer.
function Scatter({ count, geometry, colors, y, radius = 0.84, flat = true, roughness = 0.55 }) {
  const ref = useRef();
  useLayoutEffect(() => {
    const o = new THREE.Object3D();
    const c = new THREE.Color();
    for (let i = 0; i < count; i++) {
      const r = radius * Math.sqrt(Math.random());
      const a = Math.random() * Math.PI * 2;
      o.position.set(r * Math.cos(a), y + Math.random() * 0.035, r * Math.sin(a));
      if (flat) o.rotation.set(Math.PI / 2 + (Math.random() - 0.5) * 0.5, 0, Math.random() * Math.PI * 2);
      else o.rotation.set(Math.random() * 6, Math.random() * 6, Math.random() * 6);
      o.scale.setScalar(0.8 + Math.random() * 0.45);
      o.updateMatrix();
      ref.current.setMatrixAt(i, o.matrix);
      ref.current.setColorAt(i, c.set(colors[(Math.random() * colors.length) | 0]));
    }
    ref.current.instanceMatrix.needsUpdate = true;
    ref.current.instanceColor.needsUpdate = true;
  }, [count, colors, y, radius, flat]);
  return (
    <instancedMesh ref={ref} args={[geometry, undefined, count]}>
      <meshStandardMaterial roughness={roughness} />
    </instancedMesh>
  );
}

function Steam({ amount, count }) {
  const ref = useRef();
  const { positions, seeds, texture } = useMemo(() => {
    const positions = new Float32Array(count * 3);
    const seeds = Array.from({ length: count }, () => ({
      a: Math.random() * Math.PI * 2,
      r: Math.random() * 0.7,
      speed: 0.35 + Math.random() * 0.4,
      life: Math.random(),
    }));
    const cv = document.createElement("canvas");
    cv.width = cv.height = 64;
    const g = cv.getContext("2d");
    const grad = g.createRadialGradient(32, 32, 0, 32, 32, 32);
    grad.addColorStop(0, "rgba(255,244,225,1)");
    grad.addColorStop(1, "rgba(255,244,225,0)");
    g.fillStyle = grad;
    g.fillRect(0, 0, 64, 64);
    return { positions, seeds, texture: new THREE.CanvasTexture(cv) };
  }, [count]);

  useEffect(() => () => texture.dispose(), [texture]);

  useFrame((state, dt) => {
    const t = state.clock.elapsedTime;
    const pos = ref.current.geometry.attributes.position;
    seeds.forEach((s, i) => {
      s.life = (s.life + dt * s.speed * 0.35) % 1;
      const spread = s.r + s.life * 0.6;
      pos.array[i * 3] = Math.cos(s.a) * spread + Math.sin(t * 0.8 + i) * 0.12 * s.life;
      pos.array[i * 3 + 1] = RIM_Y + s.life * 2.4;
      pos.array[i * 3 + 2] = Math.sin(s.a) * spread;
    });
    pos.needsUpdate = true;
    ref.current.material.opacity = 0.16 * amount.current;
  });

  return (
    <points ref={ref} frustumCulled={false}>
      <bufferGeometry>
        <bufferAttribute attach="attributes-position" args={[positions, 3]} />
      </bufferGeometry>
      <pointsMaterial map={texture} size={0.9} transparent depthWrite={false} blending={THREE.AdditiveBlending} opacity={0} />
    </points>
  );
}

function Handi({ progress, lowTier }) {
  const root = useRef();
  const lid = useRef();
  const seal = useRef();
  const layerRefs = useRef([]);
  const eased = useRef(0);
  const steamAmount = useRef(0);
  const lookAt = useMemo(() => new THREE.Vector3(), []);

  const geo = useMemo(() => {
    const k = lowTier ? 0.5 : 1;
    return {
      pot: new THREE.LatheGeometry(POT_PROFILE, lowTier ? 48 : 96),
      lid: new THREE.LatheGeometry(LID_PROFILE, lowTier ? 48 : 96),
      grain: new THREE.CapsuleGeometry(0.013, 0.07, 2, 5),
      chunk: new THREE.DodecahedronGeometry(0.11),
      pod: new THREE.SphereGeometry(0.03, 8, 6).scale(1, 1, 1.9),
      leaf: new THREE.CircleGeometry(0.045, 6).scale(1, 1.8, 1),
      grains: { rice: Math.round(700 * k), saffron: Math.round(900 * k) },
    };
  }, [lowTier]);
  useEffect(() => () => Object.values(geo).forEach((g) => g.dispose?.()), [geo]);

  useFrame((state, dt) => {
    // Damping turns raw scroll position into a weighted, cinematic glide — same feel on wheel, trackpad and touch.
    eased.current = damp(eased.current, progress.current, 3, Math.min(dt, 0.1));
    const p = eased.current;
    const t = state.clock.elapsedTime;
    const open = smoothstep(p, 0.1, 0.42);
    const explode = smoothstep(p, 0.45, 0.85);

    root.current.rotation.y = p * Math.PI * 0.9 + Math.sin(t * 0.3) * 0.05;
    root.current.position.y = -explode * 0.5;

    lid.current.position.set(open * 1.3 + explode * 2.6, RIM_Y + open * 1.5 + explode * 2.2, 0);
    lid.current.rotation.z = -open * 0.55;
    seal.current.scale.setScalar(Math.max(1 - open * 1.4, 0.001));

    layerRefs.current.forEach((g, i) => {
      g.position.y = LAYERS[i].y + explode * (0.9 + i * 0.85);
      g.rotation.y = explode * (i - 1) * 0.5;
    });

    steamAmount.current = open * (1 - explode * 0.6);

    const { width, height } = state.size;
    const dist = width < height ? 1.55 : 1;
    // On wide screens the pot drifts opposite each caption (captions alternate left/right per chapter).
    const sway = width >= 900 ? Math.cos(p * Math.PI * 3) * 1.6 : 0;
    state.camera.position.set(-sway, lerp(2.7, 3.6, explode) * dist, lerp(6.2, 7.6, explode) * dist);
    state.camera.lookAt(lookAt.set(-sway, lerp(0.75, 2.1, explode), 0));
  });

  return (
    <>
      <group ref={root}>
        <mesh geometry={geo.pot}>
          <meshStandardMaterial color="#b87333" metalness={1} roughness={0.27} side={THREE.DoubleSide} />
        </mesh>
        {[[1.262, 1.02], [1.357, 0.72]].map(([r, y]) => (
          <mesh key={y} position-y={y} rotation-x={Math.PI / 2}>
            <torusGeometry args={[r, 0.022, 10, 96]} />
            <meshStandardMaterial color="#d4af37" metalness={1} roughness={0.2} />
          </mesh>
        ))}
        {[1, -1].map((s) => (
          <mesh key={s} position={[s * 1.16, 1.12, 0]} rotation-z={-s * Math.PI / 2}>
            <torusGeometry args={[0.17, 0.034, 12, 32, Math.PI]} />
            <meshStandardMaterial color="#d4af37" metalness={1} roughness={0.25} />
          </mesh>
        ))}

        {/* Atta dough seal that breaks as the lid lifts — the "dum". */}
        <mesh ref={seal} position-y={1.43} rotation-x={Math.PI / 2}>
          <torusGeometry args={[1.07, 0.055, 10, 72]} />
          <meshStandardMaterial color="#d8c39a" roughness={1} />
        </mesh>

        <group ref={lid}>
          <mesh geometry={geo.lid}>
            <meshStandardMaterial color="#b87333" metalness={1} roughness={0.24} side={THREE.DoubleSide} />
          </mesh>
          <mesh position-y={0.4}>
            <sphereGeometry args={[0.11, 24, 16]} />
            <meshStandardMaterial color="#d4af37" metalness={1} roughness={0.18} />
          </mesh>
        </group>

        {LAYERS.map((layer, i) => (
          <group key={layer.label} ref={(g) => (layerRefs.current[i] = g)} position-y={layer.y}>
            <mesh>
              <cylinderGeometry args={[0.9, 0.9, 0.16, 48]} />
              <meshStandardMaterial color={layer.base} roughness={0.85} />
            </mesh>
            {layer.label === "masala" && (
              <>
                <Scatter count={16} geometry={geo.chunk} colors={["#6b3418", "#7a3d1c", "#5a2a12"]} y={0.1} radius={0.7} flat={false} roughness={0.7} />
                <Scatter count={24} geometry={geo.pod} colors={["#7a8b3a", "#2b1a10", "#8c5a2b"]} y={0.09} flat={false} />
              </>
            )}
            {layer.label === "rice" && (
              <Scatter count={geo.grains.rice} geometry={geo.grain} colors={["#f7f1e3", "#efe7d4", "#fffaf0"]} y={0.09} />
            )}
            {layer.label === "saffron" && (
              <>
                <Scatter count={geo.grains.saffron} geometry={geo.grain} colors={["#fbf4e4", "#f4c542", "#e8a317", "#f7f1e3", "#d9822b"]} y={0.09} />
                <Scatter count={40} geometry={geo.leaf} colors={["#3f7d3a", "#2f6a2e", "#6b3a1c"]} y={0.12} radius={0.75} />
              </>
            )}
          </group>
        ))}
      </group>
      <Steam amount={steamAmount} count={lowTier ? 30 : 70} />
    </>
  );
}

export default function PotScene({ progress, active, tier, onFail }) {
  const low = tier === "low";
  return (
    <Canvas
      frameloop="demand"
      dpr={low ? 1 : [1, 1.75]}
      camera={{ fov: 38, position: [0, 2.7, 6.2] }}
      gl={{ antialias: !low, powerPreference: "high-performance", alpha: true }}
      onCreated={({ gl }) => {
        gl.toneMapping = THREE.ACESFilmicToneMapping;
        gl.domElement.addEventListener("webglcontextlost", (e) => {
          e.preventDefault();
          onFail();
        });
      }}
      style={{ touchAction: "pan-y" }}
    >
      <FrameCap fps={low ? 30 : 60} active={active} />
      <Environment />
      <ambientLight intensity={0.25} />
      <spotLight position={[3, 6, 4]} angle={0.5} penumbra={0.8} intensity={60} color="#ffd9a0" />
      <pointLight position={[-3, 2, -2]} intensity={12} color="#d4af37" />
      <Handi progress={progress} lowTier={low} />
    </Canvas>
  );
}
