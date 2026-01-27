import { betterAuth } from "better-auth"
import { drizzleAdapter } from "better-auth/adapters/drizzle"
import { multiSession } from "better-auth/plugins"
import { db } from "@/db"
import { generateAvatarUrl } from "@/lib/avatar"

export const auth = betterAuth({
	database: drizzleAdapter(db, {
		provider: "sqlite",
	}),
	emailAndPassword: {
		enabled: true,
	},
	plugins: [multiSession()],
	databaseHooks: {
		user: {
			create: {
				before: async (user) => {
					// Assign a DiceBear avatar to new users if they don't have an image
					if (!user.image) {
						return {
							data: {
								...user,
								// Use user's id as seed for consistent avatar
								image: generateAvatarUrl(user.id),
							},
						}
					}
					return { data: user }
				},
			},
		},
	},
})
