"use client"

import React, { useState, useEffect } from "react"
import Link from "next/link"
import { useRouter } from "next/navigation"
import { useForm } from "react-hook-form"
import { zodResolver } from "@hookform/resolvers/zod"
import { z } from "zod"
import { Mail, CheckCircle, AlertCircle, Loader2, Shield, RefreshCw } from "lucide-react"
import { verifyEmail, resendVerificationEmail } from "@/lib/api/auth"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Alert, AlertDescription } from "@/components/ui/alert"
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
  FormDescription,
} from "@/components/ui/form"
import { LoadingSpinner } from "@/components/shared/LoadingSpinner"
import { cn } from "@/lib/utils/cn"

const verificationSchema = z.object({
  token: z.string().min(1, "Verification code is required"),
})

type VerificationFormData = z.infer<typeof verificationSchema>

interface VerifyEmailFormProps {
  className?: string
  initialToken?: string | null
}

export function VerifyEmailForm({ className, initialToken }: VerifyEmailFormProps) {
  const [isLoading, setIsLoading] = useState(false)
  const [isResending, setIsResending] = useState(false)
  const [verificationStatus, setVerificationStatus] = useState<'idle' | 'success' | 'error'>('idle')
  const [errorMessage, setErrorMessage] = useState("")
  const [successMessage, setSuccessMessage] = useState("")
  const [showManualEntry, setShowManualEntry] = useState(!initialToken)
  const [resendEmail, setResendEmail] = useState("")
  const [showResendForm, setShowResendForm] = useState(false)

  const router = useRouter()

  const form = useForm<VerificationFormData>({
    resolver: zodResolver(verificationSchema),
    defaultValues: {
      token: initialToken || "",
    },
  })

  // Auto-verify if token is provided in URL
  useEffect(() => {
    if (initialToken && verificationStatus === 'idle') {
      handleVerification(initialToken)
    }
  }, [initialToken])

  const handleVerification = async (token: string) => {
    console.log('[VerifyEmailForm] handleVerification called with token:', token)
    setIsLoading(true)
    setErrorMessage("")
    setSuccessMessage("")

    try {
      console.log('[VerifyEmailForm] Calling verifyEmail API...')
      const response = await verifyEmail({ token })
      console.log('[VerifyEmailForm] API response:', response.data)

      if (response.data.success) {
        console.log('[VerifyEmailForm] Verification successful!')
        setVerificationStatus('success')
        setSuccessMessage(response.data.data?.message || "Email verified successfully! Redirecting to login...")

        // Redirect to login after 3 seconds
        setTimeout(() => {
          console.log('[VerifyEmailForm] Redirecting to login...')
          router.push('/login')
        }, 3000)
      } else {
        console.error('[VerifyEmailForm] Verification failed:', response.data.error)
        setVerificationStatus('error')
        setErrorMessage(response.data.error || "Verification failed. Please try again.")
      }
    } catch (error: any) {
      console.error('[VerifyEmailForm] Verification error:', error)
      console.error('[VerifyEmailForm] Error response:', error.response?.data)
      setVerificationStatus('error')

      // Ensure we always set a string error message
      let errorMsg = "Verification failed. The link may have expired or is invalid."
      if (error.response?.data?.error) {
        errorMsg = String(error.response.data.error)
      } else if (error.response?.data?.message) {
        errorMsg = String(error.response.data.message)
      } else if (error.message) {
        errorMsg = String(error.message)
      }

      setErrorMessage(errorMsg)
      console.log('[VerifyEmailForm] Error message set to:', errorMsg)
    } finally {
      setIsLoading(false)
      console.log('[VerifyEmailForm] Verification complete, isLoading set to false')
    }
  }

  const onSubmit = async (data: VerificationFormData) => {
    console.log('[VerifyEmailForm] Form submitted with token:', data.token)
    try {
      await handleVerification(data.token)
    } catch (error) {
      console.error('[VerifyEmailForm] Submission error:', error)
    }
  }

  const handleResendVerification = async () => {
    if (!resendEmail) {
      setErrorMessage("Please enter your email address")
      return
    }

    setIsResending(true)
    setErrorMessage("")
    setSuccessMessage("")

    try {
      const response = await resendVerificationEmail({ email: resendEmail })

      if (response.data.success) {
        setSuccessMessage("Verification email sent! Please check your inbox.")
        setShowResendForm(false)
        setResendEmail("")
      } else {
        setErrorMessage(response.data.error || "Failed to resend verification email.")
      }
    } catch (error: any) {
      setErrorMessage(
        error.response?.data?.error ||
        error.message ||
        "Failed to resend verification email. Please try again."
      )
    } finally {
      setIsResending(false)
    }
  }

  if (verificationStatus === 'success') {
    return (
      <div className={cn("w-full max-w-md mx-auto", className)}>
        <div className="text-center mb-8">
          <div className="mx-auto mb-4">
            <img
              src="/images/unielect-logo.jpg"
              alt="UniElect Logo"
              className="h-16 w-16 mx-auto rounded-lg object-cover mb-2"
            />
          </div>
          <div className="mx-auto h-16 w-16 bg-green-100 rounded-full flex items-center justify-center mb-4">
            <CheckCircle className="h-10 w-10 text-green-600" />
          </div>
          <h1 className="text-2xl font-bold text-gray-900 mb-2">
            Email Verified Successfully!
          </h1>
          <p className="text-gray-600">
            Your account is now fully activated. Redirecting you to login...
          </p>
        </div>

        <Alert className="mb-6 bg-green-50 border-green-200">
          <CheckCircle className="h-4 w-4 text-green-600" />
          <AlertDescription className="text-green-800">
            {String(successMessage)}
          </AlertDescription>
        </Alert>

        <div className="text-center">
          <Link href="/login">
            <Button className="w-full">
              Continue to Login
            </Button>
          </Link>
        </div>

        <div className="mt-8 pt-6 border-t border-gray-200">
          <div className="text-center">
            <div className="flex items-center justify-center space-x-2 text-xs text-gray-500">
              <Shield className="h-3 w-3" />
              <span>Your email has been securely verified</span>
            </div>
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className={cn("w-full max-w-md mx-auto", className)}>
      <div className="text-center mb-8">
        <div className="mx-auto mb-4">
          <img
            src="/images/unielect-logo.jpg"
            alt="UniElect Logo"
            className="h-16 w-16 mx-auto rounded-lg object-cover"
          />
        </div>
        <h1 className="text-2xl font-bold text-gray-900">
          Verify Your Email
        </h1>
        <p className="text-gray-600 mt-2">
          {initialToken && !showManualEntry
            ? "Verifying your email address..."
            : "Enter the verification code sent to your email"}
        </p>
      </div>

      {errorMessage && (
        <Alert variant="destructive" className="mb-6">
          <AlertCircle className="h-4 w-4" />
          <AlertDescription>{String(errorMessage)}</AlertDescription>
        </Alert>
      )}

      {successMessage && (
        <Alert className="mb-6 bg-green-50 border-green-200">
          <CheckCircle className="h-4 w-4 text-green-600" />
          <AlertDescription className="text-green-800">
            {String(successMessage)}
          </AlertDescription>
        </Alert>
      )}

      {(showManualEntry || !initialToken) && (
        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
            <FormField
              control={form.control}
              name="token"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Verification Code</FormLabel>
                  <FormControl>
                    <div className="relative">
                      <Shield className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-4 w-4" />
                      <Input
                        {...field}
                        type="text"
                        placeholder="Enter your verification code"
                        className="pl-10 text-center text-lg tracking-wide uppercase"
                        disabled={isLoading}
                        autoComplete="off"
                      />
                    </div>
                  </FormControl>
                  <FormDescription>
                    Check your email for the verification code
                  </FormDescription>
                  <FormMessage />
                </FormItem>
              )}
            />

            <Button
              type="submit"
              className="w-full"
              disabled={isLoading || !form.watch("token")}
              onClick={() => console.log('[VerifyEmailForm] Button clicked, token:', form.getValues("token"))}
            >
              {isLoading ? (
                <>
                  <LoadingSpinner size="sm" className="mr-2" />
                  Verifying...
                </>
              ) : (
                <>
                  <CheckCircle className="mr-2 h-4 w-4" />
                  Verify Email
                </>
              )}
            </Button>
          </form>
        </Form>
      )}

      {isLoading && !showManualEntry && (
        <div className="flex flex-col items-center justify-center space-y-4">
          <LoadingSpinner size="lg" />
          <p className="text-sm text-gray-600">Verifying your email...</p>
        </div>
      )}

      {!showManualEntry && initialToken && verificationStatus === 'idle' && (
        <div className="mt-6 text-center">
          <button
            onClick={() => setShowManualEntry(true)}
            className="text-sm text-blue-600 hover:text-blue-700 font-medium"
          >
            Enter code manually
          </button>
        </div>
      )}

      {/* Resend Verification Section */}
      <div className="mt-8 pt-6 border-t border-gray-200">
        {!showResendForm ? (
          <div className="text-center">
            <p className="text-sm text-gray-600 mb-3">
              Didn't receive the email?
            </p>
            <Button
              type="button"
              variant="outline"
              className="w-full"
              onClick={() => setShowResendForm(true)}
              disabled={isResending}
            >
              <RefreshCw className="mr-2 h-4 w-4" />
              Resend Verification Email
            </Button>
          </div>
        ) : (
          <div className="space-y-4">
            <div>
              <label htmlFor="resend-email" className="block text-sm font-medium text-gray-700 mb-2">
                Email Address
              </label>
              <div className="relative">
                <Mail className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-4 w-4" />
                <Input
                  id="resend-email"
                  type="email"
                  placeholder="Enter your email"
                  className="pl-10"
                  value={resendEmail}
                  onChange={(e) => setResendEmail(e.target.value)}
                  disabled={isResending}
                />
              </div>
            </div>
            <div className="flex gap-2">
              <Button
                type="button"
                variant="outline"
                className="flex-1"
                onClick={() => {
                  setShowResendForm(false)
                  setResendEmail("")
                }}
                disabled={isResending}
              >
                Cancel
              </Button>
              <Button
                type="button"
                className="flex-1"
                onClick={handleResendVerification}
                disabled={isResending || !resendEmail}
              >
                {isResending ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    Sending...
                  </>
                ) : (
                  <>
                    <RefreshCw className="mr-2 h-4 w-4" />
                    Send
                  </>
                )}
              </Button>
            </div>
          </div>
        )}
      </div>

      <div className="mt-6 text-center">
        <p className="text-sm text-gray-600">
          Already verified?{" "}
          <Link
            href="/login"
            className="font-medium text-blue-600 hover:text-blue-700"
          >
            Sign in here
          </Link>
        </p>
      </div>

      <div className="mt-8 pt-6 border-t border-gray-200">
        <div className="text-center">
          <div className="flex items-center justify-center space-x-2 text-xs text-gray-500">
            <Shield className="h-3 w-3" />
            <span>Secured by UniElect Authentication System</span>
          </div>
        </div>
      </div>
    </div>
  )
}

export default VerifyEmailForm
