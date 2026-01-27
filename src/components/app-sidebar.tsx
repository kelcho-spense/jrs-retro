import { Link, useRouterState } from "@tanstack/react-router"
import { useState, useEffect } from "react"
import {
	LayoutDashboard,
	History,
	FileText,
	BarChart3,
	Users,
	Settings,
	LogOut,
	ChevronUp,
	Building2,
	Shield,
	User,
	Monitor,
	Sun,
	Moon,
	Laptop,
} from "lucide-react"

import {
	Sidebar,
	SidebarContent,
	SidebarFooter,
	SidebarGroup,
	SidebarGroupContent,
	SidebarGroupLabel,
	SidebarHeader,
	SidebarMenu,
	SidebarMenuButton,
	SidebarMenuItem,
} from "@/components/ui/sidebar"
import {
	DropdownMenu,
	DropdownMenuContent,
	DropdownMenuItem,
	DropdownMenuSeparator,
	DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { ToggleGroup, ToggleGroupItem } from "@/components/ui/toggle-group"
import { authClient } from "@/lib/auth-client"
import { getCurrentUser } from "@/lib/api/users"
import { useTheme } from "@/hooks/use-theme"

const mainNavItems = [
	{
		title: "Dashboard",
		url: "/",
		icon: LayoutDashboard,
	},
	{
		title: "Organizations",
		url: "/organizations",
		icon: Building2,
	},
]

const retroNavItems = [
	{
		title: "Retrospectives",
		url: "/retros",
		icon: History,
	},
	{
		title: "Templates",
		url: "/templates",
		icon: FileText,
	},
	{
		title: "Reports",
		url: "/reports",
		icon: BarChart3,
	},
]

const teamNavItems = [
	{
		title: "My Team",
		url: "/team",
		icon: Users,
	},
	{
		title: "Settings",
		url: "/settings",
		icon: Settings,
	},
]

const adminNavItems = [
	{
		title: "Admin Dashboard",
		url: "/admin",
		icon: LayoutDashboard,
	},
	{
		title: "Manage Users",
		url: "/admin/users",
		icon: Users,
	},
]

function ThemeToggle() {
	const { theme, setTheme } = useTheme()

	return (
		<ToggleGroup
			type="single"
			value={theme}
			onValueChange={(value) => {
				if (value) setTheme(value as "light" | "dark" | "system")
			}}
			className="w-full justify-between"
		>
			<ToggleGroupItem
				value="light"
				aria-label="Light theme"
				className="flex-1 gap-1"
			>
				<Sun className="h-4 w-4" />
				<span className="text-xs">Light</span>
			</ToggleGroupItem>
			<ToggleGroupItem
				value="dark"
				aria-label="Dark theme"
				className="flex-1 gap-1"
			>
				<Moon className="h-4 w-4" />
				<span className="text-xs">Dark</span>
			</ToggleGroupItem>
			<ToggleGroupItem
				value="system"
				aria-label="System theme"
				className="flex-1 gap-1"
			>
				<Laptop className="h-4 w-4" />
				<span className="text-xs">Auto</span>
			</ToggleGroupItem>
		</ToggleGroup>
	)
}

export function AppSidebar() {
	const { data: session } = authClient.useSession()
	const routerState = useRouterState()
	const currentPath = routerState.location.pathname
	const [isAdmin, setIsAdmin] = useState(false)

	useEffect(() => {
		const checkAdmin = async () => {
			try {
				const user = await getCurrentUser()
				setIsAdmin(user?.role === "admin")
			} catch {
				setIsAdmin(false)
			}
		}
		if (session?.user) {
			checkAdmin()
		}
	}, [session?.user])

	const isActive = (url: string) => {
		if (url === "/") {
			return currentPath === "/"
		}
		return currentPath.startsWith(url)
	}

	const handleSignOut = async () => {
		await authClient.signOut()
		window.location.href = "/sign-in"
	}

	return (
		<Sidebar>
			<SidebarHeader className="border-b px-6 py-4">
				<Link to="/" className="flex items-center gap-2">
					<span className="text-2xl">🔄</span>
					<span className="font-bold text-xl">jrs-retro</span>
				</Link>
			</SidebarHeader>

			<SidebarContent>
				<SidebarGroup>
					<SidebarGroupContent>
						<SidebarMenu>
							{mainNavItems.map((item) => (
								<SidebarMenuItem key={item.title}>
									<SidebarMenuButton asChild isActive={isActive(item.url)}>
										<Link to={item.url}>
											<item.icon />
											<span>{item.title}</span>
										</Link>
									</SidebarMenuButton>
								</SidebarMenuItem>
							))}
						</SidebarMenu>
					</SidebarGroupContent>
				</SidebarGroup>

				<SidebarGroup>
					<SidebarGroupLabel>Retrospectives</SidebarGroupLabel>
					<SidebarGroupContent>
						<SidebarMenu>
							{retroNavItems.map((item) => (
								<SidebarMenuItem key={item.title}>
									<SidebarMenuButton asChild isActive={isActive(item.url)}>
										<Link to={item.url}>
											<item.icon />
											<span>{item.title}</span>
										</Link>
									</SidebarMenuButton>
								</SidebarMenuItem>
							))}
						</SidebarMenu>
					</SidebarGroupContent>
				</SidebarGroup>

				<SidebarGroup>
					<SidebarGroupLabel>Team</SidebarGroupLabel>
					<SidebarGroupContent>
						<SidebarMenu>
							{teamNavItems.map((item) => (
								<SidebarMenuItem key={item.title}>
									<SidebarMenuButton asChild isActive={isActive(item.url)}>
										<Link to={item.url}>
											<item.icon />
											<span>{item.title}</span>
										</Link>
									</SidebarMenuButton>
								</SidebarMenuItem>
							))}
						</SidebarMenu>
					</SidebarGroupContent>
				</SidebarGroup>

				{isAdmin && (
					<SidebarGroup>
						<SidebarGroupLabel className="flex items-center gap-2">
							<Shield className="h-4 w-4" />
							Admin
						</SidebarGroupLabel>
						<SidebarGroupContent>
							<SidebarMenu>
								{adminNavItems.map((item) => (
									<SidebarMenuItem key={item.title}>
										<SidebarMenuButton asChild isActive={isActive(item.url)}>
											<Link to={item.url}>
												<item.icon />
												<span>{item.title}</span>
											</Link>
										</SidebarMenuButton>
									</SidebarMenuItem>
								))}
							</SidebarMenu>
						</SidebarGroupContent>
					</SidebarGroup>
				)}
			</SidebarContent>

			<SidebarFooter>
				{/* Theme Toggle */}
				<div className="px-3 py-2">
					<div className="flex items-center justify-between mb-2">
						<span className="text-sm text-muted-foreground">Theme</span>
					</div>
					<ThemeToggle />
				</div>

				{session?.user ? (
					<SidebarMenu>
						<SidebarMenuItem>
							<DropdownMenu>
								<DropdownMenuTrigger asChild>
									<SidebarMenuButton
										size="lg"
										className="data-[state=open]:bg-sidebar-accent"
									>
										<Avatar className="h-8 w-8">
											<AvatarImage src={session.user.image ?? undefined} />
											<AvatarFallback>
												{session.user.name?.charAt(0).toUpperCase() ?? "U"}
											</AvatarFallback>
										</Avatar>
										<div className="flex flex-col gap-0.5 leading-none">
											<span className="font-semibold">{session.user.name}</span>
											<span className="text-xs text-muted-foreground">
												{session.user.email}
											</span>
										</div>
										<ChevronUp className="ml-auto" />
									</SidebarMenuButton>
								</DropdownMenuTrigger>
								<DropdownMenuContent
									side="top"
									className="w-[--radix-popper-anchor-width]"
								>
									<DropdownMenuItem asChild>
										<Link to="/dashboard/profile">
											<User className="mr-2 h-4 w-4" />
											Profile
										</Link>
									</DropdownMenuItem>
									<DropdownMenuItem asChild>
										<Link to="/dashboard/security">
											<Shield className="mr-2 h-4 w-4" />
											Security
										</Link>
									</DropdownMenuItem>
									<DropdownMenuItem asChild>
										<Link to="/dashboard/sessions">
											<Monitor className="mr-2 h-4 w-4" />
											Sessions
										</Link>
									</DropdownMenuItem>
									<DropdownMenuItem asChild>
										<Link to="/dashboard/settings">
											<Settings className="mr-2 h-4 w-4" />
											Settings
										</Link>
									</DropdownMenuItem>
									<DropdownMenuSeparator />
									<DropdownMenuItem onClick={handleSignOut}>
										<LogOut className="mr-2 h-4 w-4" />
										Sign out
									</DropdownMenuItem>
								</DropdownMenuContent>
							</DropdownMenu>
						</SidebarMenuItem>
					</SidebarMenu>
				) : (
					<SidebarMenu>
						<SidebarMenuItem>
							<SidebarMenuButton asChild>
								<a href="/sign-in">Sign in</a>
							</SidebarMenuButton>
						</SidebarMenuItem>
					</SidebarMenu>
				)}
			</SidebarFooter>
		</Sidebar>
	)
}
