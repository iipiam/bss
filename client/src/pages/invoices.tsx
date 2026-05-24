import { useState } from "react";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Tooltip, TooltipContent, TooltipTrigger, TooltipProvider } from "@/components/ui/tooltip";
import { InfoTip } from "@/components/ui/info-tip";
import { Input } from "@/components/ui/input";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Search, Download, FileText, FileCode, Building2, User, Minus, Plus, MoreHorizontal } from "lucide-react";
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from "@/components/ui/dropdown-menu";
import { useQuery, useMutation } from "@tanstack/react-query";
import { useToast } from "@/hooks/use-toast";
import { apiRequest, queryClient } from "@/lib/queryClient";
import type { Invoice } from "@shared/schema";
import { format } from "date-fns";
import { useLanguage } from "@/contexts/LanguageContext";

type InvoiceTypeFilter = "all" | "standard" | "simplified";
type NoteType = "credit_note" | "debit_note";

export default function Invoices() {
  const { t, isRTL } = useLanguage();
  const [searchQuery, setSearchQuery] = useState("");
  const [typeFilter, setTypeFilter] = useState<InvoiceTypeFilter>("all");
  const [adjustmentDialogOpen, setAdjustmentDialogOpen] = useState(false);
  const [selectedInvoice, setSelectedInvoice] = useState<Invoice | null>(null);
  const [noteType, setNoteType] = useState<NoteType>("credit_note");
  const [adjustmentReason, setAdjustmentReason] = useState("");
  const { toast } = useToast();

  const { data: invoices = [], isLoading } = useQuery<Invoice[]>({
    queryKey: ["/api/invoices"],
  });

  const createAdjustmentNote = useMutation({
    mutationFn: async (data: { invoiceId: string; noteType: NoteType; reason: string }) => {
      const response = await apiRequest("POST", `/api/invoices/${data.invoiceId}/adjustment-note`, {
        noteType: data.noteType,
        reason: data.reason,
      });
      return response.json();
    },
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: ["/api/invoices"] });
      toast({
        title: noteType === "credit_note" ? "Credit Note Created" : "Debit Note Created",
        description: data.message || `Successfully created ${noteType === "credit_note" ? "credit" : "debit"} note`,
      });
      setAdjustmentDialogOpen(false);
      setSelectedInvoice(null);
      setAdjustmentReason("");
    },
    onError: (error: any) => {
      let errorMessage = "An unexpected error occurred";
      if (error && typeof error === 'object') {
        if (error.message) {
          errorMessage = error.message;
        }
        if (error.details) {
          errorMessage += `. Details: ${JSON.stringify(error.details)}`;
        }
      }
      toast({
        title: "Failed to create adjustment note",
        description: errorMessage,
        variant: "destructive",
      });
    },
  });

  const openAdjustmentDialog = (invoice: Invoice, type: NoteType) => {
    setSelectedInvoice(invoice);
    setNoteType(type);
    setAdjustmentReason("");
    setAdjustmentDialogOpen(true);
  };

  const handleCreateAdjustmentNote = () => {
    if (!selectedInvoice || adjustmentReason.trim().length < 3) {
      toast({
        title: "Validation Error",
        description: "Please provide a valid reason for the adjustment (at least 3 characters)",
        variant: "destructive",
      });
      return;
    }
    createAdjustmentNote.mutate({
      invoiceId: selectedInvoice.id,
      noteType,
      reason: adjustmentReason.trim(),
    });
  };

  const getDocumentTypeBadge = (invoice: Invoice) => {
    const docType = (invoice as any).documentType;
    if (docType === "credit_note") {
      return (
        <Badge variant="outline" className="bg-green-50 text-green-700 border-green-300 dark:bg-green-950 dark:text-green-300 dark:border-green-700">
          <Minus className="w-3 h-3 mr-1" />
          Credit Note
        </Badge>
      );
    }
    if (docType === "debit_note") {
      return (
        <Badge variant="outline" className="bg-orange-50 text-orange-700 border-orange-300 dark:bg-orange-950 dark:text-orange-300 dark:border-orange-700">
          <Plus className="w-3 h-3 mr-1" />
          Debit Note
        </Badge>
      );
    }
    return null;
  };

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
    <TooltipProvider delayDuration={150}>
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
                  <TableCell>
                    <div className="flex flex-col gap-1">
                      {getInvoiceTypeBadge(invoice)}
                      {getDocumentTypeBadge(invoice)}
                    </div>
                  </TableCell>
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
                      {getInvoiceType(invoice) === "standard" && !(invoice as any).documentType && (
                        <DropdownMenu>
                          <Tooltip>
                            <TooltipTrigger asChild>
                              <DropdownMenuTrigger asChild>
                                <Button variant="ghost" size="icon" data-testid={`button-actions-${invoice.id}`}>
                                  <MoreHorizontal className="h-4 w-4" />
                                </Button>
                              </DropdownMenuTrigger>
                            </TooltipTrigger>
                            <TooltipContent>{isRTL ? "المزيد من الإجراءات" : "More actions"}</TooltipContent>
                          </Tooltip>
                          <DropdownMenuContent align="end">
                            <DropdownMenuItem
                              onClick={() => openAdjustmentDialog(invoice, "credit_note")}
                              data-testid={`action-credit-note-${invoice.id}`}
                            >
                              <Minus className="h-4 w-4 mr-2 text-green-600" />
                              Issue Credit Note
                            </DropdownMenuItem>
                            <DropdownMenuItem
                              onClick={() => openAdjustmentDialog(invoice, "debit_note")}
                              data-testid={`action-debit-note-${invoice.id}`}
                            >
                              <Plus className="h-4 w-4 mr-2 text-orange-600" />
                              Issue Debit Note
                            </DropdownMenuItem>
                          </DropdownMenuContent>
                        </DropdownMenu>
                      )}
                    </div>
                  </TableCell>
                </TableRow>
              ))
            )}
          </TableBody>
        </Table>
      </Card>

      <Dialog open={adjustmentDialogOpen} onOpenChange={setAdjustmentDialogOpen}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>
              {noteType === "credit_note" ? (
                <span className="flex items-center gap-2">
                  <Minus className="h-5 w-5 text-green-600" />
                  Issue Credit Note
                </span>
              ) : (
                <span className="flex items-center gap-2">
                  <Plus className="h-5 w-5 text-orange-600" />
                  Issue Debit Note
                </span>
              )}
            </DialogTitle>
            <DialogDescription>
              {noteType === "credit_note"
                ? "Create a credit note to refund or reduce the original invoice amount."
                : "Create a debit note to add charges to the original invoice."}
            </DialogDescription>
          </DialogHeader>

          {selectedInvoice && (
            <div className="space-y-4">
              <div className="p-4 bg-muted rounded-lg">
                <div className="text-sm text-muted-foreground mb-1">Original Invoice</div>
                <div className="font-medium">{selectedInvoice.invoiceNumber}</div>
                <div className="text-sm">{selectedInvoice.customerName}</div>
                <div className="font-mono text-lg mt-2">{parseFloat(selectedInvoice.total).toFixed(2)} SAR</div>
              </div>

              <div className="space-y-2">
                <Label htmlFor="adjustment-reason">
                  Reason for {noteType === "credit_note" ? "Credit" : "Debit"} Note
                  <InfoTip>{isRTL ? "اشرح سبب إصدار هذا الإشعار (3 أحرف على الأقل)." : "Explain why this note is being issued (minimum 3 characters)."}</InfoTip>
                </Label>
                <Textarea
                  id="adjustment-reason"
                  placeholder={noteType === "credit_note" 
                    ? "e.g., Return of goods, Pricing error correction, Service cancellation..."
                    : "e.g., Additional services, Price adjustment, Shipping charges..."
                  }
                  value={adjustmentReason}
                  onChange={(e) => setAdjustmentReason(e.target.value)}
                  data-testid="input-adjustment-reason"
                  className="min-h-[100px]"
                />
                <p className="text-xs text-muted-foreground">
                  {noteType === "credit_note"
                    ? "This will create a full credit note for the entire invoice amount."
                    : "This will create a full debit note for the entire invoice amount."}
                </p>
              </div>
            </div>
          )}

          <DialogFooter className="gap-2 sm:gap-0">
            <Button variant="outline" onClick={() => setAdjustmentDialogOpen(false)} data-testid="button-cancel-adjustment">
              Cancel
            </Button>
            <Button 
              onClick={handleCreateAdjustmentNote}
              disabled={createAdjustmentNote.isPending || adjustmentReason.trim().length < 3}
              className={noteType === "credit_note" ? "bg-green-600 hover:bg-green-700" : "bg-orange-600 hover:bg-orange-700"}
              data-testid="button-confirm-adjustment"
            >
              {createAdjustmentNote.isPending ? "Creating..." : `Create ${noteType === "credit_note" ? "Credit" : "Debit"} Note`}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
    </TooltipProvider>
  );
}
