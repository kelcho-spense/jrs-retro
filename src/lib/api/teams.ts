import { createServerFn } from "@tanstack/react-start"
import { z } from "zod"
import { db } from "@/db"
import { team, teamMember, teamJoinRequest, organizationMember } from "@/db/schema"
import { eq, and } from "drizzle-orm"
import { auth } from "@/lib/auth"
import { nanoid } from "nanoid"

// ============================================================================
// Helper: Get current user session
// ============================================================================

async function getSessionUser() {
	const { getRequest } = await import("@tanstack/react-start/server")
	const request = getRequest()
	const session = await auth.api.getSession({ headers: request.headers })
	return session?.user ?? null
}

// ============================================================================
// Team Functions
// ============================================================================

/**
 * Get all teams for an organization
 */
export const getTeamsByOrg = createServerFn({ method: "GET" })
	.inputValidator((data: unknown) => z.string().parse(data))
	.handler(async ({ data: orgId }) => {
		const sessionUser = await getSessionUser()
		if (!sessionUser) {
			throw new Error("Unauthorized")
		}

		// Check org membership
		const membership = await db.query.organizationMember.findFirst({
			where: and(
				eq(organizationMember.organizationId, orgId),
				eq(organizationMember.userId, sessionUser.id)
			),
		})

		if (!membership) {
			throw new Error("Not a member of this organization")
		}

		const teams = await db.query.team.findMany({
			where: eq(team.organizationId, orgId),
			with: {
				members: {
					with: {
						user: true,
					},
				},
			},
		})

		// Add user's team membership info
		return teams.map((t) => {
			const myMembership = t.members.find((m) => m.userId === sessionUser.id)
			return {
				...t,
				myRole: myMembership?.role ?? null,
				isMember: !!myMembership,
				memberCount: t.members.length,
			}
		})
	})

/**
 * Get teams the current user is a member of
 */
export const getMyTeams = createServerFn({ method: "GET" }).handler(async () => {
	const sessionUser = await getSessionUser()
	if (!sessionUser) {
		throw new Error("Unauthorized")
	}

	const memberships = await db.query.teamMember.findMany({
		where: eq(teamMember.userId, sessionUser.id),
		with: {
			team: {
				with: {
					organization: true,
					members: true,
				},
			},
		},
	})

	return memberships.map((m) => ({
		...m.team,
		myRole: m.role,
		memberCount: m.team.members.length,
	}))
})

/**
 * Get a single team by ID
 */
export const getTeam = createServerFn({ method: "GET" })
	.inputValidator((data: unknown) => z.string().parse(data))
	.handler(async ({ data: teamId }) => {
		const sessionUser = await getSessionUser()
		if (!sessionUser) {
			throw new Error("Unauthorized")
		}

		const t = await db.query.team.findFirst({
			where: eq(team.id, teamId),
			with: {
				organization: true,
				members: {
					with: {
						user: true,
					},
				},
				joinRequests: {
					where: eq(teamJoinRequest.status, "pending"),
					with: {
						user: true,
					},
				},
			},
		})

		if (!t) {
			throw new Error("Team not found")
		}

		// Check org membership
		const orgMembership = await db.query.organizationMember.findFirst({
			where: and(
				eq(organizationMember.organizationId, t.organizationId),
				eq(organizationMember.userId, sessionUser.id)
			),
		})

		if (!orgMembership) {
			throw new Error("Not a member of this organization")
		}

		const myTeamMembership = t.members.find((m) => m.userId === sessionUser.id)

		// Check if user has a pending join request
		const myPendingRequest = await db.query.teamJoinRequest.findFirst({
			where: and(
				eq(teamJoinRequest.teamId, teamId),
				eq(teamJoinRequest.userId, sessionUser.id),
				eq(teamJoinRequest.status, "pending")
			),
		})

		return {
			...t,
			myRole: myTeamMembership?.role ?? null,
			isMember: !!myTeamMembership,
			orgRole: orgMembership.role,
			hasPendingRequest: !!myPendingRequest,
			myPendingRequestId: myPendingRequest?.id ?? null,
		}
	})

