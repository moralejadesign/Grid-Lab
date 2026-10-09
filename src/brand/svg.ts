// SVG upload parsing. Uploads are untrusted: the file is sanitized, then every shape is rebuilt
// from validated path data and hex colors. Nothing from the file is ever inserted into the page.

import DOMPurify from 'dompurify'
import { SVGPathData } from 'svg-pathdata'
import { formatHex, parse as parseColor } from 'culori'
import type { Brand, LogoItem } from './types'

export const MAX_SVG_BYTES = 2_000_000
const MAX_SHAPES = 2000
const MAX_ANCHORS_PER_ITEM = 120
const MAX_ANCHORS = 480
const MAX_USE_DEPTH = 8
const MAX_COLORS = 8

export class SvgError extends Error {}

export type ParsedSvg = {
  logo: NonNullable<Brand['logo']>
  /** Most used colors first, fills, strokes and gradient stops together. */
  colors: string[]
  warnings: string[]
}

/* ---------- matrices ---------- */

type M = [number, number, number, number, number, number]
const IDENTITY: M = [1, 0, 0, 1, 0, 0]

const mul = (a: M, b: M): M => [
  a[0] * b[0] + a[2] * b[1],
  a[1] * b[0] + a[3] * b[1],
  a[0] * b[2] + a[2] * b[3],
  a[1] * b[2] + a[3] * b[3],
  a[0] * b[4] + a[2] * b[5] + a[4],
  a[1] * b[4] + a[3] * b[5] + a[5],
]
const applyM = (m: M, [x, y]: [number, number]): [number, number] => [m[0] * x + m[2] * y + m[4], m[1] * x + m[3] * y + m[5]]
const translateM = (x: number, y: number): M => [1, 0, 0, 1, x, y]
const rad = (deg: number) => (deg * Math.PI) / 180

const NUM = /[-+]?(?:\d*\.\d+|\d+\.?)(?:[eE][-+]?\d+)?/g
const nums = (s: string | null) => (s?.match(NUM) ?? []).map(Number)

/** Parse an SVG `transform` attribute into one matrix. */
export function parseTransform(value: string | null): M {
  if (!value) return IDENTITY
  let m = IDENTITY
  const re = /(matrix|translate|scale|rotate|skewX|skewY)\s*\(([^)]*)\)/g
  let r: RegExpExecArray | null
  while ((r = re.exec(value))) {
    const a = nums(r[2])
    let t: M = IDENTITY
    switch (r[1]) {
      case 'matrix':
        if (a.length === 6) t = a as M
        break
      case 'translate':
        t = translateM(a[0] ?? 0, a[1] ?? 0)
        break
      case 'scale':
        t = [a[0] ?? 1, 0, 0, a[1] ?? a[0] ?? 1, 0, 0]
        break
      case 'rotate': {
        const c = Math.cos(rad(a[0] ?? 0)), s = Math.sin(rad(a[0] ?? 0))
        const rot: M = [c, s, -s, c, 0, 0]
        t = a.length >= 3 ? mul(mul(translateM(a[1], a[2]), rot), translateM(-a[1], -a[2])) : rot
        break
      }
      case 'skewX':
        t = [1, 0, Math.tan(rad(a[0] ?? 0)), 1, 0, 0]
        break
      case 'skewY':
        t = [1, Math.tan(rad(a[0] ?? 0)), 0, 1, 0, 0]
        break
    }
    m = mul(m, t)
  }
  return m
}

/* ---------- styles ---------- */

type Style = Record<string, string>
const INHERITED = ['fill', 'stroke', 'stroke-width', 'fill-rule', 'visibility', 'color']
const STYLE_PROPS = [...INHERITED, 'display', 'stop-color']

const parseDecls = (text: string): Style => {
  const out: Style = {}
  for (const decl of text.split(';')) {
    const i = decl.indexOf(':')
    if (i < 0) continue
    const k = decl.slice(0, i).trim().toLowerCase()
    const v = decl.slice(i + 1).replace(/!important/i, '').trim()
    if (STYLE_PROPS.includes(k) && v) out[k] = v
  }
  return out
}

type Rule = { tag?: string; cls?: string; id?: string; spec: number; order: number; decls: Style }

