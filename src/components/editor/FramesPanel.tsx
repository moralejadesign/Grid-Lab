'use client'

import { scenes, isAvailable, needsMessage } from '@/scenes/registry'
import { SceneView } from '@/scenes/SceneView'
import { Button } from '@/components/ui/button'
import { Card } from '@/components/ui/card'
import { cn } from '@/lib/utils'
import { useEditor } from './store'
import { Section } from './Section'

export function FramesPanel() {
  const { brand, preset, showChrome, timeline, view, setView, toggleScene } = useEditor()
  return (
    <Section step="02" title="Frames" hint="Generated from your brand. Click a frame to preview its animation. Add the ones you want to the video.">
      <div className="grid grid-cols-[repeat(auto-fill,minmax(210px,1fr))] gap-3">
        {scenes.map((scene) => {
          const ok = isAvailable(scene, brand)
          const on = timeline.some((t) => t.id === scene.id)
          const sel = view.mode === 'frame' && view.id === scene.id
          return (
            <Card key={scene.id} size="sm" className={cn('gap-0 py-0 transition-shadow', sel && 'ring-2 ring-heat')}>
              <button type="button" aria-label={`Preview ${scene.name}`} aria-pressed={sel} onClick={() => setView({ mode: 'frame', id: scene.id })}
                className="block aspect-video w-full cursor-pointer bg-muted p-0 leading-none">
                {ok ? (
                  <SceneView scene={scene} brand={brand} preset={preset} progress={scene.keyProgress} showChrome={showChrome} />
                ) : (
                  <span className="flex h-full items-center justify-center text-xs font-semibold text-muted-foreground">{needsMessage(scene)}</span>
                )}
              </button>
              <div className="flex items-center justify-between gap-2 px-2.5 py-2">
                <div className="min-w-0">
                  <b className="block truncate text-[13px] font-semibold">{scene.name}</b>
                  <span className="font-mono text-[10px] uppercase tracking-[.08em] text-muted-foreground">{scene.section}</span>
                </div>
                <Button size="sm" variant="outline" className={cn(on && ok && 'text-heat')} disabled={!ok} aria-pressed={on} onClick={() => toggleScene(scene.id)}>
                  {!ok ? needsMessage(scene) : on ? '✓ In video' : 'Add'}
                </Button>
              </div>
            </Card>
          )
        })}
      </div>
    </Section>
  )
}
