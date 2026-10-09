'use client'

import { useRef, useState } from 'react'
import { XIcon } from 'lucide-react'
import { sampleBrand } from '@/brand/sample'
import { paletteName } from '@/brand/palette'
import { MAX_SVG_BYTES, SvgError, parseSvg } from '@/brand/svg'
import { FontError, parseFontFile } from '@/brand/font'
import { GraphicError, MAX_GRAPHICS, loadGraphic } from '@/brand/graphics'
import { Button } from '@/components/ui/button'
import { Checkbox } from '@/components/ui/checkbox'
import { ColorPicker } from '@/components/ui/ColorPicker'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Slider } from '@/components/ui/slider'
import { useEditor } from './store'
import { Field, Panel, Section, StatusLine, type Status } from './Section'

const FONT_HINT: Status = { tone: 'muted', text: 'Optional. TTF, OTF, WOFF or WOFF2. Without it, type frames use Hanken Grotesk.' }
const GRAPHICS_HINT: Status = { tone: 'muted', text: `Optional. Up to ${MAX_GRAPHICS} posts, posters or other graphics as PNG, JPEG or WebP. Adds the Graphics frame.` }
const SAMPLE_STATUS: Status = { tone: 'muted', text: 'Sample brand loaded. Upload your SVG to replace it.' }

const BACKGROUNDS = [
  { value: '#ffffff', label: 'White' },
  { value: '#0b0b0b', label: 'Black' },
  { value: 'custom', label: 'Custom' },
]
const TRANSITIONS = [
  { value: 'fade', label: 'Dip to background' },
  { value: 'cut', label: 'Cut' },
]

