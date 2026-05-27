import type { Language } from "./translations";

export type RealEstateT = {
  // Breadcrumb / shared
  propertyManagement: string;
  loading: string;
  noData: string;
  cancel: string;
  save: string;
  create: string;
  edit: string;
  deleteAction: string;
  actions: string;
  error: string;
  cannotDelete: string;
  none: string;
  optional: string;
  yes: string;
  no: string;
  pdf: string;
  statusLabel: string;
  active: string;
  active_yes: string;
  active_no: string;

  // Status / priority (canonical keys, snake_case)
  status_available: string;
  status_rented: string;
  status_active: string;
  status_draft: string;
  status_expired: string;
  status_terminated: string;
  status_renewed: string;
  status_pending: string;
  status_paid: string;
  status_partial: string;
  status_overdue: string;
  status_cancelled: string;
  status_open: string;
  status_assigned: string;
  status_in_progress: string;
  status_completed: string;
  status_under_maintenance: string;
  status_for_sale: string;
  status_inactive: string;

  priority_low: string;
  priority_medium: string;
  priority_high: string;
  priority_urgent: string;

  // Property types
  type_residential: string;
  type_commercial: string;
  type_industrial: string;
  type_land: string;
  type_villa: string;
  type_apartment: string;
  type_office: string;
  type_warehouse: string;
  type_mall: string;
  type_compound: string;
  type_hotel: string;
  type_showroom: string;
  type_clinic: string;
  type_other: string;

  // Expense categories
  cat_maintenance: string;
  cat_utilities: string;
  cat_insurance: string;
  cat_tax: string;
  cat_management_fee: string;
  cat_salary: string;
  cat_marketing: string;
  cat_renovation: string;
  cat_legal: string;
  cat_other: string;

  // Payment frequency / methods / id types
  freq_monthly: string;
  freq_quarterly: string;
  freq_biannual: string;
  freq_annual: string;
  method_cash: string;
  method_bank_transfer: string;
  method_cheque: string;
  method_online: string;
  id_national_id: string;
  id_iqama: string;
  id_passport: string;

  // Accounting types
  acct_asset: string;
  acct_liability: string;
  acct_equity: string;
  acct_revenue: string;
  acct_expense: string;

  // Dashboard
  dashboardSubtitle: string;
  properties: string;
  units: string;
  tenants: string;
  contracts: string;
  invoices: string;
  payments: string;
  expenses: string;
  maintenance: string;
  reports: string;
  accounting: string;
  activeContracts: string;
  occupancy: string;
  occupied: string;
  available: string;
  mtdRevenue: string;
  ytdRevenue: string;
  receivables: string;
  overdue: string;
  quickAccess: string;
  recentAlerts: string;

  // Properties page
  propertiesSubtitle: string;
  addProperty: string;
  newProperty: string;
  editProperty: string;
  name: string;
  typeLabel: string;
  city: string;
  district: string;
  address: string;
  areaSqm: string;
  floors: string;
  yearBuilt: string;
  ownerName: string;
  purchasePrice: string;
  currentValue: string;
  notes: string;
  noProperties: string;
  confirmDeleteProperty: string;
  propertyCreated: string;
  propertyUpdated: string;
  propertyDeleted: string;

  // Units page
  unitsSubtitle: string;
  addUnit: string;
  newUnit: string;
  editUnit: string;
  allProperties: string;
  unitNumberShort: string;
  property: string;
  bedBath: string;
  monthlyRent: string;
  unitNumber: string;
  floor: string;
  bedrooms: string;
  bathrooms: string;
  parking: string;
  unitTypeHint: string;
  noUnits: string;
  confirmDeleteUnit: string;
  unitCreated: string;
  unitUpdated: string;
  unitDeleted: string;

  // Tenants page
  tenantsSubtitle: string;
  addTenant: string;
  newTenant: string;
  editTenant: string;
  fullName: string;
  idLabel: string;
  phone: string;
  email: string;
  company: string;
  idType: string;
  idNumber: string;
  nationality: string;
  companyName: string;
  crNumber: string;
  noTenants: string;
  confirmDeleteTenant: string;
  tenantCreated: string;
  tenantUpdated: string;
  tenantDeleted: string;

  // Contracts page
  rentalContracts: string;
  contractsSubtitle: string;
  newContract: string;
  newRentalContract: string;
  contractNumber: string;
  tenant: string;
  unit: string;
  period: string;
  noContracts: string;
  selectUnit: string;
  selectTenant: string;
  startDate: string;
  endDate: string;
  durationMonths: string;
  monthlyRentSar: string;
  securityDeposit: string;
  paymentFrequency: string;
  paymentDay: string;
  vatRate: string;
  autoRenewOnExpiry: string;
  termsAndConditions: string;
  terminate: string;
  terminateContract: string;
  terminationReason: string;
  terminationReasonPlaceholder: string;
  contractCreated: string;
  contractTerminated: string;
  pdfError: string;
  perMo: string;
  downloadPdf: string;

  // Invoices page
  rentalInvoices: string;
  invoicesSubtitle: string;
  allStatuses: string;
  invoiceNumber: string;
  issued: string;
  due: string;
  total: string;
  paidCol: string;
  noInvoices: string;
  recordPayment: string;
  balanceDue: string;
  amountSar: string;
  dateLabel: string;
  method: string;
  referenceNo: string;
  bankName: string;
  record: string;
  paymentRecorded: string;

  // Payments page
  paymentsSubtitle: string;
  receipt: string;
  reference: string;
  noPayments: string;

  // Expenses page
  propertyExpenses: string;
  expensesSubtitle: string;
  addExpense: string;
  newExpense: string;
  editExpense: string;
  category: string;
  descriptionLabel: string;
  amount: string;
  vendor: string;
  vatSar: string;
  vendorName: string;
  expenseDate: string;
  dueDate: string;
  paidDate: string;
  noExpenses: string;
  confirmDelete: string;
  expenseCreated: string;
  expenseUpdated: string;
  expenseDeleted: string;

  // Maintenance page
  maintenanceRequests: string;
  maintenanceSubtitle: string;
  newRequest: string;
  newMaintenanceRequest: string;
  editRequest: string;
  reported: string;
  title: string;
  priority: string;
  cost: string;
  noRequests: string;
  unitOptional: string;
  vendorContact: string;
  estimatedCost: string;
  actualCost: string;
  reportedDate: string;
  scheduled: string;
  completed: string;
  maintCategoryHint: string;
  requestCreated: string;
  requestUpdated: string;
  requestDeleted: string;

  // Reports page
  reportsSubtitle: string;
  from: string;
  to: string;
  incomeStatement: string;
  cashFlow: string;
  balanceSheet: string;
  rentRoll: string;
  agingReceivables: string;
  revenue: string;
  expensesTotal: string;
  netOperatingIncome: string;
  expensesByCategory: string;
  cashIn: string;
  cashOut: string;
  net: string;
  month: string;
  running: string;
  assets: string;
  liabilities: string;
  equity: string;
  propertyValue: string;
  cashOnHand: string;
  bank: string;
  securityDeposits: string;
  vatPayable: string;
  current: string;
  d30: string;
  d60: string;
  d90: string;
  d90plus: string;
  totalUnits: string;
  rentedCol: string;
  rate: string;

  // Accounting page
  accountingSubtitle: string;
  initializeStandardCoa: string;
  chartOfAccounts: string;
  journal: string;
  trialBalance: string;
  code: string;
  nameAr: string;
  noAccountsHint: string;
  entryNumber: string;
  description: string;
  account: string;
  debit: string;
  credit: string;
  chartEnsured: string;
  noJournalEntries: string;

  // Property detail
  backToProperties: string;
  details: string;
  owner: string;
  area: string;
  unitsInProperty: string;
  revenueYtd: string;
  expensesYtd: string;
  sqm: string;
};

