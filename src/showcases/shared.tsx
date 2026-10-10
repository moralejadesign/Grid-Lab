import type React from 'react'
import type { Brand } from '@/brand/types'
import { hexRgb, lum } from '@/lib/color'
import { drawable, fontOf, layout } from '@/scenes/glyphs'
import { LogoSolid, place } from '@/scenes/shared'

// Shared pieces for the showcase animations: brand type set from outlines, and tiles (cards)
// that hold a graphic, or a palette color with the logo or a letter on it.

type WordProps = {
  brand: Brand
  text: string
  /** Anchor x, baseline y and em size, all in frame pixels. */
  x: number
  y: number
  size: number
  align?: 'left' | 'center' | 'right'
  fill: string
  a?: number
  /** Shrinks the size so the line is at most this wide. */
  maxWidth?: number
}

/** A line of text drawn from the brand font's outlines. */
export const Word: React.FC<WordProps> = ({ brand, text, x, y, size, align = 'left', fill, a = 1, maxWidth }) => {
  if (a <= 0 || !text) return null
  const font = fontOf(brand)
  const line = layout(font, drawable(font, text))
  const fit = maxWidth && line.width ? Math.min(1, maxWidth / ((line.width * size) / font.unitsPerEm)) : 1
  const s = (size * fit) / font.unitsPerEm
  const w = line.width * s
  const x0 = align === 'center' ? x - w / 2 : align === 'right' ? x - w : x
  return (
    <g fill={fill} opacity={a}>
      {line.placed.map((p, i) => p.g && <path key={i} d={p.g.d} transform={`translate(${x0 + p.x * s} ${y}) scale(${s})`} />)}
    </g>
  )
}

/** Width of `text` at em `size`, in frame pixels. */
export function wordWidth(brand: Brand, text: string, size: number) {
  const font = fontOf(brand)
  return layout(font, drawable(font, text)).width * (size / font.unitsPerEm)
}

/** Readable ink on a colored surface. */
export const inkOn = (hex: string) => (lum(hex) < 0.55 ? '#ffffff' : '#0b0b0b')

/** The palette color with the most chroma, for the brand's signature surface. */
export function accentOf(brand: Brand) {
  let best = brand.palette[0]?.hex ?? '#2f6bff', score = -1
  for (const c of brand.palette) {
    const [r, g, b] = hexRgb(c.hex)
    const chroma = Math.max(r, g, b) - Math.min(r, g, b)
    if (chroma > score) { score = chroma; best = c.hex }
  }
  return best
}

export type Tile =
  | { kind: 'image'; src: string; aspect: number }
  | { kind: 'color'; hex: string; mark: 'logo' | 'letter' | 'none' }

/**
 * `n` tiles that mix the brand's graphics with palette cards, so a showcase reads as a system
 * even with one or two uploads. Graphics come first and alternate with color cards.
 */
export function tilesOf(brand: Brand, n: number): Tile[] {
  const images: Tile[] = brand.graphics.map((g) => ({ kind: 'image', src: g.src, aspect: g.width / g.height }))
  const marks = ['logo', 'letter', 'none'] as const
  const colors: Tile[] = (brand.palette.length ? brand.palette : [{ name: '', hex: '#2f6bff' }]).map((c, i) => ({
    kind: 'color',
    hex: c.hex,
    mark: brand.logo ? marks[i % 3] : i % 2 ? 'letter' : 'none',
  }))
  const out: Tile[] = []
  for (let i = 0; out.length < n; i++) {
    if (images.length) out.push(images[i % images.length])
    if (out.length < n) out.push(colors[i % colors.length])
  }
  return out
}

type TileViewProps = {
  brand: Brand
  tile: Tile
  /** Clip id, unique in the document. */
  id: string
  cx: number
  cy: number
  w: number
  h: number
  /** Degrees. */
  rot?: number
  rx?: number
  a?: number
  /** Thin outline in this color, for tiles on a matching background. */
  edge?: string
}

/** One tile centered on (cx, cy). Images fill the card and crop. */
export const TileView: React.FC<TileViewProps> = ({ brand, tile, id, cx, cy, w, h, rot = 0, rx = 16, a = 1, edge }) => {
  if (a <= 0 || w < 1 || h < 1) return null
  const x = -w / 2, y = -h / 2
  const r = Math.min(rx, w / 2, h / 2)
  return (
    <g transform={`translate(${cx} ${cy}) rotate(${rot})`} opacity={a}>
      {tile.kind === 'image' ? (
        <>
          <clipPath id={id}><rect x={x} y={y} width={w} height={h} rx={r} /></clipPath>
          <image href={tile.src} x={x} y={y} width={w} height={h} preserveAspectRatio="xMidYMid slice" clipPath={`url(#${id})`} />
        </>
      ) : (
        <>
          <rect x={x} y={y} width={w} height={h} rx={r} fill={tile.hex} />
          <TileMark brand={brand} hex={tile.hex} mark={tile.mark} w={w} h={h} />
        </>
      )}
      {edge && <rect x={x} y={y} width={w} height={h} rx={r} fill="none" stroke={edge} strokeWidth={1} opacity={0.2} />}
    </g>
  )
}

const TileMark: React.FC<{ brand: Brand; hex: string; mark: 'logo' | 'letter' | 'none'; w: number; h: number }> = ({ brand, hex, mark, w, h }) => {
  const ink = inkOn(hex)
  const m = Math.min(w, h)
  if (mark === 'logo' && brand.logo) {
    return <LogoSolid brand={brand} pl={place(brand.logo.bbox, 0, 0, m * 0.5, m * 0.5)} a={1} mono={ink} />
  }
  if (mark === 'letter') {
    const ch = [...(brand.specimenGlyph || brand.name || 'A')][0]
    return <Word brand={brand} text={ch} x={0} y={m * 0.24} size={m * 0.66} align="center" fill={ink} />
  }
  return null
}
