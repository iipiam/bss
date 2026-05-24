import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { FileDown, FileSpreadsheet, Search } from "lucide-react";
import { useQuery } from "@tanstack/react-query";
import { useToast } from "@/hooks/use-toast";
import type { Transaction } from "@shared/schema";
import { useState } from "react";
import { exportToPDF, exportToExcel } from "@/lib/exportUtils";
import { useLanguage } from "@/contexts/LanguageContext";
import { Tooltip, TooltipProvider, TooltipTrigger, TooltipContent } from "@/components/ui/tooltip";
import { InfoTip } from "@/components/ui/info-tip";

export default function Sales() {
  const [searchQuery, setSearchQuery] = useState("");
  const { toast } = useToast();
  const { t, isRTL } = useLanguage();
  
  const { data: transactions = [], isLoading } = useQuery<Transaction[]>({
    queryKey: ["/api/transactions"],
  });

  const todaysSales = transactions.reduce((sum, t) => sum + parseFloat(t.total), 0);
  const avgOrderValue = transactions.length > 0 ? todaysSales / transactions.length : 0;

  const filteredTransactions = transactions.filter(tx =>
    (tx.transactionId || "").toLowerCase().includes(searchQuery.toLowerCase())
  );

  const handleExportPDF = () => {
    try {
      const columns = [
        { header: t.transactionId || "Transaction ID", accessor: "transactionId" },
        { header: t.dateAndTime || "Date & Time", accessor: (row: Transaction) => row.createdAt ? new Date(row.createdAt).toLocaleString() : "" },
        { header: t.itemsLabel || "Items", accessor: (row: Transaction) => String(row.itemCount ?? 0) },
        { header: t.subtotalLabel || "Subtotal", accessor: (row: Transaction) => `${parseFloat(row.subtotal ?? "0").toFixed(2)} SAR` },
        { header: t.taxLabel || "Tax (15%)", accessor: (row: Transaction) => `${parseFloat(row.tax ?? "0").toFixed(2)} SAR` },
        { header: t.totalLabel || "Total", accessor: (row: Transaction) => `${parseFloat(row.total ?? "0").toFixed(2)} SAR` },
        { header: t.paymentLabel || "Payment", accessor: "paymentMethod" },
      ];

      const subtitleTpl = t.salesReportSubtitle || "Total sales: %s SAR — Transactions: %s — Avg order: %s SAR";
      const subtitle = subtitleTpl
        .replace('%s', todaysSales.toFixed(2))
        .replace('%s', transactions.length.toString())
        .replace('%s', avgOrderValue.toFixed(2));

      const result = exportToPDF(t.salesTrackingReport || "Sales Tracking Report", filteredTransactions, columns, {
        subtitle,
      });

      if (result.success) {
        toast({
          title: t.exportSuccessful,
          description: `PDF exported as ${result.fileName}`,
        });
      } else {
        throw new Error("PDF export failed");
      }
    } catch (error) {
      toast({
        title: t.exportFailed,
        description: error instanceof Error ? error.message : t.failedToExportPDF,
        variant: "destructive",
      });
    }
  };

  const handleExportExcel = () => {
    try {
      const taxLabel = (t.taxLabel || "Tax").replace(' (15%)', '');
      const exportData = filteredTransactions.map((transaction) => ({
        [t.transactionId || "Transaction ID"]: transaction.transactionId ?? "",
        [t.dateAndTime || "Date & Time"]: transaction.createdAt ? new Date(transaction.createdAt).toLocaleString() : "",
        [t.itemsLabel || "Items"]: transaction.itemCount ?? 0,
        [`${t.subtotalLabel || "Subtotal"} (SAR)`]: parseFloat(transaction.subtotal ?? "0").toFixed(2),
        [`${taxLabel} (SAR)`]: parseFloat(transaction.tax ?? "0").toFixed(2),
        [`${t.totalLabel || "Total"} (SAR)`]: parseFloat(transaction.total ?? "0").toFixed(2),
        [t.paymentLabel || "Payment"]: transaction.paymentMethod ?? "",
      }));

      const result = exportToExcel(t.salesTrackingReport, exportData);

      if (result.success) {
        toast({
          title: t.exportSuccessful,
          description: `Excel exported as ${result.fileName}`,
        });
      } else {
        throw new Error("Excel export failed");
      }
    } catch (error) {
      toast({
        title: t.exportFailed,
        description: error instanceof Error ? error.message : t.failedToExportExcel,
        variant: "destructive",
      });
    }
  };

  if (isLoading) {
    return (
      <div className="p-8">
        <h1 className="text-3xl font-bold mb-2">{t.salesTracking}</h1>
        <p className="text-muted-foreground">{t.loading}</p>
      </div>
    );
  }

  return (
    <TooltipProvider delayDuration={150}>
    <div className="p-8 space-y-6">
      <div className="flex items-center justify-between flex-wrap gap-2">
        <div>
          <h1 className="text-3xl font-bold mb-2">{t.salesTracking}</h1>
          <p className="text-muted-foreground">{t.salesDescription}</p>
        </div>
        <div className="flex gap-2">
          <Button variant="outline" size="sm" onClick={handleExportPDF} data-testid="button-export-pdf">
            <FileDown className="h-4 w-4 mr-2" />
            {t.exportPDF}
          </Button>
          <Button variant="outline" size="sm" onClick={handleExportExcel} data-testid="button-export-excel">
            <FileSpreadsheet className="h-4 w-4 mr-2" />
            {t.exportExcel}
          </Button>
        </div>
      </div>

      <div className="grid gap-6 md:grid-cols-3">
        <Card>
          <CardHeader>
            <CardTitle className="text-sm font-medium text-muted-foreground">
              {t.totalSales}
              <InfoTip>{isRTL ? "إجمالي إيرادات المبيعات عبر جميع المعاملات." : "Total sales revenue across all transactions."}</InfoTip>
            </CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-3xl font-bold font-mono">{todaysSales.toFixed(2)} SAR</p>
            <p className="text-sm text-green-600 mt-2">{t.allTime}</p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader>
            <CardTitle className="text-sm font-medium text-muted-foreground">
              {t.transactions}
              <InfoTip>{isRTL ? "العدد الإجمالي للمعاملات المسجلة." : "Total number of recorded transactions."}</InfoTip>
            </CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-3xl font-bold font-mono">{transactions.length}</p>
            <p className="text-sm text-muted-foreground mt-2">{t.totalCount}</p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader>
            <CardTitle className="text-sm font-medium text-muted-foreground">
              {t.avgOrderValue}
              <InfoTip>{isRTL ? "متوسط قيمة الطلب لكل معاملة." : "Average order value per transaction."}</InfoTip>
            </CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-3xl font-bold font-mono">{avgOrderValue.toFixed(2)} SAR</p>
            <p className="text-sm text-muted-foreground mt-2">{t.perTransaction}</p>
          </CardContent>
        </Card>
      </div>

      <Card className="p-6">
        <div className="flex gap-4 mb-6 flex-wrap">
          <div className="relative flex-1 min-w-64">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <Input
              placeholder="Search by transaction ID..."
              className="pl-10"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              data-testid="input-search-transaction"
            />
          </div>
        </div>

        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>{t.transactionId}</TableHead>
              <TableHead>{t.dateAndTime}</TableHead>
              <TableHead>{t.itemsLabel}</TableHead>
              <TableHead>{t.subtotalLabel}</TableHead>
              <TableHead>{t.taxLabel}</TableHead>
              <TableHead>{t.totalLabel}</TableHead>
              <TableHead>{t.paymentLabel}</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {filteredTransactions.map((transaction) => (
              <TableRow key={transaction.id} data-testid={`row-transaction-${transaction.id}`}>
                <TableCell className="font-mono font-semibold">{transaction.transactionId}</TableCell>
                <TableCell>{new Date(transaction.createdAt).toLocaleString()}</TableCell>
                <TableCell>{transaction.itemCount}</TableCell>
                <TableCell className="font-mono">{parseFloat(transaction.subtotal).toFixed(2)} SAR</TableCell>
                <TableCell className="font-mono">{parseFloat(transaction.tax).toFixed(2)} SAR</TableCell>
                <TableCell className="font-mono font-semibold">{parseFloat(transaction.total).toFixed(2)} SAR</TableCell>
                <TableCell>
                  <Badge variant="secondary">{transaction.paymentMethod}</Badge>
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </Card>
    </div>
    </TooltipProvider>
  );
}
