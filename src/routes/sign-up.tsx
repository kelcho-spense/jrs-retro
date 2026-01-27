import { createFileRoute, Link } from "@tanstack/react-router"
import { useState } from "react"
import { Clock, CheckCircle, Eye, EyeOff } from "lucide-react"

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
import { checkAdminExists, bootstrapFirstAdmin } from "@/lib/api/users"

export const Route = createFileRoute("/sign-up")({
	loader: async () => {
		const { exists } = await checkAdminExists()
		return { adminExists: exists }
	},
	component: SignUpPage,
})

function SignUpPage() {
	const { adminExists } = Route.useLoaderData()
	const [name, setName] = useState("")
	const [email, setEmail] = useState("")
	const [password, setPassword] = useState("")
	const [showPassword, setShowPassword] = useState(false)
	const [error, setError] = useState("")
	const [loading, setLoading] = useState(false)
	const [success, setSuccess] = useState(false)
	const [isFirstUser, setIsFirstUser] = useState(false)

	const handleSubmit = async (e: React.FormEvent) => {
		e.preventDefault()
		setError("")
		setLoading(true)

		try {
			const result = await authClient.signUp.email({
				name,
				email,
				password,
			})

			if (result.error) {
				setError(result.error.message ?? "Sign up failed")
			} else {
				// If this is the first user, make them admin automatically
				if (!adminExists) {
					try {
						await bootstrapFirstAdmin()
						setIsFirstUser(true)
					} catch {
						// Ignore if admin already exists
					}
				}
				setSuccess(true)
			}
		} catch {
			setError("An unexpected error occurred")
		} finally {
			setLoading(false)
		}
	}

	if (success) {
		return (
			<div className="flex min-h-[80vh] items-center justify-center">
				<Card className="w-full max-w-md">
					<CardContent className="flex flex-col items-center justify-center py-12">
						{isFirstUser ? (
							<>
								<CheckCircle className="h-12 w-12 text-green-500 mb-4" />
								<CardTitle className="mb-2 text-center">
									Welcome, Admin!
								</CardTitle>
								<CardDescription className="text-center mb-6">
									You're the first user, so you've been automatically made an
									administrator. You can now approve other users.
								</CardDescription>
								<Button asChild>
									<Link to="/">Go to Dashboard</Link>
								</Button>
							</>
						) : (
							<>
								<Clock className="h-12 w-12 text-amber-500 mb-4" />
								<CardTitle className="mb-2 text-center">
									Account Pending Approval
								</CardTitle>
								<CardDescription className="text-center mb-6">
									Your account has been created successfully. An administrator
									will review and approve your account. You'll be able to sign
									in once approved.
								</CardDescription>
								<Button variant="outline" asChild>
									<Link to="/sign-in">Back to Sign In</Link>
								</Button>
							</>
						)}
					</CardContent>
				</Card>
			</div>
		)
	}

	return (
		<div className="flex min-h-[80vh] items-center justify-center">
			<Card className="w-full max-w-md">
				<CardHeader className="text-center">
					<CardTitle className="text-2xl">Create an account</CardTitle>
					<CardDescription>
						{adminExists
							? "Enter your details to request access"
							: "You'll be the first admin!"}
					</CardDescription>
				</CardHeader>
				<CardContent>
					<form onSubmit={handleSubmit} className="space-y-4">
						{error && (
							<div className="rounded-md bg-destructive/10 p-3 text-sm text-destructive">
								{error}
							</div>
						)}
						{!adminExists && (
							<div className="rounded-md bg-blue-50 p-3 text-sm text-blue-700 border border-blue-200">
								<strong>First user:</strong> You will automatically become an
								administrator and can approve future users.
							</div>
						)}
						<div className="space-y-2">
							<Label htmlFor="name">Name</Label>
							<Input
								id="name"
								type="text"
								placeholder="Your name"
								value={name}
								onChange={(e) => setName(e.target.value)}
								required
							/>
						</div>
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
							<Label htmlFor="password">Password</Label>
							<div className="relative">
								<Input
									id="password"
									type={showPassword ? "text" : "password"}
									placeholder="At least 8 characters"
									value={password}
									onChange={(e) => setPassword(e.target.value)}
									required
									minLength={8}
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
							{loading
								? "Creating account..."
								: adminExists
									? "Request Access"
									: "Create Admin Account"}
						</Button>
					</form>
					<div className="mt-4 text-center text-sm text-muted-foreground">
						Already have an account?{" "}
						<Link to="/sign-in" className="text-primary hover:underline">
							Sign in
						</Link>
					</div>
				</CardContent>
			</Card>
		</div>
	)
}
