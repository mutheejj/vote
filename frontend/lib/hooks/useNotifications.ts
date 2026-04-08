// lib/hooks/useNotifications.ts
// Notification management hook integrating with notificationStore and providing enhanced features

import { useCallback, useEffect, useMemo, useState } from 'react';
import { useNotificationStore } from '../stores/notificationStore';
import { useAuth } from './useAuth';
import { useWebSocket } from './useWebSocket';
import {
  Notification as NotificationData,
  DashboardNotification
} from '../types';
import { NotificationType, NotificationPriority } from '../enums';

// Alias to avoid conflict with browser's Notification API
type Notification = NotificationData;

interface NotificationPreferences {
  emailNotifications: boolean;
  pushNotifications: boolean;
  soundEnabled: boolean;
  electionReminders: boolean;
  votingDeadlines: boolean;
  resultNotifications: boolean;
  systemAlerts: boolean;
}

interface UseNotificationsOptions {
  enableSound?: boolean;
  enableWebSocket?: boolean;
  maxNotifications?: number;
  autoMarkAsRead?: boolean;
  persistPreferences?: boolean;
}

interface UseNotificationsReturn {
  // State
  notifications: Notification[];
  unreadCount: number;
  preferences: NotificationPreferences;

  // Core Notification Functions
  addNotification: (notification: Omit<Notification, 'id' | 'timestamp' | 'read'>) => void;
  markAsRead: (id: string) => void;
  markAllAsRead: () => void;
  removeNotification: (id: string) => void;
  clearNotifications: () => void;

  // Enhanced Toast Functions
  toast: {
    success: (title: string, message?: string, options?: ToastOptions) => string;
    error: (title: string, message?: string, options?: ToastOptions) => string;
    warning: (title: string, message?: string, options?: ToastOptions) => string;
    info: (title: string, message?: string, options?: ToastOptions) => string;
    custom: (notification: Partial<Notification>) => string;
  };

  // Notification Management
  getNotificationById: (id: string) => Notification | undefined;
  getNotificationsByType: (type: NotificationType) => Notification[];
  getRecentNotifications: (limit?: number) => Notification[];
  hasUnreadNotifications: boolean;

  // Preferences Management
  updatePreferences: (preferences: Partial<NotificationPreferences>) => void;
  resetPreferences: () => void;

  // Filtering and Searching
  filterNotifications: (filter: NotificationFilter) => Notification[];
  searchNotifications: (query: string) => Notification[];

  // Bulk Operations
  markMultipleAsRead: (ids: string[]) => void;
  removeMultiple: (ids: string[]) => void;
  exportNotifications: (format?: 'json' | 'csv') => void;

  // System Notifications
  requestPermission: () => Promise<NotificationPermission>;
  showBrowserNotification: (title: string, options?: NotificationOptions) => void;

  // Utility Functions
  playNotificationSound: () => void;
  getTotalNotifications: () => number;
  getNotificationStats: () => NotificationStats;
}

interface ToastOptions {
  duration?: number;
  persistent?: boolean;
  actionText?: string;
  actionUrl?: string;
  sound?: boolean;
}

interface NotificationFilter {
  type?: NotificationType;
  read?: boolean;
  dateFrom?: Date;
  dateTo?: Date;
  hasAction?: boolean;
}

interface NotificationStats {
  total: number;
  unread: number;
  byType: Record<NotificationType, number>;
  recentCount: number;
  oldestUnread?: Date;
}

const DEFAULT_PREFERENCES: NotificationPreferences = {
  emailNotifications: true,
  pushNotifications: true,
  soundEnabled: true,
  electionReminders: true,
  votingDeadlines: true,
  resultNotifications: true,
  systemAlerts: true
};