/**
 * Create a new team
 */
const createTeamSchema = z.object({
	organizationId: z.string(),
	name: z.string().min(1).max(100),
	description: z.string().max(500).optional(),
	emoji: z.string().max(10).optional(),
})

export const createTeam = createServerFn({ method: "POST" })
	.inputValidator((data: unknown) => createTeamSchema.parse(data))
	.handler(async ({ data }) => {
		const sessionUser = await getSessionUser()
		if (!sessionUser) {
			throw new Error("Unauthorized")
		}

		// Check org admin/owner permission
		const membership = await db.query.organizationMember.findFirst({
			where: and(
				eq(organizationMember.organizationId, data.organizationId),
				eq(organizationMember.userId, sessionUser.id)
			),
		})

		if (!membership || membership.role === "member") {
			throw new Error("Admin permission required to create teams")
		}

		const teamId = nanoid()

		await db.insert(team).values({
			id: teamId,
			name: data.name,
			description: data.description,
			emoji: data.emoji ?? "👥",
			organizationId: data.organizationId,
		})

		// Creator becomes team lead
		await db.insert(teamMember).values({
			id: nanoid(),
			teamId,
			userId: sessionUser.id,
			role: "lead",
		})

		return { id: teamId }
	})

/**
 * Update team details
 */
const updateTeamSchema = z.object({
	id: z.string(),
	name: z.string().min(1).max(100).optional(),
	description: z.string().max(500).optional().nullable(),
	emoji: z.string().max(10).optional(),
})

export const updateTeam = createServerFn({ method: "POST" })
	.inputValidator((data: unknown) => updateTeamSchema.parse(data))
	.handler(async ({ data }) => {
		const sessionUser = await getSessionUser()
		if (!sessionUser) {
			throw new Error("Unauthorized")
		}

		const t = await db.query.team.findFirst({
			where: eq(team.id, data.id),
		})

		if (!t) {
			throw new Error("Team not found")
		}

		// Check org admin or team lead permission
		const orgMembership = await db.query.organizationMember.findFirst({
			where: and(
				eq(organizationMember.organizationId, t.organizationId),
				eq(organizationMember.userId, sessionUser.id)
			),
		})

		const teamMembership = await db.query.teamMember.findFirst({
			where: and(
				eq(teamMember.teamId, data.id),
				eq(teamMember.userId, sessionUser.id)
			),
		})

		const isOrgAdmin = orgMembership?.role === "owner" || orgMembership?.role === "admin"
		const isTeamLead = teamMembership?.role === "lead"

		if (!isOrgAdmin && !isTeamLead) {
			throw new Error("Permission denied")
		}

		const updateData: Record<string, unknown> = { updatedAt: new Date() }
		if (data.name) updateData.name = data.name
		if (data.description !== undefined) updateData.description = data.description
		if (data.emoji) updateData.emoji = data.emoji

		await db.update(team).set(updateData).where(eq(team.id, data.id))

		return { success: true }
	})

/**
 * Delete a team
 */
export const deleteTeam = createServerFn({ method: "POST" })
	.inputValidator((data: unknown) => z.string().parse(data))
	.handler(async ({ data: teamId }) => {
		const sessionUser = await getSessionUser()
		if (!sessionUser) {
			throw new Error("Unauthorized")
		}

		const t = await db.query.team.findFirst({
			where: eq(team.id, teamId),
		})

		if (!t) {
			throw new Error("Team not found")
		}

		// Check org admin/owner permission
		const orgMembership = await db.query.organizationMember.findFirst({
			where: and(
				eq(organizationMember.organizationId, t.organizationId),
				eq(organizationMember.userId, sessionUser.id)
			),
		})

		if (!orgMembership || orgMembership.role === "member") {
			throw new Error("Admin permission required to delete teams")
		}

		await db.delete(team).where(eq(team.id, teamId))

		return { success: true }
	})

