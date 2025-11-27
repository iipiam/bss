import {
  LayoutDashboard,
  Package,
  ChefHat,
  DollarSign,
  FileText,
  TrendingUp,
  BarChart3,
  Receipt,
  ShoppingCart,
  Building2,
  ClipboardList,
  Flame,
  ShoppingBag,
  Settings,
  Users,
  Calculator,
  UserCircle,
  FileCheck,
  FileBarChart2,
  HeadphonesIcon,
  Mail,
  MessageCircle,
  BookOpen,
  Store,
  LogOut,
  Truck,
  Key,
  UtensilsCrossed,
  FileKey,
  UserCog,
} from "lucide-react";
import logoImage from "@assets/kinzhal-eagle-logo.jpeg";
import {
  Sidebar,
  SidebarContent,
  SidebarGroup,
  SidebarGroupContent,
  SidebarGroupLabel,
  SidebarHeader,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
} from "@/components/ui/sidebar";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Link, useLocation } from "wouter";
import { useLanguage } from "@/contexts/LanguageContext";
import { useAuth } from "@/lib/auth";
import { useState } from "react";
import { useToast } from "@/hooks/use-toast";
import { queryClient } from "@/lib/queryClient";
import { usePermissions } from "@/hooks/usePermissions";
import type { Permission } from "@shared/permissions";

interface MenuItem {
  title: string;
  url: string;
  icon: React.ForwardRefExoticComponent<any>;
  testId: string;
  gradient: string;
  permission?: Permission;
  businessTypes?: ('restaurant' | 'factory')[]; // If specified, only show for these business types
}

