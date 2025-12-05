import { useState, useEffect } from "react";
import { useQuery, useMutation } from "@tanstack/react-query";
import { useLocation } from "wouter";
import { useAuth } from "@/lib/auth";
import { useLanguage } from "@/contexts/LanguageContext";
import { useDevice } from "@/contexts/DeviceContext";
import { apiRequest } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Skeleton } from "@/components/ui/skeleton";
import { 
  Building2, 
  Users, 
  Receipt, 
  Calculator,
  FileText,
  FileSpreadsheet,
  Search,
  Calendar,
  Phone,
  Mail,
  CreditCard,
  Shield,
  Download,
  RefreshCw,
  DollarSign,
  Percent,
  Power,
  PowerOff,
  Loader2
} from "lucide-react";

interface Client {
  restaurantId: string;
  restaurantName: string;
  businessType: string | null;
  type: string | null;
  subscriptionPlan: string | null;
  subscriptionStatus: string | null;
  subscriptionStartDate: string | null;
  subscriptionEndDate: string | null;
  branchesCount: number | null;
  nationalId: string | null;
  taxNumber: string | null;
  commercialRegistration: string | null;
  createdAt: string;
  adminId: string | null;
  adminFullName: string | null;
  adminEmail: string | null;
  adminPhone: string | null;
  adminUsername: string | null;
}

interface Invoice {
  id: string;
  serialNumber: string;
  subscriptionPlan: string;
  branchesCount: number;
  basePlanPrice: string;
  additionalBranchesPrice: string;
  subtotal: string;
  vatAmount: string;
  total: string;
  invoiceDate: string;
  pdfPath: string | null;
  userId: string | null;
  userName: string | null;
  userEmail: string | null;
  restaurantId: string | null;
  restaurantName: string | null;
  taxNumber: string | null;
  commercialRegistration: string | null;
}

interface VatSummary {
  totalSubscriptions: number;
  totalSubtotal: string;
  totalVatCollected: string;
  totalRevenue: string;
  vatRate: string;
  vatCalculationVerification: {
    baseAmount: string;
    calculatedVat: string;
    isCorrect: boolean;
  };
  periodStart: string | null;
  periodEnd: string | null;
}

