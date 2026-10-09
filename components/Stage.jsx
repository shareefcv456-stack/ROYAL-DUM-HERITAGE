"use client";

import { Canvas, useFrame, useThree } from "@react-three/fiber";
import { useEffect, useMemo, useRef } from "react";
import * as THREE from "three";
import { CLIMAX, COSMOS, PLATES, burst, shot, transit } from "./plates";
import { story } from "./state";

const { damp, lerp, clamp } = THREE.MathUtils;
const IMG_W = 1376;
const IMG_ASPECT = IMG_W / 768;

/* ======================= photographic plate shader ======================= */

const VERT = `varying vec2 vUv; void main() { vUv = uv; gl_Position = vec4(position.xy * 2.0, 0.0, 1.0); }`;

const FRAG = `
uniform sampler2D uA, uB, uAd, uBd, uMono;
uniform float uMix, uTime, uBurst;
uniform vec2 uMouse, uLight, uRes, uShake, uDrift;
uniform vec2 uAc, uAk, uBc, uBk;
uniform float uAgl, uBgl, uVel, uStyle, uVoid;
uniform vec2 uApar, uBpar, uAfoc, uBfoc; // camera translate per shot; focus depth + blur radius
uniform vec3 uAst, uBst;
uniform vec4 uSteam, uFire;
varying vec2 vUv;
const float IA = ${IMG_ASPECT.toFixed(4)};
const vec2 TX = vec2(${(1.5 / IMG_W).toFixed(6)}, ${(1.5 / 768).toFixed(6)});

float hash(vec2 p) { return fract(sin(dot(p, vec2(127.1, 311.7))) * 43758.5453); }
float noise(vec2 p) {
  vec2 i = floor(p), f = fract(p); f = f * f * (3. - 2. * f);
  return mix(mix(hash(i), hash(i + vec2(1, 0)), f.x), mix(hash(i + vec2(0, 1)), hash(i + vec2(1, 1)), f.x), f.y);
}
float fbm(vec2 p) { float v = 0., a = .5; for (int i = 0; i < 4; i++) { v += a * noise(p); p = p * 2.03 + 17.; a *= .5; } return v; }
float lumOf(vec3 c) { return dot(c, vec3(.299, .587, .114)); }

// One photograph: cover-fitted, displaced by its depth map, lit by the cursor, stamped with the brand seal.
vec3 plate(sampler2D tex, sampler2D dep, vec2 s, vec2 c, vec2 k, float gl, vec3 st, vec2 par, vec2 foc) {
  vec2 uv = (s - .5) * k + c;
  // 2.5D camera: every depth layer shifts in proportion to its distance, so near layers (meat, pot,
  // grains) glide faster than the background. Sources: the shot's own scroll-driven dolly, the cursor,
  // a handheld drift, and scroll velocity (near layers lead the scroll like a camera on a slider).
  float d = texture2D(dep, uv).r;
  float z = d - .5;
  vec2 cam = par + uMouse * .6 + uDrift + vec2(0., -uVel);
  uv += cam * z * .036 * k;
  uv = clamp(uv, .001, .999);
  vec3 col = texture2D(tex, uv).rgb;
  // Depth of field: blur grows with distance from the focal depth; racking focus slides it through the scene.
  float r = abs(d - foc.x) * foc.y;
  if (r > .0003) {
    vec3 acc = col;
    for (int i = 0; i < 8; i++) {
      float a = float(i) * 2.39996 + 1.;
      acc += texture2D(tex, clamp(uv + vec2(cos(a), sin(a) * IA) * sqrt((float(i) + .5) / 8.) * r, .001, .999)).rgb;
    }
    col = acc / 9.;
  }
  float lum = lumOf(col);
  float sat = max(col.r, max(col.g, col.b)) - min(col.r, min(col.g, col.b));

  // Surface normal from the photo's own fine detail; the cursor is a moving light that slides
  // highlights across fat, oil and ghee like a real reflection.
  float hx = lumOf(texture2D(tex, uv + vec2(TX.x, 0.)).rgb) - lumOf(texture2D(tex, uv - vec2(TX.x, 0.)).rgb);
  float hy = lumOf(texture2D(tex, uv + vec2(0., TX.y)).rgb) - lumOf(texture2D(tex, uv - vec2(0., TX.y)).rgb);
  vec3 n = normalize(vec3(-hx * 6., -hy * 6., 1.));
  vec3 L = normalize(vec3((uLight - s) * vec2(IA, 1.), .55));
  float spec = pow(max(dot(n, normalize(L + vec3(0., 0., 1.))), 0.), 48.);
  float gloss = smoothstep(.3, .75, lum) * smoothstep(.06, .25, sat); // fat, oil, ghee; not white cloth
  col += vec3(1., .88, .66) * spec * gloss * gl * 1.1;
  // Oil sheen: a slow liquid caustic shimmer on the glossiest pixels.
  float caustic = pow(noise(uv * vec2(90., 50.) + vec2(uTime * .6, -uTime * .4)), 6.);
  col += vec3(1., .85, .55) * caustic * gloss * gl * .5;

  if (st.z > 0.) {
    vec2 d = vec2(uv.x - st.x, (uv.y - st.y) / IA) / st.z;
    if (abs(d.x) < 1. && abs(d.y) < 1.) {
      float m = texture2D(uMono, d * .5 + .5).a;
      float hi = texture2D(uMono, d * .5 + .5 + vec2(-.012, .012)).a;
      col *= 1. - m * .45;                                 // debossed into the gold foil
      col += vec3(1., .86, .55) * max(hi - m, 0.) * .35;   // lit upper edge
    }
  }
  return col;
}

void main() {
  vec2 asp = vec2(uRes.x / uRes.y, 1.);
  vec2 s = vUv + uShake;
  vec2 fq = (s - uFire.xy) * asp;
  float fr = uFire.z * asp.x + 1e-4;

  // Heat shimmer above the fire.
  float heat = uFire.w * exp(-dot(fq, fq) / (fr * fr * 8.));
  s.x += sin(s.y * 70. + uTime * 4.) * .0016 * heat;

  // Liquid morph between shots: both images ride the same flow field in opposite directions, so the outgoing
  // shot pours into the incoming one, and the seam itself is advected by the flow.
  float bell = uStyle < .5 ? sin(uMix * 3.14159) : 0.;
  vec2 q = s * asp * 1.6;
  vec2 flow = (vec2(fbm(q + uTime * .12), fbm(q + 7.3 - uTime * .1)) - .5) * bell;
  vec3 col;
  if (uStyle > .5 && uMix > .001) {
    // Directional split: a torn seam runs down the frame; the moving shot's halves slide apart to the left and
    // right margins (split) or sweep in from them (converge). Near layers ride further than far ones.
    bool split = uStyle < 1.5;
    float e = split ? uMix : 1. - uMix;
    e = e * e * (3. - 2. * e) * .62;
    float seam = .5 + (fbm(vec2(s.y * 3.5, 1.7)) - .5) * .1;
    float side = s.x < seam ? -1. : 1.;
    vec2 sm = s - vec2(side * e, 0.);
    vec3 top = split
      ? plate(uA, uAd, sm, uAc, uAk, uAgl, uAst, uApar + vec2(side * e * 9., 0.), uAfoc)
      : plate(uB, uBd, sm, uBc, uBk, uBgl, uBst, uBpar + vec2(side * e * 9., 0.), uBfoc);
    vec3 under = split
      ? plate(uB, uBd, s, uBc, uBk, uBgl, uBst, uBpar, uBfoc)
      : plate(uA, uAd, s, uAc, uAk, uAgl, uAst, uApar, uAfoc);
    // Where the moving half has left, the shot underneath shows through; its torn edge casts a soft shadow
    // and catches a line of warm light.
    float gap = side * (s.x - seam) - e; // < 0 inside the opened gap
    float onTop = smoothstep(-.003, .003, gap);
    under *= 1. - .35 * exp(-max(-gap, 0.) * 60.) * step(.001, e);
    col = mix(under, top, onTop) + vec3(1., .62, .3) * exp(-gap * gap * 30000.) * .2 * step(.001, e);
  } else {
    col = plate(uA, uAd, s + flow * .1 * uMix, uAc, uAk, uAgl, uAst, uApar, uAfoc);
  }
  if (uStyle < .5 && uMix > .001) {
    vec3 b = plate(uB, uBd, s - flow * .1 * (1. - uMix), uBc, uBk, uBgl, uBst, uBpar, uBfoc);
    float nn = fbm(s * asp * 2.2 + flow * 2.5 + uTime * .03);
    float m = smoothstep(nn - .2, nn + .2, uMix * 1.4 - .2);
    float edge = 1. - abs(m * 2. - 1.);
    col = mix(col, b, m) * (1. + bell * .06) + vec3(1., .6, .3) * edge * .1;
  }
  float lum = lumOf(col);
  float sat = max(col.r, max(col.g, col.b)) - min(col.r, min(col.g, col.b));

  // Living firelight: an uneven, dancing flicker that catches copper and the chef's white jacket.
  float fall = uFire.w * exp(-dot(fq, fq) / (fr * fr * 40.));
  float fl = (noise(vec2(uTime * 7., 0.)) - .5) + (noise(fq * 3. + uTime * 3.) - .5) * .8;
  float copper = clamp((col.r - col.b) * 2.2 - .25, 0., 1.) * smoothstep(.06, .45, lum);
  float cloth = (1. - smoothstep(.08, .25, sat)) * smoothstep(.35, .8, lum);
  col *= 1. + fall * fl * (copper * 1.1 + cloth * .6 + .25);
  // Low ember glow from the fire's direction, so dark areas never go dead black.
  col += vec3(1., .38, .1) * uFire.w * exp(-dot(fq, fq) / (fr * fr * 3.)) * (.09 + fl * .03);
  col += vec3(1., .5, .18) * fall * cloth * max(fl, 0.) * .06;

  // Volumetric steam: turbulent column that widens as it rises (3D puffs are layered on top separately).
  vec2 sq = (s - uSteam.xy) * asp;
  float w = uSteam.z * asp.x * (1. + max(sq.y, 0.) * 2.2) + 1e-4;
  float column = exp(-pow(sq.x / w, 2.)) * smoothstep(-.03, .08, sq.y) * (1. - smoothstep(.25, 1.1, sq.y));
  vec2 p = vec2(sq.x * 3.2, sq.y * 2.2 - uTime * .22);
  float puff = fbm(p + fbm(p * 1.4 + uTime * .08) * 1.6);
  float steam = smoothstep(.42, .88, puff) * column * uSteam.w * (1. + uBurst * 1.8);
  col = mix(col, vec3(.95, .9, .84), clamp(steam, 0., 1.) * .55);

  // Charcoal haze drifting through the dark areas, warmed near the fire.
  float dark = 1. - smoothstep(.02, .3, lum);
  float hz = fbm(s * asp * 1.6 + vec2(uTime * .02, -uTime * .015));
  col += vec3(.17, .09, .04) * hz * hz * dark * (.7 + fall * 1.5);

  // Anamorphic lens flare off the fire: a horizontal streak plus soft ghosts mirrored through the lens centre.
  vec2 fd = (s - uFire.xy) * asp;
  float flick = .85 + fl * .3;
  col += vec3(1., .5, .18) * uFire.w * exp(-fd.y * fd.y * 1400.) * exp(-abs(fd.x) * 2.4) * .2 * flick;
  col += vec3(1., .7, .4) * uFire.w * exp(-dot(fd, fd) * 60.) * .12 * flick;
  for (int i = 1; i <= 3; i++) {
    vec2 gp = .5 + (.5 - uFire.xy) * (float(i) * .45);
    float gd = length((s - gp) * asp);
    float gr = .03 + float(i) * .025;
    col += vec3(1., .62, .3) * uFire.w * (1. - smoothstep(gr * .2, gr, gd)) * .014;
  }
  // A slow warm light leak drifting across the frame every half minute.
  float leak = s.x * .8 + s.y * .35 - fract(uTime * .033) * 2.6 + .4;
  col += vec3(1., .62, .32) * exp(-leak * leak * 9.) * .045;

  // Low steam rolling continuously across the bottom of every shot.
  vec2 rq = vec2(s.x * asp.x * 1.3 - uTime * .04, s.y * 2.6 + sin(s.x * 3. + uTime * .2) * .15);
  float roll = smoothstep(.48, .85, fbm(rq + fbm(rq * 1.7 - uTime * .05) * 1.2)) * (1. - smoothstep(.0, .5, s.y));
  col = mix(col, vec3(.86, .8, .74), roll * (.13 + uBurst * .2));

  // The climax's dark void: everything behind the orbit sinks toward charcoal.
  col = mix(col, vec3(.035, .03, .028), uVoid);
  // Lens vignette.
  col *= mix(.5, 1., 1. - smoothstep(.45, 1.15, length((vUv - .5) * asp * .95)));
  gl_FragColor = vec4(col, 1.);
  #include <colorspace_fragment>
}`;

