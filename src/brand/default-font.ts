import type { BrandFont } from './types'
import data from './default-font.json'

/** Hanken Grotesk outlines, used by type scenes when the brand has no font. Rebuild with scripts/build-default-font.mts. */
export const defaultFont = data as unknown as BrandFont
