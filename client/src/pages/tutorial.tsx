import { useState } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Badge } from "@/components/ui/badge";
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

interface TutorialStep {
  title: string;
  description: string;
  tips?: string[];
}

interface Tutorial {
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
  const { t } = useLanguage();
  const [selectedTutorial, setSelectedTutorial] = useState<Tutorial | null>(null);

  const tutorials: Tutorial[] = [
    {
      icon: ShoppingCart,
      title: t.tutorialPOS,
      description: t.tutorialPOSDesc,
      gradient: "from-emerald-500 to-teal-500",
      image: posImage,
      screenshot: posScreenshot,
      estimatedTime: "5 minutes",
      steps: [
        {
          title: "Navigate to POS",
          description: "Click on 'POS' in the sidebar to access the Point of Sale system.",
          tips: ["The POS is your main interface for processing customer orders and payments"]
        },
        {
          title: "Select Menu Items",
          description: "Browse through the menu categories and click on items to add them to the current order. The items will appear in the order summary on the right side.",
          tips: ["You can add multiple quantities of the same item", "Daily stock availability is shown for each menu item"]
        },
        {
          title: "Set Table Number",
          description: "Click the table number selector and choose the table where the customer is seated. This helps with order organization and service.",
        },
        {
          title: "Review Order Details",
          description: "Check the order summary showing all items, quantities, individual prices, subtotal, 15% VAT, and total amount in SAR.",
          tips: ["All prices include 15% VAT as per Saudi regulations", "You can remove items before finalizing"]
        },
        {
          title: "Process Payment",
          description: "Select the payment method (Cash or Card) and click 'Complete Order' to process the transaction and print the receipt.",
          tips: ["ZATCA-compliant receipts are automatically generated", "Orders are immediately sent to the kitchen display"]
        }
      ]
    },
    {
      icon: Package,
      title: t.tutorialInventory,
      description: t.tutorialInventoryDesc,
      gradient: "from-blue-500 to-indigo-500",
      image: inventoryImage,
      screenshot: inventoryScreenshot,
      estimatedTime: "7 minutes",
      steps: [
        {
          title: "Access Inventory Page",
          description: "Navigate to 'Inventory' from the sidebar menu to view all your ingredient stock levels.",
        },
        {
          title: "Add New Ingredients",
          description: "Click 'Add Inventory Item' button, enter the ingredient name, initial quantity, unit (kg, liters, pieces), and reorder level. Click Save.",
          tips: ["Set appropriate reorder levels to avoid stockouts", "Units should match your procurement practices"]
        },
        {
          title: "Monitor Stock Levels",
          description: "The inventory table shows current stock with color-coded status indicators: green (sufficient), yellow (low), red (critical).",
          tips: ["Low stock items trigger automatic alerts", "Filter by status to quickly find items needing reorder"]
        },
        {
          title: "Import/Export Data",
          description: "Use 'Import from Excel' to bulk upload inventory items, or 'Export to Excel' to download current stock data for analysis.",
          tips: ["Excel import saves time for initial setup", "Regular exports help with supplier ordering"]
        },
        {
          title: "Drag to Reorder",
          description: "When no filters are active, you can drag and drop items to customize your preferred display order for easier access.",
          tips: ["Organize by usage frequency", "Drag handles appear when filters are cleared"]
        }
      ]
    },
    {
      icon: UtensilsCrossed,
      title: t.tutorialMenu,
      description: t.tutorialMenuDesc,
      gradient: "from-green-500 to-emerald-500",
      image: menuImage,
      screenshot: menuScreenshot,
      estimatedTime: "6 minutes",
      steps: [
        {
          title: "Open Menu Management",
          description: "Click 'Menu' in the sidebar to access your restaurant's menu items.",
        },
        {
          title: "Create New Menu Item",
          description: "Click 'Add Menu Item', enter item name, category, base price (system will automatically add 15% VAT), description, and upload an image.",
          tips: ["High-quality images increase customer appeal", "Categories help organize your menu"]
        },
        {
          title: "Set Discounts",
          description: "For promotional items, you can set a discount percentage. The system will calculate the final price including VAT automatically.",
          tips: ["Discount badges are displayed prominently", "Final prices always include 15% VAT"]
        },
        {
          title: "Link to Recipes",
          description: "Associate menu items with recipes to enable automatic stock tracking and cost calculation based on ingredient usage.",
          tips: ["This enables daily stock predictions on POS", "Helps with accurate profitability analysis"]
        },
        {
          title: "Filter and Search",
          description: "Use the category filter and search bar to quickly find specific menu items for editing or review.",
        }
      ]
    },
    {
      icon: ChefHat,
      title: t.tutorialRecipes,
      description: t.tutorialRecipesDesc,
      gradient: "from-yellow-500 to-orange-500",
      image: recipesImage,
      screenshot: recipeScreenshot,
      estimatedTime: "8 minutes",
      steps: [
        {
          title: "Navigate to Recipes",
          description: "Click 'Recipes' in the sidebar to manage your dish recipes and ingredient requirements.",
        },
        {
          title: "Create New Recipe",
          description: "Click 'Add Recipe' and enter the recipe name (e.g., 'Chicken Biryani').",
        },
        {
          title: "Add Ingredients",
          description: "Click 'Add Ingredient' for each component. Select the ingredient from your inventory and specify the quantity needed per serving.",
          tips: ["Ingredients must exist in your Inventory first", "Quantities should be per single serving"]
        },
        {
          title: "Review Cost Calculation",
          description: "The system automatically calculates the total recipe cost based on current ingredient prices from inventory. This helps with pricing decisions.",
          tips: ["Cost updates automatically when ingredient prices change", "Use this for profitability analysis"]
        },
        {
          title: "Reorder Ingredients",
          description: "Use drag and drop to organize ingredient order in the recipe list for better workflow in the kitchen.",
          tips: ["Long-press (250ms) to activate drag on mobile", "Organize by preparation sequence"]
        }
      ]
    },
    {
      icon: UserCircle,
      title: t.tutorialCustomers,
      description: t.tutorialCustomersDesc,
      gradient: "from-cyan-500 to-blue-500",
      image: customersImage,
      screenshot: customerScreenshot,
      estimatedTime: "5 minutes",
      steps: [
        {
          title: "Open Customer Database",
          description: "Click 'Customers' in the sidebar to view and manage your customer information.",
        },
        {
          title: "Add New Customer",
          description: "Click 'Add Customer', enter name, phone number, email (optional), and any notes. Click Save to create the customer profile.",
          tips: ["Phone numbers enable quick lookup for repeat customers", "Customer history helps personalize service"]
        },
        {
          title: "View Customer Metrics",
          description: "The customer table shows total orders, total amount spent, loyalty points, and registration date for each customer.",
          tips: ["Sort by total spent to identify VIP customers", "Use loyalty points for retention programs"]
        },
        {
          title: "Search Customers",
          description: "Use the search bar to quickly find customers by name, phone, or email when taking orders.",
        },
        {
          title: "Track Loyalty Points",
          description: "Points accumulate automatically based on purchase amount and can be used for rewards and promotions.",
        }
      ]
    },
    {
      icon: ClipboardList,
      title: t.tutorialOrders,
      description: t.tutorialOrdersDesc,
      gradient: "from-blue-500 to-cyan-500",
      image: ordersImage,
      screenshot: orderScreenshot,
      estimatedTime: "5 minutes",
      steps: [
        {
          title: "Access Orders Dashboard",
          description: "Click 'Orders' in the sidebar to view all recent and historical orders.",
        },
        {
          title: "Monitor Order Status",
          description: "Track orders through different stages: Pending (yellow), In Progress (blue), and Completed (green). Status updates automatically.",
          tips: ["Kitchen staff can update status from kitchen display", "Real-time updates improve service coordination"]
        },
        {
          title: "View Order Details",
          description: "Click on any order to see complete details: items ordered, quantities, prices, table number, payment method, and timestamp.",
        },
        {
          title: "Filter Orders",
          description: "Use filters to view orders by status, date range, or table number for efficient order management and reporting.",
        },
        {
          title: "Kitchen Integration",
          description: "Orders automatically appear on the kitchen display system, showing item priorities and preparation requirements.",
        }
      ]
    },
    {
      icon: BarChart3,
      title: t.tutorialDashboard,
      description: t.tutorialDashboardDesc,
      gradient: "from-purple-500 to-pink-500",
      image: dashboardImage,
      screenshot: analyticsScreenshot,
      estimatedTime: "6 minutes",
      steps: [
        {
          title: "Open Analytics Dashboard",
          description: "Click 'Dashboard' in the sidebar to access your comprehensive business analytics overview.",
        },
        {
          title: "Review Performance Metrics",
          description: "View key metrics with Day-over-Day (DoD), Week-over-Week (WoW), Month-over-Month (MoM), and Year-over-Year (YoY) comparisons.",
          tips: ["Green indicators show growth, red shows decline", "Use trends to identify patterns and opportunities"]
        },
        {
          title: "Analyze Peak Hours",
          description: "Study the peak hours chart to understand when your restaurant is busiest. Click through for detailed customer drill-down.",
          tips: ["Optimize staffing based on peak hours", "Plan promotions for slow periods"]
        },
        {
          title: "Top Selling Items",
          description: "See which menu items are most popular to inform inventory planning and menu optimization decisions.",
        },
        {
          title: "Revenue Trends",
          description: "Review revenue charts showing daily, weekly, and monthly patterns to track business growth and seasonality.",
        }
      ]
    },
    {
      icon: DollarSign,
      title: t.tutorialSales,
      description: t.tutorialSalesDesc,
      gradient: "from-green-500 to-teal-500",
      image: salesImage,
      screenshot: salesScreenshot,
      estimatedTime: "6 minutes",
      steps: [
        {
          title: "Navigate to Sales Analytics",
          description: "Click 'Sales' in the sidebar to access detailed sales reports and analysis.",
        },
        {
          title: "Revenue Breakdown",
          description: "View revenue segmented by category (appetizers, mains, desserts, beverages) to understand your revenue mix.",
          tips: ["Identify high-margin categories", "Balance menu offerings based on revenue contribution"]
        },
        {
          title: "Payment Methods Analysis",
          description: "See the distribution of cash vs card payments to optimize your payment processing systems.",
        },
        {
          title: "Hourly Sales Heatmap",
          description: "Visual heatmap shows sales intensity by hour and day of week, helping identify optimal operating hours.",
          tips: ["Use this data for staff scheduling", "Plan marketing campaigns for slow hours"]
        },
        {
          title: "Export Reports",
          description: "Click 'Export to PDF' or 'Export to Excel' to download sales reports for accounting or further analysis.",
        }
      ]
    },
    {
      icon: Calculator,
      title: t.tutorialProfitability,
      description: t.tutorialProfitabilityDesc,
      gradient: "from-amber-500 to-orange-500",
      image: profitabilityImage,
      screenshot: profitabilityScreenshot,
      estimatedTime: "8 minutes",
      steps: [
        {
          title: "Open Profitability Analysis",
          description: "Click 'Profitability' in the sidebar to access comprehensive profit margin analysis and strategic insights.",
        },
        {
          title: "Strategic Overview Tab",
          description: "Review overall profitability metrics, gross margin, net margin, and operating expenses to understand business health.",
          tips: ["Track margins over time to identify trends", "Compare to industry benchmarks"]
        },
        {
          title: "Pricing Analysis",
          description: "Examine price coverage analysis showing which menu items have healthy margins and which need price adjustments.",
          tips: ["Items with low margins may need repricing", "High-margin items can be promoted more"]
        },
        {
          title: "Scaling Viability",
          description: "Assess which dishes are most profitable and scalable for potential expansion or franchise opportunities.",
        },
        {
          title: "Cost Management",
          description: "Analyze cost breakdowns including ingredient costs, labor (employee salaries), and shop bills to identify cost-saving opportunities.",
          tips: ["Regular cost reviews prevent profit erosion", "Track shop bills and salaries separately"]
        }
      ]
    },
    {
      icon: TrendingUp,
      title: t.tutorialForecasting,
      description: t.tutorialForecastingDesc,
      gradient: "from-cyan-500 to-sky-500",
      image: forecastingImage,
      screenshot: forecastingScreenshot,
      estimatedTime: "6 minutes",
      steps: [
        {
          title: "Access Demand Forecasting",
          description: "Click 'Forecasting' in the sidebar to view AI-powered demand predictions for your menu items.",
        },
        {
          title: "Review Daily Predictions",
          description: "See predicted demand for each menu item for upcoming days, based on historical sales patterns and trends.",
          tips: ["Use predictions for inventory planning", "Reduce waste by preparing appropriate quantities"]
        },
        {
          title: "Historical vs Forecast",
          description: "Compare historical sales data with future predictions on interactive line graphs to understand demand patterns.",
        },
        {
          title: "Confidence Levels",
          description: "Each forecast shows a confidence level indicating prediction reliability. Higher confidence means more reliable forecasts.",
          tips: ["New items have lower confidence initially", "Confidence improves with more sales history"]
        },
        {
          title: "Adjust Inventory",
          description: "Use forecast data to optimize ingredient ordering and reduce both waste and stockouts.",
        }
      ]
    },
    {
      icon: FileCheck,
      title: t.tutorialInvoices,
      description: t.tutorialInvoicesDesc,
      gradient: "from-violet-500 to-purple-500",
      image: invoicesImage,
      screenshot: invoiceScreenshot,
      estimatedTime: "5 minutes",
      steps: [
        {
          title: "Navigate to Invoices",
          description: "Click 'Invoices' in the sidebar to access all ZATCA-compliant invoices generated from your transactions.",
        },
        {
          title: "Invoice Details",
          description: "Each invoice includes: bilingual Arabic-English headers, invoice number, QR code, customer details, itemized products with VAT breakdown, and totals in SAR.",
          tips: ["All invoices are ZATCA-compliant by default", "QR codes enable digital verification"]
        },
        {
          title: "VAT Breakdown",
          description: "Invoices clearly show subtotal, 15% VAT amount, and total. VAT compliance is automated for Saudi regulations.",
          tips: ["VAT is calculated and displayed on every transaction", "Meets all Saudi tax authority requirements"]
        },
        {
          title: "Search and Filter",
          description: "Use search bar to find specific invoices by invoice number, customer name, or date range.",
        },
        {
          title: "Download Invoices",
          description: "Click the download button to get a PDF copy of any invoice for customer records or accounting purposes.",
          tips: ["PDFs are professionally formatted", "Suitable for email or printing"]
        }
      ]
    },
    {
      icon: Receipt,
      title: t.tutorialFinancial,
      description: t.tutorialFinancialDesc,
      gradient: "from-blue-500 to-purple-500",
      image: financialImage,
      screenshot: financialScreenshot,
      estimatedTime: "7 minutes",
      steps: [
        {
          title: "Open Financial Reports",
          description: "Click 'Financial' in the sidebar to access comprehensive profit & loss statements and expense tracking.",
        },
        {
          title: "Profit & Loss Statement",
          description: "Review detailed P&L showing total revenue, cost of goods sold, gross profit, operating expenses, and net profit.",
          tips: ["Use for monthly/quarterly business reviews", "Track profit margins over time"]
        },
        {
          title: "Expense Categories",
          description: "Track expenses by category: employee salaries, shop bills (rent, utilities, supplies), ingredient costs, and other operational costs.",
          tips: ["Regular expense review prevents budget overruns", "Categorization helps identify cost-saving areas"]
        },
        {
          title: "Revenue Summaries",
          description: "View revenue breakdowns by period (daily, weekly, monthly) with comparison to previous periods.",
        },
        {
          title: "Export Financial Data",
          description: "Click 'Export to PDF' for shareable reports or 'Export to Excel' for detailed financial analysis and accounting software integration.",
          tips: ["Share PDF reports with accountants or investors", "Excel export enables custom analysis"]
        }
      ]
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
          <div className="flex items-center gap-2 px-3 py-2 bg-blue-50 dark:bg-blue-950/30 border border-blue-200 dark:border-blue-800 rounded-lg">
            <BookOpenCheck className="h-4 w-4 text-blue-600 dark:text-blue-400 flex-shrink-0" />
            <p className="text-xs text-blue-700 dark:text-blue-300">
              Detailed step-by-step guides are currently available in English. UI elements respect your selected language.
            </p>
          </div>
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
                  Estimated time: {selectedTutorial?.estimatedTime}
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
                  Step-by-Step Guide
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
