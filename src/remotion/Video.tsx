import type React from 'react'
import { useCurrentFrame, useVideoConfig } from 'remotion'
import type { Brand } from '@/brand/types'
import type { Preset } from '@/presets/types'
import { SceneView } from '@/scenes/SceneView'
import { frameAt, sequence, type TimelineEntry } from '@/timeline/sequence'

export type VideoProps = { brand: Brand; preset: Preset; timeline: TimelineEntry[]; showChrome: boolean }

/** The full brand video: scenes in timeline order, with a dip to background between them. */
export const Video: React.FC<VideoProps> = ({ brand, preset, timeline, showChrome }) => {
  const frame = useCurrentFrame()
  const { fps } = useVideoConfig()
  const f = frameAt(sequence(timeline, brand), frame / fps, preset)
  if (!f) return <svg viewBox="0 0 1920 1080" width="100%" height="100%"><rect width={1920} height={1080} fill={preset.background} /></svg>
  const { slot, progress, dip } = f
  return <SceneView scene={slot.scene} brand={brand} preset={preset} progress={progress} showChrome={showChrome} dip={dip} />
}
