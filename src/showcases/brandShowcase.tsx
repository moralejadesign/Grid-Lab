import type React from 'react'
import { useId } from 'react'
import type { Brand } from '@/brand/types'
import type { Scene } from '@/scenes/types'
import { H, LogoShape, LogoSolid, W, place, theme } from '@/scenes/shared'
import { clamp, eio, eout, lerp, seg } from '@/lib/motion'
import { TileView, Word, accentOf, inkOn, tilesOf, type Tile } from './shared'

// Brand showcase: the brand's components laid out as one board.
//   0.00 to 0.20  the frame is the brand color; the logo draws on, then fills
//   0.20 to 0.30  the color shrinks into the center card and the board's other cards arrive
//   0.36 to 0.84  cards change content on hard cuts: type specimen, letters, palette, graphics
//   0.82 to 0.98  cards leave, the center card grows back to fill the frame, the logo fades
// The clip loops: it starts and ends on the brand color.

type Box = { x: number; y: number; w: number; h: number }

const FULL: Box = { x: 0, y: 0, w: W, h: H }
const CENTER: Box = { x: 760, y: 420, w: 330, h: 300 }
const TYPE: Box = { x: 330, y: 110, w: 300, h: 300 }
const MARK: Box = { x: 770, y: 130, w: 830, h: 300 }
const PHOTO: Box = { x: 180, y: 470, w: 420, h: 310 }
const WIDE: Box = { x: 380, y: 650, w: 760, h: 320 }
const WORDS: Box = { x: 1240, y: 560, w: 330, h: 360 }

const CYCLE = [0.36, 0.84] as const

const mix = (a: Box, b: Box, t: number): Box => ({ x: lerp(a.x, b.x, t), y: lerp(a.y, b.y, t), w: lerp(a.w, b.w, t), h: lerp(a.h, b.h, t) })

/** Index of the hard-cut state within the cycling span, `n` states. */
const cut = (p: number, n: number, offset = 0) => Math.min(n - 1, Math.floor(clamp(seg(p, CYCLE[0], CYCLE[1]) * n + offset) % n))

/** A board card: arrives, holds and leaves; content is clipped to its rounded rect. */
const Card: React.FC<{ id: string; box: Box; v: number; fill: string; edge: string; children?: React.ReactNode }> = ({ id, box, v, fill, edge, children }) => {
  if (v <= 0) return null
  const { x, y, w, h } = box
  const s = 0.94 + 0.06 * v
  return (
    <g opacity={v} transform={`translate(${x + w / 2} ${y + h / 2 + 30 * (1 - v)}) scale(${s}) translate(${-x - w / 2} ${-y - h / 2})`}>
      <clipPath id={id}><rect x={x} y={y} width={w} height={h} rx={18} /></clipPath>
      <rect x={x} y={y} width={w} height={h} rx={18} fill={fill} />
      <g clipPath={`url(#${id})`}>{children}</g>
      <rect x={x} y={y} width={w} height={h} rx={18} fill="none" stroke={edge} strokeWidth={1} opacity={0.12} />
    </g>
  )
}

/** Upper-case letters of the brand name the font can draw, for the big-letter cards. */
function lettersOf(brand: Brand) {
  const seen = new Set<string>()
  for (const ch of (brand.name || 'Brand').toUpperCase()) if (/\p{L}|\p{N}/u.test(ch)) seen.add(ch)
  const list = [...seen]
  return list.length ? list : ['A']
}

