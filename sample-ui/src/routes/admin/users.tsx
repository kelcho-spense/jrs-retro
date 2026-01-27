import { createFileRoute } from '@tanstack/react-router'
import { useState } from 'react'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { adminApi, User } from '@/lib/admin-client'
import { authClient } from '@/lib/auth-client'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import {
    Users,
    Search,
    Loader2,
    Trash2,
    ShieldCheck,
    ShieldX,
    Check,
    X,
    ChevronLeft,
    ChevronRight,
} from 'lucide-react'

export const Route = createFileRoute('/admin/users')({
    component: AdminUsersPage,
})

function AdminUsersPage() {
    const queryClient = useQueryClient()
    const { data: session } = authClient.useSession()
    const currentUserId = session?.user?.id

    const [page, setPage] = useState(1)
    const [search, setSearch] = useState('')
    const [roleFilter, setRoleFilter] = useState<'user' | 'admin' | ''>('')
    const [deleteConfirm, setDeleteConfirm] = useState<string | null>(null)

    const { data, isLoading, error } = useQuery({
        queryKey: ['admin', 'users', page, search, roleFilter],
        queryFn: () =>
            adminApi.getUsers({
                page,
                limit: 10,
                search: search || undefined,
                role: roleFilter || undefined,
            }),
    })

    const updateRoleMutation = useMutation({
        mutationFn: ({ id, role }: { id: string; role: 'user' | 'admin' }) =>
            adminApi.updateUserRole(id, role),
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ['admin', 'users'] })
            queryClient.invalidateQueries({ queryKey: ['admin', 'stats'] })
        },
    })

    const deleteUserMutation = useMutation({
        mutationFn: (id: string) => adminApi.deleteUser(id),
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ['admin', 'users'] })
            queryClient.invalidateQueries({ queryKey: ['admin', 'stats'] })
            setDeleteConfirm(null)
        },
    })

    const handleRoleToggle = (user: User) => {
        const newRole = user.role === 'admin' ? 'user' : 'admin'
        updateRoleMutation.mutate({ id: user.id, role: newRole })
    }

    const handleDelete = (id: string) => {
        deleteUserMutation.mutate(id)
    }

    const handleSearchSubmit = (e: React.FormEvent) => {
        e.preventDefault()
        setPage(1)
    }

    return (
        <div className="p-8">
            {/* Header */}
            <div className="mb-8">
                <h1 className="text-3xl font-bold text-foreground">User Management</h1>
                <p className="text-muted-foreground mt-2">
                    View and manage all users in the system
                </p>
            </div>

            {/* Filters */}
            <div className="bg-card border border-border rounded-xl p-4 mb-6">
                <div className="flex flex-wrap gap-4 items-center">
                    <form onSubmit={handleSearchSubmit} className="flex-1 min-w-[200px]">
                        <div className="relative">
                            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                            <Input
                                type="text"
                                placeholder="Search by name or email..."
                                value={search}
                                onChange={(e) => setSearch(e.target.value)}
                                className="pl-10 bg-muted/50 border-border"
                            />
                        </div>
                    </form>

                    <div className="flex items-center gap-2">
                        <span className="text-sm text-muted-foreground">Role:</span>
                        <select
                            value={roleFilter}
                            onChange={(e) => {
                                setRoleFilter(e.target.value as 'user' | 'admin' | '')
                                setPage(1)
                            }}
                            className="bg-muted border border-border rounded-lg px-3 py-2 text-foreground text-sm"
                        >
                            <option value="">All</option>
                            <option value="user">User</option>
                            <option value="admin">Admin</option>
                        </select>
                    </div>
                </div>
            </div>

            {/* Error */}
            {error && (
                <div className="bg-red-500/10 border border-red-500/30 rounded-lg p-4 text-red-500 dark:text-red-400 mb-6">
                    Failed to load users: {error.message}
                </div>
            )}

            {/* Loading */}
            {isLoading && (
                <div className="flex items-center justify-center py-12">
                    <Loader2 className="w-8 h-8 animate-spin text-muted-foreground" />
                </div>
            )}

            {/* Users Table */}
            {data && (
                <div className="bg-card border border-border rounded-xl overflow-hidden">
                    <div className="overflow-x-auto">
                        <table className="w-full">
                            <thead className="bg-muted/50 border-b border-border">
                                <tr>
                                    <th className="text-left p-4 text-sm font-medium text-muted-foreground">
                                        User
                                    </th>
                                    <th className="text-left p-4 text-sm font-medium text-muted-foreground">
                                        Email
                                    </th>
                                    <th className="text-left p-4 text-sm font-medium text-muted-foreground">
                                        Role
                                    </th>
                                    <th className="text-left p-4 text-sm font-medium text-muted-foreground">
                                        Verified
                                    </th>
                                    <th className="text-left p-4 text-sm font-medium text-muted-foreground">
                                        Created
                                    </th>
                                    <th className="text-right p-4 text-sm font-medium text-muted-foreground">
                                        Actions
                                    </th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-border">
                                {data.users.map((user) => (
                                    <tr key={user.id} className="hover:bg-muted/30 transition-colors">
                                        <td className="p-4">
                                            <div className="flex items-center gap-3">
                                                <div
                                                    className={`w-10 h-10 rounded-full flex items-center justify-center ${user.role === 'admin'
                                                            ? 'bg-red-600'
                                                            : 'bg-cyan-600'
                                                        }`}
                                                >
                                                    <span className="text-white font-semibold">
                                                        {user.name?.charAt(0).toUpperCase() || 'U'}
                                                    </span>
                                                </div>
                                                <div>
                                                    <p className="font-medium text-foreground">
                                                        {user.name}
                                                    </p>
                                                    {user.id === currentUserId && (
                                                        <span className="text-xs text-cyan-500">(You)</span>
                                                    )}
                                                </div>
                                            </div>
                                        </td>
                                        <td className="p-4 text-muted-foreground">{user.email}</td>
                                        <td className="p-4">
                                            <span
                                                className={`inline-flex items-center gap-1 px-2 py-1 rounded-full text-xs font-medium ${user.role === 'admin'
                                                        ? 'bg-red-500/20 text-red-500'
                                                        : 'bg-blue-500/20 text-blue-500'
                                                    }`}
                                            >
                                                {user.role === 'admin' ? (
                                                    <ShieldCheck className="w-3 h-3" />
                                                ) : (
                                                    <ShieldX className="w-3 h-3" />
                                                )}
                                                {user.role}
                                            </span>
                                        </td>
                                        <td className="p-4">
                                            {user.emailVerified ? (
                                                <Check className="w-5 h-5 text-green-500" />
                                            ) : (
                                                <X className="w-5 h-5 text-yellow-500" />
                                            )}
                                        </td>
                                        <td className="p-4 text-muted-foreground text-sm">
                                            {new Date(user.createdAt).toLocaleDateString()}
                                        </td>
                                        <td className="p-4">
                                            <div className="flex items-center justify-end gap-2">
                                                {/* Toggle Role */}
                                                <Button
                                                    size="sm"
                                                    variant="outline"
                                                    onClick={() => handleRoleToggle(user)}
                                                    disabled={
                                                        user.id === currentUserId ||
                                                        updateRoleMutation.isPending
                                                    }
                                                    className="border-border"
                                                >
                                                    {user.role === 'admin' ? (
                                                        <>
                                                            <ShieldX className="w-4 h-4 mr-1" />
                                                            Demote
                                                        </>
                                                    ) : (
                                                        <>
                                                            <ShieldCheck className="w-4 h-4 mr-1" />
                                                            Promote
                                                        </>
                                                    )}
                                                </Button>

                                                {/* Delete */}
                                                {deleteConfirm === user.id ? (
                                                    <div className="flex items-center gap-1">
                                                        <Button
                                                            size="sm"
                                                            variant="destructive"
                                                            onClick={() => handleDelete(user.id)}
                                                            disabled={deleteUserMutation.isPending}
                                                        >
                                                            {deleteUserMutation.isPending ? (
                                                                <Loader2 className="w-4 h-4 animate-spin" />
                                                            ) : (
                                                                <Check className="w-4 h-4" />
                                                            )}
                                                        </Button>
                                                        <Button
                                                            size="sm"
                                                            variant="outline"
                                                            onClick={() => setDeleteConfirm(null)}
                                                            className="border-border"
                                                        >
                                                            <X className="w-4 h-4" />
                                                        </Button>
                                                    </div>
                                                ) : (
                                                    <Button
                                                        size="sm"
                                                        variant="outline"
                                                        onClick={() => setDeleteConfirm(user.id)}
                                                        disabled={user.id === currentUserId}
                                                        className="border-red-500/30 text-red-500 hover:bg-red-500/10"
                                                    >
                                                        <Trash2 className="w-4 h-4" />
                                                    </Button>
                                                )}
                                            </div>
                                        </td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </div>

                    {/* Pagination */}
                    {data.totalPages > 1 && (
                        <div className="flex items-center justify-between p-4 border-t border-border">
                            <p className="text-sm text-muted-foreground">
                                Showing {(page - 1) * 10 + 1} to{' '}
                                {Math.min(page * 10, data.total)} of {data.total} users
                            </p>
                            <div className="flex items-center gap-2">
                                <Button
                                    size="sm"
                                    variant="outline"
                                    onClick={() => setPage((p) => Math.max(1, p - 1))}
                                    disabled={page === 1}
                                    className="border-border"
                                >
                                    <ChevronLeft className="w-4 h-4" />
                                </Button>
                                <span className="text-sm text-muted-foreground">
                                    Page {page} of {data.totalPages}
                                </span>
                                <Button
                                    size="sm"
                                    variant="outline"
                                    onClick={() =>
                                        setPage((p) => Math.min(data.totalPages, p + 1))
                                    }
                                    disabled={page === data.totalPages}
                                    className="border-border"
                                >
                                    <ChevronRight className="w-4 h-4" />
                                </Button>
                            </div>
                        </div>
                    )}

                    {/* Empty State */}
                    {data.users.length === 0 && (
                        <div className="p-12 text-center">
                            <Users className="w-12 h-12 text-muted-foreground mx-auto mb-4" />
                            <p className="text-muted-foreground">No users found</p>
                        </div>
                    )}
                </div>
            )}
        </div>
    )
}
