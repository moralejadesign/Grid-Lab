import { describe, expect, it } from 'vitest'
import { SvgError, parseSvg, parseTransform } from './svg'

const svg = (body: string, attrs = 'viewBox="0 0 100 100"') => `<svg xmlns="http://www.w3.org/2000/svg" xmlns:xlink="http://www.w3.org/1999/xlink" ${attrs}>${body}</svg>`
const close = (a: number[], b: number[]) => a.forEach((v, i) => expect(v).toBeCloseTo(b[i], 5))

describe('parseTransform', () => {
  it('composes left to right', () => {
    close(parseTransform('translate(10 20) scale(2)'), [2, 0, 0, 2, 10, 20])
  })
  it('rotates around a point', () => {
    const m = parseTransform('rotate(90 50 50)')
    // (100, 50) rotates to (50, 100)
    expect(m[0] * 100 + m[2] * 50 + m[4]).toBeCloseTo(50)
    expect(m[1] * 100 + m[3] * 50 + m[5]).toBeCloseTo(100)
  })
})

describe('parseSvg', () => {
  it('reads a simple path with its fill', () => {
    const r = parseSvg(svg('<path d="M10 10H90V90H10Z" fill="#ff0000"/>'))
    expect(r.logo.items).toHaveLength(1)
    expect(r.logo.items[0].fill).toBe('#ff0000')
    expect(r.logo.bbox).toEqual({ x: 10, y: 10, w: 80, h: 80 })
    expect(r.colors).toEqual(['#ff0000'])
  })

  it('applies nested group transforms to bbox and anchors', () => {
    const r = parseSvg(svg('<g transform="translate(100 0)"><g transform="scale(2)"><rect x="0" y="0" width="10" height="10"/></g></g>'))
    expect(r.logo.bbox).toEqual({ x: 100, y: 0, w: 20, h: 20 })
    close(r.logo.items[0].matrix, [2, 0, 0, 2, 100, 0])
    expect(r.logo.items[0].anchors).toContainEqual([120, 20])
  })

  it('turns rounded rects into arcs and clamps the radius', () => {
    const r = parseSvg(svg('<rect x="0" y="0" width="40" height="20" rx="50"/>'))
    const d = r.logo.items[0].d
    expect(d).toContain('A')
    expect(r.logo.bbox).toEqual({ x: 0, y: 0, w: 40, h: 20 })
  })

  it('reads polygons and polylines', () => {
    const r = parseSvg(svg('<polygon points="0,0 50,0 25,40"/><polyline points="60 0 80 20 100 0" fill="none" stroke="#000" stroke-width="2"/>'))
    expect(r.logo.items).toHaveLength(2)
    expect(r.logo.items[0].anchors).toEqual([[0, 0], [50, 0], [25, 40]])
    expect(r.logo.items[1].fill).toBeUndefined()
    expect(r.logo.items[1].stroke).toBe('#000000')
  })

  it('keeps stroke-only shapes and drops shapes with no paint', () => {
    const r = parseSvg(svg('<circle cx="50" cy="50" r="40" fill="none" stroke="blue" stroke-width="4"/><rect width="10" height="10" fill="none"/>'))
    expect(r.logo.items).toHaveLength(1)
    expect(r.logo.items[0]).toMatchObject({ stroke: '#0000ff', strokeWidth: 4, fill: undefined })
  })

  it('uses the first stop of a gradient and adds stops to the palette', () => {
    const r = parseSvg(svg(
      '<defs><linearGradient id="g"><stop offset="0" stop-color="#2b59ff"/><stop offset="1" style="stop-color:#ff5a36"/></linearGradient>' +
      '<linearGradient id="g2" xlink:href="#g"/></defs><rect width="10" height="10" fill="url(#g2)"/>',
    ))
    expect(r.logo.items[0].fill).toBe('#2b59ff')
    expect(r.colors).toEqual(expect.arrayContaining(['#2b59ff', '#ff5a36']))
  })

  it('counts a gradient color once, so flat fills used as often rank first', () => {
    const r = parseSvg(svg(
      '<defs><linearGradient id="g"><stop stop-color="#f2a541"/><stop offset="1" stop-color="#e4572e"/></linearGradient></defs>' +
      '<rect width="10" height="10" fill="#0e7c66"/><rect x="20" width="10" height="10" fill="url(#g)"/>',
    ))
    expect(r.colors[0]).toBe('#0e7c66')
  })

  it('works without a viewBox', () => {
    const r = parseSvg(svg('<ellipse cx="30" cy="20" rx="30" ry="20" fill="#111"/>', 'width="60" height="40"'))
    expect(r.logo.bbox).toEqual({ x: 0, y: 0, w: 60, h: 40 })
    expect(r.logo.items[0].anchors).toHaveLength(4)
  })

  it('reads class styles from a style element', () => {
    const r = parseSvg(svg('<style>.st0{fill:#FFC93C;} .st1{fill:none;stroke:#111;stroke-width:3}</style><rect class="st0" width="5" height="5"/><rect class="st1" x="10" width="5" height="5"/>'))
    expect(r.logo.items[0].fill).toBe('#ffc93c')
    expect(r.logo.items[1]).toMatchObject({ fill: undefined, stroke: '#111111', strokeWidth: 3 })
  })

  it('inherits fill and fill-rule from groups and lets inline style win', () => {
    const r = parseSvg(svg('<g fill="red" fill-rule="evenodd"><path d="M0 0H10V10Z"/><path d="M0 0H10V10Z" style="fill:green"/></g>'))
    expect(r.logo.items.map((i) => i.fill)).toEqual(['#ff0000', '#008000'])
    expect(r.logo.items[0].fillRule).toBe('evenodd')
  })

  it('expands use and symbol references with their offset', () => {
    const r = parseSvg(svg('<defs><symbol id="s"><rect width="10" height="10"/></symbol></defs><use href="#s" x="50" y="50"/>'))
    expect(r.logo.bbox).toEqual({ x: 50, y: 50, w: 10, h: 10 })
  })

  it('ignores shapes inside defs, clip paths and hidden groups', () => {
    const r = parseSvg(svg('<defs><rect width="500" height="500"/></defs><clipPath id="c"><rect width="500" height="500"/></clipPath><g display="none"><rect width="500" height="500"/></g><rect width="10" height="10"/>'))
    expect(r.logo.items).toHaveLength(1)
  })

  it('skips text and tells the user to outline it', () => {
    const r = parseSvg(svg('<text x="0" y="10">Brand</text><rect width="10" height="10"/>'))
    expect(r.logo.items).toHaveLength(1)
    expect(r.warnings).toContain('1 text element was skipped. Convert text to outlines.')
  })

  it('never carries scripts, foreignObject or event handlers into the result', () => {
    const r = parseSvg(svg('<script>alert(1)</script><foreignObject><div>x</div></foreignObject><rect width="10" height="10" onclick="alert(1)" fill="#000"/>'))
    expect(r.logo.items).toHaveLength(1)
    expect(JSON.stringify(r)).not.toMatch(/alert|onclick|script|foreignObject/i)
  })

  it('re-encodes path data so only path commands come out', () => {
    const r = parseSvg(svg('<path d="m 10,10 l 20,0 0,20 z"/>'))
    expect(r.logo.items[0].d).toMatch(/^[MmLlHhVvCcSsQqTtAaZz0-9 .,eE+-]+$/)
  })

  it('rejects files that are not SVG, empty, or use entities', () => {
    expect(() => parseSvg('<html></html>')).toThrow(SvgError)
    expect(() => parseSvg('not xml at all')).toThrow('That file is not a valid SVG.')
    expect(() => parseSvg(svg(''))).toThrow('No shapes found')
    expect(() => parseSvg('<!DOCTYPE svg [<!ENTITY a "aaaa">]>' + svg('<rect width="1" height="1"/>'))).toThrow(SvgError)
  })

  it('caps construction nodes on very detailed logos', () => {
    const pts = Array.from({ length: 400 }, (_, i) => `${i % 100},${Math.floor(i / 100) * 10 + (i % 7)}`).join(' ')
    const r = parseSvg(svg(Array.from({ length: 3 }, () => `<polygon points="${pts}"/>`).join('')))
    const total = r.logo.items.reduce((n, i) => n + i.anchors.length, 0)
    expect(total).toBeLessThanOrEqual(480)
  })
})
