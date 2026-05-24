import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Tooltip, TooltipContent, TooltipTrigger, TooltipProvider } from "@/components/ui/tooltip";
import { InfoTip } from "@/components/ui/info-tip";
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
  Handshake,
  FileText,
  CheckCircle,
  DollarSign,
  Calendar,
  Phone,
  Mail,
  User,
  Building,
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

interface Contract {
  id: string;
  restaurantId: string;
  contractNumber: string;
  propertyId: string | null;
  propertyName: string;
  clientName: string;
  clientPhone: string | null;
  clientEmail: string | null;
  contractType: string;
  status: string;
  startDate: string | null;
  endDate: string | null;
  value: string;
  commission: string | null;
  commissionRate: string | null;
  notes: string | null;
  createdAt: string;
}

const contractFormSchema = z.object({
  contractNumber: z.string().min(1, "Contract number is required"),
  propertyName: z.string().min(1, "Property name is required"),
  clientName: z.string().min(1, "Client name is required"),
  clientPhone: z.string().optional().default(""),
  clientEmail: z.string().optional().default(""),
  contractType: z.string().min(1, "Contract type is required"),
  status: z.string().min(1, "Status is required"),
  startDate: z.string().optional().default(""),
  endDate: z.string().optional().default(""),
  value: z.string().min(1, "Value is required"),
  commissionRate: z.string().optional().default(""),
  notes: z.string().optional().default(""),
});

type ContractFormValues = z.infer<typeof contractFormSchema>;

function getStatusBadgeVariant(status: string): "default" | "secondary" | "outline" | "destructive" {
  switch (status) {
    case "active":
      return "default";
    case "draft":
      return "secondary";
    case "completed":
      return "outline";
    case "cancelled":
    case "expired":
      return "destructive";
    default:
      return "secondary";
  }
}

function getTypeBadgeVariant(type: string): "default" | "secondary" | "outline" {
  switch (type) {
    case "sale":
      return "default";
    case "lease":
      return "secondary";
    case "rental":
      return "outline";
    default:
      return "secondary";
  }
}

