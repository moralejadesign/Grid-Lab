import { getInfo } from '@remotion/google-fonts/HankenGrotesk'
import { getInfo as getSpaceMonoInfo } from '@remotion/google-fonts/SpaceMono'

// An SVG drawn as an image cannot see the page's fonts, so exported frames carry the font inline.
// Hanken Grotesk is a variable font: one file per subset covers every weight. Space Mono Bold sets the template labels.

let cached: Promise<string> | null = null

const toDataUrl = async (url: string) => {
  const res = await fetch(url)
  if (!res.ok) throw new Error('Could not load the font for export. Check your connection and try again.')
  const bytes = new Uint8Array(await res.arrayBuffer())
  let bin = ''
  for (let i = 0; i < bytes.length; i += 0x8000) bin += String.fromCharCode(...bytes.subarray(i, i + 0x8000))
  return `data:font/woff2;base64,${btoa(bin)}`
}

export function embeddedFontCss(): Promise<string> {
  if (!cached) {
    const info = getInfo()
    const subsets = ['latin', 'latin-ext'] as const
    const mono = getSpaceMonoInfo()
    cached = Promise.all([
      ...subsets.map(async (subset) => {
        const src = await toDataUrl(info.fonts.normal['400'][subset])
        return `@font-face{font-family:"${info.fontFamily}";font-style:normal;font-weight:100 900;src:url(${src}) format("woff2");unicode-range:${info.unicodeRanges[subset]};}`
      }),
      ...subsets.map(async (subset) => {
        const src = await toDataUrl(mono.fonts.normal['700'][subset])
        return `@font-face{font-family:"${mono.fontFamily}";font-style:normal;font-weight:700;src:url(${src}) format("woff2");unicode-range:${mono.unicodeRanges[subset]};}`
      }),
    ])
      .then((rules) => rules.join(''))
      .catch((e) => {
        cached = null
        throw e
      })
  }
  return cached
}
