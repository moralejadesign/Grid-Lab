import type { Brand, LogoItem } from './types'
import { anchorsFromD, circleD } from './svg'

const I = [1, 0, 0, 1, 0, 0]
const quarter = (d: string, fill: string): LogoItem => ({
  d, matrix: I, fill, strokeWidth: 0, fillRule: 'nonzero', anchors: anchorsFromD(d),
})

/** "Quadra", the sample brand from the prototype. Used by the editor, Remotion Studio and visual tests. */
export const sampleBrand: Brand = {
  name: 'Quadra',
  openingLine: 'Four parts. One circle.',
  website: 'quadra.example',
  principles: ['Simple', 'Bold', 'Human', 'Alive'],
  palette: [
    { name: 'Primary', hex: '#ff5a36' },
    { name: 'Secondary', hex: '#ffc93c' },
    { name: 'Tertiary', hex: '#2b59ff' },
    { name: 'Accent', hex: '#111111' },
    { name: 'Color 5', hex: '#f4f1ea' },
  ],
  logo: {
    items: [
      quarter('M200 200L200 50A150 150 0 0 1 350 200Z', '#ff5a36'),
      quarter('M200 200L350 200A150 150 0 0 1 200 350Z', '#ffc93c'),
      quarter('M200 200L200 350A150 150 0 0 1 50 200Z', '#2b59ff'),
      quarter('M200 200L50 200A150 150 0 0 1 200 50Z', '#111111'),
      {
        d: circleD(200, 200, 34), matrix: I, fill: '#f4f1ea', strokeWidth: 0, fillRule: 'nonzero',
        anchors: [[166, 200], [200, 166], [234, 200], [200, 234]],
      },
    ],
    bbox: { x: 50, y: 50, w: 300, h: 300 },
  },
  photos: [],
  graphics: [],
  layout: { clearSpace: 0.3, columns: 6, margin: 0.06 },
}
