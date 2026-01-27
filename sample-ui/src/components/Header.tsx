import { Link } from '@tanstack/react-router'

import BetterAuthHeader from '../integrations/better-auth/header-user.tsx'

import { useState } from 'react'
import {
  ChevronDown,
  ChevronRight,
  ClipboardType,
  Globe,
  Home,
  Menu,
  Network,
  SquareFunction,
  StickyNote,
  X,
  Shield,
  LayoutDashboard,
  LogIn,
  UserPlus,
} from 'lucide-react'
import { authClient } from '@/lib/auth-client'
import { ThemeToggle } from './ThemeToggle'

export default function Header() {
  const [isOpen, setIsOpen] = useState(false)
  const [groupedExpanded, setGroupedExpanded] = useState<
    Record<string, boolean>
  >({})

  const { data: session } = authClient.useSession()

  return (
    <>
      <header className="p-4 flex items-center justify-between bg-card border-b border-border text-card-foreground shadow-lg transition-colors">
        <div className="flex items-center">
          <button
            onClick={() => setIsOpen(true)}
            className="p-2 hover:bg-muted rounded-lg transition-colors"
            aria-label="Open menu"
          >
            <Menu size={24} />
          </button>
          <h1 className="ml-4 text-xl font-semibold">
            <Link to="/" className="flex items-center gap-2">
              <Shield className="w-6 h-6 text-cyan-500 dark:text-cyan-400" />
              <span className="hidden sm:inline">Better Auth</span>
            </Link>
          </h1>
        </div>

        <div className="flex items-center gap-3">
          <ThemeToggle />
          {session?.user ? (
            <Link
              to="/dashboard"
              className="flex items-center gap-2 px-4 py-2 text-sm font-medium bg-cyan-600 hover:bg-cyan-700 text-white rounded-lg transition-colors"
            >
              <LayoutDashboard className="w-4 h-4" />
              <span className="hidden sm:inline">Dashboard</span>
            </Link>
          ) : (
            <>
              <Link
                to="/auth/login"
                className="flex items-center gap-2 px-4 py-2 text-sm font-medium text-muted-foreground hover:text-foreground transition-colors"
              >
                <LogIn className="w-4 h-4" />
                <span className="hidden sm:inline">Sign in</span>
              </Link>
              <Link
                to="/auth/signup"
                className="flex items-center gap-2 px-4 py-2 text-sm font-medium bg-cyan-600 hover:bg-cyan-700 text-white rounded-lg transition-colors"
              >
                <UserPlus className="w-4 h-4" />
                <span className="hidden sm:inline">Sign up</span>
              </Link>
            </>
          )}
        </div>
      </header>

      <aside
        className={`fixed top-0 left-0 h-full w-80 bg-card text-card-foreground shadow-2xl z-50 transform transition-all duration-300 ease-in-out flex flex-col border-r border-border ${isOpen ? 'translate-x-0' : '-translate-x-full'
          }`}
      >
        <div className="flex items-center justify-between p-4 border-b border-border">
          <h2 className="text-xl font-bold">Navigation</h2>
          <button
            onClick={() => setIsOpen(false)}
            className="p-2 hover:bg-muted rounded-lg transition-colors"
            aria-label="Close menu"
          >
            <X size={24} />
          </button>
        </div>



        <div className="p-4 border-t border-border bg-muted flex flex-col gap-2">
          <BetterAuthHeader />
        </div>
      </aside>
    </>
  )
}
