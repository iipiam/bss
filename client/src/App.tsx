import { Switch, Route } from "wouter";
import { queryClient } from "./lib/queryClient";
import { QueryClientProvider, useQuery } from "@tanstack/react-query";
import { Toaster } from "@/components/ui/toaster";
import { TooltipProvider } from "@/components/ui/tooltip";
import { SidebarProvider, SidebarTrigger } from "@/components/ui/sidebar";
import { AppSidebar } from "@/components/app-sidebar";
import { BranchSelector } from "@/components/branch-selector";
import { ThemeProvider } from "@/components/theme-provider";
import { ThemeToggle } from "@/components/theme-toggle";
import { LanguageProvider, useLanguage } from "@/contexts/LanguageContext";
import { DeviceProvider, useDevice } from "@/contexts/DeviceContext";
import { AuthProvider, useAuth } from "@/lib/auth";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
  DialogFooter,
} from "@/components/ui/dialog";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { useState } from "react";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { LogOut, User as UserIcon, CreditCard, Edit, XCircle } from "lucide-react";
import Dashboard from "@/pages/dashboard";
import Inventory from "@/pages/inventory";
import Menu from "@/pages/menu";
import Recipes from "@/pages/recipes";
import Customers from "@/pages/customers";
import Sales from "@/pages/sales";
import Reports from "@/pages/reports";
import Forecasting from "@/pages/forecasting";
import Analysis from "@/pages/analysis";
import Profitability from "@/pages/profitability";
import Financial from "@/pages/financial";
import Invoices from "@/pages/invoices";
import Bills from "@/pages/bills";
import POS from "@/pages/pos";
import Branches from "@/pages/branches";
import Orders from "@/pages/orders";
import Kitchen from "@/pages/kitchen";
import Procurement from "@/pages/procurement";
import SettingsPage from "@/pages/settings";
import Employees from "@/pages/employees";
import Tutorial from "@/pages/tutorial";
import Shop from "@/pages/shop";
import Profile from "@/pages/profile";
import DeliveryApps from "@/pages/delivery-apps";
import DeliveryAppProfitability from "@/pages/delivery-app-profitability";
import SalesComparison from "@/pages/sales-comparison";
import Login from "@/pages/login";
import Setup from "@/pages/setup";
import ForgotPassword from "@/pages/forgot-password";
import ResetPassword from "@/pages/reset-password";
import NotFound from "@/pages/not-found";
import type { User } from "@shared/schema";

function Router() {
  return (
    <Switch>
      <Route path="/" component={Dashboard} />
      <Route path="/inventory" component={Inventory} />
      <Route path="/menu" component={Menu} />
      <Route path="/recipes" component={Recipes} />
      <Route path="/customers" component={Customers} />
      <Route path="/sales" component={Sales} />
      <Route path="/reports" component={Reports} />
      <Route path="/forecasting" component={Forecasting} />
      <Route path="/analysis" component={Analysis} />
      <Route path="/profitability" component={Profitability} />
      <Route path="/financial" component={Financial} />
      <Route path="/invoices" component={Invoices} />
      <Route path="/bills" component={Bills} />
      <Route path="/pos" component={POS} />
      <Route path="/branches" component={Branches} />
      <Route path="/orders" component={Orders} />
      <Route path="/kitchen" component={Kitchen} />
      <Route path="/procurement" component={Procurement} />
      <Route path="/settings" component={SettingsPage} />
      <Route path="/employees" component={Employees} />
      <Route path="/tutorial" component={Tutorial} />
      <Route path="/shop" component={Shop} />
      <Route path="/profile" component={Profile} />
      <Route path="/delivery-apps" component={DeliveryApps} />
      <Route path="/delivery-app-profitability" component={DeliveryAppProfitability} />
      <Route path="/sales-comparison" component={SalesComparison} />
      <Route component={NotFound} />
    </Switch>
  );
}

