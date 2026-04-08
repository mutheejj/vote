"use client"

import React, { useState } from "react"
import {
  Bell,
  Shield,
  Palette,
  Globe,
  Mail,
  Smartphone,
  Monitor,
  Sun,
  Moon,
  Check,
  ChevronRight,
  Volume2,
  VolumeX,
  Eye,
  EyeOff,
  Trash2,
  AlertTriangle,
  Lock,
  RefreshCw,
  LogOut,
  Download
} from "lucide-react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Switch } from "@/components/ui/switch"
import { Label } from "@/components/ui/label"
import { Separator } from "@/components/ui/separator"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"
import { Input } from "@/components/ui/input"
import { useAuth } from "@/lib/hooks/useAuth"
import { useTheme } from "@/components/providers/ThemeProvider"
import { cn } from "@/lib/utils/cn"

export default function SettingsPage() {
  const { user, logout } = useAuth()
  const { theme, setTheme } = useTheme()

  const [notifications, setNotifications] = useState({
    emailNotifications: true,
    smsNotifications: false,
    pushNotifications: true,
    electionReminders: true,
    resultNotifications: true,
    campaignUpdates: false,
    systemAnnouncements: true,
  })

  const [privacy, setPrivacy] = useState({
    showVotingHistory: false,
    showProfile: true,
    twoFactorEnabled: user?.twoFactorEnabled || false,
  })

  const [isSaving, setIsSaving] = useState(false)
  const [savedSection, setSavedSection] = useState<string | null>(null)
  const [deleteDialog, setDeleteDialog] = useState(false)
  const [deleteConfirmText, setDeleteConfirmText] = useState("")

  const handleSave = async (section: string) => {
    setIsSaving(true)
    await new Promise(resolve => setTimeout(resolve, 600))
    setIsSaving(false)
    setSavedSection(section)
    setTimeout(() => setSavedSection(null), 2000)
  }

  const themeOptions = [
    { value: "light", label: "Light", icon: Sun },
    { value: "dark", label: "Dark", icon: Moon },
    { value: "system", label: "System", icon: Monitor },
  ]

  const settingSections = [
    { id: "notifications", label: "Notifications", icon: Bell },
    { id: "privacy", label: "Privacy & Security", icon: Shield },
    { id: "appearance", label: "Appearance", icon: Palette },
    { id: "account", label: "Account", icon: Lock },
  ]

  return (
    <div className="space-y-6 max-w-3xl">
      {/* Header */}
      <div>
        <h1 className="text-2xl font-bold text-gray-900 dark:text-white">Settings</h1>
        <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">
          Manage your account preferences and settings
        </p>
      </div>

      {/* Notifications */}
      <Card className="border-0 shadow-sm" id="notifications">
        <CardHeader className="pb-4">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-sage-50 dark:bg-sage-900/20 rounded-lg">
              <Bell className="h-5 w-5 text-sage-600" />
            </div>
            <div>
              <CardTitle className="text-base">Notifications</CardTitle>
              <CardDescription className="text-xs mt-0.5">Choose how you receive updates and alerts</CardDescription>
            </div>
          </div>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="space-y-4">
            {[
              { key: "emailNotifications", label: "Email Notifications", desc: "Receive updates via email", icon: Mail },
              { key: "smsNotifications", label: "SMS Notifications", desc: "Receive updates via text message", icon: Smartphone },
              { key: "pushNotifications", label: "Push Notifications", desc: "Browser and app push notifications", icon: Bell },
            ].map((item) => (
              <div key={item.key} className="flex items-center justify-between py-2">
                <div className="flex items-start gap-3">
                  <div className="mt-0.5 p-1.5 bg-gray-50 dark:bg-gray-800 rounded">
                    <item.icon className="h-4 w-4 text-gray-500" />
                  </div>
                  <div>
                    <Label className="text-sm font-medium text-gray-900 dark:text-white cursor-pointer">{item.label}</Label>
                    <p className="text-xs text-gray-500 dark:text-gray-400 mt-0.5">{item.desc}</p>
                  </div>
                </div>
                <Switch
                  checked={notifications[item.key as keyof typeof notifications]}
                  onCheckedChange={(val) => setNotifications(p => ({ ...p, [item.key]: val }))}
                  className="data-[state=checked]:bg-sage-600"
                />
              </div>
            ))}

            <Separator />

            <p className="text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wider">Alert Types</p>

            {[
              { key: "electionReminders", label: "Election Reminders", desc: "Upcoming election alerts and deadlines" },
              { key: "resultNotifications", label: "Result Announcements", desc: "When election results are published" },
              { key: "campaignUpdates", label: "Campaign Updates", desc: "Updates from candidates you follow" },
              { key: "systemAnnouncements", label: "System Announcements", desc: "Important platform and maintenance notices" },
            ].map((item) => (
              <div key={item.key} className="flex items-center justify-between py-1.5">
                <div>
                  <Label className="text-sm text-gray-900 dark:text-white cursor-pointer">{item.label}</Label>
                  <p className="text-xs text-gray-500 dark:text-gray-400">{item.desc}</p>
                </div>
                <Switch
                  checked={notifications[item.key as keyof typeof notifications]}
                  onCheckedChange={(val) => setNotifications(p => ({ ...p, [item.key]: val }))}
                  className="data-[state=checked]:bg-sage-600"
                />
              </div>
            ))}
          </div>

          <div className="pt-2">
            <Button
              size="sm"
              onClick={() => handleSave("notifications")}
              disabled={isSaving}
              className="bg-gradient-to-r from-sage-600 to-emerald-600 hover:from-sage-700 hover:to-emerald-700 text-white"
            >
              {savedSection === "notifications" ? (
                <><Check className="h-4 w-4 mr-2" />Saved!</>
              ) : isSaving ? (
                <><RefreshCw className="h-4 w-4 mr-2 animate-spin" />Saving...</>
              ) : "Save Notification Settings"}
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* Privacy & Security */}
      <Card className="border-0 shadow-sm" id="privacy">
        <CardHeader className="pb-4">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-emerald-50 dark:bg-emerald-900/20 rounded-lg">
              <Shield className="h-5 w-5 text-emerald-600" />
            </div>
            <div>
              <CardTitle className="text-base">Privacy & Security</CardTitle>
              <CardDescription className="text-xs mt-0.5">Control your privacy and secure your account</CardDescription>
            </div>
          </div>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="space-y-4">
            <div className="flex items-center justify-between py-2">
              <div className="flex items-start gap-3">
                <div className="mt-0.5 p-1.5 bg-gray-50 dark:bg-gray-800 rounded">
                  <Eye className="h-4 w-4 text-gray-500" />
                </div>
                <div>
                  <Label className="text-sm font-medium text-gray-900 dark:text-white cursor-pointer">Public Profile</Label>
                  <p className="text-xs text-gray-500 dark:text-gray-400 mt-0.5">Allow others to view your basic profile</p>
                </div>
              </div>
              <Switch
                checked={privacy.showProfile}
                onCheckedChange={(val) => setPrivacy(p => ({ ...p, showProfile: val }))}
                className="data-[state=checked]:bg-sage-600"
              />
            </div>

            <div className="flex items-center justify-between py-2">
              <div className="flex items-start gap-3">
                <div className="mt-0.5 p-1.5 bg-gray-50 dark:bg-gray-800 rounded">
                  <EyeOff className="h-4 w-4 text-gray-500" />
                </div>
                <div>
                  <Label className="text-sm font-medium text-gray-900 dark:text-white cursor-pointer">Show Voting History</Label>
                  <p className="text-xs text-gray-500 dark:text-gray-400 mt-0.5">Display participated elections on your profile</p>
                </div>
              </div>
              <Switch
                checked={privacy.showVotingHistory}
                onCheckedChange={(val) => setPrivacy(p => ({ ...p, showVotingHistory: val }))}
                className="data-[state=checked]:bg-sage-600"
              />
            </div>

            <Separator />

            <div className="flex items-center justify-between py-2">
              <div className="flex items-start gap-3">
                <div className="mt-0.5 p-1.5 bg-gray-50 dark:bg-gray-800 rounded">
                  <Shield className="h-4 w-4 text-gray-500" />
                </div>
                <div>
                  <Label className="text-sm font-medium text-gray-900 dark:text-white cursor-pointer">Two-Factor Authentication</Label>
                  <p className="text-xs text-gray-500 dark:text-gray-400 mt-0.5">
                    {privacy.twoFactorEnabled ? "Your account is protected with 2FA" : "Add an extra layer of security"}
                  </p>
                </div>
              </div>
              <div className="flex items-center gap-2">
                {privacy.twoFactorEnabled ? (
                  <Badge className="bg-emerald-100 text-emerald-700 border-0 text-xs">Active</Badge>
                ) : (
                  <Badge className="bg-amber-100 text-amber-700 border-0 text-xs">Inactive</Badge>
                )}
                <Button variant="outline" size="sm" className="h-8 text-xs border-sage-200 dark:border-sage-800">
                  {privacy.twoFactorEnabled ? "Disable" : "Enable"}
                </Button>
              </div>
            </div>
          </div>

          <div className="pt-2">
            <Button
              size="sm"
              onClick={() => handleSave("privacy")}
              disabled={isSaving}
              className="bg-gradient-to-r from-sage-600 to-emerald-600 hover:from-sage-700 hover:to-emerald-700 text-white"
            >
              {savedSection === "privacy" ? (
                <><Check className="h-4 w-4 mr-2" />Saved!</>
              ) : "Save Privacy Settings"}
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* Appearance */}
      <Card className="border-0 shadow-sm" id="appearance">
        <CardHeader className="pb-4">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-purple-50 dark:bg-purple-900/20 rounded-lg">
              <Palette className="h-5 w-5 text-purple-600" />
            </div>
            <div>
              <CardTitle className="text-base">Appearance</CardTitle>
              <CardDescription className="text-xs mt-0.5">Customize how UniElect looks for you</CardDescription>
            </div>
          </div>
        </CardHeader>
        <CardContent className="space-y-4">
          <div>
            <Label className="text-sm font-medium mb-3 block">Theme</Label>
            <div className="grid grid-cols-3 gap-3">
              {themeOptions.map((option) => (
                <button
                  key={option.value}
                  onClick={() => setTheme(option.value as any)}
                  className={cn(
                    "flex flex-col items-center gap-2 p-4 rounded-xl border-2 transition-all",
                    theme === option.value
                      ? "border-sage-500 bg-sage-50 dark:bg-sage-900/30"
                      : "border-gray-200 dark:border-gray-700 hover:border-sage-300 dark:hover:border-sage-700"
                  )}
                >
                  <option.icon className={cn(
                    "h-5 w-5",
                    theme === option.value ? "text-sage-600" : "text-gray-400"
                  )} />
                  <span className={cn(
                    "text-xs font-medium",
                    theme === option.value ? "text-sage-700 dark:text-sage-300" : "text-gray-600 dark:text-gray-400"
                  )}>
                    {option.label}
                  </span>
                  {theme === option.value && (
                    <div className="h-1.5 w-1.5 bg-sage-600 rounded-full" />
                  )}
                </button>
              ))}
            </div>
          </div>

          <div>
            <Label className="text-sm font-medium mb-3 block">Language</Label>
            <Select defaultValue="en">
              <SelectTrigger className="w-full focus:ring-sage-500">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="en">English</SelectItem>
                <SelectItem value="sw">Swahili</SelectItem>
                <SelectItem value="fr">French</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </CardContent>
      </Card>

      {/* Account */}
      <Card className="border-0 shadow-sm" id="account">
        <CardHeader className="pb-4">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-gray-50 dark:bg-gray-800 rounded-lg">
              <Lock className="h-5 w-5 text-gray-600" />
            </div>
            <div>
              <CardTitle className="text-base">Account</CardTitle>
              <CardDescription className="text-xs mt-0.5">Manage your account data and sessions</CardDescription>
            </div>
          </div>
        </CardHeader>
        <CardContent className="space-y-3">
          <button className="w-full flex items-center justify-between p-3 rounded-xl hover:bg-sage-50 dark:hover:bg-sage-900/20 transition-colors group">
            <div className="flex items-center gap-3">
              <Download className="h-4 w-4 text-gray-500 group-hover:text-sage-600 transition-colors" />
              <div className="text-left">
                <p className="text-sm font-medium text-gray-900 dark:text-white">Export My Data</p>
                <p className="text-xs text-gray-500 dark:text-gray-400">Download a copy of your account data</p>
              </div>
            </div>
            <ChevronRight className="h-4 w-4 text-gray-400 group-hover:text-sage-500 transition-colors" />
          </button>

          <Separator />

          <button
            onClick={() => logout()}
            className="w-full flex items-center justify-between p-3 rounded-xl hover:bg-amber-50 dark:hover:bg-amber-900/10 transition-colors group"
          >
            <div className="flex items-center gap-3">
              <LogOut className="h-4 w-4 text-amber-500" />
              <div className="text-left">
                <p className="text-sm font-medium text-amber-700 dark:text-amber-400">Sign Out</p>
                <p className="text-xs text-gray-500 dark:text-gray-400">Sign out from this device</p>
              </div>
            </div>
            <ChevronRight className="h-4 w-4 text-gray-400" />
          </button>

          <Separator />

          <button
            onClick={() => setDeleteDialog(true)}
            className="w-full flex items-center justify-between p-3 rounded-xl hover:bg-red-50 dark:hover:bg-red-900/10 transition-colors group"
          >
            <div className="flex items-center gap-3">
              <Trash2 className="h-4 w-4 text-red-500" />
              <div className="text-left">
                <p className="text-sm font-medium text-red-600 dark:text-red-400">Delete Account</p>
                <p className="text-xs text-gray-500 dark:text-gray-400">Permanently delete your account and all data</p>
              </div>
            </div>
            <ChevronRight className="h-4 w-4 text-gray-400" />
          </button>
        </CardContent>
      </Card>

      {/* Delete Account Dialog */}
      <Dialog open={deleteDialog} onOpenChange={setDeleteDialog}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2 text-red-600">
              <AlertTriangle className="h-5 w-5" />
              Delete Account
            </DialogTitle>
            <DialogDescription>
              This action is <strong>permanent and irreversible</strong>. All your data, voting history, and candidacy records will be deleted.
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-3">
            <Label className="text-sm">
              Type <span className="font-mono font-bold text-red-600">DELETE</span> to confirm
            </Label>
            <Input
              value={deleteConfirmText}
              onChange={e => setDeleteConfirmText(e.target.value)}
              placeholder="Type DELETE to confirm"
              className="border-red-200 focus-visible:ring-red-500"
            />
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setDeleteDialog(false)}>Cancel</Button>
            <Button
              variant="destructive"
              disabled={deleteConfirmText !== "DELETE"}
            >
              Delete My Account
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  )
}
