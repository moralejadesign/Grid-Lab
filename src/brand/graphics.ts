// Graphics upload: posts, posters and other finished pieces. Images are decoded in the browser,
// downscaled and kept as data URLs. They never leave the browser, and inline data is the only way
// an SVG frame drawn as an image (export) can show them.

import type { Graphic } from './types'

export const MAX_GRAPHICS = 5
const MAX_INPUT_BYTES = 25_000_000
const MAX_EDGE = 1600
const TYPES = ['image/png', 'image/jpeg', 'image/webp']

export class GraphicError extends Error {}

export async function loadGraphic(file: File): Promise<Graphic> {
  // Raster only: an SVG can carry scripts, and posters are exported as images anyway.
  if (!TYPES.includes(file.type)) throw new GraphicError(`${file.name} is not a PNG, JPEG or WebP image.`)
  if (file.size > MAX_INPUT_BYTES) throw new GraphicError(`${file.name} is larger than 25 MB. Export a smaller version.`)
  let bmp: ImageBitmap
  try {
    bmp = await createImageBitmap(file)
  } catch {
    throw new GraphicError(`Could not read ${file.name}. Export it again as PNG or JPEG.`)
  }
  const k = Math.min(1, MAX_EDGE / Math.max(bmp.width, bmp.height))
  const width = Math.round(bmp.width * k), height = Math.round(bmp.height * k)
  const canvas = new OffscreenCanvas(width, height)
  canvas.getContext('2d')!.drawImage(bmp, 0, 0, width, height)
  bmp.close()
  // PNG keeps transparency; everything else becomes a compact JPEG.
  const blob = await canvas.convertToBlob(file.type === 'image/png' ? { type: 'image/png' } : { type: 'image/jpeg', quality: 0.88 })
  const src = await new Promise<string>((resolve, reject) => {
    const r = new FileReader()
    r.onload = () => resolve(r.result as string)
    r.onerror = () => reject(new GraphicError(`Could not read ${file.name}.`))
    r.readAsDataURL(blob)
  })
  return { src, width, height, name: file.name }
}
