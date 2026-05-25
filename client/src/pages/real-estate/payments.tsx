import { useQuery } from "@tanstack/react-query";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Download } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { PageHeader, fmtSar, fmtDate, REBreadcrumb, downloadBlob } from "./_shared";
import { Badge } from "@/components/ui/badge";

export default function PaymentsPage() {
  const { toast } = useToast();
  const { data: payments = [], isLoading } = useQuery<any[]>({ queryKey: ["/api/real-estate/payments"] });
  const { data: tenants = [] } = useQuery<any[]>({ queryKey: ["/api/real-estate/tenants"] });
  const tenantName = (id: string) => tenants.find((t: any) => t.id === id)?.fullName || "—";

  return (
    <div className="p-6 max-w-7xl mx-auto">
      <REBreadcrumb />
      <PageHeader title="Payments" subtitle="All rental payments received" />
      <Card><CardContent className="p-0">
        <Table>
          <TableHeader><TableRow>
            <TableHead>Date</TableHead><TableHead>Tenant</TableHead><TableHead>Amount</TableHead>
            <TableHead>Method</TableHead><TableHead>Reference</TableHead><TableHead className="w-24">Receipt</TableHead>
          </TableRow></TableHeader>
          <TableBody>
            {isLoading && <TableRow><TableCell colSpan={6} className="text-center py-6">Loading…</TableCell></TableRow>}
            {!isLoading && payments.length === 0 && <TableRow><TableCell colSpan={6} className="text-center py-6 text-muted-foreground">No payments</TableCell></TableRow>}
            {payments.map((p: any) => (
              <TableRow key={p.id} data-testid={`row-payment-${p.id}`}>
                <TableCell>{fmtDate(p.paymentDate)}</TableCell>
                <TableCell>{tenantName(p.tenantId)}</TableCell>
                <TableCell className="text-emerald-600 font-medium">{fmtSar(p.amountPaid)}</TableCell>
                <TableCell><Badge variant="outline">{p.method}</Badge></TableCell>
                <TableCell className="text-xs">{p.referenceNumber || "—"} {p.bankName ? `(${p.bankName})` : ""}</TableCell>
                <TableCell>
                  <Button size="icon" variant="ghost" title="Receipt PDF" onClick={() => downloadBlob(`/api/real-estate/payments/${p.id}/receipt-pdf`, `receipt-${p.id}.pdf`).catch((e) => toast({ title: "PDF error", description: e.message, variant: "destructive" }))} data-testid={`button-receipt-${p.id}`}><Download className="w-4 h-4" /></Button>
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </CardContent></Card>
    </div>
  );
}
