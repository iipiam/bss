import { Switch, Route, useLocation } from "wouter";
import { queryClient } from "./lib/queryClient";
import { QueryClientProvider, useQuery } from "@tanstack/react-query";
import { Toaster } from "@/components/ui/toaster";
import { TooltipProvider } from "@/components/ui/tooltip";
import { SidebarProvider, SidebarTrigger } from "@/components/ui/sidebar";
import { AppSidebar } from "@/components/app-sidebar";
import { BranchSelector } from "@/components/branch-selector";
import { ThemeProvider } from "@/components/theme-provider";
import { ThemeToggle } from "@/components/theme-toggle";
import { LanguageToggle } from "@/components/language-toggle";
import { DeviceSelector } from "@/components/device-selector";
import { LanguageProvider, useLanguage } from "@/contexts/LanguageContext";
import { DeviceProvider, useDevice } from "@/contexts/DeviceContext";
import { BranchProvider } from "@/contexts/BranchContext";
import { NotificationProvider } from "@/contexts/NotificationContext";
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
import { useState, useEffect, lazy, Suspense } from "react";
import { useMutation } from "@tanstack/react-query";
import { apiRequest } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { LogOut, User as UserIcon, CreditCard, Edit, XCircle, X, Loader2 } from "lucide-react";
import { ErrorBoundary } from "@/components/ErrorBoundary";
import type { User } from "@shared/schema";
import kinzhalLogo from "@assets/Kinzhal_logo_1768960890639.png";

// Lazy-loaded pages for code splitting - reduces initial bundle size
const Dashboard = lazy(() => import("@/pages/dashboard"));
const Inventory = lazy(() => import("@/pages/inventory"));
const Menu = lazy(() => import("@/pages/menu"));
const Recipes = lazy(() => import("@/pages/recipes"));
const Customers = lazy(() => import("@/pages/customers"));
const Sales = lazy(() => import("@/pages/sales"));
const Reports = lazy(() => import("@/pages/reports"));
const Forecasting = lazy(() => import("@/pages/forecasting"));
const Analysis = lazy(() => import("@/pages/analysis"));
const Profitability = lazy(() => import("@/pages/profitability"));
const MenuProfitability = lazy(() => import("@/pages/menu-profitability"));
const Financial = lazy(() => import("@/pages/financial"));
const Invoices = lazy(() => import("@/pages/invoices"));
const VatReports = lazy(() => import("@/pages/vat-reports"));
const Bills = lazy(() => import("@/pages/bills"));
const POS = lazy(() => import("@/pages/pos"));
const Branches = lazy(() => import("@/pages/branches"));
const Orders = lazy(() => import("@/pages/orders"));
const Kitchen = lazy(() => import("@/pages/kitchen"));
const Procurement = lazy(() => import("@/pages/procurement"));
const SettingsPage = lazy(() => import("@/pages/settings"));
const Employees = lazy(() => import("@/pages/employees"));
const Tutorial = lazy(() => import("@/pages/tutorial"));
const Shop = lazy(() => import("@/pages/shop"));
const Profile = lazy(() => import("@/pages/profile"));
const DeliveryApps = lazy(() => import("@/pages/delivery-apps"));
const DeliveryAppProfitability = lazy(() => import("@/pages/delivery-app-profitability"));
const SalesComparison = lazy(() => import("@/pages/sales-comparison"));
const Investors = lazy(() => import("@/pages/investors"));
const InvestorsList = lazy(() => import("@/pages/investors-list"));
const InvestmentAgreementTemplates = lazy(() => import("@/pages/investment-agreement-templates"));
const Support = lazy(() => import("@/pages/support"));
const SupportDetail = lazy(() => import("@/pages/support-detail"));
const ITDashboard = lazy(() => import("@/pages/it-dashboard"));
const Performance = lazy(() => import("@/pages/performance"));
const ITAccountManagement = lazy(() => import("@/pages/it-account-management"));
const BusinessManagement = lazy(() => import("@/pages/business-management"));
const Chat = lazy(() => import("@/pages/chat"));
const PaymentTest = lazy(() => import("@/pages/payment-test"));
const PasswordManager = lazy(() => import("@/pages/password-manager"));
const Licenses = lazy(() => import("@/pages/licenses"));
const Violations = lazy(() => import("@/pages/violations"));
const ActivityLog = lazy(() => import("@/pages/activity-log"));
const PrinterSettings = lazy(() => import("@/pages/printer-settings"));
const ZatcaSettings = lazy(() => import("@/pages/zatca-settings"));
const PaymentSuccess = lazy(() => import("@/pages/payment-success"));
const PaymentFailed = lazy(() => import("@/pages/payment-failed"));
const Contracts = lazy(() => import("@/pages/contracts"));
const Valuations = lazy(() => import("@/pages/valuations"));
const ServiceProjects = lazy(() => import("@/pages/service-projects"));
const Quotations = lazy(() => import("@/pages/quotations"));
const ServiceCatalogPage = lazy(() => import("@/pages/service-catalog"));
const Contractors = lazy(() => import("@/pages/contractors"));
const ProjectDetail = lazy(() => import("@/pages/project-detail"));
const CompanySettingsPage = lazy(() => import("@/pages/company-settings"));
const MealSubscriptions = lazy(() => import("@/pages/meal-subscriptions"));
const CateringContracts = lazy(() => import("@/pages/catering-contracts"));
const Marketing = lazy(() => import("@/pages/marketing"));
const CompanyProfile = lazy(() => import("@/pages/company-profile"));
const InspectionTools = lazy(() => import("@/pages/inspection-tools"));
const AppDiagram = lazy(() => import("@/pages/app-diagram"));
const NotFound = lazy(() => import("@/pages/not-found"));

