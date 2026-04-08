"use client"

import React, { useState } from "react"
import {
  User,
  GraduationCap,
  Award,
  Calendar,
  Medal,
  Check,
  ExternalLink,
  Mail,
  Phone,
  Heart,
  Star,
  Trophy,
  Target,
  Quote,
  ChevronDown,
  ChevronUp,
  Eye
} from "lucide-react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { Separator } from "@/components/ui/separator"
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from "@/components/ui/collapsible"
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog"
import { ScrollArea } from "@/components/ui/scroll-area"
import { Candidate, Position, SafeUser } from "@/lib/types"
import { CandidateStatus, CANDIDATE_STATUS_LABELS } from "@/lib/enums"
import { cn } from "@/lib/utils/cn"

interface CandidateCardProps {
  candidate: Candidate
  position?: Position
  isSelected?: boolean
  isDisabled?: boolean
  onSelect?: (candidate: Candidate) => void
  onDeselect?: (candidate: Candidate) => void
  variant?: "default" | "compact" | "ballot"
  showPosition?: boolean
  showVoteButton?: boolean
  showStats?: boolean
  className?: string
}

// Helper functions
const getInitials = (firstName: string, lastName: string) => {
  return `${firstName[0]}${lastName[0]}`.toUpperCase()
}

const getFullName = (candidate: Candidate) => {
  return `${candidate.firstName} ${candidate.lastName}`.trim()
}

