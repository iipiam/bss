import { Switch, Route } from "wouter";
import { queryClient } from "./lib/queryClient";
import { QueryClientProvider } from "@tanstack/react-query";
import { Toaster } from "@/components/ui/toaster";
import { TooltipProvider } from "@/components/ui/tooltip";
import { SidebarProvider, SidebarTrigger } from "@/components/ui/sidebar";
import { AppSidebar } from "@/components/app-sidebar";
import { BranchSelector } from "@/components/branch-selector";
import { ThemeProvider } from "@/components/theme-provider";
import { ThemeToggle } from "@/components/theme-toggle";
import Dashboard from "@/pages/dashboard";
import Inventory from "@/pages/inventory";
import Menu from "@/pages/menu";
import Recipes from "@/pages/recipes";
import Sales from "@/pages/sales";
import Reports from "@/pages/reports";
import Forecasting from "@/pages/forecasting";
import Analysis from "@/pages/analysis";
import Financial from "@/pages/financial";
import POS from "@/pages/pos";
import Branches from "@/pages/branches";
import Orders from "@/pages/orders";
import Kitchen from "@/pages/kitchen";
import Procurement from "@/pages/procurement";
import SettingsPage from "@/pages/settings";
import NotFound from "@/pages/not-found";

function Router() {
  return (
    <Switch>
      <Route path="/" component={Dashboard} />
      <Route path="/inventory" component={Inventory} />
      <Route path="/menu" component={Menu} />
      <Route path="/recipes" component={Recipes} />
      <Route path="/sales" component={Sales} />
      <Route path="/reports" component={Reports} />
      <Route path="/forecasting" component={Forecasting} />
      <Route path="/analysis" component={Analysis} />
      <Route path="/financial" component={Financial} />
      <Route path="/pos" component={POS} />
      <Route path="/branches" component={Branches} />
      <Route path="/orders" component={Orders} />
      <Route path="/kitchen" component={Kitchen} />
      <Route path="/procurement" component={Procurement} />
      <Route path="/settings" component={SettingsPage} />
      <Route component={NotFound} />
    </Switch>
  );
}

export default function App() {
  const style = {
    "--sidebar-width": "16rem",
    "--sidebar-width-icon": "3rem",
  };

  return (
    <QueryClientProvider client={queryClient}>
      <ThemeProvider>
        <TooltipProvider>
          <SidebarProvider style={style as React.CSSProperties}>
            <div className="flex h-screen w-full">
              <AppSidebar />
              <div className="flex flex-col flex-1 overflow-hidden">
                <header className="flex items-center justify-between p-4 border-b h-16 flex-shrink-0">
                  <div className="flex items-center gap-4">
                    <SidebarTrigger data-testid="button-sidebar-toggle" />
                    <BranchSelector />
                  </div>
                  <div className="flex items-center gap-2">
                    <ThemeToggle />
                  </div>
                </header>
                <main className="flex-1 overflow-auto">
                  <Router />
                </main>
              </div>
            </div>
          </SidebarProvider>
          <Toaster />
        </TooltipProvider>
      </ThemeProvider>
    </QueryClientProvider>
  );
}
