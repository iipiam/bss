import { useState } from "react";
import { useQuery, useMutation } from "@tanstack/react-query";
import { apiRequest, queryClient } from "@/lib/queryClient";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { useToast } from "@/hooks/use-toast";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import type { Procurement, InsertProcurement } from "@shared/schema";
import { insertProcurementSchema } from "@shared/schema";
import { Plus, Package, Wrench, HardHat, Computer, Calendar, User, AlertCircle, CheckCircle2, Clock, XCircle } from "lucide-react";
import { format } from "date-fns";
import { useLanguage } from "@/contexts/LanguageContext";

const typeIcons = {
  inventory: Package,
  maintenance: Wrench,
  installation: HardHat,
  equipment: Computer,
};

const statusColors = {
  pending: "bg-yellow-500/10 text-yellow-700 dark:text-yellow-400",
  approved: "bg-blue-500/10 text-blue-700 dark:text-blue-400",
  ordered: "bg-purple-500/10 text-purple-700 dark:text-purple-400",
  received: "bg-green-500/10 text-green-700 dark:text-green-400",
  completed: "bg-emerald-500/10 text-emerald-700 dark:text-emerald-400",
  cancelled: "bg-red-500/10 text-red-700 dark:text-red-400",
};

const priorityColors = {
  low: "bg-gray-500/10 text-gray-700 dark:text-gray-400",
  medium: "bg-blue-500/10 text-blue-700 dark:text-blue-400",
  high: "bg-orange-500/10 text-orange-700 dark:text-orange-400",
  urgent: "bg-red-500/10 text-red-700 dark:text-red-400",
};

const statusIcons = {
  pending: Clock,
  approved: CheckCircle2,
  ordered: Package,
  received: CheckCircle2,
  completed: CheckCircle2,
  cancelled: XCircle,
};

