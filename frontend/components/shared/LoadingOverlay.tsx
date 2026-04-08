"use client"

import React from "react"
import { Loader2 } from "lucide-react"
import { cn } from "@/lib/utils/cn"

interface LoadingOverlayProps {
  message?: string
  className?: string
}

export function LoadingOverlay({ message = "Loading...", className }: LoadingOverlayProps) {
  return (
    <div className={cn(
      "fixed inset-0 z-50 flex items-center justify-center bg-white/80 dark:bg-gray-950/80 backdrop-blur-sm",
      className
    )}>
      <div className="flex flex-col items-center space-y-4">
        <div className="relative">
          {/* Animated gradient glow effect */}
          <div className="absolute -inset-2 bg-gradient-to-r from-sage-600 to-emerald-600 rounded-full opacity-20 blur-lg animate-pulse"></div>

          {/* Spinner track */}
          <div className="relative h-12 w-12 rounded-full border-4 border-sage-100 dark:border-sage-900"></div>

          {/* Animated spinner */}
          <Loader2 className="absolute inset-0 h-12 w-12 animate-spin text-sage-600 dark:text-sage-400" />
        </div>
        <p className="text-base font-medium text-gray-700 dark:text-gray-300">{message}</p>
      </div>
    </div>
  )
}

export default LoadingOverlay
