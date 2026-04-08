// lib/api/notifications.ts
// API client for notification endpoints

import axios from 'axios';
import { API_CONFIG } from '../constants';

const apiClient = axios.create({
  baseURL: API_CONFIG.BASE_URL,
  timeout: API_CONFIG.TIMEOUT,
  headers: {
    'Content-Type': 'application/json',
  },
});

// Request interceptor to add auth token
apiClient.interceptors.request.use((config) => {
  const token = localStorage.getItem('unielect-voting-access-token');
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

export interface ApiNotification {
  id: string;
  title: string;
  message: string;
  type: string;
  priority: string;
  isRead: boolean;
  readAt?: string;
  createdAt: string;
  updatedAt: string;
  actionUrl?: string;
  data?: any;
  deliveryChannels: string[];
  expiresAt?: string;
}

export interface NotificationSummary {
  unreadCount: number;
  priorityCounts: Record<string, number>;
  typeCounts: Record<string, number>;
  recentNotifications: ApiNotification[];
}

export interface NotificationPreferences {
  emailNotifications: boolean;
  smsNotifications: boolean;
  pushNotifications: boolean;
  notificationTypes: string[];
}

export interface NotificationStats {
  overview: {
    total: number;
    unread: number;
    readRate: string;
  };
  breakdown: {
    byType: Record<string, number>;
    byPriority: Record<string, number>;
  };
  channels: any[];
  recentActivity: any[];
}

export interface GetNotificationsParams {
  page?: number;
  limit?: number;
  unreadOnly?: boolean;
  type?: string;
}

export const notificationApi = {
  /**
   * Get user notifications with pagination
   */
  getUserNotifications: async (params: GetNotificationsParams = {}) => {
    const response = await apiClient.get('/notifications', { params });
    return response.data;
  },

  /**
   * Get notification summary for dashboard
   */
  getNotificationSummary: async (): Promise<{ data: NotificationSummary }> => {
    const response = await apiClient.get('/notifications/summary');
    return response.data;
  },

  /**
   * Mark notification as read
   */
  markAsRead: async (notificationId: string) => {
    const response = await apiClient.put(`/notifications/${notificationId}/read`);
    return response.data;
  },

  /**
   * Mark multiple notifications as read
   */
  markMultipleAsRead: async (notificationIds: string[]) => {
    const response = await apiClient.put('/notifications/read-multiple', {
      notificationIds
    });
    return response.data;
  },

  /**
   * Mark all notifications as read
   */
  markAllAsRead: async () => {
    const response = await apiClient.put('/notifications/read-all');
    return response.data;
  },

  /**
   * Delete notification
   */
  deleteNotification: async (notificationId: string) => {
    const response = await apiClient.delete(`/notifications/${notificationId}`);
    return response.data;
  },

  /**
   * Get notification preferences
   */
  getNotificationPreferences: async (): Promise<{ data: NotificationPreferences }> => {
    const response = await apiClient.get('/notifications/preferences');
    return response.data;
  },

  /**
   * Update notification preferences
   */
  updateNotificationPreferences: async (preferences: Partial<NotificationPreferences>) => {
    const response = await apiClient.put('/notifications/preferences', preferences);
    return response.data;
  },

  /**
   * Send system maintenance notification (Admin only)
   */
  sendMaintenanceNotification: async (data: {
    title: string;
    message: string;
    scheduledTime?: string;
  }) => {
    const response = await apiClient.post('/notifications/admin/maintenance', data);
    return response.data;
  },

  /**
   * Send security alert (Admin only)
   */
  sendSecurityAlert: async (data: {
    eventType: string;
    details: any;
    severity?: 'LOW' | 'MEDIUM' | 'HIGH' | 'CRITICAL';
  }) => {
    const response = await apiClient.post('/notifications/admin/security-alert', data);
    return response.data;
  },

  /**
   * Get notification statistics (Admin/Moderator only)
   */
  getNotificationStats: async (): Promise<{ data: NotificationStats }> => {
    const response = await apiClient.get('/notifications/admin/stats');
    return response.data;
  }
};

export default notificationApi;