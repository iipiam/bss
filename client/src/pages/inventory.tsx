import { useState, useEffect, useMemo } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent } from "@/components/ui/card";
import { TableList } from "@/components/TableList";
import { useDeviceLayout } from "@/lib/mobileLayout";
import type { TableColumn } from "@/lib/mobileLayout";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  Tabs,
  TabsContent,
  TabsList,
  TabsTrigger,
} from "@/components/ui/tabs";
import { Switch } from "@/components/ui/switch";
import {
  DndContext,
  closestCenter,
  KeyboardSensor,
  PointerSensor,
  useSensor,
  useSensors,
  DragEndEvent,
} from '@dnd-kit/core';
import {
  arrayMove,
  SortableContext,
  sortableKeyboardCoordinates,
  useSortable,
  verticalListSortingStrategy,
} from '@dnd-kit/sortable';
import { CSS } from '@dnd-kit/utilities';
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
} from "@/components/ui/dialog";
import {
  Form,
  FormControl,
  FormDescription,
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
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import {
  Command,
  CommandEmpty,
  CommandGroup,
  CommandInput,
  CommandItem,
} from "@/components/ui/command";
import { Checkbox } from "@/components/ui/checkbox";
import { Tooltip, TooltipProvider, TooltipTrigger, TooltipContent } from "@/components/ui/tooltip";
import { InfoTip } from "@/components/ui/info-tip";
import { Plus, Search, Edit, Trash2, Download, Upload, FileDown, GripVertical, ChevronDown } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { useQuery, useMutation } from "@tanstack/react-query";
import { apiRequest, queryClient } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { insertInventoryItemSchema, insertAddonSchema } from "@shared/schema";
import type { InventoryItem, Addon, MenuItem } from "@shared/schema";
import { z } from "zod";
import { useLanguage } from "@/contexts/LanguageContext";
import { useBusinessType } from "@/hooks/useBusinessType";

// Helper function to format toast messages with business-type-aware labels
const formatToast = (template: string | undefined, label: string | undefined): string => {
  if (!template && !label) return '';
  if (!template) return label ?? '';
  return template.includes('%s') ? template.replace('%s', label ?? '') : template;
};

// Factory function for creating localized inventory form schema
const createFormSchema = (t: any) => insertInventoryItemSchema.omit({ restaurantId: true, purchaseDate: true }).extend({
  quantity: z.coerce.number().positive(t.quantityPositive || "Quantity must be a positive number"),
  referenceQuantity: z.coerce.number().positive(t.referenceQuantityPositive || "Reference quantity must be a positive number"),
  price: z.coerce.number().min(0, t.priceMustBeZeroOrPositive || "Price must be zero or positive"),
  expirationDays: z.coerce.number().min(0, t.expirationDaysMustBeZeroOrPositive || "Expiration days must be zero or positive").nullable().optional(),
});

// Helper function to calculate days remaining until expiration
const calculateDaysRemaining = (purchaseDate: Date | string | null | undefined, expirationDays: number | null | undefined): number | null => {
  if (!purchaseDate || expirationDays === null || expirationDays === undefined) return null;
  const purchase = new Date(purchaseDate);
  const now = new Date();
  const expirationDate = new Date(purchase.getTime() + expirationDays * 24 * 60 * 60 * 1000);
  const daysRemaining = Math.ceil((expirationDate.getTime() - now.getTime()) / (24 * 60 * 60 * 1000));
  return daysRemaining;
};

// Helper to create addon form schema with translations
const createAddonFormSchema = (t: any) => {
  const addonFormSchemaInput = z.object({
    name: z.string().min(1, t.nameRequired),
    category: z.string().min(1, t.categoryRequired),
    price: z.coerce.number().positive(t.priceMustBePositive || "Price must be a positive number"),
    available: z.boolean().default(true),
    menuItemIds: z.array(z.string()).nullable().default(null),
  });

  return addonFormSchemaInput.transform((data) => {
    // Calculate VAT (15% Saudi VAT)
    const price = data.price;
    const basePrice = price / 1.15;
    const vatAmount = price - basePrice;
    
    // Convert empty array to null (meaning "All items")
    const menuItemIds = data.menuItemIds && data.menuItemIds.length > 0 ? data.menuItemIds : null;
    
    return {
      ...data,
      basePrice: basePrice.toFixed(2),
      vatAmount: vatAmount.toFixed(2),
      menuItemIds,
    };
  });
};

// Type for addon form values (input shape)
type AddonFormValues = {
  name: string;
  category: string;
  price: number;
  available: boolean;
  menuItemIds: string[] | null;
};

interface SortableInventoryRowProps {
  item: InventoryItem;
  onEdit: (item: InventoryItem) => void;
  onDelete: (item: InventoryItem) => void;
  disabled?: boolean;
}

function SortableInventoryRow({ item, onEdit, onDelete, disabled = false }: SortableInventoryRowProps) {
  const { t } = useLanguage();
  const {
    attributes,
    listeners,
    setNodeRef,
    transform,
    transition,
    isDragging,
  } = useSortable({ id: item.id, disabled });

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
    opacity: isDragging ? 0.5 : 1,
  };

  const daysRemaining = calculateDaysRemaining(item.purchaseDate, item.expirationDays);

  const getExpirationDisplay = () => {
    if (daysRemaining === null) return <span className="text-muted-foreground">-</span>;
    if (daysRemaining <= 0) return <Badge variant="destructive">{t.expired || "Expired"}</Badge>;
    if (daysRemaining <= 7) return <Badge variant="destructive">{daysRemaining}{t.daysShort || "d"}</Badge>;
    if (daysRemaining <= 30) return <Badge variant="outline" className="border-yellow-500 text-yellow-600">{daysRemaining}{t.daysShort || "d"}</Badge>;
    return <span className="text-muted-foreground">{daysRemaining}{t.daysShort || "d"}</span>;
  };

  const getStatusDisplay = () => {
    if (item.status === "Low Stock") return t.lowStock || "Low Stock";
    if (item.status === "In Stock") return t.inStock || "In Stock";
    if (item.status === "Out of Stock") return t.outOfStock || "Out of Stock";
    return item.status;
  };

  return (
    <TableRow ref={setNodeRef} style={style} data-testid={`row-item-${item.id}`}>
      <TableCell>
        <div className="flex items-center gap-2">
          {!disabled && (
            <div
              {...attributes}
              {...listeners}
              className="cursor-grab active:cursor-grabbing p-1 hover-elevate active-elevate-2 rounded-md touch-none"
              style={{ minWidth: '44px', minHeight: '44px', display: 'flex', alignItems: 'center', justifyContent: 'center' }}
              data-testid={`drag-handle-item-${item.id}`}
            >
              <GripVertical className="h-4 w-4 text-muted-foreground" />
            </div>
          )}
          <span className="font-medium">{item.name}</span>
        </div>
      </TableCell>
      <TableCell>{item.category}</TableCell>
      <TableCell className="font-mono">{parseFloat(item.quantity).toFixed(2)}</TableCell>
      <TableCell>{item.unit}</TableCell>
      <TableCell className="font-mono text-primary">{(parseFloat(item.price || "0") / Math.max(parseFloat(item.quantity || "1"), 0.01)).toFixed(2)} SAR</TableCell>
      <TableCell className="text-muted-foreground">{item.supplier}</TableCell>
      <TableCell>{getExpirationDisplay()}</TableCell>
      <TableCell>
        <Badge variant={item.status === "Low Stock" ? "destructive" : "secondary"}>
          {getStatusDisplay()}
        </Badge>
      </TableCell>
      <TableCell className="text-right">
        <div className="flex justify-end gap-2">
          <Tooltip>
            <TooltipTrigger asChild>
              <Button variant="ghost" className="h-[44px] w-[44px]" onClick={() => onEdit(item)} data-testid={`button-edit-${item.id}`}>
                <Edit className="h-4 w-4" />
              </Button>
            </TooltipTrigger>
            <TooltipContent>Edit item / تعديل العنصر</TooltipContent>
          </Tooltip>
          <Tooltip>
            <TooltipTrigger asChild>
              <Button
                variant="ghost"
                className="h-[44px] w-[44px]"
                onClick={() => onDelete(item)}
                data-testid={`button-delete-${item.id}`}
              >
                <Trash2 className="h-4 w-4 text-destructive" />
              </Button>
            </TooltipTrigger>
            <TooltipContent>Delete this item permanently / حذف نهائي</TooltipContent>
          </Tooltip>
        </div>
      </TableCell>
    </TableRow>
  );
}

