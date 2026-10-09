'use client'

import { useEffect, useRef, useState, type KeyboardEvent, type PointerEvent } from 'react'
import { ChevronsUpDownIcon } from 'lucide-react'
import { converter, formatHex, parse } from 'culori'
import { Input } from '@/components/ui/input'
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover'

const toHsv = converter('hsv')

type Hsv = { h: number; s: number; v: number } // h 0..360, s and v 0..1
type Format = 'HEX' | 'RGB' | 'HSB'
const FORMATS: Format[] = ['RGB', 'HEX', 'HSB']

const clamp = (x: number, a: number, b: number) => Math.min(b, Math.max(a, x))

function hexToHsv(hex: string, fallbackHue = 0): Hsv {
  const c = toHsv(parse(hex))
  if (!c) return { h: fallbackHue, s: 0, v: 0 }
  // Grays have no hue. Keep the last one so the hue slider does not jump.
  return { h: c.h ?? fallbackHue, s: c.s ?? 0, v: c.v ?? 0 }
}
const hsvToHex = ({ h, s, v }: Hsv) => formatHex({ mode: 'hsv', h, s, v })
const hexToRgb = (hex: string) => {
  const n = parseInt(hex.slice(1), 16)
  return [(n >> 16) & 255, (n >> 8) & 255, n & 255]
}

/** Drag on an element and get 0..1 coordinates. Keeps tracking outside the element while the pointer is down. */
function useDrag(onMove: (x: number, y: number) => void) {
  const ref = useRef<HTMLDivElement>(null)
  const move = (e: PointerEvent) => {
    const r = ref.current!.getBoundingClientRect()
    onMove(clamp((e.clientX - r.left) / r.width, 0, 1), clamp((e.clientY - r.top) / r.height, 0, 1))
  }
  return {
    ref,
    onPointerDown: (e: PointerEvent) => {
      e.currentTarget.setPointerCapture(e.pointerId)
      move(e)
    },
    onPointerMove: (e: PointerEvent) => {
      if (e.currentTarget.hasPointerCapture(e.pointerId)) move(e)
    },
  }
}

/** Arrow keys nudge by 1%, Shift by 10%. */
const nudge = (e: KeyboardEvent, axis: 'x' | 'y' | 'both', apply: (dx: number, dy: number) => void) => {
  const step = e.shiftKey ? 0.1 : 0.01
  const keys: Record<string, [number, number]> = { ArrowLeft: [-step, 0], ArrowRight: [step, 0], ArrowUp: [0, -step], ArrowDown: [0, step] }
  const d = keys[e.key]
  if (!d) return
  if (axis === 'x' && d[0] === 0) return
  e.preventDefault()
  apply(d[0], d[1])
}

const handle = 'pointer-events-none absolute h-[18px] w-[18px] -translate-x-1/2 -translate-y-1/2 rounded-full border-[2.5px] border-white shadow-[0_0_0_1px_rgba(0,0,0,.25),0_1px_3px_rgba(0,0,0,.3)]'

type Props = { value: string; onChange: (hex: string) => void; label: string }

