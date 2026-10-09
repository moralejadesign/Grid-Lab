// Shared easing and timing helpers. Every scene uses these so motion stays consistent.

export const clamp = (x: number, a = 0, b = 1) => Math.min(b, Math.max(a, x))
export const lerp = (a: number, b: number, t: number) => a + (b - a) * t

/** Ease in-out cubic. */
export const eio = (t: number) => (t < 0.5 ? 4 * t * t * t : 1 - Math.pow(-2 * t + 2, 3) / 2)
/** Ease out cubic. */
export const eout = (t: number) => 1 - Math.pow(1 - t, 3)
/** Local 0..1 progress of `p` inside the window [a, b]. */
export const seg = (p: number, a: number, b: number) => clamp((p - a) / (b - a))

/** Seeded random generator. Never use Math.random() in a scene. */
export function rng(seed: number) {
  let s = seed >>> 0
  return () => {
    s = (s * 1664525 + 1013904223) >>> 0
    return s / 4294967296
  }
}
