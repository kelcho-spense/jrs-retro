import { createServerFn } from "@tanstack/react-start"
import { z } from "zod"
import { nanoid } from "nanoid"
import { db } from "@/db"
import {
	retrospective,
	team,
	template,
	templateColumn,
	card,
	vote,
	cardComment,
	retroParticipant,
	teamMember,
} from "@/db/schema"
import { desc, eq, count, and } from "drizzle-orm"
import { getSessionUser } from "./users"

// ============================================================================
// Template APIs
// ============================================================================

/**
 * Get all templates (built-in + org-specific)
 */
export const getTemplates = createServerFn({ method: "GET" }).handler(
	async () => {
		const templates = await db.query.template.findMany({
			with: {
				columns: {
					orderBy: (columns, { asc }) => [asc(columns.order)],
				},
			},
		})
		return templates
	}
)

/**
 * Get template by ID with columns
 */
export const getTemplateById = createServerFn({ method: "GET" })
	.inputValidator((data: unknown) => z.object({ templateId: z.string() }).parse(data))
	.handler(async ({ data }) => {
		const { templateId: id } = data
		const tmpl = await db.query.template.findFirst({
			where: eq(template.id, id),
			with: {
				columns: {
					orderBy: (columns, { asc }) => [asc(columns.order)],
				},
			},
		})
		return tmpl
	})

/**
 * Seed built-in templates (4Ls, Appreciation Game, Cupid's Retrospective)
 */
export const seedBuiltInTemplates = createServerFn({ method: "POST" }).handler(
	async () => {
		// Check if templates already exist
		const existing = await db.query.template.findFirst({
			where: eq(template.isBuiltIn, true),
		})

		if (existing) {
			return { message: "Templates already seeded" }
		}

		const templates = [
			{
				id: "template-4ls",
				name: "4Ls",
				description:
					"Four simple words to dig into both positive and negative aspects of your last Sprint. The Ls stand for: liked, learned, lacked, and longed for.",
				isBuiltIn: true,
				columns: [
					{ name: "Liked", emoji: "❤️", prompt: "Things you really enjoyed", order: 0 },
					{ name: "Learned", emoji: "📚", prompt: "Things you have learned", order: 1 },
					{ name: "Lacked", emoji: "⚠️", prompt: "Things the team missed", order: 2 },
					{ name: "Longed For", emoji: "🌟", prompt: "Something you wished for", order: 3 },
				],
			},
			{
				id: "template-appreciation",
				name: "Appreciation Game",
				description:
					"A short activity based on the good things your team members did! Reinforce your team's relationship hence its velocity.",
				isBuiltIn: true,
				columns: [
					{ name: "Team Spirit", emoji: "🤝", prompt: "You really served the team when…", order: 0 },
					{ name: "Ideas", emoji: "💡", prompt: "What I would like to see more of", order: 1 },
				],
			},
			{
				id: "template-cupid",
				name: "Cupid's Retrospective",
				description:
					"Spread the love at your retrospective! Strengthen bonds and accentuate recognition within the team.",
				isBuiltIn: true,
				columns: [
					{ name: "Self-love", emoji: "💜", prompt: "Tell us how you made a difference", order: 0 },
					{ name: "Good Stuff!", emoji: "👍", prompt: "What did you like about the last Sprint/project?", order: 1 },
					{ name: "My Wishes", emoji: "🌠", prompt: "What are your wishes for the team?", order: 2 },
					{ name: "A Team to Die For", emoji: "💕", prompt: "Share sweet words about your teammates", order: 3 },
				],
			},
		]

		for (const tmpl of templates) {
			await db.insert(template).values({
				id: tmpl.id,
				name: tmpl.name,
				description: tmpl.description,
				isBuiltIn: tmpl.isBuiltIn,
			})

			for (const col of tmpl.columns) {
				await db.insert(templateColumn).values({
					id: nanoid(),
					templateId: tmpl.id,
					name: col.name,
					emoji: col.emoji,
					prompt: col.prompt,
					order: col.order,
				})
			}
		}

		return { message: "Templates seeded successfully" }
	}
)

// ============================================================================
// Retrospective APIs
// ============================================================================

