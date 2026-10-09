import type { Metadata } from 'next'
import { Analytics } from '@vercel/analytics/next'
import { Geist_Mono, Hanken_Grotesk } from 'next/font/google'
import { themeScript } from '@/components/editor/ThemeToggle'
import './globals.css'

const hanken = Hanken_Grotesk({ variable: '--font-hanken', subsets: ['latin'], weight: ['400', '500', '600', '700'] })
const mono = Geist_Mono({ variable: '--font-geist-mono', subsets: ['latin'], weight: ['400', '500'] })

export const metadata: Metadata = {
  title: 'Grid Lab',
  description: 'Turn a brand SVG into the frames every brand video needs.',
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
