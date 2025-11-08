import { useState, useEffect } from "react";
import { Card, CardContent, CardHeader } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";
import { Plus, Minus, X, Search, Receipt, UtensilsCrossed, UserCircle, CreditCard, Wallet, Package, ShoppingCart } from "lucide-react";
import { Separator } from "@/components/ui/separator";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Checkbox } from "@/components/ui/checkbox";
import { useQuery, useMutation } from "@tanstack/react-query";
import { apiRequest, queryClient } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";
import { useLanguage } from "@/contexts/LanguageContext";
import { useDevice } from "@/contexts/DeviceContext";
import type { MenuItem, DeliveryApp, Addon } from "@shared/schema";

interface CartItemAddon {
  id: string;
  name: string;
  price: number;
}

interface CartItem {
  id: string;
  name: string;
  price: number;
  originalPrice: number;
  discount: number;
  quantity: number;
  addons?: CartItemAddon[];
}

const categories = ["All", "Pizza", "Burgers", "Sandwiches", "Salads", "Drinks"];

interface Branch {
  id: string;
  name: string;
}

interface Customer {
  id: string;
  name: string;
  phone: string;
}

export default function POS() {
  const [cartItems, setCartItems] = useState<CartItem[]>([]);
  const [selectedCategory, setSelectedCategory] = useState("All");
  const [orderType, setOrderType] = useState("Dine-In");
  const [paymentMethod, setPaymentMethod] = useState("Cash");
  const [customerDialogOpen, setCustomerDialogOpen] = useState(false);
  const [customerName, setCustomerName] = useState("");
  const [customerPhone, setCustomerPhone] = useState("");
  const [customerTab, setCustomerTab] = useState("new");
  const [customerSearch, setCustomerSearch] = useState("");
  const [tableNumber, setTableNumber] = useState("");
  const [mobileView, setMobileView] = useState<"menu" | "cart">("menu");
  const [selectedDeliveryAppId, setSelectedDeliveryAppId] = useState<string | null>(null);
  const [earningsDecreaseApplied, setEarningsDecreaseApplied] = useState(false);
  const [addonDialogOpen, setAddonDialogOpen] = useState(false);
  const [selectedMenuItem, setSelectedMenuItem] = useState<MenuItem | null>(null);
  const [selectedAddons, setSelectedAddons] = useState<string[]>([]);
  const [itemQuantity, setItemQuantity] = useState(1);
  const { toast } = useToast();
  const { t } = useLanguage();
  const { device } = useDevice();

  const { data: menuItems = [], isLoading } = useQuery<MenuItem[]>({
    queryKey: ["/api/menu"],
  });

  const { data: stock = {} } = useQuery<Record<string, number>>({
    queryKey: ["/api/menu/stock"],
  });

  const { data: branches = [] } = useQuery<Branch[]>({
    queryKey: ["/api/branches"],
  });

  const { data: customers = [] } = useQuery<Customer[]>({
    queryKey: ["/api/customers"],
  });

  const { data: deliveryApps = [] } = useQuery<DeliveryApp[]>({
    queryKey: ["/api/delivery-apps"],
  });

  const { data: allAddons = [] } = useQuery<Addon[]>({
    queryKey: ["/api/addons"],
  });

  // Reset earnings decrease when delivery app is deselected
  useEffect(() => {
    if (!selectedDeliveryAppId) {
      setEarningsDecreaseApplied(false);
    }
  }, [selectedDeliveryAppId]);

  // Get available add-ons for a specific menu item
  const getAvailableAddons = (menuItemId: string) => {
    return allAddons.filter(addon =>
      addon.available &&
      (addon.menuItemIds === null || addon.menuItemIds?.includes(menuItemId))
    );
  };

  const createOrderMutation = useMutation({
    mutationFn: async (orderData: any) => {
      const response = await apiRequest("POST", "/api/orders", orderData);
      return response.json();
    },
    onSuccess: async (order: any) => {
      // Create transaction record
      const transaction = {
        transactionId: `TXN-${Date.now()}`,
        orderId: order.id,
        branchId: order.branchId,
        itemCount: cartItems.reduce((sum, item) => sum + item.quantity, 0),
        subtotal: subtotal.toFixed(2),
        tax: tax.toFixed(2),
        total: total.toFixed(2),
        paymentMethod: paymentMethod,
      };
      await apiRequest("POST", "/api/transactions", transaction);
      
      // Create invoice record and generate PDF
      try {
        const response = await fetch("/api/invoices/create-and-generate", {
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
        console.error("Invoice creation failed:", error);
      }
      
      queryClient.invalidateQueries({ queryKey: ["/api/orders"] });
      queryClient.invalidateQueries({ queryKey: ["/api/transactions"] });
      queryClient.invalidateQueries({ queryKey: ["/api/invoices"] });
      queryClient.invalidateQueries({ queryKey: ["/api/analytics/dashboard"] });
      queryClient.invalidateQueries({ queryKey: ["/api/analytics/financial"] });
      queryClient.invalidateQueries({ queryKey: ["/api/inventory"] });
      queryClient.invalidateQueries({ queryKey: ["/api/menu/stock"] });
      
      toast({
        title: t.orderCompleted,
        description: t.orderCompletedDesc.replace('${order.orderNumber}', order.orderNumber),
      });
      
      clearCart();
    },
  });

  const handleItemClick = (item: MenuItem) => {
    const availableAddons = getAvailableAddons(item.id);
    
    // If no add-ons available, add directly to cart
    if (availableAddons.length === 0) {
      addToCartDirectly(item);
    } else {
      // Show add-on dialog
      setSelectedMenuItem(item);
      setSelectedAddons([]);
      setItemQuantity(1);
      setAddonDialogOpen(true);
    }
  };

  const addToCartDirectly = (item: MenuItem) => {
    const existing = cartItems.find(ci => ci.id === item.id && !ci.addons?.length);
    const basePrice = parseFloat(item.basePrice);
    const discountPercent = parseFloat(item.discount || "0");
    const discountedBase = basePrice * (1 - discountPercent / 100);
    const originalBase = basePrice;
    
    if (existing) {
      setCartItems(cartItems.map(ci =>
        ci.id === item.id && !ci.addons?.length ? { ...ci, quantity: ci.quantity + 1 } : ci
      ));
    } else {
      setCartItems([...cartItems, { 
        id: item.id, 
        name: item.name, 
        price: discountedBase,
        originalPrice: originalBase,
        discount: discountPercent,
        quantity: 1,
        addons: []
      }]);
    }
  };

  const addToCartWithAddons = () => {
    if (!selectedMenuItem) return;

    const basePrice = parseFloat(selectedMenuItem.basePrice);
    const discountPercent = parseFloat(selectedMenuItem.discount || "0");
    const discountedBase = basePrice * (1 - discountPercent / 100);
    const originalBase = basePrice;

    const selectedAddonItems = allAddons
      .filter(addon => selectedAddons.includes(addon.id))
      .map(addon => ({
        id: addon.id,
        name: addon.name,
        price: parseFloat(addon.basePrice),
      }));

    setCartItems([...cartItems, {
      id: selectedMenuItem.id,
      name: selectedMenuItem.name,
      price: discountedBase,
      originalPrice: originalBase,
      discount: discountPercent,
      quantity: itemQuantity,
      addons: selectedAddonItems.length > 0 ? selectedAddonItems : undefined,
    }]);

    setAddonDialogOpen(false);
    setSelectedMenuItem(null);
    setSelectedAddons([]);
    setItemQuantity(1);
  };

  const toggleAddon = (addonId: string) => {
    setSelectedAddons(prev =>
      prev.includes(addonId)
        ? prev.filter(id => id !== addonId)
        : [...prev, addonId]
    );
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
    setCustomerName("");
    setCustomerPhone("");
    setTableNumber("");
    setSelectedDeliveryAppId(null);
    setEarningsDecreaseApplied(false);
  };

  const calculateItemTotal = (item: CartItem) => {
    const addonTotal = item.addons?.reduce((sum, addon) => sum + addon.price, 0) || 0;
    return (item.price + addonTotal) * item.quantity;
  };

  const subtotal = cartItems.reduce((sum, item) => sum + calculateItemTotal(item), 0);
  const tax = subtotal * 0.15;
  const total = subtotal + tax;

  const availableMenuItems = menuItems.filter(item => item.available);
  const filteredItems = selectedCategory === "All"
    ? availableMenuItems
    : availableMenuItems.filter(item => item.category === selectedCategory);

  const handleSaveCustomer = () => {
    if (!customerName.trim()) {
      toast({
        title: t.error,
        description: `${t.customerName} is required`,
        variant: "destructive",
      });
      return;
    }
    setCustomerDialogOpen(false);
    toast({
      title: t.success,
      description: `${t.customerName}: ${customerName}${customerPhone ? ` (${customerPhone})` : ''}`,
    });
  };

  const handleCheckout = () => {
    if (cartItems.length === 0) {
      toast({
        title: t.error,
        description: "Cart is empty",
        variant: "destructive",
      });
      return;
    }

    // Get the first available branch, or null if no branches exist
    const branchId = branches.length > 0 ? branches[0].id : null;

    const orderData = {
      orderNumber: `ORD-${Date.now()}`,
      branchId,
      orderType,
      table: tableNumber.trim() || undefined,
      customerName: customerName.trim() || undefined,
      customerPhone: customerPhone.trim() || undefined,
      deliveryAppId: selectedDeliveryAppId || undefined,
      earningsDecreaseApplied,
      items: cartItems.map(item => ({
        id: item.id,
        name: item.name,
        quantity: item.quantity,
        price: item.price,
        addons: item.addons,
      })),
      subtotal: subtotal.toFixed(2),
      tax: tax.toFixed(2),
      total: total.toFixed(2),
      paymentMethod: paymentMethod,
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

  const isMobile = device === 'iphone';
  const itemCount = cartItems.reduce((sum, item) => sum + item.quantity, 0);

  // Mobile layout for iPhone
  if (isMobile) {
    return (
      <div className="h-full flex flex-col">
        <div className="flex-shrink-0 p-4 border-b">
          <h1 className="text-2xl font-bold mb-3">Point of Sale</h1>
          <Tabs value={mobileView} onValueChange={(v) => setMobileView(v as "menu" | "cart")}>
            <TabsList className="w-full grid grid-cols-2 h-[44px]">
              <TabsTrigger value="menu" data-testid="tab-mobile-menu" className="h-[44px]">
                <UtensilsCrossed className="h-4 w-4 mr-2" />
                Menu
              </TabsTrigger>
              <TabsTrigger value="cart" data-testid="tab-mobile-cart" className="h-[44px]">
                <ShoppingCart className="h-4 w-4 mr-2" />
                Cart {itemCount > 0 && `(${itemCount})`}
              </TabsTrigger>
            </TabsList>
          </Tabs>
        </div>

        {mobileView === "menu" ? (
          <div className="flex-1 overflow-auto p-4">
            <div className="mb-4">
              <div className="relative mb-3">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                <Input
                  placeholder="Search items..."
                  className="pl-10 h-[44px]"
                  data-testid="input-search-pos"
                />
              </div>

              <Tabs value={selectedCategory} onValueChange={setSelectedCategory}>
                <TabsList className="w-full overflow-x-auto flex justify-start h-[44px]">
                  {categories.map(cat => (
                    <TabsTrigger key={cat} value={cat} data-testid={`tab-category-${cat.toLowerCase()}`} className="whitespace-nowrap h-[44px]">
                      {cat}
                    </TabsTrigger>
                  ))}
                </TabsList>
              </Tabs>
            </div>

            <div className="grid grid-cols-2 gap-3">
              {filteredItems.map(item => {
                const hasDiscount = item.discount && parseFloat(item.discount) > 0;
                const basePrice = parseFloat(item.basePrice);
                const originalPrice = basePrice * 1.15;
                const discountedBase = hasDiscount
                  ? basePrice * (1 - parseFloat(item.discount) / 100)
                  : basePrice;
                const finalPrice = discountedBase * 1.15;
                
                const stockCount = stock[item.id] ?? 0;
                const isOutOfStock = stockCount === 0;
                
                return (
                  <Card
                    key={item.id}
                    className={`cursor-pointer hover-elevate active-elevate-2 relative ${isOutOfStock ? 'opacity-50' : ''}`}
                    onClick={() => !isOutOfStock && handleItemClick(item)}
                    data-testid={`card-pos-item-${item.id}`}
                  >
                    {hasDiscount && !isOutOfStock && (
                      <div className="absolute top-1 right-1 z-10 bg-green-600 text-white text-xs font-bold px-1.5 py-0.5 rounded">
                        {parseFloat(item.discount).toFixed(0)}%
                      </div>
                    )}
                    {isOutOfStock && (
                      <div className="absolute top-1 right-1 z-10 bg-red-600 text-white text-xs font-bold px-1.5 py-0.5 rounded">
                        OUT
                      </div>
                    )}
                    <CardHeader className="p-3 pb-2">
                      <div className="aspect-square bg-gradient-to-br from-primary/20 to-primary/5 rounded-md flex items-center justify-center mb-2">
                        <UtensilsCrossed className="h-8 w-8 text-primary/40" />
                      </div>
                    </CardHeader>
                    <CardContent className="p-3 pt-0">
                      <p className="font-semibold text-sm mb-1 line-clamp-2">{item.name}</p>
                      {hasDiscount ? (
                        <div className="space-y-0.5">
                          <p className="text-base font-bold font-mono text-primary">{finalPrice.toFixed(2)}</p>
                          <p className="text-xs font-mono text-muted-foreground line-through">{originalPrice.toFixed(2)}</p>
                        </div>
                      ) : (
                        <p className="text-base font-bold font-mono text-primary">{originalPrice.toFixed(2)}</p>
                      )}
                      <div className="flex items-center gap-1 mt-1 text-xs text-muted-foreground">
                        <Package className="h-3 w-3" />
                        <span data-testid={`text-stock-${item.id}`}>{stockCount}</span>
                      </div>
                    </CardContent>
                  </Card>
                );
              })}
            </div>

            {itemCount > 0 && (
              <div className="fixed bottom-4 left-4 right-4 z-10">
                <Button
                  size="lg"
                  className="w-full shadow-lg"
                  onClick={() => setMobileView("cart")}
                  data-testid="button-view-cart"
                >
                  <ShoppingCart className="h-5 w-5 mr-2" />
                  View Cart ({itemCount} items) - {total.toFixed(2)} SAR
                </Button>
              </div>
            )}
          </div>
        ) : (
          <div className="flex-1 flex flex-col">
            <div className="p-4 border-b">
              <Tabs value={orderType} onValueChange={setOrderType}>
                <TabsList className="w-full grid grid-cols-3">
                  <TabsTrigger value="Dine-In" className="text-xs">Dine-In</TabsTrigger>
                  <TabsTrigger value="Takeout" className="text-xs">Takeout</TabsTrigger>
                  <TabsTrigger value="Delivery" className="text-xs">Delivery</TabsTrigger>
                </TabsList>
              </Tabs>
            </div>

            <div className="flex-1 overflow-auto p-4">
              {cartItems.length === 0 ? (
                <div className="flex flex-col items-center justify-center h-full text-center text-muted-foreground">
                  <Receipt className="h-16 w-16 mb-4 opacity-20" />
                  <p>No items in cart</p>
                  <Button
                    variant="outline"
                    className="mt-4"
                    onClick={() => setMobileView("menu")}
                  >
                    Browse Menu
                  </Button>
                </div>
              ) : (
                <div className="space-y-3">
                  {cartItems.map(item => (
                    <Card key={item.id} data-testid={`cart-item-${item.id}`}>
                      <CardContent className="p-3">
                        <div className="flex items-start justify-between mb-2">
                          <div className="flex-1">
                            <p className="font-semibold text-sm">{item.name}</p>
                            {item.discount > 0 ? (
                              <div className="flex items-baseline gap-1.5">
                                <p className="text-xs font-mono text-primary">{item.price.toFixed(2)}</p>
                                <p className="text-xs font-mono text-muted-foreground line-through">{item.originalPrice.toFixed(2)}</p>
                                <span className="text-xs bg-green-600 text-white px-1 py-0.5 rounded">{item.discount.toFixed(0)}%</span>
                              </div>
                            ) : (
                              <p className="text-xs text-muted-foreground font-mono">{item.price.toFixed(2)} SAR</p>
                            )}
                            {item.addons && item.addons.length > 0 && (
                              <div className="mt-1 space-y-0.5 pl-2 border-l-2 border-muted">
                                {item.addons.map(addon => (
                                  <div key={addon.id} className="flex items-center justify-between text-xs text-muted-foreground">
                                    <span>+ {addon.name}</span>
                                    <span className="font-mono">+{addon.price.toFixed(2)}</span>
                                  </div>
                                ))}
                              </div>
                            )}
                          </div>
                          <Button
                            variant="ghost"
                            className="h-[44px] w-[44px]"
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
                              className="h-[44px] w-[44px]"
                              onClick={() => updateQuantity(item.id, -1)}
                              data-testid={`button-decrease-${item.id}`}
                            >
                              <Minus className="h-4 w-4" />
                            </Button>
                            <span className="w-8 text-center font-mono font-semibold">{item.quantity}</span>
                            <Button
                              variant="outline"
                              className="h-[44px] w-[44px]"
                              onClick={() => updateQuantity(item.id, 1)}
                              data-testid={`button-increase-${item.id}`}
                            >
                              <Plus className="h-4 w-4" />
                            </Button>
                          </div>
                          <p className="font-mono font-bold text-sm">{calculateItemTotal(item).toFixed(2)} SAR</p>
                        </div>
                      </CardContent>
                    </Card>
                  ))}
                </div>
              )}
            </div>

            <div className="border-t p-4">
              <div className="space-y-2 mb-4">
                <div className="flex justify-between text-sm text-muted-foreground">
                  <span>Subtotal</span>
                  <span className="font-mono">{subtotal.toFixed(2)} SAR</span>
                </div>
                <div className="flex justify-between text-sm text-muted-foreground">
                  <span>Tax (15%)</span>
                  <span className="font-mono">{tax.toFixed(2)} SAR</span>
                </div>
                <Separator />
                <div className="flex justify-between text-lg font-bold">
                  <span>Total</span>
                  <span className="font-mono">{total.toFixed(2)} SAR</span>
                </div>
              </div>

              <div className="mb-3">
                <Label className="text-xs font-medium mb-1 block">{t.paymentMethod}</Label>
                <Select value={paymentMethod} onValueChange={setPaymentMethod}>
                  <SelectTrigger data-testid="select-payment-method" className="w-full h-[44px]">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="Cash" data-testid="option-cash">
                      <div className="flex items-center gap-2">
                        <Wallet className="h-4 w-4" />
                        {t.cash}
                      </div>
                    </SelectItem>
                    <SelectItem value="ATM" data-testid="option-atm">
                      <div className="flex items-center gap-2">
                        <CreditCard className="h-4 w-4" />
                        {t.atm}
                      </div>
                    </SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div className="mb-3">
                <Label className="text-xs font-medium mb-1 block">Delivery App (Optional)</Label>
                <Select value={selectedDeliveryAppId || "none"} onValueChange={(value) => setSelectedDeliveryAppId(value === "none" ? null : value)}>
                  <SelectTrigger data-testid="select-delivery-app" className="w-full h-[44px]">
                    <SelectValue placeholder="Select delivery app" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="none">None</SelectItem>
                    {deliveryApps.filter(app => app.active).map(app => (
                      <SelectItem key={app.id} value={app.id}>
                        {app.name} ({parseFloat(app.commission).toFixed(0)}%)
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              {selectedDeliveryAppId && (
                <div className="mb-3 flex items-center space-x-2">
                  <Checkbox
                    id="earnings-decrease-mobile"
                    checked={earningsDecreaseApplied}
                    onCheckedChange={(checked) => setEarningsDecreaseApplied(checked as boolean)}
                    data-testid="checkbox-decrease-earnings"
                    className="h-[44px] w-[44px]"
                  />
                  <Label
                    htmlFor="earnings-decrease-mobile"
                    className="text-xs font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70"
                  >
                    Decrease earnings by 2 SAR
                  </Label>
                </div>
              )}

              {customerName && (
                <div className="mb-3 p-2 bg-muted rounded-md">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <UserCircle className="h-4 w-4 text-muted-foreground" />
                      <div>
                        <p className="text-xs font-medium" data-testid="text-customer-name">{customerName}</p>
                        {customerPhone && <p className="text-xs text-muted-foreground" data-testid="text-customer-phone">{customerPhone}</p>}
                      </div>
                    </div>
                    <Button
                      variant="ghost"
                      className="h-[44px] w-[44px]"
                      onClick={() => {
                        setCustomerName("");
                        setCustomerPhone("");
                      }}
                      data-testid="button-remove-customer"
                    >
                      <X className="h-4 w-4" />
                    </Button>
                  </div>
                </div>
              )}

              <div className="grid grid-cols-2 gap-2 mb-2">
                <div>
                  <Label htmlFor="table-number-mobile" className="text-xs mb-1">Table #</Label>
                  <Input
                    id="table-number-mobile"
                    placeholder="Table number"
                    value={tableNumber}
                    onChange={(e) => setTableNumber(e.target.value)}
                    data-testid="input-table-number"
                    className="h-[44px]"
                  />
                </div>
                <div className="flex flex-col">
                  <Label className="text-xs mb-1 invisible">Customer</Label>
                  <Dialog open={customerDialogOpen} onOpenChange={setCustomerDialogOpen}>
                    <DialogTrigger asChild>
                      <Button
                        variant="outline"
                        className="h-[44px]"
                        data-testid="button-add-customer"
                      >
                        <UserCircle className="h-4 w-4 mr-2" />
                        {customerName ? "Edit" : "Customer"}
                      </Button>
                    </DialogTrigger>
                    <DialogContent className="max-w-md">
                      <DialogHeader>
                        <DialogTitle>Customer Information</DialogTitle>
                        <DialogDescription>
                          Add customer details for this order (optional)
                        </DialogDescription>
                      </DialogHeader>
                      <Tabs value={customerTab} onValueChange={setCustomerTab} className="w-full">
                        <TabsList className="grid w-full grid-cols-2">
                          <TabsTrigger value="new" data-testid="tab-new-customer">{t.newCustomer}</TabsTrigger>
                          <TabsTrigger value="existing" data-testid="tab-existing-customer">{t.existingCustomer}</TabsTrigger>
                        </TabsList>
                        <TabsContent value="new" className="space-y-4 mt-4">
                          <div>
                            <Label htmlFor="customer-name">{t.customerName}</Label>
                            <Input
                              id="customer-name"
                              placeholder="Enter customer name"
                              value={customerName}
                              onChange={(e) => setCustomerName(e.target.value)}
                              data-testid="input-pos-customer-name"
                            />
                          </div>
                          <div>
                            <Label htmlFor="customer-phone">{t.phone}</Label>
                            <Input
                              id="customer-phone"
                              placeholder="+966 XX XXX XXXX"
                              value={customerPhone}
                              onChange={(e) => setCustomerPhone(e.target.value)}
                              data-testid="input-pos-customer-phone"
                            />
                          </div>
                          <div className="flex justify-end gap-2">
                            <Button
                              variant="outline"
                              onClick={() => setCustomerDialogOpen(false)}
                              data-testid="button-cancel-customer"
                            >
                              {t.cancel}
                            </Button>
                            <Button
                              onClick={handleSaveCustomer}
                              data-testid="button-save-customer"
                            >
                              {t.save}
                            </Button>
                          </div>
                        </TabsContent>
                        <TabsContent value="existing" className="space-y-4 mt-4">
                          <div>
                            <Label htmlFor="customer-search">{t.search}</Label>
                            <div className="relative">
                              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                              <Input
                                id="customer-search"
                                placeholder="Search by name or phone..."
                                value={customerSearch}
                                onChange={(e) => setCustomerSearch(e.target.value)}
                                className="pl-9"
                                data-testid="input-customer-search"
                              />
                            </div>
                          </div>
                          <div className="max-h-60 overflow-y-auto space-y-2">
                            {customers
                              .filter(c => 
                                customerSearch === "" ||
                                c.name.toLowerCase().includes(customerSearch.toLowerCase()) ||
                                c.phone.includes(customerSearch)
                              )
                              .map(customer => (
                                <Card
                                  key={customer.id}
                                  className="cursor-pointer hover-elevate active-elevate-2"
                                  onClick={() => {
                                    setCustomerName(customer.name);
                                    setCustomerPhone(customer.phone);
                                    setCustomerDialogOpen(false);
                                    setCustomerSearch("");
                                    toast({
                                      title: t.success,
                                      description: `${t.selectCustomer}: ${customer.name}`,
                                    });
                                  }}
                                  data-testid={`card-customer-${customer.id}`}
                                >
                                  <CardContent className="p-3">
                                    <p className="font-medium">{customer.name}</p>
                                    <p className="text-sm text-muted-foreground">{customer.phone}</p>
                                  </CardContent>
                                </Card>
                              ))}
                            {customers.filter(c => 
                              customerSearch === "" ||
                              c.name.toLowerCase().includes(customerSearch.toLowerCase()) ||
                              c.phone.includes(customerSearch)
                            ).length === 0 && (
                              <p className="text-center text-muted-foreground py-8">{t.noData}</p>
                            )}
                          </div>
                          <div className="flex justify-end">
                            <Button
                              variant="outline"
                              onClick={() => setCustomerDialogOpen(false)}
                              data-testid="button-cancel-select-customer"
                            >
                              {t.cancel}
                            </Button>
                          </div>
                        </TabsContent>
                      </Tabs>
                    </DialogContent>
                  </Dialog>
                </div>
              </div>

              <div className="flex gap-2">
                <Button
                  variant="outline"
                  className="flex-1 h-[44px]"
                  onClick={clearCart}
                  disabled={cartItems.length === 0}
                  data-testid="button-clear-cart"
                >
                  Clear
                </Button>
                <Button
                  className="flex-1 h-[44px]"
                  onClick={handleCheckout}
                  disabled={cartItems.length === 0 || createOrderMutation.isPending}
                  data-testid="button-checkout"
                >
                  {createOrderMutation.isPending ? "Processing..." : "Checkout"}
                </Button>
              </div>
            </div>
          </div>
        )}
      </div>
    );
  }

  // Desktop/Tablet layout for iPad and Laptop
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
          {filteredItems.map(item => {
            const hasDiscount = item.discount && parseFloat(item.discount) > 0;
            const basePrice = parseFloat(item.basePrice);
            // Calculate original VAT-inclusive price from base price
            const originalPrice = basePrice * 1.15;
            // Apply discount to base price
            const discountedBase = hasDiscount
              ? basePrice * (1 - parseFloat(item.discount) / 100)
              : basePrice;
            // Show final price with VAT for display purposes
            const finalPrice = discountedBase * 1.15;
            
            const stockCount = stock[item.id] ?? 0;
            const isOutOfStock = stockCount === 0;
            
            return (
              <Card
                key={item.id}
                className={`cursor-pointer hover-elevate active-elevate-2 relative ${isOutOfStock ? 'opacity-50' : ''}`}
                onClick={() => !isOutOfStock && handleItemClick(item)}
                data-testid={`card-pos-item-${item.id}`}
              >
                {hasDiscount && !isOutOfStock && (
                  <div className="absolute top-2 right-2 z-10 bg-green-600 text-white text-xs font-bold px-2 py-1 rounded">
                    {parseFloat(item.discount).toFixed(0)}% OFF
                  </div>
                )}
                {isOutOfStock && (
                  <div className="absolute top-2 right-2 z-10 bg-red-600 text-white text-xs font-bold px-2 py-1 rounded">
                    OUT OF STOCK
                  </div>
                )}
                <CardHeader className="p-4 pb-2">
                  <div className="aspect-square bg-gradient-to-br from-primary/20 to-primary/5 rounded-md flex items-center justify-center mb-2">
                    <UtensilsCrossed className="h-12 w-12 text-primary/40" />
                  </div>
                </CardHeader>
                <CardContent className="p-4 pt-0">
                  <p className="font-semibold mb-1 line-clamp-2">{item.name}</p>
                  {hasDiscount ? (
                    <div className="space-y-1">
                      <p className="text-xl font-bold font-mono text-primary">{finalPrice.toFixed(2)} SAR</p>
                      <p className="text-sm font-mono text-muted-foreground line-through">{originalPrice.toFixed(2)} SAR</p>
                    </div>
                  ) : (
                    <p className="text-xl font-bold font-mono text-primary">{originalPrice.toFixed(2)} SAR</p>
                  )}
                  <div className="flex items-center gap-1 mt-2 text-sm text-muted-foreground">
                    <Package className="h-3 w-3" />
                    <span data-testid={`text-stock-${item.id}`}>{stockCount} {t.available || 'available'}</span>
                  </div>
                </CardContent>
              </Card>
            );
          })}
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
                        {item.discount > 0 ? (
                          <div className="flex items-baseline gap-2">
                            <p className="text-sm font-mono text-primary">{item.price.toFixed(2)} SAR (base)</p>
                            <p className="text-xs font-mono text-muted-foreground line-through">{item.originalPrice.toFixed(2)}</p>
                            <span className="text-xs bg-green-600 text-white px-1.5 py-0.5 rounded">{item.discount.toFixed(0)}% OFF</span>
                          </div>
                        ) : (
                          <p className="text-sm text-muted-foreground font-mono">{item.price.toFixed(2)} SAR (base)</p>
                        )}
                        {item.addons && item.addons.length > 0 && (
                          <div className="mt-2 space-y-1 pl-3 border-l-2 border-muted">
                            {item.addons.map(addon => (
                              <div key={addon.id} className="flex items-center justify-between text-sm text-muted-foreground">
                                <span>+ {addon.name}</span>
                                <span className="font-mono">+{addon.price.toFixed(2)} SAR</span>
                              </div>
                            ))}
                          </div>
                        )}
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
                      <p className="font-mono font-bold">{calculateItemTotal(item).toFixed(2)} SAR</p>
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

          <div className="mb-4">
            <Label className="text-sm font-medium mb-2 block">{t.paymentMethod}</Label>
            <Select value={paymentMethod} onValueChange={setPaymentMethod}>
              <SelectTrigger data-testid="select-payment-method" className="w-full">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="Cash" data-testid="option-cash">
                  <div className="flex items-center gap-2">
                    <Wallet className="h-4 w-4" />
                    {t.cash}
                  </div>
                </SelectItem>
                <SelectItem value="ATM" data-testid="option-atm">
                  <div className="flex items-center gap-2">
                    <CreditCard className="h-4 w-4" />
                    {t.atm}
                  </div>
                </SelectItem>
              </SelectContent>
            </Select>
          </div>

          <div className="mb-4">
            <Label className="text-sm font-medium mb-2 block">Delivery App (Optional)</Label>
            <Select value={selectedDeliveryAppId || "none"} onValueChange={(value) => setSelectedDeliveryAppId(value === "none" ? null : value)}>
              <SelectTrigger data-testid="select-delivery-app" className="w-full">
                <SelectValue placeholder="Select delivery app" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="none">None</SelectItem>
                {deliveryApps.filter(app => app.active).map(app => (
                  <SelectItem key={app.id} value={app.id}>
                    {app.name} ({parseFloat(app.commission).toFixed(0)}%)
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          {selectedDeliveryAppId && (
            <div className="mb-4 flex items-center space-x-2">
              <Checkbox
                id="earnings-decrease-desktop"
                checked={earningsDecreaseApplied}
                onCheckedChange={(checked) => setEarningsDecreaseApplied(checked as boolean)}
                data-testid="checkbox-decrease-earnings"
              />
              <Label
                htmlFor="earnings-decrease-desktop"
                className="text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70"
              >
                Decrease earnings by 2 SAR
              </Label>
            </div>
          )}

          {customerName && (
            <div className="mb-4 p-3 bg-muted rounded-md">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <UserCircle className="h-4 w-4 text-muted-foreground" />
                  <div>
                    <p className="text-sm font-medium" data-testid="text-customer-name">{customerName}</p>
                    {customerPhone && <p className="text-xs text-muted-foreground" data-testid="text-customer-phone">{customerPhone}</p>}
                  </div>
                </div>
                <Button
                  variant="ghost"
                  size="icon"
                  className="h-6 w-6"
                  onClick={() => {
                    setCustomerName("");
                    setCustomerPhone("");
                  }}
                  data-testid="button-remove-customer"
                >
                  <X className="h-3 w-3" />
                </Button>
              </div>
            </div>
          )}

          <div className="grid grid-cols-2 gap-2 mb-2">
            <div>
              <Label htmlFor="table-number-desktop" className="text-sm mb-1">Table #</Label>
              <Input
                id="table-number-desktop"
                placeholder="Table number"
                value={tableNumber}
                onChange={(e) => setTableNumber(e.target.value)}
                data-testid="input-table-number-desktop"
              />
            </div>
            <div className="flex flex-col">
              <Label className="text-sm mb-1 invisible">Customer</Label>
              <Dialog open={customerDialogOpen} onOpenChange={setCustomerDialogOpen}>
                <DialogTrigger asChild>
                  <Button
                    variant="outline"
                    data-testid="button-add-customer"
                  >
                    <UserCircle className="h-4 w-4 mr-2" />
                    {customerName ? "Edit" : "Customer"}
                  </Button>
                </DialogTrigger>
                <DialogContent className="max-w-md">
                  <DialogHeader>
                    <DialogTitle>Customer Information</DialogTitle>
                    <DialogDescription>
                      Add customer details for this order (optional)
                    </DialogDescription>
                  </DialogHeader>
                  <Tabs value={customerTab} onValueChange={setCustomerTab} className="w-full">
                    <TabsList className="grid w-full grid-cols-2">
                      <TabsTrigger value="new" data-testid="tab-new-customer">{t.newCustomer}</TabsTrigger>
                      <TabsTrigger value="existing" data-testid="tab-existing-customer">{t.existingCustomer}</TabsTrigger>
                    </TabsList>
                    <TabsContent value="new" className="space-y-4 mt-4">
                      <div>
                        <Label htmlFor="customer-name">{t.customerName}</Label>
                        <Input
                          id="customer-name"
                          placeholder="Enter customer name"
                          value={customerName}
                          onChange={(e) => setCustomerName(e.target.value)}
                          data-testid="input-pos-customer-name"
                        />
                      </div>
                      <div>
                        <Label htmlFor="customer-phone">{t.phone}</Label>
                        <Input
                          id="customer-phone"
                          placeholder="+966 XX XXX XXXX"
                          value={customerPhone}
                          onChange={(e) => setCustomerPhone(e.target.value)}
                          data-testid="input-pos-customer-phone"
                        />
                      </div>
                      <div className="flex justify-end gap-2">
                        <Button
                          variant="outline"
                          onClick={() => setCustomerDialogOpen(false)}
                          data-testid="button-cancel-customer"
                        >
                          {t.cancel}
                        </Button>
                        <Button
                          onClick={handleSaveCustomer}
                          data-testid="button-save-customer"
                        >
                          {t.save}
                        </Button>
                      </div>
                    </TabsContent>
                    <TabsContent value="existing" className="space-y-4 mt-4">
                      <div>
                        <Label htmlFor="customer-search">{t.search}</Label>
                        <div className="relative">
                          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                          <Input
                            id="customer-search"
                            placeholder="Search by name or phone..."
                            value={customerSearch}
                            onChange={(e) => setCustomerSearch(e.target.value)}
                            className="pl-9"
                            data-testid="input-customer-search"
                          />
                        </div>
                      </div>
                      <div className="max-h-60 overflow-y-auto space-y-2">
                        {customers
                          .filter(c => 
                            customerSearch === "" ||
                            c.name.toLowerCase().includes(customerSearch.toLowerCase()) ||
                            c.phone.includes(customerSearch)
                          )
                          .map(customer => (
                            <Card
                              key={customer.id}
                              className="cursor-pointer hover-elevate active-elevate-2"
                              onClick={() => {
                                setCustomerName(customer.name);
                                setCustomerPhone(customer.phone);
                                setCustomerDialogOpen(false);
                                setCustomerSearch("");
                                toast({
                                  title: t.success,
                                  description: `${t.selectCustomer}: ${customer.name}`,
                                });
                              }}
                              data-testid={`card-customer-${customer.id}`}
                            >
                              <CardContent className="p-3">
                                <p className="font-medium">{customer.name}</p>
                                <p className="text-sm text-muted-foreground">{customer.phone}</p>
                              </CardContent>
                            </Card>
                          ))}
                        {customers.filter(c => 
                          customerSearch === "" ||
                          c.name.toLowerCase().includes(customerSearch.toLowerCase()) ||
                          c.phone.includes(customerSearch)
                        ).length === 0 && (
                          <p className="text-center text-muted-foreground py-8">{t.noData}</p>
                        )}
                      </div>
                      <div className="flex justify-end">
                        <Button
                          variant="outline"
                          onClick={() => setCustomerDialogOpen(false)}
                          data-testid="button-cancel-select-customer"
                        >
                          {t.cancel}
                        </Button>
                      </div>
                    </TabsContent>
                  </Tabs>
                </DialogContent>
              </Dialog>
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

      {/* Add-on Selection Dialog */}
      <Dialog open={addonDialogOpen} onOpenChange={setAddonDialogOpen}>
        <DialogContent className={`max-w-md ${isMobile ? 'max-h-[90vh]' : ''}`}>
          <DialogHeader>
            <DialogTitle>{t.selectAddons}</DialogTitle>
            <DialogDescription>
              {selectedMenuItem?.name} - {selectedMenuItem ? (parseFloat(selectedMenuItem.basePrice) * 1.15).toFixed(2) : '0.00'} SAR
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-4 max-h-[60vh] overflow-y-auto">
            {selectedMenuItem && getAvailableAddons(selectedMenuItem.id).length > 0 ? (
              <>
                <div>
                  <Label className="text-sm font-medium mb-2 block">{t.availableAddons}</Label>
                  <div className="space-y-2">
                    {getAvailableAddons(selectedMenuItem.id).map(addon => (
                      <div
                        key={addon.id}
                        className={`flex items-center space-x-3 p-3 rounded-md border ${isMobile ? 'min-h-[44px]' : ''} hover-elevate cursor-pointer`}
                        onClick={() => toggleAddon(addon.id)}
                        data-testid={`addon-option-${addon.id}`}
                      >
                        <Checkbox
                          checked={selectedAddons.includes(addon.id)}
                          onCheckedChange={() => toggleAddon(addon.id)}
                          className={isMobile ? 'h-[44px] w-[44px]' : ''}
                          data-testid={`checkbox-addon-${addon.id}`}
                        />
                        <div className="flex-1">
                          <div className="flex items-baseline justify-between">
                            <span className="font-medium text-sm">{addon.name}</span>
                            <span className="font-mono text-sm text-primary">+{parseFloat(addon.basePrice).toFixed(2)} SAR</span>
                          </div>
                          <p className="text-xs text-muted-foreground">{addon.category}</p>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>

                <Separator />
              </>
            ) : (
              <p className="text-center text-muted-foreground py-4">{t.noAddonsAvailable}</p>
            )}

            <div>
              <Label className="text-sm font-medium mb-2 block">{t.quantity}</Label>
              <div className="flex items-center gap-3">
                <Button
                  variant="outline"
                  className={isMobile ? 'h-[44px] w-[44px]' : 'h-10 w-10'}
                  onClick={() => setItemQuantity(Math.max(1, itemQuantity - 1))}
                  data-testid="button-decrease-quantity"
                >
                  <Minus className="h-4 w-4" />
                </Button>
                <span className="text-lg font-mono font-semibold w-12 text-center" data-testid="text-quantity">{itemQuantity}</span>
                <Button
                  variant="outline"
                  className={isMobile ? 'h-[44px] w-[44px]' : 'h-10 w-10'}
                  onClick={() => setItemQuantity(itemQuantity + 1)}
                  data-testid="button-increase-quantity"
                >
                  <Plus className="h-4 w-4" />
                </Button>
              </div>
            </div>

            <div className="p-3 bg-muted rounded-md">
              <div className="flex justify-between items-center mb-1">
                <span className="text-sm text-muted-foreground">{t.subtotal}</span>
                <span className="font-mono text-sm">
                  {selectedMenuItem ? (
                    (parseFloat(selectedMenuItem.basePrice) * (1 - parseFloat(selectedMenuItem.discount || "0") / 100) * itemQuantity).toFixed(2)
                  ) : '0.00'} SAR
                </span>
              </div>
              {selectedAddons.length > 0 && (
                <div className="flex justify-between items-center mb-1">
                  <span className="text-sm text-muted-foreground">{t.addons}</span>
                  <span className="font-mono text-sm">
                    +{allAddons
                      .filter(a => selectedAddons.includes(a.id))
                      .reduce((sum, a) => sum + parseFloat(a.basePrice), 0)
                      .toFixed(2)} SAR × {itemQuantity}
                  </span>
                </div>
              )}
              <Separator className="my-2" />
              <div className="flex justify-between items-center font-bold">
                <span>{t.total}</span>
                <span className="font-mono text-lg text-primary">
                  {selectedMenuItem ? (
                    (
                      (parseFloat(selectedMenuItem.basePrice) * (1 - parseFloat(selectedMenuItem.discount || "0") / 100) +
                        allAddons
                          .filter(a => selectedAddons.includes(a.id))
                          .reduce((sum, a) => sum + parseFloat(a.basePrice), 0)) *
                      itemQuantity *
                      1.15
                    ).toFixed(2)
                  ) : '0.00'} SAR
                </span>
              </div>
              <p className="text-xs text-muted-foreground mt-1">{t.tax} (15%) included</p>
            </div>
          </div>

          <div className="flex gap-2">
            <Button
              variant="outline"
              className={`flex-1 ${isMobile ? 'h-[44px]' : ''}`}
              onClick={() => setAddonDialogOpen(false)}
              data-testid="button-cancel-addons"
            >
              {t.cancel}
            </Button>
            <Button
              className={`flex-1 ${isMobile ? 'h-[44px]' : ''}`}
              onClick={addToCartWithAddons}
              data-testid="button-confirm-addons"
            >
              {t.add}
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}
