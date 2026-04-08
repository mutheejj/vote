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
import { Progress } from '@/components/ui/progress'
import {
  Alert,
  AlertDescription,
  AlertTitle,
} from '@/components/ui/alert'
import { LoadingSpinner } from '@/components/shared/LoadingSpinner'
import { AuditLog } from '@/components/admin/AuditLog'
import { useAuth } from '@/lib/hooks/useAuth'
import { useNotifications } from '@/lib/hooks/useNotifications'
import { cn } from '@/lib/utils/cn'
import formatters from '@/lib/utils/formatters'
import {
  Users,
  Vote,
  Calendar,
  TrendingUp,
  Clock,
  AlertCircle,
  CheckCircle,
  XCircle,
  BarChart3,
  PieChart,
  Activity,
  Download,
  RefreshCw,
  Settings,
  ChevronRight,
  ArrowUp,
  ArrowDown,
  Eye,
  FileText,
  Shield,
  Bell,
  Server,
  Database,
  Wifi,
  HardDrive,
  Cpu,
  MemoryStick,
  MonitorUp,
  Globe,
  UserCheck,
  UserX,
  AlertTriangle,
} from 'lucide-react'
import Link from 'next/link'
import {
  AdminDashboardData,
  AdminOverview,
  AdminElectionSummary,
  SystemHealth,
  AdminActivity,
  SystemAlert,
  ApiResponse,
} from '@/lib/types'
import { API_ENDPOINTS } from '@/lib/constants'
import {
  ELECTION_STATUS_LABELS,
  ELECTION_TYPE_LABELS,
  USER_ROLE_LABELS,
} from '@/lib/enums'
import { NotificationType } from '@/lib/enums'

interface DashboardStatsCardProps {
  title: string
  value: string | number
  subtitle?: string
  icon: React.ComponentType<{ className?: string }>
  trend?: {
    value: number
    isPositive: boolean
    label: string
  }
  progress?: number
  variant?: 'default' | 'success' | 'warning' | 'destructive'
}

const DashboardStatsCard: React.FC<DashboardStatsCardProps> = ({
  title,
  value,
  subtitle,
  icon: Icon,
  trend,
  progress,
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
        {progress !== undefined && (
          <Progress value={progress} className="h-2 mt-2" />
        )}
      </CardContent>
    </Card>
  )
}

interface SystemHealthCardProps {
  health: SystemHealth
}

const SystemHealthCard: React.FC<SystemHealthCardProps> = ({ health }) => {
  const getStatusColor = (status: string) => {
    switch (status) {
      case 'healthy':
      case 'connected':
        return 'text-green-600'
      case 'warning':
      case 'slow':
        return 'text-orange-600'
      case 'critical':
      case 'disconnected':
        return 'text-red-600'
      default:
        return 'text-gray-600'
    }
  }

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'healthy':
      case 'connected':
        return CheckCircle
      case 'warning':
      case 'slow':
        return AlertTriangle
      case 'critical':
      case 'disconnected':
        return XCircle
      default:
        return AlertCircle
    }
  }

  const OverallStatusIcon = getStatusIcon(health.status)

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Server className="h-5 h-5" />
          System Health
        </CardTitle>
        <CardDescription>
          Current system status and performance metrics
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        {/* Overall Status */}
        <div className="flex items-center justify-between p-3 rounded-lg border">
          <div className="flex items-center gap-2">
            <OverallStatusIcon className={cn("h-5 w-5", getStatusColor(health.status))} />
            <span className="font-medium">Overall Status</span>
          </div>
          <Badge
            variant={health.status === 'healthy' ? 'success' : health.status === 'warning' ? 'warning' : 'destructive'}
          >
            {health.status.toUpperCase()}
          </Badge>
        </div>

        {/* Service Status */}
        <div className="grid grid-cols-2 gap-3">
          <div className="flex items-center justify-between text-sm">
            <div className="flex items-center gap-2">
              <Database className="h-4 w-4 text-muted-foreground" />
              <span>Database</span>
            </div>
            <Badge
              variant={health.database.status === 'connected' ? 'success' : 'destructive'}
              className="text-xs"
            >
              {health.database.status}
            </Badge>
          </div>

          <div className="flex items-center justify-between text-sm">
            <div className="flex items-center gap-2">
              <MemoryStick className="h-4 w-4 text-muted-foreground" />
              <span>Redis</span>
            </div>
            <Badge
              variant={health.redis.status === 'connected' ? 'success' : 'destructive'}
              className="text-xs"
            >
              {health.redis.status}
            </Badge>
          </div>

          <div className="flex items-center justify-between text-sm">
            <div className="flex items-center gap-2">
              <HardDrive className="h-4 w-4 text-muted-foreground" />
              <span>Storage</span>
            </div>
            <span className="text-xs text-muted-foreground">
              {health.storage.percentage.toFixed(1)}% used
            </span>
          </div>

          <div className="flex items-center justify-between text-sm">
            <div className="flex items-center gap-2">
              <Wifi className="h-4 w-4 text-muted-foreground" />
              <span>WebSocket</span>
            </div>
            <span className="text-xs text-muted-foreground">
              {health.websocket ? `${health.websocket.connections} connections` : 'N/A'}
            </span>
          </div>
        </div>

        {/* Performance Metrics */}
        <div className="space-y-2">
          <div className="flex justify-between text-sm">
            <span>CPU Usage</span>
            <span>{health.cpu}%</span>
          </div>
          <Progress value={health.cpu} className="h-2" />

          <div className="flex justify-between text-sm">
            <span>Memory Usage</span>
            <span>{health.memory}%</span>
          </div>
          <Progress value={health.memory} className="h-2" />

          <div className="flex justify-between text-sm">
            <span>Disk Usage</span>
            <span>{health.disk}%</span>
          </div>
          <Progress value={health.disk} className="h-2" />
        </div>

        <div className="text-xs text-muted-foreground">
          Last checked: {formatters.formatDateTime(health.lastChecked)}
        </div>
      </CardContent>
    </Card>
  )
}

