"use client"

import React, { useState, useEffect, useMemo } from "react"
import { useParams, useRouter } from "next/navigation"
import Link from "next/link"
import {
  ArrowLeft,
  Edit,
  Play,
  Pause,
  Square,
  BarChart3,
  Users,
  Calendar,
  Clock,
  Settings,
  Download,
  Eye,
  ExternalLink,
  AlertTriangle,
  CheckCircle,
  Share2,
  Copy,
  TrendingUp,
  UserCheck,
  Vote,
  Award,
  FileText,
  Map,
  Filter,
  Globe,
  Shield,
  Zap
} from "lucide-react"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Progress } from "@/components/ui/progress"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog"
import { useAuth } from "@/lib/hooks/useAuth"
import { useNotifications } from "@/lib/hooks/useNotifications"
import {
  getElectionById,
  startElection,
  endElection,
  pauseElection,
  resumeElection,
  getElectionStats
} from "@/lib/api/elections"
import { getCandidatesByElection } from "@/lib/api/candidates"
import { Election, Candidate, ElectionStats } from "@/lib/types"
import { ElectionStatus, ElectionType, CandidateStatus, ELECTION_STATUS_LABELS, ELECTION_TYPE_LABELS } from "@/lib/enums"
import { cn } from "@/lib/utils/cn"
import { format, differenceInDays, differenceInHours, differenceInMinutes, isAfter, isBefore } from "date-fns"
import { StatsCard, StatsGrid } from "@/components/admin/StatsCard"

interface ElectionActionDialogProps {
  isOpen: boolean
  onClose: () => void
  onConfirm: () => void
  title: string
  description: string
  actionText: string
  isDestructive?: boolean
  isLoading?: boolean
}

function ElectionActionDialog({
  isOpen,
  onClose,
  onConfirm,
  title,
  description,
  actionText,
  isDestructive = false,
  isLoading = false
}: ElectionActionDialogProps) {
  return (
    <AlertDialog open={isOpen} onOpenChange={onClose}>
      <AlertDialogContent>
        <AlertDialogHeader>
          <AlertDialogTitle>{title}</AlertDialogTitle>
          <AlertDialogDescription>{description}</AlertDialogDescription>
        </AlertDialogHeader>
        <AlertDialogFooter>
          <AlertDialogCancel disabled={isLoading}>Cancel</AlertDialogCancel>
          <AlertDialogAction
            onClick={onConfirm}
            disabled={isLoading}
            className={isDestructive ? "bg-red-600 hover:bg-red-700" : ""}
          >
            {isLoading ? "Processing..." : actionText}
          </AlertDialogAction>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  )
}

