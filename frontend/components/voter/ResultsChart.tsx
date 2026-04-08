"use client"

import React, { useMemo } from "react"
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  PieChart,
  Pie,
  Cell,
  Legend
} from "recharts"
import {
  Trophy,
  Users,
  Percent,
  TrendingUp,
  Award,
  Crown,
  Medal,
  Target
} from "lucide-react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { Progress } from "@/components/ui/progress"
import type { ElectionResults, PositionResult, Result, Candidate, SafeUser, Position } from "@/lib/types"
import { CandidateStatus } from "@/lib/enums"
import { cn } from "@/lib/utils/cn"

interface ResultsChartProps {
  results: ElectionResults
  variant?: "default" | "compact" | "detailed"
  showStatistics?: boolean
  className?: string
}

interface CandidateWithResults {
  voteCount: number
  percentage: number
  rank: number
  isWinner: boolean
  color: string
  id: string
  firstName: string
  lastName: string
  email: string
  phone?: string
  photo?: string
  bannerImage?: string
  manifesto?: string
  slogan?: string
  department: string
  faculty: string
  course?: string
  yearOfStudy?: number
  socialMedia?: any
  userId?: string
  positionId: string
  electionId: string
  status: CandidateStatus
  user?: Partial<SafeUser>
  position?: Position
}

const CHART_COLORS = [
  "#3B82F6", "#EF4444", "#10B981", "#F59E0B", "#8B5CF6",
  "#06B6D4", "#F97316", "#84CC16", "#EC4899", "#6366F1"
]

