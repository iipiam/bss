import { useState, useEffect } from "react";
import { useQuery, useMutation } from "@tanstack/react-query";
import { useLocation } from "wouter";
import { useAuth } from "@/lib/auth";
import { useLanguage } from "@/contexts/LanguageContext";
import { useDevice } from "@/contexts/DeviceContext";
import { queryClient, apiRequest } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Switch } from "@/components/ui/switch";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Skeleton } from "@/components/ui/skeleton";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { 
  Users, 
  Key, 
  Eye, 
  EyeOff, 
  Shield, 
  ShieldOff, 
  Search,
  UserCog,
  Building2,
  Clock,
  CheckCircle,
  XCircle,
  RefreshCw,
  Archive,
  FileText,
  Download,
  AlertCircle,
  Calendar,
  FolderOpen,
  Upload,
  Trash2,
  File,
  UserPlus,
  FileSpreadsheet
} from "lucide-react";
import { Textarea } from "@/components/ui/textarea";

interface Account {
  id: string;
  username: string;
  fullName: string;
  email: string | null;
  phone: string | null;
  role: string;
  active: boolean;
  restaurantId: string | null;
  restaurantName: string | null;
  businessType: string | null;
  lastLoginAt: string | null;
  lastActivityAt: string | null;
  createdAt: string;
}

interface RefundInvoice {
  id: number;
  serialNumber: string;
  refundAmount: string;
  monthsUsed: number;
  originalPrice: string;
  chargedAmount: string;
  cancellationDate: string;
  pdfData: string | null;
}

interface ArchivedAccount {
  id: string;
  username: string;
  fullName: string;
  email: string | null;
  phone: string | null;
  role: string;
  restaurantId: string | null;
  restaurantName: string | null;
  businessType: string | null;
  subscriptionPlan: string | null;
  subscriptionStartDate: string | null;
  subscriptionEndDate: string | null;
  subscriptionCancelledAt: string | null;
  cancellationReason: string | null;
  createdAt: string;
  refundInvoice: RefundInvoice | null;
}

interface CompanyFile {
  id: string;
  fileType: string;
  fileName: string;
  filePath: string;
  fileSize: number | null;
  mimeType: string | null;
  description: string | null;
  uploadedBy: string | null;
  createdAt: string;
  updatedAt: string;
}

type FileTypeKey = 'cr_certificate' | 'vat_certificate' | 'license' | 'iban_certificate' | 'national_address';

interface ITAccount {
  id: string;
  username: string;
  fullName: string;
  email: string | null;
  phone: string | null;
  role: string;
  active: boolean;
  lastLoginAt: string | null;
  lastActivityAt: string | null;
  createdAt: string;
}

interface PendingSignup {
  id: string;
  geideaSessionId: string;
  merchantReferenceId: string;
  username: string;
  fullName: string;
  email: string;
  restaurantName: string;
  nationalId: string;
  hasVatRegistration: boolean;
  taxNumber: string | null;
  commercialRegistration: string;
  businessType: string;
  restaurantType: string;
  subscriptionPlan: string;
  branchesCount: number;
  amount: string;
  status: string;
  createdAt: string;
  expiresAt: string;
}

