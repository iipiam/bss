import { useQuery } from "@tanstack/react-query";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { FileDown } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { PageHeader, fmtSar, fmtDate, REBreadcrumb, downloadBlob, useRET } from "./_shared";
import { localizedMethod } from "@/i18n/realEstateTranslations";

export default function PaymentsPage() {
  const t = useRET();
  const { toast } = useToast();
  const { data: payments = [], isLoading } = useQuery<any[]>({ queryKey: ["/api/real-estate/payments"] });
  const { data: invoices = [] } = useQuery<any[]>({ queryKey: ["/api/real-estate/invoices"] });

  const invLabel = (id: string) => invoices.find((i: any) => i.id === id)?.invoiceNumber || "—";

  const downloadReceipt = async (id: string) => {
    try { await downloadBlob(`/api/real-estate/payments/${id}/receipt-pdf`, `receipt-${id}.pdf`); }
    catch (e: any) { toast({ title: t.pdfError, description: e.message, variant: "destructive" }); }
  };

  return (
    <div className="p-6 max-w-7xl mx-auto">
      <REBreadcrumb />
      <PageHeader title={t.payments} subtitle={t.paymentsSubtitle} />
      <Card>
        <CardContent className="p-0">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>{t.dateLabel}</TableHead><TableHead>{t.invoiceNumber}</TableHead><TableHead>{t.amount}</TableHead>
                <TableHead>{t.method}</TableHead><TableHead>{t.reference}</TableHead><TableHead className="w-24">{t.receipt}</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {isLoading && <TableRow><TableCell colSpan={6} className="text-center py-6">{t.loading}</TableCell></TableRow>}
              {!isLoading && payments.length === 0 && <TableRow><TableCell colSpan={6} className="text-center py-6 text-muted-foreground">{t.noPayments}</TableCell></TableRow>}
              {payments.map((p: any) => (
                <TableRow key={p.id} data-testid={`row-payment-${p.id}`}>
                  <TableCell>{fmtDate(p.paymentDate)}</TableCell>
                  <TableCell className="font-medium">{invLabel(p.invoiceId)}</TableCell>
                  <TableCell className="font-semibold text-emerald-600">{fmtSar(p.amountPaid)}</TableCell>
                  <TableCell>{localizedMethod(t, p.method)}</TableCell>
                  <TableCell>{p.referenceNumber || "—"}</TableCell>
                  <TableCell><Button size="icon" variant="ghost" onClick={() => downloadReceipt(p.id)} data-testid={`button-receipt-${p.id}`}><FileDown className="w-4 h-4" /></Button></TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </CardContent>
      </Card>
    </div>
  );
}
