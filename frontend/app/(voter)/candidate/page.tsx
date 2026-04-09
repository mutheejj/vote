"use client"

import React, { useState, useEffect } from "react"
import Link from "next/link"
import {
  FileText,
  Plus,
  Clock,
  CheckCircle,
  XCircle,
  AlertCircle,
  Eye,
  Edit,
  Trash2,
  Vote,
  Award,
  ChevronRight,
  Calendar,
  User,
  RefreshCw,
  AlertTriangle
} from "lucide-react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"
import { Textarea } from "@/components/ui/textarea"
import { Label } from "@/components/ui/label"
import { useAuth } from "@/lib/hooks/useAuth"
import { useElections } from "@/lib/hooks/useElections"
import { getCandidatesByElection, withdrawCandidacy } from "@/lib/api/candidates"
import { Candidate } from "@/lib/types"
import { CandidateStatus } from "@/lib/enums"
import { cn } from "@/lib/utils/cn"
import { format } from "date-fns"

const statusConfig: Record<CandidateStatus, { label: string; color: string; icon: React.ComponentType<{ className?: string }> }> = {
  [CandidateStatus.PENDING]: {
    label: "Pending Review",
    color: "bg-amber-100 text-amber-800 dark:bg-amber-900/30 dark:text-amber-300",
    icon: Clock,
  },
  [CandidateStatus.APPROVED]: {
    label: "Approved",
    color: "bg-emerald-100 text-emerald-800 dark:bg-emerald-900/30 dark:text-emerald-300",
    icon: CheckCircle,
  },
  [CandidateStatus.REJECTED]: {
    label: "Rejected",
    color: "bg-red-100 text-red-800 dark:bg-red-900/30 dark:text-red-300",
    icon: XCircle,
  },
  [CandidateStatus.DISQUALIFIED]: {
    label: "Disqualified",
    color: "bg-red-100 text-red-800 dark:bg-red-900/30 dark:text-red-300",
    icon: AlertCircle,
  },
  [CandidateStatus.WITHDRAWN]: {
    label: "Withdrawn",
    color: "bg-gray-100 text-gray-600 dark:bg-gray-800 dark:text-gray-400",
    icon: AlertTriangle,
  },
}

