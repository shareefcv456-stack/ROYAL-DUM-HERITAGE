import * as THREE from "three";
import { mergeGeometries, mergeVertices } from "three/examples/jsm/utils/BufferGeometryUtils.js";
import { fbm3, smooth } from "./textures";

const RAW = { lean: ["#7d1716", "#9e2723", "#6a1212"], fat: "#efd8c8" };
const COOKED = { lean: ["#6a2a10", "#8a4018", "#53200b"], fat: "#9a5a26" };

// A hand-cut chunk of meat: a rounded cube pushed around by noise, with muscle fibres
// and fat marbling baked into vertex colours. `detail` drives the LOD level.
export function meatGeometry({ detail, seed = 0, scale = [1, 1, 1], cooked = false }) {
  let g = new THREE.IcosahedronGeometry(1, detail);
  g.deleteAttribute("normal");
  g.deleteAttribute("uv");
  g = mergeVertices(g);
  const pos = g.attributes.position;
  const colors = new Float32Array(pos.count * 3);
  const pal = cooked ? COOKED : RAW;
  const lean = pal.lean.map((c) => new THREE.Color(c));
  const fat = new THREE.Color(pal.fat);
  const v = new THREE.Vector3(), cube = new THREE.Vector3(), c = new THREE.Color();

  for (let i = 0; i < pos.count; i++) {
    v.fromBufferAttribute(pos, i).normalize();
    const m = Math.max(Math.abs(v.x), Math.abs(v.y), Math.abs(v.z));
    v.lerp(cube.copy(v).divideScalar(m), 0.4);
    const n = fbm3(v.x * 1.4 + seed, v.y * 1.4, v.z * 1.4 + seed, 4);
    const fibre = Math.sin((v.x * 0.8 + v.z * 0.35) * 60 + n * 9) * 0.0025;
    v.multiplyScalar(1 + n * 0.07 + fibre);
    pos.setXYZ(i, v.x * scale[0], v.y * scale[1], v.z * scale[2]);

    const tone = fbm3(v.x * 3 + seed, v.y * 3, v.z * 3, 3);
    c.copy(lean[0]).lerp(tone > 0 ? lean[1] : lean[2], Math.abs(tone) * 1.2);
    // Soft seams of fat plus faint threads along the noise zero-crossings.
    const seam = smooth(0.28, 0.42, fbm3(v.x * 0.9 + seed, v.y * 0.9 - 2, v.z * 0.9, 2));
    const thread = (1 - smooth(0.004, 0.02, Math.abs(fbm3(v.x * 1.2 - seed, v.y * 1.2, v.z * 1.2 + 4, 2)))) * 0.35;
    c.lerp(fat, Math.max(seam * 0.6, thread));
    colors.set([c.r, c.g, c.b], i * 3);
  }
  g.setAttribute("color", new THREE.BufferAttribute(colors, 3));
  g.computeVertexNormals();
  return g;
}

function paint(g, hex, jitter = 0.04) {
  const base = new THREE.Color(hex), c = new THREE.Color();
  const n = g.attributes.position.count;
  const a = new Float32Array(n * 3);
  for (let i = 0; i < n; i++) {
    c.copy(base).offsetHSL(0, 0, (Math.random() - 0.5) * jitter);
    a.set([c.r, c.g, c.b], i * 3);
  }
  g.setAttribute("color", new THREE.BufferAttribute(a, 3));
  return g;
}

function starAnise() {
  const parts = [];
  for (let i = 0; i < 8; i++) {
    const a = (i * Math.PI) / 4;
    const pod = new THREE.SphereGeometry(1, 14, 8).scale(0.5, 0.15, 0.17).translate(0.52, 0, 0).rotateY(a);
    const seed = new THREE.SphereGeometry(0.08, 10, 6).scale(1.4, 0.8, 1).translate(0.55, 0.12, 0).rotateY(a);
    parts.push(paint(pod, "#5b2412", 0.08), paint(seed, "#b06d2c", 0.1));
  }
  parts.push(paint(new THREE.CylinderGeometry(0.09, 0.13, 0.22, 10), "#3e1a0c"));
  return mergeGeometries(parts).scale(0.32, 0.32, 0.32);
}

function cardamom() {
  const g = new THREE.SphereGeometry(1, 18, 14);
  const p = g.attributes.position;
  for (let i = 0; i < p.count; i++) {
    const x = p.getX(i), y = p.getY(i), z = p.getZ(i);
    const ridge = 1 + 0.08 * Math.cos(3 * Math.atan2(x, z));
    const taper = 1 - y * y * 0.35;
    p.setXYZ(i, x * ridge * taper, y, z * ridge * taper);
  }
  g.scale(0.09, 0.17, 0.09);
  g.computeVertexNormals();
  return paint(g, "#7f9a3a", 0.12);
}

function saffronStrand() {
  const pts = Array.from({ length: 5 }, (_, i) => new THREE.Vector3((Math.random() - 0.5) * 0.06, i * 0.09, (Math.random() - 0.5) * 0.06));
  const curve = new THREE.CatmullRomCurve3(pts);
  const T = 24, R = 5;
  const g = new THREE.TubeGeometry(curve, T, 0.011, R, false);
  // Flare one end into the trumpet-shaped stigma tip.
  const p = g.attributes.position, centre = new THREE.Vector3(), v = new THREE.Vector3();
  for (let j = 0; j <= T; j++) {
    curve.getPointAt(j / T, centre);
    const k = 1 + 2.6 * (j / T) ** 4;
    for (let r = 0; r <= R; r++) {
      const i = j * (R + 1) + r;
      v.fromBufferAttribute(p, i).sub(centre).multiplyScalar(k).add(centre);
      p.setXYZ(i, v.x, v.y, v.z);
    }
  }
  g.computeVertexNormals();
  g.center();
  return paint(g, "#c0260b", 0.06);
}

function clove() {
  const stem = new THREE.CylinderGeometry(0.022, 0.012, 0.24, 7).translate(0, -0.12, 0);
  const bud = new THREE.SphereGeometry(0.034, 10, 8).translate(0, 0.035, 0);
  const sepals = [0, 1, 2, 3].map((i) =>
    new THREE.ConeGeometry(0.016, 0.05, 5).translate(0, 0.012, 0.03).rotateY((i * Math.PI) / 2),
  );
  return mergeGeometries([paint(stem, "#4b2616"), paint(bud, "#6e3d22"), ...sepals.map((s) => paint(s, "#552c19"))]);
}

let spiceCache;
export const spiceGeometries = () =>
  (spiceCache ??= { anise: starAnise(), cardamom: cardamom(), saffron: saffronStrand(), clove: clove() });

const v2 = (pts) => pts.map(([x, y]) => new THREE.Vector2(x, y));

// Handi silhouette: outer wall up to a flared rim, then back down the inner wall.
export const POT_PROFILE = v2([
  [0, 0.02], [0.7, 0], [1.05, 0.12], [1.3, 0.45], [1.36, 0.72], [1.26, 1.02], [1.06, 1.22],
  [1.02, 1.32], [1.16, 1.42], [1.14, 1.47], [0.97, 1.38], [0.96, 1.22], [1.18, 1.0],
  [1.27, 0.72], [1.22, 0.47], [0.98, 0.18], [0.65, 0.08], [0, 0.1],
]);
export const LID_PROFILE = v2([
  [0, 0.3], [0.35, 0.27], [0.75, 0.16], [1.05, 0.04], [1.18, 0], [1.18, -0.03], [1.0, 0], [0.7, 0.12], [0, 0.25],
]);
