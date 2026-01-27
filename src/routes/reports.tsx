import { createFileRoute } from "@tanstack/react-router"
import { BarChart3 } from "lucide-react"

import { Card, CardContent, CardTitle } from "@/components/ui/card"

export const Route = createFileRoute("/reports")({
	component: ReportsPage,
})

function ReportsPage() {
	return (
		<div className="space-y-6">
			<div>
				<h1 className="text-3xl font-bold tracking-tight">Reports</h1>
				<p className="text-muted-foreground">
					Analytics and insights from your retrospectives
				</p>
			</div>

			<Card className="border-dashed">
				<CardContent className="flex flex-col items-center justify-center py-12">
					<BarChart3 className="h-12 w-12 text-muted-foreground mb-4" />
					<CardTitle className="mb-2">Coming Soon</CardTitle>
					<p className="text-muted-foreground text-center">
						Reports and analytics will be available here once you have some
						completed retrospectives.
					</p>
				</CardContent>
			</Card>
		</div>
	)
}
