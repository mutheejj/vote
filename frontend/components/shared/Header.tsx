"use client"

import React, { useState, useCallback } from "react"
import Link from "next/link"
import { useRouter, usePathname } from "next/navigation"
import { Menu, X, User, Settings, LogOut, Shield, BarChart3, Search, Sun, Moon, Monitor } from "lucide-react"
import { useAuth } from "@/lib/hooks/useAuth"
import { UserRole } from "@/lib/enums"
import { cn } from "@/lib/utils/cn"
import { Button } from "@/components/ui/button"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import { Badge } from "@/components/ui/badge"
import { NotificationBell } from "./NotificationBell"
import { useTheme } from "@/components/providers/ThemeProvider"

interface HeaderProps {
  className?: string
}

export function Header({ className }: HeaderProps) {
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false)
  const [searchQuery, setSearchQuery] = useState("")
  const [isSearchFocused, setIsSearchFocused] = useState(false)
  const { user, isAuthenticated, logout } = useAuth()
  const router = useRouter()
  const pathname = usePathname()
  const { theme, setTheme } = useTheme()

  const handleLogout = async () => {
    try {
      await logout()
      router.push('/login')
    } catch (error) {
      console.error('Logout failed:', error)
    }
  }

  const handleSearch = useCallback((e: React.FormEvent) => {
    e.preventDefault()
    if (searchQuery.trim()) {
      router.push(`/elections?search=${encodeURIComponent(searchQuery.trim())}`)
    }
  }, [searchQuery, router])

  const navigation = [
    { name: 'Dashboard', href: '/dashboard', roles: [UserRole.VOTER, UserRole.ADMIN, UserRole.MODERATOR, UserRole.SUPER_ADMIN] },
    { name: 'Elections', href: '/elections', roles: [UserRole.VOTER, UserRole.ADMIN, UserRole.MODERATOR, UserRole.SUPER_ADMIN] },
    { name: 'Results', href: '/results', roles: [UserRole.VOTER, UserRole.ADMIN, UserRole.MODERATOR, UserRole.SUPER_ADMIN] },
    { name: 'Admin', href: '/admin', roles: [UserRole.ADMIN, UserRole.MODERATOR, UserRole.SUPER_ADMIN] },
  ]

  const userNavigation = [
    { name: 'Profile', href: '/profile', icon: User },
    { name: 'Settings', href: '/settings', icon: Settings },
  ]

  const isCurrentPage = (href: string) => pathname?.startsWith(href)

  const canAccessRoute = (roles: UserRole[]) => {
    return user && roles.includes(user.role)
  }

  const getThemeIcon = () => {
    switch (theme) {
      case 'light':
        return <Sun className="h-4 w-4" />
      case 'dark':
        return <Moon className="h-4 w-4" />
      default:
        return <Monitor className="h-4 w-4" />
    }
  }

  return (
    <header className={cn(
      "bg-white/80 dark:bg-gray-900/80 backdrop-blur-xl border-b border-sage-200/50 dark:border-sage-800/50 sticky top-0 z-40 transition-colors duration-200",
      className
    )}>
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex justify-between items-center h-16">
          {/* Logo and brand */}
          <div className="flex items-center">
            <Link href="/" className="flex items-center group">
              <div className="flex-shrink-0 relative">
                <div className="absolute inset-0 bg-gradient-to-r from-sage-400 to-emerald-400 rounded-lg opacity-0 group-hover:opacity-20 blur transition-opacity"></div>
                <img
                  src="/images/unielect-logo.jpg"
                  alt="UniElect Logo"
                  className="h-9 w-9 rounded-lg object-cover shadow-sm"
                />
              </div>
              <div className="ml-3">
                <h1 className="text-xl font-semibold text-gray-900 dark:text-white tracking-tight">UniElect</h1>
                <p className="text-[10px] text-sage-600 dark:text-sage-400 font-medium">Secure Digital Voting</p>
              </div>
            </Link>
          </div>

          {/* Search bar - Center */}
          {isAuthenticated && (
            <div className="hidden md:flex flex-1 max-w-md mx-8">
              <form onSubmit={handleSearch} className="relative w-full">
                <div className={cn(
                  "relative flex items-center transition-all duration-200",
                  isSearchFocused && "scale-[1.02]"
                )}>
                  <Search className="absolute left-3 h-4 w-4 text-gray-400 dark:text-gray-500 pointer-events-none" />
                  <input
                    type="text"
                    placeholder="Search elections, candidates..."
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    onFocus={() => setIsSearchFocused(true)}
                    onBlur={() => setIsSearchFocused(false)}
                    className={cn(
                      "w-full pl-10 pr-4 py-2 text-sm rounded-xl",
                      "bg-sage-50/50 dark:bg-sage-900/30",
                      "border border-sage-200 dark:border-sage-700/50",
                      "placeholder:text-gray-400 dark:placeholder:text-gray-500",
                      "text-gray-900 dark:text-white",
                      "focus:outline-none focus:ring-2 focus:ring-sage-500/30 focus:border-sage-400 dark:focus:border-sage-500",
                      "transition-all duration-200"
                    )}
                  />
                </div>
              </form>
            </div>
          )}

          {/* Desktop navigation */}
          {isAuthenticated && (
            <nav className="hidden lg:flex items-center space-x-1">
              {navigation.map((item) => {
                if (!canAccessRoute(item.roles)) return null

                return (
                  <Link
                    key={item.name}
                    href={item.href}
                    className={cn(
                      "px-3 py-2 rounded-lg text-sm font-medium transition-all duration-200",
                      isCurrentPage(item.href)
                        ? "bg-gradient-to-r from-sage-100 to-emerald-100 dark:from-sage-900/50 dark:to-emerald-900/50 text-sage-700 dark:text-sage-300 shadow-sm"
                        : "text-gray-600 dark:text-gray-300 hover:text-gray-900 dark:hover:text-white hover:bg-sage-50 dark:hover:bg-sage-900/30"
                    )}
                  >
                    {item.name}
                  </Link>
                )
              })}
            </nav>
          )}

          {/* Right side - theme toggle, notifications, user menu */}
          <div className="flex items-center space-x-2">
            {/* Theme Selector Dropdown */}
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button
                  variant="ghost"
                  size="sm"
                  className="h-9 w-9 rounded-lg hover:bg-sage-100 dark:hover:bg-sage-900/50"
                >
                  {getThemeIcon()}
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end" className="w-36">
                <DropdownMenuItem onClick={() => setTheme('light')} className="flex items-center gap-2">
                  <Sun className="h-4 w-4" />
                  <span>Light</span>
                  {theme === 'light' && <span className="ml-auto text-sage-600">✓</span>}
                </DropdownMenuItem>
                <DropdownMenuItem onClick={() => setTheme('dark')} className="flex items-center gap-2">
                  <Moon className="h-4 w-4" />
                  <span>Dark</span>
                  {theme === 'dark' && <span className="ml-auto text-sage-600">✓</span>}
                </DropdownMenuItem>
                <DropdownMenuItem onClick={() => setTheme('system')} className="flex items-center gap-2">
                  <Monitor className="h-4 w-4" />
                  <span>System</span>
                  {theme === 'system' && <span className="ml-auto text-sage-600">✓</span>}
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>

            {isAuthenticated ? (
              <>
                {/* Notifications */}
                <NotificationBell />

                {/* User menu */}
                <DropdownMenu>
                  <DropdownMenuTrigger asChild>
                    <Button variant="ghost" className="relative h-9 w-9 rounded-lg hover:bg-sage-100 dark:hover:bg-sage-900/50">
                      <div className="relative h-8 w-8 rounded-lg bg-gradient-to-br from-sage-200 to-emerald-200 dark:from-sage-700 dark:to-emerald-700 flex items-center justify-center overflow-hidden">
                        {user?.profileImage ? (
                          <img
                            className="h-8 w-8 rounded-lg object-cover"
                            src={user.profileImage}
                            alt={`${user.firstName} ${user.lastName}`}
                          />
                        ) : (
                          <User className="h-4 w-4 text-sage-700 dark:text-sage-200" />
                        )}
                      </div>
                    </Button>
                  </DropdownMenuTrigger>
                  <DropdownMenuContent className="w-56" align="end" forceMount>
                    <DropdownMenuLabel className="font-normal">
                      <div className="flex flex-col space-y-1">
                        <p className="text-sm font-medium leading-none">
                          {user?.firstName} {user?.lastName}
                        </p>
                        <p className="text-xs leading-none text-muted-foreground">
                          {user?.email}
                        </p>
                        <div className="flex items-center gap-2 pt-1">
                          <Badge variant="secondary" className="text-xs bg-sage-100 dark:bg-sage-900 text-sage-700 dark:text-sage-300">
                            {user?.role.replace('_', ' ')}
                          </Badge>
                          {user?.isVerified && (
                            <Badge className="text-xs bg-emerald-100 dark:bg-emerald-900 text-emerald-700 dark:text-emerald-300">
                              Verified
                            </Badge>
                          )}
                        </div>
                      </div>
                    </DropdownMenuLabel>
                    <DropdownMenuSeparator />

                    {userNavigation.map((item) => (
                      <DropdownMenuItem key={item.name} asChild>
                        <Link href={item.href} className="flex items-center">
                          <item.icon className="mr-2 h-4 w-4" />
                          <span>{item.name}</span>
                        </Link>
                      </DropdownMenuItem>
                    ))}

                    {(user?.role === UserRole.ADMIN || user?.role === UserRole.SUPER_ADMIN) && (
                      <>
                        <DropdownMenuSeparator />
                        <DropdownMenuItem asChild>
                          <Link href="/admin" className="flex items-center">
                            <Shield className="mr-2 h-4 w-4" />
                            <span>Admin Panel</span>
                          </Link>
                        </DropdownMenuItem>
                        <DropdownMenuItem asChild>
                          <Link href="/admin/analytics" className="flex items-center">
                            <BarChart3 className="mr-2 h-4 w-4" />
                            <span>Analytics</span>
                          </Link>
                        </DropdownMenuItem>
                      </>
                    )}

                    <DropdownMenuSeparator />
                    <DropdownMenuItem
                      className="text-red-600 focus:text-red-600 focus:bg-red-50 dark:focus:bg-red-900/20"
                      onClick={handleLogout}
                    >
                      <LogOut className="mr-2 h-4 w-4" />
                      <span>Log out</span>
                    </DropdownMenuItem>
                  </DropdownMenuContent>
                </DropdownMenu>
              </>
            ) : (
              /* Auth buttons for non-authenticated users */
              <div className="flex items-center space-x-3">
                <Link href="/login">
                  <Button variant="ghost" size="sm" className="text-gray-600 dark:text-gray-300 hover:text-sage-700 dark:hover:text-sage-300">
                    Sign in
                  </Button>
                </Link>
                <Link href="/register">
                  <Button size="sm" className="bg-gradient-to-r from-sage-600 to-emerald-600 hover:from-sage-700 hover:to-emerald-700 text-white shadow-sm">
                    Register
                  </Button>
                </Link>
              </div>
            )}

            {/* Mobile menu button */}
            <div className="lg:hidden">
              <Button
                variant="ghost"
                size="sm"
                onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
                aria-label="Toggle mobile menu"
                className="h-9 w-9 rounded-lg"
              >
                {isMobileMenuOpen ? (
                  <X className="h-5 w-5" />
                ) : (
                  <Menu className="h-5 w-5" />
                )}
              </Button>
            </div>
          </div>
        </div>
      </div>

      {/* Mobile menu */}
      {isMobileMenuOpen && isAuthenticated && (
        <div className="lg:hidden bg-white/95 dark:bg-gray-900/95 backdrop-blur-xl border-t border-sage-200/50 dark:border-sage-800/50">
          {/* Mobile search */}
          <div className="px-4 py-3">
            <form onSubmit={handleSearch} className="relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
              <input
                type="text"
                placeholder="Search elections, candidates..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full pl-10 pr-4 py-2.5 text-sm rounded-xl bg-sage-50 dark:bg-sage-900/30 border border-sage-200 dark:border-sage-700/50 placeholder:text-gray-400 text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-sage-500/30"
              />
            </form>
          </div>

          <div className="px-3 pb-3 space-y-1">
            {navigation.map((item) => {
              if (!canAccessRoute(item.roles)) return null

              return (
                <Link
                  key={item.name}
                  href={item.href}
                  className={cn(
                    "block px-3 py-2.5 rounded-lg text-sm font-medium transition-colors",
                    isCurrentPage(item.href)
                      ? "bg-sage-100 dark:bg-sage-900/50 text-sage-700 dark:text-sage-300"
                      : "text-gray-600 dark:text-gray-300 hover:text-gray-900 dark:hover:text-white hover:bg-sage-50 dark:hover:bg-sage-900/30"
                  )}
                  onClick={() => setIsMobileMenuOpen(false)}
                >
                  {item.name}
                </Link>
              )
            })}
          </div>

          {/* Mobile user info */}
          <div className="pt-3 pb-4 border-t border-sage-200/50 dark:border-sage-800/50">
            <div className="flex items-center px-4">
              <div className="flex-shrink-0">
                <div className="h-10 w-10 rounded-lg bg-gradient-to-br from-sage-200 to-emerald-200 dark:from-sage-700 dark:to-emerald-700 flex items-center justify-center overflow-hidden">
                  {user?.profileImage ? (
                    <img
                      className="h-10 w-10 rounded-lg object-cover"
                      src={user.profileImage}
                      alt={`${user?.firstName} ${user?.lastName}`}
                    />
                  ) : (
                    <User className="h-5 w-5 text-sage-700 dark:text-sage-200" />
                  )}
                </div>
              </div>
              <div className="ml-3">
                <div className="text-sm font-medium text-gray-900 dark:text-white">
                  {user?.firstName} {user?.lastName}
                </div>
                <div className="text-xs text-gray-500 dark:text-gray-400">{user?.email}</div>
              </div>
            </div>
            <div className="mt-3 px-3 space-y-1">
              {userNavigation.map((item) => (
                <Link
                  key={item.name}
                  href={item.href}
                  className="block px-3 py-2.5 rounded-lg text-sm font-medium text-gray-600 dark:text-gray-300 hover:text-gray-900 dark:hover:text-white hover:bg-sage-50 dark:hover:bg-sage-900/30"
                  onClick={() => setIsMobileMenuOpen(false)}
                >
                  {item.name}
                </Link>
              ))}
              <button
                onClick={() => {
                  handleLogout()
                  setIsMobileMenuOpen(false)
                }}
                className="block w-full text-left px-3 py-2.5 rounded-lg text-sm font-medium text-red-600 hover:bg-red-50 dark:hover:bg-red-900/20"
              >
                Sign out
              </button>
            </div>
          </div>
        </div>
      )}
    </header>
  )
}

export default Header
