import { authClient } from '@/lib/auth-client'
import { Link, useNavigate } from '@tanstack/react-router'
import { LogOut, User, Settings, Shield, LayoutDashboard, Sun, Moon, Monitor } from 'lucide-react'
import { useTheme } from '@/hooks/use-theme'

export default function BetterAuthHeader() {
  const navigate = useNavigate()
  const { data: session, isPending } = authClient.useSession()
  const { theme, setTheme } = useTheme()

  const handleSignOut = async () => {
    await authClient.signOut()
    navigate({ to: '/auth/login' })
  }

  if (isPending) {
    return (
      <div className="flex items-center gap-3 p-3">
        <div className="h-10 w-10 bg-muted animate-pulse rounded-full" />
        <div className="flex-1 space-y-2">
          <div className="h-4 w-24 bg-muted animate-pulse rounded" />
          <div className="h-3 w-32 bg-muted animate-pulse rounded" />
        </div>
      </div>
    )
  }

  if (session?.user) {
    return (
      <div className="space-y-3">
        <div className="flex items-center gap-3 p-3 bg-muted/50 rounded-lg">
          {session.user.image ? (
            <img
              src={session.user.image}
              alt=""
              className="h-10 w-10 rounded-full object-cover"
            />
          ) : (
            <div className="h-10 w-10 bg-cyan-600 rounded-full flex items-center justify-center">
              <span className="text-sm font-bold text-white">
                {session.user.name?.charAt(0).toUpperCase() || 'U'}
              </span>
            </div>
          )}
          <div className="flex-1 min-w-0">
            <p className="text-foreground font-medium truncate">
              {session.user.name || 'User'}
            </p>
            <p className="text-muted-foreground text-xs truncate">
              {session.user.email}
            </p>
          </div>
        </div>

        <div className="space-y-1">
          <Link
            to="/dashboard"
            className="flex items-center gap-2 px-3 py-2 text-sm text-muted-foreground hover:text-foreground hover:bg-muted/50 rounded-lg transition-colors"
          >
            <LayoutDashboard className="w-4 h-4" />
            Dashboard
          </Link>
          <Link
            to="/dashboard/profile"
            className="flex items-center gap-2 px-3 py-2 text-sm text-muted-foreground hover:text-foreground hover:bg-muted/50 rounded-lg transition-colors"
          >
            <User className="w-4 h-4" />
            Profile
          </Link>
          <Link
            to="/dashboard/security"
            className="flex items-center gap-2 px-3 py-2 text-sm text-muted-foreground hover:text-foreground hover:bg-muted/50 rounded-lg transition-colors"
          >
            <Shield className="w-4 h-4" />
            Security
          </Link>
          <Link
            to="/dashboard/settings"
            className="flex items-center gap-2 px-3 py-2 text-sm text-muted-foreground hover:text-foreground hover:bg-muted/50 rounded-lg transition-colors"
          >
            <Settings className="w-4 h-4" />
            Settings
          </Link>
        </div>

        {/* Theme Toggler */}
        <div className="flex items-center justify-between px-3 py-2 bg-muted/30 rounded-lg">
          <span className="text-sm text-muted-foreground">Theme</span>
          <div className="flex items-center gap-1">
            <button
              onClick={() => setTheme('light')}
              className={`p-1.5 rounded-md transition-colors ${theme === 'light' ? 'bg-primary text-primary-foreground' : 'text-muted-foreground hover:text-foreground hover:bg-muted'}`}
              title="Light"
            >
              <Sun className="w-4 h-4" />
            </button>
            <button
              onClick={() => setTheme('dark')}
              className={`p-1.5 rounded-md transition-colors ${theme === 'dark' ? 'bg-primary text-primary-foreground' : 'text-muted-foreground hover:text-foreground hover:bg-muted'}`}
              title="Dark"
            >
              <Moon className="w-4 h-4" />
            </button>
            <button
              onClick={() => setTheme('system')}
              className={`p-1.5 rounded-md transition-colors ${theme === 'system' ? 'bg-primary text-primary-foreground' : 'text-muted-foreground hover:text-foreground hover:bg-muted'}`}
              title="System"
            >
              <Monitor className="w-4 h-4" />
            </button>
          </div>
        </div>

        <button
          onClick={handleSignOut}
          className="w-full flex items-center justify-center gap-2 h-9 px-4 text-sm font-medium bg-red-600/20 text-red-500 dark:text-red-400 border border-red-500/30 hover:bg-red-600/30 rounded-lg transition-colors"
        >
          <LogOut className="w-4 h-4" />
          Sign out
        </button>
      </div>
    )
  }

  return (
    <div className="space-y-2">
      <Link
        to="/auth/login"
        className="w-full flex items-center justify-center h-9 px-4 text-sm font-medium bg-cyan-600 text-white hover:bg-cyan-700 rounded-lg transition-colors"
      >
        Sign in
      </Link>
      <Link
        to="/auth/signup"
        className="w-full flex items-center justify-center h-9 px-4 text-sm font-medium bg-muted text-foreground border border-border hover:bg-muted/80 rounded-lg transition-colors"
      >
        Create account
      </Link>
    </div>
  )
}
