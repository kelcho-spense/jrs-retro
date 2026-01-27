import { createAuthClient } from 'better-auth/react'
import { multiSessionClient } from 'better-auth/client/plugins'

// API runs on port 3000, UI runs on port 3001
const API_URL = import.meta.env.VITE_AUTH_URL || 'http://localhost:3000'

export const authClient = createAuthClient({
    baseURL: API_URL,
    plugins: [multiSessionClient()],
})

// Export commonly used auth methods for convenience
export const {
    signIn,
    signUp,
    signOut,
    useSession,
    getSession,
} = authClient
