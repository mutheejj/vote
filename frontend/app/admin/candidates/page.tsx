"use client"

import React, { useState, useEffect, useMemo } from 'react'
import Link from 'next/link'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Badge } from '@/components/ui/badge'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog'
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar'
import {
  UserCheck,
  Search,
  Plus,
  MoreHorizontal,
  Eye,
  Edit,
  CheckCircle,
  XCircle,
  Download,
  Upload,
  Users,
  Award,
  AlertTriangle,
  Loader2
} from 'lucide-react'
import { useAuth } from '@/lib/hooks/useAuth'
import { cn } from '@/lib/utils/cn'
import { Candidate, ApiResponse, PaginatedResponse } from '@/lib/types'
import { CandidateStatus } from '@/lib/enums'
import {
  getCandidatesByElection,
  updateCandidateStatus,
  approveCandidate,
  rejectCandidate,
  disqualifyCandidate
} from '@/lib/api/candidates'
import { getElections } from '@/lib/api/elections'
import { useNotifications } from '@/lib/hooks/useNotifications'
import { NotificationType } from '@/lib/enums'

export default function AdminCandidatesPage() {
  const { user } = useAuth()
  const { addNotification } = useNotifications()
  const queryClient = useQueryClient()
  const [filteredCandidates, setFilteredCandidates] = useState<Candidate[]>([])
  const [selectedElection, setSelectedElection] = useState<string>('all')
  const [searchTerm, setSearchTerm] = useState('')
  const [statusFilter, setStatusFilter] = useState<string>('all')
  const [selectedCandidate, setSelectedCandidate] = useState<Candidate | null>(null)
  const [isViewDialogOpen, setIsViewDialogOpen] = useState(false)

  // Fetch elections for filter dropdown
  const { data: electionsData } = useQuery({
    queryKey: ['elections'],
    queryFn: async () => {
      const response = await getElections()
      // Handle paginated response - return the data array
      return response.data.data?.data || []
    }
  })

  // Fetch candidates based on selected election
  const { data: candidatesData, isLoading, error } = useQuery({
    queryKey: ['candidates', selectedElection],
    queryFn: async () => {
      if (selectedElection === 'all') {
        // For 'all', we need to fetch candidates from all elections
        // This would require a different endpoint or multiple calls
        // For now, we'll return empty array and show a message
        return { success: true, data: [] }
      }
      const response = await getCandidatesByElection(selectedElection)
      return response.data
    },
    enabled: selectedElection !== ''
  })

  const candidates = useMemo(() => candidatesData?.data || [], [candidatesData?.data])

  // Filter candidates based on search and filters using useMemo to prevent infinite loop
  const filteredCandidatesComputed = useMemo(() => {
    let filtered = candidates

    // Search filter
    if (searchTerm) {
      filtered = filtered.filter(candidate =>
        `${candidate.firstName} ${candidate.lastName}`.toLowerCase().includes(searchTerm.toLowerCase()) ||
        candidate.email.toLowerCase().includes(searchTerm.toLowerCase()) ||
        (candidate.user?.studentId || '').toLowerCase().includes(searchTerm.toLowerCase()) ||
        (candidate.position?.name || '').toLowerCase().includes(searchTerm.toLowerCase())
      )
    }

    // Status filter
    if (statusFilter !== 'all') {
      filtered = filtered.filter(candidate => candidate.status === statusFilter)
    }

    return filtered
  }, [candidates, searchTerm, statusFilter])

  // Update state when filtered candidates change
  useEffect(() => {
    setFilteredCandidates(filteredCandidatesComputed)
  }, [filteredCandidatesComputed])

  // Mutation for updating candidate status
  const updateStatusMutation = useMutation({
    mutationFn: ({ candidateId, status, reason }: { candidateId: string, status: CandidateStatus, reason?: string }) =>
      updateCandidateStatus(candidateId, status, reason),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['candidates'] })
      addNotification({
        type: NotificationType.SUCCESS,
        title: 'Success',
        message: 'Candidate status updated successfully',
      })
    },
    onError: (error: any) => {
      addNotification({
        type: NotificationType.ERROR,
        title: 'Error',
        message: error.response?.data?.message || 'Failed to update candidate status',
      })
    }
  })

  // Mutation for approving candidate
  const approveMutation = useMutation({
    mutationFn: (candidateId: string) => approveCandidate(candidateId),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['candidates'] })
      addNotification({
        type: NotificationType.SUCCESS,
        title: 'Success',
        message: 'Candidate approved successfully',
      })
    },
    onError: (error: any) => {
      addNotification({
        type: NotificationType.ERROR,
        title: 'Error',
        message: error.response?.data?.message || 'Failed to approve candidate',
      })
    }
  })

  // Mutation for rejecting candidate
  const rejectMutation = useMutation({
    mutationFn: ({ candidateId, reason }: { candidateId: string, reason: string }) =>
      rejectCandidate(candidateId, reason),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['candidates'] })
      addNotification({
        type: NotificationType.SUCCESS,
        title: 'Success',
        message: 'Candidate rejected successfully',
      })
    },
    onError: (error: any) => {
      addNotification({
        type: NotificationType.ERROR,
        title: 'Error',
        message: error.response?.data?.message || 'Failed to reject candidate',
      })
    }
  })

  const getStatusColor = (status: CandidateStatus) => {
    switch (status) {
      case CandidateStatus.APPROVED:
        return 'bg-green-100 text-green-800'
      case CandidateStatus.PENDING:
        return 'bg-yellow-100 text-yellow-800'
      case CandidateStatus.REJECTED:
        return 'bg-red-100 text-red-800'
      case CandidateStatus.DISQUALIFIED:
        return 'bg-red-100 text-red-800'
      case CandidateStatus.WITHDRAWN:
        return 'bg-gray-100 text-gray-800'
      default:
        return 'bg-gray-100 text-gray-800'
    }
  }

  const getElectionStatusColor = (status: string) => {
    switch (status) {
      case 'DRAFT':
        return 'bg-gray-100 text-gray-800'
      case 'PUBLISHED':
        return 'bg-blue-100 text-blue-800'
      case 'ACTIVE':
        return 'bg-green-100 text-green-800'
      case 'COMPLETED':
        return 'bg-sage-100 text-sage-800'
      case 'CANCELLED':
        return 'bg-red-100 text-red-800'
      default:
        return 'bg-gray-100 text-gray-800'
    }
  }

  const handleViewCandidate = (candidate: Candidate) => {
    setSelectedCandidate(candidate)
    setIsViewDialogOpen(true)
  }

  const handleStatusChange = (candidateId: string, newStatus: CandidateStatus) => {
    updateStatusMutation.mutate({ candidateId, status: newStatus })
  }

  const handleApproveCandidate = (candidateId: string) => {
    approveMutation.mutate(candidateId)
  }

  const handleRejectCandidate = (candidateId: string, reason: string) => {
    rejectMutation.mutate({ candidateId, reason })
  }

  const getInitials = (firstName: string, lastName: string) => {
    return `${firstName[0]}${lastName[0]}`.toUpperCase()
  }

  const totalCandidates = candidates.length
  const activeCandidates = candidates.filter(c => c.status === CandidateStatus.APPROVED).length
  const verifiedCandidates = candidates.filter(c => c.verifiedAt).length
  const totalVotes = candidates.reduce((sum, c) => sum + (c.votes?.length || 0), 0)

  if (error) {
    return (
      <div className="space-y-8">
        <div className="flex justify-between items-center">
          <div>
            <h1 className="text-3xl font-bold tracking-tight">Candidates Management</h1>
            <p className="text-muted-foreground mt-2">
              Manage candidate registrations and election participation
            </p>
          </div>
        </div>
        <Card>
          <CardContent className="p-6">
            <div className="text-center">
              <AlertTriangle className="h-12 w-12 text-red-500 mx-auto mb-4" />
              <h3 className="text-lg font-medium text-gray-900 mb-2">Error Loading Candidates</h3>
              <p className="text-gray-500">
                {(error as any)?.response?.data?.message || 'Failed to load candidates. Please try again later.'}
              </p>
            </div>
          </CardContent>
        </Card>
      </div>
    )
  }

  return (
    <div className="space-y-8">
      {/* Header */}
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Candidates Management</h1>
          <p className="text-muted-foreground mt-2">
            Manage candidate registrations and election participation
          </p>
        </div>
        <div className="flex gap-2">
          <Button variant="outline" size="sm">
            <Upload className="h-4 w-4 mr-2" />
            Import
          </Button>
          <Button variant="outline" size="sm">
            <Download className="h-4 w-4 mr-2" />
            Export
          </Button>
          <Button asChild>
            <Link href="/admin/candidates/create">
              <Plus className="h-4 w-4 mr-2" />
              Add Candidate
            </Link>
          </Button>
        </div>
      </div>

      {/* Statistics Cards */}
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Candidates</CardTitle>
            <Users className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{totalCandidates}</div>
            <p className="text-xs text-muted-foreground">
              Across all elections
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Active Candidates</CardTitle>
            <UserCheck className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{activeCandidates}</div>
            <p className="text-xs text-muted-foreground">
              Currently participating
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Verified</CardTitle>
            <CheckCircle className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{verifiedCandidates}</div>
            <p className="text-xs text-muted-foreground">
              Completed verification
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Votes</CardTitle>
            <Award className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{totalVotes}</div>
            <p className="text-xs text-muted-foreground">
              Votes received
            </p>
          </CardContent>
        </Card>
      </div>

      {/* Filters and Search */}
      <Card>
        <CardHeader>
          <CardTitle>Candidate Directory</CardTitle>
          <CardDescription>
            Search and filter candidates by various criteria
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="flex flex-col sm:flex-row gap-4 mb-6">
            <div className="flex-1">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-4 w-4" />
                <Input
                  placeholder="Search candidates by name, email, student ID, or position..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="pl-10"
                />
              </div>
            </div>
            <Select value={statusFilter} onValueChange={setStatusFilter}>
              <SelectTrigger className="w-full sm:w-[150px]">
                <SelectValue placeholder="Status" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Status</SelectItem>
                <SelectItem value={CandidateStatus.APPROVED}>Approved</SelectItem>
                <SelectItem value={CandidateStatus.PENDING}>Pending</SelectItem>
                <SelectItem value={CandidateStatus.REJECTED}>Rejected</SelectItem>
                <SelectItem value={CandidateStatus.DISQUALIFIED}>Disqualified</SelectItem>
                <SelectItem value={CandidateStatus.WITHDRAWN}>Withdrawn</SelectItem>
              </SelectContent>
            </Select>
            <Select value={selectedElection} onValueChange={setSelectedElection}>
              <SelectTrigger className="w-full sm:w-[200px]">
                <SelectValue placeholder="Select Election" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Elections</SelectItem>
                {Array.isArray(electionsData) && electionsData.map((election: any) => (
                  <SelectItem key={election.id} value={election.id}>
                    {election.title}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          {/* Candidates Table */}
          <div className="rounded-md border">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Candidate</TableHead>
                  <TableHead>Position</TableHead>
                  <TableHead>Election</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead>Votes</TableHead>
                  <TableHead>Verified</TableHead>
                  <TableHead className="text-right">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {isLoading ? (
                  <TableRow>
                    <TableCell colSpan={7} className="text-center py-8">
                      <div className="flex items-center justify-center space-x-2">
                        <Loader2 className="h-4 w-4 animate-spin" />
                        <span>Loading candidates...</span>
                      </div>
                    </TableCell>
                  </TableRow>
                ) : filteredCandidates.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={7} className="text-center py-8">
                      <Users className="h-12 w-12 text-gray-400 mx-auto mb-4" />
                      <h3 className="text-lg font-medium text-gray-900 mb-2">No candidates found</h3>
                      <p className="text-gray-500">
                        {selectedElection === 'all'
                          ? 'Select an election to view candidates.'
                          : 'Try adjusting your search criteria or filters.'
                        }
                      </p>
                    </TableCell>
                  </TableRow>
                ) : (
                  filteredCandidates.map((candidate) => (
                    <TableRow key={candidate.id}>
                    <TableCell>
                      <div className="flex items-center space-x-3">
                        <Avatar className="h-8 w-8">
                          <AvatarImage src={candidate.photo} />
                          <AvatarFallback className="bg-blue-100 text-blue-700">
                            {getInitials(candidate.firstName, candidate.lastName)}
                          </AvatarFallback>
                        </Avatar>
                        <div>
                          <div className="font-medium">
                            {candidate.firstName} {candidate.lastName}
                          </div>
                          <div className="text-sm text-muted-foreground">
                            {candidate.user?.studentId || candidate.email} • {candidate.department}
                          </div>
                        </div>
                      </div>
                    </TableCell>
                    <TableCell>
                      <div>
                        <div className="font-medium">{candidate.position?.name}</div>
                        <div className="text-sm text-muted-foreground">{candidate.faculty}</div>
                      </div>
                    </TableCell>
                    <TableCell>
                      <div>
                        <div className="font-medium text-sm">{candidate.election?.title}</div>
                        <Badge
                          variant="secondary"
                          className={cn("text-xs", getElectionStatusColor(candidate.election?.status || 'DRAFT'))}
                        >
                          {candidate.election?.status}
                        </Badge>
                      </div>
                    </TableCell>
                    <TableCell>
                      <Badge
                        variant="secondary"
                        className={cn(getStatusColor(candidate.status))}
                      >
                        {candidate.status}
                      </Badge>
                    </TableCell>
                    <TableCell>
                      <div className="font-medium">{candidate.votes?.length || 0}</div>
                    </TableCell>
                    <TableCell>
                      {candidate.verifiedAt ? (
                        <CheckCircle className="h-4 w-4 text-green-600" />
                      ) : (
                        <XCircle className="h-4 w-4 text-red-600" />
                      )}
                    </TableCell>
                    <TableCell className="text-right">
                      <DropdownMenu>
                        <DropdownMenuTrigger asChild>
                          <Button variant="ghost" className="h-8 w-8 p-0">
                            <MoreHorizontal className="h-4 w-4" />
                          </Button>
                        </DropdownMenuTrigger>
                        <DropdownMenuContent align="end">
                          <DropdownMenuLabel>Actions</DropdownMenuLabel>
                          <DropdownMenuItem onClick={() => handleViewCandidate(candidate)}>
                            <Eye className="mr-2 h-4 w-4" />
                            View Details
                          </DropdownMenuItem>
                          <DropdownMenuItem asChild>
                            <Link href={`/admin/candidates/${candidate.id}/edit`}>
                              <Edit className="mr-2 h-4 w-4" />
                              Edit
                            </Link>
                          </DropdownMenuItem>
                          <DropdownMenuSeparator />
                          {candidate.status === CandidateStatus.APPROVED ? (
                            <DropdownMenuItem onClick={() => handleStatusChange(candidate.id, CandidateStatus.WITHDRAWN)}>
                              <XCircle className="mr-2 h-4 w-4" />
                              Withdraw
                            </DropdownMenuItem>
                          ) : (
                            <DropdownMenuItem onClick={() => handleApproveCandidate(candidate.id)}>
                              <CheckCircle className="mr-2 h-4 w-4" />
                              Approve
                            </DropdownMenuItem>
                          )}
                          <DropdownMenuSeparator />
                          <DropdownMenuItem onClick={() => handleRejectCandidate(candidate.id, 'Administrative action')}>
                            <XCircle className="mr-2 h-4 w-4" />
                            Reject
                          </DropdownMenuItem>
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

      {/* View Candidate Dialog */}
      <Dialog open={isViewDialogOpen} onOpenChange={setIsViewDialogOpen}>
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle>Candidate Details</DialogTitle>
            <DialogDescription>
              Complete information about the selected candidate
            </DialogDescription>
          </DialogHeader>
          {selectedCandidate && (
            <div className="space-y-6">
              {/* Basic Info */}
              <div className="flex items-start space-x-4">
                <Avatar className="h-16 w-16">
                  <AvatarImage src={selectedCandidate.photo} />
                  <AvatarFallback className="bg-blue-100 text-blue-700 text-lg">
                    {getInitials(selectedCandidate.firstName, selectedCandidate.lastName)}
                  </AvatarFallback>
                </Avatar>
                <div className="flex-1">
                  <h3 className="text-xl font-semibold">
                    {selectedCandidate.firstName} {selectedCandidate.lastName}
                  </h3>
                  <p className="text-gray-600">{selectedCandidate.email}</p>
                  <p className="text-gray-600">{selectedCandidate.user?.studentId || selectedCandidate.email}</p>
                  <div className="flex items-center gap-2 mt-2">
                    <Badge className={cn(getStatusColor(selectedCandidate.status))}>
                      {selectedCandidate.status}
                    </Badge>
                    {selectedCandidate.verifiedAt && (
                      <Badge className="bg-green-100 text-green-800">Verified</Badge>
                    )}
                  </div>
                </div>
              </div>

              {/* Election Info */}
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <h4 className="font-medium text-gray-900">Position</h4>
                  <p className="text-gray-600">{selectedCandidate.position?.name}</p>
                </div>
                <div>
                  <h4 className="font-medium text-gray-900">Election</h4>
                  <p className="text-gray-600">{selectedCandidate.election?.title}</p>
                </div>
                <div>
                  <h4 className="font-medium text-gray-900">Department</h4>
                  <p className="text-gray-600">{selectedCandidate.department}</p>
                </div>
                <div>
                  <h4 className="font-medium text-gray-900">Faculty</h4>
                  <p className="text-gray-600">{selectedCandidate.faculty}</p>
                </div>
              </div>

              {/* Manifesto */}
              {selectedCandidate.manifesto && (
                <div>
                  <h4 className="font-medium text-gray-900 mb-2">Manifesto</h4>
                  <p className="text-gray-600 bg-gray-50 p-3 rounded-md">
                    {selectedCandidate.manifesto}
                  </p>
                </div>
              )}

              {selectedCandidate.slogan && (
                <div>
                  <h4 className="font-medium text-gray-900 mb-2">Slogan</h4>
                  <p className="text-gray-600 bg-blue-50 p-3 rounded-md font-medium">
                    "{selectedCandidate.slogan}"
                  </p>
                </div>
              )}

              {/* Votes */}
              <div className="bg-blue-50 p-4 rounded-md">
                <div className="flex items-center justify-between">
                  <div>
                    <h4 className="font-medium text-blue-900">Current Votes</h4>
                    <p className="text-blue-700">Votes received so far</p>
                  </div>
                  <div className="text-2xl font-bold text-blue-900">
                    {selectedCandidate.votes?.length || 0}
                  </div>
                </div>
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>
    </div>
  )
}