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
  Truck,
  Users,
  Wallet,
  Headphones,
  MessageSquare,
  FileWarning,
  Printer
} from "lucide-react";

// Use placeholder URLs for production builds - avoids asset dependency
const posImage = "https://images.unsplash.com/photo-1556742049-0cfed4f6a45d?w=600&q=80";
const inventoryImage = "https://images.unsplash.com/photo-1586528116311-ad8dd3c8310d?w=600&q=80";
const menuImage = "https://images.unsplash.com/photo-1414235077428-338989a2e8c0?w=600&q=80";
const recipesImage = "https://images.unsplash.com/photo-1466637574441-749b8f19452f?w=600&q=80";
const customersImage = "https://images.unsplash.com/photo-1517248135467-4c7edcad34c4?w=600&q=80";
const ordersImage = "https://images.unsplash.com/photo-1504674900247-0877df9cc836?w=600&q=80";
const dashboardImage = "https://images.unsplash.com/photo-1551288049-bebda4e38f71?w=600&q=80";
const salesImage = "https://images.unsplash.com/photo-1460925895917-afdab827c52f?w=600&q=80";
const profitabilityImage = "https://images.unsplash.com/photo-1554224155-6726b3ff858f?w=600&q=80";
const forecastingImage = "https://images.unsplash.com/photo-1551288049-bebda4e38f71?w=600&q=80";
const invoicesImage = "https://images.unsplash.com/photo-1554224154-26032ffc0d07?w=600&q=80";
const financialImage = "https://images.unsplash.com/photo-1554224155-6726b3ff858f?w=600&q=80";
const deliveryAppsImage = "https://images.unsplash.com/photo-1526367790999-0150786686a2?w=600&q=80";

const posScreenshot = "https://images.unsplash.com/photo-1556742049-0cfed4f6a45d?w=800&q=80";
const inventoryScreenshot = "https://images.unsplash.com/photo-1586528116311-ad8dd3c8310d?w=800&q=80";
const menuScreenshot = "https://images.unsplash.com/photo-1414235077428-338989a2e8c0?w=800&q=80";
const recipeScreenshot = "https://images.unsplash.com/photo-1466637574441-749b8f19452f?w=800&q=80";
const customerScreenshot = "https://images.unsplash.com/photo-1517248135467-4c7edcad34c4?w=800&q=80";
const orderScreenshot = "https://images.unsplash.com/photo-1504674900247-0877df9cc836?w=800&q=80";
const analyticsScreenshot = "https://images.unsplash.com/photo-1551288049-bebda4e38f71?w=800&q=80";
const salesScreenshot = "https://images.unsplash.com/photo-1460925895917-afdab827c52f?w=800&q=80";
const profitabilityScreenshot = "https://images.unsplash.com/photo-1554224155-6726b3ff858f?w=800&q=80";
const forecastingScreenshot = "https://images.unsplash.com/photo-1551288049-bebda4e38f71?w=800&q=80";
const invoiceScreenshot = "https://images.unsplash.com/photo-1554224154-26032ffc0d07?w=800&q=80";
const financialScreenshot = "https://images.unsplash.com/photo-1554224155-6726b3ff858f?w=800&q=80";
const deliveryAppsScreenshot = "https://images.unsplash.com/photo-1526367790999-0150786686a2?w=800&q=80";

type Language = 'en' | 'ar' | 'zh' | 'de' | 'hi' | 'ur' | 'bn' | 'it' | 'es' | 'tl';

export type TutorialBusinessType =
  | 'restaurant'
  | 'factory'
  | 'real_estate'
  | 'design_services'
  | 'installation_services'
  | 'it_services';

const ALL_BUSINESS_TYPES: TutorialBusinessType[] = [
  'restaurant', 'factory', 'real_estate',
  'design_services', 'installation_services', 'it_services',
];
const SERVICE_BUSINESS_TYPES: TutorialBusinessType[] = [
  'design_services', 'installation_services', 'it_services',
];

// Which tutorial indices apply to which business types. Index aligns with the
// `tutorialContent[language]` array (0..18). Topics that don't fit a business
// type are hidden in the tutorial gallery for that account.
const tutorialBusinessTypes: TutorialBusinessType[][] = [
  ['restaurant'],                                  // 0  Point of Sale (POS)
  ['restaurant', 'factory'],                       // 1  Inventory Management
  ['restaurant', 'factory'],                       // 2  Menu / Products Management
  ['restaurant', 'factory'],                       // 3  Recipe / Production Recipe Management
  ALL_BUSINESS_TYPES,                              // 4  Customer Management
  ['restaurant', 'factory'],                       // 5  Order Processing
  ALL_BUSINESS_TYPES,                              // 6  Analytics Dashboard
  ALL_BUSINESS_TYPES,                              // 7  Sales Analytics
  ['restaurant', 'factory'],                       // 8  Profitability (menu/product profitability)
  ['restaurant', 'factory'],                       // 9  Demand Forecasting
  ALL_BUSINESS_TYPES,                              // 10 Invoice Management (ZATCA)
  ALL_BUSINESS_TYPES,                              // 11 Financial Reports
  ['restaurant'],                                  // 12 Delivery Apps Management
  ALL_BUSINESS_TYPES,                              // 13 Employee Management
  ALL_BUSINESS_TYPES,                              // 14 Bills & Expenses
  ALL_BUSINESS_TYPES,                              // 15 Support Tickets
  ALL_BUSINESS_TYPES,                              // 16 Team Chat
  ALL_BUSINESS_TYPES,                              // 17 Violations Management
  ['restaurant', 'factory'],                       // 18 Printer Configuration
];

const tutorialMetadata = {
  icons: [ShoppingCart, Package, UtensilsCrossed, ChefHat, UserCircle, ClipboardList, BarChart3, DollarSign, Calculator, TrendingUp, FileCheck, Receipt, Truck, Users, Wallet, Headphones, MessageSquare, FileWarning, Printer],
  images: [posImage, inventoryImage, menuImage, recipesImage, customersImage, ordersImage, dashboardImage, salesImage, profitabilityImage, forecastingImage, invoicesImage, financialImage, deliveryAppsImage, deliveryAppsImage, deliveryAppsImage, deliveryAppsImage, deliveryAppsImage, deliveryAppsImage, deliveryAppsImage],
  screenshots: [posScreenshot, inventoryScreenshot, menuScreenshot, recipeScreenshot, customerScreenshot, orderScreenshot, analyticsScreenshot, salesScreenshot, profitabilityScreenshot, forecastingScreenshot, invoiceScreenshot, financialScreenshot, deliveryAppsScreenshot, deliveryAppsScreenshot, deliveryAppsScreenshot, deliveryAppsScreenshot, deliveryAppsScreenshot, deliveryAppsScreenshot, deliveryAppsScreenshot],
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
    "from-orange-500 to-red-500",
    "from-indigo-500 to-blue-500",
    "from-rose-500 to-pink-500",
    "from-teal-500 to-cyan-500",
    "from-fuchsia-500 to-purple-500",
    "from-red-500 to-orange-500",
    "from-slate-500 to-gray-500"
  ]
};

