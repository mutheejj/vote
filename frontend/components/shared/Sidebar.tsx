"use client"

import React, { useState } from "react"
import Link from "next/link"
import { usePathname } from "next/navigation"
import {
  LayoutDashboard,
  Vote,
  Users,
  BarChart3,
  Settings,
  FileText,
  Shield,
  HelpCircle,
  ChevronLeft,
  ChevronRight,
  LogOut,
  User,
  Activity,
  ClipboardList,
  UserCheck,
  Mail,
  Database,
  History,
} from "lucide-react"
import { useAuth } from "@/lib/hooks/useAuth"
import { UserRole } from "@/lib/enums"
import { cn } from "@/lib/utils/cn"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"

interface SidebarProps {
  className?: string
  isCollapsed?: boolean
  onToggleCollapse?: () => void
}

interface NavigationItem {
  name: string
  href: string
  icon: React.ComponentType<{ className?: string }>
  roles: UserRole[]
  badge?: string | number
  children?: NavigationItem[]
}

export function Sidebar({ className, isCollapsed = false, onToggleCollapse }: SidebarProps) {
  const { user, logout } = useAuth()
  const pathname = usePathname()
  const [expandedItems, setExpandedItems] = useState<string[]>([])

  const toggleExpanded = (itemName: string) => {
    setExpandedItems(prev =>
      prev.includes(itemName)
        ? prev.filter(name => name !== itemName)
        : [...prev, itemName]
    )
  }

  const isCurrentPage = (href: string) => pathname?.startsWith(href)
  const canAccessRoute = (roles: UserRole[]) => user && roles.includes(user.role)

  // Navigation items based on user role
  const navigationItems: NavigationItem[] = [
    {
      name: "Dashboard",
      href: "/dashboard",
      icon: LayoutDashboard,
      roles: [UserRole.VOTER, UserRole.ADMIN, UserRole.MODERATOR, UserRole.SUPER_ADMIN],
    },
    {
      name: "Elections",
      href: "/elections",
      icon: Vote,
      roles: [UserRole.VOTER, UserRole.ADMIN, UserRole.MODERATOR, UserRole.SUPER_ADMIN],
    },
    {
      name: "Results",
      href: "/results",
      icon: BarChart3,
      roles: [UserRole.VOTER, UserRole.ADMIN, UserRole.MODERATOR, UserRole.SUPER_ADMIN],
    },
    {
      name: "Voting History",
      href: "/history",
      icon: History,
      roles: [UserRole.VOTER, UserRole.ADMIN, UserRole.MODERATOR, UserRole.SUPER_ADMIN],
    },
    {
      name: "My Profile",
      href: "/profile",
      icon: User,
      roles: [UserRole.VOTER, UserRole.ADMIN, UserRole.MODERATOR, UserRole.SUPER_ADMIN],
    },

    // Admin-specific navigation
    {
      name: "Administration",
      href: "/admin",
      icon: Shield,
      roles: [UserRole.ADMIN, UserRole.MODERATOR, UserRole.SUPER_ADMIN],
      children: [
        {
          name: "Overview",
          href: "/admin/dashboard",
          icon: LayoutDashboard,
          roles: [UserRole.ADMIN, UserRole.MODERATOR, UserRole.SUPER_ADMIN],
        },
        {
          name: "Elections",
          href: "/admin/elections",
          icon: Vote,
          roles: [UserRole.ADMIN, UserRole.MODERATOR, UserRole.SUPER_ADMIN],
        },
        {
          name: "Applications",
          href: "/admin/applications",
          icon: ClipboardList,
          roles: [UserRole.ADMIN, UserRole.MODERATOR, UserRole.SUPER_ADMIN],
        },
        {
          name: "Candidates",
          href: "/admin/candidates",
          icon: UserCheck,
          roles: [UserRole.ADMIN, UserRole.MODERATOR, UserRole.SUPER_ADMIN],
        },
        {
          name: "Voters",
          href: "/admin/voters",
          icon: Users,
          roles: [UserRole.ADMIN, UserRole.MODERATOR, UserRole.SUPER_ADMIN],
        },
        {
          name: "Results",
          href: "/admin/results",
          icon: BarChart3,
          roles: [UserRole.ADMIN, UserRole.MODERATOR, UserRole.SUPER_ADMIN],
        },
        {
          name: "Reports",
          href: "/admin/reports",
          icon: FileText,
          roles: [UserRole.ADMIN, UserRole.SUPER_ADMIN],
        },
        {
          name: "Audit Logs",
          href: "/admin/audit",
          icon: Activity,
          roles: [UserRole.ADMIN, UserRole.SUPER_ADMIN],
        },
        {
          name: "Invitations",
          href: "/admin/invitations",
          icon: Mail,
          roles: [UserRole.ADMIN, UserRole.SUPER_ADMIN],
        },
        {
          name: "Admin Users",
          href: "/admin/users",
          icon: Shield,
          roles: [UserRole.SUPER_ADMIN],
        },
        {
          name: "Backup",
          href: "/admin/backup",
          icon: Database,
          roles: [UserRole.SUPER_ADMIN],
        },
        {
          name: "Settings",
          href: "/admin/settings",
          icon: Settings,
          roles: [UserRole.SUPER_ADMIN],
        },
      ],
    },

    // Candidate-specific navigation
    ...(user?.role === UserRole.VOTER ? [{
      name: "My Applications",
      href: "/candidate",
      icon: FileText,
      roles: [UserRole.VOTER] as UserRole[],
    }] : []),

    // Common items
    {
      name: "Help & Support",
      href: "/help",
      icon: HelpCircle,
      roles: [UserRole.VOTER, UserRole.ADMIN, UserRole.MODERATOR, UserRole.SUPER_ADMIN],
    },
  ]

  const renderNavigationItem = (item: NavigationItem, depth = 0) => {
    if (!canAccessRoute(item.roles)) return null

    const isActive = isCurrentPage(item.href)
    const hasChildren = item.children && item.children.length > 0
    const isExpanded = expandedItems.includes(item.name)

    return (
      <div key={item.name}>
        <div className={cn(
          "group relative",
          depth > 0 && "ml-3"
        )}>
          <Link
            href={hasChildren ? "#" : item.href}
            onClick={hasChildren ? (e) => {
              e.preventDefault()
              toggleExpanded(item.name)
            } : undefined}
            className={cn(
              "flex items-center w-full px-3 py-2 text-sm font-medium rounded-xl transition-all duration-200",
              isActive
                ? "bg-gradient-to-r from-sage-100 to-emerald-100 dark:from-sage-900/60 dark:to-emerald-900/60 text-sage-800 dark:text-sage-200 shadow-sm"
                : "text-gray-600 dark:text-gray-400 hover:bg-sage-50 dark:hover:bg-sage-900/40 hover:text-sage-700 dark:hover:text-sage-300",
              isCollapsed && "justify-center px-2"
            )}
          >
            <item.icon className={cn(
              "flex-shrink-0 transition-colors",
              isCollapsed ? "h-5 w-5" : "h-4 w-4 mr-3",
              isActive ? "text-sage-600 dark:text-sage-400" : "text-gray-400 dark:text-gray-500 group-hover:text-sage-500 dark:group-hover:text-sage-400"
            )} />

            {!isCollapsed && (
              <>
                <span className="flex-1 text-left truncate">{item.name}</span>
                {item.badge && (
                  <Badge variant="secondary" className="ml-2 text-[10px] h-5 px-2 bg-sage-100 dark:bg-sage-900 text-sage-700 dark:text-sage-300">
                    {item.badge}
                  </Badge>
                )}
                {hasChildren && (
                  <ChevronRight className={cn(
                    "h-4 w-4 transition-transform duration-200 text-gray-400 dark:text-gray-500",
                    isExpanded && "rotate-90"
                  )} />
                )}
              </>
            )}
          </Link>

          {/* Tooltip for collapsed state */}
          {isCollapsed && (
            <div className="absolute left-full ml-3 px-3 py-1.5 text-xs font-medium text-white bg-gray-900 dark:bg-gray-700 rounded-lg opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none z-50 whitespace-nowrap shadow-lg">
              {item.name}
              <div className="absolute top-1/2 -left-1 -translate-y-1/2 w-2 h-2 bg-gray-900 dark:bg-gray-700 rotate-45"></div>
            </div>
          )}
        </div>

        {/* Children */}
        {hasChildren && isExpanded && !isCollapsed && (
          <div className="mt-1 ml-2 pl-3 border-l-2 border-sage-200 dark:border-sage-800 space-y-1">
            {item.children?.map(child => renderNavigationItem(child, depth + 1))}
          </div>
        )}
      </div>
    )
  }

  return (
    <div className={cn(
      "hidden md:flex flex-col sticky top-16 h-[calc(100vh-4rem)] bg-white/80 dark:bg-gray-900/80 backdrop-blur-xl border-r border-sage-200/50 dark:border-sage-800/50 transition-all duration-300",
      isCollapsed ? "w-[72px]" : "w-64",
      className
    )}>
      {/* Header */}
      <div className="flex items-center justify-between px-4 py-3 border-b border-sage-200/50 dark:border-sage-800/50">
        {!isCollapsed ? (
          <Link href="/" className="flex items-center space-x-3 group">
            <div className="relative">
              <div className="absolute inset-0 bg-gradient-to-r from-sage-400 to-emerald-400 rounded-xl opacity-0 group-hover:opacity-20 blur transition-opacity"></div>
              <img
                src="/images/unielect-logo.jpg"
                alt="UniElect Logo"
                className="h-9 w-9 rounded-xl object-cover shadow-sm relative"
              />
            </div>
            <span className="text-lg font-semibold text-gray-900 dark:text-white tracking-tight">
              UniElect
            </span>
          </Link>
        ) : (
          <Link href="/" className="mx-auto group relative">
            <div className="absolute inset-0 bg-gradient-to-r from-sage-400 to-emerald-400 rounded-xl opacity-0 group-hover:opacity-20 blur transition-opacity"></div>
            <img
              src="/images/unielect-logo.jpg"
              alt="UniElect Logo"
              className="h-9 w-9 rounded-xl object-cover shadow-sm relative"
            />
          </Link>
        )}

        {onToggleCollapse && !isCollapsed && (
          <Button
            variant="ghost"
            size="sm"
            onClick={onToggleCollapse}
            className="h-8 w-8 rounded-lg hover:bg-sage-100 dark:hover:bg-sage-900/50"
          >
            <ChevronLeft className="h-4 w-4 text-gray-500" />
          </Button>
        )}
      </div>

      {/* Collapse toggle for collapsed state */}
      {onToggleCollapse && isCollapsed && (
        <div className="flex justify-center py-2 border-b border-sage-200/50 dark:border-sage-800/50">
          <Button
            variant="ghost"
            size="sm"
            onClick={onToggleCollapse}
            className="h-8 w-8 rounded-lg hover:bg-sage-100 dark:hover:bg-sage-900/50"
          >
            <ChevronRight className="h-4 w-4 text-gray-500" />
          </Button>
        </div>
      )}

      {/* User info */}
      {!isCollapsed && user && (
        <div className="px-4 py-4 border-b border-sage-200/50 dark:border-sage-800/50">
          <div className="flex items-center">
            <div className="h-10 w-10 rounded-xl bg-gradient-to-br from-sage-200 to-emerald-200 dark:from-sage-700 dark:to-emerald-700 flex items-center justify-center flex-shrink-0 overflow-hidden shadow-sm">
              {user.profileImage ? (
                <img
                  src={user.profileImage}
                  alt={`${user.firstName} ${user.lastName}`}
                  className="h-10 w-10 rounded-xl object-cover"
                />
              ) : (
                <User className="h-5 w-5 text-sage-700 dark:text-sage-200" />
              )}
            </div>
            <div className="ml-3 flex-1 min-w-0">
              <p className="text-sm font-medium text-gray-900 dark:text-white truncate">
                {user.firstName} {user.lastName}
              </p>
              <p className="text-xs text-sage-600 dark:text-sage-400 truncate">
                {user.role.replace('_', ' ')}
              </p>
            </div>
          </div>
        </div>
      )}

      {/* Navigation */}
      <div className="flex-1 overflow-y-auto px-3 py-4">
        <nav className="space-y-1">
          {navigationItems.map(item => renderNavigationItem(item))}
        </nav>
      </div>

      {/* Footer actions */}
      <div className="border-t border-sage-200/50 dark:border-sage-800/50 px-3 py-3">
        <div className="space-y-1">
          <Link
            href="/settings"
            className={cn(
              "flex items-center w-full px-3 py-2 text-sm font-medium text-gray-600 dark:text-gray-400 rounded-xl hover:bg-sage-50 dark:hover:bg-sage-900/40 hover:text-sage-700 dark:hover:text-sage-300 transition-colors",
              isCollapsed && "justify-center px-2"
            )}
          >
            <Settings className={cn(
              "flex-shrink-0 text-gray-400 dark:text-gray-500",
              isCollapsed ? "h-5 w-5" : "h-4 w-4 mr-3"
            )} />
            {!isCollapsed && <span>Settings</span>}
          </Link>

          <Button
            variant="ghost"
            onClick={logout}
            className={cn(
              "w-full justify-start text-sm font-medium text-red-600 dark:text-red-400 hover:text-red-700 dark:hover:text-red-300 hover:bg-red-50 dark:hover:bg-red-900/20 rounded-xl",
              isCollapsed && "justify-center px-2"
            )}
          >
            <LogOut className={cn(
              "flex-shrink-0",
              isCollapsed ? "h-5 w-5" : "h-4 w-4 mr-3"
            )} />
            {!isCollapsed && <span>Sign out</span>}
          </Button>
        </div>
      </div>
    </div>
  )
}

export default Sidebar
