import { createFileRoute } from "@tanstack/react-router"
import { FileText } from "lucide-react"

import {
	Card,
	CardContent,
	CardDescription,
	CardHeader,
	CardTitle,
} from "@/components/ui/card"
import { getTemplates } from "@/lib/api/retros"

export const Route = createFileRoute("/templates")({
	loader: async () => {
		const templates = await getTemplates()
		return { templates }
	},
	component: TemplatesPage,
})

function TemplatesPage() {
	const { templates } = Route.useLoaderData()

	return (
		<div className="space-y-6">
			<div>
				<h1 className="text-3xl font-bold tracking-tight">Templates</h1>
				<p className="text-muted-foreground">
					Browse and manage retrospective templates
				</p>
			</div>

			{templates.length === 0 ? (
				<Card className="border-dashed">
					<CardContent className="flex flex-col items-center justify-center py-12">
						<FileText className="h-12 w-12 text-muted-foreground mb-4" />
						<CardTitle className="mb-2">No templates available</CardTitle>
						<CardDescription className="text-center">
							Templates will appear here once they are created.
						</CardDescription>
					</CardContent>
				</Card>
			) : (
				<div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
					{templates.map((template) => (
						<Card key={template.id}>
							<CardHeader>
								<div className="flex items-center justify-between">
									<CardTitle>{template.name}</CardTitle>
									{template.isBuiltIn && (
										<span className="text-xs bg-primary/10 text-primary px-2 py-0.5 rounded-full">
											Built-in
										</span>
									)}
								</div>
								<CardDescription>{template.description}</CardDescription>
							</CardHeader>
							<CardContent>
								<div className="flex flex-wrap gap-2">
									{template.columns.map((col) => (
										<div
											key={col.id}
											className="flex items-center gap-1 rounded-full bg-muted px-2.5 py-1 text-xs"
										>
											<span>{col.emoji}</span>
											<span>{col.name}</span>
										</div>
									))}
								</div>
							</CardContent>
						</Card>
					))}
				</div>
			)}
		</div>
	)
}
