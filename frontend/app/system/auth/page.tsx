"use client"

import React, { useEffect, useState } from "react"
import Image from "next/image"
import { useRouter, useSearchParams } from "next/navigation"
import { LoginForm } from "@/components/auth/LoginForm"
import { useAuth } from "@/lib/hooks/useAuth"
import { Shield, AlertTriangle } from "lucide-react"

export default function SystemAuthPage() {
  const router = useRouter()
  const searchParams = useSearchParams()
  const { isAuthenticated, isLoading, user } = useAuth()
  const [showAccessDenied, setShowAccessDenied] = useState(false)
  const [redirectCountdown, setRedirectCountdown] = useState(5)

  useEffect(() => {
    // If already authenticated, check their role
    if (!isLoading && isAuthenticated && user) {
      // If they're a regular voter, show access denied and redirect
      if (user.role === 'VOTER') {
        setShowAccessDenied(true)

        // Start countdown
        const countdownInterval = setInterval(() => {
          setRedirectCountdown((prev) => {
            if (prev <= 1) {
              clearInterval(countdownInterval)
              router.push('/login')
              return 0
            }
            return prev - 1
          })
        }, 1000)

        return () => clearInterval(countdownInterval)
      }

      // If they're an admin role, redirect to their dashboard
      if (user.role === 'SUPER_ADMIN' || user.role === 'ADMIN' || user.role === 'MODERATOR') {
        router.push('/admin/dashboard')
      }
    }
  }, [isAuthenticated, isLoading, user, router])

  // Show access denied message for non-admin authenticated users
  if (showAccessDenied) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-red-50 via-orange-50 to-pink-50">
        <div className="max-w-md w-full mx-4">
          <div className="bg-white/90 backdrop-blur-xl rounded-3xl shadow-2xl p-8 border border-red-200">
            <div className="flex justify-center mb-6">
              <div className="relative">
                <div className="absolute inset-0 bg-gradient-to-r from-red-500 to-orange-500 rounded-full opacity-20 blur-xl animate-pulse"></div>
                <div className="relative w-20 h-20 bg-gradient-to-br from-red-100 to-orange-100 rounded-full flex items-center justify-center">
                  <AlertTriangle className="w-10 h-10 text-red-600" />
                </div>
              </div>
            </div>

            <h1 className="text-3xl font-bold text-gray-900 text-center mb-3">
              Access Denied
            </h1>

            <p className="text-gray-600 text-center mb-6 leading-relaxed">
              You do not have permission to access this area. This page is restricted to system administrators only.
            </p>

            <div className="bg-gradient-to-r from-red-50 to-orange-50 border border-red-200 rounded-xl p-4 mb-6">
              <p className="text-sm text-red-800 text-center font-medium">
                Redirecting to student login in <span className="font-bold text-2xl text-red-600">{redirectCountdown}</span> seconds...
              </p>
            </div>

            <button
              onClick={() => router.push('/login')}
              className="w-full bg-gradient-to-r from-sage-600 to-emerald-600 hover:from-sage-700 hover:to-emerald-700 text-white font-semibold py-3 px-4 rounded-xl transition-all duration-200 shadow-lg shadow-sage-500/30"
            >
              Go to Student Login Now
            </button>
          </div>
        </div>
      </div>
    )
  }

  // Show the admin login form for unauthenticated users or admin-role users
  return (
    <div className="min-h-screen flex">
      {/* Left Side - Admin Auth Form */}
      <div className="flex-1 flex items-center justify-center bg-gradient-to-br from-sage-50 via-sage-50 to-emerald-50 py-12 px-4 sm:px-6 lg:px-8 relative overflow-hidden">
        {/* Background decoration */}
        <div className="absolute top-0 right-0 w-96 h-96 bg-gradient-to-bl from-sage-200/40 to-transparent rounded-full blur-3xl"></div>
        <div className="absolute bottom-0 left-0 w-96 h-96 bg-gradient-to-tr from-emerald-200/40 to-transparent rounded-full blur-3xl"></div>

        <div className="w-full max-w-md relative z-10">
          {/* Admin Badge & Header */}
          <div className="mb-10 text-center">
            <div className="inline-flex items-center gap-2 px-6 py-3 bg-gradient-to-r from-sage-100 to-emerald-100 border border-sage-200 rounded-full mb-6 shadow-lg">
              <Shield className="w-6 h-6 text-sage-600" />
              <span className="bg-gradient-to-r from-sage-700 to-emerald-700 bg-clip-text text-transparent font-bold text-base">Administrator Access</span>
            </div>

            <h2 className="text-4xl font-bold text-gray-900 mb-3">
              Admin Portal
            </h2>
            <p className="text-gray-600 text-lg">
              Secure access to system administration
            </p>
          </div>

          {/* Login Form */}
          <LoginForm redirectTo="/admin/dashboard" isAdminLogin />

          {/* Warning notice */}
          <div className="mt-8 text-center">
            <div className="inline-flex items-center gap-2 px-5 py-2.5 bg-white/60 backdrop-blur-sm rounded-full border border-sage-200 shadow-sm">
              <Shield className="h-4 w-4 text-sage-600" />
              <p className="text-xs text-gray-600 font-medium">
                Restricted area • All access attempts are logged
              </p>
            </div>
          </div>
        </div>
      </div>

      {/* Right Side - Banner with Background Image */}
      <div className="hidden lg:flex lg:flex-1 relative overflow-hidden">
        {/* Background Image */}
        <div className="absolute inset-0">
          <Image
            src="/images/vote-illustration1.jpg"
            alt="Election administration"
            fill
            className="object-cover"
          />
          {/* Gradient overlay for better text readability */}
          <div className="absolute inset-0 bg-gradient-to-br from-sage-900/95 via-sage-900/90 to-emerald-900/85"></div>
        </div>

        {/* Content Overlay */}
        <div className="relative z-10 flex items-center justify-center p-12 w-full">
          <div className="max-w-2xl">
            {/* UniElect Logo in Banner */}
            <div className="flex items-center gap-3 mb-8 group">
              <div className="relative">
                <div className="absolute inset-0 bg-gradient-to-r from-sage-400 to-emerald-400 rounded-xl opacity-30 blur-xl group-hover:opacity-40 transition-opacity"></div>
                <Image
                  src="/images/unielect-logo.jpg"
                  alt="UniElect"
                  width={64}
                  height={64}
                  className="rounded-xl shadow-2xl relative"
                />
              </div>
              <div>
                <h2 className="text-3xl font-bold text-white">UniElect</h2>
                <p className="text-emerald-300 text-sm font-semibold">Administration Panel</p>
              </div>
            </div>

            <h3 className="text-5xl font-bold text-white mb-4 leading-tight">
              System Administration
            </h3>
            <p className="text-xl text-gray-100 mb-8 leading-relaxed">
              Manage elections, oversee voting processes, and maintain the integrity
              of campus democracy through our secure administrative platform.
            </p>

            {/* Admin Features */}
            <div className="space-y-4 bg-white/10 backdrop-blur-xl rounded-2xl p-6 border border-white/20 shadow-2xl">
              <h4 className="text-lg font-semibold text-emerald-300 mb-4">Administrator Capabilities</h4>

              <div className="flex items-start gap-3 text-gray-50">
                <div className="w-2 h-2 bg-gradient-to-r from-sage-400 to-emerald-400 rounded-full mt-2 flex-shrink-0 shadow-lg shadow-sage-500/50"></div>
                <div>
                  <p className="font-semibold">Election Management</p>
                  <p className="text-sm text-gray-200">Create, configure, and publish elections with full control</p>
                </div>
              </div>

              <div className="flex items-start gap-3 text-gray-50">
                <div className="w-2 h-2 bg-gradient-to-r from-sage-400 to-emerald-400 rounded-full mt-2 flex-shrink-0 shadow-lg shadow-sage-500/50"></div>
                <div>
                  <p className="font-semibold">Voter & Candidate Administration</p>
                  <p className="text-sm text-gray-200">Manage user registrations, approvals, and eligibility</p>
                </div>
              </div>

              <div className="flex items-start gap-3 text-gray-50">
                <div className="w-2 h-2 bg-gradient-to-r from-sage-400 to-emerald-400 rounded-full mt-2 flex-shrink-0 shadow-lg shadow-sage-500/50"></div>
                <div>
                  <p className="font-semibold">Real-time Monitoring</p>
                  <p className="text-sm text-gray-200">Track voting progress, participation rates, and system health</p>
                </div>
              </div>

              <div className="flex items-start gap-3 text-gray-50">
                <div className="w-2 h-2 bg-gradient-to-r from-sage-400 to-emerald-400 rounded-full mt-2 flex-shrink-0 shadow-lg shadow-sage-500/50"></div>
                <div>
                  <p className="font-semibold">Audit & Security</p>
                  <p className="text-sm text-gray-200">Comprehensive audit trails and security monitoring</p>
                </div>
              </div>

              <div className="flex items-start gap-3 text-gray-50">
                <div className="w-2 h-2 bg-gradient-to-r from-sage-400 to-emerald-400 rounded-full mt-2 flex-shrink-0 shadow-lg shadow-sage-500/50"></div>
                <div>
                  <p className="font-semibold">Results & Analytics</p>
                  <p className="text-sm text-gray-200">Generate reports, export data, and publish official results</p>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
