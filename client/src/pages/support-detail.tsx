import { useState, useEffect, useRef } from "react";
import { useQuery, useMutation } from "@tanstack/react-query";
import { useParams, useLocation } from "wouter";
import { useLanguage } from "@/contexts/LanguageContext";
import { useAuth } from "@/lib/auth";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Tooltip, TooltipContent, TooltipTrigger, TooltipProvider } from "@/components/ui/tooltip";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { apiRequest, queryClient } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";
import {
  ArrowLeft,
  Send,
  Clock,
  CheckCircle,
  XCircle,
  AlertCircle,
  User,
  Shield,
} from "lucide-react";
import { format } from "date-fns";
import { Separator } from "@/components/ui/separator";
import { ScrollArea } from "@/components/ui/scroll-area";

type SupportTicket = {
  id: string;
  ticketNumber: string;
  userId: string;
  subject: string;
  category: string;
  priority: 'low' | 'medium' | 'high' | 'urgent';
  status: 'open' | 'in-progress' | 'resolved' | 'closed';
  description: string;
  createdAt: string;
  updatedAt: string;
  resolvedAt: string | null;
  closedAt: string | null;
};

type TicketMessage = {
  id: string;
  ticketId: string;
  senderId: string;
  senderName: string;
  senderRole: string;
  message: string;
  createdAt: string;
  isRead: boolean;
};

const getStatusLabel = (status: string, t: any) => {
  switch (status) {
    case 'open': return t.ticketStatusOpen;
    case 'in-progress': return t.ticketStatusInProgress;
    case 'resolved': return t.ticketStatusResolved;
    case 'closed': return t.ticketStatusClosed;
    default: return status;
  }
};

const getPriorityLabel = (priority: string, t: any) => {
  switch (priority) {
    case 'low': return t.priorityLow;
    case 'medium': return t.priorityMedium;
    case 'high': return t.priorityHigh;
    case 'urgent': return t.priorityUrgent;
    default: return priority;
  }
};

