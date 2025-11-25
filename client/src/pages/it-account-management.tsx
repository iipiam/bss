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
  RefreshCw
} from "lucide-react";

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

export default function ITAccountManagement() {
  const { user, accountType, isLoading: authLoading } = useAuth();
  const { t } = useLanguage();
  const { device } = useDevice();
  const { toast } = useToast();
  const [, navigate] = useLocation();
  
  // Device-specific layout settings
  const layout = {
    padding: device === 'iphone' ? 'p-3' : device === 'ipad' ? 'p-4' : 'p-6',
    spaceY: device === 'iphone' ? 'space-y-3' : device === 'ipad' ? 'space-y-4' : 'space-y-6',
    text3Xl: device === 'iphone' ? 'text-xl' : device === 'ipad' ? 'text-2xl' : 'text-3xl',
  };

  const [searchQuery, setSearchQuery] = useState("");
  const [statusFilter, setStatusFilter] = useState<"all" | "active" | "disabled">("all");
  const [selectedAccount, setSelectedAccount] = useState<Account | null>(null);
  const [passwordDialogOpen, setPasswordDialogOpen] = useState(false);
  const [newPassword, setNewPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [confirmPassword, setConfirmPassword] = useState("");

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

  // Fetch all accounts
  const { data: accounts = [], isLoading, refetch } = useQuery<Account[]>({
    queryKey: ['/api/it/all-accounts'],
    enabled: !!user && accountType === 'it',
    refetchInterval: 30000,
  });

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

  const formatDate = (dateStr: string | null) => {
    if (!dateStr) return "Never";
    return new Date(dateStr).toLocaleString();
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
    <div className={`${layout.padding} ${layout.spaceY}`}>
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
          onClick={() => refetch()}
          data-testid="button-refresh"
        >
          <RefreshCw className="h-4 w-4 mr-2" />
          {t.refresh || "Refresh"}
        </Button>
      </div>

      {/* Stats Cards */}
      <div className="grid gap-4 md:grid-cols-3">
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
          
          <div className="flex flex-wrap gap-4 pt-4">
            <div className="relative flex-1 min-w-[200px]">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <Input
                placeholder={t.searchAccounts || "Search accounts..."}
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="pl-10"
                data-testid="input-search"
              />
            </div>
            <div className="flex gap-2">
              <Button
                variant={statusFilter === "all" ? "default" : "outline"}
                size="sm"
                onClick={() => setStatusFilter("all")}
                data-testid="button-filter-all"
              >
                {t.all || "All"}
              </Button>
              <Button
                variant={statusFilter === "active" ? "default" : "outline"}
                size="sm"
                onClick={() => setStatusFilter("active")}
                data-testid="button-filter-active"
              >
                <CheckCircle className="h-4 w-4 mr-1" />
                {t.active || "Active"}
              </Button>
              <Button
                variant={statusFilter === "disabled" ? "default" : "outline"}
                size="sm"
                onClick={() => setStatusFilter("disabled")}
                data-testid="button-filter-disabled"
              >
                <XCircle className="h-4 w-4 mr-1" />
                {t.disabled || "Disabled"}
              </Button>
            </div>
          </div>
        </CardHeader>
        <CardContent>
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
                      </TableCell>
                    </TableRow>
                  ))
                )}
              </TableBody>
            </Table>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