export function AppSidebar() {
  const [location] = useLocation();
  const { t } = useLanguage();
  const { logout, restaurant, accountType } = useAuth();
  const { toast } = useToast();
  const [helpDialogOpen, setHelpDialogOpen] = useState(false);
  const { hasPermission, isAdmin } = usePermissions();
  
  // Get businessType from restaurant data (defaults to 'restaurant' for existing accounts)
  const businessType: 'restaurant' | 'factory' = (restaurant?.businessType as 'restaurant' | 'factory') || 'restaurant';

  const handleLogout = async () => {
    try {
      // Cancel all pending queries to prevent data fetches during logout
      await queryClient.cancelQueries();
      
      // Perform logout
      await logout();
    } catch (error) {
      toast({
        title: t.error,
        description: t.failedToLogout,
        variant: "destructive",
      });
    } finally {
      // Always clear cached data before redirecting, even if logout fails
      queryClient.clear();
      
      // Immediately redirect to login page
      window.location.href = "/";
    }
  };

  // Declarative menu configuration with business type guards
  const allOperations: MenuItem[] = [
    { title: t.pos, url: "/pos", icon: ShoppingCart, testId: "pos", gradient: "from-emerald-500 to-teal-500", permission: 'pos' },
    { title: t.orders, url: "/orders", icon: ClipboardList, testId: "orders", gradient: "from-blue-500 to-cyan-500", permission: 'orders' },
    { title: businessType === 'factory' ? t.workshop : t.kitchen, url: "/kitchen", icon: Flame, testId: "kitchen", gradient: "from-orange-500 to-red-500", permission: 'kitchen' },
    { title: t.deliveryApps, url: "/delivery-apps", icon: Truck, testId: "delivery-apps", gradient: "from-violet-500 to-purple-500", permission: 'deliveryApps', businessTypes: ['restaurant'] },
  ];

  const allManagement: MenuItem[] = [
    { title: t.dashboard, url: "/", icon: LayoutDashboard, testId: "dashboard", gradient: "from-purple-500 to-pink-500", permission: 'dashboard' },
    { title: t.inventory, url: "/inventory", icon: Package, testId: "inventory", gradient: "from-blue-500 to-indigo-500", permission: 'inventory' },
    { title: businessType === 'factory' ? t.products : t.menu, url: "/menu", icon: UtensilsCrossed, testId: "menu", gradient: "from-green-500 to-emerald-500", permission: 'menu' },
    { title: t.recipes, url: "/recipes", icon: ChefHat, testId: "recipes", gradient: "from-yellow-500 to-orange-500", permission: 'recipes', businessTypes: ['restaurant'] },
    { title: t.licenses || "Licenses", url: "/licenses", icon: FileKey, testId: "licenses", gradient: "from-amber-500 to-yellow-500", permission: 'licenses' },
    { title: t.customers, url: "/customers", icon: UserCircle, testId: "customers", gradient: "from-cyan-500 to-blue-500", permission: 'customers' },
    { title: t.investors, url: "/investors", icon: TrendingUp, testId: "investors", gradient: "from-emerald-500 to-green-500", permission: 'reports' },
    { title: t.branches, url: "/branches", icon: Building2, testId: "branches", gradient: "from-indigo-500 to-purple-500", permission: 'branches' },
    { title: t.procurement, url: "/procurement", icon: ShoppingBag, testId: "procurement", gradient: "from-pink-500 to-rose-500", permission: 'procurement' },
  ];

  const allAnalytics: MenuItem[] = [
    { title: t.sales, url: "/sales", icon: DollarSign, testId: "sales", gradient: "from-green-500 to-teal-500", permission: 'sales' },
    { title: t.financial, url: "/financial", icon: Receipt, testId: "financial", gradient: "from-blue-500 to-purple-500", permission: 'reports' },
    { title: t.profitability, url: "/profitability", icon: Calculator, testId: "profitability", gradient: "from-amber-500 to-orange-500", permission: 'reports' },
    { title: t.deliveryProfitability, url: "/delivery-app-profitability", icon: Truck, testId: "delivery-profitability", gradient: "from-green-500 to-emerald-500", permission: 'reports', businessTypes: ['restaurant'] },
    { title: t.salesComparison, url: "/sales-comparison", icon: BarChart3, testId: "sales-comparison", gradient: "from-purple-500 to-pink-500", permission: 'reports' },
    { title: t.forecasting, url: "/forecasting", icon: TrendingUp, testId: "forecasting", gradient: "from-cyan-500 to-sky-500", permission: 'reports' },
    { title: t.invoices, url: "/invoices", icon: FileCheck, testId: "invoices", gradient: "from-violet-500 to-purple-500", permission: 'reports' },
    { title: t.vatReports, url: "/vat-reports", icon: FileBarChart2, testId: "vat-reports", gradient: "from-indigo-500 to-blue-500", permission: 'reports' },
    { title: t.bills, url: "/bills", icon: FileText, testId: "bills", gradient: "from-rose-500 to-pink-500", permission: 'bills' },
  ];

  const allSystem: MenuItem[] = [
    { title: t.tutorial, url: "/tutorial", icon: BookOpen, testId: "tutorial", gradient: "from-purple-500 to-violet-500" },
    { title: businessType === 'factory' ? t.factory : t.shop, url: "/shop", icon: Store, testId: "shop", gradient: "from-pink-500 to-fuchsia-500", permission: 'workingHours' },
    { title: "Profile", url: "/profile", icon: UserCircle, testId: "profile", gradient: "from-indigo-500 to-purple-500" },
    { title: "Team Chat", url: "/chat", icon: MessageCircle, testId: "chat", gradient: "from-blue-500 to-cyan-500" },
    { title: t.support || "Support", url: "/support", icon: HeadphonesIcon, testId: "support", gradient: "from-emerald-500 to-teal-500" },
    { title: t.itDashboard || "IT Dashboard", url: "/it-dashboard", icon: BarChart3, testId: "it-dashboard", gradient: "from-violet-500 to-purple-500" },
    { title: "Performance", url: "/performance", icon: TrendingUp, testId: "performance", gradient: "from-cyan-500 to-blue-500" },
    { title: "Account Management", url: "/it-account-management", icon: UserCog, testId: "it-account-management", gradient: "from-orange-500 to-red-500" },
    { title: t.settings, url: "/settings", icon: Settings, testId: "settings", gradient: "from-slate-500 to-gray-500", permission: 'settings' },
    { title: t.employees, url: "/employees", icon: Users, testId: "employees", gradient: "from-sky-500 to-blue-500", permission: 'users' },
    { title: "Password Manager", url: "/password-manager", icon: Key, testId: "password-manager", gradient: "from-red-500 to-rose-500" },
  ];

  // Filter menu items based on both permissions and business type
  const filterMenuItems = (items: MenuItem[]) => 
    items.filter(item => {
      // IT accounts can access IT Dashboard, Performance, and Account Management only
      if (accountType === 'it') {
        return item.testId === 'it-dashboard' || item.testId === 'performance' || item.testId === 'it-account-management';
      }
      
      // Client accounts cannot see IT Dashboard, Performance, or Account Management (IT-only pages)
      if (item.testId === 'it-dashboard' || item.testId === 'performance' || item.testId === 'it-account-management') {
        return false;
      }
      
      // Check business type restriction (if specified)
      if (item.businessTypes && !item.businessTypes.includes(businessType)) {
        return false;
      }
      
      // Settings - check settings permission (or admin)
      if (item.testId === 'settings') {
        return isAdmin() || hasPermission('settings');
      }
      
      // Check permission (admin bypasses all checks, otherwise check specific permission)
      return !item.permission || isAdmin() || hasPermission(item.permission);
    });
  
  const filteredOperations = filterMenuItems(allOperations);
  const filteredManagement = filterMenuItems(allManagement);
  const filteredAnalytics = filterMenuItems(allAnalytics);
  const filteredSystem = filterMenuItems(allSystem);

  const renderMenuItems = (items: MenuItem[]) => (
    items.map((item) => {
      const isActive = location === item.url;
      return (
        <SidebarMenuItem key={item.url}>
          <SidebarMenuButton asChild isActive={isActive}>
            <Link 
              href={item.url} 
              data-testid={`link-${item.testId}`}
            >
              <item.icon />
              <span>{item.title}</span>
            </Link>
          </SidebarMenuButton>
        </SidebarMenuItem>
      );
    })
  );

  return (
    <Sidebar>
      <SidebarHeader className="border-b border-border">
        <div className="flex items-center gap-3 px-3 py-4">
          <img 
            src={logoImage} 
            alt="BSS Logo" 
            className="h-12 w-12 object-contain"
          />
          <div className="flex flex-col">
            <span className="text-sm font-bold text-foreground">
              BlindSpot System
            </span>
            <span className="text-xs text-muted-foreground">
              {t.businessManagementSystem || "Business Management"}
            </span>
          </div>
        </div>
      </SidebarHeader>
      <SidebarContent>
        {filteredOperations.length > 0 && (
          <SidebarGroup>
            <SidebarGroupLabel className="text-xs font-bold tracking-wider">
              {t.operations}
            </SidebarGroupLabel>
            <SidebarGroupContent>
              <SidebarMenu>
                {renderMenuItems(filteredOperations)}
              </SidebarMenu>
            </SidebarGroupContent>
          </SidebarGroup>
        )}

        {filteredManagement.length > 0 && (
          <SidebarGroup>
            <SidebarGroupLabel className="text-xs font-bold tracking-wider">
              {t.management}
            </SidebarGroupLabel>
            <SidebarGroupContent>
              <SidebarMenu>
                {renderMenuItems(filteredManagement)}
              </SidebarMenu>
            </SidebarGroupContent>
          </SidebarGroup>
        )}

        {filteredAnalytics.length > 0 && (
          <SidebarGroup>
            <SidebarGroupLabel className="text-xs font-bold tracking-wider">
              {t.analytics}
            </SidebarGroupLabel>
            <SidebarGroupContent>
              <SidebarMenu>
                {renderMenuItems(filteredAnalytics)}
              </SidebarMenu>
            </SidebarGroupContent>
          </SidebarGroup>
        )}

        {filteredSystem.length > 0 && (
          <SidebarGroup>
            <SidebarGroupLabel className="text-xs font-bold tracking-wider">
              {t.system}
            </SidebarGroupLabel>
            <SidebarGroupContent>
              <SidebarMenu>
                {renderMenuItems(filteredSystem)}
              </SidebarMenu>
            </SidebarGroupContent>
          </SidebarGroup>
        )}

        <SidebarGroup>
          <SidebarGroupLabel className="text-xs font-bold tracking-wider">
            {t.support}
          </SidebarGroupLabel>
          <SidebarGroupContent>
            <SidebarMenu>
              <SidebarMenuItem>
                <Dialog open={helpDialogOpen} onOpenChange={setHelpDialogOpen}>
                  <DialogTrigger asChild>
                    <button
                      data-testid="button-help"
                      className="flex w-full items-center gap-2 rounded-md px-2 py-1.5 text-sm hover-elevate active-elevate-2"
                    >
                      <HeadphonesIcon className="h-4 w-4" />
                      <span>{t.help}</span>
                    </button>
                  </DialogTrigger>
                  <DialogContent className="sm:max-w-md" data-testid="dialog-help">
                    <DialogHeader>
                      <DialogTitle className="text-xl font-bold">
                        {t.contactInformation}
                      </DialogTitle>
                      <DialogDescription>
                        {t.getInTouch}
                      </DialogDescription>
                    </DialogHeader>
                    <div className="space-y-4 mt-4">
                      <a
                        href="mailto:IT@SaudiKinzhal.org"
                        data-testid="link-email"
                        className="flex items-center gap-3 p-4 rounded-lg border border-border hover-elevate active-elevate-2"
                      >
                        <div className="p-2 rounded-md bg-primary">
                          <Mail className="h-5 w-5 text-primary-foreground" />
                        </div>
                        <div className="flex-1">
                          <p className="text-sm font-semibold text-foreground">{t.email}</p>
                          <p className="text-sm text-muted-foreground">IT@SaudiKinzhal.org</p>
                        </div>
                      </a>
                    </div>
                  </DialogContent>
                </Dialog>
              </SidebarMenuItem>
              
              <SidebarMenuItem>
                <button
                  onClick={handleLogout}
                  data-testid="button-logout"
                  className="flex w-full items-center gap-2 rounded-md px-2 py-1.5 text-sm hover-elevate active-elevate-2"
                >
                  <LogOut className="h-4 w-4" />
                  <span>{t.logout}</span>
                </button>
              </SidebarMenuItem>
            </SidebarMenu>
          </SidebarGroupContent>
        </SidebarGroup>
      </SidebarContent>
    </Sidebar>
  );
}
