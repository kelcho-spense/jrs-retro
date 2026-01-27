import { Moon, Sun, Monitor } from 'lucide-react'
import { useTheme, type Theme } from '@/hooks/use-theme'
import { Button } from '@/components/ui/button'
import { useState, useRef, useEffect } from 'react'

export function ThemeToggle() {
    const { theme, setTheme, resolvedTheme } = useTheme()
    const [isOpen, setIsOpen] = useState(false)
    const dropdownRef = useRef<HTMLDivElement>(null)

    // Close dropdown when clicking outside
    useEffect(() => {
        function handleClickOutside(event: MouseEvent) {
            if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
                setIsOpen(false)
            }
        }

        document.addEventListener('mousedown', handleClickOutside)
        return () => document.removeEventListener('mousedown', handleClickOutside)
    }, [])

    const themes: { value: Theme; label: string; icon: typeof Sun }[] = [
        { value: 'light', label: 'Light', icon: Sun },
        { value: 'dark', label: 'Dark', icon: Moon },
        { value: 'system', label: 'System', icon: Monitor },
    ]

    const currentIcon = theme === 'system'
        ? Monitor
        : resolvedTheme === 'dark'
            ? Moon
            : Sun

    const CurrentIcon = currentIcon

    return (
        <div className="relative" ref={dropdownRef}>
            <Button
                variant="ghost"
                size="icon"
                onClick={() => setIsOpen(!isOpen)}
                className="h-9 w-9 text-muted-foreground hover:text-foreground hover:bg-muted"
                aria-label="Toggle theme"
            >
                <CurrentIcon className="h-5 w-5" />
            </Button>

            {isOpen && (
                <div className="absolute right-0 mt-2 w-36 rounded-lg border border-border bg-popover text-popover-foreground shadow-lg z-50">
                    <div className="p-1">
                        {themes.map(({ value, label, icon: Icon }) => (
                            <button
                                key={value}
                                onClick={() => {
                                    setTheme(value)
                                    setIsOpen(false)
                                }}
                                className={`w-full flex items-center gap-2 px-3 py-2 text-sm rounded-md transition-colors ${theme === value
                                        ? 'bg-cyan-600 text-white'
                                        : 'text-muted-foreground hover:bg-muted hover:text-foreground'
                                    }`}
                            >
                                <Icon className="h-4 w-4" />
                                {label}
                            </button>
                        ))}
                    </div>
                </div>
            )}
        </div>
    )
}

// Simple toggle version (just light/dark)
export function ThemeToggleSimple() {
    const { resolvedTheme, setTheme } = useTheme()

    const toggleTheme = () => {
        setTheme(resolvedTheme === 'dark' ? 'light' : 'dark')
    }

    return (
        <Button
            variant="ghost"
            size="icon"
            onClick={toggleTheme}
            className="h-9 w-9 text-muted-foreground hover:text-foreground hover:bg-muted"
            aria-label="Toggle theme"
        >
            {resolvedTheme === 'dark' ? (
                <Sun className="h-5 w-5" />
            ) : (
                <Moon className="h-5 w-5" />
            )}
        </Button>
    )
}
