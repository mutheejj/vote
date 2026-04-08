"use client"

import React, { useEffect, useState, Suspense } from "react"
import Image from "next/image"
import { useSearchParams } from "next/navigation"
import { VerifyEmailForm } from "@/components/auth/VerifyEmailForm"
import { LoadingSpinner } from "@/components/shared/LoadingSpinner"

function VerifyEmailContent() {
  const searchParams = useSearchParams()
  const [token, setToken] = useState<string | null>(null)

  useEffect(() => {
    // Get token from URL if present
    const tokenFromUrl = searchParams.get('token')
    console.log('[VerifyEmailPage] Token from URL:', tokenFromUrl)
    if (tokenFromUrl) {
      setToken(tokenFromUrl)
    }
  }, [searchParams])

  return (
    <div className="min-h-screen flex">
        {/* Left Side - Banner Image */}
        <div className="hidden lg:flex lg:flex-1 relative bg-gradient-to-br from-sage-600 to-blue-600">
          <div className="absolute inset-0 flex items-center justify-center p-12">
            <div className="max-w-2xl">
              <div className="mb-8">
                <h2 className="text-4xl font-bold text-white mb-4">
                  Almost There!
                </h2>
                <p className="text-xl text-sage-100">
                  Verify your email address to complete your registration and start
                  participating in UniElect student leader elections.
                </p>
              </div>
              <div className="relative rounded-2xl overflow-hidden shadow-2xl">
                <Image
                  src="/images/vote-illustration2.jpg"
                  alt="Email verification"
                  width={600}
                  height={450}
                  className="w-full h-auto"
                />
              </div>
            </div>
          </div>
        </div>

        {/* Right Side - Verification Form */}
        <div className="flex-1 flex items-center justify-center bg-gray-50 py-12 px-4 sm:px-6 lg:px-8">
          <VerifyEmailForm initialToken={token} />
        </div>
      </div>
  )
}

export default function VerifyEmailPage() {
  return (
    <Suspense fallback={
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <LoadingSpinner size="lg" />
      </div>
    }>
      <VerifyEmailContent />
    </Suspense>
  )
}
