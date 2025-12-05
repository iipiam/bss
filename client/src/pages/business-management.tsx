import { useState, useEffect, useCallback } from "react";
import { useQuery, useMutation } from "@tanstack/react-query";
import { useLocation } from "wouter";
import { useAuth } from "@/lib/auth";
import { useLanguage } from "@/contexts/LanguageContext";
import { useDevice } from "@/contexts/DeviceContext";
import { apiRequest, queryClient } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Skeleton } from "@/components/ui/skeleton";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { 
  Building2, 
  Users, 
  Receipt, 
  Calculator,
  FileText,
  FileSpreadsheet,
  FileDown,
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
  Loader2,
  Briefcase,
  TrendingUp,
  BarChart3,
  PieChart,
  Plus,
  Trash2,
  Edit,
  AlertCircle,
  CheckCircle,
  Clock,
  Save,
  Building,
  Globe,
  MapPin,
  Landmark
} from "lucide-react";
import { Label } from "@/components/ui/label";

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

interface CompanyBill {
  id: string;
  billType: string;
  vendor: string;
  amount: string;
  vatAmount: string;
  totalAmount: string;
  billDate: string;
  dueDate: string | null;
  paidDate: string | null;
  status: string;
  paymentPeriod: string | null;
  description: string | null;
  referenceNumber: string | null;
  createdBy: string | null;
  createdByName: string | null;
  createdAt: string;
}

interface BillsSummary {
  totalExpenses: string;
  totalBaseAmount: string;
  totalVatPaid: string;
  billsCount: number;
  paidCount: number;
  pendingCount: number;
  overdueCount: number;
  byCategory: Array<{
    category: string;
    count: number;
    amount: string;
    vatAmount: string;
    totalAmount: string;
  }>;
}

interface BssAnalysisOverview {
  subscriptionRevenue: string;
  vatCollected: string;
  totalRevenue: string;
  totalInvoices: number;
  totalExpenses: string;
  expenseVat: string;
  totalBills: number;
  netProfit: string;
  netVat: string;
  profitMargin: string;
  totalClients: number;
  totalAccounts: number;
  restaurantCount: number;
  factoryCount: number;
  activeSubscriptions: number;
  expiredSubscriptions: number;
  cancelledSubscriptions: number;
  planBreakdown: { weekly: number; monthly: number; yearly: number };
  revenueByPlan: { weekly: string; monthly: string; yearly: string };
}

interface RevenueTrend {
  month: string;
  revenue: string;
  vat: string;
  expenses: string;
  profit: string;
}

interface BusinessInfoData {
  id: string | null;
  companyNameEn: string;
  companyNameAr: string;
  vatNumber: string;
  crNumber: string;
  nationalId: string;
  email: string;
  phone: string;
  website: string;
  addressEn: string;
  addressAr: string;
  city: string;
  postalCode: string;
  bankName: string;
  bankAccountName: string;
  bankAccountNumber: string;
  bankIban: string;
  logoUrl: string | null;
  updatedBy: string | null;
  updatedAt: string | null;
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
  const [billSearchQuery, setBillSearchQuery] = useState("");
  const [billStatusFilter, setBillStatusFilter] = useState<"all" | "paid" | "pending" | "overdue">("all");
  const [billTypeFilter, setBillTypeFilter] = useState("all");

  // All hooks must be called before any conditional returns
  const { data: clients = [], isLoading: clientsLoading, refetch: refetchClients } = useQuery<Client[]>({
    queryKey: ['/api/it/business-management/clients'],
    enabled: !authLoading && !!user && accountType === 'it',
  });

  // Helper to build URL with query params
  const buildUrl = (base: string, params?: { fromDate?: string; toDate?: string }) => {
    const url = new URL(base, window.location.origin);
    if (params?.fromDate) url.searchParams.set('fromDate', params.fromDate);
    if (params?.toDate) url.searchParams.set('toDate', params.toDate);
    return url.pathname + url.search;
  };

  const { data: invoices = [], isLoading: invoicesLoading, refetch: refetchInvoices } = useQuery<Invoice[]>({
    queryKey: ['/api/it/business-management/invoices', { fromDate, toDate }],
    queryFn: async () => {
      const res = await fetch(buildUrl('/api/it/business-management/invoices', { fromDate, toDate }), { credentials: 'include' });
      if (!res.ok) throw new Error('Failed to fetch invoices');
      return res.json();
    },
    enabled: !authLoading && !!user && accountType === 'it',
  });

  const { data: vatSummary, isLoading: vatLoading, refetch: refetchVat } = useQuery<VatSummary>({
    queryKey: ['/api/it/business-management/vat-summary', { fromDate, toDate }],
    queryFn: async () => {
      const res = await fetch(buildUrl('/api/it/business-management/vat-summary', { fromDate, toDate }), { credentials: 'include' });
      if (!res.ok) throw new Error('Failed to fetch VAT summary');
      return res.json();
    },
    enabled: !authLoading && !!user && accountType === 'it',
  });

  const { data: companyBills = [], isLoading: billsLoading, refetch: refetchBills } = useQuery<CompanyBill[]>({
    queryKey: ['/api/it/business-operations/bills'],
    enabled: !authLoading && !!user && accountType === 'it',
  });

  const { data: billsSummary, isLoading: billsSummaryLoading } = useQuery<BillsSummary>({
    queryKey: ['/api/it/business-operations/summary', { fromDate, toDate }],
    queryFn: async () => {
      const res = await fetch(buildUrl('/api/it/business-operations/summary', { fromDate, toDate }), { credentials: 'include' });
      if (!res.ok) throw new Error('Failed to fetch bills summary');
      return res.json();
    },
    enabled: !authLoading && !!user && accountType === 'it',
  });

  const { data: bssAnalysis, isLoading: analysisLoading } = useQuery<BssAnalysisOverview>({
    queryKey: ['/api/it/bss-analysis/overview', { fromDate, toDate }],
    queryFn: async () => {
      const res = await fetch(buildUrl('/api/it/bss-analysis/overview', { fromDate, toDate }), { credentials: 'include' });
      if (!res.ok) throw new Error('Failed to fetch BSS analysis');
      return res.json();
    },
    enabled: !authLoading && !!user && accountType === 'it',
  });

  const { data: revenueTrends = [], isLoading: trendsLoading } = useQuery<RevenueTrend[]>({
    queryKey: ['/api/it/bss-analysis/revenue-trends'],
    enabled: !authLoading && !!user && accountType === 'it',
  });

  // Business Info state and query
  const [businessInfoForm, setBusinessInfoForm] = useState<BusinessInfoData>({
    id: null,
    companyNameEn: "BlindSpot System (BSS)",
    companyNameAr: "نظام بلايند سبوت",
    vatNumber: "",
    crNumber: "",
    nationalId: "",
    email: "IT@SaudiKinzhal.org",
    phone: "",
    website: "",
    addressEn: "Saudi Arabia",
    addressAr: "المملكة العربية السعودية",
    city: "",
    postalCode: "",
    bankName: "",
    bankAccountName: "",
    bankAccountNumber: "",
    bankIban: "",
    logoUrl: null,
    updatedBy: null,
    updatedAt: null,
  });

