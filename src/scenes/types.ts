import type React from 'react'
import type { Brand } from '@/brand/types'
import type { Preset } from '@/presets/types'

export type SceneProps = { brand: Brand; progress: number; preset: Preset }

export type Scene = {
  id: string
  name: string // shown bottom center
  section: string // shown top center
  defaultDuration: number // seconds
  keyProgress: number // 0..1, the still used for thumbnails and PNG export
  needs: 'logo' | 'photos' | 'graphics' | null
  /** Returns SVG elements drawn in a 1920x1080 coordinate space. */
  Component: React.FC<SceneProps>
}
