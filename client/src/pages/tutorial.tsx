import { useState } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
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
  FileCheck,
  PlayCircle
} from "lucide-react";

import posImage from "@assets/generated_images/POS_System_Interface_a1bc794e.png";
import inventoryImage from "@assets/generated_images/Inventory_Management_System_f84dcc3a.png";
import menuImage from "@assets/generated_images/Restaurant_Menu_Display_b812c237.png";
import recipesImage from "@assets/generated_images/Recipe_Preparation_Kitchen_c2b136e5.png";
import customersImage from "@assets/generated_images/Happy_Restaurant_Customers_4b909963.png";
import ordersImage from "@assets/generated_images/Order_Management_Display_4049f259.png";
import dashboardImage from "@assets/generated_images/Business_Analytics_Dashboard_3301d762.png";
import salesImage from "@assets/generated_images/Sales_and_Payment_System_5634d834.png";
import profitabilityImage from "@assets/generated_images/Profitability_Analysis_Setup_1bed8640.png";
import forecastingImage from "@assets/generated_images/Business_Forecasting_Analytics_6bf96b65.png";
import invoicesImage from "@assets/generated_images/Invoice_Documents_37f6d13b.png";
import financialImage from "@assets/generated_images/Financial_Reports_Display_af93422d.png";

export default function Tutorial() {
  const { t } = useLanguage();
  const [selectedVideo, setSelectedVideo] = useState<{ title: string; videoUrl: string } | null>(null);

  const tutorials = [
    {
      icon: ShoppingCart,
      title: t.tutorialPOS,
      description: t.tutorialPOSDesc,
      gradient: "from-emerald-500 to-teal-500",
      image: posImage,
      videoUrl: "https://www.youtube.com/embed/dQw4w9WgXcQ"
    },
    {
      icon: Package,
      title: t.tutorialInventory,
      description: t.tutorialInventoryDesc,
      gradient: "from-blue-500 to-indigo-500",
      image: inventoryImage,
      videoUrl: "https://www.youtube.com/embed/dQw4w9WgXcQ"
    },
    {
      icon: UtensilsCrossed,
      title: t.tutorialMenu,
      description: t.tutorialMenuDesc,
      gradient: "from-green-500 to-emerald-500",
      image: menuImage,
      videoUrl: "https://www.youtube.com/embed/dQw4w9WgXcQ"
    },
    {
      icon: ChefHat,
      title: t.tutorialRecipes,
      description: t.tutorialRecipesDesc,
      gradient: "from-yellow-500 to-orange-500",
      image: recipesImage,
      videoUrl: "https://www.youtube.com/embed/dQw4w9WgXcQ"
    },
    {
      icon: UserCircle,
      title: t.tutorialCustomers,
      description: t.tutorialCustomersDesc,
      gradient: "from-cyan-500 to-blue-500",
      image: customersImage,
      videoUrl: "https://www.youtube.com/embed/dQw4w9WgXcQ"
    },
    {
      icon: ClipboardList,
      title: t.tutorialOrders,
      description: t.tutorialOrdersDesc,
      gradient: "from-blue-500 to-cyan-500",
      image: ordersImage,
      videoUrl: "https://www.youtube.com/embed/dQw4w9WgXcQ"
    },
    {
      icon: BarChart3,
      title: t.tutorialDashboard,
      description: t.tutorialDashboardDesc,
      gradient: "from-purple-500 to-pink-500",
      image: dashboardImage,
      videoUrl: "https://www.youtube.com/embed/dQw4w9WgXcQ"
    },
    {
      icon: DollarSign,
      title: t.tutorialSales,
      description: t.tutorialSalesDesc,
      gradient: "from-green-500 to-teal-500",
      image: salesImage,
      videoUrl: "https://www.youtube.com/embed/dQw4w9WgXcQ"
    },
    {
      icon: Calculator,
      title: t.tutorialProfitability,
      description: t.tutorialProfitabilityDesc,
      gradient: "from-amber-500 to-orange-500",
      image: profitabilityImage,
      videoUrl: "https://www.youtube.com/embed/dQw4w9WgXcQ"
    },
    {
      icon: TrendingUp,
      title: t.tutorialForecasting,
      description: t.tutorialForecastingDesc,
      gradient: "from-cyan-500 to-sky-500",
      image: forecastingImage,
      videoUrl: "https://www.youtube.com/embed/dQw4w9WgXcQ"
    },
    {
      icon: FileCheck,
      title: t.tutorialInvoices,
      description: t.tutorialInvoicesDesc,
      gradient: "from-violet-500 to-purple-500",
      image: invoicesImage,
      videoUrl: "https://www.youtube.com/embed/dQw4w9WgXcQ"
    },
    {
      icon: Receipt,
      title: t.tutorialFinancial,
      description: t.tutorialFinancialDesc,
      gradient: "from-blue-500 to-purple-500",
      image: financialImage,
      videoUrl: "https://www.youtube.com/embed/dQw4w9WgXcQ"
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
            <Card 
              key={index} 
              className="hover-elevate group transition-all duration-300 overflow-hidden cursor-pointer" 
              data-testid={`card-tutorial-${index}`}
              onClick={() => setSelectedVideo({ title: tutorial.title, videoUrl: tutorial.videoUrl })}
            >
              <div className="relative h-48 overflow-hidden">
                <img 
                  src={tutorial.image} 
                  alt={tutorial.title}
                  className="w-full h-full object-cover transition-transform duration-300 group-hover:scale-105"
                />
                <div className={`absolute bottom-0 left-0 right-0 h-16 bg-gradient-to-t ${tutorial.gradient} opacity-80`} />
                <div className={`absolute bottom-3 left-3 p-2 rounded-lg bg-gradient-to-r ${tutorial.gradient}`}>
                  <tutorial.icon className="h-5 w-5 text-white" />
                </div>
                <div className="absolute inset-0 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity bg-black/30">
                  <div className="p-4 rounded-full bg-white/20 backdrop-blur-sm">
                    <PlayCircle className="h-12 w-12 text-white" />
                  </div>
                </div>
              </div>
              <CardHeader>
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

      <Dialog open={!!selectedVideo} onOpenChange={() => setSelectedVideo(null)}>
        <DialogContent className="max-w-4xl w-full p-0">
          <DialogHeader className="p-6 pb-4">
            <DialogTitle className="text-2xl font-bold">{selectedVideo?.title}</DialogTitle>
          </DialogHeader>
          <div className="relative w-full" style={{ paddingBottom: '56.25%' }}>
            <iframe
              src={selectedVideo?.videoUrl}
              title={selectedVideo?.title}
              className="absolute top-0 left-0 w-full h-full rounded-b-lg"
              allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
              allowFullScreen
              data-testid="video-iframe"
            />
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}
