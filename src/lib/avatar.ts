/**
 * Generate a DiceBear avatar URL using the HTTP API.
 * Uses the "thumbs" style which creates friendly, approachable avatars.
 *
 * @see https://www.dicebear.com/how-to-use/http-api/
 * @see https://www.dicebear.com/styles/thumbs/
 */

export type AvatarStyle =
	| "adventurer"
	| "adventurer-neutral"
	| "avataaars"
	| "avataaars-neutral"
	| "big-ears"
	| "big-ears-neutral"
	| "big-smile"
	| "bottts"
	| "bottts-neutral"
	| "croodles"
	| "croodles-neutral"
	| "dylan"
	| "fun-emoji"
	| "glass"
	| "icons"
	| "identicon"
	| "initials"
	| "lorelei"
	| "lorelei-neutral"
	| "micah"
	| "miniavs"
	| "notionists"
	| "notionists-neutral"
	| "open-peeps"
	| "personas"
	| "pixel-art"
	| "pixel-art-neutral"
	| "rings"
	| "shapes"
	| "thumbs"

/** Default avatar style for new users */
export const DEFAULT_AVATAR_STYLE: AvatarStyle = "thumbs"

/**
 * Generate a DiceBear avatar URL.
 *
 * @param seed - Unique seed to generate the avatar (typically user id or email)
 * @param style - Avatar style (default: "thumbs")
 * @param options - Additional options for customization
 * @returns URL string for the avatar
 *
 * @example
 * ```ts
 * // Basic usage
 * const avatarUrl = generateAvatarUrl("user-123")
 *
 * // With custom style
 * const avatarUrl = generateAvatarUrl("user-123", "pixel-art")
 *
 * // With size option
 * const avatarUrl = generateAvatarUrl("user-123", "thumbs", { size: 128 })
 * ```
 */
export function generateAvatarUrl(
	seed: string,
	style: AvatarStyle = DEFAULT_AVATAR_STYLE,
	options?: {
		size?: number
		backgroundColor?: string
		radius?: number
	}
): string {
	const baseUrl = `https://api.dicebear.com/9.x/${style}/svg`
	const params = new URLSearchParams()

	// Use the seed for consistent avatar generation
	params.set("seed", seed)

	// Apply optional parameters
	if (options?.size) {
		params.set("size", options.size.toString())
	}
	if (options?.backgroundColor) {
		params.set("backgroundColor", options.backgroundColor)
	}
	if (options?.radius) {
		params.set("radius", options.radius.toString())
	}

	return `${baseUrl}?${params.toString()}`
}
