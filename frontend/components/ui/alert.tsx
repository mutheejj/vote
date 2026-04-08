"use client"

import * as React from "react"
import { cva, type VariantProps } from "class-variance-authority"
import { AlertCircle, CheckCircle, AlertTriangle, Info, X } from "lucide-react"
import { cn } from "@/lib/utils/cn"

const alertVariants = cva(
  "relative w-full rounded-lg border p-4",
  {
    variants: {
      variant: {
        default: "bg-background text-foreground border-border",
        destructive: "border-destructive/50 text-destructive dark:border-destructive [&>svg]:text-destructive",
        success: "border-green-500/50 text-green-700 bg-green-50 dark:bg-green-950 dark:text-green-400 dark:border-green-500 [&>svg]:text-green-600",
        warning: "border-amber-500/50 text-amber-700 bg-amber-50 dark:bg-amber-950 dark:text-amber-400 dark:border-amber-500 [&>svg]:text-amber-600",
        info: "border-blue-500/50 text-blue-700 bg-blue-50 dark:bg-blue-950 dark:text-blue-400 dark:border-blue-500 [&>svg]:text-blue-600",
      },
    },
    defaultVariants: {
      variant: "default",
    },
  }
)

interface AlertProps
  extends React.HTMLAttributes<HTMLDivElement>,
    VariantProps<typeof alertVariants> {
  icon?: boolean
  dismissible?: boolean
  onDismiss?: () => void
}

const Alert = React.forwardRef<HTMLDivElement, AlertProps>(
  ({ className, variant, icon = true, dismissible = false, onDismiss, children, ...props }, ref) => {
    const IconComponent = {
      default: Info,
      destructive: AlertCircle,
      success: CheckCircle,
      warning: AlertTriangle,
      info: Info,
    }[variant || "default"]

    return (
      <div
        ref={ref}
        role="alert"
        className={cn(alertVariants({ variant }), className)}
        {...props}
      >
        <div className="flex items-start gap-3">
          {icon && <IconComponent className="h-4 w-4 mt-0.5 flex-shrink-0" />}
          <div className="flex-1 min-w-0">
            {children}
          </div>
          {dismissible && (
            <button
              onClick={onDismiss}
              className="flex-shrink-0 opacity-70 hover:opacity-100 transition-opacity"
              aria-label="Dismiss alert"
            >
              <X className="h-4 w-4" />
            </button>
          )}
        </div>
      </div>
    )
  }
)
Alert.displayName = "Alert"

const AlertTitle = React.forwardRef<
  HTMLParagraphElement,
  React.HTMLAttributes<HTMLHeadingElement>
>(({ className, ...props }, ref) => (
  <h5
    ref={ref}
    className={cn("mb-1 font-medium leading-none tracking-tight", className)}
    {...props}
  />
))
AlertTitle.displayName = "AlertTitle"

const AlertDescription = React.forwardRef<
  HTMLParagraphElement,
  React.HTMLAttributes<HTMLParagraphElement>
>(({ className, ...props }, ref) => (
  <div
    ref={ref}
    className={cn("text-sm [&_p]:leading-relaxed", className)}
    {...props}
  />
))
AlertDescription.displayName = "AlertDescription"

// Specialized alert components for common use cases
interface ElectionAlertProps extends Omit<AlertProps, 'variant'> {
  electionTitle?: string
  status: 'active' | 'ended' | 'starting' | 'paused'
}

export function ElectionAlert({ electionTitle, status, className, ...props }: ElectionAlertProps) {
  const statusConfig = {
    active: { variant: 'success' as const, title: 'Election Active', message: 'Voting is currently open' },
    ended: { variant: 'info' as const, title: 'Election Ended', message: 'Voting has concluded' },
    starting: { variant: 'warning' as const, title: 'Election Starting Soon', message: 'Voting will begin shortly' },
    paused: { variant: 'warning' as const, title: 'Election Paused', message: 'Voting is temporarily suspended' },
  }

  const config = statusConfig[status]

  return (
    <Alert variant={config.variant} className={className} {...props}>
      <AlertTitle>{config.title}</AlertTitle>
      <AlertDescription>
        {electionTitle && <span className="font-medium">{electionTitle}: </span>}
        {config.message}
      </AlertDescription>
    </Alert>
  )
}

interface VotingAlertProps extends Omit<AlertProps, 'variant'> {
  type: 'success' | 'error' | 'warning' | 'info'
  title: string
  message: string
  verificationCode?: string
}

export function VotingAlert({ type, title, message, verificationCode, className, ...props }: VotingAlertProps) {
  return (
    <Alert variant={type === 'error' ? 'destructive' : type} className={className} {...props}>
      <AlertTitle>{title}</AlertTitle>
      <AlertDescription>
        {message}
        {verificationCode && (
          <div className="mt-2 p-2 bg-muted rounded text-xs font-mono">
            Verification Code: {verificationCode}
          </div>
        )}
      </AlertDescription>
    </Alert>
  )
}

export { Alert, AlertTitle, AlertDescription }