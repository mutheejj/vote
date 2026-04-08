"use client"

import React, { useState, useMemo, useCallback } from 'react'
import { useQuery } from '@tanstack/react-query'
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table'
import {
  Card,
  CardContent,
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
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu'
import { Checkbox } from '@/components/ui/checkbox'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import { LoadingSpinner } from '@/components/shared/LoadingSpinner'
import { useNotifications } from '@/lib/hooks/useNotifications'
import { cn } from '@/lib/utils/cn'
import  formatters  from '@/lib/utils/formatters'
import {
  Search,
  Filter,
  Download,
  Upload,
  MoreHorizontal,
  UserCheck,
  UserX,
  Edit,
  Trash2,
  Eye,
  RefreshCw,
  ChevronLeft,
  ChevronRight,
  ChevronsLeft,
  ChevronsRight,
  ArrowUpDown,
  ArrowUp,
  ArrowDown,
} from 'lucide-react'
import {
  SafeUser,
  PaginationParams,
  PaginatedResponse,
  ApiResponse,
} from '@/lib/types'
import {
  UserRole,
  USER_ROLE_LABELS,
  UNIVERSITY_FACULTIES,
  YEAR_OF_STUDY_OPTIONS,
  NotificationType,
} from '@/lib/enums'
import { API_ENDPOINTS } from '@/lib/constants'

interface VoterFilters {
  search?: string
  faculty?: string
  department?: string
  yearOfStudy?: number
  role?: UserRole
  isActive?: boolean
  isVerified?: boolean
  registrationDate?: {
    from: Date
    to: Date
  }
}

interface VoterTableProps {
  className?: string
  onVoterSelect?: (voter: SafeUser) => void
  onVoterUpdate?: (voter: SafeUser) => void
  selectable?: boolean
  compact?: boolean
}

interface VoterActionDialogProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  voter: SafeUser | null
  action: 'view' | 'edit' | 'activate' | 'deactivate' | 'delete'
  onConfirm: (reason?: string) => void
  loading?: boolean
}

