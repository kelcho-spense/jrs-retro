import { createFileRoute, Outlet, Link } from '@tanstack/react-router'
import { Shield } from 'lucide-react'

export const Route = createFileRoute('/auth')({
    component: AuthLayout,
})

function AuthLayout() {
    return (
        <div className="min-h-screen bg-gradient-to-br from-background via-muted to-background flex">
            {/* Left side - Branding */}
            <div className="hidden lg:flex lg:w-1/2 flex-col justify-between p-12 bg-gradient-to-br from-cyan-600 to-blue-700">
                <div>
                    <Link to="/" className="flex items-center gap-3 text-white">
                        <Shield className="w-10 h-10" />
                        <span className="text-2xl font-bold">Better Auth</span>
                    </Link>
                </div>

                <div className="space-y-6">
                    <h1 className="text-4xl font-bold text-white leading-tight">
                        Secure Authentication
                        <br />
                        Made Simple
                    </h1>
                    <p className="text-cyan-100 text-lg max-w-md">
                        Experience seamless authentication with enterprise-grade security.
                        Your data is protected with the latest encryption standards.
                    </p>
                </div>

                <div className="text-cyan-200 text-sm">
                    © {new Date().getFullYear()} Better Auth. All rights reserved.
                </div>
            </div>

            {/* Right side - Auth Form */}
            <div className="flex-1 flex flex-col justify-center items-center p-8">
                <div className="w-full max-w-md">
                    {/* Mobile Logo */}
                    <div className="lg:hidden flex items-center justify-center gap-3 mb-8">
                        <Link to="/" className="flex items-center gap-3 text-foreground">
                            <Shield className="w-8 h-8 text-cyan-500 dark:text-cyan-400" />
                            <span className="text-xl font-bold">Better Auth</span>
                        </Link>
                    </div>

                    <Outlet />
                </div>
            </div>
        </div>
    )
}
