import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Calendar, Download, Search } from "lucide-react";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

const transactions = [
  { id: "#12847", date: "2024-11-02 14:23", items: 3, subtotal: 125, tax: 20, total: 145, payment: "Cash", branch: "Main Branch" },
  { id: "#12846", date: "2024-11-02 14:15", items: 2, subtotal: 75, tax: 14, total: 89, payment: "Card", branch: "Main Branch" },
  { id: "#12845", date: "2024-11-02 13:58", items: 5, subtotal: 205, tax: 29, total: 234, payment: "Card", branch: "Main Branch" },
  { id: "#12844", date: "2024-11-02 13:45", items: 1, subtotal: 40, tax: 5, total: 45, payment: "Cash", branch: "Main Branch" },
  { id: "#12843", date: "2024-11-02 13:30", items: 4, subtotal: 180, tax: 26, total: 206, payment: "Card", branch: "Al Khobar" },
  { id: "#12842", date: "2024-11-02 13:12", items: 2, subtotal: 90, tax: 13, total: 103, payment: "Cash", branch: "Main Branch" },
  { id: "#12841", date: "2024-11-02 12:55", items: 3, subtotal: 140, tax: 20, total: 160, payment: "Card", branch: "Jeddah" },
  { id: "#12840", date: "2024-11-02 12:40", items: 1, subtotal: 50, tax: 7, total: 57, payment: "Cash", branch: "Main Branch" },
];

export default function Sales() {
  return (
    <div className="p-8 space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold mb-2">Sales Tracking</h1>
          <p className="text-muted-foreground">View transaction history and summaries</p>
        </div>
        <Button data-testid="button-export-sales">
          <Download className="h-4 w-4 mr-2" />
          Export Data
        </Button>
      </div>

      <div className="grid gap-6 md:grid-cols-3">
        <Card>
          <CardHeader>
            <CardTitle className="text-sm font-medium text-muted-foreground">Today's Sales</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-3xl font-bold font-mono">6,850 SAR</p>
            <p className="text-sm text-green-600 mt-2">+12.5% from yesterday</p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader>
            <CardTitle className="text-sm font-medium text-muted-foreground">Transactions</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-3xl font-bold font-mono">47</p>
            <p className="text-sm text-green-600 mt-2">+8 from yesterday</p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader>
            <CardTitle className="text-sm font-medium text-muted-foreground">Avg. Order Value</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-3xl font-bold font-mono">146 SAR</p>
            <p className="text-sm text-muted-foreground mt-2">Per transaction</p>
          </CardContent>
        </Card>
      </div>

      <Card className="p-6">
        <div className="flex gap-4 mb-6 flex-wrap">
          <div className="relative flex-1 min-w-64">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <Input
              placeholder="Search by transaction ID..."
              className="pl-10"
              data-testid="input-search-transaction"
            />
          </div>
          <Button variant="outline" data-testid="button-date-filter">
            <Calendar className="h-4 w-4 mr-2" />
            Select Date Range
          </Button>
          <Select defaultValue="all">
            <SelectTrigger className="w-48" data-testid="select-payment-method">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Payments</SelectItem>
              <SelectItem value="cash">Cash</SelectItem>
              <SelectItem value="card">Card</SelectItem>
            </SelectContent>
          </Select>
        </div>

        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Transaction ID</TableHead>
              <TableHead>Date & Time</TableHead>
              <TableHead>Items</TableHead>
              <TableHead>Subtotal</TableHead>
              <TableHead>Tax (15%)</TableHead>
              <TableHead>Total</TableHead>
              <TableHead>Payment</TableHead>
              <TableHead>Branch</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {transactions.map((transaction) => (
              <TableRow key={transaction.id} className="hover-elevate" data-testid={`row-transaction-${transaction.id}`}>
                <TableCell className="font-mono font-semibold">{transaction.id}</TableCell>
                <TableCell className="text-muted-foreground">{transaction.date}</TableCell>
                <TableCell>{transaction.items}</TableCell>
                <TableCell className="font-mono">{transaction.subtotal} SAR</TableCell>
                <TableCell className="font-mono">{transaction.tax} SAR</TableCell>
                <TableCell className="font-mono font-semibold">{transaction.total} SAR</TableCell>
                <TableCell>
                  <Badge variant={transaction.payment === "Card" ? "default" : "secondary"}>
                    {transaction.payment}
                  </Badge>
                </TableCell>
                <TableCell className="text-muted-foreground">{transaction.branch}</TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </Card>
    </div>
  );
}
