'use client'

import dynamic from 'next/dynamic'

// The editor measures text and runs the Remotion Player, both browser-only, so it skips server rendering.
export const EditorClient = dynamic(() => import('./Editor').then((m) => m.Editor), { ssr: false })
