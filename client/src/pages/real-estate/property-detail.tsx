import { useQuery } from "@tanstack/react-query";
import { useRoute, Link } from "wouter";
import { Card, CardContent, CardHeader } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Button } from "@/components/ui/button";
import { ArrowLeft } from "lucide-react";
import { PageHeader, StatusBadge, fmtSar, REBreadcrumb } from "./_shared";

export default function PropertyDetailPage() {
  const [, params] = useRoute("/real-estate/properties/:id");
  const id = params?.id || "";
  const { data: property } = useQuery<any>({ queryKey: ["/api/real-estate/properties", id], queryFn: () => fetch(`/api/real-estate/properties/${id}`, { credentials: "include" }).then((r) => r.json()) });
  const { data: units = [] } = useQuery<any[]>({ queryKey: ["/api/real-estate/units", { propertyId: id }], queryFn: () => fetch(`/api/real-estate/units?propertyId=${id}`, { credentials: "include" }).then((r) => r.json()) });
  const { data: financial } = useQuery<any>({ queryKey: ["/api/real-estate/properties", id, "financial-summary"], queryFn: () => fetch(`/api/real-estate/properties/${id}/financial-summary`, { credentials: "include" }).then((r) => r.json()) });

  if (!property) return <div className="p-6">Loading…</div>;

  return (
    <div className="p-6 max-w-7xl mx-auto">
      <REBreadcrumb />
      <Link href="/real-estate/properties"><Button size="sm" variant="ghost" className="mb-2" data-testid="link-back"><ArrowLeft className="w-4 h-4 mr-1" />Back to Properties</Button></Link>
      <PageHeader title={property.name} subtitle={`${property.type} · ${property.city || ""} ${property.district || ""}`} actions={<StatusBadge status={property.status} />} />

      <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
        <Card><CardHeader className="pb-2 text-xs text-muted-foreground">Units</CardHeader><CardContent><div className="text-xl font-semibold">{units.length}</div></CardContent></Card>
        <Card><CardHeader className="pb-2 text-xs text-muted-foreground">Occupied</CardHeader><CardContent><div className="text-xl font-semibold">{units.filter((u: any) => u.status === "rented").length}</div></CardContent></Card>
        <Card><CardHeader className="pb-2 text-xs text-muted-foreground">Revenue (YTD)</CardHeader><CardContent><div className="text-xl font-semibold text-emerald-600">{fmtSar(financial?.revenue)}</div></CardContent></Card>
        <Card><CardHeader className="pb-2 text-xs text-muted-foreground">Expenses (YTD)</CardHeader><CardContent><div className="text-xl font-semibold text-rose-600">{fmtSar(financial?.expenses)}</div></CardContent></Card>
      </div>

      <Card className="mb-6">
        <CardHeader className="font-semibold">Details</CardHeader>
        <CardContent>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-3 text-sm">
            <div><div className="text-muted-foreground text-xs">Address</div>{property.address || "—"}</div>
            <div><div className="text-muted-foreground text-xs">Owner</div>{property.ownerName || "—"}</div>
            <div><div className="text-muted-foreground text-xs">Area</div>{property.areaSqm ? `${property.areaSqm} sqm` : "—"}</div>
            <div><div className="text-muted-foreground text-xs">Floors</div>{property.floors ?? "—"}</div>
            <div><div className="text-muted-foreground text-xs">Year Built</div>{property.yearBuilt ?? "—"}</div>
            <div><div className="text-muted-foreground text-xs">Purchase Price</div>{fmtSar(property.purchasePrice)}</div>
            <div><div className="text-muted-foreground text-xs">Current Value</div>{fmtSar(property.currentValue)}</div>
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader className="font-semibold">Units in this Property</CardHeader>
        <CardContent className="p-0">
          <Table>
            <TableHeader><TableRow><TableHead>Unit #</TableHead><TableHead>Type</TableHead><TableHead>Bed/Bath</TableHead><TableHead>Monthly Rent</TableHead><TableHead>Status</TableHead></TableRow></TableHeader>
            <TableBody>
              {units.length === 0 && <TableRow><TableCell colSpan={5} className="text-center py-6 text-muted-foreground">No units</TableCell></TableRow>}
              {units.map((u: any) => (
                <TableRow key={u.id} data-testid={`row-unit-${u.id}`}>
                  <TableCell>{u.unitNumber}</TableCell><TableCell>{u.type || "—"}</TableCell>
                  <TableCell>{u.bedrooms ?? "—"}/{u.bathrooms ?? "—"}</TableCell>
                  <TableCell>{fmtSar(u.monthlyRent)}</TableCell><TableCell><StatusBadge status={u.status} /></TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </CardContent>
      </Card>
    </div>
  );
}