// Auth pages loaded eagerly to avoid Suspense issues with AuthProvider
import Login from "@/pages/login";
import ForgotPassword from "@/pages/forgot-password";
import ResetPassword from "@/pages/reset-password";
import EmergencyReset from "@/pages/emergency-reset";

// Loading fallback component for lazy-loaded pages
function PageLoader() {
  return (
    <div className="flex items-center justify-center min-h-[400px]">
      <div className="text-center">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary mx-auto mb-2"></div>
        <p className="text-sm text-muted-foreground">Loading...</p>
      </div>
    </div>
  );
}

const SERVICE_BUSINESS_TYPES = ['design_services', 'installation_services', 'it_services'];

function BusinessTypeGuard({ allowedTypes, children }: { allowedTypes: string[]; children: React.ReactNode }) {
  const { restaurant } = useAuth();
  const [, setLocation] = useLocation();
  const businessType = (restaurant as any)?.businessType || 'restaurant';
  const isAllowed = allowedTypes.includes(businessType);
  useEffect(() => {
    if (!isAllowed) setLocation("/");
  }, [isAllowed, setLocation]);
  if (!isAllowed) return <PageLoader />;
  return <>{children}</>;
}

function Router() {
  return (
    <Suspense fallback={<PageLoader />}>
      <Switch>
        <Route path="/" component={Dashboard} />
        <Route path="/inventory" component={Inventory} />
        <Route path="/menu" component={Menu} />
        <Route path="/recipes" component={Recipes} />
        <Route path="/licenses" component={Licenses} />
        <Route path="/customers" component={Customers} />
        <Route path="/sales" component={Sales} />
        <Route path="/reports" component={Reports} />
        <Route path="/forecasting" component={Forecasting} />
        <Route path="/analysis" component={Analysis} />
        <Route path="/profitability" component={Profitability} />
        <Route path="/menu-profitability" component={MenuProfitability} />
        <Route path="/financial" component={Financial} />
        <Route path="/invoices" component={Invoices} />
        <Route path="/vat-reports" component={VatReports} />
        <Route path="/bills" component={Bills} />
        <Route path="/violations" component={Violations} />
        <Route path="/pos" component={POS} />
        <Route path="/branches" component={Branches} />
        <Route path="/orders" component={Orders} />
        <Route path="/kitchen" component={Kitchen} />
        <Route path="/procurement" component={Procurement} />
        <Route path="/settings" component={SettingsPage} />
        <Route path="/printer-settings" component={PrinterSettings} />
        <Route path="/company-profile" component={CompanyProfile} />
        <Route path="/zatca-settings" component={ZatcaSettings} />
        <Route path="/employees" component={Employees} />
        <Route path="/activity-log" component={ActivityLog} />
        <Route path="/password-manager" component={PasswordManager} />
        <Route path="/tutorial" component={Tutorial} />
        <Route path="/shop" component={Shop} />
        <Route path="/profile" component={Profile} />
        <Route path="/delivery-apps">{() => <BusinessTypeGuard allowedTypes={['restaurant']}><DeliveryApps /></BusinessTypeGuard>}</Route>
        <Route path="/delivery-app-profitability">{() => <BusinessTypeGuard allowedTypes={['restaurant']}><DeliveryAppProfitability /></BusinessTypeGuard>}</Route>
        <Route path="/sales-comparison" component={SalesComparison} />
        <Route path="/investors" component={Investors} />
        <Route path="/investors/list" component={InvestorsList} />
        <Route path="/investment-agreement-templates" component={InvestmentAgreementTemplates} />
        <Route path="/support" component={Support} />
        <Route path="/support/:id" component={SupportDetail} />
        <Route path="/it-dashboard" component={ITDashboard} />
        <Route path="/performance" component={Performance} />
        <Route path="/it-account-management" component={ITAccountManagement} />
        <Route path="/business-management" component={BusinessManagement} />
        <Route path="/chat" component={Chat} />
        <Route path="/payment-test" component={PaymentTest} />
        <Route path="/payment-success" component={PaymentSuccess} />
        <Route path="/payment-failed" component={PaymentFailed} />
        <Route path="/contracts" component={Contracts} />
        <Route path="/valuations" component={Valuations} />
        <Route path="/service-projects/:id" component={ProjectDetail} />
        <Route path="/service-projects" component={ServiceProjects} />
        <Route path="/quotations" component={Quotations} />
        <Route path="/service-catalog" component={ServiceCatalogPage} />
        <Route path="/contractors" component={Contractors} />
        <Route path="/company-settings" component={CompanySettingsPage} />
        <Route path="/meal-subscriptions" component={MealSubscriptions} />
        <Route path="/catering-contracts" component={CateringContracts} />
        <Route path="/marketing" component={Marketing} />
        <Route path="/inspection-tools" component={InspectionTools} />
        <Route path="/app-diagram" component={AppDiagram} />
        <Route component={NotFound} />
      </Switch>
    </Suspense>
  );
}

