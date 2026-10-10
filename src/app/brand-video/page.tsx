import type { Metadata } from 'next'
import { EditorClient } from '@/components/editor/EditorClient'

export const metadata: Metadata = { title: 'Brand video · Grid Lab' }

export default function BrandVideoPage() {
  return <EditorClient />
}
