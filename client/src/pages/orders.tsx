import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Clock, User, MapPin } from "lucide-react";
import { useQuery, useMutation } from "@tanstack/react-query";
import { apiRequest, queryClient } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";
import type { Order } from "@shared/schema";
import { useDeviceLayout } from "@/lib/mobileLayout";
import { useLanguage } from "@/contexts/LanguageContext";

const statusConfig: Record<string, { variant: "default" | "secondary" | "destructive" | "outline"; color: string }> = {
  "Pending": { variant: "secondary", color: "text-orange-600" },
  "Preparing": { variant: "default", color: "text-blue-600" },
  "Ready": { variant: "default", color: "text-green-600" },
  "Completed": { variant: "secondary", color: "text-muted-foreground" },
  "Delivered": { variant: "secondary", color: "text-muted-foreground" },
  "Out for Delivery": { variant: "default", color: "text-purple-600" },
};

export default function Orders() {
  const { toast } = useToast();
  const layout = useDeviceLayout();
  const { t } = useLanguage();
  
  const getStatusLabel = (status: string) => {
    switch (status) {
      case "Pending": return t.pending;
      case "Preparing": return t.preparing;
      case "Ready": return t.ready;
      case "Completed": return t.completed;
      case "Delivered": return t.delivered;
      case "Out for Delivery": return t.outForDelivery;
      default: return status;
    }
  };
  
  const { data: orders = [], isLoading } = useQuery<Order[]>({
    queryKey: ["/api/orders"],
  });

  const updateStatusMutation = useMutation({
    mutationFn: async ({ id, status }: { id: string; status: string }) => {
      await apiRequest("PATCH", `/api/orders/${id}`, { status });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/orders"] });
      queryClient.invalidateQueries({ queryKey: ["/api/analytics/dashboard"] });
      toast({
        title: t.orderStatusUpdated,
        description: t.theOrderStatusChanged,
      });
    },
  });

  const statusCounts = {
    pending: orders.filter(o => o.status === "Pending").length,
    preparing: orders.filter(o => o.status === "Preparing").length,
    ready: orders.filter(o => o.status === "Ready").length,
    completed: orders.filter(o => o.status === "Completed" || o.status === "Delivered").length,
  };

  if (isLoading) {
    return (
      <div className={layout.padding}>
        <h1 className={`${layout.text3Xl} font-bold mb-2`}>{t.ordersTracking}</h1>
        <p className="text-muted-foreground">{t.loading}</p>
      </div>
    );
  }

  return (
    <div className={`${layout.padding} ${layout.spaceY}`}>
      <div>
        <h1 className={`${layout.text3Xl} font-bold mb-2`}>{t.ordersTracking}</h1>
        <p className="text-muted-foreground">{t.monitorOrdersRealtime}</p>
      </div>

      <div className={`grid ${layout.gap} ${layout.gridCols({ desktop: 4, tablet: 2, mobile: 1 })}`}>
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">{t.pending}</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-3xl font-bold font-mono">{statusCounts.pending}</p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">{t.preparing}</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-3xl font-bold font-mono">{statusCounts.preparing}</p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">{t.ready}</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-3xl font-bold font-mono">{statusCounts.ready}</p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">{t.completedToday}</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-3xl font-bold font-mono">{statusCounts.completed}</p>
          </CardContent>
        </Card>
      </div>

      <div className="grid gap-6">
        {orders.map((order) => (
          <Card key={order.id} data-testid={`card-order-${order.id}`}>
            <CardHeader>
              <div className="flex items-start justify-between">
                <div>
                  <div className="flex items-center gap-3 mb-2">
                    <h3 className="text-2xl font-bold font-mono">#{order.orderNumber}</h3>
                    <Badge variant={statusConfig[order.status]?.variant || "secondary"}>
                      {getStatusLabel(order.status)}
                    </Badge>
                  </div>
                  <div className="flex gap-4 text-sm text-muted-foreground">
                    <span className="flex items-center gap-1">
                      <Clock className="h-4 w-4" />
                      {new Date(order.createdAt).toLocaleString()}
                    </span>
                    {order.customerName && (
                      <span className="flex items-center gap-1">
                        <User className="h-4 w-4" />
                        {order.customerName}
                      </span>
                    )}
                    {order.orderType && (
                      <Badge variant="outline">{order.orderType}</Badge>
                    )}
                  </div>
                </div>
                <div className="text-right">
                  <p className="text-3xl font-bold font-mono">{parseFloat(order.total).toFixed(2)} {t.sar}</p>
                  <p className="text-sm text-muted-foreground">{order.items.length} {t.items}</p>
                </div>
              </div>
            </CardHeader>
            <CardContent>
              <div className="mb-4">
                {order.table && (
                  <p className="text-sm text-muted-foreground mb-1">{t.table}: {order.table}</p>
                )}
                {order.address && (
                  <p className="text-sm text-muted-foreground flex items-center gap-1">
                    <MapPin className="h-4 w-4" />
                    {order.address}
                  </p>
                )}
              </div>
              <div className="mb-4 space-y-1">
                {order.items.map((item, idx) => (
                  <div key={idx} className="text-sm flex justify-between">
                    <span>{item.name} x{item.quantity}</span>
                    <span className="font-mono">{(item.price * item.quantity).toFixed(2)} {t.sar}</span>
                  </div>
                ))}
              </div>
              <div className={`flex ${layout.isMobile ? 'flex-col' : 'gap-2'} ${layout.isMobile ? 'space-y-2' : ''}`}>
                {order.status === "Pending" && (
                  <Button
                    variant="default"
                    className={layout.isMobile ? 'w-full h-[44px]' : ''}
                    onClick={() => updateStatusMutation.mutate({ id: order.id, status: "Preparing" })}
                    data-testid={`button-start-${order.id}`}
                  >
                    {t.startPreparing}
                  </Button>
                )}
                {order.status === "Preparing" && (
                  <Button
                    variant="default"
                    className={layout.isMobile ? 'w-full h-[44px]' : ''}
                    onClick={() => updateStatusMutation.mutate({ id: order.id, status: "Ready" })}
                    data-testid={`button-ready-${order.id}`}
                  >
                    {t.markAsReady}
                  </Button>
                )}
                {order.status === "Ready" && (
                  <Button
                    variant="default"
                    className={layout.isMobile ? 'w-full h-[44px]' : ''}
                    onClick={() => updateStatusMutation.mutate({ id: order.id, status: order.orderType === "Delivery" ? "Out for Delivery" : "Completed" })}
                    data-testid={`button-complete-${order.id}`}
                  >
                    {order.orderType === "Delivery" ? t.outForDelivery : t.completeOrder}
                  </Button>
                )}
                {order.status === "Out for Delivery" && (
                  <Button
                    variant="default"
                    className={layout.isMobile ? 'w-full h-[44px]' : ''}
                    onClick={() => updateStatusMutation.mutate({ id: order.id, status: "Delivered" })}
                    data-testid={`button-delivered-${order.id}`}
                  >
                    {t.markAsDelivered}
                  </Button>
                )}
              </div>
            </CardContent>
          </Card>
        ))}
      </div>
    </div>
  );
}
