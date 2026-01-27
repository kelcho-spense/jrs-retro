import { createFileRoute, Link } from '@tanstack/react-router'
import { useQuery } from '@tanstack/react-query'
import { adminApi } from '@/lib/admin-client'
import { Users, ShieldCheck, ShieldX, CheckCircle, XCircle, Loader2 } from 'lucide-react'

export const Route = createFileRoute('/admin/')({
    component: AdminOverviewPage,
})

function AdminOverviewPage() {
    const { data: stats, isLoading, error } = useQuery({
        queryKey: ['admin', 'stats'],
        queryFn: () => adminApi.getStats(),
    })

    if (isLoading) {
        return (
            <div className="p-8 flex items-center justify-center min-h-[400px]">
                <Loader2 className="w-8 h-8 animate-spin text-muted-foreground" />
            </div>
        )
    }

    if (error) {
        return (
            <div className="p-8">
                <div className="bg-red-500/10 border border-red-500/30 rounded-lg p-4 text-red-500 dark:text-red-400">
                    Failed to load statistics: {error.message}
                </div>
            </div>
        )
    }

    const statCards = [
        {
            title: 'Total Users',
            value: stats?.totalUsers ?? 0,
            icon: Users,
            color: 'text-cyan-500',
            bgColor: 'bg-cyan-500/20',
        },
        {
            title: 'Administrators',
            value: stats?.adminCount ?? 0,
            icon: ShieldCheck,
            color: 'text-red-500',
            bgColor: 'bg-red-500/20',
        },
        {
            title: 'Regular Users',
            value: stats?.userCount ?? 0,
            icon: ShieldX,
            color: 'text-blue-500',
            bgColor: 'bg-blue-500/20',
        },
        {
            title: 'Verified Emails',
            value: stats?.verifiedCount ?? 0,
            icon: CheckCircle,
            color: 'text-green-500',
            bgColor: 'bg-green-500/20',
        },
        {
            title: 'Unverified Emails',
            value: stats?.unverifiedCount ?? 0,
            icon: XCircle,
            color: 'text-yellow-500',
            bgColor: 'bg-yellow-500/20',
        },
    ]

    return (
        <div className="p-8">
            {/* Header */}
            <div className="mb-8">
                <h1 className="text-3xl font-bold text-foreground">Admin Overview</h1>
                <p className="text-muted-foreground mt-2">
                    System statistics and user management dashboard
                </p>
            </div>

            {/* Stats Grid */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-5 gap-6 mb-8">
                {statCards.map((stat) => (
                    <div
                        key={stat.title}
                        className="bg-card border border-border rounded-xl p-6"
                    >
                        <div className="flex items-center gap-4">
                            <div className={`p-3 rounded-lg ${stat.bgColor}`}>
                                <stat.icon className={`w-6 h-6 ${stat.color}`} />
                            </div>
                            <div>
                                <p className="text-2xl font-bold text-foreground">{stat.value}</p>
                                <p className="text-sm text-muted-foreground">{stat.title}</p>
                            </div>
                        </div>
                    </div>
                ))}
            </div>

            {/* Quick Actions */}
            <div className="bg-card border border-border rounded-xl p-6">
                <h2 className="text-lg font-semibold text-foreground mb-4">Quick Actions</h2>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <Link
                        to="/admin/users"
                        className="flex items-center gap-4 p-4 bg-muted/30 rounded-lg hover:bg-muted/50 transition-colors"
                    >
                        <Users className="w-8 h-8 text-cyan-500" />
                        <div>
                            <p className="font-medium text-foreground">Manage Users</p>
                            <p className="text-sm text-muted-foreground">
                                View, edit, and delete user accounts
                            </p>
                        </div>
                    </Link>
                    <div className="flex items-center gap-4 p-4 bg-muted/30 rounded-lg opacity-50 cursor-not-allowed">
                        <ShieldCheck className="w-8 h-8 text-red-500" />
                        <div>
                            <p className="font-medium text-foreground">Role Management</p>
                            <p className="text-sm text-muted-foreground">
                                Assign and revoke admin privileges
                            </p>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    )
}
