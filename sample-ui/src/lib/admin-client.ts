// Admin API client for user management

const API_URL = import.meta.env.VITE_AUTH_URL || 'http://localhost:3000'

export interface User {
    id: string
    name: string
    email: string
    emailVerified: boolean
    image: string | null
    role: 'user' | 'admin'
    createdAt: string
    updatedAt: string
}

export interface PaginatedUsers {
    users: User[]
    total: number
    page: number
    limit: number
    totalPages: number
}

export interface AdminStats {
    totalUsers: number
    adminCount: number
    userCount: number
    verifiedCount: number
    unverifiedCount: number
}

export interface UserQuery {
    page?: number
    limit?: number
    search?: string
    role?: 'user' | 'admin'
}

export interface UpdateUserDto {
    name?: string
    email?: string
    role?: 'user' | 'admin'
    emailVerified?: boolean
}

// Fetch helper with credentials
async function adminFetch<T>(endpoint: string, options: RequestInit = {}): Promise<T> {
    const response = await fetch(`${API_URL}/admin${endpoint}`, {
        ...options,
        credentials: 'include',
        headers: {
            'Content-Type': 'application/json',
            ...options.headers,
        },
    })

    if (!response.ok) {
        const error = await response.json().catch(() => ({ message: 'Request failed' }))
        throw new Error(error.message || `HTTP error ${response.status}`)
    }

    return response.json()
}

// Admin API methods
export const adminApi = {
    // Get dashboard stats
    getStats: () => adminFetch<AdminStats>('/stats'),

    // List users with pagination and filters
    getUsers: (query: UserQuery = {}) => {
        const params = new URLSearchParams()
        if (query.page) params.set('page', String(query.page))
        if (query.limit) params.set('limit', String(query.limit))
        if (query.search) params.set('search', query.search)
        if (query.role) params.set('role', query.role)

        return adminFetch<PaginatedUsers>(`/users?${params.toString()}`)
    },

    // Get single user
    getUser: (id: string) => adminFetch<User>(`/users/${id}`),

    // Update user
    updateUser: (id: string, data: UpdateUserDto) =>
        adminFetch<User>(`/users/${id}`, {
            method: 'PATCH',
            body: JSON.stringify(data),
        }),

    // Update user role
    updateUserRole: (id: string, role: 'user' | 'admin') =>
        adminFetch<User>(`/users/${id}/role`, {
            method: 'PATCH',
            body: JSON.stringify({ role }),
        }),

    // Delete user
    deleteUser: (id: string) =>
        adminFetch<{ message: string }>(`/users/${id}`, {
            method: 'DELETE',
        }),
}
