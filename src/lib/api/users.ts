import { createServerFn } from "@tanstack/react-start"
import { getRequest } from "@tanstack/react-start/server"
import { z } from "zod"
import { db } from "@/db"
import { user, adminActionLog, organizationMember, teamMember } from "@/db/schema"
import { eq, and, ne, or, like, desc, inArray } from "drizzle-orm"
import { auth } from "@/lib/auth"
import { nanoid } from "nanoid"

// ============================================================================
// Helper: Get current session user
// ============================================================================

async function getSessionUser() {
	const request = getRequest()
	const session = await auth.api.getSession({ headers: request.headers })
	return session?.user ?? null
}

async function requireAdmin() {
	const sessionUser = await getSessionUser()
	if (!sessionUser) throw new Error("Unauthorized")

	const currentUser = await db.query.user.findFirst({
		where: eq(user.id, sessionUser.id),
	})

	if (currentUser?.role !== "admin") {
		throw new Error("Forbidden: Admin access required")
	}

	return { sessionUser, currentUser }
}

async function logAdminAction(
	adminId: string,
	targetUserId: string,
	action: typeof adminActionLog.$inferInsert.action,
	details?: Record<string, unknown>
) {
	await db.insert(adminActionLog).values({
		id: nanoid(),
		adminId,
		targetUserId,
		action,
		details: details ? JSON.stringify(details) : null,
	})
}

/**
 * Get the current authenticated user with full details
 */
export const getCurrentUser = createServerFn({ method: "GET" }).handler(
	async () => {
		const request = getRequest()
		const session = await auth.api.getSession({ headers: request.headers })

		if (!session?.user) {
			return null
		}

		const currentUser = await db.query.user.findFirst({
			where: eq(user.id, session.user.id),
		})

		return currentUser
	}
)

/**
 * Get all users with optional search/filter (admin only)
 */
const getUsersSchema = z.object({
	search: z.string().optional(),
	status: z.enum(["pending", "approved", "rejected", "suspended", "all"]).optional(),
	role: z.enum(["admin", "member", "all"]).optional(),
}).optional()

export const getAllUsers = createServerFn({ method: "GET" })
	.inputValidator((data: unknown) => getUsersSchema.parse(data))
	.handler(async ({ data }) => {
		await requireAdmin()

		const conditions = []

		if (data?.search) {
			const searchTerm = `%${data.search}%`
			conditions.push(
				or(like(user.name, searchTerm), like(user.email, searchTerm))
			)
		}

		if (data?.status && data.status !== "all") {
			conditions.push(eq(user.status, data.status))
		}

		if (data?.role && data.role !== "all") {
			conditions.push(eq(user.role, data.role))
		}

		const users = await db.query.user.findMany({
			where: conditions.length > 0 ? and(...conditions) : undefined,
			orderBy: (users, { desc }) => [desc(users.createdAt)],
		})

		return users
	})

/**
 * Update user status (approve/reject) - admin only
 */
const updateStatusSchema = z.object({
	userId: z.string(),
	status: z.enum(["approved", "rejected"]),
})

export const updateUserStatus = createServerFn({ method: "POST" })
	.inputValidator((data: unknown) => updateStatusSchema.parse(data))
	.handler(async ({ data }) => {
		const { userId, status } = data
		const { sessionUser } = await requireAdmin()

		const updatedUsers = await db
			.update(user)
			.set({
				status,
				approvedAt: status === "approved" ? new Date() : null,
				approvedById: status === "approved" ? sessionUser.id : null,
				updatedAt: new Date(),
			})
			.where(eq(user.id, userId))
			.returning()

		await logAdminAction(
			sessionUser.id,
			userId,
			status === "approved" ? "user_approved" : "user_rejected"
		)

		return updatedUsers[0]
	})

/**
 * Update user role - admin only
 */
const updateRoleSchema = z.object({
	userId: z.string(),
	role: z.enum(["admin", "member"]),
})

export const updateUserRole = createServerFn({ method: "POST" })
	.inputValidator((data: unknown) => updateRoleSchema.parse(data))
	.handler(async ({ data }) => {
		const { userId, role } = data
		const { sessionUser } = await requireAdmin()

		// Prevent removing the last admin
		if (role === "member" && userId === sessionUser.id) {
			const adminCount = await db.query.user.findMany({
				where: and(eq(user.role, "admin"), ne(user.id, userId)),
			})
			if (adminCount.length === 0) {
				throw new Error("Cannot remove the last admin")
			}
		}

		const targetUser = await db.query.user.findFirst({
			where: eq(user.id, userId),
		})

		const updatedUsers = await db
			.update(user)
			.set({ role, updatedAt: new Date() })
			.where(eq(user.id, userId))
			.returning()

		await logAdminAction(sessionUser.id, userId, "user_role_changed", {
			previousRole: targetUser?.role,
			newRole: role,
		})

		return updatedUsers[0]
	})