const en: RealEstateT = {
  propertyManagement: "Property Management",
  loading: "Loading…",
  noData: "No data",
  cancel: "Cancel",
  save: "Save",
  create: "Create",
  edit: "Edit",
  deleteAction: "Delete",
  actions: "Actions",
  error: "Error",
  cannotDelete: "Cannot delete",
  none: "None",
  optional: "optional",
  yes: "Yes",
  no: "No",
  pdf: "PDF",
  statusLabel: "Status",
  active: "Active",
  active_yes: "Yes",
  active_no: "No",

  status_available: "available",
  status_rented: "rented",
  status_active: "active",
  status_draft: "draft",
  status_expired: "expired",
  status_terminated: "terminated",
  status_renewed: "renewed",
  status_pending: "pending",
  status_paid: "paid",
  status_partial: "partial",
  status_overdue: "overdue",
  status_cancelled: "cancelled",
  status_open: "open",
  status_assigned: "assigned",
  status_in_progress: "in progress",
  status_completed: "completed",
  status_under_maintenance: "under maintenance",
  status_for_sale: "for sale",
  status_inactive: "inactive",

  priority_low: "low",
  priority_medium: "medium",
  priority_high: "high",
  priority_urgent: "urgent",

  type_residential: "residential",
  type_commercial: "commercial",
  type_industrial: "industrial",
  type_land: "land",
  type_villa: "villa",
  type_apartment: "apartment",
  type_office: "office",
  type_warehouse: "warehouse",
  type_mall: "mall",
  type_compound: "compound",
  type_hotel: "hotel",
  type_showroom: "showroom",
  type_clinic: "clinic",
  type_other: "other",

  cat_maintenance: "maintenance",
  cat_utilities: "utilities",
  cat_insurance: "insurance",
  cat_tax: "tax",
  cat_management_fee: "management fee",
  cat_salary: "salary",
  cat_marketing: "marketing",
  cat_renovation: "renovation",
  cat_legal: "legal",
  cat_other: "other",

  freq_monthly: "monthly",
  freq_quarterly: "quarterly",
  freq_biannual: "biannual",
  freq_annual: "annual",
  method_cash: "cash",
  method_bank_transfer: "bank transfer",
  method_cheque: "cheque",
  method_online: "online",
  id_national_id: "national id",
  id_iqama: "iqama",
  id_passport: "passport",
  acct_asset: "Asset",
  acct_liability: "Liability",
  acct_equity: "Equity",
  acct_revenue: "Revenue",
  acct_expense: "Expense",

  dashboardSubtitle: "Manage properties, tenants, contracts, invoices, and accounting",
  properties: "Properties",
  units: "Units",
  tenants: "Tenants",
  contracts: "Contracts",
  invoices: "Invoices",
  payments: "Payments",
  expenses: "Expenses",
  maintenance: "Maintenance",
  reports: "Reports",
  accounting: "Accounting",
  activeContracts: "Active Contracts",
  occupancy: "Occupancy",
  occupied: "Occupied",
  available: "Available",
  mtdRevenue: "MTD Revenue",
  ytdRevenue: "YTD Revenue",
  receivables: "Receivables",
  overdue: "Overdue",
  quickAccess: "Quick Access",
  recentAlerts: "Recent Alerts",

  propertiesSubtitle: "Real estate assets in your portfolio",
  addProperty: "Add Property",
  newProperty: "New Property",
  editProperty: "Edit Property",
  name: "Name",
  typeLabel: "Type",
  city: "City",
  district: "District",
  address: "Address",
  areaSqm: "Area (sqm)",
  floors: "Floors",
  yearBuilt: "Year Built",
  ownerName: "Owner Name",
  purchasePrice: "Purchase Price (SAR)",
  currentValue: "Current Value",
  notes: "Notes",
  noProperties: "No properties yet",
  confirmDeleteProperty: "Delete this property?",
  propertyCreated: "Property created",
  propertyUpdated: "Property updated",
  propertyDeleted: "Property deleted",

  unitsSubtitle: "Rentable units within properties",
  addUnit: "Add Unit",
  newUnit: "New Unit",
  editUnit: "Edit Unit",
  allProperties: "All properties",
  unitNumberShort: "Unit #",
  property: "Property",
  bedBath: "Bed/Bath",
  monthlyRent: "Monthly Rent",
  unitNumber: "Unit Number",
  floor: "Floor",
  bedrooms: "Bedrooms",
  bathrooms: "Bathrooms",
  parking: "Parking",
  unitTypeHint: "apartment / office / studio",
  noUnits: "No units",
  confirmDeleteUnit: "Delete this unit?",
  unitCreated: "Unit created",
  unitUpdated: "Unit updated",
  unitDeleted: "Unit deleted",

  tenantsSubtitle: "Individuals and companies renting your units",
  addTenant: "Add Tenant",
  newTenant: "New Tenant",
  editTenant: "Edit Tenant",
  fullName: "Full Name",
  idLabel: "ID",
  phone: "Phone",
  email: "Email",
  company: "Company",
  idType: "ID Type",
  idNumber: "ID Number",
  nationality: "Nationality",
  companyName: "Company Name",
  crNumber: "CR Number",
  noTenants: "No tenants",
  confirmDeleteTenant: "Delete this tenant?",
  tenantCreated: "Tenant created",
  tenantUpdated: "Tenant updated",
  tenantDeleted: "Tenant deleted",

  rentalContracts: "Rental Contracts",
  contractsSubtitle: "Lease agreements & rent schedules",
  newContract: "New Contract",
  newRentalContract: "New Rental Contract",
  contractNumber: "Contract #",
  tenant: "Tenant",
  unit: "Unit",
  period: "Period",
  noContracts: "No contracts",
  selectUnit: "Select unit",
  selectTenant: "Select tenant",
  startDate: "Start Date",
  endDate: "End Date",
  durationMonths: "Duration (months)",
  monthlyRentSar: "Monthly Rent (SAR)",
  securityDeposit: "Security Deposit (SAR)",
  paymentFrequency: "Payment Frequency",
  paymentDay: "Payment Day (1-28)",
  vatRate: "VAT Rate (%)",
  autoRenewOnExpiry: "Auto-renew on expiry",
  termsAndConditions: "Terms & Conditions",
  terminate: "Terminate",
  terminateContract: "Terminate Contract",
  terminationReason: "Termination Reason",
  terminationReasonPlaceholder: "Reason for termination...",
  contractCreated: "Contract created",
  contractTerminated: "Contract terminated",
  pdfError: "PDF error",
  perMo: "/mo",
  downloadPdf: "Download PDF",

  rentalInvoices: "Rental Invoices",
  invoicesSubtitle: "Generated invoices and balances",
  allStatuses: "All statuses",
  invoiceNumber: "Invoice #",
  issued: "Issued",
  due: "Due",
  total: "Total",
  paidCol: "Paid",
  noInvoices: "No invoices",
  recordPayment: "Record Payment",
  balanceDue: "Balance due",
  amountSar: "Amount (SAR)",
  dateLabel: "Date",
  method: "Method",
  referenceNo: "Reference #",
  bankName: "Bank Name",
  record: "Record",
  paymentRecorded: "Payment recorded",

  paymentsSubtitle: "All rental payments received",
  receipt: "Receipt",
  reference: "Reference",
  noPayments: "No payments",

  propertyExpenses: "Property Expenses",
  expensesSubtitle: "Operating costs by property",
  addExpense: "Add Expense",
  newExpense: "New Expense",
  editExpense: "Edit Expense",
  category: "Category",
  descriptionLabel: "Description",
  amount: "Amount",
  vendor: "Vendor",
  vatSar: "VAT (SAR)",
  vendorName: "Vendor Name",
  expenseDate: "Expense Date",
  dueDate: "Due Date",
  paidDate: "Paid Date",
  noExpenses: "No expenses",
  confirmDelete: "Delete?",
  expenseCreated: "Expense created",
  expenseUpdated: "Expense updated",
  expenseDeleted: "Expense deleted",

  maintenanceRequests: "Maintenance Requests",
  maintenanceSubtitle: "Track upkeep and repairs",
  newRequest: "New Request",
  newMaintenanceRequest: "New Maintenance Request",
  editRequest: "Edit Request",
  reported: "Reported",
  title: "Title",
  priority: "Priority",
  cost: "Cost",
  noRequests: "No requests",
  unitOptional: "Unit (optional)",
  vendorContact: "Vendor Contact",
  estimatedCost: "Estimated Cost (SAR)",
  actualCost: "Actual Cost (SAR)",
  reportedDate: "Reported Date",
  scheduled: "Scheduled",
  completed: "Completed",
  maintCategoryHint: "plumbing / electrical / hvac",
  requestCreated: "Request created",
  requestUpdated: "Request updated",
  requestDeleted: "Request deleted",

  reportsSubtitle: "Financial & operational reports",
  from: "From",
  to: "To",
  incomeStatement: "Income Statement",
  cashFlow: "Cash Flow",
  balanceSheet: "Balance Sheet",
  rentRoll: "Rent Roll",
  agingReceivables: "Aging Receivables",
  revenue: "Revenue",
  expensesTotal: "Expenses",
  netOperatingIncome: "Net Operating Income",
  expensesByCategory: "Expenses by Category",
  cashIn: "Cash In",
  cashOut: "Cash Out",
  net: "Net",
  month: "Month",
  running: "Running",
  assets: "Assets",
  liabilities: "Liabilities",
  equity: "Equity",
  propertyValue: "Property Value",
  cashOnHand: "Cash on Hand",
  bank: "Bank",
  securityDeposits: "Security Deposits",
  vatPayable: "VAT Payable",
  current: "Current",
  d30: "1-30 days",
  d60: "31-60 days",
  d90: "61-90 days",
  d90plus: "90+ days",
  totalUnits: "Total Units",
  rentedCol: "Rented",
  rate: "Rate",

  accountingSubtitle: "Double-entry chart of accounts, journal, and trial balance",
  initializeStandardCoa: "Initialize Standard COA",
  chartOfAccounts: "Chart of Accounts",
  journal: "Journal",
  trialBalance: "Trial Balance",
  code: "Code",
  nameAr: "Name (AR)",
  noAccountsHint: 'No accounts. Click "Initialize Standard COA".',
  entryNumber: "Entry #",
  description: "Description",
  account: "Account",
  debit: "Debit",
  credit: "Credit",
  chartEnsured: "Chart of accounts ensured",
  noJournalEntries: "No journal entries",

  backToProperties: "Back to Properties",
  details: "Details",
  owner: "Owner",
  area: "Area",
  unitsInProperty: "Units in this Property",
  revenueYtd: "Revenue (YTD)",
  expensesYtd: "Expenses (YTD)",
  sqm: "sqm",
};

