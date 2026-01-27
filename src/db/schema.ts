import { sqliteTable, text, integer } from "drizzle-orm/sqlite-core"
import { relations } from "drizzle-orm"

// ============================================================================
// Better Auth Core Tables
// ============================================================================

export const userStatusEnum = ["pending", "approved", "rejected", "suspended"] as const
export type UserStatus = (typeof userStatusEnum)[number]

export const userRoleEnum = ["admin", "member"] as const
export type UserRole = (typeof userRoleEnum)[number]

export const user = sqliteTable("user", {
	id: text("id").primaryKey(),
	name: text("name").notNull(),
	email: text("email").notNull().unique(),
	emailVerified: integer("email_verified", { mode: "boolean" }).notNull().default(false),
	image: text("image"),
	status: text("status", { enum: userStatusEnum }).notNull().default("pending"),
	role: text("role", { enum: userRoleEnum }).notNull().default("member"),
	bio: text("bio"),
	lastActiveAt: integer("last_active_at", { mode: "timestamp" }),
	approvedAt: integer("approved_at", { mode: "timestamp" }),
	approvedById: text("approved_by_id"),
	suspendedAt: integer("suspended_at", { mode: "timestamp" }),
	suspendedById: text("suspended_by_id"),
	suspendedReason: text("suspended_reason"),
	createdAt: integer("created_at", { mode: "timestamp" }).notNull().$defaultFn(() => new Date()),
	updatedAt: integer("updated_at", { mode: "timestamp" }).notNull().$defaultFn(() => new Date()),
})

export const session = sqliteTable("session", {
	id: text("id").primaryKey(),
	userId: text("user_id").notNull().references(() => user.id, { onDelete: "cascade" }),
	token: text("token").notNull().unique(),
	expiresAt: integer("expires_at", { mode: "timestamp" }).notNull(),
	ipAddress: text("ip_address"),
	userAgent: text("user_agent"),
	createdAt: integer("created_at", { mode: "timestamp" }).notNull().$defaultFn(() => new Date()),
	updatedAt: integer("updated_at", { mode: "timestamp" }).notNull().$defaultFn(() => new Date()),
})

export const account = sqliteTable("account", {
	id: text("id").primaryKey(),
	userId: text("user_id").notNull().references(() => user.id, { onDelete: "cascade" }),
	accountId: text("account_id").notNull(),
	providerId: text("provider_id").notNull(),
	accessToken: text("access_token"),
	refreshToken: text("refresh_token"),
	accessTokenExpiresAt: integer("access_token_expires_at", { mode: "timestamp" }),
	refreshTokenExpiresAt: integer("refresh_token_expires_at", { mode: "timestamp" }),
	scope: text("scope"),
	idToken: text("id_token"),
	password: text("password"),
	createdAt: integer("created_at", { mode: "timestamp" }).notNull().$defaultFn(() => new Date()),
	updatedAt: integer("updated_at", { mode: "timestamp" }).notNull().$defaultFn(() => new Date()),
})

export const verification = sqliteTable("verification", {
	id: text("id").primaryKey(),
	identifier: text("identifier").notNull(),
	value: text("value").notNull(),
	expiresAt: integer("expires_at", { mode: "timestamp" }).notNull(),
	createdAt: integer("created_at", { mode: "timestamp" }).notNull().$defaultFn(() => new Date()),
	updatedAt: integer("updated_at", { mode: "timestamp" }).notNull().$defaultFn(() => new Date()),
})

// Admin action log for auditing
export const adminActionLogActionEnum = [
	"user_approved",
	"user_rejected",
	"user_suspended",
	"user_reactivated",
	"user_role_changed",
	"user_deleted",
	"password_reset_triggered",
] as const
export type AdminActionLogAction = (typeof adminActionLogActionEnum)[number]

export const adminActionLog = sqliteTable("admin_action_log", {
	id: text("id").primaryKey(),
	adminId: text("admin_id").notNull().references(() => user.id),
	targetUserId: text("target_user_id").notNull().references(() => user.id, { onDelete: "cascade" }),
	action: text("action", { enum: adminActionLogActionEnum }).notNull(),
	details: text("details"), // JSON string for additional context
	createdAt: integer("created_at", { mode: "timestamp" }).notNull().$defaultFn(() => new Date()),
})