// ============================================================================
// Team Member Functions
// ============================================================================

/**
 * Add a member to a team
 */
const addTeamMemberSchema = z.object({
	teamId: z.string(),
	userId: z.string(),
	role: z.enum(["lead", "member"]).default("member"),
})

export const addTeamMember = createServerFn({ method: "POST" })
	.inputValidator((data: unknown) => addTeamMemberSchema.parse(data))
	.handler(async ({ data }) => {
		const sessionUser = await getSessionUser()
		if (!sessionUser) {
			throw new Error("Unauthorized")
		}

		const t = await db.query.team.findFirst({
			where: eq(team.id, data.teamId),
		})

		if (!t) {
			throw new Error("Team not found")
		}

		// Check org admin or team lead permission
		const orgMembership = await db.query.organizationMember.findFirst({
			where: and(
				eq(organizationMember.organizationId, t.organizationId),
				eq(organizationMember.userId, sessionUser.id)
			),
		})

		const myTeamMembership = await db.query.teamMember.findFirst({
			where: and(
				eq(teamMember.teamId, data.teamId),
				eq(teamMember.userId, sessionUser.id)
			),
		})

		const isOrgAdmin = orgMembership?.role === "owner" || orgMembership?.role === "admin"
		const isTeamLead = myTeamMembership?.role === "lead"

		if (!isOrgAdmin && !isTeamLead) {
			throw new Error("Permission denied")
		}

		// Check if user is an org member
		const targetOrgMembership = await db.query.organizationMember.findFirst({
			where: and(
				eq(organizationMember.organizationId, t.organizationId),
				eq(organizationMember.userId, data.userId)
			),
		})

		if (!targetOrgMembership) {
			throw new Error("User must be an organization member first")
		}

		// Check if already a team member
		const existing = await db.query.teamMember.findFirst({
			where: and(
				eq(teamMember.teamId, data.teamId),
				eq(teamMember.userId, data.userId)
			),
		})

		if (existing) {
			throw new Error("User is already a team member")
		}

		await db.insert(teamMember).values({
			id: nanoid(),
			teamId: data.teamId,
			userId: data.userId,
			role: data.role,
		})

		return { success: true }
	})

/**
 * Update a team member's role
 */
const updateTeamMemberRoleSchema = z.object({
	teamId: z.string(),
	userId: z.string(),
	role: z.enum(["lead", "member"]),
})

export const updateTeamMemberRole = createServerFn({ method: "POST" })
	.inputValidator((data: unknown) => updateTeamMemberRoleSchema.parse(data))
	.handler(async ({ data }) => {
		const sessionUser = await getSessionUser()
		if (!sessionUser) {
			throw new Error("Unauthorized")
		}

		const t = await db.query.team.findFirst({
			where: eq(team.id, data.teamId),
		})

		if (!t) {
			throw new Error("Team not found")
		}

		// Check org admin or team lead permission
		const orgMembership = await db.query.organizationMember.findFirst({
			where: and(
				eq(organizationMember.organizationId, t.organizationId),
				eq(organizationMember.userId, sessionUser.id)
			),
		})

		const myTeamMembership = await db.query.teamMember.findFirst({
			where: and(
				eq(teamMember.teamId, data.teamId),
				eq(teamMember.userId, sessionUser.id)
			),
		})

		const isOrgAdmin = orgMembership?.role === "owner" || orgMembership?.role === "admin"
		const isTeamLead = myTeamMembership?.role === "lead"

		if (!isOrgAdmin && !isTeamLead) {
			throw new Error("Permission denied")
		}

		await db
			.update(teamMember)
			.set({ role: data.role })
			.where(
				and(
					eq(teamMember.teamId, data.teamId),
					eq(teamMember.userId, data.userId)
				)
			)

		return { success: true }
	})

/**
 * Remove a member from a team
 */
const removeTeamMemberSchema = z.object({
	teamId: z.string(),
	userId: z.string(),
})

