import { useState } from "react";
import { useAuth } from "@/lib/auth";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Label } from "@/components/ui/label";
import { useToast } from "@/hooks/use-toast";
import { apiRequest } from "@/lib/queryClient";
import { UtensilsCrossed, User } from "lucide-react";
import { useLanguage } from "@/contexts/LanguageContext";
import kangalLogo from "@assets/SaudiKangal_1762538198513.png";

export default function Setup() {
  const [formData, setFormData] = useState({
    username: "",
    password: "",
    confirmPassword: "",
    fullName: "",
    email: "",
    phone: "",
  });
  const [isLoading, setIsLoading] = useState(false);
  const { refetchUser } = useAuth();
  const { toast } = useToast();
  const { t } = useLanguage();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (formData.password !== formData.confirmPassword) {
      toast({
        title: t.passwordsDontMatch,
        description: t.passwordsDontMatchDesc,
        variant: "destructive",
      });
      return;
    }

    if (formData.password.length < 6) {
      toast({
        title: t.passwordTooShort,
        description: t.passwordTooShortDesc,
        variant: "destructive",
      });
      return;
    }

    setIsLoading(true);

    try {
      // Create admin user
      await apiRequest("POST", "/api/users", {
        username: formData.username,
        password: formData.password,
        fullName: formData.fullName,
        email: formData.email,
        phone: formData.phone,
        role: "admin",
        permissions: {
          dashboard: true,
          inventory: true,
          menu: true,
          recipes: true,
          branches: true,
          procurement: true,
          pos: true,
          orders: true,
          kitchen: true,
          sales: true,
          reports: true,
          forecasting: true,
          analysis: true,
          settings: true,
          financial: true,
          employees: true,
        },
        branchId: null,
        active: true,
      });

      // Auto-login after setup
      await apiRequest("POST", "/api/auth/login", {
        username: formData.username,
        password: formData.password,
      });

      await refetchUser();

      toast({
        title: "Setup complete!",
        description: "Your admin account has been created successfully",
      });
    } catch (error: any) {
      toast({
        title: "Setup failed",
        description: error.message || t.failedToCreateAdminAccount,
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="flex items-center justify-center min-h-screen bg-gradient-to-br from-primary/10 to-primary/5 p-4">
      <div className="flex flex-col items-center gap-6 w-full max-w-2xl">
        <Card className="w-full">
        <CardHeader className="space-y-4 text-center">
          <div className="mx-auto bg-primary/10 p-4 rounded-full w-fit">
            <UtensilsCrossed className="h-12 w-12 text-primary" />
          </div>
          <div>
            <CardTitle className="text-3xl">Welcome to RestoPOS</CardTitle>
            <CardDescription>Create your administrator account to get started</CardDescription>
          </div>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSubmit} className="space-y-6">
            <div className="space-y-4">
              <h3 className="text-lg font-semibold flex items-center gap-2">
                <User className="h-5 w-5" />
                Account Information
              </h3>
              <div className="grid gap-4 sm:grid-cols-2">
                <div className="space-y-2">
                  <Label htmlFor="fullName">Full Name *</Label>
                  <Input
                    id="fullName"
                    type="text"
                    placeholder="John Doe"
                    value={formData.fullName}
                    onChange={(e) => setFormData({ ...formData, fullName: e.target.value })}
                    required
                    data-testid="input-fullname"
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="username">Username *</Label>
                  <Input
                    id="username"
                    type="text"
                    placeholder="admin"
                    value={formData.username}
                    onChange={(e) => setFormData({ ...formData, username: e.target.value })}
                    required
                    data-testid="input-username"
                  />
                </div>
              </div>

              <div className="grid gap-4 sm:grid-cols-2">
                <div className="space-y-2">
                  <Label htmlFor="email">Email</Label>
                  <Input
                    id="email"
                    type="email"
                    placeholder="admin@restaurant.sa"
                    value={formData.email}
                    onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                    data-testid="input-email"
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="phone">Phone</Label>
                  <Input
                    id="phone"
                    type="tel"
                    placeholder="+966 11 234 5678"
                    value={formData.phone}
                    onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                    data-testid="input-phone"
                  />
                </div>
              </div>

              <div className="grid gap-4 sm:grid-cols-2">
                <div className="space-y-2">
                  <Label htmlFor="password">Password *</Label>
                  <Input
                    id="password"
                    type="password"
                    placeholder="Min. 6 characters"
                    value={formData.password}
                    onChange={(e) => setFormData({ ...formData, password: e.target.value })}
                    required
                    data-testid="input-password"
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="confirmPassword">Confirm Password *</Label>
                  <Input
                    id="confirmPassword"
                    type="password"
                    placeholder="Re-enter password"
                    value={formData.confirmPassword}
                    onChange={(e) => setFormData({ ...formData, confirmPassword: e.target.value })}
                    required
                    data-testid="input-confirm-password"
                  />
                </div>
              </div>
            </div>

            <Button type="submit" className="w-full" disabled={isLoading} data-testid="button-setup">
              {isLoading ? "Creating account..." : "Create Admin Account"}
            </Button>
          </form>
        </CardContent>
        </Card>
        
        {/* Branding Footer */}
        <div className="text-center branding-slide" data-testid="branding-footer">
          <div className="flex items-center justify-center gap-3">
            <img src={kangalLogo} alt="Saudi Kangal Logo" className="h-10 w-10 object-contain" />
            <p className="text-sm text-muted-foreground">
              Made By <span className="font-semibold bg-gradient-to-r from-primary to-primary/70 bg-clip-text text-transparent">Saudi Kangal</span>
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
