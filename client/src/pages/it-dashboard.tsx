import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Ticket, AlertCircle, Clock, CheckCircle, TrendingUp, TrendingDown, Circle, Users, Languages, Laptop, Tablet, Smartphone, Moon, Sun, Settings } from "lucide-react";
import { PieChart, Pie, BarChart, Bar, LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Cell, Legend } from "recharts";
import { useQuery, useMutation } from "@tanstack/react-query";
import { useLanguage } from "@/contexts/LanguageContext";
import { useDeviceLayout, useCompactChartConfig } from "@/lib/mobileLayout";
import { useDevice } from "@/contexts/DeviceContext";
import { useTheme } from "@/components/theme-provider";
import { useAuth } from "@/lib/auth";
import { useState, useEffect } from "react";
import { useLocation } from "wouter";
import { apiRequest, queryClient } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";

interface ITAnalytics {
  totalOpen: number;
  totalInProgress: number;
  totalResolved: number;
  totalClosed: number;
  urgentTickets: number;
  avgResponseTime: number;
  ticketsClosedToday: number;
  openTrend: number;
  statusDistribution: {
    name: string;
    value: number;
  }[];
  priorityBreakdown: {
    name: string;
    value: number;
  }[];
}

interface ITTrends {
  trends: {
    date: string;
    created: number;
    resolved: number;
  }[];
}

interface CategoryBreakdown {
  categories: {
    name: string;
    value: number;
  }[];
}

interface WorkloadData {
  staff: {
    id: number;
    name: string;
    activeTickets: number;
    resolvedTickets: number;
  }[];
}

interface ActiveTicket {
  id: string;
  ticketNumber: string;
  subject: string;
  priority: string;
  status: string;
  assignedTo: string | null;
  createdAt: string;
  category: string;
}

interface ClientAccount {
  userId: string;
  username: string;
  fullName: string;
  restaurantId: string;
  restaurantName: string;
  lastActivityAt: string | null;
  lastLoginAt: string | null;
  isOnline: boolean;
}

const COLORS = {
  primary: "hsl(var(--chart-1))",
  secondary: "hsl(var(--chart-2))",
  tertiary: "hsl(var(--chart-3))",
  quaternary: "hsl(var(--chart-4))",
  quinary: "hsl(var(--chart-5))",
};

const CHART_COLORS = [
  COLORS.primary,
  COLORS.secondary,
  COLORS.tertiary,
  COLORS.quaternary,
  COLORS.quinary,
];

