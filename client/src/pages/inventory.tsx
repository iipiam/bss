import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card } from "@/components/ui/card";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
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
import { Plus, Search, Edit, Trash2, Download, Upload, FileDown } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { useQuery, useMutation } from "@tanstack/react-query";
import { apiRequest, queryClient } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { insertInventoryItemSchema } from "@shared/schema";
import type { InventoryItem } from "@shared/schema";
import { z } from "zod";

const formSchema = insertInventoryItemSchema.extend({
  quantity: z.coerce.number().positive("Quantity must be a positive number"),
});

export default function Inventory() {
  const [searchQuery, setSearchQuery] = useState("");
  const [categoryFilter, setCategoryFilter] = useState("all");
  const [statusFilter, setStatusFilter] = useState("all");
  const [isImporting, setIsImporting] = useState(false);
  const [open, setOpen] = useState(false);
  const [editingItem, setEditingItem] = useState<InventoryItem | null>(null);
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [itemToDelete, setItemToDelete] = useState<InventoryItem | null>(null);
  const { toast } = useToast();

  const form = useForm<z.infer<typeof formSchema>>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      name: "",
      category: "",
      quantity: 0,
      unit: "",
      supplier: "",
      status: "In Stock",
      branchId: null,
    },
  });

  const { data: inventoryItems = [], isLoading } = useQuery<InventoryItem[]>({
    queryKey: ["/api/inventory"],
  });

  const createMutation = useMutation({
    mutationFn: async (data: z.infer<typeof formSchema>) => {
      return await apiRequest("POST", "/api/inventory", {
        ...data,
        quantity: data.quantity.toFixed(2),
      });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/inventory"] });
      toast({
        title: "Item created",
        description: "Inventory item has been added",
      });
      handleCloseDialog();
    },
    onError: (error: Error) => {
      toast({
        title: "Failed to create item",
        description: error.message || "An error occurred while creating the inventory item",
        variant: "destructive",
      });
    },
  });

  const updateMutation = useMutation({
    mutationFn: async ({ id, data }: { id: string; data: z.infer<typeof formSchema> }) => {
      return await apiRequest("PATCH", `/api/inventory/${id}`, {
        ...data,
        quantity: data.quantity.toFixed(2),
      });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/inventory"] });
      toast({
        title: "Item updated",
        description: "Inventory item has been updated",
      });
      handleCloseDialog();
    },
    onError: (error: Error) => {
      toast({
        title: "Failed to update item",
        description: error.message || "An error occurred while updating the inventory item",
        variant: "destructive",
      });
    },
  });

  const deleteMutation = useMutation({
    mutationFn: async (id: string) => {
      await apiRequest("DELETE", `/api/inventory/${id}`);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/inventory"] });
      toast({
        title: "Item deleted",
        description: "Inventory item has been removed",
      });
      setDeleteDialogOpen(false);
      setItemToDelete(null);
    },
  });

  const handleOpenChange = (isOpen: boolean) => {
    setOpen(isOpen);
    if (!isOpen) {
      setEditingItem(null);
      form.reset();
    }
  };

  const handleCloseDialog = () => {
    setOpen(false);
    setEditingItem(null);
    form.reset();
  };

  const handleEditItem = (item: InventoryItem) => {
    const quantity = parseFloat(item.quantity);
    if (isNaN(quantity)) {
      toast({
        title: "Invalid data",
        description: "Unable to edit item - invalid quantity value",
        variant: "destructive",
      });
      return;
    }
    
    setEditingItem(item);
    form.reset({
      name: item.name,
      category: item.category,
      quantity,
      unit: item.unit,
      supplier: item.supplier,
      status: item.status,
      branchId: item.branchId,
    });
    setOpen(true);
  };

  const handleDeleteClick = (item: InventoryItem) => {
    setItemToDelete(item);
    setDeleteDialogOpen(true);
  };

  const confirmDelete = () => {
    if (itemToDelete) {
      deleteMutation.mutate(itemToDelete.id);
    }
  };

  const onSubmit = (data: z.infer<typeof formSchema>) => {
    if (editingItem) {
      updateMutation.mutate({ id: editingItem.id, data });
    } else {
      createMutation.mutate(data);
    }
  };

  const handleExport = async () => {
    try {
      const response = await fetch('/api/export/inventory');
      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.error || 'Export failed');
      }
      const blob = await response.blob();
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = 'inventory.xlsx';
      document.body.appendChild(a);
      a.click();
      window.URL.revokeObjectURL(url);
      document.body.removeChild(a);
      toast({
        title: "Export successful",
        description: "Inventory data exported to Excel",
      });
    } catch (error) {
      toast({
        title: "Export failed",
        description: error instanceof Error ? error.message : "Failed to export inventory data",
        variant: "destructive",
      });
    }
  };

  const handleDownloadTemplate = async () => {
    try {
      const response = await fetch('/api/templates/inventory');
      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.error || 'Template download failed');
      }
      const blob = await response.blob();
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = 'inventory_template.xlsx';
      document.body.appendChild(a);
      a.click();
      window.URL.revokeObjectURL(url);
      document.body.removeChild(a);
      toast({
        title: "Template downloaded",
        description: "Fill in the template and import it",
      });
    } catch (error) {
      toast({
        title: "Download failed",
        description: error instanceof Error ? error.message : "Failed to download template",
        variant: "destructive",
      });
    }
  };

  const handleImport = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    setIsImporting(true);
    const formData = new FormData();
    formData.append('file', file);

    try {
      const response = await fetch('/api/import/inventory', {
        method: 'POST',
        body: formData,
      });
      const result = await response.json();
      
      if (!response.ok) {
        throw new Error(result.error || 'Import failed');
      }
      
      queryClient.invalidateQueries({ queryKey: ["/api/inventory"] });
      toast({
        title: "Import successful",
        description: result.message || "Inventory data imported from Excel",
      });
    } catch (error) {
      toast({
        title: "Import failed",
        description: error instanceof Error ? error.message : "Failed to import inventory data",
        variant: "destructive",
      });
    } finally {
      setIsImporting(false);
      event.target.value = '';
    }
  };

  const filteredItems = inventoryItems.filter(item => {
    const matchesSearch = item.name.toLowerCase().includes(searchQuery.toLowerCase());
    const matchesCategory = categoryFilter === "all" || item.category.toLowerCase() === categoryFilter;
    const matchesStatus = statusFilter === "all" || 
      (statusFilter === "in-stock" && item.status === "In Stock") ||
      (statusFilter === "low-stock" && item.status === "Low Stock") ||
      (statusFilter === "out-of-stock" && item.status === "Out of Stock");
    return matchesSearch && matchesCategory && matchesStatus;
  });

  if (isLoading) {
    return (
      <div className="p-8">
        <h1 className="text-3xl font-bold mb-2">Inventory Management</h1>
        <p className="text-muted-foreground">Loading...</p>
      </div>
    );
  }

  return (
    <div className="p-8 space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold mb-2">Inventory Management</h1>
          <p className="text-muted-foreground">Track and manage your stock levels</p>
        </div>
        <div className="flex gap-2">
          <Button variant="outline" onClick={handleDownloadTemplate} data-testid="button-download-template">
            <FileDown className="h-4 w-4 mr-2" />
            Template
          </Button>
          <Button variant="outline" onClick={handleExport} data-testid="button-export">
            <Download className="h-4 w-4 mr-2" />
            Export
          </Button>
          <Button variant="outline" asChild disabled={isImporting}>
            <label htmlFor="import-inventory" className="cursor-pointer" data-testid="button-import">
              <Upload className="h-4 w-4 mr-2" />
              {isImporting ? "Importing..." : "Import"}
              <input
                id="import-inventory"
                type="file"
                accept=".xlsx,.xls"
                onChange={handleImport}
                className="hidden"
                data-testid="input-import-file"
              />
            </label>
          </Button>
          <Dialog open={open} onOpenChange={handleOpenChange}>
            <DialogTrigger asChild>
              <Button data-testid="button-add-item">
                <Plus className="h-4 w-4 mr-2" />
                Add Item
              </Button>
            </DialogTrigger>
            <DialogContent className="max-w-md">
              <DialogHeader>
                <DialogTitle>{editingItem ? "Edit Inventory Item" : "Add New Inventory Item"}</DialogTitle>
                <DialogDescription>
                  {editingItem ? "Update the inventory item details" : "Add a new item to your inventory"}
                </DialogDescription>
              </DialogHeader>
              <Form {...form}>
                <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
                  <FormField
                    control={form.control}
                    name="name"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Item Name</FormLabel>
                        <FormControl>
                          <Input {...field} placeholder="e.g., Tomatoes" data-testid="input-item-name" />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                  <div className="grid grid-cols-2 gap-4">
                    <FormField
                      control={form.control}
                      name="category"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Category</FormLabel>
                          <Select onValueChange={field.onChange} value={field.value}>
                            <FormControl>
                              <SelectTrigger data-testid="select-item-category">
                                <SelectValue placeholder="Select category" />
                              </SelectTrigger>
                            </FormControl>
                            <SelectContent>
                              <SelectItem value="Vegetables">Vegetables</SelectItem>
                              <SelectItem value="Meat">Meat</SelectItem>
                              <SelectItem value="Dairy">Dairy</SelectItem>
                              <SelectItem value="Grains">Grains</SelectItem>
                              <SelectItem value="Oils">Oils</SelectItem>
                              <SelectItem value="Spices">Spices</SelectItem>
                            </SelectContent>
                          </Select>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                    <FormField
                      control={form.control}
                      name="unit"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Unit</FormLabel>
                          <Select onValueChange={field.onChange} value={field.value}>
                            <FormControl>
                              <SelectTrigger data-testid="select-item-unit">
                                <SelectValue placeholder="Select unit" />
                              </SelectTrigger>
                            </FormControl>
                            <SelectContent>
                              <SelectItem value="kg">kg</SelectItem>
                              <SelectItem value="g">g</SelectItem>
                              <SelectItem value="l">l</SelectItem>
                              <SelectItem value="ml">ml</SelectItem>
                              <SelectItem value="pcs">pcs</SelectItem>
                            </SelectContent>
                          </Select>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                  </div>
                  <FormField
                    control={form.control}
                    name="quantity"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Quantity</FormLabel>
                        <FormControl>
                          <Input {...field} type="number" step="0.01" placeholder="0.00" data-testid="input-item-quantity" />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                  <FormField
                    control={form.control}
                    name="supplier"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Supplier</FormLabel>
                        <FormControl>
                          <Input {...field} placeholder="e.g., ABC Suppliers" data-testid="input-item-supplier" />
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
                            <SelectTrigger data-testid="select-item-status">
                              <SelectValue placeholder="Select status" />
                            </SelectTrigger>
                          </FormControl>
                          <SelectContent>
                            <SelectItem value="In Stock">In Stock</SelectItem>
                            <SelectItem value="Low Stock">Low Stock</SelectItem>
                            <SelectItem value="Out of Stock">Out of Stock</SelectItem>
                          </SelectContent>
                        </Select>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                  <div className="flex justify-end gap-2 pt-4">
                    <Button type="button" variant="outline" onClick={handleCloseDialog} data-testid="button-cancel">
                      Cancel
                    </Button>
                    <Button type="submit" data-testid="button-save-item" disabled={createMutation.isPending || updateMutation.isPending}>
                      {editingItem ? "Update Item" : "Create Item"}
                    </Button>
                  </div>
                </form>
              </Form>
            </DialogContent>
          </Dialog>
        </div>
      </div>

      <Card className="p-6">
        <div className="flex gap-4 mb-6">
          <div className="relative flex-1">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <Input
              placeholder="Search items..."
              className="pl-10"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              data-testid="input-search"
            />
          </div>
          <Select value={categoryFilter} onValueChange={setCategoryFilter}>
            <SelectTrigger className="w-48" data-testid="select-category">
              <SelectValue placeholder="Category" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Categories</SelectItem>
              <SelectItem value="vegetables">Vegetables</SelectItem>
              <SelectItem value="meat">Meat</SelectItem>
              <SelectItem value="dairy">Dairy</SelectItem>
              <SelectItem value="grains">Grains</SelectItem>
              <SelectItem value="oils">Oils</SelectItem>
            </SelectContent>
          </Select>
          <Select value={statusFilter} onValueChange={setStatusFilter}>
            <SelectTrigger className="w-48" data-testid="select-status">
              <SelectValue placeholder="Status" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Status</SelectItem>
              <SelectItem value="in-stock">In Stock</SelectItem>
              <SelectItem value="low-stock">Low Stock</SelectItem>
              <SelectItem value="out-of-stock">Out of Stock</SelectItem>
            </SelectContent>
          </Select>
        </div>

        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Item Name</TableHead>
              <TableHead>Category</TableHead>
              <TableHead>Quantity</TableHead>
              <TableHead>Unit</TableHead>
              <TableHead>Supplier</TableHead>
              <TableHead>Status</TableHead>
              <TableHead className="text-right">Actions</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {filteredItems.map((item) => (
              <TableRow key={item.id} data-testid={`row-item-${item.id}`}>
                <TableCell className="font-medium">{item.name}</TableCell>
                <TableCell>{item.category}</TableCell>
                <TableCell className="font-mono">{parseFloat(item.quantity).toFixed(2)}</TableCell>
                <TableCell>{item.unit}</TableCell>
                <TableCell className="text-muted-foreground">{item.supplier}</TableCell>
                <TableCell>
                  <Badge variant={item.status === "Low Stock" ? "destructive" : "secondary"}>
                    {item.status}
                  </Badge>
                </TableCell>
                <TableCell className="text-right">
                  <div className="flex justify-end gap-2">
                    <Button variant="ghost" size="icon" onClick={() => handleEditItem(item)} data-testid={`button-edit-${item.id}`}>
                      <Edit className="h-4 w-4" />
                    </Button>
                    <Button
                      variant="ghost"
                      size="icon"
                      onClick={() => handleDeleteClick(item)}
                      data-testid={`button-delete-${item.id}`}
                    >
                      <Trash2 className="h-4 w-4 text-destructive" />
                    </Button>
                  </div>
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </Card>

      <AlertDialog open={deleteDialogOpen} onOpenChange={setDeleteDialogOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Are you sure?</AlertDialogTitle>
            <AlertDialogDescription>
              This will permanently delete <strong>{itemToDelete?.name}</strong> from your inventory.
              This action cannot be undone.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel data-testid="button-cancel-delete">Cancel</AlertDialogCancel>
            <AlertDialogAction onClick={confirmDelete} data-testid="button-confirm-delete">
              Delete
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
