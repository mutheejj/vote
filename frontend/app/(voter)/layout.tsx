"use client"

import React, { useEffect, useState } from "react"
import { useRouter } from "next/navigation"
import { Header } from "@/components/shared/Header"
import { Sidebar } from "@/components/shared/Sidebar"
import { useAuth } from "@/lib/hooks/useAuth"

interface VoterLayoutProps {
  children: React.ReactNode
}

export default function VoterLayout({ children }: VoterLayoutProps) {
  const router = useRouter()
  const { user, isLoading, isAuthenticated } = useAuth({ autoInitialize: false })
  const [sidebarCollapsed, setSidebarCollapsed] = useState(false)

  useEffect(() => {
    if (!isLoading && !isAuthenticated) {
      router.push("/login")
    }
  }, [isLoading, isAuthenticated, router])

  if (isLoading || !user) {
    return (
      <div className="flex flex-col items-center justify-center min-h-screen bg-gradient-to-br from-sage-50 via-sage-50 to-emerald-50 dark:from-gray-900 dark:via-gray-900 dark:to-gray-800">
        <div className="relative">
          <div className="h-16 w-16 rounded-full border-4 border-sage-100 dark:border-sage-900"></div>
          <div className="absolute inset-0 h-16 w-16 animate-spin rounded-full border-4 border-t-sage-600 border-r-transparent border-b-transparent border-l-transparent"></div>
        </div>
      </div>
    )
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
          <div className="py-6 px-4 sm:px-6 lg:px-8">
            {children}
          </div>
        </main>
      </div>
    </div>
  )
}
