"use client"

import React, { useState } from 'react'
import { useQuery, useMutation } from '@tanstack/react-query'
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card'
import {
  Tabs,
  TabsContent,
  TabsList,
  TabsTrigger,
} from '@/components/ui/tabs'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import { Switch } from '@/components/ui/switch'
import { Badge } from '@/components/ui/badge'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog'
import {
  Alert,
  AlertDescription,
  AlertTitle,
} from '@/components/ui/alert'
import { LoadingSpinner } from '@/components/shared/LoadingSpinner'
import { useAuth } from '@/lib/hooks/useAuth'
import { useNotifications } from '@/lib/hooks/useNotifications'
import { NotificationType } from '@/lib/enums'
import  formatters  from '@/lib/utils/formatters'
import {
  Settings,
  Save,
  RefreshCw,
  Shield,
  Mail,
  Bell,
  Database,
  Server,
  Lock,
  Users,
  FileText,
  Download,
  Upload,
  Trash2,
  AlertTriangle,
  CheckCircle,
  Info,
  Clock,
  Globe,
  Eye,
  EyeOff,
  Key,
  Smartphone,
} from 'lucide-react'
import {
  ApiResponse,
  SystemHealth,
} from '@/lib/types'
import { API_ENDPOINTS } from '@/lib/constants'

interface SystemSettings {
  general: {
    siteName: string
    siteDescription: string
    contactEmail: string
    supportUrl: string
    maintenanceMode: boolean
    registrationEnabled: boolean
    emailVerificationRequired: boolean
    twoFactorRequired: boolean
  }
  security: {
    sessionTimeout: number
    maxLoginAttempts: number
    passwordMinLength: number
    passwordRequireSpecialChars: boolean
    passwordRequireNumbers: boolean
    passwordRequireUppercase: boolean
    tokenExpiration: number
    refreshTokenExpiration: number
    rateLimitEnabled: boolean
    rateLimitRequests: number
    rateLimitWindow: number
  }
  voting: {
    allowAbstention: boolean
    requireAllPositions: boolean
    enableLiveResults: boolean
    enableVoteVerification: boolean
    voteEncryption: boolean
    anonymousVoting: boolean
    sessionTimeLimit: number
    maxConcurrentSessions: number
  }
  notifications: {
    emailEnabled: boolean
    smsEnabled: boolean
    pushEnabled: boolean
    electionReminders: boolean
    resultNotifications: boolean
    maintenanceAlerts: boolean
    securityAlerts: boolean
  }
  backup: {
    enabled: boolean
    frequency: 'daily' | 'weekly' | 'monthly'
    retentionDays: number
    includeFiles: boolean
    compressionEnabled: boolean
    lastBackup?: Date
    nextScheduledBackup?: Date
  }
}

interface SystemSettingsFormProps {
  settings: SystemSettings
  onSave: (settings: SystemSettings) => void
  loading?: boolean
}

