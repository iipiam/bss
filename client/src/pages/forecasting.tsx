import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer, Area, AreaChart } from "recharts";
import { Button } from "@/components/ui/button";
import { TrendingUp, TrendingDown, Calendar } from "lucide-react";
import { Badge } from "@/components/ui/badge";

const historicalData = [
  { month: "May", actual: 95000, predicted: null },
  { month: "Jun", actual: 102000, predicted: null },
  { month: "Jul", actual: 108000, predicted: null },
  { month: "Aug", actual: 105000, predicted: null },
  { month: "Sep", actual: 112000, predicted: null },
  { month: "Oct", actual: 118000, predicted: null },
  { month: "Nov", actual: null, predicted: 125000 },
  { month: "Dec", actual: null, predicted: 138000 },
  { month: "Jan", actual: null, predicted: 142000 },
];

const demandForecast = [
  { item: "Margherita Pizza", currentDemand: 245, predictedDemand: 285, trend: "up", change: 16.3 },
  { item: "Chicken Shawarma", currentDemand: 198, predictedDemand: 215, trend: "up", change: 8.6 },
  { item: "Beef Burger", currentDemand: 176, predictedDemand: 165, trend: "down", change: -6.3 },
  { item: "Caesar Salad", currentDemand: 152, predictedDemand: 178, trend: "up", change: 17.1 },
  { item: "Pepperoni Pizza", currentDemand: 143, predictedDemand: 158, trend: "up", change: 10.5 },
];

const peakHours = [
  { hour: "11 AM", orders: 12 },
  { hour: "12 PM", orders: 28 },
  { hour: "1 PM", orders: 45 },
  { hour: "2 PM", orders: 38 },
  { hour: "3 PM", orders: 18 },
  { hour: "6 PM", orders: 25 },
  { hour: "7 PM", orders: 52 },
  { hour: "8 PM", orders: 48 },
  { hour: "9 PM", orders: 35 },
];

export default function Forecasting() {
  return (
    <div className="p-8 space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold mb-2">Sales Forecasting</h1>
          <p className="text-muted-foreground">Predictive analytics and demand forecasting</p>
        </div>
        <Button variant="outline" data-testid="button-forecast-settings">
          <Calendar className="h-4 w-4 mr-2" />
          Adjust Forecast Period
        </Button>
      </div>

      <div className="grid gap-6 md:grid-cols-3">
        <Card>
          <CardHeader>
            <CardTitle className="text-sm font-medium text-muted-foreground">Predicted Revenue</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-3xl font-bold font-mono">125,000 SAR</p>
            <p className="text-sm text-green-600 mt-2 flex items-center gap-1">
              <TrendingUp className="h-4 w-4" />
              +5.9% from this month
            </p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader>
            <CardTitle className="text-sm font-medium text-muted-foreground">Expected Orders</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-3xl font-bold font-mono">920</p>
            <p className="text-sm text-green-600 mt-2 flex items-center gap-1">
              <TrendingUp className="h-4 w-4" />
              +8.6% predicted growth
            </p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader>
            <CardTitle className="text-sm font-medium text-muted-foreground">Confidence Level</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-3xl font-bold font-mono">87%</p>
            <p className="text-sm text-muted-foreground mt-2">Based on 6 months data</p>
          </CardContent>
        </Card>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Revenue Forecast - Next 3 Months</CardTitle>
        </CardHeader>
        <CardContent>
          <ResponsiveContainer width="100%" height={350}>
            <LineChart data={historicalData}>
              <CartesianGrid strokeDasharray="3 3" className="stroke-border" />
              <XAxis dataKey="month" className="text-xs" />
              <YAxis className="text-xs" />
              <Tooltip />
              <Legend />
              <Line
                type="monotone"
                dataKey="actual"
                stroke="hsl(var(--primary))"
                strokeWidth={2}
                name="Actual Sales"
                dot={{ r: 4 }}
              />
              <Line
                type="monotone"
                dataKey="predicted"
                stroke="hsl(var(--chart-2))"
                strokeWidth={2}
                strokeDasharray="5 5"
                name="Predicted Sales"
                dot={{ r: 4 }}
              />
            </LineChart>
          </ResponsiveContainer>
        </CardContent>
      </Card>

      <div className="grid gap-6 lg:grid-cols-2">
        <Card>
          <CardHeader>
            <CardTitle>Item Demand Forecast</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {demandForecast.map((item, idx) => (
                <div key={idx} className="p-4 rounded-md border">
                  <div className="flex items-center justify-between mb-2">
                    <p className="font-semibold">{item.item}</p>
                    <Badge variant={item.trend === "up" ? "default" : "secondary"}>
                      {item.trend === "up" ? (
                        <TrendingUp className="h-3 w-3 mr-1" />
                      ) : (
                        <TrendingDown className="h-3 w-3 mr-1" />
                      )}
                      {Math.abs(item.change)}%
                    </Badge>
                  </div>
                  <div className="grid grid-cols-2 gap-4 text-sm">
                    <div>
                      <p className="text-muted-foreground">Current Demand</p>
                      <p className="font-mono font-semibold">{item.currentDemand}/month</p>
                    </div>
                    <div>
                      <p className="text-muted-foreground">Predicted Demand</p>
                      <p className="font-mono font-semibold">{item.predictedDemand}/month</p>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Peak Hours Analysis</CardTitle>
          </CardHeader>
          <CardContent>
            <ResponsiveContainer width="100%" height={350}>
              <AreaChart data={peakHours}>
                <CartesianGrid strokeDasharray="3 3" className="stroke-border" />
                <XAxis dataKey="hour" className="text-xs" />
                <YAxis className="text-xs" />
                <Tooltip />
                <Area
                  type="monotone"
                  dataKey="orders"
                  stroke="hsl(var(--primary))"
                  fill="hsl(var(--primary))"
                  fillOpacity={0.2}
                />
              </AreaChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
