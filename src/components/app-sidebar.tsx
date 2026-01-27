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
	ChevronRight,
	Building2,
	Shield,
	User,
	Monitor,
	Sun,
	Moon,
	Laptop,
	Star,
	Plus,
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
	SidebarMenuSub,
	SidebarMenuSubButton,
	SidebarMenuSubItem,
} from "@/components/ui/sidebar"
import {
	DropdownMenu,
	DropdownMenuContent,
	DropdownMenuItem,
	DropdownMenuSeparator,
	DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import {
	Collapsible,
	CollapsibleContent,
	CollapsibleTrigger,
} from "@/components/ui/collapsible"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { ToggleGroup, ToggleGroupItem } from "@/components/ui/toggle-group"
import { authClient } from "@/lib/auth-client"
import { getCurrentUser } from "@/lib/api/users"
import { getMyOrganizations } from "@/lib/api/organizations"
import { getMyTeams } from "@/lib/api/teams"
import { useTheme } from "@/hooks/use-theme"

type Organization = {
	id: string
	name: string
	myRole: string
	teamCount: number
	memberCount: number
}

type Team = {
	id: string
	name: string
	emoji: string | null
	myRole: string
	organization: { id: string; name: string }
}

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

const userNavItems = [
	{
		title: "My Teams",
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
	const [organizations, setOrganizations] = useState<Organization[]>([])
	const [teams, setTeams] = useState<Team[]>([])
	const [orgsExpanded, setOrgsExpanded] = useState(true)

	useEffect(() => {
		const loadUserData = async () => {
			try {
				const [user, orgs, userTeams] = await Promise.all([
					getCurrentUser(),
					getMyOrganizations(),
					getMyTeams(),
				])
				setIsAdmin(user?.role === "admin")
				setOrganizations(orgs)
				setTeams(userTeams)
			} catch {
				setIsAdmin(false)
				setOrganizations([])
				setTeams([])
			}
		}
		if (session?.user) {
			loadUserData()
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

				{/* Organizations & Teams Section */}
				<SidebarGroup>
					<Collapsible open={orgsExpanded} onOpenChange={setOrgsExpanded}>
						<CollapsibleTrigger asChild>
							<SidebarGroupLabel className="cursor-pointer hover:bg-sidebar-accent rounded-md flex items-center justify-between pr-2">
								<span className="flex items-center gap-2">
									<Building2 className="h-4 w-4" />
									Organizations
								</span>
								<ChevronRight className={`h-4 w-4 transition-transform ${orgsExpanded ? "rotate-90" : ""}`} />
							</SidebarGroupLabel>
						</CollapsibleTrigger>
						<CollapsibleContent>
							<SidebarGroupContent>
								<SidebarMenu>
									{organizations.length === 0 ? (
										<SidebarMenuItem>
											<SidebarMenuButton asChild>
												<Link to="/organizations" className="text-muted-foreground text-sm">
													<Plus className="h-4 w-4" />
													<span>Browse Organizations</span>
												</Link>
											</SidebarMenuButton>
										</SidebarMenuItem>
									) : (
										<>
											{organizations.map((org) => {
												const orgTeams = teams.filter(
													(t) => t.organization.id === org.id
												)
												return (
													<Collapsible key={org.id} defaultOpen>
														<SidebarMenuItem>
															<CollapsibleTrigger asChild>
																<SidebarMenuButton
																	isActive={currentPath === `/organizations/${org.id}`}
																	className="justify-between"
																>
																	<Link
																		to="/organizations/$orgId"
																		params={{ orgId: org.id }}
																		className="flex items-center gap-2 flex-1"
																		onClick={(e) => e.stopPropagation()}
																	>
																		<Avatar className="h-5 w-5">
																			<AvatarFallback className="text-xs bg-primary/10 text-primary">
																				{org.name.charAt(0).toUpperCase()}
																			</AvatarFallback>
																		</Avatar>
																		<span className="truncate">{org.name}</span>
																	</Link>
																	{orgTeams.length > 0 && (
																		<ChevronRight className="h-3 w-3 shrink-0" />
																	)}
																</SidebarMenuButton>
															</CollapsibleTrigger>
															{orgTeams.length > 0 && (
																<CollapsibleContent>
																	<SidebarMenuSub>
																		{orgTeams.map((team) => (
																			<SidebarMenuSubItem key={team.id}>
																				<SidebarMenuSubButton
																					asChild
																					isActive={currentPath === `/teams/${team.id}`}
																				>
																					<Link
																						to="/teams/$teamId"
																						params={{ teamId: team.id }}
																					>
																						<span className="mr-1">{team.emoji}</span>
																						<span className="truncate">{team.name}</span>
																						{team.myRole === "lead" && (
																							<Star className="h-3 w-3 ml-auto text-yellow-500" />
																						)}
																					</Link>
																				</SidebarMenuSubButton>
																			</SidebarMenuSubItem>
																		))}
																	</SidebarMenuSub>
																</CollapsibleContent>
															)}
														</SidebarMenuItem>
													</Collapsible>
												)
											})}
											<SidebarMenuItem>
												<SidebarMenuButton asChild>
													<Link to="/organizations" className="text-muted-foreground text-sm">
														<span>View all organizations</span>
													</Link>
												</SidebarMenuButton>
											</SidebarMenuItem>
										</>
									)}
								</SidebarMenu>
							</SidebarGroupContent>
						</CollapsibleContent>
					</Collapsible>
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
					<SidebarGroupLabel>Account</SidebarGroupLabel>
					<SidebarGroupContent>
						<SidebarMenu>
							{userNavItems.map((item) => (
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
