import { createFileRoute, Link, useSearch } from "@tanstack/react-router"
import { useState, useMemo } from "react"
import {
	Lock,
	ArrowLeft,
	Loader2,
	AlertCircle,
	CheckCircle2,
	Eye,
	EyeOff,
} from "lucide-react"
import { z } from "zod"

import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { authClient } from "@/lib/auth-client"

const searchSchema = z.object({
	token: z.string().optional(),
})

export const Route = createFileRoute("/auth/reset-password")({
	validateSearch: searchSchema,
	component: ResetPasswordPage,
})

function ResetPasswordPage() {
	const { token } = useSearch({ from: "/auth/reset-password" })
	const [formData, setFormData] = useState({
		password: "",
		confirmPassword: "",
	})
	const [showPassword, setShowPassword] = useState(false)
	const [showConfirmPassword, setShowConfirmPassword] = useState(false)
	const [isLoading, setIsLoading] = useState(false)
	const [error, setError] = useState<string | null>(null)
	const [isSuccess, setIsSuccess] = useState(false)

	const passwordRequirements = useMemo(() => {
		const { password } = formData
		return [
			{ label: "At least 8 characters", met: password.length >= 8 },
			{ label: "Contains a number", met: /\d/.test(password) },
			{
				label: "Contains uppercase letter",
				met: /[A-Z]/.test(password),
			},
			{
				label: "Contains lowercase letter",
				met: /[a-z]/.test(password),
			},
		]
	}, [formData.password])

	const allRequirementsMet = passwordRequirements.every((req) => req.met)
	const passwordsMatch =
		formData.password === formData.confirmPassword &&
		formData.confirmPassword.length > 0

	const handleSubmit = async (e: React.FormEvent) => {
		e.preventDefault()
		setError(null)

		if (!token) {
			setError("Missing reset token. Please request a new password reset link.")
			return
		}

		if (!allRequirementsMet) {
			setError("Please meet all password requirements")
			return
		}

		if (!passwordsMatch) {
			setError("Passwords do not match")
			return
		}

		setIsLoading(true)

		try {
			await authClient.resetPassword({
				newPassword: formData.password,
				token,
			})
			setIsSuccess(true)
		} catch (err: unknown) {
			const message =
				err instanceof Error ? err.message : "Failed to reset password"
			setError(message)
		} finally {
			setIsLoading(false)
		}
	}

	if (!token) {
		return (
			<div className="space-y-6">
				<div className="text-center">
					<div className="w-16 h-16 mx-auto bg-destructive/10 rounded-full flex items-center justify-center mb-4">
						<AlertCircle className="w-8 h-8 text-destructive" />
					</div>
					<h2 className="text-2xl font-bold text-foreground">Invalid Link</h2>
					<p className="text-muted-foreground mt-2">
						This password reset link is invalid or has expired.
					</p>
				</div>

				<div className="space-y-3">
					<Link to="/auth/forgot-password">
						<Button className="w-full">Request New Reset Link</Button>
					</Link>
					<a
						href="/sign-in"
						className="flex items-center justify-center gap-2 text-muted-foreground hover:text-foreground transition-colors"
					>
						<ArrowLeft className="w-4 h-4" />
						Back to sign in
					</a>
				</div>
			</div>
		)
	}

	if (isSuccess) {
		return (
			<div className="space-y-6">
				<div className="text-center">
					<div className="w-16 h-16 mx-auto bg-green-500/10 rounded-full flex items-center justify-center mb-4">
						<CheckCircle2 className="w-8 h-8 text-green-600 dark:text-green-400" />
					</div>
					<h2 className="text-2xl font-bold text-foreground">
						Password Reset!
					</h2>
					<p className="text-muted-foreground mt-2">
						Your password has been successfully reset. You can now sign in with
						your new password.
					</p>
				</div>

				<a href="/sign-in">
					<Button className="w-full">Sign In</Button>
				</a>
			</div>
		)
	}

	return (
		<div className="space-y-6">
			<div className="text-center lg:text-left">
				<h2 className="text-2xl font-bold text-foreground">
					Set new password
				</h2>
				<p className="text-muted-foreground mt-2">
					Your new password must be different from previously used passwords.
				</p>
			</div>

			{error && (
				<div className="p-4 bg-destructive/10 border border-destructive/20 rounded-lg flex items-center gap-3">
					<AlertCircle className="w-5 h-5 text-destructive" />
					<span className="text-destructive text-sm">{error}</span>
				</div>
			)}

			<form onSubmit={handleSubmit} className="space-y-4">
				<div className="space-y-2">
					<Label htmlFor="password" className="text-foreground">
						New Password
					</Label>
					<div className="relative">
						<Lock className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-muted-foreground" />
						<Input
							id="password"
							type={showPassword ? "text" : "password"}
							placeholder="Enter new password"
							value={formData.password}
							onChange={(e) =>
								setFormData({ ...formData, password: e.target.value })
							}
							className="pl-10 pr-10"
							required
						/>
						<button
							type="button"
							onClick={() => setShowPassword(!showPassword)}
							className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground"
						>
							{showPassword ? (
								<EyeOff className="w-5 h-5" />
							) : (
								<Eye className="w-5 h-5" />
							)}
						</button>
					</div>
					{formData.password && (
						<div className="mt-2 space-y-1">
							{passwordRequirements.map((req, i) => (
								<div key={i} className="flex items-center gap-2 text-sm">
									<CheckCircle2
										className={`w-4 h-4 ${
											req.met
												? "text-green-600 dark:text-green-400"
												: "text-muted-foreground"
										}`}
									/>
									<span
										className={
											req.met
												? "text-green-600 dark:text-green-400"
												: "text-muted-foreground"
										}
									>
										{req.label}
									</span>
								</div>
							))}
						</div>
					)}
				</div>

				<div className="space-y-2">
					<Label htmlFor="confirmPassword" className="text-foreground">
						Confirm Password
					</Label>
					<div className="relative">
						<Lock className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-muted-foreground" />
						<Input
							id="confirmPassword"
							type={showConfirmPassword ? "text" : "password"}
							placeholder="Confirm new password"
							value={formData.confirmPassword}
							onChange={(e) =>
								setFormData({ ...formData, confirmPassword: e.target.value })
							}
							className="pl-10 pr-10"
							required
						/>
						<button
							type="button"
							onClick={() => setShowConfirmPassword(!showConfirmPassword)}
							className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground"
						>
							{showConfirmPassword ? (
								<EyeOff className="w-5 h-5" />
							) : (
								<Eye className="w-5 h-5" />
							)}
						</button>
					</div>
					{formData.confirmPassword && (
						<div className="flex items-center gap-2 text-sm mt-2">
							<CheckCircle2
								className={`w-4 h-4 ${
									passwordsMatch
										? "text-green-600 dark:text-green-400"
										: "text-muted-foreground"
								}`}
							/>
							<span
								className={
									passwordsMatch
										? "text-green-600 dark:text-green-400"
										: "text-muted-foreground"
								}
							>
								Passwords match
							</span>
						</div>
					)}
				</div>

				<Button
					type="submit"
					disabled={isLoading || !allRequirementsMet || !passwordsMatch}
					className="w-full"
				>
					{isLoading ? (
						<>
							<Loader2 className="w-4 h-4 mr-2 animate-spin" />
							Resetting...
						</>
					) : (
						"Reset Password"
					)}
				</Button>
			</form>

			<a
				href="/sign-in"
				className="flex items-center justify-center gap-2 text-muted-foreground hover:text-foreground transition-colors"
			>
				<ArrowLeft className="w-4 h-4" />
				Back to sign in
			</a>
		</div>
	)
}
