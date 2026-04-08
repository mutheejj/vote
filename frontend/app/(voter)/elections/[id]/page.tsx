"use client"

import React, { useState } from "react"
import { useParams, useRouter } from "next/navigation"
import { useQuery } from "@tanstack/react-query"
import Link from "next/link"
import {
  Calendar,
  Clock,
  Users,
  Vote,
  ArrowLeft,
  CheckCircle,
  AlertCircle,
  Info,
  Award,
  MapPin,
  BookOpen,
  Share2
} from "lucide-react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Separator } from "@/components/ui/separator"
import { Alert, AlertDescription } from "@/components/ui/alert"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { CandidateCard } from "@/components/voter/CandidateCard"
import { useElections } from "@/lib/hooks/useElections"
import { getCandidatesByElection } from "@/lib/api/candidates"
import { useAuth } from "@/lib/hooks/useAuth"
import { ElectionStatus, ELECTION_STATUS_LABELS } from "@/lib/enums"
import { cn } from "@/lib/utils/cn"
import { format, isAfter, isBefore } from "date-fns"

export default function ElectionDetailsPage() {
  const params = useParams()
  const router = useRouter()
  const { user } = useAuth()
  const electionId = params.id as string

  const { fetchElection } = useElections({ autoFetch: false })

  const { data: election, isLoading: electionLoading, error: electionError } = useQuery({
    queryKey: ['election', electionId],
    queryFn: () => fetchElection(electionId),
    enabled: !!electionId,
  })

  const { data: candidatesResponse, isLoading: candidatesLoading } = useQuery({
    queryKey: ['candidates', electionId, 'APPROVED'],
    queryFn: () => getCandidatesByElection(electionId, { status: 'APPROVED' }),
    enabled: !!electionId,
    refetchInterval: election?.status === 'ACTIVE' ? 30000 : false, // Refetch every 30s for active elections
    staleTime: 60000, // Consider data stale after 1 minute
  })

  // Ensure candidates is always an array
  // Response structure: { data: { data: { candidates: [...], total, pages } } }
  const candidatesData = candidatesResponse?.data?.data?.candidates || candidatesResponse?.data?.data
  const candidates = Array.isArray(candidatesData) ? candidatesData : []

  const [selectedTab, setSelectedTab] = useState("overview")

  if (electionLoading) {
    return (
      <div className="space-y-6">
        <div className="h-8 bg-gray-200 rounded animate-pulse"></div>
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          <div className="lg:col-span-2 space-y-6">
            <Card>
              <CardContent className="p-6">
                <div className="space-y-4">
                  <div className="h-6 bg-gray-200 rounded animate-pulse"></div>
                  <div className="h-4 bg-gray-200 rounded animate-pulse"></div>
                  <div className="h-4 bg-gray-200 rounded animate-pulse"></div>
                </div>
              </CardContent>
            </Card>
          </div>
          <div className="space-y-6">
            <Card>
              <CardContent className="p-6">
                <div className="space-y-4">
                  <div className="h-6 bg-gray-200 rounded animate-pulse"></div>
                  <div className="h-4 bg-gray-200 rounded animate-pulse"></div>
                </div>
              </CardContent>
            </Card>
          </div>
        </div>
      </div>
    )
  }

  if (electionError || !election) {
    return (
      <div className="text-center py-12">
        <h2 className="text-2xl font-bold text-gray-900 mb-4">Election Not Found</h2>
        <p className="text-gray-600 mb-6">The election you're looking for doesn't exist or has been removed.</p>
        <Link href="/elections">
          <Button>
            <ArrowLeft className="h-4 w-4 mr-2" />
            Back to Elections
          </Button>
        </Link>
      </div>
    )
  }

  const now = new Date()
  const startDate = new Date(election.startDate)
  const endDate = new Date(election.endDate)

  const canVote = election.status === ElectionStatus.ACTIVE &&
                  isAfter(now, startDate) &&
                  isBefore(now, endDate)

  const isUpcoming = election.status === ElectionStatus.SCHEDULED || isBefore(now, startDate)
  const isCompleted = election.status === ElectionStatus.COMPLETED || isAfter(now, endDate)

  const getStatusVariant = () => {
    switch (election.status) {
      case ElectionStatus.ACTIVE:
        return "success"
      case ElectionStatus.SCHEDULED:
        return "info"
      case ElectionStatus.COMPLETED:
        return "secondary"
      case ElectionStatus.CANCELLED:
        return "destructive"
      default:
        return "outline"
    }
  }

  const candidatesByPosition = candidates?.reduce((acc, candidate) => {
    const positionId = candidate.positionId
    if (!acc[positionId]) {
      acc[positionId] = []
    }
    acc[positionId].push(candidate)
    return acc
  }, {} as Record<string, typeof candidates>) || {}

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center space-x-4">
        <Link href="/elections">
          <Button variant="ghost" size="sm">
            <ArrowLeft className="h-4 w-4 mr-2" />
            Back to Elections
          </Button>
        </Link>
        <Separator orientation="vertical" className="h-6" />
        <div className="flex-1">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-3xl font-bold text-gray-900">{election.title}</h1>
              <p className="text-gray-600 mt-1">{election.description}</p>
            </div>
            <div className="flex items-center space-x-2">
              <Badge variant={getStatusVariant()}>
                {ELECTION_STATUS_LABELS[election.status]}
              </Badge>
              <Button variant="outline" size="sm">
                <Share2 className="h-4 w-4 mr-2" />
                Share
              </Button>
            </div>
          </div>
        </div>
      </div>

      {/* Status Alert */}
      {canVote && (
        <Alert className="border-green-200 bg-green-50">
          <Vote className="h-4 w-4 text-green-600" />
          <AlertDescription className="text-green-800">
            <strong>Voting is now open!</strong> You can cast your vote for this election.{" "}
            <Link href={`/vote/${election.id}`} className="underline font-medium">
              Vote now �
            </Link>
          </AlertDescription>
        </Alert>
      )}

      {isUpcoming && (
        <Alert>
          <Clock className="h-4 w-4" />
          <AlertDescription>
            <strong>Upcoming Election:</strong> Voting starts on {format(startDate, "PPP 'at' p")}.
          </AlertDescription>
        </Alert>
      )}

      {isCompleted && (
        <Alert className="border-blue-200 bg-blue-50">
          <CheckCircle className="h-4 w-4 text-blue-600" />
          <AlertDescription className="text-blue-800">
            <strong>Election Completed:</strong> Voting ended on {format(endDate, "PPP 'at' p")}.{" "}
            <Link href={`/results/${election.id}`} className="underline font-medium">
              View results �
            </Link>
          </AlertDescription>
        </Alert>
      )}

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Main Content */}
        <div className="lg:col-span-2">
          <Tabs value={selectedTab} onValueChange={setSelectedTab}>
            <TabsList className="grid w-full grid-cols-3">
              <TabsTrigger value="overview">Overview</TabsTrigger>
              <TabsTrigger value="positions">Positions</TabsTrigger>
              <TabsTrigger value="candidates">Candidates</TabsTrigger>
            </TabsList>

            <TabsContent value="overview" className="space-y-6">
              {/* Election Details */}
              <Card>
                <CardHeader>
                  <CardTitle>Election Information</CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                      <label className="text-sm font-medium text-gray-700">Election Type</label>
                      <p className="text-gray-900">{election.type}</p>
                    </div>
                    <div>
                      <label className="text-sm font-medium text-gray-700">Status</label>
                      <p className="text-gray-900">{ELECTION_STATUS_LABELS[election.status]}</p>
                    </div>
                    <div>
                      <label className="text-sm font-medium text-gray-700">Start Date</label>
                      <p className="text-gray-900">{format(startDate, "PPP 'at' p")}</p>
                    </div>
                    <div>
                      <label className="text-sm font-medium text-gray-700">End Date</label>
                      <p className="text-gray-900">{format(endDate, "PPP 'at' p")}</p>
                    </div>
                  </div>

                  <Separator />

                  <div>
                    <label className="text-sm font-medium text-gray-700 mb-2 block">Description</label>
                    <p className="text-gray-900 leading-relaxed">{election.description}</p>
                  </div>

                  {election.rules && (
                    <div>
                      <label className="text-sm font-medium text-gray-700 mb-2 block">Election Rules</label>
                      <div className="bg-gray-50 rounded-lg p-4">
                        <p className="text-sm text-gray-700 leading-relaxed">{election.rules}</p>
                      </div>
                    </div>
                  )}
                </CardContent>
              </Card>

              {/* Quick Stats */}
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                <Card>
                  <CardContent className="p-4 text-center">
                    <Users className="h-6 w-6 text-blue-600 mx-auto mb-2" />
                    <div className="text-2xl font-bold">{election.positions?.length || 0}</div>
                    <div className="text-sm text-gray-600">Positions</div>
                  </CardContent>
                </Card>
                <Card>
                  <CardContent className="p-4 text-center">
                    <Award className="h-6 w-6 text-sage-600 mx-auto mb-2" />
                    <div className="text-2xl font-bold">{candidates?.length || 0}</div>
                    <div className="text-sm text-gray-600">Candidates</div>
                  </CardContent>
                </Card>
                <Card>
                  <CardContent className="p-4 text-center">
                    <Vote className="h-6 w-6 text-green-600 mx-auto mb-2" />
                    <div className="text-2xl font-bold">{election.totalVotes || 0}</div>
                    <div className="text-sm text-gray-600">Total Votes</div>
                  </CardContent>
                </Card>
                <Card>
                  <CardContent className="p-4 text-center">
                    <Clock className="h-6 w-6 text-orange-600 mx-auto mb-2" />
                    <div className="text-2xl font-bold">
                      {Math.ceil((endDate.getTime() - startDate.getTime()) / (1000 * 60 * 60 * 24))}
                    </div>
                    <div className="text-sm text-gray-600">Duration (days)</div>
                  </CardContent>
                </Card>
              </div>
            </TabsContent>

            <TabsContent value="positions" className="space-y-6">
              <Card>
                <CardHeader>
                  <CardTitle>Available Positions</CardTitle>
                  <CardDescription>
                    Positions available for voting in this election
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  {election.positions?.length === 0 ? (
                    <div className="text-center py-8">
                      <Award className="h-12 w-12 text-gray-300 mx-auto mb-4" />
                      <h3 className="text-lg font-medium text-gray-900 mb-2">No Positions</h3>
                      <p className="text-gray-500">No positions have been configured for this election.</p>
                    </div>
                  ) : (
                    <div className="space-y-4">
                      {election.positions?.map((position) => (
                        <Card key={position.id} className="border-gray-200">
                          <CardContent className="p-4">
                            <div className="flex items-start justify-between">
                              <div className="flex-1">
                                <h3 className="font-semibold text-lg">{position.name}</h3>
                                {position.description && (
                                  <p className="text-gray-600 mt-1">{position.description}</p>
                                )}
                                <div className="flex items-center space-x-4 mt-2 text-sm text-gray-500">
                                  <div className="flex items-center space-x-1">
                                    <Users className="h-4 w-4" />
                                    <span>Max {position.maxSelections} selection(s)</span>
                                  </div>
                                  <div className="flex items-center space-x-1">
                                    <Award className="h-4 w-4" />
                                    <span>{candidatesByPosition[position.id]?.length || 0} candidate(s)</span>
                                  </div>
                                </div>
                              </div>
                              <Badge variant="outline">
                                {position.maxSelections === 1 ? "Single Choice" : "Multiple Choice"}
                              </Badge>
                            </div>
                          </CardContent>
                        </Card>
                      ))}
                    </div>
                  )}
                </CardContent>
              </Card>
            </TabsContent>

            <TabsContent value="candidates" className="space-y-6">
              {Object.keys(candidatesByPosition).length === 0 ? (
                <Card>
                  <CardContent className="p-12 text-center">
                    <Users className="h-12 w-12 text-gray-300 mx-auto mb-4" />
                    <h3 className="text-lg font-medium text-gray-900 mb-2">No Candidates</h3>
                    <p className="text-gray-500">No candidates have been registered for this election yet.</p>
                  </CardContent>
                </Card>
              ) : (
                Object.entries(candidatesByPosition).map(([positionId, positionCandidates]) => {
                  const position = election.positions?.find(p => p.id === positionId)
                  if (!position) return null

                  return (
                    <Card key={positionId}>
                      <CardHeader>
                        <CardTitle className="flex items-center">
                          <Award className="h-5 w-5 mr-2 text-sage-600" />
                          {position.name}
                        </CardTitle>
                        <CardDescription>
                          {position.description || `Candidates running for ${position.name}`}
                        </CardDescription>
                      </CardHeader>
                      <CardContent>
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                          {positionCandidates?.map((candidate) => (
                            <CandidateCard
                              key={candidate.id}
                              candidate={candidate}
                              position={position}
                              variant="default"
                            />
                          ))}
                        </div>
                      </CardContent>
                    </Card>
                  )
                })
              )}
            </TabsContent>
          </Tabs>
        </div>

        {/* Sidebar */}
        <div className="space-y-6">
          {/* Action Card */}
          <Card>
            <CardHeader>
              <CardTitle>Take Action</CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              {canVote ? (
                <Link href={`/vote/${election.id}`} className="block">
                  <Button className="w-full bg-green-600 hover:bg-green-700">
                    <Vote className="h-4 w-4 mr-2" />
                    Vote Now
                  </Button>
                </Link>
              ) : isCompleted ? (
                <Link href={`/results/${election.id}`} className="block">
                  <Button variant="outline" className="w-full">
                    <CheckCircle className="h-4 w-4 mr-2" />
                    View Results
                  </Button>
                </Link>
              ) : (
                <Button disabled className="w-full">
                  <Clock className="h-4 w-4 mr-2" />
                  {isUpcoming ? "Voting Not Started" : "Voting Ended"}
                </Button>
              )}

              <Button variant="outline" className="w-full">
                <Share2 className="h-4 w-4 mr-2" />
                Share Election
              </Button>
            </CardContent>
          </Card>

          {/* Timeline */}
          <Card>
            <CardHeader>
              <CardTitle>Election Timeline</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                <div className="flex items-start space-x-3">
                  <div className={cn(
                    "w-3 h-3 rounded-full mt-1",
                    isBefore(now, startDate) ? "bg-gray-300" : "bg-green-500"
                  )} />
                  <div className="flex-1">
                    <p className="font-medium">Voting Starts</p>
                    <p className="text-sm text-gray-600">{format(startDate, "PPP 'at' p")}</p>
                  </div>
                </div>

                <div className="flex items-start space-x-3">
                  <div className={cn(
                    "w-3 h-3 rounded-full mt-1",
                    isAfter(now, endDate) ? "bg-red-500" : isBefore(now, endDate) && isAfter(now, startDate) ? "bg-green-500" : "bg-gray-300"
                  )} />
                  <div className="flex-1">
                    <p className="font-medium">Voting Ends</p>
                    <p className="text-sm text-gray-600">{format(endDate, "PPP 'at' p")}</p>
                  </div>
                </div>

                {isCompleted && (
                  <div className="flex items-start space-x-3">
                    <div className="w-3 h-3 rounded-full mt-1 bg-blue-500" />
                    <div className="flex-1">
                      <p className="font-medium">Results Available</p>
                      <p className="text-sm text-gray-600">View election results</p>
                    </div>
                  </div>
                )}
              </div>
            </CardContent>
          </Card>

          {/* Help */}
          <Card>
            <CardHeader>
              <CardTitle>Need Help?</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-3 text-sm">
                <p className="text-gray-600">
                  Have questions about this election or need help with voting?
                </p>
                <Button variant="outline" size="sm" className="w-full">
                  <Info className="h-4 w-4 mr-2" />
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