import { createFileRoute, useRouter } from "@tanstack/react-router"
import { useState } from "react"
import { Shield, Eye, EyeOff, Check, AlertTriangle } from "lucide-react"

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
import { Alert, AlertDescription } from "@/components/ui/alert"
import { authClient } from "@/lib/auth-client"
import { getCurrentUser } from "@/lib/api/users"

export const Route = createFileRoute("/dashboard/security")({
	loader: async () => {
		const user = await getCurrentUser()
		return { user }
	},
	component: SecurityPage,
})

function SecurityPage() {
	const router = useRouter()
	const { user } = Route.useLoaderData()

	const [currentPassword, setCurrentPassword] = useState("")
	const [newPassword, setNewPassword] = useState("")
	const [confirmPassword, setConfirmPassword] = useState("")
	const [showCurrentPassword, setShowCurrentPassword] = useState(false)
	const [showNewPassword, setShowNewPassword] = useState(false)
	const [showConfirmPassword, setShowConfirmPassword] = useState(false)
	const [loading, setLoading] = useState(false)
	const [error, setError] = useState("")
	const [success, setSuccess] = useState(false)

	const handleChangePassword = async (e: React.FormEvent) => {
		e.preventDefault()
		setError("")
		setSuccess(false)

		if (newPassword !== confirmPassword) {
			setError("New passwords do not match")
			return
		}

		if (newPassword.length < 8) {
			setError("New password must be at least 8 characters")
			return
		}

		setLoading(true)
		try {
			const result = await authClient.changePassword({
				currentPassword,
				newPassword,
				revokeOtherSessions: false,
			})

			if (result.error) {
				setError(result.error.message ?? "Failed to change password")
			} else {
				setSuccess(true)
				setCurrentPassword("")
				setNewPassword("")
				setConfirmPassword("")
			}
		} catch {
			setError("An unexpected error occurred")
		} finally {
			setLoading(false)
		}
	}

	const passwordStrength = getPasswordStrength(newPassword)

	return (
		<div className="space-y-6">
			<div>
				<h2 className="text-2xl font-bold tracking-tight">Security</h2>
				<p className="text-muted-foreground">
					Manage your password and security settings
				</p>
			</div>

			{/* Change Password */}
			<Card>
				<CardHeader>
					<CardTitle className="flex items-center gap-2">
						<Shield className="h-5 w-5" />
						Change Password
					</CardTitle>
					<CardDescription>
						Update your password to keep your account secure
					</CardDescription>
				</CardHeader>
				<CardContent>
					<form onSubmit={handleChangePassword} className="space-y-4">
						{error && (
							<Alert variant="destructive">
								<AlertTriangle className="h-4 w-4" />
								<AlertDescription>{error}</AlertDescription>
							</Alert>
						)}

						{success && (
							<Alert className="border-green-200 bg-green-50 text-green-800 dark:border-green-800 dark:bg-green-900/20 dark:text-green-400">
								<Check className="h-4 w-4" />
								<AlertDescription>
									Password changed successfully!
								</AlertDescription>
							</Alert>
						)}

						<div className="space-y-2">
							<Label htmlFor="currentPassword">Current Password</Label>
							<div className="relative">
								<Input
									id="currentPassword"
									type={showCurrentPassword ? "text" : "password"}
									value={currentPassword}
									onChange={(e) => setCurrentPassword(e.target.value)}
									required
								/>
								<Button
									type="button"
									variant="ghost"
									size="icon"
									className="absolute right-0 top-0 h-full px-3"
									onClick={() => setShowCurrentPassword(!showCurrentPassword)}
								>
									{showCurrentPassword ? (
										<EyeOff className="h-4 w-4" />
									) : (
										<Eye className="h-4 w-4" />
									)}
								</Button>
							</div>
						</div>

						<div className="space-y-2">
							<Label htmlFor="newPassword">New Password</Label>
							<div className="relative">
								<Input
									id="newPassword"
									type={showNewPassword ? "text" : "password"}
									value={newPassword}
									onChange={(e) => setNewPassword(e.target.value)}
									required
								/>
								<Button
									type="button"
									variant="ghost"
									size="icon"
									className="absolute right-0 top-0 h-full px-3"
									onClick={() => setShowNewPassword(!showNewPassword)}
								>
									{showNewPassword ? (
										<EyeOff className="h-4 w-4" />
									) : (
										<Eye className="h-4 w-4" />
									)}
								</Button>
							</div>
							{newPassword && (
								<div className="space-y-1">
									<div className="flex gap-1">
										{[1, 2, 3, 4].map((level) => (
											<div
												key={level}
												className={`h-1 flex-1 rounded ${
													passwordStrength >= level
														? passwordStrength === 1
															? "bg-red-500"
															: passwordStrength === 2
																? "bg-orange-500"
																: passwordStrength === 3
																	? "bg-yellow-500"
																	: "bg-green-500"
														: "bg-muted"
												}`}
											/>
										))}
									</div>
									<p className="text-xs text-muted-foreground">
										{passwordStrength === 1 && "Weak password"}
										{passwordStrength === 2 && "Fair password"}
										{passwordStrength === 3 && "Good password"}
										{passwordStrength === 4 && "Strong password"}
									</p>
								</div>
							)}
						</div>

						<div className="space-y-2">
							<Label htmlFor="confirmPassword">Confirm New Password</Label>
							<div className="relative">
								<Input
									id="confirmPassword"
									type={showConfirmPassword ? "text" : "password"}
									value={confirmPassword}
									onChange={(e) => setConfirmPassword(e.target.value)}
									required
								/>
								<Button
									type="button"
									variant="ghost"
									size="icon"
									className="absolute right-0 top-0 h-full px-3"
									onClick={() => setShowConfirmPassword(!showConfirmPassword)}
								>
									{showConfirmPassword ? (
										<EyeOff className="h-4 w-4" />
									) : (
										<Eye className="h-4 w-4" />
									)}
								</Button>
							</div>
							{confirmPassword && newPassword !== confirmPassword && (
								<p className="text-xs text-destructive">Passwords do not match</p>
							)}
						</div>

						<Button type="submit" disabled={loading}>
							{loading ? "Changing..." : "Change Password"}
						</Button>
					</form>
				</CardContent>
			</Card>

			{/* Account Info */}
			<Card>
				<CardHeader>
					<CardTitle>Account Information</CardTitle>
					<CardDescription>
						Your account was created on{" "}
						{new Date(user?.createdAt ?? "").toLocaleDateString()}
					</CardDescription>
				</CardHeader>
				<CardContent>
					<div className="text-sm text-muted-foreground">
						<p>
							Last updated:{" "}
							{new Date(user?.updatedAt ?? "").toLocaleDateString()}
						</p>
					</div>
				</CardContent>
			</Card>
		</div>
	)
}

function getPasswordStrength(password: string): number {
	if (!password) return 0

	let strength = 0

	// Length check
	if (password.length >= 8) strength++
	if (password.length >= 12) strength++

	// Character variety
	if (/[a-z]/.test(password) && /[A-Z]/.test(password)) strength++
	if (/[0-9]/.test(password) && /[^a-zA-Z0-9]/.test(password)) strength++

	return Math.min(strength, 4)
}
