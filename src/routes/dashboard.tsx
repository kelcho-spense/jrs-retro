import { createFileRoute, Link, Outlet, redirect, useRouterState } from "@tanstack/react-router"
import { User, Shield, Monitor, Settings } from "lucide-react"

import {
	Card,
	CardContent,
	CardDescription,
	CardHeader,
	CardTitle,
} from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { getCurrentUser } from "@/lib/api/users"

export const Route = createFileRoute("/dashboard")({
	beforeLoad: async () => {
		const user = await getCurrentUser()

		if (!user) {
			throw redirect({ to: "/sign-in" })
		}

		if (user.status !== "approved") {
			throw redirect({ to: "/sign-in" })
		}

		return { user }
	},
	component: DashboardLayout,
})

const navItems = [
	{
		title: "Profile",
		href: "/dashboard/profile",
		icon: User,
		description: "Manage your account details",
	},
	{
		title: "Security",
		href: "/dashboard/security",
		icon: Shield,
		description: "Password and security settings",
	},
	{
		title: "Sessions",
		href: "/dashboard/sessions",
		icon: Monitor,
		description: "Manage active sessions",
	},
	{
		title: "Settings",
		href: "/dashboard/settings",
		icon: Settings,
		description: "App preferences",
	},
]

function DashboardLayout() {
	const routerState = useRouterState()
	const currentPath = routerState.location.pathname

	const isActive = (href: string) => currentPath === href

	// If at /dashboard root, show the nav grid
	if (currentPath === "/dashboard") {
		return (
			<div className="space-y-6">
				<div>
					<h1 className="text-3xl font-bold tracking-tight">Account Settings</h1>
					<p className="text-muted-foreground">
						Manage your account settings and preferences
					</p>
				</div>

				<div className="grid gap-4 md:grid-cols-2">
					{navItems.map((item) => (
						<Link key={item.href} to={item.href}>
							<Card className="hover:border-primary/50 transition-colors cursor-pointer h-full">
								<CardHeader>
									<CardTitle className="flex items-center gap-2">
										<item.icon className="h-5 w-5" />
										{item.title}
									</CardTitle>
									<CardDescription>{item.description}</CardDescription>
								</CardHeader>
							</Card>
						</Link>
					))}
				</div>
			</div>
		)
	}

	// Show sidebar nav for child routes
	return (
		<div className="flex gap-6">
			{/* Sidebar Navigation */}
			<aside className="hidden md:block w-64 shrink-0">
				<nav className="space-y-1">
					{navItems.map((item) => (
						<Button
							key={item.href}
							variant={isActive(item.href) ? "secondary" : "ghost"}
							className="w-full justify-start"
							asChild
						>
							<Link to={item.href}>
								<item.icon className="mr-2 h-4 w-4" />
								{item.title}
							</Link>
						</Button>
					))}
				</nav>
			</aside>

			{/* Main Content */}
			<div className="flex-1 min-w-0">
				<Outlet />
			</div>
		</div>
	)
}
