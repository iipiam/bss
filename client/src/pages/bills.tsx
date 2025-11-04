import { useState } from "react";
import { useQuery, useMutation } from "@tanstack/react-query";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { useToast } from "@/hooks/use-toast";
import { queryClient, apiRequest } from "@/lib/queryClient";
import { useLanguage } from "@/contexts/LanguageContext";
import { Search, Archive, ArchiveRestore, Download, Filter, Calendar } from "lucide-react";
import type { ShopBill } from "@shared/schema";
import { format } from "date-fns";
import * as XLSX from "xlsx";

export default function Bills() {
  const { t } = useLanguage();
  const { toast } = useToast();
  const [searchTerm, setSearchTerm] = useState("");
  const [billTypeFilter, setBillTypeFilter] = useState<string>("all");
  const [statusFilter, setStatusFilter] = useState<string>("all");
  const [showArchived, setShowArchived] = useState(false);
  const [startDate, setStartDate] = useState("");
  const [endDate, setEndDate] = useState("");

  const { data: bills = [], isLoading } = useQuery<ShopBill[]>({
    queryKey: ["/api/shop/bills"],
  });

  const archiveMutation = useMutation({
    mutationFn: async ({ id, archived }: { id: string; archived: boolean }) => {
      return await apiRequest(`/api/shop/bills/${id}/archive`, "PATCH", { archived });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/shop/bills"] });
      toast({
        title: t.success,
        description: t.billUpdated || "Bill updated successfully",
      });
    },
    onError: () => {
      toast({
        title: t.error,
        description: t.somethingWentWrong || "Something went wrong",
        variant: "destructive",
      });
    },
  });

  const filteredBills = bills.filter((bill) => {
    const matchesSearch = bill.billType.toLowerCase().includes(searchTerm.toLowerCase()) ||
      (bill.description?.toLowerCase() ?? '').includes(searchTerm.toLowerCase());
    const matchesType = billTypeFilter === "all" || bill.billType === billTypeFilter;
    const matchesStatus = statusFilter === "all" || bill.status === statusFilter;
    const matchesArchived = showArchived ? true : !bill.archived;
    const matchesDateRange = (!startDate || new Date(bill.paymentDate) >= new Date(startDate)) &&
      (!endDate || new Date(bill.paymentDate) <= new Date(endDate));

    return matchesSearch && matchesType && matchesStatus && matchesArchived && matchesDateRange;
  });

  const totalAmount = filteredBills.reduce((sum, bill) => sum + parseFloat(bill.amount || "0"), 0);
  const paidAmount = filteredBills.filter(b => b.status === "paid").reduce((sum, bill) => sum + parseFloat(bill.amount || "0"), 0);
  const pendingAmount = filteredBills.filter(b => b.status === "pending").reduce((sum, bill) => sum + parseFloat(bill.amount || "0"), 0);

  const handleExportToExcel = () => {
    const exportData = filteredBills.map((bill) => ({
      [t.billType || "Bill Type"]: (t as any)[bill.billType] || bill.billType,
      [t.amount || "Amount"]: `${parseFloat(bill.amount).toFixed(2)} ${t.sar || "SAR"}`,
      [t.paymentDate || "Payment Date"]: format(new Date(bill.paymentDate), "dd/MM/yyyy"),
      [t.paymentPeriod || "Payment Period"]: (t as any)[bill.paymentPeriod] || bill.paymentPeriod,
      [t.status || "Status"]: (t as any)[bill.status] || bill.status,
      [t.description || "Description"]: bill.description || "-",
      [t.archived || "Archived"]: bill.archived ? t.yes || "Yes" : t.no || "No",
    }));

    const ws = XLSX.utils.json_to_sheet(exportData);
    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, "Bills");
    XLSX.writeFile(wb, `bills_${format(new Date(), "yyyyMMdd_HHmmss")}.xlsx`);

    toast({
      title: t.success,
      description: t.exportedSuccessfully || "Exported successfully",
    });
  };

  const billTypes = ["all", "rent", "electricity", "water", "gas", "internet", "maintenance", "foundational", "other"];
  const statuses = ["all", "pending", "paid", "overdue"];

  return (
    <div className="container mx-auto p-6 space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold">{t.bills || "Bills"}</h1>
          <p className="text-muted-foreground mt-1">
            {t.manageBills || "Manage and analyze your shop bills"}
          </p>
        </div>
        <Button onClick={handleExportToExcel} data-testid="button-export-excel">
          <Download className="w-4 h-4 mr-2" />
          {t.exportToExcel || "Export to Excel"}
        </Button>
      </div>

      <div className="grid gap-4 md:grid-cols-3">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">{t.totalBills || "Total Bills"}</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{totalAmount.toFixed(2)} {t.sar || "SAR"}</div>
            <p className="text-xs text-muted-foreground mt-1">
              {filteredBills.length} {t.bills || "bills"}
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">{t.paid || "Paid"}</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-green-600">{paidAmount.toFixed(2)} {t.sar || "SAR"}</div>
            <p className="text-xs text-muted-foreground mt-1">
              {filteredBills.filter(b => b.status === "paid").length} {t.bills || "bills"}
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">{t.pending || "Pending"}</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-yellow-600">{pendingAmount.toFixed(2)} {t.sar || "SAR"}</div>
            <p className="text-xs text-muted-foreground mt-1">
              {filteredBills.filter(b => b.status === "pending").length} {t.bills || "bills"}
            </p>
          </CardContent>
        </Card>
      </div>

      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Filter className="w-5 h-5" />
            {t.filters || "Filters"}
          </CardTitle>
          <CardDescription>{t.filterBills || "Filter bills by various criteria"}</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-5">
            <div className="relative">
              <Search className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
              <Input
                placeholder={t.search || "Search"}
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="pl-9"
                data-testid="input-search-bills"
              />
            </div>

            <Select value={billTypeFilter} onValueChange={setBillTypeFilter}>
              <SelectTrigger data-testid="select-bill-type-filter">
                <SelectValue placeholder={t.billType || "Bill Type"} />
              </SelectTrigger>
              <SelectContent>
                {billTypes.map((type) => (
                  <SelectItem key={type} value={type}>
                    {type === "all" ? t.all || "All" : (t as any)[type] || type}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>

            <Select value={statusFilter} onValueChange={setStatusFilter}>
              <SelectTrigger data-testid="select-status-filter">
                <SelectValue placeholder={t.status || "Status"} />
              </SelectTrigger>
              <SelectContent>
                {statuses.map((status) => (
                  <SelectItem key={status} value={status}>
                    {status === "all" ? t.all || "All" : (t as any)[status] || status}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>

            <div className="flex items-center gap-2">
              <Calendar className="h-4 w-4 text-muted-foreground" />
              <Input
                type="date"
                value={startDate}
                onChange={(e) => setStartDate(e.target.value)}
                placeholder={t.startDate || "Start Date"}
                data-testid="input-start-date"
              />
            </div>

            <div className="flex items-center gap-2">
              <Calendar className="h-4 w-4 text-muted-foreground" />
              <Input
                type="date"
                value={endDate}
                onChange={(e) => setEndDate(e.target.value)}
                placeholder={t.endDate || "End Date"}
                data-testid="input-end-date"
              />
            </div>
          </div>

          <div className="flex items-center gap-2">
            <Button
              variant={showArchived ? "default" : "outline"}
              onClick={() => setShowArchived(!showArchived)}
              data-testid="button-toggle-archived"
            >
              <Archive className="w-4 h-4 mr-2" />
              {showArchived ? t.hideArchived || "Hide Archived" : t.showArchived || "Show Archived"}
            </Button>
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>{t.billsList || "Bills List"}</CardTitle>
          <CardDescription>
            {filteredBills.length} {t.billsFound || "bills found"}
          </CardDescription>
        </CardHeader>
        <CardContent>
          {isLoading ? (
            <div className="text-center py-8">{t.loading || "Loading..."}</div>
          ) : filteredBills.length === 0 ? (
            <div className="text-center py-8 text-muted-foreground">
              {t.noBillsFound || "No bills found"}
            </div>
          ) : (
            <div className="overflow-x-auto">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>{t.billType || "Bill Type"}</TableHead>
                    <TableHead>{t.amount || "Amount"}</TableHead>
                    <TableHead>{t.paymentDate || "Payment Date"}</TableHead>
                    <TableHead>{t.paymentPeriod || "Payment Period"}</TableHead>
                    <TableHead>{t.status || "Status"}</TableHead>
                    <TableHead>{t.description || "Description"}</TableHead>
                    <TableHead className="text-right">{t.actions || "Actions"}</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {filteredBills.map((bill) => (
                    <TableRow key={bill.id} data-testid={`row-bill-${bill.id}`}>
                      <TableCell className="font-medium">
                        {(t as any)[bill.billType] || bill.billType}
                      </TableCell>
                      <TableCell className="font-semibold">
                        {parseFloat(bill.amount).toFixed(2)} {t.sar || "SAR"}
                      </TableCell>
                      <TableCell>{format(new Date(bill.paymentDate), "dd/MM/yyyy")}</TableCell>
                      <TableCell>{(t as any)[bill.paymentPeriod] || bill.paymentPeriod}</TableCell>
                      <TableCell>
                        <Badge
                          variant={
                            bill.status === "paid"
                              ? "default"
                              : bill.status === "overdue"
                              ? "destructive"
                              : "secondary"
                          }
                        >
                          {(t as any)[bill.status] || bill.status}
                        </Badge>
                      </TableCell>
                      <TableCell className="max-w-xs truncate">
                        {bill.description || "-"}
                      </TableCell>
                      <TableCell className="text-right">
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() =>
                            archiveMutation.mutate({
                              id: bill.id,
                              archived: !bill.archived,
                            })
                          }
                          disabled={archiveMutation.isPending}
                          data-testid={`button-archive-${bill.id}`}
                        >
                          {bill.archived ? (
                            <>
                              <ArchiveRestore className="w-4 h-4 mr-2" />
                              {t.unarchive || "Unarchive"}
                            </>
                          ) : (
                            <>
                              <Archive className="w-4 h-4 mr-2" />
                              {t.archive || "Archive"}
                            </>
                          )}
                        </Button>
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
