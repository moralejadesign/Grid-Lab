import type { Preset } from './types'

/** First preset. Near-black canvas, light hairlines, mechanical drawn motion, inside the Grid Lab template. */
export const drawnPreset: Preset = {
  id: 'drawn',
  name: 'Drawn',
  background: '#0b0b0b',
  hairline: 1.4,
  fontFamily: '"Hanken Grotesk", system-ui, sans-serif',
  transition: 'fade',
}
