import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Tooltip, TooltipContent, TooltipTrigger } from "@/components/ui/tooltip";
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
  Collapsible,
  CollapsibleContent,
  CollapsibleTrigger,
} from "@/components/ui/collapsible";
import { Badge } from "@/components/ui/badge";
import {
  Plus,
  Search,
  Edit,
  UserCircle,
  Trash2,
  Phone,
  User,
  ChevronDown,
  ShoppingBag,
  Calendar,
  DollarSign,
  Download,
  Briefcase,
  FileText,
} from "lucide-react";
import { useQuery, useMutation } from "@tanstack/react-query";
import { apiRequest, queryClient } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { useLanguage } from "@/contexts/LanguageContext";
import { useDeviceLayout } from "@/lib/mobileLayout";

interface Customer {
  id: string;
  name: string;
  phone: string;
}

interface Order {
  id: number;
  orderNumber: string;
  orderType: string;
  status: string;
  total: string;
  createdAt: string;
  items: Array<{ name: string; quantity: number; price: string }>;
  table?: string;
  customerName?: string;
  customerPhone?: string;
}

type CustomerFormValues = {
  name: string;
  phone: string;
};

interface CustomerProjectRow {
  id: string;
  projectNumber: string;
  name: string;
  status: string;
  approvalStatus?: string | null;
  lifecycleStatus?: string | null;
  totalRevenue?: string | null;
}
interface CustomerDocumentRow {
  id: string;
  fileName: string;
  kind: string;
  mimeType: string;
  createdAt: string;
}

function CustomerExtras({ customerId }: { customerId: string }) {
  const [projOpen, setProjOpen] = useState(false);
  const [docOpen, setDocOpen] = useState(false);
  const { toast } = useToast();
  const { data: projects = [] } = useQuery<CustomerProjectRow[]>({
    queryKey: ["/api/customers", customerId, "projects"],
    enabled: projOpen,
  });
  const { data: documents = [] } = useQuery<CustomerDocumentRow[]>({
    queryKey: ["/api/customers", customerId, "documents"],
    enabled: docOpen,
  });

  async function downloadDoc(docId: string, fileName: string) {
    try {
      const res = await fetch(`/api/customer-documents/${docId}/download`, { credentials: "include" });
      if (!res.ok) throw new Error("Failed to download");
      const blob = await res.blob();
      const url = URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = (fileName || `document-${docId}.pdf`).replace(/\s+/g, "-");
      document.body.appendChild(a);
      a.click();
      a.remove();
      URL.revokeObjectURL(url);
    } catch (e: any) {
      toast({ title: "Error", description: e.message, variant: "destructive" });
    }
  }

  return (
    <>
      <Collapsible open={projOpen} onOpenChange={setProjOpen}>
        <CollapsibleTrigger asChild>
          <Button
            variant="outline"
            size="sm"
            className="w-full justify-between"
            data-testid={`button-view-projects-${customerId}`}
          >
            <div className="flex items-center gap-2">
              <Briefcase className="h-3 w-3" />
              <span>Projects</span>
            </div>
            <ChevronDown className="h-3 w-3" />
          </Button>
        </CollapsibleTrigger>
        <CollapsibleContent className="mt-2 space-y-2">
          {projects.length === 0 ? (
            <p className="text-xs text-muted-foreground italic">No projects</p>
          ) : (
            projects.map((p) => (
              <div
                key={p.id}
                className="p-2 rounded-md bg-muted/50 text-sm"
                data-testid={`project-row-${p.id}`}
              >
                <div className="flex items-center justify-between mb-1 gap-2">
                  <span className="font-mono font-semibold truncate">#{p.projectNumber}</span>
                  <div className="flex items-center gap-1 flex-wrap">
                    {p.approvalStatus && (
                      <Badge
                        variant={(p.approvalStatus === 'approved' ? 'default' : p.approvalStatus === 'declined' ? 'destructive' : 'secondary') as any}
                        className={p.approvalStatus === 'approved' ? 'bg-green-600 text-white' : ''}
                      >
                        {p.approvalStatus}
                      </Badge>
                    )}
                    {p.lifecycleStatus && (
                      <Badge variant="outline">{p.lifecycleStatus.replace('_', ' ')}</Badge>
                    )}
                  </div>
                </div>
                <div className="text-xs text-muted-foreground truncate">{p.name}</div>
              </div>
            ))
          )}
        </CollapsibleContent>
      </Collapsible>

      <Collapsible open={docOpen} onOpenChange={setDocOpen}>
        <CollapsibleTrigger asChild>
          <Button
            variant="outline"
            size="sm"
            className="w-full justify-between"
            data-testid={`button-view-documents-${customerId}`}
          >
            <div className="flex items-center gap-2">
              <FileText className="h-3 w-3" />
              <span>Documents</span>
            </div>
            <ChevronDown className="h-3 w-3" />
          </Button>
        </CollapsibleTrigger>
        <CollapsibleContent className="mt-2 space-y-2">
          {documents.length === 0 ? (
            <p className="text-xs text-muted-foreground italic">No documents</p>
          ) : (
            documents.map((d) => (
              <div
                key={d.id}
                className="p-2 rounded-md bg-muted/50 text-sm flex items-center justify-between gap-2"
                data-testid={`document-row-${d.id}`}
              >
                <div className="min-w-0">
                  <div className="font-medium truncate">{d.fileName}</div>
                  <div className="text-xs text-muted-foreground">
                    {d.kind} · {new Date(d.createdAt).toLocaleDateString()}
                  </div>
                </div>
                <Button
                  variant="ghost"
                  size="icon"
                  onClick={() => downloadDoc(d.id, d.fileName)}
                  data-testid={`button-download-doc-${d.id}`}
                >
                  <Download className="h-4 w-4" />
                </Button>
              </div>
            ))
          )}
        </CollapsibleContent>
      </Collapsible>
    </>
  );
}

