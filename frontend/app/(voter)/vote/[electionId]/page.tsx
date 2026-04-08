"use client"

import React, { useState, useEffect } from "react"
import { useParams, useRouter } from "next/navigation"
import Link from "next/link"
import {
  ArrowLeft,
  ArrowRight,
  CheckCircle,
  AlertCircle,
  Clock,
  Users,
  Award,
  Vote,
  Shield,
  Info,
  Eye,
  EyeOff
} from "lucide-react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Progress } from "@/components/ui/progress"
import { Alert, AlertDescription } from "@/components/ui/alert"
import { Separator } from "@/components/ui/separator"
import { CandidateCard } from "@/components/voter/CandidateCard"
import { VoteConfirmation } from "@/components/voter/VoteConfirmation"
import { useElections } from "@/lib/hooks/useElections"
import { useAuth } from "@/lib/hooks/useAuth"
import { useVoting } from "@/lib/hooks/useVoting"
import { Candidate, Position, BallotData, PositionVote } from "@/lib/types"
import { ElectionStatus } from "@/lib/enums"
import { cn } from "@/lib/utils/cn"
import { format, isAfter, isBefore } from "date-fns"

type VotingStep = "positions" | "confirmation" | "submitted"

export default function VotingPage() {
  const params = useParams()
  const router = useRouter()
  const { user } = useAuth()
  const electionId = params.electionId as string

  const { fetchElection, elections } = useElections({ autoFetch: false })
  const { submitVote, startSession, updateBallot, currentSession, isLoading: isSubmitting } = useVoting()

  const [election, setElection] = useState<any>(null)
  const [candidates, setCandidates] = useState<Candidate[]>([])
  const [electionLoading, setElectionLoading] = useState(true)
  const [candidatesLoading, setCandidatesLoading] = useState(true)

  useEffect(() => {
    const loadData = async () => {
      try {
        setElectionLoading(true)
        const electionData = await fetchElection(electionId)
        setElection(electionData)
        setElectionLoading(false)

        // Fetch candidates (only APPROVED)
        setCandidatesLoading(true)
        const { getCandidatesByElection } = await import('@/lib/api/candidates')
        const candidatesResponse = await getCandidatesByElection(electionId, { status: 'APPROVED' })
        // Ensure candidates is always an array
        // Response structure: { data: { data: { candidates: [...], total, pages } } }
        const candidatesData = candidatesResponse.data.data?.candidates || candidatesResponse.data.data
        setCandidates(Array.isArray(candidatesData) ? candidatesData : [])
        setCandidatesLoading(false)
      } catch (error) {
        console.error('Error loading election data:', error)
        setElectionLoading(false)
        setCandidatesLoading(false)
      }
    }

    loadData()
  }, [electionId, fetchElection])

  const [currentStep, setCurrentStep] = useState<VotingStep>("positions")
  const [currentPositionIndex, setCurrentPositionIndex] = useState(0)
  const [selectedCandidates, setSelectedCandidates] = useState<Record<string, Candidate[]>>({})
  const [abstainedPositions, setAbstainedPositions] = useState<Set<string>>(new Set())
  const [showVotePreview, setShowVotePreview] = useState(false)

  const positions = election?.positions || []
  const currentPosition = positions[currentPositionIndex]

  const candidatesByPosition = candidates?.reduce((acc, candidate) => {
    const positionId = candidate.positionId
    if (!acc[positionId]) {
      acc[positionId] = []
    }
    acc[positionId].push(candidate)
    return acc
  }, {} as Record<string, Candidate[]>) || {}

  useEffect(() => {
    if (election && (election.status !== ElectionStatus.ACTIVE ||
        isBefore(new Date(), new Date(election.startDate)) ||
        isAfter(new Date(), new Date(election.endDate)))) {
      router.push(`/elections/${electionId}`)
    }
  }, [election, electionId, router])

  if (electionLoading || candidatesLoading) {
    return (
      <div className="max-w-4xl mx-auto space-y-6">
        <div className="h-8 bg-gray-200 rounded animate-pulse"></div>
        <Card>
          <CardContent className="p-6">
            <div className="space-y-4">
              <div className="h-6 bg-gray-200 rounded animate-pulse"></div>
              <div className="h-4 bg-gray-200 rounded animate-pulse"></div>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {[...Array(4)].map((_, i) => (
                  <div key={i} className="h-32 bg-gray-200 rounded animate-pulse"></div>
                ))}
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    )
  }

  if (!election || !positions.length) {
    return (
      <div className="text-center py-12">
        <h2 className="text-2xl font-bold text-gray-900 mb-4">Election Not Available</h2>
        <p className="text-gray-600 mb-6">This election is not available for voting or doesn't exist.</p>
        <Link href="/elections">
          <Button>
            <ArrowLeft className="h-4 w-4 mr-2" />
            Back to Elections
          </Button>
        </Link>
      </div>
    )
  }

  const handleCandidateSelect = (candidate: Candidate, isSelected: boolean) => {
    if (!currentPosition) return

    const positionId = currentPosition.id
    const currentSelections = selectedCandidates[positionId] || []

    if (isSelected) {
      // Add candidate
      if (currentPosition.maxSelections === 1) {
        setSelectedCandidates({
          ...selectedCandidates,
          [positionId]: [candidate]
        })
      } else if (currentSelections.length < currentPosition.maxSelections) {
        setSelectedCandidates({
          ...selectedCandidates,
          [positionId]: [...currentSelections, candidate]
        })
      }
    } else {
      // Remove candidate
      setSelectedCandidates({
        ...selectedCandidates,
        [positionId]: currentSelections.filter(c => c.id !== candidate.id)
      })
    }

    // Remove from abstained when selecting candidates
    if (isSelected && abstainedPositions.has(positionId)) {
      const newAbstained = new Set(abstainedPositions)
      newAbstained.delete(positionId)
      setAbstainedPositions(newAbstained)
    }
  }

  const handleAbstain = (positionId: string) => {
    const newAbstained = new Set(abstainedPositions)
    if (abstainedPositions.has(positionId)) {
      newAbstained.delete(positionId)
    } else {
      newAbstained.add(positionId)
      // Clear selections when abstaining
      const newSelections = { ...selectedCandidates }
      delete newSelections[positionId]
      setSelectedCandidates(newSelections)
    }
    setAbstainedPositions(newAbstained)
  }

  const canProceedToNext = () => {
    if (!currentPosition) return false
    const positionId = currentPosition.id
    const hasSelections = (selectedCandidates[positionId]?.length || 0) > 0
    const hasAbstained = abstainedPositions.has(positionId)
    return hasSelections || hasAbstained
  }

  const handleNext = () => {
    if (currentPositionIndex < positions.length - 1) {
      setCurrentPositionIndex(currentPositionIndex + 1)
    } else {
      setCurrentStep("confirmation")
    }
  }

  const handlePrevious = () => {
    if (currentPositionIndex > 0) {
      setCurrentPositionIndex(currentPositionIndex - 1)
    }
  }

  const handleConfirmVote = async () => {
    try {
      // Start a voting session if one doesn't exist
      let session = currentSession
      if (!session) {
        session = await startSession(election.id)
      }

      console.log('Session:', session);
      console.log('Election ID:', election.id);

      // Extract the actual session ID - handle both nested and flat structures
      const sessionId = session.session?.id || session.id
      console.log('Session ID:', sessionId);

      // Build the votes array
      const votes: PositionVote[] = positions.map((position: { id: string }): PositionVote => {
        const candidateIds = selectedCandidates[position.id]?.map(c => c.id) || []
        const abstain = abstainedPositions.has(position.id)

        return {
          positionId: position.id,
          candidateIds,
          abstain
        }
      })

      console.log('Votes array:', votes);

      // Update the ballot in the store before submitting
      // updateBallot expects: (electionId, sessionId, votes)
      console.log('Calling updateBallot with:', { electionId: election.id, sessionId, votes });
      updateBallot(election.id, sessionId, votes)

      console.log('Ballot updated, calling submitVote...');

      // Now submit the vote (uses the updated ballot from the store)
      await submitVote()
      setCurrentStep("submitted")
    } catch (error) {
      console.error("Failed to submit vote:", error)
    }
  }

  const getProgressPercentage = () => {
    if (currentStep === "confirmation") return 100
    if (currentStep === "submitted") return 100
    return ((currentPositionIndex + 1) / positions.length) * 85 // Reserve 15% for confirmation
  }

  const getTotalVotes = () => {
    return Object.values(selectedCandidates).reduce((total, candidates) => total + candidates.length, 0)
  }

  if (currentStep === "submitted") {
    return (
      <div className="max-w-2xl mx-auto text-center py-12">
        <div className="w-16 h-16 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-6">
          <CheckCircle className="h-8 w-8 text-green-600" />
        </div>
        <h1 className="text-3xl font-bold text-gray-900 mb-4">Vote Submitted Successfully!</h1>
        <p className="text-gray-600 mb-8">
          Thank you for participating in the election. Your vote has been securely recorded and encrypted.
        </p>

        <div className="space-y-4">
          <Link href={`/elections/${electionId}`}>
            <Button variant="outline" className="mr-4">
              Back to Election
            </Button>
          </Link>
          <Link href="/dashboard">
            <Button>
              Go to Dashboard
            </Button>
          </Link>
        </div>

        <div className="mt-8 p-4 bg-blue-50 rounded-lg">
          <p className="text-sm text-blue-800">
            <Shield className="h-4 w-4 inline mr-1" />
            Your vote is secured with blockchain technology and cannot be changed or traced back to you.
          </p>
        </div>
      </div>
    )
  }

  if (currentStep === "confirmation") {
    return (
      <VoteConfirmation
        ballot={{
          electionId: election.id,
          sessionId: `session-${Date.now()}`,
          votes: positions.map((position: { id: string }): PositionVote => ({
            positionId: position.id,
            candidateIds: selectedCandidates[position.id]?.map(c => c.id) || [],
            abstain: abstainedPositions.has(position.id)
          }))
        }}
        election={election}
        positions={positions}
        selectedCandidates={selectedCandidates}
        onConfirm={handleConfirmVote}
        onCancel={() => setCurrentStep("positions")}
        isSubmitting={isSubmitting}
      />
    )
  }

  return (
    <div className="max-w-4xl mx-auto space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center space-x-4">
          <Link href={`/elections/${electionId}`}>
            <Button variant="ghost" size="sm">
              <ArrowLeft className="h-4 w-4 mr-2" />
              Back
            </Button>
          </Link>
          <div>
            <h1 className="text-2xl font-bold text-gray-900">Vote in {election.title}</h1>
            <p className="text-gray-600">Select your preferred candidates for each position</p>
          </div>
        </div>

        <Button
          variant="ghost"
          size="sm"
          onClick={() => setShowVotePreview(!showVotePreview)}
        >
          {showVotePreview ? (
            <>
              <EyeOff className="h-4 w-4 mr-2" />
              Hide Preview
            </>
          ) : (
            <>
              <Eye className="h-4 w-4 mr-2" />
              Show Preview
            </>
          )}
        </Button>
      </div>

      {/* Progress */}
      <Card>
        <CardContent className="p-4">
          <div className="flex items-center justify-between mb-2">
            <span className="text-sm font-medium">
              Position {currentPositionIndex + 1} of {positions.length}
            </span>
            <span className="text-sm text-gray-600">
              {Math.round(getProgressPercentage())}% Complete
            </span>
          </div>
          <Progress value={getProgressPercentage()} className="h-2" />
        </CardContent>
      </Card>

      {/* Vote Preview */}
      {showVotePreview && (
        <Alert>
          <Info className="h-4 w-4" />
          <AlertDescription>
            <strong>Current Selections:</strong> {getTotalVotes()} candidate(s) selected, {abstainedPositions.size} abstention(s)
          </AlertDescription>
        </Alert>
      )}

      <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
        {/* Main Voting Area */}
        <div className="lg:col-span-3">
          <Card>
            <CardHeader>
              <div className="flex items-center justify-between">
                <div>
                  <CardTitle className="flex items-center">
                    <Award className="h-5 w-5 mr-2 text-sage-600" />
                    {currentPosition?.name}
                  </CardTitle>
                  <CardDescription className="mt-1">
                    {currentPosition?.description}
                  </CardDescription>
                </div>
                <Badge variant="outline">
                  {currentPosition?.maxSelections === 1 ? "Select 1" : `Select up to ${currentPosition?.maxSelections}`}
                </Badge>
              </div>
            </CardHeader>
            <CardContent>
              {currentPosition && candidatesByPosition[currentPosition.id]?.length === 0 ? (
                <div className="text-center py-8">
                  <Users className="h-12 w-12 text-gray-300 mx-auto mb-4" />
                  <h3 className="text-lg font-medium text-gray-900 mb-2">No Candidates</h3>
                  <p className="text-gray-500">No candidates are running for this position.</p>
                </div>
              ) : (
                <div className="space-y-4">
                  {/* Abstain Option */}
                  <div className="border rounded-lg p-4">
                    <label className="flex items-center space-x-3 cursor-pointer">
                      <input
                        type="checkbox"
                        checked={abstainedPositions.has(currentPosition?.id || "")}
                        onChange={() => handleAbstain(currentPosition?.id || "")}
                        className="h-4 w-4 text-blue-600 border-gray-300 rounded focus:ring-blue-500"
                      />
                      <div className="flex-1">
                        <div className="font-medium text-gray-900">Abstain from voting</div>
                        <div className="text-sm text-gray-600">
                          Choose this option if you prefer not to vote for any candidate in this position
                        </div>
                      </div>
                    </label>
                  </div>

                  <Separator />

                  {/* Candidates */}
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    {candidatesByPosition[currentPosition?.id || ""]?.map((candidate) => {
                      const isSelected = selectedCandidates[currentPosition?.id || ""]?.some(c => c.id === candidate.id) || false
                      const isDisabled = abstainedPositions.has(currentPosition?.id || "") ||
                                        (currentPosition?.maxSelections === 1 &&
                                         (selectedCandidates[currentPosition?.id || ""]?.length || 0) > 0 &&
                                         !isSelected) ||
                                        ((selectedCandidates[currentPosition?.id || ""]?.length || 0) >= (currentPosition?.maxSelections || 1) && !isSelected)

                      return (
                        <CandidateCard
                          key={candidate.id}
                          candidate={candidate}
                          position={currentPosition!}
                          variant="ballot"
                          isSelected={isSelected}
                          isDisabled={isDisabled}
                          onSelect={(candidate) => handleCandidateSelect(candidate, true)}
                          onDeselect={(candidate) => handleCandidateSelect(candidate, false)}
                        />
                      )
                    })}
                  </div>
                </div>
              )}
            </CardContent>
          </Card>
        </div>

        {/* Sidebar */}
        <div className="space-y-6">
          {/* Position Navigation */}
          <Card>
            <CardHeader>
              <CardTitle className="text-lg">Positions</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-2">
                {positions.map((position: any, index: any) => {
                  const hasVotes = (selectedCandidates[position.id]?.length || 0) > 0
                  const hasAbstained = abstainedPositions.has(position.id)
                  const isCompleted = hasVotes || hasAbstained
                  const isCurrent = index === currentPositionIndex

                  return (
                    <button
                      key={position.id}
                      onClick={() => setCurrentPositionIndex(index)}
                      className={cn(
                        "w-full text-left p-3 rounded-lg border transition-colors",
                        isCurrent ? "border-blue-500 bg-blue-50" : "border-gray-200 hover:bg-gray-50",
                        isCompleted && !isCurrent && "border-green-200 bg-green-50"
                      )}
                    >
                      <div className="flex items-center justify-between">
                        <div className="flex-1 min-w-0">
                          <p className="font-medium text-sm truncate">{position.name}</p>
                          <p className="text-xs text-gray-500">
                            {hasAbstained ? "Abstained" : hasVotes ? `${selectedCandidates[position.id]?.length} selected` : "Not voted"}
                          </p>
                        </div>
                        {isCompleted && (
                          <CheckCircle className="h-4 w-4 text-green-600 flex-shrink-0" />
                        )}
                      </div>
                    </button>
                  )
                })}
              </div>
            </CardContent>
          </Card>

          {/* Vote Summary */}
          <Card>
            <CardHeader>
              <CardTitle className="text-lg">Vote Summary</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-3 text-sm">
                <div className="flex justify-between">
                  <span>Positions</span>
                  <span className="font-medium">{positions.length}</span>
                </div>
                <div className="flex justify-between">
                  <span>Candidates Selected</span>
                  <span className="font-medium">{getTotalVotes()}</span>
                </div>
                <div className="flex justify-between">
                  <span>Abstentions</span>
                  <span className="font-medium">{abstainedPositions.size}</span>
                </div>
                <div className="flex justify-between">
                  <span>Completed</span>
                  <span className="font-medium">
                    {positions.filter((p: { id: string }) =>
                      (selectedCandidates[p.id]?.length || 0) > 0 ||
                      abstainedPositions.has(p.id)
                    ).length}/{positions.length}
                  </span>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>

      {/* Navigation */}
      <div className="flex items-center justify-between pt-6 border-t">
        <Button
          variant="outline"
          onClick={handlePrevious}
          disabled={currentPositionIndex === 0}
        >
          <ArrowLeft className="h-4 w-4 mr-2" />
          Previous
        </Button>

        <div className="text-sm text-gray-600">
          {currentPositionIndex + 1} of {positions.length} positions
        </div>

        {currentPositionIndex < positions.length - 1 ? (
          <Button
            onClick={handleNext}
            disabled={!canProceedToNext()}
          >
            Next
            <ArrowRight className="h-4 w-4 ml-2" />
          </Button>
        ) : (
          <Button
            onClick={handleNext}
            disabled={!canProceedToNext()}
            className="bg-green-600 hover:bg-green-700"
          >
            Review Vote
            <CheckCircle className="h-4 w-4 ml-2" />
          </Button>
        )}
      </div>
    </div>
  )
}