import type { Brand } from '@/brand/types'
import type { Scene } from '@/scenes/types'
import type { Preset } from '@/presets/types'
import { clamp } from '@/lib/motion'
import { isAvailable, sceneById } from '@/scenes/registry'

export const FPS = 30
export const MIN_SCENE_SECONDS = 0.5
export const MAX_SCENE_SECONDS = 60

export type TimelineEntry = { id: string; duration: number }

export type Slot = {
  scene: Scene
  duration: number
  start: number
  end: number
}

/** Resolve the timeline into playable slots, skipping scenes whose assets are missing. */
export function sequence(entries: TimelineEntry[], brand: Brand): Slot[] {
  const out: Slot[] = []
  let t = 0
  for (const e of entries) {
    const scene = sceneById(e.id)
    if (!scene || !isAvailable(scene, brand)) continue
    out.push({ scene, duration: e.duration, start: t, end: t + e.duration })
    t += e.duration
  }
  return out
}

export const totalSeconds = (slots: Slot[]) => slots.reduce((n, s) => n + s.duration, 0)
/** Frame count for a video of `seconds`. There is no length limit. */
export const videoFrames = (seconds: number) => Math.max(1, Math.round(seconds * FPS))

export const defaultTimeline: TimelineEntry[] = ['intro', 'logo', 'safe', 'layout', 'construct', 'colors', 'outro'].map((id) => ({
  id,
  duration: sceneById(id)!.defaultDuration,
}))

const DIP = 0.25 // seconds of dip to background at each scene edge

export type FrameAt = { slot: Slot; progress: number; dip: number }

/** What is on screen at time T: the active slot, its local progress and the transition dip. Pure. */
export function frameAt(slots: Slot[], T: number, preset: Preset): FrameAt | null {
  if (!slots.length) return null
  let i = slots.findIndex((s) => T < s.end)
  if (i < 0) i = slots.length - 1
  const slot = slots[i]
  const local = clamp(T - slot.start, 0, slot.duration)
  const dip = preset.transition === 'fade' ? 1 - clamp(Math.min(local / DIP, (slot.duration - local) / DIP)) : 0
  return { slot, progress: local / slot.duration, dip }
}