// Debossed "RD" monogram for the gold seal sticker.
function monogram() {
  const cv = document.createElement("canvas");
  cv.width = cv.height = 256;
  const g = cv.getContext("2d");
  g.strokeStyle = g.fillStyle = "#fff";
  g.lineWidth = 6;
  g.beginPath();
  g.arc(128, 128, 100, 0, Math.PI * 2);
  g.stroke();
  g.font = "600 104px Georgia, serif";
  g.textAlign = "center";
  g.textBaseline = "middle";
  g.fillText("RD", 128, 134);
  return new THREE.CanvasTexture(cv);
}

// Depth map estimated from the photo itself: bright, saturated and low-in-frame reads as near (true for
// these lit tabletop shots), heavily blurred so the parallax moves whole objects rather than texture.
// ponytail: heuristic depth; swap in ML depth maps (e.g. Depth Anything → /plates/<name>-depth.png) for exact layering.
function depthMap(img) {
  const W = 96;
  const H = 54;
  const cv = document.createElement("canvas");
  cv.width = W;
  cv.height = H;
  const g = cv.getContext("2d", { willReadFrequently: true });
  g.drawImage(img, 0, 0, W, H);
  const px = g.getImageData(0, 0, W, H).data;
  let d = new Float32Array(W * H);
  for (let i = 0; i < W * H; i++) {
    const [r, gr, b] = [px[i * 4] / 255, px[i * 4 + 1] / 255, px[i * 4 + 2] / 255];
    const sat = Math.max(r, gr, b) - Math.min(r, gr, b);
    d[i] = (0.299 * r + 0.587 * gr + 0.114 * b) * 0.5 + sat * 0.25 + (Math.floor(i / W) / (H - 1)) * 0.35;
  }
  for (let pass = 0; pass < 3; pass++) {
    // Separable box blur, radius 2.
    for (const [dx, dy] of [[1, 0], [0, 1]]) {
      const o = new Float32Array(W * H);
      for (let y = 0; y < H; y++)
        for (let x = 0; x < W; x++) {
          let sum = 0;
          for (let k = -2; k <= 2; k++) sum += d[clamp(y + dy * k, 0, H - 1) * W + clamp(x + dx * k, 0, W - 1)];
          o[y * W + x] = sum / 5;
        }
      d = o;
    }
  }
  let lo = Infinity;
  let hi = -Infinity;
  d.forEach((v) => ((lo = Math.min(lo, v)), (hi = Math.max(hi, v))));
  const out = new Uint8Array(W * H * 4);
  for (let y = 0; y < H; y++)
    for (let x = 0; x < W; x++) {
      const v = Math.round(((d[y * W + x] - lo) / (hi - lo || 1)) * 255);
      out.set([v, v, v, 255], ((H - 1 - y) * W + x) * 4); // DataTexture rows run bottom-up
    }
  const t = new THREE.DataTexture(out, W, H);
  t.magFilter = t.minFilter = THREE.LinearFilter;
  t.needsUpdate = true;
  return t;
}

const pointer = { x: 0, y: 0, active: false };
// Screen-space state the plate pass computes each frame and the 3D particle pass reads.
const live = { t: 0, steam: new THREE.Vector4(), fire: new THREE.Vector4(), burst: 0, dust: 0, saffron: 0, spices: 0, velocity: 0 };

// Lazy plate loading: a 2 KB placeholder first, then the full photo (and its video, if any). Plates far from
// the current shot are freed, so GPU memory holds at most a few photos whatever the plate count.
function usePlates(invalidate) {
  const cache = useRef(new Map());
  const free = (e) => {
    e.tex?.dispose();
    e.depth?.dispose();
    if (e.video) {
      e.video.pause();
      e.video.removeAttribute("src");
      e.video.load();
    }
  };
  useEffect(() => {
    const c = cache.current;
    return () => c.forEach(free);
  }, []);
  const prune = (current) =>
    cache.current.forEach((e, i) => {
      if (Math.abs(i - current) <= 2) return;
      free(e);
      cache.current.delete(i);
    });
  const get = (i) => {
    let e = cache.current.get(i);
    if (!e) {
      e = { tex: null, depth: null, full: false, video: null };
      cache.current.set(i, e);
      const stale = () => cache.current.get(i) !== e;
      const loader = new THREE.TextureLoader();
      const prep = (t) => {
        t.colorSpace = THREE.SRGBColorSpace;
        t.minFilter = THREE.LinearFilter;
        t.generateMipmaps = false;
        return t;
      };
      const { name, video } = PLATES[i];
      if (!name) return e; // ambient: no photo, only the live layer
      loader.load(`/plates/${name}-tiny.jpg`, (t) => {
        if (stale() || e.full) return t.dispose();
        e.tex = prep(t);
        invalidate();
      });
      loader.load(`/plates/${name}.jpg`, (t) => {
        if (stale()) return t.dispose();
        e.depth = depthMap(t.image);
        if (e.video?.readyState >= 2) return t.dispose(); // live footage already showing
        e.tex?.dispose();
        e.tex = prep(t);
        e.full = true;
        invalidate();
      });
      if (video) {
        // Live-action footage of the same framing, blended in once it can play; the still stays as its poster.
        const v = Object.assign(document.createElement("video"), { src: video, muted: true, loop: true, playsInline: true, preload: "auto" });
        v.addEventListener("loadeddata", () => {
          if (stale()) return;
          e.tex?.dispose();
          e.tex = prep(new THREE.VideoTexture(v));
          e.full = true;
        }, { once: true });
        e.video = v;
      }
    }
    return e;
  };
  const playOnly = (keep) =>
    cache.current.forEach((e, i) => {
      if (!e.video) return;
      if (!keep.includes(i)) e.video.pause();
      else if (e.video.paused) e.video.play().catch(() => {});
    });
  return { get, prune, playOnly };
}

