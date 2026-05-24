import { useState, useMemo } from "react";
import { useQuery, useMutation } from "@tanstack/react-query";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import { useToast } from "@/hooks/use-toast";
import { Download, FileText, Plus, Search, Loader2, Calendar, TrendingUp, TrendingDown, Receipt, Calculator } from "lucide-react";
import { format } from "date-fns";
import { queryClient, apiRequest } from "@/lib/queryClient";
import type { MonthlyVatReport } from "@shared/schema";
import { useLanguage } from "@/contexts/LanguageContext";
import { Tooltip, TooltipProvider, TooltipTrigger, TooltipContent } from "@/components/ui/tooltip";
import { InfoTip } from "@/components/ui/info-tip";

export default function VatReports() {
  const { toast } = useToast();
  const { t, language } = useLanguage();
  const isAr = language === 'Arabic';
  const [searchQuery, setSearchQuery] = useState("");
  const [dialogOpen, setDialogOpen] = useState(false);
  const [selectedMonth, setSelectedMonth] = useState<string>("");
  const [selectedYear, setSelectedYear] = useState<string>("");

  const { data: reports = [], isLoading } = useQuery<MonthlyVatReport[]>({
    queryKey: ["/api/vat-reports"],
  });

  const generateMutation = useMutation({
    mutationFn: async (data: { month: number; year: number }) => {
      return apiRequest("POST", "/api/vat-reports/generate", data);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/vat-reports"] });
      setDialogOpen(false);
      setSelectedMonth("");
      setSelectedYear("");
      toast({
        title: t.vatReportGenerated || "VAT Report Generated",
        description: t.vatReportGeneratedDesc || "Monthly VAT report has been successfully generated",
      });
    },
    onError: (error) => {
      toast({
        title: t.generationFailed,
        description: error instanceof Error ? error.message : "Failed to generate VAT report",
        variant: "destructive",
      });
    },
  });

  const handleGenerate = () => {
    if (!selectedMonth || !selectedYear) {
      toast({
        title: t.invalidInput || "Invalid Input",
        description: t.invalidInputDesc || "Please select both month and year",
        variant: "destructive",
      });
      return;
    }
    generateMutation.mutate({ 
      month: parseInt(selectedMonth), 
      year: parseInt(selectedYear) 
    });
  };

  const handleDownload = async (report: MonthlyVatReport) => {
    try {
      const response = await fetch(`/api/vat-reports/${report.id}/download`);
      if (!response.ok) {
        throw new Error("Failed to download VAT report");
      }

      const blob = await response.blob();
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = `vat-report-${report.serialNumber}.pdf`;
      document.body.appendChild(a);
      a.click();
      window.URL.revokeObjectURL(url);
      document.body.removeChild(a);

      toast({
        title: t.reportDownloaded || "Report Downloaded",
        description: (t as any).vatReportDownloadedDesc || `VAT Report ${report.serialNumber} has been downloaded`,
      });
    } catch (error) {
      toast({
        title: t.downloadFailed,
        description: error instanceof Error ? error.message : "Failed to download VAT report",
        variant: "destructive",
      });
    }
  };

  const filteredReports = reports.filter((report) => {
    const searchLower = searchQuery.toLowerCase();
    return (
      report.serialNumber.toLowerCase().includes(searchLower) ||
      report.reportMonth.toString().includes(searchLower) ||
      report.reportYear.toString().includes(searchLower)
    );
  });

  const months = [
    { value: "1", label: "January" },
    { value: "2", label: "February" },
    { value: "3", label: "March" },
    { value: "4", label: "April" },
    { value: "5", label: "May" },
    { value: "6", label: "June" },
    { value: "7", label: "July" },
    { value: "8", label: "August" },
    { value: "9", label: "September" },
    { value: "10", label: "October" },
    { value: "11", label: "November" },
    { value: "12", label: "December" },
  ];

  const currentYear = new Date().getFullYear();
  const years = Array.from({ length: 10 }, (_, i) => currentYear - i);

  const getMonthName = (month: number) => {
    return months.find(m => parseInt(m.value) === month)?.label || "";
  };

  const summaryStats = useMemo(() => {
    if (reports.length === 0) return null;
    
    const totalSales = reports.reduce((sum, r) => sum + parseFloat(r.totalSales), 0);
    const totalPurchases = reports.reduce((sum, r) => sum + parseFloat(r.totalPurchases), 0);
    const totalVatPayable = reports.reduce((sum, r) => sum + parseFloat(r.netVatPayable), 0);
    const latestReport = reports.reduce((latest, r) => {
      const latestDate = new Date(latest.generatedAt);
      const currentDate = new Date(r.generatedAt);
      return currentDate > latestDate ? r : latest;
    }, reports[0]);
    
    return {
      totalReports: reports.length,
      totalSales,
      totalPurchases,
      totalVatPayable,
      latestReport,
    };
  }, [reports]);

  return (
    <TooltipProvider delayDuration={150}>
    <div className="p-8 space-y-6">
      <div className="flex justify-between items-start gap-4 flex-wrap">
        <div>
          <h1 className="text-3xl font-bold mb-2">{(t as any).monthlyVatReports || "Monthly VAT Reports"}</h1>
          <p className="text-muted-foreground">{(t as any).vatReportsSubtitle || "Generate and download ZATCA-compliant monthly VAT reports for tax filing"}</p>
        </div>
        
        <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
          <DialogTrigger asChild>
            <Button data-testid="button-generate-report">
              <Plus className="h-4 w-4 mr-2" />
              {(t as any).generateReport || "Generate Report"}
            </Button>
          </DialogTrigger>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>{(t as any).generateMonthlyVatReport || "Generate Monthly VAT Report"}</DialogTitle>
              <DialogDescription>
                {(t as any).selectMonthAndYearDesc || "Select the month and year for which you want to generate a VAT report"}
              </DialogDescription>
            </DialogHeader>
            
            <div className="space-y-4 py-4">
              <div className="space-y-2">
                <Label htmlFor="month">
                  {(t as any).month || "Month"}
                  <InfoTip>{isAr ? 'الشهر الميلادي للفترة الضريبية.' : 'Calendar month of the VAT reporting period.'}</InfoTip>
                </Label>
                <Select value={selectedMonth} onValueChange={setSelectedMonth}>
                  <SelectTrigger id="month" data-testid="select-month">
                    <SelectValue placeholder={(t as any).selectMonth || "Select month"} />
                  </SelectTrigger>
                  <SelectContent>
                    {months.map((month) => (
                      <SelectItem key={month.value} value={month.value}>
                        {month.label}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-2">
                <Label htmlFor="year">
                  {t.year || "Year"}
                  <InfoTip>{isAr ? 'السنة الميلادية للفترة الضريبية.' : 'Calendar year of the VAT reporting period.'}</InfoTip>
                </Label>
                <Select value={selectedYear} onValueChange={setSelectedYear}>
                  <SelectTrigger id="year" data-testid="select-year">
                    <SelectValue placeholder={(t as any).selectYear || "Select year"} />
                  </SelectTrigger>
                  <SelectContent>
                    {years.map((year) => (
                      <SelectItem key={year} value={year.toString()}>
                        {year}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </div>

            <DialogFooter>
              <Button 
                variant="outline" 
                onClick={() => setDialogOpen(false)}
                data-testid="button-cancel"
              >
                {t.cancel}
              </Button>
              <Button 
                onClick={handleGenerate}
                disabled={generateMutation.isPending}
                data-testid="button-confirm-generate"
              >
                {generateMutation.isPending ? (
                  <>
                    <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                    {t.generating || "Generating..."}
                  </>
                ) : (
                  (t as any).generateReport || "Generate Report"
                )}
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </div>

      {isLoading ? (
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
          {[...Array(4)].map((_, i) => (
            <Card key={i}>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2 gap-2">
                <div className="h-4 w-24 bg-muted animate-pulse rounded" />
                <div className="h-4 w-4 bg-muted animate-pulse rounded" />
              </CardHeader>
              <CardContent>
                <div className="h-8 w-32 bg-muted animate-pulse rounded mb-2" />
                <div className="h-3 w-20 bg-muted animate-pulse rounded" />
              </CardContent>
            </Card>
          ))}
        </div>
      ) : summaryStats && (
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
          <Card data-testid="card-total-reports">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2 gap-2">
              <CardTitle className="text-sm font-medium">
                {(t as any).totalReports || "Total Reports"}
                <InfoTip>{isAr ? 'إجمالي عدد تقارير ضريبة القيمة المضافة التي تم إنشاؤها.' : 'Total count of VAT reports generated.'}</InfoTip>
              </CardTitle>
              <FileText className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{summaryStats.totalReports}</div>
              <p className="text-xs text-muted-foreground">{(t as any).generatedReports || "Generated reports"}</p>
            </CardContent>
          </Card>

          <Card data-testid="card-total-sales">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2 gap-2">
              <CardTitle className="text-sm font-medium">
                {(t as any).totalSalesVat || "Total Sales VAT"}
                <InfoTip>{isAr ? 'إجمالي ضريبة المخرجات المُحصلة من المبيعات.' : 'Total output VAT collected from sales.'}</InfoTip>
              </CardTitle>
              <TrendingUp className="h-4 w-4 text-green-500" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold font-mono text-green-600 dark:text-green-500">
                {summaryStats.totalSales.toFixed(2)} SAR
              </div>
              <p className="text-xs text-muted-foreground">{(t as any).outputVatCollected || "Output VAT collected"}</p>
            </CardContent>
          </Card>

          <Card data-testid="card-total-purchases">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2 gap-2">
              <CardTitle className="text-sm font-medium">
                {(t as any).totalPurchasesVat || "Total Purchases VAT"}
                <InfoTip>{isAr ? 'إجمالي ضريبة المدخلات المدفوعة على المشتريات.' : 'Total input VAT paid on purchases.'}</InfoTip>
              </CardTitle>
              <TrendingDown className="h-4 w-4 text-red-500" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold font-mono text-red-600 dark:text-red-500">
                {summaryStats.totalPurchases.toFixed(2)} SAR
              </div>
              <p className="text-xs text-muted-foreground">{(t as any).inputVatPaid || "Input VAT paid"}</p>
            </CardContent>
          </Card>

          <Card data-testid="card-net-vat">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2 gap-2">
              <CardTitle className="text-sm font-medium">
                {(t as any).netVatPayable || "Net VAT Payable"}
                <InfoTip>{isAr ? 'صافي الضريبة المستحقة للهيئة (المخرجات ناقص المدخلات).' : 'Net VAT owed to ZATCA (output minus input VAT).'}</InfoTip>
              </CardTitle>
              <Calculator className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className={`text-2xl font-bold font-mono ${summaryStats.totalVatPayable >= 0 ? 'text-blue-600 dark:text-blue-500' : 'text-green-600 dark:text-green-500'}`}>
                {summaryStats.totalVatPayable.toFixed(2)} SAR
              </div>
              <p className="text-xs text-muted-foreground">
                {summaryStats.totalVatPayable >= 0 ? ((t as any).amountOwedToZatca || 'Amount owed to ZATCA') : ((t as any).creditBalance || 'Credit balance')}
              </p>
            </CardContent>
          </Card>
        </div>
      )}

      <Card>
        <CardHeader>
          <div className="flex items-center justify-between gap-4 flex-wrap">
            <div className="flex items-center gap-2">
              <Receipt className="h-5 w-5 text-muted-foreground" />
              <CardTitle>{(t as any).vatReportHistory || "VAT Report History"}</CardTitle>
            </div>
            <div className="relative w-full max-w-sm">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <Input
                placeholder={(t as any).searchBySerialMonthYear || "Search by serial number, month, or year..."}
                className="pl-10"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                data-testid="input-search-reports"
              />
            </div>
          </div>
        </CardHeader>
        <CardContent>
          {isLoading ? (
            <div className="flex justify-center items-center py-12">
              <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
            </div>
          ) : (
            <div className="rounded-md border">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>{(t as any).serialNumber || "Serial Number"}</TableHead>
                    <TableHead>{(t as any).period || "Period"}</TableHead>
                    <TableHead className="text-right">{(t as any).salesVat || "Sales VAT"}</TableHead>
                    <TableHead className="text-right">{(t as any).purchasesVat || "Purchases VAT"}</TableHead>
                    <TableHead className="text-right">{(t as any).netPayable || "Net Payable"}</TableHead>
                    <TableHead>{(t as any).generated || "Generated"}</TableHead>
                    <TableHead className="text-right">{t.actions || "Actions"}</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {filteredReports.length === 0 ? (
                    <TableRow>
                      <TableCell colSpan={7} className="text-center py-12">
                        <div className="flex flex-col items-center gap-2">
                          <FileText className="h-12 w-12 text-muted-foreground opacity-50" />
                          <p className="text-muted-foreground">
                            {searchQuery ? ((t as any).noVatReportsMatchingSearch || "No VAT reports found matching your search") : ((t as any).noVatReportsYet || "No VAT reports yet")}
                          </p>
                          {!searchQuery && (
                            <p className="text-sm text-muted-foreground">
                              {(t as any).clickGenerateReport || "Click 'Generate Report' to create your first VAT report"}
                            </p>
                          )}
                        </div>
                      </TableCell>
                    </TableRow>
                  ) : (
                    filteredReports
                      .sort((a, b) => new Date(b.generatedAt).getTime() - new Date(a.generatedAt).getTime())
                      .map((report) => {
                        const netVat = parseFloat(report.netVatPayable);
                        return (
                          <TableRow key={report.id} data-testid={`row-report-${report.id}`}>
                            <TableCell>
                              <div className="flex items-center gap-2">
                                <FileText className="h-4 w-4 text-muted-foreground" />
                                <span className="font-medium font-mono">{report.serialNumber}</span>
                              </div>
                            </TableCell>
                            <TableCell>
                              <Badge variant="outline" className="font-normal">
                                <Calendar className="h-3 w-3 mr-1" />
                                {getMonthName(report.reportMonth)} {report.reportYear}
                              </Badge>
                            </TableCell>
                            <TableCell className="text-right font-mono text-green-600 dark:text-green-500">
                              {parseFloat(report.totalSales).toFixed(2)}
                            </TableCell>
                            <TableCell className="text-right font-mono text-red-600 dark:text-red-500">
                              {parseFloat(report.totalPurchases).toFixed(2)}
                            </TableCell>
                            <TableCell className="text-right">
                              <Badge 
                                variant={netVat >= 0 ? "default" : "secondary"}
                                className="font-mono"
                              >
                                {netVat.toFixed(2)} SAR
                              </Badge>
                            </TableCell>
                            <TableCell className="text-muted-foreground">
                              {format(new Date(report.generatedAt), "MMM dd, yyyy")}
                            </TableCell>
                            <TableCell className="text-right">
                              <Button
                                variant="ghost"
                                size="sm"
                                onClick={() => handleDownload(report)}
                                data-testid={`button-download-${report.id}`}
                              >
                                <Download className="h-4 w-4 mr-1" />
                                {t.download}
                              </Button>
                            </TableCell>
                          </TableRow>
                        );
                      })
                  )}
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
