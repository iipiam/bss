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
  Receipt
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

type Language = 'en' | 'ar' | 'zh' | 'de' | 'hi' | 'ur' | 'bn';

const tutorialMetadata = {
  icons: [ShoppingCart, Package, UtensilsCrossed, ChefHat, UserCircle, ClipboardList, BarChart3, DollarSign, Calculator, TrendingUp, FileCheck, Receipt],
  images: [posImage, inventoryImage, menuImage, recipesImage, customersImage, ordersImage, dashboardImage, salesImage, profitabilityImage, forecastingImage, invoicesImage, financialImage],
  screenshots: [posScreenshot, inventoryScreenshot, menuScreenshot, recipeScreenshot, customerScreenshot, orderScreenshot, analyticsScreenshot, salesScreenshot, profitabilityScreenshot, forecastingScreenshot, invoiceScreenshot, financialScreenshot],
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
    "from-blue-500 to-purple-500"
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
    }
  ],

  // For remaining languages, provide simplified English versions
  // In production, these would be fully translated
  zh: [], // Chinese translations would go here
  de: [], // German translations would go here
  hi: [], // Hindi translations would go here
  ur: [], // Urdu translations would go here
  bn: []  // Bengali translations would go here
};

// For languages without full translations, use English as fallback
Object.keys(tutorialContent).forEach((lang) => {
  if (tutorialContent[lang as Language].length === 0) {
    tutorialContent[lang as Language] = tutorialContent.en;
  }
});
