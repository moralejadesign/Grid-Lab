'use client'

import { useRef, useState } from 'react'
import { isAvailable, needsMessage, sceneById } from '@/scenes/registry'
import { sequence } from '@/timeline/sequence'
import { ExportError, exportVideo } from '@/render/video'
import { exportAllPngs, exportScenePng } from '@/render/stills'
import { download, slug } from '@/render/download'
import { Button } from '@/components/ui/button'
import { Progress } from '@/components/ui/progress'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { useEditor } from './store'
import { Field, Panel, StatusLine, type Status } from './Section'

type Job = 'video' | 'png' | 'zip'
const RESOLUTIONS = [
  { value: 1080, label: '1080p' },
  { value: 720, label: '720p' },
]

export function ExportPanel() {
  const { brand, preset, showChrome, timeline, view } = useEditor()
  const [height, setHeight] = useState<1080 | 720>(1080)
  const [job, setJob] = useState<Job | null>(null)
  const [progress, setProgress] = useState(0)
  const [status, setStatus] = useState<Status | null>(null)
  const abort = useRef<AbortController | null>(null)

  const slots = sequence(timeline, brand)
  const scene = sceneById(view.id)!
  const sceneOk = isAvailable(scene, brand)
  const name = slug(brand.name)

  const videoBlocked = !slots.length ? 'Add at least one scene to export.' : null

  async function run(kind: Job, work: (signal: AbortSignal) => Promise<string>) {
    const ctrl = new AbortController()
    abort.current = ctrl
    setJob(kind)
    setProgress(0)
    setStatus({ tone: 'muted', text: kind === 'video' ? 'Rendering video. Keep this tab open.' : 'Rendering frames.' })
    try {
      const done = await work(ctrl.signal)
      setStatus({ tone: 'good', text: done })
    } catch (e) {
      if (e instanceof DOMException && e.name === 'AbortError') setStatus({ tone: 'muted', text: 'Export canceled.' })
      else {
        console.error(e)
        setStatus({ tone: 'warn', text: e instanceof ExportError ? e.message : `Export failed. ${e instanceof Error ? e.message : 'Try again.'}` })
      }
    } finally {
      setJob(null)
      abort.current = null
    }
  }

  const onVideo = () =>
    run('video', async (signal) => {
      const { blob, ext } = await exportVideo({ brand, preset, timeline, showChrome, height, signal, onProgress: setProgress })
      download(blob, `${name}-${height}p.${ext}`)
      return ext === 'mp4' ? `Saved ${name}-${height}p.mp4.` : `Saved ${name}-${height}p.webm. This browser cannot encode MP4, so the video is WebM.`
    })

  const onPng = () =>
    run('png', async () => {
      const blob = await exportScenePng(scene, { brand, preset, showChrome })
      setProgress(1)
      download(blob, `${name}-${scene.id}.png`)
      return `Saved ${name}-${scene.id}.png.`
    })

  const onZip = () =>
    run('zip', async () => {
      const blob = await exportAllPngs({ brand, preset, showChrome }, setProgress)
      download(blob, `${name}-frames.zip`)
      return `Saved ${name}-frames.zip.`
    })

  const busy = job !== null

  return (
    <Panel className="gap-2.5 px-2.5">
      <div className="flex flex-wrap items-end gap-2">
        <Field label="Resolution" className="w-[110px] flex-none">
          <Select items={RESOLUTIONS} value={height} disabled={busy} onValueChange={(v) => v && setHeight(v as 1080 | 720)}>
            <SelectTrigger aria-label="Resolution" className="w-full">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              {RESOLUTIONS.map((r) => <SelectItem key={r.value} value={r.value}>{r.label}</SelectItem>)}
            </SelectContent>
          </Select>
        </Field>
        <Button disabled={busy || !!videoBlocked} onClick={onVideo}>Export video</Button>
        <Button variant="outline" disabled={busy || !sceneOk} onClick={onPng} title={sceneOk ? `Key frame of ${scene.name}` : needsMessage(scene)}>
          Export frame PNG
        </Button>
        <Button variant="outline" disabled={busy} onClick={onZip}>Export all frames</Button>
        {busy && <Button variant="ghost" onClick={() => abort.current?.abort()}>Cancel</Button>}
      </div>
      {busy && <Progress value={Math.round(progress * 100)} aria-label="Export progress" />}
      <StatusLine
        status={status ?? { tone: 'muted', text: videoBlocked ?? `Video exports as MP4 at ${height}p. Frame PNG saves the key frame of ${scene.name}. All frames saves a zip of every scene.` }}
      />
    </Panel>
  )
}
