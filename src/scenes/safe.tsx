import type { Scene } from './types'
import { H, LogoSolid, Txt, W, familyOf, place, theme } from './shared'
import { eio, eout, seg } from '@/lib/motion'

export const safe: Scene = {
  id: 'safe',
  name: 'Safe area',
  section: 'Logo',
  defaultDuration: 3,
  keyProgress: 0.92,
  needs: 'logo',
  Component: ({ brand, progress: p, preset }) => {
    if (!brand.logo) return null
    const K = theme(preset)
    const family = familyOf(brand, preset)
    const pl = place(brand.logo.bbox, W / 2, H / 2, 520, 400)
    const u = Math.min(pl.w, pl.h) * brand.layout.clearSpace
    const { ox: bx, oy: by, w: bw, h: bh } = pl
    const m = u * eio(seg(p, 0.3, 0.62))
    const ox = bx - m, oy = by - m, ow = bw + 2 * m, oh = bh + 2 * m
    const xa = seg(p, 0.58, 0.78)
    const ca = eout(seg(p, 0.72, 0.92))
    const xBoxes = [[bx + bw / 2 - m / 2, by - m], [bx + bw / 2 - m / 2, by + bh], [bx - m, by + bh / 2 - m / 2], [bx + bw, by + bh / 2 - m / 2]]
    const corners = [[ox, oy], [ox + ow - m, oy], [ox, oy + oh - m], [ox + ow - m, oy + oh - m]]
    return (
      <g>
        <LogoSolid brand={brand} pl={pl} a={eout(seg(p, 0, 0.2))} />
        <rect x={bx} y={by} width={bw} height={bh} fill="none" stroke={K.ink} strokeWidth={1.2} opacity={0.55 * eio(seg(p, 0.12, 0.32))} />
        {m > 1 && (
          <g>
            <path d={`M${ox} ${oy}h${ow}v${oh}h${-ow}Z M${bx} ${by}h${bw}v${bh}h${-bw}Z`} fillRule="evenodd" fill={K.ink} opacity={0.07} />
            <rect x={ox} y={oy} width={ow} height={oh} fill="none" stroke={K.ink} strokeWidth={1.2} strokeDasharray="8 7" opacity={0.8} />
            {xa > 0 && xBoxes.map(([sx, sy], i) => (
              <g key={i}>
                <rect x={sx} y={sy} width={m} height={m} fill="none" stroke={K.ink} strokeWidth={1.1} opacity={0.9 * xa} />
                <Txt x={sx + m / 2} y={sy + m / 2} size={Math.max(10, Math.min(28, m * 0.45))} weight={600} align="center" col={K.ink} a={xa} family={family}>x</Txt>
              </g>
            ))}
            {ca > 0 && corners.map(([sx, sy], i) => (
              <circle key={i} cx={sx + m / 2} cy={sy + m / 2} r={(m / 2) * ca} fill="none" stroke={K.ink} strokeWidth={1.1} opacity={0.85} />
            ))}
          </g>
        )}
      </g>
    )
  },
}
