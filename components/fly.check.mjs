// node components/fly.check.mjs: the thrown dish lands on the counter and peaks where asked.
import assert from "node:assert";
import { arc } from "./fly.js";

for (const [dx, dy, h, T] of [[400, -600, -700, 1.4], [-300, 500, -150, 1.6], [0, 0, -150, 1.3], [800, -40, -190, 1.8]]) {
  const at = arc(dx, dy, h, T);
  const [x, y] = at(T);
  assert(Math.abs(x - dx) < 1e-6 && Math.abs(y - dy) < 1e-6, `lands on (${dx}, ${dy})`);
  const top = Math.min(...Array.from({ length: 2001 }, (_, i) => at((i / 2000) * T)[1]));
  assert(Math.abs(top - h) < 0.5, `peaks at ${h}, got ${top}`);
  assert(at(T)[2] > 0 || dx < 0, "comes down into the counter");
}
console.log("fly ok");
