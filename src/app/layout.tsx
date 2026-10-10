import type { Metadata } from 'next'
import { Analytics } from '@vercel/analytics/next'
import { Geist_Mono, Hanken_Grotesk } from 'next/font/google'
import { themeScript } from '@/components/editor/ThemeToggle'
import './globals.css'

const hanken = Hanken_Grotesk({ variable: '--font-hanken', subsets: ['latin'], weight: ['400', '500', '600', '700'] })
const mono = Geist_Mono({ variable: '--font-geist-mono', subsets: ['latin'], weight: ['400', '500'] })

export const metadata: Metadata = {
  metadataBase: new URL(process.env.VERCEL_PROJECT_PRODUCTION_URL ? `https://${process.env.VERCEL_PROJECT_PRODUCTION_URL}` : 'http://localhost:3001'),
  title: 'Grid Lab',
  description: 'Brand videos, built from your logo. Upload your brand assets and animate them: a brand video, a graphics showcase or a brand board.',
  openGraph: { type: 'website', siteName: 'Grid Lab', title: 'Grid Lab', description: 'Brand videos, built from your logo.' },
  twitter: { card: 'summary_large_image', title: 'Grid Lab', description: 'Brand videos, built from your logo.' },
}

export default function RootLayout({ children }: LayoutProps<'/'>) {
  return (
    <html lang="en" data-theme="dark" className={`${hanken.variable} ${mono.variable} antialiased`} suppressHydrationWarning>
      <head>
        <script dangerouslySetInnerHTML={{ __html: themeScript }} />
      </head>
      <body>
        {children}
        <Analytics />
      </body>
    </html>
  )
}
