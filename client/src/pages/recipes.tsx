import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Plus, ChefHat } from "lucide-react";

const recipes = [
  {
    id: 1,
    name: "Margherita Pizza",
    prepTime: "15 min",
    cookTime: "12 min",
    servings: 2,
    cost: 25,
    ingredients: [
      { name: "Pizza Dough", quantity: 300, unit: "g" },
      { name: "Tomato Sauce", quantity: 100, unit: "ml" },
      { name: "Mozzarella", quantity: 150, unit: "g" },
      { name: "Fresh Basil", quantity: 10, unit: "leaves" },
      { name: "Olive Oil", quantity: 2, unit: "tbsp" },
    ],
    steps: [
      "Preheat oven to 250°C",
      "Roll out pizza dough to desired thickness",
      "Spread tomato sauce evenly",
      "Add mozzarella cheese",
      "Bake for 10-12 minutes until crust is golden",
      "Garnish with fresh basil and drizzle olive oil",
    ],
  },
  {
    id: 2,
    name: "Chicken Shawarma",
    prepTime: "20 min",
    cookTime: "25 min",
    servings: 4,
    cost: 35,
    ingredients: [
      { name: "Chicken Breast", quantity: 500, unit: "g" },
      { name: "Shawarma Spices", quantity: 3, unit: "tbsp" },
      { name: "Yogurt", quantity: 100, unit: "ml" },
      { name: "Garlic", quantity: 4, unit: "cloves" },
      { name: "Lemon Juice", quantity: 2, unit: "tbsp" },
      { name: "Tahini Sauce", quantity: 150, unit: "ml" },
      { name: "Pita Bread", quantity: 4, unit: "pieces" },
    ],
    steps: [
      "Marinate chicken with spices, yogurt, and garlic for 2 hours",
      "Grill chicken until fully cooked (165°F internal temp)",
      "Slice chicken into thin strips",
      "Warm pita bread",
      "Assemble with tahini sauce and vegetables",
    ],
  },
  {
    id: 3,
    name: "Caesar Salad",
    prepTime: "10 min",
    cookTime: "5 min",
    servings: 2,
    cost: 18,
    ingredients: [
      { name: "Romaine Lettuce", quantity: 200, unit: "g" },
      { name: "Parmesan Cheese", quantity: 50, unit: "g" },
      { name: "Croutons", quantity: 75, unit: "g" },
      { name: "Caesar Dressing", quantity: 100, unit: "ml" },
      { name: "Lemon", quantity: 0.5, unit: "piece" },
    ],
    steps: [
      "Wash and chop romaine lettuce",
      "Toss lettuce with Caesar dressing",
      "Add croutons and shaved Parmesan",
      "Squeeze fresh lemon juice over salad",
      "Serve immediately",
    ],
  },
];

export default function Recipes() {
  return (
    <div className="p-8 space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold mb-2">Recipes</h1>
          <p className="text-muted-foreground">Manage recipes and preparation instructions</p>
        </div>
        <Button data-testid="button-add-recipe">
          <Plus className="h-4 w-4 mr-2" />
          Add Recipe
        </Button>
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
                      <span className="font-mono font-semibold text-primary">Cost: {recipe.cost} SAR</span>
                    </div>
                  </div>
                </div>
                <Button variant="outline" data-testid={`button-edit-recipe-${recipe.id}`}>
                  Edit Recipe
                </Button>
              </div>
            </CardHeader>
            <CardContent>
              <div className="grid md:grid-cols-2 gap-6">
                <div>
                  <h3 className="font-semibold mb-3">Ingredients</h3>
                  <div className="space-y-2">
                    {recipe.ingredients.map((ingredient, idx) => (
                      <div key={idx} className="flex items-center justify-between p-2 rounded-md hover-elevate">
                        <span className="text-sm">{ingredient.name}</span>
                        <Badge variant="secondary" className="font-mono">
                          {ingredient.quantity} {ingredient.unit}
                        </Badge>
                      </div>
                    ))}
                  </div>
                </div>
                <div>
                  <h3 className="font-semibold mb-3">Preparation Steps</h3>
                  <ol className="space-y-3">
                    {recipe.steps.map((step, idx) => (
                      <li key={idx} className="flex gap-3">
                        <span className="flex-shrink-0 h-6 w-6 rounded-full bg-primary/10 flex items-center justify-center text-xs font-bold text-primary">
                          {idx + 1}
                        </span>
                        <span className="text-sm pt-0.5">{step}</span>
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