const VoterActionDialog: React.FC<VoterActionDialogProps> = ({
  open,
  onOpenChange,
  voter,
  action,
  onConfirm,
  loading = false
}) => {
  const [reason, setReason] = useState('')

  const handleConfirm = () => {
    onConfirm(reason)
    setReason('')
    onOpenChange(false)
  }

  if (!voter) return null

  const getActionDetails = () => {
    switch (action) {
      case 'view':
        return {
          title: 'Voter Details',
          description: 'View voter information',
          requiresReason: false,
          destructive: false
        }
      case 'edit':
        return {
          title: 'Edit Voter',
          description: 'Edit voter information',
          requiresReason: false,
          destructive: false
        }
      case 'activate':
        return {
          title: 'Activate Voter',
          description: `Are you sure you want to activate ${voter.firstName} ${voter.lastName}?`,
          requiresReason: true,
          destructive: false
        }
      case 'deactivate':
        return {
          title: 'Deactivate Voter',
          description: `Are you sure you want to deactivate ${voter.firstName} ${voter.lastName}?`,
          requiresReason: true,
          destructive: true
        }
      case 'delete':
        return {
          title: 'Delete Voter',
          description: `Are you sure you want to permanently delete ${voter.firstName} ${voter.lastName}? This action cannot be undone.`,
          requiresReason: true,
          destructive: true
        }
      default:
        return {
          title: 'Confirm Action',
          description: 'Please confirm this action',
          requiresReason: false,
          destructive: false
        }
    }
  }

  const actionDetails = getActionDetails()

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[500px]">
        <DialogHeader>
          <DialogTitle>{actionDetails.title}</DialogTitle>
          <DialogDescription>
            {actionDetails.description}
          </DialogDescription>
        </DialogHeader>

        {action === 'view' && (
          <div className="grid gap-4 py-4">
            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label className="text-sm font-medium">Student ID</Label>
                <p className="text-sm text-muted-foreground">{voter.studentId}</p>
              </div>
              <div>
                <Label className="text-sm font-medium">Email</Label>
                <p className="text-sm text-muted-foreground">{voter.email}</p>
              </div>
              <div>
                <Label className="text-sm font-medium">Name</Label>
                <p className="text-sm text-muted-foreground">
                  {voter.firstName} {voter.middleName} {voter.lastName}
                </p>
              </div>
              <div>
                <Label className="text-sm font-medium">Phone</Label>
                <p className="text-sm text-muted-foreground">{voter.phone || 'N/A'}</p>
              </div>
              <div>
                <Label className="text-sm font-medium">Faculty</Label>
                <p className="text-sm text-muted-foreground">{voter.faculty}</p>
              </div>
              <div>
                <Label className="text-sm font-medium">Department</Label>
                <p className="text-sm text-muted-foreground">{voter.department}</p>
              </div>
              <div>
                <Label className="text-sm font-medium">Course</Label>
                <p className="text-sm text-muted-foreground">{voter.course}</p>
              </div>
              <div>
                <Label className="text-sm font-medium">Year of Study</Label>
                <p className="text-sm text-muted-foreground">{voter.yearOfStudy}</p>
              </div>
              <div>
                <Label className="text-sm font-medium">Role</Label>
                <Badge variant={voter.role === UserRole.ADMIN ? 'default' : 'secondary'}>
                  {USER_ROLE_LABELS[voter.role]}
                </Badge>
              </div>
              <div>
                <Label className="text-sm font-medium">Status</Label>
                <div className="flex gap-2">
                  <Badge variant={voter.isActive ? 'success' : 'destructive'}>
                    {voter.isActive ? 'Active' : 'Inactive'}
                  </Badge>
                  <Badge variant={voter.isVerified ? 'success' : 'warning'}>
                    {voter.isVerified ? 'Verified' : 'Unverified'}
                  </Badge>
                </div>
              </div>
            </div>
            <div>
              <Label className="text-sm font-medium">Registration Date</Label>
              <p className="text-sm text-muted-foreground">
                {formatters.formatDate(voter.createdAt)}
              </p>
            </div>
            {voter.lastLogin && (
              <div>
                <Label className="text-sm font-medium">Last Login</Label>
                <p className="text-sm text-muted-foreground">
                  {formatters.formatDateTime(voter.lastLogin)}
                </p>
              </div>
            )}
          </div>
        )}

        {actionDetails.requiresReason && (
          <div className="grid gap-2">
            <Label htmlFor="reason">Reason {actionDetails.destructive && '*'}</Label>
            <Textarea
              id="reason"
              placeholder="Enter reason for this action..."
              value={reason}
              onChange={(e) => setReason(e.target.value)}
              required={actionDetails.destructive}
            />
          </div>
        )}

        <DialogFooter>
          <Button
            variant="outline"
            onClick={() => onOpenChange(false)}
            disabled={loading}
          >
            Cancel
          </Button>
          {action !== 'view' && (
            <Button
              variant={actionDetails.destructive ? 'destructive' : 'default'}
              onClick={handleConfirm}
              disabled={loading || (actionDetails.destructive && !reason.trim())}
            >
              {loading && <LoadingSpinner className="w-4 h-4 mr-2" />}
              {action === 'delete' ? 'Delete' : 'Confirm'}
            </Button>
          )}
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}

