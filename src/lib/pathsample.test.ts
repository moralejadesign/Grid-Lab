import { describe, expect, it } from 'vitest'
import { pointAt, polyline, samplePath } from './pathsample'

describe('samplePath', () => {
  it('follows arcs instead of cutting across them', () => {
    // Quarter circle of radius 100 around (0, 0), from (100, 0) to (0, 100).
    const line = polyline(samplePath('M100 0A100 100 0 0 1 0 100'))
    const [x, y] = pointAt(line, 0.5)
    expect(Math.hypot(x, y)).toBeCloseTo(100, 0)
  })
  it('measures by length, so straight lines are walked evenly', () => {
    const line = polyline(samplePath('M0 0H100V100'))
    expect(line.length).toBeCloseTo(200)
    expect(pointAt(line, 0.25)).toEqual([50, 0])
    expect(pointAt(line, 0.75)).toEqual([100, 50])
  })
})
