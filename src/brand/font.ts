// Font parsing. Turns a font file into the outline data scenes draw from, so type scenes never
// depend on a font being installed or loaded in the page. Used in the browser for uploads and by
// scripts/build-default-font.mts for the built-in Hanken Grotesk.
// Keep imports relative: the build script runs this file with Node directly.

import type { Font, FontCollection, PathCommand } from 'fontkit'
import type { BrandFont, GlyphOutline } from './types'

/** Characters every type scene can draw: Latin letters, figures, common punctuation and accents. */
export const CHARSET =
  'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789&@#%?!.,:;\'"-()/ ' +
  'ÁÀÂÄÃÅÇÉÈÊËÍÌÎÏÑÓÒÔÖÕÚÙÛÜÝáàâäãåçéèêëíìîïñóòôöõúùûüýß'

const r = (n: number) => Math.round(n) + 0 // + 0 turns -0 into 0

/** One glyph as y-down path data (baseline at 0), plus its on-curve nodes and off-curve handles. */
export function glyphOutline(commands: PathCommand[], advance: number): GlyphOutline {
  let d = ''
  const nodes: [number, number][] = []
  const handles: [number, number, number, number][] = []
  let px = 0, py = 0
  for (const c of commands) {
    const a = c.args.map((v, i) => (i % 2 ? -v : v)).map(r)
    switch (c.command) {
      case 'moveTo':
        d += `M${a[0]} ${a[1]}`
        nodes.push([a[0], a[1]])
        ;[px, py] = a
        break
      case 'lineTo':
        d += `L${a[0]} ${a[1]}`
        nodes.push([a[0], a[1]])
        ;[px, py] = a
        break
      case 'quadraticCurveTo':
        d += `Q${a.join(' ')}`
        handles.push([px, py, a[0], a[1]], [a[2], a[3], a[0], a[1]])
        nodes.push([a[2], a[3]])
        ;[px, py] = [a[2], a[3]]
        break
      case 'bezierCurveTo':
        d += `C${a.join(' ')}`
        handles.push([px, py, a[0], a[1]], [a[4], a[5], a[2], a[3]])
        nodes.push([a[4], a[5]])
        ;[px, py] = [a[4], a[5]]
        break
      case 'closePath':
        d += 'Z'
        break
    }
  }
  // Closing a contour repeats its first point; drop consecutive duplicates.
  const uniq = nodes.filter((n, i) => i === 0 || n[0] !== nodes[i - 1][0] || n[1] !== nodes[i - 1][1])
  return { d, advance: r(advance), nodes: uniq, handles }
}

/** The typographic family name ("Space Grotesk"), not the default instance's ("Space Grotesk Light"). */
function familyOf(font: Font): string {
  const records = (font as Font & { name?: { records?: { preferredFamily?: Record<string, string> } } }).name?.records
  const preferred = records?.preferredFamily
  return (preferred && (preferred.en ?? Object.values(preferred)[0])) || font.familyName || 'Brand font'
}

/** Pick the regular-ish instance of a variable font so outlines match a text weight. */
function instance(font: Font, weight: number): Font {
  const wght = font.variationAxes?.wght
  if (!wght) return font
  try {
    const v = font.getVariation({ wght: Math.min(wght.max, Math.max(wght.min, weight)) })
    v.hasGlyphForCodePoint(0x41) // fontkit loses the cmap of some WOFF2 instances; this throws if so
    return v
  } catch {
    return font
  }
}

export function fontFromFontkit(input: Font | FontCollection, opts: { weight?: number; file?: string } = {}): BrandFont {
  const base = 'fonts' in input ? input.fonts[0] : input
  const font = instance(base, opts.weight ?? 500)
  const glyphs: Record<string, GlyphOutline> = {}
  for (const ch of CHARSET) {
    const cp = ch.codePointAt(0)!
    if (!font.hasGlyphForCodePoint(cp)) continue
    const g = font.glyphForCodePoint(cp)
    glyphs[ch] = glyphOutline(g.path.commands, g.advanceWidth)
  }
  const bboxTop = (ch: string) => {
    const cp = ch.codePointAt(0)!
    return font.hasGlyphForCodePoint(cp) ? font.glyphForCodePoint(cp).bbox.maxY : 0
  }
  return {
    family: familyOf(base),
    file: opts.file ?? '',
    unitsPerEm: font.unitsPerEm,
    metrics: {
      // Some fonts leave these at 0 in the OS/2 table; measure the letters instead.
      capHeight: r(font.capHeight || bboxTop('H')),
      xHeight: r(font.xHeight || bboxTop('x')),
      ascender: r(font.ascent),
      descender: r(font.descent),
    },
    glyphs,
  }
}

export const MAX_FONT_BYTES = 10_000_000
export class FontError extends Error {}

/** Parse an uploaded font in the browser. The file stays in memory; nothing is uploaded. */
export async function parseFontFile(file: File): Promise<BrandFont> {
  if (file.size > MAX_FONT_BYTES) throw new FontError('That font is larger than 10 MB. Upload a single style as TTF, OTF, WOFF or WOFF2.')
  if (!/\.(ttf|otf|woff2?)$/i.test(file.name)) throw new FontError('Upload a TTF, OTF, WOFF or WOFF2 file.')
  const { create } = await import('fontkit')
  let parsed: Font | FontCollection
  try {
    parsed = create(new Uint8Array(await file.arrayBuffer()) as unknown as Buffer)
  } catch {
    throw new FontError('Could not read that font file. Export it again as TTF or OTF and try again.')
  }
  const font = fontFromFontkit(parsed, { file: file.name })
  const count = Object.keys(font.glyphs).length
  if (count < 26) throw new FontError(`That font has only ${count} of the letters Grid Lab draws. Use a font with the full Latin alphabet.`)
  return font
}
