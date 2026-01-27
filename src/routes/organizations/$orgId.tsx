import { createFileRoute, Link, useNavigate } from "@tanstack/react-router"
import { useState } from "react"
import { useMutation } from "@tanstack/react-query"
import {
	getOrganization,
	updateOrganization,
	deleteOrganization,
	inviteOrgMember,
	updateOrgMemberRole,
	removeOrgMember,
	leaveOrganization,
} from "@/lib/api/organizations"
import {
	getTeamsByOrg,
	createTeam,
	deleteTeam,
} from "@/lib/api/teams"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import {
	Dialog,
	DialogContent,
	DialogDescription,
	DialogFooter,
	DialogHeader,
	DialogTitle,
	DialogTrigger,
} from "@/components/ui/dialog"
import {
	DropdownMenu,
	DropdownMenuContent,
	DropdownMenuItem,
	DropdownMenuSeparator,
	DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import {
	AlertDialog,
	AlertDialogAction,
	AlertDialogCancel,
	AlertDialogContent,
	AlertDialogDescription,
	AlertDialogFooter,
	AlertDialogHeader,
	AlertDialogTitle,
} from "@/components/ui/alert-dialog"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import {
	Select,
	SelectContent,
	SelectItem,
	SelectTrigger,
	SelectValue,
} from "@/components/ui/select"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { Badge } from "@/components/ui/badge"
import {
	ArrowLeft,
	Building2,
	Crown,
	LogOut,
	MoreHorizontal,
	Plus,
	Settings,
	Shield,
	Trash2,
	User,
	UserMinus,
	UserPlus,
	Users,
} from "lucide-react"

export const Route = createFileRoute("/organizations/$orgId")({
	loader: async ({ params }) => {
		const [organization, teams] = await Promise.all([
			getOrganization({ data: params.orgId }),
			getTeamsByOrg({ data: params.orgId }),
		])
		return { organization, teams }
	},
	component: OrganizationDetailPage,
})

function OrganizationDetailPage() {
	const { organization, teams } = Route.useLoaderData()
	const navigate = useNavigate()
	const [activeTab, setActiveTab] = useState("teams")

	// Dialog states
	const [isEditOpen, setIsEditOpen] = useState(false)
	const [isInviteOpen, setIsInviteOpen] = useState(false)
	const [isCreateTeamOpen, setIsCreateTeamOpen] = useState(false)
	const [deleteConfirmOpen, setDeleteConfirmOpen] = useState(false)
	const [leaveConfirmOpen, setLeaveConfirmOpen] = useState(false)
	const [deleteTeamId, setDeleteTeamId] = useState<string | null>(null)
	const [removeMemberId, setRemoveMemberId] = useState<string | null>(null)

	// Form states
	const [editName, setEditName] = useState(organization.name)
	const [editLogo, setEditLogo] = useState(organization.logo ?? "")
	const [inviteEmail, setInviteEmail] = useState("")
	const [inviteRole, setInviteRole] = useState<"admin" | "member">("member")
	const [teamName, setTeamName] = useState("")
	const [teamDescription, setTeamDescription] = useState("")
	const [teamEmoji, setTeamEmoji] = useState("👥")

	const isOwner = organization.myRole === "owner"
	const isAdmin = organization.myRole === "admin" || isOwner

	// Mutations
	const updateMutation = useMutation({
		mutationFn: () =>
			updateOrganization({
				data: { id: organization.id, name: editName, logo: editLogo || undefined },
			}),
		onSuccess: () => {
			setIsEditOpen(false)
			window.location.reload()
		},
	})

	const deleteMutation = useMutation({
		mutationFn: () => deleteOrganization({ data: organization.id }),
		onSuccess: () => navigate({ to: "/organizations" }),
	})

	const leaveMutation = useMutation({
		mutationFn: () => leaveOrganization({ data: organization.id }),
		onSuccess: () => navigate({ to: "/organizations" }),
	})

	const inviteMutation = useMutation({
		mutationFn: () =>
			inviteOrgMember({
				data: {
					organizationId: organization.id,
					email: inviteEmail,
					role: inviteRole,
				},
			}),
		onSuccess: () => {
			setIsInviteOpen(false)
			setInviteEmail("")
			setInviteRole("member")
			window.location.reload()
		},
	})

	const updateRoleMutation = useMutation({
		mutationFn: ({ userId, role }: { userId: string; role: "admin" | "member" }) =>
			updateOrgMemberRole({
				data: { organizationId: organization.id, userId, role },
			}),
		onSuccess: () => window.location.reload(),
	})

	const removeMemberMutation = useMutation({
		mutationFn: (userId: string) =>
			removeOrgMember({ data: { organizationId: organization.id, userId } }),
		onSuccess: () => {
			setRemoveMemberId(null)
			window.location.reload()
		},
	})

	const createTeamMutation = useMutation({
		mutationFn: () =>
			createTeam({
				data: {
					organizationId: organization.id,
					name: teamName,
					description: teamDescription || undefined,
					emoji: teamEmoji || undefined,
				},
			}),
		onSuccess: () => {
			setIsCreateTeamOpen(false)
			setTeamName("")
			setTeamDescription("")
			setTeamEmoji("👥")
			window.location.reload()
		},
	})

	const deleteTeamMutation = useMutation({
		mutationFn: (teamId: string) => deleteTeam({ data: teamId }),
		onSuccess: () => {
			setDeleteTeamId(null)
			window.location.reload()
		},
	})

	const getRoleBadge = (role: string) => {
		switch (role) {
			case "owner":
				return (
					<Badge variant="default" className="gap-1">
						<Crown className="h-3 w-3" />
						Owner
					</Badge>
				)
			case "admin":
				return (
					<Badge variant="secondary" className="gap-1">
						<Shield className="h-3 w-3" />
						Admin
					</Badge>
				)
			default:
				return (
					<Badge variant="outline" className="gap-1">
						<User className="h-3 w-3" />
						Member
					</Badge>
				)
		}
	}

	const getInitials = (name: string) => {
		return name
			.split(" ")
			.map((n) => n[0])
			.join("")
			.toUpperCase()
			.slice(0, 2)
	}

	return (
		<div className="container py-8">
			{/* Header */}
			<div className="mb-8">
				<Link
					to="/organizations"
					className="mb-4 inline-flex items-center text-sm text-muted-foreground hover:text-foreground"
				>
					<ArrowLeft className="mr-1 h-4 w-4" />
					Back to Organizations
				</Link>
				<div className="flex items-start justify-between">
					<div className="flex items-center gap-4">
						{organization.logo ? (
							<img
								src={organization.logo}
								alt={organization.name}
								className="h-16 w-16 rounded-xl object-cover"
							/>
						) : (
							<div className="flex h-16 w-16 items-center justify-center rounded-xl bg-primary/10">
								<Building2 className="h-8 w-8 text-primary" />
							</div>
						)}
						<div>
							<h1 className="text-3xl font-bold tracking-tight">
								{organization.name}
							</h1>
							<p className="text-muted-foreground">/{organization.slug}</p>
						</div>
						{getRoleBadge(organization.myRole)}
					</div>
					<DropdownMenu>
						<DropdownMenuTrigger asChild>
							<Button variant="outline" size="icon">
								<MoreHorizontal className="h-4 w-4" />
							</Button>
						</DropdownMenuTrigger>
						<DropdownMenuContent align="end">
							{isAdmin && (
								<DropdownMenuItem onClick={() => setIsEditOpen(true)}>
									<Settings className="mr-2 h-4 w-4" />
									Edit Organization
								</DropdownMenuItem>
							)}
							{!isOwner && (
								<DropdownMenuItem
									onClick={() => setLeaveConfirmOpen(true)}
									className="text-destructive"
								>
									<LogOut className="mr-2 h-4 w-4" />
									Leave Organization
								</DropdownMenuItem>
							)}
							{isOwner && (
								<>
									<DropdownMenuSeparator />
									<DropdownMenuItem
										onClick={() => setDeleteConfirmOpen(true)}
										className="text-destructive"
									>
										<Trash2 className="mr-2 h-4 w-4" />
										Delete Organization
									</DropdownMenuItem>
								</>
							)}
						</DropdownMenuContent>
					</DropdownMenu>
				</div>
			</div>

			{/* Tabs */}
			<Tabs value={activeTab} onValueChange={setActiveTab}>
				<TabsList>
					<TabsTrigger value="teams">Teams</TabsTrigger>
					<TabsTrigger value="members">Members</TabsTrigger>
				</TabsList>

				{/* Teams Tab */}
				<TabsContent value="teams" className="mt-6">
					<div className="mb-4 flex items-center justify-between">
						<h2 className="text-xl font-semibold">Teams</h2>
						{isAdmin && (
							<Dialog open={isCreateTeamOpen} onOpenChange={setIsCreateTeamOpen}>
								<DialogTrigger asChild>
									<Button>
										<Plus className="mr-2 h-4 w-4" />
										New Team
									</Button>
								</DialogTrigger>
								<DialogContent>
									<DialogHeader>
										<DialogTitle>Create Team</DialogTitle>
										<DialogDescription>
											Create a new team within this organization.
										</DialogDescription>
									</DialogHeader>
									<div className="grid gap-4 py-4">
										<div className="grid gap-2">
											<Label htmlFor="emoji">Emoji</Label>
											<Input
												id="emoji"
												value={teamEmoji}
												onChange={(e) => setTeamEmoji(e.target.value)}
												className="w-20"
											/>
										</div>
										<div className="grid gap-2">
											<Label htmlFor="teamName">Name</Label>
											<Input
												id="teamName"
												placeholder="Engineering"
												value={teamName}
												onChange={(e) => setTeamName(e.target.value)}
											/>
										</div>
										<div className="grid gap-2">
											<Label htmlFor="teamDescription">Description</Label>
											<Textarea
												id="teamDescription"
												placeholder="Our awesome engineering team"
												value={teamDescription}
												onChange={(e) => setTeamDescription(e.target.value)}
											/>
										</div>
									</div>
									<DialogFooter>
										<Button
											variant="outline"
											onClick={() => setIsCreateTeamOpen(false)}
										>
											Cancel
										</Button>
										<Button
											onClick={() => createTeamMutation.mutate()}
											disabled={!teamName || createTeamMutation.isPending}
										>
											{createTeamMutation.isPending ? "Creating..." : "Create"}
										</Button>
									</DialogFooter>
								</DialogContent>
							</Dialog>
						)}
					</div>

					{teams.length === 0 ? (
						<Card>
							<CardContent className="flex flex-col items-center justify-center py-12">
								<Users className="mb-4 h-12 w-12 text-muted-foreground" />
								<h3 className="mb-2 text-lg font-semibold">No teams yet</h3>
								<p className="mb-4 text-center text-muted-foreground">
									Create teams to organize members and run retrospectives.
								</p>
								{isAdmin && (
									<Button onClick={() => setIsCreateTeamOpen(true)}>
										<Plus className="mr-2 h-4 w-4" />
										Create Team
									</Button>
								)}
							</CardContent>
						</Card>
					) : (
						<div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
							{teams.map((team) => (
								<Card key={team.id} className="group">
									<CardHeader>
										<div className="flex items-start justify-between">
											<div className="flex items-center gap-3">
												<span className="text-2xl">{team.emoji}</span>
												<div>
													<CardTitle className="text-lg">
														<Link
															to="/teams/$teamId"
															params={{ teamId: team.id }}
															className="hover:underline"
														>
															{team.name}
														</Link>
													</CardTitle>
													{team.description && (
														<CardDescription className="line-clamp-2">
															{team.description}
														</CardDescription>
													)}
												</div>
											</div>
											{isAdmin && (
												<DropdownMenu>
													<DropdownMenuTrigger asChild>
														<Button
															variant="ghost"
															size="icon"
															className="opacity-0 group-hover:opacity-100"
														>
															<MoreHorizontal className="h-4 w-4" />
														</Button>
													</DropdownMenuTrigger>
													<DropdownMenuContent align="end">
														<DropdownMenuItem
															onClick={() => setDeleteTeamId(team.id)}
															className="text-destructive"
														>
															<Trash2 className="mr-2 h-4 w-4" />
															Delete Team
														</DropdownMenuItem>
													</DropdownMenuContent>
												</DropdownMenu>
											)}
										</div>
									</CardHeader>
									<CardContent>
										<div className="flex items-center justify-between">
											<div className="flex items-center gap-1 text-sm text-muted-foreground">
												<Users className="h-4 w-4" />
												<span>{team.memberCount} members</span>
											</div>
											{team.isMember ? (
												<Badge variant="secondary">Joined</Badge>
											) : (
												<Button variant="outline" size="sm" asChild>
													<Link to="/teams/$teamId" params={{ teamId: team.id }}>
														View
													</Link>
												</Button>
											)}
										</div>
									</CardContent>
								</Card>
							))}
						</div>
					)}
				</TabsContent>

				{/* Members Tab */}
				<TabsContent value="members" className="mt-6">
					<div className="mb-4 flex items-center justify-between">
						<h2 className="text-xl font-semibold">
							Members ({organization.members.length})
						</h2>
						{isAdmin && (
							<Dialog open={isInviteOpen} onOpenChange={setIsInviteOpen}>
								<DialogTrigger asChild>
									<Button>
										<UserPlus className="mr-2 h-4 w-4" />
										Invite Member
									</Button>
								</DialogTrigger>
								<DialogContent>
									<DialogHeader>
										<DialogTitle>Invite Member</DialogTitle>
										<DialogDescription>
											Add a user to this organization by their email.
										</DialogDescription>
									</DialogHeader>
									<div className="grid gap-4 py-4">
										<div className="grid gap-2">
											<Label htmlFor="email">Email</Label>
											<Input
												id="email"
												type="email"
												placeholder="user@example.com"
												value={inviteEmail}
												onChange={(e) => setInviteEmail(e.target.value)}
											/>
										</div>
										<div className="grid gap-2">
											<Label htmlFor="role">Role</Label>
											<Select
												value={inviteRole}
												onValueChange={(v) => setInviteRole(v as "admin" | "member")}
											>
												<SelectTrigger>
													<SelectValue />
												</SelectTrigger>
												<SelectContent>
													<SelectItem value="member">Member</SelectItem>
													<SelectItem value="admin">Admin</SelectItem>
												</SelectContent>
											</Select>
										</div>
									</div>
									<DialogFooter>
										<Button variant="outline" onClick={() => setIsInviteOpen(false)}>
											Cancel
										</Button>
										<Button
											onClick={() => inviteMutation.mutate()}
											disabled={!inviteEmail || inviteMutation.isPending}
										>
											{inviteMutation.isPending ? "Inviting..." : "Invite"}
										</Button>
									</DialogFooter>
								</DialogContent>
							</Dialog>
						)}
					</div>

					<div className="space-y-2">
						{organization.members.map((member) => (
							<Card key={member.userId}>
								<CardContent className="flex items-center justify-between p-4">
									<div className="flex items-center gap-3">
										<Avatar>
											<AvatarImage src={member.user.image ?? undefined} />
											<AvatarFallback>
												{getInitials(member.user.name ?? member.user.email ?? "U")}
											</AvatarFallback>
										</Avatar>
										<div>
											<p className="font-medium">
												{member.user.name ?? member.user.email}
											</p>
											{member.user.name && (
												<p className="text-sm text-muted-foreground">
													{member.user.email}
												</p>
											)}
										</div>
									</div>
									<div className="flex items-center gap-2">
										{getRoleBadge(member.role)}
										{isAdmin && member.role !== "owner" && (
											<DropdownMenu>
												<DropdownMenuTrigger asChild>
													<Button variant="ghost" size="icon">
														<MoreHorizontal className="h-4 w-4" />
													</Button>
												</DropdownMenuTrigger>
												<DropdownMenuContent align="end">
													{member.role === "member" ? (
														<DropdownMenuItem
															onClick={() =>
																updateRoleMutation.mutate({
																	userId: member.userId,
																	role: "admin",
																})
															}
														>
															<Shield className="mr-2 h-4 w-4" />
															Make Admin
														</DropdownMenuItem>
													) : (
														<DropdownMenuItem
															onClick={() =>
																updateRoleMutation.mutate({
																	userId: member.userId,
																	role: "member",
																})
															}
														>
															<User className="mr-2 h-4 w-4" />
															Make Member
														</DropdownMenuItem>
													)}
													<DropdownMenuSeparator />
													<DropdownMenuItem
														onClick={() => setRemoveMemberId(member.userId)}
														className="text-destructive"
													>
														<UserMinus className="mr-2 h-4 w-4" />
														Remove Member
													</DropdownMenuItem>
												</DropdownMenuContent>
											</DropdownMenu>
										)}
									</div>
								</CardContent>
							</Card>
						))}
					</div>
				</TabsContent>
			</Tabs>

			{/* Edit Organization Dialog */}
			<Dialog open={isEditOpen} onOpenChange={setIsEditOpen}>
				<DialogContent>
					<DialogHeader>
						<DialogTitle>Edit Organization</DialogTitle>
						<DialogDescription>
							Update your organization details.
						</DialogDescription>
					</DialogHeader>
					<div className="grid gap-4 py-4">
						<div className="grid gap-2">
							<Label htmlFor="editName">Name</Label>
							<Input
								id="editName"
								value={editName}
								onChange={(e) => setEditName(e.target.value)}
							/>
						</div>
						<div className="grid gap-2">
							<Label htmlFor="editLogo">Logo URL</Label>
							<Input
								id="editLogo"
								placeholder="https://example.com/logo.png"
								value={editLogo}
								onChange={(e) => setEditLogo(e.target.value)}
							/>
						</div>
					</div>
					<DialogFooter>
						<Button variant="outline" onClick={() => setIsEditOpen(false)}>
							Cancel
						</Button>
						<Button
							onClick={() => updateMutation.mutate()}
							disabled={!editName || updateMutation.isPending}
						>
							{updateMutation.isPending ? "Saving..." : "Save"}
						</Button>
					</DialogFooter>
				</DialogContent>
			</Dialog>

			{/* Delete Organization Confirm */}
			<AlertDialog open={deleteConfirmOpen} onOpenChange={setDeleteConfirmOpen}>
				<AlertDialogContent>
					<AlertDialogHeader>
						<AlertDialogTitle>Delete Organization?</AlertDialogTitle>
						<AlertDialogDescription>
							This will permanently delete "{organization.name}" and all its
							teams. This action cannot be undone.
						</AlertDialogDescription>
					</AlertDialogHeader>
					<AlertDialogFooter>
						<AlertDialogCancel>Cancel</AlertDialogCancel>
						<AlertDialogAction
							onClick={() => deleteMutation.mutate()}
							className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
						>
							Delete
						</AlertDialogAction>
					</AlertDialogFooter>
				</AlertDialogContent>
			</AlertDialog>

			{/* Leave Organization Confirm */}
			<AlertDialog open={leaveConfirmOpen} onOpenChange={setLeaveConfirmOpen}>
				<AlertDialogContent>
					<AlertDialogHeader>
						<AlertDialogTitle>Leave Organization?</AlertDialogTitle>
						<AlertDialogDescription>
							You will lose access to "{organization.name}" and all its teams.
						</AlertDialogDescription>
					</AlertDialogHeader>
					<AlertDialogFooter>
						<AlertDialogCancel>Cancel</AlertDialogCancel>
						<AlertDialogAction onClick={() => leaveMutation.mutate()}>
							Leave
						</AlertDialogAction>
					</AlertDialogFooter>
				</AlertDialogContent>
			</AlertDialog>

			{/* Delete Team Confirm */}
			<AlertDialog
				open={!!deleteTeamId}
				onOpenChange={() => setDeleteTeamId(null)}
			>
				<AlertDialogContent>
					<AlertDialogHeader>
						<AlertDialogTitle>Delete Team?</AlertDialogTitle>
						<AlertDialogDescription>
							This will permanently delete this team. This action cannot be undone.
						</AlertDialogDescription>
					</AlertDialogHeader>
					<AlertDialogFooter>
						<AlertDialogCancel>Cancel</AlertDialogCancel>
						<AlertDialogAction
							onClick={() => deleteTeamId && deleteTeamMutation.mutate(deleteTeamId)}
							className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
						>
							Delete
						</AlertDialogAction>
					</AlertDialogFooter>
				</AlertDialogContent>
			</AlertDialog>

			{/* Remove Member Confirm */}
			<AlertDialog
				open={!!removeMemberId}
				onOpenChange={() => setRemoveMemberId(null)}
			>
				<AlertDialogContent>
					<AlertDialogHeader>
						<AlertDialogTitle>Remove Member?</AlertDialogTitle>
						<AlertDialogDescription>
							This member will lose access to the organization and all its teams.
						</AlertDialogDescription>
					</AlertDialogHeader>
					<AlertDialogFooter>
						<AlertDialogCancel>Cancel</AlertDialogCancel>
						<AlertDialogAction
							onClick={() => removeMemberId && removeMemberMutation.mutate(removeMemberId)}
							className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
						>
							Remove
						</AlertDialogAction>
					</AlertDialogFooter>
				</AlertDialogContent>
			</AlertDialog>
		</div>
	)
}
