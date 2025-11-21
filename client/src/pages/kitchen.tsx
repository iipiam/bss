import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Clock, AlertCircle } from "lucide-react";
import { useQuery, useMutation } from "@tanstack/react-query";
import { apiRequest, queryClient } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";
import type { Order } from "@shared/schema";
import { useDeviceLayout } from "@/lib/mobileLayout";
import { useBusinessType } from "@/hooks/useBusinessType";
import { useAuth } from "@/lib/auth";
import { useEffect } from "react";
import { useLanguage } from "@/contexts/LanguageContext";

function KitchenOrderCard({ 
  order, 
  status, 
  onStatusChange,
  isPending 
}: { 
  order: Order; 
  status: string; 
  onStatusChange: (id: string, newStatus: string) => void;
  isPending: boolean;
}) {
  const layout = useDeviceLayout();
  const { t } = useLanguage();
  
  const getTimeAgo = (date: Date | string) => {
    const dateObj = typeof date === 'string' ? new Date(date) : date;
    const minutes = Math.floor((Date.now() - dateObj.getTime()) / 60000);
    if (minutes < 1) return t.justNow;
    if (minutes < 60) return `${minutes} ${t.minAgo}`;
    const hours = Math.floor(minutes / 60);
    return `${hours} ${hours > 1 ? t.hoursAgo : t.hourAgo}`;
  };
  
  const isUrgent = (date: Date | string) => {
    const dateObj = typeof date === 'string' ? new Date(date) : date;
    const minutes = Math.floor((Date.now() - dateObj.getTime()) / 60000);
    return minutes > 10;
  };

  const urgent = isUrgent(order.createdAt);

  return (
    <Card className={urgent ? "border-orange-500 border-2" : ""} data-testid={`kitchen-card-${order.id}`}>
      <CardHeader className="pb-3">
        <div className="flex items-center justify-between">
          <CardTitle className="text-xl font-mono">#{order.orderNumber}</CardTitle>
          {urgent && (
            <Badge variant="destructive" className="flex items-center gap-1">
              <AlertCircle className="h-3 w-3" />
              {t.urgent}
            </Badge>
          )}
        </div>
        <div className="flex items-center justify-between text-sm">
          <span className="font-semibold">{order.table || order.orderType || t.orderType}</span>
          <div className="flex items-center gap-1 text-muted-foreground">
            <Clock className="h-3 w-3" />
            <span>{getTimeAgo(order.createdAt)}</span>
          </div>
        </div>
      </CardHeader>
      <CardContent className="space-y-3">
        {order.items.map((item, idx) => (
          <div key={idx} className="p-3 rounded-md bg-secondary/50">
            <div className="flex items-center justify-between mb-1">
              <span className="font-semibold">{item.name}</span>
              <Badge variant="outline" className="font-mono">
                x{item.quantity}
              </Badge>
            </div>
          </div>
        ))}
        {(order as any).notes && (
          <div className="p-3 rounded-md bg-orange-100 dark:bg-orange-950 border border-orange-200 dark:border-orange-900">
            <p className="text-sm font-semibold mb-1 text-orange-900 dark:text-orange-100">{t.orderNotes}</p>
            <p className="text-sm text-orange-800 dark:text-orange-200">{(order as any).notes}</p>
          </div>
        )}
        <Button
          className={`w-full mt-2 ${layout.isMobile ? 'h-[44px]' : ''}`}
          variant={status === "ready" ? "outline" : "default"}
          data-testid={`button-kitchen-action-${order.id}`}
          onClick={() => {
            if (status === "pending") {
              onStatusChange(order.id, "Preparing");
            } else if (status === "inProgress") {
              onStatusChange(order.id, "Ready");
            } else if (status === "ready") {
              onStatusChange(order.id, order.orderType === "Delivery" ? "Out for Delivery" : "Completed");
            }
          }}
          disabled={isPending}
        >
          {status === "pending" ? t.startCooking :
           status === "inProgress" ? t.markAsReady :
           order.orderType === "Delivery" ? t.outForDelivery : t.serveComplete}
        </Button>
      </CardContent>
    </Card>
  );
}

