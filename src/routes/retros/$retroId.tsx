import { createFileRoute, Link, useRouter } from "@tanstack/react-router"
import { useState, useEffect, useCallback } from "react"
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query"
import {
	ArrowLeft,
	Clock,
	Eye,
	EyeOff,
	MessageSquare,
	MoreVertical,
	Pause,
	Play,
	Plus,
	Send,
	ThumbsUp,
	Trash2,
	Users,
	Vote,
	CheckCircle,
	AlertCircle,
} from "lucide-react"

import { Button } from "@/components/ui/button"
import {
	Card,
	CardContent,
	CardDescription,
	CardFooter,
	CardHeader,
	CardTitle,
} from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Textarea } from "@/components/ui/textarea"
import { Badge } from "@/components/ui/badge"
import { Progress } from "@/components/ui/progress"
import { ScrollArea } from "@/components/ui/scroll-area"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { Separator } from "@/components/ui/separator"
import {
	Dialog,
	DialogContent,
	DialogDescription,
	DialogFooter,
	DialogHeader,
	DialogTitle,
	DialogTrigger,
} from "@/components/ui/dialog"
import {
	DropdownMenu,
	DropdownMenuContent,
	DropdownMenuItem,
	DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import {
	Tooltip,
	TooltipContent,
	TooltipProvider,
	TooltipTrigger,
} from "@/components/ui/tooltip"
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert"
import { cn } from "@/lib/utils"
import {
	getRetro,
	joinRetro,
	startRetro,
	moveToVoting,
	moveToDiscussion,
	completeRetro,
	createCard,
	updateCard,
	deleteCard,
	voteForCard,
	removeVote,
	createComment,
	deleteComment,
} from "@/lib/api/retros"
import type { getRetro as GetRetroType } from "@/lib/api/retros"

export const Route = createFileRoute("/retros/$retroId")({
	loader: async ({ params }) => {
		// Join the retro (adds as participant if not already)
		await joinRetro({ data: { retroId: params.retroId } })
		const retro = await getRetro({ data: { retroId: params.retroId } })
		return { retro }
	},
	component: RetroDetailPage,
})

type Retro = Awaited<ReturnType<typeof GetRetroType>>

function RetroDetailPage() {
	const { retroId } = Route.useParams()
	const router = useRouter()
	const queryClient = useQueryClient()
	const initialData = Route.useLoaderData()

	// Poll for live updates every 3 seconds
	const { data } = useQuery({
		queryKey: ["retro", retroId],
		queryFn: () => getRetro({ data: { retroId } }),
		initialData: initialData.retro,
		refetchInterval: 3000,
	})

	const retro = data

	// Timer state
	const [timeRemaining, setTimeRemaining] = useState<number | null>(null)

	// Card creation state per column
	const [newCardContent, setNewCardContent] = useState<Record<string, string>>({})
	const [expandedCard, setExpandedCard] = useState<string | null>(null)
	const [newComment, setNewComment] = useState("")

	// Calculate time remaining
	useEffect(() => {
		if (!retro.timerEndsAt) {
			setTimeRemaining(null)
			return
		}

		const calculateRemaining = () => {
			const now = Date.now()
			const endTime = new Date(retro.timerEndsAt!).getTime()
			const remaining = Math.max(0, Math.floor((endTime - now) / 1000))
			setTimeRemaining(remaining)
		}

		calculateRemaining()
		const interval = setInterval(calculateRemaining, 1000)
		return () => clearInterval(interval)
	}, [retro.timerEndsAt])

	const isTimerActive = timeRemaining !== null && timeRemaining > 0

	// Mutations
	const startMutation = useMutation({
		mutationFn: () => startRetro({ data: { retroId } }),
		onSuccess: () => {
			queryClient.invalidateQueries({ queryKey: ["retro", retroId] })
			router.invalidate()
		},
	})

	const moveToVotingMutation = useMutation({
		mutationFn: () => moveToVoting({ data: { retroId } }),
		onSuccess: () => {
			queryClient.invalidateQueries({ queryKey: ["retro", retroId] })
			router.invalidate()
		},
	})

	const moveToDiscussionMutation = useMutation({
		mutationFn: () => moveToDiscussion({ data: { retroId } }),
		onSuccess: () => {
			queryClient.invalidateQueries({ queryKey: ["retro", retroId] })
			router.invalidate()
		},
	})

	const completeMutation = useMutation({
		mutationFn: () => completeRetro({ data: { retroId } }),
		onSuccess: () => {
			queryClient.invalidateQueries({ queryKey: ["retro", retroId] })
			router.invalidate()
		},
	})

	const createCardMutation = useMutation({
		mutationFn: ({ columnId, content }: { columnId: string; content: string }) =>
			createCard({ data: { retroId, columnId, content } }),
		onSuccess: (_, { columnId }) => {
			setNewCardContent((prev) => ({ ...prev, [columnId]: "" }))
			queryClient.invalidateQueries({ queryKey: ["retro", retroId] })
		},
	})

	const deleteCardMutation = useMutation({
		mutationFn: (cardId: string) => deleteCard({ data: { cardId } }),
		onSuccess: () => {
			queryClient.invalidateQueries({ queryKey: ["retro", retroId] })
		},
	})

	const voteMutation = useMutation({
		mutationFn: (cardId: string) => voteForCard({ data: { cardId } }),
		onSuccess: () => {
			queryClient.invalidateQueries({ queryKey: ["retro", retroId] })
		},
	})

	const removeVoteMutation = useMutation({
		mutationFn: (cardId: string) => removeVote({ data: { cardId } }),
		onSuccess: () => {
			queryClient.invalidateQueries({ queryKey: ["retro", retroId] })
		},
	})

	const createCommentMutation = useMutation({
		mutationFn: ({ cardId, content }: { cardId: string; content: string }) =>
			createComment({ data: { cardId, content } }),
		onSuccess: () => {
			setNewComment("")
			queryClient.invalidateQueries({ queryKey: ["retro", retroId] })
		},
	})

	const deleteCommentMutation = useMutation({
		mutationFn: (commentId: string) => deleteComment({ data: { commentId } }),
		onSuccess: () => {
			queryClient.invalidateQueries({ queryKey: ["retro", retroId] })
		},
	})

	// Format time remaining
	const formatTime = (seconds: number) => {
		const mins = Math.floor(seconds / 60)
		const secs = seconds % 60
		return `${mins}:${secs.toString().padStart(2, "0")}`
	}

	// Get status badge color
	const getStatusColor = (status: string) => {
		switch (status) {
			case "draft":
				return "secondary"
			case "active":
				return "default"
			case "voting":
				return "default"
			case "discussing":
				return "default"
			case "completed":
				return "outline"
			default:
				return "secondary"
		}
	}

	const getStatusLabel = (status: string) => {
		switch (status) {
			case "draft":
				return "Not Started"
			case "active":
				return "Adding Cards"
			case "voting":
				return "Voting"
			case "discussing":
				return "Discussing"
			case "completed":
				return "Completed"
			default:
				return status
		}
	}

	// Can user control the retro?
	const canControl = retro.isCreator || retro.isTeamLead

	// Get cards grouped by column
	const getColumnCards = (columnId: string) => {
		return retro.cards
			.filter((c) => c.columnId === columnId)
			.sort((a, b) => (b.voteCount ?? 0) - (a.voteCount ?? 0))
	}

	return (
		<TooltipProvider>
			<div className="flex h-[calc(100vh-4rem)] flex-col space-y-4">
				{/* Header */}
				<div className="flex items-center justify-between">
					<div className="flex items-center gap-4">
						<Button variant="ghost" size="icon" asChild>
							<Link to="/retros">
								<ArrowLeft className="h-4 w-4" />
							</Link>
						</Button>
						<div>
							<div className="flex items-center gap-3">
								<h1 className="text-2xl font-bold tracking-tight">
									{retro.name}
								</h1>
								<Badge variant={getStatusColor(retro.status)}>
									{getStatusLabel(retro.status)}
								</Badge>
							</div>
							<p className="text-sm text-muted-foreground">
								{retro.team.name} • {retro.template.name}
							</p>
						</div>
					</div>

					<div className="flex items-center gap-4">
						{/* Settings badges */}
						<div className="flex items-center gap-2">
							<Tooltip>
								<TooltipTrigger>
									<Badge variant="outline" className="gap-1">
										{retro.isAnonymous ? (
											<EyeOff className="h-3 w-3" />
										) : (
											<Eye className="h-3 w-3" />
										)}
										{retro.isAnonymous ? "Anonymous" : "Named"}
									</Badge>
								</TooltipTrigger>
								<TooltipContent>
									{retro.isAnonymous
										? "Card authors are hidden"
										: "Card authors are visible"}
								</TooltipContent>
							</Tooltip>

							<Tooltip>
								<TooltipTrigger>
									<Badge variant="outline" className="gap-1">
										<Vote className="h-3 w-3" />
										{retro.voteType === "multi"
											? `${retro.maxVotesPerUser} votes`
											: "1 vote"}
									</Badge>
								</TooltipTrigger>
								<TooltipContent>
									{retro.voteType === "multi"
										? `Each person can vote ${retro.maxVotesPerUser} times`
										: "Each person can vote once"}
								</TooltipContent>
							</Tooltip>

							<Tooltip>
								<TooltipTrigger>
									<Badge variant="outline" className="gap-1">
										<Users className="h-3 w-3" />
										{retro.participants.length}
									</Badge>
								</TooltipTrigger>
								<TooltipContent>
									{retro.participants.length} participant(s)
								</TooltipContent>
							</Tooltip>
						</div>

						{/* Timer display */}
						{retro.status === "active" && retro.timerDuration && (
							<div className="flex items-center gap-2">
								<Clock className="h-4 w-4 text-muted-foreground" />
								{isTimerActive ? (
									<span className="font-mono text-lg font-bold">
										{formatTime(timeRemaining!)}
									</span>
								) : (
									<span className="text-sm text-muted-foreground">
										Timer ended
									</span>
								)}
							</div>
						)}

						{/* Phase controls */}
						{canControl && (
							<div className="flex items-center gap-2">
								{retro.status === "draft" && (
									<Button
										onClick={() => startMutation.mutate()}
										disabled={startMutation.isPending}
									>
										<Play className="mr-2 h-4 w-4" />
										Start Retro
									</Button>
								)}
								{retro.status === "active" && (
									<Button
										onClick={() => moveToVotingMutation.mutate()}
										disabled={moveToVotingMutation.isPending}
									>
										Move to Voting
									</Button>
								)}
								{retro.status === "voting" && (
									<Button
										onClick={() => moveToDiscussionMutation.mutate()}
										disabled={moveToDiscussionMutation.isPending}
									>
										Move to Discussion
									</Button>
								)}
								{retro.status === "discussing" && (
									<Button
										onClick={() => completeMutation.mutate()}
										disabled={completeMutation.isPending}
									>
										<CheckCircle className="mr-2 h-4 w-4" />
										Complete
									</Button>
								)}
							</div>
						)}
					</div>
				</div>

				{/* Timer Progress */}
				{retro.status === "active" && retro.timerDuration && isTimerActive && (
					<Progress
						value={((retro.timerDuration - timeRemaining!) / retro.timerDuration) * 100}
						className="h-2"
					/>
				)}

				{/* Votes Remaining */}
				{retro.status === "voting" && (
					<Alert>
						<Vote className="h-4 w-4" />
						<AlertTitle>Voting Phase</AlertTitle>
						<AlertDescription>
							You have used {retro.userVoteCount} of {retro.maxVotesPerUser} votes.
							Click the thumbs up icon on cards to vote for them.
						</AlertDescription>
					</Alert>
				)}

				{/* Column Grid */}
				<div className="flex flex-1 gap-4 overflow-hidden">
					{retro.template.columns.map((column) => {
						const cards = getColumnCards(column.id)
						return (
							<div
								key={column.id}
								className="flex min-w-[300px] flex-1 flex-col rounded-lg border bg-muted/30"
							>
								{/* Column Header */}
								<div className="flex items-center gap-2 border-b bg-muted/50 px-4 py-3">
									<span className="text-xl">{column.emoji}</span>
									<div className="flex-1">
										<h3 className="font-semibold">{column.name}</h3>
										<p className="text-xs text-muted-foreground">
											{column.prompt}
										</p>
									</div>
									<Badge variant="secondary" className="text-xs">
										{cards.length}
									</Badge>
								</div>

								{/* Cards List */}
								<ScrollArea className="flex-1 p-3">
									<div className="space-y-3">
										{cards.map((card) => (
											<Card
												key={card.id}
												className={cn(
													"transition-all",
													card.hasVoted && "ring-2 ring-primary ring-offset-2"
												)}
											>
												<CardContent className="p-3">
													<p className="text-sm">{card.content}</p>
												</CardContent>
												<CardFooter className="flex items-center justify-between border-t px-3 py-2">
													<div className="flex items-center gap-2 text-xs text-muted-foreground">
														{card.author ? (
															<>
																<Avatar className="h-5 w-5">
																	<AvatarImage src={card.author.image ?? undefined} />
																	<AvatarFallback>
																		{card.author.name?.charAt(0) ?? "?"}
																	</AvatarFallback>
																</Avatar>
																<span>{card.author.name}</span>
															</>
														) : (
															<span className="italic">Anonymous</span>
														)}
													</div>

													<div className="flex items-center gap-1">
														{/* Vote button (only in voting phase) */}
														{retro.status === "voting" && (
															<Tooltip>
																<TooltipTrigger asChild>
																	<Button
																		variant={card.hasVoted ? "default" : "ghost"}
																		size="sm"
																		className="h-7 gap-1 px-2"
																		onClick={() =>
																			card.hasVoted
																				? removeVoteMutation.mutate(card.id)
																				: voteMutation.mutate(card.id)
																		}
																		disabled={
																			voteMutation.isPending ||
																			removeVoteMutation.isPending ||
																			(!card.hasVoted &&
																				retro.userVoteCount >= retro.maxVotesPerUser)
																		}
																	>
																		<ThumbsUp className="h-3.5 w-3.5" />
																		{(card.voteCount ?? 0) > 0 && (
																			<span>{card.voteCount}</span>
																		)}
																	</Button>
																</TooltipTrigger>
																<TooltipContent>
																	{card.hasVoted ? "Remove vote" : "Vote for this"}
																</TooltipContent>
															</Tooltip>
														)}

														{/* Vote count (in discussion/completed) */}
														{(retro.status === "discussing" ||
															retro.status === "completed") &&
															(card.voteCount ?? 0) > 0 && (
																<Badge variant="secondary" className="gap-1">
																	<ThumbsUp className="h-3 w-3" />
																	{card.voteCount}
																</Badge>
															)}

														{/* Comments button (in discussion phase) */}
														{(retro.status === "discussing" ||
															retro.status === "completed") && (
															<Dialog
																open={expandedCard === card.id}
																onOpenChange={(open) =>
																	setExpandedCard(open ? card.id : null)
																}
															>
																<DialogTrigger asChild>
																	<Button
																		variant="ghost"
																		size="sm"
																		className="h-7 gap-1 px-2"
																	>
																		<MessageSquare className="h-3.5 w-3.5" />
																		{(card.comments?.length ?? 0) > 0 && (
																			<span>{card.comments?.length}</span>
																		)}
																	</Button>
																</DialogTrigger>
																<DialogContent className="max-w-lg">
																	<DialogHeader>
																		<DialogTitle className="flex items-center gap-2">
																			<span className="text-xl">{column.emoji}</span>
																			Discussion
																		</DialogTitle>
																		<DialogDescription>
																			{card.content}
																		</DialogDescription>
																	</DialogHeader>

																	<div className="max-h-[300px] space-y-3 overflow-y-auto py-4">
																		{card.comments?.length === 0 && (
																			<p className="text-center text-sm text-muted-foreground">
																				No comments yet. Be the first to add one!
																			</p>
																		)}
																		{card.comments?.map((comment) => (
																			<div
																				key={comment.id}
																				className="flex items-start gap-3 rounded-lg bg-muted p-3"
																			>
																				<Avatar className="h-6 w-6">
																					<AvatarImage
																						src={comment.author?.image ?? undefined}
																					/>
																					<AvatarFallback>
																						{comment.author?.name?.charAt(0) ?? "?"}
																					</AvatarFallback>
																				</Avatar>
																				<div className="flex-1">
																					<p className="text-xs font-medium">
																						{comment.author?.name ?? "Unknown"}
																					</p>
																					<p className="text-sm">{comment.content}</p>
																				</div>
																				{comment.isOwn && (
																					<Button
																						variant="ghost"
																						size="icon"
																						className="h-6 w-6"
																						onClick={() =>
																							deleteCommentMutation.mutate(comment.id)
																						}
																					>
																						<Trash2 className="h-3 w-3" />
																					</Button>
																				)}
																			</div>
																		))}
																	</div>

																	{retro.status === "discussing" && (
																		<div className="flex gap-2">
																			<Input
																				placeholder="Add a comment..."
																				value={newComment}
																				onChange={(e) => setNewComment(e.target.value)}
																				onKeyDown={(e) => {
																					if (e.key === "Enter" && newComment.trim()) {
																						createCommentMutation.mutate({
																							cardId: card.id,
																							content: newComment.trim(),
																						})
																					}
																				}}
																			/>
																			<Button
																				size="icon"
																				disabled={
																					!newComment.trim() ||
																					createCommentMutation.isPending
																				}
																				onClick={() => {
																					if (newComment.trim()) {
																						createCommentMutation.mutate({
																							cardId: card.id,
																							content: newComment.trim(),
																						})
																					}
																				}}
																			>
																				<Send className="h-4 w-4" />
																			</Button>
																		</div>
																	)}
																</DialogContent>
															</Dialog>
														)}

														{/* Delete button (only for own cards in active phase) */}
														{retro.status === "active" && card.isOwn && (
															<DropdownMenu>
																<DropdownMenuTrigger asChild>
																	<Button
																		variant="ghost"
																		size="sm"
																		className="h-7 w-7 p-0"
																	>
																		<MoreVertical className="h-3.5 w-3.5" />
																	</Button>
																</DropdownMenuTrigger>
																<DropdownMenuContent align="end">
																	<DropdownMenuItem
																		className="text-destructive"
																		onClick={() => deleteCardMutation.mutate(card.id)}
																	>
																		<Trash2 className="mr-2 h-4 w-4" />
																		Delete
																	</DropdownMenuItem>
																</DropdownMenuContent>
															</DropdownMenu>
														)}
													</div>
												</CardFooter>
											</Card>
										))}
									</div>
								</ScrollArea>

								{/* Add Card Input (only in active phase) */}
								{retro.status === "active" && (
									<div className="border-t p-3">
										<div className="flex gap-2">
											<Textarea
												placeholder={`Add a ${column.name.toLowerCase()}...`}
												value={newCardContent[column.id] ?? ""}
												onChange={(e) =>
													setNewCardContent((prev) => ({
														...prev,
														[column.id]: e.target.value,
													}))
												}
												className="min-h-[60px] resize-none"
												onKeyDown={(e) => {
													if (
														e.key === "Enter" &&
														!e.shiftKey &&
														newCardContent[column.id]?.trim()
													) {
														e.preventDefault()
														createCardMutation.mutate({
															columnId: column.id,
															content: newCardContent[column.id]!.trim(),
														})
													}
												}}
											/>
										</div>
										<Button
											className="mt-2 w-full"
											size="sm"
											disabled={
												!newCardContent[column.id]?.trim() ||
												createCardMutation.isPending
											}
											onClick={() => {
												if (newCardContent[column.id]?.trim()) {
													createCardMutation.mutate({
														columnId: column.id,
														content: newCardContent[column.id]!.trim(),
													})
												}
											}}
										>
											<Plus className="mr-2 h-4 w-4" />
											Add Card
										</Button>
									</div>
								)}
							</div>
						)
					})}
				</div>
			</div>
		</TooltipProvider>
	)
}
