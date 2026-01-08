import { useState, useRef } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardHeader } from "@/components/ui/card";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle } from "@/components/ui/alert-dialog";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { Badge } from "@/components/ui/badge";
import { Textarea } from "@/components/ui/textarea";
import { Plus, Search, Edit, UserCircle, Trash2, DollarSign, TrendingUp, FileDown, Banknote, ChefHat, FileText, Upload, Eye, X } from "lucide-react";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { useQuery, useMutation } from "@tanstack/react-query";
import { apiRequest, queryClient } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { useLanguage } from "@/contexts/LanguageContext";
import { useDeviceLayout } from "@/lib/mobileLayout";

interface Investor {
  id: string;
  name: string;
  nationalId?: string | null;
  contactNumber?: string | null;
  investorType: string; // "money" or "recipe"
  recipeId?: string | null;
  amountInvested: string;
  interestPercentage: string;
  monthlyEarnings?: string; // Calculated field based on net profit
  active: boolean;
  notes?: string;
  documentPath?: string | null;
  createdAt: string;
}

interface Transaction {
  id: number;
  amount: string;
  paymentMethod: string;
  status: string;
  createdAt: string;
}

interface Order {
  id: number;
  total: string;
  items: Array<{ id: string; name: string; quantity: number; price: string }>;
}

interface Recipe {
  id: string;
  name: string;
  cost: string;
}

interface MenuItem {
  id: string;
  recipeId: string | null;
  portionSize: string;
}

interface Salary {
  amount: string;
}

interface ShopBill {
  amount: string;
}

type InvestorFormValues = {
  name: string;
  nationalId?: string;
  contactNumber?: string;
  investorType: string;
  recipeId?: string;
  amountInvested: string;
  interestPercentage: string;
  notes?: string;
};

