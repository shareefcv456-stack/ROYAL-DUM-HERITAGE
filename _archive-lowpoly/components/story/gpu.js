/**
 * "high"   dedicated or modern GPU: full scene.
 * "low"    capable but constrained (phones, ≤4 cores, ≤4GB): fewer particles, lighter meshes, 30fps cap.
 * "frames" no WebGL, software rendering, an old integrated GPU, or reduced motion:
 *          play the pre-rendered frame sequence instead.
 */
export function detectTier() {
  if (matchMedia("(prefers-reduced-motion: reduce)").matches) return "frames";
  try {
    const probe = (opts) => {
      const c = document.createElement("canvas");
      return c.getContext("webgl2", opts) || c.getContext("webgl", opts);
    };
    const release = (gl) => gl?.getExtension("WEBGL_lose_context")?.loseContext();

    const gl = probe();
    if (!gl) return "frames";
    const info = gl.getExtension("WEBGL_debug_renderer_info");
    const renderer = String(gl.getParameter(info ? info.UNMASKED_RENDERER_WEBGL : gl.RENDERER));
    release(gl);

    // The browser refuses a context that would be "major performance caveat" (i.e. software).
    const fast = probe({ failIfMajorPerformanceCaveat: true });
    release(fast);
    if (!fast || /swiftshader|llvmpipe|softpipe|software|basic render/i.test(renderer)) return "frames";
    if (/intel.*\bu?hd graphics|intel.*gma|mali-(t\d+|4\d\d)|adreno\D*[34]\d\d|powervr|videocore/i.test(renderer)) return "frames";

    const weak =
      (navigator.hardwareConcurrency || 4) <= 4 ||
      (navigator.deviceMemory || 8) <= 4 ||
      matchMedia("(pointer: coarse)").matches;
    return weak ? "low" : "high";
  } catch {
    return "frames";
  }
}
