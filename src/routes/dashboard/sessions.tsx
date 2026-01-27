import { createFileRoute } from "@tanstack/react-router"
import { useState, useEffect } from "react"
import {
	Monitor,
	Smartphone,
	Tablet,
	Globe,
	Clock,
	MapPin,
	LogOut,
	Loader2,
	CheckCircle2,
	AlertCircle,
} from "lucide-react"

import { Button } from "@/components/ui/button"
import { authClient } from "@/lib/auth-client"

export const Route = createFileRoute("/dashboard/sessions")({
	component: SessionsPage,
})

interface SessionData {
	token: string
	userAgent?: string
	ipAddress?: string
	createdAt: string
	updatedAt?: string
}

function SessionsPage() {
	const { data: currentSession } = authClient.useSession()
	const [sessions, setSessions] = useState<SessionData[]>([])
	const [isLoading, setIsLoading] = useState(true)
	const [revokingSession, setRevokingSession] = useState<string | null>(null)
	const [revokeSuccess, setRevokeSuccess] = useState(false)
	const [revokeError, setRevokeError] = useState<string | null>(null)

	const fetchSessions = async () => {
		try {
			setIsLoading(true)
			const response = await authClient.multiSession.listDeviceSessions()
			if (response.data) {
				// Map the response to our SessionData format
				const mappedSessions = response.data.map((item) => ({
					token: item.session.token,
					userAgent: item.session.userAgent ?? undefined,
					ipAddress: item.session.ipAddress ?? undefined,
					createdAt: item.session.createdAt.toISOString(),
					updatedAt: item.session.updatedAt?.toISOString(),
				}))
				setSessions(mappedSessions)
			}
		} catch (err) {
			console.error("Failed to fetch sessions:", err)
		} finally {
			setIsLoading(false)
		}
	}

	useEffect(() => {
		fetchSessions()
	}, [])

	const getDeviceIcon = (userAgent: string) => {
		if (!userAgent) return Monitor
		const ua = userAgent.toLowerCase()
		if (
			ua.includes("mobile") ||
			ua.includes("iphone") ||
			ua.includes("android")
		) {
			return Smartphone
		}
		if (ua.includes("ipad") || ua.includes("tablet")) {
			return Tablet
		}
		return Monitor
	}

	const getBrowserInfo = (userAgent: string) => {
		if (!userAgent) return "Unknown Browser"
		const ua = userAgent.toLowerCase()
		if (ua.includes("chrome")) return "Chrome"
		if (ua.includes("firefox")) return "Firefox"
		if (ua.includes("safari")) return "Safari"
		if (ua.includes("edge")) return "Edge"
		if (ua.includes("opera")) return "Opera"
		return "Unknown Browser"
	}

	const getOSInfo = (userAgent: string) => {
		if (!userAgent) return "Unknown OS"
		const ua = userAgent.toLowerCase()
		if (ua.includes("windows")) return "Windows"
		if (ua.includes("mac")) return "macOS"
		if (ua.includes("linux")) return "Linux"
		if (ua.includes("android")) return "Android"
		if (ua.includes("iphone") || ua.includes("ipad")) return "iOS"
		return "Unknown OS"
	}

	const handleRevokeSession = async (sessionToken: string) => {
		setRevokingSession(sessionToken)
		setRevokeError(null)

		try {
			await authClient.revokeSession({ token: sessionToken })
			setRevokeSuccess(true)
			fetchSessions()
			setTimeout(() => setRevokeSuccess(false), 3000)
		} catch (err: unknown) {
			const message =
				err instanceof Error ? err.message : "Failed to revoke session"
			setRevokeError(message)
		} finally {
			setRevokingSession(null)
		}
	}

	const handleRevokeAllOtherSessions = async () => {
		setRevokeError(null)

		try {
			await authClient.revokeOtherSessions()
			setRevokeSuccess(true)
			fetchSessions()
			setTimeout(() => setRevokeSuccess(false), 3000)
		} catch (err: unknown) {
			const message =
				err instanceof Error ? err.message : "Failed to revoke sessions"
			setRevokeError(message)
		}
	}

	if (isLoading) {
		return (
			<div className="flex items-center justify-center py-12">
				<Loader2 className="w-8 h-8 animate-spin text-primary" />
			</div>
		)
	}

	return (
		<div className="max-w-3xl mx-auto space-y-8">
			{/* Header */}
			<div className="flex items-center justify-between">
				<div>
					<h1 className="text-2xl font-bold text-foreground">Active Sessions</h1>
					<p className="text-muted-foreground mt-1">
						Manage your active sessions across all devices.
					</p>
				</div>
				<Button
					variant="outline"
					className="text-destructive hover:text-destructive hover:bg-destructive/10"
					onClick={handleRevokeAllOtherSessions}
				>
					<LogOut className="w-4 h-4 mr-2" />
					Sign Out All Others
				</Button>
			</div>

			{/* Status Messages */}
			{revokeSuccess && (
				<div className="p-4 bg-green-500/10 border border-green-500/20 rounded-lg flex items-center gap-3">
					<CheckCircle2 className="w-5 h-5 text-green-600 dark:text-green-400" />
					<span className="text-green-600 dark:text-green-400">
						Session(s) revoked successfully!
					</span>
				</div>
			)}

			{revokeError && (
				<div className="p-4 bg-destructive/10 border border-destructive/20 rounded-lg flex items-center gap-3">
					<AlertCircle className="w-5 h-5 text-destructive" />
					<span className="text-destructive">{revokeError}</span>
				</div>
			)}

			{/* Sessions List */}
			<div className="space-y-4">
				{sessions?.map((session) => {
					const isCurrentSession =
						session.token === currentSession?.session?.token
					const DeviceIcon = getDeviceIcon(session.userAgent || "")
					const browser = getBrowserInfo(session.userAgent || "")
					const os = getOSInfo(session.userAgent || "")

					return (
						<div
							key={session.token}
							className={`bg-card rounded-xl border p-6 transition-colors ${
								isCurrentSession
									? "border-primary/50 bg-primary/5"
									: "border-border hover:border-border/80"
							}`}
						>
							<div className="flex items-start justify-between gap-4">
								<div className="flex items-start gap-4">
									<div
										className={`w-12 h-12 rounded-lg flex items-center justify-center ${
											isCurrentSession ? "bg-primary/10" : "bg-muted"
										}`}
									>
										<DeviceIcon
											className={`w-6 h-6 ${
												isCurrentSession
													? "text-primary"
													: "text-muted-foreground"
											}`}
										/>
									</div>
									<div>
										<div className="flex items-center gap-2">
											<h3 className="font-semibold text-foreground">
												{browser} on {os}
											</h3>
											{isCurrentSession && (
												<span className="text-xs px-2 py-0.5 rounded-full bg-primary/10 text-primary">
													Current Session
												</span>
											)}
										</div>
										<div className="mt-2 space-y-1 text-sm text-muted-foreground">
											<div className="flex items-center gap-2">
												<Globe className="w-4 h-4" />
												<span>{session.ipAddress || "Unknown IP"}</span>
											</div>
											<div className="flex items-center gap-2">
												<Clock className="w-4 h-4" />
												<span>
													Last active:{" "}
													{session.updatedAt
														? new Date(session.updatedAt).toLocaleString()
														: "Unknown"}
												</span>
											</div>
											<div className="flex items-center gap-2">
												<MapPin className="w-4 h-4" />
												<span>
													Created:{" "}
													{new Date(session.createdAt).toLocaleString()}
												</span>
											</div>
										</div>
									</div>
								</div>
								{!isCurrentSession && (
									<Button
										variant="outline"
										size="sm"
										className="text-destructive hover:text-destructive hover:bg-destructive/10"
										onClick={() => handleRevokeSession(session.token)}
										disabled={revokingSession === session.token}
									>
										{revokingSession === session.token ? (
											<Loader2 className="w-4 h-4 animate-spin" />
										) : (
											<>
												<LogOut className="w-4 h-4 mr-1" />
												Revoke
											</>
										)}
									</Button>
								)}
							</div>
						</div>
					)
				})}
			</div>

			{/* Empty State */}
			{(!sessions || sessions.length === 0) && (
				<div className="text-center py-12">
					<Monitor className="w-12 h-12 mx-auto text-muted-foreground mb-4" />
					<h3 className="text-lg font-medium text-foreground">
						No active sessions
					</h3>
					<p className="text-muted-foreground mt-1">
						Your session information will appear here.
					</p>
				</div>
			)}

			{/* Info Card */}
			<div className="bg-blue-500/5 border border-blue-500/20 rounded-xl p-6">
				<h3 className="font-semibold text-foreground mb-2">About Sessions</h3>
				<p className="text-sm text-muted-foreground">
					Each time you sign in on a new device or browser, a new session is
					created. If you don't recognize a session, revoke it immediately and
					change your password to secure your account.
				</p>
			</div>
		</div>
	)
}
