import { createFileRoute, Link, useSearch } from "@tanstack/react-router"
import { useState, useEffect } from "react"
import {
	Mail,
	Loader2,
	AlertCircle,
	CheckCircle2,
	ArrowLeft,
} from "lucide-react"
import { z } from "zod"

import { Button } from "@/components/ui/button"
import { authClient } from "@/lib/auth-client"

const searchSchema = z.object({
	token: z.string().optional(),
})

export const Route = createFileRoute("/auth/verify-email")({
	validateSearch: searchSchema,
	component: VerifyEmailPage,
})

function VerifyEmailPage() {
	const { token } = useSearch({ from: "/auth/verify-email" })
	const [status, setStatus] = useState<
		"loading" | "success" | "error" | "no-token"
	>(token ? "loading" : "no-token")
	const [error, setError] = useState<string | null>(null)

	useEffect(() => {
		if (!token) {
			setStatus("no-token")
			return
		}

		const verifyEmail = async () => {
			try {
				await authClient.verifyEmail({
					query: {
						token,
					},
				})
				setStatus("success")
			} catch (err: unknown) {
				const message =
					err instanceof Error ? err.message : "Failed to verify email"
				setError(message)
				setStatus("error")
			}
		}

		verifyEmail()
	}, [token])

	if (status === "loading") {
		return (
			<div className="space-y-6">
				<div className="text-center">
					<div className="w-16 h-16 mx-auto bg-primary/10 rounded-full flex items-center justify-center mb-4">
						<Loader2 className="w-8 h-8 text-primary animate-spin" />
					</div>
					<h2 className="text-2xl font-bold text-foreground">
						Verifying your email
					</h2>
					<p className="text-muted-foreground mt-2">
						Please wait while we verify your email address...
					</p>
				</div>
			</div>
		)
	}

	if (status === "success") {
		return (
			<div className="space-y-6">
				<div className="text-center">
					<div className="w-16 h-16 mx-auto bg-green-500/10 rounded-full flex items-center justify-center mb-4">
						<CheckCircle2 className="w-8 h-8 text-green-600 dark:text-green-400" />
					</div>
					<h2 className="text-2xl font-bold text-foreground">
						Email Verified!
					</h2>
					<p className="text-muted-foreground mt-2">
						Your email has been successfully verified. You can now access all
						features.
					</p>
				</div>

				<Link to="/dashboard">
					<Button className="w-full">Go to Dashboard</Button>
				</Link>
			</div>
		)
	}

	if (status === "error") {
		return (
			<div className="space-y-6">
				<div className="text-center">
					<div className="w-16 h-16 mx-auto bg-destructive/10 rounded-full flex items-center justify-center mb-4">
						<AlertCircle className="w-8 h-8 text-destructive" />
					</div>
					<h2 className="text-2xl font-bold text-foreground">
						Verification Failed
					</h2>
					<p className="text-muted-foreground mt-2">
						{error || "We couldn't verify your email. The link may have expired."}
					</p>
				</div>

				<div className="space-y-3">
					<Button className="w-full" variant="outline">
						Resend Verification Email
					</Button>
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

	// no-token state
	return (
		<div className="space-y-6">
			<div className="text-center">
				<div className="w-16 h-16 mx-auto bg-muted rounded-full flex items-center justify-center mb-4">
					<Mail className="w-8 h-8 text-muted-foreground" />
				</div>
				<h2 className="text-2xl font-bold text-foreground">
					Check Your Email
				</h2>
				<p className="text-muted-foreground mt-2">
					We've sent a verification link to your email address. Please click the
					link to verify your account.
				</p>
			</div>

			<div className="bg-muted/50 rounded-lg p-4">
				<p className="text-sm text-muted-foreground text-center">
					Didn't receive the email? Check your spam folder or request a new
					verification email from your profile settings.
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
