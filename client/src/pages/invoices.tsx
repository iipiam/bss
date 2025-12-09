import { useState } from "react";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { Search, Download, FileText, FileCode } from "lucide-react";
import { useQuery } from "@tanstack/react-query";
import { useToast } from "@/hooks/use-toast";
import type { Invoice } from "@shared/schema";
import { format } from "date-fns";
import { useLanguage } from "@/contexts/LanguageContext";

export default function Invoices() {
  const { t } = useLanguage();
  const [searchQuery, setSearchQuery] = useState("");
  const { toast } = useToast();

  const { data: invoices = [], isLoading } = useQuery<Invoice[]>({
    queryKey: ["/api/invoices"],
  });

  const handleDownload = async (invoice: Invoice) => {
    try {
      const response = await fetch(`/api/invoices/${invoice.id}/download`);
      if (!response.ok) {
        throw new Error("Failed to download invoice");
      }

      const blob = await response.blob();
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = `invoice-${invoice.invoiceNumber}.pdf`;
      document.body.appendChild(a);
      a.click();
      window.URL.revokeObjectURL(url);
      document.body.removeChild(a);

      toast({
        title: t.invoiceDownloaded,
        description: `${t.invoice} ${invoice.invoiceNumber} ${t.hasBeenDownloaded}`,
      });
    } catch (error) {
      toast({
        title: t.downloadFailed,
        description: error instanceof Error ? error.message : t.downloadInvoiceError,
        variant: "destructive",
      });
    }
  };

  const handleDownloadXml = async (invoice: Invoice) => {
    try {
      const response = await fetch(`/api/invoices/${invoice.id}/download-xml`);
      if (!response.ok) {
        throw new Error("Failed to download XML");
      }

      const blob = await response.blob();
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = `invoice-${invoice.invoiceNumber}.xml`;
      document.body.appendChild(a);
      a.click();
      window.URL.revokeObjectURL(url);
      document.body.removeChild(a);

      toast({
        title: t.invoiceDownloaded,
        description: `${t.invoice} ${invoice.invoiceNumber} XML ${t.hasBeenDownloaded}`,
      });
    } catch (error) {
      toast({
        title: t.downloadFailed,
        description: error instanceof Error ? error.message : (t as any).downloadXmlError || "Failed to download XML",
        variant: "destructive",
      });
    }
  };

  const filteredInvoices = invoices.filter((invoice) => {
    const query = searchQuery.toLowerCase();
    return (
      invoice.invoiceNumber.toLowerCase().includes(query) ||
      (invoice.customerName && invoice.customerName.toLowerCase().includes(query))
    );
  });

  if (isLoading) {
    return (
      <div className="p-8">
        <h1 className="text-3xl font-bold mb-2">{t.invoices}</h1>
        <p className="text-muted-foreground">{t.loadingInvoices}</p>
      </div>
    );
  }

  return (
    <div className="p-8 space-y-6">
      <div>
        <h1 className="text-3xl font-bold mb-2">{t.invoices}</h1>
        <p className="text-muted-foreground">{t.viewAndDownload}</p>
      </div>

      <Card className="p-6">
        <div className="flex gap-4 mb-6">
          <div className="relative flex-1">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <Input
              placeholder={t.searchByInvoice}
              className="pl-10"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              data-testid="input-search-invoice"
            />
          </div>
        </div>

        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>{t.invoiceNumber}</TableHead>
              <TableHead>{t.customer}</TableHead>
              <TableHead>{t.date}</TableHead>
              <TableHead>{t.subtotal}</TableHead>
              <TableHead>{t.vat}</TableHead>
              <TableHead>{t.total}</TableHead>
              <TableHead className="text-right">{t.actions}</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {filteredInvoices.length === 0 ? (
              <TableRow>
                <TableCell colSpan={7} className="text-center py-8 text-muted-foreground">
                  {searchQuery ? t.noInvoicesFound : t.noInvoices}
                </TableCell>
              </TableRow>
            ) : (
              filteredInvoices.map((invoice) => (
                <TableRow key={invoice.id} data-testid={`row-invoice-${invoice.id}`}>
                  <TableCell className="font-medium">
                    <div className="flex items-center gap-2">
                      <FileText className="h-4 w-4 text-muted-foreground" />
                      {invoice.invoiceNumber}
                    </div>
                  </TableCell>
                  <TableCell>{invoice.customerName || t.walkInCustomer}</TableCell>
                  <TableCell>{format(new Date(invoice.createdAt), "MMM dd, yyyy HH:mm")}</TableCell>
                  <TableCell className="font-mono">{parseFloat(invoice.subtotal).toFixed(2)} SAR</TableCell>
                  <TableCell className="font-mono">{parseFloat(invoice.vatAmount).toFixed(2)} SAR</TableCell>
                  <TableCell className="font-mono font-semibold">{parseFloat(invoice.total).toFixed(2)} SAR</TableCell>
                  <TableCell className="text-right">
                    <div className="flex justify-end gap-2">
                      {invoice.pdfPath ? (
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => handleDownload(invoice)}
                          data-testid={`button-download-pdf-${invoice.id}`}
                        >
                          <Download className="h-4 w-4 mr-1" />
                          PDF
                        </Button>
                      ) : (
                        <Badge variant="outline">{t.noPDF}</Badge>
                      )}
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => handleDownloadXml(invoice)}
                        data-testid={`button-download-xml-${invoice.id}`}
                      >
                        <FileCode className="h-4 w-4 mr-1" />
                        XML
                      </Button>
                    </div>
                  </TableCell>
                </TableRow>
              ))
            )}
          </TableBody>
        </Table>
      </Card>
    </div>
  );
}