// ============================================================================
// Organization & Team Tables
// ============================================================================

export const organization = sqliteTable("organization", {
	id: text("id").primaryKey(),
	name: text("name").notNull(),
	slug: text("slug").notNull().unique(),
	logo: text("logo"),
	ownerId: text("owner_id").notNull().references(() => user.id),
	createdAt: integer("created_at", { mode: "timestamp" }).notNull().$defaultFn(() => new Date()),
	updatedAt: integer("updated_at", { mode: "timestamp" }).notNull().$defaultFn(() => new Date()),
})

export const organizationMember = sqliteTable("organization_member", {
	id: text("id").primaryKey(),
	organizationId: text("organization_id").notNull().references(() => organization.id, { onDelete: "cascade" }),
	userId: text("user_id").notNull().references(() => user.id, { onDelete: "cascade" }),
	role: text("role", { enum: ["owner", "admin", "member"] }).notNull().default("member"),
	createdAt: integer("created_at", { mode: "timestamp" }).notNull().$defaultFn(() => new Date()),
})

export const team = sqliteTable("team", {
	id: text("id").primaryKey(),
	name: text("name").notNull(),
	description: text("description"),
	emoji: text("emoji").default("👥"),
	organizationId: text("organization_id").notNull().references(() => organization.id, { onDelete: "cascade" }),
	createdAt: integer("created_at", { mode: "timestamp" }).notNull().$defaultFn(() => new Date()),
	updatedAt: integer("updated_at", { mode: "timestamp" }).notNull().$defaultFn(() => new Date()),
})

export const teamMember = sqliteTable("team_member", {
	id: text("id").primaryKey(),
	teamId: text("team_id").notNull().references(() => team.id, { onDelete: "cascade" }),
	userId: text("user_id").notNull().references(() => user.id, { onDelete: "cascade" }),
	role: text("role", { enum: ["lead", "member"] }).notNull().default("member"),
	createdAt: integer("created_at", { mode: "timestamp" }).notNull().$defaultFn(() => new Date()),
})

export const teamJoinRequestStatusEnum = ["pending", "approved", "rejected"] as const
export type TeamJoinRequestStatus = (typeof teamJoinRequestStatusEnum)[number]

export const teamJoinRequest = sqliteTable("team_join_request", {
	id: text("id").primaryKey(),
	teamId: text("team_id").notNull().references(() => team.id, { onDelete: "cascade" }),
	userId: text("user_id").notNull().references(() => user.id, { onDelete: "cascade" }),
	status: text("status", { enum: teamJoinRequestStatusEnum }).notNull().default("pending"),
	message: text("message"), // Optional message from the requester
	reviewedById: text("reviewed_by_id").references(() => user.id),
	reviewedAt: integer("reviewed_at", { mode: "timestamp" }),
	reviewNote: text("review_note"), // Optional note from the reviewer
	createdAt: integer("created_at", { mode: "timestamp" }).notNull().$defaultFn(() => new Date()),
	updatedAt: integer("updated_at", { mode: "timestamp" }).notNull().$defaultFn(() => new Date()),
})

// ============================================================================
// Template Tables
// ============================================================================

export const template = sqliteTable("template", {
	id: text("id").primaryKey(),
	name: text("name").notNull(),
	description: text("description"),
	isBuiltIn: integer("is_built_in", { mode: "boolean" }).notNull().default(false),
	organizationId: text("organization_id").references(() => organization.id, { onDelete: "cascade" }),
	createdAt: integer("created_at", { mode: "timestamp" }).notNull().$defaultFn(() => new Date()),
	updatedAt: integer("updated_at", { mode: "timestamp" }).notNull().$defaultFn(() => new Date()),
})

export const templateColumn = sqliteTable("template_column", {
	id: text("id").primaryKey(),
	templateId: text("template_id").notNull().references(() => template.id, { onDelete: "cascade" }),
	name: text("name").notNull(),
	emoji: text("emoji"),
	prompt: text("prompt"),
	order: integer("order").notNull().default(0),
})

// ============================================================================
// Retrospective Tables
// ============================================================================

