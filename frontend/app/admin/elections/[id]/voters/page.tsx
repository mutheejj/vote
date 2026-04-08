"use client"

import React, { useState, useEffect, useMemo } from "react"
import { useParams, useRouter } from "next/navigation"
import Link from "next/link"
import {
  ArrowLeft,
  Search,
  Filter,
  Download,
  Upload,
  UserPlus,
  Users,
  UserCheck,
  UserX,
  Eye,
  Mail,
  Phone,
  GraduationCap,
  Calendar,
  CheckCircle,
  XCircle,
  AlertTriangle,
  MoreHorizontal,
  Edit,
  Trash2,
  FileText,
  Send,
  Shield,
  Clock,
  Target,
  TrendingUp,
  Database,
  RefreshCw
} from "lucide-react"
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Badge } from "@/components/ui/badge"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { Progress } from "@/components/ui/progress"
import { Checkbox } from "@/components/ui/checkbox"
import { useAuth } from "@/lib/hooks/useAuth"
import { useNotifications } from "@/lib/hooks/useNotifications"
import {
  getElectionById,
  addEligibleVoters,
  removeEligibleVoters
} from "@/lib/api/elections"
import { Election, SafeUser } from "@/lib/types"
import { UserRole, UNIVERSITY_FACULTIES, YEAR_OF_STUDY_OPTIONS } from "@/lib/enums"
import { cn } from "@/lib/utils/cn"
import { format } from "date-fns"
import { StatsCard, StatsGrid } from "@/components/admin/StatsCard"

// Mock voter data - in real app this would come from API
interface VoterData extends SafeUser {
  isEligible: boolean
  hasVoted: boolean
  votedAt?: Date
  verificationStatus: 'verified' | 'pending' | 'failed'
  deviceInfo?: {
    browser: string
    os: string
    lastSeen: Date
  }
}

// Mock voters - in real implementation this would come from API
const mockVoters: VoterData[] = [
  {
    id: "1",
    studentId: "CS101-2020/2024",
    email: "john.doe@student.jkuat.ac.ke",
    firstName: "John",
    lastName: "Doe",
    faculty: "Computing and Information Technology",
    department: "Computer Science",
    course: "Bachelor of Science in Computer Science",
    yearOfStudy: 3,
    admissionYear: 2020,
    role: UserRole.VOTER,
    permissions: [],
    isActive: true,
    isVerified: true,
    twoFactorEnabled: false,
    createdAt: new Date(),
    updatedAt: new Date(),
    isEligible: true,
    hasVoted: true,
    votedAt: new Date(),
    verificationStatus: 'verified'
  },
  // Add more mock data as needed
]

interface AddVotersDialogProps {
  isOpen: boolean
  onClose: () => void
  onAddVoters: (voterIds: string[]) => void
  election: Election
}

