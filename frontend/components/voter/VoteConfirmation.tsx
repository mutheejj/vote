"use client"

import React, { useState } from "react"
import {
  CheckCircle,
  AlertTriangle,
  Clock,
  User,
  Vote,
  Hash,
  Shield,
  Eye,
  EyeOff,
  Calendar,
  MapPin,
  Users,
  Award
} from "lucide-react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { Separator } from "@/components/ui/separator"
import { Alert, AlertDescription } from "@/components/ui/alert"
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog"
import { ScrollArea } from "@/components/ui/scroll-area"
import { BallotData, PositionVote, Election, Position, Candidate } from "@/lib/types"
import { cn } from "@/lib/utils/cn"
import { format } from "date-fns"

interface VoteConfirmationProps {
  ballot: BallotData
  election: Election
  positions: Position[]
  selectedCandidates: Record<string, Candidate[]>
  onConfirm: () => void
  onCancel: () => void
  isSubmitting?: boolean
  className?: string
}

export function VoteConfirmation({
  ballot,
  election,
  positions,
  selectedCandidates,
  onConfirm,
  onCancel,
  isSubmitting = false,
  className
}: VoteConfirmationProps) {
  const [showVoteDetails, setShowVoteDetails] = useState(false)
  const [expandedPosition, setExpandedPosition] = useState<string | null>(null)

  const getFullName = (candidate: Candidate) => {
    return `${candidate.firstName} ${candidate.lastName}`.trim()
  }

  const getInitials = (firstName: string, lastName: string) => {
    return `${firstName[0]}${lastName[0]}`.toUpperCase()
  }

  const getTotalVotes = () => {
    return ballot.votes.reduce((total, vote) => {
      return total + (vote.abstain ? 0 : vote.candidateIds.length)
    }, 0)
  }

  const getPositionVoteSummary = (positionId: string) => {
    const vote = ballot.votes.find(v => v.positionId === positionId)
    const position = positions.find(p => p.id === positionId)
    const candidates = selectedCandidates[positionId] || []

    if (!vote || !position) return null

    return {
      position,
      vote,
      candidates: vote.abstain ? [] : candidates,
      isAbstain: vote.abstain || false
    }
  }

  return (
    <div className={cn("max-w-4xl mx-auto space-y-6", className)}>
      {/* Header */}
      <Card className="border-blue-200 bg-blue-50/50">
        <CardHeader>
          <div className="flex items-center space-x-3">
            <div className="w-12 h-12 rounded-full bg-blue-100 flex items-center justify-center">
              <Vote className="h-6 w-6 text-blue-600" />
            </div>
            <div>
              <CardTitle className="text-xl text-blue-900">Confirm Your Vote</CardTitle>
              <CardDescription className="text-blue-700">
                Please review your selections before submitting your vote
              </CardDescription>
            </div>
          </div>
        </CardHeader>
      </Card>

      {/* Election Information */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center space-x-2">
            <Calendar className="h-5 w-5 text-gray-600" />
            <span>Election Details</span>
          </CardTitle>
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
              <label className="font-medium text-gray-700">Total Positions</label>
              <p className="text-gray-900">{positions.length}</p>
            </div>
            <div>
              <label className="font-medium text-gray-700">Your Votes</label>
              <p className="text-gray-900">{getTotalVotes()} candidate(s) selected</p>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Vote Summary */}
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <CardTitle className="flex items-center space-x-2">
              <Users className="h-5 w-5 text-gray-600" />
              <span>Your Vote Summary</span>
            </CardTitle>
            <Button
              variant="ghost"
              size="sm"
              onClick={() => setShowVoteDetails(!showVoteDetails)}
            >
              {showVoteDetails ? (
                <>
                  <EyeOff className="h-4 w-4 mr-2" />
                  Hide Details
                </>
              ) : (
                <>
                  <Eye className="h-4 w-4 mr-2" />
                  Show Details
                </>
              )}
            </Button>
          </div>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            {ballot.votes.map((vote, index) => {
              const summary = getPositionVoteSummary(vote.positionId)
              if (!summary) return null

              const { position, candidates, isAbstain } = summary

              return (
                <div key={vote.positionId} className="border rounded-lg p-4">
                  <div className="flex items-center justify-between mb-3">
                    <div className="flex items-center space-x-2">
                      <Award className="h-4 w-4 text-sage-500" />
                      <h3 className="font-semibold">{position.name}</h3>
                      <Badge variant="outline" className="text-xs">
                        {position.maxSelections === 1 ? "Single choice" : `Up to ${position.maxSelections} choices`}
                      </Badge>
                    </div>
                    {isAbstain && (
                      <Badge variant="outline" className="text-amber-600 border-amber-200">
                        Abstained
                      </Badge>
                    )}
                  </div>

                  {position.description && (
                    <p className="text-sm text-gray-600 mb-3">{position.description}</p>
                  )}

                  {isAbstain ? (
                    <div className="flex items-center space-x-2 text-amber-700 bg-amber-50 rounded-lg p-3">
                      <AlertTriangle className="h-4 w-4" />
                      <span className="text-sm">You chose to abstain from voting for this position</span>
                    </div>
                  ) : (
                    <div className="space-y-3">
                      {candidates.map((candidate) => (
                        <div key={candidate.id} className="flex items-center space-x-3 p-3 bg-green-50 rounded-lg border border-green-200">
                          <CheckCircle className="h-4 w-4 text-green-600 flex-shrink-0" />
                          <Avatar className="h-10 w-10">
                            <AvatarImage src={candidate.photo} alt={getFullName(candidate)} />
                            <AvatarFallback className="bg-green-100 text-green-700 text-sm">
                              {getInitials(candidate.firstName, candidate.lastName)}
                            </AvatarFallback>
                          </Avatar>
                          <div className="flex-1 min-w-0">
                            <p className="font-medium text-green-900">{getFullName(candidate)}</p>
                            <p className="text-sm text-green-700">{candidate.user?.studentId || 'N/A'}</p>
                            {showVoteDetails && candidate.slogan && (
                              <p className="text-xs text-green-600 italic mt-1">"{candidate.slogan}"</p>
                            )}
                          </div>
                          {showVoteDetails && (
                            <Dialog>
                              <DialogTrigger asChild>
                                <Button size="sm" variant="outline">
                                  <Eye className="h-3 w-3 mr-1" />
                                  Details
                                </Button>
                              </DialogTrigger>
                              <DialogContent className="max-w-2xl">
                                <DialogHeader>
                                  <DialogTitle>{getFullName(candidate)}</DialogTitle>
                                  <DialogDescription>
                                    Candidate details for {position.name}
                                  </DialogDescription>
                                </DialogHeader>
                                <ScrollArea className="max-h-96">
                                  <div className="space-y-4">
                                    <div className="flex items-start space-x-4">
                                      <Avatar className="h-16 w-16">
                                        <AvatarImage src={candidate.photo} alt={getFullName(candidate)} />
                                        <AvatarFallback className="bg-blue-100 text-blue-700">
                                          {getInitials(candidate.firstName, candidate.lastName)}
                                        </AvatarFallback>
                                      </Avatar>
                                      <div className="flex-1">
                                        <h3 className="font-semibold text-lg">{getFullName(candidate)}</h3>
                                        <p className="text-sm text-gray-600">{candidate.user?.studentId}</p>
                                        <div className="flex items-center space-x-4 mt-2 text-sm">
                                          {candidate.department && (
                                            <span className="flex items-center">
                                              <MapPin className="h-3 w-3 mr-1" />
                                              {candidate.department}
                                            </span>
                                          )}
                                          {candidate.faculty && (
                                            <span>{candidate.faculty}</span>
                                          )}
                                        </div>
                                      </div>
                                    </div>
                                    {candidate.manifesto && (
                                      <div>
                                        <h4 className="font-medium mb-2">Manifesto</h4>
                                        <div className="bg-gray-50 rounded-lg p-3">
                                          <p className="text-sm leading-relaxed">{candidate.manifesto}</p>
                                        </div>
                                      </div>
                                    )}
                                  </div>
                                </ScrollArea>
                              </DialogContent>
                            </Dialog>
                          )}
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              )
            })}
          </div>
        </CardContent>
      </Card>

      {/* Security Notice */}
      <Alert>
        <Shield className="h-4 w-4" />
        <AlertDescription>
          <strong>Important:</strong> Once you submit your vote, it cannot be changed.
          Your vote will be encrypted and recorded on the blockchain for security and transparency.
          Please review your selections carefully before confirming.
        </AlertDescription>
      </Alert>

      {/* Voting Session Info */}
      <Card className="border-gray-200">
        <CardContent className="p-4">
          <div className="flex items-center justify-between text-sm text-gray-600">
            <div className="flex items-center space-x-2">
              <Hash className="h-4 w-4" />
              <span>Session ID: {ballot.sessionId.slice(0, 8)}...</span>
            </div>
            <div className="flex items-center space-x-2">
              <Clock className="h-4 w-4" />
              <span>Submitted at: {format(new Date(), 'PPp')}</span>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Action Buttons */}
      <div className="flex items-center justify-between pt-6 border-t">
        <Button
          variant="outline"
          onClick={onCancel}
          disabled={isSubmitting}
          size="lg"
        >
          Back to Review
        </Button>

        <div className="flex items-center space-x-4">
          <div className="text-right text-sm text-gray-600">
            <p>Total votes: <span className="font-medium">{getTotalVotes()}</span></p>
            <p>Positions: <span className="font-medium">{positions.length}</span></p>
          </div>
          <Button
            onClick={onConfirm}
            disabled={isSubmitting}
            size="lg"
            className="bg-green-600 hover:bg-green-700 min-w-32"
          >
            {isSubmitting ? (
              <>
                <Clock className="h-4 w-4 mr-2 animate-spin" />
                Submitting...
              </>
            ) : (
              <>
                <CheckCircle className="h-4 w-4 mr-2" />
                Confirm & Submit Vote
              </>
            )}
          </Button>
        </div>
      </div>
    </div>
  )
}

export default VoteConfirmation