// lib/hooks/useWebSocket.ts
// WebSocket connection management hook for real-time updates

import { useCallback, useEffect, useRef, useState } from 'react';
import { useAuth } from './useAuth';
import { useNotificationStore } from '../stores/notificationStore';
import {
  WebSocketMessage,
  VotingSessionUpdate,
  DashboardUpdate,
  ElectionResults
} from '../types';
import { NotificationType } from '../enums';

type WebSocketConnectionStatus = 'connecting' | 'connected' | 'disconnected' | 'error' | 'reconnecting';

type WebSocketEventHandler = (data: any) => void;

interface UseWebSocketOptions {
  url?: string;
  autoConnect?: boolean;
  reconnectAttempts?: number;
  reconnectInterval?: number;
  heartbeatInterval?: number;
  protocols?: string[];
}

interface UseWebSocketReturn {
  // Connection State
  isConnected: boolean;
  connectionStatus: WebSocketConnectionStatus;
  lastMessage: WebSocketMessage | null;
  error: string | null;

  // Connection Management
  connect: () => void;
  disconnect: () => void;
  reconnect: () => void;

  // Message Handling
  sendMessage: (type: string, payload: any, targetChannel?: string) => void;
  subscribe: (eventType: string, handler: WebSocketEventHandler) => () => void;
  unsubscribe: (eventType: string, handler: WebSocketEventHandler) => void;

  // Channel Management
  joinChannel: (channel: string) => void;
  leaveChannel: (channel: string) => void;
  joinElectionChannel: (electionId: string) => void;
  leaveElectionChannel: (electionId: string) => void;

  // Utility Functions
  clearError: () => void;
  getConnectionInfo: () => {
    status: WebSocketConnectionStatus;
    connectedAt: Date | null;
    lastHeartbeat: Date | null;
    channels: string[];
  };
}