export default function BusinessManagement() {
  const { user, accountType, isLoading: authLoading } = useAuth();
  const { t } = useLanguage();
  const { device } = useDevice();
  const { toast } = useToast();
  const [, navigate] = useLocation();
  
  const layout = {
    padding: device === 'iphone' ? 'p-3' : device === 'ipad' ? 'p-4' : 'p-6',
    spaceY: device === 'iphone' ? 'space-y-3' : device === 'ipad' ? 'space-y-4' : 'space-y-6',
    text3Xl: device === 'iphone' ? 'text-xl' : device === 'ipad' ? 'text-2xl' : 'text-3xl',
  };

  const [activeTab, setActiveTab] = useState("clients");
  const [searchQuery, setSearchQuery] = useState("");
  const [statusFilter, setStatusFilter] = useState<"all" | "active" | "expired" | "cancelled">("all");
  const [fromDate, setFromDate] = useState("");
  const [toDate, setToDate] = useState("");

  // All hooks must be called before any conditional returns
  const { data: clients = [], isLoading: clientsLoading, refetch: refetchClients } = useQuery<Client[]>({
    queryKey: ['/api/it/business-management/clients'],
    enabled: !authLoading && !!user && accountType === 'it',
  });

  const { data: invoices = [], isLoading: invoicesLoading, refetch: refetchInvoices } = useQuery<Invoice[]>({
    queryKey: ['/api/it/business-management/invoices', fromDate, toDate],
    enabled: !authLoading && !!user && accountType === 'it',
  });

  const { data: vatSummary, isLoading: vatLoading, refetch: refetchVat } = useQuery<VatSummary>({
    queryKey: ['/api/it/business-management/vat-summary', fromDate, toDate],
    enabled: !authLoading && !!user && accountType === 'it',
  });

  const downloadPdfMutation = useMutation({
    mutationFn: async () => {
      const response = await fetch('/api/it/business-management/vat-statement/pdf', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify({ fromDate, toDate }),
      });
      if (!response.ok) {
        const errorText = await response.text();
        throw new Error(errorText || 'Failed to generate PDF');
      }
      const arrayBuffer = await response.arrayBuffer();
      return new Blob([arrayBuffer], { type: 'application/pdf' });
    },
    onSuccess: (blob) => {
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `VAT-Statement-${new Date().toISOString().split('T')[0]}.pdf`;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      URL.revokeObjectURL(url);
      toast({
        title: t.success || "Success",
        description: "VAT statement PDF downloaded successfully",
      });
    },
    onError: (error) => {
      console.error("VAT PDF download error:", error);
      toast({
        title: t.error || "Error",
        description: "Failed to generate VAT statement PDF",
        variant: "destructive",
      });
    },
  });

  const downloadExcelMutation = useMutation({
    mutationFn: async () => {
      const response = await fetch('/api/it/business-management/vat-statement/excel', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify({ fromDate, toDate }),
      });
      if (!response.ok) throw new Error('Failed to generate Excel');
      return response.blob();
    },
    onSuccess: (blob) => {
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `VAT-Statement-${new Date().toISOString().split('T')[0]}.xlsx`;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      URL.revokeObjectURL(url);
      toast({
        title: t.success || "Success",
        description: "VAT statement Excel downloaded successfully",
      });
    },
    onError: () => {
      toast({
        title: t.error || "Error",
        description: "Failed to generate VAT statement Excel",
        variant: "destructive",
      });
    },
  });

  const downloadInvoicePdfMutation = useMutation({
    mutationFn: async (invoiceId: string) => {
      const response = await fetch(`/api/it/business-management/invoices/${invoiceId}/pdf`, {
        method: 'GET',
        credentials: 'include',
      });
      if (!response.ok) {
        const errorData = await response.text();
        throw new Error(errorData || 'Failed to generate invoice PDF');
      }
      const arrayBuffer = await response.arrayBuffer();
      return { blob: new Blob([arrayBuffer], { type: 'application/pdf' }), invoiceId };
    },
    onSuccess: ({ blob, invoiceId }) => {
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `Invoice-${invoiceId}.pdf`;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      URL.revokeObjectURL(url);
      toast({
        title: t.success || "Success",
        description: "Invoice PDF downloaded successfully",
      });
    },
    onError: (error) => {
      console.error("PDF download error:", error);
      toast({
        title: t.error || "Error",
        description: "Failed to generate invoice PDF",
        variant: "destructive",
      });
    },
  });

  const updateSubscriptionStatusMutation = useMutation({
    mutationFn: async ({ restaurantId, status }: { restaurantId: string; status: string }) => {
      const response = await fetch(`/api/it/business-management/subscriptions/${restaurantId}/status`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify({ status }),
      });
      if (!response.ok) throw new Error('Failed to update subscription status');
      return response.json();
    },
    onSuccess: (_, variables) => {
      refetchClients();
      toast({
        title: t.success || "Success",
        description: variables.status === 'active' 
          ? "Subscription activated successfully" 
          : "Subscription suspended successfully",
      });
    },
    onError: () => {
      toast({
        title: t.error || "Error",
        description: "Failed to update subscription status",
        variant: "destructive",
      });
    },
  });

  useEffect(() => {
    if (!authLoading && accountType && accountType !== 'it') {
      navigate('/');
    }
  }, [accountType, authLoading, navigate]);

  // Loading and access control after all hooks
  if (authLoading || !accountType) {
    return (
      <div className={layout.padding}>
        <Skeleton className="h-8 w-64 mb-4" />
        <Skeleton className="h-4 w-96 mb-8" />
        <div className="space-y-4">
          {[1, 2, 3].map(i => (
            <Skeleton key={i} className="h-16 w-full" />
          ))}
        </div>
      </div>
    );
  }

  if (accountType !== 'it') {
    return null;
  }

  const filteredClients = clients.filter(client => {
    const matchesSearch = 
      !searchQuery ||
      client.restaurantName?.toLowerCase().includes(searchQuery.toLowerCase()) ||
      client.adminFullName?.toLowerCase().includes(searchQuery.toLowerCase()) ||
      client.adminEmail?.toLowerCase().includes(searchQuery.toLowerCase()) ||
      client.taxNumber?.toLowerCase().includes(searchQuery.toLowerCase());
    
    const matchesStatus = 
      statusFilter === "all" ||
      (statusFilter === "active" && client.subscriptionStatus === "active") ||
      (statusFilter === "expired" && client.subscriptionStatus === "expired") ||
      (statusFilter === "cancelled" && client.subscriptionStatus === "cancelled");
    
    return matchesSearch && matchesStatus;
  });

  const filteredInvoices = invoices.filter(invoice => {
    const matchesSearch = 
      !searchQuery ||
      invoice.serialNumber?.toLowerCase().includes(searchQuery.toLowerCase()) ||
      invoice.restaurantName?.toLowerCase().includes(searchQuery.toLowerCase()) ||
      invoice.userName?.toLowerCase().includes(searchQuery.toLowerCase());
    
    return matchesSearch;
  });

  const getStatusBadge = (status: string | null) => {
    switch (status) {
      case "active":
        return <Badge className="bg-green-500" data-testid="badge-status-active">{t.active}</Badge>;
      case "expired":
        return <Badge variant="destructive" data-testid="badge-status-expired">{t.expired || "Expired"}</Badge>;
      case "cancelled":
        return <Badge variant="secondary" data-testid="badge-status-cancelled">{t.cancelled || "Cancelled"}</Badge>;
      default:
        return <Badge variant="outline" data-testid="badge-status-unknown">{status || "N/A"}</Badge>;
    }
  };

  const getPlanBadge = (plan: string | null) => {
    switch (plan) {
      case "yearly":
        return <Badge className="bg-blue-500" data-testid="badge-plan-yearly">{t.yearly}</Badge>;
      case "monthly":
        return <Badge className="bg-purple-500" data-testid="badge-plan-monthly">{t.monthly}</Badge>;
      case "weekly":
        return <Badge className="bg-orange-500" data-testid="badge-plan-weekly">{t.weekly}</Badge>;
      default:
        return <Badge variant="outline" data-testid="badge-plan-unknown">{plan || "N/A"}</Badge>;
    }
  };

  const formatDate = (dateString: string | null) => {
    if (!dateString) return "N/A";
    return new Date(dateString).toLocaleDateString('en-GB', {
      day: '2-digit',
      month: 'short',
      year: 'numeric'
    });
  };

  const formatCurrency = (amount: string | number | null) => {
    if (amount === null || amount === undefined) return "0.00 SAR";
    const num = typeof amount === 'string' ? parseFloat(amount) : amount;
    return `${num.toFixed(2)} SAR`;
  };

  return (
    <div className={`${layout.padding} ${layout.spaceY}`}>
      <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
        <div>
          <h1 className={`font-bold ${layout.text3Xl}`} data-testid="text-page-title">
            <Building2 className="inline-block w-8 h-8 mr-2" />
            {t.businessManagement}
          </h1>
          <p className="text-muted-foreground mt-1" data-testid="text-page-description">
            {t.businessManagementDescription}
          </p>
        </div>
        <Badge className="bg-green-600 self-start" data-testid="badge-zatca-compliant">
          <Shield className="w-4 h-4 mr-1" />
          {t.zatcaCompliant}
        </Badge>
      </div>

      <div className="grid gap-4 md:grid-cols-4">
        <Card data-testid="card-total-clients">
          <CardHeader className="flex flex-row items-center justify-between gap-1 space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">{t.totalSubscriptions}</CardTitle>
            <Users className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{clients.length}</div>
            <p className="text-xs text-muted-foreground">{t.allClients}</p>
          </CardContent>
        </Card>

        <Card data-testid="card-active-subscriptions">
          <CardHeader className="flex flex-row items-center justify-between gap-1 space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">{t.activeSubscriptions}</CardTitle>
            <CreditCard className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-green-600">
              {clients.filter(c => c.subscriptionStatus === 'active').length}
            </div>
            <p className="text-xs text-muted-foreground">{t.active}</p>
          </CardContent>
        </Card>

        <Card data-testid="card-total-revenue">
          <CardHeader className="flex flex-row items-center justify-between gap-1 space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">{t.totalRevenue}</CardTitle>
            <DollarSign className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{formatCurrency(vatSummary?.totalRevenue || 0)}</div>
            <p className="text-xs text-muted-foreground">{t.subscriptionAmount}</p>
          </CardContent>
        </Card>

        <Card data-testid="card-total-vat">
          <CardHeader className="flex flex-row items-center justify-between gap-1 space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">{t.totalVatCollected}</CardTitle>
            <Percent className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-blue-600">{formatCurrency(vatSummary?.totalVatCollected || 0)}</div>
            <p className="text-xs text-muted-foreground">{t.vatRate || "VAT 15%"}</p>
          </CardContent>
        </Card>
      </div>

      <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
        <TabsList className="grid w-full grid-cols-3" data-testid="tabs-list">
          <TabsTrigger value="clients" data-testid="tab-clients">
            <Users className="w-4 h-4 mr-2" />
            {t.clientSubscriptions}
          </TabsTrigger>
          <TabsTrigger value="invoices" data-testid="tab-invoices">
            <Receipt className="w-4 h-4 mr-2" />
            {t.subscriptionInvoices}
          </TabsTrigger>
          <TabsTrigger value="vat" data-testid="tab-vat">
            <Calculator className="w-4 h-4 mr-2" />
            {t.vatGenerator}
          </TabsTrigger>
        </TabsList>

        <TabsContent value="clients" className="space-y-4" data-testid="content-clients">
          <Card>
            <CardHeader>
              <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
                <div>
                  <CardTitle>{t.clientSubscriptions}</CardTitle>
                  <CardDescription>{t.contactDetails}</CardDescription>
                </div>
                <div className="flex flex-col gap-2 md:flex-row md:items-center">
                  <div className="relative">
                    <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                    <Input
                      placeholder={t.search || "Search..."}
                      value={searchQuery}
                      onChange={(e) => setSearchQuery(e.target.value)}
                      className="pl-10 w-64"
                      data-testid="input-search-clients"
                    />
                  </div>
                  <div className="flex gap-2">
                    <Button
                      variant={statusFilter === "all" ? "default" : "outline"}
                      size="sm"
                      onClick={() => setStatusFilter("all")}
                      data-testid="button-filter-all"
                    >
                      {t.all}
                    </Button>
                    <Button
                      variant={statusFilter === "active" ? "default" : "outline"}
                      size="sm"
                      onClick={() => setStatusFilter("active")}
                      data-testid="button-filter-active"
                    >
                      {t.active}
                    </Button>
                    <Button
                      variant={statusFilter === "expired" ? "default" : "outline"}
                      size="sm"
                      onClick={() => setStatusFilter("expired")}
                      data-testid="button-filter-expired"
                    >
                      {t.expired || "Expired"}
                    </Button>
                  </div>
                  <Button
                    variant="outline"
                    size="icon"
                    onClick={() => refetchClients()}
                    data-testid="button-refresh-clients"
                  >
                    <RefreshCw className="h-4 w-4" />
                  </Button>
                </div>
              </div>
            </CardHeader>
            <CardContent>
              {clientsLoading ? (
                <div className="space-y-4">
                  {[1, 2, 3].map(i => <Skeleton key={i} className="h-16 w-full" />)}
                </div>
              ) : filteredClients.length === 0 ? (
                <div className="text-center py-8 text-muted-foreground" data-testid="text-no-clients">
                  {t.noClientsFound}
                </div>
              ) : (
                <div className="overflow-x-auto">
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>{t.clientName}</TableHead>
                        <TableHead>{t.contactDetails}</TableHead>
                        <TableHead>{t.subscriptionType}</TableHead>
                        <TableHead>{t.status}</TableHead>
                        <TableHead>{t.taxNumber}</TableHead>
                        <TableHead>{t.branchCount}</TableHead>
                        <TableHead>{t.date}</TableHead>
                        <TableHead>{t.actions}</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {filteredClients.map((client) => (
                        <TableRow key={client.restaurantId} data-testid={`row-client-${client.restaurantId}`}>
                          <TableCell>
                            <div className="font-medium">{client.restaurantName}</div>
                            <div className="text-sm text-muted-foreground">{client.adminFullName || "No admin"}</div>
                          </TableCell>
                          <TableCell>
                            <div className="flex flex-col gap-1">
                              {client.adminEmail && (
                                <div className="flex items-center gap-1 text-sm">
                                  <Mail className="h-3 w-3" />
                                  {client.adminEmail}
                                </div>
                              )}
                              {client.adminPhone && (
                                <div className="flex items-center gap-1 text-sm">
                                  <Phone className="h-3 w-3" />
                                  {client.adminPhone}
                                </div>
                              )}
                            </div>
                          </TableCell>
                          <TableCell>{getPlanBadge(client.subscriptionPlan)}</TableCell>
                          <TableCell>{getStatusBadge(client.subscriptionStatus)}</TableCell>
                          <TableCell className="font-mono text-sm">{client.taxNumber || "N/A"}</TableCell>
                          <TableCell>{client.branchesCount || 1}</TableCell>
                          <TableCell>
                            <div className="text-sm">
                              <div>{formatDate(client.subscriptionStartDate)}</div>
                              <div className="text-muted-foreground">to {formatDate(client.subscriptionEndDate)}</div>
                            </div>
                          </TableCell>
                          <TableCell>
                            <div className="flex gap-1">
                              {client.subscriptionStatus === 'active' ? (
                                <Button
                                  variant="outline"
                                  size="sm"
                                  onClick={() => updateSubscriptionStatusMutation.mutate({ 
                                    restaurantId: client.restaurantId, 
                                    status: 'inactive' 
                                  })}
                                  disabled={updateSubscriptionStatusMutation.isPending}
                                  className="text-orange-600 hover:text-orange-700"
                                  data-testid={`button-suspend-${client.restaurantId}`}
                                >
                                  {updateSubscriptionStatusMutation.isPending ? (
                                    <Loader2 className="h-4 w-4 animate-spin" />
                                  ) : (
                                    <PowerOff className="h-4 w-4" />
                                  )}
                                  <span className="ml-1 hidden md:inline">{t.suspend || "Suspend"}</span>
                                </Button>
                              ) : (
                                <Button
                                  variant="outline"
                                  size="sm"
                                  onClick={() => updateSubscriptionStatusMutation.mutate({ 
                                    restaurantId: client.restaurantId, 
                                    status: 'active' 
                                  })}
                                  disabled={updateSubscriptionStatusMutation.isPending}
                                  className="text-green-600 hover:text-green-700"
                                  data-testid={`button-activate-${client.restaurantId}`}
                                >
                                  {updateSubscriptionStatusMutation.isPending ? (
                                    <Loader2 className="h-4 w-4 animate-spin" />
                                  ) : (
                                    <Power className="h-4 w-4" />
                                  )}
                                  <span className="ml-1 hidden md:inline">{t.activate || "Activate"}</span>
                                </Button>
                              )}
                            </div>
                          </TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="invoices" className="space-y-4" data-testid="content-invoices">
          <Card>
            <CardHeader>
              <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
                <div>
                  <CardTitle>{t.subscriptionInvoices}</CardTitle>
                  <CardDescription>{t.invoiceNumber}</CardDescription>
                </div>
                <div className="flex flex-col gap-2 md:flex-row md:items-center">
                  <div className="relative">
                    <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                    <Input
                      placeholder={t.search || "Search..."}
                      value={searchQuery}
                      onChange={(e) => setSearchQuery(e.target.value)}
                      className="pl-10 w-64"
                      data-testid="input-search-invoices"
                    />
                  </div>
                  <Button
                    variant="outline"
                    size="icon"
                    onClick={() => refetchInvoices()}
                    data-testid="button-refresh-invoices"
                  >
                    <RefreshCw className="h-4 w-4" />
                  </Button>
                </div>
              </div>
            </CardHeader>
            <CardContent>
              {invoicesLoading ? (
                <div className="space-y-4">
                  {[1, 2, 3].map(i => <Skeleton key={i} className="h-16 w-full" />)}
                </div>
              ) : filteredInvoices.length === 0 ? (
                <div className="text-center py-8 text-muted-foreground" data-testid="text-no-invoices">
                  {t.noInvoicesFound}
                </div>
              ) : (
                <div className="overflow-x-auto">
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>{t.invoiceNumber}</TableHead>
                        <TableHead>{t.clientName}</TableHead>
                        <TableHead>{t.subscriptionType}</TableHead>
                        <TableHead>{t.branchCount}</TableHead>
                        <TableHead>{t.baseAmount}</TableHead>
                        <TableHead>{t.vatRate || "VAT 15%"}</TableHead>
                        <TableHead>{t.totalWithVat}</TableHead>
                        <TableHead>{t.invoiceDate}</TableHead>
                        <TableHead>{t.actions}</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {filteredInvoices.map((invoice) => (
                        <TableRow key={invoice.id} data-testid={`row-invoice-${invoice.id}`}>
                          <TableCell className="font-mono text-sm">{invoice.serialNumber}</TableCell>
                          <TableCell>
                            <div className="font-medium">{invoice.restaurantName || "N/A"}</div>
                            <div className="text-sm text-muted-foreground">{invoice.userName}</div>
                          </TableCell>
                          <TableCell>{getPlanBadge(invoice.subscriptionPlan)}</TableCell>
                          <TableCell>{invoice.branchesCount}</TableCell>
                          <TableCell>{formatCurrency(invoice.subtotal)}</TableCell>
                          <TableCell className="text-blue-600 font-medium">{formatCurrency(invoice.vatAmount)}</TableCell>
                          <TableCell className="font-bold">{formatCurrency(invoice.total)}</TableCell>
                          <TableCell>{formatDate(invoice.invoiceDate)}</TableCell>
                          <TableCell>
                            <Button
                              variant="outline"
                              size="sm"
                              onClick={() => downloadInvoicePdfMutation.mutate(invoice.id)}
                              disabled={downloadInvoicePdfMutation.isPending}
                              data-testid={`button-download-invoice-${invoice.id}`}
                            >
                              {downloadInvoicePdfMutation.isPending ? (
                                <Loader2 className="h-4 w-4 animate-spin" />
                              ) : (
                                <Download className="h-4 w-4" />
                              )}
                              <span className="ml-1 hidden md:inline">{t.download || "PDF"}</span>
                            </Button>
                          </TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="vat" className="space-y-4" data-testid="content-vat">
          <Card>
            <CardHeader>
              <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
                <div>
                  <CardTitle>{t.vatGenerator}</CardTitle>
                  <CardDescription>{t.generateVatStatement}</CardDescription>
                </div>
                <Badge className="bg-green-600 self-start">
                  <Shield className="w-4 h-4 mr-1" />
                  {t.zatcaCompliant} - 15%
                </Badge>
              </div>
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="grid gap-4 md:grid-cols-2">
                <div className="space-y-2">
                  <label className="text-sm font-medium">{t.fromDate}</label>
                  <div className="relative">
                    <Calendar className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                    <Input
                      type="date"
                      value={fromDate}
                      onChange={(e) => setFromDate(e.target.value)}
                      className="pl-10"
                      data-testid="input-from-date"
                    />
                  </div>
                </div>
                <div className="space-y-2">
                  <label className="text-sm font-medium">{t.toDate}</label>
                  <div className="relative">
                    <Calendar className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                    <Input
                      type="date"
                      value={toDate}
                      onChange={(e) => setToDate(e.target.value)}
                      className="pl-10"
                      data-testid="input-to-date"
                    />
                  </div>
                </div>
              </div>

              <div className="flex gap-2">
                <Button onClick={() => refetchVat()} data-testid="button-calculate-vat">
                  <Calculator className="w-4 h-4 mr-2" />
                  {t.calculateVat}
                </Button>
              </div>

              {vatLoading ? (
                <div className="space-y-4">
                  {[1, 2, 3].map(i => <Skeleton key={i} className="h-16 w-full" />)}
                </div>
              ) : vatSummary ? (
                <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
                  <Card className="bg-muted/50" data-testid="card-vat-subscriptions">
                    <CardContent className="pt-6">
                      <div className="flex items-center gap-2">
                        <Receipt className="h-5 w-5 text-muted-foreground" />
                        <span className="text-sm text-muted-foreground">{t.totalSubscriptions}</span>
                      </div>
                      <div className="text-3xl font-bold mt-2">{vatSummary.totalSubscriptions}</div>
                    </CardContent>
                  </Card>

                  <Card className="bg-muted/50" data-testid="card-vat-base-amount">
                    <CardContent className="pt-6">
                      <div className="flex items-center gap-2">
                        <DollarSign className="h-5 w-5 text-muted-foreground" />
                        <span className="text-sm text-muted-foreground">{t.baseAmount}</span>
                      </div>
                      <div className="text-3xl font-bold mt-2">{formatCurrency(vatSummary.totalSubtotal)}</div>
                    </CardContent>
                  </Card>

                  <Card className="bg-blue-50 dark:bg-blue-950" data-testid="card-vat-collected">
                    <CardContent className="pt-6">
                      <div className="flex items-center gap-2">
                        <Percent className="h-5 w-5 text-blue-600" />
                        <span className="text-sm text-blue-600">{t.totalVatCollected} (15%)</span>
                      </div>
                      <div className="text-3xl font-bold mt-2 text-blue-600">{formatCurrency(vatSummary.totalVatCollected)}</div>
                    </CardContent>
                  </Card>

                  <Card className="bg-green-50 dark:bg-green-950" data-testid="card-vat-total-revenue">
                    <CardContent className="pt-6">
                      <div className="flex items-center gap-2">
                        <CreditCard className="h-5 w-5 text-green-600" />
                        <span className="text-sm text-green-600">{t.totalRevenue}</span>
                      </div>
                      <div className="text-3xl font-bold mt-2 text-green-600">{formatCurrency(vatSummary.totalRevenue)}</div>
                    </CardContent>
                  </Card>
                </div>
              ) : null}

              <div className="border-t pt-6">
                <h3 className="text-lg font-semibold mb-4">{t.vatStatement}</h3>
                <div className="flex flex-wrap gap-4">
                  <Button
                    onClick={() => downloadPdfMutation.mutate()}
                    disabled={downloadPdfMutation.isPending}
                    data-testid="button-download-pdf"
                  >
                    <FileText className="w-4 h-4 mr-2" />
                    {downloadPdfMutation.isPending ? (t.loading || "Loading...") : (t.downloadPdf)}
                  </Button>
                  <Button
                    variant="outline"
                    onClick={() => downloadExcelMutation.mutate()}
                    disabled={downloadExcelMutation.isPending}
                    data-testid="button-download-excel"
                  >
                    <FileSpreadsheet className="w-4 h-4 mr-2" />
                    {downloadExcelMutation.isPending ? (t.loading || "Loading...") : (t.downloadExcel)}
                  </Button>
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}
