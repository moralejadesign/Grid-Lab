import type { Scene } from './types'
import { H, W, Txt, theme } from './shared'
import { Glyph, drawable, fontOf } from './glyphs'
import { eio, eout, seg } from '@/lib/motion'

export const anatomy: Scene = {
  id: 'type',
  name: 'Type anatomy',
  section: 'Typography',
  defaultDuration: 4,
  keyProgress: 0.88,
  needs: null,
  Component: ({ brand, progress: p, preset }) => {
    const K = theme(preset)
    const font = fontOf(brand)
    const ch = drawable(font, brand.specimenGlyph || (brand.name || '').trim() || 'a').find((c) => c !== ' ') ?? 'a'
    const g = font.glyphs[ch] ?? font.glyphs.a
    if (!g) return null
    const { ascender, capHeight, xHeight, descender } = font.metrics
    const s = 620 / font.unitsPerEm
    const base = H * 0.7
    const lines: [string, number][] = [['Ascender', ascender], ['Cap height', capHeight], ['x-height', xHeight], ['Baseline', 0], ['Descender', descender]]
    const x0 = W * 0.07, x1 = W * 0.93
    const dp = eio(seg(p, 0.12, 0.55))
    const fa = eout(seg(p, 0.62, 0.9))
    const left = W * 0.3 - (g.advance * s) / 2
    const right = W * 0.7 - (g.advance * s) / 2
    return (
      <g>
        {lines.map(([name, v], i) => {
          const y = base - v * s
          const lp = eio(seg(p, i * 0.04, i * 0.04 + 0.25))
          const onRight = i % 2 === 1
          return (
            <g key={name}>
              <line x1={x0} y1={y} x2={x0 + (x1 - x0) * lp} y2={y} stroke={K.ink} strokeWidth={1} opacity={0.4} />
              <Txt x={onRight ? x1 : x0} y={y - 14} size={14} weight={600} align={onRight ? 'right' : 'left'} col={K.ink} family={preset.fontFamily}
                a={0.85 * seg(p, i * 0.04 + 0.15, i * 0.04 + 0.3)}>
                {`${name}  ${Math.round(Math.abs(v))}`}
              </Txt>
            </g>
          )
        })}
        <Glyph g={g} x={left} y={base} s={s} ink={K.ink} bg={K.bg} draw={dp} outline={dp > 0 ? 1 : 0} points={seg(p, 0.5, 0.72)} pointsAlpha={1} hairline={1.6} />
        {fa > 0 && <Glyph g={g} x={right + (1 - fa) * 60} y={base} s={s} ink={K.ink} bg={K.bg} fill={fa} />}
      </g>
    )
  },
}
