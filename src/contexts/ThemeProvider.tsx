import React, { useEffect, useMemo } from 'react'
import { useKV } from '@/lib/useKV'
import { ThemeContext, Theme } from './theme-core'

let darkModeCleaned = false

export function ThemeProvider({ children }: Readonly<{ children: React.ReactNode }>) {
  // CRITICAL FIX: Force light mode initialization and cleanup (only once)
  if (!darkModeCleaned && typeof window !== 'undefined') {
    darkModeCleaned = true
    try {
      // Always force light mode on init
      window.localStorage.setItem('theme-preference', '"light"')
      // Force remove dark attributes immediately
      document.documentElement.classList.remove('dark')
      document.body.classList.remove('dark')
      document.documentElement.removeAttribute('data-appearance')
      document.body.removeAttribute('data-appearance')
      document.documentElement.dataset.theme = 'light'
      document.body.dataset.theme = 'light'
    } catch {
      // noop
    }
  }

  const [theme, setTheme] = useKV<Theme>('theme-preference', 'light')

  // Calculate effective theme
  const effectiveTheme = useMemo(() => {
    if (theme !== 'system') return theme
    return globalThis.matchMedia('(prefers-color-scheme: dark)').matches ? 'dark' : 'light'
  }, [theme])
  const isDark = effectiveTheme === 'dark'

  // Apply theme to document
  useEffect(() => {
    const root = document.documentElement

    // Set data-appearance attribute for Tailwind (tailwind.config.js uses [data-appearance="dark"])
    if (effectiveTheme === 'dark') {
      root.setAttribute('data-appearance', 'dark')
      document.body.setAttribute('data-appearance', 'dark')
    } else {
      root.removeAttribute('data-appearance')
      document.body.removeAttribute('data-appearance')
    }

    // Also keep data-theme for backwards compatibility
    root.dataset.theme = effectiveTheme
    if (effectiveTheme === 'dark') {
      document.body.dataset.theme = 'dark'
    } else {
      delete document.body.dataset.theme
    }
  }, [effectiveTheme])

  // Listen for system theme changes
  useEffect(() => {
    if (theme !== 'system') return

    const mediaQuery = globalThis.matchMedia('(prefers-color-scheme: dark)')
    const handleChange = () => {
      const systemTheme = mediaQuery.matches ? 'dark' : 'light'
      document.documentElement.dataset.theme = systemTheme

      if (systemTheme === 'dark') {
        document.documentElement.setAttribute('data-appearance', 'dark')
        document.body.setAttribute('data-appearance', 'dark')
        document.body.dataset.theme = 'dark'
      } else {
        document.documentElement.removeAttribute('data-appearance')
        document.body.removeAttribute('data-appearance')
        delete document.body.dataset.theme
      }
    }

    mediaQuery.addEventListener('change', handleChange)
    return () => mediaQuery.removeEventListener('change', handleChange)
  }, [theme])

  const value = useMemo(() => ({ theme, setTheme, isDark }), [theme, setTheme, isDark])
  return (
    <ThemeContext.Provider value={value}>
      {children}
    </ThemeContext.Provider>
  )
}
