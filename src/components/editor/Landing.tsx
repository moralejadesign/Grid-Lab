'use client'

import Link from 'next/link'
import { useEffect, useState } from 'react'
import { ArrowRightIcon } from 'lucide-react'
import type { Scene } from '@/scenes/types'
import { SceneView } from '@/scenes/SceneView'
import { brandShowcase, sceneById } from '@/scenes/registry'
import { Hero, SiteHeader } from './Shell'
import { Tag } from './Section'
import { useEditor } from './store'

type Option = { href: string; tag: string; title: string; text: string; scene: Scene; seconds: number }

const OPTIONS: Option[] = [
  {
    href: '/brand-video',
    tag: '01 / Brand video',
    title: 'Brand video',
    text: 'The frames every brand video shows: logo construction, safe area, layout grid, type, color. Order and time them into one video.',
    scene: sceneById('logo')!,
    seconds: 5,
  },
  {
    href: '/graphics-showcase',
    tag: '02 / Graphics showcase',
    title: 'Graphics showcase',
    text: 'Your posts, posters and graphics in motion. Pick a template: carousel, orbit, spiral or stack.',
    scene: sceneById('gs-orbit')!,
    seconds: 9,
  },
  {
    href: '/brand-showcase',
    tag: '03 / Brand showcase',
    title: 'Brand showcase',
    text: 'Logo, type, colors and graphics laid out as one board that builds, changes and closes on the brand color.',
    scene: brandShowcase,
    seconds: 10,
  },
]

/** 0..1, looping over `seconds` while `on`; rests at `rest` otherwise. */
function useLoop(on: boolean, seconds: number, rest: number) {
  const [p, setP] = useState(rest)
  useEffect(() => {
    if (!on) return
    let raf = 0
    const t0 = performance.now() - rest * seconds * 1000
    const tick = (t: number) => {
      setP((((t - t0) / 1000) % seconds) / seconds)
      raf = requestAnimationFrame(tick)
    }
    raf = requestAnimationFrame(tick)
    return () => cancelAnimationFrame(raf)
  }, [on, seconds, rest])
  return on ? p : rest
}

function OptionCard({ o }: { o: Option }) {
  const { brand, preset, showChrome } = useEditor()
  const [hover, setHover] = useState(false)
  const p = useLoop(hover, o.seconds, o.scene.keyProgress)
  return (
    <Link
      href={o.href}
      onPointerEnter={() => setHover(true)}
      onPointerLeave={() => setHover(false)}
      onFocus={() => setHover(true)}
      onBlur={() => setHover(false)}
      className="group flex flex-col overflow-hidden rounded-2xl bg-card shadow-card transition-shadow hover:ring-2 hover:ring-heat focus-visible:ring-2 focus-visible:ring-heat"
    >
      <div className="aspect-video bg-soft leading-none">
        <SceneView scene={o.scene} brand={brand} preset={preset} progress={p} showChrome={showChrome} />
      </div>
      <div className="flex flex-1 flex-col gap-2 p-5">
        <Tag>{o.tag}</Tag>
        <h2 className="text-xl font-medium tracking-[-.01em]">{o.title}</h2>
        <p className="text-muted-foreground">{o.text}</p>
        <span className="mt-auto inline-flex items-center gap-1.5 pt-3 text-sm font-medium text-heat">
          Start <ArrowRightIcon className="size-4 transition-transform group-hover:translate-x-0.5" />
        </span>
      </div>
    </Link>
  )
}

export function Landing() {
  return (
    <div className="min-h-screen">
      <SiteHeader />
      <Hero />
      <div className="rails mx-auto max-w-[1480px] px-5 pt-12 pb-16">
        <Tag>Choose an animation</Tag>
        <div className="mt-4 grid grid-cols-1 gap-5 md:grid-cols-3">
          {OPTIONS.map((o) => <OptionCard key={o.href} o={o} />)}
        </div>
        <p className="mt-4 text-xs text-muted-foreground">Hover a card to play it. Every tool uses the same brand, so you only upload once.</p>
      </div>
    </div>
  )
}
