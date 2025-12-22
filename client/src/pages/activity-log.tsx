import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { ScrollArea } from "@/components/ui/scroll-area";
import { 
  Activity, 
  Search, 
  Filter, 
  Calendar,
  Package,
  Utensils,
  ShoppingCart,
  ChefHat,
  ClipboardList,
  RefreshCw,
  User,
  Clock,
  AlertCircle
} from "lucide-react";
import type { EmployeeActivityLog, User as UserType } from "@shared/schema";
import { useLanguage } from "@/contexts/LanguageContext";
import { useDeviceLayout } from "@/lib/mobileLayout";
import { format } from "date-fns";

const CATEGORY_ICONS: Record<string, any> = {
  orders: ShoppingCart,
  inventory: Package,
  menu: Utensils,
  recipes: ChefHat,
  procurement: ClipboardList,
};

const CATEGORY_COLORS: Record<string, string> = {
  orders: "bg-blue-500/10 text-blue-600",
  inventory: "bg-green-500/10 text-green-600",
  menu: "bg-purple-500/10 text-purple-600",
  recipes: "bg-orange-500/10 text-orange-600",
  procurement: "bg-teal-500/10 text-teal-600",
};

const ACTION_COLORS: Record<string, string> = {
  create: "bg-green-500/10 text-green-600 border-green-200",
  update: "bg-blue-500/10 text-blue-600 border-blue-200",
  delete: "bg-red-500/10 text-red-600 border-red-200",
  created_order: "bg-green-500/10 text-green-600 border-green-200",
  created_inventory: "bg-green-500/10 text-green-600 border-green-200",
  updated_inventory: "bg-blue-500/10 text-blue-600 border-blue-200",
  deleted_inventory: "bg-red-500/10 text-red-600 border-red-200",
  created_menu_item: "bg-green-500/10 text-green-600 border-green-200",
  updated_menu_item: "bg-blue-500/10 text-blue-600 border-blue-200",
  deleted_menu_item: "bg-red-500/10 text-red-600 border-red-200",
  created_recipe: "bg-green-500/10 text-green-600 border-green-200",
  updated_recipe: "bg-blue-500/10 text-blue-600 border-blue-200",
  deleted_recipe: "bg-red-500/10 text-red-600 border-red-200",
  created_procurement: "bg-green-500/10 text-green-600 border-green-200",
  updated_procurement: "bg-blue-500/10 text-blue-600 border-blue-200",
  deleted_procurement: "bg-red-500/10 text-red-600 border-red-200",
};

const translations = {
  en: {
    title: "Activity Log",
    description: "Track all employee actions across your restaurant",
    searchPlaceholder: "Search activities...",
    filterByEmployee: "Filter by Employee",
    filterByCategory: "Filter by Category",
    allEmployees: "All Employees",
    allCategories: "All Categories",
    orders: "Orders",
    inventory: "Inventory",
    menu: "Menu",
    recipes: "Recipes",
    procurement: "Procurement",
    noActivities: "No activities found",
    noActivitiesDesc: "Employee actions will appear here once they start using the system",
    loading: "Loading activities...",
    refresh: "Refresh",
    today: "Today",
    yesterday: "Yesterday",
    thisWeek: "This Week",
    older: "Older",
    at: "at",
    by: "by",
    totalActivities: "Total Activities",
    activeEmployees: "Active Employees",
    mostActiveCategory: "Most Active Category",
    recentActivity: "Recent Activity",
  },
  ar: {
    title: "سجل النشاط",
    description: "تتبع جميع إجراءات الموظفين في مطعمك",
    searchPlaceholder: "البحث في النشاطات...",
    filterByEmployee: "تصفية حسب الموظف",
    filterByCategory: "تصفية حسب الفئة",
    allEmployees: "جميع الموظفين",
    allCategories: "جميع الفئات",
    orders: "الطلبات",
    inventory: "المخزون",
    menu: "القائمة",
    recipes: "الوصفات",
    procurement: "المشتريات",
    noActivities: "لا توجد نشاطات",
    noActivitiesDesc: "ستظهر إجراءات الموظفين هنا بمجرد بدء استخدامهم للنظام",
    loading: "جاري تحميل النشاطات...",
    refresh: "تحديث",
    today: "اليوم",
    yesterday: "أمس",
    thisWeek: "هذا الأسبوع",
    older: "أقدم",
    at: "في",
    by: "بواسطة",
    totalActivities: "إجمالي النشاطات",
    activeEmployees: "الموظفين النشطين",
    mostActiveCategory: "الفئة الأكثر نشاطاً",
    recentActivity: "النشاط الأخير",
  },
};