export default function Contracts() {
  const [searchQuery, setSearchQuery] = useState("");
  const [open, setOpen] = useState(false);
  const [editingContract, setEditingContract] = useState<Contract | null>(null);
  const [deletingContract, setDeletingContract] = useState<Contract | null>(null);
  const { toast } = useToast();
  const { t, isRTL } = useLanguage();
  const layout = useDeviceLayout();

  const form = useForm<ContractFormValues>({
    resolver: zodResolver(contractFormSchema),
    defaultValues: {
      contractNumber: "",
      propertyName: "",
      clientName: "",
      clientPhone: "",
      clientEmail: "",
      contractType: "sale",
      status: "draft",
      startDate: "",
      endDate: "",
      value: "",
      commissionRate: "",
      notes: "",
    },
  });

  const { data: contracts = [], isLoading } = useQuery<Contract[]>({
    queryKey: ["/api/contracts"],
  });

  const createContractMutation = useMutation({
    mutationFn: async (data: ContractFormValues) => {
      const payload = {
        ...data,
        clientPhone: data.clientPhone || null,
        clientEmail: data.clientEmail || null,
        startDate: data.startDate || null,
        endDate: data.endDate || null,
        commissionRate: data.commissionRate || null,
        notes: data.notes || null,
      };
      return await apiRequest("POST", "/api/contracts", payload);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/contracts"] });
      setOpen(false);
      form.reset();
      toast({
        title: (t as any).contractCreated || "Contract Created",
        description: (t as any).contractCreatedDesc || "Contract has been created successfully",
      });
    },
    onError: (error: any) => {
      toast({
        title: (t as any).failedToCreateContract || "Failed to Create Contract",
        description: error.message || ((t as any).couldNotCreateContract || "Could not create contract"),
        variant: "destructive",
      });
    },
  });

  const updateContractMutation = useMutation({
    mutationFn: async (data: ContractFormValues & { id: string }) => {
      const payload = {
        contractNumber: data.contractNumber,
        propertyName: data.propertyName,
        clientName: data.clientName,
        clientPhone: data.clientPhone || null,
        clientEmail: data.clientEmail || null,
        contractType: data.contractType,
        status: data.status,
        startDate: data.startDate || null,
        endDate: data.endDate || null,
        value: data.value,
        commissionRate: data.commissionRate || null,
        notes: data.notes || null,
      };
      return await apiRequest("PATCH", `/api/contracts/${data.id}`, payload);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/contracts"] });
      setOpen(false);
      setEditingContract(null);
      form.reset();
      toast({
        title: (t as any).contractUpdated || "Contract Updated",
        description: (t as any).contractUpdatedDesc || "Contract has been updated successfully",
      });
    },
    onError: (error: any) => {
      toast({
        title: (t as any).failedToUpdateContract || "Failed to Update Contract",
        description: error.message || ((t as any).couldNotUpdateContract || "Could not update contract"),
        variant: "destructive",
      });
    },
  });

  const deleteContractMutation = useMutation({
    mutationFn: async (id: string) => {
      await apiRequest("DELETE", `/api/contracts/${id}`);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/contracts"] });
      setDeletingContract(null);
      toast({
        title: (t as any).contractDeleted || "Contract Deleted",
        description: (t as any).contractDeletedDesc || "Contract has been deleted successfully",
      });
    },
    onError: (error: any) => {
      toast({
        title: (t as any).failedToDeleteContract || "Failed to Delete Contract",
        description: error.message || ((t as any).couldNotDeleteContract || "Could not delete contract"),
        variant: "destructive",
      });
    },
  });

  const onSubmit = (data: ContractFormValues) => {
    const payload = {
      ...data,
      clientPhone: data.clientPhone || null,
      clientEmail: data.clientEmail || null,
      startDate: data.startDate || null,
      endDate: data.endDate || null,
      commissionRate: data.commissionRate || null,
      notes: data.notes || null,
    };
    if (editingContract) {
      updateContractMutation.mutate({ ...payload, id: editingContract.id });
    } else {
      createContractMutation.mutate(payload);
    }
  };

  const handleEdit = (contract: Contract) => {
    setEditingContract(contract);
    form.reset({
      contractNumber: contract.contractNumber,
      propertyName: contract.propertyName,
      clientName: contract.clientName,
      clientPhone: contract.clientPhone || "",
      clientEmail: contract.clientEmail || "",
      contractType: contract.contractType,
      status: contract.status,
      startDate: contract.startDate || "",
      endDate: contract.endDate || "",
      value: contract.value,
      commissionRate: contract.commissionRate || "",
      notes: contract.notes || "",
    });
    setOpen(true);
  };

  const handleOpenChange = (isOpen: boolean) => {
    setOpen(isOpen);
    if (!isOpen) {
      setEditingContract(null);
      form.reset();
    }
  };

  const handleCloseDialog = () => {
    setOpen(false);
    setEditingContract(null);
    form.reset();
  };

  const handleAddNew = () => {
    const nextNumber = contracts.length + 1;
    const suggestion = `CTR-${String(nextNumber).padStart(3, "0")}`;
    form.reset({
      contractNumber: suggestion,
      propertyName: "",
      clientName: "",
      clientPhone: "",
      clientEmail: "",
      contractType: "sale",
      status: "draft",
      startDate: "",
      endDate: "",
      value: "",
      commissionRate: "",
      notes: "",
    });
    setEditingContract(null);
    setOpen(true);
  };

  const filteredContracts = contracts.filter(
    (contract) =>
      contract.contractNumber.toLowerCase().includes(searchQuery.toLowerCase()) ||
      contract.propertyName.toLowerCase().includes(searchQuery.toLowerCase()) ||
      contract.clientName.toLowerCase().includes(searchQuery.toLowerCase()),
  );

  const activeContracts = contracts.filter((c) => c.status === "active");
  const completedContracts = contracts.filter((c) => c.status === "completed");
  const totalValue = contracts.reduce((sum, c) => sum + parseFloat(c.value || "0"), 0);

  const getTypeLabel = (type: string) => {
    switch (type) {
      case "sale":
        return (t as any).sale || "Sale";
      case "lease":
        return (t as any).lease || "Lease";
      case "rental":
        return (t as any).rental || "Rental";
      default:
        return type;
    }
  };

  const formatDate = (dateStr: string | null) => {
    if (!dateStr) return "-";
    try {
      return format(new Date(dateStr), "MMM dd, yyyy");
    } catch {
      return dateStr;
    }
  };

  return (
    <TooltipProvider delayDuration={150}>
    <div className={`${layout.padding} ${layout.spaceY}`}>
      <div
        className={`flex ${layout.isMobile ? "flex-col gap-3" : "items-center justify-between"}`}
      >
        <div>
          <div className="flex items-center gap-2">
            <Handshake className="h-8 w-8" />
            <h1 className={`${layout.text3Xl} font-bold`} data-testid="text-contracts-title">
              {(t as any).contracts || "Contracts"}
            </h1>
          </div>
          <p className="text-muted-foreground text-sm mt-1">
            {(t as any).contractsDescription || "Manage your real estate contracts and deals"}
          </p>
        </div>
        <Dialog open={open} onOpenChange={handleOpenChange}>
          <DialogTrigger asChild>
            <Button
              data-testid="button-add-contract"
              className={layout.isMobile ? "h-[44px]" : ""}
              onClick={handleAddNew}
            >
              <Plus className="h-4 w-4 mr-2" />
              {(t as any).addContract || "Add Contract"}
            </Button>
          </DialogTrigger>
          <DialogContent className="max-h-[90vh] overflow-y-auto">
            <DialogHeader>
              <DialogTitle>
                {editingContract ? ((t as any).editContract || "Edit Contract") : ((t as any).addContract || "Add Contract")}
              </DialogTitle>
              <DialogDescription>
                {editingContract
                  ? ((t as any).updateContractInfo || "Update contract information")
                  : ((t as any).addNewPropertyContract || "Add a new property contract")}
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
                    name="contractNumber"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>{(t as any).contractNumber || "Contract Number"}<InfoTip>{isRTL ? "معرّف فريد للعقد (مثل CTR-001)." : "Unique identifier for the contract (e.g. CTR-001)."}</InfoTip></FormLabel>
                        <FormControl>
                          <Input
                            data-testid="input-contract-number"
                            placeholder="CTR-001"
                            {...field}
                          />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                  <FormField
                    control={form.control}
                    name="propertyName"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>{(t as any).propertyName || "Property Name"}<InfoTip>{isRTL ? "اسم العقار المرتبط بهذا العقد." : "Name of the property linked to this contract."}</InfoTip></FormLabel>
                        <FormControl>
                          <Input
                            data-testid="input-property-name"
                            placeholder={(t as any).propertyNamePlaceholder || "Enter property name"}
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
                  name="clientName"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>{t.clientName}</FormLabel>
                      <FormControl>
                        <Input
                          data-testid="input-client-name"
                          placeholder={(t as any).enterClientName || "Enter client name"}
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

                <div className="grid grid-cols-2 gap-4">
                  <FormField
                    control={form.control}
                    name="contractType"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>{t.contractType}<InfoTip>{isRTL ? "نوع العقد: بيع، إيجار طويل، أو تأجير." : "Type of contract: sale, lease, or rental."}</InfoTip></FormLabel>
                        <Select onValueChange={field.onChange} value={field.value}>
                          <FormControl>
                            <SelectTrigger data-testid="select-contract-type">
                              <SelectValue placeholder={(t as any).selectType || "Select type"} />
                            </SelectTrigger>
                          </FormControl>
                          <SelectContent>
                            <SelectItem value="sale">{(t as any).sale || "Sale"}</SelectItem>
                            <SelectItem value="lease">{(t as any).lease || "Lease"}</SelectItem>
                            <SelectItem value="rental">{(t as any).rental || "Rental"}</SelectItem>
                          </SelectContent>
                        </Select>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                  <FormField
                    control={form.control}
                    name="status"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>{t.status}<InfoTip>{isRTL ? "الحالة الحالية للعقد." : "Current status of the contract."}</InfoTip></FormLabel>
                        <Select onValueChange={field.onChange} value={field.value}>
                          <FormControl>
                            <SelectTrigger data-testid="select-contract-status">
                              <SelectValue placeholder={(t as any).selectStatus || "Select status"} />
                            </SelectTrigger>
                          </FormControl>
                          <SelectContent>
                            <SelectItem value="draft">{t.draft}</SelectItem>
                            <SelectItem value="active">{t.active}</SelectItem>
                            <SelectItem value="completed">{t.completed}</SelectItem>
                            <SelectItem value="cancelled">{t.cancelled}</SelectItem>
                            <SelectItem value="expired">{t.expired}</SelectItem>
                          </SelectContent>
                        </Select>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <FormField
                    control={form.control}
                    name="startDate"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>{t.startDate}<InfoTip>{isRTL ? "تاريخ بدء سريان العقد." : "Date the contract becomes effective."}</InfoTip></FormLabel>
                        <FormControl>
                          <Input
                            data-testid="input-start-date"
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
                    name="endDate"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>{t.endDate}<InfoTip>{isRTL ? "تاريخ انتهاء العقد." : "Date the contract expires."}</InfoTip></FormLabel>
                        <FormControl>
                          <Input
                            data-testid="input-end-date"
                            type="date"
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
                    name="value"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>{(t as any).valueSAR || "Value (SAR)"}<InfoTip>{isRTL ? "إجمالي قيمة العقد بالريال السعودي." : "Total contract value in SAR."}</InfoTip></FormLabel>
                        <FormControl>
                          <Input
                            data-testid="input-contract-value"
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
                    name="commissionRate"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>{(t as any).commissionRatePercent || "Commission Rate (%)"}<InfoTip>{isRTL ? "نسبة العمولة المئوية من قيمة العقد." : "Commission percentage of the contract value."}</InfoTip></FormLabel>
                        <FormControl>
                          <Input
                            data-testid="input-commission-rate"
                            type="number"
                            placeholder="0"
                            step="0.1"
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
                  name="notes"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>{t.notes}<InfoTip>{isRTL ? "ملاحظات إضافية حول العقد." : "Additional notes about the contract."}</InfoTip></FormLabel>
                      <FormControl>
                        <Textarea
                          data-testid="input-contract-notes"
                          placeholder={(t as any).additionalNotes || "Additional notes..."}
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
                      createContractMutation.isPending ||
                      updateContractMutation.isPending
                    }
                  >
                    {editingContract ? t.save : t.add}
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
          data-testid="input-contract-search"
          placeholder={`${t.search} contracts...`}
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
              <p className="text-sm text-muted-foreground">{(t as any).totalContracts || "Total Contracts"}</p>
              <InfoTip>{isRTL ? "إجمالي عدد العقود المسجلة." : "Total number of recorded contracts."}</InfoTip>
            </div>
            <p className="text-2xl font-bold" data-testid="text-total-contracts">
              {contracts.length}
            </p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-4 pb-4">
            <div className="flex items-center gap-2 mb-1">
              <CheckCircle className="h-4 w-4 text-muted-foreground" />
              <p className="text-sm text-muted-foreground">{t.active}</p>
              <InfoTip>{isRTL ? "العقود النشطة حاليًا." : "Contracts currently active."}</InfoTip>
            </div>
            <p className="text-2xl font-bold" data-testid="text-active-contracts">
              {activeContracts.length}
            </p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-4 pb-4">
            <div className="flex items-center gap-2 mb-1">
              <Handshake className="h-4 w-4 text-muted-foreground" />
              <p className="text-sm text-muted-foreground">{t.completed}</p>
              <InfoTip>{isRTL ? "العقود المكتملة." : "Contracts that have been completed."}</InfoTip>
            </div>
            <p className="text-2xl font-bold" data-testid="text-completed-contracts">
              {completedContracts.length}
            </p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-4 pb-4">
            <div className="flex items-center gap-2 mb-1">
              <DollarSign className="h-4 w-4 text-muted-foreground" />
              <p className="text-sm text-muted-foreground">{(t as any).totalValue || "Total Value"}</p>
              <InfoTip>{isRTL ? "إجمالي قيمة جميع العقود." : "Combined value of all contracts."}</InfoTip>
            </div>
            <p className="text-2xl font-bold" data-testid="text-total-value">
              {totalValue.toLocaleString()} SAR
            </p>
          </CardContent>
        </Card>
      </div>

      {isLoading ? (
        <div className="flex items-center justify-center p-12">
          <p>{t.loading}</p>
        </div>
      ) : filteredContracts.length === 0 ? (
        <div className="flex flex-col items-center justify-center p-12 text-center">
          <Handshake className="h-16 w-16 text-muted-foreground/30 mb-4" />
          <p className="text-muted-foreground">
            {searchQuery
              ? ((t as any).noContractsFoundSearch || "No contracts found matching your search")
              : ((t as any).noContractsYet || "No contracts yet. Add your first contract to get started.")}
          </p>
        </div>
      ) : (
        <div
          className={`grid ${layout.gap} ${layout.gridCols({ desktop: 3, tablet: 2, mobile: 1 })}`}
        >
          {filteredContracts.map((contract) => (
            <Card
              key={contract.id}
              data-testid={`card-contract-${contract.id}`}
            >
              <CardHeader className="flex flex-row items-center justify-between gap-2 space-y-0 pb-2">
                <div className="flex items-center gap-2 min-w-0">
                  <FileText className="h-4 w-4 text-muted-foreground shrink-0" />
                  <h3
                    className="font-semibold truncate"
                    data-testid={`text-contract-number-${contract.id}`}
                  >
                    {contract.contractNumber}
                  </h3>
                </div>
                <div className="flex gap-1 shrink-0">
                  <Tooltip>
                    <TooltipTrigger asChild>
                      <Button
                        variant="ghost"
                        size="icon"
                        aria-label={t.edit}
                        onClick={() => handleEdit(contract)}
                        data-testid={`button-edit-${contract.id}`}
                      >
                        <Edit className="h-4 w-4" />
                      </Button>
                    </TooltipTrigger>
                    <TooltipContent>{t.edit}</TooltipContent>
                  </Tooltip>
                  <Tooltip>
                    <TooltipTrigger asChild>
                      <Button
                        variant="ghost"
                        size="icon"
                        aria-label={t.delete}
                        onClick={() => setDeletingContract(contract)}
                        data-testid={`button-delete-${contract.id}`}
                      >
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    </TooltipTrigger>
                    <TooltipContent>{isRTL ? "تحذير: حذف هذا العقد نهائيًا." : "Warning: permanently delete this contract."}</TooltipContent>
                  </Tooltip>
                </div>
              </CardHeader>
              <CardContent className="space-y-3">
                <div className="flex items-center gap-2 flex-wrap">
                  <Badge variant={getTypeBadgeVariant(contract.contractType)}>
                    {getTypeLabel(contract.contractType)}
                  </Badge>
                  <Badge variant={getStatusBadgeVariant(contract.status)}>
                    {contract.status === "active" ? t.active : contract.status === "draft" ? t.draft : contract.status === "completed" ? t.completed : contract.status === "cancelled" ? t.cancelled : contract.status === "expired" ? t.expired : contract.status}
                  </Badge>
                </div>

                <div className="space-y-1.5">
                  <div className="flex items-center gap-2 text-sm">
                    <Building className="h-3 w-3 text-muted-foreground shrink-0" />
                    <span className="truncate" data-testid={`text-property-name-${contract.id}`}>
                      {contract.propertyName}
                    </span>
                  </div>
                  <div className="flex items-center gap-2 text-sm">
                    <User className="h-3 w-3 text-muted-foreground shrink-0" />
                    <span className="truncate" data-testid={`text-client-name-${contract.id}`}>
                      {contract.clientName}
                    </span>
                  </div>
                  {contract.clientPhone && (
                    <div className="flex items-center gap-2 text-sm text-muted-foreground">
                      <Phone className="h-3 w-3 shrink-0" />
                      <span className="truncate">{contract.clientPhone}</span>
                    </div>
                  )}
                  {contract.clientEmail && (
                    <div className="flex items-center gap-2 text-sm text-muted-foreground">
                      <Mail className="h-3 w-3 shrink-0" />
                      <span className="truncate">{contract.clientEmail}</span>
                    </div>
                  )}
                </div>

                <div className="flex items-center justify-between gap-2 pt-2 border-t">
                  <div className="flex items-center gap-1 text-sm font-semibold">
                    <DollarSign className="h-3 w-3" />
                    <span data-testid={`text-contract-value-${contract.id}`}>
                      {parseFloat(contract.value).toLocaleString()} SAR
                    </span>
                  </div>
                  {contract.commissionRate && (
                    <span className="text-xs text-muted-foreground">
                      {contract.commissionRate}% {t.commission}
                    </span>
                  )}
                </div>

                <div className="flex items-center gap-4 text-xs text-muted-foreground">
                  <div className="flex items-center gap-1">
                    <Calendar className="h-3 w-3" />
                    <span>{formatDate(contract.startDate)}</span>
                  </div>
                  <span>-</span>
                  <span>{formatDate(contract.endDate)}</span>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}

      <AlertDialog
        open={!!deletingContract}
        onOpenChange={(open) => !open && setDeletingContract(null)}
      >
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>{t.confirmDelete}</AlertDialogTitle>
            <AlertDialogDescription>
              {(t as any).deleteContractConfirm || `This will permanently delete contract "${deletingContract?.contractNumber}".`} {t.actionCannotBeUndone}
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel data-testid="button-cancel-delete">
              {t.cancel}
            </AlertDialogCancel>
            <AlertDialogAction
              data-testid="button-confirm-delete"
              onClick={() =>
                deletingContract &&
                deleteContractMutation.mutate(deletingContract.id)
              }
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
            >
              {t.delete}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
    </TooltipProvider>
  );
}