export default function Kitchen() {
  const { toast } = useToast();
  const layout = useDeviceLayout();
  const { labels } = useBusinessType();
  const { accountType } = useAuth();
  const { t } = useLanguage();
  
  // Use IT-specific endpoint for IT accounts, regular endpoint for client accounts
  const ordersEndpoint = accountType === 'it' ? '/api/it/orders' : '/api/orders';
  
  const { data: orders = [], isLoading, isError, error, refetch } = useQuery<Order[]>({
    queryKey: [ordersEndpoint],
  });

  // Show toast on error
  useEffect(() => {
    if (isError && error) {
      toast({
        title: t.errorLoadingOrders,
        description: error instanceof Error ? error.message : t.errorLoadingOrders,
        variant: "destructive",
      });
    }
  }, [isError, error, toast, t]);

  const updateStatusMutation = useMutation({
    mutationFn: async ({ id, status }: { id: string; status: string }) => {
      // Use IT-specific endpoint for IT accounts
      const endpoint = accountType === 'it' ? `/api/it/orders/${id}` : `/api/orders/${id}`;
      await apiRequest("PATCH", endpoint, { status });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: [ordersEndpoint] });
      queryClient.invalidateQueries({ queryKey: ["/api/analytics/dashboard"] });
      toast({
        title: t.orderUpdated,
        description: t.theOrderStatusChanged,
      });
    },
    onError: (error: any) => {
      toast({
        title: t.error,
        description: error.message || t.failedToUpdateOrderStatus,
        variant: "destructive",
      });
    },
  });

  const handleStatusChange = (id: string, newStatus: string) => {
    updateStatusMutation.mutate({ id, status: newStatus });
  };

  const pendingOrders = orders.filter(o => o.status === "Pending");
  const inProgressOrders = orders.filter(o => o.status === "Preparing");
  const readyOrders = orders.filter(o => o.status === "Ready");

  if (isLoading) {
    return (
      <div className={layout.padding}>
        <h1 className={`${layout.text3Xl} font-bold mb-2`}>{labels.kitchen}{t.displaySuffix}</h1>
        <p className="text-muted-foreground">{t.loadingOrders}</p>
      </div>
    );
  }

  if (isError) {
    return (
      <div className={layout.padding}>
        <h1 className={`${layout.text3Xl} font-bold mb-2`}>{labels.kitchen}{t.displaySuffix}</h1>
        <Card>
          <CardContent className="py-8 text-center">
            <p className="text-destructive mb-4">
              {error instanceof Error ? error.message : t.errorLoadingOrders}
            </p>
            <Button onClick={() => refetch()}>
              {t.retry}
            </Button>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className={`${layout.padding} ${layout.spaceY}`}>
      <div>
        <h1 className={`${layout.text3Xl} font-bold mb-2`}>{labels.kitchen}{t.displaySuffix}</h1>
        <p className="text-muted-foreground">{t.realTimeTracking}</p>
      </div>

      <div className={`grid ${layout.gap} ${layout.gridCols({ desktop: 3, tablet: 2, mobile: 1 })}`}>
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <h2 className="text-xl font-semibold">{t.pending}</h2>
            <Badge variant="secondary">{pendingOrders.length}</Badge>
          </div>
          {pendingOrders.length === 0 ? (
            <Card>
              <CardContent className="py-8 text-center text-muted-foreground">
                {t.noPendingOrders}
              </CardContent>
            </Card>
          ) : (
            pendingOrders.map((order) => (
              <KitchenOrderCard 
                key={order.id} 
                order={order} 
                status="pending"
                onStatusChange={handleStatusChange}
                isPending={updateStatusMutation.isPending}
              />
            ))
          )}
        </div>

        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <h2 className="text-xl font-semibold">{t.inProgressOrders}</h2>
            <Badge variant="default">{inProgressOrders.length}</Badge>
          </div>
          {inProgressOrders.length === 0 ? (
            <Card>
              <CardContent className="py-8 text-center text-muted-foreground">
                {t.noOrdersInProgress}
              </CardContent>
            </Card>
          ) : (
            inProgressOrders.map((order) => (
              <KitchenOrderCard 
                key={order.id} 
                order={order} 
                status="inProgress"
                onStatusChange={handleStatusChange}
                isPending={updateStatusMutation.isPending}
              />
            ))
          )}
        </div>

        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <h2 className="text-xl font-semibold">{t.ready}</h2>
            <Badge variant="default" className="bg-green-600">{readyOrders.length}</Badge>
          </div>
          {readyOrders.length === 0 ? (
            <Card>
              <CardContent className="py-8 text-center text-muted-foreground">
                {t.noOrdersReady}
              </CardContent>
            </Card>
          ) : (
            readyOrders.map((order) => (
              <KitchenOrderCard 
                key={order.id} 
                order={order} 
                status="ready"
                onStatusChange={handleStatusChange}
                isPending={updateStatusMutation.isPending}
              />
            ))
          )}
        </div>
      </div>
    </div>
  );
}
