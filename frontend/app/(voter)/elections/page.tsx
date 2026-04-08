"use client"

import React, { useState, useMemo } from "react"
import Link from "next/link"
import {
  Search,
  Filter,
  Calendar,
  Users,
  Clock,
  Vote,
  ChevronDown,
  SortAsc,
  SortDesc,
  Grid,
  List,
  Plus
} from "lucide-react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Badge } from "@/components/ui/badge"
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
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { ElectionCard } from "@/components/voter/ElectionCard"
import { useElections } from "@/lib/hooks/useElections"
import { Election } from "@/lib/types"
import { ElectionStatus, ElectionType } from "@/lib/enums"
import { cn } from "@/lib/utils/cn"
import { format } from "date-fns"

type ViewMode = "grid" | "list"
type SortOption = "title" | "startDate" | "endDate" | "created"
type SortDirection = "asc" | "desc"

export default function ElectionsPage() {
  const {
    elections,
    activeElections,
    eligibleElections,
    isLoading,
    error,
    fetchElections,
    fetchActiveElections,
    fetchEligibleElections
  } = useElections({ autoFetch: true })
  const [searchQuery, setSearchQuery] = useState("")
  const [statusFilter, setStatusFilter] = useState<string>("all")
  const [typeFilter, setTypeFilter] = useState<string>("all")
  const [sortBy, setSortBy] = useState<SortOption>("startDate")
  const [sortDirection, setSortDirection] = useState<SortDirection>("desc")
  const [viewMode, setViewMode] = useState<ViewMode>("grid")

  // Combine elections from different sources for voters
  const allElections = useMemo(() => {
    // Merge active, eligible, and regular elections, removing duplicates
    const electionsMap = new Map<string, any>()

    // Ensure all arrays have default values to prevent iteration errors
    const safeActiveElections = activeElections || []
    const safeEligibleElections = eligibleElections || []
    const safeElections = elections || []

    ;[...safeActiveElections, ...safeEligibleElections, ...safeElections].forEach(election => {
      if (!electionsMap.has(election.id)) {
        electionsMap.set(election.id, election)
      }
    })

    return Array.from(electionsMap.values())
  }, [elections, activeElections, eligibleElections])

  const filteredAndSortedElections = useMemo(() => {
    if (!allElections || allElections.length === 0) return []

    let filtered = allElections.filter((election) => {
      const matchesSearch = election.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
                          election.description.toLowerCase().includes(searchQuery.toLowerCase())

      const matchesStatus = statusFilter === "all" || election.status === statusFilter
      const matchesType = typeFilter === "all" || election.type === typeFilter

      return matchesSearch && matchesStatus && matchesType
    })

    // Sort elections
    filtered.sort((a, b) => {
      let aValue: any
      let bValue: any

      switch (sortBy) {
        case "title":
          aValue = a.title.toLowerCase()
          bValue = b.title.toLowerCase()
          break
        case "startDate":
          aValue = new Date(a.startDate)
          bValue = new Date(b.startDate)
          break
        case "endDate":
          aValue = new Date(a.endDate)
          bValue = new Date(b.endDate)
          break
        case "created":
          aValue = new Date(a.createdAt)
          bValue = new Date(b.createdAt)
          break
        default:
          return 0
      }

      if (aValue < bValue) return sortDirection === "asc" ? -1 : 1
      if (aValue > bValue) return sortDirection === "asc" ? 1 : -1
      return 0
    })

    return filtered
  }, [allElections, searchQuery, statusFilter, typeFilter, sortBy, sortDirection])

  const electionsByStatus = useMemo(() => {
    if (!allElections || allElections.length === 0) return { active: [], upcoming: [], completed: [] }

    const now = new Date()

    return {
      active: allElections.filter(e => {
        return e.status === ElectionStatus.ACTIVE &&
               now >= new Date(e.startDate) &&
               now <= new Date(e.endDate)
      }),
      upcoming: allElections.filter(e => {
        return e.status === ElectionStatus.SCHEDULED ||
               (e.status === ElectionStatus.DRAFT && new Date(e.startDate) > now)
      }),
      completed: allElections.filter(e => {
        return e.status === ElectionStatus.COMPLETED ||
               now > new Date(e.endDate)
      })
    }
  }, [allElections])

  const handleSort = (option: SortOption) => {
    if (sortBy === option) {
      setSortDirection(sortDirection === "asc" ? "desc" : "asc")
    } else {
      setSortBy(option)
      setSortDirection("asc")
    }
  }

  if (isLoading) {
    return (
      <div className="space-y-6">
        <div className="h-8 bg-gray-200 rounded animate-pulse"></div>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {[...Array(6)].map((_, i) => (
            <Card key={i} className="animate-pulse">
              <CardContent className="p-6">
                <div className="h-6 bg-gray-200 rounded mb-4"></div>
                <div className="h-4 bg-gray-200 rounded mb-2"></div>
                <div className="h-4 bg-gray-200 rounded mb-4"></div>
                <div className="h-8 bg-gray-200 rounded"></div>
              </CardContent>
            </Card>
          ))}
        </div>
      </div>
    )
  }

  if (error) {
    return (
      <div className="text-center py-12">
        <h2 className="text-2xl font-bold text-gray-900 mb-4">Failed to Load Elections</h2>
        <p className="text-gray-600 mb-6">There was an error loading the elections. Please try again.</p>
        <Button onClick={() => window.location.reload()}>Retry</Button>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">Elections</h1>
          <p className="text-gray-600">
            Browse and participate in university elections
          </p>
        </div>
        <div className="flex items-center space-x-2">
          <Badge variant="outline" className="text-sm">
            {filteredAndSortedElections.length} election(s)
          </Badge>
        </div>
      </div>

      {/* Quick Stats */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center space-x-2">
              <div className="p-2 bg-green-100 rounded-lg">
                <Vote className="h-4 w-4 text-green-600" />
              </div>
              <div>
                <p className="text-sm text-gray-600">Active Elections</p>
                <p className="text-xl font-bold">{electionsByStatus.active.length}</p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-4">
            <div className="flex items-center space-x-2">
              <div className="p-2 bg-blue-100 rounded-lg">
                <Calendar className="h-4 w-4 text-blue-600" />
              </div>
              <div>
                <p className="text-sm text-gray-600">Upcoming</p>
                <p className="text-xl font-bold">{electionsByStatus.upcoming.length}</p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-4">
            <div className="flex items-center space-x-2">
              <div className="p-2 bg-gray-100 rounded-lg">
                <Clock className="h-4 w-4 text-gray-600" />
              </div>
              <div>
                <p className="text-sm text-gray-600">Completed</p>
                <p className="text-xl font-bold">{electionsByStatus.completed.length}</p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Filters and Controls */}
      <Card>
        <CardContent className="p-4">
          <div className="flex flex-col lg:flex-row gap-4">
            {/* Search */}
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

            {/* Filters */}
            <div className="flex items-center space-x-2">
              <Select value={statusFilter} onValueChange={setStatusFilter}>
                <SelectTrigger className="w-32">
                  <SelectValue placeholder="Status" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Status</SelectItem>
                  <SelectItem value={ElectionStatus.ACTIVE}>Active</SelectItem>
                  <SelectItem value={ElectionStatus.SCHEDULED}>Upcoming</SelectItem>
                  <SelectItem value={ElectionStatus.COMPLETED}>Completed</SelectItem>
                </SelectContent>
              </Select>

              <Select value={typeFilter} onValueChange={setTypeFilter}>
                <SelectTrigger className="w-32">
                  <SelectValue placeholder="Type" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Types</SelectItem>
                  <SelectItem value={ElectionType.PRESIDENTIAL}>Presidential</SelectItem>
                  <SelectItem value={ElectionType.FACULTY}>Faculty</SelectItem>
                  <SelectItem value={ElectionType.DEPARTMENTAL}>Departmental</SelectItem>
                  <SelectItem value={ElectionType.CLUB}>Club</SelectItem>
                </SelectContent>
              </Select>

              {/* Sort */}
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
                  <DropdownMenuItem onClick={() => handleSort("title")}>
                    Title {sortBy === "title" && (sortDirection === "asc" ? "�" : "�")}
                  </DropdownMenuItem>
                  <DropdownMenuItem onClick={() => handleSort("startDate")}>
                    Start Date {sortBy === "startDate" && (sortDirection === "asc" ? "�" : "�")}
                  </DropdownMenuItem>
                  <DropdownMenuItem onClick={() => handleSort("endDate")}>
                    End Date {sortBy === "endDate" && (sortDirection === "asc" ? "�" : "�")}
                  </DropdownMenuItem>
                  <DropdownMenuItem onClick={() => handleSort("created")}>
                    Created {sortBy === "created" && (sortDirection === "asc" ? "�" : "�")}
                  </DropdownMenuItem>
                </DropdownMenuContent>
              </DropdownMenu>

              {/* View Mode */}
              <div className="flex border rounded-lg">
                <Button
                  variant={viewMode === "grid" ? "default" : "ghost"}
                  size="sm"
                  onClick={() => setViewMode("grid")}
                  className="rounded-r-none"
                >
                  <Grid className="h-4 w-4" />
                </Button>
                <Button
                  variant={viewMode === "list" ? "default" : "ghost"}
                  size="sm"
                  onClick={() => setViewMode("list")}
                  className="rounded-l-none"
                >
                  <List className="h-4 w-4" />
                </Button>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Elections Content */}
      <Tabs defaultValue="all" className="w-full">
        <TabsList className="grid w-full grid-cols-4">
          <TabsTrigger value="all">All Elections</TabsTrigger>
          <TabsTrigger value="active">Active ({electionsByStatus.active.length})</TabsTrigger>
          <TabsTrigger value="upcoming">Upcoming ({electionsByStatus.upcoming.length})</TabsTrigger>
          <TabsTrigger value="completed">Completed ({electionsByStatus.completed.length})</TabsTrigger>
        </TabsList>

        <TabsContent value="all" className="space-y-6">
          {filteredAndSortedElections.length === 0 ? (
            <div className="text-center py-12">
              <Vote className="h-12 w-12 text-gray-300 mx-auto mb-4" />
              <h3 className="text-lg font-medium text-gray-900 mb-2">No Elections Found</h3>
              <p className="text-gray-500 mb-4">
                {elections?.length === 0
                  ? "No elections are currently available."
                  : "Try adjusting your search criteria."}
              </p>
            </div>
          ) : (
            <div className={cn(
              viewMode === "grid"
                ? "grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6"
                : "space-y-4"
            )}>
              {filteredAndSortedElections.map((election) => (
                <ElectionCard
                  key={election.id}
                  election={election}
                  variant={viewMode === "list" ? "compact" : "default"}
                />
              ))}
            </div>
          )}
        </TabsContent>

        <TabsContent value="active" className="space-y-6">
          <div className={cn(
            viewMode === "grid"
              ? "grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6"
              : "space-y-4"
          )}>
            {electionsByStatus.active.map((election) => (
              <ElectionCard
                key={election.id}
                election={election}
                variant={viewMode === "list" ? "compact" : "default"}
              />
            ))}
          </div>
        </TabsContent>

        <TabsContent value="upcoming" className="space-y-6">
          <div className={cn(
            viewMode === "grid"
              ? "grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6"
              : "space-y-4"
          )}>
            {electionsByStatus.upcoming.map((election) => (
              <ElectionCard
                key={election.id}
                election={election}
                variant={viewMode === "list" ? "compact" : "default"}
              />
            ))}
          </div>
        </TabsContent>

        <TabsContent value="completed" className="space-y-6">
          <div className={cn(
            viewMode === "grid"
              ? "grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6"
              : "space-y-4"
          )}>
            {electionsByStatus.completed.map((election) => (
              <ElectionCard
                key={election.id}
                election={election}
                variant={viewMode === "list" ? "compact" : "default"}
              />
            ))}
          </div>
        </TabsContent>
      </Tabs>
    </div>
  )
}