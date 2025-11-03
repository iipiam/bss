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
  HeadphonesIcon,
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
import { Link, useLocation } from "wouter";
import { useLanguage } from "@/contexts/LanguageContext";

export function AppSidebar() {
  const [location] = useLocation();
  const { t } = useLanguage();

  const operations = [
    { title: t.pos, url: "/pos", icon: ShoppingCart, testId: "pos", gradient: "from-emerald-500 to-teal-500" },
    { title: t.orders, url: "/orders", icon: ClipboardList, testId: "orders", gradient: "from-blue-500 to-cyan-500" },
    { title: t.kitchen, url: "/kitchen", icon: Flame, testId: "kitchen", gradient: "from-orange-500 to-red-500" },
  ];

  const management = [
    { title: t.dashboard, url: "/", icon: LayoutDashboard, testId: "dashboard", gradient: "from-purple-500 to-pink-500" },
    { title: t.inventory, url: "/inventory", icon: Package, testId: "inventory", gradient: "from-blue-500 to-indigo-500" },
    { title: t.menu, url: "/menu", icon: UtensilsCrossed, testId: "menu", gradient: "from-green-500 to-emerald-500" },
    { title: t.recipes, url: "/recipes", icon: ChefHat, testId: "recipes", gradient: "from-yellow-500 to-orange-500" },
    { title: t.customers, url: "/customers", icon: UserCircle, testId: "customers", gradient: "from-cyan-500 to-blue-500" },
    { title: t.branches, url: "/branches", icon: Building2, testId: "branches", gradient: "from-indigo-500 to-purple-500" },
    { title: t.procurement, url: "/procurement", icon: ShoppingBag, testId: "procurement", gradient: "from-pink-500 to-rose-500" },
  ];

  const analytics = [
    { title: t.sales, url: "/sales", icon: DollarSign, testId: "sales", gradient: "from-green-500 to-teal-500" },
    { title: t.financial, url: "/financial", icon: Receipt, testId: "financial", gradient: "from-blue-500 to-purple-500" },
    { title: t.profitability, url: "/profitability", icon: Calculator, testId: "profitability", gradient: "from-amber-500 to-orange-500" },
    { title: t.invoices, url: "/invoices", icon: FileCheck, testId: "invoices", gradient: "from-violet-500 to-purple-500" },
  ];

  const system = [
    { title: t.settings, url: "/settings", icon: Settings, testId: "settings", gradient: "from-slate-500 to-gray-500" },
    { title: t.employees, url: "/employees", icon: Users, testId: "employees", gradient: "from-sky-500 to-blue-500" },
  ];

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
        <SidebarGroup>
          <SidebarGroupLabel className="text-xs font-bold tracking-wider bg-gradient-to-r from-primary to-primary/70 bg-clip-text text-transparent">
            {t.operations}
          </SidebarGroupLabel>
          <SidebarGroupContent>
            <SidebarMenu>
              {renderMenuItems(operations)}
            </SidebarMenu>
          </SidebarGroupContent>
        </SidebarGroup>

        <SidebarGroup>
          <SidebarGroupLabel className="text-xs font-bold tracking-wider bg-gradient-to-r from-primary to-primary/70 bg-clip-text text-transparent">
            {t.management}
          </SidebarGroupLabel>
          <SidebarGroupContent>
            <SidebarMenu>
              {renderMenuItems(management)}
            </SidebarMenu>
          </SidebarGroupContent>
        </SidebarGroup>

        <SidebarGroup>
          <SidebarGroupLabel className="text-xs font-bold tracking-wider bg-gradient-to-r from-primary to-primary/70 bg-clip-text text-transparent">
            {t.analytics}
          </SidebarGroupLabel>
          <SidebarGroupContent>
            <SidebarMenu>
              {renderMenuItems(analytics)}
            </SidebarMenu>
          </SidebarGroupContent>
        </SidebarGroup>

        <SidebarGroup>
          <SidebarGroupLabel className="text-xs font-bold tracking-wider bg-gradient-to-r from-primary to-primary/70 bg-clip-text text-transparent">
            {t.system}
          </SidebarGroupLabel>
          <SidebarGroupContent>
            <SidebarMenu>
              {renderMenuItems(system)}
            </SidebarMenu>
          </SidebarGroupContent>
        </SidebarGroup>

        <SidebarGroup>
          <SidebarGroupLabel className="text-xs font-bold tracking-wider bg-gradient-to-r from-amber-500 to-orange-500 bg-clip-text text-transparent">
            {t.support}
          </SidebarGroupLabel>
          <SidebarGroupContent>
            <SidebarMenu>
              <SidebarMenuItem>
                <SidebarMenuButton asChild>
                  <a 
                    href="mailto:int@mwcdtr.org" 
                    data-testid="link-help"
                    className="group relative overflow-hidden transition-all duration-300"
                  >
                    <div className="absolute inset-0 bg-gradient-to-r from-amber-500 to-orange-500 opacity-0 group-hover:opacity-10 transition-opacity duration-300" />
                    <div className="relative flex items-center gap-2">
                      <HeadphonesIcon />
                      <span>{t.help}</span>
                    </div>
                  </a>
                </SidebarMenuButton>
              </SidebarMenuItem>
            </SidebarMenu>
          </SidebarGroupContent>
        </SidebarGroup>
      </SidebarContent>
    </Sidebar>
  );
}
