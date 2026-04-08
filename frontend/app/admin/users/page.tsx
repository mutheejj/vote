"use client"

import React, { useState } from 'react'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import { Badge } from '@/components/ui/badge'
import {
  Alert,
  AlertDescription,
  AlertTitle,
} from '@/components/ui/alert'
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu'
import { useAuth } from '@/lib/hooks/useAuth'
import { useNotifications } from '@/lib/hooks/useNotifications'
import { LoadingSpinner } from '@/components/shared/LoadingSpinner'
import formatters from '@/lib/utils/formatters'
import { NotificationType } from '@/lib/enums'
import {
  Users,
  UserPlus,
  Shield,
  AlertCircle,
  MoreVertical,
  Mail,
  CheckCircle,
  XCircle,
  Clock,
  Crown,
  UserCog,
  Eye,
  Trash2,
  RefreshCw,
  Ban,
  UserCheck,
} from 'lucide-react'
import Link from 'next/link'
import { cn } from '@/lib/utils/cn'

interface AdminUser {
  id: string
  studentId: string
  email: string
  firstName: string
  lastName: string
  role: 'SUPER_ADMIN' | 'ADMIN' | 'MODERATOR'
  isActive: boolean
  isVerified: boolean
  lastLogin: string | null
  createdAt: string
}

interface AdminInvitation {
  id: string
  email: string
  role: 'ADMIN' | 'MODERATOR'
  invitedBy: string
  expiresAt: string
  used: boolean
  usedAt: string | null
  usedByName: string | null
  revokedAt: string | null
  createdAt: string
}

