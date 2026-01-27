import { createFileRoute, Link, useRouter } from "@tanstack/react-router"
import { useState } from "react"
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
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import {
	getAllUsers,
	getCurrentUser,
	updateUserStatus,
	updateUserRole,
} from "@/lib/api/users"
import type { UserStatus, UserRole } from "@/db/schema"

type UserItem = NonNullable<Awaited<ReturnType<typeof getAllUsers>>>[number]

export const Route = createFileRoute("/admin/users")({
	loader: async () => {
		const [currentUser, users] = await Promise.all([
			getCurrentUser(),
			getAllUsers(),
		])
		return { currentUser, users }
	},
	component: AdminUsersPage,
})

function AdminUsersPage() {
	const router = useRouter()
	const { currentUser, users } = Route.useLoaderData()
	const [updating, setUpdating] = useState<string | null>(null)

	if (!currentUser || currentUser.role !== "admin") {
		return (
			<div className="flex min-h-[60vh] items-center justify-center">
				<Card className="w-full max-w-md">
					<CardContent className="flex flex-col items-center justify-center py-12">
						<Shield className="h-12 w-12 text-muted-foreground mb-4" />
						<CardTitle className="mb-2">Access Denied</CardTitle>
						<CardDescription className="text-center mb-4">
							You need administrator privileges to access this page.
						</CardDescription>
						<Button asChild>
							<Link to="/">Go to Dashboard</Link>
						</Button>
					</CardContent>
				</Card>
			</div>
		)
	}

	const pendingUsers = users.filter((u: UserItem) => u.status === "pending")
	const approvedUsers = users.filter((u: UserItem) => u.status === "approved")
	const rejectedUsers = users.filter((u: UserItem) => u.status === "rejected")

	const handleStatusChange = async (userId: string, status: UserStatus) => {
		if (status === "pending") return // Can't set to pending
		setUpdating(userId)
		try {
			await updateUserStatus({ userId, status })
			router.invalidate()
		} catch (error) {
			console.error("Failed to update status:", error)
		} finally {
			setUpdating(null)
		}
	}

	const handleRoleChange = async (userId: string, role: UserRole) => {
		setUpdating(userId)
		try {
			await updateUserRole({ userId, role })
			router.invalidate()
		} catch (error) {
			console.error("Failed to update role:", error)
		} finally {
			setUpdating(null)
		}
	}

	return (
		<div className="space-y-8">
			{/* Header */}
			<div>
				<h1 className="text-3xl font-bold tracking-tight">User Management</h1>
				<p className="text-muted-foreground">
					Approve new users and manage access permissions
				</p>
			</div>

			{/* Stats */}
			<div className="grid gap-4 md:grid-cols-3">
				<Card>
					<CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
						<CardTitle className="text-sm font-medium">
							Pending Approval
						</CardTitle>
						<Clock className="h-4 w-4 text-amber-500" />
					</CardHeader>
					<CardContent>
						<div className="text-2xl font-bold">{pendingUsers.length}</div>
					</CardContent>
				</Card>
				<Card>
					<CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
						<CardTitle className="text-sm font-medium">Active Users</CardTitle>
						<CheckCircle className="h-4 w-4 text-green-500" />
					</CardHeader>
					<CardContent>
						<div className="text-2xl font-bold">{approvedUsers.length}</div>
					</CardContent>
				</Card>
				<Card>
					<CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
						<CardTitle className="text-sm font-medium">Rejected</CardTitle>
						<XCircle className="h-4 w-4 text-red-500" />
					</CardHeader>
					<CardContent>
						<div className="text-2xl font-bold">{rejectedUsers.length}</div>
					</CardContent>
				</Card>
			</div>

			{/* Pending Users */}
			{pendingUsers.length > 0 && (
				<div>
					<h2 className="text-xl font-semibold mb-4 flex items-center gap-2">
						<Clock className="h-5 w-5 text-amber-500" />
						Pending Approval ({pendingUsers.length})
					</h2>
					<div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
						{pendingUsers.map((user: UserItem) => (
							<UserCard
								key={user.id}
								user={user}
								currentUserId={currentUser.id}
								updating={updating === user.id}
								onApprove={() => handleStatusChange(user.id, "approved")}
								onReject={() => handleStatusChange(user.id, "rejected")}
								onMakeAdmin={() => handleRoleChange(user.id, "admin")}
								onRemoveAdmin={() => handleRoleChange(user.id, "member")}
							/>
						))}
					</div>
				</div>
			)}

			{/* Approved Users */}
			<div>
				<h2 className="text-xl font-semibold mb-4 flex items-center gap-2">
					<CheckCircle className="h-5 w-5 text-green-500" />
					Active Users ({approvedUsers.length})
				</h2>
				{approvedUsers.length === 0 ? (
					<Card className="border-dashed">
						<CardContent className="flex flex-col items-center justify-center py-12">
							<Users className="h-12 w-12 text-muted-foreground mb-4" />
							<CardTitle className="mb-2">No active users</CardTitle>
							<CardDescription className="text-center">
								Approved users will appear here.
							</CardDescription>
						</CardContent>
					</Card>
				) : (
					<div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
						{approvedUsers.map((user: UserItem) => (
							<UserCard
								key={user.id}
								user={user}
								currentUserId={currentUser.id}
								updating={updating === user.id}
								onApprove={() => handleStatusChange(user.id, "approved")}
								onReject={() => handleStatusChange(user.id, "rejected")}
								onMakeAdmin={() => handleRoleChange(user.id, "admin")}
								onRemoveAdmin={() => handleRoleChange(user.id, "member")}
							/>
						))}
					</div>
				)}
			</div>

			{/* Rejected Users */}
			{rejectedUsers.length > 0 && (
				<div>
					<h2 className="text-xl font-semibold mb-4 flex items-center gap-2">
						<XCircle className="h-5 w-5 text-red-500" />
						Rejected ({rejectedUsers.length})
					</h2>
					<div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
						{rejectedUsers.map((user: UserItem) => (
							<UserCard
								key={user.id}
								user={user}
								currentUserId={currentUser.id}
								updating={updating === user.id}
								onApprove={() => handleStatusChange(user.id, "approved")}
								onReject={() => handleStatusChange(user.id, "rejected")}
								onMakeAdmin={() => handleRoleChange(user.id, "admin")}
								onRemoveAdmin={() => handleRoleChange(user.id, "member")}
							/>
						))}
					</div>
				</div>
			)}
		</div>
	)
}

