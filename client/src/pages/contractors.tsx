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
  HardHat,
  Users,
  Star,
  CheckCircle,
  Phone,
  Mail,
  User,
  Building,
  Award,
  Wrench,
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

interface Contractor {
  id: string;
  restaurantId: string;
  name: string;
  company: string | null;
  phone: string | null;
  email: string | null;
  specialization: string | null;
  licenseNumber: string | null;
  rating: string | null;
  status: string;
  notes: string | null;
  createdAt: string;
}

const contractorFormSchema = z.object({
  name: z.string().min(1, "Name is required"),
  company: z.string().optional().default(""),
  phone: z.string().optional().default(""),
  email: z.string().optional().default(""),
  specialization: z.string().optional().default(""),
  licenseNumber: z.string().optional().default(""),
  rating: z.string().optional().default(""),
  status: z.string().min(1, "Status is required"),
  notes: z.string().optional().default(""),
});

type ContractorFormValues = z.infer<typeof contractorFormSchema>;

function getStatusBadgeVariant(status: string): "default" | "secondary" {
  switch (status) {
    case "active":
      return "default";
    case "inactive":
      return "secondary";
    default:
      return "secondary";
  }
}

function renderRating(rating: string | null) {
  if (!rating) return null;
  const num = parseFloat(rating);
  if (isNaN(num)) return null;
  const stars = [];
  const fullStars = Math.floor(num);
  for (let i = 0; i < 5; i++) {
    stars.push(
      <Star
        key={i}
        className={`h-3 w-3 ${i < fullStars ? "text-yellow-500 fill-yellow-500" : "text-muted-foreground"}`}
      />
    );
  }
  return (
    <div className="flex items-center gap-0.5">
      {stars}
      <span className="text-xs text-muted-foreground ml-1">{num.toFixed(1)}</span>
    </div>
  );
}

