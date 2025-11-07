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

export default function Sales() {
  const [searchQuery, setSearchQuery] = useState("");
  const { toast } = useToast();
  const { t } = useLanguage();
  
  const { data: transactions = [], isLoading } = useQuery<Transaction[]>({
    queryKey: ["/api/transactions"],
  });

  const todaysSales = transactions.reduce((sum, t) => sum + parseFloat(t.total), 0);
  const avgOrderValue = transactions.length > 0 ? todaysSales / transactions.length : 0;

  const filteredTransactions = transactions.filter(t =>
    t.transactionId.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const handleExportPDF = () => {
    try {
      const columns = [
        { header: "Transaction ID", accessor: "transactionId" },
        { header: "Date & Time", accessor: (row: Transaction) => new Date(row.createdAt).toLocaleString() },
        { header: "Items", accessor: (row: Transaction) => row.itemCount.toString() },
        { header: "Subtotal", accessor: (row: Transaction) => `${parseFloat(row.subtotal).toFixed(2)} SAR` },
        { header: "Tax (15%)", accessor: (row: Transaction) => `${parseFloat(row.tax).toFixed(2)} SAR` },
        { header: "Total", accessor: (row: Transaction) => `${parseFloat(row.total).toFixed(2)} SAR` },
        { header: "Payment", accessor: "paymentMethod" },
      ];

      const result = exportToPDF("Sales Tracking Report", filteredTransactions, columns, {
        subtitle: `Total Sales: ${todaysSales.toFixed(2)} SAR | Transactions: ${transactions.length} | Avg Order: ${avgOrderValue.toFixed(2)} SAR`,
      });

      if (result.success) {
        toast({
          title: "Export Successful",
          description: `PDF exported as ${result.fileName}`,
        });
      } else {
        throw new Error("PDF export failed");
      }
    } catch (error) {
      toast({
        title: "Export Failed",
        description: error instanceof Error ? error.message : t.failedToExportPDF,
        variant: "destructive",
      });
    }
  };

  const handleExportExcel = () => {
    try {
      const exportData = filteredTransactions.map((transaction) => ({
        "Transaction ID": transaction.transactionId,
        "Date & Time": new Date(transaction.createdAt).toLocaleString(),
        "Items": transaction.itemCount,
        "Subtotal (SAR)": parseFloat(transaction.subtotal).toFixed(2),
        "Tax (SAR)": parseFloat(transaction.tax).toFixed(2),
        "Total (SAR)": parseFloat(transaction.total).toFixed(2),
        "Payment Method": transaction.paymentMethod,
      }));

      const result = exportToExcel("Sales Tracking", exportData);

      if (result.success) {
        toast({
          title: "Export Successful",
          description: `Excel exported as ${result.fileName}`,
        });
      } else {
        throw new Error("Excel export failed");
      }
    } catch (error) {
      toast({
        title: "Export Failed",
        description: error instanceof Error ? error.message : t.failedToExportExcel,
        variant: "destructive",
      });
    }
  };

  if (isLoading) {
    return (
      <div className="p-8">
        <h1 className="text-3xl font-bold mb-2">Sales Tracking</h1>
        <p className="text-muted-foreground">Loading...</p>
      </div>
    );
  }

  return (
    <div className="p-8 space-y-6">
      <div className="flex items-center justify-between flex-wrap gap-2">
        <div>
          <h1 className="text-3xl font-bold mb-2">Sales Tracking</h1>
          <p className="text-muted-foreground">View transaction history and summaries</p>
        </div>
        <div className="flex gap-2">
          <Button variant="outline" size="sm" onClick={handleExportPDF} data-testid="button-export-pdf">
            <FileDown className="h-4 w-4 mr-2" />
            Export PDF
          </Button>
          <Button variant="outline" size="sm" onClick={handleExportExcel} data-testid="button-export-excel">
            <FileSpreadsheet className="h-4 w-4 mr-2" />
            Export Excel
          </Button>
        </div>
      </div>

      <div className="grid gap-6 md:grid-cols-3">
        <Card>
          <CardHeader>
            <CardTitle className="text-sm font-medium text-muted-foreground">Total Sales</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-3xl font-bold font-mono">{todaysSales.toFixed(2)} SAR</p>
            <p className="text-sm text-green-600 mt-2">All time</p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader>
            <CardTitle className="text-sm font-medium text-muted-foreground">Transactions</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-3xl font-bold font-mono">{transactions.length}</p>
            <p className="text-sm text-muted-foreground mt-2">Total count</p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader>
            <CardTitle className="text-sm font-medium text-muted-foreground">Avg. Order Value</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-3xl font-bold font-mono">{avgOrderValue.toFixed(2)} SAR</p>
            <p className="text-sm text-muted-foreground mt-2">Per transaction</p>
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
              <TableHead>Transaction ID</TableHead>
              <TableHead>Date & Time</TableHead>
              <TableHead>Items</TableHead>
              <TableHead>Subtotal</TableHead>
              <TableHead>Tax (15%)</TableHead>
              <TableHead>Total</TableHead>
              <TableHead>Payment</TableHead>
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
  );
}
