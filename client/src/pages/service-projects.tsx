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
  FolderKanban,
  FileText,
  CheckCircle,
  DollarSign,
  Calendar,
  Phone,
  Mail,
  User,
  MapPin,
  AlertTriangle,
  Clock,
  BarChart3,
  TrendingUp,
  TrendingDown,
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
import { Link } from "wouter";

interface ServiceProject {
  id: string;
  restaurantId: string;
  projectNumber: string;
  name: string;
  clientName: string;
  clientPhone: string | null;
  clientEmail: string | null;
  clientCrNumber: string | null;
  clientVatNumber: string | null;
  clientAddress: string | null;
  clientLegalRepresentative: string | null;
  description: string | null;
  location: string | null;
  status: string;
  priority: string;
  startDate: string | null;
  endDate: string | null;
  estimatedBudget: string | null;
  actualCost: string | null;
  contractorId: string | null;
  notes: string | null;
  createdAt: string;
  approvalStatus?: string | null;
  lifecycleStatus?: string | null;
}

const projectFormSchema = z.object({
  projectNumber: z.string().min(1, "Project number is required"),
  name: z.string().min(1, "Project name is required"),
  clientName: z.string().min(1, "Client name is required"),
  clientPhone: z.string().optional().default(""),
  clientEmail: z.string().optional().default(""),
  clientCrNumber: z.string().optional().default(""),
  clientVatNumber: z.string().optional().default(""),
  clientAddress: z.string().optional().default(""),
  clientLegalRepresentative: z.string().optional().default(""),
  description: z.string().optional().default(""),
  location: z.string().optional().default(""),
  status: z.string().min(1, "Status is required"),
  priority: z.string().min(1, "Priority is required"),
  startDate: z.string().optional().default(""),
  endDate: z.string().optional().default(""),
  estimatedBudget: z.string().optional().default(""),
  notes: z.string().optional().default(""),
});

type ProjectFormValues = z.infer<typeof projectFormSchema>;

function getStatusBadgeVariant(status: string): "default" | "secondary" | "outline" | "destructive" {
  switch (status) {
    case "in_progress":
      return "default";
    case "draft":
      return "secondary";
    case "on_hold":
      return "outline";
    case "completed":
      return "default";
    case "cancelled":
      return "destructive";
    default:
      return "secondary";
  }
}

function getStatusClassName(status: string): string {
  if (status === "completed") {
    return "bg-green-600 text-white";
  }
  return "";
}

function getPriorityBadgeVariant(priority: string): "default" | "secondary" | "outline" | "destructive" {
  switch (priority) {
    case "low":
      return "secondary";
    case "medium":
      return "default";
    case "high":
      return "outline";
    case "urgent":
      return "destructive";
    default:
      return "secondary";
  }
}

function getPriorityClassName(priority: string): string {
  if (priority === "high") {
    return "border-yellow-500 text-yellow-700 dark:text-yellow-400";
  }
  return "";
}


