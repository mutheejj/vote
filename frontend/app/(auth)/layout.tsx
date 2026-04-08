import React from "react"
import { SessionProvider } from "@/components/auth/SessionProvider"

export default function AuthLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <SessionProvider>
      {children}
    </SessionProvider>
  )
}