"use client"

import React from "react"
import Link from "next/link"
import {
  Vote,
  Calendar,
  TrendingUp,
  Clock,
  Users,
  Award,
  CheckCircle,
  AlertCircle,
  ArrowRight,
  Bell,
  BarChart3,
  RefreshCw,
  Activity,
  Trophy
} from "lucide-react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Progress } from "@/components/ui/progress"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { Alert, AlertDescription } from "@/components/ui/alert"
import { ElectionCard } from "@/components/voter/ElectionCard"
import { DoughnutChart, BarChart } from "@/components/ui/chart"
import { useElections } from "@/lib/hooks/useElections"
import { useAuth } from "@/lib/hooks/useAuth"
import { useVoting } from "@/lib/hooks/useVoting"
import { Election } from "@/lib/types"
import { ElectionStatus } from "@/lib/enums"
import { cn } from "@/lib/utils/cn"
import { format } from "date-fns"

export default function VoterDashboard() {
  const { user } = useAuth()
  const {
    elections,
    isLoading: electionsLoading,
    activeElections: hookActiveElections,
    refreshElections
  } = useElections({
    autoFetch: true,
    pollingInterval: 0 // Disable automatic polling - use manual refresh instead
  })
  const { votingHistory, isLoading: historyLoading } = useVoting()

  const [isRefreshing, setIsRefreshing] = React.useState(false)
  const [electionStats, setElectionStats] = React.useState<any>(null)
  const [livePollingData, setLivePollingData] = React.useState<any>(null)

  const activeElections = hookActiveElections || []

  const upcomingElections = elections?.filter(election =>
    election.status === ElectionStatus.SCHEDULED
  ) || []

  const recentVotes = votingHistory?.slice(0, 3) || []

  const dashboardStats = {
    totalElections: elections?.length || 0,
    activeElections: activeElections.length,
    completedVotes: votingHistory?.length || 0,
    upcomingElections: upcomingElections.length
  }

  // Fetch polling data for the first active election
  React.useEffect(() => {
    const fetchElectionStats = async () => {
      if (activeElections.length > 0) {
        try {
          const { getElectionStats } = await import('@/lib/api/elections')
          const { getLiveStats } = await import('@/lib/api/results')

          const firstActiveElection = activeElections[0]
          const [statsResponse, liveStatsResponse] = await Promise.all([
            getElectionStats(firstActiveElection.id),
            getLiveStats(firstActiveElection.id)
          ])

          if (statsResponse.data.success) {
            setElectionStats(statsResponse.data.data)
          }
          if (liveStatsResponse.data.success) {
            setLivePollingData(liveStatsResponse.data.data)
          }
        } catch (error) {
          console.error('Failed to fetch election stats:', error)
        }
      }
    }

    fetchElectionStats()
  }, [activeElections])

  const handleRefresh = async () => {
    setIsRefreshing(true)
    try {
      await refreshElections()
    } catch (error) {
      console.error('Failed to refresh:', error)
    } finally {
      setIsRefreshing(false)
    }
  }

  // Prepare chart data from live polling data (MUST be before early returns)
  const pollingChartData = React.useMemo(() => {
    if (!livePollingData || !livePollingData.positionResults || livePollingData.positionResults.length === 0) {
      return null
    }

    const firstPosition = livePollingData.positionResults[0]
    return {
      labels: firstPosition.results?.map((r: any) => r.candidateName || 'Unknown') || [],
      datasets: [{
        data: firstPosition.results?.map((r: any) => r.totalVotes || 0) || [],
        backgroundColor: [
          'rgba(139, 92, 246, 0.8)',
          'rgba(236, 72, 153, 0.8)',
          'rgba(59, 130, 246, 0.8)',
          'rgba(168, 85, 247, 0.8)',
          'rgba(34, 197, 94, 0.8)',
          'rgba(249, 115, 22, 0.8)',
        ],
      }]
    }
  }, [livePollingData])

  // Prepare turnout trend data (MUST be before early returns)
  const turnoutTrendData = React.useMemo(() => {
    if (!electionStats || !electionStats.timeStats || !electionStats.timeStats.votingByHour) {
      return null
    }

    const hourlyData = electionStats.timeStats.votingByHour
    const hours = Object.keys(hourlyData).sort((a, b) => parseInt(a) - parseInt(b))

    return {
      labels: hours.map(h => `${h}:00`),
      datasets: [{
        label: 'Votes Cast',
        data: hours.map(h => hourlyData[h]),
        borderColor: 'rgba(139, 92, 246, 1)',
        backgroundColor: 'rgba(139, 92, 246, 0.1)',
        tension: 0.4
      }]
    }
  }, [electionStats])

  const getInitials = (firstName?: string, lastName?: string) => {
    if (!firstName || !lastName) return "U"
    return `${firstName[0]}${lastName[0]}`.toUpperCase()
  }

  const getFullName = (firstName?: string, lastName?: string) => {
    if (!firstName || !lastName) return "Unknown User"
    return `${firstName} ${lastName}`.trim()
  }

  if (electionsLoading || historyLoading) {
    return (
      <div className="space-y-6">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
          {[...Array(4)].map((_, i) => (
            <Card key={i} className="animate-pulse">
              <CardContent className="p-6">
                <div className="h-8 bg-gray-200 rounded mb-2"></div>
                <div className="h-4 bg-gray-200 rounded"></div>
              </CardContent>
            </Card>
          ))}
        </div>
      </div>
    )
  }

  return (
    <div className="space-y-4">
      {/* Minimalist Quick Link Bar */}
      <div className="bg-white/60 dark:bg-gray-800/60 backdrop-blur-sm rounded-lg border border-sage-100 dark:border-gray-700 px-4 py-2">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <span className="text-xs font-medium text-gray-600 dark:text-gray-400">Quick Links:</span>
          <div className="flex flex-wrap items-center gap-2">
            <Link href="/elections">
              <Button variant="ghost" size="sm" className="h-8 px-3 text-xs hover:bg-sage-50 dark:hover:bg-gray-700">
                <Vote className="h-3 w-3 mr-1.5" />
                Elections
              </Button>
            </Link>
            <Link href="/results">
              <Button variant="ghost" size="sm" className="h-8 px-3 text-xs hover:bg-sage-50 dark:hover:bg-gray-700">
                <BarChart3 className="h-3 w-3 mr-1.5" />
                Results
              </Button>
            </Link>
            <Link href="/history">
              <Button variant="ghost" size="sm" className="h-8 px-3 text-xs hover:bg-sage-50 dark:hover:bg-gray-700">
                <Clock className="h-3 w-3 mr-1.5" />
                History
              </Button>
            </Link>
            <div className="h-4 w-px bg-gray-300 dark:bg-gray-600"></div>
            <Button
              variant="ghost"
              size="sm"
              onClick={handleRefresh}
              disabled={isRefreshing}
              className="h-8 px-3 text-xs hover:bg-sage-50 dark:hover:bg-gray-700"
            >
              <RefreshCw className={cn("h-3 w-3 mr-1.5", isRefreshing && "animate-spin")} />
              Refresh
            </Button>
          </div>
        </div>
      </div>

      {/* Modern Compact Welcome Banner */}
      <div className="relative overflow-hidden bg-gradient-to-r from-sage-600 via-sage-600 to-emerald-600 dark:from-sage-700 dark:via-sage-700 dark:to-emerald-700 rounded-xl p-4 shadow-md">
        <div className="absolute inset-0 bg-grid-white/10 [mask-image:linear-gradient(0deg,transparent,black)]"></div>
        <div className="relative flex items-center justify-between">
          <div className="flex-1">
            <h1 className="text-lg font-bold text-white mb-0.5">
              Welcome, {user?.firstName || 'Student'}!
            </h1>
            <p className="text-xs text-white/80">
              ID: {user?.studentId} • Ready to make your voice heard
            </p>
          </div>
          <div className="hidden md:flex items-center space-x-4">
            <div className="text-center px-3 py-1.5 bg-white/10 backdrop-blur-sm rounded-lg border border-white/20">
              <div className="text-xl font-bold text-white">{dashboardStats.completedVotes}</div>
              <div className="text-xs text-white/80">Votes</div>
            </div>
            <div className="text-center px-3 py-1.5 bg-white/10 backdrop-blur-sm rounded-lg border border-white/20">
              <div className="text-xl font-bold text-white">{dashboardStats.activeElections}</div>
              <div className="text-xs text-white/80">Active</div>
            </div>
          </div>
        </div>
      </div>

      {/* Quick Stats */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <Card className="dark:bg-gray-800 dark:border-gray-700">
          <CardContent className="p-4">
            <div className="flex items-center space-x-2">
              <div className="p-2 bg-blue-100 dark:bg-blue-900 rounded-lg">
                <Vote className="h-4 w-4 text-blue-600 dark:text-blue-400" />
              </div>
              <div>
                <p className="text-sm text-gray-600 dark:text-gray-400">Total Elections</p>
                <p className="text-xl font-bold dark:text-white">{dashboardStats.totalElections}</p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="dark:bg-gray-800 dark:border-gray-700">
          <CardContent className="p-4">
            <div className="flex items-center space-x-2">
              <div className="p-2 bg-green-100 dark:bg-green-900 rounded-lg">
                <CheckCircle className="h-4 w-4 text-green-600 dark:text-green-400" />
              </div>
              <div>
                <p className="text-sm text-gray-600 dark:text-gray-400">Votes Cast</p>
                <p className="text-xl font-bold dark:text-white">{dashboardStats.completedVotes}</p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="dark:bg-gray-800 dark:border-gray-700">
          <CardContent className="p-4">
            <div className="flex items-center space-x-2">
              <div className="p-2 bg-orange-100 dark:bg-orange-900 rounded-lg">
                <Clock className="h-4 w-4 text-orange-600 dark:text-orange-400" />
              </div>
              <div>
                <p className="text-sm text-gray-600 dark:text-gray-400">Active Now</p>
                <p className="text-xl font-bold dark:text-white">{dashboardStats.activeElections}</p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="dark:bg-gray-800 dark:border-gray-700">
          <CardContent className="p-4">
            <div className="flex items-center space-x-2">
              <div className="p-2 bg-sage-100 dark:bg-sage-900 rounded-lg">
                <Calendar className="h-4 w-4 text-sage-600 dark:text-sage-400" />
              </div>
              <div>
                <p className="text-sm text-gray-600 dark:text-gray-400">Upcoming</p>
                <p className="text-xl font-bold dark:text-white">{dashboardStats.upcomingElections}</p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Live Polling Statistics - Only show if active elections exist */}
      {activeElections.length > 0 ? (
        (pollingChartData || turnoutTrendData || electionStats) ? (
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
          {/* Polling Overview Card */}
          {pollingChartData && (
            <Card className="lg:col-span-1 dark:bg-gray-800 dark:border-gray-700">
              <CardHeader className="pb-3">
                <CardTitle className="flex items-center text-base">
                  <Trophy className="h-4 w-4 mr-2 text-sage-600 dark:text-sage-400" />
                  Live Polling
                </CardTitle>
                <CardDescription className="text-xs">
                  {activeElections[0]?.title || 'Active Election'} - Real-time results
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="h-[200px]">
                  <DoughnutChart
                    data={pollingChartData}
                    options={{
                      plugins: {
                        legend: {
                          position: 'bottom' as const,
                          labels: { font: { size: 10 }, padding: 10 }
                        }
                      }
                    }}
                  />
                </div>
              </CardContent>
            </Card>
          )}

          {/* Turnout Trend Card */}
          {turnoutTrendData && (
            <Card className="lg:col-span-1 dark:bg-gray-800 dark:border-gray-700">
              <CardHeader className="pb-3">
                <CardTitle className="flex items-center text-base">
                  <Activity className="h-4 w-4 mr-2 text-sage-600 dark:text-sage-400" />
                  Voting Trend
                </CardTitle>
                <CardDescription className="text-xs">
                  Hourly turnout pattern
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="h-[200px]">
                  <BarChart
                    data={turnoutTrendData}
                    options={{
                      plugins: {
                        legend: { display: false }
                      },
                      scales: {
                        y: { beginAtZero: true }
                      }
                    }}
                  />
                </div>
              </CardContent>
            </Card>
          )}

          {/* Quick Stats Card */}
          {electionStats && (
            <Card className="lg:col-span-1 dark:bg-gray-800 dark:border-gray-700">
              <CardHeader className="pb-3">
                <CardTitle className="flex items-center text-base">
                  <Users className="h-4 w-4 mr-2 text-sage-600 dark:text-sage-400" />
                  Participation
                </CardTitle>
                <CardDescription className="text-xs">
                  Current election statistics
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-3">
                  <div className="flex items-center justify-between">
                    <span className="text-xs text-gray-600 dark:text-gray-400">Turnout</span>
                    <span className="text-lg font-bold text-sage-600 dark:text-sage-400">
                      {electionStats.turnoutPercentage?.toFixed(1) || 0}%
                    </span>
                  </div>
                  <Progress value={electionStats.turnoutPercentage || 0} className="h-2" />

                  <div className="grid grid-cols-2 gap-3 pt-2">
                    <div className="text-center p-2 bg-sage-50 dark:bg-sage-900/20 rounded-lg">
                      <div className="text-xs text-gray-600 dark:text-gray-400">Eligible</div>
                      <div className="text-lg font-bold dark:text-white">{electionStats.totalEligibleVoters || 0}</div>
                    </div>
                    <div className="text-center p-2 bg-emerald-50 dark:bg-emerald-900/20 rounded-lg">
                      <div className="text-xs text-gray-600 dark:text-gray-400">Voted</div>
                      <div className="text-lg font-bold dark:text-white">{electionStats.totalVotesCast || 0}</div>
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>
          )}
        </div>
        ) : (
          <Card className="dark:bg-gray-800 dark:border-gray-700">
            <CardContent className="p-6 text-center">
              <Activity className="h-12 w-12 text-gray-300 dark:text-gray-600 mx-auto mb-3" />
              <h3 className="text-base font-semibold text-gray-700 dark:text-gray-300 mb-2">
                Loading Election Statistics...
              </h3>
              <p className="text-sm text-gray-500 dark:text-gray-400">
                Statistics and polling data will appear here once voting begins.
              </p>
            </CardContent>
          </Card>
        )
      ) : (
        <Card className="dark:bg-gray-800 dark:border-gray-700">
          <CardContent className="p-6 text-center">
            <Trophy className="h-12 w-12 text-gray-300 dark:text-gray-600 mx-auto mb-3" />
            <h3 className="text-base font-semibold text-gray-700 dark:text-gray-300 mb-2">
              No Active Elections
            </h3>
            <p className="text-sm text-gray-500 dark:text-gray-400 mb-4">
              Live polling statistics will appear here when elections are active.
            </p>
            <Link href="/elections">
              <Button variant="outline" size="sm">
                <Calendar className="h-4 w-4 mr-2" />
                View Upcoming Elections
              </Button>
            </Link>
          </CardContent>
        </Card>
      )}

      {/* Active Elections Alert */}
      {activeElections.length > 0 && (
        <Alert className="border-green-200 bg-green-50 dark:bg-green-900/20 dark:border-green-800">
          <Bell className="h-4 w-4 text-green-600 dark:text-green-400" />
          <AlertDescription className="text-green-800 dark:text-green-200">
            <strong>Action Required:</strong> You have {activeElections.length} active election(s) waiting for your vote.{" "}
            <Link href="/elections" className="underline font-medium">
              Vote now →
            </Link>
          </AlertDescription>
        </Alert>
      )}

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Active Elections */}
        <div className="lg:col-span-2 space-y-6">
          <Card>
            <CardHeader>
              <div className="flex items-center justify-between">
                <CardTitle className="flex items-center">
                  <Vote className="h-5 w-5 mr-2 text-blue-600" />
                  Active Elections
                </CardTitle>
                <Link href="/elections">
                  <Button variant="ghost" size="sm">
                    View All
                    <ArrowRight className="h-4 w-4 ml-1" />
                  </Button>
                </Link>
              </div>
              <CardDescription>
                Elections you can vote in right now
              </CardDescription>
            </CardHeader>
            <CardContent>
              {activeElections.length === 0 ? (
                <div className="text-center py-8">
                  <Vote className="h-12 w-12 text-gray-300 mx-auto mb-4" />
                  <h3 className="text-lg font-medium text-gray-900 mb-2">No Active Elections</h3>
                  <p className="text-gray-500 mb-4">Check back later for new elections to participate in.</p>
                  <Link href="/elections">
                    <Button variant="outline">
                      Browse All Elections
                    </Button>
                  </Link>
                </div>
              ) : (
                <div className="space-y-4">
                  {activeElections.slice(0, 2).map((election) => (
                    <ElectionCard
                      key={election.id}
                      election={election}
                      variant="compact"
                    />
                  ))}
                  {activeElections.length > 2 && (
                    <div className="text-center pt-4">
                      <Link href="/elections">
                        <Button variant="outline">
                          View {activeElections.length - 2} More Elections
                        </Button>
                      </Link>
                    </div>
                  )}
                </div>
              )}
            </CardContent>
          </Card>

          {/* Upcoming Elections */}
          {upcomingElections.length > 0 && (
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center">
                  <Calendar className="h-5 w-5 mr-2 text-sage-600" />
                  Upcoming Elections
                </CardTitle>
                <CardDescription>
                  Elections scheduled to start soon
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  {upcomingElections.slice(0, 2).map((election) => (
                    <ElectionCard
                      key={election.id}
                      election={election}
                      variant="compact"
                    />
                  ))}
                </div>
              </CardContent>
            </Card>
          )}
        </div>

        {/* Sidebar */}
        <div className="space-y-6">
          {/* Recent Activity */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center">
                <BarChart3 className="h-5 w-5 mr-2 text-green-600" />
                Recent Activity
              </CardTitle>
              <CardDescription>
                Your latest voting activity
              </CardDescription>
            </CardHeader>
            <CardContent>
              {recentVotes.length === 0 ? (
                <div className="text-center py-4">
                  <Award className="h-8 w-8 text-gray-300 mx-auto mb-2" />
                  <p className="text-sm text-gray-500">No voting history yet</p>
                </div>
              ) : (
                <div className="space-y-4">
                  {recentVotes.map((vote, index) => (
                    <div key={index} className="flex items-start space-x-3">
                      <div className="w-2 h-2 bg-green-500 rounded-full mt-2"></div>
                      <div className="flex-1 min-w-0">
                        <p className="text-sm font-medium text-gray-900">
                          Voted in Election {vote.electionId}
                        </p>
                        <p className="text-xs text-gray-500">
                          {format(new Date(vote.timestamp), "MMM d, yyyy 'at' h:mm a")}
                        </p>
                      </div>
                    </div>
                  ))}
                  <Link href="/history">
                    <Button variant="ghost" size="sm" className="w-full">
                      View Full History
                    </Button>
                  </Link>
                </div>
              )}
            </CardContent>
          </Card>

          {/* Help & Support */}
          <Card>
            <CardHeader>
              <CardTitle>Need Help?</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-3">
                <p className="text-sm text-gray-600">
                  Contact the Student Council for any voting-related questions.
                </p>
                <Button variant="outline" size="sm" className="w-full">
                  Contact Support
                </Button>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  )
}