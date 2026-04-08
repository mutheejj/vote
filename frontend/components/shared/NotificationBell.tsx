"use client"

import React, { useState, useEffect } from "react"
import Link from "next/link"
import { Bell, X, Check, AlertCircle, Info, Calendar, Users, Vote } from "lucide-react"
import { formatDistanceToNow } from "date-fns"
import { useNotificationStore } from "@/lib/stores/notificationStore"
import { cn } from "@/lib/utils/cn"
import { Button } from "@/components/ui/button"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import { Badge } from "@/components/ui/badge"
import { NotificationType } from "@/lib/enums"

interface NotificationBellProps {
  className?: string
}

// Helper function to get notification icon based on type
const getNotificationIcon = (type: NotificationType) => {
  switch (type) {
    case NotificationType.SUCCESS:
      return <Check className="h-4 w-4 text-green-600" />
    case NotificationType.ERROR:
      return <AlertCircle className="h-4 w-4 text-red-600" />
    case NotificationType.WARNING:
      return <AlertCircle className="h-4 w-4 text-amber-600" />
    case NotificationType.INFO:
    default:
      return <Info className="h-4 w-4 text-blue-600" />
  }
}

export function NotificationBell({ className }: NotificationBellProps) {
  const {
    notifications,
    unreadCount,
    isLoading,
    markAsReadOnServer,
    markAllAsReadOnServer,
    deleteNotificationOnServer,
    fetchNotifications,
    fetchNotificationSummary
  } = useNotificationStore()

  const [isOpen, setIsOpen] = useState(false)

  // Fetch notifications when component mounts or when bell is opened
  useEffect(() => {
    fetchNotificationSummary()
  }, [fetchNotificationSummary])

  useEffect(() => {
    if (isOpen) {
      fetchNotifications()
    }
  }, [isOpen, fetchNotifications])

  // Get the most recent notifications (limit to 10 for display)
  const recentNotifications = notifications.slice(0, 10)

  const getNotificationTypeIcon = (title: string) => {
    if (title.toLowerCase().includes('election')) {
      return <Vote className="h-4 w-4 text-blue-600" />
    }
    if (title.toLowerCase().includes('candidate')) {
      return <Users className="h-4 w-4 text-sage-600" />
    }
    if (title.toLowerCase().includes('schedule') || title.toLowerCase().includes('reminder')) {
      return <Calendar className="h-4 w-4 text-orange-600" />
    }
    return <Info className="h-4 w-4 text-blue-600" />
  }

  const handleNotificationClick = (notificationId: string) => {
    markAsReadOnServer(notificationId)
  }

  const handleMarkAllAsRead = () => {
    markAllAsReadOnServer()
  }

  const handleRemoveNotification = (notificationId: string, event: React.MouseEvent) => {
    event.stopPropagation()
    deleteNotificationOnServer(notificationId)
  }

  return (
    <DropdownMenu open={isOpen} onOpenChange={setIsOpen}>
      <DropdownMenuTrigger asChild>
        <Button
          variant="ghost"
          size="sm"
          className={cn("relative p-2", className)}
          aria-label={`Notifications ${unreadCount > 0 ? `(${unreadCount} unread)` : ''}`}
        >
          <Bell className="h-5 w-5" />
          {unreadCount > 0 && (
            <Badge
              variant="destructive"
              className="absolute -top-1 -right-1 h-5 w-5 flex items-center justify-center p-0 text-xs"
            >
              {unreadCount > 99 ? '99+' : unreadCount}
            </Badge>
          )}
        </Button>
      </DropdownMenuTrigger>

      <DropdownMenuContent
        className="w-80 p-0"
        align="end"
        sideOffset={8}
      >
        {/* Header */}
        <div className="flex items-center justify-between p-4 border-b">
          <h3 className="font-semibold text-sm">Notifications</h3>
          {unreadCount > 0 && (
            <Button
              variant="ghost"
              size="sm"
              onClick={handleMarkAllAsRead}
              className="text-xs text-blue-600 hover:text-blue-700"
            >
              Mark all read
            </Button>
          )}
        </div>

        {/* Notifications list */}
        <div className="max-h-96 overflow-y-auto">
          {isLoading ? (
            <div className="p-8 text-center">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto mb-2"></div>
              <p className="text-sm text-gray-500">Loading notifications...</p>
            </div>
          ) : recentNotifications.length === 0 ? (
            <div className="p-8 text-center">
              <Bell className="h-8 w-8 text-gray-400 mx-auto mb-2" />
              <p className="text-sm text-gray-500">No notifications yet</p>
              <p className="text-xs text-gray-400 mt-1">
                You'll see important updates here
              </p>
            </div>
          ) : (
            <div className="py-2">
              {recentNotifications.map((notification) => (
                <div
                  key={notification.id}
                  className={cn(
                    "group relative flex items-start gap-3 px-4 py-3 hover:bg-gray-50 cursor-pointer transition-colors",
                    !notification.read && "bg-blue-50/50"
                  )}
                  onClick={() => handleNotificationClick(notification.id)}
                >
                  {/* Icon */}
                  <div className="flex-shrink-0 mt-0.5">
                    {getNotificationTypeIcon(notification.title)}
                  </div>

                  {/* Content */}
                  <div className="flex-1 min-w-0">
                    <div className="flex items-start justify-between gap-2">
                      <h4 className={cn(
                        "text-sm leading-5",
                        !notification.read ? "font-semibold text-gray-900" : "font-medium text-gray-700"
                      )}>
                        {notification.title}
                      </h4>

                      {/* Remove button */}
                      <Button
                        variant="ghost"
                        size="sm"
                        className="opacity-0 group-hover:opacity-100 h-6 w-6 p-0 flex-shrink-0"
                        onClick={(e) => handleRemoveNotification(notification.id, e)}
                        aria-label="Remove notification"
                      >
                        <X className="h-3 w-3" />
                      </Button>
                    </div>

                    <p className="text-sm text-gray-600 mt-1 line-clamp-2">
                      {notification.message}
                    </p>

                    <div className="flex items-center justify-between mt-2">
                      <span className="text-xs text-gray-500">
                        {formatDistanceToNow(new Date(notification.timestamp), { addSuffix: true })}
                      </span>

                      {notification.actionUrl && (
                        <Link
                          href={notification.actionUrl}
                          className="text-xs text-blue-600 hover:text-blue-700 font-medium"
                          onClick={(e) => e.stopPropagation()}
                        >
                          {notification.actionText || 'View'}
                        </Link>
                      )}
                    </div>

                    {/* Unread indicator */}
                    {!notification.read && (
                      <div className="absolute left-1 top-1/2 transform -translate-y-1/2 w-2 h-2 bg-blue-600 rounded-full"></div>
                    )}
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Footer */}
        {notifications.length > recentNotifications.length && (
          <div className="border-t p-3">
            <Link
              href="/notifications"
              className="block text-center text-sm text-blue-600 hover:text-blue-700 font-medium"
              onClick={() => setIsOpen(false)}
            >
              View all notifications
            </Link>
          </div>
        )}
      </DropdownMenuContent>
    </DropdownMenu>
  )
}

// Quick notification components for specific use cases
interface QuickNotificationProps {
  type: NotificationType
  title: string
  message: string
  actionUrl?: string
  actionText?: string
  onDismiss?: () => void
}

export function QuickNotification({
  type,
  title,
  message,
  actionUrl,
  actionText,
  onDismiss,
}: QuickNotificationProps) {
  const getTypeStyles = () => {
    switch (type) {
      case NotificationType.SUCCESS:
        return "bg-green-50 border-green-200 text-green-800"
      case NotificationType.ERROR:
        return "bg-red-50 border-red-200 text-red-800"
      case NotificationType.WARNING:
        return "bg-amber-50 border-amber-200 text-amber-800"
      case NotificationType.INFO:
      default:
        return "bg-blue-50 border-blue-200 text-blue-800"
    }
  }

  return (
    <div className={cn("border rounded-lg p-4", getTypeStyles())}>
      <div className="flex items-start justify-between">
        <div className="flex items-start gap-3">
          <div className="flex-shrink-0 mt-0.5">
            {getNotificationIcon(type)}
          </div>
          <div>
            <h4 className="font-medium text-sm">{title}</h4>
            <p className="text-sm mt-1">{message}</p>
            {actionUrl && (
              <Link
                href={actionUrl}
                className="text-sm font-medium hover:underline mt-2 inline-block"
              >
                {actionText || 'Learn more'}
              </Link>
            )}
          </div>
        </div>
        {onDismiss && (
          <Button
            variant="ghost"
            size="sm"
            onClick={onDismiss}
            className="h-6 w-6 p-0"
          >
            <X className="h-4 w-4" />
          </Button>
        )}
      </div>
    </div>
  )
}

export default NotificationBell