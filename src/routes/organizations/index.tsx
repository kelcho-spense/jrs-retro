import { createFileRoute, Link } from "@tanstack/react-router"
import { useState } from "react"
import { useMutation } from "@tanstack/react-query"
import { getMyOrganizations, createOrganization } from "@/lib/api/organizations"
import { getCurrentUser } from "@/lib/api/users"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import {
	Dialog,
	DialogContent,
	DialogDescription,
	DialogFooter,
	DialogHeader,
	DialogTitle,
	DialogTrigger,
} from "@/components/ui/dialog"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Building2, Plus, Users, Crown, Shield, User } from "lucide-react"
import { Badge } from "@/components/ui/badge"

export const Route = createFileRoute("/organizations/")({
	loader: async () => {
		const [organizations, currentUser] = await Promise.all([
			getMyOrganizations(),
			getCurrentUser(),
		])
		return { organizations, isAdmin: currentUser?.role === "admin" }
	},
	component: OrganizationsPage,
})

function OrganizationsPage() {
	const { organizations, isAdmin } = Route.useLoaderData()
	const [isCreateOpen, setIsCreateOpen] = useState(false)
	const [name, setName] = useState("")
	const [slug, setSlug] = useState("")

	const createMutation = useMutation({
		mutationFn: (data: { name: string; slug: string }) =>
			createOrganization({ data }),
		onSuccess: () => {
			setIsCreateOpen(false)
			setName("")
			setSlug("")
			// Reload the page to get updated data
			window.location.reload()
		},
	})

	const handleNameChange = (e: React.ChangeEvent<HTMLInputElement>) => {
		const newName = e.target.value
		setName(newName)
		// Auto-generate slug from name
		setSlug(
			newName
				.toLowerCase()
				.replace(/[^a-z0-9]+/g, "-")
				.replace(/^-|-$/g, "")
		)
	}

	const getRoleBadge = (role: string) => {
		switch (role) {
			case "owner":
				return (
					<Badge variant="default" className="gap-1">
						<Crown className="h-3 w-3" />
						Owner
					</Badge>
				)
			case "admin":
				return (
					<Badge variant="secondary" className="gap-1">
						<Shield className="h-3 w-3" />
						Admin
					</Badge>
				)
			default:
				return (
					<Badge variant="outline" className="gap-1">
						<User className="h-3 w-3" />
						Member
					</Badge>
				)
		}
	}

	return (
		<div className="container py-8">
			<div className="mb-8 flex items-center justify-between">
				<div>
					<h1 className="text-3xl font-bold tracking-tight">Organizations</h1>
					<p className="text-muted-foreground">
						{isAdmin 
							? "Manage your organizations and teams" 
							: "View your organizations and teams"}
					</p>
				</div>
				{isAdmin && (
					<Dialog open={isCreateOpen} onOpenChange={setIsCreateOpen}>
						<DialogTrigger asChild>
							<Button>
								<Plus className="mr-2 h-4 w-4" />
								New Organization
							</Button>
						</DialogTrigger>
						<DialogContent>
							<DialogHeader>
								<DialogTitle>Create Organization</DialogTitle>
								<DialogDescription>
									Create a new organization to collaborate with your team.
								</DialogDescription>
						</DialogHeader>
						<div className="grid gap-4 py-4">
							<div className="grid gap-2">
								<Label htmlFor="name">Name</Label>
								<Input
									id="name"
									placeholder="Acme Inc."
									value={name}
									onChange={handleNameChange}
								/>
							</div>
							<div className="grid gap-2">
								<Label htmlFor="slug">Slug</Label>
								<Input
									id="slug"
									placeholder="acme-inc"
									value={slug}
									onChange={(e) => setSlug(e.target.value)}
								/>
								<p className="text-xs text-muted-foreground">
									Used in URLs. Only lowercase letters, numbers, and hyphens.
								</p>
							</div>
						</div>
						<DialogFooter>
							<Button
								variant="outline"
								onClick={() => setIsCreateOpen(false)}
							>
								Cancel
							</Button>
							<Button
								onClick={() => createMutation.mutate({ name, slug })}
								disabled={!name || !slug || createMutation.isPending}
							>
								{createMutation.isPending ? "Creating..." : "Create"}
							</Button>
						</DialogFooter>
					</DialogContent>
				</Dialog>
				)}
			</div>

			{organizations.length === 0 ? (
				<Card>
					<CardContent className="flex flex-col items-center justify-center py-16">
						<Building2 className="mb-4 h-16 w-16 text-muted-foreground" />
						<h2 className="mb-2 text-xl font-semibold">No organizations yet</h2>
						<p className="mb-4 text-center text-muted-foreground">
							{isAdmin 
								? "Create your first organization to start collaborating with your team."
								: "You are not a member of any organizations yet. Ask an administrator to add you."}
						</p>
						{isAdmin && (
							<Button onClick={() => setIsCreateOpen(true)}>
								<Plus className="mr-2 h-4 w-4" />
								Create Organization
							</Button>
						)}
					</CardContent>
				</Card>
			) : (
				<div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
					{organizations.map((org) => (
						<Link
							key={org.id}
							to="/organizations/$orgId"
							params={{ orgId: org.id }}
							className="group"
						>
							<Card className="transition-shadow hover:shadow-md">
								<CardHeader>
									<div className="flex items-start justify-between">
										<div className="flex items-center gap-3">
											{org.logo ? (
												<img
													src={org.logo}
													alt={org.name}
													className="h-10 w-10 rounded-lg object-cover"
												/>
											) : (
												<div className="flex h-10 w-10 items-center justify-center rounded-lg bg-primary/10">
													<Building2 className="h-5 w-5 text-primary" />
												</div>
											)}
											<div>
												<CardTitle className="text-lg group-hover:underline">
													{org.name}
												</CardTitle>
												<CardDescription>/{org.slug}</CardDescription>
											</div>
										</div>
										{getRoleBadge(org.myRole)}
									</div>
								</CardHeader>
								<CardContent>
									<div className="flex items-center gap-4 text-sm text-muted-foreground">
										<div className="flex items-center gap-1">
											<Users className="h-4 w-4" />
											<span>{org.memberCount} members</span>
										</div>
									</div>
								</CardContent>
							</Card>
						</Link>
					))}
				</div>
			)}
		</div>
	)
}