export function useNotifications(options: UseNotificationsOptions = {}): UseNotificationsReturn {
  const {
    enableSound = true,
    enableWebSocket = true,
    maxNotifications = 100,
    autoMarkAsRead = false,
    persistPreferences = true
  } = options;

  const { isAuthenticated } = useAuth();
  const { subscribe, isConnected } = useWebSocket({ autoConnect: enableWebSocket });

  const {
    notifications,
    unreadCount,
    addNotification: storeAddNotification,
    markAsRead: storeMarkAsRead,
    markAllAsRead: storeMarkAllAsRead,
    removeNotification: storeRemoveNotification,
    clearNotifications: storeClearNotifications,
    toast: storeToast
  } = useNotificationStore();

  // Local state for preferences
  const [preferences, setPreferences] = useState<NotificationPreferences>(() => {
    if (persistPreferences && typeof window !== 'undefined') {
      const saved = localStorage.getItem('jkuat-voting-notification-preferences');
      return saved ? { ...DEFAULT_PREFERENCES, ...JSON.parse(saved) } : DEFAULT_PREFERENCES;
    }
    return DEFAULT_PREFERENCES;
  });

  // Audio element for notification sounds
  const [audioElement, setAudioElement] = useState<HTMLAudioElement | null>(null);

  // Initialize audio element
  useEffect(() => {
    if (enableSound && typeof window !== 'undefined') {
      try {
        const audio = new Audio('/sounds/notification.mp3');
        audio.preload = 'auto';
        audio.onerror = () => {
          // Sound file not found, disable sound silently
          console.info('Notification sound file not found, sound disabled');
          setAudioElement(null);
        };
        setAudioElement(audio);
      } catch (error) {
        console.info('Failed to load notification sound:', error);
        setAudioElement(null);
      }
    }
  }, [enableSound]);

  // Subscribe to WebSocket notifications
  useEffect(() => {
    if (enableWebSocket && isConnected) {
      const unsubscribe = subscribe('notification', (data: DashboardNotification) => {
        addNotification({
          type: data.type as NotificationType,
          title: data.title,
          message: data.message,
          actionUrl: data.actionUrl,
          actionText: data.actionText || 'View'
        });
      });

      return unsubscribe;
    }
  }, [enableWebSocket, isConnected, subscribe]);

  // Persist preferences
  useEffect(() => {
    if (persistPreferences && typeof window !== 'undefined') {
      localStorage.setItem('jkuat-voting-notification-preferences', JSON.stringify(preferences));
    }
  }, [preferences, persistPreferences]);

  // Trim notifications if exceeding max limit
  useEffect(() => {
    if (notifications.length > maxNotifications) {
      const excess = notifications.length - maxNotifications;
      const toRemove = notifications
        .filter(n => n.read)
        .sort((a, b) => new Date(a.timestamp).getTime() - new Date(b.timestamp).getTime())
        .slice(0, excess);

      toRemove.forEach(notification => {
        storeRemoveNotification(notification.id);
      });
    }
  }, [notifications.length, maxNotifications, notifications, storeRemoveNotification]);

  // Core Notification Functions
  const addNotification = useCallback((notification: Omit<Notification, 'id' | 'timestamp' | 'read'>): string => {
    // Generate ID first
    const id = crypto.randomUUID();

    // Add to store
    storeAddNotification(notification);

    // Play sound if enabled
    if (enableSound && preferences.soundEnabled && audioElement) {
      playNotificationSound();
    }

    // Show browser notification if permission granted
    if (preferences.pushNotifications && Notification.permission === 'granted') {
      showBrowserNotification(notification.title, {
        body: notification.message,
        icon: '/icons/notification-icon.png',
        tag: id
      });
    }

    return id;
  }, [storeAddNotification, enableSound, preferences.soundEnabled, preferences.pushNotifications, audioElement]);

  const markAsRead = useCallback((id: string) => {
    storeMarkAsRead(id);
  }, [storeMarkAsRead]);

  const markAllAsRead = useCallback(() => {
    storeMarkAllAsRead();
  }, [storeMarkAllAsRead]);

  const removeNotification = useCallback((id: string) => {
    storeRemoveNotification(id);
  }, [storeRemoveNotification]);

  const clearNotifications = useCallback(() => {
    storeClearNotifications();
  }, [storeClearNotifications]);

  // Enhanced Toast Functions
  const toast = useMemo(() => ({
    success: (title: string, message?: string, options: ToastOptions = {}) => {
      const notification = {
        type: NotificationType.SUCCESS,
        title,
        message: message || '',
        actionText: options.actionText,
        actionUrl: options.actionUrl
      };

      const id = addNotification(notification);

      // Handle persistent toasts
      if (!options.persistent && !options.actionUrl) {
        setTimeout(() => {
          removeNotification(id);
        }, options.duration || 5000);
      }

      return id;
    },

    error: (title: string, message?: string, options: ToastOptions = {}) => {
      const notification = {
        type: NotificationType.ERROR,
        title,
        message: message || '',
        actionText: options.actionText,
        actionUrl: options.actionUrl
      };

      const id = addNotification(notification);

      // Error toasts are persistent by default unless specified
      if (!options.persistent && !options.actionUrl && options.duration !== undefined) {
        setTimeout(() => {
          removeNotification(id);
        }, options.duration);
      }

      return id;
    },

    warning: (title: string, message?: string, options: ToastOptions = {}) => {
      const notification = {
        type: NotificationType.WARNING,
        title,
        message: message || '',
        actionText: options.actionText,
        actionUrl: options.actionUrl
      };

      const id = addNotification(notification);

      if (!options.persistent && !options.actionUrl) {
        setTimeout(() => {
          removeNotification(id);
        }, options.duration || 7000);
      }

      return id;
    },

    info: (title: string, message?: string, options: ToastOptions = {}) => {
      const notification = {
        type: NotificationType.INFO,
        title,
        message: message || '',
        actionText: options.actionText,
        actionUrl: options.actionUrl
      };

      const id = addNotification(notification);

      if (!options.persistent && !options.actionUrl) {
        setTimeout(() => {
          removeNotification(id);
        }, options.duration || 5000);
      }

      return id;
    },

    custom: (notification: Partial<Notification>) => {
      return addNotification({
        type: notification.type || NotificationType.INFO,
        title: notification.title || '',
        message: notification.message || '',
        actionText: notification.actionText,
        actionUrl: notification.actionUrl
      });
    }
  }), [addNotification, removeNotification]);

  // Notification Management
  const getNotificationById = useCallback((id: string) => {
    return notifications.find(n => n.id === id);
  }, [notifications]);

  const getNotificationsByType = useCallback((type: NotificationType) => {
    return notifications.filter(n => n.type === type);
  }, [notifications]);

  const getRecentNotifications = useCallback((limit: number = 10) => {
    return notifications
      .sort((a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime())
      .slice(0, limit);
  }, [notifications]);

  const hasUnreadNotifications = useMemo(() => {
    return unreadCount > 0;
  }, [unreadCount]);

  // Preferences Management
  const updatePreferences = useCallback((newPreferences: Partial<NotificationPreferences>) => {
    setPreferences(prev => ({ ...prev, ...newPreferences }));
  }, []);

  const resetPreferences = useCallback(() => {
    setPreferences(DEFAULT_PREFERENCES);
  }, []);

  // Filtering and Searching
  const filterNotifications = useCallback((filter: NotificationFilter) => {
    return notifications.filter(notification => {
      if (filter.type && notification.type !== filter.type) return false;
      if (filter.read !== undefined && notification.read !== filter.read) return false;
      if (filter.hasAction !== undefined) {
        const hasAction = Boolean(notification.actionUrl);
        if (hasAction !== filter.hasAction) return false;
      }
      if (filter.dateFrom && new Date(notification.timestamp) < filter.dateFrom) return false;
      if (filter.dateTo && new Date(notification.timestamp) > filter.dateTo) return false;
      return true;
    });
  }, [notifications]);

  const searchNotifications = useCallback((query: string) => {
    const lowerQuery = query.toLowerCase();
    return notifications.filter(notification =>
      notification.title.toLowerCase().includes(lowerQuery) ||
      notification.message.toLowerCase().includes(lowerQuery)
    );
  }, [notifications]);

  // Bulk Operations
  const markMultipleAsRead = useCallback((ids: string[]) => {
    ids.forEach(id => markAsRead(id));
  }, [markAsRead]);

  const removeMultiple = useCallback((ids: string[]) => {
    ids.forEach(id => removeNotification(id));
  }, [removeNotification]);

  const exportNotifications = useCallback((format: 'json' | 'csv' = 'json') => {
    const data = notifications.map(notification => ({
      id: notification.id,
      type: notification.type,
      title: notification.title,
      message: notification.message,
      read: notification.read,
      timestamp: notification.timestamp,
      actionUrl: notification.actionUrl,
      actionText: notification.actionText
    }));

    let content: string;
    let mimeType: string;
    let filename: string;

    if (format === 'csv') {
      const headers = ['ID', 'Type', 'Title', 'Message', 'Read', 'Timestamp', 'Action URL', 'Action Text'];
      const rows = data.map(item => [
        item.id,
        item.type,
        item.title,
        item.message,
        item.read.toString(),
        item.timestamp.toISOString(),
        item.actionUrl || '',
        item.actionText || ''
      ]);

      content = [headers, ...rows].map(row => row.map(cell => `"${cell}"`).join(',')).join('\n');
      mimeType = 'text/csv';
      filename = 'notifications.csv';
    } else {
      content = JSON.stringify(data, null, 2);
      mimeType = 'application/json';
      filename = 'notifications.json';
    }

    const blob = new Blob([content], { type: mimeType });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = filename;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);

    toast.success('Export Complete', `Notifications exported as ${format.toUpperCase()}`);
  }, [notifications, toast]);

  // System Notifications
  const requestPermission = useCallback(async (): Promise<NotificationPermission> => {
    if (!('Notification' in window)) {
      throw new Error('This browser does not support notifications');
    }

    const permission = await Notification.requestPermission();
    if (permission === 'granted') {
      updatePreferences({ pushNotifications: true });
      toast.success('Notifications Enabled', 'Browser notifications are now enabled');
    } else {
      updatePreferences({ pushNotifications: false });
      toast.warning('Notifications Disabled', 'Browser notifications were not enabled');
    }

    return permission;
  }, [updatePreferences, toast]);

  const showBrowserNotification = useCallback((title: string, options?: NotificationOptions) => {
    if ('Notification' in window && Notification.permission === 'granted') {
      new Notification(title, {
        icon: '/icons/notification-icon.png',
        badge: '/icons/notification-badge.png',
        ...options
      });
    }
  }, []);

  // Utility Functions
  const playNotificationSound = useCallback(() => {
    if (audioElement && preferences.soundEnabled) {
      audioElement.currentTime = 0;
      audioElement.play().catch(error => {
        console.warn('Failed to play notification sound:', error);
      });
    }
  }, [audioElement, preferences.soundEnabled]);

  const getTotalNotifications = useCallback(() => {
    return notifications.length;
  }, [notifications]);

  const getNotificationStats = useCallback((): NotificationStats => {
    const byType = notifications.reduce((acc, notification) => {
      acc[notification.type] = (acc[notification.type] || 0) + 1;
      return acc;
    }, {} as Record<NotificationType, number>);

    const unreadNotifications = notifications.filter(n => !n.read);
    const recentCount = notifications.filter(n =>
      new Date().getTime() - new Date(n.timestamp).getTime() < 24 * 60 * 60 * 1000 // Last 24 hours
    ).length;

    const oldestUnread = unreadNotifications
      .sort((a, b) => new Date(a.timestamp).getTime() - new Date(b.timestamp).getTime())[0]?.timestamp;

    return {
      total: notifications.length,
      unread: unreadCount,
      byType,
      recentCount,
      oldestUnread: oldestUnread ? new Date(oldestUnread) : undefined
    };
  }, [notifications, unreadCount]);

  return {
    // State
    notifications,
    unreadCount,
    preferences,

    // Core Notification Functions
    addNotification,
    markAsRead,
    markAllAsRead,
    removeNotification,
    clearNotifications,

    // Enhanced Toast Functions
    toast,

    // Notification Management
    getNotificationById,
    getNotificationsByType,
    getRecentNotifications,
    hasUnreadNotifications,

    // Preferences Management
    updatePreferences,
    resetPreferences,

    // Filtering and Searching
    filterNotifications,
    searchNotifications,

    // Bulk Operations
    markMultipleAsRead,
    removeMultiple,
    exportNotifications,

    // System Notifications
    requestPermission,
    showBrowserNotification,

    // Utility Functions
    playNotificationSound,
    getTotalNotifications,
    getNotificationStats
  };
}

export default useNotifications;