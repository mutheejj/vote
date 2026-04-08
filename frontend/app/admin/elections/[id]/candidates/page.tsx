"use client"

import React, { useState, useEffect, useMemo } from "react"
import { useParams, useRouter } from "next/navigation"
import Link from "next/link"
import {
  MoreHorizontal,
  Eye,
  Edit,
  Trash2,
  Check,
  X,
  UserPlus,
  Users,
  Search,
  Filter,
  Download,
  AlertTriangle,
  Calendar,
  Mail,
  Phone,
  GraduationCap,
  CheckCircle,
  XCircle,
  Clock,
  Ban,
  Upload,
  Image as ImageIcon,
  ExternalLink,
  MapPin,
  Star,
  Award,
  TrendingUp,
  FileText,
  Share2
} from "lucide-react"
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Badge } from "@/components/ui/badge"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
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
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { Textarea } from "@/components/ui/textarea"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Progress } from "@/components/ui/progress"
import { useAuth } from "@/lib/hooks/useAuth"
import { useNotifications } from "@/lib/hooks/useNotifications"
import {
  getCandidatesByElection,
  approveCandidate,
  rejectCandidate,
  disqualifyCandidate,
  updateCandidateStatus
} from "@/lib/api/candidates"
import { getElectionById } from "@/lib/api/elections"
import { Candidate, Election, ApiResponse } from "@/lib/types"
import { CandidateStatus, CANDIDATE_STATUS_LABELS } from "@/lib/enums"
import { cn } from "@/lib/utils/cn"
import { format } from "date-fns"
import { StatsCard } from "@/components/admin/StatsCard"

interface CandidateActionsDialogProps {
  candidate: Candidate | null
  isOpen: boolean
  onClose: () => void
  onAction: (action: 'approve' | 'reject' | 'disqualify', reason?: string) => void
  actionType: 'approve' | 'reject' | 'disqualify' | null
}

function CandidateActionsDialog({
  candidate,
  isOpen,
  onClose,
  onAction,
  actionType
}: CandidateActionsDialogProps) {
  const [reason, setReason] = useState("")
  const [isSubmitting, setIsSubmitting] = useState(false)

  const handleSubmit = async () => {
    if (!actionType || !candidate) return

    if ((actionType === 'reject' || actionType === 'disqualify') && !reason.trim()) {
      return // Reason is required for reject/disqualify
    }

    setIsSubmitting(true)
    try {
      await onAction(actionType, reason.trim() || undefined)
      setReason("")
      onClose()
    } finally {
      setIsSubmitting(false)
    }
  }

  const getActionConfig = () => {
    switch (actionType) {
      case 'approve':
        return {
          title: 'Approve Candidate',
          description: `Are you sure you want to approve ${candidate?.firstName} ${candidate?.lastName} for the position?`,
          buttonText: 'Approve',
          buttonClass: 'bg-green-600 hover:bg-green-700',
          requiresReason: false
        }
      case 'reject':
        return {
          title: 'Reject Candidate',
          description: `Please provide a reason for rejecting ${candidate?.firstName} ${candidate?.lastName}:`,
          buttonText: 'Reject',
          buttonClass: 'bg-red-600 hover:bg-red-700',
          requiresReason: true
        }
      case 'disqualify':
        return {
          title: 'Disqualify Candidate',
          description: `Please provide a reason for disqualifying ${candidate?.firstName} ${candidate?.lastName}:`,
          buttonText: 'Disqualify',
          buttonClass: 'bg-red-600 hover:bg-red-700',
          requiresReason: true
        }
      default:
        return null
    }
  }

  const config = getActionConfig()
  if (!config) return null

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>{config.title}</DialogTitle>
          <DialogDescription>
            {config.description}
          </DialogDescription>
        </DialogHeader>

        {config.requiresReason && (
          <div className="space-y-2">
            <label className="text-sm font-medium">Reason *</label>
            <Textarea
              placeholder="Enter reason..."
              value={reason}
              onChange={(e) => setReason(e.target.value)}
              rows={3}
            />
            {config.requiresReason && !reason.trim() && (
              <p className="text-sm text-red-600">Reason is required</p>
            )}
          </div>
        )}

        <DialogFooter>
          <Button variant="outline" onClick={onClose} disabled={isSubmitting}>
            Cancel
          </Button>
          <Button
            onClick={handleSubmit}
            disabled={isSubmitting || (config.requiresReason && !reason.trim())}
            className={config.buttonClass}
          >
            {isSubmitting ? "Processing..." : config.buttonText}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}

