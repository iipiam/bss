import { useState } from "react";
import { useQuery, useMutation } from "@tanstack/react-query";
import { apiRequest, queryClient } from "@/lib/queryClient";
import { Button } from "@/components/ui/button";
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
import { Plus, Edit, Trash2, AlertCircle, Calendar, Building, FileText, Clock, Bell, Shield } from "lucide-react";
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

// Form schema for creating/editing licenses
const licenseFormSchema = z.object({
  licenseType: z.enum(["trade", "health", "fire_safety", "municipal", "vat", "food_safety", "environmental", "labor", "custom"]),
  licenseNumber: z.string().min(1, "License number is required"),
  licenseName: z.string().min(1, "License name is required"),
  issuingAuthority: z.string().min(1, "Issuing authority is required"),
  issueDate: z.string().min(1, "Issue date is required"),
  expiryDate: z.string().min(1, "Expiry date is required"),
  renewalReminderDays: z.number().min(1).max(365).default(30),
  documentUrl: z.string().optional(),
  notes: z.string().optional(),
});

type LicenseFormData = z.infer<typeof licenseFormSchema>;

export default function Licenses() {
  const { t } = useLanguage();
  const { toast } = useToast();
  const { restaurant } = useAuth();
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [editingLicense, setEditingLicense] = useState<License | null>(null);
  const [deletingLicense, setDeletingLicense] = useState<License | null>(null);
  const [filterType, setFilterType] = useState<string>("all");
  const [searchQuery, setSearchQuery] = useState("");

  const businessType = restaurant?.businessType || 'restaurant';

  // Fetch licenses
  const { data: licenses = [], isLoading } = useQuery({
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
      documentUrl: "",
      notes: "",
    },
  });

  // Create license mutation
  const createMutation = useMutation({
    mutationFn: async (data: LicenseFormData) => {
      const res = await apiRequest("POST", "/api/licenses", data);
      return res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/licenses"] });
      queryClient.invalidateQueries({ queryKey: ["/api/licenses/expiring"] });
      toast({
        title: "Success",
        description: "License created successfully",
      });
      setIsDialogOpen(false);
      form.reset();
    },
    onError: (error: any) => {
      toast({
        title: "Error",
        description: error.message || "Failed to create license",
        variant: "destructive",
      });
    },
  });

  // Update license mutation
  const updateMutation = useMutation({
    mutationFn: async ({ id, data }: { id: string; data: Partial<LicenseFormData> }) => {
      const res = await apiRequest("PATCH", `/api/licenses/${id}`, data);
      return res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/licenses"] });
      queryClient.invalidateQueries({ queryKey: ["/api/licenses/expiring"] });
      toast({
        title: "Success",
        description: "License updated successfully",
      });
      setIsDialogOpen(false);
      setEditingLicense(null);
      form.reset();
    },
    onError: (error: any) => {
      toast({
        title: "Error",
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
        title: "Success",
        description: "License deleted successfully",
      });
      setDeletingLicense(null);
    },
    onError: (error: any) => {
      toast({
        title: "Error",
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

  const handleEdit = (license: License) => {
    setEditingLicense(license);
    form.reset({
      licenseType: license.licenseType as any,
      licenseNumber: license.licenseNumber,
      licenseName: license.licenseName,
      issuingAuthority: license.issuingAuthority,
      issueDate: format(new Date(license.issueDate), "yyyy-MM-dd"),
      expiryDate: format(new Date(license.expiryDate), "yyyy-MM-dd"),
      renewalReminderDays: license.renewalReminderDays || 30,
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
      return { status: "Expiring Soon", variant: "warning" as const, daysUntilExpiry };
    } else if (daysUntilExpiry <= 90) {
      return { status: "Due for Renewal", variant: "secondary" as const, daysUntilExpiry };
    } else {
      return { status: "Active", variant: "success" as const, daysUntilExpiry };
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
                        <FormLabel>License Type</FormLabel>
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
                        <FormLabel>License Number</FormLabel>
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
                      <FormLabel>Issuing Authority</FormLabel>
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
                        <FormLabel>Issue Date</FormLabel>
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
                        <FormLabel>Expiry Date</FormLabel>
                        <FormControl>
                          <Input {...field} type="date" data-testid="input-expiry-date" />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                </div>

                <FormField
                  control={form.control}
                  name="renewalReminderDays"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Renewal Reminder (days before expiry)</FormLabel>
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
                  name="documentUrl"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Document URL (optional)</FormLabel>
                      <FormControl>
                        <Input {...field} placeholder="Link to document" data-testid="input-document-url" />
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
            <Button variant="destructive" onClick={confirmDelete}>
              Delete License
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}