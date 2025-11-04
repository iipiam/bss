import { useState } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer, BarChart, Bar } from "recharts";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { TrendingUp, TrendingDown, Calendar, DollarSign } from "lucide-react";
import { useQuery } from "@tanstack/react-query";
import { useLanguage } from "@/contexts/LanguageContext";
import type { Transaction } from "@shared/schema";

export default function Forecasting() {
  const { t } = useLanguage();
  const [forecastPeriod, setForecastPeriod] = useState("7");

  const { data: transactions = [] } = useQuery<Transaction[]>({
    queryKey: ["/api/transactions"],
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
    </div>
  );
}
