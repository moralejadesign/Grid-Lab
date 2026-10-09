import type { Brand } from './types'

export const PALETTE_NAMES = ['Primary', 'Secondary', 'Tertiary', 'Accent']

export const paletteName = (i: number) => PALETTE_NAMES[i] ?? `Color ${i + 1}`

export const paletteFromColors = (hexes: string[]): Brand['palette'] => hexes.map((hex, i) => ({ name: paletteName(i), hex }))

/** "acme-logo_final.svg" becomes "acme logo final". */
export const nameFromFile = (fileName: string) =>
  fileName.replace(/\.svg$/i, '').replace(/[-_]+/g, ' ').replace(/\s+/g, ' ').trim().slice(0, 40)