/**
 * Update current user's profile
 */
const updateProfileSchema = z.object({
	name: z.string().min(1).optional(),
	bio: z.string().optional(),
	image: z.string().url().optional().nullable(),
})

export const updateProfile = createServerFn({ method: "POST" })
	.inputValidator((data: unknown) => updateProfileSchema.parse(data))
	.handler(async ({ data }) => {
		const request = getRequest()
		const session = await auth.api.getSession({ headers: request.headers })

		if (!session?.user) {
			throw new Error("Unauthorized")
		}

		const updatedUsers = await db
			.update(user)
			.set({ ...data, updatedAt: new Date() })
			.where(eq(user.id, session.user.id))
			.returning()

		return updatedUsers[0]
	})

/**
 * Delete user - admin only (or self-deletion)
 */
export const deleteUser = createServerFn({ method: "POST" })
	.inputValidator((data: unknown) => z.string().parse(data))
	.handler(async ({ data: userId }) => {
		const sessionUser = await getSessionUser()
		if (!sessionUser) throw new Error("Unauthorized")

		const currentUser = await db.query.user.findFirst({
			where: eq(user.id, sessionUser.id),
		})

		// Allow self-deletion or admin deletion
		const isSelf = userId === sessionUser.id
		const isAdmin = currentUser?.role === "admin"

		if (!isSelf && !isAdmin) {
			throw new Error("Forbidden")
		}

		// Prevent deleting the last admin
		if (isAdmin && isSelf) {
			const adminCount = await db.query.user.findMany({
				where: and(eq(user.role, "admin"), ne(user.id, userId)),
			})
			if (adminCount.length === 0) {
				throw new Error("Cannot delete the last admin")
			}
		}

		if (isAdmin && !isSelf) {
			await logAdminAction(sessionUser.id, userId, "user_deleted")
		}

		await db.delete(user).where(eq(user.id, userId))

		return { success: true }
	})

/**
 * Suspend a user - admin only
 */
const suspendUserSchema = z.object({
	userId: z.string(),
	reason: z.string().optional(),
})

export const suspendUser = createServerFn({ method: "POST" })
	.inputValidator((data: unknown) => suspendUserSchema.parse(data))
	.handler(async ({ data }) => {
		const { sessionUser } = await requireAdmin()

		if (data.userId === sessionUser.id) {
			throw new Error("Cannot suspend yourself")
		}

		const targetUser = await db.query.user.findFirst({
			where: eq(user.id, data.userId),
		})

		if (targetUser?.role === "admin") {
			throw new Error("Cannot suspend an admin")
		}

		const updatedUsers = await db
			.update(user)
			.set({
				status: "suspended",
				suspendedAt: new Date(),
				suspendedById: sessionUser.id,
				suspendedReason: data.reason || null,
				updatedAt: new Date(),
			})
			.where(eq(user.id, data.userId))
			.returning()

		await logAdminAction(sessionUser.id, data.userId, "user_suspended", {
			reason: data.reason,
		})

		return updatedUsers[0]
	})

/**
 * Reactivate a suspended user - admin only
 */
export const reactivateUser = createServerFn({ method: "POST" })
	.inputValidator((data: unknown) => z.string().parse(data))
	.handler(async ({ data: userId }) => {
		const { sessionUser } = await requireAdmin()

		const updatedUsers = await db
			.update(user)
			.set({
				status: "approved",
				suspendedAt: null,
				suspendedById: null,
				suspendedReason: null,
				updatedAt: new Date(),
			})
			.where(eq(user.id, userId))
			.returning()

		await logAdminAction(sessionUser.id, userId, "user_reactivated")

		return updatedUsers[0]
	})

/**
 * Bulk update user status - admin only
 */
const bulkUpdateStatusSchema = z.object({
	userIds: z.array(z.string()),
	status: z.enum(["approved", "rejected", "suspended"]),
	reason: z.string().optional(), // For suspension
})