function Plates({ onFail }) {
  const invalidate = useThree((s) => s.invalidate);
  const setDpr = useThree((s) => s.setDpr);
  const { get, prune, playOnly } = usePlates(invalidate);
  const black = useMemo(() => new THREE.DataTexture(new Uint8Array([10, 10, 10, 255]), 1, 1), []);
  const flat = useMemo(() => new THREE.DataTexture(new Uint8Array([128, 128, 128, 255]), 1, 1), []);
  const mono = useMemo(monogram, []);
  const material = useMemo(() => {
    const v2 = () => ({ value: new THREE.Vector2() });
    return new THREE.ShaderMaterial({
      vertexShader: VERT,
      fragmentShader: FRAG,
      depthTest: false,
      depthWrite: false,
      uniforms: {
        uA: { value: null }, uB: { value: null }, uAd: { value: null }, uBd: { value: null }, uMono: { value: null },
        uMix: { value: 0 }, uTime: { value: 0 }, uBurst: { value: 0 },
        uMouse: v2(), uLight: v2(), uRes: v2(), uShake: v2(), uDrift: v2(),
        uAc: v2(), uAk: v2(), uBc: v2(), uBk: v2(),
        uAgl: { value: 0 }, uBgl: { value: 0 }, uVel: { value: 0 }, uStyle: { value: 0 }, uVoid: { value: 0 },
        uApar: v2(), uBpar: v2(), uAfoc: v2(), uBfoc: v2(),
        uAst: { value: new THREE.Vector3() }, uBst: { value: new THREE.Vector3() },
        uSteam: { value: new THREE.Vector4() }, uFire: { value: new THREE.Vector4() },
      },
    });
  }, []);
  useEffect(() => () => [material, black, flat, mono].forEach((x) => x.dispose()), [material, black, flat, mono]);

  const state = useRef({ t: 0, frames: 0, acc: 0, n: 0, dropped: false });

  useEffect(() => {
    const move = (e) => {
      pointer.x = (e.clientX / innerWidth - 0.5) * 2;
      pointer.y = -(e.clientY / innerHeight - 0.5) * 2;
      pointer.active = e.pointerType === "mouse";
    };
    addEventListener("pointermove", move, { passive: true });
    return () => removeEventListener("pointermove", move);
  }, []);

  useFrame(({ clock, size }, delta) => {
    const dt = Math.min(delta, 0.1);
    const time = clock.elapsedTime;
    const st = state.current;
    const u = material.uniforms;
    // Scrubbing: the film follows the scroll position almost directly (tactile), with just enough damping to
    // smooth out wheel steps, equally on wheel, trackpad and touch.
    st.t = damp(st.t, story.t, 7, dt);
    const { a, b, mix, lifeA, lifeB, style } = shot(st.t);
    u.uStyle.value = style;
    live.t = st.t;

    // Keep neighbours warm, free the rest; only on-screen footage plays.
    const A = get(a);
    const B = get(b);
    get(Math.min(b + 1, PLATES.length - 1));
    prune(a);
    playOnly(mix > 0 ? [a, b] : [a]);

    const sa = size.width / size.height;
    const r = sa / IMG_ASPECT;
    const fit = (p, zoom, c, k, life) => {
      // 6% overscan so the dolly and parallax never pull the frame edge into view.
      k.set(r < 1 ? r : 1, r < 1 ? 1 : 1 / r).multiplyScalar(zoom * 0.94);
      const pan = PLATES[p].pan;
      const x = pan ? lerp(pan[0], pan[1], life * life * (3 - 2 * life)) : PLATES[p].focus;
      c.set(clamp(x, k.x / 2 + 0.025, 1 - k.x / 2 - 0.025), 0.5); // margin for the parallax
    };
    // Slow push-in through each shot; across a cut the outgoing shot keeps pushing and the next settles in.
    const push = (p) => PLATES[p].push ?? 0.1;
    fit(a, (1 - push(a) * lifeA) * (1 - 0.07 * mix), u.uAc.value, u.uAk.value, lifeA);
    fit(b, (1 - push(b) * lifeB) * (1 + 0.07 * (1 - mix)), u.uBc.value, u.uBk.value, lifeB);
    u.uA.value = A.tex || black;
    u.uB.value = B.tex || u.uA.value;
    u.uAd.value = A.depth || flat;
    u.uBd.value = B.depth || u.uAd.value;
    u.uMix.value = mix;
    // Each shot's own camera move, driven by scroll through the shot: a dolly (near layers outrun far ones),
    // a push-in, and a focus pull. Across a cut the outgoing shot racks out of focus while the next racks in.
    const move = (p, life, par, foc, defocus) => {
      const [px, py, f0, f1, blur] = PLATES[p].cam || [0, 0, 0.6, 0.6, 0.003];
      const e = life * life * (3 - 2 * life);
      par.set(px * (e - 0.5) * 2.4, py * (e - 0.5) * 2.4);
      foc.set(lerp(f0, f1, e), blur + defocus * 0.008);
    };
    move(a, lifeA, u.uApar.value, u.uAfoc.value, mix);
    move(b, lifeB, u.uBpar.value, u.uBfoc.value, 1 - mix);
    u.uAgl.value = PLATES[a].glisten;
    u.uBgl.value = PLATES[b].glisten;
    u.uAst.value.fromArray(PLATES[a].sticker || [0, 0, 0]);
    u.uBst.value.fromArray(PLATES[b].sticker || [0, 0, 0]);
    u.uMono.value = mono;

    // Steam and fire live in plate space; convert each shot's to screen space, then blend across the cut.
    const toScreen = (v, c, k) => [(v[0] - c.x) / k.x + 0.5, (v[1] - c.y) / k.y + 0.5, v[2] / k.x, v[3]];
    const blend = (key, out) => {
      const pa = toScreen(PLATES[a][key], u.uAc.value, u.uAk.value);
      const pb = toScreen(PLATES[b][key], u.uBc.value, u.uBk.value);
      if (!PLATES[a][key][3]) pa.splice(0, 3, pb[0], pb[1], pb[2]); // no source on one side: don't drift from (0,0)
      if (!PLATES[b][key][3]) pb.splice(0, 3, pa[0], pa[1], pa[2]);
      out.set(...pa.map((x, i) => lerp(x, pb[i], mix)));
    };
    blend("steam", u.uSteam.value);
    blend("fire", u.uFire.value);
    live.steam.copy(u.uSteam.value);
    live.fire.copy(u.uFire.value);
    live.dust = lerp(PLATES[a].dust ?? 0.4, PLATES[b].dust ?? 0.4, mix);
    live.saffron = lerp(PLATES[a].saffron ?? 0, PLATES[b].saffron ?? 0, mix);
    live.spices = lerp(PLATES[a].spices ?? 0, PLATES[b].spices ?? 0, mix);
    // Scroll velocity, decaying once scrolling stops (ScrollTrigger only reports while it moves).
    live.velocity = damp(live.velocity, story.v * Math.exp(-(performance.now() - story.vt) / 150), 4, dt);

    const bu = burst(st.t);
    live.burst = u.uBurst.value = bu;
    u.uShake.value.set(Math.sin(time * 53) * 0.003 * bu, Math.cos(time * 47) * 0.003 * bu);
    u.uMouse.value.set(damp(u.uMouse.value.x, pointer.x, 2.5, dt), damp(u.uMouse.value.y, pointer.y, 2.5, dt));
    // Handheld drift so the frame breathes even when nobody touches it.
    u.uDrift.value.set(Math.sin(time * 0.31) * 0.35 + Math.sin(time * 0.83) * 0.1, Math.sin(time * 0.23 + 1) * 0.25);
    // The cursor is the light; on touch screens the light wanders on its own.
    const lx = pointer.active ? pointer.x * 0.5 + 0.5 : 0.62 + Math.sin(time * 0.27) * 0.25;
    const ly = pointer.active ? pointer.y * 0.5 + 0.5 : 0.7 + Math.sin(time * 0.19) * 0.15;
    u.uLight.value.set(damp(u.uLight.value.x, lx, 3, dt), damp(u.uLight.value.y, ly, 3, dt));
    u.uVel.value = clamp(live.velocity / 2500, -1, 1) * 0.7;
    u.uVoid.value = (live.climax || 0) * 0.8;
    u.uRes.value.set(size.width, size.height);
    u.uTime.value = time;

    // Watchdog: slow frames → drop resolution once; still slow → hand over to plain photographs.
    if (++st.frames < 60) return;
    st.acc += Math.min(delta, 0.25);
    if (++st.n < 90) return;
    const avg = st.acc / st.n;
    st.acc = st.n = 0;
    if (avg > 1 / 24 && !st.dropped) {
      st.dropped = true;
      setDpr(1);
    } else if (avg > 1 / 14 && st.dropped) onFail();
  });

  return (
    <mesh frustumCulled={false} material={material} renderOrder={-1}>
      <planeGeometry />
    </mesh>
  );
}

/* ======================= 3D atmosphere: real particles in front of the photo ======================= */

const P_VERT = `
attribute float aSize, aAlpha, aAngle; attribute vec3 aColor;
uniform float uScale; varying float vAlpha, vAngle; varying vec3 vColor;
void main() {
  vec4 mv = modelViewMatrix * vec4(position, 1.0);
  gl_Position = projectionMatrix * mv;
  gl_PointSize = aSize * uScale / -mv.z;
  vAlpha = aAlpha; vAngle = aAngle; vColor = aColor;
}`;
const P_FRAG = `
uniform sampler2D uMap; varying float vAlpha, vAngle; varying vec3 vColor;
void main() {
  vec2 p = gl_PointCoord - .5;
  float c = cos(vAngle), s = sin(vAngle);
  p = mat2(c, -s, s, c) * p + .5;
  float a = texture2D(uMap, p).a * vAlpha;
  if (a < .004) discard;
  gl_FragColor = vec4(vColor, a);
}`;

function spriteTexture(draw) {
  const cv = document.createElement("canvas");
  cv.width = cv.height = 128;
  draw(cv.getContext("2d"));
  return new THREE.CanvasTexture(cv);
}
const radial = (g, x, y, r, stops) => {
  const gr = g.createRadialGradient(x, y, 0, x, y, r);
  stops.forEach(([o, a]) => gr.addColorStop(o, `rgba(255,255,255,${a})`));
  g.fillStyle = gr;
  g.fillRect(0, 0, 128, 128);
};

function useSprites() {
  const tex = useMemo(
    () => ({
      // Out-of-focus lens bokeh: soft disc with a slightly brighter rim.
      bokeh: spriteTexture((g) => radial(g, 64, 64, 60, [[0, 0.55], [0.75, 0.7], [0.92, 0.35], [1, 0]])),
      spark: spriteTexture((g) => radial(g, 64, 64, 64, [[0, 1], [0.25, 0.6], [1, 0]])),
      puff: spriteTexture((g) => {
        for (let i = 0; i < 9; i++) {
          const x = 64 + (Math.random() - 0.5) * 46;
          const y = 64 + (Math.random() - 0.5) * 46;
          const gr = g.createRadialGradient(x, y, 0, x, y, 18 + Math.random() * 26);
          gr.addColorStop(0, "rgba(255,255,255,0.28)");
          gr.addColorStop(1, "rgba(255,255,255,0)");
          g.fillStyle = gr;
          g.fillRect(0, 0, 128, 128);
        }
      }),
      // Saffron thread: a thin, tapering, slightly curved streak.
      strand: spriteTexture((g) => {
        g.lineCap = "round";
        for (let w = 7; w >= 1; w -= 2) {
          g.strokeStyle = `rgba(255,255,255,${0.12 + (7 - w) * 0.12})`;
          g.lineWidth = w;
          g.beginPath();
          g.moveTo(30, 100);
          g.quadraticCurveTo(70, 70, 98, 26);
          g.stroke();
        }
      }),
    }),
    []
  );
  useEffect(() => () => Object.values(tex).forEach((t) => t.dispose()), [tex]);
  return tex;
}

