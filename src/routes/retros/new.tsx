import { createFileRoute, Link } from "@tanstack/react-router"
import { ArrowLeft } from "lucide-react"

import { Button } from "@/components/ui/button"
import {
	Card,
	CardContent,
	CardDescription,
	CardHeader,
	CardTitle,
} from "@/components/ui/card"
import { getTemplates } from "@/lib/api/retros"

export const Route = createFileRoute("/retros/new")({
	loader: async () => {
		const templates = await getTemplates()
		return { templates }
	},
	component: NewRetroPage,
})

function NewRetroPage() {
	const { templates } = Route.useLoaderData()

	return (
		<div className="space-y-6">
			<div className="flex items-center gap-4">
				<Button variant="ghost" size="icon" asChild>
					<Link to="/retros">
						<ArrowLeft className="h-4 w-4" />
					</Link>
				</Button>
				<div>
					<h1 className="text-3xl font-bold tracking-tight">
						New Retrospective
					</h1>
					<p className="text-muted-foreground">
						Choose a template to start your retrospective
					</p>
				</div>
			</div>

			<div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
				{templates.map((template) => (
					<Card
						key={template.id}
						className="cursor-pointer hover:border-primary/50 transition-colors"
					>
						<CardHeader>
							<CardTitle>{template.name}</CardTitle>
							<CardDescription>{template.description}</CardDescription>
						</CardHeader>
						<CardContent>
							<div className="flex flex-wrap gap-2">
								{template.columns.map((col) => (
									<span
										key={col.id}
										className="inline-flex items-center gap-1 rounded-full bg-muted px-2.5 py-0.5 text-xs"
									>
										{col.emoji} {col.name}
									</span>
								))}
							</div>
						</CardContent>
					</Card>
				))}
			</div>
		</div>
	)
}
