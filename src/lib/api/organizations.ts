import { createServerFn } from "@tanstack/react-start"
import { getRequest } from "@tanstack/react-start/server"
import { z } from "zod"
import { db } from "@/db"
import { organization, organizationMember, team, teamMember, user } from "@/db/schema"
import { eq, and } from "drizzle-orm"
import { auth } from "@/lib/auth"
import { nanoid } from "nanoid"

// ============================================================================
// Helper: Get current user session
// ============================================================================

async function getSessionUser() {
	const request = getRequest()
	const session = await auth.api.getSession({ headers: request.headers })
	return session?.user ?? null
}

async function getFullSessionUser() {
	const sessionUser = await getSessionUser()
	if (!sessionUser) return null
	
	return db.query.user.findFirst({
		where: eq(user.id, sessionUser.id),
	})
}

// ============================================================================
// Organization Functions
// ============================================================================

/**
 * Get all organizations the current user belongs to
 */
export const getMyOrganizations = createServerFn({ method: "GET" }).handler(
	async () => {
		const sessionUser = await getSessionUser()
		if (!sessionUser) {
			throw new Error("Unauthorized")
		}

		const memberships = await db.query.organizationMember.findMany({
			where: eq(organizationMember.userId, sessionUser.id),
			with: {
				organization: {
					with: {
						owner: true,
						members: true,
						teams: true,
					},
				},
			},
		})

		return memberships.map((m) => ({
			...m.organization,
			myRole: m.role,
			memberCount: m.organization.members.length,
			teamCount: m.organization.teams.length,
		}))
	}
)

/**
 * Get a single organization by ID (with member check)
 */
export const getOrganization = createServerFn({ method: "GET" })
	.inputValidator((data: unknown) => z.string().parse(data))
	.handler(async ({ data: orgId }) => {
		const sessionUser = await getSessionUser()
		if (!sessionUser) {
			throw new Error("Unauthorized")
		}

		// Check membership
		const membership = await db.query.organizationMember.findFirst({
			where: and(
				eq(organizationMember.organizationId, orgId),
				eq(organizationMember.userId, sessionUser.id)
			),
		})

		if (!membership) {
			throw new Error("Not a member of this organization")
		}

		const org = await db.query.organization.findFirst({
			where: eq(organization.id, orgId),
			with: {
				owner: true,
				members: {
					with: {
						user: true,
					},
				},
				teams: {
					with: {
						members: true,
					},
				},
			},
		})

		if (!org) {
			throw new Error("Organization not found")
		}

		return {
			...org,
			myRole: membership.role,
		}
	})

/**
 * Create a new organization (Admin only)
 */
const createOrgSchema = z.object({
	name: z.string().min(1).max(100),
	slug: z.string().min(2).max(50).regex(/^[a-z0-9-]+$/),
})

export const createOrganization = createServerFn({ method: "POST" })
	.inputValidator((data: unknown) => createOrgSchema.parse(data))
	.handler(async ({ data }) => {
		const fullUser = await getFullSessionUser()
		if (!fullUser) {
			throw new Error("Unauthorized")
		}

		// Only system admins can create organizations
		if (fullUser.role !== "admin") {
			throw new Error("Only administrators can create organizations")
		}

		// Check if slug is available
		const existing = await db.query.organization.findFirst({
			where: eq(organization.slug, data.slug),
		})

		if (existing) {
			throw new Error("Organization slug already taken")
		}

		const orgId = nanoid()

		// Create org
		await db.insert(organization).values({
			id: orgId,
			name: data.name,
			slug: data.slug,
			ownerId: fullUser.id,
		})

		// Add creator as owner
		await db.insert(organizationMember).values({
			id: nanoid(),
			organizationId: orgId,
			userId: fullUser.id,
			role: "owner",
		})

		return { id: orgId }
	})

/**
 * Update organization details
 */
const updateOrgSchema = z.object({
	id: z.string(),
	name: z.string().min(1).max(100).optional(),
	logo: z.string().url().nullable().optional(),
})

export const updateOrganization = createServerFn({ method: "POST" })
	.inputValidator((data: unknown) => updateOrgSchema.parse(data))
	.handler(async ({ data }) => {
		const sessionUser = await getSessionUser()
		if (!sessionUser) {
			throw new Error("Unauthorized")
		}

		// Check admin/owner permission
		const membership = await db.query.organizationMember.findFirst({
			where: and(
				eq(organizationMember.organizationId, data.id),
				eq(organizationMember.userId, sessionUser.id)
			),
		})

		if (!membership || membership.role === "member") {
			throw new Error("Admin permission required")
		}

		const updateData: Record<string, unknown> = { updatedAt: new Date() }
		if (data.name) updateData.name = data.name
		if (data.logo !== undefined) updateData.logo = data.logo

		await db
			.update(organization)
			.set(updateData)
			.where(eq(organization.id, data.id))

		return { success: true }
	})

/**
 * Delete an organization (owner only)
 */
export const deleteOrganization = createServerFn({ method: "POST" })
	.inputValidator((data: unknown) => z.string().parse(data))
	.handler(async ({ data: orgId }) => {
		const sessionUser = await getSessionUser()
		if (!sessionUser) {
			throw new Error("Unauthorized")
		}

		const org = await db.query.organization.findFirst({
			where: eq(organization.id, orgId),
		})

		if (!org || org.ownerId !== sessionUser.id) {
			throw new Error("Only the owner can delete the organization")
		}

		await db.delete(organization).where(eq(organization.id, orgId))

		return { success: true }
	})

// ============================================================================
// Organization Member Functions
// ============================================================================

