import { useState, useEffect } from "react";
import { useQuery, useMutation } from "@tanstack/react-query";
import { useAuth } from "@/lib/auth";
import { useLanguage } from "@/contexts/LanguageContext";
import { apiRequest, queryClient } from "@/lib/queryClient";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from "@/components/ui/collapsible";
import { Button } from "@/components/ui/button";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { useToast } from "@/hooks/use-toast";
import { Loader2, Shield, AlertCircle, AlertTriangle, CheckCircle2, Settings, KeyRound, FileText, RefreshCw, RotateCcw, Clock, XCircle, Info, Eye, EyeOff, Copy, Download, Building2, ChevronDown, Upload } from "lucide-react";
import { Tooltip, TooltipContent, TooltipTrigger, TooltipProvider } from "@/components/ui/tooltip";
import { InfoTip } from "@/components/ui/info-tip";
import ZatcaIntegrationGuide from "@/components/zatca-integration-guide";
import { BookOpen } from "lucide-react";

interface Restaurant {
  restaurantId: string;
  restaurantName: string;
  businessType?: string;
}

interface ZatcaSettings {
  id: string;
  restaurantId: string;
  environment: string;
  csrCommonName: string | null;
  csrOrganizationName: string | null;
  csrOrganizationIdentifier: string | null;
  csrOrganizationUnitName: string | null;
  csrCountryName: string | null;
  csrSerialNumber: string | null;
  csrInvoiceType: string | null;
  streetName: string | null;
  buildingNumber: string | null;
  citySubdivision: string | null;
  city: string | null;
  postalZone: string | null;
  countryCode: string | null;
  crNumber: string | null;
  csr: string | null;
  privateKey: string | null;
  complianceCsid: string | null;
  complianceCsidSecret: string | null;
  productionCsid: string | null;
  productionCsidSecret: string | null;
  complianceRequestId: string | null;
  onboardingStatus: string;
  lastHashedInvoice: string | null;
  invoiceCounter: number;
  complianceCsidReceivedAt: string | null;
  isEnabled: boolean;
  credentialsCorrupted?: boolean;
}

// Only these fields may be edited from this page. Server-managed fields
// (onboardingStatus, invoiceCounter, lastHashedInvoice, id, ...) must never
// be POSTed back.
const EDITABLE_SETTINGS_FIELDS = [
  "environment",
  "csrCommonName",
  "csrOrganizationName",
  "csrOrganizationIdentifier",
  "csrOrganizationUnitName",
  "csrCountryName",
  "csrSerialNumber",
  "csrInvoiceType",
  "streetName",
  "buildingNumber",
  "citySubdivision",
  "city",
  "postalZone",
  "countryCode",
  "crNumber",
] as const;

interface InvoiceZatcaStatus {
  id: string;
  invoiceId: string;
  invoiceNumber: string;
  status: string;
  zatcaResponse: string | null;
  errorMessage: string | null;
  submittedAt: string | null;
}

