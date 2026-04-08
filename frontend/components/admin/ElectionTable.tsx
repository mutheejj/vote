"use client"

import React, { useState, useMemo } from "react"
import Link from "next/link"
import {
  MoreHorizontal,
  Eye,
  Edit,
  Trash2,
  Play,
  Pause,
  BarChart3,
  Users,
  Calendar,
  Search,
  Filter,
  Download,
  Plus
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
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog"
import  { Election } from "@/lib/types"
import { ElectionStatus, ElectionType, ELECTION_STATUS_LABELS, ELECTION_TYPE_LABELS } from "@/lib/enums"
import { cn } from "@/lib/utils/cn"
import { format } from "date-fns"

interface ElectionTableProps {
  elections: Election[]
  isLoading?: boolean
  onEdit?: (election: Election) => void
  onDelete?: (election: Election) => void
  onStatusChange?: (election: Election, status: ElectionStatus) => void
  showActions?: boolean
  variant?: "admin" | "voter"
  className?: string
}

export function ElectionTable({
  elections,
  isLoading = false,
  onEdit,
  onDelete,
  onStatusChange,
  showActions = true,
  variant = "admin",
  className
}: ElectionTableProps) {
  const [searchQuery, setSearchQuery] = useState("")
  const [statusFilter, setStatusFilter] = useState<string>("all")
  const [typeFilter, setTypeFilter] = useState<string>("all")
  const [deleteElection, setDeleteElection] = useState<Election | null>(null)

  const filteredElections = useMemo(() => {
    if (!elections) return []

    return elections.filter((election) => {
      const matchesSearch = election.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
                          election.description.toLowerCase().includes(searchQuery.toLowerCase())

      const matchesStatus = statusFilter === "all" || election.status === statusFilter
      const matchesType = typeFilter === "all" || election.type === typeFilter

      return matchesSearch && matchesStatus && matchesType
    })
  }, [elections, searchQuery, statusFilter, typeFilter])

  const getStatusVariant = (status: ElectionStatus) => {
    switch (status) {
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

  const getTypeVariant = (type: ElectionType) => {
    switch (type) {
      case ElectionType.PRESIDENTIAL:
        return "default"
      case ElectionType.FACULTY:
        return "info"
      case ElectionType.DEPARTMENTAL:
        return "warning"
      case ElectionType.CLUB:
        return "secondary"
      default:
        return "outline"
    }
  }

  const canChangeStatus = (election: Election, newStatus: ElectionStatus) => {
    const current = election.status
    const validTransitions: Record<ElectionStatus, ElectionStatus[]> = {
      [ElectionStatus.SCHEDULED]: [ElectionStatus.ACTIVE, ElectionStatus.CANCELLED],
      [ElectionStatus.ACTIVE]: [ElectionStatus.COMPLETED, ElectionStatus.CANCELLED],
      [ElectionStatus.COMPLETED]: [],
      [ElectionStatus.CANCELLED]: [ElectionStatus.SCHEDULED],
      [ElectionStatus.DRAFT]: [ElectionStatus.SCHEDULED],
      [ElectionStatus.PAUSED]: [ElectionStatus.ACTIVE, ElectionStatus.CANCELLED],
      [ElectionStatus.ARCHIVED]: []
    }

    return validTransitions[current]?.includes(newStatus) || false
  }

  const handleStatusChange = (election: Election, newStatus: ElectionStatus) => {
    if (canChangeStatus(election, newStatus) && onStatusChange) {
      onStatusChange(election, newStatus)
    }
  }

  const handleDelete = (election: Election) => {
    setDeleteElection(election)
  }

  const confirmDelete = () => {
    if (deleteElection && onDelete) {
      onDelete(deleteElection)
      setDeleteElection(null)
    }
  }

  if (isLoading) {
    return (
      <Card className={className}>
        <CardContent className="p-6">
          <div className="space-y-4">
            {[...Array(5)].map((_, i) => (
              <div key={i} className="h-12 bg-gray-200 rounded animate-pulse"></div>
            ))}
          </div>
        </CardContent>
      </Card>
    )
  }

  return (
    <div className={cn("space-y-4", className)}>
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
                  {(Object.values(ElectionStatus) as string[]).map((status: string) => (
                    <SelectItem key={status} value={status}>
                      {ELECTION_STATUS_LABELS[status as ElectionStatus]}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>

              <Select value={typeFilter} onValueChange={setTypeFilter}>
                <SelectTrigger className="w-40">
                  <SelectValue placeholder="All Types" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Types</SelectItem>
                  {(Object.values(ElectionType) as string[]).map((type: string) => (
                    <SelectItem key={type} value={type}>
                      {ELECTION_TYPE_LABELS[type as ElectionType]}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>

              {variant === "admin" && (
                <>
                  <Button variant="outline" size="sm">
                    <Download className="h-4 w-4 mr-2" />
                    Export
                  </Button>

                  <Button size="sm">
                    <Plus className="h-4 w-4 mr-2" />
                    New Election
                  </Button>
                </>
              )}
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Table */}
      <Card>
        <CardHeader>
          <CardTitle>Elections ({filteredElections.length})</CardTitle>
          <CardDescription>
            {variant === "admin"
              ? "Manage and monitor all elections"
              : "Browse available elections"}
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="rounded-md border">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Election</TableHead>
                  <TableHead>Type</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead>Timeline</TableHead>
                  <TableHead>Positions</TableHead>
                  {variant === "admin" && <TableHead>Votes</TableHead>}
                  {showActions && <TableHead className="w-[70px]">Actions</TableHead>}
                </TableRow>
              </TableHeader>
              <TableBody>
                {filteredElections.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={variant === "admin" ? 7 : 6} className="text-center py-8">
                      <div className="flex flex-col items-center space-y-2">
                        <Calendar className="h-8 w-8 text-gray-300" />
                        <p className="text-gray-500">No elections found</p>
                      </div>
                    </TableCell>
                  </TableRow>
                ) : (
                  filteredElections.map((election) => (
                    <TableRow key={election.id}>
                      <TableCell>
                        <div className="space-y-1">
                          <p className="font-medium">{election.title}</p>
                          <p className="text-sm text-gray-500 line-clamp-1">
                            {election.description}
                          </p>
                        </div>
                      </TableCell>

                      <TableCell>
                        <Badge variant={getTypeVariant(election.type) as any}>
                          {ELECTION_TYPE_LABELS[election.type]}
                        </Badge>
                      </TableCell>

                      <TableCell>
                        <Badge variant={getStatusVariant(election.status)}>
                          {ELECTION_STATUS_LABELS[election.status]}
                        </Badge>
                      </TableCell>

                      <TableCell>
                        <div className="space-y-1 text-sm">
                          <div className="flex items-center space-x-1 text-gray-600">
                            <Calendar className="h-3 w-3" />
                            <span>{format(new Date(election.startDate), "MMM d, yyyy")}</span>
                          </div>
                          <div className="text-gray-500">
                            to {format(new Date(election.endDate), "MMM d, yyyy")}
                          </div>
                        </div>
                      </TableCell>

                      <TableCell>
                        <div className="flex items-center space-x-1">
                          <Users className="h-4 w-4 text-gray-400" />
                          <span>{election.positions?.length || 0}</span>
                        </div>
                      </TableCell>

                      {variant === "admin" && (
                        <TableCell>
                          <div className="flex items-center space-x-1">
                            <BarChart3 className="h-4 w-4 text-gray-400" />
                            <span>{election.totalVotesCast || 0}</span>
                          </div>
                        </TableCell>
                      )}

                      {showActions && (
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

                              <DropdownMenuItem asChild>
                                <Link href={`/elections/${election.id}`}>
                                  <Eye className="h-4 w-4 mr-2" />
                                  View Details
                                </Link>
                              </DropdownMenuItem>

                              {election.status === ElectionStatus.COMPLETED && (
                                <DropdownMenuItem asChild>
                                  <Link href={`/results/${election.id}`}>
                                    <BarChart3 className="h-4 w-4 mr-2" />
                                    View Results
                                  </Link>
                                </DropdownMenuItem>
                              )}

                              {variant === "admin" && (
                                <>
                                  {onEdit && (
                                    <DropdownMenuItem onClick={() => onEdit(election)}>
                                      <Edit className="h-4 w-4 mr-2" />
                                      Edit
                                    </DropdownMenuItem>
                                  )}

                                  {onStatusChange && (
                                    <>
                                      <DropdownMenuSeparator />
                                      <DropdownMenuLabel>Change Status</DropdownMenuLabel>

                                      {canChangeStatus(election, ElectionStatus.ACTIVE) && (
                                        <DropdownMenuItem
                                          onClick={() => handleStatusChange(election, ElectionStatus.ACTIVE)}
                                        >
                                          <Play className="h-4 w-4 mr-2" />
                                          Start Election
                                        </DropdownMenuItem>
                                      )}

                                      {canChangeStatus(election, ElectionStatus.COMPLETED) && (
                                        <DropdownMenuItem
                                          onClick={() => handleStatusChange(election, ElectionStatus.COMPLETED)}
                                        >
                                          <Pause className="h-4 w-4 mr-2" />
                                          End Election
                                        </DropdownMenuItem>
                                      )}

                                      {canChangeStatus(election, ElectionStatus.CANCELLED) && (
                                        <DropdownMenuItem
                                          onClick={() => handleStatusChange(election, ElectionStatus.CANCELLED)}
                                          className="text-red-600"
                                        >
                                          <Trash2 className="h-4 w-4 mr-2" />
                                          Cancel Election
                                        </DropdownMenuItem>
                                      )}
                                    </>
                                  )}

                                  {onDelete && election.status !== ElectionStatus.ACTIVE && (
                                    <>
                                      <DropdownMenuSeparator />
                                      <DropdownMenuItem
                                        onClick={() => handleDelete(election)}
                                        className="text-red-600"
                                      >
                                        <Trash2 className="h-4 w-4 mr-2" />
                                        Delete
                                      </DropdownMenuItem>
                                    </>
                                  )}
                                </>
                              )}
                            </DropdownMenuContent>
                          </DropdownMenu>
                        </TableCell>
                      )}
                    </TableRow>
                  ))
                )}
              </TableBody>
            </Table>
          </div>
        </CardContent>
      </Card>

      {/* Delete Confirmation Dialog */}
      <AlertDialog open={!!deleteElection} onOpenChange={() => setDeleteElection(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete Election</AlertDialogTitle>
            <AlertDialogDescription>
              Are you sure you want to delete "{deleteElection?.title}"? This action cannot be undone.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction onClick={confirmDelete} className="bg-red-600 hover:bg-red-700">
              Delete
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  )
}

export default ElectionTable