const ar: RealEstateT = {
  propertyManagement: "إدارة الأملاك",
  loading: "جارٍ التحميل…",
  noData: "لا توجد بيانات",
  cancel: "إلغاء",
  save: "حفظ",
  create: "إنشاء",
  edit: "تعديل",
  deleteAction: "حذف",
  actions: "الإجراءات",
  error: "خطأ",
  cannotDelete: "لا يمكن الحذف",
  none: "لا شيء",
  optional: "اختياري",
  yes: "نعم",
  no: "لا",
  pdf: "PDF",
  statusLabel: "الحالة",
  active: "نشط",
  active_yes: "نعم",
  active_no: "لا",

  status_available: "متاحة",
  status_rented: "مؤجرة",
  status_active: "نشط",
  status_draft: "مسودة",
  status_expired: "منتهي",
  status_terminated: "ملغي",
  status_renewed: "مجدد",
  status_pending: "قيد الانتظار",
  status_paid: "مدفوعة",
  status_partial: "جزئي",
  status_overdue: "متأخر",
  status_cancelled: "ملغى",
  status_open: "مفتوح",
  status_assigned: "مُسند",
  status_in_progress: "قيد التنفيذ",
  status_completed: "مكتمل",
  status_under_maintenance: "تحت الصيانة",
  status_for_sale: "للبيع",
  status_inactive: "غير نشط",

  priority_low: "منخفضة",
  priority_medium: "متوسطة",
  priority_high: "عالية",
  priority_urgent: "عاجلة",

  type_residential: "سكني",
  type_commercial: "تجاري",
  type_industrial: "صناعي",
  type_land: "أرض",
  type_villa: "فيلا",
  type_apartment: "شقة",
  type_office: "مكتب",
  type_warehouse: "مستودع",
  type_mall: "مول",
  type_compound: "مجمع سكني",
  type_hotel: "فندق",
  type_showroom: "صالة عرض",
  type_clinic: "عيادة",
  type_other: "أخرى",

  cat_maintenance: "صيانة",
  cat_utilities: "خدمات",
  cat_insurance: "تأمين",
  cat_tax: "ضرائب",
  cat_management_fee: "رسوم إدارة",
  cat_salary: "رواتب",
  cat_marketing: "تسويق",
  cat_renovation: "تجديد",
  cat_legal: "قانوني",
  cat_other: "أخرى",

  freq_monthly: "شهري",
  freq_quarterly: "ربع سنوي",
  freq_biannual: "نصف سنوي",
  freq_annual: "سنوي",
  method_cash: "نقدي",
  method_bank_transfer: "تحويل بنكي",
  method_cheque: "شيك",
  method_online: "إلكتروني",
  id_national_id: "هوية وطنية",
  id_iqama: "إقامة",
  id_passport: "جواز سفر",
  acct_asset: "أصل",
  acct_liability: "التزام",
  acct_equity: "حقوق ملكية",
  acct_revenue: "إيراد",
  acct_expense: "مصروف",

  dashboardSubtitle: "إدارة العقارات والمستأجرين والعقود والفواتير والمحاسبة",
  properties: "العقارات",
  units: "الوحدات",
  tenants: "المستأجرون",
  contracts: "العقود",
  invoices: "الفواتير",
  payments: "المدفوعات",
  expenses: "المصروفات",
  maintenance: "الصيانة",
  reports: "التقارير",
  accounting: "المحاسبة",
  activeContracts: "العقود النشطة",
  occupancy: "نسبة الإشغال",
  occupied: "مشغولة",
  available: "متاحة",
  mtdRevenue: "إيرادات الشهر",
  ytdRevenue: "إيرادات السنة",
  receivables: "الذمم المدينة",
  overdue: "متأخرات",
  quickAccess: "وصول سريع",
  recentAlerts: "التنبيهات الأخيرة",

  propertiesSubtitle: "الأصول العقارية في محفظتك",
  addProperty: "إضافة عقار",
  newProperty: "عقار جديد",
  editProperty: "تعديل العقار",
  name: "الاسم",
  typeLabel: "النوع",
  city: "المدينة",
  district: "الحي",
  address: "العنوان",
  areaSqm: "المساحة (م²)",
  floors: "عدد الطوابق",
  yearBuilt: "سنة البناء",
  ownerName: "اسم المالك",
  purchasePrice: "سعر الشراء (ر.س)",
  currentValue: "القيمة الحالية",
  notes: "ملاحظات",
  noProperties: "لا توجد عقارات بعد",
  confirmDeleteProperty: "هل تريد حذف هذا العقار؟",
  propertyCreated: "تم إنشاء العقار",
  propertyUpdated: "تم تحديث العقار",
  propertyDeleted: "تم حذف العقار",

  unitsSubtitle: "وحدات قابلة للتأجير ضمن العقارات",
  addUnit: "إضافة وحدة",
  newUnit: "وحدة جديدة",
  editUnit: "تعديل الوحدة",
  allProperties: "كل العقارات",
  unitNumberShort: "رقم الوحدة",
  property: "العقار",
  bedBath: "غرف نوم / حمامات",
  monthlyRent: "الإيجار الشهري",
  unitNumber: "رقم الوحدة",
  floor: "الطابق",
  bedrooms: "غرف النوم",
  bathrooms: "الحمامات",
  parking: "مواقف السيارات",
  unitTypeHint: "شقة / مكتب / استوديو",
  noUnits: "لا توجد وحدات",
  confirmDeleteUnit: "هل تريد حذف هذه الوحدة؟",
  unitCreated: "تم إنشاء الوحدة",
  unitUpdated: "تم تحديث الوحدة",
  unitDeleted: "تم حذف الوحدة",

  tenantsSubtitle: "الأفراد والشركات الذين يستأجرون الوحدات",
  addTenant: "إضافة مستأجر",
  newTenant: "مستأجر جديد",
  editTenant: "تعديل المستأجر",
  fullName: "الاسم الكامل",
  idLabel: "الهوية",
  phone: "الهاتف",
  email: "البريد الإلكتروني",
  company: "الشركة",
  idType: "نوع الهوية",
  idNumber: "رقم الهوية",
  nationality: "الجنسية",
  companyName: "اسم الشركة",
  crNumber: "رقم السجل التجاري",
  noTenants: "لا يوجد مستأجرون",
  confirmDeleteTenant: "هل تريد حذف هذا المستأجر؟",
  tenantCreated: "تم إنشاء المستأجر",
  tenantUpdated: "تم تحديث المستأجر",
  tenantDeleted: "تم حذف المستأجر",

  rentalContracts: "عقود الإيجار",
  contractsSubtitle: "اتفاقيات الإيجار وجداول الدفع",
  newContract: "عقد جديد",
  newRentalContract: "عقد إيجار جديد",
  contractNumber: "رقم العقد",
  tenant: "المستأجر",
  unit: "الوحدة",
  period: "الفترة",
  noContracts: "لا توجد عقود",
  selectUnit: "اختر الوحدة",
  selectTenant: "اختر المستأجر",
  startDate: "تاريخ البداية",
  endDate: "تاريخ النهاية",
  durationMonths: "المدة (أشهر)",
  monthlyRentSar: "الإيجار الشهري (ر.س)",
  securityDeposit: "مبلغ التأمين (ر.س)",
  paymentFrequency: "تكرار الدفع",
  paymentDay: "يوم الدفع (1-28)",
  vatRate: "نسبة ضريبة القيمة المضافة (%)",
  autoRenewOnExpiry: "تجديد تلقائي عند انتهاء العقد",
  termsAndConditions: "الشروط والأحكام",
  terminate: "إنهاء",
  terminateContract: "إنهاء العقد",
  terminationReason: "سبب الإنهاء",
  terminationReasonPlaceholder: "سبب إنهاء العقد…",
  contractCreated: "تم إنشاء العقد",
  contractTerminated: "تم إنهاء العقد",
  pdfError: "خطأ في إنشاء PDF",
  perMo: "/شهري",
  downloadPdf: "تحميل PDF",

  rentalInvoices: "فواتير الإيجار",
  invoicesSubtitle: "الفواتير الصادرة والأرصدة",
  allStatuses: "كل الحالات",
  invoiceNumber: "رقم الفاتورة",
  issued: "الإصدار",
  due: "الاستحقاق",
  total: "الإجمالي",
  paidCol: "المدفوع",
  noInvoices: "لا توجد فواتير",
  recordPayment: "تسجيل دفعة",
  balanceDue: "الرصيد المستحق",
  amountSar: "المبلغ (ر.س)",
  dateLabel: "التاريخ",
  method: "طريقة الدفع",
  referenceNo: "رقم المرجع",
  bankName: "اسم البنك",
  record: "تسجيل",
  paymentRecorded: "تم تسجيل الدفعة",

  paymentsSubtitle: "جميع مدفوعات الإيجار المستلمة",
  receipt: "إيصال",
  reference: "المرجع",
  noPayments: "لا توجد مدفوعات",

  propertyExpenses: "مصروفات العقارات",
  expensesSubtitle: "تكاليف التشغيل حسب العقار",
  addExpense: "إضافة مصروف",
  newExpense: "مصروف جديد",
  editExpense: "تعديل المصروف",
  category: "الفئة",
  descriptionLabel: "الوصف",
  amount: "المبلغ",
  vendor: "المورد",
  vatSar: "ضريبة القيمة المضافة (ر.س)",
  vendorName: "اسم المورد",
  expenseDate: "تاريخ المصروف",
  dueDate: "تاريخ الاستحقاق",
  paidDate: "تاريخ السداد",
  noExpenses: "لا توجد مصروفات",
  confirmDelete: "هل تريد الحذف؟",
  expenseCreated: "تم إنشاء المصروف",
  expenseUpdated: "تم تحديث المصروف",
  expenseDeleted: "تم حذف المصروف",

  maintenanceRequests: "طلبات الصيانة",
  maintenanceSubtitle: "متابعة أعمال الصيانة والإصلاح",
  newRequest: "طلب جديد",
  newMaintenanceRequest: "طلب صيانة جديد",
  editRequest: "تعديل الطلب",
  reported: "تاريخ البلاغ",
  title: "العنوان",
  priority: "الأولوية",
  cost: "التكلفة",
  noRequests: "لا توجد طلبات",
  unitOptional: "الوحدة (اختياري)",
  vendorContact: "بيانات المورد",
  estimatedCost: "التكلفة المقدرة (ر.س)",
  actualCost: "التكلفة الفعلية (ر.س)",
  reportedDate: "تاريخ البلاغ",
  scheduled: "المجدول",
  completed: "تاريخ الإنجاز",
  maintCategoryHint: "سباكة / كهرباء / تكييف",
  requestCreated: "تم إنشاء الطلب",
  requestUpdated: "تم تحديث الطلب",
  requestDeleted: "تم حذف الطلب",

  reportsSubtitle: "التقارير المالية والتشغيلية",
  from: "من",
  to: "إلى",
  incomeStatement: "قائمة الدخل",
  cashFlow: "التدفق النقدي",
  balanceSheet: "الميزانية العمومية",
  rentRoll: "كشف الإيجارات",
  agingReceivables: "أعمار الذمم المدينة",
  revenue: "الإيرادات",
  expensesTotal: "المصروفات",
  netOperatingIncome: "صافي دخل التشغيل",
  expensesByCategory: "المصروفات حسب الفئة",
  cashIn: "تدفق داخل",
  cashOut: "تدفق خارج",
  net: "الصافي",
  month: "الشهر",
  running: "الرصيد المتراكم",
  assets: "الأصول",
  liabilities: "الالتزامات",
  equity: "حقوق الملكية",
  propertyValue: "قيمة العقارات",
  cashOnHand: "النقد في الصندوق",
  bank: "البنك",
  securityDeposits: "ودائع التأمين",
  vatPayable: "ضريبة القيمة المضافة المستحقة",
  current: "الحالي",
  d30: "1-30 يوم",
  d60: "31-60 يوم",
  d90: "61-90 يوم",
  d90plus: "أكثر من 90 يوم",
  totalUnits: "إجمالي الوحدات",
  rentedCol: "المؤجرة",
  rate: "النسبة",

  accountingSubtitle: "دليل حسابات وقيود يومية وميزان مراجعة بنظام القيد المزدوج",
  initializeStandardCoa: "إنشاء دليل الحسابات القياسي",
  chartOfAccounts: "دليل الحسابات",
  journal: "اليومية",
  trialBalance: "ميزان المراجعة",
  code: "الرمز",
  nameAr: "الاسم (عربي)",
  noAccountsHint: 'لا توجد حسابات. اضغط "إنشاء دليل الحسابات القياسي".',
  entryNumber: "رقم القيد",
  description: "الوصف",
  account: "الحساب",
  debit: "مدين",
  credit: "دائن",
  chartEnsured: "تم إنشاء دليل الحسابات",
  noJournalEntries: "لا توجد قيود يومية",

  backToProperties: "العودة إلى العقارات",
  details: "التفاصيل",
  owner: "المالك",
  area: "المساحة",
  unitsInProperty: "الوحدات في هذا العقار",
  revenueYtd: "إيرادات السنة",
  expensesYtd: "مصروفات السنة",
  sqm: "م²",
};