function Particles({ count, texture, update, blending = THREE.AdditiveBlending }) {
  const ref = useRef();
  const buf = useMemo(
    () => ({
      pos: new Float32Array(count * 3),
      size: new Float32Array(count),
      alpha: new Float32Array(count),
      angle: new Float32Array(count),
      color: new Float32Array(count * 3),
      seeds: Array.from({ length: count }, () => ({ life: Math.random(), a: Math.random(), b: Math.random(), c: Math.random(), d: Math.random() })),
    }),
    [count]
  );
  const material = useMemo(
    () =>
      new THREE.ShaderMaterial({
        uniforms: { uMap: { value: texture }, uScale: { value: 1 } },
        vertexShader: P_VERT,
        fragmentShader: P_FRAG,
        transparent: true,
        depthWrite: false,
        depthTest: false,
        blending,
      }),
    [texture, blending]
  );
  useEffect(() => () => material.dispose(), [material]);

  useFrame((state, delta) => {
    update(buf, Math.min(delta, 0.05), state.clock.elapsedTime, view);
    const at = ref.current.geometry.attributes;
    for (const k of ["position", "aSize", "aAlpha", "aAngle", "aColor"]) at[k].needsUpdate = true;
    material.uniforms.uScale.value = (state.size.height * state.viewport.dpr) / (2 * Math.tan(THREE.MathUtils.degToRad(state.camera.fov / 2)));
  });

  return (
    <points ref={ref} frustumCulled={false} material={material}>
      <bufferGeometry>
        <bufferAttribute attach="attributes-position" args={[buf.pos, 3]} />
        <bufferAttribute attach="attributes-aSize" args={[buf.size, 1]} />
        <bufferAttribute attach="attributes-aAlpha" args={[buf.alpha, 1]} />
        <bufferAttribute attach="attributes-aAngle" args={[buf.angle, 1]} />
        <bufferAttribute attach="attributes-aColor" args={[buf.color, 3]} />
      </bufferGeometry>
    </points>
  );
}

// Half-extents of the photo plane (z = 0) as seen by the camera; used to place particles on screen-space sources.
const view = { hw: 1, hh: 1 };
const CAM_Z = 6;
const toWorld = (sx, sy) => [(sx - 0.5) * 2 * view.hw, (sy - 0.5) * 2 * view.hh];
const set3 = (arr, i, x, y, z) => arr.set([x, y, z], i * 3);
const wrap = (v, lo, hi) => lo + ((((v - lo) % (hi - lo)) + (hi - lo)) % (hi - lo));

// Spice dust and lens bokeh at every depth, drifting through warm air.
function updateDust(b, dt, t) {
  b.seeds.forEach((s, i) => {
    const z = lerp(-4, 3.2, s.c);
    const depthScale = (CAM_Z - z) / CAM_Z;
    const x = wrap(lerp(-1, 1, s.a) * view.hw * depthScale * 1.2 + Math.sin(t * 0.12 + i) * 0.4 + t * 0.05, -view.hw * depthScale * 1.2, view.hw * depthScale * 1.2);
    // Scrolling stirs the air: motes drift against the scroll, nearer ones further.
    s.push = damp(s.push || 0, -live.velocity * 0.0006 * (1 - depthScale + 0.4), 3, dt);
    s.off = (s.off || 0) + s.push * dt;
    const y = wrap(lerp(-1, 1, s.b) * view.hh * depthScale + t * (0.04 + s.d * 0.08) + s.off, -view.hh * depthScale * 1.1, view.hh * depthScale * 1.1);
    set3(b.pos, i, x, y, z);
    const near = smoothstep01((z - 1.2) / 2);
    b.size[i] = lerp(0.025, 0.06, s.d) + near * lerp(0.08, 0.2, s.a);
    b.alpha[i] = live.dust * (0.35 + 0.65 * Math.sin(t * (0.6 + s.d) + i) ** 2) * lerp(0.9, 0.12, near);
    set3(b.color, i, 1, 0.66 + s.d * 0.12, 0.32);
  });
}

// A few saffron threads tumbling slowly in front of the butcher's block.
function updateSaffron(b, dt, t) {
  b.seeds.forEach((s, i) => {
    const z = lerp(-1, 1.6, s.c);
    const y = wrap(lerp(1, -1, s.b) * view.hh - t * (0.05 + s.d * 0.05), -view.hh * 1.1, view.hh * 1.1);
    set3(b.pos, i, lerp(-0.2, 1, s.a) * view.hw + Math.sin(t * 0.4 + i) * 0.25, y, z);
    b.size[i] = lerp(0.16, 0.28, s.d);
    b.angle[i] = s.a * 6.28 + t * (s.d - 0.5) * 0.6;
    b.alpha[i] = live.saffron * 0.6;
    set3(b.color, i, 0.85, 0.2 + s.d * 0.12, 0.05);
  });
}

// Billowing 3D steam puffs from the shot's steam source, looping continuously.
function updatePuffs(b, dt, t) {
  const [sx, sy] = toWorld(live.steam.x, live.steam.y);
  const width = live.steam.z * 2 * view.hw;
  const strength = live.steam.w * (1 + live.burst * 2);
  b.seeds.forEach((s, i) => {
    s.life += dt * (0.09 + s.d * 0.07) * (1 + live.burst);
    if (s.life >= 1) Object.assign(s, { life: s.life - 1, a: Math.random(), c: Math.random() });
    const l = s.life;
    const x = sx + (s.a - 0.5) * width * (1 + l * 1.6) + Math.sin(t * 0.5 + i) * 0.25 * l;
    set3(b.pos, i, x, sy + l * view.hh * 1.3, lerp(-0.4, 1.4, s.c));
    b.size[i] = (0.6 + l * 2.4) * (0.7 + s.b * 0.6);
    b.angle[i] = s.b * 6.28 + l * (s.d - 0.5) * 2.5;
    b.alpha[i] = Math.sin(l * Math.PI) ** 1.4 * 0.085 * strength;
    set3(b.color, i, 0.96, 0.92, 0.87);
  });
}

// Embers lifting off the fire, spread in depth so they parallax against the photo.
function updateEmbers(b, dt, t) {
  const [fx, fy] = toWorld(live.fire.x, live.fire.y);
  const spread = live.fire.z * 2 * view.hw;
  b.seeds.forEach((s, i) => {
    s.life += dt * (0.25 + s.d * 0.4);
    if (s.life >= 1) Object.assign(s, { life: s.life - 1, a: Math.random(), c: Math.random() });
    const l = s.life;
    set3(b.pos, i, fx + (s.a - 0.5) * spread * 1.6 + Math.sin(t * 2 + i) * 0.25 * l, fy + l * view.hh * 1.2, lerp(-0.5, 1.8, s.c));
    b.size[i] = lerp(0.03, 0.065, s.b);
    b.alpha[i] = live.fire.w * (1 - l) * (0.55 + 0.45 * Math.sin(t * 14 + i * 3)) * (1 + live.burst);
    set3(b.color, i, 1, 0.42 + s.b * 0.25, 0.1);
  });
}
const smoothstep01 = (x) => (x <= 0 ? 0 : x >= 1 ? 1 : x * x * (3 - 2 * x));

/* Floating real spices: photographic cut-outs from one studio sheet (/plates/spices.jpg), keyed off black. */

// [sheet, x, y, size] square crops of the 1376×768 studio sheets.
const SPICE_SHEET = "/plates/spices.jpg";
const SPICE_CROPS = [
  [SPICE_SHEET, 130, 48, 140], // cardamom
  [SPICE_SHEET, 448, 153, 140], // cardamom
  [SPICE_SHEET, 1136, 118, 120], // clove
  [SPICE_SHEET, 125, 315, 200], // star anise
  [SPICE_SHEET, 695, 292, 180], // cinnamon
  [SPICE_SHEET, 927, 455, 140], // saffron threads
];
const CELL = 128;

const S_VERT = `
attribute float aSize, aAlpha, aAngle, aCell;
uniform float uScale; varying float vAlpha, vAngle, vCell;
void main() {
  vec4 mv = modelViewMatrix * vec4(position, 1.0);
  gl_Position = projectionMatrix * mv;
  gl_PointSize = aSize * uScale / -mv.z;
  vAlpha = aAlpha; vAngle = aAngle; vCell = aCell;
}`;
const S_FRAG = `
uniform sampler2D uMap; uniform float uCells; varying float vAlpha, vAngle, vCell;
void main() {
  vec2 p = gl_PointCoord - .5;
  float c = cos(vAngle), s = sin(vAngle);
  p = mat2(c, -s, s, c) * p;
  if (max(abs(p.x), abs(p.y)) > .5) discard;
  vec3 col = texture2D(uMap, vec2((vCell + p.x + .5) / uCells, .5 - p.y)).rgb;
  // Key out the black studio background; fade the crop edge so neighbours on the sheet never show.
  float a = smoothstep(.05, .16, max(col.r, max(col.g, col.b))) * (1. - smoothstep(.38, .48, length(p))) * vAlpha;
  if (a < .01) discard;
  gl_FragColor = vec4(col * 1.15, a);
  #include <colorspace_fragment>
}`;

// Packs square crops from one or more studio sheets into a single-row texture atlas.
function useAtlas(crops) {
  const tex = useMemo(() => {
    const cv = document.createElement("canvas");
    cv.width = CELL * crops.length;
    cv.height = CELL;
    const t = new THREE.CanvasTexture(cv);
    t.colorSpace = THREE.SRGBColorSpace;
    const g = cv.getContext("2d");
    for (const src of new Set(crops.map((c) => c[0]))) {
      const img = new Image();
      img.onload = () => {
        crops.forEach(([s, x, y, size], i) => s === src && g.drawImage(img, x, y, size, size, i * CELL, 0, CELL, CELL));
        t.needsUpdate = true;
      };
      img.src = src;
    }
    return t;
  }, [crops]);
  useEffect(() => () => tex.dispose(), [tex]);
  return tex;
}

