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
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog'
import {
  Alert,
  AlertDescription,
  AlertTitle,
} from '@/components/ui/alert'
import { VoterTable } from '@/components/admin/VoterTable'
import { VoterImport } from '@/components/admin/VoterImport'
import { LoadingSpinner } from '@/components/shared/LoadingSpinner'
import { useAuth } from '@/lib/hooks/useAuth'
import { useNotifications } from '@/lib/hooks/useNotifications'
import { cn } from '@/lib/utils/cn'
import  formatters  from '@/lib/utils/formatters'
import {
  Users,
  Upload,
  Download,
  Plus,
  UserCheck,
  UserX,
  AlertCircle,
  TrendingUp,
  Activity,
  Calendar,
  Filter,
  RefreshCw,
  BarChart3,
  PieChart,
  Clock,
  Shield,
  School,
} from 'lucide-react'
import Link from 'next/link'
import {
  AdminUserSummary,
  SafeUser,
  ApiResponse,
} from '@/lib/types'
import { API_ENDPOINTS } from '@/lib/constants'
import {NotificationType, USER_ROLE_LABELS} from '@/lib/enums'

interface VoterStatsCardProps {
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

const VoterStatsCard: React.FC<VoterStatsCardProps> = ({
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

export default function AdminVotersPage() {
  const [selectedVoter, setSelectedVoter] = useState<SafeUser | null>(null)
  const [showImportDialog, setShowImportDialog] = useState(false)
  const [refreshTrigger, setRefreshTrigger] = useState(0)

  const { user } = useAuth()
  const { addNotification } = useNotifications()

  // Fetch voter statistics
  const {
    data: voterStats,
    isLoading: statsLoading,
    error: statsError,
    refetch: refetchStats
  } = useQuery({
    queryKey: ['admin-voter-stats', refreshTrigger],
    queryFn: async (): Promise<AdminUserSummary> => {
      const { getAllUsers } = await import('@/lib/api/admin')

      const response = await getAllUsers({ summary: true } as any)

      if (!response.data.success || !response.data.data) {
        throw new Error(response.data.error || 'Failed to fetch voter statistics')
      }

      return response.data.data as any
    },
    refetchInterval: 30000, // Refresh every 30 seconds
  })

  const handleVoterUpdate = (voter: SafeUser) => {
    setRefreshTrigger(prev => prev + 1)
    addNotification({
      type: NotificationType.SUCCESS,
      title: 'Voter Updated',
      message: `${voter.firstName} ${voter.lastName} has been updated`
    })
  }

  const handleImportComplete = (result: any) => {
    setShowImportDialog(false)
    setRefreshTrigger(prev => prev + 1)
    refetchStats()
  }

  const handleRefresh = () => {
    setRefreshTrigger(prev => prev + 1)
    refetchStats()
    addNotification({
      type: NotificationType.SUCCESS,
      title: 'Refreshed',
      message: 'Voter data updated'
    })
  }

  const exportVoters = async () => {
    try {
      const response = await fetch(`${API_ENDPOINTS.ADMIN.USERS}/export`)
      if (!response.ok) {
        throw new Error('Export failed')
      }

      const blob = await response.blob()
      const url = URL.createObjectURL(blob)
      const link = document.createElement('a')
      link.href = url
      link.download = `voters-${new Date().toISOString().split('T')[0]}.csv`
      link.click()
      URL.revokeObjectURL(url)

      addNotification({
        type: NotificationType.SUCCESS,
        title: 'Export Complete',
        message: 'Voter data exported successfully'
      })
    } catch (error) {
      addNotification({
        type: NotificationType.ERROR,
        title: 'Export Failed',
        message: 'Failed to export voter data'
      })
    }
  }

  return (
    <div className="space-y-8">
      {/* Header */}
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Voter Management</h1>
          <p className="text-muted-foreground mt-2">
            Manage voter registration, import data, and monitor participation
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
            onClick={exportVoters}
          >
            <Download className="h-4 w-4 mr-2" />
            Export
          </Button>
          <Dialog open={showImportDialog} onOpenChange={setShowImportDialog}>
            <DialogTrigger asChild>
              <Button>
                <Upload className="h-4 w-4 mr-2" />
                Import Voters
              </Button>
            </DialogTrigger>
            <DialogContent className="max-w-4xl">
              <DialogHeader>
                <DialogTitle>Import Voters</DialogTitle>
                <DialogDescription>
                  Upload a CSV file to import multiple voters at once
                </DialogDescription>
              </DialogHeader>
              <VoterImport
                onImportComplete={handleImportComplete}
              />
            </DialogContent>
          </Dialog>
        </div>
      </div>

      {/* Error Alert */}
      {statsError && (
        <Alert variant="destructive">
          <AlertCircle className="h-4 w-4" />
          <AlertTitle>Error</AlertTitle>
          <AlertDescription>
            Failed to load voter statistics. Please refresh the page.
          </AlertDescription>
        </Alert>
      )}

      {/* Statistics Cards */}
      {voterStats && (
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
          <VoterStatsCard
            title="Total Voters"
            value={voterStats.totalUsers || 0}
            subtitle={`${voterStats.verifiedUsers || 0} verified`}
            icon={Users}
            {...(voterStats.newRegistrations?.thisWeek && {
              trend: {
                value: voterStats.newRegistrations.thisWeek,
                isPositive: true,
                label: 'new this week'
              }
            })}
          />

          <VoterStatsCard
            title="Active Voters"
            value={voterStats.activeUsers || 0}
            subtitle="Currently active"
            icon={UserCheck}
            variant="success"
          />

          <VoterStatsCard
            title="Verification Rate"
            value={voterStats.totalUsers ? `${Math.round(((voterStats.verifiedUsers || 0) / voterStats.totalUsers) * 100)}%` : '0%'}
            subtitle={`${voterStats.pendingVerifications || 0} pending`}
            icon={Shield}
            variant={(voterStats.pendingVerifications || 0) > 50 ? 'warning' : 'success'}
          />

          <VoterStatsCard
            title="New Registrations"
            value={voterStats.newRegistrations?.today || 0}
            subtitle="Today"
            icon={Calendar}
            {...(voterStats.newRegistrations?.thisWeek && {
              trend: {
                value: 15,
                isPositive: true,
                label: 'vs yesterday'
              }
            })}
          />
        </div>
      )}

      {/* Main Content */}
      <Tabs defaultValue="manage" className="space-y-6">
        <TabsList className="grid w-full grid-cols-4">
          <TabsTrigger value="manage">Manage Voters</TabsTrigger>
          <TabsTrigger value="analytics">Analytics</TabsTrigger>
          <TabsTrigger value="demographics">Demographics</TabsTrigger>
          <TabsTrigger value="activity">Activity</TabsTrigger>
        </TabsList>

        {/* Manage Voters Tab */}
        <TabsContent value="manage" className="space-y-6">
          <VoterTable
            onVoterSelect={setSelectedVoter}
            onVoterUpdate={handleVoterUpdate}
            selectable={true}
          />
        </TabsContent>

        {/* Analytics Tab */}
        <TabsContent value="analytics" className="space-y-6">
          <div className="grid gap-6 md:grid-cols-2">
            {/* Registration Trends */}
            <Card>
              <CardHeader>
                <CardTitle>Registration Trends</CardTitle>
                <CardDescription>
                  Voter registration over time
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="h-64 flex items-center justify-center text-muted-foreground">
                  <div className="text-center">
                    <BarChart3 className="h-12 w-12 mx-auto mb-2" />
                    <p>Registration trend chart</p>
                    <p className="text-xs">Will be implemented with actual data</p>
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Verification Status */}
            <Card>
              <CardHeader>
                <CardTitle>Verification Status</CardTitle>
                <CardDescription>
                  Breakdown of voter verification status
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="h-64 flex items-center justify-center text-muted-foreground">
                  <div className="text-center">
                    <PieChart className="h-12 w-12 mx-auto mb-2" />
                    <p>Verification status chart</p>
                    <p className="text-xs">Will be implemented with actual data</p>
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Registration Statistics */}
            <Card className="md:col-span-2">
              <CardHeader>
                <CardTitle>Registration Statistics</CardTitle>
                <CardDescription>
                  Detailed breakdown of new registrations
                </CardDescription>
              </CardHeader>
              <CardContent>
                {voterStats && (
                  <div className="grid gap-4 md:grid-cols-3">
                    <div className="text-center">
                      <div className="text-2xl font-bold">{voterStats.newRegistrations.today}</div>
                      <p className="text-sm text-muted-foreground">Today</p>
                    </div>
                    <div className="text-center">
                      <div className="text-2xl font-bold">{voterStats.newRegistrations.thisWeek}</div>
                      <p className="text-sm text-muted-foreground">This Week</p>
                    </div>
                    <div className="text-center">
                      <div className="text-2xl font-bold">{voterStats.newRegistrations.thisMonth}</div>
                      <p className="text-sm text-muted-foreground">This Month</p>
                    </div>
                  </div>
                )}
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        {/* Demographics Tab */}
        <TabsContent value="demographics" className="space-y-6">
          <div className="grid gap-6 md:grid-cols-2">
            {/* Faculty Distribution */}
            <Card>
              <CardHeader>
                <CardTitle>Faculty Distribution</CardTitle>
                <CardDescription>
                  Voters by faculty
                </CardDescription>
              </CardHeader>
              <CardContent>
                {voterStats?.usersByFaculty ? (
                  <div className="space-y-3">
                    {voterStats.usersByFaculty.map((faculty, index) => (
                      <div key={index} className="flex items-center justify-between">
                        <div className="flex items-center gap-2">
                          <School className="h-4 w-4 text-muted-foreground" />
                          <span className="text-sm font-medium">{faculty.faculty}</span>
                        </div>
                        <div className="flex items-center gap-2">
                          <span className="text-sm text-muted-foreground">
                            {faculty.count}
                          </span>
                          <div className="w-20 h-2 bg-muted rounded-full overflow-hidden">
                            <div
                              className="h-full bg-primary rounded-full"
                              style={{
                                width: `${(faculty.count / voterStats.totalUsers) * 100}%`
                              }}
                            />
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                ) : (
                  <div className="h-48 flex items-center justify-center text-muted-foreground">
                    <div className="text-center">
                      <PieChart className="h-8 w-8 mx-auto mb-2" />
                      <p>Faculty distribution chart</p>
                    </div>
                  </div>
                )}
              </CardContent>
            </Card>

            {/* Role Distribution */}
            <Card>
              <CardHeader>
                <CardTitle>Role Distribution</CardTitle>
                <CardDescription>
                  Users by role
                </CardDescription>
              </CardHeader>
              <CardContent>
                {voterStats?.usersByRole ? (
                  <div className="space-y-3">
                    {voterStats.usersByRole.map((roleData, index) => (
                      <div key={index} className="flex items-center justify-between">
                        <div className="flex items-center gap-2">
                          <Users className="h-4 w-4 text-muted-foreground" />
                          <span className="text-sm font-medium">
                            {USER_ROLE_LABELS[roleData.role] || roleData.role}
                          </span>
                        </div>
                        <div className="flex items-center gap-2">
                          <span className="text-sm text-muted-foreground">
                            {roleData.count}
                          </span>
                          <Badge variant="outline">
                            {Math.round((roleData.count / voterStats.totalUsers) * 100)}%
                          </Badge>
                        </div>
                      </div>
                    ))}
                  </div>
                ) : (
                  <div className="h-48 flex items-center justify-center text-muted-foreground">
                    <div className="text-center">
                      <BarChart3 className="h-8 w-8 mx-auto mb-2" />
                      <p>Role distribution chart</p>
                    </div>
                  </div>
                )}
              </CardContent>
            </Card>

            {/* Status Overview */}
            <Card className="md:col-span-2">
              <CardHeader>
                <CardTitle>User Status Overview</CardTitle>
                <CardDescription>
                  Current status of all users in the system
                </CardDescription>
              </CardHeader>
              <CardContent>
                {voterStats && (
                  <div className="grid gap-4 md:grid-cols-4">
                    <div className="text-center p-4 border rounded-lg">
                      <div className="text-2xl font-bold text-green-600">
                        {voterStats.activeUsers}
                      </div>
                      <p className="text-sm text-muted-foreground">Active Users</p>
                    </div>
                    <div className="text-center p-4 border rounded-lg">
                      <div className="text-2xl font-bold text-blue-600">
                        {voterStats.verifiedUsers}
                      </div>
                      <p className="text-sm text-muted-foreground">Verified Users</p>
                    </div>
                    <div className="text-center p-4 border rounded-lg">
                      <div className="text-2xl font-bold text-orange-600">
                        {voterStats.pendingVerifications}
                      </div>
                      <p className="text-sm text-muted-foreground">Pending Verification</p>
                    </div>
                    <div className="text-center p-4 border rounded-lg">
                      <div className="text-2xl font-bold text-red-600">
                        {voterStats.suspendedUsers || 0}
                      </div>
                      <p className="text-sm text-muted-foreground">Suspended Users</p>
                    </div>
                  </div>
                )}
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        {/* Activity Tab */}
        <TabsContent value="activity" className="space-y-6">
          <div className="grid gap-6">
            <Card>
              <CardHeader>
                <CardTitle>Recent User Activity</CardTitle>
                <CardDescription>
                  Latest user registrations and status changes
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  {/* Placeholder for recent activity */}
                  <div className="text-center py-8 text-muted-foreground">
                    <Activity className="h-12 w-12 mx-auto mb-2" />
                    <p>Recent activity will be displayed here</p>
                    <p className="text-xs">Integration with audit log system</p>
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>Import History</CardTitle>
                <CardDescription>
                  Recent voter import operations
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  <div className="text-center py-8 text-muted-foreground">
                    <Upload className="h-12 w-12 mx-auto mb-2" />
                    <p>Import history will be displayed here</p>
                    <p className="text-xs">Track bulk import operations</p>
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