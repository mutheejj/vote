"use client"

import React, { useState, useEffect } from "react"
import { useAuth } from "@/lib/hooks/useAuth"
import { redirect } from "next/navigation"
import {
  Database,
  Download,
  Trash2,
  RefreshCw,
  Plus,
  AlertTriangle,
  CheckCircle,
  XCircle,
  Clock,
  HardDrive,
  Calendar,
  User,
  FileText
} from "lucide-react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Checkbox } from "@/components/ui/checkbox"
import { Badge } from "@/components/ui/badge"
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert"
import {
  listBackups,
  createBackup,
  restoreBackup,
  deleteBackup,
  downloadBackup,
  formatFileSize,
  formatDuration,
  getStatusColor,
  getStatusIcon,
  Backup,
} from "@/lib/api/backup"

export default function BackupManagementPage() {
  const { user, isLoading } = useAuth()
  const [backups, setBackups] = useState<Backup[]>([])
  const [isLoadingBackups, setIsLoadingBackups] = useState(true)
  const [isCreating, setIsCreating] = useState(false)
  const [isRestoring, setIsRestoring] = useState(false)
  const [isDeleting, setIsDeleting] = useState(false)
  const [selectedBackup, setSelectedBackup] = useState<Backup | null>(null)

  // Create backup form state
  const [createDialogOpen, setCreateDialogOpen] = useState(false)
  const [includePersonalData, setIncludePersonalData] = useState(false)
  const [description, setDescription] = useState("")

  // Restore confirmation state
  const [restoreDialogOpen, setRestoreDialogOpen] = useState(false)

  // Delete confirmation state
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false)

  // Error and success states
  const [error, setError] = useState<string | null>(null)
  const [success, setSuccess] = useState<string | null>(null)

  // Check authentication and authorization
  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
      </div>
    )
  }

  if (!user || user.role !== "SUPER_ADMIN") {
    redirect("/admin/dashboard")
  }

  // Load backups
  const loadBackups = async () => {
    try {
      setIsLoadingBackups(true)
      setError(null)
      const response = await listBackups()
      if (response.data.success && response.data.data) {
        setBackups(response.data.data)
      }
    } catch (err: any) {
      setError(err.response?.data?.message || "Failed to load backups")
    } finally {
      setIsLoadingBackups(false)
    }
  }

  useEffect(() => {
    loadBackups()
  }, [])

  // Handle create backup
  const handleCreateBackup = async () => {
    try {
      setIsCreating(true)
      setError(null)

      const response = await createBackup({
        includePersonalData,
        description: description || undefined,
      })

      if (response.data.success) {
        setSuccess("Backup created successfully!")
        setCreateDialogOpen(false)
        setDescription("")
        setIncludePersonalData(false)
        loadBackups()

        // Clear success message after 5 seconds
        setTimeout(() => setSuccess(null), 5000)
      }
    } catch (err: any) {
      setError(err.response?.data?.message || "Failed to create backup")
    } finally {
      setIsCreating(false)
    }
  }

  // Handle restore backup
  const handleRestoreBackup = async () => {
    if (!selectedBackup) return

    try {
      setIsRestoring(true)
      setError(null)

      const response = await restoreBackup(selectedBackup.id)

      if (response.data.success) {
        setSuccess("Database restored successfully! You may need to refresh the page.")
        setRestoreDialogOpen(false)
        setSelectedBackup(null)
        loadBackups()

        // Clear success message after 5 seconds
        setTimeout(() => setSuccess(null), 5000)
      }
    } catch (err: any) {
      setError(err.response?.data?.message || "Failed to restore backup")
    } finally {
      setIsRestoring(false)
    }
  }

  // Handle delete backup
  const handleDeleteBackup = async () => {
    if (!selectedBackup) return

    try {
      setIsDeleting(true)
      setError(null)

      const response = await deleteBackup(selectedBackup.id)

      if (response.data.success) {
        setSuccess("Backup deleted successfully!")
        setDeleteDialogOpen(false)
        setSelectedBackup(null)
        loadBackups()

        // Clear success message after 5 seconds
        setTimeout(() => setSuccess(null), 5000)
      }
    } catch (err: any) {
      setError(err.response?.data?.message || "Failed to delete backup")
    } finally {
      setIsDeleting(false)
    }
  }

  // Handle download backup
  const handleDownloadBackup = async (backup: Backup) => {
    try {
      await downloadBackup(backup.id)
      setSuccess("Backup download started!")
      setTimeout(() => setSuccess(null), 3000)
    } catch (err: any) {
      setError("Failed to download backup")
      setTimeout(() => setError(null), 3000)
    }
  }

  // Calculate statistics
  const stats = {
    total: backups.length,
    completed: backups.filter(b => b.status === 'COMPLETED').length,
    failed: backups.filter(b => b.status === 'FAILED').length,
    totalSize: backups.reduce((sum, b) => sum + (b.fileSize || 0), 0),
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">Backup & Restore</h1>
          <p className="text-gray-500 mt-1">Manage database backups and restore points</p>
        </div>
        <Button onClick={() => setCreateDialogOpen(true)}>
          <Plus className="h-4 w-4 mr-2" />
          Create Backup
        </Button>
      </div>

      {/* Error and Success Alerts */}
      {error && (
        <Alert variant="destructive">
          <AlertTriangle className="h-4 w-4" />
          <AlertTitle>Error</AlertTitle>
          <AlertDescription>{error}</AlertDescription>
        </Alert>
      )}

      {success && (
        <Alert className="bg-green-50 text-green-900 border-green-200">
          <CheckCircle className="h-4 w-4" />
          <AlertTitle>Success</AlertTitle>
          <AlertDescription>{success}</AlertDescription>
        </Alert>
      )}

      {/* Statistics Cards */}
      <div className="grid gap-4 md:grid-cols-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Backups</CardTitle>
            <Database className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.total}</div>
            <p className="text-xs text-muted-foreground">All backup records</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Completed</CardTitle>
            <CheckCircle className="h-4 w-4 text-green-600" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-green-600">{stats.completed}</div>
            <p className="text-xs text-muted-foreground">Successful backups</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Failed</CardTitle>
            <XCircle className="h-4 w-4 text-red-600" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-red-600">{stats.failed}</div>
            <p className="text-xs text-muted-foreground">Failed attempts</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Size</CardTitle>
            <HardDrive className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{formatFileSize(stats.totalSize)}</div>
            <p className="text-xs text-muted-foreground">Disk space used</p>
          </CardContent>
        </Card>
      </div>

      {/* Backups Table */}
      <Card>
        <CardHeader>
          <div className="flex justify-between items-center">
            <div>
              <CardTitle>Backup History</CardTitle>
              <CardDescription>View and manage all database backups</CardDescription>
            </div>
            <Button variant="outline" size="sm" onClick={loadBackups}>
              <RefreshCw className="h-4 w-4 mr-2" />
              Refresh
            </Button>
          </div>
        </CardHeader>
        <CardContent>
          {isLoadingBackups ? (
            <div className="flex justify-center py-8">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
            </div>
          ) : backups.length === 0 ? (
            <div className="text-center py-8 text-gray-500">
              <Database className="h-12 w-12 mx-auto mb-4 text-gray-300" />
              <p>No backups found. Create your first backup to get started.</p>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Status</TableHead>
                    <TableHead>Name</TableHead>
                    <TableHead>Type</TableHead>
                    <TableHead>Created By</TableHead>
                    <TableHead>Date</TableHead>
                    <TableHead>Size</TableHead>
                    <TableHead>Records</TableHead>
                    <TableHead>Duration</TableHead>
                    <TableHead>Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {backups.map((backup) => (
                    <TableRow key={backup.id}>
                      <TableCell>
                        <Badge className={getStatusColor(backup.status)}>
                          {getStatusIcon(backup.status)} {backup.status}
                        </Badge>
                      </TableCell>
                      <TableCell>
                        <div>
                          <p className="font-medium">{backup.name}</p>
                          {backup.description && (
                            <p className="text-xs text-gray-500">{backup.description}</p>
                          )}
                        </div>
                      </TableCell>
                      <TableCell>
                        <Badge variant="outline">{backup.type}</Badge>
                      </TableCell>
                      <TableCell>
                        <div className="text-sm">
                          <p>{backup.createdBy.firstName} {backup.createdBy.lastName}</p>
                          <p className="text-xs text-gray-500">{backup.createdBy.email}</p>
                        </div>
                      </TableCell>
                      <TableCell>
                        <div className="text-sm">
                          <p>{new Date(backup.createdAt).toLocaleDateString()}</p>
                          <p className="text-xs text-gray-500">
                            {new Date(backup.createdAt).toLocaleTimeString()}
                          </p>
                        </div>
                      </TableCell>
                      <TableCell>{formatFileSize(backup.fileSize)}</TableCell>
                      <TableCell>
                        <div className="text-sm">
                          <p>{backup.recordCount?.toLocaleString() || 'N/A'}</p>
                          <p className="text-xs text-gray-500">
                            {backup.tables?.length || 0} tables
                          </p>
                        </div>
                      </TableCell>
                      <TableCell>
                        {backup.duration ? formatDuration(backup.duration) : 'N/A'}
                      </TableCell>
                      <TableCell>
                        <div className="flex space-x-2">
                          {backup.status === 'COMPLETED' && (
                            <>
                              <Button
                                variant="ghost"
                                size="sm"
                                onClick={() => handleDownloadBackup(backup)}
                                title="Download backup"
                              >
                                <Download className="h-4 w-4" />
                              </Button>
                              <Button
                                variant="ghost"
                                size="sm"
                                onClick={() => {
                                  setSelectedBackup(backup)
                                  setRestoreDialogOpen(true)
                                }}
                                title="Restore from backup"
                              >
                                <RefreshCw className="h-4 w-4" />
                              </Button>
                            </>
                          )}
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => {
                              setSelectedBackup(backup)
                              setDeleteDialogOpen(true)
                            }}
                            title="Delete backup"
                          >
                            <Trash2 className="h-4 w-4 text-red-600" />
                          </Button>
                        </div>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Create Backup Dialog */}
      <Dialog open={createDialogOpen} onOpenChange={setCreateDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Create New Backup</DialogTitle>
            <DialogDescription>
              Create a manual backup of the database. This process may take several minutes.
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <div className="space-y-2">
              <Label htmlFor="description">Description (Optional)</Label>
              <Input
                id="description"
                placeholder="e.g., Pre-election backup"
                value={description}
                onChange={(e) => setDescription(e.target.value)}
              />
            </div>
            <div className="flex items-center space-x-2">
              <Checkbox
                id="includePersonalData"
                checked={includePersonalData}
                onCheckedChange={(checked) => setIncludePersonalData(checked as boolean)}
              />
              <Label htmlFor="includePersonalData" className="text-sm font-normal cursor-pointer">
                Include personal data (tokens, sessions, audit logs)
              </Label>
            </div>
            <Alert>
              <AlertTriangle className="h-4 w-4" />
              <AlertTitle>Warning</AlertTitle>
              <AlertDescription>
                Creating a backup will temporarily lock the database for consistent snapshot.
                This may affect system performance during the backup process.
              </AlertDescription>
            </Alert>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setCreateDialogOpen(false)}>
              Cancel
            </Button>
            <Button onClick={handleCreateBackup} disabled={isCreating}>
              {isCreating ? (
                <>
                  <Clock className="h-4 w-4 mr-2 animate-spin" />
                  Creating...
                </>
              ) : (
                <>
                  <Database className="h-4 w-4 mr-2" />
                  Create Backup
                </>
              )}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Restore Backup Dialog */}
      <Dialog open={restoreDialogOpen} onOpenChange={setRestoreDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Restore Database</DialogTitle>
            <DialogDescription>
              Are you sure you want to restore the database from this backup?
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4 py-4">
            {selectedBackup && (
              <div className="space-y-2 bg-gray-50 p-4 rounded-lg">
                <p className="text-sm">
                  <strong>Backup:</strong> {selectedBackup.name}
                </p>
                <p className="text-sm">
                  <strong>Created:</strong> {new Date(selectedBackup.createdAt).toLocaleString()}
                </p>
                <p className="text-sm">
                  <strong>Records:</strong> {selectedBackup.recordCount?.toLocaleString() || 'N/A'}
                </p>
                <p className="text-sm">
                  <strong>Size:</strong> {formatFileSize(selectedBackup.fileSize)}
                </p>
              </div>
            )}
            <Alert variant="destructive">
              <AlertTriangle className="h-4 w-4" />
              <AlertTitle>Critical Warning</AlertTitle>
              <AlertDescription>
                This will replace ALL current database data with the backup data.
                This action CANNOT be undone. Make sure you have a recent backup of the current state.
              </AlertDescription>
            </Alert>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setRestoreDialogOpen(false)}>
              Cancel
            </Button>
            <Button variant="destructive" onClick={handleRestoreBackup} disabled={isRestoring}>
              {isRestoring ? (
                <>
                  <Clock className="h-4 w-4 mr-2 animate-spin" />
                  Restoring...
                </>
              ) : (
                <>
                  <RefreshCw className="h-4 w-4 mr-2" />
                  Restore Database
                </>
              )}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Delete Backup Dialog */}
      <Dialog open={deleteDialogOpen} onOpenChange={setDeleteDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Delete Backup</DialogTitle>
            <DialogDescription>
              Are you sure you want to delete this backup?
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4 py-4">
            {selectedBackup && (
              <div className="space-y-2 bg-gray-50 p-4 rounded-lg">
                <p className="text-sm">
                  <strong>Backup:</strong> {selectedBackup.name}
                </p>
                <p className="text-sm">
                  <strong>Created:</strong> {new Date(selectedBackup.createdAt).toLocaleString()}
                </p>
                <p className="text-sm">
                  <strong>Size:</strong> {formatFileSize(selectedBackup.fileSize)}
                </p>
              </div>
            )}
            <Alert>
              <AlertTriangle className="h-4 w-4" />
              <AlertTitle>Warning</AlertTitle>
              <AlertDescription>
                This will permanently delete the backup file from the server.
                This action cannot be undone.
              </AlertDescription>
            </Alert>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setDeleteDialogOpen(false)}>
              Cancel
            </Button>
            <Button variant="destructive" onClick={handleDeleteBackup} disabled={isDeleting}>
              {isDeleting ? (
                <>
                  <Clock className="h-4 w-4 mr-2 animate-spin" />
                  Deleting...
                </>
              ) : (
                <>
                  <Trash2 className="h-4 w-4 mr-2" />
                  Delete Backup
                </>
              )}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  )
}
