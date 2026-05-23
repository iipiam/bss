import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle,
} from "@/components/ui/dialog";
import {
  AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent,
  AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import {
  Form, FormControl, FormField, FormItem, FormLabel, FormMessage,
} from "@/components/ui/form";
import {
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue,
} from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { Tooltip, TooltipContent, TooltipTrigger } from "@/components/ui/tooltip";
import {
  ArrowLeft, Plus, Edit, Trash2, DollarSign, Calendar, Phone, Mail,
  User, MapPin, Clock, FileText, CheckCircle, Layers, Receipt,
  ShoppingCart, CreditCard, ListTodo, Zap, AlertTriangle, Download,
  FileSignature, MessageCircle, ShieldCheck, ShieldX, PlayCircle, CheckSquare, PackageCheck,
  Lightbulb, Target, GitBranch, Activity,
} from "lucide-react";
import { useQuery, useMutation } from "@tanstack/react-query";
import { apiRequest, queryClient } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { useLanguage } from "@/contexts/LanguageContext";
import { useDeviceLayout } from "@/lib/mobileLayout";
import { usePermissions } from "@/hooks/usePermissions";
import { Link, useParams, useLocation } from "wouter";
import { format } from "date-fns";

interface ServiceProject {
  id: string; restaurantId: string; projectNumber: string; name: string;
  clientName: string; clientPhone: string | null; clientEmail: string | null;
  description: string | null; location: string | null; status: string; priority: string;
  startDate: string | null; endDate: string | null; estimatedBudget: string | null;
  actualCost: string | null; contractorId: string | null; notes: string | null; createdAt: string;
  approvalStatus?: string | null;
  lifecycleStatus?: string | null;
  approvedAt?: string | null;
  approvedBy?: string | null;
  declineReason?: string | null;
  customerId?: string | null;
}
interface ProjectServiceItem {
  id: string; projectId: string; serviceCatalogId: string | null; name: string;
  description: string | null; pricingMethod: string; unitPrice: string; quantity: string;
  unit: string | null; totalPrice: string; status: string; notes: string | null;
}
interface ProjectBillItem {
  id: string; projectId: string; description: string; amount: string; category: string | null;
  vendor: string | null; billDate: string; dueDate: string | null; status: string;
  paidDate: string | null; notes: string | null;
}
interface ProjectProcurementItem {
  id: string; projectId: string; itemName: string; description: string | null;
  quantity: string; unitPrice: string; totalPrice: string; vendor: string | null;
  purchaseDate: string; deliveryDate: string | null; status: string; notes: string | null;
}
interface PaymentScheduleItem {
  id: string; projectId: string; milestoneName: string; amount: string;
  dueDate: string | null; status: string; paidDate: string | null; notes: string | null;
  invoiceId: string | null; transactionId: string | null;
}
interface ProjectTaskItem {
  id: string; projectId: string; name: string; description: string | null;
  duration: number; dependencies: string[] | null; status: string; isCritical: boolean;
  earlyStart: number | null; earlyFinish: number | null; lateStart: number | null;
  lateFinish: number | null; slack: number | null; sortOrder: number;
}
interface CatalogItem {
  id: string; name: string; description: string | null; pricingMethod: string;
  unitPrice: string; unit: string | null;
}

const serviceSchema = z.object({
  serviceCatalogId: z.string().optional().default(""),
  name: z.string().min(1), description: z.string().optional().default(""),
  pricingMethod: z.string().min(1), unitPrice: z.string().min(1),
  quantity: z.string().min(1), unit: z.string().optional().default(""),
  totalPrice: z.string().min(1), status: z.string().min(1),
  notes: z.string().optional().default(""),
});
const billSchema = z.object({
  description: z.string().min(1), amount: z.string().min(1),
  category: z.string().optional().default(""), vendor: z.string().optional().default(""),
  billDate: z.string().min(1), dueDate: z.string().optional().default(""),
  status: z.string().min(1), paidDate: z.string().optional().default(""),
  notes: z.string().optional().default(""),
});
const procurementSchema = z.object({
  itemName: z.string().min(1), description: z.string().optional().default(""),
  quantity: z.string().min(1), unitPrice: z.string().min(1),
  totalPrice: z.string().min(1), vendor: z.string().optional().default(""),
  purchaseDate: z.string().min(1), deliveryDate: z.string().optional().default(""),
  status: z.string().min(1), notes: z.string().optional().default(""),
});
const paymentSchema = z.object({
  milestoneName: z.string().min(1), amount: z.string().min(1),
  dueDate: z.string().optional().default(""), status: z.string().min(1),
  paidDate: z.string().optional().default(""), notes: z.string().optional().default(""),
});
const taskSchema = z.object({
  name: z.string().min(1), description: z.string().optional().default(""),
  duration: z.string().min(1), dependencies: z.string().optional().default(""),
  status: z.string().min(1),
});

type ServiceFormValues = z.infer<typeof serviceSchema>;
type BillFormValues = z.infer<typeof billSchema>;
type ProcurementFormValues = z.infer<typeof procurementSchema>;
type PaymentFormValues = z.infer<typeof paymentSchema>;
type TaskFormValues = z.infer<typeof taskSchema>;

function statusBadge(status: string): "default" | "secondary" | "destructive" {
  if (status === "completed" || status === "paid" || status === "received") return "default";
  if (status === "overdue" || status === "cancelled") return "destructive";
  if (status === "in_progress" || status === "ordered") return "default";
  return "secondary";
}
function statusClass(status: string): string {
  if (status === "completed" || status === "paid" || status === "received") return "bg-green-600 text-white";
  return "";
}
function priorityBadge(p: string): "default" | "secondary" | "destructive" {
  if (p === "urgent") return "destructive";
  if (p === "high" || p === "medium") return "default";
  return "secondary";
}
function priorityClass(p: string): string {
  if (p === "high") return "border-yellow-500 text-yellow-700 dark:text-yellow-400";
  return "";
}
function getPricingLabels(t: any): Record<string, string> {
  return {
    per_piece: t.perPiece || "Per Piece", length: t.lengthUnit || "Length", area: t.areaUnit || "Area", hour: t.hourUnit || "Hour", lump_sum: t.lumpSum || "Lump Sum",
  };
}

function fmtDate(d: string | null) {
  if (!d) return "-";
  try { return format(new Date(d), "MMM dd, yyyy"); } catch { return d; }
}
function fmtNum(v: string | null | undefined) {
  return parseFloat(v || "0").toLocaleString();
}

export default function ProjectDetail() {
  const params = useParams<{ id: string }>();
  const projectId = params.id;
  const [, setLocation] = useLocation();
  const { t, language } = useLanguage();
  const layout = useDeviceLayout();
  const pdfLang = (language === 'Arabic' || language === 'Urdu') ? 'ar' : 'en';
  const { toast } = useToast();
  const pricingLabels = getPricingLabels(t);

  const [activeTab, setActiveTab] = useState("overview");
  const [svcOpen, setSvcOpen] = useState(false);
  const [billOpen, setBillOpen] = useState(false);
  const [applyProductOpen, setApplyProductOpen] = useState(false);
  const [selectedProductId, setSelectedProductId] = useState<string>("");
  const [procOpen, setProcOpen] = useState(false);
  const [payOpen, setPayOpen] = useState(false);
  const [taskOpen, setTaskOpen] = useState(false);
  const [autoGenOpen, setAutoGenOpen] = useState(false);
  const [installments, setInstallments] = useState("3");

  const [editSvc, setEditSvc] = useState<ProjectServiceItem | null>(null);
  const [editBill, setEditBill] = useState<ProjectBillItem | null>(null);
  const [editProc, setEditProc] = useState<ProjectProcurementItem | null>(null);
  const [editPay, setEditPay] = useState<PaymentScheduleItem | null>(null);
  const [editTask, setEditTask] = useState<ProjectTaskItem | null>(null);
  const [delItem, setDelItem] = useState<{ type: string; id: string; name: string } | null>(null);
  const [declineOpen, setDeclineOpen] = useState(false);
  const [declineReason, setDeclineReason] = useState("");
  const [decisionToolsOpen, setDecisionToolsOpen] = useState(false);
  const { canEdit, canView } = usePermissions();
  const canDecide = canEdit('projects');
  const canDownloadProjectPdf = canView('projects');

  const { data: project, isLoading } = useQuery<ServiceProject>({
    queryKey: ["/api/service-projects", projectId],
    queryFn: async () => {
      const res = await fetch(`/api/service-projects/${projectId}`, { credentials: "include" });
      if (!res.ok) throw new Error("Failed to fetch project");
      return res.json();
    },
    enabled: !!projectId,
  });

  const { data: services = [] } = useQuery<ProjectServiceItem[]>({
    queryKey: ["/api/project-services", projectId],
    queryFn: async () => {
      const res = await fetch(`/api/project-services?projectId=${projectId}`, { credentials: "include" });
      if (!res.ok) throw new Error("Failed"); return res.json();
    },
    enabled: !!projectId,
  });
  const { data: projectItemsData } = useQuery<{ items: { id: string; cost: string; sellingPrice?: string }[]; services: any[] }>({
    queryKey: ["/api/service-projects", projectId, "items"],
    queryFn: async () => {
      const res = await fetch(`/api/service-projects/${projectId}/items`, { credentials: "include" });
      if (!res.ok) throw new Error("Failed"); return res.json();
    },
    enabled: !!projectId,
  });
  const projectItemsList = projectItemsData?.items || [];
  const { data: bills = [] } = useQuery<ProjectBillItem[]>({
    queryKey: ["/api/project-bills", projectId],
    queryFn: async () => {
      const res = await fetch(`/api/project-bills?projectId=${projectId}`, { credentials: "include" });
      if (!res.ok) throw new Error("Failed"); return res.json();
    },
    enabled: !!projectId,
  });
  const { data: procurements = [] } = useQuery<ProjectProcurementItem[]>({
    queryKey: ["/api/project-procurements", projectId],
    queryFn: async () => {
      const res = await fetch(`/api/project-procurements?projectId=${projectId}`, { credentials: "include" });
      if (!res.ok) throw new Error("Failed"); return res.json();
    },
    enabled: !!projectId,
  });
  const { data: payments = [] } = useQuery<PaymentScheduleItem[]>({
    queryKey: ["/api/payment-schedules", projectId],
    queryFn: async () => {
      const res = await fetch(`/api/payment-schedules?projectId=${projectId}`, { credentials: "include" });
      if (!res.ok) throw new Error("Failed"); return res.json();
    },
    enabled: !!projectId,
  });
  const { data: tasks = [] } = useQuery<ProjectTaskItem[]>({
    queryKey: ["/api/project-tasks", projectId],
    queryFn: async () => {
      const res = await fetch(`/api/project-tasks?projectId=${projectId}`, { credentials: "include" });
      if (!res.ok) throw new Error("Failed"); return res.json();
    },
    enabled: !!projectId,
  });
  const { data: catalog = [] } = useQuery<CatalogItem[]>({
    queryKey: ["/api/service-catalog"],
  });
  const { data: serviceProducts = [] } = useQuery<{ id: string; name: string; category: string | null; status: string }[]>({
    queryKey: ["/api/service-products"],
  });

  const applyProductMutation = useMutation({
    mutationFn: async (productId: string) => {
      return await apiRequest("POST", `/api/service-projects/${projectId}/apply-product`, { productId });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/project-services", projectId] });
      queryClient.invalidateQueries({ queryKey: ["/api/project-tasks", projectId] });
      queryClient.invalidateQueries({ queryKey: ["/api/service-projects", projectId, "items"] });
      setApplyProductOpen(false);
      setSelectedProductId("");
      toast({ title: t.productApplied || "Product applied", description: t.productAppliedDesc || "Services and tasks were added to the project." });
    },
    onError: (e: any) => {
      toast({ title: t.error, description: e.message, variant: "destructive" });
    },
  });

  const svcForm = useForm<ServiceFormValues>({ resolver: zodResolver(serviceSchema), defaultValues: { serviceCatalogId: "", name: "", description: "", pricingMethod: "lump_sum", unitPrice: "0", quantity: "1", unit: "", totalPrice: "0", status: "pending", notes: "" } });
  const billForm = useForm<BillFormValues>({ resolver: zodResolver(billSchema), defaultValues: { description: "", amount: "", category: "", vendor: "", billDate: new Date().toISOString().split("T")[0], dueDate: "", status: "pending", paidDate: "", notes: "" } });
  const procForm = useForm<ProcurementFormValues>({ resolver: zodResolver(procurementSchema), defaultValues: { itemName: "", description: "", quantity: "1", unitPrice: "0", totalPrice: "0", vendor: "", purchaseDate: new Date().toISOString().split("T")[0], deliveryDate: "", status: "ordered", notes: "" } });
  const payForm = useForm<PaymentFormValues>({ resolver: zodResolver(paymentSchema), defaultValues: { milestoneName: "", amount: "", dueDate: "", status: "pending", paidDate: "", notes: "" } });
  const taskForm = useForm<TaskFormValues>({ resolver: zodResolver(taskSchema), defaultValues: { name: "", description: "", duration: "1", dependencies: "", status: "pending" } });

  function makeMutation(endpoint: string, qk: string[], method: "POST" | "PATCH" | "DELETE", closeFn: () => void) {
    return useMutation({
      mutationFn: async (data: any) => {
        if (method === "DELETE") { await apiRequest("DELETE", endpoint + "/" + data.id); return; }
        const url = data._editId ? `${endpoint}/${data._editId}` : endpoint;
        const m = data._editId ? "PATCH" : "POST";
        const { _editId, ...body } = data;
        return await apiRequest(m, url, body);
      },
      onSuccess: () => {
        queryClient.invalidateQueries({ queryKey: qk });
        closeFn();
        toast({ title: t.saved || "Saved", description: t.changesSaved || "Changes saved successfully" });
      },
      onError: (e: any) => {
        toast({ title: t.error, description: e.message || "Operation failed", variant: "destructive" });
      },
    });
  }

  const svcMut = makeMutation("/api/project-services", ["/api/project-services", projectId], "POST", () => { setSvcOpen(false); setEditSvc(null); svcForm.reset(); });
  const billMut = makeMutation("/api/project-bills", ["/api/project-bills", projectId], "POST", () => { setBillOpen(false); setEditBill(null); billForm.reset(); });
  const procMut = makeMutation("/api/project-procurements", ["/api/project-procurements", projectId], "POST", () => { setProcOpen(false); setEditProc(null); procForm.reset(); });
  const payMut = makeMutation("/api/payment-schedules", ["/api/payment-schedules", projectId], "POST", () => { setPayOpen(false); setEditPay(null); payForm.reset(); });
  const taskMut = makeMutation("/api/project-tasks", ["/api/project-tasks", projectId], "POST", () => { setTaskOpen(false); setEditTask(null); taskForm.reset(); });

  const deleteMutation = useMutation({
    mutationFn: async ({ type, id }: { type: string; id: string }) => {
      await apiRequest("DELETE", `/api/${type}/${id}`);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/project-services", projectId] });
      queryClient.invalidateQueries({ queryKey: ["/api/project-bills", projectId] });
      queryClient.invalidateQueries({ queryKey: ["/api/project-procurements", projectId] });
      queryClient.invalidateQueries({ queryKey: ["/api/payment-schedules", projectId] });
      queryClient.invalidateQueries({ queryKey: ["/api/project-tasks", projectId] });
      setDelItem(null);
      toast({ title: t.delete, description: t.itemDeletedSuccessfully || "Item deleted" });
    },
    onError: (e: any) => { toast({ title: t.error, description: e.message, variant: "destructive" }); },
  });

  const autoGenMut = useMutation({
    mutationFn: async () => {
      return await apiRequest("POST", "/api/payment-schedules/auto-generate", { projectId, installments: parseInt(installments) });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/payment-schedules", projectId] });
      setAutoGenOpen(false);
      toast({ title: t.scheduleGenerated || "Schedule Generated", description: t.paymentScheduleGenerated || "Payment schedule auto-generated" });
    },
    onError: (e: any) => { toast({ title: t.error, description: e.message, variant: "destructive" }); },
  });

  const taskStatusMut = useMutation({
    mutationFn: async ({ id, status }: { id: string; status: string }) => {
      return await apiRequest("PATCH", `/api/project-tasks/${id}`, { status });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/project-tasks"] });
      toast({ title: t.saved || "Saved", description: t.taskStatusUpdated || "Task status updated" });
    },
    onError: (e: any) => { toast({ title: t.error, description: e.message, variant: "destructive" }); },
  });

  const svcStatusMut = useMutation({
    mutationFn: async ({ id, status }: { id: string; status: string }) =>
      apiRequest("PATCH", `/api/project-services/${id}`, { status }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/project-services", projectId] });
      toast({ title: t.saved || "Saved", description: (t as any).serviceStatusUpdated || "Service status updated" });
    },
    onError: (e: any) => { toast({ title: t.error, description: e.message, variant: "destructive" }); },
  });

  const procStatusMut = useMutation({
    mutationFn: async ({ id, status }: { id: string; status: string }) =>
      apiRequest("PATCH", `/api/project-procurements/${id}`, { status }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/project-procurements", projectId] });
      toast({ title: t.saved || "Saved", description: (t as any).procurementStatusUpdated || "Procurement status updated" });
    },
    onError: (e: any) => { toast({ title: t.error, description: e.message, variant: "destructive" }); },
  });

  const cpmMut = useMutation({
    mutationFn: async () => {
      return await apiRequest("POST", "/api/project-tasks/calculate-cpm", { projectId });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/project-tasks", projectId] });
      toast({ title: t.cpmCalculated || "CPM Calculated", description: t.criticalPathUpdated || "Critical path has been updated" });
    },
    onError: (e: any) => { toast({ title: t.error, description: e.message, variant: "destructive" }); },
  });

  const generateQuotationMutation = useMutation({
    mutationFn: async () => {
      if (!project) throw new Error("Project not loaded");
      if (!services || services.length === 0) {
        throw new Error(
          t.addServicesBeforeQuotation ||
            "Please add at least one service to this project before generating a quotation."
        );
      }
      const items = services.map((s) => {
        const qty = parseFloat(s.quantity || "0") || 0;
        const unitPrice = parseFloat(s.unitPrice || "0") || 0;
        const total = parseFloat(s.totalPrice || "0") || qty * unitPrice;
        return {
          serviceId: s.serviceCatalogId || s.id,
          name: s.name,
          quantity: qty,
          unitPrice,
          total,
        };
      });
      const subtotal = items.reduce((sum, it) => sum + it.total, 0);
      const vatRate = 15;
      const vatAmount = subtotal * (vatRate / 100);
      const totalAmount = subtotal + vatAmount;
      const quotationNumber = `QT-${project.projectNumber || "PRJ"}-${Date.now()
        .toString()
        .slice(-5)}`;
      const payload = {
        quotationNumber,
        projectId: project.id,
        clientName: project.clientName || "",
        clientPhone: project.clientPhone || null,
        clientEmail: project.clientEmail || null,
        description: project.name || null,
        items,
        subtotal: subtotal.toFixed(2),
        vatRate: String(vatRate),
        vatAmount: vatAmount.toFixed(2),
        totalAmount: totalAmount.toFixed(2),
        status: "draft",
        validUntil: null,
        notes: null,
      };
      return await apiRequest("POST", "/api/quotations", payload);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/quotations"] });
      toast({
        title: t.quotationGenerated || "Quotation Generated",
        description:
          t.quotationGeneratedDesc ||
          "A draft quotation was created from this project's services.",
      });
      setLocation("/quotations");
    },
    onError: (e: any) => {
      toast({ title: t.error, description: e.message, variant: "destructive" });
    },
  });

  const approveMutation = useMutation({
    mutationFn: async () => apiRequest("POST", `/api/service-projects/${projectId}/approve`, { lang: pdfLang }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/service-projects", projectId] });
      queryClient.invalidateQueries({ queryKey: ["/api/service-projects"] });
      queryClient.invalidateQueries({ queryKey: ["/api/customers"] });
      toast({ title: t.projectApproved || "Project approved", description: t.projectApprovedDesc || "Customer linked and dossier attached." });
    },
    onError: (e: any) => toast({ title: t.error, description: e.message, variant: "destructive" }),
  });

  const declineMutation = useMutation({
    mutationFn: async (reason: string) => apiRequest("POST", `/api/service-projects/${projectId}/decline`, { reason }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/service-projects", projectId] });
      queryClient.invalidateQueries({ queryKey: ["/api/service-projects"] });
      setDeclineOpen(false);
      setDeclineReason("");
      toast({ title: t.projectDeclined || "Project declined" });
    },
    onError: (e: any) => toast({ title: t.error, description: e.message, variant: "destructive" }),
  });

  const lifecycleMutation = useMutation({
    mutationFn: async (to: "in_progress" | "finished") =>
      apiRequest("POST", `/api/service-projects/${projectId}/lifecycle`, { to }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/service-projects", projectId] });
      queryClient.invalidateQueries({ queryKey: ["/api/service-projects"] });
      toast({ title: t.lifecycleUpdated || "Lifecycle updated" });
    },
    onError: (e: any) => toast({ title: t.error, description: e.message, variant: "destructive" }),
  });

  function onCatalogSelect(catId: string) {
    const item = catalog.find(c => c.id === catId);
    if (item) {
      svcForm.setValue("name", item.name);
      svcForm.setValue("description", item.description || "");
      svcForm.setValue("pricingMethod", item.pricingMethod);
      svcForm.setValue("unitPrice", item.unitPrice);
      svcForm.setValue("unit", item.unit || "");
      recalcServiceTotal();
    }
  }

  function recalcServiceTotal() {
    const up = parseFloat(svcForm.getValues("unitPrice") || "0");
    const qty = parseFloat(svcForm.getValues("quantity") || "1");
    svcForm.setValue("totalPrice", (up * qty).toFixed(2));
  }
  function recalcProcTotal() {
    const up = parseFloat(procForm.getValues("unitPrice") || "0");
    const qty = parseFloat(procForm.getValues("quantity") || "1");
    procForm.setValue("totalPrice", (up * qty).toFixed(2));
  }

  function openEditSvc(s: ProjectServiceItem) {
    setEditSvc(s);
    svcForm.reset({ serviceCatalogId: s.serviceCatalogId || "", name: s.name, description: s.description || "", pricingMethod: s.pricingMethod, unitPrice: s.unitPrice, quantity: s.quantity, unit: s.unit || "", totalPrice: s.totalPrice, status: s.status, notes: s.notes || "" });
    setSvcOpen(true);
  }
  function openEditBill(b: ProjectBillItem) {
    setEditBill(b);
    billForm.reset({ description: b.description, amount: b.amount, category: b.category || "", vendor: b.vendor || "", billDate: b.billDate?.split("T")[0] || "", dueDate: b.dueDate?.split("T")[0] || "", status: b.status, paidDate: b.paidDate?.split("T")[0] || "", notes: b.notes || "" });
    setBillOpen(true);
  }
  function openEditProc(p: ProjectProcurementItem) {
    setEditProc(p);
    procForm.reset({ itemName: p.itemName, description: p.description || "", quantity: p.quantity, unitPrice: p.unitPrice, totalPrice: p.totalPrice, vendor: p.vendor || "", purchaseDate: p.purchaseDate?.split("T")[0] || "", deliveryDate: p.deliveryDate?.split("T")[0] || "", status: p.status, notes: p.notes || "" });
    setProcOpen(true);
  }
  async function downloadPaymentInvoice(p: PaymentScheduleItem) {
    if (!p.invoiceId) return;
    try {
      const res = await fetch(`/api/invoices/${p.invoiceId}/download`, { credentials: "include" });
      if (!res.ok) throw new Error("Failed to download invoice");
      const blob = await res.blob();
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = `invoice-${p.milestoneName.replace(/\s+/g, "-")}.pdf`;
      document.body.appendChild(a);
      a.click();
      a.remove();
      window.URL.revokeObjectURL(url);
    } catch (e: any) {
      toast({ title: t.error || "Error", description: e.message, variant: "destructive" });
    }
  }

  async function sendInvoiceWhatsApp(p: PaymentScheduleItem) {
    if (!project?.clientPhone || !p.invoiceId) return;
    try {
      const { formatPhoneForWhatsApp, openWhatsAppWithMessage, createWhatsAppAttachmentMessage } = await import("@/lib/whatsapp");
      // Trigger PDF download for manual attach
      await downloadPaymentInvoice(p);
      const message = createWhatsAppAttachmentMessage({
        invoiceNumber: `${project.projectNumber}-${p.id.substring(0, 8)}`,
        total: parseFloat(p.amount).toFixed(2),
        paymentMethod: "Project Payment",
        restaurantName: project.name,
        customerName: project.clientName,
      });
      formatPhoneForWhatsApp(project.clientPhone);
      openWhatsAppWithMessage(project.clientPhone, message);
    } catch (e: any) {
      toast({ title: t.error || "Error", description: e.message, variant: "destructive" });
    }
  }

  function openEditPay(p: PaymentScheduleItem) {
    setEditPay(p);
    payForm.reset({ milestoneName: p.milestoneName, amount: p.amount, dueDate: p.dueDate?.split("T")[0] || "", status: p.status, paidDate: p.paidDate?.split("T")[0] || "", notes: p.notes || "" });
    setPayOpen(true);
  }
  function openEditTask(tk: ProjectTaskItem) {
    setEditTask(tk);
    taskForm.reset({ name: tk.name, description: tk.description || "", duration: String(tk.duration), dependencies: (tk.dependencies || []).join(","), status: tk.status });
    setTaskOpen(true);
  }

  function submitSvc(data: ServiceFormValues) {
    const body: any = { ...data, projectId, serviceCatalogId: data.serviceCatalogId || null, description: data.description || null, unit: data.unit || null, notes: data.notes || null };
    if (editSvc) body._editId = editSvc.id;
    svcMut.mutate(body);
  }
  function submitBill(data: BillFormValues) {
    const body: any = { ...data, projectId, category: data.category || null, vendor: data.vendor || null, dueDate: data.dueDate || null, paidDate: data.paidDate || null, notes: data.notes || null };
    if (editBill) body._editId = editBill.id;
    billMut.mutate(body);
  }
  function submitProc(data: ProcurementFormValues) {
    const body: any = { ...data, projectId, description: data.description || null, vendor: data.vendor || null, deliveryDate: data.deliveryDate || null, notes: data.notes || null };
    if (editProc) body._editId = editProc.id;
    procMut.mutate(body);
  }
  function submitPay(data: PaymentFormValues) {
    const body: any = { ...data, projectId, dueDate: data.dueDate || null, paidDate: data.paidDate || null, notes: data.notes || null };
    if (editPay) body._editId = editPay.id;
    payMut.mutate(body);
  }
  function submitTask(data: TaskFormValues) {
    const deps = data.dependencies ? data.dependencies.split(",").map(d => d.trim()).filter(Boolean) : [];
    const body: any = { name: data.name, description: data.description || null, duration: parseInt(data.duration), dependencies: deps.length ? deps : null, status: data.status, projectId };
    if (editTask) body._editId = editTask.id;
    taskMut.mutate(body);
  }

  const totalServicesOnly = services.reduce((s, x) => s + parseFloat(x.totalPrice || "0"), 0);
  const totalItemsSelling = projectItemsList.reduce((s, it) => s + (parseFloat((it.sellingPrice as any) || "0") || 0), 0);
  const totalServices = totalServicesOnly + totalItemsSelling;
  const totalBills = bills.reduce((s, x) => s + parseFloat(x.amount || "0"), 0);
  const totalProc = procurements.reduce((s, x) => s + parseFloat(x.totalPrice || "0"), 0);
  const totalPayments = payments.reduce((s, x) => s + parseFloat(x.amount || "0"), 0);
  const paidPayments = payments.filter(p => p.status === "paid").reduce((s, x) => s + parseFloat(x.amount || "0"), 0);
  const paymentProgress = totalPayments > 0 ? (paidPayments / totalPayments) * 100 : 0;

  if (isLoading) return <div className="flex items-center justify-center p-12"><p>{t.loading}...</p></div>;
  if (!project) return <div className="flex flex-col items-center justify-center p-12"><p>{t.projectNotFound || "Project not found"}</p><Link href="/service-projects"><Button variant="outline" className="mt-4" data-testid="button-back-to-projects"><ArrowLeft className="h-4 w-4 mr-2" />{t.backToProjects || "Back to Projects"}</Button></Link></div>;

  return (
    <div className={`${layout.padding} ${layout.spaceY}`}>
      <div className={`flex ${layout.isMobile ? "flex-col gap-3" : "items-center justify-between gap-4"}`}>
        <div className="flex items-center gap-3 flex-wrap">
          <Link href="/service-projects">
            <Tooltip>
              <TooltipTrigger asChild>
                <Button variant="ghost" size="icon" aria-label={t.back || "Back"} data-testid="button-back">
                  <ArrowLeft className="h-5 w-5" />
                </Button>
              </TooltipTrigger>
              <TooltipContent>{t.back || "Back"}</TooltipContent>
            </Tooltip>
          </Link>
          <div>
            <h1 className={`${layout.text2Xl} font-bold`} data-testid="text-project-name">{project.name}</h1>
            <div className="flex items-center gap-2 mt-1 flex-wrap">
              <Badge variant="outline" data-testid="badge-project-number">{project.projectNumber}</Badge>
              <Badge variant={statusBadge(project.status)} className={statusClass(project.status)} data-testid="badge-project-status">
                {project.status.replace("_", " ")}
              </Badge>
              <Badge variant={priorityBadge(project.priority)} className={priorityClass(project.priority)} data-testid="badge-project-priority">
                {project.priority}
              </Badge>
            </div>
          </div>
        </div>
        <div className="flex items-center gap-2 flex-wrap">
          <Button
            onClick={() => { setActiveTab("services"); setEditSvc(null); svcForm.reset(); setSvcOpen(true); }}
            data-testid="button-add-project-service"
          >
            <Plus className="h-4 w-4 mr-2" />
            {t.addProjectService || "Add Project Service"}
          </Button>
          {canDownloadProjectPdf && (
          <Button
            variant="outline"
            onClick={async () => {
              try {
                const res = await fetch(`/api/service-projects/${params.id}/agreement-pdf?lang=${pdfLang}`, { credentials: "include" });
                if (!res.ok) {
                  let msg = "Failed to generate agreement";
                  try { const j = await res.json(); msg = j.message || msg; } catch {}
                  toast({ title: t.error || "Error", description: msg, variant: "destructive" });
                  return;
                }
                const blob = await res.blob();
                const url = URL.createObjectURL(blob);
                const a = document.createElement("a");
                a.href = url;
                a.download = `agreement-${project.projectNumber}.pdf`;
                document.body.appendChild(a);
                a.click();
                a.remove();
                URL.revokeObjectURL(url);
              } catch (e: any) {
                toast({ title: t.error || "Error", description: e.message, variant: "destructive" });
              }
            }}
            data-testid="button-generate-agreement"
          >
            <FileSignature className="h-4 w-4 mr-2" />
            {t.generateAgreement || "Generate Agreement"}
          </Button>
          )}
          <Button
            variant="outline"
            onClick={() => generateQuotationMutation.mutate()}
            disabled={generateQuotationMutation.isPending}
            data-testid="button-generate-quotation"
          >
            <FileText className="h-4 w-4 mr-2" />
            {generateQuotationMutation.isPending
              ? (t.generating || "Generating...")
              : (t.generateQuotation || "Generate Quotation")}
          </Button>
          {canDownloadProjectPdf && (
          <Button
            variant="outline"
            onClick={() => window.open(`/api/service-projects/${params.id}/dossier-pdf?lang=${pdfLang}`, '_blank')}
            data-testid="button-download-dossier"
          >
            <Download className="h-4 w-4 mr-2" />
            {t.downloadDossier || "Download Dossier"}
          </Button>
          )}
        </div>
      </div>

      {project && (
        <Card data-testid="card-decision-center">
          <CardHeader className="pb-3">
            <CardTitle className="text-lg flex items-center gap-2">
              <ShieldCheck className="h-5 w-5" />
              {t.decisionCenter || "Decision Center"}
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            <div className="flex items-center gap-2 flex-wrap">
              <span className="text-sm text-muted-foreground">{t.approval || "Approval"}:</span>
              {(() => {
                const ap = project.approvalStatus || 'pending';
                const variant = ap === 'approved' ? 'default' : ap === 'declined' ? 'destructive' : 'secondary';
                const cls = ap === 'approved' ? 'bg-green-600 text-white' : '';
                return <Badge variant={variant as any} className={cls} data-testid="badge-approval-status">{ap}</Badge>;
              })()}
              <span className="text-sm text-muted-foreground ml-3">{t.lifecycle || "Lifecycle"}:</span>
              {(() => {
                const lc = project.lifecycleStatus || 'not_started';
                const variant = lc === 'finished' ? 'default' : lc === 'in_progress' ? 'default' : 'outline';
                const cls = lc === 'finished' ? 'bg-green-600 text-white' : lc === 'in_progress' ? 'bg-blue-600 text-white' : '';
                return <Badge variant={variant as any} className={cls} data-testid="badge-lifecycle-status">{lc.replace('_', ' ')}</Badge>;
              })()}
              {project.declineReason && (
                <span className="text-xs text-destructive" data-testid="text-decline-reason">
                  {t.reason || "Reason"}: {project.declineReason}
                </span>
              )}
            </div>
            <div className="flex items-center gap-2 flex-wrap">
              {(project.approvalStatus || 'pending') === 'pending' && (
                <>
                  <Button
                    onClick={() => approveMutation.mutate()}
                    disabled={!canDecide || approveMutation.isPending}
                    data-testid="button-approve-project"
                    className="bg-green-600 hover:bg-green-700 text-white border-green-700"
                  >
                    <ShieldCheck className="h-4 w-4 mr-2" />
                    {approveMutation.isPending ? (t.approving || "Approving…") : (t.approve || "Approve")}
                  </Button>
                  <Button
                    variant="destructive"
                    onClick={() => setDeclineOpen(true)}
                    disabled={!canDecide}
                    data-testid="button-decline-project"
                  >
                    <ShieldX className="h-4 w-4 mr-2" />
                    {t.decline || "Decline"}
                  </Button>
                </>
              )}
              {project.approvalStatus === 'approved' && (project.lifecycleStatus || 'not_started') === 'not_started' && (
                <Button
                  onClick={() => lifecycleMutation.mutate('in_progress')}
                  disabled={!canDecide || lifecycleMutation.isPending}
                  data-testid="button-start-project"
                >
                  <PlayCircle className="h-4 w-4 mr-2" />
                  {t.startProject || "Start Project"}
                </Button>
              )}
              {project.approvalStatus === 'approved' && project.lifecycleStatus === 'in_progress' && (
                <Button
                  onClick={() => lifecycleMutation.mutate('finished')}
                  disabled={!canDecide || lifecycleMutation.isPending}
                  data-testid="button-finish-project"
                  className="bg-green-600 hover:bg-green-700 text-white border-green-700"
                >
                  <CheckSquare className="h-4 w-4 mr-2" />
                  {t.finishProject || "Finish Project"}
                </Button>
              )}
              {project.approvalStatus === 'approved' && project.lifecycleStatus === 'finished' && (
                <span className="text-sm text-muted-foreground" data-testid="text-project-finished">
                  {t.projectFinishedMsg || "Project finished."}
                </span>
              )}
              {project.customerId && (
                <Link href="/customers">
                  <Button variant="outline" size="sm" data-testid="button-view-linked-customer">
                    <User className="h-4 w-4 mr-2" />
                    {t.viewLinkedCustomer || "View Linked Customer"}
                  </Button>
                </Link>
              )}
            </div>
          </CardContent>
        </Card>
      )}

      <Tabs value={activeTab} onValueChange={setActiveTab}>
        <TabsList className={`${layout.isMobile ? "grid grid-cols-3 w-full" : "grid grid-cols-6 w-full"}`}>
          <TabsTrigger value="overview" data-testid="tab-overview">{t.overview || "Overview"}</TabsTrigger>
          <TabsTrigger value="services" data-testid="tab-services">{t.services || "Services"}</TabsTrigger>
          <TabsTrigger value="bills" data-testid="tab-bills">{t.bills || "Bills"}</TabsTrigger>
          <TabsTrigger value="procurements" data-testid="tab-procurements">{t.procurements || "Procurements"}</TabsTrigger>
          <TabsTrigger value="payments" data-testid="tab-payments">{t.payments || "Payments"}</TabsTrigger>
          <TabsTrigger value="tasks" data-testid="tab-tasks">{t.tasks || "Tasks"}</TabsTrigger>
        </TabsList>

        <TabsContent value="overview" className="space-y-6">
          <div className={`grid ${layout.gap} ${layout.gridCols({ desktop: 4, tablet: 2, mobile: 2 })}`}>
            <Card><CardContent className="pt-4 pb-4"><div className="flex items-center gap-2 mb-1"><Layers className="h-4 w-4 text-muted-foreground" /><p className="text-sm text-muted-foreground">{t.totalServicesValue || "Services Value"}</p></div><p className="text-2xl font-bold" data-testid="text-total-services">{fmtNum(String(totalServices))} SAR</p></CardContent></Card>
            <Card><CardContent className="pt-4 pb-4"><div className="flex items-center gap-2 mb-1"><Receipt className="h-4 w-4 text-muted-foreground" /><p className="text-sm text-muted-foreground">{t.totalBillsAmount || "Total Bills"}</p></div><p className="text-2xl font-bold" data-testid="text-total-bills">{fmtNum(String(totalBills))} SAR</p></CardContent></Card>
            <Card><CardContent className="pt-4 pb-4"><div className="flex items-center gap-2 mb-1"><ShoppingCart className="h-4 w-4 text-muted-foreground" /><p className="text-sm text-muted-foreground">{t.totalProcurements || "Procurements"}</p></div><p className="text-2xl font-bold" data-testid="text-total-procurements">{fmtNum(String(totalProc))} SAR</p></CardContent></Card>
            <Card><CardContent className="pt-4 pb-4"><div className="flex items-center gap-2 mb-1"><CreditCard className="h-4 w-4 text-muted-foreground" /><p className="text-sm text-muted-foreground">{t.paymentProgress || "Payment Progress"}</p></div><p className="text-2xl font-bold" data-testid="text-payment-progress">{paymentProgress.toFixed(0)}%</p><Progress value={paymentProgress} className="mt-2" /></CardContent></Card>
          </div>
          <div className={`grid ${layout.gap} ${layout.gridCols({ desktop: 2, tablet: 1, mobile: 1 })}`}>
            <Card>
              <CardHeader className="pb-3"><CardTitle className="text-lg">{t.clientInfo || "Client Information"}</CardTitle></CardHeader>
              <CardContent className="space-y-2">
                <div className="flex items-center gap-2"><User className="h-4 w-4 text-muted-foreground" /><span data-testid="text-client-name">{project.clientName}</span></div>
                {project.clientPhone && <div className="flex items-center gap-2"><Phone className="h-4 w-4 text-muted-foreground" /><span>{project.clientPhone}</span></div>}
                {project.clientEmail && <div className="flex items-center gap-2"><Mail className="h-4 w-4 text-muted-foreground" /><span>{project.clientEmail}</span></div>}
                {project.location && <div className="flex items-center gap-2"><MapPin className="h-4 w-4 text-muted-foreground" /><span>{project.location}</span></div>}
              </CardContent>
            </Card>
            <Card>
              <CardHeader className="pb-3"><CardTitle className="text-lg">{t.projectDetails || "Project Details"}</CardTitle></CardHeader>
              <CardContent className="space-y-2">
                <div className="flex items-center gap-2"><Calendar className="h-4 w-4 text-muted-foreground" /><span>{t.startDate || "Start"}: {fmtDate(project.startDate)}</span></div>
                <div className="flex items-center gap-2"><Calendar className="h-4 w-4 text-muted-foreground" /><span>{t.endDate || "End"}: {fmtDate(project.endDate)}</span></div>
                <div className="flex items-center gap-2"><DollarSign className="h-4 w-4 text-muted-foreground" /><span>{t.estimatedBudget || "Budget"}: {fmtNum(project.estimatedBudget)} SAR</span></div>
                {project.actualCost && <div className="flex items-center gap-2"><DollarSign className="h-4 w-4 text-muted-foreground" /><span>{t.actualCost || "Actual"}: {fmtNum(project.actualCost)} SAR</span></div>}
                {project.description && <div className="pt-2 border-t"><p className="text-sm text-muted-foreground">{project.description}</p></div>}
                {project.notes && <div className="pt-2 border-t"><p className="text-sm text-muted-foreground">{project.notes}</p></div>}
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        <TabsContent value="services" className="space-y-4">
          <div className="flex items-center justify-between gap-2 flex-wrap">
            <h2 className="text-lg font-semibold">{t.services || "Services"}</h2>
            <div className="flex items-center gap-2 flex-wrap">
            <Button variant="outline" onClick={() => { setSelectedProductId(""); setApplyProductOpen(true); }} data-testid="button-apply-product"><Plus className="h-4 w-4 mr-2" />{t.applyProduct || "Apply Product"}</Button>
            <Button onClick={() => { setEditSvc(null); svcForm.reset(); setSvcOpen(true); }} data-testid="button-add-service"><Plus className="h-4 w-4 mr-2" />{t.addService || "Add Service"}</Button>
          </div>
          </div>
          {services.length === 0 ? <p className="text-muted-foreground text-center py-8">{t.noServices || "No services added yet"}</p> : (
            <div className="space-y-3">
              {services.map(s => (
                <Card key={s.id} data-testid={`card-service-${s.id}`}>
                  <CardContent className="pt-4 pb-4">
                    <div className="flex items-center justify-between gap-2 flex-wrap">
                      <div className="min-w-0">
                        <p className="font-semibold truncate" data-testid={`text-service-name-${s.id}`}>{s.name}</p>
                        <p className="text-sm text-muted-foreground">{pricingLabels[s.pricingMethod] || s.pricingMethod} · {s.quantity} {s.unit || ""}</p>
                      </div>
                      <div className="flex items-center gap-2 shrink-0">
                        <Badge variant={statusBadge(s.status)} className={statusClass(s.status)}>{s.status}</Badge>
                        <span className="font-semibold">{fmtNum(s.totalPrice)} SAR</span>
                        {s.status === "pending" && (
                          <Button variant="outline" size="sm" onClick={() => svcStatusMut.mutate({ id: s.id, status: "in_progress" })} disabled={svcStatusMut.isPending} data-testid={`button-start-service-${s.id}`}>
                            <PlayCircle className="h-4 w-4 mr-1" />{(t as any).start || "Start"}
                          </Button>
                        )}
                        {s.status === "in_progress" && (
                          <Button variant="outline" size="sm" onClick={() => svcStatusMut.mutate({ id: s.id, status: "completed" })} disabled={svcStatusMut.isPending} data-testid={`button-complete-service-${s.id}`}>
                            <CheckSquare className="h-4 w-4 mr-1" />{(t as any).complete || "Complete"}
                          </Button>
                        )}
                        {s.status === "completed" && (
                          <Button variant="ghost" size="sm" onClick={() => svcStatusMut.mutate({ id: s.id, status: "pending" })} disabled={svcStatusMut.isPending} data-testid={`button-reopen-service-${s.id}`}>
                            {(t as any).reopen || "Reopen"}
                          </Button>
                        )}
                        <Tooltip>
                          <TooltipTrigger asChild>
                            <Button variant="ghost" size="icon" aria-label={t.edit} onClick={() => openEditSvc(s)} data-testid={`button-edit-service-${s.id}`}><Edit className="h-4 w-4" /></Button>
                          </TooltipTrigger>
                          <TooltipContent>{t.edit}</TooltipContent>
                        </Tooltip>
                        <Tooltip>
                          <TooltipTrigger asChild>
                            <Button variant="ghost" size="icon" aria-label={t.delete} onClick={() => setDelItem({ type: "project-services", id: s.id, name: s.name })} data-testid={`button-delete-service-${s.id}`}><Trash2 className="h-4 w-4" /></Button>
                          </TooltipTrigger>
                          <TooltipContent>{t.delete}</TooltipContent>
                        </Tooltip>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              ))}
              <div className="flex justify-end pt-2 border-t"><p className="font-bold">{t.total}: {fmtNum(String(totalServices))} SAR</p></div>
            </div>
          )}
        </TabsContent>

        <TabsContent value="bills" className="space-y-4">
          <div className="flex items-center justify-between gap-2 flex-wrap">
            <h2 className="text-lg font-semibold">{t.bills || "Bills"}</h2>
            <Button onClick={() => { setEditBill(null); billForm.reset({ description: "", amount: "", category: "", vendor: "", billDate: new Date().toISOString().split("T")[0], dueDate: "", status: "pending", paidDate: "", notes: "" }); setBillOpen(true); }} data-testid="button-add-bill"><Plus className="h-4 w-4 mr-2" />{t.addBill || "Add Bill"}</Button>
          </div>
          {bills.length === 0 ? <p className="text-muted-foreground text-center py-8">{t.noBills || "No bills added yet"}</p> : (
            <div className="space-y-3">
              {bills.map(b => (
                <Card key={b.id} data-testid={`card-bill-${b.id}`}>
                  <CardContent className="pt-4 pb-4">
                    <div className="flex items-center justify-between gap-2 flex-wrap">
                      <div className="min-w-0">
                        <p className="font-semibold truncate">{b.description}</p>
                        <p className="text-sm text-muted-foreground">{b.vendor || "-"} · {fmtDate(b.billDate)}</p>
                      </div>
                      <div className="flex items-center gap-2 shrink-0">
                        <Badge variant={statusBadge(b.status)} className={statusClass(b.status)}>{b.status}</Badge>
                        <span className="font-semibold">{fmtNum(b.amount)} SAR</span>
                        <Tooltip>
                          <TooltipTrigger asChild>
                            <Button variant="ghost" size="icon" aria-label={t.edit} onClick={() => openEditBill(b)} data-testid={`button-edit-bill-${b.id}`}><Edit className="h-4 w-4" /></Button>
                          </TooltipTrigger>
                          <TooltipContent>{t.edit}</TooltipContent>
                        </Tooltip>
                        <Tooltip>
                          <TooltipTrigger asChild>
                            <Button variant="ghost" size="icon" aria-label={t.delete} onClick={() => setDelItem({ type: "project-bills", id: b.id, name: b.description })} data-testid={`button-delete-bill-${b.id}`}><Trash2 className="h-4 w-4" /></Button>
                          </TooltipTrigger>
                          <TooltipContent>{t.delete}</TooltipContent>
                        </Tooltip>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              ))}
              <div className="flex justify-end pt-2 border-t"><p className="font-bold">{t.total}: {fmtNum(String(totalBills))} SAR</p></div>
            </div>
          )}
        </TabsContent>

        <TabsContent value="procurements" className="space-y-4">
          <div className="flex items-center justify-between gap-2 flex-wrap">
            <h2 className="text-lg font-semibold">{t.procurements || "Procurements"}</h2>
            <Button onClick={() => { setEditProc(null); procForm.reset({ itemName: "", description: "", quantity: "1", unitPrice: "0", totalPrice: "0", vendor: "", purchaseDate: new Date().toISOString().split("T")[0], deliveryDate: "", status: "ordered", notes: "" }); setProcOpen(true); }} data-testid="button-add-procurement"><Plus className="h-4 w-4 mr-2" />{t.addProcurement || "Add Procurement"}</Button>
          </div>
          {procurements.length === 0 ? <p className="text-muted-foreground text-center py-8">{t.noProcurements || "No procurements added yet"}</p> : (
            <div className="space-y-3">
              {procurements.map(p => (
                <Card key={p.id} data-testid={`card-procurement-${p.id}`}>
                  <CardContent className="pt-4 pb-4">
                    <div className="flex items-center justify-between gap-2 flex-wrap">
                      <div className="min-w-0">
                        <p className="font-semibold truncate">{p.itemName}</p>
                        <p className="text-sm text-muted-foreground">{p.vendor || "-"} · Qty: {p.quantity}</p>
                      </div>
                      <div className="flex items-center gap-2 shrink-0">
                        <Badge variant={statusBadge(p.status)} className={statusClass(p.status)}>{p.status}</Badge>
                        <span className="font-semibold">{fmtNum(p.totalPrice)} SAR</span>
                        {p.status === "ordered" && (
                          <Button variant="outline" size="sm" onClick={() => procStatusMut.mutate({ id: p.id, status: "received" })} disabled={procStatusMut.isPending} data-testid={`button-receive-procurement-${p.id}`}>
                            <PackageCheck className="h-4 w-4 mr-1" />{(t as any).receive || "Receive"}
                          </Button>
                        )}
                        {p.status === "received" && (
                          <Button variant="outline" size="sm" onClick={() => procStatusMut.mutate({ id: p.id, status: "completed" })} disabled={procStatusMut.isPending} data-testid={`button-complete-procurement-${p.id}`}>
                            <CheckSquare className="h-4 w-4 mr-1" />{(t as any).complete || "Complete"}
                          </Button>
                        )}
                        {(p.status === "completed" || p.status === "cancelled") && (
                          <Button variant="ghost" size="sm" onClick={() => procStatusMut.mutate({ id: p.id, status: "ordered" })} disabled={procStatusMut.isPending} data-testid={`button-reopen-procurement-${p.id}`}>
                            {(t as any).reopen || "Reopen"}
                          </Button>
                        )}
                        <Tooltip>
                          <TooltipTrigger asChild>
                            <Button variant="ghost" size="icon" aria-label={t.edit} onClick={() => openEditProc(p)} data-testid={`button-edit-procurement-${p.id}`}><Edit className="h-4 w-4" /></Button>
                          </TooltipTrigger>
                          <TooltipContent>{t.edit}</TooltipContent>
                        </Tooltip>
                        <Tooltip>
                          <TooltipTrigger asChild>
                            <Button variant="ghost" size="icon" aria-label={t.delete} onClick={() => setDelItem({ type: "project-procurements", id: p.id, name: p.itemName })} data-testid={`button-delete-procurement-${p.id}`}><Trash2 className="h-4 w-4" /></Button>
                          </TooltipTrigger>
                          <TooltipContent>{t.delete}</TooltipContent>
                        </Tooltip>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              ))}
              <div className="flex justify-end pt-2 border-t"><p className="font-bold">{t.total}: {fmtNum(String(totalProc))} SAR</p></div>
            </div>
          )}
        </TabsContent>

        <TabsContent value="payments" className="space-y-4">
          <div className="flex items-center justify-between gap-2 flex-wrap">
            <h2 className="text-lg font-semibold">{t.payments || "Payments"}</h2>
            <div className="flex gap-2 flex-wrap">
              <Button variant="outline" onClick={() => setAutoGenOpen(true)} data-testid="button-auto-generate"><Zap className="h-4 w-4 mr-2" />{t.autoGenerate || "Auto-Generate"}</Button>
              <Button onClick={() => { setEditPay(null); payForm.reset(); setPayOpen(true); }} data-testid="button-add-payment"><Plus className="h-4 w-4 mr-2" />{t.addPayment || "Add Payment"}</Button>
            </div>
          </div>
          <Card><CardContent className="pt-4 pb-4">
            <div className="flex items-center justify-between gap-2 mb-2">
              <span className="text-sm text-muted-foreground">{t.paid || "Paid"}: {fmtNum(String(paidPayments))} / {fmtNum(String(totalPayments))} SAR</span>
              <span className="text-sm font-semibold">{paymentProgress.toFixed(0)}%</span>
            </div>
            <Progress value={paymentProgress} data-testid="progress-payments" />
          </CardContent></Card>
          {payments.length === 0 ? <p className="text-muted-foreground text-center py-8">{t.noPayments || "No payment schedules yet"}</p> : (
            <div className="space-y-3">
              {payments.map(p => (
                <Card key={p.id} data-testid={`card-payment-${p.id}`}>
                  <CardContent className="pt-4 pb-4">
                    <div className="flex items-center justify-between gap-2 flex-wrap">
                      <div className="min-w-0">
                        <p className="font-semibold truncate">{p.milestoneName}</p>
                        <p className="text-sm text-muted-foreground">{t.dueDate || "Due"}: {fmtDate(p.dueDate)}</p>
                      </div>
                      <div className="flex items-center gap-2 shrink-0 flex-wrap">
                        <Badge variant={statusBadge(p.status)} className={statusClass(p.status)}>{p.status}</Badge>
                        <span className="font-semibold">{fmtNum(p.amount)} SAR</span>
                        {p.status === "paid" && p.invoiceId && (
                          <>
                            <Button variant="outline" size="sm" onClick={() => downloadPaymentInvoice(p)} data-testid={`button-download-invoice-${p.id}`}>
                              <Download className="h-4 w-4 mr-1" />{t.downloadInvoice || "Invoice"}
                            </Button>
                            {project?.clientPhone && (
                              <Button variant="outline" size="sm" onClick={() => sendInvoiceWhatsApp(p)} data-testid={`button-whatsapp-${p.id}`}>
                                <MessageCircle className="h-4 w-4 mr-1" />WhatsApp
                              </Button>
                            )}
                          </>
                        )}
                        <Tooltip>
                          <TooltipTrigger asChild>
                            <Button variant="ghost" size="icon" aria-label={t.edit} onClick={() => openEditPay(p)} data-testid={`button-edit-payment-${p.id}`}><Edit className="h-4 w-4" /></Button>
                          </TooltipTrigger>
                          <TooltipContent>{t.edit}</TooltipContent>
                        </Tooltip>
                        <Tooltip>
                          <TooltipTrigger asChild>
                            <Button variant="ghost" size="icon" aria-label={t.delete} onClick={() => setDelItem({ type: "payment-schedules", id: p.id, name: p.milestoneName })} data-testid={`button-delete-payment-${p.id}`}><Trash2 className="h-4 w-4" /></Button>
                          </TooltipTrigger>
                          <TooltipContent>{t.delete}</TooltipContent>
                        </Tooltip>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          )}
        </TabsContent>

        <TabsContent value="tasks" className="space-y-4">
          <div className="flex items-center justify-between gap-2 flex-wrap">
            <h2 className="text-lg font-semibold">{t.tasks || "Tasks"}</h2>
            <div className="flex gap-2 flex-wrap">
              <Button variant="outline" onClick={() => cpmMut.mutate()} disabled={cpmMut.isPending} data-testid="button-calculate-cpm">
                <AlertTriangle className="h-4 w-4 mr-2" />{t.calculateCriticalPath || "Calculate CPM"}
              </Button>
              <Button variant="outline" onClick={() => setDecisionToolsOpen(true)} disabled={tasks.length === 0} data-testid="button-decision-tools">
                <Lightbulb className="h-4 w-4 mr-2" />{t.decisionTools || "Decision Tools"}
              </Button>
              <Button onClick={() => { setEditTask(null); taskForm.reset(); setTaskOpen(true); }} data-testid="button-add-task"><Plus className="h-4 w-4 mr-2" />{t.addTask || "Add Task"}</Button>
            </div>
          </div>
          {tasks.length === 0 ? <p className="text-muted-foreground text-center py-8">{t.noTasks || "No tasks added yet"}</p> : (
            <div className="space-y-3">
              {tasks.map(tk => (
                <Card key={tk.id} className={tk.isCritical ? "border-2 border-red-500" : ""} data-testid={`card-task-${tk.id}`}>
                  <CardContent className="pt-4 pb-4">
                    <div className="flex items-center justify-between gap-2 flex-wrap">
                      <div className="min-w-0 flex-1">
                        <div className="flex items-center gap-2">
                          <p className="font-semibold truncate" data-testid={`text-task-name-${tk.id}`}>{tk.name}</p>
                          {tk.isCritical && <Badge variant="destructive">{t.critical || "Critical"}</Badge>}
                        </div>
                        <p className="text-sm text-muted-foreground">{t.duration || "Duration"}: {tk.duration} {t.days || "days"}</p>
                        {(tk.earlyStart !== null) && (
                          <div className="flex gap-4 text-xs text-muted-foreground mt-1 flex-wrap">
                            <span>ES: {tk.earlyStart}</span><span>EF: {tk.earlyFinish}</span>
                            <span>LS: {tk.lateStart}</span><span>LF: {tk.lateFinish}</span>
                            <span>{t.slack || "Slack"}: {tk.slack}</span>
                          </div>
                        )}
                        {tk.earlyStart !== null && tk.earlyFinish !== null && (
                          <div className="mt-2 h-4 rounded-md relative bg-muted overflow-visible">
                            <div
                              className={`absolute h-full rounded-md ${tk.isCritical ? "bg-red-500" : "bg-primary"}`}
                              style={{
                                left: `${((tk.earlyStart || 0) / Math.max(...tasks.map(t2 => t2.lateFinish || t2.earlyFinish || 1), 1)) * 100}%`,
                                width: `${((tk.duration) / Math.max(...tasks.map(t2 => t2.lateFinish || t2.earlyFinish || 1), 1)) * 100}%`,
                                minWidth: "8px",
                              }}
                            />
                          </div>
                        )}
                      </div>
                      <div className="flex items-center gap-2 shrink-0">
                        <Badge variant={statusBadge(tk.status)} className={statusClass(tk.status)}>{tk.status.replace("_", " ")}</Badge>
                        {tk.status === "pending" && (
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => taskStatusMut.mutate({ id: tk.id, status: "in_progress" })}
                            disabled={taskStatusMut.isPending}
                            data-testid={`button-start-task-${tk.id}`}
                          >
                            <PlayCircle className="h-4 w-4 mr-1" />{t.start || "Start"}
                          </Button>
                        )}
                        {tk.status === "in_progress" && (
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => taskStatusMut.mutate({ id: tk.id, status: "completed" })}
                            disabled={taskStatusMut.isPending}
                            data-testid={`button-complete-task-${tk.id}`}
                          >
                            <CheckSquare className="h-4 w-4 mr-1" />{t.complete || "Complete"}
                          </Button>
                        )}
                        {tk.status === "completed" && (
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => taskStatusMut.mutate({ id: tk.id, status: "pending" })}
                            disabled={taskStatusMut.isPending}
                            data-testid={`button-reopen-task-${tk.id}`}
                          >
                            {t.reopen || "Reopen"}
                          </Button>
                        )}
                        <Tooltip>
                          <TooltipTrigger asChild>
                            <Button variant="ghost" size="icon" aria-label={t.edit} onClick={() => openEditTask(tk)} data-testid={`button-edit-task-${tk.id}`}><Edit className="h-4 w-4" /></Button>
                          </TooltipTrigger>
                          <TooltipContent>{t.edit}</TooltipContent>
                        </Tooltip>
                        <Tooltip>
                          <TooltipTrigger asChild>
                            <Button variant="ghost" size="icon" aria-label={t.delete} onClick={() => setDelItem({ type: "project-tasks", id: tk.id, name: tk.name })} data-testid={`button-delete-task-${tk.id}`}><Trash2 className="h-4 w-4" /></Button>
                          </TooltipTrigger>
                          <TooltipContent>{t.delete}</TooltipContent>
                        </Tooltip>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          )}
        </TabsContent>
      </Tabs>

      {/* Decision Tools Dialog */}
      <Dialog open={decisionToolsOpen} onOpenChange={setDecisionToolsOpen}>
        <DialogContent className="max-w-3xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <Lightbulb className="h-5 w-5 text-primary" />
              {t.decisionTools || "Decision Tools"}
            </DialogTitle>
            <DialogDescription>
              {t.decisionToolsDesc || "Insights to help you decide what to do next on this project."}
            </DialogDescription>
          </DialogHeader>
          {(() => {
            const allTasks = tasks;
            const byId = new Map(allTasks.map(tk => [tk.id, tk]));
            const isDone = (s: string) => s === "completed" || s === "done";
            const isActive = (s: string) => s === "in_progress" || s === "active";
            const cpmReady = allTasks.some(tk => tk.earlyStart !== null);

            const projectDuration = allTasks.reduce(
              (m, tk) => Math.max(m, tk.lateFinish ?? tk.earlyFinish ?? 0),
              0,
            );
            const doneCount = allTasks.filter(tk => isDone(tk.status)).length;
            const pctComplete = allTasks.length ? Math.round((doneCount / allTasks.length) * 100) : 0;

            const critical = allTasks.filter(tk => tk.isCritical);
            const criticalRemaining = critical.filter(tk => !isDone(tk.status));

            const ready = allTasks
              .filter(tk => !isDone(tk.status) && !isActive(tk.status))
              .filter(tk => (tk.dependencies ?? []).every(d => {
                const dep = byId.get(d);
                return !dep || isDone(dep.status);
              }))
              .sort((a, b) => (a.slack ?? 999) - (b.slack ?? 999));

            const blocked = allTasks
              .filter(tk => !isDone(tk.status))
              .filter(tk => (tk.dependencies ?? []).some(d => {
                const dep = byId.get(d);
                return dep && !isDone(dep.status);
              }));

            const atRisk = allTasks
              .filter(tk => !isDone(tk.status) && !tk.isCritical)
              .filter(tk => (tk.slack ?? 999) <= 2 && (tk.slack ?? 0) > 0)
              .sort((a, b) => (a.slack ?? 0) - (b.slack ?? 0));

            const dependentsCount = new Map<string, number>();
            for (const tk of allTasks) {
              for (const d of tk.dependencies ?? []) {
                dependentsCount.set(d, (dependentsCount.get(d) ?? 0) + 1);
              }
            }
            const bottlenecks = [...allTasks]
              .map(tk => ({ tk, count: dependentsCount.get(tk.id) ?? 0 }))
              .filter(x => x.count >= 2 && !isDone(x.tk.status))
              .sort((a, b) => b.count - a.count)
              .slice(0, 3);

            const recs: string[] = [];
            if (!cpmReady) {
              recs.push(t.recRunCpm || "Run Calculate CPM first so we can see slack, the critical path and what's at risk.");
            } else {
              if (criticalRemaining.length > 0) {
                recs.push(
                  (t.recFocusCritical || "Focus on the critical path — any delay here pushes the whole project finish date.")
                  + " (" + criticalRemaining.map(c => c.name).join(", ") + ")",
                );
              }
              if (ready.length === 0 && blocked.length > 0) {
                recs.push(t.recAllBlocked || "Every remaining task is blocked by an unfinished dependency — unblock at least one to make progress.");
              }
              if (atRisk.length > 0) {
                recs.push(t.recWatchAtRisk || "Watch the at-risk tasks — they have very little slack and could easily become critical.");
              }
              if (bottlenecks.length > 0) {
                recs.push(
                  (t.recBottleneck || "Finishing these tasks unblocks multiple downstream tasks:")
                  + " " + bottlenecks.map(b => `${b.tk.name} (${b.count})`).join(", "),
                );
              }
              if (recs.length === 0) {
                recs.push(t.recOnTrack || "Schedule looks healthy. Keep executing ready tasks in order.");
              }
            }

            return (
              <div className="space-y-4">
                {/* Health summary */}
                <div className="grid gap-3 sm:grid-cols-3">
                  <Card data-testid="card-decision-duration">
                    <CardContent className="pt-4">
                      <div className="flex items-center gap-2 text-muted-foreground text-xs">
                        <Activity className="h-3.5 w-3.5" />
                        {t.projectDuration || "Project Duration"}
                      </div>
                      <p className="text-2xl font-semibold mt-1">{projectDuration} <span className="text-sm font-normal text-muted-foreground">{t.days || "days"}</span></p>
                    </CardContent>
                  </Card>
                  <Card data-testid="card-decision-progress">
                    <CardContent className="pt-4">
                      <div className="flex items-center gap-2 text-muted-foreground text-xs">
                        <CheckCircle className="h-3.5 w-3.5" />
                        {t.completion || "Completion"}
                      </div>
                      <p className="text-2xl font-semibold mt-1">{pctComplete}%</p>
                      <Progress value={pctComplete} className="mt-2 h-1.5" />
                      <p className="text-xs text-muted-foreground mt-1">{doneCount} / {allTasks.length} {t.tasks?.toLowerCase() || "tasks"}</p>
                    </CardContent>
                  </Card>
                  <Card data-testid="card-decision-critical">
                    <CardContent className="pt-4">
                      <div className="flex items-center gap-2 text-muted-foreground text-xs">
                        <AlertTriangle className="h-3.5 w-3.5" />
                        {t.criticalRemaining || "Critical Remaining"}
                      </div>
                      <p className="text-2xl font-semibold mt-1">{criticalRemaining.length}</p>
                      <p className="text-xs text-muted-foreground mt-1">{t.outOf || "out of"} {critical.length} {t.critical?.toLowerCase() || "critical"}</p>
                    </CardContent>
                  </Card>
                </div>

                {/* Recommendations */}
                <Card>
                  <CardHeader className="pb-2">
                    <CardTitle className="text-base flex items-center gap-2">
                      <Lightbulb className="h-4 w-4 text-primary" />
                      {t.recommendations || "Recommendations"}
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    <ul className="space-y-2">
                      {recs.map((r, i) => (
                        <li key={i} className="flex items-start gap-2 text-sm" data-testid={`text-recommendation-${i}`}>
                          <span className="text-primary mt-0.5">•</span>
                          <span>{r}</span>
                        </li>
                      ))}
                    </ul>
                  </CardContent>
                </Card>

                {/* Do next */}
                <Card>
                  <CardHeader className="pb-2">
                    <CardTitle className="text-base flex items-center gap-2">
                      <Target className="h-4 w-4 text-emerald-500" />
                      {t.doNext || "Do Next"}
                      <Badge variant="secondary" className="ml-auto">{ready.length}</Badge>
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    {ready.length === 0 ? (
                      <p className="text-sm text-muted-foreground">{t.noReadyTasks || "Nothing is ready to start — every remaining task has an unfinished dependency."}</p>
                    ) : (
                      <ul className="space-y-2">
                        {ready.slice(0, 5).map(tk => (
                          <li key={tk.id} className="flex items-center justify-between gap-2 text-sm" data-testid={`row-ready-${tk.id}`}>
                            <div className="flex items-center gap-2 min-w-0 flex-1">
                              {tk.isCritical && <Badge variant="destructive" className="shrink-0">{t.critical || "Critical"}</Badge>}
                              <span className="truncate">{tk.name}</span>
                            </div>
                            <span className="text-xs text-muted-foreground shrink-0">
                              {tk.duration}{t.daysShort || "d"} · {t.slack || "Slack"}: {tk.slack ?? "—"}
                            </span>
                            <Button
                              variant="outline"
                              size="sm"
                              onClick={() => taskStatusMut.mutate({ id: tk.id, status: "in_progress" })}
                              disabled={taskStatusMut.isPending}
                              data-testid={`button-start-ready-${tk.id}`}
                            >
                              <PlayCircle className="h-4 w-4 mr-1" />{t.start || "Start"}
                            </Button>
                          </li>
                        ))}
                      </ul>
                    )}
                  </CardContent>
                </Card>

                {/* At risk */}
                <Card>
                  <CardHeader className="pb-2">
                    <CardTitle className="text-base flex items-center gap-2">
                      <AlertTriangle className="h-4 w-4 text-amber-500" />
                      {t.atRisk || "At Risk"}
                      <Badge variant="secondary" className="ml-auto">{atRisk.length}</Badge>
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    {atRisk.length === 0 ? (
                      <p className="text-sm text-muted-foreground">{t.noAtRisk || "No non-critical tasks are close to becoming critical."}</p>
                    ) : (
                      <ul className="space-y-2">
                        {atRisk.slice(0, 5).map(tk => (
                          <li key={tk.id} className="flex items-center justify-between gap-2 text-sm" data-testid={`row-atrisk-${tk.id}`}>
                            <span className="truncate">{tk.name}</span>
                            <span className="text-xs text-amber-600 dark:text-amber-400 shrink-0">
                              {t.slack || "Slack"}: {tk.slack}{t.daysShort || "d"}
                            </span>
                          </li>
                        ))}
                      </ul>
                    )}
                  </CardContent>
                </Card>

                {/* Bottlenecks */}
                <Card>
                  <CardHeader className="pb-2">
                    <CardTitle className="text-base flex items-center gap-2">
                      <GitBranch className="h-4 w-4 text-indigo-500" />
                      {t.bottlenecks || "Bottlenecks"}
                      <Badge variant="secondary" className="ml-auto">{bottlenecks.length}</Badge>
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    {bottlenecks.length === 0 ? (
                      <p className="text-sm text-muted-foreground">{t.noBottlenecks || "No single task is blocking many others."}</p>
                    ) : (
                      <ul className="space-y-2">
                        {bottlenecks.map(b => (
                          <li key={b.tk.id} className="flex items-center justify-between gap-2 text-sm" data-testid={`row-bottleneck-${b.tk.id}`}>
                            <span className="truncate">{b.tk.name}</span>
                            <span className="text-xs text-muted-foreground shrink-0">
                              {t.blocks || "blocks"} {b.count} {t.tasks?.toLowerCase() || "tasks"}
                            </span>
                          </li>
                        ))}
                      </ul>
                    )}
                  </CardContent>
                </Card>
              </div>
            );
          })()}
        </DialogContent>
      </Dialog>

      {/* Service Dialog */}
      <Dialog open={svcOpen} onOpenChange={(o) => { if (!o) { setSvcOpen(false); setEditSvc(null); } else setSvcOpen(true); }}>
        <DialogContent className="max-h-[90vh] overflow-y-auto">
          <DialogHeader><DialogTitle>{editSvc ? t.edit : t.add} {t.service || "Service"}</DialogTitle><DialogDescription>{editSvc ? t.editServiceDesc || "Update service details" : t.addServiceDesc || "Add a new service to this project"}</DialogDescription></DialogHeader>
          <Form {...svcForm}>
            <form onSubmit={svcForm.handleSubmit(submitSvc)} className="space-y-4">
              {catalog.length > 0 && (
                <FormField control={svcForm.control} name="serviceCatalogId" render={({ field }) => (
                  <FormItem><FormLabel>{t.fromCatalog || "From Catalog"}</FormLabel>
                    <Select onValueChange={(v) => { field.onChange(v); onCatalogSelect(v); }} value={field.value}>
                      <FormControl><SelectTrigger data-testid="select-catalog"><SelectValue placeholder={t.selectFromCatalog || "Select from catalog..."} /></SelectTrigger></FormControl>
                      <SelectContent>{catalog.map(c => <SelectItem key={c.id} value={c.id}>{c.name}</SelectItem>)}</SelectContent>
                    </Select><FormMessage /></FormItem>
                )} />
              )}
              <FormField control={svcForm.control} name="name" render={({ field }) => (
                <FormItem><FormLabel>{t.name}</FormLabel><FormControl><Input data-testid="input-service-name" {...field} /></FormControl><FormMessage /></FormItem>
              )} />
              <FormField control={svcForm.control} name="description" render={({ field }) => (
                <FormItem><FormLabel>{t.description}</FormLabel><FormControl><Textarea data-testid="input-service-description" className="resize-none" {...field} /></FormControl><FormMessage /></FormItem>
              )} />
              <div className="grid grid-cols-2 gap-4">
                <FormField control={svcForm.control} name="pricingMethod" render={({ field }) => (
                  <FormItem><FormLabel>{t.pricingMethod || "Pricing Method"}</FormLabel>
                    <Select onValueChange={field.onChange} value={field.value}>
                      <FormControl><SelectTrigger data-testid="select-pricing-method"><SelectValue /></SelectTrigger></FormControl>
                      <SelectContent>
                        <SelectItem value="per_piece">{t.perPiece || "Per Piece"}</SelectItem><SelectItem value="length">{t.lengthUnit || "Length"}</SelectItem>
                        <SelectItem value="area">{t.areaUnit || "Area"}</SelectItem><SelectItem value="hour">{t.hourUnit || "Hour"}</SelectItem>
                        <SelectItem value="lump_sum">{t.lumpSum || "Lump Sum"}</SelectItem>
                      </SelectContent>
                    </Select><FormMessage /></FormItem>
                )} />
                <FormField control={svcForm.control} name="unit" render={({ field }) => (
                  <FormItem><FormLabel>{t.unit || "Unit"}</FormLabel><FormControl><Input data-testid="input-service-unit" {...field} /></FormControl><FormMessage /></FormItem>
                )} />
              </div>
              <div className="grid grid-cols-3 gap-4">
                <FormField control={svcForm.control} name="unitPrice" render={({ field }) => (
                  <FormItem><FormLabel>{t.unitPrice || "Unit Price"}</FormLabel><FormControl><Input data-testid="input-service-unit-price" type="number" {...field} onChange={(e) => { field.onChange(e); setTimeout(recalcServiceTotal, 0); }} /></FormControl><FormMessage /></FormItem>
                )} />
                <FormField control={svcForm.control} name="quantity" render={({ field }) => (
                  <FormItem><FormLabel>{t.quantity || "Quantity"}</FormLabel><FormControl><Input data-testid="input-service-quantity" type="number" {...field} onChange={(e) => { field.onChange(e); setTimeout(recalcServiceTotal, 0); }} /></FormControl><FormMessage /></FormItem>
                )} />
                <FormField control={svcForm.control} name="totalPrice" render={({ field }) => (
                  <FormItem><FormLabel>{t.total}</FormLabel><FormControl><Input data-testid="input-service-total" type="number" {...field} /></FormControl><FormMessage /></FormItem>
                )} />
              </div>
              <FormField control={svcForm.control} name="status" render={({ field }) => (
                <FormItem><FormLabel>{t.status}</FormLabel>
                  <Select onValueChange={field.onChange} value={field.value}>
                    <FormControl><SelectTrigger data-testid="select-service-status"><SelectValue /></SelectTrigger></FormControl>
                    <SelectContent><SelectItem value="pending">{t.pending}</SelectItem><SelectItem value="in_progress">{t.inProgress || "In Progress"}</SelectItem><SelectItem value="completed">{t.completed}</SelectItem></SelectContent>
                  </Select><FormMessage /></FormItem>
              )} />
              <FormField control={svcForm.control} name="notes" render={({ field }) => (
                <FormItem><FormLabel>{t.notes}</FormLabel><FormControl><Textarea data-testid="input-service-notes" className="resize-none" {...field} /></FormControl><FormMessage /></FormItem>
              )} />
              <div className="flex justify-end gap-2">
                <Button type="button" variant="outline" onClick={() => { setSvcOpen(false); setEditSvc(null); }} data-testid="button-cancel-service">{t.cancel}</Button>
                <Button type="submit" disabled={svcMut.isPending} data-testid="button-submit-service">{editSvc ? t.save : t.add}</Button>
              </div>
            </form>
          </Form>
        </DialogContent>
      </Dialog>

      {/* Bill Dialog */}
      <Dialog open={billOpen} onOpenChange={(o) => { if (!o) { setBillOpen(false); setEditBill(null); } else setBillOpen(true); }}>
        <DialogContent className="max-h-[90vh] overflow-y-auto">
          <DialogHeader><DialogTitle>{editBill ? t.edit : t.add} {t.bill || "Bill"}</DialogTitle><DialogDescription>{editBill ? t.editBillDesc || "Update bill details" : t.addBillDesc || "Add a new bill"}</DialogDescription></DialogHeader>
          <Form {...billForm}>
            <form onSubmit={billForm.handleSubmit(submitBill)} className="space-y-4">
              <FormField control={billForm.control} name="description" render={({ field }) => (
                <FormItem><FormLabel>{t.description}</FormLabel><FormControl><Input data-testid="input-bill-description" {...field} /></FormControl><FormMessage /></FormItem>
              )} />
              <div className="grid grid-cols-2 gap-4">
                <FormField control={billForm.control} name="amount" render={({ field }) => (
                  <FormItem><FormLabel>{t.amount}</FormLabel><FormControl><Input data-testid="input-bill-amount" type="number" {...field} /></FormControl><FormMessage /></FormItem>
                )} />
                <FormField control={billForm.control} name="category" render={({ field }) => (
                  <FormItem><FormLabel>{t.category || "Category"}</FormLabel><FormControl><Input data-testid="input-bill-category" {...field} /></FormControl><FormMessage /></FormItem>
                )} />
              </div>
              <FormField control={billForm.control} name="vendor" render={({ field }) => (
                <FormItem><FormLabel>{t.vendor || "Vendor"}</FormLabel><FormControl><Input data-testid="input-bill-vendor" {...field} /></FormControl><FormMessage /></FormItem>
              )} />
              <div className="grid grid-cols-2 gap-4">
                <FormField control={billForm.control} name="billDate" render={({ field }) => (
                  <FormItem><FormLabel>{t.billDate || "Bill Date"}</FormLabel><FormControl><Input data-testid="input-bill-date" type="date" {...field} /></FormControl><FormMessage /></FormItem>
                )} />
                <FormField control={billForm.control} name="dueDate" render={({ field }) => (
                  <FormItem><FormLabel>{t.dueDate || "Due Date"}</FormLabel><FormControl><Input data-testid="input-bill-due-date" type="date" {...field} /></FormControl><FormMessage /></FormItem>
                )} />
              </div>
              <div className="grid grid-cols-2 gap-4">
                <FormField control={billForm.control} name="status" render={({ field }) => (
                  <FormItem><FormLabel>{t.status}</FormLabel>
                    <Select onValueChange={field.onChange} value={field.value}>
                      <FormControl><SelectTrigger data-testid="select-bill-status"><SelectValue /></SelectTrigger></FormControl>
                      <SelectContent><SelectItem value="pending">{t.pending}</SelectItem><SelectItem value="paid">{t.paid || "Paid"}</SelectItem></SelectContent>
                    </Select><FormMessage /></FormItem>
                )} />
                <FormField control={billForm.control} name="paidDate" render={({ field }) => (
                  <FormItem><FormLabel>{t.paidDate || "Paid Date"}</FormLabel><FormControl><Input data-testid="input-bill-paid-date" type="date" {...field} /></FormControl><FormMessage /></FormItem>
                )} />
              </div>
              <FormField control={billForm.control} name="notes" render={({ field }) => (
                <FormItem><FormLabel>{t.notes}</FormLabel><FormControl><Textarea data-testid="input-bill-notes" className="resize-none" {...field} /></FormControl><FormMessage /></FormItem>
              )} />
              <div className="flex justify-end gap-2">
                <Button type="button" variant="outline" onClick={() => { setBillOpen(false); setEditBill(null); }} data-testid="button-cancel-bill">{t.cancel}</Button>
                <Button type="submit" disabled={billMut.isPending} data-testid="button-submit-bill">{editBill ? t.save : t.add}</Button>
              </div>
            </form>
          </Form>
        </DialogContent>
      </Dialog>

      {/* Procurement Dialog */}
      <Dialog open={procOpen} onOpenChange={(o) => { if (!o) { setProcOpen(false); setEditProc(null); } else setProcOpen(true); }}>
        <DialogContent className="max-h-[90vh] overflow-y-auto">
          <DialogHeader><DialogTitle>{editProc ? t.edit : t.add} {t.procurement || "Procurement"}</DialogTitle><DialogDescription>{editProc ? t.editProcurementDesc || "Update procurement details" : t.addProcurementDesc || "Add a new procurement item"}</DialogDescription></DialogHeader>
          <Form {...procForm}>
            <form onSubmit={procForm.handleSubmit(submitProc)} className="space-y-4">
              <FormField control={procForm.control} name="itemName" render={({ field }) => (
                <FormItem><FormLabel>{t.itemName || "Item Name"}</FormLabel><FormControl><Input data-testid="input-procurement-name" {...field} /></FormControl><FormMessage /></FormItem>
              )} />
              <FormField control={procForm.control} name="description" render={({ field }) => (
                <FormItem><FormLabel>{t.description}</FormLabel><FormControl><Textarea data-testid="input-procurement-description" className="resize-none" {...field} /></FormControl><FormMessage /></FormItem>
              )} />
              <div className="grid grid-cols-3 gap-4">
                <FormField control={procForm.control} name="quantity" render={({ field }) => (
                  <FormItem><FormLabel>{t.quantity || "Quantity"}</FormLabel><FormControl><Input data-testid="input-procurement-quantity" type="number" {...field} onChange={(e) => { field.onChange(e); setTimeout(recalcProcTotal, 0); }} /></FormControl><FormMessage /></FormItem>
                )} />
                <FormField control={procForm.control} name="unitPrice" render={({ field }) => (
                  <FormItem><FormLabel>{t.unitPrice || "Unit Price"}</FormLabel><FormControl><Input data-testid="input-procurement-unit-price" type="number" {...field} onChange={(e) => { field.onChange(e); setTimeout(recalcProcTotal, 0); }} /></FormControl><FormMessage /></FormItem>
                )} />
                <FormField control={procForm.control} name="totalPrice" render={({ field }) => (
                  <FormItem><FormLabel>{t.total}</FormLabel><FormControl><Input data-testid="input-procurement-total" type="number" {...field} /></FormControl><FormMessage /></FormItem>
                )} />
              </div>
              <FormField control={procForm.control} name="vendor" render={({ field }) => (
                <FormItem><FormLabel>{t.vendor || "Vendor"}</FormLabel><FormControl><Input data-testid="input-procurement-vendor" {...field} /></FormControl><FormMessage /></FormItem>
              )} />
              <div className="grid grid-cols-2 gap-4">
                <FormField control={procForm.control} name="purchaseDate" render={({ field }) => (
                  <FormItem><FormLabel>{t.purchaseDate || "Purchase Date"}</FormLabel><FormControl><Input data-testid="input-procurement-purchase-date" type="date" {...field} /></FormControl><FormMessage /></FormItem>
                )} />
                <FormField control={procForm.control} name="deliveryDate" render={({ field }) => (
                  <FormItem><FormLabel>{t.deliveryDate || "Delivery Date"}</FormLabel><FormControl><Input data-testid="input-procurement-delivery-date" type="date" {...field} /></FormControl><FormMessage /></FormItem>
                )} />
              </div>
              <FormField control={procForm.control} name="status" render={({ field }) => (
                <FormItem><FormLabel>{t.status}</FormLabel>
                  <Select onValueChange={field.onChange} value={field.value}>
                    <FormControl><SelectTrigger data-testid="select-procurement-status"><SelectValue /></SelectTrigger></FormControl>
                    <SelectContent>
                      <SelectItem value="ordered">{t.ordered || "Ordered"}</SelectItem>
                      <SelectItem value="received">{t.received || "Received"}</SelectItem>
                      <SelectItem value="completed">{t.completed}</SelectItem>
                      <SelectItem value="cancelled">{t.cancelled}</SelectItem>
                    </SelectContent>
                  </Select><FormMessage /></FormItem>
              )} />
              <FormField control={procForm.control} name="notes" render={({ field }) => (
                <FormItem><FormLabel>{t.notes}</FormLabel><FormControl><Textarea data-testid="input-procurement-notes" className="resize-none" {...field} /></FormControl><FormMessage /></FormItem>
              )} />
              <div className="flex justify-end gap-2">
                <Button type="button" variant="outline" onClick={() => { setProcOpen(false); setEditProc(null); }} data-testid="button-cancel-procurement">{t.cancel}</Button>
                <Button type="submit" disabled={procMut.isPending} data-testid="button-submit-procurement">{editProc ? t.save : t.add}</Button>
              </div>
            </form>
          </Form>
        </DialogContent>
      </Dialog>

      {/* Payment Dialog */}
      <Dialog open={payOpen} onOpenChange={(o) => { if (!o) { setPayOpen(false); setEditPay(null); } else setPayOpen(true); }}>
        <DialogContent className="max-h-[90vh] overflow-y-auto">
          <DialogHeader><DialogTitle>{editPay ? t.edit : t.add} {t.payment || "Payment"}</DialogTitle><DialogDescription>{editPay ? t.editPaymentDesc || "Update payment schedule" : t.addPaymentDesc || "Add a payment milestone"}</DialogDescription></DialogHeader>
          <Form {...payForm}>
            <form onSubmit={payForm.handleSubmit(submitPay)} className="space-y-4">
              <FormField control={payForm.control} name="milestoneName" render={({ field }) => (
                <FormItem><FormLabel>{t.milestoneName || "Milestone Name"}</FormLabel><FormControl><Input data-testid="input-payment-milestone" {...field} /></FormControl><FormMessage /></FormItem>
              )} />
              <div className="grid grid-cols-2 gap-4">
                <FormField control={payForm.control} name="amount" render={({ field }) => (
                  <FormItem><FormLabel>{t.amount}</FormLabel><FormControl><Input data-testid="input-payment-amount" type="number" {...field} /></FormControl><FormMessage /></FormItem>
                )} />
                <FormField control={payForm.control} name="dueDate" render={({ field }) => (
                  <FormItem><FormLabel>{t.dueDate || "Due Date"}</FormLabel><FormControl><Input data-testid="input-payment-due-date" type="date" {...field} /></FormControl><FormMessage /></FormItem>
                )} />
              </div>
              <div className="grid grid-cols-2 gap-4">
                <FormField control={payForm.control} name="status" render={({ field }) => (
                  <FormItem><FormLabel>{t.status}</FormLabel>
                    <Select onValueChange={field.onChange} value={field.value}>
                      <FormControl><SelectTrigger data-testid="select-payment-status"><SelectValue /></SelectTrigger></FormControl>
                      <SelectContent>
                        <SelectItem value="pending">{t.pending}</SelectItem>
                        <SelectItem value="invoiced">{t.invoiced || "Invoiced"}</SelectItem>
                        <SelectItem value="paid">{t.paid || "Paid"}</SelectItem>
                        <SelectItem value="overdue">{t.overdue || "Overdue"}</SelectItem>
                      </SelectContent>
                    </Select><FormMessage /></FormItem>
                )} />
                <FormField control={payForm.control} name="paidDate" render={({ field }) => (
                  <FormItem><FormLabel>{t.paidDate || "Paid Date"}</FormLabel><FormControl><Input data-testid="input-payment-paid-date" type="date" {...field} /></FormControl><FormMessage /></FormItem>
                )} />
              </div>
              <FormField control={payForm.control} name="notes" render={({ field }) => (
                <FormItem><FormLabel>{t.notes}</FormLabel><FormControl><Textarea data-testid="input-payment-notes" className="resize-none" {...field} /></FormControl><FormMessage /></FormItem>
              )} />
              <div className="flex justify-end gap-2">
                <Button type="button" variant="outline" onClick={() => { setPayOpen(false); setEditPay(null); }} data-testid="button-cancel-payment">{t.cancel}</Button>
                <Button type="submit" disabled={payMut.isPending} data-testid="button-submit-payment">{editPay ? t.save : t.add}</Button>
              </div>
            </form>
          </Form>
        </DialogContent>
      </Dialog>

      {/* Task Dialog */}
      <Dialog open={taskOpen} onOpenChange={(o) => { if (!o) { setTaskOpen(false); setEditTask(null); } else setTaskOpen(true); }}>
        <DialogContent className="max-h-[90vh] overflow-y-auto">
          <DialogHeader><DialogTitle>{editTask ? t.edit : t.add} {t.task || "Task"}</DialogTitle><DialogDescription>{editTask ? t.editTaskDesc || "Update task details" : t.addTaskDesc || "Add a new task"}</DialogDescription></DialogHeader>
          <Form {...taskForm}>
            <form onSubmit={taskForm.handleSubmit(submitTask)} className="space-y-4">
              <FormField control={taskForm.control} name="name" render={({ field }) => (
                <FormItem><FormLabel>{t.name}</FormLabel><FormControl><Input data-testid="input-task-name" {...field} /></FormControl><FormMessage /></FormItem>
              )} />
              <FormField control={taskForm.control} name="description" render={({ field }) => (
                <FormItem><FormLabel>{t.description}</FormLabel><FormControl><Textarea data-testid="input-task-description" className="resize-none" {...field} /></FormControl><FormMessage /></FormItem>
              )} />
              <div className="grid grid-cols-2 gap-4">
                <FormField control={taskForm.control} name="duration" render={({ field }) => (
                  <FormItem><FormLabel>{t.durationDays || "Duration (days)"}</FormLabel><FormControl><Input data-testid="input-task-duration" type="number" {...field} /></FormControl><FormMessage /></FormItem>
                )} />
                <FormField control={taskForm.control} name="status" render={({ field }) => (
                  <FormItem><FormLabel>{t.status}</FormLabel>
                    <Select onValueChange={field.onChange} value={field.value}>
                      <FormControl><SelectTrigger data-testid="select-task-status"><SelectValue /></SelectTrigger></FormControl>
                      <SelectContent>
                        <SelectItem value="pending">{t.pending}</SelectItem>
                        <SelectItem value="in_progress">{t.inProgress || "In Progress"}</SelectItem>
                        <SelectItem value="completed">{t.completed}</SelectItem>
                      </SelectContent>
                    </Select><FormMessage /></FormItem>
                )} />
              </div>
              {tasks.length > 0 && (
                <FormField control={taskForm.control} name="dependencies" render={({ field }) => (
                  <FormItem><FormLabel>{t.dependencies || "Dependencies"}</FormLabel>
                    <FormControl><Input data-testid="input-task-dependencies" placeholder={t.commaSeparatedIds || "Comma-separated task IDs"} {...field} /></FormControl>
                    <div className="text-xs text-muted-foreground mt-1">
                      {tasks.filter(tk => tk.id !== editTask?.id).map(tk => <span key={tk.id} className="mr-2">{tk.id.slice(0, 8)}: {tk.name}</span>)}
                    </div>
                    <FormMessage /></FormItem>
                )} />
              )}
              <div className="flex justify-end gap-2">
                <Button type="button" variant="outline" onClick={() => { setTaskOpen(false); setEditTask(null); }} data-testid="button-cancel-task">{t.cancel}</Button>
                <Button type="submit" disabled={taskMut.isPending} data-testid="button-submit-task">{editTask ? t.save : t.add}</Button>
              </div>
            </form>
          </Form>
        </DialogContent>
      </Dialog>

      {/* Auto-Generate Payment Dialog */}
      <Dialog open={autoGenOpen} onOpenChange={setAutoGenOpen}>
        <DialogContent>
          <DialogHeader><DialogTitle>{t.autoGenerateSchedule || "Auto-Generate Payment Schedule"}</DialogTitle><DialogDescription>{t.autoGenerateDesc || "Automatically create payment installments based on project budget"}</DialogDescription></DialogHeader>
          <div className="space-y-4">
            <div>
              <label className="text-sm font-medium">{t.numberOfInstallments || "Number of Installments"}</label>
              <Input data-testid="input-installments" type="number" min="1" max="24" value={installments} onChange={(e) => setInstallments(e.target.value)} className="mt-1" />
            </div>
            <div className="flex justify-end gap-2">
              <Button variant="outline" onClick={() => setAutoGenOpen(false)} data-testid="button-cancel-auto-gen">{t.cancel}</Button>
              <Button onClick={() => autoGenMut.mutate()} disabled={autoGenMut.isPending} data-testid="button-confirm-auto-gen">{t.generate || "Generate"}</Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>

      {/* Delete Confirmation */}
      <Dialog open={declineOpen} onOpenChange={(o) => { if (!o) { setDeclineOpen(false); setDeclineReason(""); } else setDeclineOpen(true); }}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>{t.declineProject || "Decline Project"}</DialogTitle>
            <DialogDescription>{t.declineProjectDesc || "Provide a reason. The project will be marked as declined."}</DialogDescription>
          </DialogHeader>
          <Textarea
            value={declineReason}
            onChange={(e) => setDeclineReason(e.target.value)}
            placeholder={t.reason || "Reason"}
            data-testid="input-decline-reason"
          />
          <div className="flex justify-end gap-2">
            <Button variant="outline" onClick={() => { setDeclineOpen(false); setDeclineReason(""); }} data-testid="button-cancel-decline">
              {t.cancel || "Cancel"}
            </Button>
            <Button
              variant="destructive"
              onClick={() => declineMutation.mutate(declineReason.trim())}
              disabled={!canDecide || !declineReason.trim() || declineMutation.isPending}
              data-testid="button-confirm-decline"
            >
              {declineMutation.isPending ? (t.declining || "Declining…") : (t.decline || "Decline")}
            </Button>
          </div>
        </DialogContent>
      </Dialog>

      <AlertDialog open={!!delItem} onOpenChange={(o) => !o && setDelItem(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>{t.confirmDelete}</AlertDialogTitle>
            <AlertDialogDescription>{t.deleteItemConfirm || "Are you sure you want to delete"} "{delItem?.name}"?</AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel data-testid="button-cancel-delete">{t.cancel}</AlertDialogCancel>
            <AlertDialogAction data-testid="button-confirm-delete" onClick={() => delItem && deleteMutation.mutate({ type: delItem.type, id: delItem.id })} className="bg-destructive text-destructive-foreground hover:bg-destructive/90">{t.delete}</AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      <Dialog open={applyProductOpen} onOpenChange={setApplyProductOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>{t.applyProduct || "Apply Product"}</DialogTitle>
            <DialogDescription>{t.selectProductToApply || "Select a product to apply to this project"}</DialogDescription>
          </DialogHeader>
          <div className="space-y-4">
            <Select value={selectedProductId} onValueChange={setSelectedProductId}>
              <SelectTrigger data-testid="select-apply-product"><SelectValue placeholder={t.selectProductToApply || "Select product"} /></SelectTrigger>
              <SelectContent>
                {serviceProducts.filter(p => p.status === "active").map(p => (
                  <SelectItem key={p.id} value={p.id}>{p.name}{p.category ? ` (${p.category})` : ""}</SelectItem>
                ))}
              </SelectContent>
            </Select>
            <div className="flex justify-end gap-2">
              <Button variant="outline" onClick={() => setApplyProductOpen(false)} data-testid="button-cancel-apply-product">{t.cancel}</Button>
              <Button disabled={!selectedProductId || applyProductMutation.isPending} onClick={() => applyProductMutation.mutate(selectedProductId)} data-testid="button-confirm-apply-product">
                {t.applyProduct || "Apply"}
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}