function AppContent() {
  const { user, isLoading, logout } = useAuth();
  const { t, isRTL } = useLanguage();
  const { device } = useDevice();
  const [subscriptionDialogOpen, setSubscriptionDialogOpen] = useState(false);
  const [selectedPlan, setSelectedPlan] = useState(user?.subscriptionPlan || 'monthly');
  const [branchesCount, setBranchesCount] = useState(user?.branchesCount || 1);
  
  // Check if this is the first run (no users exist)
  const { data: firstRunCheck, isLoading: isCheckingFirstRun } = useQuery<{ firstRun: boolean }>({
    queryKey: ["/api/auth/check-first-run"],
    retry: false,
  });

  const handleLogout = async () => {
    try {
      // Cancel all pending queries to prevent data saves during logout
      await queryClient.cancelQueries();
      
      // Perform logout
      await logout();
    } catch (error) {
      // Error handling - though user will rarely see this since redirect happens fast
      console.error("Logout failed:", error);
    } finally {
      // Always clear cached data before redirecting, even if logout fails
      queryClient.clear();
      
      // Immediately redirect to login page
      window.location.href = "/";
    }
  };

  // Adjust layout based on device preference
  const getDeviceStyles = () => {
    switch (device) {
      case 'iphone':
        return {
          "--sidebar-width": "16rem",
          "--sidebar-width-icon": "3rem",
        };
      case 'ipad':
        return {
          "--sidebar-width": "14rem",
          "--sidebar-width-icon": "3rem",
        };
      case 'laptop':
      default:
        return {
          "--sidebar-width": "16rem",
          "--sidebar-width-icon": "3rem",
        };
    }
  };

  const style = getDeviceStyles();
  
  // Apply device-specific container styles
  const containerMaxWidth = device === 'iphone' ? '430px' : device === 'ipad' ? '820px' : '100%';

  // Handle public routes (forgot-password, reset-password) before checking authentication
  const currentPath = window.location.pathname;
  if (currentPath === "/forgot-password") {
    return <ForgotPassword />;
  }
  if (currentPath === "/reset-password") {
    return <ResetPassword />;
  }

  // Show loading state
  if (isLoading || isCheckingFirstRun) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary mx-auto mb-4"></div>
          <p className="text-muted-foreground">Loading...</p>
        </div>
      </div>
    );
  }

  // Show setup page if no users exist (first run)
  if (firstRunCheck?.firstRun) {
    return <Setup />;
  }

  // Show login page if not authenticated
  if (!user) {
    return <Login />;
  }

  // Show main app if authenticated with device-responsive layout
  return (
    <SidebarProvider style={style as React.CSSProperties} defaultOpen={device !== 'iphone'}>
      <div className="flex h-screen w-full justify-center bg-background">
        <div className={`flex h-screen w-full ${isRTL ? 'flex-row-reverse' : ''}`} style={{ maxWidth: containerMaxWidth }}>
          <AppSidebar />
          <div className="flex flex-col flex-1 overflow-hidden">
            <header className="flex items-center justify-between p-4 border-b h-16 flex-shrink-0">
              <div className="flex items-center gap-4">
                <SidebarTrigger data-testid="button-sidebar-toggle" />
                <BranchSelector />
              </div>
              <div className="flex items-center gap-2">
                <ThemeToggle />
                <DropdownMenu>
                  <DropdownMenuTrigger asChild>
                    <Button variant="ghost" size="icon" data-testid="button-user-menu">
                      <UserIcon className="h-5 w-5" />
                    </Button>
                  </DropdownMenuTrigger>
                  <DropdownMenuContent align="end" className="w-72">
                    <DropdownMenuLabel>
                      <div className="flex flex-col space-y-1">
                        <span className="font-semibold text-base">{user?.fullName}</span>
                        <span className="text-xs text-muted-foreground">{user?.email}</span>
                      </div>
                    </DropdownMenuLabel>
                    <DropdownMenuSeparator />
                    <div className="px-2 py-2 space-y-2">
                      <div className="flex flex-col space-y-0.5">
                        <span className="text-xs font-medium text-muted-foreground">Subscription Plan</span>
                        <span className="text-sm font-semibold capitalize">{user?.subscriptionPlan}</span>
                      </div>
                      <div className="flex flex-col space-y-0.5">
                        <span className="text-xs font-medium text-muted-foreground">Commercial Registration</span>
                        <span className="text-sm font-mono">{user?.commercialRegistration || 'N/A'}</span>
                      </div>
                      <div className="flex flex-col space-y-0.5">
                        <span className="text-xs font-medium text-muted-foreground">Role</span>
                        <span className="text-sm capitalize">{user?.role}</span>
                      </div>
                    </div>
                    <DropdownMenuSeparator />
                    <Dialog open={subscriptionDialogOpen} onOpenChange={setSubscriptionDialogOpen}>
                      <DialogTrigger asChild>
                        <DropdownMenuItem onSelect={(e) => e.preventDefault()} data-testid="button-manage-subscription">
                          <CreditCard className="mr-2 h-4 w-4" />
                          Manage Subscription
                        </DropdownMenuItem>
                      </DialogTrigger>
                      <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
                        <DialogHeader>
                          <DialogTitle className="text-2xl font-bold bg-gradient-to-r from-purple-500 to-pink-500 bg-clip-text text-transparent">
                            Manage Your Subscription
                          </DialogTitle>
                          <DialogDescription>
                            Upgrade, modify, or cancel your subscription plan
                          </DialogDescription>
                        </DialogHeader>
                        
                        <div className="space-y-6 py-4">
                          <div className="space-y-2">
                            <Label htmlFor="branches">Number of Branches</Label>
                            <Input
                              id="branches"
                              type="number"
                              min="1"
                              value={branchesCount}
                              onChange={(e) => setBranchesCount(parseInt(e.target.value) || 1)}
                              data-testid="input-branches-count"
                            />
                            <p className="text-xs text-muted-foreground">
                              First branch included. Additional branches: 7 SAR/week, 20 SAR/month, 240 SAR/year each
                            </p>
                          </div>

                          <div className="space-y-3">
                            <Label>Select Plan</Label>
                            <RadioGroup value={selectedPlan} onValueChange={setSelectedPlan}>
                              <div className={`flex items-center space-x-2 p-4 rounded-lg border-2 transition-colors cursor-pointer ${
                                selectedPlan === 'weekly' ? 'border-primary bg-primary/5' : 'border-border hover:border-primary/50'
                              }`} onClick={() => setSelectedPlan('weekly')}>
                                <RadioGroupItem value="weekly" id="sub-weekly" />
                                <Label htmlFor="sub-weekly" className="flex-1 cursor-pointer">
                                  <div className="flex items-center justify-between">
                                    <div>
                                      <p className="font-semibold">Weekly</p>
                                      <p className="text-sm text-muted-foreground">Billed weekly</p>
                                      {branchesCount > 1 && (
                                        <p className="text-xs text-muted-foreground mt-1">{branchesCount} branches</p>
                                      )}
                                    </div>
                                    <div className="text-right">
                                      <p className="text-xl font-bold">{(39.90 + (branchesCount - 1) * 7).toFixed(2)} SAR</p>
                                      <p className="text-xs text-muted-foreground">per week</p>
                                    </div>
                                  </div>
                                </Label>
                              </div>

                              <div className={`flex items-center space-x-2 p-4 rounded-lg border-2 transition-colors cursor-pointer ${
                                selectedPlan === 'monthly' ? 'border-primary bg-primary/5' : 'border-border hover:border-primary/50'
                              }`} onClick={() => setSelectedPlan('monthly')}>
                                <RadioGroupItem value="monthly" id="sub-monthly" />
                                <Label htmlFor="sub-monthly" className="flex-1 cursor-pointer">
                                  <div className="flex items-center justify-between">
                                    <div>
                                      <p className="font-semibold">Monthly</p>
                                      <p className="text-sm text-muted-foreground">Billed monthly</p>
                                      {branchesCount > 1 && (
                                        <p className="text-xs text-muted-foreground mt-1">{branchesCount} branches</p>
                                      )}
                                    </div>
                                    <div className="text-right">
                                      <p className="text-xl font-bold">{(119.75 + (branchesCount - 1) * 20).toFixed(2)} SAR</p>
                                      <p className="text-xs text-muted-foreground">per month</p>
                                    </div>
                                  </div>
                                </Label>
                              </div>

                              <div className={`flex items-center space-x-2 p-4 rounded-lg border-2 transition-colors cursor-pointer ${
                                selectedPlan === 'yearly' ? 'border-primary bg-primary/5' : 'border-border hover:border-primary/50'
                              }`} onClick={() => setSelectedPlan('yearly')}>
                                <RadioGroupItem value="yearly" id="sub-yearly" />
                                <Label htmlFor="sub-yearly" className="flex-1 cursor-pointer">
                                  <div className="flex items-center justify-between">
                                    <div className="flex items-center gap-2">
                                      <div>
                                        <p className="font-semibold">Yearly</p>
                                        <p className="text-sm text-muted-foreground">Billed yearly</p>
                                        {branchesCount > 1 && (
                                          <p className="text-xs text-muted-foreground mt-1">{branchesCount} branches</p>
                                        )}
                                      </div>
                                      <Badge variant="default" className="bg-green-600 hover:bg-green-700">
                                        Save 17%
                                      </Badge>
                                    </div>
                                    <div className="text-right">
                                      <p className="text-xl font-bold">{(1197.50 + (branchesCount - 1) * 240).toFixed(2)} SAR</p>
                                      <p className="text-xs text-muted-foreground">per year</p>
                                    </div>
                                  </div>
                                </Label>
                              </div>
                            </RadioGroup>
                            <p className="text-xs text-muted-foreground">
                              All prices include 15% VAT as required by Saudi law
                            </p>
                          </div>

                          <div className="bg-muted/50 p-4 rounded-lg space-y-2">
                            <h4 className="font-semibold">Current Plan Summary</h4>
                            <div className="grid grid-cols-2 gap-2 text-sm">
                              <span className="text-muted-foreground">Current:</span>
                              <span className="font-medium capitalize">{user?.subscriptionPlan}</span>
                              <span className="text-muted-foreground">Branches:</span>
                              <span className="font-medium">{user?.branchesCount || 1}</span>
                              <span className="text-muted-foreground">Status:</span>
                              <Badge variant={user?.subscriptionStatus === 'active' ? 'default' : 'secondary'}>
                                {user?.subscriptionStatus}
                              </Badge>
                            </div>
                          </div>
                        </div>

                        <DialogFooter className="flex gap-2">
                          <Button
                            variant="destructive"
                            onClick={() => {
                              if (confirm('Are you sure you want to cancel your subscription?')) {
                                alert('Subscription cancellation requested. Please contact support.');
                                setSubscriptionDialogOpen(false);
                              }
                            }}
                            data-testid="button-cancel-subscription"
                          >
                            <XCircle className="mr-2 h-4 w-4" />
                            Cancel Subscription
                          </Button>
                          <Button
                            onClick={() => {
                              alert(`Subscription updated to ${selectedPlan} with ${branchesCount} branches. Changes will be reflected in the next billing cycle.`);
                              setSubscriptionDialogOpen(false);
                            }}
                            data-testid="button-update-subscription"
                          >
                            <Edit className="mr-2 h-4 w-4" />
                            Update Plan
                          </Button>
                        </DialogFooter>
                      </DialogContent>
                    </Dialog>
                    <DropdownMenuSeparator />
                    <DropdownMenuItem onClick={handleLogout} data-testid="button-logout-header">
                      <LogOut className="mr-2 h-4 w-4" />
                      {t.logout}
                    </DropdownMenuItem>
                  </DropdownMenuContent>
                </DropdownMenu>
              </div>
            </header>
            <main className={`flex-1 overflow-auto device-${device}`} data-device={device}>
              <Router />
            </main>
            <footer className="border-t py-3 px-4 flex-shrink-0" data-testid="branding-footer">
              <p className="text-xs text-center text-muted-foreground">
                Made By <span className="font-semibold bg-gradient-to-r from-primary to-primary/70 bg-clip-text text-transparent">Saudi Kangal</span>
              </p>
            </footer>
          </div>
        </div>
      </div>
    </SidebarProvider>
  );
}

export default function App() {
  return (
    <QueryClientProvider client={queryClient}>
      <ThemeProvider>
        <LanguageProvider>
          <TooltipProvider>
            <AuthProvider>
              <DeviceProvider>
                <AppContent />
              </DeviceProvider>
            </AuthProvider>
            <Toaster />
          </TooltipProvider>
        </LanguageProvider>
      </ThemeProvider>
    </QueryClientProvider>
  );
}