/**
 * Get recent retrospectives with team and template info
 */
export const getRecentRetros = createServerFn({ method: "GET" }).handler(
	async () => {
		const retros = await db
			.select({
				id: retrospective.id,
				name: retrospective.name,
				status: retrospective.status,
				createdAt: retrospective.createdAt,
				teamId: retrospective.teamId,
				teamName: team.name,
				teamEmoji: team.emoji,
				templateId: retrospective.templateId,
				templateName: template.name,
			})
			.from(retrospective)
			.leftJoin(team, eq(retrospective.teamId, team.id))
			.leftJoin(template, eq(retrospective.templateId, template.id))
			.orderBy(desc(retrospective.createdAt))
			.limit(10)

		return retros
	}
)

/**
 * Get user's teams for creating a new retro
 */
export const getMyTeamsForRetro = createServerFn({ method: "GET" }).handler(
	async () => {
		const sessionUser = await getSessionUser()
		if (!sessionUser) {
			throw new Error("Unauthorized")
		}

		const teams = await db.query.teamMember.findMany({
			where: eq(teamMember.userId, sessionUser.id),
			with: {
				team: {
					with: {
						organization: true,
					},
				},
			},
		})

		return teams.map((tm) => ({
			id: tm.team.id,
			name: tm.team.name,
			emoji: tm.team.emoji,
			organization: tm.team.organization,
			role: tm.role,
		}))
	}
)

const createRetroSchema = z.object({
	name: z.string().min(1).max(200),
	teamId: z.string(),
	templateId: z.string(),
	isAnonymous: z.boolean().default(true),
	maxVotesPerUser: z.number().min(1).max(10).default(3),
	voteType: z.enum(["multi", "single"]).default("multi"),
	timerDuration: z.number().min(60).max(3600).optional(), // 1 minute to 1 hour
})

/**
 * Create a new retrospective
 */
export const createRetro = createServerFn({ method: "POST" })
	.inputValidator((data: unknown) => createRetroSchema.parse(data))
	.handler(async ({ data }) => {
		const sessionUser = await getSessionUser()
		if (!sessionUser) {
			throw new Error("Unauthorized")
		}

		// Check if user is a member of the team
		const membership = await db.query.teamMember.findFirst({
			where: and(
				eq(teamMember.teamId, data.teamId),
				eq(teamMember.userId, sessionUser.id)
			),
		})

		if (!membership) {
			throw new Error("You must be a team member to create a retrospective")
		}

		const retroId = nanoid()

		await db.insert(retrospective).values({
			id: retroId,
			name: data.name,
			teamId: data.teamId,
			templateId: data.templateId,
			isAnonymous: data.isAnonymous,
			maxVotesPerUser: data.maxVotesPerUser,
			voteType: data.voteType,
			timerDuration: data.timerDuration ?? null,
			createdById: sessionUser.id,
		})

		// Add creator as participant
		await db.insert(retroParticipant).values({
			id: nanoid(),
			retroId: retroId,
			userId: sessionUser.id,
		})

		return { id: retroId }
	})

/**
 * Get retrospective by ID with full details
 */
