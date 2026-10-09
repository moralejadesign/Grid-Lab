import type React from 'react'
import { Card } from '@/components/ui/card'
import { Label } from '@/components/ui/label'
import { cn } from '@/lib/utils'

/** Small monospace tag in brackets, used for step numbers and status labels. */
export const Tag: React.FC<{ children: React.ReactNode; className?: string }> = ({ children, className }) => (
  <span className={cn('font-mono text-[11px] uppercase tracking-[.08em] text-muted-foreground', className)}>[ {children} ]</span>
)

export const Section: React.FC<{ step: string; title: string; hint: string; children: React.ReactNode }> = ({ step, title, hint, children }) => (
  <section>
    <Tag>{step} / {title}</Tag>
    <h2 className="mt-1.5 mb-1 text-xl font-medium tracking-[-.01em]">{title}</h2>
    <p className="mb-4 max-w-[62ch] text-muted-foreground">{hint}</p>
    {children}
  </section>
)

/** Editor panel: a shadcn card with the editor's spacing. */
export const Panel: React.FC<{ children: React.ReactNode; className?: string }> = ({ children, className }) => (
  <Card size="sm" className={cn('gap-3.5 px-4 py-4', className)}>{children}</Card>
)

export const Field: React.FC<{ label: React.ReactNode; htmlFor?: string; children: React.ReactNode; className?: string }> = ({ label, htmlFor, children, className }) => (
  <div className={cn('flex min-w-0 flex-col gap-1.5', className)}>
    <Label htmlFor={htmlFor} className="text-xs font-medium text-muted-foreground">{label}</Label>
    {children}
  </div>
)

export type Status = { tone: 'muted' | 'good' | 'warn'; text: string }
const TONE = { muted: 'text-muted-foreground', good: 'text-ok', warn: 'text-destructive' }

export const StatusLine: React.FC<{ status: Status; className?: string }> = ({ status, className }) => (
  <p role="status" className={cn('text-xs', TONE[status.tone], className)}>{status.text}</p>
)
