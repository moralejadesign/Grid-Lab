import { describe, expect, it } from 'vitest'
import { glyphOutline } from './font'
import { defaultFont } from './default-font'

describe('glyphOutline', () => {
  it('flips y so the baseline is 0 and up is negative', () => {
    const g = glyphOutline([
      { command: 'moveTo', args: [0, 0] },
      { command: 'lineTo', args: [100, 700] },
      { command: 'closePath', args: [] },
    ], 500)
    expect(g.d).toBe('M0 0L100 -700Z')
    expect(g.nodes).toEqual([[0, 0], [100, -700]])
  })

  it('records both handles of a cubic curve against their own nodes', () => {
    const g = glyphOutline([
      { command: 'moveTo', args: [0, 0] },
      { command: 'bezierCurveTo', args: [10, 20, 30, 40, 50, 60] },
    ], 600)
    expect(g.handles).toEqual([[0, 0, 10, -20], [50, -60, 30, -40]])
    expect(g.advance).toBe(600)
  })
})

describe('default font', () => {
  it('covers the alphabet, figures and the period the construction scene ends on', () => {
    for (const ch of 'abcdefghijklmnopqrstuvwxyzABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789.') expect(defaultFont.glyphs[ch], ch).toBeDefined()
  })
  it('has sane metrics', () => {
    const m = defaultFont.metrics
    expect(m.capHeight).toBeGreaterThan(m.xHeight)
    expect(m.descender).toBeLessThan(0)
    expect(defaultFont.unitsPerEm).toBe(1000)
  })
})