export const brandShowcase: Scene = {
  id: 'brand-showcase',
  name: 'Brand showcase',
  section: 'Brand',
  defaultDuration: 10,
  keyProgress: 0.56,
  needs: 'logo',
  Component: ({ brand, progress: p, preset }) => {
    const K = theme(preset)
    const uid = useId().replace(/[^\w-]/g, '')
    if (!brand.logo) return null
    const { items, bbox: bb } = brand.logo
    const accent = accentOf(brand)
    const onAccent = inkOn(accent)
    const surf = K.dark ? '#1a1a1a' : '#ffffff'

    // The brand color: full frame, then the center card, then full frame again.
    const shrink = eio(seg(p, 0.2, 0.3))
    const grow = eio(seg(p, 0.88, 0.97))
    const colorBox = mix(mix(FULL, CENTER, shrink), FULL, grow)
    const rx = 18 * Math.min(shrink, 1 - grow)
    const logoBox = mix(mix({ x: W / 2 - 190, y: H / 2 - 190, w: 380, h: 380 }, { x: CENTER.x + 85, y: CENTER.y + 70, w: 160, h: 160 }, shrink),
      { x: W / 2 - 190, y: H / 2 - 190, w: 380, h: 380 }, grow)
    const lp = place(bb, logoBox.x + logoBox.w / 2, logoBox.y + logoBox.h / 2, logoBox.w, logoBox.h)
    const draw = eio(seg(p, 0.03, 0.14))
    const fill = eio(seg(p, 0.11, 0.19))
    const logoA = 1 - eio(seg(p, 0.93, 0.99))

    // Board cards arrive one after another and leave in reverse.
    const life = (k: number) => eout(seg(p, 0.25 + k * 0.025, 0.36 + k * 0.025)) * (1 - eio(seg(p, 0.86 - k * 0.012, 0.9 - k * 0.012)))

    const graphicTiles: Tile[] = brand.graphics.length
      ? brand.graphics.map((g) => ({ kind: 'image', src: g.src, aspect: g.width / g.height }))
      : tilesOf(brand, 4).filter((t) => t.kind === 'color')
    const photo = graphicTiles[cut(p, Math.max(2, graphicTiles.length * 2)) % graphicTiles.length]
    const wide = brand.graphics[0]

    const letters = lettersOf(brand)
    const typeState = cut(p, 6)
    const words = (brand.principles.length ? brand.principles : ['Logo', 'Type', 'Color']).slice(0, 5)

    return (
      <g>
        <Card id={`${uid}m`} box={MARK} v={life(0)} fill={surf} edge={K.ink}>
          {[0.28, 0.5, 0.72].map((f) => (
            <line key={f} x1={MARK.x} x2={MARK.x + MARK.w} y1={MARK.y + MARK.h * f} y2={MARK.y + MARK.h * f} stroke={K.ink} strokeWidth={1} opacity={0.12} />
          ))}
          <LogoSolid brand={brand} pl={place(bb, MARK.x + 230, MARK.y + MARK.h / 2, 120, 120)} a={0.32} mono={K.ink} />
          <Word brand={brand} text={brand.name} x={MARK.x + 320} y={MARK.y + MARK.h / 2 + 36} size={104} fill={K.ink} a={0.32} maxWidth={MARK.w - 360} />
          <Word brand={brand} text="Logo lockup" x={MARK.x + 28} y={MARK.y + 40} size={18} fill={K.ink} a={0.5} />
        </Card>

        <Card id={`${uid}t`} box={TYPE} v={life(1)} fill={typeState === 0 ? accent : surf} edge={K.ink}>
          <TypeCard brand={brand} state={typeState} letters={letters} accent={accent} ink={typeState === 0 ? onAccent : K.ink} />
        </Card>

        <Card id={`${uid}w`} box={WORDS} v={life(2)} fill={surf} edge={K.ink}>
          {words.map((t, i) => (
            <Word key={i} brand={brand} text={t} x={WORDS.x + WORDS.w / 2} y={WORDS.y + 78 + i * 46} size={36} align="center" fill={K.ink} maxWidth={WORDS.w - 40} />
          ))}
          <Word brand={brand} text="W:1920  H:1080" x={WORDS.x + WORDS.w / 2} y={WORDS.y + WORDS.h - 34} size={22} align="center" fill={K.ink} a={0.55} />
        </Card>

        {/* A graphic with the opening line, or without graphics the brand name set large. */}
        <Card id={`${uid}b`} box={WIDE} v={life(3)} fill={surf} edge={K.ink}>
          {wide && <image href={wide.src} x={WIDE.x} y={WIDE.y} width={WIDE.w} height={WIDE.h} preserveAspectRatio="xMidYMid slice" />}
          {!wide && <Word brand={brand} text={brand.name} x={WIDE.x + 40} y={WIDE.y + WIDE.h - 40} size={150} fill={K.ink} a={0.9} maxWidth={WIDE.w - 80} />}
          {wide && <Word brand={brand} text={brand.openingLine} x={WIDE.x + 40} y={WIDE.y + WIDE.h - 40} size={28} fill="#ffffff" a={0.9} maxWidth={WIDE.w - 200} />}
          {wide && <LogoSolid brand={brand} pl={place(bb, WIDE.x + WIDE.w - 80, WIDE.y + WIDE.h - 46, 60, 32)} a={0.9} mono="#ffffff" />}
        </Card>

        <Card id={`${uid}p`} box={PHOTO} v={life(4)} fill={surf} edge={K.ink}>
          <TileView brand={brand} tile={photo} id={`${uid}pt`} cx={PHOTO.x + PHOTO.w / 2} cy={PHOTO.y + PHOTO.h / 2} w={PHOTO.w} h={PHOTO.h} rx={0} />
        </Card>

        {/* The brand color, the one surface that is on screen the whole time. */}
        <rect x={colorBox.x} y={colorBox.y} width={colorBox.w} height={colorBox.h} rx={rx} fill={accent} />
        <g opacity={logoA}>
          {items.map((it, i) => (
            <LogoShape key={i} bb={bb} pl={lp} item={it}
              o={{ fa: fill, mono: onAccent, sa: 1 - fill, sc: onAccent, dash: draw, lw: preset.hairline + 0.6 }} />
          ))}
        </g>
      </g>
    )
  },
}

