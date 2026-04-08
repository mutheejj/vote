"use client"

import React, { useState, useMemo, useCallback } from 'react'
import { useQuery } from '@tanstack/react-query'
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
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog'
import { Label } from '@/components/ui/label'
import { LoadingSpinner } from '@/components/shared/LoadingSpinner'
import { useNotifications } from '@/lib/hooks/useNotifications'
import { cn } from '@/lib/utils/cn'
import  formatters  from '@/lib/utils/formatters'
import {
  Search,
  Filter,
  Download,
  Calendar,
  User,
  Shield,
  Activity,
  Eye,
  RefreshCw,
  ChevronLeft,
  ChevronRight,
  AlertTriangle,
  Info,
  CheckCircle,
  XCircle,
  Clock,
  MapPin,
  Monitor,
  Smartphone,
  Tablet,
} from 'lucide-react'
import {
  AuditLog as AuditLogType,
  PaginationParams,
  PaginatedResponse,
  ApiResponse,
} from '@/lib/types'
import { API_ENDPOINTS } from '@/lib/constants'
import { NotificationType, AuditCategory, AuditSeverity } from '@/lib/enums'
import { getAuditLogs } from '@/lib/api/audit'

interface AuditFilters {
  search?: string
  category?: AuditCategory
  severity?: AuditSeverity
  userId?: string
  dateRange?: {
    from: Date
    to: Date
  }
  ipAddress?: string
}

interface AuditLogProps {
  className?: string
  showFilters?: boolean
  compact?: boolean
  maxHeight?: string
}

interface AuditLogDetailProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  auditLog: AuditLogType | null
}

const SEVERITY_COLORS: Record<AuditSeverity, string> = {
  [AuditSeverity.LOW]: 'text-green-600 bg-green-50 border-green-200',
  [AuditSeverity.MEDIUM]: 'text-blue-600 bg-blue-50 border-blue-200',
  [AuditSeverity.HIGH]: 'text-orange-600 bg-orange-50 border-orange-200',
  [AuditSeverity.CRITICAL]: 'text-red-600 bg-red-50 border-red-200',
}

const SEVERITY_ICONS: Record<AuditSeverity, React.ComponentType<{ className?: string }>> = {
  [AuditSeverity.LOW]: CheckCircle,
  [AuditSeverity.MEDIUM]: Info,
  [AuditSeverity.HIGH]: AlertTriangle,
  [AuditSeverity.CRITICAL]: XCircle,
}

const CATEGORY_ICONS: Record<AuditCategory, React.ComponentType<{ className?: string }>> = {
  [AuditCategory.AUTH]: Shield,
  [AuditCategory.ELECTION]: Activity,
  [AuditCategory.VOTE]: CheckCircle,
  [AuditCategory.ADMIN]: User,
  [AuditCategory.SECURITY]: AlertTriangle,
}

const CATEGORY_COLORS: Record<AuditCategory, string> = {
  [AuditCategory.AUTH]: 'text-sage-600 bg-sage-50',
  [AuditCategory.ELECTION]: 'text-blue-600 bg-blue-50',
  [AuditCategory.VOTE]: 'text-green-600 bg-green-50',
  [AuditCategory.ADMIN]: 'text-orange-600 bg-orange-50',
  [AuditCategory.SECURITY]: 'text-red-600 bg-red-50',
}