export default function ITAccountManagement() {
  const { user, accountType, isLoading: authLoading } = useAuth();
  const { t } = useLanguage();
  const { device } = useDevice();
  const { toast } = useToast();
  const [, navigate] = useLocation();
  
  // Device-specific layout settings
  const isMobile = device === 'iphone';
  const isTablet = device === 'ipad';
  const layout = {
    padding: device === 'iphone' ? 'p-3' : device === 'ipad' ? 'p-4' : 'p-6',
    spaceY: device === 'iphone' ? 'space-y-3' : device === 'ipad' ? 'space-y-4' : 'space-y-6',
    text3Xl: device === 'iphone' ? 'text-xl' : device === 'ipad' ? 'text-2xl' : 'text-3xl',
    gridCols: device === 'iphone' ? 'grid-cols-1' : 'md:grid-cols-3',
  };

  // Mobile Account Card Component for iPhone
  const MobileAccountCard = ({ account }: { account: Account }) => (
    <Card 
      data-testid={`card-account-${account.id}`}
      className="hover-elevate"
    >
      <CardContent className="p-4 space-y-3">
        {/* Header: Status and Business */}
        <div className="flex items-center justify-between gap-2">
          <div className="flex items-center gap-2">
            <Switch
              checked={account.active}
              onCheckedChange={() => handleToggleStatus(account)}
              disabled={toggleStatusMutation.isPending}
              data-testid={`switch-status-${account.id}`}
            />
            <Badge variant={account.active ? "default" : "destructive"}>
              {account.active ? (t.active || "Active") : (t.disabled || "Disabled")}
            </Badge>
          </div>
          {account.businessType && (
            <Badge variant="outline" className="text-xs">
              {account.businessType}
            </Badge>
          )}
        </div>

        {/* Account Info */}
        <div className="space-y-1">
          <div className="flex items-center gap-2">
            <Building2 className="h-4 w-4 text-muted-foreground flex-shrink-0" />
            <span className="font-medium truncate">{account.restaurantName || "N/A"}</span>
          </div>
          <div className="flex items-center gap-2 text-sm text-muted-foreground">
            <Users className="h-3 w-3 flex-shrink-0" />
            <span className="font-mono">{account.username}</span>
            <span className="text-muted-foreground/50">•</span>
            <span>{account.fullName}</span>
          </div>
        </div>

        {/* Role and Last Login */}
        <div className="flex items-center justify-between text-sm">
          <Badge variant="secondary">{account.role}</Badge>
          <div className="flex items-center gap-1 text-muted-foreground">
            <Clock className="h-3 w-3" />
            <span className="text-xs">{formatDate(account.lastLoginAt)}</span>
          </div>
        </div>

        {/* Action Button - Full Width for Easy Touch */}
        <Dialog 
          open={passwordDialogOpen && selectedAccount?.id === account.id} 
          onOpenChange={(open) => {
            setPasswordDialogOpen(open);
            if (!open) {
              setSelectedAccount(null);
              setNewPassword("");
              setConfirmPassword("");
              setShowPassword(false);
            }
          }}
        >
          <DialogTrigger asChild>
            <Button
              variant="outline"
              className="w-full"
              onClick={() => setSelectedAccount(account)}
              data-testid={`button-change-password-${account.id}`}
            >
              <Key className="h-4 w-4 mr-2" />
              {t.changePassword || "Change Password"}
            </Button>
          </DialogTrigger>
          <DialogContent>
            <DialogHeader>
              <DialogTitle className="flex items-center gap-2">
                <Key className="h-5 w-5" />
                {t.changePassword || "Change Password"}
              </DialogTitle>
              <DialogDescription>
                {t.changePasswordFor || "Change password for"}: <strong>{account.username}</strong>
              </DialogDescription>
            </DialogHeader>
            <div className="space-y-4 py-4">
              <div className="space-y-2">
                <Label htmlFor={`newPassword-${account.id}`}>{t.newPassword || "New Password"}</Label>
                <div className="relative">
                  <Input
                    id={`newPassword-${account.id}`}
                    type={showPassword ? "text" : "password"}
                    value={newPassword}
                    onChange={(e) => setNewPassword(e.target.value)}
                    placeholder={t.enterNewPassword || "Enter new password"}
                    data-testid="input-new-password"
                  />
                  <Button
                    type="button"
                    variant="ghost"
                    size="icon"
                    className="absolute right-0 top-0 h-full px-3"
                    onClick={() => setShowPassword(!showPassword)}
                    data-testid="button-toggle-password"
                  >
                    {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                  </Button>
                </div>
              </div>
              <div className="space-y-2">
                <Label htmlFor={`confirmPassword-${account.id}`}>{t.confirmPassword || "Confirm Password"}</Label>
                <Input
                  id={`confirmPassword-${account.id}`}
                  type={showPassword ? "text" : "password"}
                  value={confirmPassword}
                  onChange={(e) => setConfirmPassword(e.target.value)}
                  placeholder={t.confirmNewPassword || "Confirm new password"}
                  data-testid="input-confirm-password"
                />
              </div>
              {newPassword && confirmPassword && newPassword !== confirmPassword && (
                <p className="text-sm text-red-500">{t.passwordsMismatch || "Passwords do not match"}</p>
              )}
            </div>
            <DialogFooter className="flex-col gap-2 sm:flex-row">
              <Button
                variant="outline"
                onClick={() => setPasswordDialogOpen(false)}
                className="w-full sm:w-auto"
                data-testid="button-cancel"
              >
                {t.cancel || "Cancel"}
              </Button>
              <Button
                onClick={handleChangePassword}
                disabled={changePasswordMutation.isPending || !newPassword || newPassword !== confirmPassword}
                className="w-full sm:w-auto"
                data-testid="button-save-password"
              >
                {changePasswordMutation.isPending ? (
                  <>
                    <RefreshCw className="h-4 w-4 mr-2 animate-spin" />
                    {t.saving || "Saving..."}
                  </>
                ) : (
                  <>
                    <Key className="h-4 w-4 mr-2" />
                    {t.savePassword || "Save Password"}
                  </>
                )}
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </CardContent>
    </Card>
  );

  // Mobile Archive Card Component for iPhone
  const MobileArchiveCard = ({ account }: { account: ArchivedAccount }) => (
    <Card 
      data-testid={`card-archived-${account.id}`}
      className="hover-elevate"
    >
      <CardContent className="p-4 space-y-3">
        {/* Header: Business Name and Badge */}
        <div className="flex items-center justify-between gap-2">
          <div className="flex items-center gap-2 flex-1 min-w-0">
            <Building2 className="h-4 w-4 text-muted-foreground flex-shrink-0" />
            <span className="font-medium truncate">{account.restaurantName || "N/A"}</span>
          </div>
          <Badge variant={getCancellationReasonVariant(account.cancellationReason)}>
            {getCancellationReasonLabel(account.cancellationReason)}
          </Badge>
        </div>

        {/* Account Details */}
        <div className="grid grid-cols-2 gap-2 text-sm">
          <div>
            <span className="text-muted-foreground">{t.username || "Username"}:</span>
            <p className="font-mono">{account.username}</p>
          </div>
          <div>
            <span className="text-muted-foreground">{t.subscriptionPlan || "Plan"}:</span>
            <p><Badge variant="secondary">{account.subscriptionPlan || "-"}</Badge></p>
          </div>
          <div>
            <span className="text-muted-foreground">{t.cancelledOn || "Cancelled On"}:</span>
            <p className="flex items-center gap-1">
              <Calendar className="h-3 w-3" />
              {formatDateShort(account.subscriptionCancelledAt)}
            </p>
          </div>
          <div>
            <span className="text-muted-foreground">{t.refundAmount || "Refund"}:</span>
            <p className="font-medium text-green-600">
              {account.refundInvoice 
                ? `${parseFloat(account.refundInvoice.refundAmount).toFixed(2)} SAR`
                : "-"
              }
            </p>
          </div>
        </div>

        {/* Action Button - Full Width */}
        {account.refundInvoice?.pdfData ? (
          <Button
            variant="outline"
            className="w-full"
            onClick={() => handleDownloadRefundInvoice(account)}
            data-testid={`button-download-refund-${account.id}`}
          >
            <Download className="h-4 w-4 mr-2" />
            {t.download || "Download"} {account.refundInvoice.serialNumber}
          </Button>
        ) : (
          <Button
            variant="secondary"
            className="w-full"
            onClick={() => handleGenerateRefundInvoice(account)}
            disabled={generateRefundInvoiceMutation.isPending}
            data-testid={`button-generate-refund-${account.id}`}
          >
            {generateRefundInvoiceMutation.isPending ? (
              <RefreshCw className="h-4 w-4 mr-2 animate-spin" />
            ) : (
              <FileText className="h-4 w-4 mr-2" />
            )}
            {t.generateInvoice || "Generate Invoice"}
          </Button>
        )}
      </CardContent>
    </Card>
  );

  const [activeTab, setActiveTab] = useState<"accounts" | "archive" | "files" | "itAccounts" | "pendingSignups">("accounts");
  const [searchQuery, setSearchQuery] = useState("");
  const [archiveSearchQuery, setArchiveSearchQuery] = useState("");
  const [statusFilter, setStatusFilter] = useState<"all" | "active" | "disabled">("all");
  const [selectedAccount, setSelectedAccount] = useState<Account | null>(null);
  const [passwordDialogOpen, setPasswordDialogOpen] = useState(false);
  const [newPassword, setNewPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [confirmPassword, setConfirmPassword] = useState("");
  
  // Company Files state
  const [uploadingFileType, setUploadingFileType] = useState<FileTypeKey | null>(null);
  const [fileDescription, setFileDescription] = useState("");
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [fileToDelete, setFileToDelete] = useState<CompanyFile | null>(null);
  
  // IT Accounts state
  const [itAccountSearchQuery, setItAccountSearchQuery] = useState("");
  const [itAccountStatusFilter, setItAccountStatusFilter] = useState<"all" | "active" | "disabled">("all");
  const [selectedITAccount, setSelectedITAccount] = useState<ITAccount | null>(null);
  const [itPasswordDialogOpen, setItPasswordDialogOpen] = useState(false);
  const [itNewPassword, setItNewPassword] = useState("");
  const [itConfirmPassword, setItConfirmPassword] = useState("");
  const [showItPassword, setShowItPassword] = useState(false);
  const [createITAccountDialogOpen, setCreateITAccountDialogOpen] = useState(false);
  const [deleteITAccountDialogOpen, setDeleteITAccountDialogOpen] = useState(false);
  const [itAccountToDelete, setItAccountToDelete] = useState<ITAccount | null>(null);
  const [newITAccountForm, setNewITAccountForm] = useState({
    username: "",
    password: "",
    fullName: "",
    email: "",
    phone: "",
  });
  
  // Client Documents state
  const [clientDocsDialogOpen, setClientDocsDialogOpen] = useState(false);
  const [selectedClientForDocs, setSelectedClientForDocs] = useState<Account | null>(null);
  
  // Pending Signups state
  const [deletePendingDialogOpen, setDeletePendingDialogOpen] = useState(false);
  const [pendingSignupToDelete, setPendingSignupToDelete] = useState<PendingSignup | null>(null);

  // Security: Redirect non-IT accounts using useEffect to wait for auth to load
  useEffect(() => {
    if (!authLoading && accountType && accountType !== 'it') {
      navigate('/');
    }
  }, [accountType, authLoading, navigate]);

  // Show loading while auth is loading or if not IT account
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

  // Security: Block non-IT accounts
  if (accountType !== 'it') {
    return null;
  }

  // Fetch all accounts - staleTime: 0 ensures instant updates after mutations
  const { data: accounts = [], isLoading, refetch } = useQuery<Account[]>({
    queryKey: ['/api/it/all-accounts'],
    enabled: !!user && accountType === 'it',
    refetchInterval: 30000,
    staleTime: 0,
  });

  // Fetch archived accounts
  const { data: archivedAccounts = [], isLoading: archiveLoading, refetch: refetchArchive } = useQuery<ArchivedAccount[]>({
    queryKey: ['/api/it/archived-accounts'],
    enabled: !!user && accountType === 'it',
    staleTime: 0,
  });

  // Fetch company files
  const { data: companyFiles = [], isLoading: filesLoading, refetch: refetchFiles } = useQuery<CompanyFile[]>({
    queryKey: ['/api/it/company-files'],
    enabled: !!user && accountType === 'it',
    staleTime: 0,
  });

  // Fetch IT accounts
  const { data: itAccounts = [], isLoading: itAccountsLoading, refetch: refetchITAccounts } = useQuery<ITAccount[]>({
    queryKey: ['/api/it/it-accounts'],
    enabled: !!user && accountType === 'it',
    staleTime: 0,
  });

  // Fetch pending signups
  const { data: pendingSignups = [], isLoading: pendingSignupsLoading, refetch: refetchPendingSignups } = useQuery<PendingSignup[]>({
    queryKey: ['/api/it/pending-signups'],
    enabled: !!user && accountType === 'it',
    staleTime: 0,
  });

  // Fetch client documents when a client is selected
  const { data: clientDocs = [], isLoading: clientDocsLoading } = useQuery<CompanyFile[]>({
    queryKey: ['/api/it/client-files', selectedClientForDocs?.restaurantId],
    enabled: !!selectedClientForDocs?.restaurantId && clientDocsDialogOpen,
  });

  // File type configuration
  const fileTypes: { key: FileTypeKey; label: string; allowMultiple: boolean }[] = [
    { key: 'cr_certificate', label: t.crCertificate || 'CR Certificate', allowMultiple: false },
    { key: 'vat_certificate', label: t.vatCertificate || 'VAT Certificate', allowMultiple: false },
    { key: 'license', label: t.licenses || 'Licenses', allowMultiple: true },
    { key: 'iban_certificate', label: t.ibanCertificate || 'IBAN Account Certificate', allowMultiple: false },
    { key: 'national_address', label: t.nationalAddress || 'National Address', allowMultiple: false },
  ];

  // Get files by type
  const getFilesByType = (fileType: FileTypeKey) => {
    return companyFiles.filter(f => f.fileType === fileType);
  };

  // Upload file mutation
  const uploadFileMutation = useMutation({
    mutationFn: async ({ file, fileType, description }: { file: File; fileType: FileTypeKey; description?: string }) => {
      const formData = new FormData();
      formData.append('file', file);
      formData.append('fileType', fileType);
      if (description) formData.append('description', description);

      const response = await fetch('/api/it/company-files/upload', {
        method: 'POST',
        credentials: 'include',
        body: formData,
      });
      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.error || 'Failed to upload file');
      }
      return response.json();
    },
    onSuccess: () => {
      toast({
        title: t.success || "Success",
        description: t.fileUploaded || "File uploaded successfully.",
      });
      setUploadingFileType(null);
      setFileDescription("");
      queryClient.invalidateQueries({ queryKey: ['/api/it/company-files'] });
    },
    onError: (error: Error) => {
      toast({
        title: t.error || "Error",
        description: error.message || t.fileUploadError || "Failed to upload file",
        variant: "destructive",
      });
    },
  });

  // Delete file mutation
  const deleteFileMutation = useMutation({
    mutationFn: async (fileId: string) => {
      return apiRequest("DELETE", `/api/it/company-files/${fileId}`);
    },
    onSuccess: () => {
      toast({
        title: t.success || "Success",
        description: t.fileDeleted || "File deleted successfully.",
      });
      setDeleteDialogOpen(false);
      setFileToDelete(null);
      queryClient.invalidateQueries({ queryKey: ['/api/it/company-files'] });
    },
    onError: (error: Error) => {
      toast({
        title: t.error || "Error",
        description: error.message || t.fileDeleteError || "Failed to delete file",
        variant: "destructive",
      });
    },
  });

  // Handle file upload
  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>, fileType: FileTypeKey) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (file.type !== 'application/pdf') {
      toast({
        title: t.error || "Error",
        description: t.pdfFilesOnly || "Only PDF files are allowed",
        variant: "destructive",
      });
      return;
    }

    uploadFileMutation.mutate({ file, fileType, description: fileDescription });
  };

  // Handle file download
  const handleFileDownload = (file: CompanyFile) => {
    window.open(`/api/it/company-files/${file.id}/download`, '_blank');
  };

  // Format file size
  const formatFileSize = (bytes: number | null) => {
    if (!bytes) return '-';
    if (bytes < 1024) return `${bytes} B`;
    if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
    return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
  };

  // Change password mutation
  const changePasswordMutation = useMutation({
    mutationFn: async ({ accountId, newPassword }: { accountId: string; newPassword: string }) => {
      return apiRequest("PATCH", `/api/it/accounts/${accountId}/password`, { newPassword });
    },
    onSuccess: () => {
      toast({
        title: "Password Changed",
        description: "The account password has been updated successfully.",
      });
      setPasswordDialogOpen(false);
      setNewPassword("");
      setConfirmPassword("");
      setSelectedAccount(null);
    },
    onError: (error: any) => {
      toast({
        title: "Error",
        description: error.message || "Failed to change password",
        variant: "destructive",
      });
    },
  });

  // Toggle account status mutation
  const toggleStatusMutation = useMutation({
    mutationFn: async ({ accountId, active }: { accountId: string; active: boolean }) => {
      return apiRequest("PATCH", `/api/it/accounts/${accountId}/status`, { active });
    },
    onSuccess: (_, variables) => {
      toast({
        title: variables.active ? "Account Enabled" : "Account Disabled",
        description: `The account has been ${variables.active ? 'enabled' : 'disabled'} successfully.`,
      });
      queryClient.invalidateQueries({ queryKey: ['/api/it/all-accounts'] });
    },
    onError: (error: any) => {
      toast({
        title: "Error",
        description: error.message || "Failed to update account status",
        variant: "destructive",
      });
    },
  });

  // IT Account mutations
  const createITAccountMutation = useMutation({
    mutationFn: async (data: { username: string; password: string; fullName: string; email?: string; phone?: string }) => {
      return apiRequest("POST", "/api/it/it-accounts", data);
    },
    onSuccess: () => {
      toast({
        title: t.success || "Success",
        description: t.itAccountCreated || "IT account created successfully.",
      });
      setCreateITAccountDialogOpen(false);
      setNewITAccountForm({ username: "", password: "", fullName: "", email: "", phone: "" });
      queryClient.invalidateQueries({ queryKey: ['/api/it/it-accounts'] });
    },
    onError: (error: any) => {
      toast({
        title: t.error || "Error",
        description: error.message || t.failedToCreateITAccount || "Failed to create IT account",
        variant: "destructive",
      });
    },
  });

  const updateITAccountMutation = useMutation({
    mutationFn: async ({ id, data }: { id: string; data: { active?: boolean; password?: string } }) => {
      return apiRequest("PATCH", `/api/it/it-accounts/${id}`, data);
    },
    onSuccess: (_, variables) => {
      if (variables.data.active !== undefined) {
        toast({
          title: variables.data.active ? (t.accountEnabled || "Account Enabled") : (t.accountDisabled || "Account Disabled"),
          description: t.itAccountStatusUpdated || "IT account status updated successfully.",
        });
      } else if (variables.data.password) {
        toast({
          title: t.passwordChanged || "Password Changed",
          description: t.itAccountPasswordUpdated || "IT account password updated successfully.",
        });
        setItPasswordDialogOpen(false);
        setItNewPassword("");
        setItConfirmPassword("");
        setSelectedITAccount(null);
      }
      queryClient.invalidateQueries({ queryKey: ['/api/it/it-accounts'] });
    },
    onError: (error: any) => {
      toast({
        title: t.error || "Error",
        description: error.message || t.failedToUpdateITAccount || "Failed to update IT account",
        variant: "destructive",
      });
    },
  });

  const deleteITAccountMutation = useMutation({
    mutationFn: async (id: string) => {
      return apiRequest("DELETE", `/api/it/it-accounts/${id}`);
    },
    onSuccess: () => {
      toast({
        title: t.success || "Success",
        description: t.itAccountDeleted || "IT account deleted successfully.",
      });
      setDeleteITAccountDialogOpen(false);
      setItAccountToDelete(null);
      queryClient.invalidateQueries({ queryKey: ['/api/it/it-accounts'] });
    },
    onError: (error: any) => {
      toast({
        title: t.error || "Error",
        description: error.message || t.failedToDeleteITAccount || "Failed to delete IT account",
        variant: "destructive",
      });
    },
  });

  // Delete pending signup mutation
  const deletePendingSignupMutation = useMutation({
    mutationFn: async (id: string) => {
      return apiRequest("DELETE", `/api/it/pending-signups/${id}`);
    },
    onSuccess: () => {
      toast({
        title: t.success || "Success",
        description: t.pendingSignupDeleted || "Pending signup deleted successfully.",
      });
      setDeletePendingDialogOpen(false);
      setPendingSignupToDelete(null);
      queryClient.invalidateQueries({ queryKey: ['/api/it/pending-signups'] });
    },
    onError: (error: any) => {
      toast({
        title: t.error || "Error",
        description: error.message || t.failedToDeletePendingSignup || "Failed to delete pending signup",
        variant: "destructive",
      });
    },
  });

  // Cleanup expired pending signups mutation
  const cleanupExpiredMutation = useMutation({
    mutationFn: async () => {
      return apiRequest("POST", "/api/it/pending-signups/cleanup");
    },
    onSuccess: (result: any) => {
      toast({
        title: t.success || "Success",
        description: `${result.deletedCount || 0} ${t.expiredSignupsCleanedUp || "expired signups cleaned up successfully."}`,
      });
      queryClient.invalidateQueries({ queryKey: ['/api/it/pending-signups'] });
    },
    onError: (error: any) => {
      toast({
        title: t.error || "Error",
        description: error.message || t.failedToCleanupExpired || "Failed to cleanup expired signups",
        variant: "destructive",
      });
    },
  });

  // Generate refund invoice mutation
  const generateRefundInvoiceMutation = useMutation({
    mutationFn: async ({ restaurantId, reason }: { restaurantId: string; reason: "mistake" | "client_request" }) => {
      const response = await fetch(`/api/it/archived-accounts/${restaurantId}/generate-refund-invoice`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify({ reason }),
      });
      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.error || 'Failed to generate refund invoice');
      }
      return response.json();
    },
    onSuccess: (result) => {
      // Download the generated PDF
      if (result.pdfBase64) {
        const byteCharacters = atob(result.pdfBase64);
        const byteNumbers = new Array(byteCharacters.length);
        for (let i = 0; i < byteCharacters.length; i++) {
          byteNumbers[i] = byteCharacters.charCodeAt(i);
        }
        const byteArray = new Uint8Array(byteNumbers);
        const blob = new Blob([byteArray], { type: 'application/pdf' });
        const url = URL.createObjectURL(blob);
        const link = document.createElement('a');
        link.href = url;
        link.download = `Refund_Invoice_${result.invoice.serialNumber}.pdf`;
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
        URL.revokeObjectURL(url);
      }
      toast({
        title: t.success || "Success",
        description: t.refundInvoiceGenerated || "Refund invoice generated and downloaded successfully.",
      });
      refetchArchive();
    },
    onError: (error: Error) => {
      toast({
        title: t.error || "Error",
        description: error.message || "Failed to generate refund invoice",
        variant: "destructive",
      });
    },
  });

  const handleGenerateRefundInvoice = (account: ArchivedAccount) => {
    if (!account.restaurantId) {
      toast({
        title: t.error || "Error",
        description: "Restaurant ID not found",
        variant: "destructive",
      });
      return;
    }
    
    // Use existing cancellation reason or default to "mistake"
    const reason = (account.cancellationReason as "mistake" | "client_request") || "mistake";
    generateRefundInvoiceMutation.mutate({
      restaurantId: account.restaurantId,
      reason,
    });
  };

  // Filter accounts based on search and status
  const filteredAccounts = accounts.filter(account => {
    const matchesSearch = 
      account.username.toLowerCase().includes(searchQuery.toLowerCase()) ||
      account.fullName.toLowerCase().includes(searchQuery.toLowerCase()) ||
      (account.email?.toLowerCase().includes(searchQuery.toLowerCase())) ||
      (account.restaurantName?.toLowerCase().includes(searchQuery.toLowerCase()));
    
    const matchesStatus = 
      statusFilter === "all" ||
      (statusFilter === "active" && account.active) ||
      (statusFilter === "disabled" && !account.active);

    return matchesSearch && matchesStatus;
  });

  // Filter archived accounts based on search
  const filteredArchivedAccounts = archivedAccounts.filter(account => {
    return (
      account.username.toLowerCase().includes(archiveSearchQuery.toLowerCase()) ||
      account.fullName.toLowerCase().includes(archiveSearchQuery.toLowerCase()) ||
      (account.email?.toLowerCase().includes(archiveSearchQuery.toLowerCase())) ||
      (account.restaurantName?.toLowerCase().includes(archiveSearchQuery.toLowerCase())) ||
      (account.refundInvoice?.serialNumber?.toLowerCase().includes(archiveSearchQuery.toLowerCase()))
    );
  });

  // Filter IT accounts based on search and status
  const filteredITAccounts = itAccounts.filter(account => {
    const matchesSearch = 
      account.username.toLowerCase().includes(itAccountSearchQuery.toLowerCase()) ||
      account.fullName.toLowerCase().includes(itAccountSearchQuery.toLowerCase()) ||
      (account.email?.toLowerCase().includes(itAccountSearchQuery.toLowerCase()));
    
    const matchesStatus = 
      itAccountStatusFilter === "all" ||
      (itAccountStatusFilter === "active" && account.active) ||
      (itAccountStatusFilter === "disabled" && !account.active);

    return matchesSearch && matchesStatus;
  });

  // IT Account handlers
  const handleToggleITAccountStatus = (account: ITAccount) => {
    updateITAccountMutation.mutate({
      id: account.id,
      data: { active: !account.active },
    });
  };

  const handleChangeITAccountPassword = () => {
    if (!selectedITAccount) return;
    
    if (itNewPassword.length < 4) {
      toast({
        title: t.invalidPassword || "Invalid Password",
        description: t.passwordMinLength || "Password must be at least 4 characters long.",
        variant: "destructive",
      });
      return;
    }

    if (itNewPassword !== itConfirmPassword) {
      toast({
        title: t.passwordMismatch || "Password Mismatch",
        description: t.passwordsMismatch || "Passwords do not match. Please try again.",
        variant: "destructive",
      });
      return;
    }

    updateITAccountMutation.mutate({
      id: selectedITAccount.id,
      data: { password: itNewPassword },
    });
  };

  const handleCreateITAccount = () => {
    if (!newITAccountForm.username || !newITAccountForm.password || !newITAccountForm.fullName) {
      toast({
        title: t.error || "Error",
        description: t.requiredFieldsMissing || "Please fill in all required fields.",
        variant: "destructive",
      });
      return;
    }

    createITAccountMutation.mutate({
      username: newITAccountForm.username,
      password: newITAccountForm.password,
      fullName: newITAccountForm.fullName,
      email: newITAccountForm.email || undefined,
      phone: newITAccountForm.phone || undefined,
    });
  };

  const handleDeleteITAccount = () => {
    if (!itAccountToDelete) return;
    deleteITAccountMutation.mutate(itAccountToDelete.id);
  };

  const handleChangePassword = () => {
    if (!selectedAccount) return;
    
    if (newPassword.length < 4) {
      toast({
        title: "Invalid Password",
        description: "Password must be at least 4 characters long.",
        variant: "destructive",
      });
      return;
    }

    if (newPassword !== confirmPassword) {
      toast({
        title: "Password Mismatch",
        description: "Passwords do not match. Please try again.",
        variant: "destructive",
      });
      return;
    }

    changePasswordMutation.mutate({
      accountId: selectedAccount.id,
      newPassword,
    });
  };

  const handleToggleStatus = (account: Account) => {
    toggleStatusMutation.mutate({
      accountId: account.id,
      active: !account.active,
    });
  };

  const handleDownloadRefundInvoice = (account: ArchivedAccount) => {
    if (!account.refundInvoice?.pdfData) {
      toast({
        title: t.noRefundInvoice || "No Refund Invoice",
        description: t.noRefundInvoiceAvailable || "No refund invoice available for this account. This may be because it was cancelled as a mistake subscription.",
        variant: "destructive",
      });
      return;
    }

    try {
      const pdfData = account.refundInvoice.pdfData;
      const byteCharacters = atob(pdfData);
      const byteNumbers = new Array(byteCharacters.length);
      for (let i = 0; i < byteCharacters.length; i++) {
        byteNumbers[i] = byteCharacters.charCodeAt(i);
      }
      const byteArray = new Uint8Array(byteNumbers);
      const blob = new Blob([byteArray], { type: 'application/pdf' });
      const url = URL.createObjectURL(blob);
      
      const link = document.createElement('a');
      link.href = url;
      link.download = `Refund_Invoice_${account.refundInvoice.serialNumber}.pdf`;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      URL.revokeObjectURL(url);

      toast({
        title: t.downloadSuccess || "Download Started",
        description: t.refundInvoiceDownloaded || "Refund invoice downloaded successfully.",
      });
    } catch (error) {
      console.error("Error downloading refund invoice:", error);
      toast({
        title: t.downloadError || "Download Failed",
        description: t.failedToDownloadRefund || "Failed to download refund invoice. Please try again.",
        variant: "destructive",
      });
    }
  };

  const formatDate = (dateStr: string | null) => {
    if (!dateStr) return "Never";
    return new Date(dateStr).toLocaleString();
  };

  const formatDateShort = (dateStr: string | null) => {
    if (!dateStr) return "-";
    return new Date(dateStr).toLocaleDateString();
  };

  const getCancellationReasonLabel = (reason: string | null) => {
    if (!reason) return t.unknown || "Unknown";
    if (reason === "mistake") return t.mistakeSubscription || "Mistake Subscription";
    if (reason === "client_request") return t.byClientRequest || "By Client Request";
    return reason;
  };

  const getCancellationReasonVariant = (reason: string | null): "default" | "destructive" | "secondary" => {
    if (reason === "mistake") return "secondary";
    if (reason === "client_request") return "destructive";
    return "default";
  };

  if (isLoading) {
    return (
      <div className={layout.padding}>
        <Skeleton className="h-8 w-64 mb-4" />
        <Skeleton className="h-4 w-96 mb-8" />
        <div className="space-y-4">
          {[1, 2, 3, 4, 5].map(i => (
            <Skeleton key={i} className="h-16 w-full" />
          ))}
        </div>
      </div>
    );
  }

  return (
    <div className={`${layout.padding} ${layout.spaceY} ${(isMobile || isTablet) ? 'pt-4' : ''}`}>
      {/* Header */}
      <div className="flex items-start justify-between gap-4 flex-wrap">
        <div className="flex-1 min-w-[200px]">
          <h1 className={`${layout.text3Xl} font-bold mb-2`} data-testid="text-page-title">
            <UserCog className="inline-block mr-2 h-8 w-8" />
            {t.accountManagement || "Account Management"}
          </h1>
          <p className="text-muted-foreground">
            {t.manageClientAccounts || "Manage client accounts, passwords, and access control"}
          </p>
        </div>
        <Button 
          variant="outline" 
          onClick={() => {
            refetch();
            refetchArchive();
            refetchFiles();
            refetchITAccounts();
          }}
          data-testid="button-refresh"
        >
          <RefreshCw className="h-4 w-4 mr-2" />
          {t.refresh || "Refresh"}
        </Button>
      </div>

      {/* Tabs for Accounts, Archive, IT Accounts, Pending Signups, and Company Files */}
      <Tabs value={activeTab} onValueChange={(v) => setActiveTab(v as "accounts" | "archive" | "files" | "itAccounts" | "pendingSignups")} className="w-full">
        <TabsList className={`flex flex-wrap w-full gap-1 h-auto p-1 ${isMobile ? 'flex-col' : isTablet ? 'flex-row' : ''}`}>
          <TabsTrigger value="accounts" data-testid="tab-accounts" className={`flex items-center gap-2 ${isMobile ? 'w-full justify-start' : 'flex-1 min-w-fit'}`}>
            <Users className="h-4 w-4 flex-shrink-0" />
            <span className="truncate">{isMobile || isTablet ? (t.accounts || "Accounts") : (t.clientAccounts || "Client Accounts")}</span>
          </TabsTrigger>
          <TabsTrigger value="itAccounts" data-testid="tab-it-accounts" className={`flex items-center gap-2 ${isMobile ? 'w-full justify-start' : 'flex-1 min-w-fit'}`}>
            <Shield className="h-4 w-4 flex-shrink-0" />
            <span className="truncate">{isMobile || isTablet ? "IT" : (t.itAccounts || "IT Accounts")}</span>
            {itAccounts.length > 0 && (
              <Badge variant="secondary" className="ml-1 flex-shrink-0">{itAccounts.length}</Badge>
            )}
          </TabsTrigger>
          <TabsTrigger value="pendingSignups" data-testid="tab-pending-signups" className={`flex items-center gap-2 ${isMobile ? 'w-full justify-start' : 'flex-1 min-w-fit'}`}>
            <Clock className="h-4 w-4 flex-shrink-0" />
            <span className="truncate">{isMobile || isTablet ? (t.pending || "Pending") : (t.pendingSignups || "Pending Signups")}</span>
            {pendingSignups.length > 0 && (
              <Badge variant="secondary" className="ml-1 flex-shrink-0">{pendingSignups.length}</Badge>
            )}
          </TabsTrigger>
          <TabsTrigger value="archive" data-testid="tab-archive" className={`flex items-center gap-2 ${isMobile ? 'w-full justify-start' : 'flex-1 min-w-fit'}`}>
            <Archive className="h-4 w-4 flex-shrink-0" />
            <span className="truncate">{t.archive || "Archive"}</span>
            {archivedAccounts.length > 0 && (
              <Badge variant="secondary" className="ml-1 flex-shrink-0">{archivedAccounts.length}</Badge>
            )}
          </TabsTrigger>
          <TabsTrigger value="files" data-testid="tab-company-files" className={`flex items-center gap-2 ${isMobile ? 'w-full justify-start' : 'flex-1 min-w-fit'}`}>
            <FolderOpen className="h-4 w-4 flex-shrink-0" />
            <span className="truncate">{isMobile || isTablet ? (t.files || "Files") : (t.companyFiles || "Company Files")}</span>
          </TabsTrigger>
        </TabsList>

        {/* Active Accounts Tab */}
        <TabsContent value="accounts" className="space-y-4 mt-4">
          {/* Stats Cards */}
          <div className={`grid gap-4 ${layout.gridCols}`}>
            <Card data-testid="card-total-accounts">
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2 gap-2">
                <CardTitle className="text-sm font-medium">{t.totalAccounts || "Total Accounts"}</CardTitle>
                <Users className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">{accounts.length}</div>
              </CardContent>
            </Card>
            <Card data-testid="card-active-accounts">
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2 gap-2">
                <CardTitle className="text-sm font-medium">{t.activeAccounts || "Active Accounts"}</CardTitle>
                <CheckCircle className="h-4 w-4 text-green-500" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold text-green-600">
                  {accounts.filter(a => a.active).length}
                </div>
              </CardContent>
            </Card>
            <Card data-testid="card-disabled-accounts">
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2 gap-2">
                <CardTitle className="text-sm font-medium">{t.disabledAccounts || "Disabled Accounts"}</CardTitle>
                <XCircle className="h-4 w-4 text-red-500" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold text-red-600">
                  {accounts.filter(a => !a.active).length}
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Search and Filter */}
          <Card data-testid="card-accounts-list">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Shield className="h-5 w-5" />
                {t.clientAccounts || "Client Accounts"}
              </CardTitle>
              <CardDescription>
                {t.managePasswordsAndAccess || "Change passwords and enable/disable account access"}
              </CardDescription>
              
              <div className={`flex ${isMobile ? 'flex-col' : 'flex-wrap'} gap-4 pt-4`}>
                <div className={`relative ${isMobile ? 'w-full' : 'flex-1 min-w-[200px]'}`}>
                  <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                  <Input
                    placeholder={t.searchAccounts || "Search accounts..."}
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    className="pl-10"
                    data-testid="input-search"
                  />
                </div>
                <div className={`flex gap-2 ${isMobile ? 'w-full' : ''}`}>
                  <Button
                    variant={statusFilter === "all" ? "default" : "outline"}
                    size="sm"
                    onClick={() => setStatusFilter("all")}
                    className={isMobile ? 'flex-1 text-xs' : ''}
                    data-testid="button-filter-all"
                  >
                    {t.all || "All"}
                  </Button>
                  <Button
                    variant={statusFilter === "active" ? "default" : "outline"}
                    size="sm"
                    onClick={() => setStatusFilter("active")}
                    className={isMobile ? 'flex-1 text-xs' : ''}
                    data-testid="button-filter-active"
                  >
                    <CheckCircle className="h-4 w-4 mr-1" />
                    {t.active || "Active"}
                  </Button>
                  <Button
                    variant={statusFilter === "disabled" ? "default" : "outline"}
                    size="sm"
                    onClick={() => setStatusFilter("disabled")}
                    className={isMobile ? 'flex-1 text-xs' : ''}
                    data-testid="button-filter-disabled"
                  >
                    <XCircle className="h-4 w-4 mr-1" />
                    {t.disabled || "Disabled"}
                  </Button>
                </div>
                <div className={`flex gap-2 ${isMobile ? 'w-full' : 'ml-auto'}`}>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => {
                      window.open('/api/it/export-clients/excel', '_blank');
                    }}
                    className={isMobile ? 'flex-1 text-xs' : ''}
                    data-testid="button-export-excel"
                  >
                    <FileSpreadsheet className="h-4 w-4 mr-1" />
                    {t.exportExcel || "Export Excel"}
                  </Button>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => {
                      window.open('/api/it/export-clients/pdf', '_blank');
                    }}
                    className={isMobile ? 'flex-1 text-xs' : ''}
                    data-testid="button-export-pdf"
                  >
                    <FileText className="h-4 w-4 mr-1" />
                    {t.exportPdf || "Export PDF"}
                  </Button>
                </div>
              </div>
            </CardHeader>
            <CardContent>
              {/* Mobile/Tablet Card View */}
              {(isMobile || isTablet) ? (
                <div className="space-y-3">
                  {filteredAccounts.length === 0 ? (
                    <div className="text-center text-muted-foreground py-8">
                      {t.noAccountsFound || "No accounts found"}
                    </div>
                  ) : (
                    filteredAccounts.map((account) => (
                      <MobileAccountCard key={account.id} account={account} />
                    ))
                  )}
                </div>
              ) : (
              /* Desktop Table View */
              <div className="overflow-x-auto">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>{t.status || "Status"}</TableHead>
                      <TableHead>{t.username || "Username"}</TableHead>
                      <TableHead>{t.fullName || "Full Name"}</TableHead>
                      <TableHead>{t.business || "Business"}</TableHead>
                      <TableHead>{t.role || "Role"}</TableHead>
                      <TableHead>{t.lastLogin || "Last Login"}</TableHead>
                      <TableHead className="text-right">{t.actions || "Actions"}</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {filteredAccounts.length === 0 ? (
                      <TableRow>
                        <TableCell colSpan={7} className="text-center text-muted-foreground py-8">
                          {t.noAccountsFound || "No accounts found"}
                        </TableCell>
                      </TableRow>
                    ) : (
                      filteredAccounts.map((account) => (
                        <TableRow key={account.id} data-testid={`row-account-${account.id}`}>
                          <TableCell>
                            <div className="flex items-center gap-2">
                              <Switch
                                checked={account.active}
                                onCheckedChange={() => handleToggleStatus(account)}
                                disabled={toggleStatusMutation.isPending}
                                data-testid={`switch-status-${account.id}`}
                              />
                              <Badge variant={account.active ? "default" : "destructive"}>
                                {account.active ? (t.active || "Active") : (t.disabled || "Disabled")}
                              </Badge>
                            </div>
                          </TableCell>
                          <TableCell className="font-mono font-medium">
                            {account.username}
                          </TableCell>
                          <TableCell>{account.fullName}</TableCell>
                          <TableCell>
                            <div className="flex items-center gap-1">
                              <Building2 className="h-4 w-4 text-muted-foreground" />
                              <span>{account.restaurantName || "N/A"}</span>
                              {account.businessType && (
                                <Badge variant="outline" className="ml-1 text-xs">
                                  {account.businessType}
                                </Badge>
                              )}
                            </div>
                          </TableCell>
                          <TableCell>
                            <Badge variant="secondary">{account.role}</Badge>
                          </TableCell>
                          <TableCell>
                            <div className="flex items-center gap-1 text-sm text-muted-foreground">
                              <Clock className="h-3 w-3" />
                              {formatDate(account.lastLoginAt)}
                            </div>
                          </TableCell>
                          <TableCell className="text-right">
                            <div className="flex items-center justify-end gap-2">
                              {/* View Documents Button */}
                              {account.restaurantId && (
                                <Button
                                  variant="outline"
                                  size="sm"
                                  onClick={() => {
                                    setSelectedClientForDocs(account);
                                    setClientDocsDialogOpen(true);
                                  }}
                                  data-testid={`button-view-docs-${account.id}`}
                                >
                                  <FolderOpen className="h-4 w-4 mr-1" />
                                  {t.documents || "Documents"}
                                </Button>
                              )}
                              
                              {/* Change Password Dialog */}
                              <Dialog 
                                open={passwordDialogOpen && selectedAccount?.id === account.id} 
                                onOpenChange={(open) => {
                                  setPasswordDialogOpen(open);
                                  if (!open) {
                                    setSelectedAccount(null);
                                    setNewPassword("");
                                    setConfirmPassword("");
                                    setShowPassword(false);
                                  }
                                }}
                              >
                                <DialogTrigger asChild>
                                  <Button
                                    variant="outline"
                                    size="sm"
                                    onClick={() => setSelectedAccount(account)}
                                    data-testid={`button-change-password-${account.id}`}
                                  >
                                    <Key className="h-4 w-4 mr-1" />
                                    {t.changePassword || "Change Password"}
                                  </Button>
                                </DialogTrigger>
                              <DialogContent>
                                <DialogHeader>
                                  <DialogTitle className="flex items-center gap-2">
                                    <Key className="h-5 w-5" />
                                    {t.changePassword || "Change Password"}
                                  </DialogTitle>
                                  <DialogDescription>
                                    {t.changePasswordFor || "Change password for"}: <strong>{account.username}</strong>
                                  </DialogDescription>
                                </DialogHeader>
                                <div className="space-y-4 py-4">
                                  <div className="space-y-2">
                                    <Label htmlFor="newPassword">{t.newPassword || "New Password"}</Label>
                                    <div className="relative">
                                      <Input
                                        id="newPassword"
                                        type={showPassword ? "text" : "password"}
                                        value={newPassword}
                                        onChange={(e) => setNewPassword(e.target.value)}
                                        placeholder={t.enterNewPassword || "Enter new password"}
                                        data-testid="input-new-password"
                                      />
                                      <Button
                                        type="button"
                                        variant="ghost"
                                        size="icon"
                                        className="absolute right-0 top-0 h-full px-3"
                                        onClick={() => setShowPassword(!showPassword)}
                                        data-testid="button-toggle-password"
                                      >
                                        {showPassword ? (
                                          <EyeOff className="h-4 w-4" />
                                        ) : (
                                          <Eye className="h-4 w-4" />
                                        )}
                                      </Button>
                                    </div>
                                  </div>
                                  <div className="space-y-2">
                                    <Label htmlFor="confirmPassword">{t.confirmPassword || "Confirm Password"}</Label>
                                    <Input
                                      id="confirmPassword"
                                      type={showPassword ? "text" : "password"}
                                      value={confirmPassword}
                                      onChange={(e) => setConfirmPassword(e.target.value)}
                                      placeholder={t.confirmNewPassword || "Confirm new password"}
                                      data-testid="input-confirm-password"
                                    />
                                  </div>
                                  {newPassword && confirmPassword && newPassword !== confirmPassword && (
                                    <p className="text-sm text-red-500">
                                      {t.passwordsMismatch || "Passwords do not match"}
                                    </p>
                                  )}
                                </div>
                                <DialogFooter>
                                  <Button
                                    variant="outline"
                                    onClick={() => setPasswordDialogOpen(false)}
                                    data-testid="button-cancel"
                                  >
                                    {t.cancel || "Cancel"}
                                  </Button>
                                  <Button
                                    onClick={handleChangePassword}
                                    disabled={
                                      changePasswordMutation.isPending ||
                                      !newPassword ||
                                      newPassword !== confirmPassword
                                    }
                                    data-testid="button-save-password"
                                  >
                                    {changePasswordMutation.isPending ? (
                                      <>
                                        <RefreshCw className="h-4 w-4 mr-2 animate-spin" />
                                        {t.saving || "Saving..."}
                                      </>
                                    ) : (
                                      <>
                                        <Key className="h-4 w-4 mr-2" />
                                        {t.savePassword || "Save Password"}
                                      </>
                                    )}
                                  </Button>
                                </DialogFooter>
                              </DialogContent>
                            </Dialog>
                            </div>
                          </TableCell>
                        </TableRow>
                      ))
                    )}
                  </TableBody>
                </Table>
              </div>
              )}
            </CardContent>
          </Card>

          {/* Client Documents Dialog */}
          <Dialog 
            open={clientDocsDialogOpen} 
            onOpenChange={(open) => {
              setClientDocsDialogOpen(open);
              if (!open) {
                setSelectedClientForDocs(null);
              }
            }}
          >
            <DialogContent className="max-w-2xl">
              <DialogHeader>
                <DialogTitle className="flex items-center gap-2">
                  <FolderOpen className="h-5 w-5" />
                  {t.clientDocuments || "Client Documents"}
                </DialogTitle>
                <DialogDescription>
                  {selectedClientForDocs?.restaurantName || "Client"} - {t.uploadedDocuments || "Uploaded Documents"}
                </DialogDescription>
              </DialogHeader>
              <div className="space-y-4 py-4">
                {clientDocsLoading ? (
                  <div className="space-y-2">
                    <Skeleton className="h-12 w-full" />
                    <Skeleton className="h-12 w-full" />
                    <Skeleton className="h-12 w-full" />
                  </div>
                ) : clientDocs.length === 0 ? (
                  <div className="text-center py-8 text-muted-foreground">
                    <FileText className="h-12 w-12 mx-auto mb-2 opacity-50" />
                    <p>{t.noDocumentsUploaded || "No documents uploaded by this client"}</p>
                  </div>
                ) : (
                  <div className="space-y-2">
                    {clientDocs.map((doc) => {
                      const fileTypeLabel = {
                        cr_certificate: t.crCertificate || "CR Certificate",
                        vat_certificate: t.vatCertificate || "VAT Certificate",
                        iban_certificate: t.ibanCertificate || "IBAN Certificate",
                        national_address: t.nationalAddress || "National Address",
                      }[doc.fileType] || doc.fileType;
                      
                      return (
                        <div 
                          key={doc.id} 
                          className="flex items-center justify-between p-3 border rounded-lg"
                          data-testid={`client-doc-${doc.id}`}
                        >
                          <div className="flex items-center gap-3">
                            <File className="h-8 w-8 text-red-500" />
                            <div>
                              <p className="font-medium text-sm">{fileTypeLabel}</p>
                              <p className="text-xs text-muted-foreground">{doc.fileName}</p>
                              {doc.fileSize && (
                                <p className="text-xs text-muted-foreground">
                                  {(doc.fileSize / 1024).toFixed(1)} KB
                                </p>
                              )}
                            </div>
                          </div>
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => {
                              window.open(
                                `/api/it/client-files/${selectedClientForDocs?.restaurantId}/${doc.id}/download`,
                                '_blank'
                              );
                            }}
                            data-testid={`download-client-doc-${doc.id}`}
                          >
                            <Download className="h-4 w-4 mr-1" />
                            {t.download || "Download"}
                          </Button>
                        </div>
                      );
                    })}
                  </div>
                )}
              </div>
              <DialogFooter>
                <Button
                  variant="outline"
                  onClick={() => setClientDocsDialogOpen(false)}
                >
                  {t.close || "Close"}
                </Button>
              </DialogFooter>
            </DialogContent>
          </Dialog>
        </TabsContent>

        {/* Pending Signups Tab */}
        <TabsContent value="pendingSignups" className="space-y-4 mt-4">
          {/* Pending Signups Stats */}
          <div className={`grid gap-4 ${layout.gridCols}`}>
            <Card data-testid="card-total-pending">
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2 gap-2">
                <CardTitle className="text-sm font-medium">{t.totalPending || "Total Pending"}</CardTitle>
                <Clock className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">{pendingSignups.length}</div>
              </CardContent>
            </Card>
            <Card data-testid="card-expired-count">
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2 gap-2">
                <CardTitle className="text-sm font-medium">{t.expiredCount || "Expired"}</CardTitle>
                <AlertCircle className="h-4 w-4 text-red-500" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold text-red-600">
                  {pendingSignups.filter(s => s.status === 'expired' || new Date(s.expiresAt) < new Date()).length}
                </div>
              </CardContent>
            </Card>
            <Card data-testid="card-pending-amount">
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2 gap-2">
                <CardTitle className="text-sm font-medium">{t.pendingAmount || "Total Amount"}</CardTitle>
                <FileText className="h-4 w-4 text-green-500" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold text-green-600">
                  {pendingSignups.reduce((sum, s) => sum + parseFloat(s.amount || "0"), 0).toFixed(2)} SAR
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Pending Signups Table */}
          <Card data-testid="card-pending-signups-list">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Clock className="h-5 w-5" />
                {t.pendingSignups || "Pending Signups"}
              </CardTitle>
              <CardDescription>
                {t.pendingSignupsDescription || "Accounts in the payment process awaiting completion"}
              </CardDescription>
              
              <div className={`flex ${isMobile ? 'flex-col' : 'flex-wrap items-center justify-end'} gap-4 pt-4`}>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => cleanupExpiredMutation.mutate()}
                  disabled={cleanupExpiredMutation.isPending}
                  data-testid="button-cleanup-expired"
                >
                  {cleanupExpiredMutation.isPending ? (
                    <RefreshCw className="h-4 w-4 mr-2 animate-spin" />
                  ) : (
                    <Trash2 className="h-4 w-4 mr-2" />
                  )}
                  {t.cleanupExpired || "Clean Up Expired"}
                </Button>
              </div>
            </CardHeader>
            <CardContent>
              {pendingSignupsLoading ? (
                <div className="space-y-4">
                  {[1, 2, 3].map(i => (
                    <Skeleton key={i} className="h-16 w-full" />
                  ))}
                </div>
              ) : (isMobile || isTablet) ? (
                /* Mobile/Tablet Card View for Pending Signups */
                <div className="space-y-3">
                  {pendingSignups.length === 0 ? (
                    <div className="text-center text-muted-foreground py-8">
                      {t.noPendingSignups || "No pending signups found"}
                    </div>
                  ) : (
                    pendingSignups.map((signup) => {
                      const isExpired = signup.status === 'expired' || new Date(signup.expiresAt) < new Date();
                      const statusVariant = signup.status === 'paid' ? 'default' : 
                                           signup.status === 'failed' ? 'destructive' : 
                                           isExpired ? 'secondary' : 'outline';
                      const statusLabel = signup.status === 'paid' ? (t.paid || 'Paid') :
                                         signup.status === 'failed' ? (t.paymentFailed || 'Failed') :
                                         isExpired ? (t.paymentExpired || 'Expired') : (t.paymentPending || 'Pending');
                      
                      return (
                        <Card 
                          key={signup.id}
                          data-testid={`card-pending-signup-${signup.id}`}
                          className="hover-elevate"
                        >
                          <CardContent className="p-4 space-y-3">
                            <div className="flex items-center justify-between gap-2">
                              <div className="flex items-center gap-2 flex-1 min-w-0">
                                <Building2 className="h-4 w-4 text-muted-foreground flex-shrink-0" />
                                <span className="font-medium truncate">{signup.restaurantName}</span>
                              </div>
                              <Badge variant={statusVariant} className={signup.status === 'pending' && !isExpired ? 'bg-yellow-500 text-white' : ''}>
                                {statusLabel}
                              </Badge>
                            </div>

                            <div className="grid grid-cols-2 gap-2 text-sm">
                              <div>
                                <span className="text-muted-foreground">{t.username || "Username"}:</span>
                                <p className="font-mono">{signup.username}</p>
                              </div>
                              <div>
                                <span className="text-muted-foreground">{t.subscriptionPlan || "Plan"}:</span>
                                <p><Badge variant="secondary">{signup.subscriptionPlan}</Badge></p>
                              </div>
                              <div>
                                <span className="text-muted-foreground">{t.businessType || "Type"}:</span>
                                <p>{signup.businessType}</p>
                              </div>
                              <div>
                                <span className="text-muted-foreground">{t.amount || "Amount"}:</span>
                                <p className="font-medium text-green-600">{parseFloat(signup.amount).toFixed(2)} SAR</p>
                              </div>
                            </div>

                            <div className="flex items-center gap-1 text-sm text-muted-foreground">
                              <Calendar className="h-3 w-3" />
                              <span>{t.expiresAt || "Expires"}: {new Date(signup.expiresAt).toLocaleDateString()}</span>
                            </div>

                            <Button
                              variant="destructive"
                              size="sm"
                              className="w-full"
                              onClick={() => {
                                setPendingSignupToDelete(signup);
                                setDeletePendingDialogOpen(true);
                              }}
                              data-testid={`button-delete-pending-${signup.id}`}
                            >
                              <Trash2 className="h-4 w-4 mr-2" />
                              {t.delete || "Delete"}
                            </Button>
                          </CardContent>
                        </Card>
                      );
                    })
                  )}
                </div>
              ) : (
                /* Desktop Table View for Pending Signups */
                <div className="overflow-x-auto">
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>{t.restaurant || "Restaurant"}</TableHead>
                        <TableHead>{t.username || "Username"}</TableHead>
                        <TableHead>{t.email || "Email"}</TableHead>
                        <TableHead>{t.businessType || "Type"}</TableHead>
                        <TableHead>{t.plan || "Plan"}</TableHead>
                        <TableHead>{t.branches || "Branches"}</TableHead>
                        <TableHead>{t.amount || "Amount"}</TableHead>
                        <TableHead>{t.status || "Status"}</TableHead>
                        <TableHead>{t.created || "Created"}</TableHead>
                        <TableHead>{t.expiresAt || "Expires"}</TableHead>
                        <TableHead className="text-right">{t.actions || "Actions"}</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {pendingSignups.length === 0 ? (
                        <TableRow>
                          <TableCell colSpan={11} className="text-center text-muted-foreground py-8">
                            {t.noPendingSignups || "No pending signups found"}
                          </TableCell>
                        </TableRow>
                      ) : (
                        pendingSignups.map((signup) => {
                          const isExpired = signup.status === 'expired' || new Date(signup.expiresAt) < new Date();
                          const statusVariant = signup.status === 'paid' ? 'default' : 
                                               signup.status === 'failed' ? 'destructive' : 
                                               isExpired ? 'secondary' : 'outline';
                          const statusLabel = signup.status === 'paid' ? (t.paid || 'Paid') :
                                             signup.status === 'failed' ? (t.paymentFailed || 'Failed') :
                                             isExpired ? (t.paymentExpired || 'Expired') : (t.paymentPending || 'Pending');
                          
                          return (
                            <TableRow key={signup.id} data-testid={`row-pending-signup-${signup.id}`}>
                              <TableCell>
                                <div className="flex items-center gap-1">
                                  <Building2 className="h-4 w-4 text-muted-foreground" />
                                  <span className="font-medium">{signup.restaurantName}</span>
                                </div>
                              </TableCell>
                              <TableCell className="font-mono">{signup.username}</TableCell>
                              <TableCell className="text-muted-foreground">{signup.email}</TableCell>
                              <TableCell>
                                <Badge variant="outline">{signup.businessType}</Badge>
                              </TableCell>
                              <TableCell>
                                <Badge variant="secondary">{signup.subscriptionPlan}</Badge>
                              </TableCell>
                              <TableCell>{signup.branchesCount}</TableCell>
                              <TableCell className="font-medium text-green-600">
                                {parseFloat(signup.amount).toFixed(2)} SAR
                              </TableCell>
                              <TableCell>
                                <Badge variant={statusVariant} className={signup.status === 'pending' && !isExpired ? 'bg-yellow-500 text-white' : ''}>
                                  {statusLabel}
                                </Badge>
                              </TableCell>
                              <TableCell className="text-muted-foreground text-sm">
                                {new Date(signup.createdAt).toLocaleDateString()}
                              </TableCell>
                              <TableCell className="text-muted-foreground text-sm">
                                {new Date(signup.expiresAt).toLocaleDateString()}
                              </TableCell>
                              <TableCell className="text-right">
                                <Button
                                  variant="destructive"
                                  size="sm"
                                  onClick={() => {
                                    setPendingSignupToDelete(signup);
                                    setDeletePendingDialogOpen(true);
                                  }}
                                  data-testid={`button-delete-pending-${signup.id}`}
                                >
                                  <Trash2 className="h-4 w-4" />
                                </Button>
                              </TableCell>
                            </TableRow>
                          );
                        })
                      )}
                    </TableBody>
                  </Table>
                </div>
              )}
            </CardContent>
          </Card>

          {/* Delete Pending Signup Confirmation Dialog */}
          <Dialog open={deletePendingDialogOpen} onOpenChange={setDeletePendingDialogOpen}>
            <DialogContent>
              <DialogHeader>
                <DialogTitle className="flex items-center gap-2 text-destructive">
                  <AlertCircle className="h-5 w-5" />
                  {t.deletePendingSignup || "Delete Pending Signup"}
                </DialogTitle>
                <DialogDescription>
                  {t.deletePendingSignupConfirmation || "Are you sure you want to delete this pending signup? This action cannot be undone."}
                </DialogDescription>
              </DialogHeader>
              {pendingSignupToDelete && (
                <div className="py-4">
                  <div className="bg-muted p-4 rounded-md space-y-2">
                    <div className="flex items-center gap-2">
                      <Building2 className="h-4 w-4 text-muted-foreground" />
                      <span className="font-medium">{pendingSignupToDelete.restaurantName}</span>
                    </div>
                    <div className="text-sm text-muted-foreground">
                      <span className="font-mono">{pendingSignupToDelete.username}</span> • {pendingSignupToDelete.email}
                    </div>
                    <div className="text-sm">
                      {t.amount || "Amount"}: <span className="font-medium text-green-600">{parseFloat(pendingSignupToDelete.amount).toFixed(2)} SAR</span>
                    </div>
                  </div>
                </div>
              )}
              <DialogFooter className="flex-col gap-2 sm:flex-row">
                <Button
                  variant="outline"
                  onClick={() => setDeletePendingDialogOpen(false)}
                  className="w-full sm:w-auto"
                  data-testid="button-cancel-delete-pending"
                >
                  {t.cancel || "Cancel"}
                </Button>
                <Button
                  variant="destructive"
                  onClick={() => {
                    if (pendingSignupToDelete) {
                      deletePendingSignupMutation.mutate(pendingSignupToDelete.id);
                    }
                  }}
                  disabled={deletePendingSignupMutation.isPending}
                  className="w-full sm:w-auto"
                  data-testid="button-confirm-delete-pending"
                >
                  {deletePendingSignupMutation.isPending ? (
                    <>
                      <RefreshCw className="h-4 w-4 mr-2 animate-spin" />
                      {t.deleting || "Deleting..."}
                    </>
                  ) : (
                    <>
                      <Trash2 className="h-4 w-4 mr-2" />
                      {t.delete || "Delete"}
                    </>
                  )}
                </Button>
              </DialogFooter>
            </DialogContent>
          </Dialog>
        </TabsContent>

        {/* Archive Tab */}
        <TabsContent value="archive" className="space-y-4 mt-4">
          {/* Archive Stats */}
          <div className={`grid gap-4 ${layout.gridCols}`}>
            <Card data-testid="card-archived-total">
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2 gap-2">
                <CardTitle className="text-sm font-medium">{t.totalArchived || "Total Archived"}</CardTitle>
                <Archive className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">{archivedAccounts.length}</div>
              </CardContent>
            </Card>
            <Card data-testid="card-cancelled-by-mistake">
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2 gap-2">
                <CardTitle className="text-sm font-medium">{t.mistakeSubscriptions || "Mistake Subscriptions"}</CardTitle>
                <AlertCircle className="h-4 w-4 text-yellow-500" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold text-yellow-600">
                  {archivedAccounts.filter(a => a.cancellationReason === "mistake").length}
                </div>
              </CardContent>
            </Card>
            <Card data-testid="card-cancelled-by-request">
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2 gap-2">
                <CardTitle className="text-sm font-medium">{t.clientRequests || "Client Requests"}</CardTitle>
                <FileText className="h-4 w-4 text-red-500" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold text-red-600">
                  {archivedAccounts.filter(a => a.cancellationReason === "client_request").length}
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Archived Accounts Table */}
          <Card data-testid="card-archived-accounts">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Archive className="h-5 w-5" />
                {t.archivedAccounts || "Archived Accounts"}
              </CardTitle>
              <CardDescription>
                {t.cancelledAccountsHistory || "View cancelled accounts, cancellation reasons, and refund invoices"}
              </CardDescription>
              
              <div className={`flex ${isMobile ? 'flex-col' : 'flex-wrap'} gap-4 pt-4`}>
                <div className={`relative ${isMobile ? 'w-full' : 'flex-1 min-w-[200px]'}`}>
                  <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                  <Input
                    placeholder={t.searchArchivedAccounts || "Search archived accounts..."}
                    value={archiveSearchQuery}
                    onChange={(e) => setArchiveSearchQuery(e.target.value)}
                    className="pl-10"
                    data-testid="input-archive-search"
                  />
                </div>
              </div>
            </CardHeader>
            <CardContent>
              {archiveLoading ? (
                <div className="space-y-4">
                  {[1, 2, 3].map(i => (
                    <Skeleton key={i} className="h-16 w-full" />
                  ))}
                </div>
              ) : (isMobile || isTablet) ? (
                /* Mobile/Tablet Card View for Archive */
                <div className="space-y-3">
                  {filteredArchivedAccounts.length === 0 ? (
                    <div className="text-center text-muted-foreground py-8">
                      {t.noArchivedAccounts || "No archived accounts found"}
                    </div>
                  ) : (
                    filteredArchivedAccounts.map((account) => (
                      <MobileArchiveCard key={account.id} account={account} />
                    ))
                  )}
                </div>
              ) : (
                /* Desktop Table View */
                <div className="overflow-x-auto">
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>{t.business || "Business"}</TableHead>
                        <TableHead>{t.username || "Username"}</TableHead>
                        <TableHead>{t.subscriptionPlan || "Plan"}</TableHead>
                        <TableHead>{t.cancellationReason || "Cancellation Reason"}</TableHead>
                        <TableHead>{t.cancelledOn || "Cancelled On"}</TableHead>
                        <TableHead>{t.refundAmount || "Refund Amount"}</TableHead>
                        <TableHead className="text-right">{t.refundInvoice || "Refund Invoice"}</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {filteredArchivedAccounts.length === 0 ? (
                        <TableRow>
                          <TableCell colSpan={7} className="text-center text-muted-foreground py-8">
                            {t.noArchivedAccounts || "No archived accounts found"}
                          </TableCell>
                        </TableRow>
                      ) : (
                        filteredArchivedAccounts.map((account) => (
                          <TableRow key={account.id} data-testid={`row-archived-${account.id}`}>
                            <TableCell>
                              <div className="flex items-center gap-1">
                                <Building2 className="h-4 w-4 text-muted-foreground" />
                                <span className="font-medium">{account.restaurantName || "N/A"}</span>
                                {account.businessType && (
                                  <Badge variant="outline" className="ml-1 text-xs">
                                    {account.businessType}
                                  </Badge>
                                )}
                              </div>
                            </TableCell>
                            <TableCell className="font-mono text-sm">
                              {account.username}
                            </TableCell>
                            <TableCell>
                              <Badge variant="secondary">
                                {account.subscriptionPlan || "-"}
                              </Badge>
                            </TableCell>
                            <TableCell>
                              <Badge variant={getCancellationReasonVariant(account.cancellationReason)}>
                                {getCancellationReasonLabel(account.cancellationReason)}
                              </Badge>
                            </TableCell>
                            <TableCell>
                              <div className="flex items-center gap-1 text-sm text-muted-foreground">
                                <Calendar className="h-3 w-3" />
                                {formatDateShort(account.subscriptionCancelledAt)}
                              </div>
                            </TableCell>
                            <TableCell>
                              {account.refundInvoice ? (
                                <span className="font-medium text-green-600">
                                  {parseFloat(account.refundInvoice.refundAmount).toFixed(2)} SAR
                                </span>
                              ) : (
                                <span className="text-muted-foreground">-</span>
                              )}
                            </TableCell>
                            <TableCell className="text-right">
                              {account.refundInvoice?.pdfData ? (
                                <Button
                                  variant="outline"
                                  size="sm"
                                  onClick={() => handleDownloadRefundInvoice(account)}
                                  data-testid={`button-download-refund-${account.id}`}
                                >
                                  <Download className="h-4 w-4 mr-1" />
                                  {account.refundInvoice.serialNumber}
                                </Button>
                              ) : (
                                <Button
                                  variant="secondary"
                                  size="sm"
                                  onClick={() => handleGenerateRefundInvoice(account)}
                                  disabled={generateRefundInvoiceMutation.isPending}
                                  data-testid={`button-generate-refund-${account.id}`}
                                >
                                  {generateRefundInvoiceMutation.isPending ? (
                                    <RefreshCw className="h-4 w-4 mr-1 animate-spin" />
                                  ) : (
                                    <FileText className="h-4 w-4 mr-1" />
                                  )}
                                  {t.generateInvoice || "Generate Invoice"}
                                </Button>
                              )}
                            </TableCell>
                          </TableRow>
                        ))
                      )}
                    </TableBody>
                  </Table>
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        {/* IT Accounts Tab */}
        <TabsContent value="itAccounts" className="space-y-4 mt-4">
          {/* IT Accounts Stats */}
          <div className={`grid gap-4 ${layout.gridCols}`}>
            <Card data-testid="card-it-total-accounts">
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2 gap-2">
                <CardTitle className="text-sm font-medium">{t.totalITAccounts || "Total IT Accounts"}</CardTitle>
                <Shield className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">{itAccounts.length}</div>
              </CardContent>
            </Card>
            <Card data-testid="card-it-active-accounts">
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2 gap-2">
                <CardTitle className="text-sm font-medium">{t.activeAccounts || "Active Accounts"}</CardTitle>
                <CheckCircle className="h-4 w-4 text-green-500" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold text-green-600">
                  {itAccounts.filter(a => a.active).length}
                </div>
              </CardContent>
            </Card>
            <Card data-testid="card-it-disabled-accounts">
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2 gap-2">
                <CardTitle className="text-sm font-medium">{t.disabledAccounts || "Disabled Accounts"}</CardTitle>
                <XCircle className="h-4 w-4 text-red-500" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold text-red-600">
                  {itAccounts.filter(a => !a.active).length}
                </div>
              </CardContent>
            </Card>
          </div>

          {/* IT Accounts List */}
          <Card data-testid="card-it-accounts-list">
            <CardHeader>
              <div className="flex items-center justify-between gap-2 flex-wrap">
                <div>
                  <CardTitle className="flex items-center gap-2">
                    <Shield className="h-5 w-5" />
                    {t.itAccounts || "IT Accounts"}
                  </CardTitle>
                  <CardDescription>
                    {t.manageITAccounts || "Manage IT admin accounts, passwords, and access control"}
                  </CardDescription>
                </div>
                {/* Create IT Account Button */}
                <Dialog open={createITAccountDialogOpen} onOpenChange={setCreateITAccountDialogOpen}>
                  <DialogTrigger asChild>
                    <Button data-testid="button-create-it-account">
                      <UserPlus className="h-4 w-4 mr-2" />
                      {t.createITAccount || "Create IT Account"}
                    </Button>
                  </DialogTrigger>
                  <DialogContent>
                    <DialogHeader>
                      <DialogTitle className="flex items-center gap-2">
                        <UserPlus className="h-5 w-5" />
                        {t.createITAccount || "Create IT Account"}
                      </DialogTitle>
                      <DialogDescription>
                        {t.createITAccountDescription || "Create a new IT administrator account"}
                      </DialogDescription>
                    </DialogHeader>
                    <div className="space-y-4 py-4">
                      <div className="space-y-2">
                        <Label htmlFor="it-username">{t.username || "Username"} *</Label>
                        <Input
                          id="it-username"
                          value={newITAccountForm.username}
                          onChange={(e) => setNewITAccountForm(f => ({ ...f, username: e.target.value }))}
                          placeholder={t.enterUsername || "Enter username"}
                          data-testid="input-it-username"
                        />
                      </div>
                      <div className="space-y-2">
                        <Label htmlFor="it-password">{t.password || "Password"} *</Label>
                        <Input
                          id="it-password"
                          type="password"
                          value={newITAccountForm.password}
                          onChange={(e) => setNewITAccountForm(f => ({ ...f, password: e.target.value }))}
                          placeholder={t.enterPassword || "Enter password"}
                          data-testid="input-it-password"
                        />
                      </div>
                      <div className="space-y-2">
                        <Label htmlFor="it-fullname">{t.fullName || "Full Name"} *</Label>
                        <Input
                          id="it-fullname"
                          value={newITAccountForm.fullName}
                          onChange={(e) => setNewITAccountForm(f => ({ ...f, fullName: e.target.value }))}
                          placeholder={t.enterFullName || "Enter full name"}
                          data-testid="input-it-fullname"
                        />
                      </div>
                      <div className="space-y-2">
                        <Label htmlFor="it-email">{t.email || "Email"}</Label>
                        <Input
                          id="it-email"
                          type="email"
                          value={newITAccountForm.email}
                          onChange={(e) => setNewITAccountForm(f => ({ ...f, email: e.target.value }))}
                          placeholder={t.enterEmail || "Enter email (optional)"}
                          data-testid="input-it-email"
                        />
                      </div>
                      <div className="space-y-2">
                        <Label htmlFor="it-phone">{t.phone || "Phone"}</Label>
                        <Input
                          id="it-phone"
                          value={newITAccountForm.phone}
                          onChange={(e) => setNewITAccountForm(f => ({ ...f, phone: e.target.value }))}
                          placeholder={t.enterPhone || "Enter phone (optional)"}
                          data-testid="input-it-phone"
                        />
                      </div>
                    </div>
                    <DialogFooter className="flex-col gap-2 sm:flex-row">
                      <Button
                        variant="outline"
                        onClick={() => setCreateITAccountDialogOpen(false)}
                        className="w-full sm:w-auto"
                        data-testid="button-cancel-create-it"
                      >
                        {t.cancel || "Cancel"}
                      </Button>
                      <Button
                        onClick={handleCreateITAccount}
                        disabled={createITAccountMutation.isPending || !newITAccountForm.username || !newITAccountForm.password || !newITAccountForm.fullName}
                        className="w-full sm:w-auto"
                        data-testid="button-submit-create-it"
                      >
                        {createITAccountMutation.isPending ? (
                          <>
                            <RefreshCw className="h-4 w-4 mr-2 animate-spin" />
                            {t.creating || "Creating..."}
                          </>
                        ) : (
                          <>
                            <UserPlus className="h-4 w-4 mr-2" />
                            {t.create || "Create"}
                          </>
                        )}
                      </Button>
                    </DialogFooter>
                  </DialogContent>
                </Dialog>
              </div>
              
              <div className={`flex ${isMobile ? 'flex-col' : 'flex-wrap'} gap-4 pt-4`}>
                <div className={`relative ${isMobile ? 'w-full' : 'flex-1 min-w-[200px]'}`}>
                  <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                  <Input
                    placeholder={t.searchITAccounts || "Search IT accounts..."}
                    value={itAccountSearchQuery}
                    onChange={(e) => setItAccountSearchQuery(e.target.value)}
                    className="pl-10"
                    data-testid="input-it-account-search"
                  />
                </div>
                <div className={`flex gap-2 ${isMobile ? 'w-full' : ''}`}>
                  <Button
                    variant={itAccountStatusFilter === "all" ? "default" : "outline"}
                    size="sm"
                    onClick={() => setItAccountStatusFilter("all")}
                    className={isMobile ? 'flex-1 text-xs' : ''}
                    data-testid="button-it-filter-all"
                  >
                    {t.all || "All"}
                  </Button>
                  <Button
                    variant={itAccountStatusFilter === "active" ? "default" : "outline"}
                    size="sm"
                    onClick={() => setItAccountStatusFilter("active")}
                    className={isMobile ? 'flex-1 text-xs' : ''}
                    data-testid="button-it-filter-active"
                  >
                    <CheckCircle className="h-4 w-4 mr-1" />
                    {t.active || "Active"}
                  </Button>
                  <Button
                    variant={itAccountStatusFilter === "disabled" ? "default" : "outline"}
                    size="sm"
                    onClick={() => setItAccountStatusFilter("disabled")}
                    className={isMobile ? 'flex-1 text-xs' : ''}
                    data-testid="button-it-filter-disabled"
                  >
                    <XCircle className="h-4 w-4 mr-1" />
                    {t.disabled || "Disabled"}
                  </Button>
                </div>
              </div>
            </CardHeader>
            <CardContent>
              {itAccountsLoading ? (
                <div className="space-y-4">
                  {[1, 2, 3].map(i => (
                    <Skeleton key={i} className="h-16 w-full" />
                  ))}
                </div>
              ) : (isMobile || isTablet) ? (
                /* Mobile/Tablet Card View for IT Accounts */
                <div className="space-y-3">
                  {filteredITAccounts.length === 0 ? (
                    <div className="text-center text-muted-foreground py-8">
                      {t.noITAccountsFound || "No IT accounts found"}
                    </div>
                  ) : (
                    filteredITAccounts.map((account) => (
                      <Card 
                        key={account.id}
                        data-testid={`card-it-account-${account.id}`}
                        className="hover-elevate"
                      >
                        <CardContent className="p-4 space-y-3">
                          <div className="flex items-center justify-between gap-2">
                            <div className="flex items-center gap-2">
                              <Switch
                                checked={account.active}
                                onCheckedChange={() => handleToggleITAccountStatus(account)}
                                disabled={updateITAccountMutation.isPending}
                                data-testid={`switch-it-status-${account.id}`}
                              />
                              <Badge variant={account.active ? "default" : "destructive"}>
                                {account.active ? (t.active || "Active") : (t.disabled || "Disabled")}
                              </Badge>
                            </div>
                            <Badge variant="secondary">{account.role}</Badge>
                          </div>

                          <div className="space-y-1">
                            <div className="flex items-center gap-2">
                              <Shield className="h-4 w-4 text-muted-foreground flex-shrink-0" />
                              <span className="font-medium">{account.fullName}</span>
                            </div>
                            <div className="flex items-center gap-2 text-sm text-muted-foreground">
                              <Users className="h-3 w-3 flex-shrink-0" />
                              <span className="font-mono">{account.username}</span>
                            </div>
                            {account.email && (
                              <div className="text-sm text-muted-foreground truncate">
                                {account.email}
                              </div>
                            )}
                          </div>

                          <div className="flex items-center gap-1 text-sm text-muted-foreground">
                            <Clock className="h-3 w-3" />
                            <span className="text-xs">{formatDate(account.lastLoginAt)}</span>
                          </div>

                          <div className="flex gap-2">
                            <Dialog 
                              open={itPasswordDialogOpen && selectedITAccount?.id === account.id} 
                              onOpenChange={(open) => {
                                setItPasswordDialogOpen(open);
                                if (!open) {
                                  setSelectedITAccount(null);
                                  setItNewPassword("");
                                  setItConfirmPassword("");
                                  setShowItPassword(false);
                                }
                              }}
                            >
                              <DialogTrigger asChild>
                                <Button
                                  variant="outline"
                                  size="sm"
                                  className="flex-1"
                                  onClick={() => setSelectedITAccount(account)}
                                  data-testid={`button-it-change-password-${account.id}`}
                                >
                                  <Key className="h-4 w-4 mr-1" />
                                  {t.changePassword || "Change Password"}
                                </Button>
                              </DialogTrigger>
                              <DialogContent>
                                <DialogHeader>
                                  <DialogTitle className="flex items-center gap-2">
                                    <Key className="h-5 w-5" />
                                    {t.changePassword || "Change Password"}
                                  </DialogTitle>
                                  <DialogDescription>
                                    {t.changePasswordFor || "Change password for"}: <strong>{account.username}</strong>
                                  </DialogDescription>
                                </DialogHeader>
                                <div className="space-y-4 py-4">
                                  <div className="space-y-2">
                                    <Label htmlFor={`itNewPassword-${account.id}`}>{t.newPassword || "New Password"}</Label>
                                    <div className="relative">
                                      <Input
                                        id={`itNewPassword-${account.id}`}
                                        type={showItPassword ? "text" : "password"}
                                        value={itNewPassword}
                                        onChange={(e) => setItNewPassword(e.target.value)}
                                        placeholder={t.enterNewPassword || "Enter new password"}
                                        data-testid="input-it-new-password"
                                      />
                                      <Button
                                        type="button"
                                        variant="ghost"
                                        size="icon"
                                        className="absolute right-0 top-0 h-full px-3"
                                        onClick={() => setShowItPassword(!showItPassword)}
                                        data-testid="button-toggle-it-password"
                                      >
                                        {showItPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                                      </Button>
                                    </div>
                                  </div>
                                  <div className="space-y-2">
                                    <Label htmlFor={`itConfirmPassword-${account.id}`}>{t.confirmPassword || "Confirm Password"}</Label>
                                    <Input
                                      id={`itConfirmPassword-${account.id}`}
                                      type={showItPassword ? "text" : "password"}
                                      value={itConfirmPassword}
                                      onChange={(e) => setItConfirmPassword(e.target.value)}
                                      placeholder={t.confirmNewPassword || "Confirm new password"}
                                      data-testid="input-it-confirm-password"
                                    />
                                  </div>
                                  {itNewPassword && itConfirmPassword && itNewPassword !== itConfirmPassword && (
                                    <p className="text-sm text-red-500">{t.passwordsMismatch || "Passwords do not match"}</p>
                                  )}
                                </div>
                                <DialogFooter className="flex-col gap-2 sm:flex-row">
                                  <Button
                                    variant="outline"
                                    onClick={() => setItPasswordDialogOpen(false)}
                                    className="w-full sm:w-auto"
                                    data-testid="button-cancel-it-password"
                                  >
                                    {t.cancel || "Cancel"}
                                  </Button>
                                  <Button
                                    onClick={handleChangeITAccountPassword}
                                    disabled={updateITAccountMutation.isPending || !itNewPassword || itNewPassword !== itConfirmPassword}
                                    className="w-full sm:w-auto"
                                    data-testid="button-save-it-password"
                                  >
                                    {updateITAccountMutation.isPending ? (
                                      <>
                                        <RefreshCw className="h-4 w-4 mr-2 animate-spin" />
                                        {t.saving || "Saving..."}
                                      </>
                                    ) : (
                                      <>
                                        <Key className="h-4 w-4 mr-2" />
                                        {t.savePassword || "Save Password"}
                                      </>
                                    )}
                                  </Button>
                                </DialogFooter>
                              </DialogContent>
                            </Dialog>
                            
                            {account.id !== user?.id && (
                              <Button
                                variant="destructive"
                                size="sm"
                                onClick={() => {
                                  setItAccountToDelete(account);
                                  setDeleteITAccountDialogOpen(true);
                                }}
                                data-testid={`button-it-delete-${account.id}`}
                              >
                                <Trash2 className="h-4 w-4" />
                              </Button>
                            )}
                          </div>
                        </CardContent>
                      </Card>
                    ))
                  )}
                </div>
              ) : (
                /* Desktop Table View for IT Accounts */
                <div className="overflow-x-auto">
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>{t.status || "Status"}</TableHead>
                        <TableHead>{t.username || "Username"}</TableHead>
                        <TableHead>{t.fullName || "Full Name"}</TableHead>
                        <TableHead>{t.email || "Email"}</TableHead>
                        <TableHead>{t.role || "Role"}</TableHead>
                        <TableHead>{t.lastLogin || "Last Login"}</TableHead>
                        <TableHead className="text-right">{t.actions || "Actions"}</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {filteredITAccounts.length === 0 ? (
                        <TableRow>
                          <TableCell colSpan={7} className="text-center text-muted-foreground py-8">
                            {t.noITAccountsFound || "No IT accounts found"}
                          </TableCell>
                        </TableRow>
                      ) : (
                        filteredITAccounts.map((account) => (
                          <TableRow key={account.id} data-testid={`row-it-account-${account.id}`}>
                            <TableCell>
                              <div className="flex items-center gap-2">
                                <Switch
                                  checked={account.active}
                                  onCheckedChange={() => handleToggleITAccountStatus(account)}
                                  disabled={updateITAccountMutation.isPending}
                                  data-testid={`switch-it-status-${account.id}`}
                                />
                                <Badge variant={account.active ? "default" : "destructive"}>
                                  {account.active ? (t.active || "Active") : (t.disabled || "Disabled")}
                                </Badge>
                              </div>
                            </TableCell>
                            <TableCell className="font-mono font-medium">
                              {account.username}
                            </TableCell>
                            <TableCell>{account.fullName}</TableCell>
                            <TableCell className="text-muted-foreground">
                              {account.email || "-"}
                            </TableCell>
                            <TableCell>
                              <Badge variant="secondary">{account.role}</Badge>
                            </TableCell>
                            <TableCell>
                              <div className="flex items-center gap-1 text-sm text-muted-foreground">
                                <Clock className="h-3 w-3" />
                                {formatDate(account.lastLoginAt)}
                              </div>
                            </TableCell>
                            <TableCell className="text-right">
                              <div className="flex items-center justify-end gap-2">
                                <Dialog 
                                  open={itPasswordDialogOpen && selectedITAccount?.id === account.id} 
                                  onOpenChange={(open) => {
                                    setItPasswordDialogOpen(open);
                                    if (!open) {
                                      setSelectedITAccount(null);
                                      setItNewPassword("");
                                      setItConfirmPassword("");
                                      setShowItPassword(false);
                                    }
                                  }}
                                >
                                  <DialogTrigger asChild>
                                    <Button
                                      variant="outline"
                                      size="sm"
                                      onClick={() => setSelectedITAccount(account)}
                                      data-testid={`button-it-change-password-${account.id}`}
                                    >
                                      <Key className="h-4 w-4 mr-1" />
                                      {t.changePassword || "Change Password"}
                                    </Button>
                                  </DialogTrigger>
                                  <DialogContent>
                                    <DialogHeader>
                                      <DialogTitle className="flex items-center gap-2">
                                        <Key className="h-5 w-5" />
                                        {t.changePassword || "Change Password"}
                                      </DialogTitle>
                                      <DialogDescription>
                                        {t.changePasswordFor || "Change password for"}: <strong>{account.username}</strong>
                                      </DialogDescription>
                                    </DialogHeader>
                                    <div className="space-y-4 py-4">
                                      <div className="space-y-2">
                                        <Label htmlFor="itNewPassword">{t.newPassword || "New Password"}</Label>
                                        <div className="relative">
                                          <Input
                                            id="itNewPassword"
                                            type={showItPassword ? "text" : "password"}
                                            value={itNewPassword}
                                            onChange={(e) => setItNewPassword(e.target.value)}
                                            placeholder={t.enterNewPassword || "Enter new password"}
                                            data-testid="input-it-new-password"
                                          />
                                          <Button
                                            type="button"
                                            variant="ghost"
                                            size="icon"
                                            className="absolute right-0 top-0 h-full px-3"
                                            onClick={() => setShowItPassword(!showItPassword)}
                                            data-testid="button-toggle-it-password"
                                          >
                                            {showItPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                                          </Button>
                                        </div>
                                      </div>
                                      <div className="space-y-2">
                                        <Label htmlFor="itConfirmPassword">{t.confirmPassword || "Confirm Password"}</Label>
                                        <Input
                                          id="itConfirmPassword"
                                          type={showItPassword ? "text" : "password"}
                                          value={itConfirmPassword}
                                          onChange={(e) => setItConfirmPassword(e.target.value)}
                                          placeholder={t.confirmNewPassword || "Confirm new password"}
                                          data-testid="input-it-confirm-password"
                                        />
                                      </div>
                                      {itNewPassword && itConfirmPassword && itNewPassword !== itConfirmPassword && (
                                        <p className="text-sm text-red-500">{t.passwordsMismatch || "Passwords do not match"}</p>
                                      )}
                                    </div>
                                    <DialogFooter>
                                      <Button
                                        variant="outline"
                                        onClick={() => setItPasswordDialogOpen(false)}
                                        data-testid="button-cancel-it-password"
                                      >
                                        {t.cancel || "Cancel"}
                                      </Button>
                                      <Button
                                        onClick={handleChangeITAccountPassword}
                                        disabled={updateITAccountMutation.isPending || !itNewPassword || itNewPassword !== itConfirmPassword}
                                        data-testid="button-save-it-password"
                                      >
                                        {updateITAccountMutation.isPending ? (
                                          <>
                                            <RefreshCw className="h-4 w-4 mr-2 animate-spin" />
                                            {t.saving || "Saving..."}
                                          </>
                                        ) : (
                                          <>
                                            <Key className="h-4 w-4 mr-2" />
                                            {t.savePassword || "Save Password"}
                                          </>
                                        )}
                                      </Button>
                                    </DialogFooter>
                                  </DialogContent>
                                </Dialog>
                                
                                {account.id !== user?.id && (
                                  <Button
                                    variant="destructive"
                                    size="sm"
                                    onClick={() => {
                                      setItAccountToDelete(account);
                                      setDeleteITAccountDialogOpen(true);
                                    }}
                                    data-testid={`button-it-delete-${account.id}`}
                                  >
                                    <Trash2 className="h-4 w-4" />
                                  </Button>
                                )}
                              </div>
                            </TableCell>
                          </TableRow>
                        ))
                      )}
                    </TableBody>
                  </Table>
                </div>
              )}
            </CardContent>
          </Card>

          {/* Delete IT Account Confirmation Dialog */}
          <Dialog open={deleteITAccountDialogOpen} onOpenChange={setDeleteITAccountDialogOpen}>
            <DialogContent>
              <DialogHeader>
                <DialogTitle className="flex items-center gap-2 text-destructive">
                  <AlertCircle className="h-5 w-5" />
                  {t.deleteITAccount || "Delete IT Account"}
                </DialogTitle>
                <DialogDescription>
                  {t.deleteITAccountConfirmation || "Are you sure you want to delete this IT account? This action cannot be undone."}
                </DialogDescription>
              </DialogHeader>
              {itAccountToDelete && (
                <div className="py-4">
                  <div className="bg-muted p-4 rounded-md space-y-2">
                    <div className="flex items-center gap-2">
                      <Shield className="h-4 w-4 text-muted-foreground" />
                      <span className="font-medium">{itAccountToDelete.fullName}</span>
                    </div>
                    <div className="text-sm text-muted-foreground font-mono">
                      @{itAccountToDelete.username}
                    </div>
                    {itAccountToDelete.email && (
                      <div className="text-sm text-muted-foreground">
                        {itAccountToDelete.email}
                      </div>
                    )}
                  </div>
                </div>
              )}
              <DialogFooter className="flex-col gap-2 sm:flex-row">
                <Button
                  variant="outline"
                  onClick={() => {
                    setDeleteITAccountDialogOpen(false);
                    setItAccountToDelete(null);
                  }}
                  className="w-full sm:w-auto"
                  data-testid="button-cancel-delete-it"
                >
                  {t.cancel || "Cancel"}
                </Button>
                <Button
                  variant="destructive"
                  onClick={handleDeleteITAccount}
                  disabled={deleteITAccountMutation.isPending}
                  className="w-full sm:w-auto"
                  data-testid="button-confirm-delete-it"
                >
                  {deleteITAccountMutation.isPending ? (
                    <>
                      <RefreshCw className="h-4 w-4 mr-2 animate-spin" />
                      {t.deleting || "Deleting..."}
                    </>
                  ) : (
                    <>
                      <Trash2 className="h-4 w-4 mr-2" />
                      {t.delete || "Delete"}
                    </>
                  )}
                </Button>
              </DialogFooter>
            </DialogContent>
          </Dialog>
        </TabsContent>

        {/* Company Files Tab */}
        <TabsContent value="files" className="space-y-4 mt-4">
          <Card data-testid="card-company-files">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <FolderOpen className="h-5 w-5" />
                {t.companyFiles || "Company Files"}
              </CardTitle>
              <CardDescription>
                {t.companyFilesDescription || "Upload and manage company documents like CR Certificate, VAT Certificate, licenses, and more"}
              </CardDescription>
            </CardHeader>
            <CardContent>
              {filesLoading ? (
                <div className="space-y-4">
                  {[1, 2, 3, 4, 5].map(i => (
                    <Skeleton key={i} className="h-24 w-full" />
                  ))}
                </div>
              ) : (
                <div className="space-y-6">
                  {fileTypes.map((fileType) => {
                    const filesOfType = getFilesByType(fileType.key);
                    const canUpload = fileType.allowMultiple || filesOfType.length === 0;

                    return (
                      <Card key={fileType.key} data-testid={`card-file-type-${fileType.key}`}>
                        <CardHeader className="pb-3">
                          <div className="flex items-center justify-between gap-2 flex-wrap">
                            <CardTitle className="text-base flex items-center gap-2">
                              <File className="h-4 w-4" />
                              {fileType.label}
                              {fileType.allowMultiple && (
                                <Badge variant="outline" className="text-xs">
                                  {t.multiple || "Multiple"}
                                </Badge>
                              )}
                            </CardTitle>
                            {canUpload && (
                              <Dialog 
                                open={uploadingFileType === fileType.key} 
                                onOpenChange={(open) => {
                                  if (!open) {
                                    setUploadingFileType(null);
                                    setFileDescription("");
                                  }
                                }}
                              >
                                <DialogTrigger asChild>
                                  <Button 
                                    size="sm" 
                                    onClick={() => setUploadingFileType(fileType.key)}
                                    data-testid={`button-upload-${fileType.key}`}
                                  >
                                    <Upload className="h-4 w-4 mr-1" />
                                    {t.uploadFile || "Upload File"}
                                  </Button>
                                </DialogTrigger>
                                <DialogContent>
                                  <DialogHeader>
                                    <DialogTitle className="flex items-center gap-2">
                                      <Upload className="h-5 w-5" />
                                      {t.uploadFile || "Upload File"}: {fileType.label}
                                    </DialogTitle>
                                    <DialogDescription>
                                      {t.pdfFilesOnly || "Only PDF files are allowed"}
                                    </DialogDescription>
                                  </DialogHeader>
                                  <div className="space-y-4 py-4">
                                    <div className="space-y-2">
                                      <Label htmlFor={`description-${fileType.key}`}>
                                        {t.description || "Description"} ({t.optional || "optional"})
                                      </Label>
                                      <Textarea
                                        id={`description-${fileType.key}`}
                                        value={fileDescription}
                                        onChange={(e) => setFileDescription(e.target.value)}
                                        placeholder={t.enterDescription || "Enter a description for this file..."}
                                        data-testid={`input-file-description-${fileType.key}`}
                                      />
                                    </div>
                                    <div className="space-y-2">
                                      <Label htmlFor={`file-${fileType.key}`}>{t.selectFile || "Select File"}</Label>
                                      <Input
                                        id={`file-${fileType.key}`}
                                        type="file"
                                        accept=".pdf,application/pdf"
                                        onChange={(e) => handleFileUpload(e, fileType.key)}
                                        disabled={uploadFileMutation.isPending}
                                        data-testid={`input-file-${fileType.key}`}
                                      />
                                    </div>
                                    {uploadFileMutation.isPending && (
                                      <div className="flex items-center gap-2 text-sm text-muted-foreground">
                                        <RefreshCw className="h-4 w-4 animate-spin" />
                                        {t.uploading || "Uploading..."}
                                      </div>
                                    )}
                                  </div>
                                  <DialogFooter>
                                    <Button
                                      variant="outline"
                                      onClick={() => {
                                        setUploadingFileType(null);
                                        setFileDescription("");
                                      }}
                                      data-testid={`button-cancel-upload-${fileType.key}`}
                                    >
                                      {t.cancel || "Cancel"}
                                    </Button>
                                  </DialogFooter>
                                </DialogContent>
                              </Dialog>
                            )}
                          </div>
                        </CardHeader>
                        <CardContent>
                          {filesOfType.length === 0 ? (
                            <div className="text-center text-muted-foreground py-4 border border-dashed rounded-md">
                              <File className="h-8 w-8 mx-auto mb-2 opacity-50" />
                              <p className="text-sm">{t.noFileUploaded || "No file uploaded"}</p>
                            </div>
                          ) : (
                            <div className="space-y-2">
                              {filesOfType.map((file) => (
                                <div 
                                  key={file.id} 
                                  className="flex items-center justify-between gap-4 p-3 border rounded-md hover-elevate"
                                  data-testid={`file-item-${file.id}`}
                                >
                                  <div className="flex-1 min-w-0">
                                    <div className="flex items-center gap-2">
                                      <FileText className="h-4 w-4 text-red-500 flex-shrink-0" />
                                      <span className="font-medium truncate">{file.fileName}</span>
                                    </div>
                                    <div className="flex items-center gap-3 text-xs text-muted-foreground mt-1 flex-wrap">
                                      <span>{formatFileSize(file.fileSize)}</span>
                                      <span>•</span>
                                      <span>{t.uploadedOn || "Uploaded"}: {formatDateShort(file.createdAt)}</span>
                                      {file.description && (
                                        <>
                                          <span>•</span>
                                          <span className="italic">{file.description}</span>
                                        </>
                                      )}
                                    </div>
                                  </div>
                                  <div className="flex items-center gap-2 flex-shrink-0">
                                    <Button
                                      variant="outline"
                                      size="icon"
                                      onClick={() => handleFileDownload(file)}
                                      data-testid={`button-download-file-${file.id}`}
                                    >
                                      <Download className="h-4 w-4" />
                                    </Button>
                                    <Dialog 
                                      open={deleteDialogOpen && fileToDelete?.id === file.id}
                                      onOpenChange={(open) => {
                                        setDeleteDialogOpen(open);
                                        if (!open) setFileToDelete(null);
                                      }}
                                    >
                                      <DialogTrigger asChild>
                                        <Button
                                          variant="outline"
                                          size="icon"
                                          onClick={() => setFileToDelete(file)}
                                          data-testid={`button-delete-file-${file.id}`}
                                        >
                                          <Trash2 className="h-4 w-4 text-destructive" />
                                        </Button>
                                      </DialogTrigger>
                                      <DialogContent>
                                        <DialogHeader>
                                          <DialogTitle className="flex items-center gap-2">
                                            <AlertCircle className="h-5 w-5 text-destructive" />
                                            {t.confirmDeleteFile || "Delete File?"}
                                          </DialogTitle>
                                          <DialogDescription>
                                            {t.actionCannotBeUndone || "This action cannot be undone."} 
                                            <br />
                                            <strong>{file.fileName}</strong>
                                          </DialogDescription>
                                        </DialogHeader>
                                        <DialogFooter className="flex-col gap-2 sm:flex-row">
                                          <Button
                                            variant="outline"
                                            onClick={() => {
                                              setDeleteDialogOpen(false);
                                              setFileToDelete(null);
                                            }}
                                            data-testid="button-cancel-delete"
                                          >
                                            {t.cancel || "Cancel"}
                                          </Button>
                                          <Button
                                            variant="destructive"
                                            onClick={() => deleteFileMutation.mutate(file.id)}
                                            disabled={deleteFileMutation.isPending}
                                            data-testid="button-confirm-delete"
                                          >
                                            {deleteFileMutation.isPending ? (
                                              <>
                                                <RefreshCw className="h-4 w-4 mr-2 animate-spin" />
                                                {t.deleting || "Deleting..."}
                                              </>
                                            ) : (
                                              <>
                                                <Trash2 className="h-4 w-4 mr-2" />
                                                {t.deleteFile || "Delete"}
                                              </>
                                            )}
                                          </Button>
                                        </DialogFooter>
                                      </DialogContent>
                                    </Dialog>
                                  </div>
                                </div>
                              ))}
                            </div>
                          )}
                        </CardContent>
                      </Card>
                    );
                  })}
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}
