import { createContext, useContext, useEffect, useRef, useState, ReactNode } from 'react';
import { useToast } from '@/hooks/use-toast';
import { useLanguage } from './LanguageContext';

interface OrderNotification {
  type: 'order:created' | 'order:statusUpdated';
  orderId: string;
  orderNumber: string;
  status: string;
  branchId?: string;
  branchName?: string;
  itemsSummary?: string;
}

interface NotificationContextType {
  isConnected: boolean;
  notificationsEnabled: boolean;
  setNotificationsEnabled: (enabled: boolean) => void;
}

const NotificationContext = createContext<NotificationContextType | undefined>(undefined);

export function NotificationProvider({ children }: { children: ReactNode }) {
  const { toast } = useToast();
  const { t } = useLanguage();
  const wsRef = useRef<WebSocket | null>(null);
  const reconnectTimeoutRef = useRef<NodeJS.Timeout | null>(null);
  const [isConnected, setIsConnected] = useState(false);
  const [notificationsEnabled, setNotificationsEnabled] = useState(() => {
    const saved = localStorage.getItem('notificationsEnabled');
    return saved === null ? true : saved === 'true';
  });
  const audioRef = useRef<HTMLAudioElement | null>(null);

  useEffect(() => {
    localStorage.setItem('notificationsEnabled', String(notificationsEnabled));
  }, [notificationsEnabled]);

  useEffect(() => {
    if (!notificationsEnabled) return;

    // Initialize audio element with a simple beep sound (data URL)
    // This is a 200ms 800Hz beep tone
    audioRef.current = new Audio('data:audio/wav;base64,UklGRnoGAABXQVZFZm10IBAAAAABAAEAQB8AAEAfAAABAAgAZGF0YQoGAACBhYqFbF1fdJivrJBhNjVgodDbq2EcBj+a2/LDciUFLIHO8tiJNwgZaLvt559NEAxQp+PwtmMcBjiR1/LMeSwFJHfH8N2QQAoUXrTp66hVFApGn+DyvmwhBzOM0fPTgjMGHm7A7+OZURE');
  }, [notificationsEnabled]);

  const connect = () => {
    try {
      // Connect to WebSocket server
      const protocol = window.location.protocol === 'https:' ? 'wss:' : 'ws:';
      const wsUrl = `${protocol}//${window.location.host}`;
      
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
          const notification: OrderNotification = JSON.parse(event.data);
          
          if (!notificationsEnabled) return;

          // Play alarm sound
          if (audioRef.current) {
            audioRef.current.play().catch(err => {
              console.error('[Notifications] Audio play failed:', err);
            });
          }

          // Show toast notification
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
        } catch (err) {
          console.error('[Notifications] Failed to parse message:', err);
        }
      };

      wsRef.current.onclose = () => {
        console.log('[Notifications] WebSocket disconnected');
        setIsConnected(false);
        
        // Attempt to reconnect after 5 seconds
        reconnectTimeoutRef.current = setTimeout(() => {
          console.log('[Notifications] Attempting to reconnect...');
          connect();
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
    if (notificationsEnabled) {
      connect();
    }

    return () => {
      if (reconnectTimeoutRef.current) {
        clearTimeout(reconnectTimeoutRef.current);
      }
      if (wsRef.current) {
        wsRef.current.close();
      }
    };
  }, [notificationsEnabled]);

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
