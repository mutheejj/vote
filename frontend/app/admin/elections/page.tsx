"use client"

import React, { useState } from 'react'
import { useQuery, useMutation } from '@tanstack/react-query'
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card'
import {
  Tabs,
  TabsContent,
  TabsList,
  TabsTrigger,
} from '@/components/ui/tabs'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Progress } from '@/components/ui/progress'
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
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table'
import {
  Alert,
  AlertDescription,
  AlertTitle,
} from '@/components/ui/alert'
import { Checkbox } from '@/components/ui/checkbox'
import { LoadingSpinner } from '@/components/shared/LoadingSpinner'
import { useAuth } from '@/lib/hooks/useAuth'
import { useNotifications } from '@/lib/hooks/useNotifications'
import { cn } from '@/lib/utils/cn'
import  formatters  from '@/lib/utils/formatters'
import {
  Calendar,
  Plus,
  Eye,
  Edit,
  Trash2,
  Play,
  Pause,
  Square,
  MoreHorizontal,
  Users,
  Vote,
  BarChart3,
  Clock,
  AlertCircle,
  CheckCircle,
  XCircle,
  RefreshCw,
  Download,
  Filter,
  Search,
  TrendingUp,
  Archive,
  Settings,
  UserCheck,
  Award,
  FileText,
  Activity,
  ChevronRight,
  ArrowUp,
  ArrowDown,
} from 'lucide-react'
import Link from 'next/link'
import {
  Election,
  AdminElectionSummary,
  PaginationParams,
  PaginatedResponse,
  ApiResponse,
} from '@/lib/types'
import { API_ENDPOINTS } from '@/lib/constants'
import {
  ElectionType,
  ElectionStatus,
  NotificationType,
  ELECTION_STATUS_LABELS,
  ELECTION_TYPE_LABELS,
} from '@/lib/enums'
import {
  startElection as startElectionAPI,
  endElection as endElectionAPI,
  pauseElection as pauseElectionAPI,
  resumeElection as resumeElectionAPI,
  archiveElection as archiveElectionAPI,
  deleteElection as deleteElectionAPI,
} from '@/lib/api/elections'

interface ElectionFilters {
  search?: string
  type?: ElectionType
  status?: ElectionStatus
  dateRange?: {
    from: Date
    to: Date
  }
}

interface ElectionStatsCardProps {
  title: string
  value: string | number
  subtitle?: string
  icon: React.ComponentType<{ className?: string }>
  trend?: {
    value: number
    isPositive: boolean
    label: string
  }
  variant?: 'default' | 'success' | 'warning' | 'destructive'
  onClick?: () => void
}

const ElectionStatsCard: React.FC<ElectionStatsCardProps> = ({
  title,
  value,
  subtitle,
  icon: Icon,
  trend,
  variant = 'default',
  onClick
}) => {
  const cardColors = {
    default: 'border-border',
    success: 'border-green-200 bg-green-50/50',
    warning: 'border-orange-200 bg-orange-50/50',
    destructive: 'border-red-200 bg-red-50/50'
  }

  return (
    <Card
      className={cn(
        'transition-colors cursor-pointer hover:shadow-sm',
        cardColors[variant]
      )}
      onClick={onClick}
    >
      <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
        <CardTitle className="text-sm font-medium">{title}</CardTitle>
        <Icon className="h-4 w-4 text-muted-foreground" />
      </CardHeader>
      <CardContent>
        <div className="text-2xl font-bold">{value}</div>
        {subtitle && (
          <p className="text-xs text-muted-foreground mt-1">{subtitle}</p>
        )}
        {trend && (
          <div className="flex items-center text-xs mt-2">
            <span className={cn(
              "flex items-center",
              trend.isPositive ? "text-green-600" : "text-red-600"
            )}>
              {trend.isPositive ? (
                <ArrowUp className="h-3 w-3 mr-1" />
              ) : (
                <ArrowDown className="h-3 w-3 mr-1" />
              )}
              {Math.abs(trend.value)}%
            </span>
            <span className="text-muted-foreground ml-1">{trend.label}</span>
          </div>
        )}
      </CardContent>
    </Card>
  )
}

interface ElectionActionDialogProps {
  election: Election | null
  action: 'start' | 'pause' | 'resume' | 'end' | 'archive' | 'delete'
  open: boolean
  onOpenChange: (open: boolean) => void
  onConfirm: () => void
  loading?: boolean
}

