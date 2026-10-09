import type { Scene } from './types'
import { H, W, Txt, familyOf, theme } from './shared'
import { clamp, eio, lerp, rng, seg } from '@/lib/motion'

const R = 308
const P = 28
const NP = 30

const dots: [number, number][] = []
for (let y = -R; y <= R; y += P) for (let x = -R; x <= R; x += P) if (x * x + y * y <= R * R) dots.push([x, y])

type Pattern = { n: number; pts: [number, number][] }

// Five dot formations the principles morph through: scatter, ring, hexagon, spiral, diagonal.
const patterns: Pattern[] = (() => {
  const r = rng(7)
  const snap = ([x, y]: [number, number]): [number, number] => [Math.round(x / P) * P, Math.round(y / P) * P]
  const mk = (n: number, f: (i: number) => [number, number]): Pattern => ({ n, pts: Array.from({ length: NP }, (_, i) => snap(f(i))) })
  const TAU = 6.283
  return [
    mk(NP, () => { const a = r() * TAU, d = Math.sqrt(r()) * R * 0.92; return [Math.cos(a) * d, Math.sin(a) * d] }),
    mk(24, (i) => { const a = (i / 24) * TAU; return [Math.cos(a) * R * 0.5, Math.sin(a) * R * 0.5] }),
    mk(6, (i) => { const a = ((i % 6) / 6) * TAU - 1.5708; return [Math.cos(a) * R * 0.97, Math.sin(a) * R * 0.97] }),
    mk(NP, (i) => { const t = i / NP, a = t * TAU * 2.2, d = t * R * 0.9; return [Math.cos(a) * d, Math.sin(a) * d] }),
    mk(14, (i) => { const t = (i % 14) / 13 - 0.5; return [t * R * 1.6, t * R * 1.2] }),
  ]
})()

export const principles: Scene = {
  id: 'principles',
  name: 'Principles',
  section: 'Principles',
  defaultDuration: 4,
  keyProgress: 0.9,
  needs: null,
  Component: ({ brand, progress: p, preset }) => {
    const K = theme(preset)
    const family = familyOf(brand, preset)
    const cx = W * 0.3, cy = H / 2
    const words = brand.principles.length ? brand.principles.slice(0, 6) : [brand.name || 'Brand']
    const nK = words.length
    const rev = seg(p, 0, 0.2)

    const kp = seg(p, 0.2, 0.97) * nK
    const k = Math.min(nK - 1, Math.floor(kp))
    const lp = Math.min(1, kp - k)
    const tt = eio(seg(lp, 0, 0.5))
    const from = patterns[k % 5], to = patterns[(k + 1) % 5]
    const pa = seg(p, 0.1, 0.22)
    const pal = brand.palette.length > 1 ? brand.palette : null
    const colorize = pal && k === nK - 1 ? seg(lp, 0.45, 0.8) : 0

    const lh = 48, y0 = cy - ((nK - 1) * lh) / 2, x = W * 0.6
    const f = k === 0 ? 0 : lerp(k - 1, k, tt)
    const la = seg(p, 0.08, 0.2)

    return (
      <g>
        {dots.map(([dx, dy], i) => {
          const a = clamp((rev * 1.4 - Math.hypot(dx, dy) / R) * 4)
          return a > 0 ? <circle key={i} cx={cx + dx} cy={cy + dy} r={2.2} fill={K.ink} opacity={0.5 * a} /> : null
        })}
        {Array.from({ length: NP }, (_, j) => {
          const vis = lerp(j < from.n ? 1 : 0, j < to.n ? 1 : 0, tt) * pa
          if (vis < 0.02) return null
          const px = cx + lerp(from.pts[j][0], to.pts[j][0], tt)
          const py = cy + lerp(from.pts[j][1], to.pts[j][1], tt)
          return (
            <g key={j} opacity={vis}>
              <circle cx={px} cy={py} r={7} fill={K.ink} />
              {colorize > 0 && pal && <circle cx={px} cy={py} r={7} fill={pal[j % pal.length].hex} opacity={colorize} />}
            </g>
          )
        })}
        {words.map((w, i) => (
          <Txt key={i} x={x} y={y0 + i * lh} size={32} weight={600} col={K.ink} family={family} a={(0.25 + 0.75 * clamp(1 - Math.abs(i - f))) * la}>
            {w}
          </Txt>
        ))}
        {la > 0 && <circle cx={x - 32} cy={y0 + f * lh} r={6} fill={K.ink} opacity={la} />}
      </g>
    )
  },
}