export default function AdminUsersPage() {
  const { user } = useAuth()
  const { addNotification } = useNotifications()
  const queryClient = useQueryClient()

  // Check if user is SUPER_ADMIN
  const isSuperAdmin = user?.role === 'SUPER_ADMIN'

  // State management
  const [showInviteDialog, setShowInviteDialog] = useState(false)
  const [showRevokeDialog, setShowRevokeDialog] = useState(false)
  const [selectedUser, setSelectedUser] = useState<AdminUser | null>(null)
  const [inviteEmail, setInviteEmail] = useState('')
  const [inviteRole, setInviteRole] = useState<'ADMIN' | 'MODERATOR'>('ADMIN')
  const [searchQuery, setSearchQuery] = useState('')
  const [roleFilter, setRoleFilter] = useState<string>('ALL')

  // Fetch admin users
  const { data: adminUsers, isLoading: loadingUsers } = useQuery({
    queryKey: ['admin-users'],
    queryFn: async (): Promise<AdminUser[]> => {
      // TODO: Replace with actual API call
      const response = await fetch('/api/admin/users?roles=SUPER_ADMIN,ADMIN,MODERATOR')
      if (!response.ok) throw new Error('Failed to fetch users')
      const result = await response.json()
      return result.data || []
    },
    enabled: isSuperAdmin,
  })

  // Fetch invitations
  const { data: invitations, isLoading: loadingInvitations } = useQuery({
    queryKey: ['admin-invitations'],
    queryFn: async (): Promise<AdminInvitation[]> => {
      // TODO: Replace with actual API call
      const response = await fetch('/api/admin/invitations')
      if (!response.ok) throw new Error('Failed to fetch invitations')
      const result = await response.json()
      return result.data || []
    },
    enabled: isSuperAdmin,
  })

  // Invite admin mutation
  const inviteMutation = useMutation({
    mutationFn: async (data: { email: string; role: string }) => {
      const response = await fetch('/api/admin/invitations', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(data),
      })
      if (!response.ok) throw new Error('Failed to send invitation')
      return response.json()
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['admin-invitations'] })
      addNotification({
        type: NotificationType.SUCCESS,
        title: 'Invitation Sent',
        message: `Invitation sent to ${inviteEmail}`,
      })
      setShowInviteDialog(false)
      setInviteEmail('')
      setInviteRole('ADMIN')
    },
    onError: (error: any) => {
      addNotification({
        type: NotificationType.ERROR,
        title: 'Invitation Failed',
        message: error.message || 'Failed to send invitation',
      })
    },
  })

  // Change role mutation
  const changeRoleMutation = useMutation({
    mutationFn: async (data: { userId: string; newRole: string }) => {
      const response = await fetch(`/api/admin/users/${data.userId}/role`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ role: data.newRole }),
      })
      if (!response.ok) throw new Error('Failed to change role')
      return response.json()
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['admin-users'] })
      addNotification({
        type: NotificationType.SUCCESS,
        title: 'Role Updated',
        message: 'User role has been updated successfully',
      })
    },
  })

  // Revoke access mutation
  const revokeAccessMutation = useMutation({
    mutationFn: async (userId: string) => {
      const response = await fetch(`/api/admin/users/${userId}/revoke`, {
        method: 'POST',
      })
      if (!response.ok) throw new Error('Failed to revoke access')
      return response.json()
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['admin-users'] })
      addNotification({
        type: NotificationType.SUCCESS,
        title: 'Access Revoked',
        message: 'User access has been revoked',
      })
      setShowRevokeDialog(false)
      setSelectedUser(null)
    },
  })

  if (!isSuperAdmin) {
    return (
      <div className="flex items-center justify-center min-h-[60vh]">
        <Alert variant="destructive" className="max-w-md">
          <AlertCircle className="h-4 w-4" />
          <AlertTitle>Access Denied</AlertTitle>
          <AlertDescription>
            This page is only accessible to Super Administrators.
          </AlertDescription>
        </Alert>
      </div>
    )
  }

  const filteredUsers = adminUsers?.filter((u) => {
    const matchesSearch =
      !searchQuery ||
      u.firstName.toLowerCase().includes(searchQuery.toLowerCase()) ||
      u.lastName.toLowerCase().includes(searchQuery.toLowerCase()) ||
      u.email.toLowerCase().includes(searchQuery.toLowerCase()) ||
      u.studentId.toLowerCase().includes(searchQuery.toLowerCase())

    const matchesRole = roleFilter === 'ALL' || u.role === roleFilter

    return matchesSearch && matchesRole
  })

  const pendingInvitations = invitations?.filter((inv) => !inv.used && !inv.revokedAt) || []
  const totalAdmins = adminUsers?.length || 0
  const activeAdmins = adminUsers?.filter((u) => u.isActive).length || 0

  const getRoleIcon = (role: string) => {
    switch (role) {
      case 'SUPER_ADMIN':
        return Crown
      case 'ADMIN':
        return Shield
      case 'MODERATOR':
        return UserCog
      default:
        return Users
    }
  }

  const getRoleBadgeVariant = (role: string) => {
    switch (role) {
      case 'SUPER_ADMIN':
        return 'destructive'
      case 'ADMIN':
        return 'default'
      case 'MODERATOR':
        return 'secondary'
      default:
        return 'outline'
    }
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Admin User Management</h1>
          <p className="text-muted-foreground mt-2">
            Manage administrator accounts, roles, and permissions
          </p>
        </div>
        <Button onClick={() => setShowInviteDialog(true)}>
          <UserPlus className="h-4 w-4 mr-2" />
          Invite Admin
        </Button>
      </div>

      {/* Stats Cards */}
      <div className="grid gap-4 md:grid-cols-3">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Admins</CardTitle>
            <Users className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{totalAdmins}</div>
            <p className="text-xs text-muted-foreground mt-1">
              {activeAdmins} active
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Pending Invitations</CardTitle>
            <Mail className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{pendingInvitations.length}</div>
            <p className="text-xs text-muted-foreground mt-1">
              Awaiting acceptance
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Super Admins</CardTitle>
            <Crown className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {adminUsers?.filter((u) => u.role === 'SUPER_ADMIN').length || 0}
            </div>
            <p className="text-xs text-muted-foreground mt-1">
              Full system access
            </p>
          </CardContent>
        </Card>
      </div>

      {/* Filters */}
      <Card>
        <CardHeader>
          <CardTitle>Admin Users</CardTitle>
          <CardDescription>View and manage all administrator accounts</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="flex gap-4 mb-6">
            <div className="flex-1">
              <Input
                placeholder="Search by name, email, or student ID..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
              />
            </div>
            <Select value={roleFilter} onValueChange={setRoleFilter}>
              <SelectTrigger className="w-[180px]">
                <SelectValue placeholder="Filter by role" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="ALL">All Roles</SelectItem>
                <SelectItem value="SUPER_ADMIN">Super Admin</SelectItem>
                <SelectItem value="ADMIN">Admin</SelectItem>
                <SelectItem value="MODERATOR">Moderator</SelectItem>
              </SelectContent>
            </Select>
          </div>

          {/* Users Table */}
          {loadingUsers ? (
            <div className="flex justify-center py-8">
              <LoadingSpinner />
            </div>
          ) : (
            <div className="rounded-md border">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>User</TableHead>
                    <TableHead>Role</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead>Last Login</TableHead>
                    <TableHead>Created</TableHead>
                    <TableHead className="text-right">Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {filteredUsers && filteredUsers.length > 0 ? (
                    filteredUsers.map((adminUser) => {
                      const RoleIcon = getRoleIcon(adminUser.role)
                      return (
                        <TableRow key={adminUser.id}>
                          <TableCell>
                            <div className="flex items-center gap-3">
                              <div className="w-10 h-10 rounded-full bg-gradient-to-br from-blue-500 to-sage-600 flex items-center justify-center text-white font-semibold">
                                {adminUser.firstName[0]}{adminUser.lastName[0]}
                              </div>
                              <div>
                                <div className="font-medium">
                                  {adminUser.firstName} {adminUser.lastName}
                                </div>
                                <div className="text-sm text-muted-foreground">
                                  {adminUser.email}
                                </div>
                                <div className="text-xs text-muted-foreground">
                                  {adminUser.studentId}
                                </div>
                              </div>
                            </div>
                          </TableCell>
                          <TableCell>
                            <Badge variant={getRoleBadgeVariant(adminUser.role)}>
                              <RoleIcon className="h-3 w-3 mr-1" />
                              {adminUser.role.replace('_', ' ')}
                            </Badge>
                          </TableCell>
                          <TableCell>
                            <div className="flex flex-col gap-1">
                              <Badge
                                variant={adminUser.isActive ? 'success' : 'destructive'}
                                className="w-fit"
                              >
                                {adminUser.isActive ? (
                                  <><CheckCircle className="h-3 w-3 mr-1" />Active</>
                                ) : (
                                  <><XCircle className="h-3 w-3 mr-1" />Inactive</>
                                )}
                              </Badge>
                              {adminUser.isVerified && (
                                <Badge variant="outline" className="w-fit text-xs">
                                  <UserCheck className="h-2.5 w-2.5 mr-1" />
                                  Verified
                                </Badge>
                              )}
                            </div>
                          </TableCell>
                          <TableCell className="text-sm text-muted-foreground">
                            {adminUser.lastLogin
                              ? formatters.formatDateTime(adminUser.lastLogin)
                              : 'Never'}
                          </TableCell>
                          <TableCell className="text-sm text-muted-foreground">
                            {formatters.formatDate(adminUser.createdAt)}
                          </TableCell>
                          <TableCell className="text-right">
                            <DropdownMenu>
                              <DropdownMenuTrigger asChild>
                                <Button variant="ghost" size="sm">
                                  <MoreVertical className="h-4 w-4" />
                                </Button>
                              </DropdownMenuTrigger>
                              <DropdownMenuContent align="end">
                                <DropdownMenuLabel>Actions</DropdownMenuLabel>
                                <DropdownMenuSeparator />
                                <DropdownMenuItem asChild>
                                  <Link href={`/admin/users/${adminUser.id}`}>
                                    <Eye className="h-4 w-4 mr-2" />
                                    View Details
                                  </Link>
                                </DropdownMenuItem>
                                {adminUser.role !== 'SUPER_ADMIN' && (
                                  <>
                                    <DropdownMenuItem
                                      onClick={() => {
                                        // TODO: Implement role change
                                        console.log('Change role for', adminUser.id)
                                      }}
                                    >
                                      <RefreshCw className="h-4 w-4 mr-2" />
                                      Change Role
                                    </DropdownMenuItem>
                                    <DropdownMenuSeparator />
                                    <DropdownMenuItem
                                      className="text-destructive"
                                      onClick={() => {
                                        setSelectedUser(adminUser)
                                        setShowRevokeDialog(true)
                                      }}
                                    >
                                      <Ban className="h-4 w-4 mr-2" />
                                      Revoke Access
                                    </DropdownMenuItem>
                                  </>
                                )}
                              </DropdownMenuContent>
                            </DropdownMenu>
                          </TableCell>
                        </TableRow>
                      )
                    })
                  ) : (
                    <TableRow>
                      <TableCell colSpan={6} className="text-center py-8 text-muted-foreground">
                        No admin users found
                      </TableCell>
                    </TableRow>
                  )}
                </TableBody>
              </Table>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Pending Invitations */}
      <Card>
        <CardHeader>
          <CardTitle>Pending Invitations</CardTitle>
          <CardDescription>Track admin invitations awaiting acceptance</CardDescription>
        </CardHeader>
        <CardContent>
          {loadingInvitations ? (
            <div className="flex justify-center py-8">
              <LoadingSpinner />
            </div>
          ) : pendingInvitations.length > 0 ? (
            <div className="space-y-4">
              {pendingInvitations.map((invitation) => (
                <div
                  key={invitation.id}
                  className="flex items-center justify-between p-4 border rounded-lg"
                >
                  <div className="flex items-center gap-4">
                    <div className="w-10 h-10 rounded-full bg-amber-100 flex items-center justify-center">
                      <Clock className="h-5 w-5 text-amber-600" />
                    </div>
                    <div>
                      <div className="font-medium">{invitation.email}</div>
                      <div className="text-sm text-muted-foreground">
                        Role: {invitation.role} • Expires {formatters.formatDate(invitation.expiresAt)}
                      </div>
                    </div>
                  </div>
                  <div className="flex items-center gap-2">
                    <Badge variant="outline">Pending</Badge>
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => {
                        // TODO: Resend invitation
                        console.log('Resend invitation', invitation.id)
                      }}
                    >
                      <Mail className="h-4 w-4 mr-2" />
                      Resend
                    </Button>
                    <Button
                      variant="ghost"
                      size="sm"
                      className="text-destructive"
                      onClick={() => {
                        // TODO: Revoke invitation
                        console.log('Revoke invitation', invitation.id)
                      }}
                    >
                      <Trash2 className="h-4 w-4" />
                    </Button>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <div className="text-center py-8 text-muted-foreground">
              No pending invitations
            </div>
          )}
        </CardContent>
      </Card>

      {/* Invite Admin Dialog */}
      <Dialog open={showInviteDialog} onOpenChange={setShowInviteDialog}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Invite Administrator</DialogTitle>
            <DialogDescription>
              Send an invitation to add a new administrator to the system
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="email">Email Address</Label>
              <Input
                id="email"
                type="email"
                placeholder="admin@example.com"
                value={inviteEmail}
                onChange={(e) => setInviteEmail(e.target.value)}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="role">Role</Label>
              <Select value={inviteRole} onValueChange={(value: any) => setInviteRole(value)}>
                <SelectTrigger id="role">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="ADMIN">
                    <div className="flex items-center gap-2">
                      <Shield className="h-4 w-4" />
                      <div>
                        <div>Admin</div>
                        <div className="text-xs text-muted-foreground">
                          Full election & user management
                        </div>
                      </div>
                    </div>
                  </SelectItem>
                  <SelectItem value="MODERATOR">
                    <div className="flex items-center gap-2">
                      <UserCog className="h-4 w-4" />
                      <div>
                        <div>Moderator</div>
                        <div className="text-xs text-muted-foreground">
                          Read-only with approval permissions
                        </div>
                      </div>
                    </div>
                  </SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setShowInviteDialog(false)}>
              Cancel
            </Button>
            <Button
              onClick={() => inviteMutation.mutate({ email: inviteEmail, role: inviteRole })}
              disabled={!inviteEmail || inviteMutation.isPending}
            >
              {inviteMutation.isPending && <LoadingSpinner className="mr-2" />}
              Send Invitation
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Revoke Access Dialog */}
      <Dialog open={showRevokeDialog} onOpenChange={setShowRevokeDialog}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Revoke Admin Access</DialogTitle>
            <DialogDescription>
              Are you sure you want to revoke admin access for{' '}
              <strong>
                {selectedUser?.firstName} {selectedUser?.lastName}
              </strong>
              ? This action will immediately revoke their admin privileges.
            </DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button variant="outline" onClick={() => setShowRevokeDialog(false)}>
              Cancel
            </Button>
            <Button
              variant="destructive"
              onClick={() => selectedUser && revokeAccessMutation.mutate(selectedUser.id)}
              disabled={revokeAccessMutation.isPending}
            >
              {revokeAccessMutation.isPending && <LoadingSpinner className="mr-2" />}
              Revoke Access
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  )
}