const SystemSettingsForm: React.FC<SystemSettingsFormProps> = ({
  settings,
  onSave,
  loading = false
}) => {
  const [formData, setFormData] = useState<SystemSettings>(settings)

  const handleInputChange = (
    section: keyof SystemSettings,
    field: string,
    value: any
  ) => {
    setFormData(prev => ({
      ...prev,
      [section]: {
        ...prev[section],
        [field]: value
      }
    }))
  }

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    onSave(formData)
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      <Tabs defaultValue="general" className="space-y-6">
        <TabsList className="grid w-full grid-cols-5">
          <TabsTrigger value="general">General</TabsTrigger>
          <TabsTrigger value="security">Security</TabsTrigger>
          <TabsTrigger value="voting">Voting</TabsTrigger>
          <TabsTrigger value="notifications">Notifications</TabsTrigger>
          <TabsTrigger value="backup">Backup</TabsTrigger>
        </TabsList>

        {/* General Settings */}
        <TabsContent value="general" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>General Configuration</CardTitle>
              <CardDescription>
                Basic system settings and site information
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label htmlFor="siteName">Site Name</Label>
                  <Input
                    id="siteName"
                    value={formData.general.siteName}
                    onChange={(e) => handleInputChange('general', 'siteName', e.target.value)}
                  />
                </div>
                <div>
                  <Label htmlFor="contactEmail">Contact Email</Label>
                  <Input
                    id="contactEmail"
                    type="email"
                    value={formData.general.contactEmail}
                    onChange={(e) => handleInputChange('general', 'contactEmail', e.target.value)}
                  />
                </div>
              </div>

              <div>
                <Label htmlFor="siteDescription">Site Description</Label>
                <Textarea
                  id="siteDescription"
                  value={formData.general.siteDescription}
                  onChange={(e) => handleInputChange('general', 'siteDescription', e.target.value)}
                />
              </div>

              <div>
                <Label htmlFor="supportUrl">Support URL</Label>
                <Input
                  id="supportUrl"
                  type="url"
                  value={formData.general.supportUrl}
                  onChange={(e) => handleInputChange('general', 'supportUrl', e.target.value)}
                />
              </div>

              <div className="space-y-4">
                <div className="flex items-center justify-between">
                  <div className="space-y-0.5">
                    <Label>Maintenance Mode</Label>
                    <p className="text-sm text-muted-foreground">
                      Temporarily disable site access for maintenance
                    </p>
                  </div>
                  <Switch
                    checked={formData.general.maintenanceMode}
                    onCheckedChange={(checked: any) => handleInputChange('general', 'maintenanceMode', checked)}
                  />
                </div>

                <div className="flex items-center justify-between">
                  <div className="space-y-0.5">
                    <Label>Registration Enabled</Label>
                    <p className="text-sm text-muted-foreground">
                      Allow new user registrations
                    </p>
                  </div>
                  <Switch
                    checked={formData.general.registrationEnabled}
                    onCheckedChange={(checked: any) => handleInputChange('general', 'registrationEnabled', checked)}
                  />
                </div>

                <div className="flex items-center justify-between">
                  <div className="space-y-0.5">
                    <Label>Email Verification Required</Label>
                    <p className="text-sm text-muted-foreground">
                      Require email verification for new accounts
                    </p>
                  </div>
                  <Switch
                    checked={formData.general.emailVerificationRequired}
                    onCheckedChange={(checked: any) => handleInputChange('general', 'emailVerificationRequired', checked)}
                  />
                </div>

                <div className="flex items-center justify-between">
                  <div className="space-y-0.5">
                    <Label>Two-Factor Authentication Required</Label>
                    <p className="text-sm text-muted-foreground">
                      Require 2FA for all user accounts
                    </p>
                  </div>
                  <Switch
                    checked={formData.general.twoFactorRequired}
                    onCheckedChange={(checked: any) => handleInputChange('general', 'twoFactorRequired', checked)}
                  />
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Security Settings */}
        <TabsContent value="security" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>Security Configuration</CardTitle>
              <CardDescription>
                Authentication, authorization, and security policies
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label htmlFor="sessionTimeout">Session Timeout (minutes)</Label>
                  <Input
                    id="sessionTimeout"
                    type="number"
                    value={formData.security.sessionTimeout}
                    onChange={(e) => handleInputChange('security', 'sessionTimeout', parseInt(e.target.value))}
                  />
                </div>
                <div>
                  <Label htmlFor="maxLoginAttempts">Max Login Attempts</Label>
                  <Input
                    id="maxLoginAttempts"
                    type="number"
                    value={formData.security.maxLoginAttempts}
                    onChange={(e) => handleInputChange('security', 'maxLoginAttempts', parseInt(e.target.value))}
                  />
                </div>
              </div>

              <div className="space-y-3">
                <Label>Password Requirements</Label>
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <Label htmlFor="passwordMinLength">Minimum Length</Label>
                    <Input
                      id="passwordMinLength"
                      type="number"
                      value={formData.security.passwordMinLength}
                      onChange={(e) => handleInputChange('security', 'passwordMinLength', parseInt(e.target.value))}
                    />
                  </div>
                </div>
                <div className="space-y-2">
                  <div className="flex items-center justify-between">
                    <Label>Require Special Characters</Label>
                    <Switch
                      checked={formData.security.passwordRequireSpecialChars}
                      onCheckedChange={(checked: any) => handleInputChange('security', 'passwordRequireSpecialChars', checked)}
                    />
                  </div>
                  <div className="flex items-center justify-between">
                    <Label>Require Numbers</Label>
                    <Switch
                      checked={formData.security.passwordRequireNumbers}
                      onCheckedChange={(checked: any) => handleInputChange('security', 'passwordRequireNumbers', checked)}
                    />
                  </div>
                  <div className="flex items-center justify-between">
                    <Label>Require Uppercase Letters</Label>
                    <Switch
                      checked={formData.security.passwordRequireUppercase}
                      onCheckedChange={(checked: any) => handleInputChange('security', 'passwordRequireUppercase', checked)}
                    />
                  </div>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label htmlFor="tokenExpiration">Token Expiration (minutes)</Label>
                  <Input
                    id="tokenExpiration"
                    type="number"
                    value={formData.security.tokenExpiration}
                    onChange={(e) => handleInputChange('security', 'tokenExpiration', parseInt(e.target.value))}
                  />
                </div>
                <div>
                  <Label htmlFor="refreshTokenExpiration">Refresh Token Expiration (days)</Label>
                  <Input
                    id="refreshTokenExpiration"
                    type="number"
                    value={formData.security.refreshTokenExpiration}
                    onChange={(e) => handleInputChange('security', 'refreshTokenExpiration', parseInt(e.target.value))}
                  />
                </div>
              </div>

              <div className="space-y-4">
                <div className="flex items-center justify-between">
                  <div className="space-y-0.5">
                    <Label>Rate Limiting Enabled</Label>
                    <p className="text-sm text-muted-foreground">
                      Enable API rate limiting protection
                    </p>
                  </div>
                  <Switch
                    checked={formData.security.rateLimitEnabled}
                    onCheckedChange={(checked: any) => handleInputChange('security', 'rateLimitEnabled', checked)}
                  />
                </div>

                {formData.security.rateLimitEnabled && (
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <Label htmlFor="rateLimitRequests">Requests per Window</Label>
                      <Input
                        id="rateLimitRequests"
                        type="number"
                        value={formData.security.rateLimitRequests}
                        onChange={(e) => handleInputChange('security', 'rateLimitRequests', parseInt(e.target.value))}
                      />
                    </div>
                    <div>
                      <Label htmlFor="rateLimitWindow">Window (minutes)</Label>
                      <Input
                        id="rateLimitWindow"
                        type="number"
                        value={formData.security.rateLimitWindow}
                        onChange={(e) => handleInputChange('security', 'rateLimitWindow', parseInt(e.target.value))}
                      />
                    </div>
                  </div>
                )}
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Voting Settings */}
        <TabsContent value="voting" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>Voting Configuration</CardTitle>
              <CardDescription>
                Election and voting system settings
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-4">
                <div className="flex items-center justify-between">
                  <div className="space-y-0.5">
                    <Label>Allow Abstention</Label>
                    <p className="text-sm text-muted-foreground">
                      Allow voters to abstain from voting on positions
                    </p>
                  </div>
                  <Switch
                    checked={formData.voting.allowAbstention}
                    onCheckedChange={(checked: any) => handleInputChange('voting', 'allowAbstention', checked)}
                  />
                </div>

                <div className="flex items-center justify-between">
                  <div className="space-y-0.5">
                    <Label>Require All Positions</Label>
                    <p className="text-sm text-muted-foreground">
                      Require voters to vote on all positions
                    </p>
                  </div>
                  <Switch
                    checked={formData.voting.requireAllPositions}
                    onCheckedChange={(checked: any) => handleInputChange('voting', 'requireAllPositions', checked)}
                  />
                </div>

                <div className="flex items-center justify-between">
                  <div className="space-y-0.5">
                    <Label>Enable Live Results</Label>
                    <p className="text-sm text-muted-foreground">
                      Show real-time voting results during elections
                    </p>
                  </div>
                  <Switch
                    checked={formData.voting.enableLiveResults}
                    onCheckedChange={(checked: any) => handleInputChange('voting', 'enableLiveResults', checked)}
                  />
                </div>

                <div className="flex items-center justify-between">
                  <div className="space-y-0.5">
                    <Label>Enable Vote Verification</Label>
                    <p className="text-sm text-muted-foreground">
                      Allow voters to verify their votes were counted
                    </p>
                  </div>
                  <Switch
                    checked={formData.voting.enableVoteVerification}
                    onCheckedChange={(checked: any) => handleInputChange('voting', 'enableVoteVerification', checked)}
                  />
                </div>

                <div className="flex items-center justify-between">
                  <div className="space-y-0.5">
                    <Label>Vote Encryption</Label>
                    <p className="text-sm text-muted-foreground">
                      Encrypt vote data for additional security
                    </p>
                  </div>
                  <Switch
                    checked={formData.voting.voteEncryption}
                    onCheckedChange={(checked: any) => handleInputChange('voting', 'voteEncryption', checked)}
                  />
                </div>

                <div className="flex items-center justify-between">
                  <div className="space-y-0.5">
                    <Label>Anonymous Voting</Label>
                    <p className="text-sm text-muted-foreground">
                      Ensure voter anonymity in the voting process
                    </p>
                  </div>
                  <Switch
                    checked={formData.voting.anonymousVoting}
                    onCheckedChange={(checked: any) => handleInputChange('voting', 'anonymousVoting', checked)}
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label htmlFor="sessionTimeLimit">Session Time Limit (minutes)</Label>
                  <Input
                    id="sessionTimeLimit"
                    type="number"
                    value={formData.voting.sessionTimeLimit}
                    onChange={(e) => handleInputChange('voting', 'sessionTimeLimit', parseInt(e.target.value))}
                  />
                </div>
                <div>
                  <Label htmlFor="maxConcurrentSessions">Max Concurrent Sessions</Label>
                  <Input
                    id="maxConcurrentSessions"
                    type="number"
                    value={formData.voting.maxConcurrentSessions}
                    onChange={(e) => handleInputChange('voting', 'maxConcurrentSessions', parseInt(e.target.value))}
                  />
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Notification Settings */}
        <TabsContent value="notifications" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>Notification Configuration</CardTitle>
              <CardDescription>
                Email, SMS, and push notification settings
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-4">
                <div className="flex items-center justify-between">
                  <div className="space-y-0.5">
                    <Label>Email Notifications</Label>
                    <p className="text-sm text-muted-foreground">
                      Enable email notification system
                    </p>
                  </div>
                  <Switch
                    checked={formData.notifications.emailEnabled}
                    onCheckedChange={(checked: any) => handleInputChange('notifications', 'emailEnabled', checked)}
                  />
                </div>

                <div className="flex items-center justify-between">
                  <div className="space-y-0.5">
                    <Label>SMS Notifications</Label>
                    <p className="text-sm text-muted-foreground">
                      Enable SMS notification system
                    </p>
                  </div>
                  <Switch
                    checked={formData.notifications.smsEnabled}
                    onCheckedChange={(checked: any) => handleInputChange('notifications', 'smsEnabled', checked)}
                  />
                </div>

                <div className="flex items-center justify-between">
                  <div className="space-y-0.5">
                    <Label>Push Notifications</Label>
                    <p className="text-sm text-muted-foreground">
                      Enable push notification system
                    </p>
                  </div>
                  <Switch
                    checked={formData.notifications.pushEnabled}
                    onCheckedChange={(checked: any) => handleInputChange('notifications', 'pushEnabled', checked)}
                  />
                </div>

                <div className="flex items-center justify-between">
                  <div className="space-y-0.5">
                    <Label>Election Reminders</Label>
                    <p className="text-sm text-muted-foreground">
                      Send reminders about upcoming elections
                    </p>
                  </div>
                  <Switch
                    checked={formData.notifications.electionReminders}
                    onCheckedChange={(checked: any) => handleInputChange('notifications', 'electionReminders', checked)}
                  />
                </div>

                <div className="flex items-center justify-between">
                  <div className="space-y-0.5">
                    <Label>Result Notifications</Label>
                    <p className="text-sm text-muted-foreground">
                      Send notifications when results are published
                    </p>
                  </div>
                  <Switch
                    checked={formData.notifications.resultNotifications}
                    onCheckedChange={(checked: any) => handleInputChange('notifications', 'resultNotifications', checked)}
                  />
                </div>

                <div className="flex items-center justify-between">
                  <div className="space-y-0.5">
                    <Label>Maintenance Alerts</Label>
                    <p className="text-sm text-muted-foreground">
                      Send alerts about system maintenance
                    </p>
                  </div>
                  <Switch
                    checked={formData.notifications.maintenanceAlerts}
                    onCheckedChange={(checked: any) => handleInputChange('notifications', 'maintenanceAlerts', checked)}
                  />
                </div>

                <div className="flex items-center justify-between">
                  <div className="space-y-0.5">
                    <Label>Security Alerts</Label>
                    <p className="text-sm text-muted-foreground">
                      Send alerts about security events
                    </p>
                  </div>
                  <Switch
                    checked={formData.notifications.securityAlerts}
                    onCheckedChange={(checked: any) => handleInputChange('notifications', 'securityAlerts', checked)}
                  />
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Backup Settings */}
        <TabsContent value="backup" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>Backup Configuration</CardTitle>
              <CardDescription>
                Automated backup and data retention settings
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="flex items-center justify-between">
                <div className="space-y-0.5">
                  <Label>Automated Backups</Label>
                  <p className="text-sm text-muted-foreground">
                    Enable automatic system backups
                  </p>
                </div>
                <Switch
                  checked={formData.backup.enabled}
                  onCheckedChange={(checked: any) => handleInputChange('backup', 'enabled', checked)}
                />
              </div>

              {formData.backup.enabled && (
                <div className="space-y-4">
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <Label htmlFor="backupFrequency">Backup Frequency</Label>
                      <Select
                        value={formData.backup.frequency}
                        onValueChange={(value) => handleInputChange('backup', 'frequency', value)}
                      >
                        <SelectTrigger>
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="daily">Daily</SelectItem>
                          <SelectItem value="weekly">Weekly</SelectItem>
                          <SelectItem value="monthly">Monthly</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                    <div>
                      <Label htmlFor="retentionDays">Retention Period (days)</Label>
                      <Input
                        id="retentionDays"
                        type="number"
                        value={formData.backup.retentionDays}
                        onChange={(e) => handleInputChange('backup', 'retentionDays', parseInt(e.target.value))}
                      />
                    </div>
                  </div>

                  <div className="space-y-2">
                    <div className="flex items-center justify-between">
                      <Label>Include Files</Label>
                      <Switch
                        checked={formData.backup.includeFiles}
                        onCheckedChange={(checked: any) => handleInputChange('backup', 'includeFiles', checked)}
                      />
                    </div>
                    <div className="flex items-center justify-between">
                      <Label>Compression Enabled</Label>
                      <Switch
                        checked={formData.backup.compressionEnabled}
                        onCheckedChange={(checked: any) => handleInputChange('backup', 'compressionEnabled', checked)}
                      />
                    </div>
                  </div>

                  {formData.backup.lastBackup && (
                    <div className="p-3 border rounded-lg">
                      <p className="text-sm font-medium">Last Backup</p>
                      <p className="text-sm text-muted-foreground">
                        {formatters.formatDateTime(formData.backup.lastBackup)}
                      </p>
                    </div>
                  )}

                  {formData.backup.nextScheduledBackup && (
                    <div className="p-3 border rounded-lg">
                      <p className="text-sm font-medium">Next Scheduled Backup</p>
                      <p className="text-sm text-muted-foreground">
                        {formatters.formatDateTime(formData.backup.nextScheduledBackup)}
                      </p>
                    </div>
                  )}
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>

      <div className="flex justify-end gap-2">
        <Button type="button" variant="outline">
          Reset to Defaults
        </Button>
        <Button type="submit" disabled={loading}>
          {loading && <LoadingSpinner className="w-4 h-4 mr-2" />}
          <Save className="w-4 h-4 mr-2" />
          Save Settings
        </Button>
      </div>
    </form>
  )
}

