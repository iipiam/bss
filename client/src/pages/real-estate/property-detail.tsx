import { useQuery } from "@tanstack/react-query";
import { useRoute, Link } from "wouter";
import { Card, CardContent, CardHeader } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { ArrowLeft } from "lucide-react";
import { fmtSar, StatusBadge, PageHeader, REBreadcrumb, useRET } from "./_shared";
import { localizedType } from "@/i18n/realEstateTranslations";

export default function PropertyDetail() {
  const t = useRET();
  const [, params] = useRoute("/real-estate/properties/:id");
  const propertyId = params?.id;
  const { data: property, isLoading } = useQuery<any>({ queryKey: ["/api/properties", propertyId], enabled: !!propertyId });
  const { data: units = [] } = useQuery<any[]>({ queryKey: ["/api/property-units"], select: (all: any) => all.filter((u: any) => u.propertyId === propertyId) });
  const { data: kpis } = useQuery<any>({ queryKey: ["/api/properties", propertyId, "financial-summary"], enabled: !!propertyId });

  if (isLoading) return <div className="p-6">{t.loading}</div>;
  if (!property) return <div className="p-6">—</div>;

  return (
    <div className="p-6 max-w-7xl mx-auto">
      <REBreadcrumb />
      <Link href="/real-estate/properties" data-testid="link-back">
        <Button variant="ghost" size="sm" className="mb-3"><ArrowLeft className="w-4 h-4 mr-1" />{t.backToProperties}</Button>
      </Link>
      <PageHeader title={property.name} subtitle={`${localizedType(t, property.type)} • ${property.city || "—"}`} actions={<StatusBadge status={property.status} />} />

      <div className="grid grid-cols-2 md:grid-cols-4 gap-3 mb-6">
        <Card><CardHeader className="pb-1"><span className="text-xs text-muted-foreground">{t.units}</span></CardHeader><CardContent><div className="text-2xl font-semibold">{units.length}</div></CardContent></Card>
        <Card><CardHeader className="pb-1"><span className="text-xs text-muted-foreground">{t.occupancy}</span></CardHeader><CardContent><div className="text-2xl font-semibold">{kpis?.occupancyPct != null ? `${Number(kpis.occupancyPct).toFixed(1)}%` : "—"}</div></CardContent></Card>
        <Card><CardHeader className="pb-1"><span className="text-xs text-muted-foreground">{t.revenueYtd}</span></CardHeader><CardContent><div className="text-xl font-semibold text-emerald-600">{fmtSar(kpis?.revenueYtd || 0)}</div></CardContent></Card>
        <Card><CardHeader className="pb-1"><span className="text-xs text-muted-foreground">{t.expensesYtd}</span></CardHeader><CardContent><div className="text-xl font-semibold text-rose-600">{fmtSar(kpis?.expensesYtd || 0)}</div></CardContent></Card>
      </div>

      <Card className="mb-6"><CardHeader><span className="font-semibold">{t.details}</span></CardHeader>
        <CardContent className="grid grid-cols-2 md:grid-cols-3 gap-3 text-sm">
          <div><div className="text-muted-foreground">{t.address}</div><div>{property.address || "—"}</div></div>
          <div><div className="text-muted-foreground">{t.owner}</div><div>{property.ownerName || "—"}</div></div>
          <div><div className="text-muted-foreground">{t.area}</div><div>{property.areaSqm || "—"} {t.sqm}</div></div>
          <div><div className="text-muted-foreground">{t.floors}</div><div>{property.floors ?? "—"}</div></div>
          <div><div className="text-muted-foreground">{t.yearBuilt}</div><div>{property.yearBuilt ?? "—"}</div></div>
          <div><div className="text-muted-foreground">{t.currentValue}</div><div>{fmtSar(property.currentValue)}</div></div>
        </CardContent>
      </Card>

      <h2 className="text-lg font-semibold mb-3">{t.unitsInProperty}</h2>
      <Card><CardContent className="p-0">
        <Table>
          <TableHeader><TableRow><TableHead>{t.unitNumberShort}</TableHead><TableHead>{t.typeLabel}</TableHead><TableHead>{t.bedBath}</TableHead><TableHead>{t.monthlyRent}</TableHead><TableHead>{t.statusLabel}</TableHead></TableRow></TableHeader>
          <TableBody>
            {units.length === 0 && <TableRow><TableCell colSpan={5} className="text-center py-6 text-muted-foreground">{t.noUnits}</TableCell></TableRow>}
            {units.map((u: any) => (
              <TableRow key={u.id}>
                <TableCell className="font-medium">{u.unitNumber}</TableCell>
                <TableCell>{localizedType(t, u.type)}</TableCell>
                <TableCell>{u.bedrooms ?? "—"} / {u.bathrooms ?? "—"}</TableCell>
                <TableCell>{fmtSar(u.monthlyRent)}</TableCell>
                <TableCell><StatusBadge status={u.status} /></TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </CardContent></Card>
    </div>
  );
}
