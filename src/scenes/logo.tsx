import type { Scene } from './types'
import { H, LogoShape, W, place, theme, toScreen } from './shared'
import { eio, eout, seg } from '@/lib/motion'

// The logo is drawn, then filled:
//   0.05 to 0.30  a hairline box marks the logo's bounds
//   0.03 to 0.55  each shape's outline draws on, one after another
//   0.42 to 0.70  anchor points pop in along the outlines
//   0.74 to 0.94  fill arrives, construction fades

export const logo: Scene = {
  id: 'logo',
  name: 'Logo construction',
  section: 'Logo',
  defaultDuration: 5,
  keyProgress: 0.6,
  needs: 'logo',
  Component: ({ brand, progress: p, preset }) => {
    if (!brand.logo) return null
    const K = theme(preset)
    const { items, bbox: bb } = brand.logo
    const pl = place(bb, W / 2, H / 2, 560, 560)
    const n = items.length
    const fill = eio(seg(p, 0.74, 0.94))
    const bx = eio(seg(p, 0.05, 0.3))
    const all = items.flatMap((it) => it.anchors)
    const N = all.length
    const ah = 1 - fill
    return (
      <g>
        <rect x={pl.ox} y={pl.oy} width={pl.w} height={pl.h} fill="none" stroke={K.ink} strokeWidth={1} opacity={0.28 * bx * (1 - fill)} />
        {items.map((it, i) => {
          const s0 = 0.03 + (n > 1 ? i / (n - 1) : 0) * 0.18
          return (
            <LogoShape key={i} bb={bb} pl={pl} item={it}
              o={{ fa: fill, sa: 1 - 0.75 * fill, sc: K.ink, dash: eio(seg(p, s0, s0 + 0.34)), lw: preset.hairline + 0.1 }} />
          )
        })}
        {ah > 0 && all.map((a, i) => {
          const s0 = 0.42 + (i / Math.max(1, N)) * 0.2
          const q = eout(seg(p, s0, s0 + 0.08))
          if (q <= 0) return null
          const [sx, sy] = toScreen(bb, pl, a)
          return <circle key={i} cx={sx} cy={sy} r={5 * q} fill={K.bg} stroke={K.ink} strokeWidth={1.3} opacity={ah} />
        })}
      </g>
    )
  },
}
