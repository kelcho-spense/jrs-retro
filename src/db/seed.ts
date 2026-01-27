import { db } from "./index"
import { template, templateColumn } from "./schema"

/**
 * Seeds the default built-in templates for the retro app.
 * Run this once after initial database setup.
 */
export async function seedTemplates() {
	// Check if templates already exist
	const existing = await db.select().from(template).limit(1)
	if (existing.length > 0) {
		console.log("Templates already seeded, skipping...")
		return
	}

	console.log("Seeding default templates...")

	// 4Ls Template
	const fourLsId = "template-4ls"
	await db.insert(template).values({
		id: fourLsId,
		name: "4Ls",
		description: "Four simple words to dig into both positive and negative aspects of your last Sprint. The Ls stand for: liked, learned, lacked, and longed for.",
		isBuiltIn: true,
	})

	await db.insert(templateColumn).values([
		{ id: "4ls-liked", templateId: fourLsId, name: "Liked", emoji: "❤️", prompt: "Things you really enjoyed", order: 0 },
		{ id: "4ls-learned", templateId: fourLsId, name: "Learned", emoji: "📚", prompt: "Things you have learned", order: 1 },
		{ id: "4ls-lacked", templateId: fourLsId, name: "Lacked", emoji: "⚠️", prompt: "Things the team missed", order: 2 },
		{ id: "4ls-longed", templateId: fourLsId, name: "Longed For", emoji: "🌟", prompt: "Something you wished for", order: 3 },
	])

	// Appreciation Game Template
	const appreciationId = "template-appreciation"
	await db.insert(template).values({
		id: appreciationId,
		name: "Appreciation Game",
		description: "A short activity based on the good things your team members did! Reinforce your team's relationship hence its velocity.",
		isBuiltIn: true,
	})

	await db.insert(templateColumn).values([
		{ id: "appreciation-spirit", templateId: appreciationId, name: "Team Spirit", emoji: "🤝", prompt: "You really served the team when…", order: 0 },
		{ id: "appreciation-ideas", templateId: appreciationId, name: "Ideas", emoji: "💡", prompt: "What I would like to see more of", order: 1 },
	])

	// Cupid's Retrospective Template
	const cupidId = "template-cupid"
	await db.insert(template).values({
		id: cupidId,
		name: "Cupid's Retrospective",
		description: "Spread the love at your retrospective! Strengthen bonds and accentuate recognition within the team.",
		isBuiltIn: true,
	})

	await db.insert(templateColumn).values([
		{ id: "cupid-self", templateId: cupidId, name: "Self-love", emoji: "💜", prompt: "Tell us how you made a difference", order: 0 },
		{ id: "cupid-good", templateId: cupidId, name: "Good Stuff!", emoji: "👍", prompt: "What did you like about the last Sprint/project?", order: 1 },
		{ id: "cupid-wishes", templateId: cupidId, name: "My Wishes", emoji: "🌠", prompt: "What are your wishes for the team?", order: 2 },
		{ id: "cupid-team", templateId: cupidId, name: "A Team to Die For", emoji: "💕", prompt: "Share sweet words about your teammates", order: 3 },
	])

	console.log("✅ Default templates seeded successfully!")
}

// Allow running directly: npx tsx src/db/seed.ts
if (process.argv[1]?.includes("seed")) {
	seedTemplates()
		.then(() => process.exit(0))
		.catch((err) => {
			console.error("Seed failed:", err)
			process.exit(1)
		})
}
