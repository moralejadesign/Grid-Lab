export type LogoItem = {
  d: string
  matrix: number[] // [a, b, c, d, e, f]
  fill?: string
  stroke?: string
  strokeWidth: number
  fillRule: 'nonzero' | 'evenodd'
  anchors: [number, number][]
}

/** A glyph in font units, y-down with the baseline at 0. */
export type GlyphOutline = {
  d: string
  advance: number
  nodes: [number, number][] // on-curve points
  handles: [number, number, number, number][] // node x, node y, control x, control y
}

export type BrandFont = {
  family: string
  file: string // storage URL once accounts exist; the file name until then
  unitsPerEm: number
  metrics: { xHeight: number; capHeight: number; ascender: number; descender: number } // font units
  glyphs: Record<string, GlyphOutline> // see CHARSET in font.ts
}

/** An uploaded graphic, downscaled and stored inline so exported frames can draw it. */
export type Graphic = { src: string; width: number; height: number; name: string }

export type Brand = {
  name: string
  openingLine: string
  website?: string // shown bottom center of every frame
  principles: string[] // up to 6
  specimenGlyph?: string // defaults to first letter of name
  palette: { name: string; hex: string }[]
  logo?: {
    items: LogoItem[]
    bbox: { x: number; y: number; w: number; h: number }
  }
  font?: BrandFont
  photos: string[] // storage URLs
  graphics: Graphic[] // posts, posters and other graphics, up to MAX_GRAPHICS
  layout: { clearSpace: number; columns: number; margin: number }
}