/** The type card's content for each hard-cut state. */
const TypeCard: React.FC<{ brand: Brand; state: number; letters: string[]; accent: string; ink: string }> = ({ brand, state, letters, accent, ink }) => {
  const { x, y, w, h } = TYPE
  const cx = x + w / 2
  if (state === 0) {
    return (
      <>
        {['AaBb', 'CcDdEe', 'FfGg'].map((t, i) => (
          <Word key={t} brand={brand} text={t} x={cx} y={y + 112 + i * 66} size={62} align="center" fill={ink} />
        ))}
      </>
    )
  }
  if (state === 2) {
    const sw = brand.palette.slice(0, 4)
    return (
      <>
        {sw.map((c, i) => (
          <g key={i}>
            <rect x={x + 30} y={y + 34 + i * 60} width={44} height={44} rx={8} fill={c.hex} stroke={ink} strokeOpacity={0.15} />
            <Word brand={brand} text={c.hex.toUpperCase()} x={x + 92} y={y + 66 + i * 60} size={26} fill={ink} />
          </g>
        ))}
        {!sw.length && <rect x={x + 30} y={y + 30} width={w - 60} height={h - 60} rx={10} fill={accent} />}
      </>
    )
  }
  if (state === 4) {
    const family = brand.font?.family ?? 'Hanken Grotesk'
    return (
      <>
        <Word brand={brand} text={family} x={x + 28} y={y + 52} size={26} fill={ink} maxWidth={w - 56} />
        <Word brand={brand} text="Aa" x={cx} y={y + h - 54} size={170} align="center" fill={ink} />
      </>
    )
  }
  // States 1, 3 and 5: one big letter of the brand name each.
  const ch = letters[((state - 1) / 2) % letters.length]
  return <Word brand={brand} text={ch} x={cx} y={y + h - 62} size={260} align="center" fill={ink} />
}