export default function AdminDashboardPage() {
  const [selectedTimeRange, setSelectedTimeRange] = useState('7d')
  const [activeTab, setActiveTab] = useState('overview')
  const { user } = useAuth()
  const { addNotification } = useNotifications()

  // Role-based permission checks
  const isSuperAdmin = user?.role === 'SUPER_ADMIN'
  const isAdmin = user?.role === 'ADMIN'
  const isModerator = user?.role === 'MODERATOR'

  const canCreateElection = isSuperAdmin || isAdmin
  const canManageVoters = isSuperAdmin || isAdmin
  const canAccessSettings = isSuperAdmin
  const canViewAudit = isSuperAdmin || isAdmin || isModerator
  const canReviewCandidates = isSuperAdmin || isAdmin || isModerator
  const canGenerateReports = isSuperAdmin || isAdmin || isModerator

  // Fetch dashboard data
  const {
    data: dashboardData,
    isLoading,
    error,
    refetch
  } = useQuery({
    queryKey: ['admin-dashboard', selectedTimeRange],
    queryFn: async (): Promise<AdminDashboardData> => {
      const { getAdminDashboard } = await import('@/lib/api/admin')
      const response = await getAdminDashboard()

      if (!response.data.success || !response.data.data) {
        throw new Error(response.data.error || 'Failed to fetch dashboard data')
      }

      return response.data.data
    },
    refetchInterval: 30000, // Refresh every 30 seconds
  })

  const handleRefresh = () => {
    refetch()
    addNotification({
      type: NotificationType.SUCCESS,
      title: 'Refreshed',
      message: 'Dashboard data updated'
    })
  }

  if (isLoading) {
    return (
      <div className="space-y-6">
        <div className="flex justify-between items-center">
          <div className="space-y-2">
            <div className="h-8 w-48 bg-muted animate-pulse rounded" />
            <div className="h-4 w-96 bg-muted animate-pulse rounded" />
          </div>
          <div className="h-10 w-32 bg-muted animate-pulse rounded" />
        </div>
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
          {[...Array(4)].map((_, i) => (
            <div key={i} className="h-32 bg-muted animate-pulse rounded" />
          ))}
        </div>
        <div className="grid gap-4 md:grid-cols-2">
          <div className="h-96 bg-muted animate-pulse rounded" />
          <div className="h-96 bg-muted animate-pulse rounded" />
        </div>
      </div>
    )
  }

  if (error) {
    return (
      <div className="space-y-6">
        <Alert variant="destructive">
          <AlertCircle className="h-4 w-4" />
          <AlertTitle>Error</AlertTitle>
          <AlertDescription>
            Failed to load dashboard data. Please try refreshing the page.
          </AlertDescription>
        </Alert>
      </div>
    )
  }

  const overview = dashboardData?.overview
  const elections = dashboardData?.elections || []
  const systemHealth = dashboardData?.system
  const alerts = dashboardData?.alerts || []
  const recentActivity = dashboardData?.recentActivity || []

  return (
    <div className="space-y-8">
      {/* Header */}
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Admin Dashboard</h1>
          <p className="text-muted-foreground mt-2">
            Welcome back, {user?.firstName}! Here's what's happening with your elections.
          </p>
        </div>
        <div className="flex items-center gap-2">
          <div className="flex gap-1">
            {['24h', '7d', '30d', 'all'].map((range) => (
              <Button
                key={range}
                variant={selectedTimeRange === range ? 'default' : 'outline'}
                size="sm"
                onClick={() => setSelectedTimeRange(range)}
              >
                {range === 'all' ? 'All Time' : range.toUpperCase()}
              </Button>
            ))}
          </div>
          <Button
            variant="outline"
            size="sm"
            onClick={handleRefresh}
          >
            <RefreshCw className="h-4 w-4" />
          </Button>
        </div>
      </div>

      {/* Minimalist Quick Link Bar */}
      <div className="bg-white/60 dark:bg-gray-800/60 backdrop-blur-sm rounded-lg border border-sage-100 dark:border-gray-700 px-4 py-2">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <div className="flex items-center gap-2">
            <span className="text-xs font-medium text-gray-600 dark:text-gray-400">Quick Actions:</span>
            <Badge
              variant={isSuperAdmin ? 'destructive' : isAdmin ? 'default' : 'secondary'}
              className="text-xs"
            >
              {user?.role.replace('_', ' ')}
            </Badge>
          </div>
          <div className="flex flex-wrap items-center gap-2">
            {canCreateElection && (
              <Link href="/admin/elections/create">
                <Button variant="ghost" size="sm" className="h-8 px-3 text-xs hover:bg-sage-50 dark:hover:bg-gray-700">
                  <Calendar className="h-3 w-3 mr-1.5" />
                  Create Election
                </Button>
              </Link>
            )}
            {canManageVoters && (
              <Link href="/admin/voters">
                <Button variant="ghost" size="sm" className="h-8 px-3 text-xs hover:bg-sage-50 dark:hover:bg-gray-700">
                  <Users className="h-3 w-3 mr-1.5" />
                  Voters
                </Button>
              </Link>
            )}
            {canReviewCandidates && (
              <Link href="/admin/candidates">
                <Button variant="ghost" size="sm" className="h-8 px-3 text-xs hover:bg-sage-50 dark:hover:bg-gray-700">
                  <UserCheck className="h-3 w-3 mr-1.5" />
                  Candidates
                </Button>
              </Link>
            )}
            {canGenerateReports && (
              <Link href="/admin/reports">
                <Button variant="ghost" size="sm" className="h-8 px-3 text-xs hover:bg-sage-50 dark:hover:bg-gray-700">
                  <FileText className="h-3 w-3 mr-1.5" />
                  Reports
                </Button>
              </Link>
            )}
            {canViewAudit && (
              <Link href="/admin/audit">
                <Button variant="ghost" size="sm" className="h-8 px-3 text-xs hover:bg-sage-50 dark:hover:bg-gray-700">
                  <Shield className="h-3 w-3 mr-1.5" />
                  Audit
                </Button>
              </Link>
            )}
            {canAccessSettings && (
              <Link href="/admin/settings">
                <Button variant="ghost" size="sm" className="h-8 px-3 text-xs hover:bg-sage-50 dark:hover:bg-gray-700">
                  <Settings className="h-3 w-3 mr-1.5" />
                  Settings
                </Button>
              </Link>
            )}
            <div className="h-4 w-px bg-gray-300 dark:bg-gray-600"></div>
            <Button
              variant="ghost"
              size="sm"
              onClick={handleRefresh}
              className="h-8 px-3 text-xs hover:bg-sage-50 dark:hover:bg-gray-700"
            >
              <RefreshCw className="h-3 w-3 mr-1.5" />
              Refresh
            </Button>
          </div>
        </div>
      </div>

      {/* System Alerts */}
      {alerts.length > 0 && (
        <div className="space-y-2">
          {alerts.map((alert) => (
            <Alert
              key={alert.id}
              variant={alert.type === 'error' ? 'destructive' : alert.type === 'warning' ? 'default' : 'default'}
            >
              <AlertCircle className="h-4 w-4" />
              <AlertTitle>{alert.title}</AlertTitle>
              <AlertDescription>{alert.message}</AlertDescription>
            </Alert>
          ))}
        </div>
      )}

      {/* Stats Cards */}
      {overview && (
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
          <DashboardStatsCard
            title="Total Elections"
            value={overview.totalElections}
            subtitle={`${overview.activeElections} active`}
            icon={Calendar}
            variant={overview.activeElections > 0 ? 'success' : 'default'}
          />

          <DashboardStatsCard
            title="Total Users"
            value={overview.totalUsers}
            subtitle={`${overview.activeUsers} active today`}
            icon={Users}
            trend={{
              value: 12,
              isPositive: true,
              label: 'vs last week'
            }}
          />

          <DashboardStatsCard
            title="Votes Cast"
            value={overview.totalVotes}
            subtitle={`${overview.todayVotes} today`}
            icon={Vote}
            trend={{
              value: 8,
              isPositive: true,
              label: 'vs yesterday'
            }}
          />

          <DashboardStatsCard
            title="System Uptime"
            value={`${Math.floor(overview.systemUptime / 24)}d ${overview.systemUptime % 24}h`}
            subtitle="Last restart"
            icon={MonitorUp}
            variant={overview.systemUptime > 48 ? 'success' : 'warning'}
          />
        </div>
      )}

      {/* Main Content */}
      <Tabs defaultValue="overview" value={activeTab} onValueChange={setActiveTab} className="space-y-6">
        <TabsList className="grid w-full grid-cols-5">
          <TabsTrigger value="overview">Overview</TabsTrigger>
          <TabsTrigger value="elections">Elections</TabsTrigger>
          <TabsTrigger value="activity">Activity</TabsTrigger>
          <TabsTrigger value="health">System Health</TabsTrigger>
          <TabsTrigger value="analytics">Analytics</TabsTrigger>
        </TabsList>

        {/* Overview Tab - FULL WIDTH WITH ENHANCED CARDS */}
        <TabsContent value="overview" className="space-y-4">

          {/* Live Election Control Center - Full Width */}
          <Card className="border-sage-100 dark:border-gray-700">
            <CardHeader className="pb-3">
              <div className="flex items-center justify-between">
                <div>
                  <CardTitle className="flex items-center gap-2">
                    <Activity className="h-5 w-5 text-sage-600 dark:text-sage-400" />
                    Live Election Control Center
                  </CardTitle>
                  <CardDescription className="text-xs mt-1">
                    Real-time monitoring and management of active elections
                  </CardDescription>
                </div>
                {canCreateElection && (
                  <Link href="/admin/elections/create">
                    <Button size="sm" className="h-8">
                      <Calendar className="h-3 w-3 mr-1.5" />
                      New Election
                    </Button>
                  </Link>
                )}
              </div>
            </CardHeader>
            <CardContent>
              {elections.filter(e => e.status === 'ACTIVE' || e.status === 'SCHEDULED').length > 0 ? (
                <div className="grid gap-3 md:grid-cols-2 lg:grid-cols-3">
                  {elections.filter(e => e.status === 'ACTIVE' || e.status === 'SCHEDULED').map((election) => (
                    <div
                      key={election.id}
                      className="relative overflow-hidden rounded-lg border border-sage-100 dark:border-gray-700 p-4 hover:shadow-md transition-all bg-gradient-to-br from-white to-sage-50/30 dark:from-gray-800 dark:to-sage-900/10"
                    >
                      <div className="flex items-start justify-between mb-3">
                        <div className="flex-1">
                          <h4 className="font-semibold text-sm mb-1 line-clamp-1">{election.title}</h4>
                          <div className="flex items-center gap-2">
                            <Badge
                              variant={election.status === 'ACTIVE' ? 'success' : 'default'}
                              className="text-xs"
                            >
                              {election.status === 'ACTIVE' ? '● LIVE' : 'SCHEDULED'}
                            </Badge>
                            <span className="text-xs text-muted-foreground">
                              {ELECTION_TYPE_LABELS[election.type]}
                            </span>
                          </div>
                        </div>
                        <Link href={`/admin/elections/${election.id}`}>
                          <Button variant="ghost" size="sm" className="h-7 w-7 p-0">
                            <Eye className="h-3 w-3" />
                          </Button>
                        </Link>
                      </div>

                      <div className="space-y-2">
                        <div className="flex items-center justify-between text-xs">
                          <span className="text-muted-foreground">Turnout</span>
                          <span className="font-semibold">{election.turnoutPercentage.toFixed(1)}%</span>
                        </div>
                        <Progress value={election.turnoutPercentage} className="h-1.5" />

                        <div className="grid grid-cols-2 gap-2 pt-2">
                          <div className="text-center p-2 bg-sage-50 dark:bg-sage-900/20 rounded">
                            <div className="text-xs text-muted-foreground">Votes</div>
                            <div className="text-lg font-bold">{election.totalVotes}</div>
                          </div>
                          <div className="text-center p-2 bg-emerald-50 dark:bg-emerald-900/20 rounded">
                            <div className="text-xs text-muted-foreground">Positions</div>
                            <div className="text-lg font-bold">{election.positionsCount || 0}</div>
                          </div>
                        </div>

                        {election.status === 'ACTIVE' && (
                          <div className="flex items-center gap-1 text-xs text-muted-foreground pt-1">
                            <Clock className="h-3 w-3" />
                            <span>Ends {formatters.formatDate(election.endDate)}</span>
                          </div>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="text-center py-8 text-muted-foreground">
                  <Calendar className="h-12 w-12 mx-auto mb-3 opacity-50" />
                  <p className="text-sm">No active or scheduled elections</p>
                </div>
              )}
            </CardContent>
          </Card>

          {/* Action Required & Activity Grid */}
          <div className="grid gap-4 lg:grid-cols-3">

            {/* Action Required Dashboard */}
            <Card className="lg:col-span-1 border-orange-100 dark:border-gray-700">
              <CardHeader className="pb-3">
                <CardTitle className="flex items-center gap-2 text-base">
                  <AlertTriangle className="h-4 w-4 text-orange-600 dark:text-orange-400" />
                  Action Required
                </CardTitle>
                <CardDescription className="text-xs">Items needing attention</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-2">
                  {alerts && alerts.length > 0 ? (
                    alerts.slice(0, 5).map((alert) => (
                      <div
                        key={alert.id}
                        className={cn(
                          "p-2 rounded-lg border text-xs",
                          alert.type === 'error' ? 'border-red-200 bg-red-50/50 dark:bg-red-900/10' :
                          alert.type === 'warning' ? 'border-orange-200 bg-orange-50/50 dark:bg-orange-900/10' :
                          'border-blue-200 bg-blue-50/50 dark:bg-blue-900/10'
                        )}
                      >
                        <div className="flex items-start gap-2">
                          {alert.type === 'error' ? <XCircle className="h-3 w-3 text-red-600 mt-0.5" /> :
                           alert.type === 'warning' ? <AlertTriangle className="h-3 w-3 text-orange-600 mt-0.5" /> :
                           <Info className="h-3 w-3 text-blue-600 mt-0.5" />}
                          <div className="flex-1">
                            <p className="font-medium">{alert.title}</p>
                            <p className="text-muted-foreground mt-0.5">{alert.message}</p>
                          </div>
                        </div>
                      </div>
                    ))
                  ) : (
                    <div className="text-center py-4 text-muted-foreground">
                      <CheckCircle className="h-8 w-8 mx-auto mb-2 opacity-50" />
                      <p className="text-xs">All caught up!</p>
                    </div>
                  )}
                </div>
              </CardContent>
            </Card>

            {/* Real-Time Activity Stream */}
            <Card className="lg:col-span-2 border-blue-100 dark:border-gray-700">
              <CardHeader className="pb-3">
                <CardTitle className="flex items-center gap-2 text-base">
                  <Activity className="h-4 w-4 text-blue-600 dark:text-blue-400" />
                  Recent Activity
                </CardTitle>
                <CardDescription className="text-xs">Latest system events</CardDescription>
              </CardHeader>
              <CardContent>
                {recentActivity && recentActivity.length > 0 ? (
                  <div className="space-y-2 max-h-[300px] overflow-y-auto">
                    {recentActivity.map((activity, index) => (
                      <div
                        key={index}
                        className="flex items-start gap-3 p-2 rounded-lg hover:bg-accent transition-colors text-xs"
                      >
                        <div className={cn(
                          "w-7 h-7 rounded-full flex items-center justify-center flex-shrink-0",
                          activity.type === 'vote' ? 'bg-green-100 dark:bg-green-900/20' :
                          activity.type === 'election' ? 'bg-blue-100 dark:bg-blue-900/20' :
                          activity.type === 'user' ? 'bg-sage-100 dark:bg-sage-900/20' :
                          'bg-gray-100 dark:bg-gray-800'
                        )}>
                          {activity.type === 'vote' ? <Vote className="h-3 w-3 text-green-600" /> :
                           activity.type === 'election' ? <Calendar className="h-3 w-3 text-blue-600" /> :
                           activity.type === 'user' ? <Users className="h-3 w-3 text-sage-600" /> :
                           <Activity className="h-3 w-3 text-gray-600" />}
                        </div>
                        <div className="flex-1 min-w-0">
                          <p className="font-medium">{activity.action}</p>
                          <p className="text-muted-foreground">{activity.description}</p>
                          <div className="flex items-center gap-2 mt-1 text-muted-foreground">
                            <Clock className="h-3 w-3" />
                            <span>{formatters.formatDateTime(activity.timestamp)}</span>
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                ) : (
                  <div className="text-center py-8 text-muted-foreground">
                    <Activity className="h-12 w-12 mx-auto mb-3 opacity-50" />
                    <p className="text-sm">No recent activity</p>
                  </div>
                )}
              </CardContent>
            </Card>
          </div>

          {/* System Performance & Analytics Grid */}
          <div className="grid gap-4 lg:grid-cols-2">

            {/* System Performance Monitor */}
            {systemHealth && (
              <Card className="border-green-100 dark:border-gray-700">
                <CardHeader className="pb-3">
                  <CardTitle className="flex items-center gap-2 text-base">
                    <Server className="h-4 w-4 text-green-600 dark:text-green-400" />
                    System Performance
                  </CardTitle>
                  <CardDescription className="text-xs">Real-time resource usage</CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="grid grid-cols-3 gap-3">
                    <div className="text-center p-3 bg-gradient-to-br from-blue-50 to-blue-100/50 dark:from-blue-900/10 dark:to-blue-900/20 rounded-lg">
                      <Cpu className="h-5 w-5 mx-auto mb-2 text-blue-600" />
                      <div className="text-2xl font-bold">{systemHealth.cpu}%</div>
                      <div className="text-xs text-muted-foreground">CPU</div>
                      <Progress value={systemHealth.cpu} className="h-1 mt-2" />
                    </div>
                    <div className="text-center p-3 bg-gradient-to-br from-sage-50 to-sage-100/50 dark:from-sage-900/10 dark:to-sage-900/20 rounded-lg">
                      <MemoryStick className="h-5 w-5 mx-auto mb-2 text-sage-600" />
                      <div className="text-2xl font-bold">{systemHealth.memory}%</div>
                      <div className="text-xs text-muted-foreground">Memory</div>
                      <Progress value={systemHealth.memory} className="h-1 mt-2" />
                    </div>
                    <div className="text-center p-3 bg-gradient-to-br from-orange-50 to-orange-100/50 dark:from-orange-900/10 dark:to-orange-900/20 rounded-lg">
                      <HardDrive className="h-5 w-5 mx-auto mb-2 text-orange-600" />
                      <div className="text-2xl font-bold">{systemHealth.disk}%</div>
                      <div className="text-xs text-muted-foreground">Disk</div>
                      <Progress value={systemHealth.disk} className="h-1 mt-2" />
                    </div>
                  </div>

                  <div className="grid grid-cols-2 gap-2 mt-3 pt-3 border-t">
                    <div className="flex items-center gap-2 text-xs">
                      <Database className={cn(
                        "h-3 w-3",
                        systemHealth.database.status === 'connected' ? 'text-green-600' : 'text-red-600'
                      )} />
                      <span>Database</span>
                      <Badge variant={systemHealth.database.status === 'connected' ? 'success' : 'destructive'} className="text-xs ml-auto">
                        {systemHealth.database.status}
                      </Badge>
                    </div>
                    <div className="flex items-center gap-2 text-xs">
                      <Wifi className={cn(
                        "h-3 w-3",
                        systemHealth.redis.status === 'connected' ? 'text-green-600' : 'text-red-600'
                      )} />
                      <span>Redis</span>
                      <Badge variant={systemHealth.redis.status === 'connected' ? 'success' : 'destructive'} className="text-xs ml-auto">
                        {systemHealth.redis.status}
                      </Badge>
                    </div>
                  </div>
                </CardContent>
              </Card>
            )}

            {/* Quick Stats Summary */}
            <Card className="border-sage-100 dark:border-gray-700">
              <CardHeader className="pb-3">
                <CardTitle className="flex items-center gap-2 text-base">
                  <TrendingUp className="h-4 w-4 text-sage-600 dark:text-sage-400" />
                  Platform Analytics
                </CardTitle>
                <CardDescription className="text-xs">Key metrics overview</CardDescription>
              </CardHeader>
              <CardContent>
                {overview && (
                  <div className="grid grid-cols-2 gap-3">
                    <div className="p-3 bg-gradient-to-br from-sage-50 to-sage-100/50 dark:from-sage-900/10 dark:to-sage-900/20 rounded-lg">
                      <div className="flex items-center gap-2 mb-2">
                        <Users className="h-4 w-4 text-sage-600" />
                        <span className="text-xs font-medium">Total Users</span>
                      </div>
                      <div className="text-2xl font-bold">{overview.totalUsers}</div>
                      <div className="text-xs text-muted-foreground mt-1">
                        {overview.activeUsers} active today
                      </div>
                    </div>

                    <div className="p-3 bg-gradient-to-br from-blue-50 to-blue-100/50 dark:from-blue-900/10 dark:to-blue-900/20 rounded-lg">
                      <div className="flex items-center gap-2 mb-2">
                        <Vote className="h-4 w-4 text-blue-600" />
                        <span className="text-xs font-medium">Total Votes</span>
                      </div>
                      <div className="text-2xl font-bold">{overview.totalVotes}</div>
                      <div className="text-xs text-muted-foreground mt-1">
                        {overview.todayVotes} cast today
                      </div>
                    </div>

                    <div className="p-3 bg-gradient-to-br from-green-50 to-green-100/50 dark:from-green-900/10 dark:to-green-900/20 rounded-lg">
                      <div className="flex items-center gap-2 mb-2">
                        <Calendar className="h-4 w-4 text-green-600" />
                        <span className="text-xs font-medium">Elections</span>
                      </div>
                      <div className="text-2xl font-bold">{overview.totalElections}</div>
                      <div className="text-xs text-muted-foreground mt-1">
                        {overview.activeElections} currently active
                      </div>
                    </div>

                    <div className="p-3 bg-gradient-to-br from-orange-50 to-orange-100/50 dark:from-orange-900/10 dark:to-orange-900/20 rounded-lg">
                      <div className="flex items-center gap-2 mb-2">
                        <MonitorUp className="h-4 w-4 text-orange-600" />
                        <span className="text-xs font-medium">Uptime</span>
                      </div>
                      <div className="text-xl font-bold">
                        {Math.floor(overview.systemUptime / 24)}d {overview.systemUptime % 24}h
                      </div>
                      <div className="text-xs text-muted-foreground mt-1">
                        System operational
                      </div>
                    </div>
                  </div>
                )}
              </CardContent>
            </Card>
          </div>

        </TabsContent>

        {/* Elections Tab */}
        <TabsContent value="elections" className="space-y-6">
          <div className="grid gap-6">
            <Card>
              <CardHeader>
                <CardTitle>Election Summary</CardTitle>
                <CardDescription>
                  Overview of all elections in the system
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  {elections.map((election) => (
                    <div
                      key={election.id}
                      className="flex items-center justify-between p-4 border rounded-lg hover:bg-accent cursor-pointer transition-colors"
                    >
                      <div className="space-y-2">
                        <div className="flex items-center gap-3">
                          <h4 className="font-medium">{election.title}</h4>
                          <Badge variant="outline">
                            {ELECTION_TYPE_LABELS[election.type] || election.type}
                          </Badge>
                          <Badge
                            variant={
                              election.status === 'ACTIVE' ? 'success' :
                              election.status === 'SCHEDULED' ? 'default' :
                              election.status === 'COMPLETED' ? 'secondary' :
                              'destructive'
                            }
                          >
                            {ELECTION_STATUS_LABELS[election.status] || election.status}
                          </Badge>
                        </div>
                        <div className="flex items-center gap-4 text-sm text-muted-foreground">
                          <span>
                            {formatters.formatDate(election.startDate)} - {formatters.formatDate(election.endDate)}
                          </span>
                          <span>•</span>
                          <span>{election.positionsCount} positions</span>
                          <span>•</span>
                          <span>{election.candidatesCount} candidates</span>
                        </div>
                      </div>
                      <div className="flex items-center gap-4">
                        <div className="text-right">
                          <p className="text-sm font-medium">
                            {election.totalVotes} votes
                          </p>
                          <p className="text-xs text-muted-foreground">
                            {election.turnoutPercentage.toFixed(1)}% turnout
                          </p>
                        </div>
                        <Progress value={election.turnoutPercentage} className="w-20 h-2" />
                        <Button variant="ghost" size="sm" asChild>
                          <Link href={`/admin/elections/${election.id}`}>
                            <Eye className="h-4 w-4" />
                          </Link>
                        </Button>
                      </div>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        {/* Activity Tab */}
        <TabsContent value="activity" className="space-y-6">
          <AuditLog
            showFilters={false}
            compact={true}
            maxHeight="500px"
          />
        </TabsContent>

        {/* System Health Tab */}
        <TabsContent value="health" className="space-y-6">
          {systemHealth && <SystemHealthCard health={systemHealth} />}
        </TabsContent>

        {/* Analytics Tab */}
        <TabsContent value="analytics" className="space-y-6">
          <div className="grid gap-6 md:grid-cols-2">
            <Card>
              <CardHeader>
                <CardTitle>Voter Participation Trends</CardTitle>
                <CardDescription>
                  Voting activity over time
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="h-64 flex items-center justify-center text-muted-foreground">
                  <div className="text-center">
                    <BarChart3 className="h-12 w-12 mx-auto mb-2" />
                    <p>Chart will be implemented with actual data</p>
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>Election Type Distribution</CardTitle>
                <CardDescription>
                  Breakdown of election types
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="h-64 flex items-center justify-center text-muted-foreground">
                  <div className="text-center">
                    <PieChart className="h-12 w-12 mx-auto mb-2" />
                    <p>Chart will be implemented with actual data</p>
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card className="md:col-span-2">
              <CardHeader>
                <CardTitle>System Performance</CardTitle>
                <CardDescription>
                  Real-time system metrics and performance indicators
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="grid gap-4 md:grid-cols-3">
                  {systemHealth && (
                    <>
                      <div className="text-center">
                        <div className="text-2xl font-bold">{systemHealth.cpu}%</div>
                        <p className="text-sm text-muted-foreground">CPU Usage</p>
                        <Progress value={systemHealth.cpu} className="mt-2" />
                      </div>
                      <div className="text-center">
                        <div className="text-2xl font-bold">{systemHealth.memory}%</div>
                        <p className="text-sm text-muted-foreground">Memory Usage</p>
                        <Progress value={systemHealth.memory} className="mt-2" />
                      </div>
                      <div className="text-center">
                        <div className="text-2xl font-bold">{systemHealth.disk}%</div>
                        <p className="text-sm text-muted-foreground">Disk Usage</p>
                        <Progress value={systemHealth.disk} className="mt-2" />
                      </div>
                    </>
                  )}
                </div>
              </CardContent>
            </Card>
          </div>
        </TabsContent>
      </Tabs>
    </div>
  )
}