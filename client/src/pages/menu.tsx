import { useState, useRef, useMemo } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardFooter, CardHeader } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Switch } from "@/components/ui/switch";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle } from "@/components/ui/alert-dialog";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Plus, Search, Edit, UtensilsCrossed, Settings2, Trash2, X, Download, Upload, FileDown, ImagePlus } from "lucide-react";
import { useQuery, useMutation } from "@tanstack/react-query";
import { apiRequest, queryClient } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { insertMenuItemSchema, type MenuItem, type Recipe, type InventoryItem } from "@shared/schema";
import { useDeviceLayout } from "@/lib/mobileLayout";
import { useLanguage } from "@/contexts/LanguageContext";
import { useBusinessType } from "@/hooks/useBusinessType";

// Factory function for creating localized form schema
const createMenuFormSchema = (t: any) => z.object({
  name: z.string().min(1, t.itemNameRequired || "Item name is required"),
  category: z.string().min(1, t.categoryRequired || "Category is required"),
  recipeId: z.string().optional(),
  portionSize: z.string().default("1.00"),
  stockNo: z.string().optional(),
  price: z.string().min(1, t.priceRequired || "Price is required"),
  discount: z.string().default("0").refine(
    (val) => {
      const num = parseFloat(val || "0");
      return num >= 0 && num <= 100;
    },
    { message: t.discountRange || "Discount must be between 0 and 100" }
  ),
  description: z.string().min(1, t.descriptionRequired || "Description is required"),
}).refine(
  (data) => {
    // If stockNo is provided, it must be a valid positive number
    if (data.stockNo && data.stockNo.trim() !== "") {
      const stockNum = parseFloat(data.stockNo);
      return !isNaN(stockNum) && stockNum > 0;
    }
    return true;
  },
  { message: t.stockNoPositive || "Stock quantity must be a positive number", path: ["stockNo"] }
);

type MenuFormValues = z.infer<ReturnType<typeof createMenuFormSchema>>;

