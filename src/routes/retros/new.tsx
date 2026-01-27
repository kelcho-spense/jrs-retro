import { createFileRoute, Link, useNavigate } from "@tanstack/react-router"
import { useState } from "react"
import { useMutation } from "@tanstack/react-query"
import {
	ArrowLeft,
	ArrowRight,
	Check,
	Clock,
	Eye,
	EyeOff,
	Users,
	Vote,
} from "lucide-react"

import { Button } from "@/components/ui/button"
import {
	Card,
	CardContent,
	CardDescription,
	CardHeader,
	CardTitle,
} from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import {
	Select,
	SelectContent,
	SelectItem,
	SelectTrigger,
	SelectValue,
} from "@/components/ui/select"
import { Switch } from "@/components/ui/switch"
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group"
import { Badge } from "@/components/ui/badge"
import { cn } from "@/lib/utils"
import {
	getTemplates,
	getMyTeamsForRetro,
	createRetro,
	seedBuiltInTemplates,
} from "@/lib/api/retros"

export const Route = createFileRoute("/retros/new")({
	loader: async () => {
		// Seed templates if needed (first-time setup)
		await seedBuiltInTemplates()

		const [templates, teams] = await Promise.all([
			getTemplates(),
			getMyTeamsForRetro(),
		])
		return { templates, teams }
	},
	component: NewRetroPage,
})

type Step = "template" | "team" | "settings" | "confirm"

