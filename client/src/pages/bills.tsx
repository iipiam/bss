import { useState } from "react";
import { useQuery, useMutation } from "@tanstack/react-query";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Tooltip, TooltipProvider, TooltipTrigger, TooltipContent } from "@/components/ui/tooltip";
import { InfoTip } from "@/components/ui/info-tip";
import { useToast } from "@/hooks/use-toast";
import { queryClient, apiRequest } from "@/lib/queryClient";
import { useLanguage } from "@/contexts/LanguageContext";
import { Search, Archive, ArchiveRestore, Download, Filter, Calendar, Users } from "lucide-react";
import type { ShopBill } from "@shared/schema";
import { format } from "date-fns";
import * as XLSX from "xlsx";

export default function Bills() {
  const { t, isRTL } = useLanguage();
  const { toast } = useToast();
  const [searchTerm, setSearchTerm] = useState("");
  const [billTypeFilter, setBillTypeFilter] = useState<string>("all");
  const [statusFilter, setStatusFilter] = useState<string>("all");
  const [showArchived, setShowArchived] = useState(false);
  const [startDate, setStartDate] = useState("");
  const [endDate, setEndDate] = useState("");
  const [sortOrder, setSortOrder] = useState<string>("newest");
  const [salaryDialogOpen, setSalaryDialogOpen] = useState(false);
  const [salaryMonth, setSalaryMonth] = useState(() => format(new Date(), "yyyy-MM"));

  const { data: bills = [], isLoading } = useQuery<ShopBill[]>({
    queryKey: ["/api/shop/bills"],
  });

  const archiveMutation = useMutation({
    mutationFn: async ({ id, archived }: { id: string; archived: boolean }) => {
      return await apiRequest("PATCH", `/api/shop/bills/${id}/archive`, { archived });
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

  const generateSalariesMutation = useMutation({
    mutationFn: async (paymentMonth: string): Promise<{ created: number; skipped: number }> => {
      const response = await apiRequest("POST", "/api/shop/bills/generate-salaries", { paymentMonth });
      return (await response.json()) as { created: number; skipped: number };
    },
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: ["/api/shop/bills"] });
      setSalaryDialogOpen(false);
      toast({
        title: t.success,
        description: `${data.created} salary bills created, ${data.skipped} skipped`,
      });
    },
    onError: () => {
      toast({
        title: t.error,
        description: "Failed to generate salary bills",
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
  }).sort((a, b) => {
    const dateA = new Date(a.paymentDate || a.createdAt || 0).getTime();
    const dateB = new Date(b.paymentDate || b.createdAt || 0).getTime();
    switch (sortOrder) {
      case "oldest":
        return dateA - dateB;
      case "paidFirst": {
        const rank = (s: string | null) => (s === "paid" ? 0 : 1);
        return rank(a.status) - rank(b.status) || dateB - dateA;
      }
      case "unpaidFirst": {
        const rank = (s: string | null) => (s === "paid" ? 1 : 0);
        return rank(a.status) - rank(b.status) || dateB - dateA;
      }
      case "newest":
      default:
        return dateB - dateA;
    }
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

  const billTypes = ["all", "rent", "electricity", "water", "gas", "internet", "maintenance", "foundational", "salary", "other"];
  const statuses = ["all", "pending", "paid", "overdue"];

  return (
    <TooltipProvider delayDuration={150}>
    <div className="container mx-auto p-6 space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold">{t.bills || "Bills"}</h1>
          <p className="text-muted-foreground mt-1">
            {t.manageBills || "Manage and analyze your shop bills"}
          </p>
        </div>
        <div className="flex gap-2">
          <Dialog open={salaryDialogOpen} onOpenChange={setSalaryDialogOpen}>
            <DialogTrigger asChild>
              <Button variant="outline" data-testid="button-generate-salaries">
                <Users className="w-4 h-4 mr-2" />
                {t.generateSalaries || "Generate Salaries"}
              </Button>
            </DialogTrigger>
            <DialogContent>
              <DialogHeader>
                <DialogTitle>{t.generateSalaries || "Generate Salary Bills"}</DialogTitle>
                <DialogDescription>
                  {"This will create salary bills for all employees with a monthly salary set for the selected month."}
                </DialogDescription>
              </DialogHeader>
              <div className="py-4">
                <label className="text-sm font-medium mb-2 block">
                  {"Select Month"}
                  <InfoTip>{isRTL ? "ينشئ فواتير الرواتب لجميع الموظفين الذين لديهم راتب شهري للشهر المحدد فقط." : "Generates salary bills only for employees with a monthly salary for the selected month."}</InfoTip>
                </label>
                <Input
                  type="month"
                  value={salaryMonth}
                  onChange={(e) => setSalaryMonth(e.target.value)}
                  data-testid="input-salary-month"
                />
              </div>
              <DialogFooter>
                <Button variant="outline" onClick={() => setSalaryDialogOpen(false)}>
                  {t.cancel || "Cancel"}
                </Button>
                <Button 
                  onClick={() => generateSalariesMutation.mutate(salaryMonth)}
                  disabled={generateSalariesMutation.isPending}
                  data-testid="button-confirm-generate-salaries"
                >
                  {generateSalariesMutation.isPending ? "Generating..." : t.confirm || "Generate"}
                </Button>
              </DialogFooter>
            </DialogContent>
          </Dialog>
          <Button onClick={handleExportToExcel} data-testid="button-export-excel">
            <Download className="w-4 h-4 mr-2" />
            {t.exportToExcel || "Export to Excel"}
          </Button>
        </div>
      </div>

      <div className="grid gap-4 md:grid-cols-3">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium flex items-center">
              {t.totalBills || "Total Bills"}
              <InfoTip>{isRTL ? "إجمالي مبلغ جميع الفواتير المطابقة للفلاتر الحالية." : "Sum of all bills matching the current filters."}</InfoTip>
            </CardTitle>
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
            <CardTitle className="text-sm font-medium flex items-center">
              {t.paid || "Paid"}
              <InfoTip>{isRTL ? "إجمالي الفواتير المدفوعة بالفعل." : "Total amount of bills already paid."}</InfoTip>
            </CardTitle>
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
            <CardTitle className="text-sm font-medium flex items-center">
              {t.pending || "Pending"}
              <InfoTip>{isRTL ? "إجمالي الفواتير غير المدفوعة بعد." : "Total amount of bills not yet paid."}</InfoTip>
            </CardTitle>
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
          <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-6">
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

            <Select value={sortOrder} onValueChange={setSortOrder}>
              <SelectTrigger data-testid="select-sort-order">
                <SelectValue placeholder={isRTL ? "الترتيب" : "Sort"} />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="newest">{isRTL ? "الأحدث أولاً" : "Newest first"}</SelectItem>
                <SelectItem value="oldest">{isRTL ? "الأقدم أولاً" : "Oldest first"}</SelectItem>
                <SelectItem value="paidFirst">{isRTL ? "المدفوعة أولاً" : "Paid first"}</SelectItem>
                <SelectItem value="unpaidFirst">{isRTL ? "غير المدفوعة أولاً" : "Unpaid first"}</SelectItem>
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
    </TooltipProvider>
  );
}
