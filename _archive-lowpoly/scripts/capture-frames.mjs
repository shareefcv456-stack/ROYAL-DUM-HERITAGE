// Records the 3D story into public/frames/*.webp for the no-GPU fallback.
// Usage: npm run dev, then `npm run capture` (needs Chrome; set CHROME_PATH if it's not in the default place).
import { mkdir, writeFile } from "node:fs/promises";
import { chromium } from "playwright-core";
import { FRAMES } from "../components/story/frames.mjs";

const url = process.argv[2] || "http://localhost:3000/capture";
const chrome = process.env.CHROME_PATH || "/Applications/Google Chrome.app/Contents/MacOS/Google Chrome";

const browser = await chromium.launch({ executablePath: chrome, args: ["--enable-gpu", "--ignore-gpu-blocklist", "--use-angle=metal"] });
const page = await browser.newPage({ viewport: { width: 1280, height: 720 }, deviceScaleFactor: 1 });
page.on("pageerror", (e) => console.error(e.message));
await page.goto(url);
await page.waitForFunction(() => window.__story?.compiled, null, { timeout: 120_000 });
await mkdir("public/frames", { recursive: true });

for (let i = 0; i < FRAMES; i++) {
  await page.evaluate((p) => window.__seek(p), i / (FRAMES - 1));
  await page.waitForTimeout(220); // let springs and particles settle into the new state
  const data = await page.evaluate(() => document.querySelector("canvas").toDataURL("image/webp", 0.72));
  await writeFile(`public/frames/f${String(i).padStart(3, "0")}.webp`, Buffer.from(data.split(",")[1], "base64"));
  process.stdout.write(`\rframe ${i + 1}/${FRAMES}`);
}
console.log();
await browser.close();
