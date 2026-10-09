import type React from 'react'
import type { Brand } from '@/brand/types'
import type { Preset } from '@/presets/types'
import type { Scene } from './types'
import { H, W, theme } from './shared'
import { clamp } from '@/lib/motion'
import { Template } from './Template'

type Props = {
  scene: Scene
  brand: Brand
  preset: Preset
  progress: number
  /** Register marks and labels on top of the scene. */
  showChrome: boolean
  /** 0..1 dip to background over the whole frame, for transitions. */
  dip?: number
  /** For export: fixed pixel size and CSS (embedded @font-face) so the SVG renders on its own as an image. */
  exportSize?: { width: number; height: number; css: string }
}

/** One frame of a scene: background, the scene, then the Grid Lab template. Pure, so it works in the Player, thumbnails and server renders. */
export const SceneView: React.FC<Props> = ({ scene, brand, preset, progress, showChrome, dip = 0, exportSize }) => {
  const K = theme(preset)
  const C = scene.Component
  return (
    <svg
      xmlns="http://www.w3.org/2000/svg"
      viewBox={`0 0 ${W} ${H}`}
      width={exportSize?.width ?? '100%'}
      height={exportSize?.height ?? '100%'}
      style={{ display: 'block' }}
      strokeLinejoin="round"
    >
      {exportSize && <style>{exportSize.css}</style>}
      <rect width={W} height={H} fill={K.bg} />
      <C brand={brand} preset={preset} progress={clamp(progress)} />
      {dip > 0 && <rect width={W} height={H} fill={K.bg} opacity={dip} />}
      {showChrome && <Template brand={brand} K={K} />}
    </svg>
  )
}
