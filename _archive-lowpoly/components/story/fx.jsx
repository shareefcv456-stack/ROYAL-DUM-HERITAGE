"use client";

import { useFrame } from "@react-three/fiber";
import { useMemo, useRef } from "react";
import * as THREE from "three";
import { glowTexture, puffTexture } from "./textures";

let puff, glow;
const textures = { puff: () => (puff ??= puffTexture()), glow: () => (glow ??= glowTexture()) };

const vertex = /* glsl */ `
  attribute vec4 aSeed;
  uniform float uTime, uRise, uSize, uSpeed, uSwirl, uScale, uSpread;
  varying float vAlpha, vRot;
  void main() {
    float life = fract(uTime * uSpeed * (0.6 + aSeed.x * 0.8) + aSeed.y);
    vec3 p = position;
    float ang = (uSwirl * life + aSeed.z) * 6.2831;
    p.xz *= 1.0 + life * uSpread;
    p.x += sin(uTime * 0.6 + aSeed.z * 20.0) * 0.18 * life + cos(ang) * uSwirl * 0.35 * life;
    p.z += cos(uTime * 0.5 + aSeed.w * 20.0) * 0.18 * life + sin(ang) * uSwirl * 0.35 * life;
    p.y += life * uRise;
    vec4 mv = modelViewMatrix * vec4(p, 1.0);
    gl_Position = projectionMatrix * mv;
    gl_PointSize = uSize * (0.45 + life) * (0.6 + aSeed.w * 0.8) * uScale / -mv.z;
    vAlpha = sin(life * 3.14159) * (0.4 + aSeed.x * 0.6);
    vRot = aSeed.z * 6.2831 + uTime * (aSeed.w - 0.5) * 0.5;
  }
`;

const fragment = /* glsl */ `
  uniform sampler2D uMap;
  uniform vec3 uColor;
  uniform float uOpacity;
  varying float vAlpha, vRot;
  void main() {
    vec2 c = gl_PointCoord - 0.5;
    float s = sin(vRot), co = cos(vRot);
    vec4 tex = texture2D(uMap, mat2(co, -s, s, co) * c + 0.5);
    float a = tex.a * vAlpha * uOpacity;
    if (a < 0.003) discard;
    gl_FragColor = vec4(uColor, a);
  }
`;

/**
 * GPU particle emitter. All motion happens in the vertex shader, so the CPU cost per
 * frame is a few uniform writes no matter how many particles are on screen.
 * `amount` is a function read every frame (0..1), so the GSAP timeline can drive it.
 */
export function Particles({ count, amount, emitter = "disc", radius = 1, height = 0, position, rise = 2.5, size = 1, speed = 0.12, spread = 0.8, swirl = 0, color = "#fff1dc", opacity = 0.3, additive = false, texture = "puff" }) {
  const mat = useRef();
  const { positions, seeds } = useMemo(() => {
    const positions = new Float32Array(count * 3);
    const seeds = new Float32Array(count * 4);
    for (let i = 0; i < count; i++) {
      const a = Math.random() * Math.PI * 2;
      const r = emitter === "ring" ? radius * (0.96 + Math.random() * 0.08) : radius * Math.sqrt(Math.random());
      positions.set([Math.cos(a) * r, Math.random() * height, Math.sin(a) * r], i * 3);
      seeds.set([Math.random(), Math.random(), Math.random(), Math.random()], i * 4);
    }
    return { positions, seeds };
  }, [count, emitter, radius, height]);

  const uniforms = useMemo(
    () => ({
      uTime: { value: 0 }, uRise: { value: rise }, uSize: { value: size }, uSpeed: { value: speed },
      uSwirl: { value: swirl }, uSpread: { value: spread }, uScale: { value: 500 },
      uOpacity: { value: 0 }, uColor: { value: new THREE.Color(color) }, uMap: { value: textures[texture]() },
    }),
    [rise, size, speed, swirl, spread, color, texture],
  );

  useFrame((state) => {
    const u = mat.current.uniforms;
    u.uTime.value = state.clock.elapsedTime;
    u.uOpacity.value = opacity * amount();
    // World-size -> pixel-size factor for gl_PointSize.
    u.uScale.value = (state.size.height * state.viewport.dpr) / (2 * Math.tan(THREE.MathUtils.degToRad(state.camera.fov) / 2));
  });

  return (
    <points position={position} frustumCulled={false}>
      <bufferGeometry>
        <bufferAttribute attach="attributes-position" args={[positions, 3]} />
        <bufferAttribute attach="attributes-aSeed" args={[seeds, 4]} />
      </bufferGeometry>
      <shaderMaterial
        ref={mat}
        vertexShader={vertex}
        fragmentShader={fragment}
        uniforms={uniforms}
        transparent
        depthWrite={false}
        blending={additive ? THREE.AdditiveBlending : THREE.NormalBlending}
      />
    </points>
  );
}

// Fake volumetric light cone: brightest at the apex, fading toward the edges.
export function LightShaft({ position, height = 5, radius = 1.6, intensity }) {
  const mat = useRef();
  const uniforms = useMemo(() => ({ uOpacity: { value: 0 }, uColor: { value: new THREE.Color("#ffcf8a") } }), []);
  useFrame(() => (mat.current.uniforms.uOpacity.value = intensity()));
  return (
    <mesh position={position}>
      <coneGeometry args={[radius, height, 48, 1, true]} />
      <shaderMaterial
        ref={mat}
        uniforms={uniforms}
        transparent
        depthWrite={false}
        side={THREE.DoubleSide}
        blending={THREE.AdditiveBlending}
        vertexShader={/* glsl */ `
          varying float vY; varying vec3 vN, vV;
          void main() {
            vY = uv.y;
            vec4 mv = modelViewMatrix * vec4(position, 1.0);
            vN = normalize(normalMatrix * normal);
            vV = normalize(-mv.xyz);
            gl_Position = projectionMatrix * mv;
          }`}
        fragmentShader={/* glsl */ `
          uniform float uOpacity; uniform vec3 uColor;
          varying float vY; varying vec3 vN, vV;
          void main() {
            float edge = pow(abs(dot(vN, vV)), 2.0);
            gl_FragColor = vec4(uColor, edge * pow(vY, 1.4) * 0.11 * uOpacity);
          }`}
      />
    </mesh>
  );
}

export const glowMap = () => textures.glow();
