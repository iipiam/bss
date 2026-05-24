import { useState } from "react";
import { useQuery, useMutation } from "@tanstack/react-query";
import { apiRequest, queryClient } from "@/lib/queryClient";
import { Button } from "@/components/ui/button";
import { Tooltip, TooltipContent, TooltipTrigger, TooltipProvider } from "@/components/ui/tooltip";
import { InfoTip } from "@/components/ui/info-tip";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Textarea } from "@/components/ui/textarea";
import { useToast } from "@/hooks/use-toast";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { Plus, Edit, Trash2, AlertCircle, Calendar, Building, FileText, Clock, Bell, Shield, Upload, Download, X, File } from "lucide-react";
import { format, differenceInDays, addDays } from "date-fns";
import { useLanguage } from "@/contexts/LanguageContext";
import { useAuth } from "@/lib/auth";
import type { License } from "@shared/schema";

// License types for both restaurants and factories
const licenseTypes = {
  trade: { label: "Trade License", icon: Building },
  health: { label: "Health Certificate", icon: Shield },
  fire_safety: { label: "Fire Safety Certificate", icon: Shield },
  municipal: { label: "Municipal License", icon: Building },
  vat: { label: "VAT Registration", icon: FileText },
  food_safety: { label: "Food Safety Certificate", icon: Shield },
  environmental: { label: "Environmental Permit", icon: Shield },
  labor: { label: "Labor License", icon: FileText },
  custom: { label: "Other License", icon: FileText },
};

type LicenseFormData = {
  licenseType: "trade" | "health" | "fire_safety" | "municipal" | "vat" | "food_safety" | "environmental" | "labor" | "custom";
  licenseNumber: string;
  licenseName: string;
  issuingAuthority: string;
  issueDate: string;
  expiryDate: string;
  renewalReminderDays: number;
  fee?: string;
  documentUrl?: string;
  notes?: string;
};

