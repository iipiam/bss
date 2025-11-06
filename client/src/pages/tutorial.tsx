import { useState } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Badge } from "@/components/ui/badge";
import { useLanguage } from "@/contexts/LanguageContext";
import { getTutorialsByLanguage } from "@/i18n/tutorialSteps";
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
  BookOpenCheck,
  CheckCircle2
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

import posScreenshot from "@assets/generated_images/POS_system_interface_screenshot_7e5ae849.png";
import inventoryScreenshot from "@assets/generated_images/Inventory_management_dashboard_screenshot_918ba2b2.png";
import menuScreenshot from "@assets/generated_images/Menu_management_interface_screenshot_b8294dd3.png";
import recipeScreenshot from "@assets/generated_images/Recipe_creation_interface_screenshot_e67a7aa1.png";
import customerScreenshot from "@assets/generated_images/Customer_management_database_screenshot_7965bb5e.png";
import orderScreenshot from "@assets/generated_images/Orders_tracking_dashboard_screenshot_f0d2e3a1.png";
import analyticsScreenshot from "@assets/generated_images/Analytics_dashboard_screenshot_2b42f16c.png";
import salesScreenshot from "@assets/generated_images/Sales_analytics_page_screenshot_1b3c0414.png";
import profitabilityScreenshot from "@assets/generated_images/Profitability_analysis_dashboard_screenshot_2a18aab4.png";
import forecastingScreenshot from "@assets/generated_images/Demand_forecasting_interface_screenshot_025a6451.png";
import invoiceScreenshot from "@assets/generated_images/ZATCA_invoice_document_screenshot_54e402f8.png";
import financialScreenshot from "@assets/generated_images/Financial_reports_dashboard_screenshot_9884d372.png";

export interface TutorialStep {
  title: string;
  description: string;
  tips?: string[];
}

export interface Tutorial {
  icon: any;
  title: string;
  description: string;
  gradient: string;
  image: string;
  screenshot: string;
  steps: TutorialStep[];
  estimatedTime: string;
}

export default function Tutorial() {
  const { t, language } = useLanguage();
  const [selectedTutorial, setSelectedTutorial] = useState<Tutorial | null>(null);

  // Map language names to codes for tutorial content
  const languageCodeMap: Record<string, 'en' | 'ar' | 'zh' | 'de' | 'hi' | 'ur' | 'bn'> = {
    'English': 'en',
    'Arabic': 'ar',
    'Chinese': 'zh',
    'German': 'de',
    'Hindi': 'hi',
    'Urdu': 'ur',
    'Bengali': 'bn'
  };

  // Get tutorials in the user's selected language
  const languageCode = languageCodeMap[language] || 'en';
  const tutorials: Tutorial[] = getTutorialsByLanguage(languageCode, t);
  
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
              onClick={() => setSelectedTutorial(tutorial)}
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
                    <BookOpenCheck className="h-12 w-12 text-white" />
                  </div>
                </div>
              </div>
              <CardHeader>
                <div className="flex items-center justify-between gap-2">
                  <CardTitle className="text-lg">{tutorial.title}</CardTitle>
                  <Badge variant="secondary" className="text-xs">
                    {tutorial.estimatedTime}
                  </Badge>
                </div>
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

      <Dialog open={!!selectedTutorial} onOpenChange={() => setSelectedTutorial(null)}>
        <DialogContent className="max-w-5xl max-h-[90vh] p-0">
          <DialogHeader className="p-6 pb-4 border-b">
            <div className="flex items-center gap-3">
              {selectedTutorial && (
                <div className={`p-2 rounded-lg bg-gradient-to-r ${selectedTutorial.gradient}`}>
                  <selectedTutorial.icon className="h-5 w-5 text-white" />
                </div>
              )}
              <div className="flex-1">
                <DialogTitle className="text-2xl font-bold">{selectedTutorial?.title}</DialogTitle>
                <p className="text-sm text-muted-foreground mt-1">
                  {t.tutorialEstimatedTime}: {selectedTutorial?.estimatedTime}
                </p>
              </div>
            </div>
          </DialogHeader>
          
          <ScrollArea className="max-h-[calc(90vh-120px)]">
            <div className="p-6 space-y-6">
              <div className="rounded-lg overflow-hidden border">
                <img 
                  src={selectedTutorial?.screenshot} 
                  alt={selectedTutorial?.title}
                  className="w-full h-auto"
                />
              </div>

              <div className="space-y-4">
                <h3 className="text-lg font-semibold flex items-center gap-2">
                  <BookOpen className="h-5 w-5" />
                  {t.tutorialStepByStepGuide}
                </h3>
                
                <div className="space-y-4">
                  {selectedTutorial?.steps.map((step, index) => (
                    <Card key={index} className="overflow-hidden">
                      <CardHeader className="pb-3">
                        <div className="flex items-start gap-3">
                          <div className="flex-shrink-0 w-8 h-8 rounded-full bg-primary text-primary-foreground flex items-center justify-center text-sm font-bold">
                            {index + 1}
                          </div>
                          <div className="flex-1">
                            <CardTitle className="text-base">{step.title}</CardTitle>
                          </div>
                        </div>
                      </CardHeader>
                      <CardContent className="pt-0 pl-14 space-y-3">
                        <p className="text-sm text-muted-foreground leading-relaxed">
                          {step.description}
                        </p>
                        
                        {step.tips && step.tips.length > 0 && (
                          <div className="space-y-2">
                            <p className="text-xs font-medium text-primary flex items-center gap-1">
                              <CheckCircle2 className="h-3.5 w-3.5" />
                              Pro Tips:
                            </p>
                            <ul className="space-y-1">
                              {step.tips.map((tip, tipIndex) => (
                                <li key={tipIndex} className="text-xs text-muted-foreground flex items-start gap-2">
                                  <span className="text-primary mt-0.5">•</span>
                                  <span>{tip}</span>
                                </li>
                              ))}
                            </ul>
                          </div>
                        )}
                      </CardContent>
                    </Card>
                  ))}
                </div>
              </div>
            </div>
          </ScrollArea>
        </DialogContent>
      </Dialog>
    </div>
  );
}
