import { useQuery } from "@tanstack/react-query";
import { Card, CardContent, CardHeader } from "@/components/ui/card";
import { Link } from "wouter";
import { Building2, Home, Users, FileText, AlertTriangle, Wrench, DollarSign, ReceiptText, BarChart3, BookOpen } from "lucide-react";
import { fmtSar, PageHeader, fmtDate, useRET } from "./_shared";

export default function RealEstateDashboard() {
  const t = useRET();
  const { data: summary, isLoading } = useQuery<any>({ queryKey: ["/api/real-estate/dashboard/summary"] });
  const { data: alerts = [] } = useQuery<any[]>({ queryKey: ["/api/real-estate/notifications"] });

  const tiles = [
    { href: "/real-estate/properties", label: t.properties, key: "properties", icon: Building2, gradient: "from-emerald-500 to-teal-500" },
    { href: "/real-estate/units", label: t.units, key: "units", icon: Home, gradient: "from-blue-500 to-indigo-500" },
    { href: "/real-estate/tenants", label: t.tenants, key: "tenants", icon: Users, gradient: "from-purple-500 to-fuchsia-500" },
    { href: "/real-estate/contracts", label: t.contracts, key: "contracts", icon: FileText, gradient: "from-orange-500 to-amber-500" },
    { href: "/real-estate/invoices", label: t.invoices, key: "invoices", icon: ReceiptText, gradient: "from-violet-500 to-purple-500" },
    { href: "/real-estate/payments", label: t.payments, key: "payments", icon: DollarSign, gradient: "from-green-500 to-teal-500" },
    { href: "/real-estate/expenses", label: t.expenses, key: "expenses", icon: AlertTriangle, gradient: "from-rose-500 to-orange-500" },
    { href: "/real-estate/maintenance", label: t.maintenance, key: "maintenance", icon: Wrench, gradient: "from-amber-500 to-yellow-500" },
    { href: "/real-estate/reports", label: t.reports, key: "reports", icon: BarChart3, gradient: "from-cyan-500 to-blue-500" },
    { href: "/real-estate/accounting", label: t.accounting, key: "accounting", icon: BookOpen, gradient: "from-indigo-500 to-violet-500" },
  ];

  return (
    <div className="p-6 max-w-7xl mx-auto">
      <PageHeader title={t.propertyManagement} subtitle={t.dashboardSubtitle} />

      <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
        <Card><CardHeader className="pb-2"><span className="text-xs text-muted-foreground">{t.properties}</span></CardHeader>
          <CardContent><div className="text-2xl font-semibold" data-testid="stat-properties">{summary?.totalProperties ?? (isLoading ? "…" : 0)}</div></CardContent></Card>
        <Card><CardHeader className="pb-2"><span className="text-xs text-muted-foreground">{t.units}</span></CardHeader>
          <CardContent><div className="text-2xl font-semibold" data-testid="stat-units">{summary?.totalUnits ?? (isLoading ? "…" : 0)}</div>
          <div className="text-xs text-muted-foreground">{t.occupied}: {summary?.occupiedUnits ?? 0} / {t.available}: {Math.max(0, (summary?.totalUnits ?? 0) - (summary?.occupiedUnits ?? 0))}</div>
          </CardContent></Card>
        <Card><CardHeader className="pb-2"><span className="text-xs text-muted-foreground">{t.activeContracts}</span></CardHeader>
          <CardContent><div className="text-2xl font-semibold" data-testid="stat-contracts">{summary?.expiringContracts?.length ?? (isLoading ? "…" : 0)}</div></CardContent></Card>
        <Card><CardHeader className="pb-2"><span className="text-xs text-muted-foreground">{t.occupancy}</span></CardHeader>
          <CardContent><div className="text-2xl font-semibold" data-testid="stat-occupancy">{summary?.occupancyPct != null ? `${Number(summary.occupancyPct).toFixed(1)}%` : "—"}</div></CardContent></Card>
      </div>

      <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-8">
        <Card><CardHeader className="pb-2"><span className="text-xs text-muted-foreground">{t.mtdRevenue}</span></CardHeader>
          <CardContent><div className="text-xl font-semibold text-emerald-600" data-testid="stat-mtd-revenue">{fmtSar(summary?.monthlyRevenue)}</div></CardContent></Card>
        <Card><CardHeader className="pb-2"><span className="text-xs text-muted-foreground">{t.ytdRevenue}</span></CardHeader>
          <CardContent><div className="text-xl font-semibold" data-testid="stat-ytd-revenue">{fmtSar((summary?.revenue12 || []).reduce((a: number, b: any) => a + Number(b.revenue || 0), 0))}</div></CardContent></Card>
        <Card><CardHeader className="pb-2"><span className="text-xs text-muted-foreground">{t.receivables}</span></CardHeader>
          <CardContent><div className="text-xl font-semibold text-amber-600" data-testid="stat-receivables">{fmtSar(summary?.overdueAmount)}</div></CardContent></Card>
        <Card><CardHeader className="pb-2"><span className="text-xs text-muted-foreground">{t.overdue}</span></CardHeader>
          <CardContent><div className="text-xl font-semibold text-rose-600" data-testid="stat-overdue">{summary?.overdueCount ?? 0}</div></CardContent></Card>
      </div>

      <h2 className="text-lg font-semibold mb-3">{t.quickAccess}</h2>
      <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-5 gap-3 mb-8">
        {tiles.map((tile) => (
          <Link key={tile.href} href={tile.href} data-testid={`tile-${tile.key}`}>
            <Card className="hover-elevate active-elevate-2 cursor-pointer h-full">
              <CardContent className="p-4 flex flex-col items-center gap-2">
                <div className={`w-10 h-10 rounded-md bg-gradient-to-br ${tile.gradient} flex items-center justify-center`}>
                  <tile.icon className="w-5 h-5 text-white" />
                </div>
                <div className="text-sm font-medium text-center">{tile.label}</div>
              </CardContent>
            </Card>
          </Link>
        ))}
      </div>

      {alerts.length > 0 && (
        <div>
          <h2 className="text-lg font-semibold mb-3">{t.recentAlerts}</h2>
          <Card>
            <CardContent className="p-0 divide-y">
              {alerts.slice(0, 8).map((a: any) => (
                <div key={a.id} className="flex items-start justify-between gap-3 p-3" data-testid={`alert-${a.id}`}>
                  <div className="min-w-0">
                    <div className="font-medium text-sm">{a.title}</div>
                    {a.message && <div className="text-xs text-muted-foreground truncate">{a.message}</div>}
                  </div>
                  <div className="text-xs text-muted-foreground whitespace-nowrap">{fmtDate(a.createdAt)}</div>
                </div>
              ))}
            </CardContent>
          </Card>
        </div>
      )}
    </div>
  );
}