export function BrandPanel() {
  const { brand, preset, showChrome, setBrand, setName, setLayout, setPreset, setShowChrome, loadSample, applyLogo, setFont, addGraphics, removeGraphic } = useEditor()
  const fileRef = useRef<HTMLInputElement>(null)
  const fontRef = useRef<HTMLInputElement>(null)
  const [fontStatus, setFontStatus] = useState<Status>(FONT_HINT)
  const graphicsRef = useRef<HTMLInputElement>(null)
  const [graphicsStatus, setGraphicsStatus] = useState<Status>(GRAPHICS_HINT)

  async function onGraphics(files: File[]) {
    const room = MAX_GRAPHICS - brand.graphics.length
    const take = files.slice(0, room)
    const loaded = [], problems: string[] = []
    for (const f of take) {
      try {
        loaded.push(await loadGraphic(f))
      } catch (e) {
        problems.push(e instanceof GraphicError ? e.message : `Could not read ${f.name}.`)
      }
    }
    if (loaded.length) addGraphics(loaded)
    const total = brand.graphics.length + loaded.length
    if (files.length > room) problems.push(`Only ${MAX_GRAPHICS} graphics fit. ${files.length - room} ${files.length - room === 1 ? 'was' : 'were'} left out.`)
    setGraphicsStatus({
      tone: problems.length ? 'warn' : 'good',
      text: [`${total} of ${MAX_GRAPHICS} graphics.`, ...problems].join(' '),
    })
  }

  async function onFont(file: File) {
    setFontStatus({ tone: 'muted', text: `Reading ${file.name}.` })
    try {
      const font = await parseFontFile(file)
      setFont(font)
      setFontStatus({ tone: 'good', text: `${font.family} loaded. ${Object.keys(font.glyphs).length} glyphs. Type frames now draw from its outlines.` })
    } catch (e) {
      setFontStatus({ tone: 'warn', text: e instanceof FontError ? e.message : 'Could not read that font file. Export it again as TTF or OTF and try again.' })
    }
  }
  const [svgStatus, setSvgStatus] = useState<Status>(SAMPLE_STATUS)
  // Kept as typed so a trailing comma survives while editing.
  const [keys, setKeys] = useState(brand.principles.join(', '))
  const palette = brand.palette
  const setColor = (i: number, patch: Partial<{ name: string; hex: string }>) =>
    setBrand({ palette: palette.map((c, j) => (j === i ? { ...c, ...patch } : c)) })

  async function onSvg(file: File) {
    if (file.size > MAX_SVG_BYTES) {
      setSvgStatus({ tone: 'warn', text: 'That file is larger than 2 MB. Export a simpler SVG and try again.' })
      return
    }
    try {
      const parsed = parseSvg(await file.text())
      applyLogo(parsed, file.name)
      const { items } = parsed.logo
      const summary = `${items.length} shape${items.length === 1 ? '' : 's'} and ${parsed.colors.length} color${parsed.colors.length === 1 ? '' : 's'} read from ${file.name}.`
      setSvgStatus(parsed.warnings.length ? { tone: 'warn', text: `${summary} ${parsed.warnings.join(' ')}` } : { tone: 'good', text: summary })
    } catch (e) {
      setSvgStatus({ tone: 'warn', text: e instanceof SvgError ? e.message : 'Could not read that SVG. Export it again from your design tool and try again.' })
    }
  }

  const bgValue = BACKGROUNDS.some((b) => b.value === preset.background) ? preset.background : 'custom'

  return (
    <Section title="1 Brand" hint="Upload the logo as SVG. Convert text to outlines first so letters are drawn as shapes.">
      <Panel>
        <div className="flex flex-wrap items-center gap-2">
          <Button onClick={() => fileRef.current?.click()}>Upload brand SVG</Button>
          <Button
            variant="outline"
            onClick={() => {
              loadSample()
              setKeys(sampleBrand.principles.join(', '))
              setSvgStatus(SAMPLE_STATUS)
            }}
          >
            Load sample
          </Button>
          <input
            ref={fileRef}
            type="file"
            accept=".svg,image/svg+xml"
            tabIndex={-1}
            className="sr-only"
            onChange={(e) => {
              const f = e.target.files?.[0]
              e.target.value = ''
              if (f) onSvg(f)
            }}
          />
        </div>
        <StatusLine status={svgStatus} />

        <div className="flex flex-wrap items-center gap-2">
          <Button variant="outline" onClick={() => fontRef.current?.click()}>Upload font</Button>
          {brand.font && (
            <Button variant="ghost" size="sm" onClick={() => { setFont(undefined); setFontStatus(FONT_HINT) }}>Use Hanken Grotesk</Button>
          )}
          <input
            ref={fontRef}
            type="file"
            accept=".ttf,.otf,.woff,.woff2,font/ttf,font/otf,font/woff,font/woff2"
            tabIndex={-1}
            className="sr-only"
            onChange={(e) => {
              const f = e.target.files?.[0]
              e.target.value = ''
              if (f) onFont(f)
            }}
          />
        </div>
        <StatusLine status={fontStatus} />

        <div className="flex flex-col gap-2">
          <div className="flex flex-wrap items-center gap-2">
            <Button variant="outline" disabled={brand.graphics.length >= MAX_GRAPHICS} onClick={() => graphicsRef.current?.click()}>Add graphics</Button>
            <input
              ref={graphicsRef}
              type="file"
              multiple
              accept="image/png,image/jpeg,image/webp"
              tabIndex={-1}
              className="sr-only"
              onChange={(e) => {
                const files = [...(e.target.files ?? [])]
                e.target.value = ''
                if (files.length) onGraphics(files)
              }}
            />
          </div>
          {brand.graphics.length > 0 && (
            <ul className="flex flex-wrap gap-2">
              {brand.graphics.map((g, i) => (
                <li key={`${g.name}-${i}`} className="relative">
                  {/* eslint-disable-next-line @next/next/no-img-element -- local data URL, next/image adds nothing here */}
                  <img src={g.src} alt={g.name} className="h-16 w-auto max-w-24 rounded-md border object-cover" />
                  <Button
                    variant="outline"
                    size="icon-xs"
                    aria-label={`Remove ${g.name}`}
                    className="absolute -top-2 -right-2 rounded-full bg-background"
                    onClick={() => {
                      removeGraphic(i)
                      setGraphicsStatus(brand.graphics.length - 1 ? { tone: 'muted', text: `${brand.graphics.length - 1} of ${MAX_GRAPHICS} graphics.` } : GRAPHICS_HINT)
                    }}
                  >
                    <XIcon />
                  </Button>
                </li>
              ))}
            </ul>
          )}
          <StatusLine status={graphicsStatus} />
        </div>

        <Field label="Brand name" htmlFor="fName">
          <Input id="fName" maxLength={40} value={brand.name} onChange={(e) => setName(e.target.value)} />
        </Field>
        <Field label="Opening line" htmlFor="fLine">
          <Input id="fLine" maxLength={60} value={brand.openingLine} onChange={(e) => setBrand({ openingLine: e.target.value })} />
        </Field>
        <Field label="Website" htmlFor="fWeb">
          <Input id="fWeb" maxLength={60} placeholder="yourbrand.com" value={brand.website ?? ''} onChange={(e) => setBrand({ website: e.target.value })} />
        </Field>
        <Field label="Principles, comma separated" htmlFor="fKeys">
          <Input
            id="fKeys"
            maxLength={80}
            value={keys}
            onChange={(e) => {
              setKeys(e.target.value)
              setBrand({ principles: e.target.value.split(',').map((s) => s.trim()).filter(Boolean).slice(0, 6) })
            }}
          />
        </Field>

        <div>
          <div className="mb-1.5 flex items-center justify-between">
            <span className="text-xs font-medium text-muted-foreground">Palette</span>
            <Button
              variant="outline"
              size="sm"
              disabled={palette.length >= 8}
              onClick={() => setBrand({ palette: [...palette, { name: paletteName(palette.length), hex: '#888888' }] })}
            >
              Add color
            </Button>
          </div>
          <div className="flex flex-col gap-1.5">
            {palette.map((c, i) => (
              <div key={i} className="flex items-center gap-1.5">
                <ColorPicker label={`Color ${i + 1}, ${c.name || c.hex}`} value={c.hex} onChange={(hex) => setColor(i, { hex })} />
                <Input aria-label="Color name" className="flex-[1_1_90px]" maxLength={24} placeholder="Name" value={c.name} onChange={(e) => setColor(i, { name: e.target.value })} />
                <span className="w-[72px] flex-none text-xs tabular-nums">{c.hex.toUpperCase()}</span>
                <Button variant="outline" size="icon-sm" aria-label={`Remove ${c.name || 'color'}`} onClick={() => setBrand({ palette: palette.filter((_, j) => j !== i) })}>
                  <XIcon />
                </Button>
              </div>
            ))}
          </div>
        </div>

        <div className="grid grid-cols-[repeat(auto-fit,minmax(130px,1fr))] gap-x-4 gap-y-3">
          <RangeField label="Safe area" display={`${Math.round(brand.layout.clearSpace * 100)}%`} value={brand.layout.clearSpace} min={0.2} max={1} step={0.05}
            onChange={(clearSpace) => setLayout({ clearSpace })} />
          <RangeField label="Columns" display={String(brand.layout.columns)} value={brand.layout.columns} min={2} max={12} step={1}
            onChange={(columns) => setLayout({ columns })} />
          <RangeField label="Margin" display={`${Math.round(brand.layout.margin * 100)}%`} value={Math.round(brand.layout.margin * 100)} min={3} max={12} step={1}
            onChange={(m) => setLayout({ margin: m / 100 })} />
        </div>

        <div className="flex flex-wrap items-end gap-2">
          <Field label="Background" className="flex-[1_1_140px]">
            <div className="flex gap-2">
              <Select
                items={BACKGROUNDS}
                value={bgValue}
                onValueChange={(v) => v && v !== 'custom' && setPreset({ background: v })}
              >
                <SelectTrigger aria-label="Background" className="min-w-0 flex-1">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {BACKGROUNDS.map((b) => <SelectItem key={b.value} value={b.value}>{b.label}</SelectItem>)}
                </SelectContent>
              </Select>
              <ColorPicker label="Custom background" value={preset.background} onChange={(background) => setPreset({ background })} />
            </div>
          </Field>
          <Field label="Transition" className="flex-[1_1_140px]">
            <Select items={TRANSITIONS} value={preset.transition} onValueChange={(v) => v && setPreset({ transition: v as 'fade' | 'cut' })}>
              <SelectTrigger aria-label="Transition" className="w-full">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {TRANSITIONS.map((t) => <SelectItem key={t.value} value={t.value}>{t.label}</SelectItem>)}
              </SelectContent>
            </Select>
          </Field>
        </div>
        <Label className="text-[13px] font-normal">
          <Checkbox checked={showChrome} onCheckedChange={(v) => setShowChrome(v === true)} />
          Show register marks, labels and website
        </Label>
      </Panel>
    </Section>
  )
}

function RangeField(p: { label: string; display: string; value: number; min: number; max: number; step: number; onChange: (v: number) => void }) {
  return (
    <div className="flex min-w-0 flex-col gap-2.5">
      <span className="flex justify-between text-xs font-medium text-muted-foreground">
        {p.label} <output className="text-foreground tabular-nums">{p.display}</output>
      </span>
      <Slider
        thumbLabel={p.label}
        value={[p.value]}
        min={p.min}
        max={p.max}
        step={p.step}
        onValueChange={(v) => p.onChange(Array.isArray(v) ? v[0] : v)}
      />
    </div>
  )
}
