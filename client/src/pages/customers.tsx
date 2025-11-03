import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardHeader } from "@/components/ui/card";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle } from "@/components/ui/alert-dialog";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from "@/components/ui/collapsible";
import { Badge } from "@/components/ui/badge";
import { Plus, Search, Edit, UserCircle, Trash2, Phone, User, ChevronDown, ShoppingBag, Calendar, DollarSign, Download } from "lucide-react";
import { useQuery, useMutation } from "@tanstack/react-query";
import { apiRequest, queryClient } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { useLanguage } from "@/contexts/LanguageContext";

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

const customerFormSchema = z.object({
  name: z.string().min(1, "Customer name is required"),
  phone: z.string().min(1, "Phone number is required"),
});

type CustomerFormValues = z.infer<typeof customerFormSchema>;

export default function Customers() {
  const [searchQuery, setSearchQuery] = useState("");
  const [open, setOpen] = useState(false);
  const [editingCustomer, setEditingCustomer] = useState<Customer | null>(null);
  const [deletingCustomer, setDeletingCustomer] = useState<Customer | null>(null);
  const { toast } = useToast();
  const { t } = useLanguage();

  const form = useForm<CustomerFormValues>({
    resolver: zodResolver(customerFormSchema),
    defaultValues: {
      name: "",
      phone: "",
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
        title: "Customer created",
        description: "The customer has been added successfully.",
      });
    },
    onError: (error: any) => {
      toast({
        title: "Failed to create customer",
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
        title: "Customer updated",
        description: "The customer has been updated successfully.",
      });
    },
    onError: (error: any) => {
      toast({
        title: "Failed to update customer",
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
        title: "Customer deleted",
        description: "The customer has been removed successfully.",
      });
    },
    onError: (error: any) => {
      toast({
        title: "Failed to delete customer",
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

  const filteredCustomers = customers.filter((customer) =>
    customer.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
    customer.phone.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const getCustomerOrders = (customer: Customer) => {
    return orders.filter(order => 
      order.customerName === customer.name || order.customerPhone === customer.phone
    ).sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
  };

  const handleExport = async () => {
    try {
      const response = await fetch('/api/export/customers');
      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.error || 'Export failed');
      }
      const blob = await response.blob();
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = 'customers.xlsx';
      document.body.appendChild(a);
      a.click();
      window.URL.revokeObjectURL(url);
      document.body.removeChild(a);
      toast({
        title: "Export successful",
        description: "Customer data exported to Excel",
      });
    } catch (error) {
      toast({
        title: "Export failed",
        description: error instanceof Error ? error.message : "Failed to export customer data",
        variant: "destructive",
      });
    }
  };

  return (
    <div className="container mx-auto p-6 space-y-6">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <UserCircle className="h-8 w-8" />
          <h1 className="text-3xl font-bold">{t.customers}</h1>
        </div>
        <div className="flex gap-2">
          <Button variant="outline" onClick={handleExport} data-testid="button-export">
            <Download className="h-4 w-4 mr-2" />
            Export
          </Button>
          <Dialog open={open} onOpenChange={handleOpenChange}>
            <DialogTrigger asChild>
              <Button data-testid="button-add-customer">
                <Plus className="h-4 w-4 mr-2" />
                {t.add} {t.customers}
              </Button>
            </DialogTrigger>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>
                {editingCustomer ? `${t.edit} ${t.customers}` : `${t.add} ${t.customers}`}
              </DialogTitle>
              <DialogDescription>
                {editingCustomer
                  ? "Update customer information"
                  : "Add a new customer to your database"}
              </DialogDescription>
            </DialogHeader>
            <Form {...form}>
              <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
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
                          placeholder="+966 XX XXX XXXX"
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
                    disabled={createCustomerMutation.isPending || updateCustomerMutation.isPending}
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
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
          {filteredCustomers.map((customer) => {
            const customerOrders = getCustomerOrders(customer);
            return (
              <Card key={customer.id} data-testid={`card-customer-${customer.id}`}>
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                  <div className="flex items-center gap-2">
                    <User className="h-4 w-4 text-muted-foreground" />
                    <h3 className="font-semibold" data-testid={`text-customer-name-${customer.id}`}>
                      {customer.name}
                    </h3>
                  </div>
                  <div className="flex gap-1">
                    <Button
                      variant="ghost"
                      size="icon"
                      onClick={() => handleEdit(customer)}
                      data-testid={`button-edit-${customer.id}`}
                    >
                      <Edit className="h-4 w-4" />
                    </Button>
                    <Button
                      variant="ghost"
                      size="icon"
                      onClick={() => setDeletingCustomer(customer)}
                      data-testid={`button-delete-${customer.id}`}
                    >
                      <Trash2 className="h-4 w-4" />
                    </Button>
                  </div>
                </CardHeader>
                <CardContent className="space-y-3">
                  <div className="flex items-center gap-2 text-sm text-muted-foreground">
                    <Phone className="h-3 w-3" />
                    <span data-testid={`text-customer-phone-${customer.id}`}>{customer.phone}</span>
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
                            <span>{customerOrders.length} {customerOrders.length === 1 ? 'Order' : 'Orders'}</span>
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
                              <span className="font-mono font-semibold">#{order.orderNumber}</span>
                              <Badge variant={order.status === 'Completed' ? 'default' : 'secondary'}>
                                {order.status}
                              </Badge>
                            </div>
                            <div className="flex items-center gap-4 text-xs text-muted-foreground">
                              <div className="flex items-center gap-1">
                                <Calendar className="h-3 w-3" />
                                <span>{new Date(order.createdAt).toLocaleDateString()}</span>
                              </div>
                              <div className="flex items-center gap-1">
                                <DollarSign className="h-3 w-3" />
                                <span>{parseFloat(order.total).toFixed(2)} SAR</span>
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
                                  <div className="italic">+{order.items.length - 2} more items</div>
                                )}
                              </div>
                            )}
                          </div>
                        ))}
                      </CollapsibleContent>
                    </Collapsible>
                  )}
                  {customerOrders.length === 0 && (
                    <p className="text-xs text-muted-foreground italic">No orders yet</p>
                  )}
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
              This will permanently delete "{deletingCustomer?.name}". This action cannot be undone.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel data-testid="button-cancel-delete">{t.cancel}</AlertDialogCancel>
            <AlertDialogAction
              data-testid="button-confirm-delete"
              onClick={() => deletingCustomer && deleteCustomerMutation.mutate(deletingCustomer.id)}
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
