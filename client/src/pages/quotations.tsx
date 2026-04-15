import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardHeader } from "@/components/ui/card";
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
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import {
  Plus,
  Search,
  Edit,
  Trash2,
  FileText,
  CheckCircle,
  DollarSign,
  Calendar,
  Phone,
  Mail,
  User,
  Clock,
  ThumbsUp,
  ThumbsDown,
  MessageSquare,
  Download,
} from "lucide-react";
import { useQuery, useMutation } from "@tanstack/react-query";
import { apiRequest, queryClient } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { useLanguage } from "@/contexts/LanguageContext";
import { useDeviceLayout } from "@/lib/mobileLayout";
import { format } from "date-fns";

interface QuotationItem {
  serviceId?: string;
  name: string;
  quantity: number;
  unitPrice: number;
  total: number;
}

interface Quotation {
  id: string;
  restaurantId: string;
  quotationNumber: string;
  projectId: string | null;
  clientName: string;
  clientPhone: string | null;
  clientEmail: string | null;
  description: string | null;
  items: QuotationItem[];
  subtotal: string;
  vatRate: string;
  vatAmount: string;
  totalAmount: string;
  status: string;
  validUntil: string | null;
  notes: string | null;
  createdAt: string;
  declineReason: string | null;
}

const quotationFormSchema = z.object({
  quotationNumber: z.string().min(1, "Quotation number is required"),
  clientName: z.string().min(1, "Client name is required"),
  clientPhone: z.string().optional().default(""),
  clientEmail: z.string().optional().default(""),
  description: z.string().optional().default(""),
  subtotal: z.string().min(1, "Subtotal is required"),
  vatRate: z.string().optional().default("15"),
  vatAmount: z.string().min(1, "VAT amount is required"),
  totalAmount: z.string().min(1, "Total amount is required"),
  status: z.string().min(1, "Status is required"),
  validUntil: z.string().optional().default(""),
  notes: z.string().optional().default(""),
});

type QuotationFormValues = z.infer<typeof quotationFormSchema>;

function getStatusBadgeVariant(status: string): "default" | "secondary" | "outline" | "destructive" {
  switch (status) {
    case "draft":
      return "secondary";
    case "sent":
      return "default";
    case "approved":
      return "default";
    case "declined":
      return "destructive";
    case "expired":
      return "outline";
    default:
      return "secondary";
  }
}

function getStatusBadgeClassName(status: string): string {
  if (status === "approved") {
    return "bg-green-500/10 text-green-700 dark:text-green-400 border-green-500/20";
  }
  return "";
}

