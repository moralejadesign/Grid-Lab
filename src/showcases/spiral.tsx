import { useId } from 'react'
import type { Scene } from '@/scenes/types'
import { H, W, theme } from '@/scenes/shared'
import { eio, lerp, rng, seg } from '@/lib/motion'
import { TileView, Word, tilesOf } from './shared'

// Spiral: a deck sits in the center over the brand name.
//   0.06 to 0.40  cards peel off the deck one by one and spiral out into a wide ring
//   0.40 to 0.64  the ring turns slowly, cards tilted along it
//   0.64 to 0.96  cards spiral back in, last out first in, and the deck closes over the name

const N = 22 // cards in the deck
const CW = 220, CH = 270 // card size
const RX = 700, RY = 430 // ring radii, wider than tall to fill the frame
const STAGGER = 0.011 // delay between cards

export const spiral: Scene = {
  id: 'gs-spiral',
  name: 'Spiral',
  section: 'Graphics',
  defaultDuration: 10,
  keyProgress: 0.5,
  needs: null,
  Component: ({ brand, progress: p, preset }) => {
    const K = theme(preset)
    const uid = useId().replace(/[^\w-]/g, '')
    const tiles = tilesOf(brand, N)
    const rand = rng(7)
    const tilt = tiles.map(() => (rand() - 0.5) * 36)
    const cx = W / 2, cy = H / 2
    const turn = p * Math.PI * 0.9

    const cards = tiles.map((tile, i) => {
      const open = eio(seg(p, 0.06 + i * STAGGER, 0.24 + i * STAGGER))
      const close = eio(seg(p, 0.64 + (N - 1 - i) * STAGGER, 0.8 + (N - 1 - i) * STAGGER))
      const f = open * (1 - close)
      const target = (i / N) * Math.PI * 2 + turn
      // Leave from the top of the deck and sweep around to the card's place on the ring.
      const ang = lerp(-Math.PI / 2 - 0.6, target, f)
      const x = cx + Math.cos(ang) * RX * f
      const y = cy - i * 1.6 * (1 - f) + Math.sin(ang) * RY * f
      const rot = lerp(0, (ang * 180) / Math.PI + 90 + tilt[i], f)
      return { tile, i, f, x, y, rot, s: 1 + 0.08 * f }
    })
    // Cards still in the deck draw last, with the top card (index 0) on top.
    const order = [...cards].sort((a, b) => b.f - a.f || b.i - a.i)

    return (
      <g>
        <Word brand={brand} text={brand.name} x={cx} y={cy + 26} size={84} align="center" fill={K.ink} maxWidth={1000} />
        {order.map((c) => (
          <TileView key={c.i} brand={brand} tile={c.tile} id={`${uid}s${c.i}`} cx={c.x} cy={c.y} w={CW * c.s} h={CH * c.s} rot={c.rot} rx={20} />
        ))}
      </g>
    )
  },
}