export const getRetro = createServerFn({ method: "GET" })
	.inputValidator((data: unknown) => z.object({ retroId: z.string() }).parse(data))
	.handler(async ({ data }) => {
		const { retroId } = data
		const sessionUser = await getSessionUser()
		if (!sessionUser) {
			throw new Error("Unauthorized")
		}

		const retro = await db.query.retrospective.findFirst({
			where: eq(retrospective.id, retroId),
			with: {
				team: {
					with: {
						organization: true,
					},
				},
				template: {
					with: {
						columns: {
							orderBy: (columns, { asc }) => [asc(columns.order)],
						},
					},
				},
				participants: {
					with: {
						user: true,
					},
				},
				cards: {
					with: {
						author: true,
						votes: true,
						comments: {
							with: {
								author: true,
							},
							orderBy: (comments, { asc }) => [asc(comments.createdAt)],
						},
					},
				},
				createdBy: true,
			},
		})

		if (!retro) {
			throw new Error("Retrospective not found")
		}

		// Check if user is a team member
		const membership = await db.query.teamMember.findFirst({
			where: and(
				eq(teamMember.teamId, retro.teamId),
				eq(teamMember.userId, sessionUser.id)
			),
		})

		if (!membership) {
			throw new Error("You must be a team member to view this retrospective")
		}

		// Check if timer is still running (cards should be hidden)
		const now = new Date()
		const timerRunning = retro.timerEndsAt && new Date(retro.timerEndsAt) > now

		// If anonymous and timer running, hide other users' cards
		const processedCards = retro.cards.map((c) => {
			const isOwn = c.authorId === sessionUser.id
			const shouldHideAuthor = retro.isAnonymous && retro.status !== "completed"
			const shouldHideContent = timerRunning && !isOwn

			return {
				...c,
				content: shouldHideContent ? "" : c.content,
				author: shouldHideAuthor && !isOwn ? null : c.author,
				isOwn,
				voteCount: c.votes.length,
				hasVoted: c.votes.some((v) => v.userId === sessionUser.id),
				comments: c.comments.map((comment) => ({
					...comment,
					isOwn: comment.authorId === sessionUser.id,
				})),
			}
		})

		// Get user's vote count
		const userVoteCount = retro.cards.reduce(
			(acc, c) => acc + c.votes.filter((v) => v.userId === sessionUser.id).length,
			0
		)

		return {
			...retro,
			cards: processedCards,
			timerRunning,
			timeRemaining: timerRunning
				? Math.max(0, Math.floor((new Date(retro.timerEndsAt!).getTime() - now.getTime()) / 1000))
				: 0,
			userVoteCount,
			isParticipant: retro.participants.some((p) => p.userId === sessionUser.id),
			isCreator: retro.createdById === sessionUser.id,
			isTeamLead: membership?.role === "lead",
			currentUserId: sessionUser.id,
		}
	})

/**
 * Start the retrospective (begin timer)
 */
export const startRetro = createServerFn({ method: "POST" })
	.inputValidator((data: unknown) => z.object({ retroId: z.string() }).parse(data))
	.handler(async ({ data }) => {
		const { retroId } = data
		const sessionUser = await getSessionUser()
		if (!sessionUser) {
			throw new Error("Unauthorized")
		}

		const retro = await db.query.retrospective.findFirst({
			where: eq(retrospective.id, retroId),
		})

		if (!retro) {
			throw new Error("Retrospective not found")
		}

		// Check if user is the creator or team lead
		const membership = await db.query.teamMember.findFirst({
			where: and(
				eq(teamMember.teamId, retro.teamId),
				eq(teamMember.userId, sessionUser.id)
			),
		})

		if (!membership || (membership.role !== "lead" && retro.createdById !== sessionUser.id)) {
			throw new Error("Only the creator or team lead can start the retrospective")
		}

		const now = new Date()
		const timerEndsAt = retro.timerDuration
			? new Date(now.getTime() + retro.timerDuration * 1000)
			: null

		await db
			.update(retrospective)
			.set({
				status: "active",
				timerStartedAt: now,
				timerEndsAt,
				updatedAt: now,
			})
			.where(eq(retrospective.id, retroId))

		return { success: true }
	})

/**
 * Move to voting phase
 */
export const moveToVoting = createServerFn({ method: "POST" })
	.inputValidator((data: unknown) => z.object({ retroId: z.string() }).parse(data))
	.handler(async ({ data }) => {
		const { retroId } = data
		const sessionUser = await getSessionUser()
		if (!sessionUser) {
			throw new Error("Unauthorized")
		}

		const retro = await db.query.retrospective.findFirst({
			where: eq(retrospective.id, retroId),
		})

		if (!retro) {
			throw new Error("Retrospective not found")
		}

		const membership = await db.query.teamMember.findFirst({
			where: and(
				eq(teamMember.teamId, retro.teamId),
				eq(teamMember.userId, sessionUser.id)
			),
		})

		if (!membership || (membership.role !== "lead" && retro.createdById !== sessionUser.id)) {
			throw new Error("Only the creator or team lead can control the retrospective")
		}

		await db
			.update(retrospective)
			.set({
				status: "voting",
				timerEndsAt: null, // Clear timer
				updatedAt: new Date(),
			})
			.where(eq(retrospective.id, retroId))

		return { success: true }
	})

