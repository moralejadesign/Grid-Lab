import { useId } from 'react'
import type { Scene } from '@/scenes/types'
import { W, theme } from '@/scenes/shared'
import { clamp, eio, lerp } from '@/lib/motion'
import { TileView, Word, tilesOf, type Tile } from './shared'

// Stack: one card faces the viewer and the rest of the deck recedes below it as thin slices,
// narrowing and fading. Every step the top card lifts away and the deck rises one place,
// so a new piece comes to the front. The brand name sits across the deck.

const STEPS = 18 // cards shown over the clip
const DEPTH = 15 // slices visible under the top card
const S = 300 // top card size
const TOP = 190 // top card y
const SLICE = 26 // first slice height; each next one is a little thinner
const SHRINK = 0.92
const MOVE = 0.35 // last part of each step spent moving

type Geo = { y: number; w: number; h: number; a: number }

/** Geometry of the card at deck level `l`: 0 is the top card, 1.. are slices, below 0 is leaving. */
function geo(l: number): Geo {
  if (l < 0) return { y: TOP - 70 * -l, w: S, h: S, a: 1 + l }
  const at = (j: number): Geo => {
    if (j === 0) return { y: TOP, w: S, h: S, a: 1 }
    let y = TOP + S + 6
    for (let m = 1; m < j; m++) y += SLICE * SHRINK ** (m - 1) + 4
    return { y, w: S * (1 - 0.028 * j), h: SLICE * SHRINK ** (j - 1), a: clamp(1 - j / (DEPTH + 1)) }
  }
  const j = Math.floor(l), t = l - j
  const g0 = at(j), g1 = at(j + 1)
  return { y: lerp(g0.y, g1.y, t), w: lerp(g0.w, g1.w, t), h: lerp(g0.h, g1.h, t), a: lerp(g0.a, g1.a, t) }
}

export const stack: Scene = {
  id: 'gs-stack',
  name: 'Stack',
  section: 'Graphics',
  defaultDuration: 9,
  keyProgress: 0.4,
  needs: null,
  Component: ({ brand, progress: p, preset }) => {
    const K = theme(preset)
    const uid = useId().replace(/[^\w-]/g, '')
    const tiles = tilesOf(brand, 12)
    const step = Math.min(STEPS - 1, Math.floor(p * STEPS))
    const e = eio(clamp((p * STEPS - step - (1 - MOVE)) / MOVE))
    const cx = W / 2

    const cards: { tile: Tile; key: number; g: Geo }[] = []
    for (let j = DEPTH + 1; j >= 0; j--) {
      const g = geo(j - e)
      if (g.a <= 0) continue
      const key = step + j
      cards.push({ tile: tiles[key % tiles.length], key, g })
    }

    const titleY = TOP + S + 92
    return (
      <g>
        {cards.map(({ tile, key, g }) => (
          <TileView key={key} brand={brand} tile={tile} id={`${uid}k${key}`} cx={cx} cy={g.y + g.h / 2} w={g.w} h={g.h} rx={Math.min(10, g.h / 3)} a={g.a} />
        ))}
        <Word brand={brand} text={brand.name} x={cx} y={titleY} size={88} align="center" fill={K.ink} maxWidth={1100} />
        <Word brand={brand} text={brand.website || ''} x={cx - 330} y={titleY + 44} size={20} fill={K.ink} a={0.6} />
        <Word brand={brand} text="Graphic system" x={cx + 330} y={titleY + 44} size={20} align="right" fill={K.ink} a={0.6} />
      </g>
    )
  },
}