/** Simple selectors only (`tag`, `.class`, `tag.class`, `#id`), which covers Illustrator, Figma and Inkscape exports. */
function parseStylesheet(css: string): Rule[] {
  const rules: Rule[] = []
  const clean = css.replace(/\/\*[\s\S]*?\*\//g, '').replace(/@[^{]*\{[^{}]*(\{[^{}]*\}[^{}]*)*\}/g, '')
  const re = /([^{}]+)\{([^{}]*)\}/g
  let r: RegExpExecArray | null
  let order = 0
  while ((r = re.exec(clean))) {
    const decls = parseDecls(r[2])
    for (const sel of r[1].split(',')) {
      const m = sel.trim().match(/^([a-zA-Z][\w-]*)?(?:\.([\w-]+))?(?:#([\w-]+))?$/)
      if (!m || !(m[1] || m[2] || m[3])) continue
      rules.push({ tag: m[1], cls: m[2], id: m[3], spec: (m[3] ? 100 : 0) + (m[2] ? 10 : 0) + (m[1] ? 1 : 0), order: order++, decls })
    }
  }
  return rules.sort((a, b) => a.spec - b.spec || a.order - b.order)
}

/* ---------- paint ---------- */

function toHex(v: string | undefined): string | null {
  if (!v) return null
  const c = parseColor(v.trim())
  if (!c || (c.alpha !== undefined && c.alpha === 0)) return null
  return formatHex(c) ?? null
}

/* ---------- shapes ---------- */

const attrNum = (el: Element, name: string) => {
  const v = el.getAttribute(name)
  if (!v || v.trim().endsWith('%')) return 0
  const n = parseFloat(v)
  return Number.isFinite(n) ? n : 0
}

function rectD(x: number, y: number, w: number, h: number, rx: number, ry: number) {
  if (!rx) return `M${x} ${y}H${x + w}V${y + h}H${x}Z`
  return `M${x + rx} ${y}H${x + w - rx}A${rx} ${ry} 0 0 1 ${x + w} ${y + ry}V${y + h - ry}A${rx} ${ry} 0 0 1 ${x + w - rx} ${y + h}H${x + rx}A${rx} ${ry} 0 0 1 ${x} ${y + h - ry}V${y + ry}A${rx} ${ry} 0 0 1 ${x + rx} ${y}Z`
}

export const ellipseD = (cx: number, cy: number, rx: number, ry: number) =>
  `M${cx - rx} ${cy}A${rx} ${ry} 0 1 0 ${cx + rx} ${cy}A${rx} ${ry} 0 1 0 ${cx - rx} ${cy}Z`
export const circleD = (cx: number, cy: number, r: number) => ellipseD(cx, cy, r, r)

/** Path data for a shape element, or null when it draws nothing. */
function shapeD(el: Element): string | null {
  switch (el.localName) {
    case 'path':
      return el.getAttribute('d')
    case 'rect': {
      const x = attrNum(el, 'x'), y = attrNum(el, 'y'), w = attrNum(el, 'width'), h = attrNum(el, 'height')
      if (w <= 0 || h <= 0) return null
      let rx = attrNum(el, 'rx'), ry = attrNum(el, 'ry')
      if (rx && !el.hasAttribute('ry')) ry = rx
      if (ry && !el.hasAttribute('rx')) rx = ry
      return rectD(x, y, w, h, Math.min(rx, w / 2), Math.min(ry, h / 2))
    }
    case 'circle': {
      const r = attrNum(el, 'r')
      return r > 0 ? circleD(attrNum(el, 'cx'), attrNum(el, 'cy'), r) : null
    }
    case 'ellipse': {
      const rx = attrNum(el, 'rx'), ry = attrNum(el, 'ry')
      return rx > 0 && ry > 0 ? ellipseD(attrNum(el, 'cx'), attrNum(el, 'cy'), rx, ry) : null
    }
    case 'line':
      return `M${attrNum(el, 'x1')} ${attrNum(el, 'y1')}L${attrNum(el, 'x2')} ${attrNum(el, 'y2')}`
    case 'polyline':
    case 'polygon': {
      const p = nums(el.getAttribute('points'))
      if (p.length < 4) return null
      const pts: string[] = []
      for (let i = 0; i + 1 < p.length; i += 2) pts.push(`${p[i]} ${p[i + 1]}`)
      return 'M' + pts.join('L') + (el.localName === 'polygon' ? 'Z' : '')
    }
  }
  return null
}

/** End points of every segment, used as construction nodes. Dedupes consecutive repeats. */
export function anchorsFromD(d: string): [number, number][] {
  const out: [number, number][] = []
  const cmds = new SVGPathData(d).toAbs().normalizeHVZ(false, true, true).commands
  for (const c of cmds) {
    if (!('x' in c) || !('y' in c)) continue
    const { x, y } = c
    const last = out[out.length - 1]
    if (!last || Math.hypot(last[0] - x, last[1] - y) > 0.01) out.push([x, y])
  }
  return out
}

const sample = <T,>(a: T[], keep: number) => (a.length <= keep ? a : Array.from({ length: keep }, (_, i) => a[Math.floor((i * a.length) / keep)]))

/* ---------- parse ---------- */

const SKIP = new Set(['defs', 'clipPath', 'mask', 'symbol', 'pattern', 'marker', 'linearGradient', 'radialGradient', 'style', 'title', 'desc', 'metadata', 'filter'])
const CONTAINERS = new Set(['g', 'a', 'switch', 'svg'])
const SHAPES = new Set(['path', 'rect', 'circle', 'ellipse', 'line', 'polyline', 'polygon'])

export function parseSvg(text: string): ParsedSvg {
  if (text.length > MAX_SVG_BYTES) throw new SvgError('That file is larger than 2 MB. Export a simpler SVG and try again.')
  if (/<!ENTITY/i.test(text)) throw new SvgError('This SVG uses entity declarations, which Grid Lab does not accept. Export it again from your design tool.')

  const doc = new DOMParser().parseFromString(text, 'image/svg+xml')
  const root = doc.documentElement
  if (doc.getElementsByTagName('parsererror').length || root.localName !== 'svg') throw new SvgError('That file is not a valid SVG.')

  // Strip scripts, foreignObject and event attributes. Text stays so it can be counted, then skipped.
  DOMPurify.sanitize(root, {
    IN_PLACE: true,
    USE_PROFILES: { svg: true, svgFilters: true },
    FORBID_TAGS: ['script', 'foreignObject', 'iframe', 'animate', 'set', 'animateTransform', 'animateMotion'],
    ADD_TAGS: ['use'],
    ADD_ATTR: ['href', 'xlink:href'],
  })

  const byId = new Map<string, Element>()
  for (const el of Array.from(root.querySelectorAll('[id]'))) byId.set(el.getAttribute('id')!, el)
  const rules = parseStylesheet(Array.from(root.getElementsByTagName('style')).map((s) => s.textContent ?? '').join('\n'))

  const counts = new Map<string, number>()
  const bump = (hex: string | null) => hex && counts.set(hex, (counts.get(hex) ?? 0) + 1)

  const hrefOf = (el: Element) => (el.getAttribute('href') ?? el.getAttribute('xlink:href') ?? '').trim()
  const refId = (href: string) => (href.startsWith('#') ? href.slice(1) : null)

  /** First stop color of a gradient, following href chains for inherited stops. */
  function gradientColor(id: string, seen = new Set<string>()): string | null {
    const g = byId.get(id)
    if (!g || seen.has(id)) return null
    seen.add(id)
    const stops = Array.from(g.children).filter((c) => c.localName === 'stop')
    if (stops.length) {
      const hexes = stops.map((s) => toHex(styleOf(s, {})['stop-color'] ?? 'black'))
      hexes.forEach(bump)
      return hexes.find(Boolean) ?? null
    }
    const next = refId(hrefOf(g))
    return next ? gradientColor(next, seen) : null
  }

  function paint(value: string | undefined, style: Style): string | null {
    if (!value || value === 'none') return null
    if (value === 'currentColor') return toHex(style.color ?? 'black')
    const url = value.match(/url\(\s*['"]?#([^'")\s]+)['"]?\s*\)/)
    if (url) return gradientColor(url[1]) ?? '#111111'
    return toHex(value)
  }

  function styleOf(el: Element, parent: Style): Style {
    const s: Style = {}
    for (const k of INHERITED) if (parent[k] !== undefined) s[k] = parent[k]
    const set = (decls: Style) => {
      for (const [k, v] of Object.entries(decls)) if (v !== 'inherit') s[k] = v
    }
    const attrs: Style = {}
    for (const k of STYLE_PROPS) {
      const v = el.getAttribute(k)
      if (v) attrs[k] = v.trim()
    }
    set(attrs)
    const classes = (el.getAttribute('class') ?? '').split(/\s+/).filter(Boolean)
    const id = el.getAttribute('id')
    for (const r of rules) {
      if (r.tag && r.tag !== el.localName) continue
      if (r.cls && !classes.includes(r.cls)) continue
      if (r.id && r.id !== id) continue
      set(r.decls)
    }
    set(parseDecls(el.getAttribute('style') ?? ''))
    return s
  }

  const items: LogoItem[] = []
  let x0 = Infinity, y0 = Infinity, x1 = -Infinity, y1 = -Infinity
  let textCount = 0, imageCount = 0, badPaths = 0, externalUse = 0

  function addShape(el: Element, m: M, style: Style) {
    if (style.visibility === 'hidden' || style.visibility === 'collapse') return
    const raw = shapeD(el)
    if (!raw) return
    let path: SVGPathData
    try {
      path = new SVGPathData(raw)
    } catch {
      badPaths++
      return
    }
    if (!path.commands.length) return
    const fill = paint(style.fill ?? 'black', style)
    const sw = parseFloat(style['stroke-width'] ?? '1')
    const strokeHex = paint(style.stroke, style)
    const stroke = strokeHex && sw > 0 ? strokeHex : null
    if (!fill && !stroke) return
    if (items.length >= MAX_SHAPES) throw new SvgError(`This SVG has more than ${MAX_SHAPES.toLocaleString('en')} shapes. Simplify it, then upload again.`)

    const d = path.encode()
    const b = new SVGPathData(d).matrix(...m).getBounds()
    if (![b.minX, b.minY, b.maxX, b.maxY].every(Number.isFinite)) return
    x0 = Math.min(x0, b.minX); y0 = Math.min(y0, b.minY); x1 = Math.max(x1, b.maxX); y1 = Math.max(y1, b.maxY)

    let local: [number, number][]
    if (el.localName === 'circle' || el.localName === 'ellipse') {
      const cx = attrNum(el, 'cx'), cy = attrNum(el, 'cy')
      const rx = attrNum(el, el.localName === 'circle' ? 'r' : 'rx'), ry = attrNum(el, el.localName === 'circle' ? 'r' : 'ry')
      local = [[cx - rx, cy], [cx, cy - ry], [cx + rx, cy], [cx, cy + ry]]
    } else {
      local = sample(anchorsFromD(d), MAX_ANCHORS_PER_ITEM)
    }

    items.push({
      d,
      matrix: [...m],
      fill: fill ?? undefined,
      stroke: stroke ?? undefined,
      strokeWidth: stroke ? sw : 0,
      fillRule: style['fill-rule'] === 'evenodd' ? 'evenodd' : 'nonzero',
      anchors: local.map((p) => applyM(m, p)),
    })
    // Gradient stops were already counted when the gradient was resolved.
    const isUrl = (v?: string) => !!v && v.trim().startsWith('url(')
    if (!isUrl(style.fill)) bump(fill)
    if (!isUrl(style.stroke)) bump(stroke)
  }

  function walk(el: Element, m: M, parent: Style, depth: number, useStack: string[]) {
    const name = el.localName
    if (SKIP.has(name)) return
    if (name === 'text') { textCount++; return }
    if (name === 'image') { imageCount++; return }
    const style = styleOf(el, parent)
    if (style.display === 'none') return
    let mm = mul(m, parseTransform(el.getAttribute('transform')))

    if (name === 'use') {
      const id = refId(hrefOf(el))
      if (!id) { if (hrefOf(el)) externalUse++; return }
      const target = byId.get(id)
      if (!target || depth >= MAX_USE_DEPTH || useStack.includes(id)) return
      mm = mul(mm, translateM(attrNum(el, 'x'), attrNum(el, 'y')))
      const kids = target.localName === 'symbol' ? Array.from(target.children) : [target]
      const symStyle = target.localName === 'symbol' ? styleOf(target, style) : style
      for (const k of kids) walk(k, mm, symStyle, depth + 1, [...useStack, id])
      return
    }
    if (name === 'svg' && el !== root) mm = mul(mm, translateM(attrNum(el, 'x'), attrNum(el, 'y')))
    if (CONTAINERS.has(name)) {
      for (const k of Array.from(el.children)) walk(k, mm, style, depth, useStack)
      return
    }
    if (SHAPES.has(name)) addShape(el, mm, style)
  }

  walk(root, IDENTITY, {}, 0, [])

  if (!items.length) throw new SvgError('No shapes found. Expand strokes and convert text to outlines, then export again.')

  // Keep the construction scene readable: no more than MAX_ANCHORS nodes in total.
  const total = items.reduce((n, i) => n + i.anchors.length, 0)
  if (total > MAX_ANCHORS) {
    const k = MAX_ANCHORS / total
    for (const it of items) it.anchors = sample(it.anchors, Math.max(3, Math.floor(it.anchors.length * k)))
  }

  const warnings: string[] = []
  if (textCount) warnings.push(`${textCount} text element${textCount > 1 ? 's were' : ' was'} skipped. Convert text to outlines.`)
  if (imageCount) warnings.push(`${imageCount} embedded image${imageCount > 1 ? 's were' : ' was'} skipped.`)
  if (externalUse) warnings.push('Links to other files were skipped.')
  if (badPaths) warnings.push(`${badPaths} path${badPaths > 1 ? 's' : ''} could not be read and ${badPaths > 1 ? 'were' : 'was'} skipped.`)

  const colors = [...counts.entries()].sort((a, b) => b[1] - a[1]).map(([hex]) => hex).slice(0, MAX_COLORS)
  return { logo: { items, bbox: { x: x0, y: y0, w: Math.max(1, x1 - x0), h: Math.max(1, y1 - y0) } }, colors, warnings }
}
