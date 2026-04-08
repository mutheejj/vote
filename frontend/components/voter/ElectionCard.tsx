

"use client"

import React from "react"
import Link from "next/link"
import { useQuery } from "@tanstack/react-query"
import {
  Calendar,
  Clock,
  Users,
  Vote,
  CheckCircle,
  AlertCircle,
  Eye,
  ArrowRight,
  Timer,
  MapPin,
  Info
} from "lucide-react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Progress } from "@/components/ui/progress"
import { getVotingStatus } from "@/lib/api/votes"
import type { Election } from "@/lib/types"
import { ElectionStatus, ElectionType } from "@/lib/enums"
import { cn } from "@/lib/utils/cn"
import { formatDistanceToNow, format, isAfter, isBefore } from "date-fns"

interface ElectionCardProps {
  election: Election
  showVotingStatus?: boolean
  variant?: "default" | "compact" | "detailed"
  className?: string
}

export function ElectionCard({
  election,
  showVotingStatus = true,
  variant = "default",
  className
}: ElectionCardProps) {
  // Check voting status
  const { data: votingStatusData } = useQuery({
    queryKey: ['voting-status', election.id],
    queryFn: () => getVotingStatus(election.id),
    enabled: showVotingStatus && election.status === ElectionStatus.ACTIVE,
  })

  const votingStatus = votingStatusData?.data?.data
  const hasVoted = votingStatus?.hasVoted || false

  const getElectionStatusInfo = () => {
    const now = new Date()
    const startDate = new Date(election.startDate)
    const endDate = new Date(election.endDate)

    switch (election.status) {
      case ElectionStatus.DRAFT:
        return {
          label: "Draft",
          color: "bg-gray-100 text-gray-700",
          icon: Info,
          description: "Election is being prepared"
        }
      case ElectionStatus.SCHEDULED:
        return {
          label: "Scheduled",
          color: "bg-blue-100 text-blue-700",
          icon: Calendar,
          description: `Starts ${formatDistanceToNow(startDate, { addSuffix: true })}`
        }
      case ElectionStatus.ACTIVE:
        return {
          label: "Active",
          color: "bg-green-100 text-green-700",
          icon: Vote,
          description: `Ends ${formatDistanceToNow(endDate, { addSuffix: true })}`
        }
      case ElectionStatus.PAUSED:
        return {
          label: "Paused",
          color: "bg-yellow-100 text-yellow-700",
          icon: Timer,
          description: "Temporarily suspended"
        }
      case ElectionStatus.COMPLETED:
        return {
          label: "Completed",
          color: "bg-gray-100 text-gray-700",
          icon: CheckCircle,
          description: `Ended ${formatDistanceToNow(endDate, { addSuffix: true })}`
        }
      case ElectionStatus.CANCELLED:
        return {
          label: "Cancelled",
          color: "bg-red-100 text-red-700",
          icon: AlertCircle,
          description: "Election was cancelled"
        }
      case ElectionStatus.ARCHIVED:
        return {
          label: "Archived",
          color: "bg-gray-100 text-gray-600",
          icon: CheckCircle,
          description: "Results archived"
        }
      default:
        return {
          label: "Unknown",
          color: "bg-gray-100 text-gray-700",
          icon: Info,
          description: ""
        }
    }
  }

  const getElectionTypeInfo = () => {
    switch (election.type) {
      case ElectionType.PRESIDENTIAL:
        return { label: "Presidential", color: "bg-sage-100 text-sage-700" }
      case ElectionType.FACULTY:
        return { label: "Faculty", color: "bg-green-100 text-green-700" }
      case ElectionType.DEPARTMENTAL:
        return { label: "Departmental", color: "bg-orange-100 text-orange-700" }
      case ElectionType.CLUB:
        return { label: "Club", color: "bg-blue-100 text-blue-700" }
      case ElectionType.SOCIETY:
        return { label: "Society", color: "bg-pink-100 text-pink-700" }
      case ElectionType.REFERENDUM:
        return { label: "Referendum", color: "bg-emerald-100 text-emerald-700" }
      case ElectionType.POLL:
        return { label: "Poll", color: "bg-teal-100 text-teal-700" }
      default:
        return { label: "Other", color: "bg-gray-100 text-gray-700" }
    }
  }

  const calculateProgress = () => {
    if (election.status !== ElectionStatus.ACTIVE) return 0

    const now = new Date().getTime()
    const start = new Date(election.startDate).getTime()
    const end = new Date(election.endDate).getTime()

    if (now < start) return 0
    if (now > end) return 100

    return ((now - start) / (end - start)) * 100
  }

  const canVote = () => {
    return election.status === ElectionStatus.ACTIVE && !hasVoted
  }

  const statusInfo = getElectionStatusInfo()
  const typeInfo = getElectionTypeInfo()
  const progress = calculateProgress()

  if (variant === "compact") {
    return (
      <Card className={cn("hover:shadow-md transition-shadow", className)}>
        <CardContent className="p-4">
          <div className="flex items-center justify-between">
            <div className="flex-1 min-w-0">
              <div className="flex items-center space-x-2 mb-1">
                <h3 className="font-semibold truncate">{election.title}</h3>
                <Badge className={cn("text-xs", statusInfo.color)}>
                  {statusInfo.label}
                </Badge>
              </div>
              <p className="text-sm text-gray-600 truncate">{election.description}</p>
              <div className="flex items-center space-x-4 mt-2 text-xs text-gray-500">
                <span className="flex items-center">
                  <Calendar className="h-3 w-3 mr-1" />
                  {format(new Date(election.startDate), "MMM d")}
                </span>
                <span className="flex items-center">
                  <Users className="h-3 w-3 mr-1" />
                  {election.positions?.length || 0} positions
                </span>
              </div>
            </div>

            <div className="flex items-center space-x-2 ml-4">
              {hasVoted && (
                <Badge variant="success" className="text-xs">
                  <CheckCircle className="h-3 w-3 mr-1" />
                  Voted
                </Badge>
              )}
              <Link href={`/elections/${election.id}`}>
                <Button size="sm" variant="outline">
                  <Eye className="h-3 w-3 mr-1" />
                  View
                </Button>
              </Link>
            </div>
          </div>
        </CardContent>
      </Card>
    )
  }

  return (
    <Card className={cn("hover:shadow-lg transition-all duration-200", className)}>
      <CardHeader>
        <div className="flex items-start justify-between">
          <div className="flex-1">
            <div className="flex items-center space-x-2 mb-2">
              <CardTitle className="text-lg">{election.title}</CardTitle>
              <Badge className={cn("text-xs", typeInfo.color)}>
                {typeInfo.label}
              </Badge>
            </div>
            <CardDescription className="line-clamp-2">
              {election.description}
            </CardDescription>
          </div>

          <div className="flex items-center space-x-2">
            <Badge className={cn("text-xs", statusInfo.color)}>
              <statusInfo.icon className="h-3 w-3 mr-1" />
              {statusInfo.label}
            </Badge>
            {hasVoted && (
              <Badge variant="success" className="text-xs">
                <CheckCircle className="h-3 w-3 mr-1" />
                Voted
              </Badge>
            )}
          </div>
        </div>
      </CardHeader>

      <CardContent className="space-y-4">
        {/* Election Progress */}
        {election.status === ElectionStatus.ACTIVE && (
          <div className="space-y-2">
            <div className="flex justify-between text-sm">
              <span className="text-gray-600">Election Progress</span>
              <span className="font-medium">{Math.round(progress)}%</span>
            </div>
            <Progress value={progress} className="h-2" />
            <p className="text-xs text-gray-500">{statusInfo.description}</p>
          </div>
        )}

        {/* Election Details */}
        <div className="grid grid-cols-2 gap-4 text-sm">
          <div className="space-y-2">
            <div className="flex items-center text-gray-600">
              <Calendar className="h-4 w-4 mr-2" />
              <span>Start Date</span>
            </div>
            <p className="font-medium">
              {format(new Date(election.startDate), "MMM d, yyyy 'at' h:mm a")}
            </p>
          </div>

          <div className="space-y-2">
            <div className="flex items-center text-gray-600">
              <Clock className="h-4 w-4 mr-2" />
              <span>End Date</span>
            </div>
            <p className="font-medium">
              {format(new Date(election.endDate), "MMM d, yyyy 'at' h:mm a")}
            </p>
          </div>

          <div className="space-y-2">
            <div className="flex items-center text-gray-600">
              <Vote className="h-4 w-4 mr-2" />
              <span>Positions</span>
            </div>
            <p className="font-medium">{election.positions?.length || 0} available</p>
          </div>

          <div className="space-y-2">
            <div className="flex items-center text-gray-600">
              <Users className="h-4 w-4 mr-2" />
              <span>Eligible Voters</span>
            </div>
            <p className="font-medium">
              {election.totalEligibleVoters || "All students"}
            </p>
          </div>
        </div>

        {/* Action Buttons */}
        <div className="flex items-center space-x-3 pt-4 border-t">
          <Link href={`/elections/${election.id}`} className="flex-1">
            <Button variant="outline" className="w-full">
              <Eye className="h-4 w-4 mr-2" />
              View Details
            </Button>
          </Link>

          {canVote() && (
            <Link href={`/vote/${election.id}`} className="flex-1">
              <Button className="w-full bg-green-600 hover:bg-green-700">
                <Vote className="h-4 w-4 mr-2" />
                Vote Now
                <ArrowRight className="h-4 w-4 ml-2" />
              </Button>
            </Link>
          )}

          {election.status === ElectionStatus.COMPLETED && (
            <Link href={`/results/${election.id}`} className="flex-1">
              <Button variant="outline" className="w-full">
                <CheckCircle className="h-4 w-4 mr-2" />
                View Results
              </Button>
            </Link>
          )}
        </div>

        {/* Voting Status Message */}
        {election.status === ElectionStatus.ACTIVE && hasVoted && (
          <div className="bg-green-50 border border-green-200 rounded-lg p-3">
            <div className="flex items-center space-x-2">
              <CheckCircle className="h-4 w-4 text-green-600" />
              <span className="text-sm text-green-800 font-medium">
                You have successfully voted in this election
              </span>
            </div>
            <p className="text-xs text-green-700 mt-1">
              Your vote has been recorded and cannot be changed.
            </p>
          </div>
        )}
      </CardContent>
    </Card>
  )
}

export default ElectionCard