export default function ZatcaSettingsPage() {
  const { t, isRTL, language } = useLanguage();
  const { isLoading: authLoading, user } = useAuth();
  const { toast } = useToast();
  
  const [selectedRestaurantId, setSelectedRestaurantId] = useState<string>("");
  const [formData, setFormData] = useState<Partial<ZatcaSettings>>({
    environment: "sandbox",
    csrCountryName: "SA",
    countryCode: "SA",
    csrInvoiceType: "1100",
    onboardingStatus: "not_started"
  });
  const [otp, setOtp] = useState("");
  const [complianceRequestId, setComplianceRequestId] = useState("");
  const [showPrivateKey, setShowPrivateKey] = useState(false);
  const [showComplianceCsid, setShowComplianceCsid] = useState(false);
  const [showProductionCsid, setShowProductionCsid] = useState(false);
  
  // Manual credential entry state
  const [manualCredentials, setManualCredentials] = useState({
    privateKey: "",
    complianceCsid: "",
    complianceCsidSecret: "",
    productionCsid: "",
    productionCsidSecret: "",
  });
  const [showManualEntry, setShowManualEntry] = useState(false);
  
  // Check if user is IT account (restaurantId is null)
  const isITAccount = user && user.restaurantId === null;
  
  // Fetch list of restaurants for IT account
  const { data: restaurants = [], isLoading: restaurantsLoading } = useQuery<Restaurant[]>({
    queryKey: ["/api/it/business-management/clients"],
    enabled: !authLoading && !!isITAccount,
    retry: false,
  });

  const maskValue = (value: string | null | undefined, showFull: boolean): string => {
    if (!value) return "";
    if (showFull) return value;
    if (value.length <= 8) return "••••••••";
    return value.substring(0, 4) + "••••••••" + value.substring(value.length - 4);
  };

  const copyToClipboard = async (text: string) => {
    try {
      await navigator.clipboard.writeText(text);
      toast({
        title: t.copiedToClipboard || "Copied",
        description: t.copiedToClipboardDesc || "Value copied to clipboard",
      });
    } catch (err) {
      toast({
        title: t.copyFailed || "Copy Failed",
        description: t.copyFailedDesc || "Could not copy to clipboard",
        variant: "destructive",
      });
    }
  };

  const downloadPrivateKey = () => {
    if (!settings?.privateKey) return;
    const blob = new Blob([settings.privateKey], { type: "text/plain" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = "zatca-private-key.pem";
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
    toast({
      title: t.downloadStarted || "Download Started",
      description: t.privateKeyDownloaded || "Private key downloaded securely",
    });
  };

  const { data: settings, isLoading } = useQuery<ZatcaSettings | null>({
    queryKey: ["/api/zatca/settings", selectedRestaurantId],
    queryFn: async () => {
      if (!selectedRestaurantId) return null;
      try {
        const res = await fetch(`/api/zatca/settings?restaurantId=${selectedRestaurantId}`, {
          credentials: "include"
        });
        if (!res.ok) {
          if (res.status === 403) throw new Error("Access denied. IT account required.");
          if (res.status === 404) return null;
          console.warn("Failed to fetch ZATCA settings:", res.status);
          return null;
        }
        const text = await res.text();
        if (!text || text.trim() === "") return null;
        return JSON.parse(text);
      } catch (error) {
        console.warn("Error parsing ZATCA settings:", error);
        return null;
      }
    },
    enabled: !authLoading && !!isITAccount && !!selectedRestaurantId,
    retry: false,
  });

  useEffect(() => {
    if (settings?.complianceRequestId && !complianceRequestId) {
      setComplianceRequestId(settings.complianceRequestId);
    }
  }, [settings?.complianceRequestId]);

  const { data: invoiceStatuses } = useQuery<InvoiceZatcaStatus[]>({
    queryKey: ["/api/zatca/invoices", selectedRestaurantId],
    queryFn: async () => {
      if (!selectedRestaurantId) return [];
      try {
        const res = await fetch(`/api/zatca/invoices?restaurantId=${selectedRestaurantId}`, {
          credentials: "include"
        });
        if (!res.ok) {
          console.warn("Failed to fetch ZATCA invoices:", res.status);
          return [];
        }
        const text = await res.text();
        if (!text || text.trim() === "") return [];
        return JSON.parse(text);
      } catch (error) {
        console.warn("Error parsing ZATCA invoices:", error);
        return [];
      }
    },
    enabled: !authLoading && !!isITAccount && !!selectedRestaurantId,
    retry: false,
  });

  useEffect(() => {
    if (settings) {
      const cleanSettings = { ...settings };
      const maskedFields = ["privateKey", "complianceCsid", "complianceCsidSecret", "productionCsid", "productionCsidSecret"] as const;
      for (const field of maskedFields) {
        if (cleanSettings[field] === "[CONFIGURED]") {
          delete cleanSettings[field];
        }
      }
      setFormData(cleanSettings);
    } else {
      setFormData({
        environment: "sandbox",
        csrCountryName: "SA",
        countryCode: "SA",
        csrInvoiceType: "1100",
        onboardingStatus: "not_started"
      });
    }
  }, [settings, selectedRestaurantId]);

  const saveMutation = useMutation({
    mutationFn: async (data: Partial<ZatcaSettings>) => {
      await apiRequest("POST", "/api/zatca/settings", { ...data, restaurantId: selectedRestaurantId });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/zatca/settings", selectedRestaurantId] });
      toast({
        title: t.success || "Success",
        description: t.zatcaSettingsSaved || "ZATCA settings saved successfully",
      });
    },
    onError: (error: Error) => {
      toast({
        title: t.error || "Error",
        description: error.message,
        variant: "destructive",
      });
    },
  });

  const generateCsrMutation = useMutation({
    mutationFn: async () => {
      return await apiRequest("POST", "/api/zatca/generate-csr", { restaurantId: selectedRestaurantId });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/zatca/settings", selectedRestaurantId] });
      toast({
        title: t.success || "Success",
        description: t.csrGenerated || "CSR generated successfully. Ready for onboarding.",
      });
    },
    onError: (error: Error) => {
      let msg = error.message;
      try {
        const jsonStart = msg.indexOf("{");
        if (jsonStart >= 0) {
          const parsed = JSON.parse(msg.substring(jsonStart));
          msg = parsed.error || parsed.message || msg;
        }
      } catch {}
      toast({
        title: t.error || "Error",
        description: msg,
        variant: "destructive",
      });
    },
  });

  const onboardMutation = useMutation({
    mutationFn: async () => {
      const res = await apiRequest("POST", "/api/zatca/onboard", { otp, restaurantId: selectedRestaurantId });
      return await res.json();
    },
    onSuccess: (data: any) => {
      queryClient.invalidateQueries({ queryKey: ["/api/zatca/settings", selectedRestaurantId] });
      const reqId = data.requestId || data.complianceRequestId;
      if (reqId) {
        setComplianceRequestId(String(reqId));
      }
      setOtp("");
      toast({
        title: t.success || "Success",
        description: t.onboardingSuccess || "Successfully onboarded to ZATCA. Compliance CSID received.",
      });
    },
    onError: (error: Error) => {
      let msg = error.message;
      try {
        const jsonStart = msg.indexOf("{");
        if (jsonStart >= 0) {
          const parsed = JSON.parse(msg.substring(jsonStart));
          msg = parsed.error || parsed.message || msg;
        }
      } catch {}
      toast({
        title: t.error || "Error",
        description: msg,
        variant: "destructive",
      });
    },
  });

  const complianceChecksMutation = useMutation({
    mutationFn: async () => {
      const res = await apiRequest("POST", "/api/zatca/compliance-checks", { restaurantId: selectedRestaurantId });
      return await res.json();
    },
    onSuccess: (data: any) => {
      queryClient.invalidateQueries({ queryKey: ["/api/zatca/settings", selectedRestaurantId] });
      if (data.success) {
        toast({
          title: t.success || "Success",
          description: (t as any).complianceChecksPassed || "All compliance checks passed successfully. You can now request a Production CSID.",
        });
      } else {
        const failedChecks = data.results?.filter((r: any) => !r.passed) || [];
        const errorDetails = failedChecks
          .flatMap((r: any) => (r.errors || []).map((e: any) => `${r.invoiceType}: ${e.message || e.code}`))
          .slice(0, 3);
        toast({
          title: t.error || "Error",
          description: errorDetails.length > 0 
            ? errorDetails.join("; ")
            : (t as any).complianceChecksFailed || "Compliance checks failed",
          variant: "destructive",
        });
      }
    },
    onError: (error: Error) => {
      let msg = error.message;
      try {
        const jsonStart = msg.indexOf("{");
        if (jsonStart >= 0) {
          const parsed = JSON.parse(msg.substring(jsonStart));
          msg = parsed.error || parsed.message || msg;
        }
      } catch {}
      toast({
        title: t.error || "Error",
        description: msg,
        variant: "destructive",
      });
    },
  });

  const productionCsidMutation = useMutation({
    mutationFn: async () => {
      const res = await apiRequest("POST", "/api/zatca/production-csid", { complianceRequestId, restaurantId: selectedRestaurantId });
      return await res.json();
    },
    onSuccess: (data: any) => {
      queryClient.invalidateQueries({ queryKey: ["/api/zatca/settings", selectedRestaurantId] });
      if (data.success) {
        toast({
          title: t.success || "Success",
          description: t.productionCsidSuccess || "Production CSID received. ZATCA integration is now active.",
        });
      } else {
        toast({
          title: t.error || "Error",
          description: data.message || data.error || "Failed to get production CSID",
          variant: "destructive",
        });
      }
    },
    onError: (error: Error) => {
      let msg = error.message;
      try {
        const jsonStart = msg.indexOf("{");
        if (jsonStart >= 0) {
          const parsed = JSON.parse(msg.substring(jsonStart));
          msg = parsed.error || parsed.message || msg;
        }
      } catch {}
      toast({
        title: t.error || "Error",
        description: msg,
        variant: "destructive",
      });
    },
  });

  const retryPendingMutation = useMutation({
    mutationFn: async () => {
      const res = await apiRequest("POST", "/api/zatca/retry-pending", { restaurantId: selectedRestaurantId });
      return await res.json();
    },
    onSuccess: (data: any) => {
      queryClient.invalidateQueries({ queryKey: ["/api/zatca/invoices", selectedRestaurantId] });
      toast({
        title: t.success || "Success",
        description: `Processed ${data.processed || 0} invoices. ${data.successful || 0} successful, ${data.failed || 0} failed.`,
      });
    },
    onError: (error: Error) => {
      toast({
        title: t.error || "Error",
        description: error.message,
        variant: "destructive",
      });
    },
  });

  const resetOnboardingMutation = useMutation({
    mutationFn: async () => {
      const res = await apiRequest("POST", "/api/zatca/reset-onboarding", { restaurantId: selectedRestaurantId });
      return await res.json();
    },
    onSuccess: (data: any) => {
      queryClient.invalidateQueries({ queryKey: ["/api/zatca/settings", selectedRestaurantId] });
      setComplianceRequestId("");
      toast({
        title: t.success || "Success",
        description: data.message || "ZATCA onboarding has been reset. You can now re-run Step 2.",
      });
    },
    onError: (error: Error) => {
      toast({
        title: t.error || "Error",
        description: error.message,
        variant: "destructive",
      });
    },
  });

  // The server computes corruption from the RAW stored values. The page only
  // ever receives masked sensitive fields ("[CONFIGURED]"), so it cannot make
  // this decision itself without flagging every valid credential as corrupt.
  const isCredentialsCorrupted = !!settings?.credentialsCorrupted;

  const saveManualCredentialsMutation = useMutation({
    mutationFn: async () => {
      const credentialData: Record<string, any> = { restaurantId: selectedRestaurantId };
      const stripQuotes = (s: string) => s.replace(/^['"]+/, "").replace(/['"]+$/, "");
      const cleanToken = (s: string) => stripQuotes(s.trim()).replace(/\s+/g, "");
      const cleanKey = (s: string) => stripQuotes(s.trim());
      const privateKey = cleanKey(manualCredentials.privateKey);
      const complianceCsid = cleanToken(manualCredentials.complianceCsid);
      const complianceCsidSecret = cleanToken(manualCredentials.complianceCsidSecret);
      const productionCsid = cleanToken(manualCredentials.productionCsid);
      const productionCsidSecret = cleanToken(manualCredentials.productionCsidSecret);
      if (privateKey) credentialData.privateKey = privateKey;
      if (complianceCsid) credentialData.complianceCsid = complianceCsid;
      if (complianceCsidSecret) credentialData.complianceCsidSecret = complianceCsidSecret;
      if (productionCsid) credentialData.productionCsid = productionCsid;
      if (productionCsidSecret) credentialData.productionCsidSecret = productionCsidSecret;
      
      if (productionCsid && productionCsidSecret) {
        credentialData.onboardingStatus = "production_ready";
        credentialData.isEnabled = true;
      } else if (complianceCsid && complianceCsidSecret) {
        credentialData.onboardingStatus = "compliance_received";
      }
      
      return await apiRequest("POST", "/api/zatca/settings", credentialData);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/zatca/settings", selectedRestaurantId] });
      setManualCredentials({
        privateKey: "",
        complianceCsid: "",
        complianceCsidSecret: "",
        productionCsid: "",
        productionCsidSecret: "",
      });
      setShowManualEntry(false);
      toast({
        title: t.success || "Success",
        description: (t as any).credentialsSaved || "ZATCA credentials saved successfully. Integration is now active.",
      });
    },
    onError: (error: Error) => {
      toast({
        title: t.error || "Error",
        description: error.message,
        variant: "destructive",
      });
    },
  });

  const handleChange = (field: keyof ZatcaSettings, value: string) => {
    setFormData((prev) => ({ ...prev, [field]: value }));
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const editableData: Partial<ZatcaSettings> = {};
    for (const field of EDITABLE_SETTINGS_FIELDS) {
      if (formData[field] !== undefined) {
        (editableData as any)[field] = formData[field];
      }
    }
    saveMutation.mutate(editableData);
  };

  if (authLoading || restaurantsLoading) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <Loader2 className="h-8 w-8 animate-spin" />
      </div>
    );
  }
  
  // Check if user is IT account
  if (!isITAccount) {
    return (
      <div className="p-6">
        <Alert variant="destructive">
          <AlertCircle className="h-4 w-4" />
          <AlertTitle>{t.accessDenied || "Access Denied"}</AlertTitle>
          <AlertDescription>
            {t.itAccountRequired || "This feature is only available for IT accounts. Please contact your administrator."}
          </AlertDescription>
        </Alert>
      </div>
    );
  }

  const getStatusBadge = (status: string) => {
    switch (status) {
      case "not_started":
        return <Badge variant="secondary" data-testid="badge-status-not-started"><Clock className="w-3 h-3 mr-1" />{t.notStarted || "Not Started"}</Badge>;
      case "csr_generated":
        return <Badge variant="outline" data-testid="badge-status-csr-generated"><Settings className="w-3 h-3 mr-1" />{t.csrGenerated || "CSR Generated"}</Badge>;
      case "compliance_received":
        return <Badge variant="default" className="bg-yellow-500" data-testid="badge-status-compliance"><AlertCircle className="w-3 h-3 mr-1" />{t.complianceReceived || "Compliance CSID"}</Badge>;
      case "compliance_passed":
        return <Badge variant="default" className="bg-blue-500" data-testid="badge-status-compliance-passed"><CheckCircle2 className="w-3 h-3 mr-1" />{(t as any).compliancePassed || "Compliance Passed"}</Badge>;
      case "production_ready":
        return <Badge variant="default" className="bg-green-500" data-testid="badge-status-production"><CheckCircle2 className="w-3 h-3 mr-1" />{t.productionReady || "Production Ready"}</Badge>;
      default:
        return <Badge variant="secondary" data-testid="badge-status-unknown">{status}</Badge>;
    }
  };

  const getInvoiceStatusBadge = (status: string) => {
    switch (status) {
      case "pending":
        return <Badge variant="secondary" data-testid={`badge-invoice-pending`}><Clock className="w-3 h-3 mr-1" />{t.pending || "Pending"}</Badge>;
      case "submitted":
        return <Badge variant="default" className="bg-blue-500" data-testid={`badge-invoice-submitted`}><RefreshCw className="w-3 h-3 mr-1" />{(t as any).submitted || "Submitted"}</Badge>;
      case "cleared":
        return <Badge variant="default" className="bg-green-500" data-testid={`badge-invoice-cleared`}><CheckCircle2 className="w-3 h-3 mr-1" />{t.cleared || "Cleared"}</Badge>;
      case "reported":
        return <Badge variant="default" className="bg-green-500" data-testid={`badge-invoice-reported`}><CheckCircle2 className="w-3 h-3 mr-1" />{t.reported || "Reported"}</Badge>;
      case "rejected":
        return <Badge variant="destructive" data-testid={`badge-invoice-rejected`}><XCircle className="w-3 h-3 mr-1" />{t.rejected || "Rejected"}</Badge>;
      case "failed":
        return <Badge variant="destructive" data-testid={`badge-invoice-failed`}><XCircle className="w-3 h-3 mr-1" />{(t as any).failed || "Failed"}</Badge>;
      default:
        return <Badge variant="secondary">{status}</Badge>;
    }
  };

  const pendingCount = invoiceStatuses?.filter(s => s.status === "pending").length || 0;
  const clearedCount = invoiceStatuses?.filter(s => s.status === "cleared" || s.status === "reported").length || 0;
  const failedCount = invoiceStatuses?.filter(s => s.status === "rejected" || s.status === "failed").length || 0;

  return (
    <TooltipProvider delayDuration={150}>
    <div className={`container mx-auto p-6 max-w-4xl ${isRTL ? "rtl" : ""}`} dir={isRTL ? "rtl" : "ltr"}>
      <div className="flex items-center gap-3 mb-6">
        <Shield className="h-8 w-8 text-primary" />
        <div>
          <h1 className="text-2xl font-bold" data-testid="text-page-title">{t.zatcaSettings || "ZATCA E-Invoicing Settings"}</h1>
          <p className="text-muted-foreground">{t.zatcaSettingsDescription || "Configure your ZATCA Phase 2 e-invoicing integration"}</p>
        </div>
      </div>

      {/* Restaurant Selector for IT Account */}
      <Card className="mb-6">
        <CardHeader className="pb-3">
          <CardTitle className="flex items-center gap-2">
            <Building2 className="h-5 w-5" />
            {t.selectRestaurant || "Select Restaurant"}
          </CardTitle>
          <CardDescription>
            {t.selectRestaurantDescription || "Choose a client to manage their ZATCA e-invoicing settings"}
          </CardDescription>
        </CardHeader>
        <CardContent>
          <Select
            value={selectedRestaurantId}
            onValueChange={(value) => {
              setSelectedRestaurantId(value);
              setFormData({
                environment: "sandbox",
                csrCountryName: "SA",
                countryCode: "SA",
                csrInvoiceType: "1100",
                onboardingStatus: "not_started"
              });
              setOtp("");
              setComplianceRequestId("");
              setManualCredentials({
                privateKey: "",
                complianceCsid: "",
                complianceCsidSecret: "",
                productionCsid: "",
                productionCsidSecret: "",
              });
            }}
          >
            <SelectTrigger className="w-full" data-testid="select-restaurant">
              <SelectValue placeholder={t.selectRestaurantPlaceholder || "Select a restaurant..."} />
            </SelectTrigger>
            <SelectContent>
              {restaurants.map((restaurant: Restaurant) => (
                <SelectItem key={restaurant.restaurantId} value={restaurant.restaurantId} data-testid={`option-restaurant-${restaurant.restaurantId}`}>
                  {restaurant.restaurantName} {restaurant.businessType ? `(${restaurant.businessType})` : ""}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </CardContent>
      </Card>

      {!selectedRestaurantId ? (
        <div className="space-y-6">
          <Alert>
            <Info className="h-4 w-4" />
            <AlertTitle>{t.noRestaurantSelected || "No Restaurant Selected"}</AlertTitle>
            <AlertDescription>
              {t.pleaseSelectRestaurant || "Please select a restaurant from the dropdown above to manage their ZATCA settings."}
            </AlertDescription>
          </Alert>
          <ZatcaIntegrationGuide />
        </div>
      ) : isLoading ? (
        <div className="flex items-center justify-center min-h-[200px]">
          <Loader2 className="h-6 w-6 animate-spin" />
        </div>
      ) : (
        <>
          <div className="flex items-center gap-4 mb-6 flex-wrap">
            <span className="text-sm font-medium">{t.onboardingStatus || "Onboarding Status"}:</span>
            {getStatusBadge(settings?.onboardingStatus || "not_started")}
            {(settings?.onboardingStatus !== "not_started" && settings?.onboardingStatus !== "production_ready") && (
              <Tooltip>
                <TooltipTrigger asChild>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => {
                      if (confirm("This will clear all ZATCA credentials and reset onboarding to Step 1. You will need to re-run the onboarding process. Continue?")) {
                        resetOnboardingMutation.mutate();
                      }
                    }}
                    disabled={resetOnboardingMutation.isPending}
                    data-testid="button-reset-onboarding"
                  >
                    {resetOnboardingMutation.isPending && <Loader2 className="w-3 h-3 mr-1 animate-spin" />}
                    <RotateCcw className="w-3 h-3 mr-1" />
                    Reset Onboarding
                  </Button>
                </TooltipTrigger>
                <TooltipContent>{isRTL ? "تحذير: يمسح جميع بيانات اعتماد ZATCA ويعيد التسجيل." : "Warning: clears all ZATCA credentials and restarts onboarding."}</TooltipContent>
              </Tooltip>
            )}
          </div>

          {isCredentialsCorrupted && (
            <Alert variant="destructive" className="mb-6">
              <AlertTriangle className="h-4 w-4" />
              <AlertTitle>Corrupted Credentials Detected</AlertTitle>
              <AlertDescription>
                Your ZATCA credentials were corrupted by a previous bug (stored as placeholder values instead of real credentials). 
                Click "Reset Onboarding" above, then re-run Step 2 to get fresh credentials from ZATCA.
              </AlertDescription>
            </Alert>
          )}

          <Tabs defaultValue="settings" className="space-y-6">
        <TabsList>
          <TabsTrigger value="settings" data-testid="tab-settings">
            <Settings className="w-4 h-4 mr-2" />
            {t.settings || "Settings"}
          </TabsTrigger>
          <TabsTrigger value="onboarding" data-testid="tab-onboarding">
            <KeyRound className="w-4 h-4 mr-2" />
            {t.onboarding || "Onboarding"}
          </TabsTrigger>
          <TabsTrigger value="invoices" data-testid="tab-invoices">
            <FileText className="w-4 h-4 mr-2" />
            {t.invoices || "Invoices"}
          </TabsTrigger>
          <TabsTrigger value="guide" data-testid="tab-guide">
            <BookOpen className="w-4 h-4 mr-2" />
            {language === "Arabic" ? "دليل الربط" : "Integration Guide"}
          </TabsTrigger>
        </TabsList>

        <TabsContent value="settings">
          <form onSubmit={handleSubmit}>
            <Card>
              <CardHeader>
                <CardTitle>{t.organizationDetails || "Organization Details"}</CardTitle>
                <CardDescription>{t.organizationDetailsDescription || "Configure your organization information for ZATCA certificate generation"}</CardDescription>
              </CardHeader>
              <CardContent className="space-y-6">
                <div className="grid md:grid-cols-2 gap-6">
                  <div className="space-y-2">
                    <Label htmlFor="environment">{t.environment || "Environment"}</Label>
                    <Select
                      value={formData.environment || "sandbox"}
                      onValueChange={(value) => handleChange("environment", value)}
                    >
                      <SelectTrigger id="environment" data-testid="select-environment">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="sandbox">{t.sandbox || "Sandbox (Testing)"}</SelectItem>
                        <SelectItem value="simulation">{(t as any).simulation || "Simulation (Pre-Production)"}</SelectItem>
                        <SelectItem value="production">{t.production || "Production"}</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="csrInvoiceType">{t.invoiceType || "Invoice Type"}</Label>
                    <Select
                      value={formData.csrInvoiceType || "1100"}
                      onValueChange={(value) => handleChange("csrInvoiceType", value)}
                    >
                      <SelectTrigger id="csrInvoiceType" data-testid="select-invoice-type">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="1000">{t.b2bOnly || "B2B Only (Standard)"}</SelectItem>
                        <SelectItem value="0100">{t.b2cOnly || "B2C Only (Simplified)"}</SelectItem>
                        <SelectItem value="1100">{t.bothB2bB2c || "Both B2B & B2C"}</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="csrCommonName">{t.commonName || "Common Name"}<InfoTip>{isRTL ? "معرف فريد لجهاز نقطة البيع للشهادة." : "Unique identifier for this POS device on the certificate."}</InfoTip></Label>
                    <Input
                      id="csrCommonName"
                      value={formData.csrCommonName || ""}
                      onChange={(e) => handleChange("csrCommonName", e.target.value)}
                      placeholder={t.enterCommonName || "e.g., EGS1-TST-886431145-399900000000001"}
                      data-testid="input-common-name"
                    />
                    {!!formData.csrCommonName && (() => {
                      const v = formData.csrCommonName || "";
                      if (/\s/.test(v)) {
                        return <p className="text-xs text-destructive">{isRTL ? "يجب ألا يحتوي على مسافات." : "Must not contain spaces."}</p>;
                      }
                      return <p className="text-xs text-green-600">{isRTL ? "التنسيق يبدو صحيحًا" : "Format looks valid"}</p>;
                    })()}
                    <p className="text-xs text-muted-foreground">{isRTL ? "معرّف الجهاز على الشهادة، مثل EGS1-TST-886431145-399900000000001 (بدون مسافات)." : "Device identifier on the certificate, e.g. EGS1-TST-886431145-399900000000001 (no spaces)."}</p>
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="csrOrganizationName">{t.organizationName || "Organization Name"}</Label>
                    <Input
                      id="csrOrganizationName"
                      value={formData.csrOrganizationName || ""}
                      onChange={(e) => handleChange("csrOrganizationName", e.target.value)}
                      placeholder={t.enterOrganizationName || "Your company name"}
                      data-testid="input-organization-name"
                    />
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="csrOrganizationIdentifier">{t.vatNumber || "VAT Number"}<InfoTip>{isRTL ? "رقم ضريبة القيمة المضافة السعودي المكون من 15 رقمًا، يبدأ وينتهي بالرقم 3." : "15-digit Saudi VAT number; must start and end with 3."}</InfoTip></Label>
                    <Input
                      id="csrOrganizationIdentifier"
                      value={formData.csrOrganizationIdentifier || ""}
                      onChange={(e) => {
                        const val = e.target.value.replace(/\D/g, "").slice(0, 15);
                        handleChange("csrOrganizationIdentifier", val);
                      }}
                      placeholder={t.enterVatNumber || "e.g., 300000000000003"}
                      data-testid="input-vat-number"
                      maxLength={15}
                    />
                    {formData.csrOrganizationIdentifier && (() => {
                      const v = formData.csrOrganizationIdentifier || "";
                      const errors: string[] = [];
                      if (v.length !== 15) errors.push(`Must be 15 digits (currently ${v.length})`);
                      if (v.length > 0 && !v.startsWith("3")) errors.push("Must start with 3");
                      if (v.length >= 15 && !v.endsWith("3")) errors.push("Must end with 3");
                      if (errors.length > 0) {
                        return <p className="text-xs text-destructive">{errors.join(". ")}</p>;
                      }
                      return <p className="text-xs text-green-600">Valid Saudi VAT number format</p>;
                    })()}
                    <p className="text-xs text-muted-foreground">Saudi VAT number: 15 digits, starts and ends with 3</p>
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="csrOrganizationUnitName">{t.branchName || "Branch/Unit Name"}<InfoTip>{isRTL ? "اسم الفرع أو الوحدة المرتبطة بهذه الشهادة." : "Branch or unit associated with this certificate."}</InfoTip></Label>
                    <Input
                      id="csrOrganizationUnitName"
                      value={formData.csrOrganizationUnitName || ""}
                      onChange={(e) => handleChange("csrOrganizationUnitName", e.target.value)}
                      placeholder={t.enterBranchName || "Main Branch"}
                      data-testid="input-branch-name"
                    />
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="csrSerialNumber">{t.deviceSerialNumber || "Device Serial Number"}<InfoTip>{isRTL ? "معرف الجهاز بتنسيق ZATCA: 1-...|2-...|3-..." : "Device identifier in ZATCA format: 1-...|2-...|3-..."}</InfoTip></Label>
                    <Input
                      id="csrSerialNumber"
                      value={formData.csrSerialNumber || ""}
                      onChange={(e) => handleChange("csrSerialNumber", e.target.value)}
                      placeholder={t.enterDeviceSerial || "e.g., 1-TST|2-TST|3-ed22f1d8-e6a2-1118-9b58-d9a8195e05"}
                      data-testid="input-device-serial"
                    />
                    {!!formData.csrSerialNumber && (() => {
                      const ok = /^1-.+\|2-.+\|3-.+$/.test(formData.csrSerialNumber || "");
                      return ok
                        ? <p className="text-xs text-green-600">{isRTL ? "التنسيق يبدو صحيحًا" : "Format looks valid"}</p>
                        : <p className="text-xs text-destructive">{isRTL ? "يجب أن يكون بالتنسيق 1-...|2-...|3-..." : "Must be in the format 1-...|2-...|3-..."}</p>;
                    })()}
                    <p className="text-xs text-muted-foreground">{isRTL ? "ثلاثة أجزاء مفصولة بالرمز | ، مثل 1-TST|2-TST|3-ed22f1d8..." : "Three parts separated by | , e.g. 1-TST|2-TST|3-ed22f1d8..."}</p>
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="crNumber">{t.commercialRegistration || "Commercial Registration"}<InfoTip>{isRTL ? "رقم السجل التجاري للمنشأة." : "Your business commercial registration number."}</InfoTip></Label>
                    <Input
                      id="crNumber"
                      value={formData.crNumber || ""}
                      onChange={(e) => handleChange("crNumber", e.target.value)}
                      placeholder={t.enterCrNumber || "e.g., 3100000000"}
                      data-testid="input-cr-number"
                    />
                    {!!formData.crNumber && (() => {
                      const v = formData.crNumber || "";
                      if (!/^\d+$/.test(v)) {
                        return <p className="text-xs text-destructive">{isRTL ? "أرقام فقط." : "Digits only."}</p>;
                      }
                      if (v.length === 10) {
                        return <p className="text-xs text-green-600">{isRTL ? "التنسيق يبدو صحيحًا" : "Format looks valid"}</p>;
                      }
                      return <p className="text-xs text-muted-foreground">{isRTL ? `عادة 10 أرقام (حاليًا ${v.length})` : `Usually 10 digits (currently ${v.length})`}</p>;
                    })()}
                    <p className="text-xs text-muted-foreground">{isRTL ? "رقم السجل التجاري، عادة 10 أرقام، مثل 3100000000." : "Commercial registration number, usually 10 digits, e.g. 3100000000."}</p>
                  </div>
                </div>

                <Separator />

                <div>
                  <h3 className="text-lg font-semibold mb-4">{t.businessAddress || "Business Address"}</h3>
                  <div className="grid md:grid-cols-2 gap-6">
                    <div className="space-y-2">
                      <Label htmlFor="streetName">{t.streetName || "Street Name"}</Label>
                      <Input
                        id="streetName"
                        value={formData.streetName || ""}
                        onChange={(e) => handleChange("streetName", e.target.value)}
                        placeholder={t.enterStreetName || "King Fahd Road"}
                        data-testid="input-street-name"
                      />
                    </div>

                    <div className="space-y-2">
                      <Label htmlFor="buildingNumber">{t.buildingNumber || "Building Number"}</Label>
                      <Input
                        id="buildingNumber"
                        value={formData.buildingNumber || ""}
                        onChange={(e) => handleChange("buildingNumber", e.target.value)}
                        placeholder={t.enterBuildingNumber || "1234"}
                        data-testid="input-building-number"
                      />
                    </div>

                    <div className="space-y-2">
                      <Label htmlFor="citySubdivision">{t.district || "District"}</Label>
                      <Input
                        id="citySubdivision"
                        value={formData.citySubdivision || ""}
                        onChange={(e) => handleChange("citySubdivision", e.target.value)}
                        placeholder={t.enterDistrict || "Al Olaya"}
                        data-testid="input-district"
                      />
                    </div>

                    <div className="space-y-2">
                      <Label htmlFor="city">{t.city || "City"}</Label>
                      <Input
                        id="city"
                        value={formData.city || ""}
                        onChange={(e) => handleChange("city", e.target.value)}
                        placeholder={t.enterCity || "Riyadh"}
                        data-testid="input-city"
                      />
                    </div>

                    <div className="space-y-2">
                      <Label htmlFor="postalZone">{t.postalCode || "Postal Code"}<InfoTip>{isRTL ? "الرمز البريدي المكون من 5 أرقام للعنوان." : "5-digit postal code for the address."}</InfoTip></Label>
                      <Input
                        id="postalZone"
                        value={formData.postalZone || ""}
                        onChange={(e) => handleChange("postalZone", e.target.value)}
                        placeholder={t.enterPostalCode || "12345"}
                        data-testid="input-postal-code"
                      />
                      {!!formData.postalZone && (() => {
                        const ok = /^\d{5}$/.test(formData.postalZone || "");
                        return ok
                          ? <p className="text-xs text-green-600">{isRTL ? "التنسيق يبدو صحيحًا" : "Format looks valid"}</p>
                          : <p className="text-xs text-destructive">{isRTL ? "يجب أن يكون 5 أرقام." : "Must be 5 digits."}</p>;
                      })()}
                    </div>

                    <div className="space-y-2">
                      <Label htmlFor="countryCode">{t.countryCode || "Country Code"}</Label>
                      <Input
                        id="countryCode"
                        value={formData.countryCode || "SA"}
                        onChange={(e) => handleChange("countryCode", e.target.value)}
                        placeholder="SA"
                        data-testid="input-country-code"
                      />
                    </div>
                  </div>
                </div>

                <div className="flex justify-end gap-4">
                  <Button
                    type="submit"
                    disabled={saveMutation.isPending}
                    data-testid="button-save-settings"
                  >
                    {saveMutation.isPending && <Loader2 className="w-4 h-4 mr-2 animate-spin" />}
                    {(t as any).saveSettings || "Save Settings"}
                  </Button>
                </div>
              </CardContent>
            </Card>
          </form>
        </TabsContent>

        <TabsContent value="onboarding">
          <div className="space-y-6">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <span className="flex items-center justify-center w-8 h-8 rounded-full bg-primary text-primary-foreground text-sm font-bold">1</span>
                  {t.generateCsr || "Generate CSR"}
                </CardTitle>
                <CardDescription>{t.generateCsrDescription || "Generate a Certificate Signing Request based on your settings"}</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="flex items-center gap-4">
                  <Button
                    onClick={() => generateCsrMutation.mutate()}
                    disabled={generateCsrMutation.isPending || !settings}
                    data-testid="button-generate-csr"
                  >
                    {generateCsrMutation.isPending && <Loader2 className="w-4 h-4 mr-2 animate-spin" />}
                    {t.generateCsr || "Generate CSR"}
                  </Button>
                  {settings?.csr && (
                    <Badge variant="default" className="bg-green-500">
                      <CheckCircle2 className="w-3 h-3 mr-1" />
                      {t.csrReady || "CSR Ready"}
                    </Badge>
                  )}
                </div>
                {!settings && (
                  <Alert className="mt-4">
                    <AlertCircle className="h-4 w-4" />
                    <AlertTitle>{t.settingsRequired || "Settings Required"}</AlertTitle>
                    <AlertDescription>{t.saveSettingsFirst || "Please save your organization settings first."}</AlertDescription>
                  </Alert>
                )}
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <span className="flex items-center justify-center w-8 h-8 rounded-full bg-primary text-primary-foreground text-sm font-bold">2</span>
                  {t.requestComplianceCsid || "Request Compliance CSID"}
                </CardTitle>
                <CardDescription>{t.requestComplianceCsidDescription || "Submit your CSR to ZATCA to receive a compliance certificate"}</CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <Alert>
                  <Info className="h-4 w-4" />
                  <AlertTitle>{t.otpRequired || "OTP Required"}</AlertTitle>
                  <AlertDescription>{t.otpInstructions || "You need to request an OTP from ZATCA portal (fatoora.zatca.gov.sa) before proceeding."}</AlertDescription>
                </Alert>
                <div className="flex items-center gap-4">
                  <div className="flex-1">
                    <Label htmlFor="otp">{t.enterOtp || "Enter OTP"}</Label>
                    <Input
                      id="otp"
                      value={otp}
                      onChange={(e) => setOtp(e.target.value.replace(/\D/g, "").slice(0, 6))}
                      inputMode="numeric"
                      placeholder="123456"
                      maxLength={6}
                      data-testid="input-otp"
                    />
                    <p className="text-xs text-muted-foreground mt-1">{isRTL ? "رمز مكوّن من 6 أرقام من بوابة فاتورة (يصلح لمرة واحدة)." : "6-digit one-time code from the Fatoora portal."}</p>
                  </div>
                  <Button
                    onClick={() => onboardMutation.mutate()}
                    disabled={onboardMutation.isPending || !settings?.csr || otp.length !== 6}
                    className="mt-6"
                    data-testid="button-request-compliance"
                  >
                    {onboardMutation.isPending && <Loader2 className="w-4 h-4 mr-2 animate-spin" />}
                    {t.requestCsid || "Request CSID"}
                  </Button>
                </div>
                {settings?.complianceCsid && (
                  <div className="space-y-3 mt-4 p-4 bg-muted rounded-lg">
                    <div className="flex items-center gap-2">
                      <Badge variant="default" className="bg-green-500">
                        <CheckCircle2 className="w-3 h-3 mr-1" />
                        {t.complianceCsidReceived || "Compliance CSID Received"}
                      </Badge>
                    </div>
                    <div className="space-y-2">
                      <Label>{t.complianceCertificate || "Compliance Certificate"}</Label>
                      <div className="flex items-center gap-2">
                        <Input 
                          type={showComplianceCsid ? "text" : "password"}
                          value={maskValue(settings.complianceCsid, showComplianceCsid)}
                          readOnly
                          className="font-mono text-xs"
                          data-testid="input-compliance-csid-masked"
                        />
                        <Tooltip>
                          <TooltipTrigger asChild>
                            <Button 
                              variant="outline" 
                              size="icon"
                              aria-label="Toggle visibility"
                              onClick={() => setShowComplianceCsid(!showComplianceCsid)}
                              data-testid="button-toggle-compliance-csid"
                            >
                              {showComplianceCsid ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                            </Button>
                          </TooltipTrigger>
                          <TooltipContent>Toggle visibility</TooltipContent>
                        </Tooltip>
                        <Tooltip>
                          <TooltipTrigger asChild>
                            <Button 
                              variant="outline" 
                              size="icon"
                              aria-label="Copy"
                              onClick={() => copyToClipboard(settings.complianceCsid || "")}
                              data-testid="button-copy-compliance-csid"
                            >
                              <Copy className="h-4 w-4" />
                            </Button>
                          </TooltipTrigger>
                          <TooltipContent>Copy</TooltipContent>
                        </Tooltip>
                      </div>
                    </div>
                  </div>
                )}
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <span className="flex items-center justify-center w-8 h-8 rounded-full bg-primary text-primary-foreground text-sm font-bold">3</span>
                  {(t as any).runComplianceChecks || "Run Compliance Checks"}
                </CardTitle>
                <CardDescription>{(t as any).runComplianceChecksDescription || "Submit test invoices to ZATCA to verify your integration before requesting production credentials"}</CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <Alert>
                  <Info className="h-4 w-4" />
                  <AlertTitle>{(t as any).complianceChecksInfo || "Compliance Verification"}</AlertTitle>
                  <AlertDescription>{(t as any).complianceChecksInfoDescription || "This will submit test invoices (Standard B2B and Simplified B2C) to ZATCA using your Compliance CSID to verify your integration is working correctly."}</AlertDescription>
                </Alert>
                {settings?.complianceCsidReceivedAt && (() => {
                  const receivedTime = new Date(settings.complianceCsidReceivedAt).getTime();
                  if (isNaN(receivedTime)) return null;
                  const ageMinutes = (Date.now() - receivedTime) / 60000;
                  if (ageMinutes > 50) {
                    return (
                      <Alert variant="destructive">
                        <AlertCircle className="h-4 w-4" />
                        <AlertTitle>CSID Expired</AlertTitle>
                        <AlertDescription>Your Compliance CSID was received {Math.round(ageMinutes)} minutes ago and has likely expired (valid for ~60 minutes). Please go back to Step 2, generate a new OTP, and request a new Compliance CSID.</AlertDescription>
                      </Alert>
                    );
                  }
                  if (ageMinutes > 30) {
                    return (
                      <Alert className="bg-yellow-50 border-yellow-200 dark:bg-yellow-900/20 dark:border-yellow-800">
                        <AlertCircle className="h-4 w-4 text-yellow-600" />
                        <AlertTitle className="text-yellow-800 dark:text-yellow-300">CSID Expiring Soon</AlertTitle>
                        <AlertDescription className="text-yellow-700 dark:text-yellow-400">Your Compliance CSID was received {Math.round(ageMinutes)} minutes ago. It expires after ~60 minutes. Complete Steps 3 and 4 soon.</AlertDescription>
                      </Alert>
                    );
                  }
                  return null;
                })()}
                <Button
                  onClick={() => complianceChecksMutation.mutate()}
                  disabled={complianceChecksMutation.isPending || !settings?.complianceCsid}
                  data-testid="button-run-compliance-checks"
                >
                  {complianceChecksMutation.isPending && <Loader2 className="w-4 h-4 mr-2 animate-spin" />}
                  {(t as any).runComplianceChecks || "Run Compliance Checks"}
                </Button>
                {settings?.onboardingStatus === "compliance_passed" && (
                  <Alert className="bg-green-50 border-green-200 dark:bg-green-900/20 dark:border-green-800">
                    <CheckCircle2 className="h-4 w-4 text-green-600" />
                    <AlertTitle className="text-green-800 dark:text-green-300">{(t as any).complianceChecksPassed || "Compliance Checks Passed"}</AlertTitle>
                    <AlertDescription className="text-green-700 dark:text-green-400">{(t as any).readyForProduction || "Your integration is verified. You can now request a Production CSID."}</AlertDescription>
                  </Alert>
                )}
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <span className="flex items-center justify-center w-8 h-8 rounded-full bg-primary text-primary-foreground text-sm font-bold">4</span>
                  {t.requestProductionCsid || "Request Production CSID"}
                </CardTitle>
                <CardDescription>{t.requestProductionCsidDescription || "Complete compliance checks and receive your production certificate"}</CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="flex items-center gap-4">
                  <div className="flex-1">
                    <Label htmlFor="complianceRequestId">{t.complianceRequestId || "Compliance Request ID"}</Label>
                    <Input
                      id="complianceRequestId"
                      value={complianceRequestId}
                      onChange={(e) => setComplianceRequestId(e.target.value.replace(/\D/g, ""))}
                      inputMode="numeric"
                      placeholder={t.enterComplianceRequestId || "From step 2"}
                      data-testid="input-compliance-request-id"
                    />
                    <p className="text-xs text-muted-foreground mt-1">{isRTL ? "رقم الطلب الذي تم إرجاعه عند طلب شهادة الامتثال (الخطوة 2)، أرقام فقط." : "The request ID returned when you requested the compliance CSID (step 2) — digits only."}</p>
                  </div>
                  <Button
                    onClick={() => productionCsidMutation.mutate()}
                    disabled={productionCsidMutation.isPending || !settings?.complianceCsid || !complianceRequestId}
                    className="mt-6"
                    data-testid="button-request-production"
                  >
                    {productionCsidMutation.isPending && <Loader2 className="w-4 h-4 mr-2 animate-spin" />}
                    {t.requestProductionCsid || "Request Production CSID"}
                  </Button>
                </div>
                {settings?.productionCsid && (
                  <div className="space-y-3 mt-4 p-4 bg-muted rounded-lg">
                    <div className="flex items-center gap-2">
                      <Badge variant="default" className="bg-green-500">
                        <CheckCircle2 className="w-3 h-3 mr-1" />
                        {t.productionCsidReceived || "Production CSID Received"}
                      </Badge>
                    </div>
                    <Alert className="bg-yellow-50 border-yellow-200">
                      <AlertCircle className="h-4 w-4 text-yellow-600" />
                      <AlertTitle className="text-yellow-800">{t.securityWarning || "Security Warning"}</AlertTitle>
                      <AlertDescription className="text-yellow-700">
                        {t.securityWarningDesc || "Keep your production credentials secure. Never share them publicly."}
                      </AlertDescription>
                    </Alert>
                    <div className="space-y-2">
                      <Label>{t.productionCertificate || "Production Certificate"}</Label>
                      <div className="flex items-center gap-2">
                        <Input 
                          type={showProductionCsid ? "text" : "password"}
                          value={maskValue(settings.productionCsid, showProductionCsid)}
                          readOnly
                          className="font-mono text-xs"
                          data-testid="input-production-csid-masked"
                        />
                        <Tooltip>
                          <TooltipTrigger asChild>
                            <Button 
                              variant="outline" 
                              size="icon"
                              aria-label="Toggle visibility"
                              onClick={() => setShowProductionCsid(!showProductionCsid)}
                              data-testid="button-toggle-production-csid"
                            >
                              {showProductionCsid ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                            </Button>
                          </TooltipTrigger>
                          <TooltipContent>Toggle visibility</TooltipContent>
                        </Tooltip>
                        <Tooltip>
                          <TooltipTrigger asChild>
                            <Button 
                              variant="outline" 
                              size="icon"
                              aria-label="Copy"
                              onClick={() => copyToClipboard(settings.productionCsid || "")}
                              data-testid="button-copy-production-csid"
                            >
                              <Copy className="h-4 w-4" />
                            </Button>
                          </TooltipTrigger>
                          <TooltipContent>Copy</TooltipContent>
                        </Tooltip>
                      </div>
                    </div>
                    {settings?.privateKey && (
                      <div className="space-y-2">
                        <Label>{t.privateKey || "Private Key"}</Label>
                        <div className="flex items-center gap-2">
                          <Input 
                            type="password"
                            value={maskValue(settings.privateKey, showPrivateKey)}
                            readOnly
                            className="font-mono text-xs"
                            data-testid="input-private-key-masked"
                          />
                          <Tooltip>
                            <TooltipTrigger asChild>
                              <Button 
                                variant="outline" 
                                size="icon"
                                aria-label="Toggle visibility"
                                onClick={() => setShowPrivateKey(!showPrivateKey)}
                                data-testid="button-toggle-private-key"
                              >
                                {showPrivateKey ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                              </Button>
                            </TooltipTrigger>
                            <TooltipContent>Toggle visibility</TooltipContent>
                          </Tooltip>
                          <Tooltip>
                            <TooltipTrigger asChild>
                              <Button 
                                variant="outline" 
                                size="icon"
                                aria-label={t.download || "Download"}
                                onClick={downloadPrivateKey}
                                data-testid="button-download-private-key"
                              >
                                <Download className="h-4 w-4" />
                              </Button>
                            </TooltipTrigger>
                            <TooltipContent>{t.download || "Download"}</TooltipContent>
                          </Tooltip>
                        </div>
                        <p className="text-xs text-muted-foreground">
                          {t.privateKeyWarning || "Store this key securely. You will need it if you reinstall or move to a new system."}
                        </p>
                      </div>
                    )}
                  </div>
                )}
              </CardContent>
            </Card>

            <Separator className="my-6" />

            <Card className="border-dashed">
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Upload className="h-5 w-5" />
                  {(t as any).manualCredentialEntry || "Manual Credential Entry"}
                </CardTitle>
                <CardDescription>
                  {(t as any).manualCredentialDescription || "Already have your ZATCA credentials? Enter them here to activate e-invoicing without going through the onboarding flow."}
                </CardDescription>
              </CardHeader>
              <CardContent>
                <Collapsible open={showManualEntry} onOpenChange={setShowManualEntry}>
                  <CollapsibleTrigger asChild>
                    <Button variant="outline" className="w-full mb-4" data-testid="button-toggle-manual-entry">
                      <ChevronDown className={`h-4 w-4 mr-2 transition-transform ${showManualEntry ? "rotate-180" : ""}`} />
                      {showManualEntry 
                        ? ((t as any).hideCredentialForm || "Hide Credential Form")
                        : ((t as any).showCredentialForm || "Show Credential Form")}
                    </Button>
                  </CollapsibleTrigger>
                  <CollapsibleContent>
                    <div className="space-y-4">
                      <Alert>
                        <Info className="h-4 w-4" />
                        <AlertTitle>{(t as any).importCredentials || "Import Existing Credentials"}</AlertTitle>
                        <AlertDescription>
                          {(t as any).importCredentialsDesc || "If you already obtained your CSID from the ZATCA portal (fatoora.zatca.gov.sa), you can enter the credentials here."}
                        </AlertDescription>
                      </Alert>

                      <Alert>
                        <Info className="h-4 w-4" />
                        <AlertTitle>{isRTL ? "مرجع تنسيق ZATCA" : "ZATCA Format Reference"}</AlertTitle>
                        <AlertDescription>
                          <ul className="list-disc ms-4 mt-1 space-y-1 text-xs">
                            <li>{isRTL ? "المفتاح الخاص: نص PEM يبدأ بـ -----BEGIN ويشمل سطري البداية والنهاية." : "Private Key: PEM text starting with -----BEGIN, including the BEGIN and END lines."}</li>
                            <li>{isRTL ? "CSID (binarySecurityToken): سلسلة base64 طويلة، الصقها كما وردت تمامًا." : "CSID (binarySecurityToken): a long base64 string — paste exactly as returned."}</li>
                            <li>{isRTL ? "السر (secret): سلسلة قصيرة من حقل secret في استجابة ZATCA، دون مسافات." : "Secret: the short string from ZATCA's \"secret\" field — no spaces."}</li>
                            <li>{isRTL ? "انسخ قيم binarySecurityToken و secret من استجابة ZATCA (JSON) دون أي تعديل." : "Copy the binarySecurityToken and secret from ZATCA's JSON response without any edits."}</li>
                          </ul>
                        </AlertDescription>
                      </Alert>

                      <div className="space-y-2">
                        <Label>{t.privateKey || "Private Key"} (PEM format)</Label>
                        <Textarea
                          value={manualCredentials.privateKey}
                          onChange={(e) => setManualCredentials(prev => ({ ...prev, privateKey: e.target.value }))}
                          placeholder={"-----BEGIN EC PRIVATE KEY-----\n...\n-----END EC PRIVATE KEY-----"}
                          className="font-mono text-xs min-h-[100px]"
                          data-testid="textarea-private-key"
                        />
                        {!!manualCredentials.privateKey && (() => {
                          const ok = manualCredentials.privateKey.trim().startsWith("-----BEGIN");
                          return ok
                            ? <p className="text-xs text-green-600">{isRTL ? "التنسيق يبدو صحيحًا" : "Format looks valid"}</p>
                            : <p className="text-xs text-destructive">{isRTL ? "يجب أن يبدأ بـ -----BEGIN ...-----" : "Must start with -----BEGIN ...-----"}</p>;
                        })()}
                        <p className="text-xs text-muted-foreground">
                          {(t as any).privateKeyHint || "The ECDSA private key used for signing invoices (secp256k1)"}
                        </p>
                      </div>

                      <Separator />

                      <div className="grid md:grid-cols-2 gap-4">
                        <div className="space-y-2">
                          <Label>{(t as any).complianceCsidLabel || "Compliance CSID (Binary Security Token)"}</Label>
                          <Textarea
                            value={manualCredentials.complianceCsid}
                            onChange={(e) => setManualCredentials(prev => ({ ...prev, complianceCsid: e.target.value }))}
                            placeholder={(t as any).enterComplianceCsid || "Paste the binarySecurityToken from ZATCA response..."}
                            className="font-mono text-xs min-h-[80px]"
                            data-testid="textarea-compliance-csid"
                          />
                          {!!manualCredentials.complianceCsid && (() => {
                            const ok = /^[A-Za-z0-9+/=\s]+$/.test(manualCredentials.complianceCsid.trim());
                            return ok
                              ? <p className="text-xs text-green-600">{isRTL ? "التنسيق يبدو صحيحًا" : "Format looks valid"}</p>
                              : <p className="text-xs text-destructive">{isRTL ? "يجب أن يحتوي على أحرف base64 فقط (A-Z، a-z، 0-9، +، /، =)." : "Must contain base64 characters only (A-Z, a-z, 0-9, +, /, =)."}</p>;
                          })()}
                          <p className="text-xs text-muted-foreground">{isRTL ? "الصق قيمة binarySecurityToken كما وردت من ZATCA تمامًا دون تعديل." : "Paste the binarySecurityToken value exactly as returned by ZATCA, without editing."}</p>
                        </div>
                        <div className="space-y-2">
                          <Label>{(t as any).complianceCsidSecretLabel || "Compliance CSID Secret"}</Label>
                          <Input
                            type="password"
                            value={manualCredentials.complianceCsidSecret}
                            onChange={(e) => setManualCredentials(prev => ({ ...prev, complianceCsidSecret: e.target.value }))}
                            placeholder={(t as any).enterSecret || "Secret from ZATCA response"}
                            className="font-mono"
                            data-testid="input-compliance-csid-secret"
                          />
                          <p className="text-xs text-muted-foreground">{isRTL ? "الصق قيمة secret كما وردت من ZATCA دون مسافات." : "Paste the secret value exactly as returned by ZATCA, no spaces."}</p>
                        </div>
                      </div>

                      <Separator />

                      <div className="grid md:grid-cols-2 gap-4">
                        <div className="space-y-2">
                          <Label>{(t as any).productionCsidLabel || "Production CSID (Binary Security Token)"}</Label>
                          <Textarea
                            value={manualCredentials.productionCsid}
                            onChange={(e) => setManualCredentials(prev => ({ ...prev, productionCsid: e.target.value }))}
                            placeholder={(t as any).enterProductionCsid || "Paste the production binarySecurityToken..."}
                            className="font-mono text-xs min-h-[80px]"
                            data-testid="textarea-production-csid"
                          />
                          {!!manualCredentials.productionCsid && (() => {
                            const ok = /^[A-Za-z0-9+/=\s]+$/.test(manualCredentials.productionCsid.trim());
                            return ok
                              ? <p className="text-xs text-green-600">{isRTL ? "التنسيق يبدو صحيحًا" : "Format looks valid"}</p>
                              : <p className="text-xs text-destructive">{isRTL ? "يجب أن يحتوي على أحرف base64 فقط (A-Z، a-z، 0-9، +، /، =)." : "Must contain base64 characters only (A-Z, a-z, 0-9, +, /, =)."}</p>;
                          })()}
                          <p className="text-xs text-muted-foreground">{isRTL ? "الصق قيمة binarySecurityToken للإنتاج كما وردت من ZATCA تمامًا دون تعديل." : "Paste the production binarySecurityToken value exactly as returned by ZATCA, without editing."}</p>
                        </div>
                        <div className="space-y-2">
                          <Label>{(t as any).productionCsidSecretLabel || "Production CSID Secret"}</Label>
                          <Input
                            type="password"
                            value={manualCredentials.productionCsidSecret}
                            onChange={(e) => setManualCredentials(prev => ({ ...prev, productionCsidSecret: e.target.value }))}
                            placeholder={(t as any).enterSecret || "Secret from ZATCA response"}
                            className="font-mono"
                            data-testid="input-production-csid-secret"
                          />
                          <p className="text-xs text-muted-foreground">{isRTL ? "الصق قيمة secret للإنتاج كما وردت من ZATCA دون مسافات." : "Paste the production secret value exactly as returned by ZATCA, no spaces."}</p>
                        </div>
                      </div>

                      <Alert className="bg-yellow-50 border-yellow-200">
                        <AlertCircle className="h-4 w-4 text-yellow-600" />
                        <AlertTitle className="text-yellow-800">{t.securityWarning || "Security Warning"}</AlertTitle>
                        <AlertDescription className="text-yellow-700">
                          {(t as any).credentialSecurityWarning || "These credentials will be securely stored and used for signing and submitting invoices to ZATCA. Never share them with unauthorized parties."}
                        </AlertDescription>
                      </Alert>

                      <div className="flex justify-end gap-4">
                        <Button
                          variant="outline"
                          onClick={() => {
                            setManualCredentials({
                              privateKey: "",
                              complianceCsid: "",
                              complianceCsidSecret: "",
                              productionCsid: "",
                              productionCsidSecret: "",
                            });
                          }}
                          data-testid="button-clear-credentials"
                        >
                          {t.clear || "Clear"}
                        </Button>
                        <Button
                          onClick={() => saveManualCredentialsMutation.mutate()}
                          disabled={
                            saveManualCredentialsMutation.isPending ||
                            (!manualCredentials.complianceCsid && !manualCredentials.productionCsid)
                          }
                          data-testid="button-save-credentials"
                        >
                          {saveManualCredentialsMutation.isPending && <Loader2 className="w-4 h-4 mr-2 animate-spin" />}
                          {(t as any).saveCredentials || "Save Credentials"}
                        </Button>
                      </div>
                    </div>
                  </CollapsibleContent>
                </Collapsible>
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        <TabsContent value="invoices">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center justify-between">
                <span>{t.invoiceSubmissionStatus || "Invoice Submission Status"}</span>
                <Button
                  variant="outline"
                  onClick={() => retryPendingMutation.mutate()}
                  disabled={retryPendingMutation.isPending || pendingCount === 0}
                  data-testid="button-retry-pending"
                >
                  {retryPendingMutation.isPending && <Loader2 className="w-4 h-4 mr-2 animate-spin" />}
                  <RefreshCw className="w-4 h-4 mr-2" />
                  {t.retryPending || "Retry Pending"} ({pendingCount})
                </Button>
              </CardTitle>
              <CardDescription>{t.invoiceSubmissionDescription || "Track the status of invoices submitted to ZATCA"}</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-3 gap-4 mb-6">
                <Card>
                  <CardContent className="pt-6">
                    <div className="text-2xl font-bold text-yellow-500" data-testid="text-pending-count">{pendingCount}</div>
                    <p className="text-sm text-muted-foreground">{t.pending || "Pending"}<InfoTip>{isRTL ? "فواتير في انتظار الإرسال إلى ZATCA." : "Invoices waiting to be submitted to ZATCA."}</InfoTip></p>
                  </CardContent>
                </Card>
                <Card>
                  <CardContent className="pt-6">
                    <div className="text-2xl font-bold text-green-500" data-testid="text-cleared-count">{clearedCount}</div>
                    <p className="text-sm text-muted-foreground">{t.cleared || "Cleared/Reported"}<InfoTip>{isRTL ? "فواتير قبلتها ZATCA بنجاح." : "Invoices successfully accepted by ZATCA."}</InfoTip></p>
                  </CardContent>
                </Card>
                <Card>
                  <CardContent className="pt-6">
                    <div className="text-2xl font-bold text-red-500" data-testid="text-failed-count">{failedCount}</div>
                    <p className="text-sm text-muted-foreground">{t.failed || "Failed/Rejected"}<InfoTip>{isRTL ? "فواتير رفضتها ZATCA أو فشل إرسالها." : "Invoices rejected by ZATCA or failed to submit."}</InfoTip></p>
                  </CardContent>
                </Card>
              </div>

              {invoiceStatuses && invoiceStatuses.length > 0 ? (
                <div className="space-y-2">
                  {invoiceStatuses.slice(0, 20).map((invoice) => (
                    <div 
                      key={invoice.id} 
                      className="flex items-center justify-between p-3 border rounded-lg"
                      data-testid={`row-invoice-${invoice.id}`}
                    >
                      <div>
                        <span className="font-medium">{invoice.invoiceNumber}</span>
                        {invoice.submittedAt && (
                          <span className="text-sm text-muted-foreground ml-2">
                            {new Date(invoice.submittedAt).toLocaleString()}
                          </span>
                        )}
                      </div>
                      <div className="flex items-center gap-4">
                        {getInvoiceStatusBadge(invoice.status)}
                        {invoice.errorMessage && (
                          <span className="text-sm text-red-500 max-w-xs truncate" title={invoice.errorMessage}>
                            {invoice.errorMessage}
                          </span>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="text-center py-8 text-muted-foreground">
                  <FileText className="h-12 w-12 mx-auto mb-4 opacity-50" />
                  <p>{t.noInvoicesYet || "No invoices submitted to ZATCA yet"}</p>
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="guide">
          <ZatcaIntegrationGuide />
        </TabsContent>
      </Tabs>
        </>
      )}
    </div>
    </TooltipProvider>
  );
}
