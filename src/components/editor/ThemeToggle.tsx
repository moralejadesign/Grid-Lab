'use client'

import { MoonIcon, SunIcon } from 'lucide-react'
import { useState } from 'react'

export type Theme = 'light' | 'dark'
export const THEME_KEY = 'gridlab-theme'

/** Dark is the default (set on <html> in the layout). Runs in <head> before the page paints, so a saved light theme never flashes dark. */
export const themeScript = `try{if(localStorage.getItem('${THEME_KEY}')==='light')document.documentElement.dataset.theme='light'}catch(e){}`

const current = (): Theme => (document.documentElement.dataset.theme === 'dark' ? 'dark' : 'light')

export function ThemeToggle() {
  const [theme, setTheme] = useState<Theme>(current)
  const next: Theme = theme === 'dark' ? 'light' : 'dark'

  const toggle = () => {
    document.documentElement.dataset.theme = next
    try { localStorage.setItem(THEME_KEY, next) } catch {}
    setTheme(next)
  }

  return (
    <button type="button" onClick={toggle} aria-label={`Switch to ${next} mode`} title={`Switch to ${next} mode`}
      className="inline-flex size-9 items-center justify-center rounded-[10px] bg-soft text-foreground transition-colors hover:text-heat [&_svg]:size-4">
      {theme === 'dark' ? <SunIcon /> : <MoonIcon />}
    </button>
  )
}
