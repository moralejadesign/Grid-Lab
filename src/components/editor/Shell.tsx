'use client'

import type React from 'react'
import Link from 'next/link'
import { ArrowLeftIcon } from 'lucide-react'
import { BackgroundRippleEffect } from '@/components/ui/background-ripple-effect'
import { Tag } from './Section'
import { ThemeToggle } from './ThemeToggle'

const Cross = ({ className }: { className: string }) => <span aria-hidden className={`cross ${className}`} />

/** The product mark: a 3x3 grid with one cell lit. */
const Mark = () => (
  <svg width="22" height="22" viewBox="0 0 22 22" aria-hidden>
    <rect x="0.5" y="0.5" width="21" height="21" rx="4" fill="none" stroke="currentColor" />
    <path d="M7.5 1v20M14.5 1v20M1 7.5h20M1 14.5h20" stroke="currentColor" strokeOpacity=".35" />
    <rect x="8" y="8" width="6" height="6" fill="var(--heat)" />
  </svg>
)

export function SiteHeader() {
  return (
    <header className="border-b">
      <div className="rails mx-auto flex h-16 max-w-[1480px] items-center justify-between px-5">
        <Link href="/" className="flex items-center gap-2.5">
          <Mark />
          <span className="text-[17px] font-semibold tracking-[-.01em]">Grid Lab</span>
        </Link>
        <Tag className="hidden sm:inline">Private beta</Tag>
        <div className="flex items-center gap-2">
          <ThemeToggle />
          <a href="https://moraleja.co" target="_blank" rel="noreferrer" className="rounded-[10px] bg-soft px-3 py-1.5 text-sm font-medium hover:text-heat">
            moraleja.co
          </a>
        </div>
        <Cross className="-bottom-[6px] -left-[6px]" />
        <Cross className="-right-[6px] -bottom-[6px]" />
      </div>
    </header>
  )
}

export function Hero() {
  return (
    <div className="border-b">
      <div className="rails mx-auto max-w-[1480px] px-5 py-12 text-center sm:py-16">
        {/* Click a cell to send a ripple across the grid. */}
        <div className="absolute inset-0 overflow-hidden">
          <BackgroundRippleEffect rows={8} cols={27} cellSize={56} />
        </div>
        <div className="pointer-events-none">
          <Tag className="absolute top-3 left-4 z-10 hidden md:inline">SVG</Tag>
          <Tag className="absolute top-3 right-4 z-10 hidden md:inline">MP4</Tag>
          <Tag className="absolute bottom-3 left-4 z-10 hidden md:inline">PNG</Tag>
          <Tag className="absolute right-4 bottom-3 z-10 hidden md:inline">1920 × 1080</Tag>
        </div>
        <div className="pointer-events-none relative z-10 mx-auto max-w-[720px] px-4 py-2">
          <h1 className="text-[40px] leading-[1.05] font-medium tracking-[-.02em] sm:text-[56px]">
            Brand videos, built from
            <br />
            <span className="text-heat">your logo</span>
          </h1>
          <p className="mx-auto mt-4 max-w-[52ch] text-[15px] text-muted-foreground">
            Upload your brand assets and pick an animation: a full brand video, a showcase of your graphics, or a board of your brand.
          </p>
        </div>
        <Cross className="-bottom-[6px] -left-[6px]" />
        <Cross className="-right-[6px] -bottom-[6px]" />
      </div>
    </div>
  )
}

/** Page frame for one tool: the site header, a title row with a way back, then the tool. */
export function ToolPage({ tag, title, hint, children }: { tag: string; title: string; hint: string; children: React.ReactNode }) {
  return (
    <div className="min-h-screen">
      <SiteHeader />
      <div className="border-b">
        <div className="rails mx-auto flex max-w-[1480px] flex-wrap items-end justify-between gap-4 px-5 py-8">
          <div>
            <Tag>{tag}</Tag>
            <h1 className="mt-1.5 text-[32px] leading-tight font-medium tracking-[-.02em]">{title}</h1>
            <p className="mt-1 max-w-[62ch] text-muted-foreground">{hint}</p>
          </div>
          <Link href="/" className="inline-flex items-center gap-1.5 rounded-[10px] bg-soft px-3 py-1.5 text-sm font-medium hover:text-heat">
            <ArrowLeftIcon className="size-4" /> All animations
          </Link>
          <Cross className="-bottom-[6px] -left-[6px]" />
          <Cross className="-right-[6px] -bottom-[6px]" />
        </div>
      </div>
      <div className="rails mx-auto max-w-[1480px] px-5 pt-10 pb-16">{children}</div>
    </div>
  )
}

/** Two columns: settings on the left, a sticky preview and export on the right. */
export function ToolColumns({ left, right }: { left: React.ReactNode; right: React.ReactNode }) {
  return (
    <div className="grid grid-cols-1 items-start gap-10 lg:grid-cols-[minmax(0,480px)_minmax(0,1fr)]">
      <div className="order-2 flex min-w-0 flex-col gap-12 lg:order-1">{left}</div>
      <div className="order-1 flex min-w-0 flex-col gap-3 lg:sticky lg:top-4 lg:order-2">{right}</div>
    </div>
  )
}