export const removeTeamMember = createServerFn({ method: "POST" })
	.inputValidator((data: unknown) => removeTeamMemberSchema.parse(data))
	.handler(async ({ data }) => {
		const sessionUser = await getSessionUser()
		if (!sessionUser) {
			throw new Error("Unauthorized")
		}

		const t = await db.query.team.findFirst({
			where: eq(team.id, data.teamId),
		})

		if (!t) {
			throw new Error("Team not found")
		}

		const isSelf = data.userId === sessionUser.id

		// Check permissions
		const orgMembership = await db.query.organizationMember.findFirst({
			where: and(
				eq(organizationMember.organizationId, t.organizationId),
				eq(organizationMember.userId, sessionUser.id)
			),
		})

		const myTeamMembership = await db.query.teamMember.findFirst({
			where: and(
				eq(teamMember.teamId, data.teamId),
				eq(teamMember.userId, sessionUser.id)
			),
		})

		const isOrgAdmin = orgMembership?.role === "owner" || orgMembership?.role === "admin"
		const isTeamLead = myTeamMembership?.role === "lead"

		// Self-removal is always allowed
		if (!isSelf && !isOrgAdmin && !isTeamLead) {
			throw new Error("Permission denied")
		}

		await db
			.delete(teamMember)
			.where(
				and(
					eq(teamMember.teamId, data.teamId),
					eq(teamMember.userId, data.userId)
				)
			)

		return { success: true }
	})

/**
 * Join a team (self-add for org members)
 */
export const joinTeam = createServerFn({ method: "POST" })
	.inputValidator((data: unknown) => z.string().parse(data))
	.handler(async ({ data: teamId }) => {
		const sessionUser = await getSessionUser()
		if (!sessionUser) {
			throw new Error("Unauthorized")
		}

		const t = await db.query.team.findFirst({
			where: eq(team.id, teamId),
		})

		if (!t) {
			throw new Error("Team not found")
		}

		// Check org membership
		const orgMembership = await db.query.organizationMember.findFirst({
			where: and(
				eq(organizationMember.organizationId, t.organizationId),
				eq(organizationMember.userId, sessionUser.id)
			),
		})

		if (!orgMembership) {
			throw new Error("Must be an organization member to join teams")
		}

		// Check if already a team member
		const existing = await db.query.teamMember.findFirst({
			where: and(
				eq(teamMember.teamId, teamId),
				eq(teamMember.userId, sessionUser.id)
			),
		})

		if (existing) {
			throw new Error("Already a team member")
		}

		await db.insert(teamMember).values({
			id: nanoid(),
			teamId,
			userId: sessionUser.id,
			role: "member",
		})

		return { success: true }
	})

/**
 * Leave a team (self-removal)
 */
export const leaveTeam = createServerFn({ method: "POST" })
	.inputValidator((data: unknown) => z.string().parse(data))
	.handler(async ({ data: teamId }) => {
		const sessionUser = await getSessionUser()
		if (!sessionUser) {
			throw new Error("Unauthorized")
		}

		await db
			.delete(teamMember)
			.where(
				and(
					eq(teamMember.teamId, teamId),
					eq(teamMember.userId, sessionUser.id)
				)
			)

		return { success: true }
	})

// ============================================================================
// Team Join Request Functions
// ============================================================================

/**
 * Request to join a team
 */
const requestToJoinTeamSchema = z.object({
	teamId: z.string(),
	message: z.string().max(500).optional(),
})

