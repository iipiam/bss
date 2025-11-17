import { createContext, useContext, useEffect, useRef, useState, ReactNode } from 'react';
import { useToast } from '@/hooks/use-toast';
import { useLanguage } from './LanguageContext';
import { useAuth } from '@/lib/auth';
import { useQuery } from '@tanstack/react-query';
import { playNotificationTone, type ToneId } from '@/lib/notificationTones';
import { queryClient } from '@/lib/queryClient';

interface OrderNotification {
  type: 'order:created' | 'order:statusUpdated';
  orderId: string;
  orderNumber: string;
  status: string;
  branchId?: string;
  branchName?: string;
  itemsSummary?: string;
}

interface ChatNotification {
  type: 'chat:message';
  conversationId: string;
  message: {
    id: string;
    conversationId: string;
    senderId: string;
    senderName: string;
    content: string;
    createdAt: string;
  };
}

interface TicketNotification {
  type: 'ticket:created' | 'ticket:updated' | 'ticket:message';
  ticketId?: string;
  ticketNumber?: string;
  subject?: string;
  category?: string;
  priority?: string;
  ticketStatus?: string;
  ticketMessage?: {
    id: string;
    ticketId: string;
    senderId: string;
    senderName: string;
    senderRole: string;
    message: string;
    createdAt: string;
  };
}

type Notification = OrderNotification | ChatNotification | TicketNotification;

interface NotificationContextType {
  isConnected: boolean;
  notificationsEnabled: boolean;
  setNotificationsEnabled: (enabled: boolean) => void;
}

const NotificationContext = createContext<NotificationContextType | undefined>(undefined);

