// lib/stores/notificationStore.ts
// Notifications Zustand store

import { create } from 'zustand';
import { Notification } from '../types';
import { NotificationType } from '../enums';

interface NotificationState {
  notifications: Notification[];
  unreadCount: number;
  isLoading: boolean;
}

interface NotificationActions {
  addNotification: (notification: Omit<Notification, 'id' | 'timestamp' | 'read'>) => void;
  markAsRead: (id: string) => void;
  markAllAsRead: () => void;
  removeNotification: (id: string) => void;
  clearNotifications: () => void;
  markAsReadOnServer: (id: string) => Promise<void>;
  markAllAsReadOnServer: () => Promise<void>;
  deleteNotificationOnServer: (id: string) => Promise<void>;
  fetchNotifications: () => Promise<void>;
  fetchNotificationSummary: () => Promise<void>;
  toast: {
    success: (title: string, message?: string) => void;
    error: (title: string, message?: string) => void;
    warning: (title: string, message?: string) => void;
    info: (title: string, message?: string) => void;
  };
}

export const useNotificationStore = create<NotificationState & NotificationActions>((set, get) => ({
  // State
  notifications: [],
  unreadCount: 0,
  isLoading: false,

  // Actions
  addNotification: (notification) => {
    const newNotification: Notification = {
      ...notification,
      id: crypto.randomUUID(),
      timestamp: new Date(),
      read: false,
    };

    set((state) => ({
      notifications: [newNotification, ...state.notifications],
      unreadCount: state.unreadCount + 1,
    }));

    // Auto-remove notification after 5 seconds for toast-like notifications
    if (!notification.actionUrl) {
      setTimeout(() => {
        get().removeNotification(newNotification.id);
      }, 5000);
    }
  },

  markAsRead: (id) => {
    set((state) => {
      const notification = state.notifications.find((n) => n.id === id);
      if (!notification || notification.read) return state;

      return {
        notifications: state.notifications.map((n) =>
          n.id === id ? { ...n, read: true } : n
        ),
        unreadCount: Math.max(0, state.unreadCount - 1),
      };
    });
  },

  markAllAsRead: () => {
    set((state) => ({
      notifications: state.notifications.map((n) => ({ ...n, read: true })),
      unreadCount: 0,
    }));
  },

  removeNotification: (id) => {
    set((state) => {
      const notification = state.notifications.find((n) => n.id === id);
      const unreadDecrement = notification && !notification.read ? 1 : 0;

      return {
        notifications: state.notifications.filter((n) => n.id !== id),
        unreadCount: Math.max(0, state.unreadCount - unreadDecrement),
      };
    });
  },

  clearNotifications: () => {
    set({
      notifications: [],
      unreadCount: 0,
    });
  },

  // Server methods
  markAsReadOnServer: async (id: string) => {
    try {
      // TODO: Implement API call to mark as read on server
      // For now, just mark locally
      get().markAsRead(id);
    } catch (error) {
      console.error('Failed to mark notification as read on server:', error);
    }
  },

  markAllAsReadOnServer: async () => {
    try {
      // TODO: Implement API call to mark all as read on server
      // For now, just mark locally
      get().markAllAsRead();
    } catch (error) {
      console.error('Failed to mark all notifications as read on server:', error);
    }
  },

  deleteNotificationOnServer: async (id: string) => {
    try {
      // TODO: Implement API call to delete notification on server
      // For now, just remove locally
      get().removeNotification(id);
    } catch (error) {
      console.error('Failed to delete notification on server:', error);
    }
  },

  fetchNotifications: async () => {
    try {
      set({ isLoading: true });
      // TODO: Implement API call to fetch notifications
      // For now, just set loading to false
      set({ isLoading: false });
    } catch (error) {
      console.error('Failed to fetch notifications:', error);
      set({ isLoading: false });
    }
  },

  fetchNotificationSummary: async () => {
    try {
      set({ isLoading: true });
      // TODO: Implement API call to fetch notification summary
      // For now, just set loading to false
      set({ isLoading: false });
    } catch (error) {
      console.error('Failed to fetch notification summary:', error);
      set({ isLoading: false });
    }
  },

  // Toast helpers
  toast: {
    success: (title: string, message?: string) => {
      get().addNotification({
        type: NotificationType.SUCCESS,
        title,
        message: message || '',
      });
    },

    error: (title: string, message?: string) => {
      get().addNotification({
        type: NotificationType.ERROR,
        title,
        message: message || '',
      });
    },

    warning: (title: string, message?: string) => {
      get().addNotification({
        type: NotificationType.WARNING,
        title,
        message: message || '',
      });
    },

    info: (title: string, message?: string) => {
      get().addNotification({
        type: NotificationType.INFO,
        title,
        message: message || '',
      });
    },
  },
}));