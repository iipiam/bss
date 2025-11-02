import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Clock, User, MapPin } from "lucide-react";

const orders = [
  {
    id: "#12847",
    customer: "Walk-in Customer",
    type: "Dine-in",
    table: "Table 5",
    items: ["Margherita Pizza x2", "Caesar Salad x1"],
    total: 145,
    time: "2 min ago",
    status: "Pending",
  },
  {
    id: "#12846",
    customer: "Ahmed Al-Rashid",
    type: "Delivery",
    address: "King Fahd Road, Apt 204",
    items: ["Chicken Shawarma x2"],
    total: 89,
    time: "5 min ago",
    status: "Preparing",
  },
  {
    id: "#12845",
    customer: "Sara Mohammed",
    type: "Delivery",
    address: "Al Malaz District",
    items: ["Beef Burger x2", "Fries x2", "Coca Cola x2"],
    total: 234,
    time: "8 min ago",
    status: "Ready",
  },
  {
    id: "#12844",
    customer: "Walk-in Customer",
    type: "Takeaway",
    table: null,
    items: ["Greek Salad x1"],
    total: 45,
    time: "12 min ago",
    status: "Completed",
  },
  {
    id: "#12843",
    customer: "Khalid Hassan",
    type: "Delivery",
    address: "Olaya Street, Tower B",
    items: ["Pepperoni Pizza x1", "Fresh Juice x3"],
    total: 206,
    time: "15 min ago",
    status: "Out for Delivery",
  },
];

const statusConfig = {
  "Pending": { variant: "secondary" as const, color: "text-orange-600" },
  "Preparing": { variant: "default" as const, color: "text-blue-600" },
  "Ready": { variant: "default" as const, color: "text-green-600" },
  "Completed": { variant: "secondary" as const, color: "text-muted-foreground" },
  "Out for Delivery": { variant: "default" as const, color: "text-purple-600" },
};

export default function Orders() {
  return (
    <div className="p-8 space-y-6">
      <div>
        <h1 className="text-3xl font-bold mb-2">Orders Tracking</h1>
        <p className="text-muted-foreground">Monitor and manage all orders in real-time</p>
      </div>

      <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-4">
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">Pending</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-3xl font-bold font-mono">5</p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">Preparing</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-3xl font-bold font-mono">8</p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">Ready</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-3xl font-bold font-mono">3</p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">Completed Today</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-3xl font-bold font-mono">47</p>
          </CardContent>
        </Card>
      </div>

      <div className="grid gap-4">
        {orders.map((order) => (
          <Card key={order.id} data-testid={`card-order-${order.id}`}>
            <CardHeader>
              <div className="flex items-start justify-between">
                <div className="flex items-center gap-4">
                  <div>
                    <CardTitle className="text-xl font-mono mb-2">{order.id}</CardTitle>
                    <div className="flex items-center gap-4 text-sm text-muted-foreground">
                      <div className="flex items-center gap-1">
                        <User className="h-4 w-4" />
                        <span>{order.customer}</span>
                      </div>
                      <div className="flex items-center gap-1">
                        <Clock className="h-4 w-4" />
                        <span>{order.time}</span>
                      </div>
                    </div>
                  </div>
                </div>
                <div className="flex items-center gap-3">
                  <Badge variant={statusConfig[order.status as keyof typeof statusConfig]?.variant || "secondary"}>
                    {order.status}
                  </Badge>
                  <Badge variant="outline">{order.type}</Badge>
                </div>
              </div>
            </CardHeader>
            <CardContent>
              <div className="grid md:grid-cols-3 gap-6">
                <div>
                  <p className="text-sm text-muted-foreground mb-2">Order Items</p>
                  <ul className="space-y-1">
                    {order.items.map((item, idx) => (
                      <li key={idx} className="text-sm">{item}</li>
                    ))}
                  </ul>
                </div>
                <div>
                  {order.table ? (
                    <>
                      <p className="text-sm text-muted-foreground mb-2">Table</p>
                      <p className="font-semibold">{order.table}</p>
                    </>
                  ) : order.address ? (
                    <>
                      <p className="text-sm text-muted-foreground mb-2">Delivery Address</p>
                      <div className="flex items-start gap-1">
                        <MapPin className="h-4 w-4 mt-0.5 text-muted-foreground" />
                        <p className="text-sm">{order.address}</p>
                      </div>
                    </>
                  ) : (
                    <>
                      <p className="text-sm text-muted-foreground mb-2">Pickup</p>
                      <p className="text-sm">Customer pickup</p>
                    </>
                  )}
                </div>
                <div className="flex items-center justify-between md:justify-end gap-4">
                  <div>
                    <p className="text-sm text-muted-foreground mb-1">Total</p>
                    <p className="text-2xl font-bold font-mono text-primary">{order.total} SAR</p>
                  </div>
                  <Button
                    variant={order.status === "Completed" ? "outline" : "default"}
                    data-testid={`button-update-status-${order.id}`}
                  >
                    {order.status === "Pending" ? "Start Preparing" :
                     order.status === "Preparing" ? "Mark Ready" :
                     order.status === "Ready" ? "Complete" :
                     "View Details"}
                  </Button>
                </div>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>
    </div>
  );
}
