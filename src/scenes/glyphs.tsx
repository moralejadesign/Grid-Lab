import type React from 'react'
import type { Brand, BrandFont, GlyphOutline } from '@/brand/types'
import { defaultFont } from '@/brand/default-font'
import { eout, seg } from '@/lib/motion'

export const fontOf = (brand: Brand): BrandFont => brand.font ?? defaultFont

/** Characters of `text` the font can draw, in order. */
export const drawable = (font: BrandFont, text: string) => [...text].filter((ch) => ch === ' ' || font.glyphs[ch])

export type Placed = { ch: string; g: GlyphOutline | undefined; x: number }

/** Lay out a line in font units (no kerning). Spaces use the space glyph or a quarter em. */
export function layout(font: BrandFont, chars: string[]): { placed: Placed[]; width: number } {
  let x = 0
  const placed = chars.map((ch) => {
    const g = font.glyphs[ch]
    const p = { ch, g: ch === ' ' ? undefined : g, x }
    x += g?.advance ?? font.unitsPerEm * 0.25
    return p
  })
  return { placed, width: x }
}

type GlyphProps = {
  g: GlyphOutline
  /** Origin of the glyph (left edge, baseline) in frame pixels, and pixels per font unit. */
  x: number
  y: number
  s: number
  ink: string
  bg: string
  /** Fill opacity. */
  fill?: number
  /** Outline: fraction drawn (0..1) and opacity. */
  draw?: number
  outline?: number
  /** Construction points: how many have appeared (0..1 of the list, each pops in) and overall opacity. */
  points?: number
  pointsAlpha?: number
  /** Show curve handles with the points. Off gives the plain node squares of a close-up. */
  handles?: boolean
  /** Side of a node square in pixels. */
  nodeSize?: number
  hairline?: number
}

/** One glyph with its construction: outline drawn on, anchor squares, handle lines and hollow control points. */
export const Glyph: React.FC<GlyphProps> = ({ g, x, y, s, ink, bg, fill = 0, draw = 1, outline = 0, points = 0, pointsAlpha = 1, handles = true, nodeSize = 8, hairline = 1.3 }) => {
  const n = g.nodes.length
  const shown = (i: number, total: number) => eout(seg(points * (total + 3), i, i + 3)) // pops in one after another
  const sq = nodeSize, cr = 4
  const P = (px: number, py: number): [number, number] => [x + px * s, y + py * s]
  return (
    <g>
      {fill > 0 && <path d={g.d} transform={`translate(${x} ${y}) scale(${s})`} fill={ink} opacity={fill} />}
      {outline > 0 && draw > 0 && (
        <path d={g.d} transform={`translate(${x} ${y}) scale(${s})`} fill="none" stroke={ink} strokeWidth={hairline / s}
          pathLength={1} strokeDasharray={draw < 1 ? `${draw} 2` : undefined} opacity={outline} />
      )}
      {points > 0 && pointsAlpha > 0 && (
        <g opacity={pointsAlpha}>
          {handles && g.handles.map(([nx, ny, cx, cy], i) => {
            // Handles belong to the node they leave from, so they arrive with it.
            const q = shown(Math.floor((i / Math.max(1, g.handles.length)) * n), n)
            if (q <= 0) return null
            const [ax, ay] = P(nx, ny), [bx, by] = P(cx, cy)
            return (
              <g key={`h${i}`} opacity={q}>
                <line x1={ax} y1={ay} x2={ax + (bx - ax) * q} y2={ay + (by - ay) * q} stroke={ink} strokeWidth={1} opacity={0.45} />
                <circle cx={ax + (bx - ax) * q} cy={ay + (by - ay) * q} r={cr} fill={bg} stroke={ink} strokeWidth={1} opacity={0.8} />
              </g>
            )
          })}
          {g.nodes.map(([nx, ny], i) => {
            const q = shown(i, n)
            if (q <= 0) return null
            const [px, py] = P(nx, ny), h = (sq * q) / 2
            return <rect key={`n${i}`} x={px - h} y={py - h} width={h * 2} height={h * 2} fill={ink} />
          })}
        </g>
      )}
    </g>
  )
}
