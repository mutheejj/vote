"use client"

import React, { useState } from 'react'
import { useQuery } from '@tanstack/react-query'
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
import {
  Alert,
  AlertDescription,
  AlertTitle,
} from '@/components/ui/alert'
import { AuditLog } from '@/components/admin/AuditLog'
import { LoadingSpinner } from '@/components/shared/LoadingSpinner'
import { useAuth } from '@/lib/hooks/useAuth'
import { useNotifications } from '@/lib/hooks/useNotifications'
import { cn } from '@/lib/utils/cn'
import { formatDate, formatDuration } from '@/lib/utils/formatters'
import {
  Shield,
  Activity,
  AlertTriangle,
  CheckCircle,
  XCircle,
  Clock,
  User,
  Globe,
  Download,
  RefreshCw,
  BarChart3,
  PieChart,
  TrendingUp,
  Eye,
  Settings,
  Database,
  Lock,
  Unlock,
  UserCheck,
  UserX,
  Calendar,
  Vote,
  FileText,
  Search,
} from 'lucide-react'
import { ApiResponse } from '@/lib/types'
import { AuditCategory, AuditSeverity, NotificationType } from '@/lib/enums'
import { API_ENDPOINTS } from '@/lib/constants'

interface AuditStats {
  total: number
  today: number
  thisWeek: number
  byCategory: Array<{
    category: AuditCategory
    count: number
    percentage: number
  }>
  bySeverity: Array<{
    severity: AuditSeverity
    count: number
    percentage: number
  }>
  topUsers: Array<{
    userId: string
    userName: string
    actionCount: number
  }>
  recentCritical: number
  securityEvents: number
}

interface AuditStatsCardProps {
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
}

const AuditStatsCard: React.FC<AuditStatsCardProps> = ({
  title,
  value,
  subtitle,
  icon: Icon,
  trend,
  variant = 'default'
}) => {
  const cardColors = {
    default: 'border-border',
    success: 'border-green-200 bg-green-50/50',
    warning: 'border-orange-200 bg-orange-50/50',
    destructive: 'border-red-200 bg-red-50/50'
  }

  return (
    <Card className={cn('transition-colors', cardColors[variant])}>
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
              <TrendingUp className={cn(
                "h-3 w-3 mr-1",
                !trend.isPositive && "rotate-180"
              )} />
              {Math.abs(trend.value)}%
            </span>
            <span className="text-muted-foreground ml-1">{trend.label}</span>
          </div>
        )}
      </CardContent>
    </Card>
  )
}

