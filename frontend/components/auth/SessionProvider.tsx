"use client"

import React, { useEffect } from "react"
import { useAuthStore } from "@/lib/stores/authStore"

/**
 * SessionProvider - Global auth state initializer
 * Delegates to authStore for all auth operations
 */

interface SessionProviderProps {
  children: React.ReactNode
}

export function SessionProvider({ children }: SessionProviderProps) {
  const initialize = useAuthStore(state => state.initialize)

  useEffect(() => {
    // Initialize auth once globally when the app starts
    initialize().catch(err => console.error('Failed to initialize auth:', err))
  }, []) // Empty dependency array - only run once on mount

  return <>{children}</>
}

export default SessionProvider
