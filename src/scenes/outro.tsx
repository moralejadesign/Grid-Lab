import type { Scene } from './types'
import { H, LogoSolid, Txt, W, familyOf, place, theme } from './shared'
import { eout, seg } from '@/lib/motion'

export const outro: Scene = {
  id: 'outro',
  name: 'Closing',
  section: 'Brand',
  defaultDuration: 2.5,
  keyProgress: 0.9,
  needs: null,
  Component: ({ brand, progress: p, preset }) => {
    const K = theme(preset)
    const a = eout(seg(p, 0, 0.4))
    if (!brand.logo) {
      return <Txt x={W / 2} y={H / 2} size={130} weight={700} align="center" col={K.ink} a={a} family={familyOf(brand, preset)}>{brand.name || 'Brand'}</Txt>
    }
    const sc = 0.94 + 0.06 * a
    return (
      <g transform={`translate(${W / 2} ${H / 2}) scale(${sc}) translate(${-W / 2} ${-H / 2})`}>
        <LogoSolid brand={brand} pl={place(brand.logo.bbox, W / 2, H / 2, 440, 280)} a={a} />
      </g>
    )
  },
}