function Spices({ count }) {
  const ref = useRef();
  const atlas = useAtlas(SPICE_CROPS);
  const buf = useMemo(
    () => ({
      pos: new Float32Array(count * 3),
      size: new Float32Array(count),
      alpha: new Float32Array(count),
      angle: new Float32Array(count),
      // Cardamom and saffron twice as common as the rest.
      cell: Float32Array.from({ length: count }, (_, i) => [0, 1, 5, 0, 5, 2, 3, 4, 1, 5][i % 10]),
      seeds: Array.from({ length: count }, () => ({ a: Math.random(), b: Math.random(), c: Math.random(), d: Math.random(), px: 0, py: 0, off: 0, push: 0 })),
    }),
    [count]
  );
  const material = useMemo(
    () =>
      new THREE.ShaderMaterial({
        uniforms: { uMap: { value: atlas }, uScale: { value: 1 }, uCells: { value: SPICE_CROPS.length } },
        vertexShader: S_VERT,
        fragmentShader: S_FRAG,
        transparent: true,
        depthWrite: false,
        depthTest: false,
      }),
    [atlas]
  );
  useEffect(() => () => material.dispose(), [material]);

  useFrame((state, delta) => {
    const dt = Math.min(delta, 0.05);
    const t = state.clock.elapsedTime;
    // Cursor position on the z = 0 plane; spices near it drift away.
    const mx = pointer.x * view.hw;
    const my = pointer.y * view.hh;
    buf.seeds.forEach((s, i) => {
      const z = lerp(-2.5, 1.8, s.c);
      const k = (CAM_Z - z) / CAM_Z; // how much of the plane this depth sees
      s.push = damp(s.push, -live.velocity * 0.0009 * (1.3 - k), 3, dt);
      s.off += s.push * dt;
      let x = wrap(lerp(-1.1, 1.1, s.a) * view.hw * k + Math.sin(t * 0.15 + i * 1.7) * 0.5, -view.hw * k * 1.15, view.hw * k * 1.15);
      let y = wrap(lerp(-1, 1, s.b) * view.hh * k - t * (0.03 + s.d * 0.04) + s.off, -view.hh * k * 1.2, view.hh * k * 1.2);
      const dx = x - mx * k;
      const dy = y - my * k;
      const d = Math.hypot(dx, dy) + 1e-3;
      const force = pointer.active ? Math.max(0, 1.4 - d) * 0.6 : 0;
      s.px = damp(s.px, (dx / d) * force, 2.5, dt);
      s.py = damp(s.py, (dy / d) * force, 2.5, dt);
      buf.pos.set([x + s.px, y + s.py, z], i * 3);
      buf.size[i] = lerp(0.18, 0.3, s.d) * (buf.cell[i] === 3 ? 1.25 : 1);
      buf.angle[i] = s.a * 6.28 + t * (s.d - 0.5) * 0.5 + s.px * 0.8;
      // Nearest spices fade so they never block the shot; the rest scale with the plate's spice level.
      buf.alpha[i] = live.spices * (1 - smoothstep01((z - 1.4) / 1.2) * 0.7);
    });
    const at = ref.current.geometry.attributes;
    for (const key of ["position", "aSize", "aAlpha", "aAngle"]) at[key].needsUpdate = true;
    material.uniforms.uScale.value = (state.size.height * state.viewport.dpr) / (2 * Math.tan(THREE.MathUtils.degToRad(state.camera.fov / 2)));
  });

  return (
    <points ref={ref} frustumCulled={false} material={material}>
      <bufferGeometry>
        <bufferAttribute attach="attributes-position" args={[buf.pos, 3]} />
        <bufferAttribute attach="attributes-aSize" args={[buf.size, 1]} />
        <bufferAttribute attach="attributes-aAlpha" args={[buf.alpha, 1]} />
        <bufferAttribute attach="attributes-aAngle" args={[buf.angle, 1]} />
        <bufferAttribute attach="attributes-aCell" args={[buf.cell, 1]} />
      </bufferGeometry>
    </points>
  );
}

/* ======================= the Culinary Taskflow (Assembly) ======================= */
// The burger-reel, scrubbed by scroll: a big copper handi centre stage, then every ingredient erupts in from the left
// and right margins and fills the whole frame in four deep layers (near pieces drift outward, far ones inward as you
// scroll), then the layers pack into the handi bottom first, the dough seal goes on, thick steam rises, and the handi
// glides into place in the banana-leaf reveal. Every piece is a photographic cut-out; layers stay visible in the mouth.

const ING = "/plates/ingredients.jpg";
const CHK = "/plates/chicken.jpg";
const MEAT = "/plates/meat-cuts.jpg"; // keyed from meats.jpg
const COSMOS_CROPS = [
  [ING, 120, 80, 190], [ING, 438, 78, 190], [ING, 750, 78, 190], [ING, 1065, 78, 190], // 0–3 marinated meat
  [ING, 105, 335, 100], [ING, 715, 335, 100], // 4–5 Kaima rice grains
  [ING, 103, 538, 110], [ING, 255, 538, 110], // 6–7 ghee
  [ING, 718, 508, 170], [ING, 1113, 508, 170], // 8–9 fried onion
  [SPICE_SHEET, 130, 48, 140], [SPICE_SHEET, 927, 455, 140], [SPICE_SHEET, 1136, 118, 120], [SPICE_SHEET, 125, 315, 200], // 10 cardamom, 11 saffron, 12 clove, 13 star anise
  [CHK, 90, 55, 210], [CHK, 420, 55, 210], [CHK, 753, 55, 210], [CHK, 1075, 55, 210], // 14–17 marinated chicken
  [CHK, 112, 315, 140], [CHK, 367, 315, 140], [CHK, 620, 315, 140], // 18–20 cashews
  [CHK, 88, 500, 210], [CHK, 422, 500, 210], [CHK, 753, 500, 210], // 21–23 saffron rice
  [MEAT, 0, 0, 400], [MEAT, 400, 0, 400], // 24 mutton, 25 beef rib
];

// The burger-reel breakdown, top layer first. Each layer: its groups of [cells, count, size], the height of its band
// in the exploded view (fraction of the half-screen, + is up), and how it moves while exploded.
export const LAYERS = [
  { name: "Fried shallots & cashews", band: 0.62, groups: [[[8, 9], 22, 0.17], [[18, 19, 20], 18, 0.14]], drift: "up" },
  { name: "Ghee, saffron & whole spices", band: 0.24, groups: [[[6, 7], 12, 0.1], [[11], 18, 0.17], [[10], 10, 0.15], [[12], 8, 0.13], [[13], 6, 0.19]], drift: "side" },
  { name: "Kaima rice", band: -0.12, groups: [[[21, 22, 23], 18, 0.21], [[4, 5], 110, 0.06]], drift: "depth" },
  { name: "Beef, mutton & marinated chicken", band: -0.5, groups: [[[24], 3, 0.3], [[25], 3, 0.34], [[14, 15, 16, 17], 12, 0.28], [[0, 1], 4, 0.23]], drift: "settle" },
];
const PIECES = LAYERS.flatMap((L, layer) =>
  L.groups.flatMap(([cells, n, size]) =>
    Array.from({ length: n }, (_, k) => ({ cell: cells[k % cells.length], size, layer, k, n, r: Array.from({ length: 7 }, Math.random) }))
  )
);

const POT_H = 2; // world units at z = 0, before responsive scaling
const POT_BIG = 1.55; // the assembly handi fills the frame instead of floating in empty space
const MOUTH = 0.15; // the open pot's mouth sits this far (in pot heights) above the photo's centre
const MOUTH_RX = 0.29; // inner opening half-size, in pot heights
const MOUTH_RY = 0.11;
const REVEAL = COSMOS + 1; // PLATES index of the banana-leaf reveal the handi glides into
const REVEAL_POT_W = 0.265; // the handi's width in that photo, as a fraction of its width

// Timeline within the section (p = 0–1), all inside the pinned part (the first ~76% of its scroll).
export const PH = {
  pot: [0, 0.08], // the empty copper handi rises centre stage
  explode: [0.04, 0.28], // the four layers erupt in from the left and right margins
  labels: [0.2, 0.44], // exploded view held, layers named
  snap: (L) => [0.44 + (3 - L) * 0.045, 0.44 + (3 - L) * 0.045 + 0.08], // bottom layer first, each snaps into the handi
  seal: [0.665, 0.7], // dough seal and lid (after the last layer has landed)
  reveal: [0.69, 0.78], // steam builds; the sealed handi glides to its place in the reveal shot
};
const span = (p, [a, b]) => smoothstep01((p - a) / (b - a));

const CUT_FRAG = `
uniform sampler2D uMap; uniform float uAlpha, uGlow, uTime; uniform vec2 uMouth; varying vec2 vUv;
void main() {
  vec3 col = texture2D(uMap, vUv).rgb;
  float key = smoothstep(.025, .07, max(col.r, max(col.g, col.b))) * (1. - smoothstep(.43, .5, length(vUv - .5)));
  float a = key * uAlpha;
  if (a < .02) discard;
  // Warms from the mouth outward as layers land, flickering like it sits over embers.
  float mouth = exp(-pow(length((vUv - uMouth) * vec2(1., 2.4)) * 3., 2.));
  col *= 1. + uGlow * (.3 + mouth * 1.3) * (.9 + .1 * sin(uTime * 9.));
  col += vec3(1., .55, .2) * uGlow * mouth * .3;
  gl_FragColor = vec4(col, a);
  #include <colorspace_fragment>
}`;
const CUT_VERT = `varying vec2 vUv; void main() { vUv = uv; gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0); }`;

// A photographic cut-out on a plane, keyed off its black studio background.
function useCutout(src, mouth = [0.5, 0.64]) {
  const tex = useMemo(() => {
    const t = new THREE.TextureLoader().load(src);
    t.colorSpace = THREE.SRGBColorSpace;
    return t;
  }, [src]);
  const mat = useMemo(
    () =>
      new THREE.ShaderMaterial({
        uniforms: { uMap: { value: tex }, uAlpha: { value: 0 }, uGlow: { value: 0 }, uTime: { value: 0 }, uMouth: { value: new THREE.Vector2(...mouth) } },
        vertexShader: CUT_VERT,
        fragmentShader: CUT_FRAG,
        transparent: true,
      }),
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [tex]
  );
  useEffect(() => () => [tex, mat].forEach((x) => x.dispose()), [tex, mat]);
  return mat;
}

