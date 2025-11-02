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
    { title: t.pos, url: "/pos", icon: ShoppingCart, testId: "pos" },
    { title: t.orders, url: "/orders", icon: ClipboardList, testId: "orders" },
    { title: t.kitchen, url: "/kitchen", icon: Flame, testId: "kitchen" },
  ];

  const management = [
    { title: t.dashboard, url: "/", icon: LayoutDashboard, testId: "dashboard" },
    { title: t.inventory, url: "/inventory", icon: Package, testId: "inventory" },
    { title: t.menu, url: "/menu", icon: UtensilsCrossed, testId: "menu" },
    { title: t.recipes, url: "/recipes", icon: ChefHat, testId: "recipes" },
    { title: t.branches, url: "/branches", icon: Building2, testId: "branches" },
    { title: t.procurement, url: "/procurement", icon: ShoppingBag, testId: "procurement" },
  ];

  const analytics = [
    { title: t.sales, url: "/sales", icon: DollarSign, testId: "sales" },
    { title: t.financial, url: "/financial", icon: Receipt, testId: "financial" },
    { title: t.profitability, url: "/profitability", icon: Calculator, testId: "profitability" },
  ];

  const system = [
    { title: t.settings, url: "/settings", icon: Settings, testId: "settings" },
    { title: t.employees, url: "/employees", icon: Users, testId: "employees" },
  ];

  return (
    <Sidebar>
      <SidebarContent>
        <SidebarGroup>
          <SidebarGroupLabel>Operations</SidebarGroupLabel>
          <SidebarGroupContent>
            <SidebarMenu>
              {operations.map((item) => (
                <SidebarMenuItem key={item.url}>
                  <SidebarMenuButton asChild isActive={location === item.url}>
                    <Link href={item.url} data-testid={`link-${item.testId}`}>
                      <item.icon />
                      <span>{item.title}</span>
                    </Link>
                  </SidebarMenuButton>
                </SidebarMenuItem>
              ))}
            </SidebarMenu>
          </SidebarGroupContent>
        </SidebarGroup>

        <SidebarGroup>
          <SidebarGroupLabel>Management</SidebarGroupLabel>
          <SidebarGroupContent>
            <SidebarMenu>
              {management.map((item) => (
                <SidebarMenuItem key={item.url}>
                  <SidebarMenuButton asChild isActive={location === item.url}>
                    <Link href={item.url} data-testid={`link-${item.testId}`}>
                      <item.icon />
                      <span>{item.title}</span>
                    </Link>
                  </SidebarMenuButton>
                </SidebarMenuItem>
              ))}
            </SidebarMenu>
          </SidebarGroupContent>
        </SidebarGroup>

        <SidebarGroup>
          <SidebarGroupLabel>Analytics</SidebarGroupLabel>
          <SidebarGroupContent>
            <SidebarMenu>
              {analytics.map((item) => (
                <SidebarMenuItem key={item.url}>
                  <SidebarMenuButton asChild isActive={location === item.url}>
                    <Link href={item.url} data-testid={`link-${item.testId}`}>
                      <item.icon />
                      <span>{item.title}</span>
                    </Link>
                  </SidebarMenuButton>
                </SidebarMenuItem>
              ))}
            </SidebarMenu>
          </SidebarGroupContent>
        </SidebarGroup>

        <SidebarGroup>
          <SidebarGroupLabel>System</SidebarGroupLabel>
          <SidebarGroupContent>
            <SidebarMenu>
              {system.map((item) => (
                <SidebarMenuItem key={item.url}>
                  <SidebarMenuButton asChild isActive={location === item.url}>
                    <Link href={item.url} data-testid={`link-${item.testId}`}>
                      <item.icon />
                      <span>{item.title}</span>
                    </Link>
                  </SidebarMenuButton>
                </SidebarMenuItem>
              ))}
            </SidebarMenu>
          </SidebarGroupContent>
        </SidebarGroup>
      </SidebarContent>
    </Sidebar>
  );
}
