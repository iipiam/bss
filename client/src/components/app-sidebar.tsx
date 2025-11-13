import {
  LayoutDashboard,
  Package,
  UtensilsCrossed,
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
} from "lucide-react";
import {
  Sidebar,
  SidebarContent,
  SidebarGroup,
  SidebarGroupContent,
  SidebarGroupLabel,
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

export function AppSidebar() {
  const [location] = useLocation();
  const { t } = useLanguage();
  const { logout } = useAuth();
  const { toast } = useToast();
  const [helpDialogOpen, setHelpDialogOpen] = useState(false);
  const { hasPermission, isAdmin } = usePermissions();

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

  const operations = [
    { title: t.pos, url: "/pos", icon: ShoppingCart, testId: "pos", gradient: "from-emerald-500 to-teal-500", permission: 'pos' satisfies Permission },
    { title: t.orders, url: "/orders", icon: ClipboardList, testId: "orders", gradient: "from-blue-500 to-cyan-500", permission: 'orders' satisfies Permission },
    { title: t.kitchen, url: "/kitchen", icon: Flame, testId: "kitchen", gradient: "from-orange-500 to-red-500", permission: 'kitchen' satisfies Permission },
    { title: t.deliveryApps, url: "/delivery-apps", icon: Truck, testId: "delivery-apps", gradient: "from-violet-500 to-purple-500", permission: 'deliveryApps' satisfies Permission },
  ];

  const management = [
    { title: t.dashboard, url: "/", icon: LayoutDashboard, testId: "dashboard", gradient: "from-purple-500 to-pink-500", permission: 'dashboard' satisfies Permission },
    { title: t.inventory, url: "/inventory", icon: Package, testId: "inventory", gradient: "from-blue-500 to-indigo-500", permission: 'inventory' satisfies Permission },
    { title: t.menu, url: "/menu", icon: UtensilsCrossed, testId: "menu", gradient: "from-green-500 to-emerald-500", permission: 'menu' satisfies Permission },
    { title: t.recipes, url: "/recipes", icon: ChefHat, testId: "recipes", gradient: "from-yellow-500 to-orange-500", permission: 'recipes' satisfies Permission },
    { title: t.customers, url: "/customers", icon: UserCircle, testId: "customers", gradient: "from-cyan-500 to-blue-500", permission: 'customers' satisfies Permission },
    { title: t.investors, url: "/investors", icon: TrendingUp, testId: "investors", gradient: "from-emerald-500 to-green-500", permission: 'reports' satisfies Permission },
    { title: t.branches, url: "/branches", icon: Building2, testId: "branches", gradient: "from-indigo-500 to-purple-500", permission: 'branches' satisfies Permission },
    { title: t.procurement, url: "/procurement", icon: ShoppingBag, testId: "procurement", gradient: "from-pink-500 to-rose-500", permission: 'procurement' satisfies Permission },
  ];

  const analytics = [
    { title: t.sales, url: "/sales", icon: DollarSign, testId: "sales", gradient: "from-green-500 to-teal-500", permission: 'sales' satisfies Permission },
    { title: t.financial, url: "/financial", icon: Receipt, testId: "financial", gradient: "from-blue-500 to-purple-500", permission: 'reports' satisfies Permission },
    { title: t.profitability, url: "/profitability", icon: Calculator, testId: "profitability", gradient: "from-amber-500 to-orange-500", permission: 'reports' satisfies Permission },
    { title: t.deliveryProfitability, url: "/delivery-app-profitability", icon: Truck, testId: "delivery-profitability", gradient: "from-green-500 to-emerald-500", permission: 'reports' satisfies Permission },
    { title: t.salesComparison, url: "/sales-comparison", icon: BarChart3, testId: "sales-comparison", gradient: "from-purple-500 to-pink-500", permission: 'reports' satisfies Permission },
    { title: t.forecasting, url: "/forecasting", icon: TrendingUp, testId: "forecasting", gradient: "from-cyan-500 to-sky-500", permission: 'reports' satisfies Permission },
    { title: t.invoices, url: "/invoices", icon: FileCheck, testId: "invoices", gradient: "from-violet-500 to-purple-500", permission: 'reports' satisfies Permission },
    { title: t.vatReports, url: "/vat-reports", icon: FileBarChart2, testId: "vat-reports", gradient: "from-indigo-500 to-blue-500", permission: 'reports' satisfies Permission },
    { title: t.bills, url: "/bills", icon: FileText, testId: "bills", gradient: "from-rose-500 to-pink-500", permission: 'bills' satisfies Permission },
  ];

  const system = [
    { title: t.tutorial, url: "/tutorial", icon: BookOpen, testId: "tutorial", gradient: "from-purple-500 to-violet-500" }, // No permission required
    { title: t.shop, url: "/shop", icon: Store, testId: "shop", gradient: "from-pink-500 to-fuchsia-500", permission: 'workingHours' satisfies Permission },
    { title: "Profile", url: "/profile", icon: UserCircle, testId: "profile", gradient: "from-indigo-500 to-purple-500" }, // No permission required
    { title: "Team Chat", url: "/chat", icon: MessageCircle, testId: "chat", gradient: "from-blue-500 to-cyan-500" }, // No permission required
    { title: t.support || "Support", url: "/support", icon: HeadphonesIcon, testId: "support", gradient: "from-emerald-500 to-teal-500" }, // No permission required
    { title: t.settings, url: "/settings", icon: Settings, testId: "settings", gradient: "from-slate-500 to-gray-500" }, // Admin only (handled separately)
    { title: t.employees, url: "/employees", icon: Users, testId: "employees", gradient: "from-sky-500 to-blue-500", permission: 'users' satisfies Permission },
    { title: "Password Manager", url: "/password-manager", icon: Key, testId: "password-manager", gradient: "from-red-500 to-rose-500" }, // No permission required
  ];

  // Filter menu items based on permissions
  const filteredOperations = operations.filter(item => !item.permission || isAdmin || hasPermission(item.permission));
  const filteredManagement = management.filter(item => !item.permission || isAdmin || hasPermission(item.permission));
  const filteredAnalytics = analytics.filter(item => !item.permission || isAdmin || hasPermission(item.permission));
  const filteredSystem = system.filter(item => {
    // Settings is admin-only
    if (item.testId === 'settings') return isAdmin;
    // Other items either require no permission or check the permission
    return !item.permission || isAdmin || hasPermission(item.permission);
  });

  const renderMenuItems = (items: typeof operations) => (
    items.map((item) => {
      const isActive = location === item.url;
      return (
        <SidebarMenuItem key={item.url}>
          <SidebarMenuButton asChild isActive={isActive}>
            <Link 
              href={item.url} 
              data-testid={`link-${item.testId}`}
              className="group relative overflow-hidden transition-all duration-300"
            >
              <div className={`absolute inset-0 bg-gradient-to-r ${item.gradient} opacity-0 group-hover:opacity-10 transition-opacity duration-300`} />
              <div className={`relative flex items-center gap-2 ${isActive ? `bg-gradient-to-r ${item.gradient} bg-clip-text text-transparent font-semibold` : ''}`}>
                <item.icon className={isActive ? 'text-primary' : ''} />
                <span>{item.title}</span>
              </div>
            </Link>
          </SidebarMenuButton>
        </SidebarMenuItem>
      );
    })
  );

  return (
    <Sidebar>
      <SidebarContent>
        {filteredOperations.length > 0 && (
          <SidebarGroup>
            <SidebarGroupLabel className="text-xs font-bold tracking-wider bg-gradient-to-r from-primary to-primary/70 bg-clip-text text-transparent">
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
            <SidebarGroupLabel className="text-xs font-bold tracking-wider bg-gradient-to-r from-primary to-primary/70 bg-clip-text text-transparent">
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
            <SidebarGroupLabel className="text-xs font-bold tracking-wider bg-gradient-to-r from-primary to-primary/70 bg-clip-text text-transparent">
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
            <SidebarGroupLabel className="text-xs font-bold tracking-wider bg-gradient-to-r from-primary to-primary/70 bg-clip-text text-transparent">
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
          <SidebarGroupLabel className="text-xs font-bold tracking-wider bg-gradient-to-r from-amber-500 to-orange-500 bg-clip-text text-transparent">
            {t.support}
          </SidebarGroupLabel>
          <SidebarGroupContent>
            <SidebarMenu>
              <SidebarMenuItem>
                <Dialog open={helpDialogOpen} onOpenChange={setHelpDialogOpen}>
                  <DialogTrigger asChild>
                    <button
                      data-testid="button-help"
                      className="flex w-full items-center gap-2 rounded-md px-2 py-1.5 text-sm hover-elevate active-elevate-2 group relative overflow-visible transition-all duration-300"
                    >
                      <div className="absolute inset-0 bg-gradient-to-r from-amber-500 to-orange-500 opacity-0 group-hover:opacity-10 transition-opacity duration-300 rounded-md" />
                      <HeadphonesIcon className="h-4 w-4 relative z-10" />
                      <span className="relative z-10">{t.help}</span>
                    </button>
                  </DialogTrigger>
                  <DialogContent className="sm:max-w-md" data-testid="dialog-help">
                    <DialogHeader>
                      <DialogTitle className="text-xl font-bold bg-gradient-to-r from-amber-500 to-orange-500 bg-clip-text text-transparent">
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
                        className="flex items-center gap-3 p-4 rounded-lg border border-border hover-elevate active-elevate-2 group transition-all duration-300"
                      >
                        <div className="p-2 rounded-md bg-gradient-to-r from-blue-500 to-cyan-500">
                          <Mail className="h-5 w-5 text-white" />
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
                  className="flex w-full items-center gap-2 rounded-md px-2 py-1.5 text-sm hover-elevate active-elevate-2 group relative overflow-visible transition-all duration-300"
                >
                  <div className="absolute inset-0 bg-gradient-to-r from-red-500 to-rose-500 opacity-0 group-hover:opacity-10 transition-opacity duration-300 rounded-md" />
                  <LogOut className="h-4 w-4 relative z-10" />
                  <span className="relative z-10">{t.logout}</span>
                </button>
              </SidebarMenuItem>
            </SidebarMenu>
          </SidebarGroupContent>
        </SidebarGroup>
      </SidebarContent>
    </Sidebar>
  );
}
