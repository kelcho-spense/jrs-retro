import { Link, useRouterState } from "@tanstack/react-router"
import {
	LayoutDashboard,
	History,
	FileText,
	BarChart3,
	Users,
	Settings,
	LogOut,
	ChevronUp,
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
import { authClient } from "@/lib/auth-client"

const mainNavItems = [
	{
		title: "Dashboard",
		url: "/",
		icon: LayoutDashboard,
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

export function AppSidebar() {
	const { data: session } = authClient.useSession()
	const routerState = useRouterState()
	const currentPath = routerState.location.pathname

	const isActive = (url: string) => {
		if (url === "/") {
			return currentPath === "/"
		}
		return currentPath.startsWith(url)
	}

	const handleSignOut = async () => {
		await authClient.signOut()
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
			</SidebarContent>

			<SidebarFooter>
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
										<Link to="/settings">
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
								<Link to="/sign-in">Sign in</Link>
							</SidebarMenuButton>
						</SidebarMenuItem>
					</SidebarMenu>
				)}
			</SidebarFooter>
		</Sidebar>
	)
}
