import { useState, useEffect, useMemo } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle } from "@/components/ui/alert-dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Plus, ChefHat, Trash2, Download, Upload, FileDown, GripVertical, Edit, X } from "lucide-react";
import { useQuery, useMutation } from "@tanstack/react-query";
import { useToast } from "@/hooks/use-toast";
import { apiRequest, queryClient } from "@/lib/queryClient";
import type { Recipe, InventoryItem } from "@shared/schema";
import { useDeviceLayout } from "@/lib/mobileLayout";
import { useLanguage } from "@/contexts/LanguageContext";
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

interface SortableRecipeCardProps {
  recipe: Recipe;
  onEdit: (recipe: Recipe) => void;
  onDelete: (recipe: Recipe) => void;
}

function SortableRecipeCard({ recipe, onEdit, onDelete }: SortableRecipeCardProps) {
  const {
    attributes,
    listeners,
    setNodeRef,
    transform,
    transition,
    isDragging,
  } = useSortable({ id: recipe.id });

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
    opacity: isDragging ? 0.5 : 1,
  };

  return (
    <div ref={setNodeRef} style={style}>
      <Card data-testid={`card-recipe-${recipe.id}`} className={isDragging ? "shadow-lg" : ""}>
        <CardHeader>
          <div className="flex items-start justify-between gap-4">
            <div className="flex items-center gap-3 flex-1">
              <div
                {...attributes}
                {...listeners}
                className="cursor-grab active:cursor-grabbing p-2 hover-elevate active-elevate-2 rounded-md touch-none"
                style={{ minWidth: '44px', minHeight: '44px' }}
                data-testid={`drag-handle-recipe-${recipe.id}`}
              >
                <GripVertical className="h-5 w-5 text-muted-foreground" />
              </div>
              <div className="h-12 w-12 rounded-md bg-primary/10 flex items-center justify-center">
                <ChefHat className="h-6 w-6 text-primary" />
              </div>
              <div>
                <CardTitle className="text-2xl mb-2">{recipe.name}</CardTitle>
                <div className="flex gap-4 text-sm text-muted-foreground">
                  <span>Prep: {recipe.prepTime}</span>
                  <span>Cook: {recipe.cookTime}</span>
                  <span>Servings: {recipe.servings}</span>
                </div>
              </div>
            </div>
            <div className="text-right">
              <div className="flex gap-2 mb-2">
                <Button 
                  variant="ghost" 
                  className="h-[44px] w-[44px]" 
                  onClick={() => onEdit(recipe)}
                  data-testid={`button-edit-recipe-${recipe.id}`}
                >
                  <Edit className="h-4 w-4" />
                </Button>
                <Button 
                  variant="ghost" 
                  className="h-[44px] w-[44px]" 
                  onClick={() => onDelete(recipe)}
                  data-testid={`button-delete-recipe-${recipe.id}`}
                >
                  <Trash2 className="h-4 w-4 text-destructive" />
                </Button>
              </div>
              <p className="text-sm text-muted-foreground mb-1">Cost per Serving</p>
              <p className="text-2xl font-bold font-mono text-primary">{parseFloat(recipe.cost).toFixed(2)} SAR</p>
            </div>
          </div>
        </CardHeader>
        <CardContent>
          <div className="grid md:grid-cols-2 gap-6">
            <div>
              <h4 className="font-semibold mb-3 flex items-center gap-2">
                <Badge variant="secondary">Ingredients</Badge>
              </h4>
              <ul className="space-y-2">
                {recipe.ingredients.map((ingredient, idx) => (
                  <li key={idx} className="text-sm flex justify-between">
                    <span>{ingredient.name}</span>
                    <span className="text-muted-foreground font-mono">
                      {ingredient.quantity} {ingredient.unit}
                    </span>
                  </li>
                ))}
              </ul>
            </div>
            <div>
              <h4 className="font-semibold mb-3 flex items-center gap-2">
                <Badge variant="secondary">Instructions</Badge>
              </h4>
              <ol className="space-y-2 list-decimal list-inside">
                {recipe.steps.map((step, idx) => (
                  <li key={idx} className="text-sm text-muted-foreground">
                    {step}
                  </li>
                ))}
              </ol>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}

