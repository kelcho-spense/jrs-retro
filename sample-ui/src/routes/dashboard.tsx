import { createFileRoute, Outlet, Link, useLocation, redirect } from '@tanstack/react-router'
import {
    LayoutDashboard,
    User,
    Shield,
    Settings,
    LogOut,
    ChevronRight,
    Smartphone,
    Sun,
    Moon,
    Monitor,
    ShieldCheck,
} from 'lucide-react'
import { authClient } from '@/lib/auth-client'
import { Button } from '@/components/ui/button'
import { useTheme } from '@/hooks/use-theme'
import { useSessionWithRole } from '@/hooks/use-session-with-role'

export const Route = createFileRoute('/dashboard')({
    component: DashboardLayout,
    beforeLoad: async () => {
        // Check authentication on the client side
        const session = await authClient.getSession()
        if (!session.data?.session) {
            throw redirect({
                to: '/auth/login',
            })
        }
    },
})

const navItems = [
    {
        to: '/dashboard' as const,
        icon: LayoutDashboard,
        label: 'Dashboard',
        exact: true,
    },
    {
        to: '/dashboard/profile' as const,
        icon: User,
        label: 'Profile',
    },
    {
        to: '/dashboard/sessions' as const,
        icon: Smartphone,
        label: 'Sessions',
    },
    {
        to: '/dashboard/security' as const,
        icon: Shield,
        label: 'Security',
    },
    {
        to: '/dashboard/settings' as const,
        icon: Settings,
        label: 'Settings',
    },
]

function DashboardLayout() {
    const location = useLocation()
    const { data: sessionWithRole } = useSessionWithRole()
    const { data: session } = authClient.useSession()
    const { theme, setTheme } = useTheme()

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
                        <Shield className="w-8 h-8 text-cyan-500 dark:text-cyan-400" />
                        <span className="text-xl font-bold">Better Auth</span>
                    </Link>
                </div>

                {/* User Info */}
                <div className="p-4 border-b border-border">
                    <div className="flex items-center gap-3">
                        <div className="w-10 h-10 bg-cyan-600 rounded-full flex items-center justify-center">
                            <span className="text-white font-semibold">
                                {session?.user?.name?.charAt(0).toUpperCase() || 'U'}
                            </span>
                        </div>
                        <div className="flex-1 min-w-0">
                            <p className="text-foreground font-medium truncate">
                                {session?.user?.name || 'User'}
                            </p>
                            <p className="text-muted-foreground text-sm truncate">
                                {session?.user?.email}
                            </p>
                        </div>
                    </div>
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
                                    ? 'bg-cyan-600 text-white'
                                    : 'text-muted-foreground hover:bg-muted hover:text-foreground'
                                    }`}
                            >
                                <item.icon className="w-5 h-5" />
                                <span>{item.label}</span>
                                {isActive && <ChevronRight className="w-4 h-4 ml-auto" />}
                            </Link>
                        )
                    })}

                    {/* Admin Panel Link - Only for admins */}
                    {sessionWithRole?.user?.role === 'admin' && (
                        <Link
                            to="/admin"
                            className="flex items-center gap-3 px-4 py-3 rounded-lg transition-colors bg-red-500/10 text-red-500 hover:bg-red-500/20 mt-4 border border-red-500/30"
                        >
                            <ShieldCheck className="w-5 h-5" />
                            <span>Admin Panel</span>
                            <ChevronRight className="w-4 h-4 ml-auto" />
                        </Link>
                    )}
                </nav>

                {/* Theme Switcher */}
                <div className="px-4 pb-4">
                    <div className="p-3 bg-muted/30 rounded-lg">
                        <p className="text-xs font-medium text-muted-foreground mb-2 px-1">Theme</p>
                        <div className="flex items-center gap-1 bg-muted rounded-lg p-1">
                            <button
                                onClick={() => setTheme('light')}
                                className={`flex-1 flex items-center justify-center gap-1.5 px-2 py-1.5 rounded-md text-xs font-medium transition-colors ${theme === 'light' ? 'bg-background text-foreground shadow-sm' : 'text-muted-foreground hover:text-foreground'}`}
                            >
                                <Sun className="w-3.5 h-3.5" />
                                Light
                            </button>
                            <button
                                onClick={() => setTheme('dark')}
                                className={`flex-1 flex items-center justify-center gap-1.5 px-2 py-1.5 rounded-md text-xs font-medium transition-colors ${theme === 'dark' ? 'bg-background text-foreground shadow-sm' : 'text-muted-foreground hover:text-foreground'}`}
                            >
                                <Moon className="w-3.5 h-3.5" />
                                Dark
                            </button>
                            <button
                                onClick={() => setTheme('system')}
                                className={`flex-1 flex items-center justify-center gap-1.5 px-2 py-1.5 rounded-md text-xs font-medium transition-colors ${theme === 'system' ? 'bg-background text-foreground shadow-sm' : 'text-muted-foreground hover:text-foreground'}`}
                            >
                                <Monitor className="w-3.5 h-3.5" />
                                Auto
                            </button>
                        </div>
                    </div>
                </div>

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