export default function Quotations() {
  const [searchQuery, setSearchQuery] = useState("");
  const [open, setOpen] = useState(false);
  const [editingQuotation, setEditingQuotation] = useState<Quotation | null>(null);
  const [deletingQuotation, setDeletingQuotation] = useState<Quotation | null>(null);
  const [approveQuotation, setApproveQuotation] = useState<Quotation | null>(null);
  const [declineQuotation, setDeclineQuotation] = useState<Quotation | null>(null);
  const [declineReason, setDeclineReason] = useState("");
  const [viewDecisionsQuotation, setViewDecisionsQuotation] = useState<Quotation | null>(null);
  const { toast } = useToast();
  const { t } = useLanguage();
  const layout = useDeviceLayout();

  const form = useForm<QuotationFormValues>({
    resolver: zodResolver(quotationFormSchema),
    defaultValues: {
      quotationNumber: "",
      clientName: "",
      clientPhone: "",
      clientEmail: "",
      description: "",
      subtotal: "",
      vatRate: "15",
      vatAmount: "",
      totalAmount: "",
      status: "draft",
      validUntil: "",
      notes: "",
    },
  });

  const { data: quotations = [], isLoading } = useQuery<Quotation[]>({
    queryKey: ["/api/quotations"],
  });

  const { data: decisions = [] } = useQuery<any[]>({
    queryKey: ["/api/quotation-decisions", viewDecisionsQuotation?.id],
    queryFn: async () => {
      if (!viewDecisionsQuotation) return [];
      const res = await fetch(`/api/quotation-decisions?quotationId=${viewDecisionsQuotation.id}`, { credentials: 'include' });
      if (!res.ok) throw new Error('Failed');
      return res.json();
    },
    enabled: !!viewDecisionsQuotation,
  });

  const createQuotationMutation = useMutation({
    mutationFn: async (data: QuotationFormValues) => {
      const payload = {
        ...data,
        clientPhone: data.clientPhone || null,
        clientEmail: data.clientEmail || null,
        description: data.description || null,
        validUntil: data.validUntil || null,
        notes: data.notes || null,
      };
      return await apiRequest("POST", "/api/quotations", payload);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/quotations"] });
      setOpen(false);
      form.reset();
      toast({
        title: t.quotationCreated,
        description: t.quotationCreatedDesc,
      });
    },
    onError: (error: any) => {
      toast({
        title: t.failedToCreateQuotation,
        description: error.message,
        variant: "destructive",
      });
    },
  });

  const updateQuotationMutation = useMutation({
    mutationFn: async (data: QuotationFormValues & { id: string }) => {
      const payload = {
        quotationNumber: data.quotationNumber,
        clientName: data.clientName,
        clientPhone: data.clientPhone || null,
        clientEmail: data.clientEmail || null,
        description: data.description || null,
        subtotal: data.subtotal,
        vatRate: data.vatRate,
        vatAmount: data.vatAmount,
        totalAmount: data.totalAmount,
        status: data.status,
        validUntil: data.validUntil || null,
        notes: data.notes || null,
      };
      return await apiRequest("PATCH", `/api/quotations/${data.id}`, payload);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/quotations"] });
      setOpen(false);
      setEditingQuotation(null);
      form.reset();
      toast({
        title: t.quotationUpdated,
        description: t.quotationUpdatedDesc,
      });
    },
    onError: (error: any) => {
      toast({
        title: t.failedToUpdateQuotation,
        description: error.message,
        variant: "destructive",
      });
    },
  });

  const deleteQuotationMutation = useMutation({
    mutationFn: async (id: string) => {
      await apiRequest("DELETE", `/api/quotations/${id}`);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/quotations"] });
      setDeletingQuotation(null);
      toast({
        title: t.quotationDeleted,
        description: t.quotationDeletedDesc,
      });
    },
    onError: (error: any) => {
      toast({
        title: t.failedToDeleteQuotation,
        description: error.message,
        variant: "destructive",
      });
    },
  });

  const approveQuotationMutation = useMutation({
    mutationFn: async (quotation: Quotation) => {
      await apiRequest("POST", "/api/quotation-decisions", {
        restaurantId: quotation.restaurantId,
        quotationId: quotation.id,
        decision: "approved",
        decidedBy: "admin",
      });
      await apiRequest("PATCH", `/api/quotations/${quotation.id}`, {
        status: "approved",
      });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/quotations"] });
      setApproveQuotation(null);
      toast({
        title: t.quotationApproved || "Quotation Approved",
        description: t.quotationApprovedDesc || "The quotation has been approved successfully.",
      });
    },
    onError: (error: any) => {
      toast({
        title: t.error,
        description: error.message,
        variant: "destructive",
      });
    },
  });

  const declineQuotationMutation = useMutation({
    mutationFn: async ({ quotation, reason }: { quotation: Quotation; reason: string }) => {
      await apiRequest("POST", "/api/quotation-decisions", {
        restaurantId: quotation.restaurantId,
        quotationId: quotation.id,
        decision: "declined",
        reason: reason,
        decidedBy: "admin",
      });
      await apiRequest("PATCH", `/api/quotations/${quotation.id}`, {
        status: "declined",
        declineReason: reason,
      });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/quotations"] });
      setDeclineQuotation(null);
      setDeclineReason("");
      toast({
        title: t.quotationDeclined || "Quotation Declined",
        description: t.quotationDeclinedDesc || "The quotation has been declined.",
      });
    },
    onError: (error: any) => {
      toast({
        title: t.error,
        description: error.message,
        variant: "destructive",
      });
    },
  });

  const onSubmit = (data: QuotationFormValues) => {
    const payload = {
      ...data,
      clientPhone: data.clientPhone || null,
      clientEmail: data.clientEmail || null,
      description: data.description || null,
      validUntil: data.validUntil || null,
      notes: data.notes || null,
    };
    if (editingQuotation) {
      updateQuotationMutation.mutate({ ...payload, id: editingQuotation.id });
    } else {
      createQuotationMutation.mutate(payload);
    }
  };

  const handleEdit = (quotation: Quotation) => {
    setEditingQuotation(quotation);
    form.reset({
      quotationNumber: quotation.quotationNumber,
      clientName: quotation.clientName,
      clientPhone: quotation.clientPhone || "",
      clientEmail: quotation.clientEmail || "",
      description: quotation.description || "",
      subtotal: quotation.subtotal,
      vatRate: quotation.vatRate,
      vatAmount: quotation.vatAmount,
      totalAmount: quotation.totalAmount,
      status: quotation.status,
      validUntil: quotation.validUntil || "",
      notes: quotation.notes || "",
    });
    setOpen(true);
  };

  const handleOpenChange = (isOpen: boolean) => {
    setOpen(isOpen);
    if (!isOpen) {
      setEditingQuotation(null);
      form.reset();
    }
  };

  const handleCloseDialog = () => {
    setOpen(false);
    setEditingQuotation(null);
    form.reset();
  };

  const handleAddNew = () => {
    const nextNumber = quotations.length + 1;
    const suggestion = `QT-${String(nextNumber).padStart(3, "0")}`;
    form.reset({
      quotationNumber: suggestion,
      clientName: "",
      clientPhone: "",
      clientEmail: "",
      description: "",
      subtotal: "",
      vatRate: "15",
      vatAmount: "",
      totalAmount: "",
      status: "draft",
      validUntil: "",
      notes: "",
    });
    setEditingQuotation(null);
    setOpen(true);
  };

  const filteredQuotations = quotations.filter(
    (quotation) =>
      quotation.quotationNumber.toLowerCase().includes(searchQuery.toLowerCase()) ||
      quotation.clientName.toLowerCase().includes(searchQuery.toLowerCase()),
  );

  const pendingQuotations = quotations.filter((q) => q.status === "draft" || q.status === "sent");
  const approvedQuotations = quotations.filter((q) => q.status === "approved");
  const totalApprovedAmount = approvedQuotations.reduce(
    (sum, q) => sum + parseFloat(q.totalAmount || "0"),
    0,
  );

  const formatDate = (dateStr: string | null) => {
    if (!dateStr) return "-";
    try {
      return format(new Date(dateStr), "MMM dd, yyyy");
    } catch {
      return dateStr;
    }
  };

  return (
    <div className={`${layout.padding} ${layout.spaceY}`}>
      <div
        className={`flex ${layout.isMobile ? "flex-col gap-3" : "items-center justify-between"}`}
      >
        <div>
          <div className="flex items-center gap-2">
            <FileText className="h-8 w-8" />
            <h1 className={`${layout.text3Xl} font-bold`} data-testid="text-quotations-title">
              {t.quotationsPage}
            </h1>
          </div>
          <p className="text-muted-foreground text-sm mt-1">
            {t.quotationsDescription}
          </p>
        </div>
        <Dialog open={open} onOpenChange={handleOpenChange}>
          <DialogTrigger asChild>
            <Button
              data-testid="button-add-quotation"
              className={layout.isMobile ? "h-[44px]" : ""}
              onClick={handleAddNew}
            >
              <Plus className="h-4 w-4 mr-2" />
              {t.addQuotation}
            </Button>
          </DialogTrigger>
          <DialogContent className="max-h-[90vh] overflow-y-auto">
            <DialogHeader>
              <DialogTitle>
                {editingQuotation ? t.editQuotation : t.addQuotation}
              </DialogTitle>
              <DialogDescription>
                {editingQuotation
                  ? t.updateQuotationInfo
                  : t.addNewQuotation}
              </DialogDescription>
            </DialogHeader>
            <Form {...form}>
              <form
                onSubmit={form.handleSubmit(onSubmit)}
                className="space-y-4"
              >
                <div className="grid grid-cols-2 gap-4">
                  <FormField
                    control={form.control}
                    name="quotationNumber"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>{t.quotationNumber}</FormLabel>
                        <FormControl>
                          <Input
                            data-testid="input-quotation-number"
                            placeholder="QT-001"
                            {...field}
                          />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                  <FormField
                    control={form.control}
                    name="status"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>{t.status}</FormLabel>
                        <Select onValueChange={field.onChange} value={field.value}>
                          <FormControl>
                            <SelectTrigger data-testid="select-quotation-status">
                              <SelectValue placeholder={t.selectStatus} />
                            </SelectTrigger>
                          </FormControl>
                          <SelectContent>
                            <SelectItem value="draft">{t.draft}</SelectItem>
                            <SelectItem value="sent">{t.sent}</SelectItem>
                            <SelectItem value="approved">{t.approved}</SelectItem>
                            <SelectItem value="declined">{t.declined}</SelectItem>
                            <SelectItem value="expired">{t.expired}</SelectItem>
                          </SelectContent>
                        </Select>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                </div>

                <FormField
                  control={form.control}
                  name="clientName"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>{t.clientName}</FormLabel>
                      <FormControl>
                        <Input
                          data-testid="input-client-name"
                          placeholder={t.enterClientName}
                          {...field}
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <div className="grid grid-cols-2 gap-4">
                  <FormField
                    control={form.control}
                    name="clientPhone"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>{t.clientPhone}</FormLabel>
                        <FormControl>
                          <Input
                            data-testid="input-client-phone"
                            placeholder="+966 5XXXXXXXX"
                            {...field}
                          />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                  <FormField
                    control={form.control}
                    name="clientEmail"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>{t.clientEmail}</FormLabel>
                        <FormControl>
                          <Input
                            data-testid="input-client-email"
                            placeholder="client@example.com"
                            type="email"
                            {...field}
                          />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                </div>

                <FormField
                  control={form.control}
                  name="description"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>{t.description}</FormLabel>
                      <FormControl>
                        <Textarea
                          data-testid="input-quotation-description"
                          placeholder={t.quotationDescription}
                          className="resize-none"
                          {...field}
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <div className="grid grid-cols-2 gap-4">
                  <FormField
                    control={form.control}
                    name="subtotal"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>{t.subtotal}</FormLabel>
                        <FormControl>
                          <Input
                            data-testid="input-subtotal"
                            type="number"
                            placeholder="0"
                            {...field}
                          />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                  <FormField
                    control={form.control}
                    name="vatRate"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>{t.vatRate}</FormLabel>
                        <FormControl>
                          <Input
                            data-testid="input-vat-rate"
                            type="number"
                            placeholder="15"
                            {...field}
                          />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <FormField
                    control={form.control}
                    name="vatAmount"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>{t.vatAmount}</FormLabel>
                        <FormControl>
                          <Input
                            data-testid="input-vat-amount"
                            type="number"
                            placeholder="0"
                            {...field}
                          />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                  <FormField
                    control={form.control}
                    name="totalAmount"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>{t.totalAmount}</FormLabel>
                        <FormControl>
                          <Input
                            data-testid="input-total-amount"
                            type="number"
                            placeholder="0"
                            {...field}
                          />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                </div>

                <FormField
                  control={form.control}
                  name="validUntil"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>{t.validUntil}</FormLabel>
                      <FormControl>
                        <Input
                          data-testid="input-valid-until"
                          type="date"
                          {...field}
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={form.control}
                  name="notes"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>{t.notes}</FormLabel>
                      <FormControl>
                        <Textarea
                          data-testid="input-quotation-notes"
                          placeholder={t.additionalNotes}
                          className="resize-none"
                          {...field}
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <div className="flex justify-end gap-2">
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
                    data-testid="button-submit"
                    disabled={
                      createQuotationMutation.isPending ||
                      updateQuotationMutation.isPending
                    }
                  >
                    {editingQuotation ? t.save : t.add}
                  </Button>
                </div>
              </form>
            </Form>
          </DialogContent>
        </Dialog>
      </div>

      <div className="relative">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
        <Input
          data-testid="input-search-quotations"
          placeholder={`${t.search} ${t.quotationsPage.toLowerCase()}...`}
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          className="pl-10"
        />
      </div>

      <div
        className={`grid ${layout.gap} ${layout.gridCols({ desktop: 4, tablet: 2, mobile: 2 })}`}
      >
        <Card>
          <CardContent className="pt-4 pb-4">
            <div className="flex items-center gap-2 mb-1">
              <FileText className="h-4 w-4 text-muted-foreground" />
              <p className="text-sm text-muted-foreground">{t.totalQuotations}</p>
            </div>
            <p className="text-2xl font-bold" data-testid="text-total-quotations">
              {quotations.length}
            </p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-4 pb-4">
            <div className="flex items-center gap-2 mb-1">
              <Clock className="h-4 w-4 text-muted-foreground" />
              <p className="text-sm text-muted-foreground">{t.pendingQuotations}</p>
            </div>
            <p className="text-2xl font-bold" data-testid="text-pending-quotations">
              {pendingQuotations.length}
            </p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-4 pb-4">
            <div className="flex items-center gap-2 mb-1">
              <CheckCircle className="h-4 w-4 text-muted-foreground" />
              <p className="text-sm text-muted-foreground">{t.approvedQuotations}</p>
            </div>
            <p className="text-2xl font-bold" data-testid="text-approved-quotations">
              {approvedQuotations.length}
            </p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-4 pb-4">
            <div className="flex items-center gap-2 mb-1">
              <DollarSign className="h-4 w-4 text-muted-foreground" />
              <p className="text-sm text-muted-foreground">{t.approvedAmount}</p>
            </div>
            <p className="text-2xl font-bold" data-testid="text-approved-amount">
              {totalApprovedAmount.toLocaleString()} SAR
            </p>
          </CardContent>
        </Card>
      </div>

      {isLoading ? (
        <div className="flex items-center justify-center p-12">
          <p>{t.loading}</p>
        </div>
      ) : filteredQuotations.length === 0 ? (
        <div className="flex flex-col items-center justify-center p-12 text-center">
          <FileText className="h-16 w-16 text-muted-foreground/30 mb-4" />
          <p className="text-muted-foreground">
            {searchQuery
              ? t.noQuotationsFound
              : t.noQuotationsYet}
          </p>
        </div>
      ) : (
        <div
          className={`grid ${layout.gap} ${layout.gridCols({ desktop: 3, tablet: 2, mobile: 1 })}`}
        >
          {filteredQuotations.map((quotation) => (
            <Card
              key={quotation.id}
              data-testid={`card-quotation-${quotation.id}`}
            >
              <CardHeader className="flex flex-row items-center justify-between gap-2 space-y-0 pb-2">
                <div className="flex items-center gap-2 min-w-0">
                  <FileText className="h-4 w-4 text-muted-foreground shrink-0" />
                  <h3
                    className="font-semibold truncate"
                    data-testid={`text-quotation-number-${quotation.id}`}
                  >
                    {quotation.quotationNumber}
                  </h3>
                </div>
                <div className="flex gap-1 shrink-0">
                  <Button
                    variant="ghost"
                    size="icon"
                    onClick={() => window.open(`/api/quotations/${quotation.id}/download-pdf`, '_blank')}
                    data-testid={`button-download-pdf-${quotation.id}`}
                  >
                    <Download className="h-4 w-4" />
                  </Button>
                  <Button
                    variant="ghost"
                    size="icon"
                    onClick={() => handleEdit(quotation)}
                    data-testid={`button-edit-${quotation.id}`}
                  >
                    <Edit className="h-4 w-4" />
                  </Button>
                  <Button
                    variant="ghost"
                    size="icon"
                    onClick={() => setDeletingQuotation(quotation)}
                    data-testid={`button-delete-${quotation.id}`}
                  >
                    <Trash2 className="h-4 w-4" />
                  </Button>
                  {(quotation.status === "draft" || quotation.status === "sent") && (
                    <>
                      <Button
                        variant="ghost"
                        size="icon"
                        onClick={() => setApproveQuotation(quotation)}
                        data-testid={`button-approve-${quotation.id}`}
                        className="text-green-600"
                      >
                        <ThumbsUp className="h-4 w-4" />
                      </Button>
                      <Button
                        variant="ghost"
                        size="icon"
                        onClick={() => setDeclineQuotation(quotation)}
                        data-testid={`button-decline-${quotation.id}`}
                        className="text-red-600"
                      >
                        <ThumbsDown className="h-4 w-4" />
                      </Button>
                    </>
                  )}
                  {(quotation.status === "approved" || quotation.status === "declined") && (
                    <Button
                      variant="ghost"
                      size="icon"
                      onClick={() => setViewDecisionsQuotation(quotation)}
                      data-testid={`button-view-decisions-${quotation.id}`}
                    >
                      <MessageSquare className="h-4 w-4" />
                    </Button>
                  )}
                </div>
              </CardHeader>
              <CardContent className="space-y-3">
                <div className="flex items-center gap-2 flex-wrap">
                  <Badge
                    variant={getStatusBadgeVariant(quotation.status)}
                    className={getStatusBadgeClassName(quotation.status)}
                  >
                    {quotation.status.charAt(0).toUpperCase() + quotation.status.slice(1)}
                  </Badge>
                </div>

                {quotation.status === "declined" && (quotation as any).declineReason && (
                  <div className="text-xs text-destructive mt-1">
                    <span className="font-medium">{t.declineReason || "Reason"}: </span>
                    {(quotation as any).declineReason}
                  </div>
                )}

                <div className="space-y-1.5">
                  <div className="flex items-center gap-2 text-sm">
                    <User className="h-3 w-3 text-muted-foreground shrink-0" />
                    <span className="truncate" data-testid={`text-client-name-${quotation.id}`}>
                      {quotation.clientName}
                    </span>
                  </div>
                  {quotation.clientPhone && (
                    <div className="flex items-center gap-2 text-sm text-muted-foreground">
                      <Phone className="h-3 w-3 shrink-0" />
                      <span className="truncate">{quotation.clientPhone}</span>
                    </div>
                  )}
                  {quotation.clientEmail && (
                    <div className="flex items-center gap-2 text-sm text-muted-foreground">
                      <Mail className="h-3 w-3 shrink-0" />
                      <span className="truncate">{quotation.clientEmail}</span>
                    </div>
                  )}
                </div>

                <div className="flex items-center justify-between gap-2 pt-2 border-t">
                  <div className="flex items-center gap-1 text-sm">
                    <span className="text-muted-foreground">{t.subtotal}:</span>
                    <span data-testid={`text-subtotal-${quotation.id}`}>
                      {parseFloat(quotation.subtotal).toLocaleString()} SAR
                    </span>
                  </div>
                  <div className="flex items-center gap-1 text-sm text-muted-foreground">
                    <span>VAT {quotation.vatRate}%</span>
                  </div>
                </div>

                <div className="flex items-center justify-between gap-2">
                  <div className="flex items-center gap-1 text-sm font-semibold">
                    <DollarSign className="h-3 w-3" />
                    <span data-testid={`text-total-amount-${quotation.id}`}>
                      {parseFloat(quotation.totalAmount).toLocaleString()} SAR
                    </span>
                  </div>
                </div>

                {quotation.validUntil && (
                  <div className="flex items-center gap-1 text-xs text-muted-foreground">
                    <Calendar className="h-3 w-3" />
                    <span>{t.validUntil}: {formatDate(quotation.validUntil)}</span>
                  </div>
                )}
              </CardContent>
            </Card>
          ))}
        </div>
      )}

      <AlertDialog
        open={!!deletingQuotation}
        onOpenChange={(open) => !open && setDeletingQuotation(null)}
      >
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>{t.confirmDelete}</AlertDialogTitle>
            <AlertDialogDescription>
              {t.deleteQuotationConfirm}
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel data-testid="button-cancel-delete">
              {t.cancel}
            </AlertDialogCancel>
            <AlertDialogAction
              data-testid="button-confirm-delete"
              onClick={() =>
                deletingQuotation &&
                deleteQuotationMutation.mutate(deletingQuotation.id)
              }
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
            >
              {t.delete}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      <AlertDialog
        open={!!approveQuotation}
        onOpenChange={(open) => !open && setApproveQuotation(null)}
      >
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>{t.approveQuotation || "Approve Quotation"}</AlertDialogTitle>
            <AlertDialogDescription>
              {t.approveQuotationConfirm || "Are you sure you want to approve this quotation?"} ({approveQuotation?.quotationNumber})
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel data-testid="button-cancel-approve">{t.cancel}</AlertDialogCancel>
            <AlertDialogAction
              data-testid="button-confirm-approve"
              onClick={() => approveQuotation && approveQuotationMutation.mutate(approveQuotation)}
              className="bg-green-600 text-white hover:bg-green-700"
            >
              {t.approved || "Approve"}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      <Dialog
        open={!!declineQuotation}
        onOpenChange={(open) => { if (!open) { setDeclineQuotation(null); setDeclineReason(""); } }}
      >
        <DialogContent>
          <DialogHeader>
            <DialogTitle>{t.declineQuotation || "Decline Quotation"}</DialogTitle>
            <DialogDescription>
              {t.declineQuotationDesc || "Please provide a reason for declining this quotation."} ({declineQuotation?.quotationNumber})
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4">
            <div>
              <label className="text-sm font-medium">{t.declineReason || "Reason"}</label>
              <Textarea
                data-testid="input-decline-reason"
                placeholder={t.enterDeclineReason || "Enter reason for declining..."}
                value={declineReason}
                onChange={(e) => setDeclineReason(e.target.value)}
                className="mt-1"
              />
            </div>
            <div className="flex justify-end gap-2">
              <Button variant="outline" onClick={() => { setDeclineQuotation(null); setDeclineReason(""); }} data-testid="button-cancel-decline">
                {t.cancel}
              </Button>
              <Button
                variant="destructive"
                onClick={() => declineQuotation && declineQuotationMutation.mutate({ quotation: declineQuotation, reason: declineReason })}
                disabled={!declineReason.trim()}
                data-testid="button-confirm-decline"
              >
                {t.declined || "Decline"}
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>

      <Dialog
        open={!!viewDecisionsQuotation}
        onOpenChange={(open) => !open && setViewDecisionsQuotation(null)}
      >
        <DialogContent>
          <DialogHeader>
            <DialogTitle>{t.decisionHistory || "Decision History"}</DialogTitle>
            <DialogDescription>
              {viewDecisionsQuotation?.quotationNumber}
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-3">
            {decisions.length === 0 ? (
              <p className="text-sm text-muted-foreground">{t.noDecisions || "No decisions recorded."}</p>
            ) : (
              decisions.map((decision: any) => (
                <Card key={decision.id}>
                  <CardContent className="pt-3 pb-3">
                    <div className="flex items-center gap-2 mb-1">
                      <Badge variant={decision.decision === "approved" ? "default" : "destructive"} className={decision.decision === "approved" ? "bg-green-500/10 text-green-700 dark:text-green-400 border-green-500/20" : ""}>
                        {decision.decision === "approved" ? (t.approved || "Approved") : (t.declined || "Declined")}
                      </Badge>
                      <span className="text-xs text-muted-foreground">
                        {decision.decidedBy && `by ${decision.decidedBy}`}
                      </span>
                    </div>
                    {decision.reason && (
                      <p className="text-sm mt-1">{decision.reason}</p>
                    )}
                    <p className="text-xs text-muted-foreground mt-1">
                      {decision.decidedAt ? format(new Date(decision.decidedAt), "MMM dd, yyyy HH:mm") : ""}
                    </p>
                  </CardContent>
                </Card>
              ))
            )}
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}
