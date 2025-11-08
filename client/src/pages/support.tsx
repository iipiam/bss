import { useState } from "react";
import { useQuery, useMutation } from "@tanstack/react-query";
import { useLanguage } from "@/contexts/LanguageContext";
import { useAuth } from "@/lib/auth";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from "@/components/ui/dialog";
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { apiRequest, queryClient } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";
import { Link } from "wouter";
import {
  Ticket,
  Plus,
  MessageCircle,
  Clock,
  CheckCircle,
  XCircle,
  AlertCircle,
  Filter,
  ArrowRight,
} from "lucide-react";
import { format } from "date-fns";

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

const ticketSchema = z.object({
  subject: z.string().min(5, "Subject must be at least 5 characters"),
  category: z.string().min(1, "Please select a category"),
  priority: z.enum(['low', 'medium', 'high', 'urgent']),
  description: z.string().min(10, "Description must be at least 10 characters"),
});

type TicketFormData = z.infer<typeof ticketSchema>;

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

export default function Support() {
  const { t } = useLanguage();
  const { user } = useAuth();
  const { toast } = useToast();
  const [isCreateDialogOpen, setIsCreateDialogOpen] = useState(false);
  const [statusFilter, setStatusFilter] = useState<string>("all");

  const form = useForm<TicketFormData>({
    resolver: zodResolver(ticketSchema),
    defaultValues: {
      subject: "",
      category: "",
      priority: "medium",
      description: "",
    },
  });

  const { data: tickets, isLoading } = useQuery<SupportTicket[]>({
    queryKey: ['/api/tickets'],
  });

  const createTicketMutation = useMutation({
    mutationFn: async (data: TicketFormData) => {
      return await apiRequest('POST', '/api/tickets', {
        ...data,
        userId: user?.id || 'default-user',
        userName: user?.username || 'User',
      });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/tickets'] });
      toast({
        title: t.ticketCreatedSuccess,
        description: "Your support ticket has been created successfully.",
      });
      setIsCreateDialogOpen(false);
      form.reset();
    },
    onError: (error: any) => {
      toast({
        title: "Error",
        description: error.message || "Failed to create ticket",
        variant: "destructive",
      });
    },
  });

  const handleCreateTicket = (data: TicketFormData) => {
    createTicketMutation.mutate(data);
  };

  const filteredTickets = tickets?.filter(ticket => {
    if (statusFilter === "all") return true;
    return ticket.status === statusFilter;
  }) || [];

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

  const statusCounts = {
    all: tickets?.length || 0,
    open: tickets?.filter(t => t.status === 'open').length || 0,
    'in-progress': tickets?.filter(t => t.status === 'in-progress').length || 0,
    resolved: tickets?.filter(t => t.status === 'resolved').length || 0,
    closed: tickets?.filter(t => t.status === 'closed').length || 0,
  };

  return (
    <div className="p-6 max-w-7xl mx-auto space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold flex items-center gap-2">
            <Ticket className="h-8 w-8" />
            {t.supportTickets || "Help & Support"}
          </h1>
          <p className="text-muted-foreground mt-1">
            {t.supportTicketsDescription || "Get help with your questions and issues"}
          </p>
        </div>
        <Button
          onClick={() => setIsCreateDialogOpen(true)}
          size="default"
          data-testid="button-create-ticket"
        >
          <Plus className="h-4 w-4 mr-2" />
          {t.createTicket || "New Ticket"}
        </Button>
      </div>

      <div className="flex gap-2 flex-wrap">
        <Button
          variant={statusFilter === "all" ? "default" : "outline"}
          size="sm"
          onClick={() => setStatusFilter("all")}
          data-testid="filter-all"
        >
          <Filter className="h-3 w-3 mr-1" />
          {t.allTickets || "All"} ({statusCounts.all})
        </Button>
        <Button
          variant={statusFilter === "open" ? "default" : "outline"}
          size="sm"
          onClick={() => setStatusFilter("open")}
          data-testid="filter-open"
        >
          <Clock className="h-3 w-3 mr-1" />
          {t.ticketStatusOpen || "Open"} ({statusCounts.open})
        </Button>
        <Button
          variant={statusFilter === "in-progress" ? "default" : "outline"}
          size="sm"
          onClick={() => setStatusFilter("in-progress")}
          data-testid="filter-in-progress"
        >
          <AlertCircle className="h-3 w-3 mr-1" />
          {t.ticketStatusInProgress || "In Progress"} ({statusCounts['in-progress']})
        </Button>
        <Button
          variant={statusFilter === "resolved" ? "default" : "outline"}
          size="sm"
          onClick={() => setStatusFilter("resolved")}
          data-testid="filter-resolved"
        >
          <CheckCircle className="h-3 w-3 mr-1" />
          {t.ticketStatusResolved || "Resolved"} ({statusCounts.resolved})
        </Button>
        <Button
          variant={statusFilter === "closed" ? "default" : "outline"}
          size="sm"
          onClick={() => setStatusFilter("closed")}
          data-testid="filter-closed"
        >
          <XCircle className="h-3 w-3 mr-1" />
          {t.ticketStatusClosed || "Closed"} ({statusCounts.closed})
        </Button>
      </div>

      {isLoading ? (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {[1, 2, 3].map(i => (
            <Card key={i} className="animate-pulse">
              <CardHeader className="space-y-2">
                <div className="h-4 bg-muted rounded w-3/4"></div>
                <div className="h-3 bg-muted rounded w-1/2"></div>
              </CardHeader>
              <CardContent>
                <div className="h-20 bg-muted rounded"></div>
              </CardContent>
            </Card>
          ))}
        </div>
      ) : filteredTickets.length === 0 ? (
        <Card>
          <CardContent className="flex flex-col items-center justify-center py-12">
            <Ticket className="h-12 w-12 text-muted-foreground mb-4" />
            <p className="text-muted-foreground text-center">
              {statusFilter === "all" 
                ? t.noData || "No support tickets yet. Create one to get started!"
                : t.noData || `No ${statusFilter} tickets found.`}
            </p>
            {statusFilter === "all" && (
              <Button
                onClick={() => setIsCreateDialogOpen(true)}
                className="mt-4"
                variant="outline"
                data-testid="button-create-first-ticket"
              >
                <Plus className="h-4 w-4 mr-2" />
                {t.createTicket || "Create Your First Ticket"}
              </Button>
            )}
          </CardContent>
        </Card>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {filteredTickets.map(ticket => (
            <Card key={ticket.id} className="hover-elevate" data-testid={`card-ticket-${ticket.id}`}>
              <CardHeader className="space-y-3">
                <div className="flex items-start justify-between gap-2">
                  <CardTitle className="text-lg line-clamp-2">{ticket.subject}</CardTitle>
                  <Badge variant={getStatusVariant(ticket.status)} className="flex items-center gap-1 flex-shrink-0">
                    {getStatusIcon(ticket.status)}
                    {getStatusLabel(ticket.status, t)}
                  </Badge>
                </div>
                <div className="flex items-center gap-2 text-sm text-muted-foreground">
                  <span className="font-mono text-xs">{ticket.ticketNumber}</span>
                  <span>•</span>
                  <Badge variant={getPriorityVariant(ticket.priority)}>
                    {getPriorityLabel(ticket.priority, t)}
                  </Badge>
                </div>
                <CardDescription className="line-clamp-2">
                  {ticket.description}
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-3">
                <div className="flex items-center justify-between text-xs text-muted-foreground">
                  <span>{t.ticketCategory || "Category"}: {ticket.category}</span>
                  <span>{format(new Date(ticket.createdAt), 'MMM d, yyyy')}</span>
                </div>
                <Link href={`/support/${ticket.id}`}>
                  <Button variant="outline" className="w-full" data-testid={`button-view-ticket-${ticket.id}`}>
                    <MessageCircle className="h-4 w-4 mr-2" />
                    {t.viewTicket || "View Chat"}
                    <ArrowRight className="h-4 w-4 ml-auto" />
                  </Button>
                </Link>
              </CardContent>
            </Card>
          ))}
        </div>
      )}

      <Dialog open={isCreateDialogOpen} onOpenChange={setIsCreateDialogOpen}>
        <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>{t.createTicket}</DialogTitle>
            <DialogDescription>
              Describe your issue and our support team will help you.
            </DialogDescription>
          </DialogHeader>
          <Form {...form}>
            <form onSubmit={form.handleSubmit(handleCreateTicket)} className="space-y-4">
              <FormField
                control={form.control}
                name="subject"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>{t.ticketSubject || "Subject"}</FormLabel>
                    <FormControl>
                      <Input
                        placeholder={t.enterSubject || "Brief description of your issue"}
                        {...field}
                        data-testid="input-ticket-subject"
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="category"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>{t.ticketCategory || "Category"}</FormLabel>
                    <Select onValueChange={field.onChange} value={field.value}>
                      <FormControl>
                        <SelectTrigger data-testid="select-ticket-category">
                          <SelectValue placeholder={t.selectCategory || "Select a category"} />
                        </SelectTrigger>
                      </FormControl>
                      <SelectContent>
                        <SelectItem value="technical">Technical Issue</SelectItem>
                        <SelectItem value="billing">Billing & Subscription</SelectItem>
                        <SelectItem value="feature">Feature Request</SelectItem>
                        <SelectItem value="bug">Bug Report</SelectItem>
                        <SelectItem value="general">General Question</SelectItem>
                        <SelectItem value="other">Other</SelectItem>
                      </SelectContent>
                    </Select>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="priority"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>{t.ticketPriority || "Priority"}</FormLabel>
                    <Select onValueChange={field.onChange} value={field.value}>
                      <FormControl>
                        <SelectTrigger data-testid="select-ticket-priority">
                          <SelectValue />
                        </SelectTrigger>
                      </FormControl>
                      <SelectContent>
                        <SelectItem value="low">{t.priorityLow || "Low"}</SelectItem>
                        <SelectItem value="medium">{t.priorityMedium || "Medium"}</SelectItem>
                        <SelectItem value="high">{t.priorityHigh || "High"}</SelectItem>
                        <SelectItem value="urgent">{t.priorityUrgent || "Urgent"}</SelectItem>
                      </SelectContent>
                    </Select>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="description"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>{t.supportTicketsDescription || "Description"}</FormLabel>
                    <FormControl>
                      <Textarea
                        placeholder={t.enterDescription || "Provide detailed information about your issue..."}
                        className="min-h-[120px]"
                        {...field}
                        data-testid="textarea-ticket-description"
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <DialogFooter>
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => setIsCreateDialogOpen(false)}
                  data-testid="button-cancel-ticket"
                >
                  {t.cancel || "Cancel"}
                </Button>
                <Button
                  type="submit"
                  disabled={createTicketMutation.isPending}
                  data-testid="button-submit-ticket"
                >
                  {createTicketMutation.isPending
                    ? t.submit || "Creating..."
                    : t.submit || "Create"}
                </Button>
              </DialogFooter>
            </form>
          </Form>
        </DialogContent>
      </Dialog>
    </div>
  );
}