export function CandidateCard({
  candidate,
  position,
  isSelected = false,
  isDisabled = false,
  onSelect,
  onDeselect,
  variant = "default",
  showPosition = true,
  showVoteButton = true,
  showStats = true,
  className
}: CandidateCardProps) {
  const [isExpanded, setIsExpanded] = useState(false)
  const [isDialogOpen, setIsDialogOpen] = useState(false)

  const handleCardClick = () => {
    if (isDisabled) return
    if (isSelected && onDeselect) {
      onDeselect(candidate)
    } else if (!isSelected && onSelect) {
      onSelect(candidate)
    }
  }

  if (variant === "compact") {
    return (
      <Card
        className={cn(
          "cursor-pointer transition-all duration-200 hover:shadow-md",
          isSelected && "ring-2 ring-blue-500 bg-blue-50",
          isDisabled && "opacity-50 cursor-not-allowed",
          className
        )}
        onClick={handleCardClick}
      >
        <CardContent className="p-4">
          <div className="flex items-center space-x-3">
            <Avatar className="h-12 w-12">
              <AvatarImage src={candidate.photo} alt={getFullName(candidate)} />
              <AvatarFallback className="bg-blue-100 text-blue-700">
                {getInitials(candidate.firstName, candidate.lastName)}
              </AvatarFallback>
            </Avatar>
            <div className="flex-1 min-w-0">
              <h3 className="font-semibold truncate">{getFullName(candidate)}</h3>
              <p className="text-sm text-gray-600 truncate">{candidate.user?.studentId || 'N/A'}</p>
              {candidate.user?.yearOfStudy && (
                <p className="text-xs text-gray-500">Year {candidate.user.yearOfStudy}</p>
              )}
            </div>
            {isSelected && (
              <div className="flex-shrink-0">
                <div className="w-6 h-6 rounded-full bg-blue-600 flex items-center justify-center">
                  <Check className="h-4 w-4 text-white" />
                </div>
              </div>
            )}
          </div>
        </CardContent>
      </Card>
    )
  }

  if (variant === "ballot") {
    return (
      <Card
        className={cn(
          "cursor-pointer transition-all duration-200",
          isSelected
            ? "ring-2 ring-green-500 bg-green-50 border-green-200"
            : "hover:shadow-md hover:border-gray-300",
          isDisabled && "opacity-50 cursor-not-allowed",
          className
        )}
        onClick={handleCardClick}
      >
        <CardContent className="p-6">
          <div className="flex items-start space-x-4">
            <div className="flex-shrink-0">
              <div className={cn(
                "w-6 h-6 rounded-full border-2 flex items-center justify-center transition-colors",
                isSelected
                  ? "bg-green-600 border-green-600"
                  : "border-gray-300 hover:border-gray-400"
              )}>
                {isSelected && <Check className="h-4 w-4 text-white" />}
              </div>
            </div>
            <Avatar className="h-16 w-16">
              <AvatarImage src={candidate.photo} alt={getFullName(candidate)} />
              <AvatarFallback className="bg-blue-100 text-blue-700 text-lg">
                {getInitials(candidate.firstName, candidate.lastName)}
              </AvatarFallback>
            </Avatar>
            <div className="flex-1 min-w-0">
              <h3 className="text-lg font-semibold mb-1">{getFullName(candidate)}</h3>
              <p className="text-sm text-gray-600 mb-2">{candidate.user?.studentId || 'N/A'}</p>
              <div className="flex flex-wrap gap-2 mb-3">
                {candidate.department && (
                  <Badge variant="outline" className="text-xs">
                    <GraduationCap className="h-3 w-3 mr-1" />
                    {candidate.department}
                  </Badge>
                )}
                {candidate.user?.yearOfStudy && (
                  <Badge variant="outline" className="text-xs">
                    <Calendar className="h-3 w-3 mr-1" />
                    Year {candidate.user.yearOfStudy}
                  </Badge>
                )}
                <Badge variant="outline" className={cn(
                  "text-xs",
                  candidate.status === CandidateStatus.APPROVED && "bg-green-100 text-green-700",
                  candidate.status === CandidateStatus.PENDING && "bg-yellow-100 text-yellow-700",
                  candidate.status === CandidateStatus.REJECTED && "bg-red-100 text-red-700"
                )}>
                  {CANDIDATE_STATUS_LABELS[candidate.status]}
                </Badge>
              </div>
              {candidate.manifesto && (
                <p className="text-sm text-gray-700 line-clamp-2">
                  {candidate.manifesto}
                </p>
              )}
            </div>
            <div className="flex-shrink-0">
              <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
                <DialogTrigger asChild>
                  <Button size="sm" variant="outline" onClick={(e) => e.stopPropagation()}>
                    <Eye className="h-4 w-4 mr-1" />
                    View Details
                  </Button>
                </DialogTrigger>
                <DialogContent className="max-w-2xl">
                  <DialogHeader>
                    <DialogTitle>Candidate Details</DialogTitle>
                    <DialogDescription>
                      Complete information about {getFullName(candidate)}
                    </DialogDescription>
                  </DialogHeader>
                  <ScrollArea className="max-h-96">
                    <CandidateDetailsContent candidate={candidate} position={position} />
                  </ScrollArea>
                </DialogContent>
              </Dialog>
            </div>
          </div>
        </CardContent>
      </Card>
    )
  }

  return (
    <Card className={cn(
      "transition-all duration-200 hover:shadow-lg",
      isSelected && "ring-2 ring-blue-500",
      className
    )}>
      <CardHeader>
        <div className="flex items-start space-x-4">
          <Avatar className="h-20 w-20">
            <AvatarImage src={candidate.photo} alt={getFullName(candidate)} />
            <AvatarFallback className="bg-blue-100 text-blue-700 text-xl">
              {getInitials(candidate.firstName, candidate.lastName)}
            </AvatarFallback>
          </Avatar>
          <div className="flex-1 min-w-0">
            <CardTitle className="text-xl mb-2">{getFullName(candidate)}</CardTitle>
            <CardDescription className="space-y-1">
              <div className="flex items-center text-sm">
                <User className="h-4 w-4 mr-2" />
                {candidate.user?.studentId || 'N/A'}
              </div>
              {candidate.email && (
                <div className="flex items-center text-sm">
                  <Mail className="h-4 w-4 mr-2" />
                  {candidate.email}
                </div>
              )}
              {candidate.phone && (
                <div className="flex items-center text-sm">
                  <Phone className="h-4 w-4 mr-2" />
                  {candidate.phone}
                </div>
              )}
            </CardDescription>
          </div>
          {showVoteButton && (
            <div className="flex-shrink-0">
              <Button
                onClick={handleCardClick}
                disabled={isDisabled}
                variant={isSelected ? "default" : "outline"}
                className={cn(
                  isSelected && "bg-green-600 hover:bg-green-700"
                )}
              >
                {isSelected ? (
                  <>
                    <Check className="h-4 w-4 mr-2" />
                    Selected
                  </>
                ) : (
                  "Select Candidate"
                )}
              </Button>
            </div>
          )}
        </div>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="grid grid-cols-2 gap-4">
          {candidate.department && (
            <div className="space-y-1">
              <label className="text-sm font-medium text-gray-700">Department</label>
              <div className="flex items-center">
                <GraduationCap className="h-4 w-4 mr-2 text-gray-500" />
                <span className="text-sm">{candidate.department}</span>
              </div>
            </div>
          )}
          {candidate.user?.yearOfStudy && (
            <div className="space-y-1">
              <label className="text-sm font-medium text-gray-700">Year of Study</label>
              <div className="flex items-center">
                <Calendar className="h-4 w-4 mr-2 text-gray-500" />
                <span className="text-sm">Year {candidate.user.yearOfStudy}</span>
              </div>
            </div>
          )}
          {candidate.faculty && (
            <div className="space-y-1">
              <label className="text-sm font-medium text-gray-700">Faculty</label>
              <div className="flex items-center">
                <Star className="h-4 w-4 mr-2 text-yellow-500" />
                <span className="text-sm font-medium">{candidate.faculty}</span>
              </div>
            </div>
          )}
          {showPosition && position && (
            <div className="space-y-1">
              <label className="text-sm font-medium text-gray-700">Position</label>
              <div className="flex items-center">
                <Award className="h-4 w-4 mr-2 text-sage-500" />
                <span className="text-sm">{position.name}</span>
              </div>
            </div>
          )}
          <div className="space-y-1">
            <label className="text-sm font-medium text-gray-700">Status</label>
            <div className="flex items-center">
              <Badge className={cn(
                "text-xs",
                candidate.status === CandidateStatus.APPROVED && "bg-green-100 text-green-700",
                candidate.status === CandidateStatus.PENDING && "bg-yellow-100 text-yellow-700",
                candidate.status === CandidateStatus.REJECTED && "bg-red-100 text-red-700",
                candidate.status === CandidateStatus.DISQUALIFIED && "bg-red-100 text-red-700",
                candidate.status === CandidateStatus.WITHDRAWN && "bg-gray-100 text-gray-700"
              )}>
                {CANDIDATE_STATUS_LABELS[candidate.status]}
              </Badge>
            </div>
          </div>
        </div>
        {candidate.manifesto && (
          <>
            <Separator />
            <div>
              <h4 className="font-medium text-sm mb-2 flex items-center">
                <Quote className="h-4 w-4 mr-2 text-blue-500" />
                Manifesto
              </h4>
              <div className="bg-gray-50 rounded-lg p-3">
                <p className="text-sm text-gray-700 leading-relaxed">
                  {candidate.manifesto}
                </p>
              </div>
            </div>
          </>
        )}
        {candidate.slogan && (
          <>
            <Separator />
            <div>
              <h4 className="font-medium text-sm mb-2 flex items-center">
                <Target className="h-4 w-4 mr-2 text-green-500" />
                Campaign Slogan
              </h4>
              <div className="bg-green-50 rounded-lg p-3">
                <p className="text-sm text-green-700 font-medium italic">
                  "{candidate.slogan}"
                </p>
              </div>
            </div>
          </>
        )}
        {candidate.socialMedia && Object.keys(candidate.socialMedia).length > 0 && (
          <>
            <Separator />
            <div>
              <h4 className="font-medium text-sm mb-2 flex items-center">
                <ExternalLink className="h-4 w-4 mr-2 text-gray-500" />
                Social Links
              </h4>
              <div className="flex flex-wrap gap-2">
                {Object.entries(candidate.socialMedia).map(([platform, url]) => (
                  <a
                    key={platform}
                    href={url as string}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="inline-flex items-center rounded-md border border-gray-300 px-2.5 py-0.5 text-xs font-semibold transition-colors hover:bg-gray-100"
                  >
                    {platform}
                  </a>
                ))}
              </div>
            </div>
          </>
        )}
      </CardContent>
    </Card>
  )
}

