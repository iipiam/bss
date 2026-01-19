import { useState } from "react";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Search, Download, FileText, FileCode, Building2, User } from "lucide-react";
import { useQuery } from "@tanstack/react-query";
import { useToast } from "@/hooks/use-toast";
import type { Invoice } from "@shared/schema";
import { format } from "date-fns";
import { useLanguage } from "@/contexts/LanguageContext";

type InvoiceTypeFilter = "all" | "standard" | "simplified";

export default function Invoices() {
  const { t } = useLanguage();
  const [searchQuery, setSearchQuery] = useState("");
  const [typeFilter, setTypeFilter] = useState<InvoiceTypeFilter>("all");
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

  const getInvoiceType = (invoice: Invoice): "standard" | "simplified" => {
    // Use explicit invoiceType if available
    const invoiceData = invoice as any;
    if (invoiceData.invoiceType === "standard" || invoiceData.invoiceType === "simplified") {
      return invoiceData.invoiceType;
    }
    // Fallback for legacy invoices: if customer VAT number exists, it's B2B
    // Otherwise default to simplified (B2C) which is most common for walk-in customers
    if (invoiceData.customerVatNumber) {
      return "standard";
    }
    return "simplified";
  };

  const filteredInvoices = invoices.filter((invoice) => {
    const query = searchQuery.toLowerCase();
    const matchesSearch = 
      invoice.invoiceNumber.toLowerCase().includes(query) ||
      (invoice.customerName && invoice.customerName.toLowerCase().includes(query));
    
    const invoiceType = getInvoiceType(invoice);
    const matchesType = 
      typeFilter === "all" || 
      invoiceType === typeFilter;
    
    return matchesSearch && matchesType;
  });

  const getInvoiceTypeBadge = (invoice: Invoice) => {
    const type = getInvoiceType(invoice);
    if (type === "standard") {
      return (
        <Badge variant="default" className="bg-blue-600">
          <Building2 className="w-3 h-3 mr-1" />
          B2B
        </Badge>
      );
    }
    return (
      <Badge variant="secondary">
        <User className="w-3 h-3 mr-1" />
        B2C
      </Badge>
    );
  };

  const standardCount = invoices.filter(i => getInvoiceType(i) === "standard").length;
  const simplifiedCount = invoices.filter(i => getInvoiceType(i) === "simplified").length;

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
        <div className="flex flex-col gap-4 mb-6">
          <Tabs value={typeFilter} onValueChange={(v) => setTypeFilter(v as InvoiceTypeFilter)}>
            <TabsList>
              <TabsTrigger value="all" data-testid="tab-all-invoices">
                {(t as any).allInvoices || "All Invoices"} ({invoices.length})
              </TabsTrigger>
              <TabsTrigger value="standard" data-testid="tab-b2b-invoices">
                <Building2 className="w-4 h-4 mr-1" />
                B2B {(t as any).standard || "Standard"} ({standardCount})
              </TabsTrigger>
              <TabsTrigger value="simplified" data-testid="tab-b2c-invoices">
                <User className="w-4 h-4 mr-1" />
                B2C {(t as any).simplified || "Simplified"} ({simplifiedCount})
              </TabsTrigger>
            </TabsList>
          </Tabs>
          
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
              <TableHead>{(t as any).type || "Type"}</TableHead>
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
                <TableCell colSpan={8} className="text-center py-8 text-muted-foreground">
                  {searchQuery || typeFilter !== "all" ? t.noInvoicesFound : t.noInvoices}
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
                  <TableCell>{getInvoiceTypeBadge(invoice)}</TableCell>
                  <TableCell>{invoice.customerName || t.walkInCustomer}</TableCell>
                  <TableCell>{format(new Date(invoice.createdAt), "MMM dd, yyyy HH:mm")}</TableCell>
                  <TableCell className="font-mono">{parseFloat(invoice.subtotal).toFixed(2)} SAR</TableCell>
                  <TableCell className="font-mono">{parseFloat(invoice.vatAmount).toFixed(2)} SAR</TableCell>
                  <TableCell className="font-mono font-semibold">{parseFloat(invoice.total).toFixed(2)} SAR</TableCell>
                  <TableCell className="text-right">
                    <div className="flex justify-end gap-2">
                      {getInvoiceType(invoice) === "standard" || (invoice as any).customerVatNumber ? (
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => handleDownload(invoice)}
                          data-testid={`button-download-pdf-${invoice.id}`}
                        >
                          <Download className="h-4 w-4 mr-1" />
                          PDF
                        </Button>
                      ) : invoice.pdfPath ? (
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
