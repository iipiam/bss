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

interface ServiceProject {
  id: string;
  restaurantId: string;
  projectNumber: string;
  name: string;
  clientName: string;
  clientPhone: string | null;
  clientEmail: string | null;
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
}

const projectFormSchema = z.object({
  projectNumber: z.string().min(1, "Project number is required"),
  name: z.string().min(1, "Project name is required"),
  clientName: z.string().min(1, "Client name is required"),
  clientPhone: z.string().optional().default(""),
  clientEmail: z.string().optional().default(""),
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

function getStatusLabel(status: string): string {
  switch (status) {
    case "draft":
      return "Draft";
    case "in_progress":
      return "In Progress";
    case "on_hold":
      return "On Hold";
    case "completed":
      return "Completed";
    case "cancelled":
      return "Cancelled";
    default:
      return status;
  }
}

function getPriorityLabel(priority: string): string {
  switch (priority) {
    case "low":
      return "Low";
    case "medium":
      return "Medium";
    case "high":
      return "High";
    case "urgent":
      return "Urgent";
    default:
      return priority;
  }
}

export default function ServiceProjects() {
  const [searchQuery, setSearchQuery] = useState("");
  const [open, setOpen] = useState(false);
  const [editingProject, setEditingProject] = useState<ServiceProject | null>(null);
  const [deletingProject, setDeletingProject] = useState<ServiceProject | null>(null);
  const { toast } = useToast();
  const { t } = useLanguage();
  const layout = useDeviceLayout();

  const form = useForm<ProjectFormValues>({
    resolver: zodResolver(projectFormSchema),
    defaultValues: {
      projectNumber: "",
      name: "",
      clientName: "",
      clientPhone: "",
      clientEmail: "",
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
        title: "Project Created",
        description: "Project has been created successfully",
      });
    },
    onError: (error: any) => {
      toast({
        title: "Failed to Create Project",
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
        title: "Project Updated",
        description: "Project has been updated successfully",
      });
    },
    onError: (error: any) => {
      toast({
        title: "Failed to Update Project",
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
        title: "Project Deleted",
        description: "Project has been deleted successfully",
      });
    },
    onError: (error: any) => {
      toast({
        title: "Failed to Delete Project",
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
    <div className={`${layout.padding} ${layout.spaceY}`}>
      <div
        className={`flex ${layout.isMobile ? "flex-col gap-3" : "items-center justify-between"}`}
      >
        <div>
          <div className="flex items-center gap-2">
            <FolderKanban className="h-8 w-8" />
            <h1 className={`${layout.text3Xl} font-bold`} data-testid="text-projects-title">
              Service Projects
            </h1>
          </div>
          <p className="text-muted-foreground text-sm mt-1">
            Manage your service projects and track progress
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
              Add Project
            </Button>
          </DialogTrigger>
          <DialogContent className="max-h-[90vh] overflow-y-auto">
            <DialogHeader>
              <DialogTitle>
                {editingProject ? "Edit Project" : "Add Project"}
              </DialogTitle>
              <DialogDescription>
                {editingProject
                  ? "Update project information"
                  : "Add a new service project"}
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
                        <FormLabel>Project Number</FormLabel>
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
                        <FormLabel>Project Name</FormLabel>
                        <FormControl>
                          <Input
                            data-testid="input-project-name"
                            placeholder="Enter project name"
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
                      <FormLabel>Client Name</FormLabel>
                      <FormControl>
                        <Input
                          data-testid="input-client-name"
                          placeholder="Enter client name"
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
                        <FormLabel>Client Phone</FormLabel>
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
                        <FormLabel>Client Email</FormLabel>
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
                      <FormLabel>Description</FormLabel>
                      <FormControl>
                        <Textarea
                          data-testid="input-project-description"
                          placeholder="Project description..."
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
                      <FormLabel>Location</FormLabel>
                      <FormControl>
                        <Input
                          data-testid="input-project-location"
                          placeholder="Project location"
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
                        <FormLabel>Status</FormLabel>
                        <Select onValueChange={field.onChange} value={field.value}>
                          <FormControl>
                            <SelectTrigger data-testid="select-project-status">
                              <SelectValue placeholder="Select status" />
                            </SelectTrigger>
                          </FormControl>
                          <SelectContent>
                            <SelectItem value="draft">Draft</SelectItem>
                            <SelectItem value="in_progress">In Progress</SelectItem>
                            <SelectItem value="on_hold">On Hold</SelectItem>
                            <SelectItem value="completed">Completed</SelectItem>
                            <SelectItem value="cancelled">Cancelled</SelectItem>
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
                        <FormLabel>Priority</FormLabel>
                        <Select onValueChange={field.onChange} value={field.value}>
                          <FormControl>
                            <SelectTrigger data-testid="select-project-priority">
                              <SelectValue placeholder="Select priority" />
                            </SelectTrigger>
                          </FormControl>
                          <SelectContent>
                            <SelectItem value="low">Low</SelectItem>
                            <SelectItem value="medium">Medium</SelectItem>
                            <SelectItem value="high">High</SelectItem>
                            <SelectItem value="urgent">Urgent</SelectItem>
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
                        <FormLabel>Start Date</FormLabel>
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
                        <FormLabel>End Date</FormLabel>
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
                      <FormLabel>Estimated Budget (SAR)</FormLabel>
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
                      <FormLabel>Notes</FormLabel>
                      <FormControl>
                        <Textarea
                          data-testid="input-project-notes"
                          placeholder="Additional notes..."
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
                    {editingProject ? "Save" : "Add"}
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
          placeholder={`${t.search} projects...`}
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
              <p className="text-sm text-muted-foreground">Total Projects</p>
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
              <p className="text-sm text-muted-foreground">Active</p>
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
              <p className="text-sm text-muted-foreground">Completed</p>
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
              <p className="text-sm text-muted-foreground">Total Budget</p>
            </div>
            <p className="text-2xl font-bold" data-testid="text-total-budget">
              {totalEstimatedBudget.toLocaleString()} SAR
            </p>
          </CardContent>
        </Card>
      </div>

      {isLoading ? (
        <div className="flex items-center justify-center p-12">
          <p>Loading...</p>
        </div>
      ) : filteredProjects.length === 0 ? (
        <div className="flex flex-col items-center justify-center p-12 text-center">
          <FolderKanban className="h-16 w-16 text-muted-foreground/30 mb-4" />
          <p className="text-muted-foreground">
            {searchQuery
              ? "No projects found matching your search"
              : "No projects yet. Add your first project to get started."}
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
                  <Button
                    variant="ghost"
                    size="icon"
                    onClick={() => handleEdit(project)}
                    data-testid={`button-edit-${project.id}`}
                  >
                    <Edit className="h-4 w-4" />
                  </Button>
                  <Button
                    variant="ghost"
                    size="icon"
                    onClick={() => setDeletingProject(project)}
                    data-testid={`button-delete-${project.id}`}
                  >
                    <Trash2 className="h-4 w-4" />
                  </Button>
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
            <AlertDialogTitle>Confirm Delete</AlertDialogTitle>
            <AlertDialogDescription>
              This will permanently delete project "{deletingProject?.projectNumber}". This
              action cannot be undone.
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
    </div>
  );
}
