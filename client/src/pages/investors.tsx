import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardHeader } from "@/components/ui/card";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle } from "@/components/ui/alert-dialog";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { Badge } from "@/components/ui/badge";
import { Textarea } from "@/components/ui/textarea";
import { Plus, Search, Edit, UserCircle, Trash2, DollarSign, TrendingUp } from "lucide-react";
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
  amountInvested: string;
  interestPercentage: string;
  active: boolean;
  notes?: string;
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

const investorFormSchema = z.object({
  name: z.string().min(1, "Investor name is required"),
  amountInvested: z.string().min(1, "Investment amount is required").refine(
    (val) => !isNaN(parseFloat(val)) && parseFloat(val) > 0,
    { message: "Investment amount must be a positive number" }
  ),
  interestPercentage: z.string().min(1, "Interest percentage is required").refine(
    (val) => {
      const num = parseFloat(val);
      return !isNaN(num) && num >= 0 && num <= 100;
    },
    { message: "Interest percentage must be between 0 and 100" }
  ),
  notes: z.string().optional(),
});

type InvestorFormValues = z.infer<typeof investorFormSchema>;

export default function Investors() {
  const [searchQuery, setSearchQuery] = useState("");
  const [open, setOpen] = useState(false);
  const [editingInvestor, setEditingInvestor] = useState<Investor | null>(null);
  const [deletingInvestor, setDeletingInvestor] = useState<Investor | null>(null);
  const { toast } = useToast();
  const { t } = useLanguage();
  const layout = useDeviceLayout();

  const form = useForm<InvestorFormValues>({
    resolver: zodResolver(investorFormSchema),
    defaultValues: {
      name: "",
      amountInvested: "",
      interestPercentage: "",
      notes: "",
    },
  });

  const { data: investors = [], isLoading } = useQuery<Investor[]>({
    queryKey: ["/api/investors"],
  });

  const { data: transactions = [] } = useQuery<Transaction[]>({
    queryKey: ["/api/transactions"],
  });

  const { data: orders = [] } = useQuery<Order[]>({
    queryKey: ["/api/orders"],
  });

  const { data: menuItems = [] } = useQuery<MenuItem[]>({
    queryKey: ["/api/menu"],
  });

  const { data: recipes = [] } = useQuery<Recipe[]>({
    queryKey: ["/api/recipes"],
  });

  const { data: salaries = [] } = useQuery<Salary[]>({
    queryKey: ["/api/salaries"],
  });

  const { data: shopBills = [] } = useQuery<ShopBill[]>({
    queryKey: ["/api/shop-bills"],
  });

  const createInvestorMutation = useMutation({
    mutationFn: async (data: InvestorFormValues) => {
      return await apiRequest("POST", "/api/investors", data);
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
        amountInvested: data.amountInvested,
        interestPercentage: data.interestPercentage,
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
                      <FormLabel>{t.notes || "Notes"} ({t.optional || "Optional"})</FormLabel>
                      <FormControl>
                        <Textarea
                          placeholder={t.enterNotes || "Enter any additional notes"}
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
            <h3 className={layout.textLg + " font-semibold"}>{t.netProfitSummary || "Net Profit Summary"}</h3>
          </div>
        </CardHeader>
        <CardContent>
          <div className="text-2xl font-bold">
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
      <div className={`grid ${layout.gridCols()} gap-4`}>
        {filteredInvestors.length === 0 ? (
          <Card className="col-span-full">
            <CardContent className="flex flex-col items-center justify-center py-12">
              <UserCircle className="h-12 w-12 text-muted-foreground mb-4" />
              <h3 className="text-lg font-semibold mb-2">
                {t.noInvestorsFound || "No investors found"}
              </h3>
              <p className="text-muted-foreground text-center">
                {searchQuery
                  ? t.tryDifferentSearch || "Try a different search term"
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
                          <h3 className="font-semibold truncate">{investor.name}</h3>
                          <p className="text-sm text-muted-foreground">
                            {new Date(investor.createdAt).toLocaleDateString()}
                          </p>
                        </div>
                      </div>
                      <div className="flex gap-2">
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
                      <div className="flex items-center justify-between">
                        <span className="text-sm text-muted-foreground">{t.amountInvested || "Amount Invested"}</span>
                        <span className="font-medium">{parseFloat(investor.amountInvested).toFixed(2)} {t.sar || "SAR"}</span>
                      </div>
                      <div className="flex items-center justify-between">
                        <span className="text-sm text-muted-foreground">{t.interestPercentage || "Interest %"}</span>
                        <Badge variant="secondary">{parseFloat(investor.interestPercentage).toFixed(2)}%</Badge>
                      </div>
                      <div className="flex items-center justify-between pt-2 border-t">
                        <span className="text-sm font-medium">{t.monthlyEarnings || "Monthly Earnings"}</span>
                        <div className="flex items-center gap-2">
                          <DollarSign className="h-4 w-4 text-green-600" />
                          <span className="font-bold text-green-600">
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
                  </div>
                </CardContent>
              </Card>
            );
          })
        )}
      </div>

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
