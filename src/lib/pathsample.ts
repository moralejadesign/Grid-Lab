import { SVGPathData } from 'svg-pathdata'

export type Polyline = { pts: [number, number][]; cum: number[]; length: number }

const cache = new Map<string, [number, number][]>()

/** Points along path data, curves included (arcs and quadratics become cubics first). Pure and cached. */
export function samplePath(d: string, steps = 16): [number, number][] {
  const key = `${steps}|${d}`
  const hit = cache.get(key)
  if (hit) return hit
  const pts: [number, number][] = []
  let x = 0, y = 0, sx = 0, sy = 0
  const cmds = new SVGPathData(d).toAbs().normalizeHVZ(false).normalizeST().qtToC().aToC().commands
  for (const c of cmds) {
    if (c.type === SVGPathData.MOVE_TO) {
      x = sx = c.x; y = sy = c.y
      pts.push([x, y])
    } else if (c.type === SVGPathData.LINE_TO) {
      x = c.x; y = c.y
      pts.push([x, y])
    } else if (c.type === SVGPathData.CURVE_TO) {
      for (let i = 1; i <= steps; i++) {
        const t = i / steps, u = 1 - t
        pts.push([
          u * u * u * x + 3 * u * u * t * c.x1 + 3 * u * t * t * c.x2 + t * t * t * c.x,
          u * u * u * y + 3 * u * u * t * c.y1 + 3 * u * t * t * c.y2 + t * t * t * c.y,
        ])
      }
      x = c.x; y = c.y
    } else if (c.type === SVGPathData.CLOSE_PATH) {
      x = sx; y = sy
      pts.push([x, y])
    }
  }
  if (cache.size > 500) cache.clear()
  cache.set(key, pts)
  return pts
}

export function polyline(pts: [number, number][]): Polyline {
  const cum = [0]
  for (let i = 1; i < pts.length; i++) cum.push(cum[i - 1] + Math.hypot(pts[i][0] - pts[i - 1][0], pts[i][1] - pts[i - 1][1]))
  return { pts, cum, length: cum[cum.length - 1] ?? 0 }
}

/** The point a fraction `f` (0..1) of the way along a polyline, by length. */
export function pointAt(line: Polyline, f: number): [number, number] {
  const { pts, cum, length } = line
  if (pts.length < 2 || length === 0) return pts[0] ?? [0, 0]
  const target = Math.min(1, Math.max(0, f)) * length
  let lo = 0, hi = cum.length - 1
  while (hi - lo > 1) {
    const mid = (lo + hi) >> 1
    if (cum[mid] < target) lo = mid
    else hi = mid
  }
  const seg = cum[hi] - cum[lo] || 1
  const t = (target - cum[lo]) / seg
  return [pts[lo][0] + (pts[hi][0] - pts[lo][0]) * t, pts[lo][1] + (pts[hi][1] - pts[lo][1]) * t]
}
