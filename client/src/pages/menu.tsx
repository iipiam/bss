import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardFooter, CardHeader } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Switch } from "@/components/ui/switch";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Plus, Search, Edit, UtensilsCrossed } from "lucide-react";
import { useQuery, useMutation } from "@tanstack/react-query";
import { apiRequest, queryClient } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { insertMenuItemSchema, type MenuItem } from "@shared/schema";

// Form schema for UI - only collect basePrice, calculate VAT on submit
const menuFormSchema = insertMenuItemSchema.omit({ 
  price: true,
  vatAmount: true,
  available: true,
  imageUrl: true
}).extend({
  basePrice: z.string().min(1, "Base price is required"),
  description: z.string().min(1, "Description is required"),
});

type MenuFormValues = z.infer<typeof menuFormSchema>;

export default function Menu() {
  const [searchQuery, setSearchQuery] = useState("");
  const [open, setOpen] = useState(false);
  const { toast } = useToast();

  const form = useForm<MenuFormValues>({
    resolver: zodResolver(menuFormSchema),
    defaultValues: {
      name: "",
      description: "",
      category: "",
      basePrice: "",
    },
  });

  const { data: menuItems = [], isLoading } = useQuery<MenuItem[]>({
    queryKey: ["/api/menu"],
  });

  const createMenuItemMutation = useMutation({
    mutationFn: async (data: MenuFormValues) => {
      // Calculate VAT (15% Saudi VAT)
      const basePriceNum = parseFloat(data.basePrice);
      const vatAmount = basePriceNum * 0.15;
      const price = basePriceNum + vatAmount;

      const menuItemData = {
        name: data.name,
        description: data.description,
        category: data.category,
        basePrice: basePriceNum.toFixed(2),
        vatAmount: vatAmount.toFixed(2),
        price: price.toFixed(2),
        available: true,
      };

      return await apiRequest("POST", "/api/menu", menuItemData);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/menu"] });
      setOpen(false);
      form.reset();
      toast({
        title: "Menu item created",
        description: "The menu item has been added successfully.",
      });
    },
    onError: (error: any) => {
      toast({
        title: "Failed to create menu item",
        description: error.message || "Could not create menu item",
        variant: "destructive",
      });
    },
  });

  const toggleAvailabilityMutation = useMutation({
    mutationFn: async ({ id, available }: { id: string; available: boolean }) => {
      await apiRequest("PATCH", `/api/menu/${id}`, { available });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/menu"] });
      toast({
        title: "Menu item updated",
        description: "Availability status has been changed",
      });
    },
  });

  const onSubmit = (data: MenuFormValues) => {
    createMenuItemMutation.mutate(data);
  };

  const filteredItems = menuItems.filter(item =>
    item.name.toLowerCase().includes(searchQuery.toLowerCase())
  );

  if (isLoading) {
    return (
      <div className="p-8">
        <h1 className="text-3xl font-bold mb-2">Menu Management</h1>
        <p className="text-muted-foreground">Loading...</p>
      </div>
    );
  }

  return (
    <div className="p-8 space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold mb-2">Menu Management</h1>
          <p className="text-muted-foreground">Manage your menu items and pricing</p>
        </div>
        <Dialog open={open} onOpenChange={setOpen}>
          <DialogTrigger asChild>
            <Button data-testid="button-add-menu-item">
              <Plus className="h-4 w-4 mr-2" />
              Add Menu Item
            </Button>
          </DialogTrigger>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Add New Menu Item</DialogTitle>
              <DialogDescription>Create a new item for your menu with VAT-inclusive pricing</DialogDescription>
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
                        <Input
                          {...field}
                          placeholder="e.g., Margherita Pizza"
                          data-testid="input-menu-name"
                        />
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
                        <Textarea
                          {...field}
                          placeholder="Describe the menu item..."
                          rows={3}
                          data-testid="input-menu-description"
                        />
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
                      <Select onValueChange={field.onChange} value={field.value}>
                        <FormControl>
                          <SelectTrigger data-testid="select-menu-category">
                            <SelectValue placeholder="Select category" />
                          </SelectTrigger>
                        </FormControl>
                        <SelectContent>
                          <SelectItem value="Pizza">Pizza</SelectItem>
                          <SelectItem value="Burgers">Burgers</SelectItem>
                          <SelectItem value="Sandwiches">Sandwiches</SelectItem>
                          <SelectItem value="Salads">Salads</SelectItem>
                          <SelectItem value="Drinks">Drinks</SelectItem>
                          <SelectItem value="Desserts">Desserts</SelectItem>
                        </SelectContent>
                      </Select>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                <FormField
                  control={form.control}
                  name="basePrice"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Base Price (SAR, before VAT)</FormLabel>
                      <FormControl>
                        <Input
                          {...field}
                          type="number"
                          step="0.01"
                          placeholder="e.g., 25.00"
                          data-testid="input-menu-baseprice"
                        />
                      </FormControl>
                      {field.value && (
                        <p className="text-xs text-muted-foreground mt-1 font-mono">
                          VAT (15%): +{(parseFloat(field.value) * 0.15).toFixed(2)} SAR | 
                          Total: {(parseFloat(field.value) * 1.15).toFixed(2)} SAR
                        </p>
                      )}
                      <FormMessage />
                    </FormItem>
                  )}
                />
                <div className="flex justify-end gap-3 pt-4">
                  <Button type="button" variant="outline" onClick={() => setOpen(false)} data-testid="button-cancel">
                    Cancel
                  </Button>
                  <Button type="submit" disabled={createMenuItemMutation.isPending} data-testid="button-save-menu">
                    {createMenuItemMutation.isPending ? "Creating..." : "Create Menu Item"}
                  </Button>
                </div>
              </form>
            </Form>
          </DialogContent>
        </Dialog>
      </div>

      <div className="relative">
        <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
        <Input
          placeholder="Search menu items..."
          className="pl-10 max-w-md"
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          data-testid="input-search-menu"
        />
      </div>

      <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
        {filteredItems.map((item) => (
          <Card key={item.id} className="overflow-hidden" data-testid={`card-menu-${item.id}`}>
            <CardHeader className="p-0">
              <div className="aspect-square bg-gradient-to-br from-primary/20 to-primary/5 flex items-center justify-center">
                <UtensilsCrossed className="h-16 w-16 text-primary/40" />
              </div>
            </CardHeader>
            <CardContent className="p-4">
              <div className="flex items-start justify-between mb-2">
                <div className="flex-1">
                  <h3 className="font-semibold text-lg mb-1">{item.name}</h3>
                  <Badge variant="secondary" className="mb-2">{item.category}</Badge>
                </div>
              </div>
              <p className="text-sm text-muted-foreground mb-3">{item.description}</p>
              <div className="space-y-1">
                <p className="text-2xl font-bold font-mono text-primary">{parseFloat(item.price).toFixed(2)} SAR</p>
                <div className="text-xs text-muted-foreground font-mono">
                  <div className="flex justify-between">
                    <span>Base Price:</span>
                    <span>{parseFloat(item.basePrice).toFixed(2)} SAR</span>
                  </div>
                  <div className="flex justify-between">
                    <span>VAT (15%):</span>
                    <span>+{parseFloat(item.vatAmount).toFixed(2)} SAR</span>
                  </div>
                </div>
              </div>
            </CardContent>
            <CardFooter className="p-4 pt-0 flex items-center justify-between gap-2">
              <div className="flex items-center gap-2">
                <Switch
                  checked={item.available}
                  onCheckedChange={(checked) =>
                    toggleAvailabilityMutation.mutate({ id: item.id, available: checked })
                  }
                  data-testid={`switch-available-${item.id}`}
                />
                <span className="text-sm">{item.available ? "Available" : "Unavailable"}</span>
              </div>
              <Button variant="ghost" size="icon" data-testid={`button-edit-menu-${item.id}`}>
                <Edit className="h-4 w-4" />
              </Button>
            </CardFooter>
          </Card>
        ))}
      </div>
    </div>
  );
}
