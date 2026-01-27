import { createFileRoute, Link } from '@tanstack/react-router'
import {
    Shield,
    User,
    Settings,
    Monitor,
    Clock,
    Activity,
    ArrowRight,
    CheckCircle2,
    AlertCircle,
} from 'lucide-react'
import { Button } from '@/components/ui/button'
import { authClient } from '@/lib/auth-client'

export const Route = createFileRoute('/dashboard/')({
    component: DashboardHome,
})

function DashboardHome() {
    const { data: session } = authClient.useSession()

    const quickActions = [
        {
            title: 'Profile Settings',
            description: 'Update your personal information',
            icon: User,
            href: '/dashboard/profile',
            color: 'text-cyan-500 dark:text-cyan-400',
            bgColor: 'bg-cyan-500/10 dark:bg-cyan-400/10',
        },
        {
            title: 'Security',
            description: 'Manage your security preferences',
            icon: Shield,
            href: '/dashboard/security',
            color: 'text-blue-500 dark:text-blue-400',
            bgColor: 'bg-blue-500/10 dark:bg-blue-400/10',
        },
        {
            title: 'Active Sessions',
            description: 'View and manage your sessions',
            icon: Monitor,
            href: '/dashboard/sessions',
            color: 'text-purple-500 dark:text-purple-400',
            bgColor: 'bg-purple-500/10 dark:bg-purple-400/10',
        },
        {
            title: 'Settings',
            description: 'Customize your experience',
            icon: Settings,
            href: '/dashboard/settings',
            color: 'text-amber-500 dark:text-amber-400',
            bgColor: 'bg-amber-500/10 dark:bg-amber-400/10',
        },
    ]

    const recentActivity = [
        {
            action: 'Signed in',
            time: 'Just now',
            icon: CheckCircle2,
            status: 'success',
        },
        {
            action: 'Password updated',
            time: '2 days ago',
            icon: Shield,
            status: 'success',
        },
        {
            action: 'New session from Chrome',
            time: '3 days ago',
            icon: Monitor,
            status: 'info',
        },
        {
            action: 'Login attempt blocked',
            time: '5 days ago',
            icon: AlertCircle,
            status: 'warning',
        },
    ]

    return (
        <div className="space-y-8">
            {/* Welcome Section */}
            <div className="bg-gradient-to-r from-cyan-500/10 via-blue-500/10 to-purple-500/10 dark:from-cyan-400/10 dark:via-blue-400/10 dark:to-purple-400/10 rounded-2xl p-8 border border-border/50">
                <div className="flex items-start justify-between">
                    <div>
                        <h1 className="text-3xl font-bold text-foreground mb-2">
                            Welcome back, {session?.user?.name || 'User'}!
                        </h1>
                        <p className="text-muted-foreground">
                            Here's an overview of your account and recent activity.
                        </p>
                    </div>
                    <div className="hidden sm:flex items-center gap-2 text-sm text-muted-foreground">
                        <Clock className="w-4 h-4" />
                        <span>Last login: {new Date().toLocaleDateString()}</span>
                    </div>
                </div>
            </div>

            {/* Quick Actions Grid */}
            <div>
                <h2 className="text-xl font-semibold text-foreground mb-4">Quick Actions</h2>
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
                    {quickActions.map((action) => (
                        <Link
                            key={action.href}
                            to={action.href}
                            className="group p-6 bg-card rounded-xl border border-border hover:border-cyan-500/50 dark:hover:border-cyan-400/50 transition-all hover:shadow-lg hover:shadow-cyan-500/5 dark:hover:shadow-cyan-400/5"
                        >
                            <div
                                className={`w-12 h-12 rounded-lg ${action.bgColor} flex items-center justify-center mb-4`}
                            >
                                <action.icon className={`w-6 h-6 ${action.color}`} />
                            </div>
                            <h3 className="font-semibold text-foreground mb-1 group-hover:text-cyan-600 dark:group-hover:text-cyan-400 transition-colors">
                                {action.title}
                            </h3>
                            <p className="text-sm text-muted-foreground">{action.description}</p>
                            <div className="mt-4 flex items-center text-cyan-600 dark:text-cyan-400 text-sm font-medium opacity-0 group-hover:opacity-100 transition-opacity">
                                <span>Go to {action.title.toLowerCase()}</span>
                                <ArrowRight className="w-4 h-4 ml-1" />
                            </div>
                        </Link>
                    ))}
                </div>
            </div>

            {/* Stats and Activity */}
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                {/* Account Stats */}
                <div className="lg:col-span-1 bg-card rounded-xl border border-border p-6">
                    <h2 className="text-lg font-semibold text-foreground mb-4 flex items-center gap-2">
                        <Activity className="w-5 h-5 text-cyan-500 dark:text-cyan-400" />
                        Account Stats
                    </h2>
                    <div className="space-y-4">
                        <div className="flex justify-between items-center py-3 border-b border-border">
                            <span className="text-muted-foreground">Email Verified</span>
                            <span className="flex items-center gap-1 text-green-600 dark:text-green-400">
                                <CheckCircle2 className="w-4 h-4" />
                                Yes
                            </span>
                        </div>
                        <div className="flex justify-between items-center py-3 border-b border-border">
                            <span className="text-muted-foreground">2FA Enabled</span>
                            <span className="text-amber-600 dark:text-amber-400">Not Set</span>
                        </div>
                        <div className="flex justify-between items-center py-3 border-b border-border">
                            <span className="text-muted-foreground">Active Sessions</span>
                            <span className="text-foreground font-medium">2</span>
                        </div>
                        <div className="flex justify-between items-center py-3">
                            <span className="text-muted-foreground">Member Since</span>
                            <span className="text-foreground font-medium">
                                {session?.user?.createdAt
                                    ? new Date(session.user.createdAt).toLocaleDateString()
                                    : 'N/A'}
                            </span>
                        </div>
                    </div>
                </div>

                {/* Recent Activity */}
                <div className="lg:col-span-2 bg-card rounded-xl border border-border p-6">
                    <h2 className="text-lg font-semibold text-foreground mb-4 flex items-center gap-2">
                        <Clock className="w-5 h-5 text-cyan-500 dark:text-cyan-400" />
                        Recent Activity
                    </h2>
                    <div className="space-y-4">
                        {recentActivity.map((item, index) => (
                            <div
                                key={index}
                                className="flex items-center gap-4 p-3 rounded-lg hover:bg-muted/50 transition-colors"
                            >
                                <div
                                    className={`w-10 h-10 rounded-full flex items-center justify-center ${item.status === 'success'
                                        ? 'bg-green-500/10 dark:bg-green-400/10'
                                        : item.status === 'warning'
                                            ? 'bg-amber-500/10 dark:bg-amber-400/10'
                                            : 'bg-blue-500/10 dark:bg-blue-400/10'
                                        }`}
                                >
                                    <item.icon
                                        className={`w-5 h-5 ${item.status === 'success'
                                            ? 'text-green-600 dark:text-green-400'
                                            : item.status === 'warning'
                                                ? 'text-amber-600 dark:text-amber-400'
                                                : 'text-blue-600 dark:text-blue-400'
                                            }`}
                                    />
                                </div>
                                <div className="flex-1">
                                    <p className="text-foreground font-medium">{item.action}</p>
                                    <p className="text-sm text-muted-foreground">{item.time}</p>
                                </div>
                            </div>
                        ))}
                    </div>
                    <Button
                        variant="outline"
                        className="w-full mt-4 text-muted-foreground hover:text-foreground"
                    >
                        View All Activity
                    </Button>
                </div>
            </div>
        </div>
    )
}