export function NotificationProvider({ children }: { children: ReactNode }) {
  const { toast } = useToast();
  const { t } = useLanguage();
  const { user } = useAuth();
  const wsRef = useRef<WebSocket | null>(null);
  const reconnectTimeoutRef = useRef<NodeJS.Timeout | null>(null);
  const [isConnected, setIsConnected] = useState(false);
  const [notificationsEnabled, setNotificationsEnabled] = useState(() => {
    const saved = localStorage.getItem('notificationsEnabled');
    return saved === null ? true : saved === 'true';
  });
  
  // Store latest tone in ref so WebSocket handler always uses current value
  const currentToneRef = useRef<ToneId>('tone1');

  // Fetch settings to get selected notification tone (refetches every 5s to get admin updates)
  // Only query when authenticated to prevent 401 errors
  const { data: settings } = useQuery<{ notificationTone: ToneId }>({
    queryKey: ['/api/settings'],
    enabled: notificationsEnabled && !!user,
    refetchInterval: 5000, // Refresh every 5 seconds so sub-accounts get admin's tone updates immediately
  });

  // Fetch chat notification settings (refetches every 5s to get admin updates)
  const { data: chatSettings } = useQuery<{
    notificationsEnabled: boolean;
    soundEnabled: boolean;
    toneId: string;
  }>({
    queryKey: ['/api/chat/notification-settings'],
    enabled: !!user,
    refetchInterval: 5000, // Refresh every 5 seconds so all users get admin's updates immediately
  });

  // Update tone ref whenever settings change
  useEffect(() => {
    if (settings?.notificationTone) {
      currentToneRef.current = settings.notificationTone;
    }
  }, [settings?.notificationTone]);

  useEffect(() => {
    localStorage.setItem('notificationsEnabled', String(notificationsEnabled));
  }, [notificationsEnabled]);

  const connect = () => {
    try {
      // Connect to WebSocket server on dedicated notification path (avoids conflict with Vite HMR)
      const protocol = window.location.protocol === 'https:' ? 'wss:' : 'ws:';
      const wsUrl = `${protocol}//${window.location.host}/ws/notifications`;
      
      wsRef.current = new WebSocket(wsUrl);

      wsRef.current.onopen = () => {
        console.log('[Notifications] WebSocket connected');
        setIsConnected(true);
        
        // Clear any pending reconnection
        if (reconnectTimeoutRef.current) {
          clearTimeout(reconnectTimeoutRef.current);
          reconnectTimeoutRef.current = null;
        }
      };

      wsRef.current.onmessage = (event) => {
        try {
          const notification: Notification = JSON.parse(event.data);
          
          if (!notificationsEnabled) return;

          // Handle different notification types
          if (notification.type === 'chat:message') {
            // Check if chat notifications are enabled FIRST (admin setting applies to all users)
            const chatNotificationsEnabled = chatSettings?.notificationsEnabled ?? true;
            const chatSoundEnabled = chatSettings?.soundEnabled ?? true;
            const chatToneId = chatSettings?.toneId || 'tone1';
            
            // Invalidate conversation list (will refresh only user's conversations via API filtering)
            queryClient.invalidateQueries({ queryKey: ['/api/chat/conversations'] });
            
            // Only invalidate messages if user has this conversation in their query cache
            // This prevents unnecessary fetches for conversations user isn't part of
            const cachedConversations = queryClient.getQueryData(['/api/chat/conversations']) as any[];
            const userIsInConversation = cachedConversations?.some(
              (conv: any) => conv.id === notification.conversationId
            );
            
            if (userIsInConversation) {
              queryClient.invalidateQueries({ 
                queryKey: ['/api/chat/conversations', notification.conversationId, 'messages'] 
              });
            }
            
            // Show toast/sound if user is not the sender AND notifications are enabled
            // NOTE: Server-side filtering ensures user is a conversation participant
            if (notification.message.senderId !== user?.id && chatNotificationsEnabled) {
              // Play sound if enabled
              if (chatSoundEnabled) {
                playNotificationTone(chatToneId as ToneId);
              }
              
              // Show toast notification
              toast({
                title: "New Message",
                description: `${notification.message.senderName}: ${notification.message.content.slice(0, 50)}${notification.message.content.length > 50 ? '...' : ''}`,
                duration: 3000,
              });
            }
          } else if (notification.type === 'ticket:created' || notification.type === 'ticket:updated') {
            // Handle ticket creation and updates
            playNotificationTone(currentToneRef.current);
            
            // Invalidate ticket list to show new/updated tickets
            queryClient.invalidateQueries({ queryKey: ['/api/tickets'] });
            
            // If viewing specific ticket, invalidate its details
            if (notification.ticketId) {
              queryClient.invalidateQueries({ queryKey: ['/api/tickets', notification.ticketId] });
            }
            
            // For IT Dashboard - invalidate IT-specific queries
            queryClient.invalidateQueries({ queryKey: ['/api/it/tickets'] });
            queryClient.invalidateQueries({ queryKey: ['/api/it/analytics'] });
            
            const title = notification.type === 'ticket:created'
              ? `New Ticket - ${notification.ticketNumber}`
              : `Ticket Updated - ${notification.ticketNumber}`;
            
            const description = [
              notification.subject && `${notification.subject}`,
              notification.category && `${t.category || 'Category'}: ${notification.category}`,
              notification.priority && `Priority: ${notification.priority}`,
              notification.ticketStatus && `${t.status || 'Status'}: ${notification.ticketStatus}`,
            ].filter(Boolean).join('\n');
            
            toast({
              title,
              description,
              duration: 5000,
            });
          } else if (notification.type === 'ticket:message') {
            // Handle new ticket messages
            const ticketMessage = notification.ticketMessage;
            
            // Invalidate ticket messages to show new message
            if (notification.ticketId) {
              queryClient.invalidateQueries({ 
                queryKey: ['/api/tickets', notification.ticketId, 'messages'] 
              });
              queryClient.invalidateQueries({ queryKey: ['/api/tickets', notification.ticketId] });
            }
            
            // Invalidate ticket list to update "last message" info
            queryClient.invalidateQueries({ queryKey: ['/api/tickets'] });
            
            // Show toast/sound if user is not the sender
            if (ticketMessage && ticketMessage.senderId !== user?.id) {
              playNotificationTone(currentToneRef.current);
              
              toast({
                title: `New Message - ${notification.ticketNumber}`,
                description: `${ticketMessage.senderName}: ${ticketMessage.message.slice(0, 50)}${ticketMessage.message.length > 50 ? '...' : ''}`,
                duration: 4000,
              });
            }
          } else if (notification.type === 'order:created' || notification.type === 'order:statusUpdated') {
            // Handle order notifications
            playNotificationTone(currentToneRef.current);

            const title = notification.type === 'order:created' 
              ? `${t.newOrder || 'New Order'} - ${notification.orderNumber}`
              : `${t.orderUpdated || 'Order Updated'} - ${notification.orderNumber}`;
            
            const description = [
              notification.status && `${t.status || 'Status'}: ${notification.status}`,
              notification.branchName && `${t.branch || 'Branch'}: ${notification.branchName}`,
              notification.itemsSummary && `${t.items || 'Items'}: ${notification.itemsSummary}`,
            ].filter(Boolean).join('\n');

            toast({
              title,
              description,
              duration: 5000,
            });
          }
        } catch (err) {
          console.error('[Notifications] Failed to parse message:', err);
        }
      };

      wsRef.current.onclose = () => {
        console.log('[Notifications] WebSocket disconnected');
        setIsConnected(false);
        
        // Schedule reconnect only if user is authenticated - will be canceled by cleanup if component unmounts
        reconnectTimeoutRef.current = setTimeout(() => {
          if (notificationsEnabled && user) {
            console.log('[Notifications] Attempting to reconnect...');
            connect();
          }
        }, 5000);
      };

      wsRef.current.onerror = (error) => {
        console.error('[Notifications] WebSocket error:', error);
      };
    } catch (err) {
      console.error('[Notifications] Connection failed:', err);
    }
  };

  useEffect(() => {
    // Only connect if user is authenticated AND notifications are enabled
    if (notificationsEnabled && user) {
      connect();
    }

    return () => {
      // Clear reconnection timeout to prevent reconnection attempts after unmount
      if (reconnectTimeoutRef.current) {
        clearTimeout(reconnectTimeoutRef.current);
        reconnectTimeoutRef.current = null;
      }
      
      // Close WebSocket connection
      if (wsRef.current) {
        // Remove event handlers before closing to prevent triggering reconnection
        wsRef.current.onclose = null;
        wsRef.current.onerror = null;
        wsRef.current.onmessage = null;
        wsRef.current.close();
        wsRef.current = null;
      }
    };
  }, [notificationsEnabled, user]);

  return (
    <NotificationContext.Provider value={{ isConnected, notificationsEnabled, setNotificationsEnabled }}>
      {children}
    </NotificationContext.Provider>
  );
}

export function useNotifications() {
  const context = useContext(NotificationContext);
  if (!context) {
    throw new Error('useNotifications must be used within NotificationProvider');
  }
  return context;
}
