'use client'

import { ArrowDownIcon, ArrowUpIcon, XIcon } from 'lucide-react'
import { MAX_SCENE_SECONDS, MIN_SCENE_SECONDS, sequence, totalSeconds } from '@/timeline/sequence'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { cn } from '@/lib/utils'
import { useEditor } from './store'
import { Panel, Section } from './Section'

/** 22.0 s, or 1:05.0 once past a minute. */
const formatDuration = (sec: number) =>
  sec < 60 ? `${sec.toFixed(1)} s` : `${Math.floor(sec / 60)}:${(sec % 60).toFixed(1).padStart(4, '0')}`

export function TimelinePanel() {
  const { brand, timeline, setDuration, move, toggleScene } = useEditor()
  const slots = sequence(timeline, brand)
  const total = totalSeconds(slots)
  const scale = total || 1

  return (
    <Section step="03" title="Video" hint="Order and time the scenes. The video can be as long as you need.">
      <Panel>
        <div className="relative flex h-[22px] overflow-hidden rounded-[8px] bg-soft shadow-inset">
          {slots.map((s, i) => (
            <i key={s.scene.id} title={`${s.scene.name} ${s.duration} s`} className={cn('block h-full border-r-2 border-card bg-heat', i % 2 ? 'opacity-60' : 'opacity-100')}
              style={{ width: `${(s.duration / scale) * 100}%` }} />
          ))}
        </div>
        <div className="flex flex-wrap items-center justify-between gap-2">
          <b className="font-mono text-[15px] font-medium">{formatDuration(total)}</b>
          <span className="text-xs text-muted-foreground">{slots.length} scene{slots.length === 1 ? '' : 's'}</span>
        </div>
        <ol className="flex flex-col gap-1.5">
          {!slots.length && <li className="text-xs text-muted-foreground">No scenes yet. Add frames from step 2.</li>}
          {slots.map((s, idx) => (
            <li key={s.scene.id} className="grid grid-cols-[22px_minmax(0,1fr)_78px_auto] items-center gap-2 rounded-[10px] bg-soft px-2 py-1.5">
              <span className="font-mono text-[11px] text-muted-foreground">{String(idx + 1).padStart(2, '0')}</span>
              <span className="truncate font-semibold">{s.scene.name}</span>
              <Input type="number" aria-label={`${s.scene.name} duration in seconds`} min={MIN_SCENE_SECONDS} max={MAX_SCENE_SECONDS} step={0.5}
                value={s.duration} onChange={(e) => setDuration(s.scene.id, parseFloat(e.target.value) || s.scene.defaultDuration)} className="h-7 px-1.5" />
              <div className="flex gap-1">
                <Button variant="outline" size="icon-sm" aria-label={`Move ${s.scene.name} up`} disabled={idx === 0} onClick={() => move(s.scene.id, -1)}><ArrowUpIcon /></Button>
                <Button variant="outline" size="icon-sm" aria-label={`Move ${s.scene.name} down`} disabled={idx === slots.length - 1} onClick={() => move(s.scene.id, 1)}><ArrowDownIcon /></Button>
                <Button variant="outline" size="icon-sm" aria-label={`Remove ${s.scene.name}`} onClick={() => toggleScene(s.scene.id)}><XIcon /></Button>
              </div>
            </li>
          ))}
        </ol>
      </Panel>
    </Section>
  )
}