const ElectionActionDialog: React.FC<ElectionActionDialogProps> = ({
  election,
  action,
  open,
  onOpenChange,
  onConfirm,
  loading = false
}) => {
  if (!election) return null

  const getActionDetails = () => {
    switch (action) {
      case 'start':
        return {
          title: 'Start Election',
          description: `Are you sure you want to start "${election.title}"? This will open voting to all eligible participants.`,
          confirmText: 'Start Election',
          destructive: false
        }
      case 'pause':
        return {
          title: 'Pause Election',
          description: `Are you sure you want to pause "${election.title}"? Voting will be temporarily suspended.`,
          confirmText: 'Pause Election',
          destructive: false
        }
      case 'resume':
        return {
          title: 'Resume Election',
          description: `Are you sure you want to resume "${election.title}"? Voting will continue.`,
          confirmText: 'Resume Election',
          destructive: false
        }
      case 'end':
        return {
          title: 'End Election',
          description: `Are you sure you want to end "${election.title}"? This action will stop all voting and cannot be undone.`,
          confirmText: 'End Election',
          destructive: true
        }
      case 'archive':
        return {
          title: 'Archive Election',
          description: `Are you sure you want to archive "${election.title}"? Archived elections can be restored later.`,
          confirmText: 'Archive Election',
          destructive: false
        }
      case 'delete':
        return {
          title: 'Delete Election',
          description: `Are you sure you want to permanently delete "${election.title}"? This action cannot be undone.`,
          confirmText: 'Delete Election',
          destructive: true
        }
      default:
        return {
          title: 'Confirm Action',
          description: 'Please confirm this action.',
          confirmText: 'Confirm',
          destructive: false
        }
    }
  }

  const actionDetails = getActionDetails()

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>{actionDetails.title}</DialogTitle>
          <DialogDescription>
            {actionDetails.description}
          </DialogDescription>
        </DialogHeader>
        <DialogFooter>
          <Button
            variant="outline"
            onClick={() => onOpenChange(false)}
            disabled={loading}
          >
            Cancel
          </Button>
          <Button
            variant={actionDetails.destructive ? 'destructive' : 'default'}
            onClick={onConfirm}
            disabled={loading}
          >
            {loading && <LoadingSpinner className="w-4 h-4 mr-2" />}
            {actionDetails.confirmText}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}

