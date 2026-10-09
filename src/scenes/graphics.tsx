import { useId } from 'react'
import type { Scene } from './types'
import { H, W, theme } from './shared'
import { clamp, eio, seg } from '@/lib/motion'

// A carousel of the brand's graphics:
// the current piece large in the center, its neighbours smaller behind it on both sides.
// Each step holds, then the row slides one place: the next piece moves to the center and grows,
// the old one shrinks behind. With three or more pieces the row loops back to the first.

const CENTER_H = 760 // height of the center card
const SIDE_SCALE = 0.74 // side cards relative to the center card
const SPACING = 420 // horizontal distance between card centers at rest
const MAX_ASPECT = 1.4 // wide graphics are cropped to this width/height
const MIN_ASPECT = 0.5

export const graphics: Scene = {
  id: 'graphics',
  name: 'Graphics',
  section: 'Graphics',
  defaultDuration: 5,
  keyProgress: 0.3,
  needs: 'graphics',
  Component: ({ brand, progress: p, preset }) => {
    const K = theme(preset)
    const uid = useId().replace(/[^\w-]/g, '')
    const list = brand.graphics
    const n = list.length
    if (!n) return null
    const loop = n >= 3

    // Continuous position of the center: step k, then a slide toward k + 1 in the last 45% of the step.
    const k = Math.min(n - 1, Math.floor(p * n))
    const local = p * n - k
    // Without a loop the last piece stays put; with one, it slides on to the first again.
    const center = k + (loop || k < n - 1 ? eio(seg(local, 0.55, 1)) : 0)

    // Every card's offset from the center, wrapped around when looping.
    const cards = list.map((g, i) => {
      let r = i - center
      if (loop) r = ((((r + n / 2) % n) + n) % n) - n / 2
      const d = Math.abs(r)
      const scale = 1 - (1 - SIDE_SCALE) * Math.min(1, d)
      const aspect = clamp(g.width / g.height, MIN_ASPECT, MAX_ASPECT)
      const h = CENTER_H * scale, w = h * aspect
      // Side cards tuck behind the center card instead of standing apart.
      const x = W / 2 + Math.sign(r) * Math.min(d, 1) * SPACING + Math.sign(r) * Math.max(0, d - 1) * SPACING * 0.6
      const opacity = clamp(1.7 - d)
      return { g, i, d, w, h, x, y: H / 2, opacity }
    })

    // Farthest first, so the center card draws on top.
    const order = [...cards].filter((c) => c.opacity > 0).sort((a, b) => b.d - a.d)
    return (
      <g>
        <defs>
          {order.map((c) => (
            <clipPath key={c.i} id={`${uid}c${c.i}`}>
              <rect x={c.x - c.w / 2} y={c.y - c.h / 2} width={c.w} height={c.h} rx={16} />
            </clipPath>
          ))}
        </defs>
        {order.map((c) => (
          <g key={c.i} opacity={c.opacity}>
            <image href={c.g.src} x={c.x - c.w / 2} y={c.y - c.h / 2} width={c.w} height={c.h}
              preserveAspectRatio="xMidYMid slice" clipPath={`url(#${uid}c${c.i})`} />
            <rect x={c.x - c.w / 2} y={c.y - c.h / 2} width={c.w} height={c.h} rx={16} fill="none" stroke={K.ink} strokeWidth={1} opacity={0.25} />
          </g>
        ))}
      </g>
    )
  },
}
