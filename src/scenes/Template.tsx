import type React from 'react'
import type { Brand } from '@/brand/types'
import { H, W, type Theme } from './shared'

// The frame every Grid Lab video wears: register marks in the corners, the product name top left,
// the credit top right and the brand's website bottom center.

export const TEMPLATE_FONT = '"Space Mono", ui-monospace, monospace'

const INSET_X = 58
const TOP = 56
const BOTTOM = H - 52
const ARM = 22
const RING = 8.5

/** A printer's register mark: a ring with a crosshair through it. */
const RegisterMark: React.FC<{ x: number; y: number; ink: string }> = ({ x, y, ink }) => (
  <g stroke={ink} strokeWidth={1.2} fill="none" opacity={0.6}>
    <circle cx={x} cy={y} r={RING} />
    <line x1={x - ARM} y1={y} x2={x + ARM} y2={y} />
    <line x1={x} y1={y - ARM} x2={x} y2={y + ARM} />
  </g>
)

const Label: React.FC<{ x: number; y: number; anchor: 'start' | 'middle' | 'end'; ink: string; children: string }> = ({ x, y, anchor, ink, children }) => (
  <text x={x} y={y} textAnchor={anchor} dominantBaseline="central" fill={ink}
    fontFamily={TEMPLATE_FONT} fontSize={15} fontWeight={700} letterSpacing="0.34em" style={{ textTransform: 'uppercase' }}>
    {children.toUpperCase()}
  </text>
)

export const Template: React.FC<{ brand: Brand; K: Theme }> = ({ brand, K }) => {
  const left = INSET_X, right = W - INSET_X
  const website = (brand.website ?? '').trim()
  return (
    <g>
      <RegisterMark x={left} y={TOP} ink={K.ink} />
      <RegisterMark x={right} y={TOP} ink={K.ink} />
      <RegisterMark x={left} y={BOTTOM} ink={K.ink} />
      <RegisterMark x={right} y={BOTTOM} ink={K.ink} />
      <Label x={left + 50} y={TOP} anchor="start" ink={K.ink}>Grid Lab</Label>
      {/* letter-spacing trails the last letter, so pull right-aligned text in by one gap */}
      <Label x={right - 50 + 5} y={TOP} anchor="end" ink={K.ink}>Built by moraleja.co</Label>
      {website && <Label x={W / 2 + 2.5} y={BOTTOM} anchor="middle" ink={K.ink}>{website}</Label>}
    </g>
  )
}
