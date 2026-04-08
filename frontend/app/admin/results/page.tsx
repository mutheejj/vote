"use client"

import React, { useState } from 'react'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog'
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from '@/components/ui/alert-dialog'
import { Progress } from '@/components/ui/progress'
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar'
import {
  BarChart3,
  Download,
  Eye,
  Calculator,
  CheckCircle,
  Trophy,
  Users,
  Vote,
  TrendingUp,
  FileDown,
  Loader2,
  AlertTriangle,
  Clock,
  Percent
} from 'lucide-react'
import { useAuth } from '@/lib/hooks/useAuth'
import { useNotifications } from '@/lib/hooks/useNotifications'
import { NotificationType } from '@/lib/enums'
import { cn } from '@/lib/utils/cn'
import { Election, Result, Position, Candidate } from '@/lib/types'
import { getElections } from '@/lib/api/elections'
import {
  getElectionResults,
  getResultsSummary,
  calculateResults,
  publishResults
} from '@/lib/api/results'

interface ElectionResultsData {
  election: Election
  positions: Array<{
    position: Position
    candidates: Array<{
      candidate: Candidate
      votes: number
      percentage: number
      isWinner: boolean
    }>
    totalVotes: number
    abstainVotes: number
  }>
  totalVoters: number
  totalVotesCast: number
  turnoutPercentage: number
  isPublished: boolean
}

