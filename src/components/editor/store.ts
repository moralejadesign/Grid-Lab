import { create } from 'zustand'
import type { Brand, BrandFont, Graphic } from '@/brand/types'
import { MAX_GRAPHICS } from '@/brand/graphics'
import { sampleBrand } from '@/brand/sample'
import { nameFromFile, paletteFromColors } from '@/brand/palette'
import type { ParsedSvg } from '@/brand/svg'
import { drawnPreset, type Preset } from '@/presets'
import { scenes, sceneById } from '@/scenes/registry'
import { MAX_SCENE_SECONDS, MIN_SCENE_SECONDS, defaultTimeline, type TimelineEntry } from '@/timeline/sequence'
import { clamp } from '@/lib/motion'

type View = { mode: 'frame' | 'video'; id: string }

type EditorState = {
  brand: Brand
  /** True until the designer types a name. While true, uploads name the brand after the file. */
  nameFromFile: boolean
  preset: Preset
  showChrome: boolean
  timeline: TimelineEntry[]
  view: View
  setBrand: (patch: Partial<Brand>) => void
  setName: (name: string) => void
  applyLogo: (parsed: ParsedSvg, fileName: string) => void
  setFont: (font: BrandFont | undefined) => void
  addGraphics: (graphics: Graphic[]) => void
  removeGraphic: (index: number) => void
  setLayout: (patch: Partial<Brand['layout']>) => void
  setPreset: (patch: Partial<Preset>) => void
  setShowChrome: (v: boolean) => void
  toggleScene: (id: string) => void
  setDuration: (id: string, seconds: number) => void
  move: (id: string, dir: -1 | 1) => void
  setView: (view: View) => void
  loadSample: () => void
}

const order = (id: string) => scenes.findIndex((s) => s.id === id)

export const useEditor = create<EditorState>((set) => ({
  brand: sampleBrand,
  nameFromFile: true,
  preset: drawnPreset,
  showChrome: true,
  timeline: defaultTimeline,
  view: { mode: 'frame', id: 'logo' },
  setBrand: (patch) => set((s) => ({ brand: { ...s.brand, ...patch } })),
  setName: (name) => set((s) => ({ brand: { ...s.brand, name }, nameFromFile: false })),
  applyLogo: (parsed, fileName) =>
    set((s) => ({
      brand: {
        ...s.brand,
        logo: parsed.logo,
        palette: paletteFromColors(parsed.colors),
        name: s.nameFromFile ? nameFromFile(fileName) || s.brand.name : s.brand.name,
      },
    })),
  setLayout: (patch) => set((s) => ({ brand: { ...s.brand, layout: { ...s.brand.layout, ...patch } } })),
  setPreset: (patch) => set((s) => ({ preset: { ...s.preset, ...patch } })),
  setShowChrome: (showChrome) => set({ showChrome }),
  toggleScene: (id) =>
    set((s) => {
      if (s.timeline.some((t) => t.id === id)) return { timeline: s.timeline.filter((t) => t.id !== id) }
      const scene = sceneById(id)
      if (!scene) return {}
      const timeline = [...s.timeline, { id, duration: scene.defaultDuration }].sort((a, b) => order(a.id) - order(b.id))
      return { timeline }
    }),
  setDuration: (id, seconds) =>
    set((s) => ({
      timeline: s.timeline.map((t) => (t.id === id ? { ...t, duration: clamp(seconds, MIN_SCENE_SECONDS, MAX_SCENE_SECONDS) } : t)),
    })),
  move: (id, dir) =>
    set((s) => {
      const i = s.timeline.findIndex((t) => t.id === id)
      const j = i + dir
      if (i < 0 || j < 0 || j >= s.timeline.length) return {}
      const timeline = [...s.timeline]
      ;[timeline[i], timeline[j]] = [timeline[j], timeline[i]]
      return { timeline }
    }),
  setView: (view) => set({ view }),
  setFont: (font) => set((s) => ({ brand: { ...s.brand, font } })),
  addGraphics: (graphics) =>
    set((s) => {
      const next = [...s.brand.graphics, ...graphics].slice(0, MAX_GRAPHICS)
      // The first upload puts the Graphics scene in the video.
      const timeline = s.brand.graphics.length === 0 && next.length && !s.timeline.some((t) => t.id === 'graphics')
        ? [...s.timeline, { id: 'graphics', duration: sceneById('graphics')!.defaultDuration }].sort((a, b) => order(a.id) - order(b.id))
        : s.timeline
      return { brand: { ...s.brand, graphics: next }, timeline }
    }),
  removeGraphic: (index) => set((s) => ({ brand: { ...s.brand, graphics: s.brand.graphics.filter((_, i) => i !== index) } })),
  loadSample: () => set({ brand: sampleBrand, nameFromFile: true }),
}))
