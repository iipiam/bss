import { useState } from "react";
import { Card, CardContent, CardHeader } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Plus, Minus, X, Search, Receipt } from "lucide-react";
import { Separator } from "@/components/ui/separator";
import { useQuery, useMutation } from "@tanstack/react-query";
import { apiRequest, queryClient } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";
import type { MenuItem } from "@shared/schema";

interface CartItem {
  id: string;
  name: string;
  price: number;
  quantity: number;
}

const categories = ["All", "Pizza", "Burgers", "Sandwiches", "Salads", "Drinks"];

export default function POS() {
  const [cartItems, setCartItems] = useState<CartItem[]>([]);
  const [selectedCategory, setSelectedCategory] = useState("All");
  const [orderType, setOrderType] = useState("Dine-In");
  const { toast } = useToast();

  const { data: menuItems = [], isLoading } = useQuery<MenuItem[]>({
    queryKey: ["/api/menu"],
  });

  const createOrderMutation = useMutation({
    mutationFn: async (orderData: any) => {
      const order = await apiRequest("POST", "/api/orders", orderData);
      return order;
    },
    onSuccess: async (order: any) => {
      const transaction = {
        transactionId: `TXN-${Date.now()}`,
        orderId: order.id,
        branchId: "1",
        itemCount: cartItems.reduce((sum, item) => sum + item.quantity, 0),
        subtotal: subtotal.toFixed(2),
        tax: tax.toFixed(2),
        total: total.toFixed(2),
        paymentMethod: "Cash",
      };
      await apiRequest("POST", "/api/transactions", transaction);
      
      queryClient.invalidateQueries({ queryKey: ["/api/orders"] });
      queryClient.invalidateQueries({ queryKey: ["/api/transactions"] });
      queryClient.invalidateQueries({ queryKey: ["/api/analytics/dashboard"] });
      
      toast({
        title: "Order created successfully",
        description: `Order #${order.orderNumber} has been placed`,
      });
      
      clearCart();
      
      try {
        const response = await fetch("/api/pos/generate-invoice", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ orderId: order.id }),
        });
        
        if (response.ok) {
          const blob = await response.blob();
          const url = window.URL.createObjectURL(blob);
          const a = document.createElement("a");
          a.href = url;
          a.download = `invoice-${order.orderNumber}.pdf`;
          document.body.appendChild(a);
          a.click();
          window.URL.revokeObjectURL(url);
          document.body.removeChild(a);
        }
      } catch (error) {
        console.error("Invoice generation failed:", error);
      }
    },
  });

  const addToCart = (item: MenuItem) => {
    const existing = cartItems.find(ci => ci.id === item.id);
    if (existing) {
      setCartItems(cartItems.map(ci =>
        ci.id === item.id ? { ...ci, quantity: ci.quantity + 1 } : ci
      ));
    } else {
      setCartItems([...cartItems, { id: item.id, name: item.name, price: parseFloat(item.price), quantity: 1 }]);
    }
  };

  const updateQuantity = (id: string, delta: number) => {
    setCartItems(cartItems.map(item =>
      item.id === id ? { ...item, quantity: Math.max(0, item.quantity + delta) } : item
    ).filter(item => item.quantity > 0));
  };

  const removeItem = (id: string) => {
    setCartItems(cartItems.filter(item => item.id !== id));
  };

  const clearCart = () => {
    setCartItems([]);
  };

  const subtotal = cartItems.reduce((sum, item) => sum + (item.price * item.quantity), 0);
  const tax = subtotal * 0.15;
  const total = subtotal + tax;

  const availableMenuItems = menuItems.filter(item => item.available);
  const filteredItems = selectedCategory === "All"
    ? availableMenuItems
    : availableMenuItems.filter(item => item.category === selectedCategory);

  const handleCheckout = () => {
    if (cartItems.length === 0) {
      toast({
        title: "Cart is empty",
        description: "Add items to the cart before checkout",
        variant: "destructive",
      });
      return;
    }

    const orderData = {
      orderNumber: `ORD-${Date.now()}`,
      branchId: "1",
      orderType,
      items: cartItems.map(item => ({
        id: item.id,
        name: item.name,
        quantity: item.quantity,
        price: item.price,
      })),
      subtotal: subtotal.toFixed(2),
      tax: tax.toFixed(2),
      total: total.toFixed(2),
      status: "Pending",
    };

    createOrderMutation.mutate(orderData);
  };

  if (isLoading) {
    return (
      <div className="h-screen flex items-center justify-center">
        <p className="text-muted-foreground">Loading menu...</p>
      </div>
    );
  }

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
                <p className="text-xl font-bold font-mono text-primary">{parseFloat(item.price).toFixed(2)} SAR</p>
              </CardContent>
            </Card>
          ))}
        </div>
      </div>

      <div className="w-96 bg-card border-l flex flex-col">
        <div className="p-6 border-b">
          <h2 className="text-2xl font-bold mb-4">Current Order</h2>
          <Tabs value={orderType} onValueChange={setOrderType}>
            <TabsList className="w-full">
              <TabsTrigger value="Dine-In" className="flex-1">Dine-In</TabsTrigger>
              <TabsTrigger value="Takeout" className="flex-1">Takeout</TabsTrigger>
              <TabsTrigger value="Delivery" className="flex-1">Delivery</TabsTrigger>
            </TabsList>
          </Tabs>
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
                        <p className="text-sm text-muted-foreground font-mono">{item.price.toFixed(2)} SAR</p>
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

        <div className="border-t p-6">
          <div className="space-y-3 mb-6">
            <div className="flex justify-between text-muted-foreground">
              <span>Subtotal</span>
              <span className="font-mono">{subtotal.toFixed(2)} SAR</span>
            </div>
            <div className="flex justify-between text-muted-foreground">
              <span>Tax (15%)</span>
              <span className="font-mono">{tax.toFixed(2)} SAR</span>
            </div>
            <Separator />
            <div className="flex justify-between text-xl font-bold">
              <span>Total</span>
              <span className="font-mono">{total.toFixed(2)} SAR</span>
            </div>
          </div>
          <div className="flex gap-2">
            <Button
              variant="outline"
              className="flex-1"
              onClick={clearCart}
              disabled={cartItems.length === 0}
              data-testid="button-clear-cart"
            >
              Clear
            </Button>
            <Button
              className="flex-1"
              onClick={handleCheckout}
              disabled={cartItems.length === 0 || createOrderMutation.isPending}
              data-testid="button-checkout"
            >
              {createOrderMutation.isPending ? "Processing..." : "Checkout"}
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
}