export default function AdminSettingsPage() {
  const [showDangerDialog, setShowDangerDialog] = useState(false)

  const { user } = useAuth()
  const { addNotification } = useNotifications()

  // Fetch system settings
  const {
    data: settings,
    isLoading,
    error,
    refetch
  } = useQuery({
    queryKey: ['admin-settings'],
    queryFn: async (): Promise<SystemSettings> => {
      const response = await fetch(`${API_ENDPOINTS.ADMIN.ANALYTICS}`) // Using analytics as placeholder
      if (!response.ok) {
        throw new Error('Failed to fetch system settings')
      }

      // Mock settings data since this would come from the backend
      return {
        general: {
          siteName: 'UniElect Voting System',
          siteDescription: 'Secure digital voting platform for UniElect elections',
          contactEmail: 'voting-support@unielect.edu',
          supportUrl: 'https://docs.unielect.edu',
          maintenanceMode: false,
          registrationEnabled: true,
          emailVerificationRequired: true,
          twoFactorRequired: false
        },
        security: {
          sessionTimeout: 30,
          maxLoginAttempts: 5,
          passwordMinLength: 8,
          passwordRequireSpecialChars: true,
          passwordRequireNumbers: true,
          passwordRequireUppercase: true,
          tokenExpiration: 15,
          refreshTokenExpiration: 7,
          rateLimitEnabled: true,
          rateLimitRequests: 100,
          rateLimitWindow: 15
        },
        voting: {
          allowAbstention: true,
          requireAllPositions: false,
          enableLiveResults: true,
          enableVoteVerification: true,
          voteEncryption: true,
          anonymousVoting: true,
          sessionTimeLimit: 30,
          maxConcurrentSessions: 1000
        },
        notifications: {
          emailEnabled: true,
          smsEnabled: false,
          pushEnabled: true,
          electionReminders: true,
          resultNotifications: true,
          maintenanceAlerts: true,
          securityAlerts: true
        },
        backup: {
          enabled: true,
          frequency: 'daily',
          retentionDays: 30,
          includeFiles: true,
          compressionEnabled: true,
          lastBackup: new Date(Date.now() - 24 * 60 * 60 * 1000),
          nextScheduledBackup: new Date(Date.now() + 6 * 60 * 60 * 1000)
        }
      }
    }
  })

  // Save settings mutation
  const saveSettingsMutation = useMutation({
    mutationFn: async (newSettings: SystemSettings) => {
      // Mock API call - would save to backend
      await new Promise(resolve => setTimeout(resolve, 2000))
      return newSettings
    },
    onSuccess: () => {
      addNotification({
        type: NotificationType.SUCCESS,
        title: 'Settings Saved',
        message: 'System settings have been updated successfully'
      })
      refetch()
    },
    onError: (error) => {
      addNotification({
        type: NotificationType.ERROR,
        title: 'Save Failed',
        message: error instanceof Error ? error.message : 'Failed to save settings'
      })
    }
  })

  const handleSaveSettings = (newSettings: SystemSettings) => {
    saveSettingsMutation.mutate(newSettings)
  }

  if (isLoading) {
    return (
      <div className="flex justify-center py-8">
        <LoadingSpinner />
      </div>
    )
  }

  if (error || !settings) {
    return (
      <div className="space-y-6">
        <Alert variant="destructive">
          <AlertTriangle className="h-4 w-4" />
          <AlertTitle>Error</AlertTitle>
          <AlertDescription>
            Failed to load system settings. Please try refreshing the page.
          </AlertDescription>
        </Alert>
      </div>
    )
  }

  return (
    <div className="space-y-8">
      {/* Header */}
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">System Settings</h1>
          <p className="text-muted-foreground mt-2">
            Configure system behavior, security, and operational settings
          </p>
        </div>
        <div className="flex items-center gap-2">
          <Button
            variant="outline"
            size="sm"
            onClick={() => refetch()}
          >
            <RefreshCw className="h-4 w-4 mr-2" />
            Reload
          </Button>
          <Dialog open={showDangerDialog} onOpenChange={setShowDangerDialog}>
            <DialogTrigger asChild>
              <Button variant="destructive" size="sm">
                <AlertTriangle className="h-4 w-4 mr-2" />
                Danger Zone
              </Button>
            </DialogTrigger>
            <DialogContent>
              <DialogHeader>
                <DialogTitle>Danger Zone</DialogTitle>
                <DialogDescription>
                  Proceed with caution. These actions cannot be undone.
                </DialogDescription>
              </DialogHeader>
              <div className="space-y-4">
                <Button variant="destructive" className="w-full">
                  <Database className="w-4 h-4 mr-2" />
                  Reset Database
                </Button>
                <Button variant="destructive" className="w-full">
                  <Trash2 className="w-4 h-4 mr-2" />
                  Clear All Data
                </Button>
                <Button variant="destructive" className="w-full">
                  <Download className="w-4 h-4 mr-2" />
                  Emergency Backup
                </Button>
              </div>
              <DialogFooter>
                <Button variant="outline" onClick={() => setShowDangerDialog(false)}>
                  Cancel
                </Button>
              </DialogFooter>
            </DialogContent>
          </Dialog>
        </div>
      </div>

      {/* Settings Form */}
      <SystemSettingsForm
        settings={settings}
        onSave={handleSaveSettings}
        loading={saveSettingsMutation.isPending}
      />

      {/* Information Cards */}
      <div className="grid gap-4 md:grid-cols-3">
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Info className="w-5 w-5" />
              Configuration Tips
            </CardTitle>
          </CardHeader>
          <CardContent>
            <ul className="text-sm space-y-1 text-muted-foreground">
              <li>" Test settings in a staging environment first</li>
              <li>" Keep security settings restrictive</li>
              <li>" Enable monitoring for all changes</li>
              <li>" Document configuration changes</li>
            </ul>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Shield className="w-5 w-5" />
              Security Best Practices
            </CardTitle>
          </CardHeader>
          <CardContent>
            <ul className="text-sm space-y-1 text-muted-foreground">
              <li>" Enable two-factor authentication</li>
              <li>" Use strong password requirements</li>
              <li>" Monitor audit logs regularly</li>
              <li>" Keep backup systems updated</li>
            </ul>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Clock className="w-5 w-5" />
              Maintenance Schedule
            </CardTitle>
          </CardHeader>
          <CardContent>
            <ul className="text-sm space-y-1 text-muted-foreground">
              <li>" Daily: Automated backups</li>
              <li>" Weekly: Security updates</li>
              <li>" Monthly: Full system review</li>
              <li>" Quarterly: Performance audit</li>
            </ul>
          </CardContent>
        </Card>
      </div>
    </div>
  )
}