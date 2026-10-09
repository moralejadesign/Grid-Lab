import type { Scene } from './types'
import { H, W, theme } from './shared'
import { Glyph, drawable, fontOf, layout, type Placed } from './glyphs'
import type { BrandFont } from '@/brand/types'
import { eio, eout, rng, seg } from '@/lib/motion'

// Close-ups of the brand's letters, cut hard one after another, then the whole word.
//   0.00 to 0.60  four macro shots. Each frames a node of one letter at about 2.4x the frame height,
//                 drifts and pushes in slowly. Outlines draw on, node squares follow, metric lines cross.
//   0.60          hard cut to the full word in outline
//   0.80 to 0.92  fill arrives letter by letter, construction fades

const SHOTS = 4
const MACRO_END = 0.6

type Shot = { index: number; focus: [number, number]; drift: [number, number] }

/** Pick the letters and focal nodes for the macro shots. Deterministic for a given word and font. */
function planShots(font: BrandFont, placed: Placed[]): Shot[] {
  const letters = placed.map((p, i) => ({ p, i })).filter(({ p }) => p.g && p.g.nodes.length > 2)
  if (!letters.length) return []
  const seen = new Set<string>()
  const unique = letters.filter(({ p }) => !seen.has(p.ch) && seen.add(p.ch))
  const pool = unique.length >= SHOTS ? unique : letters
  return Array.from({ length: SHOTS }, (_, k) => {
    const { p, i } = pool[k % pool.length]
    const g = p.g!
    const r = rng(p.ch.codePointAt(0)! * 31 + k * 7 + 1)
    // Prefer nodes above the baseline so shots show curves and joins, not only feet.
    const upper = g.nodes.filter(([, y]) => y < -font.metrics.xHeight * 0.15)
    const nodes = upper.length ? upper : g.nodes
    const pick = nodes[Math.floor(r() * nodes.length)]
    const ang = r() * Math.PI * 2
    return { index: i, focus: [p.x + pick[0], pick[1]], drift: [Math.cos(ang), Math.sin(ang)] }
  })
}

export const construct: Scene = {
  id: 'construct',
  name: 'Type construction',
  section: 'Typography',
  defaultDuration: 6,
  keyProgress: 0.76,
  needs: null,
  Component: ({ brand, progress: p, preset }) => {
    const K = theme(preset)
    const font = fontOf(brand)
    const word = drawable(font, (brand.name || 'Brand').trim()).slice(0, 14)
    if (!word.length) return null
    const line = layout(font, word)
    const { capHeight, xHeight } = font.metrics

    if (p < MACRO_END) {
      const shots = planShots(font, line.placed)
      if (!shots.length) return null
      const k = Math.min(SHOTS - 1, Math.floor((p / MACRO_END) * SHOTS))
      const t = seg(p, (k / SHOTS) * MACRO_END, ((k + 1) / SHOTS) * MACRO_END)
      const shot = shots[k]
      // Cap height at 2.4 frame heights, pushing in 8% over the shot.
      const s = ((H * 2.4) / capHeight) * (1 + 0.08 * eio(t))
      const ox = W / 2 + shot.drift[0] * 90 * eio(t) - shot.focus[0] * s
      const oy = H / 2 + shot.drift[1] * 60 * eio(t) - shot.focus[1] * s
      // The first shot draws slowly from nothing; later shots draw on fast after the cut.
      const draw = k === 0 ? eio(seg(t, 0, 0.95)) : eout(seg(t, 0, 0.45))
      const points = k === 0 ? seg(t, 0.25, 1) : seg(t, 0.15, 0.6)
      return (
        <g>
          {[0, xHeight, capHeight].map((v) => {
            const y = oy - v * s
            return y > -10 && y < H + 10 ? <line key={v} x1={0} y1={y} x2={W} y2={y} stroke={K.ink} strokeWidth={1} opacity={0.35} /> : null
          })}
          {line.placed.map((pl, i) => {
            if (!pl.g) return null
            const x = ox + pl.x * s
            if (x > W + 50 || x + pl.g.advance * s < -50) return null
            // The framed letter leads; its neighbours draw a beat later.
            const lag = i === shot.index ? 0 : 0.15
            return (
              <Glyph key={i} g={pl.g} x={x} y={oy} s={s} ink={K.ink} bg={K.bg} outline={1} draw={Math.max(0, draw - lag) / (1 - lag)}
                points={Math.max(0, points - lag)} handles={false} nodeSize={9} hairline={preset.hairline} />
            )
          })}
        </g>
      )
    }

    // Wide shot: the whole word, centered on its cap band.
    const sW = Math.min(1500 / line.width, 260 / capHeight)
    const x0 = (W - line.width * sW) / 2
    const base = H / 2 + (capHeight * sW) / 2
    const draw = eio(seg(p, 0.6, 0.76))
    const build = 1 - seg(p, 0.86, 0.95)
    const n = line.placed.length
    return (
      <g>
        {line.placed.map((pl, i) => {
          if (!pl.g) return null
          const st = (i / Math.max(1, n - 1)) * 0.06
          return (
            <Glyph key={i} g={pl.g} x={x0 + pl.x * sW} y={base} s={sW} ink={K.ink} bg={K.bg}
              fill={eio(seg(p, 0.8 + st, 0.86 + st))} outline={build} draw={Math.min(1, draw * 1.2)}
              points={seg(p, 0.66 + st, 0.8 + st)} pointsAlpha={build} handles={false} nodeSize={7} hairline={1.1} />
          )
        })}
      </g>
    )
  },
}
