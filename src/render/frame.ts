import { createElement } from 'react'
import { renderToStaticMarkup } from 'react-dom/server'
import type { Brand } from '@/brand/types'
import type { Preset } from '@/presets/types'
import type { Scene } from '@/scenes/types'
import { SceneView } from '@/scenes/SceneView'

export type FrameInput = {
  scene: Scene
  brand: Brand
  preset: Preset
  progress: number
  showChrome: boolean
  dip?: number
}

/** Draw one frame onto a canvas. The scene is rendered to standalone SVG markup, then rasterized. */
export async function drawFrame(ctx: CanvasRenderingContext2D | OffscreenCanvasRenderingContext2D, input: FrameInput, css: string) {
  const { width, height } = ctx.canvas
  const markup = renderToStaticMarkup(createElement(SceneView, { ...input, exportSize: { width, height, css } }))
  const url = URL.createObjectURL(new Blob([markup], { type: 'image/svg+xml' }))
  try {
    const img = new Image(width, height)
    img.src = url
    await img.decode()
    ctx.clearRect(0, 0, width, height)
    ctx.drawImage(img, 0, 0, width, height)
  } finally {
    URL.revokeObjectURL(url)
  }
}
