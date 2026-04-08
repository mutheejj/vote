// frontend/app/admin/applications/page.tsx
"use client"

import React, { useState, useMemo } from 'react'
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
import { Textarea } from '@/components/ui/textarea'
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
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu'
import { Alert, AlertDescription } from '@/components/ui/alert'
import {
  UserCheck,
  Search,
  MoreHorizontal,
  Eye,
  CheckCircle,
  XCircle,
  AlertCircle,
  Loader2,
  Users,
  Clock,
  UserX,
  RefreshCw,
} from 'lucide-react'
import { useAuth } from '@/lib/hooks/useAuth'
import { useNotifications } from '@/lib/hooks/useNotifications'
import { cn } from '@/lib/utils/cn'
import { NotificationType } from '@/lib/enums'
import formatters from '@/lib/utils/formatters'
import {
  getAllApplications,
  approveApplication,
  rejectApplication,
  getApplicationStats,
  CandidateApplication
} from '@/lib/api/candidatePreRegistration'

interface ReviewModalData {
  application: CandidateApplication
  action: 'approve' | 'reject'
}

export default function AdminApplicationsPage() {
  const { user } = useAuth()
  const { addNotification } = useNotifications()
  const queryClient = useQueryClient()

  const [searchTerm, setSearchTerm] = useState('')
  const [statusFilter, setStatusFilter] = useState<string>('all')
  const [facultyFilter, setFacultyFilter] = useState<string>('all')

  const [selectedApplication, setSelectedApplication] = useState<CandidateApplication | null>(null)
  const [isViewDialogOpen, setIsViewDialogOpen] = useState(false)
  const [isReviewDialogOpen, setIsReviewDialogOpen] = useState(false)
  const [reviewModalData, setReviewModalData] = useState<ReviewModalData | null>(null)
  const [reviewNotes, setReviewNotes] = useState('')
  const [rejectionReason, setRejectionReason] = useState('')

  // Fetch applications statistics
  const { data: statsData } = useQuery({
    queryKey: ['application-stats'],
    queryFn: async () => {
      const response = await getApplicationStats()
      return response.data
    }
  })

  const stats = statsData?.data

  // Fetch all applications
  const { data: applicationsData, isLoading, error, refetch } = useQuery({
    queryKey: ['candidate-applications', statusFilter, facultyFilter],
    queryFn: async () => {
      const params: any = {}
      if (statusFilter !== 'all') params.status = statusFilter
      if (facultyFilter !== 'all') params.faculty = facultyFilter

      const response = await getAllApplications(params)
      console.log('API Response:', response.data) // Debug log
      return response.data
    }
  })

  // Fix: Correctly extract applications array from API response
  const applications = applicationsData?.data || []

  console.log('Applications extracted:', applications) // Debug log

  // Use useMemo for filtering instead of useEffect
  const filteredApplications = useMemo(() => {
    let filtered = applications

    if (searchTerm) {
      filtered = filtered.filter(app =>
        `${app.firstName} ${app.lastName}`.toLowerCase().includes(searchTerm.toLowerCase()) ||
        app.email.toLowerCase().includes(searchTerm.toLowerCase()) ||
        app.studentId.toLowerCase().includes(searchTerm.toLowerCase()) ||
        app.intendedPosition.toLowerCase().includes(searchTerm.toLowerCase()) ||
        app.election?.title?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        app.position?.name?.toLowerCase().includes(searchTerm.toLowerCase())
      )
    }

    return filtered
  }, [applications, searchTerm])

  // Mutation for approving application
  const approveMutation = useMutation({
    mutationFn: ({ id, notes }: { id: string, notes?: string }) =>
      approveApplication(id, notes),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['candidate-applications'] })
      queryClient.invalidateQueries({ queryKey: ['application-stats'] })
      addNotification({
        type: NotificationType.SUCCESS,
        title: 'Success',
        message: 'Application approved successfully. Registration link sent to candidate.',
      })
      setIsReviewDialogOpen(false)
      setReviewNotes('')
      setReviewModalData(null)
    },
    onError: (error: any) => {
      // Still invalidate queries to refresh data even on error
      queryClient.invalidateQueries({ queryKey: ['candidate-applications'] })
      queryClient.invalidateQueries({ queryKey: ['application-stats'] })
      addNotification({
        type: NotificationType.ERROR,
        title: 'Error',
        message: error.response?.data?.message || 'Failed to approve application',
      })
      setIsReviewDialogOpen(false)
      setReviewModalData(null)
    },
    onSettled: () => {
      // This runs whether success or error - ensures UI updates
      queryClient.invalidateQueries({ queryKey: ['candidate-applications'] })
    }
  })

  // Mutation for rejecting application
  const rejectMutation = useMutation({
    mutationFn: ({ id, reason }: { id: string, reason: string }) =>
      rejectApplication(id, reason),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['candidate-applications'] })
      queryClient.invalidateQueries({ queryKey: ['application-stats'] })
      addNotification({
        type: NotificationType.SUCCESS,
        title: 'Success',
        message: 'Application rejected successfully. Notification sent to applicant.',
      })
      setIsReviewDialogOpen(false)
      setRejectionReason('')
      setReviewModalData(null)
    },
    onError: (error: any) => {
      // Still invalidate queries to refresh data even on error
      queryClient.invalidateQueries({ queryKey: ['candidate-applications'] })
      queryClient.invalidateQueries({ queryKey: ['application-stats'] })
      addNotification({
        type: NotificationType.ERROR,
        title: 'Error',
        message: error.response?.data?.message || 'Failed to reject application',
      })
      setIsReviewDialogOpen(false)
      setReviewModalData(null)
    },
    onSettled: () => {
      // This runs whether success or error - ensures UI updates
      queryClient.invalidateQueries({ queryKey: ['candidate-applications'] })
    }
  })

  const handleViewApplication = (application: CandidateApplication) => {
    setSelectedApplication(application)
    setIsViewDialogOpen(true)
  }

  const handleOpenReviewDialog = (application: CandidateApplication, action: 'approve' | 'reject') => {
    setReviewModalData({ application, action })
    setIsReviewDialogOpen(true)
    setReviewNotes('')
    setRejectionReason('')
  }

  const handleSubmitReview = () => {
    if (!reviewModalData) return

    if (reviewModalData.action === 'approve') {
      approveMutation.mutate({
        id: reviewModalData.application.id,
        notes: reviewNotes
      })
    } else {
      if (!rejectionReason.trim()) {
        addNotification({
          type: NotificationType.ERROR,
          title: 'Error',
          message: 'Please provide a rejection reason',
        })
        return
      }
      rejectMutation.mutate({
        id: reviewModalData.application.id,
        reason: rejectionReason
      })
    }
  }

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'APPROVED':
        return 'bg-green-100 text-green-800'
      case 'PENDING':
        return 'bg-yellow-100 text-yellow-800'
      case 'REJECTED':
        return 'bg-red-100 text-red-800'
      case 'REGISTERED':
        return 'bg-blue-100 text-blue-800'
      case 'EXPIRED':
        return 'bg-gray-100 text-gray-800'
      default:
        return 'bg-gray-100 text-gray-800'
    }
  }

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'APPROVED':
        return <CheckCircle className="h-4 w-4 text-green-600" />
      case 'PENDING':
        return <Clock className="h-4 w-4 text-yellow-600" />
      case 'REJECTED':
        return <XCircle className="h-4 w-4 text-red-600" />
      case 'REGISTERED':
        return <UserCheck className="h-4 w-4 text-blue-600" />
      case 'EXPIRED':
        return <AlertCircle className="h-4 w-4 text-gray-600" />
      default:
        return <AlertCircle className="h-4 w-4 text-gray-600" />
    }
  }

  const handleRefresh = () => {
    refetch()
    addNotification({
      type: NotificationType.SUCCESS,
      title: 'Refreshed',
      message: 'Applications data updated'
    })
  }

  if (error) {
    return (
      <div className="space-y-8">
        <div className="flex justify-between items-center">
          <div>
            <h1 className="text-3xl font-bold tracking-tight">Candidate Applications</h1>
            <p className="text-muted-foreground mt-2">
              Review and manage candidate applications
            </p>
          </div>
        </div>
        <Alert variant="destructive">
          <AlertCircle className="h-4 w-4" />
          <AlertDescription>
            {(error as any)?.response?.data?.message || 'Failed to load applications. Please try again later.'}
          </AlertDescription>
        </Alert>
      </div>
    )
  }

  return (
    <div className="space-y-8">
      {/* Header */}
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Candidate Applications</h1>
          <p className="text-muted-foreground mt-2">
            Review and manage candidate applications for upcoming elections
          </p>
        </div>
        <Button
          variant="outline"
          size="sm"
          onClick={handleRefresh}
          disabled={isLoading}
        >
          <RefreshCw className={cn("h-4 w-4 mr-2", isLoading && "animate-spin")} />
          Refresh
        </Button>
      </div>

      {/* Statistics Cards */}
      {stats && (
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-5">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Total Applications</CardTitle>
              <Users className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{stats.total}</div>
              <p className="text-xs text-muted-foreground">All time applications</p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Pending Review</CardTitle>
              <Clock className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{stats.pending}</div>
              <p className="text-xs text-muted-foreground">Awaiting action</p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Approved</CardTitle>
              <CheckCircle className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{stats.approved}</div>
              <p className="text-xs text-muted-foreground">Registration sent</p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Registered</CardTitle>
              <UserCheck className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{stats.registered}</div>
              <p className="text-xs text-muted-foreground">Completed signup</p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Rejected</CardTitle>
              <UserX className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{stats.rejected}</div>
              <p className="text-xs text-muted-foreground">Not approved</p>
            </CardContent>
          </Card>
        </div>
      )}

      {/* Filters and Search */}
      <Card>
        <CardHeader>
          <CardTitle>Application Directory</CardTitle>
          <CardDescription>
            Search and filter candidate applications by various criteria
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="flex flex-col sm:flex-row gap-4 mb-6">
            <div className="flex-1">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-4 w-4" />
                <Input
                  placeholder="Search by name, email, student ID, position, or election..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="pl-10"
                />
              </div>
            </div>
            <Select value={statusFilter} onValueChange={setStatusFilter}>
              <SelectTrigger className="w-full sm:w-[180px]">
                <SelectValue placeholder="Status" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Status</SelectItem>
                <SelectItem value="PENDING">Pending</SelectItem>
                <SelectItem value="APPROVED">Approved</SelectItem>
                <SelectItem value="REJECTED">Rejected</SelectItem>
                <SelectItem value="REGISTERED">Registered</SelectItem>
                <SelectItem value="EXPIRED">Expired</SelectItem>
              </SelectContent>
            </Select>
            <Select value={facultyFilter} onValueChange={setFacultyFilter}>
              <SelectTrigger className="w-full sm:w-[200px]">
                <SelectValue placeholder="Faculty" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Faculties</SelectItem>
                <SelectItem value="School of Engineering">School of Engineering</SelectItem>
                <SelectItem value="School of Computing and Information Technology">SCIT</SelectItem>
                <SelectItem value="School of Agriculture and Biotechnology">SAB</SelectItem>
                <SelectItem value="School of Health Sciences">SHS</SelectItem>
              </SelectContent>
            </Select>
          </div>

          {/* Applications Table */}
          <div className="rounded-md border">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Applicant</TableHead>
                  <TableHead>Election</TableHead>
                  <TableHead>Position</TableHead>
                  <TableHead>Faculty</TableHead>
                  <TableHead>Year</TableHead>
                  <TableHead>Applied</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead className="text-right">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {isLoading ? (
                  <TableRow>
                    <TableCell colSpan={8} className="text-center py-8">
                      <div className="flex items-center justify-center space-x-2">
                        <Loader2 className="h-4 w-4 animate-spin" />
                        <span>Loading applications...</span>
                      </div>
                    </TableCell>
                  </TableRow>
                ) : filteredApplications.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={8} className="text-center py-8">
                      <Users className="h-12 w-12 text-gray-400 mx-auto mb-4" />
                      <h3 className="text-lg font-medium text-gray-900 mb-2">No applications found</h3>
                      <p className="text-gray-500">
                        {applications.length === 0 
                          ? 'No applications have been submitted yet.'
                          : 'Try adjusting your search criteria or filters.'}
                      </p>
                    </TableCell>
                  </TableRow>
                ) : (
                  filteredApplications.map((application) => (
                    <TableRow key={application.id}>
                      <TableCell>
                        <div>
                          <div className="font-medium">
                            {application.firstName} {application.lastName}
                          </div>
                          <div className="text-sm text-muted-foreground">
                            {application.studentId} • {application.email}
                          </div>
                        </div>
                      </TableCell>
                      <TableCell>
                        {application.election ? (
                          <div>
                            <div className="font-medium text-sm">{application.election.title}</div>
                            <Badge variant="outline" className="text-xs mt-1">
                              {application.election.status}
                            </Badge>
                          </div>
                        ) : (
                          <span className="text-sm text-muted-foreground">Not specified</span>
                        )}
                      </TableCell>
                      <TableCell>
                        {application.position ? (
                          <div className="font-medium text-sm">{application.position.name}</div>
                        ) : (
                          <div className="font-medium text-sm">{application.intendedPosition}</div>
                        )}
                      </TableCell>
                      <TableCell>
                        <div>
                          <div className="text-sm">{application.faculty}</div>
                          <div className="text-xs text-muted-foreground">{application.department}</div>
                        </div>
                      </TableCell>
                      <TableCell>
                        <div className="text-sm">Year {application.yearOfStudy}</div>
                      </TableCell>
                      <TableCell>
                        <div className="text-sm text-muted-foreground">
                          {formatters.formatDate(application.createdAt)}
                        </div>
                      </TableCell>
                      <TableCell>
                        <div className="flex items-center gap-2">
                          {getStatusIcon(application.status)}
                          <Badge
                            variant="secondary"
                            className={cn(getStatusColor(application.status))}
                          >
                            {application.status}
                          </Badge>
                        </div>
                      </TableCell>
                      <TableCell className="text-right">
                        <DropdownMenu>
                          <DropdownMenuTrigger asChild>
                            <Button
                              variant="ghost"
                              className="h-8 w-8 p-0"
                              disabled={approveMutation.isPending || rejectMutation.isPending}
                            >
                              <MoreHorizontal className="h-4 w-4" />
                            </Button>
                          </DropdownMenuTrigger>
                          <DropdownMenuContent align="end">
                            <DropdownMenuLabel>Actions</DropdownMenuLabel>
                            <DropdownMenuItem
                              onClick={() => handleViewApplication(application)}
                              disabled={approveMutation.isPending || rejectMutation.isPending}
                            >
                              <Eye className="mr-2 h-4 w-4" />
                              View Details
                            </DropdownMenuItem>
                            {application.status === 'PENDING' && (
                              <>
                                <DropdownMenuSeparator />
                                <DropdownMenuItem
                                  onClick={() => handleOpenReviewDialog(application, 'approve')}
                                  disabled={approveMutation.isPending || rejectMutation.isPending}
                                >
                                  <CheckCircle className="mr-2 h-4 w-4 text-green-600" />
                                  Approve
                                </DropdownMenuItem>
                                <DropdownMenuItem
                                  onClick={() => handleOpenReviewDialog(application, 'reject')}
                                  disabled={approveMutation.isPending || rejectMutation.isPending}
                                >
                                  <XCircle className="mr-2 h-4 w-4 text-red-600" />
                                  Reject
                                </DropdownMenuItem>
                              </>
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

      {/* View Application Dialog */}
      <Dialog open={isViewDialogOpen} onOpenChange={setIsViewDialogOpen}>
        <DialogContent className="max-w-3xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Application Details</DialogTitle>
            <DialogDescription>
              Complete information about the candidate application
            </DialogDescription>
          </DialogHeader>
          {selectedApplication && (
            <div className="space-y-6">
              {/* Header with Status */}
              <div className="flex items-start justify-between">
                <div>
                  <h3 className="text-xl font-semibold">
                    {selectedApplication.firstName} {selectedApplication.middleName} {selectedApplication.lastName}
                  </h3>
                  <p className="text-gray-600 mt-1">{selectedApplication.email}</p>
                  <p className="text-gray-600">{selectedApplication.studentId}</p>
                </div>
                <Badge className={cn(getStatusColor(selectedApplication.status))}>
                  {selectedApplication.status}
                </Badge>
              </div>

              {/* Academic Information */}
              <div className="grid grid-cols-2 gap-4 bg-gray-50 p-4 rounded-lg">
                <div>
                  <h4 className="font-medium text-gray-900 text-sm">Faculty</h4>
                  <p className="text-gray-700 mt-1">{selectedApplication.faculty}</p>
                </div>
                <div>
                  <h4 className="font-medium text-gray-900 text-sm">Department</h4>
                  <p className="text-gray-700 mt-1">{selectedApplication.department}</p>
                </div>
                <div>
                  <h4 className="font-medium text-gray-900 text-sm">Course</h4>
                  <p className="text-gray-700 mt-1">{selectedApplication.course}</p>
                </div>
                <div>
                  <h4 className="font-medium text-gray-900 text-sm">Year of Study</h4>
                  <p className="text-gray-700 mt-1">Year {selectedApplication.yearOfStudy}</p>
                </div>
                {selectedApplication.phone && (
                  <div>
                    <h4 className="font-medium text-gray-900 text-sm">Phone</h4>
                    <p className="text-gray-700 mt-1">{selectedApplication.phone}</p>
                  </div>
                )}
              </div>

              {/* Election & Position Information */}
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <h4 className="font-medium text-gray-900 mb-2">Election</h4>
                  <div className="bg-blue-50 p-3 rounded-md">
                    {selectedApplication.election ? (
                      <>
                        <p className="text-blue-900 font-medium">{selectedApplication.election.title}</p>
                        <Badge variant="outline" className="mt-2">
                          {selectedApplication.election.status}
                        </Badge>
                      </>
                    ) : (
                      <p className="text-gray-600 text-sm">No election specified</p>
                    )}
                  </div>
                </div>
                <div>
                  <h4 className="font-medium text-gray-900 mb-2">Position Applied For</h4>
                  <div className="bg-sage-50 p-3 rounded-md">
                    {selectedApplication.position ? (
                      <p className="text-sage-900 font-medium">{selectedApplication.position.name}</p>
                    ) : (
                      <p className="text-sage-900 font-medium">{selectedApplication.intendedPosition}</p>
                    )}
                  </div>
                </div>
              </div>

              {/* Reason/Motivation */}
              <div>
                <h4 className="font-medium text-gray-900 mb-2">Motivation & Qualifications</h4>
                <div className="bg-blue-50 p-4 rounded-md">
                  <p className="text-gray-800 whitespace-pre-wrap">{selectedApplication.reason}</p>
                </div>
              </div>

              {/* Review Information */}
              {selectedApplication.reviewedAt && (
                <div className="border-t pt-4">
                  <h4 className="font-medium text-gray-900 mb-2">Review Information</h4>
                  <div className="space-y-2 text-sm">
                    <div className="flex justify-between">
                      <span className="text-gray-600">Reviewed By:</span>
                      <span className="font-medium">
                        {selectedApplication.reviewer?.firstName} {selectedApplication.reviewer?.lastName}
                      </span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-gray-600">Reviewed At:</span>
                      <span className="font-medium">{formatters.formatDateTime(selectedApplication.reviewedAt)}</span>
                    </div>
                    {selectedApplication.reviewNotes && (
                      <div>
                        <span className="text-gray-600">Notes:</span>
                        <p className="mt-1 p-2 bg-gray-100 rounded">{selectedApplication.reviewNotes}</p>
                      </div>
                    )}
                    {selectedApplication.rejectionReason && (
                      <div>
                        <span className="text-gray-600">Rejection Reason:</span>
                        <p className="mt-1 p-2 bg-red-50 text-red-800 rounded">{selectedApplication.rejectionReason}</p>
                      </div>
                    )}
                  </div>
                </div>
              )}

              {/* Application Timeline */}
              <div className="border-t pt-4">
                <h4 className="font-medium text-gray-900 mb-2">Timeline</h4>
                <div className="space-y-2 text-sm">
                  <div className="flex justify-between">
                    <span className="text-gray-600">Applied:</span>
                    <span className="font-medium">{formatters.formatDateTime(selectedApplication.createdAt)}</span>
                  </div>
                  {selectedApplication.approvalToken && selectedApplication.tokenExpiry && (
                    <div className="flex justify-between">
                      <span className="text-gray-600">Token Expires:</span>
                      <span className="font-medium">{formatters.formatDateTime(selectedApplication.tokenExpiry)}</span>
                    </div>
                  )}
                </div>
              </div>

              {/* Action Buttons */}
              {selectedApplication.status === 'PENDING' && (
                <div className="flex gap-2 border-t pt-4">
                  <Button
                    variant="default"
                    className="flex-1 bg-green-600 hover:bg-green-700"
                    onClick={() => {
                      setIsViewDialogOpen(false)
                      handleOpenReviewDialog(selectedApplication, 'approve')
                    }}
                  >
                    <CheckCircle className="mr-2 h-4 w-4" />
                    Approve Application
                  </Button>
                  <Button
                    variant="destructive"
                    className="flex-1"
                    onClick={() => {
                      setIsViewDialogOpen(false)
                      handleOpenReviewDialog(selectedApplication, 'reject')
                    }}
                  >
                    <XCircle className="mr-2 h-4 w-4" />
                    Reject Application
                  </Button>
                </div>
              )}
            </div>
          )}
        </DialogContent>
      </Dialog>

      {/* Review Dialog */}
      <Dialog open={isReviewDialogOpen} onOpenChange={setIsReviewDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>
              {reviewModalData?.action === 'approve' ? 'Approve Application' : 'Reject Application'}
            </DialogTitle>
            <DialogDescription>
              {reviewModalData?.action === 'approve'
                ? 'Approving this application will send a registration link to the candidate via email.'
                : 'Please provide a reason for rejecting this application. The candidate will be notified.'}
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4">
            {reviewModalData?.application && (
              <div className="bg-gray-50 p-3 rounded-md">
                <p className="font-medium">
                  {reviewModalData.application.firstName} {reviewModalData.application.lastName}
                </p>
                <p className="text-sm text-gray-600">{reviewModalData.application.intendedPosition}</p>
              </div>
            )}
            {reviewModalData?.action === 'approve' ? (
              <div>
                <label className="text-sm font-medium">Review Notes (Optional)</label>
                <Textarea
                  value={reviewNotes}
                  onChange={(e) => setReviewNotes(e.target.value)}
                  placeholder="Add any internal notes about this approval..."
                  rows={3}
                  className="mt-1"
                />
              </div>
            ) : (
              <div>
                <label className="text-sm font-medium">Rejection Reason *</label>
                <Textarea
                  value={rejectionReason}
                  onChange={(e) => setRejectionReason(e.target.value)}
                  placeholder="Explain why this application is being rejected..."
                  rows={4}
                  className="mt-1"
                  required
                />
              </div>
            )}
          </div>
          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => setIsReviewDialogOpen(false)}
              disabled={approveMutation.isPending || rejectMutation.isPending}
            >
              Cancel
            </Button>
            <Button
              variant={reviewModalData?.action === 'approve' ? 'default' : 'destructive'}
              onClick={handleSubmitReview}
              disabled={approveMutation.isPending || rejectMutation.isPending}
            >
              {(approveMutation.isPending || rejectMutation.isPending) && (
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
              )}
              {reviewModalData?.action === 'approve' ? 'Approve & Send Link' : 'Reject Application'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  )
}