function Cosmos({ low }) {
  const sprites = useSprites();
  const group = useRef();
  const pots = useRef();
  const points = useRef();
  const atlas = useAtlas(COSMOS_CROPS);
  const potMat = useCutout("/plates/pot.jpg");
  const sealedMat = useCutout("/plates/pot-sealed.jpg", [0.5, 0.72]);
  const itemMat = useMemo(
    () =>
      new THREE.ShaderMaterial({
        uniforms: { uMap: { value: atlas }, uScale: { value: 1 }, uCells: { value: COSMOS_CROPS.length } },
        vertexShader: S_VERT,
        fragmentShader: S_FRAG,
        transparent: true,
        depthWrite: false,
        depthTest: true, // pieces sliding in behind the handi stay hidden behind it
      }),
    [atlas]
  );
  useEffect(() => () => itemMat.dispose(), [itemMat]);

  const n = PIECES.length;
  const buf = useMemo(
    () => ({
      pos: new Float32Array(n * 3),
      size: new Float32Array(n),
      alpha: new Float32Array(n),
      angle: new Float32Array(n),
      cell: Float32Array.from(PIECES, (it) => it.cell),
    }),
    [n]
  );

  useFrame((state) => {
    const t = live.t;
    // On screen from the end of the opening until the cut to the reveal.
    const on = smoothstep01((t - COSMOS + 0.22) / 0.2) * (1 - smoothstep01((t - COSMOS - 0.84) / 0.12));
    group.current.visible = on > 0.001;
    live.cosmos = on;
    if (!group.current.visible) return;

    const p = clamp(t - COSMOS, 0, 1);
    const time = state.clock.elapsedTime;
    const aspect = state.size.width / state.size.height;
    // Responsive scale: the handi keeps a readable size on phones; flights use the full viewport.
    const scale = clamp(view.hw / 2.6, 0.62, 1);
    const potIn = span(p, PH.pot);
    const seal = span(p, PH.seal);
    const reveal = span(p, PH.reveal);
    const explode = span(p, PH.explode);
    const filled = PIECES.reduce((a, it) => a + span(p, PH.snap(it.layer)), 0) / n;
    const vel = clamp(live.velocity / 2500, -1, 1);

    // Where the handi sits in the reveal photo, so the sealed handi glides into exactly that spot and size.
    const [hx, hy] = heartOnScreen(REVEAL, aspect);
    const r = aspect / IMG_ASPECT;
    const kx = (r < 1 ? r : 1) * 0.9 * 0.94;
    const toScale = ((REVEAL_POT_W / kx) * 2 * view.hw) / (0.9 * POT_H);
    const glide = reveal * reveal * (3 - 2 * reveal);
    const baseY = -0.38 * scale;
    pots.current.position.set(lerp(0, (hx - 0.5) * 2 * view.hw, glide), lerp(baseY - (1 - potIn) * 0.4, (hy - 0.5) * 2 * view.hh, glide), 0);
    const potScale = lerp(scale * POT_BIG * lerp(0.88, 1, potIn), toScale, glide);
    pots.current.scale.setScalar(potScale);
    potMat.uniforms.uAlpha.value = on * potIn * (1 - seal);
    sealedMat.uniforms.uAlpha.value = on * seal;
    potMat.uniforms.uGlow.value = filled * 0.9;
    sealedMat.uniforms.uGlow.value = 0.5 + reveal * 0.6;
    potMat.uniforms.uTime.value = sealedMat.uniforms.uTime.value = time;

    // The mouth of the open handi (world units), and how full it is.
    const mx = pots.current.position.x;
    const my = pots.current.position.y + MOUTH * POT_H * potScale;
    const rx = MOUTH_RX * POT_H * potScale;
    const ry = MOUTH_RY * POT_H * potScale;
    const sizeK = Math.max(scale, 0.75) * 1.5;

    // Exploded bands: edge to edge across the frame and deep, so the layers fill the screen around the handi.
    const bandW = view.hw * 1.02;
    const bandH = view.hh * 0.88;
    const throwOut = 1 + Math.abs(vel) * 0.18; // fast scrolling flings the field wider
    PIECES.forEach((it, i) => {
      const [r0, r1, r2, r3, r4, r5, r6] = it.r;
      const L = LAYERS[it.layer];
      // Exploded: spread across the layer's band, evenly by index so the band reads as a layer, with depth.
      const u = (it.k + 0.5) / it.n;
      const side = u < 0.5 ? -1 : 1;
      const bz = lerp(-1.6, 1.8, r2);
      const persp = (CAM_Z - bz) / CAM_Z;
      let ex = (u * 2 - 1) * bandW * (0.5 + 0.5 * r3) * persp * throwOut;
      let ey = L.band * bandH + (r4 - 0.5) * 0.3 * bandH * persp;
      const hold = span(p, [PH.explode[1], PH.snap(it.layer)[0]]); // time spent exploded, for the per-layer drift
      // Scroll-driven parallax while held: near pieces slide out toward the margins, far ones drift in.
      ex += side * hold * (bz > 0 ? 0.45 : -0.3) * persp;
      if (L.drift === "up") ey += hold * 0.14;
      if (L.drift === "side") ex += Math.sin(time * 0.5 + r5 * 6) * 0.12;
      if (L.drift === "settle") ey -= hold * 0.08;
      const bob = Math.sin(time * 0.8 + r6 * 6) * 0.03;
      // Start: beyond the left or right margin at the piece's own height; each erupts a beat after its neighbours.
      const sx = side * view.hw * lerp(1.25, 1.9, r0) * persp;
      const sy = ey + (r1 - 0.5) * view.hh * 0.9;
      const e = smoothstep01((explode - r6 * 0.3 - (3 - it.layer) * 0.04) / 0.58);
      let x = lerp(sx, ex, e);
      let y = lerp(sy, ey + bob, e) + Math.sin(e * Math.PI) * 0.35 * (r5 - 0.5);
      let z = lerp(bz + 0.6, L.drift === "depth" ? bz * 1.2 : bz, e);
      // Snap: a short pull back, then an accelerating rush into the handi's mouth (the "magnetic" feel).
      const c = smoothstep01((p - PH.snap(it.layer)[0] - r5 * 0.02) / (PH.snap(it.layer)[1] - PH.snap(it.layer)[0]));
      const m = c * c * (2.6 * c - 1.6);
      const ra = Math.sqrt(r0) * 0.85;
      const tx = mx + Math.cos(r1 * 6.283) * rx * ra;
      const ty = my + Math.sin(r1 * 6.283) * ry * ra + (3 - it.layer) * 0.02 * potScale;
      const tz = 0.06 + (3 - it.layer) * 0.02 + r2 * 0.01;
      x = lerp(x, tx, m);
      y = lerp(y, ty, m);
      z = lerp(z, tz, Math.max(0, m));
      buf.pos.set([x, y, z], i * 3);
      buf.size[i] = it.size * sizeK * lerp(0.8, 1, e) * lerp(1, 0.6, Math.max(0, m));
      buf.angle[i] = r5 * 6.28 + (1 - e) * (r3 - 0.5) * 5 + time * (r0 - 0.5) * 0.3 * (1 - c);
      // The nearest pieces thin out a little so the handi still reads through the field; gone before the lid appears.
      buf.alpha[i] = on * smoothstep01((e - 0.02) / 0.1) * (z > 1.3 && m < 0.5 ? 0.8 : 1) * (1 - span(p, [0.655, 0.672]));
    });
    const at = points.current.geometry.attributes;
    for (const key of ["position", "aSize", "aAlpha", "aAngle"]) at[key].needsUpdate = true;
    itemMat.uniforms.uScale.value = (state.size.height * state.viewport.dpr) / (2 * Math.tan(THREE.MathUtils.degToRad(state.camera.fov / 2)));

    // Steam: rises from the mouth as the layers pack in, billows thick and wide round the seal, swells into the reveal.
    live.cosmosMouth = my;
    live.steam.set(0.5 + mx / (2 * view.hw), 0.5 + (my + 0.04) / (2 * view.hh), 0.07 + filled * 0.04 + seal * 0.08, Math.max(filled * 1.2 * (1 - seal), seal * 1.1 + reveal * 0.8));
    live.burst = Math.max(live.burst, filled * 0.35 + seal * 0.35 + reveal * 0.3);
  });

  return (
    <group ref={group} visible={false}>
      <group ref={pots}>
        <mesh material={potMat} renderOrder={1}>
          <planeGeometry args={[POT_H, POT_H]} />
        </mesh>
        <mesh material={sealedMat} renderOrder={1} position-z={0.01}>
          <planeGeometry args={[POT_H, POT_H]} />
        </mesh>
      </group>
      <points ref={points} frustumCulled={false} material={itemMat} renderOrder={2}>
        <bufferGeometry>
          <bufferAttribute attach="attributes-position" args={[buf.pos, 3]} />
          <bufferAttribute attach="attributes-aSize" args={[buf.size, 1]} />
          <bufferAttribute attach="attributes-aAlpha" args={[buf.alpha, 1]} />
          <bufferAttribute attach="attributes-aAngle" args={[buf.angle, 1]} />
          <bufferAttribute attach="attributes-aCell" args={[buf.cell, 1]} />
        </bufferGeometry>
      </points>
      <Particles count={low ? 120 : 260} texture={sprites.spark} update={updateOrbitDust} />
    </group>
  );
}

