import { createFileRoute } from "@tanstack/react-router"
import { useState } from "react"
import { Mail, ArrowLeft, Loader2, AlertCircle, CheckCircle2 } from "lucide-react"

import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { authClient } from "@/lib/auth-client"

export const Route = createFileRoute("/auth/forgot-password")({
	component: ForgotPasswordPage,
})

function ForgotPasswordPage() {
	const [email, setEmail] = useState("")
	const [isLoading, setIsLoading] = useState(false)
	const [error, setError] = useState<string | null>(null)
	const [isSubmitted, setIsSubmitted] = useState(false)

	const handleSubmit = async (e: React.FormEvent) => {
		e.preventDefault()
		setError(null)
		setIsLoading(true)

		try {
			await authClient.forgetPassword({
				email,
				redirectTo: "/auth/reset-password",
			})
			setIsSubmitted(true)
		} catch (err: unknown) {
			const message =
				err instanceof Error ? err.message : "Failed to send reset email"
			setError(message)
		} finally {
			setIsLoading(false)
		}
	}

	if (isSubmitted) {
		return (
			<div className="space-y-6">
				<div className="text-center">
					<div className="w-16 h-16 mx-auto bg-green-500/10 rounded-full flex items-center justify-center mb-4">
						<CheckCircle2 className="w-8 h-8 text-green-600 dark:text-green-400" />
					</div>
					<h2 className="text-2xl font-bold text-foreground">
						Check your email
					</h2>
					<p className="text-muted-foreground mt-2">
						We've sent a password reset link to
						<br />
						<span className="text-foreground font-medium">{email}</span>
					</p>
				</div>

				<div className="bg-muted/50 rounded-lg p-4">
					<p className="text-sm text-muted-foreground text-center">
						Didn't receive the email? Check your spam folder or{" "}
						<button
							type="button"
							onClick={() => setIsSubmitted(false)}
							className="text-primary hover:underline"
						>
							try another email
						</button>
					</p>
				</div>

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

	return (
		<div className="space-y-6">
			<div className="text-center lg:text-left">
				<h2 className="text-2xl font-bold text-foreground">Forgot password?</h2>
				<p className="text-muted-foreground mt-2">
					No worries, we'll send you reset instructions.
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
					<Label htmlFor="email" className="text-foreground">
						Email
					</Label>
					<div className="relative">
						<Mail className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-muted-foreground" />
						<Input
							id="email"
							type="email"
							placeholder="Enter your email"
							value={email}
							onChange={(e) => setEmail(e.target.value)}
							className="pl-10"
							required
						/>
					</div>
				</div>

				<Button type="submit" disabled={isLoading} className="w-full">
					{isLoading ? (
						<>
							<Loader2 className="w-4 h-4 mr-2 animate-spin" />
							Sending...
						</>
					) : (
						"Send Reset Link"
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
