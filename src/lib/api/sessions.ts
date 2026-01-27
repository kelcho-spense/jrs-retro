import { createServerFn } from "@tanstack/react-start"
import { getRequest } from "@tanstack/react-start/server"
import { z } from "zod"
import { db } from "@/db"
import { session } from "@/db/schema"
import { eq, and, ne } from "drizzle-orm"
import { auth } from "@/lib/auth"

// Get the current user's session from request headers
async function getSessionFromRequest() {
	const request = getRequest()
	const sessionResult = await auth.api.getSession({ headers: request.headers })
	return sessionResult
}

// List all sessions for the current user
export const listSessions = createServerFn({ method: "GET" }).handler(
	async () => {
		const sessionResult = await getSessionFromRequest()

		if (!sessionResult?.user?.id) {
			return []
		}

		const sessions = await db
			.select()
			.from(session)
			.where(eq(session.userId, sessionResult.user.id))
			.orderBy(session.createdAt)

		return sessions
	}
)

const revokeSessionSchema = z.object({ token: z.string() })

// Revoke a specific session
export const revokeSession = createServerFn({ method: "POST" })
	.inputValidator((data: unknown) => revokeSessionSchema.parse(data))
	.handler(async ({ data }) => {
		const sessionResult = await getSessionFromRequest()

		if (!sessionResult?.user?.id) {
			throw new Error("Not authenticated")
		}

		// Delete the session matching both the token and user ID (security check)
		await db
			.delete(session)
			.where(
				and(
					eq(session.token, data.token),
					eq(session.userId, sessionResult.user.id)
				)
			)

		return { success: true }
	})

// Revoke all other sessions (except current)
export const revokeOtherSessions = createServerFn({ method: "POST" }).handler(
	async () => {
		const sessionResult = await getSessionFromRequest()

		if (!sessionResult?.user?.id || !sessionResult?.session?.id) {
			throw new Error("Not authenticated")
		}

		// Delete all sessions for this user except the current one
		await db
			.delete(session)
			.where(
				and(
					eq(session.userId, sessionResult.user.id),
					ne(session.id, sessionResult.session.id)
				)
			)

		return { success: true }
	}
)