export default function Investors() {
  const [searchQuery, setSearchQuery] = useState("");
  const [open, setOpen] = useState(false);
  const [editingInvestor, setEditingInvestor] = useState<Investor | null>(null);
  const [deletingInvestor, setDeletingInvestor] = useState<Investor | null>(null);
  const [uploadingDocumentFor, setUploadingDocumentFor] = useState<string | null>(null);
  const [deletingDocumentFor, setDeletingDocumentFor] = useState<Investor | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const { toast } = useToast();
  const { t } = useLanguage();
  const layout = useDeviceLayout();

  const investorFormSchema = z.object({
    name: z.string().min(1, t.investorNameRequired),
    nationalId: z.string().optional(),
    contactNumber: z.string().optional(),
    investorType: z.enum(["money", "recipe"]),
    recipeId: z.string().optional(),
    amountInvested: z.string().refine(
      (val) => {
        if (!val || val === "" || val === "0" || val === "0.00") return true; // Allow empty/zero for recipe investors
        return !isNaN(parseFloat(val)) && parseFloat(val) >= 0;
      },
      { message: t.investmentAmountMustBePositive }
    ),
    interestPercentage: z.string().min(1, t.interestPercentageRequired).refine(
      (val) => {
        const num = parseFloat(val);
        return !isNaN(num) && num >= 0 && num <= 100;
      },
      { message: t.interestRateMustBeBetween0And100 }
    ),
    notes: z.string().optional(),
  }).refine(
    (data) => {
      // If recipe type, recipeId is required
      if (data.investorType === "recipe") {
        return !!data.recipeId;
      }
      // If money type, amountInvested is required and must be > 0
      if (data.investorType === "money") {
        const amount = parseFloat(data.amountInvested || "0");
        return amount > 0;
      }
      return true;
    },
    {
      message: t.selectRecipeForRecipeInvestor || "Please select a recipe for recipe investors or enter an amount for money investors",
      path: ["recipeId"],
    }
  );

  const form = useForm<InvestorFormValues>({
    resolver: zodResolver(investorFormSchema),
    defaultValues: {
      name: "",
      nationalId: "",
      contactNumber: "+966",
      investorType: "money",
      recipeId: "",
      amountInvested: "",
      interestPercentage: "",
      notes: "",
    },
  });
  
  const watchedInvestorType = form.watch("investorType");

  const { data: investors = [], isLoading } = useQuery<Investor[]>({
    queryKey: ["/api/investors"],
  });

  const { data: transactions = [] } = useQuery<Transaction[]>({
    queryKey: ["/api/transactions"],
    retry: false,
  });

  const { data: orders = [] } = useQuery<Order[]>({
    queryKey: ["/api/orders"],
    retry: false,
  });

  const { data: menuItems = [] } = useQuery<MenuItem[]>({
    queryKey: ["/api/menu"],
    retry: false,
  });

  const { data: recipes = [] } = useQuery<Recipe[]>({
    queryKey: ["/api/recipes"],
    retry: false,
  });

  const { data: salaries = [] } = useQuery<Salary[]>({
    queryKey: ["/api/shop/salaries"],
    retry: false,
  });

  const { data: shopBills = [] } = useQuery<ShopBill[]>({
    queryKey: ["/api/shop/bills"],
    retry: false,
  });

  const createInvestorMutation = useMutation({
    mutationFn: async (data: InvestorFormValues) => {
      const payload = {
        name: data.name,
        nationalId: data.nationalId || null,
        contactNumber: data.contactNumber || null,
        investorType: data.investorType,
        recipeId: data.investorType === "recipe" ? data.recipeId : null,
        amountInvested: data.investorType === "recipe" ? "0.00" : parseFloat(data.amountInvested || "0").toFixed(2),
        interestPercentage: parseFloat(data.interestPercentage).toFixed(2),
        notes: data.notes,
      };
      return await apiRequest("POST", "/api/investors", payload);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/investors"] });
      setOpen(false);
      form.reset();
      toast({
        title: t.investorCreated || "Investor Created",
        description: t.investorCreatedDesc || "New investor has been added successfully.",
      });
    },
    onError: (error: any) => {
      toast({
        title: t.failedToCreateInvestor || "Failed to Create Investor",
        description: error.message || "Could not create investor",
        variant: "destructive",
      });
    },
  });

  const updateInvestorMutation = useMutation({
    mutationFn: async (data: InvestorFormValues & { id: string }) => {
      return await apiRequest("PATCH", `/api/investors/${data.id}`, {
        name: data.name,
        nationalId: data.nationalId || null,
        contactNumber: data.contactNumber || null,
        investorType: data.investorType,
        recipeId: data.investorType === "recipe" ? data.recipeId : null,
        amountInvested: data.investorType === "recipe" ? "0.00" : parseFloat(data.amountInvested || "0").toFixed(2),
        interestPercentage: parseFloat(data.interestPercentage).toFixed(2),
        notes: data.notes,
      });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/investors"] });
      setOpen(false);
      setEditingInvestor(null);
      form.reset();
      toast({
        title: t.investorUpdated || "Investor Updated",
        description: t.investorUpdatedDesc || "Investor details have been updated successfully.",
      });
    },
    onError: (error: any) => {
      toast({
        title: t.failedToUpdateInvestor || "Failed to Update Investor",
        description: error.message || "Could not update investor",
        variant: "destructive",
      });
    },
  });

  const deleteInvestorMutation = useMutation({
    mutationFn: async (id: string) => {
      await apiRequest("DELETE", `/api/investors/${id}`);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/investors"] });
      setDeletingInvestor(null);
      toast({
        title: t.investorDeleted || "Investor Deleted",
        description: t.investorDeletedDesc || "Investor has been removed successfully.",
      });
    },
    onError: (error: any) => {
      toast({
        title: t.failedToDeleteInvestor || "Failed to Delete Investor",
        description: error.message || "Could not delete investor",
        variant: "destructive",
      });
    },
  });

  const uploadDocumentMutation = useMutation({
    mutationFn: async ({ investorId, file }: { investorId: string; file: File }) => {
      const formData = new FormData();
      formData.append("document", file);
      const response = await fetch(`/api/investors/${investorId}/document`, {
        method: "POST",
        body: formData,
        credentials: "include",
      });
      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.error || "Upload failed");
      }
      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/investors"] });
      setUploadingDocumentFor(null);
      toast({
        title: t.documentUploaded || "Document Uploaded",
        description: t.documentUploadedDesc || "Document has been uploaded successfully.",
      });
    },
    onError: (error: any) => {
      toast({
        title: t.failedToUploadDocument || "Failed to Upload Document",
        description: error.message || "Could not upload document",
        variant: "destructive",
      });
    },
  });

  const deleteDocumentMutation = useMutation({
    mutationFn: async (investorId: string) => {
      await apiRequest("DELETE", `/api/investors/${investorId}/document`);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/investors"] });
      setDeletingDocumentFor(null);
      toast({
        title: t.documentDeleted || "Document Deleted",
        description: t.documentDeletedDesc || "Document has been removed successfully.",
      });
    },
    onError: (error: any) => {
      toast({
        title: t.failedToDeleteDocument || "Failed to Delete Document",
        description: error.message || "Could not delete document",
        variant: "destructive",
      });
    },
  });

  const handleFileUpload = (investorId: string, file: File) => {
    if (file.type !== "application/pdf") {
      toast({
        title: t.invalidFileType || "Invalid File Type",
        description: t.onlyPdfAllowed || "Only PDF files are allowed",
        variant: "destructive",
      });
      return;
    }
    if (file.size > 10 * 1024 * 1024) {
      toast({
        title: t.fileTooLarge || "File Too Large",
        description: t.maxFileSize10MB || "Maximum file size is 10MB",
        variant: "destructive",
      });
      return;
    }
    setUploadingDocumentFor(investorId);
    uploadDocumentMutation.mutate({ investorId, file });
  };

  const handleViewDocument = (investor: Investor) => {
    if (investor.documentPath) {
      window.open(`/api/investors/${investor.id}/document`, "_blank");
    }
  };

  const onSubmit = (data: InvestorFormValues) => {
    if (editingInvestor) {
      updateInvestorMutation.mutate({ ...data, id: editingInvestor.id });
    } else {
      createInvestorMutation.mutate(data);
    }
  };

  const handleEdit = (investor: Investor) => {
    setEditingInvestor(investor);
    form.reset({
      name: investor.name,
      nationalId: investor.nationalId || "",
      contactNumber: investor.contactNumber || "+966",
      investorType: investor.investorType || "money",
      recipeId: investor.recipeId || "",
      amountInvested: investor.amountInvested,
      interestPercentage: investor.interestPercentage,
      notes: investor.notes || "",
    });
    setOpen(true);
  };

  const handleOpenChange = (isOpen: boolean) => {
    setOpen(isOpen);
    if (!isOpen) {
      setEditingInvestor(null);
      form.reset();
    }
  };

  const handleCloseDialog = () => {
    setOpen(false);
    setEditingInvestor(null);
    form.reset();
  };

  const filteredInvestors = investors.filter((investor) =>
    investor.name.toLowerCase().includes(searchQuery.toLowerCase())
  );

  // Calculate net profit after all costs
  const calculateNetProfit = () => {
    // Total revenue from transactions
    const totalRevenue = transactions.reduce((sum, t) => sum + parseFloat(t.amount || "0"), 0);

    // Calculate costs of goods sold (COGS) from orders
    let totalCOGS = 0;
    orders.forEach(order => {
      order.items.forEach(item => {
        const menuItem = menuItems.find(m => m.id === item.id);
        if (menuItem && menuItem.recipeId) {
          const recipe = recipes.find(r => r.id === menuItem.recipeId);
          if (recipe) {
            const recipeCost = parseFloat(recipe.cost);
            const portionSize = parseFloat(menuItem.portionSize || "1.00");
            const itemCost = recipeCost * portionSize;
            totalCOGS += itemCost * item.quantity;
          }
        }
      });
    });

    // Calculate total salaries
    const totalSalaries = salaries.reduce((sum, s) => sum + parseFloat(s.amount || "0"), 0);

    // Calculate total shop bills
    const totalShopBills = shopBills.reduce((sum, b) => sum + parseFloat(b.amount || "0"), 0);

    // Net profit = Revenue - COGS - Salaries - Shop Bills
    const netProfit = totalRevenue - totalCOGS - totalSalaries - totalShopBills;

    return netProfit;
  };

  // Calculate monthly earnings for an investor
  const calculateMonthlyEarnings = (investor: Investor) => {
    const netProfit = calculateNetProfit();
    const interestPercentage = parseFloat(investor.interestPercentage || "0");
    const monthlyEarnings = (netProfit * interestPercentage) / 100;
    return monthlyEarnings;
  };

  // Download investor statement PDF
  const [downloadingStatement, setDownloadingStatement] = useState<string | null>(null);
  
  const handleDownloadStatement = async (investor: Investor) => {
    try {
      setDownloadingStatement(investor.id);
      
      const response = await fetch(`/api/investors/${investor.id}/statement`, {
        method: 'GET',
        credentials: 'include',
      });
      
      if (!response.ok) {
        throw new Error('Failed to generate statement');
      }
      
      // Get the PDF blob
      const blob = await response.blob();
      
      // Create download link
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `investor-statement-${investor.name.replace(/\s+/g, '-')}-${new Date().toISOString().split('T')[0]}.pdf`;
      document.body.appendChild(a);
      a.click();
      window.URL.revokeObjectURL(url);
      document.body.removeChild(a);
      
      toast({
        title: t.statementDownloaded || "Statement Downloaded",
        description: `Statement for ${investor.name} has been downloaded.`,
      });
    } catch (error) {
      console.error("Error downloading statement:", error);
      toast({
        title: t.statementDownloadFailed || "Download Failed",
        description: "Could not download the investor statement.",
        variant: "destructive",
      });
    } finally {
      setDownloadingStatement(null);
    }
  };

  const netProfit = calculateNetProfit();

  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-muted-foreground">{t.loading || "Loading..."}</div>
      </div>
    );
  }

  return (
    <div className={`${layout.padding} ${layout.spaceY}`}>
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className={`${layout.text3Xl} font-bold`}>{t.investors || "Investors"}</h1>
          <p className="text-muted-foreground mt-1">
            {t.manageInvestors || "Manage investors and track their earnings"}
          </p>
        </div>
        <Dialog open={open} onOpenChange={handleOpenChange}>
          <DialogTrigger asChild>
            <Button className={layout.isMobile ? "w-full" : ""} data-testid="button-add-investor">
              <Plus className="h-4 w-4 mr-2" />
              {t.addInvestor || "Add Investor"}
            </Button>
          </DialogTrigger>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>
                {editingInvestor
                  ? t.editInvestor || "Edit Investor"
                  : t.addInvestor || "Add Investor"}
              </DialogTitle>
              <DialogDescription>
                {editingInvestor
                  ? t.editInvestorDesc || "Update investor details."
                  : t.addInvestorDesc || "Add a new investor to track their earnings."}
              </DialogDescription>
            </DialogHeader>

            <Form {...form}>
              <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
                <FormField
                  control={form.control}
                  name="name"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>{t.investorName || "Investor Name"}</FormLabel>
                      <FormControl>
                        <Input
                          placeholder={t.enterInvestorName || "Enter investor name"}
                          {...field}
                          className="h-[44px]"
                          data-testid="input-investor-name"
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={form.control}
                  name="nationalId"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>{t.investorNationalId || "ID (National/Iqama)"}</FormLabel>
                      <FormControl>
                        <Input
                          placeholder={t.enterNationalId || "Enter ID number"}
                          {...field}
                          className="h-[44px]"
                          data-testid="input-investor-national-id"
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={form.control}
                  name="contactNumber"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>{t.investorContactNumber || "Contact Number"}</FormLabel>
                      <FormControl>
                        <Input
                          placeholder="+966 5XXXXXXXX"
                          {...field}
                          className="h-[44px]"
                          data-testid="input-investor-contact-number"
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={form.control}
                  name="investorType"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>{t.investorType || "Investor Type"}</FormLabel>
                      <Select onValueChange={field.onChange} value={field.value}>
                        <FormControl>
                          <SelectTrigger className="h-[44px]" data-testid="select-investor-type">
                            <SelectValue placeholder={t.selectInvestorType || "Select investor type"} />
                          </SelectTrigger>
                        </FormControl>
                        <SelectContent>
                          <SelectItem value="money" data-testid="option-money-investor">
                            <div className="flex items-center gap-2">
                              <Banknote className="h-4 w-4" />
                              {t.moneyInvestor || "Money Investor"}
                            </div>
                          </SelectItem>
                          <SelectItem value="recipe" data-testid="option-recipe-owner">
                            <div className="flex items-center gap-2">
                              <ChefHat className="h-4 w-4" />
                              {t.recipeOwner || "Recipe Owner"}
                            </div>
                          </SelectItem>
                        </SelectContent>
                      </Select>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                {watchedInvestorType === "recipe" && (
                  <FormField
                    control={form.control}
                    name="recipeId"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>{t.selectRecipe || "Select Recipe"}</FormLabel>
                        <Select onValueChange={field.onChange} value={field.value}>
                          <FormControl>
                            <SelectTrigger className="h-[44px]" data-testid="select-recipe">
                              <SelectValue placeholder={t.selectRecipePlaceholder || "Select a recipe"} />
                            </SelectTrigger>
                          </FormControl>
                          <SelectContent>
                            {recipes.map((recipe) => (
                              <SelectItem key={recipe.id} value={recipe.id} data-testid={`option-recipe-${recipe.id}`}>
                                {recipe.name}
                              </SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                        <FormMessage />
                        <p className="text-sm text-muted-foreground">
                          {t.recipeOwnerHelp || "The investor will receive a percentage of net sales from this recipe"}
                        </p>
                      </FormItem>
                    )}
                  />
                )}

                {watchedInvestorType === "money" && (
                  <FormField
                    control={form.control}
                    name="amountInvested"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>{t.amountInvested || "Amount Invested (SAR)"}</FormLabel>
                        <FormControl>
                          <Input
                            type="number"
                            step="0.01"
                            placeholder="0.00"
                            {...field}
                            className="h-[44px]"
                            data-testid="input-amount-invested"
                          />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                )}

                <FormField
                  control={form.control}
                  name="interestPercentage"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>{t.interestPercentage || "Interest Percentage (%)"}</FormLabel>
                      <FormControl>
                        <Input
                          type="number"
                          step="0.01"
                          placeholder="0.00"
                          {...field}
                          className="h-[44px]"
                          data-testid="input-interest-percentage"
                        />
                      </FormControl>
                      <FormMessage />
                      <p className="text-sm text-muted-foreground">
                        {t.interestPercentageHelp || "Percentage of net profit to be earned"}
                      </p>
                    </FormItem>
                  )}
                />

                <FormField
                  control={form.control}
                  name="notes"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>{t.notes || "Notes"} (Optional)</FormLabel>
                      <FormControl>
                        <Textarea
                          placeholder="Enter any additional notes"
                          {...field}
                          data-testid="input-investor-notes"
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <div className="flex gap-3 pt-4">
                  <Button
                    type="button"
                    variant="outline"
                    onClick={handleCloseDialog}
                    className="flex-1 h-[44px]"
                    data-testid="button-cancel"
                  >
                    {t.cancel || "Cancel"}
                  </Button>
                  <Button
                    type="submit"
                    disabled={createInvestorMutation.isPending || updateInvestorMutation.isPending}
                    className="flex-1 h-[44px]"
                    data-testid="button-save-investor"
                  >
                    {createInvestorMutation.isPending || updateInvestorMutation.isPending
                      ? t.saving || "Saving..."
                      : editingInvestor
                        ? t.updateInvestor || "Update Investor"
                        : t.createInvestor || "Create Investor"}
                  </Button>
                </div>
              </form>
            </Form>
          </DialogContent>
        </Dialog>
      </div>

      {/* Net Profit Summary */}
      <Card>
        <CardHeader>
          <div className="flex items-center gap-2">
            <TrendingUp className="h-5 w-5 text-primary" />
            <h3 className={layout.textXl + " font-semibold"}>{t.netProfitSummary || "Net Profit Summary"}</h3>
          </div>
        </CardHeader>
        <CardContent>
          <div className="text-2xl font-bold" data-testid="text-net-profit">
            {netProfit.toFixed(2)} {t.sar || "SAR"}
          </div>
          <p className="text-sm text-muted-foreground mt-1">
            {t.netProfitDesc || "Total net profit after all costs (used for investor earnings calculation)"}
          </p>
        </CardContent>
      </Card>

      {/* Search */}
      <div className="relative">
        <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground h-4 w-4" />
        <Input
          type="text"
          placeholder={t.searchInvestors || "Search investors..."}
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          className="pl-10 h-[44px]"
          data-testid="input-search-investors"
        />
      </div>

      {/* Investors List */}
      <div className={`grid ${layout.gridCols({ desktop: 3, tablet: 2, mobile: 1 })} gap-4`}>
        {filteredInvestors.length === 0 ? (
          <Card className="col-span-full">
            <CardContent className="flex flex-col items-center justify-center py-12">
              <UserCircle className="h-12 w-12 text-muted-foreground mb-4" />
              <h3 className="text-lg font-semibold mb-2">
                {t.noInvestorsFound || "No investors found"}
              </h3>
              <p className="text-muted-foreground text-center">
                {searchQuery
                  ? "Try a different search term"
                  : t.addFirstInvestor || "Add your first investor to get started"}
              </p>
            </CardContent>
          </Card>
        ) : (
          filteredInvestors.map((investor) => {
            const monthlyEarnings = calculateMonthlyEarnings(investor);
            return (
              <Card key={investor.id} data-testid={`card-investor-${investor.id}`}>
                <CardContent className="p-6">
                  <div className="flex flex-col gap-4">
                    <div className="flex items-start justify-between gap-4">
                      <div className="flex items-center gap-3 flex-1">
                        <div className="bg-primary/10 p-2 rounded-lg">
                          <UserCircle className="h-6 w-6 text-primary" />
                        </div>
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center gap-2">
                            <h3 className="font-semibold truncate">{investor.name}</h3>
                            <Badge variant="outline" className="shrink-0" data-testid={`badge-investor-type-${investor.id}`}>
                              {(investor.investorType || "money") === "recipe" ? (
                                <span className="flex items-center gap-1">
                                  <ChefHat className="h-3 w-3" />
                                  {t.recipeOwner || "Recipe"}
                                </span>
                              ) : (
                                <span className="flex items-center gap-1">
                                  <Banknote className="h-3 w-3" />
                                  {t.moneyInvestor || "Money"}
                                </span>
                              )}
                            </Badge>
                          </div>
                          <p className="text-sm text-muted-foreground">
                            {investor.investorType === "recipe" && investor.recipeId
                              ? (recipes.find((r) => r.id === investor.recipeId)?.name || t.unknownRecipe || "Unknown Recipe")
                              : new Date(investor.createdAt).toLocaleDateString()}
                          </p>
                        </div>
                      </div>
                      <div className="flex gap-2">
                        <Button
                          size="icon"
                          variant="ghost"
                          onClick={() => handleDownloadStatement(investor)}
                          disabled={downloadingStatement === investor.id}
                          className="h-[44px] w-[44px] shrink-0 text-primary hover:text-primary"
                          data-testid={`button-download-statement-${investor.id}`}
                          title={t.downloadStatement || "Download Statement"}
                        >
                          <FileDown className={`h-4 w-4 ${downloadingStatement === investor.id ? 'animate-pulse' : ''}`} />
                        </Button>
                        <Button
                          size="icon"
                          variant="ghost"
                          onClick={() => handleEdit(investor)}
                          className="h-[44px] w-[44px] shrink-0"
                          data-testid={`button-edit-${investor.id}`}
                        >
                          <Edit className="h-4 w-4" />
                        </Button>
                        <Button
                          size="icon"
                          variant="ghost"
                          onClick={() => setDeletingInvestor(investor)}
                          className="h-[44px] w-[44px] shrink-0 text-destructive hover:text-destructive"
                          data-testid={`button-delete-${investor.id}`}
                        >
                          <Trash2 className="h-4 w-4" />
                        </Button>
                      </div>
                    </div>

                    <div className="space-y-2">
                      {(investor.investorType || "money") === "money" && (
                        <div className="flex items-center justify-between">
                          <span className="text-sm text-muted-foreground">{t.amountInvested || "Amount Invested"}</span>
                          <span className="font-medium">{parseFloat(investor.amountInvested).toFixed(2)} {t.sar || "SAR"}</span>
                        </div>
                      )}
                      {investor.investorType === "recipe" && (
                        <div className="flex items-center justify-between">
                          <span className="text-sm text-muted-foreground">{t.earningsSource || "Earnings Source"}</span>
                          <span className="font-medium">{t.recipeSales || "Recipe Sales"}</span>
                        </div>
                      )}
                      <div className="flex items-center justify-between">
                        <span className="text-sm text-muted-foreground">{investor.investorType === "recipe" ? (t.profitShare || "Profit Share") : (t.interestPercentage || "Interest %")}</span>
                        <Badge variant="secondary">{parseFloat(investor.interestPercentage).toFixed(2)}%</Badge>
                      </div>
                      <div className="flex items-center justify-between pt-2 border-t">
                        <span className="text-sm font-medium">{t.monthlyEarnings || "Monthly Earnings"}</span>
                        <div className="flex items-center gap-2">
                          <DollarSign className="h-4 w-4 text-green-600" />
                          <span 
                            className="font-bold text-green-600"
                            data-testid={`text-monthly-earnings-${investor.id}`}
                          >
                            {monthlyEarnings.toFixed(2)} {t.sar || "SAR"}
                          </span>
                        </div>
                      </div>
                    </div>

                    {investor.notes && (
                      <div className="pt-2 border-t">
                        <p className="text-sm text-muted-foreground">{investor.notes}</p>
                      </div>
                    )}

                    {/* Document Section */}
                    <div className="pt-2 border-t">
                      <div className="flex items-center justify-between mb-2">
                        <span className="text-sm font-medium flex items-center gap-1">
                          <FileText className="h-4 w-4" />
                          {t.investorDocument || "Document"}
                        </span>
                      </div>
                      {investor.documentPath ? (
                        <div className="flex items-center gap-2">
                          <Badge variant="secondary" className="flex items-center gap-1">
                            <FileText className="h-3 w-3" />
                            PDF
                          </Badge>
                          <Button
                            size="sm"
                            variant="outline"
                            onClick={() => handleViewDocument(investor)}
                            className="h-8"
                            data-testid={`button-view-document-${investor.id}`}
                          >
                            <Eye className="h-3 w-3 mr-1" />
                            {t.view || "View"}
                          </Button>
                          <Button
                            size="sm"
                            variant="outline"
                            onClick={() => setDeletingDocumentFor(investor)}
                            className="h-8 text-destructive hover:text-destructive"
                            data-testid={`button-delete-document-${investor.id}`}
                          >
                            <X className="h-3 w-3" />
                          </Button>
                        </div>
                      ) : (
                        <div>
                          <input
                            type="file"
                            accept=".pdf"
                            className="hidden"
                            id={`file-upload-${investor.id}`}
                            onChange={(e) => {
                              const file = e.target.files?.[0];
                              if (file) {
                                handleFileUpload(investor.id, file);
                              }
                              e.target.value = "";
                            }}
                            data-testid={`input-file-${investor.id}`}
                          />
                          <label htmlFor={`file-upload-${investor.id}`}>
                            <Button
                              size="sm"
                              variant="outline"
                              className="h-8 cursor-pointer"
                              disabled={uploadingDocumentFor === investor.id}
                              asChild
                            >
                              <span>
                                {uploadingDocumentFor === investor.id ? (
                                  <>{t.uploading || "Uploading..."}</>
                                ) : (
                                  <>
                                    <Upload className="h-3 w-3 mr-1" />
                                    {t.uploadPdf || "Upload PDF"}
                                  </>
                                )}
                              </span>
                            </Button>
                          </label>
                        </div>
                      )}
                    </div>
                  </div>
                </CardContent>
              </Card>
            );
          })
        )}
      </div>

      {/* Delete Document Confirmation Dialog */}
      <AlertDialog open={!!deletingDocumentFor} onOpenChange={() => setDeletingDocumentFor(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>{t.confirmDeleteDocument || "Delete Document"}</AlertDialogTitle>
            <AlertDialogDescription>
              {t.confirmDeleteDocumentDesc || `Are you sure you want to delete the document for ${deletingDocumentFor?.name}?`}
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel className="h-[44px]" data-testid="button-cancel-delete-document">
              {t.cancel || "Cancel"}
            </AlertDialogCancel>
            <AlertDialogAction
              onClick={() => deletingDocumentFor && deleteDocumentMutation.mutate(deletingDocumentFor.id)}
              className="h-[44px] bg-destructive text-destructive-foreground hover:bg-destructive/90"
              data-testid="button-confirm-delete-document"
            >
              {t.delete || "Delete"}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      {/* Delete Confirmation Dialog */}
      <AlertDialog open={!!deletingInvestor} onOpenChange={() => setDeletingInvestor(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>{t.confirmDelete || "Confirm Delete"}</AlertDialogTitle>
            <AlertDialogDescription>
              {t.confirmDeleteInvestorDesc || `Are you sure you want to delete ${deletingInvestor?.name}? This action cannot be undone.`}
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel className="h-[44px]" data-testid="button-cancel-delete">
              {t.cancel || "Cancel"}
            </AlertDialogCancel>
            <AlertDialogAction
              onClick={() => deletingInvestor && deleteInvestorMutation.mutate(deletingInvestor.id)}
              className="h-[44px] bg-destructive text-destructive-foreground hover:bg-destructive/90"
              data-testid="button-confirm-delete"
            >
              {t.delete || "Delete"}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
