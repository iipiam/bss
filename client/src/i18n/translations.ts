// Translation system for multi-language support
// Supported languages: Arabic, English, Chinese, German, Hindi, Urdu, Bengali

export type Language = 'English' | 'Arabic' | 'Chinese' | 'German' | 'Hindi' | 'Urdu' | 'Bengali';

export interface Translations {
  // Navigation
  dashboard: string;
  branches: string;
  inventory: string;
  menu: string;
  recipes: string;
  customers: string;
  orders: string;
  kitchen: string;
  procurement: string;
  sales: string;
  financial: string;
  profitability: string;
  invoices: string;
  employees: string;
  settings: string;
  pos: string;
  logout: string;
  
  // Navigation Groups
  operations: string;
  management: string;
  analytics: string;
  system: string;
  support: string;
  
  // Support
  help: string;
  technicalSupport: string;
  contactSupport: string;
  contactInformation: string;
  whatsapp: string;
  getInTouch: string;
  
  // Payment Methods
  paymentMethod: string;
  cash: string;
  atm: string;
  
  // Forecasting
  forecasting: string;
  demandForecasting: string;
  salesPrediction: string;
  trendAnalysis: string;
  forecastPeriod: string;
  predictedSales: string;
  totalSales: string;
  
  // Performance Analysis
  performanceAnalysis: string;
  performanceAnalysisDesc: string;
  dod: string;
  wow: string;
  mom: string;
  yoy: string;
  dashboardOverview: string;
  currentPeriod: string;
  previous: string;
  
  // Peak Hours Analysis
  peakHoursAnalysis: string;
  peakHour: string;
  hourlySalesDistribution: string;
  salesAmount: string;
  am: string;
  pm: string;
  customersAt: string;
  customerOrders: string;
  noCustomersFound: string;
  walkInCustomer: string;
  
  // Common
  add: string;
  edit: string;
  delete: string;
  save: string;
  cancel: string;
  search: string;
  filter: string;
  export: string;
  import: string;
  download: string;
  upload: string;
  submit: string;
  loading: string;
  noData: string;
  
  // Dashboard
  totalRevenue: string;
  totalOrders: string;
  totalCustomers: string;
  revenueGrowth: string;
  salesOverview: string;
  topSellingItems: string;
  recentOrders: string;
  
  // Inventory
  itemName: string;
  category: string;
  quantity: string;
  unit: string;
  supplier: string;
  status: string;
  inStock: string;
  lowStock: string;
  outOfStock: string;
  
  // Menu
  price: string;
  basePrice: string;
  vatAmount: string;
  discount: string;
  discountPercentage: string;
  description: string;
  available: string;
  unavailable: string;
  
  // Orders
  orderNumber: string;
  customerName: string;
  orderType: string;
  table: string;
  subtotal: string;
  tax: string;
  total: string;
  pending: string;
  preparing: string;
  ready: string;
  completed: string;
  cancelled: string;
  
  // Financial
  revenue: string;
  expenses: string;
  profit: string;
  margin: string;
  vatReports: string;
  zatcaInvoices: string;
  invoiceNumber: string;
  invoiceDate: string;
  
  // Settings
  restaurantName: string;
  vatNumber: string;
  email: string;
  phone: string;
  address: string;
  language: string;
  updateSettings: string;
  settingsDescription: string;
  restaurantInformation: string;
  invoiceConfiguration: string;
  invoiceConfigurationDescription: string;
  
  // Placeholders
  enterRestaurantName: string;
  enterVatNumber: string;
  enterEmail: string;
  enterPhone: string;
  enterAddress: string;
  enterDiscount: string;
  
  // Authentication
  login: string;
  signup: string;
  password: string;
  confirmPassword: string;
  username: string;
  forgotPassword: string;
  resetPassword: string;
  
  // Messages
  success: string;
  error: string;
  confirmDelete: string;
  itemAdded: string;
  itemUpdated: string;
  itemDeleted: string;
  settingsUpdated: string;
  savingSettings: string;
  
  // Customer
  addCustomer: string;
  editCustomer: string;
  newCustomer: string;
  existingCustomer: string;
  selectCustomer: string;
  
  // Tutorial
  tutorial: string;
  tutorialSubtitle: string;
  tutorialGettingStarted: string;
  tutorialPOS: string;
  tutorialPOSDesc: string;
  tutorialInventory: string;
  tutorialInventoryDesc: string;
  tutorialMenu: string;
  tutorialMenuDesc: string;
  tutorialRecipes: string;
  tutorialRecipesDesc: string;
  tutorialCustomers: string;
  tutorialCustomersDesc: string;
  tutorialOrders: string;
  tutorialOrdersDesc: string;
  tutorialDashboard: string;
  tutorialDashboardDesc: string;
  tutorialSales: string;
  tutorialSalesDesc: string;
  tutorialProfitability: string;
  tutorialProfitabilityDesc: string;
  tutorialForecasting: string;
  tutorialForecastingDesc: string;
  tutorialInvoices: string;
  tutorialInvoicesDesc: string;
  tutorialFinancial: string;
  tutorialFinancialDesc: string;
  tutorialStep1: string;
  tutorialStep2: string;
  tutorialStep3: string;
  tutorialStep4: string;
  tutorialStep5: string;
  
  // Shop
  shop: string;
  shopExpenses: string;
  salaries: string;
  salary: string;
  employeeName: string;
  position: string;
  amount: string;
  paymentDate: string;
  addSalary: string;
  editSalary: string;
  shopBills: string;
  billType: string;
  rent: string;
  electricity: string;
  water: string;
  gas: string;
  other: string;
  addBill: string;
  editBill: string;
  totalSalaries: string;
  totalBills: string;
  totalShopExpenses: string;
  monthlyExpenses: string;
}