const AuditLogDetail: React.FC<AuditLogDetailProps> = ({
  open,
  onOpenChange,
  auditLog
}) => {
  if (!auditLog) return null

  const getDeviceIcon = (userAgent: string) => {
    if (userAgent.includes('Mobile') || userAgent.includes('iPhone') || userAgent.includes('Android')) {
      return Smartphone
    }
    if (userAgent.includes('Tablet') || userAgent.includes('iPad')) {
      return Tablet
    }
    return Monitor
  }

  const DeviceIcon = auditLog.userAgent ? getDeviceIcon(auditLog.userAgent) : Monitor

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            Audit Log Details
            <Badge className={SEVERITY_COLORS[auditLog.severity]}>
              {auditLog.severity}
            </Badge>
          </DialogTitle>
          <DialogDescription>
            Detailed information about this audit log entry
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-6">
          {/* Basic Information */}
          <div className="grid grid-cols-2 gap-4">
            <div>
              <Label className="text-sm font-medium">Action</Label>
              <p className="text-sm text-muted-foreground mt-1">
                {auditLog.action}
              </p>
            </div>
            <div>
              <Label className="text-sm font-medium">Category</Label>
              <div className="mt-1">
                <Badge className={CATEGORY_COLORS[auditLog.category]}>
                  {auditLog.category}
                </Badge>
              </div>
            </div>
            <div>
              <Label className="text-sm font-medium">Timestamp</Label>
              <p className="text-sm text-muted-foreground mt-1">
                {formatters.formatDateTime(auditLog.timestamp)}
              </p>
            </div>
            <div>
              <Label className="text-sm font-medium">User ID</Label>
              <p className="text-sm text-muted-foreground mt-1">
                {auditLog.userId || 'System'}
              </p>
            </div>
          </div>

          {/* Network Information */}
          {(auditLog.ipAddress || auditLog.userAgent) && (
            <div className="space-y-3">
              <Label className="text-sm font-medium">Network Information</Label>
              <div className="space-y-2">
                {auditLog.ipAddress && (
                  <div className="flex items-center gap-2 text-sm">
                    <MapPin className="w-4 h-4 text-muted-foreground" />
                    <span className="font-medium">IP Address:</span>
                    <span className="text-muted-foreground">{auditLog.ipAddress}</span>
                  </div>
                )}
                {auditLog.userAgent && (
                  <div className="flex items-center gap-2 text-sm">
                    <DeviceIcon className="w-4 h-4 text-muted-foreground" />
                    <span className="font-medium">User Agent:</span>
                    <span className="text-muted-foreground text-xs break-all">
                      {auditLog.userAgent}
                    </span>
                  </div>
                )}
              </div>
            </div>
          )}

          {/* Metadata */}
          {auditLog.metadata && Object.keys(auditLog.metadata).length > 0 && (
            <div className="space-y-3">
              <Label className="text-sm font-medium">Additional Data</Label>
              <div className="bg-muted/50 p-3 rounded-lg">
                <pre className="text-xs text-muted-foreground whitespace-pre-wrap">
                  {JSON.stringify(auditLog.metadata, null, 2)}
                </pre>
              </div>
            </div>
          )}
        </div>
      </DialogContent>
    </Dialog>
  )
}

