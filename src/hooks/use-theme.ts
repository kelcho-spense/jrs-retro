import { createContext, useContext } from "react"

export type Theme = "light" | "dark" | "system"

export interface ThemeContextType {
	theme: Theme
	resolvedTheme: "light" | "dark"
	setTheme: (theme: Theme) => void
}

export const ThemeContext = createContext<ThemeContextType | undefined>(
	undefined
)

export function useTheme() {
	const context = useContext(ThemeContext)
	if (context === undefined) {
		throw new Error("useTheme must be used within a ThemeProvider")
	}
	return context
}

// Helper to get the initial theme from localStorage or system preference
export function getInitialTheme(): Theme {
	if (typeof window === "undefined") return "system"

	const stored = localStorage.getItem("theme") as Theme | null
	if (stored && ["light", "dark", "system"].includes(stored)) {
		return stored
	}
	return "system"
}

// Helper to resolve 'system' theme to actual light/dark
export function resolveTheme(theme: Theme): "light" | "dark" {
	if (theme === "system") {
		if (typeof window === "undefined") return "light"
		return window.matchMedia("(prefers-color-scheme: dark)").matches
			? "dark"
			: "light"
	}
	return theme
}

// Apply theme to document
export function applyTheme(theme: "light" | "dark") {
	const root = document.documentElement
	root.classList.remove("light", "dark")
	root.classList.add(theme)
}
