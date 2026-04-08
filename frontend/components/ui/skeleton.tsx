"use client"

import { cn } from "@/lib/utils/cn"

interface SkeletonProps extends React.HTMLAttributes<HTMLDivElement> {}

function Skeleton({
  className,
  ...props
}: SkeletonProps) {
  return (
    <div
      className={cn("animate-pulse rounded-md bg-muted", className)}
      {...props}
    />
  )
}

// Specialized skeleton components for voting system
interface CardSkeletonProps {
  className?: string
  showHeader?: boolean
  rows?: number
}

export function CardSkeleton({ className, showHeader = true, rows = 3 }: CardSkeletonProps) {
  return (
    <div className={cn("p-6 space-y-4", className)}>
      {showHeader && (
        <div className="space-y-2">
          <Skeleton className="h-6 w-3/4" />
          <Skeleton className="h-4 w-1/2" />
        </div>
      )}
      <div className="space-y-3">
        {Array.from({ length: rows }).map((_, i) => (
          <div key={i} className="space-y-2">
            <Skeleton className="h-4 w-full" />
            <Skeleton className="h-3 w-4/5" />
          </div>
        ))}
      </div>
    </div>
  )
}

interface TableSkeletonProps {
  className?: string
  columns?: number
  rows?: number
  showHeader?: boolean
}

export function TableSkeleton({
  className,
  columns = 4,
  rows = 5,
  showHeader = true
}: TableSkeletonProps) {
  return (
    <div className={cn("w-full space-y-4", className)}>
      {showHeader && (
        <div className="grid gap-4" style={{ gridTemplateColumns: `repeat(${columns}, 1fr)` }}>
          {Array.from({ length: columns }).map((_, i) => (
            <Skeleton key={i} className="h-6 w-full" />
          ))}
        </div>
      )}
      <div className="space-y-3">
        {Array.from({ length: rows }).map((_, rowIndex) => (
          <div
            key={rowIndex}
            className="grid gap-4"
            style={{ gridTemplateColumns: `repeat(${columns}, 1fr)` }}
          >
            {Array.from({ length: columns }).map((_, colIndex) => (
              <Skeleton key={colIndex} className="h-4 w-full" />
            ))}
          </div>
        ))}
      </div>
    </div>
  )
}

interface ElectionCardSkeletonProps {
  className?: string
}

export function ElectionCardSkeleton({ className }: ElectionCardSkeletonProps) {
  return (
    <div className={cn("border rounded-lg p-6 space-y-4", className)}>
      {/* Header */}
      <div className="space-y-2">
        <Skeleton className="h-6 w-3/4" />
        <Skeleton className="h-4 w-1/3" />
      </div>

      {/* Cover image placeholder */}
      <Skeleton className="h-32 w-full rounded-md" />

      {/* Content */}
      <div className="space-y-3">
        <Skeleton className="h-4 w-full" />
        <Skeleton className="h-4 w-5/6" />
        <Skeleton className="h-4 w-2/3" />
      </div>

      {/* Stats */}
      <div className="flex justify-between">
        <Skeleton className="h-8 w-20" />
        <Skeleton className="h-8 w-24" />
        <Skeleton className="h-8 w-16" />
      </div>

      {/* Action buttons */}
      <div className="flex gap-2">
        <Skeleton className="h-10 w-24" />
        <Skeleton className="h-10 w-20" />
      </div>
    </div>
  )
}

interface CandidateCardSkeletonProps {
  className?: string
}

export function CandidateCardSkeleton({ className }: CandidateCardSkeletonProps) {
  return (
    <div className={cn("border rounded-lg p-4 space-y-4", className)}>
      {/* Profile section */}
      <div className="flex items-start gap-4">
        <Skeleton className="h-16 w-16 rounded-full" />
        <div className="flex-1 space-y-2">
          <Skeleton className="h-5 w-3/4" />
          <Skeleton className="h-4 w-1/2" />
          <Skeleton className="h-3 w-2/3" />
        </div>
      </div>

      {/* Manifesto preview */}
      <div className="space-y-2">
        <Skeleton className="h-4 w-full" />
        <Skeleton className="h-4 w-4/5" />
        <Skeleton className="h-4 w-3/4" />
      </div>

      {/* Actions */}
      <div className="flex justify-between items-center">
        <Skeleton className="h-8 w-20" />
        <Skeleton className="h-9 w-24" />
      </div>
    </div>
  )
}

interface VotingBallotSkeletonProps {
  className?: string
  positions?: number
}

export function VotingBallotSkeleton({ className, positions = 3 }: VotingBallotSkeletonProps) {
  return (
    <div className={cn("space-y-6", className)}>
      {/* Header */}
      <div className="text-center space-y-2">
        <Skeleton className="h-8 w-1/2 mx-auto" />
        <Skeleton className="h-4 w-3/4 mx-auto" />
      </div>

      {/* Positions */}
      {Array.from({ length: positions }).map((_, posIndex) => (
        <div key={posIndex} className="border rounded-lg p-6 space-y-4">
          <div className="space-y-2">
            <Skeleton className="h-6 w-1/3" />
            <Skeleton className="h-4 w-2/3" />
          </div>

          {/* Candidates */}
          <div className="space-y-3">
            {Array.from({ length: Math.floor(Math.random() * 3) + 2 }).map((_, candIndex) => (
              <div key={candIndex} className="flex items-center gap-4 p-3 border rounded">
                <Skeleton className="h-5 w-5 rounded-full" />
                <Skeleton className="h-12 w-12 rounded-full" />
                <div className="flex-1 space-y-1">
                  <Skeleton className="h-5 w-1/2" />
                  <Skeleton className="h-4 w-1/3" />
                </div>
              </div>
            ))}
          </div>
        </div>
      ))}

      {/* Submit button */}
      <div className="text-center">
        <Skeleton className="h-12 w-32 mx-auto" />
      </div>
    </div>
  )
}

interface DashboardSkeletonProps {
  className?: string
}

export function DashboardSkeleton({ className }: DashboardSkeletonProps) {
  return (
    <div className={cn("space-y-6", className)}>
      {/* Header */}
      <div className="space-y-2">
        <Skeleton className="h-8 w-1/3" />
        <Skeleton className="h-4 w-1/2" />
      </div>

      {/* Stats grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        {Array.from({ length: 4 }).map((_, i) => (
          <div key={i} className="border rounded-lg p-4 space-y-3">
            <Skeleton className="h-4 w-2/3" />
            <Skeleton className="h-8 w-1/2" />
            <Skeleton className="h-3 w-3/4" />
          </div>
        ))}
      </div>

      {/* Content grid */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <CardSkeleton rows={4} />
        <CardSkeleton rows={3} />
      </div>

      {/* Table */}
      <TableSkeleton />
    </div>
  )
}

export { Skeleton }