export default function CandidatePage() {
  const { user } = useAuth()
  const { elections, isLoading: electionsLoading } = useElections({ autoFetch: true })
  const [myCandidacies, setMyCandidacies] = useState<Candidate[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [isRefreshing, setIsRefreshing] = useState(false)
  const [withdrawDialog, setWithdrawDialog] = useState<{ open: boolean; candidate: Candidate | null }>({ open: false, candidate: null })
  const [withdrawReason, setWithdrawReason] = useState("")
  const [isWithdrawing, setIsWithdrawing] = useState(false)

  const fetchMyCandidacies = async () => {
    if (!elections || elections.length === 0) return
    setIsLoading(true)
    try {
      const allCandidacies: Candidate[] = []
      for (const election of elections) {
        try {
          const response = await getCandidatesByElection(election.id)
          const candidates = response.data?.data?.candidates || []
          const mine = candidates.filter((c: Candidate) => c.userId === user?.id)
          allCandidacies.push(...mine)
        } catch {
          // silent
        }
      }
      setMyCandidacies(allCandidacies)
    } finally {
      setIsLoading(false)
    }
  }

  useEffect(() => {
    if (!electionsLoading) {
      fetchMyCandidacies()
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [electionsLoading, elections?.length])

  const handleRefresh = async () => {
    setIsRefreshing(true)
    await fetchMyCandidacies()
    setIsRefreshing(false)
  }

  const handleWithdraw = async () => {
    if (!withdrawDialog.candidate || !withdrawReason.trim()) return
    setIsWithdrawing(true)
    try {
      await withdrawCandidacy(withdrawDialog.candidate.id, withdrawReason)
      setWithdrawDialog({ open: false, candidate: null })
      setWithdrawReason("")
      await fetchMyCandidacies()
    } catch {
      // handle error
    } finally {
      setIsWithdrawing(false)
    }
  }

  const openWithdrawDialog = (candidate: Candidate) => {
    setWithdrawDialog({ open: true, candidate })
    setWithdrawReason("")
  }

  const stats = {
    total: myCandidacies.length,
    approved: myCandidacies.filter(c => c.status === CandidateStatus.APPROVED).length,
    pending: myCandidacies.filter(c => c.status === CandidateStatus.PENDING).length,
    rejected: myCandidacies.filter(c => c.status === CandidateStatus.REJECTED).length,
  }

  return (
    <div className="space-y-6">
      {/* Page Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-gray-900 dark:text-white">My Applications</h1>
          <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">
            Manage your candidacy applications for elections
          </p>
        </div>
        <div className="flex items-center gap-2">
          <Button
            variant="outline"
            size="sm"
            onClick={handleRefresh}
            disabled={isRefreshing}
            className="border-sage-200 dark:border-sage-800"
          >
            <RefreshCw className={cn("h-4 w-4 mr-2", isRefreshing && "animate-spin")} />
            Refresh
          </Button>
          <Link href="/register/candidate">
            <Button size="sm" className="bg-gradient-to-r from-sage-600 to-emerald-600 hover:from-sage-700 hover:to-emerald-700 text-white">
              <Plus className="h-4 w-4 mr-2" />
              Apply for Election
            </Button>
          </Link>
        </div>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        {[
          { label: "Total Applications", value: stats.total, icon: FileText, color: "text-sage-600", bg: "bg-sage-50 dark:bg-sage-900/20" },
          { label: "Approved", value: stats.approved, icon: CheckCircle, color: "text-emerald-600", bg: "bg-emerald-50 dark:bg-emerald-900/20" },
          { label: "Pending Review", value: stats.pending, icon: Clock, color: "text-amber-600", bg: "bg-amber-50 dark:bg-amber-900/20" },
          { label: "Rejected", value: stats.rejected, icon: XCircle, color: "text-red-600", bg: "bg-red-50 dark:bg-red-900/20" },
        ].map((stat, i) => (
          <Card key={i} className="border-0 shadow-sm">
            <CardContent className="p-4">
              <div className="flex items-center gap-3">
                <div className={cn("p-2 rounded-lg", stat.bg)}>
                  <stat.icon className={cn("h-5 w-5", stat.color)} />
                </div>
                <div>
                  <p className="text-2xl font-bold text-gray-900 dark:text-white">{stat.value}</p>
                  <p className="text-xs text-gray-500 dark:text-gray-400">{stat.label}</p>
                </div>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      {/* Applications List */}
      <Card className="border-0 shadow-sm">
        <CardHeader className="pb-4">
          <CardTitle className="text-lg">Candidacy Applications</CardTitle>
          <CardDescription>All your election candidacy submissions</CardDescription>
        </CardHeader>
        <CardContent>
          {isLoading || electionsLoading ? (
            <div className="space-y-4">
              {[1, 2, 3].map(i => (
                <div key={i} className="animate-pulse rounded-xl bg-gray-100 dark:bg-gray-800 h-24" />
              ))}
            </div>
          ) : myCandidacies.length === 0 ? (
            <div className="text-center py-16">
              <div className="inline-flex items-center justify-center w-16 h-16 bg-sage-50 dark:bg-sage-900/20 rounded-full mb-4">
                <Vote className="h-8 w-8 text-sage-500" />
              </div>
              <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-2">No applications yet</h3>
              <p className="text-sm text-gray-500 dark:text-gray-400 mb-6 max-w-sm mx-auto">
                You haven't applied for any election positions yet. Browse open elections to get started.
              </p>
              <Link href="/elections">
                <Button className="bg-gradient-to-r from-sage-600 to-emerald-600 hover:from-sage-700 hover:to-emerald-700 text-white">
                  <Plus className="h-4 w-4 mr-2" />
                  Browse Elections
                </Button>
              </Link>
            </div>
          ) : (
            <div className="space-y-4">
              {myCandidacies.map((candidate) => {
                const status = statusConfig[candidate.status as CandidateStatus] || statusConfig[CandidateStatus.PENDING]
                const StatusIcon = status.icon
                return (
                  <div
                    key={candidate.id}
                    className="flex flex-col sm:flex-row sm:items-center justify-between p-4 rounded-xl border border-gray-100 dark:border-gray-800 hover:border-sage-200 dark:hover:border-sage-800 hover:bg-sage-50/30 dark:hover:bg-sage-900/10 transition-all gap-4"
                  >
                    <div className="flex items-start gap-4">
                      <div className="flex-shrink-0 h-10 w-10 bg-gradient-to-br from-sage-100 to-emerald-100 dark:from-sage-900/40 dark:to-emerald-900/40 rounded-lg flex items-center justify-center">
                        <Award className="h-5 w-5 text-sage-600 dark:text-sage-400" />
                      </div>
                      <div className="min-w-0">
                        <p className="font-semibold text-gray-900 dark:text-white text-sm">
                          {(candidate as any).position?.title || "Position"}
                        </p>
                        <p className="text-xs text-gray-500 dark:text-gray-400 mt-0.5">
                          {(candidate as any).election?.title || "Election"}
                        </p>
                        {candidate.createdAt && (
                          <div className="flex items-center gap-1 mt-1">
                            <Calendar className="h-3 w-3 text-gray-400" />
                            <p className="text-xs text-gray-400">
                              Applied {format(new Date(candidate.createdAt), "MMM d, yyyy")}
                            </p>
                          </div>
                        )}
                      </div>
                    </div>

                    <div className="flex items-center gap-3 flex-shrink-0">
                      <Badge className={cn("text-xs font-medium border-0", status.color)}>
                        <StatusIcon className="h-3 w-3 mr-1" />
                        {status.label}
                      </Badge>

                      <div className="flex items-center gap-2">
                        <Button variant="outline" size="sm" className="h-8 w-8 p-0 border-sage-200 dark:border-sage-800">
                          <Eye className="h-3.5 w-3.5" />
                        </Button>
                        {candidate.status === CandidateStatus.PENDING && (
                          <Button
                            variant="outline"
                            size="sm"
                            className="h-8 text-xs border-red-200 text-red-600 hover:bg-red-50 dark:border-red-800 dark:text-red-400"
                            onClick={() => openWithdrawDialog(candidate)}
                          >
                            Withdraw
                          </Button>
                        )}
                      </div>
                    </div>
                  </div>
                )
              })}
            </div>
          )}
        </CardContent>
      </Card>

      {/* How it works */}
      <Card className="border-0 shadow-sm bg-gradient-to-br from-sage-50 to-emerald-50 dark:from-sage-900/20 dark:to-emerald-900/20">
        <CardHeader>
          <CardTitle className="text-base">How Candidacy Works</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            {[
              { step: "1", title: "Apply", desc: "Submit your candidacy for an open election position with your manifesto.", icon: FileText },
              { step: "2", title: "Review", desc: "Election officials review your application and check eligibility.", icon: Eye },
              { step: "3", title: "Campaign", desc: "Once approved, your profile is visible to voters during the election.", icon: Award },
            ].map((item) => (
              <div key={item.step} className="flex items-start gap-3">
                <div className="flex-shrink-0 h-8 w-8 bg-gradient-to-br from-sage-600 to-emerald-600 rounded-full flex items-center justify-center text-white text-sm font-bold">
                  {item.step}
                </div>
                <div>
                  <p className="font-semibold text-sm text-gray-900 dark:text-white">{item.title}</p>
                  <p className="text-xs text-gray-500 dark:text-gray-400 mt-0.5">{item.desc}</p>
                </div>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>

      {/* Withdraw Dialog */}
      <Dialog open={withdrawDialog.open} onOpenChange={(open) => setWithdrawDialog({ open, candidate: open ? withdrawDialog.candidate : null })}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Withdraw Candidacy</DialogTitle>
            <DialogDescription>
              Are you sure you want to withdraw your application? This action cannot be undone.
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-3">
            <Label htmlFor="reason">Reason for withdrawal <span className="text-red-500">*</span></Label>
            <Textarea
              id="reason"
              placeholder="Please provide a reason for withdrawing your application..."
              value={withdrawReason}
              onChange={(e) => setWithdrawReason(e.target.value)}
              rows={4}
            />
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setWithdrawDialog({ open: false, candidate: null })}>
              Cancel
            </Button>
            <Button
              variant="destructive"
              onClick={handleWithdraw}
              disabled={!withdrawReason.trim() || isWithdrawing}
            >
              {isWithdrawing ? "Withdrawing..." : "Confirm Withdrawal"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  )
}