export function ColorPicker({ value, onChange, label }: Props) {
  const [hsv, setHsv] = useState<Hsv>(() => hexToHsv(value))
  const [format, setFormat] = useState<Format>('HEX')
  const lastHex = useRef(value.toLowerCase())

  // Follow changes made elsewhere (sample load, another field) without losing the hue of grays.
  useEffect(() => {
    if (value.toLowerCase() !== lastHex.current) {
      lastHex.current = value.toLowerCase()
      setHsv((prev) => hexToHsv(value, prev.h))
    }
  }, [value])

  const commit = (next: Hsv) => {
    setHsv(next)
    const hex = hsvToHex(next)
    lastHex.current = hex
    onChange(hex)
  }

  const sv = useDrag((x, y) => commit({ ...hsv, s: x, v: 1 - y }))
  const hue = useDrag((x) => commit({ ...hsv, h: x * 360 }))

  const hex = hsvToHex(hsv)
  const pure = hsvToHex({ h: hsv.h, s: 1, v: 1 })

  return (
    <Popover>
      <PopoverTrigger
        aria-label={label}
        className="block h-8 w-8 flex-none cursor-pointer rounded-lg border bg-background p-[3px] outline-none focus-visible:ring-3 focus-visible:ring-ring/50"
      >
        <span className="block h-full w-full rounded-[5px] border border-black/10" style={{ background: value }} />
      </PopoverTrigger>

      <PopoverContent aria-label={label} align="start" sideOffset={8} className="w-[244px] gap-3 rounded-[18px] p-3 shadow-[0_12px_40px_rgba(0,0,0,.28)]">
        <div
          {...sv}
          role="slider"
          tabIndex={0}
          aria-label="Saturation and brightness"
          aria-valuemin={0}
          aria-valuemax={100}
          aria-valuenow={Math.round(hsv.s * 100)}
          aria-valuetext={`Saturation ${Math.round(hsv.s * 100)}%, brightness ${Math.round(hsv.v * 100)}%`}
          onKeyDown={(e) => nudge(e, 'both', (dx, dy) => commit({ ...hsv, s: clamp(hsv.s + dx, 0, 1), v: clamp(hsv.v - dy, 0, 1) }))}
          className="relative aspect-square w-full cursor-crosshair touch-none rounded-xl outline-none focus-visible:ring-3 focus-visible:ring-ring/50"
          style={{ background: `linear-gradient(to top, #000, transparent), linear-gradient(to right, #fff, ${pure})` }}
        >
          <span className={handle} style={{ left: `${hsv.s * 100}%`, top: `${(1 - hsv.v) * 100}%`, background: hex }} />
        </div>

        <div
          {...hue}
          role="slider"
          tabIndex={0}
          aria-label="Hue"
          aria-valuemin={0}
          aria-valuemax={360}
          aria-valuenow={Math.round(hsv.h)}
          onKeyDown={(e) => nudge(e, 'x', (dx) => commit({ ...hsv, h: clamp(hsv.h + dx * 360, 0, 360) }))}
          className="relative h-[22px] w-full cursor-pointer touch-none rounded-lg outline-none focus-visible:ring-3 focus-visible:ring-ring/50"
          style={{ background: 'linear-gradient(to right, #f00, #ff0 17%, #0f0 33%, #0ff 50%, #00f 67%, #f0f 83%, #f00)' }}
        >
          <span className={handle} style={{ left: `clamp(9px, ${(hsv.h / 360) * 100}%, calc(100% - 9px))`, top: '50%', background: pure }} />
        </div>

        <div className="flex items-center gap-2">
          <button
            type="button"
            aria-label={`Color format ${format}. Switch format`}
            onClick={() => setFormat(FORMATS[(FORMATS.indexOf(format) + 1) % FORMATS.length])}
            className="flex flex-none items-center gap-0.5 rounded-md py-1 pr-1 text-muted-foreground outline-none hover:text-foreground focus-visible:ring-3 focus-visible:ring-ring/50"
          >
            <ChevronsUpDownIcon aria-hidden className="size-3" />
            <span className="flex flex-col items-center leading-none">
              <span aria-hidden className="text-[8px] font-semibold opacity-40">{FORMATS[(FORMATS.indexOf(format) + 2) % 3]}</span>
              <span className="my-0.5 rounded-full bg-muted px-2 py-1 text-[11px] font-bold text-foreground">{format}</span>
              <span aria-hidden className="text-[8px] font-semibold opacity-40">{FORMATS[(FORMATS.indexOf(format) + 1) % 3]}</span>
            </span>
          </button>
          <Values key={`${format}-${hex}`} format={format} hex={hex} hsv={hsv} onCommit={commit} />
        </div>
      </PopoverContent>
    </Popover>
  )
}

/** Editable values for the current format. Commits on Enter or blur; invalid input snaps back. */
function Values({ format, hex, hsv, onCommit }: { format: Format; hex: string; hsv: Hsv; onCommit: (hsv: Hsv) => void }) {
  if (format === 'HEX') {
    return (
      <label className="relative min-w-0 flex-1">
        <span aria-hidden className="pointer-events-none absolute top-1/2 left-2.5 -translate-y-1/2 text-base text-muted-foreground">#</span>
        <Input
          aria-label="Hex value"
          defaultValue={hex.slice(1).toUpperCase()}
          maxLength={7}
          spellCheck={false}
          className="h-9 pl-7 text-[15px] font-semibold tracking-wide tabular-nums"
          onKeyDown={(e) => e.key === 'Enter' && e.currentTarget.blur()}
          onBlur={(e) => {
            let v = e.target.value.trim().replace(/^#/, '')
            if (/^[0-9a-f]{3}$/i.test(v)) v = v.split('').map((c) => c + c).join('')
            if (/^[0-9a-f]{6}$/i.test(v)) onCommit(hexToHsv('#' + v, hsv.h))
            else e.target.value = hex.slice(1).toUpperCase()
          }}
        />
      </label>
    )
  }

  const rgb = hexToRgb(hex)
  const parts =
    format === 'RGB'
      ? [{ l: 'R', v: rgb[0], max: 255 }, { l: 'G', v: rgb[1], max: 255 }, { l: 'B', v: rgb[2], max: 255 }]
      : [{ l: 'H', v: Math.round(hsv.h), max: 360 }, { l: 'S', v: Math.round(hsv.s * 100), max: 100 }, { l: 'B', v: Math.round(hsv.v * 100), max: 100 }]

  const commitPart = (i: number, raw: string) => {
    const n = Number(raw)
    if (!Number.isFinite(n)) return false
    const vals = parts.map((p) => p.v)
    vals[i] = clamp(Math.round(n), 0, parts[i].max)
    if (format === 'RGB') onCommit(hexToHsv(formatHex({ mode: 'rgb', r: vals[0] / 255, g: vals[1] / 255, b: vals[2] / 255 }), hsv.h))
    else onCommit({ h: vals[0], s: vals[1] / 100, v: vals[2] / 100 })
    return true
  }

  return (
    <div className="grid min-w-0 flex-1 grid-cols-3 gap-1">
      {parts.map((p, i) => (
        <label key={p.l} className="flex flex-col items-center gap-0.5">
          <Input
            aria-label={`${format} ${p.l}`}
            inputMode="numeric"
            defaultValue={p.v}
            className="h-8 px-1 text-center font-semibold tabular-nums"
            onKeyDown={(e) => e.key === 'Enter' && e.currentTarget.blur()}
            onBlur={(e) => {
              if (!commitPart(i, e.target.value)) e.target.value = String(p.v)
            }}
          />
          <span className="text-[10px] font-semibold text-muted-foreground">{p.l}</span>
        </label>
      ))}
    </div>
  )
}
