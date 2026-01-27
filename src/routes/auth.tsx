import { createFileRoute, Outlet, Link } from "@tanstack/react-router"

export const Route = createFileRoute("/auth")({
	component: AuthLayout,
})

function AuthLayout() {
	return (
		<div className="min-h-screen bg-background flex">
			{/* Left side - Branding */}
			<div className="hidden lg:flex lg:w-1/2 flex-col justify-between p-12 bg-gradient-to-br from-primary to-primary/70 dark:from-primary/90 dark:to-primary/50">
				<div>
					<Link to="/" className="flex items-center gap-3 text-white">
						<span className="text-3xl">🔄</span>
						<span className="text-2xl font-bold">jrs-retro</span>
					</Link>
				</div>

				<div className="space-y-6">
					<h1 className="text-4xl font-bold text-white leading-tight">
						Team Retrospectives
						<br />
						Made Simple
					</h1>
					<p className="text-white/80 text-lg max-w-md">
						Reflect, improve, and grow together. Run effective retrospectives
						that help your team learn and adapt.
					</p>
				</div>

				<div className="text-white/60 text-sm">
					© {new Date().getFullYear()} jrs-retro. All rights reserved.
				</div>
			</div>

			{/* Right side - Auth Form */}
			<div className="flex-1 flex flex-col justify-center items-center p-8 bg-background">
				<div className="w-full max-w-md">
					{/* Mobile Logo */}
					<div className="lg:hidden flex items-center justify-center gap-3 mb-8">
						<Link to="/" className="flex items-center gap-3 text-foreground">
							<span className="text-2xl">🔄</span>
							<span className="text-xl font-bold">jrs-retro</span>
						</Link>
					</div>

					{/* Card wrapper for form */}
					<div className="bg-card rounded-xl border p-8 shadow-sm">
						<Outlet />
					</div>
				</div>
			</div>
		</div>
	)
}
