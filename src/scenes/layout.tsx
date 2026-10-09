import type { Scene } from './types'
import { H, LogoSolid, Txt, W, familyOf, place, theme } from './shared'
import { eio, eout, seg } from '@/lib/motion'

export const layout: Scene = {
  id: 'layout',
  name: 'Layout and margins',
  section: 'Layout',
  defaultDuration: 3,
  keyProgress: 0.92,
  needs: null,
  Component: ({ brand, progress: p, preset }) => {
    const K = theme(preset)
    const family = familyOf(brand, preset)
    // A4 portrait page centered on the canvas.
    const ph = 740, pw = Math.round((ph * 210) / 297), px = (W - pw) / 2, py = (H - ph) / 2
    const m = pw * brand.layout.margin, g = m * 0.45, n = brand.layout.columns
    const pp = eio(seg(p, 0, 0.25))
    const ma = seg(p, 0.2, 0.4)
    const ca = eout(seg(p, 0.3, 0.5))
    const lx = px + m, lw = pw - 2 * m, ly = py + m, lh = ph - 2 * m
    const cw = (lw - (n - 1) * g) / n
    const la = eout(seg(p, 0.78, 0.96))
    const corners = [[px, py], [px + pw - m, py], [px, py + ph - m], [px + pw - m, py + ph - m]]
    return (
      <g>
        {pp > 0 && (
          <rect x={px} y={py} width={pw} height={ph} fill="none" stroke={K.ink} strokeWidth={1.3} opacity={0.9}
            pathLength={1} strokeDasharray={pp < 1 ? `${pp} 1` : undefined} />
        )}
        {ma > 0 && (
          <g>
            <path d={`M${px} ${py}h${pw}v${ph}h${-pw}Z M${lx} ${ly}h${lw}v${lh}h${-lw}Z`} fillRule="evenodd" fill={K.ink} opacity={0.06 * ma} />
            <rect x={lx} y={ly} width={lw} height={lh} fill="none" stroke={K.ink} strokeWidth={1} opacity={0.4 * ma} />
          </g>
        )}
        {ca > 0 && corners.map(([x, y], i) => (
          <circle key={i} cx={x + m / 2} cy={y + m / 2} r={(m / 2) * ca} fill="none" stroke={K.ink} strokeWidth={1.1} opacity={0.8} />
        ))}
        {Array.from({ length: n }, (_, i) => {
          const hp = eio(seg(p, 0.45 + i * 0.025, 0.7 + i * 0.025))
          if (hp <= 0) return null
          const x = lx + i * (cw + g)
          return (
            <g key={i}>
              <rect x={x} y={ly} width={cw} height={lh * hp} fill={K.ink} opacity={0.05} />
              <rect x={x} y={ly} width={cw} height={lh * hp} fill="none" stroke={K.ink} strokeWidth={1} opacity={0.5} />
            </g>
          )
        })}
        {brand.logo ? (
          <LogoSolid brand={brand} pl={place(brand.logo.bbox, px + pw / 2, ly + 36, lw * 0.4, 54)} a={la} />
        ) : (
          <Txt x={px + pw / 2} y={ly + 36} size={32} weight={700} align="center" col={K.ink} a={la} family={family}>
            {brand.name || 'Brand'}
          </Txt>
        )}
      </g>
    )
  },
}