/**
 * Invite a user to an organization
 */
const inviteMemberSchema = z.object({
	organizationId: z.string(),
	email: z.string().email(),
	role: z.enum(["admin", "member"]).default("member"),
})

export const inviteOrgMember = createServerFn({ method: "POST" })
	.inputValidator((data: unknown) => inviteMemberSchema.parse(data))
	.handler(async ({ data }) => {
		const sessionUser = await getSessionUser()
		if (!sessionUser) {
			throw new Error("Unauthorized")
		}

		// Check admin/owner permission
		const membership = await db.query.organizationMember.findFirst({
			where: and(
				eq(organizationMember.organizationId, data.organizationId),
				eq(organizationMember.userId, sessionUser.id)
			),
		})

		if (!membership || membership.role === "member") {
			throw new Error("Admin permission required")
		}

		// Find user by email
		const invitedUser = await db.query.user.findFirst({
			where: eq(user.email, data.email),
		})

		if (!invitedUser) {
			throw new Error("User not found with that email")
		}

		// Check if already a member
		const existing = await db.query.organizationMember.findFirst({
			where: and(
				eq(organizationMember.organizationId, data.organizationId),
				eq(organizationMember.userId, invitedUser.id)
			),
		})

		if (existing) {
			throw new Error("User is already a member")
		}

		await db.insert(organizationMember).values({
			id: nanoid(),
			organizationId: data.organizationId,
			userId: invitedUser.id,
			role: data.role,
		})

		return { success: true }
	})

/**
 * Update a member's role
 */
const updateMemberRoleSchema = z.object({
	organizationId: z.string(),
	userId: z.string(),
	role: z.enum(["admin", "member"]),
})

export const updateOrgMemberRole = createServerFn({ method: "POST" })
	.inputValidator((data: unknown) => updateMemberRoleSchema.parse(data))
	.handler(async ({ data }) => {
		const sessionUser = await getSessionUser()
		if (!sessionUser) {
			throw new Error("Unauthorized")
		}

		// Check owner permission (only owner can change roles)
		const org = await db.query.organization.findFirst({
			where: eq(organization.id, data.organizationId),
		})

		if (!org || org.ownerId !== sessionUser.id) {
			throw new Error("Only the owner can change member roles")
		}

		// Can't change owner role
		if (data.userId === org.ownerId) {
			throw new Error("Cannot change owner role")
		}

		await db
			.update(organizationMember)
			.set({ role: data.role })
			.where(
				and(
					eq(organizationMember.organizationId, data.organizationId),
					eq(organizationMember.userId, data.userId)
				)
			)

		return { success: true }
	})

/**
 * Remove a member from an organization
 */
const removeMemberSchema = z.object({
	organizationId: z.string(),
	userId: z.string(),
})

export const removeOrgMember = createServerFn({ method: "POST" })
	.inputValidator((data: unknown) => removeMemberSchema.parse(data))
	.handler(async ({ data }) => {
		const sessionUser = await getSessionUser()
		if (!sessionUser) {
			throw new Error("Unauthorized")
		}

		const org = await db.query.organization.findFirst({
			where: eq(organization.id, data.organizationId),
		})

		if (!org) {
			throw new Error("Organization not found")
		}

		// Owner can remove anyone except themselves
		// Admins can remove members
		// Members can only remove themselves
		const membership = await db.query.organizationMember.findFirst({
			where: and(
				eq(organizationMember.organizationId, data.organizationId),
				eq(organizationMember.userId, sessionUser.id)
			),
		})

		if (!membership) {
			throw new Error("Not a member of this organization")
		}

		const isSelf = data.userId === sessionUser.id

		// Can't remove the owner
		if (data.userId === org.ownerId) {
			throw new Error("Cannot remove the organization owner")
		}

		// Non-admins can only remove themselves
		if (!isSelf && membership.role === "member") {
			throw new Error("Permission denied")
		}

		// Remove from all teams in the org first
		const teams = await db.query.team.findMany({
			where: eq(team.organizationId, data.organizationId),
		})

		for (const t of teams) {
			await db
				.delete(teamMember)
				.where(
					and(eq(teamMember.teamId, t.id), eq(teamMember.userId, data.userId))
				)
		}

		// Remove from org
		await db
			.delete(organizationMember)
			.where(
				and(
					eq(organizationMember.organizationId, data.organizationId),
					eq(organizationMember.userId, data.userId)
				)
			)

		return { success: true }
	})

/**
 * Leave an organization (self-removal)
 */
export const leaveOrganization = createServerFn({ method: "POST" })
	.inputValidator((data: unknown) => z.string().parse(data))
	.handler(async ({ data: orgId }) => {
		const sessionUser = await getSessionUser()
		if (!sessionUser) {
			throw new Error("Unauthorized")
		}

		const org = await db.query.organization.findFirst({
			where: eq(organization.id, orgId),
		})

		if (!org) {
			throw new Error("Organization not found")
		}

		if (org.ownerId === sessionUser.id) {
			throw new Error("Owner cannot leave. Transfer ownership or delete the organization.")
		}

		// Remove from all teams in the org first
		const teams = await db.query.team.findMany({
			where: eq(team.organizationId, orgId),
		})

		for (const t of teams) {
			await db
				.delete(teamMember)
				.where(
					and(eq(teamMember.teamId, t.id), eq(teamMember.userId, sessionUser.id))
				)
		}

		// Remove from org
		await db
			.delete(organizationMember)
			.where(
				and(
					eq(organizationMember.organizationId, orgId),
					eq(organizationMember.userId, sessionUser.id)
				)
			)

		return { success: true }
	})
