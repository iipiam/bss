import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardFooter, CardHeader } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Switch } from "@/components/ui/switch";
import { Plus, Search, Edit } from "lucide-react";

const menuItems = [
  { id: 1, name: "Margherita Pizza", category: "Pizza", price: 50, available: true, description: "Classic tomato and mozzarella" },
  { id: 2, name: "Chicken Shawarma", category: "Sandwiches", price: 40, available: true, description: "Grilled chicken with tahini" },
  { id: 3, name: "Beef Burger", category: "Burgers", price: 60, available: true, description: "Angus beef with cheese" },
  { id: 4, name: "Caesar Salad", category: "Salads", price: 40, available: true, description: "Fresh romaine with Caesar dressing" },
  { id: 5, name: "Pepperoni Pizza", category: "Pizza", price: 65, available: false, description: "Tomato, mozzarella, and pepperoni" },
  { id: 6, name: "Falafel Wrap", category: "Sandwiches", price: 35, available: true, description: "Crispy falafel with vegetables" },
  { id: 7, name: "Grilled Salmon", category: "Main Course", price: 95, available: true, description: "Fresh salmon with lemon butter" },
  { id: 8, name: "Greek Salad", category: "Salads", price: 45, available: true, description: "Feta cheese and olives" },
];

export default function Menu() {
  const [searchQuery, setSearchQuery] = useState("");

  return (
    <div className="p-8 space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold mb-2">Menu Management</h1>
          <p className="text-muted-foreground">Manage your menu items and pricing</p>
        </div>
        <Button data-testid="button-add-menu-item">
          <Plus className="h-4 w-4 mr-2" />
          Add Menu Item
        </Button>
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
        {menuItems.map((item) => (
          <Card key={item.id} className="overflow-hidden" data-testid={`card-menu-${item.id}`}>
            <CardHeader className="p-0">
              <div className="aspect-square bg-gradient-to-br from-primary/20 to-primary/5 flex items-center justify-center">
                <div className="text-6xl">🍽️</div>
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
              <p className="text-2xl font-bold font-mono text-primary">{item.price} SAR</p>
            </CardContent>
            <CardFooter className="p-4 pt-0 flex items-center justify-between gap-2">
              <div className="flex items-center gap-2">
                <Switch
                  checked={item.available}
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
