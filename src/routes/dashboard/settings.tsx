import { createFileRoute } from "@tanstack/react-router"
import { Settings, Bell, Moon, Sun, Monitor, Palette } from "lucide-react"

import {
	Card,
	CardContent,
	CardDescription,
	CardHeader,
	CardTitle,
} from "@/components/ui/card"
import { Label } from "@/components/ui/label"
import { Switch } from "@/components/ui/switch"
import { getCurrentUser } from "@/lib/api/users"
import { useTheme, type Theme } from "@/hooks/use-theme"

export const Route = createFileRoute("/dashboard/settings")({
	loader: async () => {
		const user = await getCurrentUser()
		return { user }
	},
	component: SettingsPage,
})

const themeOptions: { value: Theme; label: string; icon: typeof Sun }[] = [
	{ value: "light", label: "Light", icon: Sun },
	{ value: "dark", label: "Dark", icon: Moon },
	{ value: "system", label: "System", icon: Monitor },
]

function SettingsPage() {
	const { theme, setTheme } = useTheme()

	return (
		<div className="space-y-6">
			<div>
				<h2 className="text-2xl font-bold tracking-tight">Settings</h2>
				<p className="text-muted-foreground">
					Manage your application preferences
				</p>
			</div>

			
			{/* Notifications */}
			<Card>
				<CardHeader>
					<CardTitle className="flex items-center gap-2">
						<Bell className="h-5 w-5" />
						Notifications
					</CardTitle>
					<CardDescription>
						Configure how you receive notifications
					</CardDescription>
				</CardHeader>
				<CardContent className="space-y-4">
					<div className="flex items-center justify-between">
						<div className="space-y-0.5">
							<Label>Email notifications</Label>
							<p className="text-sm text-muted-foreground">
								Receive email updates about team activity
							</p>
						</div>
						<Switch defaultChecked />
					</div>
					<div className="flex items-center justify-between">
						<div className="space-y-0.5">
							<Label>Retrospective reminders</Label>
							<p className="text-sm text-muted-foreground">
								Get reminded about upcoming retrospectives
							</p>
						</div>
						<Switch defaultChecked />
					</div>
					<div className="flex items-center justify-between">
						<div className="space-y-0.5">
							<Label>Weekly digest</Label>
							<p className="text-sm text-muted-foreground">
								Receive a weekly summary of team activities
							</p>
						</div>
						<Switch />
					</div>
				</CardContent>
			</Card>

			{/* Privacy */}
			<Card>
				<CardHeader>
					<CardTitle className="flex items-center gap-2">
						<Settings className="h-5 w-5" />
						Privacy
					</CardTitle>
					<CardDescription>
						Control your privacy settings
					</CardDescription>
				</CardHeader>
				<CardContent className="space-y-4">
					<div className="flex items-center justify-between">
						<div className="space-y-0.5">
							<Label>Show profile to team members</Label>
							<p className="text-sm text-muted-foreground">
								Allow team members to view your profile details
							</p>
						</div>
						<Switch defaultChecked />
					</div>
					<div className="flex items-center justify-between">
						<div className="space-y-0.5">
							<Label>Anonymous by default</Label>
							<p className="text-sm text-muted-foreground">
								Post cards anonymously by default in retrospectives
							</p>
						</div>
						<Switch />
					</div>
				</CardContent>
			</Card>
		</div>
	)
}
