import type { Scene } from './types'
import { H, W, Txt, familyOf, theme } from './shared'
import { eout, seg } from '@/lib/motion'
import { textWidth } from '@/lib/text'

export const intro: Scene = {
  id: 'intro',
  name: 'Opening',
  section: 'Brand',
  defaultDuration: 2.5,
  keyProgress: 0.8,
  needs: null,
  Component: ({ brand, progress: p, preset }) => {
    const K = theme(preset)
    const family = familyOf(brand, preset)
    const t = brand.openingLine || brand.name || 'Brand'
    const size = 52
    const chars = [...t]
    const n = Math.floor(chars.length * seg(p, 0.2, 0.72) + 0.0001)
    const sub = chars.slice(0, n).join('')
    const w = textWidth(sub, 600, size, family)
    const dotR = size * 0.19
    const gap = n ? size * 0.3 : 0
    const ap = eout(seg(p, 0, 0.14))
    const out = 1 - seg(p, 0.9, 1)
    const x0 = W / 2 - (w + gap + dotR * 2) / 2
    const base = H / 2 + size * 0.34
    return (
      <g opacity={out}>
        <Txt x={x0} y={base} size={size} weight={600} base="alphabetic" col={K.ink} family={family}>
          {sub}
        </Txt>
        <circle cx={x0 + w + gap + dotR} cy={base - size * 0.27} r={dotR * (0.3 + 0.7 * ap)} fill={K.ink} />
      </g>
    )
  },
}
