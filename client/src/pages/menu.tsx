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
import { Tooltip, TooltipContent, TooltipTrigger } from "@/components/ui/tooltip";
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
  inventoryItemId: z.string().optional(),
  stockNo: z.string().optional(),
  price: z.coerce.number().positive({ message: t.pricePositive || "Price must be a positive number" }),
  discount: z.string().default("0").refine(
    (val) => {
      const num = parseFloat(val || "0");
      return num >= 0 && num <= 100;
    },
    { message: t.discountRange || "Discount must be between 0 and 100" }
  ),
  description: z.string().min(1, t.descriptionRequired || "Description is required"),
  displaySize: z.enum(["small", "medium", "large"]).default("medium"),
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
).refine(
  (data) => {
    // If stockNo is provided without a recipe, inventoryItemId must be selected
    if (data.stockNo && data.stockNo.trim() !== "" && (!data.recipeId || data.recipeId === "none")) {
      return data.inventoryItemId && data.inventoryItemId.trim() !== "";
    }
    return true;
  },
  { message: t.inventoryItemRequired || "Please select an inventory item when using stock tracking without a recipe", path: ["inventoryItemId"] }
);

type MenuFormValues = z.infer<ReturnType<typeof createMenuFormSchema>>;

// Helper function to format toast messages with business-type-aware labels
const formatToast = (template: string | undefined, label: string | undefined): string => {
  if (!template && !label) return '';
  if (!template) return label ?? '';
  return template.includes('%s') ? template.replace('%s', label ?? '') : template;
};