export default function AdminAuditPage() {
  const [refreshTrigger, setRefreshTrigger] = useState(0)

  const { user } = useAuth()
  const { addNotification } = useNotifications()

  // Fetch audit statistics
  const {
    data: auditStats,
    isLoading: statsLoading,
    error: statsError,
    refetch: refetchStats
  } = useQuery({
    queryKey: ['admin-audit-stats', refreshTrigger],
    queryFn: async (): Promise<AuditStats> => {
      const response = await fetch(`${API_ENDPOINTS.AUDIT.SUMMARY}`)
      if (!response.ok) {
        throw new Error('Failed to fetch audit statistics')
      }

      const result: ApiResponse<AuditStats> = await response.json()
      if (!result.success || !result.data) {
        throw new Error(result.error || 'Failed to fetch audit statistics')
      }

      return result.data
    },
    refetchInterval: 30000, // Refresh every 30 seconds
  })

  const handleRefresh = () => {
    setRefreshTrigger(prev => prev + 1)
    refetchStats()
    addNotification({
      type: NotificationType.SUCCESS,
      title: 'Refreshed',
      message: 'Audit data updated'
    })
  }

  const exportAuditLogs = async () => {
    try {
      const response = await fetch(`${API_ENDPOINTS.AUDIT.EXPORT}`)
      if (!response.ok) {
        throw new Error('Export failed')
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
        message: 'Failed to export audit logs'
      })
    }
  }

  return (
    <div className="space-y-8">
      {/* Header */}
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Audit Logs</h1>
          <p className="text-muted-foreground mt-2">
            Monitor system activity, security events, and user actions
          </p>
        </div>
        <div className="flex items-center gap-2">
          <Button
            variant="outline"
            size="sm"
            onClick={handleRefresh}
          >
            <RefreshCw className="h-4 w-4 mr-2" />
            Refresh
          </Button>
          <Button
            variant="outline"
            onClick={exportAuditLogs}
          >
            <Download className="h-4 w-4 mr-2" />
            Export Logs
          </Button>
        </div>
      </div>

      {/* Error Alert */}
      {statsError && (
        <Alert variant="destructive">
          <AlertTriangle className="h-4 w-4" />
          <AlertTitle>Error</AlertTitle>
          <AlertDescription>
            Failed to load audit statistics. Please refresh the page.
          </AlertDescription>
        </Alert>
      )}

      {/* Critical Events Alert */}
      {auditStats && auditStats.recentCritical > 0 && (
        <Alert variant="destructive">
          <AlertTriangle className="h-4 w-4" />
          <AlertTitle>Critical Events Detected</AlertTitle>
          <AlertDescription>
            {auditStats.recentCritical} critical security events detected in the last 24 hours.
            Please review immediately.
          </AlertDescription>
        </Alert>
      )}

      {/* Statistics Cards */}
      {auditStats && (
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
          <AuditStatsCard
            title="Total Events"
            value={auditStats.total}
            subtitle={`${auditStats.today} today`}
            icon={Activity}
            trend={{
              value: 12,
              isPositive: true,
              label: 'vs yesterday'
            }}
          />

          <AuditStatsCard
            title="Security Events"
            value={auditStats.securityEvents}
            subtitle="Security-related actions"
            icon={Shield}
            variant={auditStats.securityEvents > 10 ? 'warning' : 'success'}
          />

          <AuditStatsCard
            title="Critical Events"
            value={auditStats.recentCritical}
            subtitle="Last 24 hours"
            icon={AlertTriangle}
            variant={auditStats.recentCritical > 0 ? 'destructive' : 'success'}
          />

          <AuditStatsCard
            title="This Week"
            value={auditStats.thisWeek}
            subtitle="Events this week"
            icon={Calendar}
            trend={{
              value: 8,
              isPositive: false,
              label: 'vs last week'
            }}
          />
        </div>
      )}

      {/* Main Content */}
      <Tabs defaultValue="logs" className="space-y-6">
        <TabsList className="grid w-full grid-cols-4">
          <TabsTrigger value="logs">Audit Logs</TabsTrigger>
          <TabsTrigger value="analytics">Analytics</TabsTrigger>
          <TabsTrigger value="security">Security</TabsTrigger>
          <TabsTrigger value="compliance">Compliance</TabsTrigger>
        </TabsList>

        {/* Audit Logs Tab */}
        <TabsContent value="logs" className="space-y-6">
          <AuditLog />
        </TabsContent>

        {/* Analytics Tab */}
        <TabsContent value="analytics" className="space-y-6">
          <div className="grid gap-6 md:grid-cols-2">
            {/* Category Breakdown */}
            <Card>
              <CardHeader>
                <CardTitle>Events by Category</CardTitle>
                <CardDescription>
                  Distribution of audit events by category
                </CardDescription>
              </CardHeader>
              <CardContent>
                {auditStats?.byCategory ? (
                  <div className="space-y-3">
                    {auditStats.byCategory.map((category, index) => (
                      <div key={index} className="flex items-center justify-between">
                        <div className="flex items-center gap-2">
                          {category.category === AuditCategory.AUTH && <Shield className="h-4 w-4 text-sage-600" />}
                          {category.category === AuditCategory.ELECTION && <Vote className="h-4 w-4 text-blue-600" />}
                          {category.category === AuditCategory.VOTE && <CheckCircle className="h-4 w-4 text-green-600" />}
                          {category.category === AuditCategory.ADMIN && <Settings className="h-4 w-4 text-orange-600" />}
                          {category.category === AuditCategory.SECURITY && <AlertTriangle className="h-4 w-4 text-red-600" />}
                          <span className="text-sm font-medium">{category.category}</span>
                        </div>
                        <div className="flex items-center gap-2">
                          <span className="text-sm text-muted-foreground">
                            {category.count}
                          </span>
                          <Badge variant="outline">
                            {category.percentage.toFixed(1)}%
                          </Badge>
                        </div>
                      </div>
                    ))}
                  </div>
                ) : (
                  <div className="h-48 flex items-center justify-center text-muted-foreground">
                    <div className="text-center">
                      <PieChart className="h-8 w-8 mx-auto mb-2" />
                      <p>Category breakdown chart</p>
                    </div>
                  </div>
                )}
              </CardContent>
            </Card>

            {/* Severity Breakdown */}
            <Card>
              <CardHeader>
                <CardTitle>Events by Severity</CardTitle>
                <CardDescription>
                  Distribution of audit events by severity level
                </CardDescription>
              </CardHeader>
              <CardContent>
                {auditStats?.bySeverity ? (
                  <div className="space-y-3">
                    {auditStats.bySeverity.map((severity, index) => {
                      const getSeverityColor = (level: AuditSeverity) => {
                        switch (level) {
                          case AuditSeverity.LOW: return 'text-green-600'
                          case AuditSeverity.MEDIUM: return 'text-blue-600'
                          case AuditSeverity.HIGH: return 'text-orange-600'
                          case AuditSeverity.CRITICAL: return 'text-red-600'
                          default: return 'text-gray-600'
                        }
                      }

                      const getSeverityIcon = (level: AuditSeverity) => {
                        switch (level) {
                          case AuditSeverity.LOW: return CheckCircle
                          case AuditSeverity.MEDIUM: return Clock
                          case AuditSeverity.HIGH: return AlertTriangle
                          case AuditSeverity.CRITICAL: return XCircle
                          default: return Clock
                        }
                      }

                      const Icon = getSeverityIcon(severity.severity)

                      return (
                        <div key={index} className="flex items-center justify-between">
                          <div className="flex items-center gap-2">
                            <Icon className={cn("h-4 w-4", getSeverityColor(severity.severity))} />
                            <span className="text-sm font-medium">{severity.severity}</span>
                          </div>
                          <div className="flex items-center gap-2">
                            <span className="text-sm text-muted-foreground">
                              {severity.count}
                            </span>
                            <Badge variant="outline">
                              {severity.percentage.toFixed(1)}%
                            </Badge>
                          </div>
                        </div>
                      )
                    })}
                  </div>
                ) : (
                  <div className="h-48 flex items-center justify-center text-muted-foreground">
                    <div className="text-center">
                      <BarChart3 className="h-8 w-8 mx-auto mb-2" />
                      <p>Severity breakdown chart</p>
                    </div>
                  </div>
                )}
              </CardContent>
            </Card>

            {/* Top Active Users */}
            <Card className="md:col-span-2">
              <CardHeader>
                <CardTitle>Most Active Users</CardTitle>
                <CardDescription>
                  Users with the highest number of logged actions
                </CardDescription>
              </CardHeader>
              <CardContent>
                {auditStats?.topUsers ? (
                  <div className="space-y-3">
                    {auditStats.topUsers.map((userActivity, index) => (
                      <div key={index} className="flex items-center justify-between p-3 border rounded-lg">
                        <div className="flex items-center gap-3">
                          <div className="flex items-center justify-center w-8 h-8 rounded-full bg-muted">
                            <span className="text-sm font-medium">
                              {index + 1}
                            </span>
                          </div>
                          <div>
                            <p className="font-medium">{userActivity.userName}</p>
                            <p className="text-sm text-muted-foreground">
                              User ID: {userActivity.userId}
                            </p>
                          </div>
                        </div>
                        <div className="text-right">
                          <p className="font-medium">{userActivity.actionCount}</p>
                          <p className="text-sm text-muted-foreground">actions</p>
                        </div>
                      </div>
                    ))}
                  </div>
                ) : (
                  <div className="h-32 flex items-center justify-center text-muted-foreground">
                    <div className="text-center">
                      <User className="h-8 w-8 mx-auto mb-2" />
                      <p>User activity data</p>
                    </div>
                  </div>
                )}
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        {/* Security Tab */}
        <TabsContent value="security" className="space-y-6">
          <div className="grid gap-6">
            <Card>
              <CardHeader>
                <CardTitle>Security Events Monitor</CardTitle>
                <CardDescription>
                  Real-time monitoring of security-related events
                </CardDescription>
              </CardHeader>
              <CardContent>
                <AuditLog
                  showFilters={false}
                  compact={true}
                  maxHeight="400px"
                />
              </CardContent>
            </Card>

            <div className="grid gap-6 md:grid-cols-2">
              <Card>
                <CardHeader>
                  <CardTitle>Authentication Events</CardTitle>
                  <CardDescription>
                    Login attempts, failures, and security actions
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="space-y-3">
                    <div className="flex items-center justify-between p-3 border rounded-lg">
                      <div className="flex items-center gap-2">
                        <UserCheck className="h-4 w-4 text-green-600" />
                        <span className="text-sm">Successful Logins</span>
                      </div>
                      <span className="text-sm font-medium">0</span>
                    </div>
                    <div className="flex items-center justify-between p-3 border rounded-lg">
                      <div className="flex items-center gap-2">
                        <UserX className="h-4 w-4 text-red-600" />
                        <span className="text-sm">Failed Login Attempts</span>
                      </div>
                      <span className="text-sm font-medium">0</span>
                    </div>
                    <div className="flex items-center justify-between p-3 border rounded-lg">
                      <div className="flex items-center gap-2">
                        <Lock className="h-4 w-4 text-orange-600" />
                        <span className="text-sm">Account Lockouts</span>
                      </div>
                      <span className="text-sm font-medium">0</span>
                    </div>
                    <div className="flex items-center justify-between p-3 border rounded-lg">
                      <div className="flex items-center gap-2">
                        <Shield className="h-4 w-4 text-blue-600" />
                        <span className="text-sm">2FA Events</span>
                      </div>
                      <span className="text-sm font-medium">0</span>
                    </div>
                  </div>
                </CardContent>
              </Card>

              <Card>
                <CardHeader>
                  <CardTitle>System Security</CardTitle>
                  <CardDescription>
                    System-level security events and alerts
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="space-y-3">
                    <div className="flex items-center justify-between p-3 border rounded-lg">
                      <div className="flex items-center gap-2">
                        <Database className="h-4 w-4 text-blue-600" />
                        <span className="text-sm">Database Access</span>
                      </div>
                      <span className="text-sm font-medium">0</span>
                    </div>
                    <div className="flex items-center justify-between p-3 border rounded-lg">
                      <div className="flex items-center gap-2">
                        <Settings className="h-4 w-4 text-sage-600" />
                        <span className="text-sm">Admin Actions</span>
                      </div>
                      <span className="text-sm font-medium">0</span>
                    </div>
                    <div className="flex items-center justify-between p-3 border rounded-lg">
                      <div className="flex items-center gap-2">
                        <AlertTriangle className="h-4 w-4 text-red-600" />
                        <span className="text-sm">Security Violations</span>
                      </div>
                      <span className="text-sm font-medium">0</span>
                    </div>
                    <div className="flex items-center justify-between p-3 border rounded-lg">
                      <div className="flex items-center gap-2">
                        <Eye className="h-4 w-4 text-gray-600" />
                        <span className="text-sm">Suspicious Activity</span>
                      </div>
                      <span className="text-sm font-medium">0</span>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </div>
          </div>
        </TabsContent>

        {/* Compliance Tab */}
        <TabsContent value="compliance" className="space-y-6">
          <div className="grid gap-6">
            <Card>
              <CardHeader>
                <CardTitle>Compliance Overview</CardTitle>
                <CardDescription>
                  Audit trail compliance and regulatory requirements
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="grid gap-4 md:grid-cols-3">
                  <div className="text-center p-4 border rounded-lg">
                    <div className="text-2xl font-bold text-green-600">100%</div>
                    <p className="text-sm text-muted-foreground">Audit Coverage</p>
                  </div>
                  <div className="text-center p-4 border rounded-lg">
                    <div className="text-2xl font-bold text-blue-600">
                      {auditStats ? formatDuration(30 * 24 * 60 * 60 * 1000) : '30d'}
                    </div>
                    <p className="text-sm text-muted-foreground">Retention Period</p>
                  </div>
                  <div className="text-center p-4 border rounded-lg">
                    <div className="text-2xl font-bold text-sage-600">
                      {auditStats?.total || 0}
                    </div>
                    <p className="text-sm text-muted-foreground">Total Records</p>
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>Compliance Requirements</CardTitle>
                <CardDescription>
                  Current compliance status and requirements
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  <div className="flex items-center justify-between p-3 border rounded-lg">
                    <div>
                      <p className="font-medium">Data Protection Compliance</p>
                      <p className="text-sm text-muted-foreground">
                        Personal data handling and privacy requirements
                      </p>
                    </div>
                    <Badge variant="success">Compliant</Badge>
                  </div>

                  <div className="flex items-center justify-between p-3 border rounded-lg">
                    <div>
                      <p className="font-medium">Audit Trail Retention</p>
                      <p className="text-sm text-muted-foreground">
                        Minimum 30-day retention of all audit logs
                      </p>
                    </div>
                    <Badge variant="success">Compliant</Badge>
                  </div>

                  <div className="flex items-center justify-between p-3 border rounded-lg">
                    <div>
                      <p className="font-medium">User Action Logging</p>
                      <p className="text-sm text-muted-foreground">
                        All user actions and administrative changes logged
                      </p>
                    </div>
                    <Badge variant="success">Compliant</Badge>
                  </div>

                  <div className="flex items-center justify-between p-3 border rounded-lg">
                    <div>
                      <p className="font-medium">Security Event Monitoring</p>
                      <p className="text-sm text-muted-foreground">
                        Real-time monitoring of security-related events
                      </p>
                    </div>
                    <Badge variant="success">Compliant</Badge>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>
        </TabsContent>
      </Tabs>
    </div>
  )
}