export const realEstateTranslations: Record<Language, RealEstateT> = {
  English: en,
  Arabic: ar,
  German: en,
  Chinese: en,
  Bengali: en,
  Italian: en,
  Hindi: en,
  Urdu: ar,
  Spanish: en,
  Tagalog: en,
};

export function getRealEstateT(language: Language): RealEstateT {
  return realEstateTranslations[language] || en;
}

export function localizedStatus(t: RealEstateT, status?: string | null): string {
  if (!status) return "—";
  const key = `status_${status}` as keyof RealEstateT;
  return (t[key] as string) || String(status).replace(/_/g, " ");
}

export function localizedPriority(t: RealEstateT, priority?: string | null): string {
  if (!priority) return "—";
  const key = `priority_${priority}` as keyof RealEstateT;
  return (t[key] as string) || String(priority);
}

export function localizedType(t: RealEstateT, type?: string | null): string {
  if (!type) return "—";
  const key = `type_${type}` as keyof RealEstateT;
  return (t[key] as string) || String(type);
}

export function localizedCategory(t: RealEstateT, cat?: string | null): string {
  if (!cat) return "—";
  const key = `cat_${cat}` as keyof RealEstateT;
  return (t[key] as string) || String(cat).replace(/_/g, " ");
}

export function localizedFrequency(t: RealEstateT, freq?: string | null): string {
  if (!freq) return "—";
  const key = `freq_${freq}` as keyof RealEstateT;
  return (t[key] as string) || String(freq);
}

export function localizedMethod(t: RealEstateT, method?: string | null): string {
  if (!method) return "—";
  const key = `method_${method}` as keyof RealEstateT;
  return (t[key] as string) || String(method).replace(/_/g, " ");
}

export function localizedIdType(t: RealEstateT, idType?: string | null): string {
  if (!idType) return "—";
  const key = `id_${idType}` as keyof RealEstateT;
  return (t[key] as string) || String(idType).replace(/_/g, " ");
}

export function localizedAccountType(t: RealEstateT, type?: string | null): string {
  if (!type) return "—";
  const key = `acct_${type}` as keyof RealEstateT;
  return (t[key] as string) || String(type);
}
