import { createFileRoute } from "@tanstack/react-router"
import { Settings as SettingsIcon } from "lucide-react"

import { Card, CardContent, CardTitle } from "@/components/ui/card"

export const Route = createFileRoute("/settings")({
	component: SettingsPage,
})

function SettingsPage() {
	return (
		<div className="space-y-6">
			<div>
				<h1 className="text-3xl font-bold tracking-tight">Settings</h1>
				<p className="text-muted-foreground">
					Manage your account and preferences
				</p>
			</div>

			<Card className="border-dashed">
				<CardContent className="flex flex-col items-center justify-center py-12">
					<SettingsIcon className="h-12 w-12 text-muted-foreground mb-4" />
					<CardTitle className="mb-2">Settings Coming Soon</CardTitle>
					<p className="text-muted-foreground text-center">
						Account settings and preferences will be available here.
					</p>
				</CardContent>
			</Card>
		</div>
	)
}
