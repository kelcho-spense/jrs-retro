import { createFileRoute } from "@tanstack/react-router"

export const Route = createFileRoute("/retros/$retroId")({
	component: RetroDetailPage,
})

function RetroDetailPage() {
	const { retroId } = Route.useParams()

	return (
		<div className="space-y-6">
			<h1 className="text-3xl font-bold tracking-tight">
				Retrospective: {retroId}
			</h1>
			<p className="text-muted-foreground">
				Retro detail view coming soon...
			</p>
		</div>
	)
}
