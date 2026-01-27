import { createFileRoute, Link, redirect } from "@tanstack/react-router"
import { Plus, History, Users, MessageSquare, ThumbsUp } from "lucide-react"

import { Button } from "@/components/ui/button"
import {
	Card,
	CardContent,
	CardDescription,
	CardHeader,
	CardTitle,
} from "@/components/ui/card"
import { getRecentRetros, getDashboardStats } from "@/lib/api/retros"
import { getCurrentUser } from "@/lib/api/users"

export const Route = createFileRoute("/")({
	beforeLoad: async () => {
		const user = await getCurrentUser()

		if (!user) {
			// Use type assertion since route exists
			throw redirect({ to: "/sign-in" as const })
		}

		// Check user status
		if (user.status === "pending") {
			throw redirect({ to: "/sign-in" as const, search: { pending: "true" } })
		}
		if (user.status === "rejected") {
			throw redirect({ to: "/sign-in" as const, search: { rejected: "true" } })
		}
		if (user.status === "suspended") {
			throw redirect({ to: "/sign-in" as const, search: { suspended: "true" } })
		}

		return { user }
	},
	loader: async () => {
		const [retros, stats] = await Promise.all([
			getRecentRetros(),
			getDashboardStats(),
		])
		return { retros, stats }
	},
	component: DashboardPage,
})

function DashboardPage() {
	const { retros, stats } = Route.useLoaderData()

	return (
		<div className="space-y-8">
			{/* Header */}
			<div className="flex items-center justify-between">
				<div>
					<h1 className="text-3xl font-bold tracking-tight">Dashboard</h1>
					<p className="text-muted-foreground">
						Welcome back! Here's what's happening with your team.
					</p>
				</div>
				<Button asChild>
					<Link to="/retros/new">
						<Plus className="mr-2 h-4 w-4" />
						New Retrospective
					</Link>
				</Button>
			</div>

			{/* Stats Grid */}
			<div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
				<Card>
					<CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
						<CardTitle className="text-sm font-medium">
							Total Retrospectives
						</CardTitle>
						<History className="h-4 w-4 text-muted-foreground" />
					</CardHeader>
					<CardContent>
						<div className="text-2xl font-bold">{stats.totalRetros}</div>
						<p className="text-xs text-muted-foreground">
							Completed sessions
						</p>
					</CardContent>
				</Card>
				<Card>
					<CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
						<CardTitle className="text-sm font-medium">Teams</CardTitle>
						<Users className="h-4 w-4 text-muted-foreground" />
					</CardHeader>
					<CardContent>
						<div className="text-2xl font-bold">{stats.totalTeams}</div>
						<p className="text-xs text-muted-foreground">Active teams</p>
					</CardContent>
				</Card>
				<Card>
					<CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
						<CardTitle className="text-sm font-medium">Cards Created</CardTitle>
						<MessageSquare className="h-4 w-4 text-muted-foreground" />
					</CardHeader>
					<CardContent>
						<div className="text-2xl font-bold">{stats.totalCards}</div>
						<p className="text-xs text-muted-foreground">
							Feedback items shared
						</p>
					</CardContent>
				</Card>
				<Card>
					<CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
						<CardTitle className="text-sm font-medium">Votes Cast</CardTitle>
						<ThumbsUp className="h-4 w-4 text-muted-foreground" />
					</CardHeader>
					<CardContent>
						<div className="text-2xl font-bold">{stats.totalVotes}</div>
						<p className="text-xs text-muted-foreground">
							Community engagement
						</p>
					</CardContent>
				</Card>
			</div>

			{/* Recent Retrospectives */}
			<div>
				<div className="flex items-center justify-between mb-4">
					<h2 className="text-xl font-semibold">Recent Retrospectives</h2>
					<Button variant="outline" size="sm" asChild>
						<Link to="/retros">View all</Link>
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
							<Card key={retro.id} className="hover:border-primary/50 transition-colors">
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
