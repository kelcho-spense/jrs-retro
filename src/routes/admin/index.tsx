import { createFileRoute, Link } from "@tanstack/react-router"
import {
	Users,
	UserCheck,
	Clock,
	UserX,
	Ban,
	Shield,
	TrendingUp,
	ArrowRight,
	Activity,
} from "lucide-react"

import { Button } from "@/components/ui/button"
import {
	Card,
	CardContent,
	CardDescription,
	CardHeader,
	CardTitle,
} from "@/components/ui/card"
import { getAllUsers, getAdminActionLog } from "@/lib/api/users"

export const Route = createFileRoute("/admin/")({
	loader: async () => {
		const [users, recentActions] = await Promise.all([
			getAllUsers({ data: undefined }),
			getAdminActionLog({ data: { limit: 5 } }),
		])

		// Calculate stats
		const stats = {
			total: users.length,
			approved: users.filter((u) => u.status === "approved").length,
			pending: users.filter((u) => u.status === "pending").length,
			rejected: users.filter((u) => u.status === "rejected").length,
			suspended: users.filter((u) => u.status === "suspended").length,
			admins: users.filter((u) => u.role === "admin").length,
		}

		return { stats, recentActions }
	},
	component: AdminDashboardPage,
})

function AdminDashboardPage() {
	const { stats, recentActions } = Route.useLoaderData()

	const statCards = [
		{
			title: "Total Users",
			value: stats.total,
			icon: Users,
			description: "All registered users",
			color: "text-blue-600 bg-blue-100 dark:text-blue-400 dark:bg-blue-900/20",
		},
		{
			title: "Approved",
			value: stats.approved,
			icon: UserCheck,
			description: "Active approved users",
			color: "text-green-600 bg-green-100 dark:text-green-400 dark:bg-green-900/20",
		},
		{
			title: "Pending",
			value: stats.pending,
			icon: Clock,
			description: "Awaiting approval",
			color: "text-yellow-600 bg-yellow-100 dark:text-yellow-400 dark:bg-yellow-900/20",
		},
		{
			title: "Rejected",
			value: stats.rejected,
			icon: UserX,
			description: "Denied access",
			color: "text-red-600 bg-red-100 dark:text-red-400 dark:bg-red-900/20",
		},
		{
			title: "Suspended",
			value: stats.suspended,
			icon: Ban,
			description: "Temporarily disabled",
			color: "text-orange-600 bg-orange-100 dark:text-orange-400 dark:bg-orange-900/20",
		},
		{
			title: "Admins",
			value: stats.admins,
			icon: Shield,
			description: "Administrator accounts",
			color: "text-purple-600 bg-purple-100 dark:text-purple-400 dark:bg-purple-900/20",
		},
	]

	const getActionIcon = (action: string) => {
		if (action.includes("approved")) return UserCheck
		if (action.includes("rejected")) return UserX
		if (action.includes("suspended")) return Ban
		if (action.includes("reactivated")) return Activity
		return Users
	}

	return (
		<div className="space-y-6">
			<div>
				<h2 className="text-2xl font-bold tracking-tight">Dashboard</h2>
				<p className="text-muted-foreground">
					Overview of system users and recent activity
				</p>
			</div>

			{/* Stats Grid */}
			<div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
				{statCards.map((stat) => (
					<Card key={stat.title}>
						<CardHeader className="flex flex-row items-center justify-between pb-2">
							<CardTitle className="text-sm font-medium">{stat.title}</CardTitle>
							<div className={`rounded-lg p-2 ${stat.color}`}>
								<stat.icon className="h-4 w-4" />
							</div>
						</CardHeader>
						<CardContent>
							<div className="text-3xl font-bold">{stat.value}</div>
							<p className="text-xs text-muted-foreground">{stat.description}</p>
						</CardContent>
					</Card>
				))}
			</div>

			{/* Quick Actions & Recent Activity */}
			<div className="grid gap-6 lg:grid-cols-2">
				{/* Quick Actions */}
				<Card>
					<CardHeader>
						<CardTitle className="flex items-center gap-2">
							<TrendingUp className="h-5 w-5" />
							Quick Actions
						</CardTitle>
						<CardDescription>Common administrative tasks</CardDescription>
					</CardHeader>
					<CardContent className="space-y-3">
						{stats.pending > 0 && (
							<Button asChild className="w-full justify-between" variant="outline">
								<Link to="/admin/users" search={{ status: "pending" }}>
									<span className="flex items-center gap-2">
										<Clock className="h-4 w-4" />
										Review {stats.pending} pending user
										{stats.pending > 1 ? "s" : ""}
									</span>
									<ArrowRight className="h-4 w-4" />
								</Link>
							</Button>
						)}
						<Button asChild className="w-full justify-between" variant="outline">
							<Link to="/admin/users">
								<span className="flex items-center gap-2">
									<Users className="h-4 w-4" />
									Manage All Users
								</span>
								<ArrowRight className="h-4 w-4" />
							</Link>
						</Button>
					</CardContent>
				</Card>

				{/* Recent Activity */}
				<Card>
					<CardHeader>
						<CardTitle className="flex items-center gap-2">
							<Activity className="h-5 w-5" />
							Recent Activity
						</CardTitle>
						<CardDescription>Latest administrative actions</CardDescription>
					</CardHeader>
					<CardContent>
						{recentActions.length === 0 ? (
							<p className="text-sm text-muted-foreground">No recent activity</p>
						) : (
							<div className="space-y-4">
								{recentActions.map((action: { id: string; action: string; performedAt: Date | string }) => {
									const ActionIcon = getActionIcon(action.action)
									return (
										<div
											key={action.id}
											className="flex items-start gap-3 text-sm"
										>
											<div className="rounded-full bg-muted p-1.5">
												<ActionIcon className="h-3 w-3" />
											</div>
											<div className="flex-1 space-y-1">
												<p>{action.action}</p>
												<p className="text-xs text-muted-foreground">
													{new Date(action.performedAt).toLocaleString()}
												</p>
											</div>
										</div>
									)
								})}
							</div>
						)}
					</CardContent>
				</Card>
			</div>
		</div>
	)
}