export default function Menu() {
  const layout = useDeviceLayout();
  const { t } = useLanguage();
  const { labels, isRealEstate } = useBusinessType();
  const [searchQuery, setSearchQuery] = useState("");
  const [open, setOpen] = useState(false);
  const [categoriesOpen, setCategoriesOpen] = useState(false);
  const [isImporting, setIsImporting] = useState(false);
  const [editingItem, setEditingItem] = useState<MenuItem | null>(null);
  const [deletingItem, setDeletingItem] = useState<MenuItem | null>(null);
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
      inventoryItemId: "",
      stockNo: "",
      price: 0,
      discount: "0",
      displaySize: "medium",
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
    refetchInterval: 5000, // Refresh every 5 seconds to keep stock levels updated
  });

  // Fetch saved custom categories from the database
  const { data: savedCategories = [] } = useQuery<{ id: string; name: string; restaurantId: string; sortOrder: number | null }[]>({
    queryKey: ["/api/menu-categories"],
  });

  // Derive categories dynamically from actual menu items in database
  // Combines categories from existing items with saved custom categories from the database
  const categories = useMemo(() => {
    const menuCategories = menuItems
      .map(item => item.category)
      .filter((cat): cat is string => Boolean(cat));
    const savedCategoryNames = savedCategories.map(c => c.name);
    const allCategories = [...menuCategories, ...savedCategoryNames];
    const uniqueCategories = Array.from(new Set(allCategories));
    return uniqueCategories.sort((a, b) => a.localeCompare(b));
  }, [menuItems, savedCategories]);

  // Get selected recipe details and calculate stock with portion size
  const selectedRecipe = recipes.find(r => r.id === selectedRecipeId && selectedRecipeId !== "none");
  const portionMultiplier = parseFloat(form.watch("portionSize") || "1.00");
  const recipeStockInfo = selectedRecipe?.ingredients.map(ing => {
    // First try to find by ID, then fallback to find by name (case-insensitive)
    let inventoryItem = inventoryItems.find(inv => inv.id === ing.inventoryItemId);
    if (!inventoryItem && ing.name) {
      // Fallback: find by name if ID doesn't match (handles cases where inventory was recreated)
      inventoryItem = inventoryItems.find(inv => inv.name.toLowerCase() === ing.name.toLowerCase());
    }
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
      const priceNum = data.price; // Original VAT-inclusive price (already a number from z.coerce.number())
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
        displaySize: data.displaySize || "medium",
      };

      // Only include recipeId if it's set and not "none"
      if (data.recipeId && data.recipeId !== "none") {
        menuItemData.recipeId = data.recipeId;
        menuItemData.portionSize = data.portionSize || "1.00";
        menuItemData.inventoryItemId = null; // Recipe-based items don't use direct inventory link
        menuItemData.stockNo = null; // Recipe-based items use recipe ingredients
      } else {
        menuItemData.recipeId = null;
        menuItemData.portionSize = null;
        // For non-recipe items, set inventoryItemId and stockNo
        menuItemData.inventoryItemId = (data.inventoryItemId && data.inventoryItemId.trim() !== "" && data.inventoryItemId !== "none") ? data.inventoryItemId : null;
        menuItemData.stockNo = (data.stockNo && data.stockNo.trim() !== "") ? data.stockNo : null;
      }

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
        title: formatToast(t.itemCreatedTitle, labels.menuItem),
        description: t.itemAdded || "The item has been added successfully",
      });
    },
    onError: (error: any) => {
      console.error("[Menu Creation Error]", error);
      const errorMessage = error.message || error.details || `Could not create ${labels.menuItem.toLowerCase()}`;
      toast({
        title: formatToast(t.itemCreateFailedTitle, labels.menuItem),
        description: errorMessage,
        variant: "destructive",
      });
    },
  });

  const updateMenuItemMutation = useMutation({
    mutationFn: async (data: MenuFormValues & { id: string; imageUrl?: string | null }) => {
      // Price is VAT-inclusive, calculate base price and VAT from ORIGINAL price
      const priceNum = data.price; // Original VAT-inclusive price (already a number from z.coerce.number())
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
        imageUrl: data.imageUrl !== undefined ? data.imageUrl : undefined,
        displaySize: data.displaySize || "medium",
      };

      // Handle recipe vs non-recipe items - ensure both stockNo and inventoryItemId are cleared together
      if (data.recipeId && data.recipeId !== "none") {
        menuItemData.recipeId = data.recipeId;
        menuItemData.portionSize = data.portionSize || "1.00";
        menuItemData.inventoryItemId = null; // Clear inventory link when using recipe
        menuItemData.stockNo = null; // Clear stock tracking when using recipe
      } else {
        menuItemData.recipeId = null; // Clear recipe when not using it
        menuItemData.portionSize = null; // Clear portion size when not using recipe
        menuItemData.inventoryItemId = (data.inventoryItemId && data.inventoryItemId.trim() !== "" && data.inventoryItemId !== "none") ? data.inventoryItemId : null;
        menuItemData.stockNo = (data.stockNo && data.stockNo.trim() !== "") ? data.stockNo : null;
      }

      return await apiRequest("PATCH", `/api/menu/${data.id}`, menuItemData);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/menu"] });
      queryClient.invalidateQueries({ queryKey: ["/api/menu/stock"] });
      setOpen(false);
      setEditingItem(null);
      form.reset();
      toast({
        title: formatToast(t.itemUpdatedTitle, labels.menuItem),
        description: t.itemUpdated || "The item has been updated successfully",
      });
    },
    onError: (error: any) => {
      toast({
        title: formatToast(t.itemUpdateFailedTitle, labels.menuItem),
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
        title: formatToast(t.itemDeletedTitle, labels.menuItem),
        description: t.itemDeleted || "The item has been removed successfully",
      });
    },
    onError: (error: any) => {
      toast({
        title: formatToast(t.itemDeleteFailedTitle, labels.menuItem),
        description: error.message || `Could not delete ${labels.menuItem.toLowerCase()}`,
        variant: "destructive",
      });
    },
  });

  // Category mutations for persisting categories to the database
  const createCategoryMutation = useMutation({
    mutationFn: async (name: string) => {
      return await apiRequest("POST", "/api/menu-categories", { name });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/menu-categories"] });
      setNewCategory("");
      toast({
        title: t.categoryAdded || "Category added",
        description: t.categoryAddedDesc || "New category has been added successfully",
      });
    },
    onError: (error: any) => {
      toast({
        title: t.failedToAddCategory || "Failed to add category",
        description: error.message || t.couldNotAddCategory || "Could not add category",
        variant: "destructive",
      });
    },
  });

  const deleteCategoryMutation = useMutation({
    mutationFn: async (id: string) => {
      await apiRequest("DELETE", `/api/menu-categories/${id}`);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/menu-categories"] });
      toast({
        title: t.categoryRemoved || "Category removed",
        description: t.categoryRemovedDesc || "Category has been removed from menu categories",
      });
    },
    onError: (error: any) => {
      toast({
        title: t.failedToRemoveCategory || "Failed to remove category",
        description: error.message || t.couldNotRemoveCategory || "Could not remove category",
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
        title: formatToast(t.itemUpdatedTitle, labels.menuItem),
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
        title: t.imageUploadFailed || "Image upload failed",
        description: t.couldNotUploadImage || "Could not upload image. Please try again.",
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
    // Fix floating-point precision: round to 2 decimal places
    const originalPrice = Math.round(basePrice * 1.15 * 100) / 100;
    
    form.reset({
      name: item.name,
      description: item.description || "",
      category: item.category,
      recipeId: item.recipeId || "none",
      portionSize: item.portionSize || "1.00",
      inventoryItemId: item.inventoryItemId || "",
      stockNo: item.stockNo || "",
      price: originalPrice, // Original VAT-inclusive price
      discount: item.discount || "0",
      displaySize: (item.displaySize as "small" | "medium" | "large") || "medium",
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
        title: t.templateDownloaded || "Template downloaded",
        description: t.fillInTemplateAndImport || "Fill in the template and import it",
      });
    } catch (error) {
      toast({
        title: t.downloadFailed || "Download failed",
        description: error instanceof Error ? error.message : (t.failedToDownloadTemplate || "Failed to download template"),
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
        title: t.exportSuccessful || "Export successful",
        description: t.menuDataExported || "Menu data exported to Excel",
      });
    } catch (error) {
      toast({
        title: t.exportFailed || "Export failed",
        description: error instanceof Error ? error.message : (t.failedToExportMenuData || "Failed to export menu data"),
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
        title: t.importSuccessful || "Import successful",
        description: result.message || t.menuDataImported || "Menu data imported from Excel",
      });
    } catch (error) {
      toast({
        title: t.importFailed || "Import failed",
        description: error instanceof Error ? error.message : (t.failedToImportMenuData || "Failed to import menu data"),
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
        <h1 className={`${layout.text3Xl} font-bold mb-2`}>{labels.menu} {t.management || "Management"}</h1>
        <p className="text-muted-foreground">{t.loading || "Loading..."}</p>
      </div>
    );
  }

  return (
    <div className={`${layout.padding} ${layout.spaceY}`}>
      <div className={layout.isMobile ? 'space-y-4' : 'flex items-center justify-between'}>
        <div>
          <h1 className={`${layout.text3Xl} font-bold mb-2`}>{labels.menu} {t.management || "Management"}</h1>
          <p className="text-muted-foreground text-sm">{t.manageYourItemsAndPricing || `Manage your ${labels.menuItems.toLowerCase()} and pricing`}</p>
        </div>
        <div className={`flex gap-2 ${layout.isMobile ? 'flex-col' : ''}`}>
          <Button 
            variant="outline" 
            onClick={handleDownloadTemplate} 
            className={layout.isMobile ? 'w-full justify-start h-[44px]' : ''}
            data-testid="button-download-template"
          >
            <FileDown className="h-4 w-4 mr-2" />
            {t.template || "Template"}
          </Button>
          <Button 
            variant="outline" 
            onClick={handleExport} 
            className={layout.isMobile ? 'w-full justify-start h-[44px]' : ''}
            data-testid="button-export"
          >
            <Download className="h-4 w-4 mr-2" />
            {t.export || "Export"}
          </Button>
          <Button 
            variant="outline" 
            asChild 
            disabled={isImporting}
            className={layout.isMobile ? 'w-full h-[44px]' : ''}
          >
            <label htmlFor="import-menu" className={`cursor-pointer ${layout.isMobile ? 'justify-start' : ''}`} data-testid="button-import">
              <Upload className="h-4 w-4 mr-2" />
              {isImporting ? (t.importing || "Importing...") : (t.import || "Import")}
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
                {t.manageCategories || "Manage Categories"}
              </Button>
            </DialogTrigger>
            <DialogContent className="max-h-[90vh] overflow-y-auto">
              <DialogHeader>
                <DialogTitle>{t.manageMenuCategories || "Manage Menu Categories"}</DialogTitle>
                <DialogDescription>{t.addEditRemoveCategories || "Add, edit, or remove menu categories"}</DialogDescription>
              </DialogHeader>
              <div className="space-y-4">
                <div className={`flex gap-2 ${layout.isMobile ? 'flex-col' : ''}`}>
                  <Input
                    placeholder={t.newCategoryName || "New category name..."}
                    value={newCategory}
                    onChange={(e) => setNewCategory(e.target.value)}
                    className={layout.isMobile ? 'w-full' : ''}
                    data-testid="input-new-category"
                  />
                  <Button
                    onClick={() => {
                      if (newCategory.trim() && !categories.includes(newCategory.trim())) {
                        createCategoryMutation.mutate(newCategory.trim());
                      }
                    }}
                    disabled={createCategoryMutation.isPending}
                    className={layout.isMobile ? 'w-full h-[44px]' : ''}
                    data-testid="button-add-category"
                  >
                    <Plus className="h-4 w-4 mr-2" />
                    {createCategoryMutation.isPending ? (t.adding || "Adding...") : (t.add || "Add")}
                  </Button>
                </div>
                <div className="space-y-2">
                  {categories.length === 0 ? (
                    <p className="text-sm text-muted-foreground text-center py-4">
                      {t.noCategoriesYet || "No categories yet. Add menu items to create categories automatically."}
                    </p>
                  ) : (
                    categories.map((category) => {
                      const itemCount = menuItems.filter(item => item.category === category).length;
                      const isInUse = itemCount > 0;
                      // Find the saved category object if it exists (for deletion by ID)
                      const savedCategory = savedCategories.find(c => c.name === category);
                      const canDelete = savedCategory && !isInUse;
                      
                      return (
                        <div
                          key={category}
                          className="flex items-center justify-between p-3 border rounded-lg"
                          data-testid={`category-item-${category}`}
                        >
                          <div className="flex items-center gap-2">
                            <span className="font-medium">{category}</span>
                            {isInUse && (
                              <Badge variant="secondary" className="text-xs">
                                {itemCount} {itemCount === 1 ? (t.item || 'item') : (t.items || 'items')}
                              </Badge>
                            )}
                          </div>
                          {canDelete ? (
                            <Tooltip>
                              <TooltipTrigger asChild>
                                <Button
                                  variant="ghost"
                                  size="icon"
                                  aria-label={t.delete}
                                  onClick={() => {
                                    deleteCategoryMutation.mutate(savedCategory.id);
                                  }}
                                  disabled={deleteCategoryMutation.isPending}
                                  data-testid={`button-delete-category-${category}`}
                                >
                                  <Trash2 className="h-4 w-4 text-destructive" />
                                </Button>
                              </TooltipTrigger>
                              <TooltipContent>{t.delete}</TooltipContent>
                            </Tooltip>
                          ) : (
                            <span className="text-xs text-muted-foreground">{t.inUse || "In use"}</span>
                          )}
                        </div>
                      );
                    })
                  )}
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
                {t.add || "Add"} {labels.menuItem}
              </Button>
            </DialogTrigger>
          <DialogContent className="max-h-[90vh] overflow-y-auto">
            <DialogHeader>
              <DialogTitle>{editingItem ? `${t.edit || "Edit"} ${labels.menuItem}` : `${t.addNew || "Add New"} ${labels.menuItem}`}</DialogTitle>
              <DialogDescription>
                {editingItem ? (t.updateItemDetails || `Update the ${labels.menuItem.toLowerCase()} details`) : (t.createNewItemDesc || `Create a new item for your ${labels.menu.toLowerCase()} with VAT-inclusive pricing`)}
              </DialogDescription>
            </DialogHeader>
            <Form {...form}>
              <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
                <FormField
                  control={form.control}
                  name="name"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>{t.itemName || "Item Name"}</FormLabel>
                      <FormControl>
                        <Input
                          {...field}
                          placeholder={isRealEstate ? (t as any).propertyNamePlaceholder : (t.itemNamePlaceholder || "e.g., Margherita Pizza")}
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
                      <FormLabel>{t.description || "Description"}</FormLabel>
                      <FormControl>
                        <Textarea
                          {...field}
                          placeholder={t.describeTheItem || `Describe the ${labels.menuItem.toLowerCase()}...`}
                          rows={3}
                          data-testid="input-menu-description"
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                <div className="space-y-2">
                  <label className="text-sm font-medium">{t.itemImageOptional || "Item Image (Optional)"}</label>
                  <div className="flex gap-3 items-start">
                    {imagePreview && (
                      <div className="relative w-24 h-24 rounded-lg overflow-hidden border">
                        <img
                          src={imagePreview}
                          alt={t.preview || "Preview"}
                          className="w-full h-full object-cover"
                        />
                        <Tooltip>
                          <TooltipTrigger asChild>
                            <Button
                              type="button"
                              variant="destructive"
                              size="icon"
                              aria-label="Remove image"
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
                          </TooltipTrigger>
                          <TooltipContent>Remove image</TooltipContent>
                        </Tooltip>
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
                        {t.uploadImageForItem || `Upload an image for this ${labels.menuItem.toLowerCase()} (max 5MB)`}
                      </p>
                    </div>
                  </div>
                </div>
                <FormField
                  control={form.control}
                  name="category"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>{t.category || "Category"}</FormLabel>
                      <FormControl>
                        <Input
                          {...field}
                          list="category-suggestions"
                          placeholder={t.enterOrSelectCategory || "Enter or select category"}
                          data-testid="input-menu-category"
                        />
                      </FormControl>
                      <datalist id="category-suggestions">
                        {categories.map((category) => (
                          <option key={category} value={category} />
                        ))}
                      </datalist>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                {!isRealEstate && (
                  <>
                    <FormField
                      control={form.control}
                      name="recipeId"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>{t.recipeOptional || "Recipe (Optional)"}</FormLabel>
                          <Select 
                            onValueChange={(value) => {
                              field.onChange(value);
                              setSelectedRecipeId(value);
                            }} 
                            value={field.value}
                          >
                            <FormControl>
                              <SelectTrigger data-testid="select-menu-recipe">
                                <SelectValue placeholder={t.selectRecipe || "Select a recipe"} />
                              </SelectTrigger>
                            </FormControl>
                            <SelectContent>
                              <SelectItem value="none">{t.noRecipe || "No Recipe"}</SelectItem>
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
                            <FormLabel>{t.portionSize || "Portion Size"}</FormLabel>
                            <Select
                              onValueChange={field.onChange}
                              value={field.value}
                            >
                              <FormControl>
                                <SelectTrigger data-testid="select-menu-portion">
                                  <SelectValue placeholder={t.selectPortionSize || "Select portion size"} />
                                </SelectTrigger>
                              </FormControl>
                              <SelectContent>
                                <SelectItem value="1.00">{t.wholePortion || "Whole (1x)"}</SelectItem>
                                <SelectItem value="0.75">{t.threeQuarterPortion || "3/4 Portion (0.75x)"}</SelectItem>
                                <SelectItem value="0.50">{t.halfPortion || "1/2 Portion (0.5x)"}</SelectItem>
                                <SelectItem value="0.25">{t.quarterPortion || "1/4 Portion (0.25x)"}</SelectItem>
                              </SelectContent>
                            </Select>
                            <FormMessage />
                          </FormItem>
                        )}
                      />
                    )}
                    {selectedRecipeId && recipeStockInfo && recipeStockInfo.length > 0 && (
                      <div className="rounded-lg border p-4 space-y-3 bg-muted/30">
                        <h4 className="text-sm font-semibold">{t.ingredientStockAvailability || "Ingredient Stock Availability"}</h4>
                        <div className="space-y-2">
                          {recipeStockInfo.map((ingredient, index) => (
                            <div key={index} className="flex items-center justify-between text-sm">
                              <div className="flex items-center gap-2">
                                <div className={`h-2 w-2 rounded-full ${ingredient.inStock ? 'bg-green-500' : 'bg-red-500'}`} />
                                <span className="text-muted-foreground">{ingredient.name}</span>
                              </div>
                              <div className="flex items-center gap-3">
                                <span className="text-xs text-muted-foreground">
                                  {t.need || "Need"}: {ingredient.quantity} {ingredient.unit}
                                </span>
                                <Badge variant={ingredient.inStock ? "default" : "destructive"} className="text-xs">
                                  {t.stock || "Stock"}: {ingredient.availableStock} {ingredient.unit}
                                </Badge>
                              </div>
                            </div>
                          ))}
                        </div>
                        {recipeStockInfo.some(ing => !ing.inStock) && (
                          <p className="text-xs text-destructive mt-2">
                            {t.someIngredientsLowStock || "Some ingredients are low in stock"}
                          </p>
                        )}
                      </div>
                    )}
                    {(!selectedRecipeId || selectedRecipeId === "none") && (
                      <>
                        <FormField
                          control={form.control}
                          name="inventoryItemId"
                          render={({ field }) => (
                            <FormItem>
                              <FormLabel>{t.linkToInventoryItem || "Link to Inventory Item (Optional)"}</FormLabel>
                              <Select
                                onValueChange={field.onChange}
                                value={field.value}
                              >
                                <FormControl>
                                  <SelectTrigger data-testid="select-menu-inventory">
                                    <SelectValue placeholder={t.selectInventoryItemForStock || "Select inventory item for stock tracking"} />
                                  </SelectTrigger>
                                </FormControl>
                                <SelectContent>
                                  <SelectItem value="none">{t.none || "None"}</SelectItem>
                                  {inventoryItems.map((item) => (
                                    <SelectItem key={item.id} value={item.id}>
                                      {item.name} ({item.quantity} {item.unit})
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
                          name="stockNo"
                          render={({ field }) => (
                            <FormItem>
                              <FormLabel>{t.stockQuantityPerItem || "Stock Quantity Per Item (Optional)"}</FormLabel>
                              <FormControl>
                                <Input
                                  {...field}
                                  type="number"
                                  step="0.01"
                                  placeholder={t.stockQuantityPlaceholder || "e.g., 1.5 (amount deducted per sale)"}
                                  data-testid="input-menu-stockno"
                                />
                              </FormControl>
                              <FormMessage />
                            </FormItem>
                          )}
                        />
                      </>
                    )}
                  </>
                )}
                <FormField
                  control={form.control}
                  name="price"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>{t.priceInclVAT || "Price (SAR, incl. VAT)"}</FormLabel>
                      <FormControl>
                        <Input
                          {...field}
                          type="number"
                          step="0.01"
                          placeholder={t.pricePlaceholder || "e.g., 28.75"}
                          data-testid="input-menu-price"
                        />
                      </FormControl>
                      {field.value && (
                        <p className="text-xs text-muted-foreground mt-1 font-mono">
                          {t.base || "Base"}: {(field.value / 1.15).toFixed(2)} SAR | 
                          {t.vatPercent || "VAT (15%)"}: {(field.value - field.value / 1.15).toFixed(2)} SAR
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
                      <FormLabel>{t.discountPercent || "Discount %"}</FormLabel>
                      <FormControl>
                        <Input
                          {...field}
                          type="number"
                          step="0.01"
                          min="0"
                          max="100"
                          placeholder={t.discountPlaceholder || "e.g., 10"}
                          data-testid="input-menu-discount"
                        />
                      </FormControl>
                      {field.value && parseFloat(field.value) > 0 && form.watch("price") && (
                        <p className="text-xs text-muted-foreground mt-1 font-mono">
                          {t.discountedPrice || "Discounted Price"}: {(form.watch("price") * (1 - parseFloat(field.value) / 100)).toFixed(2)} SAR | 
                          {t.baseAfterDiscount || "Base (after discount)"}: {((form.watch("price") * (1 - parseFloat(field.value) / 100)) / 1.15).toFixed(2)} SAR
                        </p>
                      )}
                      <FormMessage />
                    </FormItem>
                  )}
                />
                <FormField
                  control={form.control}
                  name="displaySize"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>{t.displaySizePosMenu || "Display Size (POS/Menu)"}</FormLabel>
                      <Select onValueChange={field.onChange} value={field.value}>
                        <FormControl>
                          <SelectTrigger data-testid="select-display-size">
                            <SelectValue placeholder={t.selectDisplaySize || "Select display size"} />
                          </SelectTrigger>
                        </FormControl>
                        <SelectContent>
                          <SelectItem value="small">{t.small || "Small"}</SelectItem>
                          <SelectItem value="medium">{t.medium || "Medium"}</SelectItem>
                          <SelectItem value="large">{t.large || "Large"}</SelectItem>
                        </SelectContent>
                      </Select>
                      <p className="text-xs text-muted-foreground">
                        {t.controlsCardSize || "Controls the card size in POS and Menu views"}
                      </p>
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
                    {t.cancel || "Cancel"}
                  </Button>
                  <Button 
                    type="submit" 
                    disabled={createMenuItemMutation.isPending || updateMenuItemMutation.isPending} 
                    className={layout.isMobile ? 'w-full h-[44px]' : ''}
                    data-testid="button-save-menu"
                  >
                    {editingItem 
                      ? (updateMenuItemMutation.isPending ? (t.updating || "Updating...") : `${t.update || "Update"} ${labels.menuItem}`)
                      : (createMenuItemMutation.isPending ? (t.creating || "Creating...") : `${t.create || "Create"} ${labels.menuItem}`)
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
          placeholder={t.searchItemsPlaceholder || `${t.search || "Search"} ${labels.menuItems.toLowerCase()}...`}
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
                          {parseFloat(item.discount).toFixed(0)}% {t.off || "OFF"}
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
                    <span className="text-sm">{item.available ? (t.available || "Available") : (t.unavailable || "Unavailable")}</span>
                  </div>
                  <div className="flex gap-2">
                    <Button 
                      variant="ghost" 
                      className="h-[44px]"
                      onClick={() => handleEdit(item)}
                      data-testid={`button-edit-menu-${item.id}`}
                    >
                      <Edit className="h-4 w-4 mr-2" />
                      {t.edit || "Edit"}
                    </Button>
                    <Button 
                      variant="ghost"
                      className="h-[44px]"
                      onClick={() => setDeletingItem(item)}
                      data-testid={`button-delete-menu-${item.id}`}
                    >
                      <Trash2 className="h-4 w-4 mr-2" />
                      {t.delete || "Delete"}
                    </Button>
                  </div>
                </div>
              </Card>
            );
          }
          
          // Desktop vertical layout - with display size support
          const sizeClasses = {
            small: "col-span-1",
            medium: "col-span-1", 
            large: "col-span-2 row-span-2",
          };
          const imageHeightClasses = {
            small: "h-24",
            medium: "aspect-square",
            large: "h-48",
          };
          const displaySize = (item.displaySize as "small" | "medium" | "large") || "medium";
          
          return (
            <Card key={item.id} className={`overflow-hidden ${sizeClasses[displaySize]}`} data-testid={`card-menu-${item.id}`}>
              <CardHeader className="p-0">
                <div className={`${displaySize === "small" ? imageHeightClasses.small : displaySize === "large" ? imageHeightClasses.large : "aspect-square"} bg-gradient-to-br from-primary/20 to-primary/5 flex items-center justify-center overflow-hidden`}>
                  {item.imageUrl ? (
                    <img src={item.imageUrl} alt={item.name} className="w-full h-full object-cover" />
                  ) : (
                    <UtensilsCrossed className={`${displaySize === "small" ? "h-8 w-8" : displaySize === "large" ? "h-24 w-24" : "h-16 w-16"} text-primary/40`} />
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
                          {parseFloat(item.discount).toFixed(0)}% {t.off || "OFF"}
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
                          <span>{t.originalBase || "Original Base"}:</span>
                          <span>{parseFloat(item.basePrice).toFixed(2)} SAR</span>
                        </div>
                        <div className="flex justify-between">
                          <span>{t.discountedBase || "Discounted Base"}:</span>
                          <span>{(parseFloat(item.basePrice) * (1 - parseFloat(item.discount) / 100)).toFixed(2)} SAR</span>
                        </div>
                        <div className="flex justify-between">
                          <span>{t.vatPercent || "VAT (15%)"}:</span>
                          <span>+{(parseFloat(item.basePrice) * (1 - parseFloat(item.discount) / 100) * 0.15).toFixed(2)} SAR</span>
                        </div>
                      </div>
                    </>
                  ) : (
                    <>
                      <p className="text-2xl font-bold font-mono text-primary">{parseFloat(item.price).toFixed(2)} SAR</p>
                      <div className="text-xs text-muted-foreground font-mono">
                        <div className="flex justify-between">
                          <span>{t.basePrice || "Base Price"}:</span>
                          <span>{parseFloat(item.basePrice).toFixed(2)} SAR</span>
                        </div>
                        <div className="flex justify-between">
                          <span>{t.vatPercent || "VAT (15%)"}:</span>
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
                  <span className="text-sm">{item.available ? (t.available || "Available") : (t.unavailable || "Unavailable")}</span>
                </div>
                <div className="flex gap-1">
                  <Tooltip>
                    <TooltipTrigger asChild>
                      <Button 
                        variant="ghost" 
                        size="icon" 
                        aria-label={t.edit}
                        onClick={() => handleEdit(item)}
                        data-testid={`button-edit-menu-${item.id}`}
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
                        onClick={() => setDeletingItem(item)}
                        data-testid={`button-delete-menu-${item.id}`}
                      >
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    </TooltipTrigger>
                    <TooltipContent>{t.delete}</TooltipContent>
                  </Tooltip>
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
            <AlertDialogTitle>{t.delete || "Delete"} {labels.menuItem}</AlertDialogTitle>
            <AlertDialogDescription>
              {t.confirmDeleteItem || `Are you sure you want to delete this ${labels.menuItem.toLowerCase()}?`} {t.actionCannotBeUndone || "This action cannot be undone."}
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel data-testid="button-cancel-delete">{t.cancel || "Cancel"}</AlertDialogCancel>
            <AlertDialogAction
              onClick={() => deletingItem && deleteMenuItemMutation.mutate(deletingItem.id)}
              disabled={deleteMenuItemMutation.isPending}
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
              data-testid="button-confirm-delete"
            >
              {deleteMenuItemMutation.isPending ? (t.deleting || "Deleting...") : (t.delete || "Delete")}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