export default function AdminResultsPage() {
  const { user } = useAuth()
  const { addNotification } = useNotifications()
  const queryClient = useQueryClient()
  const [selectedElection, setSelectedElection] = useState<string>('none')
  const [selectedPosition, setSelectedPosition] = useState<string>('all')

  // Fetch elections
  const { data: electionsData, isLoading: loadingElections } = useQuery({
    queryKey: ['elections'],
    queryFn: async () => {
      const response = await getElections()
      // Handle paginated response - return the data array
      return response.data.data?.data || []
    }
  })

  // Fetch results for selected election
  const { data: resultsData, isLoading: loadingResults, error } = useQuery({
    queryKey: ['results', selectedElection],
    queryFn: async () => {
      if (!selectedElection || selectedElection === 'none') return null
      const response = await getElectionResults(selectedElection)
      return response.data
    },
    enabled: !!selectedElection && selectedElection !== 'none'
  })

  // Calculate results mutation
  const calculateResultsMutation = useMutation({
    mutationFn: (electionId: string) => calculateResults(electionId),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['results', selectedElection] })
      addNotification({
        type: NotificationType.SUCCESS,
        title: 'Success',
        message: 'Election results calculated successfully',
      })
    },
    onError: (error: any) => {
      addNotification({
        type: NotificationType.ERROR,
        title: 'Error',
        message: error.response?.data?.message || 'Failed to calculate results',
      })
    }
  })

  // Publish results mutation
  const publishResultsMutation = useMutation({
    mutationFn: (electionId: string) => publishResults(electionId),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['results', selectedElection] })
      addNotification({
        type: NotificationType.SUCCESS,
        title: 'Success',
        message: 'Election results published successfully',
      })
    },
    onError: (error: any) => {
      addNotification({
        type: NotificationType.ERROR,
        title: 'Error',
        message: error.response?.data?.message || 'Failed to publish results',
      })
    }
  })

  // Export results functionality (to be implemented with actual API)
  const handleExport = (format: string) => {
    addNotification({
      type: NotificationType.SUCCESS,
      title: 'Export Feature',
      message: `Export ${format.toUpperCase()} functionality will be implemented`,
    })
  }

  const getInitials = (firstName: string, lastName: string) => {
    return `${firstName[0]}${lastName[0]}`.toUpperCase()
  }

  const getElectionStatusColor = (status: string) => {
    switch (status) {
      case 'DRAFT':
        return 'bg-gray-100 text-gray-800'
      case 'PUBLISHED':
        return 'bg-blue-100 text-blue-800'
      case 'ACTIVE':
        return 'bg-green-100 text-green-800'
      case 'COMPLETED':
        return 'bg-sage-100 text-sage-800'
      case 'CANCELLED':
        return 'bg-red-100 text-red-800'
      default:
        return 'bg-gray-100 text-gray-800'
    }
  }

  const filteredPositions = selectedPosition === 'all'
    ? resultsData?.data?.positionResults
    : resultsData?.data?.positionResults?.filter(p => p.position.id === selectedPosition)

  const selectedElectionData = Array.isArray(electionsData) ? electionsData.find((e: any) => e.id === selectedElection) : null

  if (error) {
    return (
      <div className="space-y-8">
        <div className="flex justify-between items-center">
          <div>
            <h1 className="text-3xl font-bold tracking-tight">Election Results</h1>
            <p className="text-muted-foreground mt-2">
              View and manage election results and analytics
            </p>
          </div>
        </div>
        <Card>
          <CardContent className="p-6">
            <div className="text-center">
              <AlertTriangle className="h-12 w-12 text-red-500 mx-auto mb-4" />
              <h3 className="text-lg font-medium text-gray-900 mb-2">Error Loading Results</h3>
              <p className="text-gray-500">
                {(error as any)?.response?.data?.message || 'Failed to load election results. Please try again later.'}
              </p>
            </div>
          </CardContent>
        </Card>
      </div>
    )
  }

  return (
    <div className="space-y-8">
      {/* Header */}
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Election Results</h1>
          <p className="text-muted-foreground mt-2">
            View and manage election results and analytics
          </p>
        </div>
        <div className="flex gap-2">
          {selectedElection && resultsData?.data && (
            <>
              <Button
                variant="outline"
                size="sm"
                onClick={() => handleExport('pdf')}
              >
                <FileDown className="h-4 w-4 mr-2" />
                Export PDF
              </Button>
              <Button
                variant="outline"
                size="sm"
                onClick={() => handleExport('excel')}
              >
                <Download className="h-4 w-4 mr-2" />
                Export Excel
              </Button>
            </>
          )}
        </div>
      </div>

      {/* Election Selection */}
      <Card>
        <CardHeader>
          <CardTitle>Select Election</CardTitle>
          <CardDescription>
            Choose an election to view its results and analytics
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="flex flex-col sm:flex-row gap-4">
            <div className="flex-1">
              <Select value={selectedElection} onValueChange={setSelectedElection}>
                <SelectTrigger>
                  <SelectValue placeholder="Select an election to view results" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="none">Select an election</SelectItem>
                  {Array.isArray(electionsData) && electionsData.map((election: any) => (
                    <SelectItem key={election.id} value={election.id}>
                      <div className="flex items-center justify-between w-full">
                        <span>{election.title}</span>
                        <Badge
                          variant="secondary"
                          className={cn("ml-2 text-xs", getElectionStatusColor(election.status))}
                        >
                          {election.status}
                        </Badge>
                      </div>
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            {selectedElection && selectedElection !== 'none' && resultsData?.data && (
              <div className="flex gap-2">
                <Button
                  variant="outline"
                  onClick={() => calculateResultsMutation.mutate(selectedElection)}
                  disabled={calculateResultsMutation.isPending}
                >
                  {calculateResultsMutation.isPending ? (
                    <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                  ) : (
                    <Calculator className="h-4 w-4 mr-2" />
                  )}
                  Recalculate
                </Button>

                {!(resultsData.data as any).isPublished && selectedElectionData?.status === 'COMPLETED' && (
                  <AlertDialog>
                    <AlertDialogTrigger asChild>
                      <Button>
                        <CheckCircle className="h-4 w-4 mr-2" />
                        Publish Results
                      </Button>
                    </AlertDialogTrigger>
                    <AlertDialogContent>
                      <AlertDialogHeader>
                        <AlertDialogTitle>Publish Election Results</AlertDialogTitle>
                        <AlertDialogDescription>
                          Are you sure you want to publish these results? This action will make
                          the results publicly visible and cannot be undone.
                        </AlertDialogDescription>
                      </AlertDialogHeader>
                      <AlertDialogFooter>
                        <AlertDialogCancel>Cancel</AlertDialogCancel>
                        <AlertDialogAction
                          onClick={() => publishResultsMutation.mutate(selectedElection)}
                          disabled={publishResultsMutation.isPending}
                        >
                          {publishResultsMutation.isPending ? 'Publishing...' : 'Publish Results'}
                        </AlertDialogAction>
                      </AlertDialogFooter>
                    </AlertDialogContent>
                  </AlertDialog>
                )}
              </div>
            )}
          </div>
        </CardContent>
      </Card>

      {/* Loading State */}
      {loadingResults && selectedElection && (
        <Card>
          <CardContent className="p-6">
            <div className="flex items-center justify-center space-x-2">
              <Loader2 className="h-6 w-6 animate-spin" />
              <span>Loading election results...</span>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Results Content */}
      {selectedElection && resultsData?.data && !loadingResults && (
        <>
          {/* Overview Statistics */}
          <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Total Voters</CardTitle>
                <Users className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">{resultsData.data.totalEligibleVoters?.toLocaleString()}</div>
                <p className="text-xs text-muted-foreground">
                  Eligible voters
                </p>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Votes Cast</CardTitle>
                <Vote className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">{resultsData.data.totalVotes?.toLocaleString()}</div>
                <p className="text-xs text-muted-foreground">
                  Total votes submitted
                </p>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Turnout</CardTitle>
                <TrendingUp className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">{resultsData.data.turnoutPercentage?.toFixed(1)}%</div>
                <Progress
                  value={resultsData.data.turnoutPercentage}
                  className="mt-2"
                />
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Status</CardTitle>
                <BarChart3 className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="flex items-center space-x-2">
                  {(resultsData.data as any).isPublished ? (
                    <>
                      <CheckCircle className="h-5 w-5 text-green-600" />
                      <span className="font-medium text-green-900">Published</span>
                    </>
                  ) : (
                    <>
                      <Clock className="h-5 w-5 text-orange-600" />
                      <span className="font-medium text-orange-900">Unpublished</span>
                    </>
                  )}
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Position Filter */}
          <Card>
            <CardHeader>
              <CardTitle>Position Results</CardTitle>
              <CardDescription>
                Filter results by position or view all positions
              </CardDescription>
            </CardHeader>
            <CardContent>
              <Select value={selectedPosition} onValueChange={setSelectedPosition}>
                <SelectTrigger className="w-full sm:w-[300px]">
                  <SelectValue placeholder="Filter by position" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Positions</SelectItem>
                  {resultsData.data.positionResults?.map((positionResult) => (
                    <SelectItem key={positionResult.position.id} value={positionResult.position.id}>
                      {positionResult.position.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </CardContent>
          </Card>

          {/* Results by Position */}
          <div className="space-y-6">
            {filteredPositions?.map((positionResult) => (
              <Card key={positionResult.position.id}>
                <CardHeader>
                  <div className="flex justify-between items-start">
                    <div>
                      <CardTitle className="flex items-center space-x-2">
                        <Trophy className="h-5 w-5 text-yellow-600" />
                        <span>{positionResult.position.name}</span>
                      </CardTitle>
                      <CardDescription className="mt-2">
                        {positionResult.position.description}
                      </CardDescription>
                    </div>
                    <div className="text-right">
                      <div className="text-sm text-muted-foreground">Total Votes</div>
                      <div className="text-2xl font-bold">{positionResult.totalVotes}</div>
                    </div>
                  </div>
                </CardHeader>
                <CardContent>
                  <div className="space-y-4">
                    {/* Candidates Results */}
                    <div className="rounded-md border">
                      <Table>
                        <TableHeader>
                          <TableRow>
                            <TableHead>Candidate</TableHead>
                            <TableHead>Votes</TableHead>
                            <TableHead>Percentage</TableHead>
                            <TableHead>Status</TableHead>
                          </TableRow>
                        </TableHeader>
                        <TableBody>
                          {positionResult.results
                            ?.sort((a: any, b: any) => b.voteCount - a.voteCount)
                            .map((candidateResult: any) => (
                            <TableRow key={candidateResult.candidate?.id || candidateResult.id}>
                              <TableCell>
                                <div className="flex items-center space-x-3">
                                  <Avatar className="h-8 w-8">
                                    <AvatarImage src={candidateResult.candidate?.photo} />
                                    <AvatarFallback className="bg-blue-100 text-blue-700">
                                      {getInitials(
                                        candidateResult.candidate?.firstName || '',
                                        candidateResult.candidate?.lastName || ''
                                      )}
                                    </AvatarFallback>
                                  </Avatar>
                                  <div>
                                    <div className="font-medium">
                                      {candidateResult.candidate?.firstName} {candidateResult.candidate?.lastName}
                                    </div>
                                    <div className="text-sm text-muted-foreground">
                                      {candidateResult.candidate?.department}
                                    </div>
                                  </div>
                                </div>
                              </TableCell>
                              <TableCell>
                                <div className="font-medium">{candidateResult.voteCount}</div>
                              </TableCell>
                              <TableCell>
                                <div className="flex items-center space-x-2">
                                  <div className="font-medium">{candidateResult.percentage?.toFixed(1)}%</div>
                                  <Progress
                                    value={candidateResult.percentage}
                                    className="w-20"
                                  />
                                </div>
                              </TableCell>
                              <TableCell>
                                {candidateResult.isWinner ? (
                                  <Badge className="bg-yellow-100 text-yellow-800">
                                    <Trophy className="h-3 w-3 mr-1" />
                                    Winner
                                  </Badge>
                                ) : (
                                  <Badge variant="secondary">
                                    Candidate
                                  </Badge>
                                )}
                              </TableCell>
                            </TableRow>
                          ))}

                          {/* Abstain votes row */}
                          {positionResult.abstainedVotes > 0 && (
                            <TableRow className="bg-gray-50">
                              <TableCell>
                                <div className="flex items-center space-x-3">
                                  <div className="w-8 h-8 bg-gray-200 rounded-full flex items-center justify-center">
                                    <Percent className="h-4 w-4 text-gray-600" />
                                  </div>
                                  <div>
                                    <div className="font-medium">Abstain</div>
                                    <div className="text-sm text-muted-foreground">
                                      Voters who chose not to vote for this position
                                    </div>
                                  </div>
                                </div>
                              </TableCell>
                              <TableCell>
                                <div className="font-medium">{positionResult.abstainedVotes}</div>
                              </TableCell>
                              <TableCell>
                                <div className="font-medium">
                                  {((positionResult.abstainedVotes / positionResult.totalVotes) * 100).toFixed(1)}%
                                </div>
                              </TableCell>
                              <TableCell>
                                <Badge variant="outline">Abstain</Badge>
                              </TableCell>
                            </TableRow>
                          )}
                        </TableBody>
                      </Table>
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        </>
      )}

      {/* No Election Selected */}
      {!selectedElection && (
        <Card>
          <CardContent className="p-8">
            <div className="text-center">
              <BarChart3 className="h-12 w-12 text-gray-400 mx-auto mb-4" />
              <h3 className="text-lg font-medium text-gray-900 mb-2">No Election Selected</h3>
              <p className="text-gray-500">
                Please select an election from the dropdown above to view its results.
              </p>
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  )
}