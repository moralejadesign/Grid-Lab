'use client'

import dynamic from 'next/dynamic'

// The tools measure text and run the Remotion Player, both browser-only, so they skip server rendering.
export const LandingClient = dynamic(() => import('./Landing').then((m) => m.Landing), { ssr: false })
export const EditorClient = dynamic(() => import('./Editor').then((m) => m.Editor), { ssr: false })
export const GraphicsShowcaseClient = dynamic(() => import('./ShowcaseTools').then((m) => m.GraphicsShowcaseTool), { ssr: false })
export const BrandShowcaseClient = dynamic(() => import('./ShowcaseTools').then((m) => m.BrandShowcaseTool), { ssr: false })
