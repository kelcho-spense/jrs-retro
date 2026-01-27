import { createServerFn } from "@tanstack/react-start"
import { getRequest } from "@tanstack/react-start/server"
import { z } from "zod"
import { db } from "@/db"
import { user } from "@/db/schema"
import { eq, and, ne } from "drizzle-orm"
import { auth } from "@/lib/auth"

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
 * Get all users (admin only)
 */
export const getAllUsers = createServerFn({ method: "GET" }).handler(
	async () => {
		const request = getRequest()
		const session = await auth.api.getSession({ headers: request.headers })

		if (!session?.user) {
			throw new Error("Unauthorized")
		}

		const currentUser = await db.query.user.findFirst({
			where: eq(user.id, session.user.id),
		})

		if (currentUser?.role !== "admin") {
			throw new Error("Forbidden: Admin access required")
		}

		const users = await db.query.user.findMany({
			orderBy: (users, { desc }) => [desc(users.createdAt)],
		})

		return users
	}
)

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
		const request = getRequest()
		const session = await auth.api.getSession({ headers: request.headers })

		if (!session?.user) {
			throw new Error("Unauthorized")
		}

		const adminUser = await db.query.user.findFirst({
			where: eq(user.id, session.user.id),
		})

		if (adminUser?.role !== "admin") {
			throw new Error("Forbidden: Admin access required")
		}

		const updatedUsers = await db
			.update(user)
			.set({
				status,
				approvedAt: status === "approved" ? new Date() : null,
				approvedById: status === "approved" ? session.user.id : null,
				updatedAt: new Date(),
			})
			.where(eq(user.id, userId))
			.returning()

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
		const request = getRequest()
		const session = await auth.api.getSession({ headers: request.headers })

		if (!session?.user) {
			throw new Error("Unauthorized")
		}

		const adminUser = await db.query.user.findFirst({
			where: eq(user.id, session.user.id),
		})

		if (adminUser?.role !== "admin") {
			throw new Error("Forbidden: Admin access required")
		}

		// Prevent removing the last admin
		if (role === "member" && userId === session.user.id) {
			const adminCount = await db.query.user.findMany({
				where: and(eq(user.role, "admin"), ne(user.id, userId)),
			})
			if (adminCount.length === 0) {
				throw new Error("Cannot remove the last admin")
			}
		}

		const updatedUsers = await db
			.update(user)
			.set({ role, updatedAt: new Date() })
			.where(eq(user.id, userId))
			.returning()

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
		const request = getRequest()
		const session = await auth.api.getSession({ headers: request.headers })

		if (!session?.user) {
			throw new Error("Unauthorized")
		}

		const currentUser = await db.query.user.findFirst({
			where: eq(user.id, session.user.id),
		})

		// Allow self-deletion or admin deletion
		const isSelf = userId === session.user.id
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

		await db.delete(user).where(eq(user.id, userId))

		return { success: true }
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
