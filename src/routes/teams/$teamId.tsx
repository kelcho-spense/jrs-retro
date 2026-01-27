import { createFileRoute } from '@tanstack/react-router'

export const Route = createFileRoute('/teams/$teamId')({
  component: RouteComponent,
})

function RouteComponent() {
  return <div>Hello "/teams/$teamId"!</div>
}
