import { createElement } from 'react'
import { renderToStaticMarkup } from 'react-dom/server'
import { describe, expect, it } from 'vitest'
import { sampleBrand } from '@/brand/sample'
import type { Brand } from '@/brand/types'
import { drawnPreset } from '@/presets'
import { brandShowcase, graphicTemplates } from '@/scenes/registry'
import { SceneView } from '@/scenes/SceneView'
import { tilesOf } from './shared'

const PIXEL = 'data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAQAAAC1HAwCAAAAC0lEQVR42mNkYAAAAAYAAjCB0C8AAAAASUVORK5CYII='
const withGraphics: Brand = {
  ...sampleBrand,
  graphics: [
    { src: PIXEL, width: 800, height: 1000, name: 'a.png' },
    { src: PIXEL, width: 1600, height: 900, name: 'b.png' },
  ],
}

const render = (scene: (typeof graphicTemplates)[number], brand: Brand, progress: number) =>
  renderToStaticMarkup(createElement(SceneView, { scene, brand, preset: drawnPreset, progress, showChrome: true }))

describe('showcases', () => {
  for (const scene of [...graphicTemplates, brandShowcase]) {
    for (const [label, brand] of [['sample', sampleBrand], ['with graphics', withGraphics]] as const) {
      it(`${scene.id} renders every frame with ${label}`, () => {
        for (let i = 0; i <= 40; i++) {
          const svg = render(scene, brand, i / 40)
          expect(svg).not.toMatch(/NaN|Infinity/)
        }
      })
    }
  }

  it('renders the same frame twice for the same input', () => {
    for (const scene of [...graphicTemplates, brandShowcase]) {
      expect(render(scene, withGraphics, 0.37)).toBe(render(scene, withGraphics, 0.37))
    }
  })

  it('fills tiles with palette cards when there are no graphics', () => {
    const tiles = tilesOf(sampleBrand, 7)
    expect(tiles).toHaveLength(7)
    expect(tiles.every((t) => t.kind === 'color')).toBe(true)
  })

  it('alternates graphics and palette cards', () => {
    const kinds = tilesOf(withGraphics, 4).map((t) => t.kind)
    expect(kinds).toEqual(['image', 'color', 'image', 'color'])
  })
})
