import { createFileRoute, Outlet, redirect } from "@tanstack/react-router"
import { getCurrentUser } from "@/lib/api/users"

export const Route = createFileRoute("/_authenticated")({
	beforeLoad: async () => {
		const user = await getCurrentUser()

		if (!user) {
			throw redirect({ to: "/sign-in" })
		}

		// Check if user is approved
		if (user.status === "pending") {
			throw redirect({ to: "/sign-in", search: { pending: true } })
		}

		if (user.status === "rejected") {
			throw redirect({ to: "/sign-in", search: { rejected: true } })
		}

		if (user.status === "suspended") {
			throw redirect({ to: "/sign-in", search: { suspended: true } })
		}

		return { user }
	},
	component: AuthenticatedLayout,
})

function AuthenticatedLayout() {
	return <Outlet />
}
