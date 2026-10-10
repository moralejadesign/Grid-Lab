'use client'

import { brandShowcase, graphicTemplates, isAvailable, needsMessage } from '@/scenes/registry'
import { SceneView } from '@/scenes/SceneView'
import { Card } from '@/components/ui/card'
import { Slider } from '@/components/ui/slider'
import { cn } from '@/lib/utils'
import { BrandPanel } from './BrandPanel'
import { ClipPreview } from './ClipPreview'
import { ExportPanel } from './ExportPanel'
import { Panel, Section } from './Section'
import { ToolColumns, ToolPage } from './Shell'
import { useEditor } from './store'

function LengthField({ value, onChange }: { value: number; onChange: (s: number) => void }) {
  return (
    <Panel>
      <div className="flex flex-col gap-2.5">
        <span className="flex justify-between text-xs font-medium text-muted-foreground">
          Length <output className="text-foreground tabular-nums">{value.toFixed(1)} s</output>
        </span>
        <Slider thumbLabel="Length" value={[value]} min={3} max={30} step={0.5} onValueChange={(v) => onChange(Array.isArray(v) ? v[0] : v)} />
        <p className="text-xs text-muted-foreground">The motion stretches to fit. Every template loops, so a longer clip reads as slower motion.</p>
      </div>
    </Panel>
  )
}

export function GraphicsShowcaseTool() {
  const { brand, preset, showChrome, graphicsTemplate, graphicsSeconds, setGraphicsTemplate, setGraphicsSeconds } = useEditor()
  const clip = { timeline: [{ id: graphicsTemplate, duration: graphicsSeconds }], sceneId: graphicsTemplate }
  return (
    <ToolPage tag="02 / Graphics showcase" title="Graphics showcase" hint="Your graphics in motion. Upload up to 5 pieces, pick a template and export the clip.">
      <ToolColumns
        left={
          <>
            <BrandPanel mode="graphics" />
            <Section step="02" title="Template" hint="Each template moves the same pieces differently. Palette cards fill the gaps between your graphics.">
              <div className="grid grid-cols-2 gap-3">
                {graphicTemplates.map((t) => {
                  const ok = isAvailable(t, brand)
                  const on = t.id === graphicsTemplate
                  return (
                    <Card key={t.id} size="sm" className={cn('gap-0 py-0', on && 'ring-2 ring-heat')}>
                      <button type="button" aria-pressed={on} disabled={!ok} onClick={() => setGraphicsTemplate(t.id)}
                        className="block cursor-pointer text-left disabled:cursor-not-allowed">
                        <span className="block aspect-video bg-soft leading-none">
                          {ok ? <SceneView scene={t} brand={brand} preset={preset} progress={t.keyProgress} showChrome={showChrome} />
                            : <span className="flex h-full items-center justify-center text-xs font-semibold text-muted-foreground">{needsMessage(t)}</span>}
                        </span>
                        <span className="flex items-center justify-between px-2.5 py-2">
                          <b className={cn('text-[13px] font-semibold', on && 'text-heat')}>{t.id === 'graphics' ? 'Carousel' : t.name}</b>
                          {on && <span className="font-mono text-[10px] uppercase tracking-[.08em] text-heat">Selected</span>}
                        </span>
                      </button>
                    </Card>
                  )
                })}
              </div>
            </Section>
            <Section step="03" title="Length" hint="How long the clip runs.">
              <LengthField value={graphicsSeconds} onChange={setGraphicsSeconds} />
            </Section>
          </>
        }
        right={
          <>
            <ClipPreview sceneId={graphicsTemplate} seconds={graphicsSeconds} />
            <ExportPanel clip={clip} />
          </>
        }
      />
    </ToolPage>
  )
}

export function BrandShowcaseTool() {
  const { brandSeconds, setBrandSeconds } = useEditor()
  const clip = { timeline: [{ id: brandShowcase.id, duration: brandSeconds }], sceneId: brandShowcase.id }
  return (
    <ToolPage tag="03 / Brand showcase" title="Brand showcase" hint="Your logo, type, colors and graphics on one board that builds, changes and closes on the brand color.">
      <ToolColumns
        left={
          <>
            <BrandPanel mode="brand" />
            <Section step="02" title="Length" hint="How long the clip runs.">
              <LengthField value={brandSeconds} onChange={setBrandSeconds} />
            </Section>
          </>
        }
        right={
          <>
            <ClipPreview sceneId={brandShowcase.id} seconds={brandSeconds} />
            <ExportPanel clip={clip} />
          </>
        }
      />
    </ToolPage>
  )
}
