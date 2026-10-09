// Text width for layout that depends on rendered text (for example the dot after the opening line).
// Uses a canvas each call with no cache, so a late-loading font never leaves a stale width behind.

let ctx: CanvasRenderingContext2D | OffscreenCanvasRenderingContext2D | null = null

export function textWidth(text: string, weight: number, size: number, family: string) {
  if (!text) return 0
  if (!ctx) {
    if (typeof OffscreenCanvas !== 'undefined') ctx = new OffscreenCanvas(1, 1).getContext('2d')
    else if (typeof document !== 'undefined') ctx = document.createElement('canvas').getContext('2d')
  }
  if (!ctx) return text.length * size * 0.55
  ctx.font = `${weight} ${size}px ${family}`
  return ctx.measureText(text).width
}
