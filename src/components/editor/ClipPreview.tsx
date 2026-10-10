'use client'

import { Player } from '@remotion/player'
import { useMemo } from 'react'
import '@/remotion/fonts'
import { SceneClip } from '@/remotion/SceneClip'
import { isAvailable, needsMessage, sceneById } from '@/scenes/registry'
import { FPS } from '@/timeline/sequence'
import { Panel, Tag } from './Section'
import { useEditor } from './store'

/** Plays one showcase clip on a loop, starting at its key frame. */
export function ClipPreview({ sceneId, seconds }: { sceneId: string; seconds: number }) {
  const { brand, preset, showChrome } = useEditor()
  const scene = sceneById(sceneId)!
  const props = useMemo(() => ({ sceneId, brand, preset, showChrome }), [sceneId, brand, preset, showChrome])
  const frames = Math.max(2, Math.round(seconds * FPS))
  return (
    <Panel className="gap-2.5 px-2.5">
      <div className="flex items-center justify-between gap-2 px-1">
        <span className="text-sm font-medium">{scene.name}</span>
        <Tag>{seconds.toFixed(1)} s</Tag>
      </div>
      <div className="overflow-hidden rounded-[12px] bg-soft">
        {isAvailable(scene, brand) ? (
          <Player
            key={`${sceneId}-${frames}`}
            component={SceneClip}
            inputProps={props}
            durationInFrames={frames}
            initialFrame={Math.round(scene.keyProgress * (frames - 1))}
            compositionWidth={1920}
            compositionHeight={1080}
            fps={FPS}
            controls
            loop
            autoPlay
            style={{ width: '100%', aspectRatio: '16 / 9' }}
          />
        ) : (
          <div className="flex aspect-video items-center justify-center text-sm font-semibold text-muted-foreground">{needsMessage(scene)}</div>
        )}
      </div>
    </Panel>
  )
}
