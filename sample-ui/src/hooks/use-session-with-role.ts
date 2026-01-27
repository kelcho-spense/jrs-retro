import { useQuery, useQueryClient } from '@tanstack/react-query'

const API_URL = import.meta.env.VITE_AUTH_URL || 'http://localhost:3000'

export interface UserWithRole {
    id: string
    name: string
    email: string
    emailVerified: boolean
    image?: string | null
    createdAt: Date
    updatedAt: Date
    role: 'user' | 'admin'
}

export interface SessionWithRole {
    authenticated: boolean
    user: UserWithRole | null
}

async function fetchSessionWithRole(): Promise<SessionWithRole> {
    const response = await fetch(`${API_URL}/auth/session`, {
        credentials: 'include',
    })

    if (!response.ok) {
        return { authenticated: false, user: null }
    }

    const data = await response.json()
    return {
        authenticated: data.authenticated ?? false,
        user: data.user ?? null,
    }
}

export function useSessionWithRole() {
    return useQuery({
        queryKey: ['session-with-role'],
        queryFn: fetchSessionWithRole,
        staleTime: 1000 * 60 * 5, // 5 minutes
        retry: false,
    })
}

export async function getSessionWithRole(): Promise<SessionWithRole> {
    return fetchSessionWithRole()
}

export function useInvalidateSession() {
    const queryClient = useQueryClient()
    return () => queryClient.invalidateQueries({ queryKey: ['session-with-role'] })
}
