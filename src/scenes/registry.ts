import type { Brand } from '@/brand/types'
import type { Scene } from './types'
import { intro } from './intro'
import { principles } from './principles'
import { logo } from './logo'
import { safe } from './safe'
import { layout } from './layout'
import { construct } from './construct'
import { anatomy } from './anatomy'
import { glyphset } from './glyphset'
import { big } from './big'
import { graphics } from './graphics'
import { colors } from './colors'
import { outro } from './outro'
import { orbit } from '@/showcases/orbit'
import { spiral } from '@/showcases/spiral'
import { stack } from '@/showcases/stack'
import { brandShowcase } from '@/showcases/brandShowcase'

// Order matches the prototype, with Type construction leading the typography section. Still to port: photography.
export const scenes: Scene[] = [intro, principles, logo, safe, layout, construct, anatomy, glyphset, big, graphics, colors, outro]

/** Templates for the graphics showcase. The carousel is the brand video's Graphics frame. */
export const graphicTemplates: Scene[] = [graphics, orbit, spiral, stack]

export { brandShowcase }

const all = [...scenes, orbit, spiral, stack, brandShowcase]
export const sceneById = (id: string) => all.find((s) => s.id === id)

export const isAvailable = (scene: Scene, brand: Brand) =>
  scene.needs === 'logo' ? !!brand.logo
    : scene.needs === 'photos' ? brand.photos.length > 0
    : scene.needs === 'graphics' ? brand.graphics.length > 0
    : true

export const needsMessage = (scene: Scene) =>
  scene.needs === 'logo' ? 'Needs an SVG' : scene.needs === 'graphics' ? 'Needs graphics' : 'Needs photos'