export const bulkUpdateUserStatus = createServerFn({ method: "POST" })
	.inputValidator((data: unknown) => bulkUpdateStatusSchema.parse(data))
	.handler(async ({ data }) => {
		const { sessionUser } = await requireAdmin()

		// Filter out self and admins from bulk operations
		const targetUsers = await db.query.user.findMany({
			where: inArray(user.id, data.userIds),
		})

		const validUserIds = targetUsers
			.filter((u) => u.id !== sessionUser.id && u.role !== "admin")
			.map((u) => u.id)

		if (validUserIds.length === 0) {
			throw new Error("No valid users to update")
		}

		const updateData: Record<string, unknown> = {
			status: data.status,
			updatedAt: new Date(),
		}

		if (data.status === "approved") {
			updateData.approvedAt = new Date()
			updateData.approvedById = sessionUser.id
			updateData.suspendedAt = null
			updateData.suspendedById = null
			updateData.suspendedReason = null
		} else if (data.status === "suspended") {
			updateData.suspendedAt = new Date()
			updateData.suspendedById = sessionUser.id
			updateData.suspendedReason = data.reason || null
		}

		await db
			.update(user)
			.set(updateData)
			.where(inArray(user.id, validUserIds))

		// Log actions for each user
		const actionType = data.status === "approved"
			? "user_approved"
			: data.status === "rejected"
				? "user_rejected"
				: "user_suspended"

		for (const userId of validUserIds) {
			await logAdminAction(sessionUser.id, userId, actionType, {
				bulk: true,
				reason: data.reason,
			})
		}

		return { updated: validUserIds.length }
	})

/**
 * Get user details with org/team memberships - admin only
 */
export const getUserDetails = createServerFn({ method: "GET" })
	.inputValidator((data: unknown) => z.string().parse(data))
	.handler(async ({ data: userId }) => {
		await requireAdmin()

		const targetUser = await db.query.user.findFirst({
			where: eq(user.id, userId),
		})

		if (!targetUser) {
			throw new Error("User not found")
		}

		const orgMemberships = await db.query.organizationMember.findMany({
			where: eq(organizationMember.userId, userId),
			with: {
				organization: true,
			},
		})

		const teamMemberships = await db.query.teamMember.findMany({
			where: eq(teamMember.userId, userId),
			with: {
				team: {
					with: {
						organization: true,
					},
				},
			},
		})

		const actionHistory = await db.query.adminActionLog.findMany({
			where: eq(adminActionLog.targetUserId, userId),
			orderBy: desc(adminActionLog.createdAt),
			with: {
				admin: true,
			},
		})

		return {
			user: targetUser,
			organizations: orgMemberships,
			teams: teamMemberships,
			actionHistory,
		}
	})

/**
 * Get admin action log - admin only
 */
const getActionLogSchema = z.object({
	limit: z.number().optional().default(50),
	userId: z.string().optional(), // Filter by target user
}).optional()

export const getAdminActionLog = createServerFn({ method: "GET" })
	.inputValidator((data: unknown) => getActionLogSchema.parse(data))
	.handler(async ({ data }) => {
		await requireAdmin()

		const conditions = data?.userId
			? eq(adminActionLog.targetUserId, data.userId)
			: undefined

		const logs = await db.query.adminActionLog.findMany({
			where: conditions,
			orderBy: desc(adminActionLog.createdAt),
			limit: data?.limit ?? 50,
			with: {
				admin: true,
				targetUser: true,
			},
		})

		return logs
	})

/**
 * Check if any admin exists (for first-user setup)
 */
export const checkAdminExists = createServerFn({ method: "GET" }).handler(
	async () => {
		const admins = await db.query.user.findFirst({
			where: eq(user.role, "admin"),
		})
		return { exists: !!admins }
	}
)

/**
 * Make the first user an admin (bootstrap)
 */
export const bootstrapFirstAdmin = createServerFn({ method: "POST" }).handler(
	async () => {
		const request = getRequest()
		const session = await auth.api.getSession({ headers: request.headers })

		if (!session?.user) {
			throw new Error("Unauthorized")
		}

		// Check if any admin already exists
		const existingAdmin = await db.query.user.findFirst({
			where: eq(user.role, "admin"),
		})

		if (existingAdmin) {
			throw new Error("Admin already exists")
		}

		// Make the current user the first admin
		const updatedUsers = await db
			.update(user)
			.set({
				role: "admin",
				status: "approved",
				approvedAt: new Date(),
				updatedAt: new Date(),
			})
			.where(eq(user.id, session.user.id))
			.returning()

		return updatedUsers[0]
	}
)