export default function ContractorsPage() {
  const [searchQuery, setSearchQuery] = useState("");
  const [open, setOpen] = useState(false);
  const [editingContractor, setEditingContractor] = useState<Contractor | null>(null);
  const [deletingContractor, setDeletingContractor] = useState<Contractor | null>(null);
  const { toast } = useToast();
  const { t, isRTL } = useLanguage();
  const layout = useDeviceLayout();

  const form = useForm<ContractorFormValues>({
    resolver: zodResolver(contractorFormSchema),
    defaultValues: {
      name: "",
      company: "",
      phone: "",
      email: "",
      specialization: "",
      licenseNumber: "",
      rating: "",
      status: "active",
      notes: "",
    },
  });

  const { data: contractors = [], isLoading } = useQuery<Contractor[]>({
    queryKey: ["/api/contractors"],
  });

  const createContractorMutation = useMutation({
    mutationFn: async (data: ContractorFormValues) => {
      const payload = {
        ...data,
        company: data.company || null,
        phone: data.phone || null,
        email: data.email || null,
        specialization: data.specialization || null,
        licenseNumber: data.licenseNumber || null,
        rating: data.rating || null,
        notes: data.notes || null,
      };
      return await apiRequest("POST", "/api/contractors", payload);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/contractors"] });
      setOpen(false);
      form.reset();
      toast({
        title: t.contractorCreated,
        description: t.contractorCreatedDesc,
      });
    },
    onError: (error: any) => {
      toast({
        title: t.failedToCreateContractor,
        description: error.message || t.failedToCreateContractor,
        variant: "destructive",
      });
    },
  });

  const updateContractorMutation = useMutation({
    mutationFn: async (data: ContractorFormValues & { id: string }) => {
      const payload = {
        name: data.name,
        company: data.company || null,
        phone: data.phone || null,
        email: data.email || null,
        specialization: data.specialization || null,
        licenseNumber: data.licenseNumber || null,
        rating: data.rating || null,
        status: data.status,
        notes: data.notes || null,
      };
      return await apiRequest("PATCH", `/api/contractors/${data.id}`, payload);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/contractors"] });
      setOpen(false);
      setEditingContractor(null);
      form.reset();
      toast({
        title: t.contractorUpdated,
        description: t.contractorUpdatedDesc,
      });
    },
    onError: (error: any) => {
      toast({
        title: t.failedToUpdateContractor,
        description: error.message || t.failedToUpdateContractor,
        variant: "destructive",
      });
    },
  });

  const deleteContractorMutation = useMutation({
    mutationFn: async (id: string) => {
      await apiRequest("DELETE", `/api/contractors/${id}`);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/contractors"] });
      setDeletingContractor(null);
      toast({
        title: t.contractorDeleted,
        description: t.contractorDeletedDesc,
      });
    },
    onError: (error: any) => {
      toast({
        title: t.failedToDeleteContractor,
        description: error.message || t.failedToDeleteContractor,
        variant: "destructive",
      });
    },
  });

  const onSubmit = (data: ContractorFormValues) => {
    const payload = {
      ...data,
      company: data.company || null,
      phone: data.phone || null,
      email: data.email || null,
      specialization: data.specialization || null,
      licenseNumber: data.licenseNumber || null,
      rating: data.rating || null,
      notes: data.notes || null,
    };
    if (editingContractor) {
      updateContractorMutation.mutate({ ...payload, id: editingContractor.id });
    } else {
      createContractorMutation.mutate(payload);
    }
  };

  const handleEdit = (contractor: Contractor) => {
    setEditingContractor(contractor);
    form.reset({
      name: contractor.name,
      company: contractor.company || "",
      phone: contractor.phone || "",
      email: contractor.email || "",
      specialization: contractor.specialization || "",
      licenseNumber: contractor.licenseNumber || "",
      rating: contractor.rating || "",
      status: contractor.status,
      notes: contractor.notes || "",
    });
    setOpen(true);
  };

  const handleOpenChange = (isOpen: boolean) => {
    setOpen(isOpen);
    if (!isOpen) {
      setEditingContractor(null);
      form.reset();
    }
  };

  const handleCloseDialog = () => {
    setOpen(false);
    setEditingContractor(null);
    form.reset();
  };

  const handleAddNew = () => {
    form.reset({
      name: "",
      company: "",
      phone: "",
      email: "",
      specialization: "",
      licenseNumber: "",
      rating: "",
      status: "active",
      notes: "",
    });
    setEditingContractor(null);
    setOpen(true);
  };

  const filteredContractors = contractors.filter(
    (contractor) =>
      contractor.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      (contractor.company || "").toLowerCase().includes(searchQuery.toLowerCase()) ||
      (contractor.specialization || "").toLowerCase().includes(searchQuery.toLowerCase()),
  );

  const activeContractors = contractors.filter((c) => c.status === "active");
  const ratingsArray = contractors
    .filter((c) => c.rating && !isNaN(parseFloat(c.rating)))
    .map((c) => parseFloat(c.rating!));
  const averageRating = ratingsArray.length > 0
    ? (ratingsArray.reduce((sum, r) => sum + r, 0) / ratingsArray.length).toFixed(1)
    : "0.0";
  const specializations = new Set(contractors.filter((c) => c.specialization).map((c) => c.specialization));

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
            <HardHat className="h-8 w-8" />
            <h1 className={`${layout.text3Xl} font-bold`} data-testid="text-contractors-title">
              {t.contractorsPage}
            </h1>
          </div>
          <p className="text-muted-foreground text-sm mt-1">
            {t.contractorsDescription}
          </p>
        </div>
        <Dialog open={open} onOpenChange={handleOpenChange}>
          <DialogTrigger asChild>
            <Button
              data-testid="button-add-contractor"
              className={layout.isMobile ? "h-[44px]" : ""}
              onClick={handleAddNew}
            >
              <Plus className="h-4 w-4 mr-2" />
              {t.addContractor}
            </Button>
          </DialogTrigger>
          <DialogContent className="max-h-[90vh] overflow-y-auto">
            <DialogHeader>
              <DialogTitle>
                {editingContractor ? t.editContractor : t.addContractor}
              </DialogTitle>
              <DialogDescription>
                {editingContractor
                  ? t.updateContractorInfo
                  : t.addNewContractor}
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
                      <FormLabel>{t.contractorName}</FormLabel>
                      <FormControl>
                        <Input
                          data-testid="input-contractor-name"
                          placeholder={t.enterContractorName}
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
                    name="company"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>{t.company}<InfoTip>{isRTL ? "اسم الشركة التي يعمل بها المقاول." : "Company the contractor works for."}</InfoTip></FormLabel>
                        <FormControl>
                          <Input
                            data-testid="input-contractor-company"
                            placeholder={t.enterCompanyNamePlaceholder}
                            {...field}
                          />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                  <FormField
                    control={form.control}
                    name="specialization"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>{t.specialization}<InfoTip>{isRTL ? "مجال خبرة المقاول الرئيسي." : "Contractor's main area of expertise."}</InfoTip></FormLabel>
                        <FormControl>
                          <Input
                            data-testid="input-contractor-specialization"
                            placeholder="e.g., Plumbing, Electrical"
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
                    name="phone"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>{t.phone}</FormLabel>
                        <FormControl>
                          <Input
                            data-testid="input-contractor-phone"
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
                    name="email"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>{t.email}</FormLabel>
                        <FormControl>
                          <Input
                            data-testid="input-contractor-email"
                            placeholder="contractor@example.com"
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
                    name="licenseNumber"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>{t.licenseNumber}<InfoTip>{isRTL ? "رقم الرخصة المهنية للمقاول." : "Contractor's professional license number."}</InfoTip></FormLabel>
                        <FormControl>
                          <Input
                            data-testid="input-contractor-license"
                            placeholder={t.licenseLabel}
                            {...field}
                          />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                  <FormField
                    control={form.control}
                    name="rating"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>{t.rating} (1-5)<InfoTip>{isRTL ? "تقييم أداء المقاول من 1 إلى 5." : "Rate contractor performance from 1 to 5."}</InfoTip></FormLabel>
                        <FormControl>
                          <Input
                            data-testid="input-contractor-rating"
                            type="number"
                            placeholder="0.0"
                            step="0.1"
                            min="0"
                            max="5"
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
                  name="status"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>{t.status}<InfoTip>{isRTL ? "حدد ما إذا كان المقاول نشطًا أم غير نشط." : "Set whether the contractor is active or inactive."}</InfoTip></FormLabel>
                      <Select onValueChange={field.onChange} value={field.value}>
                        <FormControl>
                          <SelectTrigger data-testid="select-contractor-status">
                            <SelectValue placeholder={t.selectStatus} />
                          </SelectTrigger>
                        </FormControl>
                        <SelectContent>
                          <SelectItem value="active">{t.active}</SelectItem>
                          <SelectItem value="inactive">{t.inactive}</SelectItem>
                        </SelectContent>
                      </Select>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={form.control}
                  name="notes"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>{t.notes}<InfoTip>{isRTL ? "ملاحظات داخلية اختيارية حول المقاول." : "Optional internal notes about the contractor."}</InfoTip></FormLabel>
                      <FormControl>
                        <Textarea
                          data-testid="input-contractor-notes"
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
                      createContractorMutation.isPending ||
                      updateContractorMutation.isPending
                    }
                  >
                    {editingContractor ? t.save : t.add}
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
          data-testid="input-search-contractors"
          placeholder={`${t.search} ${t.contractorsPage.toLowerCase()}...`}
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
              <Users className="h-4 w-4 text-muted-foreground" />
              <p className="text-sm text-muted-foreground">{t.totalContractors}</p>
              <InfoTip>{isRTL ? "إجمالي عدد المقاولين المسجلين." : "Total number of registered contractors."}</InfoTip>
            </div>
            <p className="text-2xl font-bold" data-testid="text-total-contractors">
              {contractors.length}
            </p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-4 pb-4">
            <div className="flex items-center gap-2 mb-1">
              <CheckCircle className="h-4 w-4 text-muted-foreground" />
              <p className="text-sm text-muted-foreground">{t.activeContractors}</p>
              <InfoTip>{isRTL ? "المقاولون النشطون والمتاحون حاليًا." : "Contractors currently active and available."}</InfoTip>
            </div>
            <p className="text-2xl font-bold" data-testid="text-active-contractors">
              {activeContractors.length}
            </p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-4 pb-4">
            <div className="flex items-center gap-2 mb-1">
              <Star className="h-4 w-4 text-muted-foreground" />
              <p className="text-sm text-muted-foreground">{t.avgRating}</p>
              <InfoTip>{isRTL ? "متوسط التقييم لجميع المقاولين." : "Average rating across all contractors."}</InfoTip>
            </div>
            <p className="text-2xl font-bold" data-testid="text-average-rating">
              {averageRating}
            </p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-4 pb-4">
            <div className="flex items-center gap-2 mb-1">
              <Wrench className="h-4 w-4 text-muted-foreground" />
              <p className="text-sm text-muted-foreground">{t.specializations}</p>
              <InfoTip>{isRTL ? "عدد التخصصات الفريدة." : "Number of unique specializations covered."}</InfoTip>
            </div>
            <p className="text-2xl font-bold" data-testid="text-specializations-count">
              {specializations.size}
            </p>
          </CardContent>
        </Card>
      </div>

      {isLoading ? (
        <div className="flex items-center justify-center p-12">
          <p>{t.loading}...</p>
        </div>
      ) : filteredContractors.length === 0 ? (
        <div className="flex flex-col items-center justify-center p-12 text-center">
          <HardHat className="h-16 w-16 text-muted-foreground/30 mb-4" />
          <p className="text-muted-foreground">
            {searchQuery
              ? t.noContractorsFound
              : t.noContractorsYet}
          </p>
        </div>
      ) : (
        <div
          className={`grid ${layout.gap} ${layout.gridCols({ desktop: 3, tablet: 2, mobile: 1 })}`}
        >
          {filteredContractors.map((contractor) => (
            <Card
              key={contractor.id}
              data-testid={`card-contractor-${contractor.id}`}
            >
              <CardHeader className="flex flex-row items-center justify-between gap-2 space-y-0 pb-2">
                <div className="flex items-center gap-2 min-w-0">
                  <User className="h-4 w-4 text-muted-foreground shrink-0" />
                  <h3
                    className="font-semibold truncate"
                    data-testid={`text-contractor-name-${contractor.id}`}
                  >
                    {contractor.name}
                  </h3>
                </div>
                <div className="flex gap-1 shrink-0">
                  <Tooltip>
                    <TooltipTrigger asChild>
                      <Button
                        variant="ghost"
                        size="icon"
                        aria-label={t.edit}
                        onClick={() => handleEdit(contractor)}
                        data-testid={`button-edit-${contractor.id}`}
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
                        onClick={() => setDeletingContractor(contractor)}
                        data-testid={`button-delete-${contractor.id}`}
                      >
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    </TooltipTrigger>
                    <TooltipContent>{isRTL ? "حذف هذا المقاول نهائيًا." : "Permanently delete this contractor."}</TooltipContent>
                  </Tooltip>
                </div>
              </CardHeader>
              <CardContent className="space-y-3">
                <div className="flex items-center gap-2 flex-wrap">
                  <Badge
                    variant={getStatusBadgeVariant(contractor.status)}
                    className={contractor.status === "active" ? "bg-green-600 text-white" : ""}
                  >
                    {contractor.status.charAt(0).toUpperCase() + contractor.status.slice(1)}
                  </Badge>
                  {contractor.specialization && (
                    <Badge variant="outline">
                      {contractor.specialization}
                    </Badge>
                  )}
                </div>

                <div className="space-y-1.5">
                  {contractor.company && (
                    <div className="flex items-center gap-2 text-sm">
                      <Building className="h-3 w-3 text-muted-foreground shrink-0" />
                      <span className="truncate" data-testid={`text-contractor-company-${contractor.id}`}>
                        {contractor.company}
                      </span>
                    </div>
                  )}
                  {contractor.phone && (
                    <div className="flex items-center gap-2 text-sm text-muted-foreground">
                      <Phone className="h-3 w-3 shrink-0" />
                      <span className="truncate" data-testid={`text-contractor-phone-${contractor.id}`}>
                        {contractor.phone}
                      </span>
                    </div>
                  )}
                  {contractor.email && (
                    <div className="flex items-center gap-2 text-sm text-muted-foreground">
                      <Mail className="h-3 w-3 shrink-0" />
                      <span className="truncate" data-testid={`text-contractor-email-${contractor.id}`}>
                        {contractor.email}
                      </span>
                    </div>
                  )}
                  {contractor.licenseNumber && (
                    <div className="flex items-center gap-2 text-sm text-muted-foreground">
                      <Award className="h-3 w-3 shrink-0" />
                      <span className="truncate" data-testid={`text-contractor-license-${contractor.id}`}>
                        {t.licenseLabel}: {contractor.licenseNumber}
                      </span>
                    </div>
                  )}
                </div>

                <div className="flex items-center justify-between gap-2 pt-2 border-t">
                  {renderRating(contractor.rating) || (
                    <span className="text-xs text-muted-foreground">{t.noRating}</span>
                  )}
                  <span className="text-xs text-muted-foreground">
                    {formatDate(contractor.createdAt)}
                  </span>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}

      <AlertDialog
        open={!!deletingContractor}
        onOpenChange={(open) => !open && setDeletingContractor(null)}
      >
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>{t.confirmDelete}</AlertDialogTitle>
            <AlertDialogDescription>
              {t.deleteContractorConfirm}
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel data-testid="button-cancel-delete">
              {t.cancel}
            </AlertDialogCancel>
            <AlertDialogAction
              data-testid="button-confirm-delete"
              onClick={() =>
                deletingContractor &&
                deleteContractorMutation.mutate(deletingContractor.id)
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
