import { useState } from "react";
import { useQuery, useMutation } from "@tanstack/react-query";
import { apiRequest, queryClient } from "@/lib/queryClient";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip";
import { InfoTip } from "@/components/ui/info-tip";
import { useToast } from "@/hooks/use-toast";
import { Key, Shield, User, Lock } from "lucide-react";
import type { User as UserType } from "@shared/schema";
import { useAuth } from "@/lib/auth";
import { useLanguage } from "@/contexts/LanguageContext";

export default function PasswordManager() {
  const { t, isRTL } = useLanguage();
  const { user: currentUser } = useAuth();
  const [isResetDialogOpen, setIsResetDialogOpen] = useState(false);
  const [selectedUser, setSelectedUser] = useState<UserType | null>(null);
  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [searchQuery, setSearchQuery] = useState("");
  const { toast } = useToast();

  const { data: users, isLoading } = useQuery<UserType[]>({
    queryKey: ["/api/users"],
  });

  const resetPasswordMutation = useMutation({
    mutationFn: async ({ userId, password }: { userId: string; password: string }) => {
      return await apiRequest("PATCH", `/api/users/${userId}`, { password });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/users"] });
      setIsResetDialogOpen(false);
      setSelectedUser(null);
      setNewPassword("");
      setConfirmPassword("");
      toast({
        title: t.passwordResetSuccessful,
        description: t.passwordResetSuccessfulDesc || `Password has been reset for ${selectedUser?.fullName}`,
      });
    },
    onError: (error: any) => {
      toast({
        title: t.failedToResetPassword,
        description: error.message || ((t as any).errorOccurredResettingPassword || "An error occurred while resetting the password"),
        variant: "destructive",
      });
    },
  });

  const handleResetPassword = () => {
    if (!selectedUser) return;

    if (newPassword.length < 6) {
      toast({
        title: t.invalidPassword || "Invalid Password",
        description: t.passwordTooShortDesc || "Password must be at least 6 characters long",
        variant: "destructive",
      });
      return;
    }

    if (newPassword !== confirmPassword) {
      toast({
        title: t.passwordsDontMatch || "Passwords Don't Match",
        description: t.passwordsDontMatchDesc || "Please make sure both passwords match",
        variant: "destructive",
      });
      return;
    }

    resetPasswordMutation.mutate({
      userId: selectedUser.id,
      password: newPassword,
    });
  };

  const openResetDialog = (user: UserType) => {
    setSelectedUser(user);
    setNewPassword("");
    setConfirmPassword("");
    setIsResetDialogOpen(true);
  };

  const filteredUsers = users?.filter(user =>
    user.username.toLowerCase().includes(searchQuery.toLowerCase()) ||
    user.fullName.toLowerCase().includes(searchQuery.toLowerCase()) ||
    user.email?.toLowerCase().includes(searchQuery.toLowerCase())
  );

  // Check if current user is admin
  if (currentUser?.role !== 'admin') {
    return (
      <div className="container mx-auto py-8 px-4">
        <Card>
          <CardContent className="flex flex-col items-center justify-center py-12">
            <Shield className="h-16 w-16 text-muted-foreground mb-4" />
            <h3 className="text-lg font-semibold mb-2">{(t as any).adminAccessRequired || "Admin Access Required"}</h3>
            <p className="text-muted-foreground text-center">
              {(t as any).adminPrivilegesRequired || "You need administrator privileges to access this page."}
            </p>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <TooltipProvider delayDuration={150}>
    <div className="container mx-auto py-8 px-4">
      <div className="mb-8">
        <div className="flex items-center gap-3 mb-2">
          <div className="bg-primary/10 p-3 rounded-lg">
            <Key className="h-6 w-6 text-primary" />
          </div>
          <h1 className="text-3xl font-bold">{t.passwordManager}</h1>
        </div>
        <p className="text-muted-foreground">
          {(t as any).passwordManagerDesc || "Reset passwords for any user account. Use this to help users who forgot their passwords."}
        </p>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>
            {(t as any).allUserAccounts || "All User Accounts"}
            <InfoTip>{isRTL ? "ابحث عن مستخدم وأعد تعيين كلمة المرور الخاصة به." : "Search for a user and reset their password."}</InfoTip>
          </CardTitle>
          <CardDescription>
            {(t as any).searchAndResetPassword || "Search for a user and reset their password"}
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="mb-6">
            <Input
              placeholder={(t as any).searchByUsernameNameEmail || "Search by username, name, or email..."}
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="max-w-md"
              data-testid="input-search-users"
            />
          </div>

          {isLoading ? (
            <div className="text-center py-8 text-muted-foreground">
              {t.loading || "Loading..."}
            </div>
          ) : filteredUsers && filteredUsers.length > 0 ? (
            <div className="space-y-3">
              {filteredUsers.map((user) => (
                <div
                  key={user.id}
                  className="flex items-center justify-between p-4 border rounded-lg hover-elevate"
                >
                  <div className="flex items-center gap-4">
                    <div className="bg-primary/10 p-2 rounded-full">
                      <User className="h-5 w-5 text-primary" />
                    </div>
                    <div>
                      <div className="flex items-center gap-2 mb-1">
                        <p className="font-semibold">{user.fullName}</p>
                        <Badge variant={user.role === 'admin' ? 'default' : 'secondary'}>
                          {user.role}
                        </Badge>
                        {!user.active && (
                          <Badge variant="destructive">{t.inactive || "Inactive"}</Badge>
                        )}
                      </div>
                      <p className="text-sm text-muted-foreground">
                        <span className="font-medium">{t.username}:</span> {user.username}
                      </p>
                      {user.email && (
                        <p className="text-sm text-muted-foreground">
                          <span className="font-medium">{t.email}:</span> {user.email}
                        </p>
                      )}
                    </div>
                  </div>
                  <Button
                    onClick={() => openResetDialog(user)}
                    variant="outline"
                    size="sm"
                    data-testid={`button-reset-password-${user.username}`}
                  >
                    <Lock className="h-4 w-4 mr-2" />
                    {t.resetPassword}
                  </Button>
                </div>
              ))}
            </div>
          ) : (
            <div className="text-center py-8 text-muted-foreground">
              {searchQuery ? ((t as any).noUsersMatchingSearch || "No users found matching your search") : ((t as any).noUsersFound || "No users found")}
            </div>
          )}
        </CardContent>
      </Card>

      <Dialog open={isResetDialogOpen} onOpenChange={setIsResetDialogOpen}>
        <DialogContent data-testid="dialog-reset-password">
          <DialogHeader>
            <DialogTitle>{t.resetPassword}</DialogTitle>
            <DialogDescription>
              {(t as any).setNewPasswordFor || "Set a new password for"} <strong>{selectedUser?.fullName}</strong> ({selectedUser?.username})
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <div className="space-y-2">
              <Label htmlFor="new-password">{t.newPassword || "New Password"}</Label>
              <Input
                id="new-password"
                type="password"
                placeholder={(t as any).enterNewPasswordMin6 || "Enter new password (min 6 characters)"}
                value={newPassword}
                onChange={(e) => setNewPassword(e.target.value)}
                minLength={6}
                data-testid="input-new-password"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="confirm-password">{t.confirmPassword}</Label>
              <Input
                id="confirm-password"
                type="password"
                placeholder={(t as any).confirmNewPasswordPlaceholder || "Confirm new password"}
                value={confirmPassword}
                onChange={(e) => setConfirmPassword(e.target.value)}
                minLength={6}
                data-testid="input-confirm-password"
              />
            </div>
            <div className="bg-muted p-4 rounded-lg">
              <p className="text-sm text-muted-foreground">
                <strong>{(t as any).noteLabel || "Note"}:</strong> {(t as any).afterResettingInformUser || "After resetting the password, inform the user of their new credentials:"}
              </p>
              <div className="mt-2 p-2 bg-background rounded border">
                <p className="text-sm font-mono">{t.username}: {selectedUser?.username}</p>
                <p className="text-sm font-mono">{t.password}: {newPassword || "******"}</p>
              </div>
            </div>
          </div>
          <div className="flex gap-2 justify-end">
            <Button
              variant="outline"
              onClick={() => setIsResetDialogOpen(false)}
              data-testid="button-cancel"
            >
              {t.cancel}
            </Button>
            <Button
              onClick={handleResetPassword}
              disabled={!newPassword || !confirmPassword || resetPasswordMutation.isPending}
              data-testid="button-confirm-reset"
            >
              {resetPasswordMutation.isPending ? (t.resetting || "Resetting...") : t.resetPassword}
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    </div>
    </TooltipProvider>
  );
}
