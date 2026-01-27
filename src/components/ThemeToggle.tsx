import { Moon, Sun, Monitor } from "lucide-react"
import { useTheme, type Theme } from "@/hooks/use-theme"
import { Button } from "@/components/ui/button"
import {
	DropdownMenu,
	DropdownMenuContent,
	DropdownMenuItem,
	DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"

export function ThemeToggle() {
	const { theme, setTheme, resolvedTheme } = useTheme()

	const themes: { value: Theme; label: string; icon: typeof Sun }[] = [
		{ value: "light", label: "Light", icon: Sun },
		{ value: "dark", label: "Dark", icon: Moon },
		{ value: "system", label: "System", icon: Monitor },
	]

	const currentIcon =
		theme === "system" ? Monitor : resolvedTheme === "dark" ? Moon : Sun

	const CurrentIcon = currentIcon

	return (
		<DropdownMenu>
			<DropdownMenuTrigger asChild>
				<Button
					variant="ghost"
					size="icon"
					className="h-9 w-9 text-muted-foreground hover:text-foreground hover:bg-muted"
					aria-label="Toggle theme"
				>
					<CurrentIcon className="h-5 w-5" />
				</Button>
			</DropdownMenuTrigger>
			<DropdownMenuContent align="end">
				{themes.map(({ value, label, icon: Icon }) => (
					<DropdownMenuItem
						key={value}
						onClick={() => setTheme(value)}
						className={theme === value ? "bg-accent" : ""}
					>
						<Icon className="mr-2 h-4 w-4" />
						{label}
					</DropdownMenuItem>
				))}
			</DropdownMenuContent>
		</DropdownMenu>
	)
}

// Simple toggle version (just light/dark)
export function ThemeToggleSimple() {
	const { resolvedTheme, setTheme } = useTheme()

	const toggleTheme = () => {
		setTheme(resolvedTheme === "dark" ? "light" : "dark")
	}

	return (
		<Button
			variant="ghost"
			size="icon"
			onClick={toggleTheme}
			className="h-9 w-9 text-muted-foreground hover:text-foreground hover:bg-muted"
			aria-label="Toggle theme"
		>
			{resolvedTheme === "dark" ? (
				<Sun className="h-5 w-5" />
			) : (
				<Moon className="h-5 w-5" />
			)}
		</Button>
	)
}
