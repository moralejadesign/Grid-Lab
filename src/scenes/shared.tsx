import type React from 'react'
import type { Brand, LogoItem } from '@/brand/types'
import type { Preset } from '@/presets/types'
import { lum } from '@/lib/color'

export const W = 1920
export const H = 1080

export type Theme = { bg: string; ink: string; dark: boolean }

export function theme(preset: Preset): Theme {
  const dark = lum(preset.background) < 0.4
  return { bg: preset.background, ink: dark ? '#f4f4f2' : '#0b0b0b', dark }
}

export type Placement = { s: number; ox: number; oy: number; w: number; h: number }
type BBox = NonNullable<Brand['logo']>['bbox']

/** Fit the logo bbox inside a mw x mh box centered on (cx, cy). */
export function place(bb: BBox, cx: number, cy: number, mw: number, mh: number): Placement {
  const s = Math.min(mw / bb.w, mh / bb.h)
  return { s, ox: cx - (bb.w * s) / 2, oy: cy - (bb.h * s) / 2, w: bb.w * s, h: bb.h * s }
}

export function toScreen(bb: BBox, pl: Placement, pt: [number, number]): [number, number] {
  return [pl.ox + pl.s * (pt[0] - bb.x), pl.oy + pl.s * (pt[1] - bb.y)]
}

const logoTransform = (bb: BBox, pl: Placement, m: number[]) =>
  `translate(${pl.ox} ${pl.oy}) scale(${pl.s}) translate(${-bb.x} ${-bb.y}) matrix(${m.join(' ')})`

type ItemOpts = {
  /** Fill opacity, and an optional single color that replaces the logo's own fills and strokes. */
  fa: number
  mono?: string
  /** Construction stroke opacity, color, drawn fraction and width in screen px. */
  sa?: number
  sc?: string
  dash?: number
  lw?: number
}

export const LogoShape: React.FC<{ bb: BBox; pl: Placement; item: LogoItem; o: ItemOpts }> = ({ bb, pl, item, o }) => {
  const { fa, mono, sa = 0, sc = '#000', dash = 0, lw = 1.4 } = o
  // Undo the logo's scale so construction lines stay hairlines in the 1920x1080 frame.
  const [a, b, c, d] = item.matrix
  const ms = Math.sqrt(Math.abs(a * d - b * c)) || 1
  return (
    <g transform={logoTransform(bb, pl, item.matrix)}>
      {fa > 0 && (
        <path
          d={item.d}
          fill={item.fill ? mono ?? item.fill : 'none'}
          fillRule={item.fillRule}
          stroke={item.stroke ? mono ?? item.stroke : 'none'}
          strokeWidth={item.stroke ? item.strokeWidth : 0}
          opacity={fa}
        />
      )}
      {sa > 0 && dash > 0 && (
        <path
          d={item.d}
          fill="none"
          stroke={sc}
          strokeWidth={lw / (pl.s * ms)}
          pathLength={1}
          strokeDasharray={dash < 1 ? `${dash} 2` : undefined}
          strokeLinejoin="round"
          opacity={sa}
        />
      )}
    </g>
  )
}

export const LogoSolid: React.FC<{ brand: Brand; pl: Placement; a: number; mono?: string }> = ({ brand, pl, a, mono }) => {
  if (!brand.logo || a <= 0) return null
  const bb = brand.logo.bbox
  return (
    <>
      {brand.logo.items.map((it, i) => (
        <LogoShape key={i} bb={bb} pl={pl} item={it} o={{ fa: a, mono }} />
      ))}
    </>
  )
}

type TxtProps = {
  x: number
  y: number
  children: React.ReactNode
  size?: number
  weight?: number
  align?: 'left' | 'center' | 'right'
  base?: 'middle' | 'alphabetic'
  col: string
  a?: number
  family: string
}

const ANCHOR = { left: 'start', center: 'middle', right: 'end' } as const

export const Txt: React.FC<TxtProps> = ({ x, y, children, size = 16, weight = 500, align = 'left', base = 'middle', col, a = 1, family }) => {
  if (a <= 0) return null
  return (
    <text
      x={x}
      y={y}
      fontFamily={family}
      fontSize={size}
      fontWeight={weight}
      textAnchor={ANCHOR[align]}
      dominantBaseline={base === 'middle' ? 'central' : 'alphabetic'}
      fill={col}
      opacity={a}
      style={{ fontVariantNumeric: 'tabular-nums' }}
    >
      {children}
    </text>
  )
}

/** Brand font if uploaded, otherwise the preset's grotesk. */
export const familyOf = (brand: Brand, preset: Preset) =>
  brand.font ? `"${brand.font.family}", ${preset.fontFamily}` : preset.fontFamily