// A slow halo of golden dust round the handi while it fills.
function updateOrbitDust(b, dt, t) {
  const p = clamp(live.t - COSMOS, 0, 1);
  const show = span(p, [0.38, 0.46]) * (1 - span(p, [0.62, 0.68]));
  b.seeds.forEach((s, i) => {
    const R = lerp(1, Math.min(view.hw * 0.9, 2.6), s.b);
    const a = s.a * 6.28 + t * 0.12 * (s.b > 0.5 ? 1 : -1) + p * 4;
    const z = Math.sin(a) * R;
    set3(b.pos, i, Math.cos(a) * R, z * -0.18 + (live.cosmosMouth || 0), z * 0.8);
    b.size[i] = 0.012 + s.d * 0.022;
    b.alpha[i] = (live.cosmos || 0) * show * (0.25 + 0.75 * Math.sin(t * (2 + s.c * 3) + i) ** 2) * (0.4 + 0.6 * Math.max(0, Math.sin(a)));
    set3(b.color, i, 1, 0.74 + s.c * 0.15, 0.4);
  });
}

/* ======================= the Biriyani Cosmos climax ======================= */
// In a dark void, every ingredient shown so far bursts in from the margins onto three shimmering concentric rings
// round a copper uruli and whips round it (faster when you scroll faster), then the rings spiral inward and pour
// into the pot. It glows saffron-amber, thick steam rises, and the plated Malabar dum biriyani lifts out of the
// steam. Photographic cut-outs throughout; scrubbed by scroll in both directions.

// Rings, inside out: [radius (pot heights), angular speed, tilt, [cells, count, size]…]
const RINGS = [
  [0.62, 1.15, 0.3, [[[4, 5], 26, 0.07], [[21, 22, 23], 8, 0.2], [[6, 7], 8, 0.1]]], // rice, ghee
  [0.95, -0.8, 0.26, [[[10], 8, 0.15], [[11], 9, 0.18], [[12], 6, 0.13], [[13], 5, 0.19]]], // whole spices, saffron
  [1.3, 0.55, 0.22, [[[14, 15, 16, 17], 8, 0.26], [[0, 1, 2, 3], 6, 0.24], [[8, 9], 8, 0.2], [[18, 19, 20], 7, 0.15]]], // meat, onion, cashew
];
const ORBITERS = RINGS.flatMap(([R, speed, tilt, groups], ring) => {
  const list = groups.flatMap(([cells, n, size]) => Array.from({ length: n }, (_, k) => ({ cell: cells[k % cells.length], size })));
  list.sort(() => Math.random() - 0.5); // kinds alternate round the ring
  return list.map((it, i) => ({ ...it, R, speed, tilt, ring, a0: (i / list.length) * Math.PI * 2, r: Array.from({ length: 5 }, Math.random) }));
});
// All within the pinned part of the section (its first ~76%), so the reveal lands while the captions are up.
const CL = {
  pot: [0.01, 0.08], // the uruli rises out of the void
  burst: [0.03, 0.16], // ingredients fly in from the margins onto the rings
  spiral: [0.34, 0.5], // the rings tighten and pour into the pot
  glow: [0.42, 0.56], // saffron-amber glow from the mouth
  plate: [0.48, 0.6], // the plated biriyani lifts out of the steam, then pours into the grand finale (plates.js)
};

function Climax({ low }) {
  const sprites = useSprites();
  const group = useRef();
  const pot = useRef();
  const plate = useRef();
  const bloom = useRef();
  const points = useRef();
  const spin = useRef(0);
  const atlas = useAtlas(COSMOS_CROPS);
  const potMat = useCutout("/plates/pot.jpg");
  const plateMat = useCutout("/plates/plated.jpg", [0.5, 0.45]);
  const itemMat = useMemo(
    () =>
      new THREE.ShaderMaterial({
        uniforms: { uMap: { value: atlas }, uScale: { value: 1 }, uCells: { value: COSMOS_CROPS.length } },
        vertexShader: S_VERT,
        fragmentShader: S_FRAG,
        transparent: true,
        depthWrite: false,
        depthTest: true, // the back half of every ring passes behind the uruli
      }),
    [atlas]
  );
  useEffect(() => () => itemMat.dispose(), [itemMat]);
  const n = ORBITERS.length;
  const buf = useMemo(
    () => ({
      pos: new Float32Array(n * 3),
      size: new Float32Array(n),
      alpha: new Float32Array(n),
      angle: new Float32Array(n),
      cell: Float32Array.from(ORBITERS, (it) => it.cell),
    }),
    [n]
  );

  useFrame((state, delta) => {
    const t = live.t;
    const on = smoothstep01((t - CLIMAX + 0.1) / 0.14) * (1 - smoothstep01((t - CLIMAX - 0.66) / 0.16));
    group.current.visible = on > 0.001;
    live.climax = on;
    if (!group.current.visible) return;

    const p = clamp(t - CLIMAX, 0, 1);
    const time = state.clock.elapsedTime;
    const dt = Math.min(delta, 0.1);
    // Fit the outer ring on any screen; the uruli keeps a readable size on phones.
    const fit = clamp(view.hw / (1.45 * POT_H), 0.42, 1);
    const ringFit = ringScale(fit);
    const tiltK = view.hw < view.hh ? 3 : 1; // portrait: open the rings up into the tall frame
    const potIn = span(p, CL.pot);
    const burstIn = span(p, CL.burst);
    const spiral = span(p, CL.spiral);
    const glow = span(p, CL.glow);
    const plateIn = span(p, CL.plate);

    pot.current.position.y = lerp(-0.6, -0.25, potIn) * fit;
    pot.current.scale.setScalar(fit * lerp(0.8, 1, potIn) * (1 + glow * 0.04) * (1 - plateIn * 0.25));
    potMat.uniforms.uAlpha.value = on * potIn * (1 - plateIn);
    potMat.uniforms.uGlow.value = glow * 1.4;
    potMat.uniforms.uTime.value = plateMat.uniforms.uTime.value = time;
    // The plate rises out of the steam where the pot stood.
    plate.current.position.y = lerp(-0.6, 0, plateIn) * fit;
    plate.current.scale.setScalar(fit * lerp(0.7, 1.15, plateIn));
    plateMat.uniforms.uAlpha.value = on * plateIn;
    plateMat.uniforms.uGlow.value = (1 - plateIn) * 0.6;

    // Orbit speed: steady and fast, whipped faster by scroll speed, in the scroll's direction.
    spin.current += dt * (0.9 + Math.abs(live.velocity) / 900) * (live.velocity < -50 ? -1 : 1);
    const mouthY = pot.current.position.y + MOUTH * POT_H * pot.current.scale.x;
    ORBITERS.forEach((it, i) => {
      const [r0, r1, r2, r3, r4] = it.r;
      const R = it.R * POT_H * ringFit;
      const a = it.a0 + it.speed * (spin.current + p * 9) + Math.sin(time * 1.3 + r0 * 6) * 0.05;
      // Burst in from far beyond the margins along the ring's own direction.
      const enter = smoothstep01((burstIn - r1 * 0.35) / 0.65);
      const far = lerp(3.2, 1, enter * enter * (3 - 2 * enter));
      // Spiral: each piece starts inward a little after its neighbours, so the rings drain like a vortex.
      const s = smoothstep01((spiral - r2 * 0.3) / 0.7);
      const rad = R * far * (1 - s) * (1 + (r3 - 0.5) * 0.08);
      const x = Math.cos(a) * rad;
      const z = Math.sin(a) * rad * 0.9;
      const y = lerp(mouthY + 0.15 * fit, mouthY, s) - Math.sin(a) * rad * it.tilt * tiltK + Math.sin(time * 2 + r4 * 6) * 0.03;
      buf.pos.set([x, y, z], i * 3);
      buf.size[i] = it.size * Math.max(ringFit, 0.45) * 1.25 * lerp(1, 0.3, s) * (0.85 + r0 * 0.3);
      buf.angle[i] = r4 * 6.28 + (spin.current + p * 9) * (r3 - 0.5) * 3;
      buf.alpha[i] = on * (enter > 0.001 ? Math.min(1, enter * 3) : 0) * (1 - smoothstep01((s - 0.85) / 0.15));
    });
    const at = points.current.geometry.attributes;
    for (const key of ["position", "aSize", "aAlpha", "aAngle"]) at[key].needsUpdate = true;
    itemMat.uniforms.uScale.value = (state.size.height * state.viewport.dpr) / (2 * Math.tan(THREE.MathUtils.degToRad(state.camera.fov / 2)));

    bloom.current.position.y = mouthY;
    bloom.current.scale.setScalar(fit * lerp(0.6, 1.1, glow));
    bloom.current.material.opacity = on * glow * (1 - plateIn * 0.7) * (0.55 + Math.sin(time * 7) * 0.05);
    // Thick steam from the mouth as the rings pour in; amber light blooms out of the pot. Blended by `on` so the
    // finale shot's own steam takes over smoothly as the climax dissolves.
    live.steam.lerp(tmp4.set(0.5, 0.5 + (mouthY + 0.05) / (2 * view.hh), 0.06 + glow * 0.08, spiral * 0.8 + glow * 0.9), on);
    live.burst = Math.max(live.burst, glow * (1 - plateIn) * 0.8 * on);
    live.fire.lerp(tmp4.set(0.5, 0.5 + mouthY / (2 * view.hh), 0.12 + glow * 0.1, glow * 0.9 * (1 - plateIn * 0.6)), on);
  });

  return (
    <group ref={group} visible={false}>
      <mesh ref={pot} material={potMat} renderOrder={1}>
        <planeGeometry args={[POT_H, POT_H]} />
      </mesh>
      {/* Saffron-amber bloom welling out of the mouth as the rings pour in. */}
      <mesh ref={bloom} renderOrder={1} position-z={-0.05}>
        <planeGeometry args={[POT_H * 2.6, POT_H * 2.6]} />
        <meshBasicMaterial map={sprites.bokeh} color="#ff9a2e" transparent opacity={0} depthWrite={false} blending={THREE.AdditiveBlending} />
      </mesh>
      <mesh ref={plate} material={plateMat} renderOrder={1} position-z={0.02}>
        <planeGeometry args={[POT_H * 1.2, POT_H * 1.2]} />
      </mesh>
      <points ref={points} frustumCulled={false} material={itemMat} renderOrder={2}>
        <bufferGeometry>
          <bufferAttribute attach="attributes-position" args={[buf.pos, 3]} />
          <bufferAttribute attach="attributes-aSize" args={[buf.size, 1]} />
          <bufferAttribute attach="attributes-aAlpha" args={[buf.alpha, 1]} />
          <bufferAttribute attach="attributes-aAngle" args={[buf.angle, 1]} />
          <bufferAttribute attach="attributes-aCell" args={[buf.cell, 1]} />
        </bufferGeometry>
      </points>
      <Particles count={low ? 160 : 380} texture={sprites.spark} update={updateRingShimmer} />
    </group>
  );
}

