import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Plus, ChefHat, Trash2, Download, Upload, FileDown } from "lucide-react";
import { useQuery, useMutation } from "@tanstack/react-query";
import { useToast } from "@/hooks/use-toast";
import { apiRequest, queryClient } from "@/lib/queryClient";
import type { Recipe } from "@shared/schema";

export default function Recipes() {
  const [open, setOpen] = useState(false);
  const [isImporting, setIsImporting] = useState(false);
  const [name, setName] = useState("");
  const [prepTime, setPrepTime] = useState("");
  const [cookTime, setCookTime] = useState("");
  const [servings, setServings] = useState("");
  const [cost, setCost] = useState("");
  const [ingredients, setIngredients] = useState([{ name: "", quantity: "", unit: "" }]);
  const [steps, setSteps] = useState([""]);
  const { toast } = useToast();

  const { data: recipes = [], isLoading } = useQuery<Recipe[]>({
    queryKey: ["/api/recipes"],
  });

  const createRecipeMutation = useMutation({
    mutationFn: async (data: any) => {
      return await apiRequest("/api/recipes", {
        method: "POST",
        body: JSON.stringify(data),
      });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/recipes"] });
      setOpen(false);
      resetForm();
      toast({
        title: "Recipe created",
        description: "The recipe has been added successfully.",
      });
    },
    onError: (error: any) => {
      toast({
        title: "Failed to create recipe",
        description: error.message || "Could not create recipe",
        variant: "destructive",
      });
    },
  });

  const resetForm = () => {
    setName("");
    setPrepTime("");
    setCookTime("");
    setServings("");
    setCost("");
    setIngredients([{ name: "", quantity: "", unit: "" }]);
    setSteps([""]);
  };

  const addIngredient = () => {
    setIngredients([...ingredients, { name: "", quantity: "", unit: "" }]);
  };

  const removeIngredient = (index: number) => {
    setIngredients(ingredients.filter((_, i) => i !== index));
  };

  const updateIngredient = (index: number, field: string, value: string) => {
    const updated = [...ingredients];
    updated[index] = { ...updated[index], [field]: value };
    setIngredients(updated);
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
    createRecipeMutation.mutate({
      name,
      prepTime,
      cookTime,
      servings: parseInt(servings),
      cost,
      ingredients: ingredients.filter(i => i.name && i.quantity),
      steps: steps.filter(s => s.trim() !== ""),
    });
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
      <div className="p-8">
        <h1 className="text-3xl font-bold mb-2">Recipes</h1>
        <p className="text-muted-foreground">Loading...</p>
      </div>
    );
  }

  return (
    <div className="p-8 space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold mb-2">Recipes</h1>
          <p className="text-muted-foreground">Manage recipes and preparation instructions</p>
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
              <Button data-testid="button-add-recipe">
                <Plus className="h-4 w-4 mr-2" />
                Add Recipe
              </Button>
            </DialogTrigger>
          <DialogContent className="max-w-3xl max-h-[90vh] overflow-y-auto">
            <DialogHeader>
              <DialogTitle>Add New Recipe</DialogTitle>
              <DialogDescription>Create a new recipe with ingredients and instructions</DialogDescription>
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
                  <Label htmlFor="cost">Cost per Serving (SAR)</Label>
                  <Input
                    id="cost"
                    type="number"
                    step="0.01"
                    value={cost}
                    onChange={(e) => setCost(e.target.value)}
                    placeholder="e.g., 15.50"
                    required
                    data-testid="input-cost"
                  />
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
                  <div key={index} className="grid grid-cols-12 gap-2">
                    <Input
                      className="col-span-5"
                      value={ingredient.name}
                      onChange={(e) => updateIngredient(index, "name", e.target.value)}
                      placeholder="Ingredient name"
                      data-testid={`input-ingredient-name-${index}`}
                    />
                    <Input
                      className="col-span-3"
                      value={ingredient.quantity}
                      onChange={(e) => updateIngredient(index, "quantity", e.target.value)}
                      placeholder="Quantity"
                      data-testid={`input-ingredient-quantity-${index}`}
                    />
                    <Input
                      className="col-span-3"
                      value={ingredient.unit}
                      onChange={(e) => updateIngredient(index, "unit", e.target.value)}
                      placeholder="Unit"
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
                <Button type="submit" disabled={createRecipeMutation.isPending} data-testid="button-save-recipe">
                  {createRecipeMutation.isPending ? "Creating..." : "Create Recipe"}
                </Button>
              </div>
            </form>
          </DialogContent>
        </Dialog>
        </div>
      </div>

      <div className="grid gap-6">
        {recipes.map((recipe) => (
          <Card key={recipe.id} data-testid={`card-recipe-${recipe.id}`}>
            <CardHeader>
              <div className="flex items-start justify-between gap-4">
                <div className="flex items-center gap-3 flex-1">
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
        ))}
      </div>
    </div>
  );
}
