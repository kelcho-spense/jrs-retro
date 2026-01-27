import { createFileRoute, Link, useNavigate } from "@tanstack/react-router"
import { useState } from "react"
import { useMutation } from "@tanstack/react-query"
import {
	getTeam,
	updateTeam,
	deleteTeam,
	addTeamMember,
	updateTeamMemberRole,
	removeTeamMember,
	joinTeam,
	leaveTeam,
	requestToJoinTeam,
	cancelJoinRequest,
	approveJoinRequest,
	rejectJoinRequest,
} from "@/lib/api/teams"
import { getOrganization } from "@/lib/api/organizations"
import { Button } from "@/components/ui/button"
import { Card, CardContent } from "@/components/ui/card"
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
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { Badge } from "@/components/ui/badge"
import {
	ArrowLeft,
	Building2,
	Check,
	Clock,
	LogOut,
	MoreHorizontal,
	Settings,
	Star,
	Trash2,
	User,
	UserMinus,
	UserPlus,
	Users,
	X,
} from "lucide-react"

export const Route = createFileRoute("/teams/$teamId")({
	loader: async ({ params }) => {
		const team = await getTeam({ data: params.teamId })
		const organization = await getOrganization({ data: team.organizationId })
		return { team, organization }
	},
	component: TeamDetailPage,
})