function AddVotersDialog({ isOpen, onClose, onAddVoters, election }: AddVotersDialogProps) {
  const [selectedVoters, setSelectedVoters] = useState<string[]>([])
  const [searchQuery, setSearchQuery] = useState("")
  const [isLoading, setIsLoading] = useState(false)

  const handleSubmit = async () => {
    setIsLoading(true)
    try {
      await onAddVoters(selectedVoters)
      setSelectedVoters([])
      onClose()
    } finally {
      setIsLoading(false)
    }
  }

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-4xl max-h-[80vh] overflow-auto">
        <DialogHeader>
          <DialogTitle>Add Eligible Voters</DialogTitle>
          <DialogDescription>
            Select users to add as eligible voters for this election
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4">
          <div className="flex items-center space-x-2">
            <div className="relative flex-1">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
              <Input
                placeholder="Search by name, email, or student ID..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="pl-10"
              />
            </div>
            <Button variant="outline">
              <Filter className="h-4 w-4 mr-2" />
              Filters
            </Button>
          </div>

          <div className="border rounded-lg">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead className="w-12">
                    <Checkbox />
                  </TableHead>
                  <TableHead>Student</TableHead>
                  <TableHead>Faculty</TableHead>
                  <TableHead>Year</TableHead>
                  <TableHead>Status</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {mockVoters.slice(0, 5).map((voter) => (
                  <TableRow key={voter.id}>
                    <TableCell>
                      <Checkbox
                        checked={selectedVoters.includes(voter.id)}
                        onCheckedChange={(checked) => {
                          if (checked) {
                            setSelectedVoters([...selectedVoters, voter.id])
                          } else {
                            setSelectedVoters(selectedVoters.filter(id => id !== voter.id))
                          }
                        }}
                      />
                    </TableCell>
                    <TableCell>
                      <div className="flex items-center space-x-3">
                        <Avatar className="h-8 w-8">
                          <AvatarFallback>
                            {voter.firstName[0]}{voter.lastName[0]}
                          </AvatarFallback>
                        </Avatar>
                        <div>
                          <p className="font-medium">{voter.firstName} {voter.lastName}</p>
                          <p className="text-sm text-gray-500">{voter.email}</p>
                        </div>
                      </div>
                    </TableCell>
                    <TableCell>{voter.faculty}</TableCell>
                    <TableCell>Year {voter.yearOfStudy}</TableCell>
                    <TableCell>
                      <Badge variant={voter.isVerified ? "success" : "secondary"}>
                        {voter.isVerified ? "Verified" : "Pending"}
                      </Badge>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </div>
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={onClose}>
            Cancel
          </Button>
          <Button
            onClick={handleSubmit}
            disabled={selectedVoters.length === 0 || isLoading}
          >
            {isLoading ? "Adding..." : `Add ${selectedVoters.length} Voters`}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}

export default function AdminElectionVotersPage() {
  const params = useParams()
  const router = useRouter()
  const { user } = useAuth()
  const { toast } = useNotifications()

  const electionId = params.id as string

  // State
  const [election, setElection] = useState<Election | null>(null)
  const [voters, setVoters] = useState<VoterData[]>(mockVoters)
  const [isLoading, setIsLoading] = useState(true)
  const [searchQuery, setSearchQuery] = useState("")
  const [statusFilter, setStatusFilter] = useState<string>("all")
  const [facultyFilter, setFacultyFilter] = useState<string>("all")
  const [yearFilter, setYearFilter] = useState<string>("all")
  const [addVotersDialogOpen, setAddVotersDialogOpen] = useState(false)
  const [selectedVoters, setSelectedVoters] = useState<string[]>([])

  // Load data
  useEffect(() => {
    loadElectionData()
    loadVoters()
  }, [electionId])

  const loadElectionData = async () => {
    try {
      const response = await getElectionById(electionId)
      if (response.data.success && response.data.data) {
        setElection(response.data.data)
      }
    } catch (error) {
      toast.error("Failed to load election data")
    }
  }

  const loadVoters = async () => {
    setIsLoading(true)
    try {
      // In real app, this would be an API call to get eligible voters
      // const response = await getElectionVoters(electionId)
      await new Promise(resolve => setTimeout(resolve, 1000)) // Simulate API call
      setVoters(mockVoters)
    } catch (error) {
      toast.error("Failed to load voters")
    } finally {
      setIsLoading(false)
    }
  }

  // Filtered voters
  const filteredVoters = useMemo(() => {
    return voters.filter((voter) => {
      const matchesSearch = voter.firstName.toLowerCase().includes(searchQuery.toLowerCase()) ||
                          voter.lastName.toLowerCase().includes(searchQuery.toLowerCase()) ||
                          voter.email.toLowerCase().includes(searchQuery.toLowerCase()) ||
                          voter.studentId.toLowerCase().includes(searchQuery.toLowerCase())

      const matchesStatus = statusFilter === "all" ||
        (statusFilter === "voted" && voter.hasVoted) ||
        (statusFilter === "not-voted" && !voter.hasVoted) ||
        (statusFilter === "eligible" && voter.isEligible) ||
        (statusFilter === "not-eligible" && !voter.isEligible)

      const matchesFaculty = facultyFilter === "all" || voter.faculty === facultyFilter
      const matchesYear = yearFilter === "all" || voter.yearOfStudy.toString() === yearFilter

      return matchesSearch && matchesStatus && matchesFaculty && matchesYear
    })
  }, [voters, searchQuery, statusFilter, facultyFilter, yearFilter])

  // Statistics
  const voterStats = useMemo(() => {
    const total = voters.length
    const eligible = voters.filter(v => v.isEligible).length
    const voted = voters.filter(v => v.hasVoted).length
    const verified = voters.filter(v => v.verificationStatus === 'verified').length
    const turnoutRate = eligible > 0 ? (voted / eligible) * 100 : 0

    const byFaculty = UNIVERSITY_FACULTIES.map(faculty => ({
      faculty,
      total: voters.filter(v => v.faculty === faculty).length,
      voted: voters.filter(v => v.faculty === faculty && v.hasVoted).length,
      eligible: voters.filter(v => v.faculty === faculty && v.isEligible).length
    })).filter(f => f.total > 0)

    return { total, eligible, voted, verified, turnoutRate, byFaculty }
  }, [voters])

  const facultyOptions = useMemo(() => {
    const facultySet = new Set<string>()
    voters.forEach(v => facultySet.add(v.faculty))
    const faculties = Array.from(facultySet)
    return faculties.map(f => ({ value: f, label: f }))
  }, [voters])

  const yearOptions = useMemo(() => {
    const yearSet = new Set<number>()
    voters.forEach(v => yearSet.add(v.yearOfStudy))
    const years = Array.from(yearSet).sort()
    return years.map(y => ({ value: y.toString(), label: `Year ${y}` }))
  }, [voters])

  // Actions
  const handleAddVoters = async (voterIds: string[]) => {
    try {
      const response = await addEligibleVoters(electionId, voterIds)
      if (response.data.success) {
        toast.success(`Added ${voterIds.length} eligible voters`)
        loadVoters() // Reload the list
      }
    } catch (error) {
      toast.error("Failed to add voters")
    }
  }

  const handleRemoveVoters = async (voterIds: string[]) => {
    try {
      const response = await removeEligibleVoters(electionId, voterIds)
      if (response.data.success) {
        toast.success(`Removed ${voterIds.length} voters`)
        loadVoters() // Reload the list
        setSelectedVoters([])
      }
    } catch (error) {
      toast.error("Failed to remove voters")
    }
  }

  const handleBulkRemove = async () => {
    if (selectedVoters.length === 0) return
    await handleRemoveVoters(selectedVoters)
  }

  const toggleSelectAll = () => {
    if (selectedVoters.length === filteredVoters.length) {
      setSelectedVoters([])
    } else {
      setSelectedVoters(filteredVoters.map(v => v.id))
    }
  }

  const getStatusVariant = (voter: VoterData) => {
    if (!voter.isEligible) return "secondary"
    if (voter.hasVoted) return "success"
    return "default"
  }

  const getStatusText = (voter: VoterData) => {
    if (!voter.isEligible) return "Not Eligible"
    if (voter.hasVoted) return "Voted"
    return "Eligible"
  }

  if (isLoading) {
    return (
      <div className="container mx-auto p-6">
        <div className="space-y-6">
          <div className="h-8 bg-gray-200 rounded animate-pulse"></div>
          <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
            {[...Array(4)].map((_, i) => (
              <div key={i} className="h-24 bg-gray-200 rounded animate-pulse"></div>
            ))}
          </div>
          <div className="h-96 bg-gray-200 rounded animate-pulse"></div>
        </div>
      </div>
    )
  }

  if (!election) {
    return (
      <div className="container mx-auto p-6">
        <Card>
          <CardContent className="p-8 text-center">
            <AlertTriangle className="h-12 w-12 text-gray-400 mx-auto mb-4" />
            <h3 className="text-lg font-semibold mb-2">Election Not Found</h3>
            <p className="text-gray-600 mb-4">The election you're looking for doesn't exist or has been removed.</p>
            <Button asChild>
              <Link href="/admin/elections">
                <ArrowLeft className="h-4 w-4 mr-2" />
                Back to Elections
              </Link>
            </Button>
          </CardContent>
        </Card>
      </div>
    )
  }

  return (
    <div className="container mx-auto p-6 space-y-6">
      {/* Header */}
      <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-4">
        <div>
          <div className="flex items-center space-x-4 mb-2">
            <Button variant="ghost" size="sm" asChild>
              <Link href={`/admin/elections/${electionId}`}>
                <ArrowLeft className="h-4 w-4 mr-2" />
                Back to Election
              </Link>
            </Button>
          </div>
          <h1 className="text-3xl font-bold text-gray-900">Election Voters</h1>
          <div className="flex items-center space-x-2 text-sm text-gray-600">
            <span>Election:</span>
            <span className="font-medium">{election.title}</span>
            <span>"</span>
            <span>{filteredVoters.length} voters</span>
          </div>
        </div>

        <div className="flex items-center space-x-2">
          {selectedVoters.length > 0 && (
            <Button variant="destructive" size="sm" onClick={handleBulkRemove}>
              <Trash2 className="h-4 w-4 mr-2" />
              Remove Selected ({selectedVoters.length})
            </Button>
          )}
          <Button variant="outline" size="sm">
            <Upload className="h-4 w-4 mr-2" />
            Import
          </Button>
          <Button variant="outline" size="sm">
            <Download className="h-4 w-4 mr-2" />
            Export
          </Button>
          <Button size="sm" onClick={() => setAddVotersDialogOpen(true)}>
            <UserPlus className="h-4 w-4 mr-2" />
            Add Voters
          </Button>
        </div>
      </div>

      {/* Statistics Cards */}
      <StatsGrid
        stats={[
          {
            title: "Total Voters",
            value: voterStats.total,
            icon: Users,
            variant: "default"
          },
          {
            title: "Eligible Voters",
            value: voterStats.eligible,
            icon: UserCheck,
            variant: "info"
          },
          {
            title: "Votes Cast",
            value: voterStats.voted,
            icon: CheckCircle,
            variant: "success"
          },
          {
            title: "Turnout Rate",
            value: `${voterStats.turnoutRate.toFixed(1)}%`,
            icon: TrendingUp,
            variant: voterStats.turnoutRate > 50 ? "success" : "warning"
          }
        ]}
      />

      {/* Main Content */}
      <Tabs defaultValue="voters" className="space-y-6">
        <TabsList>
          <TabsTrigger value="voters">Voter List</TabsTrigger>
          <TabsTrigger value="analytics">Analytics</TabsTrigger>
          <TabsTrigger value="notifications">Notifications</TabsTrigger>
        </TabsList>

        <TabsContent value="voters" className="space-y-6">
          {/* Filters */}
          <Card>
            <CardContent className="p-4">
              <div className="flex flex-col lg:flex-row gap-4">
                <div className="flex-1">
                  <div className="relative">
                    <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
                    <Input
                      placeholder="Search voters by name, email, or student ID..."
                      value={searchQuery}
                      onChange={(e) => setSearchQuery(e.target.value)}
                      className="pl-10"
                    />
                  </div>
                </div>

                <div className="flex items-center space-x-2">
                  <Select value={statusFilter} onValueChange={setStatusFilter}>
                    <SelectTrigger className="w-40">
                      <SelectValue placeholder="All Status" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="all">All Status</SelectItem>
                      <SelectItem value="eligible">Eligible</SelectItem>
                      <SelectItem value="not-eligible">Not Eligible</SelectItem>
                      <SelectItem value="voted">Voted</SelectItem>
                      <SelectItem value="not-voted">Not Voted</SelectItem>
                    </SelectContent>
                  </Select>

                  <Select value={facultyFilter} onValueChange={setFacultyFilter}>
                    <SelectTrigger className="w-40">
                      <SelectValue placeholder="All Faculties" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="all">All Faculties</SelectItem>
                      {facultyOptions.map((faculty) => (
                        <SelectItem key={faculty.value} value={faculty.value}>
                          {faculty.label}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>

                  <Select value={yearFilter} onValueChange={setYearFilter}>
                    <SelectTrigger className="w-32">
                      <SelectValue placeholder="All Years" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="all">All Years</SelectItem>
                      {yearOptions.map((year) => (
                        <SelectItem key={year.value} value={year.value}>
                          {year.label}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>

                  <Button variant="outline" size="sm">
                    <RefreshCw className="h-4 w-4 mr-2" />
                    Refresh
                  </Button>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Voters Table */}
          <Card>
            <CardHeader>
              <CardTitle>Voters ({filteredVoters.length})</CardTitle>
              <CardDescription>
                Manage eligible voters for this election
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="rounded-md border">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead className="w-12">
                        <Checkbox
                          checked={selectedVoters.length === filteredVoters.length && filteredVoters.length > 0}
                          onCheckedChange={toggleSelectAll}
                        />
                      </TableHead>
                      <TableHead>Voter</TableHead>
                      <TableHead>Academic Info</TableHead>
                      <TableHead>Status</TableHead>
                      <TableHead>Last Activity</TableHead>
                      <TableHead>Actions</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {filteredVoters.length === 0 ? (
                      <TableRow>
                        <TableCell colSpan={6} className="text-center py-8">
                          <div className="flex flex-col items-center space-y-2">
                            <Users className="h-8 w-8 text-gray-300" />
                            <p className="text-gray-500">No voters found</p>
                          </div>
                        </TableCell>
                      </TableRow>
                    ) : (
                      filteredVoters.map((voter) => (
                        <TableRow key={voter.id}>
                          <TableCell>
                            <Checkbox
                              checked={selectedVoters.includes(voter.id)}
                              onCheckedChange={(checked) => {
                                if (checked) {
                                  setSelectedVoters([...selectedVoters, voter.id])
                                } else {
                                  setSelectedVoters(selectedVoters.filter(id => id !== voter.id))
                                }
                              }}
                            />
                          </TableCell>
                          <TableCell>
                            <div className="flex items-center space-x-3">
                              <Avatar className="h-10 w-10">
                                <AvatarImage src={voter.profileImage} alt={voter.firstName} />
                                <AvatarFallback>
                                  {voter.firstName[0]}{voter.lastName[0]}
                                </AvatarFallback>
                              </Avatar>
                              <div>
                                <p className="font-medium">
                                  {voter.firstName} {voter.lastName}
                                </p>
                                <div className="flex items-center space-x-2 text-sm text-gray-500">
                                  <span>{voter.studentId}</span>
                                  <span>"</span>
                                  <span>{voter.email}</span>
                                </div>
                              </div>
                            </div>
                          </TableCell>

                          <TableCell>
                            <div className="space-y-1 text-sm">
                              <div className="flex items-center space-x-1">
                                <GraduationCap className="h-3 w-3 text-gray-400" />
                                <span>{voter.faculty}</span>
                              </div>
                              <div className="text-gray-500">
                                {voter.department}
                              </div>
                              <div className="text-gray-500">
                                Year {voter.yearOfStudy}
                              </div>
                            </div>
                          </TableCell>

                          <TableCell>
                            <div className="space-y-1">
                              <Badge variant={getStatusVariant(voter)}>
                                {getStatusText(voter)}
                              </Badge>
                              {voter.hasVoted && voter.votedAt && (
                                <div className="text-xs text-gray-500">
                                  Voted {format(voter.votedAt, "MMM d, h:mm a")}
                                </div>
                              )}
                            </div>
                          </TableCell>

                          <TableCell>
                            <div className="text-sm text-gray-600">
                              {voter.lastLogin ? format(new Date(voter.lastLogin), "MMM d, yyyy") : "Never"}
                            </div>
                          </TableCell>

                          <TableCell>
                            <DropdownMenu>
                              <DropdownMenuTrigger asChild>
                                <Button variant="ghost" className="h-8 w-8 p-0">
                                  <MoreHorizontal className="h-4 w-4" />
                                </Button>
                              </DropdownMenuTrigger>
                              <DropdownMenuContent align="end">
                                <DropdownMenuLabel>Actions</DropdownMenuLabel>
                                <DropdownMenuSeparator />

                                <DropdownMenuItem>
                                  <Eye className="h-4 w-4 mr-2" />
                                  View Profile
                                </DropdownMenuItem>

                                <DropdownMenuItem>
                                  <Mail className="h-4 w-4 mr-2" />
                                  Send Notification
                                </DropdownMenuItem>

                                {voter.hasVoted && (
                                  <DropdownMenuItem>
                                    <FileText className="h-4 w-4 mr-2" />
                                    View Vote Receipt
                                  </DropdownMenuItem>
                                )}

                                <DropdownMenuSeparator />

                                <DropdownMenuItem
                                  onClick={() => handleRemoveVoters([voter.id])}
                                  className="text-red-600"
                                >
                                  <Trash2 className="h-4 w-4 mr-2" />
                                  Remove from Election
                                </DropdownMenuItem>
                              </DropdownMenuContent>
                            </DropdownMenu>
                          </TableCell>
                        </TableRow>
                      ))
                    )}
                  </TableBody>
                </Table>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="analytics" className="space-y-6">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {/* Faculty Breakdown */}
            <Card>
              <CardHeader>
                <CardTitle>Participation by Faculty</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  {voterStats.byFaculty.map((faculty, index) => (
                    <div key={index} className="space-y-2">
                      <div className="flex items-center justify-between">
                        <span className="text-sm font-medium">{faculty.faculty}</span>
                        <span className="text-sm text-gray-600">
                          {faculty.voted}/{faculty.eligible} ({faculty.eligible > 0 ? ((faculty.voted / faculty.eligible) * 100).toFixed(1) : 0}%)
                        </span>
                      </div>
                      <Progress
                        value={faculty.eligible > 0 ? (faculty.voted / faculty.eligible) * 100 : 0}
                        className="h-2"
                      />
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>

            {/* Voting Timeline */}
            <Card>
              <CardHeader>
                <CardTitle>Voting Timeline</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-center py-8">
                  <Clock className="h-12 w-12 text-gray-400 mx-auto mb-4" />
                  <p className="text-gray-600">Voting timeline chart will be displayed here</p>
                </div>
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        <TabsContent value="notifications" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>Send Notifications</CardTitle>
              <CardDescription>
                Send notifications to voters about this election
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <Button variant="outline" className="h-auto p-6 flex flex-col items-start space-y-2">
                  <div className="flex items-center space-x-2">
                    <Send className="h-5 w-5" />
                    <span className="font-medium">Election Reminder</span>
                  </div>
                  <span className="text-sm text-gray-600">
                    Remind eligible voters about the upcoming election
                  </span>
                </Button>

                <Button variant="outline" className="h-auto p-6 flex flex-col items-start space-y-2">
                  <div className="flex items-center space-x-2">
                    <Clock className="h-5 w-5" />
                    <span className="font-medium">Voting Deadline</span>
                  </div>
                  <span className="text-sm text-gray-600">
                    Notify voters about the approaching deadline
                  </span>
                </Button>

                <Button variant="outline" className="h-auto p-6 flex flex-col items-start space-y-2">
                  <div className="flex items-center space-x-2">
                    <Target className="h-5 w-5" />
                    <span className="font-medium">Custom Message</span>
                  </div>
                  <span className="text-sm text-gray-600">
                    Send a custom notification to selected voters
                  </span>
                </Button>

                <Button variant="outline" className="h-auto p-6 flex flex-col items-start space-y-2">
                  <div className="flex items-center space-x-2">
                    <CheckCircle className="h-5 w-5" />
                    <span className="font-medium">Vote Confirmation</span>
                  </div>
                  <span className="text-sm text-gray-600">
                    Send confirmation to voters who have voted
                  </span>
                </Button>
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>

      {/* Add Voters Dialog */}
      <AddVotersDialog
        isOpen={addVotersDialogOpen}
        onClose={() => setAddVotersDialogOpen(false)}
        onAddVoters={handleAddVoters}
        election={election}
      />
    </div>
  )
}