export default function Menu() {
  const layout = useDeviceLayout();
  const { t } = useLanguage();
  const { labels } = useBusinessType();
  const [searchQuery, setSearchQuery] = useState("");
  const [open, setOpen] = useState(false);
  const [categoriesOpen, setCategoriesOpen] = useState(false);
  const [isImporting, setIsImporting] = useState(false);
  const [editingItem, setEditingItem] = useState<MenuItem | null>(null);
  const [deletingItem, setDeletingItem] = useState<MenuItem | null>(null);
  const [categories, setCategories] = useState<string[]>([
    "Pizza",
    "Burgers",
    "Sandwiches",
    "Salads",
    "Drinks",
    "Desserts",
  ]);
  const [newCategory, setNewCategory] = useState("");
  const { toast } = useToast();

  const [selectedRecipeId, setSelectedRecipeId] = useState<string>("");
  const [imageFile, setImageFile] = useState<File | null>(null);
  const [imagePreview, setImagePreview] = useState<string | null>(null);
  const [uploadingImage, setUploadingImage] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Create localized schema
  const menuFormSchema = useMemo(() => createMenuFormSchema(t), [t]);

  const form = useForm<MenuFormValues>({
    resolver: zodResolver(menuFormSchema),
    defaultValues: {
      name: "",
      description: "",
      category: "",
      recipeId: "",
      portionSize: "1.00",
      stockNo: "",
      price: "",
      discount: "0",
    },
  });

  const { data: menuItems = [], isLoading } = useQuery<MenuItem[]>({
    queryKey: ["/api/menu"],
  });

  const { data: recipes = [] } = useQuery<Recipe[]>({
    queryKey: ["/api/recipes"],
  });

  const { data: inventoryItems = [] } = useQuery<InventoryItem[]>({
    queryKey: ["/api/inventory"],
  });

  // Get selected recipe details and calculate stock with portion size
  const selectedRecipe = recipes.find(r => r.id === selectedRecipeId && selectedRecipeId !== "none");
  const portionMultiplier = parseFloat(form.watch("portionSize") || "1.00");
  const recipeStockInfo = selectedRecipe?.ingredients.map(ing => {
    const inventoryItem = inventoryItems.find(inv => inv.id === ing.inventoryItemId);
    const adjustedQuantity = ing.quantity * portionMultiplier; // Apply portion size
    return {
      ...ing,
      quantity: adjustedQuantity, // Show adjusted quantity
      originalQuantity: ing.quantity, // Keep original for reference
      availableStock: inventoryItem?.quantity || "0",
      unit: inventoryItem?.unit || ing.unit,
      inStock: inventoryItem ? parseFloat(inventoryItem.quantity) >= adjustedQuantity : false,
    };
  });

  const createMenuItemMutation = useMutation({
    mutationFn: async (data: MenuFormValues & { imageUrl?: string | null }) => {
      // Price is VAT-inclusive, calculate base price and VAT from ORIGINAL price
      const priceNum = parseFloat(data.price); // Original VAT-inclusive price
      const discountNum = parseFloat(data.discount || "0");
      
      // Calculate base price and VAT from original VAT-inclusive price (before discount)
      const basePrice = priceNum / 1.15;
      const vatAmount = priceNum - basePrice;
      
      // Calculate final price after discount
      const discountedBase = basePrice * (1 - discountNum / 100);
      const discountedVAT = discountedBase * 0.15;
      const finalPrice = discountedBase + discountedVAT;

      const menuItemData: any = {
        name: data.name,
        description: data.description,
        category: data.category,
        price: finalPrice.toFixed(2), // Final price after discount and VAT
        basePrice: basePrice.toFixed(2), // Original base price (before discount)
        vatAmount: discountedVAT.toFixed(2), // VAT on discounted base
        discount: discountNum.toFixed(2),
        available: true,
        imageUrl: data.imageUrl || null,
        inventoryItemId: null, // Set to null for menu items (handled via recipes or stockNo)
      };

      // Only include recipeId if it's set and not "none"
      if (data.recipeId && data.recipeId !== "none") {
        menuItemData.recipeId = data.recipeId;
        menuItemData.portionSize = data.portionSize || "1.00";
      } else {
        menuItemData.recipeId = null;
        menuItemData.portionSize = null;
      }

      // Include stockNo if provided, otherwise set to null
      menuItemData.stockNo = data.stockNo && data.stockNo.trim() !== "" ? data.stockNo : null;

      return await apiRequest("POST", "/api/menu", menuItemData);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/menu"] });
      queryClient.invalidateQueries({ queryKey: ["/api/menu/stock"] });
      setOpen(false);
      form.reset();
      setImageFile(null);
      setImagePreview(null);
      toast({
        title: `${labels.menuItem} created`,
        description: t.itemAdded || "The item has been added successfully",
      });
    },
    onError: (error: any) => {
      console.error("[Menu Creation Error]", error);
      const errorMessage = error.message || error.details || `Could not create ${labels.menuItem.toLowerCase()}`;
      toast({
        title: `Failed to create ${labels.menuItem.toLowerCase()}`,
        description: errorMessage,
        variant: "destructive",
      });
    },
  });

  const updateMenuItemMutation = useMutation({
    mutationFn: async (data: MenuFormValues & { id: string; imageUrl?: string | null }) => {
      // Price is VAT-inclusive, calculate base price and VAT from ORIGINAL price
      const priceNum = parseFloat(data.price); // Original VAT-inclusive price
      const discountNum = parseFloat(data.discount || "0");
      
      // Calculate base price and VAT from original VAT-inclusive price (before discount)
      const basePrice = priceNum / 1.15;
      const vatAmount = priceNum - basePrice;
      
      // Calculate final price after discount
      const discountedBase = basePrice * (1 - discountNum / 100);
      const discountedVAT = discountedBase * 0.15;
      const finalPrice = discountedBase + discountedVAT;

      const menuItemData: any = {
        name: data.name,
        description: data.description,
        category: data.category,
        recipeId: (data.recipeId && data.recipeId !== "none") ? data.recipeId : null, // Send null to clear recipe or actual ID
        portionSize: (data.recipeId && data.recipeId !== "none") ? (data.portionSize || "1.00") : null,
        stockNo: data.stockNo || null, // Include stockNo (null if empty)
        price: finalPrice.toFixed(2), // Final price after discount and VAT
        basePrice: basePrice.toFixed(2), // Original base price (before discount)
        vatAmount: discountedVAT.toFixed(2), // VAT on discounted base
        discount: discountNum.toFixed(2),
        imageUrl: data.imageUrl !== undefined ? data.imageUrl : undefined,
      };

      return await apiRequest("PATCH", `/api/menu/${data.id}`, menuItemData);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/menu"] });
      queryClient.invalidateQueries({ queryKey: ["/api/menu/stock"] });
      setOpen(false);
      setEditingItem(null);
      form.reset();
      toast({
        title: `${labels.menuItem} updated`,
        description: t.itemUpdated || "The item has been updated successfully",
      });
    },
    onError: (error: any) => {
      toast({
        title: `Failed to update ${labels.menuItem.toLowerCase()}`,
        description: error.message || `Could not update ${labels.menuItem.toLowerCase()}`,
        variant: "destructive",
      });
    },
  });

  const deleteMenuItemMutation = useMutation({
    mutationFn: async (id: string) => {
      await apiRequest("DELETE", `/api/menu/${id}`);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/menu"] });
      queryClient.invalidateQueries({ queryKey: ["/api/menu/stock"] });
      setDeletingItem(null);
      toast({
        title: `${labels.menuItem} deleted`,
        description: t.itemDeleted || "The item has been removed successfully",
      });
    },
    onError: (error: any) => {
      toast({
        title: `Failed to delete ${labels.menuItem.toLowerCase()}`,
        description: error.message || `Could not delete ${labels.menuItem.toLowerCase()}`,
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
      queryClient.invalidateQueries({ queryKey: ["/api/menu/stock"] });
      toast({
        title: `${labels.menuItem} updated`,
        description: t.itemUpdated || "Availability has been updated successfully",
      });
    },
  });

  const handleImageSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      setImageFile(file);
      const reader = new FileReader();
      reader.onloadend = () => {
        setImagePreview(reader.result as string);
      };
      reader.readAsDataURL(file);
    }
  };

  const uploadImage = async (): Promise<string | null> => {
    if (!imageFile) return null;
    
    setUploadingImage(true);
    try {
      const formData = new FormData();
      formData.append('image', imageFile);
      
      const response = await fetch('/api/menu/upload-image', {
        method: 'POST',
        body: formData,
      });
      
      if (!response.ok) {
        throw new Error('Image upload failed');
      }
      
      const result = await response.json();
      return result.imageUrl;
    } catch (error) {
      console.error('Image upload error:', error);
      toast({
        title: "Image upload failed",
        description: "Could not upload image. Please try again.",
        variant: "destructive",
      });
      return null;
    } finally {
      setUploadingImage(false);
    }
  };

  const onSubmit = async (data: MenuFormValues) => {
    let imageUrl = editingItem?.imageUrl || null;
    
    // Upload new image if selected
    if (imageFile) {
      const uploadedUrl = await uploadImage();
      if (uploadedUrl) {
        imageUrl = uploadedUrl;
      }
    }
    
    const dataWithImage = { ...data, imageUrl };
    
    if (editingItem) {
      updateMenuItemMutation.mutate({ ...dataWithImage, id: editingItem.id });
    } else {
      createMenuItemMutation.mutate(dataWithImage);
    }
  };

  const handleEdit = (item: MenuItem) => {
    setEditingItem(item);
    setSelectedRecipeId(item.recipeId || "none");
    setImagePreview(item.imageUrl || null);
    setImageFile(null);
    
    // basePrice is stored as original (before discount), so calculate original VAT-inclusive price
    const basePrice = parseFloat(item.basePrice || "0");
    const originalPrice = basePrice * 1.15; // Add 15% VAT to get original VAT-inclusive price
    
    form.reset({
      name: item.name,
      description: item.description || "",
      category: item.category,
      recipeId: item.recipeId || "none",
      portionSize: item.portionSize || "1.00",
      stockNo: item.stockNo || "",
      price: originalPrice.toFixed(2), // Original VAT-inclusive price
      discount: item.discount || "0",
    });
    setOpen(true);
  };

  const handleOpenChange = (isOpen: boolean) => {
    setOpen(isOpen);
    if (!isOpen) {
      // Clear state when closing
      setEditingItem(null);
      setSelectedRecipeId("none");
      setImageFile(null);
      setImagePreview(null);
      form.reset();
    }
  };

  const handleCloseDialog = () => {
    setOpen(false);
    setEditingItem(null);
    setSelectedRecipeId("none");
    setImageFile(null);
    setImagePreview(null);
    form.reset();
  };

  const handleDownloadTemplate = async () => {
    try {
      const response = await fetch('/api/templates/menu');
      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.error || 'Template download failed');
      }
      const blob = await response.blob();
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = 'menu_template.xlsx';
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

  const handleExport = async () => {
    try {
      const response = await fetch('/api/export/menu');
      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.error || 'Export failed');
      }
      const blob = await response.blob();
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = 'menu.xlsx';
      document.body.appendChild(a);
      a.click();
      window.URL.revokeObjectURL(url);
      document.body.removeChild(a);
      toast({
        title: "Export successful",
        description: "Menu data exported to Excel",
      });
    } catch (error) {
      toast({
        title: "Export failed",
        description: error instanceof Error ? error.message : "Failed to export menu data",
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
      const response = await fetch('/api/import/menu', {
        method: 'POST',
        body: formData,
      });
      const result = await response.json();
      
      if (!response.ok) {
        throw new Error(result.error || 'Import failed');
      }
      
      queryClient.invalidateQueries({ queryKey: ["/api/menu"] });
      queryClient.invalidateQueries({ queryKey: ["/api/menu/stock"] });
      toast({
        title: "Import successful",
        description: result.message || "Menu data imported from Excel",
      });
    } catch (error) {
      toast({
        title: "Import failed",
        description: error instanceof Error ? error.message : "Failed to import menu data",
        variant: "destructive",
      });
    } finally {
      setIsImporting(false);
      event.target.value = '';
    }
  };

  const filteredItems = menuItems.filter(item =>
    item.name.toLowerCase().includes(searchQuery.toLowerCase())
  );

  if (isLoading) {
    return (
      <div className={layout.padding}>
        <h1 className={`${layout.text3Xl} font-bold mb-2`}>Menu Management</h1>
        <p className="text-muted-foreground">Loading...</p>
      </div>
    );
  }

  return (
    <div className={`${layout.padding} ${layout.spaceY}`}>
      <div className={layout.isMobile ? 'space-y-4' : 'flex items-center justify-between'}>
        <div>
          <h1 className={`${layout.text3Xl} font-bold mb-2`}>Menu Management</h1>
          <p className="text-muted-foreground text-sm">Manage your menu items and pricing</p>
        </div>
        <div className={`flex gap-2 ${layout.isMobile ? 'flex-col' : ''}`}>
          <Button 
            variant="outline" 
            onClick={handleDownloadTemplate} 
            className={layout.isMobile ? 'w-full justify-start h-[44px]' : ''}
            data-testid="button-download-template"
          >
            <FileDown className="h-4 w-4 mr-2" />
            Template
          </Button>
          <Button 
            variant="outline" 
            onClick={handleExport} 
            className={layout.isMobile ? 'w-full justify-start h-[44px]' : ''}
            data-testid="button-export"
          >
            <Download className="h-4 w-4 mr-2" />
            Export
          </Button>
          <Button 
            variant="outline" 
            asChild 
            disabled={isImporting}
            className={layout.isMobile ? 'w-full h-[44px]' : ''}
          >
            <label htmlFor="import-menu" className={`cursor-pointer ${layout.isMobile ? 'justify-start' : ''}`} data-testid="button-import">
              <Upload className="h-4 w-4 mr-2" />
              {isImporting ? "Importing..." : "Import"}
              <input
                id="import-menu"
                type="file"
                accept=".xlsx,.xls"
                onChange={handleImport}
                className="hidden"
                data-testid="input-import-file"
              />
            </label>
          </Button>
          <Dialog open={categoriesOpen} onOpenChange={setCategoriesOpen}>
            <DialogTrigger asChild>
              <Button 
                variant="outline" 
                className={layout.isMobile ? 'w-full justify-start h-[44px]' : ''}
                data-testid="button-manage-categories"
              >
                <Settings2 className="h-4 w-4 mr-2" />
                Manage Categories
              </Button>
            </DialogTrigger>
            <DialogContent className="max-h-[90vh] overflow-y-auto">
              <DialogHeader>
                <DialogTitle>Manage Menu Categories</DialogTitle>
                <DialogDescription>Add, edit, or remove menu categories</DialogDescription>
              </DialogHeader>
              <div className="space-y-4">
                <div className={`flex gap-2 ${layout.isMobile ? 'flex-col' : ''}`}>
                  <Input
                    placeholder="New category name..."
                    value={newCategory}
                    onChange={(e) => setNewCategory(e.target.value)}
                    className={layout.isMobile ? 'w-full' : ''}
                    data-testid="input-new-category"
                  />
                  <Button
                    onClick={() => {
                      if (newCategory.trim() && !categories.includes(newCategory.trim())) {
                        setCategories([...categories, newCategory.trim()]);
                        setNewCategory("");
                        toast({
                          title: "Category added",
                          description: `${newCategory} has been added to menu categories`,
                        });
                      }
                    }}
                    className={layout.isMobile ? 'w-full h-[44px]' : ''}
                    data-testid="button-add-category"
                  >
                    <Plus className="h-4 w-4 mr-2" />
                    Add
                  </Button>
                </div>
                <div className="space-y-2">
                  {categories.map((category) => (
                    <div
                      key={category}
                      className="flex items-center justify-between p-3 border rounded-lg"
                      data-testid={`category-item-${category}`}
                    >
                      <span className="font-medium">{category}</span>
                      <Button
                        variant="ghost"
                        size="icon"
                        onClick={() => {
                          setCategories(categories.filter((c) => c !== category));
                          toast({
                            title: "Category removed",
                            description: `${category} has been removed from menu categories`,
                          });
                        }}
                        data-testid={`button-delete-category-${category}`}
                      >
                        <Trash2 className="h-4 w-4 text-destructive" />
                      </Button>
                    </div>
                  ))}
                </div>
              </div>
            </DialogContent>
          </Dialog>
          <Dialog open={open} onOpenChange={handleOpenChange}>
            <DialogTrigger asChild>
              <Button 
                className={layout.isMobile ? 'w-full justify-start h-[44px]' : ''}
                data-testid="button-add-menu-item"
              >
                <Plus className="h-4 w-4 mr-2" />
                Add {labels.menuItem}
              </Button>
            </DialogTrigger>
          <DialogContent className="max-h-[90vh] overflow-y-auto">
            <DialogHeader>
              <DialogTitle>{editingItem ? `Edit ${labels.menuItem}` : `Add New ${labels.menuItem}`}</DialogTitle>
              <DialogDescription>
                {editingItem ? `Update the ${labels.menuItem.toLowerCase()} details` : `Create a new item for your ${labels.menu.toLowerCase()} with VAT-inclusive pricing`}
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
                          placeholder={`Describe the ${labels.menuItem.toLowerCase()}...`}
                          rows={3}
                          data-testid="input-menu-description"
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                <div className="space-y-2">
                  <label className="text-sm font-medium">Item Image (Optional)</label>
                  <div className="flex gap-3 items-start">
                    {imagePreview && (
                      <div className="relative w-24 h-24 rounded-lg overflow-hidden border">
                        <img
                          src={imagePreview}
                          alt="Preview"
                          className="w-full h-full object-cover"
                        />
                        <Button
                          type="button"
                          variant="destructive"
                          size="icon"
                          className="absolute top-1 right-1 h-6 w-6"
                          onClick={() => {
                            setImageFile(null);
                            setImagePreview(null);
                            if (fileInputRef.current) fileInputRef.current.value = '';
                          }}
                          data-testid="button-remove-image"
                        >
                          <X className="h-3 w-3" />
                        </Button>
                      </div>
                    )}
                    <div className="flex-1">
                      <Input
                        ref={fileInputRef}
                        type="file"
                        accept="image/*"
                        onChange={handleImageSelect}
                        className="cursor-pointer"
                        data-testid="input-menu-image"
                      />
                      <p className="text-xs text-muted-foreground mt-1">
                        Upload an image for this {labels.menuItem.toLowerCase()} (max 5MB)
                      </p>
                    </div>
                  </div>
                </div>
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
                          {categories.map((category) => (
                            <SelectItem key={category} value={category}>
                              {category}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                <FormField
                  control={form.control}
                  name="recipeId"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Recipe (Optional)</FormLabel>
                      <Select 
                        onValueChange={(value) => {
                          field.onChange(value);
                          setSelectedRecipeId(value);
                        }} 
                        value={field.value}
                      >
                        <FormControl>
                          <SelectTrigger data-testid="select-menu-recipe">
                            <SelectValue placeholder="Select a recipe" />
                          </SelectTrigger>
                        </FormControl>
                        <SelectContent>
                          <SelectItem value="none">No Recipe</SelectItem>
                          {recipes.map((recipe) => (
                            <SelectItem key={recipe.id} value={recipe.id}>
                              {recipe.name}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                {selectedRecipeId && selectedRecipeId !== "none" && (
                  <FormField
                    control={form.control}
                    name="portionSize"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Portion Size</FormLabel>
                        <Select
                          onValueChange={field.onChange}
                          value={field.value}
                        >
                          <FormControl>
                            <SelectTrigger data-testid="select-menu-portion">
                              <SelectValue placeholder="Select portion size" />
                            </SelectTrigger>
                          </FormControl>
                          <SelectContent>
                            <SelectItem value="1.00">Whole (1x)</SelectItem>
                            <SelectItem value="0.75">3/4 Portion (0.75x)</SelectItem>
                            <SelectItem value="0.50">1/2 Portion (0.5x)</SelectItem>
                            <SelectItem value="0.25">1/4 Portion (0.25x)</SelectItem>
                          </SelectContent>
                        </Select>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                )}
                {selectedRecipeId && recipeStockInfo && recipeStockInfo.length > 0 && (
                  <div className="rounded-lg border p-4 space-y-3 bg-muted/30">
                    <h4 className="text-sm font-semibold">Ingredient Stock Availability</h4>
                    <div className="space-y-2">
                      {recipeStockInfo.map((ingredient, index) => (
                        <div key={index} className="flex items-center justify-between text-sm">
                          <div className="flex items-center gap-2">
                            <div className={`h-2 w-2 rounded-full ${ingredient.inStock ? 'bg-green-500' : 'bg-red-500'}`} />
                            <span className="text-muted-foreground">{ingredient.name}</span>
                          </div>
                          <div className="flex items-center gap-3">
                            <span className="text-xs text-muted-foreground">
                              Need: {ingredient.quantity} {ingredient.unit}
                            </span>
                            <Badge variant={ingredient.inStock ? "default" : "destructive"} className="text-xs">
                              Stock: {ingredient.availableStock} {ingredient.unit}
                            </Badge>
                          </div>
                        </div>
                      ))}
                    </div>
                    {recipeStockInfo.some(ing => !ing.inStock) && (
                      <p className="text-xs text-destructive mt-2">
                        ⚠️ Some ingredients are low in stock
                      </p>
                    )}
                  </div>
                )}
                {(!selectedRecipeId || selectedRecipeId === "none") && (
                  <FormField
                    control={form.control}
                    name="stockNo"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Stock Number *</FormLabel>
                        <FormControl>
                          <Input
                            {...field}
                            type="number"
                            step="0.01"
                            placeholder="e.g., 50"
                            data-testid="input-menu-stockno"
                          />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                )}
                <FormField
                  control={form.control}
                  name="price"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Price (SAR, incl. VAT)</FormLabel>
                      <FormControl>
                        <Input
                          {...field}
                          type="number"
                          step="0.01"
                          placeholder="e.g., 28.75"
                          data-testid="input-menu-price"
                        />
                      </FormControl>
                      {field.value && (
                        <p className="text-xs text-muted-foreground mt-1 font-mono">
                          Base: {(parseFloat(field.value) / 1.15).toFixed(2)} SAR | 
                          VAT (15%): {(parseFloat(field.value) - parseFloat(field.value) / 1.15).toFixed(2)} SAR
                        </p>
                      )}
                      <FormMessage />
                    </FormItem>
                  )}
                />
                <FormField
                  control={form.control}
                  name="discount"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Discount %</FormLabel>
                      <FormControl>
                        <Input
                          {...field}
                          type="number"
                          step="0.01"
                          min="0"
                          max="100"
                          placeholder="e.g., 10"
                          data-testid="input-menu-discount"
                        />
                      </FormControl>
                      {field.value && parseFloat(field.value) > 0 && form.watch("price") && (
                        <p className="text-xs text-muted-foreground mt-1 font-mono">
                          Discounted Price: {(parseFloat(form.watch("price")) * (1 - parseFloat(field.value) / 100)).toFixed(2)} SAR | 
                          Base (after discount): {((parseFloat(form.watch("price")) * (1 - parseFloat(field.value) / 100)) / 1.15).toFixed(2)} SAR
                        </p>
                      )}
                      <FormMessage />
                    </FormItem>
                  )}
                />
                <div className={`flex gap-3 pt-4 ${layout.isMobile ? 'flex-col' : 'justify-end'}`}>
                  <Button 
                    type="button" 
                    variant="outline" 
                    onClick={handleCloseDialog} 
                    className={layout.isMobile ? 'w-full h-[44px]' : ''}
                    data-testid="button-cancel"
                  >
                    Cancel
                  </Button>
                  <Button 
                    type="submit" 
                    disabled={createMenuItemMutation.isPending || updateMenuItemMutation.isPending} 
                    className={layout.isMobile ? 'w-full h-[44px]' : ''}
                    data-testid="button-save-menu"
                  >
                    {editingItem 
                      ? (updateMenuItemMutation.isPending ? "Updating..." : `Update ${labels.menuItem}`)
                      : (createMenuItemMutation.isPending ? "Creating..." : `Create ${labels.menuItem}`)
                    }
                  </Button>
                </div>
              </form>
            </Form>
          </DialogContent>
        </Dialog>
      </div>
    </div>

      <div className="relative">
        <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
        <Input
          placeholder={`Search ${labels.menuItems.toLowerCase()}...`}
          className="pl-10 max-w-md"
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          data-testid="input-search-menu"
        />
      </div>

      <div className={`grid ${layout.gap} ${layout.gridCols({ desktop: 4, tablet: 3, mobile: 1 })}`}>
        {filteredItems.map((item) => {
          if (layout.isMobile) {
            // Mobile horizontal layout
            return (
              <Card key={item.id} className="overflow-hidden" data-testid={`card-menu-${item.id}`}>
                <div className="flex">
                  <div className="w-28 h-28 bg-gradient-to-br from-primary/20 to-primary/5 flex items-center justify-center flex-shrink-0 overflow-hidden">
                    {item.imageUrl ? (
                      <img src={item.imageUrl} alt={item.name} className="w-full h-full object-cover" />
                    ) : (
                      <UtensilsCrossed className="h-12 w-12 text-primary/40" />
                    )}
                  </div>
                  <div className="flex-1 p-3">
                    <h3 className="font-semibold text-base mb-1">{item.name}</h3>
                    <div className="flex gap-1 mb-2 flex-wrap">
                      <Badge variant="secondary" className="text-xs">{item.category}</Badge>
                      {item.discount && parseFloat(item.discount) > 0 && (
                        <Badge className="bg-green-600 text-white text-xs" data-testid={`badge-discount-${item.id}`}>
                          {parseFloat(item.discount).toFixed(0)}% OFF
                        </Badge>
                      )}
                    </div>
                    <p className="text-xs text-muted-foreground line-clamp-2 mb-2">{item.description}</p>
                    <p className="text-lg font-bold font-mono text-primary">
                      {item.discount && parseFloat(item.discount) > 0 
                        ? (parseFloat(item.basePrice) * (1 - parseFloat(item.discount) / 100) * 1.15).toFixed(2)
                        : parseFloat(item.price).toFixed(2)
                      } SAR
                    </p>
                  </div>
                </div>
                <div className="border-t p-3 flex items-center justify-between gap-2">
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
                  <div className="flex gap-2">
                    <Button 
                      variant="ghost" 
                      className="h-[44px]"
                      onClick={() => handleEdit(item)}
                      data-testid={`button-edit-menu-${item.id}`}
                    >
                      <Edit className="h-4 w-4 mr-2" />
                      Edit
                    </Button>
                    <Button 
                      variant="ghost"
                      className="h-[44px]"
                      onClick={() => setDeletingItem(item)}
                      data-testid={`button-delete-menu-${item.id}`}
                    >
                      <Trash2 className="h-4 w-4 mr-2" />
                      Delete
                    </Button>
                  </div>
                </div>
              </Card>
            );
          }
          
          // Desktop vertical layout
          return (
            <Card key={item.id} className="overflow-hidden" data-testid={`card-menu-${item.id}`}>
              <CardHeader className="p-0">
                <div className="aspect-square bg-gradient-to-br from-primary/20 to-primary/5 flex items-center justify-center overflow-hidden">
                  {item.imageUrl ? (
                    <img src={item.imageUrl} alt={item.name} className="w-full h-full object-cover" />
                  ) : (
                    <UtensilsCrossed className="h-16 w-16 text-primary/40" />
                  )}
                </div>
              </CardHeader>
              <CardContent className="p-4">
                <div className="flex items-start justify-between mb-2">
                  <div className="flex-1">
                    <h3 className="font-semibold text-lg mb-1">{item.name}</h3>
                    <div className="flex gap-2 mb-2">
                      <Badge variant="secondary">{item.category}</Badge>
                      {item.discount && parseFloat(item.discount) > 0 && (
                        <Badge className="bg-green-600 text-white" data-testid={`badge-discount-${item.id}`}>
                          {parseFloat(item.discount).toFixed(0)}% OFF
                        </Badge>
                      )}
                    </div>
                  </div>
                </div>
                <p className="text-sm text-muted-foreground mb-3">{item.description}</p>
                <div className="space-y-1">
                  {item.discount && parseFloat(item.discount) > 0 ? (
                    <>
                      <div className="flex items-baseline gap-2">
                        <p className="text-2xl font-bold font-mono text-primary">
                          {(parseFloat(item.basePrice) * (1 - parseFloat(item.discount) / 100) * 1.15).toFixed(2)} SAR
                        </p>
                        <p className="text-sm font-mono text-muted-foreground line-through">
                          {parseFloat(item.price).toFixed(2)} SAR
                        </p>
                      </div>
                      <div className="text-xs text-muted-foreground font-mono">
                        <div className="flex justify-between">
                          <span>Original Base:</span>
                          <span>{parseFloat(item.basePrice).toFixed(2)} SAR</span>
                        </div>
                        <div className="flex justify-between">
                          <span>Discounted Base:</span>
                          <span>{(parseFloat(item.basePrice) * (1 - parseFloat(item.discount) / 100)).toFixed(2)} SAR</span>
                        </div>
                        <div className="flex justify-between">
                          <span>VAT (15%):</span>
                          <span>+{(parseFloat(item.basePrice) * (1 - parseFloat(item.discount) / 100) * 0.15).toFixed(2)} SAR</span>
                        </div>
                      </div>
                    </>
                  ) : (
                    <>
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
                    </>
                  )}
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
                <div className="flex gap-1">
                  <Button 
                    variant="ghost" 
                    size="icon" 
                    onClick={() => handleEdit(item)}
                    data-testid={`button-edit-menu-${item.id}`}
                  >
                    <Edit className="h-4 w-4" />
                  </Button>
                  <Button 
                    variant="ghost" 
                    size="icon"
                    onClick={() => setDeletingItem(item)}
                    data-testid={`button-delete-menu-${item.id}`}
                  >
                    <Trash2 className="h-4 w-4" />
                  </Button>
                </div>
              </CardFooter>
            </Card>
          );
        })}
      </div>

      {/* Delete Confirmation Dialog */}
      <AlertDialog open={!!deletingItem} onOpenChange={(open) => !open && setDeletingItem(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete {labels.menuItem}</AlertDialogTitle>
            <AlertDialogDescription>
              Are you sure you want to delete this {labels.menuItem.toLowerCase()}? This action cannot be undone.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel data-testid="button-cancel-delete">Cancel</AlertDialogCancel>
            <AlertDialogAction
              onClick={() => deletingItem && deleteMenuItemMutation.mutate(deletingItem.id)}
              disabled={deleteMenuItemMutation.isPending}
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
              data-testid="button-confirm-delete"
            >
              {deleteMenuItemMutation.isPending ? "Deleting..." : "Delete"}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
