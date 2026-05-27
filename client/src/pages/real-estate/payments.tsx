import { useQuery } from "@tanstack/react-query";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { FileDown, DollarSign, Calendar, Receipt } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { PageHeader, fmtSar, fmtDate, REBreadcrumb, downloadBlob, useRET, ViewToggle, useViewMode } from "./_shared";
import { localizedMethod } from "@/i18n/realEstateTranslations";

export default function PaymentsPage() {
  const t = useRET();
  const { toast } = useToast();
  const [view, setView] = useViewMode("payments");
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
      <PageHeader title={t.payments} subtitle={t.paymentsSubtitle} actions={
        <ViewToggle view={view} onChange={setView} testId="toggle-view-payments" />
      } />
      {view === "list" ? (
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
      ) : (
        <div>
          {isLoading && <div className="text-center py-10 text-muted-foreground">{t.loading}</div>}
          {!isLoading && payments.length === 0 && <div className="text-center py-10 text-muted-foreground">{t.noPayments}</div>}
          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
            {payments.map((p: any) => (
              <Card key={p.id} className="hover-elevate" data-testid={`card-payment-${p.id}`}>
                <CardContent className="p-4 flex flex-col gap-3">
                  <div className="flex items-start justify-between gap-2">
                    <div className="flex items-center gap-2 min-w-0">
                      <div className="w-10 h-10 rounded-md bg-emerald-500/15 text-emerald-600 flex items-center justify-center shrink-0"><DollarSign className="w-5 h-5" /></div>
                      <div className="min-w-0">
                        <div className="font-semibold truncate" data-testid={`text-payment-amount-${p.id}`}>{fmtSar(p.amountPaid)}</div>
                        <div className="text-xs text-muted-foreground flex items-center gap-1"><Calendar className="w-3 h-3" />{fmtDate(p.paymentDate)}</div>
                      </div>
                    </div>
                  </div>
                  <div className="space-y-1.5 text-sm">
                    <div className="flex items-center gap-1.5 text-muted-foreground"><Receipt className="w-3.5 h-3.5" /><span className="text-foreground truncate">{invLabel(p.invoiceId)}</span></div>
                    <div className="text-xs"><span className="text-muted-foreground">{t.method}:</span> <span>{localizedMethod(t, p.method)}</span></div>
                    <div className="text-xs"><span className="text-muted-foreground">{t.reference}:</span> <span>{p.referenceNumber || "—"}</span></div>
                  </div>
                  <div className="flex justify-end gap-1 pt-2 border-t">
                    <Button size="icon" variant="ghost" onClick={() => downloadReceipt(p.id)} data-testid={`button-receipt-${p.id}`}><FileDown className="w-4 h-4" /></Button>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
