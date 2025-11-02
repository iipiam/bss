import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Clock, AlertCircle } from "lucide-react";

const orders = {
  pending: [
    {
      id: "#12847",
      table: "Table 5",
      items: [
        { name: "Margherita Pizza", quantity: 2, notes: "Extra cheese" },
        { name: "Caesar Salad", quantity: 1, notes: "" },
      ],
      time: "2 min ago",
      priority: "normal",
    },
    {
      id: "#12848",
      table: "Delivery",
      items: [
        { name: "Beef Burger", quantity: 3, notes: "No onions on 1" },
        { name: "Fries", quantity: 3, notes: "Extra crispy" },
      ],
      time: "Just now",
      priority: "urgent",
    },
  ],
  inProgress: [
    {
      id: "#12846",
      table: "Table 12",
      items: [
        { name: "Chicken Shawarma", quantity: 2, notes: "" },
        { name: "Fresh Juice", quantity: 2, notes: "Orange" },
      ],
      time: "5 min ago",
      priority: "normal",
    },
    {
      id: "#12843",
      table: "Delivery",
      items: [
        { name: "Pepperoni Pizza", quantity: 1, notes: "" },
        { name: "Greek Salad", quantity: 1, notes: "Dressing on side" },
      ],
      time: "8 min ago",
      priority: "normal",
    },
  ],
  ready: [
    {
      id: "#12845",
      table: "Table 8",
      items: [
        { name: "Grilled Salmon", quantity: 1, notes: "" },
        { name: "Steamed Vegetables", quantity: 1, notes: "" },
      ],
      time: "12 min ago",
      priority: "normal",
    },
  ],
};

function KitchenOrderCard({ order, status }: { order: typeof orders.pending[0]; status: string }) {
  return (
    <Card className={order.priority === "urgent" ? "border-orange-500 border-2" : ""} data-testid={`kitchen-card-${order.id}`}>
      <CardHeader className="pb-3">
        <div className="flex items-center justify-between">
          <CardTitle className="text-xl font-mono">{order.id}</CardTitle>
          {order.priority === "urgent" && (
            <Badge variant="destructive" className="flex items-center gap-1">
              <AlertCircle className="h-3 w-3" />
              Urgent
            </Badge>
          )}
        </div>
        <div className="flex items-center justify-between text-sm">
          <span className="font-semibold">{order.table}</span>
          <div className="flex items-center gap-1 text-muted-foreground">
            <Clock className="h-3 w-3" />
            <span>{order.time}</span>
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
            {item.notes && (
              <p className="text-sm text-muted-foreground italic">Note: {item.notes}</p>
            )}
          </div>
        ))}
        <Button
          className="w-full mt-2"
          variant={status === "ready" ? "outline" : "default"}
          data-testid={`button-kitchen-action-${order.id}`}
        >
          {status === "pending" ? "Start Cooking" :
           status === "inProgress" ? "Mark as Ready" :
           "Serve / Complete"}
        </Button>
      </CardContent>
    </Card>
  );
}

export default function Kitchen() {
  return (
    <div className="p-8 space-y-6">
      <div>
        <h1 className="text-3xl font-bold mb-2">Kitchen Display</h1>
        <p className="text-muted-foreground">Real-time order tracking and preparation guidance</p>
      </div>

      <div className="grid gap-6 md:grid-cols-3">
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <h2 className="text-xl font-semibold">Pending</h2>
            <Badge variant="secondary">{orders.pending.length}</Badge>
          </div>
          {orders.pending.map((order) => (
            <KitchenOrderCard key={order.id} order={order} status="pending" />
          ))}
        </div>

        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <h2 className="text-xl font-semibold">In Progress</h2>
            <Badge variant="default">{orders.inProgress.length}</Badge>
          </div>
          {orders.inProgress.map((order) => (
            <KitchenOrderCard key={order.id} order={order} status="inProgress" />
          ))}
        </div>

        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <h2 className="text-xl font-semibold">Ready</h2>
            <Badge variant="default" className="bg-green-600">{orders.ready.length}</Badge>
          </div>
          {orders.ready.map((order) => (
            <KitchenOrderCard key={order.id} order={order} status="ready" />
          ))}
        </div>
      </div>
    </div>
  );
}
