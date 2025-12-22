import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import {
  Plus,
  Search,
  Edit,
  Trash2,
  Printer,
  Star,
  Wifi,
  Usb,
  Bluetooth,
  CheckCircle,
  ShoppingCart,
} from "lucide-react";
import { useQuery, useMutation } from "@tanstack/react-query";
import { apiRequest, queryClient } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { useLanguage } from "@/contexts/LanguageContext";
import { useDeviceLayout } from "@/lib/mobileLayout";
import type { Printer as PrinterType } from "@shared/schema";
import type { Translations } from "@/i18n/translations";
// Display names for the UI
const PRINTER_BRANDS = [
  { value: "epson", label: "Epson" },
  { value: "star", label: "Star Micronics" },
  { value: "bixolon", label: "Bixolon" },
  { value: "citizen", label: "Citizen" },
  { value: "generic", label: "Generic/Other" },
] as const;
const PRINTER_TYPES = [
  { value: "thermal", label: "Thermal" },
  { value: "inkjet", label: "Inkjet" },
  { value: "laser", label: "Laser" },
] as const;
const CONNECTION_TYPES = ["network", "usb", "bluetooth"] as const;
type PrinterFormValues = {
  name: string;
  brand: string;
  printerType: string;
  connectionType: string;
  ipAddress: string;
  branchId: string;
};
interface PrinterCardProps {
  printer: PrinterType;
  onEdit: (printer: PrinterType) => void;
  onDelete: (printer: PrinterType) => void;
  onSetDefault: (printer: PrinterType) => void;
  t: Translations;
}
function PrinterCard({
  printer,
  onEdit,
  onDelete,
  onSetDefault,
  t,
}: PrinterCardProps) {
  const getConnectionIcon = (type: string) => {
    switch (type) {
      case "network":
        return <Wifi className="h-4 w-4" />;
      case "usb":
        return <Usb className="h-4 w-4" />;
      case "bluetooth":
        return <Bluetooth className="h-4 w-4" />;
      default:
        return <Wifi className="h-4 w-4" />;
    }
  };
  const getConnectionLabel = (type: string) => {
    switch (type) {
      case "network":
        return t.printerNetwork;
      case "usb":
        return t.printerUsb;
      case "bluetooth":
        return t.printerBluetooth;
      default:
        return type;
    }
  };
  return (
    <Card className="hover-elevate" data-testid={`card-printer-${printer.id}`}>
      <CardContent className="p-4">
        <div className="flex items-start justify-between gap-4">
          <div className="flex items-start gap-3">
            <div className="h-10 w-10 rounded-lg bg-primary/10 flex items-center justify-center">
              <Printer className="h-5 w-5 text-primary" />
            </div>
            <div className="space-y-1">
              <div className="flex items-center gap-2">
                <h3
                  className="font-semibold"
                  data-testid={`text-printer-name-${printer.id}`}
                >
                  {printer.name}
                </h3>
                {printer.isDefault && (
                  <Badge
                    variant="secondary"
                    className="flex items-center gap-1"
                  >
                    <Star className="h-3 w-3 fill-current" />
                    {t.defaultPrinter}
                  </Badge>
                )}
              </div>
              <p
                className="text-sm text-muted-foreground"
                data-testid={`text-printer-brand-${printer.id}`}
              >
                {printer.brand}
              </p>
              <div className="flex items-center gap-2 text-sm text-muted-foreground">
                {getConnectionIcon(printer.connectionType)}
                <span>{getConnectionLabel(printer.connectionType)}</span>
                {printer.connectionType === "network" && printer.ipAddress && (
                  <span
                    className="text-xs bg-muted px-2 py-0.5 rounded"
                    data-testid={`text-printer-ip-${printer.id}`}
                  >
                    {printer.ipAddress}
                  </span>
                )}
              </div>
            </div>
          </div>
          <div className="flex items-center gap-1">
            {!printer.isDefault && (
              <Button
                variant="ghost"
                size="icon"
                onClick={() => onSetDefault(printer)}
                title={t.setAsDefault}
                data-testid={`button-set-default-${printer.id}`}
              >
                <Star className="h-4 w-4" />
              </Button>
            )}
            <Button
              variant="ghost"
              size="icon"
              onClick={() => onEdit(printer)}
              data-testid={`button-edit-printer-${printer.id}`}
            >
              <Edit className="h-4 w-4" />
            </Button>
            <Button
              variant="ghost"
              size="icon"
              onClick={() => onDelete(printer)}
              data-testid={`button-delete-printer-${printer.id}`}
            >
              <Trash2 className="h-4 w-4" />
            </Button>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
export default function PrinterSettings() {
  const layout = useDeviceLayout();
  const [searchQuery, setSearchQuery] = useState("");
  const [open, setOpen] = useState(false);
  const [editingPrinter, setEditingPrinter] = useState<PrinterType | null>(
    null,
  );
  const [deletingPrinter, setDeletingPrinter] = useState<PrinterType | null>(
    null,
  );
  const [showInvoicePreview, setShowInvoicePreview] = useState(false);
  const { toast } = useToast();
  const { t } = useLanguage();
  const printerFormSchema = z
    .object({
      name: z.string().min(1, t.enterPrinterName || "Printer name is required"),
      brand: z.string().min(1, t.selectBrand || "Brand is required"),
      printerType: z.string().min(1, "Printer type is required"),
      connectionType: z.string().min(1, "Connection type is required"),
      ipAddress: z.string().optional(),
      branchId: z.string().optional(),
    })
    .refine(
      (data) => {
        if (data.connectionType === "network") {
          return data.ipAddress && data.ipAddress.trim().length > 0;
        }
        return true;
      },
      {
        message:
          t.enterIpAddress || "IP address is required for network printers",
        path: ["ipAddress"],
      },
    );
  const form = useForm<PrinterFormValues>({
    resolver: zodResolver(printerFormSchema),
    defaultValues: {
      name: "",
      brand: "",
      printerType: "thermal",
      connectionType: "network",
      ipAddress: "",
      branchId: "",
    },
  });
  const connectionType = form.watch("connectionType");
  const { data: printers = [], isLoading } = useQuery<PrinterType[]>({
    queryKey: ["/api/printers"],
  });
  const createPrinterMutation = useMutation({
    mutationFn: async (data: PrinterFormValues) => {
      return await apiRequest("POST", "/api/printers", {
        name: data.name,
        brand: data.brand,
        printerType: data.printerType,
        connectionType: data.connectionType,
        ipAddress: data.connectionType === "network" ? data.ipAddress : null,
        branchId: data.branchId || null,
      });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/printers"] });
      toast({
        title: t.printerCreated,
        description: t.printerCreatedDesc,
      });
      handleCloseDialog();
    },
    onError: (error: Error) => {
      toast({
        title: t.failedToCreatePrinter,
        description: error.message,
        variant: "destructive",
      });
    },
  });
  const updatePrinterMutation = useMutation({
    mutationFn: async ({
      id,
      data,
    }: {
      id: string;
      data: PrinterFormValues;
    }) => {
      return await apiRequest("PATCH", `/api/printers/${id}`, {
        name: data.name,
        brand: data.brand,
        printerType: data.printerType,
        connectionType: data.connectionType,
        ipAddress: data.connectionType === "network" ? data.ipAddress : null,
        branchId: data.branchId || null,
      });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/printers"] });
      toast({
        title: t.printerUpdated,
        description: t.printerUpdatedDesc,
      });
      handleCloseDialog();
    },
    onError: (error: Error) => {
      toast({
        title: t.failedToUpdatePrinter,
        description: error.message,
        variant: "destructive",
      });
    },
  });
  const deletePrinterMutation = useMutation({
    mutationFn: async (id: string) => {
      return await apiRequest("DELETE", `/api/printers/${id}`);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/printers"] });
      toast({
        title: t.printerDeleted,
        description: t.printerDeletedDesc,
      });
      setDeletingPrinter(null);
    },
    onError: (error: Error) => {
      toast({
        title: t.failedToDeletePrinter,
        description: error.message,
        variant: "destructive",
      });
    },
  });
  const setDefaultMutation = useMutation({
    mutationFn: async (id: string) => {
      return await apiRequest("POST", `/api/printers/${id}/set-default`, {});
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/printers"] });
      toast({
        title: t.printerSetAsDefault,
        description: t.printerUpdatedDesc,
      });
    },
    onError: (error: Error) => {
      toast({
        title: t.error,
        description: error.message,
        variant: "destructive",
      });
    },
  });
  // New: Mutation for sending print job (assumes backend endpoint /api/printers/:id/print)
  const printMutation = useMutation({
    mutationFn: async ({
      printerId,
      printData,
    }: {
      printerId: string;
      printData: { text: string };
    }) => {
      return await apiRequest(
        "POST",
        `/api/printers/${printerId}/print`,
        printData,
      );
    },
    onSuccess: () => {
      toast({
        title: "Print Sent",
        description: "The print job has been sent to the printer.",
      });
    },
    onError: (error: Error) => {
      toast({
        title: "Failed to Print",
        description: error.message,
        variant: "destructive",
      });
    },
  });
  const handleCloseDialog = () => {
    setOpen(false);
    setEditingPrinter(null);
    form.reset({
      name: "",
      brand: "",
      printerType: "thermal",
      connectionType: "network",
      ipAddress: "",
      branchId: "",
    });
  };
  const handleEdit = (printer: PrinterType) => {
    setEditingPrinter(printer);
    form.reset({
      name: printer.name,
      brand: printer.brand || "",
      printerType: printer.printerType || "thermal",
      connectionType: printer.connectionType,
      ipAddress: printer.ipAddress || "",
      branchId: printer.branchId || "",
    });
    setOpen(true);
  };
  const handleDelete = (printer: PrinterType) => {
    setDeletingPrinter(printer);
  };
  const handleSetDefault = (printer: PrinterType) => {
    setDefaultMutation.mutate(printer.id);
  };
  const onSubmit = (data: PrinterFormValues) => {
    if (editingPrinter) {
      updatePrinterMutation.mutate({ id: editingPrinter.id, data });
    } else {
      createPrinterMutation.mutate(data);
    }
  };
  const filteredPrinters = printers.filter(
    (printer) =>
      printer.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      (printer.brand &&
        printer.brand.toLowerCase().includes(searchQuery.toLowerCase())),
  );
  // New: Simulate proceeding an order (replace with real API if needed)
  const proceedOrder = () => {
    // Simulate order proceed logic (e.g., call /api/orders/proceed)
    toast({
      title: "Order Proceeded",
      description: "The order has been successfully processed.",
    });
  };
  // New: Handle Checkout button - opens invoice preview modal
  const handleCheckout = () => {
    setShowInvoicePreview(true);
    proceedOrder();
  };
  // New: Handle Print button (proceed + print to default printer)
  const handlePrintOrder = () => {
    const defaultPrinter = printers.find((p) => p.isDefault);
    if (!defaultPrinter) {
      toast({
        title: "No Default Printer",
        description: "Please set a default printer first.",
        variant: "destructive",
      });
      return;
    }
    proceedOrder();
    // Send print job with sample receipt text (customize for real orders)
    printMutation.mutate({
      printerId: defaultPrinter.id,
      printData: {
        text: `Order Receipt\n----------------\nItem: Example Product\nQuantity: 1\nTotal: $10.00\nThank you!`,
      },
    });
  };
  return (
    <div className={`${layout.device === "iphone" ? "p-3" : "p-6"} space-y-6`}>
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between gap-4 flex-wrap">
            <div>
              <CardTitle className="flex items-center gap-2">
                <Printer className="h-5 w-5" />
                {t.configurePrinters}
              </CardTitle>
              <CardDescription>{t.printersDescription}</CardDescription>
            </div>
            <Dialog
              open={open}
              onOpenChange={(isOpen) => {
                if (!isOpen) handleCloseDialog();
                else setOpen(true);
              }}
            >
              <DialogTrigger asChild>
                <Button data-testid="button-add-printer">
                  <Plus className="mr-2 h-4 w-4" />
                  {t.addPrinter}
                </Button>
              </DialogTrigger>
              <DialogContent className="max-w-md">
                <DialogHeader>
                  <DialogTitle>
                    {editingPrinter ? t.editPrinter : t.addPrinter}
                  </DialogTitle>
                  <DialogDescription>
                    {editingPrinter
                      ? t.printerUpdatedDesc
                      : t.printersDescription}
                  </DialogDescription>
                </DialogHeader>
                <Form {...form}>
                  <form
                    onSubmit={form.handleSubmit(onSubmit)}
                    className="space-y-4"
                  >
                    <FormField
                      control={form.control}
                      name="name"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>{t.printerName}</FormLabel>
                          <FormControl>
                            <Input
                              placeholder={t.enterPrinterName}
                              {...field}
                              data-testid="input-printer-name"
                            />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                    <FormField
                      control={form.control}
                      name="brand"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>{t.printerBrand}</FormLabel>
                          <Select
                            onValueChange={field.onChange}
                            value={field.value}
                          >
                            <FormControl>
                              <SelectTrigger data-testid="select-printer-brand">
                                <SelectValue placeholder={t.selectBrand} />
                              </SelectTrigger>
                            </FormControl>
                            <SelectContent>
                              {PRINTER_BRANDS.map((brand) => (
                                <SelectItem
                                  key={brand.value}
                                  value={brand.value}
                                >
                                  {brand.label}
                                </SelectItem>
                              ))}
                            </SelectContent>
                          </Select>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                    <FormField
                      control={form.control}
                      name="printerType"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>
                            {t.printerType || "Printer Type"}
                          </FormLabel>
                          <Select
                            onValueChange={field.onChange}
                            value={field.value}
                          >
                            <FormControl>
                              <SelectTrigger data-testid="select-printer-type">
                                <SelectValue
                                  placeholder={
                                    t.selectPrinterType || "Select printer type"
                                  }
                                />
                              </SelectTrigger>
                            </FormControl>
                            <SelectContent>
                              {PRINTER_TYPES.map((type) => (
                                <SelectItem key={type.value} value={type.value}>
                                  {type.label}
                                </SelectItem>
                              ))}
                            </SelectContent>
                          </Select>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                    <FormField
                      control={form.control}
                      name="connectionType"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>{t.connectionType}</FormLabel>
                          <Select
                            onValueChange={field.onChange}
                            value={field.value}
                          >
                            <FormControl>
                              <SelectTrigger data-testid="select-connection-type">
                                <SelectValue />
                              </SelectTrigger>
                            </FormControl>
                            <SelectContent>
                              <SelectItem value="network">
                                <div className="flex items-center gap-2">
                                  <Wifi className="h-4 w-4" />
                                  {t.printerNetwork}
                                </div>
                              </SelectItem>
                              <SelectItem value="usb">
                                <div className="flex items-center gap-2">
                                  <Usb className="h-4 w-4" />
                                  {t.printerUsb}
                                </div>
                              </SelectItem>
                              <SelectItem value="bluetooth">
                                <div className="flex items-center gap-2">
                                  <Bluetooth className="h-4 w-4" />
                                  {t.printerBluetooth}
                                </div>
                              </SelectItem>
                            </SelectContent>
                          </Select>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                    {connectionType === "network" && (
                      <FormField
                        control={form.control}
                        name="ipAddress"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>{t.ipAddress}</FormLabel>
                            <FormControl>
                              <Input
                                placeholder={t.enterIpAddress}
                                {...field}
                                data-testid="input-ip-address"
                              />
                            </FormControl>
                            <FormMessage />
                          </FormItem>
                        )}
                      />
                    )}
                    <div className="flex justify-end gap-2 pt-4">
                      <Button
                        type="button"
                        variant="outline"
                        onClick={handleCloseDialog}
                        data-testid="button-cancel"
                      >
                        {t.cancel}
                      </Button>
                      <Button
                        type="submit"
                        disabled={
                          createPrinterMutation.isPending ||
                          updatePrinterMutation.isPending
                        }
                        data-testid="button-save-printer"
                      >
                        {createPrinterMutation.isPending ||
                        updatePrinterMutation.isPending
                          ? t.loading
                          : t.save}
                      </Button>
                    </div>
                  </form>
                </Form>
              </DialogContent>
            </Dialog>
          </div>
        </CardHeader>
        <CardContent>
          {printers.length > 0 && (
            <div className="mb-4">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
                <Input
                  placeholder={t.searchPrinters}
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="pl-9"
                  data-testid="input-search-printers"
                />
              </div>
            </div>
          )}
          {isLoading ? (
            <div className="flex items-center justify-center py-12">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
            </div>
          ) : filteredPrinters.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-12 text-center">
              <Printer className="h-12 w-12 text-muted-foreground mb-4" />
              <h3 className="text-lg font-semibold mb-1">
                {t.noPrintersFound}
              </h3>
              <p className="text-sm text-muted-foreground mb-4">
                {t.addFirstPrinter}
              </p>
              <Button
                onClick={() => setOpen(true)}
                data-testid="button-add-first-printer"
              >
                <Plus className="mr-2 h-4 w-4" />
                {t.addPrinter}
              </Button>
            </div>
          ) : (
            <div className="grid gap-3 md:grid-cols-2 lg:grid-cols-3">
              {filteredPrinters.map((printer) => (
                <PrinterCard
                  key={printer.id}
                  printer={printer}
                  onEdit={handleEdit}
                  onDelete={handleDelete}
                  onSetDefault={handleSetDefault}
                  t={t}
                />
              ))}
            </div>
          )}
        </CardContent>
      </Card>
      {/* New: Order Simulation Section */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <ShoppingCart className="h-5 w-5" />
            Order Simulation
          </CardTitle>
          <CardDescription>
            Test proceeding an order with checkout or print (using default
            printer).
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-6">
          {/* ZATCA Receipt Examples */}
          <div className="space-y-3">
            <p className="text-sm text-muted-foreground">
              Simulation: Example of printed receipts compliant with Saudi ZATCA e-invoicing regulations (includes mandatory QR code for verification)
            </p>
            <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-5 gap-3">
              <div className="rounded-lg border bg-card overflow-hidden">
                <img
                  src="https://ultimatefosters.com/wp-content/uploads/2025/03/zacta2.png"
                  alt="ZATCA compliant Saudi receipt with QR code - UltimatePOS"
                  className="w-full h-auto object-contain"
                  loading="lazy"
                  data-testid="img-zatca-receipt-1"
                />
              </div>
              <div className="rounded-lg border bg-card overflow-hidden">
                <img
                  src="https://keepmyaccount.com/storage-files/2025/07/ZATCA-On-Boarding.png"
                  alt="ZATCA compliant Saudi receipt with QR code - Full layout"
                  className="w-full h-auto object-contain"
                  loading="lazy"
                  data-testid="img-zatca-receipt-2"
                />
              </div>
              <div className="rounded-lg border bg-card overflow-hidden">
                <img
                  src="https://alhassab.com/wp-content/uploads/2025/06/PNG-06-1024x778.png"
                  alt="ZATCA compliant Saudi POS thermal receipt with QR"
                  className="w-full h-auto object-contain"
                  loading="lazy"
                  data-testid="img-zatca-receipt-3"
                />
              </div>
              <div className="rounded-lg border bg-card overflow-hidden">
                <img
                  src="https://www.refrens.com/grow/wp-content/uploads/2024/05/ZATCA-Compliant-E-Invoices-2.png"
                  alt="ZATCA compliant e-invoice with QR code and required fields"
                  className="w-full h-auto object-contain"
                  loading="lazy"
                  data-testid="img-zatca-receipt-4"
                />
              </div>
              <div className="rounded-lg border bg-card overflow-hidden">
                <img
                  src="https://posbytz.com/wp-content/uploads/2023/12/Banner-01-1.png"
                  alt="ZATCA-approved software receipt example"
                  className="w-full h-auto object-contain"
                  loading="lazy"
                  data-testid="img-zatca-receipt-5"
                />
              </div>
            </div>
          </div>

          {/* Action Buttons */}
          <div className="flex gap-4">
            <Button
              onClick={handleCheckout}
              disabled={isLoading || printMutation.isPending}
              data-testid="button-checkout"
            >
              Checkout
            </Button>
            <Button
              variant="secondary"
              onClick={handlePrintOrder}
              disabled={
                isLoading ||
                printMutation.isPending ||
                !printers.find((p) => p.isDefault)
              }
              data-testid="button-print-order"
            >
              <Printer className="mr-2 h-4 w-4" />
              Print
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* Invoice Preview Modal */}
      <Dialog open={showInvoicePreview} onOpenChange={setShowInvoicePreview}>
        <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <Printer className="h-5 w-5" />
              ZATCA-Compliant Invoice Preview (Simulation)
            </DialogTitle>
            <DialogDescription>
              This is exactly how a simplified tax invoice will appear when printed on your thermal receipt printer – fully compliant with Saudi ZATCA e-invoicing regulations, including the mandatory QR code for customer verification.
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4">
            {/* Main Preview Image */}
            <div className="flex justify-center">
              <img
                src="https://bytize.xyz/wp-content/uploads/2025/02/zatca_invoice.png"
                alt="ZATCA compliant Saudi POS thermal receipt with QR code"
                className="max-w-full h-auto max-h-[60vh] object-contain rounded-lg shadow-lg"
                data-testid="img-invoice-preview-main"
              />
            </div>
            
            {/* Additional Example Thumbnails */}
            <div className="space-y-2">
              <p className="text-sm text-muted-foreground font-medium">Additional ZATCA Invoice Examples:</p>
              <div className="grid grid-cols-3 gap-3">
                <div className="rounded-lg border bg-white overflow-hidden shadow-sm">
                  <img
                    src="https://www.refrens.com/grow/wp-content/uploads/2024/05/ZATCA-Compliant-E-Invoices-2.png"
                    alt="ZATCA compliant e-invoice with QR code and VAT details"
                    className="w-full h-auto object-contain"
                    loading="lazy"
                    data-testid="img-invoice-preview-thumb-1"
                  />
                </div>
                <div className="rounded-lg border bg-white overflow-hidden shadow-sm">
                  <img
                    src="https://posbytz.com/wp-content/uploads/2023/12/Banner-01-1.png"
                    alt="ZATCA POS thermal receipt example with bilingual text"
                    className="w-full h-auto object-contain"
                    loading="lazy"
                    data-testid="img-invoice-preview-thumb-2"
                  />
                </div>
                <div className="rounded-lg border bg-white overflow-hidden shadow-sm">
                  <img
                    src="https://ultimatefosters.com/wp-content/uploads/2025/06/example_of_a_compliant_pdf_invoice_with_qr_code.webp"
                    alt="ZATCA compliant PDF invoice with QR code"
                    className="w-full h-auto object-contain"
                    loading="lazy"
                    data-testid="img-invoice-preview-thumb-3"
                  />
                </div>
              </div>
            </div>
            
            {/* Info Note */}
            <div className="bg-muted/50 rounded-lg p-3 text-sm text-muted-foreground">
              <p className="flex items-start gap-2">
                <CheckCircle className="h-4 w-4 mt-0.5 text-green-600 flex-shrink-0" />
                <span>
                  All invoices include mandatory ZATCA requirements: QR code for Fatoora portal verification, 
                  seller VAT number, invoice date/time, itemized totals with 15% VAT, and bilingual Arabic/English text.
                </span>
              </p>
            </div>
          </div>
        </DialogContent>
      </Dialog>

      <AlertDialog
        open={!!deletingPrinter}
        onOpenChange={(isOpen) => !isOpen && setDeletingPrinter(null)}
      >
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>{t.deletePrinter}</AlertDialogTitle>
            <AlertDialogDescription>
              {t.actionCannotBeUndone}
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel data-testid="button-cancel-delete">
              {t.cancel}
            </AlertDialogCancel>
            <AlertDialogAction
              onClick={() =>
                deletingPrinter &&
                deletePrinterMutation.mutate(deletingPrinter.id)
              }
              disabled={deletePrinterMutation.isPending}
              data-testid="button-confirm-delete"
            >
              {deletePrinterMutation.isPending ? t.deleting : t.delete}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
