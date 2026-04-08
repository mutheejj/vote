"use client"

import * as React from "react"
import * as ProgressPrimitive from "@radix-ui/react-progress"
import { cva, type VariantProps } from "class-variance-authority"
import { cn } from "@/lib/utils/cn"

const progressVariants = cva(
  "relative h-4 w-full overflow-hidden rounded-full bg-secondary",
  {
    variants: {
      size: {
        sm: "h-2",
        default: "h-4",
        lg: "h-6",
      },
    },
    defaultVariants: {
      size: "default",
    },
  }
)

const progressIndicatorVariants = cva(
  "h-full w-full flex-1 bg-primary transition-all",
  {
    variants: {
      variant: {
        default: "bg-primary",
        success: "bg-green-500",
        warning: "bg-amber-500",
        destructive: "bg-destructive",
        secondary: "bg-secondary-foreground",
      },
    },
    defaultVariants: {
      variant: "default",
    },
  }
)

interface ProgressProps
  extends React.ComponentPropsWithoutRef<typeof ProgressPrimitive.Root>,
    VariantProps<typeof progressVariants>,
    VariantProps<typeof progressIndicatorVariants> {
  showValue?: boolean
  formatValue?: (value: number) => string
}

const Progress = React.forwardRef<
  React.ElementRef<typeof ProgressPrimitive.Root>,
  ProgressProps
>(({ className, value, size, variant, showValue = false, formatValue, ...props }, ref) => {
  const displayValue = value || 0

  return (
    <div className="w-full">
      <ProgressPrimitive.Root
        ref={ref}
        className={cn(progressVariants({ size }), className)}
        {...props}
      >
        <ProgressPrimitive.Indicator
          className={cn(progressIndicatorVariants({ variant }))}
          style={{ transform: `translateX(-${100 - displayValue}%)` }}
        />
      </ProgressPrimitive.Root>
      {showValue && (
        <div className="mt-1 text-sm text-muted-foreground text-right">
          {formatValue ? formatValue(displayValue) : `${Math.round(displayValue)}%`}
        </div>
      )}
    </div>
  )
})
Progress.displayName = ProgressPrimitive.Root.displayName

// Enhanced progress components for voting system
interface VotingProgressProps extends Omit<ProgressProps, 'value'> {
  current: number
  total: number
  label?: string
  showStats?: boolean
}

export function VotingProgress({
  current,
  total,
  label,
  showStats = true,
  className,
  ...props
}: VotingProgressProps) {
  const percentage = total > 0 ? (current / total) * 100 : 0

  return (
    <div className={cn("space-y-2", className)}>
      {(label || showStats) && (
        <div className="flex justify-between items-center text-sm">
          {label && <span className="font-medium">{label}</span>}
          {showStats && (
            <span className="text-muted-foreground">
              {current} / {total}
            </span>
          )}
        </div>
      )}
      <Progress
        value={percentage}
        showValue
        formatValue={(value) => `${Math.round(value)}%`}
        {...props}
      />
    </div>
  )
}

interface ElectionStatsProgressProps {
  title: string
  stats: Array<{
    label: string
    value: number
    total: number
    variant?: VariantProps<typeof progressIndicatorVariants>['variant']
  }>
  className?: string
}

export function ElectionStatsProgress({ title, stats, className }: ElectionStatsProgressProps) {
  return (
    <div className={cn("space-y-4", className)}>
      <h4 className="font-medium text-sm text-gray-900">{title}</h4>
      <div className="space-y-3">
        {stats.map((stat, index) => (
          <VotingProgress
            key={index}
            current={stat.value}
            total={stat.total}
            label={stat.label}
            variant={stat.variant}
            size="sm"
          />
        ))}
      </div>
    </div>
  )
}

interface SteppedProgressProps {
  steps: Array<{
    label: string
    completed: boolean
    current?: boolean
  }>
  className?: string
}

export function SteppedProgress({ steps, className }: SteppedProgressProps) {
  const completedSteps = steps.filter(step => step.completed).length
  const currentStepIndex = steps.findIndex(step => step.current)
  const progressPercentage = (completedSteps / steps.length) * 100

  return (
    <div className={cn("space-y-4", className)}>
      <Progress value={progressPercentage} size="sm" />

      <div className="flex justify-between">
        {steps.map((step, index) => (
          <div key={index} className="flex flex-col items-center text-xs space-y-1">
            <div className={cn(
              "w-6 h-6 rounded-full border-2 flex items-center justify-center text-xs font-medium",
              step.completed
                ? "bg-primary border-primary text-primary-foreground"
                : step.current
                ? "border-primary text-primary bg-background"
                : "border-muted-foreground/30 text-muted-foreground bg-background"
            )}>
              {step.completed ? "" : index + 1}
            </div>
            <span className={cn(
              "text-center max-w-16",
              step.current ? "text-primary font-medium" : "text-muted-foreground"
            )}>
              {step.label}
            </span>
          </div>
        ))}
      </div>
    </div>
  )
}

export { Progress }