export default function AdminElectionCandidatesPage() {
  const params = useParams()
  const router = useRouter()
  const { user } = useAuth()
  const { toast } = useNotifications()

  const electionId = params.id as string

  // State
  const [election, setElection] = useState<Election | null>(null)
  const [candidates, setCandidates] = useState<Candidate[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [searchQuery, setSearchQuery] = useState("")
  const [statusFilter, setStatusFilter] = useState<string>("all")
  const [positionFilter, setPositionFilter] = useState<string>("all")
  const [facultyFilter, setFacultyFilter] = useState<string>("all")
  const [selectedCandidate, setSelectedCandidate] = useState<Candidate | null>(null)
  const [actionDialogOpen, setActionDialogOpen] = useState(false)
  const [actionType, setActionType] = useState<'approve' | 'reject' | 'disqualify' | null>(null)

  // Load data
  useEffect(() => {
    loadElectionData()
    loadCandidates()
  }, [electionId])

  const loadElectionData = async () => {
    try {
      const response = await getElectionById(electionId)
      if (response.data.success && response.data.data) {
        setElection(response.data.data)
      }
    } catch (error) {
      toast.error("Failed to load election data")
    }
  }

  const loadCandidates = async () => {
    setIsLoading(true)
    try {
      const response = await getCandidatesByElection(electionId)
      if (response.data.success && response.data.data) {
        setCandidates(response.data.data)
      }
    } catch (error) {
      toast.error("Failed to load candidates")
    } finally {
      setIsLoading(false)
    }
  }

  // Filtered candidates
  const filteredCandidates = useMemo(() => {
    return candidates.filter((candidate) => {
      const matchesSearch = candidate.firstName.toLowerCase().includes(searchQuery.toLowerCase()) ||
                          candidate.lastName.toLowerCase().includes(searchQuery.toLowerCase()) ||
                          candidate.email.toLowerCase().includes(searchQuery.toLowerCase()) ||
                          candidate.manifesto?.toLowerCase().includes(searchQuery.toLowerCase())

      const matchesStatus = statusFilter === "all" || candidate.status === statusFilter
      const matchesPosition = positionFilter === "all" || candidate.positionId === positionFilter
      const matchesFaculty = facultyFilter === "all" || candidate.faculty === facultyFilter

      return matchesSearch && matchesStatus && matchesPosition && matchesFaculty
    })
  }, [candidates, searchQuery, statusFilter, positionFilter, facultyFilter])

  // Statistics
  const candidateStats = useMemo(() => {
    const total = candidates.length
    const pending = candidates.filter(c => c.status === CandidateStatus.PENDING).length
    const approved = candidates.filter(c => c.status === CandidateStatus.APPROVED).length
    const rejected = candidates.filter(c => c.status === CandidateStatus.REJECTED).length
    const disqualified = candidates.filter(c => c.status === CandidateStatus.DISQUALIFIED).length

    return { total, pending, approved, rejected, disqualified }
  }, [candidates])

  const positionOptions = useMemo(() => {
    if (!election?.positions) return []
    return election.positions.map(p => ({ value: p.id, label: p.name }))
  }, [election])

  const facultyOptions = useMemo(() => {
    const facultySet = new Set<string>()
    candidates.forEach(c => facultySet.add(c.faculty))
    const faculties = Array.from(facultySet)
    return faculties.map(f => ({ value: f, label: f }))
  }, [candidates])

  // Actions
  const handleCandidateAction = (candidate: Candidate, action: 'approve' | 'reject' | 'disqualify') => {
    setSelectedCandidate(candidate)
    setActionType(action)
    setActionDialogOpen(true)
  }

  const executeCandidateAction = async (action: 'approve' | 'reject' | 'disqualify', reason?: string) => {
    if (!selectedCandidate) return

    try {
      let response: any
      switch (action) {
        case 'approve':
          response = await approveCandidate(selectedCandidate.id)
          break
        case 'reject':
          response = await rejectCandidate(selectedCandidate.id, reason!)
          break
        case 'disqualify':
          response = await disqualifyCandidate(selectedCandidate.id, reason!)
          break
      }

      if (response.data.success) {
        toast.success(`Candidate ${action}d successfully`)
        loadCandidates() // Reload the list
      }
    } catch (error) {
      toast.error(`Failed to ${action} candidate`)
    }
  }

  const getStatusVariant = (status: CandidateStatus) => {
    switch (status) {
      case CandidateStatus.APPROVED:
        return "success"
      case CandidateStatus.PENDING:
        return "warning"
      case CandidateStatus.REJECTED:
        return "destructive"
      case CandidateStatus.DISQUALIFIED:
        return "destructive"
      default:
        return "outline"
    }
  }

  const getStatusIcon = (status: CandidateStatus) => {
    switch (status) {
      case CandidateStatus.APPROVED:
        return <CheckCircle className="h-4 w-4" />
      case CandidateStatus.PENDING:
        return <Clock className="h-4 w-4" />
      case CandidateStatus.REJECTED:
        return <XCircle className="h-4 w-4" />
      case CandidateStatus.DISQUALIFIED:
        return <Ban className="h-4 w-4" />
      default:
        return <Clock className="h-4 w-4" />
    }
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

  return (
    <div className="container mx-auto p-6 space-y-6">
      {/* Header */}
      <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">Election Candidates</h1>
          <div className="flex items-center space-x-2 text-sm text-gray-600">
            <span>Election:</span>
            <span className="font-medium">{election?.title}</span>
            <span>"</span>
            <span>{filteredCandidates.length} candidates</span>
          </div>
        </div>

        <div className="flex items-center space-x-2">
          <Button variant="outline" size="sm">
            <Download className="h-4 w-4 mr-2" />
            Export
          </Button>
          <Button variant="outline" size="sm">
            <FileText className="h-4 w-4 mr-2" />
            Reports
          </Button>
          <Button variant="outline" size="sm" asChild>
            <Link href={`/admin/elections/${electionId}`}>
              <Eye className="h-4 w-4 mr-2" />
              View Election
            </Link>
          </Button>
        </div>
      </div>

      {/* Statistics Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-4">
        <StatsCard
          title="Total Candidates"
          value={candidateStats.total}
          icon={Users}
          variant="default"
        />
        <StatsCard
          title="Pending Review"
          value={candidateStats.pending}
          icon={Clock}
          variant="warning"
        />
        <StatsCard
          title="Approved"
          value={candidateStats.approved}
          icon={CheckCircle}
          variant="success"
        />
        <StatsCard
          title="Rejected"
          value={candidateStats.rejected}
          icon={XCircle}
          variant="error"
        />
        <StatsCard
          title="Disqualified"
          value={candidateStats.disqualified}
          icon={Ban}
          variant="error"
        />
      </div>

      {/* Filters */}
      <Card>
        <CardContent className="p-4">
          <div className="flex flex-col lg:flex-row gap-4">
            <div className="flex-1">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
                <Input
                  placeholder="Search candidates by name, email, or manifesto..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="pl-10"
                />
              </div>
            </div>

            <div className="flex items-center space-x-2">
              <Select value={statusFilter} onValueChange={setStatusFilter}>
                <SelectTrigger className="w-40">
                  <SelectValue placeholder="All Status" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Status</SelectItem>
                  {Object.values(CandidateStatus).map((status) => (
                    <SelectItem key={status} value={status}>
                      {CANDIDATE_STATUS_LABELS[status]}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>

              <Select value={positionFilter} onValueChange={setPositionFilter}>
                <SelectTrigger className="w-40">
                  <SelectValue placeholder="All Positions" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Positions</SelectItem>
                  {positionOptions.map((position) => (
                    <SelectItem key={position.value} value={position.value}>
                      {position.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>

              <Select value={facultyFilter} onValueChange={setFacultyFilter}>
                <SelectTrigger className="w-40">
                  <SelectValue placeholder="All Faculties" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Faculties</SelectItem>
                  {facultyOptions.map((faculty) => (
                    <SelectItem key={faculty.value} value={faculty.value}>
                      {faculty.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Candidates Table */}
      <Card>
        <CardHeader>
          <CardTitle>Candidates ({filteredCandidates.length})</CardTitle>
          <CardDescription>
            Manage candidate applications and approvals
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="rounded-md border">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Candidate</TableHead>
                  <TableHead>Position</TableHead>
                  <TableHead>Academic Info</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead>Applied</TableHead>
                  <TableHead>Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filteredCandidates.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={6} className="text-center py-8">
                      <div className="flex flex-col items-center space-y-2">
                        <Users className="h-8 w-8 text-gray-300" />
                        <p className="text-gray-500">No candidates found</p>
                      </div>
                    </TableCell>
                  </TableRow>
                ) : (
                  filteredCandidates.map((candidate) => (
                    <TableRow key={candidate.id}>
                      <TableCell>
                        <div className="flex items-center space-x-3">
                          <Avatar className="h-10 w-10">
                            <AvatarImage src={candidate.photo} alt={candidate.firstName} />
                            <AvatarFallback>
                              {candidate.firstName[0]}{candidate.lastName[0]}
                            </AvatarFallback>
                          </Avatar>
                          <div>
                            <p className="font-medium">
                              {candidate.firstName} {candidate.lastName}
                            </p>
                            <div className="flex items-center space-x-2 text-sm text-gray-500">
                              <Mail className="h-3 w-3" />
                              <span>{candidate.email}</span>
                            </div>
                          </div>
                        </div>
                      </TableCell>

                      <TableCell>
                        <div className="space-y-1">
                          <p className="font-medium">
                            {election?.positions?.find(p => p.id === candidate.positionId)?.name}
                          </p>
                          {candidate.slogan && (
                            <p className="text-sm text-gray-500 italic">"{candidate.slogan}"</p>
                          )}
                        </div>
                      </TableCell>

                      <TableCell>
                        <div className="space-y-1 text-sm">
                          <div className="flex items-center space-x-1">
                            <GraduationCap className="h-3 w-3 text-gray-400" />
                            <span>{candidate.faculty}</span>
                          </div>
                          <div className="text-gray-500">
                            {candidate.department}
                          </div>
                          <div className="text-gray-500">
                            Year {candidate.yearOfStudy}
                          </div>
                        </div>
                      </TableCell>

                      <TableCell>
                        <div className="flex items-center space-x-2">
                          {getStatusIcon(candidate.status)}
                          <Badge variant={getStatusVariant(candidate.status)}>
                            {CANDIDATE_STATUS_LABELS[candidate.status]}
                          </Badge>
                        </div>
                      </TableCell>

                      <TableCell>
                        <div className="text-sm text-gray-600">
                          {format(new Date(candidate.createdAt), "MMM d, yyyy")}
                        </div>
                      </TableCell>

                      <TableCell>
                        <DropdownMenu>
                          <DropdownMenuTrigger asChild>
                            <Button variant="ghost" className="h-8 w-8 p-0">
                              <MoreHorizontal className="h-4 w-4" />
                            </Button>
                          </DropdownMenuTrigger>
                          <DropdownMenuContent align="end">
                            <DropdownMenuLabel>Actions</DropdownMenuLabel>
                            <DropdownMenuSeparator />

                            <DropdownMenuItem asChild>
                              <Link href={`/candidates/${candidate.id}`}>
                                <Eye className="h-4 w-4 mr-2" />
                                View Profile
                              </Link>
                            </DropdownMenuItem>

                            {candidate.manifesto && (
                              <DropdownMenuItem>
                                <FileText className="h-4 w-4 mr-2" />
                                View Manifesto
                              </DropdownMenuItem>
                            )}

                            <DropdownMenuSeparator />

                            {candidate.status === CandidateStatus.PENDING && (
                              <>
                                <DropdownMenuItem
                                  onClick={() => handleCandidateAction(candidate, 'approve')}
                                  className="text-green-600"
                                >
                                  <Check className="h-4 w-4 mr-2" />
                                  Approve
                                </DropdownMenuItem>
                                <DropdownMenuItem
                                  onClick={() => handleCandidateAction(candidate, 'reject')}
                                  className="text-red-600"
                                >
                                  <X className="h-4 w-4 mr-2" />
                                  Reject
                                </DropdownMenuItem>
                              </>
                            )}

                            {candidate.status === CandidateStatus.APPROVED && (
                              <DropdownMenuItem
                                onClick={() => handleCandidateAction(candidate, 'disqualify')}
                                className="text-red-600"
                              >
                                <Ban className="h-4 w-4 mr-2" />
                                Disqualify
                              </DropdownMenuItem>
                            )}
                          </DropdownMenuContent>
                        </DropdownMenu>
                      </TableCell>
                    </TableRow>
                  ))
                )}
              </TableBody>
            </Table>
          </div>
        </CardContent>
      </Card>

      {/* Action Dialog */}
      <CandidateActionsDialog
        candidate={selectedCandidate}
        isOpen={actionDialogOpen}
        onClose={() => {
          setActionDialogOpen(false)
          setSelectedCandidate(null)
          setActionType(null)
        }}
        onAction={executeCandidateAction}
        actionType={actionType}
      />
    </div>
  )
}