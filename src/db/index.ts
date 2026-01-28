import { drizzle } from "drizzle-orm/libsql"
import { createClient } from "@libsql/client"
import type { LibSQLDatabase } from "drizzle-orm/libsql"
import * as schema from "./schema"

// Lazy initialization to prevent client-side execution
let _db: LibSQLDatabase<typeof schema> | null = null

function getDb() {
	if (!_db) {
		const client = createClient({
			url: process.env.DATABASE_URL || "file:local.db",
			// Turso auth token for cloud database (required for Vercel deployment)
			authToken: process.env.DATABASE_AUTH_TOKEN,
		})
		_db = drizzle(client, { schema })
	}
	return _db
}

// Export a proxy that lazily initializes the db on first access
export const db = new Proxy({} as LibSQLDatabase<typeof schema>, {
	get(_target, prop) {
		const realDb = getDb()
		const value = (realDb as any)[prop]
		if (typeof value === "function") {
			return value.bind(realDb)
		}
		return value
	},
})

export * from "./schema"