export function useWebSocket(options: UseWebSocketOptions = {}): UseWebSocketReturn {
  const {
    url = process.env.NEXT_PUBLIC_WS_URL || 'ws://localhost:5000',
    autoConnect = true,
    reconnectAttempts = 5,
    reconnectInterval = 3000,
    heartbeatInterval = 30000,
    protocols = []
  } = options;

  const { user, isAuthenticated, getAccessToken } = useAuth();
  const { toast, addNotification } = useNotificationStore();

  // State
  const [isConnected, setIsConnected] = useState(false);
  const [connectionStatus, setConnectionStatus] = useState<WebSocketConnectionStatus>('disconnected');
  const [lastMessage, setLastMessage] = useState<WebSocketMessage | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [connectedAt, setConnectedAt] = useState<Date | null>(null);
  const [lastHeartbeat, setLastHeartbeat] = useState<Date | null>(null);
  const [channels, setChannels] = useState<string[]>([]);

  // Refs
  const websocketRef = useRef<WebSocket | null>(null);
  const eventHandlers = useRef<Map<string, Set<WebSocketEventHandler>>>(new Map());
  const reconnectTimeoutRef = useRef<NodeJS.Timeout | null>(null);
  const heartbeatIntervalRef = useRef<NodeJS.Timeout | null>(null);
  const reconnectCountRef = useRef(0);

  // Build WebSocket URL with authentication
  const getWebSocketUrl = useCallback(() => {
    const token = getAccessToken();
    if (!token) return null;

    const wsUrl = new URL(url);
    wsUrl.searchParams.set('token', token);
    if (user?.id) {
      wsUrl.searchParams.set('userId', user.id);
    }

    return wsUrl.toString();
  }, [url, getAccessToken, user]);

  // Clear reconnection timeout
  const clearReconnectTimeout = useCallback(() => {
    if (reconnectTimeoutRef.current) {
      clearTimeout(reconnectTimeoutRef.current);
      reconnectTimeoutRef.current = null;
    }
  }, []);

  // Clear heartbeat interval
  const clearHeartbeatInterval = useCallback(() => {
    if (heartbeatIntervalRef.current) {
      clearInterval(heartbeatIntervalRef.current);
      heartbeatIntervalRef.current = null;
    }
  }, []);

  // Start heartbeat
  const startHeartbeat = useCallback(() => {
    clearHeartbeatInterval();

    heartbeatIntervalRef.current = setInterval(() => {
      if (websocketRef.current?.readyState === WebSocket.OPEN) {
        sendMessage('heartbeat', { timestamp: new Date().toISOString() });
        setLastHeartbeat(new Date());
      }
    }, heartbeatInterval);
  }, [heartbeatInterval, clearHeartbeatInterval]);

  // Handle incoming messages
  const handleMessage = useCallback((event: MessageEvent) => {
    try {
      const message: WebSocketMessage = JSON.parse(event.data);
      setLastMessage(message);

      // Handle system messages
      if (message.type === 'heartbeat') {
        setLastHeartbeat(new Date());
        return;
      }

      if (message.type === 'error') {
        setError(message.payload.message || 'WebSocket error');
        toast.error('Connection Error', message.payload.message);
        return;
      }

      // Handle specific message types
      switch (message.type) {
        case 'notification':
          addNotification({
            type: message.payload.type || NotificationType.INFO,
            title: message.payload.title,
            message: message.payload.message,
            actionUrl: message.payload.actionUrl,
            actionText: message.payload.actionText
          });
          break;

        case 'election_started':
        case 'election_ended':
        case 'election_updated':
          toast.info('Election Update', message.payload.message || 'Election status updated');
          break;

        case 'voting_update':
          // Real-time voting updates
          break;

        case 'results_update':
          // Real-time results updates
          break;

        default:
          // Handle custom message types through event handlers
          break;
      }

      // Call registered event handlers
      const handlers = eventHandlers.current.get(message.type);
      if (handlers) {
        handlers.forEach(handler => {
          try {
            handler(message.payload);
          } catch (error) {
            console.error('Error in WebSocket event handler:', error);
          }
        });
      }
    } catch (error) {
      console.error('Error parsing WebSocket message:', error);
      setError('Failed to parse message');
    }
  }, [toast, addNotification]);

  // Connection management
  const connect = useCallback(() => {
    if (!isAuthenticated) {
      setError('User not authenticated');
      return;
    }

    const wsUrl = getWebSocketUrl();
    if (!wsUrl) {
      setError('Unable to build WebSocket URL');
      return;
    }

    if (websocketRef.current?.readyState === WebSocket.OPEN) {
      return; // Already connected
    }

    setConnectionStatus('connecting');
    setError(null);

    try {
      websocketRef.current = new WebSocket(wsUrl, protocols);

      websocketRef.current.onopen = () => {
        setIsConnected(true);
        setConnectionStatus('connected');
        setConnectedAt(new Date());
        setError(null);
        reconnectCountRef.current = 0;

        // Start heartbeat
        startHeartbeat();

        // Send initial authentication
        sendMessage('authenticate', {
          userId: user?.id,
          timestamp: new Date().toISOString()
        });

        console.log('WebSocket connected');
      };

      websocketRef.current.onmessage = handleMessage;

      websocketRef.current.onclose = (event) => {
        setIsConnected(false);
        setConnectionStatus('disconnected');
        setConnectedAt(null);
        clearHeartbeatInterval();

        console.log('WebSocket disconnected:', event.code, event.reason);

        // Attempt reconnection if not manually closed
        if (event.code !== 1000 && reconnectCountRef.current < reconnectAttempts) {
          setConnectionStatus('reconnecting');
          reconnectCountRef.current++;

          reconnectTimeoutRef.current = setTimeout(() => {
            connect();
          }, reconnectInterval * reconnectCountRef.current);
        }
      };

      websocketRef.current.onerror = (error) => {
        setConnectionStatus('error');
        setError('WebSocket connection error');
        console.error('WebSocket error:', error);
      };
    } catch (error) {
      setConnectionStatus('error');
      setError('Failed to create WebSocket connection');
      console.error('WebSocket creation error:', error);
    }
  }, [
    isAuthenticated,
    getWebSocketUrl,
    protocols,
    handleMessage,
    startHeartbeat,
    clearHeartbeatInterval,
    reconnectAttempts,
    reconnectInterval,
    user
  ]);

  const disconnect = useCallback(() => {
    clearReconnectTimeout();
    clearHeartbeatInterval();

    if (websocketRef.current) {
      websocketRef.current.close(1000, 'Manual disconnect');
      websocketRef.current = null;
    }

    setIsConnected(false);
    setConnectionStatus('disconnected');
    setConnectedAt(null);
    setChannels([]);
    reconnectCountRef.current = 0;
  }, [clearReconnectTimeout, clearHeartbeatInterval]);

  const reconnect = useCallback(() => {
    disconnect();
    setTimeout(() => {
      reconnectCountRef.current = 0;
      connect();
    }, 1000);
  }, [disconnect, connect]);

  // Message handling
  const sendMessage = useCallback((type: string, payload: any, targetChannel?: string) => {
    if (!websocketRef.current || websocketRef.current.readyState !== WebSocket.OPEN) {
      console.warn('WebSocket not connected, cannot send message');
      return;
    }

    const message: WebSocketMessage = {
      type,
      payload,
      timestamp: new Date(),
      electionId: targetChannel
    };

    try {
      websocketRef.current.send(JSON.stringify(message));
    } catch (error) {
      console.error('Error sending WebSocket message:', error);
      setError('Failed to send message');
    }
  }, []);

  const subscribe = useCallback((eventType: string, handler: WebSocketEventHandler): (() => void) => {
    if (!eventHandlers.current.has(eventType)) {
      eventHandlers.current.set(eventType, new Set());
    }

    const handlers = eventHandlers.current.get(eventType)!;
    handlers.add(handler);

    // Return unsubscribe function
    return () => {
      handlers.delete(handler);
      if (handlers.size === 0) {
        eventHandlers.current.delete(eventType);
      }
    };
  }, []);

  const unsubscribe = useCallback((eventType: string, handler: WebSocketEventHandler) => {
    const handlers = eventHandlers.current.get(eventType);
    if (handlers) {
      handlers.delete(handler);
      if (handlers.size === 0) {
        eventHandlers.current.delete(eventType);
      }
    }
  }, []);

  // Channel management
  const joinChannel = useCallback((channel: string) => {
    if (!channels.includes(channel)) {
      setChannels(prev => [...prev, channel]);
      sendMessage('join_channel', { channel });
    }
  }, [channels, sendMessage]);

  const leaveChannel = useCallback((channel: string) => {
    setChannels(prev => prev.filter(c => c !== channel));
    sendMessage('leave_channel', { channel });
  }, [sendMessage]);

  const joinElectionChannel = useCallback((electionId: string) => {
    joinChannel(`election:${electionId}`);
  }, [joinChannel]);

  const leaveElectionChannel = useCallback((electionId: string) => {
    leaveChannel(`election:${electionId}`);
  }, [leaveChannel]);

  // Utility functions
  const clearError = useCallback(() => {
    setError(null);
  }, []);

  const getConnectionInfo = useCallback(() => {
    return {
      status: connectionStatus,
      connectedAt,
      lastHeartbeat,
      channels
    };
  }, [connectionStatus, connectedAt, lastHeartbeat, channels]);

  // Auto-connect on mount
  useEffect(() => {
    if (autoConnect && isAuthenticated) {
      connect();
    }

    return () => {
      disconnect();
    };
  }, [autoConnect, isAuthenticated]);

  // Reconnect when authentication changes
  useEffect(() => {
    if (isAuthenticated && connectionStatus === 'disconnected') {
      connect();
    } else if (!isAuthenticated && isConnected) {
      disconnect();
    }
  }, [isAuthenticated, connectionStatus, isConnected]);

  return {
    // Connection State
    isConnected,
    connectionStatus,
    lastMessage,
    error,

    // Connection Management
    connect,
    disconnect,
    reconnect,

    // Message Handling
    sendMessage,
    subscribe,
    unsubscribe,

    // Channel Management
    joinChannel,
    leaveChannel,
    joinElectionChannel,
    leaveElectionChannel,

    // Utility Functions
    clearError,
    getConnectionInfo
  };
}

export default useWebSocket;