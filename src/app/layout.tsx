import type { Metadata } from 'next'
import { Hanken_Grotesk } from 'next/font/google'
import './globals.css'

const hanken = Hanken_Grotesk({ variable: '--font-hanken', subsets: ['latin'], weight: ['400', '500', '600', '700'] })

export const metadata: Metadata = {
  title: 'Grid Lab',
  description: 'Turn a brand SVG into the frames every brand video needs.',
}

export default function RootLayout({ children }: LayoutProps<'/'>) {
  return (
    <html lang="en" className={`${hanken.variable} antialiased`}>
      <body>{children}</body>
    </html>
  )
}