export const VoterTable: React.FC<VoterTableProps> = ({
  className,
  onVoterSelect,
  onVoterUpdate,
  selectable = false,
  compact = false
}) => {
  const [filters, setFilters] = useState<VoterFilters>({})
  const [pagination, setPagination] = useState<PaginationParams>({
    page: 1,
    limit: 10,
    sortBy: 'createdAt',
    order: 'desc'
  })
  const [selectedVoters, setSelectedVoters] = useState<Set<string>>(new Set())
  const [actionDialog, setActionDialog] = useState<{
    open: boolean
    voter: SafeUser | null
    action: 'view' | 'edit' | 'activate' | 'deactivate' | 'delete'
  }>({
    open: false,
    voter: null,
    action: 'view'
  })
  const [actionLoading, setActionLoading] = useState(false)

  const { addNotification } = useNotifications()

  // Fetch voters with filters and pagination
  const {
    data: votersData,
    isLoading,
    error,
    refetch
  } = useQuery({
    queryKey: ['admin-voters', filters, pagination],
    queryFn: async (): Promise<PaginatedResponse<SafeUser>> => {
      const { getAllUsers } = await import('@/lib/api/admin')

      // Prepare params
      const params: any = {
        page: pagination.page,
        limit: pagination.limit,
      }

      // Add sorting params
      if (pagination.sortBy) params.sortBy = pagination.sortBy
      if (pagination.order) params.order = pagination.order

      // Add filter params
      if (filters.search) params.search = filters.search
      if (filters.faculty && filters.faculty !== 'all') params.faculty = filters.faculty
      if (filters.department) params.department = filters.department
      if (filters.yearOfStudy) params.yearOfStudy = filters.yearOfStudy
      if (filters.role && (filters.role as string) !== 'all') params.role = filters.role
      if (filters.isActive !== undefined) params.isActive = filters.isActive
      if (filters.isVerified !== undefined) params.isVerified = filters.isVerified

      const response = await getAllUsers(params)

      if (!response.data.success || !response.data.data) {
        throw new Error(response.data.error || 'Failed to fetch voters')
      }

      return response.data.data
    }
  })

  const handleFilterChange = useCallback((key: keyof VoterFilters, value: any) => {
    setFilters(prev => ({ ...prev, [key]: value }))
    setPagination(prev => ({ ...prev, page: 1 })) // Reset to first page
  }, [])

  const handleSort = useCallback((column: string) => {
    setPagination(prev => ({
      ...prev,
      sortBy: column,
      order: prev.sortBy === column && prev.order === 'asc' ? 'desc' : 'asc',
      page: 1
    }))
  }, [])

  const handlePageChange = useCallback((page: number) => {
    setPagination(prev => ({ ...prev, page }))
  }, [])

  const handleVoterAction = useCallback(async (
    voter: SafeUser,
    action: 'activate' | 'deactivate' | 'delete',
    reason?: string
  ) => {
    setActionLoading(true)
    try {
      let endpoint = ''
      let method = 'PUT'
      let body: any = { reason }

      switch (action) {
        case 'activate':
        case 'deactivate':
          endpoint = API_ENDPOINTS.ADMIN.UPDATE_USER_STATUS(voter.id)
          body.isActive = action === 'activate'
          break
        case 'delete':
          endpoint = API_ENDPOINTS.ADMIN.DELETE_USER(voter.id)
          method = 'DELETE'
          break
      }

      const response = await fetch(endpoint, {
        method,
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(body)
      })

      if (!response.ok) {
        throw new Error(`Failed to ${action} voter`)
      }

      const result: ApiResponse = await response.json()
      if (!result.success) {
        throw new Error(result.error || `Failed to ${action} voter`)
      }

      addNotification({
        type: NotificationType.SUCCESS,
        title: 'Success',
        message: `Voter ${action}d successfully`
      })

      refetch()
      onVoterUpdate?.(voter)
    } catch (error) {
      addNotification({
        type: NotificationType.ERROR,
        title: 'Error',
        message: error instanceof Error ? error.message : `Failed to ${action} voter`
      })
    } finally {
      setActionLoading(false)
    }
  }, [addNotification, refetch, onVoterUpdate])

  const handleSelectAll = useCallback((checked: boolean) => {
    if (checked && votersData?.data) {
      setSelectedVoters(new Set(votersData.data.map(voter => voter.id)))
    } else {
      setSelectedVoters(new Set())
    }
  }, [votersData?.data])

  const handleSelectVoter = useCallback((voterId: string, checked: boolean) => {
    setSelectedVoters(prev => {
      const newSet = new Set(prev)
      if (checked) {
        newSet.add(voterId)
      } else {
        newSet.delete(voterId)
      }
      return newSet
    })
  }, [])

  const getSortIcon = (column: string) => {
    if (pagination.sortBy !== column) {
      return <ArrowUpDown className="w-4 h-4" />
    }
    return pagination.order === 'asc' ?
      <ArrowUp className="w-4 h-4" /> :
      <ArrowDown className="w-4 h-4" />
  }

  const totalPages = votersData?.pagination ? Math.ceil(votersData.pagination.total / votersData.pagination.limit) : 1
  const isAllSelected = votersData?.data && votersData.data.length > 0 &&
    votersData.data.every(voter => selectedVoters.has(voter.id))

  if (error) {
    return (
      <Card className={className}>
        <CardContent className="py-8">
          <div className="text-center text-red-600">
            Error loading voters: {error instanceof Error ? error.message : 'Unknown error'}
          </div>
        </CardContent>
      </Card>
    )
  }

  return (
    <div className={cn("space-y-4", className)}>
      {/* Filters */}
      <Card>
        <CardHeader className="pb-4">
          <CardTitle className="flex items-center gap-2">
            <Filter className="w-5 h-5" />
            Filters
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
            <div>
              <Label htmlFor="search">Search</Label>
              <div className="relative">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                <Input
                  id="search"
                  placeholder="Search voters..."
                  value={filters.search || ''}
                  onChange={(e) => handleFilterChange('search', e.target.value)}
                  className="pl-10"
                />
              </div>
            </div>

            <div>
              <Label htmlFor="faculty">Faculty</Label>
              <Select
                value={filters.faculty || 'all'}
                onValueChange={(value) => handleFilterChange('faculty', value === 'all' ? undefined : value)}
              >
                <SelectTrigger>
                  <SelectValue placeholder="All faculties" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All faculties</SelectItem>
                  {UNIVERSITY_FACULTIES.map(faculty => (
                    <SelectItem key={faculty} value={faculty}>
                      {faculty}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div>
              <Label htmlFor="role">Role</Label>
              <Select
                value={filters.role || 'all'}
                onValueChange={(value) => handleFilterChange('role', value === 'all' ? undefined : value)}
              >
                <SelectTrigger>
                  <SelectValue placeholder="All roles" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All roles</SelectItem>
                  {Object.entries(USER_ROLE_LABELS).map(([key, label]) => (
                    <SelectItem key={key} value={key}>
                      {label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div>
              <Label htmlFor="status">Status</Label>
              <Select
                value={filters.isActive === undefined ? 'all' : filters.isActive.toString()}
                onValueChange={(value) => handleFilterChange('isActive', value === 'all' ? undefined : value === 'true')}
              >
                <SelectTrigger>
                  <SelectValue placeholder="All statuses" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All statuses</SelectItem>
                  <SelectItem value="true">Active</SelectItem>
                  <SelectItem value="false">Inactive</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>

          <div className="flex gap-2">
            <Button
              variant="outline"
              size="sm"
              onClick={() => {
                setFilters({})
                setPagination(prev => ({ ...prev, page: 1 }))
              }}
            >
              Clear Filters
            </Button>
            <Button
              variant="outline"
              size="sm"
              onClick={() => refetch()}
            >
              <RefreshCw className="w-4 h-4 mr-2" />
              Refresh
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* Table */}
      <Card>
        <CardHeader className="pb-4">
          <div className="flex items-center justify-between">
            <CardTitle>
              Voters ({votersData?.pagination.total || 0})
            </CardTitle>
            <div className="flex gap-2">
              {selectedVoters.size > 0 && (
                <Badge variant="secondary">
                  {selectedVoters.size} selected
                </Badge>
              )}
              <Button variant="outline" size="sm">
                <Download className="w-4 h-4 mr-2" />
                Export
              </Button>
              <Button variant="outline" size="sm">
                <Upload className="w-4 h-4 mr-2" />
                Import
              </Button>
            </div>
          </div>
        </CardHeader>
        <CardContent>
          {isLoading ? (
            <div className="flex justify-center py-8">
              <LoadingSpinner />
            </div>
          ) : votersData?.data && votersData.data.length > 0 ? (
            <>
              <Table>
                <TableHeader>
                  <TableRow>
                    {selectable && (
                      <TableHead className="w-12">
                        <Checkbox
                          checked={isAllSelected}
                          onCheckedChange={handleSelectAll}
                        />
                      </TableHead>
                    )}
                    <TableHead>
                      <Button
                        variant="ghost"
                        size="sm"
                        className="h-auto p-0 font-medium"
                        onClick={() => handleSort('firstName')}
                      >
                        Name
                        {getSortIcon('firstName')}
                      </Button>
                    </TableHead>
                    <TableHead>
                      <Button
                        variant="ghost"
                        size="sm"
                        className="h-auto p-0 font-medium"
                        onClick={() => handleSort('studentId')}
                      >
                        Student ID
                        {getSortIcon('studentId')}
                      </Button>
                    </TableHead>
                    <TableHead>
                      <Button
                        variant="ghost"
                        size="sm"
                        className="h-auto p-0 font-medium"
                        onClick={() => handleSort('email')}
                      >
                        Email
                        {getSortIcon('email')}
                      </Button>
                    </TableHead>
                    {!compact && (
                      <>
                        <TableHead>Faculty</TableHead>
                        <TableHead>Year</TableHead>
                      </>
                    )}
                    <TableHead>Role</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead>
                      <Button
                        variant="ghost"
                        size="sm"
                        className="h-auto p-0 font-medium"
                        onClick={() => handleSort('createdAt')}
                      >
                        Registered
                        {getSortIcon('createdAt')}
                      </Button>
                    </TableHead>
                    <TableHead className="w-12"></TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {votersData.data.map((voter) => (
                    <TableRow
                      key={voter.id}
                      className={cn(
                        "cursor-pointer",
                        selectedVoters.has(voter.id) && "bg-muted/50"
                      )}
                      onClick={() => onVoterSelect?.(voter)}
                    >
                      {selectable && (
                        <TableCell>
                          <Checkbox
                            checked={selectedVoters.has(voter.id)}
                            onCheckedChange={(checked) =>
                              handleSelectVoter(voter.id, checked as boolean)
                            }
                            onClick={(e) => e.stopPropagation()}
                          />
                        </TableCell>
                      )}
                      <TableCell>
                        <div>
                          <div className="font-medium">
                            {voter.firstName} {voter.lastName}
                          </div>
                          {voter.middleName && (
                            <div className="text-sm text-muted-foreground">
                              {voter.middleName}
                            </div>
                          )}
                        </div>
                      </TableCell>
                      <TableCell className="font-mono text-sm">
                        {voter.studentId}
                      </TableCell>
                      <TableCell className="text-sm">
                        {voter.email}
                      </TableCell>
                      {!compact && (
                        <>
                          <TableCell className="text-sm">
                            {voter.faculty}
                          </TableCell>
                          <TableCell className="text-sm">
                            Year {voter.yearOfStudy}
                          </TableCell>
                        </>
                      )}
                      <TableCell>
                        <Badge variant={voter.role === UserRole.ADMIN ? 'default' : 'secondary'}>
                          {USER_ROLE_LABELS[voter.role]}
                        </Badge>
                      </TableCell>
                      <TableCell>
                        <div className="flex gap-1">
                          <Badge variant={voter.isActive ? 'success' : 'destructive'}>
                            {voter.isActive ? 'Active' : 'Inactive'}
                          </Badge>
                          <Badge variant={voter.isVerified ? 'success' : 'warning'}>
                            {voter.isVerified ? 'Verified' : 'Unverified'}
                          </Badge>
                        </div>
                      </TableCell>
                      <TableCell className="text-sm">
                        {formatters.formatDate(voter.createdAt)}
                      </TableCell>
                      <TableCell>
                        <DropdownMenu>
                          <DropdownMenuTrigger asChild onClick={(e) => e.stopPropagation()}>
                            <Button variant="ghost" size="sm">
                              <MoreHorizontal className="w-4 h-4" />
                            </Button>
                          </DropdownMenuTrigger>
                          <DropdownMenuContent align="end">
                            <DropdownMenuLabel>Actions</DropdownMenuLabel>
                            <DropdownMenuItem
                              onClick={(e) => {
                                e.stopPropagation()
                                setActionDialog({
                                  open: true,
                                  voter,
                                  action: 'view'
                                })
                              }}
                            >
                              <Eye className="w-4 h-4 mr-2" />
                              View Details
                            </DropdownMenuItem>
                            <DropdownMenuItem
                              onClick={(e) => {
                                e.stopPropagation()
                                setActionDialog({
                                  open: true,
                                  voter,
                                  action: 'edit'
                                })
                              }}
                            >
                              <Edit className="w-4 h-4 mr-2" />
                              Edit
                            </DropdownMenuItem>
                            <DropdownMenuSeparator />
                            {voter.isActive ? (
                              <DropdownMenuItem
                                onClick={(e) => {
                                  e.stopPropagation()
                                  setActionDialog({
                                    open: true,
                                    voter,
                                    action: 'deactivate'
                                  })
                                }}
                                className="text-orange-600"
                              >
                                <UserX className="w-4 h-4 mr-2" />
                                Deactivate
                              </DropdownMenuItem>
                            ) : (
                              <DropdownMenuItem
                                onClick={(e) => {
                                  e.stopPropagation()
                                  setActionDialog({
                                    open: true,
                                    voter,
                                    action: 'activate'
                                  })
                                }}
                                className="text-green-600"
                              >
                                <UserCheck className="w-4 h-4 mr-2" />
                                Activate
                              </DropdownMenuItem>
                            )}
                            <DropdownMenuSeparator />
                            <DropdownMenuItem
                              onClick={(e) => {
                                e.stopPropagation()
                                setActionDialog({
                                  open: true,
                                  voter,
                                  action: 'delete'
                                })
                              }}
                              className="text-red-600"
                            >
                              <Trash2 className="w-4 h-4 mr-2" />
                              Delete
                            </DropdownMenuItem>
                          </DropdownMenuContent>
                        </DropdownMenu>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>

              {/* Pagination */}
              <div className="flex items-center justify-between pt-4">
                <div className="text-sm text-muted-foreground">
                  Showing {((pagination.page - 1) * pagination.limit) + 1} to{' '}
                  {Math.min(pagination.page * pagination.limit, votersData.pagination.total)} of{' '}
                  {votersData.pagination.total} voters
                </div>
                <div className="flex items-center gap-2">
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => handlePageChange(1)}
                    disabled={pagination.page === 1}
                  >
                    <ChevronsLeft className="w-4 h-4" />
                  </Button>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => handlePageChange(pagination.page - 1)}
                    disabled={pagination.page === 1}
                  >
                    <ChevronLeft className="w-4 h-4" />
                  </Button>
                  <span className="text-sm">
                    Page {pagination.page} of {totalPages}
                  </span>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => handlePageChange(pagination.page + 1)}
                    disabled={pagination.page === totalPages}
                  >
                    <ChevronRight className="w-4 h-4" />
                  </Button>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => handlePageChange(totalPages)}
                    disabled={pagination.page === totalPages}
                  >
                    <ChevronsRight className="w-4 h-4" />
                  </Button>
                </div>
              </div>
            </>
          ) : (
            <div className="text-center py-8 text-muted-foreground">
              No voters found
            </div>
          )}
        </CardContent>
      </Card>

      {/* Action Dialog */}
      <VoterActionDialog
        open={actionDialog.open}
        onOpenChange={(open) => setActionDialog(prev => ({ ...prev, open }))}
        voter={actionDialog.voter}
        action={actionDialog.action}
        onConfirm={(reason) => {
          if (actionDialog.voter && actionDialog.action !== 'view' && actionDialog.action !== 'edit') {
            handleVoterAction(actionDialog.voter, actionDialog.action, reason)
          }
        }}
        loading={actionLoading}
      />
    </div>
  )
}

export default VoterTable