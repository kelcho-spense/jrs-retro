import { createFileRoute, Link } from "@tanstack/react-router"
import { Users, Building2, Star, User, ChevronRight } from "lucide-react"
import { getMyTeams } from "@/lib/api/teams"
import { getMyOrganizations } from "@/lib/api/organizations"

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Avatar, AvatarFallback } from "@/components/ui/avatar"

export const Route = createFileRoute("/team")({
	loader: async () => {
		const [teams, organizations] = await Promise.all([
			getMyTeams(),
			getMyOrganizations(),
		])
		return { teams, organizations }
	},
	component: TeamPage,
})

function TeamPage() {
	const { teams, organizations } = Route.useLoaderData()

	const getRoleBadge = (role: string) => {
		if (role === "lead") {
			return (
				<Badge variant="default" className="gap-1">
					<Star className="h-3 w-3" />
					Lead
				</Badge>
			)
		}
		return (
			<Badge variant="outline" className="gap-1">
				<User className="h-3 w-3" />
				Member
			</Badge>
		)
	}

	return (
		<div className="space-y-8">
			{/* Header */}
			<div>
				<h1 className="text-3xl font-bold tracking-tight">My Teams</h1>
				<p className="text-muted-foreground">
					View and manage your team memberships
				</p>
			</div>

			{/* Teams Section */}
			{teams.length === 0 ? (
				<Card className="border-dashed">
					<CardContent className="flex flex-col items-center justify-center py-12">
						<Users className="h-12 w-12 text-muted-foreground mb-4" />
						<CardTitle className="mb-2">No teams yet</CardTitle>
						<p className="text-muted-foreground text-center mb-4">
							You're not a member of any teams. Browse your organizations to join or request to join a team.
						</p>
						{organizations.length > 0 && (
							<Button asChild>
								<Link to="/organizations">
									<Building2 className="mr-2 h-4 w-4" />
									Browse Organizations
								</Link>
							</Button>
						)}
					</CardContent>
				</Card>
			) : (
				<div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
					{teams.map((team) => (
						<Link
							key={team.id}
							to="/teams/$teamId"
							params={{ teamId: team.id }}
						>
							<Card className="hover:border-primary/50 transition-colors cursor-pointer h-full">
								<CardHeader className="pb-3">
									<div className="flex items-start justify-between">
										<div className="flex items-center gap-3">
											<span className="text-3xl">{team.emoji}</span>
											<div>
												<CardTitle className="text-lg">{team.name}</CardTitle>
												<CardDescription className="flex items-center gap-1">
													<Building2 className="h-3 w-3" />
													{team.organization.name}
												</CardDescription>
											</div>
										</div>
										{getRoleBadge(team.myRole)}
									</div>
								</CardHeader>
								<CardContent>
									<div className="flex items-center justify-between text-sm text-muted-foreground">
										<div className="flex items-center gap-1">
											<Users className="h-4 w-4" />
											<span>{team.memberCount} members</span>
										</div>
										<ChevronRight className="h-4 w-4" />
									</div>
								</CardContent>
							</Card>
						</Link>
					))}
				</div>
			)}

			{/* Organizations Section */}
			<div className="space-y-4">
				<div className="flex items-center justify-between">
					<h2 className="text-xl font-semibold">My Organizations</h2>
					<Button variant="outline" size="sm" asChild>
						<Link to="/organizations">
							View All
							<ChevronRight className="ml-1 h-4 w-4" />
						</Link>
					</Button>
				</div>

				{organizations.length === 0 ? (
					<Card className="border-dashed">
						<CardContent className="flex flex-col items-center justify-center py-8">
							<Building2 className="h-10 w-10 text-muted-foreground mb-3" />
							<p className="text-muted-foreground text-center text-sm">
								You're not a member of any organizations yet.
							</p>
						</CardContent>
					</Card>
				) : (
					<div className="grid gap-3 md:grid-cols-2 lg:grid-cols-3">
						{organizations.slice(0, 6).map((org) => (
							<Link
								key={org.id}
								to="/organizations/$orgId"
								params={{ orgId: org.id }}
							>
								<Card className="hover:border-primary/50 transition-colors cursor-pointer">
									<CardContent className="p-4">
										<div className="flex items-center gap-3">
											<Avatar className="h-10 w-10">
												<AvatarFallback className="bg-primary/10 text-primary">
													{org.name.charAt(0).toUpperCase()}
												</AvatarFallback>
											</Avatar>
											<div className="flex-1 min-w-0">
												<p className="font-medium truncate">{org.name}</p>
												<p className="text-xs text-muted-foreground">
													{org.teamCount} teams • {org.memberCount} members
												</p>
											</div>
											<ChevronRight className="h-4 w-4 text-muted-foreground" />
										</div>
									</CardContent>
								</Card>
							</Link>
						))}
					</div>
				)}
			</div>
		</div>
	)
}
