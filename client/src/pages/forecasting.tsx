import { useState } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer, BarChart, Bar } from "recharts";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { TrendingUp, TrendingDown, Calendar, DollarSign, Package, ArrowUp, ArrowDown, Minus } from "lucide-react";
import { useQuery } from "@tanstack/react-query";
import { useLanguage } from "@/contexts/LanguageContext";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import type { Transaction, Order, MenuItem, Recipe, InventoryItem } from "@shared/schema";

export default function Forecasting() {
  const { t } = useLanguage();
  const [forecastPeriod, setForecastPeriod] = useState("7");

  const { data: transactions = [] } = useQuery<Transaction[]>({
    queryKey: ["/api/transactions"],
  });

  const { data: orders = [] } = useQuery<Order[]>({
    queryKey: ["/api/orders"],
  });

  const { data: menuItems = [] } = useQuery<MenuItem[]>({
    queryKey: ["/api/menu-items"],
  });

  const { data: recipes = [] } = useQuery<Recipe[]>({
    queryKey: ["/api/recipes"],
  });

  const { data: inventoryItems = [] } = useQuery<InventoryItem[]>({
    queryKey: ["/api/inventory"],
  });

  // Prepare historical sales data (last 30 days)
  const last30Days = Array.from({ length: 30 }, (_, i) => {
    const date = new Date();
    date.setDate(date.getDate() - (29 - i));
    return date.toISOString().split('T')[0];
  });

  const historicalData = last30Days.map(date => {
    const dayTransactions = transactions.filter(t => 
      new Date(t.createdAt).toISOString().split('T')[0] === date
    );
    const total = dayTransactions.reduce((sum, t) => sum + parseFloat(t.total), 0);
    return {
      date: new Date(date).toLocaleDateString('en-US', { month: 'short', day: 'numeric' }),
      sales: total,
      transactions: dayTransactions.length,
    };
  });

  // Calculate simple linear trend for forecasting
  const calculateForecast = (days: number) => {
    if (historicalData.length < 2) return [];
    
    // Simple moving average for trend
    const recentData = historicalData.slice(-14);
    const avgSales = recentData.reduce((sum, d) => sum + d.sales, 0) / recentData.length;
    
    // Calculate trend (simple linear)
    const trend = (recentData[recentData.length - 1].sales - recentData[0].sales) / recentData.length;
    
    return Array.from({ length: days }, (_, i) => {
      const date = new Date();
      date.setDate(date.getDate() + i + 1);
      return {
        date: date.toLocaleDateString('en-US', { month: 'short', day: 'numeric' }),
        predictedSales: Math.max(0, avgSales + (trend * (i + 1))),
      };
    });
  };

  const forecastData = calculateForecast(parseInt(forecastPeriod));

  // Calculate metrics
  const totalSales = transactions.reduce((sum, t) => sum + parseFloat(t.total), 0);
  const avgDailySales = historicalData.length > 0 
    ? historicalData.reduce((sum, d) => sum + d.sales, 0) / historicalData.length 
    : 0;
  const predictedRevenue = forecastData.reduce((sum, d) => sum + d.predictedSales, 0);
  
  // Trend calculation
  const last7Days = historicalData.slice(-7);
  const prev7Days = historicalData.slice(-14, -7);
  const last7Total = last7Days.reduce((sum, d) => sum + d.sales, 0);
  const prev7Total = prev7Days.reduce((sum, d) => sum + d.sales, 0);
  const trendPercentage = prev7Total > 0 ? ((last7Total - prev7Total) / prev7Total) * 100 : 0;

  // Calculate per-item daily demand forecasting
  const calculateItemDemand = () => {
    // Create a map to store demand data for each menu item
    const itemDemandMap = new Map<string, {
      name: string;
      price: number;
      historicalDemand: number[];
      avgDailyDemand: number;
      forecastedDemand: number;
      trend: number;
      trendPercentage: number;
    }>();

    // Initialize map with all menu items
    menuItems.forEach(item => {
      itemDemandMap.set(item.id, {
        name: item.name,
        price: parseFloat(item.price) || 0,
        historicalDemand: new Array(30).fill(0),
        avgDailyDemand: 0,
        forecastedDemand: 0,
        trend: 0,
        trendPercentage: 0,
      });
    });

    // Process orders to count item demand per day
    orders.forEach(order => {
      const orderDate = new Date(order.createdAt).toISOString().split('T')[0];
      const dayIndex = last30Days.indexOf(orderDate);
      
      if (dayIndex !== -1 && order.items && Array.isArray(order.items)) {
        order.items.forEach((item: any) => {
          const itemData = itemDemandMap.get(item.id);
          if (itemData) {
            itemData.historicalDemand[dayIndex] += item.quantity || 0;
          }
        });
      }
    });

    // Calculate statistics for each item
    const itemForecasts: Array<{
      id: string;
      name: string;
      price: number;
      avgDailyDemand: number;
      forecastedDemand: number;
      forecastedRevenue: number;
      forecastedRevenuePeriod: number;
      trend: 'up' | 'down' | 'stable';
      trendPercentage: number;
      last7DaysDemand: number;
      prev7DaysDemand: number;
      last7DaysRevenue: number;
      prev7DaysRevenue: number;
    }> = [];

    itemDemandMap.forEach((data, itemId) => {
      const totalDemand = data.historicalDemand.reduce((sum, d) => sum + d, 0);
      data.avgDailyDemand = totalDemand / 30;

      // Calculate trend using last 14 days
      const last14Days = data.historicalDemand.slice(-14);
      const recentAvg = last14Days.reduce((sum, d) => sum + d, 0) / last14Days.length;
      
      // Simple linear trend
      const firstHalf = last14Days.slice(0, 7).reduce((sum, d) => sum + d, 0) / 7;
      const secondHalf = last14Days.slice(7).reduce((sum, d) => sum + d, 0) / 7;
      const trendSlope = secondHalf - firstHalf;
      
      // Forecast for next period
      data.forecastedDemand = Math.max(0, Math.round(recentAvg + trendSlope));
      
      // Trend percentage
      const last7 = data.historicalDemand.slice(-7).reduce((sum, d) => sum + d, 0);
      const prev7 = data.historicalDemand.slice(-14, -7).reduce((sum, d) => sum + d, 0);
      data.trendPercentage = prev7 > 0 ? ((last7 - prev7) / prev7) * 100 : 0;
      
      // Only include items that have been sold
      if (totalDemand > 0) {
        itemForecasts.push({
          id: itemId,
          name: data.name,
          price: data.price,
          avgDailyDemand: parseFloat(data.avgDailyDemand.toFixed(1)),
          forecastedDemand: data.forecastedDemand,
          forecastedRevenue: data.forecastedDemand * data.price,
          forecastedRevenuePeriod: data.forecastedDemand * data.price * parseInt(forecastPeriod),
          trend: data.trendPercentage > 5 ? 'up' : data.trendPercentage < -5 ? 'down' : 'stable',
          trendPercentage: parseFloat(data.trendPercentage.toFixed(1)),
          last7DaysDemand: last7,
          prev7DaysDemand: prev7,
          last7DaysRevenue: last7 * data.price,
          prev7DaysRevenue: prev7 * data.price,
        });
      }
    });

    // Sort by average daily demand (highest first)
    return itemForecasts.sort((a, b) => b.avgDailyDemand - a.avgDailyDemand);
  };

  const itemDemandForecasts = calculateItemDemand();
  
  // Calculate Item Sales Prediction totals
  const totalForecastedItemRevenue = itemDemandForecasts.reduce((sum, item) => sum + item.forecastedRevenuePeriod, 0);
  const totalLast7Revenue = itemDemandForecasts.reduce((sum, item) => sum + item.last7DaysRevenue, 0);
  const totalPrev7Revenue = itemDemandForecasts.reduce((sum, item) => sum + item.prev7DaysRevenue, 0);
  const itemRevenueTrendPercentage = totalPrev7Revenue > 0 
    ? ((totalLast7Revenue - totalPrev7Revenue) / totalPrev7Revenue) * 100 
    : 0;
  
  // Sort by forecasted revenue for the Items Sales Prediction table
  const itemSalesForecasts = [...itemDemandForecasts].sort((a, b) => b.forecastedRevenuePeriod - a.forecastedRevenuePeriod);

  // Calculate Inventory Forecasting based on menu item sales predictions
  const calculateInventoryForecast = () => {
    // Map to aggregate inventory requirements
    const inventoryRequirements = new Map<string, {
      inventoryItemId: string;
      name: string;
      unit: string;
      currentStock: number;
      requiredQuantity: number;
      shortfall: number;
      status: 'sufficient' | 'low' | 'critical';
    }>();

    // Create a lookup map for menu item -> recipe
    const menuItemRecipeMap = new Map<string, Recipe>();
    let menuItemsWithRecipes = 0;
    menuItems.forEach(item => {
      if (item.recipeId) {
        const recipe = recipes.find(r => r.id === item.recipeId);
        if (recipe) {
          menuItemRecipeMap.set(item.id, recipe);
          menuItemsWithRecipes++;
        }
      }
    });

    // Create inventory lookup maps (by ID and by name for fallback)
    const inventoryLookup = new Map<string, InventoryItem>();
    const inventoryByName = new Map<string, InventoryItem>();
    inventoryItems.forEach(item => {
      inventoryLookup.set(item.id, item);
      inventoryByName.set(item.name.toLowerCase().trim(), item);
    });

    // Debug logging (only in development)
    if (import.meta.env.DEV) {
      console.log('[Inventory Forecast] Data Summary:', {
        menuItems: menuItems.length,
        menuItemsWithRecipes,
        recipes: recipes.length,
        inventoryItems: inventoryItems.length,
        itemDemandForecasts: itemDemandForecasts.length,
      });
    }

    // For each menu item forecast, calculate inventory requirements
    let processedIngredients = 0;
    let matchedByName = 0;
    
    itemDemandForecasts.forEach(forecast => {
      const recipe = menuItemRecipeMap.get(forecast.id);
      if (!recipe || !recipe.ingredients) return;

      // Calculate total units needed for the forecast period
      const totalUnitsNeeded = forecast.forecastedDemand * parseInt(forecastPeriod);

      // For each ingredient in the recipe, calculate requirements
      const ingredients = recipe.ingredients as Array<{ 
        inventoryItemId?: string; 
        name: string; 
        quantity: number; 
        unit: string; 
        unitPrice?: number 
      }>;

      ingredients.forEach(ingredient => {
        processedIngredients++;
        
        // Try to find inventory item by ID first, then fallback to name match
        let inventoryItem = ingredient.inventoryItemId 
          ? inventoryLookup.get(ingredient.inventoryItemId) 
          : undefined;
        
        // Fallback: match by ingredient name if no inventoryItemId or item not found
        if (!inventoryItem && ingredient.name) {
          inventoryItem = inventoryByName.get(ingredient.name.toLowerCase().trim());
          if (inventoryItem) matchedByName++;
        }
        
        if (!inventoryItem) {
          if (import.meta.env.DEV) {
            console.log('[Inventory Forecast] No match for ingredient:', ingredient.name);
          }
          return;
        }

        const requiredQty = ingredient.quantity * totalUnitsNeeded;
        const currentStock = parseFloat(inventoryItem.quantity) || 0;
        const itemKey = inventoryItem.id;

        if (inventoryRequirements.has(itemKey)) {
          const existing = inventoryRequirements.get(itemKey)!;
          existing.requiredQuantity += requiredQty;
          existing.shortfall = Math.max(0, existing.requiredQuantity - existing.currentStock);
          existing.status = existing.shortfall === 0 ? 'sufficient' : 
                           existing.shortfall > existing.currentStock * 0.5 ? 'critical' : 'low';
        } else {
          const shortfall = Math.max(0, requiredQty - currentStock);
          inventoryRequirements.set(itemKey, {
            inventoryItemId: itemKey,
            name: inventoryItem.name,
            unit: inventoryItem.unit || ingredient.unit,
            currentStock,
            requiredQuantity: requiredQty,
            shortfall,
            status: shortfall === 0 ? 'sufficient' : 
                   shortfall > currentStock * 0.5 ? 'critical' : 'low',
          });
        }
      });
    });

    if (import.meta.env.DEV) {
      console.log('[Inventory Forecast] Processing Summary:', {
        processedIngredients,
        matchedByName,
        inventoryRequirements: inventoryRequirements.size,
      });
    }

    // Convert to array and sort by shortfall (critical first)
    return Array.from(inventoryRequirements.values())
      .sort((a, b) => b.shortfall - a.shortfall);
  };

  const inventoryForecasts = calculateInventoryForecast();
  const criticalItems = inventoryForecasts.filter(i => i.status === 'critical').length;
  const lowItems = inventoryForecasts.filter(i => i.status === 'low').length;
  const sufficientItems = inventoryForecasts.filter(i => i.status === 'sufficient').length;

  return (
    <div className="p-6 space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold">{t.forecasting}</h1>
          <p className="text-muted-foreground mt-1">{t.demandForecasting}</p>
        </div>
        <div className="flex items-center gap-2">
          <Calendar className="h-4 w-4 text-muted-foreground" />
          <Select value={forecastPeriod} onValueChange={setForecastPeriod}>
            <SelectTrigger className="w-40" data-testid="select-forecast-period">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="7" data-testid="option-7-days">7 Days</SelectItem>
              <SelectItem value="14" data-testid="option-14-days">14 Days</SelectItem>
              <SelectItem value="30" data-testid="option-30-days">30 Days</SelectItem>
            </SelectContent>
          </Select>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <Card>
          <CardHeader className="pb-3">
            <CardDescription>{t.totalSales}</CardDescription>
            <CardTitle className="text-3xl font-bold font-mono">
              {totalSales.toFixed(2)} SAR
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex items-center gap-2 text-sm">
              <DollarSign className="h-4 w-4 text-muted-foreground" />
              <span className="text-muted-foreground">Last 30 days</span>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-3">
            <CardDescription>Average Daily Sales</CardDescription>
            <CardTitle className="text-3xl font-bold font-mono">
              {avgDailySales.toFixed(2)} SAR
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex items-center gap-2 text-sm">
              <Calendar className="h-4 w-4 text-muted-foreground" />
              <span className="text-muted-foreground">Per day average</span>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-3">
            <CardDescription>{t.predictedSales}</CardDescription>
            <CardTitle className="text-3xl font-bold font-mono">
              {predictedRevenue.toFixed(2)} SAR
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex items-center gap-2 text-sm">
              <TrendingUp className="h-4 w-4 text-green-600" />
              <span className="text-muted-foreground">Next {forecastPeriod} days</span>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-3">
            <CardDescription>{t.trendAnalysis}</CardDescription>
            <CardTitle className="text-3xl font-bold font-mono">
              {trendPercentage >= 0 ? '+' : ''}{trendPercentage.toFixed(1)}%
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex items-center gap-2 text-sm">
              {trendPercentage >= 0 ? (
                <TrendingUp className="h-4 w-4 text-green-600" />
              ) : (
                <TrendingDown className="h-4 w-4 text-red-600" />
              )}
              <span className="text-muted-foreground">vs previous week</span>
            </div>
          </CardContent>
        </Card>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>{t.salesPrediction}</CardTitle>
          <CardDescription>
            Historical sales data and future predictions based on trend analysis
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="h-80">
            <ResponsiveContainer width="100%" height="100%">
              <LineChart data={[...historicalData.slice(-14), ...forecastData]}>
                <CartesianGrid strokeDasharray="3 3" className="stroke-muted" />
                <XAxis 
                  dataKey="date" 
                  className="text-xs"
                  tick={{ fill: 'hsl(var(--muted-foreground))' }}
                />
                <YAxis 
                  className="text-xs"
                  tick={{ fill: 'hsl(var(--muted-foreground))' }}
                />
                <Tooltip 
                  contentStyle={{
                    backgroundColor: 'hsl(var(--card))',
                    border: '1px solid hsl(var(--border))',
                    borderRadius: '6px',
                  }}
                />
                <Legend />
                <Line 
                  type="monotone" 
                  dataKey="sales" 
                  stroke="hsl(var(--primary))" 
                  strokeWidth={2}
                  name="Historical Sales (SAR)"
                  dot={{ fill: 'hsl(var(--primary))' }}
                />
                <Line 
                  type="monotone" 
                  dataKey="predictedSales" 
                  stroke="hsl(var(--chart-2))" 
                  strokeWidth={2}
                  strokeDasharray="5 5"
                  name="Predicted Sales (SAR)"
                  dot={{ fill: 'hsl(var(--chart-2))' }}
                />
              </LineChart>
            </ResponsiveContainer>
          </div>
        </CardContent>
      </Card>

      {/* Items Sales Prediction Section */}
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <div>
              <CardTitle className="flex items-center gap-2">
                <DollarSign className="h-5 w-5" />
                {t.itemsSalesPrediction || "Items Sales Prediction"}
              </CardTitle>
              <CardDescription className="mt-2">
                {t.itemsSalesPredictionDesc || `Predicted revenue per menu item for the next ${forecastPeriod} days`}
              </CardDescription>
            </div>
          </div>
        </CardHeader>
        <CardContent>
          {itemSalesForecasts.length === 0 ? (
            <div className="text-center py-12 text-muted-foreground">
              <DollarSign className="h-12 w-12 mx-auto mb-4 opacity-50" />
              <p>{t.noSalesDataYet || "No sales data available yet"}</p>
              <p className="text-sm mt-1">{t.startSellingToSeePredictions || "Start selling items to see sales predictions"}</p>
            </div>
          ) : (
            <div className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
                <Card className="bg-muted/50">
                  <CardHeader className="pb-3">
                    <CardDescription>{t.totalPredictedRevenue || "Total Predicted Revenue"}</CardDescription>
                    <CardTitle className="text-2xl font-bold font-mono">
                      {totalForecastedItemRevenue.toFixed(2)} SAR
                    </CardTitle>
                  </CardHeader>
                  <CardContent className="pt-0">
                    <div className="text-sm text-muted-foreground">
                      {t.nextDays?.replace("{days}", forecastPeriod) || `Next ${forecastPeriod} days`}
                    </div>
                  </CardContent>
                </Card>
                <Card className="bg-muted/50">
                  <CardHeader className="pb-3">
                    <CardDescription>{t.last7DaysRevenue || "Last 7 Days Revenue"}</CardDescription>
                    <CardTitle className="text-2xl font-bold font-mono">
                      {totalLast7Revenue.toFixed(2)} SAR
                    </CardTitle>
                  </CardHeader>
                </Card>
                <Card className="bg-muted/50">
                  <CardHeader className="pb-3">
                    <CardDescription>{t.revenueTrend || "Revenue Trend"}</CardDescription>
                    <CardTitle className={`text-2xl font-bold font-mono ${itemRevenueTrendPercentage >= 0 ? 'text-green-600' : 'text-red-600'}`}>
                      {itemRevenueTrendPercentage >= 0 ? '+' : ''}{itemRevenueTrendPercentage.toFixed(1)}%
                    </CardTitle>
                  </CardHeader>
                  <CardContent className="pt-0">
                    <div className="flex items-center gap-1 text-sm text-muted-foreground">
                      {itemRevenueTrendPercentage >= 0 ? (
                        <TrendingUp className="h-3 w-3 text-green-600" />
                      ) : (
                        <TrendingDown className="h-3 w-3 text-red-600" />
                      )}
                      {t.vsPreviousWeek || "vs previous week"}
                    </div>
                  </CardContent>
                </Card>
              </div>

              <div className="rounded-md border">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead className="w-[200px]">{t.menuItem || "Menu Item"}</TableHead>
                      <TableHead className="text-right">{t.unitPrice || "Unit Price"}</TableHead>
                      <TableHead className="text-center">{`${t.forecastedUnits || "Forecasted Units"} (${forecastPeriod}d)`}</TableHead>
                      <TableHead className="text-right">{t.dailyRevenue || "Daily Revenue"}</TableHead>
                      <TableHead className="text-right">{`${t.periodRevenue || "Period Revenue"} (${forecastPeriod}d)`}</TableHead>
                      <TableHead className="text-center">{t.trendAnalysis || "Trend"}</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {itemSalesForecasts.slice(0, 15).map((item) => (
                      <TableRow key={item.id} data-testid={`row-item-sales-${item.id}`}>
                        <TableCell className="font-medium" data-testid={`text-item-sales-name-${item.id}`}>
                          {item.name}
                        </TableCell>
                        <TableCell className="text-right font-mono" data-testid={`text-item-price-${item.id}`}>
                          {item.price.toFixed(2)} SAR
                        </TableCell>
                        <TableCell className="text-center font-mono" data-testid={`text-item-forecast-units-${item.id}`}>
                          {item.forecastedDemand * parseInt(forecastPeriod)}
                        </TableCell>
                        <TableCell className="text-right font-mono" data-testid={`text-item-daily-revenue-${item.id}`}>
                          {item.forecastedRevenue.toFixed(2)} SAR
                        </TableCell>
                        <TableCell className="text-right font-mono font-bold" data-testid={`text-item-period-revenue-${item.id}`}>
                          {item.forecastedRevenuePeriod.toFixed(2)} SAR
                        </TableCell>
                        <TableCell className="text-center" data-testid={`text-item-sales-trend-${item.id}`}>
                          <div className="flex items-center justify-center">
                            {item.trend === 'up' ? (
                              <Badge variant="default" className="bg-green-600 hover:bg-green-700">
                                <ArrowUp className="h-3 w-3 mr-1" />
                                +{item.trendPercentage}%
                              </Badge>
                            ) : item.trend === 'down' ? (
                              <Badge variant="destructive">
                                <ArrowDown className="h-3 w-3 mr-1" />
                                {item.trendPercentage}%
                              </Badge>
                            ) : (
                              <Badge variant="secondary">
                                <Minus className="h-3 w-3 mr-1" />
                                {item.trendPercentage}%
                              </Badge>
                            )}
                          </div>
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </div>
              
              {itemSalesForecasts.length > 15 && (
                <div className="text-sm text-muted-foreground text-center py-2">
                  {t.showingTopItems?.replace("{count}", "15") || "Showing top 15 items by predicted revenue"}
                </div>
              )}
            </div>
          )}
        </CardContent>
      </Card>

      {/* Inventory Forecasting Section */}
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <div>
              <CardTitle className="flex items-center gap-2">
                <Package className="h-5 w-5" />
                {t.inventoryForecast || "Inventory Forecast"}
              </CardTitle>
              <CardDescription className="mt-2">
                {t.inventoryForecastDesc || `Predicted inventory requirements for the next ${forecastPeriod} days based on sales forecast`}
              </CardDescription>
            </div>
          </div>
        </CardHeader>
        <CardContent>
          {inventoryForecasts.length === 0 ? (
            <div className="text-center py-12 text-muted-foreground">
              <Package className="h-12 w-12 mx-auto mb-4 opacity-50" />
              <p>{t.noInventoryData || "No inventory data available"}</p>
              <p className="text-sm mt-1">{t.linkRecipesToMenuItems || "Link recipes to menu items to see inventory forecasts"}</p>
            </div>
          ) : (
            <div className="space-y-4">
              {/* Summary Cards */}
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
                <Card className="bg-red-50 dark:bg-red-950/30 border-red-200 dark:border-red-900">
                  <CardHeader className="pb-3">
                    <CardDescription className="text-red-600 dark:text-red-400">{t.criticalStock || "Critical Stock"}</CardDescription>
                    <CardTitle className="text-2xl font-bold text-red-600 dark:text-red-400">
                      {criticalItems}
                    </CardTitle>
                  </CardHeader>
                  <CardContent className="pt-0">
                    <div className="text-sm text-red-600/80 dark:text-red-400/80">
                      {t.needsImmediateReorder || "Needs immediate reorder"}
                    </div>
                  </CardContent>
                </Card>
                <Card className="bg-yellow-50 dark:bg-yellow-950/30 border-yellow-200 dark:border-yellow-900">
                  <CardHeader className="pb-3">
                    <CardDescription className="text-yellow-600 dark:text-yellow-400">{t.lowStock || "Low Stock"}</CardDescription>
                    <CardTitle className="text-2xl font-bold text-yellow-600 dark:text-yellow-400">
                      {lowItems}
                    </CardTitle>
                  </CardHeader>
                  <CardContent className="pt-0">
                    <div className="text-sm text-yellow-600/80 dark:text-yellow-400/80">
                      {t.reorderSoon || "Consider reordering soon"}
                    </div>
                  </CardContent>
                </Card>
                <Card className="bg-green-50 dark:bg-green-950/30 border-green-200 dark:border-green-900">
                  <CardHeader className="pb-3">
                    <CardDescription className="text-green-600 dark:text-green-400">{t.sufficientStock || "Sufficient Stock"}</CardDescription>
                    <CardTitle className="text-2xl font-bold text-green-600 dark:text-green-400">
                      {sufficientItems}
                    </CardTitle>
                  </CardHeader>
                  <CardContent className="pt-0">
                    <div className="text-sm text-green-600/80 dark:text-green-400/80">
                      {t.stockLevelOk || "Stock levels are adequate"}
                    </div>
                  </CardContent>
                </Card>
              </div>

              {/* Inventory Table */}
              <div className="rounded-md border">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead className="w-[200px]">{t.inventoryItem || "Inventory Item"}</TableHead>
                      <TableHead className="text-right">{t.currentStock || "Current Stock"}</TableHead>
                      <TableHead className="text-right">{`${t.requiredQuantity || "Required"} (${forecastPeriod}d)`}</TableHead>
                      <TableHead className="text-right">{t.shortfall || "Shortfall"}</TableHead>
                      <TableHead className="text-center">{t.status || "Status"}</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {inventoryForecasts.slice(0, 20).map((item) => (
                      <TableRow key={item.inventoryItemId} data-testid={`row-inventory-forecast-${item.inventoryItemId}`}>
                        <TableCell className="font-medium" data-testid={`text-inventory-name-${item.inventoryItemId}`}>
                          {item.name}
                        </TableCell>
                        <TableCell className="text-right font-mono" data-testid={`text-current-stock-${item.inventoryItemId}`}>
                          {item.currentStock.toFixed(2)} {item.unit}
                        </TableCell>
                        <TableCell className="text-right font-mono" data-testid={`text-required-qty-${item.inventoryItemId}`}>
                          {item.requiredQuantity.toFixed(2)} {item.unit}
                        </TableCell>
                        <TableCell className="text-right font-mono font-bold" data-testid={`text-shortfall-${item.inventoryItemId}`}>
                          {item.shortfall > 0 ? (
                            <span className="text-red-600 dark:text-red-400">-{item.shortfall.toFixed(2)} {item.unit}</span>
                          ) : (
                            <span className="text-green-600 dark:text-green-400">0 {item.unit}</span>
                          )}
                        </TableCell>
                        <TableCell className="text-center" data-testid={`text-inventory-status-${item.inventoryItemId}`}>
                          {item.status === 'critical' ? (
                            <Badge variant="destructive">{t.critical || "Critical"}</Badge>
                          ) : item.status === 'low' ? (
                            <Badge variant="outline" className="border-yellow-500 text-yellow-600 dark:text-yellow-400">{t.low || "Low"}</Badge>
                          ) : (
                            <Badge variant="outline" className="border-green-500 text-green-600 dark:text-green-400">{t.sufficient || "Sufficient"}</Badge>
                          )}
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </div>
              
              {inventoryForecasts.length > 20 && (
                <div className="text-sm text-muted-foreground text-center py-2">
                  {t.showingTopInventory?.replace("{count}", "20") || "Showing top 20 inventory items by shortfall"}
                </div>
              )}
            </div>
          )}
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Transaction Volume</CardTitle>
          <CardDescription>
            Number of transactions per day over the last 30 days
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="h-80">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={historicalData}>
                <CartesianGrid strokeDasharray="3 3" className="stroke-muted" />
                <XAxis 
                  dataKey="date" 
                  className="text-xs"
                  tick={{ fill: 'hsl(var(--muted-foreground))' }}
                />
                <YAxis 
                  className="text-xs"
                  tick={{ fill: 'hsl(var(--muted-foreground))' }}
                />
                <Tooltip 
                  contentStyle={{
                    backgroundColor: 'hsl(var(--card))',
                    border: '1px solid hsl(var(--border))',
                    borderRadius: '6px',
                  }}
                />
                <Bar 
                  dataKey="transactions" 
                  fill="hsl(var(--chart-3))" 
                  name="Transactions"
                  radius={[4, 4, 0, 0]}
                />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <div>
              <CardTitle className="flex items-center gap-2">
                <Package className="h-5 w-5" />
                Daily Demand Forecasting per Menu Item
              </CardTitle>
              <CardDescription className="mt-2">
                Predicted daily demand for each menu item based on last 30 days of sales data
              </CardDescription>
            </div>
          </div>
        </CardHeader>
        <CardContent>
          {itemDemandForecasts.length === 0 ? (
            <div className="text-center py-12 text-muted-foreground">
              <Package className="h-12 w-12 mx-auto mb-4 opacity-50" />
              <p>No sales data available yet</p>
              <p className="text-sm mt-1">Start selling items to see demand forecasts</p>
            </div>
          ) : (
            <div className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
                <Card className="bg-muted/50">
                  <CardHeader className="pb-3">
                    <CardDescription>Total Items Tracked</CardDescription>
                    <CardTitle className="text-2xl font-bold">
                      {itemDemandForecasts.length}
                    </CardTitle>
                  </CardHeader>
                </Card>
                <Card className="bg-muted/50">
                  <CardHeader className="pb-3">
                    <CardDescription>Trending Up</CardDescription>
                    <CardTitle className="text-2xl font-bold text-green-600">
                      {itemDemandForecasts.filter(i => i.trend === 'up').length}
                    </CardTitle>
                  </CardHeader>
                </Card>
                <Card className="bg-muted/50">
                  <CardHeader className="pb-3">
                    <CardDescription>Trending Down</CardDescription>
                    <CardTitle className="text-2xl font-bold text-red-600">
                      {itemDemandForecasts.filter(i => i.trend === 'down').length}
                    </CardTitle>
                  </CardHeader>
                </Card>
              </div>

              <div className="rounded-md border">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead className="w-[250px]">Menu Item</TableHead>
                      <TableHead className="text-center">Avg Daily Demand (30d)</TableHead>
                      <TableHead className="text-center">Last 7 Days</TableHead>
                      <TableHead className="text-center">Prev 7 Days</TableHead>
                      <TableHead className="text-center">Trend</TableHead>
                      <TableHead className="text-center">Forecasted Daily Demand</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {itemDemandForecasts.map((item) => (
                      <TableRow key={item.id} data-testid={`row-item-forecast-${item.id}`}>
                        <TableCell className="font-medium" data-testid={`text-item-name-${item.id}`}>
                          {item.name}
                        </TableCell>
                        <TableCell className="text-center font-mono" data-testid={`text-avg-demand-${item.id}`}>
                          {item.avgDailyDemand}
                        </TableCell>
                        <TableCell className="text-center font-mono" data-testid={`text-last7-${item.id}`}>
                          {item.last7DaysDemand}
                        </TableCell>
                        <TableCell className="text-center font-mono" data-testid={`text-prev7-${item.id}`}>
                          {item.prev7DaysDemand}
                        </TableCell>
                        <TableCell className="text-center" data-testid={`text-trend-${item.id}`}>
                          <div className="flex items-center justify-center gap-2">
                            {item.trend === 'up' ? (
                              <>
                                <Badge variant="default" className="bg-green-600 hover:bg-green-700">
                                  <ArrowUp className="h-3 w-3 mr-1" />
                                  +{item.trendPercentage}%
                                </Badge>
                              </>
                            ) : item.trend === 'down' ? (
                              <>
                                <Badge variant="destructive">
                                  <ArrowDown className="h-3 w-3 mr-1" />
                                  {item.trendPercentage}%
                                </Badge>
                              </>
                            ) : (
                              <>
                                <Badge variant="secondary">
                                  <Minus className="h-3 w-3 mr-1" />
                                  {item.trendPercentage}%
                                </Badge>
                              </>
                            )}
                          </div>
                        </TableCell>
                        <TableCell className="text-center" data-testid={`text-forecast-${item.id}`}>
                          <div className="font-bold text-lg font-mono">
                            {item.forecastedDemand}
                          </div>
                          <div className="text-xs text-muted-foreground">
                            units/day
                          </div>
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </div>

              <div className="text-sm text-muted-foreground mt-4 p-4 bg-muted/50 rounded-lg">
                <p className="font-medium mb-2">How to use this forecast:</p>
                <ul className="space-y-1 ml-4 list-disc">
                  <li>Use the "Forecasted Daily Demand" column to plan inventory and ingredient procurement</li>
                  <li>Items trending <span className="text-green-600 font-medium">up ↑</span> may need increased stock preparation</li>
                  <li>Items trending <span className="text-red-600 font-medium">down ↓</span> may need promotional efforts</li>
                  <li>Forecasts are based on moving average and trend analysis of the last 14 days</li>
                </ul>
              </div>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
