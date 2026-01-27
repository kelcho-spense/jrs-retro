import { createAuthClient } from "better-auth/react"
import { multiSessionClient } from "better-auth/client/plugins"

export const authClient = createAuthClient({
	plugins: [multiSessionClient()],
})

// Destructured exports for convenience
export const {
	signIn,
	signUp,
	signOut,
	useSession,
	// Password management
	changePassword,
	resetPassword,
	// Session management
	listSessions,
	revokeSession,
	revokeSessions,
	revokeOtherSessions,
} = authClient
