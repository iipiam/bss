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
  supportAndHelp: string;
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
  
  // Delivery Apps
  deliveryApps: string;
  addDeliveryApp: string;
  editDeliveryApp: string;
  deleteDeliveryApp: string;
  commission: string;
  bankingFees: string;
  subsidy: string;
  posFees: string;
  netEarningsCalculator: string;
  orderAmount: string;
  grossAmount: string;
  afterCommission: string;
  afterBankingFees: string;
  afterSubsidy: string;
  afterPosFees: string;
  netEarnings: string;
  calculationExample: string;
  testOrderAmount: string;
  enterCommission: string;
  enterBankingFees: string;
  enterSubsidy: string;
  enterPosFees: string;
  
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
  
  // Notifications
  newOrder: string;
  orderUpdated: string;
  branch: string;
  items: string;
  
  // Menu
  price: string;
  basePrice: string;
  vatAmount: string;
  discount: string;
  discountPercentage: string;
  description: string;
  available: string;
  unavailable: string;
  
  // Add-ons
  addons: string;
  addon: string;
  addAddon: string;
  editAddon: string;
  deleteAddon: string;
  addonName: string;
  addonCategory: string;
  addonPrice: string;
  selectAddons: string;
  availableAddons: string;
  selectedAddons: string;
  noAddonsAvailable: string;
  addonAdded: string;
  addonUpdated: string;
  addonDeleted: string;
  
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
  
  // Account & Device Preference
  accountAndDevicePreference: string;
  accountAndDevicePreferenceDesc: string;
  account: string;
  roleAndStatus: string;
  devicePreference: string;
  laptop: string;
  ipad: string;
  iphone: string;
  laptopDesc: string;
  ipadDesc: string;
  iphoneDesc: string;
  deviceLayoutNote: string;
  devicePreferenceUpdated: string;
  
  // Menu Item Management
  menuItemCreated: string;
  menuItemCreatedDesc: string;
  menuItemUpdated: string;
  menuItemUpdatedDesc: string;
  menuItemDeleted: string;
  menuItemDeletedDesc: string;
  failedToCreateMenuItem: string;
  failedToUpdateMenuItem: string;
  failedToDeleteMenuItem: string;
  deleteMenuItemTitle: string;
  deleteMenuItemConfirm: string;
  itemNameRequired: string;
  categoryRequired: string;
  priceRequired: string;
  descriptionRequired: string;
  discountRange: string;
  stockNoRequired: string;
  itemDescription: string;
  itemImage: string;
  itemImageHelper: string;
  selectRecipe: string;
  noRecipe: string;
  portionSize: string;
  selectPortionSize: string;
  wholePortion: string;
  threeQuarterPortion: string;
  halfPortion: string;
  quarterPortion: string;
  stockNumber: string;
  priceInclVAT: string;
  discountPercent: string;
  availabilityStatus: string;
  editMenuItem: string;
  addMenuItem: string;
  updateMenuItemDesc: string;
  createMenuItemDesc: string;
  updateMenuItem: string;
  createMenuItem: string;
  loadingBranches: string;
  noBranchesAvailable: string;
  
  // Placeholders
  enterRestaurantName: string;
  enterVatNumber: string;
  enterEmail: string;
  enterPhone: string;
  enterAddress: string;
  openingTime: string;
  closingTime: string;
  enterDiscount: string;
  
  // Authentication
  login: string;
  signup: string;
  password: string;
  confirmPassword: string;
  username: string;
  forgotPassword: string;
  resetPassword: string;
  fullName: string;
  enterFullName: string;
  enterUsername: string;
  chooseUsername: string;
  enterPassword: string;
  choosePassword: string;
  commercialRegistration: string;
  commercialRegistrationPlaceholder: string;
  commercialRegistrationNote: string;
  subscriptionPlan: string;
  billedMonthly: string;
  billedYearly: string;
  perMonth: string;
  perYear: string;
  manageSubscription: string;
  manageYourSubscription: string;
  upgradeModifyCancel: string;
  updatePlan: string;
  cancelSubscription: string;
  confirmCancelSubscription: string;
  currentPlanSummary: string;
  current: string;
  role: string;
  numberOfBranches: string;
  subscriptionUpdated: string;
  subscriptionCanceled: string;
  signIn: string;
  signingIn: string;
  welcomeBack: string;
  loginSuccessDesc: string;
  loginFailed: string;
  invalidCredentials: string;
  accountCreated: string;
  accountCreatedDesc: string;
  signUpFailed: string;
  signUpFailedDesc: string;
  selectLanguage: string;
  restaurantManagementSystem: string;
  vatDisclaimer: string;
  
  // Messages
  success: string;
  error: string;
  confirmDelete: string;
  itemAdded: string;
  itemUpdated: string;
  itemDeleted: string;
  settingsUpdated: string;
  savingSettings: string;
  employeeCreated: string;
  employeeUpdated: string;
  branchCreated: string;
  branchUpdated: string;
  customerCreated: string;
  customerUpdated: string;
  customerDeleted: string;
  recipeCreated: string;
  recipeUpdated: string;
  recipeDeleted: string;
  employeeCreatedDesc: string;
  employeeUpdatedDesc: string;
  branchCreatedDesc: string;
  branchUpdatedDesc: string;
  customerCreatedDesc: string;
  customerUpdatedDesc: string;
  customerDeletedDesc: string;
  recipeCreatedDesc: string;
  recipeUpdatedDesc: string;
  recipeDeletedDesc: string;
  
  // Customer
  addCustomer: string;
  editCustomer: string;
  newCustomer: string;
  existingCustomer: string;
  selectCustomer: string;
  
  // Investors
  investors: string;
  investor: string;
  addInvestor: string;
  editInvestor: string;
  addInvestorDesc: string;
  editInvestorDesc: string;
  investorName: string;
  enterInvestorName: string;
  amountInvested: string;
  interestPercentage: string;
  monthlyEarnings: string;
  netProfitSummary: string;
  netProfitDesc: string;
  manageInvestors: string;
  searchInvestors: string;
  noInvestorsFound: string;
  addFirstInvestor: string;
  investorCreated: string;
  investorUpdated: string;
  investorDeleted: string;
  investorCreatedDesc: string;
  investorUpdatedDesc: string;
  investorDeletedDesc: string;
  failedToCreateInvestor: string;
  failedToUpdateInvestor: string;
  failedToDeleteInvestor: string;
  createInvestor: string;
  updateInvestor: string;
  confirmDeleteInvestorDesc: string;
  interestPercentageHelp: string;
  
  // Employee Management
  employeeManagement: string;
  manageEmployees: string;
  addEmployee: string;
  editEmployee: string;
  createNewEmployee: string;
  addNewEmployeeDesc: string;
  createEmployee: string;
  updateEmployee: string;
  updateEmployeeInfo: string;
  searchEmployees: string;
  creating: string;
  updating: string;
  
  // Employee Form Sections
  basic: string;
  recruitment: string;
  vacation: string;
  visa: string;
  ticket: string;
  performance: string;
  compliance: string;
  
  // Employee Basic Info
  empFullName: string;
  empUsername: string;
  empPassword: string;
  empEmail: string;
  empPhone: string;
  newPassword: string;
  leaveEmpty: string;
  enterNewPassword: string;
  admin: string;
  employee: string;
  activeStatus: string;
  active: string;
  inactive: string;
  permissions: string;
  
  // Recruitment Data
  employeeNumber: string;
  hireDate: string;
  recruitmentSource: string;
  selectSource: string;
  referral: string;
  jobBoard: string;
  agency: string;
  walkIn: string;
  contractType: string;
  selectType: string;
  fullTime: string;
  partTime: string;
  contract: string;
  temporary: string;
  probationEndDate: string;
  
  // Vacation Tracking
  vacationDaysTotal: string;
  vacationDaysUsed: string;
  vacationDaysRemaining: string;
  daysLeft: string;
  
  // Visa Information
  visaNumber: string;
  visaFees: string;
  visaExpiryDate: string;
  visaStatus: string;
  selectStatus: string;
  valid: string;
  expired: string;
  notApplicable: string;
  
  // Ticket Information
  ticketAmount: string;
  ticketDestination: string;
  ticketDate: string;
  ticketStatus: string;
  booked: string;
  used: string;
  
  // Performance Tracking
  performanceRating: string;
  lastReviewDate: string;
  performanceNotes: string;
  enterPerformanceNotes: string;
  
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
  tutorialStepByStepGuide: string;
  tutorialEstimatedTime: string;
  
  // Support Tickets
  supportTickets: string;
  supportTicketsDescription: string;
  createTicket: string;
  myTickets: string;
  allTickets: string;
  ticketSubject: string;
  ticketCategory: string;
  ticketPriority: string;
  ticketDescription: string;
  ticketStatusOpen: string;
  ticketStatusInProgress: string;
  ticketStatusResolved: string;
  ticketStatusClosed: string;
  priorityLow: string;
  priorityMedium: string;
  priorityHigh: string;
  priorityUrgent: string;
  categoryTechnical: string;
  categoryBilling: string;
  categoryFeature: string;
  categoryOther: string;
  sendMessage: string;
  viewTicket: string;
  backToTickets: string;
  messages: string;
  noMessages: string;
  typeMessage: string;
  updateStatus: string;
  ticketDetails: string;
  lastUpdated: string;
  ticketCreated: string;
  ticketResolved: string;
  ticketClosed: string;
  itSupport: string;
  you: string;
  enterSubject: string;
  enterDescription: string;
  selectCategory: string;
  selectPriority: string;
  ticketCreatedSuccess: string;
  messageSent: string;
  statusUpdated: string;
  filterByStatus: string;
  subjectValidation: string;
  categoryValidation: string;
  descriptionValidation: string;
  ticketCreatedSuccessDesc: string;
  failedToCreateTicket: string;
  failedToSendMessage: string;
  ticketStatusUpdatedDesc: string;
  failedToUpdateStatus: string;
  categoryBugReport: string;
  categoryGeneralQuestion: string;
  viewChat: string;
  ticketNotFound: string;
  markInProgress: string;
  markResolved: string;
  closeTicket: string;
  ticketClosedMessage: string;
  noTicketsYet: string;
  createFirstTicket: string;
  noTicketsWithStatus: string;
  createTicketDialogDesc: string;
  
  // Shop
  shop: string;
  shopTitle: string;
  shopDescription: string;
  shopExpenses: string;
  salaries: string;
  salary: string;
  employeeName: string;
  employeeSalaries: string;
  manageSalaries: string;
  position: string;
  amount: string;
  monthlySalary: string;
  paymentDate: string;
  paid: string;
  notes: string;
  addSalary: string;
  editSalary: string;
  salaryFormDescription: string;
  totalSalaries: string;
  paidSalaries: string;
  pendingSalaries: string;
  searchSalaries: string;
  noSalaries: string;
  salaryAdded: string;
  salaryUpdated: string;
  salaryDeleted: string;
  salaryError: string;
  shopBills: string;
  manageBills: string;
  billType: string;
  rent: string;
  electricity: string;
  water: string;
  gas: string;
  internet: string;
  maintenance: string;
  other: string;
  addBill: string;
  editBill: string;
  billFormDescription: string;
  totalBills: string;
  paidBills: string;
  pendingBills: string;
  overdue: string;
  searchBills: string;
  paymentPeriod: string;
  oneTime: string;
  weekly: string;
  monthly: string;
  quarterly: string;
  semiAnnually: string;
  yearly: string;
  foundational: string;
  noBills: string;
  billAdded: string;
  billUpdated: string;
  billDeleted: string;
  billError: string;
  totalShopExpenses: string;
  monthlyExpenses: string;
  currency: string;
  saving: string;
  
  // Bills Page
  bills: string;
  sar: string;
  archived: string;
  yes: string;
  no: string;
  exportedSuccessfully: string;
  exportToExcel: string;
  filters: string;
  filterBills: string;
  all: string;
  startDate: string;
  endDate: string;
  hideArchived: string;
  showArchived: string;
  billsList: string;
  billsFound: string;
  noBillsFound: string;
  actions: string;
  unarchive: string;
  archive: string;
  somethingWentWrong: string;
  
  // Toast Messages & Notifications
  procurementCreated: string;
  procurementUpdated: string;
  procurementDeleted: string;
  orderCompleted: string;
  orderCompletedDesc: string;
  failedToLogout: string;
  failedToCreateBranch: string;
  failedToUpdateBranch: string;
  failedToCreateCustomer: string;
  failedToUpdateCustomer: string;
  failedToDeleteCustomer: string;
  failedToExportCustomers: string;
  failedToExportPDF: string;
  failedToExportExcel: string;
  failedToCreateDeliveryApp: string;
  failedToUpdateDeliveryApp: string;
  failedToDeleteDeliveryApp: string;
  failedToUpdateOrder: string;
  failedToCreateEmployee: string;
  failedToUpdateEmployee: string;
  failedToExportFinancial: string;
  exportFailed: string;
  failedToResetPassword: string;
  failedToSendResetEmail: string;
  failedToUpdateDevicePreference: string;
  failedToExportProfitability: string;
  failedToCreateAdminAccount: string;
  failedToCreateRecipe: string;
  failedToUpdateRecipe: string;
  failedToDeleteRecipe: string;
  couldNotSaveNewOrder: string;
  couldNotCreateRecipe: string;
  couldNotUpdateRecipe: string;
  couldNotDeleteRecipe: string;
  failedToFetchBills: string;
  invalidResetLink: string;
  invalidResetLinkDesc: string;
  passwordsDontMatch: string;
  passwordsDontMatchDesc: string;
  passwordTooShort: string;
  passwordTooShortDesc: string;
  passwordResetSuccessful: string;
  passwordResetSuccessfulDesc: string;
  resetEmailSent: string;
  resetEmailSentDesc: string;
  resetPasswordDesc: string;
  forgotPasswordDesc: string;
  pleaseTryAgainOrRequestNew: string;
  pleaseTryAgainLater: string;
  
  // Additional Pages
  deliveryProfitability: string;
  salesComparison: string;
  
  // Welcome Video Slides
  videoSlide1Title: string;
  videoSlide1Subtitle: string;
  videoSlide2Title: string;
  videoSlide2Subtitle: string;
  videoSlide3Title: string;
  videoSlide3Subtitle: string;
  videoSlide4Title: string;
  videoSlide4Subtitle: string;
  videoSlide5Title: string;
  videoSlide5Subtitle: string;
  videoSlide6Title: string;
  videoSlide6Subtitle: string;
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
    supportAndHelp: 'Support & Help',
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
    
    // Delivery Apps
    deliveryApps: 'Delivery Apps',
    addDeliveryApp: 'Add Delivery App',
    editDeliveryApp: 'Edit Delivery App',
    deleteDeliveryApp: 'Delete Delivery App',
    commission: 'Commission %',
    bankingFees: 'Banking Fees %',
    subsidy: 'Subsidy (SAR)',
    posFees: 'POS Fees (SAR)',
    netEarningsCalculator: 'Net Earnings Calculator',
    orderAmount: 'Order Amount',
    grossAmount: 'Gross Amount',
    afterCommission: 'After Commission',
    afterBankingFees: 'After Banking Fees',
    afterSubsidy: 'After Subsidy',
    afterPosFees: 'After POS Fees',
    netEarnings: 'Net Earnings',
    calculationExample: 'Calculation Example',
    testOrderAmount: 'Test Order Amount',
    enterCommission: 'Enter commission percentage',
    enterBankingFees: 'Enter banking fees percentage',
    enterSubsidy: 'Enter subsidy amount in SAR',
    enterPosFees: 'Enter POS fees in SAR',
    
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
    
    // Notifications
    newOrder: 'New Order',
    orderUpdated: 'Order Updated',
    branch: 'Branch',
    items: 'Items',
    
    // Menu
    price: 'Price',
    basePrice: 'Base Price',
    vatAmount: 'VAT Amount',
    discount: 'Discount',
    discountPercentage: 'Discount %',
    description: 'Description',
    available: 'Available',
    unavailable: 'Unavailable',
    
    // Add-ons
    addons: 'Add-ons',
    addon: 'Add-on',
    addAddon: 'Add Add-on',
    editAddon: 'Edit Add-on',
    deleteAddon: 'Delete Add-on',
    addonName: 'Add-on Name',
    addonCategory: 'Add-on Category',
    addonPrice: 'Add-on Price',
    selectAddons: 'Select Add-ons',
    availableAddons: 'Available Add-ons',
    selectedAddons: 'Selected Add-ons',
    noAddonsAvailable: 'No add-ons available',
    addonAdded: 'Add-on added successfully',
    addonUpdated: 'Add-on updated successfully',
    addonDeleted: 'Add-on deleted successfully',
    
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
    
    // Account & Device Preference
    accountAndDevicePreference: 'Account & Device Preference',
    accountAndDevicePreferenceDesc: 'Choose your device type to optimize the interface layout',
    account: 'Account',
    roleAndStatus: 'Role & Status',
    devicePreference: 'Device Preference',
    laptop: 'Laptop',
    ipad: 'iPad',
    iphone: 'iPhone',
    laptopDesc: 'Full desktop experience with all features',
    ipadDesc: 'Tablet-optimized layout with touch-friendly controls',
    iphoneDesc: 'Compact mobile layout for smartphones',
    deviceLayoutNote: 'The app layout will automatically adjust to match your selected device for the best experience.',
    devicePreferenceUpdated: 'Device preference updated to',
    
    // Menu Item Management
    menuItemCreated: 'Menu Item Created',
    menuItemCreatedDesc: 'The menu item has been added successfully',
    menuItemUpdated: 'Menu Item Updated',
    menuItemUpdatedDesc: 'The menu item has been updated successfully',
    menuItemDeleted: 'Menu Item Deleted',
    menuItemDeletedDesc: 'The menu item has been removed successfully',
    failedToCreateMenuItem: 'Failed to create menu item',
    failedToUpdateMenuItem: 'Failed to update menu item',
    failedToDeleteMenuItem: 'Failed to delete menu item',
    deleteMenuItemTitle: 'Delete Menu Item',
    deleteMenuItemConfirm: 'Are you sure you want to delete this item? This action cannot be undone.',
    itemNameRequired: 'Item name is required',
    categoryRequired: 'Category is required',
    priceRequired: 'Price is required',
    descriptionRequired: 'Description is required',
    discountRange: 'Discount must be between 0 and 100',
    stockNoRequired: 'Stock number is required when no recipe is selected',
    itemDescription: 'Item Description',
    itemImage: 'Item Image (Optional)',
    itemImageHelper: 'Upload an image for this menu item (max 5MB)',
    selectRecipe: 'Select a recipe',
    noRecipe: 'No Recipe',
    portionSize: 'Portion Size',
    selectPortionSize: 'Select portion size',
    wholePortion: 'Whole (1x)',
    threeQuarterPortion: '3/4 Portion (0.75x)',
    halfPortion: '1/2 Portion (0.5x)',
    quarterPortion: '1/4 Portion (0.25x)',
    stockNumber: 'Stock Number',
    priceInclVAT: 'Price (SAR, incl. VAT)',
    discountPercent: 'Discount %',
    availabilityStatus: 'Availability status has been changed',
    editMenuItem: 'Edit Menu Item',
    addMenuItem: 'Add Menu Item',
    updateMenuItemDesc: 'Update the menu item details',
    createMenuItemDesc: 'Create a new item for your menu with VAT-inclusive pricing',
    updateMenuItem: 'Update Menu Item',
    createMenuItem: 'Create Menu Item',
    loadingBranches: 'Loading branches...',
    noBranchesAvailable: 'No branches available',
    
    // Placeholders
    enterRestaurantName: 'Enter restaurant name',
    enterVatNumber: 'Enter VAT number',
    enterEmail: 'info@restaurant.com',
    enterPhone: '+966 XX XXX XXXX',
    enterAddress: 'Enter full address',
    openingTime: 'Opening Time',
    closingTime: 'Closing Time',
    enterDiscount: 'Enter discount percentage (0-100)',
    
    // Authentication
    login: 'Login',
    signup: 'Sign Up',
    password: 'Password',
    confirmPassword: 'Confirm Password',
    username: 'Username',
    forgotPassword: 'Forgot Password',
    resetPassword: 'Reset Password',
    fullName: 'Full Name',
    enterFullName: 'Enter your full name',
    enterUsername: 'Enter your username',
    chooseUsername: 'Choose a username',
    enterPassword: 'Enter your password',
    choosePassword: 'Choose a password',
    commercialRegistration: 'Commercial Registration',
    commercialRegistrationPlaceholder: 'Saudi Commercial Registration number',
    commercialRegistrationNote: 'Required for all restaurant businesses in Saudi Arabia',
    subscriptionPlan: 'Subscription Plan',
    billedMonthly: 'Billed monthly',
    billedYearly: 'Billed yearly',
    perMonth: 'per month',
    perYear: 'per year',
    manageSubscription: 'Manage Subscription',
    manageYourSubscription: 'Manage Your Subscription',
    upgradeModifyCancel: 'Upgrade, modify, or cancel your subscription plan',
    updatePlan: 'Update Plan',
    cancelSubscription: 'Cancel Subscription',
    confirmCancelSubscription: 'Are you sure you want to cancel your subscription?',
    currentPlanSummary: 'Current Plan Summary',
    current: 'Current',
    role: 'Role',
    numberOfBranches: 'Number of Branches',
    subscriptionUpdated: 'Subscription updated to {plan} with {branches} branches. Changes will be reflected in the next billing cycle.',
    subscriptionCanceled: 'Subscription cancellation requested. Please contact support.',
    signIn: 'Sign In',
    signingIn: 'Signing in...',
    welcomeBack: 'Welcome back!',
    loginSuccessDesc: 'You have successfully logged in.',
    loginFailed: 'Login failed',
    invalidCredentials: 'Invalid username or password',
    accountCreated: 'Account created!',
    accountCreatedDesc: 'Please sign in with your credentials.',
    signUpFailed: 'Sign up failed',
    signUpFailedDesc: 'Could not create account',
    selectLanguage: 'Select language',
    restaurantManagementSystem: 'Restaurant management system',
    vatDisclaimer: 'All prices include 15% VAT as required by Saudi law',
    
    // Messages
    success: 'Success',
    error: 'Error',
    confirmDelete: 'Are you sure you want to delete this item?',
    itemAdded: 'Item added successfully',
    itemUpdated: 'Item updated successfully',
    itemDeleted: 'Item deleted successfully',
    settingsUpdated: 'Settings updated successfully',
    savingSettings: 'Saving...',
    employeeCreated: 'Employee created',
    employeeUpdated: 'Employee updated',
    branchCreated: 'Branch created',
    branchUpdated: 'Branch updated',
    customerCreated: 'Customer created',
    customerUpdated: 'Customer updated',
    customerDeleted: 'Customer deleted',
    recipeCreated: 'Recipe created',
    recipeUpdated: 'Recipe updated',
    recipeDeleted: 'Recipe deleted',
    employeeCreatedDesc: 'The employee has been created successfully',
    employeeUpdatedDesc: 'The employee has been updated successfully',
    branchCreatedDesc: 'The branch has been created successfully',
    branchUpdatedDesc: 'The branch has been updated successfully',
    customerCreatedDesc: 'The customer has been created successfully',
    customerUpdatedDesc: 'The customer has been updated successfully',
    customerDeletedDesc: 'The customer has been deleted successfully',
    recipeCreatedDesc: 'The recipe has been created successfully',
    recipeUpdatedDesc: 'The recipe has been updated successfully',
    recipeDeletedDesc: 'The recipe has been deleted successfully',
    
    // Customer
    addCustomer: 'Add Customer',
    editCustomer: 'Edit Customer',
    newCustomer: 'New Customer',
    existingCustomer: 'Existing Customer',
    selectCustomer: 'Select Customer',
    
    // Investors
    investors: 'Investors',
    investor: 'Investor',
    addInvestor: 'Add Investor',
    editInvestor: 'Edit Investor',
    addInvestorDesc: 'Add a new investor to track their earnings.',
    editInvestorDesc: 'Update investor details.',
    investorName: 'Investor Name',
    enterInvestorName: 'Enter investor name',
    amountInvested: 'Amount Invested',
    interestPercentage: 'Interest Percentage',
    monthlyEarnings: 'Monthly Earnings',
    netProfitSummary: 'Net Profit Summary',
    netProfitDesc: 'Total net profit after all costs (used for investor earnings calculation)',
    manageInvestors: 'Manage investors and track their earnings',
    searchInvestors: 'Search investors...',
    noInvestorsFound: 'No investors found',
    addFirstInvestor: 'Add your first investor to get started',
    investorCreated: 'Investor Created',
    investorUpdated: 'Investor Updated',
    investorDeleted: 'Investor Deleted',
    investorCreatedDesc: 'New investor has been added successfully.',
    investorUpdatedDesc: 'Investor details have been updated successfully.',
    investorDeletedDesc: 'Investor has been removed successfully.',
    failedToCreateInvestor: 'Failed to Create Investor',
    failedToUpdateInvestor: 'Failed to Update Investor',
    failedToDeleteInvestor: 'Failed to Delete Investor',
    createInvestor: 'Create Investor',
    updateInvestor: 'Update Investor',
    confirmDeleteInvestorDesc: 'Are you sure you want to delete this investor? This action cannot be undone.',
    interestPercentageHelp: 'Percentage of net profit to be earned',
    
    // Employee Management
    employeeManagement: 'Employee Management',
    manageEmployees: 'Manage employees and their information',
    addEmployee: 'Add Employee',
    editEmployee: 'Edit Employee',
    createNewEmployee: 'Create New Employee',
    addNewEmployeeDesc: 'Add a new employee to your system',
    createEmployee: 'Create Employee',
    updateEmployee: 'Update Employee',
    updateEmployeeInfo: 'Update employee information and settings',
    searchEmployees: 'Search employees by name, username, email, phone, or employee number...',
    creating: 'Creating...',
    updating: 'Updating...',
    
    // Employee Form Sections
    basic: 'Basic',
    recruitment: 'Recruitment',
    vacation: 'Vacation',
    visa: 'Visa',
    ticket: 'Ticket',
    performance: 'Performance',
    compliance: 'Compliance',
    
    // Employee Basic Info
    empFullName: 'Full Name',
    empUsername: 'Username',
    empPassword: 'Password',
    newPassword: 'New Password',
    leaveEmpty: 'leave empty to keep current',
    enterNewPassword: 'Enter new password or leave blank',
    empEmail: 'Email',
    empPhone: 'Phone',
    admin: 'Admin',
    employee: 'Employee',
    activeStatus: 'Active Status',
    active: 'Active',
    inactive: 'Inactive',
    permissions: 'Permissions',
    
    // Recruitment Data
    employeeNumber: 'Employee Number',
    hireDate: 'Hire Date',
    recruitmentSource: 'Recruitment Source',
    selectSource: 'Select source',
    referral: 'Referral',
    jobBoard: 'Job Board',
    agency: 'Agency',
    walkIn: 'Walk-in',
    contractType: 'Contract Type',
    selectType: 'Select type',
    fullTime: 'Full Time',
    partTime: 'Part Time',
    contract: 'Contract',
    temporary: 'Temporary',
    probationEndDate: 'Probation End Date',
    
    // Vacation Tracking
    vacationDaysTotal: 'Total Vacation Days',
    vacationDaysUsed: 'Vacation Days Used',
    vacationDaysRemaining: 'Vacation Days Remaining',
    daysLeft: 'days left',
    
    // Visa Information
    visaNumber: 'Visa Number',
    visaFees: 'Visa Fees',
    visaExpiryDate: 'Visa Expiry Date',
    visaStatus: 'Visa Status',
    selectStatus: 'Select status',
    valid: 'Valid',
    expired: 'Expired',
    notApplicable: 'Not Applicable',
    
    // Ticket Information
    ticketAmount: 'Ticket Amount',
    ticketDestination: 'Ticket Destination',
    ticketDate: 'Ticket Date',
    ticketStatus: 'Ticket Status',
    booked: 'Booked',
    used: 'Used',
    
    // Performance Tracking
    performanceRating: 'Performance Rating',
    lastReviewDate: 'Last Review Date',
    performanceNotes: 'Performance Notes',
    enterPerformanceNotes: 'Enter performance notes and feedback',
    
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
    tutorialStepByStepGuide: 'Step-by-Step Guide',
    tutorialEstimatedTime: 'Estimated time',
    
    // Support Tickets
    supportTickets: 'Support Tickets',
    supportTicketsDescription: 'Create and manage support tickets for technical assistance',
    createTicket: 'Create Ticket',
    myTickets: 'My Tickets',
    allTickets: 'All Tickets',
    ticketSubject: 'Subject',
    ticketCategory: 'Category',
    ticketPriority: 'Priority',
    ticketDescription: 'Description',
    ticketStatusOpen: 'Open',
    ticketStatusInProgress: 'In Progress',
    ticketStatusResolved: 'Resolved',
    ticketStatusClosed: 'Closed',
    priorityLow: 'Low',
    priorityMedium: 'Medium',
    priorityHigh: 'High',
    priorityUrgent: 'Urgent',
    categoryTechnical: 'Technical Issue',
    categoryBilling: 'Billing Question',
    categoryFeature: 'Feature Request',
    categoryOther: 'Other',
    sendMessage: 'Send Message',
    viewTicket: 'View Ticket',
    backToTickets: 'Back to Tickets',
    messages: 'Messages',
    noMessages: 'No messages yet. Start a conversation!',
    typeMessage: 'Type your message...',
    updateStatus: 'Update Status',
    ticketDetails: 'Ticket Details',
    lastUpdated: 'Last Updated',
    ticketCreated: 'Ticket Created',
    ticketResolved: 'Ticket Resolved',
    ticketClosed: 'Ticket Closed',
    itSupport: 'IT Support',
    you: 'You',
    enterSubject: 'Enter ticket subject',
    enterDescription: 'Describe your issue in detail',
    selectCategory: 'Select a category',
    selectPriority: 'Select priority level',
    ticketCreatedSuccess: 'Ticket created successfully',
    messageSent: 'Message sent',
    statusUpdated: 'Status updated successfully',
    filterByStatus: 'Filter by status',
    subjectValidation: 'Subject must be at least 5 characters',
    categoryValidation: 'Please select a category',
    descriptionValidation: 'Description must be at least 10 characters',
    ticketCreatedSuccessDesc: 'Your support ticket has been created successfully',
    failedToCreateTicket: 'Failed to create ticket',
    failedToSendMessage: 'Failed to send message',
    ticketStatusUpdatedDesc: 'Ticket status has been updated',
    failedToUpdateStatus: 'Failed to update status',
    categoryBugReport: 'Bug Report',
    categoryGeneralQuestion: 'General Question',
    viewChat: 'View Chat',
    ticketNotFound: 'Ticket not found',
    markInProgress: 'Mark In Progress',
    markResolved: 'Mark Resolved',
    closeTicket: 'Close Ticket',
    ticketClosedMessage: 'This ticket is closed and no longer accepts new messages',
    noTicketsYet: 'No support tickets yet. Create one to get started!',
    createFirstTicket: 'Create Your First Ticket',
    noTicketsWithStatus: 'No tickets found with this status',
    createTicketDialogDesc: 'Describe your issue and our support team will help you',
    
    // Shop
    shop: 'Shop',
    shopTitle: 'Shop',
    shopDescription: 'Manage employee salaries and shop expenses',
    shopExpenses: 'Shop Expenses',
    salaries: 'Salaries',
    salary: 'Salary',
    employeeName: 'Employee Name',
    employeeSalaries: 'Employee Salaries',
    manageSalaries: 'Manage employee salary payments and records',
    position: 'Position',
    amount: 'Amount',
    monthlySalary: 'Monthly Salary',
    paymentDate: 'Payment Date',
    paid: 'Paid',
    notes: 'Notes',
    addSalary: 'Add Salary',
    editSalary: 'Edit Salary',
    salaryFormDescription: 'Enter employee salary information',
    totalSalaries: 'Total Salaries',
    paidSalaries: 'Paid Salaries',
    pendingSalaries: 'Pending Salaries',
    searchSalaries: 'Search salaries by employee name or position...',
    noSalaries: 'No salaries found',
    salaryAdded: 'Salary added successfully',
    salaryUpdated: 'Salary updated successfully',
    salaryDeleted: 'Salary deleted successfully',
    salaryError: 'Error processing salary',
    shopBills: 'Shop Bills',
    manageBills: 'Manage shop bills and expenses',
    billType: 'Bill Type',
    rent: 'Rent',
    electricity: 'Electricity',
    water: 'Water',
    gas: 'Gas',
    internet: 'Internet',
    maintenance: 'Maintenance',
    other: 'Other',
    addBill: 'Add Bill',
    editBill: 'Edit Bill',
    billFormDescription: 'Enter bill information',
    totalBills: 'Total Bills',
    paidBills: 'Paid Bills',
    pendingBills: 'Pending Bills',
    overdue: 'Overdue',
    searchBills: 'Search bills by type or description...',
    paymentPeriod: 'Payment Period',
    oneTime: 'One Time Payment',
    weekly: 'Weekly',
    monthly: 'Monthly',
    quarterly: 'Quarterly (1/4 Year)',
    semiAnnually: 'Semi-Annually (1/2 Year)',
    yearly: 'Yearly',
    foundational: 'Foundational',
    noBills: 'No bills found',
    billAdded: 'Bill added successfully',
    billUpdated: 'Bill updated successfully',
    billDeleted: 'Bill deleted successfully',
    billError: 'Error processing bill',
    totalShopExpenses: 'Total Shop Expenses',
    monthlyExpenses: 'Monthly Expenses',
    currency: 'SAR',
    saving: 'Saving...',
    
    // Bills Page
    bills: 'Bills',
    sar: 'SAR',
    archived: 'Archived',
    yes: 'Yes',
    no: 'No',
    exportedSuccessfully: 'Exported successfully',
    exportToExcel: 'Export to Excel',
    filters: 'Filters',
    filterBills: 'Filter bills by various criteria',
    all: 'All',
    startDate: 'Start Date',
    endDate: 'End Date',
    hideArchived: 'Hide Archived',
    showArchived: 'Show Archived',
    billsList: 'Bills List',
    billsFound: 'bills found',
    noBillsFound: 'No bills found',
    actions: 'Actions',
    unarchive: 'Unarchive',
    archive: 'Archive',
    somethingWentWrong: 'Something went wrong',
    
    // Toast Messages & Notifications
    procurementCreated: 'Procurement item created successfully',
    procurementUpdated: 'Procurement item updated successfully',
    procurementDeleted: 'Procurement item deleted successfully',
    orderCompleted: 'Order completed successfully',
    orderCompletedDesc: 'Order has been placed and invoice generated',
    failedToLogout: 'Failed to logout. Please try again.',
    failedToCreateBranch: 'Failed to create branch',
    failedToUpdateBranch: 'Failed to update branch',
    failedToCreateCustomer: 'Failed to create customer',
    failedToUpdateCustomer: 'Failed to update customer',
    failedToDeleteCustomer: 'Failed to delete customer',
    failedToExportCustomers: 'Failed to export customer data',
    failedToExportPDF: 'Failed to export PDF',
    failedToExportExcel: 'Failed to export Excel',
    failedToCreateDeliveryApp: 'Failed to create delivery app',
    failedToUpdateDeliveryApp: 'Failed to update delivery app',
    failedToDeleteDeliveryApp: 'Failed to delete delivery app',
    failedToUpdateOrder: 'Failed to update order',
    failedToCreateEmployee: 'Failed to create employee',
    failedToUpdateEmployee: 'Failed to update employee',
    failedToExportFinancial: 'Failed to export financial data',
    exportFailed: 'Export failed',
    failedToResetPassword: 'Failed to reset password',
    failedToSendResetEmail: 'Failed to send reset email',
    failedToUpdateDevicePreference: 'Failed to update device preference',
    failedToExportProfitability: 'Failed to export profitability data',
    failedToCreateAdminAccount: 'Failed to create admin account',
    failedToCreateRecipe: 'Failed to create recipe',
    failedToUpdateRecipe: 'Failed to update recipe',
    failedToDeleteRecipe: 'Failed to delete recipe',
    couldNotSaveNewOrder: 'Could not save new order',
    couldNotCreateRecipe: 'Could not create recipe',
    couldNotUpdateRecipe: 'Could not update recipe',
    couldNotDeleteRecipe: 'Could not delete recipe',
    failedToFetchBills: 'Failed to fetch bills',
    invalidResetLink: 'Invalid reset link',
    invalidResetLinkDesc: 'The password reset link is invalid or expired.',
    passwordsDontMatch: "Passwords don't match",
    passwordsDontMatchDesc: 'Please make sure both passwords are the same.',
    passwordTooShort: 'Password too short',
    passwordTooShortDesc: 'Password must be at least 6 characters long.',
    passwordResetSuccessful: 'Password reset successful',
    passwordResetSuccessfulDesc: 'You can now log in with your new password.',
    resetEmailSent: 'Reset email sent',
    resetEmailSentDesc: 'Check your email for password reset instructions.',
    resetPasswordDesc: 'Enter your new password below. It must be at least 6 characters long.',
    forgotPasswordDesc: 'Enter your email address and we will send you instructions to reset your password.',
    pleaseTryAgainOrRequestNew: 'Please try again or request a new reset link.',
    pleaseTryAgainLater: 'Please try again later.',
    
    // Additional Pages
    deliveryProfitability: 'Delivery Profitability',
    salesComparison: 'Sales Comparison',
    
    // Welcome Video Slides
    videoSlide1Title: 'Meet Ahmad - Restaurant Owner',
    videoSlide1Subtitle: 'Struggling with manual inventory, lost orders, and declining profits',
    videoSlide2Title: 'Real-Time POS System',
    videoSlide2Subtitle: 'Process orders instantly • Track sales live • Accept multiple payment methods',
    videoSlide3Title: 'Smart Inventory Management',
    videoSlide3Subtitle: 'Automatic stock deduction • Low stock alerts • Never run out of ingredients',
    videoSlide4Title: 'ZATCA-Compliant Invoices',
    videoSlide4Subtitle: 'Generate bilingual invoices instantly • QR codes • Full tax compliance',
    videoSlide5Title: 'Powerful Analytics Dashboard',
    videoSlide5Subtitle: 'Track profitability • Forecast demand • Make data-driven decisions',
    videoSlide6Title: 'Ahmad\'s Success Story',
    videoSlide6Subtitle: '300% revenue growth • 5 new branches • Join thousands of thriving restaurants',
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
    supportAndHelp: 'الدعم والمساعدة',
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
    
    // Delivery Apps
    deliveryApps: 'تطبيقات التوصيل',
    addDeliveryApp: 'إضافة تطبيق توصيل',
    editDeliveryApp: 'تعديل تطبيق توصيل',
    deleteDeliveryApp: 'حذف تطبيق توصيل',
    commission: 'العمولة %',
    bankingFees: 'رسوم البنك %',
    subsidy: 'الدعم (ريال)',
    posFees: 'رسوم نقاط البيع (ريال)',
    netEarningsCalculator: 'حاسبة صافي الأرباح',
    orderAmount: 'مبلغ الطلب',
    grossAmount: 'المبلغ الإجمالي',
    afterCommission: 'بعد العمولة',
    afterBankingFees: 'بعد رسوم البنك',
    afterSubsidy: 'بعد الدعم',
    afterPosFees: 'بعد رسوم نقاط البيع',
    netEarnings: 'صافي الأرباح',
    calculationExample: 'مثال على الحساب',
    testOrderAmount: 'مبلغ الطلب التجريبي',
    enterCommission: 'أدخل نسبة العمولة',
    enterBankingFees: 'أدخل نسبة رسوم البنك',
    enterSubsidy: 'أدخل مبلغ الدعم بالريال',
    enterPosFees: 'أدخل رسوم نقاط البيع بالريال',
    
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
    
    // Notifications
    newOrder: 'طلب جديد',
    orderUpdated: 'تحديث الطلب',
    branch: 'الفرع',
    items: 'العناصر',
    
    // Menu
    price: 'السعر',
    basePrice: 'السعر الأساسي',
    vatAmount: 'قيمة الضريبة',
    discount: 'الخصم',
    discountPercentage: 'نسبة الخصم %',
    description: 'الوصف',
    available: 'متاح',
    unavailable: 'غير متاح',
    
    // Add-ons
    addons: 'الإضافات',
    addon: 'إضافة',
    addAddon: 'إضافة إضافة',
    editAddon: 'تعديل إضافة',
    deleteAddon: 'حذف إضافة',
    addonName: 'اسم الإضافة',
    addonCategory: 'فئة الإضافة',
    addonPrice: 'سعر الإضافة',
    selectAddons: 'اختر الإضافات',
    availableAddons: 'الإضافات المتاحة',
    selectedAddons: 'الإضافات المحددة',
    noAddonsAvailable: 'لا توجد إضافات متاحة',
    addonAdded: 'تمت إضافة الإضافة بنجاح',
    addonUpdated: 'تم تحديث الإضافة بنجاح',
    addonDeleted: 'تم حذف الإضافة بنجاح',
    
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
    
    // Account & Device Preference
    accountAndDevicePreference: 'الحساب وتفضيل الجهاز',
    accountAndDevicePreferenceDesc: 'اختر نوع جهازك لتحسين تخطيط الواجهة',
    account: 'الحساب',
    roleAndStatus: 'الدور والحالة',
    devicePreference: 'تفضيل الجهاز',
    laptop: 'حاسوب محمول',
    ipad: 'آيباد',
    iphone: 'آيفون',
    laptopDesc: 'تجربة سطح مكتب كاملة مع جميع الميزات',
    ipadDesc: 'تخطيط محسّن للأجهزة اللوحية مع عناصر تحكم سهلة اللمس',
    iphoneDesc: 'تخطيط محمول مدمج للهواتف الذكية',
    deviceLayoutNote: 'سيتم ضبط تخطيط التطبيق تلقائيًا ليتناسب مع جهازك المحدد للحصول على أفضل تجربة.',
    devicePreferenceUpdated: 'تم تحديث تفضيل الجهاز إلى',
    
    // Menu Item Management
    menuItemCreated: 'تم إنشاء عنصر القائمة',
    menuItemCreatedDesc: 'تمت إضافة عنصر القائمة بنجاح',
    menuItemUpdated: 'تم تحديث عنصر القائمة',
    menuItemUpdatedDesc: 'تم تحديث عنصر القائمة بنجاح',
    menuItemDeleted: 'تم حذف عنصر القائمة',
    menuItemDeletedDesc: 'تمت إزالة عنصر القائمة بنجاح',
    failedToCreateMenuItem: 'فشل إنشاء عنصر القائمة',
    failedToUpdateMenuItem: 'فشل تحديث عنصر القائمة',
    failedToDeleteMenuItem: 'فشل حذف عنصر القائمة',
    deleteMenuItemTitle: 'حذف عنصر القائمة',
    deleteMenuItemConfirm: 'هل أنت متأكد أنك تريد حذف هذا العنصر؟ لا يمكن التراجع عن هذا الإجراء.',
    itemNameRequired: 'اسم العنصر مطلوب',
    categoryRequired: 'الفئة مطلوبة',
    priceRequired: 'السعر مطلوب',
    descriptionRequired: 'الوصف مطلوب',
    discountRange: 'يجب أن يكون الخصم بين 0 و 100',
    stockNoRequired: 'رقم المخزون مطلوب عندما لا يتم تحديد وصفة',
    itemDescription: 'وصف العنصر',
    itemImage: 'صورة العنصر (اختياري)',
    itemImageHelper: 'قم بتحميل صورة لعنصر القائمة هذا (الحد الأقصى 5 ميجابايت)',
    selectRecipe: 'حدد وصفة',
    noRecipe: 'لا توجد وصفة',
    portionSize: 'حجم الحصة',
    selectPortionSize: 'حدد حجم الحصة',
    wholePortion: 'كامل (1x)',
    threeQuarterPortion: '3/4 حصة (0.75x)',
    halfPortion: '1/2 حصة (0.5x)',
    quarterPortion: '1/4 حصة (0.25x)',
    stockNumber: 'رقم المخزون',
    priceInclVAT: 'السعر (ريال سعودي، شامل ضريبة القيمة المضافة)',
    discountPercent: 'نسبة الخصم %',
    availabilityStatus: 'تم تغيير حالة التوفر',
    editMenuItem: 'تحرير عنصر القائمة',
    addMenuItem: 'إضافة عنصر القائمة',
    updateMenuItemDesc: 'تحديث تفاصيل عنصر القائمة',
    createMenuItemDesc: 'إنشاء عنصر جديد للقائمة بأسعار شاملة لضريبة القيمة المضافة',
    updateMenuItem: 'تحديث عنصر القائمة',
    createMenuItem: 'إنشاء عنصر القائمة',
    loadingBranches: 'جاري تحميل الفروع...',
    noBranchesAvailable: 'لا توجد فروع متاحة',
    
    // Placeholders
    enterRestaurantName: 'أدخل اسم المطعم',
    enterVatNumber: 'أدخل الرقم الضريبي',
    enterEmail: 'info@restaurant.com',
    enterPhone: '+966 XX XXX XXXX',
    enterAddress: 'أدخل العنوان الكامل',
    openingTime: 'وقت الفتح',
    closingTime: 'وقت الإغلاق',
    enterDiscount: 'أدخل نسبة الخصم (0-100)',
    
    // Authentication
    login: 'تسجيل الدخول',
    signup: 'إنشاء حساب',
    password: 'كلمة المرور',
    confirmPassword: 'تأكيد كلمة المرور',
    username: 'اسم المستخدم',
    forgotPassword: 'نسيت كلمة المرور',
    resetPassword: 'إعادة تعيين كلمة المرور',
    fullName: 'الاسم الكامل',
    enterFullName: 'أدخل اسمك الكامل',
    enterUsername: 'أدخل اسم المستخدم',
    chooseUsername: 'اختر اسم مستخدم',
    enterPassword: 'أدخل كلمة المرور',
    choosePassword: 'اختر كلمة مرور',
    commercialRegistration: 'السجل التجاري',
    commercialRegistrationPlaceholder: 'رقم السجل التجاري السعودي',
    commercialRegistrationNote: 'مطلوب لجميع الأعمال التجارية للمطاعم في المملكة العربية السعودية',
    subscriptionPlan: 'خطة الاشتراك',
    billedMonthly: 'يتم الدفع شهرياً',
    billedYearly: 'يتم الدفع سنوياً',
    perMonth: 'شهرياً',
    perYear: 'سنوياً',
    manageSubscription: 'إدارة الاشتراك',
    manageYourSubscription: 'إدارة اشتراكك',
    upgradeModifyCancel: 'ترقية، تعديل، أو إلغاء خطة اشتراكك',
    updatePlan: 'تحديث الخطة',
    cancelSubscription: 'إلغاء الاشتراك',
    confirmCancelSubscription: 'هل أنت متأكد من إلغاء اشتراكك؟',
    currentPlanSummary: 'ملخص الخطة الحالية',
    current: 'الحالية',
    role: 'الدور',
    numberOfBranches: 'عدد الفروع',
    subscriptionUpdated: 'تم تحديث الاشتراك إلى {plan} مع {branches} فروع. ستنعكس التغييرات في دورة الفوترة التالية.',
    subscriptionCanceled: 'تم طلب إلغاء الاشتراك. يرجى الاتصال بالدعم.',
    signIn: 'تسجيل الدخول',
    signingIn: 'جاري تسجيل الدخول...',
    welcomeBack: 'مرحباً بعودتك!',
    loginSuccessDesc: 'تم تسجيل الدخول بنجاح.',
    loginFailed: 'فشل تسجيل الدخول',
    invalidCredentials: 'اسم المستخدم أو كلمة المرور غير صحيحة',
    accountCreated: 'تم إنشاء الحساب!',
    accountCreatedDesc: 'يرجى تسجيل الدخول باستخدام بيانات الاعتماد الخاصة بك.',
    signUpFailed: 'فشل إنشاء الحساب',
    signUpFailedDesc: 'لا يمكن إنشاء الحساب',
    selectLanguage: 'اختر اللغة',
    restaurantManagementSystem: 'نظام إدارة المطاعم',
    vatDisclaimer: 'جميع الأسعار تشمل ضريبة القيمة المضافة 15٪ كما يتطلب القانون السعودي',
    
    // Messages
    success: 'نجح',
    error: 'خطأ',
    confirmDelete: 'هل أنت متأكد من حذف هذا العنصر؟',
    itemAdded: 'تمت إضافة العنصر بنجاح',
    itemUpdated: 'تم تحديث العنصر بنجاح',
    itemDeleted: 'تم حذف العنصر بنجاح',
    settingsUpdated: 'تم تحديث الإعدادات بنجاح',
    savingSettings: 'جاري الحفظ...',
    employeeCreated: 'تم إنشاء الموظف',
    employeeUpdated: 'تم تحديث الموظف',
    branchCreated: 'تم إنشاء الفرع',
    branchUpdated: 'تم تحديث الفرع',
    customerCreated: 'تم إنشاء العميل',
    customerUpdated: 'تم تحديث العميل',
    customerDeleted: 'تم حذف العميل',
    recipeCreated: 'تم إنشاء الوصفة',
    recipeUpdated: 'تم تحديث الوصفة',
    recipeDeleted: 'تم حذف الوصفة',
    employeeCreatedDesc: 'تم إنشاء الموظف بنجاح',
    employeeUpdatedDesc: 'تم تحديث الموظف بنجاح',
    branchCreatedDesc: 'تم إنشاء الفرع بنجاح',
    branchUpdatedDesc: 'تم تحديث الفرع بنجاح',
    customerCreatedDesc: 'تم إنشاء العميل بنجاح',
    customerUpdatedDesc: 'تم تحديث العميل بنجاح',
    customerDeletedDesc: 'تم حذف العميل بنجاح',
    recipeCreatedDesc: 'تم إنشاء الوصفة بنجاح',
    recipeUpdatedDesc: 'تم تحديث الوصفة بنجاح',
    recipeDeletedDesc: 'تم حذف الوصفة بنجاح',
    
    // Customer
    addCustomer: 'إضافة عميل',
    editCustomer: 'تعديل عميل',
    newCustomer: 'عميل جديد',
    existingCustomer: 'عميل موجود',
    selectCustomer: 'اختر عميل',
    
    // Investors
    investors: 'المستثمرون',
    investor: 'مستثمر',
    addInvestor: 'إضافة مستثمر',
    editInvestor: 'تعديل مستثمر',
    addInvestorDesc: 'إضافة مستثمر جديد لتتبع أرباحه.',
    editInvestorDesc: 'تحديث تفاصيل المستثمر.',
    investorName: 'اسم المستثمر',
    enterInvestorName: 'أدخل اسم المستثمر',
    amountInvested: 'المبلغ المستثمر',
    interestPercentage: 'نسبة الفائدة',
    monthlyEarnings: 'الأرباح الشهرية',
    netProfitSummary: 'ملخص صافي الربح',
    netProfitDesc: 'إجمالي صافي الربح بعد جميع التكاليف (يستخدم لحساب أرباح المستثمرين)',
    manageInvestors: 'إدارة المستثمرين وتتبع أرباحهم',
    searchInvestors: 'ابحث عن المستثمرين...',
    noInvestorsFound: 'لم يتم العثور على مستثمرين',
    addFirstInvestor: 'أضف أول مستثمر لديك للبدء',
    investorCreated: 'تم إنشاء المستثمر',
    investorUpdated: 'تم تحديث المستثمر',
    investorDeleted: 'تم حذف المستثمر',
    investorCreatedDesc: 'تم إضافة مستثمر جديد بنجاح.',
    investorUpdatedDesc: 'تم تحديث تفاصيل المستثمر بنجاح.',
    investorDeletedDesc: 'تم إزالة المستثمر بنجاح.',
    failedToCreateInvestor: 'فشل إنشاء المستثمر',
    failedToUpdateInvestor: 'فشل تحديث المستثمر',
    failedToDeleteInvestor: 'فشل حذف المستثمر',
    createInvestor: 'إنشاء مستثمر',
    updateInvestor: 'تحديث المستثمر',
    confirmDeleteInvestorDesc: 'هل أنت متأكد من أنك تريد حذف هذا المستثمر؟ لا يمكن التراجع عن هذا الإجراء.',
    interestPercentageHelp: 'نسبة صافي الربح المراد كسبها',
    
    // Employee Management
    employeeManagement: 'إدارة الموظفين',
    manageEmployees: 'إدارة الموظفين ومعلوماتهم',
    addEmployee: 'إضافة موظف',
    editEmployee: 'تعديل موظف',
    createNewEmployee: 'إنشاء موظف جديد',
    addNewEmployeeDesc: 'إضافة موظف جديد إلى نظامك',
    createEmployee: 'إنشاء موظف',
    updateEmployee: 'تحديث الموظف',
    updateEmployeeInfo: 'تحديث معلومات وإعدادات الموظف',
    searchEmployees: 'البحث في الموظفين بالاسم أو اسم المستخدم أو البريد الإلكتروني أو الهاتف أو رقم الموظف...',
    creating: 'جاري الإنشاء...',
    updating: 'جاري التحديث...',
    
    // Employee Form Sections
    basic: 'أساسي',
    recruitment: 'التوظيف',
    vacation: 'الإجازة',
    visa: 'التأشيرة',
    ticket: 'التذكرة',
    performance: 'الأداء',
    compliance: 'الامتثال',
    
    // Employee Basic Info
    empFullName: 'الاسم الكامل',
    empUsername: 'اسم المستخدم',
    empPassword: 'كلمة المرور',
    empEmail: 'البريد الإلكتروني',
    empPhone: 'الهاتف',
    newPassword: 'كلمة المرور الجديدة',
    leaveEmpty: 'اتركها فارغة للحفاظ على الحالية',
    enterNewPassword: 'أدخل كلمة مرور جديدة أو اتركها فارغة',
    admin: 'مدير',
    employee: 'موظف',
    activeStatus: 'حالة النشاط',
    active: 'نشط',
    inactive: 'غير نشط',
    permissions: 'الصلاحيات',
    
    // Recruitment Data
    employeeNumber: 'رقم الموظف',
    hireDate: 'تاريخ التوظيف',
    recruitmentSource: 'مصدر التوظيف',
    selectSource: 'اختر المصدر',
    referral: 'إحالة',
    jobBoard: 'لوحة الوظائف',
    agency: 'وكالة',
    walkIn: 'دخول مباشر',
    contractType: 'نوع العقد',
    selectType: 'اختر النوع',
    fullTime: 'دوام كامل',
    partTime: 'دوام جزئي',
    contract: 'عقد',
    temporary: 'مؤقت',
    probationEndDate: 'تاريخ انتهاء التجربة',
    
    // Vacation Tracking
    vacationDaysTotal: 'إجمالي أيام الإجازة',
    vacationDaysUsed: 'أيام الإجازة المستخدمة',
    vacationDaysRemaining: 'أيام الإجازة المتبقية',
    daysLeft: 'أيام متبقية',
    
    // Visa Information
    visaNumber: 'رقم التأشيرة',
    visaFees: 'رسوم التأشيرة',
    visaExpiryDate: 'تاريخ انتهاء التأشيرة',
    visaStatus: 'حالة التأشيرة',
    selectStatus: 'اختر الحالة',
    valid: 'صالحة',
    expired: 'منتهية',
    notApplicable: 'غير قابل للتطبيق',
    
    // Ticket Information
    ticketAmount: 'مبلغ التذكرة',
    ticketDestination: 'وجهة التذكرة',
    ticketDate: 'تاريخ التذكرة',
    ticketStatus: 'حالة التذكرة',
    booked: 'محجوزة',
    used: 'مستخدمة',
    
    // Performance Tracking
    performanceRating: 'تقييم الأداء',
    lastReviewDate: 'تاريخ آخر مراجعة',
    performanceNotes: 'ملاحظات الأداء',
    enterPerformanceNotes: 'أدخل ملاحظات وملاحظات الأداء',
    
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
    tutorialStepByStepGuide: 'دليل خطوة بخطوة',
    tutorialEstimatedTime: 'الوقت المقدر',
    
    
    // Support Tickets
    supportTickets: 'Support Tickets',
    supportTicketsDescription: 'Create and manage support tickets for technical assistance',
    createTicket: 'Create Ticket',
    myTickets: 'My Tickets',
    allTickets: 'All Tickets',
    ticketSubject: 'Subject',
    ticketCategory: 'Category',
    ticketPriority: 'Priority',
    ticketDescription: 'Description',
    ticketStatusOpen: 'Open',
    ticketStatusInProgress: 'In Progress',
    ticketStatusResolved: 'Resolved',
    ticketStatusClosed: 'Closed',
    priorityLow: 'Low',
    priorityMedium: 'Medium',
    priorityHigh: 'High',
    priorityUrgent: 'Urgent',
    categoryTechnical: 'Technical Issue',
    categoryBilling: 'Billing Question',
    categoryFeature: 'Feature Request',
    categoryOther: 'Other',
    sendMessage: 'Send Message',
    viewTicket: 'View Ticket',
    backToTickets: 'Back to Tickets',
    messages: 'Messages',
    noMessages: 'No messages yet. Start a conversation!',
    typeMessage: 'Type your message...',
    updateStatus: 'Update Status',
    ticketDetails: 'Ticket Details',
    lastUpdated: 'Last Updated',
    ticketCreated: 'Ticket Created',
    ticketResolved: 'Ticket Resolved',
    ticketClosed: 'Ticket Closed',
    itSupport: 'IT Support',
    you: 'You',
    enterSubject: 'Enter ticket subject',
    enterDescription: 'Describe your issue in detail',
    selectCategory: 'Select a category',
    selectPriority: 'Select priority level',
    ticketCreatedSuccess: 'Ticket created successfully',
    messageSent: 'Message sent',
    statusUpdated: 'Status updated successfully',
    filterByStatus: 'تصفية حسب الحالة',
    subjectValidation: 'يجب أن يكون الموضوع 5 أحرف على الأقل',
    categoryValidation: 'يرجى اختيار فئة',
    descriptionValidation: 'يجب أن يكون الوصف 10 أحرف على الأقل',
    ticketCreatedSuccessDesc: 'تم إنشاء تذكرة الدعم الخاصة بك بنجاح',
    failedToCreateTicket: 'فشل إنشاء التذكرة',
    failedToSendMessage: 'فشل إرسال الرسالة',
    ticketStatusUpdatedDesc: 'تم تحديث حالة التذكرة',
    failedToUpdateStatus: 'فشل تحديث الحالة',
    categoryBugReport: 'تقرير خطأ',
    categoryGeneralQuestion: 'سؤال عام',
    viewChat: 'عرض المحادثة',
    ticketNotFound: 'التذكرة غير موجودة',
    markInProgress: 'وضع علامة قيد التنفيذ',
    markResolved: 'وضع علامة محلولة',
    closeTicket: 'إغلاق التذكرة',
    ticketClosedMessage: 'هذه التذكرة مغلقة ولا تقبل رسائل جديدة',
    noTicketsYet: 'لا توجد تذاكر دعم بعد. قم بإنشاء واحدة للبدء!',
    createFirstTicket: 'أنشئ تذكرتك الأولى',
    noTicketsWithStatus: 'لم يتم العثور على تذاكر بهذه الحالة',
    createTicketDialogDesc: 'صف مشكلتك وسيساعدك فريق الدعم لدينا',
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
    shopTitle: 'المتجر',
    shopDescription: 'إدارة رواتب الموظفين ومصاريف المتجر',
    employeeSalaries: 'رواتب الموظفين',
    manageSalaries: 'إدارة دفعات ومحاضر الرواتب للموظفين',
    monthlySalary: 'الراتب الشهري',
    paid: 'مدفوع',
    notes: 'ملاحظات',
    salaryFormDescription: 'أدخل معلومات راتب الموظف',
    paidSalaries: 'الرواتب المدفوعة',
    pendingSalaries: 'الرواتب المعلقة',
    searchSalaries: 'البحث عن الرواتب حسب اسم الموظف أو المنصب...',
    noSalaries: 'لا توجد رواتب',
    salaryAdded: 'تمت إضافة الراتب بنجاح',
    salaryUpdated: 'تم تحديث الراتب بنجاح',
    salaryDeleted: 'تم حذف الراتب بنجاح',
    salaryError: 'خطأ في معالجة الراتب',
    manageBills: 'إدارة فواتير ومصاريف المتجر',
    internet: 'إنترنت',
    maintenance: 'صيانة',
    billFormDescription: 'أدخل معلومات الفاتورة',
    paidBills: 'الفواتير المدفوعة',
    pendingBills: 'الفواتير المعلقة',
    overdue: 'متأخر',
    searchBills: 'البحث عن الفواتير حسب النوع أو الوصف...',
    paymentPeriod: 'فترة الدفع',
    oneTime: 'دفعة واحدة',
    weekly: 'أسبوعي',
    monthly: 'شهري',
    quarterly: 'ربع سنوي (1/4 سنة)',
    semiAnnually: 'نصف سنوي (1/2 سنة)',
    yearly: 'سنوي',
    foundational: 'أساسي',
    noBills: 'لا توجد فواتير',
    billAdded: 'تمت إضافة الفاتورة بنجاح',
    billUpdated: 'تم تحديث الفاتورة بنجاح',
    billDeleted: 'تم حذف الفاتورة بنجاح',
    billError: 'خطأ في معالجة الفاتورة',
    currency: 'ريال',
    saving: 'جاري الحفظ...',
    
    // Bills Page
    bills: 'الفواتير',
    sar: 'ريال',
    archived: 'مؤرشف',
    yes: 'نعم',
    no: 'لا',
    exportedSuccessfully: 'تم التصدير بنجاح',
    exportToExcel: 'تصدير إلى Excel',
    filters: 'الفلاتر',
    filterBills: 'تصفية الفواتير حسب معايير مختلفة',
    all: 'الكل',
    startDate: 'تاريخ البدء',
    endDate: 'تاريخ الانتهاء',
    hideArchived: 'إخفاء المؤرشف',
    showArchived: 'إظهار المؤرشف',
    billsList: 'قائمة الفواتير',
    billsFound: 'فاتورة موجودة',
    noBillsFound: 'لم يتم العثور على فواتير',
    actions: 'الإجراءات',
    unarchive: 'إلغاء الأرشفة',
    archive: 'أرشفة',
    somethingWentWrong: 'حدث خطأ ما',
    
    // Toast Messages & Notifications
    procurementCreated: 'تم إنشاء عنصر المشتريات بنجاح',
    procurementUpdated: 'تم تحديث عنصر المشتريات بنجاح',
    procurementDeleted: 'تم حذف عنصر المشتريات بنجاح',
    orderCompleted: 'تم إكمال الطلب بنجاح',
    orderCompletedDesc: 'تم تقديم الطلب وإنشاء الفاتورة',
    failedToLogout: 'فشل تسجيل الخروج. يرجى المحاولة مرة أخرى.',
    failedToCreateBranch: 'فشل إنشاء الفرع',
    failedToUpdateBranch: 'فشل تحديث الفرع',
    failedToCreateCustomer: 'فشل إنشاء العميل',
    failedToUpdateCustomer: 'فشل تحديث العميل',
    failedToDeleteCustomer: 'فشل حذف العميل',
    failedToExportCustomers: 'فشل تصدير بيانات العملاء',
    failedToExportPDF: 'فشل تصدير PDF',
    failedToExportExcel: 'فشل تصدير Excel',
    failedToCreateDeliveryApp: 'فشل إنشاء تطبيق التوصيل',
    failedToUpdateDeliveryApp: 'فشل تحديث تطبيق التوصيل',
    failedToDeleteDeliveryApp: 'فشل حذف تطبيق التوصيل',
    failedToUpdateOrder: 'فشل تحديث الطلب',
    failedToCreateEmployee: 'فشل إنشاء الموظف',
    failedToUpdateEmployee: 'فشل تحديث الموظف',
    failedToExportFinancial: 'فشل تصدير البيانات المالية',
    exportFailed: 'فشل التصدير',
    failedToResetPassword: 'فشل إعادة تعيين كلمة المرور',
    failedToSendResetEmail: 'فشل إرسال بريد إعادة التعيين',
    failedToUpdateDevicePreference: 'فشل تحديث تفضيل الجهاز',
    failedToExportProfitability: 'فشل تصدير بيانات الربحية',
    failedToCreateAdminAccount: 'فشل إنشاء حساب المسؤول',
    failedToCreateRecipe: 'فشل إنشاء الوصفة',
    failedToUpdateRecipe: 'فشل تحديث الوصفة',
    failedToDeleteRecipe: 'فشل حذف الوصفة',
    couldNotSaveNewOrder: 'لا يمكن حفظ الطلب الجديد',
    couldNotCreateRecipe: 'لا يمكن إنشاء الوصفة',
    couldNotUpdateRecipe: 'لا يمكن تحديث الوصفة',
    couldNotDeleteRecipe: 'لا يمكن حذف الوصفة',
    failedToFetchBills: 'فشل جلب الفواتير',
    invalidResetLink: 'رابط إعادة التعيين غير صالح',
    invalidResetLinkDesc: 'رابط إعادة تعيين كلمة المرور غير صالح أو منتهي الصلاحية.',
    passwordsDontMatch: 'كلمات المرور غير متطابقة',
    passwordsDontMatchDesc: 'يرجى التأكد من تطابق كلمتي المرور.',
    passwordTooShort: 'كلمة المرور قصيرة جداً',
    passwordTooShortDesc: 'يجب أن تكون كلمة المرور 6 أحرف على الأقل.',
    passwordResetSuccessful: 'تمت إعادة تعيين كلمة المرور بنجاح',
    passwordResetSuccessfulDesc: 'يمكنك الآن تسجيل الدخول بكلمة المرور الجديدة.',
    resetEmailSent: 'تم إرسال بريد إعادة التعيين',
    resetEmailSentDesc: 'تحقق من بريدك الإلكتروني للحصول على تعليمات إعادة تعيين كلمة المرور.',
    resetPasswordDesc: 'أدخل كلمة المرور الجديدة أدناه. يجب أن تكون 6 أحرف على الأقل.',
    forgotPasswordDesc: 'أدخل عنوان بريدك الإلكتروني وسنرسل لك تعليمات إعادة تعيين كلمة المرور.',
    pleaseTryAgainOrRequestNew: 'يرجى المحاولة مرة أخرى أو طلب رابط إعادة تعيين جديد.',
    pleaseTryAgainLater: 'يرجى المحاولة مرة أخرى لاحقاً.',
    
    // Additional Pages
    deliveryProfitability: 'ربحية التوصيل',
    salesComparison: 'مقارنة المبيعات',
    
    // Welcome Video Slides
    videoSlide1Title: 'تعرف على أحمد - صاحب مطعم',
    videoSlide1Subtitle: 'يعاني من المخزون اليدوي، الطلبات المفقودة، وانخفاض الأرباح',
    videoSlide2Title: 'نظام نقطة بيع فوري',
    videoSlide2Subtitle: 'معالجة الطلبات فورياً • تتبع المبيعات مباشرة • قبول طرق دفع متعددة',
    videoSlide3Title: 'إدارة مخزون ذكية',
    videoSlide3Subtitle: 'خصم تلقائي للمخزون • تنبيهات المخزون المنخفض • لن تنفد المكونات أبداً',
    videoSlide4Title: 'فواتير متوافقة مع الزكاة',
    videoSlide4Subtitle: 'إنشاء فواتير ثنائية اللغة فورياً • رموز QR • امتثال كامل للضرائب',
    videoSlide5Title: 'لوحة تحليلات قوية',
    videoSlide5Subtitle: 'تتبع الربحية • توقع الطلب • اتخاذ قرارات مدعومة بالبيانات',
    videoSlide6Title: 'قصة نجاح أحمد',
    videoSlide6Subtitle: '300% نمو في الإيرادات • 5 فروع جديدة • انضم لآلاف المطاعم المزدهرة',
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
    supportAndHelp: '支持与帮助',
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
    
    // Delivery Apps
    deliveryApps: 'Delivery Apps',
    addDeliveryApp: 'Add Delivery App',
    editDeliveryApp: 'Edit Delivery App',
    deleteDeliveryApp: 'Delete Delivery App',
    commission: 'Commission %',
    bankingFees: 'Banking Fees %',
    subsidy: 'Subsidy (SAR)',
    posFees: 'POS Fees (SAR)',
    netEarningsCalculator: 'Net Earnings Calculator',
    orderAmount: 'Order Amount',
    grossAmount: 'Gross Amount',
    afterCommission: 'After Commission',
    afterBankingFees: 'After Banking Fees',
    afterSubsidy: 'After Subsidy',
    afterPosFees: 'After POS Fees',
    netEarnings: 'Net Earnings',
    calculationExample: 'Calculation Example',
    testOrderAmount: 'Test Order Amount',
    enterCommission: 'Enter commission percentage',
    enterBankingFees: 'Enter banking fees percentage',
    enterSubsidy: 'Enter subsidy amount in SAR',
    enterPosFees: 'Enter POS fees in SAR',
    
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
    
    // Notifications
    newOrder: '新订单',
    orderUpdated: '订单已更新',
    branch: '分店',
    items: '项目',
    
    // Menu
    price: '价格',
    basePrice: '基础价格',
    vatAmount: '税额',
    discount: '折扣',
    discountPercentage: '折扣 %',
    description: '描述',
    available: '可用',
    unavailable: '不可用',
    
    // Add-ons
    addons: '附加项',
    addon: '附加项',
    addAddon: '添加附加项',
    editAddon: '编辑附加项',
    deleteAddon: '删除附加项',
    addonName: '附加项名称',
    addonCategory: '附加项类别',
    addonPrice: '附加项价格',
    selectAddons: '选择附加项',
    availableAddons: '可用附加项',
    selectedAddons: '已选附加项',
    noAddonsAvailable: '无可用附加项',
    addonAdded: '附加项添加成功',
    addonUpdated: '附加项更新成功',
    addonDeleted: '附加项删除成功',
    
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
    
    // Account & Device Preference
    accountAndDevicePreference: '账户和设备偏好',
    accountAndDevicePreferenceDesc: '选择您的设备类型以优化界面布局',
    account: '账户',
    roleAndStatus: '角色和状态',
    devicePreference: '设备偏好',
    laptop: '笔记本电脑',
    ipad: 'iPad',
    iphone: 'iPhone',
    laptopDesc: '完整的桌面体验，具有所有功能',
    ipadDesc: '平板优化布局，具有触摸友好控件',
    iphoneDesc: '紧凑的移动布局，适用于智能手机',
    deviceLayoutNote: '应用程序布局将自动调整以匹配您选择的设备，以获得最佳体验。',
    devicePreferenceUpdated: '设备偏好已更新为',
    
    // Menu Item Management
    menuItemCreated: '菜单项已创建',
    menuItemCreatedDesc: '菜单项已成功添加',
    menuItemUpdated: '菜单项已更新',
    menuItemUpdatedDesc: '菜单项已成功更新',
    menuItemDeleted: '菜单项已删除',
    menuItemDeletedDesc: '菜单项已成功移除',
    failedToCreateMenuItem: '创建菜单项失败',
    failedToUpdateMenuItem: '更新菜单项失败',
    failedToDeleteMenuItem: '删除菜单项失败',
    deleteMenuItemTitle: '删除菜单项',
    deleteMenuItemConfirm: '您确定要删除此项吗？此操作无法撤消。',
    itemNameRequired: '项目名称为必填项',
    categoryRequired: '类别为必填项',
    priceRequired: '价格为必填项',
    descriptionRequired: '描述为必填项',
    discountRange: '折扣必须在 0 到 100 之间',
    stockNoRequired: '未选择配方时，库存编号为必填项',
    itemDescription: '项目描述',
    itemImage: '项目图片（可选）',
    itemImageHelper: '为此菜单项上传图片（最大 5MB）',
    selectRecipe: '选择配方',
    noRecipe: '无配方',
    portionSize: '份量大小',
    selectPortionSize: '选择份量大小',
    wholePortion: '全份 (1x)',
    threeQuarterPortion: '3/4 份 (0.75x)',
    halfPortion: '1/2 份 (0.5x)',
    quarterPortion: '1/4 份 (0.25x)',
    stockNumber: '库存编号',
    priceInclVAT: '价格（SAR，含增值税）',
    discountPercent: '折扣 %',
    availabilityStatus: '可用性状态已更改',
    editMenuItem: '编辑菜单项',
    addMenuItem: '添加菜单项',
    updateMenuItemDesc: '更新菜单项详情',
    createMenuItemDesc: '为您的菜单创建新项目，含增值税定价',
    updateMenuItem: '更新菜单项',
    createMenuItem: '创建菜单项',
    loadingBranches: '正在加载分店...',
    noBranchesAvailable: '没有可用的分店',
    
    // Placeholders
    enterRestaurantName: '输入餐厅名称',
    enterVatNumber: '输入税号',
    enterEmail: 'info@restaurant.com',
    enterPhone: '+966 XX XXX XXXX',
    enterAddress: '输入完整地址',
    openingTime: '开业时间',
    closingTime: '关门时间',
    enterDiscount: '输入折扣百分比 (0-100)',
    
    // Authentication
    login: '登录',
    signup: '注册',
    password: '密码',
    confirmPassword: '确认密码',
    username: '用户名',
    forgotPassword: '忘记密码',
    resetPassword: '重置密码',
    fullName: '全名',
    enterFullName: '输入您的全名',
    enterUsername: '输入您的用户名',
    chooseUsername: '选择用户名',
    enterPassword: '输入您的密码',
    choosePassword: '选择密码',
    commercialRegistration: '商业登记',
    commercialRegistrationPlaceholder: '沙特商业登记号',
    commercialRegistrationNote: '沙特阿拉伯所有餐厅企业都需要',
    subscriptionPlan: '订阅计划',
    billedMonthly: '按月计费',
    billedYearly: '按年计费',
    perMonth: '每月',
    perYear: '每年',
    manageSubscription: '管理订阅',
    manageYourSubscription: '管理您的订阅',
    upgradeModifyCancel: '升级、修改或取消您的订阅计划',
    updatePlan: '更新计划',
    cancelSubscription: '取消订阅',
    confirmCancelSubscription: '您确定要取消订阅吗？',
    currentPlanSummary: '当前计划摘要',
    current: '当前',
    role: '角色',
    numberOfBranches: '分店数量',
    subscriptionUpdated: '订阅已更新为 {plan}，包含 {branches} 个分店。更改将在下一个计费周期生效。',
    subscriptionCanceled: '已请求取消订阅。请联系客服。',
    signIn: '登录',
    signingIn: '正在登录...',
    welcomeBack: '欢迎回来！',
    loginSuccessDesc: '您已成功登录。',
    loginFailed: '登录失败',
    invalidCredentials: '用户名或密码无效',
    accountCreated: '账户已创建！',
    accountCreatedDesc: '请使用您的凭据登录。',
    signUpFailed: '注册失败',
    signUpFailedDesc: '无法创建账户',
    selectLanguage: '选择语言',
    restaurantManagementSystem: '餐厅管理系统',
    vatDisclaimer: '所有价格均包含沙特法律要求的15%增值税',
    
    // Messages
    success: '成功',
    error: '错误',
    confirmDelete: '确定要删除此项吗？',
    itemAdded: '项目添加成功',
    itemUpdated: '项目更新成功',
    itemDeleted: '项目删除成功',
    settingsUpdated: '设置更新成功',
    savingSettings: '保存中...',
    employeeCreated: '员工已创建',
    employeeUpdated: '员工已更新',
    branchCreated: '分店已创建',
    branchUpdated: '分店已更新',
    customerCreated: '客户已创建',
    customerUpdated: '客户已更新',
    customerDeleted: '客户已删除',
    recipeCreated: '食谱已创建',
    recipeUpdated: '食谱已更新',
    recipeDeleted: '食谱已删除',
    employeeCreatedDesc: '员工已成功创建',
    employeeUpdatedDesc: '员工已成功更新',
    branchCreatedDesc: '分店已成功创建',
    branchUpdatedDesc: '分店已成功更新',
    customerCreatedDesc: '客户已成功创建',
    customerUpdatedDesc: '客户已成功更新',
    customerDeletedDesc: '客户已成功删除',
    recipeCreatedDesc: '食谱已成功创建',
    recipeUpdatedDesc: '食谱已成功更新',
    recipeDeletedDesc: '食谱已成功删除',
    
    // Customer
    addCustomer: '添加客户',
    editCustomer: '编辑客户',
    newCustomer: '新客户',
    existingCustomer: '现有客户',
    selectCustomer: '选择客户',
    
    // Investors
    investors: '投资者',
    investor: '投资者',
    addInvestor: '添加投资者',
    editInvestor: '编辑投资者',
    addInvestorDesc: '添加新投资者以跟踪其收益。',
    editInvestorDesc: '更新投资者详细信息。',
    investorName: '投资者姓名',
    enterInvestorName: '输入投资者姓名',
    amountInvested: '投资金额',
    interestPercentage: '利息百分比',
    monthlyEarnings: '每月收益',
    netProfitSummary: '净利润摘要',
    netProfitDesc: '扣除所有成本后的总净利润（用于投资者收益计算）',
    manageInvestors: '管理投资者并跟踪其收益',
    searchInvestors: '搜索投资者...',
    noInvestorsFound: '未找到投资者',
    addFirstInvestor: '添加您的第一个投资者以开始',
    investorCreated: '投资者已创建',
    investorUpdated: '投资者已更新',
    investorDeleted: '投资者已删除',
    investorCreatedDesc: '新投资者已成功添加。',
    investorUpdatedDesc: '投资者详细信息已成功更新。',
    investorDeletedDesc: '投资者已成功删除。',
    failedToCreateInvestor: '创建投资者失败',
    failedToUpdateInvestor: '更新投资者失败',
    failedToDeleteInvestor: '删除投资者失败',
    createInvestor: '创建投资者',
    updateInvestor: '更新投资者',
    confirmDeleteInvestorDesc: '您确定要删除此投资者吗？此操作无法撤消。',
    interestPercentageHelp: '要赚取的净利润百分比',
    
    // Employee Management
    employeeManagement: '员工管理',
    manageEmployees: '管理员工及其信息',
    addEmployee: '添加员工',
    editEmployee: '编辑员工',
    createNewEmployee: '创建新员工',
    addNewEmployeeDesc: '向系统添加新员工',
    createEmployee: '创建员工',
    updateEmployee: '更新员工',
    updateEmployeeInfo: '更新员工信息和设置',
    searchEmployees: '按姓名、用户名、电子邮件、电话或员工编号搜索员工...',
    creating: '正在创建...',
    updating: '正在更新...',
    basic: '基本',
    recruitment: '招聘',
    vacation: '假期',
    visa: '签证',
    ticket: '机票',
    performance: '绩效',
    compliance: '合规',
    empFullName: '全名',
    empUsername: '用户名',
    empPassword: '密码',
    empEmail: '电子邮件',
    empPhone: '电话',
    newPassword: '新密码',
    leaveEmpty: '留空以保持当前',
    enterNewPassword: '输入新密码或留空',
    admin: '管理员',
    employee: '员工',
    activeStatus: '活跃状态',
    active: '活跃',
    inactive: '不活跃',
    permissions: '权限',
    employeeNumber: '员工编号',
    hireDate: '入职日期',
    recruitmentSource: '招聘来源',
    selectSource: '选择来源',
    referral: '推荐',
    jobBoard: '招聘网站',
    agency: '中介',
    walkIn: '上门',
    contractType: '合同类型',
    selectType: '选择类型',
    fullTime: '全职',
    partTime: '兼职',
    contract: '合同',
    temporary: '临时',
    probationEndDate: '试用期结束日期',
    vacationDaysTotal: '总假期天数',
    vacationDaysUsed: '已使用假期天数',
    vacationDaysRemaining: '剩余假期天数',
    daysLeft: '天剩余',
    visaNumber: '签证号码',
    visaFees: '签证费用',
    visaExpiryDate: '签证到期日',
    visaStatus: '签证状态',
    selectStatus: '选择状态',
    valid: '有效',
    expired: '已过期',
    notApplicable: '不适用',
    ticketAmount: '机票金额',
    ticketDestination: '机票目的地',
    ticketDate: '机票日期',
    ticketStatus: '机票状态',
    booked: '已预订',
    used: '已使用',
    performanceRating: '绩效评分',
    lastReviewDate: '上次审查日期',
    performanceNotes: '绩效备注',
    enterPerformanceNotes: '输入绩效备注和反馈',
    
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
    tutorialStepByStepGuide: '分步指南',
    tutorialEstimatedTime: '预计时间',
    
    
    // Support Tickets
    supportTickets: 'Support Tickets',
    supportTicketsDescription: 'Create and manage support tickets for technical assistance',
    createTicket: 'Create Ticket',
    myTickets: 'My Tickets',
    allTickets: 'All Tickets',
    ticketSubject: 'Subject',
    ticketCategory: 'Category',
    ticketPriority: 'Priority',
    ticketDescription: 'Description',
    ticketStatusOpen: 'Open',
    ticketStatusInProgress: 'In Progress',
    ticketStatusResolved: 'Resolved',
    ticketStatusClosed: 'Closed',
    priorityLow: 'Low',
    priorityMedium: 'Medium',
    priorityHigh: 'High',
    priorityUrgent: 'Urgent',
    categoryTechnical: 'Technical Issue',
    categoryBilling: 'Billing Question',
    categoryFeature: 'Feature Request',
    categoryOther: 'Other',
    sendMessage: 'Send Message',
    viewTicket: 'View Ticket',
    backToTickets: 'Back to Tickets',
    messages: 'Messages',
    noMessages: 'No messages yet. Start a conversation!',
    typeMessage: 'Type your message...',
    updateStatus: 'Update Status',
    ticketDetails: 'Ticket Details',
    lastUpdated: 'Last Updated',
    ticketCreated: 'Ticket Created',
    ticketResolved: 'Ticket Resolved',
    ticketClosed: 'Ticket Closed',
    itSupport: 'IT Support',
    you: 'You',
    enterSubject: 'Enter ticket subject',
    enterDescription: 'Describe your issue in detail',
    selectCategory: 'Select a category',
    selectPriority: 'Select priority level',
    ticketCreatedSuccess: 'Ticket created successfully',
    messageSent: 'Message sent',
    statusUpdated: 'Status updated successfully',
    filterByStatus: '按状态筛选',
    subjectValidation: '主题至少需要5个字符',
    categoryValidation: '请选择一个类别',
    descriptionValidation: '描述至少需要10个字符',
    ticketCreatedSuccessDesc: '您的支持工单已成功创建',
    failedToCreateTicket: '创建工单失败',
    failedToSendMessage: '发送消息失败',
    ticketStatusUpdatedDesc: '工单状态已更新',
    failedToUpdateStatus: '更新状态失败',
    categoryBugReport: '错误报告',
    categoryGeneralQuestion: '一般问题',
    viewChat: '查看聊天',
    ticketNotFound: '未找到工单',
    markInProgress: '标记为进行中',
    markResolved: '标记为已解决',
    closeTicket: '关闭工单',
    ticketClosedMessage: '此工单已关闭，不再接受新消息',
    noTicketsYet: '还没有支持工单。创建一个开始吧！',
    createFirstTicket: '创建您的第一张工单',
    noTicketsWithStatus: '未找到此状态的工单',
    createTicketDialogDesc: '描述您的问题，我们的支持团队将帮助您',
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
    paymentPeriod: '付款周期',
    oneTime: '一次性付款',
    weekly: '每周',
    monthly: '每月',
    quarterly: '每季度 (1/4 年)',
    semiAnnually: '每半年 (1/2 年)',
    yearly: '每年',
    foundational: '基础',
    noBills: '未找到账单',
    billAdded: '账单添加成功',
    billUpdated: '账单更新成功',
    billDeleted: '账单删除成功',
    billError: '处理账单时出错',
    currency: '沙特里亚尔',
    saving: '保存中...',
    
    // Bills Page
    bills: '账单',
    sar: '沙特里亚尔',
    archived: '已存档',
    yes: '是',
    no: '否',
    exportedSuccessfully: '导出成功',
    exportToExcel: '导出至Excel',
    filters: '筛选器',
    filterBills: '按各种条件筛选账单',
    all: '全部',
    startDate: '开始日期',
    endDate: '结束日期',
    hideArchived: '隐藏已存档',
    showArchived: '显示已存档',
    billsList: '账单列表',
    billsFound: '找到账单',
    noBillsFound: '未找到账单',
    actions: '操作',
    unarchive: '取消存档',
    archive: '存档',
    somethingWentWrong: '出了点问题',
    shopTitle: '商店',
    shopDescription: '管理员工薪资和商店费用',
    employeeSalaries: '员工薪资',
    manageSalaries: '管理员工薪资支付和记录',
    monthlySalary: '月薪',
    paid: '已支付',
    notes: '备注',
    salaryFormDescription: '输入员工薪资信息',
    paidSalaries: '已支付薪资',
    pendingSalaries: '待支付薪资',
    searchSalaries: '按员工姓名或职位搜索薪资...',
    noSalaries: '未找到薪资',
    salaryAdded: '薪资添加成功',
    salaryUpdated: '薪资更新成功',
    salaryDeleted: '薪资删除成功',
    salaryError: '处理薪资时出错',
    manageBills: '管理商店账单和费用',
    internet: '互联网',
    maintenance: '维护',
    billFormDescription: '输入账单信息',
    paidBills: '已支付账单',
    pendingBills: '待支付账单',
    overdue: '逾期',
    searchBills: '按类型或描述搜索账单...',
    
    // Toast Messages & Notifications
    procurementCreated: '采购项目创建成功',
    procurementUpdated: '采购项目更新成功',
    procurementDeleted: '采购项目删除成功',
    orderCompleted: '订单完成成功',
    orderCompletedDesc: '订单已下达并生成发票',
    failedToLogout: '登出失败，请重试。',
    failedToCreateBranch: '创建分店失败',
    failedToUpdateBranch: '更新分店失败',
    failedToCreateCustomer: '创建客户失败',
    failedToUpdateCustomer: '更新客户失败',
    failedToDeleteCustomer: '删除客户失败',
    failedToExportCustomers: '导出客户数据失败',
    failedToExportPDF: '导出PDF失败',
    failedToExportExcel: '导出Excel失败',
    failedToCreateDeliveryApp: '创建配送应用失败',
    failedToUpdateDeliveryApp: '更新配送应用失败',
    failedToDeleteDeliveryApp: '删除配送应用失败',
    failedToUpdateOrder: '更新订单失败',
    failedToCreateEmployee: '创建员工失败',
    failedToUpdateEmployee: '更新员工失败',
    failedToExportFinancial: '导出财务数据失败',
    exportFailed: '导出失败',
    failedToResetPassword: '重置密码失败',
    failedToSendResetEmail: '发送重置邮件失败',
    failedToUpdateDevicePreference: '更新设备偏好失败',
    failedToExportProfitability: '导出盈利数据失败',
    failedToCreateAdminAccount: '创建管理员账户失败',
    failedToCreateRecipe: '创建配方失败',
    failedToUpdateRecipe: '更新配方失败',
    failedToDeleteRecipe: '删除配方失败',
    couldNotSaveNewOrder: '无法保存新订单',
    couldNotCreateRecipe: '无法创建配方',
    couldNotUpdateRecipe: '无法更新配方',
    couldNotDeleteRecipe: '无法删除配方',
    failedToFetchBills: '获取账单失败',
    invalidResetLink: '无效的重置链接',
    invalidResetLinkDesc: '密码重置链接无效或已过期。',
    passwordsDontMatch: '密码不匹配',
    passwordsDontMatchDesc: '请确保两个密码相同。',
    passwordTooShort: '密码太短',
    passwordTooShortDesc: '密码必须至少6个字符。',
    passwordResetSuccessful: '密码重置成功',
    passwordResetSuccessfulDesc: '您现在可以使用新密码登录。',
    resetEmailSent: '重置邮件已发送',
    resetEmailSentDesc: '查看您的电子邮件以获取密码重置说明。',
    resetPasswordDesc: '在下面输入您的新密码。它必须至少6个字符。',
    forgotPasswordDesc: '输入您的电子邮件地址，我们将向您发送重置密码的说明。',
    pleaseTryAgainOrRequestNew: '请重试或请求新的重置链接。',
    pleaseTryAgainLater: '请稍后重试。',
    
    // Additional Pages
    
    // Welcome Video Slides
    videoSlide1Title: '认识艾哈迈德 - 餐厅老板',
    videoSlide1Subtitle: '手动库存管理困难、订单丢失、利润下降',
    videoSlide2Title: '实时收银系统',
    videoSlide2Subtitle: '即时处理订单 • 实时跟踪销售 • 接受多种支付方式',
    videoSlide3Title: '智能库存管理',
    videoSlide3Subtitle: '自动扣除库存 • 低库存警报 • 永不缺货',
    videoSlide4Title: '符合ZATCA的发票',
    videoSlide4Subtitle: '即时生成双语发票 • 二维码 • 完全符合税务',
    videoSlide5Title: '强大的分析仪表板',
    videoSlide5Subtitle: '跟踪盈利能力 • 预测需求 • 数据驱动决策',
    videoSlide6Title: '艾哈迈德的成功故事',
    videoSlide6Subtitle: '收入增长300% • 5家新分店 • 加入数千家繁荣的餐厅',
    deliveryProfitability: '配送盈利能力',
    salesComparison: '销售对比',
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
    supportAndHelp: 'Support & Hilfe',
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
    
    // Delivery Apps
    deliveryApps: 'Delivery Apps',
    addDeliveryApp: 'Add Delivery App',
    editDeliveryApp: 'Edit Delivery App',
    deleteDeliveryApp: 'Delete Delivery App',
    commission: 'Commission %',
    bankingFees: 'Banking Fees %',
    subsidy: 'Subsidy (SAR)',
    posFees: 'POS Fees (SAR)',
    netEarningsCalculator: 'Net Earnings Calculator',
    orderAmount: 'Order Amount',
    grossAmount: 'Gross Amount',
    afterCommission: 'After Commission',
    afterBankingFees: 'After Banking Fees',
    afterSubsidy: 'After Subsidy',
    afterPosFees: 'After POS Fees',
    netEarnings: 'Net Earnings',
    calculationExample: 'Calculation Example',
    testOrderAmount: 'Test Order Amount',
    enterCommission: 'Enter commission percentage',
    enterBankingFees: 'Enter banking fees percentage',
    enterSubsidy: 'Enter subsidy amount in SAR',
    enterPosFees: 'Enter POS fees in SAR',
    
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
    
    // Notifications
    newOrder: 'Neue Bestellung',
    orderUpdated: 'Bestellung Aktualisiert',
    branch: 'Filiale',
    items: 'Artikel',
    
    // Menu
    price: 'Preis',
    basePrice: 'Grundpreis',
    vatAmount: 'Mehrwertsteuerbetrag',
    discount: 'Rabatt',
    discountPercentage: 'Rabatt %',
    description: 'Beschreibung',
    available: 'Verfügbar',
    unavailable: 'Nicht verfügbar',
    
    // Add-ons
    addons: 'Zusätze',
    addon: 'Zusatz',
    addAddon: 'Zusatz hinzufügen',
    editAddon: 'Zusatz bearbeiten',
    deleteAddon: 'Zusatz löschen',
    addonName: 'Zusatzname',
    addonCategory: 'Zusatzkategorie',
    addonPrice: 'Zusatzpreis',
    selectAddons: 'Zusätze auswählen',
    availableAddons: 'Verfügbare Zusätze',
    selectedAddons: 'Ausgewählte Zusätze',
    noAddonsAvailable: 'Keine Zusätze verfügbar',
    addonAdded: 'Zusatz erfolgreich hinzugefügt',
    addonUpdated: 'Zusatz erfolgreich aktualisiert',
    addonDeleted: 'Zusatz erfolgreich gelöscht',
    
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
    
    // Account & Device Preference
    accountAndDevicePreference: 'Konto & Gerätepräferenz',
    accountAndDevicePreferenceDesc: 'Wählen Sie Ihren Gerätetyp, um das Interface-Layout zu optimieren',
    account: 'Konto',
    roleAndStatus: 'Rolle & Status',
    devicePreference: 'Gerätepräferenz',
    laptop: 'Laptop',
    ipad: 'iPad',
    iphone: 'iPhone',
    laptopDesc: 'Vollständiges Desktop-Erlebnis mit allen Funktionen',
    ipadDesc: 'Tablet-optimiertes Layout mit touchfreundlichen Bedienelementen',
    iphoneDesc: 'Kompaktes mobiles Layout für Smartphones',
    deviceLayoutNote: 'Das App-Layout wird automatisch an Ihr ausgewähltes Gerät angepasst, um die beste Erfahrung zu bieten.',
    devicePreferenceUpdated: 'Gerätepräferenz aktualisiert auf',
    
    // Menu Item Management
    menuItemCreated: 'Menüelement erstellt',
    menuItemCreatedDesc: 'Das Menüelement wurde erfolgreich hinzugefügt',
    menuItemUpdated: 'Menüelement aktualisiert',
    menuItemUpdatedDesc: 'Das Menüelement wurde erfolgreich aktualisiert',
    menuItemDeleted: 'Menüelement gelöscht',
    menuItemDeletedDesc: 'Das Menüelement wurde erfolgreich entfernt',
    failedToCreateMenuItem: 'Menüelement konnte nicht erstellt werden',
    failedToUpdateMenuItem: 'Menüelement konnte nicht aktualisiert werden',
    failedToDeleteMenuItem: 'Menüelement konnte nicht gelöscht werden',
    deleteMenuItemTitle: 'Menüelement löschen',
    deleteMenuItemConfirm: 'Sind Sie sicher, dass Sie dieses Element löschen möchten? Diese Aktion kann nicht rückgängig gemacht werden.',
    itemNameRequired: 'Elementname ist erforderlich',
    categoryRequired: 'Kategorie ist erforderlich',
    priceRequired: 'Preis ist erforderlich',
    descriptionRequired: 'Beschreibung ist erforderlich',
    discountRange: 'Rabatt muss zwischen 0 und 100 liegen',
    stockNoRequired: 'Bestandsnummer ist erforderlich, wenn kein Rezept ausgewählt ist',
    itemDescription: 'Elementbeschreibung',
    itemImage: 'Elementbild (Optional)',
    itemImageHelper: 'Laden Sie ein Bild für dieses Menüelement hoch (max. 5MB)',
    selectRecipe: 'Rezept auswählen',
    noRecipe: 'Kein Rezept',
    portionSize: 'Portionsgröße',
    selectPortionSize: 'Portionsgröße auswählen',
    wholePortion: 'Ganz (1x)',
    threeQuarterPortion: '3/4 Portion (0,75x)',
    halfPortion: '1/2 Portion (0,5x)',
    quarterPortion: '1/4 Portion (0,25x)',
    stockNumber: 'Bestandsnummer',
    priceInclVAT: 'Preis (SAR, inkl. MwSt.)',
    discountPercent: 'Rabatt %',
    availabilityStatus: 'Verfügbarkeitsstatus wurde geändert',
    editMenuItem: 'Menüelement bearbeiten',
    addMenuItem: 'Menüelement hinzufügen',
    updateMenuItemDesc: 'Menüelementdetails aktualisieren',
    createMenuItemDesc: 'Erstellen Sie ein neues Element für Ihr Menü mit MwSt.-inklusiver Preisgestaltung',
    updateMenuItem: 'Menüelement aktualisieren',
    createMenuItem: 'Menüelement erstellen',
    loadingBranches: 'Filialen werden geladen...',
    noBranchesAvailable: 'Keine Filialen verfügbar',
    
    // Placeholders
    enterRestaurantName: 'Restaurantname eingeben',
    enterVatNumber: 'Umsatzsteuer-ID eingeben',
    enterEmail: 'info@restaurant.com',
    enterPhone: '+966 XX XXX XXXX',
    enterAddress: 'Vollständige Adresse eingeben',
    openingTime: 'Öffnungszeit',
    closingTime: 'Schließzeit',
    enterDiscount: 'Rabattanteil eingeben (0-100)',
    
    // Authentication
    login: 'Anmelden',
    signup: 'Registrieren',
    password: 'Passwort',
    confirmPassword: 'Passwort bestätigen',
    username: 'Benutzername',
    forgotPassword: 'Passwort vergessen',
    resetPassword: 'Passwort zurücksetzen',
    fullName: 'Vollständiger Name',
    enterFullName: 'Geben Sie Ihren vollständigen Namen ein',
    enterUsername: 'Geben Sie Ihren Benutzernamen ein',
    chooseUsername: 'Wählen Sie einen Benutzernamen',
    enterPassword: 'Geben Sie Ihr Passwort ein',
    choosePassword: 'Wählen Sie ein Passwort',
    commercialRegistration: 'Handelsregister',
    commercialRegistrationPlaceholder: 'Saudische Handelsregisternummer',
    commercialRegistrationNote: 'Erforderlich für alle Restaurantunternehmen in Saudi-Arabien',
    subscriptionPlan: 'Abonnementplan',
    billedMonthly: 'Monatlich abgerechnet',
    billedYearly: 'Jährlich abgerechnet',
    perMonth: 'pro Monat',
    perYear: 'pro Jahr',
    manageSubscription: 'Abonnement verwalten',
    manageYourSubscription: 'Verwalten Sie Ihr Abonnement',
    upgradeModifyCancel: 'Upgrade, ändern oder kündigen Sie Ihren Abonnementplan',
    updatePlan: 'Plan aktualisieren',
    cancelSubscription: 'Abonnement kündigen',
    confirmCancelSubscription: 'Möchten Sie Ihr Abonnement wirklich kündigen?',
    currentPlanSummary: 'Zusammenfassung des aktuellen Plans',
    current: 'Aktuell',
    role: 'Rolle',
    numberOfBranches: 'Anzahl der Filialen',
    subscriptionUpdated: 'Abonnement auf {plan} mit {branches} Filialen aktualisiert. Änderungen werden im nächsten Abrechnungszyklus wirksam.',
    subscriptionCanceled: 'Abonnementkündigung angefordert. Bitte kontaktieren Sie den Support.',
    signIn: 'Anmelden',
    signingIn: 'Anmelden...',
    welcomeBack: 'Willkommen zurück!',
    loginSuccessDesc: 'Sie haben sich erfolgreich angemeldet.',
    loginFailed: 'Anmeldung fehlgeschlagen',
    invalidCredentials: 'Ungültiger Benutzername oder Passwort',
    accountCreated: 'Konto erstellt!',
    accountCreatedDesc: 'Bitte melden Sie sich mit Ihren Anmeldedaten an.',
    signUpFailed: 'Registrierung fehlgeschlagen',
    signUpFailedDesc: 'Konto konnte nicht erstellt werden',
    selectLanguage: 'Sprache wählen',
    restaurantManagementSystem: 'Restaurant-Managementsystem',
    vatDisclaimer: 'Alle Preise beinhalten 15% MwSt. gemäß saudi-arabischem Recht',
    
    // Messages
    success: 'Erfolgreich',
    error: 'Fehler',
    confirmDelete: 'Möchten Sie dieses Element wirklich löschen?',
    itemAdded: 'Element erfolgreich hinzugefügt',
    itemUpdated: 'Element erfolgreich aktualisiert',
    itemDeleted: 'Element erfolgreich gelöscht',
    settingsUpdated: 'Einstellungen erfolgreich aktualisiert',
    savingSettings: 'Speichern...',
    employeeCreated: 'Mitarbeiter erstellt',
    employeeUpdated: 'Mitarbeiter aktualisiert',
    branchCreated: 'Filiale erstellt',
    branchUpdated: 'Filiale aktualisiert',
    customerCreated: 'Kunde erstellt',
    customerUpdated: 'Kunde aktualisiert',
    customerDeleted: 'Kunde gelöscht',
    recipeCreated: 'Rezept erstellt',
    recipeUpdated: 'Rezept aktualisiert',
    recipeDeleted: 'Rezept gelöscht',
    employeeCreatedDesc: 'Der Mitarbeiter wurde erfolgreich erstellt',
    employeeUpdatedDesc: 'Der Mitarbeiter wurde erfolgreich aktualisiert',
    branchCreatedDesc: 'Die Filiale wurde erfolgreich erstellt',
    branchUpdatedDesc: 'Die Filiale wurde erfolgreich aktualisiert',
    customerCreatedDesc: 'Der Kunde wurde erfolgreich erstellt',
    customerUpdatedDesc: 'Der Kunde wurde erfolgreich aktualisiert',
    customerDeletedDesc: 'Der Kunde wurde erfolgreich gelöscht',
    recipeCreatedDesc: 'Das Rezept wurde erfolgreich erstellt',
    recipeUpdatedDesc: 'Das Rezept wurde erfolgreich aktualisiert',
    recipeDeletedDesc: 'Das Rezept wurde erfolgreich gelöscht',
    
    // Customer
    addCustomer: 'Kunde hinzufügen',
    editCustomer: 'Kunde bearbeiten',
    newCustomer: 'Neuer Kunde',
    existingCustomer: 'Bestehender Kunde',
    selectCustomer: 'Kunde auswählen',
    
    // Investors
    investors: 'Investoren',
    investor: 'Investor',
    addInvestor: 'Investor hinzufügen',
    editInvestor: 'Investor bearbeiten',
    addInvestorDesc: 'Fügen Sie einen neuen Investor hinzu, um deren Einnahmen zu verfolgen.',
    editInvestorDesc: 'Investordetails aktualisieren.',
    investorName: 'Investorname',
    enterInvestorName: 'Investorname eingeben',
    amountInvested: 'Investierte Summe',
    interestPercentage: 'Zinssatz',
    monthlyEarnings: 'Monatliche Einnahmen',
    netProfitSummary: 'Nettogewinnübersicht',
    netProfitDesc: 'Gesamtnettogewinn nach allen Kosten (wird für die Berechnung der Investoreneinnahmen verwendet)',
    manageInvestors: 'Investoren verwalten und deren Einnahmen verfolgen',
    searchInvestors: 'Investoren suchen...',
    noInvestorsFound: 'Keine Investoren gefunden',
    addFirstInvestor: 'Fügen Sie Ihren ersten Investor hinzu, um zu beginnen',
    investorCreated: 'Investor erstellt',
    investorUpdated: 'Investor aktualisiert',
    investorDeleted: 'Investor gelöscht',
    investorCreatedDesc: 'Neuer Investor wurde erfolgreich hinzugefügt.',
    investorUpdatedDesc: 'Investordetails wurden erfolgreich aktualisiert.',
    investorDeletedDesc: 'Investor wurde erfolgreich entfernt.',
    failedToCreateInvestor: 'Investor konnte nicht erstellt werden',
    failedToUpdateInvestor: 'Investor konnte nicht aktualisiert werden',
    failedToDeleteInvestor: 'Investor konnte nicht gelöscht werden',
    createInvestor: 'Investor erstellen',
    updateInvestor: 'Investor aktualisieren',
    confirmDeleteInvestorDesc: 'Möchten Sie diesen Investor wirklich löschen? Diese Aktion kann nicht rückgängig gemacht werden.',
    interestPercentageHelp: 'Prozentsatz des zu verdienenden Nettogewinns',
    
    // Employee Management
    employeeManagement: 'Mitarbeiterverwaltung',
    manageEmployees: 'Mitarbeiter und deren Informationen verwalten',
    addEmployee: 'Mitarbeiter hinzufügen',
    editEmployee: 'Mitarbeiter bearbeiten',
    createNewEmployee: 'Neuen Mitarbeiter erstellen',
    addNewEmployeeDesc: 'Einen neuen Mitarbeiter zu Ihrem System hinzufügen',
    createEmployee: 'Mitarbeiter erstellen',
    updateEmployee: 'Mitarbeiter aktualisieren',
    updateEmployeeInfo: 'Mitarbeiterinformationen und Einstellungen aktualisieren',
    searchEmployees: 'Mitarbeiter nach Name, Benutzername, E-Mail, Telefon oder Mitarbeiternummer suchen...',
    creating: 'Wird erstellt...',
    updating: 'Wird aktualisiert...',
    basic: 'Grundlegend',
    recruitment: 'Rekrutierung',
    vacation: 'Urlaub',
    visa: 'Visum',
    ticket: 'Ticket',
    performance: 'Leistung',
    compliance: 'Compliance',
    empFullName: 'Vollständiger Name',
    empUsername: 'Benutzername',
    empPassword: 'Passwort',
    empEmail: 'E-Mail',
    empPhone: 'Telefon',
    newPassword: 'Neues Passwort',
    leaveEmpty: 'leer lassen, um aktuelles zu behalten',
    enterNewPassword: 'Neues Passwort eingeben oder leer lassen',
    admin: 'Administrator',
    employee: 'Mitarbeiter',
    activeStatus: 'Aktiver Status',
    active: 'Aktiv',
    inactive: 'Inaktiv',
    permissions: 'Berechtigungen',
    employeeNumber: 'Mitarbeiternummer',
    hireDate: 'Einstellungsdatum',
    recruitmentSource: 'Rekrutierungsquelle',
    selectSource: 'Quelle auswählen',
    referral: 'Empfehlung',
    jobBoard: 'Jobbörse',
    agency: 'Agentur',
    walkIn: 'Laufkundschaft',
    contractType: 'Vertragsart',
    selectType: 'Art auswählen',
    fullTime: 'Vollzeit',
    partTime: 'Teilzeit',
    contract: 'Vertrag',
    temporary: 'Befristet',
    probationEndDate: 'Probezeit-Enddatum',
    vacationDaysTotal: 'Gesamte Urlaubstage',
    vacationDaysUsed: 'Verwendete Urlaubstage',
    vacationDaysRemaining: 'Verbleibende Urlaubstage',
    daysLeft: 'Tage übrig',
    visaNumber: 'Visumnummer',
    visaFees: 'Visumgebühren',
    visaExpiryDate: 'Visumablaufdatum',
    visaStatus: 'Visumstatus',
    selectStatus: 'Status auswählen',
    valid: 'Gültig',
    expired: 'Abgelaufen',
    notApplicable: 'Nicht anwendbar',
    ticketAmount: 'Ticketbetrag',
    ticketDestination: 'Ticketziel',
    ticketDate: 'Ticketdatum',
    ticketStatus: 'Ticketstatus',
    booked: 'Gebucht',
    used: 'Verwendet',
    performanceRating: 'Leistungsbewertung',
    lastReviewDate: 'Letztes Überprüfungsdatum',
    performanceNotes: 'Leistungsnotizen',
    enterPerformanceNotes: 'Leistungsnotizen und Feedback eingeben',
    
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
    tutorialStepByStepGuide: 'Schritt-für-Schritt-Anleitung',
    tutorialEstimatedTime: 'Geschätzte Zeit',
    
    
    // Support Tickets
    supportTickets: 'Support Tickets',
    supportTicketsDescription: 'Create and manage support tickets for technical assistance',
    createTicket: 'Create Ticket',
    myTickets: 'My Tickets',
    allTickets: 'All Tickets',
    ticketSubject: 'Subject',
    ticketCategory: 'Category',
    ticketPriority: 'Priority',
    ticketDescription: 'Description',
    ticketStatusOpen: 'Open',
    ticketStatusInProgress: 'In Progress',
    ticketStatusResolved: 'Resolved',
    ticketStatusClosed: 'Closed',
    priorityLow: 'Low',
    priorityMedium: 'Medium',
    priorityHigh: 'High',
    priorityUrgent: 'Urgent',
    categoryTechnical: 'Technical Issue',
    categoryBilling: 'Billing Question',
    categoryFeature: 'Feature Request',
    categoryOther: 'Other',
    sendMessage: 'Send Message',
    viewTicket: 'View Ticket',
    backToTickets: 'Back to Tickets',
    messages: 'Messages',
    noMessages: 'No messages yet. Start a conversation!',
    typeMessage: 'Type your message...',
    updateStatus: 'Update Status',
    ticketDetails: 'Ticket Details',
    lastUpdated: 'Last Updated',
    ticketCreated: 'Ticket Created',
    ticketResolved: 'Ticket Resolved',
    ticketClosed: 'Ticket Closed',
    itSupport: 'IT Support',
    you: 'You',
    enterSubject: 'Enter ticket subject',
    enterDescription: 'Describe your issue in detail',
    selectCategory: 'Select a category',
    selectPriority: 'Select priority level',
    ticketCreatedSuccess: 'Ticket created successfully',
    messageSent: 'Message sent',
    statusUpdated: 'Status updated successfully',
    filterByStatus: 'Nach Status filtern',
    subjectValidation: 'Betreff muss mindestens 5 Zeichen lang sein',
    categoryValidation: 'Bitte wählen Sie eine Kategorie',
    descriptionValidation: 'Beschreibung muss mindestens 10 Zeichen lang sein',
    ticketCreatedSuccessDesc: 'Ihr Support-Ticket wurde erfolgreich erstellt',
    failedToCreateTicket: 'Ticket konnte nicht erstellt werden',
    failedToSendMessage: 'Nachricht konnte nicht gesendet werden',
    ticketStatusUpdatedDesc: 'Ticket-Status wurde aktualisiert',
    failedToUpdateStatus: 'Status konnte nicht aktualisiert werden',
    categoryBugReport: 'Fehlerbericht',
    categoryGeneralQuestion: 'Allgemeine Frage',
    viewChat: 'Chat anzeigen',
    ticketNotFound: 'Ticket nicht gefunden',
    markInProgress: 'Als in Bearbeitung markieren',
    markResolved: 'Als gelöst markieren',
    closeTicket: 'Ticket schließen',
    ticketClosedMessage: 'Dieses Ticket ist geschlossen und akzeptiert keine neuen Nachrichten mehr',
    noTicketsYet: 'Noch keine Support-Tickets. Erstellen Sie eines, um loszulegen!',
    createFirstTicket: 'Erstellen Sie Ihr erstes Ticket',
    noTicketsWithStatus: 'Keine Tickets mit diesem Status gefunden',
    createTicketDialogDesc: 'Beschreiben Sie Ihr Problem und unser Support-Team wird Ihnen helfen',
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
    shopTitle: 'Geschäft',
    shopDescription: 'Mitarbeitergehälter und Geschäftsausgaben verwalten',
    employeeSalaries: 'Mitarbeitergehälter',
    manageSalaries: 'Gehaltszahlungen und -aufzeichnungen von Mitarbeitern verwalten',
    monthlySalary: 'Monatsgehalt',
    paid: 'Bezahlt',
    notes: 'Notizen',
    salaryFormDescription: 'Mitarbeitergehaltsinformationen eingeben',
    paidSalaries: 'Bezahlte Gehälter',
    pendingSalaries: 'Ausstehende Gehälter',
    searchSalaries: 'Gehälter nach Mitarbeitername oder Position suchen...',
    noSalaries: 'Keine Gehälter gefunden',
    salaryAdded: 'Gehalt erfolgreich hinzugefügt',
    salaryUpdated: 'Gehalt erfolgreich aktualisiert',
    salaryDeleted: 'Gehalt erfolgreich gelöscht',
    salaryError: 'Fehler bei der Verarbeitung des Gehalts',
    manageBills: 'Geschäftsrechnungen und -ausgaben verwalten',
    internet: 'Internet',
    maintenance: 'Wartung',
    billFormDescription: 'Rechnungsinformationen eingeben',
    paidBills: 'Bezahlte Rechnungen',
    pendingBills: 'Ausstehende Rechnungen',
    overdue: 'Überfällig',
    searchBills: 'Rechnungen nach Typ oder Beschreibung suchen...',
    paymentPeriod: 'Zahlungszeitraum',
    oneTime: 'Einmalige Zahlung',
    weekly: 'Wöchentlich',
    monthly: 'Monatlich',
    quarterly: 'Vierteljährlich (1/4 Jahr)',
    semiAnnually: 'Halbjährlich (1/2 Jahr)',
    yearly: 'Jährlich',
    foundational: 'Grundlegend',
    noBills: 'Keine Rechnungen gefunden',
    billAdded: 'Rechnung erfolgreich hinzugefügt',
    billUpdated: 'Rechnung erfolgreich aktualisiert',
    billDeleted: 'Rechnung erfolgreich gelöscht',
    billError: 'Fehler bei der Verarbeitung der Rechnung',
    currency: 'SAR',
    saving: 'Wird gespeichert...',
    
    // Bills Page
    bills: 'Rechnungen',
    sar: 'SAR',
    archived: 'Archiviert',
    yes: 'Ja',
    no: 'Nein',
    exportedSuccessfully: 'Erfolgreich exportiert',
    exportToExcel: 'Nach Excel exportieren',
    filters: 'Filter',
    filterBills: 'Rechnungen nach verschiedenen Kriterien filtern',
    all: 'Alle',
    startDate: 'Startdatum',
    endDate: 'Enddatum',
    hideArchived: 'Archivierte ausblenden',
    showArchived: 'Archivierte anzeigen',
    billsList: 'Rechnungsliste',
    billsFound: 'Rechnungen gefunden',
    noBillsFound: 'Keine Rechnungen gefunden',
    actions: 'Aktionen',
    unarchive: 'Aus Archiv holen',
    archive: 'Archivieren',
    somethingWentWrong: 'Etwas ist schief gelaufen',
    
    // Toast Messages & Notifications
    procurementCreated: 'Beschaffungsartikel erfolgreich erstellt',
    procurementUpdated: 'Beschaffungsartikel erfolgreich aktualisiert',
    procurementDeleted: 'Beschaffungsartikel erfolgreich gelöscht',
    orderCompleted: 'Bestellung erfolgreich abgeschlossen',
    orderCompletedDesc: 'Bestellung wurde aufgegeben und Rechnung erstellt',
    failedToLogout: 'Abmeldung fehlgeschlagen. Bitte versuchen Sie es erneut.',
    failedToCreateBranch: 'Filiale konnte nicht erstellt werden',
    failedToUpdateBranch: 'Filiale konnte nicht aktualisiert werden',
    failedToCreateCustomer: 'Kunde konnte nicht erstellt werden',
    failedToUpdateCustomer: 'Kunde konnte nicht aktualisiert werden',
    failedToDeleteCustomer: 'Kunde konnte nicht gelöscht werden',
    failedToExportCustomers: 'Kundendaten konnten nicht exportiert werden',
    failedToExportPDF: 'PDF konnte nicht exportiert werden',
    failedToExportExcel: 'Excel konnte nicht exportiert werden',
    failedToCreateDeliveryApp: 'Lieferapp konnte nicht erstellt werden',
    failedToUpdateDeliveryApp: 'Lieferapp konnte nicht aktualisiert werden',
    failedToDeleteDeliveryApp: 'Lieferapp konnte nicht gelöscht werden',
    failedToUpdateOrder: 'Bestellung konnte nicht aktualisiert werden',
    failedToCreateEmployee: 'Mitarbeiter konnte nicht erstellt werden',
    failedToUpdateEmployee: 'Mitarbeiter konnte nicht aktualisiert werden',
    failedToExportFinancial: 'Finanzdaten konnten nicht exportiert werden',
    exportFailed: 'Export fehlgeschlagen',
    failedToResetPassword: 'Passwort konnte nicht zurückgesetzt werden',
    failedToSendResetEmail: 'Reset-E-Mail konnte nicht gesendet werden',
    failedToUpdateDevicePreference: 'Geräteeinstellung konnte nicht aktualisiert werden',
    failedToExportProfitability: 'Rentabilitätsdaten konnten nicht exportiert werden',
    failedToCreateAdminAccount: 'Administratorkonto konnte nicht erstellt werden',
    failedToCreateRecipe: 'Rezept konnte nicht erstellt werden',
    failedToUpdateRecipe: 'Rezept konnte nicht aktualisiert werden',
    failedToDeleteRecipe: 'Rezept konnte nicht gelöscht werden',
    couldNotSaveNewOrder: 'Neue Bestellung konnte nicht gespeichert werden',
    couldNotCreateRecipe: 'Rezept konnte nicht erstellt werden',
    couldNotUpdateRecipe: 'Rezept konnte nicht aktualisiert werden',
    couldNotDeleteRecipe: 'Rezept konnte nicht gelöscht werden',
    failedToFetchBills: 'Rechnungen konnten nicht abgerufen werden',
    invalidResetLink: 'Ungültiger Reset-Link',
    invalidResetLinkDesc: 'Der Passwort-Reset-Link ist ungültig oder abgelaufen.',
    
    // Welcome Video Slides
    videoSlide1Title: 'Lernen Sie Ahmad kennen - Restaurantbesitzer',
    videoSlide1Subtitle: 'Kämpft mit manueller Bestandsverwaltung, verlorenen Bestellungen und sinkenden Gewinnen',
    videoSlide2Title: 'Echtzeit-Kassensystem',
    videoSlide2Subtitle: 'Sofortige Bestellabwicklung • Live-Verkaufsverfolgung • Mehrere Zahlungsmethoden',
    videoSlide3Title: 'Intelligente Bestandsverwaltung',
    videoSlide3Subtitle: 'Automatischer Lagerabzug • Warnungen bei niedrigem Bestand • Nie mehr ohne Zutaten',
    videoSlide4Title: 'ZATCA-konforme Rechnungen',
    videoSlide4Subtitle: 'Sofortige zweisprachige Rechnungen • QR-Codes • Vollständige Steuerkonformität',
    videoSlide5Title: 'Leistungsstarkes Analyse-Dashboard',
    videoSlide5Subtitle: 'Rentabilität verfolgen • Nachfrage prognostizieren • Datengestützte Entscheidungen',
    videoSlide6Title: 'Ahmads Erfolgsgeschichte',
    videoSlide6Subtitle: '300% Umsatzwachstum • 5 neue Filialen • Schließen Sie sich Tausenden erfolgreichen Restaurants an',
    passwordsDontMatch: 'Passwörter stimmen nicht überein',
    passwordsDontMatchDesc: 'Bitte stellen Sie sicher, dass beide Passwörter gleich sind.',
    passwordTooShort: 'Passwort zu kurz',
    passwordTooShortDesc: 'Das Passwort muss mindestens 6 Zeichen lang sein.',
    passwordResetSuccessful: 'Passwort erfolgreich zurückgesetzt',
    passwordResetSuccessfulDesc: 'Sie können sich jetzt mit Ihrem neuen Passwort anmelden.',
    resetEmailSent: 'Reset-E-Mail gesendet',
    resetEmailSentDesc: 'Überprüfen Sie Ihre E-Mail für Anweisungen zum Zurücksetzen des Passworts.',
    resetPasswordDesc: 'Geben Sie unten Ihr neues Passwort ein. Es muss mindestens 6 Zeichen lang sein.',
    forgotPasswordDesc: 'Geben Sie Ihre E-Mail-Adresse ein und wir senden Ihnen Anweisungen zum Zurücksetzen Ihres Passworts.',
    pleaseTryAgainOrRequestNew: 'Bitte versuchen Sie es erneut oder fordern Sie einen neuen Reset-Link an.',
    pleaseTryAgainLater: 'Bitte versuchen Sie es später erneut.',
    
    // Additional Pages
    deliveryProfitability: 'Lieferrentabilität',
    salesComparison: 'Verkaufsvergleich',
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
    supportAndHelp: 'सहायता और मदद',
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
    
    // Delivery Apps
    deliveryApps: 'Delivery Apps',
    addDeliveryApp: 'Add Delivery App',
    editDeliveryApp: 'Edit Delivery App',
    deleteDeliveryApp: 'Delete Delivery App',
    commission: 'Commission %',
    bankingFees: 'Banking Fees %',
    subsidy: 'Subsidy (SAR)',
    posFees: 'POS Fees (SAR)',
    netEarningsCalculator: 'Net Earnings Calculator',
    orderAmount: 'Order Amount',
    grossAmount: 'Gross Amount',
    afterCommission: 'After Commission',
    afterBankingFees: 'After Banking Fees',
    afterSubsidy: 'After Subsidy',
    afterPosFees: 'After POS Fees',
    netEarnings: 'Net Earnings',
    calculationExample: 'Calculation Example',
    testOrderAmount: 'Test Order Amount',
    enterCommission: 'Enter commission percentage',
    enterBankingFees: 'Enter banking fees percentage',
    enterSubsidy: 'Enter subsidy amount in SAR',
    enterPosFees: 'Enter POS fees in SAR',
    
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
    
    // Notifications
    newOrder: 'नया ऑर्डर',
    orderUpdated: 'ऑर्डर अपडेट',
    branch: 'शाखा',
    items: 'आइटम',
    
    // Menu
    price: 'कीमत',
    basePrice: 'मूल कीमत',
    vatAmount: 'वैट राशि',
    discount: 'छूट',
    discountPercentage: 'छूट %',
    description: 'विवरण',
    available: 'उपलब्ध',
    unavailable: 'अनुपलब्ध',
    
    // Add-ons
    addons: 'ऐड-ऑन',
    addon: 'ऐड-ऑन',
    addAddon: 'ऐड-ऑन जोड़ें',
    editAddon: 'ऐड-ऑन संपादित करें',
    deleteAddon: 'ऐड-ऑन हटाएं',
    addonName: 'ऐड-ऑन नाम',
    addonCategory: 'ऐड-ऑन श्रेणी',
    addonPrice: 'ऐड-ऑन कीमत',
    selectAddons: 'ऐड-ऑन चुनें',
    availableAddons: 'उपलब्ध ऐड-ऑन',
    selectedAddons: 'चयनित ऐड-ऑन',
    noAddonsAvailable: 'कोई ऐड-ऑन उपलब्ध नहीं',
    addonAdded: 'ऐड-ऑन सफलतापूर्वक जोड़ा गया',
    addonUpdated: 'ऐड-ऑन सफलतापूर्वक अपडेट किया गया',
    addonDeleted: 'ऐड-ऑन सफलतापूर्वक हटाया गया',
    
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
    
    // Account & Device Preference
    accountAndDevicePreference: 'खाता और डिवाइस वरीयता',
    accountAndDevicePreferenceDesc: 'इंटरफेस लेआउट को अनुकूलित करने के लिए अपनी डिवाइस प्रकार चुनें',
    account: 'खाता',
    roleAndStatus: 'भूमिका और स्थिति',
    devicePreference: 'डिवाइस वरीयता',
    laptop: 'लैपटॉप',
    ipad: 'आईपैड',
    iphone: 'आईफोन',
    laptopDesc: 'सभी सुविधाओं के साथ पूर्ण डेस्कटॉप अनुभव',
    ipadDesc: 'टच-फ्रेंडली नियंत्रणों के साथ टैबलेट-अनुकूलित लेआउट',
    iphoneDesc: 'स्मार्टफोन के लिए कॉम्पैक्ट मोबाइल लेआउट',
    deviceLayoutNote: 'ऐप लेआउट स्वचालित रूप से आपके चयनित डिवाइस से मेल खाने के लिए समायोजित होगा ताकि सर्वोत्तम अनुभव मिल सके।',
    devicePreferenceUpdated: 'डिवाइस वरीयता अपडेट की गई',
    
    // Menu Item Management
    menuItemCreated: 'मेनू आइटम बनाया गया',
    menuItemCreatedDesc: 'मेनू आइटम सफलतापूर्वक जोड़ा गया है',
    menuItemUpdated: 'मेनू आइटम अपडेट किया गया',
    menuItemUpdatedDesc: 'मेनू आइटम सफलतापूर्वक अपडेट किया गया है',
    menuItemDeleted: 'मेनू आइटम हटाया गया',
    menuItemDeletedDesc: 'मेनू आइटम सफलतापूर्वक हटाया गया है',
    failedToCreateMenuItem: 'मेनू आइटम बनाने में विफल',
    failedToUpdateMenuItem: 'मेनू आइटम अपडेट करने में विफल',
    failedToDeleteMenuItem: 'मेनू आइटम हटाने में विफल',
    deleteMenuItemTitle: 'मेनू आइटम हटाएं',
    deleteMenuItemConfirm: 'क्या आप सुनिश्चित हैं कि आप इस आइटम को हटाना चाहते हैं? इस क्रिया को पूर्ववत नहीं किया जा सकता।',
    itemNameRequired: 'आइटम का नाम आवश्यक है',
    categoryRequired: 'श्रेणी आवश्यक है',
    priceRequired: 'कीमत आवश्यक है',
    descriptionRequired: 'विवरण आवश्यक है',
    discountRange: 'छूट 0 से 100 के बीच होनी चाहिए',
    stockNoRequired: 'जब कोई रेसिपी चयनित नहीं है तो स्टॉक नंबर आवश्यक है',
    itemDescription: 'आइटम विवरण',
    itemImage: 'आइटम छवि (वैकल्पिक)',
    itemImageHelper: 'इस मेनू आइटम के लिए एक छवि अपलोड करें (अधिकतम 5MB)',
    selectRecipe: 'रेसिपी चुनें',
    noRecipe: 'कोई रेसिपी नहीं',
    portionSize: 'भाग का आकार',
    selectPortionSize: 'भाग का आकार चुनें',
    wholePortion: 'पूर्ण (1x)',
    threeQuarterPortion: '3/4 भाग (0.75x)',
    halfPortion: '1/2 भाग (0.5x)',
    quarterPortion: '1/4 भाग (0.25x)',
    stockNumber: 'स्टॉक नंबर',
    priceInclVAT: 'कीमत (SAR, VAT सहित)',
    discountPercent: 'छूट %',
    availabilityStatus: 'उपलब्धता स्थिति बदल दी गई है',
    editMenuItem: 'मेनू आइटम संपादित करें',
    addMenuItem: 'मेनू आइटम जोड़ें',
    updateMenuItemDesc: 'मेनू आइटम विवरण अपडेट करें',
    createMenuItemDesc: 'VAT-सम्मिलित मूल्य निर्धारण के साथ अपने मेनू के लिए एक नया आइटम बनाएं',
    updateMenuItem: 'मेनू आइटम अपडेट करें',
    createMenuItem: 'मेनू आइटम बनाएं',
    loadingBranches: 'शाखाएं लोड हो रही हैं...',
    noBranchesAvailable: 'कोई शाखाएं उपलब्ध नहीं हैं',
    
    // Placeholders
    enterRestaurantName: 'रेस्तरां का नाम दर्ज करें',
    enterVatNumber: 'वैट नंबर दर्ज करें',
    enterEmail: 'info@restaurant.com',
    enterPhone: '+966 XX XXX XXXX',
    enterAddress: 'पूरा पता दर्ज करें',
    openingTime: 'खुलने का समय',
    closingTime: 'बंद होने का समय',
    enterDiscount: 'छूट प्रतिशत दर्ज करें (0-100)',
    
    // Authentication
    login: 'लॉगिन',
    signup: 'साइन अप',
    password: 'पासवर्ड',
    confirmPassword: 'पासवर्ड की पुष्टि करें',
    username: 'उपयोगकर्ता नाम',
    forgotPassword: 'पासवर्ड भूल गए',
    resetPassword: 'पासवर्ड रीसेट करें',
    fullName: 'पूरा नाम',
    enterFullName: 'अपना पूरा नाम दर्ज करें',
    enterUsername: 'अपना उपयोगकर्ता नाम दर्ज करें',
    chooseUsername: 'उपयोगकर्ता नाम चुनें',
    enterPassword: 'अपना पासवर्ड दर्ज करें',
    choosePassword: 'पासवर्ड चुनें',
    commercialRegistration: 'व्यावसायिक पंजीकरण',
    commercialRegistrationPlaceholder: 'सऊदी व्यावसायिक पंजीकरण संख्या',
    commercialRegistrationNote: 'सऊदी अरब में सभी रेस्तरां व्यवसायों के लिए आवश्यक',
    subscriptionPlan: 'सदस्यता योजना',
    billedMonthly: 'मासिक बिल',
    billedYearly: 'वार्षिक बिल',
    perMonth: 'प्रति माह',
    perYear: 'प्रति वर्ष',
    manageSubscription: 'सदस्यता प्रबंधित करें',
    manageYourSubscription: 'अपनी सदस्यता प्रबंधित करें',
    upgradeModifyCancel: 'अपनी सदस्यता योजना को अपग्रेड, संशोधित या रद्द करें',
    updatePlan: 'योजना अपडेट करें',
    cancelSubscription: 'सदस्यता रद्द करें',
    confirmCancelSubscription: 'क्या आप वाकई अपनी सदस्यता रद्द करना चाहते हैं?',
    currentPlanSummary: 'वर्तमान योजना सारांश',
    current: 'वर्तमान',
    role: 'भूमिका',
    numberOfBranches: 'शाखाओं की संख्या',
    subscriptionUpdated: 'सदस्यता {plan} में {branches} शाखाओं के साथ अपडेट की गई। परिवर्तन अगले बिलिंग चक्र में प्रतिबिंबित होंगे।',
    subscriptionCanceled: 'सदस्यता रद्दीकरण का अनुरोध किया गया। कृपया सहायता से संपर्क करें।',
    signIn: 'साइन इन करें',
    signingIn: 'साइन इन हो रहा है...',
    welcomeBack: 'वापसी पर स्वागत है!',
    loginSuccessDesc: 'आप सफलतापूर्वक लॉग इन हो गए हैं।',
    loginFailed: 'लॉगिन विफल',
    invalidCredentials: 'अमान्य उपयोगकर्ता नाम या पासवर्ड',
    accountCreated: 'खाता बनाया गया!',
    accountCreatedDesc: 'कृपया अपने क्रेडेंशियल्स के साथ साइन इन करें।',
    signUpFailed: 'साइन अप विफल',
    signUpFailedDesc: 'खाता नहीं बनाया जा सका',
    selectLanguage: 'भाषा चुनें',
    restaurantManagementSystem: 'रेस्तरां प्रबंधन प्रणाली',
    vatDisclaimer: 'सभी कीमतों में सऊदी कानून के अनुसार 15% वैट शामिल है',
    
    // Messages
    success: 'सफलता',
    error: 'त्रुटि',
    confirmDelete: 'क्या आप वाकई इस आइटम को हटाना चाहते हैं?',
    itemAdded: 'आइटम सफलतापूर्वक जोड़ा गया',
    itemUpdated: 'आइटम सफलतापूर्वक अपडेट किया गया',
    itemDeleted: 'आइटम सफलतापूर्वक हटाया गया',
    settingsUpdated: 'सेटिंग्स सफलतापूर्वक अपडेट की गईं',
    savingSettings: 'सहेजा जा रहा है...',
    employeeCreated: 'कर्मचारी बनाया गया',
    employeeUpdated: 'कर्मचारी अपडेट किया गया',
    branchCreated: 'शाखा बनाई गई',
    branchUpdated: 'शाखा अपडेट की गई',
    customerCreated: 'ग्राहक बनाया गया',
    customerUpdated: 'ग्राहक अपडेट किया गया',
    customerDeleted: 'ग्राहक हटाया गया',
    recipeCreated: 'व्यंजन विधि बनाई गई',
    recipeUpdated: 'व्यंजन विधि अपडेट की गई',
    recipeDeleted: 'व्यंजन विधि हटाई गई',
    employeeCreatedDesc: 'कर्मचारी सफलतापूर्वक बनाया गया है',
    employeeUpdatedDesc: 'कर्मचारी सफलतापूर्वक अपडेट किया गया है',
    branchCreatedDesc: 'शाखा सफलतापूर्वक बनाई गई है',
    branchUpdatedDesc: 'शाखा सफलतापूर्वक अपडेट की गई है',
    customerCreatedDesc: 'ग्राहक सफलतापूर्वक बनाया गया है',
    customerUpdatedDesc: 'ग्राहक सफलतापूर्वक अपडेट किया गया है',
    customerDeletedDesc: 'ग्राहक सफलतापूर्वक हटाया गया है',
    recipeCreatedDesc: 'व्यंजन विधि सफलतापूर्वक बनाई गई है',
    recipeUpdatedDesc: 'व्यंजन विधि सफलतापूर्वक अपडेट की गई है',
    recipeDeletedDesc: 'व्यंजन विधि सफलतापूर्वक हटाई गई है',
    
    // Customer
    addCustomer: 'ग्राहक जोड़ें',
    editCustomer: 'ग्राहक संपादित करें',
    newCustomer: 'नया ग्राहक',
    existingCustomer: 'मौजूदा ग्राहक',
    selectCustomer: 'ग्राहक चुनें',
    
    // Investors
    investors: 'निवेशक',
    investor: 'निवेशक',
    addInvestor: 'निवेशक जोड़ें',
    editInvestor: 'निवेशक संपादित करें',
    addInvestorDesc: 'उनकी कमाई ट्रैक करने के लिए एक नया निवेशक जोड़ें।',
    editInvestorDesc: 'निवेशक विवरण अपडेट करें।',
    investorName: 'निवेशक का नाम',
    enterInvestorName: 'निवेशक का नाम दर्ज करें',
    amountInvested: 'निवेश की गई राशि',
    interestPercentage: 'ब्याज प्रतिशत',
    monthlyEarnings: 'मासिक कमाई',
    netProfitSummary: 'शुद्ध लाभ सारांश',
    netProfitDesc: 'सभी लागतों के बाद कुल शुद्ध लाभ (निवेशकों की कमाई की गणना के लिए उपयोग किया जाता है)',
    manageInvestors: 'निवेशकों को प्रबंधित करें और उनकी कमाई ट्रैक करें',
    searchInvestors: 'निवेशकों को खोजें...',
    noInvestorsFound: 'कोई निवेशक नहीं मिला',
    addFirstInvestor: 'शुरू करने के लिए अपना पहला निवेशक जोड़ें',
    investorCreated: 'निवेशक बनाया गया',
    investorUpdated: 'निवेशक अपडेट किया गया',
    investorDeleted: 'निवेशक हटाया गया',
    investorCreatedDesc: 'नया निवेशक सफलतापूर्वक जोड़ा गया है।',
    investorUpdatedDesc: 'निवेशक विवरण सफलतापूर्वक अपडेट किए गए हैं।',
    investorDeletedDesc: 'निवेशक सफलतापूर्वक हटा दिया गया है।',
    failedToCreateInvestor: 'निवेशक बनाने में विफल',
    failedToUpdateInvestor: 'निवेशक अपडेट करने में विफल',
    failedToDeleteInvestor: 'निवेशक हटाने में विफल',
    createInvestor: 'निवेशक बनाएं',
    updateInvestor: 'निवेशक अपडेट करें',
    confirmDeleteInvestorDesc: 'क्या आप वाकई इस निवेशक को हटाना चाहते हैं? यह क्रिया पूर्ववत नहीं की जा सकती।',
    interestPercentageHelp: 'अर्जित होने वाले शुद्ध लाभ का प्रतिशत',
    
    // Employee Management
    employeeManagement: 'कर्मचारी प्रबंधन',
    manageEmployees: 'कर्मचारियों और उनकी जानकारी का प्रबंधन करें',
    addEmployee: 'कर्मचारी जोड़ें',
    editEmployee: 'कर्मचारी संपादित करें',
    createNewEmployee: 'नया कर्मचारी बनाएं',
    addNewEmployeeDesc: 'अपने सिस्टम में एक नया कर्मचारी जोड़ें',
    createEmployee: 'कर्मचारी बनाएं',
    updateEmployee: 'कर्मचारी अपडेट करें',
    updateEmployeeInfo: 'कर्मचारी जानकारी और सेटिंग्स अपडेट करें',
    searchEmployees: 'नाम, उपयोगकर्ता नाम, ईमेल, फ़ोन या कर्मचारी संख्या से कर्मचारियों को खोजें...',
    creating: 'बनाया जा रहा है...',
    updating: 'अपडेट किया जा रहा है...',
    basic: 'बुनियादी',
    recruitment: 'भर्ती',
    vacation: 'छुट्टी',
    visa: 'वीज़ा',
    ticket: 'टिकट',
    performance: 'प्रदर्शन',
    compliance: 'अनुपालन',
    empFullName: 'पूरा नाम',
    empUsername: 'उपयोगकर्ता नाम',
    empPassword: 'पासवर्ड',
    empEmail: 'ईमेल',
    empPhone: 'फ़ोन',
    newPassword: 'नया पासवर्ड',
    leaveEmpty: 'वर्तमान रखने के लिए खाली छोड़ें',
    enterNewPassword: 'नया पासवर्ड दर्ज करें या खाली छोड़ें',
    admin: 'व्यवस्थापक',
    employee: 'कर्मचारी',
    activeStatus: 'सक्रिय स्थिति',
    active: 'सक्रिय',
    inactive: 'निष्क्रिय',
    permissions: 'अनुमतियाँ',
    employeeNumber: 'कर्मचारी संख्या',
    hireDate: 'नियुक्ति तिथि',
    recruitmentSource: 'भर्ती स्रोत',
    selectSource: 'स्रोत चुनें',
    referral: 'रेफरल',
    jobBoard: 'जॉब बोर्ड',
    agency: 'एजेंसी',
    walkIn: 'वॉक-इन',
    contractType: 'अनुबंध प्रकार',
    selectType: 'प्रकार चुनें',
    fullTime: 'पूर्णकालिक',
    partTime: 'अंशकालिक',
    contract: 'अनुबंध',
    temporary: 'अस्थायी',
    probationEndDate: 'परिवीक्षा समाप्ति तिथि',
    vacationDaysTotal: 'कुल छुट्टी के दिन',
    vacationDaysUsed: 'उपयोग किए गए छुट्टी के दिन',
    vacationDaysRemaining: 'शेष छुट्टी के दिन',
    daysLeft: 'दिन शेष',
    visaNumber: 'वीज़ा संख्या',
    visaFees: 'वीज़ा शुल्क',
    visaExpiryDate: 'वीज़ा समाप्ति तिथि',
    visaStatus: 'वीज़ा स्थिति',
    selectStatus: 'स्थिति चुनें',
    valid: 'वैध',
    expired: 'समाप्त',
    notApplicable: 'लागू नहीं',
    ticketAmount: 'टिकट राशि',
    ticketDestination: 'टिकट गंतव्य',
    ticketDate: 'टिकट तिथि',
    ticketStatus: 'टिकट स्थिति',
    booked: 'बुक किया गया',
    used: 'उपयोग किया गया',
    performanceRating: 'प्रदर्शन मूल्यांकन',
    lastReviewDate: 'अंतिम समीक्षा तिथि',
    performanceNotes: 'प्रदर्शन टिप्पणियाँ',
    enterPerformanceNotes: 'प्रदर्शन टिप्पणियाँ और फीडबैक दर्ज करें',
    
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
    tutorialStepByStepGuide: 'चरण-दर-चरण गाइड',
    tutorialEstimatedTime: 'अनुमानित समय',
    
    
    // Support Tickets
    supportTickets: 'Support Tickets',
    supportTicketsDescription: 'Create and manage support tickets for technical assistance',
    createTicket: 'Create Ticket',
    myTickets: 'My Tickets',
    allTickets: 'All Tickets',
    ticketSubject: 'Subject',
    ticketCategory: 'Category',
    ticketPriority: 'Priority',
    ticketDescription: 'Description',
    ticketStatusOpen: 'Open',
    ticketStatusInProgress: 'In Progress',
    ticketStatusResolved: 'Resolved',
    ticketStatusClosed: 'Closed',
    priorityLow: 'Low',
    priorityMedium: 'Medium',
    priorityHigh: 'High',
    priorityUrgent: 'Urgent',
    categoryTechnical: 'Technical Issue',
    categoryBilling: 'Billing Question',
    categoryFeature: 'Feature Request',
    categoryOther: 'Other',
    sendMessage: 'Send Message',
    viewTicket: 'View Ticket',
    backToTickets: 'Back to Tickets',
    messages: 'Messages',
    noMessages: 'No messages yet. Start a conversation!',
    typeMessage: 'Type your message...',
    updateStatus: 'Update Status',
    ticketDetails: 'Ticket Details',
    lastUpdated: 'Last Updated',
    ticketCreated: 'Ticket Created',
    ticketResolved: 'Ticket Resolved',
    ticketClosed: 'Ticket Closed',
    itSupport: 'IT Support',
    you: 'You',
    enterSubject: 'Enter ticket subject',
    enterDescription: 'Describe your issue in detail',
    selectCategory: 'Select a category',
    selectPriority: 'Select priority level',
    ticketCreatedSuccess: 'Ticket created successfully',
    messageSent: 'Message sent',
    statusUpdated: 'Status updated successfully',
    filterByStatus: 'स्थिति के अनुसार फ़िल्टर करें',
    subjectValidation: 'विषय कम से कम 5 वर्ण का होना चाहिए',
    categoryValidation: 'कृपया एक श्रेणी चुनें',
    descriptionValidation: 'विवरण कम से कम 10 वर्ण का होना चाहिए',
    ticketCreatedSuccessDesc: 'आपका समर्थन टिकट सफलतापूर्वक बनाया गया है',
    failedToCreateTicket: 'टिकट बनाने में विफल',
    failedToSendMessage: 'संदेश भेजने में विफल',
    ticketStatusUpdatedDesc: 'टिकट स्थिति अपडेट कर दी गई है',
    failedToUpdateStatus: 'स्थिति अपडेट करने में विफल',
    categoryBugReport: 'बग रिपोर्ट',
    categoryGeneralQuestion: 'सामान्य प्रश्न',
    viewChat: 'चैट देखें',
    ticketNotFound: 'टिकट नहीं मिला',
    markInProgress: 'प्रगति पर चिह्नित करें',
    markResolved: 'हल किया गया चिह्नित करें',
    closeTicket: 'टिकट बंद करें',
    ticketClosedMessage: 'यह टिकट बंद है और अब नए संदेश स्वीकार नहीं करता',
    noTicketsYet: 'अभी तक कोई समर्थन टिकट नहीं। शुरू करने के लिए एक बनाएं!',
    createFirstTicket: 'अपना पहला टिकट बनाएं',
    noTicketsWithStatus: 'इस स्थिति के साथ कोई टिकट नहीं मिला',
    createTicketDialogDesc: 'अपनी समस्या का वर्णन करें और हमारी समर्थन टीम आपकी मदद करेगी',
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
    shopTitle: 'दुकान',
    shopDescription: 'कर्मचारी वेतन और दुकान व्यय प्रबंधित करें',
    employeeSalaries: 'कर्मचारी वेतन',
    manageSalaries: 'कर्मचारी वेतन भुगतान और रिकॉर्ड प्रबंधित करें',
    monthlySalary: 'मासिक वेतन',
    paid: 'भुगतान किया',
    notes: 'नोट्स',
    salaryFormDescription: 'कर्मचारी वेतन जानकारी दर्ज करें',
    paidSalaries: 'भुगतान किए गए वेतन',
    pendingSalaries: 'लंबित वेतन',
    searchSalaries: 'कर्मचारी नाम या पद द्वारा वेतन खोजें...',
    noSalaries: 'कोई वेतन नहीं मिला',
    salaryAdded: 'वेतन सफलतापूर्वक जोड़ा गया',
    salaryUpdated: 'वेतन सफलतापूर्वक अपडेट किया गया',
    salaryDeleted: 'वेतन सफलतापूर्वक हटाया गया',
    salaryError: 'वेतन संसाधित करने में त्रुटि',
    manageBills: 'दुकान बिल और व्यय प्रबंधित करें',
    internet: 'इंटरनेट',
    maintenance: 'रखरखाव',
    billFormDescription: 'बिल जानकारी दर्ज करें',
    paidBills: 'भुगतान किए गए बिल',
    pendingBills: 'लंबित बिल',
    overdue: 'अतिदेय',
    searchBills: 'प्रकार या विवरण द्वारा बिल खोजें...',
    paymentPeriod: 'भुगतान अवधि',
    oneTime: 'एक बार भुगतान',
    weekly: 'साप्ताहिक',
    monthly: 'मासिक',
    quarterly: 'त्रैमासिक (1/4 वर्ष)',
    semiAnnually: 'अर्धवार्षिक (1/2 वर्ष)',
    yearly: 'वार्षिक',
    foundational: 'मूलभूत',
    noBills: 'कोई बिल नहीं मिला',
    billAdded: 'बिल सफलतापूर्वक जोड़ा गया',
    billUpdated: 'बिल सफलतापूर्वक अपडेट किया गया',
    billDeleted: 'बिल सफलतापूर्वक हटाया गया',
    billError: 'बिल संसाधित करने में त्रुटि',
    currency: 'SAR',
    saving: 'सहेजा जा रहा है...',
    
    // Bills Page
    bills: 'बिल',
    sar: 'SAR',
    archived: 'संग्रहीत',
    yes: 'हां',
    no: 'नहीं',
    exportedSuccessfully: 'सफलतापूर्वक निर्यात किया गया',
    exportToExcel: 'Excel में निर्यात करें',
    filters: 'फ़िल्टर',
    filterBills: 'विभिन्न मानदंडों के अनुसार बिल फ़िल्टर करें',
    all: 'सभी',
    startDate: 'आरंभ तिथि',
    endDate: 'समाप्ति तिथि',
    hideArchived: 'संग्रहीत छिपाएं',
    showArchived: 'संग्रहीत दिखाएं',
    billsList: 'बिल सूची',
    billsFound: 'बिल मिले',
    noBillsFound: 'कोई बिल नहीं मिला',
    actions: 'क्रियाएं',
    unarchive: 'असंग्रहीत करें',
    archive: 'संग्रहीत करें',
    somethingWentWrong: 'कुछ गलत हो गया',
    
    // Toast Messages & Notifications
    procurementCreated: 'खरीद आइटम सफलतापूर्वक बनाया गया',
    procurementUpdated: 'खरीद आइटम सफलतापूर्वक अपडेट किया गया',
    procurementDeleted: 'खरीद आइटम सफलतापूर्वक हटाया गया',
    orderCompleted: 'ऑर्डर सफलतापूर्वक पूर्ण हुआ',
    orderCompletedDesc: 'ऑर्डर दिया गया है और चालान बनाया गया है',
    failedToLogout: 'लॉग आउट विफल रहा। कृपया पुनः प्रयास करें।',
    failedToCreateBranch: 'शाखा बनाने में विफल',
    failedToUpdateBranch: 'शाखा अपडेट करने में विफल',
    failedToCreateCustomer: 'ग्राहक बनाने में विफल',
    failedToUpdateCustomer: 'ग्राहक अपडेट करने में विफल',
    failedToDeleteCustomer: 'ग्राहक हटाने में विफल',
    failedToExportCustomers: 'ग्राहक डेटा निर्यात करने में विफल',
    failedToExportPDF: 'PDF निर्यात करने में विफल',
    failedToExportExcel: 'Excel निर्यात करने में विफल',
    failedToCreateDeliveryApp: 'डिलीवरी ऐप बनाने में विफल',
    failedToUpdateDeliveryApp: 'डिलीवरी ऐप अपडेट करने में विफल',
    failedToDeleteDeliveryApp: 'डिलीवरी ऐप हटाने में विफल',
    failedToUpdateOrder: 'ऑर्डर अपडेट करने में विफल',
    failedToCreateEmployee: 'कर्मचारी बनाने में विफल',
    failedToUpdateEmployee: 'कर्मचारी अपडेट करने में विफल',
    failedToExportFinancial: 'वित्तीय डेटा निर्यात करने में विफल',
    exportFailed: 'निर्यात विफल',
    failedToResetPassword: 'पासवर्ड रीसेट करने में विफल',
    
    // Welcome Video Slides
    videoSlide1Title: 'अहमद से मिलें - रेस्तरां मालिक',
    videoSlide1Subtitle: 'मैनुअल इन्वेंटरी, खोए ऑर्डर, और गिरते मुनाफे से जूझ रहे हैं',
    videoSlide2Title: 'रियल-टाइम POS सिस्टम',
    videoSlide2Subtitle: 'तुरंत ऑर्डर प्रोसेस करें • लाइव सेल्स ट्रैक करें • कई भुगतान विधियां स्वीकार करें',
    videoSlide3Title: 'स्मार्ट इन्वेंटरी प्रबंधन',
    videoSlide3Subtitle: 'स्वचालित स्टॉक कटौती • कम स्टॉक अलर्ट • कभी सामग्री खत्म नहीं होगी',
    videoSlide4Title: 'ZATCA-अनुपालक चालान',
    videoSlide4Subtitle: 'तुरंत द्विभाषी चालान जेनरेट करें • QR कोड • पूर्ण कर अनुपालन',
    videoSlide5Title: 'शक्तिशाली विश्लेषण डैशबोर्ड',
    videoSlide5Subtitle: 'लाभप्रदता ट्रैक करें • मांग का पूर्वानुमान लगाएं • डेटा-आधारित निर्णय लें',
    videoSlide6Title: 'अहमद की सफलता की कहानी',
    videoSlide6Subtitle: '300% राजस्व वृद्धि • 5 नई शाखाएं • हजारों समृद्ध रेस्तरां में शामिल हों',
    failedToSendResetEmail: 'रीसेट ईमेल भेजने में विफल',
    failedToUpdateDevicePreference: 'डिवाइस वरीयता अपडेट करने में विफल',
    failedToExportProfitability: 'लाभप्रदता डेटा निर्यात करने में विफल',
    failedToCreateAdminAccount: 'व्यवस्थापक खाता बनाने में विफल',
    failedToCreateRecipe: 'रेसिपी बनाने में विफल',
    failedToUpdateRecipe: 'रेसिपी अपडेट करने में विफल',
    failedToDeleteRecipe: 'रेसिपी हटाने में विफल',
    couldNotSaveNewOrder: 'नया ऑर्डर सहेज नहीं सका',
    couldNotCreateRecipe: 'रेसिपी बना नहीं सका',
    couldNotUpdateRecipe: 'रेसिपी अपडेट नहीं कर सका',
    couldNotDeleteRecipe: 'रेसिपी हटा नहीं सका',
    failedToFetchBills: 'बिल लाने में विफल',
    invalidResetLink: 'अमान्य रीसेट लिंक',
    invalidResetLinkDesc: 'पासवर्ड रीसेट लिंक अमान्य या समाप्त हो गया है।',
    passwordsDontMatch: 'पासवर्ड मेल नहीं खाते',
    passwordsDontMatchDesc: 'कृपया सुनिश्चित करें कि दोनों पासवर्ड समान हैं।',
    passwordTooShort: 'पासवर्ड बहुत छोटा है',
    passwordTooShortDesc: 'पासवर्ड कम से कम 6 अक्षर लंबा होना चाहिए।',
    passwordResetSuccessful: 'पासवर्ड रीसेट सफल',
    passwordResetSuccessfulDesc: 'अब आप अपने नए पासवर्ड से लॉग इन कर सकते हैं।',
    resetEmailSent: 'रीसेट ईमेल भेजा गया',
    resetEmailSentDesc: 'पासवर्ड रीसेट निर्देशों के लिए अपना ईमेल जांचें।',
    resetPasswordDesc: 'नीचे अपना नया पासवर्ड दर्ज करें। यह कम से कम 6 अक्षर लंबा होना चाहिए।',
    forgotPasswordDesc: 'अपना ईमेल पता दर्ज करें और हम आपको पासवर्ड रीसेट करने के निर्देश भेजेंगे।',
    pleaseTryAgainOrRequestNew: 'कृपया फिर से प्रयास करें या नया रीसेट लिंक का अनुरोध करें।',
    pleaseTryAgainLater: 'कृपया बाद में पुनः प्रयास करें।',
    
    // Additional Pages
    deliveryProfitability: 'डिलीवरी लाभप्रदता',
    salesComparison: 'बिक्री तुलना',
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
    supportAndHelp: 'سپورٹ اور مدد',
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
    
    // Delivery Apps
    deliveryApps: 'Delivery Apps',
    addDeliveryApp: 'Add Delivery App',
    editDeliveryApp: 'Edit Delivery App',
    deleteDeliveryApp: 'Delete Delivery App',
    commission: 'Commission %',
    bankingFees: 'Banking Fees %',
    subsidy: 'Subsidy (SAR)',
    posFees: 'POS Fees (SAR)',
    netEarningsCalculator: 'Net Earnings Calculator',
    orderAmount: 'Order Amount',
    grossAmount: 'Gross Amount',
    afterCommission: 'After Commission',
    afterBankingFees: 'After Banking Fees',
    afterSubsidy: 'After Subsidy',
    afterPosFees: 'After POS Fees',
    netEarnings: 'Net Earnings',
    calculationExample: 'Calculation Example',
    testOrderAmount: 'Test Order Amount',
    enterCommission: 'Enter commission percentage',
    enterBankingFees: 'Enter banking fees percentage',
    enterSubsidy: 'Enter subsidy amount in SAR',
    enterPosFees: 'Enter POS fees in SAR',
    
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
    
    // Notifications
    newOrder: 'نیا آرڈر',
    orderUpdated: 'آرڈر اپ ڈیٹ',
    branch: 'برانچ',
    items: 'اشیاء',
    
    // Menu
    price: 'قیمت',
    basePrice: 'بنیادی قیمت',
    vatAmount: 'ویٹ رقم',
    discount: 'رعایت',
    discountPercentage: 'رعایت %',
    description: 'تفصیل',
    available: 'دستیاب',
    unavailable: 'ناقابل دستیاب',
    
    // Add-ons
    addons: 'اضافی اشیاء',
    addon: 'اضافی شے',
    addAddon: 'اضافی شے شامل کریں',
    editAddon: 'اضافی شے میں ترمیم کریں',
    deleteAddon: 'اضافی شے حذف کریں',
    addonName: 'اضافی شے کا نام',
    addonCategory: 'اضافی شے کا زمرہ',
    addonPrice: 'اضافی شے کی قیمت',
    selectAddons: 'اضافی اشیاء منتخب کریں',
    availableAddons: 'دستیاب اضافی اشیاء',
    selectedAddons: 'منتخب شدہ اضافی اشیاء',
    noAddonsAvailable: 'کوئی اضافی شے دستیاب نہیں',
    addonAdded: 'اضافی شے کامیابی سے شامل کی گئی',
    addonUpdated: 'اضافی شے کامیابی سے اپ ڈیٹ کی گئی',
    addonDeleted: 'اضافی شے کامیابی سے حذف کی گئی',
    
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
    
    // Account & Device Preference
    accountAndDevicePreference: 'اکاؤنٹ اور ڈیوائس کی ترجیح',
    accountAndDevicePreferenceDesc: 'انٹرفیس لے آؤٹ کو بہتر بنانے کے لیے اپنی ڈیوائس کی قسم منتخب کریں',
    account: 'اکاؤنٹ',
    roleAndStatus: 'کردار اور حیثیت',
    devicePreference: 'ڈیوائس کی ترجیح',
    laptop: 'لیپ ٹاپ',
    ipad: 'آئی پیڈ',
    iphone: 'آئی فون',
    laptopDesc: 'تمام خصوصیات کے ساتھ مکمل ڈیسک ٹاپ تجربہ',
    ipadDesc: 'ٹچ فرینڈلی کنٹرولز کے ساتھ ٹیبلٹ کے لیے بہتر لے آؤٹ',
    iphoneDesc: 'اسمارٹ فونز کے لیے کومپیکٹ موبائل لے آؤٹ',
    deviceLayoutNote: 'بہترین تجربے کے لیے ایپ لے آؤٹ خودکار طور پر آپ کی منتخب کردہ ڈیوائس سے مماثل ہو جائے گا۔',
    devicePreferenceUpdated: 'ڈیوائس کی ترجیح اپ ڈیٹ کی گئی',
    
    // Menu Item Management
    menuItemCreated: 'مینو آئٹم بنایا گیا',
    menuItemCreatedDesc: 'مینو آئٹم کامیابی سے شامل کیا گیا',
    menuItemUpdated: 'مینو آئٹم اپ ڈیٹ ہو گیا',
    menuItemUpdatedDesc: 'مینو آئٹم کامیابی سے اپ ڈیٹ ہو گیا',
    menuItemDeleted: 'مینو آئٹم حذف ہو گیا',
    menuItemDeletedDesc: 'مینو آئٹم کامیابی سے ہٹا دیا گیا',
    failedToCreateMenuItem: 'مینو آئٹم بنانے میں ناکام',
    failedToUpdateMenuItem: 'مینو آئٹم اپ ڈیٹ کرنے میں ناکام',
    failedToDeleteMenuItem: 'مینو آئٹم حذف کرنے میں ناکام',
    deleteMenuItemTitle: 'مینو آئٹم حذف کریں',
    deleteMenuItemConfirm: 'کیا آپ واقعی یہ آئٹم حذف کرنا چاہتے ہیں؟ اس عمل کو کالعدم نہیں کیا جا سکتا۔',
    itemNameRequired: 'آئٹم کا نام ضروری ہے',
    categoryRequired: 'زمرہ ضروری ہے',
    priceRequired: 'قیمت ضروری ہے',
    descriptionRequired: 'تفصیل ضروری ہے',
    discountRange: 'رعایت 0 سے 100 کے درمیان ہونی چاہیے',
    stockNoRequired: 'جب کوئی ترکیب منتخب نہیں ہو تو اسٹاک نمبر ضروری ہے',
    itemDescription: 'آئٹم کی تفصیل',
    itemImage: 'آئٹم کی تصویر (اختیاری)',
    itemImageHelper: 'اس مینو آئٹم کے لیے تصویر اپ لوڈ کریں (زیادہ سے زیادہ 5MB)',
    selectRecipe: 'ترکیب منتخب کریں',
    noRecipe: 'کوئی ترکیب نہیں',
    portionSize: 'حصے کا سائز',
    selectPortionSize: 'حصے کا سائز منتخب کریں',
    wholePortion: 'مکمل (1x)',
    threeQuarterPortion: '3/4 حصہ (0.75x)',
    halfPortion: '1/2 حصہ (0.5x)',
    quarterPortion: '1/4 حصہ (0.25x)',
    stockNumber: 'اسٹاک نمبر',
    priceInclVAT: 'قیمت (SAR، VAT شامل)',
    discountPercent: 'رعایت %',
    availabilityStatus: 'دستیابی کی حیثیت تبدیل ہو گئی',
    editMenuItem: 'مینو آئٹم میں ترمیم کریں',
    addMenuItem: 'مینو آئٹم شامل کریں',
    updateMenuItemDesc: 'مینو آئٹم کی تفصیلات اپ ڈیٹ کریں',
    createMenuItemDesc: 'VAT شامل قیمت کے ساتھ اپنے مینو کے لیے نیا آئٹم بنائیں',
    updateMenuItem: 'مینو آئٹم اپ ڈیٹ کریں',
    createMenuItem: 'مینو آئٹم بنائیں',
    loadingBranches: 'شاخیں لوڈ ہو رہی ہیں...',
    noBranchesAvailable: 'کوئی شاخیں دستیاب نہیں ہیں',
    
    // Placeholders
    enterRestaurantName: 'ریستوراں کا نام درج کریں',
    enterVatNumber: 'ویٹ نمبر درج کریں',
    enterEmail: 'info@restaurant.com',
    enterPhone: '+966 XX XXX XXXX',
    enterAddress: 'مکمل پتہ درج کریں',
    openingTime: 'کھلنے کا وقت',
    closingTime: 'بند ہونے کا وقت',
    enterDiscount: 'رعایت کا فیصد درج کریں (0-100)',
    
    // Authentication
    login: 'لاگ ان',
    signup: 'سائن اپ',
    password: 'پاس ورڈ',
    confirmPassword: 'پاس ورڈ کی تصدیق',
    username: 'صارف نام',
    forgotPassword: 'پاس ورڈ بھول گئے',
    resetPassword: 'پاس ورڈ ری سیٹ',
    fullName: 'پورا نام',
    enterFullName: 'اپنا پورا نام درج کریں',
    enterUsername: 'اپنا صارف نام درج کریں',
    chooseUsername: 'صارف نام منتخب کریں',
    enterPassword: 'اپنا پاس ورڈ درج کریں',
    choosePassword: 'پاس ورڈ منتخب کریں',
    commercialRegistration: 'تجارتی رجسٹریشن',
    commercialRegistrationPlaceholder: 'سعودی تجارتی رجسٹریشن نمبر',
    commercialRegistrationNote: 'سعودی عرب میں تمام ریستوراں کاروباروں کے لیے ضروری',
    subscriptionPlan: 'سبسکرپشن منصوبہ',
    billedMonthly: 'ماہانہ بل',
    billedYearly: 'سالانہ بل',
    perMonth: 'ماہانہ',
    perYear: 'سالانہ',
    manageSubscription: 'سبسکرپشن منظم کریں',
    manageYourSubscription: 'اپنی سبسکرپشن منظم کریں',
    upgradeModifyCancel: 'اپنے سبسکرپشن پلان کو اپ گریڈ، ترمیم یا منسوخ کریں',
    updatePlan: 'پلان اپ ڈیٹ کریں',
    cancelSubscription: 'سبسکرپشن منسوخ کریں',
    confirmCancelSubscription: 'کیا آپ واقعی اپنی سبسکرپشن منسوخ کرنا چاہتے ہیں؟',
    currentPlanSummary: 'موجودہ پلان کا خلاصہ',
    current: 'موجودہ',
    role: 'کردار',
    numberOfBranches: 'شاخوں کی تعداد',
    subscriptionUpdated: 'سبسکرپشن {plan} میں {branches} شاخوں کے ساتھ اپ ڈیٹ کر دی گئی۔ تبدیلیاں اگلے بلنگ سائیکل میں ظاہر ہوں گی۔',
    subscriptionCanceled: 'سبسکرپشن منسوخی کی درخواست کی گئی۔ براہ کرم سپورٹ سے رابطہ کریں۔',
    signIn: 'سائن ان',
    signingIn: 'سائن ان ہو رہا ہے...',
    welcomeBack: 'واپسی پر خوش آمدید!',
    loginSuccessDesc: 'آپ کامیابی سے لاگ ان ہو گئے ہیں۔',
    loginFailed: 'لاگ ان ناکام',
    invalidCredentials: 'غلط صارف نام یا پاس ورڈ',
    accountCreated: 'اکاؤنٹ بنایا گیا!',
    accountCreatedDesc: 'براہ کرم اپنی اسناد کے ساتھ سائن ان کریں۔',
    signUpFailed: 'سائن اپ ناکام',
    signUpFailedDesc: 'اکاؤنٹ نہیں بنایا جا سکا',
    selectLanguage: 'زبان منتخب کریں',
    restaurantManagementSystem: 'ریستوراں مینجمنٹ سسٹم',
    vatDisclaimer: 'تمام قیمتوں میں سعودی قانون کے مطابق 15% VAT شامل ہے',
    
    // Messages
    success: 'کامیابی',
    error: 'خرابی',
    confirmDelete: 'کیا آپ واقعی اس آئٹم کو حذف کرنا چاہتے ہیں؟',
    itemAdded: 'آئٹم کامیابی سے شامل کیا گیا',
    itemUpdated: 'آئٹم کامیابی سے اپ ڈیٹ کیا گیا',
    itemDeleted: 'آئٹم کامیابی سے حذف کیا گیا',
    settingsUpdated: 'ترتیبات کامیابی سے اپ ڈیٹ ہو گئیں',
    savingSettings: 'محفوظ ہو رہا ہے...',
    employeeCreated: 'ملازم بنایا گیا',
    employeeUpdated: 'ملازم اپ ڈیٹ کیا گیا',
    branchCreated: 'شاخ بنائی گئی',
    branchUpdated: 'شاخ اپ ڈیٹ کی گئی',
    customerCreated: 'گاہک بنایا گیا',
    customerUpdated: 'گاہک اپ ڈیٹ کیا گیا',
    customerDeleted: 'گاہک حذف کیا گیا',
    recipeCreated: 'ترکیب بنائی گئی',
    recipeUpdated: 'ترکیب اپ ڈیٹ کی گئی',
    recipeDeleted: 'ترکیب حذف کی گئی',
    employeeCreatedDesc: 'ملازم کامیابی سے بنایا گیا ہے',
    employeeUpdatedDesc: 'ملازم کامیابی سے اپ ڈیٹ کیا گیا ہے',
    branchCreatedDesc: 'شاخ کامیابی سے بنائی گئی ہے',
    branchUpdatedDesc: 'شاخ کامیابی سے اپ ڈیٹ کی گئی ہے',
    customerCreatedDesc: 'گاہک کامیابی سے بنایا گیا ہے',
    customerUpdatedDesc: 'گاہک کامیابی سے اپ ڈیٹ کیا گیا ہے',
    customerDeletedDesc: 'گاہک کامیابی سے حذف کیا گیا ہے',
    recipeCreatedDesc: 'ترکیب کامیابی سے بنائی گئی ہے',
    recipeUpdatedDesc: 'ترکیب کامیابی سے اپ ڈیٹ کی گئی ہے',
    recipeDeletedDesc: 'ترکیب کامیابی سے حذف کی گئی ہے',
    
    // Customer
    addCustomer: 'گاہک شامل کریں',
    editCustomer: 'گاہک میں ترمیم کریں',
    newCustomer: 'نیا گاہک',
    existingCustomer: 'موجودہ گاہک',
    selectCustomer: 'گاہک منتخب کریں',
    
    // Investors
    investors: 'سرمایہ کار',
    investor: 'سرمایہ کار',
    addInvestor: 'سرمایہ کار شامل کریں',
    editInvestor: 'سرمایہ کار میں ترمیم کریں',
    addInvestorDesc: 'ان کی آمدنی کو ٹریک کرنے کے لیے ایک نیا سرمایہ کار شامل کریں۔',
    editInvestorDesc: 'سرمایہ کار کی تفصیلات کو اپ ڈیٹ کریں۔',
    investorName: 'سرمایہ کار کا نام',
    enterInvestorName: 'سرمایہ کار کا نام درج کریں',
    amountInvested: 'سرمایہ کاری کی رقم',
    interestPercentage: 'سود کی شرح',
    monthlyEarnings: 'ماہانہ آمدنی',
    netProfitSummary: 'خالص منافع کا خلاصہ',
    netProfitDesc: 'تمام اخراجات کے بعد کل خالص منافع (سرمایہ کاروں کی آمدنی کی گणنا کے لیے استعمال کیا جاتا ہے)',
    manageInvestors: 'سرمایہ کاروں کا انتظام کریں اور ان کی آمدنی کو ٹریک کریں',
    searchInvestors: 'سرمایہ کاروں کو تلاش کریں...',
    noInvestorsFound: 'کوئی سرمایہ کار نہیں ملا',
    addFirstInvestor: 'شروع کرنے کے لیے اپنا پہلا سرمایہ کار شامل کریں',
    investorCreated: 'سرمایہ کار بنایا گیا',
    investorUpdated: 'سرمایہ کار اپ ڈیٹ کیا گیا',
    investorDeleted: 'سرمایہ کار حذف کیا گیا',
    investorCreatedDesc: 'نیا سرمایہ کار کامیابی سے شامل کیا گیا ہے۔',
    investorUpdatedDesc: 'سرمایہ کار کی تفصیلات کامیابی سے اپ ڈیٹ کی گئی ہیں۔',
    investorDeletedDesc: 'سرمایہ کار کامیابی سے ہٹا دیا گیا ہے۔',
    failedToCreateInvestor: 'سرمایہ کار بنانے میں ناکام',
    failedToUpdateInvestor: 'سرمایہ کار اپ ڈیٹ کرنے میں ناکام',
    failedToDeleteInvestor: 'سرمایہ کار حذف کرنے میں ناکام',
    createInvestor: 'سرمایہ کار بنائیں',
    updateInvestor: 'سرمایہ کار اپ ڈیٹ کریں',
    confirmDeleteInvestorDesc: 'کیا آپ واقعی اس سرمایہ کار کو حذف کرنا چاہتے ہیں؟ یہ عمل واپس نہیں کیا جا سکتا۔',
    interestPercentageHelp: 'کمانے کے لیے خالص منافع کی فیصد',
    
    // Employee Management
    employeeManagement: 'ملازمین کی انتظامیہ',
    manageEmployees: 'ملازمین اور ان کی معلومات کا انتظام کریں',
    addEmployee: 'ملازم شامل کریں',
    editEmployee: 'ملازم میں ترمیم کریں',
    createNewEmployee: 'نیا ملازم بنائیں',
    addNewEmployeeDesc: 'اپنے سسٹم میں نیا ملازم شامل کریں',
    createEmployee: 'ملازم بنائیں',
    updateEmployee: 'ملازم اپ ڈیٹ کریں',
    updateEmployeeInfo: 'ملازم کی معلومات اور ترتیبات کو اپ ڈیٹ کریں',
    searchEmployees: 'نام، صارف نام، ای میل، فون یا ملازم نمبر کے ذریعے ملازمین تلاش کریں...',
    creating: 'بنایا جا رہا ہے...',
    updating: 'اپ ڈیٹ کیا جا رہا ہے...',
    basic: 'بنیادی',
    recruitment: 'بھرتی',
    vacation: 'چھٹی',
    visa: 'ویزا',
    ticket: 'ٹکٹ',
    performance: 'کارکردگی',
    compliance: 'تعمیل',
    empFullName: 'مکمل نام',
    empUsername: 'صارف نام',
    empPassword: 'پاس ورڈ',
    empEmail: 'ای میل',
    empPhone: 'فون',
    newPassword: 'نیا پاس ورڈ',
    leaveEmpty: 'موجودہ رکھنے کے لیے خالی چھوڑ دیں',
    enterNewPassword: 'نیا پاس ورڈ درج کریں یا خالی چھوڑ دیں',
    admin: 'منتظم',
    employee: 'ملازم',
    activeStatus: 'فعال حیثیت',
    active: 'فعال',
    inactive: 'غیر فعال',
    permissions: 'اجازتیں',
    employeeNumber: 'ملازم نمبر',
    hireDate: 'ملازمت کی تاریخ',
    recruitmentSource: 'بھرتی کا ذریعہ',
    selectSource: 'ذریعہ منتخب کریں',
    referral: 'ریفرل',
    jobBoard: 'جاب بورڈ',
    agency: 'ایجنسی',
    walkIn: 'واک-ان',
    contractType: 'معاہدے کی قسم',
    selectType: 'قسم منتخب کریں',
    fullTime: 'مکمل وقت',
    partTime: 'جزوی وقت',
    contract: 'معاہدہ',
    temporary: 'عارضی',
    probationEndDate: 'آزمائشی مدت ختم ہونے کی تاریخ',
    vacationDaysTotal: 'کل چھٹیوں کے دن',
    vacationDaysUsed: 'استعمال شدہ چھٹیوں کے دن',
    vacationDaysRemaining: 'باقی چھٹیوں کے دن',
    daysLeft: 'دن باقی',
    visaNumber: 'ویزا نمبر',
    visaFees: 'ویزا فیس',
    visaExpiryDate: 'ویزا کی میعاد ختم ہونے کی تاریخ',
    visaStatus: 'ویزا کی حیثیت',
    selectStatus: 'حیثیت منتخب کریں',
    valid: 'درست',
    expired: 'ختم شدہ',
    notApplicable: 'لاگو نہیں',
    ticketAmount: 'ٹکٹ کی رقم',
    ticketDestination: 'ٹکٹ کی منزل',
    ticketDate: 'ٹکٹ کی تاریخ',
    ticketStatus: 'ٹکٹ کی حیثیت',
    booked: 'بک کیا گیا',
    used: 'استعمال شدہ',
    performanceRating: 'کارکردگی کی درجہ بندی',
    lastReviewDate: 'آخری جائزہ کی تاریخ',
    performanceNotes: 'کارکردگی کے نوٹس',
    enterPerformanceNotes: 'کارکردگی کے نوٹس اور تاثرات درج کریں',
    
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
    tutorialStepByStepGuide: 'قدم بہ قدم گائیڈ',
    tutorialEstimatedTime: 'تخمینہ شدہ وقت',
    
    
    // Support Tickets
    supportTickets: 'Support Tickets',
    supportTicketsDescription: 'Create and manage support tickets for technical assistance',
    createTicket: 'Create Ticket',
    myTickets: 'My Tickets',
    allTickets: 'All Tickets',
    ticketSubject: 'Subject',
    ticketCategory: 'Category',
    ticketPriority: 'Priority',
    ticketDescription: 'Description',
    ticketStatusOpen: 'Open',
    ticketStatusInProgress: 'In Progress',
    ticketStatusResolved: 'Resolved',
    ticketStatusClosed: 'Closed',
    priorityLow: 'Low',
    priorityMedium: 'Medium',
    priorityHigh: 'High',
    priorityUrgent: 'Urgent',
    categoryTechnical: 'Technical Issue',
    categoryBilling: 'Billing Question',
    categoryFeature: 'Feature Request',
    categoryOther: 'Other',
    sendMessage: 'Send Message',
    viewTicket: 'View Ticket',
    backToTickets: 'Back to Tickets',
    messages: 'Messages',
    noMessages: 'No messages yet. Start a conversation!',
    typeMessage: 'Type your message...',
    updateStatus: 'Update Status',
    ticketDetails: 'Ticket Details',
    lastUpdated: 'Last Updated',
    ticketCreated: 'Ticket Created',
    ticketResolved: 'Ticket Resolved',
    ticketClosed: 'Ticket Closed',
    itSupport: 'IT Support',
    you: 'You',
    enterSubject: 'Enter ticket subject',
    enterDescription: 'Describe your issue in detail',
    selectCategory: 'Select a category',
    selectPriority: 'Select priority level',
    ticketCreatedSuccess: 'Ticket created successfully',
    messageSent: 'Message sent',
    statusUpdated: 'Status updated successfully',
    filterByStatus: 'حیثیت کے مطابق فلٹر کریں',
    subjectValidation: 'موضوع کم از کم 5 حروف کا ہونا چاہیے',
    categoryValidation: 'براہ کرم ایک زمرہ منتخب کریں',
    descriptionValidation: 'تفصیل کم از کم 10 حروف کی ہونی چاہیے',
    ticketCreatedSuccessDesc: 'آپ کی سپورٹٹکٹ کامیابی سے بنائی گئی ہے',
    failedToCreateTicket: 'ٹکٹ بنانے میں ناکام',
    failedToSendMessage: 'پیغام بھیجنے میں ناکام',
    ticketStatusUpdatedDesc: 'ٹکٹ کی حیثیت اپ ڈیٹ ہو گئی ہے',
    failedToUpdateStatus: 'حیثیت اپ ڈیٹ کرنے میں ناکام',
    categoryBugReport: 'بگ رپورٹ',
    categoryGeneralQuestion: 'عام سوال',
    viewChat: 'چیٹ دیکھیں',
    ticketNotFound: 'ٹکٹ نہیں ملی',
    markInProgress: 'پیش رفت میں نشان لگائیں',
    markResolved: 'حل شدہ نشان لگائیں',
    closeTicket: 'ٹکٹ بند کریں',
    ticketClosedMessage: 'یہ ٹکٹ بند ہے اور اب نئے پیغامات قبول نہیں کرتی',
    noTicketsYet: 'ابھی تک کوئی سپورٹ ٹکٹ نہیں۔ شروع کرنے کے لیے ایک بنائیں!',
    createFirstTicket: 'اپنی پہلی ٹکٹ بنائیں',
    noTicketsWithStatus: 'اس حیثیت کے ساتھ کوئی ٹکٹ نہیں ملی',
    createTicketDialogDesc: 'اپنے مسئلے کی وضاحت کریں اور ہماری سپورٹ ٹیم آپ کی مدد کرے گی',
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
    shopTitle: 'دکان',
    shopDescription: 'ملازمین کی تنخواہیں اور دکان کے اخراجات کا انتظام کریں',
    employeeSalaries: 'ملازمین کی تنخواہیں',
    manageSalaries: 'ملازمین کی تنخواہ کی ادائیگیوں اور ریکارڈ کا انتظام کریں',
    monthlySalary: 'ماہانہ تنخواہ',
    paid: 'ادا کیا گیا',
    notes: 'نوٹس',
    salaryFormDescription: 'ملازم کی تنخواہ کی معلومات درج کریں',
    paidSalaries: 'ادا شدہ تنخواہیں',
    pendingSalaries: 'زیر التواء تنخواہیں',
    searchSalaries: 'ملازم کے نام یا عہدے کے مطابق تنخواہیں تلاش کریں...',
    noSalaries: 'کوئی تنخواہ نہیں ملی',
    salaryAdded: 'تنخواہ کامیابی سے شامل کی گئی',
    salaryUpdated: 'تنخواہ کامیابی سے اپ ڈیٹ کی گئی',
    salaryDeleted: 'تنخواہ کامیابی سے حذف کی گئی',
    salaryError: 'تنخواہ پر کارروائی میں خرابی',
    manageBills: 'دکان کے بل اور اخراجات کا انتظام کریں',
    internet: 'انٹرنیٹ',
    maintenance: 'دیکھ بھال',
    billFormDescription: 'بل کی معلومات درج کریں',
    paidBills: 'ادا شدہ بل',
    pendingBills: 'زیر التواء بل',
    overdue: 'مدت ختم',
    searchBills: 'قسم یا تفصیل کے مطابق بل تلاش کریں...',
    paymentPeriod: 'ادائیگی کی مدت',
    oneTime: 'ایک بار ادائیگی',
    weekly: 'ہفتہ وار',
    monthly: 'ماہانہ',
    quarterly: 'سہ ماہی (1/4 سال)',
    semiAnnually: 'نصف سالانہ (1/2 سال)',
    yearly: 'سالانہ',
    foundational: 'بنیادی',
    noBills: 'کوئی بل نہیں ملا',
    billAdded: 'بل کامیابی سے شامل کیا گیا',
    billUpdated: 'بل کامیابی سے اپ ڈیٹ کیا گیا',
    billDeleted: 'بل کامیابی سے حذف کیا گیا',
    billError: 'بل پر کارروائی میں خرابی',
    currency: 'SAR',
    saving: 'محفوظ کیا جا رہا ہے...',
    
    // Bills Page
    bills: 'بل',
    sar: 'SAR',
    archived: 'محفوظ شدہ',
    yes: 'ہاں',
    no: 'نہیں',
    exportedSuccessfully: 'کامیابی سے برآمد کیا گیا',
    exportToExcel: 'Excel میں برآمد کریں',
    filters: 'فلٹرز',
    filterBills: 'مختلف معیارات کے مطابق بل فلٹر کریں',
    all: 'تمام',
    startDate: 'شروع کی تاریخ',
    endDate: 'ختم کی تاریخ',
    hideArchived: 'محفوظ شدہ چھپائیں',
    showArchived: 'محفوظ شدہ دکھائیں',
    billsList: 'بل کی فہرست',
    billsFound: 'بل ملے',
    noBillsFound: 'کوئی بل نہیں ملا',
    actions: 'اعمال',
    unarchive: 'غیر محفوظ کریں',
    archive: 'محفوظ کریں',
    somethingWentWrong: 'کچھ غلط ہو گیا',
    
    // Toast Messages & Notifications
    procurementCreated: 'خریداری کی آئٹم کامیابی سے بنائی گئی',
    procurementUpdated: 'خریداری کی آئٹم کامیابی سے اپ ڈیٹ کی گئی',
    procurementDeleted: 'خریداری کی آئٹم کامیابی سے حذف کی گئی',
    orderCompleted: 'آرڈر کامیابی سے مکمل ہوا',
    orderCompletedDesc: 'آرڈر دیا گیا ہے اور رسید تیار کی گئی ہے',
    failedToLogout: 'لاگ آؤٹ ناکام رہا۔ براہ کرم دوبارہ کوشش کریں۔',
    failedToCreateBranch: 'شاخ بنانے میں ناکام',
    failedToUpdateBranch: 'شاخ کو اپ ڈیٹ کرنے میں ناکام',
    failedToCreateCustomer: 'گاہک بنانے میں ناکام',
    
    // Welcome Video Slides
    videoSlide1Title: 'احمد سے ملیں - ریستوران کے مالک',
    videoSlide1Subtitle: 'دستی انوینٹری، گمشدہ آرڈرز، اور گرتے ہوئے منافع سے نمٹنا',
    videoSlide2Title: 'ریئل ٹائم POS سسٹم',
    videoSlide2Subtitle: 'فوری طور پر آرڈرز کی کارروائی • لائیو سیلز ٹریک کریں • متعدد ادائیگی کے طریقے',
    videoSlide3Title: 'سمارٹ انوینٹری مینجمنٹ',
    videoSlide3Subtitle: 'خودکار اسٹاک کی کٹوتی • کم اسٹاک الرٹس • اجزاء کبھی ختم نہیں ہوں گے',
    videoSlide4Title: 'ZATCA کے مطابق رسیدیں',
    videoSlide4Subtitle: 'فوری طور پر دو لسانی رسیدیں بنائیں • QR کوڈز • مکمل ٹیکس تعمیل',
    videoSlide5Title: 'طاقتور تجزیات ڈیش بورڈ',
    videoSlide5Subtitle: 'منافع کو ٹریک کریں • طلب کی پیش گوئی کریں • ڈیٹا پر مبنی فیصلے کریں',
    videoSlide6Title: 'احمد کی کامیابی کی کہانی',
    videoSlide6Subtitle: '300% آمدنی میں اضافہ • 5 نئی شاخیں • ہزاروں خوشحال ریستورانوں میں شامل ہوں',
    failedToUpdateCustomer: 'گاہک کو اپ ڈیٹ کرنے میں ناکام',
    failedToDeleteCustomer: 'گاہک کو حذف کرنے میں ناکام',
    failedToExportCustomers: 'گاہک ڈیٹا برآمد کرنے میں ناکام',
    failedToExportPDF: 'PDF برآمد کرنے میں ناکام',
    failedToExportExcel: 'Excel برآمد کرنے میں ناکام',
    failedToCreateDeliveryApp: 'ڈیلیوری ایپ بنانے میں ناکام',
    failedToUpdateDeliveryApp: 'ڈیلیوری ایپ کو اپ ڈیٹ کرنے میں ناکام',
    failedToDeleteDeliveryApp: 'ڈیلیوری ایپ کو حذف کرنے میں ناکام',
    failedToUpdateOrder: 'آرڈر کو اپ ڈیٹ کرنے میں ناکام',
    failedToCreateEmployee: 'ملازم بنانے میں ناکام',
    failedToUpdateEmployee: 'ملازم کو اپ ڈیٹ کرنے میں ناکام',
    failedToExportFinancial: 'مالیاتی ڈیٹا برآمد کرنے میں ناکام',
    exportFailed: 'برآمد ناکام',
    failedToResetPassword: 'پاس ورڈ ری سیٹ کرنے میں ناکام',
    failedToSendResetEmail: 'ری سیٹ ای میل بھیجنے میں ناکام',
    failedToUpdateDevicePreference: 'ڈیوائس ترجیح اپ ڈیٹ کرنے میں ناکام',
    failedToExportProfitability: 'منافع ڈیٹا برآمد کرنے میں ناکام',
    failedToCreateAdminAccount: 'ایڈمن اکاؤنٹ بنانے میں ناکام',
    failedToCreateRecipe: 'ترکیب بنانے میں ناکام',
    failedToUpdateRecipe: 'ترکیب اپ ڈیٹ کرنے میں ناکام',
    failedToDeleteRecipe: 'ترکیب حذف کرنے میں ناکام',
    couldNotSaveNewOrder: 'نیا آرڈر محفوظ نہیں کر سکا',
    couldNotCreateRecipe: 'ترکیب بنا نہیں سکا',
    couldNotUpdateRecipe: 'ترکیب اپ ڈیٹ نہیں کر سکا',
    couldNotDeleteRecipe: 'ترکیب حذف نہیں کر سکا',
    failedToFetchBills: 'بل لانے میں ناکام',
    invalidResetLink: 'غلط ری سیٹ لنک',
    invalidResetLinkDesc: 'پاس ورڈ ری سیٹ لنک غلط یا میعاد ختم ہو گیا ہے۔',
    passwordsDontMatch: 'پاس ورڈ میل نہیں کھاتے',
    passwordsDontMatchDesc: 'براہ کرم یقینی بنائیں کہ دونوں پاس ورڈ ایک جیسے ہیں۔',
    passwordTooShort: 'پاس ورڈ بہت چھوٹا ہے',
    passwordTooShortDesc: 'پاس ورڈ کم از کم 6 حروف لمبا ہونا چاہیے۔',
    passwordResetSuccessful: 'پاس ورڈ ری سیٹ کامیاب',
    passwordResetSuccessfulDesc: 'اب آپ اپنے نئے پاس ورڈ سے لاگ ان کر سکتے ہیں۔',
    resetEmailSent: 'ری سیٹ ای میل بھیج دیا گیا',
    resetEmailSentDesc: 'پاس ورڈ ری سیٹ کی ہدایات کے لیے اپنا ای میل چیک کریں۔',
    resetPasswordDesc: 'نیچے اپنا نیا پاس ورڈ درج کریں۔ یہ کم از کم 6 حروف لمبا ہونا چاہیے۔',
    forgotPasswordDesc: 'اپنا ای میل ایڈریس درج کریں اور ہم آپ کو پاس ورڈ ری سیٹ کرنے کی ہدایات بھیجیں گے۔',
    pleaseTryAgainOrRequestNew: 'براہ کرم دوبارہ کوشش کریں یا نیا ری سیٹ لنک کی درخواست کریں۔',
    pleaseTryAgainLater: 'براہ کرم بعد میں دوبارہ کوشش کریں۔',
    
    // Additional Pages
    deliveryProfitability: 'ڈیلیوری منافع',
    salesComparison: 'فروخت کا موازنہ',
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
    supportAndHelp: 'সহায়তা এবং সাহায্য',
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
    
    // Delivery Apps
    deliveryApps: 'Delivery Apps',
    addDeliveryApp: 'Add Delivery App',
    editDeliveryApp: 'Edit Delivery App',
    deleteDeliveryApp: 'Delete Delivery App',
    commission: 'Commission %',
    bankingFees: 'Banking Fees %',
    subsidy: 'Subsidy (SAR)',
    posFees: 'POS Fees (SAR)',
    netEarningsCalculator: 'Net Earnings Calculator',
    orderAmount: 'Order Amount',
    grossAmount: 'Gross Amount',
    afterCommission: 'After Commission',
    afterBankingFees: 'After Banking Fees',
    afterSubsidy: 'After Subsidy',
    afterPosFees: 'After POS Fees',
    netEarnings: 'Net Earnings',
    calculationExample: 'Calculation Example',
    testOrderAmount: 'Test Order Amount',
    enterCommission: 'Enter commission percentage',
    enterBankingFees: 'Enter banking fees percentage',
    enterSubsidy: 'Enter subsidy amount in SAR',
    enterPosFees: 'Enter POS fees in SAR',
    
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
    
    // Notifications
    newOrder: 'নতুন অর্ডার',
    orderUpdated: 'অর্ডার আপডেট',
    branch: 'শাখা',
    items: 'আইটেম',
    
    // Menu
    price: 'মূল্য',
    basePrice: 'মূল মূল্য',
    vatAmount: 'ভ্যাট পরিমাণ',
    discount: 'ছাড়',
    discountPercentage: 'ছাড় %',
    description: 'বিবরণ',
    available: 'উপলব্ধ',
    unavailable: 'অনুপলব্ধ',
    
    // Add-ons
    addons: 'অ্যাড-অন',
    addon: 'অ্যাড-অন',
    addAddon: 'অ্যাড-অন যোগ করুন',
    editAddon: 'অ্যাড-অন সম্পাদনা করুন',
    deleteAddon: 'অ্যাড-অন মুছুন',
    addonName: 'অ্যাড-অনের নাম',
    addonCategory: 'অ্যাড-অন ক্যাটাগরি',
    addonPrice: 'অ্যাড-অন মূল্য',
    selectAddons: 'অ্যাড-অন নির্বাচন করুন',
    availableAddons: 'উপলব্ধ অ্যাড-অন',
    selectedAddons: 'নির্বাচিত অ্যাড-অন',
    noAddonsAvailable: 'কোনো অ্যাড-অন উপলব্ধ নেই',
    addonAdded: 'অ্যাড-অন সফলভাবে যোগ করা হয়েছে',
    addonUpdated: 'অ্যাড-অন সফলভাবে আপডেট করা হয়েছে',
    addonDeleted: 'অ্যাড-অন সফলভাবে মুছে ফেলা হয়েছে',
    
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
    
    // Account & Device Preference
    accountAndDevicePreference: 'অ্যাকাউন্ট এবং ডিভাইস পছন্দ',
    accountAndDevicePreferenceDesc: 'ইন্টারফেস লেআউট অপ্টিমাইজ করতে আপনার ডিভাইসের ধরন চয়ন করুন',
    account: 'অ্যাকাউন্ট',
    roleAndStatus: 'ভূমিকা এবং স্ট্যাটাস',
    devicePreference: 'ডিভাইস পছন্দ',
    laptop: 'ল্যাপটপ',
    ipad: 'আইপ্যাড',
    iphone: 'আইফোন',
    laptopDesc: 'সমস্ত বৈশিষ্ট্য সহ সম্পূর্ণ ডেস্কটপ অভিজ্ঞতা',
    ipadDesc: 'টাচ-বান্ধব নিয়ন্ত্রণ সহ ট্যাবলেট-অপ্টিমাইজড লেআউট',
    iphoneDesc: 'স্মার্টফোনের জন্য কমপ্যাক্ট মোবাইল লেআউট',
    deviceLayoutNote: 'সর্বোত্তম অভিজ্ঞতার জন্য অ্যাপ লেআউট স্বয়ংক্রিয়ভাবে আপনার নির্বাচিত ডিভাইসের সাথে মিলবে।',
    devicePreferenceUpdated: 'ডিভাইস পছন্দ আপডেট করা হয়েছে',
    
    // Menu Item Management
    menuItemCreated: 'মেনু আইটেম তৈরি করা হয়েছে',
    menuItemCreatedDesc: 'মেনু আইটেম সফলভাবে যোগ করা হয়েছে',
    menuItemUpdated: 'মেনু আইটেম আপডেট করা হয়েছে',
    menuItemUpdatedDesc: 'মেনু আইটেম সফলভাবে আপডেট করা হয়েছে',
    menuItemDeleted: 'মেনু আইটেম মুছে ফেলা হয়েছে',
    menuItemDeletedDesc: 'মেনু আইটেম সফলভাবে সরানো হয়েছে',
    failedToCreateMenuItem: 'মেনু আইটেম তৈরি করতে ব্যর্থ',
    failedToUpdateMenuItem: 'মেনু আইটেম আপডেট করতে ব্যর্থ',
    failedToDeleteMenuItem: 'মেনু আইটেম মুছতে ব্যর্থ',
    deleteMenuItemTitle: 'মেনু আইটেম মুছুন',
    deleteMenuItemConfirm: 'আপনি কি নিশ্চিত যে আপনি এই আইটেমটি মুছতে চান? এই ক্রিয়াটি পূর্বাবস্থায় ফেরানো যাবে না।',
    itemNameRequired: 'আইটেমের নাম প্রয়োজন',
    categoryRequired: 'বিভাগ প্রয়োজন',
    priceRequired: 'মূল্য প্রয়োজন',
    descriptionRequired: 'বিবরণ প্রয়োজন',
    discountRange: 'ছাড় 0 থেকে 100 এর মধ্যে হতে হবে',
    stockNoRequired: 'কোনো রেসিপি নির্বাচিত না হলে স্টক নম্বর প্রয়োজন',
    itemDescription: 'আইটেম বিবরণ',
    itemImage: 'আইটেম চিত্র (ঐচ্ছিক)',
    itemImageHelper: 'এই মেনু আইটেমের জন্য একটি চিত্র আপলোড করুন (সর্বোচ্চ 5MB)',
    selectRecipe: 'রেসিপি নির্বাচন করুন',
    noRecipe: 'কোনো রেসিপি নেই',
    portionSize: 'অংশের আকার',
    selectPortionSize: 'অংশের আকার নির্বাচন করুন',
    wholePortion: 'সম্পূর্ণ (1x)',
    threeQuarterPortion: '3/4 অংশ (0.75x)',
    halfPortion: '1/2 অংশ (0.5x)',
    quarterPortion: '1/4 অংশ (0.25x)',
    stockNumber: 'স্টক নম্বর',
    priceInclVAT: 'মূল্য (SAR, VAT সহ)',
    discountPercent: 'ছাড় %',
    availabilityStatus: 'প্রাপ্যতা স্থিতি পরিবর্তিত হয়েছে',
    editMenuItem: 'মেনু আইটেম সম্পাদনা করুন',
    addMenuItem: 'মেনু আইটেম যোগ করুন',
    updateMenuItemDesc: 'মেনু আইটেম বিবরণ আপডেট করুন',
    createMenuItemDesc: 'VAT-অন্তর্ভুক্ত মূল্য নির্ধারণ সহ আপনার মেনুর জন্য একটি নতুন আইটেম তৈরি করুন',
    updateMenuItem: 'মেনু আইটেম আপডেট করুন',
    createMenuItem: 'মেনু আইটেম তৈরি করুন',
    loadingBranches: 'শাখা লোড হচ্ছে...',
    noBranchesAvailable: 'কোনো শাখা উপলব্ধ নেই',
    
    // Placeholders
    enterRestaurantName: 'রেস্তোরাঁর নাম লিখুন',
    enterVatNumber: 'ভ্যাট নম্বর লিখুন',
    enterEmail: 'info@restaurant.com',
    enterPhone: '+966 XX XXX XXXX',
    enterAddress: 'সম্পূর্ণ ঠিকানা লিখুন',
    openingTime: 'খোলার সময়',
    closingTime: 'বন্ধ করার সময়',
    enterDiscount: 'ছাড় শতাংশ লিখুন (0-100)',
    
    // Authentication
    login: 'লগইন',
    signup: 'সাইন আপ',
    password: 'পাসওয়ার্ড',
    confirmPassword: 'পাসওয়ার্ড নিশ্চিত করুন',
    username: 'ব্যবহারকারীর নাম',
    forgotPassword: 'পাসওয়ার্ড ভুলে গেছেন',
    resetPassword: 'পাসওয়ার্ড রিসেট',
    fullName: 'পুরো নাম',
    enterFullName: 'আপনার পুরো নাম লিখুন',
    enterUsername: 'আপনার ব্যবহারকারী নাম লিখুন',
    chooseUsername: 'ব্যবহারকারী নাম নির্বাচন করুন',
    enterPassword: 'আপনার পাসওয়ার্ড লিখুন',
    choosePassword: 'পাসওয়ার্ড নির্বাচন করুন',
    commercialRegistration: 'বাণিজ্যিক নিবন্ধন',
    commercialRegistrationPlaceholder: 'সৌদি বাণিজ্যিক নিবন্ধন নম্বর',
    commercialRegistrationNote: 'সৌদি আরবের সমস্ত রেস্তোরাঁ ব্যবসার জন্য প্রয়োজনীয়',
    subscriptionPlan: 'সাবস্ক্রিপশন প্ল্যান',
    billedMonthly: 'মাসিক বিল',
    billedYearly: 'বার্ষিক বিল',
    perMonth: 'প্রতি মাসে',
    perYear: 'প্রতি বছরে',
    manageSubscription: 'সাবস্ক্রিপশন পরিচালনা করুন',
    manageYourSubscription: 'আপনার সাবস্ক্রিপশন পরিচালনা করুন',
    upgradeModifyCancel: 'আপনার সাবস্ক্রিপশন প্ল্যান আপগ্রেড, পরিবর্তন বা বাতিল করুন',
    updatePlan: 'প্ল্যান আপডেট করুন',
    cancelSubscription: 'সাবস্ক্রিপশন বাতিল করুন',
    confirmCancelSubscription: 'আপনি কি নিশ্চিত আপনি আপনার সাবস্ক্রিপশন বাতিল করতে চান?',
    currentPlanSummary: 'বর্তমান প্ল্যান সারাংশ',
    current: 'বর্তমান',
    role: 'ভূমিকা',
    numberOfBranches: 'শাখার সংখ্যা',
    subscriptionUpdated: 'সাবস্ক্রিপশন {plan} এ {branches} শাখা সহ আপডেট করা হয়েছে। পরিবর্তনগুলি পরবর্তী বিলিং চক্রে প্রতিফলিত হবে।',
    subscriptionCanceled: 'সাবস্ক্রিপশন বাতিলের অনুরোধ করা হয়েছে। দয়া করে সহায়তার সাথে যোগাযোগ করুন।',
    signIn: 'সাইন ইন করুন',
    signingIn: 'সাইন ইন হচ্ছে...',
    welcomeBack: 'ফিরে আসায় স্বাগতম!',
    loginSuccessDesc: 'আপনি সফলভাবে লগ ইন করেছেন।',
    loginFailed: 'লগইন ব্যর্থ',
    invalidCredentials: 'অবৈধ ব্যবহারকারী নাম বা পাসওয়ার্ড',
    accountCreated: 'অ্যাকাউন্ট তৈরি হয়েছে!',
    accountCreatedDesc: 'অনুগ্রহ করে আপনার শংসাপত্র দিয়ে সাইন ইন করুন।',
    signUpFailed: 'সাইন আপ ব্যর্থ',
    signUpFailedDesc: 'অ্যাকাউন্ট তৈরি করা যায়নি',
    selectLanguage: 'ভাষা নির্বাচন করুন',
    restaurantManagementSystem: 'রেস্তোরাঁ ব্যবস্থাপনা সিস্টেম',
    vatDisclaimer: 'সমস্ত মূল্য সৌদি আইন অনুযায়ী 15% ভ্যাট অন্তর্ভুক্ত',
    
    // Messages
    success: 'সফল',
    error: 'ত্রুটি',
    confirmDelete: 'আপনি কি নিশ্চিত এই আইটেম মুছতে চান?',
    itemAdded: 'আইটেম সফলভাবে যোগ করা হয়েছে',
    itemUpdated: 'আইটেম সফলভাবে আপডেট করা হয়েছে',
    itemDeleted: 'আইটেম সফলভাবে মুছে ফেলা হয়েছে',
    settingsUpdated: 'সেটিংস সফলভাবে আপডেট হয়েছে',
    savingSettings: 'সংরক্ষণ করা হচ্ছে...',
    employeeCreated: 'কর্মচারী তৈরি করা হয়েছে',
    employeeUpdated: 'কর্মচারী আপডেট করা হয়েছে',
    branchCreated: 'শাখা তৈরি করা হয়েছে',
    branchUpdated: 'শাখা আপডেট করা হয়েছে',
    customerCreated: 'গ্রাহক তৈরি করা হয়েছে',
    customerUpdated: 'গ্রাহক আপডেট করা হয়েছে',
    customerDeleted: 'গ্রাহক মুছে ফেলা হয়েছে',
    recipeCreated: 'রেসিপি তৈরি করা হয়েছে',
    recipeUpdated: 'রেসিপি আপডেট করা হয়েছে',
    recipeDeleted: 'রেসিপি মুছে ফেলা হয়েছে',
    employeeCreatedDesc: 'কর্মচারী সফলভাবে তৈরি করা হয়েছে',
    employeeUpdatedDesc: 'কর্মচারী সফলভাবে আপডেট করা হয়েছে',
    branchCreatedDesc: 'শাখা সফলভাবে তৈরি করা হয়েছে',
    branchUpdatedDesc: 'শাখা সফলভাবে আপডেট করা হয়েছে',
    customerCreatedDesc: 'গ্রাহক সফলভাবে তৈরি করা হয়েছে',
    customerUpdatedDesc: 'গ্রাহক সফলভাবে আপডেট করা হয়েছে',
    customerDeletedDesc: 'গ্রাহক সফলভাবে মুছে ফেলা হয়েছে',
    recipeCreatedDesc: 'রেসিপি সফলভাবে তৈরি করা হয়েছে',
    recipeUpdatedDesc: 'রেসিপি সফলভাবে আপডেট করা হয়েছে',
    recipeDeletedDesc: 'রেসিপি সফলভাবে মুছে ফেলা হয়েছে',
    
    // Customer
    addCustomer: 'গ্রাহক যোগ করুন',
    editCustomer: 'গ্রাহক সম্পাদনা করুন',
    newCustomer: 'নতুন গ্রাহক',
    existingCustomer: 'বিদ্যমান গ্রাহক',
    selectCustomer: 'গ্রাহক নির্বাচন করুন',
    
    // Investors
    investors: 'বিনিয়োগকারী',
    investor: 'বিনিয়োগকারী',
    addInvestor: 'বিনিয়োগকারী যোগ করুন',
    editInvestor: 'বিনিয়োগকারী সম্পাদনা করুন',
    addInvestorDesc: 'তাদের আয় ট্র্যাক করতে একটি নতুন বিনিয়োগকারী যোগ করুন।',
    editInvestorDesc: 'বিনিয়োগকারীর বিবরণ আপডেট করুন।',
    investorName: 'বিনিয়োগকারীর নাম',
    enterInvestorName: 'বিনিয়োগকারীর নাম লিখুন',
    amountInvested: 'বিনিয়োগকৃত পরিমাণ',
    interestPercentage: 'সুদের হার',
    monthlyEarnings: 'মাসিক আয়',
    netProfitSummary: 'নিট লাভের সারসংক্ষেপ',
    netProfitDesc: 'সমস্ত খরচের পরে মোট নিট লাভ (বিনিয়োগকারীদের আয় গণনার জন্য ব্যবহৃত)',
    manageInvestors: 'বিনিয়োগকারীদের পরিচালনা করুন এবং তাদের আয় ট্র্যাক করুন',
    searchInvestors: 'বিনিয়োগকারী অনুসন্ধান করুন...',
    noInvestorsFound: 'কোনো বিনিয়োগকারী পাওয়া যায়নি',
    addFirstInvestor: 'শুরু করতে আপনার প্রথম বিনিয়োগকারী যোগ করুন',
    investorCreated: 'বিনিয়োগকারী তৈরি করা হয়েছে',
    investorUpdated: 'বিনিয়োগকারী আপডেট করা হয়েছে',
    investorDeleted: 'বিনিয়োগকারী মুছে ফেলা হয়েছে',
    investorCreatedDesc: 'নতুন বিনিয়োগকারী সফলভাবে যোগ করা হয়েছে।',
    investorUpdatedDesc: 'বিনিয়োগকারীর বিবরণ সফলভাবে আপডেট করা হয়েছে।',
    investorDeletedDesc: 'বিনিয়োগকারী সফলভাবে সরানো হয়েছে।',
    failedToCreateInvestor: 'বিনিয়োগকারী তৈরি করতে ব্যর্থ',
    failedToUpdateInvestor: 'বিনিয়োগকারী আপডেট করতে ব্যর্থ',
    failedToDeleteInvestor: 'বিনিয়োগকারী মুছতে ব্যর্থ',
    createInvestor: 'বিনিয়োগকারী তৈরি করুন',
    updateInvestor: 'বিনিয়োগকারী আপডেট করুন',
    confirmDeleteInvestorDesc: 'আপনি কি নিশ্চিত যে আপনি এই বিনিয়োগকারীকে মুছে ফেলতে চান? এই ক্রিয়াটি পূর্বাবস্থায় ফেরানো যাবে না।',
    interestPercentageHelp: 'অর্জিত নিট লাভের শতাংশ',
    
    // Employee Management
    employeeManagement: 'কর্মচারী ব্যবস্থাপনা',
    manageEmployees: 'কর্মচারী এবং তাদের তথ্য পরিচালনা করুন',
    addEmployee: 'কর্মচারী যোগ করুন',
    editEmployee: 'কর্মচারী সম্পাদনা করুন',
    createNewEmployee: 'নতুন কর্মচারী তৈরি করুন',
    addNewEmployeeDesc: 'আপনার সিস্টেমে একটি নতুন কর্মচারী যোগ করুন',
    createEmployee: 'কর্মচারী তৈরি করুন',
    updateEmployee: 'কর্মচারী আপডেট করুন',
    updateEmployeeInfo: 'কর্মচারী তথ্য এবং সেটিংস আপডেট করুন',
    searchEmployees: 'নাম, ব্যবহারকারীর নাম, ইমেল, ফোন বা কর্মচারী নম্বর দ্বারা কর্মচারী অনুসন্ধান করুন...',
    creating: 'তৈরি করা হচ্ছে...',
    updating: 'আপডেট করা হচ্ছে...',
    basic: 'মৌলিক',
    recruitment: 'নিয়োগ',
    vacation: 'ছুটি',
    visa: 'ভিসা',
    ticket: 'টিকিট',
    performance: 'কর্মক্ষমতা',
    compliance: 'সম্মতি',
    empFullName: 'পূর্ণ নাম',
    empUsername: 'ব্যবহারকারীর নাম',
    empPassword: 'পাসওয়ার্ড',
    empEmail: 'ইমেল',
    empPhone: 'ফোন',
    newPassword: 'নতুন পাসওয়ার্ড',
    leaveEmpty: 'বর্তমান রাখতে খালি রাখুন',
    enterNewPassword: 'নতুন পাসওয়ার্ড লিখুন বা খালি রাখুন',
    admin: 'প্রশাসক',
    employee: 'কর্মচারী',
    activeStatus: 'সক্রিয় স্থিতি',
    active: 'সক্রিয়',
    inactive: 'নিষ্ক্রিয়',
    permissions: 'অনুমতি',
    employeeNumber: 'কর্মচারী নম্বর',
    hireDate: 'নিয়োগের তারিখ',
    recruitmentSource: 'নিয়োগের উৎস',
    selectSource: 'উৎস নির্বাচন করুন',
    referral: 'রেফারেল',
    jobBoard: 'জব বোর্ড',
    agency: 'এজেন্সি',
    walkIn: 'ওয়াক-ইন',
    contractType: 'চুক্তির ধরন',
    selectType: 'ধরন নির্বাচন করুন',
    fullTime: 'পূর্ণকালীন',
    partTime: 'খণ্ডকালীন',
    contract: 'চুক্তি',
    temporary: 'অস্থায়ী',
    probationEndDate: 'পরীক্ষামূলক সমাপ্তির তারিখ',
    vacationDaysTotal: 'মোট ছুটির দিন',
    vacationDaysUsed: 'ব্যবহৃত ছুটির দিন',
    vacationDaysRemaining: 'অবশিষ্ট ছুটির দিন',
    daysLeft: 'দিন বাকি',
    visaNumber: 'ভিসা নম্বর',
    visaFees: 'ভিসা ফি',
    visaExpiryDate: 'ভিসা মেয়াদ শেষ তারিখ',
    visaStatus: 'ভিসা স্থিতি',
    selectStatus: 'স্থিতি নির্বাচন করুন',
    valid: 'বৈধ',
    expired: 'মেয়াদ উত্তীর্ণ',
    notApplicable: 'প্রযোজ্য নয়',
    ticketAmount: 'টিকিটের পরিমাণ',
    ticketDestination: 'টিকিটের গন্তব্য',
    ticketDate: 'টিকিটের তারিখ',
    ticketStatus: 'টিকিট স্থিতি',
    booked: 'বুক করা হয়েছে',
    used: 'ব্যবহৃত',
    performanceRating: 'কর্মক্ষমতা মূল্যায়ন',
    lastReviewDate: 'শেষ পর্যালোচনার তারিখ',
    performanceNotes: 'কর্মক্ষমতা মন্তব্য',
    enterPerformanceNotes: 'কর্মক্ষমতা মন্তব্য এবং প্রতিক্রিয়া লিখুন',
    
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
    tutorialStepByStepGuide: 'ধাপে ধাপে নির্দেশিকা',
    tutorialEstimatedTime: 'আনুমানিক সময়',
    
    
    // Support Tickets
    supportTickets: 'Support Tickets',
    supportTicketsDescription: 'Create and manage support tickets for technical assistance',
    createTicket: 'Create Ticket',
    myTickets: 'My Tickets',
    allTickets: 'All Tickets',
    ticketSubject: 'Subject',
    ticketCategory: 'Category',
    ticketPriority: 'Priority',
    ticketDescription: 'Description',
    ticketStatusOpen: 'Open',
    ticketStatusInProgress: 'In Progress',
    ticketStatusResolved: 'Resolved',
    ticketStatusClosed: 'Closed',
    priorityLow: 'Low',
    priorityMedium: 'Medium',
    priorityHigh: 'High',
    priorityUrgent: 'Urgent',
    categoryTechnical: 'Technical Issue',
    categoryBilling: 'Billing Question',
    categoryFeature: 'Feature Request',
    categoryOther: 'Other',
    sendMessage: 'Send Message',
    viewTicket: 'View Ticket',
    backToTickets: 'Back to Tickets',
    messages: 'Messages',
    noMessages: 'No messages yet. Start a conversation!',
    typeMessage: 'Type your message...',
    updateStatus: 'Update Status',
    ticketDetails: 'Ticket Details',
    lastUpdated: 'Last Updated',
    ticketCreated: 'Ticket Created',
    ticketResolved: 'Ticket Resolved',
    ticketClosed: 'Ticket Closed',
    itSupport: 'IT Support',
    you: 'You',
    enterSubject: 'Enter ticket subject',
    enterDescription: 'Describe your issue in detail',
    selectCategory: 'Select a category',
    selectPriority: 'Select priority level',
    ticketCreatedSuccess: 'Ticket created successfully',
    messageSent: 'Message sent',
    statusUpdated: 'Status updated successfully',
    filterByStatus: 'স্ট্যাটাস অনুসারে ফিল্টার করুন',
    subjectValidation: 'বিষয় কমপক্ষে ৫ অক্ষর হতে হবে',
    categoryValidation: 'অনুগ্রহ করে একটি বিভাগ নির্বাচন করুন',
    descriptionValidation: 'বর্ণনা কমপক্ষে ১০ অক্ষর হতে হবে',
    ticketCreatedSuccessDesc: 'আপনার সাপোর্ট টিকিট সফলভাবে তৈরি করা হয়েছে',
    failedToCreateTicket: 'টিকিট তৈরি করতে ব্যর্থ',
    failedToSendMessage: 'বার্তা পাঠাতে ব্যর্থ',
    ticketStatusUpdatedDesc: 'টিকিট স্ট্যাটাস আপডেট করা হয়েছে',
    failedToUpdateStatus: 'স্ট্যাটাস আপডেট করতে ব্যর্থ',
    categoryBugReport: 'বাগ রিপোর্ট',
    categoryGeneralQuestion: 'সাধারণ প্রশ্ন',
    viewChat: 'চ্যাট দেখুন',
    ticketNotFound: 'টিকিট পাওয়া যায়নি',
    markInProgress: 'প্রগতিতে চিহ্নিত করুন',
    markResolved: 'সমাধান হিসেবে চিহ্নিত করুন',
    closeTicket: 'টিকিট বন্ধ করুন',
    ticketClosedMessage: 'এই টিকিটটি বন্ধ এবং আর নতুন বার্তা গ্রহণ করে না',
    noTicketsYet: 'এখনও কোনো সাপোর্ট টিকিট নেই। শুরু করতে একটি তৈরি করুন!',
    createFirstTicket: 'আপনার প্রথম টিকিট তৈরি করুন',
    noTicketsWithStatus: 'এই স্ট্যাটাস সহ কোনো টিকিট পাওয়া যায়নি',
    createTicketDialogDesc: 'আপনার সমস্যা বর্ণনা করুন এবং আমাদের সাপোর্ট টিম আপনাকে সাহায্য করবে',
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
    shopTitle: 'দোকান',
    shopDescription: 'কর্মচারী বেতন এবং দোকান খরচ পরিচালনা করুন',
    employeeSalaries: 'কর্মচারী বেতন',
    manageSalaries: 'কর্মচারী বেতন পেমেন্ট এবং রেকর্ড পরিচালনা করুন',
    monthlySalary: 'মাসিক বেতন',
    paid: 'পরিশোধিত',
    notes: 'নোট',
    salaryFormDescription: 'কর্মচারী বেতন তথ্য লিখুন',
    paidSalaries: 'পরিশোধিত বেতন',
    pendingSalaries: 'অপেক্ষমাণ বেতন',
    searchSalaries: 'কর্মচারীর নাম বা পদ দ্বারা বেতন অনুসন্ধান করুন...',
    noSalaries: 'কোন বেতন পাওয়া যায়নি',
    salaryAdded: 'বেতন সফলভাবে যোগ করা হয়েছে',
    salaryUpdated: 'বেতন সফলভাবে আপডেট করা হয়েছে',
    salaryDeleted: 'বেতন সফলভাবে মুছে ফেলা হয়েছে',
    salaryError: 'বেতন প্রক্রিয়াকরণে ত্রুটি',
    manageBills: 'দোকান বিল এবং খরচ পরিচালনা করুন',
    internet: 'ইন্টারনেট',
    maintenance: 'রক্ষণাবেক্ষণ',
    billFormDescription: 'বিল তথ্য লিখুন',
    paidBills: 'পরিশোধিত বিল',
    pendingBills: 'অপেক্ষমাণ বিল',
    overdue: 'মেয়াদোত্তীর্ণ',
    searchBills: 'প্রকার বা বিবরণ দ্বারা বিল অনুসন্ধান করুন...',
    paymentPeriod: 'পেমেন্ট সময়কাল',
    oneTime: 'এককালীন পেমেন্ট',
    weekly: 'সাপ্তাহিক',
    monthly: 'মাসিক',
    quarterly: 'ত্রৈমাসিক (১/৪ বছর)',
    semiAnnually: 'অর্ধ-বার্ষিক (১/২ বছর)',
    yearly: 'বার্ষিক',
    foundational: 'মৌলিক',
    noBills: 'কোন বিল পাওয়া যায়নি',
    billAdded: 'বিল সফলভাবে যোগ করা হয়েছে',
    billUpdated: 'বিল সফলভাবে আপডেট করা হয়েছে',
    billDeleted: 'বিল সফলভাবে মুছে ফেলা হয়েছে',
    billError: 'বিল প্রক্রিয়াকরণে ত্রুটি',
    currency: 'SAR',
    saving: 'সংরক্ষণ করা হচ্ছে...',
    
    // Bills Page
    bills: 'বিল',
    sar: 'SAR',
    archived: 'সংরক্ষণাগারভুক্ত',
    yes: 'হ্যাঁ',
    no: 'না',
    exportedSuccessfully: 'সফলভাবে রপ্তানি করা হয়েছে',
    exportToExcel: 'Excel-এ রপ্তানি করুন',
    filters: 'ফিল্টার',
    filterBills: 'বিভিন্ন মানদণ্ড অনুযায়ী বিল ফিল্টার করুন',
    all: 'সব',
    startDate: 'শুরুর তারিখ',
    endDate: 'শেষ তারিখ',
    hideArchived: 'সংরক্ষণাগারভুক্ত লুকান',
    showArchived: 'সংরক্ষণাগারভুক্ত দেখান',
    billsList: 'বিলের তালিকা',
    billsFound: 'বিল পাওয়া গেছে',
    noBillsFound: 'কোন বিল পাওয়া যায়নি',
    actions: 'কর্ম',
    
    // Welcome Video Slides
    videoSlide1Title: 'আহমাদের সাথে দেখা করুন - রেস্তোরাঁ মালিক',
    videoSlide1Subtitle: 'ম্যানুয়াল ইনভেন্টরি, হারানো অর্ডার, এবং কমতে থাকা লাভের সাথে লড়াই',
    videoSlide2Title: 'রিয়েল-টাইম POS সিস্টেম',
    videoSlide2Subtitle: 'তাৎক্ষণিক অর্ডার প্রসেস করুন • লাইভ বিক্রয় ট্র্যাক করুন • একাধিক পেমেন্ট পদ্ধতি',
    videoSlide3Title: 'স্মার্ট ইনভেন্টরি ম্যানেজমেন্ট',
    videoSlide3Subtitle: 'স্বয়ংক্রিয় স্টক কর্তন • কম স্টক সতর্কতা • উপাদান কখনও শেষ হবে না',
    videoSlide4Title: 'ZATCA-সম্মত চালান',
    videoSlide4Subtitle: 'তাৎক্ষণিক দ্বিভাষিক চালান তৈরি করুন • QR কোড • সম্পূর্ণ কর সম্মতি',
    videoSlide5Title: 'শক্তিশালী বিশ্লেষণ ড্যাশবোর্ড',
    videoSlide5Subtitle: 'লাভজনকতা ট্র্যাক করুন • চাহিদার পূর্বাভাস দিন • ডেটা-চালিত সিদ্ধান্ত নিন',
    videoSlide6Title: 'আহমাদের সাফল্যের গল্প',
    videoSlide6Subtitle: '300% রাজস্ব বৃদ্ধি • 5টি নতুন শাখা • হাজার হাজার সমৃদ্ধ রেস্তোরাঁয় যোগ দিন',
    unarchive: 'সংরক্ষণাগার থেকে বের করুন',
    archive: 'সংরক্ষণাগারভুক্ত করুন',
    somethingWentWrong: 'কিছু ভুল হয়েছে',
    
    // Toast Messages & Notifications
    procurementCreated: 'ক্রয় আইটেম সফলভাবে তৈরি করা হয়েছে',
    procurementUpdated: 'ক্রয় আইটেম সফলভাবে আপডেট করা হয়েছে',
    procurementDeleted: 'ক্রয় আইটেম সফলভাবে মুছে ফেলা হয়েছে',
    orderCompleted: 'অর্ডার সফলভাবে সম্পন্ন হয়েছে',
    orderCompletedDesc: 'অর্ডার দেওয়া হয়েছে এবং চালান তৈরি করা হয়েছে',
    failedToLogout: 'লগ আউট ব্যর্থ হয়েছে। অনুগ্রহ করে আবার চেষ্টা করুন।',
    failedToCreateBranch: 'শাখা তৈরি করতে ব্যর্থ',
    failedToUpdateBranch: 'শাখা আপডেট করতে ব্যর্থ',
    failedToCreateCustomer: 'গ্রাহক তৈরি করতে ব্যর্থ',
    failedToUpdateCustomer: 'গ্রাহক আপডেট করতে ব্যর্থ',
    failedToDeleteCustomer: 'গ্রাহক মুছতে ব্যর্থ',
    failedToExportCustomers: 'গ্রাহক ডেটা রপ্তানি করতে ব্যর্থ',
    failedToExportPDF: 'PDF রপ্তানি করতে ব্যর্থ',
    failedToExportExcel: 'Excel রপ্তানি করতে ব্যর্থ',
    failedToCreateDeliveryApp: 'ডেলিভারি অ্যাপ তৈরি করতে ব্যর্থ',
    failedToUpdateDeliveryApp: 'ডেলিভারি অ্যাপ আপডেট করতে ব্যর্থ',
    failedToDeleteDeliveryApp: 'ডেলিভারি অ্যাপ মুছতে ব্যর্থ',
    failedToUpdateOrder: 'অর্ডার আপডেট করতে ব্যর্থ',
    failedToCreateEmployee: 'কর্মচারী তৈরি করতে ব্যর্থ',
    failedToUpdateEmployee: 'কর্মচারী আপডেট করতে ব্যর্থ',
    failedToExportFinancial: 'আর্থিক ডেটা রপ্তানি করতে ব্যর্থ',
    exportFailed: 'রপ্তানি ব্যর্থ',
    failedToResetPassword: 'পাসওয়ার্ড রিসেট করতে ব্যর্থ',
    failedToSendResetEmail: 'রিসেট ইমেল পাঠাতে ব্যর্থ',
    failedToUpdateDevicePreference: 'ডিভাইস পছন্দ আপডেট করতে ব্যর্থ',
    failedToExportProfitability: 'লাভজনকতা ডেটা রপ্তানি করতে ব্যর্থ',
    failedToCreateAdminAccount: 'অ্যাডমিন অ্যাকাউন্ট তৈরি করতে ব্যর্থ',
    failedToCreateRecipe: 'রেসিপি তৈরি করতে ব্যর্থ',
    failedToUpdateRecipe: 'রেসিপি আপডেট করতে ব্যর্থ',
    failedToDeleteRecipe: 'রেসিপি মুছতে ব্যর্থ',
    couldNotSaveNewOrder: 'নতুন অর্ডার সংরক্ষণ করতে পারিনি',
    couldNotCreateRecipe: 'রেসিপি তৈরি করতে পারিনি',
    couldNotUpdateRecipe: 'রেসিপি আপডেট করতে পারিনি',
    couldNotDeleteRecipe: 'রেসিপি মুছতে পারিনি',
    failedToFetchBills: 'বিল আনতে ব্যর্থ',
    invalidResetLink: 'অবৈধ রিসেট লিঙ্ক',
    invalidResetLinkDesc: 'পাসওয়ার্ড রিসেট লিঙ্কটি অবৈধ বা মেয়াদ শেষ হয়ে গেছে।',
    passwordsDontMatch: 'পাসওয়ার্ড মিলছে না',
    passwordsDontMatchDesc: 'অনুগ্রহ করে নিশ্চিত করুন যে উভয় পাসওয়ার্ড একই।',
    passwordTooShort: 'পাসওয়ার্ড খুব ছোট',
    passwordTooShortDesc: 'পাসওয়ার্ড কমপক্ষে 6 অক্ষরের হতে হবে।',
    passwordResetSuccessful: 'পাসওয়ার্ড রিসেট সফল',
    passwordResetSuccessfulDesc: 'আপনি এখন আপনার নতুন পাসওয়ার্ড দিয়ে লগ ইন করতে পারেন।',
    resetEmailSent: 'রিসেট ইমেল পাঠানো হয়েছে',
    resetEmailSentDesc: 'পাসওয়ার্ড রিসেট নির্দেশাবলীর জন্য আপনার ইমেল চেক করুন।',
    resetPasswordDesc: 'নিচে আপনার নতুন পাসওয়ার্ড লিখুন। এটি কমপক্ষে 6 অক্ষরের হতে হবে।',
    forgotPasswordDesc: 'আপনার ইমেল ঠিকানা লিখুন এবং আমরা আপনাকে পাসওয়ার্ড রিসেট করার নির্দেশাবলী পাঠাব।',
    pleaseTryAgainOrRequestNew: 'অনুগ্রহ করে আবার চেষ্টা করুন বা নতুন রিসেট লিঙ্কের অনুরোধ করুন।',
    pleaseTryAgainLater: 'অনুগ্রহ করে পরে আবার চেষ্টা করুন।',
    
    // Additional Pages
    deliveryProfitability: 'ডেলিভারি লাভজনকতা',
    salesComparison: 'বিক্রয় তুলনা',
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
