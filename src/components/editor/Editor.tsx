'use client'

import { BrandPanel } from './BrandPanel'
import { FramesPanel } from './FramesPanel'
import { TimelinePanel } from './TimelinePanel'
import { Preview } from './Preview'
import { ExportPanel } from './ExportPanel'

export function Editor() {
  return (
    <div className="mx-auto max-w-[1480px] px-4 pt-5 pb-12">
      <header className="mb-5 flex flex-wrap items-baseline gap-3.5">
        <h1 className="text-[22px] font-bold tracking-[-.01em]">Grid Lab</h1>
        <p className="text-muted-foreground">Upload a brand SVG, get the frames every brand video needs, order and time them into a video.</p>
      </header>
      <div className="grid grid-cols-1 items-start gap-8 lg:grid-cols-[minmax(0,480px)_minmax(0,1fr)]">
        <div className="order-2 flex min-w-0 flex-col gap-7 lg:order-1">
          <BrandPanel />
          <FramesPanel />
          <TimelinePanel />
        </div>
        <div className="order-1 flex min-w-0 flex-col gap-3 lg:sticky lg:top-4 lg:order-2">
          <Preview />
          <ExportPanel />
        </div>
      </div>
    </div>
  )
}
