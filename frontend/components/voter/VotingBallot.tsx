"use client"

import React, { useState, useEffect } from "react"
import { useRouter } from "next/navigation"
import { useMutation, useQuery } from "@tanstack/react-query"
import {
  Check,
  X,
  AlertTriangle,
  Clock,
  Shield,
  ChevronRight,
  ChevronLeft,
  Vote,
  User,
  Info,
  CheckCircle,
  XCircle
} from "lucide-react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Alert, AlertDescription } from "@/components/ui/alert"
import { Badge } from "@/components/ui/badge"
import { Progress } from "@/components/ui/progress"
import { LoadingSpinner } from "@/components/shared/LoadingSpinner"
import {
  getElectionBallot,
  validateBallot,
  castVotes,
  getVotingSession,
  startVotingSession,
  completeVotingSession
} from "@/lib/api/votes"
import { Election, Candidate, Position, BallotData, VotingSession } from "@/lib/types"
import { cn } from "@/lib/utils/cn"
import { useAuth } from "@/lib/hooks/useAuth"

interface VotingBallotProps {
  election: Election
  onVoteComplete?: (receipt: any) => void
  onError?: (error: string) => void
}

interface BallotSelection {
  positionId: string
  candidateIds: string[]
  abstain: boolean
}

export function VotingBallot({ election, onVoteComplete, onError }: VotingBallotProps) {
  const { user } = useAuth()
  const router = useRouter()

  const [currentStep, setCurrentStep] = useState(0)
  const [selections, setSelections] = useState<BallotSelection[]>([])
  const [votingSession, setVotingSession] = useState<VotingSession | null>(null)
  const [timeRemaining, setTimeRemaining] = useState<number>(0)
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [validationErrors, setValidationErrors] = useState<string[]>([])

  // Fetch ballot data
  const { data: ballotData, isLoading, error } = useQuery({
    queryKey: ['election-ballot', election.id],
    queryFn: () => getElectionBallot(election.id),
    enabled: !!election.id,
  })

  const ballot = ballotData?.data?.data

  // Start voting session mutation
  const startSessionMutation = useMutation({
    mutationFn: () => startVotingSession(election.id),
    onSuccess: (response) => {
      const session = response.data.data
      if (session) {
        setVotingSession(session)
        // Calculate remaining time from expiresAt
        const now = new Date().getTime()
        const expires = new Date(session.expiresAt).getTime()
        const remainingSeconds = Math.max(0, Math.floor((expires - now) / 1000))
        setTimeRemaining(remainingSeconds || 1800) // 30 minutes default
      }
    },
    onError: (error: any) => {
      onError?.(error.response?.data?.message || "Failed to start voting session")
    }
  })

  // Validate ballot mutation
  const validateMutation = useMutation({
    mutationFn: (ballotData: BallotData) => validateBallot(ballotData),
    onSuccess: (response) => {
      const validation = response.data.data
      if (validation?.valid) {
        setValidationErrors([])
        castVotesMutation.mutate(prepareBallotData())
      } else {
        setValidationErrors(validation?.errors || ["Invalid ballot structure"])
      }
    },
    onError: (error: any) => {
      setValidationErrors([error.response?.data?.message || "Ballot validation failed"])
    }
  })

  // Cast votes mutation
  const castVotesMutation = useMutation({
    mutationFn: (ballotData: BallotData) => castVotes(ballotData),
    onSuccess: (response) => {
      const receipt = response.data.data
      if (votingSession) {
        completeVotingSession(votingSession.id).then(() => {
          onVoteComplete?.(receipt)
        })
      } else {
        onVoteComplete?.(receipt)
      }
    },
    onError: (error: any) => {
      onError?.(error.response?.data?.message || "Failed to cast votes")
    }
  })

  // Initialize voting session
  useEffect(() => {
    if (!votingSession && ballot) {
      startSessionMutation.mutate()
    }
  }, [ballot])

  // Initialize selections
  useEffect(() => {
    if (ballot?.positions) {
      const initialSelections = ballot.positions.map((position: Position) => ({
        positionId: position.id,
        candidateIds: [],
        abstain: false
      }))
      setSelections(initialSelections)
    }
  }, [ballot])

  // Timer countdown
  useEffect(() => {
    if (timeRemaining > 0 && votingSession) {
      const timer = setTimeout(() => {
        setTimeRemaining(timeRemaining - 1)
      }, 1000)
      return () => clearTimeout(timer)
    } else if (timeRemaining === 0 && votingSession) {
      onError?.("Voting session has expired")
    }
  }, [timeRemaining, votingSession])

  const formatTime = (seconds: number) => {
    const mins = Math.floor(seconds / 60)
    const secs = seconds % 60
    return `${mins}:${secs.toString().padStart(2, '0')}`
  }

  const handleCandidateSelection = (positionId: string, candidateId: string) => {
    setSelections(prev => prev.map(selection => {
      if (selection.positionId === positionId) {
        const position = ballot.positions.find((p: Position) => p.id === positionId)
        const maxSelections = position?.maxSelections || 1

        let newCandidateIds: string[]

        if (selection.candidateIds.includes(candidateId)) {
          // Remove selection
          newCandidateIds = selection.candidateIds.filter(id => id !== candidateId)
        } else {
          // Add selection
          if (selection.candidateIds.length >= maxSelections) {
            newCandidateIds = [...selection.candidateIds.slice(1), candidateId]
          } else {
            newCandidateIds = [...selection.candidateIds, candidateId]
          }
        }

        return {
          ...selection,
          candidateIds: newCandidateIds,
          abstain: false
        }
      }
      return selection
    }))
  }

  const handleAbstain = (positionId: string) => {
    setSelections(prev => prev.map(selection => {
      if (selection.positionId === positionId) {
        return {
          ...selection,
          candidateIds: [],
          abstain: !selection.abstain
        }
      }
      return selection
    }))
  }

  const prepareBallotData = (): BallotData => {
    return {
      electionId: election.id,
      sessionId: votingSession?.id || '',
      votes: selections.map(selection => ({
        positionId: selection.positionId,
        candidateIds: selection.candidateIds,
        abstain: selection.abstain
      })),
      deviceFingerprint: generateDeviceFingerprint()
    }
  }

  const generateDeviceFingerprint = (): string => {
    return btoa([
      navigator.userAgent,
      screen.width + 'x' + screen.height,
      new Date().getTimezoneOffset(),
      navigator.language
    ].join('|')).substring(0, 32)
  }

  const canProceedToNext = () => {
    if (!ballot?.positions) return false

    const currentPosition = ballot.positions[currentStep]
    if (!currentPosition) return false

    const selection = selections.find(s => s.positionId === currentPosition.id)
    if (!selection) return false

    // Check if abstain or has valid selections
    if (selection.abstain) return true

    // Check minimum selections requirement
    const minSelections = currentPosition.minSelections || 0
    return selection.candidateIds.length >= minSelections
  }

  const canSubmitBallot = () => {
    if (!ballot?.positions) return false

    return ballot.positions.every((position: Position) => {
      const selection = selections.find(s => s.positionId === position.id)
      if (!selection) return false

      if (selection.abstain) return election.allowAbstain

      const minSelections = position.minSelections || 0
      return selection.candidateIds.length >= minSelections
    })
  }

  const handleSubmitBallot = () => {
    if (!canSubmitBallot()) return

    setIsSubmitting(true)
    const ballotData = prepareBallotData()
    validateMutation.mutate(ballotData)
  }

  const nextStep = () => {
    if (currentStep < (ballot?.positions?.length || 0) - 1) {
      setCurrentStep(currentStep + 1)
    }
  }

  const prevStep = () => {
    if (currentStep > 0) {
      setCurrentStep(currentStep - 1)
    }
  }

  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-96">
        <LoadingSpinner size="lg" />
        <span className="ml-4 text-lg">Loading ballot...</span>
      </div>
    )
  }

  if (error) {
    return (
      <Alert variant="destructive">
        <AlertTriangle className="h-4 w-4" />
        <AlertDescription>
          Failed to load ballot: {(error as any)?.response?.data?.message || "Unknown error"}
        </AlertDescription>
      </Alert>
    )
  }

  if (!ballot?.positions?.length) {
    return (
      <Alert>
        <Info className="h-4 w-4" />
        <AlertDescription>
          No positions available for voting in this election.
        </AlertDescription>
      </Alert>
    )
  }

  const currentPosition = ballot.positions[currentStep]
  const currentSelection = selections.find(s => s.positionId === currentPosition?.id)
  const progress = ((currentStep + 1) / ballot.positions.length) * 100

  return (
    <div className="max-w-4xl mx-auto space-y-6">
      {/* Session Info & Timer */}
      {votingSession && (
        <Card className="border-blue-200 bg-blue-50/50">
          <CardContent className="pt-6">
            <div className="flex items-center justify-between">
              <div className="flex items-center space-x-4">
                <div className="flex items-center space-x-2">
                  <Shield className="h-5 w-5 text-blue-600" />
                  <span className="font-medium">Secure Voting Session Active</span>
                </div>
                <Badge variant="success" className="text-xs">
                  Session ID: {votingSession.id.substring(0, 8)}...
                </Badge>
              </div>
              <div className="flex items-center space-x-2">
                <Clock className="h-4 w-4 text-orange-600" />
                <span className={cn(
                  "font-mono font-bold",
                  timeRemaining < 300 ? "text-red-600" : "text-gray-700"
                )}>
                  {formatTime(timeRemaining)}
                </span>
              </div>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Progress */}
      <div className="space-y-2">
        <div className="flex justify-between text-sm">
          <span>Position {currentStep + 1} of {ballot.positions.length}</span>
          <span>{Math.round(progress)}% Complete</span>
        </div>
        <Progress value={progress} className="h-2" />
      </div>

      {/* Validation Errors */}
      {validationErrors.length > 0 && (
        <Alert variant="destructive">
          <XCircle className="h-4 w-4" />
          <AlertDescription>
            <ul className="list-disc list-inside space-y-1">
              {validationErrors.map((error, index) => (
                <li key={index}>{error}</li>
              ))}
            </ul>
          </AlertDescription>
        </Alert>
      )}

      {/* Current Position */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center space-x-2">
            <Vote className="h-5 w-5 text-blue-600" />
            <span>{currentPosition?.name}</span>
          </CardTitle>
          {currentPosition?.description && (
            <CardDescription>{currentPosition.description}</CardDescription>
          )}
          <div className="flex items-center space-x-4 text-sm text-gray-600">
            <span>
              Select {currentPosition?.minSelections || 0} to {currentPosition?.maxSelections || 1} candidate(s)
            </span>
            {election.allowAbstain && (
              <span>" You may abstain from voting</span>
            )}
          </div>
        </CardHeader>

        <CardContent className="space-y-4">
          {/* Candidates */}
          <div className="grid gap-4">
            {currentPosition?.candidates?.map((candidate: Candidate) => {
              const isSelected = currentSelection?.candidateIds.includes(candidate.id) || false
              const isDisabled = currentSelection?.abstain || false

              return (
                <Card
                  key={candidate.id}
                  className={cn(
                    "cursor-pointer transition-all hover:shadow-md",
                    isSelected && "ring-2 ring-blue-500 bg-blue-50",
                    isDisabled && "opacity-50 cursor-not-allowed"
                  )}
                  onClick={() => !isDisabled && handleCandidateSelection(currentPosition.id, candidate.id)}
                >
                  <CardContent className="p-4">
                    <div className="flex items-center space-x-4">
                      <div className={cn(
                        "w-6 h-6 rounded-full border-2 flex items-center justify-center",
                        isSelected
                          ? "border-blue-500 bg-blue-500"
                          : "border-gray-300"
                      )}>
                        {isSelected && <Check className="h-4 w-4 text-white" />}
                      </div>

                      <div className="flex-1">
                        <div className="flex items-center space-x-3">
                          {candidate.photo ? (
                            <img
                              src={candidate.photo}
                              alt={`${candidate.firstName} ${candidate.lastName}`}
                              className="w-12 h-12 rounded-full object-cover"
                            />
                          ) : (
                            <div className="w-12 h-12 rounded-full bg-gray-200 flex items-center justify-center">
                              <User className="h-6 w-6 text-gray-400" />
                            </div>
                          )}

                          <div>
                            <h3 className="font-semibold">
                              {candidate.firstName} {candidate.lastName}
                            </h3>
                            {candidate.manifesto && (
                              <p className="text-sm text-gray-600 line-clamp-2">
                                {candidate.manifesto}
                              </p>
                            )}
                            <div className="flex items-center space-x-2 mt-1">
                              <Badge variant="secondary" className="text-xs">
                                {candidate.faculty}
                              </Badge>
                              {candidate.course && (
                                <Badge variant="outline" className="text-xs">
                                  {candidate.course}
                                </Badge>
                              )}
                            </div>
                          </div>
                        </div>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              )
            })}
          </div>

          {/* Abstain Option */}
          {election.allowAbstain && (
            <Card
              className={cn(
                "cursor-pointer transition-all hover:shadow-md border-dashed",
                currentSelection?.abstain && "ring-2 ring-amber-500 bg-amber-50"
              )}
              onClick={() => handleAbstain(currentPosition.id)}
            >
              <CardContent className="p-4">
                <div className="flex items-center space-x-4">
                  <div className={cn(
                    "w-6 h-6 rounded-full border-2 flex items-center justify-center",
                    currentSelection?.abstain
                      ? "border-amber-500 bg-amber-500"
                      : "border-gray-300"
                  )}>
                    {currentSelection?.abstain && <X className="h-4 w-4 text-white" />}
                  </div>
                  <div>
                    <h3 className="font-medium text-amber-700">Abstain from voting</h3>
                    <p className="text-sm text-amber-600">
                      Choose not to vote for this position
                    </p>
                  </div>
                </div>
              </CardContent>
            </Card>
          )}

          {/* Selection Summary */}
          {currentSelection && !currentSelection.abstain && currentSelection.candidateIds.length > 0 && (
            <div className="bg-blue-50 p-4 rounded-lg">
              <h4 className="font-medium text-blue-900 mb-2">Your Selection:</h4>
              <div className="space-y-1">
                {currentSelection.candidateIds.map(candidateId => {
                  const candidate = currentPosition.candidates.find((c: Candidate) => c.id === candidateId)
                  return (
                    <div key={candidateId} className="flex items-center space-x-2">
                      <CheckCircle className="h-4 w-4 text-green-600" />
                      <span className="text-sm">{candidate?.firstName} {candidate?.lastName}</span>
                    </div>
                  )
                })}
              </div>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Navigation */}
      <div className="flex justify-between">
        <Button
          variant="outline"
          onClick={prevStep}
          disabled={currentStep === 0}
        >
          <ChevronLeft className="h-4 w-4 mr-2" />
          Previous
        </Button>

        <div className="flex space-x-4">
          {currentStep === ballot.positions.length - 1 ? (
            <Button
              onClick={handleSubmitBallot}
              disabled={!canSubmitBallot() || isSubmitting}
              className="bg-green-600 hover:bg-green-700"
            >
              {isSubmitting ? (
                <LoadingSpinner size="sm" className="mr-2" />
              ) : (
                <Vote className="h-4 w-4 mr-2" />
              )}
              Submit Ballot
            </Button>
          ) : (
            <Button
              onClick={nextStep}
              disabled={!canProceedToNext()}
            >
              Next
              <ChevronRight className="h-4 w-4 ml-2" />
            </Button>
          )}
        </div>
      </div>
    </div>
  )
}

export default VotingBallot