export default function SupportDetail() {
  const { id } = useParams<{ id: string }>();
  const [, navigate] = useLocation();
  const { t } = useLanguage();
  const { user, accountType } = useAuth();
  const { toast } = useToast();
  const [newMessage, setNewMessage] = useState("");
  const messagesEndRef = useRef<HTMLDivElement>(null);

  const ticketQuery = useQuery<SupportTicket>({
    queryKey: ['ticket-detail', id],
    queryFn: async () => {
      const res = await fetch(`/api/tickets/${id}`, {
        credentials: 'include',
        cache: 'no-store',
      });
      if (!res.ok) {
        throw new Error(`Failed to fetch ticket: ${res.status}`);
      }
      return res.json();
    },
    enabled: !!id,
    staleTime: 0,
  });

  const messagesQuery = useQuery<TicketMessage[]>({
    queryKey: ['ticket-messages', id],
    queryFn: async () => {
      const res = await fetch(`/api/tickets/${id}/messages`, {
        credentials: 'include',
        cache: 'no-store',
      });
      if (!res.ok) {
        throw new Error(`Failed to fetch messages: ${res.status}`);
      }
      return res.json();
    },
    enabled: !!id,
    staleTime: 0,
  });

  const ticket = ticketQuery.data;
  const ticketLoading = ticketQuery.isLoading;
  const ticketError = ticketQuery.error;
  const messages = messagesQuery.data;
  const messagesLoading = messagesQuery.isLoading;

  const sendMessageMutation = useMutation({
    mutationFn: async (message: string) => {
      return await apiRequest('POST', `/api/tickets/${id}/messages`, {
        message,
        senderId: user?.id || 'default-user',
        senderName: user?.username || 'User',
        senderRole: user?.role || 'employee',
      });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['ticket-messages', id] });
      queryClient.invalidateQueries({ queryKey: ['ticket-detail', id] });
      queryClient.invalidateQueries({ queryKey: ['/api/tickets'] });
      setNewMessage("");
    },
    onError: (error: any) => {
      toast({
        title: t.error,
        description: error.message || t.failedToSendMessage,
        variant: "destructive",
      });
    },
  });

  const updateStatusMutation = useMutation({
    mutationFn: async (status: string) => {
      return await apiRequest('PATCH', `/api/tickets/${id}`, { status });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['ticket-detail', id] });
      queryClient.invalidateQueries({ queryKey: ['/api/tickets'] });
      toast({
        title: t.statusUpdated,
        description: t.ticketStatusUpdatedDesc,
      });
    },
    onError: (error: any) => {
      toast({
        title: t.error,
        description: error.message || t.failedToUpdateStatus,
        variant: "destructive",
      });
    },
  });

  useEffect(() => {
    if (messagesEndRef.current) {
      messagesEndRef.current.scrollIntoView({ behavior: "smooth" });
    }
  }, [messages]);

  useEffect(() => {
    const interval = setInterval(() => {
      queryClient.invalidateQueries({ queryKey: ['ticket-messages', id] });
    }, 5000);

    return () => clearInterval(interval);
  }, [id]);

  const handleSendMessage = () => {
    if (!newMessage.trim()) return;
    sendMessageMutation.mutate(newMessage);
  };

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSendMessage();
    }
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'open': return <Clock className="h-4 w-4" />;
      case 'in-progress': return <AlertCircle className="h-4 w-4" />;
      case 'resolved': return <CheckCircle className="h-4 w-4" />;
      case 'closed': return <XCircle className="h-4 w-4" />;
      default: return <Clock className="h-4 w-4" />;
    }
  };

  const getStatusVariant = (status: string): "default" | "secondary" | "destructive" | "outline" => {
    switch (status) {
      case 'open': return 'default';
      case 'in-progress': return 'secondary';
      case 'resolved': return 'outline';
      case 'closed': return 'outline';
      default: return 'default';
    }
  };

  const getPriorityVariant = (priority: string): "default" | "secondary" | "destructive" | "outline" => {
    switch (priority) {
      case 'urgent': return 'destructive';
      case 'high': return 'default';
      case 'medium': return 'secondary';
      case 'low': return 'outline';
      default: return 'default';
    }
  };

  const isITAccount = accountType === 'it';
  const backPath = isITAccount ? '/it-dashboard' : '/support';

  if (!id || ticketLoading) {
    return (
      <div className="p-6 max-w-5xl mx-auto">
        <div className="animate-pulse space-y-4">
          <div className="h-8 bg-muted rounded w-1/3"></div>
          <Card>
            <CardHeader className="space-y-3">
              <div className="h-6 bg-muted rounded w-3/4"></div>
              <div className="h-4 bg-muted rounded w-1/2"></div>
            </CardHeader>
            <CardContent className="space-y-3">
              <div className="h-24 bg-muted rounded"></div>
            </CardContent>
          </Card>
        </div>
      </div>
    );
  }

  if (!ticket) {
    return (
      <div className="p-6 max-w-5xl mx-auto">
        <Card>
          <CardContent className="flex flex-col items-center justify-center py-12">
            <AlertCircle className="h-12 w-12 text-destructive mb-4" />
            <p className="text-muted-foreground">
              {t.ticketNotFound}
            </p>
            <Button
              onClick={() => navigate(backPath)}
              className="mt-4"
              variant="outline"
              data-testid="button-back-to-support"
            >
              <ArrowLeft className="h-4 w-4 mr-2" />
              {t.backToTickets}
            </Button>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <TooltipProvider delayDuration={150}>
    <div className="p-6 max-w-5xl mx-auto space-y-6">
      <div className="flex items-center justify-between">
        <Button
          variant="ghost"
          onClick={() => navigate(backPath)}
          data-testid="button-back"
        >
          <ArrowLeft className="h-4 w-4 mr-2" />
          {t.backToTickets}
        </Button>
        {isITAccount && ticket.status !== 'closed' && (
          <div className="flex gap-2">
            {ticket.status === 'open' && (
              <Button
                size="sm"
                variant="outline"
                onClick={() => updateStatusMutation.mutate('in-progress')}
                disabled={updateStatusMutation.isPending}
                data-testid="button-status-in-progress"
              >
                {t.markInProgress}
              </Button>
            )}
            {ticket.status === 'in-progress' && (
              <Button
                size="sm"
                variant="outline"
                onClick={() => updateStatusMutation.mutate('resolved')}
                disabled={updateStatusMutation.isPending}
                data-testid="button-status-resolved"
              >
                {t.markResolved}
              </Button>
            )}
            {ticket.status === 'resolved' && (
              <Button
                size="sm"
                variant="outline"
                onClick={() => updateStatusMutation.mutate('closed')}
                disabled={updateStatusMutation.isPending}
                data-testid="button-status-closed"
              >
                {t.closeTicket}
              </Button>
            )}
          </div>
        )}
      </div>

      <Card>
        <CardHeader className="space-y-4">
          <div className="flex items-start justify-between gap-4">
            <div className="flex-1">
              <CardTitle className="text-2xl">{ticket.subject}</CardTitle>
              <p className="text-sm text-muted-foreground mt-2">
                {t.ticket}: <span className="font-mono">{ticket.ticketNumber}</span>
              </p>
            </div>
            <div className="flex flex-col gap-2 items-end">
              <Badge variant={getStatusVariant(ticket.status)} className="flex items-center gap-1">
                {getStatusIcon(ticket.status)}
                {getStatusLabel(ticket.status, t)}
              </Badge>
              <Badge variant={getPriorityVariant(ticket.priority)}>
                {getPriorityLabel(ticket.priority, t)}
              </Badge>
            </div>
          </div>
          <Separator />
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm">
            <div>
              <p className="text-muted-foreground">{t.ticketCategory}</p>
              <p className="font-medium">{ticket.category}</p>
            </div>
            <div>
              <p className="text-muted-foreground">{t.ticketCreated}</p>
              <p className="font-medium">{format(new Date(ticket.createdAt), 'MMM d, yyyy HH:mm')}</p>
            </div>
            <div>
              <p className="text-muted-foreground">{t.lastUpdated}</p>
              <p className="font-medium">{format(new Date(ticket.updatedAt), 'MMM d, yyyy HH:mm')}</p>
            </div>
            {ticket.resolvedAt && (
              <div>
                <p className="text-muted-foreground">{t.ticketResolved}</p>
                <p className="font-medium">{format(new Date(ticket.resolvedAt), 'MMM d, yyyy HH:mm')}</p>
              </div>
            )}
          </div>
          <div>
            <p className="text-sm text-muted-foreground mb-2">{t.ticketDescription}</p>
            <p className="text-sm">{ticket.description}</p>
          </div>
        </CardHeader>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle className="text-lg">{t.messages}</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <ScrollArea className="h-[400px] pr-4">
            <div className="space-y-4">
              {messagesLoading ? (
                <div className="space-y-3">
                  {[1, 2, 3].map(i => (
                    <div key={i} className="animate-pulse space-y-2">
                      <div className="h-4 bg-muted rounded w-1/4"></div>
                      <div className="h-16 bg-muted rounded"></div>
                    </div>
                  ))}
                </div>
              ) : messages && messages.length > 0 ? (
                messages.map((message) => {
                  const isCurrentUser = message.senderId === user?.id;
                  const isAdminMessage = message.senderRole === 'admin';

                  return (
                    <div
                      key={message.id}
                      className={`flex gap-3 ${isCurrentUser ? 'flex-row-reverse' : ''}`}
                      data-testid={`message-${message.id}`}
                    >
                      <div className={`flex-shrink-0 h-8 w-8 rounded-full flex items-center justify-center ${
                        isAdminMessage ? 'bg-primary' : 'bg-secondary'
                      }`}>
                        {isAdminMessage ? (
                          <Shield className="h-4 w-4 text-primary-foreground" />
                        ) : (
                          <User className="h-4 w-4 text-secondary-foreground" />
                        )}
                      </div>
                      <div className={`flex-1 max-w-[80%] space-y-1`}>
                        <div className={`flex items-baseline gap-2 ${isCurrentUser ? 'flex-row-reverse' : ''}`}>
                          <span className="text-sm font-medium">{message.senderName}</span>
                          {isAdminMessage && (
                            <Badge variant="default">
                              {t.itSupport}
                            </Badge>
                          )}
                          <span className="text-xs text-muted-foreground">
                            {format(new Date(message.createdAt), 'MMM d, HH:mm')}
                          </span>
                        </div>
                        <div className={`rounded-lg p-3 ${
                          isCurrentUser 
                            ? 'bg-primary text-primary-foreground ml-auto' 
                            : 'bg-muted'
                        }`}>
                          <p className="text-sm whitespace-pre-wrap">{message.message}</p>
                        </div>
                      </div>
                    </div>
                  );
                })
              ) : (
                <div className="text-center py-8 text-muted-foreground">
                  {t.noMessages}
                </div>
              )}
              <div ref={messagesEndRef} />
            </div>
          </ScrollArea>

          {ticket.status !== 'closed' && (
            <div className="flex gap-2">
              <Textarea
                value={newMessage}
                onChange={(e) => setNewMessage(e.target.value)}
                onKeyDown={handleKeyPress}
                placeholder={t.typeMessage}
                className="flex-1 min-h-[80px]"
                data-testid="textarea-message"
              />
              <Tooltip>
                <TooltipTrigger asChild>
                  <Button
                    onClick={handleSendMessage}
                    disabled={!newMessage.trim() || sendMessageMutation.isPending}
                    size="icon"
                    aria-label={t.sendMessage}
                    className="h-[80px] w-[80px]"
                    data-testid="button-send-message"
                  >
                    <Send className="h-5 w-5" />
                  </Button>
                </TooltipTrigger>
                <TooltipContent>{t.sendMessage}</TooltipContent>
              </Tooltip>
            </div>
          )}

          {ticket.status === 'closed' && (
            <div className="bg-muted p-4 rounded-lg text-center text-muted-foreground">
              {t.ticketClosedMessage}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
    </TooltipProvider>
  );
}