function SortableInventoryCard({ item, onEdit, onDelete, disabled = false }: SortableInventoryRowProps) {
  const { t } = useLanguage();
  const {
    attributes,
    listeners,
    setNodeRef,
    transform,
    transition,
    isDragging,
  } = useSortable({ id: item.id, disabled });

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
    opacity: isDragging ? 0.5 : 1,
  };

  const daysRemaining = calculateDaysRemaining(item.purchaseDate, item.expirationDays);

  const getExpirationDisplay = () => {
    if (daysRemaining === null) return null;
    if (daysRemaining <= 0) return <Badge variant="destructive" className="text-xs">{t.expired || "Expired"}</Badge>;
    if (daysRemaining <= 7) return <Badge variant="destructive" className="text-xs">{daysRemaining}{t.daysLeft || "d left"}</Badge>;
    if (daysRemaining <= 30) return <Badge variant="outline" className="border-yellow-500 text-yellow-600 text-xs">{daysRemaining}{t.daysLeft || "d left"}</Badge>;
    return <span className="text-xs text-muted-foreground">{daysRemaining}{t.daysLeft || "d left"}</span>;
  };

  const getStatusDisplay = () => {
    if (item.status === "Low Stock") return t.lowStock || "Low Stock";
    if (item.status === "In Stock") return t.inStock || "In Stock";
    if (item.status === "Out of Stock") return t.outOfStock || "Out of Stock";
    return item.status;
  };

  return (
    <div ref={setNodeRef} style={style}>
      <Card className={isDragging ? "shadow-lg" : "hover-elevate"} data-testid={`card-item-${item.id}`}>
        <CardContent className="p-3">
          <div className="flex justify-between items-start mb-3">
            <div className="flex items-start gap-2 flex-1">
              {!disabled && (
                <div
                  {...attributes}
                  {...listeners}
                  className="cursor-grab active:cursor-grabbing p-2 hover-elevate active-elevate-2 rounded-md touch-none"
                  style={{ minWidth: '44px', minHeight: '44px' }}
                  data-testid={`drag-handle-item-${item.id}`}
                >
                  <GripVertical className="h-5 w-5 text-muted-foreground" />
                </div>
              )}
              <div className="flex-1">
                <h3 className="font-semibold text-base">{item.name}</h3>
                <p className="text-xs text-muted-foreground">{item.category}</p>
              </div>
            </div>
            <div className="flex flex-col items-end gap-1">
              <Badge variant={item.status === "Low Stock" ? "destructive" : "secondary"} className="text-xs">
                {getStatusDisplay()}
              </Badge>
              {getExpirationDisplay()}
            </div>
          </div>
          <div className="grid grid-cols-2 gap-2 mb-3 text-sm">
            <div>
              <span className="text-xs text-muted-foreground">{t.quantity || "Quantity"}:</span>
              <p className="font-mono font-medium">{parseFloat(item.quantity).toFixed(2)} {item.unit}</p>
            </div>
            <div>
              <span className="text-xs text-muted-foreground">{t.pricePerUnit || "Price/Unit"}:</span>
              <p className="font-mono font-medium text-primary">{(parseFloat(item.price || "0") / Math.max(parseFloat(item.quantity || "1"), 0.01)).toFixed(2)} SAR</p>
            </div>
          </div>
          <div className="mb-3">
            <span className="text-xs text-muted-foreground">{t.supplier || "Supplier"}:</span>
            <p className="text-sm">{item.supplier}</p>
          </div>
          <div className="flex gap-2 pt-2 border-t">
            <Button 
              variant="outline" 
              className="flex-1 h-[44px]" 
              onClick={() => onEdit(item)} 
              data-testid={`button-edit-${item.id}`}
            >
              <Edit className="h-4 w-4 mr-1" />
              {t.edit || "Edit"}
            </Button>
            <Button
              variant="outline"
              className="flex-1 h-[44px]"
              onClick={() => onDelete(item)}
              data-testid={`button-delete-${item.id}`}
            >
              <Trash2 className="h-4 w-4 mr-1 text-destructive" />
              {t.delete || "Delete"}
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}

interface SortableAddonRowProps {
  addon: Addon;
  menuItemNames: string;
  onEdit: (addon: Addon) => void;
  onDelete: (addon: Addon) => void;
}

function SortableAddonRow({ addon, menuItemNames, onEdit, onDelete }: SortableAddonRowProps) {
  const { t } = useLanguage();
  
  return (
    <TableRow data-testid={`row-addon-${addon.id}`}>
      <TableCell className="font-medium">{addon.name}</TableCell>
      <TableCell>{addon.category}</TableCell>
      <TableCell className="font-mono text-primary">{parseFloat(addon.price).toFixed(2)} SAR</TableCell>
      <TableCell className="text-muted-foreground">{menuItemNames}</TableCell>
      <TableCell>
        <Badge variant={addon.available ? "secondary" : "outline"}>
          {addon.available ? (t.available || "Available") : (t.unavailable || "Unavailable")}
        </Badge>
      </TableCell>
      <TableCell className="text-right">
        <div className="flex justify-end gap-2">
          <Tooltip>
            <TooltipTrigger asChild>
              <Button variant="ghost" className="h-[44px] w-[44px]" onClick={() => onEdit(addon)} data-testid={`button-edit-addon-${addon.id}`}>
                <Edit className="h-4 w-4" />
              </Button>
            </TooltipTrigger>
            <TooltipContent>Edit add-on / تعديل الإضافة</TooltipContent>
          </Tooltip>
          <Tooltip>
            <TooltipTrigger asChild>
              <Button
                variant="ghost"
                className="h-[44px] w-[44px]"
                onClick={() => onDelete(addon)}
                data-testid={`button-delete-addon-${addon.id}`}
              >
                <Trash2 className="h-4 w-4 text-destructive" />
              </Button>
            </TooltipTrigger>
            <TooltipContent>Delete this add-on permanently / حذف نهائي</TooltipContent>
          </Tooltip>
        </div>
      </TableCell>
    </TableRow>
  );
}

function SortableAddonCard({ addon, menuItemNames, onEdit, onDelete }: SortableAddonRowProps) {
  const { t } = useLanguage();
  
  return (
    <Card className="hover-elevate" data-testid={`card-addon-${addon.id}`}>
      <CardContent className="p-3">
        <div className="flex justify-between items-start mb-3">
          <div className="flex-1">
            <h3 className="font-semibold text-base">{addon.name}</h3>
            <p className="text-xs text-muted-foreground">{addon.category}</p>
          </div>
          <Badge variant={addon.available ? "secondary" : "outline"} className="text-xs">
            {addon.available ? (t.available || "Available") : (t.unavailable || "Unavailable")}
          </Badge>
        </div>
        <div className="grid grid-cols-2 gap-2 mb-3 text-sm">
          <div>
            <span className="text-xs text-muted-foreground">{t.price || "Price"}:</span>
            <p className="font-mono font-medium text-primary">{parseFloat(addon.price).toFixed(2)} SAR</p>
          </div>
          <div>
            <span className="text-xs text-muted-foreground">{t.menuItems || "Menu Items"}:</span>
            <p className="text-sm">{menuItemNames}</p>
          </div>
        </div>
        <div className="flex gap-2 pt-2 border-t">
          <Button 
            variant="outline" 
            className="flex-1 h-[44px]" 
            onClick={() => onEdit(addon)} 
            data-testid={`button-edit-addon-${addon.id}`}
          >
            <Edit className="h-4 w-4 mr-1" />
            {t.edit || "Edit"}
          </Button>
          <Button
            variant="outline"
            className="flex-1 h-[44px]"
            onClick={() => onDelete(addon)}
            data-testid={`button-delete-addon-${addon.id}`}
          >
            <Trash2 className="h-4 w-4 mr-1 text-destructive" />
            {t.delete || "Delete"}
          </Button>
        </div>
      </CardContent>
    </Card>
  );
}

