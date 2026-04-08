"use client"

import React, { useState, useEffect } from "react"
import { useParams } from "next/navigation"
import Link from "next/link"
import {
  ArrowLeft,
  Download,
  Share2,
  Trophy,
  Users,
  BarChart3,
  Calendar,
  Clock,
  Award,
  TrendingUp,
  Percent,
  Eye,
  Crown
} from "lucide-react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Separator } from "@/components/ui/separator"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Alert, AlertDescription } from "@/components/ui/alert"
import { ResultsChart } from "@/components/voter/ResultsChart"
import { useResults } from "@/lib/hooks/useResults"
import { useElections } from "@/lib/hooks/useElections"
import { ElectionStatus, ELECTION_STATUS_LABELS } from "@/lib/enums"
import { cn } from "@/lib/utils/cn"
import { format } from "date-fns"

export default function ElectionResultsPage() {
  const params = useParams()
  const electionId = params.id as string

  const { fetchElection } = useElections({ autoFetch: false })
  const { fetchResults } = useResults()

  const [election, setElection] = useState<any>(null)
  const [results, setResults] = useState<any>(null)
  const [electionLoading, setElectionLoading] = useState(true)
  const [resultsLoading, setResultsLoading] = useState(true)

  useEffect(() => {
    const loadData = async () => {
      try {
        setElectionLoading(true)
        setResultsLoading(true)
        const electionData = await fetchElection(electionId)
        setElection(electionData)
        const resultsData = await fetchResults(electionId)
        setResults(resultsData)
      } catch (error) {
        console.error('Error loading data:', error)
      } finally {
        setElectionLoading(false)
        setResultsLoading(false)
      }
    }

    loadData()
  }, [electionId, fetchElection, fetchResults])

  const [selectedTab, setSelectedTab] = useState("overview")

  if (electionLoading || resultsLoading) {
    return (
      <div className="space-y-6">
        <div className="h-8 bg-gray-200 dark:bg-gray-700 rounded animate-pulse"></div>
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          <div className="lg:col-span-2 space-y-6">
            <Card className="dark:bg-gray-800 dark:border-gray-700">
              <CardContent className="p-6">
                <div className="space-y-4">
                  <div className="h-6 bg-gray-200 dark:bg-gray-700 rounded animate-pulse"></div>
                  <div className="h-4 bg-gray-200 dark:bg-gray-700 rounded animate-pulse"></div>
                  <div className="h-64 bg-gray-200 dark:bg-gray-700 rounded animate-pulse"></div>
                </div>
              </CardContent>
            </Card>
          </div>
          <div className="space-y-6">
            <Card className="dark:bg-gray-800 dark:border-gray-700">
              <CardContent className="p-6">
                <div className="space-y-4">
                  <div className="h-6 bg-gray-200 dark:bg-gray-700 rounded animate-pulse"></div>
                  <div className="h-4 bg-gray-200 dark:bg-gray-700 rounded animate-pulse"></div>
                </div>
              </CardContent>
            </Card>
          </div>
        </div>
      </div>
    )
  }

  if (!election || !results) {
    return (
      <div className="text-center py-12">
        <h2 className="text-2xl font-bold text-gray-900 mb-4">Results Not Available</h2>
        <p className="text-gray-600 mb-6">
          {election?.status !== ElectionStatus.COMPLETED
            ? "Results will be available after the election is completed."
            : "Election results could not be loaded."}
        </p>
        <Link href="/elections">
          <Button>
            <ArrowLeft className="h-4 w-4 mr-2" />
            Back to Elections
          </Button>
        </Link>
      </div>
    )
  }

  const getStatusVariant = () => {
    switch (election.status) {
      case ElectionStatus.ACTIVE:
        return "info"
      case ElectionStatus.COMPLETED:
        return "success"
      case ElectionStatus.CANCELLED:
        return "destructive"
      default:
        return "outline"
    }
  }

  const winners = results.positionResults
    .map((pr: { winner: any }) => pr.winner)
    .filter(Boolean)

  const totalCandidates = results.positionResults.reduce(
    (sum: any, pr: { results: string | any[] }) => sum + pr.results.length,
    0
  )

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center space-x-4">
          <Link href={`/elections/${electionId}`}>
            <Button variant="ghost" size="sm">
              <ArrowLeft className="h-4 w-4 mr-2" />
              Back to Election
            </Button>
          </Link>
          <Separator orientation="vertical" className="h-6 dark:bg-gray-700" />
          <div>
            <h1 className="text-3xl font-bold text-gray-900 dark:text-white">Election Results</h1>
            <p className="text-gray-600 dark:text-gray-400 mt-1">{election.title}</p>
          </div>
        </div>

        <div className="flex items-center space-x-2">
          <Badge variant={getStatusVariant()}>
            {ELECTION_STATUS_LABELS[election.status as ElectionStatus]}
          </Badge>
          <Button variant="outline" size="sm">
            <Download className="h-4 w-4 mr-2" />
            Export
          </Button>
          <Button variant="outline" size="sm">
            <Share2 className="h-4 w-4 mr-2" />
            Share
          </Button>
        </div>
      </div>

      {/* Status Alert */}
      {election.status === ElectionStatus.ACTIVE && (
        <Alert>
          <Clock className="h-4 w-4" />
          <AlertDescription>
            <strong>Election In Progress:</strong> These are preliminary results. Final results will be available after voting ends on {format(new Date(election.endDate), "PPP 'at' p")}.
          </AlertDescription>
        </Alert>
      )}

      {election.status === ElectionStatus.COMPLETED && (
        <Alert className="border-green-200 bg-green-50 dark:bg-green-900/20 dark:border-green-900">
          <Trophy className="h-4 w-4 text-green-600 dark:text-green-400" />
          <AlertDescription className="text-green-800 dark:text-green-300">
            <strong>Election Completed:</strong> These are the final results for this election.
          </AlertDescription>
        </Alert>
      )}

      <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
        {/* Main Content */}
        <div className="lg:col-span-3">
          <Tabs value={selectedTab} onValueChange={setSelectedTab}>
            <TabsList className="grid w-full grid-cols-4">
              <TabsTrigger value="overview">Overview</TabsTrigger>
              <TabsTrigger value="charts">Charts</TabsTrigger>
              <TabsTrigger value="detailed">Detailed</TabsTrigger>
              <TabsTrigger value="winners">Winners</TabsTrigger>
            </TabsList>

            <TabsContent value="overview" className="space-y-6">
              {/* Quick Stats */}
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                <Card>
                  <CardContent className="p-4 text-center">
                    <Users className="h-6 w-6 text-blue-600 mx-auto mb-2" />
                    <div className="text-2xl font-bold">{results.totalVotes.toLocaleString()}</div>
                    <div className="text-sm text-gray-600">Total Votes</div>
                  </CardContent>
                </Card>

                <Card>
                  <CardContent className="p-4 text-center">
                    <Percent className="h-6 w-6 text-green-600 mx-auto mb-2" />
                    <div className="text-2xl font-bold">{results.turnoutPercentage.toFixed(1)}%</div>
                    <div className="text-sm text-gray-600">Turnout</div>
                  </CardContent>
                </Card>

                <Card>
                  <CardContent className="p-4 text-center">
                    <Award className="h-6 w-6 text-sage-600 mx-auto mb-2" />
                    <div className="text-2xl font-bold">{totalCandidates}</div>
                    <div className="text-sm text-gray-600">Candidates</div>
                  </CardContent>
                </Card>

                <Card>
                  <CardContent className="p-4 text-center">
                    <Trophy className="h-6 w-6 text-yellow-600 mx-auto mb-2" />
                    <div className="text-2xl font-bold">{winners.length}</div>
                    <div className="text-sm text-gray-600">Winners</div>
                  </CardContent>
                </Card>
              </div>

              {/* Election Info */}
              <Card>
                <CardHeader>
                  <CardTitle>Election Information</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm">
                    <div>
                      <label className="font-medium text-gray-700">Election</label>
                      <p className="text-gray-900">{election.title}</p>
                    </div>
                    <div>
                      <label className="font-medium text-gray-700">Type</label>
                      <p className="text-gray-900">{election.type}</p>
                    </div>
                    <div>
                      <label className="font-medium text-gray-700">Started</label>
                      <p className="text-gray-900">{format(new Date(election.startDate), "PPP")}</p>
                    </div>
                    <div>
                      <label className="font-medium text-gray-700">Ended</label>
                      <p className="text-gray-900">{format(new Date(election.endDate), "PPP")}</p>
                    </div>
                    <div>
                      <label className="font-medium text-gray-700">Total Eligible Voters</label>
                      <p className="text-gray-900">{results.totalEligibleVoters.toLocaleString()}</p>
                    </div>
                    <div>
                      <label className="font-medium text-gray-700">Votes Cast</label>
                      <p className="text-gray-900">{results.totalVotes.toLocaleString()}</p>
                    </div>
                  </div>
                </CardContent>
              </Card>

              {/* Position Summary */}
              <Card>
                <CardHeader>
                  <CardTitle>Position Summary</CardTitle>
                  <CardDescription>
                    Quick overview of results for each position
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="space-y-4">
                    {results.positionResults.map((positionResult: any) => {
                      const winner = positionResult.winner
                      const totalVotes = positionResult.totalVotes

                      return (
                        <div key={positionResult.position.id} className="border rounded-lg p-4">
                          <div className="flex items-center justify-between mb-3">
                            <div>
                              <h3 className="font-semibold">{positionResult.position.name}</h3>
                              <p className="text-sm text-gray-600">
                                {totalVotes.toLocaleString()} total votes " {positionResult.results.length} candidates
                              </p>
                            </div>
                            {positionResult.abstainedVotes > 0 && (
                              <Badge variant="outline">
                                {positionResult.abstainedVotes} abstained
                              </Badge>
                            )}
                          </div>

                          {winner && (
                            <div className="flex items-center space-x-3 p-3 bg-yellow-50 rounded-lg border border-yellow-200">
                              <Crown className="h-5 w-5 text-yellow-600" />
                              <div className="flex-1">
                                <p className="font-medium text-yellow-900">
                                  {winner.candidate.firstName} {winner.candidate.lastName}
                                </p>
                                <p className="text-sm text-yellow-700">
                                  {winner.voteCount.toLocaleString()} votes ({winner.percentage.toFixed(1)}%)
                                </p>
                              </div>
                              <Badge className="bg-yellow-500 text-white">Winner</Badge>
                            </div>
                          )}
                        </div>
                      )
                    })}
                  </div>
                </CardContent>
              </Card>
            </TabsContent>

            <TabsContent value="charts">
              <ResultsChart results={results} variant="default" showStatistics={false} />
            </TabsContent>

            <TabsContent value="detailed">
              <ResultsChart results={results} variant="detailed" showStatistics={false} />
            </TabsContent>

            <TabsContent value="winners">
              <ResultsChart results={results} variant="default" showStatistics={false} />
            </TabsContent>
          </Tabs>
        </div>

        {/* Sidebar */}
        <div className="space-y-6">
          {/* Quick Actions */}
          <Card>
            <CardHeader>
              <CardTitle>Actions</CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              <Button variant="outline" className="w-full">
                <Download className="h-4 w-4 mr-2" />
                Download Report
              </Button>

              <Button variant="outline" className="w-full">
                <Share2 className="h-4 w-4 mr-2" />
                Share Results
              </Button>

              <Link href={`/elections/${electionId}`} className="block">
                <Button variant="outline" className="w-full">
                  <Eye className="h-4 w-4 mr-2" />
                  View Election
                </Button>
              </Link>
            </CardContent>
          </Card>

          {/* Election Stats */}
          <Card>
            <CardHeader>
              <CardTitle>Election Statistics</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-4 text-sm">
                <div className="flex justify-between">
                  <span className="text-gray-600">Total Positions</span>
                  <span className="font-medium">{results.positionResults.length}</span>
                </div>

                <div className="flex justify-between">
                  <span className="text-gray-600">Total Candidates</span>
                  <span className="font-medium">{totalCandidates}</span>
                </div>

                <div className="flex justify-between">
                  <span className="text-gray-600">Eligible Voters</span>
                  <span className="font-medium">{results.totalEligibleVoters.toLocaleString()}</span>
                </div>

                <div className="flex justify-between">
                  <span className="text-gray-600">Votes Cast</span>
                  <span className="font-medium">{results.totalVotes.toLocaleString()}</span>
                </div>

                <div className="flex justify-between">
                  <span className="text-gray-600">Voter Turnout</span>
                  <span className="font-medium">{results.turnoutPercentage.toFixed(1)}%</span>
                </div>

                <Separator />

                <div className="flex justify-between">
                  <span className="text-gray-600">Winners Declared</span>
                  <span className="font-medium">{winners.length}</span>
                </div>

                <div className="flex justify-between">
                  <span className="text-gray-600">Total Abstentions</span>
                  <span className="font-medium">
                    {results.positionResults.reduce((sum: any, pr: { abstainedVotes: any }) => sum + pr.abstainedVotes, 0)}
                  </span>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Top Performers */}
          <Card>
            <CardHeader>
              <CardTitle>Top Performers</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-3">
                {winners.slice(0, 3).map((winner: any, index: any) => (
                  <div key={winner.candidate.id} className="flex items-center space-x-3">
                    <div className={cn(
                      "w-6 h-6 rounded-full flex items-center justify-center text-xs font-bold text-white",
                      index === 0 ? "bg-yellow-500" :
                      index === 1 ? "bg-gray-400" :
                      "bg-orange-600"
                    )}>
                      {index + 1}
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-medium truncate">
                        {winner.candidate.firstName} {winner.candidate.lastName}
                      </p>
                      <p className="text-xs text-gray-500">
                        {winner.voteCount.toLocaleString()} votes
                      </p>
                    </div>
                    <div className="text-right">
                      <p className="text-sm font-medium">{winner.percentage.toFixed(1)}%</p>
                    </div>
                  </div>
                ))}

                {winners.length > 3 && (
                  <div className="text-center pt-2">
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => setSelectedTab("winners")}
                    >
                      View All Winners
                    </Button>
                  </div>
                )}
              </div>
            </CardContent>
          </Card>

          {/* Help */}
          <Card>
            <CardHeader>
              <CardTitle>About Results</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-3 text-sm text-gray-600">
                <p>
                  These results are calculated based on the votes cast during the election period.
                </p>
                <p>
                  Winners are determined by the highest number of votes received for each position.
                </p>
                <p>
                  All results are secured using blockchain technology for transparency and verification.
                </p>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  )
}