export default function Recipes() {
  const layout = useDeviceLayout();
  const [open, setOpen] = useState(false);
  const [isImporting, setIsImporting] = useState(false);
  const [editingRecipe, setEditingRecipe] = useState<Recipe | null>(null);
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [recipeToDelete, setRecipeToDelete] = useState<Recipe | null>(null);
  const [name, setName] = useState("");
  const [prepTime, setPrepTime] = useState("");
  const [cookTime, setCookTime] = useState("");
  const [servings, setServings] = useState("");
  const [ingredients, setIngredients] = useState([{ inventoryItemId: "", name: "", quantity: "", unit: "", unitPrice: 0 }]);
  const [steps, setSteps] = useState([""]);
  const { toast } = useToast();
  const { t } = useLanguage();
  
  // Calculate total cost using useMemo to avoid infinite loops
  const cost = useMemo(() => {
    const totalCost = ingredients.reduce((sum, ingredient) => {
      const quantity = parseFloat(ingredient.quantity) || 0;
      const price = ingredient.unitPrice || 0;
      return sum + (quantity * price);
    }, 0);
    return totalCost.toFixed(2);
  }, [ingredients]);

  const { data: recipesData = [], isLoading } = useQuery<Recipe[]>({
    queryKey: ["/api/recipes"],
  });

  // Sort recipes by sortOrder directly without local state to avoid infinite loops
  const recipes = useMemo(() => {
    if (!recipesData) return [];
    return [...recipesData].sort((a, b) => {
      const orderA = a.sortOrder ?? 0;
      const orderB = b.sortOrder ?? 0;
      return orderA - orderB;
    });
  }, [recipesData]);
  
  const [localRecipes, setLocalRecipes] = useState<Recipe[]>([]);
  
  // Sync localRecipes with recipes when recipes changes
  useEffect(() => {
    setLocalRecipes(recipes);
  }, [recipes]);

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
      return await apiRequest("PATCH", "/api/recipes/sort", { updates });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/recipes"] });
      queryClient.invalidateQueries({ queryKey: ["/api/menu/stock"] });
    },
    onError: (error: any) => {
      toast({
        title: t.failedToUpdateOrder,
        description: error.message || t.couldNotSaveNewOrder,
        variant: "destructive",
      });
    },
  });

  const handleDragEnd = (event: DragEndEvent) => {
    const { active, over } = event;

    if (over && active.id !== over.id) {
      setLocalRecipes((items) => {
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

  const { data: inventoryItems = [], isLoading: isLoadingInventory } = useQuery<InventoryItem[]>({
    queryKey: ["/api/inventory"],
  });

  const createRecipeMutation = useMutation({
    mutationFn: async (data: any) => {
      return await apiRequest("POST", "/api/recipes", data);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/recipes"] });
      queryClient.invalidateQueries({ queryKey: ["/api/menu/stock"] });
      setOpen(false);
      resetForm();
      toast({
        title: t.recipeCreated,
        description: t.recipeCreatedDesc,
      });
    },
    onError: (error: any) => {
      toast({
        title: t.failedToCreateRecipe,
        description: error.message || t.couldNotCreateRecipe,
        variant: "destructive",
      });
    },
  });

  const updateRecipeMutation = useMutation({
    mutationFn: async ({ id, data }: { id: string; data: any }) => {
      return await apiRequest("PATCH", `/api/recipes/${id}`, data);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/recipes"] });
      queryClient.invalidateQueries({ queryKey: ["/api/menu/stock"] });
      setOpen(false);
      setEditingRecipe(null);
      resetForm();
      toast({
        title: t.recipeUpdated,
        description: t.recipeUpdatedDesc,
      });
    },
    onError: (error: any) => {
      toast({
        title: t.failedToUpdateRecipe,
        description: error.message || t.couldNotUpdateRecipe,
        variant: "destructive",
      });
    },
  });

  const deleteRecipeMutation = useMutation({
    mutationFn: async (id: string) => {
      return await apiRequest("DELETE", `/api/recipes/${id}`);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/recipes"] });
      queryClient.invalidateQueries({ queryKey: ["/api/menu/stock"] });
      setDeleteDialogOpen(false);
      setRecipeToDelete(null);
      toast({
        title: t.recipeDeleted,
        description: t.recipeDeletedDesc,
      });
    },
    onError: (error: any) => {
      toast({
        title: t.failedToDeleteRecipe,
        description: error.message || t.couldNotDeleteRecipe,
        variant: "destructive",
      });
    },
  });

  const handleEditRecipe = (recipe: Recipe) => {
    setEditingRecipe(recipe);
    setName(recipe.name);
    setPrepTime(recipe.prepTime);
    setCookTime(recipe.cookTime);
    setServings(recipe.servings.toString());
    // Note: cost is now auto-calculated from ingredients
    setIngredients(recipe.ingredients.map(ing => ({
      inventoryItemId: ing.inventoryItemId,
      name: ing.name,
      quantity: ing.quantity.toString(),
      unit: ing.unit,
      unitPrice: ing.unitPrice
    })));
    setSteps(recipe.steps);
    setOpen(true);
  };

  const handleDeleteClick = (recipe: Recipe) => {
    setRecipeToDelete(recipe);
    setDeleteDialogOpen(true);
  };

  const confirmDelete = () => {
    if (recipeToDelete) {
      deleteRecipeMutation.mutate(recipeToDelete.id);
    }
  };

  const resetForm = () => {
    setName("");
    setPrepTime("");
    setCookTime("");
    setServings("");
    // Note: cost is auto-calculated, no need to reset
    setIngredients([{ inventoryItemId: "", name: "", quantity: "", unit: "", unitPrice: 0 }]);
    setSteps([""]);
    setEditingRecipe(null);
  };

  const addIngredient = () => {
    setIngredients([...ingredients, { inventoryItemId: "", name: "", quantity: "", unit: "", unitPrice: 0 }]);
  };

  const removeIngredient = (index: number) => {
    setIngredients(ingredients.filter((_, i) => i !== index));
  };

  const updateIngredient = (index: number, field: string, value: string | number) => {
    const updated = [...ingredients];
    updated[index] = { ...updated[index], [field]: value };
    setIngredients(updated);
  };

  const selectInventoryItem = (index: number, itemId: string) => {
    const item = inventoryItems.find(i => i.id === itemId);
    if (item) {
      const updated = [...ingredients];
      updated[index] = {
        inventoryItemId: item.id,
        name: item.name,
        quantity: "",
        unit: item.unit,
        unitPrice: parseFloat(item.price),
      };
      setIngredients(updated);
    }
  };


  const addStep = () => {
    setSteps([...steps, ""]);
  };

  const removeStep = (index: number) => {
    setSteps(steps.filter((_, i) => i !== index));
  };

  const updateStep = (index: number, value: string) => {
    const updated = [...steps];
    updated[index] = value;
    setSteps(updated);
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    
    // Validate that all ingredients have inventory items selected
    const invalidIngredients = ingredients.filter(i => i.inventoryItemId && !i.quantity);
    if (invalidIngredients.length > 0) {
      toast({
        title: "Invalid ingredients",
        description: "Please enter quantities for all selected ingredients",
        variant: "destructive",
      });
      return;
    }
    
    const recipeData = {
      name,
      prepTime,
      cookTime,
      servings: parseInt(servings),
      cost,
      ingredients: ingredients.filter(i => i.inventoryItemId && i.quantity).map(i => ({
        inventoryItemId: i.inventoryItemId,
        name: i.name,
        quantity: parseFloat(i.quantity),
        unit: i.unit,
        unitPrice: i.unitPrice,
      })),
      steps: steps.filter(s => s.trim() !== ""),
    };

    if (editingRecipe) {
      updateRecipeMutation.mutate({ id: editingRecipe.id, data: recipeData });
    } else {
      createRecipeMutation.mutate(recipeData);
    }
  };

  const handleDownloadTemplate = async () => {
    try {
      const response = await fetch('/api/templates/recipes');
      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.error || 'Template download failed');
      }
      const blob = await response.blob();
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = 'recipes_template.xlsx';
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
      const response = await fetch('/api/export/recipes');
      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.error || 'Export failed');
      }
      const blob = await response.blob();
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = 'recipes.xlsx';
      document.body.appendChild(a);
      a.click();
      window.URL.revokeObjectURL(url);
      document.body.removeChild(a);
      toast({
        title: "Export successful",
        description: "Recipes exported to Excel",
      });
    } catch (error) {
      toast({
        title: "Export failed",
        description: error instanceof Error ? error.message : "Failed to export recipes",
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
      const response = await fetch('/api/import/recipes', {
        method: 'POST',
        body: formData,
      });
      const result = await response.json();
      
      if (!response.ok) {
        throw new Error(result.error || 'Import failed');
      }
      
      queryClient.invalidateQueries({ queryKey: ["/api/recipes"] });
      queryClient.invalidateQueries({ queryKey: ["/api/menu/stock"] });
      toast({
        title: "Import successful",
        description: result.message || "Recipes imported from Excel",
      });
    } catch (error) {
      toast({
        title: "Import failed",
        description: error instanceof Error ? error.message : "Failed to import recipes",
        variant: "destructive",
      });
    } finally {
      setIsImporting(false);
      event.target.value = '';
    }
  };

  if (isLoading) {
    return (
      <div className={layout.padding}>
        <h1 className={`${layout.text3Xl} font-bold mb-2`}>Recipes</h1>
        <p className="text-muted-foreground">Loading...</p>
      </div>
    );
  }

  return (
    <div className={`${layout.padding} ${layout.spaceY}`}>
      <div className={`flex ${layout.isMobile ? 'flex-col gap-3' : 'items-center justify-between'}`}>
        <div>
          <h1 className={`${layout.text3Xl} font-bold mb-2`}>Recipes</h1>
          <p className="text-muted-foreground">Manage recipes and preparation instructions</p>
        </div>
        <div className="flex gap-2 flex-wrap">
          <Button 
            variant="outline" 
            onClick={handleDownloadTemplate} 
            data-testid="button-download-template"
            className={layout.isMobile ? 'h-[44px]' : ''}
          >
            <FileDown className="h-4 w-4 mr-2" />
            Template
          </Button>
          <Button 
            variant="outline" 
            onClick={handleExport} 
            data-testid="button-export"
            className={layout.isMobile ? 'h-[44px]' : ''}
          >
            <Download className="h-4 w-4 mr-2" />
            Export
          </Button>
          <Button 
            variant="outline" 
            asChild 
            disabled={isImporting}
            className={layout.isMobile ? 'h-[44px]' : ''}
          >
            <label htmlFor="import-recipes" className="cursor-pointer" data-testid="button-import">
              <Upload className="h-4 w-4 mr-2" />
              {isImporting ? "Importing..." : "Import"}
              <input
                id="import-recipes"
                type="file"
                accept=".xlsx,.xls"
                onChange={handleImport}
                className="hidden"
                data-testid="input-import-file"
              />
            </label>
          </Button>
          <Dialog open={open} onOpenChange={setOpen}>
            <DialogTrigger asChild>
              <Button 
                data-testid="button-add-recipe"
                className={layout.isMobile ? 'h-[44px]' : ''}
              >
                <Plus className="h-4 w-4 mr-2" />
                Add Recipe
              </Button>
            </DialogTrigger>
          <DialogContent className="max-w-3xl max-h-[90vh] overflow-y-auto">
            <DialogHeader>
              <DialogTitle>{editingRecipe ? "Edit Recipe" : "Add New Recipe"}</DialogTitle>
              <DialogDescription>{editingRecipe ? "Update the recipe details" : "Create a new recipe with ingredients and instructions"}</DialogDescription>
            </DialogHeader>
            <form onSubmit={handleSubmit} className="space-y-6">
              <div className="grid grid-cols-2 gap-4">
                <div className="col-span-2">
                  <Label htmlFor="name">Recipe Name</Label>
                  <Input
                    id="name"
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                    placeholder="e.g., Chicken Biryani"
                    required
                    data-testid="input-recipe-name"
                  />
                </div>
                <div>
                  <Label htmlFor="prepTime">Prep Time</Label>
                  <Input
                    id="prepTime"
                    value={prepTime}
                    onChange={(e) => setPrepTime(e.target.value)}
                    placeholder="e.g., 30 minutes"
                    required
                    data-testid="input-prep-time"
                  />
                </div>
                <div>
                  <Label htmlFor="cookTime">Cook Time</Label>
                  <Input
                    id="cookTime"
                    value={cookTime}
                    onChange={(e) => setCookTime(e.target.value)}
                    placeholder="e.g., 45 minutes"
                    required
                    data-testid="input-cook-time"
                  />
                </div>
                <div>
                  <Label htmlFor="servings">Servings</Label>
                  <Input
                    id="servings"
                    type="number"
                    value={servings}
                    onChange={(e) => setServings(e.target.value)}
                    placeholder="e.g., 4"
                    required
                    data-testid="input-servings"
                  />
                </div>
                <div>
                  <Label htmlFor="cost">Total Cost (SAR)</Label>
                  <Input
                    id="cost"
                    type="text"
                    value={cost}
                    placeholder="Auto-calculated"
                    disabled
                    readOnly
                    data-testid="input-cost"
                    className="bg-muted"
                  />
                  <p className="text-xs text-muted-foreground mt-1">Calculated from ingredients</p>
                </div>
              </div>

              <div className="space-y-3">
                <div className="flex items-center justify-between">
                  <Label>Ingredients</Label>
                  <Button type="button" size="sm" variant="outline" onClick={addIngredient} data-testid="button-add-ingredient">
                    <Plus className="h-3 w-3 mr-1" />
                    Add Ingredient
                  </Button>
                </div>
                {ingredients.map((ingredient, index) => (
                  <div key={index} className="grid grid-cols-12 gap-2 items-center">
                    <div className="col-span-5">
                      <Select
                        value={ingredient.inventoryItemId}
                        onValueChange={(value) => selectInventoryItem(index, value)}
                      >
                        <SelectTrigger data-testid={`select-ingredient-${index}`}>
                          <SelectValue placeholder="Select ingredient" />
                        </SelectTrigger>
                        <SelectContent>
                          {inventoryItems.map((item) => (
                            <SelectItem key={item.id} value={item.id}>
                              {item.name} ({item.unit}) - {parseFloat(item.price).toFixed(2)} SAR
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>
                    <Input
                      className="col-span-3"
                      type="number"
                      step="0.01"
                      value={ingredient.quantity}
                      onChange={(e) => updateIngredient(index, "quantity", e.target.value)}
                      placeholder="Quantity"
                      disabled={!ingredient.inventoryItemId}
                      data-testid={`input-ingredient-quantity-${index}`}
                    />
                    <Input
                      className="col-span-3"
                      value={ingredient.unit}
                      placeholder="Unit"
                      disabled
                      data-testid={`input-ingredient-unit-${index}`}
                    />
                    <Button
                      type="button"
                      size="icon"
                      variant="ghost"
                      onClick={() => removeIngredient(index)}
                      disabled={ingredients.length === 1}
                      data-testid={`button-remove-ingredient-${index}`}
                    >
                      <Trash2 className="h-4 w-4" />
                    </Button>
                  </div>
                ))}
              </div>

              <div className="space-y-3">
                <div className="flex items-center justify-between">
                  <Label>Preparation Steps</Label>
                  <Button type="button" size="sm" variant="outline" onClick={addStep} data-testid="button-add-step">
                    <Plus className="h-3 w-3 mr-1" />
                    Add Step
                  </Button>
                </div>
                {steps.map((step, index) => (
                  <div key={index} className="flex gap-2">
                    <Textarea
                      className="flex-1"
                      value={step}
                      onChange={(e) => updateStep(index, e.target.value)}
                      placeholder={`Step ${index + 1}`}
                      rows={2}
                      data-testid={`input-step-${index}`}
                    />
                    <Button
                      type="button"
                      size="icon"
                      variant="ghost"
                      onClick={() => removeStep(index)}
                      disabled={steps.length === 1}
                      data-testid={`button-remove-step-${index}`}
                    >
                      <Trash2 className="h-4 w-4" />
                    </Button>
                  </div>
                ))}
              </div>

              <div className="flex justify-end gap-3">
                <Button type="button" variant="outline" onClick={() => setOpen(false)} data-testid="button-cancel">
                  Cancel
                </Button>
                <Button type="submit" disabled={createRecipeMutation.isPending || updateRecipeMutation.isPending} data-testid="button-save-recipe">
                  {editingRecipe 
                    ? (updateRecipeMutation.isPending ? "Updating..." : "Update Recipe")
                    : (createRecipeMutation.isPending ? "Creating..." : "Create Recipe")
                  }
                </Button>
              </div>
            </form>
          </DialogContent>
        </Dialog>
        </div>
      </div>

      <DndContext
        sensors={sensors}
        collisionDetection={closestCenter}
        onDragEnd={handleDragEnd}
      >
        <SortableContext
          items={localRecipes.map((r) => r.id)}
          strategy={verticalListSortingStrategy}
        >
          <div className="grid gap-6">
            {localRecipes.map((recipe) => (
              <SortableRecipeCard key={recipe.id} recipe={recipe} onEdit={handleEditRecipe} onDelete={handleDeleteClick} />
            ))}
          </div>
        </SortableContext>
      </DndContext>

      <AlertDialog open={deleteDialogOpen} onOpenChange={setDeleteDialogOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete Recipe</AlertDialogTitle>
            <AlertDialogDescription>
              Are you sure you want to delete "{recipeToDelete?.name}"? This action cannot be undone.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel data-testid="button-cancel-delete">Cancel</AlertDialogCancel>
            <AlertDialogAction
              onClick={confirmDelete}
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
              data-testid="button-confirm-delete"
            >
              Delete
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
