import { useState } from "react";
import { useQuery, useMutation } from "@tanstack/react-query";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { useToast } from "@/hooks/use-toast";
import { Download, FileText, Plus, Search, Loader2 } from "lucide-react";
import { format } from "date-fns";
import { queryClient, apiRequest } from "@/lib/queryClient";
import type { MonthlyVatReport } from "@shared/schema";

export default function VatReports() {
  const { toast } = useToast();
  const [searchQuery, setSearchQuery] = useState("");
  const [dialogOpen, setDialogOpen] = useState(false);
  const [selectedMonth, setSelectedMonth] = useState<string>("");
  const [selectedYear, setSelectedYear] = useState<string>("");

  const { data: reports = [], isLoading } = useQuery<MonthlyVatReport[]>({
    queryKey: ["/api/vat-reports"],
  });

  const generateMutation = useMutation({
    mutationFn: async (data: { month: number; year: number }) => {
      return apiRequest("/api/vat-reports/generate", "POST", data);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/vat-reports"] });
      setDialogOpen(false);
      setSelectedMonth("");
      setSelectedYear("");
      toast({
        title: "VAT Report Generated",
        description: "Monthly VAT report has been successfully generated",
      });
    },
    onError: (error) => {
      toast({
        title: "Generation Failed",
        description: error instanceof Error ? error.message : "Failed to generate VAT report",
        variant: "destructive",
      });
    },
  });

  const handleGenerate = () => {
    if (!selectedMonth || !selectedYear) {
      toast({
        title: "Invalid Input",
        description: "Please select both month and year",
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
        title: "Report Downloaded",
        description: `VAT Report ${report.serialNumber} has been downloaded`,
      });
    } catch (error) {
      toast({
        title: "Download Failed",
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

  return (
    <div className="p-8 space-y-6">
      <div className="flex justify-between items-start">
        <div>
          <h1 className="text-3xl font-bold mb-2">Monthly VAT Reports</h1>
          <p className="text-muted-foreground">Generate and download ZATCA-compliant monthly VAT reports for tax filing</p>
        </div>
        
        <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
          <DialogTrigger asChild>
            <Button data-testid="button-generate-report">
              <Plus className="h-4 w-4 mr-2" />
              Generate Report
            </Button>
          </DialogTrigger>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Generate Monthly VAT Report</DialogTitle>
              <DialogDescription>
                Select the month and year for which you want to generate a VAT report
              </DialogDescription>
            </DialogHeader>
            
            <div className="space-y-4 py-4">
              <div className="space-y-2">
                <Label htmlFor="month">Month</Label>
                <Select value={selectedMonth} onValueChange={setSelectedMonth}>
                  <SelectTrigger id="month" data-testid="select-month">
                    <SelectValue placeholder="Select month" />
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
                <Label htmlFor="year">Year</Label>
                <Select value={selectedYear} onValueChange={setSelectedYear}>
                  <SelectTrigger id="year" data-testid="select-year">
                    <SelectValue placeholder="Select year" />
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
                Cancel
              </Button>
              <Button 
                onClick={handleGenerate}
                disabled={generateMutation.isPending}
                data-testid="button-confirm-generate"
              >
                {generateMutation.isPending ? (
                  <>
                    <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                    Generating...
                  </>
                ) : (
                  "Generate Report"
                )}
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </div>

      <Card className="p-6">
        <div className="flex gap-4 mb-6">
          <div className="relative flex-1">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <Input
              placeholder="Search by serial number, month, or year..."
              className="pl-10"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              data-testid="input-search-reports"
            />
          </div>
        </div>

        {isLoading ? (
          <div className="flex justify-center items-center py-12">
            <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
          </div>
        ) : (
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Serial Number</TableHead>
                <TableHead>Period</TableHead>
                <TableHead>Total Sales</TableHead>
                <TableHead>Total Purchases</TableHead>
                <TableHead>Net VAT Payable</TableHead>
                <TableHead>Generated Date</TableHead>
                <TableHead className="text-right">Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {filteredReports.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={7} className="text-center py-8 text-muted-foreground">
                    {searchQuery ? "No VAT reports found matching your search" : "No VAT reports yet. Click 'Generate Report' to create one."}
                  </TableCell>
                </TableRow>
              ) : (
                filteredReports.map((report) => (
                  <TableRow key={report.id} data-testid={`row-report-${report.id}`}>
                    <TableCell className="font-medium">
                      <div className="flex items-center gap-2">
                        <FileText className="h-4 w-4 text-muted-foreground" />
                        {report.serialNumber}
                      </div>
                    </TableCell>
                    <TableCell>
                      {getMonthName(report.reportMonth)} {report.reportYear}
                    </TableCell>
                    <TableCell className="font-mono">
                      {parseFloat(report.totalSales).toFixed(2)} SAR
                    </TableCell>
                    <TableCell className="font-mono">
                      {parseFloat(report.totalPurchases).toFixed(2)} SAR
                    </TableCell>
                    <TableCell className="font-mono font-semibold">
                      {parseFloat(report.netVatPayable).toFixed(2)} SAR
                    </TableCell>
                    <TableCell>
                      {format(new Date(report.generatedAt), "MMM dd, yyyy")}
                    </TableCell>
                    <TableCell className="text-right">
                      <div className="flex justify-end gap-2">
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => handleDownload(report)}
                          data-testid={`button-download-${report.id}`}
                        >
                          <Download className="h-4 w-4 mr-1" />
                          Download
                        </Button>
                      </div>
                    </TableCell>
                  </TableRow>
                ))
              )}
            </TableBody>
          </Table>
        )}
      </Card>
    </div>
  );
}