export default function Inventory() {
  const layout = useDeviceLayout();
  const { t } = useLanguage();
  const { labels } = useBusinessType();
  const [searchQuery, setSearchQuery] = useState("");
  const [categoryFilter, setCategoryFilter] = useState("all");
  const [statusFilter, setStatusFilter] = useState("all");
  const [isImporting, setIsImporting] = useState(false);
  const [open, setOpen] = useState(false);
  const [editingItem, setEditingItem] = useState<InventoryItem | null>(null);
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [itemToDelete, setItemToDelete] = useState<InventoryItem | null>(null);
  const { toast } = useToast();

  // Add-ons state
  const [addonSearchQuery, setAddonSearchQuery] = useState("");
  const [addonCategoryFilter, setAddonCategoryFilter] = useState("all");
  const [addonOpen, setAddonOpen] = useState(false);
  const [editingAddon, setEditingAddon] = useState<Addon | null>(null);
  const [addonDeleteDialogOpen, setAddonDeleteDialogOpen] = useState(false);
  const [addonToDelete, setAddonToDelete] = useState<Addon | null>(null);
  
  // State for adding inventory item as addon
  const [addAsAddon, setAddAsAddon] = useState(false);
  const [addonPrice, setAddonPrice] = useState("");

  // Create localized form schema
  const formSchema = useMemo(() => createFormSchema(t), [t]);

  const form = useForm<z.infer<ReturnType<typeof createFormSchema>>>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      name: "",
      category: "",
      quantity: 0,
      unit: "",
      referenceQuantity: 1,
      price: 0,
      supplier: "",
      status: "In Stock",
      branchId: null,
      expirationDays: null,
    },
  });

  // Watch form values for calculating price per unit
  const watchedPrice = form.watch("price");
  const watchedQuantity = form.watch("quantity");
  const watchedUnit = form.watch("unit");
  
  // Calculate price per unit - ALWAYS calculate live from current form values for instant feedback
  const calculatedUnitPrice = (() => {
    const price = parseFloat(String(watchedPrice)) || 0;
    const quantity = parseFloat(String(watchedQuantity)) || 0;
    return quantity > 0 ? (price / quantity).toFixed(2) : "0.00";
  })();

  // Auto-set referenceQuantity to 1 when unit is "pcs" (pieces don't need reference quantity)
  const watchedRefQty = form.watch("referenceQuantity");
  useEffect(() => {
    if (watchedUnit === "pcs" && watchedRefQty !== 1) {
      form.setValue("referenceQuantity", 1, { shouldValidate: false });
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [watchedUnit]);

  const addonFormSchema = createAddonFormSchema(t);

  const addonForm = useForm<AddonFormValues>({
    resolver: zodResolver(addonFormSchema),
    defaultValues: {
      name: "",
      category: "",
      price: 0,
      available: true,
      menuItemIds: null,
    },
  });

  const { data: inventoryItemsData = [], isLoading } = useQuery<InventoryItem[]>({
    queryKey: ["/api/inventory"],
    refetchInterval: 5000, // Refresh every 5 seconds to keep stock levels updated across all pages
  });

  const { data: addonsData = [], isLoading: isLoadingAddons } = useQuery<Addon[]>({
    queryKey: ["/api/addons"],
  });

  const { data: menuItems = [] } = useQuery<MenuItem[]>({
    queryKey: ["/api/menu"],
  });

  const [inventoryItems, setInventoryItems] = useState<InventoryItem[]>([]);

  // Sort inventory items by sortOrder and update local state
  useEffect(() => {
    const sorted = [...inventoryItemsData].sort((a, b) => {
      const orderA = a.sortOrder ?? 0;
      const orderB = b.sortOrder ?? 0;
      return orderA - orderB;
    });
    setInventoryItems(sorted);
  }, [inventoryItemsData]);

  const sensors = useSensors(
    useSensor(PointerSensor, {
      activationConstraint: {
        delay: 250,
        tolerance: 5,
      },
    }),
    useSensor(KeyboardSensor, {
      coordinateGetter: sortableKeyboardCoordinates,
    })
  );

  const updateSortOrderMutation = useMutation({
    mutationFn: async (updates: { id: string; sortOrder: number }[]) => {
      return await apiRequest("PATCH", "/api/inventory/sort", { updates });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/inventory"] });
      queryClient.invalidateQueries({ queryKey: ["/api/menu/stock"] });
    },
    onError: (error: any) => {
      toast({
        title: t.failedToUpdateOrder,
        description: error.message || t.couldNotSaveNewOrder || "Could not save new order",
        variant: "destructive",
      });
    },
  });

  const handleDragEnd = (event: DragEndEvent) => {
    const { active, over } = event;

    if (over && active.id !== over.id) {
      setInventoryItems((items) => {
        const oldIndex = items.findIndex((item) => item.id === active.id);
        const newIndex = items.findIndex((item) => item.id === over.id);
        const newOrder = arrayMove(items, oldIndex, newIndex);

        // Update sortOrder for all affected items
        const updates = newOrder.map((item, index) => ({
          id: item.id,
          sortOrder: index,
        }));

        updateSortOrderMutation.mutate(updates);

        return newOrder;
      });
    }
  };

  const createMutation = useMutation({
    mutationFn: async (data: z.infer<typeof formSchema>) => {
      return await apiRequest("POST", "/api/inventory", {
        name: data.name,
        category: data.category,
        quantity: data.quantity.toFixed(2),
        unit: data.unit,
        referenceQuantity: data.referenceQuantity.toFixed(2),
        price: data.price.toFixed(2),
        supplier: data.supplier,
        status: data.status,
        branchId: data.branchId || null,
        sortOrder: data.sortOrder || 0,
        expirationDays: data.expirationDays ?? null,
      });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/inventory"] });
      queryClient.invalidateQueries({ queryKey: ["/api/menu/stock"] });
      toast({
        title: t.itemCreatedTitle || "Item created",
        description: t.itemAdded || "Inventory item has been added",
      });
      handleCloseDialog();
    },
    onError: (error: Error) => {
      toast({
        title: t.failedToCreateItem,
        description: error.message || t.errorCreatingInventoryItem || "An error occurred while creating the inventory item",
        variant: "destructive",
      });
    },
  });

  const updateMutation = useMutation({
    mutationFn: async ({ id, data }: { id: string; data: z.infer<typeof formSchema> }) => {
      return await apiRequest("PATCH", `/api/inventory/${id}`, {
        name: data.name,
        category: data.category,
        quantity: data.quantity.toFixed(2),
        unit: data.unit,
        referenceQuantity: data.referenceQuantity.toFixed(2),
        price: data.price.toFixed(2),
        supplier: data.supplier,
        status: data.status,
        branchId: data.branchId || null,
        expirationDays: data.expirationDays ?? null,
      });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/inventory"] });
      queryClient.invalidateQueries({ queryKey: ["/api/menu/stock"] });
      toast({
        title: t.itemUpdatedTitle || "Item updated",
        description: t.itemUpdated || "Inventory item has been updated",
      });
      handleCloseDialog();
    },
    onError: (error: Error) => {
      toast({
        title: t.failedToUpdateItem,
        description: error.message || t.errorUpdatingInventoryItem || "An error occurred while updating the inventory item",
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
      queryClient.invalidateQueries({ queryKey: ["/api/menu/stock"] });
      toast({
        title: t.itemDeletedTitle || "Item deleted",
        description: t.itemDeleted || "Inventory item has been removed",
      });
      setDeleteDialogOpen(false);
      setItemToDelete(null);
    },
  });

  // Add-ons mutations
  const createAddonMutation = useMutation({
    mutationFn: async (data: any) => {
      return await apiRequest("POST", "/api/addons", data);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/addons"] });
      toast({
        title: t.addonCreated || "Add-on created",
        description: t.addonAdded || "Add-on has been added successfully",
      });
      handleCloseAddonDialog();
    },
    onError: (error: Error) => {
      toast({
        title: t.failedToCreateAddon,
        description: error.message || t.errorCreatingAddon || "An error occurred while creating the add-on",
        variant: "destructive",
      });
    },
  });

  const updateAddonMutation = useMutation({
    mutationFn: async ({ id, data }: { id: string; data: any }) => {
      return await apiRequest("PATCH", `/api/addons/${id}`, data);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/addons"] });
      toast({
        title: t.addonUpdatedTitle || "Add-on updated",
        description: t.addonUpdated || "Add-on has been updated successfully",
      });
      handleCloseAddonDialog();
    },
    onError: (error: Error) => {
      toast({
        title: t.failedToUpdateAddon,
        description: error.message || t.errorUpdatingAddon || "An error occurred while updating the add-on",
        variant: "destructive",
      });
    },
  });

  const deleteAddonMutation = useMutation({
    mutationFn: async (id: string) => {
      await apiRequest("DELETE", `/api/addons/${id}`);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/addons"] });
      toast({
        title: t.addonDeletedTitle || "Add-on deleted",
        description: t.addonDeleted || "Add-on has been removed successfully",
      });
      setAddonDeleteDialogOpen(false);
      setAddonToDelete(null);
    },
  });

  const handleOpenChange = (isOpen: boolean) => {
    setOpen(isOpen);
    if (!isOpen) {
      setEditingItem(null);
      setAddAsAddon(false);
      setAddonPrice("");
      form.reset();
    }
  };

  const handleCloseDialog = () => {
    setOpen(false);
    setEditingItem(null);
    setAddAsAddon(false);
    setAddonPrice("");
    form.reset();
  };

  const handleEditItem = (item: InventoryItem) => {
    const quantity = parseFloat(item.quantity);
    const price = parseFloat(item.price);
    const referenceQuantity = parseFloat(item.referenceQuantity || "1");
    if (isNaN(quantity)) {
      toast({
        title: t.invalidData || "Invalid data",
        description: t.unableToEditItemInvalidQuantity || "Unable to edit item - invalid quantity value",
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
      referenceQuantity: isNaN(referenceQuantity) ? 1 : referenceQuantity,
      price: isNaN(price) ? 0 : price,
      supplier: item.supplier,
      status: item.status,
      branchId: item.branchId,
      expirationDays: item.expirationDays ?? null,
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

  const onSubmit = async (data: z.infer<typeof formSchema>) => {
    if (editingItem) {
      updateMutation.mutate({ id: editingItem.id, data });
    } else {
      // If addAsAddon is checked, we need to create inventory item first, then addon
      if (addAsAddon && addonPrice) {
        try {
          // Create inventory item first
          const inventoryResult = await apiRequest("POST", "/api/inventory", {
            name: data.name,
            category: data.category,
            quantity: data.quantity.toFixed(2),
            unit: data.unit,
            referenceQuantity: data.referenceQuantity.toFixed(2),
            price: data.price.toFixed(2),
            supplier: data.supplier,
            status: data.status,
            branchId: data.branchId || null,
            sortOrder: data.sortOrder || 0,
            expirationDays: data.expirationDays ?? null,
          });
          
          const inventoryItem = await inventoryResult.json();
          
          // Calculate VAT-inclusive and base prices for addon
          const addonPriceNum = parseFloat(addonPrice) || 0;
          const basePrice = addonPriceNum / 1.15; // Extract base price (price is VAT-inclusive)
          const vatAmount = addonPriceNum - basePrice;
          
          // Create addon linked to inventory item
          await apiRequest("POST", "/api/addons", {
            name: data.name,
            category: data.category,
            price: addonPriceNum.toFixed(2),
            basePrice: basePrice.toFixed(2),
            vatAmount: vatAmount.toFixed(2),
            available: true,
            menuItemIds: null,
            inventoryItemId: inventoryItem.id,
          });
          
          queryClient.invalidateQueries({ queryKey: ["/api/inventory"] });
          queryClient.invalidateQueries({ queryKey: ["/api/addons"] });
          queryClient.invalidateQueries({ queryKey: ["/api/menu/stock"] });
          
          toast({
            title: t.itemCreatedTitle || "Item created",
            description: t.inventoryItemAndAddonAdded || "Inventory item and add-on have been added",
          });
          handleCloseDialog();
        } catch (error: any) {
          toast({
            title: t.failedToCreateItem || "Failed to create item",
            description: error.message || t.anErrorOccurred || "An error occurred",
            variant: "destructive",
          });
        }
      } else {
        createMutation.mutate(data);
      }
    }
  };

  // Add-ons handlers
  const handleOpenAddonChange = (isOpen: boolean) => {
    setAddonOpen(isOpen);
    if (!isOpen) {
      setEditingAddon(null);
      addonForm.reset({
        name: "",
        category: "",
        price: 0,
        available: true,
        menuItemIds: null,
      });
    }
  };

  const handleCloseAddonDialog = () => {
    setAddonOpen(false);
    setEditingAddon(null);
    addonForm.reset({
      name: "",
      category: "",
      price: 0,
      available: true,
      menuItemIds: null,
    });
  };

  const handleEditAddon = (addon: Addon) => {
    const price = parseFloat(addon.price);
    if (isNaN(price)) {
      toast({
        title: t.invalidData || "Invalid data",
        description: t.unableToEditAddonInvalidPrice || "Unable to edit add-on - invalid price value",
        variant: "destructive",
      });
      return;
    }
    
    setEditingAddon(addon);
    addonForm.reset({
      name: addon.name,
      category: addon.category,
      price,
      available: addon.available,
      menuItemIds: addon.menuItemIds || null,
    });
    setAddonOpen(true);
  };

  const handleDeleteAddonClick = (addon: Addon) => {
    setAddonToDelete(addon);
    setAddonDeleteDialogOpen(true);
  };

  const confirmAddonDelete = () => {
    if (addonToDelete) {
      deleteAddonMutation.mutate(addonToDelete.id);
    }
  };

  const onAddonSubmit = (data: any) => {
    if (editingAddon) {
      updateAddonMutation.mutate({ id: editingAddon.id, data });
    } else {
      createAddonMutation.mutate(data);
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
        title: t.exportSuccessful,
        description: t.inventoryDataExported || "Inventory data exported to Excel",
      });
    } catch (error) {
      toast({
        title: t.exportFailed,
        description: error instanceof Error ? error.message : t.failedToExportInventoryData || "Failed to export inventory data",
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
        title: t.templateDownloaded || "Template downloaded",
        description: t.fillTemplateAndImport || "Fill in the template and import it",
      });
    } catch (error) {
      toast({
        title: t.downloadFailed,
        description: error instanceof Error ? error.message : t.failedToDownloadTemplate || "Failed to download template",
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
      queryClient.invalidateQueries({ queryKey: ["/api/menu/stock"] });
      toast({
        title: t.importSuccessful,
        description: result.message || t.inventoryDataImported || "Inventory data imported from Excel",
      });
    } catch (error) {
      toast({
        title: t.importFailed,
        description: error instanceof Error ? error.message : t.failedToImportInventoryData || "Failed to import inventory data",
        variant: "destructive",
      });
    } finally {
      setIsImporting(false);
      event.target.value = '';
    }
  };

  const hasActiveFilters = searchQuery !== "" || categoryFilter !== "all" || statusFilter !== "all";

  const filteredItems = inventoryItems.filter(item => {
    const matchesSearch = item.name.toLowerCase().includes(searchQuery.toLowerCase());
    const matchesCategory = categoryFilter === "all" || item.category.toLowerCase() === categoryFilter;
    const matchesStatus = statusFilter === "all" || 
      (statusFilter === "in-stock" && item.status === "In Stock") ||
      (statusFilter === "low-stock" && item.status === "Low Stock") ||
      (statusFilter === "out-of-stock" && item.status === "Out of Stock");
    return matchesSearch && matchesCategory && matchesStatus;
  });

  // Filter and sort add-ons
  const filteredAddons = addonsData
    .filter(addon => {
      const matchesSearch = addon.name.toLowerCase().includes(addonSearchQuery.toLowerCase());
      const matchesCategory = addonCategoryFilter === "all" || addon.category.toLowerCase() === addonCategoryFilter.toLowerCase();
      return matchesSearch && matchesCategory;
    })
    .sort((a, b) => {
      // Sort by category first, then by name
      if (a.category !== b.category) {
        return a.category.localeCompare(b.category);
      }
      return a.name.localeCompare(b.name);
    });

  // Use full inventory for drag-and-drop when no filters, otherwise use filtered items (but disable drag)
  const displayItems = hasActiveFilters ? filteredItems : inventoryItems;

  if (isLoading || isLoadingAddons) {
    return (
      <div className={layout.padding}>
        <h1 className={`${layout.text3Xl} font-bold mb-2`}>{t.inventoryManagement || "Inventory Management"}</h1>
        <p className="text-muted-foreground">{t.loading || "Loading"}...</p>
      </div>
    );
  }

  return (
    <TooltipProvider delayDuration={150}>
    <div className={`${layout.padding} ${layout.spaceY}`}>
      <div className={`flex ${layout.isMobile ? 'flex-col gap-3' : 'items-center justify-between'}`}>
        <div>
          <h1 className={`${layout.text3Xl} font-bold mb-2`}>{t.inventoryManagement || "Inventory Management"}</h1>
          <p className="text-muted-foreground text-sm">{t.trackAndManageStock || "Track and manage your stock levels and add-ons"}</p>
        </div>
      </div>

      <Tabs defaultValue="inventory" className="w-full">
        <TabsList className="w-full justify-start" data-testid="tabs-inventory">
          <TabsTrigger value="inventory" data-testid="tab-trigger-inventory">
            {t.items || "Items"}
          </TabsTrigger>
          <TabsTrigger value="addons" data-testid="tab-trigger-addons">
            {t.addons || "Add-ons"}
          </TabsTrigger>
        </TabsList>

        <TabsContent value="inventory" className={layout.spaceY}>
          {/* Total Inventory Value Summary */}
          <Card className="bg-gradient-to-r from-primary/5 to-primary/10">
            <CardContent className={`${layout.isMobile ? 'p-3' : 'p-4'} flex ${layout.isMobile ? 'flex-col gap-2' : 'items-center justify-between gap-4'}`}>
              <div className="flex items-center gap-3">
                <div className={`${layout.isMobile ? 'h-10 w-10' : 'h-12 w-12'} rounded-full bg-primary/20 flex items-center justify-center`}>
                  <span className={`${layout.isMobile ? 'text-lg' : 'text-xl'} font-bold text-primary`}>$</span>
                </div>
                <div>
                  <p className="text-xs text-muted-foreground uppercase tracking-wider">{t.totalInventoryValue || "Total Inventory Value"}<InfoTip>Total cost value of all current stock / إجمالي قيمة المخزون الحالي</InfoTip></p>
                  <p className={`${layout.isMobile ? 'text-xl' : 'text-2xl'} font-bold text-primary`} data-testid="total-inventory-value">
                    {inventoryItems.reduce((sum, item) => {
                      // Total Inventory Value = sum of all Total Prices (price field represents total cost of current stock)
                      const price = parseFloat(item.price || "0");
                      return sum + price;
                    }, 0).toLocaleString("en-SA", { minimumFractionDigits: 2, maximumFractionDigits: 2 })} SAR
                  </p>
                </div>
              </div>
              <div className={`flex ${layout.isMobile ? 'justify-between' : 'gap-6'} text-sm`}>
                <div className="text-center">
                  <p className="text-muted-foreground">{t.totalItems || "Items"}<InfoTip>Total number of inventory items / إجمالي عدد الأصناف</InfoTip></p>
                  <p className="font-semibold" data-testid="total-items-count">{inventoryItems.length}</p>
                </div>
                <div className="text-center">
                  <p className="text-muted-foreground">{t.lowStockItems || "Low Stock"}<InfoTip>Items running low and need restocking / أصناف قاربت على النفاد</InfoTip></p>
                  <p className="font-semibold text-destructive" data-testid="low-stock-count">
                    {inventoryItems.filter(i => i.status === "Low Stock").length}
                  </p>
                </div>
                <div className="text-center">
                  <p className="text-muted-foreground">{t.expiringSoon || "Expiring Soon"}<InfoTip>Items expiring within 7 days / أصناف تنتهي صلاحيتها خلال 7 أيام</InfoTip></p>
                  <p className="font-semibold text-yellow-600" data-testid="expiring-soon-count">
                    {inventoryItems.filter(i => {
                      const days = calculateDaysRemaining(i.purchaseDate, i.expirationDays);
                      return days !== null && days > 0 && days <= 7;
                    }).length}
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>

          <div className={`flex gap-2 ${layout.isMobile ? 'flex-wrap' : ''}`}>
            <Button variant="outline" onClick={handleDownloadTemplate} data-testid="button-download-template">
              <FileDown className="h-4 w-4 mr-2" />
              {t.template || "Template"}
            </Button>
            <Button variant="outline" onClick={handleExport} data-testid="button-export">
              <Download className="h-4 w-4 mr-2" />
              {t.export || "Export"}
            </Button>
            <Button variant="outline" asChild disabled={isImporting}>
              <label htmlFor="import-inventory" className="cursor-pointer" data-testid="button-import">
                <Upload className="h-4 w-4 mr-2" />
                {isImporting ? (t.importing || "Importing...") : (t.import || "Import")}
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
            <Button onClick={() => setOpen(true)} data-testid="button-add-item">
              <Plus className="h-4 w-4 mr-2" />
              {t.addItem || "Add Item"}
            </Button>
            <Dialog open={open} onOpenChange={handleOpenChange}>
              <DialogContent className="max-w-md">
                <DialogHeader>
                  <DialogTitle>{editingItem ? (t.editInventoryItem || "Edit Inventory Item") : (t.addNewInventoryItem || "Add New Inventory Item")}</DialogTitle>
                  <DialogDescription>
                    {editingItem ? (t.updateInventoryItemDetails || "Update the inventory item details") : (t.addNewItemToInventory || "Add a new item to your inventory")}
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
                            <Input {...field} placeholder={t.itemNamePlaceholder || "e.g., Tomatoes"} data-testid="input-item-name" />
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
                            <FormLabel>{t.category || "Category"}</FormLabel>
                            <Select onValueChange={field.onChange} value={field.value}>
                              <FormControl>
                                <SelectTrigger data-testid="select-item-category">
                                  <SelectValue placeholder={t.selectCategory || "Select category"} />
                                </SelectTrigger>
                              </FormControl>
                              <SelectContent>
                                <SelectItem value="Vegetables">{t.vegetables || "Vegetables"}</SelectItem>
                                <SelectItem value="Meat">{t.meat || "Meat"}</SelectItem>
                                <SelectItem value="Dairy">{t.dairy || "Dairy"}</SelectItem>
                                <SelectItem value="Grains">{t.grains || "Grains"}</SelectItem>
                                <SelectItem value="Oils">{t.oils || "Oils"}</SelectItem>
                                <SelectItem value="Spices">{t.spices || "Spices"}</SelectItem>
                                <SelectItem value="Packaging">{t.packaging || "Packaging"}</SelectItem>
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
                            <FormLabel>{t.unit || "Unit"}</FormLabel>
                            <Select onValueChange={field.onChange} value={field.value}>
                              <FormControl>
                                <SelectTrigger data-testid="select-item-unit">
                                  <SelectValue placeholder={t.selectUnit || "Select unit"} />
                                </SelectTrigger>
                              </FormControl>
                              <SelectContent>
                                <SelectItem value="kg">{t.kg || "kg"}</SelectItem>
                                <SelectItem value="g">{t.g || "g"}</SelectItem>
                                <SelectItem value="l">{t.l || "l"}</SelectItem>
                                <SelectItem value="ml">{t.ml || "ml"}</SelectItem>
                                <SelectItem value="pcs">{t.pcs || "pcs"}</SelectItem>
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
                        name="quantity"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>{t.quantity || "Quantity"}</FormLabel>
                            <FormControl>
                              <Input {...field} type="number" step="0.01" placeholder="0.00" data-testid="input-item-quantity" />
                            </FormControl>
                            <FormMessage />
                          </FormItem>
                        )}
                      />
                      <FormField
                        control={form.control}
                        name="referenceQuantity"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>{t.referenceQuantity || "Reference Quantity"}<InfoTip>Base unit used for cost calculation (e.g., 1 kg) / الوحدة الأساسية لحساب التكلفة</InfoTip></FormLabel>
                            <FormControl>
                              {watchedUnit === "pcs" ? (
                                <Input 
                                  value={t.notApplicable || "N/A"} 
                                  disabled 
                                  className="bg-muted"
                                  data-testid="input-item-reference-quantity" 
                                />
                              ) : (
                                <Input {...field} type="number" step="0.01" placeholder="1" data-testid="input-item-reference-quantity" />
                              )}
                            </FormControl>
                            <FormDescription className="text-xs">
                              {watchedUnit === "pcs" 
                                ? (t.referenceQuantityNotApplicable || "Not applicable for pieces")
                                : (t.referenceQuantityHint || "Base unit for cost calculation (e.g., 1 kg)")}
                            </FormDescription>
                            <FormMessage />
                          </FormItem>
                        )}
                      />
                    </div>
                    
                    {/* Price per Unit - Calculated automatically */}
                    <div className="space-y-2">
                      <label className="text-sm font-medium">{t.pricePerUnit || "Price per Unit (SAR)"}<InfoTip>Auto-calculated as Total Price ÷ Quantity / يُحسب تلقائيًا</InfoTip></label>
                      <div className="flex items-center gap-2">
                        <Input 
                          value={calculatedUnitPrice} 
                          readOnly 
                          disabled
                          className="bg-muted"
                          data-testid="display-price-per-unit"
                        />
                        {watchedUnit && <span className="text-sm text-muted-foreground">/ {watchedUnit}</span>}
                      </div>
                      <p className="text-xs text-muted-foreground">
                        {t.pricePerUnitHint || "Automatically calculated: Total Price ÷ Quantity"}
                      </p>
                    </div>
                    
                    <FormField
                      control={form.control}
                      name="price"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>{t.totalPrice || "Total Price (SAR)"}<InfoTip>Total purchase price for the entire quantity / السعر الإجمالي للكمية كلها</InfoTip></FormLabel>
                          <FormControl>
                            <Input {...field} type="number" step="0.01" placeholder="0.00" data-testid="input-item-price" />
                          </FormControl>
                          <FormDescription className="text-xs">
                            {t.totalPriceHint || "Total price for the entire quantity"}
                          </FormDescription>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                    <FormField
                      control={form.control}
                      name="expirationDays"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>{t.expirationDays || "Expiration Days"}<InfoTip>Days until this item expires after purchase / عدد أيام الصلاحية بعد الشراء</InfoTip></FormLabel>
                          <FormControl>
                            <Input 
                              {...field} 
                              type="number" 
                              min="0"
                              placeholder="e.g., 30" 
                              value={field.value ?? ""}
                              onChange={(e) => field.onChange(e.target.value === "" ? null : parseInt(e.target.value))}
                              data-testid="input-item-expiration-days" 
                            />
                          </FormControl>
                          <FormDescription className="text-xs">
                            {t.expirationDaysHint || "Number of days until this item expires (leave empty if no expiration)"}
                          </FormDescription>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                    <FormField
                      control={form.control}
                      name="supplier"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>{t.supplier || "Supplier"}</FormLabel>
                          <FormControl>
                            <Input {...field} placeholder={t.supplierPlaceholder || "e.g., ABC Suppliers"} data-testid="input-item-supplier" />
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
                          <FormLabel>{t.status || "Status"}<InfoTip>Current stock status: In Stock, Low Stock, or Out of Stock / حالة المخزون</InfoTip></FormLabel>
                          <Select onValueChange={field.onChange} value={field.value}>
                            <FormControl>
                              <SelectTrigger data-testid="select-item-status">
                                <SelectValue placeholder={t.selectStatus || "Select status"} />
                              </SelectTrigger>
                            </FormControl>
                            <SelectContent>
                              <SelectItem value="In Stock">{t.inStock || "In Stock"}</SelectItem>
                              <SelectItem value="Low Stock">{t.lowStock || "Low Stock"}</SelectItem>
                              <SelectItem value="Out of Stock">{t.outOfStock || "Out of Stock"}</SelectItem>
                            </SelectContent>
                          </Select>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                    
                    {/* Add as Add-on option - only for new items */}
                    {!editingItem && (
                      <div className="space-y-3 border-t pt-4">
                        <div className="flex items-center space-x-3">
                          <Checkbox
                            id="add-as-addon"
                            checked={addAsAddon}
                            onCheckedChange={(checked) => setAddAsAddon(checked === true)}
                            data-testid="checkbox-add-as-addon"
                          />
                          <label
                            htmlFor="add-as-addon"
                            className="text-sm font-medium cursor-pointer"
                          >
                            {t.alsoAddAsAddon || "Also add as Add-on"}
                          </label>
                        </div>
                        {addAsAddon && (
                          <div className="ml-6">
                            <label className="text-sm font-medium">{t.addonPrice || "Add-on Price (SAR)"}</label>
                            <Input
                              type="number"
                              step="0.01"
                              min="0"
                              placeholder="e.g., 5.00"
                              value={addonPrice}
                              onChange={(e) => setAddonPrice(e.target.value)}
                              className="mt-1"
                              data-testid="input-addon-price"
                            />
                            <p className="text-xs text-muted-foreground mt-1">
                              {t.addonPriceHint || "VAT-inclusive price for this add-on in POS"}
                            </p>
                          </div>
                        )}
                      </div>
                    )}
                    
                    <div className="flex justify-end gap-2 pt-4">
                      <Button type="button" variant="outline" onClick={handleCloseDialog} data-testid="button-cancel">
                        {t.cancel || "Cancel"}
                      </Button>
                      <Button type="submit" data-testid="button-save-item" disabled={createMutation.isPending || updateMutation.isPending}>
                        {editingItem ? (t.updateItem || "Update Item") : (t.createItem || "Create Item")}
                      </Button>
                    </div>
                  </form>
                </Form>
              </DialogContent>
            </Dialog>
          </div>

          <Card className={layout.cardPadding}>
            <div className={`flex ${layout.isMobile ? 'flex-col' : 'gap-4'} ${layout.isMobile ? 'space-y-3' : ''} mb-4`}>
              <div className="relative flex-1">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                <Input
                  placeholder={t.searchItems || "Search items..."}
                  className="pl-10"
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  data-testid="input-search"
                />
              </div>
              <Select value={categoryFilter} onValueChange={setCategoryFilter}>
                <SelectTrigger className={layout.isMobile ? "w-full" : "w-48"} data-testid="select-category">
                  <SelectValue placeholder={t.category || "Category"} />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">{t.allCategories || "All Categories"}</SelectItem>
                  <SelectItem value="vegetables">{t.vegetables || "Vegetables"}</SelectItem>
                  <SelectItem value="meat">{t.meat || "Meat"}</SelectItem>
                  <SelectItem value="dairy">{t.dairy || "Dairy"}</SelectItem>
                  <SelectItem value="grains">{t.grains || "Grains"}</SelectItem>
                  <SelectItem value="oils">{t.oils || "Oils"}</SelectItem>
                  <SelectItem value="packaging">{t.packaging || "Packaging"}</SelectItem>
                </SelectContent>
              </Select>
              <Select value={statusFilter} onValueChange={setStatusFilter}>
                <SelectTrigger className={layout.isMobile ? "w-full" : "w-48"} data-testid="select-status">
                  <SelectValue placeholder={t.status || "Status"} />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">{t.allStatus || "All Status"}</SelectItem>
                  <SelectItem value="in-stock">{t.inStock || "In Stock"}</SelectItem>
                  <SelectItem value="low-stock">{t.lowStock || "Low Stock"}</SelectItem>
                  <SelectItem value="out-of-stock">{t.outOfStock || "Out of Stock"}</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <DndContext
              sensors={sensors}
              collisionDetection={closestCenter}
              onDragEnd={handleDragEnd}
            >
              <SortableContext
                items={displayItems.map(item => item.id)}
                strategy={verticalListSortingStrategy}
              >
                {!layout.isMobile ? (
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>{t.itemName || "Item Name"}</TableHead>
                        <TableHead>{t.category || "Category"}</TableHead>
                        <TableHead>{t.quantity || "Quantity"}</TableHead>
                        <TableHead>{t.unit || "Unit"}</TableHead>
                        <TableHead>{t.pricePerUnit || "Price/Unit"}</TableHead>
                        <TableHead>{t.supplier || "Supplier"}</TableHead>
                        <TableHead>{t.expires || "Expires"}</TableHead>
                        <TableHead>{t.status || "Status"}</TableHead>
                        <TableHead className="text-right">{t.actions || "Actions"}</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {displayItems.map((item) => (
                        <SortableInventoryRow
                          key={item.id}
                          item={item}
                          onEdit={handleEditItem}
                          onDelete={handleDeleteClick}
                          disabled={hasActiveFilters}
                        />
                      ))}
                    </TableBody>
                  </Table>
                ) : (
                  <div className="space-y-3">
                    {displayItems.map((item) => (
                      <SortableInventoryCard
                        key={item.id}
                        item={item}
                        onEdit={handleEditItem}
                        onDelete={handleDeleteClick}
                        disabled={hasActiveFilters}
                      />
                    ))}
                  </div>
                )}
              </SortableContext>
            </DndContext>
          </Card>

          <AlertDialog open={deleteDialogOpen} onOpenChange={setDeleteDialogOpen}>
            <AlertDialogContent>
              <AlertDialogHeader>
                <AlertDialogTitle>{t.areYouSure || "Are you sure?"}</AlertDialogTitle>
                <AlertDialogDescription>
                  {t.permanentlyDeleteFromInventory || "This will permanently delete"} <strong>{itemToDelete?.name}</strong> {t.fromYourInventory || "from your inventory."} {t.actionCannotBeUndone || "This action cannot be undone."}
                </AlertDialogDescription>
              </AlertDialogHeader>
              <AlertDialogFooter>
                <AlertDialogCancel data-testid="button-cancel-delete">{t.cancel || "Cancel"}</AlertDialogCancel>
                <AlertDialogAction onClick={confirmDelete} data-testid="button-confirm-delete">
                  {t.delete || "Delete"}
                </AlertDialogAction>
              </AlertDialogFooter>
            </AlertDialogContent>
          </AlertDialog>
        </TabsContent>

        <TabsContent value="addons" className={layout.spaceY}>
          <div className={`flex gap-2 ${layout.isMobile ? 'flex-wrap' : ''}`}>
            <Button onClick={() => setAddonOpen(true)} data-testid="button-add-addon">
              <Plus className="h-4 w-4 mr-2" />
              {t.addAddon || "Add Add-on"}
            </Button>
            <Dialog open={addonOpen} onOpenChange={handleOpenAddonChange}>
              <DialogContent className="max-w-md">
                <DialogHeader>
                  <DialogTitle>{editingAddon ? (t.editAddon || "Edit Add-on") : (t.addAddon || "Add Add-on")}</DialogTitle>
                  <DialogDescription>
                    {editingAddon ? (t.updateAddonDetails || "Update the add-on details") : (t.addNewAddonToMenu || "Add a new add-on to your menu")}
                  </DialogDescription>
                </DialogHeader>
                <Form {...addonForm}>
                  <form onSubmit={addonForm.handleSubmit(onAddonSubmit)} className="space-y-4">
                    <FormField
                      control={addonForm.control}
                      name="name"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>{t.addonName || "Add-on Name"}</FormLabel>
                          <FormControl>
                            <Input {...field} placeholder={t.addonNamePlaceholder || "e.g., Extra Cheese"} data-testid="input-addon-name" />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                    <FormField
                      control={addonForm.control}
                      name="category"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>{t.addonCategory || "Add-on Category"}</FormLabel>
                          <Select onValueChange={field.onChange} value={field.value}>
                            <FormControl>
                              <SelectTrigger data-testid="select-addon-category">
                                <SelectValue placeholder={t.selectCategory || "Select category"} />
                              </SelectTrigger>
                            </FormControl>
                            <SelectContent>
                              <SelectItem value="Toppings">{t.toppings || "Toppings"}</SelectItem>
                              <SelectItem value="Sides">{t.sides || "Sides"}</SelectItem>
                              <SelectItem value="Sauces">{t.sauces || "Sauces"}</SelectItem>
                              <SelectItem value="Extras">{t.extras || "Extras"}</SelectItem>
                              <SelectItem value="Drinks">{t.drinks || "Drinks"}</SelectItem>
                            </SelectContent>
                          </Select>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                    <FormField
                      control={addonForm.control}
                      name="price"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>{t.addonPrice || "Add-on Price"} ({t.sarInclVat || "SAR, incl. VAT"})</FormLabel>
                          <FormControl>
                            <Input {...field} type="number" step="0.01" placeholder="0.00" data-testid="input-addon-price" />
                          </FormControl>
                          <FormMessage />
                          <p className="text-xs text-muted-foreground">{t.vatCalculatedAutomatically || "VAT (15%) will be calculated automatically"}</p>
                        </FormItem>
                      )}
                    />
                    <FormField
                      control={addonForm.control}
                      name="menuItemIds"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>{t.linkToMenuItems || "Link to Menu Items"} ({t.optional || "Optional"})</FormLabel>
                          <Popover>
                            <PopoverTrigger asChild>
                              <FormControl>
                                <Button 
                                  variant="outline" 
                                  className="h-[44px] w-full justify-between"
                                  data-testid="button-select-menu-items"
                                >
                                  {field.value && field.value.length > 0
                                    ? field.value.length === 1
                                      ? menuItems.find(item => item.id === field.value![0])?.name || (t.oneItemSelected || "1 item selected")
                                      : field.value.length === 2
                                        ? menuItems.filter(item => field.value!.includes(item.id)).map(item => item.name).join(", ")
                                        : `${field.value.length} ${t.itemsSelected || "items selected"}`
                                    : (t.all || "All")}
                                  <ChevronDown className="ml-2 h-4 w-4 opacity-50" />
                                </Button>
                              </FormControl>
                            </PopoverTrigger>
                            <PopoverContent className="w-full p-0" align="start">
                              <Command>
                                <CommandInput placeholder={t.searchMenuItems || "Search menu items..."} data-testid="input-search-menu-items" />
                                <CommandEmpty>{t.noMenuItemsFound || "No menu items found."}</CommandEmpty>
                                <CommandGroup className="max-h-64 overflow-auto">
                                  <CommandItem
                                    onSelect={() => {
                                      field.onChange(null);
                                    }}
                                    className="cursor-pointer"
                                    data-testid="command-item-all"
                                  >
                                    <Checkbox
                                      checked={!field.value || field.value.length === 0}
                                      className="mr-2"
                                    />
                                    <span>{t.all || "All"}</span>
                                  </CommandItem>
                                  {menuItems.map((item) => (
                                    <CommandItem
                                      key={item.id}
                                      onSelect={() => {
                                        const currentValue = field.value || [];
                                        const newValue = currentValue.includes(item.id)
                                          ? currentValue.filter((id) => id !== item.id)
                                          : [...currentValue, item.id];
                                        field.onChange(newValue.length > 0 ? newValue : null);
                                      }}
                                      className="cursor-pointer"
                                      data-testid={`command-item-${item.id}`}
                                    >
                                      <Checkbox
                                        checked={field.value?.includes(item.id) || false}
                                        className="mr-2"
                                      />
                                      <span>{item.name}</span>
                                    </CommandItem>
                                  ))}
                                </CommandGroup>
                              </Command>
                            </PopoverContent>
                          </Popover>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                    <FormField
                      control={addonForm.control}
                      name="available"
                      render={({ field }) => (
                        <FormItem className="flex items-center justify-between rounded-md border p-3">
                          <div>
                            <FormLabel className="text-base">{t.available || "Available"}</FormLabel>
                            <p className="text-xs text-muted-foreground">{t.makeAddonAvailableForOrders || "Make this add-on available for orders"}</p>
                          </div>
                          <FormControl>
                            <Switch
                              checked={field.value}
                              onCheckedChange={field.onChange}
                              data-testid="switch-addon-available"
                            />
                          </FormControl>
                        </FormItem>
                      )}
                    />
                    <div className="flex justify-end gap-2 pt-4">
                      <Button type="button" variant="outline" onClick={handleCloseAddonDialog} data-testid="button-cancel-addon">
                        {t.cancel || "Cancel"}
                      </Button>
                      <Button type="submit" data-testid="button-save-addon" disabled={createAddonMutation.isPending || updateAddonMutation.isPending}>
                        {editingAddon ? (t.save || "Save") : (t.add || "Add")}
                      </Button>
                    </div>
                  </form>
                </Form>
              </DialogContent>
            </Dialog>
          </div>

          <Card className={layout.cardPadding}>
            <div className={`flex ${layout.isMobile ? 'flex-col' : 'gap-4'} ${layout.isMobile ? 'space-y-3' : ''} mb-4`}>
              <div className="relative flex-1">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                <Input
                  placeholder={t.searchAddons || "Search add-ons..."}
                  className="pl-10"
                  value={addonSearchQuery}
                  onChange={(e) => setAddonSearchQuery(e.target.value)}
                  data-testid="input-search-addons"
                />
              </div>
              <Select value={addonCategoryFilter} onValueChange={setAddonCategoryFilter}>
                <SelectTrigger className={layout.isMobile ? "w-full" : "w-48"} data-testid="select-addon-category-filter">
                  <SelectValue placeholder={t.category || "Category"} />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">{t.allCategories || "All Categories"}</SelectItem>
                  <SelectItem value="Toppings">{t.toppings || "Toppings"}</SelectItem>
                  <SelectItem value="Sides">{t.sides || "Sides"}</SelectItem>
                  <SelectItem value="Sauces">{t.sauces || "Sauces"}</SelectItem>
                  <SelectItem value="Extras">{t.extras || "Extras"}</SelectItem>
                  <SelectItem value="Drinks">{t.drinks || "Drinks"}</SelectItem>
                </SelectContent>
              </Select>
            </div>

            {!layout.isMobile ? (
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>{t.addonName || "Add-on Name"}</TableHead>
                    <TableHead>{t.category || "Category"}</TableHead>
                    <TableHead>{t.price || "Price"}</TableHead>
                    <TableHead>{t.menuItem || "Menu Item"}</TableHead>
                    <TableHead>{t.status || "Status"}</TableHead>
                    <TableHead className="text-right">{t.actions || "Actions"}</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {filteredAddons.length === 0 ? (
                    <TableRow>
                      <TableCell colSpan={6} className="text-center text-muted-foreground">
                        {t.noAddonsAvailable || "No add-ons available"}
                      </TableCell>
                    </TableRow>
                  ) : (
                    filteredAddons.map((addon) => {
                      const linkedMenuItemNames = addon.menuItemIds && addon.menuItemIds.length > 0
                        ? addon.menuItemIds.length > 2
                          ? `${addon.menuItemIds.length} ${t.itemsCount || "items"}`
                          : menuItems
                              .filter(item => addon.menuItemIds!.includes(item.id))
                              .map(item => item.name)
                              .join(", ")
                        : (t.all || "All");
                      return (
                        <SortableAddonRow
                          key={addon.id}
                          addon={addon}
                          menuItemNames={linkedMenuItemNames}
                          onEdit={handleEditAddon}
                          onDelete={handleDeleteAddonClick}
                        />
                      );
                    })
                  )}
                </TableBody>
              </Table>
            ) : (
              <div className="space-y-3">
                {filteredAddons.length === 0 ? (
                  <div className="text-center text-muted-foreground py-8">
                    {t.noAddonsAvailable || "No add-ons available"}
                  </div>
                ) : (
                  filteredAddons.map((addon) => {
                    const linkedMenuItemNames = addon.menuItemIds && addon.menuItemIds.length > 0
                      ? addon.menuItemIds.length > 2
                        ? `${addon.menuItemIds.length} ${t.itemsCount || "items"}`
                        : menuItems
                            .filter(item => addon.menuItemIds!.includes(item.id))
                            .map(item => item.name)
                            .join(", ")
                      : (t.all || "All");
                    return (
                      <SortableAddonCard
                        key={addon.id}
                        addon={addon}
                        menuItemNames={linkedMenuItemNames}
                        onEdit={handleEditAddon}
                        onDelete={handleDeleteAddonClick}
                      />
                    );
                  })
                )}
              </div>
            )}
          </Card>

          <AlertDialog open={addonDeleteDialogOpen} onOpenChange={setAddonDeleteDialogOpen}>
            <AlertDialogContent>
              <AlertDialogHeader>
                <AlertDialogTitle>{t.areYouSure || "Are you sure?"}</AlertDialogTitle>
                <AlertDialogDescription>
                  {t.permanentlyDeleteFromAddons || "This will permanently delete"} <strong>{addonToDelete?.name}</strong> {t.fromYourAddons || "from your add-ons."} {t.actionCannotBeUndone || "This action cannot be undone."}
                </AlertDialogDescription>
              </AlertDialogHeader>
              <AlertDialogFooter>
                <AlertDialogCancel data-testid="button-cancel-delete-addon">{t.cancel || "Cancel"}</AlertDialogCancel>
                <AlertDialogAction onClick={confirmAddonDelete} data-testid="button-confirm-delete-addon">
                  {t.delete || "Delete"}
                </AlertDialogAction>
              </AlertDialogFooter>
            </AlertDialogContent>
          </AlertDialog>
        </TabsContent>
      </Tabs>
    </div>
    </TooltipProvider>
  );
}
