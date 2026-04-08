"use client"

import { useEffect } from "react"
import { useRouter } from "next/navigation"
import { useAuth } from "@/lib/hooks/useAuth"
import { UserRole } from "@/lib/enums"
import { LoadingSpinner } from "@/components/shared/LoadingSpinner"
import { Alert, AlertDescription } from "@/components/ui/alert"
import { Button } from "@/components/ui/button"
import { Shield, AlertTriangle, Lock, UserX } from "lucide-react"

interface AuthGuardProps {
  children: React.ReactNode
  requireRoles?: UserRole[]
  requireAuth?: boolean
  requireVerification?: boolean
  fallbackUrl?: string
  showMessage?: boolean
}

export function AuthGuard({
  children,
  requireRoles = [],
  requireAuth = true,
  requireVerification = false,
  fallbackUrl = "/login",
  showMessage = true,
}: AuthGuardProps) {
  const { user, isAuthenticated, isLoading, isVerified } = useAuth()
  const router = useRouter()

  useEffect(() => {
    if (!isLoading) {
      if (requireAuth && !isAuthenticated) {
        router.push(fallbackUrl)
        return
      }

      if (requireVerification && isAuthenticated && !isVerified) {
        router.push("/verify-email")
        return
      }

      if (
        requireRoles.length > 0 &&
        isAuthenticated &&
        user &&
        !requireRoles.includes(user.role)
      ) {
        router.push("/unauthorized")
        return
      }
    }
  }, [
    isLoading,
    isAuthenticated,
    isVerified,
    user,
    requireAuth,
    requireVerification,
    requireRoles,
    router,
    fallbackUrl,
  ])

  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-screen bg-gray-50">
        <div className="text-center">
          <LoadingSpinner size="lg" />
          <p className="mt-4 text-gray-600">Verifying authentication...</p>
        </div>
      </div>
    )
  }

  if (requireAuth && !isAuthenticated) {
    if (!showMessage) return null

    return (
      <div className="flex items-center justify-center min-h-screen bg-gray-50 px-4">
        <div className="max-w-md w-full">
          <div className="text-center mb-6">
            <div className="mx-auto h-12 w-12 bg-red-100 rounded-full flex items-center justify-center">
              <Lock className="h-6 w-6 text-red-600" />
            </div>
            <h2 className="mt-4 text-2xl font-bold text-gray-900">
              Authentication Required
            </h2>
            <p className="mt-2 text-gray-600">
              You need to sign in to access this page.
            </p>
          </div>

          <Alert className="mb-6">
            <AlertTriangle className="h-4 w-4" />
            <AlertDescription>
              Please log in with your UniElect credentials to continue.
            </AlertDescription>
          </Alert>

          <div className="space-y-3">
            <Button
              onClick={() => router.push("/login")}
              className="w-full"
            >
              Sign In
            </Button>
            <Button
              variant="outline"
              onClick={() => router.push("/register")}
              className="w-full"
            >
              Create Account
            </Button>
          </div>
        </div>
      </div>
    )
  }

  if (requireVerification && isAuthenticated && !isVerified) {
    if (!showMessage) return null

    return (
      <div className="flex items-center justify-center min-h-screen bg-gray-50 px-4">
        <div className="max-w-md w-full">
          <div className="text-center mb-6">
            <div className="mx-auto h-12 w-12 bg-amber-100 rounded-full flex items-center justify-center">
              <Shield className="h-6 w-6 text-amber-600" />
            </div>
            <h2 className="mt-4 text-2xl font-bold text-gray-900">
              Email Verification Required
            </h2>
            <p className="mt-2 text-gray-600">
              Please verify your email address to continue.
            </p>
          </div>

          <Alert className="mb-6">
            <Shield className="h-4 w-4" />
            <AlertDescription>
              We've sent a verification link to <strong>{user?.email}</strong>.
              Please check your inbox and click the link to verify your account.
            </AlertDescription>
          </Alert>

          <div className="space-y-3">
            <Button
              onClick={() => router.push("/verify-email")}
              className="w-full"
            >
              Go to Verification
            </Button>
            <Button
              variant="outline"
              onClick={() => router.push("/resend-verification")}
              className="w-full"
            >
              Resend Verification Email
            </Button>
          </div>
        </div>
      </div>
    )
  }

  if (
    requireRoles.length > 0 &&
    isAuthenticated &&
    user &&
    !requireRoles.includes(user.role)
  ) {
    if (!showMessage) return null

    return (
      <div className="flex items-center justify-center min-h-screen bg-gray-50 px-4">
        <div className="max-w-md w-full">
          <div className="text-center mb-6">
            <div className="mx-auto h-12 w-12 bg-red-100 rounded-full flex items-center justify-center">
              <UserX className="h-6 w-6 text-red-600" />
            </div>
            <h2 className="mt-4 text-2xl font-bold text-gray-900">
              Access Denied
            </h2>
            <p className="mt-2 text-gray-600">
              You don't have permission to access this page.
            </p>
          </div>

          <Alert variant="destructive" className="mb-6">
            <UserX className="h-4 w-4" />
            <AlertDescription>
              This page requires {requireRoles.map(role => role.replace('_', ' ')).join(' or ')} access.
              Your current role is: <strong>{user.role.replace('_', ' ')}</strong>
            </AlertDescription>
          </Alert>

          <div className="space-y-3">
            <Button
              onClick={() => router.push("/dashboard")}
              className="w-full"
            >
              Go to Dashboard
            </Button>
            <Button
              variant="outline"
              onClick={() => router.back()}
              className="w-full"
            >
              Go Back
            </Button>
          </div>
        </div>
      </div>
    )
  }

  return <>{children}</>
}

interface RoleGuardProps {
  children: React.ReactNode
  allowedRoles: UserRole[]
  fallback?: React.ReactNode
}

export function RoleGuard({ children, allowedRoles, fallback }: RoleGuardProps) {
  const { user, isAuthenticated } = useAuth()

  if (!isAuthenticated || !user || !allowedRoles.includes(user.role)) {
    if (fallback) return <>{fallback}</>
    return null
  }

  return <>{children}</>
}

interface ConditionalAuthProps {
  children: React.ReactNode
  when: 'authenticated' | 'unauthenticated'
  fallback?: React.ReactNode
}

export function ConditionalAuth({ children, when, fallback }: ConditionalAuthProps) {
  const { isAuthenticated, isLoading } = useAuth()

  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <LoadingSpinner size="lg" />
      </div>
    )
  }

  const shouldShow = when === 'authenticated' ? isAuthenticated : !isAuthenticated

  if (!shouldShow) {
    if (fallback) return <>{fallback}</>
    return null
  }

  return <>{children}</>
}

export default AuthGuard