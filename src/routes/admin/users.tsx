import { createFileRoute, Link, useRouter } from "@tanstack/react-router"
import { useState, useMemo } from "react"
import { useMutation } from "@tanstack/react-query"
import {
	Users,
	Shield,
	Clock,
	CheckCircle,
	XCircle,
	MoreHorizontal,
	UserCheck,
	UserX,
	Crown,
	User,
	Search,
	Filter,
	Ban,
	RefreshCw,
	Eye,
	History,
	Trash2,
	CheckSquare,
	Square,
	Building2,
	AlertTriangle,
} from "lucide-react"

import { Button } from "@/components/ui/button"
import {
	Card,
	CardContent,
	CardDescription,
	CardHeader,
	CardTitle,
} from "@/components/ui/card"
import {
	DropdownMenu,
	DropdownMenuContent,
	DropdownMenuItem,
	DropdownMenuSeparator,
	DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import {
	Dialog,
	DialogContent,
	DialogDescription,
	DialogFooter,
	DialogHeader,
	DialogTitle,
} from "@/components/ui/dialog"
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
import {
	Select,
	SelectContent,
	SelectItem,
	SelectTrigger,
	SelectValue,
} from "@/components/ui/select"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { Badge } from "@/components/ui/badge"
import { Separator } from "@/components/ui/separator"
import {
	getAllUsers,
	getCurrentUser,
	updateUserStatus,
	updateUserRole,
	suspendUser,
	reactivateUser,
	bulkUpdateUserStatus,
	getUserDetails,
	getAdminActionLog,
	deleteUser,
} from "@/lib/api/users"
import type { UserStatus, UserRole } from "@/db/schema"

type UserItem = NonNullable<Awaited<ReturnType<typeof getAllUsers>>>[number]

export const Route = createFileRoute("/admin/users")({
	loader: async () => {
		const [currentUser, users, actionLog] = await Promise.all([
			getCurrentUser(),
			getAllUsers({ data: undefined }),
			getAdminActionLog({ data: { limit: 20 } }),
		])
		return { currentUser, users, actionLog }
	},
	component: AdminUsersPage,
})

function AdminUsersPage() {
	const router = useRouter()
	const { currentUser, users, actionLog } = Route.useLoaderData()

	// State
	const [activeTab, setActiveTab] = useState("users")
	const [searchQuery, setSearchQuery] = useState("")
	const [statusFilter, setStatusFilter] = useState<string>("all")
	const [roleFilter, setRoleFilter] = useState<string>("all")
	const [selectedUsers, setSelectedUsers] = useState<Set<string>>(new Set())

	// Modals
	const [suspendModalUser, setSuspendModalUser] = useState<UserItem | null>(null)
	const [suspendReason, setSuspendReason] = useState("")
	const [detailsModalUser, setDetailsModalUser] = useState<UserItem | null>(null)
	const [userDetails, setUserDetails] = useState<Awaited<ReturnType<typeof getUserDetails>> | null>(null)
	const [deleteConfirmUser, setDeleteConfirmUser] = useState<UserItem | null>(null)
	const [bulkActionModal, setBulkActionModal] = useState<string | null>(null)

	// Note: Access check is now handled by the parent /admin layout route

	// Filter users
	const filteredUsers = useMemo(() => {
		return users.filter((u: UserItem) => {
			const matchesSearch =
				!searchQuery ||
				u.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
				u.email.toLowerCase().includes(searchQuery.toLowerCase())

			const matchesStatus = statusFilter === "all" || u.status === statusFilter
			const matchesRole = roleFilter === "all" || u.role === roleFilter

			return matchesSearch && matchesStatus && matchesRole
		})
	}, [users, searchQuery, statusFilter, roleFilter])

	// Stats
	const stats = useMemo(() => ({
		pending: users.filter((u: UserItem) => u.status === "pending").length,
		approved: users.filter((u: UserItem) => u.status === "approved").length,
		suspended: users.filter((u: UserItem) => u.status === "suspended").length,
		rejected: users.filter((u: UserItem) => u.status === "rejected").length,
		admins: users.filter((u: UserItem) => u.role === "admin").length,
	}), [users])

	// Selection helpers
	const toggleSelection = (userId: string) => {
		const newSelection = new Set(selectedUsers)
		if (newSelection.has(userId)) {
			newSelection.delete(userId)
		} else {
			newSelection.add(userId)
		}
		setSelectedUsers(newSelection)
	}

	const selectAll = () => {
		const selectableUsers = filteredUsers
			.filter((u: UserItem) => u.id !== currentUser.id)
			.map((u: UserItem) => u.id)
		setSelectedUsers(new Set(selectableUsers))
	}

	const clearSelection = () => setSelectedUsers(new Set())

	// Mutations
	const statusMutation = useMutation({
		mutationFn: ({ userId, status }: { userId: string; status: UserStatus }) =>
			updateUserStatus({ data: { userId, status } }),
		onSuccess: () => router.invalidate(),
	})

	const roleMutation = useMutation({
		mutationFn: ({ userId, role }: { userId: string; role: UserRole }) =>
			updateUserRole({ data: { userId, role } }),
		onSuccess: () => router.invalidate(),
	})

	const suspendMutation = useMutation({
		mutationFn: ({ userId, reason }: { userId: string; reason?: string }) =>
			suspendUser({ data: { userId, reason } }),
		onSuccess: () => {
			setSuspendModalUser(null)
			setSuspendReason("")
			router.invalidate()
		},
	})

	const reactivateMutation = useMutation({
		mutationFn: (userId: string) => reactivateUser({ data: userId }),
		onSuccess: () => router.invalidate(),
	})

	const deleteMutation = useMutation({
		mutationFn: (userId: string) => deleteUser({ data: userId }),
		onSuccess: () => {
			setDeleteConfirmUser(null)
			router.invalidate()
		},
	})

	const bulkMutation = useMutation({
		mutationFn: ({ status, reason }: { status: "approved" | "rejected" | "suspended"; reason?: string }) =>
			bulkUpdateUserStatus({
				data: { userIds: Array.from(selectedUsers), status, reason },
			}),
		onSuccess: () => {
			setBulkActionModal(null)
			clearSelection()
			router.invalidate()
		},
	})

	// Load user details
	const loadUserDetails = async (user: UserItem) => {
		setDetailsModalUser(user)
		try {
			const details = await getUserDetails({ data: user.id })
			setUserDetails(details)
		} catch (error) {
			console.error("Failed to load user details:", error)
		}
	}

	return (
		<div className="space-y-6">
			{/* Header */}
			<div className="flex items-center justify-between">
				<div>
					<h1 className="text-3xl font-bold tracking-tight">User Management</h1>
					<p className="text-muted-foreground">
						Manage user accounts, permissions, and access
					</p>
				</div>
			</div>

			{/* Stats Cards */}
			<div className="grid gap-4 md:grid-cols-5">
				<Card className="cursor-pointer hover:bg-muted/50 transition-colors" onClick={() => setStatusFilter("pending")}>
					<CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
						<CardTitle className="text-sm font-medium">Pending</CardTitle>
						<Clock className="h-4 w-4 text-amber-500" />
					</CardHeader>
					<CardContent>
						<div className="text-2xl font-bold">{stats.pending}</div>
					</CardContent>
				</Card>
				<Card className="cursor-pointer hover:bg-muted/50 transition-colors" onClick={() => setStatusFilter("approved")}>
					<CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
						<CardTitle className="text-sm font-medium">Active</CardTitle>
						<CheckCircle className="h-4 w-4 text-green-500" />
					</CardHeader>
					<CardContent>
						<div className="text-2xl font-bold">{stats.approved}</div>
					</CardContent>
				</Card>
				<Card className="cursor-pointer hover:bg-muted/50 transition-colors" onClick={() => setStatusFilter("suspended")}>
					<CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
						<CardTitle className="text-sm font-medium">Suspended</CardTitle>
						<Ban className="h-4 w-4 text-orange-500" />
					</CardHeader>
					<CardContent>
						<div className="text-2xl font-bold">{stats.suspended}</div>
					</CardContent>
				</Card>
				<Card className="cursor-pointer hover:bg-muted/50 transition-colors" onClick={() => setStatusFilter("rejected")}>
					<CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
						<CardTitle className="text-sm font-medium">Rejected</CardTitle>
						<XCircle className="h-4 w-4 text-red-500" />
					</CardHeader>
					<CardContent>
						<div className="text-2xl font-bold">{stats.rejected}</div>
					</CardContent>
				</Card>
				<Card className="cursor-pointer hover:bg-muted/50 transition-colors" onClick={() => setRoleFilter("admin")}>
					<CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
						<CardTitle className="text-sm font-medium">Admins</CardTitle>
						<Crown className="h-4 w-4 text-amber-500" />
					</CardHeader>
					<CardContent>
						<div className="text-2xl font-bold">{stats.admins}</div>
					</CardContent>
				</Card>
			</div>

			{/* Tabs */}
			<Tabs value={activeTab} onValueChange={setActiveTab}>
				<TabsList>
					<TabsTrigger value="users">
						<Users className="mr-2 h-4 w-4" />
						Users
					</TabsTrigger>
					<TabsTrigger value="activity">
						<History className="mr-2 h-4 w-4" />
						Activity Log
					</TabsTrigger>
				</TabsList>

				{/* Users Tab */}
				<TabsContent value="users" className="space-y-4">
					{/* Search and Filters */}
					<div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
						<div className="flex flex-1 items-center gap-2">
							<div className="relative flex-1 max-w-sm">
								<Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
								<Input
									placeholder="Search users..."
									value={searchQuery}
									onChange={(e) => setSearchQuery(e.target.value)}
									className="pl-9"
								/>
							</div>
							<Select value={statusFilter} onValueChange={setStatusFilter}>
								<SelectTrigger className="w-35">
									<Filter className="mr-2 h-4 w-4" />
									<SelectValue placeholder="Status" />
								</SelectTrigger>
								<SelectContent>
									<SelectItem value="all">All Status</SelectItem>
									<SelectItem value="pending">Pending</SelectItem>
									<SelectItem value="approved">Approved</SelectItem>
									<SelectItem value="suspended">Suspended</SelectItem>
									<SelectItem value="rejected">Rejected</SelectItem>
								</SelectContent>
							</Select>
							<Select value={roleFilter} onValueChange={setRoleFilter}>
								<SelectTrigger className="w-32">
									<SelectValue placeholder="Role" />
								</SelectTrigger>
								<SelectContent>
									<SelectItem value="all">All Roles</SelectItem>
									<SelectItem value="admin">Admin</SelectItem>
									<SelectItem value="member">Member</SelectItem>
								</SelectContent>
							</Select>
						</div>

						{/* Bulk Actions */}
						{selectedUsers.size > 0 && (
							<div className="flex items-center gap-2">
								<span className="text-sm text-muted-foreground">
									{selectedUsers.size} selected
								</span>
								<Button
									size="sm"
									variant="outline"
									onClick={() => setBulkActionModal("approve")}
								>
									<UserCheck className="mr-1 h-4 w-4" />
									Approve
								</Button>
								<Button
									size="sm"
									variant="outline"
									onClick={() => setBulkActionModal("suspend")}
								>
									<Ban className="mr-1 h-4 w-4" />
									Suspend
								</Button>
								<Button size="sm" variant="ghost" onClick={clearSelection}>
									Clear
								</Button>
							</div>
						)}
					</div>

					{/* Select All */}
					<div className="flex items-center gap-2">
						<Button
							variant="ghost"
							size="sm"
							onClick={() =>
								selectedUsers.size === filteredUsers.filter((u: UserItem) => u.id !== currentUser.id).length
									? clearSelection()
									: selectAll()
							}
						>
							{selectedUsers.size > 0 ? (
								<CheckSquare className="mr-2 h-4 w-4" />
							) : (
								<Square className="mr-2 h-4 w-4" />
							)}
							{selectedUsers.size === filteredUsers.filter((u: UserItem) => u.id !== currentUser.id).length && selectedUsers.size > 0
								? "Deselect All"
								: "Select All"}
						</Button>
						<span className="text-sm text-muted-foreground">
							Showing {filteredUsers.length} of {users.length} users
						</span>
					</div>

					{/* User List */}
					<div className="space-y-2">
						{filteredUsers.map((user: UserItem) => (
							<UserRow
								key={user.id}
								user={user}
								currentUserId={currentUser.id}
								isSelected={selectedUsers.has(user.id)}
								onToggleSelect={() => toggleSelection(user.id)}
								onApprove={() =>
									statusMutation.mutate({ userId: user.id, status: "approved" })
								}
								onReject={() =>
									statusMutation.mutate({ userId: user.id, status: "rejected" })
								}
								onSuspend={() => setSuspendModalUser(user)}
								onReactivate={() => reactivateMutation.mutate(user.id)}
								onMakeAdmin={() =>
									roleMutation.mutate({ userId: user.id, role: "admin" })
								}
								onRemoveAdmin={() =>
									roleMutation.mutate({ userId: user.id, role: "member" })
								}
								onViewDetails={() => loadUserDetails(user)}
								onDelete={() => setDeleteConfirmUser(user)}
							/>
						))}

						{filteredUsers.length === 0 && (
							<Card className="border-dashed">
								<CardContent className="flex flex-col items-center justify-center py-12">
									<Users className="h-12 w-12 text-muted-foreground mb-4" />
									<CardTitle className="mb-2">No users found</CardTitle>
									<CardDescription>
										Try adjusting your search or filters
									</CardDescription>
								</CardContent>
							</Card>
						)}
					</div>
				</TabsContent>

				{/* Activity Log Tab */}
				<TabsContent value="activity">
					<Card>
						<CardHeader>
							<CardTitle>Recent Admin Actions</CardTitle>
							<CardDescription>
								Audit trail of administrative actions on user accounts
							</CardDescription>
						</CardHeader>
						<CardContent>
							<div className="space-y-4">
								{actionLog.map((log) => (
									<div
										key={log.id}
										className="flex items-start gap-4 pb-4 border-b last:border-0"
									>
										<div className="shrink-0">
											<ActionIcon action={log.action} />
										</div>
										<div className="flex-1 min-w-0">
											<p className="text-sm">
												<span className="font-medium">{log.admin?.name}</span>{" "}
												<ActionLabel action={log.action} />{" "}
												<span className="font-medium">{log.targetUser?.name}</span>
											</p>
											{log.details && (
												<p className="text-xs text-muted-foreground mt-1">
													{formatDetails(log.details)}
												</p>
											)}
											<p className="text-xs text-muted-foreground mt-1">
												{new Date(log.createdAt).toLocaleString()}
											</p>
										</div>
									</div>
								))}

								{actionLog.length === 0 && (
									<p className="text-center text-muted-foreground py-8">
										No admin actions recorded yet
									</p>
								)}
							</div>
						</CardContent>
					</Card>
				</TabsContent>
			</Tabs>

			{/* Suspend User Modal */}
			<Dialog
				open={!!suspendModalUser}
				onOpenChange={() => setSuspendModalUser(null)}
			>
				<DialogContent>
					<DialogHeader>
						<DialogTitle>Suspend User</DialogTitle>
						<DialogDescription>
							Suspend {suspendModalUser?.name}'s account. They will not be able to
							access the system until reactivated.
						</DialogDescription>
					</DialogHeader>
					<div className="py-4">
						<Label htmlFor="reason">Reason (optional)</Label>
						<Textarea
							id="reason"
							placeholder="Enter reason for suspension..."
							value={suspendReason}
							onChange={(e) => setSuspendReason(e.target.value)}
							className="mt-2"
						/>
					</div>
					<DialogFooter>
						<Button variant="outline" onClick={() => setSuspendModalUser(null)}>
							Cancel
						</Button>
						<Button
							variant="destructive"
							onClick={() =>
								suspendModalUser &&
								suspendMutation.mutate({
									userId: suspendModalUser.id,
									reason: suspendReason,
								})
							}
							disabled={suspendMutation.isPending}
						>
							{suspendMutation.isPending ? "Suspending..." : "Suspend User"}
						</Button>
					</DialogFooter>
				</DialogContent>
			</Dialog>

			{/* User Details Modal */}
			<Dialog
				open={!!detailsModalUser}
				onOpenChange={() => {
					setDetailsModalUser(null)
					setUserDetails(null)
				}}
			>
				<DialogContent className="max-w-2xl max-h-[80vh] overflow-y-auto">
					<DialogHeader>
						<DialogTitle>User Details</DialogTitle>
					</DialogHeader>
					{userDetails ? (
						<div className="space-y-6">
							{/* User Info */}
							<div className="flex items-start gap-4">
								<Avatar className="h-16 w-16">
									<AvatarImage src={userDetails.user.image ?? undefined} />
									<AvatarFallback className="text-lg">
										{userDetails.user.name.charAt(0).toUpperCase()}
									</AvatarFallback>
								</Avatar>
								<div className="flex-1">
									<h3 className="text-lg font-semibold flex items-center gap-2">
										{userDetails.user.name}
										{userDetails.user.role === "admin" && (
											<Crown className="h-4 w-4 text-amber-500" />
										)}
									</h3>
									<p className="text-muted-foreground">{userDetails.user.email}</p>
									<div className="flex items-center gap-2 mt-2">
										<StatusBadge status={userDetails.user.status} />
										<Badge variant="outline">{userDetails.user.role}</Badge>
									</div>
								</div>
							</div>

							{/* Bio */}
							{userDetails.user.bio && (
								<div>
									<h4 className="font-medium mb-1">Bio</h4>
									<p className="text-sm text-muted-foreground">
										{userDetails.user.bio}
									</p>
								</div>
							)}

							{/* Suspension Info */}
							{userDetails.user.status === "suspended" && (
								<div className="bg-orange-50 dark:bg-orange-950/20 border border-orange-200 dark:border-orange-800 rounded-lg p-4">
									<div className="flex items-center gap-2 text-orange-700 dark:text-orange-400">
										<AlertTriangle className="h-4 w-4" />
										<span className="font-medium">Account Suspended</span>
									</div>
									{userDetails.user.suspendedReason && (
										<p className="text-sm mt-1 text-orange-600 dark:text-orange-300">
											Reason: {userDetails.user.suspendedReason}
										</p>
									)}
									<p className="text-xs mt-1 text-muted-foreground">
										Suspended on{" "}
										{userDetails.user.suspendedAt
											? new Date(userDetails.user.suspendedAt).toLocaleString()
											: "Unknown"}
									</p>
								</div>
							)}

							<Separator />

							{/* Organizations */}
							<div>
								<h4 className="font-medium mb-2 flex items-center gap-2">
									<Building2 className="h-4 w-4" />
									Organizations ({userDetails.organizations.length})
								</h4>
								{userDetails.organizations.length > 0 ? (
									<div className="space-y-2">
										{userDetails.organizations.map((om) => (
											<div
												key={om.id}
												className="flex items-center justify-between p-2 bg-muted rounded"
											>
												<span>{om.organization.name}</span>
												<Badge variant="secondary">{om.role}</Badge>
											</div>
										))}
									</div>
								) : (
									<p className="text-sm text-muted-foreground">
										Not a member of any organizations
									</p>
								)}
							</div>

							{/* Teams */}
							<div>
								<h4 className="font-medium mb-2 flex items-center gap-2">
									<Users className="h-4 w-4" />
									Teams ({userDetails.teams.length})
								</h4>
								{userDetails.teams.length > 0 ? (
									<div className="space-y-2">
										{userDetails.teams.map((tm) => (
											<div
												key={tm.id}
												className="flex items-center justify-between p-2 bg-muted rounded"
											>
												<div>
													<span>{tm.team.name}</span>
													<span className="text-xs text-muted-foreground ml-2">
														({tm.team.organization.name})
													</span>
												</div>
												<Badge variant="secondary">{tm.role}</Badge>
											</div>
										))}
									</div>
								) : (
									<p className="text-sm text-muted-foreground">
										Not a member of any teams
									</p>
								)}
							</div>

							<Separator />

							{/* Action History */}
							<div>
								<h4 className="font-medium mb-2 flex items-center gap-2">
									<History className="h-4 w-4" />
									Admin Action History
								</h4>
								{userDetails.actionHistory.length > 0 ? (
									<div className="space-y-2">
										{userDetails.actionHistory.map((log) => (
											<div key={log.id} className="flex items-center gap-2 text-sm">
												<ActionIcon action={log.action} />
												<span>
													<ActionLabel action={log.action} /> by{" "}
													{log.admin?.name}
												</span>
												<span className="text-muted-foreground">
													{new Date(log.createdAt).toLocaleDateString()}
												</span>
											</div>
										))}
									</div>
								) : (
									<p className="text-sm text-muted-foreground">
										No admin actions on this user
									</p>
								)}
							</div>

							{/* Dates */}
							<div className="grid grid-cols-2 gap-4 text-sm">
								<div>
									<span className="text-muted-foreground">Joined:</span>{" "}
									{new Date(userDetails.user.createdAt).toLocaleDateString()}
								</div>
								{userDetails.user.lastActiveAt && (
									<div>
										<span className="text-muted-foreground">Last Active:</span>{" "}
										{new Date(userDetails.user.lastActiveAt).toLocaleDateString()}
									</div>
								)}
							</div>
						</div>
					) : (
						<div className="flex items-center justify-center py-8">
							<RefreshCw className="h-6 w-6 animate-spin text-muted-foreground" />
						</div>
					)}
				</DialogContent>
			</Dialog>

			{/* Delete Confirmation */}
			<AlertDialog
				open={!!deleteConfirmUser}
				onOpenChange={() => setDeleteConfirmUser(null)}
			>
				<AlertDialogContent>
					<AlertDialogHeader>
						<AlertDialogTitle>Delete User?</AlertDialogTitle>
						<AlertDialogDescription>
							This will permanently delete {deleteConfirmUser?.name}'s account and
							all associated data. This action cannot be undone.
						</AlertDialogDescription>
					</AlertDialogHeader>
					<AlertDialogFooter>
						<AlertDialogCancel>Cancel</AlertDialogCancel>
						<AlertDialogAction
							onClick={() =>
								deleteConfirmUser && deleteMutation.mutate(deleteConfirmUser.id)
							}
							className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
						>
							Delete
						</AlertDialogAction>
					</AlertDialogFooter>
				</AlertDialogContent>
			</AlertDialog>

			{/* Bulk Action Confirmation */}
			<AlertDialog
				open={!!bulkActionModal}
				onOpenChange={() => setBulkActionModal(null)}
			>
				<AlertDialogContent>
					<AlertDialogHeader>
						<AlertDialogTitle>
							{bulkActionModal === "approve"
								? "Approve Selected Users?"
								: "Suspend Selected Users?"}
						</AlertDialogTitle>
						<AlertDialogDescription>
							This will{" "}
							{bulkActionModal === "approve" ? "approve" : "suspend"}{" "}
							{selectedUsers.size} selected users.
						</AlertDialogDescription>
					</AlertDialogHeader>
					<AlertDialogFooter>
						<AlertDialogCancel>Cancel</AlertDialogCancel>
						<AlertDialogAction
							onClick={() =>
								bulkMutation.mutate({
									status: bulkActionModal === "approve" ? "approved" : "suspended",
								})
							}
						>
							{bulkActionModal === "approve" ? "Approve All" : "Suspend All"}
						</AlertDialogAction>
					</AlertDialogFooter>
				</AlertDialogContent>
			</AlertDialog>
		</div>
	)
}

// ============================================================================
// Sub-components
// ============================================================================

interface UserRowProps {
	user: UserItem
	currentUserId: string
	isSelected: boolean
	onToggleSelect: () => void
	onApprove: () => void
	onReject: () => void
	onSuspend: () => void
	onReactivate: () => void
	onMakeAdmin: () => void
	onRemoveAdmin: () => void
	onViewDetails: () => void
	onDelete: () => void
}

function UserRow({
	user,
	currentUserId,
	isSelected,
	onToggleSelect,
	onApprove,
	onReject,
	onSuspend,
	onReactivate,
	onMakeAdmin,
	onRemoveAdmin,
	onViewDetails,
	onDelete,
}: UserRowProps) {
	const isCurrentUser = user.id === currentUserId
	const isAdmin = user.role === "admin"

	return (
		<Card className={isSelected ? "ring-2 ring-primary" : ""}>
			<CardContent className="flex items-center gap-4 p-4">
				{/* Checkbox */}
				{!isCurrentUser && (
					<button
						type="button"
						onClick={onToggleSelect}
						className="shrink-0 text-muted-foreground hover:text-foreground"
					>
						{isSelected ? (
							<CheckSquare className="h-5 w-5" />
						) : (
							<Square className="h-5 w-5" />
						)}
					</button>
				)}
				{isCurrentUser && <div className="w-5" />}

				{/* Avatar */}
				<Avatar>
					<AvatarImage src={user.image ?? undefined} />
					<AvatarFallback>{user.name.charAt(0).toUpperCase()}</AvatarFallback>
				</Avatar>

				{/* Info */}
				<div className="flex-1 min-w-0">
					<div className="flex items-center gap-2">
						<span className="font-medium truncate">{user.name}</span>
						{isAdmin && <Crown className="h-4 w-4 text-amber-500 shrink-0" />}
						{isCurrentUser && (
							<Badge variant="secondary" className="text-xs">
								You
							</Badge>
						)}
					</div>
					<p className="text-sm text-muted-foreground truncate">{user.email}</p>
				</div>

				{/* Status */}
				<StatusBadge status={user.status} />

				{/* Last Active */}
				<div className="hidden md:block text-sm text-muted-foreground w-24 text-right">
					{user.lastActiveAt
						? new Date(user.lastActiveAt).toLocaleDateString()
						: "Never"}
				</div>

				{/* Actions */}
				<DropdownMenu>
					<DropdownMenuTrigger asChild>
						<Button variant="ghost" size="icon">
							<MoreHorizontal className="h-4 w-4" />
						</Button>
					</DropdownMenuTrigger>
					<DropdownMenuContent align="end">
						<DropdownMenuItem onClick={onViewDetails}>
							<Eye className="mr-2 h-4 w-4" />
							View Details
						</DropdownMenuItem>
						<DropdownMenuSeparator />

						{/* Status actions */}
						{user.status === "pending" && (
							<>
								<DropdownMenuItem onClick={onApprove}>
									<UserCheck className="mr-2 h-4 w-4 text-green-500" />
									Approve
								</DropdownMenuItem>
								<DropdownMenuItem onClick={onReject}>
									<UserX className="mr-2 h-4 w-4 text-red-500" />
									Reject
								</DropdownMenuItem>
							</>
						)}
						{user.status === "approved" && !isCurrentUser && (
							<DropdownMenuItem onClick={onSuspend}>
								<Ban className="mr-2 h-4 w-4 text-orange-500" />
								Suspend
							</DropdownMenuItem>
						)}
						{user.status === "suspended" && (
							<DropdownMenuItem onClick={onReactivate}>
								<RefreshCw className="mr-2 h-4 w-4 text-green-500" />
								Reactivate
							</DropdownMenuItem>
						)}
						{user.status === "rejected" && (
							<DropdownMenuItem onClick={onApprove}>
								<UserCheck className="mr-2 h-4 w-4 text-green-500" />
								Approve
							</DropdownMenuItem>
						)}

						<DropdownMenuSeparator />

						{/* Role actions */}
						{isAdmin && !isCurrentUser ? (
							<DropdownMenuItem onClick={onRemoveAdmin}>
								<User className="mr-2 h-4 w-4" />
								Remove Admin
							</DropdownMenuItem>
						) : !isAdmin ? (
							<DropdownMenuItem onClick={onMakeAdmin}>
								<Crown className="mr-2 h-4 w-4 text-amber-500" />
								Make Admin
							</DropdownMenuItem>
						) : null}

						{!isCurrentUser && !isAdmin && (
							<>
								<DropdownMenuSeparator />
								<DropdownMenuItem onClick={onDelete} className="text-destructive">
									<Trash2 className="mr-2 h-4 w-4" />
									Delete User
								</DropdownMenuItem>
							</>
						)}
					</DropdownMenuContent>
				</DropdownMenu>
			</CardContent>
		</Card>
	)
}

function StatusBadge({ status }: { status: UserStatus }) {
	const config: Record<UserStatus, { label: string; className: string; icon: typeof Clock }> = {
		pending: {
			label: "Pending",
			className: "bg-amber-100 text-amber-700 dark:bg-amber-900/30 dark:text-amber-400",
			icon: Clock,
		},
		approved: {
			label: "Active",
			className: "bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400",
			icon: CheckCircle,
		},
		suspended: {
			label: "Suspended",
			className: "bg-orange-100 text-orange-700 dark:bg-orange-900/30 dark:text-orange-400",
			icon: Ban,
		},
		rejected: {
			label: "Rejected",
			className: "bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-400",
			icon: XCircle,
		},
	}

	const { label, className, icon: Icon } = config[status]

	return (
		<span
			className={`inline-flex items-center gap-1 rounded-full px-2.5 py-0.5 text-xs font-medium ${className}`}
		>
			<Icon className="h-3 w-3" />
			{label}
		</span>
	)
}

function ActionIcon({ action }: { action: string }) {
	const icons: Record<string, React.ReactNode> = {
		user_approved: <UserCheck className="h-4 w-4 text-green-500" />,
		user_rejected: <UserX className="h-4 w-4 text-red-500" />,
		user_suspended: <Ban className="h-4 w-4 text-orange-500" />,
		user_reactivated: <RefreshCw className="h-4 w-4 text-green-500" />,
		user_role_changed: <Crown className="h-4 w-4 text-amber-500" />,
		user_deleted: <Trash2 className="h-4 w-4 text-red-500" />,
		password_reset_triggered: <RefreshCw className="h-4 w-4 text-blue-500" />,
	}
	return icons[action] || <History className="h-4 w-4" />
}

function ActionLabel({ action }: { action: string }) {
	const labels: Record<string, string> = {
		user_approved: "approved",
		user_rejected: "rejected",
		user_suspended: "suspended",
		user_reactivated: "reactivated",
		user_role_changed: "changed role for",
		user_deleted: "deleted",
		password_reset_triggered: "triggered password reset for",
	}
	return <span>{labels[action] || action}</span>
}

function formatDetails(details: string): string {
	try {
		const parsed = JSON.parse(details)
		if (parsed.reason) return `Reason: ${parsed.reason}`
		if (parsed.previousRole && parsed.newRole) {
			return `${parsed.previousRole} → ${parsed.newRole}`
		}
		if (parsed.bulk) return "Bulk action"
		return ""
	} catch {
		return details
	}
}
