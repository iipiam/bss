import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Skeleton } from "@/components/ui/skeleton";
import { TrendingUp, Search, Calendar, Building2, Factory } from "lucide-react";
import { useQuery } from "@tanstack/react-query";
import { useLanguage } from "@/contexts/LanguageContext";
import { useDeviceLayout } from "@/lib/mobileLayout";
import { useState } from "react";
import { format } from "date-fns";

interface PerformanceData {
  restaurantId: string;
  restaurantName: string;
  businessType: string;
  activeUsersCount: number;
  totalSales: string;
  totalOrders: number;
  avgOrderValue: string;
  lastActivityAt: string | null;
}

export default function Performance() {
  const { t } = useLanguage();
  const layout = useDeviceLayout();
  const [dateRange, setDateRange] = useState<string>("30");
  const [searchQuery, setSearchQuery] = useState<string>("");

  // Fetch performance data with date range filter
  const { data: performanceData = [], isLoading } = useQuery<PerformanceData[]>({
    queryKey: ["/api/it/performance", dateRange],
    queryFn: async () => {
      const params = new URLSearchParams();
      if (dateRange) {
        params.append("dateRange", dateRange);
      }
      const response = await fetch(`/api/it/performance?${params.toString()}`);
      if (!response.ok) {
        throw new Error("Failed to fetch performance data");
      }
      return response.json();
    },
    refetchInterval: 30000, // Refresh every 30 seconds
  });

  // Filter data based on search query (restaurant name only)
  const filteredData = performanceData.filter((item) => {
    const query = searchQuery.toLowerCase();
    return item.restaurantName.toLowerCase().includes(query);
  });

  const formatCurrency = (amount: string) => {
    return `${parseFloat(amount).toFixed(2)} SAR`;
  };

  const formatDate = (dateString: string | null) => {
    if (!dateString) return "No activity";
    try {
      return format(new Date(dateString), "MMM dd, yyyy HH:mm");
    } catch {
      return "Invalid Date";
    }
  };

  return (
    <div className={`${layout.padding} ${layout.spaceY}`}>
      {/* Header */}
      <div className="flex items-start justify-between gap-4 flex-wrap">
        <div className="flex-1 min-w-[200px]">
          <h1 className={`${layout.text3Xl} font-bold mb-2`} data-testid="text-page-title">
            Performance Tracking
          </h1>
          <p className="text-muted-foreground">Monitor sales performance across all client accounts</p>
        </div>
        <Badge variant="outline" className="flex items-center gap-2">
          <TrendingUp className="h-4 w-4" />
          {filteredData.length} {filteredData.length === 1 ? "Account" : "Accounts"}
        </Badge>
      </div>

      {/* Filters */}
      <Card>
        <CardHeader>
          <CardTitle className="text-lg">Filters</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid gap-4 md:grid-cols-2">
            {/* Date Range Filter */}
            <div className="space-y-2">
              <label className="text-sm font-medium flex items-center gap-2">
                <Calendar className="h-4 w-4" />
                Date Range
              </label>
              <Select value={dateRange} onValueChange={setDateRange}>
                <SelectTrigger data-testid="select-date-range">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="7">Last 7 days</SelectItem>
                  <SelectItem value="30">Last 30 days</SelectItem>
                  <SelectItem value="60">Last 60 days</SelectItem>
                  <SelectItem value="90">Last 90 days</SelectItem>
                  <SelectItem value="180">Last 6 months</SelectItem>
                  <SelectItem value="365">Last year</SelectItem>
                </SelectContent>
              </Select>
            </div>

            {/* Search Filter */}
            <div className="space-y-2">
              <label className="text-sm font-medium flex items-center gap-2">
                <Search className="h-4 w-4" />
                Search
              </label>
              <Input
                placeholder="Search by restaurant name..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                data-testid="input-search"
              />
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Performance Table */}
      <Card>
        <CardHeader>
          <CardTitle>Sales Performance</CardTitle>
          <CardDescription>
            Showing {filteredData.length} of {performanceData.length} client accounts
          </CardDescription>
        </CardHeader>
        <CardContent>
          {isLoading ? (
            <div className="space-y-3">
              {[...Array(5)].map((_, i) => (
                <Skeleton key={i} className="h-12 w-full" />
              ))}
            </div>
          ) : filteredData.length === 0 ? (
            <div className="text-center py-12" data-testid="empty-state">
              <TrendingUp className="h-12 w-12 mx-auto text-muted-foreground mb-4" />
              <h3 className="text-lg font-semibold mb-2">No Performance Data</h3>
              <p className="text-muted-foreground">
                {searchQuery
                  ? "No accounts match your search criteria"
                  : "No sales data available for the selected date range"}
              </p>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <Table data-testid="table-performance">
                <TableHeader>
                  <TableRow>
                    <TableHead>Restaurant Name</TableHead>
                    <TableHead>Business Type</TableHead>
                    <TableHead className="text-right">Total Sales (SAR)</TableHead>
                    <TableHead className="text-right">Total Orders</TableHead>
                    <TableHead className="text-right">Avg Order Value (SAR)</TableHead>
                    <TableHead className="text-right">Active Users</TableHead>
                    <TableHead>Last Activity</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {filteredData.map((item) => (
                    <TableRow key={item.restaurantId} data-testid={`row-performance-${item.restaurantId}`}>
                      <TableCell className="font-medium" data-testid={`text-restaurant-${item.restaurantId}`}>
                        {item.restaurantName}
                      </TableCell>
                      <TableCell data-testid={`badge-business-type-${item.restaurantId}`}>
                        <Badge variant={item.businessType === "factory" ? "secondary" : "outline"} className="flex items-center gap-1 w-fit">
                          {item.businessType === "factory" ? (
                            <>
                              <Factory className="h-3 w-3" />
                              Factory
                            </>
                          ) : (
                            <>
                              <Building2 className="h-3 w-3" />
                              Restaurant
                            </>
                          )}
                        </Badge>
                      </TableCell>
                      <TableCell className="text-right font-semibold" data-testid={`text-total-sales-${item.restaurantId}`}>
                        {formatCurrency(item.totalSales)}
                      </TableCell>
                      <TableCell className="text-right" data-testid={`text-total-orders-${item.restaurantId}`}>
                        {item.totalOrders}
                      </TableCell>
                      <TableCell className="text-right" data-testid={`text-avg-order-${item.restaurantId}`}>
                        {formatCurrency(item.avgOrderValue)}
                      </TableCell>
                      <TableCell className="text-right" data-testid={`text-active-users-${item.restaurantId}`}>
                        {item.activeUsersCount}
                      </TableCell>
                      <TableCell data-testid={`text-last-activity-${item.restaurantId}`}>
                        {formatDate(item.lastActivityAt)}
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