export default function ProcurementPage() {
  const { toast } = useToast();
  const { t } = useLanguage();
  const [selectedType, setSelectedType] = useState<string>("all");
  const [selectedStatus, setSelectedStatus] = useState<string>("all-statuses");
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [editingItem, setEditingItem] = useState<Procurement | null>(null);

  const { data: procurements = [], isLoading } = useQuery<Procurement[]>({
    queryKey: [
      "/api/procurement",
      {
        type: selectedType !== "all" ? selectedType : undefined,
        status: selectedStatus !== "all-statuses" ? selectedStatus : undefined,
      },
    ],
    queryFn: async () => {
      const queryParams = new URLSearchParams();
      if (selectedType !== "all") queryParams.set("type", selectedType);
      if (selectedStatus !== "all-statuses") queryParams.set("status", selectedStatus);
      const queryString = queryParams.toString();
      const apiUrl = `/api/procurement${queryString ? `?${queryString}` : ""}`;
      
      const response = await fetch(apiUrl);
      if (!response.ok) throw new Error("Failed to fetch procurement data");
      return response.json();
    },
  });

  const form = useForm<InsertProcurement>({
    resolver: zodResolver(insertProcurementSchema.extend({
      orderDate: insertProcurementSchema.shape.orderDate.optional(),
      expectedDelivery: insertProcurementSchema.shape.expectedDelivery.optional(),
      actualDelivery: insertProcurementSchema.shape.actualDelivery.optional(),
    })),
    defaultValues: {
      type: "inventory",
      title: "",
      description: "",
      supplier: "",
      category: "",
      quantity: 0,
      unitPrice: "",
      totalCost: "",
      status: "pending",
      priority: "medium",
      requestedBy: "",
      approvedBy: "",
      branchId: "",
      notes: "",
    },
  });

  const createMutation = useMutation({
    mutationFn: async (data: InsertProcurement) => {
      await apiRequest("POST", "/api/procurement", data);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/procurement"] });
      toast({ title: t.success, description: t.procurementCreated });
      setIsDialogOpen(false);
      form.reset();
    },
  });

  const updateMutation = useMutation({
    mutationFn: async ({ id, data }: { id: string; data: Partial<InsertProcurement> }) => {
      await apiRequest("PATCH", `/api/procurement/${id}`, data);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/procurement"] });
      toast({ title: t.success, description: t.procurementUpdated });
      setIsDialogOpen(false);
      setEditingItem(null);
      form.reset();
    },
  });

  const deleteMutation = useMutation({
    mutationFn: async (id: string) => {
      await apiRequest("DELETE", `/api/procurement/${id}`);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/procurement"] });
      toast({ title: t.success, description: t.procurementDeleted });
    },
  });

  const handleSubmit = (data: InsertProcurement) => {
    // Convert numeric fields and handle optional fields
    const processedData: any = {
      ...data,
      quantity: data.quantity ? parseInt(data.quantity.toString()) : null,
      unitPrice: data.unitPrice && data.unitPrice.trim() !== "" ? data.unitPrice : null,
      totalCost: data.totalCost && data.totalCost.trim() !== "" ? data.totalCost : "0",
      branchId: data.branchId && data.branchId.trim() !== "" ? data.branchId : null,
    };
    
    if (editingItem) {
      updateMutation.mutate({ id: editingItem.id, data: processedData });
    } else {
      createMutation.mutate(processedData);
    }
  };

  const handleEdit = (item: Procurement) => {
    setEditingItem(item);
    form.reset({
      type: item.type,
      title: item.title,
      description: item.description || "",
      supplier: item.supplier || "",
      category: item.category || "",
      quantity: item.quantity || undefined,
      unitPrice: item.unitPrice || "",
      totalCost: item.totalCost,
      status: item.status,
      priority: item.priority,
      requestedBy: item.requestedBy || "",
      approvedBy: item.approvedBy || "",
      branchId: item.branchId || "",
      notes: item.notes || "",
    });
    setIsDialogOpen(true);
  };

  const handleStatusChange = (id: string, newStatus: string) => {
    updateMutation.mutate({ id, data: { status: newStatus } });
  };

  const stats = {
    total: procurements.length,
    pending: procurements.filter(p => p.status === "pending").length,
    approved: procurements.filter(p => p.status === "approved").length,
    inProgress: procurements.filter(p => ["ordered", "received"].includes(p.status)).length,
    completed: procurements.filter(p => p.status === "completed").length,
  };

  return (
    <div className="p-8 space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold mb-2">Procurement Management</h1>
          <p className="text-muted-foreground">Manage inventory, maintenance, installations, and equipment procurement</p>
        </div>
        <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
          <DialogTrigger asChild>
            <Button onClick={() => { setEditingItem(null); form.reset(); }} data-testid="button-add-procurement">
              <Plus className="h-4 w-4 mr-2" />
              New Request
            </Button>
          </DialogTrigger>
          <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
            <DialogHeader>
              <DialogTitle>{editingItem ? "Edit Procurement" : "New Procurement Request"}</DialogTitle>
            </DialogHeader>
            <Form {...form}>
              <form onSubmit={form.handleSubmit(handleSubmit)} className="space-y-4">
                <div className="grid md:grid-cols-2 gap-4">
                  <FormField
                    control={form.control}
                    name="type"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Type</FormLabel>
                        <Select onValueChange={field.onChange} value={field.value}>
                          <FormControl>
                            <SelectTrigger data-testid="select-type">
                              <SelectValue placeholder="Select type" />
                            </SelectTrigger>
                          </FormControl>
                          <SelectContent>
                            <SelectItem value="inventory">Inventory</SelectItem>
                            <SelectItem value="maintenance">Maintenance</SelectItem>
                            <SelectItem value="installation">Installation</SelectItem>
                            <SelectItem value="equipment">Equipment</SelectItem>
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
                            <SelectTrigger data-testid="select-priority">
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

                <FormField
                  control={form.control}
                  name="title"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Title</FormLabel>
                      <FormControl>
                        <Input placeholder="Enter title" {...field} data-testid="input-title" />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={form.control}
                  name="description"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Description</FormLabel>
                      <FormControl>
                        <Textarea placeholder="Enter description" {...field} value={field.value || ""} data-testid="input-description" />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <div className="grid md:grid-cols-2 gap-4">
                  <FormField
                    control={form.control}
                    name="supplier"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Supplier</FormLabel>
                        <FormControl>
                          <Input placeholder="Supplier name" {...field} value={field.value || ""} data-testid="input-supplier" />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  <FormField
                    control={form.control}
                    name="category"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Category</FormLabel>
                        <FormControl>
                          <Input placeholder="Category" {...field} value={field.value || ""} data-testid="input-category" />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                </div>

                <div className="grid md:grid-cols-3 gap-4">
                  <FormField
                    control={form.control}
                    name="quantity"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Quantity</FormLabel>
                        <FormControl>
                          <Input 
                            type="number" 
                            placeholder="0" 
                            {...field} 
                            value={field.value || ""}
                            onChange={(e) => field.onChange(e.target.value ? parseInt(e.target.value) : undefined)}
                            data-testid="input-quantity" 
                          />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  <FormField
                    control={form.control}
                    name="unitPrice"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Unit Price (SAR)</FormLabel>
                        <FormControl>
                          <Input placeholder="0.00" {...field} value={field.value || ""} data-testid="input-unit-price" />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  <FormField
                    control={form.control}
                    name="totalCost"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Total Cost (SAR)</FormLabel>
                        <FormControl>
                          <Input placeholder="0.00" {...field} data-testid="input-total-cost" />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                </div>

                <div className="grid md:grid-cols-2 gap-4">
                  <FormField
                    control={form.control}
                    name="requestedBy"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Requested By</FormLabel>
                        <FormControl>
                          <Input placeholder="Name" {...field} value={field.value || ""} data-testid="input-requested-by" />
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
                        <FormLabel>Status</FormLabel>
                        <Select onValueChange={field.onChange} value={field.value}>
                          <FormControl>
                            <SelectTrigger data-testid="select-status">
                              <SelectValue placeholder="Select status" />
                            </SelectTrigger>
                          </FormControl>
                          <SelectContent>
                            <SelectItem value="pending">Pending</SelectItem>
                            <SelectItem value="approved">Approved</SelectItem>
                            <SelectItem value="ordered">Ordered</SelectItem>
                            <SelectItem value="received">Received</SelectItem>
                            <SelectItem value="completed">Completed</SelectItem>
                            <SelectItem value="cancelled">Cancelled</SelectItem>
                          </SelectContent>
                        </Select>
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
                      <FormLabel>Notes</FormLabel>
                      <FormControl>
                        <Textarea placeholder="Additional notes" {...field} value={field.value || ""} data-testid="input-notes" />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <div className="flex gap-2 pt-4">
                  <Button type="submit" disabled={createMutation.isPending || updateMutation.isPending} data-testid="button-submit">
                    {createMutation.isPending || updateMutation.isPending ? "Saving..." : editingItem ? "Update" : "Create"}
                  </Button>
                  <Button type="button" variant="outline" onClick={() => { setIsDialogOpen(false); setEditingItem(null); form.reset(); }}>
                    Cancel
                  </Button>
                </div>
              </form>
            </Form>
          </DialogContent>
        </Dialog>
      </div>

      <div className="grid md:grid-cols-5 gap-4">
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-sm font-medium">Total Requests</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.total}</div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-sm font-medium">Pending</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-yellow-600">{stats.pending}</div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-sm font-medium">Approved</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-blue-600">{stats.approved}</div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-sm font-medium">In Progress</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-purple-600">{stats.inProgress}</div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-sm font-medium">Completed</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-green-600">{stats.completed}</div>
          </CardContent>
        </Card>
      </div>

      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <CardTitle>Procurement Requests</CardTitle>
            <div className="flex gap-2">
              <Select value={selectedStatus} onValueChange={setSelectedStatus}>
                <SelectTrigger className="w-40" data-testid="filter-status">
                  <SelectValue placeholder="Filter by status" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all-statuses">All Statuses</SelectItem>
                  <SelectItem value="pending">Pending</SelectItem>
                  <SelectItem value="approved">Approved</SelectItem>
                  <SelectItem value="ordered">Ordered</SelectItem>
                  <SelectItem value="received">Received</SelectItem>
                  <SelectItem value="completed">Completed</SelectItem>
                  <SelectItem value="cancelled">Cancelled</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>
        </CardHeader>
        <CardContent>
          <Tabs value={selectedType} onValueChange={setSelectedType}>
            <TabsList className="mb-4">
              <TabsTrigger value="all" data-testid="tab-all">All</TabsTrigger>
              <TabsTrigger value="inventory" data-testid="tab-inventory">Inventory</TabsTrigger>
              <TabsTrigger value="maintenance" data-testid="tab-maintenance">Maintenance</TabsTrigger>
              <TabsTrigger value="installation" data-testid="tab-installation">Installation</TabsTrigger>
              <TabsTrigger value="equipment" data-testid="tab-equipment">Equipment</TabsTrigger>
            </TabsList>

            {isLoading ? (
              <div className="text-center py-8 text-muted-foreground">Loading...</div>
            ) : procurements.length === 0 ? (
              <div className="text-center py-8 text-muted-foreground">No procurement requests found</div>
            ) : (
              <div className="space-y-4">
                {procurements.map((item) => {
                  const Icon = typeIcons[item.type as keyof typeof typeIcons];
                  const StatusIcon = statusIcons[item.status as keyof typeof statusIcons];
                  
                  return (
                    <Card key={item.id} data-testid={`procurement-${item.id}`}>
                      <CardContent className="p-4">
                        <div className="flex items-start justify-between gap-4">
                          <div className="flex gap-4 flex-1">
                            <div className="p-3 rounded-lg bg-muted">
                              <Icon className="h-6 w-6" />
                            </div>
                            <div className="flex-1 space-y-2">
                              <div className="flex items-start justify-between gap-4">
                                <div>
                                  <h3 className="font-semibold text-lg">{item.title}</h3>
                                  {item.description && (
                                    <p className="text-sm text-muted-foreground mt-1">{item.description}</p>
                                  )}
                                </div>
                                <div className="text-right">
                                  <div className="text-xl font-bold">SAR {item.totalCost}</div>
                                  {item.quantity && item.unitPrice && (
                                    <div className="text-xs text-muted-foreground">
                                      {item.quantity} × SAR {item.unitPrice}
                                    </div>
                                  )}
                                </div>
                              </div>

                              <div className="flex flex-wrap gap-2">
                                <Badge className={statusColors[item.status as keyof typeof statusColors]}>
                                  <StatusIcon className="h-3 w-3 mr-1" />
                                  {item.status}
                                </Badge>
                                <Badge className={priorityColors[item.priority as keyof typeof priorityColors]}>
                                  <AlertCircle className="h-3 w-3 mr-1" />
                                  {item.priority}
                                </Badge>
                                <Badge variant="outline" className="capitalize">
                                  {item.type}
                                </Badge>
                                {item.category && (
                                  <Badge variant="secondary">{item.category}</Badge>
                                )}
                              </div>

                              <div className="grid md:grid-cols-3 gap-4 text-sm">
                                {item.supplier && (
                                  <div className="flex items-center gap-2 text-muted-foreground">
                                    <Package className="h-4 w-4" />
                                    <span>{item.supplier}</span>
                                  </div>
                                )}
                                {item.requestedBy && (
                                  <div className="flex items-center gap-2 text-muted-foreground">
                                    <User className="h-4 w-4" />
                                    <span>{item.requestedBy}</span>
                                  </div>
                                )}
                                {item.expectedDelivery && (
                                  <div className="flex items-center gap-2 text-muted-foreground">
                                    <Calendar className="h-4 w-4" />
                                    <span>Expected: {format(new Date(item.expectedDelivery), "MMM dd, yyyy")}</span>
                                  </div>
                                )}
                              </div>

                              {item.notes && (
                                <div className="text-sm text-muted-foreground bg-muted p-2 rounded">
                                  {item.notes}
                                </div>
                              )}

                              <div className="flex gap-2 pt-2">
                                <Button size="sm" variant="outline" onClick={() => handleEdit(item)} data-testid={`button-edit-${item.id}`}>
                                  Edit
                                </Button>
                                {item.status === "pending" && (
                                  <Button size="sm" variant="outline" onClick={() => handleStatusChange(item.id, "approved")}>
                                    Approve
                                  </Button>
                                )}
                                {item.status === "approved" && (
                                  <Button size="sm" variant="outline" onClick={() => handleStatusChange(item.id, "ordered")}>
                                    Mark as Ordered
                                  </Button>
                                )}
                                {item.status === "ordered" && (
                                  <Button size="sm" variant="outline" onClick={() => handleStatusChange(item.id, "received")}>
                                    Mark as Received
                                  </Button>
                                )}
                                {item.status === "received" && (
                                  <Button size="sm" variant="outline" onClick={() => handleStatusChange(item.id, "completed")}>
                                    Mark as Completed
                                  </Button>
                                )}
                                <Button 
                                  size="sm" 
                                  variant="destructive" 
                                  onClick={() => {
                                    if (confirm("Are you sure you want to delete this procurement request?")) {
                                      deleteMutation.mutate(item.id);
                                    }
                                  }}
                                  data-testid={`button-delete-${item.id}`}
                                >
                                  Delete
                                </Button>
                              </div>
                            </div>
                          </div>
                        </div>
                      </CardContent>
                    </Card>
                  );
                })}
              </div>
            )}
          </Tabs>
        </CardContent>
      </Card>
    </div>
  );
}