export default function ServiceProjects() {
  const [searchQuery, setSearchQuery] = useState("");
  const [open, setOpen] = useState(false);
  const [editingProject, setEditingProject] = useState<ServiceProject | null>(null);
  const [deletingProject, setDeletingProject] = useState<ServiceProject | null>(null);
  const [reportingProject, setReportingProject] = useState<ServiceProject | null>(null);
  const { toast } = useToast();
  const { t, isRTL } = useLanguage();
  const layout = useDeviceLayout();

  const getStatusLabel = (status: string): string => {
    switch (status) {
      case "draft": return t.draft;
      case "in_progress": return t.inProgress;
      case "on_hold": return t.onHold;
      case "completed": return t.completed;
      case "cancelled": return t.cancelled;
      default: return status;
    }
  };
  const getPriorityLabel = (priority: string): string => {
    switch (priority) {
      case "low": return t.low;
      case "medium": return t.medium;
      case "high": return t.high;
      case "urgent": return t.urgent;
      default: return priority;
    }
  };

  const form = useForm<ProjectFormValues>({
    resolver: zodResolver(projectFormSchema),
    defaultValues: {
      projectNumber: "",
      name: "",
      clientName: "",
      clientPhone: "",
      clientEmail: "",
      clientCrNumber: "",
      clientVatNumber: "",
      clientAddress: "",
      clientLegalRepresentative: "",
      description: "",
      location: "",
      status: "draft",
      priority: "medium",
      startDate: "",
      endDate: "",
      estimatedBudget: "",
      notes: "",
    },
  });

  const { data: projects = [], isLoading } = useQuery<ServiceProject[]>({
    queryKey: ["/api/service-projects"],
  });

  const createProjectMutation = useMutation({
    mutationFn: async (data: ProjectFormValues) => {
      const payload = {
        ...data,
        clientPhone: data.clientPhone || null,
        clientEmail: data.clientEmail || null,
        clientCrNumber: data.clientCrNumber || null,
        clientVatNumber: data.clientVatNumber || null,
        clientAddress: data.clientAddress || null,
        clientLegalRepresentative: data.clientLegalRepresentative || null,
        description: data.description || null,
        location: data.location || null,
        startDate: data.startDate || null,
        endDate: data.endDate || null,
        estimatedBudget: data.estimatedBudget || null,
        notes: data.notes || null,
      };
      return await apiRequest("POST", "/api/service-projects", payload);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/service-projects"] });
      setOpen(false);
      form.reset();
      toast({
        title: t.projectCreated,
        description: t.projectCreatedDesc,
      });
    },
    onError: (error: any) => {
      toast({
        title: t.failedToCreateProject,
        description: error.message || "Could not create project",
        variant: "destructive",
      });
    },
  });

  const updateProjectMutation = useMutation({
    mutationFn: async (data: ProjectFormValues & { id: string }) => {
      const payload = {
        projectNumber: data.projectNumber,
        name: data.name,
        clientName: data.clientName,
        clientPhone: data.clientPhone || null,
        clientEmail: data.clientEmail || null,
        clientCrNumber: data.clientCrNumber || null,
        clientVatNumber: data.clientVatNumber || null,
        clientAddress: data.clientAddress || null,
        clientLegalRepresentative: data.clientLegalRepresentative || null,
        description: data.description || null,
        location: data.location || null,
        status: data.status,
        priority: data.priority,
        startDate: data.startDate || null,
        endDate: data.endDate || null,
        estimatedBudget: data.estimatedBudget || null,
        notes: data.notes || null,
      };
      return await apiRequest("PATCH", `/api/service-projects/${data.id}`, payload);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/service-projects"] });
      setOpen(false);
      setEditingProject(null);
      form.reset();
      toast({
        title: t.projectUpdated,
        description: t.projectUpdatedDesc,
      });
    },
    onError: (error: any) => {
      toast({
        title: t.failedToUpdateProject,
        description: error.message || "Could not update project",
        variant: "destructive",
      });
    },
  });

  const deleteProjectMutation = useMutation({
    mutationFn: async (id: string) => {
      await apiRequest("DELETE", `/api/service-projects/${id}`);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/service-projects"] });
      setDeletingProject(null);
      toast({
        title: t.projectDeleted,
        description: t.projectDeletedDesc,
      });
    },
    onError: (error: any) => {
      toast({
        title: t.failedToDeleteProject,
        description: error.message || "Could not delete project",
        variant: "destructive",
      });
    },
  });

  const onSubmit = (data: ProjectFormValues) => {
    const payload = {
      ...data,
      clientPhone: data.clientPhone || null,
      clientEmail: data.clientEmail || null,
      clientCrNumber: data.clientCrNumber || null,
      clientVatNumber: data.clientVatNumber || null,
      clientAddress: data.clientAddress || null,
      clientLegalRepresentative: data.clientLegalRepresentative || null,
      description: data.description || null,
      location: data.location || null,
      startDate: data.startDate || null,
      endDate: data.endDate || null,
      estimatedBudget: data.estimatedBudget || null,
      notes: data.notes || null,
    };
    if (editingProject) {
      updateProjectMutation.mutate({ ...payload, id: editingProject.id });
    } else {
      createProjectMutation.mutate(payload);
    }
  };

  const handleEdit = (project: ServiceProject) => {
    setEditingProject(project);
    form.reset({
      projectNumber: project.projectNumber,
      name: project.name,
      clientName: project.clientName,
      clientPhone: project.clientPhone || "",
      clientEmail: project.clientEmail || "",
      clientCrNumber: project.clientCrNumber || "",
      clientVatNumber: project.clientVatNumber || "",
      clientAddress: project.clientAddress || "",
      clientLegalRepresentative: project.clientLegalRepresentative || "",
      description: project.description || "",
      location: project.location || "",
      status: project.status,
      priority: project.priority,
      startDate: project.startDate || "",
      endDate: project.endDate || "",
      estimatedBudget: project.estimatedBudget || "",
      notes: project.notes || "",
    });
    setOpen(true);
  };

  const handleOpenChange = (isOpen: boolean) => {
    setOpen(isOpen);
    if (!isOpen) {
      setEditingProject(null);
      form.reset();
    }
  };

  const handleCloseDialog = () => {
    setOpen(false);
    setEditingProject(null);
    form.reset();
  };

  const handleAddNew = () => {
    const nextNumber = projects.length + 1;
    const suggestion = `PRJ-${String(nextNumber).padStart(3, "0")}`;
    form.reset({
      projectNumber: suggestion,
      name: "",
      clientName: "",
      clientPhone: "",
      clientEmail: "",
      clientCrNumber: "",
      clientVatNumber: "",
      clientAddress: "",
      clientLegalRepresentative: "",
      description: "",
      location: "",
      status: "draft",
      priority: "medium",
      startDate: "",
      endDate: "",
      estimatedBudget: "",
      notes: "",
    });
    setEditingProject(null);
    setOpen(true);
  };

  const filteredProjects = projects.filter(
    (project) =>
      project.projectNumber.toLowerCase().includes(searchQuery.toLowerCase()) ||
      project.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      project.clientName.toLowerCase().includes(searchQuery.toLowerCase()),
  );

  const activeProjects = projects.filter((p) => p.status === "in_progress");
  const completedProjects = projects.filter((p) => p.status === "completed");
  const totalEstimatedBudget = projects.reduce(
    (sum, p) => sum + parseFloat(p.estimatedBudget || "0"),
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
    <TooltipProvider delayDuration={150}>
    <div className={`${layout.padding} ${layout.spaceY}`}>
      <div
        className={`flex ${layout.isMobile ? "flex-col gap-3" : "items-center justify-between"}`}
      >
        <div>
          <div className="flex items-center gap-2">
            <FolderKanban className="h-8 w-8" />
            <h1 className={`${layout.text3Xl} font-bold`} data-testid="text-projects-title">
              {t.serviceProjects}
            </h1>
          </div>
          <p className="text-muted-foreground text-sm mt-1">
            {t.serviceProjectsDescription}
          </p>
        </div>
        <Dialog open={open} onOpenChange={handleOpenChange}>
          <DialogTrigger asChild>
            <Button
              data-testid="button-add-project"
              className={layout.isMobile ? "h-[44px]" : ""}
              onClick={handleAddNew}
            >
              <Plus className="h-4 w-4 mr-2" />
              {t.addProject}
            </Button>
          </DialogTrigger>
          <DialogContent className="max-h-[90vh] overflow-y-auto">
            <DialogHeader>
              <DialogTitle>
                {editingProject ? t.editProject : t.addProject}
              </DialogTitle>
              <DialogDescription>
                {editingProject
                  ? t.updateProjectInfo
                  : t.addNewProject}
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
                    name="projectNumber"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>{t.projectNumber}</FormLabel>
                        <FormControl>
                          <Input
                            data-testid="input-project-number"
                            placeholder="PRJ-001"
                            {...field}
                          />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                  <FormField
                    control={form.control}
                    name="name"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>{t.projectName}</FormLabel>
                        <FormControl>
                          <Input
                            data-testid="input-project-name"
                            placeholder={t.enterProjectName}
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

                <div className="pt-2">
                  <h4 className="text-sm font-semibold text-muted-foreground mb-3" data-testid="text-client-legal-section">
                    {t.clientLegalInformation}
                  </h4>
                  <div className="grid grid-cols-2 gap-4">
                    <FormField
                      control={form.control}
                      name="clientCrNumber"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>{t.clientCrNumber}<InfoTip>{isRTL ? "رقم السجل التجاري للعميل." : "Client's Commercial Registration number."}</InfoTip></FormLabel>
                          <FormControl>
                            <Input
                              data-testid="input-client-cr-number"
                              placeholder="1010XXXXXX"
                              {...field}
                            />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                    <FormField
                      control={form.control}
                      name="clientVatNumber"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>{t.clientVatNumber}<InfoTip>{isRTL ? "الرقم الضريبي المكون من 15 رقماً." : "Client's 15-digit VAT registration number."}</InfoTip></FormLabel>
                          <FormControl>
                            <Input
                              data-testid="input-client-vat-number"
                              placeholder="3XXXXXXXXXXXXX3"
                              {...field}
                            />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                  </div>
                  <div className="mt-4">
                    <FormField
                      control={form.control}
                      name="clientAddress"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>{t.clientAddress}<InfoTip>{isRTL ? "العنوان الوطني الكامل للعميل." : "Client's full national address."}</InfoTip></FormLabel>
                          <FormControl>
                            <Textarea
                              data-testid="input-client-address"
                              className="resize-none"
                              rows={2}
                              {...field}
                            />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                  </div>
                  <div className="mt-4">
                    <FormField
                      control={form.control}
                      name="clientLegalRepresentative"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>{t.clientLegalRepresentative}<InfoTip>{isRTL ? "اسم الشخص المخول قانونياً بتوقيع العقود." : "Person legally authorized to sign contracts."}</InfoTip></FormLabel>
                          <FormControl>
                            <Input
                              data-testid="input-client-legal-representative"
                              {...field}
                            />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                  </div>
                </div>

                <FormField
                  control={form.control}
                  name="description"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>{t.description}</FormLabel>
                      <FormControl>
                        <Textarea
                          data-testid="input-project-description"
                          placeholder={t.projectDescription}
                          className="resize-none"
                          {...field}
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={form.control}
                  name="location"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>{t.location}</FormLabel>
                      <FormControl>
                        <Input
                          data-testid="input-project-location"
                          placeholder={t.projectLocation}
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
                    name="status"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>{t.status}<InfoTip>{isRTL ? "الحالة الحالية لسير العمل في المشروع." : "Current workflow state of the project."}</InfoTip></FormLabel>
                        <Select onValueChange={field.onChange} value={field.value}>
                          <FormControl>
                            <SelectTrigger data-testid="select-project-status">
                              <SelectValue placeholder={t.selectStatus} />
                            </SelectTrigger>
                          </FormControl>
                          <SelectContent>
                            <SelectItem value="draft">{t.draft}</SelectItem>
                            <SelectItem value="in_progress">{t.inProgress}</SelectItem>
                            <SelectItem value="on_hold">{t.onHold}</SelectItem>
                            <SelectItem value="completed">{t.completed}</SelectItem>
                            <SelectItem value="cancelled">{t.cancelled}</SelectItem>
                          </SelectContent>
                        </Select>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                  <FormField
                    control={form.control}
                    name="priority"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>{t.priority}<InfoTip>{isRTL ? "مستوى أهمية المشروع وعجلته." : "Importance and urgency of the project."}</InfoTip></FormLabel>
                        <Select onValueChange={field.onChange} value={field.value}>
                          <FormControl>
                            <SelectTrigger data-testid="select-project-priority">
                              <SelectValue placeholder={t.selectPriority} />
                            </SelectTrigger>
                          </FormControl>
                          <SelectContent>
                            <SelectItem value="low">{t.low}</SelectItem>
                            <SelectItem value="medium">{t.medium}</SelectItem>
                            <SelectItem value="high">{t.high}</SelectItem>
                            <SelectItem value="urgent">{t.urgent}</SelectItem>
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
                        <FormLabel>{t.startDate}<InfoTip>{isRTL ? "تاريخ بدء تنفيذ المشروع المخطط له." : "Planned project start date."}</InfoTip></FormLabel>
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
                        <FormLabel>{t.endDate}<InfoTip>{isRTL ? "تاريخ انتهاء المشروع المتوقع." : "Expected project completion date."}</InfoTip></FormLabel>
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

                <FormField
                  control={form.control}
                  name="estimatedBudget"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>{t.estimatedBudget}<InfoTip>{isRTL ? "الميزانية الإجمالية المقدرة بالريال السعودي." : "Estimated total budget in SAR."}</InfoTip></FormLabel>
                      <FormControl>
                        <Input
                          data-testid="input-estimated-budget"
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
                  name="notes"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>{t.notes}</FormLabel>
                      <FormControl>
                        <Textarea
                          data-testid="input-project-notes"
                          placeholder={t.notes}
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
                      createProjectMutation.isPending ||
                      updateProjectMutation.isPending
                    }
                  >
                    {editingProject ? t.save : t.add}
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
          data-testid="input-search-projects"
          placeholder={`${t.search} ${t.serviceProjects.toLowerCase()}...`}
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
              <p className="text-sm text-muted-foreground">{t.totalProjects}</p>
              <InfoTip>{isRTL ? "إجمالي عدد المشاريع المسجلة." : "Total number of registered projects."}</InfoTip>
            </div>
            <p className="text-2xl font-bold" data-testid="text-total-projects">
              {projects.length}
            </p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-4 pb-4">
            <div className="flex items-center gap-2 mb-1">
              <Clock className="h-4 w-4 text-muted-foreground" />
              <p className="text-sm text-muted-foreground">{t.activeProjects}</p>
              <InfoTip>{isRTL ? "المشاريع قيد التنفيذ حالياً." : "Projects currently in progress."}</InfoTip>
            </div>
            <p className="text-2xl font-bold" data-testid="text-active-projects">
              {activeProjects.length}
            </p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-4 pb-4">
            <div className="flex items-center gap-2 mb-1">
              <CheckCircle className="h-4 w-4 text-muted-foreground" />
              <p className="text-sm text-muted-foreground">{t.completedProjects}</p>
              <InfoTip>{isRTL ? "المشاريع المنجزة بنجاح." : "Projects successfully completed."}</InfoTip>
            </div>
            <p className="text-2xl font-bold" data-testid="text-completed-projects">
              {completedProjects.length}
            </p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-4 pb-4">
            <div className="flex items-center gap-2 mb-1">
              <DollarSign className="h-4 w-4 text-muted-foreground" />
              <p className="text-sm text-muted-foreground">{t.totalBudget}</p>
              <InfoTip>{isRTL ? "إجمالي الميزانية المقدرة لجميع المشاريع." : "Sum of estimated budgets across all projects."}</InfoTip>
            </div>
            <p className="text-2xl font-bold" data-testid="text-total-budget">
              {totalEstimatedBudget.toLocaleString()} SAR
            </p>
          </CardContent>
        </Card>
      </div>

      {isLoading ? (
        <div className="flex items-center justify-center p-12">
          <p>{t.loading}</p>
        </div>
      ) : filteredProjects.length === 0 ? (
        <div className="flex flex-col items-center justify-center p-12 text-center">
          <FolderKanban className="h-16 w-16 text-muted-foreground/30 mb-4" />
          <p className="text-muted-foreground">
            {searchQuery
              ? t.noProjectsFound
              : t.noProjectsYet}
          </p>
        </div>
      ) : (
        <div
          className={`grid ${layout.gap} ${layout.gridCols({ desktop: 3, tablet: 2, mobile: 1 })}`}
        >
          {filteredProjects.map((project) => (
            <Card
              key={project.id}
              data-testid={`card-project-${project.id}`}
            >
              <CardHeader className="flex flex-row items-center justify-between gap-2 space-y-0 pb-2">
                <div className="flex items-center gap-2 min-w-0">
                  <FileText className="h-4 w-4 text-muted-foreground shrink-0" />
                  <h3
                    className="font-semibold truncate"
                    data-testid={`text-project-number-${project.id}`}
                  >
                    {project.projectNumber}
                  </h3>
                </div>
                <div className="flex gap-1 shrink-0">
                  <Link href={`/service-projects/${project.id}`}>
                    <Tooltip>
                      <TooltipTrigger asChild>
                        <Button
                          variant="ghost"
                          size="icon"
                          aria-label={t.view}
                          data-testid={`button-view-${project.id}`}
                        >
                          <FileText className="h-4 w-4" />
                        </Button>
                      </TooltipTrigger>
                      <TooltipContent>{t.view}</TooltipContent>
                    </Tooltip>
                  </Link>
                  <Tooltip>
                    <TooltipTrigger asChild>
                      <Button
                        variant="ghost"
                        size="icon"
                        aria-label={t.edit}
                        onClick={() => handleEdit(project)}
                        data-testid={`button-edit-${project.id}`}
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
                        aria-label={(t as any).costProfitReport || "Cost & Profit Report"}
                        onClick={() => setReportingProject(project)}
                        data-testid={`button-report-${project.id}`}
                      >
                        <BarChart3 className="h-4 w-4" />
                      </Button>
                    </TooltipTrigger>
                    <TooltipContent>{(t as any).costProfitReport || "Cost & Profit Report"}</TooltipContent>
                  </Tooltip>
                  <Tooltip>
                    <TooltipTrigger asChild>
                      <Button
                        variant="ghost"
                        size="icon"
                        aria-label={t.delete}
                        onClick={() => setDeletingProject(project)}
                        data-testid={`button-delete-${project.id}`}
                      >
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    </TooltipTrigger>
                    <TooltipContent>{isRTL ? "حذف المشروع نهائياً — لا يمكن التراجع." : "Permanently delete this project — cannot be undone."}</TooltipContent>
                  </Tooltip>
                </div>
              </CardHeader>
              <CardContent className="space-y-3">
                <p
                  className="font-medium text-sm truncate"
                  data-testid={`text-project-name-${project.id}`}
                >
                  {project.name}
                </p>

                <div className="flex items-center gap-2 flex-wrap">
                  <Badge
                    variant={getStatusBadgeVariant(project.status)}
                    className={getStatusClassName(project.status)}
                    data-testid={`badge-status-${project.status}`}
                  >
                    {getStatusLabel(project.status)}
                  </Badge>
                  <Badge
                    variant={getPriorityBadgeVariant(project.priority)}
                    className={getPriorityClassName(project.priority)}
                    data-testid={`badge-priority-${project.priority}`}
                  >
                    {getPriorityLabel(project.priority)}
                  </Badge>
                  {(() => {
                    const ap = project.approvalStatus || 'pending';
                    const v = ap === 'approved' ? 'default' : ap === 'declined' ? 'destructive' : 'secondary';
                    const cls = ap === 'approved' ? 'bg-green-600 text-white' : '';
                    return (
                      <Badge variant={v as any} className={cls} data-testid={`badge-approval-${project.id}`}>
                        {ap}
                      </Badge>
                    );
                  })()}
                  {project.approvalStatus === 'approved' && (() => {
                    const lc = project.lifecycleStatus || 'not_started';
                    const cls = lc === 'finished' ? 'bg-green-600 text-white' : lc === 'in_progress' ? 'bg-blue-600 text-white' : '';
                    return (
                      <Badge variant="outline" className={cls} data-testid={`badge-lifecycle-${project.id}`}>
                        {lc.replace('_', ' ')}
                      </Badge>
                    );
                  })()}
                </div>

                <div className="space-y-1.5">
                  <div className="flex items-center gap-2 text-sm">
                    <User className="h-3 w-3 text-muted-foreground shrink-0" />
                    <span className="truncate" data-testid={`text-client-name-${project.id}`}>
                      {project.clientName}
                    </span>
                  </div>
                  {project.location && (
                    <div className="flex items-center gap-2 text-sm text-muted-foreground">
                      <MapPin className="h-3 w-3 shrink-0" />
                      <span className="truncate" data-testid={`text-location-${project.id}`}>
                        {project.location}
                      </span>
                    </div>
                  )}
                  {project.clientPhone && (
                    <div className="flex items-center gap-2 text-sm text-muted-foreground">
                      <Phone className="h-3 w-3 shrink-0" />
                      <span className="truncate">{project.clientPhone}</span>
                    </div>
                  )}
                  {project.clientEmail && (
                    <div className="flex items-center gap-2 text-sm text-muted-foreground">
                      <Mail className="h-3 w-3 shrink-0" />
                      <span className="truncate">{project.clientEmail}</span>
                    </div>
                  )}
                </div>

                {project.estimatedBudget && (
                  <div className="flex items-center justify-between gap-2 pt-2 border-t">
                    <div className="flex items-center gap-1 text-sm font-semibold">
                      <DollarSign className="h-3 w-3" />
                      <span data-testid={`text-budget-${project.id}`}>
                        {parseFloat(project.estimatedBudget).toLocaleString()} SAR
                      </span>
                    </div>
                    {project.actualCost && (
                      <span className="text-xs text-muted-foreground">
                        Actual: {parseFloat(project.actualCost).toLocaleString()} SAR
                      </span>
                    )}
                  </div>
                )}

                <div className="flex items-center gap-4 text-xs text-muted-foreground">
                  <div className="flex items-center gap-1">
                    <Calendar className="h-3 w-3" />
                    <span>{formatDate(project.startDate)}</span>
                  </div>
                  <span>-</span>
                  <span>{formatDate(project.endDate)}</span>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}

      <AlertDialog
        open={!!deletingProject}
        onOpenChange={(open) => !open && setDeletingProject(null)}
      >
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>{t.confirmDelete}</AlertDialogTitle>
            <AlertDialogDescription>
              {t.deleteProjectConfirm}
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel data-testid="button-cancel-delete">
              {t.cancel}
            </AlertDialogCancel>
            <AlertDialogAction
              data-testid="button-confirm-delete"
              onClick={() =>
                deletingProject &&
                deleteProjectMutation.mutate(deletingProject.id)
              }
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
            >
              {t.delete}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      <Dialog
        open={!!reportingProject}
        onOpenChange={(open) => !open && setReportingProject(null)}
      >
        <DialogContent className="max-w-3xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <BarChart3 className="h-5 w-5" />
              {(t as any).costProfitReport || "Cost & Profit Report"}
            </DialogTitle>
            <DialogDescription>
              {reportingProject?.projectNumber} — {reportingProject?.name}
            </DialogDescription>
          </DialogHeader>
          {reportingProject && (
            <CostProfitReport
              project={reportingProject}
              t={t}
            />
          )}
        </DialogContent>
      </Dialog>
    </div>
    </TooltipProvider>
  );
}

// ============== Cost & Profit Report ==============
interface ReportRow {
  totalPrice?: string | null;
  amount?: string | null;
}

function sumDecimal(rows: ReportRow[] | undefined, key: "totalPrice" | "amount"): number {
  if (!rows) return 0;
  const cents = rows.reduce((s, r) => {
    const v = parseFloat((r as any)[key] ?? "0");
    if (!Number.isFinite(v)) return s;
    return s + Math.round(v * 100);
  }, 0);
  return cents / 100;
}

function fmtSar(n: number): string {
  return (
    n.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 }) +
    " SAR"
  );
}

function CostProfitReport({ project, t }: { project: ServiceProject; t: any }) {
  const services = useQuery<any[]>({
    queryKey: ["/api/project-services", { projectId: project.id }],
    queryFn: async () => {
      const res = await fetch(`/api/project-services?projectId=${project.id}`, { credentials: "include" });
      if (!res.ok) throw new Error("Failed to load services");
      return res.json();
    },
  });
  const bills = useQuery<any[]>({
    queryKey: ["/api/project-bills", { projectId: project.id }],
    queryFn: async () => {
      const res = await fetch(`/api/project-bills?projectId=${project.id}`, { credentials: "include" });
      if (!res.ok) throw new Error("Failed to load bills");
      return res.json();
    },
  });
  const procurements = useQuery<any[]>({
    queryKey: ["/api/project-procurements", { projectId: project.id }],
    queryFn: async () => {
      const res = await fetch(`/api/project-procurements?projectId=${project.id}`, { credentials: "include" });
      if (!res.ok) throw new Error("Failed to load procurements");
      return res.json();
    },
  });

  const isLoading = services.isLoading || bills.isLoading || procurements.isLoading;
  const loadError = services.error || bills.error || procurements.error;

  const servicesRevenue = sumDecimal(services.data, "totalPrice");
  const quotedRevenue = parseFloat(project.estimatedBudget ?? "0") || 0;
  const revenue = servicesRevenue > 0 ? servicesRevenue : quotedRevenue;

  const billsCost = sumDecimal(bills.data, "amount");
  const procurementCost = sumDecimal(procurements.data, "totalPrice");
  const totalCost = billsCost + procurementCost;

  const profit = revenue - totalCost;
  const margin = revenue > 0 ? (profit / revenue) * 100 : 0;
  const profitable = profit >= 0;

  if (isLoading) {
    return (
      <div className="py-8 text-center text-sm text-muted-foreground" data-testid="report-loading">
        {t.loading || "Loading..."}
      </div>
    );
  }

  if (loadError) {
    return (
      <div className="py-8 text-center text-sm text-red-600 dark:text-red-400" data-testid="report-error">
        {(t as any).failedToLoadReport || "Failed to load report data. Please try again."}
      </div>
    );
  }

  return (
    <div className="space-y-4">
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
        <Card>
          <CardContent className="pt-4 pb-4 space-y-1">
            <div className="flex items-center gap-2 text-xs text-muted-foreground">
              <DollarSign className="h-3.5 w-3.5" />
              {t.revenue || "Revenue"}
            </div>
            <div className="text-2xl font-bold" data-testid="report-revenue">
              {fmtSar(revenue)}
            </div>
            <div className="text-xs text-muted-foreground">
              {servicesRevenue > 0
                ? (t.fromServices || "From project services")
                : (t.fromBudget || "From estimated budget")}
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="pt-4 pb-4 space-y-1">
            <div className="flex items-center gap-2 text-xs text-muted-foreground">
              <TrendingDown className="h-3.5 w-3.5" />
              {t.totalCost || "Total Cost"}
            </div>
            <div className="text-2xl font-bold text-red-600 dark:text-red-400" data-testid="report-cost">
              {fmtSar(totalCost)}
            </div>
            <div className="text-xs text-muted-foreground">
              {t.billsAndProcurement || "Bills + procurement"}
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="pt-4 pb-4 space-y-1">
            <div className="flex items-center gap-2 text-xs text-muted-foreground">
              {profitable ? (
                <TrendingUp className="h-3.5 w-3.5" />
              ) : (
                <TrendingDown className="h-3.5 w-3.5" />
              )}
              {t.netProfit || "Net Profit"}
            </div>
            <div
              className={`text-2xl font-bold ${profitable ? "text-emerald-600 dark:text-emerald-400" : "text-red-600 dark:text-red-400"}`}
              data-testid="report-profit"
            >
              {fmtSar(profit)}
            </div>
            <div className="text-xs text-muted-foreground" data-testid="report-margin">
              {t.margin || "Margin"}: {margin.toFixed(1)}%
            </div>
          </CardContent>
        </Card>
      </div>

      <Card>
        <CardHeader className="pb-2">
          <h4 className="font-semibold text-sm">{t.breakdown || "Breakdown"}</h4>
        </CardHeader>
        <CardContent className="space-y-2">
          <BreakdownRow
            label={`${t.services || "Services"} (${services.data?.length ?? 0})`}
            value={fmtSar(servicesRevenue)}
            kind="revenue"
          />
          <BreakdownRow
            label={`${t.bills || "Bills"} (${bills.data?.length ?? 0})`}
            value={fmtSar(billsCost)}
            kind="cost"
          />
          <BreakdownRow
            label={`${t.procurement || "Procurement"} (${procurements.data?.length ?? 0})`}
            value={fmtSar(procurementCost)}
            kind="cost"
          />
          <div className="border-t pt-2 mt-2 flex items-center justify-between font-semibold">
            <span>{t.netProfit || "Net Profit"}</span>
            <span className={profitable ? "text-emerald-600 dark:text-emerald-400" : "text-red-600 dark:text-red-400"}>
              {fmtSar(profit)}
            </span>
          </div>
        </CardContent>
      </Card>

      {quotedRevenue > 0 && servicesRevenue > 0 && Math.abs(quotedRevenue - servicesRevenue) > 0.01 && (
        <p className="text-xs text-muted-foreground" data-testid="report-budget-note">
          {t.estimatedBudgetLabel || "Estimated budget"}: {fmtSar(quotedRevenue)}
        </p>
      )}
    </div>
  );
}

function BreakdownRow({
  label,
  value,
  kind,
}: {
  label: string;
  value: string;
  kind: "revenue" | "cost";
}) {
  return (
    <div className="flex items-center justify-between text-sm">
      <span className="text-muted-foreground">{label}</span>
      <span className={kind === "cost" ? "text-red-600 dark:text-red-400" : ""}>
        {kind === "cost" ? "−" : ""}{value}
      </span>
    </div>
  );
}
