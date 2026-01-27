import { createFileRoute, Link } from "@tanstack/react-router"
import { Plus, History } from "lucide-react"

import { Button } from "@/components/ui/button"
import {
	Card,
	CardContent,
	CardDescription,
	CardHeader,
	CardTitle,
} from "@/components/ui/card"
import { getRecentRetros } from "@/lib/api/retros"

export const Route = createFileRoute("/retros/")({
	loader: async () => {
		const retros = await getRecentRetros()
		return { retros }
	},
	component: RetrosPage,
})

function RetrosPage() {
	const { retros } = Route.useLoaderData()

	return (
		<div className="space-y-6">
			<div className="flex items-center justify-between">
				<div>
					<h1 className="text-3xl font-bold tracking-tight">Retrospectives</h1>
					<p className="text-muted-foreground">
						View and manage your team retrospectives
					</p>
				</div>
				<Button asChild>
					<Link to="/retros/new">
						<Plus className="mr-2 h-4 w-4" />
						New Retrospective
					</Link>
				</Button>
			</div>

			{retros.length === 0 ? (
				<Card className="border-dashed">
					<CardContent className="flex flex-col items-center justify-center py-12">
						<History className="h-12 w-12 text-muted-foreground mb-4" />
						<CardTitle className="mb-2">No retrospectives yet</CardTitle>
						<CardDescription className="text-center mb-4">
							Start your first retrospective to gather feedback from your team.
						</CardDescription>
						<Button asChild>
							<Link to="/retros/new">
								<Plus className="mr-2 h-4 w-4" />
								Create your first retro
							</Link>
						</Button>
					</CardContent>
				</Card>
			) : (
				<div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
					{retros.map((retro) => (
						<Card
							key={retro.id}
							className="hover:border-primary/50 transition-colors"
						>
							<Link to="/retros/$retroId" params={{ retroId: retro.id }}>
								<CardHeader>
									<div className="flex items-center gap-2 mb-2">
										<span className="text-lg">{retro.teamEmoji}</span>
										<span className="text-sm text-muted-foreground">
											{retro.teamName}
										</span>
									</div>
									<CardTitle className="text-lg">{retro.name}</CardTitle>
									<CardDescription>{retro.templateName}</CardDescription>
								</CardHeader>
								<CardContent>
									<div className="flex items-center justify-between text-sm">
										<StatusBadge status={retro.status} />
										<span className="text-muted-foreground">
											{new Date(retro.createdAt).toLocaleDateString()}
										</span>
									</div>
								</CardContent>
							</Link>
						</Card>
					))}
				</div>
			)}
		</div>
	)
}

function StatusBadge({ status }: { status: string }) {
	const statusStyles = {
		draft: "bg-gray-100 text-gray-700",
		active: "bg-blue-100 text-blue-700",
		voting: "bg-amber-100 text-amber-700",
		completed: "bg-green-100 text-green-700",
	}

	return (
		<span
			className={`inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-medium ${statusStyles[status as keyof typeof statusStyles] ?? statusStyles.draft}`}
		>
			{status.charAt(0).toUpperCase() + status.slice(1)}
		</span>
	)
}