/**
 * Move to discussion phase
 */
export const moveToDiscussion = createServerFn({ method: "POST" })
	.inputValidator((data: unknown) => z.object({ retroId: z.string() }).parse(data))
	.handler(async ({ data }) => {
		const { retroId } = data
		const sessionUser = await getSessionUser()
		if (!sessionUser) {
			throw new Error("Unauthorized")
		}

		const retro = await db.query.retrospective.findFirst({
			where: eq(retrospective.id, retroId),
		})

		if (!retro) {
			throw new Error("Retrospective not found")
		}

		const membership = await db.query.teamMember.findFirst({
			where: and(
				eq(teamMember.teamId, retro.teamId),
				eq(teamMember.userId, sessionUser.id)
			),
		})

		if (!membership || (membership.role !== "lead" && retro.createdById !== sessionUser.id)) {
			throw new Error("Only the creator or team lead can control the retrospective")
		}

		await db
			.update(retrospective)
			.set({
				status: "discussing",
				updatedAt: new Date(),
			})
			.where(eq(retrospective.id, retroId))

		return { success: true }
	})

/**
 * Complete the retrospective
 */
export const completeRetro = createServerFn({ method: "POST" })
	.inputValidator((data: unknown) => z.object({ retroId: z.string() }).parse(data))
	.handler(async ({ data }) => {
		const { retroId } = data
		const sessionUser = await getSessionUser()
		if (!sessionUser) {
			throw new Error("Unauthorized")
		}

		const retro = await db.query.retrospective.findFirst({
			where: eq(retrospective.id, retroId),
		})

		if (!retro) {
			throw new Error("Retrospective not found")
		}

		const membership = await db.query.teamMember.findFirst({
			where: and(
				eq(teamMember.teamId, retro.teamId),
				eq(teamMember.userId, sessionUser.id)
			),
		})

		if (!membership || (membership.role !== "lead" && retro.createdById !== sessionUser.id)) {
			throw new Error("Only the creator or team lead can complete the retrospective")
		}

		const now = new Date()

		await db
			.update(retrospective)
			.set({
				status: "completed",
				completedAt: now,
				updatedAt: now,
			})
			.where(eq(retrospective.id, retroId))

		return { success: true }
	})

/**
 * Join a retrospective as participant
 */
export const joinRetro = createServerFn({ method: "POST" })
	.inputValidator((data: unknown) => z.object({ retroId: z.string() }).parse(data))
	.handler(async ({ data }) => {
		const { retroId } = data
		const sessionUser = await getSessionUser()
		if (!sessionUser) {
			throw new Error("Unauthorized")
		}

		const retro = await db.query.retrospective.findFirst({
			where: eq(retrospective.id, retroId),
		})

		if (!retro) {
			throw new Error("Retrospective not found")
		}

		// Check team membership
		const membership = await db.query.teamMember.findFirst({
			where: and(
				eq(teamMember.teamId, retro.teamId),
				eq(teamMember.userId, sessionUser.id)
			),
		})

		if (!membership) {
			throw new Error("You must be a team member to join this retrospective")
		}

		// Check if already a participant
		const existingParticipant = await db.query.retroParticipant.findFirst({
			where: and(
				eq(retroParticipant.retroId, retroId),
				eq(retroParticipant.userId, sessionUser.id)
			),
		})

		if (!existingParticipant) {
			await db.insert(retroParticipant).values({
				id: nanoid(),
				retroId,
				userId: sessionUser.id,
			})
		}

		return { success: true }
	})

// ============================================================================
// Card APIs
// ============================================================================

const createCardSchema = z.object({
	retroId: z.string(),
	columnId: z.string(),
	content: z.string().min(1).max(1000),
})

/**
 * Create a new card
 */