export default function ActivityLog() {
  const { language } = useLanguage();
  const layout = useDeviceLayout();
  const t = translations[language as keyof typeof translations] || translations.en;
  
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedEmployee, setSelectedEmployee] = useState<string>("all");
  const [selectedCategory, setSelectedCategory] = useState<string>("all");

  // Fetch activities
  const { data: activities = [], isLoading, refetch } = useQuery<EmployeeActivityLog[]>({
    queryKey: ["/api/employee-activities", selectedEmployee, selectedCategory],
    queryFn: async () => {
      const params = new URLSearchParams();
      if (selectedEmployee && selectedEmployee !== "all") {
        params.append("employeeId", selectedEmployee);
      }
      if (selectedCategory && selectedCategory !== "all") {
        params.append("category", selectedCategory);
      }
      const url = `/api/employee-activities${params.toString() ? `?${params.toString()}` : ""}`;
      const res = await fetch(url, { credentials: "include" });
      if (!res.ok) throw new Error("Failed to fetch activities");
      return res.json();
    },
    refetchInterval: 30000, // Refresh every 30 seconds
  });

  // Fetch employees for filter
  const { data: employees = [] } = useQuery<UserType[]>({
    queryKey: ["/api/users"],
  });

  // Filter activities by search query
  const filteredActivities = activities.filter((activity) => {
    if (!searchQuery) return true;
    const query = searchQuery.toLowerCase();
    return (
      activity.employeeName?.toLowerCase().includes(query) ||
      activity.description?.toLowerCase().includes(query) ||
      activity.action?.toLowerCase().includes(query)
    );
  });

  // Calculate stats
  const uniqueEmployees = new Set(activities.map((a) => a.employeeId)).size;
  const categoryCounts = activities.reduce((acc, a) => {
    acc[a.actionCategory] = (acc[a.actionCategory] || 0) + 1;
    return acc;
  }, {} as Record<string, number>);
  const mostActiveCategory = Object.entries(categoryCounts).sort((a, b) => b[1] - a[1])[0]?.[0] || "-";

  // Group activities by date
  const groupedActivities = filteredActivities.reduce((groups, activity) => {
    const date = new Date(activity.createdAt);
    const today = new Date();
    const yesterday = new Date(today);
    yesterday.setDate(yesterday.getDate() - 1);
    const weekAgo = new Date(today);
    weekAgo.setDate(weekAgo.getDate() - 7);

    let groupKey: string;
    if (date.toDateString() === today.toDateString()) {
      groupKey = t.today;
    } else if (date.toDateString() === yesterday.toDateString()) {
      groupKey = t.yesterday;
    } else if (date > weekAgo) {
      groupKey = t.thisWeek;
    } else {
      groupKey = t.older;
    }

    if (!groups[groupKey]) groups[groupKey] = [];
    groups[groupKey].push(activity);
    return groups;
  }, {} as Record<string, EmployeeActivityLog[]>);

  const getCategoryLabel = (category: string) => {
    const labels: Record<string, string> = {
      orders: t.orders,
      inventory: t.inventory,
      menu: t.menu,
      recipes: t.recipes,
      procurement: t.procurement,
    };
    return labels[category] || category;
  };

  const formatTime = (date: Date | string) => {
    return format(new Date(date), "h:mm a");
  };

  const formatDate = (date: Date | string) => {
    return format(new Date(date), "MMM d, yyyy");
  };

  if (isLoading) {
    return (
      <div className="p-4 md:p-6 space-y-6">
        <Skeleton className="h-8 w-64" />
        <div className="grid gap-4 md:grid-cols-3">
          <Skeleton className="h-24" />
          <Skeleton className="h-24" />
          <Skeleton className="h-24" />
        </div>
        <Skeleton className="h-96" />
      </div>
    );
  }

  return (
    <div className="p-4 md:p-6 space-y-6">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold flex items-center gap-2" data-testid="text-page-title">
            <Activity className="h-6 w-6" />
            {t.title}
          </h1>
          <p className="text-muted-foreground">{t.description}</p>
        </div>
        <Button 
          variant="outline" 
          onClick={() => refetch()}
          data-testid="button-refresh"
        >
          <RefreshCw className="h-4 w-4 mr-2" />
          {t.refresh}
        </Button>
      </div>

      {/* Stats Cards */}
      <div className="grid gap-4 md:grid-cols-3">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between gap-2 pb-2">
            <CardTitle className="text-sm font-medium">{t.totalActivities}</CardTitle>
            <Activity className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold" data-testid="text-total-activities">
              {activities.length}
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between gap-2 pb-2">
            <CardTitle className="text-sm font-medium">{t.activeEmployees}</CardTitle>
            <User className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold" data-testid="text-active-employees">
              {uniqueEmployees}
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between gap-2 pb-2">
            <CardTitle className="text-sm font-medium">{t.mostActiveCategory}</CardTitle>
            <Filter className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold capitalize" data-testid="text-most-active-category">
              {getCategoryLabel(mostActiveCategory)}
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Filters */}
      <Card>
        <CardContent className="pt-6">
          <div className="flex flex-col md:flex-row gap-4">
            <div className="flex-1">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                <Input
                  placeholder={t.searchPlaceholder}
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="pl-10"
                  data-testid="input-search"
                />
              </div>
            </div>
            <Select value={selectedEmployee} onValueChange={setSelectedEmployee}>
              <SelectTrigger className="w-full md:w-[200px]" data-testid="select-employee">
                <SelectValue placeholder={t.filterByEmployee} />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">{t.allEmployees}</SelectItem>
                {employees.filter(e => e.role !== "admin").map((employee) => (
                  <SelectItem key={employee.id} value={employee.id}>
                    {employee.fullName || employee.username}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
            <Select value={selectedCategory} onValueChange={setSelectedCategory}>
              <SelectTrigger className="w-full md:w-[200px]" data-testid="select-category">
                <SelectValue placeholder={t.filterByCategory} />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">{t.allCategories}</SelectItem>
                <SelectItem value="orders">{t.orders}</SelectItem>
                <SelectItem value="inventory">{t.inventory}</SelectItem>
                <SelectItem value="menu">{t.menu}</SelectItem>
                <SelectItem value="recipes">{t.recipes}</SelectItem>
                <SelectItem value="procurement">{t.procurement}</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </CardContent>
      </Card>

      {/* Activity List */}
      <Card>
        <CardHeader>
          <CardTitle>{t.recentActivity}</CardTitle>
          <CardDescription>
            {filteredActivities.length} {filteredActivities.length === 1 ? "activity" : "activities"}
          </CardDescription>
        </CardHeader>
        <CardContent>
          {filteredActivities.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-12 text-center">
              <AlertCircle className="h-12 w-12 text-muted-foreground mb-4" />
              <h3 className="text-lg font-semibold">{t.noActivities}</h3>
              <p className="text-muted-foreground max-w-sm">{t.noActivitiesDesc}</p>
            </div>
          ) : (
            <ScrollArea className="h-[500px]">
              <div className="space-y-6">
                {Object.entries(groupedActivities).map(([dateGroup, groupActivities]) => (
                  <div key={dateGroup}>
                    <h3 className="text-sm font-semibold text-muted-foreground mb-3 sticky top-0 bg-background py-1">
                      {dateGroup}
                    </h3>
                    <div className="space-y-3">
                      {groupActivities.map((activity) => {
                        const CategoryIcon = CATEGORY_ICONS[activity.actionCategory] || Activity;
                        const categoryColor = CATEGORY_COLORS[activity.actionCategory] || "bg-gray-500/10 text-gray-600";
                        const actionColor = ACTION_COLORS[activity.action] || "bg-gray-100 text-gray-600";
                        
                        return (
                          <div 
                            key={activity.id} 
                            className="flex items-start gap-4 p-4 rounded-lg border bg-card hover-elevate transition-colors"
                            data-testid={`activity-item-${activity.id}`}
                          >
                            <div className={`p-2 rounded-lg ${categoryColor}`}>
                              <CategoryIcon className="h-4 w-4" />
                            </div>
                            <div className="flex-1 min-w-0">
                              <div className="flex items-center gap-2 flex-wrap">
                                <span className="font-medium" data-testid={`text-activity-employee-${activity.id}`}>
                                  {activity.employeeName}
                                </span>
                                <Badge variant="outline" className={actionColor}>
                                  {activity.action.replace(/_/g, " ")}
                                </Badge>
                                <Badge variant="secondary" className="capitalize">
                                  {getCategoryLabel(activity.actionCategory)}
                                </Badge>
                              </div>
                              <p className="text-sm text-muted-foreground mt-1" data-testid={`text-activity-description-${activity.id}`}>
                                {activity.description}
                              </p>
                              <div className="flex items-center gap-2 mt-2 text-xs text-muted-foreground">
                                <Clock className="h-3 w-3" />
                                <span>{formatDate(activity.createdAt)} {t.at} {formatTime(activity.createdAt)}</span>
                              </div>
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  </div>
                ))}
              </div>
            </ScrollArea>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
