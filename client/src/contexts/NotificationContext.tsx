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

interface SettingsNotification {
  type: 'settings:updated';
  restaurantId: string;
}

interface PermissionsNotification {
  type: 'permissions:updated';
  restaurantId: string;
  targetUserId: string;
}

interface RecipeCostNotification {
  type: 'recipe:costUpdated';
  restaurantId: string;
  updatedRecipeIds: string[];
}

type Notification = OrderNotification | ChatNotification | TicketNotification | SettingsNotification | PermissionsNotification | RecipeCostNotification;

interface NotificationContextType {
  isConnected: boolean;
  notificationsEnabled: boolean;
  setNotificationsEnabled: (enabled: boolean) => void;
}

const NotificationContext = createContext<NotificationContextType | undefined>(undefined);

export function NotificationProvider({ children }: { children: ReactNode }) {
  const { toast } = useToast();
  const { t } = useLanguage();
  const { user, restaurant, isLoading: authLoading } = useAuth();
  const wsRef = useRef<WebSocket | null>(null);
  const reconnectTimeoutRef = useRef<NodeJS.Timeout | null>(null);
  const [isConnected, setIsConnected] = useState(false);
  const [notificationsEnabled, setNotificationsEnabled] = useState(() => {
    const saved = localStorage.getItem('notificationsEnabled');
    return saved === null ? true : saved === 'true';
  });
  
  // Store latest tone in ref so WebSocket handler always uses current value
  const currentToneRef = useRef<ToneId>('tone1');

  // Fetch settings to get selected notification tone
  // Only for client accounts with restaurant context (restaurantId present)
  // Will be refreshed via WebSocket events when admin updates settings
  const { data: settings } = useQuery<{ notificationTone: ToneId }>({
    queryKey: ['/api/settings'],
    enabled: !authLoading && !!restaurant,
    staleTime: 60000, // Consider fresh for 1 minute
    refetchOnWindowFocus: false,
    retry: false,
  });

  // Fetch chat notification settings
  // Only for client accounts with restaurant context (restaurantId present)
  // Will be refreshed via WebSocket events when admin updates settings
  const { data: chatSettings } = useQuery<{
    notificationsEnabled: boolean;
    soundEnabled: boolean;
    toneId: string;
  }>({
    queryKey: ['/api/chat/notification-settings'],
    enabled: !authLoading && !!restaurant,
    staleTime: 60000, // Consider fresh for 1 minute
    refetchOnWindowFocus: false,
    retry: false,
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
            
            // Invalidate dashboard and analytics queries for real-time updates
            queryClient.invalidateQueries({ queryKey: ['/api/analytics/dashboard'] });
            queryClient.invalidateQueries({ queryKey: ['/api/analytics/sales'] });
            queryClient.invalidateQueries({ queryKey: ['/api/orders'] });
            console.log('[Notifications] Order updated - refreshing dashboard data');

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
          } else if (notification.type === 'settings:updated') {
            // Handle settings updates from admin
            // Only invalidate for users with restaurant context (skip for IT accounts)
            if (restaurant) {
              queryClient.invalidateQueries({ queryKey: ['/api/settings'] });
              queryClient.invalidateQueries({ queryKey: ['/api/chat/notification-settings'] });
              console.log('[Notifications] Settings updated - refreshing from server');
            }
          } else if (notification.type === 'menu:updated') {
            // Handle menu updates - refresh menu data in POS and menu pages
            // Use refetchType: 'all' to force immediate refetch even with staleTime: Infinity
            queryClient.invalidateQueries({ queryKey: ['/api/menu'], refetchType: 'all' });
            queryClient.invalidateQueries({ queryKey: ['/api/menu/stock'], refetchType: 'all' });
            queryClient.invalidateQueries({ queryKey: ['/api/addons'], refetchType: 'all' });
            console.log('[Notifications] Menu updated - refreshing menu data with images');
          } else if (notification.type === 'permissions:updated') {
            // Handle permission updates - refresh user data to get updated permissions
            queryClient.invalidateQueries({ queryKey: ['/api/auth/me'], refetchType: 'all' });
            console.log('[Notifications] Permissions updated - refreshing user data');
            
            toast({
              title: t.permissionsUpdated || 'Permissions Updated',
              description: t.permissionsUpdatedDesc || 'Your permissions have been updated. The sidebar will refresh automatically.',
              duration: 5000,
            });
          } else if (notification.type === 'recipe:costUpdated') {
            // Handle recipe cost updates when inventory prices change
            queryClient.invalidateQueries({ queryKey: ['/api/recipes'], refetchType: 'all' });
            console.log('[Notifications] Recipe costs updated - refreshing recipes data');
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
