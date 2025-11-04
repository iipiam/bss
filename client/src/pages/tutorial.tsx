import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { useLanguage } from "@/contexts/LanguageContext";
import { 
  BookOpen, 
  ShoppingCart, 
  Package, 
  UtensilsCrossed, 
  ChefHat, 
  UserCircle,
  ClipboardList,
  DollarSign,
  Receipt,
  Calculator,
  TrendingUp,
  BarChart3,
  FileCheck
} from "lucide-react";

export default function Tutorial() {
  const { t } = useLanguage();

  const tutorials = [
    {
      icon: ShoppingCart,
      title: t.tutorialPOS,
      description: t.tutorialPOSDesc,
      gradient: "from-emerald-500 to-teal-500"
    },
    {
      icon: Package,
      title: t.tutorialInventory,
      description: t.tutorialInventoryDesc,
      gradient: "from-blue-500 to-indigo-500"
    },
    {
      icon: UtensilsCrossed,
      title: t.tutorialMenu,
      description: t.tutorialMenuDesc,
      gradient: "from-green-500 to-emerald-500"
    },
    {
      icon: ChefHat,
      title: t.tutorialRecipes,
      description: t.tutorialRecipesDesc,
      gradient: "from-yellow-500 to-orange-500"
    },
    {
      icon: UserCircle,
      title: t.tutorialCustomers,
      description: t.tutorialCustomersDesc,
      gradient: "from-cyan-500 to-blue-500"
    },
    {
      icon: ClipboardList,
      title: t.tutorialOrders,
      description: t.tutorialOrdersDesc,
      gradient: "from-blue-500 to-cyan-500"
    },
    {
      icon: BarChart3,
      title: t.tutorialDashboard,
      description: t.tutorialDashboardDesc,
      gradient: "from-purple-500 to-pink-500"
    },
    {
      icon: DollarSign,
      title: t.tutorialSales,
      description: t.tutorialSalesDesc,
      gradient: "from-green-500 to-teal-500"
    },
    {
      icon: Calculator,
      title: t.tutorialProfitability,
      description: t.tutorialProfitabilityDesc,
      gradient: "from-amber-500 to-orange-500"
    },
    {
      icon: TrendingUp,
      title: t.tutorialForecasting,
      description: t.tutorialForecastingDesc,
      gradient: "from-cyan-500 to-sky-500"
    },
    {
      icon: FileCheck,
      title: t.tutorialInvoices,
      description: t.tutorialInvoicesDesc,
      gradient: "from-violet-500 to-purple-500"
    },
    {
      icon: Receipt,
      title: t.tutorialFinancial,
      description: t.tutorialFinancialDesc,
      gradient: "from-blue-500 to-purple-500"
    }
  ];

  return (
    <div className="h-full overflow-auto p-6">
      <div className="max-w-7xl mx-auto space-y-6">
        <div className="space-y-2">
          <div className="flex items-center gap-3">
            <div className="p-3 rounded-lg bg-gradient-to-r from-purple-500 to-pink-500">
              <BookOpen className="h-6 w-6 text-white" />
            </div>
            <h1 className="text-3xl font-bold bg-gradient-to-r from-purple-500 to-pink-500 bg-clip-text text-transparent" data-testid="text-title">
              {t.tutorial}
            </h1>
          </div>
          <p className="text-muted-foreground" data-testid="text-subtitle">
            {t.tutorialSubtitle}
          </p>
        </div>

        <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
          {tutorials.map((tutorial, index) => (
            <Card key={index} className="hover-elevate group transition-all duration-300" data-testid={`card-tutorial-${index}`}>
              <CardHeader>
                <div className={`mb-4 p-3 rounded-lg bg-gradient-to-r ${tutorial.gradient} w-fit`}>
                  <tutorial.icon className="h-6 w-6 text-white" />
                </div>
                <CardTitle className="text-lg">{tutorial.title}</CardTitle>
              </CardHeader>
              <CardContent>
                <CardDescription className="text-sm leading-relaxed">
                  {tutorial.description}
                </CardDescription>
              </CardContent>
            </Card>
          ))}
        </div>

        <Card className="border-primary/20 bg-gradient-to-r from-primary/5 to-primary/10">
          <CardHeader>
            <CardTitle className="text-xl bg-gradient-to-r from-primary to-primary/70 bg-clip-text text-transparent">
              {t.tutorialGettingStarted}
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-3">
              <div className="flex items-start gap-3">
                <div className="flex-shrink-0 w-6 h-6 rounded-full bg-primary text-primary-foreground flex items-center justify-center text-sm font-bold">
                  1
                </div>
                <p className="text-sm pt-0.5">{t.tutorialStep1}</p>
              </div>
              <div className="flex items-start gap-3">
                <div className="flex-shrink-0 w-6 h-6 rounded-full bg-primary text-primary-foreground flex items-center justify-center text-sm font-bold">
                  2
                </div>
                <p className="text-sm pt-0.5">{t.tutorialStep2}</p>
              </div>
              <div className="flex items-start gap-3">
                <div className="flex-shrink-0 w-6 h-6 rounded-full bg-primary text-primary-foreground flex items-center justify-center text-sm font-bold">
                  3
                </div>
                <p className="text-sm pt-0.5">{t.tutorialStep3}</p>
              </div>
              <div className="flex items-start gap-3">
                <div className="flex-shrink-0 w-6 h-6 rounded-full bg-primary text-primary-foreground flex items-center justify-center text-sm font-bold">
                  4
                </div>
                <p className="text-sm pt-0.5">{t.tutorialStep4}</p>
              </div>
              <div className="flex items-start gap-3">
                <div className="flex-shrink-0 w-6 h-6 rounded-full bg-primary text-primary-foreground flex items-center justify-center text-sm font-bold">
                  5
                </div>
                <p className="text-sm pt-0.5">{t.tutorialStep5}</p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
