import { useId } from 'react'
import type { Scene } from '@/scenes/types'
import { H, W, theme } from '@/scenes/shared'
import { clamp, eout, seg } from '@/lib/motion'
import { TileView, Word, tilesOf } from './shared'

// Orbit: the tiles sit on a ring that turns once over the clip.
// Tiles near three o'clock swell into large cards; everywhere else they shrink to chips.
// How large the swell gets breathes in and out, so the ring alternates between a quiet loop and a crowd.
// The clip loops: the last frame matches the first.

const N = 20 // tiles on the ring
const R = 400 // ring radius
const CHIP = 30 // tile size far from the swell
const SPREAD = 0.62 // width of the swell, in radians

export const orbit: Scene = {
  id: 'gs-orbit',
  name: 'Orbit',
  section: 'Graphics',
  defaultDuration: 9,
  keyProgress: 0.42,
  needs: null,
  Component: ({ brand, progress: p, preset }) => {
    const K = theme(preset)
    const uid = useId().replace(/[^\w-]/g, '')
    const tiles = tilesOf(brand, N)
    const cx = W / 2, cy = H / 2
    const spin = p * Math.PI * 2
    // Swell size breathes between a medium and a large crowd.
    const swell = 250 + 190 * (0.5 - 0.5 * Math.cos(Math.PI * 2 * (p + 0.12)))
    const intro = eout(seg(p, 0, 0.06))

    const cards = tiles.map((tile, i) => {
      const ang = -Math.PI / 2 + (i / N) * Math.PI * 2 + spin
      // Angular distance to the swell at three o'clock, wrapped to -PI..PI.
      const d = Math.atan2(Math.sin(ang), Math.cos(ang))
      const k = Math.exp(-((d / SPREAD) ** 2))
      const size = CHIP + swell * k
      const aspect = tile.kind === 'image' ? clamp(tile.aspect, 0.6, 1.5) : 1
      const w = size * Math.sqrt(aspect), h = size / Math.sqrt(aspect)
      // Large cards drift inward so the crowd overlaps toward the center, like a fanned hand.
      const r = R - 120 * k
      return { tile, i, k, w, h, x: cx + Math.cos(ang) * r, y: cy + Math.sin(ang) * r }
    })
    const order = [...cards].sort((a, b) => a.k - b.k)

    return (
      <g>
        <circle cx={cx} cy={cy} r={R} fill="none" stroke={K.ink} strokeWidth={preset.hairline} opacity={0.12 * intro} />
        <Word brand={brand} text={brand.name} x={cx} y={cy + 14} size={44} align="center" fill={K.ink} a={0.9 * intro} maxWidth={420} />
        {order.map((c) => (
          <TileView key={c.i} brand={brand} tile={c.tile} id={`${uid}o${c.i}`} cx={c.x} cy={c.y} w={c.w * intro} h={c.h * intro}
            rx={6 + 12 * c.k} edge={K.ink} />
        ))}
      </g>
    )
  },
}