export const createCard = createServerFn({ method: "POST" })
	.inputValidator((data: unknown) => createCardSchema.parse(data))
	.handler(async ({ data }) => {
		const sessionUser = await getSessionUser()
		if (!sessionUser) {
			throw new Error("Unauthorized")
		}

		const retro = await db.query.retrospective.findFirst({
			where: eq(retrospective.id, data.retroId),
		})

		if (!retro) {
			throw new Error("Retrospective not found")
		}

		if (retro.status !== "active" && retro.status !== "draft") {
			throw new Error("Cannot add cards in this phase")
		}

		// Check team membership
		const membership = await db.query.teamMember.findFirst({
			where: and(
				eq(teamMember.teamId, retro.teamId),
				eq(teamMember.userId, sessionUser.id)
			),
		})

		if (!membership) {
			throw new Error("You must be a team member to add cards")
		}

		const cardId = nanoid()

		await db.insert(card).values({
			id: cardId,
			retroId: data.retroId,
			columnId: data.columnId,
			authorId: sessionUser.id,
			content: data.content,
		})

		return { id: cardId }
	})

const updateCardSchema = z.object({
	cardId: z.string(),
	content: z.string().min(1).max(1000),
})

/**
 * Update a card
 */
export const updateCard = createServerFn({ method: "POST" })
	.inputValidator((data: unknown) => updateCardSchema.parse(data))
	.handler(async ({ data }) => {
		const sessionUser = await getSessionUser()
		if (!sessionUser) {
			throw new Error("Unauthorized")
		}

		const existingCard = await db.query.card.findFirst({
			where: eq(card.id, data.cardId),
			with: {
				retrospective: true,
			},
		})

		if (!existingCard) {
			throw new Error("Card not found")
		}

		if (existingCard.authorId !== sessionUser.id) {
			throw new Error("You can only edit your own cards")
		}

		if (existingCard.retrospective.status === "completed") {
			throw new Error("Cannot edit cards in a completed retrospective")
		}

		await db
			.update(card)
			.set({
				content: data.content,
				updatedAt: new Date(),
			})
			.where(eq(card.id, data.cardId))

		return { success: true }
	})

/**
 * Delete a card
 */
export const deleteCard = createServerFn({ method: "POST" })
	.inputValidator((data: unknown) => z.string().parse(data))
	.handler(async ({ data: cardId }) => {
		const sessionUser = await getSessionUser()
		if (!sessionUser) {
			throw new Error("Unauthorized")
		}

		const existingCard = await db.query.card.findFirst({
			where: eq(card.id, cardId),
			with: {
				retrospective: true,
			},
		})

		if (!existingCard) {
			throw new Error("Card not found")
		}

		if (existingCard.authorId !== sessionUser.id) {
			throw new Error("You can only delete your own cards")
		}

		if (existingCard.retrospective.status === "completed") {
			throw new Error("Cannot delete cards in a completed retrospective")
		}

		await db.delete(card).where(eq(card.id, cardId))

		return { success: true }
	})

// ============================================================================
// Voting APIs
// ============================================================================

const voteSchema = z.object({
	cardId: z.string(),
})

/**
 * Vote for a card
 */
export const voteForCard = createServerFn({ method: "POST" })
	.inputValidator((data: unknown) => voteSchema.parse(data))
	.handler(async ({ data }) => {
		const sessionUser = await getSessionUser()
		if (!sessionUser) {
			throw new Error("Unauthorized")
		}

		const cardData = await db.query.card.findFirst({
			where: eq(card.id, data.cardId),
			with: {
				retrospective: true,
				votes: true,
			},
		})

		if (!cardData) {
			throw new Error("Card not found")
		}

		if (cardData.retrospective.status !== "voting") {
			throw new Error("Voting is not active")
		}

		// Check team membership
		const membership = await db.query.teamMember.findFirst({
			where: and(
				eq(teamMember.teamId, cardData.retrospective.teamId),
				eq(teamMember.userId, sessionUser.id)
			),
		})

		if (!membership) {
			throw new Error("You must be a team member to vote")
		}

		// Check if already voted on this card
		const existingVote = cardData.votes.find((v) => v.userId === sessionUser.id)
		if (existingVote) {
			throw new Error("You have already voted on this card")
		}

		// Check max votes
		const userVotes = await db
			.select({ count: count() })
			.from(vote)
			.innerJoin(card, eq(vote.cardId, card.id))
			.where(
				and(
					eq(card.retroId, cardData.retrospective.id),
					eq(vote.userId, sessionUser.id)
				)
			)

		const currentVotes = userVotes[0]?.count ?? 0

		if (cardData.retrospective.voteType === "single" && currentVotes >= 1) {
			throw new Error("You can only vote once in single-vote mode")
		}

		if (currentVotes >= cardData.retrospective.maxVotesPerUser) {
			throw new Error(`You have used all ${cardData.retrospective.maxVotesPerUser} votes`)
		}

		await db.insert(vote).values({
			id: nanoid(),
			cardId: data.cardId,
			userId: sessionUser.id,
		})

		return { success: true }
	})

