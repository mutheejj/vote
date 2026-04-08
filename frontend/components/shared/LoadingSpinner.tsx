"use client"

import React from "react"
import { cva, type VariantProps } from "class-variance-authority"
import { Loader2, RefreshCw, RotateCw } from "lucide-react"
import { cn } from "@/lib/utils/cn"

const spinnerVariants = cva(
  "animate-spin",
  {
    variants: {
      variant: {
        default: "text-sage-600 dark:text-sage-400",
        gradient: "text-transparent bg-clip-text bg-gradient-to-r from-sage-600 to-emerald-600",
        secondary: "text-secondary",
        muted: "text-muted-foreground",
        destructive: "text-destructive",
        success: "text-green-600",
        warning: "text-amber-600",
        white: "text-white",
      },
      size: {
        xs: "h-3 w-3",
        sm: "h-4 w-4",
        default: "h-5 w-5",
        lg: "h-6 w-6",
        xl: "h-8 w-8",
        "2xl": "h-12 w-12",
      },
      speed: {
        slow: "animate-spin-slow",
        default: "animate-spin",
        fast: "animate-spin-fast",
      }
    },
    defaultVariants: {
      variant: "default",
      size: "default",
      speed: "default",
    },
  }
)

interface LoadingSpinnerProps extends VariantProps<typeof spinnerVariants> {
  className?: string
  text?: string
  overlay?: boolean
  icon?: 'loader' | 'refresh' | 'rotate'
  fullScreen?: boolean
  center?: boolean
}

export function LoadingSpinner({
  className,
  variant,
  size,
  speed,
  text,
  overlay = false,
  icon = 'loader',
  fullScreen = false,
  center = false,
  ...props
}: LoadingSpinnerProps) {
  const IconComponent = {
    loader: Loader2,
    refresh: RefreshCw,
    rotate: RotateCw,
  }[icon]

  const spinner = (
    <div className={cn(
      "flex items-center justify-center",
      center && "flex-col gap-2",
      fullScreen && "fixed inset-0 z-50 bg-background/80 backdrop-blur-sm",
      overlay && !fullScreen && "absolute inset-0 z-10 bg-background/80 backdrop-blur-sm",
      className
    )}>
      <div className={cn(
        "flex items-center gap-2",
        center && "flex-col"
      )}>
        <IconComponent
          className={cn(spinnerVariants({ variant, size, speed }))}
          {...props}
        />
        {text && (
          <span className={cn(
            "text-sm text-muted-foreground animate-pulse",
            center && "text-center"
          )}>
            {text}
          </span>
        )}
      </div>
    </div>
  )

  return spinner
}

// Specialized loading components for common use cases
interface ButtonLoadingProps {
  isLoading: boolean
  children: React.ReactNode
  loadingText?: string
  variant?: VariantProps<typeof spinnerVariants>['variant']
  size?: VariantProps<typeof spinnerVariants>['size']
}

export function ButtonLoading({
  isLoading,
  children,
  loadingText,
  variant = "white",
  size = "sm"
}: ButtonLoadingProps) {
  if (!isLoading) return <>{children}</>

  return (
    <div className="flex items-center gap-2">
      <LoadingSpinner variant={variant} size={size} />
      <span>{loadingText || 'Loading...'}</span>
    </div>
  )
}

interface PageLoadingProps {
  text?: string
  className?: string
}

export function PageLoading({ text = "Loading page...", className }: PageLoadingProps) {
  return (
    <LoadingSpinner
      fullScreen
      center
      size="lg"
      text={text}
      className={className}
    />
  )
}

interface CardLoadingProps {
  text?: string
  className?: string
  rows?: number
}

export function CardLoading({ text, className, rows = 3 }: CardLoadingProps) {
  return (
    <div className={cn("p-6 space-y-4", className)}>
      {text && (
        <div className="flex items-center justify-center mb-4">
          <LoadingSpinner size="sm" text={text} />
        </div>
      )}
      <div className="space-y-3">
        {Array.from({ length: rows }).map((_, i) => (
          <div key={i} className="space-y-2">
            <div className="h-4 bg-muted rounded animate-pulse" />
            <div className="h-3 bg-muted rounded w-3/4 animate-pulse" />
          </div>
        ))}
      </div>
    </div>
  )
}

interface TableLoadingProps {
  columns?: number
  rows?: number
  className?: string
}

export function TableLoading({ columns = 4, rows = 5, className }: TableLoadingProps) {
  return (
    <div className={cn("w-full", className)}>
      <div className="border rounded-lg overflow-hidden">
        {/* Header */}
        <div className="bg-muted/50 border-b">
          <div className="grid gap-4 p-4" style={{ gridTemplateColumns: `repeat(${columns}, 1fr)` }}>
            {Array.from({ length: columns }).map((_, i) => (
              <div key={i} className="h-4 bg-muted rounded animate-pulse" />
            ))}
          </div>
        </div>

        {/* Rows */}
        {Array.from({ length: rows }).map((_, rowIndex) => (
          <div key={rowIndex} className="border-b last:border-b-0">
            <div className="grid gap-4 p-4" style={{ gridTemplateColumns: `repeat(${columns}, 1fr)` }}>
              {Array.from({ length: columns }).map((_, colIndex) => (
                <div key={colIndex} className="h-4 bg-muted/60 rounded animate-pulse" />
              ))}
            </div>
          </div>
        ))}
      </div>
    </div>
  )
}

interface VotingLoadingProps {
  step?: string
  progress?: number
}

export function VotingLoading({ step = "Preparing ballot...", progress }: VotingLoadingProps) {
  return (
    <div className="flex flex-col items-center justify-center min-h-[400px] p-8">
      <LoadingSpinner size="lg" variant="default" className="mb-6" />

      <h3 className="text-lg font-semibold text-center mb-2">
        Processing Your Vote
      </h3>

      <p className="text-muted-foreground text-center mb-6">
        {step}
      </p>

      {progress !== undefined && (
        <div className="w-full max-w-md">
          <div className="bg-muted rounded-full h-2">
            <div
              className="bg-gradient-to-r from-sage-600 to-emerald-600 h-2 rounded-full transition-all duration-300 ease-out"
              style={{ width: `${progress}%` }}
            />
          </div>
          <p className="text-sm text-muted-foreground text-center mt-2">
            {progress}% complete
          </p>
        </div>
      )}

      <div className="text-xs text-muted-foreground mt-4 text-center">
        Please do not close this window or navigate away
      </div>
    </div>
  )
}

// Add custom animations to global CSS
export const spinnerAnimations = `
  @keyframes spin-slow {
    from {
      transform: rotate(0deg);
    }
    to {
      transform: rotate(360deg);
    }
  }

  @keyframes spin-fast {
    from {
      transform: rotate(0deg);
    }
    to {
      transform: rotate(360deg);
    }
  }

  .animate-spin-slow {
    animation: spin-slow 2s linear infinite;
  }

  .animate-spin-fast {
    animation: spin-fast 0.5s linear infinite;
  }
`

export default LoadingSpinner