export const requestToJoinTeam = createServerFn({ method: "POST" })
	.inputValidator((data: unknown) => requestToJoinTeamSchema.parse(data))
	.handler(async ({ data }) => {
		const sessionUser = await getSessionUser()
		if (!sessionUser) {
			throw new Error("Unauthorized")
		}

		const t = await db.query.team.findFirst({
			where: eq(team.id, data.teamId),
		})

		if (!t) {
			throw new Error("Team not found")
		}

		// Check org membership
		const orgMembership = await db.query.organizationMember.findFirst({
			where: and(
				eq(organizationMember.organizationId, t.organizationId),
				eq(organizationMember.userId, sessionUser.id)
			),
		})

		if (!orgMembership) {
			throw new Error("Must be an organization member to request joining teams")
		}

		// Check if already a team member
		const existingMember = await db.query.teamMember.findFirst({
			where: and(
				eq(teamMember.teamId, data.teamId),
				eq(teamMember.userId, sessionUser.id)
			),
		})

		if (existingMember) {
			throw new Error("Already a team member")
		}

		// Check if there's already a pending request
		const existingRequest = await db.query.teamJoinRequest.findFirst({
			where: and(
				eq(teamJoinRequest.teamId, data.teamId),
				eq(teamJoinRequest.userId, sessionUser.id),
				eq(teamJoinRequest.status, "pending")
			),
		})

		if (existingRequest) {
			throw new Error("You already have a pending request to join this team")
		}

		await db.insert(teamJoinRequest).values({
			id: nanoid(),
			teamId: data.teamId,
			userId: sessionUser.id,
			message: data.message,
			status: "pending",
		})

		return { success: true }
	})

/**
 * Get pending join requests for a team (for admins/leads)
 */
export const getTeamJoinRequests = createServerFn({ method: "GET" })
	.inputValidator((data: unknown) => z.string().parse(data))
	.handler(async ({ data: teamId }) => {
		const sessionUser = await getSessionUser()
		if (!sessionUser) {
			throw new Error("Unauthorized")
		}

		const t = await db.query.team.findFirst({
			where: eq(team.id, teamId),
		})

		if (!t) {
			throw new Error("Team not found")
		}

		// Check org admin or team lead permission
		const orgMembership = await db.query.organizationMember.findFirst({
			where: and(
				eq(organizationMember.organizationId, t.organizationId),
				eq(organizationMember.userId, sessionUser.id)
			),
		})

		const myTeamMembership = await db.query.teamMember.findFirst({
			where: and(
				eq(teamMember.teamId, teamId),
				eq(teamMember.userId, sessionUser.id)
			),
		})

		const isOrgAdmin = orgMembership?.role === "owner" || orgMembership?.role === "admin"
		const isTeamLead = myTeamMembership?.role === "lead"

		if (!isOrgAdmin && !isTeamLead) {
			throw new Error("Permission denied")
		}

		const requests = await db.query.teamJoinRequest.findMany({
			where: and(
				eq(teamJoinRequest.teamId, teamId),
				eq(teamJoinRequest.status, "pending")
			),
			with: {
				user: true,
			},
			orderBy: (t, { desc }) => [desc(t.createdAt)],
		})

		return requests
	})

/**
 * Get my pending join requests
 */
export const getMyJoinRequests = createServerFn({ method: "GET" }).handler(async () => {
	const sessionUser = await getSessionUser()
	if (!sessionUser) {
		throw new Error("Unauthorized")
	}

	const requests = await db.query.teamJoinRequest.findMany({
		where: eq(teamJoinRequest.userId, sessionUser.id),
		with: {
			team: {
				with: {
					organization: true,
				},
			},
		},
		orderBy: (t, { desc }) => [desc(t.createdAt)],
	})

	return requests
})

/**
 * Approve a join request
 */
const approveJoinRequestSchema = z.object({
	requestId: z.string(),
	role: z.enum(["lead", "member"]).default("member"),
})