export default function AdminElectionDetailsPage() {
  const params = useParams()
  const router = useRouter()
  const { user } = useAuth()
  const { toast } = useNotifications()

  const electionId = params.id as string

  // State
  const [election, setElection] = useState<Election | null>(null)
  const [candidates, setCandidates] = useState<Candidate[]>([])
  const [stats, setStats] = useState<ElectionStats | null>(null)
  const [isLoading, setIsLoading] = useState(true)
  const [actionDialog, setActionDialog] = useState<{
    open: boolean
    type: 'start' | 'end' | 'pause' | 'resume' | null
    isLoading: boolean
  }>({
    open: false,
    type: null,
    isLoading: false
  })

  // Load data
  useEffect(() => {
    loadElectionData()
  }, [electionId])

  // Polling for active elections to keep stats fresh
  useEffect(() => {
    if (election?.status === ElectionStatus.ACTIVE) {
      // Poll every 30 seconds for active elections
      const pollInterval = setInterval(() => {
        loadElectionData()
      }, 30000)

      return () => clearInterval(pollInterval)
    }
  }, [election?.status])

  const loadElectionData = async () => {
    setIsLoading(true)
    try {
      const [electionResponse, candidatesResponse, statsResponse] = await Promise.all([
        getElectionById(electionId),
        getCandidatesByElection(electionId),
        getElectionStats(electionId).catch((error) => {
          console.warn('Failed to load election stats:', error)
          return null
        }) // Stats might not be available
      ])

      if (electionResponse.data.success && electionResponse.data.data) {
        setElection(electionResponse.data.data)
      }

      if (candidatesResponse.data.success && candidatesResponse.data.data) {
        // Backend returns { candidates: [], pagination: {} }
        const candidatesData = candidatesResponse.data.data as any
        setCandidates(candidatesData.candidates || [])
      }

      if (statsResponse?.data.success && statsResponse.data.data) {
        setStats(statsResponse.data.data)
      }
    } catch (error) {
      toast.error("Failed to load election data")
    } finally {
      setIsLoading(false)
    }
  }

  // Election timing calculations
  const electionTiming = useMemo(() => {
    if (!election) return null

    const now = new Date()
    const startDate = new Date(election.startDate)
    const endDate = new Date(election.endDate)

    const hasStarted = isAfter(now, startDate)
    const hasEnded = isAfter(now, endDate)
    const isActive = hasStarted && !hasEnded

    let timeToStart = null
    let timeToEnd = null
    let timeRemaining = null

    if (!hasStarted) {
      const days = differenceInDays(startDate, now)
      const hours = differenceInHours(startDate, now) % 24
      const minutes = differenceInMinutes(startDate, now) % 60
      timeToStart = { days, hours, minutes }
    }

    if (hasStarted && !hasEnded) {
      const days = differenceInDays(endDate, now)
      const hours = differenceInHours(endDate, now) % 24
      const minutes = differenceInMinutes(endDate, now) % 60
      timeRemaining = { days, hours, minutes }
    }

    return {
      hasStarted,
      hasEnded,
      isActive,
      timeToStart,
      timeToEnd,
      timeRemaining
    }
  }, [election])

  // Candidate statistics
  const candidateStats = useMemo(() => {
    const total = candidates.length
    const approved = candidates.filter(c => c.status === CandidateStatus.APPROVED).length
    const pending = candidates.filter(c => c.status === CandidateStatus.PENDING).length
    const rejected = candidates.filter(c => c.status === CandidateStatus.REJECTED).length

    const byPosition = election?.positions?.map(position => ({
      position: position.name,
      count: candidates.filter(c => c.positionId === position.id).length,
      approved: candidates.filter(c => c.positionId === position.id && c.status === CandidateStatus.APPROVED).length
    })) || []

    return { total, approved, pending, rejected, byPosition }
  }, [candidates, election])

  // Action handlers
  const handleElectionAction = (type: 'start' | 'end' | 'pause' | 'resume') => {
    setActionDialog({ open: true, type, isLoading: false })
  }

  const executeElectionAction = async () => {
    if (!actionDialog.type || !election) return

    setActionDialog(prev => ({ ...prev, isLoading: true }))

    try {
      let response: any
      switch (actionDialog.type) {
        case 'start':
          console.log('Starting election with ID:', election.id)
          response = await startElection(election.id)
          break
        case 'end':
          response = await endElection(election.id)
          break
        case 'pause':
          response = await pauseElection(election.id)
          break
        case 'resume':
          response = await resumeElection(election.id)
          break
      }

      if (response.data.success) {
        toast.success(`Election ${actionDialog.type}ed successfully`)
        loadElectionData() // Reload to get updated status
      }
    } catch (error: any) {
      console.error(`Failed to ${actionDialog.type} election:`, error)
      console.error('Error response:', error.response)
      console.error('Error request:', error.request)
      const errorMessage = error.response?.data?.message || error.message || `Failed to ${actionDialog.type} election`
      toast.error(errorMessage)
    } finally {
      setActionDialog({ open: false, type: null, isLoading: false })
    }
  }

  const getStatusVariant = (status: ElectionStatus) => {
    switch (status) {
      case ElectionStatus.ACTIVE:
        return "success"
      case ElectionStatus.SCHEDULED:
        return "info"
      case ElectionStatus.COMPLETED:
        return "secondary"
      case ElectionStatus.CANCELLED:
      case ElectionStatus.PAUSED:
        return "destructive"
      default:
        return "outline"
    }
  }

  const getAvailableActions = () => {
    if (!election) return []

    const actions = []

    switch (election.status) {
      case ElectionStatus.DRAFT:
        // Allow starting DRAFT elections (backend will validate if there are approved candidates)
        actions.push({ type: 'start', label: 'Start Election', icon: Play, variant: 'default' })
        break
      case ElectionStatus.SCHEDULED:
        // Allow starting SCHEDULED elections anytime (manual override or when scheduled time reached)
        actions.push({ type: 'start', label: 'Start Election', icon: Play, variant: 'default' })
        break
      case ElectionStatus.ACTIVE:
        actions.push({ type: 'pause', label: 'Pause Election', icon: Pause, variant: 'outline' })
        actions.push({ type: 'end', label: 'End Election', icon: Square, variant: 'destructive' })
        break
      case ElectionStatus.PAUSED:
        actions.push({ type: 'resume', label: 'Resume Election', icon: Play, variant: 'default' })
        actions.push({ type: 'end', label: 'End Election', icon: Square, variant: 'destructive' })
        break
    }

    return actions
  }

  if (isLoading) {
    return (
      <div className="container mx-auto p-6">
        <div className="space-y-6">
          <div className="h-8 bg-gray-200 rounded animate-pulse"></div>
          <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
            {[...Array(4)].map((_, i) => (
              <div key={i} className="h-24 bg-gray-200 rounded animate-pulse"></div>
            ))}
          </div>
          <div className="h-96 bg-gray-200 rounded animate-pulse"></div>
        </div>
      </div>
    )
  }

  if (!election) {
    return (
      <div className="container mx-auto p-6">
        <Card>
          <CardContent className="p-8 text-center">
            <AlertTriangle className="h-12 w-12 text-gray-400 mx-auto mb-4" />
            <h3 className="text-lg font-semibold mb-2">Election Not Found</h3>
            <p className="text-gray-600 mb-4">The election you're looking for doesn't exist or has been removed.</p>
            <Button asChild>
              <Link href="/admin/elections">
                <ArrowLeft className="h-4 w-4 mr-2" />
                Back to Elections
              </Link>
            </Button>
          </CardContent>
        </Card>
      </div>
    )
  }

  const actionDialogConfig = {
    start: {
      title: "Start Election",
      description: "Are you sure you want to start this election? Voting will become available to eligible voters.",
      actionText: "Start Election",
      isDestructive: false
    },
    end: {
      title: "End Election",
      description: "Are you sure you want to end this election? This action cannot be undone and voting will be permanently closed.",
      actionText: "End Election",
      isDestructive: true
    },
    pause: {
      title: "Pause Election",
      description: "Are you sure you want to pause this election? Voting will be temporarily suspended.",
      actionText: "Pause Election",
      isDestructive: false
    },
    resume: {
      title: "Resume Election",
      description: "Are you sure you want to resume this election? Voting will become available again.",
      actionText: "Resume Election",
      isDestructive: false
    }
  }

  const currentActionConfig = actionDialog.type ? actionDialogConfig[actionDialog.type] : null

  return (
    <div className="container mx-auto p-6 space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center space-x-4">
          <Button variant="ghost" size="sm" asChild>
            <Link href="/admin/elections">
              <ArrowLeft className="h-4 w-4 mr-2" />
              Back to Elections
            </Link>
          </Button>
          <div>
            <h1 className="text-3xl font-bold text-gray-900">{election.title}</h1>
            <div className="flex items-center space-x-4 mt-2">
              <Badge variant={getStatusVariant(election.status)}>
                {ELECTION_STATUS_LABELS[election.status]}
              </Badge>
              <Badge variant="outline">
                {ELECTION_TYPE_LABELS[election.type]}
              </Badge>
              <span className="text-sm text-gray-600">
                {format(new Date(election.startDate), "MMM d, yyyy")} - {format(new Date(election.endDate), "MMM d, yyyy")}
              </span>
            </div>
          </div>
        </div>

        <div className="flex items-center space-x-2">
          {getAvailableActions().map((action) => (
            <Button
              key={action.type}
              variant={action.variant as any}
              size="sm"
              onClick={() => handleElectionAction(action.type as any)}
            >
              <action.icon className="h-4 w-4 mr-2" />
              {action.label}
            </Button>
          ))}
          <Button variant="outline" size="sm" asChild>
            <Link href={`/admin/elections/${election.id}/edit`}>
              <Edit className="h-4 w-4 mr-2" />
              Edit
            </Link>
          </Button>
        </div>
      </div>

      {/* Key Metrics */}
      <StatsGrid
        stats={[
          {
            title: "Total Positions",
            value: election.positions?.length || 0,
            icon: Award,
            variant: "info"
          },
          {
            title: "Total Candidates",
            value: candidateStats.total,
            icon: Users,
            variant: "default"
          },
          {
            title: "Approved Candidates",
            value: candidateStats.approved,
            icon: UserCheck,
            variant: "success"
          },
          {
            title: "Total Votes Cast",
            value: stats?.totalVotesCast || election.totalVotesCast || 0,
            icon: Vote,
            variant: "default"
          }
        ]}
      />

      {/* Election Timeline */}
      {electionTiming && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center space-x-2">
              <Clock className="h-5 w-5" />
              <span>Election Timeline</span>
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <div className="space-y-1">
                  <p className="text-sm font-medium">Start Date</p>
                  <p className="text-sm text-gray-600">
                    {format(new Date(election.startDate), "EEEE, MMMM d, yyyy 'at' h:mm a")}
                  </p>
                </div>
                <div className="space-y-1">
                  <p className="text-sm font-medium">End Date</p>
                  <p className="text-sm text-gray-600">
                    {format(new Date(election.endDate), "EEEE, MMMM d, yyyy 'at' h:mm a")}
                  </p>
                </div>
              </div>

              {electionTiming.timeToStart && (
                <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
                  <div className="flex items-center space-x-2">
                    <Clock className="h-4 w-4 text-blue-600" />
                    <span className="text-sm font-medium text-blue-800">Time to Start</span>
                  </div>
                  <p className="text-lg font-bold text-blue-900">
                    {electionTiming.timeToStart.days}d {electionTiming.timeToStart.hours}h {electionTiming.timeToStart.minutes}m
                  </p>
                </div>
              )}

              {electionTiming.timeRemaining && (
                <div className="bg-green-50 border border-green-200 rounded-lg p-4">
                  <div className="flex items-center space-x-2">
                    <Clock className="h-4 w-4 text-green-600" />
                    <span className="text-sm font-medium text-green-800">Time Remaining</span>
                  </div>
                  <p className="text-lg font-bold text-green-900">
                    {electionTiming.timeRemaining.days}d {electionTiming.timeRemaining.hours}h {electionTiming.timeRemaining.minutes}m
                  </p>
                </div>
              )}

              {electionTiming.hasEnded && (
                <div className="bg-gray-50 border border-gray-200 rounded-lg p-4">
                  <div className="flex items-center space-x-2">
                    <CheckCircle className="h-4 w-4 text-gray-600" />
                    <span className="text-sm font-medium text-gray-800">Election Completed</span>
                  </div>
                  <p className="text-sm text-gray-600">
                    Ended on {format(new Date(election.endDate), "MMMM d, yyyy 'at' h:mm a")}
                  </p>
                </div>
              )}
            </div>
          </CardContent>
        </Card>
      )}

      {/* Tabs */}
      <Tabs defaultValue="overview" className="space-y-6">
        <TabsList>
          <TabsTrigger value="overview">Overview</TabsTrigger>
          <TabsTrigger value="candidates">
            Candidates ({candidateStats.total})
          </TabsTrigger>
          <TabsTrigger value="positions">
            Positions ({election.positions?.length || 0})
          </TabsTrigger>
          <TabsTrigger value="settings">Settings</TabsTrigger>
        </TabsList>

        <TabsContent value="overview" className="space-y-6">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {/* Election Details */}
            <Card>
              <CardHeader>
                <CardTitle>Election Details</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div>
                  <label className="text-sm font-medium text-gray-600">Description</label>
                  <p className="text-sm mt-1">{election.description}</p>
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="text-sm font-medium text-gray-600">Type</label>
                    <p className="text-sm mt-1">{ELECTION_TYPE_LABELS[election.type]}</p>
                  </div>
                  <div>
                    <label className="text-sm font-medium text-gray-600">Status</label>
                    <p className="text-sm mt-1">
                      <Badge variant={getStatusVariant(election.status)}>
                        {ELECTION_STATUS_LABELS[election.status]}
                      </Badge>
                    </p>
                  </div>
                </div>

                {election.allowAbstain && (
                  <div className="flex items-center space-x-2 text-sm">
                    <Shield className="h-4 w-4 text-green-600" />
                    <span>Abstain voting allowed</span>
                  </div>
                )}

                {election.requireTwoFactor && (
                  <div className="flex items-center space-x-2 text-sm">
                    <Shield className="h-4 w-4 text-blue-600" />
                    <span>Two-factor authentication required</span>
                  </div>
                )}

                {election.encryptVotes && (
                  <div className="flex items-center space-x-2 text-sm">
                    <Shield className="h-4 w-4 text-sage-600" />
                    <span>Vote encryption enabled</span>
                  </div>
                )}
              </CardContent>
            </Card>

            {/* Quick Actions */}
            <Card>
              <CardHeader>
                <CardTitle>Quick Actions</CardTitle>
              </CardHeader>
              <CardContent className="space-y-3">
                <Button variant="outline" className="w-full justify-start" asChild>
                  <Link href={`/admin/elections/${election.id}/candidates`}>
                    <Users className="h-4 w-4 mr-2" />
                    Manage Candidates
                  </Link>
                </Button>
                <Button variant="outline" className="w-full justify-start" asChild>
                  <Link href={`/admin/elections/${election.id}/voters`}>
                    <UserCheck className="h-4 w-4 mr-2" />
                    Manage Voters
                  </Link>
                </Button>
                <Button variant="outline" className="w-full justify-start" asChild>
                  <Link href={`/results/${election.id}`}>
                    <BarChart3 className="h-4 w-4 mr-2" />
                    View Results
                  </Link>
                </Button>
                <Button variant="outline" className="w-full justify-start">
                  <Download className="h-4 w-4 mr-2" />
                  Export Data
                </Button>
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        <TabsContent value="candidates" className="space-y-6">
          <div className="flex items-center justify-between">
            <div>
              <h3 className="text-lg font-semibold">Candidates Overview</h3>
              <p className="text-sm text-gray-600">
                {candidateStats.approved} approved out of {candidateStats.total} total candidates
              </p>
            </div>
            <Button asChild>
              <Link href={`/admin/elections/${election.id}/candidates`}>
                View All Candidates
              </Link>
            </Button>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
            <StatsCard
              title="Total Candidates"
              value={candidateStats.total}
              icon={Users}
              variant="default"
            />
            <StatsCard
              title="Approved"
              value={candidateStats.approved}
              icon={CheckCircle}
              variant="success"
            />
            <StatsCard
              title="Pending Review"
              value={candidateStats.pending}
              icon={Clock}
              variant="warning"
            />
            <StatsCard
              title="Rejected"
              value={candidateStats.rejected}
              icon={AlertTriangle}
              variant="error"
            />
          </div>

          {candidateStats.byPosition.length > 0 && (
            <Card>
              <CardHeader>
                <CardTitle>Candidates by Position</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  {candidateStats.byPosition.map((pos, index) => (
                    <div key={index} className="flex items-center justify-between">
                      <div>
                        <p className="font-medium">{pos.position}</p>
                        <p className="text-sm text-gray-600">
                          {pos.approved} approved out of {pos.count} total
                        </p>
                      </div>
                      <div className="flex items-center space-x-2">
                        <Progress
                          value={pos.count > 0 ? (pos.approved / pos.count) * 100 : 0}
                          className="w-20"
                        />
                        <span className="text-sm font-medium w-12">
                          {pos.count > 0 ? Math.round((pos.approved / pos.count) * 100) : 0}%
                        </span>
                      </div>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          )}
        </TabsContent>

        <TabsContent value="positions" className="space-y-6">
          <div className="flex items-center justify-between">
            <div>
              <h3 className="text-lg font-semibold">Election Positions</h3>
              <p className="text-sm text-gray-600">
                {election.positions?.length || 0} positions configured
              </p>
            </div>
          </div>

          <div className="grid gap-4">
            {election.positions?.map((position, index) => (
              <Card key={position.id}>
                <CardContent className="p-6">
                  <div className="flex items-start justify-between">
                    <div className="space-y-2">
                      <h4 className="font-semibold">{position.name}</h4>
                      {position.description && (
                        <p className="text-sm text-gray-600">{position.description}</p>
                      )}
                      <div className="flex items-center space-x-4 text-sm text-gray-500">
                        <span>Max selections: {position.maxSelections}</span>
                        <span>Min selections: {position.minSelections}</span>
                        <span>Order: {position.order}</span>
                      </div>
                    </div>
                    <Badge variant="outline">
                      {candidateStats.byPosition.find(p => p.position === position.name)?.count || 0} candidates
                    </Badge>
                  </div>
                </CardContent>
              </Card>
            )) || (
              <Card>
                <CardContent className="p-8 text-center">
                  <Award className="h-12 w-12 text-gray-400 mx-auto mb-4" />
                  <h3 className="text-lg font-semibold mb-2">No Positions</h3>
                  <p className="text-gray-600">No positions have been configured for this election yet.</p>
                </CardContent>
              </Card>
            )}
          </div>
        </TabsContent>

        <TabsContent value="settings" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>Election Configuration</CardTitle>
              <CardDescription>
                Advanced settings and configurations for this election
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="space-y-4">
                  <h4 className="font-semibold text-gray-900">Voting Rules</h4>
                  <div className="space-y-3">
                    <div className="flex items-center justify-between">
                      <span className="text-sm">Allow Abstain</span>
                      <Badge variant={election.allowAbstain ? "success" : "secondary"}>
                        {election.allowAbstain ? "Enabled" : "Disabled"}
                      </Badge>
                    </div>
                    <div className="flex items-center justify-between">
                      <span className="text-sm">Require All Positions</span>
                      <Badge variant={election.requireAllPositions ? "success" : "secondary"}>
                        {election.requireAllPositions ? "Yes" : "No"}
                      </Badge>
                    </div>
                    <div className="flex items-center justify-between">
                      <span className="text-sm">Show Live Results</span>
                      <Badge variant={election.showLiveResults ? "success" : "secondary"}>
                        {election.showLiveResults ? "Enabled" : "Disabled"}
                      </Badge>
                    </div>
                  </div>
                </div>

                <div className="space-y-4">
                  <h4 className="font-semibold text-gray-900">Security Settings</h4>
                  <div className="space-y-3">
                    <div className="flex items-center justify-between">
                      <span className="text-sm">Two-Factor Authentication</span>
                      <Badge variant={election.requireTwoFactor ? "success" : "secondary"}>
                        {election.requireTwoFactor ? "Required" : "Optional"}
                      </Badge>
                    </div>
                    <div className="flex items-center justify-between">
                      <span className="text-sm">Vote Encryption</span>
                      <Badge variant={election.encryptVotes ? "success" : "secondary"}>
                        {election.encryptVotes ? "Enabled" : "Disabled"}
                      </Badge>
                    </div>
                    <div className="flex items-center justify-between">
                      <span className="text-sm">Anonymous Voting</span>
                      <Badge variant={election.anonymousVoting ? "success" : "secondary"}>
                        {election.anonymousVoting ? "Enabled" : "Disabled"}
                      </Badge>
                    </div>
                  </div>
                </div>
              </div>

              <div className="border-t pt-6">
                <div className="flex items-center justify-between">
                  <div>
                    <h4 className="font-semibold text-gray-900">Danger Zone</h4>
                    <p className="text-sm text-gray-600">
                      Irreversible actions that affect this election
                    </p>
                  </div>
                  <Button variant="destructive" size="sm">
                    Delete Election
                  </Button>
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>

      {/* Action Dialog */}
      {currentActionConfig && (
        <ElectionActionDialog
          isOpen={actionDialog.open}
          onClose={() => setActionDialog({ open: false, type: null, isLoading: false })}
          onConfirm={executeElectionAction}
          title={currentActionConfig.title}
          description={currentActionConfig.description}
          actionText={currentActionConfig.actionText}
          isDestructive={currentActionConfig.isDestructive}
          isLoading={actionDialog.isLoading}
        />
      )}
    </div>
  )
}