import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Plus, Minus, X, Search, Receipt } from "lucide-react";
import { Separator } from "@/components/ui/separator";

const categories = ["All", "Pizza", "Burgers", "Sandwiches", "Salads", "Drinks"];

const menuItems = [
  { id: 1, name: "Margherita Pizza", category: "Pizza", price: 50 },
  { id: 2, name: "Pepperoni Pizza", category: "Pizza", price: 65 },
  { id: 3, name: "Beef Burger", category: "Burgers", price: 60 },
  { id: 4, name: "Chicken Burger", category: "Burgers", price: 55 },
  { id: 5, name: "Chicken Shawarma", category: "Sandwiches", price: 40 },
  { id: 6, name: "Falafel Wrap", category: "Sandwiches", price: 35 },
  { id: 7, name: "Caesar Salad", category: "Salads", price: 40 },
  { id: 8, name: "Greek Salad", category: "Salads", price: 45 },
  { id: 9, name: "Coca Cola", category: "Drinks", price: 10 },
  { id: 10, name: "Fresh Juice", category: "Drinks", price: 15 },
];

export default function POS() {
  const [cartItems, setCartItems] = useState<Array<{ id: number; name: string; price: number; quantity: number }>>([]);
  const [selectedCategory, setSelectedCategory] = useState("All");

  const addToCart = (item: typeof menuItems[0]) => {
    const existing = cartItems.find(ci => ci.id === item.id);
    if (existing) {
      setCartItems(cartItems.map(ci =>
        ci.id === item.id ? { ...ci, quantity: ci.quantity + 1 } : ci
      ));
    } else {
      setCartItems([...cartItems, { ...item, quantity: 1 }]);
    }
  };

  const updateQuantity = (id: number, delta: number) => {
    setCartItems(cartItems.map(item =>
      item.id === id ? { ...item, quantity: Math.max(0, item.quantity + delta) } : item
    ).filter(item => item.quantity > 0));
  };

  const removeItem = (id: number) => {
    setCartItems(cartItems.filter(item => item.id !== id));
  };

  const clearCart = () => {
    setCartItems([]);
  };

  const subtotal = cartItems.reduce((sum, item) => sum + (item.price * item.quantity), 0);
  const tax = subtotal * 0.15;
  const total = subtotal + tax;

  const filteredItems = selectedCategory === "All"
    ? menuItems
    : menuItems.filter(item => item.category === selectedCategory);

  const handleCheckout = () => {
    console.log("Processing checkout with ZATCA-compliant invoice...");
    alert(`Checkout complete!\nTotal: ${total.toFixed(2)} SAR\nInvoice will be generated with QR code and VAT details.`);
    clearCart();
  };

  return (
    <div className="h-screen flex">
      <div className="flex-1 p-6 overflow-auto">
        <h1 className="text-3xl font-bold mb-6">Point of Sale</h1>

        <div className="mb-6">
          <div className="relative mb-4">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <Input
              placeholder="Search items..."
              className="pl-10"
              data-testid="input-search-pos"
            />
          </div>

          <Tabs value={selectedCategory} onValueChange={setSelectedCategory}>
            <TabsList className="w-full justify-start">
              {categories.map(cat => (
                <TabsTrigger key={cat} value={cat} data-testid={`tab-category-${cat.toLowerCase()}`}>
                  {cat}
                </TabsTrigger>
              ))}
            </TabsList>
          </Tabs>
        </div>

        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
          {filteredItems.map(item => (
            <Card
              key={item.id}
              className="cursor-pointer hover-elevate active-elevate-2"
              onClick={() => addToCart(item)}
              data-testid={`card-pos-item-${item.id}`}
            >
              <CardHeader className="p-4 pb-2">
                <div className="aspect-square bg-gradient-to-br from-primary/20 to-primary/5 rounded-md flex items-center justify-center mb-2">
                  <span className="text-4xl">🍽️</span>
                </div>
              </CardHeader>
              <CardContent className="p-4 pt-0">
                <p className="font-semibold mb-1 line-clamp-2">{item.name}</p>
                <p className="text-xl font-bold font-mono text-primary">{item.price} SAR</p>
              </CardContent>
            </Card>
          ))}
        </div>
      </div>

      <div className="w-96 bg-card border-l flex flex-col">
        <div className="p-6 border-b">
          <h2 className="text-2xl font-bold">Current Order</h2>
        </div>

        <div className="flex-1 overflow-auto p-6">
          {cartItems.length === 0 ? (
            <div className="flex flex-col items-center justify-center h-full text-center text-muted-foreground">
              <Receipt className="h-16 w-16 mb-4 opacity-20" />
              <p>No items in cart</p>
            </div>
          ) : (
            <div className="space-y-3">
              {cartItems.map(item => (
                <Card key={item.id} data-testid={`cart-item-${item.id}`}>
                  <CardContent className="p-4">
                    <div className="flex items-start justify-between mb-2">
                      <div className="flex-1">
                        <p className="font-semibold">{item.name}</p>
                        <p className="text-sm text-muted-foreground font-mono">{item.price} SAR</p>
                      </div>
                      <Button
                        variant="ghost"
                        size="icon"
                        className="h-6 w-6"
                        onClick={() => removeItem(item.id)}
                        data-testid={`button-remove-${item.id}`}
                      >
                        <X className="h-4 w-4" />
                      </Button>
                    </div>
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        <Button
                          variant="outline"
                          size="icon"
                          className="h-8 w-8"
                          onClick={() => updateQuantity(item.id, -1)}
                          data-testid={`button-decrease-${item.id}`}
                        >
                          <Minus className="h-3 w-3" />
                        </Button>
                        <span className="w-8 text-center font-mono font-semibold">{item.quantity}</span>
                        <Button
                          variant="outline"
                          size="icon"
                          className="h-8 w-8"
                          onClick={() => updateQuantity(item.id, 1)}
                          data-testid={`button-increase-${item.id}`}
                        >
                          <Plus className="h-3 w-3" />
                        </Button>
                      </div>
                      <p className="font-mono font-bold">{(item.price * item.quantity).toFixed(2)} SAR</p>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          )}
        </div>

        <div className="p-6 border-t bg-background">
          <div className="space-y-3 mb-4">
            <div className="flex justify-between text-sm">
              <span className="text-muted-foreground">Subtotal</span>
              <span className="font-mono font-semibold">{subtotal.toFixed(2)} SAR</span>
            </div>
            <div className="flex justify-between text-sm">
              <span className="text-muted-foreground">Tax (15%)</span>
              <span className="font-mono font-semibold">{tax.toFixed(2)} SAR</span>
            </div>
            <Separator />
            <div className="flex justify-between">
              <span className="text-lg font-bold">Total</span>
              <span className="text-2xl font-mono font-bold text-primary">{total.toFixed(2)} SAR</span>
            </div>
          </div>

          <div className="space-y-2">
            <Button
              className="w-full h-12"
              disabled={cartItems.length === 0}
              onClick={handleCheckout}
              data-testid="button-checkout"
            >
              Checkout & Print Invoice
            </Button>
            <Button
              variant="outline"
              className="w-full"
              disabled={cartItems.length === 0}
              onClick={clearCart}
              data-testid="button-clear-cart"
            >
              Clear Cart
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
}
