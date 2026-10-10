'use client'

import { BrandPanel } from './BrandPanel'
import { FramesPanel } from './FramesPanel'
import { TimelinePanel } from './TimelinePanel'
import { Preview } from './Preview'
import { ExportPanel } from './ExportPanel'
import { ToolColumns, ToolPage } from './Shell'

/** The brand video tool: brand inputs, frames, timeline, then preview and export. */
export function Editor() {
  return (
    <ToolPage tag="01 / Brand video" title="Brand video" hint="Upload a brand SVG, get the frames every brand video needs, then order and time them into a video.">
      <ToolColumns
        left={
          <>
            <BrandPanel />
            <FramesPanel />
            <TimelinePanel />
          </>
        }
        right={
          <>
            <Preview />
            <ExportPanel />
          </>
        }
      />
    </ToolPage>
  )
}
