"use client"

import React from "react"
import Image from "next/image"
import Link from "next/link"
import { RegisterForm } from "@/components/auth/RegisterForm"
import { ThemeToggle } from "@/components/shared/ThemeToggle"

export default function RegisterPage() {
  return (
    <>
      {/* Prefetch verify-email page */}
      <Link href="/verify-email" prefetch={true} style={{ display: 'none' }} aria-hidden="true" />

      <div className="min-h-screen relative flex items-center justify-center">
        {/* Background */}
        <div className="absolute inset-0">
          <Image
            src="/images/vote-illustration2.jpg"
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
        <div className="relative z-10 w-full max-w-lg mx-auto px-4 py-8">
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
          <div className="bg-white dark:bg-gray-900 rounded-2xl shadow-2xl p-6 sm:p-8 max-h-[80vh] overflow-y-auto">
            <RegisterForm redirectTo="/verify-email" />
          </div>
        </div>
      </div>
    </>
  )
}
