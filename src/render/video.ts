import { BufferTarget, CanvasSource, Mp4OutputFormat, Output, QUALITY_HIGH, WebMOutputFormat, canEncodeVideo, type VideoCodec } from 'mediabunny'
import type { Brand } from '@/brand/types'
import type { Preset } from '@/presets/types'
import { FPS, frameAt, sequence, totalSeconds, videoFrames, type TimelineEntry } from '@/timeline/sequence'
import { embeddedFontCss } from './fonts'
import { drawFrame } from './frame'

export type VideoExport = {
  brand: Brand
  preset: Preset
  timeline: TimelineEntry[]
  showChrome: boolean
  height: 1080 | 720
  onProgress: (fraction: number) => void
  signal: AbortSignal
}

export class ExportError extends Error {}

/** Pick MP4 (H.264) when the browser can encode it, otherwise WebM. */
async function pickFormat(width: number, height: number): Promise<{ codec: VideoCodec; ext: 'mp4' | 'webm' } | null> {
  if (await canEncodeVideo('avc', { width, height, bitrate: QUALITY_HIGH })) return { codec: 'avc', ext: 'mp4' }
  for (const codec of ['vp9', 'vp8'] as const) if (await canEncodeVideo(codec, { width, height, bitrate: QUALITY_HIGH })) return { codec, ext: 'webm' }
  return null
}

/** Render the timeline in the browser and encode it. */
export async function exportVideo(o: VideoExport): Promise<{ blob: Blob; ext: 'mp4' | 'webm' }> {
  const slots = sequence(o.timeline, o.brand)
  const total = totalSeconds(slots)
  if (!slots.length) throw new ExportError('Add at least one scene to export.')
  if (typeof VideoEncoder === 'undefined') throw new ExportError('This browser cannot encode video. Use a recent version of Chrome, Edge or Safari.')

  const height = o.height
  const width = Math.round((height * 16) / 9)
  const format = await pickFormat(width, height)
  if (!format) throw new ExportError('This browser cannot encode MP4 or WebM at this size. Try 720p or another browser.')

  const css = await embeddedFontCss()
  const canvas = new OffscreenCanvas(width, height)
  const ctx = canvas.getContext('2d')!

  const output = new Output({
    format: format.ext === 'mp4' ? new Mp4OutputFormat({ fastStart: 'in-memory' }) : new WebMOutputFormat(),
    target: new BufferTarget(),
  })
  const source = new CanvasSource(canvas, { codec: format.codec, bitrate: QUALITY_HIGH, keyFrameInterval: 2 })
  output.addVideoTrack(source, { frameRate: FPS })
  await output.start()

  const frames = videoFrames(total)
  try {
    for (let i = 0; i < frames; i++) {
      if (o.signal.aborted) throw new DOMException('Export canceled', 'AbortError')
      const f = frameAt(slots, i / FPS, o.preset)!
      await drawFrame(ctx, { scene: f.slot.scene, brand: o.brand, preset: o.preset, progress: f.progress, showChrome: o.showChrome, dip: f.dip }, css)
      await source.add(i / FPS, 1 / FPS)
      if (i % 5 === 0) o.onProgress(i / frames)
    }
    await output.finalize()
  } catch (e) {
    if (output.state !== 'finalized' && output.state !== 'canceled') await output.cancel()
    throw e
  }
  o.onProgress(1)
  const buffer = (output.target as BufferTarget).buffer!
  return { blob: new Blob([buffer], { type: format.ext === 'mp4' ? 'video/mp4' : 'video/webm' }), ext: format.ext }
}
