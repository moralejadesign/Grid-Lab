'use client'

import { Player } from '@remotion/player'
import { useMemo, type ReactNode } from 'react'
import '@/remotion/fonts'
import { Video } from '@/remotion/Video'
import { SceneClip } from '@/remotion/SceneClip'
import { isAvailable, needsMessage, sceneById } from '@/scenes/registry'
import { FPS, sequence, totalSeconds, videoFrames } from '@/timeline/sequence'
import { ToggleGroup, ToggleGroupItem } from '@/components/ui/toggle-group'
import { Panel } from './Section'
import { useEditor } from './store'

export function Preview() {
  const { brand, preset, showChrome, timeline, view, setView } = useEditor()
  const slots = sequence(timeline, brand)
  const total = totalSeconds(slots)
  const scene = sceneById(view.id)!
  const entry = timeline.find((t) => t.id === scene.id)
  const sceneSeconds = entry?.duration ?? scene.defaultDuration

  const videoProps = useMemo(() => ({ brand, preset, timeline, showChrome }), [brand, preset, timeline, showChrome])
  const clipProps = useMemo(
    () => ({ sceneId: scene.id, brand, preset, showChrome }),
    [scene, brand, preset, showChrome],
  )

  const label = view.mode === 'video' ? `${slots.length} scenes, ${total.toFixed(1)} s` : scene.name
  const clipFrames = Math.max(2, Math.round(sceneSeconds * FPS))

  return (
    <Panel className="gap-2.5 px-2.5">
      <div className="flex flex-wrap items-center justify-between gap-2">
        <ToggleGroup
          aria-label="Preview"
          variant="outline"
          spacing={0}
          value={[view.mode]}
          onValueChange={(v: string[]) => v[0] && setView({ ...view, mode: v[0] as 'frame' | 'video' })}
        >
          <ToggleGroupItem value="frame" className="data-pressed:bg-primary data-pressed:text-primary-foreground">Selected frame</ToggleGroupItem>
          <ToggleGroupItem value="video" className="data-pressed:bg-primary data-pressed:text-primary-foreground">Full video</ToggleGroupItem>
        </ToggleGroup>
        <span className="text-xs text-muted-foreground">{label}</span>
      </div>

      <div className="overflow-hidden rounded-md border">
        {view.mode === 'video' ? (
          slots.length ? (
            <Player
              component={Video}
              inputProps={videoProps}
              durationInFrames={videoFrames(total)}
              compositionWidth={1920}
              compositionHeight={1080}
              fps={FPS}
              controls
              loop
              style={{ width: '100%', aspectRatio: '16 / 9' }}
            />
          ) : (
            <Empty>Add frames to build the video.</Empty>
          )
        ) : isAvailable(scene, brand) ? (
          <Player
            key={scene.id}
            component={SceneClip}
            inputProps={clipProps}
            durationInFrames={clipFrames}
            initialFrame={Math.round(scene.keyProgress * (clipFrames - 1))}
            compositionWidth={1920}
            compositionHeight={1080}
            fps={FPS}
            controls
            loop
            style={{ width: '100%', aspectRatio: '16 / 9' }}
          />
        ) : (
          <Empty>{needsMessage(scene)}</Empty>
        )}
      </div>
    </Panel>
  )
}

const Empty = ({ children }: { children: ReactNode }) => (
  <div className="flex aspect-video items-center justify-center bg-muted text-sm font-semibold text-muted-foreground">{children}</div>
)