function AppContent() {
  const { user, restaurant, isLoading, logout, accountType } = useAuth();
  const { t, isRTL } = useLanguage();
  const { device } = useDevice();
  const [location, setLocation] = useLocation();
  const { toast } = useToast();
  const [subscriptionDialogOpen, setSubscriptionDialogOpen] = useState(false);
  const [cancelDialogOpen, setCancelDialogOpen] = useState(false);
  const [cancelReason, setCancelReason] = useState<"mistake" | "client_request">("mistake");
  const [selectedPlan, setSelectedPlan] = useState(restaurant?.subscriptionPlan || 'monthly');
  const [branchesCount, setBranchesCount] = useState(restaurant?.branchesCount || 1);
  const [expiryAlertDismissed, setExpiryAlertDismissed] = useState(false);
  const [isUpdatingSubscription, setIsUpdatingSubscription] = useState(false);

  const cancelSubscriptionMutation = useMutation({
    mutationFn: async (reason: "mistake" | "client_request") => {
      const response = await apiRequest("POST", "/api/subscription/cancel", { reason });
      return response.json();
    },
    onSuccess: (data) => {
      if (data.pdfBase64) {
        const link = document.createElement('a');
        link.href = `data:application/pdf;base64,${data.pdfBase64}`;
        link.download = `refund-clearance-${Date.now()}.pdf`;
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
        toast({
          title: t.subscriptionCanceled || "Subscription Cancelled",
          description: t.refundClearanceGenerated || "Refund clearance invoice has been downloaded.",
        });
      } else {
        toast({
          title: t.subscriptionCanceled || "Subscription Cancelled",
          description: t.subscriptionCancelledDesc || "Your subscription has been cancelled.",
          variant: "destructive",
        });
      }
      queryClient.invalidateQueries({ queryKey: ["/api/profile"] });
      queryClient.invalidateQueries({ queryKey: ["/api/auth/me"] });
      setCancelDialogOpen(false);
      setSubscriptionDialogOpen(false);
    },
    onError: () => {
      toast({
        title: t.cancellationFailed || "Cancellation Failed",
        description: t.cancelSubscriptionError || "Failed to cancel subscription. Please try again.",
        variant: "destructive",
      });
    },
  });

  const calculateRefundPreview = () => {
    if (!restaurant?.subscriptionStartDate || !restaurant?.subscriptionPlan) {
      return { monthsUsed: 0, originalPrice: 0, chargedAmount: 0, refundAmount: 0 };
    }
    const startDate = new Date(restaurant.subscriptionStartDate);
    const now = new Date();
    const msPerMonth = 30.44 * 24 * 60 * 60 * 1000;
    const monthsUsed = Math.max(1, Math.ceil((now.getTime() - startDate.getTime()) / msPerMonth));
    
    let originalPrice = 1990;
    if (restaurant.subscriptionPlan === "premium") originalPrice = 2990;
    if (restaurant.subscriptionPlan === "enterprise") originalPrice = 4990;
    
    const monthlyRate = 199;
    const chargedAmount = monthlyRate * monthsUsed;
    const refundAmount = Math.max(0, originalPrice - chargedAmount);
    
    return { monthsUsed, originalPrice, chargedAmount, refundAmount, monthlyRate };
  };
  
  // Handle IT account redirects using useEffect to avoid render issues
  // IT accounts can access /it-dashboard, /performance, /it-account-management, /business-management, /zatca-settings, and /support routes
  useEffect(() => {
    const allowedITRoutes = ['/it-dashboard', '/performance', '/it-account-management', '/business-management', '/zatca-settings', '/inspection-tools', '/app-diagram'];
    const itOnlyRoutes = ['/it-dashboard', '/performance', '/it-account-management', '/business-management', '/inspection-tools', '/app-diagram'];
    const isAllowedRoute = allowedITRoutes.includes(location) || location.startsWith('/support');

    if (accountType === 'it' && !isAllowedRoute) {
      setLocation('/it-dashboard');
    } else if (accountType && accountType !== 'it' && itOnlyRoutes.includes(location)) {
      setLocation('/');
    }
  }, [accountType, location, setLocation]);

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
  
  // Apply device-specific container styles - use 100% for mobile to fit any screen
  const containerMaxWidth = '100%';

  // Handle public routes (forgot-password, reset-password, emergency-reset) before checking authentication
  if (location === "/forgot-password") {
    return <ForgotPassword />;
  }
  if (location === "/reset-password") {
    return <ResetPassword />;
  }
  if (location === "/emergency-reset") {
    return <EmergencyReset />;
  }

  // Show loading state
  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary mx-auto mb-4"></div>
          <p className="text-muted-foreground">Loading...</p>
        </div>
      </div>
    );
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
          <div className={`flex flex-col flex-1 min-h-0 device-${device}`}>
            <header className="flex items-center justify-between p-4 border-b h-16 flex-shrink-0">
              <div className="flex items-center gap-4">
                <SidebarTrigger data-testid="button-sidebar-toggle" />
                <BranchSelector />
              </div>
              <div className="flex items-center gap-2">
                <DeviceSelector />
                <LanguageToggle />
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
                        <span className="text-xs font-medium text-muted-foreground">{t.subscriptionPlan}</span>
                        <span className="text-sm font-semibold capitalize">{restaurant?.subscriptionPlan}</span>
                      </div>
                      <div className="flex flex-col space-y-0.5">
                        <span className="text-xs font-medium text-muted-foreground">{t.commercialRegistration}</span>
                        <span className="text-sm font-mono">{restaurant?.commercialRegistration || 'N/A'}</span>
                      </div>
                      <div className="flex flex-col space-y-0.5">
                        <span className="text-xs font-medium text-muted-foreground">{t.role}</span>
                        <span className="text-sm capitalize">{user?.role}</span>
                      </div>
                    </div>
                    <DropdownMenuSeparator />
                    <Dialog open={subscriptionDialogOpen} onOpenChange={setSubscriptionDialogOpen}>
                      <DialogTrigger asChild>
                        <DropdownMenuItem onSelect={(e) => e.preventDefault()} data-testid="button-manage-subscription">
                          <CreditCard className="mr-2 h-4 w-4" />
                          {t.manageSubscription}
                        </DropdownMenuItem>
                      </DialogTrigger>
                      <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
                        <DialogHeader>
                          <DialogTitle className="text-2xl font-bold bg-gradient-to-r from-purple-500 to-pink-500 bg-clip-text text-transparent">
                            {t.manageYourSubscription}
                          </DialogTitle>
                          <DialogDescription>
                            {t.upgradeModifyCancel}
                          </DialogDescription>
                        </DialogHeader>
                        
                        <div className="space-y-6 py-4">
                          <div className="space-y-2">
                            <Label htmlFor="branches">{t.numberOfBranches}</Label>
                            <Input
                              id="branches"
                              type="number"
                              min="1"
                              value={branchesCount}
                              onChange={(e) => setBranchesCount(parseInt(e.target.value) || 1)}
                              data-testid="input-branches-count"
                            />
                            <p className="text-xs text-muted-foreground">
                              First branch included. Additional branches: 15 SAR/week, 42.85 SAR/month, 398.63 SAR/year each
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
                                      <p className="text-xl font-bold">{(66.33 + (branchesCount - 1) * 15).toFixed(2)} SAR</p>
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
                                      <p className="text-xl font-bold">{(199 + (branchesCount - 1) * 42.85).toFixed(2)} SAR</p>
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
                                      <p className="text-xl font-bold">{(1990 + (branchesCount - 1) * 398.63).toFixed(2)} SAR</p>
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
                            <h4 className="font-semibold">{t.currentPlanSummary}</h4>
                            <div className="grid grid-cols-2 gap-2 text-sm">
                              <span className="text-muted-foreground">{t.current}:</span>
                              <span className="font-medium capitalize">{restaurant?.subscriptionPlan}</span>
                              <span className="text-muted-foreground">{t.branches}:</span>
                              <span className="font-medium">{restaurant?.branchesCount || 1}</span>
                              <span className="text-muted-foreground">{t.status}:</span>
                              <Badge variant={restaurant?.subscriptionStatus === 'active' ? 'default' : 'secondary'}>
                                {restaurant?.subscriptionStatus}
                              </Badge>
                            </div>
                          </div>
                        </div>

                        <DialogFooter className="flex gap-2">
                          <Button
                            variant="destructive"
                            onClick={() => setCancelDialogOpen(true)}
                            data-testid="button-cancel-subscription"
                          >
                            <XCircle className="mr-2 h-4 w-4" />
                            {t.cancelSubscription}
                          </Button>
                          <Button
                            onClick={async () => {
                              if (isUpdatingSubscription) return;
                              setIsUpdatingSubscription(true);
                              try {
                                const response = await apiRequest("POST", "/api/subscription/update-payment", {
                                  plan: selectedPlan,
                                  branchesCount: branchesCount,
                                });
                                const data = await response.json();
                                if (data.redirectUrl) {
                                  window.location.href = data.redirectUrl;
                                } else {
                                  toast({
                                    title: t.error || "Error",
                                    description: data.error || "Failed to initiate payment",
                                    variant: "destructive",
                                  });
                                  setIsUpdatingSubscription(false);
                                }
                              } catch (error: any) {
                                toast({
                                  title: t.error || "Error",
                                  description: error.message || "Failed to update subscription",
                                  variant: "destructive",
                                });
                                setIsUpdatingSubscription(false);
                              }
                            }}
                            disabled={isUpdatingSubscription}
                            data-testid="button-update-subscription"
                          >
                            {isUpdatingSubscription ? (
                              <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                            ) : (
                              <Edit className="mr-2 h-4 w-4" />
                            )}
                            {isUpdatingSubscription ? (t.loading || "Processing...") : t.updatePlan}
                          </Button>
                        </DialogFooter>
                      </DialogContent>
                    </Dialog>
                    
                    {/* Cancel Subscription Two-Reason Dialog */}
                    <Dialog open={cancelDialogOpen} onOpenChange={setCancelDialogOpen}>
                      <DialogContent className="max-w-md">
                        <DialogHeader>
                          <DialogTitle className="text-xl font-bold text-destructive">
                            {t.cancelSubscription}
                          </DialogTitle>
                          <DialogDescription>
                            {t.deletionReason || "Please select a reason for cancellation"}
                          </DialogDescription>
                        </DialogHeader>
                        
                        <div className="space-y-4 py-4">
                          <RadioGroup
                            value={cancelReason}
                            onValueChange={(value: "mistake" | "client_request") => setCancelReason(value)}
                            className="space-y-3"
                          >
                            <div className={`flex items-start space-x-3 p-3 rounded-lg border cursor-pointer transition-colors ${
                              cancelReason === 'mistake' ? 'border-primary bg-primary/5' : 'border-border hover:border-primary/50'
                            }`} onClick={() => setCancelReason('mistake')}>
                              <RadioGroupItem value="mistake" id="reason-mistake" className="mt-1" />
                              <Label htmlFor="reason-mistake" className="cursor-pointer flex-1">
                                <p className="font-semibold">{t.mistakeSubscription || "Mistake Subscription"}</p>
                                <p className="text-sm text-muted-foreground">{t.mistakeSubscriptionDesc || "This subscription was created by mistake"}</p>
                              </Label>
                            </div>
                            
                            <div className={`flex items-start space-x-3 p-3 rounded-lg border cursor-pointer transition-colors ${
                              cancelReason === 'client_request' ? 'border-primary bg-primary/5' : 'border-border hover:border-primary/50'
                            }`} onClick={() => setCancelReason('client_request')}>
                              <RadioGroupItem value="client_request" id="reason-client" className="mt-1" />
                              <Label htmlFor="reason-client" className="cursor-pointer flex-1">
                                <p className="font-semibold">{t.clientRequest || "By Client Request"}</p>
                                <p className="text-sm text-muted-foreground">{t.clientRequestDesc || "Client requested cancellation with refund"}</p>
                              </Label>
                            </div>
                          </RadioGroup>
                          
                          {cancelReason === 'client_request' && (() => {
                            const { monthsUsed, originalPrice, chargedAmount, refundAmount, monthlyRate } = calculateRefundPreview();
                            return (
                              <div className="bg-muted/50 p-4 rounded-lg space-y-2 border">
                                <h4 className="font-semibold text-sm">{t.refundCalculation || "Refund Calculation"}</h4>
                                <div className="grid grid-cols-2 gap-2 text-sm">
                                  <span className="text-muted-foreground">{t.originalSubscriptionFee || "Original Fee"}:</span>
                                  <span className="font-medium">{originalPrice.toFixed(2)} SAR</span>
                                  <span className="text-muted-foreground">{t.monthlyRate || "Monthly Rate"}:</span>
                                  <span className="font-medium">{monthlyRate} SAR</span>
                                  <span className="text-muted-foreground">{t.monthsUsed || "Months Used"}:</span>
                                  <span className="font-medium">{monthsUsed}</span>
                                  <span className="text-muted-foreground">{t.chargedAmount || "Charged"}:</span>
                                  <span className="font-medium text-destructive">{chargedAmount.toFixed(2)} SAR</span>
                                  <span className="text-muted-foreground font-semibold">{t.refundAmount || "Refund"}:</span>
                                  <span className="font-bold text-green-600">{refundAmount.toFixed(2)} SAR</span>
                                </div>
                              </div>
                            );
                          })()}
                        </div>
                        
                        <DialogFooter className="flex gap-2">
                          <Button variant="outline" onClick={() => setCancelDialogOpen(false)}>
                            {t.cancel}
                          </Button>
                          <Button
                            variant="destructive"
                            onClick={() => cancelSubscriptionMutation.mutate(cancelReason)}
                            disabled={cancelSubscriptionMutation.isPending}
                            data-testid="button-confirm-cancel-subscription"
                          >
                            {cancelSubscriptionMutation.isPending ? (t.processing || "Processing...") : (t.confirmDeleteBtn || "Confirm Cancellation")}
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
            {/* Subscription Expiry Alert */}
            {!expiryAlertDismissed && restaurant?.subscriptionEndDate && (() => {
              const endDate = new Date(restaurant.subscriptionEndDate);
              const now = new Date();
              const daysRemaining = Math.ceil((endDate.getTime() - now.getTime()) / (1000 * 60 * 60 * 24));
              
              // Show alert if subscription expires within 10 days
              if (daysRemaining > 0 && daysRemaining <= 10) {
                return (
                  <div className="px-4 pt-4" data-testid="alert-subscription-expiring">
                    <div className="bg-destructive text-destructive-foreground p-4 rounded-lg border-2 border-destructive shadow-lg">
                      <div className="flex items-start gap-3">
                        <div className="flex-shrink-0 mt-0.5">
                          <svg className="h-5 w-5" fill="currentColor" viewBox="0 0 20 20">
                            <path fillRule="evenodd" d="M8.257 3.099c.765-1.36 2.722-1.36 3.486 0l5.58 9.92c.75 1.334-.213 2.98-1.742 2.98H4.42c-1.53 0-2.493-1.646-1.743-2.98l5.58-9.92zM11 13a1 1 0 11-2 0 1 1 0 012 0zm-1-8a1 1 0 00-1 1v3a1 1 0 002 0V6a1 1 0 00-1-1z" clipRule="evenodd" />
                          </svg>
                        </div>
                        <div className="flex-1">
                          <h3 className="font-semibold text-sm mb-1">
                            {isRTL ? 'تنبيه انتهاء الاشتراك' : 'Subscription Expiring Soon'}
                          </h3>
                          <p className="text-sm">
                            {isRTL 
                              ? `ينتهي اشتراكك في ${endDate.toLocaleDateString('ar-SA')} (${daysRemaining} ${daysRemaining === 1 ? 'يوم' : 'أيام'} متبقية). يرجى التجديد لمواصلة استخدام نظام BlindSpot System (BSS).`
                              : `Your subscription expires on ${endDate.toLocaleDateString('en-GB')} (${daysRemaining} ${daysRemaining === 1 ? 'day' : 'days'} remaining). Please renew to continue using BlindSpot System (BSS).`
                            }
                          </p>
                        </div>
                        <Button
                          variant="ghost"
                          size="icon"
                          className="flex-shrink-0 h-6 w-6 hover:bg-destructive-foreground/20"
                          onClick={() => setExpiryAlertDismissed(true)}
                          data-testid="button-dismiss-expiry-alert"
                        >
                          <X className="h-4 w-4" />
                        </Button>
                      </div>
                    </div>
                  </div>
                );
              }
              return null;
            })()}
            <main 
              className="flex-1 overflow-y-scroll" 
              data-device={device}
              style={(device === 'iphone' || device === 'ipad') ? { paddingTop: '0.5rem' } : undefined}
            >
              <Router />
            </main>
            <footer className="border-t py-3 px-4 flex-shrink-0 branding-slide" data-testid="branding-footer">
              <div className="flex items-center justify-center gap-3">
                <img src={kinzhalLogo} alt="BSS Logo" className="h-12 w-auto object-contain" />
                <p className="text-sm text-muted-foreground">
                  {t.madeBy} <span className="font-semibold bg-gradient-to-r from-primary to-primary/70 bg-clip-text text-transparent">{t.companyName}</span>
                </p>
              </div>
            </footer>
          </div>
        </div>
      </div>
    </SidebarProvider>
  );
}

export default function App() {
  return (
    <ErrorBoundary>
      <QueryClientProvider client={queryClient}>
        <ThemeProvider>
          <TooltipProvider>
            <AuthProvider>
              <LanguageProvider>
                <BranchProvider>
                  <DeviceProvider>
                    <NotificationProvider>
                      <AppContent />
                    </NotificationProvider>
                  </DeviceProvider>
                </BranchProvider>
              </LanguageProvider>
            </AuthProvider>
            <Toaster />
          </TooltipProvider>
        </ThemeProvider>
      </QueryClientProvider>
    </ErrorBoundary>
  );
}
