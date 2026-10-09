'use client'

import { BrandPanel } from './BrandPanel'
import { FramesPanel } from './FramesPanel'
import { TimelinePanel } from './TimelinePanel'
import { Preview } from './Preview'
import { ExportPanel } from './ExportPanel'
import { Tag } from './Section'

const Cross = ({ className }: { className: string }) => <span aria-hidden className={`cross ${className}`} />

/** The product mark: a 3x3 grid with one cell lit. */
const Mark = () => (
  <svg width="22" height="22" viewBox="0 0 22 22" aria-hidden>
    <rect x="0.5" y="0.5" width="21" height="21" rx="4" fill="none" stroke="currentColor" />
    <path d="M7.5 1v20M14.5 1v20M1 7.5h20M1 14.5h20" stroke="currentColor" strokeOpacity=".35" />
    <rect x="8" y="8" width="6" height="6" fill="var(--heat)" />
  </svg>
)

export function Editor() {
  return (
    <div className="min-h-screen">
      <header className="border-b">
        <div className="rails mx-auto flex h-16 max-w-[1480px] items-center justify-between px-5">
          <div className="flex items-center gap-2.5">
            <Mark />
            <span className="text-[17px] font-semibold tracking-[-.01em]">Grid Lab</span>
          </div>
          <Tag className="hidden sm:inline">Private beta</Tag>
          <a href="https://moraleja.co" target="_blank" rel="noreferrer" className="rounded-[10px] bg-soft px-3 py-1.5 text-sm font-medium hover:text-heat">
            moraleja.co
          </a>
          <Cross className="-bottom-[6px] -left-[6px]" />
          <Cross className="-right-[6px] -bottom-[6px]" />
        </div>
      </header>

      <div className="border-b">
        <div className="rails grid-paper mx-auto max-w-[1480px] px-5 py-12 text-center sm:py-16">
          <Tag className="absolute top-3 left-4 hidden md:inline">SVG</Tag>
          <Tag className="absolute top-3 right-4 hidden md:inline">MP4</Tag>
          <Tag className="absolute bottom-3 left-4 hidden md:inline">PNG</Tag>
          <Tag className="absolute right-4 bottom-3 hidden md:inline">1920 × 1080</Tag>
          <div className="relative mx-auto max-w-[720px] bg-bg/80 px-4 py-2">
            <h1 className="text-[40px] leading-[1.05] font-medium tracking-[-.02em] sm:text-[56px]">
              Brand videos, built from
              <br />
              <span className="text-heat">your logo</span>
            </h1>
            <p className="mx-auto mt-4 max-w-[52ch] text-[15px] text-muted-foreground">
              Upload a brand SVG, get the frames every brand video needs, then order and time them into a video.
            </p>
          </div>
          <Cross className="-bottom-[6px] -left-[6px]" />
          <Cross className="-right-[6px] -bottom-[6px]" />
        </div>
      </div>

      <div className="rails mx-auto max-w-[1480px] px-5 pt-10 pb-16">
        <div className="grid grid-cols-1 items-start gap-10 lg:grid-cols-[minmax(0,480px)_minmax(0,1fr)]">
          <div className="order-2 flex min-w-0 flex-col gap-12 lg:order-1">
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
    </div>
  )
}
