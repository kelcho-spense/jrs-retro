import { createFileRoute, Link, useRouter } from "@tanstack/react-router"
import { useState } from "react"
import { User, Mail, Calendar, Shield, Pencil, Save, X, Crown } from "lucide-react"

import { Button } from "@/components/ui/button"
import {
	Card,
	CardContent,
	CardDescription,
	CardHeader,
	CardTitle,
} from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { UserAvatar } from "@/components/UserAvatar"
import { getCurrentUser, updateProfile } from "@/lib/api/users"

export const Route = createFileRoute("/profile")({
	loader: async () => {
		const user = await getCurrentUser()
		return { user }
	},
	component: ProfilePage,
})

function ProfilePage() {
	const router = useRouter()
	const { user } = Route.useLoaderData()
	const [isEditing, setIsEditing] = useState(false)
	const [saving, setSaving] = useState(false)
	const [formData, setFormData] = useState({
		name: user?.name ?? "",
		bio: user?.bio ?? "",
	})

	if (!user) {
		return (
			<div className="flex min-h-[60vh] items-center justify-center">
				<Card className="w-full max-w-md">
					<CardContent className="flex flex-col items-center justify-center py-12">
						<User className="h-12 w-12 text-muted-foreground mb-4" />
						<CardTitle className="mb-2">Not Logged In</CardTitle>
						<CardDescription className="text-center mb-4">
							Please sign in to view your profile.
						</CardDescription>
						<Button asChild>
							<Link to="/sign-in">Sign In</Link>
						</Button>
					</CardContent>
				</Card>
			</div>
		)
	}

	const handleSave = async () => {
		setSaving(true)
		try {
			await updateProfile(formData)
			setIsEditing(false)
			router.invalidate()
		} catch (error) {
			console.error("Failed to update profile:", error)
		} finally {
			setSaving(false)
		}
	}

	const handleCancel = () => {
		setFormData({
			name: user.name,
			bio: user.bio ?? "",
		})
		setIsEditing(false)
	}

	const StatusBadge = ({ status }: { status: string }) => {
		const config: Record<string, { label: string; className: string }> = {
			pending: {
				label: "Pending Approval",
				className: "bg-amber-100 text-amber-700",
			},
			approved: {
				label: "Active",
				className: "bg-green-100 text-green-700",
			},
			rejected: {
				label: "Access Denied",
				className: "bg-red-100 text-red-700",
			},
		}
		const { label, className } = config[status] ?? {
			label: status,
			className: "bg-gray-100 text-gray-700",
		}
		return (
			<span
				className={`inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-medium ${className}`}
			>
				{label}
			</span>
		)
	}

	return (
		<div className="max-w-2xl mx-auto space-y-6">
			{/* Header */}
			<div>
				<h1 className="text-3xl font-bold tracking-tight">My Profile</h1>
				<p className="text-muted-foreground">
					View and manage your account information
				</p>
			</div>

			{/* Profile Card */}
			<Card>
				<CardHeader>
					<div className="flex items-start justify-between">
						<div className="flex items-center gap-4">
							<UserAvatar
								image={user.image}
								name={user.name}
								userId={user.id}
								size="xl"
							/>
							<div>
								<CardTitle className="text-2xl flex items-center gap-2">
									{user.name}
									{user.role === "admin" && (
									<span title="Admin">
										<Crown className="h-5 w-5 text-amber-500" />
									</span>
									)}
								</CardTitle>
								<CardDescription className="text-base">
									{user.email}
								</CardDescription>
								<div className="mt-2">
									<StatusBadge status={user.status} />
								</div>
							</div>
						</div>
						{!isEditing && (
							<Button
								variant="outline"
								size="sm"
								onClick={() => setIsEditing(true)}
							>
								<Pencil className="mr-2 h-4 w-4" />
								Edit
							</Button>
						)}
					</div>
				</CardHeader>
				<CardContent className="space-y-6">
					{isEditing ? (
						<>
							<div className="space-y-2">
								<Label htmlFor="name">Display Name</Label>
								<Input
									id="name"
									value={formData.name}
									onChange={(e) =>
										setFormData((prev) => ({ ...prev, name: e.target.value }))
									}
									placeholder="Your display name"
								/>
							</div>
							<div className="space-y-2">
								<Label htmlFor="bio">Bio</Label>
								<Textarea
									id="bio"
									value={formData.bio}
									onChange={(e) =>
										setFormData((prev) => ({ ...prev, bio: e.target.value }))
									}
									placeholder="Tell us a little about yourself..."
									rows={4}
								/>
							</div>
							<div className="flex gap-2">
								<Button onClick={handleSave} disabled={saving}>
									<Save className="mr-2 h-4 w-4" />
									{saving ? "Saving..." : "Save Changes"}
								</Button>
								<Button
									variant="outline"
									onClick={handleCancel}
									disabled={saving}
								>
									<X className="mr-2 h-4 w-4" />
									Cancel
								</Button>
							</div>
						</>
					) : (
						<>
							{user.bio && (
								<div>
									<h3 className="text-sm font-medium text-muted-foreground mb-1">
										Bio
									</h3>
									<p className="text-sm">{user.bio}</p>
								</div>
							)}
							{!user.bio && (
								<div className="text-sm text-muted-foreground italic">
									No bio added yet.{" "}
									<button
										type="button"
										onClick={() => setIsEditing(true)}
										className="text-primary hover:underline"
									>
										Add one now
									</button>
								</div>
							)}
						</>
					)}
				</CardContent>
			</Card>

			{/* Account Details */}
			<Card>
				<CardHeader>
					<CardTitle>Account Details</CardTitle>
				</CardHeader>
				<CardContent className="space-y-4">
					<div className="flex items-center gap-3">
						<Mail className="h-5 w-5 text-muted-foreground" />
						<div>
							<p className="text-sm font-medium">Email</p>
							<p className="text-sm text-muted-foreground">{user.email}</p>
						</div>
					</div>
					<div className="flex items-center gap-3">
						<Shield className="h-5 w-5 text-muted-foreground" />
						<div>
							<p className="text-sm font-medium">Role</p>
							<p className="text-sm text-muted-foreground capitalize">
								{user.role}
							</p>
						</div>
					</div>
					<div className="flex items-center gap-3">
						<Calendar className="h-5 w-5 text-muted-foreground" />
						<div>
							<p className="text-sm font-medium">Member Since</p>
							<p className="text-sm text-muted-foreground">
								{new Date(user.createdAt).toLocaleDateString("en-US", {
									year: "numeric",
									month: "long",
									day: "numeric",
								})}
							</p>
						</div>
					</div>
				</CardContent>
			</Card>

			{/* Admin Section */}
			{user.role === "admin" && (
				<Card className="border-amber-200 bg-amber-50/50">
					<CardHeader>
						<CardTitle className="flex items-center gap-2">
							<Crown className="h-5 w-5 text-amber-500" />
							Administrator
						</CardTitle>
						<CardDescription>
							You have administrator privileges
						</CardDescription>
					</CardHeader>
					<CardContent>
						<Button asChild variant="outline">
							<Link to="/admin/users">Manage Users</Link>
						</Button>
					</CardContent>
				</Card>
			)}
		</div>
	)
}