export const getTutorialsByLanguage = (
  language: Language,
  t: any,
  businessType?: TutorialBusinessType,
): Tutorial[] => {
  const content = tutorialContent[language] || tutorialContent.en;

  return content
    .map((tutorial, index) => ({
      ...tutorial,
      icon: tutorialMetadata.icons[index],
      image: tutorialMetadata.images[index],
      screenshot: tutorialMetadata.screenshots[index],
      gradient: tutorialMetadata.gradients[index],
      _businessTypes: tutorialBusinessTypes[index] || ALL_BUSINESS_TYPES,
    }))
    .filter((tutorial) => {
      if (!businessType) return true;
      return tutorial._businessTypes.includes(businessType);
    })
    .map(({ _businessTypes, ...rest }) => rest);
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
    },
    {
      title: "Employee Management",
      description: "Manage team members, set roles with granular permissions, and track employee performance.",
      estimatedTime: "6 minutes",
      steps: [
        { title: "Navigate to Employees", description: "Click 'Employees' in the sidebar to access the employee management system.", tips: ["Employee management is essential for organizing your team and tracking performance"] },
        { title: "Add New Employee", description: "Click 'Add Employee', enter name, role, salary, and contact information to create a new team member profile.", tips: ["Ensure accurate salary information for payroll calculations", "Assign appropriate roles based on job responsibilities"] },
        { title: "Configure Granular Permissions", description: "Set up to 19 different permissions for each employee including POS access, inventory management, financial reports, and system settings.", tips: ["Permissions control what each employee can view and modify", "Restrict sensitive data access to authorized personnel only"] },
        { title: "Track Attendance and Performance", description: "Monitor employee attendance records, work hours, and performance metrics over time.", tips: ["Regular performance tracking helps identify training needs", "Use attendance data for scheduling optimization"] },
        { title: "Update Employee Details", description: "Edit employee information, change roles, adjust salaries, or modify permissions as needed.", tips: ["Keep employee records current for accurate reporting", "Update permissions when roles change"] }
      ]
    },
    {
      title: "Bills & Expenses",
      description: "Track shop bills, procurement costs, utility payments, and salary expenses with automated calculations.",
      estimatedTime: "7 minutes",
      steps: [
        { title: "Access Shop/Bills", description: "Navigate to 'Shop' or 'Bills' in the sidebar to view and manage all business expenses.", tips: ["Bills section centralizes all expense tracking in one place"] },
        { title: "Add New Bill", description: "Click 'Add Bill', enter vendor name, amount, expense type, and due date to record a new expense.", tips: ["Categorize expenses accurately for better financial reporting", "Include invoice numbers for reference"] },
        { title: "Categorize Expenses", description: "Assign bills to categories like utilities, rent, supplies, or procurement for organized expense tracking.", tips: ["Proper categorization enables detailed expense analysis", "Create custom categories for business-specific needs"] },
        { title: "Track Payment Status", description: "Monitor bill status as pending or paid, and update when payments are made.", tips: ["Track pending bills to avoid late payment fees", "Mark bills as paid immediately after payment"] },
        { title: "Generate Salary Bills", description: "Create salary expense records with month selection for payroll tracking and reporting.", tips: ["Salary bills link to employee records automatically", "Select the correct month for accurate period tracking"] },
        { title: "Link Procurement to Bills", description: "Connect procurement orders to corresponding bills for complete expense tracking.", tips: ["Linked records provide complete audit trail", "Verify amounts match between procurement and bills"] },
        { title: "Export Expense Reports", description: "Download expense reports in various formats for accounting and tax purposes.", tips: ["Regular exports support financial planning", "Use date filters to generate period-specific reports"] }
      ]
    },
    {
      title: "Support Tickets",
      description: "Submit support requests, track ticket status, and communicate with IT support team in real-time.",
      estimatedTime: "5 minutes",
      steps: [
        { title: "Access Support Section", description: "Click 'Support' in the sidebar to open the support ticket management system.", tips: ["Support tickets help track and resolve technical issues efficiently"] },
        { title: "Create New Ticket", description: "Click 'New Ticket', enter a description of the issue, select priority level (low, medium, high, urgent), and submit.", tips: ["Provide detailed descriptions for faster resolution", "Set appropriate priority based on business impact"] },
        { title: "Upload Attachments", description: "Attach screenshots, documents, or files to help the support team understand and resolve your issue.", tips: ["Screenshots help illustrate problems clearly", "Include error messages when applicable"] },
        { title: "Track Ticket Status", description: "Monitor your tickets as they progress through open, in-progress, and resolved states.", tips: ["Check ticket status regularly for updates", "Respond promptly to support team questions"] },
        { title: "Use Real-Time Chat", description: "Communicate directly with the IT support team through the built-in chat feature for quick assistance.", tips: ["Real-time chat speeds up issue resolution", "Keep chat focused on the specific issue"] },
        { title: "View Ticket History", description: "Review past tickets and their resolutions for reference or to report recurring issues.", tips: ["Historical tickets help identify patterns", "Reference past solutions for similar issues"] }
      ]
    },
    {
      title: "Team Chat",
      description: "Communicate with team members through direct messages and channel-based conversations.",
      estimatedTime: "4 minutes",
      steps: [
        { title: "Access Team Chat", description: "Click 'Chat' or 'Team Chat' in the sidebar to open the messaging system.", tips: ["Team chat enables instant communication across your organization"] },
        { title: "Send Direct Messages", description: "Select a colleague from the user list and send private messages for one-on-one communication.", tips: ["Direct messages are private between you and the recipient", "Use for sensitive or personal work discussions"] },
        { title: "Create/Join Channels", description: "Create themed channels for departments or projects, or join existing channels for team discussions.", tips: ["Channels organize conversations by topic", "Name channels clearly to indicate their purpose"] },
        { title: "Branch and Restaurant Messaging", description: "Communicate with all team members across branches or restaurant-wide for announcements and updates.", tips: ["Use broadcast channels for important announcements", "Ensure messages reach the appropriate audience"] },
        { title: "Share Files and Updates", description: "Upload and share files, images, and documents directly in chat conversations.", tips: ["File sharing streamlines collaboration", "Keep shared files organized and relevant"] }
      ]
    },
    {
      title: "Violations Management",
      description: "Track government authority violations, upload documents, manage payment status, and link to bills.",
      estimatedTime: "6 minutes",
      steps: [
        { title: "Access Violations Page", description: "Navigate to 'Violations' in the sidebar to view and manage all regulatory violations.", tips: ["Centralized violation tracking ensures compliance management"] },
        { title: "Add Violation", description: "Click 'Add Violation', select the authority type (municipality, health, labor, etc.), enter the amount, and set initial status.", tips: ["Record violations promptly for accurate tracking", "Include all relevant authority details"] },
        { title: "Upload Documents", description: "Attach PDF or image files of violation notices, receipts, and correspondence for documentation.", tips: ["Keep digital copies of all violation documents", "Organize documents by date and type"] },
        { title: "Track Status", description: "Monitor violation status as pending, paid, or disputed, and update as the situation progresses.", tips: ["Track deadlines to avoid additional penalties", "Document all status changes"] },
        { title: "Create Bills from Violations", description: "Automatically generate expense bills from violations to integrate with your financial tracking.", tips: ["Linking to bills ensures expenses are captured", "Verify amounts match violation notices"] },
        { title: "View Statistics Dashboard", description: "Review violation statistics showing total counts, amounts, and trends over time.", tips: ["Statistics help identify compliance patterns", "Use data to improve operations and reduce future violations"] }
      ]
    },
    {
      title: "Printer Configuration",
      description: "Configure thermal receipt printers with QZ Tray integration for automated receipt printing.",
      estimatedTime: "5 minutes",
      steps: [
        { title: "Access Printers", description: "Navigate to 'Printers' under the System menu to manage printer configurations.", tips: ["Proper printer setup ensures reliable receipt printing"] },
        { title: "Add Printer", description: "Click 'Add Printer', enter the printer name, IP address, and select the connection type.", tips: ["Use static IP addresses for network printers", "Name printers by location for easy identification"] },
        { title: "Select Printer Brand", description: "Choose your printer brand from supported options: Epson, Star Micronics, Brother, Zebra, or BIXOLON.", tips: ["Select the correct brand for proper driver commands", "Consult printer documentation for model compatibility"] },
        { title: "Set Default Printer", description: "Assign a default printer for each branch to streamline receipt printing.", tips: ["Default printer reduces manual selection during checkout", "Configure separate defaults for different order types"] },
        { title: "Print Test Page", description: "Click 'Test Print' to verify the printer connection and print quality.", tips: ["Test printing confirms proper configuration", "Check alignment and text clarity on test pages"] },
        { title: "Configure QZ Tray", description: "Set up QZ Tray integration for automatic silent printing, with browser dialog as fallback.", tips: ["QZ Tray enables seamless background printing", "Browser fallback ensures printing works without QZ Tray"] }
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
    },
    {
      title: "إدارة الموظفين",
      description: "إدارة أعضاء الفريق وتعيين الأدوار بصلاحيات دقيقة وتتبع أداء الموظفين.",
      estimatedTime: "6 دقائق",
      steps: [
        { title: "الانتقال إلى الموظفين", description: "انقر على 'الموظفين' في الشريط الجانبي للوصول إلى نظام إدارة الموظفين.", tips: ["إدارة الموظفين ضرورية لتنظيم فريقك وتتبع الأداء"] },
        { title: "إضافة موظف جديد", description: "انقر على 'إضافة موظف'، أدخل الاسم والدور والراتب ومعلومات الاتصال لإنشاء ملف تعريف عضو فريق جديد.", tips: ["تأكد من دقة معلومات الراتب لحسابات الرواتب", "قم بتعيين الأدوار المناسبة بناءً على مسؤوليات الوظيفة"] },
        { title: "تكوين الصلاحيات الدقيقة", description: "قم بإعداد ما يصل إلى 19 صلاحية مختلفة لكل موظف بما في ذلك الوصول إلى نقطة البيع وإدارة المخزون والتقارير المالية وإعدادات النظام.", tips: ["الصلاحيات تتحكم في ما يمكن لكل موظف عرضه وتعديله", "قم بتقييد الوصول إلى البيانات الحساسة للموظفين المصرح لهم فقط"] },
        { title: "تتبع الحضور والأداء", description: "راقب سجلات حضور الموظفين وساعات العمل ومقاييس الأداء بمرور الوقت.", tips: ["تتبع الأداء المنتظم يساعد في تحديد احتياجات التدريب", "استخدم بيانات الحضور لتحسين الجدولة"] },
        { title: "تحديث تفاصيل الموظف", description: "عدّل معلومات الموظف أو غيّر الأدوار أو اضبط الرواتب أو عدّل الصلاحيات حسب الحاجة.", tips: ["حافظ على تحديث سجلات الموظفين للتقارير الدقيقة", "قم بتحديث الصلاحيات عند تغيير الأدوار"] }
      ]
    },
    {
      title: "الفواتير والمصروفات",
      description: "تتبع فواتير المحل وتكاليف المشتريات ومدفوعات المرافق ومصروفات الرواتب مع الحسابات الآلية.",
      estimatedTime: "7 دقائق",
      steps: [
        { title: "الوصول إلى المحل/الفواتير", description: "انتقل إلى 'المحل' أو 'الفواتير' في الشريط الجانبي لعرض وإدارة جميع مصروفات الأعمال.", tips: ["قسم الفواتير يركز جميع تتبع المصروفات في مكان واحد"] },
        { title: "إضافة فاتورة جديدة", description: "انقر على 'إضافة فاتورة'، أدخل اسم المورد والمبلغ ونوع المصروف وتاريخ الاستحقاق لتسجيل مصروف جديد.", tips: ["صنّف المصروفات بدقة للتقارير المالية الأفضل", "قم بتضمين أرقام الفواتير للمرجع"] },
        { title: "تصنيف المصروفات", description: "قم بتعيين الفواتير لفئات مثل المرافق والإيجار واللوازم أو المشتريات لتتبع المصروفات المنظم.", tips: ["التصنيف الصحيح يتيح تحليل المصروفات التفصيلي", "أنشئ فئات مخصصة لاحتياجات العمل الخاصة"] },
        { title: "تتبع حالة الدفع", description: "راقب حالة الفاتورة كمعلقة أو مدفوعة، وقم بالتحديث عند إجراء المدفوعات.", tips: ["تتبع الفواتير المعلقة لتجنب رسوم التأخير", "ضع علامة مدفوعة على الفواتير فوراً بعد الدفع"] },
        { title: "إنشاء فواتير الرواتب", description: "أنشئ سجلات مصروفات الرواتب مع اختيار الشهر لتتبع الرواتب والتقارير.", tips: ["فواتير الرواتب ترتبط بسجلات الموظفين تلقائياً", "اختر الشهر الصحيح لتتبع الفترة بدقة"] },
        { title: "ربط المشتريات بالفواتير", description: "اربط أوامر الشراء بالفواتير المقابلة لتتبع المصروفات الكامل.", tips: ["السجلات المرتبطة توفر مسار تدقيق كامل", "تحقق من تطابق المبالغ بين المشتريات والفواتير"] },
        { title: "تصدير تقارير المصروفات", description: "قم بتنزيل تقارير المصروفات بتنسيقات مختلفة لأغراض المحاسبة والضرائب.", tips: ["التصديرات المنتظمة تدعم التخطيط المالي", "استخدم فلاتر التاريخ لإنشاء تقارير خاصة بالفترة"] }
      ]
    },
    {
      title: "تذاكر الدعم",
      description: "إرسال طلبات الدعم وتتبع حالة التذاكر والتواصل مع فريق الدعم الفني في الوقت الفعلي.",
      estimatedTime: "5 دقائق",
      steps: [
        { title: "الوصول إلى قسم الدعم", description: "انقر على 'الدعم' في الشريط الجانبي لفتح نظام إدارة تذاكر الدعم.", tips: ["تذاكر الدعم تساعد في تتبع وحل المشاكل التقنية بكفاءة"] },
        { title: "إنشاء تذكرة جديدة", description: "انقر على 'تذكرة جديدة'، أدخل وصف المشكلة، حدد مستوى الأولوية (منخفض، متوسط، عالي، عاجل)، ثم أرسل.", tips: ["قدم أوصافاً مفصلة لحل أسرع", "حدد الأولوية المناسبة بناءً على تأثير العمل"] },
        { title: "رفع المرفقات", description: "أرفق لقطات شاشة أو مستندات أو ملفات لمساعدة فريق الدعم على فهم مشكلتك وحلها.", tips: ["لقطات الشاشة تساعد في توضيح المشاكل بوضوح", "قم بتضمين رسائل الخطأ عند الاقتضاء"] },
        { title: "تتبع حالة التذكرة", description: "راقب تذاكرك أثناء تقدمها عبر حالات مفتوحة وقيد التنفيذ ومحلولة.", tips: ["تحقق من حالة التذكرة بانتظام للحصول على التحديثات", "استجب فوراً لأسئلة فريق الدعم"] },
        { title: "الدردشة في الوقت الفعلي", description: "تواصل مباشرة مع فريق الدعم الفني من خلال ميزة الدردشة المدمجة للمساعدة السريعة.", tips: ["الدردشة في الوقت الفعلي تسرع حل المشكلات", "حافظ على تركيز الدردشة على المشكلة المحددة"] },
        { title: "عرض سجل التذاكر", description: "راجع التذاكر السابقة وحلولها للمرجع أو للإبلاغ عن المشاكل المتكررة.", tips: ["التذاكر التاريخية تساعد في تحديد الأنماط", "ارجع إلى الحلول السابقة للمشاكل المماثلة"] }
      ]
    },
    {
      title: "محادثة الفريق",
      description: "التواصل مع أعضاء الفريق من خلال الرسائل المباشرة والمحادثات الجماعية.",
      estimatedTime: "4 دقائق",
      steps: [
        { title: "الوصول إلى محادثة الفريق", description: "انقر على 'المحادثة' أو 'محادثة الفريق' في الشريط الجانبي لفتح نظام المراسلة.", tips: ["محادثة الفريق تتيح التواصل الفوري عبر مؤسستك"] },
        { title: "إرسال رسائل مباشرة", description: "اختر زميلاً من قائمة المستخدمين وأرسل رسائل خاصة للتواصل الفردي.", tips: ["الرسائل المباشرة خاصة بينك وبين المستلم", "استخدمها للنقاشات الحساسة أو الشخصية في العمل"] },
        { title: "إنشاء/الانضمام للقنوات", description: "أنشئ قنوات مواضيعية للأقسام أو المشاريع، أو انضم إلى القنوات الموجودة لمناقشات الفريق.", tips: ["القنوات تنظم المحادثات حسب الموضوع", "سمِّ القنوات بوضوح للإشارة إلى غرضها"] },
        { title: "الرسائل على مستوى الفرع والمطعم", description: "تواصل مع جميع أعضاء الفريق عبر الفروع أو على مستوى المطعم للإعلانات والتحديثات.", tips: ["استخدم قنوات البث للإعلانات المهمة", "تأكد من وصول الرسائل للجمهور المناسب"] },
        { title: "مشاركة الملفات والتحديثات", description: "ارفع وشارك الملفات والصور والمستندات مباشرة في محادثات الدردشة.", tips: ["مشاركة الملفات تبسط التعاون", "حافظ على تنظيم الملفات المشتركة وارتباطها بالموضوع"] }
      ]
    },
    {
      title: "إدارة المخالفات",
      description: "تتبع مخالفات الجهات الحكومية ورفع المستندات وإدارة حالة الدفع والربط بالفواتير.",
      estimatedTime: "6 دقائق",
      steps: [
        { title: "الوصول إلى صفحة المخالفات", description: "انتقل إلى 'المخالفات' في الشريط الجانبي لعرض وإدارة جميع المخالفات التنظيمية.", tips: ["تتبع المخالفات المركزي يضمن إدارة الامتثال"] },
        { title: "إضافة مخالفة", description: "انقر على 'إضافة مخالفة'، اختر نوع الجهة (البلدية، الصحة، العمل، إلخ)، أدخل المبلغ، وحدد الحالة الأولية.", tips: ["سجّل المخالفات فوراً للتتبع الدقيق", "قم بتضمين جميع تفاصيل الجهة ذات الصلة"] },
        { title: "رفع المستندات", description: "أرفق ملفات PDF أو صور لإشعارات المخالفات والإيصالات والمراسلات للتوثيق.", tips: ["احتفظ بنسخ رقمية لجميع مستندات المخالفات", "نظّم المستندات حسب التاريخ والنوع"] },
        { title: "تتبع الحالة", description: "راقب حالة المخالفة كمعلقة أو مدفوعة أو متنازع عليها، وقم بالتحديث مع تقدم الوضع.", tips: ["تتبع المواعيد النهائية لتجنب العقوبات الإضافية", "وثّق جميع تغييرات الحالة"] },
        { title: "إنشاء فواتير تلقائياً", description: "أنشئ فواتير مصروفات تلقائياً من المخالفات للتكامل مع تتبعك المالي.", tips: ["الربط بالفواتير يضمن تسجيل المصروفات", "تحقق من تطابق المبالغ مع إشعارات المخالفات"] },
        { title: "عرض لوحة الإحصائيات", description: "راجع إحصائيات المخالفات التي تظهر إجمالي الأعداد والمبالغ والاتجاهات بمرور الوقت.", tips: ["الإحصائيات تساعد في تحديد أنماط الامتثال", "استخدم البيانات لتحسين العمليات وتقليل المخالفات المستقبلية"] }
      ]
    },
    {
      title: "تكوين الطابعة",
      description: "تكوين طابعات الإيصالات الحرارية مع تكامل QZ Tray للطباعة الآلية.",
      estimatedTime: "5 دقائق",
      steps: [
        { title: "الوصول إلى الطابعات", description: "انتقل إلى 'الطابعات' ضمن قائمة النظام لإدارة تكوينات الطابعة.", tips: ["الإعداد الصحيح للطابعة يضمن طباعة إيصالات موثوقة"] },
        { title: "إضافة طابعة", description: "انقر على 'إضافة طابعة'، أدخل اسم الطابعة وعنوان IP واختر نوع الاتصال.", tips: ["استخدم عناوين IP ثابتة للطابعات الشبكية", "سمِّ الطابعات حسب الموقع لسهولة التعرف"] },
        { title: "اختيار العلامة التجارية", description: "اختر علامة طابعتك التجارية من الخيارات المدعومة: Epson، Star Micronics، Brother، Zebra، أو BIXOLON.", tips: ["اختر العلامة التجارية الصحيحة لأوامر التشغيل المناسبة", "راجع وثائق الطابعة للتوافق مع الطراز"] },
        { title: "تعيين الطابعة الافتراضية", description: "عيّن طابعة افتراضية لكل فرع لتبسيط طباعة الإيصالات.", tips: ["الطابعة الافتراضية تقلل الاختيار اليدوي أثناء الدفع", "قم بتكوين افتراضيات منفصلة لأنواع الطلبات المختلفة"] },
        { title: "طباعة صفحة اختبار", description: "انقر على 'طباعة تجريبية' للتحقق من اتصال الطابعة وجودة الطباعة.", tips: ["الطباعة التجريبية تؤكد التكوين الصحيح", "تحقق من المحاذاة ووضوح النص في صفحات الاختبار"] },
        { title: "الطباعة الآلية مع QZ Tray", description: "قم بإعداد تكامل QZ Tray للطباعة الصامتة التلقائية، مع استخدام مربع حوار المتصفح كبديل.", tips: ["QZ Tray يتيح الطباعة في الخلفية بسلاسة", "البديل عبر المتصفح يضمن عمل الطباعة بدون QZ Tray"] }
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
    },
    {
      title: "员工管理",
      description: "管理团队成员，设置细粒度权限角色，跟踪员工绩效。",
      estimatedTime: "6 分钟",
      steps: [
        { title: "导航到员工页面", description: "点击侧边栏中的'员工'以访问员工管理系统。", tips: ["员工管理对于组织团队和跟踪绩效至关重要"] },
        { title: "添加新员工", description: "点击'添加员工'，输入姓名、角色、薪资和联系信息以创建新的团队成员档案。", tips: ["确保薪资信息准确以便工资计算", "根据工作职责分配适当的角色"] },
        { title: "配置细粒度权限", description: "为每位员工设置多达19种不同的权限，包括POS访问、库存管理、财务报告和系统设置。", tips: ["权限控制每位员工可以查看和修改的内容", "仅限授权人员访问敏感数据"] },
        { title: "跟踪考勤和绩效", description: "监控员工考勤记录、工作时间和绩效指标。", tips: ["定期绩效跟踪有助于识别培训需求", "使用考勤数据优化排班"] },
        { title: "更新员工信息", description: "根据需要编辑员工信息、更改角色、调整薪资或修改权限。", tips: ["保持员工记录更新以确保报告准确", "角色变更时更新权限"] }
      ]
    },
    {
      title: "账单与支出",
      description: "跟踪店铺账单、采购成本、公用事业付款和薪资支出，自动计算。",
      estimatedTime: "7 分钟",
      steps: [
        { title: "访问店铺/账单", description: "在侧边栏中导航到'店铺'或'账单'以查看和管理所有业务支出。", tips: ["账单部分将所有支出跟踪集中在一处"] },
        { title: "添加新账单", description: "点击'添加账单'，输入供应商名称、金额、支出类型和到期日以记录新支出。", tips: ["准确分类支出以便更好地进行财务报告", "包含发票号码以供参考"] },
        { title: "分类支出", description: "将账单分配到公用事业、租金、用品或采购等类别以进行有组织的支出跟踪。", tips: ["正确分类可实现详细的支出分析", "为特定业务需求创建自定义类别"] },
        { title: "跟踪付款状态", description: "监控账单状态为待付或已付，并在付款后更新。", tips: ["跟踪待付账单以避免逾期费用", "付款后立即标记为已付"] },
        { title: "生成薪资账单", description: "创建薪资支出记录并选择月份以进行工资跟踪和报告。", tips: ["薪资账单自动链接到员工记录", "选择正确的月份以准确跟踪期间"] },
        { title: "关联采购账单", description: "将采购订单连接到相应的账单以进行完整的支出跟踪。", tips: ["关联记录提供完整的审计追踪", "验证采购和账单之间的金额匹配"] },
        { title: "导出支出报告", description: "以各种格式下载支出报告用于会计和税务目的。", tips: ["定期导出支持财务规划", "使用日期过滤器生成特定期间的报告"] }
      ]
    },
    {
      title: "支持工单",
      description: "提交支持请求，跟踪工单状态，与IT支持团队实时沟通。",
      estimatedTime: "5 分钟",
      steps: [
        { title: "访问支持部分", description: "点击侧边栏中的'支持'以打开支持工单管理系统。", tips: ["支持工单有助于高效跟踪和解决技术问题"] },
        { title: "创建新工单", description: "点击'新建工单'，输入问题描述，选择优先级（低、中、高、紧急），然后提交。", tips: ["提供详细描述以加快解决速度", "根据业务影响设置适当的优先级"] },
        { title: "上传附件", description: "附加截图、文档或文件以帮助支持团队理解和解决您的问题。", tips: ["截图有助于清楚说明问题", "在适用时包含错误消息"] },
        { title: "跟踪工单状态", description: "监控您的工单在开放、处理中和已解决状态之间的进展。", tips: ["定期检查工单状态以获取更新", "及时回复支持团队的问题"] },
        { title: "使用实时聊天", description: "通过内置聊天功能与IT支持团队直接沟通以获得快速帮助。", tips: ["实时聊天加快问题解决", "保持聊天专注于具体问题"] },
        { title: "查看工单历史", description: "查看过去的工单及其解决方案以供参考或报告重复问题。", tips: ["历史工单有助于识别模式", "参考过去的解决方案处理类似问题"] }
      ]
    },
    {
      title: "团队聊天",
      description: "通过私信和频道对话与团队成员沟通。",
      estimatedTime: "4 分钟",
      steps: [
        { title: "访问团队聊天", description: "点击侧边栏中的'聊天'或'团队聊天'以打开消息系统。", tips: ["团队聊天实现组织内的即时通信"] },
        { title: "发送私信", description: "从用户列表中选择同事并发送私人消息进行一对一沟通。", tips: ["私信仅在您和收件人之间可见", "用于敏感或个人工作讨论"] },
        { title: "创建/加入频道", description: "为部门或项目创建主题频道，或加入现有频道进行团队讨论。", tips: ["频道按主题组织对话", "清晰命名频道以表明其目的"] },
        { title: "分店和全店消息", description: "与跨分店或全餐厅的所有团队成员沟通以发布公告和更新。", tips: ["使用广播频道发布重要公告", "确保消息到达适当的受众"] },
        { title: "即时分享文件和更新", description: "直接在聊天对话中上传和分享文件、图片和文档。", tips: ["文件共享简化协作", "保持共享文件有组织且相关"] }
      ]
    },
    {
      title: "违规管理",
      description: "跟踪政府部门违规记录，上传文档，管理付款状态，关联账单。",
      estimatedTime: "6 分钟",
      steps: [
        { title: "访问违规页面", description: "在侧边栏中导航到'违规'以查看和管理所有监管违规。", tips: ["集中的违规跟踪确保合规管理"] },
        { title: "添加违规", description: "点击'添加违规'，选择机构类型（市政、卫生、劳动等），输入金额并设置初始状态。", tips: ["及时记录违规以进行准确跟踪", "包含所有相关机构详情"] },
        { title: "上传文档", description: "附加违规通知、收据和通信的PDF或图片文件以供存档。", tips: ["保留所有违规文件的数字副本", "按日期和类型组织文档"] },
        { title: "跟踪状态", description: "监控违规状态为待处理、已付或争议，并随着情况进展更新。", tips: ["跟踪截止日期以避免额外罚款", "记录所有状态变更"] },
        { title: "自动创建账单", description: "从违规自动生成支出账单以与您的财务跟踪集成。", tips: ["链接到账单确保支出被记录", "验证金额与违规通知匹配"] },
        { title: "查看统计仪表板", description: "查看违规统计显示总数、金额和随时间变化的趋势。", tips: ["统计有助于识别合规模式", "使用数据改进运营并减少未来违规"] }
      ]
    },
    {
      title: "打印机配置",
      description: "配置热敏收据打印机，集成QZ Tray实现自动收据打印。",
      estimatedTime: "5 分钟",
      steps: [
        { title: "访问打印机", description: "在系统菜单下导航到'打印机'以管理打印机配置。", tips: ["正确的打印机设置确保可靠的收据打印"] },
        { title: "添加打印机", description: "点击'添加打印机'，输入打印机名称、IP地址并选择连接类型。", tips: ["为网络打印机使用静态IP地址", "按位置命名打印机以便于识别"] },
        { title: "选择打印机品牌", description: "从支持的选项中选择您的打印机品牌：爱普生、Star Micronics、兄弟、斑马或BIXOLON。", tips: ["选择正确的品牌以获得正确的驱动程序命令", "查阅打印机文档了解型号兼容性"] },
        { title: "设置默认打印机", description: "为每个分店分配默认打印机以简化收据打印。", tips: ["默认打印机减少结账时的手动选择", "为不同订单类型配置单独的默认设置"] },
        { title: "打印测试页", description: "点击'测试打印'以验证打印机连接和打印质量。", tips: ["测试打印确认正确配置", "检查测试页的对齐和文本清晰度"] },
        { title: "配置QZ Tray", description: "设置QZ Tray集成以实现自动静默打印，浏览器对话框作为后备。", tips: ["QZ Tray实现无缝后台打印", "浏览器后备确保在没有QZ Tray时也能打印"] }
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
    },
    {
      title: "Mitarbeiterverwaltung",
      description: "Teammitglieder verwalten, Rollen mit detaillierten Berechtigungen festlegen und Mitarbeiterleistung verfolgen.",
      estimatedTime: "6 Minuten",
      steps: [
        { title: "Zu Mitarbeiter navigieren", description: "Klicken Sie in der Seitenleiste auf 'Mitarbeiter', um auf das Mitarbeiterverwaltungssystem zuzugreifen.", tips: ["Mitarbeiterverwaltung ist essenziell für die Teamorganisation und Leistungsverfolgung"] },
        { title: "Neuen Mitarbeiter hinzufügen", description: "Klicken Sie auf 'Mitarbeiter hinzufügen', geben Sie Name, Rolle, Gehalt und Kontaktinformationen ein, um ein neues Teammitgliederprofil zu erstellen.", tips: ["Stellen Sie genaue Gehaltsinformationen für Gehaltsabrechnungen sicher", "Weisen Sie basierend auf den Arbeitsaufgaben geeignete Rollen zu"] },
        { title: "Detaillierte Berechtigungen konfigurieren", description: "Richten Sie bis zu 19 verschiedene Berechtigungen für jeden Mitarbeiter ein, einschließlich POS-Zugriff, Lagerverwaltung, Finanzberichte und Systemeinstellungen.", tips: ["Berechtigungen steuern, was jeder Mitarbeiter anzeigen und ändern kann", "Beschränken Sie den Zugriff auf sensible Daten nur auf autorisiertes Personal"] },
        { title: "Anwesenheit und Leistung verfolgen", description: "Überwachen Sie Mitarbeiter-Anwesenheitsprotokolle, Arbeitszeiten und Leistungskennzahlen im Zeitverlauf.", tips: ["Regelmäßige Leistungsverfolgung hilft bei der Identifizierung von Schulungsbedarf", "Verwenden Sie Anwesenheitsdaten für die Planungsoptimierung"] },
        { title: "Mitarbeiterdaten aktualisieren", description: "Bearbeiten Sie Mitarbeiterinformationen, ändern Sie Rollen, passen Sie Gehälter an oder modifizieren Sie Berechtigungen nach Bedarf.", tips: ["Halten Sie Mitarbeiterdaten für genaue Berichte aktuell", "Aktualisieren Sie Berechtigungen bei Rollenwechseln"] }
      ]
    },
    {
      title: "Rechnungen & Ausgaben",
      description: "Ladenrechnungen, Beschaffungskosten, Nebenkostenzahlungen und Gehaltsausgaben mit automatischen Berechnungen verfolgen.",
      estimatedTime: "7 Minuten",
      steps: [
        { title: "Auf Laden/Rechnungen zugreifen", description: "Navigieren Sie in der Seitenleiste zu 'Laden' oder 'Rechnungen', um alle Geschäftsausgaben anzuzeigen und zu verwalten.", tips: ["Der Rechnungsbereich zentralisiert alle Ausgabenverfolgung an einem Ort"] },
        { title: "Neue Rechnung hinzufügen", description: "Klicken Sie auf 'Rechnung hinzufügen', geben Sie Lieferantenname, Betrag, Ausgabentyp und Fälligkeitsdatum ein, um eine neue Ausgabe zu erfassen.", tips: ["Kategorisieren Sie Ausgaben genau für bessere Finanzberichte", "Fügen Sie Rechnungsnummern als Referenz hinzu"] },
        { title: "Ausgaben kategorisieren", description: "Ordnen Sie Rechnungen Kategorien wie Nebenkosten, Miete, Verbrauchsmaterialien oder Beschaffung für organisierte Ausgabenverfolgung zu.", tips: ["Richtige Kategorisierung ermöglicht detaillierte Ausgabenanalyse", "Erstellen Sie benutzerdefinierte Kategorien für geschäftsspezifische Anforderungen"] },
        { title: "Zahlungsstatus verfolgen", description: "Überwachen Sie den Rechnungsstatus als ausstehend oder bezahlt und aktualisieren Sie ihn nach erfolgter Zahlung.", tips: ["Verfolgen Sie ausstehende Rechnungen, um Verzugsgebühren zu vermeiden", "Markieren Sie Rechnungen sofort nach der Zahlung als bezahlt"] },
        { title: "Gehaltsabrechnungen erstellen", description: "Erstellen Sie Gehaltsausgabeneinträge mit Monatsauswahl für Gehaltsabrechnung und Berichterstattung.", tips: ["Gehaltsabrechnungen werden automatisch mit Mitarbeiterdaten verknüpft", "Wählen Sie den korrekten Monat für genaue Periodenverfolgung"] },
        { title: "Beschaffung mit Rechnungen verknüpfen", description: "Verbinden Sie Beschaffungsaufträge mit den entsprechenden Rechnungen für vollständige Ausgabenverfolgung.", tips: ["Verknüpfte Datensätze bieten einen vollständigen Prüfpfad", "Überprüfen Sie, ob die Beträge zwischen Beschaffung und Rechnungen übereinstimmen"] },
        { title: "Ausgabenberichte exportieren", description: "Laden Sie Ausgabenberichte in verschiedenen Formaten für Buchhaltungs- und Steuerzwecke herunter.", tips: ["Regelmäßige Exporte unterstützen die Finanzplanung", "Verwenden Sie Datumsfilter für periodenspezifische Berichte"] }
      ]
    },
    {
      title: "Support-Tickets",
      description: "Supportanfragen einreichen, Ticketstatus verfolgen und in Echtzeit mit dem IT-Support kommunizieren.",
      estimatedTime: "5 Minuten",
      steps: [
        { title: "Auf Supportbereich zugreifen", description: "Klicken Sie in der Seitenleiste auf 'Support', um das Support-Ticket-Verwaltungssystem zu öffnen.", tips: ["Support-Tickets helfen bei der effizienten Verfolgung und Lösung technischer Probleme"] },
        { title: "Neues Ticket mit Priorität erstellen", description: "Klicken Sie auf 'Neues Ticket', geben Sie eine Beschreibung des Problems ein, wählen Sie die Prioritätsstufe (niedrig, mittel, hoch, dringend) und senden Sie es ab.", tips: ["Geben Sie detaillierte Beschreibungen für schnellere Lösung an", "Setzen Sie die Priorität entsprechend der Geschäftsauswirkung"] },
        { title: "Anhänge hochladen", description: "Fügen Sie Screenshots, Dokumente oder Dateien bei, um dem Support-Team zu helfen, Ihr Problem zu verstehen und zu lösen.", tips: ["Screenshots helfen, Probleme klar zu veranschaulichen", "Fügen Sie Fehlermeldungen hinzu, wenn zutreffend"] },
        { title: "Ticketstatus verfolgen", description: "Überwachen Sie Ihre Tickets, während sie durch die Status offen, in Bearbeitung und gelöst fortschreiten.", tips: ["Überprüfen Sie den Ticketstatus regelmäßig auf Updates", "Antworten Sie umgehend auf Fragen des Support-Teams"] },
        { title: "Echtzeit-Chat nutzen", description: "Kommunizieren Sie direkt mit dem IT-Support-Team über die integrierte Chat-Funktion für schnelle Unterstützung.", tips: ["Echtzeit-Chat beschleunigt die Problemlösung", "Halten Sie den Chat auf das spezifische Problem fokussiert"] },
        { title: "Ticketverlauf anzeigen", description: "Überprüfen Sie vergangene Tickets und ihre Lösungen als Referenz oder um wiederkehrende Probleme zu melden.", tips: ["Historische Tickets helfen bei der Identifizierung von Mustern", "Verweisen Sie auf frühere Lösungen für ähnliche Probleme"] }
      ]
    },
    {
      title: "Team-Chat",
      description: "Mit Teammitgliedern über Direktnachrichten und Kanalgespräche kommunizieren.",
      estimatedTime: "4 Minuten",
      steps: [
        { title: "Auf Team-Chat zugreifen", description: "Klicken Sie in der Seitenleiste auf 'Chat' oder 'Team-Chat', um das Nachrichtensystem zu öffnen.", tips: ["Team-Chat ermöglicht sofortige Kommunikation in Ihrer gesamten Organisation"] },
        { title: "Direktnachrichten senden", description: "Wählen Sie einen Kollegen aus der Benutzerliste aus und senden Sie private Nachrichten für persönliche Kommunikation.", tips: ["Direktnachrichten sind privat zwischen Ihnen und dem Empfänger", "Verwenden Sie sie für sensible oder persönliche Arbeitsgespräche"] },
        { title: "Kanäle erstellen/beitreten", description: "Erstellen Sie thematische Kanäle für Abteilungen oder Projekte, oder treten Sie bestehenden Kanälen für Teamdiskussionen bei.", tips: ["Kanäle organisieren Gespräche nach Thema", "Benennen Sie Kanäle klar, um ihren Zweck anzugeben"] },
        { title: "Filial- und restaurantweite Nachrichten", description: "Kommunizieren Sie mit allen Teammitgliedern über Filialen hinweg oder restaurantweit für Ankündigungen und Updates.", tips: ["Verwenden Sie Broadcast-Kanäle für wichtige Ankündigungen", "Stellen Sie sicher, dass Nachrichten das richtige Publikum erreichen"] },
        { title: "Dateien und Updates sofort teilen", description: "Laden Sie Dateien, Bilder und Dokumente hoch und teilen Sie sie direkt in Chat-Gesprächen.", tips: ["Dateifreigabe vereinfacht die Zusammenarbeit", "Halten Sie geteilte Dateien organisiert und relevant"] }
      ]
    },
    {
      title: "Verstöße-Verwaltung",
      description: "Verstöße von Regierungsbehörden verfolgen, Dokumente hochladen, Zahlungsstatus verwalten und mit Rechnungen verknüpfen.",
      estimatedTime: "6 Minuten",
      steps: [
        { title: "Auf Verstöße-Seite zugreifen", description: "Navigieren Sie in der Seitenleiste zu 'Verstöße', um alle behördlichen Verstöße anzuzeigen und zu verwalten.", tips: ["Zentralisierte Verstößeverfolgung gewährleistet Compliance-Management"] },
        { title: "Verstoß hinzufügen", description: "Klicken Sie auf 'Verstoß hinzufügen', wählen Sie den Behördentyp (Gemeinde, Gesundheit, Arbeit usw.), geben Sie den Betrag ein und legen Sie den Anfangsstatus fest.", tips: ["Erfassen Sie Verstöße umgehend für genaue Verfolgung", "Fügen Sie alle relevanten Behördendetails hinzu"] },
        { title: "PDF/Bild-Dokumente hochladen", description: "Hängen Sie PDF- oder Bilddateien von Verstößbescheiden, Quittungen und Korrespondenz zur Dokumentation an.", tips: ["Bewahren Sie digitale Kopien aller Verstößdokumente auf", "Organisieren Sie Dokumente nach Datum und Typ"] },
        { title: "Status verfolgen", description: "Überwachen Sie den Verstößstatus als ausstehend, bezahlt oder angefochten und aktualisieren Sie ihn, während sich die Situation entwickelt.", tips: ["Verfolgen Sie Fristen, um zusätzliche Strafen zu vermeiden", "Dokumentieren Sie alle Statusänderungen"] },
        { title: "Rechnungen automatisch erstellen", description: "Generieren Sie automatisch Ausgabenrechnungen aus Verstößen, um sie in Ihre Finanzverfolgung zu integrieren.", tips: ["Verknüpfung mit Rechnungen stellt sicher, dass Ausgaben erfasst werden", "Überprüfen Sie, ob die Beträge mit den Verstößbescheiden übereinstimmen"] },
        { title: "Statistik-Dashboard anzeigen", description: "Überprüfen Sie Verstößstatistiken, die Gesamtzahlen, Beträge und Trends im Zeitverlauf anzeigen.", tips: ["Statistiken helfen bei der Identifizierung von Compliance-Mustern", "Nutzen Sie Daten zur Verbesserung der Abläufe und Reduzierung zukünftiger Verstöße"] }
      ]
    },
    {
      title: "Druckerkonfiguration",
      description: "Thermodrucker für Quittungen mit QZ Tray-Integration für automatischen Druck konfigurieren.",
      estimatedTime: "5 Minuten",
      steps: [
        { title: "Auf Drucker im Systemmenü zugreifen", description: "Navigieren Sie im Systemmenü zu 'Drucker', um Druckerkonfigurationen zu verwalten.", tips: ["Richtige Druckereinrichtung gewährleistet zuverlässigen Quittungsdruck"] },
        { title: "Drucker hinzufügen", description: "Klicken Sie auf 'Drucker hinzufügen', geben Sie Druckername, IP-Adresse ein und wählen Sie den Verbindungstyp.", tips: ["Verwenden Sie statische IP-Adressen für Netzwerkdrucker", "Benennen Sie Drucker nach Standort für einfache Identifizierung"] },
        { title: "Druckermarke auswählen", description: "Wählen Sie Ihre Druckermarke aus den unterstützten Optionen: Epson, Star Micronics, Brother, Zebra oder BIXOLON.", tips: ["Wählen Sie die richtige Marke für korrekte Treiberbefehle", "Konsultieren Sie die Druckerdokumentation für Modellkompatibilität"] },
        { title: "Standarddrucker pro Filiale festlegen", description: "Weisen Sie einen Standarddrucker für jede Filiale zu, um den Quittungsdruck zu optimieren.", tips: ["Standarddrucker reduziert manuelle Auswahl beim Checkout", "Konfigurieren Sie separate Standards für verschiedene Bestelltypen"] },
        { title: "Testseite drucken", description: "Klicken Sie auf 'Testdruck', um die Druckerverbindung und Druckqualität zu überprüfen.", tips: ["Testdruck bestätigt die korrekte Konfiguration", "Überprüfen Sie Ausrichtung und Textklarheit auf Testseiten"] },
        { title: "Automatisches Drucken mit QZ Tray nutzen", description: "Richten Sie die QZ Tray-Integration für automatisches stilles Drucken ein, mit Browser-Dialog als Fallback.", tips: ["QZ Tray ermöglicht nahtloses Hintergrunddrucken", "Browser-Fallback stellt sicher, dass Drucken ohne QZ Tray funktioniert"] }
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
    },
    {
      title: "कर्मचारी प्रबंधन",
      description: "टीम सदस्यों का प्रबंधन करें, विस्तृत अनुमतियों के साथ भूमिकाएं सेट करें और कर्मचारी प्रदर्शन ट्रैक करें।",
      estimatedTime: "6 मिनट",
      steps: [
        { title: "कर्मचारियों पर नेविगेट करें", description: "कर्मचारी प्रबंधन प्रणाली तक पहुंचने के लिए साइडबार में 'कर्मचारी' पर क्लिक करें।", tips: ["कर्मचारी प्रबंधन आपकी टीम को व्यवस्थित करने और प्रदर्शन ट्रैक करने के लिए आवश्यक है"] },
        { title: "कर्मचारी जोड़ें", description: "'कर्मचारी जोड़ें' पर क्लिक करें, नाम, भूमिका, वेतन और संपर्क जानकारी दर्ज करें।", tips: ["पेरोल गणना के लिए सटीक वेतन जानकारी सुनिश्चित करें", "नौकरी की जिम्मेदारियों के आधार पर उचित भूमिकाएं असाइन करें"] },
        { title: "19 विस्तृत अनुमतियां कॉन्फ़िगर करें", description: "प्रत्येक कर्मचारी के लिए 19 विभिन्न अनुमतियां सेट करें जिसमें POS एक्सेस, इन्वेंटरी प्रबंधन, वित्तीय रिपोर्ट और सिस्टम सेटिंग्स शामिल हैं।", tips: ["अनुमतियां नियंत्रित करती हैं कि प्रत्येक कर्मचारी क्या देख और संशोधित कर सकता है", "संवेदनशील डेटा एक्सेस केवल अधिकृत कर्मियों तक सीमित रखें"] },
        { title: "उपस्थिति और प्रदर्शन ट्रैक करें", description: "समय के साथ कर्मचारी उपस्थिति रिकॉर्ड, कार्य घंटे और प्रदर्शन मेट्रिक्स की निगरानी करें।", tips: ["नियमित प्रदर्शन ट्रैकिंग प्रशिक्षण आवश्यकताओं की पहचान करने में मदद करती है", "शेड्यूलिंग अनुकूलन के लिए उपस्थिति डेटा का उपयोग करें"] },
        { title: "कर्मचारी विवरण अपडेट करें", description: "आवश्यकतानुसार कर्मचारी जानकारी, भूमिकाएं बदलें, वेतन समायोजित करें या अनुमतियां संशोधित करें।", tips: ["सटीक रिपोर्टिंग के लिए कर्मचारी रिकॉर्ड वर्तमान रखें", "भूमिकाएं बदलने पर अनुमतियां अपडेट करें"] }
      ]
    },
    {
      title: "बिल और खर्च",
      description: "दुकान के बिल, खरीद लागत, उपयोगिता भुगतान और वेतन खर्च को स्वचालित गणना के साथ ट्रैक करें।",
      estimatedTime: "7 मिनट",
      steps: [
        { title: "दुकान/बिल एक्सेस करें", description: "सभी व्यापार खर्चों को देखने और प्रबंधित करने के लिए साइडबार में 'दुकान' या 'बिल' पर नेविगेट करें।", tips: ["बिल अनुभाग सभी खर्च ट्रैकिंग को एक स्थान पर केंद्रीकृत करता है"] },
        { title: "नया बिल जोड़ें", description: "'बिल जोड़ें' पर क्लिक करें, विक्रेता का नाम, राशि, खर्च प्रकार और देय तिथि दर्ज करें।", tips: ["बेहतर वित्तीय रिपोर्टिंग के लिए खर्चों को सही ढंग से वर्गीकृत करें", "संदर्भ के लिए इनवॉइस नंबर शामिल करें"] },
        { title: "खर्चों को वर्गीकृत करें", description: "संगठित खर्च ट्रैकिंग के लिए बिलों को उपयोगिताओं, किराया, आपूर्ति या खरीद जैसी श्रेणियों में असाइन करें।", tips: ["उचित वर्गीकरण विस्तृत खर्च विश्लेषण सक्षम करता है", "व्यवसाय-विशिष्ट आवश्यकताओं के लिए कस्टम श्रेणियां बनाएं"] },
        { title: "भुगतान स्थिति ट्रैक करें", description: "बिल स्थिति को लंबित या भुगतान के रूप में मॉनिटर करें, और भुगतान होने पर अपडेट करें।", tips: ["विलंब शुल्क से बचने के लिए लंबित बिलों को ट्रैक करें", "भुगतान के तुरंत बाद बिलों को भुगतान के रूप में चिह्नित करें"] },
        { title: "वेतन बिल जनरेट करें", description: "पेरोल ट्रैकिंग और रिपोर्टिंग के लिए महीने के चयन के साथ वेतन खर्च रिकॉर्ड बनाएं।", tips: ["वेतन बिल स्वचालित रूप से कर्मचारी रिकॉर्ड से लिंक होते हैं", "सटीक अवधि ट्रैकिंग के लिए सही महीना चुनें"] },
        { title: "खरीद को बिल से लिंक करें", description: "पूर्ण खर्च ट्रैकिंग के लिए खरीद ऑर्डर को संबंधित बिलों से कनेक्ट करें।", tips: ["लिंक किए गए रिकॉर्ड पूर्ण ऑडिट ट्रेल प्रदान करते हैं", "खरीद और बिलों के बीच राशियों का मिलान सत्यापित करें"] },
        { title: "खर्च रिपोर्ट निर्यात करें", description: "लेखांकन और कर उद्देश्यों के लिए विभिन्न प्रारूपों में खर्च रिपोर्ट डाउनलोड करें।", tips: ["नियमित निर्यात वित्तीय योजना का समर्थन करते हैं", "अवधि-विशिष्ट रिपोर्ट जनरेट करने के लिए दिनांक फ़िल्टर का उपयोग करें"] }
      ]
    },
    {
      title: "सहायता टिकट",
      description: "सहायता अनुरोध सबमिट करें, टिकट स्थिति ट्रैक करें और IT सहायता टीम के साथ रीयल-टाइम में संवाद करें।",
      estimatedTime: "5 मिनट",
      steps: [
        { title: "सहायता अनुभाग एक्सेस करें", description: "सहायता टिकट प्रबंधन प्रणाली खोलने के लिए साइडबार में 'सहायता' पर क्लिक करें।", tips: ["सहायता टिकट तकनीकी समस्याओं को कुशलतापूर्वक ट्रैक और हल करने में मदद करते हैं"] },
        { title: "प्राथमिकता के साथ नया टिकट बनाएं", description: "'नया टिकट' पर क्लिक करें, समस्या का विवरण दर्ज करें, प्राथमिकता स्तर (निम्न, मध्यम, उच्च, तत्काल) चुनें और सबमिट करें।", tips: ["तेजी से समाधान के लिए विस्तृत विवरण प्रदान करें", "व्यापार प्रभाव के आधार पर उचित प्राथमिकता सेट करें"] },
        { title: "अटैचमेंट अपलोड करें", description: "सहायता टीम को आपकी समस्या समझने और हल करने में मदद के लिए स्क्रीनशॉट, दस्तावेज़ या फाइलें अटैच करें।", tips: ["स्क्रीनशॉट समस्याओं को स्पष्ट रूप से दर्शाने में मदद करते हैं", "जब लागू हो तो त्रुटि संदेश शामिल करें"] },
        { title: "टिकट स्थिति ट्रैक करें", description: "अपने टिकटों की निगरानी करें जैसे वे खुला, प्रगति में और हल स्थितियों से गुजरते हैं।", tips: ["अपडेट के लिए नियमित रूप से टिकट स्थिति जांचें", "सहायता टीम के प्रश्नों का तुरंत जवाब दें"] },
        { title: "रीयल-टाइम चैट का उपयोग करें", description: "त्वरित सहायता के लिए अंतर्निहित चैट सुविधा के माध्यम से IT सहायता टीम के साथ सीधे संवाद करें।", tips: ["रीयल-टाइम चैट समस्या समाधान को तेज करती है", "विशिष्ट समस्या पर चैट केंद्रित रखें"] },
        { title: "टिकट इतिहास देखें", description: "संदर्भ के लिए या आवर्ती समस्याओं की रिपोर्ट करने के लिए पिछले टिकट और उनके समाधान की समीक्षा करें।", tips: ["ऐतिहासिक टिकट पैटर्न की पहचान करने में मदद करते हैं", "समान समस्याओं के लिए पिछले समाधानों का संदर्भ लें"] }
      ]
    },
    {
      title: "टीम चैट",
      description: "डायरेक्ट मैसेज और चैनल वार्तालाप के माध्यम से टीम सदस्यों के साथ संवाद करें।",
      estimatedTime: "4 मिनट",
      steps: [
        { title: "टीम चैट एक्सेस करें", description: "मैसेजिंग सिस्टम खोलने के लिए साइडबार में 'चैट' या 'टीम चैट' पर क्लिक करें।", tips: ["टीम चैट आपके संगठन में तत्काल संचार सक्षम करती है"] },
        { title: "डायरेक्ट मैसेज भेजें", description: "एक-एक संचार के लिए उपयोगकर्ता सूची से सहकर्मी चुनें और निजी संदेश भेजें।", tips: ["डायरेक्ट मैसेज आपके और प्राप्तकर्ता के बीच निजी हैं", "संवेदनशील या व्यक्तिगत कार्य चर्चाओं के लिए उपयोग करें"] },
        { title: "चैनल बनाएं/जॉइन करें", description: "विभागों या परियोजनाओं के लिए थीम चैनल बनाएं, या टीम चर्चाओं के लिए मौजूदा चैनलों में शामिल हों।", tips: ["चैनल विषय के अनुसार वार्तालाप व्यवस्थित करते हैं", "उनके उद्देश्य को इंगित करने के लिए चैनलों को स्पष्ट नाम दें"] },
        { title: "ब्रांच और रेस्तरां-व्यापी मैसेजिंग", description: "घोषणाओं और अपडेट के लिए शाखाओं या रेस्तरां-व्यापी सभी टीम सदस्यों के साथ संवाद करें।", tips: ["महत्वपूर्ण घोषणाओं के लिए प्रसारण चैनलों का उपयोग करें", "सुनिश्चित करें कि संदेश उचित दर्शकों तक पहुंचें"] },
        { title: "फाइल और अपडेट तुरंत शेयर करें", description: "चैट वार्तालापों में सीधे फाइलें, छवियां और दस्तावेज़ अपलोड और साझा करें।", tips: ["फाइल शेयरिंग सहयोग को सुव्यवस्थित करती है", "साझा की गई फाइलों को व्यवस्थित और प्रासंगिक रखें"] }
      ]
    },
    {
      title: "उल्लंघन प्रबंधन",
      description: "सरकारी प्राधिकरण उल्लंघनों को ट्रैक करें, दस्तावेज अपलोड करें, भुगतान स्थिति प्रबंधित करें और बिलों से लिंक करें।",
      estimatedTime: "6 मिनट",
      steps: [
        { title: "उल्लंघन पृष्ठ एक्सेस करें", description: "सभी नियामक उल्लंघनों को देखने और प्रबंधित करने के लिए साइडबार में 'उल्लंघन' पर नेविगेट करें।", tips: ["केंद्रीकृत उल्लंघन ट्रैकिंग अनुपालन प्रबंधन सुनिश्चित करता है"] },
        { title: "उल्लंघन जोड़ें", description: "'उल्लंघन जोड़ें' पर क्लिक करें, प्राधिकरण प्रकार (नगरपालिका, स्वास्थ्य, श्रम, आदि) चुनें, राशि दर्ज करें और प्रारंभिक स्थिति सेट करें।", tips: ["सटीक ट्रैकिंग के लिए उल्लंघनों को तुरंत रिकॉर्ड करें", "सभी प्रासंगिक प्राधिकरण विवरण शामिल करें"] },
        { title: "PDF/छवि दस्तावेज अपलोड करें", description: "दस्तावेज़ीकरण के लिए उल्लंघन नोटिस, रसीदें और पत्राचार की PDF या छवि फाइलें अटैच करें।", tips: ["सभी उल्लंघन दस्तावेजों की डिजिटल प्रतियां रखें", "दिनांक और प्रकार के अनुसार दस्तावेज़ व्यवस्थित करें"] },
        { title: "स्थिति ट्रैक करें", description: "उल्लंघन स्थिति को लंबित, भुगतान या विवादित के रूप में मॉनिटर करें, और स्थिति बदलने पर अपडेट करें।", tips: ["अतिरिक्त दंड से बचने के लिए समय सीमा ट्रैक करें", "सभी स्थिति परिवर्तनों का दस्तावेज़ीकरण करें"] },
        { title: "स्वचालित रूप से बिल बनाएं", description: "अपनी वित्तीय ट्रैकिंग के साथ एकीकृत करने के लिए उल्लंघनों से स्वचालित रूप से खर्च बिल जनरेट करें।", tips: ["बिलों से लिंक करना सुनिश्चित करता है कि खर्च कैप्चर किए गए हैं", "उल्लंघन नोटिस के साथ राशियों का मिलान सत्यापित करें"] },
        { title: "सांख्यिकी डैशबोर्ड देखें", description: "समय के साथ कुल गणना, राशियां और रुझान दिखाने वाले उल्लंघन सांख्यिकी की समीक्षा करें।", tips: ["सांख्यिकी अनुपालन पैटर्न की पहचान करने में मदद करती हैं", "संचालन में सुधार और भविष्य के उल्लंघनों को कम करने के लिए डेटा का उपयोग करें"] }
      ]
    },
    {
      title: "प्रिंटर कॉन्फ़िगरेशन",
      description: "स्वचालित रसीद प्रिंटिंग के लिए QZ Tray एकीकरण के साथ थर्मल रसीद प्रिंटर कॉन्फ़िगर करें।",
      estimatedTime: "5 मिनट",
      steps: [
        { title: "सिस्टम मेनू में प्रिंटर एक्सेस करें", description: "प्रिंटर कॉन्फ़िगरेशन प्रबंधित करने के लिए सिस्टम मेनू के तहत 'प्रिंटर' पर नेविगेट करें।", tips: ["उचित प्रिंटर सेटअप विश्वसनीय रसीद प्रिंटिंग सुनिश्चित करता है"] },
        { title: "प्रिंटर जोड़ें", description: "'प्रिंटर जोड़ें' पर क्लिक करें, प्रिंटर नाम, IP पता दर्ज करें और कनेक्शन प्रकार चुनें।", tips: ["नेटवर्क प्रिंटर के लिए स्थिर IP पते का उपयोग करें", "आसान पहचान के लिए स्थान के अनुसार प्रिंटर नाम दें"] },
        { title: "ब्रांड चुनें", description: "समर्थित विकल्पों में से अपना प्रिंटर ब्रांड चुनें: Epson, Star Micronics, Brother, Zebra, या BIXOLON।", tips: ["उचित ड्राइवर कमांड के लिए सही ब्रांड चुनें", "मॉडल संगतता के लिए प्रिंटर दस्तावेज़ीकरण देखें"] },
        { title: "प्रति ब्रांच डिफ़ॉल्ट प्रिंटर सेट करें", description: "रसीद प्रिंटिंग को सुव्यवस्थित करने के लिए प्रत्येक शाखा के लिए एक डिफ़ॉल्ट प्रिंटर असाइन करें।", tips: ["डिफ़ॉल्ट प्रिंटर चेकआउट के दौरान मैनुअल चयन कम करता है", "विभिन्न ऑर्डर प्रकारों के लिए अलग डिफ़ॉल्ट कॉन्फ़िगर करें"] },
        { title: "टेस्ट पेज प्रिंट करें", description: "प्रिंटर कनेक्शन और प्रिंट गुणवत्ता सत्यापित करने के लिए 'टेस्ट प्रिंट' पर क्लिक करें।", tips: ["टेस्ट प्रिंटिंग उचित कॉन्फ़िगरेशन की पुष्टि करती है", "टेस्ट पेजों पर संरेखण और टेक्स्ट स्पष्टता जांचें"] },
        { title: "QZ Tray के साथ स्वचालित प्रिंटिंग", description: "स्वचालित साइलेंट प्रिंटिंग के लिए QZ Tray एकीकरण सेट करें, फॉलबैक के रूप में ब्राउज़र डायलॉग के साथ।", tips: ["QZ Tray सहज बैकग्राउंड प्रिंटिंग सक्षम करता है", "ब्राउज़र फॉलबैक QZ Tray के बिना प्रिंटिंग सुनिश्चित करता है"] }
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
    },
    {
      title: "ملازمین کا انتظام",
      description: "ٹیم ممبران کا انتظام کریں، تفصیلی اجازتوں کے ساتھ کردار مقرر کریں اور ملازمین کی کارکردگی کا سراغ لگائیں۔",
      estimatedTime: "6 منٹ",
      steps: [
        { title: "ملازمین میں جائیں", description: "ملازمین کے انتظام کے نظام تک رسائی کے لیے سائڈبار میں 'ملازمین' پر کلک کریں۔", tips: ["ملازمین کا انتظام آپ کی ٹیم کو منظم کرنے اور کارکردگی کو ٹریک کرنے کے لیے ضروری ہے"] },
        { title: "ملازم شامل کریں", description: "'ملازم شامل کریں' پر کلک کریں، نام، کردار، تنخواہ اور رابطے کی معلومات درج کریں تاکہ نئے ٹیم ممبر کا پروفائل بنایا جا سکے۔", tips: ["تنخواہ کی درست معلومات یقینی بنائیں", "ملازمت کی ذمہ داریوں کی بنیاد پر مناسب کردار تفویض کریں"] },
        { title: "19 تفصیلی اجازتیں ترتیب دیں", description: "ہر ملازم کے لیے 19 مختلف اجازتیں ترتیب دیں بشمول POS تک رسائی، انوینٹری کا انتظام، مالی رپورٹس، اور سسٹم کی ترتیبات۔", tips: ["اجازتیں کنٹرول کرتی ہیں کہ ہر ملازم کیا دیکھ اور تبدیل کر سکتا ہے", "حساس ڈیٹا تک رسائی صرف مجاز اہلکاروں تک محدود کریں"] },
        { title: "حاضری اور کارکردگی کا سراغ لگائیں", description: "ملازمین کی حاضری کے ریکارڈز، کام کے گھنٹے، اور وقت کے ساتھ کارکردگی کے میٹرکس کی نگرانی کریں۔", tips: ["باقاعدہ کارکردگی کی ٹریکنگ تربیت کی ضروریات کی شناخت میں مدد کرتی ہے", "شیڈولنگ کی اصلاح کے لیے حاضری کا ڈیٹا استعمال کریں"] },
        { title: "ملازم کی تفصیلات اپ ڈیٹ کریں", description: "ملازم کی معلومات میں ترمیم کریں، کردار تبدیل کریں، تنخواہیں ایڈجسٹ کریں، یا ضرورت کے مطابق اجازتیں تبدیل کریں۔", tips: ["درست رپورٹنگ کے لیے ملازم کے ریکارڈز کو موجودہ رکھیں", "کردار تبدیل ہونے پر اجازتیں اپ ڈیٹ کریں"] }
      ]
    },
    {
      title: "بل اور اخراجات",
      description: "دکان کے بل، خریداری کے اخراجات، یوٹیلیٹی ادائیگیاں اور تنخواہ کے اخراجات کو خودکار حسابات کے ساتھ ٹریک کریں۔",
      estimatedTime: "7 منٹ",
      steps: [
        { title: "دکان/بل تک رسائی حاصل کریں", description: "تمام کاروباری اخراجات دیکھنے اور ان کا انتظام کرنے کے لیے سائڈبار میں 'دکان' یا 'بل' پر جائیں۔", tips: ["بل سیکشن تمام اخراجات کی ٹریکنگ کو ایک جگہ مرکوز کرتا ہے"] },
        { title: "نیا بل شامل کریں", description: "'بل شامل کریں' پر کلک کریں، وینڈر کا نام، رقم، اخراجات کی قسم، اور مقررہ تاریخ درج کریں تاکہ نیا خرچ ریکارڈ ہو۔", tips: ["بہتر مالی رپورٹنگ کے لیے اخراجات کی درست درجہ بندی کریں", "حوالے کے لیے انوائس نمبر شامل کریں"] },
        { title: "اخراجات کی درجہ بندی کریں", description: "منظم اخراجات کی ٹریکنگ کے لیے بلوں کو یوٹیلیٹیز، کرایہ، سپلائیز، یا خریداری جیسی کیٹگریز میں تفویض کریں۔", tips: ["مناسب درجہ بندی تفصیلی اخراجات کے تجزیہ کو قابل بناتی ہے", "کاروبار کی مخصوص ضروریات کے لیے حسب ضرورت کیٹگریز بنائیں"] },
        { title: "ادائیگی کی حیثیت ٹریک کریں", description: "بل کی حیثیت کی نگرانی کریں جیسے زیر التواء یا ادا شدہ، اور ادائیگیاں ہونے پر اپ ڈیٹ کریں۔", tips: ["تاخیر سے ادائیگی کی فیس سے بچنے کے لیے زیر التواء بلوں کو ٹریک کریں", "ادائیگی کے فوراً بعد بلوں کو ادا شدہ کے طور پر نشان زد کریں"] },
        { title: "تنخواہ کے بل بنائیں", description: "پے رول ٹریکنگ اور رپورٹنگ کے لیے مہینے کے انتخاب کے ساتھ تنخواہ کے اخراجات کے ریکارڈز بنائیں۔", tips: ["تنخواہ کے بل ملازم کے ریکارڈز سے خودکار طور پر لنک ہوتے ہیں", "درست مدت کی ٹریکنگ کے لیے صحیح مہینہ منتخب کریں"] },
        { title: "خریداری کو بل سے لنک کریں", description: "مکمل اخراجات کی ٹریکنگ کے لیے خریداری کے آرڈرز کو متعلقہ بلوں سے جوڑیں۔", tips: ["لنک شدہ ریکارڈز مکمل آڈٹ ٹریل فراہم کرتے ہیں", "خریداری اور بلوں کے درمیان رقوم کی تصدیق کریں"] },
        { title: "اخراجات کی رپورٹ برآمد کریں", description: "اکاؤنٹنگ اور ٹیکس کے مقاصد کے لیے مختلف فارمیٹس میں اخراجات کی رپورٹس ڈاؤن لوڈ کریں۔", tips: ["باقاعدہ برآمدات مالی منصوبہ بندی کی معاونت کرتی ہیں", "مدت کی مخصوص رپورٹس بنانے کے لیے تاریخ کے فلٹرز استعمال کریں"] }
      ]
    },
    {
      title: "سپورٹ ٹکٹ",
      description: "سپورٹ درخواستیں جمع کریں، ٹکٹ کی حیثیت ٹریک کریں اور IT سپورٹ ٹیم کے ساتھ ریئل ٹائم میں بات چیت کریں۔",
      estimatedTime: "5 منٹ",
      steps: [
        { title: "سپورٹ سیکشن تک رسائی حاصل کریں", description: "سپورٹ ٹکٹ مینجمنٹ سسٹم کھولنے کے لیے سائڈبار میں 'سپورٹ' پر کلک کریں۔", tips: ["سپورٹ ٹکٹس تکنیکی مسائل کو مؤثر طریقے سے ٹریک اور حل کرنے میں مدد کرتے ہیں"] },
        { title: "ترجیح کے ساتھ نیا ٹکٹ بنائیں", description: "'نیا ٹکٹ' پر کلک کریں، مسئلے کی تفصیل درج کریں، ترجیحی سطح (کم، درمیانی، زیادہ، فوری) منتخب کریں، اور جمع کریں۔", tips: ["تیز حل کے لیے تفصیلی وضاحتیں فراہم کریں", "کاروباری اثر کی بنیاد پر مناسب ترجیح مقرر کریں"] },
        { title: "اٹیچمنٹس اپ لوڈ کریں", description: "سپورٹ ٹیم کو آپ کے مسئلے کو سمجھنے اور حل کرنے میں مدد کے لیے اسکرین شاٹس، دستاویزات، یا فائلز اٹیچ کریں۔", tips: ["اسکرین شاٹس مسائل کو واضح طور پر ظاہر کرنے میں مدد کرتے ہیں", "جب لاگو ہو تو غلطی کے پیغامات شامل کریں"] },
        { title: "ٹکٹ کی حیثیت ٹریک کریں", description: "اپنے ٹکٹس کی نگرانی کریں جب وہ اوپن، جاری، اور حل شدہ حالتوں میں آگے بڑھتے ہیں۔", tips: ["اپ ڈیٹس کے لیے باقاعدگی سے ٹکٹ کی حیثیت چیک کریں", "سپورٹ ٹیم کے سوالات کا فوری جواب دیں"] },
        { title: "ریئل ٹائم چیٹ استعمال کریں", description: "فوری مدد کے لیے بلٹ ان چیٹ فیچر کے ذریعے IT سپورٹ ٹیم کے ساتھ براہ راست بات چیت کریں۔", tips: ["ریئل ٹائم چیٹ مسئلے کے حل کو تیز کرتی ہے", "چیٹ کو مخصوص مسئلے پر مرکوز رکھیں"] },
        { title: "ٹکٹ کی تاریخ دیکھیں", description: "ماضی کے ٹکٹس اور ان کے حل کا جائزہ لیں یا بار بار آنے والے مسائل کی رپورٹ کریں۔", tips: ["تاریخی ٹکٹس پیٹرنز کی شناخت میں مدد کرتے ہیں", "ملتے جلتے مسائل کے لیے ماضی کے حل کا حوالہ دیں"] }
      ]
    },
    {
      title: "ٹیم چیٹ",
      description: "ڈائریکٹ میسج اور چینل گفتگو کے ذریعے ٹیم ممبران کے ساتھ بات چیت کریں۔",
      estimatedTime: "4 منٹ",
      steps: [
        { title: "ٹیم چیٹ تک رسائی حاصل کریں", description: "میسجنگ سسٹم کھولنے کے لیے سائڈبار میں 'چیٹ' یا 'ٹیم چیٹ' پر کلک کریں۔", tips: ["ٹیم چیٹ آپ کی تنظیم میں فوری رابطے کو قابل بناتی ہے"] },
        { title: "ڈائریکٹ میسج بھیجیں", description: "یوزر لسٹ سے کسی ساتھی کو منتخب کریں اور ایک دوسرے سے رابطے کے لیے نجی پیغامات بھیجیں۔", tips: ["ڈائریکٹ میسجز آپ اور وصول کنندہ کے درمیان نجی ہیں", "حساس یا ذاتی کام کی بحث کے لیے استعمال کریں"] },
        { title: "چینلز بنائیں/شامل ہوں", description: "ڈیپارٹمنٹس یا پروجیکٹس کے لیے تھیمڈ چینلز بنائیں، یا ٹیم کی بحث کے لیے موجودہ چینلز میں شامل ہوں۔", tips: ["چینلز موضوع کے لحاظ سے گفتگو کو منظم کرتے ہیں", "ان کے مقصد کی نشاندہی کے لیے چینلز کو واضح طور پر نام دیں"] },
        { title: "برانچ اور ریسٹورنٹ وسیع پیغام رسانی", description: "اعلانات اور اپ ڈیٹس کے لیے تمام برانچوں یا ریسٹورنٹ بھر میں ٹیم ممبران کے ساتھ بات چیت کریں۔", tips: ["اہم اعلانات کے لیے براڈکاسٹ چینلز استعمال کریں", "یقینی بنائیں کہ پیغامات مناسب سامعین تک پہنچیں"] },
        { title: "فائلز اور اپ ڈیٹس فوری شیئر کریں", description: "چیٹ کی گفتگو میں براہ راست فائلز، تصاویر، اور دستاویزات اپ لوڈ اور شیئر کریں۔", tips: ["فائل شیئرنگ تعاون کو آسان بناتی ہے", "شیئر کی گئی فائلوں کو منظم اور متعلقہ رکھیں"] }
      ]
    },
    {
      title: "خلاف ورزیوں کا انتظام",
      description: "سرکاری اتھارٹی کی خلاف ورزیوں کا سراغ لگائیں، دستاویزات اپ لوڈ کریں، ادائیگی کی حیثیت کا انتظام کریں اور بل سے لنک کریں۔",
      estimatedTime: "6 منٹ",
      steps: [
        { title: "خلاف ورزیوں کے صفحے تک رسائی حاصل کریں", description: "تمام ریگولیٹری خلاف ورزیوں کو دیکھنے اور ان کا انتظام کرنے کے لیے سائڈبار میں 'خلاف ورزیاں' پر جائیں۔", tips: ["مرکزی خلاف ورزی ٹریکنگ تعمیل کے انتظام کو یقینی بناتی ہے"] },
        { title: "خلاف ورزی شامل کریں", description: "'خلاف ورزی شامل کریں' پر کلک کریں، اتھارٹی کی قسم (میونسپلٹی، صحت، لیبر، وغیرہ) منتخب کریں، رقم درج کریں، اور ابتدائی حیثیت مقرر کریں۔", tips: ["درست ٹریکنگ کے لیے خلاف ورزیوں کو فوری طور پر ریکارڈ کریں", "تمام متعلقہ اتھارٹی کی تفصیلات شامل کریں"] },
        { title: "PDF/تصویری دستاویزات اپ لوڈ کریں", description: "دستاویزات کے لیے خلاف ورزی کے نوٹسز، رسیدوں، اور خط و کتابت کی PDF یا تصویری فائلز اٹیچ کریں۔", tips: ["تمام خلاف ورزی کی دستاویزات کی ڈیجیٹل کاپیاں رکھیں", "تاریخ اور قسم کے لحاظ سے دستاویزات کو منظم کریں"] },
        { title: "حیثیت ٹریک کریں", description: "خلاف ورزی کی حیثیت کی نگرانی کریں جیسے زیر التواء، ادا شدہ، یا متنازعہ، اور صورتحال کے بڑھنے پر اپ ڈیٹ کریں۔", tips: ["اضافی جرمانوں سے بچنے کے لیے ڈیڈ لائنز ٹریک کریں", "تمام حیثیت کی تبدیلیوں کو دستاویز کریں"] },
        { title: "خودکار طور پر بل بنائیں", description: "اپنی مالی ٹریکنگ کے ساتھ ضم کرنے کے لیے خلاف ورزیوں سے خودکار طور پر اخراجات کے بل بنائیں۔", tips: ["بلوں سے لنک کرنا یقینی بناتا ہے کہ اخراجات ریکارڈ ہوں", "خلاف ورزی کے نوٹسز کے ساتھ رقوم کی تصدیق کریں"] },
        { title: "شماریاتی ڈیش بورڈ دیکھیں", description: "کل تعداد، رقوم، اور وقت کے ساتھ رجحانات دکھانے والے خلاف ورزی کے اعدادوشمار کا جائزہ لیں۔", tips: ["اعدادوشمار تعمیل کے پیٹرنز کی شناخت میں مدد کرتے ہیں", "آپریشنز کو بہتر بنانے اور مستقبل کی خلاف ورزیوں کو کم کرنے کے لیے ڈیٹا استعمال کریں"] }
      ]
    },
    {
      title: "پرنٹر کنفیگریشن",
      description: "خودکار رسید پرنٹنگ کے لیے QZ Tray انضمام کے ساتھ تھرمل رسید پرنٹرز کنفیگر کریں۔",
      estimatedTime: "5 منٹ",
      steps: [
        { title: "سسٹم مینو میں پرنٹرز تک رسائی حاصل کریں", description: "پرنٹر کنفیگریشنز کا انتظام کرنے کے لیے سسٹم مینو کے تحت 'پرنٹرز' پر جائیں۔", tips: ["مناسب پرنٹر سیٹ اپ قابل اعتماد رسید پرنٹنگ کو یقینی بناتا ہے"] },
        { title: "پرنٹر شامل کریں", description: "'پرنٹر شامل کریں' پر کلک کریں، پرنٹر کا نام، IP ایڈریس درج کریں اور کنکشن کی قسم منتخب کریں۔", tips: ["نیٹ ورک پرنٹرز کے لیے جامد IP ایڈریسز استعمال کریں", "آسان شناخت کے لیے پرنٹرز کو مقام کے لحاظ سے نام دیں"] },
        { title: "برانڈ منتخب کریں", description: "معاون آپشنز سے اپنا پرنٹر برانڈ منتخب کریں: Epson، Star Micronics، Brother، Zebra، یا BIXOLON۔", tips: ["مناسب ڈرائیور کمانڈز کے لیے صحیح برانڈ منتخب کریں", "ماڈل کی مطابقت کے لیے پرنٹر کی دستاویزات دیکھیں"] },
        { title: "ہر برانچ کے لیے ڈیفالٹ پرنٹر سیٹ کریں", description: "رسید پرنٹنگ کو آسان بنانے کے لیے ہر برانچ کے لیے ایک ڈیفالٹ پرنٹر مقرر کریں۔", tips: ["ڈیفالٹ پرنٹر چیک آؤٹ کے دوران دستی انتخاب کو کم کرتا ہے", "مختلف آرڈر اقسام کے لیے الگ ڈیفالٹس کنفیگر کریں"] },
        { title: "ٹیسٹ پیج پرنٹ کریں", description: "پرنٹر کنکشن اور پرنٹ کوالٹی کی تصدیق کے لیے 'ٹیسٹ پرنٹ' پر کلک کریں۔", tips: ["ٹیسٹ پرنٹنگ مناسب کنفیگریشن کی تصدیق کرتی ہے", "ٹیسٹ پیجز پر الائنمنٹ اور ٹیکسٹ کی وضاحت چیک کریں"] },
        { title: "QZ Tray کے ساتھ خودکار پرنٹنگ", description: "خودکار خاموش پرنٹنگ کے لیے QZ Tray انضمام سیٹ کریں، فال بیک کے طور پر براؤزر ڈائیلاگ کے ساتھ۔", tips: ["QZ Tray بغیر رکاوٹ بیک گراؤنڈ پرنٹنگ کو قابل بناتا ہے", "براؤزر فال بیک QZ Tray کے بغیر پرنٹنگ کو یقینی بناتا ہے"] }
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
    },
    {
      title: "কর্মচারী ব্যবস্থাপনা",
      description: "দলের সদস্যদের পরিচালনা করুন, বিস্তারিত অনুমতি সহ ভূমিকা সেট করুন এবং কর্মচারী কর্মক্ষমতা ট্র্যাক করুন।",
      estimatedTime: "৬ মিনিট",
      steps: [
        { title: "কর্মচারীতে নেভিগেট করুন", description: "কর্মচারী ব্যবস্থাপনা সিস্টেম অ্যাক্সেস করতে সাইডবারে 'কর্মচারী'-তে ক্লিক করুন।", tips: ["কর্মচারী ব্যবস্থাপনা আপনার দল সংগঠিত করতে এবং কর্মক্ষমতা ট্র্যাক করতে অপরিহার্য"] },
        { title: "কর্মচারী যোগ করুন", description: "'কর্মচারী যোগ করুন'-এ ক্লিক করুন, নাম, ভূমিকা, বেতন এবং যোগাযোগের তথ্য প্রবেশ করুন একটি নতুন দলের সদস্যের প্রোফাইল তৈরি করতে।", tips: ["বেতন গণনার জন্য সঠিক বেতন তথ্য নিশ্চিত করুন", "কাজের দায়িত্বের উপর ভিত্তি করে উপযুক্ত ভূমিকা বরাদ্দ করুন"] },
        { title: "১৯টি বিস্তারিত অনুমতি কনফিগার করুন", description: "POS অ্যাক্সেস, ইনভেন্টরি ম্যানেজমেন্ট, আর্থিক রিপোর্ট এবং সিস্টেম সেটিংস সহ প্রতিটি কর্মচারীর জন্য ১৯টি বিভিন্ন অনুমতি সেট করুন।", tips: ["অনুমতি নিয়ন্ত্রণ করে প্রতিটি কর্মচারী কী দেখতে এবং পরিবর্তন করতে পারে", "শুধুমাত্র অনুমোদিত কর্মীদের সংবেদনশীল ডেটা অ্যাক্সেস সীমাবদ্ধ করুন"] },
        { title: "উপস্থিতি এবং কর্মক্ষমতা ট্র্যাক করুন", description: "সময়ের সাথে কর্মচারী উপস্থিতি রেকর্ড, কাজের ঘন্টা এবং কর্মক্ষমতা মেট্রিক্স মনিটর করুন।", tips: ["নিয়মিত কর্মক্ষমতা ট্র্যাকিং প্রশিক্ষণ প্রয়োজন সনাক্ত করতে সাহায্য করে", "সময়সূচী অপ্টিমাইজেশনের জন্য উপস্থিতি ডেটা ব্যবহার করুন"] },
        { title: "কর্মচারীর বিবরণ আপডেট করুন", description: "প্রয়োজন অনুযায়ী কর্মচারীর তথ্য সম্পাদনা করুন, ভূমিকা পরিবর্তন করুন, বেতন সমন্বয় করুন বা অনুমতি পরিবর্তন করুন।", tips: ["সঠিক রিপোর্টিংয়ের জন্য কর্মচারী রেকর্ড আপডেট রাখুন", "ভূমিকা পরিবর্তন হলে অনুমতি আপডেট করুন"] }
      ]
    },
    {
      title: "বিল এবং খরচ",
      description: "দোকানের বিল, ক্রয় খরচ, ইউটিলিটি পেমেন্ট এবং বেতন খরচ স্বয়ংক্রিয় গণনার সাথে ট্র্যাক করুন।",
      estimatedTime: "৭ মিনিট",
      steps: [
        { title: "দোকান/বিল অ্যাক্সেস করুন", description: "সমস্ত ব্যবসায়িক খরচ দেখতে এবং পরিচালনা করতে সাইডবারে 'দোকান' বা 'বিল'-এ নেভিগেট করুন।", tips: ["বিল সেকশন এক জায়গায় সমস্ত খরচ ট্র্যাকিং কেন্দ্রীভূত করে"] },
        { title: "নতুন বিল যোগ করুন", description: "'বিল যোগ করুন'-এ ক্লিক করুন, বিক্রেতার নাম, পরিমাণ, খরচের ধরন এবং নির্ধারিত তারিখ প্রবেশ করুন একটি নতুন খরচ রেকর্ড করতে।", tips: ["ভালো আর্থিক রিপোর্টিংয়ের জন্য খরচ সঠিকভাবে শ্রেণীবদ্ধ করুন", "রেফারেন্সের জন্য ইনভয়েস নম্বর অন্তর্ভুক্ত করুন"] },
        { title: "খরচ শ্রেণীবদ্ধ করুন", description: "সংগঠিত খরচ ট্র্যাকিংয়ের জন্য বিলগুলিকে ইউটিলিটি, ভাড়া, সরবরাহ বা ক্রয়ের মতো ক্যাটাগরিতে বরাদ্দ করুন।", tips: ["সঠিক শ্রেণীবিভাগ বিস্তারিত খরচ বিশ্লেষণ সক্ষম করে", "ব্যবসা-নির্দিষ্ট প্রয়োজনের জন্য কাস্টম ক্যাটাগরি তৈরি করুন"] },
        { title: "পেমেন্ট স্ট্যাটাস ট্র্যাক করুন", description: "বিলের স্ট্যাটাস মুলতুবি বা পরিশোধিত হিসাবে মনিটর করুন এবং পেমেন্ট করা হলে আপডেট করুন।", tips: ["বিলম্বিত পেমেন্ট ফি এড়াতে মুলতুবি বিল ট্র্যাক করুন", "পেমেন্টের পরে তাৎক্ষণিকভাবে বিল পরিশোধিত হিসাবে চিহ্নিত করুন"] },
        { title: "বেতন বিল জেনারেট করুন", description: "বেতন ট্র্যাকিং এবং রিপোর্টিংয়ের জন্য মাস নির্বাচন সহ বেতন খরচ রেকর্ড তৈরি করুন।", tips: ["বেতন বিল স্বয়ংক্রিয়ভাবে কর্মচারী রেকর্ডের সাথে লিঙ্ক করে", "সঠিক সময়কাল ট্র্যাকিংয়ের জন্য সঠিক মাস নির্বাচন করুন"] },
        { title: "ক্রয় বিলের সাথে লিংক করুন", description: "সম্পূর্ণ খরচ ট্র্যাকিংয়ের জন্য ক্রয় অর্ডার সংশ্লিষ্ট বিলের সাথে সংযুক্ত করুন।", tips: ["লিঙ্কড রেকর্ড সম্পূর্ণ অডিট ট্রেইল প্রদান করে", "ক্রয় এবং বিলের মধ্যে পরিমাণ মিলছে কিনা যাচাই করুন"] },
        { title: "খরচ রিপোর্ট এক্সপোর্ট করুন", description: "অ্যাকাউন্টিং এবং ট্যাক্স উদ্দেশ্যে বিভিন্ন ফরম্যাটে খরচ রিপোর্ট ডাউনলোড করুন।", tips: ["নিয়মিত এক্সপোর্ট আর্থিক পরিকল্পনা সমর্থন করে", "সময়কাল-নির্দিষ্ট রিপোর্ট তৈরি করতে তারিখ ফিল্টার ব্যবহার করুন"] }
      ]
    },
    {
      title: "সাপোর্ট টিকেট",
      description: "সাপোর্ট অনুরোধ জমা দিন, টিকেট স্ট্যাটাস ট্র্যাক করুন এবং IT সাপোর্ট টিমের সাথে রিয়েল-টাইমে যোগাযোগ করুন।",
      estimatedTime: "৫ মিনিট",
      steps: [
        { title: "সাপোর্ট সেকশন অ্যাক্সেস করুন", description: "সাপোর্ট টিকেট ম্যানেজমেন্ট সিস্টেম খুলতে সাইডবারে 'সাপোর্ট'-এ ক্লিক করুন।", tips: ["সাপোর্ট টিকেট প্রযুক্তিগত সমস্যা দক্ষতার সাথে ট্র্যাক এবং সমাধান করতে সাহায্য করে"] },
        { title: "অগ্রাধিকার সহ নতুন টিকেট তৈরি করুন", description: "'নতুন টিকেট'-এ ক্লিক করুন, সমস্যার বিবরণ প্রবেশ করুন, অগ্রাধিকার স্তর (নিম্ন, মাঝারি, উচ্চ, জরুরি) নির্বাচন করুন এবং জমা দিন।", tips: ["দ্রুত সমাধানের জন্য বিস্তারিত বিবরণ প্রদান করুন", "ব্যবসায়িক প্রভাবের উপর ভিত্তি করে উপযুক্ত অগ্রাধিকার সেট করুন"] },
        { title: "অ্যাটাচমেন্ট আপলোড করুন", description: "সাপোর্ট টিমকে আপনার সমস্যা বুঝতে এবং সমাধান করতে সাহায্য করতে স্ক্রিনশট, ডকুমেন্ট বা ফাইল সংযুক্ত করুন।", tips: ["স্ক্রিনশট সমস্যা স্পষ্টভাবে চিত্রিত করতে সাহায্য করে", "প্রযোজ্য হলে ত্রুটি বার্তা অন্তর্ভুক্ত করুন"] },
        { title: "টিকেট স্ট্যাটাস ট্র্যাক করুন", description: "আপনার টিকেটগুলি ওপেন, প্রগ্রেসে এবং সমাধানকৃত স্থিতিতে অগ্রসর হওয়ার সাথে মনিটর করুন।", tips: ["আপডেটের জন্য নিয়মিত টিকেট স্ট্যাটাস পরীক্ষা করুন", "সাপোর্ট টিমের প্রশ্নে দ্রুত সাড়া দিন"] },
        { title: "রিয়েল-টাইম চ্যাট ব্যবহার করুন", description: "দ্রুত সহায়তার জন্য বিল্ট-ইন চ্যাট ফিচারের মাধ্যমে IT সাপোর্ট টিমের সাথে সরাসরি যোগাযোগ করুন।", tips: ["রিয়েল-টাইম চ্যাট সমস্যা সমাধান দ্রুত করে", "চ্যাট নির্দিষ্ট সমস্যায় ফোকাস রাখুন"] },
        { title: "টিকেট ইতিহাস দেখুন", description: "রেফারেন্সের জন্য বা পুনরাবৃত্ত সমস্যা রিপোর্ট করতে অতীত টিকেট এবং তাদের সমাধান পর্যালোচনা করুন।", tips: ["ঐতিহাসিক টিকেট প্যাটার্ন সনাক্ত করতে সাহায্য করে", "অনুরূপ সমস্যার জন্য অতীত সমাধান রেফারেন্স করুন"] }
      ]
    },
    {
      title: "টিম চ্যাট",
      description: "সরাসরি বার্তা এবং চ্যানেল কথোপকথনের মাধ্যমে দলের সদস্যদের সাথে যোগাযোগ করুন।",
      estimatedTime: "৪ মিনিট",
      steps: [
        { title: "টিম চ্যাট অ্যাক্সেস করুন", description: "মেসেজিং সিস্টেম খুলতে সাইডবারে 'চ্যাট' বা 'টিম চ্যাট'-এ ক্লিক করুন।", tips: ["টিম চ্যাট আপনার সংস্থা জুড়ে তাৎক্ষণিক যোগাযোগ সক্ষম করে"] },
        { title: "সরাসরি বার্তা পাঠান", description: "একের পর এক যোগাযোগের জন্য ইউজার লিস্ট থেকে একজন সহকর্মী নির্বাচন করুন এবং ব্যক্তিগত বার্তা পাঠান।", tips: ["সরাসরি বার্তা আপনার এবং প্রাপকের মধ্যে ব্যক্তিগত", "সংবেদনশীল বা ব্যক্তিগত কাজের আলোচনার জন্য ব্যবহার করুন"] },
        { title: "চ্যানেল তৈরি/যোগদান করুন", description: "বিভাগ বা প্রকল্পের জন্য থিমযুক্ত চ্যানেল তৈরি করুন, বা দলীয় আলোচনার জন্য বিদ্যমান চ্যানেলে যোগদান করুন।", tips: ["চ্যানেল বিষয় অনুসারে কথোপকথন সংগঠিত করে", "তাদের উদ্দেশ্য নির্দেশ করতে চ্যানেল স্পষ্টভাবে নাম দিন"] },
        { title: "শাখা এবং রেস্তোরাঁ-ব্যাপী মেসেজিং", description: "ঘোষণা এবং আপডেটের জন্য শাখা জুড়ে বা রেস্তোরাঁ-ব্যাপী সমস্ত দলের সদস্যদের সাথে যোগাযোগ করুন।", tips: ["গুরুত্বপূর্ণ ঘোষণার জন্য ব্রডকাস্ট চ্যানেল ব্যবহার করুন", "বার্তা উপযুক্ত দর্শকদের কাছে পৌঁছায় তা নিশ্চিত করুন"] },
        { title: "ফাইল এবং আপডেট তাৎক্ষণিক শেয়ার করুন", description: "চ্যাট কথোপকথনে সরাসরি ফাইল, ছবি এবং ডকুমেন্ট আপলোড এবং শেয়ার করুন।", tips: ["ফাইল শেয়ারিং সহযোগিতা সহজতর করে", "শেয়ার করা ফাইল সংগঠিত এবং প্রাসঙ্গিক রাখুন"] }
      ]
    },
    {
      title: "লঙ্ঘন ব্যবস্থাপনা",
      description: "সরকারি কর্তৃপক্ষের লঙ্ঘন ট্র্যাক করুন, ডকুমেন্ট আপলোড করুন, পেমেন্ট স্ট্যাটাস পরিচালনা করুন এবং বিলের সাথে লিংক করুন।",
      estimatedTime: "৬ মিনিট",
      steps: [
        { title: "লঙ্ঘন পৃষ্ঠা অ্যাক্সেস করুন", description: "সমস্ত নিয়ন্ত্রক লঙ্ঘন দেখতে এবং পরিচালনা করতে সাইডবারে 'লঙ্ঘন'-এ নেভিগেট করুন।", tips: ["কেন্দ্রীভূত লঙ্ঘন ট্র্যাকিং কমপ্লায়েন্স ম্যানেজমেন্ট নিশ্চিত করে"] },
        { title: "লঙ্ঘন যোগ করুন", description: "'লঙ্ঘন যোগ করুন'-এ ক্লিক করুন, কর্তৃপক্ষের ধরন (পৌরসভা, স্বাস্থ্য, শ্রম ইত্যাদি) নির্বাচন করুন, পরিমাণ প্রবেশ করুন এবং প্রাথমিক স্ট্যাটাস সেট করুন।", tips: ["সঠিক ট্র্যাকিংয়ের জন্য লঙ্ঘন দ্রুত রেকর্ড করুন", "সমস্ত প্রাসঙ্গিক কর্তৃপক্ষ বিবরণ অন্তর্ভুক্ত করুন"] },
        { title: "PDF/ছবি ডকুমেন্ট আপলোড করুন", description: "ডকুমেন্টেশনের জন্য লঙ্ঘন নোটিশ, রসিদ এবং চিঠিপত্রের PDF বা ছবি ফাইল সংযুক্ত করুন।", tips: ["সমস্ত লঙ্ঘন ডকুমেন্টের ডিজিটাল কপি রাখুন", "তারিখ এবং ধরন অনুসারে ডকুমেন্ট সংগঠিত করুন"] },
        { title: "স্ট্যাটাস ট্র্যাক করুন", description: "লঙ্ঘন স্ট্যাটাস মুলতুবি, পরিশোধিত বা বিতর্কিত হিসাবে মনিটর করুন এবং পরিস্থিতি অগ্রসর হলে আপডেট করুন।", tips: ["অতিরিক্ত জরিমানা এড়াতে ডেডলাইন ট্র্যাক করুন", "সমস্ত স্ট্যাটাস পরিবর্তন ডকুমেন্ট করুন"] },
        { title: "স্বয়ংক্রিয়ভাবে বিল তৈরি করুন", description: "আপনার আর্থিক ট্র্যাকিংয়ের সাথে ইন্টিগ্রেট করতে লঙ্ঘন থেকে স্বয়ংক্রিয়ভাবে খরচ বিল তৈরি করুন।", tips: ["বিলের সাথে লিংক করা নিশ্চিত করে খরচ রেকর্ড হয়", "লঙ্ঘন নোটিশের সাথে পরিমাণ মিলছে কিনা যাচাই করুন"] },
        { title: "পরিসংখ্যান ড্যাশবোর্ড দেখুন", description: "মোট সংখ্যা, পরিমাণ এবং সময়ের সাথে প্রবণতা দেখানো লঙ্ঘন পরিসংখ্যান পর্যালোচনা করুন।", tips: ["পরিসংখ্যান কমপ্লায়েন্স প্যাটার্ন সনাক্ত করতে সাহায্য করে", "অপারেশন উন্নত করতে এবং ভবিষ্যত লঙ্ঘন কমাতে ডেটা ব্যবহার করুন"] }
      ]
    },
    {
      title: "প্রিন্টার কনফিগারেশন",
      description: "স্বয়ংক্রিয় রসিদ প্রিন্টিংয়ের জন্য QZ Tray ইন্টিগ্রেশন সহ থার্মাল রসিদ প্রিন্টার কনফিগার করুন।",
      estimatedTime: "৫ মিনিট",
      steps: [
        { title: "সিস্টেম মেনুতে প্রিন্টার অ্যাক্সেস করুন", description: "প্রিন্টার কনফিগারেশন পরিচালনা করতে সিস্টেম মেনুর অধীনে 'প্রিন্টার'-এ নেভিগেট করুন।", tips: ["সঠিক প্রিন্টার সেটআপ নির্ভরযোগ্য রসিদ প্রিন্টিং নিশ্চিত করে"] },
        { title: "প্রিন্টার যোগ করুন", description: "'প্রিন্টার যোগ করুন'-এ ক্লিক করুন, প্রিন্টারের নাম, IP ঠিকানা প্রবেশ করুন এবং সংযোগের ধরন নির্বাচন করুন।", tips: ["নেটওয়ার্ক প্রিন্টারের জন্য স্ট্যাটিক IP ঠিকানা ব্যবহার করুন", "সহজ শনাক্তকরণের জন্য অবস্থান অনুসারে প্রিন্টার নাম দিন"] },
        { title: "ব্র্যান্ড নির্বাচন করুন", description: "সমর্থিত অপশন থেকে আপনার প্রিন্টার ব্র্যান্ড নির্বাচন করুন: Epson, Star Micronics, Brother, Zebra, বা BIXOLON।", tips: ["সঠিক ড্রাইভার কমান্ডের জন্য সঠিক ব্র্যান্ড নির্বাচন করুন", "মডেল সামঞ্জস্যতার জন্য প্রিন্টার ডকুমেন্টেশন দেখুন"] },
        { title: "প্রতি শাখায় ডিফল্ট প্রিন্টার সেট করুন", description: "রসিদ প্রিন্টিং সহজতর করতে প্রতিটি শাখার জন্য একটি ডিফল্ট প্রিন্টার বরাদ্দ করুন।", tips: ["ডিফল্ট প্রিন্টার চেকআউটের সময় ম্যানুয়াল নির্বাচন কমায়", "বিভিন্ন অর্ডার ধরনের জন্য আলাদা ডিফল্ট কনফিগার করুন"] },
        { title: "টেস্ট পেজ প্রিন্ট করুন", description: "প্রিন্টার সংযোগ এবং প্রিন্ট কোয়ালিটি যাচাই করতে 'টেস্ট প্রিন্ট'-এ ক্লিক করুন।", tips: ["টেস্ট প্রিন্টিং সঠিক কনফিগারেশন নিশ্চিত করে", "টেস্ট পেজে অ্যালাইনমেন্ট এবং টেক্সট স্পষ্টতা পরীক্ষা করুন"] },
        { title: "QZ Tray দিয়ে স্বয়ংক্রিয় প্রিন্টিং", description: "স্বয়ংক্রিয় সাইলেন্ট প্রিন্টিংয়ের জন্য QZ Tray ইন্টিগ্রেশন সেট করুন, ফলব্যাক হিসাবে ব্রাউজার ডায়ালগ সহ।", tips: ["QZ Tray বিরামহীন ব্যাকগ্রাউন্ড প্রিন্টিং সক্ষম করে", "ব্রাউজার ফলব্যাক QZ Tray ছাড়া প্রিন্টিং নিশ্চিত করে"] }
      ]
    }
  ],

  // Italian - uses English as fallback via the fallback mechanism below
  it: [],

  // Spanish - uses English as fallback via the fallback mechanism below
  es: [],

  // Tagalog - uses English as fallback via the fallback mechanism below
  tl: []
};

// For languages without full translations, use English as fallback
Object.keys(tutorialContent).forEach((lang) => {
  if (tutorialContent[lang as Language].length === 0) {
    tutorialContent[lang as Language] = tutorialContent.en;
  }
});
