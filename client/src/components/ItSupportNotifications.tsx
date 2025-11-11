import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Badge } from "@/components/ui/badge";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Bell, Clock, AlertCircle, User, Building2, FileText, Phone, Mail } from "lucide-react";
import { Link } from "wouter";
import { useLanguage } from "@/contexts/LanguageContext";

interface ItTicketNotification {
  ticketId: string;
  ticketNumber: string;
  subject: string;
  priority: string;
  status: string;
  createdAt: string;
  userName: string;
  userEmail: string | null;
  userPhone: string | null;
  restaurantName: string;
  commercialRegistration: string;
  unreadCount: number;
}

export function ItSupportNotifications() {
  const { t } = useLanguage();
  const [isOpen, setIsOpen] = useState(false);

  // Fetch unread count
  const { data: countData } = useQuery<{ count: number }>({
    queryKey: ['/api/support/tickets/unread-count'],
    refetchInterval: 30000, // Refresh every 30 seconds
    enabled: true,
  });

  // Fetch notifications when dropdown is open
  const { data: notifications, isLoading } = useQuery<ItTicketNotification[]>({
    queryKey: ['/api/support/tickets/notifications'],
    enabled: isOpen,
    refetchInterval: isOpen ? 10000 : false, // Refresh every 10 seconds when open
  });

  const unreadCount = countData?.count || 0;

  const getPriorityColor = (priority: string) => {
    switch (priority) {
      case 'urgent':
        return 'text-red-600 bg-red-50 dark:bg-red-950';
      case 'high':
        return 'text-orange-600 bg-orange-50 dark:bg-orange-950';
      case 'medium':
        return 'text-yellow-600 bg-yellow-50 dark:bg-yellow-950';
      case 'low':
        return 'text-green-600 bg-green-50 dark:bg-green-950';
      default:
        return 'text-gray-600 bg-gray-50 dark:bg-gray-950';
    }
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'open':
        return <Clock className="h-4 w-4" />;
      case 'in-progress':
        return <AlertCircle className="h-4 w-4" />;
      default:
        return <FileText className="h-4 w-4" />;
    }
  };

  return (
    <DropdownMenu open={isOpen} onOpenChange={setIsOpen}>
      <DropdownMenuTrigger asChild>
        <Button
          variant="ghost"
          size="icon"
          className="relative"
          data-testid="button-it-notifications"
        >
          <Bell className="h-5 w-5" />
          {unreadCount > 0 && (
            <Badge
              className="absolute -top-1 -right-1 h-5 w-5 p-0 flex items-center justify-center text-xs"
              variant="destructive"
              data-testid="badge-notification-count"
            >
              {unreadCount > 99 ? '99+' : unreadCount}
            </Badge>
          )}
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end" className="w-[420px] p-0">
        <div className="p-4 border-b">
          <h3 className="font-semibold text-lg">{t.supportTickets || 'Support Tickets'}</h3>
          <p className="text-sm text-muted-foreground">
            {unreadCount} {t.unreadTickets || 'unread tickets'}
          </p>
        </div>
        <ScrollArea className="h-[500px]">
          {isLoading ? (
            <div className="p-8 text-center">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary mx-auto"></div>
              <p className="text-sm text-muted-foreground mt-2">{t.loading || 'Loading...'}</p>
            </div>
          ) : notifications && notifications.length > 0 ? (
            <div className="divide-y">
              {notifications.map((notif) => (
                <Link
                  key={notif.ticketId}
                  href={`/support/${notif.ticketId}`}
                  onClick={() => setIsOpen(false)}
                >
                  <div
                    className="p-4 hover-elevate active-elevate-2 cursor-pointer transition-colors"
                    data-testid={`notification-ticket-${notif.ticketId}`}
                  >
                    <div className="flex items-start justify-between gap-3 mb-2">
                      <div className="flex items-center gap-2 flex-1">
                        {getStatusIcon(notif.status)}
                        <span className="font-semibold text-sm">{notif.ticketNumber}</span>
                        <Badge
                          className={`text-xs ${getPriorityColor(notif.priority)}`}
                          variant="outline"
                        >
                          {notif.priority}
                        </Badge>
                      </div>
                      {notif.unreadCount > 0 && (
                        <Badge variant="destructive" className="text-xs">
                          {notif.unreadCount} {t.new || 'new'}
                        </Badge>
                      )}
                    </div>

                    <h4 className="font-medium text-sm mb-3 line-clamp-2">{notif.subject}</h4>

                    <div className="space-y-1.5 text-xs text-muted-foreground">
                      <div className="flex items-center gap-2">
                        <User className="h-3.5 w-3.5 flex-shrink-0" />
                        <span className="font-medium">{notif.userName}</span>
                      </div>
                      {notif.userEmail && (
                        <div className="flex items-center gap-2">
                          <Mail className="h-3.5 w-3.5 flex-shrink-0" />
                          <span className="truncate">{notif.userEmail}</span>
                        </div>
                      )}
                      {notif.userPhone && (
                        <div className="flex items-center gap-2">
                          <Phone className="h-3.5 w-3.5 flex-shrink-0" />
                          <span>{notif.userPhone}</span>
                        </div>
                      )}
                      <div className="flex items-center gap-2 pt-1 border-t">
                        <Building2 className="h-3.5 w-3.5 flex-shrink-0" />
                        <div className="flex flex-col">
                          <span className="font-medium">{notif.restaurantName}</span>
                          <span className="text-xs opacity-75">
                            CR: {notif.commercialRegistration}
                          </span>
                        </div>
                      </div>
                    </div>

                    <div className="mt-2 pt-2 border-t text-xs text-muted-foreground">
                      {new Date(notif.createdAt).toLocaleString()}
                    </div>
                  </div>
                </Link>
              ))}
            </div>
          ) : (
            <div className="p-8 text-center">
              <Bell className="h-12 w-12 mx-auto text-muted-foreground opacity-50 mb-2" />
              <p className="text-sm text-muted-foreground">
                {t.noUnreadTickets || 'No unread tickets'}
              </p>
            </div>
          )}
        </ScrollArea>
        {notifications && notifications.length > 0 && (
          <div className="p-3 border-t bg-muted/30">
            <Link href="/support" onClick={() => setIsOpen(false)}>
              <Button variant="ghost" size="sm" className="w-full" data-testid="button-view-all">
                {t.viewAllTickets || 'View all tickets'}
              </Button>
            </Link>
          </div>
        )}
      </DropdownMenuContent>
    </DropdownMenu>
  );
}