const tmp4 = new THREE.Vector4();

// Rings shrink independently of the pot so the outer one (and its biggest pieces) stays on a narrow screen.
const ringScale = (fit) => Math.min(fit, (view.hw * 0.86) / (1.3 * POT_H * 1.05));

// Shimmering gold dust tracing the three rings; it drains into the pot with them.
function updateRingShimmer(b, dt, t) {
  const p = clamp(live.t - CLIMAX, 0, 1);
  const fit = clamp(view.hw / (1.45 * POT_H), 0.42, 1);
  const show = span(p, [0.08, 0.2]) * (1 - span(p, CL.spiral));
  const potY = lerp(-0.6, -0.25, span(p, CL.pot)) * fit + MOUTH * POT_H * fit;
  b.seeds.forEach((s, i) => {
    const [R0, speed, tilt] = RINGS[i % 3];
    const R = R0 * POT_H * ringScale(fit) * (1 + (s.b - 0.5) * 0.06);
    const a = s.a * 6.283 + speed * (t * 0.9 + p * 9);
    const z = Math.sin(a) * R;
    set3(b.pos, i, Math.cos(a) * R, potY + 0.15 * fit - z * tilt * (view.hw < view.hh ? 3 : 1), z * 0.9);
    b.size[i] = 0.012 + s.d * 0.024;
    b.alpha[i] = (live.climax || 0) * show * (0.3 + 0.7 * Math.sin(t * (3 + s.c * 4) + i) ** 2) * (0.35 + 0.65 * Math.max(0, Math.sin(a)));
    set3(b.color, i, 1, 0.7 + s.c * 0.2, 0.35);
  });
}

/* ======================= split & convergence flight ======================= */
// Around every split/converge cut, the scene breaks into its raw ingredients: they burst from the outgoing shot's
// focal point out to the left and right margins, swing round through depth, and converge into the next shot's
// focal point (the uruli, the plate, the box). Scrubbed by scroll; scroll speed throws them wider and spins them.

// Where plate p's focal point lands on screen (0–1), using the same cover fit as the plate pass.
function heartOnScreen(p, aspect) {
  const h = PLATES[p].heart || [0.5, 0.5];
  const r = aspect / IMG_ASPECT;
  const kx = (r < 1 ? r : 1) * 0.9 * 0.94;
  const ky = (r < 1 ? 1 : 1 / r) * 0.9 * 0.94;
  const cx = clamp(PLATES[p].focus, kx / 2 + 0.025, 1 - kx / 2 - 0.025);
  return [(h[0] - cx) / kx + 0.5, (h[1] - 0.5) / ky + 0.5];
}

const CELL_SIZE = [0.26, 0.26, 0.26, 0.26, 0.12, 0.12, 0.15, 0.15, 0.3, 0.3, 0.2, 0.22, 0.17, 0.26];
const FLIGHT = 48;

function Flight() {
  const ref = useRef();
  const atlas = useAtlas(COSMOS_CROPS);
  const seeds = useMemo(
    () => Array.from({ length: FLIGHT }, (_, i) => ({ side: i % 2 ? 1 : -1, r: Array.from({ length: 7 }, Math.random) })),
    []
  );
  const buf = useMemo(
    () => ({
      pos: new Float32Array(FLIGHT * 3),
      size: new Float32Array(FLIGHT),
      alpha: new Float32Array(FLIGHT),
      angle: new Float32Array(FLIGHT),
      cell: new Float32Array(FLIGHT),
    }),
    []
  );
  const material = useMemo(
    () =>
      new THREE.ShaderMaterial({
        uniforms: { uMap: { value: atlas }, uScale: { value: 1 }, uCells: { value: COSMOS_CROPS.length } },
        vertexShader: S_VERT,
        fragmentShader: S_FRAG,
        transparent: true,
        depthWrite: false,
        depthTest: false,
      }),
    [atlas]
  );
  useEffect(() => () => material.dispose(), [material]);
  const spin = useRef(0);

  useFrame((state, delta) => {
    const tr = transit(live.t);
    const pts = ref.current;
    pts.visible = !!tr;
    if (!tr) return;
    const time = state.clock.elapsedTime;
    const aspect = state.size.width / state.size.height;
    const vel = clamp(live.velocity / 2500, -1, 1);
    spin.current += Math.min(delta, 0.1) * vel * 6; // fast scrolling spins them; direction follows the scroll
    const throwOut = 1 + Math.abs(vel) * 0.35;
    const [ax, ay] = heartOnScreen(tr.from, aspect).map((v, i) => (v - 0.5) * 2 * (i ? view.hh : view.hw));
    const [bx, by] = heartOnScreen(tr.to, aspect).map((v, i) => (v - 0.5) * 2 * (i ? view.hh : view.hw));

    seeds.forEach((sd, i) => {
      const [r0, r1, r2, r3, r4, r5, r6] = sd.r;
      const cell = tr.cells[i % tr.cells.length];
      buf.cell[i] = cell;
      // Each piece runs a little behind or ahead of the others, so the flight has a ripple to it.
      const uu = clamp((tr.u - r6 * 0.14) / 0.86, 0, 1);
      const out = smoothstep01(uu / 0.38);
      const orbit = smoothstep01((uu - 0.25) / 0.45);
      const home = smoothstep01((uu - 0.58) / 0.42);

      // Out to the margins, in layers of depth.
      const mx = sd.side * view.hw * lerp(0.62, 1.02, r0) * throwOut;
      const my = (r1 - 0.5) * view.hh * 1.4;
      const mz = lerp(-1.6, 2.2, r2);
      // Swing round the vertical axis: across the back of the frame and out again.
      const th = orbit * Math.PI * (0.55 + r3 * 0.5);
      const ox = mx * Math.cos(th);
      const oz = mz + Math.abs(mx) * Math.sin(th) * -0.7;
      const oy = my + Math.sin(orbit * Math.PI) * (r4 - 0.5) * 0.9;
      // Burst from the outgoing focal point, then home into the incoming one along a curve.
      let x = lerp(ax, ox, out);
      let y = lerp(ay, oy, out) + Math.sin(out * Math.PI) * 0.35 * (r5 - 0.3);
      let z = lerp(0, oz, out);
      x = lerp(x, bx, home * home);
      y = lerp(y, by, home);
      z = lerp(z, 0.4, home);
      buf.pos.set([x, y, z], i * 3);
      buf.size[i] = CELL_SIZE[cell] * lerp(0.5, 1, out) * lerp(1, 0.35, home) * (0.85 + r4 * 0.3);
      buf.angle[i] = r5 * 6.28 + uu * (r3 - 0.5) * 8 + spin.current * (r0 - 0.5);
      buf.alpha[i] = smoothstep01(uu / 0.08) * (1 - smoothstep01((home - 0.9) / 0.1)) * (z > 1.6 ? 0.75 : 1);
    });
    const at = pts.geometry.attributes;
    for (const key of ["position", "aSize", "aAlpha", "aAngle", "aCell"]) at[key].needsUpdate = true;
    material.uniforms.uScale.value = (state.size.height * state.viewport.dpr) / (2 * Math.tan(THREE.MathUtils.degToRad(state.camera.fov / 2)));
  });

  return (
    <points ref={ref} frustumCulled={false} material={material} visible={false} renderOrder={3}>
      <bufferGeometry>
        <bufferAttribute attach="attributes-position" args={[buf.pos, 3]} />
        <bufferAttribute attach="attributes-aSize" args={[buf.size, 1]} />
        <bufferAttribute attach="attributes-aAlpha" args={[buf.alpha, 1]} />
        <bufferAttribute attach="attributes-aAngle" args={[buf.angle, 1]} />
        <bufferAttribute attach="attributes-aCell" args={[buf.cell, 1]} />
      </bufferGeometry>
    </points>
  );
}

function Atmosphere({ low }) {
  const tex = useSprites();
  useFrame(({ camera, size }, delta) => {
    // The camera answers the cursor too, so near particles slide past far ones: real parallax, not a 2D overlay.
    const dt = Math.min(delta, 0.1);
    camera.position.x = damp(camera.position.x, pointer.x * 0.35, 2.5, dt);
    camera.position.y = damp(camera.position.y, pointer.y * 0.22, 2.5, dt);
    camera.lookAt(0, 0, 0);
    view.hh = Math.tan(THREE.MathUtils.degToRad(camera.fov / 2)) * CAM_Z;
    view.hw = view.hh * (size.width / size.height);
  });
  return (
    <>
      <Cosmos low={low} />
      <Climax low={low} />
      <Particles count={low ? 70 : 170} texture={tex.bokeh} update={updateDust} />
      <Particles count={low ? 6 : 10} texture={tex.strand} update={updateSaffron} blending={THREE.NormalBlending} />
      <Particles count={low ? 18 : 40} texture={tex.puff} update={updatePuffs} blending={THREE.NormalBlending} />
      <Particles count={low ? 30 : 70} texture={tex.spark} update={updateEmbers} />
      <Spices count={low ? 10 : 20} />
      <Flight />
    </>
  );
}

/* ======================= canvas ======================= */

// Renders on demand at most `fps` times a second (rAF already pauses in background tabs).
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

export default function Stage({ tier, onFail }) {
  const low = tier === "low";
  return (
    <Canvas
      flat
      frameloop="demand"
      dpr={low ? 1 : [1, 1.5]}
      camera={{ fov: 40, position: [0, 0, CAM_Z] }}
      gl={{ antialias: false, powerPreference: "high-performance" }}
      onCreated={({ gl }) =>
        gl.domElement.addEventListener("webglcontextlost", (e) => {
          e.preventDefault();
          onFail();
        })
      }
    >
      <FrameCap fps={low ? 30 : 60} />
      <Plates onFail={onFail} />
      <Atmosphere low={low} />
    </Canvas>
  );
}
