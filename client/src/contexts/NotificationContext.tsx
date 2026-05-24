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

interface MenuNotification {
  type: 'menu:updated';
  restaurantId: string;
}

interface SalesNotification {
  type: 'sales:updated';
  restaurantId: string;
  invoiceId: string;
  invoiceTotal: string;
}

interface InventoryNotification {
  type: 'inventory:updated';
  restaurantId: string;
  inventoryItemId: string;
  inventoryItemName: string;
  updatedFields: string[];
}

interface BillsNotification {
  type: 'bills:updated';
  restaurantId: string;
  action?: 'created' | 'updated' | 'deleted' | 'archived';
  billType?: string;
}

interface SalariesNotification {
  type: 'salaries:updated';
  restaurantId: string;
}

type Notification = OrderNotification | ChatNotification | TicketNotification | SettingsNotification | PermissionsNotification | RecipeCostNotification | MenuNotification | SalesNotification | InventoryNotification | BillsNotification | SalariesNotification;

interface NotificationContextType {
  isConnected: boolean;
  notificationsEnabled: boolean;
  setNotificationsEnabled: (enabled: boolean) => void;
  lastNotification: Notification | null;
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
  const [lastNotification, setLastNotification] = useState<Notification | null>(null);
  
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
          
          console.log('[Notifications] Received WebSocket message:', notification.type, notification);
          
          // Always update lastNotification for components to react to
          setLastNotification(notification);
          
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
            console.log('[Notifications] Processing ticket event:', notification.type, 'ticketId:', notification.ticketId);
            playNotificationTone(currentToneRef.current);
            
            // Invalidate ticket list to show new/updated tickets (client accounts)
            queryClient.invalidateQueries({ queryKey: ['/api/tickets'] });
            
            // If viewing specific ticket, invalidate its details
            if (notification.ticketId) {
              queryClient.invalidateQueries({ queryKey: ['/api/tickets', notification.ticketId] });
            }
            