/**
 * Remove vote from a card
 */
export const removeVote = createServerFn({ method: "POST" })
	.inputValidator((data: unknown) => voteSchema.parse(data))
	.handler(async ({ data }) => {
		const sessionUser = await getSessionUser()
		if (!sessionUser) {
			throw new Error("Unauthorized")
		}

		const cardData = await db.query.card.findFirst({
			where: eq(card.id, data.cardId),
			with: {
				retrospective: true,
			},
		})

		if (!cardData) {
			throw new Error("Card not found")
		}

		if (cardData.retrospective.status !== "voting") {
			throw new Error("Voting is not active")
		}

		await db
			.delete(vote)
			.where(and(eq(vote.cardId, data.cardId), eq(vote.userId, sessionUser.id)))

		return { success: true }
	})

// ============================================================================
// Comment APIs
// ============================================================================

const createCommentSchema = z.object({
	cardId: z.string(),
	content: z.string().min(1).max(500),
})

/**
 * Add a comment to a card
 */
export const createComment = createServerFn({ method: "POST" })
	.inputValidator((data: unknown) => createCommentSchema.parse(data))
	.handler(async ({ data }) => {
		const sessionUser = await getSessionUser()
		if (!sessionUser) {
			throw new Error("Unauthorized")
		}

		const cardData = await db.query.card.findFirst({
			where: eq(card.id, data.cardId),
			with: {
				retrospective: true,
			},
		})

		if (!cardData) {
			throw new Error("Card not found")
		}

		// Check team membership
		const membership = await db.query.teamMember.findFirst({
			where: and(
				eq(teamMember.teamId, cardData.retrospective.teamId),
				eq(teamMember.userId, sessionUser.id)
			),
		})

		if (!membership) {
			throw new Error("You must be a team member to comment")
		}

		const commentId = nanoid()

		await db.insert(cardComment).values({
			id: commentId,
			cardId: data.cardId,
			authorId: sessionUser.id,
			content: data.content,
		})

		return { id: commentId }
	})

/**
 * Delete a comment
 */
export const deleteComment = createServerFn({ method: "POST" })
	.inputValidator((data: unknown) => z.object({ commentId: z.string() }).parse(data))
	.handler(async ({ data }) => {
		const { commentId } = data
		const sessionUser = await getSessionUser()
		if (!sessionUser) {
			throw new Error("Unauthorized")
		}

		const comment = await db.query.cardComment.findFirst({
			where: eq(cardComment.id, commentId),
		})

		if (!comment) {
			throw new Error("Comment not found")
		}

		if (comment.authorId !== sessionUser.id) {
			throw new Error("You can only delete your own comments")
		}

		await db.delete(cardComment).where(eq(cardComment.id, commentId))

		return { success: true }
	})

// ============================================================================
// Dashboard Stats
// ============================================================================

/**
 * Get dashboard stats
 */
export const getDashboardStats = createServerFn({ method: "GET" }).handler(
	async () => {
		const [retroCount] = await db.select({ count: count() }).from(retrospective)
		const [teamCount] = await db.select({ count: count() }).from(team)
		const [cardCount] = await db.select({ count: count() }).from(card)
		const [voteCount] = await db.select({ count: count() }).from(vote)

		return {
			totalRetros: retroCount?.count ?? 0,
			totalTeams: teamCount?.count ?? 0,
			totalCards: cardCount?.count ?? 0,
			totalVotes: voteCount?.count ?? 0,
		}
	}
)
