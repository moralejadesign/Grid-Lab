import type { Metadata } from 'next'
import { BrandShowcaseClient } from '@/components/editor/EditorClient'

export const metadata: Metadata = { title: 'Brand showcase · Grid Lab' }

export default function BrandShowcasePage() {
  return <BrandShowcaseClient />
}
