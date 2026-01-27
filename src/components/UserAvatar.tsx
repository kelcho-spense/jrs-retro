import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { generateAvatarUrl, type AvatarStyle } from "@/lib/avatar"
import { cn } from "@/lib/utils"

interface UserAvatarProps {
	/** User's image URL (if available) */
	image?: string | null
	/** User's name for fallback initials */
	name?: string | null
	/** User's ID for generating DiceBear avatar as fallback */
	userId?: string
	/** Additional class names */
	className?: string
	/** Size of the avatar (applies to both width and height) */
	size?: "sm" | "md" | "lg" | "xl"
	/** DiceBear style to use for generated avatars */
	avatarStyle?: AvatarStyle
}

const sizeClasses = {
	sm: "h-6 w-6 text-xs",
	md: "h-8 w-8 text-sm",
	lg: "h-10 w-10 text-base",
	xl: "h-16 w-16 text-lg",
}

/**
 * UserAvatar component that displays a user's avatar with multiple fallback options:
 * 1. User's actual image if available
 * 2. DiceBear generated avatar based on user ID
 * 3. Initials from user's name
 * 4. Generic "U" fallback
 */
export function UserAvatar({
	image,
	name,
	userId,
	className,
	size = "md",
	avatarStyle = "thumbs",
}: UserAvatarProps) {
	// Generate fallback DiceBear URL if we have a userId
	const dicebearUrl = userId ? generateAvatarUrl(userId, avatarStyle) : undefined

	// Get initials from name
	const initials = name
		? name
				.split(" ")
				.map((part) => part[0])
				.join("")
				.toUpperCase()
				.slice(0, 2)
		: "U"

	// Determine which image to use
	const imageUrl = image || dicebearUrl

	return (
		<Avatar className={cn(sizeClasses[size], className)}>
			{imageUrl && <AvatarImage src={imageUrl} alt={name ?? "User avatar"} />}
			<AvatarFallback className="bg-primary/10 text-primary font-medium">
				{initials}
			</AvatarFallback>
		</Avatar>
	)
}