export const retrospective = sqliteTable("retrospective", {
	id: text("id").primaryKey(),
	name: text("name").notNull(),
	teamId: text("team_id").notNull().references(() => team.id, { onDelete: "cascade" }),
	templateId: text("template_id").notNull().references(() => template.id),
	status: text("status", { enum: ["draft", "active", "voting", "discussing", "completed"] }).notNull().default("draft"),
	isAnonymous: integer("is_anonymous", { mode: "boolean" }).notNull().default(true),
	maxVotesPerUser: integer("max_votes_per_user").notNull().default(3),
	voteType: text("vote_type", { enum: ["multi", "single"] }).notNull().default("multi"),
	timerDuration: integer("timer_duration"), // Duration in seconds for card creation phase
	timerStartedAt: integer("timer_started_at", { mode: "timestamp" }), // When the timer started
	timerEndsAt: integer("timer_ends_at", { mode: "timestamp" }), // When the timer ends
	createdById: text("created_by_id").notNull().references(() => user.id),
	createdAt: integer("created_at", { mode: "timestamp" }).notNull().$defaultFn(() => new Date()),
	updatedAt: integer("updated_at", { mode: "timestamp" }).notNull().$defaultFn(() => new Date()),
	completedAt: integer("completed_at", { mode: "timestamp" }),
})

export const retroParticipant = sqliteTable("retro_participant", {
	id: text("id").primaryKey(),
	retroId: text("retro_id").notNull().references(() => retrospective.id, { onDelete: "cascade" }),
	userId: text("user_id").notNull().references(() => user.id, { onDelete: "cascade" }),
	joinedAt: integer("joined_at", { mode: "timestamp" }).notNull().$defaultFn(() => new Date()),
})

export const card = sqliteTable("card", {
	id: text("id").primaryKey(),
	retroId: text("retro_id").notNull().references(() => retrospective.id, { onDelete: "cascade" }),
	columnId: text("column_id").notNull().references(() => templateColumn.id),
	authorId: text("author_id").notNull().references(() => user.id),
	content: text("content").notNull(),
	createdAt: integer("created_at", { mode: "timestamp" }).notNull().$defaultFn(() => new Date()),
	updatedAt: integer("updated_at", { mode: "timestamp" }).notNull().$defaultFn(() => new Date()),
})

export const vote = sqliteTable("vote", {
	id: text("id").primaryKey(),
	cardId: text("card_id").notNull().references(() => card.id, { onDelete: "cascade" }),
	userId: text("user_id").notNull().references(() => user.id, { onDelete: "cascade" }),
	createdAt: integer("created_at", { mode: "timestamp" }).notNull().$defaultFn(() => new Date()),
})

export const cardComment = sqliteTable("card_comment", {
	id: text("id").primaryKey(),
	cardId: text("card_id").notNull().references(() => card.id, { onDelete: "cascade" }),
	authorId: text("author_id").notNull().references(() => user.id, { onDelete: "cascade" }),
	content: text("content").notNull(),
	createdAt: integer("created_at", { mode: "timestamp" }).notNull().$defaultFn(() => new Date()),
	updatedAt: integer("updated_at", { mode: "timestamp" }).notNull().$defaultFn(() => new Date()),
})

export const actionItem = sqliteTable("action_item", {
	id: text("id").primaryKey(),
	retroId: text("retro_id").notNull().references(() => retrospective.id, { onDelete: "cascade" }),
	cardId: text("card_id").references(() => card.id, { onDelete: "set null" }),
	title: text("title").notNull(),
	description: text("description"),
	assigneeId: text("assignee_id").references(() => user.id, { onDelete: "set null" }),
	status: text("status", { enum: ["pending", "in_progress", "completed"] }).notNull().default("pending"),
	dueDate: integer("due_date", { mode: "timestamp" }),
	createdAt: integer("created_at", { mode: "timestamp" }).notNull().$defaultFn(() => new Date()),
	updatedAt: integer("updated_at", { mode: "timestamp" }).notNull().$defaultFn(() => new Date()),
})

// ============================================================================
// Relations
// ============================================================================

export const userRelations = relations(user, ({ many }) => ({
	sessions: many(session),
	accounts: many(account),
	organizationMemberships: many(organizationMember),
	teamMemberships: many(teamMember),
	teamJoinRequests: many(teamJoinRequest),
	createdRetros: many(retrospective),
	retroParticipations: many(retroParticipant),
	cards: many(card),
	votes: many(vote),
	assignedActionItems: many(actionItem),
}))

