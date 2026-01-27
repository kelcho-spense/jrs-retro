import { createServerFn } from "@tanstack/react-start"
import { db } from "@/db"
import { retrospective, team, template, card, vote } from "@/db/schema"
import { desc, eq, count } from "drizzle-orm"

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
export const getTemplateById = createServerFn({ method: "GET" }).handler(
	async (ctx) => {
		const id = ctx.data as string
		const tmpl = await db.query.template.findFirst({
			where: eq(template.id, id),
			with: {
				columns: {
					orderBy: (columns, { asc }) => [asc(columns.order)],
				},
			},
		})
		return tmpl
	}
)

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