interface UserCardProps {
	user: {
		id: string
		name: string
		email: string
		image: string | null
		status: UserStatus
		role: UserRole
		createdAt: Date
	}
	currentUserId: string
	updating: boolean
	onApprove: () => void
	onReject: () => void
	onMakeAdmin: () => void
	onRemoveAdmin: () => void
}

function UserCard({
	user,
	currentUserId,
	updating,
	onApprove,
	onReject,
	onMakeAdmin,
	onRemoveAdmin,
}: UserCardProps) {
	const isCurrentUser = user.id === currentUserId
	const isPending = user.status === "pending"
	const isApproved = user.status === "approved"
	const isAdmin = user.role === "admin"

	return (
		<Card className={updating ? "opacity-50" : ""}>
			<CardHeader className="pb-3">
				<div className="flex items-start justify-between">
					<div className="flex items-center gap-3">
						<Avatar className="h-10 w-10">
							<AvatarImage src={user.image ?? undefined} />
							<AvatarFallback>
								{user.name.charAt(0).toUpperCase()}
							</AvatarFallback>
						</Avatar>
						<div>
							<CardTitle className="text-base flex items-center gap-2">
								{user.name}
								{isAdmin && (
									<span title="Admin">
										<Crown className="h-4 w-4 text-amber-500" />
									</span>
								)}
								{isCurrentUser && (
									<span className="text-xs bg-primary/10 text-primary px-1.5 py-0.5 rounded">
										You
									</span>
								)}
							</CardTitle>
							<CardDescription className="text-sm">{user.email}</CardDescription>
						</div>
					</div>
					<DropdownMenu>
						<DropdownMenuTrigger asChild>
							<Button variant="ghost" size="icon" disabled={updating}>
								<MoreHorizontal className="h-4 w-4" />
							</Button>
						</DropdownMenuTrigger>
						<DropdownMenuContent align="end">
							{isPending && (
								<>
									<DropdownMenuItem onClick={onApprove}>
										<UserCheck className="mr-2 h-4 w-4 text-green-500" />
										Approve
									</DropdownMenuItem>
									<DropdownMenuItem onClick={onReject}>
										<UserX className="mr-2 h-4 w-4 text-red-500" />
										Reject
									</DropdownMenuItem>
									<DropdownMenuSeparator />
								</>
							)}
							{!isPending && !isApproved && (
								<DropdownMenuItem onClick={onApprove}>
									<UserCheck className="mr-2 h-4 w-4 text-green-500" />
									Approve
								</DropdownMenuItem>
							)}
							{isApproved && !isCurrentUser && (
								<DropdownMenuItem onClick={onReject}>
									<UserX className="mr-2 h-4 w-4 text-red-500" />
									Revoke Access
								</DropdownMenuItem>
							)}
							<DropdownMenuSeparator />
							{isAdmin ? (
								<DropdownMenuItem
									onClick={onRemoveAdmin}
									disabled={isCurrentUser}
								>
									<User className="mr-2 h-4 w-4" />
									Remove Admin
								</DropdownMenuItem>
							) : (
								<DropdownMenuItem onClick={onMakeAdmin}>
									<Crown className="mr-2 h-4 w-4 text-amber-500" />
									Make Admin
								</DropdownMenuItem>
							)}
						</DropdownMenuContent>
					</DropdownMenu>
				</div>
			</CardHeader>
			<CardContent className="pt-0">
				<div className="flex items-center justify-between text-sm">
					<StatusBadge status={user.status} />
					<span className="text-muted-foreground">
						Joined {new Date(user.createdAt).toLocaleDateString()}
					</span>
				</div>
			</CardContent>
		</Card>
	)
}

function StatusBadge({ status }: { status: UserStatus }) {
	const config = {
		pending: {
			label: "Pending",
			className: "bg-amber-100 text-amber-700",
			icon: Clock,
		},
		approved: {
			label: "Approved",
			className: "bg-green-100 text-green-700",
			icon: CheckCircle,
		},
		rejected: {
			label: "Rejected",
			className: "bg-red-100 text-red-700",
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