export const sessionRelations = relations(session, ({ one }) => ({
	user: one(user, { fields: [session.userId], references: [user.id] }),
}))

export const accountRelations = relations(account, ({ one }) => ({
	user: one(user, { fields: [account.userId], references: [user.id] }),
}))

export const organizationRelations = relations(organization, ({ one, many }) => ({
	owner: one(user, { fields: [organization.ownerId], references: [user.id] }),
	members: many(organizationMember),
	teams: many(team),
	templates: many(template),
}))

export const organizationMemberRelations = relations(organizationMember, ({ one }) => ({
	organization: one(organization, { fields: [organizationMember.organizationId], references: [organization.id] }),
	user: one(user, { fields: [organizationMember.userId], references: [user.id] }),
}))

export const teamRelations = relations(team, ({ one, many }) => ({
	organization: one(organization, { fields: [team.organizationId], references: [organization.id] }),
	members: many(teamMember),
	joinRequests: many(teamJoinRequest),
	retrospectives: many(retrospective),
}))

export const teamMemberRelations = relations(teamMember, ({ one }) => ({
	team: one(team, { fields: [teamMember.teamId], references: [team.id] }),
	user: one(user, { fields: [teamMember.userId], references: [user.id] }),
}))

export const teamJoinRequestRelations = relations(teamJoinRequest, ({ one }) => ({
	team: one(team, { fields: [teamJoinRequest.teamId], references: [team.id] }),
	user: one(user, { fields: [teamJoinRequest.userId], references: [user.id] }),
	reviewedBy: one(user, { fields: [teamJoinRequest.reviewedById], references: [user.id] }),
}))

export const templateRelations = relations(template, ({ one, many }) => ({
	organization: one(organization, { fields: [template.organizationId], references: [organization.id] }),
	columns: many(templateColumn),
	retrospectives: many(retrospective),
}))

export const templateColumnRelations = relations(templateColumn, ({ one, many }) => ({
	template: one(template, { fields: [templateColumn.templateId], references: [template.id] }),
	cards: many(card),
}))

export const retrospectiveRelations = relations(retrospective, ({ one, many }) => ({
	team: one(team, { fields: [retrospective.teamId], references: [team.id] }),
	template: one(template, { fields: [retrospective.templateId], references: [template.id] }),
	createdBy: one(user, { fields: [retrospective.createdById], references: [user.id] }),
	participants: many(retroParticipant),
	cards: many(card),
	actionItems: many(actionItem),
}))

export const retroParticipantRelations = relations(retroParticipant, ({ one }) => ({
	retrospective: one(retrospective, { fields: [retroParticipant.retroId], references: [retrospective.id] }),
	user: one(user, { fields: [retroParticipant.userId], references: [user.id] }),
}))

export const cardRelations = relations(card, ({ one, many }) => ({
	retrospective: one(retrospective, { fields: [card.retroId], references: [retrospective.id] }),
	column: one(templateColumn, { fields: [card.columnId], references: [templateColumn.id] }),
	author: one(user, { fields: [card.authorId], references: [user.id] }),
	votes: many(vote),
	comments: many(cardComment),
	actionItems: many(actionItem),
}))

export const voteRelations = relations(vote, ({ one }) => ({
	card: one(card, { fields: [vote.cardId], references: [card.id] }),
	user: one(user, { fields: [vote.userId], references: [user.id] }),
}))

export const cardCommentRelations = relations(cardComment, ({ one }) => ({
	card: one(card, { fields: [cardComment.cardId], references: [card.id] }),
	author: one(user, { fields: [cardComment.authorId], references: [user.id] }),
}))

export const actionItemRelations = relations(actionItem, ({ one }) => ({
	retrospective: one(retrospective, { fields: [actionItem.retroId], references: [retrospective.id] }),
	card: one(card, { fields: [actionItem.cardId], references: [card.id] }),
	assignee: one(user, { fields: [actionItem.assigneeId], references: [user.id] }),
}))

export const adminActionLogRelations = relations(adminActionLog, ({ one }) => ({
	admin: one(user, { fields: [adminActionLog.adminId], references: [user.id], relationName: "adminActions" }),
	targetUser: one(user, { fields: [adminActionLog.targetUserId], references: [user.id], relationName: "receivedActions" }),
}))