function TeamDetailPage() {
	const { team, organization } = Route.useLoaderData()
	const navigate = useNavigate()

	// Dialog states
	const [isEditOpen, setIsEditOpen] = useState(false)
	const [isAddMemberOpen, setIsAddMemberOpen] = useState(false)
	const [deleteConfirmOpen, setDeleteConfirmOpen] = useState(false)
	const [leaveConfirmOpen, setLeaveConfirmOpen] = useState(false)
	const [removeMemberId, setRemoveMemberId] = useState<string | null>(null)
	const [isRequestJoinOpen, setIsRequestJoinOpen] = useState(false)
	const [cancelRequestConfirmOpen, setCancelRequestConfirmOpen] = useState(false)

	// Form states
	const [editName, setEditName] = useState(team.name)
	const [editDescription, setEditDescription] = useState(team.description ?? "")
	const [editEmoji, setEditEmoji] = useState(team.emoji ?? "👥")
	const [addMemberUserId, setAddMemberUserId] = useState("")
	const [addMemberRole, setAddMemberRole] = useState<"lead" | "member">("member")
	const [joinRequestMessage, setJoinRequestMessage] = useState("")

	const isOrgAdmin = team.orgRole === "owner" || team.orgRole === "admin"
	const isTeamLead = team.myRole === "lead"
	const canManage = isOrgAdmin || isTeamLead
	const isMember = team.isMember

	// Get org members who aren't in the team yet
	const availableMembers = organization.members.filter(
		(om) => !team.members.some((tm) => tm.userId === om.userId)
	)

	// Mutations
	const updateMutation = useMutation({
		mutationFn: () =>
			updateTeam({
				data: {
					id: team.id,
					name: editName,
					description: editDescription || null,
					emoji: editEmoji,
				},
			}),
		onSuccess: () => {
			setIsEditOpen(false)
			window.location.reload()
		},
	})

	const deleteMutation = useMutation({
		mutationFn: () => deleteTeam({ data: team.id }),
		onSuccess: () =>
			navigate({ to: "/organizations/$orgId", params: { orgId: team.organizationId } }),
	})

	const joinMutation = useMutation({
		mutationFn: () => joinTeam({ data: team.id }),
		onSuccess: () => window.location.reload(),
	})

	const leaveMutation = useMutation({
		mutationFn: () => leaveTeam({ data: team.id }),
		onSuccess: () =>
			navigate({ to: "/organizations/$orgId", params: { orgId: team.organizationId } }),
	})

	const addMemberMutation = useMutation({
		mutationFn: () =>
			addTeamMember({
				data: { teamId: team.id, userId: addMemberUserId, role: addMemberRole },
			}),
		onSuccess: () => {
			setIsAddMemberOpen(false)
			setAddMemberUserId("")
			setAddMemberRole("member")
			window.location.reload()
		},
	})

	const updateRoleMutation = useMutation({
		mutationFn: ({ userId, role }: { userId: string; role: "lead" | "member" }) =>
			updateTeamMemberRole({ data: { teamId: team.id, userId, role } }),
		onSuccess: () => window.location.reload(),
	})

	const removeMemberMutation = useMutation({
		mutationFn: (userId: string) =>
			removeTeamMember({ data: { teamId: team.id, userId } }),
		onSuccess: () => {
			setRemoveMemberId(null)
			window.location.reload()
		},
	})

	const requestToJoinMutation = useMutation({
		mutationFn: () =>
			requestToJoinTeam({
				data: { teamId: team.id, message: joinRequestMessage || undefined },
			}),
		onSuccess: () => {
			setIsRequestJoinOpen(false)
			setJoinRequestMessage("")
			window.location.reload()
		},
	})

	const cancelRequestMutation = useMutation({
		mutationFn: () => cancelJoinRequest({ data: team.myPendingRequestId! }),
		onSuccess: () => {
			setCancelRequestConfirmOpen(false)
			window.location.reload()
		},
	})

	const approveRequestMutation = useMutation({
		mutationFn: (requestId: string) =>
			approveJoinRequest({ data: { requestId } }),
		onSuccess: () => window.location.reload(),
	})

	const rejectRequestMutation = useMutation({
		mutationFn: (requestId: string) => rejectJoinRequest({ data: { requestId } }),
		onSuccess: () => window.location.reload(),
	})

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
					to="/organizations/$orgId"
					params={{ orgId: team.organizationId }}
					className="mb-4 inline-flex items-center text-sm text-muted-foreground hover:text-foreground"
				>
					<ArrowLeft className="mr-1 h-4 w-4" />
					Back to {team.organization.name}
				</Link>
				<div className="flex items-start justify-between">
					<div className="flex items-center gap-4">
						<span className="text-5xl">{team.emoji}</span>
						<div>
							<div className="flex items-center gap-2">
								<h1 className="text-3xl font-bold tracking-tight">{team.name}</h1>
								{team.myRole && getRoleBadge(team.myRole)}
							</div>
							<div className="flex items-center gap-2 text-muted-foreground">
								<Building2 className="h-4 w-4" />
								<span>{team.organization.name}</span>
							</div>
							{team.description && (
								<p className="mt-2 text-muted-foreground">{team.description}</p>
							)}
						</div>
					</div>
					<div className="flex items-center gap-2">
						{!isMember && !team.hasPendingRequest && isOrgAdmin && (
							<Button onClick={() => joinMutation.mutate()} disabled={joinMutation.isPending}>
								<UserPlus className="mr-2 h-4 w-4" />
								Join Team
							</Button>
						)}
						{!isMember && !team.hasPendingRequest && !isOrgAdmin && team.orgRole && (
							<Button onClick={() => setIsRequestJoinOpen(true)}>
								<UserPlus className="mr-2 h-4 w-4" />
								Request to Join
							</Button>
						)}
						{!isMember && team.hasPendingRequest && (
							<Button
								variant="outline"
								onClick={() => setCancelRequestConfirmOpen(true)}
							>
								<Clock className="mr-2 h-4 w-4" />
								Request Pending
							</Button>
						)}
						<DropdownMenu>
							<DropdownMenuTrigger asChild>
								<Button variant="outline" size="icon">
									<MoreHorizontal className="h-4 w-4" />
								</Button>
							</DropdownMenuTrigger>
							<DropdownMenuContent align="end">
								{canManage && (
									<DropdownMenuItem onClick={() => setIsEditOpen(true)}>
										<Settings className="mr-2 h-4 w-4" />
										Edit Team
									</DropdownMenuItem>
								)}
								{isMember && (
									<DropdownMenuItem
										onClick={() => setLeaveConfirmOpen(true)}
										className="text-destructive"
									>
										<LogOut className="mr-2 h-4 w-4" />
										Leave Team
									</DropdownMenuItem>
								)}
								{isOrgAdmin && (
									<>
										<DropdownMenuSeparator />
										<DropdownMenuItem
											onClick={() => setDeleteConfirmOpen(true)}
											className="text-destructive"
										>
											<Trash2 className="mr-2 h-4 w-4" />
											Delete Team
										</DropdownMenuItem>
									</>
								)}
							</DropdownMenuContent>
						</DropdownMenu>
					</div>
				</div>
			</div>

			{/* Members Section */}
			<div className="space-y-4">
				<div className="flex items-center justify-between">
					<h2 className="text-xl font-semibold">
						Members ({team.members.length})
					</h2>
					{canManage && availableMembers.length > 0 && (
						<Dialog open={isAddMemberOpen} onOpenChange={setIsAddMemberOpen}>
							<DialogTrigger asChild>
								<Button>
									<UserPlus className="mr-2 h-4 w-4" />
									Add Member
								</Button>
							</DialogTrigger>
							<DialogContent>
								<DialogHeader>
									<DialogTitle>Add Team Member</DialogTitle>
									<DialogDescription>
										Add an organization member to this team.
									</DialogDescription>
								</DialogHeader>
								<div className="grid gap-4 py-4">
									<div className="grid gap-2">
										<Label htmlFor="member">Member</Label>
										<Select
											value={addMemberUserId}
											onValueChange={setAddMemberUserId}
										>
											<SelectTrigger>
												<SelectValue placeholder="Select a member" />
											</SelectTrigger>
											<SelectContent>
												{availableMembers.map((om) => (
													<SelectItem key={om.userId} value={om.userId}>
														{om.user.name ?? om.user.email}
													</SelectItem>
												))}
											</SelectContent>
										</Select>
									</div>
									<div className="grid gap-2">
										<Label htmlFor="role">Role</Label>
										<Select
											value={addMemberRole}
											onValueChange={(v: string) => setAddMemberRole(v as "lead" | "member")}
										>
											<SelectTrigger>
												<SelectValue />
											</SelectTrigger>
											<SelectContent>
												<SelectItem value="member">Member</SelectItem>
												<SelectItem value="lead">Lead</SelectItem>
											</SelectContent>
										</Select>
									</div>
								</div>
								<DialogFooter>
									<Button variant="outline" onClick={() => setIsAddMemberOpen(false)}>
										Cancel
									</Button>
									<Button
										onClick={() => addMemberMutation.mutate()}
										disabled={!addMemberUserId || addMemberMutation.isPending}
									>
										{addMemberMutation.isPending ? "Adding..." : "Add"}
									</Button>
								</DialogFooter>
							</DialogContent>
						</Dialog>
					)}
				</div>

				{team.members.length === 0 ? (
					<Card>
						<CardContent className="flex flex-col items-center justify-center py-12">
							<Users className="mb-4 h-12 w-12 text-muted-foreground" />
							<h3 className="mb-2 text-lg font-semibold">No members yet</h3>
							<p className="mb-4 text-center text-muted-foreground">
								Be the first to join this team!
							</p>
							{!isMember && !team.hasPendingRequest && isOrgAdmin && (
								<Button onClick={() => joinMutation.mutate()}>
									<UserPlus className="mr-2 h-4 w-4" />
									Join Team
								</Button>
							)}
							{!isMember && !team.hasPendingRequest && !isOrgAdmin && team.orgRole && (
								<Button onClick={() => setIsRequestJoinOpen(true)}>
									<UserPlus className="mr-2 h-4 w-4" />
									Request to Join
								</Button>
							)}
							{!isMember && team.hasPendingRequest && (
								<Button variant="outline" onClick={() => setCancelRequestConfirmOpen(true)}>
									<Clock className="mr-2 h-4 w-4" />
									Request Pending
								</Button>
							)}
						</CardContent>
					</Card>
				) : (
					<div className="space-y-2">
						{team.members.map((member) => (
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
										{canManage && (
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
																	role: "lead",
																})
															}
														>
															<Star className="mr-2 h-4 w-4" />
															Make Lead
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
														Remove from Team
													</DropdownMenuItem>
												</DropdownMenuContent>
											</DropdownMenu>
										)}
									</div>
								</CardContent>
							</Card>
						))}
					</div>
				)}
			</div>

			{/* Pending Join Requests Section - Only for admins/leads */}
			{canManage && team.joinRequests && team.joinRequests.length > 0 && (
				<div className="mt-8 space-y-4">
					<h2 className="text-xl font-semibold">
						Pending Requests ({team.joinRequests.length})
					</h2>
					<div className="space-y-2">
						{team.joinRequests.map((request) => (
							<Card key={request.id}>
								<CardContent className="flex items-center justify-between p-4">
									<div className="flex items-center gap-3">
										<Avatar>
											<AvatarImage src={request.user.image ?? undefined} />
											<AvatarFallback>
												{getInitials(request.user.name ?? request.user.email ?? "U")}
											</AvatarFallback>
										</Avatar>
										<div>
											<p className="font-medium">
												{request.user.name ?? request.user.email}
											</p>
											{request.user.name && (
												<p className="text-sm text-muted-foreground">
													{request.user.email}
												</p>
											)}
											{request.message && (
												<p className="mt-1 text-sm text-muted-foreground italic">
													"{request.message}"
												</p>
											)}
										</div>
									</div>
									<div className="flex items-center gap-2">
										<Badge variant="secondary" className="gap-1">
											<Clock className="h-3 w-3" />
											Pending
										</Badge>
										<Button
											size="sm"
											variant="outline"
											className="text-green-600 hover:bg-green-50 hover:text-green-700"
											onClick={() => approveRequestMutation.mutate(request.id)}
											disabled={approveRequestMutation.isPending}
										>
											<Check className="mr-1 h-4 w-4" />
											Approve
										</Button>
										<Button
											size="sm"
											variant="outline"
											className="text-destructive hover:bg-destructive/10"
											onClick={() => rejectRequestMutation.mutate(request.id)}
											disabled={rejectRequestMutation.isPending}
										>
											<X className="mr-1 h-4 w-4" />
											Reject
										</Button>
									</div>
								</CardContent>
							</Card>
						))}
					</div>
				</div>
			)}

			{/* Edit Team Dialog */}
			<Dialog open={isEditOpen} onOpenChange={setIsEditOpen}>
				<DialogContent>
					<DialogHeader>
						<DialogTitle>Edit Team</DialogTitle>
						<DialogDescription>Update your team details.</DialogDescription>
					</DialogHeader>
					<div className="grid gap-4 py-4">
						<div className="grid gap-2">
							<Label htmlFor="editEmoji">Emoji</Label>
							<Input
								id="editEmoji"
								value={editEmoji}
								onChange={(e) => setEditEmoji(e.target.value)}
								className="w-20"
							/>
						</div>
						<div className="grid gap-2">
							<Label htmlFor="editName">Name</Label>
							<Input
								id="editName"
								value={editName}
								onChange={(e) => setEditName(e.target.value)}
							/>
						</div>
						<div className="grid gap-2">
							<Label htmlFor="editDescription">Description</Label>
							<Textarea
								id="editDescription"
								value={editDescription}
								onChange={(e) => setEditDescription(e.target.value)}
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

			{/* Delete Team Confirm */}
			<AlertDialog open={deleteConfirmOpen} onOpenChange={setDeleteConfirmOpen}>
				<AlertDialogContent>
					<AlertDialogHeader>
						<AlertDialogTitle>Delete Team?</AlertDialogTitle>
						<AlertDialogDescription>
							This will permanently delete "{team.name}". This action cannot be
							undone.
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

			{/* Leave Team Confirm */}
			<AlertDialog open={leaveConfirmOpen} onOpenChange={setLeaveConfirmOpen}>
				<AlertDialogContent>
					<AlertDialogHeader>
						<AlertDialogTitle>Leave Team?</AlertDialogTitle>
						<AlertDialogDescription>
							You will no longer be a member of "{team.name}".
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

			{/* Remove Member Confirm */}
			<AlertDialog
				open={!!removeMemberId}
				onOpenChange={() => setRemoveMemberId(null)}
			>
				<AlertDialogContent>
					<AlertDialogHeader>
						<AlertDialogTitle>Remove Member?</AlertDialogTitle>
						<AlertDialogDescription>
							This member will be removed from the team.
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

			{/* Request to Join Dialog */}
			<Dialog open={isRequestJoinOpen} onOpenChange={setIsRequestJoinOpen}>
				<DialogContent>
					<DialogHeader>
						<DialogTitle>Request to Join Team</DialogTitle>
						<DialogDescription>
							Your request will be sent to the team leads and organization admins for approval.
						</DialogDescription>
					</DialogHeader>
					<div className="grid gap-4 py-4">
						<div className="grid gap-2">
							<Label htmlFor="joinMessage">Message (optional)</Label>
							<Textarea
								id="joinMessage"
								placeholder="Tell us why you'd like to join this team..."
								value={joinRequestMessage}
								onChange={(e) => setJoinRequestMessage(e.target.value)}
							/>
						</div>
					</div>
					<DialogFooter>
						<Button variant="outline" onClick={() => setIsRequestJoinOpen(false)}>
							Cancel
						</Button>
						<Button
							onClick={() => requestToJoinMutation.mutate()}
							disabled={requestToJoinMutation.isPending}
						>
							{requestToJoinMutation.isPending ? "Sending..." : "Send Request"}
						</Button>
					</DialogFooter>
				</DialogContent>
			</Dialog>

			{/* Cancel Request Confirm */}
			<AlertDialog open={cancelRequestConfirmOpen} onOpenChange={setCancelRequestConfirmOpen}>
				<AlertDialogContent>
					<AlertDialogHeader>
						<AlertDialogTitle>Cancel Join Request?</AlertDialogTitle>
						<AlertDialogDescription>
							Your pending request to join "{team.name}" will be cancelled.
						</AlertDialogDescription>
					</AlertDialogHeader>
					<AlertDialogFooter>
						<AlertDialogCancel>Keep Request</AlertDialogCancel>
						<AlertDialogAction
							onClick={() => cancelRequestMutation.mutate()}
							className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
						>
							Cancel Request
						</AlertDialogAction>
					</AlertDialogFooter>
				</AlertDialogContent>
			</AlertDialog>
		</div>
	)
}
