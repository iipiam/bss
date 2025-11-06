import type { Tutorial, TutorialStep } from "@/pages/tutorial";
import {
  ShoppingCart,
  Package,
  UtensilsCrossed,
  ChefHat,
  UserCircle,
  ClipboardList,
  BarChart3,
  DollarSign,
  Calculator,
  TrendingUp,
  FileCheck,
  Receipt,
  Truck
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
import deliveryAppsImage from "@assets/generated_images/Delivery_App_Management_Dashboard_af536108.png";

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
import deliveryAppsScreenshot from "@assets/generated_images/Delivery_Apps_Analytics_Screenshot_8961352b.png";

type Language = 'en' | 'ar' | 'zh' | 'de' | 'hi' | 'ur' | 'bn';

const tutorialMetadata = {
  icons: [ShoppingCart, Package, UtensilsCrossed, ChefHat, UserCircle, ClipboardList, BarChart3, DollarSign, Calculator, TrendingUp, FileCheck, Receipt, Truck],
  images: [posImage, inventoryImage, menuImage, recipesImage, customersImage, ordersImage, dashboardImage, salesImage, profitabilityImage, forecastingImage, invoicesImage, financialImage, deliveryAppsImage],
  screenshots: [posScreenshot, inventoryScreenshot, menuScreenshot, recipeScreenshot, customerScreenshot, orderScreenshot, analyticsScreenshot, salesScreenshot, profitabilityScreenshot, forecastingScreenshot, invoiceScreenshot, financialScreenshot, deliveryAppsScreenshot],
  gradients: [
    "from-emerald-500 to-teal-500",
    "from-blue-500 to-indigo-500",
    "from-green-500 to-emerald-500",
    "from-yellow-500 to-orange-500",
    "from-cyan-500 to-blue-500",
    "from-purple-500 to-pink-500",
    "from-purple-500 to-violet-500",
    "from-green-500 to-teal-500",
    "from-amber-500 to-orange-500",
    "from-cyan-500 to-sky-500",
    "from-violet-500 to-purple-500",
    "from-blue-500 to-purple-500",
    "from-orange-500 to-red-500"
  ]
};

export const getTutorialsByLanguage = (language: Language, t: any): Tutorial[] => {
  const content = tutorialContent[language] || tutorialContent.en;
  
  return content.map((tutorial, index) => ({
    ...tutorial,
    icon: tutorialMetadata.icons[index],
    image: tutorialMetadata.images[index],
    screenshot: tutorialMetadata.screenshots[index],
    gradient: tutorialMetadata.gradients[index]
  }));
};

const tutorialContent: Record<Language, Omit<Tutorial, 'icon' | 'image' | 'screenshot' | 'gradient'>[]> = {
  en: [
    {
      title: "Point of Sale (POS)",
      description: "Learn how to process sales transactions, manage orders, and generate ZATCA-compliant invoices.",
      estimatedTime: "5 minutes",
      steps: [
        { title: "Navigate to POS", description: "Click on 'POS' in the sidebar to access the Point of Sale system.", tips: ["The POS is your main interface for processing customer orders and payments"] },
        { title: "Select Menu Items", description: "Browse through the menu categories and click on items to add them to the current order. The items will appear in the order summary on the right side.", tips: ["You can add multiple quantities of the same item", "Daily stock availability is shown for each menu item"] },
        { title: "Set Table Number", description: "Click the table number selector and choose the table where the customer is seated. This helps with order organization and service." },
        { title: "Review Order Details", description: "Check the order summary showing all items, quantities, individual prices, subtotal, 15% VAT, and total amount in SAR.", tips: ["All prices include 15% VAT as per Saudi regulations", "You can remove items before finalizing"] },
        { title: "Process Payment", description: "Select the payment method (Cash or Card) and click 'Complete Order' to process the transaction and print the receipt.", tips: ["ZATCA-compliant receipts are automatically generated", "Orders are immediately sent to the kitchen display"] }
      ]
    },
    {
      title: "Inventory Management",
      description: "Track stock levels, manage ingredients, and receive low-stock alerts with Excel import/export support.",
      estimatedTime: "7 minutes",
      steps: [
        { title: "Access Inventory Page", description: "Navigate to 'Inventory' from the sidebar menu to view all your ingredient stock levels." },
        { title: "Add New Ingredients", description: "Click 'Add Inventory Item' button, enter the ingredient name, initial quantity, unit (kg, liters, pieces), and reorder level. Click Save.", tips: ["Set appropriate reorder levels to avoid stockouts", "Units should match your procurement practices"] },
        { title: "Monitor Stock Levels", description: "The inventory table shows current stock with color-coded status indicators: green (sufficient), yellow (low), red (critical).", tips: ["Low stock items trigger automatic alerts", "Filter by status to quickly find items needing reorder"] },
        { title: "Import/Export Data", description: "Use 'Import from Excel' to bulk upload inventory items, or 'Export to Excel' to download current stock data for analysis.", tips: ["Excel import saves time for initial setup", "Regular exports help with supplier ordering"] },
        { title: "Drag to Reorder", description: "When no filters are active, you can drag and drop items to customize your preferred display order for easier access.", tips: ["Organize by usage frequency", "Drag handles appear when filters are cleared"] }
      ]
    },
    {
      title: "Menu Management",
      description: "Create menu items with VAT-inclusive pricing, link to recipes, and manage availability.",
      estimatedTime: "6 minutes",
      steps: [
        { title: "Navigate to Menu", description: "Click 'Menu' in the sidebar to access menu item management.", tips: ["Menu items link to recipes for automatic cost calculation"] },
        { title: "Create Menu Item", description: "Click 'Add Menu Item', enter name, category, base price (VAT included), and optionally link to a recipe.", tips: ["Base price automatically includes 15% VAT", "Linking recipes enables profit margin analysis"] },
        { title: "Set Discounts", description: "Enter a discount percentage if running a promotion. The final price is calculated automatically.", tips: ["Discounts help boost sales of specific items"] },
        { title: "Upload Image", description: "Add an appealing photo of the dish to enhance the menu presentation.", tips: ["High-quality images increase customer interest"] },
        { title: "Toggle Availability", description: "Use the availability switch to show/hide items from POS based on ingredient stock or seasonal changes.", tips: ["Disable items when key ingredients run out"] },
        { title: "Drag to Reorder", description: "Drag menu items to set the display order in the POS system.", tips: ["Place popular items first for faster order processing"] }
      ]
    },
    {
      title: "Recipe Management",
      description: "Define recipes with ingredients, track costs automatically, and optimize profitability.",
      estimatedTime: "8 minutes",
      steps: [
        { title: "Access Recipes", description: "Click 'Recipes' in the sidebar to view and manage all your dish recipes.", tips: ["Recipes link menu items to inventory for cost tracking"] },
        { title: "Create New Recipe", description: "Click 'Add Recipe', enter recipe name, preparation time, cooking time, and number of servings.", tips: ["Accurate timing helps with kitchen workflow planning"] },
        { title: "Add Ingredients", description: "Select inventory items and specify the quantity needed for each ingredient in the recipe.", tips: ["Use precise measurements for accurate cost calculations"] },
        { title: "Write Instructions", description: "Add step-by-step cooking instructions for kitchen staff to follow.", tips: ["Clear instructions ensure consistent dish quality"] },
        { title: "Review Cost", description: "The system automatically calculates total recipe cost based on current ingredient prices.", tips: ["Recipe cost updates when inventory prices change"] },
        { title: "Link to Menu", description: "When creating menu items, select this recipe to enable automatic cost and profit tracking.", tips: ["One recipe can be used for multiple menu variations"] },
        { title: "Update as Needed", description: "Adjust ingredient quantities as you refine recipes based on customer feedback.", tips: ["Regular updates ensure accurate profitability data"] },
        { title: "Drag to Reorder", description: "Drag recipes to organize them in your preferred order.", tips: ["Group similar recipes together for easier management"] }
      ]
    },
    {
      title: "Customer Management",
      description: "Build a customer database, track purchase history, and enhance customer relationships.",
      estimatedTime: "5 minutes",
      steps: [
        { title: "Access Customers", description: "Click 'Customers' in the sidebar to view your customer database.", tips: ["Customer data helps personalize service"] },
        { title: "Add New Customer", description: "Click 'Add Customer', enter name, email, phone, and address information.", tips: ["Collect customer info during first visit", "Respect privacy regulations"] },
        { title: "Search Customers", description: "Use the search bar to quickly find customers by name, email, or phone number.", tips: ["Quick search speeds up checkout process"] },
        { title: "View Purchase History", description: "Click on any customer to see their complete order history and preferences.", tips: ["Use history to offer personalized recommendations"] },
        { title: "Update Information", description: "Edit customer details as needed to keep contact information current.", tips: ["Regular updates improve communication"] }
      ]
    },
    {
      title: "Order Processing",
      description: "Manage customer orders from placement to delivery with kitchen coordination.",
      estimatedTime: "6 minutes",
      steps: [
        { title: "View All Orders", description: "Click 'Orders' in the sidebar to see all orders with their current status.", tips: ["Color-coded status helps identify urgent orders"] },
        { title: "Check Order Details", description: "Click any order to view items, quantities, table number, total amount, and timestamps.", tips: ["All order information is organized for quick review"] },
        { title: "Update Status", description: "Change order status: Pending → Preparing → Ready → Delivered as the order progresses.", tips: ["Status updates help coordinate kitchen and service staff"] },
        { title: "Filter Orders", description: "Use filters to view orders by status, date range, or table number for better organization.", tips: ["Date filters help analyze daily performance"] },
        { title: "Kitchen Display", description: "Switch to Kitchen Display mode to see active orders being prepared in real-time.", tips: ["Kitchen staff can mark items complete"] },
        { title: "Track Timing", description: "Monitor order completion times to identify and resolve kitchen bottlenecks.", tips: ["Faster order times improve customer satisfaction"] }
      ]
    },
    {
      title: "Analytics Dashboard",
      description: "Monitor business performance with Day-over-Day, Week-over-Week, Month-over-Month comparisons.",
      estimatedTime: "5 minutes",
      steps: [
        { title: "Open Dashboard", description: "Click 'Dashboard' in the sidebar to view your analytics overview.", tips: ["Dashboard provides real-time business insights"] },
        { title: "Review Key Metrics", description: "Check today's revenue, order count, average order value, and customer count.", tips: ["Compare with previous periods to track growth"] },
        { title: "Analyze Trends", description: "Review percentage changes (DoD, WoW, MoM, YoY) to identify growth patterns or issues.", tips: ["Green indicates positive trends, red shows areas needing attention"] },
        { title: "Check Peak Hours", description: "View the hourly sales chart to understand when your restaurant is busiest.", tips: ["Use peak hour data for staff scheduling"] },
        { title: "Monitor Top Items", description: "See which menu items are selling best to optimize inventory and promotions.", tips: ["Focus on high-performing items"] }
      ]
    },
    {
      title: "Sales Analytics",
      description: "Analyze sales by category, payment method, and time period with detailed reports.",
      estimatedTime: "6 minutes",
      steps: [
        { title: "Access Sales", description: "Click 'Sales' in the sidebar to open the sales analytics page.", tips: ["Sales data drives strategic decisions"] },
        { title: "Select Date Range", description: "Choose the time period you want to analyze using the date picker.", tips: ["Compare different periods to spot trends"] },
        { title: "View Revenue Charts", description: "Analyze revenue trends with visual charts showing daily, weekly, or monthly patterns.", tips: ["Charts make data easier to understand"] },
        { title: "Category Breakdown", description: "See which menu categories generate the most revenue and profit.", tips: ["Optimize menu based on category performance"] },
        { title: "Payment Methods", description: "Review the split between cash and card payments for financial planning.", tips: ["Track payment trends over time"] },
        { title: "Export Reports", description: "Generate and download detailed sales reports for accounting purposes.", tips: ["Regular exports support tax compliance"] }
      ]
    },
    {
      title: "Profitability Analysis",
      description: "Analyze profit margins, pricing strategy, and cost structure for data-driven decisions.",
      estimatedTime: "7 minutes",
      steps: [
        { title: "Open Profitability", description: "Click 'Profitability' in the sidebar to access profitability analysis tools.", tips: ["Understanding margins is crucial for growth"] },
        { title: "Strategic Overview", description: "Review overall profit margins, total revenue, and costs at a glance.", tips: ["Track margin trends over time"] },
        { title: "Pricing Analysis", description: "Click 'Pricing Analysis' tab to see detailed price coverage by profit margin ranges.", tips: ["Identify low-margin items needing repricing"] },
        { title: "Menu Item Analysis", description: "View profitability for each item including cost, price, margin %, and total profit.", tips: ["Sort by margin to find most/least profitable items"] },
        { title: "Cost Management", description: "Switch to 'Cost Management' tab to analyze ingredient costs and reduce waste.", tips: ["Better inventory management reduces costs"] },
        { title: "Scaling Viability", description: "Check 'Scaling Viability' tab to see which items are worth promoting.", tips: ["Focus on high-margin, high-volume items"] },
        { title: "Adjust Pricing", description: "Use insights to optimize menu prices and improve overall profitability.", tips: ["Small price changes can have big impact"] }
      ]
    },
    {
      title: "Demand Forecasting",
      description: "Predict future demand using historical data to optimize inventory and staffing.",
      estimatedTime: "5 minutes",
      steps: [
        { title: "Access Forecasting", description: "Click 'Forecasting' in the sidebar to view demand predictions.", tips: ["Forecasting reduces waste and stockouts"] },
        { title: "Select Future Date", description: "Choose the date you want to forecast demand for using the date picker.", tips: ["Daily forecasts optimize inventory purchases"] },
        { title: "Review Predictions", description: "See predicted quantities for each menu item based on historical sales patterns.", tips: ["Accuracy improves with more data"] },
        { title: "Plan Inventory", description: "Use forecasts to determine how much inventory to order from suppliers.", tips: ["Add safety margin for unexpected demand"] },
        { title: "Schedule Staff", description: "Forecast helps plan appropriate staffing levels for expected customer volume.", tips: ["Match staffing to predicted busy periods"] }
      ]
    },
    {
      title: "Invoice Management",
      description: "Access ZATCA-compliant bilingual invoices with QR codes and proper VAT calculation.",
      estimatedTime: "5 minutes",
      steps: [
        { title: "Open Invoices", description: "Click 'Invoices' in the sidebar to view all generated invoices.", tips: ["Invoices are auto-generated for every sale"] },
        { title: "Search Invoices", description: "Use the search box to find invoices by number, customer name, or date.", tips: ["Quick search helps with customer inquiries"] },
        { title: "View Invoice Details", description: "Click any invoice to see complete details: items, quantities, prices, VAT, and total.", tips: ["All invoices are ZATCA-compliant"] },
        { title: "Download PDF", description: "Click 'Download' to get the bilingual (Arabic/English) PDF invoice with QR code.", tips: ["QR codes enable digital verification"] },
        { title: "Verify Compliance", description: "Ensure invoice includes: VAT number, QR code, and bilingual text.", tips: ["Compliance is automatic"] }
      ]
    },
    {
      title: "Financial Reports",
      description: "Generate comprehensive financial statements with revenue, expenses, and profit/loss.",
      estimatedTime: "6 minutes",
      steps: [
        { title: "Access Financial", description: "Click 'Financial' in the sidebar to open financial reporting.", tips: ["Financial reports provide complete business overview"] },
        { title: "Select Period", description: "Choose the date range for your financial report using the date picker.", tips: ["Monthly reports track progress, yearly for taxes"] },
        { title: "Review Revenue", description: "See total revenue broken down by sales category and payment method.", tips: ["Compare revenue across periods"] },
        { title: "Check Expenses", description: "View all expenses including inventory, salaries, and shop bills.", tips: ["Categorized expenses reveal cost-saving opportunities"] },
        { title: "Profit & Loss", description: "Review net profit after all expenses are deducted from revenue.", tips: ["Monitor profit margins monthly"] },
        { title: "Export PDF", description: "Click 'Export PDF' to generate a professional financial statement.", tips: ["Share with accountants for tax filing"] }
      ]
    },
    {
      title: "Delivery Apps Management",
      description: "Configure delivery platforms, manage commissions with 15% VAT, track subsidy tiers, and analyze profitability across apps.",
      estimatedTime: "8 minutes",
      steps: [
        { title: "Access Delivery Apps", description: "Click 'Delivery Apps' in the sidebar to view all configured delivery platforms.", tips: ["Manage multiple platforms from one dashboard"] },
        { title: "Add Delivery Platform", description: "Click 'Add Delivery App', enter the platform name (UberEats, HungerStation, Jahez, etc.), commission percentage, banking fees percentage, and POS fees (SAR).", tips: ["All fees automatically include 15% VAT in calculations", "Commission formula: (Result1 + Result2 + Result3) × 1.15"] },
        { title: "Configure Subsidy Tiers", description: "Set up to 3 subsidy tiers with minimum/maximum order amounts and subsidy values. Subsidy is added to your net revenue.", tips: ["Tiers help manage platform promotions", "Maximum can be left empty for unlimited range", "Each tier must have minAmount < maxAmount"] },
        { title: "Enable/Disable Apps", description: "Use the 'Active' toggle to enable or disable delivery platforms without deleting their configuration.", tips: ["Disable apps during maintenance or contract changes"] },
        { title: "Track Orders by App", description: "View which orders came from each delivery platform in the Orders page using the delivery app filter.", tips: ["Track platform performance over time"] },
        { title: "Analyze Profitability", description: "Navigate to 'Profitability Analysis' under Analytics to compare revenue, costs (commission, banking fees, POS fees with VAT), and profit across all delivery apps.", tips: ["Charts show which platforms are most profitable", "View detailed cost breakdowns per app"] },
        { title: "Review Cost Formula", description: "Understand the cost calculation: Commission = (Price - Subsidy) × Commission%, Banking Fees = Price × Banking%, then Total = (Commission + Banking + POS) × 1.15 for VAT.", tips: ["Subsidy increases your net revenue", "All fees include 15% VAT automatically"] },
        { title: "Optimize Strategy", description: "Use profitability data to negotiate better rates or focus on the most profitable platforms.", tips: ["Compare item costs (COGS) against revenue", "Monitor profit margins per platform"] }
      ]
    }
  ],

  ar: [
    {
      title: "نقطة البيع",
      description: "تعلم كيفية معالجة معاملات البيع وإدارة الطلبات وإنشاء فواتير متوافقة مع هيئة الزكاة والضريبة.",
      estimatedTime: "5 دقائق",
      steps: [
        { title: "الانتقال إلى نقطة البيع", description: "انقر على 'نقطة البيع' في الشريط الجانبي للوصول إلى نظام نقطة البيع.", tips: ["نقطة البيع هي واجهتك الرئيسية لمعالجة طلبات ومدفوعات العملاء"] },
        { title: "اختيار عناصر القائمة", description: "تصفح فئات القائمة وانقر على العناصر لإضافتها إلى الطلب الحالي. ستظهر العناصر في ملخص الطلب على الجانب الأيمن.", tips: ["يمكنك إضافة كميات متعددة من نفس العنصر", "يتم عرض توفر المخزون اليومي لكل عنصر في القائمة"] },
        { title: "تعيين رقم الطاولة", description: "انقر على محدد رقم الطاولة واختر الطاولة التي يجلس عليها العميل. يساعد هذا في تنظيم الطلبات والخدمة." },
        { title: "مراجعة تفاصيل الطلب", description: "تحقق من ملخص الطلب الذي يظهر جميع العناصر والكميات والأسعار الفردية والمجموع الفرعي وضريبة القيمة المضافة 15٪ والمبلغ الإجمالي بالريال السعودي.", tips: ["جميع الأسعار تشمل ضريبة القيمة المضافة 15٪ وفقاً للوائح السعودية", "يمكنك إزالة العناصر قبل الإنهاء"] },
        { title: "معالجة الدفع", description: "حدد طريقة الدفع (نقدي أو بطاقة) وانقر على 'إكمال الطلب' لمعالجة المعاملة وطباعة الإيصال.", tips: ["يتم إنشاء إيصالات متوافقة مع هيئة الزكاة والضريبة تلقائياً", "يتم إرسال الطلبات فوراً إلى شاشة المطبخ"] }
      ]
    },
    {
      title: "إدارة المخزون",
      description: "تتبع مستويات المخزون وإدارة المكونات والحصول على تنبيهات انخفاض المخزون مع دعم استيراد/تصدير Excel.",
      estimatedTime: "7 دقائق",
      steps: [
        { title: "الوصول إلى صفحة المخزون", description: "انتقل إلى 'المخزون' من قائمة الشريط الجانبي لعرض جميع مستويات مخزون المكونات الخاصة بك." },
        { title: "إضافة مكونات جديدة", description: "انقر على زر 'إضافة عنصر مخزون'، أدخل اسم المكون والكمية الأولية والوحدة (كجم، لتر، قطعة) ومستوى إعادة الطلب. انقر على حفظ.", tips: ["حدد مستويات إعادة طلب مناسبة لتجنب نفاد المخزون", "يجب أن تتطابق الوحدات مع ممارسات الشراء الخاصة بك"] },
        { title: "مراقبة مستويات المخزون", description: "يعرض جدول المخزون المخزون الحالي مع مؤشرات حالة مرمزة بالألوان: أخضر (كافٍ)، أصفر (منخفض)، أحمر (حرج).", tips: ["عناصر المخزون المنخفض تؤدي إلى تنبيهات تلقائية", "قم بالتصفية حسب الحالة للعثور بسرعة على العناصر التي تحتاج إلى إعادة طلب"] },
        { title: "استيراد/تصدير البيانات", description: "استخدم 'استيراد من Excel' لتحميل عناصر المخزون بالجملة، أو 'تصدير إلى Excel' لتنزيل بيانات المخزون الحالية للتحليل.", tips: ["استيراد Excel يوفر الوقت للإعداد الأولي", "التصديرات المنتظمة تساعد في طلب الموردين"] },
        { title: "السحب لإعادة الترتيب", description: "عندما لا تكون هناك فلاتر نشطة، يمكنك سحب وإفلات العناصر لتخصيص ترتيب العرض المفضل لديك لسهولة الوصول.", tips: ["تنظيم حسب تكرار الاستخدام", "تظهر مقابض السحب عند مسح الفلاتر"] }
      ]
    },
    {
      title: "إدارة القائمة",
      description: "إنشاء عناصر القائمة بأسعار شاملة ضريبة القيمة المضافة والربط بالوصفات وإدارة التوفر.",
      estimatedTime: "6 دقائق",
      steps: [
        { title: "الانتقال إلى القائمة", description: "انقر على 'القائمة' في الشريط الجانبي للوصول إلى إدارة عناصر القائمة.", tips: ["عناصر القائمة ترتبط بالوصفات لحساب التكلفة التلقائي"] },
        { title: "إنشاء عنصر قائمة", description: "انقر على 'إضافة عنصر قائمة'، أدخل الاسم والفئة والسعر الأساسي (شامل ضريبة القيمة المضافة)، واربط بوصفة اختيارياً.", tips: ["السعر الأساسي يشمل تلقائياً ضريبة القيمة المضافة 15٪", "ربط الوصفات يتيح تحليل هامش الربح"] },
        { title: "تعيين الخصومات", description: "أدخل نسبة خصم إذا كنت تقوم بعرض ترويجي. يتم حساب السعر النهائي تلقائياً.", tips: ["الخصومات تساعد في تعزيز مبيعات عناصر محددة"] },
        { title: "تحميل صورة", description: "أضف صورة جذابة للطبق لتحسين عرض القائمة.", tips: ["الصور عالية الجودة تزيد من اهتمام العملاء"] },
        { title: "تبديل التوفر", description: "استخدم مفتاح التوفر لإظهار/إخفاء العناصر من نقطة البيع بناءً على مخزون المكونات أو التغييرات الموسمية.", tips: ["قم بتعطيل العناصر عندما تنفد المكونات الرئيسية"] },
        { title: "السحب لإعادة الترتيب", description: "اسحب عناصر القائمة لتعيين ترتيب العرض في نظام نقطة البيع.", tips: ["ضع العناصر الشائعة أولاً لمعالجة الطلبات بشكل أسرع"] }
      ]
    },
    {
      title: "إدارة الوصفات",
      description: "حدد الوصفات بالمكونات وتتبع التكاليف تلقائياً وتحسين الربحية.",
      estimatedTime: "8 دقائق",
      steps: [
        { title: "الوصول إلى الوصفات", description: "انقر على 'الوصفات' في الشريط الجانبي لعرض وإدارة جميع وصفات الأطباق الخاصة بك.", tips: ["الوصفات تربط عناصر القائمة بالمخزون لتتبع التكلفة"] },
        { title: "إنشاء وصفة جديدة", description: "انقر على 'إضافة وصفة'، أدخل اسم الوصفة ووقت التحضير ووقت الطهي وعدد الحصص.", tips: ["التوقيت الدقيق يساعد في تخطيط سير عمل المطبخ"] },
        { title: "إضافة مكونات", description: "حدد عناصر المخزون وحدد الكمية المطلوبة لكل مكون في الوصفة.", tips: ["استخدم قياسات دقيقة لحسابات تكلفة دقيقة"] },
        { title: "كتابة التعليمات", description: "أضف تعليمات الطهي خطوة بخطوة لموظفي المطبخ ليتبعوها.", tips: ["التعليمات الواضحة تضمن جودة الطبق المتسقة"] },
        { title: "مراجعة التكلفة", description: "يحسب النظام تلقائياً إجمالي تكلفة الوصفة بناءً على أسعار المكونات الحالية.", tips: ["تحديث تكلفة الوصفة عند تغيير أسعار المخزون"] },
        { title: "الربط بالقائمة", description: "عند إنشاء عناصر القائمة، حدد هذه الوصفة لتمكين تتبع التكلفة والربح التلقائي.", tips: ["يمكن استخدام وصفة واحدة لعدة أشكال من القائمة"] },
        { title: "التحديث حسب الحاجة", description: "اضبط كميات المكونات أثناء تحسين الوصفات بناءً على ملاحظات العملاء.", tips: ["التحديثات المنتظمة تضمن بيانات ربحية دقيقة"] },
        { title: "السحب لإعادة الترتيب", description: "اسحب الوصفات لتنظيمها بالترتيب المفضل لديك.", tips: ["جمّع الوصفات المتشابهة معاً لإدارة أسهل"] }
      ]
    },
    {
      title: "إدارة العملاء",
      description: "بناء قاعدة بيانات العملاء وتتبع سجل الشراء وتعزيز علاقات العملاء.",
      estimatedTime: "5 دقائق",
      steps: [
        { title: "الوصول إلى العملاء", description: "انقر على 'العملاء' في الشريط الجانبي لعرض قاعدة بيانات عملائك.", tips: ["بيانات العملاء تساعد في تخصيص الخدمة"] },
        { title: "إضافة عميل جديد", description: "انقر على 'إضافة عميل'، أدخل الاسم والبريد الإلكتروني والهاتف ومعلومات العنوان.", tips: ["اجمع معلومات العملاء أثناء الزيارة الأولى", "احترم لوائح الخصوصية"] },
        { title: "البحث عن العملاء", description: "استخدم شريط البحث للعثور بسرعة على العملاء بالاسم أو البريد الإلكتروني أو رقم الهاتف.", tips: ["البحث السريع يسرع عملية الدفع"] },
        { title: "عرض سجل الشراء", description: "انقر على أي عميل لرؤية سجل الطلبات الكامل والتفضيلات.", tips: ["استخدم السجل لتقديم توصيات مخصصة"] },
        { title: "تحديث المعلومات", description: "عدّل تفاصيل العملاء حسب الحاجة للحفاظ على معلومات الاتصال الحالية.", tips: ["التحديثات المنتظمة تحسن التواصل"] }
      ]
    },
    {
      title: "معالجة الطلبات",
      description: "إدارة طلبات العملاء من الوضع إلى التسليم مع التنسيق مع المطبخ.",
      estimatedTime: "6 دقائق",
      steps: [
        { title: "عرض جميع الطلبات", description: "انقر على 'الطلبات' في الشريط الجانبي لرؤية جميع الطلبات مع حالتها الحالية.", tips: ["الحالة المرمزة بالألوان تساعد في تحديد الطلبات العاجلة"] },
        { title: "التحقق من تفاصيل الطلب", description: "انقر على أي طلب لعرض العناصر والكميات ورقم الطاولة والمبلغ الإجمالي والطوابع الزمنية.", tips: ["جميع معلومات الطلب منظمة للمراجعة السريعة"] },
        { title: "تحديث الحالة", description: "قم بتغيير حالة الطلب: قيد الانتظار ← التحضير ← جاهز ← تم التسليم مع تقدم الطلب.", tips: ["تحديثات الحالة تساعد في تنسيق موظفي المطبخ والخدمة"] },
        { title: "تصفية الطلبات", description: "استخدم الفلاتر لعرض الطلبات حسب الحالة أو نطاق التاريخ أو رقم الطاولة لتنظيم أفضل.", tips: ["فلاتر التاريخ تساعد في تحليل الأداء اليومي"] },
        { title: "شاشة المطبخ", description: "قم بالتبديل إلى وضع شاشة المطبخ لرؤية الطلبات النشطة قيد التحضير في الوقت الفعلي.", tips: ["يمكن لموظفي المطبخ وضع علامة على اكتمال العناصر"] },
        { title: "تتبع التوقيت", description: "راقب أوقات إكمال الطلبات لتحديد وحل اختناقات المطبخ.", tips: ["أوقات الطلبات الأسرع تحسن رضا العملاء"] }
      ]
    },
    {
      title: "لوحة التحليلات",
      description: "راقب أداء الأعمال مع مقارنات يومية وأسبوعية وشهرية.",
      estimatedTime: "5 دقائق",
      steps: [
        { title: "فتح لوحة المعلومات", description: "انقر على 'لوحة المعلومات' في الشريط الجانبي لعرض نظرة عامة على التحليلات الخاصة بك.", tips: ["توفر لوحة المعلومات رؤى تجارية في الوقت الفعلي"] },
        { title: "مراجعة المقاييس الرئيسية", description: "تحقق من إيرادات اليوم وعدد الطلبات ومتوسط قيمة الطلب وعدد العملاء.", tips: ["قارن مع الفترات السابقة لتتبع النمو"] },
        { title: "تحليل الاتجاهات", description: "راجع التغييرات المئوية (يومياً، أسبوعياً، شهرياً، سنوياً) لتحديد أنماط النمو أو المشاكل.", tips: ["الأخضر يشير إلى اتجاهات إيجابية، والأحمر يظهر مناطق تحتاج إلى اهتمام"] },
        { title: "التحقق من ساعات الذروة", description: "عرض رسم المبيعات بالساعة لفهم متى يكون مطعمك الأكثر انشغالاً.", tips: ["استخدم بيانات ساعات الذروة لجدولة الموظفين"] },
        { title: "مراقبة أهم العناصر", description: "اطلع على أي عناصر القائمة تبيع بشكل أفضل لتحسين المخزون والعروض الترويجية.", tips: ["ركز على العناصر عالية الأداء"] }
      ]
    },
    {
      title: "تحليلات المبيعات",
      description: "تحليل المبيعات حسب الفئة وطريقة الدفع والفترة الزمنية مع تقارير مفصلة.",
      estimatedTime: "6 دقائق",
      steps: [
        { title: "الوصول إلى المبيعات", description: "انقر على 'المبيعات' في الشريط الجانبي لفتح صفحة تحليلات المبيعات.", tips: ["بيانات المبيعات تدفع القرارات الاستراتيجية"] },
        { title: "تحديد نطاق التاريخ", description: "اختر الفترة الزمنية التي تريد تحليلها باستخدام منتقي التاريخ.", tips: ["قارن فترات مختلفة لاكتشاف الاتجاهات"] },
        { title: "عرض رسوم الإيرادات", description: "تحليل اتجاهات الإيرادات مع الرسوم البيانية المرئية التي تظهر الأنماط اليومية أو الأسبوعية أو الشهرية.", tips: ["الرسوم البيانية تجعل البيانات أسهل للفهم"] },
        { title: "تفصيل الفئات", description: "اطلع على أي فئات القائمة تولد أكبر قدر من الإيرادات والأرباح.", tips: ["حسّن القائمة بناءً على أداء الفئات"] },
        { title: "طرق الدفع", description: "راجع التقسيم بين المدفوعات النقدية والبطاقات للتخطيط المالي.", tips: ["تتبع اتجاهات الدفع بمرور الوقت"] },
        { title: "تصدير التقارير", description: "إنشاء وتنزيل تقارير مبيعات مفصلة لأغراض المحاسبة.", tips: ["التصديرات المنتظمة تدعم الامتثال الضريبي"] }
      ]
    },
    {
      title: "تحليل الربحية",
      description: "تحليل هوامش الربح واستراتيجية التسعير وهيكل التكلفة للقرارات المبنية على البيانات.",
      estimatedTime: "7 دقائق",
      steps: [
        { title: "فتح الربحية", description: "انقر على 'الربحية' في الشريط الجانبي للوصول إلى أدوات تحليل الربحية.", tips: ["فهم الهوامش أمر بالغ الأهمية للنمو"] },
        { title: "نظرة عامة استراتيجية", description: "راجع إجمالي هوامش الربح والإيرادات الإجمالية والتكاليف في لمحة واحدة.", tips: ["تتبع اتجاهات الهامش بمرور الوقت"] },
        { title: "تحليل التسعير", description: "انقر على علامة التبويب 'تحليل التسعير' لرؤية تغطية السعر التفصيلية حسب نطاقات هامش الربح.", tips: ["حدد العناصر ذات الهامش المنخفض التي تحتاج إلى إعادة تسعير"] },
        { title: "تحليل عناصر القائمة", description: "عرض الربحية لكل عنصر بما في ذلك التكلفة والسعر والهامش ٪ والربح الإجمالي.", tips: ["فرز حسب الهامش للعثور على العناصر الأكثر/الأقل ربحية"] },
        { title: "إدارة التكاليف", description: "قم بالتبديل إلى علامة التبويب 'إدارة التكاليف' لتحليل تكاليف المكونات وتقليل الهدر.", tips: ["إدارة أفضل للمخزون تقلل التكاليف"] },
        { title: "جدوى التوسع", description: "تحقق من علامة التبويب 'جدوى التوسع' لمعرفة العناصر التي تستحق الترويج.", tips: ["ركز على العناصر ذات الهامش العالي والحجم الكبير"] },
        { title: "تعديل التسعير", description: "استخدم الرؤى لتحسين أسعار القائمة وتحسين الربحية الإجمالية.", tips: ["تغييرات السعر الصغيرة يمكن أن يكون لها تأثير كبير"] }
      ]
    },
    {
      title: "التنبؤ بالطلب",
      description: "توقع الطلب المستقبلي باستخدام البيانات التاريخية لتحسين المخزون والتوظيف.",
      estimatedTime: "5 دقائق",
      steps: [
        { title: "الوصول إلى التنبؤ", description: "انقر على 'التنبؤ' في الشريط الجانبي لعرض توقعات الطلب.", tips: ["التنبؤ يقلل الهدر ونفاد المخزون"] },
        { title: "تحديد تاريخ مستقبلي", description: "اختر التاريخ الذي تريد التنبؤ بالطلب له باستخدام منتقي التاريخ.", tips: ["التوقعات اليومية تحسن مشتريات المخزون"] },
        { title: "مراجعة التوقعات", description: "اطلع على الكميات المتوقعة لكل عنصر في القائمة بناءً على أنماط المبيعات التاريخية.", tips: ["الدقة تتحسن مع المزيد من البيانات"] },
        { title: "تخطيط المخزون", description: "استخدم التوقعات لتحديد كمية المخزون التي يجب طلبها من الموردين.", tips: ["أضف هامش أمان للطلب غير المتوقع"] },
        { title: "جدولة الموظفين", description: "التوقعات تساعد في تخطيط مستويات التوظيف المناسبة لحجم العملاء المتوقع.", tips: ["طابق التوظيف مع الفترات المزدحمة المتوقعة"] }
      ]
    },
    {
      title: "إدارة الفواتير",
      description: "الوصول إلى فواتير ثنائية اللغة متوافقة مع هيئة الزكاة والضريبة مع رموز QR وحساب ضريبة القيمة المضافة.",
      estimatedTime: "5 دقائق",
      steps: [
        { title: "فتح الفواتير", description: "انقر على 'الفواتير' في الشريط الجانبي لعرض جميع الفواتير المُنشأة.", tips: ["يتم إنشاء الفواتير تلقائياً لكل عملية بيع"] },
        { title: "البحث عن الفواتير", description: "استخدم مربع البحث للعثور على الفواتير بالرقم أو اسم العميل أو التاريخ.", tips: ["البحث السريع يساعد في استفسارات العملاء"] },
        { title: "عرض تفاصيل الفاتورة", description: "انقر على أي فاتورة لرؤية التفاصيل الكاملة: العناصر والكميات والأسعار وضريبة القيمة المضافة والإجمالي.", tips: ["جميع الفواتير متوافقة مع هيئة الزكاة والضريبة"] },
        { title: "تنزيل PDF", description: "انقر على 'تنزيل' للحصول على فاتورة PDF ثنائية اللغة (عربي/إنجليزي) مع رمز QR.", tips: ["رموز QR تتيح التحقق الرقمي"] },
        { title: "التحقق من الامتثال", description: "تأكد من أن الفاتورة تتضمن: رقم ضريبة القيمة المضافة، رمز QR، ونص ثنائي اللغة.", tips: ["الامتثال تلقائي"] }
      ]
    },
    {
      title: "التقارير المالية",
      description: "إنشاء بيانات مالية شاملة مع الإيرادات والمصروفات والربح/الخسارة.",
      estimatedTime: "6 دقائق",
      steps: [
        { title: "الوصول إلى المالية", description: "انقر على 'المالية' في الشريط الجانبي لفتح التقارير المالية.", tips: ["التقارير المالية توفر نظرة عامة كاملة للأعمال"] },
        { title: "تحديد الفترة", description: "اختر نطاق التاريخ لتقريرك المالي باستخدام منتقي التاريخ.", tips: ["التقارير الشهرية تتبع التقدم، والسنوية للضرائب"] },
        { title: "مراجعة الإيرادات", description: "اطلع على إجمالي الإيرادات مقسمة حسب فئة المبيعات وطريقة الدفع.", tips: ["قارن الإيرادات عبر الفترات"] },
        { title: "التحقق من المصروفات", description: "عرض جميع المصروفات بما في ذلك المخزون والرواتب وفواتير المحل.", tips: ["المصروفات المصنفة تكشف عن فرص توفير التكاليف"] },
        { title: "الربح والخسارة", description: "راجع صافي الربح بعد خصم جميع المصروفات من الإيرادات.", tips: ["راقب هوامش الربح شهرياً"] },
        { title: "تصدير PDF", description: "انقر على 'تصدير PDF' لإنشاء بيان مالي احترافي.", tips: ["شارك مع المحاسبين لتقديم الضرائب"] }
      ]
    },
    {
      title: "إدارة تطبيقات التوصيل",
      description: "تكوين منصات التوصيل وإدارة العمولات مع ضريبة القيمة المضافة 15٪ وتتبع مستويات الدعم وتحليل الربحية عبر التطبيقات.",
      estimatedTime: "8 دقائق",
      steps: [
        { title: "الوصول إلى تطبيقات التوصيل", description: "انقر على 'تطبيقات التوصيل' في الشريط الجانبي لعرض جميع منصات التوصيل المكونة.", tips: ["إدارة منصات متعددة من لوحة تحكم واحدة"] },
        { title: "إضافة منصة توصيل", description: "انقر على 'إضافة تطبيق توصيل'، أدخل اسم المنصة (UberEats, HungerStation, Jahez، إلخ)، نسبة العمولة، نسبة رسوم البنك، ورسوم POS (SAR).", tips: ["جميع الرسوم تتضمن تلقائياً ضريبة القيمة المضافة 15٪ في الحسابات", "صيغة العمولة: (النتيجة1 + النتيجة2 + النتيجة3) × 1.15"] },
        { title: "تكوين مستويات الدعم", description: "قم بإعداد ما يصل إلى 3 مستويات دعم مع الحد الأدنى/الأقصى لمبالغ الطلبات وقيم الدعم. يتم إضافة الدعم إلى صافي إيراداتك.", tips: ["المستويات تساعد في إدارة عروض المنصة", "يمكن ترك الحد الأقصى فارغاً للنطاق غير المحدود", "يجب أن يكون minAmount < maxAmount لكل مستوى"] },
        { title: "تمكين/تعطيل التطبيقات", description: "استخدم مفتاح 'نشط' لتمكين أو تعطيل منصات التوصيل دون حذف تكوينها.", tips: ["قم بتعطيل التطبيقات أثناء الصيانة أو تغييرات العقد"] },
        { title: "تتبع الطلبات حسب التطبيق", description: "اعرض الطلبات الواردة من كل منصة توصيل في صفحة الطلبات باستخدام فلتر تطبيق التوصيل.", tips: ["تتبع أداء المنصة بمرور الوقت"] },
        { title: "تحليل الربحية", description: "انتقل إلى 'تحليل الربحية' ضمن التحليلات لمقارنة الإيرادات والتكاليف (العمولة، رسوم البنك، رسوم POS مع VAT)، والربح عبر جميع تطبيقات التوصيل.", tips: ["الرسوم البيانية تظهر المنصات الأكثر ربحية", "عرض تفاصيل التكلفة لكل تطبيق"] },
        { title: "مراجعة صيغة التكلفة", description: "فهم حساب التكلفة: العمولة = (السعر - الدعم) × ٪، رسوم البنك = السعر × ٪، ثم الإجمالي = (العمولة + البنك + POS) × 1.15 لضريبة القيمة المضافة.", tips: ["الدعم يزيد صافي إيراداتك", "جميع الرسوم تتضمن VAT تلقائياً"] },
        { title: "تحسين الاستراتيجية", description: "استخدم بيانات الربحية للتفاوض على أسعار أفضل أو التركيز على المنصات الأكثر ربحية.", tips: ["قارن تكاليف البضائع المباعة مقابل الإيرادات", "راقب الهوامش لكل منصة"] }
      ]
    }
  ],

  // Chinese (Simplified) translations
  zh: [
    {
      title: "收银系统（POS）",
      description: "学习如何处理销售交易、管理订单并生成符合ZATCA标准的发票。",
      estimatedTime: "5 分钟",
      steps: [
        { title: "导航到POS", description: "点击侧边栏中的'POS'访问收银系统。", tips: ["POS是处理客户订单和付款的主要界面"] },
        { title: "选择菜单项", description: "浏览菜单类别并点击项目将其添加到当前订单。项目将显示在右侧的订单摘要中。", tips: ["可以添加同一项目的多个数量", "每个菜单项都显示每日库存可用性"] },
        { title: "设置桌号", description: "点击桌号选择器并选择客户所在的桌子。这有助于订单组织和服务。" },
        { title: "查看订单详情", description: "检查订单摘要，显示所有项目、数量、单价、小计、15%增值税和SAR总金额。", tips: ["根据沙特法规，所有价格均含15%增值税", "完成前可以删除项目"] },
        { title: "处理付款", description: "选择付款方式（现金或卡）并点击'完成订单'以处理交易并打印收据。", tips: ["自动生成符合ZATCA标准的收据", "订单立即发送到厨房显示屏"] }
      ]
    },
    {
      title: "库存管理",
      description: "跟踪库存水平、管理食材，并通过Excel导入/导出支持接收低库存警报。",
      estimatedTime: "7 分钟",
      steps: [
        { title: "访问库存页面", description: "从侧边栏菜单导航到'库存'以查看所有食材库存水平。" },
        { title: "添加新食材", description: "点击'添加库存项目'按钮，输入食材名称、初始数量、单位（公斤、升、件）和重新订购水平。点击保存。", tips: ["设置适当的重新订购水平以避免缺货", "单位应与您的采购实践相匹配"] },
        { title: "监控库存水平", description: "库存表显示当前库存及颜色编码的状态指示器：绿色（充足）、黄色（低）、红色（危急）。", tips: ["低库存项目触发自动警报", "按状态筛选以快速找到需要重新订购的项目"] },
        { title: "导入/导出数据", description: "使用'从Excel导入'批量上传库存项目，或使用'导出到Excel'下载当前库存数据进行分析。", tips: ["Excel导入节省初始设置时间", "定期导出有助于供应商订购"] },
        { title: "拖动重新排序", description: "当没有活动筛选器时，您可以拖放项目以自定义您喜欢的显示顺序以便更轻松地访问。", tips: ["按使用频率组织", "清除筛选器时显示拖动手柄"] }
      ]
    },
    {
      title: "菜单管理",
      description: "创建含增值税价格的菜单项、链接到食谱并管理可用性。",
      estimatedTime: "6 分钟",
      steps: [
        { title: "导航到菜单", description: "点击侧边栏中的'菜单'以访问菜单项管理。", tips: ["菜单项链接到食谱以自动计算成本"] },
        { title: "创建菜单项", description: "点击'添加菜单项'，输入名称、类别、基础价格（含增值税），并可选择链接到食谱。", tips: ["基础价格自动包含15%增值税", "链接食谱可以进行利润率分析"] },
        { title: "设置折扣", description: "如果进行促销，请输入折扣百分比。最终价格会自动计算。", tips: ["折扣有助于提高特定项目的销售"] },
        { title: "上传图片", description: "添加菜肴的吸引人照片以增强菜单展示。", tips: ["高质量图片增加客户兴趣"] },
        { title: "切换可用性", description: "使用可用性开关根据食材库存或季节性变化在POS中显示/隐藏项目。", tips: ["关键食材用完时禁用项目"] },
        { title: "拖动重新排序", description: "拖动菜单项以设置POS系统中的显示顺序。", tips: ["将热门项目放在前面以加快订单处理"] }
      ]
    },
    {
      title: "食谱管理",
      description: "定义包含食材的食谱、自动跟踪成本并优化盈利能力。",
      estimatedTime: "8 分钟",
      steps: [
        { title: "访问食谱", description: "点击侧边栏中的'食谱'以查看和管理所有菜肴食谱。", tips: ["食谱将菜单项链接到库存以进行成本跟踪"] },
        { title: "创建新食谱", description: "点击'添加食谱'，输入食谱名称、准备时间、烹饪时间和份数。", tips: ["准确的时间有助于厨房工作流程规划"] },
        { title: "添加食材", description: "选择库存项目并指定食谱中每种食材所需的数量。", tips: ["使用精确的测量以进行准确的成本计算"] },
        { title: "编写说明", description: "添加厨房工作人员遵循的逐步烹饪说明。", tips: ["清晰的说明确保菜肴质量一致"] },
        { title: "查看成本", description: "系统根据当前食材价格自动计算总食谱成本。", tips: ["库存价格变化时食谱成本会更新"] },
        { title: "链接到菜单", description: "创建菜单项时，选择此食谱以启用自动成本和利润跟踪。", tips: ["一个食谱可用于多个菜单变体"] },
        { title: "根据需要更新", description: "根据客户反馈调整食材数量以改进食谱。", tips: ["定期更新确保准确的盈利数据"] },
        { title: "拖动重新排序", description: "拖动食谱以按您喜欢的顺序组织它们。", tips: ["将相似的食谱分组在一起以便更轻松地管理"] }
      ]
    },
    {
      title: "客户管理",
      description: "建立客户数据库、跟踪购买历史并增强客户关系。",
      estimatedTime: "5 分钟",
      steps: [
        { title: "访问客户", description: "点击侧边栏中的'客户'以查看您的客户数据库。", tips: ["客户数据有助于个性化服务"] },
        { title: "添加新客户", description: "点击'添加客户'，输入姓名、电子邮件、电话和地址信息。", tips: ["在首次访问时收集客户信息", "尊重隐私法规"] },
        { title: "搜索客户", description: "使用搜索栏按姓名、电子邮件或电话号码快速查找客户。", tips: ["快速搜索加快结账流程"] },
        { title: "查看购买历史", description: "点击任何客户以查看其完整的订单历史和偏好。", tips: ["使用历史提供个性化推荐"] },
        { title: "更新信息", description: "根据需要编辑客户详细信息以保持联系信息最新。", tips: ["定期更新改善沟通"] }
      ]
    },
    {
      title: "订单处理",
      description: "通过厨房协调管理从下单到交付的客户订单。",
      estimatedTime: "6 分钟",
      steps: [
        { title: "查看所有订单", description: "点击侧边栏中的'订单'以查看所有订单及其当前状态。", tips: ["颜色编码的状态有助于识别紧急订单"] },
        { title: "检查订单详情", description: "点击任何订单以查看项目、数量、桌号、总金额和时间戳。", tips: ["所有订单信息都组织好以便快速查看"] },
        { title: "更新状态", description: "随着订单进展更改订单状态：待处理→准备中→就绪→已交付。", tips: ["状态更新有助于协调厨房和服务人员"] },
        { title: "筛选订单", description: "使用筛选器按状态、日期范围或桌号查看订单以实现更好的组织。", tips: ["日期筛选器有助于分析每日性能"] },
        { title: "厨房显示", description: "切换到厨房显示模式以实时查看正在准备的活动订单。", tips: ["厨房工作人员可以标记项目完成"] },
        { title: "跟踪时间", description: "监控订单完成时间以识别和解决厨房瓶颈。", tips: ["更快的订单时间提高客户满意度"] }
      ]
    },
    {
      title: "分析仪表板",
      description: "通过日环比、周环比、月环比比较监控业务绩效。",
      estimatedTime: "5 分钟",
      steps: [
        { title: "打开仪表板", description: "点击侧边栏中的'仪表板'以查看您的分析概览。", tips: ["仪表板提供实时业务洞察"] },
        { title: "查看关键指标", description: "检查今天的收入、订单数量、平均订单价值和客户数量。", tips: ["与之前的时期比较以跟踪增长"] },
        { title: "分析趋势", description: "查看百分比变化（DoD、WoW、MoM、YoY）以识别增长模式或问题。", tips: ["绿色表示积极趋势，红色显示需要关注的领域"] },
        { title: "检查高峰时段", description: "查看每小时销售图表以了解您的餐厅何时最忙。", tips: ["使用高峰时段数据进行员工排班"] },
        { title: "监控热门项目", description: "查看哪些菜单项销售最好以优化库存和促销。", tips: ["专注于高性能项目"] }
      ]
    },
    {
      title: "销售分析",
      description: "按类别、付款方式和时间段分析销售并提供详细报告。",
      estimatedTime: "6 分钟",
      steps: [
        { title: "访问销售", description: "点击侧边栏中的'销售'以打开销售分析页面。", tips: ["销售数据推动战略决策"] },
        { title: "选择日期范围", description: "使用日期选择器选择要分析的时间段。", tips: ["比较不同时期以发现趋势"] },
        { title: "查看收入图表", description: "使用显示每日、每周或每月模式的可视化图表分析收入趋势。", tips: ["图表使数据更易于理解"] },
        { title: "类别细分", description: "查看哪些菜单类别产生最多的收入和利润。", tips: ["根据类别性能优化菜单"] },
        { title: "付款方式", description: "查看现金和卡支付之间的分配以进行财务规划。", tips: ["跟踪支付趋势随时间的变化"] },
        { title: "导出报告", description: "生成并下载详细的销售报告以用于会计目的。", tips: ["定期导出支持税务合规"] }
      ]
    },
    {
      title: "盈利能力分析",
      description: "分析利润率、定价策略和成本结构以进行数据驱动的决策。",
      estimatedTime: "7 分钟",
      steps: [
        { title: "打开盈利能力", description: "点击侧边栏中的'盈利能力'以访问盈利能力分析工具。", tips: ["了解利润率对增长至关重要"] },
        { title: "战略概览", description: "一目了然地查看总体利润率、总收入和成本。", tips: ["跟踪利润率随时间的趋势"] },
        { title: "定价分析", description: "点击'定价分析'选项卡以查看按利润率范围的详细价格覆盖率。", tips: ["识别需要重新定价的低利润率项目"] },
        { title: "菜单项分析", description: "查看每个项目的盈利能力，包括成本、价格、利润率%和总利润。", tips: ["按利润率排序以找到最/最不盈利的项目"] },
        { title: "成本管理", description: "切换到'成本管理'选项卡以分析食材成本并减少浪费。", tips: ["更好的库存管理降低成本"] },
        { title: "扩展可行性", description: "检查'扩展可行性'选项卡以查看哪些项目值得推广。", tips: ["专注于高利润率、高销量的项目"] },
        { title: "调整定价", description: "使用洞察优化菜单价格并提高整体盈利能力。", tips: ["小的价格变化可能产生重大影响"] }
      ]
    },
    {
      title: "需求预测",
      description: "使用历史数据预测未来需求以优化库存和人员配置。",
      estimatedTime: "5 分钟",
      steps: [
        { title: "访问预测", description: "点击侧边栏中的'预测'以查看需求预测。", tips: ["预测减少浪费和缺货"] },
        { title: "选择未来日期", description: "使用日期选择器选择要预测需求的日期。", tips: ["每日预测优化库存采购"] },
        { title: "查看预测", description: "根据历史销售模式查看每个菜单项的预测数量。", tips: ["数据越多准确性越高"] },
        { title: "计划库存", description: "使用预测来确定从供应商订购多少库存。", tips: ["为意外需求添加安全边际"] },
        { title: "安排人员", description: "预测有助于规划预期客户量的适当人员配置水平。", tips: ["将人员配置与预测的繁忙时段相匹配"] }
      ]
    },
    {
      title: "发票管理",
      description: "访问符合ZATCA标准的双语发票，带有二维码和正确的增值税计算。",
      estimatedTime: "5 分钟",
      steps: [
        { title: "打开发票", description: "点击侧边栏中的'发票'以查看所有生成的发票。", tips: ["每次销售都会自动生成发票"] },
        { title: "搜索发票", description: "使用搜索框按编号、客户名称或日期查找发票。", tips: ["快速搜索有助于客户查询"] },
        { title: "查看发票详情", description: "点击任何发票以查看完整详细信息：项目、数量、价格、增值税和总额。", tips: ["所有发票均符合ZATCA标准"] },
        { title: "下载PDF", description: "点击'下载'以获取带二维码的双语（阿拉伯语/英语）PDF发票。", tips: ["二维码支持数字验证"] },
        { title: "验证合规性", description: "确保发票包括：增值税号、二维码和双语文本。", tips: ["合规性是自动的"] }
      ]
    },
    {
      title: "财务报告",
      description: "生成包含收入、支出和损益的综合财务报表。",
      estimatedTime: "6 分钟",
      steps: [
        { title: "访问财务", description: "点击侧边栏中的'财务'以打开财务报告。", tips: ["财务报告提供完整的业务概览"] },
        { title: "选择时期", description: "使用日期选择器选择财务报告的日期范围。", tips: ["月度报告跟踪进度，年度用于税务"] },
        { title: "查看收入", description: "查看按销售类别和付款方式细分的总收入。", tips: ["比较跨时期的收入"] },
        { title: "检查支出", description: "查看所有支出，包括库存、工资和店铺账单。", tips: ["分类支出揭示节省成本的机会"] },
        { title: "损益", description: "查看从收入中扣除所有支出后的净利润。", tips: ["每月监控利润率"] },
        { title: "导出PDF", description: "点击'导出PDF'以生成专业的财务报表。", tips: ["与会计师共享以进行税务申报"] }
      ]
    },
    {
      title: "外卖应用管理",
      description: "配置外卖平台，管理含15%增值税的佣金，跟踪补贴等级，并分析各应用的盈利能力。",
      estimatedTime: "8 分钟",
      steps: [
        { title: "访问外卖应用", description: "点击侧边栏中的'外卖应用'查看所有已配置的外卖平台。", tips: ["从一个仪表板管理多个平台"] },
        { title: "添加外卖平台", description: "点击'添加外卖应用'，输入平台名称（UberEats、HungerStation、Jahez等）、佣金百分比、银行手续费百分比和POS费用（SAR）。", tips: ["所有费用在计算中自动包含15%增值税", "佣金公式：(结果1 + 结果2 + 结果3) × 1.15"] },
        { title: "配置补贴等级", description: "设置最多3个补贴等级，包含最小/最大订单金额和补贴值。补贴将添加到您的净收入中。", tips: ["等级有助于管理平台促销", "最大值可以留空表示无限范围", "每个等级必须满足 minAmount < maxAmount"] },
        { title: "启用/禁用应用", description: "使用'活跃'开关启用或禁用外卖平台，而不删除其配置。", tips: ["在维护或合同变更期间禁用应用"] },
        { title: "按应用跟踪订单", description: "在订单页面使用外卖应用筛选器查看来自每个外卖平台的订单。", tips: ["跟踪平台随时间的表现"] },
        { title: "分析盈利能力", description: "导航到分析下的'盈利能力分析'，比较所有外卖应用的收入、成本（佣金、银行手续费、含VAT的POS费用）和利润。", tips: ["图表显示最赚钱的平台", "查看每个应用的详细成本明细"] },
        { title: "审查成本公式", description: "了解成本计算：佣金 =（价格 - 补贴）×%，银行手续费 = 价格 ×%，然后总计 =（佣金 + 银行 + POS）× 1.15 用于增值税。", tips: ["补贴增加您的净收入", "所有费用自动包含VAT"] },
        { title: "优化策略", description: "使用盈利数据协商更好的费率或专注于最有利可图的平台。", tips: ["将商品成本与收入进行比较", "监控每个平台的利润率"] }
      ]
    }
  ],
  // German translations
  de: [
    {
      title: "Kassensystem (POS)",
      description: "Lernen Sie, wie Sie Verkaufstransaktionen abwickeln, Bestellungen verwalten und ZATCA-konforme Rechnungen erstellen.",
      estimatedTime: "5 Minuten",
      steps: [
        { title: "Zur Kasse navigieren", description: "Klicken Sie in der Seitenleiste auf 'POS', um auf das Kassensystem zuzugreifen.", tips: ["Das POS ist Ihre Hauptschnittstelle für die Verarbeitung von Kundenbestellungen und Zahlungen"] },
        { title: "Menüpunkte auswählen", description: "Durchsuchen Sie die Menükategorien und klicken Sie auf Artikel, um sie zur aktuellen Bestellung hinzuzufügen. Die Artikel werden in der Bestellübersicht auf der rechten Seite angezeigt.", tips: ["Sie können mehrere Mengen desselben Artikels hinzufügen", "Die tägliche Lagerverfügbarkeit wird für jeden Menüartikel angezeigt"] },
        { title: "Tischnummer festlegen", description: "Klicken Sie auf die Tischnummernauswahl und wählen Sie den Tisch aus, an dem der Kunde sitzt. Dies hilft bei der Bestellorganisation und dem Service." },
        { title: "Bestelldetails überprüfen", description: "Überprüfen Sie die Bestellübersicht mit allen Artikeln, Mengen, Einzelpreisen, Zwischensumme, 15% MwSt. und Gesamtbetrag in SAR.", tips: ["Alle Preise beinhalten 15% MwSt. gemäß saudi-arabischer Vorschriften", "Sie können Artikel vor der Fertigstellung entfernen"] },
        { title: "Zahlung verarbeiten", description: "Wählen Sie die Zahlungsmethode (Bargeld oder Karte) und klicken Sie auf 'Bestellung abschließen', um die Transaktion zu verarbeiten und die Quittung zu drucken.", tips: ["ZATCA-konforme Quittungen werden automatisch generiert", "Bestellungen werden sofort an die Küchendisplay gesendet"] }
      ]
    },
    {
      title: "Lagerverwaltung",
      description: "Lagerbestände verfolgen, Zutaten verwalten und Warnungen bei niedrigem Lagerbestand mit Excel-Import/-Export-Unterstützung erhalten.",
      estimatedTime: "7 Minuten",
      steps: [
        { title: "Lagerseite aufrufen", description: "Navigieren Sie im Seitenleistenmenü zu 'Lager', um alle Ihre Zutatenlagerbestände anzuzeigen." },
        { title: "Neue Zutaten hinzufügen", description: "Klicken Sie auf die Schaltfläche 'Lagerartikel hinzufügen', geben Sie den Zutatennamen, die Anfangsmenge, die Einheit (kg, Liter, Stück) und den Nachbestellpegel ein. Klicken Sie auf Speichern.", tips: ["Legen Sie angemessene Nachbestellpegel fest, um Engpässe zu vermeiden", "Einheiten sollten mit Ihren Beschaffungspraktiken übereinstimmen"] },
        { title: "Lagerbestände überwachen", description: "Die Lagertabelle zeigt den aktuellen Bestand mit farbcodierten Statusindikatoren an: grün (ausreichend), gelb (niedrig), rot (kritisch).", tips: ["Niedrige Lagerartikel lösen automatische Warnungen aus", "Nach Status filtern, um schnell Artikel zu finden, die nachbestellt werden müssen"] },
        { title: "Daten importieren/exportieren", description: "Verwenden Sie 'Aus Excel importieren' zum Massen-Upload von Lagerartikeln oder 'Nach Excel exportieren', um aktuelle Lagerdaten zur Analyse herunterzuladen.", tips: ["Excel-Import spart Zeit bei der Ersteinrichtung", "Regelmäßige Exporte helfen bei der Lieferantenbestellung"] },
        { title: "Zum Neuordnen ziehen", description: "Wenn keine Filter aktiv sind, können Sie Artikel per Drag & Drop verschieben, um Ihre bevorzugte Anzeigereihenfolge für einen einfacheren Zugriff anzupassen.", tips: ["Nach Nutzungshäufigkeit organisieren", "Ziehgriffe erscheinen, wenn Filter gelöscht werden"] }
      ]
    },
    {
      title: "Menüverwaltung",
      description: "Menüpunkte mit MwSt.-inklusiver Preisgestaltung erstellen, mit Rezepten verknüpfen und Verfügbarkeit verwalten.",
      estimatedTime: "6 Minuten",
      steps: [
        { title: "Zum Menü navigieren", description: "Klicken Sie in der Seitenleiste auf 'Menü', um auf die Menüpunktverwaltung zuzugreifen.", tips: ["Menüpunkte werden mit Rezepten verknüpft für automatische Kostenberechnung"] },
        { title: "Menüpunkt erstellen", description: "Klicken Sie auf 'Menüpunkt hinzufügen', geben Sie Name, Kategorie, Grundpreis (MwSt. inklusive) ein und verknüpfen Sie optional mit einem Rezept.", tips: ["Der Grundpreis beinhaltet automatisch 15% MwSt.", "Verknüpfung von Rezepten ermöglicht Gewinnmargenanalyse"] },
        { title: "Rabatte festlegen", description: "Geben Sie bei einer Werbeaktion einen Rabattprozentsatz ein. Der Endpreis wird automatisch berechnet.", tips: ["Rabatte helfen, den Verkauf bestimmter Artikel anzukurbeln"] },
        { title: "Bild hochladen", description: "Fügen Sie ein ansprechendes Foto des Gerichts hinzu, um die Menüpräsentation zu verbessern.", tips: ["Hochwertige Bilder erhöhen das Kundeninteresse"] },
        { title: "Verfügbarkeit umschalten", description: "Verwenden Sie den Verfügbarkeitsschalter, um Artikel im POS basierend auf Zutatenlagerbestand oder saisonalen Änderungen ein-/auszublenden.", tips: ["Artikel deaktivieren, wenn wichtige Zutaten ausgehen"] },
        { title: "Zum Neuordnen ziehen", description: "Ziehen Sie Menüpunkte, um die Anzeigereihenfolge im POS-System festzulegen.", tips: ["Beliebte Artikel zuerst platzieren für schnellere Bestellabwicklung"] }
      ]
    },
    {
      title: "Rezeptverwaltung",
      description: "Rezepte mit Zutaten definieren, Kosten automatisch verfolgen und Rentabilität optimieren.",
      estimatedTime: "8 Minuten",
      steps: [
        { title: "Auf Rezepte zugreifen", description: "Klicken Sie in der Seitenleiste auf 'Rezepte', um alle Ihre Gerichtsrezepte anzuzeigen und zu verwalten.", tips: ["Rezepte verknüpfen Menüpunkte mit dem Lager zur Kostenverfolgung"] },
        { title: "Neues Rezept erstellen", description: "Klicken Sie auf 'Rezept hinzufügen', geben Sie Rezeptname, Vorbereitungszeit, Kochzeit und Anzahl der Portionen ein.", tips: ["Genaue Zeitangaben helfen bei der Küchenworkflow-Planung"] },
        { title: "Zutaten hinzufügen", description: "Wählen Sie Lagerartikel aus und geben Sie die benötigte Menge für jede Zutat im Rezept an.", tips: ["Verwenden Sie präzise Messungen für genaue Kostenberechnungen"] },
        { title: "Anweisungen schreiben", description: "Fügen Sie schrittweise Kochanweisungen für das Küchenpersonal hinzu.", tips: ["Klare Anweisungen gewährleisten eine konsistente Gerichtqualität"] },
        { title: "Kosten überprüfen", description: "Das System berechnet automatisch die Gesamtrezeptkosten basierend auf den aktuellen Zutatenpreisen.", tips: ["Rezeptkosten werden aktualisiert, wenn sich Lagerpreise ändern"] },
        { title: "Mit Menü verknüpfen", description: "Wählen Sie beim Erstellen von Menüpunkten dieses Rezept aus, um automatische Kosten- und Gewinnverfolgung zu aktivieren.", tips: ["Ein Rezept kann für mehrere Menüvarianten verwendet werden"] },
        { title: "Nach Bedarf aktualisieren", description: "Passen Sie Zutatenmengen an, während Sie Rezepte basierend auf Kundenfeedback verfeinern.", tips: ["Regelmäßige Updates gewährleisten genaue Rentabilitätsdaten"] },
        { title: "Zum Neuordnen ziehen", description: "Ziehen Sie Rezepte, um sie in Ihrer bevorzugten Reihenfolge zu organisieren.", tips: ["Ähnliche Rezepte zusammenfassen für einfachere Verwaltung"] }
      ]
    },
    {
      title: "Kundenverwaltung",
      description: "Kundendatenbank aufbauen, Kaufhistorie verfolgen und Kundenbeziehungen verbessern.",
      estimatedTime: "5 Minuten",
      steps: [
        { title: "Auf Kunden zugreifen", description: "Klicken Sie in der Seitenleiste auf 'Kunden', um Ihre Kundendatenbank anzuzeigen.", tips: ["Kundendaten helfen bei der Personalisierung des Service"] },
        { title: "Neuen Kunden hinzufügen", description: "Klicken Sie auf 'Kunde hinzufügen', geben Sie Name, E-Mail, Telefon und Adressinformationen ein.", tips: ["Kundendaten beim ersten Besuch sammeln", "Datenschutzbestimmungen beachten"] },
        { title: "Kunden suchen", description: "Verwenden Sie die Suchleiste, um Kunden schnell nach Name, E-Mail oder Telefonnummer zu finden.", tips: ["Schnellsuche beschleunigt den Checkout-Prozess"] },
        { title: "Kaufhistorie anzeigen", description: "Klicken Sie auf einen Kunden, um dessen vollständige Bestellhistorie und Präferenzen anzuzeigen.", tips: ["Verwenden Sie die Historie für personalisierte Empfehlungen"] },
        { title: "Informationen aktualisieren", description: "Bearbeiten Sie Kundendetails nach Bedarf, um Kontaktinformationen aktuell zu halten.", tips: ["Regelmäßige Updates verbessern die Kommunikation"] }
      ]
    },
    {
      title: "Bestellabwicklung",
      description: "Kundenbestellungen von der Platzierung bis zur Lieferung mit Küchenkoordination verwalten.",
      estimatedTime: "6 Minuten",
      steps: [
        { title: "Alle Bestellungen anzeigen", description: "Klicken Sie in der Seitenleiste auf 'Bestellungen', um alle Bestellungen mit ihrem aktuellen Status anzuzeigen.", tips: ["Farbcodierter Status hilft bei der Identifizierung dringender Bestellungen"] },
        { title: "Bestelldetails überprüfen", description: "Klicken Sie auf eine Bestellung, um Artikel, Mengen, Tischnummer, Gesamtbetrag und Zeitstempel anzuzeigen.", tips: ["Alle Bestellinformationen sind für eine schnelle Überprüfung organisiert"] },
        { title: "Status aktualisieren", description: "Ändern Sie den Bestellstatus: Ausstehend → In Vorbereitung → Bereit → Geliefert, während die Bestellung fortschreitet.", tips: ["Statusaktualisierungen helfen bei der Koordination von Küchen- und Servicepersonal"] },
        { title: "Bestellungen filtern", description: "Verwenden Sie Filter, um Bestellungen nach Status, Datumsbereich oder Tischnummer anzuzeigen für bessere Organisation.", tips: ["Datumsfilter helfen bei der Analyse der täglichen Leistung"] },
        { title: "Küchenanzeige", description: "Wechseln Sie in den Küchenanzeigemodus, um aktive Bestellungen in Echtzeit zu sehen, die zubereitet werden.", tips: ["Küchenpersonal kann Artikel als fertig markieren"] },
        { title: "Zeitverfolgung", description: "Überwachen Sie Bestellfertigstellungszeiten, um Küchenengpässe zu identifizieren und zu beheben.", tips: ["Schnellere Bestellzeiten verbessern die Kundenzufriedenheit"] }
      ]
    },
    {
      title: "Analyse-Dashboard",
      description: "Geschäftsleistung mit Tag-für-Tag-, Woche-für-Woche-, Monat-für-Monat-Vergleichen überwachen.",
      estimatedTime: "5 Minuten",
      steps: [
        { title: "Dashboard öffnen", description: "Klicken Sie in der Seitenleiste auf 'Dashboard', um Ihre Analyseübersicht anzuzeigen.", tips: ["Dashboard bietet Echtzeit-Geschäftseinblicke"] },
        { title: "Schlüsselmetriken überprüfen", description: "Überprüfen Sie den heutigen Umsatz, die Bestellanzahl, den durchschnittlichen Bestellwert und die Kundenanzahl.", tips: ["Mit vorherigen Zeiträumen vergleichen, um Wachstum zu verfolgen"] },
        { title: "Trends analysieren", description: "Überprüfen Sie prozentuale Veränderungen (DoD, WoW, MoM, YoY), um Wachstumsmuster oder Probleme zu identifizieren.", tips: ["Grün zeigt positive Trends an, Rot zeigt Bereiche an, die Aufmerksamkeit benötigen"] },
        { title: "Spitzenzeiten überprüfen", description: "Sehen Sie sich das stündliche Verkaufsdiagramm an, um zu verstehen, wann Ihr Restaurant am vollsten ist.", tips: ["Verwenden Sie Spitzenzeitdaten für die Personalplanung"] },
        { title: "Top-Artikel überwachen", description: "Sehen Sie, welche Menüpunkte am besten verkauft werden, um Lager und Werbeaktionen zu optimieren.", tips: ["Fokussieren Sie sich auf leistungsstarke Artikel"] }
      ]
    },
    {
      title: "Verkaufsanalyse",
      description: "Verkäufe nach Kategorie, Zahlungsmethode und Zeitraum mit detaillierten Berichten analysieren.",
      estimatedTime: "6 Minuten",
      steps: [
        { title: "Auf Verkäufe zugreifen", description: "Klicken Sie in der Seitenleiste auf 'Verkäufe', um die Verkaufsanalyseseite zu öffnen.", tips: ["Verkaufsdaten treiben strategische Entscheidungen"] },
        { title: "Datumsbereich auswählen", description: "Wählen Sie den zu analysierenden Zeitraum mit dem Datumsauswähler aus.", tips: ["Verschiedene Zeiträume vergleichen, um Trends zu erkennen"] },
        { title: "Umsatzdiagramme anzeigen", description: "Analysieren Sie Umsatztrends mit visuellen Diagrammen, die tägliche, wöchentliche oder monatliche Muster zeigen.", tips: ["Diagramme machen Daten leichter verständlich"] },
        { title: "Kategorieaufschlüsselung", description: "Sehen Sie, welche Menükategorien den meisten Umsatz und Gewinn generieren.", tips: ["Menü basierend auf Kategorieleistung optimieren"] },
        { title: "Zahlungsmethoden", description: "Überprüfen Sie die Aufteilung zwischen Bar- und Kartenzahlungen für die Finanzplanung.", tips: ["Zahlungstrends im Zeitverlauf verfolgen"] },
        { title: "Berichte exportieren", description: "Generieren und laden Sie detaillierte Verkaufsberichte für Buchhaltungszwecke herunter.", tips: ["Regelmäßige Exporte unterstützen die Steuerkonformität"] }
      ]
    },
    {
      title: "Rentabilitätsanalyse",
      description: "Gewinnmargen, Preisstrategie und Kostenstruktur für datengesteuerte Entscheidungen analysieren.",
      estimatedTime: "7 Minuten",
      steps: [
        { title: "Rentabilität öffnen", description: "Klicken Sie in der Seitenleiste auf 'Rentabilität', um auf Rentabilitätsanalyse-Tools zuzugreifen.", tips: ["Verständnis der Margen ist entscheidend für Wachstum"] },
        { title: "Strategische Übersicht", description: "Überprüfen Sie auf einen Blick Gesamtgewinnmargen, Gesamtumsatz und Kosten.", tips: ["Margentrends im Zeitverlauf verfolgen"] },
        { title: "Preisanalyse", description: "Klicken Sie auf die Registerkarte 'Preisanalyse', um detaillierte Preisabdeckung nach Gewinnmargenbereichen zu sehen.", tips: ["Artikel mit niedriger Marge identifizieren, die neu bepreist werden müssen"] },
        { title: "Menüpunktanalyse", description: "Rentabilität für jeden Artikel anzeigen, einschließlich Kosten, Preis, Marge % und Gesamtgewinn.", tips: ["Nach Marge sortieren, um die profitabelsten/unprofitabelsten Artikel zu finden"] },
        { title: "Kostenmanagement", description: "Zur Registerkarte 'Kostenmanagement' wechseln, um Zutatenkosten zu analysieren und Verschwendung zu reduzieren.", tips: ["Besseres Lagermanagement reduziert Kosten"] },
        { title: "Skalierungsfähigkeit", description: "Registerkarte 'Skalierungsfähigkeit' überprüfen, um zu sehen, welche Artikel es wert sind, beworben zu werden.", tips: ["Fokussieren Sie sich auf Artikel mit hoher Marge und hohem Volumen"] },
        { title: "Preisgestaltung anpassen", description: "Nutzen Sie Erkenntnisse, um Menüpreise zu optimieren und die Gesamtrentabilität zu verbessern.", tips: ["Kleine Preisänderungen können große Auswirkungen haben"] }
      ]
    },
    {
      title: "Bedarfsprognose",
      description: "Zukünftigen Bedarf anhand historischer Daten vorhersagen, um Lager und Personal zu optimieren.",
      estimatedTime: "5 Minuten",
      steps: [
        { title: "Auf Prognosen zugreifen", description: "Klicken Sie in der Seitenleiste auf 'Prognosen', um Bedarfsprognosen anzuzeigen.", tips: ["Prognosen reduzieren Verschwendung und Engpässe"] },
        { title: "Zukünftiges Datum auswählen", description: "Wählen Sie das Datum aus, für das Sie den Bedarf prognostizieren möchten, mit dem Datumsauswähler.", tips: ["Tägliche Prognosen optimieren Lagereinkäufe"] },
        { title: "Vorhersagen überprüfen", description: "Sehen Sie prognostizierte Mengen für jeden Menüpunkt basierend auf historischen Verkaufsmustern.", tips: ["Genauigkeit verbessert sich mit mehr Daten"] },
        { title: "Lager planen", description: "Verwenden Sie Prognosen, um zu bestimmen, wie viel Lager von Lieferanten zu bestellen ist.", tips: ["Sicherheitspuffer für unerwarteten Bedarf hinzufügen"] },
        { title: "Personal planen", description: "Prognosen helfen bei der Planung angemessener Personalbesetzung für das erwartete Kundenaufkommen.", tips: ["Personalbesetzung an prognostizierte Spitzenzeiten anpassen"] }
      ]
    },
    {
      title: "Rechnungsverwaltung",
      description: "Auf ZATCA-konforme zweisprachige Rechnungen mit QR-Codes und korrekter MwSt.-Berechnung zugreifen.",
      estimatedTime: "5 Minuten",
      steps: [
        { title: "Rechnungen öffnen", description: "Klicken Sie in der Seitenleiste auf 'Rechnungen', um alle generierten Rechnungen anzuzeigen.", tips: ["Rechnungen werden für jeden Verkauf automatisch generiert"] },
        { title: "Rechnungen suchen", description: "Verwenden Sie das Suchfeld, um Rechnungen nach Nummer, Kundenname oder Datum zu finden.", tips: ["Schnellsuche hilft bei Kundenanfragen"] },
        { title: "Rechnungsdetails anzeigen", description: "Klicken Sie auf eine Rechnung, um vollständige Details anzuzeigen: Artikel, Mengen, Preise, MwSt. und Gesamtsumme.", tips: ["Alle Rechnungen sind ZATCA-konform"] },
        { title: "PDF herunterladen", description: "Klicken Sie auf 'Herunterladen', um die zweisprachige (Arabisch/Englisch) PDF-Rechnung mit QR-Code zu erhalten.", tips: ["QR-Codes ermöglichen digitale Verifizierung"] },
        { title: "Konformität überprüfen", description: "Stellen Sie sicher, dass die Rechnung enthält: MwSt.-Nummer, QR-Code und zweisprachigen Text.", tips: ["Konformität ist automatisch"] }
      ]
    },
    {
      title: "Finanzberichte",
      description: "Umfassende Finanzberichte mit Umsatz, Ausgaben und Gewinn/Verlust erstellen.",
      estimatedTime: "6 Minuten",
      steps: [
        { title: "Auf Finanzen zugreifen", description: "Klicken Sie in der Seitenleiste auf 'Finanzen', um die Finanzberichterstattung zu öffnen.", tips: ["Finanzberichte bieten vollständige Geschäftsübersicht"] },
        { title: "Zeitraum auswählen", description: "Wählen Sie den Datumsbereich für Ihren Finanzbericht mit dem Datumsauswähler aus.", tips: ["Monatsberichte verfolgen Fortschritte, jährlich für Steuern"] },
        { title: "Umsatz überprüfen", description: "Sehen Sie den Gesamtumsatz aufgeschlüsselt nach Verkaufskategorie und Zahlungsmethode.", tips: ["Umsatz über Zeiträume hinweg vergleichen"] },
        { title: "Ausgaben überprüfen", description: "Alle Ausgaben anzeigen, einschließlich Lager, Gehälter und Ladenrechnungen.", tips: ["Kategorisierte Ausgaben zeigen Kosteneinsparungsmöglichkeiten"] },
        { title: "Gewinn & Verlust", description: "Nettogewinn nach Abzug aller Ausgaben vom Umsatz überprüfen.", tips: ["Gewinnmargen monatlich überwachen"] },
        { title: "PDF exportieren", description: "Klicken Sie auf 'PDF exportieren', um eine professionelle Finanzaufstellung zu generieren.", tips: ["Mit Buchhaltern für Steuererklärung teilen"] }
      ]
    },
    {
      title: "Lieferapp-Verwaltung",
      description: "Lieferplattformen konfigurieren, Provisionen mit 15% MwSt. verwalten, Zuschussstufen verfolgen und Rentabilität über Apps hinweg analysieren.",
      estimatedTime: "8 Minuten",
      steps: [
        { title: "Auf Lieferapps zugreifen", description: "Klicken Sie in der Seitenleiste auf 'Lieferapps', um alle konfigurierten Lieferplattformen anzuzeigen.", tips: ["Mehrere Plattformen von einem Dashboard aus verwalten"] },
        { title: "Lieferplattform hinzufügen", description: "Klicken Sie auf 'Lieferapp hinzufügen', geben Sie Plattformname (UberEats, HungerStation, Jahez usw.), Provisionsprozentsatz, Bankgebührenprozentsatz und POS-Gebühren (SAR) ein.", tips: ["Alle Gebühren beinhalten automatisch 15% MwSt. in Berechnungen", "Provisionsformel: (Ergebnis1 + Ergebnis2 + Ergebnis3) × 1,15"] },
        { title: "Zuschussstufen konfigurieren", description: "Richten Sie bis zu 3 Zuschussstufen mit Mindest-/Höchstbestellbeträgen und Zuschusswerten ein. Der Zuschuss wird zu Ihrem Nettoumsatz hinzugefügt.", tips: ["Stufen helfen bei der Verwaltung von Plattform-Promotionen", "Maximum kann für unbegrenzten Bereich leer gelassen werden", "Jede Stufe muss minAmount < maxAmount erfüllen"] },
        { title: "Apps aktivieren/deaktivieren", description: "Verwenden Sie den 'Aktiv'-Schalter, um Lieferplattformen zu aktivieren oder zu deaktivieren, ohne deren Konfiguration zu löschen.", tips: ["Apps während Wartung oder Vertragsänderungen deaktivieren"] },
        { title: "Bestellungen nach App verfolgen", description: "Sehen Sie auf der Bestellseite mit dem Lieferapp-Filter, welche Bestellungen von jeder Lieferplattform kamen.", tips: ["Plattformleistung im Zeitverlauf verfolgen"] },
        { title: "Rentabilität analysieren", description: "Navigieren Sie zu 'Rentabilitätsanalyse' unter Analytics, um Umsatz, Kosten (Provision, Bankgebühren, POS-Gebühren mit VAT) und Gewinn über alle Lieferapps hinweg zu vergleichen.", tips: ["Diagramme zeigen die profitabelsten Plattformen", "Detaillierte Kostenaufschlüsselungen pro App anzeigen"] },
        { title: "Kostenformel überprüfen", description: "Kostenberechnung verstehen: Provision = (Preis - Zuschuss) × %, Bankgebühren = Preis × %, dann Gesamt = (Provision + Bank + POS) × 1,15 für MwSt.", tips: ["Zuschuss erhöht Ihren Nettoumsatz", "Alle Gebühren beinhalten automatisch VAT"] },
        { title: "Strategie optimieren", description: "Verwenden Sie Rentabilitätsdaten, um bessere Tarife auszuhandeln oder sich auf die profitabelsten Plattformen zu konzentrieren.", tips: ["Warenkosten mit Umsatz vergleichen", "Margen pro Plattform überwachen"] }
      ]
    }
  ],
  // Hindi translations
  hi: [
    {
      title: "पॉइंट ऑफ सेल (POS)",
      description: "बिक्री लेनदेन को प्रोसेस करना, ऑर्डर प्रबंधित करना और ZATCA-अनुरूप इनवॉइस बनाना सीखें।",
      estimatedTime: "5 मिनट",
      steps: [
        { title: "POS पर नेविगेट करें", description: "पॉइंट ऑफ सेल सिस्टम तक पहुंचने के लिए साइडबार में 'POS' पर क्लिक करें।", tips: ["POS ग्राहक ऑर्डर और भुगतान को प्रोसेस करने के लिए आपका मुख्य इंटरफ़ेस है"] },
        { title: "मेनू आइटम चुनें", description: "मेनू श्रेणियों को ब्राउज़ करें और वर्तमान ऑर्डर में जोड़ने के लिए आइटम पर क्लिक करें। आइटम दाईं ओर ऑर्डर सारांश में दिखाई देंगे।", tips: ["आप एक ही आइटम की कई मात्राएं जोड़ सकते हैं", "प्रत्येक मेनू आइटम के लिए दैनिक स्टॉक उपलब्धता दिखाई जाती है"] },
        { title: "टेबल नंबर सेट करें", description: "टेबल नंबर सिलेक्टर पर क्लिक करें और वह टेबल चुनें जहां ग्राहक बैठा है। यह ऑर्डर संगठन और सेवा में मदद करता है।" },
        { title: "ऑर्डर विवरण की समीक्षा करें", description: "सभी आइटम, मात्राएं, व्यक्तिगत कीमतें, उप-कुल, 15% VAT, और SAR में कुल राशि दिखाने वाले ऑर्डर सारांश की जांच करें।", tips: ["सऊदी नियमों के अनुसार सभी कीमतों में 15% VAT शामिल है", "आप अंतिम रूप देने से पहले आइटम हटा सकते हैं"] },
        { title: "भुगतान प्रोसेस करें", description: "भुगतान विधि (नकद या कार्ड) चुनें और लेनदेन को प्रोसेस करने और रसीद प्रिंट करने के लिए 'ऑर्डर पूर्ण करें' पर क्लिक करें।", tips: ["ZATCA-अनुरूप रसीदें स्वचालित रूप से उत्पन्न होती हैं", "ऑर्डर तुरंत किचन डिस्प्ले पर भेजे जाते हैं"] }
      ]
    },
    {
      title: "इन्वेंटरी प्रबंधन",
      description: "स्टॉक स्तर ट्रैक करें, सामग्री प्रबंधित करें, और Excel आयात/निर्यात समर्थन के साथ कम-स्टॉक अलर्ट प्राप्त करें।",
      estimatedTime: "7 मिनट",
      steps: [
        { title: "इन्वेंटरी पेज तक पहुंचें", description: "अपने सभी सामग्री स्टॉक स्तरों को देखने के लिए साइडबार मेनू से 'इन्वेंटरी' पर नेविगेट करें।" },
        { title: "नई सामग्री जोड़ें", description: "'इन्वेंटरी आइटम जोड़ें' बटन पर क्लिक करें, सामग्री का नाम, प्रारंभिक मात्रा, इकाई (kg, लीटर, टुकड़े), और पुनः ऑर्डर स्तर दर्ज करें। सेव पर क्लिक करें।", tips: ["स्टॉकआउट से बचने के लिए उपयुक्त पुनः ऑर्डर स्तर सेट करें", "इकाइयां आपकी खरीद प्रथाओं से मेल खानी चाहिए"] },
        { title: "स्टॉक स्तर मॉनिटर करें", description: "इन्वेंटरी टेबल रंग-कोडित स्थिति संकेतकों के साथ वर्तमान स्टॉक दिखाती है: हरा (पर्याप्त), पीला (कम), लाल (गंभीर)।", tips: ["कम स्टॉक आइटम स्वचालित अलर्ट ट्रिगर करते हैं", "पुनः ऑर्डर की आवश्यकता वाली आइटम को जल्दी खोजने के लिए स्थिति द्वारा फ़िल्टर करें"] },
        { title: "डेटा आयात/निर्यात करें", description: "इन्वेंटरी आइटम को बल्क अपलोड करने के लिए 'Excel से आयात करें' का उपयोग करें, या विश्लेषण के लिए वर्तमान स्टॉक डेटा डाउनलोड करने के लिए 'Excel में निर्यात करें' का उपयोग करें।", tips: ["Excel आयात प्रारंभिक सेटअप के लिए समय बचाता है", "नियमित निर्यात आपूर्तिकर्ता ऑर्डरिंग में मदद करते हैं"] },
        { title: "पुनः क्रमबद्ध करने के लिए ड्रैग करें", description: "जब कोई फ़िल्टर सक्रिय नहीं है, तो आप आसान पहुंच के लिए अपने पसंदीदा प्रदर्शन क्रम को अनुकूलित करने के लिए आइटम को ड्रैग और ड्रॉप कर सकते हैं।", tips: ["उपयोग आवृत्ति द्वारा व्यवस्थित करें", "फ़िल्टर साफ़ होने पर ड्रैग हैंडल दिखाई देते हैं"] }
      ]
    },
    {
      title: "मेनू प्रबंधन",
      description: "VAT-समावेशी मूल्य निर्धारण के साथ मेनू आइटम बनाएं, व्यंजनों से लिंक करें, और उपलब्धता प्रबंधित करें।",
      estimatedTime: "6 मिनट",
      steps: [
        { title: "मेनू पर नेविगेट करें", description: "मेनू आइटम प्रबंधन तक पहुंचने के लिए साइडबार में 'मेनू' पर क्लिक करें।", tips: ["स्वचालित लागत गणना के लिए मेनू आइटम व्यंजनों से लिंक होते हैं"] },
        { title: "मेनू आइटम बनाएं", description: "'मेनू आइटम जोड़ें' पर क्लिक करें, नाम, श्रेणी, आधार मूल्य (VAT शामिल) दर्ज करें, और वैकल्पिक रूप से एक व्यंजन से लिंक करें।", tips: ["आधार मूल्य में स्वचालित रूप से 15% VAT शामिल है", "व्यंजनों को लिंक करने से लाभ मार्जिन विश्लेषण सक्षम होता है"] },
        { title: "छूट सेट करें", description: "यदि प्रचार चला रहे हैं तो छूट प्रतिशत दर्ज करें। अंतिम मूल्य स्वचालित रूप से गणना की जाती है।", tips: ["छूट विशिष्ट आइटम की बिक्री बढ़ाने में मदद करती है"] },
        { title: "छवि अपलोड करें", description: "मेनू प्रस्तुति को बढ़ाने के लिए व्यंजन की एक आकर्षक फोटो जोड़ें।", tips: ["उच्च गुणवत्ता वाली छवियां ग्राहक रुचि बढ़ाती हैं"] },
        { title: "उपलब्धता टॉगल करें", description: "सामग्री स्टॉक या मौसमी परिवर्तनों के आधार पर POS से आइटम दिखाने/छिपाने के लिए उपलब्धता स्विच का उपयोग करें।", tips: ["मुख्य सामग्री खत्म होने पर आइटम अक्षम करें"] },
        { title: "पुनः क्रमबद्ध करने के लिए ड्रैग करें", description: "POS सिस्टम में प्रदर्शन क्रम सेट करने के लिए मेनू आइटम को ड्रैग करें।", tips: ["तेज़ ऑर्डर प्रोसेसिंग के लिए लोकप्रिय आइटम पहले रखें"] }
      ]
    },
    {
      title: "रेसिपी प्रबंधन",
      description: "सामग्री के साथ व्यंजनों को परिभाषित करें, स्वचालित रूप से लागत ट्रैक करें, और लाभप्रदता को अनुकूलित करें।",
      estimatedTime: "8 मिनट",
      steps: [
        { title: "रेसिपी तक पहुंचें", description: "अपने सभी व्यंजन व्यंजनों को देखने और प्रबंधित करने के लिए साइडबार में 'रेसिपी' पर क्लिक करें।", tips: ["व्यंजन लागत ट्रैकिंग के लिए मेनू आइटम को इन्वेंटरी से लिंक करते हैं"] },
        { title: "नई रेसिपी बनाएं", description: "'रेसिपी जोड़ें' पर क्लिक करें, रेसिपी का नाम, तैयारी का समय, खाना पकाने का समय, और सर्विंग्स की संख्या दर्ज करें।", tips: ["किचन वर्कफ़्लो योजना में सटीक समय मदद करता है"] },
        { title: "सामग्री जोड़ें", description: "इन्वेंटरी आइटम चुनें और रेसिपी में प्रत्येक सामग्री के लिए आवश्यक मात्रा निर्दिष्ट करें।", tips: ["सटीक लागत गणना के लिए सटीक माप का उपयोग करें"] },
        { title: "निर्देश लिखें", description: "किचन स्टाफ के लिए चरण-दर-चरण खाना पकाने के निर्देश जोड़ें।", tips: ["स्पष्ट निर्देश सुसंगत व्यंजन गुणवत्ता सुनिश्चित करते हैं"] },
        { title: "लागत की समीक्षा करें", description: "सिस्टम वर्तमान सामग्री की कीमतों के आधार पर कुल रेसिपी लागत की स्वचालित रूप से गणना करता है।", tips: ["इन्वेंटरी मूल्य बदलने पर रेसिपी लागत अपडेट होती है"] },
        { title: "मेनू से लिंक करें", description: "मेनू आइटम बनाते समय, स्वचालित लागत और लाभ ट्रैकिंग सक्षम करने के लिए इस रेसिपी का चयन करें।", tips: ["एक रेसिपी का उपयोग कई मेनू भिन्नताओं के लिए किया जा सकता है"] },
        { title: "आवश्यकतानुसार अपडेट करें", description: "ग्राहक प्रतिक्रिया के आधार पर व्यंजनों को परिष्कृत करते हुए सामग्री मात्रा समायोजित करें।", tips: ["नियमित अपडेट सटीक लाभप्रदता डेटा सुनिश्चित करते हैं"] },
        { title: "पुनः क्रमबद्ध करने के लिए ड्रैग करें", description: "अपनी पसंदीदा क्रम में व्यवस्थित करने के लिए व्यंजनों को ड्रैग करें।", tips: ["आसान प्रबंधन के लिए समान व्यंजनों को एक साथ समूहित करें"] }
      ]
    },
    {
      title: "ग्राहक प्रबंधन",
      description: "ग्राहक डेटाबेस बनाएं, खरीद इतिहास ट्रैक करें, और ग्राहक संबंध बढ़ाएं।",
      estimatedTime: "5 मिनट",
      steps: [
        { title: "ग्राहकों तक पहुंचें", description: "अपने ग्राहक डेटाबेस को देखने के लिए साइडबार में 'ग्राहक' पर क्लिक करें।", tips: ["ग्राहक डेटा सेवा को वैयक्तिकृत करने में मदद करता है"] },
        { title: "नया ग्राहक जोड़ें", description: "'ग्राहक जोड़ें' पर क्लिक करें, नाम, ईमेल, फोन और पता जानकारी दर्ज करें।", tips: ["पहली यात्रा के दौरान ग्राहक जानकारी एकत्र करें", "गोपनीयता नियमों का सम्मान करें"] },
        { title: "ग्राहक खोजें", description: "नाम, ईमेल या फोन नंबर द्वारा ग्राहकों को जल्दी से खोजने के लिए खोज बार का उपयोग करें।", tips: ["त्वरित खोज चेकआउट प्रक्रिया को तेज़ करती है"] },
        { title: "खरीद इतिहास देखें", description: "उनका पूर्ण ऑर्डर इतिहास और प्राथमिकताएं देखने के लिए किसी भी ग्राहक पर क्लिक करें।", tips: ["वैयक्तिकृत सिफारिशें देने के लिए इतिहास का उपयोग करें"] },
        { title: "जानकारी अपडेट करें", description: "संपर्क जानकारी को वर्तमान रखने के लिए आवश्यकतानुसार ग्राहक विवरण संपादित करें।", tips: ["नियमित अपडेट संचार में सुधार करते हैं"] }
      ]
    },
    {
      title: "ऑर्डर प्रोसेसिंग",
      description: "किचन समन्वय के साथ प्लेसमेंट से डिलीवरी तक ग्राहक ऑर्डर प्रबंधित करें।",
      estimatedTime: "6 मिनट",
      steps: [
        { title: "सभी ऑर्डर देखें", description: "उनकी वर्तमान स्थिति के साथ सभी ऑर्डर देखने के लिए साइडबार में 'ऑर्डर' पर क्लिक करें।", tips: ["रंग-कोडित स्थिति तत्काल ऑर्डर की पहचान करने में मदद करती है"] },
        { title: "ऑर्डर विवरण जांचें", description: "आइटम, मात्राएं, टेबल नंबर, कुल राशि और टाइमस्टैम्प देखने के लिए किसी भी ऑर्डर पर क्लिक करें।", tips: ["सभी ऑर्डर जानकारी त्वरित समीक्षा के लिए व्यवस्थित है"] },
        { title: "स्थिति अपडेट करें", description: "ऑर्डर की प्रगति के रूप में ऑर्डर स्थिति बदलें: लंबित → तैयारी → तैयार → डिलीवर किया गया।", tips: ["स्थिति अपडेट किचन और सेवा स्टाफ के समन्वय में मदद करते हैं"] },
        { title: "ऑर्डर फ़िल्टर करें", description: "बेहतर संगठन के लिए स्थिति, तारीख रेंज, या टेबल नंबर द्वारा ऑर्डर देखने के लिए फ़िल्टर का उपयोग करें।", tips: ["तारीख फ़िल्टर दैनिक प्रदर्शन का विश्लेषण करने में मदद करते हैं"] },
        { title: "किचन डिस्प्ले", description: "वास्तविक समय में तैयार किए जा रहे सक्रिय ऑर्डर देखने के लिए किचन डिस्प्ले मोड पर स्विच करें।", tips: ["किचन स्टाफ आइटम को पूर्ण के रूप में चिह्नित कर सकता है"] },
        { title: "समय ट्रैक करें", description: "किचन बाधाओं की पहचान और समाधान के लिए ऑर्डर पूर्णता समय की निगरानी करें।", tips: ["तेज़ ऑर्डर समय ग्राहक संतुष्टि में सुधार करता है"] }
      ]
    },
    {
      title: "एनालिटिक्स डैशबोर्ड",
      description: "दिन-दर-दिन, सप्ताह-दर-सप्ताह, महीना-दर-महीना तुलना के साथ व्यावसायिक प्रदर्शन की निगरानी करें।",
      estimatedTime: "5 मिनट",
      steps: [
        { title: "डैशबोर्ड खोलें", description: "अपना एनालिटिक्स अवलोकन देखने के लिए साइडबार में 'डैशबोर्ड' पर क्लिक करें।", tips: ["डैशबोर्ड वास्तविक समय व्यापार अंतर्दृष्टि प्रदान करता है"] },
        { title: "मुख्य मेट्रिक्स की समीक्षा करें", description: "आज की राजस्व, ऑर्डर गिनती, औसत ऑर्डर मूल्य, और ग्राहक गिनती जांचें।", tips: ["विकास ट्रैक करने के लिए पिछली अवधियों के साथ तुलना करें"] },
        { title: "रुझानों का विश्लेषण करें", description: "विकास पैटर्न या मुद्दों की पहचान करने के लिए प्रतिशत परिवर्तन (DoD, WoW, MoM, YoY) की समीक्षा करें।", tips: ["हरा सकारात्मक रुझानों को इंगित करता है, लाल ध्यान देने की आवश्यकता वाले क्षेत्रों को दिखाता है"] },
        { title: "पीक ऑवर्स जांचें", description: "समझने के लिए प्रति घंटा बिक्री चार्ट देखें कि आपका रेस्तरां कब सबसे व्यस्त है।", tips: ["स्टाफ शेड्यूलिंग के लिए पीक ऑवर डेटा का उपयोग करें"] },
        { title: "टॉप आइटम की निगरानी करें", description: "इन्वेंटरी और प्रचार को अनुकूलित करने के लिए देखें कि कौन से मेनू आइटम सर्वश्रेष्ठ बिक रहे हैं।", tips: ["उच्च-प्रदर्शन वाले आइटम पर ध्यान केंद्रित करें"] }
      ]
    },
    {
      title: "बिक्री विश्लेषण",
      description: "विस्तृत रिपोर्ट के साथ श्रेणी, भुगतान विधि, और समय अवधि द्वारा बिक्री का विश्लेषण करें।",
      estimatedTime: "6 मिनट",
      steps: [
        { title: "बिक्री तक पहुंचें", description: "बिक्री विश्लेषण पेज खोलने के लिए साइडबार में 'बिक्री' पर क्लिक करें।", tips: ["बिक्री डेटा रणनीतिक निर्णय लेता है"] },
        { title: "तारीख रेंज चुनें", description: "दिनांक पिकर का उपयोग करके विश्लेषण करने के लिए समय अवधि चुनें।", tips: ["रुझानों को पहचानने के लिए विभिन्न अवधियों की तुलना करें"] },
        { title: "राजस्व चार्ट देखें", description: "दैनिक, साप्ताहिक या मासिक पैटर्न दिखाने वाले दृश्य चार्ट के साथ राजस्व रुझानों का विश्लेषण करें।", tips: ["चार्ट डेटा को समझना आसान बनाते हैं"] },
        { title: "श्रेणी विवरण", description: "देखें कि कौन सी मेनू श्रेणियां सबसे अधिक राजस्व और लाभ उत्पन्न करती हैं।", tips: ["श्रेणी प्रदर्शन के आधार पर मेनू अनुकूलित करें"] },
        { title: "भुगतान विधियां", description: "वित्तीय योजना के लिए नकद और कार्ड भुगतान के बीच विभाजन की समीक्षा करें।", tips: ["समय के साथ भुगतान रुझानों को ट्रैक करें"] },
        { title: "रिपोर्ट निर्यात करें", description: "लेखांकन उद्देश्यों के लिए विस्तृत बिक्री रिपोर्ट बनाएं और डाउनलोड करें।", tips: ["नियमित निर्यात कर अनुपालन का समर्थन करते हैं"] }
      ]
    },
    {
      title: "लाभप्रदता विश्लेषण",
      description: "डेटा-संचालित निर्णयों के लिए लाभ मार्जिन, मूल्य निर्धारण रणनीति, और लागत संरचना का विश्लेषण करें।",
      estimatedTime: "7 मिनट",
      steps: [
        { title: "लाभप्रदता खोलें", description: "लाभप्रदता विश्लेषण उपकरणों तक पहुंचने के लिए साइडबार में 'लाभप्रदता' पर क्लिक करें।", tips: ["मार्जिन को समझना विकास के लिए महत्वपूर्ण है"] },
        { title: "रणनीतिक अवलोकन", description: "एक नज़र में समग्र लाभ मार्जिन, कुल राजस्व, और लागत की समीक्षा करें।", tips: ["समय के साथ मार्जिन रुझानों को ट्रैक करें"] },
        { title: "मूल्य निर्धारण विश्लेषण", description: "लाभ मार्जिन रेंज द्वारा विस्तृत मूल्य कवरेज देखने के लिए 'मूल्य निर्धारण विश्लेषण' टैब पर क्लिक करें।", tips: ["पुनः मूल्य निर्धारण की आवश्यकता वाले कम-मार्जिन आइटम की पहचान करें"] },
        { title: "मेनू आइटम विश्लेषण", description: "लागत, मूल्य, मार्जिन %, और कुल लाभ सहित प्रत्येक आइटम के लिए लाभप्रदता देखें।", tips: ["सबसे/सबसे कम लाभदायक आइटम खोजने के लिए मार्जिन द्वारा क्रमबद्ध करें"] },
        { title: "लागत प्रबंधन", description: "सामग्री लागत का विश्लेषण करने और अपशिष्ट को कम करने के लिए 'लागत प्रबंधन' टैब पर स्विच करें।", tips: ["बेहतर इन्वेंटरी प्रबंधन लागत कम करता है"] },
        { title: "स्केलिंग व्यवहार्यता", description: "देखें कि कौन से आइटम प्रचार के लायक हैं, के लिए 'स्केलिंग व्यवहार्यता' टैब जांचें।", tips: ["उच्च-मार्जिन, उच्च-वॉल्यूम आइटम पर ध्यान केंद्रित करें"] },
        { title: "मूल्य निर्धारण समायोजित करें", description: "मेनू कीमतों को अनुकूलित करने और समग्र लाभप्रदता में सुधार के लिए अंतर्दृष्टि का उपयोग करें।", tips: ["छोटे मूल्य परिवर्तनों का बड़ा प्रभाव हो सकता है"] }
      ]
    },
    {
      title: "मांग पूर्वानुमान",
      description: "इन्वेंटरी और स्टाफिंग को अनुकूलित करने के लिए ऐतिहासिक डेटा का उपयोग करके भविष्य की मांग की भविष्यवाणी करें।",
      estimatedTime: "5 मिनट",
      steps: [
        { title: "पूर्वानुमान तक पहुंचें", description: "मांग भविष्यवाणियां देखने के लिए साइडबार में 'पूर्वानुमान' पर क्लिक करें।", tips: ["पूर्वानुमान अपशिष्ट और स्टॉकआउट को कम करता है"] },
        { title: "भविष्य की तारीख चुनें", description: "दिनांक पिकर का उपयोग करके उस तारीख का चयन करें जिसके लिए आप मांग का पूर्वानुमान लगाना चाहते हैं।", tips: ["दैनिक पूर्वानुमान इन्वेंटरी खरीद को अनुकूलित करते हैं"] },
        { title: "भविष्यवाणियों की समीक्षा करें", description: "ऐतिहासिक बिक्री पैटर्न के आधार पर प्रत्येक मेनू आइटम के लिए अनुमानित मात्रा देखें।", tips: ["अधिक डेटा के साथ सटीकता में सुधार होता है"] },
        { title: "इन्वेंटरी योजना बनाएं", description: "आपूर्तिकर्ताओं से कितनी इन्वेंटरी ऑर्डर करनी है, यह निर्धारित करने के लिए पूर्वानुमानों का उपयोग करें।", tips: ["अप्रत्याशित मांग के लिए सुरक्षा मार्जिन जोड़ें"] },
        { title: "स्टाफ शेड्यूल करें", description: "अपेक्षित ग्राहक वॉल्यूम के लिए उपयुक्त स्टाफिंग स्तर की योजना बनाने में पूर्वानुमान मदद करता है।", tips: ["अनुमानित व्यस्त अवधियों के साथ स्टाफिंग का मिलान करें"] }
      ]
    },
    {
      title: "इनवॉइस प्रबंधन",
      description: "QR कोड और उचित VAT गणना के साथ ZATCA-अनुरूप द्विभाषी इनवॉइस तक पहुंचें।",
      estimatedTime: "5 मिनट",
      steps: [
        { title: "इनवॉइस खोलें", description: "सभी जेनरेट की गई इनवॉइस देखने के लिए साइडबार में 'इनवॉइस' पर क्लिक करें।", tips: ["प्रत्येक बिक्री के लिए इनवॉइस स्वतः जेनरेट होते हैं"] },
        { title: "इनवॉइस खोजें", description: "संख्या, ग्राहक नाम, या तारीख द्वारा इनवॉइस खोजने के लिए खोज बॉक्स का उपयोग करें।", tips: ["त्वरित खोज ग्राहक पूछताछ में मदद करती है"] },
        { title: "इनवॉइस विवरण देखें", description: "पूर्ण विवरण देखने के लिए किसी भी इनवॉइस पर क्लिक करें: आइटम, मात्राएं, कीमतें, VAT, और कुल।", tips: ["सभी इनवॉइस ZATCA-अनुरूप हैं"] },
        { title: "PDF डाउनलोड करें", description: "QR कोड के साथ द्विभाषी (अरबी/अंग्रेज़ी) PDF इनवॉइस प्राप्त करने के लिए 'डाउनलोड' पर क्लिक करें।", tips: ["QR कोड डिजिटल सत्यापन सक्षम करते हैं"] },
        { title: "अनुपालन सत्यापित करें", description: "सुनिश्चित करें कि इनवॉइस में शामिल है: VAT नंबर, QR कोड, और द्विभाषी पाठ।", tips: ["अनुपालन स्वचालित है"] }
      ]
    },
    {
      title: "वित्तीय रिपोर्ट",
      description: "राजस्व, व्यय, और लाभ/हानि के साथ व्यापक वित्तीय विवरण बनाएं।",
      estimatedTime: "6 मिनट",
      steps: [
        { title: "वित्तीय तक पहुंचें", description: "वित्तीय रिपोर्टिंग खोलने के लिए साइडबार में 'वित्तीय' पर क्लिक करें।", tips: ["वित्तीय रिपोर्ट पूर्ण व्यापार अवलोकन प्रदान करती हैं"] },
        { title: "अवधि चुनें", description: "दिनांक पिकर का उपयोग करके अपनी वित्तीय रिपोर्ट के लिए तारीख रेंज चुनें।", tips: ["मासिक रिपोर्ट प्रगति को ट्रैक करती हैं, वार्षिक करों के लिए"] },
        { title: "राजस्व की समीक्षा करें", description: "बिक्री श्रेणी और भुगतान विधि द्वारा विभाजित कुल राजस्व देखें।", tips: ["अवधियों में राजस्व की तुलना करें"] },
        { title: "व्यय जांचें", description: "इन्वेंटरी, वेतन, और दुकान बिलों सहित सभी व्यय देखें।", tips: ["वर्गीकृत व्यय लागत-बचत अवसरों को प्रकट करते हैं"] },
        { title: "लाभ और हानि", description: "राजस्व से सभी व्यय घटाने के बाद शुद्ध लाभ की समीक्षा करें।", tips: ["मासिक रूप से लाभ मार्जिन की निगरानी करें"] },
        { title: "PDF निर्यात करें", description: "एक पेशेवर वित्तीय विवरण बनाने के लिए 'PDF निर्यात करें' पर क्लिक करें।", tips: ["कर फाइलिंग के लिए लेखाकारों के साथ साझा करें"] }
      ]
    },
    {
      title: "डिलीवरी ऐप्स प्रबंधन",
      description: "डिलीवरी प्लेटफ़ॉर्म कॉन्फ़िगर करें, 15% VAT के साथ कमीशन प्रबंधित करें, सब्सिडी टियर ट्रैक करें, और ऐप्स में लाभप्रदता का विश्लेषण करें।",
      estimatedTime: "8 मिनट",
      steps: [
        { title: "डिलीवरी ऐप्स तक पहुंचें", description: "सभी कॉन्फ़िगर की गई डिलीवरी प्लेटफ़ॉर्म देखने के लिए साइडबार में 'डिलीवरी ऐप्स' पर क्लिक करें।", tips: ["एक डैशबोर्ड से कई प्लेटफ़ॉर्म प्रबंधित करें"] },
        { title: "डिलीवरी प्लेटफ़ॉर्म जोड़ें", description: "'डिलीवरी ऐप जोड़ें' पर क्लिक करें, प्लेटफ़ॉर्म नाम (UberEats, HungerStation, Jahez, आदि), कमीशन प्रतिशत, बैंकिंग शुल्क प्रतिशत, और POS शुल्क (SAR) दर्ज करें।", tips: ["सभी शुल्क गणनाओं में स्वचालित रूप से 15% VAT शामिल करते हैं", "कमीशन फॉर्मूला: (परिणाम1 + परिणाम2 + परिणाम3) × 1.15"] },
        { title: "सब्सिडी टियर कॉन्फ़िगर करें", description: "न्यूनतम/अधिकतम ऑर्डर राशि और सब्सिडी मूल्यों के साथ 3 सब्सिडी टियर सेट करें। सब्सिडी आपके शुद्ध राजस्व में जोड़ी जाती है।", tips: ["टियर प्लेटफ़ॉर्म प्रचार प्रबंधित करने में मदद करते हैं", "असीमित रेंज के लिए अधिकतम खाली छोड़ा जा सकता है", "प्रत्येक टियर को minAmount < maxAmount पूरा करना होगा"] },
        { title: "ऐप्स सक्षम/अक्षम करें", description: "उनके कॉन्फ़िगरेशन को हटाए बिना डिलीवरी प्लेटफ़ॉर्म को सक्षम या अक्षम करने के लिए 'सक्रिय' टॉगल का उपयोग करें।", tips: ["रखरखाव या अनुबंध परिवर्तनों के दौरान ऐप्स अक्षम करें"] },
        { title: "ऐप द्वारा ऑर्डर ट्रैक करें", description: "डिलीवरी ऐप फ़िल्टर का उपयोग करके ऑर्डर पेज में प्रत्येक डिलीवरी प्लेटफ़ॉर्म से आए ऑर्डर देखें।", tips: ["समय के साथ प्लेटफ़ॉर्म प्रदर्शन ट्रैक करें"] },
        { title: "लाभप्रदता का विश्लेषण करें", description: "सभी डिलीवरी ऐप्स में राजस्व, लागत (कमीशन, बैंकिंग शुल्क, VAT के साथ POS शुल्क), और लाभ की तुलना करने के लिए एनालिटिक्स के तहत 'लाभप्रदता विश्लेषण' पर नेविगेट करें।", tips: ["चार्ट दिखाते हैं कि कौन से प्लेटफ़ॉर्म सबसे लाभदायक हैं", "प्रति ऐप विस्तृत लागत विवरण देखें"] },
        { title: "लागत फॉर्मूला की समीक्षा करें", description: "लागत गणना समझें: कमीशन = (मूल्य - सब्सिडी) × %, बैंकिंग शुल्क = मूल्य × %, फिर कुल = (कमीशन + बैंकिंग + POS) × 1.15 VAT के लिए।", tips: ["सब्सिडी आपका शुद्ध राजस्व बढ़ाती है", "सभी शुल्क स्वचालित रूप से VAT शामिल करते हैं"] },
        { title: "रणनीति अनुकूलित करें", description: "बेहतर दरों पर बातचीत करने या सबसे लाभदायक प्लेटफ़ॉर्म पर ध्यान केंद्रित करने के लिए लाभप्रदता डेटा का उपयोग करें।", tips: ["राजस्व के मुकाबले आइटम लागत (COGS) की तुलना करें", "प्रति प्लेटफ़ॉर्म मार्जिन की निगरानी करें"] }
      ]
    }
  ],
  // Urdu translations  
  ur: [
    {
      title: "پوائنٹ آف سیل (POS)",
      description: "فروخت کے لین دین پر کارروائی کرنا، آرڈرز کا انتظام کرنا اور ZATCA کے مطابق انوائسز بنانا سیکھیں۔",
      estimatedTime: "5 منٹ",
      steps: [
        { title: "POS پر جائیں", description: "پوائنٹ آف سیل سسٹم تک رسائی کے لیے سائڈبار میں 'POS' پر کلک کریں۔", tips: ["POS گاہک کے آرڈرز اور ادائیگیوں پر کارروائی کے لیے آپ کا اہم انٹرفیس ہے"] },
        { title: "مینو آئٹمز منتخب کریں", description: "مینو کیٹگریز براؤز کریں اور موجودہ آرڈر میں شامل کرنے کے لیے آئٹمز پر کلک کریں۔ آئٹمز دائیں جانب آرڈر کے خلاصہ میں ظاہر ہوں گی۔", tips: ["آپ ایک ہی آئٹم کی متعدد مقداریں شامل کر سکتے ہیں", "ہر مینو آئٹم کے لیے روزانہ اسٹاک کی دستیابی دکھائی جاتی ہے"] },
        { title: "ٹیبل نمبر سیٹ کریں", description: "ٹیبل نمبر سلیکٹر پر کلک کریں اور وہ ٹیبل منتخب کریں جہاں گاہک بیٹھا ہے۔ یہ آرڈر کی تنظیم اور سروس میں مدد کرتا ہے۔" },
        { title: "آرڈر کی تفصیلات کا جائزہ لیں", description: "تمام آئٹمز، مقداریں، انفرادی قیمتیں، ذیلی کل، 15% VAT، اور SAR میں کل رقم دکھانے والے آرڈر کے خلاصہ کی جانچ کریں۔", tips: ["سعودی ضوابط کے مطابق تمام قیمتوں میں 15% VAT شامل ہے", "آپ حتمی شکل دینے سے پہلے آئٹمز ہٹا سکتے ہیں"] },
        { title: "ادائیگی پر کارروائی کریں", description: "ادائیگی کا طریقہ (نقد یا کارڈ) منتخب کریں اور لین دین پر کارروائی اور رسید پرنٹ کرنے کے لیے 'آرڈر مکمل کریں' پر کلک کریں۔", tips: ["ZATCA کے مطابق رسیدیں خودکار طور پر تیار ہوتی ہیں", "آرڈرز فوری طور پر کچن ڈسپلے پر بھیجے جاتے ہیں"] }
      ]
    },
    {
      title: "انوینٹری کا انتظام",
      description: "اسٹاک کی سطح ٹریک کریں، اجزاء کا انتظام کریں، اور Excel درآمد/برآمد کی معاونت کے ساتھ کم اسٹاک الرٹس حاصل کریں۔",
      estimatedTime: "7 منٹ",
      steps: [
        { title: "انوینٹری صفحہ تک رسائی حاصل کریں", description: "اپنے تمام اجزاء کے اسٹاک کی سطح دیکھنے کے لیے سائڈبار مینو سے 'انوینٹری' پر جائیں۔" },
        { title: "نئے اجزاء شامل کریں", description: "'انوینٹری آئٹم شامل کریں' بٹن پر کلک کریں، جزو کا نام، ابتدائی مقدار، یونٹ (kg، لیٹر، ٹکڑے)، اور دوبارہ آرڈر کی سطح درج کریں۔ محفوظ کریں پر کلک کریں۔", tips: ["اسٹاک ختم ہونے سے بچنے کے لیے مناسب دوبارہ آرڈر کی سطح مقرر کریں", "یونٹس آپ کی خریداری کے طریقوں سے میل کھانے چاہئیں"] },
        { title: "اسٹاک کی سطح کی نگرانی کریں", description: "انوینٹری ٹیبل رنگ کوڈ شدہ حیثیت کے اشارات کے ساتھ موجودہ اسٹاک دکھاتا ہے: سبز (کافی)، پیلا (کم)، سرخ (نازک)۔", tips: ["کم اسٹاک والے آئٹمز خودکار الرٹس کو متحرک کرتے ہیں", "دوبارہ آرڈر کی ضرورت والے آئٹمز تیزی سے تلاش کرنے کے لیے حیثیت کے مطابق فلٹر کریں"] },
        { title: "ڈیٹا درآمد/برآمد کریں", description: "انوینٹری آئٹمز کو بلک اپ لوڈ کرنے کے لیے 'Excel سے درآمد کریں' استعمال کریں، یا تجزیہ کے لیے موجودہ اسٹاک ڈیٹا ڈاؤن لوڈ کرنے کے لیے 'Excel میں برآمد کریں' استعمال کریں۔", tips: ["Excel درآمد ابتدائی سیٹ اپ کے لیے وقت بچاتی ہے", "باقاعدہ برآمدات سپلائر آرڈرنگ میں مدد کرتی ہیں"] },
        { title: "دوبارہ ترتیب دینے کے لیے گھسیٹیں", description: "جب کوئی فلٹر فعال نہیں ہے، تو آپ آسان رسائی کے لیے اپنی پسندیدہ ڈسپلے ترتیب کو حسب ضرورت بنانے کے لیے آئٹمز کو گھسیٹ اور چھوڑ سکتے ہیں۔", tips: ["استعمال کی فریکوئنسی کے مطابق منظم کریں", "فلٹرز صاف ہونے پر گھسیٹنے کے ہینڈلز ظاہر ہوتے ہیں"] }
      ]
    },
    {
      title: "مینو کا انتظام",
      description: "VAT شامل قیمت کے ساتھ مینو آئٹمز بنائیں، ترکیبوں سے لنک کریں، اور دستیابی کا انتظام کریں۔",
      estimatedTime: "6 منٹ",
      steps: [
        { title: "مینو پر جائیں", description: "مینو آئٹم کے انتظام تک رسائی کے لیے سائڈبار میں 'مینو' پر کلک کریں۔", tips: ["خودکار لاگت کی گنتی کے لیے مینو آئٹمز ترکیبوں سے منسلک ہوتے ہیں"] },
        { title: "مینو آئٹم بنائیں", description: "'مینو آئٹم شامل کریں' پر کلک کریں، نام، کیٹگری، بنیادی قیمت (VAT شامل) درج کریں، اور اختیاری طور پر ایک ترکیب سے لنک کریں۔", tips: ["بنیادی قیمت میں خودکار طور پر 15% VAT شامل ہے", "ترکیبوں کو لنک کرنے سے منافع کے مارجن کا تجزیہ قابل بناتا ہے"] },
        { title: "رعایت مقرر کریں", description: "اگر پروموشن چلا رہے ہیں تو رعایت کی فیصد درج کریں۔ حتمی قیمت خودکار طور پر شمار کی جاتی ہے۔", tips: ["رعایتیں مخصوص آئٹمز کی فروخت بڑھانے میں مدد کرتی ہیں"] },
        { title: "تصویر اپ لوڈ کریں", description: "مینو کی پیشکش کو بہتر بنانے کے لیے پکوان کی ایک دلکش تصویر شامل کریں۔", tips: ["اعلیٰ معیار کی تصاویر گاہک کی دلچسپی بڑھاتی ہیں"] },
        { title: "دستیابی ٹوگل کریں", description: "اجزاء کے اسٹاک یا موسمی تبدیلیوں کی بنیاد پر POS سے آئٹمز دکھانے/چھپانے کے لیے دستیابی سوئچ استعمال کریں۔", tips: ["کلیدی اجزاء ختم ہونے پر آئٹمز غیر فعال کریں"] },
        { title: "دوبارہ ترتیب دینے کے لیے گھسیٹیں", description: "POS سسٹم میں ڈسپلے کی ترتیب مقرر کرنے کے لیے مینو آئٹمز کو گھسیٹیں۔", tips: ["تیز آرڈر پروسیسنگ کے لیے مقبول آئٹمز پہلے رکھیں"] }
      ]
    },
    {
      title: "ترکیب کا انتظام",
      description: "اجزاء کے ساتھ ترکیبیں متعین کریں، خودکار طور پر لاگت ٹریک کریں، اور منافع بخش کو بہتر بنائیں۔",
      estimatedTime: "8 منٹ",
      steps: [
        { title: "ترکیبوں تک رسائی حاصل کریں", description: "اپنی تمام پکوان کی ترکیبیں دیکھنے اور ان کا انتظام کرنے کے لیے سائڈبار میں 'ترکیبیں' پر کلک کریں۔", tips: ["ترکیبیں لاگت کی ٹریکنگ کے لیے مینو آئٹمز کو انوینٹری سے منسلک کرتی ہیں"] },
        { title: "نئی ترکیب بنائیں", description: "'ترکیب شامل کریں' پر کلک کریں، ترکیب کا نام، تیاری کا وقت، پکانے کا وقت، اور سرونگز کی تعداد درج کریں۔", tips: ["کچن کے کام کی منصوبہ بندی میں درست وقت مدد کرتا ہے"] },
        { title: "اجزاء شامل کریں", description: "انوینٹری آئٹمز منتخب کریں اور ترکیب میں ہر جزو کے لیے درکار مقدار بیان کریں۔", tips: ["درست لاگت کی گنتی کے لیے درست پیمائش استعمال کریں"] },
        { title: "ہدایات لکھیں", description: "کچن کے عملے کے لیے قدم بہ قدم پکانے کی ہدایات شامل کریں۔", tips: ["واضح ہدایات مستقل پکوان کے معیار کو یقینی بناتی ہیں"] },
        { title: "لاگت کا جائزہ لیں", description: "سسٹم موجودہ اجزاء کی قیمتوں کی بنیاد پر کل ترکیب کی لاگت خودکار طور پر شمار کرتا ہے۔", tips: ["انوینٹری کی قیمتیں تبدیل ہونے پر ترکیب کی لاگت اپ ڈیٹ ہوتی ہے"] },
        { title: "مینو سے لنک کریں", description: "مینو آئٹمز بناتے وقت، خودکار لاگت اور منافع کی ٹریکنگ کو قابل بنانے کے لیے یہ ترکیب منتخب کریں۔", tips: ["ایک ترکیب کو متعدد مینو کی تغیرات کے لیے استعمال کیا جا سکتا ہے"] },
        { title: "ضرورت کے مطابق اپ ڈیٹ کریں", description: "گاہکوں کی رائے کی بنیاد پر ترکیبوں کو بہتر بناتے ہوئے اجزاء کی مقدار ایڈجسٹ کریں۔", tips: ["باقاعدہ اپ ڈیٹس درست منافع بخش ڈیٹا کو یقینی بناتی ہیں"] },
        { title: "دوبارہ ترتیب دینے کے لیے گھسیٹیں", description: "اپنی پسندیدہ ترتیب میں منظم کرنے کے لیے ترکیبوں کو گھسیٹیں۔", tips: ["آسان انتظام کے لیے ملتی جلتی ترکیبوں کو ایک ساتھ گروپ کریں"] }
      ]
    },
    {
      title: "گاہک کا انتظام",
      description: "گاہک کا ڈیٹا بیس بنائیں، خریداری کی تاریخ ٹریک کریں، اور گاہک کے تعلقات کو بہتر بنائیں۔",
      estimatedTime: "5 منٹ",
      steps: [
        { title: "گاہکوں تک رسائی حاصل کریں", description: "اپنے گاہک ڈیٹا بیس کو دیکھنے کے لیے سائڈبار میں 'گاہک' پر کلک کریں۔", tips: ["گاہک کا ڈیٹا سروس کو ذاتی بنانے میں مدد کرتا ہے"] },
        { title: "نیا گاہک شامل کریں", description: "'گاہک شامل کریں' پر کلک کریں، نام، ای میل، فون اور پتہ کی معلومات درج کریں۔", tips: ["پہلی ملاقات کے دوران گاہک کی معلومات جمع کریں", "رازداری کے ضوابط کا احترام کریں"] },
        { title: "گاہک تلاش کریں", description: "نام، ای میل، یا فون نمبر کے ذریعے تیزی سے گاہک تلاش کرنے کے لیے سرچ بار استعمال کریں۔", tips: ["فوری تلاش چیک آؤٹ کے عمل کو تیز کرتی ہے"] },
        { title: "خریداری کی تاریخ دیکھیں", description: "ان کی مکمل آرڈر کی تاریخ اور ترجیحات دیکھنے کے لیے کسی بھی گاہک پر کلک کریں۔", tips: ["ذاتی سفارشات دینے کے لیے تاریخ استعمال کریں"] },
        { title: "معلومات اپ ڈیٹ کریں", description: "رابطے کی معلومات کو موجودہ رکھنے کے لیے ضرورت کے مطابق گاہک کی تفصیلات میں ترمیم کریں۔", tips: ["باقاعدہ اپ ڈیٹس رابطے کو بہتر بناتی ہیں"] }
      ]
    },
    {
      title: "آرڈر کی پروسیسنگ",
      description: "کچن کے ہم آہنگی کے ساتھ رکھنے سے ڈیلیوری تک گاہک کے آرڈرز کا انتظام کریں۔",
      estimatedTime: "6 منٹ",
      steps: [
        { title: "تمام آرڈرز دیکھیں", description: "ان کی موجودہ حیثیت کے ساتھ تمام آرڈرز دیکھنے کے لیے سائڈبار میں 'آرڈرز' پر کلک کریں۔", tips: ["رنگ کوڈ شدہ حیثیت فوری آرڈرز کی شناخت میں مدد کرتی ہے"] },
        { title: "آرڈر کی تفصیلات چیک کریں", description: "آئٹمز، مقداریں، ٹیبل نمبر، کل رقم، اور ٹائم اسٹیمپ دیکھنے کے لیے کسی بھی آرڈر پر کلک کریں۔", tips: ["تمام آرڈر کی معلومات فوری جائزے کے لیے منظم ہیں"] },
        { title: "حیثیت اپ ڈیٹ کریں", description: "آرڈر کی پیش رفت کے ساتھ آرڈر کی حیثیت تبدیل کریں: زیر التواء → تیاری → تیار → ڈیلیور کر دیا گیا۔", tips: ["حیثیت کی اپ ڈیٹس کچن اور سروس کے عملے کے ہم آہنگی میں مدد کرتی ہیں"] },
        { title: "آرڈرز فلٹر کریں", description: "بہتر تنظیم کے لیے حیثیت، تاریخ کی حد، یا ٹیبل نمبر کے مطابق آرڈرز دیکھنے کے لیے فلٹرز استعمال کریں۔", tips: ["تاریخ کے فلٹرز روزانہ کارکردگی کا تجزیہ کرنے میں مدد کرتے ہیں"] },
        { title: "کچن ڈسپلے", description: "حقیقی وقت میں تیار ہونے والے فعال آرڈرز دیکھنے کے لیے کچن ڈسپلے موڈ پر سوئچ کریں۔", tips: ["کچن کا عملہ آئٹمز کو مکمل کے طور پر نشان زد کر سکتا ہے"] },
        { title: "وقت ٹریک کریں", description: "کچن کی رکاوٹوں کی شناخت اور حل کے لیے آرڈر کی تکمیل کے وقت کی نگرانی کریں۔", tips: ["تیز آرڈر کے اوقات گاہک کی اطمینان کو بہتر بناتے ہیں"] }
      ]
    },
    {
      title: "تجزیاتی ڈیش بورڈ",
      description: "دن بہ دن، ہفتہ بہ ہفتہ، ماہ بہ ماہ موازنہ کے ساتھ کاروباری کارکردگی کی نگرانی کریں۔",
      estimatedTime: "5 منٹ",
      steps: [
        { title: "ڈیش بورڈ کھولیں", description: "اپنا تجزیاتی جائزہ دیکھنے کے لیے سائڈبار میں 'ڈیش بورڈ' پر کلک کریں۔", tips: ["ڈیش بورڈ حقیقی وقت کاروباری بصیرت فراہم کرتا ہے"] },
        { title: "کلیدی میٹرکس کا جائزہ لیں", description: "آج کی آمدنی، آرڈرز کی تعداد، اوسط آرڈر کی قیمت، اور گاہکوں کی تعداد چیک کریں۔", tips: ["ترقی کو ٹریک کرنے کے لیے پچھلی مدتوں سے موازنہ کریں"] },
        { title: "رجحانات کا تجزیہ کریں", description: "ترقی کے نمونوں یا مسائل کی شناخت کے لیے فیصد کی تبدیلیوں (DoD، WoW، MoM، YoY) کا جائزہ لیں۔", tips: ["سبز مثبت رجحانات کی نشاندہی کرتا ہے، سرخ توجہ کی ضرورت والے علاقے دکھاتا ہے"] },
        { title: "عروج کے اوقات چیک کریں", description: "یہ سمجھنے کے لیے فی گھنٹہ فروخت کا چارٹ دیکھیں کہ آپ کا ریستوراں کب سب سے زیادہ مصروف ہے۔", tips: ["عملے کی شیڈولنگ کے لیے عروج کے اوقات کا ڈیٹا استعمال کریں"] },
        { title: "ٹاپ آئٹمز کی نگرانی کریں", description: "انوینٹری اور پروموشنز کو بہتر بنانے کے لیے دیکھیں کہ کون سے مینو آئٹمز بہترین فروخت ہو رہے ہیں۔", tips: ["اعلیٰ کارکردگی والے آئٹمز پر توجہ مرکوز کریں"] }
      ]
    },
    {
      title: "فروخت کا تجزیہ",
      description: "تفصیلی رپورٹس کے ساتھ کیٹگری، ادائیگی کے طریقہ، اور وقت کی مدت کے مطابق فروخت کا تجزیہ کریں۔",
      estimatedTime: "6 منٹ",
      steps: [
        { title: "فروخت تک رسائی حاصل کریں", description: "فروخت کے تجزیہ کا صفحہ کھولنے کے لیے سائڈبار میں 'فروخت' پر کلک کریں۔", tips: ["فروخت کا ڈیٹا حکمت عملی کے فیصلے کرتا ہے"] },
        { title: "تاریخ کی حد منتخب کریں", description: "تاریخ کے منتخب کنندہ کا استعمال کرتے ہوئے تجزیہ کرنے کے لیے وقت کی مدت منتخب کریں۔", tips: ["رجحانات کی شناخت کے لیے مختلف مدتوں کا موازنہ کریں"] },
        { title: "آمدنی کے چارٹس دیکھیں", description: "روزانہ، ہفتہ وار، یا ماہانہ نمونے دکھانے والے بصری چارٹس کے ساتھ آمدنی کے رجحانات کا تجزیہ کریں۔", tips: ["چارٹس ڈیٹا کو سمجھنا آسان بناتے ہیں"] },
        { title: "کیٹگری کی تقسیم", description: "دیکھیں کہ کون سی مینو کیٹگریز سب سے زیادہ آمدنی اور منافع پیدا کرتی ہیں۔", tips: ["کیٹگری کی کارکردگی کی بنیاد پر مینو کو بہتر بنائیں"] },
        { title: "ادائیگی کے طریقے", description: "مالی منصوبہ بندی کے لیے نقد اور کارڈ کی ادائیگیوں کے درمیان تقسیم کا جائزہ لیں۔", tips: ["وقت کے ساتھ ادائیگی کے رجحانات ٹریک کریں"] },
        { title: "رپورٹس برآمد کریں", description: "اکاؤنٹنگ کے مقاصد کے لیے تفصیلی فروخت کی رپورٹس بنائیں اور ڈاؤن لوڈ کریں۔", tips: ["باقاعدہ برآمدات ٹیکس کی تعمیل کی معاونت کرتی ہیں"] }
      ]
    },
    {
      title: "منافع بخش کا تجزیہ",
      description: "ڈیٹا پر مبنی فیصلوں کے لیے منافع کے مارجن، قیمت کی حکمت عملی، اور لاگت کی ساخت کا تجزیہ کریں۔",
      estimatedTime: "7 منٹ",
      steps: [
        { title: "منافع بخش کھولیں", description: "منافع بخش تجزیہ کے آلات تک رسائی کے لیے سائڈبار میں 'منافع بخش' پر کلک کریں۔", tips: ["ترقی کے لیے مارجنز کو سمجھنا بہت اہم ہے"] },
        { title: "حکمت عملی کا جائزہ", description: "ایک نظر میں مجموعی منافع کے مارجن، کل آمدنی، اور لاگت کا جائزہ لیں۔", tips: ["وقت کے ساتھ مارجن کے رجحانات ٹریک کریں"] },
        { title: "قیمت کا تجزیہ", description: "منافع کے مارجن کی حد کے مطابق تفصیلی قیمت کوریج دیکھنے کے لیے 'قیمت کا تجزیہ' ٹیب پر کلک کریں۔", tips: ["دوبارہ قیمت مقرر کرنے کی ضرورت والے کم مارجن والے آئٹمز کی شناخت کریں"] },
        { title: "مینو آئٹم کا تجزیہ", description: "لاگت، قیمت، مارجن %، اور کل منافع سمیت ہر آئٹم کے لیے منافع بخش دیکھیں۔", tips: ["سب سے زیادہ/سب سے کم منافع بخش آئٹمز تلاش کرنے کے لیے مارجن کے مطابق ترتیب دیں"] },
        { title: "لاگت کا انتظام", description: "اجزاء کی لاگت کا تجزیہ کرنے اور فضلہ کو کم کرنے کے لیے 'لاگت کا انتظام' ٹیب پر سوئچ کریں۔", tips: ["بہتر انوینٹری کا انتظام لاگت کو کم کرتا ہے"] },
        { title: "توسیع کی عملیت", description: "دیکھیں کہ کون سے آئٹمز پروموشن کے قابل ہیں، کے لیے 'توسیع کی عملیت' ٹیب چیک کریں۔", tips: ["زیادہ مارجن، زیادہ حجم والے آئٹمز پر توجہ مرکوز کریں"] },
        { title: "قیمت ایڈجسٹ کریں", description: "مینو کی قیمتوں کو بہتر بنانے اور مجموعی منافع بخش کو بہتر بنانے کے لیے بصیرت استعمال کریں۔", tips: ["چھوٹی قیمت کی تبدیلیوں کا بڑا اثر ہو سکتا ہے"] }
      ]
    },
    {
      title: "طلب کی پیشین گوئی",
      description: "انوینٹری اور عملے کو بہتر بنانے کے لیے تاریخی ڈیٹا کا استعمال کرتے ہوئے مستقبل کی طلب کی پیش گوئی کریں۔",
      estimatedTime: "5 منٹ",
      steps: [
        { title: "پیشین گوئیوں تک رسائی حاصل کریں", description: "طلب کی پیشین گوئیاں دیکھنے کے لیے سائڈبار میں 'پیشین گوئی' پر کلک کریں۔", tips: ["پیشین گوئی فضلہ اور اسٹاک ختم ہونے کو کم کرتی ہے"] },
        { title: "مستقبل کی تاریخ منتخب کریں", description: "تاریخ کے منتخب کنندہ کا استعمال کرتے ہوئے وہ تاریخ منتخب کریں جس کے لیے آپ طلب کی پیش گوئی کرنا چاہتے ہیں۔", tips: ["روزانہ کی پیشین گوئیاں انوینٹری کی خریداری کو بہتر بناتی ہیں"] },
        { title: "پیشین گوئیوں کا جائزہ لیں", description: "تاریخی فروخت کے نمونوں کی بنیاد پر ہر مینو آئٹم کے لیے متوقع مقداریں دیکھیں۔", tips: ["زیادہ ڈیٹا کے ساتھ درستگی بہتر ہوتی ہے"] },
        { title: "انوینٹری کی منصوبہ بندی کریں", description: "سپلائرز سے کتنی انوینٹری آرڈر کرنی ہے، یہ طے کرنے کے لیے پیشین گوئیوں کا استعمال کریں۔", tips: ["غیر متوقع طلب کے لیے حفاظتی مارجن شامل کریں"] },
        { title: "عملے کی شیڈول بنائیں", description: "متوقع گاہکوں کی تعداد کے لیے مناسب عملے کی سطح کی منصوبہ بندی میں پیشین گوئی مدد کرتی ہے۔", tips: ["متوقع مصروف مدتوں کے ساتھ عملے کو میچ کریں"] }
      ]
    },
    {
      title: "انوائس کا انتظام",
      description: "QR کوڈز اور مناسب VAT کی گنتی کے ساتھ ZATCA کے مطابق دو لسانی انوائسز تک رسائی حاصل کریں۔",
      estimatedTime: "5 منٹ",
      steps: [
        { title: "انوائسز کھولیں", description: "تمام تیار شدہ انوائسز دیکھنے کے لیے سائڈبار میں 'انوائسز' پر کلک کریں۔", tips: ["ہر فروخت کے لیے انوائسز خودکار طور پر تیار ہوتے ہیں"] },
        { title: "انوائس تلاش کریں", description: "نمبر، گاہک کا نام، یا تاریخ کے ذریعے انوائسز تلاش کرنے کے لیے سرچ باکس استعمال کریں۔", tips: ["فوری تلاش گاہک کی پوچھ گچھ میں مدد کرتی ہے"] },
        { title: "انوائس کی تفصیلات دیکھیں", description: "مکمل تفصیلات دیکھنے کے لیے کسی بھی انوائس پر کلک کریں: آئٹمز، مقداریں، قیمتیں، VAT، اور کل۔", tips: ["تمام انوائسز ZATCA کے مطابق ہیں"] },
        { title: "PDF ڈاؤن لوڈ کریں", description: "QR کوڈ کے ساتھ دو لسانی (عربی/انگریزی) PDF انوائس حاصل کرنے کے لیے 'ڈاؤن لوڈ' پر کلک کریں۔", tips: ["QR کوڈز ڈیجیٹل تصدیق کو قابل بناتے ہیں"] },
        { title: "تعمیل کی تصدیق کریں", description: "یقینی بنائیں کہ انوائس میں شامل ہے: VAT نمبر، QR کوڈ، اور دو لسانی متن۔", tips: ["تعمیل خودکار ہے"] }
      ]
    },
    {
      title: "مالی رپورٹس",
      description: "آمدنی، اخراجات، اور منافع/نقصان کے ساتھ جامع مالی بیانات بنائیں۔",
      estimatedTime: "6 منٹ",
      steps: [
        { title: "مالی تک رسائی حاصل کریں", description: "مالی رپورٹنگ کھولنے کے لیے سائڈبار میں 'مالی' پر کلک کریں۔", tips: ["مالی رپورٹس مکمل کاروباری جائزہ فراہم کرتی ہیں"] },
        { title: "مدت منتخب کریں", description: "تاریخ کے منتخب کنندہ کا استعمال کرتے ہوئے اپنی مالی رپورٹ کے لیے تاریخ کی حد منتخب کریں۔", tips: ["ماہانہ رپورٹس پیش رفت کو ٹریک کرتی ہیں، سالانہ ٹیکسوں کے لیے"] },
        { title: "آمدنی کا جائزہ لیں", description: "فروخت کی کیٹگری اور ادائیگی کے طریقہ کے مطابق تقسیم شدہ کل آمدنی دیکھیں۔", tips: ["مدتوں میں آمدنی کا موازنہ کریں"] },
        { title: "اخراجات چیک کریں", description: "انوینٹری، تنخواہیں، اور دکان کے بلوں سمیت تمام اخراجات دیکھیں۔", tips: ["درجہ بند اخراجات لاگت کی بچت کے مواقع ظاہر کرتے ہیں"] },
        { title: "منافع اور نقصان", description: "آمدنی سے تمام اخراجات منہا کرنے کے بعد خالص منافع کا جائزہ لیں۔", tips: ["ماہانہ منافع کے مارجنز کی نگرانی کریں"] },
        { title: "PDF برآمد کریں", description: "ایک پیشہ ورانہ مالی بیان بنانے کے لیے 'PDF برآمد کریں' پر کلک کریں۔", tips: ["ٹیکس فائلنگ کے لیے اکاؤنٹنٹس کے ساتھ شیئر کریں"] }
      ]
    },
    {
      title: "ڈیلیوری ایپس کا انتظام",
      description: "ڈیلیوری پلیٹ فارمز کو کنفیگر کریں، 15% VAT کے ساتھ کمیشن کا انتظام کریں، سبسڈی کی سطحیں ٹریک کریں، اور ایپس میں منافع بخش کا تجزیہ کریں۔",
      estimatedTime: "8 منٹ",
      steps: [
        { title: "ڈیلیوری ایپس تک رسائی حاصل کریں", description: "تمام کنفیگر شدہ ڈیلیوری پلیٹ فارمز دیکھنے کے لیے سائڈبار میں 'ڈیلیوری ایپس' پر کلک کریں۔", tips: ["ایک ڈیش بورڈ سے متعدد پلیٹ فارمز کا انتظام کریں"] },
        { title: "ڈیلیوری پلیٹ فارم شامل کریں", description: "'ڈیلیوری ایپ شامل کریں' پر کلک کریں، پلیٹ فارم کا نام (UberEats، HungerStation، Jahez، وغیرہ)، کمیشن کی فیصد، بینکنگ فیس کی فیصد، اور POS فیس (SAR) درج کریں۔", tips: ["تمام فیسیں گنتیوں میں خودکار طور پر 15% VAT شامل کرتی ہیں", "کمیشن کا فارمولا: (نتیجہ1 + نتیجہ2 + نتیجہ3) × 1.15"] },
        { title: "سبسڈی کی سطحیں کنفیگر کریں", description: "کم از کم/زیادہ سے زیادہ آرڈر کی رقم اور سبسڈی کی قیمتوں کے ساتھ 3 سبسڈی کی سطحیں ترتیب دیں۔ سبسڈی آپ کی خالص آمدنی میں شامل ہوتی ہے۔", tips: ["سطحیں پلیٹ فارم کی پروموشنز کا انتظام کرنے میں مدد کرتی ہیں", "لامحدود حد کے لیے زیادہ سے زیادہ خالی چھوڑا جا سکتا ہے", "ہر سطح کو minAmount < maxAmount پورا کرنا ہوگا"] },
        { title: "ایپس فعال/غیر فعال کریں", description: "ان کی کنفیگریشن کو حذف کیے بغیر ڈیلیوری پلیٹ فارمز کو فعال یا غیر فعال کرنے کے لیے 'فعال' ٹوگل استعمال کریں۔", tips: ["دیکھ بھال یا معاہدے کی تبدیلیوں کے دوران ایپس غیر فعال کریں"] },
        { title: "ایپ کے مطابق آرڈرز ٹریک کریں", description: "ڈیلیوری ایپ فلٹر کا استعمال کرتے ہوئے آرڈرز کے صفحہ میں ہر ڈیلیوری پلیٹ فارم سے آئے آرڈرز دیکھیں۔", tips: ["وقت کے ساتھ پلیٹ فارم کی کارکردگی ٹریک کریں"] },
        { title: "منافع بخش کا تجزیہ کریں", description: "تمام ڈیلیوری ایپس میں آمدنی، لاگت (کمیشن، بینکنگ فیس، VAT کے ساتھ POS فیس)، اور منافع کا موازنہ کرنے کے لیے تجزیات کے تحت 'منافع بخش تجزیہ' پر جائیں۔", tips: ["چارٹس دکھاتے ہیں کہ کون سے پلیٹ فارمز سب سے زیادہ منافع بخش ہیں", "فی ایپ تفصیلی لاگت کی تقسیم دیکھیں"] },
        { title: "لاگت کے فارمولے کا جائزہ لیں", description: "لاگت کی گنتی سمجھیں: کمیشن = (قیمت - سبسڈی) × %، بینکنگ فیس = قیمت × %، پھر کل = (کمیشن + بینکنگ + POS) × 1.15 VAT کے لیے۔", tips: ["سبسڈی آپ کی خالص آمدنی بڑھاتی ہے", "تمام فیسیں خودکار طور پر VAT شامل کرتی ہیں"] },
        { title: "حکمت عملی کو بہتر بنائیں", description: "بہتر شرحوں پر گفت و شنید کرنے یا سب سے زیادہ منافع بخش پلیٹ فارمز پر توجہ مرکوز کرنے کے لیے منافع بخش ڈیٹا استعمال کریں۔", tips: ["آمدنی کے مقابلے میں آئٹم کی لاگت (COGS) کا موازنہ کریں", "فی پلیٹ فارم مارجنز کی نگرانی کریں"] }
      ]
    }
  ],
  // Bengali translations
  bn: [
    {
      title: "পয়েন্ট অফ সেল (POS)",
      description: "বিক্রয় লেনদেন প্রসেস করা, অর্ডার পরিচালনা করা এবং ZATCA-সম্মত ইনভয়েস তৈরি করা শিখুন।",
      estimatedTime: "৫ মিনিট",
      steps: [
        { title: "POS-এ নেভিগেট করুন", description: "পয়েন্ট অফ সেল সিস্টেম অ্যাক্সেস করতে সাইডবারে 'POS'-এ ক্লিক করুন।", tips: ["POS হল গ্রাহক অর্ডার এবং পেমেন্ট প্রসেস করার জন্য আপনার প্রধান ইন্টারফেস"] },
        { title: "মেনু আইটেম নির্বাচন করুন", description: "মেনু ক্যাটাগরি ব্রাউজ করুন এবং বর্তমান অর্ডারে যোগ করতে আইটেমে ক্লিক করুন। আইটেমগুলি ডানদিকে অর্ডার সারসংক্ষেপে প্রদর্শিত হবে।", tips: ["আপনি একই আইটেমের একাধিক পরিমাণ যোগ করতে পারেন", "প্রতিটি মেনু আইটেমের জন্য দৈনিক স্টক প্রাপ্যতা দেখানো হয়"] },
        { title: "টেবিল নম্বর সেট করুন", description: "টেবিল নম্বর সিলেক্টরে ক্লিক করুন এবং গ্রাহক যে টেবিলে বসেছেন তা নির্বাচন করুন। এটি অর্ডার সংগঠন এবং পরিষেবায় সহায়তা করে।" },
        { title: "অর্ডার বিবরণ পর্যালোচনা করুন", description: "সমস্ত আইটেম, পরিমাণ, স্বতন্ত্র মূল্য, উপ-মোট, 15% VAT, এবং SAR-এ মোট পরিমাণ দেখানো অর্ডার সারসংক্ষেপ পরীক্ষা করুন।", tips: ["সৌদি নিয়ম অনুসারে সমস্ত মূল্যে 15% VAT অন্তর্ভুক্ত রয়েছে", "আপনি চূড়ান্ত করার আগে আইটেম মুছতে পারেন"] },
        { title: "পেমেন্ট প্রসেস করুন", description: "পেমেন্ট পদ্ধতি (নগদ বা কার্ড) নির্বাচন করুন এবং লেনদেন প্রসেস করতে এবং রসিদ প্রিন্ট করতে 'অর্ডার সম্পূর্ণ করুন'-এ ক্লিক করুন।", tips: ["ZATCA-সম্মত রসিদ স্বয়ংক্রিয়ভাবে তৈরি হয়", "অর্ডারগুলি তাৎক্ষণিকভাবে রান্নাঘর প্রদর্শনে পাঠানো হয়"] }
      ]
    },
    {
      title: "ইনভেন্টরি ম্যানেজমেন্ট",
      description: "স্টক লেভেল ট্র্যাক করুন, উপাদান পরিচালনা করুন, এবং Excel আমদানি/রপ্তানি সমর্থন সহ কম-স্টক সতর্কতা পান।",
      estimatedTime: "৭ মিনিট",
      steps: [
        { title: "ইনভেন্টরি পেজ অ্যাক্সেস করুন", description: "আপনার সমস্ত উপাদান স্টক লেভেল দেখতে সাইডবার মেনু থেকে 'ইনভেন্টরি'-তে নেভিগেট করুন।" },
        { title: "নতুন উপাদান যোগ করুন", description: "'ইনভেন্টরি আইটেম যোগ করুন' বোতামে ক্লিক করুন, উপাদানের নাম, প্রাথমিক পরিমাণ, ইউনিট (kg, লিটার, টুকরো), এবং পুনঃঅর্ডার লেভেল প্রবেশ করুন। সেভ-এ ক্লিক করুন।", tips: ["স্টকআউট এড়াতে উপযুক্ত পুনঃঅর্ডার লেভেল সেট করুন", "ইউনিটগুলি আপনার ক্রয় অভ্যাসের সাথে মিলতে হবে"] },
        { title: "স্টক লেভেল মনিটর করুন", description: "ইনভেন্টরি টেবিল রঙ-কোডেড স্ট্যাটাস সূচক সহ বর্তমান স্টক দেখায়: সবুজ (পর্যাপ্ত), হলুদ (কম), লাল (সঙ্কটজনক)।", tips: ["কম স্টক আইটেম স্বয়ংক্রিয় সতর্কতা ট্রিগার করে", "পুনঃঅর্ডার প্রয়োজন এমন আইটেম দ্রুত খুঁজতে স্ট্যাটাস অনুসারে ফিল্টার করুন"] },
        { title: "ডেটা আমদানি/রপ্তানি করুন", description: "ইনভেন্টরি আইটেম বাল্ক আপলোড করতে 'Excel থেকে আমদানি করুন' ব্যবহার করুন, অথবা বিশ্লেষণের জন্য বর্তমান স্টক ডেটা ডাউনলোড করতে 'Excel-এ রপ্তানি করুন' ব্যবহার করুন।", tips: ["Excel আমদানি প্রাথমিক সেটআপের জন্য সময় বাঁচায়", "নিয়মিত রপ্তানি সরবরাহকারী অর্ডারিংয়ে সহায়তা করে"] },
        { title: "পুনর্বিন্যাসের জন্য ড্র্যাগ করুন", description: "যখন কোনো ফিল্টার সক্রিয় নেই, তখন আপনি সহজ অ্যাক্সেসের জন্য আপনার পছন্দের প্রদর্শন ক্রম কাস্টমাইজ করতে আইটেম ড্র্যাগ এবং ড্রপ করতে পারেন।", tips: ["ব্যবহারের ফ্রিকোয়েন্সি অনুসারে সংগঠিত করুন", "ফিল্টার সাফ হলে ড্র্যাগ হ্যান্ডেল প্রদর্শিত হয়"] }
      ]
    },
    {
      title: "মেনু ম্যানেজমেন্ট",
      description: "VAT-অন্তর্ভুক্ত মূল্য নির্ধারণ সহ মেনু আইটেম তৈরি করুন, রেসিপি সাথে লিঙ্ক করুন, এবং প্রাপ্যতা পরিচালনা করুন।",
      estimatedTime: "৬ মিনিট",
      steps: [
        { title: "মেনুতে নেভিগেট করুন", description: "মেনু আইটেম ম্যানেজমেন্ট অ্যাক্সেস করতে সাইডবারে 'মেনু'-তে ক্লিক করুন।", tips: ["স্বয়ংক্রিয় খরচ গণনার জন্য মেনু আইটেম রেসিপির সাথে লিঙ্ক করা হয়"] },
        { title: "মেনু আইটেম তৈরি করুন", description: "'মেনু আইটেম যোগ করুন'-এ ক্লিক করুন, নাম, ক্যাটাগরি, বেস মূল্য (VAT অন্তর্ভুক্ত) প্রবেশ করুন, এবং ঐচ্ছিকভাবে একটি রেসিপির সাথে লিঙ্ক করুন।", tips: ["বেস মূল্য স্বয়ংক্রিয়ভাবে 15% VAT অন্তর্ভুক্ত করে", "রেসিপি লিঙ্ক করা লাভের মার্জিন বিশ্লেষণ সক্ষম করে"] },
        { title: "ছাড় সেট করুন", description: "যদি প্রচার চালাচ্ছেন তবে ছাড়ের শতাংশ প্রবেশ করুন। চূড়ান্ত মূল্য স্বয়ংক্রিয়ভাবে গণনা করা হয়।", tips: ["ছাড় নির্দিষ্ট আইটেম বিক্রয় বাড়াতে সহায়তা করে"] },
        { title: "ছবি আপলোড করুন", description: "মেনু উপস্থাপনা উন্নত করতে খাবারের একটি আকর্ষণীয় ছবি যোগ করুন।", tips: ["উচ্চ-মানের ছবি গ্রাহক আগ্রহ বৃদ্ধি করে"] },
        { title: "প্রাপ্যতা টগল করুন", description: "উপাদান স্টক বা মৌসুমী পরিবর্তনের উপর ভিত্তি করে POS থেকে আইটেম দেখান/লুকান করতে প্রাপ্যতা সুইচ ব্যবহার করুন।", tips: ["মূল উপাদান শেষ হলে আইটেম অক্ষম করুন"] },
        { title: "পুনর্বিন্যাসের জন্য ড্র্যাগ করুন", description: "POS সিস্টেমে প্রদর্শন ক্রম সেট করতে মেনু আইটেম ড্র্যাগ করুন।", tips: ["দ্রুত অর্ডার প্রসেসিংয়ের জন্য জনপ্রিয় আইটেম প্রথমে রাখুন"] }
      ]
    },
    {
      title: "রেসিপি ম্যানেজমেন্ট",
      description: "উপাদান সহ রেসিপি সংজ্ঞায়িত করুন, স্বয়ংক্রিয়ভাবে খরচ ট্র্যাক করুন, এবং লাভজনকতা অপ্টিমাইজ করুন।",
      estimatedTime: "৮ মিনিট",
      steps: [
        { title: "রেসিপি অ্যাক্সেস করুন", description: "আপনার সমস্ত খাবারের রেসিপি দেখতে এবং পরিচালনা করতে সাইডবারে 'রেসিপি'-তে ক্লিক করুন।", tips: ["রেসিপি খরচ ট্র্যাকিংয়ের জন্য মেনু আইটেম ইনভেন্টরির সাথে লিঙ্ক করে"] },
        { title: "নতুন রেসিপি তৈরি করুন", description: "'রেসিপি যোগ করুন'-এ ক্লিক করুন, রেসিপির নাম, প্রস্তুতি সময়, রান্নার সময়, এবং পরিবেশনের সংখ্যা প্রবেশ করুন।", tips: ["রান্নাঘর ওয়ার্কফ্লো পরিকল্পনায় সঠিক সময় সাহায্য করে"] },
        { title: "উপাদান যোগ করুন", description: "ইনভেন্টরি আইটেম নির্বাচন করুন এবং রেসিপিতে প্রতিটি উপাদানের জন্য প্রয়োজনীয় পরিমাণ উল্লেখ করুন।", tips: ["সঠিক খরচ গণনার জন্য সুনির্দিষ্ট পরিমাপ ব্যবহার করুন"] },
        { title: "নির্দেশাবলী লিখুন", description: "রান্নাঘরের কর্মীদের জন্য ধাপে ধাপে রান্নার নির্দেশাবলী যোগ করুন।", tips: ["স্পষ্ট নির্দেশাবলী সামঞ্জস্যপূর্ণ খাবারের মান নিশ্চিত করে"] },
        { title: "খরচ পর্যালোচনা করুন", description: "সিস্টেম বর্তমান উপাদান মূল্যের উপর ভিত্তি করে মোট রেসিপি খরচ স্বয়ংক্রিয়ভাবে গণনা করে।", tips: ["ইনভেন্টরি মূল্য পরিবর্তন হলে রেসিপি খরচ আপডেট হয়"] },
        { title: "মেনুর সাথে লিঙ্ক করুন", description: "মেনু আইটেম তৈরি করার সময়, স্বয়ংক্রিয় খরচ এবং লাভ ট্র্যাকিং সক্ষম করতে এই রেসিপি নির্বাচন করুন।", tips: ["একটি রেসিপি একাধিক মেনু বৈচিত্র্যের জন্য ব্যবহার করা যেতে পারে"] },
        { title: "প্রয়োজন অনুযায়ী আপডেট করুন", description: "গ্রাহক প্রতিক্রিয়ার উপর ভিত্তি করে রেসিপি পরিমার্জন করার সময় উপাদানের পরিমাণ সমন্বয় করুন।", tips: ["নিয়মিত আপডেট সঠিক লাভজনকতা ডেটা নিশ্চিত করে"] },
        { title: "পুনর্বিন্যাসের জন্য ড্র্যাগ করুন", description: "আপনার পছন্দের ক্রমে সংগঠিত করতে রেসিপি ড্র্যাগ করুন।", tips: ["সহজ ম্যানেজমেন্টের জন্য অনুরূপ রেসিপি একসাথে গ্রুপ করুন"] }
      ]
    },
    {
      title: "গ্রাহক ম্যানেজমেন্ট",
      description: "গ্রাহক ডাটাবেস তৈরি করুন, ক্রয়ের ইতিহাস ট্র্যাক করুন, এবং গ্রাহক সম্পর্ক উন্নত করুন।",
      estimatedTime: "৫ মিনিট",
      steps: [
        { title: "গ্রাহক অ্যাক্সেস করুন", description: "আপনার গ্রাহক ডাটাবেস দেখতে সাইডবারে 'গ্রাহক'-এ ক্লিক করুন।", tips: ["গ্রাহক ডেটা সেবা ব্যক্তিগতকরণে সাহায্য করে"] },
        { title: "নতুন গ্রাহক যোগ করুন", description: "'গ্রাহক যোগ করুন'-এ ক্লিক করুন, নাম, ইমেল, ফোন এবং ঠিকানা তথ্য প্রবেশ করুন।", tips: ["প্রথম দর্শনের সময় গ্রাহক তথ্য সংগ্রহ করুন", "গোপনীয়তা নিয়ম মান্য করুন"] },
        { title: "গ্রাহক খুঁজুন", description: "নাম, ইমেল বা ফোন নম্বর দ্বারা দ্রুত গ্রাহক খুঁজতে সার্চ বার ব্যবহার করুন।", tips: ["দ্রুত সার্চ চেকআউট প্রক্রিয়া ত্বরান্বিত করে"] },
        { title: "ক্রয়ের ইতিহাস দেখুন", description: "তাদের সম্পূর্ণ অর্ডার ইতিহাস এবং পছন্দ দেখতে যেকোনো গ্রাহকে ক্লিক করুন।", tips: ["ব্যক্তিগত সুপারিশের জন্য ইতিহাস ব্যবহার করুন"] },
        { title: "তথ্য আপডেট করুন", description: "যোগাযোগের তথ্য বর্তমান রাখতে প্রয়োজন অনুযায়ী গ্রাহক বিবরণ সম্পাদনা করুন।", tips: ["নিয়মিত আপডেট যোগাযোগ উন্নত করে"] }
      ]
    },
    {
      title: "অর্ডার প্রসেসিং",
      description: "রান্নাঘর সমন্বয়ের সাথে স্থাপনা থেকে সরবরাহ পর্যন্ত গ্রাহক অর্ডার পরিচালনা করুন।",
      estimatedTime: "৬ মিনিট",
      steps: [
        { title: "সমস্ত অর্ডার দেখুন", description: "তাদের বর্তমান স্ট্যাটাস সহ সমস্ত অর্ডার দেখতে সাইডবারে 'অর্ডার'-এ ক্লিক করুন।", tips: ["রঙ-কোডেড স্ট্যাটাস জরুরি অর্ডার সনাক্ত করতে সাহায্য করে"] },
        { title: "অর্ডার বিবরণ পরীক্ষা করুন", description: "আইটেম, পরিমাণ, টেবিল নম্বর, মোট পরিমাণ এবং টাইমস্ট্যাম্প দেখতে যেকোনো অর্ডারে ক্লিক করুন।", tips: ["সমস্ত অর্ডার তথ্য দ্রুত পর্যালোচনার জন্য সংগঠিত"] },
        { title: "স্ট্যাটাস আপডেট করুন", description: "অর্ডার অগ্রগতির সাথে অর্ডার স্ট্যাটাস পরিবর্তন করুন: মুলতুবি → প্রস্তুতিতে → প্রস্তুত → সরবরাহকৃত।", tips: ["স্ট্যাটাস আপডেট রান্নাঘর এবং সেবা কর্মীদের সমন্বয়ে সাহায্য করে"] },
        { title: "অর্ডার ফিল্টার করুন", description: "ভালো সংগঠনের জন্য স্ট্যাটাস, তারিখ পরিসীমা বা টেবিল নম্বর অনুসারে অর্ডার দেখতে ফিল্টার ব্যবহার করুন।", tips: ["তারিখ ফিল্টার দৈনিক কর্মক্ষমতা বিশ্লেষণে সাহায্য করে"] },
        { title: "রান্নাঘর ডিসপ্লে", description: "বাস্তব সময়ে প্রস্তুত হচ্ছে এমন সক্রিয় অর্ডার দেখতে রান্নাঘর ডিসপ্লে মোডে স্যুইচ করুন।", tips: ["রান্নাঘরের কর্মীরা আইটেম সম্পূর্ণ হিসেবে চিহ্নিত করতে পারে"] },
        { title: "সময় ট্র্যাক করুন", description: "রান্নাঘরের বাধা চিহ্নিত এবং সমাধান করতে অর্ডার সমাপ্তি সময় নিরীক্ষণ করুন।", tips: ["দ্রুত অর্ডার সময় গ্রাহক সন্তুষ্টি উন্নত করে"] }
      ]
    },
    {
      title: "অ্যানালিটিক্স ড্যাশবোর্ড",
      description: "দিন-দিন, সপ্তাহ-সপ্তাহ, মাস-মাস তুলনা সহ ব্যবসায়িক কর্মক্ষমতা মনিটর করুন।",
      estimatedTime: "৫ মিনিট",
      steps: [
        { title: "ড্যাশবোর্ড খুলুন", description: "আপনার অ্যানালিটিক্স ওভারভিউ দেখতে সাইডবারে 'ড্যাশবোর্ড'-এ ক্লিক করুন।", tips: ["ড্যাশবোর্ড বাস্তব সময় ব্যবসায়িক অন্তর্দৃষ্টি প্রদান করে"] },
        { title: "মূল মেট্রিক্স পর্যালোচনা করুন", description: "আজকের রাজস্ব, অর্ডার সংখ্যা, গড় অর্ডার মূল্য এবং গ্রাহক সংখ্যা পরীক্ষা করুন।", tips: ["বৃদ্ধি ট্র্যাক করতে আগের সময়কালের সাথে তুলনা করুন"] },
        { title: "প্রবণতা বিশ্লেষণ করুন", description: "বৃদ্ধির প্যাটার্ন বা সমস্যা চিহ্নিত করতে শতাংশ পরিবর্তন (DoD, WoW, MoM, YoY) পর্যালোচনা করুন।", tips: ["সবুজ ইতিবাচক প্রবণতা নির্দেশ করে, লাল মনোযোগ প্রয়োজন এমন এলাকা দেখায়"] },
        { title: "পিক আওয়ার পরীক্ষা করুন", description: "আপনার রেস্তোরাঁ কখন সবচেয়ে ব্যস্ত তা বুঝতে ঘণ্টা ভিত্তিক বিক্রয় চার্ট দেখুন।", tips: ["কর্মীদের সময়সূচীর জন্য পিক আওয়ার ডেটা ব্যবহার করুন"] },
        { title: "শীর্ষ আইটেম মনিটর করুন", description: "ইনভেন্টরি এবং প্রচার অপ্টিমাইজ করতে কোন মেনু আইটেম সেরা বিক্রি হচ্ছে দেখুন।", tips: ["উচ্চ-কর্মক্ষমতা আইটেমে ফোকাস করুন"] }
      ]
    },
    {
      title: "বিক্রয় বিশ্লেষণ",
      description: "বিস্তারিত রিপোর্ট সহ ক্যাটাগরি, পেমেন্ট পদ্ধতি এবং সময়কাল অনুসারে বিক্রয় বিশ্লেষণ করুন।",
      estimatedTime: "৬ মিনিট",
      steps: [
        { title: "বিক্রয় অ্যাক্সেস করুন", description: "বিক্রয় বিশ্লেষণ পেজ খুলতে সাইডবারে 'বিক্রয়'-এ ক্লিক করুন।", tips: ["বিক্রয় ডেটা কৌশলগত সিদ্ধান্ত চালিত করে"] },
        { title: "তারিখ পরিসীমা নির্বাচন করুন", description: "তারিখ পিকার ব্যবহার করে বিশ্লেষণ করার জন্য সময়কাল নির্বাচন করুন।", tips: ["প্রবণতা চিহ্নিত করতে বিভিন্ন সময়কাল তুলনা করুন"] },
        { title: "রাজস্ব চার্ট দেখুন", description: "দৈনিক, সাপ্তাহিক বা মাসিক প্যাটার্ন দেখানো ভিজ্যুয়াল চার্ট সহ রাজস্ব প্রবণতা বিশ্লেষণ করুন।", tips: ["চার্ট ডেটা বোঝা সহজ করে"] },
        { title: "ক্যাটাগরি বিভাজন", description: "কোন মেনু ক্যাটাগরি সবচেয়ে বেশি রাজস্ব এবং লাভ উৎপন্ন করে দেখুন।", tips: ["ক্যাটাগরি কর্মক্ষমতার উপর ভিত্তি করে মেনু অপ্টিমাইজ করুন"] },
        { title: "পেমেন্ট পদ্ধতি", description: "আর্থিক পরিকল্পনার জন্য নগদ এবং কার্ড পেমেন্টের মধ্যে বিভাজন পর্যালোচনা করুন।", tips: ["সময়ের সাথে পেমেন্ট প্রবণতা ট্র্যাক করুন"] },
        { title: "রিপোর্ট রপ্তানি করুন", description: "অ্যাকাউন্টিং উদ্দেশ্যে বিস্তারিত বিক্রয় রিপোর্ট তৈরি এবং ডাউনলোড করুন।", tips: ["নিয়মিত রপ্তানি ট্যাক্স সম্মতি সমর্থন করে"] }
      ]
    },
    {
      title: "লাভজনকতা বিশ্লেষণ",
      description: "ডেটা-চালিত সিদ্ধান্তের জন্য লাভের মার্জিন, মূল্য কৌশল এবং খরচ কাঠামো বিশ্লেষণ করুন।",
      estimatedTime: "৭ মিনিট",
      steps: [
        { title: "লাভজনকতা খুলুন", description: "লাভজনকতা বিশ্লেষণ সরঞ্জাম অ্যাক্সেস করতে সাইডবারে 'লাভজনকতা'-তে ক্লিক করুন।", tips: ["বৃদ্ধির জন্য মার্জিন বোঝা গুরুত্বপূর্ণ"] },
        { title: "কৌশলগত ওভারভিউ", description: "এক নজরে সামগ্রিক লাভ মার্জিন, মোট রাজস্ব এবং খরচ পর্যালোচনা করুন।", tips: ["সময়ের সাথে মার্জিন প্রবণতা ট্র্যাক করুন"] },
        { title: "মূল্য নির্ধারণ বিশ্লেষণ", description: "লাভ মার্জিন রেঞ্জ অনুসারে বিস্তারিত মূল্য কভারেজ দেখতে 'মূল্য বিশ্লেষণ' ট্যাবে ক্লিক করুন।", tips: ["পুনঃমূল্য প্রয়োজন এমন কম-মার্জিন আইটেম চিহ্নিত করুন"] },
        { title: "মেনু আইটেম বিশ্লেষণ", description: "খরচ, মূল্য, মার্জিন % এবং মোট লাভ সহ প্রতিটি আইটেমের জন্য লাভজনকতা দেখুন।", tips: ["সবচেয়ে/সবচেয়ে কম লাভজনক আইটেম খুঁজতে মার্জিন অনুসারে সাজান"] },
        { title: "খরচ ম্যানেজমেন্ট", description: "উপাদান খরচ বিশ্লেষণ এবং বর্জ্য কমাতে 'খরচ ম্যানেজমেন্ট' ট্যাবে স্যুইচ করুন।", tips: ["ভালো ইনভেন্টরি ম্যানেজমেন্ট খরচ কমায়"] },
        { title: "স্কেলিং সম্ভাব্যতা", description: "কোন আইটেম প্রচারের যোগ্য তা দেখতে 'স্কেলিং সম্ভাব্যতা' ট্যাব পরীক্ষা করুন।", tips: ["উচ্চ-মার্জিন, উচ্চ-ভলিউম আইটেমে ফোকাস করুন"] },
        { title: "মূল্য সমন্বয় করুন", description: "মেনু মূল্য অপ্টিমাইজ এবং সামগ্রিক লাভজনকতা উন্নত করতে অন্তর্দৃষ্টি ব্যবহার করুন।", tips: ["ছোট মূল্য পরিবর্তন বড় প্রভাব ফেলতে পারে"] }
      ]
    },
    {
      title: "চাহিদা পূর্বাভাস",
      description: "ইনভেন্টরি এবং কর্মী অপ্টিমাইজ করতে ঐতিহাসিক ডেটা ব্যবহার করে ভবিষ্যৎ চাহিদা পূর্বাভাস করুন।",
      estimatedTime: "৫ মিনিট",
      steps: [
        { title: "পূর্বাভাস অ্যাক্সেস করুন", description: "চাহিদা পূর্বাভাস দেখতে সাইডবারে 'পূর্বাভাস'-এ ক্লিক করুন।", tips: ["পূর্বাভাস বর্জ্য এবং স্টকআউট কমায়"] },
        { title: "ভবিষ্যৎ তারিখ নির্বাচন করুন", description: "তারিখ পিকার ব্যবহার করে যে তারিখের জন্য আপনি চাহিদা পূর্বাভাস করতে চান তা নির্বাচন করুন।", tips: ["দৈনিক পূর্বাভাস ইনভেন্টরি ক্রয় অপ্টিমাইজ করে"] },
        { title: "পূর্বাভাস পর্যালোচনা করুন", description: "ঐতিহাসিক বিক্রয় প্যাটার্নের উপর ভিত্তি করে প্রতিটি মেনু আইটেমের জন্য পূর্বাভাসিত পরিমাণ দেখুন।", tips: ["আরো ডেটা সহ নির্ভুলতা উন্নত হয়"] },
        { title: "ইনভেন্টরি পরিকল্পনা করুন", description: "সরবরাহকারীদের থেকে কতটা ইনভেন্টরি অর্ডার করতে হবে তা নির্ধারণ করতে পূর্বাভাস ব্যবহার করুন।", tips: ["অপ্রত্যাশিত চাহিদার জন্য নিরাপত্তা মার্জিন যোগ করুন"] },
        { title: "কর্মী সময়সূচী", description: "প্রত্যাশিত গ্রাহক ভলিউমের জন্য উপযুক্ত কর্মী স্তর পরিকল্পনায় পূর্বাভাস সাহায্য করে।", tips: ["পূর্বাভাসিত ব্যস্ত সময়ের সাথে কর্মী ম্যাচ করুন"] }
      ]
    },
    {
      title: "ইনভয়েস ম্যানেজমেন্ট",
      description: "QR কোড এবং সঠিক VAT গণনা সহ ZATCA-সম্মত দ্বিভাষিক ইনভয়েস অ্যাক্সেস করুন।",
      estimatedTime: "৫ মিনিট",
      steps: [
        { title: "ইনভয়েস খুলুন", description: "সমস্ত তৈরি ইনভয়েস দেখতে সাইডবারে 'ইনভয়েস'-এ ক্লিক করুন।", tips: ["প্রতিটি বিক্রয়ের জন্য ইনভয়েস স্বয়ংক্রিয়ভাবে তৈরি হয়"] },
        { title: "ইনভয়েস খুঁজুন", description: "নম্বর, গ্রাহকের নাম বা তারিখ দ্বারা ইনভয়েস খুঁজতে সার্চ বক্স ব্যবহার করুন।", tips: ["দ্রুত সার্চ গ্রাহক জিজ্ঞাসায় সাহায্য করে"] },
        { title: "ইনভয়েস বিবরণ দেখুন", description: "সম্পূর্ণ বিবরণ দেখতে যেকোনো ইনভয়েসে ক্লিক করুন: আইটেম, পরিমাণ, মূল্য, VAT এবং মোট।", tips: ["সমস্ত ইনভয়েস ZATCA-সম্মত"] },
        { title: "PDF ডাউনলোড করুন", description: "QR কোড সহ দ্বিভাষিক (আরবি/ইংরেজি) PDF ইনভয়েস পেতে 'ডাউনলোড'-এ ক্লিক করুন।", tips: ["QR কোড ডিজিটাল যাচাইকরণ সক্ষম করে"] },
        { title: "সম্মতি যাচাই করুন", description: "নিশ্চিত করুন যে ইনভয়েস অন্তর্ভুক্ত করে: VAT নম্বর, QR কোড এবং দ্বিভাষিক পাঠ্য।", tips: ["সম্মতি স্বয়ংক্রিয়"] }
      ]
    },
    {
      title: "আর্থিক রিপোর্ট",
      description: "রাজস্ব, ব্যয় এবং লাভ/ক্ষতি সহ বিস্তৃত আর্থিক বিবৃতি তৈরি করুন।",
      estimatedTime: "৬ মিনিট",
      steps: [
        { title: "ফিন্যান্স অ্যাক্সেস করুন", description: "আর্থিক রিপোর্টিং খুলতে সাইডবারে 'ফিন্যান্স'-এ ক্লিক করুন।", tips: ["আর্থিক রিপোর্ট সম্পূর্ণ ব্যবসায়িক ওভারভিউ প্রদান করে"] },
        { title: "সময়কাল নির্বাচন করুন", description: "তারিখ পিকার ব্যবহার করে আপনার আর্থিক রিপোর্টের জন্য তারিখ পরিসীমা নির্বাচন করুন।", tips: ["মাসিক রিপোর্ট অগ্রগতি ট্র্যাক করে, বার্ষিক ট্যাক্সের জন্য"] },
        { title: "রাজস্ব পর্যালোচনা করুন", description: "বিক্রয় ক্যাটাগরি এবং পেমেন্ট পদ্ধতি অনুসারে বিভক্ত মোট রাজস্ব দেখুন।", tips: ["সময়কাল জুড়ে রাজস্ব তুলনা করুন"] },
        { title: "ব্যয় পরীক্ষা করুন", description: "ইনভেন্টরি, বেতন এবং দোকান বিল সহ সমস্ত ব্যয় দেখুন।", tips: ["শ্রেণীবদ্ধ ব্যয় খরচ সঞ্চয় সুযোগ প্রকাশ করে"] },
        { title: "লাভ ও ক্ষতি", description: "রাজস্ব থেকে সমস্ত ব্যয় বিয়োগ করার পরে নিট লাভ পর্যালোচনা করুন।", tips: ["মাসিক লাভ মার্জিন মনিটর করুন"] },
        { title: "PDF রপ্তানি করুন", description: "একটি পেশাদার আর্থিক বিবৃতি তৈরি করতে 'PDF রপ্তানি করুন'-এ ক্লিক করুন।", tips: ["ট্যাক্স ফাইলিংয়ের জন্য হিসাবরক্ষকদের সাথে শেয়ার করুন"] }
      ]
    },
    {
      title: "ডেলিভারি অ্যাপস ম্যানেজমেন্ট",
      description: "ডেলিভারি প্ল্যাটফর্ম কনফিগার করুন, 15% VAT সহ কমিশন পরিচালনা করুন, ভর্তুকি স্তর ট্র্যাক করুন, এবং অ্যাপ জুড়ে লাভজনকতা বিশ্লেষণ করুন।",
      estimatedTime: "৮ মিনিট",
      steps: [
        { title: "ডেলিভারি অ্যাপস অ্যাক্সেস করুন", description: "সমস্ত কনফিগার করা ডেলিভারি প্ল্যাটফর্ম দেখতে সাইডবারে 'ডেলিভারি অ্যাপস'-এ ক্লিক করুন।", tips: ["একটি ড্যাশবোর্ড থেকে একাধিক প্ল্যাটফর্ম পরিচালনা করুন"] },
        { title: "ডেলিভারি প্ল্যাটফর্ম যোগ করুন", description: "'ডেলিভারি অ্যাপ যোগ করুন'-এ ক্লিক করুন, প্ল্যাটফর্মের নাম (UberEats, HungerStation, Jahez ইত্যাদি), কমিশন শতাংশ, ব্যাংকিং ফি শতাংশ এবং POS ফি (SAR) প্রবেশ করুন।", tips: ["সমস্ত ফি গণনায় স্বয়ংক্রিয়ভাবে 15% VAT অন্তর্ভুক্ত করে", "কমিশন সূত্র: (ফলাফল1 + ফলাফল2 + ফলাফল3) × 1.15"] },
        { title: "ভর্তুকি স্তর কনফিগার করুন", description: "ন্যূনতম/সর্বোচ্চ অর্ডার পরিমাণ এবং ভর্তুকি মান সহ 3 টি ভর্তুকি স্তর সেট আপ করুন। ভর্তুকি আপনার নিট রাজস্বে যোগ করা হয়।", tips: ["স্তরগুলি প্ল্যাটফর্ম প্রচার পরিচালনায় সাহায্য করে", "সীমাহীন পরিসীমার জন্য সর্বোচ্চ খালি রাখা যেতে পারে", "প্রতিটি স্তর minAmount < maxAmount পূরণ করতে হবে"] },
        { title: "অ্যাপ সক্ষম/অক্ষম করুন", description: "তাদের কনফিগারেশন মুছে না দিয়ে ডেলিভারি প্ল্যাটফর্ম সক্ষম বা অক্ষম করতে 'সক্রিয়' টগল ব্যবহার করুন।", tips: ["রক্ষণাবেক্ষণ বা চুক্তি পরিবর্তনের সময় অ্যাপ অক্ষম করুন"] },
        { title: "অ্যাপ অনুসারে অর্ডার ট্র্যাক করুন", description: "ডেলিভারি অ্যাপ ফিল্টার ব্যবহার করে অর্ডার পেজে প্রতিটি ডেলিভারি প্ল্যাটফর্ম থেকে আসা অর্ডার দেখুন।", tips: ["সময়ের সাথে প্ল্যাটফর্ম কর্মক্ষমতা ট্র্যাক করুন"] },
        { title: "লাভজনকতা বিশ্লেষণ করুন", description: "সমস্ত ডেলিভারি অ্যাপ জুড়ে রাজস্ব, খরচ (কমিশন, ব্যাংকিং ফি, VAT সহ POS ফি), এবং লাভ তুলনা করতে অ্যানালিটিক্সের অধীনে 'লাভজনকতা বিশ্লেষণ'-এ নেভিগেট করুন।", tips: ["চার্ট দেখায় কোন প্ল্যাটফর্ম সবচেয়ে লাভজনক", "প্রতি অ্যাপ বিস্তারিত খরচ বিভাজন দেখুন"] },
        { title: "খরচ সূত্র পর্যালোচনা করুন", description: "খরচ গণনা বুঝুন: কমিশন = (মূল্য - ভর্তুকি) × %, ব্যাংকিং ফি = মূল্য × %, তারপর মোট = (কমিশন + ব্যাংকিং + POS) × 1.15 VAT-এর জন্য।", tips: ["ভর্তুকি আপনার নিট রাজস্ব বৃদ্ধি করে", "সমস্ত ফি স্বয়ংক্রিয়ভাবে VAT অন্তর্ভুক্ত করে"] },
        { title: "কৌশল অপ্টিমাইজ করুন", description: "ভাল রেট আলোচনা করতে বা সবচেয়ে লাভজনক প্ল্যাটফর্মে ফোকাস করতে লাভজনকতা ডেটা ব্যবহার করুন।", tips: ["রাজস্বের বিপরীতে আইটেম খরচ (COGS) তুলনা করুন", "প্রতি প্ল্যাটফর্ম মার্জিন মনিটর করুন"] }
      ]
    }
  ]
};

// For languages without full translations, use English as fallback
Object.keys(tutorialContent).forEach((lang) => {
  if (tutorialContent[lang as Language].length === 0) {
    tutorialContent[lang as Language] = tutorialContent.en;
  }
});
