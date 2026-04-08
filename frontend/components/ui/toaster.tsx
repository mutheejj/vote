"use client"

import React from "react"
import {
  ToastProvider,
  ToastViewport,
  ToastWithIcon,
  ToastTitle,
  ToastDescription,
  ToastClose,
} from "@/components/ui/toast"
import { useNotificationStore } from "@/lib/stores/notificationStore"
import { NotificationType } from "@/lib/enums"
import * as ToastPrimitives from "@radix-ui/react-toast"

export function Toaster() {
  const { notifications, removeNotification } = useNotificationStore()

  // Map NotificationType to toast variant
  const getVariant = (type: NotificationType): "default" | "destructive" | "success" | "warning" | "info" => {
    switch (type) {
      case NotificationType.SUCCESS:
        return "success"
      case NotificationType.ERROR:
        return "destructive"
      case NotificationType.WARNING:
        return "warning"
      case NotificationType.INFO:
        return "info"
      default:
        return "default"
    }
  }

  return (
    <ToastProvider>
      {notifications.map((notification) => (
        <ToastPrimitives.Root
          key={notification.id}
          open={true}
          onOpenChange={(open) => {
            if (!open) {
              removeNotification(notification.id)
            }
          }}
          duration={5000}
        >
          <ToastWithIcon
            variant={getVariant(notification.type)}
            title={notification.title}
            description={notification.message}
            onClose={() => removeNotification(notification.id)}
          />
        </ToastPrimitives.Root>
      ))}
      <ToastViewport />
    </ToastProvider>
  )
}

export default Toaster