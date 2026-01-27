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
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { Badge } from "@/components/ui/badge"
import { getCurrentUser, updateProfile } from "@/lib/api/users"

export const Route = createFileRoute("/dashboard/profile")({
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
			<div className="flex items-center justify-center py-12">
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
			await updateProfile({ data: formData })
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

	return (
		<div className="space-y-6">
			<div>
				<h2 className="text-2xl font-bold tracking-tight">Profile</h2>
				<p className="text-muted-foreground">
					Manage your personal information
				</p>
			</div>

			{/* Profile Card */}
			<Card>
				<CardHeader>
					<div className="flex items-start justify-between">
						<div className="flex items-center gap-4">
							<Avatar className="h-20 w-20">
								<AvatarImage src={user.image ?? undefined} />
								<AvatarFallback className="text-2xl">
									{user.name.charAt(0).toUpperCase()}
								</AvatarFallback>
							</Avatar>
							<div>
								<CardTitle className="flex items-center gap-2">
									{user.name}
									{user.role === "admin" && (
										<Crown className="h-4 w-4 text-amber-500" />
									)}
								</CardTitle>
								<CardDescription>{user.email}</CardDescription>
								<div className="flex items-center gap-2 mt-2">
									<Badge variant="secondary">{user.role}</Badge>
									<StatusBadge status={user.status} />
								</div>
							</div>
						</div>
						{!isEditing && (
							<Button variant="outline" size="sm" onClick={() => setIsEditing(true)}>
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
								<Label htmlFor="name">Name</Label>
								<Input
									id="name"
									value={formData.name}
									onChange={(e) =>
										setFormData({ ...formData, name: e.target.value })
									}
								/>
							</div>
							<div className="space-y-2">
								<Label htmlFor="bio">Bio</Label>
								<Textarea
									id="bio"
									placeholder="Tell us about yourself..."
									value={formData.bio}
									onChange={(e) =>
										setFormData({ ...formData, bio: e.target.value })
									}
								/>
							</div>
							<div className="flex gap-2">
								<Button onClick={handleSave} disabled={saving}>
									<Save className="mr-2 h-4 w-4" />
									{saving ? "Saving..." : "Save Changes"}
								</Button>
								<Button variant="outline" onClick={handleCancel}>
									<X className="mr-2 h-4 w-4" />
									Cancel
								</Button>
							</div>
						</>
					) : (
						<>
							<div className="space-y-4">
								<div className="flex items-center gap-2 text-sm">
									<Mail className="h-4 w-4 text-muted-foreground" />
									<span>{user.email}</span>
								</div>
								<div className="flex items-center gap-2 text-sm">
									<Calendar className="h-4 w-4 text-muted-foreground" />
									<span>
										Joined {new Date(user.createdAt).toLocaleDateString()}
									</span>
								</div>
								<div className="flex items-center gap-2 text-sm">
									<Shield className="h-4 w-4 text-muted-foreground" />
									<span className="capitalize">{user.role}</span>
								</div>
							</div>
							{user.bio && (
								<div>
									<h4 className="text-sm font-medium mb-1">Bio</h4>
									<p className="text-sm text-muted-foreground">{user.bio}</p>
								</div>
							)}
						</>
					)}
				</CardContent>
			</Card>
		</div>
	)
}

function StatusBadge({ status }: { status: string }) {
	const config: Record<string, { label: string; className: string }> = {
		pending: {
			label: "Pending",
			className: "bg-amber-100 text-amber-700 dark:bg-amber-900/30 dark:text-amber-400",
		},
		approved: {
			label: "Active",
			className: "bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400",
		},
		suspended: {
			label: "Suspended",
			className: "bg-orange-100 text-orange-700 dark:bg-orange-900/30 dark:text-orange-400",
		},
		rejected: {
			label: "Rejected",
			className: "bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-400",
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