export default function ITDashboard() {
  const { t, language, setLanguage } = useLanguage();
  const { device, setDevice, isUpdating: isDeviceUpdating } = useDevice();
  const { theme, setTheme } = useTheme();
  const { user, accountType } = useAuth();
  const layout = useDeviceLayout();
  const chartConfig = useCompactChartConfig();
  const [, navigate] = useLocation();
  const { toast } = useToast();
  
  const [statusFilter, setStatusFilter] = useState<string>("all");
  const [priorityFilter, setPriorityFilter] = useState<string>("all");
  const [assigneeFilter, setAssigneeFilter] = useState<string>("all");
  const [settingsOpen, setSettingsOpen] = useState(false);

  // Fetch analytics data with 30-second refetch (only when authenticated as IT)
  const { data: analytics, isLoading: analyticsLoading } = useQuery<ITAnalytics>({
    queryKey: ["/api/it/analytics"],
    refetchInterval: 30000,
    enabled: !!user && accountType === 'it',
  });

  // Fetch workload data
  const { data: workload, isLoading: workloadLoading } = useQuery<WorkloadData>({
    queryKey: ["/api/it/workload"],
    refetchInterval: 30000,
    enabled: !!user && accountType === 'it',
  });

  // Fetch trends data
  const { data: trendsData, isLoading: trendsLoading } = useQuery<ITTrends>({
    queryKey: ["/api/it/trends"],
    refetchInterval: 30000,
    enabled: !!user && accountType === 'it',
  });

  // Fetch category breakdown
  const { data: categoryData, isLoading: categoryLoading } = useQuery<CategoryBreakdown>({
    queryKey: ["/api/it/category-breakdown"],
    refetchInterval: 30000,
    enabled: !!user && accountType === 'it',
  });

  // Fetch active tickets
  const { data: activeTickets = [], isLoading: ticketsLoading } = useQuery<ActiveTicket[]>({
    queryKey: ["/api/it/active-tickets"],
    refetchInterval: 30000,
    enabled: !!user && accountType === 'it',
  });

  // Fetch client accounts activity (real-time tracking with 10-second refetch)
  const { data: clientAccounts = [], isLoading: clientAccountsLoading } = useQuery<ClientAccount[]>({
    queryKey: ["/api/it/client-accounts"],
    refetchInterval: 10000, // Refresh every 10 seconds for real-time tracking
    enabled: !!user && accountType === 'it',
  });

  // Assignment mutation
  const assignMutation = useMutation({
    mutationFn: async ({ ticketId, staffId }: { ticketId: string; staffId: string | null }) => {
      await apiRequest("PATCH", `/api/it/tickets/${ticketId}/assign`, { staffId });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/it/active-tickets"] });
      queryClient.invalidateQueries({ queryKey: ["/api/it/workload"] });
      queryClient.invalidateQueries({ queryKey: ["/api/it/analytics"] });
      toast({
        title: t.ticketUpdated || "Ticket Updated",
        description: t.ticketAssigned || "Ticket has been reassigned",
      });
    },
    onError: () => {
      toast({
        title: t.error || "Error",
        description: t.failedToUpdateTicket || "Failed to update ticket assignment",
        variant: "destructive",
      });
    },
  });

  // SECURITY: Redirect non-IT accounts immediately (after all hooks)
  useEffect(() => {
    if (accountType && accountType !== 'it') {
      navigate('/');
    }
  }, [accountType, navigate]);

  // SECURITY: Early return if not IT account (prevents flash of content)
  // This must come AFTER all hooks to avoid "Rendered more hooks than during the previous render" error
  if (accountType !== 'it') {
    return null;
  }

  // Handle device change
  const handleDeviceChange = async (newDevice: 'laptop' | 'ipad' | 'iphone') => {
    try {
      await setDevice(newDevice);
      const deviceLabel = newDevice === 'laptop' ? t.laptop : newDevice === 'ipad' ? t.ipad : t.iphone;
      toast({
        title: t.success,
        description: `${t.devicePreferenceUpdated || "Device preference updated to"} ${deviceLabel}`,
      });
    } catch (error) {
      toast({
        title: t.error,
        description: t.failedToUpdateDevicePreference || "Failed to update device preference",
        variant: "destructive",
      });
    }
  };

  // Filter tickets
  const filteredTickets = activeTickets.filter((ticket) => {
    if (statusFilter !== "all" && ticket.status !== statusFilter) return false;
    if (priorityFilter !== "all" && ticket.priority !== priorityFilter) return false;
    if (assigneeFilter !== "all") {
      if (assigneeFilter === "unassigned" && ticket.assignedTo !== null) return false;
      if (assigneeFilter !== "unassigned" && ticket.assignedTo !== assigneeFilter) return false;
    }
    return true;
  });

  const getPriorityBadgeVariant = (priority: string) => {
    switch (priority.toLowerCase()) {
      case "urgent":
        return "destructive";
      case "high":
        return "default";
      case "medium":
        return "secondary";
      case "low":
        return "outline";
      default:
        return "secondary";
    }
  };

  const getStatusBadgeVariant = (status: string) => {
    switch (status.toLowerCase()) {
      case "open":
        return "default";
      case "in progress":
        return "secondary";
      case "resolved":
        return "outline";
      case "closed":
        return "outline";
      default:
        return "secondary";
    }
  };

  const getWorkloadColor = (activeTickets: number) => {
    if (activeTickets === 0) return "text-muted-foreground";
    if (activeTickets <= 3) return "text-green-600 dark:text-green-400";
    if (activeTickets <= 7) return "text-yellow-600 dark:text-yellow-400";
    return "text-red-600 dark:text-red-400";
  };

  const getWorkloadBgColor = (activeTickets: number) => {
    if (activeTickets === 0) return "bg-muted";
    if (activeTickets <= 3) return "bg-green-500/10";
    if (activeTickets <= 7) return "bg-yellow-500/10";
    return "bg-red-500/10";
  };

  if (analyticsLoading || workloadLoading || trendsLoading || categoryLoading) {
    return (
      <div className={layout.padding}>
        <h1 className={`${layout.text3Xl} font-bold mb-2`}>{t.itDashboard}</h1>
        <p className="text-muted-foreground">{t.loading}...</p>
      </div>
    );
  }

  const allStaff = workload?.staff || [];
  const uniqueAssignees = Array.from(
    new Set(activeTickets.map((t) => t.assignedTo).filter(Boolean))
  );

  return (
    <div className={`${layout.padding} ${layout.spaceY}`}>
      {/* Header */}
      <div className="flex items-start justify-between gap-4 flex-wrap">
        <div className="flex-1 min-w-[200px]">
          <h1 className={`${layout.text3Xl} font-bold mb-2`} data-testid="text-page-title">
            {t.itDashboard}
          </h1>
          <p className="text-muted-foreground">{t.itAnalytics || "IT support analytics and ticket management"}</p>
        </div>
        
        {/* Settings Dialog for IT Users */}
        <Dialog open={settingsOpen} onOpenChange={setSettingsOpen}>
          <DialogTrigger asChild>
            <Button variant="outline" size="default" data-testid="button-it-settings">
              <Settings className="h-4 w-4 mr-2" />
              {t.settings || "Settings"}
            </Button>
          </DialogTrigger>
          <DialogContent className="sm:max-w-[500px]">
            <DialogHeader>
              <DialogTitle>{t.itPreferences || "IT Dashboard Preferences"}</DialogTitle>
              <DialogDescription>
                {t.customizeYourExperience || "Customize your IT dashboard experience"}
              </DialogDescription>
            </DialogHeader>
            <div className="space-y-6 py-4">
              {/* Language Preference */}
              <div className="space-y-2">
                <Label className="flex items-center gap-2">
                  <Languages className="h-4 w-4" />
                  {t.language || "Language"}
                </Label>
                <Select
                  value={language}
                  onValueChange={(value: string) => setLanguage(value as any)}
                >
                  <SelectTrigger data-testid="select-language">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="English">English</SelectItem>
                    <SelectItem value="Arabic">العربية (Arabic)</SelectItem>
                    <SelectItem value="Chinese">中文 (Chinese)</SelectItem>
                    <SelectItem value="German">Deutsch (German)</SelectItem>
                    <SelectItem value="Hindi">हिन्दी (Hindi)</SelectItem>
                    <SelectItem value="Urdu">اردو (Urdu)</SelectItem>
                    <SelectItem value="Bengali">বাংলা (Bengali)</SelectItem>
                    <SelectItem value="Italian">Italiano (Italian)</SelectItem>
                    <SelectItem value="Spanish">Español (Spanish)</SelectItem>
                    <SelectItem value="Tagalog">Tagalog</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              {/* Device Preference */}
              <div className="space-y-3">
                <Label className="flex items-center gap-2">
                  <Laptop className="h-4 w-4" />
                  {t.devicePreference || "Device Layout"}
                </Label>
                <div className="grid gap-2">
                  <div
                    onClick={() => !isDeviceUpdating && handleDeviceChange('laptop')}
                    className={`flex items-center gap-3 p-3 rounded-lg border-2 transition-all cursor-pointer ${
                      device === 'laptop'
                        ? 'border-primary bg-primary/5'
                        : 'border-border hover-elevate active-elevate-2'
                    } ${isDeviceUpdating ? 'opacity-50 cursor-not-allowed' : ''}`}
                    data-testid="button-device-laptop"
                  >
                    <div className={`h-10 w-10 rounded-lg flex items-center justify-center flex-shrink-0 ${
                      device === 'laptop' ? 'bg-primary text-primary-foreground' : 'bg-muted'
                    }`}>
                      <Laptop className="h-5 w-5" />
                    </div>
                    <div className="flex-1">
                      <div className="flex items-center gap-2">
                        <span className="font-medium">{t.laptop || "Laptop"}</span>
                        {device === 'laptop' && (
                          <Badge variant="default" className="text-xs">{t.active || "Active"}</Badge>
                        )}
                      </div>
                      <p className="text-xs text-muted-foreground">{t.laptopDesc || "Full desktop experience"}</p>
                    </div>
                  </div>

                  <div
                    onClick={() => !isDeviceUpdating && handleDeviceChange('ipad')}
                    className={`flex items-center gap-3 p-3 rounded-lg border-2 transition-all cursor-pointer ${
                      device === 'ipad'
                        ? 'border-primary bg-primary/5'
                        : 'border-border hover-elevate active-elevate-2'
                    } ${isDeviceUpdating ? 'opacity-50 cursor-not-allowed' : ''}`}
                    data-testid="button-device-ipad"
                  >
                    <div className={`h-10 w-10 rounded-lg flex items-center justify-center flex-shrink-0 ${
                      device === 'ipad' ? 'bg-primary text-primary-foreground' : 'bg-muted'
                    }`}>
                      <Tablet className="h-5 w-5" />
                    </div>
                    <div className="flex-1">
                      <div className="flex items-center gap-2">
                        <span className="font-medium">{t.ipad || "iPad"}</span>
                        {device === 'ipad' && (
                          <Badge variant="default" className="text-xs">{t.active || "Active"}</Badge>
                        )}
                      </div>
                      <p className="text-xs text-muted-foreground">{t.ipadDesc || "Tablet-optimized layout"}</p>
                    </div>
                  </div>

                  <div
                    onClick={() => !isDeviceUpdating && handleDeviceChange('iphone')}
                    className={`flex items-center gap-3 p-3 rounded-lg border-2 transition-all cursor-pointer ${
                      device === 'iphone'
                        ? 'border-primary bg-primary/5'
                        : 'border-border hover-elevate active-elevate-2'
                    } ${isDeviceUpdating ? 'opacity-50 cursor-not-allowed' : ''}`}
                    data-testid="button-device-iphone"
                  >
                    <div className={`h-10 w-10 rounded-lg flex items-center justify-center flex-shrink-0 ${
                      device === 'iphone' ? 'bg-primary text-primary-foreground' : 'bg-muted'
                    }`}>
                      <Smartphone className="h-5 w-5" />
                    </div>
                    <div className="flex-1">
                      <div className="flex items-center gap-2">
                        <span className="font-medium">{t.iphone || "iPhone"}</span>
                        {device === 'iphone' && (
                          <Badge variant="default" className="text-xs">{t.active || "Active"}</Badge>
                        )}
                      </div>
                      <p className="text-xs text-muted-foreground">{t.iphoneDesc || "Mobile-optimized layout"}</p>
                    </div>
                  </div>
                </div>
              </div>

              {/* Theme Preference */}
              <div className="space-y-2">
                <Label className="flex items-center gap-2">
                  {theme === "light" ? <Sun className="h-4 w-4" /> : <Moon className="h-4 w-4" />}
                  {t.theme || "Theme"}
                </Label>
                <div className="flex gap-2">
                  <Button
                    variant={theme === "light" ? "default" : "outline"}
                    size="default"
                    onClick={() => setTheme("light")}
                    className="flex-1"
                    data-testid="button-theme-light"
                  >
                    <Sun className="h-4 w-4 mr-2" />
                    {t.light || "Light"}
                  </Button>
                  <Button
                    variant={theme === "dark" ? "default" : "outline"}
                    size="default"
                    onClick={() => setTheme("dark")}
                    className="flex-1"
                    data-testid="button-theme-dark"
                  >
                    <Moon className="h-4 w-4 mr-2" />
                    {t.dark || "Dark"}
                  </Button>
                </div>
              </div>
            </div>
          </DialogContent>
        </Dialog>
      </div>

      {/* Real-Time Metrics Cards */}
      <div className={`grid ${layout.gridCols({ desktop: 4, tablet: 2, mobile: 1 })} ${layout.gap}`}>
        <Card className="hover-elevate transition-all bg-gradient-to-br from-primary/5 to-primary/10" data-testid="card-metric-total-open">
          <CardContent className={layout.cardPadding}>
            <div className="flex items-start justify-between">
              <div className="flex-1">
                <p className="text-sm text-muted-foreground mb-2">{t.totalOpen}</p>
                <p className={`${layout.text3Xl} font-bold font-mono`}>{analytics?.totalOpen || 0}</p>
                {analytics && analytics.openTrend !== undefined && analytics.openTrend !== 0 && !isNaN(analytics.openTrend) && (
                  <div className="flex items-center gap-1 mt-2">
                    {analytics.openTrend > 0 ? (
                      <TrendingUp className="h-4 w-4 text-red-600 dark:text-red-400" />
                    ) : (
                      <TrendingDown className="h-4 w-4 text-green-600 dark:text-green-400" />
                    )}
                    <span
                      className={`text-sm font-medium ${
                        analytics.openTrend > 0 ? "text-red-600 dark:text-red-400" : "text-green-600 dark:text-green-400"
                      }`}
                    >
                      {Math.abs(analytics.openTrend).toFixed(0)}%
                    </span>
                  </div>
                )}
              </div>
              <div className="bg-primary/10 p-3 rounded-md">
                <Ticket className={`${layout.isMobile ? 'w-5 h-5' : 'w-6 h-6'} text-primary`} />
              </div>
            </div>
          </CardContent>
        </Card>

        <Card
          className={`hover-elevate transition-all ${
            (analytics?.urgentTickets || 0) > 0
              ? "bg-gradient-to-br from-destructive/5 to-destructive/10"
              : "bg-gradient-to-br from-muted/5 to-muted/10"
          }`}
          data-testid="card-metric-urgent"
        >
          <CardContent className={layout.cardPadding}>
            <div className="flex items-start justify-between">
              <div className="flex-1">
                <p className="text-sm text-muted-foreground mb-2">{t.urgentTickets}</p>
                <p
                  className={`${layout.text3Xl} font-bold font-mono ${
                    (analytics?.urgentTickets || 0) > 0 ? "text-destructive" : ""
                  }`}
                >
                  {analytics?.urgentTickets || 0}
                </p>
                <p className="text-xs text-muted-foreground mt-2">{t.priorityUrgent}</p>
              </div>
              <div className={`${(analytics?.urgentTickets || 0) > 0 ? "bg-destructive/10" : "bg-muted"} p-3 rounded-md`}>
                <AlertCircle
                  className={`${layout.isMobile ? 'w-5 h-5' : 'w-6 h-6'} ${
                    (analytics?.urgentTickets || 0) > 0 ? "text-destructive" : "text-muted-foreground"
                  }`}
                />
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="hover-elevate transition-all bg-gradient-to-br from-blue-500/5 to-blue-500/10" data-testid="card-metric-response-time">
          <CardContent className={layout.cardPadding}>
            <div className="flex items-start justify-between">
              <div className="flex-1">
                <p className="text-sm text-muted-foreground mb-2">{t.avgResponseTime}</p>
                <p className={`${layout.text3Xl} font-bold font-mono`}>
                  {analytics?.avgResponseTime?.toFixed(1) || "0.0"}
                </p>
                <p className="text-xs text-muted-foreground mt-2">{t.hours}</p>
              </div>
              <div className="bg-blue-500/10 p-3 rounded-md">
                <Clock className={`${layout.isMobile ? 'w-5 h-5' : 'w-6 h-6'} text-blue-600 dark:text-blue-400`} />
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="hover-elevate transition-all bg-gradient-to-br from-green-500/5 to-green-500/10" data-testid="card-metric-closed-today">
          <CardContent className={layout.cardPadding}>
            <div className="flex items-start justify-between">
              <div className="flex-1">
                <p className="text-sm text-muted-foreground mb-2">{t.ticketsClosedToday}</p>
                <p className={`${layout.text3Xl} font-bold font-mono`}>{analytics?.ticketsClosedToday || 0}</p>
                <p className="text-xs text-muted-foreground mt-2">{t.completed}</p>
              </div>
              <div className="bg-green-500/10 p-3 rounded-md">
                <CheckCircle className={`${layout.isMobile ? 'w-5 h-5' : 'w-6 h-6'} text-green-600 dark:text-green-400`} />
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Charts Section */}
      <div className={`grid ${layout.gridCols({ desktop: 2, tablet: 1, mobile: 1 })} ${layout.gap}`}>
        {/* Status Distribution Pie Chart */}
        <Card className="hover-elevate transition-all" data-testid="card-status-distribution">
          <CardHeader>
            <CardTitle>{t.statusDistribution}</CardTitle>
            <CardDescription>{t.ticketStatusOverview || "Overview of ticket statuses"}</CardDescription>
          </CardHeader>
          <CardContent>
            <ResponsiveContainer width="100%" height={layout.chartHeight}>
              <PieChart>
                <Pie
                  data={analytics?.statusDistribution || []}
                  cx="50%"
                  cy="50%"
                  labelLine={!layout.isMobile}
                  label={!layout.isMobile ? ({ name, percent }) => `${name}: ${(percent * 100).toFixed(0)}%` : undefined}
                  outerRadius={layout.isMobile ? 80 : 100}
                  fill={COLORS.primary}
                  dataKey="value"
                >
                  {(analytics?.statusDistribution || []).map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={CHART_COLORS[index % CHART_COLORS.length]} />
                  ))}
                </Pie>
                <Tooltip />
                {chartConfig.showLegend && <Legend />}
              </PieChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>

        {/* Priority Breakdown Bar Chart */}
        <Card className="hover-elevate transition-all" data-testid="card-priority-breakdown">
          <CardHeader>
            <CardTitle>{t.priorityBreakdown}</CardTitle>
            <CardDescription>{t.ticketsByPriority || "Tickets grouped by priority level"}</CardDescription>
          </CardHeader>
          <CardContent>
            <ResponsiveContainer width="100%" height={layout.chartHeight}>
              <BarChart data={analytics?.priorityBreakdown || []}>
                <CartesianGrid {...chartConfig.cartesianGrid} className="stroke-border" />
                <XAxis dataKey="name" className="text-xs" />
                <YAxis className="text-xs" />
                <Tooltip />
                <Bar dataKey="value" fill={COLORS.primary} radius={[4, 4, 0, 0]} data-testid="bar-priority">
                  {(analytics?.priorityBreakdown || []).map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={CHART_COLORS[index % CHART_COLORS.length]} />
                  ))}
                </Bar>
              </BarChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>

        {/* Ticket Trends Line Chart */}
        <Card className="hover-elevate transition-all" data-testid="card-ticket-trends">
          <CardHeader>
            <CardTitle>{t.ticketTrends}</CardTitle>
            <CardDescription>{t.createdVsResolved || "Created vs Resolved over 30 days"}</CardDescription>
          </CardHeader>
          <CardContent>
            <ResponsiveContainer width="100%" height={layout.chartHeight}>
              <LineChart data={trendsData?.trends || []}>
                <CartesianGrid {...chartConfig.cartesianGrid} className="stroke-border" />
                <XAxis dataKey="date" className="text-xs" />
                <YAxis className="text-xs" />
                <Tooltip />
                {chartConfig.showLegend && <Legend />}
                <Line
                  type="monotone"
                  dataKey="created"
                  stroke={COLORS.primary}
                  strokeWidth={2}
                  name={t.created || "Created"}
                  data-testid="line-created"
                />
                <Line
                  type="monotone"
                  dataKey="resolved"
                  stroke={COLORS.secondary}
                  strokeWidth={2}
                  name={t.resolved || "Resolved"}
                  data-testid="line-resolved"
                />
              </LineChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>

        {/* Category Breakdown Pie Chart */}
        <Card className="hover-elevate transition-all" data-testid="card-category-breakdown">
          <CardHeader>
            <CardTitle>{t.categoryBreakdown}</CardTitle>
            <CardDescription>{t.ticketsByCategory || "Tickets grouped by category"}</CardDescription>
          </CardHeader>
          <CardContent>
            <ResponsiveContainer width="100%" height={layout.chartHeight}>
              <PieChart>
                <Pie
                  data={categoryData?.categories || []}
                  cx="50%"
                  cy="50%"
                  labelLine={!layout.isMobile}
                  label={!layout.isMobile ? ({ name, percent }) => `${name}: ${(percent * 100).toFixed(0)}%` : undefined}
                  outerRadius={layout.isMobile ? 80 : 100}
                  fill={COLORS.primary}
                  dataKey="value"
                >
                  {(categoryData?.categories || []).map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={CHART_COLORS[index % CHART_COLORS.length]} />
                  ))}
                </Pie>
                <Tooltip />
                {chartConfig.showLegend && <Legend />}
              </PieChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>
      </div>

      {/* Workload Distribution Section */}
      <Card className="hover-elevate transition-all" data-testid="card-workload-distribution">
        <CardHeader>
          <CardTitle>{t.workloadDistribution}</CardTitle>
          <CardDescription>{t.itStaffWorkload || "IT staff member workload and performance"}</CardDescription>
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>{t.name || "Name"}</TableHead>
                <TableHead>{t.activeTickets}</TableHead>
                <TableHead>{t.resolvedTickets}</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {allStaff.map((staff) => (
                <TableRow key={staff.id} data-testid={`row-staff-${staff.id}`}>
                  <TableCell className="font-medium">{staff.name}</TableCell>
                  <TableCell>
                    <div className={`inline-flex items-center gap-2 px-3 py-1 rounded-md ${getWorkloadBgColor(staff.activeTickets)}`}>
                      <span className={`font-bold font-mono ${getWorkloadColor(staff.activeTickets)}`}>
                        {staff.activeTickets}
                      </span>
                    </div>
                  </TableCell>
                  <TableCell className="font-mono text-muted-foreground">{staff.resolvedTickets}</TableCell>
                </TableRow>
              ))}
              {allStaff.length === 0 && (
                <TableRow>
                  <TableCell colSpan={3} className="text-center text-muted-foreground">
                    {t.noData || "No staff data available"}
                  </TableCell>
                </TableRow>
              )}
            </TableBody>
          </Table>
        </CardContent>
      </Card>

      {/* Client Account Tracking (Real-Time) */}
      <Card className="hover-elevate transition-all" data-testid="card-client-accounts">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Users className="h-5 w-5" />
            {t.clientAccounts || "Client Accounts"}
          </CardTitle>
          <CardDescription>{t.clientAccountTracking || "Real-time tracking of client account activity and online status"}</CardDescription>
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>{t.status || "Status"}</TableHead>
                <TableHead>{t.username || "Username"}</TableHead>
                <TableHead>{t.fullName || "Full Name"}</TableHead>
                <TableHead>{t.restaurant || "Business"}</TableHead>
                <TableHead>{t.lastActivity || "Last Activity"}</TableHead>
                <TableHead>{t.lastLogin || "Last Login"}</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {clientAccountsLoading ? (
                <TableRow>
                  <TableCell colSpan={6} className="text-center text-muted-foreground">
                    {t.loading}...
                  </TableCell>
                </TableRow>
              ) : clientAccounts.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={6} className="text-center text-muted-foreground">
                    {t.noData || "No client accounts found"}
                  </TableCell>
                </TableRow>
              ) : (
                clientAccounts.map((account) => (
                  <TableRow key={account.userId} data-testid={`row-client-${account.userId}`}>
                    <TableCell>
                      <div className="flex items-center gap-2">
                        <Circle
                          className={`h-3 w-3 ${
                            account.isOnline
                              ? "fill-green-500 text-green-500"
                              : "fill-gray-400 text-gray-400"
                          }`}
                        />
                        <span className={`text-sm font-medium ${
                          account.isOnline ? "text-green-600 dark:text-green-400" : "text-muted-foreground"
                        }`}>
                          {account.isOnline ? (t.online || "Online") : (t.offline || "Offline")}
                        </span>
                      </div>
                    </TableCell>
                    <TableCell className="font-medium font-mono">{account.username}</TableCell>
                    <TableCell>{account.fullName}</TableCell>
                    <TableCell className="text-muted-foreground">{account.restaurantName}</TableCell>
                    <TableCell className="text-sm text-muted-foreground">
                      {account.lastActivityAt
                        ? new Date(account.lastActivityAt).toLocaleString()
                        : (t.never || "Never")}
                    </TableCell>
                    <TableCell className="text-sm text-muted-foreground">
                      {account.lastLoginAt
                        ? new Date(account.lastLoginAt).toLocaleString()
                        : (t.never || "Never")}
                    </TableCell>
                  </TableRow>
                ))
              )}
            </TableBody>
          </Table>
        </CardContent>
      </Card>

      {/* Active Tickets Table */}
      <Card className="hover-elevate transition-all" data-testid="card-active-tickets">
        <CardHeader>
          <div className="flex items-center justify-between flex-wrap gap-4">
            <div>
              <CardTitle>{t.activeTickets}</CardTitle>
              <CardDescription>{t.manageAssignTickets || "View, filter, and assign active tickets"}</CardDescription>
            </div>
            <div className="flex gap-2 flex-wrap">
              <Select value={statusFilter} onValueChange={setStatusFilter}>
                <SelectTrigger className="w-40" data-testid="select-status-filter">
                  <SelectValue placeholder={t.status || "Status"} />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">{t.all || "All"}</SelectItem>
                  <SelectItem value="Open">{t.ticketStatusOpen}</SelectItem>
                  <SelectItem value="In Progress">{t.ticketStatusInProgress}</SelectItem>
                  <SelectItem value="Resolved">{t.ticketStatusResolved}</SelectItem>
                  <SelectItem value="Closed">{t.ticketStatusClosed}</SelectItem>
                </SelectContent>
              </Select>

              <Select value={priorityFilter} onValueChange={setPriorityFilter}>
                <SelectTrigger className="w-40" data-testid="select-priority-filter">
                  <SelectValue placeholder={t.ticketPriority || "Priority"} />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">{t.all || "All"}</SelectItem>
                  <SelectItem value="Low">{t.priorityLow}</SelectItem>
                  <SelectItem value="Medium">{t.priorityMedium}</SelectItem>
                  <SelectItem value="High">{t.priorityHigh}</SelectItem>
                  <SelectItem value="Urgent">{t.priorityUrgent}</SelectItem>
                </SelectContent>
              </Select>

              <Select value={assigneeFilter} onValueChange={setAssigneeFilter}>
                <SelectTrigger className="w-40" data-testid="select-assignee-filter">
                  <SelectValue placeholder={t.assignedTo || "Assigned To"} />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">{t.all || "All"}</SelectItem>
                  <SelectItem value="unassigned">{t.unassigned || "Unassigned"}</SelectItem>
                  {uniqueAssignees.map((assignee) => (
                    <SelectItem key={assignee} value={assignee!}>
                      {assignee}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>{t.ticketNumber || "Ticket #"}</TableHead>
                <TableHead>{t.ticketSubject}</TableHead>
                <TableHead>{t.ticketPriority}</TableHead>
                <TableHead>{t.status}</TableHead>
                <TableHead>{t.assignedTo}</TableHead>
                <TableHead>{t.created || "Created"}</TableHead>
                <TableHead className="text-right">{t.actions || "Actions"}</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {ticketsLoading ? (
                <TableRow>
                  <TableCell colSpan={7} className="text-center text-muted-foreground">
                    {t.loading}...
                  </TableCell>
                </TableRow>
              ) : filteredTickets.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={7} className="text-center text-muted-foreground">
                    {t.noTicketsFound || "No tickets found"}
                  </TableCell>
                </TableRow>
              ) : (
                filteredTickets.map((ticket) => (
                  <TableRow
                    key={ticket.id}
                    className="hover-elevate cursor-pointer"
                    onClick={() => navigate(`/support/${ticket.id}`)}
                    data-testid={`row-ticket-${ticket.id}`}
                  >
                    <TableCell className="font-mono font-medium">{ticket.ticketNumber}</TableCell>
                    <TableCell className="max-w-xs truncate">{ticket.subject}</TableCell>
                    <TableCell>
                      <Badge variant={getPriorityBadgeVariant(ticket.priority)} data-testid={`badge-priority-${ticket.id}`}>
                        {ticket.priority}
                      </Badge>
                    </TableCell>
                    <TableCell>
                      <Badge variant={getStatusBadgeVariant(ticket.status)} data-testid={`badge-status-${ticket.id}`}>
                        {ticket.status}
                      </Badge>
                    </TableCell>
                    <TableCell>
                      <Select
                        value={ticket.assignedTo?.toString() || "unassigned"}
                        onValueChange={(value) => {
                          const staffId = value === "unassigned" ? null : value;
                          assignMutation.mutate({ ticketId: ticket.id, staffId });
                        }}
                        disabled={assignMutation.isPending}
                      >
                        <SelectTrigger
                          className="w-40"
                          onClick={(e) => e.stopPropagation()}
                          data-testid={`select-assign-${ticket.id}`}
                        >
                          <SelectValue placeholder={t.unassigned || "Unassigned"} />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="unassigned">{t.unassigned || "Unassigned"}</SelectItem>
                          {allStaff.map((staff) => (
                            <SelectItem key={staff.id} value={staff.id.toString()}>
                              {staff.name}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </TableCell>
                    <TableCell className="text-sm text-muted-foreground">
                      {new Date(ticket.createdAt).toLocaleDateString()}
                    </TableCell>
                    <TableCell className="text-right">
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={(e) => {
                          e.stopPropagation();
                          navigate(`/support/${ticket.id}`);
                        }}
                        data-testid={`button-view-${ticket.id}`}
                      >
                        {t.viewTicket || "View"}
                      </Button>
                    </TableCell>
                  </TableRow>
                ))
              )}
            </TableBody>
          </Table>
        </CardContent>
      </Card>
    </div>
  );
}
