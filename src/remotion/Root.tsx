import type React from 'react'
import { Composition } from 'remotion'
import './fonts'
import { sampleBrand } from '@/brand/sample'
import { drawnPreset } from '@/presets'
import { scenes } from '@/scenes/registry'
import { FPS, defaultTimeline, sequence, totalSeconds, videoFrames } from '@/timeline/sequence'
import { Video, type VideoProps } from './Video'
import { SceneClip } from './SceneClip'

const videoDefaults: VideoProps = { brand: sampleBrand, preset: drawnPreset, timeline: defaultTimeline, showChrome: true }

export const Root: React.FC = () => (
  <>
    <Composition
      id="Video"
      component={Video}
      width={1920}
      height={1080}
      fps={FPS}
      durationInFrames={1}
      defaultProps={videoDefaults}
      calculateMetadata={({ props }) => ({ durationInFrames: videoFrames(totalSeconds(sequence(props.timeline, props.brand))) })}
    />
    {scenes.map((s) => (
      <Composition
        key={s.id}
        id={`scene-${s.id}`}
        component={SceneClip}
        width={1920}
        height={1080}
        fps={FPS}
        durationInFrames={Math.round(s.defaultDuration * FPS)}
        defaultProps={{ sceneId: s.id, brand: sampleBrand, preset: drawnPreset, showChrome: true }}
      />
    ))}
  </>
)
