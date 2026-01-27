import { createFileRoute, redirect, Outlet, Link, useLocation } from "@tanstack/react-router"
import { getCurrentUser } from "@/lib/api/users"
import { Users, LayoutDashboard, Shield } from "lucide-react"
import { cn } from "@/lib/utils"

export const Route = createFileRoute("/admin")({
	beforeLoad: async () => {
		const user = await getCurrentUser()

		if (!user) {
			throw redirect({
				to: "/sign-in",
			})
		}

		if (user.role !== "admin") {
			throw redirect({
				to: "/",
			})
		}

		return { user }
	},
	component: AdminLayout,
})

const adminNavItems = [
	{
		title: "Dashboard",
		href: "/admin",
		icon: LayoutDashboard,
	},
	{
		title: "Users",
		href: "/admin/users",
		icon: Users,
	},
]

function AdminLayout() {
	const location = useLocation()

	return (
		<div className="container mx-auto py-6">
			<div className="mb-6 flex items-center gap-3">
				<div className="rounded-lg bg-primary p-2">
					<Shield className="h-6 w-6 text-primary-foreground" />
				</div>
				<div>
					<h1 className="text-2xl font-bold">Admin Panel</h1>
					<p className="text-sm text-muted-foreground">
						Manage users, settings, and system configuration
					</p>
				</div>
			</div>

			<div className="flex gap-6">
				{/* Sidebar Navigation */}
				<nav className="w-48 shrink-0 space-y-1">
					{adminNavItems.map((item) => {
						const isActive =
							item.href === "/admin"
								? location.pathname === "/admin"
								: location.pathname.startsWith(item.href)

						return (
							<Link
								key={item.href}
								to={item.href}
								className={cn(
									"flex items-center gap-3 rounded-lg px-3 py-2 text-sm transition-colors",
									isActive
										? "bg-primary text-primary-foreground"
										: "text-muted-foreground hover:bg-muted hover:text-foreground"
								)}
							>
								<item.icon className="h-4 w-4" />
								{item.title}
							</Link>
						)
					})}
				</nav>

				{/* Main Content */}
				<main className="flex-1">
					<Outlet />
				</main>
			</div>
		</div>
	)
}
