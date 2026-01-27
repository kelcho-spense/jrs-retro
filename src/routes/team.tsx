import { createFileRoute } from "@tanstack/react-router"
import { Users } from "lucide-react"

import { Card, CardContent, CardTitle } from "@/components/ui/card"

export const Route = createFileRoute("/team")({
	component: TeamPage,
})

function TeamPage() {
	return (
		<div className="space-y-6">
			<div>
				<h1 className="text-3xl font-bold tracking-tight">My Team</h1>
				<p className="text-muted-foreground">
					Manage your team members and roles
				</p>
			</div>

			<Card className="border-dashed">
				<CardContent className="flex flex-col items-center justify-center py-12">
					<Users className="h-12 w-12 text-muted-foreground mb-4" />
					<CardTitle className="mb-2">No team yet</CardTitle>
					<p className="text-muted-foreground text-center">
						Create or join a team to start collaborating on retrospectives.
					</p>
				</CardContent>
			</Card>
		</div>
	)
}
