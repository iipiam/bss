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
  AlertTriangle,
  Home,
  Handshake,
  Ticket,
  Clock,
  CheckCircle,
  XCircle,
  Printer,
  Shield,
  Activity,
  Briefcase,
  FileSpreadsheet,
  Wrench,
  HardHat,
  Calendar,
  CalendarCheck,
  Megaphone,
  IdCard,
  Stethoscope,
  Network,
} from "lucide-react";
import logoImage from "@assets/Kinzhal_logo_1768960890639.png";
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
  businessTypes?: ('restaurant' | 'factory' | 'real_estate' | 'design_services' | 'installation_services' | 'it_services')[]; // If specified, only show for these business types
}

export function AppSidebar() {
  const [location] = useLocation();
  const { t } = useLanguage();
  const { logout, restaurant, accountType } = useAuth();
  const { toast } = useToast();
  const [helpDialogOpen, setHelpDialogOpen] = useState(false);
  const { hasPermission, isAdmin } = usePermissions();
  
  // Get businessType from restaurant data (defaults to 'restaurant' for existing accounts)
  const businessType: 'restaurant' | 'factory' | 'real_estate' | 'design_services' | 'installation_services' | 'it_services' = (restaurant?.businessType as any) || 'restaurant';
  const isServiceBusiness = businessType === 'design_services' || businessType === 'installation_services' || businessType === 'it_services';

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
    { title: businessType === 'real_estate' ? t.dealProcessing : isServiceBusiness ? t.serviceDesk || "Service Desk" : t.pos, url: "/pos", icon: ShoppingCart, testId: "pos", gradient: "from-emerald-500 to-teal-500", permission: 'pos', businessTypes: ['restaurant', 'factory', 'real_estate'] },
    { title: t.orders, url: "/orders", icon: ClipboardList, testId: "orders", gradient: "from-blue-500 to-cyan-500", permission: 'orders', businessTypes: ['restaurant', 'factory'] },
    { title: businessType === 'factory' ? t.workshop : t.kitchen, url: "/kitchen", icon: Flame, testId: "kitchen", gradient: "from-orange-500 to-red-500", permission: 'kitchen', businessTypes: ['restaurant', 'factory'] },
    { title: t.deliveryApps, url: "/delivery-apps", icon: Truck, testId: "delivery-apps", gradient: "from-violet-500 to-purple-500", permission: 'deliveryApps', businessTypes: ['restaurant'] },
    { title: t.mealSubscriptions || "Meal Subscriptions", url: "/meal-subscriptions", icon: CalendarCheck, testId: "meal-subscriptions", gradient: "from-lime-500 to-green-500", permission: 'mealSubscriptions', businessTypes: ['restaurant'] },
    { title: (t as any).cateringContracts || "Catering Contracts", url: "/catering-contracts", icon: FileText, testId: "catering-contracts", gradient: "from-amber-500 to-orange-500", permission: 'catering', businessTypes: ['restaurant'] },
    { title: t.propertyListings, url: "/menu", icon: Home, testId: "property-listings", gradient: "from-emerald-500 to-teal-500", permission: 'menu', businessTypes: ['real_estate'] },
    { title: t.clientInquiries, url: "/orders", icon: ClipboardList, testId: "client-inquiries", gradient: "from-blue-500 to-cyan-500", permission: 'orders', businessTypes: ['real_estate'] },
    { title: t.contracts, url: "/contracts", icon: Handshake, testId: "contracts", gradient: "from-orange-500 to-red-500", permission: 'orders', businessTypes: ['real_estate'] },
    { title: t.projects || "Projects", url: "/service-projects", icon: Briefcase, testId: "service-projects", gradient: "from-blue-500 to-indigo-500", permission: 'orders', businessTypes: ['design_services', 'installation_services', 'it_services'] },
    { title: t.quotations || "Quotations", url: "/quotations", icon: FileSpreadsheet, testId: "quotations", gradient: "from-emerald-500 to-teal-500", permission: 'orders', businessTypes: ['design_services', 'installation_services', 'it_services'] },
  ];

  const allManagement: MenuItem[] = [
    { title: t.dashboard, url: "/", icon: LayoutDashboard, testId: "dashboard", gradient: "from-purple-500 to-pink-500", permission: 'dashboard' },
    { title: t.inventory, url: "/inventory", icon: Package, testId: "inventory", gradient: "from-blue-500 to-indigo-500", permission: 'inventory', businessTypes: ['restaurant', 'factory'] },
    { title: businessType === 'factory' ? t.products : t.menu, url: "/menu", icon: UtensilsCrossed, testId: "menu", gradient: "from-green-500 to-emerald-500", permission: 'menu', businessTypes: ['restaurant', 'factory'] },
    { title: t.recipes, url: "/recipes", icon: ChefHat, testId: "recipes", gradient: "from-yellow-500 to-orange-500", permission: 'recipes', businessTypes: ['restaurant'] },
    { title: t.licenses || "Licenses", url: "/licenses", icon: FileKey, testId: "licenses", gradient: "from-amber-500 to-yellow-500", permission: 'licenses' },
    { title: t.customers, url: "/customers", icon: UserCircle, testId: "customers", gradient: "from-cyan-500 to-blue-500", permission: 'customers' },
    { title: t.investors, url: "/investors", icon: TrendingUp, testId: "investors", gradient: "from-emerald-500 to-green-500", permission: 'reports' },
    { title: t.investmentAgreementTemplates || "Investment Agreement Templates", url: "/investment-agreement-templates", icon: FileText, testId: "investment-agreement-templates", gradient: "from-emerald-500 to-teal-500", permission: 'investors' },
    { title: businessType === 'real_estate' ? t.offices : t.branches, url: "/branches", icon: Building2, testId: "branches", gradient: "from-indigo-500 to-purple-500", permission: 'branches' },
    { title: t.procurement, url: "/procurement", icon: ShoppingBag, testId: "procurement", gradient: "from-pink-500 to-rose-500", permission: 'procurement', businessTypes: ['restaurant', 'factory'] },
    { title: t.valuations, url: "/valuations", icon: Calculator, testId: "valuations", gradient: "from-teal-500 to-cyan-500", permission: 'reports', businessTypes: ['real_estate'] },
    { title: t.serviceCatalog || "Service Catalog", url: "/service-catalog", icon: Wrench, testId: "service-catalog", gradient: "from-green-500 to-emerald-500", permission: 'menu', businessTypes: ['design_services', 'installation_services', 'it_services'] },
    { title: t.contractors || "Contractors", url: "/contractors", icon: HardHat, testId: "contractors", gradient: "from-orange-500 to-amber-500", permission: 'customers', businessTypes: ['design_services', 'installation_services', 'it_services'] },
  ];

  const allAnalytics: MenuItem[] = [
    { title: businessType === 'real_estate' ? t.commissions : t.sales, url: "/sales", icon: DollarSign, testId: "sales", gradient: "from-green-500 to-teal-500", permission: 'sales' },
    { title: t.financial, url: "/financial", icon: Receipt, testId: "financial", gradient: "from-blue-500 to-purple-500", permission: 'reports' },
    { title: t.profitability, url: "/profitability", icon: Calculator, testId: "profitability", gradient: "from-amber-500 to-orange-500", permission: 'reports', businessTypes: ['restaurant', 'factory'] },
    { title: t.menuProfitability, url: "/menu-profitability", icon: TrendingUp, testId: "menu-profitability", gradient: "from-red-500 to-rose-500", permission: 'reports', businessTypes: ['restaurant', 'factory'] },
    { title: t.deliveryProfitability, url: "/delivery-app-profitability", icon: Truck, testId: "delivery-profitability", gradient: "from-green-500 to-emerald-500", permission: 'reports', businessTypes: ['restaurant'] },
    { title: t.salesComparison, url: "/sales-comparison", icon: BarChart3, testId: "sales-comparison", gradient: "from-purple-500 to-pink-500", permission: 'reports', businessTypes: ['restaurant', 'factory'] },
    { title: t.forecasting, url: "/forecasting", icon: TrendingUp, testId: "forecasting", gradient: "from-cyan-500 to-sky-500", permission: 'reports', businessTypes: ['restaurant', 'factory'] },
    { title: t.invoices, url: "/invoices", icon: FileCheck, testId: "invoices", gradient: "from-violet-500 to-purple-500", permission: 'reports' },
    { title: t.vatReports, url: "/vat-reports", icon: FileBarChart2, testId: "vat-reports", gradient: "from-indigo-500 to-blue-500", permission: 'reports' },
    { title: t.bills, url: "/bills", icon: FileText, testId: "bills", gradient: "from-rose-500 to-pink-500", permission: 'bills' },
    { title: t.violations, url: "/violations", icon: AlertTriangle, testId: "violations", gradient: "from-red-500 to-orange-500", permission: 'bills' },
    { title: t.marketing || "Marketing", url: "/marketing", icon: Megaphone, testId: "marketing", gradient: "from-fuchsia-500 to-violet-500", permission: 'marketing' },
    { title: (t as any).companyProfile || "Company Profile", url: "/company-profile", icon: IdCard, testId: "company-profile", gradient: "from-indigo-500 to-blue-500", permission: 'reports' },
  ];

  const allSystem: MenuItem[] = [
    { title: t.tutorial, url: "/tutorial", icon: BookOpen, testId: "tutorial", gradient: "from-purple-500 to-violet-500" },
    { title: businessType === 'factory' ? t.factory : businessType === 'real_estate' ? t.office : isServiceBusiness ? t.company || "Company" : t.shop, url: "/shop", icon: Store, testId: "shop", gradient: "from-pink-500 to-fuchsia-500", permission: 'workingHours' },
    { title: t.profile, url: "/profile", icon: UserCircle, testId: "profile", gradient: "from-indigo-500 to-purple-500" },
    { title: t.teamChat, url: "/chat", icon: MessageCircle, testId: "chat", gradient: "from-blue-500 to-cyan-500" },
    { title: t.support || "Support", url: "/support", icon: HeadphonesIcon, testId: "support", gradient: "from-emerald-500 to-teal-500" },
    { title: t.settings, url: "/settings", icon: Settings, testId: "settings", gradient: "from-slate-500 to-gray-500", permission: 'settings' },
    { title: t.companySettings || "Company Settings", url: "/company-settings", icon: Building2, testId: "company-settings", gradient: "from-violet-500 to-indigo-500", permission: 'settings', businessTypes: ['design_services', 'installation_services', 'it_services'] },
    { title: t.printers || "Printers", url: "/printer-settings", icon: Printer, testId: "printer-settings", gradient: "from-teal-500 to-cyan-500", permission: 'settings' },
    { title: t.employees, url: "/employees", icon: Users, testId: "employees", gradient: "from-sky-500 to-blue-500", permission: 'users' },
    { title: t.passwordManager, url: "/password-manager", icon: Key, testId: "password-manager", gradient: "from-red-500 to-rose-500" },
  ];

  // Admin-only menu items
  const adminOnlyItems: MenuItem[] = [
    { title: t.activityLog || "Activity Log", url: "/activity-log", icon: Activity, testId: "activity-log", gradient: "from-violet-500 to-purple-500", permission: 'users' },
  ];

  // IT Dashboard menu items (visible only to IT accounts)
  const itDashboardItems: MenuItem[] = [
    { title: t.itDashboard || "IT Dashboard", url: "/it-dashboard", icon: BarChart3, testId: "it-dashboard", gradient: "from-violet-500 to-purple-500" },
    { title: t.performance, url: "/performance", icon: TrendingUp, testId: "performance", gradient: "from-cyan-500 to-blue-500" },
    { title: t.accountManagement, url: "/it-account-management", icon: UserCog, testId: "it-account-management", gradient: "from-orange-500 to-red-500" },
    { title: t.businessManagement || "Business Management", url: "/business-management", icon: Building2, testId: "business-management", gradient: "from-teal-500 to-cyan-500" },
    { title: t.zatcaSettings || "ZATCA E-Invoicing", url: "/zatca-settings", icon: Shield, testId: "zatca-settings", gradient: "from-green-600 to-emerald-500" },
    { title: t.inspectionTools || "Inspection Tools", url: "/inspection-tools", icon: Stethoscope, testId: "inspection-tools", gradient: "from-pink-500 to-rose-500" },
    { title: t.appDiagram || "App Diagram", url: "/app-diagram", icon: Network, testId: "app-diagram", gradient: "from-indigo-500 to-blue-500" },
  ];

  // Support menu items for IT Dashboard (visible only to IT accounts)
  const itSupportItems: MenuItem[] = [
    { title: t.allTickets || "All Tickets", url: "/support", icon: Ticket, testId: "it-support-all", gradient: "from-blue-500 to-indigo-500" },
    { title: t.pending || "Pending", url: "/support?status=pending", icon: Clock, testId: "it-support-pending", gradient: "from-yellow-500 to-amber-500" },
    { title: t.ticketStatusResolved || "Solved", url: "/support?status=resolved", icon: CheckCircle, testId: "it-support-solved", gradient: "from-green-500 to-emerald-500" },
    { title: t.ticketStatusClosed || "Closed", url: "/support?status=closed", icon: XCircle, testId: "it-support-closed", gradient: "from-gray-500 to-slate-500" },
  ];

  // Filter menu items based on both permissions and business type
  const filterMenuItems = (items: MenuItem[]) => 
    items.filter(item => {
      // IT accounts - filter out non-IT items from system menu (we'll show IT items in a separate section)
      if (accountType === 'it') {
        // Don't show these in the regular system menu for IT - they'll be in IT Dashboard section
        return false;
      }
      
      // Client accounts cannot see IT-only pages
      if (item.testId === 'it-dashboard' || item.testId === 'performance' || item.testId === 'it-account-management' || item.testId === 'business-management' || item.testId === 'inspection-tools' || item.testId === 'app-diagram') {
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

        {isAdmin && accountType !== 'it' && (
          <SidebarGroup>
            <SidebarGroupLabel className="text-xs font-bold tracking-wider">
              {t.adminTools}
            </SidebarGroupLabel>
            <SidebarGroupContent>
              <SidebarMenu>
                {renderMenuItems(adminOnlyItems)}
              </SidebarMenu>
            </SidebarGroupContent>
          </SidebarGroup>
        )}

        {accountType === 'it' && (
          <>
            <SidebarGroup>
              <SidebarGroupLabel className="text-xs font-bold tracking-wider">
                {t.itDashboard || "IT Dashboard"}
              </SidebarGroupLabel>
              <SidebarGroupContent>
                <SidebarMenu>
                  {renderMenuItems(itDashboardItems)}
                </SidebarMenu>
              </SidebarGroupContent>
            </SidebarGroup>

            <SidebarGroup>
              <SidebarGroupLabel className="text-xs font-bold tracking-wider">
                {t.support || "Support"}
              </SidebarGroupLabel>
              <SidebarGroupContent>
                <SidebarMenu>
                  {itSupportItems.map((item) => {
                    const isActive = location === item.url || 
                      (item.url.includes('?') && location.startsWith('/support') && location.includes(item.url.split('?')[1]));
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
                  })}
                </SidebarMenu>
              </SidebarGroupContent>
            </SidebarGroup>
          </>
        )}

        <SidebarGroup>
          <SidebarGroupLabel className="text-xs font-bold tracking-wider">
            {t.help || "Help"}
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
                        href="mailto:it@kinbss.org"
                        data-testid="link-email"
                        className="flex items-center gap-3 p-4 rounded-lg border border-border hover-elevate active-elevate-2"
                      >
                        <div className="p-2 rounded-md bg-primary">
                          <Mail className="h-5 w-5 text-primary-foreground" />
                        </div>
                        <div className="flex-1">
                          <p className="text-sm font-semibold text-foreground">{t.email}</p>
                          <p className="text-sm text-muted-foreground">it@kinbss.org</p>
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
