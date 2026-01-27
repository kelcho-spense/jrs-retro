import { useState, useEffect, useCallback, type ReactNode } from 'react'
import {
    ThemeContext,
    type Theme,
    resolveTheme,
    applyTheme,
} from '@/hooks/use-theme'

interface ThemeProviderProps {
    children: ReactNode
    defaultTheme?: Theme
    storageKey?: string
}

export function ThemeProvider({
    children,
    defaultTheme = 'system',
    storageKey = 'theme',
}: ThemeProviderProps) {
    const [theme, setThemeState] = useState<Theme>(() => {
        // Get initial theme from localStorage or default
        if (typeof window === 'undefined') return defaultTheme
        const stored = localStorage.getItem(storageKey) as Theme | null
        if (stored && ['light', 'dark', 'system'].includes(stored)) {
            return stored
        }
        return defaultTheme
    })

    const [resolvedTheme, setResolvedTheme] = useState<'light' | 'dark'>(() =>
        resolveTheme(theme)
    )

    // Update resolved theme when theme changes or system preference changes
    useEffect(() => {
        const resolved = resolveTheme(theme)
        setResolvedTheme(resolved)
        applyTheme(resolved)
    }, [theme])

    // Listen for system theme changes when in 'system' mode
    useEffect(() => {
        if (theme !== 'system') return

        const mediaQuery = window.matchMedia('(prefers-color-scheme: dark)')

        const handleChange = (e: MediaQueryListEvent) => {
            const resolved = e.matches ? 'dark' : 'light'
            setResolvedTheme(resolved)
            applyTheme(resolved)
        }

        mediaQuery.addEventListener('change', handleChange)
        return () => mediaQuery.removeEventListener('change', handleChange)
    }, [theme])

    const setTheme = useCallback((newTheme: Theme) => {
        localStorage.setItem(storageKey, newTheme)
        setThemeState(newTheme)
    }, [storageKey])

    return (
        <ThemeContext.Provider value={{ theme, resolvedTheme, setTheme }}>
            {children}
        </ThemeContext.Provider>
    )
}
