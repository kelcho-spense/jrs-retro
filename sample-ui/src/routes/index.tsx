import { createFileRoute, Link } from '@tanstack/react-router'
import {
  Zap,
  Server,
  Route as RouteIcon,
  Shield,
  Waves,
  Sparkles,
  LogIn,
  UserPlus,
  LayoutDashboard,
} from 'lucide-react'
import { authClient } from '@/lib/auth-client'
import Header from '@/components/Header'

export const Route = createFileRoute('/')({ component: App })

function App() {
  const { data: session } = authClient.useSession()

  const features = [
    {
      icon: <Zap className="w-12 h-12 text-cyan-600 dark:text-cyan-400" />,
      title: 'Powerful Server Functions',
      description:
        'Write server-side code that seamlessly integrates with your client components. Type-safe, secure, and simple.',
    },
    {
      icon: <Server className="w-12 h-12 text-cyan-600 dark:text-cyan-400" />,
      title: 'Flexible Server Side Rendering',
      description:
        'Full-document SSR, streaming, and progressive enhancement out of the box. Control exactly what renders where.',
    },
    {
      icon: <RouteIcon className="w-12 h-12 text-cyan-600 dark:text-cyan-400" />,
      title: 'API Routes',
      description:
        'Build type-safe API endpoints alongside your application. No separate backend needed.',
    },
    {
      icon: <Shield className="w-12 h-12 text-cyan-600 dark:text-cyan-400" />,
      title: 'Strongly Typed Everything',
      description:
        'End-to-end type safety from server to client. Catch errors before they reach production.',
    },
    {
      icon: <Waves className="w-12 h-12 text-cyan-600 dark:text-cyan-400" />,
      title: 'Full Streaming Support',
      description:
        'Stream data from server to client progressively. Perfect for AI applications and real-time updates.',
    },
    {
      icon: <Sparkles className="w-12 h-12 text-cyan-600 dark:text-cyan-400" />,
      title: 'Next Generation Ready',
      description:
        'Built from the ground up for modern web applications. Deploy anywhere JavaScript runs.',
    },
  ]

  return (
    <>
      <Header />
      <div className="min-h-screen bg-gradient-to-b from-background via-muted/50 to-background">
        <section className="relative py-20 px-6 text-center overflow-hidden">
          <div className="absolute inset-0 bg-gradient-to-r from-cyan-500/10 via-blue-500/10 to-purple-500/10"></div>
          <div className="relative max-w-5xl mx-auto">
            <div className="flex items-center justify-center gap-4 mb-6">
              <Shield className="w-16 h-16 md:w-20 md:h-20 text-cyan-600 dark:text-cyan-400" />
              <h1 className="text-5xl md:text-7xl font-black text-foreground [letter-spacing:-0.08em]">
                <span className="text-muted-foreground">BETTER</span>{' '}
                <span className="bg-gradient-to-r from-cyan-500 to-blue-500 dark:from-cyan-400 dark:to-blue-400 bg-clip-text text-transparent">
                  AUTH
                </span>
              </h1>
            </div>
            <p className="text-2xl md:text-3xl text-foreground/80 mb-4 font-light">
              Secure Authentication Made Simple
            </p>
            <p className="text-lg text-muted-foreground max-w-3xl mx-auto mb-8">
              Built with TanStack Start, Better Auth, TanStack Query, and TanStack Store.
              A complete authentication solution with email/password, session management, and more.
            </p>
            <div className="flex flex-col sm:flex-row items-center justify-center gap-4">
              {session?.user ? (
                <Link
                  to="/dashboard"
                  className="flex items-center gap-2 px-8 py-3 bg-cyan-500 hover:bg-cyan-600 text-white font-semibold rounded-lg transition-colors shadow-lg shadow-cyan-500/50"
                >
                  <LayoutDashboard className="w-5 h-5" />
                  Go to Dashboard
                </Link>
              ) : (
                <>
                  <Link
                    to="/auth/signup"
                    className="flex items-center gap-2 px-8 py-3 bg-cyan-500 hover:bg-cyan-600 text-white font-semibold rounded-lg transition-colors shadow-lg shadow-cyan-500/50"
                  >
                    <UserPlus className="w-5 h-5" />
                    Get Started
                  </Link>
                  <Link
                    to="/auth/login"
                    className="flex items-center gap-2 px-8 py-3 bg-muted hover:bg-muted/80 text-foreground font-semibold rounded-lg transition-colors border border-border"
                  >
                    <LogIn className="w-5 h-5" />
                    Sign In
                  </Link>
                </>
              )}
            </div>
          </div>
        </section>

        <section className="py-16 px-6 max-w-7xl mx-auto">
          <h2 className="text-3xl font-bold text-foreground text-center mb-12">
            Features
          </h2>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {features.map((feature, index) => (
              <div
                key={index}
                className="bg-card/50 backdrop-blur-sm border border-border rounded-xl p-6 hover:border-cyan-500/50 transition-all duration-300 hover:shadow-lg hover:shadow-cyan-500/10"
              >
                <div className="mb-4">{feature.icon}</div>
                <h3 className="text-xl font-semibold text-foreground mb-3">
                  {feature.title}
                </h3>
                <p className="text-muted-foreground leading-relaxed">
                  {feature.description}
                </p>
              </div>
            ))}
          </div>
        </section>

        {/* Auth Features Section */}
        <section className="py-16 px-6 max-w-4xl mx-auto">
          <h2 className="text-3xl font-bold text-foreground text-center mb-12">
            Authentication Features
          </h2>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div className="bg-card/50 border border-border rounded-xl p-6">
              <h3 className="text-xl font-semibold text-foreground mb-3 flex items-center gap-2">
                <Shield className="w-5 h-5 text-cyan-600 dark:text-cyan-400" />
                Email & Password
              </h3>
              <p className="text-muted-foreground">
                Secure email and password authentication with verification and password reset.
              </p>
            </div>
            <div className="bg-card/50 border border-border rounded-xl p-6">
              <h3 className="text-xl font-semibold text-foreground mb-3 flex items-center gap-2">
                <Shield className="w-5 h-5 text-cyan-600 dark:text-cyan-400" />
                Session Management
              </h3>
              <p className="text-muted-foreground">
                View and manage active sessions across devices with one-click revocation.
              </p>
            </div>
            <div className="bg-card/50 border border-border rounded-xl p-6">
              <h3 className="text-xl font-semibold text-foreground mb-3 flex items-center gap-2">
                <Shield className="w-5 h-5 text-cyan-600 dark:text-cyan-400" />
                Profile Management
              </h3>
              <p className="text-muted-foreground">
                Update your profile information, change password, and manage account settings.
              </p>
            </div>
            <div className="bg-card/50 border border-border rounded-xl p-6">
              <h3 className="text-xl font-semibold text-foreground mb-3 flex items-center gap-2">
                <Shield className="w-5 h-5 text-cyan-600 dark:text-cyan-400" />
                Rate Limiting
              </h3>
              <p className="text-muted-foreground">
                Built-in protection against brute force attacks and API abuse.
              </p>
            </div>
          </div>
        </section>
      </div>
    </>
  )
}
