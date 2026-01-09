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
import { Loader2, Shield, AlertCircle, CheckCircle2, Settings, KeyRound, FileText, RefreshCw, Clock, XCircle, Info, Eye, EyeOff, Copy, Download, Building2, ChevronDown, Upload } from "lucide-react";

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
  onboardingStatus: string;
  lastHashedInvoice: string | null;
  invoiceCounter: number;
}

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
  const { t, isRTL } = useLanguage();
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
      const res = await fetch(`/api/zatca/settings?restaurantId=${selectedRestaurantId}`, {
        credentials: "include"
      });
      if (!res.ok) {
        if (res.status === 403) throw new Error("Access denied. IT account required.");
        throw new Error("Failed to fetch settings");
      }
      return res.json();
    },
    enabled: !authLoading && !!isITAccount && !!selectedRestaurantId,
    retry: false,
  });

  const { data: invoiceStatuses } = useQuery<InvoiceZatcaStatus[]>({
    queryKey: ["/api/zatca/invoices", selectedRestaurantId],
    queryFn: async () => {
      if (!selectedRestaurantId) return [];
      const res = await fetch(`/api/zatca/invoices?restaurantId=${selectedRestaurantId}`, {
        credentials: "include"
      });
      if (!res.ok) throw new Error("Failed to fetch invoices");
      return res.json();
    },
    enabled: !authLoading && !!isITAccount && !!selectedRestaurantId,
    retry: false,
  });

  useEffect(() => {
    if (settings) {
      setFormData(settings);
    } else {
      // Reset form when restaurant changes
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
      toast({
        title: t.error || "Error",
        description: error.message,
        variant: "destructive",
      });
    },
  });

  const onboardMutation = useMutation({
    mutationFn: async () => {
      return await apiRequest("POST", "/api/zatca/onboard", { otp, restaurantId: selectedRestaurantId });
    },
    onSuccess: (data: any) => {
      queryClient.invalidateQueries({ queryKey: ["/api/zatca/settings", selectedRestaurantId] });
      if (data.complianceRequestId) {
        setComplianceRequestId(data.complianceRequestId);
      }
      toast({
        title: t.success || "Success",
        description: t.onboardingSuccess || "Successfully onboarded to ZATCA. Compliance CSID received.",
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

  const productionCsidMutation = useMutation({
    mutationFn: async () => {
      return await apiRequest("POST", "/api/zatca/production-csid", { complianceRequestId, restaurantId: selectedRestaurantId });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/zatca/settings", selectedRestaurantId] });
      toast({
        title: t.success || "Success",
        description: t.productionCsidSuccess || "Production CSID received. ZATCA integration is now active.",
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

  const retryPendingMutation = useMutation({
    mutationFn: async () => {
      return await apiRequest("POST", "/api/zatca/retry-pending", { restaurantId: selectedRestaurantId });
    },
    onSuccess: (data: any) => {
      queryClient.invalidateQueries({ queryKey: ["/api/zatca/invoices", selectedRestaurantId] });
      toast({
        title: t.success || "Success",
        description: `Processed ${data.processed} invoices. ${data.successful} successful, ${data.failed} failed.`,
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

  const saveManualCredentialsMutation = useMutation({
    mutationFn: async () => {
      const credentialData: Record<string, any> = { restaurantId: selectedRestaurantId };
      if (manualCredentials.privateKey) credentialData.privateKey = manualCredentials.privateKey;
      if (manualCredentials.complianceCsid) credentialData.complianceCsid = manualCredentials.complianceCsid;
      if (manualCredentials.complianceCsidSecret) credentialData.complianceCsidSecret = manualCredentials.complianceCsidSecret;
      if (manualCredentials.productionCsid) credentialData.productionCsid = manualCredentials.productionCsid;
      if (manualCredentials.productionCsidSecret) credentialData.productionCsidSecret = manualCredentials.productionCsidSecret;
      
      if (manualCredentials.productionCsid && manualCredentials.productionCsidSecret) {
        credentialData.onboardingStatus = "production_ready";
        credentialData.isEnabled = true;
      } else if (manualCredentials.complianceCsid && manualCredentials.complianceCsidSecret) {
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
    saveMutation.mutate(formData);
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
        <Alert>
          <Info className="h-4 w-4" />
          <AlertTitle>{t.noRestaurantSelected || "No Restaurant Selected"}</AlertTitle>
          <AlertDescription>
            {t.pleaseSelectRestaurant || "Please select a restaurant from the dropdown above to manage their ZATCA settings."}
          </AlertDescription>
        </Alert>
      ) : isLoading ? (
        <div className="flex items-center justify-center min-h-[200px]">
          <Loader2 className="h-6 w-6 animate-spin" />
        </div>
      ) : (
        <>
          <div className="flex items-center gap-4 mb-6">
            <span className="text-sm font-medium">{t.onboardingStatus || "Onboarding Status"}:</span>
            {getStatusBadge(settings?.onboardingStatus || "not_started")}
          </div>

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
                    <Label htmlFor="csrCommonName">{t.commonName || "Common Name"}</Label>
                    <Input
                      id="csrCommonName"
                      value={formData.csrCommonName || ""}
                      onChange={(e) => handleChange("csrCommonName", e.target.value)}
                      placeholder={t.enterCommonName || "e.g., EGS1-TST-886431145-399900000000001"}
                      data-testid="input-common-name"
                    />
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
                    <Label htmlFor="csrOrganizationIdentifier">{t.vatNumber || "VAT Number"}</Label>
                    <Input
                      id="csrOrganizationIdentifier"
                      value={formData.csrOrganizationIdentifier || ""}
                      onChange={(e) => handleChange("csrOrganizationIdentifier", e.target.value)}
                      placeholder={t.enterVatNumber || "e.g., 300000000000003"}
                      data-testid="input-vat-number"
                    />
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="csrOrganizationUnitName">{t.branchName || "Branch/Unit Name"}</Label>
                    <Input
                      id="csrOrganizationUnitName"
                      value={formData.csrOrganizationUnitName || ""}
                      onChange={(e) => handleChange("csrOrganizationUnitName", e.target.value)}
                      placeholder={t.enterBranchName || "Main Branch"}
                      data-testid="input-branch-name"
                    />
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="csrSerialNumber">{t.deviceSerialNumber || "Device Serial Number"}</Label>
                    <Input
                      id="csrSerialNumber"
                      value={formData.csrSerialNumber || ""}
                      onChange={(e) => handleChange("csrSerialNumber", e.target.value)}
                      placeholder={t.enterDeviceSerial || "e.g., 1-TST|2-TST|3-ed22f1d8-e6a2-1118-9b58-d9a8195e05"}
                      data-testid="input-device-serial"
                    />
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="crNumber">{t.commercialRegistration || "Commercial Registration"}</Label>
                    <Input
                      id="crNumber"
                      value={formData.crNumber || ""}
                      onChange={(e) => handleChange("crNumber", e.target.value)}
                      placeholder={t.enterCrNumber || "e.g., 3100000000"}
                      data-testid="input-cr-number"
                    />
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
                      <Label htmlFor="postalZone">{t.postalCode || "Postal Code"}</Label>
                      <Input
                        id="postalZone"
                        value={formData.postalZone || ""}
                        onChange={(e) => handleChange("postalZone", e.target.value)}
                        placeholder={t.enterPostalCode || "12345"}
                        data-testid="input-postal-code"
                      />
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
                      onChange={(e) => setOtp(e.target.value)}
                      placeholder="123456"
                      maxLength={6}
                      data-testid="input-otp"
                    />
                  </div>
                  <Button
                    onClick={() => onboardMutation.mutate()}
                    disabled={onboardMutation.isPending || !settings?.csr || !otp}
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
                        <Button 
                          variant="outline" 
                          size="icon"
                          onClick={() => setShowComplianceCsid(!showComplianceCsid)}
                          data-testid="button-toggle-compliance-csid"
                        >
                          {showComplianceCsid ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                        </Button>
                        <Button 
                          variant="outline" 
                          size="icon"
                          onClick={() => copyToClipboard(settings.complianceCsid || "")}
                          data-testid="button-copy-compliance-csid"
                        >
                          <Copy className="h-4 w-4" />
                        </Button>
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
                      onChange={(e) => setComplianceRequestId(e.target.value)}
                      placeholder={t.enterComplianceRequestId || "From step 2"}
                      data-testid="input-compliance-request-id"
                    />
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
                        <Button 
                          variant="outline" 
                          size="icon"
                          onClick={() => setShowProductionCsid(!showProductionCsid)}
                          data-testid="button-toggle-production-csid"
                        >
                          {showProductionCsid ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                        </Button>
                        <Button 
                          variant="outline" 
                          size="icon"
                          onClick={() => copyToClipboard(settings.productionCsid || "")}
                          data-testid="button-copy-production-csid"
                        >
                          <Copy className="h-4 w-4" />
                        </Button>
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
                          <Button 
                            variant="outline" 
                            size="icon"
                            onClick={() => setShowPrivateKey(!showPrivateKey)}
                            data-testid="button-toggle-private-key"
                          >
                            {showPrivateKey ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                          </Button>
                          <Button 
                            variant="outline" 
                            size="icon"
                            onClick={downloadPrivateKey}
                            data-testid="button-download-private-key"
                          >
                            <Download className="h-4 w-4" />
                          </Button>
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

                      <div className="space-y-2">
                        <Label>{t.privateKey || "Private Key"} (PEM format)</Label>
                        <Textarea
                          value={manualCredentials.privateKey}
                          onChange={(e) => setManualCredentials(prev => ({ ...prev, privateKey: e.target.value }))}
                          placeholder={"-----BEGIN EC PRIVATE KEY-----\n...\n-----END EC PRIVATE KEY-----"}
                          className="font-mono text-xs min-h-[100px]"
                          data-testid="textarea-private-key"
                        />
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
                    <p className="text-sm text-muted-foreground">{t.pending || "Pending"}</p>
                  </CardContent>
                </Card>
                <Card>
                  <CardContent className="pt-6">
                    <div className="text-2xl font-bold text-green-500" data-testid="text-cleared-count">{clearedCount}</div>
                    <p className="text-sm text-muted-foreground">{t.cleared || "Cleared/Reported"}</p>
                  </CardContent>
                </Card>
                <Card>
                  <CardContent className="pt-6">
                    <div className="text-2xl font-bold text-red-500" data-testid="text-failed-count">{failedCount}</div>
                    <p className="text-sm text-muted-foreground">{t.failed || "Failed/Rejected"}</p>
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
      </Tabs>
        </>
      )}
    </div>
  );
}
