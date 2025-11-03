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
  orders: string;
  kitchen: string;
  procurement: string;
  sales: string;
  financial: string;
  profitability: string;
  employees: string;
  settings: string;
  pos: string;
  logout: string;
  
  // Navigation Groups
  operations: string;
  management: string;
  analytics: string;
  system: string;
  
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
}

export const translations: Record<Language, Translations> = {
  English: {
    // Navigation
    dashboard: 'Dashboard',
    branches: 'Branches',
    inventory: 'Inventory',
    menu: 'Menu',
    recipes: 'Recipes',
    orders: 'Orders',
    kitchen: 'Kitchen',
    procurement: 'Procurement',
    sales: 'Sales',
    financial: 'Financial',
    profitability: 'Profitability',
    employees: 'Employees',
    settings: 'Settings',
    pos: 'POS',
    logout: 'Logout',
    
    // Navigation Groups
    operations: 'Operations',
    management: 'Management',
    analytics: 'Analytics',
    system: 'System',
    
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
  },
  
  Arabic: {
    // Navigation
    dashboard: 'لوحة التحكم',
    branches: 'الفروع',
    inventory: 'المخزون',
    menu: 'القائمة',
    recipes: 'الوصفات',
    orders: 'الطلبات',
    kitchen: 'المطبخ',
    procurement: 'المشتريات',
    sales: 'المبيعات',
    financial: 'المالية',
    profitability: 'الربحية',
    employees: 'الموظفين',
    settings: 'الإعدادات',
    pos: 'نقطة البيع',
    logout: 'تسجيل الخروج',
    
    // Navigation Groups
    operations: 'العمليات',
    management: 'الإدارة',
    analytics: 'التحليلات',
    system: 'النظام',
    
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
  },
  
  Chinese: {
    // Navigation
    dashboard: '仪表板',
    branches: '分店',
    inventory: '库存',
    menu: '菜单',
    recipes: '食谱',
    orders: '订单',
    kitchen: '厨房',
    procurement: '采购',
    sales: '销售',
    financial: '财务',
    profitability: '盈利能力',
    employees: '员工',
    settings: '设置',
    pos: '收银系统',
    logout: '登出',
    
    // Navigation Groups
    operations: '操作',
    management: '管理',
    analytics: '分析',
    system: '系统',
    
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
  },
  
  German: {
    // Navigation
    dashboard: 'Dashboard',
    branches: 'Filialen',
    inventory: 'Inventar',
    menu: 'Menü',
    recipes: 'Rezepte',
    orders: 'Bestellungen',
    kitchen: 'Küche',
    procurement: 'Beschaffung',
    sales: 'Verkäufe',
    financial: 'Finanzen',
    profitability: 'Rentabilität',
    employees: 'Mitarbeiter',
    settings: 'Einstellungen',
    pos: 'Kassensystem',
    logout: 'Abmelden',
    
    // Navigation Groups
    operations: 'Betrieb',
    management: 'Verwaltung',
    analytics: 'Analytik',
    system: 'System',
    
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
  },
  
  Hindi: {
    // Navigation
    dashboard: 'डैशबोर्ड',
    branches: 'शाखाएं',
    inventory: 'इन्वेंटरी',
    menu: 'मेनू',
    recipes: 'व्यंजन विधि',
    orders: 'ऑर्डर',
    kitchen: 'रसोई',
    procurement: 'खरीद',
    sales: 'बिक्री',
    financial: 'वित्तीय',
    profitability: 'लाभप्रदता',
    employees: 'कर्मचारी',
    settings: 'सेटिंग्स',
    pos: 'पीओएस',
    logout: 'लॉग आउट',
    
    // Navigation Groups
    operations: 'संचालन',
    management: 'प्रबंधन',
    analytics: 'विश्लेषण',
    system: 'प्रणाली',
    
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
  },
  
  Urdu: {
    // Navigation
    dashboard: 'ڈیش بورڈ',
    branches: 'شاخیں',
    inventory: 'انوینٹری',
    menu: 'مینو',
    recipes: 'ترکیبیں',
    orders: 'آرڈرز',
    kitchen: 'باورچی خانہ',
    procurement: 'خریداری',
    sales: 'فروخت',
    financial: 'مالیاتی',
    profitability: 'منافع',
    employees: 'ملازمین',
    settings: 'ترتیبات',
    pos: 'پی او ایس',
    logout: 'لاگ آؤٹ',
    
    // Navigation Groups
    operations: 'آپریشنز',
    management: 'انتظام',
    analytics: 'تجزیات',
    system: 'نظام',
    
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
  },
  
  Bengali: {
    // Navigation
    dashboard: 'ড্যাশবোর্ড',
    branches: 'শাখা',
    inventory: 'ইনভেন্টরি',
    menu: 'মেনু',
    recipes: 'রেসিপি',
    orders: 'অর্ডার',
    kitchen: 'রান্নাঘর',
    procurement: 'ক্রয়',
    sales: 'বিক্রয়',
    financial: 'আর্থিক',
    profitability: 'লাভজনকতা',
    employees: 'কর্মচারী',
    settings: 'সেটিংস',
    pos: 'পিওএস',
    logout: 'লগ আউট',
    
    // Navigation Groups
    operations: 'কার্যক্রম',
    management: 'ব্যবস্থাপনা',
    analytics: 'বিশ্লেষণ',
    system: 'সিস্টেম',
    
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