export const approveJoinRequest = createServerFn({ method: "POST" })
	.inputValidator((data: unknown) => approveJoinRequestSchema.parse(data))
	.handler(async ({ data }) => {
		const sessionUser = await getSessionUser()
		if (!sessionUser) {
			throw new Error("Unauthorized")
		}

		const request = await db.query.teamJoinRequest.findFirst({
			where: eq(teamJoinRequest.id, data.requestId),
			with: {
				team: true,
			},
		})

		if (!request) {
			throw new Error("Request not found")
		}

		if (request.status !== "pending") {
			throw new Error("Request has already been processed")
		}

		// Check org admin or team lead permission
		const orgMembership = await db.query.organizationMember.findFirst({
			where: and(
				eq(organizationMember.organizationId, request.team.organizationId),
				eq(organizationMember.userId, sessionUser.id)
			),
		})

		const myTeamMembership = await db.query.teamMember.findFirst({
			where: and(
				eq(teamMember.teamId, request.teamId),
				eq(teamMember.userId, sessionUser.id)
			),
		})

		const isOrgAdmin = orgMembership?.role === "owner" || orgMembership?.role === "admin"
		const isTeamLead = myTeamMembership?.role === "lead"

		if (!isOrgAdmin && !isTeamLead) {
			throw new Error("Permission denied")
		}

		// Update request status
		await db
			.update(teamJoinRequest)
			.set({
				status: "approved",
				reviewedById: sessionUser.id,
				reviewedAt: new Date(),
				updatedAt: new Date(),
			})
			.where(eq(teamJoinRequest.id, data.requestId))

		// Add user as team member
		await db.insert(teamMember).values({
			id: nanoid(),
			teamId: request.teamId,
			userId: request.userId,
			role: data.role,
		})

		return { success: true }
	})

/**
 * Reject a join request
 */
const rejectJoinRequestSchema = z.object({
	requestId: z.string(),
	note: z.string().max(500).optional(),
})

export const rejectJoinRequest = createServerFn({ method: "POST" })
	.inputValidator((data: unknown) => rejectJoinRequestSchema.parse(data))
	.handler(async ({ data }) => {
		const sessionUser = await getSessionUser()
		if (!sessionUser) {
			throw new Error("Unauthorized")
		}

		const request = await db.query.teamJoinRequest.findFirst({
			where: eq(teamJoinRequest.id, data.requestId),
			with: {
				team: true,
			},
		})

		if (!request) {
			throw new Error("Request not found")
		}

		if (request.status !== "pending") {
			throw new Error("Request has already been processed")
		}

		// Check org admin or team lead permission
		const orgMembership = await db.query.organizationMember.findFirst({
			where: and(
				eq(organizationMember.organizationId, request.team.organizationId),
				eq(organizationMember.userId, sessionUser.id)
			),
		})

		const myTeamMembership = await db.query.teamMember.findFirst({
			where: and(
				eq(teamMember.teamId, request.teamId),
				eq(teamMember.userId, sessionUser.id)
			),
		})

		const isOrgAdmin = orgMembership?.role === "owner" || orgMembership?.role === "admin"
		const isTeamLead = myTeamMembership?.role === "lead"

		if (!isOrgAdmin && !isTeamLead) {
			throw new Error("Permission denied")
		}

		await db
			.update(teamJoinRequest)
			.set({
				status: "rejected",
				reviewedById: sessionUser.id,
				reviewedAt: new Date(),
				reviewNote: data.note,
				updatedAt: new Date(),
			})
			.where(eq(teamJoinRequest.id, data.requestId))

		return { success: true }
	})

/**
 * Cancel a pending join request (by the requester)
 */
export const cancelJoinRequest = createServerFn({ method: "POST" })
	.inputValidator((data: unknown) => z.string().parse(data))
	.handler(async ({ data: requestId }) => {
		const sessionUser = await getSessionUser()
		if (!sessionUser) {
			throw new Error("Unauthorized")
		}

		const request = await db.query.teamJoinRequest.findFirst({
			where: eq(teamJoinRequest.id, requestId),
		})

		if (!request) {
			throw new Error("Request not found")
		}

		if (request.userId !== sessionUser.id) {
			throw new Error("Permission denied")
		}

		if (request.status !== "pending") {
			throw new Error("Can only cancel pending requests")
		}

		await db.delete(teamJoinRequest).where(eq(teamJoinRequest.id, requestId))

		return { success: true }
	})
