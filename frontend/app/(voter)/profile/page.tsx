"use client"

import React, { useState } from "react"
import {
  User,
  Mail,
  Phone,
  GraduationCap,
  BookOpen,
  Calendar,
  Shield,
  CheckCircle,
  Edit,
  Save,
  X,
  Camera,
  Lock,
  Eye,
  EyeOff,
  AlertCircle,
  RefreshCw
} from "lucide-react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Badge } from "@/components/ui/badge"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { Alert, AlertDescription } from "@/components/ui/alert"
import { Separator } from "@/components/ui/separator"
import { useAuth } from "@/lib/hooks/useAuth"
import { useVoting } from "@/lib/hooks/useVoting"
import { cn } from "@/lib/utils/cn"
import { format } from "date-fns"

export default function ProfilePage() {
  const { user, isLoading } = useAuth()
  const { votingHistory } = useVoting()

  const [isEditing, setIsEditing] = useState(false)
  const [isSaving, setIsSaving] = useState(false)
  const [saveSuccess, setSaveSuccess] = useState(false)
  const [showPasswordSection, setShowPasswordSection] = useState(false)
  const [showCurrentPassword, setShowCurrentPassword] = useState(false)
  const [showNewPassword, setShowNewPassword] = useState(false)

  const [formData, setFormData] = useState({
    firstName: user?.firstName || "",
    lastName: user?.lastName || "",
    phone: user?.phone || "",
  })

  const [passwordData, setPasswordData] = useState({
    currentPassword: "",
    newPassword: "",
    confirmPassword: "",
  })

  const handleSave = async () => {
    setIsSaving(true)
    try {
      await new Promise(resolve => setTimeout(resolve, 800))
      setSaveSuccess(true)
      setIsEditing(false)
      setTimeout(() => setSaveSuccess(false), 3000)
    } finally {
      setIsSaving(false)
    }
  }

  const handleCancel = () => {
    setFormData({
      firstName: user?.firstName || "",
      lastName: user?.lastName || "",
      phone: user?.phone || "",
    })
    setIsEditing(false)
  }

  if (isLoading || !user) {
    return (
      <div className="flex items-center justify-center py-20">
        <div className="relative">
          <div className="h-12 w-12 rounded-full border-4 border-sage-100 dark:border-sage-900" />
          <div className="absolute inset-0 h-12 w-12 animate-spin rounded-full border-4 border-t-sage-600 border-r-transparent border-b-transparent border-l-transparent" />
        </div>
      </div>
    )
  }

  const initials = `${user.firstName?.[0] || ""}${user.lastName?.[0] || ""}`.toUpperCase()

  return (
    <div className="space-y-6 max-w-4xl">
      {/* Header */}
      <div>
        <h1 className="text-2xl font-bold text-gray-900 dark:text-white">My Profile</h1>
        <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">
          Manage your personal information and account settings
        </p>
      </div>

      {saveSuccess && (
        <Alert className="border-emerald-200 bg-emerald-50 dark:bg-emerald-900/20 dark:border-emerald-800">
          <CheckCircle className="h-4 w-4 text-emerald-600" />
          <AlertDescription className="text-emerald-700 dark:text-emerald-300">
            Profile updated successfully!
          </AlertDescription>
        </Alert>
      )}

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Profile Card */}
        <div className="lg:col-span-1 space-y-4">
          <Card className="border-0 shadow-sm">
            <CardContent className="pt-6 pb-4 flex flex-col items-center text-center">
              <div className="relative group mb-4">
                <Avatar className="h-24 w-24 border-4 border-white dark:border-gray-800 shadow-md">
                  <AvatarImage src={user.profileImage || ""} alt={`${user.firstName} ${user.lastName}`} />
                  <AvatarFallback className="text-xl font-bold bg-gradient-to-br from-sage-200 to-emerald-200 dark:from-sage-700 dark:to-emerald-700 text-sage-800 dark:text-sage-100">
                    {initials}
                  </AvatarFallback>
                </Avatar>
                <button className="absolute bottom-0 right-0 h-7 w-7 bg-sage-600 hover:bg-sage-700 text-white rounded-full flex items-center justify-center shadow-md opacity-0 group-hover:opacity-100 transition-opacity">
                  <Camera className="h-3.5 w-3.5" />
                </button>
              </div>

              <h2 className="text-lg font-bold text-gray-900 dark:text-white">
                {user.firstName} {user.lastName}
              </h2>
              <p className="text-sm text-gray-500 dark:text-gray-400">{user.email}</p>

              <div className="flex items-center gap-2 mt-2">
                <Badge className="bg-gradient-to-r from-sage-100 to-emerald-100 dark:from-sage-900/40 dark:to-emerald-900/40 text-sage-700 dark:text-sage-300 border-0 text-xs">
                  {user.role.replace("_", " ")}
                </Badge>
                {user.isVerified && (
                  <Badge className="bg-emerald-100 dark:bg-emerald-900/30 text-emerald-700 dark:text-emerald-300 border-0 text-xs">
                    <CheckCircle className="h-3 w-3 mr-1" />
                    Verified
                  </Badge>
                )}
              </div>

              <Separator className="my-4 w-full" />

              <div className="w-full space-y-2 text-left">
                <div className="flex items-center justify-between text-sm">
                  <span className="text-gray-500 dark:text-gray-400">Student ID</span>
                  <span className="font-medium text-gray-900 dark:text-white text-xs font-mono">{user.studentId}</span>
                </div>
                <div className="flex items-center justify-between text-sm">
                  <span className="text-gray-500 dark:text-gray-400">Votes Cast</span>
                  <span className="font-medium text-gray-900 dark:text-white">{votingHistory?.length || 0}</span>
                </div>
                {user.lastLogin && (
                  <div className="flex items-center justify-between text-sm">
                    <span className="text-gray-500 dark:text-gray-400">Last Login</span>
                    <span className="text-xs text-gray-600 dark:text-gray-400">
                      {format(new Date(user.lastLogin), "MMM d, yyyy")}
                    </span>
                  </div>
                )}
                <div className="flex items-center justify-between text-sm">
                  <span className="text-gray-500 dark:text-gray-400">Member since</span>
                  <span className="text-xs text-gray-600 dark:text-gray-400">
                    {user.createdAt ? format(new Date(user.createdAt), "MMM yyyy") : "—"}
                  </span>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Account Security */}
          <Card className="border-0 shadow-sm">
            <CardHeader className="pb-3">
              <CardTitle className="text-sm flex items-center gap-2">
                <Shield className="h-4 w-4 text-sage-600" />
                Security Status
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <CheckCircle className="h-4 w-4 text-emerald-500" />
                  <span className="text-sm text-gray-700 dark:text-gray-300">Email verified</span>
                </div>
                <Badge className="bg-emerald-100 text-emerald-700 border-0 text-xs">Active</Badge>
              </div>
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  {user.twoFactorEnabled ? (
                    <CheckCircle className="h-4 w-4 text-emerald-500" />
                  ) : (
                    <AlertCircle className="h-4 w-4 text-amber-500" />
                  )}
                  <span className="text-sm text-gray-700 dark:text-gray-300">Two-factor auth</span>
                </div>
                <Badge className={cn("border-0 text-xs", user.twoFactorEnabled
                  ? "bg-emerald-100 text-emerald-700"
                  : "bg-amber-100 text-amber-700"
                )}>
                  {user.twoFactorEnabled ? "Enabled" : "Disabled"}
                </Badge>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Edit Form */}
        <div className="lg:col-span-2 space-y-4">
          <Card className="border-0 shadow-sm">
            <CardHeader className="pb-4">
              <div className="flex items-center justify-between">
                <div>
                  <CardTitle className="text-lg">Personal Information</CardTitle>
                  <CardDescription className="text-sm">Update your personal details</CardDescription>
                </div>
                {!isEditing ? (
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => setIsEditing(true)}
                    className="border-sage-200 dark:border-sage-800 text-sage-700 dark:text-sage-300"
                  >
                    <Edit className="h-4 w-4 mr-2" />
                    Edit
                  </Button>
                ) : (
                  <div className="flex items-center gap-2">
                    <Button variant="outline" size="sm" onClick={handleCancel}>
                      <X className="h-4 w-4 mr-2" />
                      Cancel
                    </Button>
                    <Button
                      size="sm"
                      onClick={handleSave}
                      disabled={isSaving}
                      className="bg-gradient-to-r from-sage-600 to-emerald-600 text-white"
                    >
                      {isSaving ? <RefreshCw className="h-4 w-4 mr-2 animate-spin" /> : <Save className="h-4 w-4 mr-2" />}
                      Save
                    </Button>
                  </div>
                )}
              </div>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label>First Name</Label>
                  {isEditing ? (
                    <Input
                      value={formData.firstName}
                      onChange={e => setFormData(p => ({ ...p, firstName: e.target.value }))}
                      className="focus-visible:ring-sage-500"
                    />
                  ) : (
                    <div className="flex items-center gap-2 p-2.5 bg-gray-50 dark:bg-gray-800/50 rounded-lg text-sm text-gray-900 dark:text-white">
                      <User className="h-4 w-4 text-gray-400 flex-shrink-0" />
                      {user.firstName}
                    </div>
                  )}
                </div>
                <div className="space-y-2">
                  <Label>Last Name</Label>
                  {isEditing ? (
                    <Input
                      value={formData.lastName}
                      onChange={e => setFormData(p => ({ ...p, lastName: e.target.value }))}
                      className="focus-visible:ring-sage-500"
                    />
                  ) : (
                    <div className="flex items-center gap-2 p-2.5 bg-gray-50 dark:bg-gray-800/50 rounded-lg text-sm text-gray-900 dark:text-white">
                      <User className="h-4 w-4 text-gray-400 flex-shrink-0" />
                      {user.lastName}
                    </div>
                  )}
                </div>
              </div>

              <div className="space-y-2">
                <Label>Email Address</Label>
                <div className="flex items-center gap-2 p-2.5 bg-gray-50 dark:bg-gray-800/50 rounded-lg text-sm text-gray-900 dark:text-white">
                  <Mail className="h-4 w-4 text-gray-400 flex-shrink-0" />
                  {user.email}
                  {user.isVerified && <CheckCircle className="h-4 w-4 text-emerald-500 ml-auto" />}
                </div>
              </div>

              <div className="space-y-2">
                <Label>Phone Number</Label>
                {isEditing ? (
                  <Input
                    value={formData.phone}
                    onChange={e => setFormData(p => ({ ...p, phone: e.target.value }))}
                    placeholder="+254 7XX XXX XXX"
                    className="focus-visible:ring-sage-500"
                  />
                ) : (
                  <div className="flex items-center gap-2 p-2.5 bg-gray-50 dark:bg-gray-800/50 rounded-lg text-sm text-gray-900 dark:text-white">
                    <Phone className="h-4 w-4 text-gray-400 flex-shrink-0" />
                    {user.phone || <span className="text-gray-400">Not provided</span>}
                  </div>
                )}
              </div>

              <Separator />

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label>Faculty</Label>
                  <div className="flex items-center gap-2 p-2.5 bg-gray-50 dark:bg-gray-800/50 rounded-lg text-sm text-gray-900 dark:text-white">
                    <GraduationCap className="h-4 w-4 text-gray-400 flex-shrink-0" />
                    {user.faculty}
                  </div>
                </div>
                <div className="space-y-2">
                  <Label>Department</Label>
                  <div className="flex items-center gap-2 p-2.5 bg-gray-50 dark:bg-gray-800/50 rounded-lg text-sm text-gray-900 dark:text-white">
                    <BookOpen className="h-4 w-4 text-gray-400 flex-shrink-0" />
                    {user.department}
                  </div>
                </div>
                <div className="space-y-2">
                  <Label>Course</Label>
                  <div className="flex items-center gap-2 p-2.5 bg-gray-50 dark:bg-gray-800/50 rounded-lg text-sm text-gray-900 dark:text-white">
                    <BookOpen className="h-4 w-4 text-gray-400 flex-shrink-0" />
                    {user.course}
                  </div>
                </div>
                <div className="space-y-2">
                  <Label>Year of Study</Label>
                  <div className="flex items-center gap-2 p-2.5 bg-gray-50 dark:bg-gray-800/50 rounded-lg text-sm text-gray-900 dark:text-white">
                    <Calendar className="h-4 w-4 text-gray-400 flex-shrink-0" />
                    Year {user.yearOfStudy} &middot; Admitted {user.admissionYear}
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Change Password */}
          <Card className="border-0 shadow-sm">
            <CardHeader className="pb-4">
              <div className="flex items-center justify-between">
                <div>
                  <CardTitle className="text-base flex items-center gap-2">
                    <Lock className="h-4 w-4 text-sage-600" />
                    Change Password
                  </CardTitle>
                  <CardDescription className="text-sm mt-1">Update your account password</CardDescription>
                </div>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => setShowPasswordSection(!showPasswordSection)}
                  className="border-sage-200 dark:border-sage-800"
                >
                  {showPasswordSection ? "Cancel" : "Change"}
                </Button>
              </div>
            </CardHeader>
            {showPasswordSection && (
              <CardContent className="space-y-4">
                <div className="space-y-2">
                  <Label>Current Password</Label>
                  <div className="relative">
                    <Input
                      type={showCurrentPassword ? "text" : "password"}
                      value={passwordData.currentPassword}
                      onChange={e => setPasswordData(p => ({ ...p, currentPassword: e.target.value }))}
                      className="pr-10 focus-visible:ring-sage-500"
                    />
                    <button
                      type="button"
                      onClick={() => setShowCurrentPassword(!showCurrentPassword)}
                      className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600"
                    >
                      {showCurrentPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                    </button>
                  </div>
                </div>
                <div className="space-y-2">
                  <Label>New Password</Label>
                  <div className="relative">
                    <Input
                      type={showNewPassword ? "text" : "password"}
                      value={passwordData.newPassword}
                      onChange={e => setPasswordData(p => ({ ...p, newPassword: e.target.value }))}
                      className="pr-10 focus-visible:ring-sage-500"
                    />
                    <button
                      type="button"
                      onClick={() => setShowNewPassword(!showNewPassword)}
                      className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600"
                    >
                      {showNewPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                    </button>
                  </div>
                </div>
                <div className="space-y-2">
                  <Label>Confirm New Password</Label>
                  <Input
                    type="password"
                    value={passwordData.confirmPassword}
                    onChange={e => setPasswordData(p => ({ ...p, confirmPassword: e.target.value }))}
                    className="focus-visible:ring-sage-500"
                  />
                </div>
                <Button
                  className="w-full bg-gradient-to-r from-sage-600 to-emerald-600 hover:from-sage-700 hover:to-emerald-700 text-white"
                  disabled={!passwordData.currentPassword || !passwordData.newPassword || passwordData.newPassword !== passwordData.confirmPassword}
                >
                  Update Password
                </Button>
              </CardContent>
            )}
          </Card>
        </div>
      </div>
    </div>
  )
}
