import { createFileRoute, Link, useNavigate, useRouter } from "@tanstack/react-router"
import { useState } from "react"
import { Clock, XCircle, Eye, EyeOff } from "lucide-react"

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
import { authClient } from "@/lib/auth-client"
import { getCurrentUser } from "@/lib/api/users"

export const Route = createFileRoute("/sign-in")({
	component: SignInPage,
})

function SignInPage() {
	const navigate = useNavigate()
	const router = useRouter()
	const [email, setEmail] = useState("")
	const [password, setPassword] = useState("")
	const [showPassword, setShowPassword] = useState(false)
	const [error, setError] = useState("")
	const [loading, setLoading] = useState(false)
	const [pendingApproval, setPendingApproval] = useState(false)
	const [rejected, setRejected] = useState(false)

	const handleSubmit = async (e: React.FormEvent) => {
		e.preventDefault()
		setError("")
		setPendingApproval(false)
		setRejected(false)
		setLoading(true)

		try {
			const result = await authClient.signIn.email({
				email,
				password,
			})

			if (result.error) {
				setError(result.error.message ?? "Sign in failed")
			} else {
				// Check user status after successful auth
				const user = await getCurrentUser()

				if (!user) {
					setError("Unable to retrieve user information")
					await authClient.signOut()
					return
				}

				if (user.status === "pending") {
					setPendingApproval(true)
					await authClient.signOut()
					return
				}

				if (user.status === "rejected") {
					setRejected(true)
					await authClient.signOut()
					return
				}

				// User is approved, invalidate router cache and proceed to dashboard
				await router.invalidate()
				navigate({ to: "/" })
			}
		} catch {
			setError("An unexpected error occurred")
		} finally {
			setLoading(false)
		}
	}

	if (pendingApproval) {
		return (
			<div className="flex min-h-[80vh] items-center justify-center">
				<Card className="w-full max-w-md">
					<CardContent className="flex flex-col items-center justify-center py-12">
						<Clock className="h-12 w-12 text-amber-500 mb-4" />
						<CardTitle className="mb-2 text-center">
							Approval Pending
						</CardTitle>
						<CardDescription className="text-center mb-6">
							Your account is awaiting administrator approval. Please check back
							later or contact an administrator.
						</CardDescription>
						<Button
							variant="outline"
							onClick={() => {
								setPendingApproval(false)
								setEmail("")
								setPassword("")
							}}
						>
							Try Another Account
						</Button>
					</CardContent>
				</Card>
			</div>
		)
	}

	if (rejected) {
		return (
			<div className="flex min-h-[80vh] items-center justify-center">
				<Card className="w-full max-w-md">
					<CardContent className="flex flex-col items-center justify-center py-12">
						<XCircle className="h-12 w-12 text-red-500 mb-4" />
						<CardTitle className="mb-2 text-center">
							Account Not Approved
						</CardTitle>
						<CardDescription className="text-center mb-6">
							Your account request was not approved. Please contact an
							administrator if you believe this is an error.
						</CardDescription>
						<Button
							variant="outline"
							onClick={() => {
								setRejected(false)
								setEmail("")
								setPassword("")
							}}
						>
							Try Another Account
						</Button>
					</CardContent>
				</Card>
			</div>
		)
	}

	return (
		<div className="flex min-h-[80vh] items-center justify-center">
			<Card className="w-full max-w-md">
				<CardHeader className="text-center">
					<CardTitle className="text-2xl">Welcome back</CardTitle>
					<CardDescription>
						Sign in to your account to continue
					</CardDescription>
				</CardHeader>
				<CardContent>
					<form onSubmit={handleSubmit} className="space-y-4">
						{error && (
							<div className="rounded-md bg-destructive/10 p-3 text-sm text-destructive">
								{error}
							</div>
						)}
						<div className="space-y-2">
							<Label htmlFor="email">Email</Label>
							<Input
								id="email"
								type="email"
								placeholder="you@example.com"
								value={email}
								onChange={(e) => setEmail(e.target.value)}
								required
							/>
						</div>
						<div className="space-y-2">
							<div className="flex items-center justify-between">
								<Label htmlFor="password">Password</Label>
								<Link
									to="/auth/forgot-password"
									className="text-sm text-primary hover:underline"
								>
									Forgot password?
								</Link>
							</div>
							<div className="relative">
								<Input
									id="password"
									type={showPassword ? "text" : "password"}
									value={password}
									onChange={(e) => setPassword(e.target.value)}
									required
									className="pr-10"
								/>
								<button
									type="button"
									onClick={() => setShowPassword(!showPassword)}
									className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground"
									tabIndex={-1}
								>
									{showPassword ? (
										<EyeOff className="h-4 w-4" />
									) : (
										<Eye className="h-4 w-4" />
									)}
								</button>
							</div>
						</div>
						<Button type="submit" className="w-full" disabled={loading}>
							{loading ? "Signing in..." : "Sign in"}
						</Button>
					</form>
					<div className="mt-4 text-center text-sm text-muted-foreground">
						Don't have an account?{" "}
						<Link to="/sign-up" className="text-primary hover:underline">
							Sign up
						</Link>
					</div>
				</CardContent>
			</Card>
		</div>
	)
}
