"use client"

import React, { useState } from "react"
import { redirect } from "next/navigation"
import { Header } from "@/components/shared/Header"
import { Sidebar } from "@/components/shared/Sidebar"
import { useAuth } from "@/lib/hooks/useAuth"

interface AdminLayoutProps {
  children: React.ReactNode
}

export default function AdminLayout({ children }: AdminLayoutProps) {
  const { user, isLoading, isInitialized } = useAuth()
  const [sidebarCollapsed, setSidebarCollapsed] = useState(false)

  if (isLoading || !isInitialized) {
    return (
      <div className="flex items-center justify-center min-h-screen bg-gradient-to-br from-sage-50 via-sage-50 to-emerald-50 dark:from-gray-900 dark:via-gray-900 dark:to-gray-800">
        <div className="relative">
          <div className="h-16 w-16 rounded-full border-4 border-sage-100 dark:border-sage-900"></div>
          <div className="absolute inset-0 h-16 w-16 animate-spin rounded-full border-4 border-t-sage-600 border-r-transparent border-b-transparent border-l-transparent"></div>
        </div>
      </div>
    )
  }

  const ADMIN_ROLES = ["SUPER_ADMIN", "ADMIN", "MODERATOR"]
  if (!user || !ADMIN_ROLES.includes(user.role)) {
    redirect("/system/auth")
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-sage-50 via-sage-50 to-emerald-50 dark:from-gray-900 dark:via-gray-900 dark:to-gray-800 transition-colors">
      <Header />

      <div className="flex">
        <Sidebar
          isCollapsed={sidebarCollapsed}
          onToggleCollapse={() => setSidebarCollapsed(!sidebarCollapsed)}
        />

        <main className="flex-1 min-w-0">
          <div className="py-6 px-4 sm:px-6 lg:px-8 max-w-7xl mx-auto">
            {children}
          </div>
        </main>
      </div>
    </div>
  )
}
