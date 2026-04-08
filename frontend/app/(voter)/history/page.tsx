"use client"

import React, { useState, useMemo } from "react"
import Link from "next/link"
import {
  Search,
  Filter,
  Calendar,
  Clock,
  Vote,
  Eye,
  Download,
  CheckCircle,
  AlertCircle,
  BarChart3,
  Award,
  Users,
  SortAsc,
  SortDesc,
  ChevronDown
} from "lucide-react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Badge } from "@/components/ui/badge"
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import { VoteReceipt as VoteReceiptComponent } from "@/components/voter/VoteReceipt"
import { useVoting } from "@/lib/hooks/useVoting"
import { useAuth } from "@/lib/hooks/useAuth"
import { VoteReceipt } from "@/lib/types"
import { ElectionStatus, ELECTION_STATUS_LABELS } from "@/lib/enums"
import { cn } from "@/lib/utils/cn"
import { format, isThisYear, isThisMonth } from "date-fns"

type SortOption = "date" | "election" | "status"
type SortDirection = "asc" | "desc"
type FilterPeriod = "all" | "thisMonth" | "thisYear" | "lastYear"

export default function VotingHistoryPage() {
  const { user } = useAuth()
  const { votingHistory, isLoading } = useVoting()

  const [searchQuery, setSearchQuery] = useState("")
  const [statusFilter, setStatusFilter] = useState<string>("all")
  const [periodFilter, setPeriodFilter] = useState<FilterPeriod>("all")
  const [sortBy, setSortBy] = useState<SortOption>("date")
  const [sortDirection, setSortDirection] = useState<SortDirection>("desc")
  const [selectedVote, setSelectedVote] = useState<VoteReceipt | null>(null)

  const filteredAndSortedHistory = useMemo(() => {
    if (!votingHistory) return []

    let filtered = votingHistory.filter((vote) => {
      const matchesSearch = vote.electionId.toLowerCase().includes(searchQuery.toLowerCase())

      const matchesStatus = statusFilter === "all" || (vote.verified ? 'verified' : 'pending') === statusFilter

      const voteDate = new Date(vote.timestamp)
      const matchesPeriod = (() => {
        switch (periodFilter) {
          case "thisMonth":
            return isThisMonth(voteDate)
          case "thisYear":
            return isThisYear(voteDate)
          case "lastYear":
            return voteDate.getFullYear() === new Date().getFullYear() - 1
          default:
            return true
        }
      })()

      return matchesSearch && matchesStatus && matchesPeriod
    })

    // Sort history
    filtered.sort((a, b) => {
      let aValue: any
      let bValue: any

      switch (sortBy) {
        case "date":
          aValue = new Date(a.timestamp)
          bValue = new Date(b.timestamp)
          break
        case "election":
          aValue = a.electionId.toLowerCase()
          bValue = b.electionId.toLowerCase()
          break
        case "status":
          aValue = a.verified ? 'verified' : 'pending'
          bValue = b.verified ? 'verified' : 'pending'
          break
        default:
          return 0
      }

      if (aValue < bValue) return sortDirection === "asc" ? -1 : 1
      if (aValue > bValue) return sortDirection === "asc" ? 1 : -1
      return 0
    })

    return filtered
  }, [votingHistory, searchQuery, statusFilter, periodFilter, sortBy, sortDirection])

  const historyStats = useMemo(() => {
    if (!votingHistory) return { total: 0, thisYear: 0, thisMonth: 0, completed: 0 }

    const now = new Date()
    return {
      total: votingHistory.length,
      thisYear: votingHistory.filter(v => isThisYear(new Date(v.timestamp))).length,
      thisMonth: votingHistory.filter(v => isThisMonth(new Date(v.timestamp))).length,
      completed: votingHistory.filter(v => v.verified).length
    }
  }, [votingHistory])

  const handleSort = (option: SortOption) => {
    if (sortBy === option) {
      setSortDirection(sortDirection === "asc" ? "desc" : "asc")
    } else {
      setSortBy(option)
      setSortDirection("asc")
    }
  }

  const getStatusVariant = (status: string) => {
    switch (status) {
      case 'verified':
        return "success"
      case 'pending':
        return "warning"
      case 'invalid':
        return "destructive"
      default:
        return "outline"
    }
  }

  if (isLoading) {
    return (
      <div className="space-y-6">
        <div className="h-8 bg-gray-200 rounded animate-pulse"></div>
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          {[...Array(4)].map((_, i) => (
            <Card key={i} className="animate-pulse">
              <CardContent className="p-4">
                <div className="h-12 bg-gray-200 rounded"></div>
              </CardContent>
            </Card>
          ))}
        </div>
        <Card>
          <CardContent className="p-6">
            <div className="space-y-4">
              {[...Array(5)].map((_, i) => (
                <div key={i} className="h-16 bg-gray-200 rounded animate-pulse"></div>
              ))}
            </div>
          </CardContent>
        </Card>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">Voting History</h1>
          <p className="text-gray-600">
            Track your participation in university elections
          </p>
        </div>
        <Button variant="outline">
          <Download className="h-4 w-4 mr-2" />
          Export History
        </Button>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center space-x-2">
              <div className="p-2 bg-blue-100 rounded-lg">
                <Vote className="h-4 w-4 text-blue-600" />
              </div>
              <div>
                <p className="text-sm text-gray-600">Total Votes</p>
                <p className="text-xl font-bold">{historyStats.total}</p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-4">
            <div className="flex items-center space-x-2">
              <div className="p-2 bg-green-100 rounded-lg">
                <CheckCircle className="h-4 w-4 text-green-600" />
              </div>
              <div>
                <p className="text-sm text-gray-600">Completed</p>
                <p className="text-xl font-bold">{historyStats.completed}</p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-4">
            <div className="flex items-center space-x-2">
              <div className="p-2 bg-sage-100 rounded-lg">
                <Calendar className="h-4 w-4 text-sage-600" />
              </div>
              <div>
                <p className="text-sm text-gray-600">This Year</p>
                <p className="text-xl font-bold">{historyStats.thisYear}</p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-4">
            <div className="flex items-center space-x-2">
              <div className="p-2 bg-orange-100 rounded-lg">
                <Clock className="h-4 w-4 text-orange-600" />
              </div>
              <div>
                <p className="text-sm text-gray-600">This Month</p>
                <p className="text-xl font-bold">{historyStats.thisMonth}</p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Filters */}
      <Card>
        <CardContent className="p-4">
          <div className="flex flex-col lg:flex-row gap-4">
            <div className="flex-1">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
                <Input
                  placeholder="Search elections..."
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
                  <SelectItem value="verified">Verified</SelectItem>
                  <SelectItem value="pending">Pending</SelectItem>
                </SelectContent>
              </Select>

              <Select value={periodFilter} onValueChange={(value: FilterPeriod) => setPeriodFilter(value)}>
                <SelectTrigger className="w-40">
                  <SelectValue placeholder="All Time" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Time</SelectItem>
                  <SelectItem value="thisMonth">This Month</SelectItem>
                  <SelectItem value="thisYear">This Year</SelectItem>
                  <SelectItem value="lastYear">Last Year</SelectItem>
                </SelectContent>
              </Select>

              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <Button variant="outline" size="sm">
                    {sortDirection === "asc" ? (
                      <SortAsc className="h-4 w-4 mr-2" />
                    ) : (
                      <SortDesc className="h-4 w-4 mr-2" />
                    )}
                    Sort
                    <ChevronDown className="h-4 w-4 ml-2" />
                  </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="end">
                  <DropdownMenuLabel>Sort by</DropdownMenuLabel>
                  <DropdownMenuSeparator />
                  <DropdownMenuItem onClick={() => handleSort("date")}>
                    Date {sortBy === "date" && (sortDirection === "asc" ? "�" : "�")}
                  </DropdownMenuItem>
                  <DropdownMenuItem onClick={() => handleSort("election")}>
                    Election {sortBy === "election" && (sortDirection === "asc" ? "�" : "�")}
                  </DropdownMenuItem>
                  <DropdownMenuItem onClick={() => handleSort("status")}>
                    Status {sortBy === "status" && (sortDirection === "asc" ? "�" : "�")}
                  </DropdownMenuItem>
                </DropdownMenuContent>
              </DropdownMenu>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Voting History Table */}
      <Card>
        <CardHeader>
          <CardTitle>Voting History ({filteredAndSortedHistory.length})</CardTitle>
          <CardDescription>
            Your complete voting history across all elections
          </CardDescription>
        </CardHeader>
        <CardContent>
          {filteredAndSortedHistory.length === 0 ? (
            <div className="text-center py-12">
              <Vote className="h-12 w-12 text-gray-300 mx-auto mb-4" />
              <h3 className="text-lg font-medium text-gray-900 mb-2">No Voting History</h3>
              <p className="text-gray-500 mb-6">
                {votingHistory?.length === 0
                  ? "You haven't participated in any elections yet."
                  : "No votes match your current filter criteria."}
              </p>
              {votingHistory?.length === 0 && (
                <Link href="/elections">
                  <Button>
                    Browse Elections
                  </Button>
                </Link>
              )}
            </div>
          ) : (
            <div className="rounded-md border">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Election</TableHead>
                    <TableHead>Type</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead>Vote Date</TableHead>
                    <TableHead>Positions</TableHead>
                    <TableHead className="w-[100px]">Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {filteredAndSortedHistory.map((vote) => (
                    <TableRow key={vote.id}>
                      <TableCell>
                        <div className="space-y-1">
                          <p className="font-medium">Election {vote.electionId}</p>
                          <p className="text-sm text-gray-500 line-clamp-1">
                            Receipt: {vote.verificationCode}
                          </p>
                        </div>
                      </TableCell>

                      <TableCell>
                        <Badge variant="outline">
                          Receipt
                        </Badge>
                      </TableCell>

                      <TableCell>
                        <Badge variant={getStatusVariant(vote.verified ? 'verified' : 'pending')}>
                          {vote.verified ? 'Verified' : 'Pending'}
                        </Badge>
                      </TableCell>

                      <TableCell>
                        <div className="space-y-1">
                          <p className="text-sm font-medium">
                            {format(new Date(vote.timestamp), "MMM d, yyyy")}
                          </p>
                          <p className="text-xs text-gray-500">
                            {format(new Date(vote.timestamp), "h:mm a")}
                          </p>
                        </div>
                      </TableCell>

                      <TableCell>
                        <div className="flex items-center space-x-1">
                          <Users className="h-4 w-4 text-gray-400" />
                          <span>{vote.positions?.length || 0}</span>
                        </div>
                      </TableCell>

                      <TableCell>
                        <DropdownMenu>
                          <DropdownMenuTrigger asChild>
                            <Button variant="ghost" size="sm">
                              <Eye className="h-4 w-4" />
                            </Button>
                          </DropdownMenuTrigger>
                          <DropdownMenuContent align="end">
                            <DropdownMenuLabel>Actions</DropdownMenuLabel>
                            <DropdownMenuSeparator />

                            <DropdownMenuItem onClick={() => setSelectedVote(vote)}>
                              <Eye className="h-4 w-4 mr-2" />
                              View Receipt
                            </DropdownMenuItem>

                            <DropdownMenuItem asChild>
                              <Link href={`/elections/${vote.electionId}`}>
                                <Vote className="h-4 w-4 mr-2" />
                                View Election
                              </Link>
                            </DropdownMenuItem>

                            {vote.verified && (
                              <DropdownMenuItem asChild>
                                <Link href={`/results/${vote.electionId}`}>
                                  <BarChart3 className="h-4 w-4 mr-2" />
                                  View Results
                                </Link>
                              </DropdownMenuItem>
                            )}

                            <DropdownMenuSeparator />

                            <DropdownMenuItem>
                              <Download className="h-4 w-4 mr-2" />
                              Download Receipt
                            </DropdownMenuItem>
                          </DropdownMenuContent>
                        </DropdownMenu>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Vote Receipt Modal */}
      {selectedVote && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-lg max-w-2xl w-full max-h-[90vh] overflow-y-auto">
            <div className="p-6">
              <div className="flex items-center justify-between mb-6">
                <h2 className="text-xl font-bold">Vote Receipt</h2>
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => setSelectedVote(null)}
                >
                  �
                </Button>
              </div>

              <VoteReceiptComponent
                receipt={{
                  id: selectedVote.id,
                  electionId: selectedVote.electionId,
                  voterId: selectedVote.voterId,
                  sessionId: selectedVote.sessionId,
                  verificationCode: selectedVote.verificationCode,
                  encryptedVote: selectedVote.encryptedVote,
                  receiptHash: selectedVote.receiptHash,
                  timestamp: selectedVote.timestamp,
                  verified: selectedVote.verified,
                  positions: selectedVote.positions
                }}
                election={{
                  id: selectedVote.electionId,
                  title: `Election ${selectedVote.electionId}`,
                  description: "Election details",
                  type: 'GENERAL' as any,
                  status: 'COMPLETED' as any,
                  startDate: new Date(),
                  endDate: new Date(),
                  createdAt: new Date(),
                  updatedAt: new Date(),
                  createdBy: "",
                  rules: null,
                  positions: []
                }}
                showActions={false}
              />

              <div className="flex justify-end space-x-2 mt-6 pt-6 border-t">
                <Button variant="outline" onClick={() => setSelectedVote(null)}>
                  Close
                </Button>
                <Button>
                  <Download className="h-4 w-4 mr-2" />
                  Download
                </Button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}