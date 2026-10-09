import { zipSync } from 'fflate'
import type { Brand } from '@/brand/types'
import type { Preset } from '@/presets/types'
import type { Scene } from '@/scenes/types'
import { isAvailable, scenes } from '@/scenes/registry'
import { embeddedFontCss } from './fonts'
import { drawFrame } from './frame'

type StillOptions = { brand: Brand; preset: Preset; showChrome: boolean }

async function scenePng(scene: Scene, o: StillOptions, css: string): Promise<Blob> {
  const canvas = new OffscreenCanvas(1920, 1080)
  await drawFrame(canvas.getContext('2d')!, {
    scene, brand: o.brand, preset: o.preset, progress: scene.keyProgress, showChrome: o.showChrome,
  }, css)
  return canvas.convertToBlob({ type: 'image/png' })
}

/** The scene's key frame as a 1920x1080 PNG. */
export async function exportScenePng(scene: Scene, o: StillOptions) {
  return scenePng(scene, o, await embeddedFontCss())
}

/** Every available scene's key frame, zipped. Files are numbered in scene order. */
export async function exportAllPngs(o: StillOptions, onProgress: (f: number) => void): Promise<Blob> {
  const css = await embeddedFontCss()
  const list = scenes.filter((s) => isAvailable(s, o.brand))
  const files: Record<string, Uint8Array> = {}
  for (const [i, s] of list.entries()) {
    const png = await scenePng(s, o, css)
    files[`${String(scenes.indexOf(s) + 1).padStart(2, '0')}-${s.id}.png`] = new Uint8Array(await png.arrayBuffer())
    onProgress((i + 1) / list.length)
  }
  // PNGs are already compressed, so store them as is.
  return new Blob([zipSync(files, { level: 0 })], { type: 'application/zip' })
}
