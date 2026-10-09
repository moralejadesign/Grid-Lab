import type { Scene } from './types'
import { H, W, theme } from './shared'
import { Glyph, fontOf } from './glyphs'
import { CHARSET } from '@/brand/font'
import { eio, eout, rng, seg } from '@/lib/motion'

const SET = [...CHARSET].filter((c) => !` .,:;'"-()/`.includes(c))

export const glyphset: Scene = {
  id: 'glyphs',
  name: 'Glyph set',
  section: 'Typography',
  defaultDuration: 3,
  keyProgress: 0.45,
  needs: null,
  Component: ({ brand, progress: p, preset }) => {
    const K = theme(preset)
    const font = fontOf(brand)
    const list = SET.filter((c) => font.glyphs[c])
    const cell = 200
    const cols = Math.ceil(W / cell) + 1
    const rows = Math.ceil(list.length / cols)
    const s = 150 / font.unitsPerEm
    const scroll = eio(p) * Math.max(0, rows * cell - H + cell * 0.5) * 0.6
    // A few glyphs get a hairline cell, changing seven times through the scene.
    const r = rng(11 + Math.floor(p * 7))
    const marked = new Set(Array.from({ length: 4 }, () => Math.floor(r() * list.length)))
    const offset = (cols * cell - W) / 2
    return (
      <g>
        {list.map((ch, i) => {
          const col = i % cols, row = Math.floor(i / cols)
          const cx = col * cell + cell / 2 - offset
          const y = row * cell + cell * 0.75 - scroll
          if (y < -cell || y > H + cell) return null
          const g = font.glyphs[ch]
          const a = eout(seg(p, 0, 0.1 + (i / list.length) * 0.1))
          return (
            <g key={ch} opacity={a}>
              {marked.has(i) && <rect x={cx - cell / 2 + 10} y={y - cell * 0.75 + 10} width={cell - 20} height={cell - 20} fill="none" stroke={K.ink} strokeWidth={1} opacity={0.5} />}
              <Glyph g={g} x={cx - (g.advance * s) / 2} y={y} s={s} ink={K.ink} bg={K.bg} fill={1} />
            </g>
          )
        })}
      </g>
    )
  },
}
