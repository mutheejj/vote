"use client"

import * as React from "react"
import { cva, type VariantProps } from "class-variance-authority"
import { cn } from "@/lib/utils/cn"
import { X } from "lucide-react"

const badgeVariants = cva(
  "inline-flex items-center rounded-full border px-2.5 py-0.5 text-xs font-semibold transition-colors focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2",
  {
    variants: {
      variant: {
        default:
          "border-transparent bg-primary text-primary-foreground hover:bg-primary/80",
        secondary:
          "border-transparent bg-secondary text-secondary-foreground hover:bg-secondary/80",
        destructive:
          "border-transparent bg-destructive text-destructive-foreground hover:bg-destructive/80",
        outline: "text-foreground",
        success:
          "border-transparent bg-success text-success-foreground hover:bg-success/80",
        warning:
          "border-transparent bg-warning text-warning-foreground hover:bg-warning/80",
        info:
          "border-transparent bg-blue-500 text-white hover:bg-blue-500/80",
        muted:
          "border-transparent bg-muted text-muted-foreground hover:bg-muted/80",
        // Election status specific variants
        draft: "border-transparent bg-gray-100 text-gray-800 dark:bg-gray-800 dark:text-gray-300",
        scheduled: "border-transparent bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-300",
        active: "border-transparent bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-300",
        paused: "border-transparent bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-300",
        completed: "border-transparent bg-gray-100 text-gray-800 dark:bg-gray-800 dark:text-gray-300",
        cancelled: "border-transparent bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-300",
        archived: "border-transparent bg-gray-100 text-gray-600 dark:bg-gray-800 dark:text-gray-400",
      },
      size: {
        default: "px-2.5 py-0.5 text-xs",
        sm: "px-2 py-0.5 text-xs",
        lg: "px-3 py-1 text-sm",
        xl: "px-4 py-1.5 text-base",
      },
    },
    defaultVariants: {
      variant: "default",
      size: "default",
    },
  }
)

export interface BadgeProps
  extends React.HTMLAttributes<HTMLDivElement>,
    VariantProps<typeof badgeVariants> {
  dismissible?: boolean
  onDismiss?: () => void
  icon?: React.ReactNode
}

const Badge = React.forwardRef<HTMLDivElement, BadgeProps>(
  ({ className, variant, size, dismissible, onDismiss, icon, children, ...props }, ref) => {
    return (
      <div
        className={cn(badgeVariants({ variant, size }), className)}
        ref={ref}
        {...props}
      >
        {icon && <span className="mr-1">{icon}</span>}
        {children}
        {dismissible && onDismiss && (
          <button
            type="button"
            onClick={onDismiss}
            className="ml-1 -mr-1 p-0.5 rounded-full hover:bg-black/10 dark:hover:bg-white/10 transition-colors"
          >
            <X className="h-3 w-3" />
            <span className="sr-only">Remove badge</span>
          </button>
        )}
      </div>
    )
  }
)
Badge.displayName = "Badge"

export { Badge, badgeVariants }