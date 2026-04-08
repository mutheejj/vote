"use client"

import React, { useState } from "react"
import Link from "next/link"
import { useRouter } from "next/navigation"
import { useForm } from "react-hook-form"
import { zodResolver } from "@hookform/resolvers/zod"
import { Eye, EyeOff, Mail, Lock, Shield, ArrowRight } from "lucide-react"
import { useAuth } from "@/lib/hooks/useAuth"
import { loginSchema, type LoginFormData } from "@/lib/utils/validators"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Alert, AlertDescription } from "@/components/ui/alert"
import { Checkbox } from "@/components/ui/checkbox"
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form"
import { LoadingSpinner } from "@/components/shared/LoadingSpinner"
import { LoadingOverlay } from "@/components/shared/LoadingOverlay"
import { cn } from "@/lib/utils/cn"

interface LoginFormProps {
  className?: string
  redirectTo?: string
  onSuccess?: () => void
  isAdminLogin?: boolean
}

export function LoginForm({ className, redirectTo = "/dashboard", onSuccess, isAdminLogin = false }: LoginFormProps) {
  const [showPassword, setShowPassword] = useState(false)
  const [rememberMe, setRememberMe] = useState(false)
  const [requires2FA, setRequires2FA] = useState(false)
  const [loginError, setLoginError] = useState("")
  const [isLoading, setIsLoading] = useState(false)
  const [isNavigating, setIsNavigating] = useState(false)

  const { login } = useAuth()
  const router = useRouter()

  const form = useForm<LoginFormData>({
    resolver: zodResolver(loginSchema),
    defaultValues: {
      identifier: "",
      password: "",
      twoFactorCode: "",
    },
  })

  const onSubmit = async (data: LoginFormData) => {
    setIsLoading(true)
    setLoginError("")

    try {
      await login({
        identifier: data.identifier,
        password: data.password,
        twoFactorCode: data.twoFactorCode
      })

      setIsNavigating(true)

      if (onSuccess) {
        onSuccess()
      } else {
        const { useAuthStore } = await import('@/lib/stores/authStore')
        const updatedUser = useAuthStore.getState().user
        const userRole = updatedUser?.role
        let redirectUrl = redirectTo

        if (userRole === 'SUPER_ADMIN' || userRole === 'ADMIN' || userRole === 'MODERATOR') {
          redirectUrl = '/admin/dashboard'
        } else {
          redirectUrl = '/dashboard'
        }

        router.push(redirectUrl)
      }
    } catch (error: any) {
      if (error.message?.includes('2FA') || error.code === 'REQUIRES_2FA') {
        setRequires2FA(true)
        setIsLoading(false)
        return
      }

      setLoginError(error.message || "Login failed. Please try again.")
      setRequires2FA(false)
      setIsLoading(false)
    }
  }

  const handleBackToLogin = () => {
    setRequires2FA(false)
    form.setValue("twoFactorCode", "")
    setLoginError("")
  }

  return (
    <>
      {isNavigating && <LoadingOverlay message="Redirecting to dashboard..." />}

      <div className={cn("w-full", className)}>
        {/* Header */}
        <div className="text-center mb-8">
          <h1 className="text-2xl font-bold text-gray-900 dark:text-white mb-2">
            {requires2FA ? "Two-Factor Authentication" : "Welcome back"}
          </h1>
          <p className="text-gray-600 dark:text-gray-400 text-sm">
            {requires2FA
              ? "Enter the verification code from your authenticator app"
              : isAdminLogin
              ? "Sign in to administrator dashboard"
              : "Sign in to your UniElect voting account"
            }
          </p>
        </div>

        {loginError && (
          <Alert variant="destructive" className="mb-6">
            <AlertDescription>{loginError}</AlertDescription>
          </Alert>
        )}

        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-5">
            {!requires2FA ? (
              <>
                <FormField
                  control={form.control}
                  name="identifier"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel className="text-gray-700 dark:text-gray-300">Email or Student ID</FormLabel>
                      <FormControl>
                        <div className="relative">
                          <Mail className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-4 w-4" />
                          <Input
                            {...field}
                            type="text"
                            placeholder="Enter your email or student ID"
                            className="pl-10 h-11 bg-white dark:bg-gray-800 border-gray-200 dark:border-gray-700"
                            autoComplete="email"
                            disabled={isLoading}
                          />
                        </div>
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={form.control}
                  name="password"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel className="text-gray-700 dark:text-gray-300">Password</FormLabel>
                      <FormControl>
                        <div className="relative">
                          <Lock className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-4 w-4" />
                          <Input
                            {...field}
                            type={showPassword ? "text" : "password"}
                            placeholder="Enter your password"
                            className="pl-10 pr-10 h-11 bg-white dark:bg-gray-800 border-gray-200 dark:border-gray-700"
                            autoComplete="current-password"
                            disabled={isLoading}
                          />
                          <Button
                            type="button"
                            variant="ghost"
                            size="sm"
                            className="absolute right-0 top-0 h-full px-3 py-2 hover:bg-transparent"
                            onClick={() => setShowPassword(!showPassword)}
                            disabled={isLoading}
                          >
                            {showPassword ? (
                              <EyeOff className="h-4 w-4 text-gray-400" />
                            ) : (
                              <Eye className="h-4 w-4 text-gray-400" />
                            )}
                          </Button>
                        </div>
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <div className="flex items-center justify-between">
                  <div className="flex items-center space-x-2">
                    <Checkbox
                      id="remember"
                      checked={rememberMe}
                      onCheckedChange={(checked) => setRememberMe(checked === true)}
                      disabled={isLoading}
                    />
                    <Label htmlFor="remember" className="text-sm font-medium text-gray-600 dark:text-gray-400">
                      Remember me
                    </Label>
                  </div>
                  <Link
                    href="/forgot-password"
                    className="text-sm text-sage-600 dark:text-sage-400 hover:text-sage-700 dark:hover:text-sage-300 font-medium"
                  >
                    Forgot password?
                  </Link>
                </div>
              </>
            ) : (
              <FormField
                control={form.control}
                name="twoFactorCode"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel className="text-gray-700 dark:text-gray-300">Verification Code</FormLabel>
                    <FormControl>
                      <div className="relative">
                        <Shield className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-4 w-4" />
                        <Input
                          {...field}
                          type="text"
                          placeholder="Enter 6-digit code"
                          className="pl-10 text-center text-lg tracking-widest h-12 bg-white dark:bg-gray-800"
                          maxLength={6}
                          autoComplete="one-time-code"
                          disabled={isLoading}
                        />
                      </div>
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
            )}

            <div className="space-y-3 pt-2">
              <Button
                type="submit"
                className="w-full h-11 bg-gradient-to-r from-sage-600 to-emerald-600 hover:from-sage-700 hover:to-emerald-700 text-white font-semibold shadow-lg shadow-sage-500/20"
                disabled={isLoading}
              >
                {isLoading ? (
                  <LoadingSpinner size="sm" className="mr-2" />
                ) : requires2FA ? (
                  <>
                    Verify Code
                    <ArrowRight className="ml-2 h-4 w-4" />
                  </>
                ) : (
                  <>
                    Sign In
                    <ArrowRight className="ml-2 h-4 w-4" />
                  </>
                )}
              </Button>

              {requires2FA && (
                <Button
                  type="button"
                  variant="outline"
                  className="w-full h-11 border-sage-200 dark:border-sage-800 text-sage-700 dark:text-sage-300 hover:bg-sage-50 dark:hover:bg-sage-900/20"
                  onClick={handleBackToLogin}
                  disabled={isLoading}
                >
                  Back to Login
                </Button>
              )}
            </div>
          </form>
        </Form>

        {!requires2FA && !isAdminLogin && (
          <div className="mt-6 text-center">
            <p className="text-sm text-gray-600 dark:text-gray-400">
              Don't have an account?{" "}
              <Link
                href="/register"
                className="font-semibold text-sage-600 dark:text-sage-400 hover:text-sage-700 dark:hover:text-sage-300"
              >
                Create one here
              </Link>
            </p>
          </div>
        )}

        <div className="mt-6 pt-6 border-t border-gray-200 dark:border-gray-700">
          <div className="flex items-center justify-center space-x-2 text-xs text-gray-500 dark:text-gray-400">
            <Shield className="h-3.5 w-3.5 text-sage-600 dark:text-sage-400" />
            <span>Secured by UniElect Authentication</span>
          </div>
        </div>
      </div>
    </>
  )
}

export default LoginForm