export const AuditLog: React.FC<AuditLogProps> = ({
  className,
  showFilters = true,
  compact = false,
  maxHeight = "600px"
}) => {
  const [filters, setFilters] = useState<AuditFilters>({})
  const [pagination, setPagination] = useState<PaginationParams>({
    page: 1,
    limit: 50,
    sortBy: 'timestamp',
    order: 'desc'
  })
  const [selectedLog, setSelectedLog] = useState<AuditLogType | null>(null)
  const [showDetail, setShowDetail] = useState(false)

  const { addNotification } = useNotifications()

  // Fetch audit logs with filters and pagination
  const {
    data: logsData,
    isLoading,
    error,
    refetch
  } = useQuery({
    queryKey: ['audit-logs', filters, pagination],
    queryFn: async (): Promise<PaginatedResponse<AuditLogType>> => {
      const response = await getAuditLogs({
        page: pagination.page,
        limit: pagination.limit,
        sortBy: pagination.sortBy,
        order: pagination.order,
        search: filters.search,
        category: filters.category,
        severity: filters.severity,
        userId: filters.userId,
        startDate: filters.dateRange?.from,
        endDate: filters.dateRange?.to,
      })

      if (!response.data.success || !response.data.data) {
        throw new Error(response.data.error || 'Failed to fetch audit logs')
      }

      return response.data.data
    },
    refetchInterval: 30000, // Refresh every 30 seconds
  })

  const handleFilterChange = useCallback((key: keyof AuditFilters, value: any) => {
    setFilters(prev => ({ ...prev, [key]: value }))
    setPagination(prev => ({ ...prev, page: 1 }))
  }, [])

  const handlePageChange = useCallback((page: number) => {
    setPagination(prev => ({ ...prev, page }))
  }, [])

  const handleExportLogs = useCallback(async () => {
    try {
      const params = new URLSearchParams()

      // Add current filters to export
      if (filters.search) params.append('search', filters.search)
      if (filters.category) params.append('category', filters.category)
      if (filters.severity) params.append('severity', filters.severity)
      if (filters.userId) params.append('userId', filters.userId)
      if (filters.ipAddress) params.append('ipAddress', filters.ipAddress)
      if (filters.dateRange?.from) {
        params.append('startDate', filters.dateRange.from.toISOString())
      }
      if (filters.dateRange?.to) {
        params.append('endDate', filters.dateRange.to.toISOString())
      }

      const response = await fetch(`${API_ENDPOINTS.AUDIT.EXPORT}?${params}`)
      if (!response.ok) {
        throw new Error('Failed to export audit logs')
      }

      const blob = await response.blob()
      const url = URL.createObjectURL(blob)
      const link = document.createElement('a')
      link.href = url
      link.download = `audit-logs-${new Date().toISOString().split('T')[0]}.csv`
      link.click()
      URL.revokeObjectURL(url)

      addNotification({
        type: NotificationType.SUCCESS,
        title: 'Export Complete',
        message: 'Audit logs exported successfully'
      })
    } catch (error) {
      addNotification({
        type: NotificationType.ERROR,
        title: 'Export Failed',
        message: error instanceof Error ? error.message : 'Failed to export audit logs'
      })
    }
  }, [filters, addNotification])

  const groupedLogs = useMemo(() => {
    if (!logsData?.data) return {}

    return logsData.data.reduce((groups, log) => {
      const date = new Date(log.timestamp).toDateString()
      if (!groups[date]) {
        groups[date] = []
      }
      groups[date].push(log)
      return groups
    }, {} as Record<string, AuditLogType[]>)
  }, [logsData?.data])

  const totalPages = logsData?.pagination ? Math.ceil(logsData.pagination.total / logsData.pagination.limit) : 1

  if (error) {
    return (
      <Card className={className}>
        <CardContent className="py-8">
          <div className="text-center text-red-600">
            Error loading audit logs: {error instanceof Error ? error.message : 'Unknown error'}
          </div>
        </CardContent>
      </Card>
    )
  }

  return (
    <div className={cn("space-y-4", className)}>
      {/* Filters */}
      {showFilters && (
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
                    placeholder="Search actions..."
                    value={filters.search || ''}
                    onChange={(e) => handleFilterChange('search', e.target.value)}
                    className="pl-10"
                  />
                </div>
              </div>

              <div>
                <Label htmlFor="category">Category</Label>
                <Select
                  value={filters.category || ''}
                  onValueChange={(value) => handleFilterChange('category', value || undefined)}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="All categories" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="">All categories</SelectItem>
                    {(Object.values(AuditCategory) as string[]).map((category: string) => (
                      <SelectItem key={category} value={category}>
                        {category}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div>
                <Label htmlFor="severity">Severity</Label>
                <Select
                  value={filters.severity || ''}
                  onValueChange={(value) => handleFilterChange('severity', value || undefined)}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="All severities" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="">All severities</SelectItem>
                    {(Object.values(AuditSeverity) as string[]).map((severity: string) => (
                      <SelectItem key={severity} value={severity}>
                        {severity}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div>
                <Label htmlFor="userId">User ID</Label>
                <Input
                  id="userId"
                  placeholder="Filter by user..."
                  value={filters.userId || ''}
                  onChange={(e) => handleFilterChange('userId', e.target.value)}
                />
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
              <Button
                variant="outline"
                size="sm"
                onClick={handleExportLogs}
              >
                <Download className="w-4 h-4 mr-2" />
                Export
              </Button>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Timeline */}
      <Card>
        <CardHeader className="pb-4">
          <div className="flex items-center justify-between">
            <div>
              <CardTitle>Audit Trail</CardTitle>
              <CardDescription>
                System activity and security events ({logsData?.pagination.total || 0} total)
              </CardDescription>
            </div>
            <div className="flex items-center gap-2">
              <Clock className="w-4 h-4 text-muted-foreground" />
              <span className="text-sm text-muted-foreground">
                Live updating
              </span>
            </div>
          </div>
        </CardHeader>
        <CardContent>
          {isLoading ? (
            <div className="flex justify-center py-8">
              <LoadingSpinner />
            </div>
          ) : Object.keys(groupedLogs).length > 0 ? (
            <div
              className="space-y-6 overflow-y-auto"
              style={{ maxHeight }}
            >
              {Object.entries(groupedLogs).map(([date, logs]) => (
                <div key={date}>
                  {/* Date Header */}
                  <div className="flex items-center gap-2 mb-4">
                    <Calendar className="w-4 h-4 text-muted-foreground" />
                    <h3 className="text-sm font-medium text-muted-foreground">
                      {formatters.formatDate(new Date(date))}
                    </h3>
                    <div className="flex-1 h-px bg-border"></div>
                  </div>

                  {/* Timeline Items */}
                  <div className="relative pl-6 space-y-4">
                    {/* Timeline Line */}
                    <div className="absolute left-3 top-0 bottom-0 w-px bg-border"></div>

                    {logs.map((log, index) => {
                      const SeverityIcon = SEVERITY_ICONS[log.severity]
                      const CategoryIcon = CATEGORY_ICONS[log.category]

                      return (
                        <div key={log.id} className="relative">
                          {/* Timeline Dot */}
                          <div className={cn(
                            "absolute -left-3 w-6 h-6 rounded-full border-2 bg-background flex items-center justify-center",
                            SEVERITY_COLORS[log.severity]
                          )}>
                            <SeverityIcon className="w-3 h-3" />
                          </div>

                          {/* Log Content */}
                          <div
                            className="ml-4 cursor-pointer group"
                            onClick={() => {
                              setSelectedLog(log)
                              setShowDetail(true)
                            }}
                          >
                            <Card className="group-hover:shadow-sm transition-shadow">
                              <CardContent className="p-4">
                                <div className="flex items-start justify-between gap-4">
                                  <div className="flex-1 min-w-0">
                                    <div className="flex items-center gap-2 mb-2">
                                      <CategoryIcon className="w-4 h-4 text-muted-foreground" />
                                      <Badge className={CATEGORY_COLORS[log.category]}>
                                        {log.category}
                                      </Badge>
                                      <Badge className={SEVERITY_COLORS[log.severity]}>
                                        {log.severity}
                                      </Badge>
                                    </div>
                                    <p className="font-medium text-sm mb-1">
                                      {log.action}
                                    </p>
                                    <div className="flex items-center gap-4 text-xs text-muted-foreground">
                                      <span>
                                        {formatters.formatDateTime(log.timestamp, 'HH:mm')}
                                      </span>
                                      {log.userId && (
                                        <span className="flex items-center gap-1">
                                          <User className="w-3 h-3" />
                                          {log.userId}
                                        </span>
                                      )}
                                      {log.ipAddress && (
                                        <span className="flex items-center gap-1">
                                          <MapPin className="w-3 h-3" />
                                          {log.ipAddress}
                                        </span>
                                      )}
                                    </div>
                                  </div>
                                  <Button
                                    variant="ghost"
                                    size="sm"
                                    className="opacity-0 group-hover:opacity-100 transition-opacity"
                                  >
                                    <Eye className="w-4 h-4" />
                                  </Button>
                                </div>
                              </CardContent>
                            </Card>
                          </div>
                        </div>
                      )
                    })}
                  </div>
                </div>
              ))}

              {/* Pagination */}
              <div className="flex items-center justify-between pt-4 border-t">
                <div className="text-sm text-muted-foreground">
                  Showing {((pagination.page - 1) * pagination.limit) + 1} to{' '}
                  {Math.min(pagination.page * pagination.limit, logsData?.pagination.total || 0)} of{' '}
                  {logsData?.pagination.total || 0} entries
                </div>
                <div className="flex items-center gap-2">
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => handlePageChange(pagination.page - 1)}
                    disabled={pagination.page === 1}
                  >
                    <ChevronLeft className="w-4 h-4" />
                    Previous
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
                    Next
                    <ChevronRight className="w-4 h-4" />
                  </Button>
                </div>
              </div>
            </div>
          ) : (
            <div className="text-center py-8 text-muted-foreground">
              No audit logs found
            </div>
          )}
        </CardContent>
      </Card>

      {/* Detail Dialog */}
      <AuditLogDetail
        open={showDetail}
        onOpenChange={setShowDetail}
        auditLog={selectedLog}
      />
    </div>
  )
}

export default AuditLog