  const { data: businessInfo, isLoading: businessInfoLoading } = useQuery<BusinessInfoData>({
    queryKey: ['/api/it/business-info'],
    enabled: !authLoading && !!user && accountType === 'it',
  });

  // Update form when data loads
  useEffect(() => {
    if (businessInfo) {
      setBusinessInfoForm(businessInfo);
    }
  }, [businessInfo]);

  const updateBusinessInfoMutation = useMutation({
    mutationFn: async (data: Partial<BusinessInfoData>) => {
      const response = await fetch('/api/it/business-info', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify(data),
      });
      if (!response.ok) throw new Error('Failed to update business info');
      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/it/business-info'] });
      toast({
        title: t.success || "Success",
        description: t.businessInfoSaved || "Business information saved successfully",
      });
    },
    onError: () => {
      toast({
        title: t.error || "Error",
        description: t.businessInfoSaveError || "Failed to save business information",
        variant: "destructive",
      });
    },
  });

  // Add Bill Dialog State
  const [isAddBillDialogOpen, setIsAddBillDialogOpen] = useState(false);
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [clientToDelete, setClientToDelete] = useState<Client | null>(null);
  const [deleteReason, setDeleteReason] = useState<"mistake" | "client_request">("mistake");
  const [newBillForm, setNewBillForm] = useState({
    billType: "rent" as "salaries" | "rent" | "utilities" | "software" | "marketing" | "equipment" | "internet" | "maintenance" | "legal" | "insurance" | "other",
    vendor: "",
    amount: "",
    vatAmount: "",
    totalAmount: "",
    billDate: new Date().toISOString().split('T')[0],
    dueDate: "",
    status: "pending" as "pending" | "paid" | "overdue",
    paymentPeriod: "monthly" as "one-time" | "weekly" | "monthly" | "quarterly" | "yearly",
    description: "",
    referenceNumber: "",
  });

  // Calculate VAT and total when amount changes
  const calculateBillAmounts = (amount: string) => {
    const amountNum = parseFloat(amount) || 0;
    const vatNum = amountNum * 0.15;
    const totalNum = amountNum + vatNum;
    setNewBillForm(prev => ({
      ...prev,
      amount,
      vatAmount: vatNum.toFixed(2),
      totalAmount: totalNum.toFixed(2),
    }));
  };

  const resetBillForm = () => {
    setNewBillForm({
      billType: "rent",
      vendor: "",
      amount: "",
      vatAmount: "",
      totalAmount: "",
      billDate: new Date().toISOString().split('T')[0],
      dueDate: "",
      status: "pending",
      paymentPeriod: "monthly",
      description: "",
      referenceNumber: "",
    });
  };

  const createBillMutation = useMutation({
    mutationFn: async (data: typeof newBillForm) => {
      const response = await fetch('/api/it/business-operations/bills', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify(data),
      });
      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Failed to create bill');
      }
      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/it/business-operations/bills'] });
      queryClient.invalidateQueries({ queryKey: ['/api/it/business-operations/summary'] });
      setIsAddBillDialogOpen(false);
      resetBillForm();
      toast({
        title: t.success || "Success",
        description: t.billAdded || "Bill added successfully",
      });
    },
    onError: (error) => {
      toast({
        title: t.error || "Error",
        description: error.message || "Failed to add bill",
        variant: "destructive",
      });
    },
  });

  const deleteBillMutation = useMutation({
    mutationFn: async (billId: string) => {
      const response = await fetch(`/api/it/business-operations/bills/${billId}`, {
        method: 'DELETE',
        credentials: 'include',
      });
      if (!response.ok) throw new Error('Failed to delete bill');
      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/it/business-operations/bills'] });
      queryClient.invalidateQueries({ queryKey: ['/api/it/business-operations/summary'] });
      toast({
        title: t.success || "Success",
        description: t.billDeleted || "Bill deleted successfully",
      });
    },
    onError: () => {
      toast({
        title: t.error || "Error",
        description: "Failed to delete bill",
        variant: "destructive",
      });
    },
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

  const deleteSubscriptionMutation = useMutation({
    mutationFn: async ({ restaurantId, reason }: { restaurantId: string; reason: "mistake" | "client_request" }) => {
      const response = await fetch(`/api/it/business-management/subscriptions/${restaurantId}`, {
        method: 'DELETE',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify({ reason }),
      });
      if (!response.ok) throw new Error('Failed to delete subscription');
      const data = await response.json();
      return { ...data, reason };
    },
    onSuccess: (result) => {
      if (result.pdfBase64 && result.reason === 'client_request') {
        const byteCharacters = atob(result.pdfBase64);
        const byteNumbers = new Array(byteCharacters.length);
        for (let i = 0; i < byteCharacters.length; i++) {
          byteNumbers[i] = byteCharacters.charCodeAt(i);
        }
        const byteArray = new Uint8Array(byteNumbers);
        const blob = new Blob([byteArray], { type: 'application/pdf' });
        const url = URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = `Refund-Clearance-${result.restaurantId}.pdf`;
        document.body.appendChild(a);
        a.click();
        document.body.removeChild(a);
        URL.revokeObjectURL(url);
        toast({
          title: t.success || "Success",
          description: t.subscriptionDeletedWithRefund || "Subscription deleted and refund clearance invoice downloaded",
        });
      } else {
        toast({
          title: t.success || "Success",
          description: t.subscriptionDeleted || "Subscription deleted successfully",
        });
      }
      refetchClients();
      refetchInvoices();
      setDeleteDialogOpen(false);
      setClientToDelete(null);
      setDeleteReason("mistake");
    },
    onError: () => {
      toast({
        title: t.error || "Error",
        description: "Failed to delete subscription",
        variant: "destructive",
      });
    },
  });

  const calculateRefundPreview = (client: Client) => {
    if (!client.subscriptionStartDate || !client.subscriptionPlan) return null;
    
    const startDate = new Date(client.subscriptionStartDate);
    const now = new Date();
    const msPerMonth = 30.44 * 24 * 60 * 60 * 1000;
    const monthsUsed = Math.ceil((now.getTime() - startDate.getTime()) / msPerMonth);
    
    let yearlyPrice = 1990;
    if (client.subscriptionPlan === "premium") yearlyPrice = 2990;
    if (client.subscriptionPlan === "enterprise") yearlyPrice = 4990;
    
    const monthlyRate = 199;  // Fixed monthly rate for early cancellation
    const chargedAmount = monthlyRate * monthsUsed;
    const refundAmount = Math.max(0, yearlyPrice - chargedAmount);
    
    return {
      yearlyPrice,
      monthlyRate,
      monthsUsed,
      chargedAmount,
      refundAmount
    };
  };

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

  const [downloadingRefundInvoice, setDownloadingRefundInvoice] = useState<string | null>(null);

  const downloadRefundInvoice = async (restaurantId: string, restaurantName: string) => {
    setDownloadingRefundInvoice(restaurantId);
    try {
      const response = await fetch(`/api/it/business-management/refund-invoices/${restaurantId}`, {
        credentials: 'include'
      });
      if (!response.ok) {
        throw new Error("Failed to fetch refund invoice");
      }
      const invoices = await response.json();
      
      if (invoices.length === 0) {
        toast({
          title: "Info",
          description: "No refund invoice available. This subscription was cancelled as a mistake entry (no refund) or before this feature was implemented.",
        });
        return;
      }
      
      // Get the most recent refund invoice
      const invoice = invoices[0];
      if (!invoice.pdfData) {
        toast({
          title: t.error || "Error",
          description: "Refund invoice PDF not available",
          variant: "destructive",
        });
        return;
      }
      
      // Download the PDF
      const pdfBytes = Uint8Array.from(atob(invoice.pdfData), c => c.charCodeAt(0));
      const blob = new Blob([pdfBytes], { type: 'application/pdf' });
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `Refund-${invoice.serialNumber}-${restaurantName}.pdf`;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      URL.revokeObjectURL(url);
      
      toast({
        title: t.success || "Success",
        description: "Refund clearance invoice downloaded",
      });
    } catch (error) {
      console.error("Error downloading refund invoice:", error);
      toast({
        title: t.error || "Error",
        description: "Failed to download refund invoice",
        variant: "destructive",
      });
    } finally {
      setDownloadingRefundInvoice(null);
    }
  };

  const filteredBills = companyBills.filter(bill => {
    const matchesSearch = 
      !billSearchQuery ||
      bill.vendor?.toLowerCase().includes(billSearchQuery.toLowerCase()) ||
      bill.description?.toLowerCase().includes(billSearchQuery.toLowerCase()) ||
      bill.referenceNumber?.toLowerCase().includes(billSearchQuery.toLowerCase());
    
    const matchesStatus = billStatusFilter === "all" || bill.status === billStatusFilter;
    const matchesType = billTypeFilter === "all" || bill.billType === billTypeFilter;
    
    return matchesSearch && matchesStatus && matchesType;
  });

  const getBillStatusBadge = (status: string) => {
    switch (status) {
      case "paid":
        return <Badge className="bg-green-500" data-testid="badge-bill-paid"><CheckCircle className="w-3 h-3 mr-1" />{t.paid}</Badge>;
      case "pending":
        return <Badge className="bg-yellow-500" data-testid="badge-bill-pending"><Clock className="w-3 h-3 mr-1" />{t.pending}</Badge>;
      case "overdue":
        return <Badge variant="destructive" data-testid="badge-bill-overdue"><AlertCircle className="w-3 h-3 mr-1" />{t.overdueBills}</Badge>;
      default:
        return <Badge variant="outline">{status}</Badge>;
    }
  };

  const getBillTypeName = (billType: string) => {
    const types: Record<string, string> = {
      rent: t.rent || "Rent",
      utilities: t.utilities || "Utilities",
      salaries: t.salaries || "Salaries",
      marketing: t.marketingExpense || "Marketing",
      software: t.softwareExpense || "Software",
      office_supplies: t.officeSupplies || "Office Supplies",
      maintenance: t.maintenance || "Maintenance",
      taxes: t.taxesExpense || "Taxes",
      insurance: t.insuranceExpense || "Insurance",
      other: t.other || "Other",
    };
    return types[billType] || billType;
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
        <TabsList className="grid w-full grid-cols-6" data-testid="tabs-list">
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
          <TabsTrigger value="operations" data-testid="tab-operations">
            <Briefcase className="w-4 h-4 mr-2" />
            {t.businessOperations}
          </TabsTrigger>
          <TabsTrigger value="analysis" data-testid="tab-analysis">
            <BarChart3 className="w-4 h-4 mr-2" />
            {t.bssAnalysis}
          </TabsTrigger>
          <TabsTrigger value="business-info" data-testid="tab-business-info">
            <Building className="w-4 h-4 mr-2" />
            {t.businessInfos || "Business Infos"}
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
                              <Button
                                variant="outline"
                                size="sm"
                                onClick={() => {
                                  setClientToDelete(client);
                                  setDeleteDialogOpen(true);
                                }}
                                disabled={deleteSubscriptionMutation.isPending}
                                className="text-red-600 hover:text-red-700"
                                data-testid={`button-delete-${client.restaurantId}`}
                              >
                                {deleteSubscriptionMutation.isPending ? (
                                  <Loader2 className="h-4 w-4 animate-spin" />
                                ) : (
                                  <Trash2 className="h-4 w-4" />
                                )}
                              </Button>
                              {client.subscriptionStatus === 'cancelled' && (
                                <Button
                                  variant="outline"
                                  size="sm"
                                  onClick={() => downloadRefundInvoice(client.restaurantId, client.restaurantName || 'Unknown')}
                                  disabled={downloadingRefundInvoice === client.restaurantId}
                                  className="text-blue-600 hover:text-blue-700"
                                  data-testid={`button-refund-invoice-${client.restaurantId}`}
                                  title="Download Refund Invoice"
                                >
                                  {downloadingRefundInvoice === client.restaurantId ? (
                                    <Loader2 className="h-4 w-4 animate-spin" />
                                  ) : (
                                    <FileDown className="h-4 w-4" />
                                  )}
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

        <TabsContent value="operations" className="space-y-4" data-testid="content-operations">
          <div className="grid gap-4 md:grid-cols-4">
            <Card data-testid="card-total-expenses">
              <CardHeader className="flex flex-row items-center justify-between gap-1 space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">{t.totalExpenses}</CardTitle>
                <DollarSign className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">{formatCurrency(billsSummary?.totalExpenses || 0)}</div>
                <p className="text-xs text-muted-foreground">{billsSummary?.billsCount || 0} {t.companyBills?.toLowerCase()}</p>
              </CardContent>
            </Card>

            <Card data-testid="card-paid-bills">
              <CardHeader className="flex flex-row items-center justify-between gap-1 space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">{t.paidBills}</CardTitle>
                <CheckCircle className="h-4 w-4 text-green-500" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold text-green-600">{billsSummary?.paidCount || 0}</div>
                <p className="text-xs text-muted-foreground">{t.paid}</p>
              </CardContent>
            </Card>

            <Card data-testid="card-pending-bills">
              <CardHeader className="flex flex-row items-center justify-between gap-1 space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">{t.pendingBills}</CardTitle>
                <Clock className="h-4 w-4 text-yellow-500" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold text-yellow-600">{billsSummary?.pendingCount || 0}</div>
                <p className="text-xs text-muted-foreground">{t.pending}</p>
              </CardContent>
            </Card>

            <Card data-testid="card-overdue-bills">
              <CardHeader className="flex flex-row items-center justify-between gap-1 space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">{t.overdueBills}</CardTitle>
                <AlertCircle className="h-4 w-4 text-red-500" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold text-red-600">{billsSummary?.overdueCount || 0}</div>
                <p className="text-xs text-muted-foreground">{t.overdueBills}</p>
              </CardContent>
            </Card>
          </div>

          <Card>
            <CardHeader>
              <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
                <div>
                  <CardTitle>{t.companyBills}</CardTitle>
                  <CardDescription>{t.businessOperationsDescription}</CardDescription>
                </div>
                <div className="flex flex-col gap-2 md:flex-row md:items-center">
                  <div className="relative">
                    <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                    <Input
                      placeholder={t.search || "Search..."}
                      value={billSearchQuery}
                      onChange={(e) => setBillSearchQuery(e.target.value)}
                      className="pl-10 w-64"
                      data-testid="input-search-bills"
                    />
                  </div>
                  <div className="flex gap-2">
                    <Button
                      variant={billStatusFilter === "all" ? "default" : "outline"}
                      size="sm"
                      onClick={() => setBillStatusFilter("all")}
                      data-testid="button-filter-bills-all"
                    >
                      {t.all}
                    </Button>
                    <Button
                      variant={billStatusFilter === "paid" ? "default" : "outline"}
                      size="sm"
                      onClick={() => setBillStatusFilter("paid")}
                      data-testid="button-filter-bills-paid"
                    >
                      {t.paid}
                    </Button>
                    <Button
                      variant={billStatusFilter === "pending" ? "default" : "outline"}
                      size="sm"
                      onClick={() => setBillStatusFilter("pending")}
                      data-testid="button-filter-bills-pending"
                    >
                      {t.pending}
                    </Button>
                    <Button
                      variant={billStatusFilter === "overdue" ? "default" : "outline"}
                      size="sm"
                      onClick={() => setBillStatusFilter("overdue")}
                      data-testid="button-filter-bills-overdue"
                    >
                      {t.overdueBills}
                    </Button>
                  </div>
                  <Button
                    variant="outline"
                    size="icon"
                    onClick={() => refetchBills()}
                    data-testid="button-refresh-bills"
                  >
                    <RefreshCw className="h-4 w-4" />
                  </Button>
                  <Dialog open={isAddBillDialogOpen} onOpenChange={setIsAddBillDialogOpen}>
                    <DialogTrigger asChild>
                      <Button data-testid="button-add-bill">
                        <Plus className="h-4 w-4 mr-2" />
                        {t.addBill || "Add Bill"}
                      </Button>
                    </DialogTrigger>
                    <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
                      <DialogHeader>
                        <DialogTitle>{t.addBill || "Add New Bill"}</DialogTitle>
                        <DialogDescription>
                          {t.addBillDescription || "Enter the details for the new company bill"}
                        </DialogDescription>
                      </DialogHeader>
                      <form
                        onSubmit={(e) => {
                          e.preventDefault();
                          createBillMutation.mutate(newBillForm);
                        }}
                        className="space-y-4"
                      >
                        <div className="grid gap-4 md:grid-cols-2">
                          <div className="space-y-2">
                            <Label htmlFor="billType">{t.billType || "Bill Type"} *</Label>
                            <Select
                              value={newBillForm.billType}
                              onValueChange={(value) => setNewBillForm(prev => ({ ...prev, billType: value as typeof prev.billType }))}
                            >
                              <SelectTrigger data-testid="select-bill-type">
                                <SelectValue placeholder="Select type" />
                              </SelectTrigger>
                              <SelectContent>
                                <SelectItem value="rent">{t.rent || "Rent"}</SelectItem>
                                <SelectItem value="utilities">{t.utilities || "Utilities"}</SelectItem>
                                <SelectItem value="salaries">{t.salaries || "Salaries"}</SelectItem>
                                <SelectItem value="marketing">{t.marketingExpense || "Marketing"}</SelectItem>
                                <SelectItem value="software">{t.softwareExpense || "Software"}</SelectItem>
                                <SelectItem value="equipment">{t.equipment || "Equipment"}</SelectItem>
                                <SelectItem value="internet">{t.internet || "Internet"}</SelectItem>
                                <SelectItem value="maintenance">{t.maintenance || "Maintenance"}</SelectItem>
                                <SelectItem value="legal">{t.legal || "Legal"}</SelectItem>
                                <SelectItem value="insurance">{t.insuranceExpense || "Insurance"}</SelectItem>
                                <SelectItem value="other">{t.other || "Other"}</SelectItem>
                              </SelectContent>
                            </Select>
                          </div>
                          <div className="space-y-2">
                            <Label htmlFor="vendor">{t.vendor || "Vendor"} *</Label>
                            <Input
                              id="vendor"
                              value={newBillForm.vendor}
                              onChange={(e) => setNewBillForm(prev => ({ ...prev, vendor: e.target.value }))}
                              placeholder="Enter vendor name"
                              required
                              data-testid="input-bill-vendor"
                            />
                          </div>
                        </div>

                        <div className="grid gap-4 md:grid-cols-3">
                          <div className="space-y-2">
                            <Label htmlFor="amount">{t.amount || "Amount"} (SAR) *</Label>
                            <Input
                              id="amount"
                              type="number"
                              step="0.01"
                              min="0"
                              value={newBillForm.amount}
                              onChange={(e) => calculateBillAmounts(e.target.value)}
                              placeholder="0.00"
                              required
                              data-testid="input-bill-amount"
                            />
                          </div>
                          <div className="space-y-2">
                            <Label htmlFor="vatAmount">{t.vatAmount || "VAT"} (15%)</Label>
                            <Input
                              id="vatAmount"
                              type="number"
                              step="0.01"
                              value={newBillForm.vatAmount}
                              onChange={(e) => setNewBillForm(prev => ({ 
                                ...prev, 
                                vatAmount: e.target.value,
                                totalAmount: (parseFloat(prev.amount) + parseFloat(e.target.value || '0')).toFixed(2)
                              }))}
                              placeholder="0.00"
                              data-testid="input-bill-vat"
                            />
                          </div>
                          <div className="space-y-2">
                            <Label htmlFor="totalAmount">{t.total || "Total"} (SAR)</Label>
                            <Input
                              id="totalAmount"
                              type="number"
                              step="0.01"
                              value={newBillForm.totalAmount}
                              readOnly
                              className="bg-muted"
                              data-testid="input-bill-total"
                            />
                          </div>
                        </div>

                        <div className="grid gap-4 md:grid-cols-2">
                          <div className="space-y-2">
                            <Label htmlFor="billDate">{t.billDate || "Bill Date"} *</Label>
                            <Input
                              id="billDate"
                              type="date"
                              value={newBillForm.billDate}
                              onChange={(e) => setNewBillForm(prev => ({ ...prev, billDate: e.target.value }))}
                              required
                              data-testid="input-bill-date"
                            />
                          </div>
                          <div className="space-y-2">
                            <Label htmlFor="dueDate">{t.dueDate || "Due Date"}</Label>
                            <Input
                              id="dueDate"
                              type="date"
                              value={newBillForm.dueDate}
                              onChange={(e) => setNewBillForm(prev => ({ ...prev, dueDate: e.target.value }))}
                              data-testid="input-bill-due-date"
                            />
                          </div>
                        </div>

                        <div className="grid gap-4 md:grid-cols-2">
                          <div className="space-y-2">
                            <Label htmlFor="status">{t.status || "Status"}</Label>
                            <Select
                              value={newBillForm.status}
                              onValueChange={(value) => setNewBillForm(prev => ({ ...prev, status: value as typeof prev.status }))}
                            >
                              <SelectTrigger data-testid="select-bill-status">
                                <SelectValue placeholder="Select status" />
                              </SelectTrigger>
                              <SelectContent>
                                <SelectItem value="pending">{t.pending || "Pending"}</SelectItem>
                                <SelectItem value="paid">{t.paid || "Paid"}</SelectItem>
                                <SelectItem value="overdue">{t.overdue || "Overdue"}</SelectItem>
                              </SelectContent>
                            </Select>
                          </div>
                          <div className="space-y-2">
                            <Label htmlFor="paymentPeriod">{t.paymentPeriod || "Payment Period"}</Label>
                            <Select
                              value={newBillForm.paymentPeriod}
                              onValueChange={(value) => setNewBillForm(prev => ({ ...prev, paymentPeriod: value as typeof prev.paymentPeriod }))}
                            >
                              <SelectTrigger data-testid="select-bill-payment-period">
                                <SelectValue placeholder="Select period" />
                              </SelectTrigger>
                              <SelectContent>
                                <SelectItem value="one-time">{t.oneTime || "One-time"}</SelectItem>
                                <SelectItem value="weekly">{t.weekly || "Weekly"}</SelectItem>
                                <SelectItem value="monthly">{t.monthly || "Monthly"}</SelectItem>
                                <SelectItem value="quarterly">{t.quarterly || "Quarterly"}</SelectItem>
                                <SelectItem value="yearly">{t.yearly || "Yearly"}</SelectItem>
                              </SelectContent>
                            </Select>
                          </div>
                        </div>

                        <div className="space-y-2">
                          <Label htmlFor="referenceNumber">{t.referenceNumber || "Reference Number"}</Label>
                          <Input
                            id="referenceNumber"
                            value={newBillForm.referenceNumber}
                            onChange={(e) => setNewBillForm(prev => ({ ...prev, referenceNumber: e.target.value }))}
                            placeholder="Invoice or reference number"
                            data-testid="input-bill-reference"
                          />
                        </div>

                        <div className="space-y-2">
                          <Label htmlFor="description">{t.description || "Description"}</Label>
                          <Textarea
                            id="description"
                            value={newBillForm.description}
                            onChange={(e) => setNewBillForm(prev => ({ ...prev, description: e.target.value }))}
                            placeholder="Optional description"
                            rows={3}
                            data-testid="input-bill-description"
                          />
                        </div>

                        <DialogFooter>
                          <Button
                            type="button"
                            variant="outline"
                            onClick={() => {
                              setIsAddBillDialogOpen(false);
                              resetBillForm();
                            }}
                            data-testid="button-cancel-add-bill"
                          >
                            {t.cancel || "Cancel"}
                          </Button>
                          <Button
                            type="submit"
                            disabled={createBillMutation.isPending || !newBillForm.vendor || !newBillForm.amount}
                            data-testid="button-submit-add-bill"
                          >
                            {createBillMutation.isPending ? (
                              <Loader2 className="h-4 w-4 animate-spin mr-2" />
                            ) : (
                              <Plus className="h-4 w-4 mr-2" />
                            )}
                            {t.addBill || "Add Bill"}
                          </Button>
                        </DialogFooter>
                      </form>
                    </DialogContent>
                  </Dialog>
                </div>
              </div>
            </CardHeader>
            <CardContent>
              {billsLoading ? (
                <div className="space-y-4">
                  {[1, 2, 3].map(i => <Skeleton key={i} className="h-16 w-full" />)}
                </div>
              ) : filteredBills.length === 0 ? (
                <div className="text-center py-8 text-muted-foreground" data-testid="text-no-bills">
                  {t.noBillsFound}
                </div>
              ) : (
                <div className="overflow-x-auto">
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>{t.billType}</TableHead>
                        <TableHead>{t.vendor}</TableHead>
                        <TableHead>{t.amount}</TableHead>
                        <TableHead>{t.vatAmount}</TableHead>
                        <TableHead>{t.total}</TableHead>
                        <TableHead>{t.billDate}</TableHead>
                        <TableHead>{t.dueDate}</TableHead>
                        <TableHead>{t.status}</TableHead>
                        <TableHead>{t.actions}</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {filteredBills.map((bill) => (
                        <TableRow key={bill.id} data-testid={`row-bill-${bill.id}`}>
                          <TableCell>
                            <Badge variant="outline">{getBillTypeName(bill.billType)}</Badge>
                          </TableCell>
                          <TableCell className="font-medium">{bill.vendor}</TableCell>
                          <TableCell>{formatCurrency(bill.amount)}</TableCell>
                          <TableCell>{formatCurrency(bill.vatAmount)}</TableCell>
                          <TableCell className="font-bold">{formatCurrency(bill.totalAmount)}</TableCell>
                          <TableCell>{formatDate(bill.billDate)}</TableCell>
                          <TableCell>{formatDate(bill.dueDate)}</TableCell>
                          <TableCell>{getBillStatusBadge(bill.status)}</TableCell>
                          <TableCell>
                            <Button
                              variant="ghost"
                              size="icon"
                              onClick={() => deleteBillMutation.mutate(bill.id)}
                              disabled={deleteBillMutation.isPending}
                              data-testid={`button-delete-bill-${bill.id}`}
                            >
                              <Trash2 className="h-4 w-4 text-red-500" />
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

          {billsSummary && billsSummary.byCategory.length > 0 && (
            <Card>
              <CardHeader>
                <CardTitle>{t.expensesByCategory}</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
                  {billsSummary.byCategory.map((cat) => (
                    <Card key={cat.category} className="bg-muted/50">
                      <CardContent className="pt-4">
                        <div className="flex items-center justify-between">
                          <span className="font-medium">{getBillTypeName(cat.category)}</span>
                          <Badge variant="secondary">{cat.count} bills</Badge>
                        </div>
                        <div className="text-2xl font-bold mt-2">{formatCurrency(cat.totalAmount)}</div>
                        <p className="text-xs text-muted-foreground">
                          {t.vatAmount}: {formatCurrency(cat.vatAmount)}
                        </p>
                      </CardContent>
                    </Card>
                  ))}
                </div>
              </CardContent>
            </Card>
          )}
        </TabsContent>

        <TabsContent value="analysis" className="space-y-4" data-testid="content-analysis">
          {analysisLoading ? (
            <div className="space-y-4">
              {[1, 2, 3].map(i => <Skeleton key={i} className="h-32 w-full" />)}
            </div>
          ) : bssAnalysis ? (
            <>
              <div className="flex justify-end">
                <Button
                  onClick={() => {
                    const url = new URL('/api/it/bss-analysis/download-pdf', window.location.origin);
                    if (fromDate) url.searchParams.set('fromDate', fromDate);
                    if (toDate) url.searchParams.set('toDate', toDate);
                    window.open(url.toString(), '_blank');
                  }}
                  className="gap-2"
                  data-testid="button-download-analysis-pdf"
                >
                  <FileDown className="h-4 w-4" />
                  {t.downloadStatement || "Download Statement"}
                </Button>
              </div>
              <div className="grid gap-4 md:grid-cols-4">
                <Card className="bg-green-50 dark:bg-green-950" data-testid="card-subscription-revenue">
                  <CardHeader className="flex flex-row items-center justify-between gap-1 space-y-0 pb-2">
                    <CardTitle className="text-sm font-medium">{t.subscriptionRevenue}</CardTitle>
                    <TrendingUp className="h-4 w-4 text-green-600" />
                  </CardHeader>
                  <CardContent>
                    <div className="text-2xl font-bold text-green-600">{formatCurrency(bssAnalysis.subscriptionRevenue)}</div>
                    <p className="text-xs text-muted-foreground">{bssAnalysis.totalInvoices} {t.invoices?.toLowerCase()}</p>
                  </CardContent>
                </Card>

                <Card className="bg-blue-50 dark:bg-blue-950" data-testid="card-vat-collected">
                  <CardHeader className="flex flex-row items-center justify-between gap-1 space-y-0 pb-2">
                    <CardTitle className="text-sm font-medium">{t.vatCollected}</CardTitle>
                    <Percent className="h-4 w-4 text-blue-600" />
                  </CardHeader>
                  <CardContent>
                    <div className="text-2xl font-bold text-blue-600">{formatCurrency(bssAnalysis.vatCollected)}</div>
                    <p className="text-xs text-muted-foreground">15% {t.vatRate?.split('(')[0] || "VAT"}</p>
                  </CardContent>
                </Card>

                <Card className="bg-red-50 dark:bg-red-950" data-testid="card-total-expenses-analysis">
                  <CardHeader className="flex flex-row items-center justify-between gap-1 space-y-0 pb-2">
                    <CardTitle className="text-sm font-medium">{t.totalExpenses}</CardTitle>
                    <Briefcase className="h-4 w-4 text-red-600" />
                  </CardHeader>
                  <CardContent>
                    <div className="text-2xl font-bold text-red-600">{formatCurrency(bssAnalysis.totalExpenses)}</div>
                    <p className="text-xs text-muted-foreground">{bssAnalysis.totalBills} {t.companyBills?.toLowerCase()}</p>
                  </CardContent>
                </Card>

                <Card className="bg-purple-50 dark:bg-purple-950" data-testid="card-net-profit">
                  <CardHeader className="flex flex-row items-center justify-between gap-1 space-y-0 pb-2">
                    <CardTitle className="text-sm font-medium">{t.netProfit}</CardTitle>
                    <BarChart3 className="h-4 w-4 text-purple-600" />
                  </CardHeader>
                  <CardContent>
                    <div className={`text-2xl font-bold ${parseFloat(bssAnalysis.netProfit) >= 0 ? 'text-purple-600' : 'text-red-600'}`}>
                      {formatCurrency(bssAnalysis.netProfit)}
                    </div>
                    <p className="text-xs text-muted-foreground">{t.profitMargin}: {bssAnalysis.profitMargin}%</p>
                  </CardContent>
                </Card>
              </div>

              <div className="grid gap-4 md:grid-cols-2">
                <Card data-testid="card-accounts-by-type">
                  <CardHeader>
                    <CardTitle>{t.accountsByType}</CardTitle>
                    <CardDescription>{t.totalClients}: {bssAnalysis.totalClients}</CardDescription>
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-4">
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-2">
                          <Building2 className="h-5 w-5 text-orange-500" />
                          <span>{t.restaurantClients}</span>
                        </div>
                        <Badge className="bg-orange-500">{bssAnalysis.restaurantCount}</Badge>
                      </div>
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-2">
                          <Briefcase className="h-5 w-5 text-blue-500" />
                          <span>{t.factoryClients}</span>
                        </div>
                        <Badge className="bg-blue-500">{bssAnalysis.factoryCount}</Badge>
                      </div>
                      <div className="border-t pt-4 mt-4">
                        <div className="flex items-center justify-between mb-2">
                          <span className="text-sm text-muted-foreground">{t.activeSubscriptions}</span>
                          <Badge className="bg-green-500">{bssAnalysis.activeSubscriptions}</Badge>
                        </div>
                        <div className="flex items-center justify-between mb-2">
                          <span className="text-sm text-muted-foreground">{t.expiredSubscriptions}</span>
                          <Badge variant="destructive">{bssAnalysis.expiredSubscriptions}</Badge>
                        </div>
                        <div className="flex items-center justify-between">
                          <span className="text-sm text-muted-foreground">{t.cancelledSubscriptions}</span>
                          <Badge variant="secondary">{bssAnalysis.cancelledSubscriptions}</Badge>
                        </div>
                      </div>
                    </div>
                  </CardContent>
                </Card>

                <Card data-testid="card-revenue-by-plan">
                  <CardHeader>
                    <CardTitle>{t.revenueByPlan}</CardTitle>
                    <CardDescription>{t.planBreakdown}</CardDescription>
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-4">
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-2">
                          <Badge className="bg-blue-500">{t.yearly}</Badge>
                          <span className="text-sm text-muted-foreground">({bssAnalysis.planBreakdown.yearly} clients)</span>
                        </div>
                        <span className="font-bold">{formatCurrency(bssAnalysis.revenueByPlan.yearly)}</span>
                      </div>
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-2">
                          <Badge className="bg-purple-500">{t.monthly}</Badge>
                          <span className="text-sm text-muted-foreground">({bssAnalysis.planBreakdown.monthly} clients)</span>
                        </div>
                        <span className="font-bold">{formatCurrency(bssAnalysis.revenueByPlan.monthly)}</span>
                      </div>
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-2">
                          <Badge className="bg-orange-500">{t.weekly}</Badge>
                          <span className="text-sm text-muted-foreground">({bssAnalysis.planBreakdown.weekly} clients)</span>
                        </div>
                        <span className="font-bold">{formatCurrency(bssAnalysis.revenueByPlan.weekly)}</span>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              </div>

              <Card data-testid="card-financial-overview">
                <CardHeader>
                  <CardTitle>{t.financialOverview}</CardTitle>
                  <CardDescription>{t.bssAnalysisDescription}</CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="grid gap-4 md:grid-cols-3">
                    <div className="text-center p-4 bg-muted/50 rounded-lg">
                      <p className="text-sm text-muted-foreground">{t.totalRevenue}</p>
                      <p className="text-2xl font-bold">{formatCurrency(bssAnalysis.totalRevenue)}</p>
                    </div>
                    <div className="text-center p-4 bg-muted/50 rounded-lg">
                      <p className="text-sm text-muted-foreground">{t.netVat}</p>
                      <p className={`text-2xl font-bold ${parseFloat(bssAnalysis.netVat) >= 0 ? 'text-blue-600' : 'text-red-600'}`}>
                        {formatCurrency(bssAnalysis.netVat)}
                      </p>
                    </div>
                    <div className="text-center p-4 bg-muted/50 rounded-lg">
                      <p className="text-sm text-muted-foreground">{t.totalAccounts}</p>
                      <p className="text-2xl font-bold">{bssAnalysis.totalAccounts}</p>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </>
          ) : (
            <div className="text-center py-8 text-muted-foreground" data-testid="text-no-analytics">
              {t.noAnalyticsData}
            </div>
          )}
        </TabsContent>

        {/* Business Info Tab */}
        <TabsContent value="business-info" className="space-y-4" data-testid="content-business-info">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Building className="h-5 w-5" />
                {t.businessInfos || "Business Information"}
              </CardTitle>
              <CardDescription>
                {t.businessInfosDescription || "Company details that appear on subscription invoices and bills"}
              </CardDescription>
            </CardHeader>
            <CardContent>
              {businessInfoLoading ? (
                <div className="space-y-4">
                  {[1, 2, 3, 4].map(i => <Skeleton key={i} className="h-12 w-full" />)}
                </div>
              ) : (
                <form 
                  onSubmit={(e) => {
                    e.preventDefault();
                    updateBusinessInfoMutation.mutate(businessInfoForm);
                  }}
                  className="space-y-6"
                >
                  {/* Company Identity Section */}
                  <div className="space-y-4">
                    <h3 className="text-lg font-semibold flex items-center gap-2">
                      <Building2 className="h-4 w-4" />
                      {t.companyIdentity || "Company Identity"}
                    </h3>
                    <div className="grid gap-4 md:grid-cols-2">
                      <div className="space-y-2">
                        <Label htmlFor="companyNameEn">{t.companyNameEn || "Company Name (English)"}</Label>
                        <Input
                          id="companyNameEn"
                          value={businessInfoForm.companyNameEn}
                          onChange={(e) => setBusinessInfoForm(prev => ({ ...prev, companyNameEn: e.target.value }))}
                          placeholder="BlindSpot System (BSS)"
                          data-testid="input-company-name-en"
                        />
                      </div>
                      <div className="space-y-2">
                        <Label htmlFor="companyNameAr">{t.companyNameAr || "Company Name (Arabic)"}</Label>
                        <Input
                          id="companyNameAr"
                          value={businessInfoForm.companyNameAr}
                          onChange={(e) => setBusinessInfoForm(prev => ({ ...prev, companyNameAr: e.target.value }))}
                          placeholder="نظام بلايند سبوت"
                          dir="rtl"
                          data-testid="input-company-name-ar"
                        />
                      </div>
                    </div>
                  </div>

                  {/* Registration Numbers Section */}
                  <div className="space-y-4">
                    <h3 className="text-lg font-semibold flex items-center gap-2">
                      <Shield className="h-4 w-4" />
                      {t.registrationNumbers || "Registration Numbers"}
                    </h3>
                    <div className="grid gap-4 md:grid-cols-3">
                      <div className="space-y-2">
                        <Label htmlFor="vatNumber">{t.vatRegistrationNumber || "VAT Registration Number"}</Label>
                        <Input
                          id="vatNumber"
                          value={businessInfoForm.vatNumber}
                          onChange={(e) => setBusinessInfoForm(prev => ({ ...prev, vatNumber: e.target.value }))}
                          placeholder="e.g., 300000000000003"
                          data-testid="input-vat-number"
                        />
                        <p className="text-xs text-muted-foreground">{t.vatNumberHint || "15-digit VAT number"}</p>
                      </div>
                      <div className="space-y-2">
                        <Label htmlFor="crNumber">{t.crNumber || "CR Number"}</Label>
                        <Input
                          id="crNumber"
                          value={businessInfoForm.crNumber}
                          onChange={(e) => setBusinessInfoForm(prev => ({ ...prev, crNumber: e.target.value }))}
                          placeholder="e.g., 1010000000"
                          data-testid="input-cr-number"
                        />
                        <p className="text-xs text-muted-foreground">{t.crNumberHint || "Commercial Registration Number"}</p>
                      </div>
                      <div className="space-y-2">
                        <Label htmlFor="nationalId">{t.nationalId || "National ID / Unified Number"}</Label>
                        <Input
                          id="nationalId"
                          value={businessInfoForm.nationalId}
                          onChange={(e) => setBusinessInfoForm(prev => ({ ...prev, nationalId: e.target.value }))}
                          placeholder="e.g., 7000000000"
                          data-testid="input-national-id"
                        />
                      </div>
                    </div>
                  </div>

                  {/* Contact Information Section */}
                  <div className="space-y-4">
                    <h3 className="text-lg font-semibold flex items-center gap-2">
                      <Phone className="h-4 w-4" />
                      {t.contactInfo || "Contact Information"}
                    </h3>
                    <div className="grid gap-4 md:grid-cols-3">
                      <div className="space-y-2">
                        <Label htmlFor="email">{t.email || "Email"}</Label>
                        <Input
                          id="email"
                          type="email"
                          value={businessInfoForm.email}
                          onChange={(e) => setBusinessInfoForm(prev => ({ ...prev, email: e.target.value }))}
                          placeholder="IT@SaudiKinzhal.org"
                          data-testid="input-email"
                        />
                      </div>
                      <div className="space-y-2">
                        <Label htmlFor="phone">{t.phoneNumber || "Phone Number"}</Label>
                        <Input
                          id="phone"
                          value={businessInfoForm.phone}
                          onChange={(e) => setBusinessInfoForm(prev => ({ ...prev, phone: e.target.value }))}
                          placeholder="+966 50 XXX XXXX"
                          data-testid="input-phone"
                        />
                      </div>
                      <div className="space-y-2">
                        <Label htmlFor="website">{t.website || "Website"}</Label>
                        <Input
                          id="website"
                          value={businessInfoForm.website}
                          onChange={(e) => setBusinessInfoForm(prev => ({ ...prev, website: e.target.value }))}
                          placeholder="https://kinbss.com"
                          data-testid="input-website"
                        />
                      </div>
                    </div>
                  </div>

                  {/* Address Section */}
                  <div className="space-y-4">
                    <h3 className="text-lg font-semibold flex items-center gap-2">
                      <MapPin className="h-4 w-4" />
                      {t.address || "Address"}
                    </h3>
                    <div className="grid gap-4 md:grid-cols-2">
                      <div className="space-y-2">
                        <Label htmlFor="addressEn">{t.addressEn || "Address (English)"}</Label>
                        <Input
                          id="addressEn"
                          value={businessInfoForm.addressEn}
                          onChange={(e) => setBusinessInfoForm(prev => ({ ...prev, addressEn: e.target.value }))}
                          placeholder="Saudi Arabia"
                          data-testid="input-address-en"
                        />
                      </div>
                      <div className="space-y-2">
                        <Label htmlFor="addressAr">{t.addressAr || "Address (Arabic)"}</Label>
                        <Input
                          id="addressAr"
                          value={businessInfoForm.addressAr}
                          onChange={(e) => setBusinessInfoForm(prev => ({ ...prev, addressAr: e.target.value }))}
                          placeholder="المملكة العربية السعودية"
                          dir="rtl"
                          data-testid="input-address-ar"
                        />
                      </div>
                      <div className="space-y-2">
                        <Label htmlFor="city">{t.city || "City"}</Label>
                        <Input
                          id="city"
                          value={businessInfoForm.city}
                          onChange={(e) => setBusinessInfoForm(prev => ({ ...prev, city: e.target.value }))}
                          placeholder="Riyadh"
                          data-testid="input-city"
                        />
                      </div>
                      <div className="space-y-2">
                        <Label htmlFor="postalCode">{t.postalCode || "Postal Code"}</Label>
                        <Input
                          id="postalCode"
                          value={businessInfoForm.postalCode}
                          onChange={(e) => setBusinessInfoForm(prev => ({ ...prev, postalCode: e.target.value }))}
                          placeholder="12345"
                          data-testid="input-postal-code"
                        />
                      </div>
                    </div>
                  </div>

                  {/* Bank Information Section */}
                  <div className="space-y-4">
                    <h3 className="text-lg font-semibold flex items-center gap-2">
                      <Landmark className="h-4 w-4" />
                      {t.bankInfo || "Bank Information"}
                    </h3>
                    <div className="grid gap-4 md:grid-cols-2">
                      <div className="space-y-2">
                        <Label htmlFor="bankName">{t.bankName || "Bank Name"}</Label>
                        <Input
                          id="bankName"
                          value={businessInfoForm.bankName}
                          onChange={(e) => setBusinessInfoForm(prev => ({ ...prev, bankName: e.target.value }))}
                          placeholder="e.g., Al Rajhi Bank"
                          data-testid="input-bank-name"
                        />
                      </div>
                      <div className="space-y-2">
                        <Label htmlFor="bankAccountName">{t.bankAccountName || "Account Holder Name"}</Label>
                        <Input
                          id="bankAccountName"
                          value={businessInfoForm.bankAccountName}
                          onChange={(e) => setBusinessInfoForm(prev => ({ ...prev, bankAccountName: e.target.value }))}
                          placeholder="Company Name"
                          data-testid="input-bank-account-name"
                        />
                      </div>
                      <div className="space-y-2">
                        <Label htmlFor="bankAccountNumber">{t.bankAccountNumber || "Account Number"}</Label>
                        <Input
                          id="bankAccountNumber"
                          value={businessInfoForm.bankAccountNumber}
                          onChange={(e) => setBusinessInfoForm(prev => ({ ...prev, bankAccountNumber: e.target.value }))}
                          placeholder="XXXXXXXXXX"
                          data-testid="input-bank-account-number"
                        />
                      </div>
                      <div className="space-y-2">
                        <Label htmlFor="bankIban">{t.iban || "IBAN"}</Label>
                        <Input
                          id="bankIban"
                          value={businessInfoForm.bankIban}
                          onChange={(e) => setBusinessInfoForm(prev => ({ ...prev, bankIban: e.target.value }))}
                          placeholder="SAXXXXXXXXXXXXXXXXXX"
                          data-testid="input-bank-iban"
                        />
                      </div>
                    </div>
                  </div>

                  {/* Submit Button */}
                  <div className="flex justify-end gap-2 pt-4 border-t">
                    <Button
                      type="submit"
                      disabled={updateBusinessInfoMutation.isPending}
                      className="gap-2"
                      data-testid="button-save-business-info"
                    >
                      {updateBusinessInfoMutation.isPending ? (
                        <Loader2 className="h-4 w-4 animate-spin" />
                      ) : (
                        <Save className="h-4 w-4" />
                      )}
                      {t.saveChanges || "Save Changes"}
                    </Button>
                  </div>
                </form>
              )}
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>

      {/* Delete Subscription Dialog */}
      <Dialog open={deleteDialogOpen} onOpenChange={(open) => {
        setDeleteDialogOpen(open);
        if (!open) {
          setClientToDelete(null);
          setDeleteReason("mistake");
        }
      }}>
        <DialogContent className="max-w-md" data-testid="dialog-delete-subscription">
          <DialogHeader>
            <DialogTitle className="text-red-600">{t.deleteSubscription || "Delete Subscription"}</DialogTitle>
            <DialogDescription>
              {clientToDelete && (
                <span className="font-medium">{clientToDelete.restaurantName}</span>
              )}
              <br />
              {t.deleteSubscriptionConfirm || "Are you sure you want to delete this subscription?"}
            </DialogDescription>
          </DialogHeader>
          
          <div className="space-y-4 py-4">
            <div className="space-y-2">
              <Label>{t.deletionReason || "Deletion Reason"}</Label>
              <RadioGroup 
                value={deleteReason} 
                onValueChange={(value) => setDeleteReason(value as "mistake" | "client_request")}
                data-testid="radio-delete-reason"
              >
                <div className="flex items-start space-x-3 space-y-0 rounded-md border p-4">
                  <RadioGroupItem value="mistake" id="mistake" data-testid="radio-mistake" />
                  <div className="space-y-1 leading-none">
                    <Label htmlFor="mistake" className="cursor-pointer font-medium">
                      {t.mistakeSubscription || "Mistake Subscription"}
                    </Label>
                    <p className="text-sm text-muted-foreground">
                      {t.mistakeSubscriptionDesc || "This was entered by mistake - no refund needed"}
                    </p>
                  </div>
                </div>
                <div className="flex items-start space-x-3 space-y-0 rounded-md border p-4">
                  <RadioGroupItem value="client_request" id="client_request" data-testid="radio-client-request" />
                  <div className="space-y-1 leading-none">
                    <Label htmlFor="client_request" className="cursor-pointer font-medium">
                      {t.clientRequest || "By Client Request"}
                    </Label>
                    <p className="text-sm text-muted-foreground">
                      {t.clientRequestDesc || "Client requested cancellation - generate refund clearance"}
                    </p>
                  </div>
                </div>
              </RadioGroup>
            </div>

            {deleteReason === "client_request" && clientToDelete && (() => {
              const preview = calculateRefundPreview(clientToDelete);
              if (!preview) return null;
              return (
                <div className="rounded-lg border bg-muted/50 p-4 space-y-3" data-testid="refund-preview">
                  <h4 className="font-semibold flex items-center gap-2">
                    <Calculator className="h-4 w-4" />
                    {t.refundCalculation || "Refund Calculation"}
                  </h4>
                  <div className="grid grid-cols-2 gap-2 text-sm">
                    <div className="text-muted-foreground">{t.originalSubscriptionFee || "Original Subscription Fee"}:</div>
                    <div className="font-medium text-right">{preview.yearlyPrice.toLocaleString()} SAR</div>
                    
                    <div className="text-muted-foreground">{t.monthlyRate || "Monthly Rate"}:</div>
                    <div className="font-medium text-right">{preview.monthlyRate.toLocaleString()} SAR</div>
                    
                    <div className="text-muted-foreground">{t.monthsUsed || "Months Used"}:</div>
                    <div className="font-medium text-right">{preview.monthsUsed}</div>
                    
                    <div className="text-muted-foreground">{t.chargedAmount || "Charged Amount"}:</div>
                    <div className="font-medium text-right">{preview.chargedAmount.toLocaleString()} SAR</div>
                    
                    <div className="border-t pt-2 font-semibold text-green-600">{t.refundAmount || "Refund Amount"}:</div>
                    <div className="border-t pt-2 font-bold text-right text-green-600">{preview.refundAmount.toLocaleString()} SAR</div>
                  </div>
                </div>
              );
            })()}
          </div>

          <DialogFooter className="gap-2">
            <Button
              variant="outline"
              onClick={() => setDeleteDialogOpen(false)}
              disabled={deleteSubscriptionMutation.isPending}
              data-testid="button-cancel-delete"
            >
              {t.cancel || "Cancel"}
            </Button>
            <Button
              variant="destructive"
              onClick={() => {
                if (clientToDelete) {
                  deleteSubscriptionMutation.mutate({
                    restaurantId: clientToDelete.restaurantId,
                    reason: deleteReason
                  });
                }
              }}
              disabled={deleteSubscriptionMutation.isPending}
              data-testid="button-confirm-delete"
            >
              {deleteSubscriptionMutation.isPending ? (
                <Loader2 className="h-4 w-4 animate-spin mr-2" />
              ) : (
                <Trash2 className="h-4 w-4 mr-2" />
              )}
              {t.confirmDeleteBtn || "Confirm Delete"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
