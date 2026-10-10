import type { Metadata } from 'next'
import { GraphicsShowcaseClient } from '@/components/editor/EditorClient'

export const metadata: Metadata = { title: 'Graphics showcase · Grid Lab' }

export default function GraphicsShowcasePage() {
  return <GraphicsShowcaseClient />
}
