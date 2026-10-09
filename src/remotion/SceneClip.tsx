import type React from 'react'
import { useCurrentFrame, useVideoConfig } from 'remotion'
import type { Brand } from '@/brand/types'
import type { Preset } from '@/presets/types'
import { SceneView } from '@/scenes/SceneView'
import { sceneById } from '@/scenes/registry'

export type SceneClipProps = { sceneId: string; brand: Brand; preset: Preset; showChrome: boolean }

/** A single scene played once from start to end. Used for the frame preview and Remotion Studio. */
export const SceneClip: React.FC<SceneClipProps> = ({ sceneId, brand, preset, showChrome }) => {
  const frame = useCurrentFrame()
  const { durationInFrames } = useVideoConfig()
  const scene = sceneById(sceneId)
  if (!scene) return null
  return <SceneView scene={scene} brand={brand} preset={preset} progress={frame / Math.max(1, durationInFrames - 1)} showChrome={showChrome} />
}