export function ResultsChart({
  results,
  variant = "default",
  showStatistics = true,
  className
}: ResultsChartProps) {
  const chartData = useMemo(() => {
    return results.positionResults.map((positionResult, index) => ({
      position: positionResult.position.name,
      positionId: positionResult.position.id,
      candidates: positionResult.results.map((result, candidateIndex): CandidateWithResults => ({
        id: result.candidate?.id || '',
        firstName: result.candidate?.firstName || '',
        lastName: result.candidate?.lastName || '',
        email: result.candidate?.email || '',
        phone: result.candidate?.phone,
        photo: result.candidate?.photo,
        bannerImage: result.candidate?.bannerImage,
        manifesto: result.candidate?.manifesto,
        slogan: result.candidate?.slogan,
        department: result.candidate?.department || '',
        faculty: result.candidate?.faculty || '',
        course: result.candidate?.course,
        yearOfStudy: result.candidate?.yearOfStudy,
        socialMedia: result.candidate?.socialMedia,
        userId: result.candidate?.userId,
        positionId: result.candidate?.positionId || '',
        electionId: result.candidate?.electionId || '',
        status: result.candidate?.status || CandidateStatus.PENDING,
        user: result.candidate?.user,
        position: result.candidate?.position,
        voteCount: result.voteCount,
        percentage: result.percentage,
        rank: result.rank,
        isWinner: result.isWinner,
        color: CHART_COLORS[candidateIndex % CHART_COLORS.length]
      })),
      totalPositionVotes: positionResult.totalVotes,
      abstainedVotes: positionResult.abstainedVotes,
      winner: positionResult.winner
    }))
  }, [results])

  const overallStats = useMemo(() => {
    const totalCandidates = results.positionResults.reduce((sum, result) => sum + result.results.length, 0)
    const totalPositions = results.positionResults.length

    return {
      totalCandidates,
      totalPositions,
      totalVotes: results.totalVotes,
      totalEligibleVoters: results.totalEligibleVoters,
      turnoutPercentage: results.turnoutPercentage
    }
  }, [results])

  const getInitials = (firstName: string, lastName: string) => {
    return `${firstName[0]}${lastName[0]}`.toUpperCase()
  }

  const getFullName = (candidate?: CandidateWithResults | Candidate) => {
    if (!candidate) return "Unknown"
    return `${candidate.firstName} ${candidate.lastName}`.trim()
  }

  if (variant === "compact") {
    return (
      <div className={cn("space-y-4", className)}>
        {chartData.map((positionData) => (
          <Card key={positionData.positionId}>
            <CardHeader className="pb-3">
              <CardTitle className="text-lg flex items-center">
                <Trophy className="h-5 w-5 mr-2 text-yellow-600" />
                {positionData.position}
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-3">
                {positionData.candidates.slice(0, 3).map((candidate, index) => (
                  <div key={candidate?.id} className="flex items-center space-x-3">
                    <div className="flex items-center space-x-2">
                      {index === 0 && <Crown className="h-4 w-4 text-yellow-500" />}
                      {index === 1 && <Medal className="h-4 w-4 text-gray-400" />}
                      {index === 2 && <Award className="h-4 w-4 text-orange-600" />}
                      <span className="text-sm font-medium">#{index + 1}</span>
                    </div>
                    <Avatar className="h-8 w-8">
                      <AvatarImage src={candidate?.photo} alt={getFullName(candidate)} />
                      <AvatarFallback className="text-xs">
                        {candidate ? getInitials(candidate.firstName, candidate.lastName) : "??"}
                      </AvatarFallback>
                    </Avatar>
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-medium truncate">{getFullName(candidate)}</p>
                      <div className="flex items-center space-x-2">
                        <Progress value={candidate.percentage} className="h-1 flex-1" />
                        <span className="text-xs text-gray-500 min-w-0">
                          {candidate.voteCount} ({candidate.percentage.toFixed(1)}%)
                        </span>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        ))}
      </div>
    )
  }

  return (
    <div className={cn("space-y-6", className)}>
      {/* Overall Statistics */}
      {showStatistics && (
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          <Card>
            <CardContent className="p-4">
              <div className="flex items-center space-x-2">
                <Users className="h-4 w-4 text-blue-500" />
                <div>
                  <p className="text-xs text-gray-600">Total Votes</p>
                  <p className="text-lg font-bold">{overallStats.totalVotes.toLocaleString()}</p>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="p-4">
              <div className="flex items-center space-x-2">
                <Target className="h-4 w-4 text-green-500" />
                <div>
                  <p className="text-xs text-gray-600">Positions</p>
                  <p className="text-lg font-bold">{overallStats.totalPositions}</p>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="p-4">
              <div className="flex items-center space-x-2">
                <Award className="h-4 w-4 text-sage-500" />
                <div>
                  <p className="text-xs text-gray-600">Candidates</p>
                  <p className="text-lg font-bold">{overallStats.totalCandidates}</p>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="p-4">
              <div className="flex items-center space-x-2">
                <Percent className="h-4 w-4 text-orange-500" />
                <div>
                  <p className="text-xs text-gray-600">Turnout</p>
                  <p className="text-lg font-bold">{overallStats.turnoutPercentage.toFixed(1)}%</p>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>
      )}

      {/* Results by Position */}
      <Tabs defaultValue="charts" className="w-full">
        <TabsList className="grid w-full grid-cols-3">
          <TabsTrigger value="charts">Charts</TabsTrigger>
          <TabsTrigger value="detailed">Detailed</TabsTrigger>
          <TabsTrigger value="winners">Winners</TabsTrigger>
        </TabsList>

        <TabsContent value="charts" className="space-y-6">
          {chartData.map((positionData) => (
            <Card key={positionData.positionId}>
              <CardHeader>
                <CardTitle className="flex items-center">
                  <Trophy className="h-5 w-5 mr-2 text-yellow-600" />
                  {positionData.position}
                </CardTitle>
                <CardDescription>
                  Total votes: {positionData.totalPositionVotes.toLocaleString()}
                  {positionData.abstainedVotes > 0 && (
                    <span className="ml-2 text-gray-500">
                      • {positionData.abstainedVotes} abstained
                    </span>
                  )}
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="grid md:grid-cols-2 gap-6">
                  {/* Bar Chart */}
                  <div>
                    <h4 className="text-sm font-medium mb-3">Vote Distribution</h4>
                    <div className="h-64">
                      <ResponsiveContainer width="100%" height="100%">
                        <BarChart data={positionData.candidates}>
                          <CartesianGrid strokeDasharray="3 3" />
                          <XAxis
                            dataKey={(item) => getFullName(item)}
                            angle={-45}
                            textAnchor="end"
                            height={80}
                            fontSize={10}
                          />
                          <YAxis fontSize={10} />
                          <Tooltip
                            formatter={(value: any) => [value, "Votes"]}
                            labelFormatter={(label) => `${label}`}
                          />
                          <Bar
                            dataKey="voteCount"
                            fill="#3B82F6"
                            radius={[4, 4, 0, 0]}
                          />
                        </BarChart>
                      </ResponsiveContainer>
                    </div>
                  </div>

                  {/* Pie Chart */}
                  <div>
                    <h4 className="text-sm font-medium mb-3">Vote Percentage</h4>
                    <div className="h-64">
                      <ResponsiveContainer width="100%" height="100%">
                        <PieChart>
                          <Pie
                            data={positionData.candidates}
                            cx="50%"
                            cy="50%"
                            innerRadius={40}
                            outerRadius={80}
                            paddingAngle={2}
                            dataKey="voteCount"
                          >
                            {positionData.candidates.map((candidate, index) => (
                              <Cell key={`cell-${index}`} fill={candidate.color} />
                            ))}
                          </Pie>
                          <Tooltip
                            formatter={(value: any) => [value, "Votes"]}
                          />
                          <Legend
                            formatter={(value, entry: any) => {
                              const candidate = positionData.candidates.find(c => c.voteCount === entry.payload.voteCount)
                              return getFullName(candidate)
                            }}
                          />
                        </PieChart>
                      </ResponsiveContainer>
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>
          ))}
        </TabsContent>

        <TabsContent value="detailed" className="space-y-6">
          {chartData.map((positionData) => (
            <Card key={positionData.positionId}>
              <CardHeader>
                <CardTitle>{positionData.position}</CardTitle>
                <CardDescription>
                  Detailed breakdown of all candidates and their performance
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  {positionData.candidates
                    .sort((a, b) => b.voteCount - a.voteCount)
                    .map((candidate, index) => (
                    <div key={candidate?.id} className="flex items-center space-x-4 p-4 rounded-lg border">
                      <div className="flex items-center space-x-2">
                        <div className={cn(
                          "w-8 h-8 rounded-full flex items-center justify-center text-sm font-bold text-white",
                          index === 0 ? "bg-yellow-500" :
                          index === 1 ? "bg-gray-400" :
                          index === 2 ? "bg-orange-600" : "bg-gray-300"
                        )}>
                          {index + 1}
                        </div>
                        {index === 0 && <Crown className="h-5 w-5 text-yellow-500" />}
                      </div>

                      <Avatar className="h-12 w-12">
                        <AvatarImage src={candidate?.photo} alt={getFullName(candidate)} />
                        <AvatarFallback>
                          {candidate ? getInitials(candidate.firstName, candidate.lastName) : "??"}
                        </AvatarFallback>
                      </Avatar>

                      <div className="flex-1 min-w-0">
                        <div className="flex items-center space-x-2 mb-1">
                          <h3 className="font-semibold">{getFullName(candidate)}</h3>
                          {candidate?.isWinner && <Badge variant="success">Winner</Badge>}
                        </div>
                        <p className="text-sm text-gray-600 mb-2">{candidate?.user?.studentId || 'N/A'}</p>

                        <div className="space-y-1">
                          <div className="flex justify-between text-sm">
                            <span>Vote Count</span>
                            <span className="font-medium">{candidate.voteCount.toLocaleString()}</span>
                          </div>
                          <Progress value={candidate.percentage} className="h-2" />
                          <div className="flex justify-between text-xs text-gray-500">
                            <span>Vote Share</span>
                            <span>{candidate.percentage.toFixed(2)}%</span>
                          </div>
                        </div>
                      </div>

                      <div className="text-right">
                        <div className="text-2xl font-bold" style={{ color: candidate.color }}>
                          {candidate.voteCount}
                        </div>
                        <div className="text-sm text-gray-500">
                          {candidate.percentage.toFixed(1)}%
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          ))}
        </TabsContent>

        <TabsContent value="winners" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center">
                <Crown className="h-6 w-6 mr-2 text-yellow-500" />
                Election Winners
              </CardTitle>
              <CardDescription>
                Congratulations to all the winners of this election
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {chartData.map((positionData) => {
                  const winner = positionData.winner
                  if (!winner?.candidate) return null

                  return (
                    <div key={positionData.positionId} className="flex items-center space-x-4 p-4 bg-gradient-to-r from-yellow-50 to-orange-50 rounded-lg border border-yellow-200">
                      <div className="flex-shrink-0">
                        <div className="w-12 h-12 bg-yellow-500 rounded-full flex items-center justify-center">
                          <Crown className="h-6 w-6 text-white" />
                        </div>
                      </div>

                      <Avatar className="h-16 w-16 border-2 border-yellow-400">
                        <AvatarImage src={winner.candidate.photo} alt={getFullName(winner.candidate)} />
                        <AvatarFallback className="bg-yellow-100 text-yellow-800 text-lg">
                          {getInitials(winner.candidate.firstName, winner.candidate.lastName)}
                        </AvatarFallback>
                      </Avatar>

                      <div className="flex-1">
                        <div className="flex items-center space-x-2 mb-1">
                          <h3 className="text-xl font-bold text-gray-900">{getFullName(winner.candidate)}</h3>
                          <Badge className="bg-yellow-500 text-white">Winner</Badge>
                        </div>
                        <p className="text-lg font-semibold text-yellow-700 mb-1">{positionData.position}</p>
                        <p className="text-sm text-gray-600 mb-2">{winner.candidate.user?.studentId || 'N/A'}</p>

                        <div className="flex items-center space-x-4 text-sm">
                          <div className="flex items-center space-x-1">
                            <Users className="h-4 w-4 text-gray-500" />
                            <span>{winner.voteCount.toLocaleString()} votes</span>
                          </div>
                          <div className="flex items-center space-x-1">
                            <TrendingUp className="h-4 w-4 text-green-500" />
                            <span>{winner.percentage.toFixed(1)}% share</span>
                          </div>
                        </div>
                      </div>

                      <div className="text-right">
                        <div className="text-3xl font-bold text-yellow-600">
                          {winner.voteCount}
                        </div>
                        <div className="text-sm text-gray-500">votes</div>
                      </div>
                    </div>
                  )
                })}
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  )
}

export default ResultsChart