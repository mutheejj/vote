"use client"

import React, { useEffect } from "react"
import Image from "next/image"
import { useRouter } from "next/navigation"
import { LoginForm } from "@/components/auth/LoginForm"
import { ConditionalAuth } from "@/components/auth/AuthGuard"
import { useAuth } from "@/lib/hooks/useAuth"
import { ThemeToggle } from "@/components/shared/ThemeToggle"

export default function LoginPage() {
  const router = useRouter()
  const { isAuthenticated, isLoading, user } = useAuth()

  useEffect(() => {
    if (!isLoading && isAuthenticated && user) {
      const redirectUrl =
        user.role === 'SUPER_ADMIN' || user.role === 'ADMIN' || user.role === 'MODERATOR'
          ? '/admin/dashboard'
          : '/dashboard'
      router.push(redirectUrl)
    }
  }, [isAuthenticated, isLoading, user, router])

  useEffect(() => {
    const handleKeyPress = (e: KeyboardEvent) => {
      if (e.ctrlKey && e.shiftKey && e.key === 'A') {
        e.preventDefault()
        router.push('/system/auth')
      }
    }
    window.addEventListener('keydown', handleKeyPress)
    return () => window.removeEventListener('keydown', handleKeyPress)
  }, [router])

  return (
    <ConditionalAuth when="unauthenticated" fallback={null}>
      <div className="min-h-screen relative flex items-center justify-center">
        {/* Background */}
        <div className="absolute inset-0">
          <Image
            src="/images/vote-illustration3.jpg"
            alt="Background"
            fill
            className="object-cover"
            priority
          />
          <div className="absolute inset-0 bg-gradient-to-br from-sage-900/90 via-emerald-900/85 to-green-900/90"></div>
        </div>

        {/* Theme Toggle */}
        <div className="absolute top-4 right-4 z-30">
          <ThemeToggle />
        </div>

        {/* Content */}
        <div className="relative z-10 w-full max-w-md mx-auto px-4 py-8">
          {/* Logo */}
          <div className="flex justify-center mb-6">
            <div className="flex items-center gap-3">
              <Image
                src="/images/unielect-logo.jpg"
                alt="UniElect"
                width={44}
                height={44}
                className="rounded-xl shadow-lg"
              />
              <div>
                <h2 className="text-xl font-bold text-white">UniElect</h2>
                <p className="text-sage-300 text-xs font-medium">Student Voting Portal</p>
              </div>
            </div>
          </div>

          {/* Form Card */}
          <div className="bg-white dark:bg-gray-900 rounded-2xl shadow-2xl p-6 sm:p-8">
            <LoginForm redirectTo="/dashboard" />
          </div>
        </div>
      </div>
    </ConditionalAuth>
  )
}
