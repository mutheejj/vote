// frontend/app/admin/invitations/page.tsx
"use client"

import React, { useState, useEffect } from 'react'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Badge } from '@/components/ui/badge'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu'
import { Label } from '@/components/ui/label'
import { Alert, AlertDescription } from '@/components/ui/alert'
import {
  Shield,
  Search,
  Plus,
  MoreHorizontal,
  Eye,
  Mail,
  Ban,
  CheckCircle,
  XCircle,
  Clock,
  AlertCircle,
  Loader2,
  Users,
  UserCheck,
  UserX,
  RefreshCw,
  Copy
} from 'lucide-react'
import { useAuth } from '@/lib/hooks/useAuth'
import { useNotifications } from '@/lib/hooks/useNotifications'
import { cn } from '@/lib/utils/cn'
import { NotificationType } from '@/lib/enums'
import formatters from '@/lib/utils/formatters'
import {
  getAllInvitations,
  createInvitation,
  resendInvitation,
  revokeInvitation,
  getInvitationStats,
  AdminInvitation,
  CreateInvitationRequest
} from '@/lib/api/adminInvitations'

export default function AdminInvitationsPage() {
  const { user } = useAuth()
  const { addNotification } = useNotifications()
  const queryClient = useQueryClient()

  const [filteredInvitations, setFilteredInvitations] = useState<AdminInvitation[]>([])
  const [searchTerm, setSearchTerm] = useState('')
  const [statusFilter, setStatusFilter] = useState<string>('all')
  const [roleFilter, setRoleFilter] = useState<string>('all')

  const [selectedInvitation, setSelectedInvitation] = useState<AdminInvitation | null>(null)
  const [isViewDialogOpen, setIsViewDialogOpen] = useState(false)
  const [isCreateDialogOpen, setIsCreateDialogOpen] = useState(false)

  const [createFormData, setCreateFormData] = useState<CreateInvitationRequest>({
    email: '',
    role: 'MODERATOR',
    expiresInDays: 7
  })

  // Fetch invitation statistics
  const { data: statsData } = useQuery({
    queryKey: ['invitation-stats'],
    queryFn: async () => {
      const response = await getInvitationStats()
      return response.data
    }
  })

  const stats = statsData?.data

  // Fetch all invitations
  const { data: invitationsData, isLoading, error, refetch } = useQuery({
    queryKey: ['admin-invitations', statusFilter, roleFilter],
    queryFn: async () => {
      const params: any = {}
      if (statusFilter !== 'all') params.status = statusFilter
      if (roleFilter !== 'all') params.role = roleFilter

      const response = await getAllInvitations(params)
      return response.data
    }
  })

  const invitations = invitationsData?.data?.data || []

  // Filter invitations based on search
  useEffect(() => {
    let filtered = invitations

    if (searchTerm) {
      filtered = filtered.filter(inv =>
        inv.email.toLowerCase().includes(searchTerm.toLowerCase()) ||
        inv.inviter.firstName.toLowerCase().includes(searchTerm.toLowerCase()) ||
        inv.inviter.lastName.toLowerCase().includes(searchTerm.toLowerCase())
      )
    }

    setFilteredInvitations(filtered)
  }, [invitations, searchTerm])

  // Mutation for creating invitation
  const createMutation = useMutation({
    mutationFn: (data: CreateInvitationRequest) => createInvitation(data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['admin-invitations'] })
      queryClient.invalidateQueries({ queryKey: ['invitation-stats'] })
      addNotification({
        type: NotificationType.SUCCESS,
        title: 'Success',
        message: 'Invitation sent successfully',
      })
      setIsCreateDialogOpen(false)
      setCreateFormData({ email: '', role: 'MODERATOR', expiresInDays: 7 })
    },
    onError: (error: any) => {
      addNotification({
        type: NotificationType.ERROR,
        title: 'Error',
        message: error.response?.data?.message || 'Failed to send invitation',
      })
    }
  })

  // Mutation for resending invitation
  const resendMutation = useMutation({
    mutationFn: (id: string) => resendInvitation(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['admin-invitations'] })
      addNotification({
        type: NotificationType.SUCCESS,
        title: 'Success',
        message: 'Invitation resent successfully',
      })
    },
    onError: (error: any) => {
      addNotification({
        type: NotificationType.ERROR,
        title: 'Error',
        message: error.response?.data?.message || 'Failed to resend invitation',
      })
    }
  })

  // Mutation for revoking invitation
  const revokeMutation = useMutation({
    mutationFn: (id: string) => revokeInvitation(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['admin-invitations'] })
      queryClient.invalidateQueries({ queryKey: ['invitation-stats'] })
      addNotification({
        type: NotificationType.SUCCESS,
        title: 'Success',
        message: 'Invitation revoked successfully',
      })
    },
    onError: (error: any) => {
      addNotification({
        type: NotificationType.ERROR,
        title: 'Error',
        message: error.response?.data?.message || 'Failed to revoke invitation',
      })
    }
  })

  const handleViewInvitation = (invitation: AdminInvitation) => {
    setSelectedInvitation(invitation)
    setIsViewDialogOpen(true)
  }

  const handleCreateInvitation = () => {
    if (!createFormData.email.trim()) {
      addNotification({
        type: NotificationType.ERROR,
        title: 'Error',
        message: 'Please provide an email address',
      })
      return
    }

    createMutation.mutate(createFormData)
  }

  const handleResendInvitation = (id: string) => {
    resendMutation.mutate(id)
  }

  const handleRevokeInvitation = (id: string) => {
    revokeMutation.mutate(id)
  }

  const handleCopyInvitationLink = (token: string) => {
    const link = `${window.location.origin}/register/admin?token=${token}`
    navigator.clipboard.writeText(link)
    addNotification({
      type: NotificationType.SUCCESS,
      title: 'Copied',
      message: 'Invitation link copied to clipboard',
    })
  }

  const getStatusBadge = (invitation: AdminInvitation) => {
    if (invitation.revokedAt) {
      return (
        <Badge variant="secondary" className="bg-red-100 text-red-800">
          <Ban className="h-3 w-3 mr-1" />
          Revoked
        </Badge>
      )
    }
    if (invitation.used) {
      return (
        <Badge variant="secondary" className="bg-green-100 text-green-800">
          <CheckCircle className="h-3 w-3 mr-1" />
          Used
        </Badge>
      )
    }
    const isExpired = new Date(invitation.expiresAt) < new Date()
    if (isExpired) {
      return (
        <Badge variant="secondary" className="bg-gray-100 text-gray-800">
          <Clock className="h-3 w-3 mr-1" />
          Expired
        </Badge>
      )
    }
    return (
      <Badge variant="secondary" className="bg-yellow-100 text-yellow-800">
        <Clock className="h-3 w-3 mr-1" />
        Pending
      </Badge>
    )
  }

  const getRoleBadgeColor = (role: string) => {
    return role === 'ADMIN' ? 'bg-sage-100 text-sage-800' : 'bg-blue-100 text-blue-800'
  }

  const handleRefresh = () => {
    refetch()
    addNotification({
      type: NotificationType.SUCCESS,
      title: 'Refreshed',
      message: 'Invitations data updated'
    })
  }

  if (error) {
    return (
      <div className="space-y-8">
        <div className="flex justify-between items-center">
          <div>
            <h1 className="text-3xl font-bold tracking-tight">Admin Invitations</h1>
            <p className="text-muted-foreground mt-2">
              Manage admin and moderator invitations
            </p>
          </div>
        </div>
        <Alert variant="destructive">
          <AlertCircle className="h-4 w-4" />
          <AlertDescription>
            {(error as any)?.response?.data?.message || 'Failed to load invitations. Please try again later.'}
          </AlertDescription>
        </Alert>
      </div>
    )
  }

  // Check if user is SUPER_ADMIN
  const isSuperAdmin = user?.role === 'SUPER_ADMIN'

  return (
    <div className="space-y-8">
      {/* Header */}
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Admin Invitations</h1>
          <p className="text-muted-foreground mt-2">
            Manage admin and moderator invitations for system access
          </p>
        </div>
        <div className="flex gap-2">
          <Button
            variant="outline"
            size="sm"
            onClick={handleRefresh}
            disabled={isLoading}
          >
            <RefreshCw className={cn("h-4 w-4 mr-2", isLoading && "animate-spin")} />
            Refresh
          </Button>
          {isSuperAdmin && (
            <Button onClick={() => setIsCreateDialogOpen(true)}>
              <Plus className="h-4 w-4 mr-2" />
              Send Invitation
            </Button>
          )}
        </div>
      </div>

      {/* Statistics Cards */}
      {stats && (
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-5">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Total Invitations</CardTitle>
              <Mail className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{stats.total}</div>
              <p className="text-xs text-muted-foreground">All time invitations</p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Pending</CardTitle>
              <Clock className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{stats.pending}</div>
              <p className="text-xs text-muted-foreground">Awaiting acceptance</p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Used</CardTitle>
              <CheckCircle className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{stats.used}</div>
              <p className="text-xs text-muted-foreground">Completed signup</p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Expired</CardTitle>
              <XCircle className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{stats.expired}</div>
              <p className="text-xs text-muted-foreground">Time expired</p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Revoked</CardTitle>
              <Ban className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{stats.revoked}</div>
              <p className="text-xs text-muted-foreground">Cancelled</p>
            </CardContent>
          </Card>
        </div>
      )}

      {/* Filters and Search */}
      <Card>
        <CardHeader>
          <CardTitle>Invitation Directory</CardTitle>
          <CardDescription>
            Search and filter admin invitations by various criteria
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="flex flex-col sm:flex-row gap-4 mb-6">
            <div className="flex-1">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-4 w-4" />
                <Input
                  placeholder="Search by email or inviter name..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="pl-10"
                />
              </div>
            </div>
            <Select value={statusFilter} onValueChange={setStatusFilter}>
              <SelectTrigger className="w-full sm:w-[160px]">
                <SelectValue placeholder="Status" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Status</SelectItem>
                <SelectItem value="pending">Pending</SelectItem>
                <SelectItem value="used">Used</SelectItem>
                <SelectItem value="expired">Expired</SelectItem>
                <SelectItem value="revoked">Revoked</SelectItem>
              </SelectContent>
            </Select>
            <Select value={roleFilter} onValueChange={setRoleFilter}>
              <SelectTrigger className="w-full sm:w-[160px]">
                <SelectValue placeholder="Role" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Roles</SelectItem>
                <SelectItem value="ADMIN">Admin</SelectItem>
                <SelectItem value="MODERATOR">Moderator</SelectItem>
              </SelectContent>
            </Select>
          </div>

          {/* Invitations Table */}
          <div className="rounded-md border">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Email</TableHead>
                  <TableHead>Role</TableHead>
                  <TableHead>Invited By</TableHead>
                  <TableHead>Created</TableHead>
                  <TableHead>Expires</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead className="text-right">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {isLoading ? (
                  <TableRow>
                    <TableCell colSpan={7} className="text-center py-8">
                      <div className="flex items-center justify-center space-x-2">
                        <Loader2 className="h-4 w-4 animate-spin" />
                        <span>Loading invitations...</span>
                      </div>
                    </TableCell>
                  </TableRow>
                ) : filteredInvitations.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={7} className="text-center py-8">
                      <Mail className="h-12 w-12 text-gray-400 mx-auto mb-4" />
                      <h3 className="text-lg font-medium text-gray-900 mb-2">No invitations found</h3>
                      <p className="text-gray-500 mb-4">
                        Try adjusting your search criteria or filters.
                      </p>
                      {isSuperAdmin && (
                        <Button onClick={() => setIsCreateDialogOpen(true)}>
                          <Plus className="h-4 w-4 mr-2" />
                          Send First Invitation
                        </Button>
                      )}
                    </TableCell>
                  </TableRow>
                ) : (
                  filteredInvitations.map((invitation) => (
                    <TableRow key={invitation.id}>
                      <TableCell>
                        <div className="font-medium">{invitation.email}</div>
                      </TableCell>
                      <TableCell>
                        <Badge
                          variant="secondary"
                          className={cn(getRoleBadgeColor(invitation.role))}
                        >
                          {invitation.role}
                        </Badge>
                      </TableCell>
                      <TableCell>
                        <div className="text-sm">
                          {invitation.inviter.firstName} {invitation.inviter.lastName}
                        </div>
                      </TableCell>
                      <TableCell>
                        <div className="text-sm text-muted-foreground">
                          {formatters.formatDate(invitation.createdAt)}
                        </div>
                      </TableCell>
                      <TableCell>
                        <div className="text-sm text-muted-foreground">
                          {formatters.formatDate(invitation.expiresAt)}
                        </div>
                      </TableCell>
                      <TableCell>
                        {getStatusBadge(invitation)}
                      </TableCell>
                      <TableCell className="text-right">
                        <DropdownMenu>
                          <DropdownMenuTrigger asChild>
                            <Button variant="ghost" className="h-8 w-8 p-0">
                              <MoreHorizontal className="h-4 w-4" />
                            </Button>
                          </DropdownMenuTrigger>
                          <DropdownMenuContent align="end">
                            <DropdownMenuLabel>Actions</DropdownMenuLabel>
                            <DropdownMenuItem onClick={() => handleViewInvitation(invitation)}>
                              <Eye className="mr-2 h-4 w-4" />
                              View Details
                            </DropdownMenuItem>
                            <DropdownMenuItem onClick={() => handleCopyInvitationLink(invitation.invitationToken)}>
                              <Copy className="mr-2 h-4 w-4" />
                              Copy Link
                            </DropdownMenuItem>
                            {!invitation.used && !invitation.revokedAt && (
                              <>
                                <DropdownMenuSeparator />
                                <DropdownMenuItem onClick={() => handleResendInvitation(invitation.id)}>
                                  <Mail className="mr-2 h-4 w-4" />
                                  Resend Email
                                </DropdownMenuItem>
                                {isSuperAdmin && (
                                  <DropdownMenuItem
                                    onClick={() => handleRevokeInvitation(invitation.id)}
                                    className="text-red-600"
                                  >
                                    <Ban className="mr-2 h-4 w-4" />
                                    Revoke
                                  </DropdownMenuItem>
                                )}
                              </>
                            )}
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

      {/* Create Invitation Dialog */}
      <Dialog open={isCreateDialogOpen} onOpenChange={setIsCreateDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Send Admin Invitation</DialogTitle>
            <DialogDescription>
              Invite a new administrator or moderator to the system. They will receive an email with registration instructions.
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4">
            <div>
              <Label htmlFor="email">Email Address *</Label>
              <Input
                id="email"
                type="email"
                value={createFormData.email}
                onChange={(e) => setCreateFormData({ ...createFormData, email: e.target.value })}
                placeholder="admin@example.com"
                className="mt-1"
              />
            </div>
            <div>
              <Label htmlFor="role">Role *</Label>
              <Select
                value={createFormData.role}
                onValueChange={(value: 'ADMIN' | 'MODERATOR') =>
                  setCreateFormData({ ...createFormData, role: value })
                }
              >
                <SelectTrigger className="mt-1">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="MODERATOR">Moderator</SelectItem>
                  <SelectItem value="ADMIN">Administrator</SelectItem>
                </SelectContent>
              </Select>
              <p className="text-xs text-muted-foreground mt-1">
                Moderators can manage elections. Admins have full system access.
              </p>
            </div>
            <div>
              <Label htmlFor="expiresInDays">Expires In (Days) *</Label>
              <Input
                id="expiresInDays"
                type="number"
                min={1}
                max={30}
                value={createFormData.expiresInDays}
                onChange={(e) => setCreateFormData({ ...createFormData, expiresInDays: parseInt(e.target.value) })}
                className="mt-1"
              />
              <p className="text-xs text-muted-foreground mt-1">
                Link will be valid for this many days (1-30)
              </p>
            </div>
          </div>
          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => setIsCreateDialogOpen(false)}
              disabled={createMutation.isPending}
            >
              Cancel
            </Button>
            <Button
              onClick={handleCreateInvitation}
              disabled={createMutation.isPending}
            >
              {createMutation.isPending && (
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
              )}
              Send Invitation
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* View Invitation Dialog */}
      <Dialog open={isViewDialogOpen} onOpenChange={setIsViewDialogOpen}>
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle>Invitation Details</DialogTitle>
            <DialogDescription>
              Complete information about this admin invitation
            </DialogDescription>
          </DialogHeader>
          {selectedInvitation && (
            <div className="space-y-6">
              {/* Status Badge */}
              <div className="flex items-center justify-between">
                <h3 className="text-lg font-semibold">{selectedInvitation.email}</h3>
                {getStatusBadge(selectedInvitation)}
              </div>

              {/* Basic Info */}
              <div className="grid grid-cols-2 gap-4 bg-gray-50 p-4 rounded-lg">
                <div>
                  <h4 className="font-medium text-gray-900 text-sm">Role</h4>
                  <Badge className={cn(getRoleBadgeColor(selectedInvitation.role), "mt-1")}>
                    {selectedInvitation.role}
                  </Badge>
                </div>
                <div>
                  <h4 className="font-medium text-gray-900 text-sm">Invited By</h4>
                  <p className="text-gray-700 mt-1">
                    {selectedInvitation.inviter.firstName} {selectedInvitation.inviter.lastName}
                  </p>
                </div>
                <div>
                  <h4 className="font-medium text-gray-900 text-sm">Created At</h4>
                  <p className="text-gray-700 mt-1">{formatters.formatDateTime(selectedInvitation.createdAt)}</p>
                </div>
                <div>
                  <h4 className="font-medium text-gray-900 text-sm">Expires At</h4>
                  <p className="text-gray-700 mt-1">{formatters.formatDateTime(selectedInvitation.expiresAt)}</p>
                </div>
              </div>

              {/* Invitation Link */}
              <div>
                <h4 className="font-medium text-gray-900 mb-2">Invitation Link</h4>
                <div className="flex gap-2">
                  <Input
                    value={`${window.location.origin}/register/admin?token=${selectedInvitation.invitationToken}`}
                    readOnly
                    className="font-mono text-sm"
                  />
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => handleCopyInvitationLink(selectedInvitation.invitationToken)}
                  >
                    <Copy className="h-4 w-4" />
                  </Button>
                </div>
              </div>

              {/* Usage Info */}
              {selectedInvitation.used && (
                <div className="bg-green-50 p-4 rounded-lg">
                  <h4 className="font-medium text-green-900 mb-2">Registration Completed</h4>
                  <div className="space-y-2 text-sm">
                    <div className="flex justify-between">
                      <span className="text-green-700">Used At:</span>
                      <span className="font-medium text-green-900">
                        {selectedInvitation.usedAt && formatters.formatDateTime(selectedInvitation.usedAt)}
                      </span>
                    </div>
                    {selectedInvitation.usedByName && (
                      <div className="flex justify-between">
                        <span className="text-green-700">Registered As:</span>
                        <span className="font-medium text-green-900">{selectedInvitation.usedByName}</span>
                      </div>
                    )}
                  </div>
                </div>
              )}

              {/* Revocation Info */}
              {selectedInvitation.revokedAt && (
                <div className="bg-red-50 p-4 rounded-lg">
                  <h4 className="font-medium text-red-900 mb-2">Invitation Revoked</h4>
                  <div className="text-sm text-red-700">
                    Revoked at: {formatters.formatDateTime(selectedInvitation.revokedAt)}
                  </div>
                </div>
              )}

              {/* Actions */}
              {!selectedInvitation.used && !selectedInvitation.revokedAt && (
                <div className="flex gap-2 border-t pt-4">
                  <Button
                    variant="outline"
                    className="flex-1"
                    onClick={() => {
                      handleResendInvitation(selectedInvitation.id)
                      setIsViewDialogOpen(false)
                    }}
                  >
                    <Mail className="mr-2 h-4 w-4" />
                    Resend Email
                  </Button>
                  {isSuperAdmin && (
                    <Button
                      variant="destructive"
                      className="flex-1"
                      onClick={() => {
                        handleRevokeInvitation(selectedInvitation.id)
                        setIsViewDialogOpen(false)
                      }}
                    >
                      <Ban className="mr-2 h-4 w-4" />
                      Revoke
                    </Button>
                  )}
                </div>
              )}
            </div>
          )}
        </DialogContent>
      </Dialog>
    </div>
  )
}