            // For IT Dashboard - invalidate IT-specific queries (real-time updates for IT accounts)
            console.log('[Notifications] Invalidating IT Dashboard queries...');
            queryClient.invalidateQueries({ queryKey: ['/api/it/tickets'] });
            queryClient.invalidateQueries({ queryKey: ['/api/it/active-tickets'] });
            queryClient.invalidateQueries({ queryKey: ['/api/it/analytics'] });
            queryClient.invalidateQueries({ queryKey: ['/api/it/workload'] });
            queryClient.invalidateQueries({ queryKey: ['/api/it/trends'] });
            queryClient.invalidateQueries({ queryKey: ['/api/it/category-breakdown'] });
            console.log('[Notifications] IT Dashboard queries invalidated');
            
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
              // For IT Support - invalidate IT ticket messages
              queryClient.invalidateQueries({ 
                queryKey: ['/api/it/tickets', notification.ticketId, 'messages'] 
              });
            }
            
            // Invalidate ticket list to update "last message" info
            queryClient.invalidateQueries({ queryKey: ['/api/tickets'] });
            
            // For IT Dashboard - invalidate IT-specific queries (real-time updates for IT accounts)
            queryClient.invalidateQueries({ queryKey: ['/api/it/tickets'] });
            queryClient.invalidateQueries({ queryKey: ['/api/it/active-tickets'] });
            
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
            
            // Invalidate dashboard, analytics, orders AND stock queries for real-time updates
            queryClient.invalidateQueries({ queryKey: ['/api/analytics/dashboard'] });
            queryClient.invalidateQueries({ queryKey: ['/api/analytics/sales'] });
            queryClient.invalidateQueries({ queryKey: ['/api/orders'] });
            // Real-time stock update - refresh POS stock immediately after order
            queryClient.invalidateQueries({ queryKey: ['/api/menu/stock'], refetchType: 'all' });
            console.log('[Notifications] Order updated - refreshing dashboard and stock data');

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
            queryClient.invalidateQueries({ queryKey: ['/api/menu-categories'], refetchType: 'all' });
            console.log('[Notifications] Menu updated - refreshing menu data, categories, and images');
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
            // Invalidate recipes for Detailed Item Analysis real-time updates
            queryClient.invalidateQueries({ queryKey: ['/api/recipes'], refetchType: 'all' });
            // Invalidate BEP analytics since recipe costs affect COGS calculation
            queryClient.invalidateQueries({ queryKey: ['/api/analytics/bep'], refetchType: 'all' });
            // Invalidate menu items as they reference recipes
            queryClient.invalidateQueries({ queryKey: ['/api/menu'], refetchType: 'all' });
            console.log('[Notifications] Recipe costs updated - refreshing recipes, menu, and BEP data');
          } else if (notification.type === 'sales:updated') {
            // Handle sales updates for real-time BEP tracking
            // Use predicate to invalidate ALL queries containing these base paths (handles arrays and object keys)
            const targetKeys = ['/api/invoices', '/api/analytics/financial', '/api/analytics/bep', 
                               '/api/analytics/delivery-breakdown', '/api/analytics/dashboard', 
                               '/api/analytics/sales', '/api/shop/bills'];
            queryClient.invalidateQueries({ 
              predicate: (query) => {
                // Check all segments of the query key array
                return query.queryKey.some(segment => 
                  typeof segment === 'string' && targetKeys.some(key => segment.startsWith(key))
                );
              },
              refetchType: 'all'
            });
            console.log('[Notifications] Sales updated - refreshing all financial/analytics data');
          } else if (notification.type === 'inventory:updated') {
            // Handle inventory updates for real-time sync with recipes
            const targetKeys = ['/api/inventory', '/api/recipes', '/api/menu', '/api/menu/stock', '/api/analytics/bep'];
            queryClient.invalidateQueries({ 
              predicate: (query) => {
                return query.queryKey.some(segment => 
                  typeof segment === 'string' && targetKeys.some(key => segment.startsWith(key))
                );
              },
              refetchType: 'all'
            });
            console.log('[Notifications] Inventory updated - refreshing inventory, recipes, menu, and BEP data');
          } else if (notification.type === 'bills:updated') {
            // Handle bill updates for real-time Operating Expenses tracking
            const targetKeys = ['/api/shop/bills', '/api/analytics/financial', '/api/analytics/bep', '/api/analytics/dashboard'];
            queryClient.invalidateQueries({ 
              predicate: (query) => {
                return query.queryKey.some(segment => 
                  typeof segment === 'string' && targetKeys.some(key => segment.startsWith(key))
                );
              },
              refetchType: 'all'
            });
            console.log('[Notifications] Bills updated - refreshing Operating Expenses, BEP, and dashboard');
          } else if (notification.type === 'salaries:updated') {
            // Handle salary updates for real-time Fixed Costs tracking
            const targetKeys = ['/api/salaries', '/api/shop/bills', '/api/analytics/bep', '/api/analytics/financial', '/api/analytics/dashboard'];
            queryClient.invalidateQueries({ 
              predicate: (query) => {
                return query.queryKey.some(segment => 
                  typeof segment === 'string' && targetKeys.some(key => segment.startsWith(key))
                );
              },
              refetchType: 'all'
            });
            console.log('[Notifications] Salaries updated - refreshing Fixed Costs and BEP data');
          }
          // Live profitability: any data change that affects revenue or cost
          // re-invalidates every profitability page so dashboards stay real-time.
          if ([
            'order:created', 'order:statusUpdated', 'sales:updated', 'bills:updated',
            'salaries:updated', 'inventory:updated', 'recipe:costUpdated', 'menu:updated',
            'projects:updated', 'payment-schedules:updated', 'procurement:updated',
          ].includes(notification.type)) {
            const profKeys = [
              '/api/analytics/menu-profitability',
              '/api/delivery-apps/analytics/profitability',
              '/api/delivery-profitability',
              '/api/payment-schedules',
              '/api/service-projects',
              'service-profitability-aggregates',
            ];
            queryClient.invalidateQueries({
              predicate: (query) => query.queryKey.some(seg =>
                typeof seg === 'string' && profKeys.some(k => seg.startsWith(k))
              ),
              refetchType: 'all',
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
    <NotificationContext.Provider value={{ isConnected, notificationsEnabled, setNotificationsEnabled, lastNotification }}>
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
