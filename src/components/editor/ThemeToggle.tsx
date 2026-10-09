'use client'

import { MoonIcon, SunIcon } from 'lucide-react'
import { useEffect, useState } from 'react'

export type Theme = 'light' | 'dark'
export const THEME_KEY = 'gridlab-theme'
const QUERY = '(prefers-color-scheme: dark)'

/** Follows the viewer's system theme unless they picked one with the toggle.
 *  Runs in <head> before the page paints, so the page never flashes the wrong theme.
 *  The layout sets data-theme="dark" as the fallback when scripts are off. */
export const themeScript = `try{var t=localStorage.getItem('${THEME_KEY}');if(t!=='light'&&t!=='dark')t=matchMedia('${QUERY}').matches?'dark':'light';document.documentElement.dataset.theme=t}catch(e){}`

const current = (): Theme => (document.documentElement.dataset.theme === 'light' ? 'light' : 'dark')
const system = (): Theme => (matchMedia(QUERY).matches ? 'dark' : 'light')
const saved = (): Theme | null => {
  try {
    const t = localStorage.getItem(THEME_KEY)
    return t === 'light' || t === 'dark' ? t : null
  } catch {
    return null
  }
}

const apply = (t: Theme) => { document.documentElement.dataset.theme = t }

export function ThemeToggle() {
  const [theme, setTheme] = useState<Theme>(current)
  const next: Theme = theme === 'dark' ? 'light' : 'dark'

  // While the viewer has no saved choice, follow their system theme when it changes.
  useEffect(() => {
    const mq = matchMedia(QUERY)
    const onChange = () => {
      if (saved()) return
      const t = system()
      apply(t)
      setTheme(t)
    }
    mq.addEventListener('change', onChange)
    return () => mq.removeEventListener('change', onChange)
  }, [])

  const toggle = () => {
    apply(next)
    // Picking the system's own theme clears the override, so the page goes back to following the system.
    try {
      if (next === system()) localStorage.removeItem(THEME_KEY)
      else localStorage.setItem(THEME_KEY, next)
    } catch {}
    setTheme(next)
  }

  return (
    <button type="button" onClick={toggle} aria-label={`Switch to ${next} mode`} title={`Switch to ${next} mode`}
      className="inline-flex size-9 items-center justify-center rounded-[10px] bg-soft text-foreground transition-colors hover:text-heat [&_svg]:size-4">
      {theme === 'dark' ? <SunIcon /> : <MoonIcon />}
    </button>
  )
}
