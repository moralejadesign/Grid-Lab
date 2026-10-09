# Grid Lab

Web tool for designers. Upload a brand SVG (plus optional font, palette, photos and up to 5 graphics such as posts or posters) and Grid Lab generates the frames every brand video shows: logo construction, safe area, layout grid, type anatomy, glyph set, color. The designer orders and times them into a video of any length, then exports the video and stills.

This is a product for other designers, not an internal tool. Treat uploads as untrusted and keep each account's files private.

## Visual style

Scenes share one look, set inside the Grid Lab template:
- Near-black canvas (#0b0b0b) by default, light hairlines (1 to 1.5 px at 1920x1080), light type. Scenes flip ink automatically if the designer picks a light background.
- Every frame wears the template (`src/scenes/Template.tsx`): a register mark in each corner, "GRID LAB" top left, "BUILT BY MORALEJA.CO" top right, the brand's website bottom center. Labels are Space Mono Bold, uppercase, widely tracked. The designer can hide the template.
- Color appears only in color scenes and in uploaded graphics.
- Motion is mechanical and drawn: lines draw on, nodes pop in, fills arrive last. Ease in-out cubic, no bounce.

This look is the first style preset. Later presets reuse the same scenes with different motion and type rules.

## Stack

- Next.js (App Router) + TypeScript, deployed on Vercel
- Remotion for scenes, preview (`@remotion/player`) and server rendering (Remotion Lambda)
- Mediabunny for browser-side export (free tier)
- Supabase for auth, database and file storage
- `svg-pathdata` for SVG path parsing, `fontkit` for fonts (TTF, OTF, WOFF, WOFF2, variable), `culori` for color, DOMPurify for SVG sanitizing
- Zustand for editor state, dnd-kit for timeline reordering
- Tailwind + shadcn/ui for the interface
- Playwright for visual snapshot tests
- PostHog for usage tracking

## Commands

```bash
pnpm dev            # Next.js app
pnpm remotion       # Remotion Studio for working on scenes in isolation
pnpm test           # unit tests
pnpm test:visual    # Playwright snapshots of every scene
pnpm lint && pnpm typecheck
node scripts/build-default-font.mts   # rebuild the built-in Hanken Grotesk outlines
```

## Structure

```
src/
  app/            Next.js routes (editor, projects, account)
  brand/          parsing: svg.ts, font.ts, palette.ts -> Brand
  scenes/         one file per scene + registry.ts
  presets/        style presets (motion, line weight, type rules)
  timeline/       ordering and durations
  render/         browser export (Mediabunny) and server render (Lambda)
  remotion/       Remotion entry, Root and compositions (Video, one per scene)
  components/     editor UI
  lib/            shared helpers: easing (eio, eout, seg), rng, color, text width
reference/        prototype.html, the working spec for the scenes
```

## Brand model

Every scene reads only from this object. Never read uploads directly inside a scene.

```ts
type Brand = {
  name: string
  openingLine: string
  website?: string                // bottom center of every frame
  principles: string[]            // up to 6
  specimenGlyph?: string          // defaults to first letter of name
  palette: { name: string; hex: string }[]
  logo?: {
    items: { d: string; matrix: number[]; fill?: string; stroke?: string; strokeWidth: number; fillRule: 'nonzero' | 'evenodd'; anchors: [number, number][] }[]
    bbox: { x: number; y: number; w: number; h: number }
  }
  font?: {                        // missing means the built-in Hanken Grotesk (src/brand/default-font.json)
    family: string
    file: string                  // storage URL once accounts exist; the file name until then
    unitsPerEm: number
    metrics: { xHeight: number; capHeight: number; ascender: number; descender: number }   // font units
    glyphs: Record<string, { d: string; advance: number; nodes: [number, number][]; handles: [number, number, number, number][] }>  // y-down, baseline 0
  }
  photos: string[]                // storage URLs
  graphics: { src: string; width: number; height: number; name: string }[]  // up to 5; downscaled data URLs until storage exists
  layout: { clearSpace: number; columns: number; margin: number }
}
```

## Scene contract

```ts
type Scene = {
  id: string
  name: string                    // shown bottom center
  section: string                 // shown top center
  defaultDuration: number         // seconds
  keyProgress: number             // 0..1, the still used for thumbnails and PNG export
  needs: 'logo' | 'photos' | 'graphics' | null
  Component: React.FC<{ brand: Brand; progress: number; preset: Preset }>
}
```

Rules for scenes:
- A scene is a pure function of `brand`, `progress` and `preset`. Same input, same frame. Server rendering and visual tests depend on this.
- Use the seeded `rng(seed)` helper for any randomness. Never `Math.random()`.
- Draw in a 1920x1080 coordinate space and let the composition scale it.
- Use the shared easing helpers (`eio`, `eout`, `seg`) so motion stays consistent across scenes.
- Draw type from `fontOf(brand)` outlines with the `Glyph` helper (`src/scenes/glyphs.tsx`), never with `<text>` in the brand font. Outlines need no font loading, so preview, export and server renders match.
- If a scene needs an optional asset, declare it in `needs`. The editor hides scenes whose needs are missing.
- Port the math from `reference/prototype.html` before inventing new behavior. That file is the working spec for all 11 scenes.

## Product rules

- Videos have no length limit. A single scene runs 0.5 to 60 seconds.
- Graphics uploads: at most 5, raster only (PNG, JPEG, WebP), never SVG.
- Sanitize every uploaded SVG with DOMPurify. Remove scripts, `foreignObject` and event attributes. Skip `<text>` and tell the user to convert text to outlines.
- Uploaded fonts are private to the account that uploaded them. Never serve them from a public URL.
- Export formats: MP4 (H.264), WebM fallback, PNG per frame, zip of all frames. Later: ProRes 4444 with alpha, GIF, 1:1, 4:5 and 9:16.
- Free tier renders in the browser. Server rendering is for paid exports only.

## Writing UI copy

- Plain, short sentences. Name things the way designers do (safe area, glyph set, margins).
- Never use em dashes.
- Buttons say what happens ("Export video"). Errors say what went wrong and how to fix it.

## Testing

- Before committing a change to any scene, run `pnpm test:visual`. It renders every scene at `keyProgress` with the sample brand and compares against saved snapshots.
- Add a snapshot for every new scene.
- Test SVG parsing with edge cases: nested transforms, rounded rects, polygons, stroke-only shapes, gradients, files without a viewBox.

## Build phases

1. Private beta, no accounts: rebuild the prototype in Next.js + Remotion, add presets and multi-format export.
2. Accounts and saved brands (Supabase).
3. Paid tier with server rendering.

## Open decisions

Ask before acting on any of these:
- Remotion company license terms for a product where users render videos
- Payments provider (Paddle or Lemon Squeezy as merchant of record)
- Whether the name "Grid Lab" is available as a product name and domain