export default function Customers() {
  const [searchQuery, setSearchQuery] = useState("");
  const [open, setOpen] = useState(false);
  const [editingCustomer, setEditingCustomer] = useState<Customer | null>(null);
  const [deletingCustomer, setDeletingCustomer] = useState<Customer | null>(
    null,
  );
  const { toast } = useToast();
  const { t } = useLanguage();
  const layout = useDeviceLayout();

  const customerFormSchema = z.object({
    name: z.string().min(1, t.customerNameRequired),
    phone: z.string().min(1, t.phoneNumberRequired),
  });

  const form = useForm<CustomerFormValues>({
    resolver: zodResolver(customerFormSchema),
    defaultValues: {
      name: "",
      phone: "+966 ",
    },
  });

  const { data: customers = [], isLoading } = useQuery<Customer[]>({
    queryKey: ["/api/customers"],
  });

  const { data: orders = [] } = useQuery<Order[]>({
    queryKey: ["/api/orders"],
  });

  const createCustomerMutation = useMutation({
    mutationFn: async (data: CustomerFormValues) => {
      return await apiRequest("POST", "/api/customers", data);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/customers"] });
      setOpen(false);
      form.reset();
      toast({
        title: t.customerCreated,
        description: t.customerCreatedDesc,
      });
    },
    onError: (error: any) => {
      toast({
        title: t.failedToCreateCustomer,
        description: error.message || "Could not create customer",
        variant: "destructive",
      });
    },
  });

  const updateCustomerMutation = useMutation({
    mutationFn: async (data: CustomerFormValues & { id: string }) => {
      return await apiRequest("PATCH", `/api/customers/${data.id}`, {
        name: data.name,
        phone: data.phone,
      });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/customers"] });
      setOpen(false);
      setEditingCustomer(null);
      form.reset();
      toast({
        title: t.customerUpdated,
        description: t.customerUpdatedDesc,
      });
    },
    onError: (error: any) => {
      toast({
        title: t.failedToUpdateCustomer,
        description: error.message || "Could not update customer",
        variant: "destructive",
      });
    },
  });

  const deleteCustomerMutation = useMutation({
    mutationFn: async (id: string) => {
      await apiRequest("DELETE", `/api/customers/${id}`);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/customers"] });
      setDeletingCustomer(null);
      toast({
        title: t.customerDeleted,
        description: t.customerDeletedDesc,
      });
    },
    onError: (error: any) => {
      toast({
        title: t.failedToDeleteCustomer,
        description: error.message || "Could not delete customer",
        variant: "destructive",
      });
    },
  });

  const onSubmit = (data: CustomerFormValues) => {
    if (editingCustomer) {
      updateCustomerMutation.mutate({ ...data, id: editingCustomer.id });
    } else {
      createCustomerMutation.mutate(data);
    }
  };

  const handleEdit = (customer: Customer) => {
    setEditingCustomer(customer);
    form.reset({
      name: customer.name,
      phone: customer.phone,
    });
    setOpen(true);
  };

  const handleOpenChange = (isOpen: boolean) => {
    setOpen(isOpen);
    if (!isOpen) {
      setEditingCustomer(null);
      form.reset();
    }
  };

  const handleCloseDialog = () => {
    setOpen(false);
    setEditingCustomer(null);
    form.reset();
  };

  // Helper function for flexible phone number matching (handles +966 Saudi prefix)
  const phoneMatches = (storedPhone: string, searchQuery: string): boolean => {
    if (!storedPhone || !searchQuery) return false;

    // Normalize both to digits only
    const storedDigits = storedPhone.replace(/\D/g, "");
    const searchDigits = searchQuery.replace(/\D/g, "");

    if (!searchDigits) return false;

    // Check if search matches any part of the stored phone
    if (storedDigits.includes(searchDigits)) return true;

    // Check if adding 966 to search matches
    if (storedDigits.includes(`966${searchDigits}`)) return true;

    // Check if removing 966 from search matches
    if (
      searchDigits.startsWith("966") &&
      storedDigits.includes(searchDigits.substring(3))
    )
      return true;

    // Check if removing leading 0 matches (0501234567 -> 501234567)
    if (
      searchDigits.startsWith("0") &&
      storedDigits.includes(searchDigits.substring(1))
    )
      return true;

    return false;
  };

  const filteredCustomers = customers.filter(
    (customer) =>
      customer.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      phoneMatches(customer.phone, searchQuery),
  );

  const getCustomerOrders = (customer: Customer) => {
    return orders
      .filter(
        (order) =>
          order.customerName === customer.name ||
          order.customerPhone === customer.phone,
      )
      .sort(
        (a, b) =>
          new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime(),
      );
  };

  const handleExport = async () => {
    try {
      const response = await fetch("/api/export/customers");
      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.error || "Export failed");
      }
      const blob = await response.blob();
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = "customers.xlsx";
      document.body.appendChild(a);
      a.click();
      window.URL.revokeObjectURL(url);
      document.body.removeChild(a);
      toast({
        title: t.exportSuccessful,
        description: "Customer data exported to Excel",
      });
    } catch (error) {
      toast({
        title: t.exportFailed,
        description:
          error instanceof Error ? error.message : t.failedToExportCustomers,
        variant: "destructive",
      });
    }
  };

  return (
    <div className={`${layout.padding} ${layout.spaceY}`}>
      <div
        className={`flex ${layout.isMobile ? "flex-col gap-3" : "items-center justify-between"}`}
      >
        <div className="flex items-center gap-2">
          <UserCircle className="h-8 w-8" />
          <h1 className={`${layout.text3Xl} font-bold`}>{t.customers}</h1>
        </div>
        <div className="flex gap-2 flex-wrap">
          <Button
            variant="outline"
            onClick={handleExport}
            data-testid="button-export"
            className={layout.isMobile ? "h-[44px]" : ""}
          >
            <Download className="h-4 w-4 mr-2" />
            Export
          </Button>
          <Dialog open={open} onOpenChange={handleOpenChange}>
            <DialogTrigger asChild>
              <Button
                data-testid="button-add-customer"
                className={layout.isMobile ? "h-[44px]" : ""}
              >
                <Plus className="h-4 w-4 mr-2" />
                {t.add} {t.customers}
              </Button>
            </DialogTrigger>
            <DialogContent>
              <DialogHeader>
                <DialogTitle>
                  {editingCustomer
                    ? `${t.edit} ${t.customers}`
                    : `${t.add} ${t.customers}`}
                </DialogTitle>
                <DialogDescription>
                  {editingCustomer
                    ? "Update customer information"
                    : "Add a new customer to your database"}
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
                        <FormLabel>{t.customerName}</FormLabel>
                        <FormControl>
                          <Input
                            data-testid="input-customer-name"
                            placeholder="Enter customer name"
                            {...field}
                          />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                  <FormField
                    control={form.control}
                    name="phone"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>{t.phone}</FormLabel>
                        <FormControl>
                          <Input
                            data-testid="input-customer-phone"
                            placeholder="+966 5XXXXXXXX"
                            {...field}
                            onChange={(e) => {
                              const val = e.target.value;
                              // Ensure +966 prefix is always present
                              if (!val.startsWith("+966 ")) {
                                field.onChange(
                                  "+966 " + val.replace(/^\+?966?/, ""),
                                );
                              } else {
                                field.onChange(val);
                              }
                            }}
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
                        createCustomerMutation.isPending ||
                        updateCustomerMutation.isPending
                      }
                    >
                      {editingCustomer ? t.save : t.add}
                    </Button>
                  </div>
                </form>
              </Form>
            </DialogContent>
          </Dialog>
        </div>
      </div>

      <div className="relative">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
        <Input
          data-testid="input-search"
          placeholder={`${t.search} ${t.customers.toLowerCase()}...`}
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          className="pl-10"
        />
      </div>

      {isLoading ? (
        <div className="flex items-center justify-center p-12">
          <p>{t.loading}</p>
        </div>
      ) : filteredCustomers.length === 0 ? (
        <div className="flex flex-col items-center justify-center p-12 text-center">
          <UserCircle className="h-16 w-16 text-muted-foreground mb-4" />
          <p className="text-muted-foreground">
            {searchQuery ? "No customers found matching your search" : t.noData}
          </p>
        </div>
      ) : (
        <div
          className={`grid ${layout.gap} ${layout.gridCols({ desktop: 3, tablet: 2, mobile: 1 })}`}
        >
          {filteredCustomers.map((customer) => {
            const customerOrders = getCustomerOrders(customer);
            return (
              <Card
                key={customer.id}
                data-testid={`card-customer-${customer.id}`}
              >
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                  <div className="flex items-center gap-2">
                    <User className="h-4 w-4 text-muted-foreground" />
                    <h3
                      className="font-semibold"
                      data-testid={`text-customer-name-${customer.id}`}
                    >
                      {customer.name}
                    </h3>
                  </div>
                  <div className="flex gap-1">
                    <Tooltip>
                      <TooltipTrigger asChild>
                        <Button
                          variant="ghost"
                          size="icon"
                          aria-label={t.edit}
                          onClick={() => handleEdit(customer)}
                          data-testid={`button-edit-${customer.id}`}
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
                          onClick={() => setDeletingCustomer(customer)}
                          data-testid={`button-delete-${customer.id}`}
                        >
                          <Trash2 className="h-4 w-4" />
                        </Button>
                      </TooltipTrigger>
                      <TooltipContent>{t.delete}</TooltipContent>
                    </Tooltip>
                  </div>
                </CardHeader>
                <CardContent className="space-y-3">
                  <div className="flex items-center gap-2 text-sm text-muted-foreground">
                    <Phone className="h-3 w-3" />
                    <span data-testid={`text-customer-phone-${customer.id}`}>
                      {customer.phone}
                    </span>
                  </div>

                  {customerOrders.length > 0 && (
                    <Collapsible>
                      <CollapsibleTrigger asChild>
                        <Button
                          variant="outline"
                          size="sm"
                          className="w-full justify-between"
                          data-testid={`button-view-orders-${customer.id}`}
                        >
                          <div className="flex items-center gap-2">
                            <ShoppingBag className="h-3 w-3" />
                            <span>
                              {customerOrders.length}{" "}
                              {customerOrders.length === 1 ? "Order" : "Orders"}
                            </span>
                          </div>
                          <ChevronDown className="h-3 w-3" />
                        </Button>
                      </CollapsibleTrigger>
                      <CollapsibleContent className="mt-2 space-y-2">
                        {customerOrders.map((order) => (
                          <div
                            key={order.id}
                            className="p-2 rounded-md bg-muted/50 text-sm"
                            data-testid={`order-${order.id}`}
                          >
                            <div className="flex items-center justify-between mb-1">
                              <span className="font-mono font-semibold">
                                #{order.orderNumber}
                              </span>
                              <Badge
                                variant={
                                  order.status === "Completed"
                                    ? "default"
                                    : "secondary"
                                }
                              >
                                {order.status}
                              </Badge>
                            </div>
                            <div className="flex items-center gap-4 text-xs text-muted-foreground">
                              <div className="flex items-center gap-1">
                                <Calendar className="h-3 w-3" />
                                <span>
                                  {new Date(
                                    order.createdAt,
                                  ).toLocaleDateString()}
                                </span>
                              </div>
                              <div className="flex items-center gap-1">
                                <DollarSign className="h-3 w-3" />
                                <span>
                                  {parseFloat(order.total).toFixed(2)} SAR
                                </span>
                              </div>
                            </div>
                            {order.items.length > 0 && (
                              <div className="mt-1 text-xs text-muted-foreground">
                                {order.items.slice(0, 2).map((item, idx) => (
                                  <div key={idx}>
                                    {item.quantity}x {item.name}
                                  </div>
                                ))}
                                {order.items.length > 2 && (
                                  <div className="italic">
                                    +{order.items.length - 2} more items
                                  </div>
                                )}
                              </div>
                            )}
                          </div>
                        ))}
                      </CollapsibleContent>
                    </Collapsible>
                  )}
                  {customerOrders.length === 0 && (
                    <p className="text-xs text-muted-foreground italic">
                      No orders yet
                    </p>
                  )}

                  <CustomerExtras customerId={customer.id} />
                </CardContent>
              </Card>
            );
          })}
        </div>
      )}

      <AlertDialog
        open={!!deletingCustomer}
        onOpenChange={(open) => !open && setDeletingCustomer(null)}
      >
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>{t.confirmDelete}</AlertDialogTitle>
            <AlertDialogDescription>
              This will permanently delete "{deletingCustomer?.name}". This
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
                deletingCustomer &&
                deleteCustomerMutation.mutate(deletingCustomer.id)
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
