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
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { LogOut, User as UserIcon } from "lucide-react";
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
      <Route component={NotFound} />
    </Switch>
  );
}

function AppContent() {
  const { user, isLoading, logout } = useAuth();
  const { t } = useLanguage();
  const { device } = useDevice();
  
  // Check if this is the first run (no users exist)
  const { data: firstRunCheck, isLoading: isCheckingFirstRun } = useQuery<{ firstRun: boolean }>({
    queryKey: ["/api/auth/check-first-run"],
    retry: false,
  });

  const handleLogout = async () => {
    try {
      // Cancel all pending mutations and queries to prevent data saves during logout
      await queryClient.cancelQueries();
      await queryClient.cancelMutations();
      
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
    <SidebarProvider style={style as React.CSSProperties}>
      <div className="flex h-screen w-full justify-center bg-background">
        <div className="flex h-screen w-full" style={{ maxWidth: containerMaxWidth }}>
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
                  <DropdownMenuContent align="end">
                    <DropdownMenuLabel>
                      <div className="flex flex-col">
                        <span className="font-semibold">{user?.fullName}</span>
                        <span className="text-xs text-muted-foreground">{user?.role}</span>
                      </div>
                    </DropdownMenuLabel>
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