export default function Licenses() {
  const { t, isRTL } = useLanguage();
  const { toast } = useToast();
  const { restaurant } = useAuth();
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [editingLicense, setEditingLicense] = useState<License | null>(null);
  const [deletingLicense, setDeletingLicense] = useState<License | null>(null);
  const [filterType, setFilterType] = useState<string>("all");
  const [searchQuery, setSearchQuery] = useState("");
  const [isUploading, setIsUploading] = useState(false);
  const [uploadedFileName, setUploadedFileName] = useState<string>("");

  const businessType = restaurant?.businessType || 'restaurant';

  // Form schema for creating/editing licenses
  const licenseFormSchema = z.object({
    licenseType: z.enum(["trade", "health", "fire_safety", "municipal", "vat", "food_safety", "environmental", "labor", "custom"]),
    licenseNumber: z.string().min(1, t.licenseNumberRequired),
    licenseName: z.string().min(1, t.licenseNameRequired),
    issuingAuthority: z.string().min(1, t.issuingAuthorityRequired),
    issueDate: z.string().min(1, t.issueDateRequired),
    expiryDate: z.string().min(1, t.expiryDateRequired),
    renewalReminderDays: z.coerce.number().min(1).max(365).default(30),
    fee: z.string().optional(),
    documentUrl: z.string().optional(),
    notes: z.string().optional(),
  });

  // Fetch licenses
  const { data: licenses = [], isLoading } = useQuery<License[]>({
    queryKey: ["/api/licenses"],
  });

  // Fetch expiring licenses (30 days ahead)
  const { data: expiringLicenses = [] } = useQuery({
    queryKey: ["/api/licenses/expiring", 30],
    queryFn: async () => {
      const res = await fetch("/api/licenses/expiring?daysAhead=30");
      if (!res.ok) throw new Error("Failed to fetch expiring licenses");
      return res.json();
    },
  });

  // Form setup
  const form = useForm<LicenseFormData>({
    resolver: zodResolver(licenseFormSchema),
    defaultValues: {
      licenseType: "trade",
      licenseNumber: "",
      licenseName: "",
      issuingAuthority: "",
      issueDate: "",
      expiryDate: "",
      renewalReminderDays: 30,
      fee: "",
      documentUrl: "",
      notes: "",
    },
  });

  // Create license mutation
  const createMutation = useMutation({
    mutationFn: async (data: LicenseFormData) => {
      // Convert empty fee string to undefined to avoid database errors
      const payload = {
        ...data,
        fee: data.fee && data.fee.trim() !== "" ? data.fee : undefined,
      };
      const res = await apiRequest("POST", "/api/licenses", payload);
      return res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/licenses"] });
      queryClient.invalidateQueries({ queryKey: ["/api/licenses/expiring"] });
      toast({
        title: t.success,
        description: "License created successfully",
      });
      setIsDialogOpen(false);
      form.reset();
    },
    onError: (error: any) => {
      toast({
        title: t.error,
        description: error.message || "Failed to create license",
        variant: "destructive",
      });
    },
  });

  // Update license mutation
  const updateMutation = useMutation({
    mutationFn: async ({ id, data }: { id: string; data: Partial<LicenseFormData> }) => {
      // Convert empty fee string to undefined to avoid database errors
      const payload = {
        ...data,
        fee: data.fee && data.fee.trim() !== "" ? data.fee : undefined,
      };
      const res = await apiRequest("PATCH", `/api/licenses/${id}`, payload);
      return res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/licenses"] });
      queryClient.invalidateQueries({ queryKey: ["/api/licenses/expiring"] });
      toast({
        title: t.success,
        description: "License updated successfully",
      });
      setIsDialogOpen(false);
      setEditingLicense(null);
      form.reset();
    },
    onError: (error: any) => {
      toast({
        title: t.error,
        description: error.message || "Failed to update license",
        variant: "destructive",
      });
    },
  });

  // Delete license mutation
  const deleteMutation = useMutation({
    mutationFn: async (id: string) => {
      const res = await apiRequest("DELETE", `/api/licenses/${id}`);
      if (!res.ok) throw new Error("Failed to delete license");
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/licenses"] });
      queryClient.invalidateQueries({ queryKey: ["/api/licenses/expiring"] });
      toast({
        title: t.success,
        description: "License deleted successfully",
      });
      setDeletingLicense(null);
    },
    onError: (error: any) => {
      toast({
        title: t.error,
        description: error.message || "Failed to delete license",
        variant: "destructive",
      });
    },
  });

  const handleSubmit = (data: LicenseFormData) => {
    if (editingLicense) {
      updateMutation.mutate({ id: editingLicense.id, data });
    } else {
      createMutation.mutate(data);
    }
  };

  // Handle file upload
  const handleFileUpload = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    // Validate file type
    const allowedTypes = ['image/jpeg', 'image/jpg', 'image/png', 'image/gif', 'image/webp', 'application/pdf'];
    if (!allowedTypes.includes(file.type)) {
      toast({
        title: t.error,
        description: t.licenseFileTypeError || "Only image files (JPEG, PNG, GIF, WebP) and PDF documents are allowed",
        variant: "destructive",
      });
      return;
    }

    // Validate file size (10MB)
    if (file.size > 10 * 1024 * 1024) {
      toast({
        title: t.error,
        description: t.licenseFileSizeError || "File size must be less than 10MB",
        variant: "destructive",
      });
      return;
    }

    setIsUploading(true);
    try {
      const formData = new FormData();
      formData.append('file', file);

      const response = await fetch('/api/licenses/upload-file', {
        method: 'POST',
        body: formData,
        credentials: 'include',
      });

      if (!response.ok) {
        throw new Error('Upload failed');
      }

      const data = await response.json();
      form.setValue('documentUrl', data.fileUrl);
      setUploadedFileName(data.originalName || file.name);
      toast({
        title: t.success,
        description: t.licenseFileUploaded || "File uploaded successfully",
      });
    } catch (error) {
      console.error('File upload error:', error);
      toast({
        title: t.error,
        description: t.licenseFileUploadFailed || "Failed to upload file",
        variant: "destructive",
      });
    } finally {
      setIsUploading(false);
    }
  };

  // Remove uploaded file
  const handleRemoveFile = () => {
    form.setValue('documentUrl', '');
    setUploadedFileName('');
  };

  const handleEdit = (license: License) => {
    setEditingLicense(license);
    // Extract filename from URL if exists
    if (license.documentUrl) {
      const filename = license.documentUrl.split('/').pop() || '';
      setUploadedFileName(filename);
    } else {
      setUploadedFileName('');
    }
    form.reset({
      licenseType: license.licenseType as any,
      licenseNumber: license.licenseNumber,
      licenseName: license.licenseName,
      issuingAuthority: license.issuingAuthority,
      issueDate: format(new Date(license.issueDate), "yyyy-MM-dd"),
      expiryDate: format(new Date(license.expiryDate), "yyyy-MM-dd"),
      renewalReminderDays: license.renewalReminderDays || 30,
      fee: license.fee || "",
      documentUrl: license.documentUrl || "",
      notes: license.notes || "",
    });
    setIsDialogOpen(true);
  };

  const handleDelete = (license: License) => {
    setDeletingLicense(license);
  };

  const confirmDelete = () => {
    if (deletingLicense) {
      deleteMutation.mutate(deletingLicense.id);
    }
  };

  // Filter and search licenses
  const filteredLicenses = licenses.filter((license: License) => {
    const matchesType = filterType === "all" || license.licenseType === filterType;
    const matchesSearch = searchQuery === "" || 
      license.licenseName.toLowerCase().includes(searchQuery.toLowerCase()) ||
      license.licenseNumber.toLowerCase().includes(searchQuery.toLowerCase()) ||
      license.issuingAuthority.toLowerCase().includes(searchQuery.toLowerCase());
    return matchesType && matchesSearch;
  });

  // Get license status and badge variant
  const getLicenseStatus = (expiryDate: string | Date) => {
    const expiry = new Date(expiryDate);
    const today = new Date();
    const daysUntilExpiry = differenceInDays(expiry, today);

    if (daysUntilExpiry < 0) {
      return { status: "Expired", variant: "destructive" as const, daysUntilExpiry };
    } else if (daysUntilExpiry <= 30) {
      return { status: "Expiring Soon", variant: "destructive" as const, daysUntilExpiry };
    } else if (daysUntilExpiry <= 90) {
      return { status: "Due for Renewal", variant: "secondary" as const, daysUntilExpiry };
    } else {
      return { status: "Active", variant: "default" as const, daysUntilExpiry };
    }
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-96">
        <div className="text-center">Loading licenses...</div>
      </div>
    );
  }

  return (
    <TooltipProvider delayDuration={150}>
    <div className="container mx-auto p-6 max-w-7xl">
      {/* Header */}
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-3xl font-bold">{t.licenses || "Licenses & Permits"}</h1>
          <p className="text-muted-foreground mt-1">
            Manage your {businessType === 'factory' ? 'factory' : 'restaurant'} licenses and regulatory documents
          </p>
        </div>
        <Dialog open={isDialogOpen} onOpenChange={(open) => {
          setIsDialogOpen(open);
          if (!open) {
            setEditingLicense(null);
            setUploadedFileName('');
            form.reset();
          }
        }}>
          <DialogTrigger asChild>
            <Button className="flex items-center gap-2" data-testid="button-add-license">
              <Plus className="h-4 w-4" />
              Add License
            </Button>
          </DialogTrigger>
          <DialogContent className="max-w-2xl">
            <DialogHeader>
              <DialogTitle>{editingLicense ? "Edit License" : "Add New License"}</DialogTitle>
              <DialogDescription>
                {editingLicense ? "Update the license information below" : "Enter the details of your new license or permit"}
              </DialogDescription>
            </DialogHeader>
            <Form {...form}>
              <form onSubmit={form.handleSubmit(handleSubmit)} className="space-y-4">
                <div className="grid grid-cols-2 gap-4">
                  <FormField
                    control={form.control}
                    name="licenseType"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>License Type<InfoTip>{isRTL ? "نوع الرخصة أو الشهادة." : "Category of license or certificate."}</InfoTip></FormLabel>
                        <Select onValueChange={field.onChange} defaultValue={field.value}>
                          <FormControl>
                            <SelectTrigger data-testid="select-license-type">
                              <SelectValue placeholder="Select type" />
                            </SelectTrigger>
                          </FormControl>
                          <SelectContent>
                            {Object.entries(licenseTypes).map(([value, { label }]) => (
                              <SelectItem key={value} value={value} data-testid={`option-license-type-${value}`}>
                                {label}
                              </SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                  <FormField
                    control={form.control}
                    name="licenseNumber"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>License Number<InfoTip>{isRTL ? "الرقم الرسمي الصادر من الجهة المختصة." : "Official number issued by the authority."}</InfoTip></FormLabel>
                        <FormControl>
                          <Input {...field} placeholder="Enter license number" data-testid="input-license-number" />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                </div>

                <FormField
                  control={form.control}
                  name="licenseName"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>License Name</FormLabel>
                      <FormControl>
                        <Input {...field} placeholder="Enter license name" data-testid="input-license-name" />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={form.control}
                  name="issuingAuthority"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Issuing Authority<InfoTip>{isRTL ? "الجهة الحكومية التي أصدرت الرخصة." : "Government body that issued this license."}</InfoTip></FormLabel>
                      <FormControl>
                        <Input {...field} placeholder="Enter issuing authority" data-testid="input-issuing-authority" />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <div className="grid grid-cols-2 gap-4">
                  <FormField
                    control={form.control}
                    name="issueDate"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Issue Date<InfoTip>{isRTL ? "تاريخ إصدار الرخصة." : "Date the license was issued."}</InfoTip></FormLabel>
                        <FormControl>
                          <Input {...field} type="date" data-testid="input-issue-date" />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                  <FormField
                    control={form.control}
                    name="expiryDate"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Expiry Date<InfoTip>{isRTL ? "تاريخ انتهاء صلاحية الرخصة." : "Date the license expires."}</InfoTip></FormLabel>
                        <FormControl>
                          <Input {...field} type="date" data-testid="input-expiry-date" />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <FormField
                    control={form.control}
                    name="renewalReminderDays"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Renewal Reminder (days before expiry)<InfoTip>{isRTL ? "عدد الأيام قبل انتهاء الصلاحية لإرسال تنبيه." : "Days before expiry to send a renewal alert."}</InfoTip></FormLabel>
                        <FormControl>
                          <Input 
                            {...field} 
                            type="number" 
                            min="1" 
                            max="365"
                            onChange={(e) => field.onChange(parseInt(e.target.value) || 30)}
                            data-testid="input-renewal-reminder" 
                          />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                  <FormField
                    control={form.control}
                    name="fee"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>{t.licenseFee || "License Fee"} ({t.optional || "optional"})<InfoTip>{isRTL ? "تكلفة إصدار أو تجديد الرخصة." : "Cost paid to issue or renew the license."}</InfoTip></FormLabel>
                        <FormControl>
                          <Input 
                            {...field} 
                            type="number" 
                            step="0.01"
                            min="0"
                            placeholder="0.00"
                            data-testid="input-license-fee" 
                          />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                </div>

                <FormField
                  control={form.control}
                  name="documentUrl"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>{t.licenseDocument || "License Document"} ({t.optional || "optional"})<InfoTip>{isRTL ? "ارفع نسخة من الرخصة (PDF أو صورة)." : "Upload a scan of the license (PDF or image)."}</InfoTip></FormLabel>
                      <FormControl>
                        <div className="space-y-3">
                          {/* Hidden input for form value */}
                          <input type="hidden" {...field} />
                          
                          {/* Show uploaded file or upload button */}
                          {field.value ? (
                            <div className="flex items-center gap-2 p-3 border rounded-md bg-muted/50">
                              <File className="h-5 w-5 text-muted-foreground flex-shrink-0" />
                              <span className="text-sm flex-1 truncate" title={uploadedFileName || field.value}>
                                {uploadedFileName || field.value.split('/').pop()}
                              </span>
                              <div className="flex gap-1 flex-shrink-0">
                                <Tooltip>
                                  <TooltipTrigger asChild>
                                    <Button
                                      type="button"
                                      variant="ghost"
                                      size="icon"
                                      aria-label={t.viewDocument || "View document"}
                                      asChild
                                      data-testid="button-view-document"
                                    >
                                      <a href={field.value} target="_blank" rel="noopener noreferrer" title={t.viewDocument || "View document"}>
                                        <Download className="h-4 w-4" />
                                      </a>
                                    </Button>
                                  </TooltipTrigger>
                                  <TooltipContent>{t.viewDocument || "View document"}</TooltipContent>
                                </Tooltip>
                                <Tooltip>
                                  <TooltipTrigger asChild>
                                    <Button
                                      type="button"
                                      variant="ghost"
                                      size="icon"
                                      aria-label={t.removeFile || "Remove file"}
                                      onClick={handleRemoveFile}
                                      title={t.removeFile || "Remove file"}
                                      data-testid="button-remove-file"
                                    >
                                      <X className="h-4 w-4" />
                                    </Button>
                                  </TooltipTrigger>
                                  <TooltipContent>{t.removeFile || "Remove file"}</TooltipContent>
                                </Tooltip>
                              </div>
                            </div>
                          ) : (
                            <div className="flex items-center justify-center w-full">
                              <label
                                htmlFor="license-file-upload"
                                className="flex flex-col items-center justify-center w-full h-24 border-2 border-dashed rounded-lg cursor-pointer bg-muted/30 hover:bg-muted/50 transition-colors"
                              >
                                <div className="flex flex-col items-center justify-center pt-2 pb-2">
                                  {isUploading ? (
                                    <div className="flex items-center gap-2 text-muted-foreground">
                                      <div className="h-5 w-5 border-2 border-current border-t-transparent rounded-full animate-spin" />
                                      <span className="text-sm">{t.uploading || "Uploading..."}</span>
                                    </div>
                                  ) : (
                                    <>
                                      <Upload className="h-6 w-6 mb-2 text-muted-foreground" />
                                      <p className="text-sm text-muted-foreground">
                                        {t.clickToUpload || "Click to upload license file"}
                                      </p>
                                      <p className="text-xs text-muted-foreground mt-1">
                                        PDF, JPEG, PNG, GIF, WebP ({t.maxSize || "max"} 10MB)
                                      </p>
                                    </>
                                  )}
                                </div>
                                <input
                                  id="license-file-upload"
                                  type="file"
                                  className="hidden"
                                  accept=".pdf,.jpg,.jpeg,.png,.gif,.webp,image/jpeg,image/png,image/gif,image/webp,application/pdf"
                                  onChange={handleFileUpload}
                                  disabled={isUploading}
                                  data-testid="input-license-file"
                                />
                              </label>
                            </div>
                          )}
                        </div>
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={form.control}
                  name="notes"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Notes (optional)</FormLabel>
                      <FormControl>
                        <Textarea {...field} placeholder="Additional notes" rows={3} data-testid="input-notes" />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <DialogFooter>
                  <Button type="button" variant="outline" onClick={() => setIsDialogOpen(false)}>
                    Cancel
                  </Button>
                  <Button type="submit" disabled={createMutation.isPending || updateMutation.isPending}>
                    {editingLicense ? "Update" : "Create"} License
                  </Button>
                </DialogFooter>
              </form>
            </Form>
          </DialogContent>
        </Dialog>
      </div>

      {/* Expiring Licenses Alert */}
      {expiringLicenses.length > 0 && (
        <Alert className="mb-6 border-warning">
          <AlertCircle className="h-4 w-4" />
          <AlertDescription>
            <strong>{expiringLicenses.length} license(s) expiring soon!</strong>
            <div className="mt-2 space-y-1">
              {expiringLicenses.slice(0, 3).map((license: License) => {
                const status = getLicenseStatus(license.expiryDate);
                return (
                  <div key={license.id} className="text-sm">
                    • {license.licenseName} expires in {status.daysUntilExpiry} days
                  </div>
                );
              })}
              {expiringLicenses.length > 3 && (
                <div className="text-sm text-muted-foreground">
                  ...and {expiringLicenses.length - 3} more
                </div>
              )}
            </div>
          </AlertDescription>
        </Alert>
      )}

      {/* Filters */}
      <div className="flex gap-4 mb-6">
        <div className="flex-1">
          <Input
            placeholder="Search licenses..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="max-w-sm"
            data-testid="input-search-licenses"
          />
        </div>
        <Select value={filterType} onValueChange={setFilterType}>
          <SelectTrigger className="w-48" data-testid="select-filter-type">
            <SelectValue placeholder="Filter by type" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all" data-testid="option-filter-all">All Types</SelectItem>
            {Object.entries(licenseTypes).map(([value, { label }]) => (
              <SelectItem key={value} value={value} data-testid={`option-filter-${value}`}>
                {label}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      {/* Licenses Grid */}
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
        {filteredLicenses.map((license: License) => {
          const status = getLicenseStatus(license.expiryDate);
          const TypeIcon = licenseTypes[license.licenseType as keyof typeof licenseTypes]?.icon || FileText;
          
          return (
            <Card key={license.id} className="hover-elevate" data-testid={`card-license-${license.id}`}>
              <CardHeader className="pb-3">
                <div className="flex items-start justify-between">
                  <div className="flex items-center gap-2">
                    <TypeIcon className="h-5 w-5 text-muted-foreground" />
                    <CardTitle className="text-lg">{license.licenseName}</CardTitle>
                  </div>
                  <Badge variant={status.variant}>
                    {status.status}
                  </Badge>
                </div>
                <CardDescription className="mt-1">
                  {licenseTypes[license.licenseType as keyof typeof licenseTypes]?.label || license.licenseType}
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-3">
                <div className="space-y-2 text-sm">
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">License #:</span>
                    <span className="font-medium">{license.licenseNumber}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">Issuing Authority:</span>
                    <span className="font-medium text-right">{license.issuingAuthority}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">Issue Date:</span>
                    <span className="font-medium">{format(new Date(license.issueDate), "MMM dd, yyyy")}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">Expiry Date:</span>
                    <span className="font-medium">{format(new Date(license.expiryDate), "MMM dd, yyyy")}</span>
                  </div>
                  {license.fee && (
                    <div className="flex justify-between">
                      <span className="text-muted-foreground">{t.licenseFee || "License Fee"}:</span>
                      <span className="font-medium">{parseFloat(license.fee).toLocaleString()} SAR</span>
                    </div>
                  )}
                  {status.daysUntilExpiry >= 0 && (
                    <div className="flex justify-between">
                      <span className="text-muted-foreground">Days until expiry:</span>
                      <span className="font-medium">{status.daysUntilExpiry}</span>
                    </div>
                  )}
                </div>

                {license.notes && (
                  <div className="pt-2 border-t">
                    <p className="text-sm text-muted-foreground">{license.notes}</p>
                  </div>
                )}

                <div className="flex gap-2 pt-2">
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => handleEdit(license)}
                    className="flex-1"
                    data-testid={`button-edit-license-${license.id}`}
                  >
                    <Edit className="h-3 w-3 mr-1" />
                    Edit
                  </Button>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => handleDelete(license)}
                    className="flex-1"
                    data-testid={`button-delete-license-${license.id}`}
                  >
                    <Trash2 className="h-3 w-3 mr-1" />
                    Delete
                  </Button>
                  {license.documentUrl && (
                    <Button
                      variant="outline"
                      size="sm"
                      asChild
                      className="flex-1"
                    >
                      <a href={license.documentUrl} target="_blank" rel="noopener noreferrer">
                        <FileText className="h-3 w-3 mr-1" />
                        View
                      </a>
                    </Button>
                  )}
                </div>
              </CardContent>
            </Card>
          );
        })}
      </div>

      {filteredLicenses.length === 0 && (
        <Card className="p-12">
          <div className="text-center">
            <FileText className="h-12 w-12 mx-auto text-muted-foreground mb-4" />
            <h3 className="text-lg font-semibold mb-2">No licenses found</h3>
            <p className="text-muted-foreground mb-4">
              {searchQuery || filterType !== "all" 
                ? "Try adjusting your search or filters" 
                : "Start by adding your first license"}
            </p>
            {searchQuery === "" && filterType === "all" && (
              <Button onClick={() => setIsDialogOpen(true)}>
                <Plus className="h-4 w-4 mr-2" />
                Add Your First License
              </Button>
            )}
          </div>
        </Card>
      )}

      {/* Delete Confirmation Dialog */}
      <Dialog open={!!deletingLicense} onOpenChange={() => setDeletingLicense(null)}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Delete License</DialogTitle>
            <DialogDescription>
              Are you sure you want to delete "{deletingLicense?.licenseName}"? This action cannot be undone.
            </DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button variant="outline" onClick={() => setDeletingLicense(null)}>
              Cancel
            </Button>
            <Tooltip>
              <TooltipTrigger asChild>
                <Button variant="destructive" onClick={confirmDelete}>
                  Delete License
                </Button>
              </TooltipTrigger>
              <TooltipContent>{isRTL ? "تحذير: لا يمكن التراجع عن الحذف." : "Warning: this action cannot be undone."}</TooltipContent>
            </Tooltip>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
    </TooltipProvider>
  );
}