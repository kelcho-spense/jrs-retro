import { createFileRoute, Outlet, Link, useLocation, redirect } from '@tanstack/react-router'
import {
    Users,
    Shield,
    LogOut,
    ChevronRight,
    BarChart3,
    ArrowLeft,
} from 'lucide-react'
import { authClient } from '@/lib/auth-client'
import { Button } from '@/components/ui/button'
import { getSessionWithRole } from '@/hooks/use-session-with-role'

export const Route = createFileRoute('/admin')({
    component: AdminLayout,
    beforeLoad: async () => {
        // Check authentication and admin role using custom endpoint that includes role
        const session = await getSessionWithRole()
        if (!session.authenticated || !session.user) {
            throw redirect({
                to: '/auth/login',
            })
        }

        // Check if user is admin
        if (session.user.role !== 'admin') {
            throw redirect({
                to: '/dashboard',
            })
        }
    },
})

const navItems = [
    {
        to: '/admin' as const,
        icon: BarChart3,
        label: 'Overview',
        exact: true,
    },
    {
        to: '/admin/users' as const,
        icon: Users,
        label: 'Users',
    },
]

function AdminLayout() {
    const location = useLocation()
    const { data: session } = authClient.useSession()

    const handleSignOut = async () => {
        await authClient.signOut()
        window.location.href = '/auth/login'
    }

    return (
        <div className="min-h-screen bg-background flex">
            {/* Sidebar */}
            <aside className="w-64 bg-card border-r border-border flex flex-col">
                <div className="p-6 border-b border-border">
                    <Link to="/" className="flex items-center gap-3 text-foreground">
                        <Shield className="w-8 h-8 text-red-500" />
                        <span className="text-xl font-bold">Admin Panel</span>
                    </Link>
                </div>

                {/* User Info */}
                <div className="p-4 border-b border-border">
                    <div className="flex items-center gap-3">
                        <div className="w-10 h-10 bg-red-600 rounded-full flex items-center justify-center">
                            <span className="text-white font-semibold">
                                {session?.user?.name?.charAt(0).toUpperCase() || 'A'}
                            </span>
                        </div>
                        <div className="flex-1 min-w-0">
                            <p className="text-foreground font-medium truncate">
                                {session?.user?.name || 'Admin'}
                            </p>
                            <p className="text-xs text-red-500 font-medium">Administrator</p>
                        </div>
                    </div>
                </div>

                {/* Back to Dashboard */}
                <div className="p-4 border-b border-border">
                    <Link
                        to="/dashboard"
                        className="flex items-center gap-2 text-muted-foreground hover:text-foreground transition-colors"
                    >
                        <ArrowLeft className="w-4 h-4" />
                        <span className="text-sm">Back to Dashboard</span>
                    </Link>
                </div>

                {/* Navigation */}
                <nav className="flex-1 p-4 space-y-1">
                    {navItems.map((item) => {
                        const isActive = item.exact
                            ? location.pathname === item.to
                            : location.pathname.startsWith(item.to)

                        return (
                            <Link
                                key={item.to}
                                to={item.to}
                                className={`flex items-center gap-3 px-4 py-3 rounded-lg transition-colors ${isActive
                                    ? 'bg-red-600 text-white'
                                    : 'text-muted-foreground hover:bg-muted hover:text-foreground'
                                    }`}
                            >
                                <item.icon className="w-5 h-5" />
                                <span>{item.label}</span>
                                {isActive && <ChevronRight className="w-4 h-4 ml-auto" />}
                            </Link>
                        )
                    })}
                </nav>

                {/* Sign Out Button */}
                <div className="p-4 border-t border-border">
                    <Button
                        onClick={handleSignOut}
                        variant="ghost"
                        className="w-full justify-start text-muted-foreground hover:text-foreground hover:bg-muted"
                    >
                        <LogOut className="w-5 h-5 mr-3" />
                        Sign Out
                    </Button>
                </div>
            </aside>

            {/* Main Content */}
            <main className="flex-1 overflow-auto">
                <Outlet />
            </main>
        </div>
    )
}
