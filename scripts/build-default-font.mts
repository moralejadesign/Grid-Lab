// Builds src/brand/default-font.json: Hanken Grotesk outlines used when a brand has no font.
// Run with: node scripts/build-default-font.mts
import { writeFileSync } from 'node:fs'
import { create } from 'fontkit'
import { fontFromFontkit } from '../src/brand/font.ts'

// The variable TTF from the Google Fonts repository (SIL Open Font License).
const url = 'https://raw.githubusercontent.com/google/fonts/main/ofl/hankengrotesk/HankenGrotesk%5Bwght%5D.ttf'
const res = await fetch(url)
if (!res.ok) throw new Error(`Font download failed: ${res.status}`)
const font = create(Buffer.from(await res.arrayBuffer()))
const out = fontFromFontkit(font, { weight: 500, file: 'Hanken Grotesk (built in)' })
out.family = 'Hanken Grotesk'
writeFileSync(new URL('../src/brand/default-font.json', import.meta.url), JSON.stringify(out))
console.log(`${Object.keys(out.glyphs).length} glyphs, cap ${out.metrics.capHeight}, x ${out.metrics.xHeight}, upm ${out.unitsPerEm}`)
