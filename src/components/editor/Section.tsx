import type React from 'react'
import { Card } from '@/components/ui/card'
import { Label } from '@/components/ui/label'
import { cn } from '@/lib/utils'

export const Section: React.FC<{ title: string; hint: string; children: React.ReactNode }> = ({ title, hint, children }) => (
  <section>
    <h2 className="mb-1 text-xs font-bold uppercase tracking-[.08em]">{title}</h2>
    <p className="mb-3 max-w-[62ch] text-muted-foreground">{hint}</p>
    {children}
  </section>
)

/** Editor panel: a shadcn card with the editor's spacing. */
export const Panel: React.FC<{ children: React.ReactNode; className?: string }> = ({ children, className }) => (
  <Card size="sm" className={cn('gap-3.5 px-3.5', className)}>{children}</Card>
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
