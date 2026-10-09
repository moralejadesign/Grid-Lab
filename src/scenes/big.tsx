import type { Scene } from './types'
import { H, W, theme } from './shared'
import { Glyph, drawable, fontOf, layout } from './glyphs'
import { eout, seg } from '@/lib/motion'

const XS = [0.3, 0.7, 0.5, 0.28, 0.72]

export const big: Scene = {
  id: 'big',
  name: 'Type in use',
  section: 'Typography',
  defaultDuration: 3.5,
  keyProgress: 0.3,
  needs: null,
  Component: ({ brand, progress: p, preset }) => {
    const K = theme(preset)
    const font = fontOf(brand)
    const name = drawable(font, (brand.name || 'Brand').trim())
    const letters = name.filter((c) => c !== ' ').slice(0, 5)
    const n = letters.length
    if (!n) return null
    const span = 0.78
    const sBig = 1300 / font.unitsPerEm
    // Each letter rises from below, huge and cropped, then the full name settles in the middle.
    const giant = letters.map((ch, i) => {
      const a = (i / n) * span, b = ((i + 1) / n) * span
      if (p < a || p >= b + (i === n - 1 ? 1 : 0)) return null
      const t = seg(p, a, b)
      const g = font.glyphs[ch]
      const y = H + 190 + (1 - eout(Math.min(1, t * 3))) * H * 0.5
      return <Glyph key={i} g={g} x={W * XS[i % 5] - (g.advance * sBig) / 2} y={y} s={sBig} ink={K.ink} bg={K.bg} fill={1 - seg(p, span - 0.03, span + 0.04)} />
    })
    const fa = eout(seg(p, span, span + 0.12))
    const line = layout(font, name)
    const sName = Math.min(140 / font.unitsPerEm, 1600 / line.width)
    const x0 = (W - line.width * sName) / 2
    const base = H / 2 + (font.metrics.capHeight * sName) / 2
    return (
      <g>
        {giant}
        {fa > 0 && line.placed.map((pl, i) => pl.g && <Glyph key={`n${i}`} g={pl.g} x={x0 + pl.x * sName} y={base} s={sName} ink={K.ink} bg={K.bg} fill={fa} />)}
      </g>
    )
  },
}
