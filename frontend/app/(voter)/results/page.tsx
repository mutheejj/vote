"use client"

import React, { useState, useEffect } from "react"
import Link from "next/link"
import {
  Trophy,
  Calendar,
  Users,
  TrendingUp,
  ArrowRight,
  Search,
  Filter,
  Download,
  Eye,
  BarChart3,
  Clock,
  CheckCircle,
  AlertCircle,
  Award,
  Percent
} from "lucide-react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Input } from "@/components/ui/input"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Alert, AlertDescription } from "@/components/ui/alert"
import { useElections } from "@/lib/hooks/useElections"
import { ElectionStatus, ElectionType, ELECTION_STATUS_LABELS } from "@/lib/enums"
import { cn } from "@/lib/utils/cn"
import { format } from "date-fns"

export default function ResultsPage() {
  const { elections, isLoading } = useElections({ autoFetch: false })
  const [searchQuery, setSearchQuery] = useState("")
  const [filterStatus, setFilterStatus] = useState<string>("all")
  const [filterType, setFilterType] = useState<string>("all")
  const [selectedTab, setSelectedTab] = useState("completed")

  // Filter elections that have results (completed or active)
  const electionsWithResults = elections?.filter(election =>
    election.status === ElectionStatus.COMPLETED ||
    election.status === ElectionStatus.ACTIVE
  ) || []

  const completedElections = electionsWithResults.filter(e => e.status === ElectionStatus.COMPLETED)
  const activeElections = electionsWithResults.filter(e => e.status === ElectionStatus.ACTIVE)

  // Apply search and filters
  const filteredElections = electionsWithResults.filter(election => {
    const matchesSearch = election.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
      election.description?.toLowerCase().includes(searchQuery.toLowerCase())

    const matchesStatus = filterStatus === "all" || election.status === filterStatus
    const matchesType = filterType === "all" || election.type === filterType

    return matchesSearch && matchesStatus && matchesType
  })

  const getStatusBadgeVariant = (status: ElectionStatus) => {
    switch (status) {
      case ElectionStatus.COMPLETED:
        return "default"
      case ElectionStatus.ACTIVE:
        return "secondary"
      default:
        return "outline"
    }
  }

  const getStatusIcon = (status: ElectionStatus) => {
    switch (status) {
      case ElectionStatus.COMPLETED:
        return <CheckCircle className="h-4 w-4" />
      case ElectionStatus.ACTIVE:
        return <Clock className="h-4 w-4 animate-pulse" />
      default:
        return <AlertCircle className="h-4 w-4" />
    }
  }

  if (isLoading) {
    return (
      <div className="space-y-6">
        <div className="h-10 bg-gray-200 dark:bg-gray-700 rounded animate-pulse"></div>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          {[...Array(3)].map((_, i) => (
            <Card key={i} className="dark:bg-gray-800">
              <CardContent className="p-6">
                <div className="space-y-4">
                  <div className="h-6 bg-gray-200 dark:bg-gray-700 rounded animate-pulse"></div>
                  <div className="h-4 bg-gray-200 dark:bg-gray-700 rounded animate-pulse"></div>
                  <div className="h-4 bg-gray-200 dark:bg-gray-700 rounded animate-pulse"></div>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold text-gray-900 dark:text-white">Election Results</h1>
          <p className="text-gray-600 dark:text-gray-400 mt-1">
            View results and statistics from past and ongoing elections
          </p>
        </div>
        <Button variant="outline">
          <Download className="h-4 w-4 mr-2" />
          Export All
        </Button>
      </div>

      {/* Stats Overview */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <Card className="dark:bg-gray-800 dark:border-gray-700">
          <CardContent className="p-4">
            <div className="flex items-center space-x-2">
              <div className="p-2 bg-blue-100 dark:bg-blue-900 rounded-lg">
                <Trophy className="h-5 w-5 text-blue-600 dark:text-blue-400" />
              </div>
              <div>
                <p className="text-sm text-gray-600 dark:text-gray-400">Total Elections</p>
                <p className="text-2xl font-bold dark:text-white">{electionsWithResults.length}</p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="dark:bg-gray-800 dark:border-gray-700">
          <CardContent className="p-4">
            <div className="flex items-center space-x-2">
              <div className="p-2 bg-green-100 dark:bg-green-900 rounded-lg">
                <CheckCircle className="h-5 w-5 text-green-600 dark:text-green-400" />
              </div>
              <div>
                <p className="text-sm text-gray-600 dark:text-gray-400">Completed</p>
                <p className="text-2xl font-bold dark:text-white">{completedElections.length}</p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="dark:bg-gray-800 dark:border-gray-700">
          <CardContent className="p-4">
            <div className="flex items-center space-x-2">
              <div className="p-2 bg-orange-100 dark:bg-orange-900 rounded-lg">
                <Clock className="h-5 w-5 text-orange-600 dark:text-orange-400" />
              </div>
              <div>
                <p className="text-sm text-gray-600 dark:text-gray-400">Active</p>
                <p className="text-2xl font-bold dark:text-white">{activeElections.length}</p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="dark:bg-gray-800 dark:border-gray-700">
          <CardContent className="p-4">
            <div className="flex items-center space-x-2">
              <div className="p-2 bg-sage-100 dark:bg-sage-900 rounded-lg">
                <Users className="h-5 w-5 text-sage-600 dark:text-sage-400" />
              </div>
              <div>
                <p className="text-sm text-gray-600 dark:text-gray-400">Avg Turnout</p>
                <p className="text-2xl font-bold dark:text-white">--</p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Search and Filters */}
      <Card className="dark:bg-gray-800 dark:border-gray-700">
        <CardContent className="p-4">
          <div className="flex flex-col md:flex-row gap-4">
            <div className="flex-1 relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
              <Input
                type="text"
                placeholder="Search elections..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="pl-10 dark:bg-gray-700 dark:border-gray-600"
              />
            </div>
            <Select value={filterStatus} onValueChange={setFilterStatus}>
              <SelectTrigger className="w-full md:w-48 dark:bg-gray-700 dark:border-gray-600">
                <SelectValue placeholder="Filter by Status" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Statuses</SelectItem>
                <SelectItem value={ElectionStatus.COMPLETED}>Completed</SelectItem>
                <SelectItem value={ElectionStatus.ACTIVE}>Active</SelectItem>
              </SelectContent>
            </Select>
            <Select value={filterType} onValueChange={setFilterType}>
              <SelectTrigger className="w-full md:w-48 dark:bg-gray-700 dark:border-gray-600">
                <SelectValue placeholder="Filter by Type" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Types</SelectItem>
                <SelectItem value={ElectionType.PRESIDENTIAL}>Presidential</SelectItem>
                <SelectItem value={ElectionType.FACULTY}>Faculty</SelectItem>
                <SelectItem value={ElectionType.DEPARTMENTAL}>Departmental</SelectItem>
                <SelectItem value={ElectionType.CLUB}>Club</SelectItem>
                <SelectItem value={ElectionType.SOCIETY}>Society</SelectItem>
                <SelectItem value={ElectionType.REFERENDUM}>Referendum</SelectItem>
                <SelectItem value={ElectionType.POLL}>Poll</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </CardContent>
      </Card>

      {/* No Results Message */}
      {electionsWithResults.length === 0 && (
        <Alert className="dark:bg-gray-800 dark:border-gray-700">
          <BarChart3 className="h-4 w-4" />
          <AlertDescription className="dark:text-gray-300">
            <strong>No Results Available:</strong> There are no completed or active elections with results to display.
          </AlertDescription>
        </Alert>
      )}

      {/* Results Tabs */}
      {electionsWithResults.length > 0 && (
        <Tabs value={selectedTab} onValueChange={setSelectedTab}>
          <TabsList className="grid w-full grid-cols-3 dark:bg-gray-800">
            <TabsTrigger value="completed">
              Completed ({completedElections.length})
            </TabsTrigger>
            <TabsTrigger value="active">
              Active ({activeElections.length})
            </TabsTrigger>
            <TabsTrigger value="all">
              All ({filteredElections.length})
            </TabsTrigger>
          </TabsList>

          <TabsContent value="completed" className="space-y-4 mt-6">
            {completedElections.length === 0 ? (
              <Card className="dark:bg-gray-800 dark:border-gray-700">
                <CardContent className="p-12 text-center">
                  <Trophy className="h-12 w-12 text-gray-300 dark:text-gray-600 mx-auto mb-4" />
                  <h3 className="text-lg font-medium text-gray-900 dark:text-white mb-2">
                    No Completed Elections
                  </h3>
                  <p className="text-gray-500 dark:text-gray-400">
                    Completed election results will appear here
                  </p>
                </CardContent>
              </Card>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {completedElections.map((election) => (
                  <ElectionResultCard key={election.id} election={election} />
                ))}
              </div>
            )}
          </TabsContent>

          <TabsContent value="active" className="space-y-4 mt-6">
            {activeElections.length === 0 ? (
              <Card className="dark:bg-gray-800 dark:border-gray-700">
                <CardContent className="p-12 text-center">
                  <Clock className="h-12 w-12 text-gray-300 dark:text-gray-600 mx-auto mb-4" />
                  <h3 className="text-lg font-medium text-gray-900 dark:text-white mb-2">
                    No Active Elections
                  </h3>
                  <p className="text-gray-500 dark:text-gray-400">
                    Live results from active elections will appear here
                  </p>
                </CardContent>
              </Card>
            ) : (
              <>
                <Alert className="border-orange-200 bg-orange-50 dark:bg-orange-900/20 dark:border-orange-900">
                  <Clock className="h-4 w-4 text-orange-600 dark:text-orange-400" />
                  <AlertDescription className="text-orange-800 dark:text-orange-300">
                    <strong>Live Results:</strong> These elections are currently active. Results shown are preliminary and will be finalized when voting ends.
                  </AlertDescription>
                </Alert>
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                  {activeElections.map((election) => (
                    <ElectionResultCard key={election.id} election={election} isLive />
                  ))}
                </div>
              </>
            )}
          </TabsContent>

          <TabsContent value="all" className="space-y-4 mt-6">
            {filteredElections.length === 0 ? (
              <Card className="dark:bg-gray-800 dark:border-gray-700">
                <CardContent className="p-12 text-center">
                  <Search className="h-12 w-12 text-gray-300 dark:text-gray-600 mx-auto mb-4" />
                  <h3 className="text-lg font-medium text-gray-900 dark:text-white mb-2">
                    No Results Found
                  </h3>
                  <p className="text-gray-500 dark:text-gray-400">
                    Try adjusting your search or filters
                  </p>
                </CardContent>
              </Card>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {filteredElections.map((election) => (
                  <ElectionResultCard
                    key={election.id}
                    election={election}
                    isLive={election.status === ElectionStatus.ACTIVE}
                  />
                ))}
              </div>
            )}
          </TabsContent>
        </Tabs>
      )}
    </div>
  )
}

// Election Result Card Component
interface ElectionResultCardProps {
  election: any
  isLive?: boolean
}

function ElectionResultCard({ election, isLive = false }: ElectionResultCardProps) {
  return (
    <Card className="dark:bg-gray-800 dark:border-gray-700 hover:shadow-lg transition-shadow">
      <CardHeader>
        <div className="flex items-start justify-between">
          <div className="flex-1">
            <CardTitle className="text-lg dark:text-white line-clamp-2">
              {election.title}
            </CardTitle>
            <CardDescription className="mt-1 dark:text-gray-400">
              {election.type}
            </CardDescription>
          </div>
          <Badge variant={election.status === ElectionStatus.COMPLETED ? "default" : "secondary"}>
            {isLive && <Clock className="h-3 w-3 mr-1 animate-pulse" />}
            {ELECTION_STATUS_LABELS[election.status as ElectionStatus]}
          </Badge>
        </div>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="space-y-2 text-sm">
          <div className="flex items-center justify-between">
            <span className="text-gray-600 dark:text-gray-400 flex items-center">
              <Calendar className="h-4 w-4 mr-2" />
              Ended
            </span>
            <span className="font-medium dark:text-white">
              {format(new Date(election.endDate), "MMM d, yyyy")}
            </span>
          </div>
          <div className="flex items-center justify-between">
            <span className="text-gray-600 dark:text-gray-400 flex items-center">
              <Users className="h-4 w-4 mr-2" />
              Positions
            </span>
            <span className="font-medium dark:text-white">
              {election.positions?.length || 0}
            </span>
          </div>
        </div>

        <div className="pt-4 border-t dark:border-gray-700">
          <Link href={`/results/${election.id}`}>
            <Button variant="default" className="w-full">
              <Eye className="h-4 w-4 mr-2" />
              View Results
              <ArrowRight className="h-4 w-4 ml-2" />
            </Button>
          </Link>
        </div>
      </CardContent>
    </Card>
  )
}
