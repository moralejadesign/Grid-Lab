import type { Scene } from './types'
import { H, LogoShape, LogoSolid, W, place, theme, toScreen, type Placement } from './shared'
import type { LogoItem } from '@/brand/types'
import { eio, lerp, seg } from '@/lib/motion'
import { samplePath } from '@/lib/pathsample'

// Close-ups of the logo's parts, cut hard one after another, then the whole logo.
//   0.00 to 0.62  up to five shots, one per part, in reading order. Each part fills the frame:
//                 a faint tinted fill, a hairline outline and square node marks. The camera creeps.
//   0.62          hard cut to the filled logo, which settles slightly smaller and holds.

const MAX_SHOTS = 5
const SHOTS_END = 0.62

type Box = { x0: number; y0: number; x1: number; y1: number }

/** Bounds of one logo item in logo units, from its sampled outline. */
function boxOf(it: LogoItem): Box {
  const [a, b, c, d, e, f] = it.matrix
  let x0 = Infinity, y0 = Infinity, x1 = -Infinity, y1 = -Infinity
  for (const [px, py] of samplePath(it.d, 8)) {
    const x = a * px + c * py + e, y = b * px + d * py + f
    x0 = Math.min(x0, x); y0 = Math.min(y0, y); x1 = Math.max(x1, x); y1 = Math.max(y1, y)
  }
  return { x0, y0, x1, y1 }
}

/** The parts worth a close-up: the largest ones, shown left to right. */
function pickShots(items: LogoItem[]): { item: LogoItem; box: Box }[] {
  const all = items.map((item) => ({ item, box: boxOf(item) })).filter(({ box }) => Number.isFinite(box.x0))
  const area = (b: Box) => (b.x1 - b.x0) * (b.y1 - b.y0)
  return all
    .sort((p, q) => area(q.box) - area(p.box))
    .slice(0, MAX_SHOTS)
    .sort((p, q) => p.box.x0 - q.box.x0 || p.box.y0 - q.box.y0)
}

export const logo: Scene = {
  id: 'logo',
  name: 'Logo construction',
  section: 'Logo',
  defaultDuration: 6,
  keyProgress: 0.2,
  needs: 'logo',
  Component: ({ brand, progress: p, preset }) => {
    if (!brand.logo) return null
    const K = theme(preset)
    const { items, bbox: bb } = brand.logo
    const fit = place(bb, W / 2, H / 2, 1100, 560)

    if (p >= SHOTS_END) {
      // Settles from 104% to 100% after the cut, then holds.
      const k = lerp(1.04, 1, eio(seg(p, SHOTS_END, 0.8)))
      return (
        <g transform={`translate(${W / 2} ${H / 2}) scale(${k}) translate(${-W / 2} ${-H / 2})`}>
          <LogoSolid brand={brand} pl={fit} a={1} />
        </g>
      )
    }

    const shots = pickShots(items)
    if (!shots.length) return <LogoSolid brand={brand} pl={fit} a={1} />
    const n = shots.length
    const k = Math.min(n - 1, Math.floor((p / SHOTS_END) * n))
    const t = seg(p, (k / n) * SHOTS_END, ((k + 1) / n) * SHOTS_END)
    const { box } = shots[k]

    // Fit the part to 80% of the frame height (or 70% of the width), never more than 14x the full view.
    const s = Math.min((0.8 * H) / Math.max(1e-6, box.y1 - box.y0), (0.7 * W) / Math.max(1e-6, box.x1 - box.x0), fit.s * 14) * lerp(1, 1.05, eio(t))
    const cx = (box.x0 + box.x1) / 2 + (box.x1 - box.x0) * lerp(-0.03, 0.03, eio(t))
    const cy = (box.y0 + box.y1) / 2
    const cam: Placement = { s, ox: W / 2 - (cx - bb.x) * s, oy: H / 2 - (cy - bb.y) * s, w: bb.w * s, h: bb.h * s }

    return (
      <g>
        {items.map((it, i) => (
          <g key={i}>
            <LogoShape bb={bb} pl={cam} item={it} o={{ fa: 0.1, mono: K.ink }} />
            <LogoShape bb={bb} pl={cam} item={it} o={{ fa: 0, sa: 0.85, sc: K.ink, dash: 1, lw: 1.2 }} />
          </g>
        ))}
        {items.flatMap((it, i) =>
          it.anchors.map((a, j) => {
            const [x, y] = toScreen(bb, cam, a)
            if (x < -10 || x > W + 10 || y < -10 || y > H + 10) return null
            return <rect key={`${i}-${j}`} x={x - 4} y={y - 4} width={8} height={8} fill={K.ink} />
          }),
        )}
      </g>
    )
  },
}