function NewRetroPage() {
	const { templates, teams } = Route.useLoaderData()
	const navigate = useNavigate()

	// Wizard state
	const [step, setStep] = useState<Step>("template")

	// Form state
	const [selectedTemplateId, setSelectedTemplateId] = useState<string | null>(null)
	const [selectedTeamId, setSelectedTeamId] = useState<string | null>(null)
	const [retroName, setRetroName] = useState("")
	const [isAnonymous, setIsAnonymous] = useState(true)
	const [voteType, setVoteType] = useState<"multi" | "single">("multi")
	const [maxVotes, setMaxVotes] = useState(3)
	const [timerEnabled, setTimerEnabled] = useState(true)
	const [timerMinutes, setTimerMinutes] = useState(5)

	const selectedTemplate = templates.find((t) => t.id === selectedTemplateId)
	const selectedTeam = teams.find((t) => t.id === selectedTeamId)

	const createMutation = useMutation({
		mutationFn: () =>
			createRetro({
				data: {
					name: retroName || `${selectedTemplate?.name} Retro`,
					teamId: selectedTeamId!,
					templateId: selectedTemplateId!,
					isAnonymous,
					voteType,
					maxVotesPerUser: maxVotes,
					timerDuration: timerEnabled ? timerMinutes * 60 : undefined,
				},
			}),
		onSuccess: (data) => {
			navigate({ to: "/retros/$retroId", params: { retroId: data.id } })
		},
	})

	const canProceed = () => {
		switch (step) {
			case "template":
				return !!selectedTemplateId
			case "team":
				return !!selectedTeamId
			case "settings":
				return true
			case "confirm":
				return true
			default:
				return false
		}
	}

	const nextStep = () => {
		if (step === "template") setStep("team")
		else if (step === "team") setStep("settings")
		else if (step === "settings") setStep("confirm")
	}

	const prevStep = () => {
		if (step === "team") setStep("template")
		else if (step === "settings") setStep("team")
		else if (step === "confirm") setStep("settings")
	}

	const steps: { id: Step; label: string }[] = [
		{ id: "template", label: "Template" },
		{ id: "team", label: "Team" },
		{ id: "settings", label: "Settings" },
		{ id: "confirm", label: "Confirm" },
	]

	const stepIndex = steps.findIndex((s) => s.id === step)

	return (
		<div className="mx-auto max-w-4xl space-y-6">
			{/* Header */}
			<div className="flex items-center gap-4">
				<Button variant="ghost" size="icon" asChild>
					<Link to="/retros">
						<ArrowLeft className="h-4 w-4" />
					</Link>
				</Button>
				<div>
					<h1 className="text-3xl font-bold tracking-tight">
						New Retrospective
					</h1>
					<p className="text-muted-foreground">
						Set up your retrospective in a few simple steps
					</p>
				</div>
			</div>

			{/* Progress Steps */}
			<div className="flex items-center justify-between">
				{steps.map((s, i) => (
					<div key={s.id} className="flex items-center">
						<div
							className={cn(
								"flex h-8 w-8 items-center justify-center rounded-full border-2 text-sm font-medium",
								i < stepIndex
									? "border-primary bg-primary text-primary-foreground"
									: i === stepIndex
										? "border-primary text-primary"
										: "border-muted text-muted-foreground"
							)}
						>
							{i < stepIndex ? <Check className="h-4 w-4" /> : i + 1}
						</div>
						<span
							className={cn(
								"ml-2 text-sm font-medium",
								i <= stepIndex ? "text-foreground" : "text-muted-foreground"
							)}
						>
							{s.label}
						</span>
						{i < steps.length - 1 && (
							<div
								className={cn(
									"mx-4 h-0.5 w-16",
									i < stepIndex ? "bg-primary" : "bg-muted"
								)}
							/>
						)}
					</div>
				))}
			</div>

			{/* Step Content */}
			<div className="min-h-[400px]">
				{step === "template" && (
					<div className="space-y-4">
						<h2 className="text-xl font-semibold">Choose a Template</h2>
						<p className="text-muted-foreground">
							Select a retrospective format that fits your team's needs
						</p>
						<div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
							{templates.map((tmpl) => (
								<Card
									key={tmpl.id}
									className={cn(
										"cursor-pointer transition-all hover:border-primary/50",
										selectedTemplateId === tmpl.id &&
											"border-primary ring-2 ring-primary ring-offset-2"
									)}
									onClick={() => setSelectedTemplateId(tmpl.id)}
								>
									<CardHeader className="pb-3">
										<div className="flex items-center justify-between">
											<CardTitle className="text-lg">{tmpl.name}</CardTitle>
											{tmpl.isBuiltIn && (
												<Badge variant="secondary" className="text-xs">
													Built-in
												</Badge>
											)}
										</div>
										<CardDescription className="text-sm">
											{tmpl.description}
										</CardDescription>
									</CardHeader>
									<CardContent>
										<div className="flex flex-wrap gap-2">
											{tmpl.columns.map((col) => (
												<div
													key={col.id}
													className="flex items-center gap-1.5 rounded-lg bg-muted px-2.5 py-1.5"
												>
													<span className="text-lg">{col.emoji}</span>
													<span className="text-xs font-medium">{col.name}</span>
												</div>
											))}
										</div>
									</CardContent>
								</Card>
							))}
						</div>

						{templates.length === 0 && (
							<Card>
								<CardContent className="flex flex-col items-center justify-center py-12">
									<p className="text-muted-foreground">
										No templates available. Please refresh to seed templates.
									</p>
								</CardContent>
							</Card>
						)}
					</div>
				)}

				{step === "team" && (
					<div className="space-y-4">
						<h2 className="text-xl font-semibold">Select Your Team</h2>
						<p className="text-muted-foreground">
							Choose which team this retrospective is for
						</p>
						{teams.length === 0 ? (
							<Card>
								<CardContent className="flex flex-col items-center justify-center py-12">
									<Users className="mb-4 h-12 w-12 text-muted-foreground" />
									<h3 className="mb-2 text-lg font-semibold">No Teams Found</h3>
									<p className="mb-4 text-center text-muted-foreground">
										You need to be a member of a team to create a retrospective.
									</p>
									<Button asChild>
										<Link to="/team">Join or Create a Team</Link>
									</Button>
								</CardContent>
							</Card>
						) : (
							<div className="grid gap-4 md:grid-cols-2">
								{teams.map((team) => (
									<Card
										key={team.id}
										className={cn(
											"cursor-pointer transition-all hover:border-primary/50",
											selectedTeamId === team.id &&
												"border-primary ring-2 ring-primary ring-offset-2"
										)}
										onClick={() => setSelectedTeamId(team.id)}
									>
										<CardHeader>
											<div className="flex items-center gap-3">
												<span className="text-3xl">{team.emoji ?? "👥"}</span>
												<div>
													<CardTitle>{team.name}</CardTitle>
													<CardDescription>
														{team.organization.name}
													</CardDescription>
												</div>
											</div>
										</CardHeader>
										<CardContent>
											<Badge variant={team.role === "lead" ? "default" : "outline"}>
												{team.role === "lead" ? "Team Lead" : "Member"}
											</Badge>
										</CardContent>
									</Card>
								))}
							</div>
						)}
					</div>
				)}

				{step === "settings" && (
					<div className="space-y-6">
						<h2 className="text-xl font-semibold">Configure Settings</h2>
						<p className="text-muted-foreground">
							Customize how your retrospective will work
						</p>

						<div className="grid gap-6 md:grid-cols-2">
							{/* Retro Name */}
							<div className="space-y-2">
								<Label htmlFor="retroName">Retrospective Name (optional)</Label>
								<Input
									id="retroName"
									placeholder={`${selectedTemplate?.name} Retro`}
									value={retroName}
									onChange={(e) => setRetroName(e.target.value)}
								/>
							</div>

							{/* Timer */}
							<div className="space-y-2">
								<Label htmlFor="timer">Card Creation Timer</Label>
								<div className="flex items-center gap-4">
									<Switch
										id="timer"
										checked={timerEnabled}
										onCheckedChange={setTimerEnabled}
									/>
									{timerEnabled && (
										<div className="flex items-center gap-2">
											<Input
												type="number"
												min={1}
												max={60}
												value={timerMinutes}
												onChange={(e) => setTimerMinutes(Number(e.target.value))}
												className="w-20"
											/>
											<span className="text-sm text-muted-foreground">minutes</span>
										</div>
									)}
								</div>
								<p className="text-xs text-muted-foreground">
									{timerEnabled
										? "Cards are hidden from others until the timer ends"
										: "Cards are visible immediately to all participants"}
								</p>
							</div>

							{/* Anonymous */}
							<div className="space-y-2">
								<Label>Anonymous Mode</Label>
								<div className="flex items-center gap-4">
									<Switch
										checked={isAnonymous}
										onCheckedChange={setIsAnonymous}
									/>
									<div className="flex items-center gap-2 text-sm text-muted-foreground">
										{isAnonymous ? (
											<>
												<EyeOff className="h-4 w-4" />
												Authors hidden
											</>
										) : (
											<>
												<Eye className="h-4 w-4" />
												Authors visible
											</>
										)}
									</div>
								</div>
								<p className="text-xs text-muted-foreground">
									{isAnonymous
										? "Card authors are hidden to encourage honest feedback"
										: "Card authors are visible to all participants"}
								</p>
							</div>

							{/* Vote Type */}
							<div className="space-y-2">
								<Label>Voting Type</Label>
								<RadioGroup
									value={voteType}
									onValueChange={(v) => setVoteType(v as "multi" | "single")}
								>
									<div className="flex items-center space-x-2">
										<RadioGroupItem value="multi" id="multi" />
										<Label htmlFor="multi" className="font-normal">
											Multi-vote (distribute {maxVotes} votes)
										</Label>
									</div>
									<div className="flex items-center space-x-2">
										<RadioGroupItem value="single" id="single" />
										<Label htmlFor="single" className="font-normal">
											Single vote (one vote only)
										</Label>
									</div>
								</RadioGroup>
							</div>

							{/* Max Votes (only for multi-vote) */}
							{voteType === "multi" && (
								<div className="space-y-2">
									<Label htmlFor="maxVotes">Votes per Person</Label>
									<Select
										value={String(maxVotes)}
										onValueChange={(v) => setMaxVotes(Number(v))}
									>
										<SelectTrigger className="w-32">
											<SelectValue />
										</SelectTrigger>
										<SelectContent>
											{[1, 2, 3, 4, 5, 6, 7, 8, 9, 10].map((n) => (
												<SelectItem key={n} value={String(n)}>
													{n} vote{n > 1 ? "s" : ""}
												</SelectItem>
											))}
										</SelectContent>
									</Select>
								</div>
							)}
						</div>
					</div>
				)}

				{step === "confirm" && (
					<div className="space-y-6">
						<h2 className="text-xl font-semibold">Review & Create</h2>
						<p className="text-muted-foreground">
							Review your settings and create the retrospective
						</p>

						<Card>
							<CardHeader>
								<CardTitle>
									{retroName || `${selectedTemplate?.name} Retro`}
								</CardTitle>
								<CardDescription>
									{selectedTeam?.name} • {selectedTeam?.organization.name}
								</CardDescription>
							</CardHeader>
							<CardContent className="space-y-4">
								{/* Template Preview */}
								<div>
									<Label className="text-muted-foreground">Template</Label>
									<div className="mt-1 flex items-center gap-2">
										<span className="font-medium">{selectedTemplate?.name}</span>
										<div className="flex gap-1">
											{selectedTemplate?.columns.map((col) => (
												<span
													key={col.id}
													className="text-lg"
													title={col.name}
												>
													{col.emoji}
												</span>
											))}
										</div>
									</div>
								</div>

								{/* Settings Summary */}
								<div className="grid gap-4 md:grid-cols-2">
									<div className="flex items-center gap-3 rounded-lg border p-3">
										<Clock className="h-5 w-5 text-muted-foreground" />
										<div>
											<p className="text-sm font-medium">Timer</p>
											<p className="text-xs text-muted-foreground">
												{timerEnabled ? `${timerMinutes} minutes` : "No timer"}
											</p>
										</div>
									</div>

									<div className="flex items-center gap-3 rounded-lg border p-3">
										{isAnonymous ? (
											<EyeOff className="h-5 w-5 text-muted-foreground" />
										) : (
											<Eye className="h-5 w-5 text-muted-foreground" />
										)}
										<div>
											<p className="text-sm font-medium">
												{isAnonymous ? "Anonymous" : "Named"}
											</p>
											<p className="text-xs text-muted-foreground">
												{isAnonymous ? "Authors hidden" : "Authors visible"}
											</p>
										</div>
									</div>

									<div className="flex items-center gap-3 rounded-lg border p-3">
										<Vote className="h-5 w-5 text-muted-foreground" />
										<div>
											<p className="text-sm font-medium">
												{voteType === "multi" ? "Multi-vote" : "Single vote"}
											</p>
											<p className="text-xs text-muted-foreground">
												{voteType === "multi"
													? `${maxVotes} votes per person`
													: "One vote per person"}
											</p>
										</div>
									</div>

									<div className="flex items-center gap-3 rounded-lg border p-3">
										<Users className="h-5 w-5 text-muted-foreground" />
										<div>
											<p className="text-sm font-medium">{selectedTeam?.name}</p>
											<p className="text-xs text-muted-foreground">
												{selectedTeam?.organization.name}
											</p>
										</div>
									</div>
								</div>
							</CardContent>
						</Card>
					</div>
				)}
			</div>

			{/* Navigation Buttons */}
			<div className="flex justify-between pt-4">
				<Button
					variant="outline"
					onClick={prevStep}
					disabled={step === "template"}
				>
					<ArrowLeft className="mr-2 h-4 w-4" />
					Back
				</Button>

				{step === "confirm" ? (
					<Button
						onClick={() => createMutation.mutate()}
						disabled={createMutation.isPending || !selectedTemplateId || !selectedTeamId}
					>
						{createMutation.isPending ? "Creating..." : "Create Retrospective"}
					</Button>
				) : (
					<Button onClick={nextStep} disabled={!canProceed()}>
						Next
						<ArrowRight className="ml-2 h-4 w-4" />
					</Button>
				)}
			</div>
		</div>
	)
}
