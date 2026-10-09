import type { Scene } from './types'
import { H, Txt, W, familyOf, theme } from './shared'
import { eio, eout, lerp, rng, seg } from '@/lib/motion'
import { hexRgb, lum } from '@/lib/color'

const ND = 64
const dots = (() => {
  const r = rng(3)
  return Array.from({ length: ND }, () => ({ x: W * 0.06 + r() * W * 0.88, y: H * 0.1 + r() * H * 0.8, r: 12 + r() * 10 }))
})()

export const colors: Scene = {
  id: 'colors',
  name: 'Color',
  section: 'Color',
  defaultDuration: 6,
  keyProgress: 0.09,
  needs: null,
  Component: ({ brand, progress: p, preset }) => {
    const K = theme(preset)
    const family = familyOf(brand, preset)
    const pal = brand.palette.length ? brand.palette.slice(0, 6) : [{ name: 'Ink', hex: K.ink }]
    const n = pal.length
    const phase = 0.76
    const xs = [0.5, 0.66, 0.34]
    const sp = seg(p, phase, 1)
    return (
      <g>
        {pal.map((col, i) => {
          const s = seg(p, (i / n) * phase, ((i + 1) / n) * phase)
          const d = dots[i]
          const edge = lum(col.hex) > 0.92 ? '#cfcfcf' : 'none'
          if (s >= 1) return <circle key={i} cx={d.x} cy={d.y} r={d.r} fill={col.hex} stroke={edge} strokeWidth={1} />
          if (s <= 0) return null
          // A swatch grows into a large disc with its values, then shrinks back into the dot field.
          const grow = eout(seg(s, 0, 0.28)), shr = eio(seg(s, 0.78, 1))
          const r = lerp(lerp(d.r, 270, grow), d.r, shr)
          const x = lerp(W * xs[i % 3], d.x, shr), y = lerp(H * 0.5, d.y, shr)
          const la = seg(s, 0.22, 0.4) * (1 - seg(s, 0.72, 0.82))
          const tc = lum(col.hex) > 0.45 ? '#0b0b0b' : '#ffffff'
          const [rv, gv, bv] = hexRgb(col.hex)
          return (
            <g key={i}>
              <circle cx={x} cy={y} r={r} fill={col.hex} stroke={edge} strokeWidth={1} />
              <Txt x={x} y={y - 30} size={24} weight={700} align="center" col={tc} a={la} family={family}>{col.name || col.hex.toUpperCase()}</Txt>
              <Txt x={x} y={y + 6} size={19} weight={500} align="center" col={tc} a={la} family={family}>{'HEX  ' + col.hex.toUpperCase()}</Txt>
              <Txt x={x} y={y + 34} size={19} weight={500} align="center" col={tc} a={la} family={family}>{`RGB  ${rv} ${gv} ${bv}`}</Txt>
            </g>
          )
        })}
        {sp > 0 && dots.slice(n).map((d, j) => {
          const i = j + n
          const a = eout(seg(sp, (i / ND) * 0.7, (i / ND) * 0.7 + 0.3))
          return a > 0 ? <circle key={i} cx={d.x} cy={d.y} r={d.r * a} fill={pal[i % n].hex} /> : null
        })}
      </g>
    )
  },
}