export default function AdminElectionsPage() {
  const [filters, setFilters] = useState<ElectionFilters>({})
  const [pagination, setPagination] = useState<PaginationParams>({
    page: 1,
    limit: 10,
    sortBy: 'createdAt',
    order: 'desc'
  })
  const [selectedElections, setSelectedElections] = useState<Set<string>>(new Set())
  const [actionDialog, setActionDialog] = useState<{
    open: boolean
    election: Election | null
    action: 'start' | 'pause' | 'resume' | 'end' | 'archive' | 'delete'
  }>({
    open: false,
    election: null,
    action: 'start'
  })
  const [refreshTrigger, setRefreshTrigger] = useState(0)

  const { user } = useAuth()
  const { addNotification } = useNotifications()

  // Fetch elections with filters and pagination
  const {
    data: electionsData,
    isLoading,
    error,
    refetch
  } = useQuery({
    queryKey: ['admin-elections', filters, pagination, refreshTrigger],
    queryFn: async (): Promise<PaginatedResponse<Election>> => {
      const { getElections } = await import('@/lib/api/elections')

      // Prepare params
      const params: any = {
        page: pagination.page,
        limit: pagination.limit,
      }

      // Add sorting if specified
      if (pagination.sortBy) params.sortBy = pagination.sortBy
      if (pagination.order) params.order = pagination.order

      // Add filters if specified
      if (filters.search) params.search = filters.search
      if (filters.type && (filters.type as string) !== 'all') params.type = filters.type
      if (filters.status && (filters.status as string) !== 'all') params.status = filters.status
      if (filters.dateRange?.from) params.startDate = filters.dateRange.from.toISOString()
      if (filters.dateRange?.to) params.endDate = filters.dateRange.to.toISOString()

      const response = await getElections(params)

      if (!response.data.success || !response.data.data) {
        throw new Error(response.data.error || 'Failed to fetch elections')
      }

      const backendData = response.data.data as any

      // Transform backend response { elections, total, pages } to frontend format { data, pagination }
      return {
        data: backendData.elections || [],
        pagination: {
          total: backendData.total || 0,
          totalPages: backendData.pages || 0,
          page: pagination.page,
          limit: pagination.limit,
          hasNext: pagination.page < (backendData.pages || 0),
          hasPrev: pagination.page > 1
        }
      }
    }
  })

  // Fetch election stats separately to show accurate counts
  const {
    data: electionStats,
  } = useQuery({
    queryKey: ['admin-election-stats', refreshTrigger],
    queryFn: async () => {
      const { getElections } = await import('@/lib/api/elections')

      // Fetch all elections to get accurate stats (without pagination)
      const [allResponse, activeResponse, scheduledResponse, completedResponse] = await Promise.all([
        getElections({ page: 1, limit: 1 }), // Just get the total count
        getElections({ page: 1, limit: 1, filters: { status: ElectionStatus.ACTIVE } }),
        getElections({ page: 1, limit: 1, filters: { status: ElectionStatus.SCHEDULED } }),
        getElections({ page: 1, limit: 1, filters: { status: ElectionStatus.COMPLETED } })
      ])

      const allData = allResponse.data.data as any
      const activeData = activeResponse.data.data as any
      const scheduledData = scheduledResponse.data.data as any
      const completedData = completedResponse.data.data as any

      return {
        total: allData?.total || 0,
        active: activeData?.total || 0,
        scheduled: scheduledData?.total || 0,
        completed: completedData?.total || 0
      }
    }
  })

  // Election action mutation
  const electionActionMutation = useMutation({
    mutationFn: async ({
      electionId,
      action
    }: {
      electionId: string
      action: 'start' | 'pause' | 'resume' | 'end' | 'archive' | 'delete'
    }) => {
      console.log(`[Elections] Executing ${action} action for election ${electionId}`)

      let response

      try {
        switch (action) {
          case 'start':
            response = await startElectionAPI(electionId)
            break
          case 'pause':
            response = await pauseElectionAPI(electionId)
            break
          case 'resume':
            response = await resumeElectionAPI(electionId)
            break
          case 'end':
            response = await endElectionAPI(electionId)
            break
          case 'archive':
            response = await archiveElectionAPI(electionId)
            break
          case 'delete':
            response = await deleteElectionAPI(electionId)
            break
          default:
            throw new Error(`Unknown action: ${action}`)
        }

        console.log(`[Elections] ${action} successful:`, response.data)

        if (!response.data.success) {
          throw new Error(response.data.error || response.data.message || `Failed to ${action} election`)
        }

        return response.data
      } catch (error: any) {
        console.error(`[Elections] ${action} failed:`, error)

        // Extract error message from axios error
        const errorMessage = error.response?.data?.error
          || error.response?.data?.message
          || error.message
          || `Failed to ${action} election`

        throw new Error(errorMessage)
      }
    },
    onSuccess: (_, variables) => {
      addNotification({
        type: NotificationType.SUCCESS,
        title: 'Success',
        message: `Election ${variables.action}ed successfully`
      })
      setActionDialog({ open: false, election: null, action: 'start' })
      setRefreshTrigger(prev => prev + 1)
      refetch()
    },
    onError: (error, variables) => {
      addNotification({
        type: NotificationType.ERROR,
        title: 'Error',
        message: error instanceof Error ? error.message : `Failed to ${variables.action} election`
      })
    }
  })

  const handleFilterChange = (key: keyof ElectionFilters, value: any) => {
    setFilters(prev => ({ ...prev, [key]: value }))
    setPagination(prev => ({ ...prev, page: 1 }))
  }

  const handleElectionAction = (election: Election, action: any) => {
    setActionDialog({
      open: true,
      election,
      action
    })
  }

  const confirmElectionAction = () => {
    if (actionDialog.election) {
      electionActionMutation.mutate({
        electionId: actionDialog.election.id,
        action: actionDialog.action
      })
    }
  }

  const getStatusBadgeVariant = (status: ElectionStatus) => {
    switch (status) {
      case ElectionStatus.ACTIVE:
        return 'success'
      case ElectionStatus.SCHEDULED:
        return 'default'
      case ElectionStatus.COMPLETED:
        return 'secondary'
      case ElectionStatus.PAUSED:
        return 'warning'
      case ElectionStatus.CANCELLED:
      case ElectionStatus.ARCHIVED:
        return 'destructive'
      default:
        return 'outline'
    }
  }

  const getActionButtons = (election: Election) => {
    const buttons = []

    switch (election.status) {
      case ElectionStatus.DRAFT:
      case ElectionStatus.SCHEDULED:
        buttons.push(
          <DropdownMenuItem
            key="start"
            onClick={() => handleElectionAction(election, 'start')}
            className="text-green-600"
          >
            <Play className="w-4 h-4 mr-2" />
            Start Election
          </DropdownMenuItem>
        )
        break
      case ElectionStatus.ACTIVE:
        buttons.push(
          <DropdownMenuItem
            key="pause"
            onClick={() => handleElectionAction(election, 'pause')}
            className="text-orange-600"
          >
            <Pause className="w-4 h-4 mr-2" />
            Pause Election
          </DropdownMenuItem>,
          <DropdownMenuItem
            key="end"
            onClick={() => handleElectionAction(election, 'end')}
            className="text-red-600"
          >
            <Square className="w-4 h-4 mr-2" />
            End Election
          </DropdownMenuItem>
        )
        break
      case ElectionStatus.PAUSED:
        buttons.push(
          <DropdownMenuItem
            key="resume"
            onClick={() => handleElectionAction(election, 'resume')}
            className="text-green-600"
          >
            <Play className="w-4 h-4 mr-2" />
            Resume Election
          </DropdownMenuItem>,
          <DropdownMenuItem
            key="end"
            onClick={() => handleElectionAction(election, 'end')}
            className="text-red-600"
          >
            <Square className="w-4 h-4 mr-2" />
            End Election
          </DropdownMenuItem>
        )
        break
      case ElectionStatus.COMPLETED:
        buttons.push(
          <DropdownMenuItem
            key="archive"
            onClick={() => handleElectionAction(election, 'archive')}
          >
            <Archive className="w-4 h-4 mr-2" />
            Archive Election
          </DropdownMenuItem>
        )
        break
    }

    return buttons
  }

  const totalPages = electionsData?.pagination ?
    Math.ceil(electionsData.pagination.total / electionsData.pagination.limit) : 1

  if (error) {
    return (
      <div className="space-y-6">
        <Alert variant="destructive">
          <AlertCircle className="h-4 w-4" />
          <AlertTitle>Error</AlertTitle>
          <AlertDescription>
            Failed to load elections. Please try refreshing the page.
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
          <h1 className="text-3xl font-bold tracking-tight">Election Management</h1>
          <p className="text-muted-foreground mt-2">
            Create, manage, and monitor elections across the platform
          </p>
        </div>
        <div className="flex items-center gap-2">
          <Button
            variant="outline"
            size="sm"
            onClick={() => refetch()}
          >
            <RefreshCw className="h-4 w-4 mr-2" />
            Refresh
          </Button>
          <Button asChild>
            <Link href="/admin/elections/create">
              <Plus className="h-4 w-4 mr-2" />
              Create Election
            </Link>
          </Button>
        </div>
      </div>

      {/* Statistics Cards */}
      {electionStats && (
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
          <ElectionStatsCard
            title="Total Elections"
            value={electionStats.total}
            subtitle="All time"
            icon={Calendar}
          />

          <ElectionStatsCard
            title="Active Elections"
            value={electionStats.active}
            subtitle="Currently running"
            icon={Activity}
            variant="success"
          />

          <ElectionStatsCard
            title="Scheduled Elections"
            value={electionStats.scheduled}
            subtitle="Upcoming"
            icon={Clock}
            variant="default"
          />

          <ElectionStatsCard
            title="Completed Elections"
            value={electionStats.completed}
            subtitle="Finished"
            icon={CheckCircle}
            variant="default"
          />
        </div>
      )}

      {/* Main Content */}
      <Tabs defaultValue="manage" className="space-y-6">
        <TabsList className="grid w-full grid-cols-3">
          <TabsTrigger value="manage">Manage Elections</TabsTrigger>
          <TabsTrigger value="analytics">Analytics</TabsTrigger>
          <TabsTrigger value="schedule">Schedule</TabsTrigger>
        </TabsList>

        {/* Manage Elections Tab */}
        <TabsContent value="manage" className="space-y-6">
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
                      placeholder="Search elections..."
                      value={filters.search || ''}
                      onChange={(e) => handleFilterChange('search', e.target.value)}
                      className="pl-10"
                    />
                  </div>
                </div>

                <div>
                  <Label htmlFor="type">Type</Label>
                  <Select
                    value={filters.type || ''}
                    onValueChange={(value) => handleFilterChange('type', value || undefined)}
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="All types" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="all">All types</SelectItem>
                      {Object.entries(ELECTION_TYPE_LABELS).map(([key, label]) => (
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
                    value={filters.status || ''}
                    onValueChange={(value) => handleFilterChange('status', value || undefined)}
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="All statuses" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="all">All statuses</SelectItem>
                      {Object.entries(ELECTION_STATUS_LABELS).map(([key, label]) => (
                        <SelectItem key={key} value={key}>
                          {label}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>

                <div>
                  <Label>Quick Filters</Label>
                  <div className="flex gap-1 mt-1">
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => handleFilterChange('status', ElectionStatus.ACTIVE)}
                    >
                      Active
                    </Button>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => handleFilterChange('status', ElectionStatus.SCHEDULED)}
                    >
                      Scheduled
                    </Button>
                  </div>
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
              </div>
            </CardContent>
          </Card>

          {/* Elections Table */}
          <Card>
            <CardHeader>
              <CardTitle>
                Elections ({electionsData?.pagination.total || 0})
              </CardTitle>
            </CardHeader>
            <CardContent>
              {isLoading ? (
                <div className="flex justify-center py-8">
                  <LoadingSpinner />
                </div>
              ) : electionsData?.data && electionsData.data.length > 0 ? (
                <>
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead className="w-12">
                          <Checkbox />
                        </TableHead>
                        <TableHead>Election</TableHead>
                        <TableHead>Type</TableHead>
                        <TableHead>Status</TableHead>
                        <TableHead>Dates</TableHead>
                        <TableHead>Participation</TableHead>
                        <TableHead>Actions</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {electionsData.data.map((election) => (
                        <TableRow
                          key={election.id}
                          className="cursor-pointer hover:bg-accent"
                        >
                          <TableCell>
                            <Checkbox
                              checked={selectedElections.has(election.id)}
                              onCheckedChange={(checked) => {
                                const newSet = new Set(selectedElections)
                                if (checked) {
                                  newSet.add(election.id)
                                } else {
                                  newSet.delete(election.id)
                                }
                                setSelectedElections(newSet)
                              }}
                              onClick={(e) => e.stopPropagation()}
                            />
                          </TableCell>
                          <TableCell>
                            <div>
                              <div className="font-medium">{election.title}</div>
                              <div className="text-sm text-muted-foreground">
                                {election.description?.slice(0, 60)}...
                              </div>
                            </div>
                          </TableCell>
                          <TableCell>
                            <Badge variant="outline">
                              {ELECTION_TYPE_LABELS[election.type]}
                            </Badge>
                          </TableCell>
                          <TableCell>
                            <Badge variant={getStatusBadgeVariant(election.status)}>
                              {ELECTION_STATUS_LABELS[election.status]}
                            </Badge>
                          </TableCell>
                          <TableCell>
                            <div className="text-sm">
                              <div>{formatters.formatDate(election.startDate)}</div>
                              <div className="text-muted-foreground">
                                to {formatters.formatDate(election.endDate)}
                              </div>
                            </div>
                          </TableCell>
                          <TableCell>
                            <div className="space-y-1">
                              <div className="flex items-center gap-2 text-sm">
                                <span>{election.totalVotesCast || 0} votes</span>
                                <span className="text-muted-foreground">
                                  ({election.turnoutPercentage?.toFixed(1) || 0}%)
                                </span>
                              </div>
                              <Progress
                                value={election.turnoutPercentage || 0}
                                className="h-1 w-16"
                              />
                            </div>
                          </TableCell>
                          <TableCell>
                            <div className="flex items-center gap-2">
                              <Button variant="ghost" size="sm" asChild>
                                <Link href={`/admin/elections/${election.id}`}>
                                  <Eye className="w-4 h-4" />
                                </Link>
                              </Button>
                              <Button variant="ghost" size="sm" asChild>
                                <Link href={`/admin/elections/${election.id}/edit`}>
                                  <Edit className="w-4 h-4" />
                                </Link>
                              </Button>
                              <DropdownMenu>
                                <DropdownMenuTrigger asChild>
                                  <Button variant="ghost" size="sm">
                                    <MoreHorizontal className="w-4 h-4" />
                                  </Button>
                                </DropdownMenuTrigger>
                                <DropdownMenuContent align="end">
                                  <DropdownMenuLabel>Actions</DropdownMenuLabel>
                                  <DropdownMenuItem asChild>
                                    <Link href={`/admin/elections/${election.id}`}>
                                      <Eye className="w-4 h-4 mr-2" />
                                      View Details
                                    </Link>
                                  </DropdownMenuItem>
                                  <DropdownMenuItem asChild>
                                    <Link href={`/admin/elections/${election.id}/edit`}>
                                      <Edit className="w-4 h-4 mr-2" />
                                      Edit
                                    </Link>
                                  </DropdownMenuItem>
                                  <DropdownMenuSeparator />
                                  {getActionButtons(election)}
                                  <DropdownMenuSeparator />
                                  <DropdownMenuItem
                                    onClick={() => handleElectionAction(election, 'delete')}
                                    className="text-red-600"
                                  >
                                    <Trash2 className="w-4 h-4 mr-2" />
                                    Delete
                                  </DropdownMenuItem>
                                </DropdownMenuContent>
                              </DropdownMenu>
                            </div>
                          </TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>

                  {/* Pagination */}
                  <div className="flex items-center justify-between pt-4">
                    <div className="text-sm text-muted-foreground">
                      Showing {((pagination.page - 1) * pagination.limit) + 1} to{' '}
                      {Math.min(pagination.page * pagination.limit, electionsData.pagination.total)} of{' '}
                      {electionsData.pagination.total} elections
                    </div>
                    <div className="flex items-center gap-2">
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => setPagination(prev => ({ ...prev, page: prev.page - 1 }))}
                        disabled={pagination.page === 1}
                      >
                        Previous
                      </Button>
                      <span className="text-sm">
                        Page {pagination.page} of {totalPages}
                      </span>
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => setPagination(prev => ({ ...prev, page: prev.page + 1 }))}
                        disabled={pagination.page === totalPages}
                      >
                        Next
                      </Button>
                    </div>
                  </div>
                </>
              ) : (
                <div className="text-center py-8 text-muted-foreground">
                  No elections found
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        {/* Analytics Tab */}
        <TabsContent value="analytics" className="space-y-6">
          <div className="grid gap-6 md:grid-cols-2">
            <Card>
              <CardHeader>
                <CardTitle>Election Trends</CardTitle>
                <CardDescription>
                  Election creation and completion over time
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="h-64 flex items-center justify-center text-muted-foreground">
                  <div className="text-center">
                    <BarChart3 className="h-12 w-12 mx-auto mb-2" />
                    <p>Election trends chart</p>
                    <p className="text-xs">Will be implemented with actual data</p>
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>Participation Rates</CardTitle>
                <CardDescription>
                  Average voter turnout across elections
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="h-64 flex items-center justify-center text-muted-foreground">
                  <div className="text-center">
                    <TrendingUp className="h-12 w-12 mx-auto mb-2" />
                    <p>Participation chart</p>
                    <p className="text-xs">Will be implemented with actual data</p>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        {/* Schedule Tab */}
        <TabsContent value="schedule" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>Election Schedule</CardTitle>
              <CardDescription>
                Upcoming and ongoing elections timeline
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {electionsData?.data
                  .filter(e => e.status === ElectionStatus.SCHEDULED || e.status === ElectionStatus.ACTIVE)
                  .map((election) => (
                    <div
                      key={election.id}
                      className="flex items-center justify-between p-4 border rounded-lg"
                    >
                      <div className="space-y-1">
                        <div className="flex items-center gap-2">
                          <h4 className="font-medium">{election.title}</h4>
                          <Badge variant={getStatusBadgeVariant(election.status)}>
                            {ELECTION_STATUS_LABELS[election.status]}
                          </Badge>
                        </div>
                        <p className="text-sm text-muted-foreground">
                          {formatters.formatDate(election.startDate)} - {formatters.formatDate(election.endDate)}
                        </p>
                      </div>
                      <div className="flex items-center gap-2">
                        <Button variant="ghost" size="sm" asChild>
                          <Link href={`/admin/elections/${election.id}`}>
                            <Eye className="w-4 h-4" />
                          </Link>
                        </Button>
                        <ChevronRight className="w-4 h-4 text-muted-foreground" />
                      </div>
                    </div>
                  ))}
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>

      {/* Action Dialog */}
      <ElectionActionDialog
        election={actionDialog.election}
        action={actionDialog.action}
        open={actionDialog.open}
        onOpenChange={(open) => setActionDialog(prev => ({ ...prev, open }))}
        onConfirm={confirmElectionAction}
        loading={electionActionMutation.isPending}
      />
    </div>
  )
}