export const translations: Record<Language, Translations> = {
  English: {
    // Navigation
    dashboard: 'Dashboard',
    branches: 'Branches',
    inventory: 'Inventory',
    menu: 'Menu',
    recipes: 'Recipes',
    customers: 'Customers',
    orders: 'Orders',
    kitchen: 'Kitchen',
    procurement: 'Procurement',
    sales: 'Sales',
    financial: 'Financial',
    profitability: 'Profitability',
    invoices: 'Invoices',
    employees: 'Employees',
    settings: 'Settings',
    pos: 'POS',
    logout: 'Logout',
    
    // Navigation Groups
    operations: 'Operations',
    management: 'Management',
    analytics: 'Analytics',
    system: 'System',
    support: 'Support',
    
    // Support
    help: 'Help',
    technicalSupport: 'Technical Support',
    contactSupport: 'Contact Support',
    contactInformation: 'Contact Information',
    whatsapp: 'WhatsApp',
    getInTouch: 'Get in touch with our support team',
    
    // Payment Methods
    paymentMethod: 'Payment Method',
    cash: 'Cash',
    atm: 'ATM / Card',
    
    // Forecasting
    forecasting: 'Forecasting',
    demandForecasting: 'Demand Forecasting',
    salesPrediction: 'Sales Prediction',
    trendAnalysis: 'Trend Analysis',
    forecastPeriod: 'Forecast Period',
    predictedSales: 'Predicted Sales',
    totalSales: 'Total Sales',
    
    // Performance Analysis
    performanceAnalysis: 'Performance Analysis',
    performanceAnalysisDesc: 'Compare sales across different time periods',
    dod: 'Day-over-Day (DoD)',
    wow: 'Week-over-Week (WoW)',
    mom: 'Month-over-Month (MoM)',
    yoy: 'Year-over-Year (YoY)',
    dashboardOverview: 'Overview of your restaurant performance',
    currentPeriod: 'Current Period',
    previous: 'Previous',
    
    // Peak Hours Analysis
    peakHoursAnalysis: 'Peak Hours Analysis',
    peakHour: 'Peak Hour',
    hourlySalesDistribution: 'Hourly Sales Distribution',
    salesAmount: 'Sales Amount',
    am: 'AM',
    pm: 'PM',
    customersAt: 'Customers at',
    customerOrders: 'Customer Orders',
    noCustomersFound: 'No customers found for this hour',
    walkInCustomer: 'Walk-in Customer',
    
    // Common
    add: 'Add',
    edit: 'Edit',
    delete: 'Delete',
    save: 'Save',
    cancel: 'Cancel',
    search: 'Search',
    filter: 'Filter',
    export: 'Export',
    import: 'Import',
    download: 'Download',
    upload: 'Upload',
    submit: 'Submit',
    loading: 'Loading...',
    noData: 'No data available',
    
    // Dashboard
    totalRevenue: 'Total Revenue',
    totalOrders: 'Total Orders',
    totalCustomers: 'Total Customers',
    revenueGrowth: 'Revenue Growth',
    salesOverview: 'Sales Overview',
    topSellingItems: 'Top Selling Items',
    recentOrders: 'Recent Orders',
    
    // Inventory
    itemName: 'Item Name',
    category: 'Category',
    quantity: 'Quantity',
    unit: 'Unit',
    supplier: 'Supplier',
    status: 'Status',
    inStock: 'In Stock',
    lowStock: 'Low Stock',
    outOfStock: 'Out of Stock',
    
    // Menu
    price: 'Price',
    basePrice: 'Base Price',
    vatAmount: 'VAT Amount',
    discount: 'Discount',
    discountPercentage: 'Discount %',
    description: 'Description',
    available: 'Available',
    unavailable: 'Unavailable',
    
    // Orders
    orderNumber: 'Order Number',
    customerName: 'Customer Name',
    orderType: 'Order Type',
    table: 'Table',
    subtotal: 'Subtotal',
    tax: 'Tax (VAT 15%)',
    total: 'Total',
    pending: 'Pending',
    preparing: 'Preparing',
    ready: 'Ready',
    completed: 'Completed',
    cancelled: 'Cancelled',
    
    // Financial
    revenue: 'Revenue',
    expenses: 'Expenses',
    profit: 'Profit',
    margin: 'Margin',
    vatReports: 'VAT Reports',
    zatcaInvoices: 'ZATCA Invoices',
    invoiceNumber: 'Invoice Number',
    invoiceDate: 'Invoice Date',
    
    // Settings
    restaurantName: 'Restaurant Name',
    vatNumber: 'VAT Number',
    email: 'Email',
    phone: 'Phone',
    address: 'Address',
    language: 'Language',
    updateSettings: 'Update Settings',
    settingsDescription: 'Configure restaurant information and preferences',
    restaurantInformation: 'Restaurant Information',
    invoiceConfiguration: 'Invoice Configuration',
    invoiceConfigurationDescription: 'The information above will appear on all ZATCA-compliant invoices generated by the system. Make sure all details are accurate and up-to-date to ensure compliance with Saudi tax regulations.',
    
    // Placeholders
    enterRestaurantName: 'Enter restaurant name',
    enterVatNumber: 'Enter VAT number',
    enterEmail: 'info@restaurant.com',
    enterPhone: '+966 XX XXX XXXX',
    enterAddress: 'Enter full address',
    enterDiscount: 'Enter discount percentage (0-100)',
    
    // Authentication
    login: 'Login',
    signup: 'Sign Up',
    password: 'Password',
    confirmPassword: 'Confirm Password',
    username: 'Username',
    forgotPassword: 'Forgot Password',
    resetPassword: 'Reset Password',
    
    // Messages
    success: 'Success',
    error: 'Error',
    confirmDelete: 'Are you sure you want to delete this item?',
    itemAdded: 'Item added successfully',
    itemUpdated: 'Item updated successfully',
    itemDeleted: 'Item deleted successfully',
    settingsUpdated: 'Settings updated successfully',
    savingSettings: 'Saving...',
    
    // Customer
    addCustomer: 'Add Customer',
    editCustomer: 'Edit Customer',
    newCustomer: 'New Customer',
    existingCustomer: 'Existing Customer',
    selectCustomer: 'Select Customer',
    
    // Tutorial
    tutorial: 'Tutorial',
    tutorialSubtitle: 'Learn how to use all features of the restaurant management system',
    tutorialGettingStarted: 'Getting Started',
    tutorialPOS: 'Point of Sale (POS)',
    tutorialPOSDesc: 'Navigate to POS to create new sales transactions. Add items from your menu, select payment method (Cash/ATM), choose customer (or walk-in), and complete the sale. ZATCA-compliant invoices are automatically generated.',
    tutorialInventory: 'Inventory Management',
    tutorialInventoryDesc: 'Add and track inventory items with quantities and unit prices. Use Excel import/export for bulk management. Monitor stock levels and receive low stock alerts.',
    tutorialMenu: 'Menu Management',
    tutorialMenuDesc: 'Create menu items with VAT-inclusive pricing (15% Saudi VAT). Set base prices, apply discounts, and link to recipes for automatic cost calculation. Mark items as available or unavailable.',
    tutorialRecipes: 'Recipe Management',
    tutorialRecipesDesc: 'Create recipes by linking ingredients from inventory. System automatically calculates recipe costs based on ingredient quantities and unit prices for accurate profitability analysis.',
    tutorialCustomers: 'Customer Management',
    tutorialCustomersDesc: 'Add and manage customer information including names, phone numbers, and addresses. View order history for each customer and select them during POS checkout.',
    tutorialOrders: 'Order Management',
    tutorialOrdersDesc: 'View and manage all orders with different statuses (Pending, Preparing, Ready, Completed). Track order types (Dine-in, Takeaway, Delivery) and payment methods.',
    tutorialDashboard: 'Dashboard Analytics',
    tutorialDashboardDesc: 'Monitor real-time performance with DoD/WoW/MoM/YoY comparisons. Analyze peak hours with customer drill-down. View sales trends, active orders, and key metrics at a glance.',
    tutorialSales: 'Sales Reports',
    tutorialSalesDesc: 'Generate detailed sales reports by date range, branch, or category. Export data to Excel for further analysis. Track revenue trends and identify top-selling items.',
    tutorialProfitability: 'Profitability Analysis',
    tutorialProfitabilityDesc: 'Analyze profit margins, cost structures, and pricing strategies. Compare menu item profitability and identify opportunities for cost optimization and revenue growth.',
    tutorialForecasting: 'Demand Forecasting',
    tutorialForecastingDesc: 'Use AI-powered forecasting to predict future sales trends. Plan inventory purchases and staff scheduling based on predicted demand patterns.',
    tutorialInvoices: 'ZATCA Invoices',
    tutorialInvoicesDesc: 'View all ZATCA-compliant bilingual invoices (Arabic/English). Search by invoice number or customer name. Download PDF copies with QR codes for verification.',
    tutorialFinancial: 'Financial Reports',
    tutorialFinancialDesc: 'Generate comprehensive financial statements including income statements and expense reports. Export to PDF for accounting purposes and regulatory compliance.',
    tutorialStep1: 'Set up your restaurant information in Settings (restaurant name, VAT number, contact details)',
    tutorialStep2: 'Add inventory items with unit prices and quantities',
    tutorialStep3: 'Create menu items and link them to recipes for cost tracking',
    tutorialStep4: 'Add customers or use walk-in option for quick sales',
    tutorialStep5: 'Start selling through POS and monitor analytics on the Dashboard',
    
    // Shop
    shop: 'Shop',
    shopExpenses: 'Shop Expenses',
    salaries: 'Salaries',
    salary: 'Salary',
    employeeName: 'Employee Name',
    position: 'Position',
    amount: 'Amount',
    paymentDate: 'Payment Date',
    addSalary: 'Add Salary',
    editSalary: 'Edit Salary',
    shopBills: 'Shop Bills',
    billType: 'Bill Type',
    rent: 'Rent',
    electricity: 'Electricity',
    water: 'Water',
    gas: 'Gas',
    other: 'Other',
    addBill: 'Add Bill',
    editBill: 'Edit Bill',
    totalSalaries: 'Total Salaries',
    totalBills: 'Total Bills',
    totalShopExpenses: 'Total Shop Expenses',
    monthlyExpenses: 'Monthly Expenses',
  },
  
  Arabic: {
    // Navigation
    dashboard: 'لوحة التحكم',
    branches: 'الفروع',
    inventory: 'المخزون',
    menu: 'القائمة',
    recipes: 'الوصفات',
    customers: 'العملاء',
    orders: 'الطلبات',
    kitchen: 'المطبخ',
    procurement: 'المشتريات',
    sales: 'المبيعات',
    financial: 'المالية',
    profitability: 'الربحية',
    invoices: 'الفواتير',
    employees: 'الموظفين',
    settings: 'الإعدادات',
    pos: 'نقطة البيع',
    logout: 'تسجيل الخروج',
    
    // Navigation Groups
    operations: 'العمليات',
    management: 'الإدارة',
    analytics: 'التحليلات',
    system: 'النظام',
    support: 'الدعم',
    
    // Support
    help: 'المساعدة',
    technicalSupport: 'الدعم الفني',
    contactSupport: 'اتصل بالدعم',
    contactInformation: 'معلومات الاتصال',
    whatsapp: 'واتساب',
    getInTouch: 'تواصل مع فريق الدعم لدينا',
    
    // Payment Methods
    paymentMethod: 'طريقة الدفع',
    cash: 'نقداً',
    atm: 'بطاقة / صراف آلي',
    
    // Forecasting
    forecasting: 'التنبؤ',
    demandForecasting: 'التنبؤ بالطلب',
    salesPrediction: 'توقع المبيعات',
    trendAnalysis: 'تحليل الاتجاهات',
    forecastPeriod: 'فترة التنبؤ',
    predictedSales: 'المبيعات المتوقعة',
    totalSales: 'إجمالي المبيعات',
    
    // Performance Analysis
    performanceAnalysis: 'تحليل الأداء',
    performanceAnalysisDesc: 'قارن المبيعات عبر فترات زمنية مختلفة',
    dod: 'يوم بيوم',
    wow: 'أسبوع بأسبوع',
    mom: 'شهر بشهر',
    yoy: 'سنة بسنة',
    dashboardOverview: 'نظرة عامة على أداء مطعمك',
    currentPeriod: 'الفترة الحالية',
    previous: 'السابق',
    
    // Peak Hours Analysis
    peakHoursAnalysis: 'تحليل ساعات الذروة',
    peakHour: 'ساعة الذروة',
    hourlySalesDistribution: 'توزيع المبيعات بالساعة',
    salesAmount: 'مبلغ المبيعات',
    am: 'ص',
    pm: 'م',
    customersAt: 'العملاء في',
    customerOrders: 'طلبات العملاء',
    noCustomersFound: 'لا يوجد عملاء في هذه الساعة',
    walkInCustomer: 'عميل مباشر',
    
    // Common
    add: 'إضافة',
    edit: 'تعديل',
    delete: 'حذف',
    save: 'حفظ',
    cancel: 'إلغاء',
    search: 'بحث',
    filter: 'تصفية',
    export: 'تصدير',
    import: 'استيراد',
    download: 'تحميل',
    upload: 'رفع',
    submit: 'إرسال',
    loading: 'جاري التحميل...',
    noData: 'لا توجد بيانات',
    
    // Dashboard
    totalRevenue: 'إجمالي الإيرادات',
    totalOrders: 'إجمالي الطلبات',
    totalCustomers: 'إجمالي العملاء',
    revenueGrowth: 'نمو الإيرادات',
    salesOverview: 'نظرة عامة على المبيعات',
    topSellingItems: 'المنتجات الأكثر مبيعاً',
    recentOrders: 'الطلبات الأخيرة',
    
    // Inventory
    itemName: 'اسم الصنف',
    category: 'الفئة',
    quantity: 'الكمية',
    unit: 'الوحدة',
    supplier: 'المورد',
    status: 'الحالة',
    inStock: 'متوفر',
    lowStock: 'مخزون منخفض',
    outOfStock: 'غير متوفر',
    
    // Menu
    price: 'السعر',
    basePrice: 'السعر الأساسي',
    vatAmount: 'قيمة الضريبة',
    discount: 'الخصم',
    discountPercentage: 'نسبة الخصم %',
    description: 'الوصف',
    available: 'متاح',
    unavailable: 'غير متاح',
    
    // Orders
    orderNumber: 'رقم الطلب',
    customerName: 'اسم العميل',
    orderType: 'نوع الطلب',
    table: 'الطاولة',
    subtotal: 'المجموع الفرعي',
    tax: 'الضريبة (15%)',
    total: 'الإجمالي',
    pending: 'قيد الانتظار',
    preparing: 'قيد التحضير',
    ready: 'جاهز',
    completed: 'مكتمل',
    cancelled: 'ملغي',
    
    // Financial
    revenue: 'الإيرادات',
    expenses: 'المصروفات',
    profit: 'الربح',
    margin: 'الهامش',
    vatReports: 'تقارير الضريبة',
    zatcaInvoices: 'فواتير هيئة الزكاة',
    invoiceNumber: 'رقم الفاتورة',
    invoiceDate: 'تاريخ الفاتورة',
    
    // Settings
    restaurantName: 'اسم المطعم',
    vatNumber: 'الرقم الضريبي',
    email: 'البريد الإلكتروني',
    phone: 'الهاتف',
    address: 'العنوان',
    language: 'اللغة',
    updateSettings: 'تحديث الإعدادات',
    settingsDescription: 'تكوين معلومات المطعم والتفضيلات',
    restaurantInformation: 'معلومات المطعم',
    invoiceConfiguration: 'تكوين الفواتير',
    invoiceConfigurationDescription: 'ستظهر المعلومات أعلاه في جميع الفواتير المتوافقة مع هيئة الزكاة والضريبة والجمارك التي يولدها النظام. تأكد من دقة جميع التفاصيل وتحديثها لضمان الامتثال للوائح الضريبية السعودية.',
    
    // Placeholders
    enterRestaurantName: 'أدخل اسم المطعم',
    enterVatNumber: 'أدخل الرقم الضريبي',
    enterEmail: 'info@restaurant.com',
    enterPhone: '+966 XX XXX XXXX',
    enterAddress: 'أدخل العنوان الكامل',
    enterDiscount: 'أدخل نسبة الخصم (0-100)',
    
    // Authentication
    login: 'تسجيل الدخول',
    signup: 'إنشاء حساب',
    password: 'كلمة المرور',
    confirmPassword: 'تأكيد كلمة المرور',
    username: 'اسم المستخدم',
    forgotPassword: 'نسيت كلمة المرور',
    resetPassword: 'إعادة تعيين كلمة المرور',
    
    // Messages
    success: 'نجح',
    error: 'خطأ',
    confirmDelete: 'هل أنت متأكد من حذف هذا العنصر؟',
    itemAdded: 'تمت إضافة العنصر بنجاح',
    itemUpdated: 'تم تحديث العنصر بنجاح',
    itemDeleted: 'تم حذف العنصر بنجاح',
    settingsUpdated: 'تم تحديث الإعدادات بنجاح',
    savingSettings: 'جاري الحفظ...',
    
    // Customer
    addCustomer: 'إضافة عميل',
    editCustomer: 'تعديل عميل',
    newCustomer: 'عميل جديد',
    existingCustomer: 'عميل موجود',
    selectCustomer: 'اختر عميل',
    
    // Tutorial
    tutorial: 'دليل الاستخدام',
    tutorialSubtitle: 'تعلم كيفية استخدام جميع ميزات نظام إدارة المطاعم',
    tutorialGettingStarted: 'البدء',
    tutorialPOS: 'نقطة البيع',
    tutorialPOSDesc: 'انتقل إلى نقطة البيع لإنشاء معاملات بيع جديدة. أضف عناصر من القائمة، واختر طريقة الدفع (نقدي/صراف آلي)، واختر العميل (أو الدخول المباشر)، وأكمل عملية البيع. يتم إنشاء الفواتير المتوافقة مع هيئة الزكاة والضريبة تلقائياً.',
    tutorialInventory: 'إدارة المخزون',
    tutorialInventoryDesc: 'أضف وتتبع عناصر المخزون بالكميات وأسعار الوحدات. استخدم استيراد/تصدير Excel للإدارة الجماعية. راقب مستويات المخزون واحصل على تنبيهات انخفاض المخزون.',
    tutorialMenu: 'إدارة القائمة',
    tutorialMenuDesc: 'إنشاء عناصر القائمة بأسعار شاملة ضريبة القيمة المضافة (15٪ ضريبة السعودية). حدد الأسعار الأساسية، وطبق الخصومات، واربط بالوصفات لحساب التكلفة التلقائي. حدد العناصر كمتاحة أو غير متاحة.',
    tutorialRecipes: 'إدارة الوصفات',
    tutorialRecipesDesc: 'إنشاء الوصفات عن طريق ربط المكونات من المخزون. يحسب النظام تلقائياً تكاليف الوصفات بناءً على كميات المكونات وأسعار الوحدات لتحليل الربحية الدقيق.',
    tutorialCustomers: 'إدارة العملاء',
    tutorialCustomersDesc: 'إضافة وإدارة معلومات العملاء بما في ذلك الأسماء وأرقام الهواتف والعناوين. عرض سجل الطلبات لكل عميل واختيارهم أثناء الدفع في نقطة البيع.',
    tutorialOrders: 'إدارة الطلبات',
    tutorialOrdersDesc: 'عرض وإدارة جميع الطلبات بحالات مختلفة (قيد الانتظار، قيد التحضير، جاهز، مكتمل). تتبع أنواع الطلبات (تناول الطعام، الطلبات الخارجية، التوصيل) وطرق الدفع.',
    tutorialDashboard: 'تحليلات لوحة التحكم',
    tutorialDashboardDesc: 'مراقبة الأداء في الوقت الفعلي مع مقارنات يومية/أسبوعية/شهرية/سنوية. تحليل ساعات الذروة مع تفاصيل العملاء. عرض اتجاهات المبيعات والطلبات النشطة والمقاييس الرئيسية بلمحة.',
    tutorialSales: 'تقارير المبيعات',
    tutorialSalesDesc: 'إنشاء تقارير مبيعات تفصيلية حسب نطاق التاريخ أو الفرع أو الفئة. تصدير البيانات إلى Excel لمزيد من التحليل. تتبع اتجاهات الإيرادات وتحديد العناصر الأكثر مبيعاً.',
    tutorialProfitability: 'تحليل الربحية',
    tutorialProfitabilityDesc: 'تحليل هوامش الربح وهياكل التكلفة واستراتيجيات التسعير. مقارنة ربحية عناصر القائمة وتحديد فرص تحسين التكلفة ونمو الإيرادات.',
    tutorialForecasting: 'التنبؤ بالطلب',
    tutorialForecastingDesc: 'استخدام التنبؤ المدعوم بالذكاء الاصطناعي للتنبؤ باتجاهات المبيعات المستقبلية. خطط لمشتريات المخزون وجدولة الموظفين بناءً على أنماط الطلب المتوقعة.',
    tutorialInvoices: 'فواتير هيئة الزكاة',
    tutorialInvoicesDesc: 'عرض جميع الفواتير الثنائية اللغة (عربي/إنجليزي) المتوافقة مع هيئة الزكاة. البحث برقم الفاتورة أو اسم العميل. تنزيل نسخ PDF مع رموز QR للتحقق.',
    tutorialFinancial: 'التقارير المالية',
    tutorialFinancialDesc: 'إنشاء بيانات مالية شاملة بما في ذلك بيانات الدخل وتقارير المصروفات. التصدير إلى PDF لأغراض المحاسبة والامتثال التنظيمي.',
    tutorialStep1: 'قم بإعداد معلومات مطعمك في الإعدادات (اسم المطعم، الرقم الضريبي، تفاصيل الاتصال)',
    tutorialStep2: 'أضف عناصر المخزون بأسعار الوحدات والكميات',
    tutorialStep3: 'إنشاء عناصر القائمة وربطها بالوصفات لتتبع التكلفة',
    tutorialStep4: 'أضف العملاء أو استخدم خيار الدخول المباشر للمبيعات السريعة',
    tutorialStep5: 'ابدأ البيع من خلال نقطة البيع وراقب التحليلات على لوحة التحكم',
    
    // Shop
    shop: 'المتجر',
    shopExpenses: 'مصاريف المتجر',
    salaries: 'الرواتب',
    salary: 'راتب',
    employeeName: 'اسم الموظف',
    position: 'المنصب',
    amount: 'المبلغ',
    paymentDate: 'تاريخ الدفع',
    addSalary: 'إضافة راتب',
    editSalary: 'تعديل راتب',
    shopBills: 'فواتير المتجر',
    billType: 'نوع الفاتورة',
    rent: 'إيجار',
    electricity: 'كهرباء',
    water: 'ماء',
    gas: 'غاز',
    other: 'أخرى',
    addBill: 'إضافة فاتورة',
    editBill: 'تعديل فاتورة',
    totalSalaries: 'إجمالي الرواتب',
    totalBills: 'إجمالي الفواتير',
    totalShopExpenses: 'إجمالي مصاريف المتجر',
    monthlyExpenses: 'المصاريف الشهرية',
  },
  
  Chinese: {
    // Navigation
    dashboard: '仪表板',
    branches: '分店',
    inventory: '库存',
    menu: '菜单',
    recipes: '食谱',
    customers: '客户',
    orders: '订单',
    kitchen: '厨房',
    procurement: '采购',
    sales: '销售',
    financial: '财务',
    profitability: '盈利能力',
    invoices: '发票',
    employees: '员工',
    settings: '设置',
    pos: '收银系统',
    logout: '登出',
    
    // Navigation Groups
    operations: '操作',
    management: '管理',
    analytics: '分析',
    system: '系统',
    support: '支持',
    
    // Support
    help: '帮助',
    technicalSupport: '技术支持',
    contactSupport: '联系支持',
    contactInformation: '联系信息',
    whatsapp: 'WhatsApp',
    getInTouch: '与我们的支持团队联系',
    
    // Payment Methods
    paymentMethod: '付款方式',
    cash: '现金',
    atm: '银行卡 / ATM',
    
    // Forecasting
    forecasting: '预测',
    demandForecasting: '需求预测',
    salesPrediction: '销售预测',
    trendAnalysis: '趋势分析',
    forecastPeriod: '预测周期',
    predictedSales: '预测销售额',
    totalSales: '总销售额',
    
    // Performance Analysis
    performanceAnalysis: '业绩分析',
    performanceAnalysisDesc: '比较不同时期的销售情况',
    dod: '日环比',
    wow: '周环比',
    mom: '月环比',
    yoy: '年同比',
    dashboardOverview: '您的餐厅业绩概览',
    currentPeriod: '当前时期',
    previous: '上一时期',
    
    // Peak Hours Analysis
    peakHoursAnalysis: '高峰时段分析',
    peakHour: '高峰时段',
    hourlySalesDistribution: '每小时销售分布',
    salesAmount: '销售额',
    am: '上午',
    pm: '下午',
    customersAt: '顾客在',
    customerOrders: '顾客订单',
    noCustomersFound: '此时段没有顾客',
    walkInCustomer: '到店顾客',
    
    // Common
    add: '添加',
    edit: '编辑',
    delete: '删除',
    save: '保存',
    cancel: '取消',
    search: '搜索',
    filter: '筛选',
    export: '导出',
    import: '导入',
    download: '下载',
    upload: '上传',
    submit: '提交',
    loading: '加载中...',
    noData: '无数据',
    
    // Dashboard
    totalRevenue: '总收入',
    totalOrders: '总订单',
    totalCustomers: '总客户',
    revenueGrowth: '收入增长',
    salesOverview: '销售概览',
    topSellingItems: '热销商品',
    recentOrders: '最近订单',
    
    // Inventory
    itemName: '商品名称',
    category: '类别',
    quantity: '数量',
    unit: '单位',
    supplier: '供应商',
    status: '状态',
    inStock: '有货',
    lowStock: '库存不足',
    outOfStock: '缺货',
    
    // Menu
    price: '价格',
    basePrice: '基础价格',
    vatAmount: '税额',
    discount: '折扣',
    discountPercentage: '折扣 %',
    description: '描述',
    available: '可用',
    unavailable: '不可用',
    
    // Orders
    orderNumber: '订单号',
    customerName: '客户名称',
    orderType: '订单类型',
    table: '桌号',
    subtotal: '小计',
    tax: '税费 (增值税 15%)',
    total: '总计',
    pending: '待处理',
    preparing: '准备中',
    ready: '已完成',
    completed: '已完成',
    cancelled: '已取消',
    
    // Financial
    revenue: '收入',
    expenses: '支出',
    profit: '利润',
    margin: '利润率',
    vatReports: '增值税报告',
    zatcaInvoices: 'ZATCA发票',
    invoiceNumber: '发票号',
    invoiceDate: '发票日期',
    
    // Settings
    restaurantName: '餐厅名称',
    vatNumber: '税号',
    email: '邮箱',
    phone: '电话',
    address: '地址',
    language: '语言',
    updateSettings: '更新设置',
    settingsDescription: '配置餐厅信息和偏好设置',
    restaurantInformation: '餐厅信息',
    invoiceConfiguration: '发票配置',
    invoiceConfigurationDescription: '上述信息将出现在系统生成的所有符合ZATCA标准的发票上。请确保所有详细信息准确且最新，以确保符合沙特税务法规。',
    
    // Placeholders
    enterRestaurantName: '输入餐厅名称',
    enterVatNumber: '输入税号',
    enterEmail: 'info@restaurant.com',
    enterPhone: '+966 XX XXX XXXX',
    enterAddress: '输入完整地址',
    enterDiscount: '输入折扣百分比 (0-100)',
    
    // Authentication
    login: '登录',
    signup: '注册',
    password: '密码',
    confirmPassword: '确认密码',
    username: '用户名',
    forgotPassword: '忘记密码',
    resetPassword: '重置密码',
    
    // Messages
    success: '成功',
    error: '错误',
    confirmDelete: '确定要删除此项吗？',
    itemAdded: '项目添加成功',
    itemUpdated: '项目更新成功',
    itemDeleted: '项目删除成功',
    settingsUpdated: '设置更新成功',
    savingSettings: '保存中...',
    
    // Customer
    addCustomer: '添加客户',
    editCustomer: '编辑客户',
    newCustomer: '新客户',
    existingCustomer: '现有客户',
    selectCustomer: '选择客户',
    
    // Tutorial
    tutorial: '教程',
    tutorialSubtitle: '学习如何使用餐厅管理系统的所有功能',
    tutorialGettingStarted: '入门指南',
    tutorialPOS: '收银系统(POS)',
    tutorialPOSDesc: '导航到收银系统创建新的销售交易。添加菜单项目，选择支付方式（现金/ATM），选择客户（或散客），完成销售。系统自动生成ZATCA合规发票。',
    tutorialInventory: '库存管理',
    tutorialInventoryDesc: '添加和跟踪库存项目的数量和单价。使用Excel导入/导出进行批量管理。监控库存水平并接收低库存警报。',
    tutorialMenu: '菜单管理',
    tutorialMenuDesc: '创建含增值税的菜单项（15%沙特增值税）。设置基本价格，应用折扣，并链接到食谱以自动计算成本。将项目标记为可用或不可用。',
    tutorialRecipes: '食谱管理',
    tutorialRecipesDesc: '通过链接库存中的配料创建食谱。系统根据配料数量和单价自动计算食谱成本，以进行准确的盈利分析。',
    tutorialCustomers: '客户管理',
    tutorialCustomersDesc: '添加和管理客户信息，包括姓名、电话号码和地址。查看每个客户的订单历史记录，并在收银结账时选择他们。',
    tutorialOrders: '订单管理',
    tutorialOrdersDesc: '查看和管理所有订单的不同状态（待处理、准备中、就绪、已完成）。跟踪订单类型（堂食、外卖、配送）和支付方式。',
    tutorialDashboard: '仪表板分析',
    tutorialDashboardDesc: '使用日/周/月/年比较监控实时性能。分析高峰时段并深入了解客户详情。一目了然地查看销售趋势、活跃订单和关键指标。',
    tutorialSales: '销售报告',
    tutorialSalesDesc: '按日期范围、分店或类别生成详细的销售报告。将数据导出到Excel进行进一步分析。跟踪收入趋势并识别畅销商品。',
    tutorialProfitability: '盈利能力分析',
    tutorialProfitabilityDesc: '分析利润率、成本结构和定价策略。比较菜单项盈利能力，确定成本优化和收入增长的机会。',
    tutorialForecasting: '需求预测',
    tutorialForecastingDesc: '使用AI驱动的预测来预测未来的销售趋势。根据预测的需求模式计划库存采购和员工调度。',
    tutorialInvoices: 'ZATCA发票',
    tutorialInvoicesDesc: '查看所有符合ZATCA的双语发票（阿拉伯语/英语）。按发票号或客户名称搜索。下载带有二维码验证的PDF副本。',
    tutorialFinancial: '财务报告',
    tutorialFinancialDesc: '生成包括损益表和费用报告在内的综合财务报表。导出为PDF用于会计和法规合规。',
    tutorialStep1: '在设置中设置餐厅信息（餐厅名称、税号、联系方式）',
    tutorialStep2: '添加库存项目及单价和数量',
    tutorialStep3: '创建菜单项并将其链接到食谱以进行成本跟踪',
    tutorialStep4: '添加客户或使用散客选项进行快速销售',
    tutorialStep5: '通过收银系统开始销售并在仪表板上监控分析',
    
    // Shop
    shop: '商店',
    shopExpenses: '商店费用',
    salaries: '薪资',
    salary: '工资',
    employeeName: '员工姓名',
    position: '职位',
    amount: '金额',
    paymentDate: '支付日期',
    addSalary: '添加工资',
    editSalary: '编辑工资',
    shopBills: '商店账单',
    billType: '账单类型',
    rent: '租金',
    electricity: '电费',
    water: '水费',
    gas: '燃气费',
    other: '其他',
    addBill: '添加账单',
    editBill: '编辑账单',
    totalSalaries: '总薪资',
    totalBills: '总账单',
    totalShopExpenses: '总商店费用',
    monthlyExpenses: '月度费用',
  },
  
  German: {
    // Navigation
    dashboard: 'Dashboard',
    branches: 'Filialen',
    inventory: 'Inventar',
    menu: 'Menü',
    recipes: 'Rezepte',
    customers: 'Kunden',
    orders: 'Bestellungen',
    kitchen: 'Küche',
    procurement: 'Beschaffung',
    sales: 'Verkäufe',
    financial: 'Finanzen',
    profitability: 'Rentabilität',
    invoices: 'Rechnungen',
    employees: 'Mitarbeiter',
    settings: 'Einstellungen',
    pos: 'Kassensystem',
    logout: 'Abmelden',
    
    // Navigation Groups
    operations: 'Betrieb',
    management: 'Verwaltung',
    analytics: 'Analytik',
    system: 'System',
    support: 'Support',
    
    // Support
    help: 'Hilfe',
    technicalSupport: 'Technischer Support',
    contactSupport: 'Support kontaktieren',
    contactInformation: 'Kontaktinformationen',
    whatsapp: 'WhatsApp',
    getInTouch: 'Kontaktieren Sie unser Support-Team',
    
    // Payment Methods
    paymentMethod: 'Zahlungsmethode',
    cash: 'Bargeld',
    atm: 'Karte / Geldautomat',
    
    // Forecasting
    forecasting: 'Prognose',
    demandForecasting: 'Nachfrageprognose',
    salesPrediction: 'Verkaufsprognose',
    trendAnalysis: 'Trendanalyse',
    forecastPeriod: 'Prognosezeitraum',
    predictedSales: 'Prognostizierte Verkäufe',
    totalSales: 'Gesamtumsatz',
    
    // Performance Analysis
    performanceAnalysis: 'Leistungsanalyse',
    performanceAnalysisDesc: 'Vergleichen Sie Verkäufe über verschiedene Zeiträume',
    dod: 'Tag für Tag (DoD)',
    wow: 'Woche für Woche (WoW)',
    mom: 'Monat für Monat (MoM)',
    yoy: 'Jahr für Jahr (YoY)',
    dashboardOverview: 'Übersicht über Ihre Restaurant-Leistung',
    currentPeriod: 'Aktueller Zeitraum',
    previous: 'Vorheriger',
    
    // Peak Hours Analysis
    peakHoursAnalysis: 'Stoßzeiten-Analyse',
    peakHour: 'Stoßzeit',
    hourlySalesDistribution: 'Stündliche Verkaufsverteilung',
    salesAmount: 'Verkaufsbetrag',
    am: 'AM',
    pm: 'PM',
    customersAt: 'Kunden um',
    customerOrders: 'Kundenbestellungen',
    noCustomersFound: 'Keine Kunden für diese Stunde gefunden',
    walkInCustomer: 'Laufkundschaft',
    
    // Common
    add: 'Hinzufügen',
    edit: 'Bearbeiten',
    delete: 'Löschen',
    save: 'Speichern',
    cancel: 'Abbrechen',
    search: 'Suchen',
    filter: 'Filtern',
    export: 'Exportieren',
    import: 'Importieren',
    download: 'Herunterladen',
    upload: 'Hochladen',
    submit: 'Absenden',
    loading: 'Wird geladen...',
    noData: 'Keine Daten verfügbar',
    
    // Dashboard
    totalRevenue: 'Gesamtumsatz',
    totalOrders: 'Gesamtbestellungen',
    totalCustomers: 'Gesamtkunden',
    revenueGrowth: 'Umsatzwachstum',
    salesOverview: 'Verkaufsübersicht',
    topSellingItems: 'Meistverkaufte Artikel',
    recentOrders: 'Letzte Bestellungen',
    
    // Inventory
    itemName: 'Artikelname',
    category: 'Kategorie',
    quantity: 'Menge',
    unit: 'Einheit',
    supplier: 'Lieferant',
    status: 'Status',
    inStock: 'Auf Lager',
    lowStock: 'Niedriger Lagerbestand',
    outOfStock: 'Nicht auf Lager',
    
    // Menu
    price: 'Preis',
    basePrice: 'Grundpreis',
    vatAmount: 'Mehrwertsteuerbetrag',
    discount: 'Rabatt',
    discountPercentage: 'Rabatt %',
    description: 'Beschreibung',
    available: 'Verfügbar',
    unavailable: 'Nicht verfügbar',
    
    // Orders
    orderNumber: 'Bestellnummer',
    customerName: 'Kundenname',
    orderType: 'Bestelltyp',
    table: 'Tisch',
    subtotal: 'Zwischensumme',
    tax: 'Steuer (MwSt. 15%)',
    total: 'Gesamt',
    pending: 'Ausstehend',
    preparing: 'In Vorbereitung',
    ready: 'Bereit',
    completed: 'Abgeschlossen',
    cancelled: 'Storniert',
    
    // Financial
    revenue: 'Umsatz',
    expenses: 'Ausgaben',
    profit: 'Gewinn',
    margin: 'Marge',
    vatReports: 'Mehrwertsteuerberichte',
    zatcaInvoices: 'ZATCA-Rechnungen',
    invoiceNumber: 'Rechnungsnummer',
    invoiceDate: 'Rechnungsdatum',
    
    // Settings
    restaurantName: 'Restaurantname',
    vatNumber: 'Umsatzsteuer-ID',
    email: 'E-Mail',
    phone: 'Telefon',
    address: 'Adresse',
    language: 'Sprache',
    updateSettings: 'Einstellungen aktualisieren',
    settingsDescription: 'Restaurant-Informationen und Einstellungen konfigurieren',
    restaurantInformation: 'Restaurant-Informationen',
    invoiceConfiguration: 'Rechnungskonfiguration',
    invoiceConfigurationDescription: 'Die obigen Informationen werden auf allen vom System generierten ZATCA-konformen Rechnungen angezeigt. Stellen Sie sicher, dass alle Details korrekt und aktuell sind, um die Einhaltung der saudischen Steuervorschriften zu gewährleisten.',
    
    // Placeholders
    enterRestaurantName: 'Restaurantname eingeben',
    enterVatNumber: 'Umsatzsteuer-ID eingeben',
    enterEmail: 'info@restaurant.com',
    enterPhone: '+966 XX XXX XXXX',
    enterAddress: 'Vollständige Adresse eingeben',
    enterDiscount: 'Rabattanteil eingeben (0-100)',
    
    // Authentication
    login: 'Anmelden',
    signup: 'Registrieren',
    password: 'Passwort',
    confirmPassword: 'Passwort bestätigen',
    username: 'Benutzername',
    forgotPassword: 'Passwort vergessen',
    resetPassword: 'Passwort zurücksetzen',
    
    // Messages
    success: 'Erfolgreich',
    error: 'Fehler',
    confirmDelete: 'Möchten Sie dieses Element wirklich löschen?',
    itemAdded: 'Element erfolgreich hinzugefügt',
    itemUpdated: 'Element erfolgreich aktualisiert',
    itemDeleted: 'Element erfolgreich gelöscht',
    settingsUpdated: 'Einstellungen erfolgreich aktualisiert',
    savingSettings: 'Speichern...',
    
    // Customer
    addCustomer: 'Kunde hinzufügen',
    editCustomer: 'Kunde bearbeiten',
    newCustomer: 'Neuer Kunde',
    existingCustomer: 'Bestehender Kunde',
    selectCustomer: 'Kunde auswählen',
    
    // Tutorial
    tutorial: 'Tutorial',
    tutorialSubtitle: 'Lernen Sie alle Funktionen des Restaurantmanagementsystems kennen',
    tutorialGettingStarted: 'Erste Schritte',
    tutorialPOS: 'Kassensystem (POS)',
    tutorialPOSDesc: 'Navigieren Sie zum Kassensystem, um neue Verkaufstransaktionen zu erstellen. Fügen Sie Menüpunkte hinzu, wählen Sie die Zahlungsmethode (Bar/ATM), wählen Sie Kunde (oder Laufkundschaft), und schließen Sie den Verkauf ab. ZATCA-konforme Rechnungen werden automatisch generiert.',
    tutorialInventory: 'Bestandsverwaltung',
    tutorialInventoryDesc: 'Hinzufügen und Nachverfolgen von Inventarartikeln mit Mengen und Einzelpreisen. Excel-Import/-Export für Massenverwaltung verwenden. Bestandsniveaus überwachen und Niedrigbestandswarnungen erhalten.',
    tutorialMenu: 'Menüverwaltung',
    tutorialMenuDesc: 'Menüpunkte mit MwSt.-inklusiven Preisen erstellen (15% saudi MwSt.). Basispreise festlegen, Rabatte anwenden und mit Rezepten verknüpfen für automatische Kostenberechnung. Artikel als verfügbar oder nicht verfügbar markieren.',
    tutorialRecipes: 'Rezeptverwaltung',
    tutorialRecipesDesc: 'Rezepte erstellen durch Verknüpfung von Zutaten aus dem Inventar. System berechnet automatisch Rezeptkosten basierend auf Zutatenmengen und Einzelpreisen für genaue Rentabilitätsanalyse.',
    tutorialCustomers: 'Kundenverwaltung',
    tutorialCustomersDesc: 'Kundeninformationen hinzufügen und verwalten, einschließlich Namen, Telefonnummern und Adressen. Bestellhistorie für jeden Kunden ansehen und während des POS-Checkouts auswählen.',
    tutorialOrders: 'Bestellverwaltung',
    tutorialOrdersDesc: 'Alle Bestellungen mit verschiedenen Status anzeigen und verwalten (Ausstehend, In Vorbereitung, Bereit, Abgeschlossen). Bestelltypen (Vor-Ort, Zum Mitnehmen, Lieferung) und Zahlungsmethoden nachverfolgen.',
    tutorialDashboard: 'Dashboard-Analytik',
    tutorialDashboardDesc: 'Echtzeitleistung mit Tag/Woche/Monat/Jahr-Vergleichen überwachen. Stoßzeiten mit Kundendetails analysieren. Verkaufstrends, aktive Bestellungen und Schlüsselkennzahlen auf einen Blick anzeigen.',
    tutorialSales: 'Verkaufsberichte',
    tutorialSalesDesc: 'Detaillierte Verkaufsberichte nach Datumsbereich, Filiale oder Kategorie generieren. Daten zur weiteren Analyse nach Excel exportieren. Umsatztrends verfolgen und meistverkaufte Artikel identifizieren.',
    tutorialProfitability: 'Rentabilitätsanalyse',
    tutorialProfitabilityDesc: 'Gewinnmargen, Kostenstrukturen und Preisstrategien analysieren. Rentabilität von Menüpunkten vergleichen und Möglichkeiten zur Kostenoptimierung und Umsatzsteigerung identifizieren.',
    tutorialForecasting: 'Nachfrageprognose',
    tutorialForecastingDesc: 'KI-gestützte Prognosen nutzen, um zukünftige Verkaufstrends vorherzusagen. Lagereinkäufe und Personalplanung basierend auf vorhergesagten Nachfragemustern planen.',
    tutorialInvoices: 'ZATCA-Rechnungen',
    tutorialInvoicesDesc: 'Alle ZATCA-konformen zweisprachigen Rechnungen (Arabisch/Englisch) anzeigen. Nach Rechnungsnummer oder Kundenname suchen. PDF-Kopien mit QR-Codes zur Überprüfung herunterladen.',
    tutorialFinancial: 'Finanzberichte',
    tutorialFinancialDesc: 'Umfassende Finanzberichte einschließlich Gewinn- und Verlustrechnungen und Ausgabenberichten generieren. Als PDF für Buchhaltungszwecke und behördliche Compliance exportieren.',
    tutorialStep1: 'Restaurantinformationen in Einstellungen einrichten (Restaurantname, Steuernummer, Kontaktdaten)',
    tutorialStep2: 'Inventarartikel mit Einzelpreisen und Mengen hinzufügen',
    tutorialStep3: 'Menüpunkte erstellen und mit Rezepten verknüpfen für Kostenverfolgung',
    tutorialStep4: 'Kunden hinzufügen oder Laufkundschaft-Option für schnelle Verkäufe verwenden',
    tutorialStep5: 'Über Kassensystem verkaufen und Analytik im Dashboard überwachen',
    
    // Shop
    shop: 'Geschäft',
    shopExpenses: 'Geschäftsausgaben',
    salaries: 'Gehälter',
    salary: 'Gehalt',
    employeeName: 'Mitarbeitername',
    position: 'Position',
    amount: 'Betrag',
    paymentDate: 'Zahlungsdatum',
    addSalary: 'Gehalt hinzufügen',
    editSalary: 'Gehalt bearbeiten',
    shopBills: 'Geschäftsrechnungen',
    billType: 'Rechnungstyp',
    rent: 'Miete',
    electricity: 'Strom',
    water: 'Wasser',
    gas: 'Gas',
    other: 'Sonstige',
    addBill: 'Rechnung hinzufügen',
    editBill: 'Rechnung bearbeiten',
    totalSalaries: 'Gesamtgehälter',
    totalBills: 'Gesamtrechnungen',
    totalShopExpenses: 'Gesamtgeschäftsausgaben',
    monthlyExpenses: 'Monatliche Ausgaben',
  },
  
  Hindi: {
    // Navigation
    dashboard: 'डैशबोर्ड',
    branches: 'शाखाएं',
    inventory: 'इन्वेंटरी',
    menu: 'मेनू',
    recipes: 'व्यंजन विधि',
    customers: 'ग्राहक',
    orders: 'ऑर्डर',
    kitchen: 'रसोई',
    procurement: 'खरीद',
    sales: 'बिक्री',
    financial: 'वित्तीय',
    profitability: 'लाभप्रदता',
    invoices: 'चालान',
    employees: 'कर्मचारी',
    settings: 'सेटिंग्स',
    pos: 'पीओएस',
    logout: 'लॉग आउट',
    
    // Navigation Groups
    operations: 'संचालन',
    management: 'प्रबंधन',
    analytics: 'विश्लेषण',
    system: 'प्रणाली',
    support: 'सहायता',
    
    // Support
    help: 'मदद',
    technicalSupport: 'तकनीकी सहायता',
    contactSupport: 'सहायता से संपर्क करें',
    contactInformation: 'संपर्क जानकारी',
    whatsapp: 'व्हाट्सएप',
    getInTouch: 'हमारी सहायता टीम से संपर्क करें',
    
    // Payment Methods
    paymentMethod: 'भुगतान विधि',
    cash: 'नकद',
    atm: 'कार्ड / एटीएम',
    
    // Forecasting
    forecasting: 'पूर्वानुमान',
    demandForecasting: 'मांग पूर्वानुमान',
    salesPrediction: 'बिक्री पूर्वानुमान',
    trendAnalysis: 'रुझान विश्लेषण',
    forecastPeriod: 'पूर्वानुमान अवधि',
    predictedSales: 'अनुमानित बिक्री',
    totalSales: 'कुल बिक्री',
    
    // Performance Analysis
    performanceAnalysis: 'प्रदर्शन विश्लेषण',
    performanceAnalysisDesc: 'विभिन्न समय अवधियों में बिक्री की तुलना करें',
    dod: 'दिन-दर-दिन',
    wow: 'सप्ताह-दर-सप्ताह',
    mom: 'महीना-दर-महीना',
    yoy: 'वर्ष-दर-वर्ष',
    dashboardOverview: 'आपके रेस्तरां के प्रदर्शन का अवलोकन',
    currentPeriod: 'वर्तमान अवधि',
    previous: 'पिछला',
    
    // Peak Hours Analysis
    peakHoursAnalysis: 'चरम घंटे विश्लेषण',
    peakHour: 'चरम घंटा',
    hourlySalesDistribution: 'प्रति घंटा बिक्री वितरण',
    salesAmount: 'बिक्री राशि',
    am: 'पूर्वाह्न',
    pm: 'अपराह्न',
    customersAt: 'ग्राहक',
    customerOrders: 'ग्राहक आदेश',
    noCustomersFound: 'इस घंटे के लिए कोई ग्राहक नहीं मिला',
    walkInCustomer: 'वॉक-इन ग्राहक',
    
    // Common
    add: 'जोड़ें',
    edit: 'संपादित करें',
    delete: 'हटाएं',
    save: 'सहेजें',
    cancel: 'रद्द करें',
    search: 'खोजें',
    filter: 'फ़िल्टर',
    export: 'निर्यात',
    import: 'आयात',
    download: 'डाउनलोड',
    upload: 'अपलोड',
    submit: 'जमा करें',
    loading: 'लोड हो रहा है...',
    noData: 'कोई डेटा उपलब्ध नहीं',
    
    // Dashboard
    totalRevenue: 'कुल राजस्व',
    totalOrders: 'कुल ऑर्डर',
    totalCustomers: 'कुल ग्राहक',
    revenueGrowth: 'राजस्व वृद्धि',
    salesOverview: 'बिक्री अवलोकन',
    topSellingItems: 'सबसे ज्यादा बिकने वाले आइटम',
    recentOrders: 'हाल के ऑर्डर',
    
    // Inventory
    itemName: 'आइटम का नाम',
    category: 'श्रेणी',
    quantity: 'मात्रा',
    unit: 'इकाई',
    supplier: 'आपूर्तिकर्ता',
    status: 'स्थिति',
    inStock: 'स्टॉक में',
    lowStock: 'कम स्टॉक',
    outOfStock: 'स्टॉक खत्म',
    
    // Menu
    price: 'कीमत',
    basePrice: 'मूल कीमत',
    vatAmount: 'वैट राशि',
    discount: 'छूट',
    discountPercentage: 'छूट %',
    description: 'विवरण',
    available: 'उपलब्ध',
    unavailable: 'अनुपलब्ध',
    
    // Orders
    orderNumber: 'ऑर्डर नंबर',
    customerName: 'ग्राहक का नाम',
    orderType: 'ऑर्डर प्रकार',
    table: 'टेबल',
    subtotal: 'उप-योग',
    tax: 'कर (वैट 15%)',
    total: 'कुल',
    pending: 'लंबित',
    preparing: 'तैयारी में',
    ready: 'तैयार',
    completed: 'पूर्ण',
    cancelled: 'रद्द',
    
    // Financial
    revenue: 'राजस्व',
    expenses: 'व्यय',
    profit: 'लाभ',
    margin: 'मार्जिन',
    vatReports: 'वैट रिपोर्ट',
    zatcaInvoices: 'जेडएटीसीए चालान',
    invoiceNumber: 'चालान संख्या',
    invoiceDate: 'चालान तिथि',
    
    // Settings
    restaurantName: 'रेस्तरां का नाम',
    vatNumber: 'वैट नंबर',
    email: 'ईमेल',
    phone: 'फोन',
    address: 'पता',
    language: 'भाषा',
    updateSettings: 'सेटिंग्स अपडेट करें',
    settingsDescription: 'रेस्तरां की जानकारी और वरीयताएं कॉन्फ़िगर करें',
    restaurantInformation: 'रेस्तरां की जानकारी',
    invoiceConfiguration: 'चालान कॉन्फ़िगरेशन',
    invoiceConfigurationDescription: 'उपरोक्त जानकारी सिस्टम द्वारा उत्पन्न सभी ZATCA-अनुरूप चालानों पर दिखाई देगी। सऊदी कर नियमों के अनुपालन को सुनिश्चित करने के लिए सुनिश्चित करें कि सभी विवरण सटीक और अद्यतन हैं।',
    
    // Placeholders
    enterRestaurantName: 'रेस्तरां का नाम दर्ज करें',
    enterVatNumber: 'वैट नंबर दर्ज करें',
    enterEmail: 'info@restaurant.com',
    enterPhone: '+966 XX XXX XXXX',
    enterAddress: 'पूरा पता दर्ज करें',
    enterDiscount: 'छूट प्रतिशत दर्ज करें (0-100)',
    
    // Authentication
    login: 'लॉगिन',
    signup: 'साइन अप',
    password: 'पासवर्ड',
    confirmPassword: 'पासवर्ड की पुष्टि करें',
    username: 'उपयोगकर्ता नाम',
    forgotPassword: 'पासवर्ड भूल गए',
    resetPassword: 'पासवर्ड रीसेट करें',
    
    // Messages
    success: 'सफलता',
    error: 'त्रुटि',
    confirmDelete: 'क्या आप वाकई इस आइटम को हटाना चाहते हैं?',
    itemAdded: 'आइटम सफलतापूर्वक जोड़ा गया',
    itemUpdated: 'आइटम सफलतापूर्वक अपडेट किया गया',
    itemDeleted: 'आइटम सफलतापूर्वक हटाया गया',
    settingsUpdated: 'सेटिंग्स सफलतापूर्वक अपडेट की गईं',
    savingSettings: 'सहेजा जा रहा है...',
    
    // Customer
    addCustomer: 'ग्राहक जोड़ें',
    editCustomer: 'ग्राहक संपादित करें',
    newCustomer: 'नया ग्राहक',
    existingCustomer: 'मौजूदा ग्राहक',
    selectCustomer: 'ग्राहक चुनें',
    
    // Tutorial
    tutorial: 'ट्यूटोरियल',
    tutorialSubtitle: 'रेस्तरां प्रबंधन प्रणाली की सभी सुविधाओं का उपयोग करना सीखें',
    tutorialGettingStarted: 'शुरुआत करना',
    tutorialPOS: 'पॉइंट ऑफ सेल (POS)',
    tutorialPOSDesc: 'नए बिक्री लेनदेन बनाने के लिए POS पर जाएं। अपने मेनू से आइटम जोड़ें, भुगतान विधि चुनें (नकद/एटीएम), ग्राहक चुनें (या वॉक-इन), और बिक्री पूरी करें। ZATCA-अनुरूप चालान स्वचालित रूप से उत्पन्न होते हैं।',
    tutorialInventory: 'इन्वेंटरी प्रबंधन',
    tutorialInventoryDesc: 'मात्रा और इकाई कीमतों के साथ इन्वेंटरी आइटम जोड़ें और ट्रैक करें। थोक प्रबंधन के लिए Excel आयात/निर्यात का उपयोग करें। स्टॉक स्तरों की निगरानी करें और कम स्टॉक चेतावनी प्राप्त करें।',
    tutorialMenu: 'मेनू प्रबंधन',
    tutorialMenuDesc: 'वैट-समावेशी मूल्य निर्धारण (15% सऊदी वैट) के साथ मेनू आइटम बनाएं। आधार मूल्य सेट करें, छूट लागू करें, और स्वचालित लागत गणना के लिए व्यंजनों से लिंक करें। आइटम को उपलब्ध या अनुपलब्ध के रूप में चिह्नित करें।',
    tutorialRecipes: 'व्यंजन विधि प्रबंधन',
    tutorialRecipesDesc: 'इन्वेंटरी से सामग्री लिंक करके व्यंजन बनाएं। सटीक लाभप्रदता विश्लेषण के लिए सामग्री मात्रा और इकाई कीमतों के आधार पर सिस्टम स्वचालित रूप से व्यंजन लागत की गणना करता है।',
    tutorialCustomers: 'ग्राहक प्रबंधन',
    tutorialCustomersDesc: 'नाम, फोन नंबर और पते सहित ग्राहक जानकारी जोड़ें और प्रबंधित करें। प्रत्येक ग्राहक के लिए ऑर्डर इतिहास देखें और POS चेकआउट के दौरान उन्हें चुनें।',
    tutorialOrders: 'ऑर्डर प्रबंधन',
    tutorialOrdersDesc: 'विभिन्न स्थितियों (लंबित, तैयारी में, तैयार, पूर्ण) के साथ सभी ऑर्डर देखें और प्रबंधित करें। ऑर्डर प्रकार (डाइन-इन, टेकअवे, डिलीवरी) और भुगतान विधियों को ट्रैक करें।',
    tutorialDashboard: 'डैशबोर्ड एनालिटिक्स',
    tutorialDashboardDesc: 'DoD/WoW/MoM/YoY तुलनाओं के साथ वास्तविक समय प्रदर्शन की निगरानी करें। ग्राहक ड्रिल-डाउन के साथ चरम घंटों का विश्लेषण करें। एक नज़र में बिक्री रुझान, सक्रिय ऑर्डर और प्रमुख मैट्रिक्स देखें।',
    tutorialSales: 'बिक्री रिपोर्ट',
    tutorialSalesDesc: 'दिनांक सीमा, शाखा या श्रेणी के अनुसार विस्तृत बिक्री रिपोर्ट उत्पन्न करें। आगे के विश्लेषण के लिए डेटा को Excel में निर्यात करें। राजस्व रुझानों को ट्रैक करें और शीर्ष बिकने वाले आइटम की पहचान करें।',
    tutorialProfitability: 'लाभप्रदता विश्लेषण',
    tutorialProfitabilityDesc: 'लाभ मार्जिन, लागत संरचनाओं और मूल्य निर्धारण रणनीतियों का विश्लेषण करें। मेनू आइटम लाभप्रदता की तुलना करें और लागत अनुकूलन और राजस्व वृद्धि के अवसरों की पहचान करें।',
    tutorialForecasting: 'मांग पूर्वानुमान',
    tutorialForecastingDesc: 'भविष्य की बिक्री प्रवृत्तियों की भविष्यवाणी करने के लिए AI-संचालित पूर्वानुमान का उपयोग करें। पूर्वानुमानित मांग पैटर्न के आधार पर इन्वेंटरी खरीद और स्टाफ शेड्यूलिंग की योजना बनाएं।',
    tutorialInvoices: 'ZATCA चालान',
    tutorialInvoicesDesc: 'सभी ZATCA-अनुरूप द्विभाषी चालान (अरबी/अंग्रेजी) देखें। चालान संख्या या ग्राहक नाम से खोजें। सत्यापन के लिए QR कोड के साथ PDF प्रतियां डाउनलोड करें।',
    tutorialFinancial: 'वित्तीय रिपोर्ट',
    tutorialFinancialDesc: 'आय विवरण और व्यय रिपोर्ट सहित व्यापक वित्तीय विवरण उत्पन्न करें। लेखा उद्देश्यों और नियामक अनुपालन के लिए PDF में निर्यात करें।',
    tutorialStep1: 'सेटिंग्स में अपनी रेस्तरां जानकारी सेट अप करें (रेस्तरां का नाम, वैट नंबर, संपर्क विवरण)',
    tutorialStep2: 'इकाई कीमतों और मात्राओं के साथ इन्वेंटरी आइटम जोड़ें',
    tutorialStep3: 'लागत ट्रैकिंग के लिए मेनू आइटम बनाएं और उन्हें व्यंजनों से लिंक करें',
    tutorialStep4: 'त्वरित बिक्री के लिए ग्राहक जोड़ें या वॉक-इन विकल्प का उपयोग करें',
    tutorialStep5: 'POS के माध्यम से बिक्री शुरू करें और डैशबोर्ड पर एनालिटिक्स की निगरानी करें',
    
    // Shop
    shop: 'दुकान',
    shopExpenses: 'दुकान व्यय',
    salaries: 'वेतन',
    salary: 'वेतन',
    employeeName: 'कर्मचारी का नाम',
    position: 'पद',
    amount: 'राशि',
    paymentDate: 'भुगतान तिथि',
    addSalary: 'वेतन जोड़ें',
    editSalary: 'वेतन संपादित करें',
    shopBills: 'दुकान बिल',
    billType: 'बिल प्रकार',
    rent: 'किराया',
    electricity: 'बिजली',
    water: 'पानी',
    gas: 'गैस',
    other: 'अन्य',
    addBill: 'बिल जोड़ें',
    editBill: 'बिल संपादित करें',
    totalSalaries: 'कुल वेतन',
    totalBills: 'कुल बिल',
    totalShopExpenses: 'कुल दुकान व्यय',
    monthlyExpenses: 'मासिक व्यय',
  },
  
  Urdu: {
    // Navigation
    dashboard: 'ڈیش بورڈ',
    branches: 'شاخیں',
    inventory: 'انوینٹری',
    menu: 'مینو',
    recipes: 'ترکیبیں',
    customers: 'گاہک',
    orders: 'آرڈرز',
    kitchen: 'باورچی خانہ',
    procurement: 'خریداری',
    sales: 'فروخت',
    financial: 'مالیاتی',
    profitability: 'منافع',
    invoices: 'رسیدیں',
    employees: 'ملازمین',
    settings: 'ترتیبات',
    pos: 'پی او ایس',
    logout: 'لاگ آؤٹ',
    
    // Navigation Groups
    operations: 'آپریشنز',
    management: 'انتظام',
    analytics: 'تجزیات',
    system: 'نظام',
    support: 'سپورٹ',
    
    // Support
    help: 'مدد',
    technicalSupport: 'تکنیکی سپورٹ',
    contactSupport: 'سپورٹ سے رابطہ کریں',
    contactInformation: 'رابطے کی معلومات',
    whatsapp: 'واٹس ایپ',
    getInTouch: 'ہماری سپورٹ ٹیم سے رابطہ کریں',
    
    // Payment Methods
    paymentMethod: 'ادائیگی کا طریقہ',
    cash: 'نقد',
    atm: 'کارڈ / اے ٹی ایم',
    
    // Forecasting
    forecasting: 'پیش گوئی',
    demandForecasting: 'مانگ کی پیش گوئی',
    salesPrediction: 'فروخت کی پیش گوئی',
    trendAnalysis: 'رجحان کا تجزیہ',
    forecastPeriod: 'پیش گوئی کی مدت',
    predictedSales: 'متوقع فروخت',
    totalSales: 'کل فروخت',
    
    // Performance Analysis
    performanceAnalysis: 'کارکردگی کا تجزیہ',
    performanceAnalysisDesc: 'مختلف وقتوں میں فروخت کا موازنہ کریں',
    dod: 'روز بہ روز',
    wow: 'ہفتہ بہ ہفتہ',
    mom: 'ماہ بہ ماہ',
    yoy: 'سال بہ سال',
    dashboardOverview: 'آپ کے ریستوراں کی کارکردگی کا جائزہ',
    currentPeriod: 'موجودہ مدت',
    previous: 'پچھلا',
    
    // Peak Hours Analysis
    peakHoursAnalysis: 'چوٹی کے اوقات کا تجزیہ',
    peakHour: 'چوٹی کا وقت',
    hourlySalesDistribution: 'گھنٹہ وار فروخت کی تقسیم',
    salesAmount: 'فروخت کی رقم',
    am: 'صبح',
    pm: 'شام',
    customersAt: 'گاہک',
    customerOrders: 'گاہک کے آرڈرز',
    noCustomersFound: 'اس گھنٹے کے لیے کوئی گاہک نہیں ملا',
    walkInCustomer: 'براہ راست گاہک',
    
    // Common
    add: 'شامل کریں',
    edit: 'ترمیم کریں',
    delete: 'حذف کریں',
    save: 'محفوظ کریں',
    cancel: 'منسوخ کریں',
    search: 'تلاش کریں',
    filter: 'فلٹر',
    export: 'برآمد',
    import: 'درآمد',
    download: 'ڈاؤن لوڈ',
    upload: 'اپ لوڈ',
    submit: 'جمع کروائیں',
    loading: 'لوڈ ہو رہا ہے...',
    noData: 'کوئی ڈیٹا دستیاب نہیں',
    
    // Dashboard
    totalRevenue: 'کل آمدنی',
    totalOrders: 'کل آرڈرز',
    totalCustomers: 'کل گاہک',
    revenueGrowth: 'آمدنی میں اضافہ',
    salesOverview: 'فروخت کا جائزہ',
    topSellingItems: 'سب سے زیادہ فروخت',
    recentOrders: 'حالیہ آرڈرز',
    
    // Inventory
    itemName: 'آئٹم کا نام',
    category: 'زمرہ',
    quantity: 'مقدار',
    unit: 'یونٹ',
    supplier: 'سپلائر',
    status: 'حالت',
    inStock: 'اسٹاک میں',
    lowStock: 'کم اسٹاک',
    outOfStock: 'اسٹاک ختم',
    
    // Menu
    price: 'قیمت',
    basePrice: 'بنیادی قیمت',
    vatAmount: 'ویٹ رقم',
    discount: 'رعایت',
    discountPercentage: 'رعایت %',
    description: 'تفصیل',
    available: 'دستیاب',
    unavailable: 'ناقابل دستیاب',
    
    // Orders
    orderNumber: 'آرڈر نمبر',
    customerName: 'گاہک کا نام',
    orderType: 'آرڈر کی قسم',
    table: 'میز',
    subtotal: 'ذیلی کل',
    tax: 'ٹیکس (ویٹ 15%)',
    total: 'کل',
    pending: 'زیر التواء',
    preparing: 'تیاری میں',
    ready: 'تیار',
    completed: 'مکمل',
    cancelled: 'منسوخ',
    
    // Financial
    revenue: 'آمدنی',
    expenses: 'اخراجات',
    profit: 'منافع',
    margin: 'مارجن',
    vatReports: 'ویٹ رپورٹس',
    zatcaInvoices: 'زیٹکا انوائسز',
    invoiceNumber: 'انوائس نمبر',
    invoiceDate: 'انوائس کی تاریخ',
    
    // Settings
    restaurantName: 'ریستوراں کا نام',
    vatNumber: 'ویٹ نمبر',
    email: 'ای میل',
    phone: 'فون',
    address: 'پتہ',
    language: 'زبان',
    updateSettings: 'ترتیبات اپ ڈیٹ کریں',
    settingsDescription: 'ریستوراں کی معلومات اور ترجیحات کو ترتیب دیں',
    restaurantInformation: 'ریستوراں کی معلومات',
    invoiceConfiguration: 'انوائس کی تشکیل',
    invoiceConfigurationDescription: 'مندرجہ بالا معلومات نظام کی طرف سے تیار کردہ تمام ZATCA کے مطابق انوائسز پر ظاہر ہوں گی۔ یقینی بنائیں کہ سعودی ٹیکس قوانین کی تعمیل کو یقینی بنانے کے لیے تمام تفصیلات درست اور تازہ ترین ہیں۔',
    
    // Placeholders
    enterRestaurantName: 'ریستوراں کا نام درج کریں',
    enterVatNumber: 'ویٹ نمبر درج کریں',
    enterEmail: 'info@restaurant.com',
    enterPhone: '+966 XX XXX XXXX',
    enterAddress: 'مکمل پتہ درج کریں',
    enterDiscount: 'رعایت کا فیصد درج کریں (0-100)',
    
    // Authentication
    login: 'لاگ ان',
    signup: 'سائن اپ',
    password: 'پاس ورڈ',
    confirmPassword: 'پاس ورڈ کی تصدیق',
    username: 'صارف نام',
    forgotPassword: 'پاس ورڈ بھول گئے',
    resetPassword: 'پاس ورڈ ری سیٹ',
    
    // Messages
    success: 'کامیابی',
    error: 'خرابی',
    confirmDelete: 'کیا آپ واقعی اس آئٹم کو حذف کرنا چاہتے ہیں؟',
    itemAdded: 'آئٹم کامیابی سے شامل کیا گیا',
    itemUpdated: 'آئٹم کامیابی سے اپ ڈیٹ کیا گیا',
    itemDeleted: 'آئٹم کامیابی سے حذف کیا گیا',
    settingsUpdated: 'ترتیبات کامیابی سے اپ ڈیٹ ہو گئیں',
    savingSettings: 'محفوظ ہو رہا ہے...',
    
    // Customer
    addCustomer: 'گاہک شامل کریں',
    editCustomer: 'گاہک میں ترمیم کریں',
    newCustomer: 'نیا گاہک',
    existingCustomer: 'موجودہ گاہک',
    selectCustomer: 'گاہک منتخب کریں',
    
    // Tutorial
    tutorial: 'ٹیوٹوریل',
    tutorialSubtitle: 'ریستوران مینجمنٹ سسٹم کی تمام خصوصیات استعمال کرنا سیکھیں',
    tutorialGettingStarted: 'شروع کرنا',
    tutorialPOS: 'پوائنٹ آف سیل (POS)',
    tutorialPOSDesc: 'نئے فروخت لین دین بنانے کے لیے POS پر جائیں۔ اپنے مینو سے اشیاء شامل کریں، ادائیگی کا طریقہ منتخب کریں (نقد/ATM)، گاہک منتخب کریں (یا واک-ان)، اور فروخت مکمل کریں۔ ZATCA کے مطابق رسیدیں خودکار طور پر تیار ہوتی ہیں۔',
    tutorialInventory: 'انوینٹری مینجمنٹ',
    tutorialInventoryDesc: 'مقدار اور یونٹ کی قیمتوں کے ساتھ انوینٹری اشیاء شامل اور ٹریک کریں۔ بڑی تعداد میں انتظام کے لیے Excel امپورٹ/ایکسپورٹ استعمال کریں۔ اسٹاک کی سطح کی نگرانی کریں اور کم اسٹاک کی انتباہات حاصل کریں۔',
    tutorialMenu: 'مینو مینجمنٹ',
    tutorialMenuDesc: 'VAT سمیت قیمتوں کے ساتھ مینو آئٹمز بنائیں (15% سعودی VAT)۔ بنیادی قیمتیں مقرر کریں، رعایتیں لاگو کریں، اور خودکار لاگت کی گنتی کے لیے ترکیبوں سے منسلک کریں۔ اشیاء کو دستیاب یا غیر دستیاب کے طور پر نشان زد کریں۔',
    tutorialRecipes: 'ترکیب مینجمنٹ',
    tutorialRecipesDesc: 'انوینٹری سے اجزاء منسلک کرکے ترکیبیں بنائیں۔ درست منافع کے تجزیے کے لیے اجزاء کی مقدار اور یونٹ کی قیمتوں کی بنیاد پر سسٹم خودکار طور پر ترکیب کی لاگت کا حساب لگاتا ہے۔',
    tutorialCustomers: 'گاہک مینجمنٹ',
    tutorialCustomersDesc: 'نام، فون نمبر اور پتے سمیت گاہک کی معلومات شامل اور منظم کریں۔ ہر گاہک کے لیے آرڈر کی تاریخ دیکھیں اور POS چیک آؤٹ کے دوران انہیں منتخب کریں۔',
    tutorialOrders: 'آرڈر مینجمنٹ',
    tutorialOrdersDesc: 'مختلف حیثیتوں (زیر التوا، تیاری میں، تیار، مکمل) کے ساتھ تمام آرڈرز دیکھیں اور منظم کریں۔ آرڈر کی اقسام (ڈائن-ان، ٹیک اوے، ڈیلیوری) اور ادائیگی کے طریقوں کو ٹریک کریں۔',
    tutorialDashboard: 'ڈیش بورڈ تجزیات',
    tutorialDashboardDesc: 'DoD/WoW/MoM/YoY موازنہ کے ساتھ حقیقی وقت کی کارکردگی کی نگرانی کریں۔ گاہکوں کی تفصیلات کے ساتھ چوٹی کے اوقات کا تجزیہ کریں۔ ایک نظر میں فروخت کے رجحانات، فعال آرڈرز اور اہم میٹرکس دیکھیں۔',
    tutorialSales: 'فروخت کی رپورٹس',
    tutorialSalesDesc: 'تاریخ کی حد، شاخ یا زمرے کے مطابق تفصیلی فروخت کی رپورٹس تیار کریں۔ مزید تجزیہ کے لیے ڈیٹا کو Excel میں ایکسپورٹ کریں۔ آمدنی کے رجحانات کو ٹریک کریں اور سب سے زیادہ فروخت ہونے والی اشیاء کی شناخت کریں۔',
    tutorialProfitability: 'منافع کا تجزیہ',
    tutorialProfitabilityDesc: 'منافع کے مارجن، لاگت کے ڈھانچے اور قیمتوں کی حکمت عملی کا تجزیہ کریں۔ مینو آئٹمز کی منافع بخشی کا موازنہ کریں اور لاگت کی اصلاح اور آمدنی میں اضافے کے مواقع کی شناخت کریں۔',
    tutorialForecasting: 'طلب کی پیشن گوئی',
    tutorialForecastingDesc: 'مستقبل کی فروخت کے رجحانات کی پیشن گوئی کرنے کے لیے AI سے چلنے والی پیشن گوئی استعمال کریں۔ متوقع طلب کے نمونوں کی بنیاد پر انوینٹری کی خریداری اور عملے کی شیڈولنگ کی منصوبہ بندی کریں۔',
    tutorialInvoices: 'ZATCA رسیدیں',
    tutorialInvoicesDesc: 'تمام ZATCA کے مطابق دو لسانی رسیدیں (عربی/انگریزی) دیکھیں۔ رسید نمبر یا گاہک کے نام سے تلاش کریں۔ تصدیق کے لیے QR کوڈز کے ساتھ PDF کاپیاں ڈاؤن لوڈ کریں۔',
    tutorialFinancial: 'مالی رپورٹس',
    tutorialFinancialDesc: 'آمدنی کے بیانات اور اخراجات کی رپورٹوں سمیت جامع مالیاتی بیانات تیار کریں۔ اکاؤنٹنگ کے مقاصد اور ریگولیٹری تعمیل کے لیے PDF میں ایکسپورٹ کریں۔',
    tutorialStep1: 'سیٹنگز میں اپنے ریستوران کی معلومات ترتیب دیں (ریستوران کا نام، VAT نمبر، رابطے کی تفصیلات)',
    tutorialStep2: 'یونٹ کی قیمتوں اور مقداروں کے ساتھ انوینٹری آئٹمز شامل کریں',
    tutorialStep3: 'لاگت کی ٹریکنگ کے لیے مینو آئٹمز بنائیں اور انہیں ترکیبوں سے منسلک کریں',
    tutorialStep4: 'تیز فروخت کے لیے گاہک شامل کریں یا واک-ان آپشن استعمال کریں',
    tutorialStep5: 'POS کے ذریعے فروخت شروع کریں اور ڈیش بورڈ پر تجزیات کی نگرانی کریں',
    
    // Shop
    shop: 'دکان',
    shopExpenses: 'دکان کے اخراجات',
    salaries: 'تنخواہیں',
    salary: 'تنخواہ',
    employeeName: 'ملازم کا نام',
    position: 'عہدہ',
    amount: 'رقم',
    paymentDate: 'ادائیگی کی تاریخ',
    addSalary: 'تنخواہ شامل کریں',
    editSalary: 'تنخواہ میں ترمیم کریں',
    shopBills: 'دکان کے بل',
    billType: 'بل کی قسم',
    rent: 'کرایہ',
    electricity: 'بجلی',
    water: 'پانی',
    gas: 'گیس',
    other: 'دیگر',
    addBill: 'بل شامل کریں',
    editBill: 'بل میں ترمیم کریں',
    totalSalaries: 'کل تنخواہیں',
    totalBills: 'کل بل',
    totalShopExpenses: 'کل دکان کے اخراجات',
    monthlyExpenses: 'ماہانہ اخراجات',
  },
  
  Bengali: {
    // Navigation
    dashboard: 'ড্যাশবোর্ড',
    branches: 'শাখা',
    inventory: 'ইনভেন্টরি',
    menu: 'মেনু',
    recipes: 'রেসিপি',
    customers: 'গ্রাহক',
    orders: 'অর্ডার',
    kitchen: 'রান্নাঘর',
    procurement: 'ক্রয়',
    sales: 'বিক্রয়',
    financial: 'আর্থিক',
    profitability: 'লাভজনকতা',
    invoices: 'চালান',
    employees: 'কর্মচারী',
    settings: 'সেটিংস',
    pos: 'পিওএস',
    logout: 'লগ আউট',
    
    // Navigation Groups
    operations: 'কার্যক্রম',
    management: 'ব্যবস্থাপনা',
    analytics: 'বিশ্লেষণ',
    system: 'সিস্টেম',
    support: 'সহায়তা',
    
    // Support
    help: 'সাহায্য',
    technicalSupport: 'প্রযুক্তিগত সহায়তা',
    contactSupport: 'সহায়তার সাথে যোগাযোগ করুন',
    contactInformation: 'যোগাযোগের তথ্য',
    whatsapp: 'হোয়াটসঅ্যাপ',
    getInTouch: 'আমাদের সহায়তা দলের সাথে যোগাযোগ করুন',
    
    // Payment Methods
    paymentMethod: 'পেমেন্ট পদ্ধতি',
    cash: 'নগদ',
    atm: 'কার্ড / এটিএম',
    
    // Forecasting
    forecasting: 'পূর্বাভাস',
    demandForecasting: 'চাহিদা পূর্বাভাস',
    salesPrediction: 'বিক্রয় পূর্বাভাস',
    trendAnalysis: 'প্রবণতা বিশ্লেষণ',
    forecastPeriod: 'পূর্বাভাস সময়কাল',
    predictedSales: 'প্রত্যাশিত বিক্রয়',
    totalSales: 'মোট বিক্রয়',
    
    // Performance Analysis
    performanceAnalysis: 'কর্মক্ষমতা বিশ্লেষণ',
    performanceAnalysisDesc: 'বিভিন্ন সময়ের বিক্রয়ের তুলনা করুন',
    dod: 'দিন-প্রতি-দিন',
    wow: 'সপ্তাহ-প্রতি-সপ্তাহ',
    mom: 'মাস-প্রতি-মাস',
    yoy: 'বছর-প্রতি-বছর',
    dashboardOverview: 'আপনার রেস্তোরাঁর কর্মক্ষমতার সংক্ষিপ্ত বিবরণ',
    currentPeriod: 'বর্তমান সময়কাল',
    previous: 'পূর্ববর্তী',
    
    // Peak Hours Analysis
    peakHoursAnalysis: 'সর্বোচ্চ সময় বিশ্লেষণ',
    peakHour: 'সর্বোচ্চ সময়',
    hourlySalesDistribution: 'ঘণ্টাওয়ারী বিক্রয় বিতরণ',
    salesAmount: 'বিক্রয় পরিমাণ',
    am: 'পূর্বাহ্ন',
    pm: 'অপরাহ্ন',
    customersAt: 'গ্রাহক',
    customerOrders: 'গ্রাহক অর্ডার',
    noCustomersFound: 'এই ঘণ্টার জন্য কোনো গ্রাহক পাওয়া যায়নি',
    walkInCustomer: 'ওয়াক-ইন গ্রাহক',
    
    // Common
    add: 'যোগ করুন',
    edit: 'সম্পাদনা',
    delete: 'মুছুন',
    save: 'সংরক্ষণ',
    cancel: 'বাতিল',
    search: 'অনুসন্ধান',
    filter: 'ফিল্টার',
    export: 'রপ্তানি',
    import: 'আমদানি',
    download: 'ডাউনলোড',
    upload: 'আপলোড',
    submit: 'জমা দিন',
    loading: 'লোড হচ্ছে...',
    noData: 'কোন ডেটা নেই',
    
    // Dashboard
    totalRevenue: 'মোট আয়',
    totalOrders: 'মোট অর্ডার',
    totalCustomers: 'মোট গ্রাহক',
    revenueGrowth: 'আয় বৃদ্ধি',
    salesOverview: 'বিক্রয় সংক্ষিপ্ত বিবরণ',
    topSellingItems: 'সর্বাধিক বিক্রিত আইটেম',
    recentOrders: 'সাম্প্রতিক অর্ডার',
    
    // Inventory
    itemName: 'আইটেমের নাম',
    category: 'ক্যাটাগরি',
    quantity: 'পরিমাণ',
    unit: 'ইউনিট',
    supplier: 'সরবরাহকারী',
    status: 'স্থিতি',
    inStock: 'স্টকে আছে',
    lowStock: 'কম স্টক',
    outOfStock: 'স্টকে নেই',
    
    // Menu
    price: 'মূল্য',
    basePrice: 'মূল মূল্য',
    vatAmount: 'ভ্যাট পরিমাণ',
    discount: 'ছাড়',
    discountPercentage: 'ছাড় %',
    description: 'বিবরণ',
    available: 'উপলব্ধ',
    unavailable: 'অনুপলব্ধ',
    
    // Orders
    orderNumber: 'অর্ডার নম্বর',
    customerName: 'গ্রাহকের নাম',
    orderType: 'অর্ডারের ধরন',
    table: 'টেবিল',
    subtotal: 'উপমোট',
    tax: 'কর (ভ্যাট ১৫%)',
    total: 'মোট',
    pending: 'মুলতুবি',
    preparing: 'প্রস্তুতি চলছে',
    ready: 'প্রস্তুত',
    completed: 'সম্পন্ন',
    cancelled: 'বাতিল',
    
    // Financial
    revenue: 'আয়',
    expenses: 'ব্যয়',
    profit: 'লাভ',
    margin: 'মার্জিন',
    vatReports: 'ভ্যাট রিপোর্ট',
    zatcaInvoices: 'জেডএটিসিএ চালান',
    invoiceNumber: 'চালান নম্বর',
    invoiceDate: 'চালান তারিখ',
    
    // Settings
    restaurantName: 'রেস্তোরাঁর নাম',
    vatNumber: 'ভ্যাট নম্বর',
    email: 'ইমেইল',
    phone: 'ফোন',
    address: 'ঠিকানা',
    language: 'ভাষা',
    updateSettings: 'সেটিংস আপডেট করুন',
    settingsDescription: 'রেস্তোরাঁর তথ্য এবং পছন্দসমূহ কনফিগার করুন',
    restaurantInformation: 'রেস্তোরাঁর তথ্য',
    invoiceConfiguration: 'চালান কনফিগারেশন',
    invoiceConfigurationDescription: 'উপরের তথ্য সিস্টেম দ্বারা তৈরি সমস্ত ZATCA-সম্মত চালানে প্রদর্শিত হবে। সৌদি কর নিয়মগুলির সাথে সম্মতি নিশ্চিত করতে সমস্ত বিবরণ সঠিক এবং আপ-টু-ডেট রয়েছে তা নিশ্চিত করুন।',
    
    // Placeholders
    enterRestaurantName: 'রেস্তোরাঁর নাম লিখুন',
    enterVatNumber: 'ভ্যাট নম্বর লিখুন',
    enterEmail: 'info@restaurant.com',
    enterPhone: '+966 XX XXX XXXX',
    enterAddress: 'সম্পূর্ণ ঠিকানা লিখুন',
    enterDiscount: 'ছাড় শতাংশ লিখুন (0-100)',
    
    // Authentication
    login: 'লগইন',
    signup: 'সাইন আপ',
    password: 'পাসওয়ার্ড',
    confirmPassword: 'পাসওয়ার্ড নিশ্চিত করুন',
    username: 'ব্যবহারকারীর নাম',
    forgotPassword: 'পাসওয়ার্ড ভুলে গেছেন',
    resetPassword: 'পাসওয়ার্ড রিসেট',
    
    // Messages
    success: 'সফল',
    error: 'ত্রুটি',
    confirmDelete: 'আপনি কি নিশ্চিত এই আইটেম মুছতে চান?',
    itemAdded: 'আইটেম সফলভাবে যোগ করা হয়েছে',
    itemUpdated: 'আইটেম সফলভাবে আপডেট করা হয়েছে',
    itemDeleted: 'আইটেম সফলভাবে মুছে ফেলা হয়েছে',
    settingsUpdated: 'সেটিংস সফলভাবে আপডেট হয়েছে',
    savingSettings: 'সংরক্ষণ করা হচ্ছে...',
    
    // Customer
    addCustomer: 'গ্রাহক যোগ করুন',
    editCustomer: 'গ্রাহক সম্পাদনা করুন',
    newCustomer: 'নতুন গ্রাহক',
    existingCustomer: 'বিদ্যমান গ্রাহক',
    selectCustomer: 'গ্রাহক নির্বাচন করুন',
    
    // Tutorial
    tutorial: 'টিউটোরিয়াল',
    tutorialSubtitle: 'রেস্তোরাঁ ব্যবস্থাপনা সিস্টেমের সমস্ত বৈশিষ্ট্য কীভাবে ব্যবহার করবেন তা শিখুন',
    tutorialGettingStarted: 'শুরু করা',
    tutorialPOS: 'পয়েন্ট অফ সেল (POS)',
    tutorialPOSDesc: 'নতুন বিক্রয় লেনদেন তৈরি করতে POS-এ নেভিগেট করুন। আপনার মেনু থেকে আইটেম যোগ করুন, পেমেন্ট পদ্ধতি নির্বাচন করুন (নগদ/ATM), গ্রাহক নির্বাচন করুন (বা ওয়াক-ইন), এবং বিক্রয় সম্পূর্ণ করুন। ZATCA-অনুগত চালান স্বয়ংক্রিয়ভাবে তৈরি হয়।',
    tutorialInventory: 'ইনভেন্টরি ব্যবস্থাপনা',
    tutorialInventoryDesc: 'পরিমাণ এবং ইউনিট মূল্য সহ ইনভেন্টরি আইটেম যোগ এবং ট্র্যাক করুন। বাল্ক ম্যানেজমেন্টের জন্য Excel আমদানি/রপ্তানি ব্যবহার করুন। স্টক লেভেল মনিটর করুন এবং কম স্টক সতর্কতা পান।',
    tutorialMenu: 'মেনু ব্যবস্থাপনা',
    tutorialMenuDesc: 'VAT-সহ মূল্য নির্ধারণের সাথে মেনু আইটেম তৈরি করুন (15% সৌদি VAT)। বেস মূল্য সেট করুন, ছাড় প্রয়োগ করুন, এবং স্বয়ংক্রিয় খরচ গণনার জন্য রেসিপির সাথে লিঙ্ক করুন। আইটেমগুলিকে উপলব্ধ বা অনুপলব্ধ হিসাবে চিহ্নিত করুন।',
    tutorialRecipes: 'রেসিপি ব্যবস্থাপনা',
    tutorialRecipesDesc: 'ইনভেন্টরি থেকে উপাদান লিঙ্ক করে রেসিপি তৈরি করুন। নির্ভুল লাভজনকতা বিশ্লেষণের জন্য উপাদানের পরিমাণ এবং ইউনিট মূল্যের উপর ভিত্তি করে সিস্টেম স্বয়ংক্রিয়ভাবে রেসিপি খরচ গণনা করে।',
    tutorialCustomers: 'গ্রাহক ব্যবস্থাপনা',
    tutorialCustomersDesc: 'নাম, ফোন নম্বর এবং ঠিকানা সহ গ্রাহক তথ্য যোগ এবং পরিচালনা করুন। প্রতিটি গ্রাহকের জন্য অর্ডার ইতিহাস দেখুন এবং POS চেকআউটের সময় তাদের নির্বাচন করুন।',
    tutorialOrders: 'অর্ডার ব্যবস্থাপনা',
    tutorialOrdersDesc: 'বিভিন্ন স্ট্যাটাস (মুলতবি, প্রস্তুতিতে, প্রস্তুত, সম্পূর্ণ) সহ সমস্ত অর্ডার দেখুন এবং পরিচালনা করুন। অর্ডারের ধরন (ডাইন-ইন, টেকঅ্যাওয়ে, ডেলিভারি) এবং পেমেন্ট পদ্ধতি ট্র্যাক করুন।',
    tutorialDashboard: 'ড্যাশবোর্ড বিশ্লেষণ',
    tutorialDashboardDesc: 'DoD/WoW/MoM/YoY তুলনা সহ রিয়েল-টাইম পারফরম্যান্স মনিটর করুন। গ্রাহক ড্রিল-ডাউন সহ পিক আওয়ার বিশ্লেষণ করুন। এক নজরে বিক্রয় ট্রেন্ড, সক্রিয় অর্ডার এবং মূল মেট্রিক্স দেখুন।',
    tutorialSales: 'বিক্রয় রিপোর্ট',
    tutorialSalesDesc: 'তারিখ পরিসীমা, শাখা বা বিভাগ অনুসারে বিস্তারিত বিক্রয় রিপোর্ট তৈরি করুন। আরও বিশ্লেষণের জন্য ডেটা Excel-এ রপ্তানি করুন। রাজস্ব প্রবণতা ট্র্যাক করুন এবং শীর্ষ বিক্রয় আইটেম সনাক্ত করুন।',
    tutorialProfitability: 'লাভজনকতা বিশ্লেষণ',
    tutorialProfitabilityDesc: 'লাভ মার্জিন, খরচ কাঠামো এবং মূল্য নির্ধারণ কৌশল বিশ্লেষণ করুন। মেনু আইটেম লাভজনকতা তুলনা করুন এবং খরচ অপ্টিমাইজেশন এবং রাজস্ব বৃদ্ধির সুযোগ সনাক্ত করুন।',
    tutorialForecasting: 'চাহিদা পূর্বাভাস',
    tutorialForecastingDesc: 'ভবিষ্যতের বিক্রয় প্রবণতা পূর্বাভাস করতে AI-চালিত পূর্বাভাস ব্যবহার করুন। পূর্বাভাসিত চাহিদা প্যাটার্নের উপর ভিত্তি করে ইনভেন্টরি ক্রয় এবং স্টাফ শিডিউলিং পরিকল্পনা করুন।',
    tutorialInvoices: 'ZATCA চালান',
    tutorialInvoicesDesc: 'সমস্ত ZATCA-অনুগত দ্বিভাষিক চালান (আরবি/ইংরেজি) দেখুন। চালান নম্বর বা গ্রাহক নাম দ্বারা অনুসন্ধান করুন। যাচাইয়ের জন্য QR কোড সহ PDF কপি ডাউনলোড করুন।',
    tutorialFinancial: 'আর্থিক রিপোর্ট',
    tutorialFinancialDesc: 'আয় বিবরণী এবং ব্যয় রিপোর্ট সহ ব্যাপক আর্থিক বিবৃতি তৈরি করুন। অ্যাকাউন্টিং উদ্দেশ্য এবং নিয়ন্ত্রক সম্মতির জন্য PDF-এ রপ্তানি করুন।',
    tutorialStep1: 'সেটিংসে আপনার রেস্তোরাঁর তথ্য সেট আপ করুন (রেস্তোরাঁর নাম, VAT নম্বর, যোগাযোগের বিবরণ)',
    tutorialStep2: 'ইউনিট মূল্য এবং পরিমাণ সহ ইনভেন্টরি আইটেম যোগ করুন',
    tutorialStep3: 'খরচ ট্র্যাকিংয়ের জন্য মেনু আইটেম তৈরি করুন এবং তাদের রেসিপির সাথে লিঙ্ক করুন',
    tutorialStep4: 'দ্রুত বিক্রয়ের জন্য গ্রাহক যোগ করুন বা ওয়াক-ইন বিকল্প ব্যবহার করুন',
    tutorialStep5: 'POS-এর মাধ্যমে বিক্রয় শুরু করুন এবং ড্যাশবোর্ডে বিশ্লেষণ মনিটর করুন',
    
    // Shop
    shop: 'দোকান',
    shopExpenses: 'দোকান খরচ',
    salaries: 'বেতন',
    salary: 'বেতন',
    employeeName: 'কর্মচারীর নাম',
    position: 'পদ',
    amount: 'পরিমাণ',
    paymentDate: 'পেমেন্ট তারিখ',
    addSalary: 'বেতন যোগ করুন',
    editSalary: 'বেতন সম্পাদনা করুন',
    shopBills: 'দোকান বিল',
    billType: 'বিল প্রকার',
    rent: 'ভাড়া',
    electricity: 'বিদ্যুৎ',
    water: 'পানি',
    gas: 'গ্যাস',
    other: 'অন্যান্য',
    addBill: 'বিল যোগ করুন',
    editBill: 'বিল সম্পাদনা করুন',
    totalSalaries: 'মোট বেতন',
    totalBills: 'মোট বিল',
    totalShopExpenses: 'মোট দোকান খরচ',
    monthlyExpenses: 'মাসিক খরচ',
  },
};

export const supportedLanguages: Language[] = [
  'English',
  'Arabic',
  'Chinese',
  'German',
  'Hindi',
  'Urdu',
  'Bengali',
];