function CandidateDetailsContent({
  candidate,
  position
}: {
  candidate: Candidate
  position?: Position
}) {
  return (
    <div className="space-y-6">
      <div className="flex items-start space-x-4">
        <Avatar className="h-24 w-24">
          <AvatarImage src={candidate.photo} alt={getFullName(candidate)} />
          <AvatarFallback className="bg-blue-100 text-blue-700 text-2xl">
            {getInitials(candidate.firstName, candidate.lastName)}
          </AvatarFallback>
        </Avatar>
        <div className="flex-1">
          <h2 className="text-2xl font-bold mb-2">{getFullName(candidate)}</h2>
          <div className="space-y-1 text-sm text-gray-600">
            <div className="flex items-center">
              <User className="h-4 w-4 mr-2" />
              {candidate.user?.studentId || 'N/A'}
            </div>
            {candidate.email && (
              <div className="flex items-center">
                <Mail className="h-4 w-4 mr-2" />
                {candidate.email}
              </div>
            )}
            {candidate.phone && (
              <div className="flex items-center">
                <Phone className="h-4 w-4 mr-2" />
                {candidate.phone}
              </div>
            )}
          </div>
        </div>
      </div>
      <div>
        <h3 className="font-semibold mb-3">Academic Information</h3>
        <div className="grid grid-cols-2 gap-4 text-sm">
          {candidate.department && (
            <div>
              <label className="font-medium text-gray-700">Department</label>
              <p>{candidate.department}</p>
            </div>
          )}
          {candidate.user?.yearOfStudy && (
            <div>
              <label className="font-medium text-gray-700">Year of Study</label>
              <p>Year {candidate.user.yearOfStudy}</p>
            </div>
          )}
          {candidate.faculty && (
            <div>
              <label className="font-medium text-gray-700">Faculty</label>
              <p>{candidate.faculty}</p>
            </div>
          )}
          {position && (
            <div>
              <label className="font-medium text-gray-700">Running for</label>
              <p>{position.name}</p>
            </div>
          )}
          <div>
            <label className="font-medium text-gray-700">Status</label>
            <Badge className={cn(
              "text-xs",
              candidate.status === CandidateStatus.APPROVED && "bg-green-100 text-green-700",
              candidate.status === CandidateStatus.PENDING && "bg-yellow-100 text-yellow-700",
              candidate.status === CandidateStatus.REJECTED && "bg-red-100 text-red-700"
            )}>
              {CANDIDATE_STATUS_LABELS[candidate.status]}
            </Badge>
          </div>
        </div>
      </div>
      {candidate.manifesto && (
        <div>
          <h3 className="font-semibold mb-3">Manifesto</h3>
          <div className="bg-gray-50 rounded-lg p-4">
            <p className="text-sm leading-relaxed">{candidate.manifesto}</p>
          </div>
        </div>
      )}
    </div>
  )
}

export default CandidateCard