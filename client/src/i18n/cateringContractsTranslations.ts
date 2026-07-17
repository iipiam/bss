import type { Language } from "./translations";

export type CateringT = {
  pageTitle: string;
  pageSubtitle: string;
  tabContracts: string;
  tabTemplate: string;

  newContract: string;
  editContract: string;
  contractNumber: string;
  clientName: string;
  clientPhone: string;
  clientEmail: string;
  deliveryLocation: string;
  mealSelections: string;
  addMeal: string;
  selectFromMenu: string;
  pickMenuItems: string;
  noMenuItems: string;
  addSelected: string;
  mealName: string;
  mealPrice: string;
  mealsPerDay: string;
  deliveryDays: string;
  deliveryTime: string;
  startDate: string;
  endDate: string;
  totalValue: string;
  discountPercent: string;
  finalValue: string;
  paymentInstallments: string;
  addInstallment: string;
  installmentLabel: string;
  installmentPercent: string;
  installmentAmount: string;
  installmentDueDate: string;
  notes: string;
  status: string;
  active: string;
  completed: string;
  cancelled: string;
  save: string;
  cancel: string;
  delete: string;
  edit: string;
  actions: string;
  noContracts: string;
  confirmDelete: string;

  // Days
  sunday: string;
  monday: string;
  tuesday: string;
  wednesday: string;
  thursday: string;
  friday: string;
  saturday: string;

  // Actions
  downloadPdf: string;
  pdfFailed: string;
  sendEmail: string;
  sendWhatsApp: string;
  emailSent: string;
  emailFailed: string;
  noEmailProvided: string;

  // Templates
  templateEditor: string;
  templateEditorDesc: string;
  templateName: string;
  templateContent: string;
  insertPlaceholder: string;
  placeholders: string;
  livePreview: string;
  setAsDefault: string;
  defaultTemplate: string;
  newTemplate: string;
  saveTemplate: string;
  updateTemplate: string;
  noTemplates: string;
  templateSaved: string;
  templateDeleted: string;

  // Placeholder labels
  phMyRestaurantName: string;
  phClientName: string;
  phPhone: string;
  phEmail: string;
  phDeliveryLocation: string;
  phMealsList: string;
  phNumberOfMeals: string;
  phDeliveryDays: string;
  phDeliveryTime: string;
  phTotalValue: string;
  phDiscountPercentage: string;
  phFinalValue: string;
  phPaymentSchedule: string;
  phStartDate: string;
  phEndDate: string;

  // Custom placeholders
  customPlaceholders: string;
  customPlaceholdersDesc: string;
  placeholderKey: string;
  placeholderLabel: string;
  placeholderValue: string;
  addPlaceholder: string;
  placeholderKeyRequired: string;
  placeholderKeyExists: string;

  contractCreated: string;
  contractUpdated: string;
  contractDeleted: string;
  required: string;
  sar: string;

  // Cost & profit report
  costReport: string;
  costReportTitle: string;
  costReportSubtitle: string;
  mealsBreakdown: string;
  unitCost: string;
  unitProfit: string;
  margin: string;
  notLinkedToMenu: string;
  noRecipeLinked: string;
  totalDeliveries: string;
  estimatedCogs: string;
  estimatedProfit: string;
  contractRevenue: string;
  overallMargin: string;
  avgMealCost: string;
  avgMealPrice: string;
  costReportWarning: string;
  closeReport: string;
  qtyPerDay: string;
  sendQuotation: string;
  noClientPhone: string;
};

const en: CateringT = {
  pageTitle: "Catering Contracts",
  pageSubtitle: "Manage catering supply contracts and terms templates",
  tabContracts: "Contracts",
  tabTemplate: "Terms Template",

  newContract: "New Contract",
  editContract: "Edit Contract",
  contractNumber: "Contract Number",
  clientName: "Client Name",
  clientPhone: "Client Phone",
  clientEmail: "Client Email",
  deliveryLocation: "Delivery Location",
  mealSelections: "Meal Selections",
  addMeal: "Add Meal",
  selectFromMenu: "Select from Menu",
  pickMenuItems: "Pick menu items to add as meals",
  noMenuItems: "No menu items available",
  addSelected: "Add Selected",
  mealName: "Meal Name",
  mealPrice: "Price",
  mealsPerDay: "Meals Per Day",
  deliveryDays: "Delivery Days",
  deliveryTime: "Delivery Time",
  startDate: "Start Date",
  endDate: "End Date",
  totalValue: "Total Value",
  discountPercent: "Discount %",
  finalValue: "Final Value",
  paymentInstallments: "Payment Installments",
  addInstallment: "Add Installment",
  installmentLabel: "Label",
  installmentPercent: "%",
  installmentAmount: "Amount",
  installmentDueDate: "Due Date",
  notes: "Notes",
  status: "Status",
  active: "Active",
  completed: "Completed",
  cancelled: "Cancelled",
  save: "Save",
  cancel: "Cancel",
  delete: "Delete",
  edit: "Edit",
  actions: "Actions",
  noContracts: "No contracts yet. Create your first catering contract.",
  confirmDelete: "Are you sure you want to delete this?",

  sunday: "Sunday",
  monday: "Monday",
  tuesday: "Tuesday",
  wednesday: "Wednesday",
  thursday: "Thursday",
  friday: "Friday",
  saturday: "Saturday",

  downloadPdf: "Download PDF",
  pdfFailed: "Failed to generate PDF",
  sendEmail: "Send Email",
  sendWhatsApp: "Send via WhatsApp",
  emailSent: "Email sent successfully",
  emailFailed: "Failed to send email",
  noEmailProvided: "Client email is not set",

  templateEditor: "Terms & Conditions Template",
  templateEditorDesc: "Write your catering agreement template. Use placeholders below — they will be replaced with contract data in the generated PDF.",
  templateName: "Template Name",
  templateContent: "Template Content",
  insertPlaceholder: "Insert Placeholder",
  placeholders: "Available Placeholders",
  livePreview: "Live Preview",
  setAsDefault: "Set as default",
  defaultTemplate: "Default",
  newTemplate: "New Template",
  saveTemplate: "Save Template",
  updateTemplate: "Update Template",
  noTemplates: "No templates yet. Create your first template.",
  templateSaved: "Template saved",
  templateDeleted: "Template deleted",

  phMyRestaurantName: "My Restaurant Name",
  phClientName: "Client Name",
  phPhone: "Phone",
  phEmail: "Email",
  phDeliveryLocation: "Delivery Location",
  phMealsList: "Meals List",
  phNumberOfMeals: "Number of Meals",
  phDeliveryDays: "Delivery Days",
  phDeliveryTime: "Delivery Time",
  phTotalValue: "Total Value",
  phDiscountPercentage: "Discount %",
  phFinalValue: "Final Value",
  phPaymentSchedule: "Payment Schedule",
  phStartDate: "Start Date",
  phEndDate: "End Date",

  customPlaceholders: "Custom Placeholders",
  customPlaceholdersDesc: "Define your own placeholders with fixed values for this template.",
  placeholderKey: "key (e.g. company_vat)",
  placeholderLabel: "Label",
  placeholderValue: "Value",
  addPlaceholder: "Add",
  placeholderKeyRequired: "Placeholder key is required",
  placeholderKeyExists: "This placeholder key already exists",

  contractCreated: "Contract created",
  contractUpdated: "Contract updated",
  contractDeleted: "Contract deleted",
  required: "Required",
  sar: "SAR",

  costReport: "Cost & Profit Report",
  costReportTitle: "Cost & Profit Report",
  costReportSubtitle: "Margin analysis based on linked menu items, recipes and contract pricing",
  mealsBreakdown: "Meals Breakdown",
  unitCost: "Unit Cost",
  unitProfit: "Unit Profit",
  margin: "Margin",
  notLinkedToMenu: "Not linked to menu",
  noRecipeLinked: "No recipe linked",
  totalDeliveries: "Total Deliveries",
  estimatedCogs: "Estimated COGS",
  estimatedProfit: "Estimated Profit",
  contractRevenue: "Contract Revenue (Final)",
  overallMargin: "Overall Margin",
  avgMealCost: "Avg Meal Cost",
  avgMealPrice: "Avg Meal Price",
  costReportWarning: "Some meals are not linked to a menu item with a recipe, so their cost is treated as 0. Link them via 'Select from Menu' for accurate margins.",
  closeReport: "Close",
  qtyPerDay: "Qty/Day",
  sendQuotation: "Send Quotation",
  noClientPhone: "Client phone number not set",
};

const ar: CateringT = {
  pageTitle: "عقود التموين",
  pageSubtitle: "إدارة عقود توريد التموين وقوالب الشروط والأحكام",
  tabContracts: "العقود",
  tabTemplate: "قالب الشروط",

  newContract: "عقد جديد",
  editContract: "تعديل العقد",
  contractNumber: "رقم العقد",
  clientName: "اسم العميل",
  clientPhone: "هاتف العميل",
  clientEmail: "بريد العميل الإلكتروني",
  deliveryLocation: "موقع التوصيل",
  mealSelections: "اختيار الوجبات",
  addMeal: "إضافة وجبة",
  selectFromMenu: "اختيار من القائمة",
  pickMenuItems: "اختر أصناف القائمة لإضافتها كوجبات",
  noMenuItems: "لا توجد أصناف في القائمة",
  addSelected: "إضافة المحدد",
  mealName: "اسم الوجبة",
  mealPrice: "السعر",
  mealsPerDay: "الوجبات يوميا",
  deliveryDays: "أيام التوصيل",
  deliveryTime: "وقت التوصيل",
  startDate: "تاريخ البداية",
  endDate: "تاريخ النهاية",
  totalValue: "القيمة الإجمالية",
  discountPercent: "نسبة الخصم %",
  finalValue: "القيمة النهائية",
  paymentInstallments: "أقساط الدفع",
  addInstallment: "إضافة قسط",
  installmentLabel: "البيان",
  installmentPercent: "%",
  installmentAmount: "المبلغ",
  installmentDueDate: "تاريخ الاستحقاق",
  notes: "ملاحظات",
  status: "الحالة",
  active: "نشط",
  completed: "مكتمل",
  cancelled: "ملغي",
  save: "حفظ",
  cancel: "إلغاء",
  delete: "حذف",
  edit: "تعديل",
  actions: "إجراءات",
  noContracts: "لا توجد عقود بعد. أنشئ أول عقد تموين.",
  confirmDelete: "هل أنت متأكد من الحذف؟",

  sunday: "الأحد",
  monday: "الإثنين",
  tuesday: "الثلاثاء",
  wednesday: "الأربعاء",
  thursday: "الخميس",
  friday: "الجمعة",
  saturday: "السبت",

  downloadPdf: "تحميل PDF",
  pdfFailed: "فشل إنشاء ملف PDF",
  sendEmail: "إرسال بريد إلكتروني",
  sendWhatsApp: "إرسال عبر واتساب",
  emailSent: "تم إرسال البريد الإلكتروني بنجاح",
  emailFailed: "فشل إرسال البريد الإلكتروني",
  noEmailProvided: "البريد الإلكتروني للعميل غير مسجل",

  templateEditor: "قالب الشروط والأحكام",
  templateEditorDesc: "اكتب قالب اتفاقية التموين. استخدم العناصر النائبة أدناه — سيتم استبدالها ببيانات العقد في ملف PDF.",
  templateName: "اسم القالب",
  templateContent: "محتوى القالب",
  insertPlaceholder: "إدراج عنصر نائب",
  placeholders: "العناصر النائبة المتاحة",
  livePreview: "معاينة مباشرة",
  setAsDefault: "تعيين كافتراضي",
  defaultTemplate: "افتراضي",
  newTemplate: "قالب جديد",
  saveTemplate: "حفظ القالب",
  updateTemplate: "تحديث القالب",
  noTemplates: "لا توجد قوالب بعد.",
  templateSaved: "تم حفظ القالب",
  templateDeleted: "تم حذف القالب",

  phMyRestaurantName: "اسم مطعمي",
  phClientName: "اسم العميل",
  phPhone: "الهاتف",
  phEmail: "البريد الإلكتروني",
  phDeliveryLocation: "موقع التوصيل",
  phMealsList: "قائمة الوجبات",
  phNumberOfMeals: "عدد الوجبات",
  phDeliveryDays: "أيام التوصيل",
  phDeliveryTime: "وقت التوصيل",
  phTotalValue: "القيمة الإجمالية",
  phDiscountPercentage: "نسبة الخصم %",
  phFinalValue: "القيمة النهائية",
  phPaymentSchedule: "جدول الدفع",
  phStartDate: "تاريخ البداية",
  phEndDate: "تاريخ النهاية",

  customPlaceholders: "عناصر نائبة مخصصة",
  customPlaceholdersDesc: "أضف عناصر نائبة خاصة بك بقيم ثابتة لهذا القالب.",
  placeholderKey: "المفتاح (مثل company_vat)",
  placeholderLabel: "التسمية",
  placeholderValue: "القيمة",
  addPlaceholder: "إضافة",
  placeholderKeyRequired: "مفتاح العنصر النائب مطلوب",
  placeholderKeyExists: "هذا المفتاح موجود مسبقاً",

  contractCreated: "تم إنشاء العقد",
  contractUpdated: "تم تحديث العقد",
  contractDeleted: "تم حذف العقد",
  required: "مطلوب",
  sar: "ر.س",

  costReport: "تقرير التكلفة والربح",
  costReportTitle: "تقرير التكلفة والربح",
  costReportSubtitle: "تحليل هامش الربح بناءً على عناصر القائمة المربوطة والوصفات وسعر العقد",
  mealsBreakdown: "تفاصيل الوجبات",
  unitCost: "تكلفة الوحدة",
  unitProfit: "ربح الوحدة",
  margin: "الهامش",
  notLinkedToMenu: "غير مرتبط بالقائمة",
  noRecipeLinked: "لا توجد وصفة مرتبطة",
  totalDeliveries: "إجمالي عمليات التوصيل",
  estimatedCogs: "تكلفة البضاعة المُقدّرة",
  estimatedProfit: "الربح المُقدّر",
  contractRevenue: "إيراد العقد (النهائي)",
  overallMargin: "الهامش الإجمالي",
  avgMealCost: "متوسط تكلفة الوجبة",
  avgMealPrice: "متوسط سعر الوجبة",
  costReportWarning: "بعض الوجبات غير مرتبطة بعنصر قائمة يحتوي على وصفة، لذا تُعتبر تكلفتها صفر. اربطها عبر «اختيار من القائمة» للحصول على هامش دقيق.",
  closeReport: "إغلاق",
  qtyPerDay: "كمية/يوم",
  sendQuotation: "إرسال عرض السعر",
  noClientPhone: "رقم هاتف العميل غير محدد",
};

const cateringTranslations: Record<Language, CateringT> = {
  English: en,
  Arabic: ar,
  Urdu: ar,
  German: en,
  Chinese: en,
  Bengali: en,
  Italian: en,
  Hindi: en,
  Spanish: en,
  Tagalog: en,
};

export function useCateringT(language: Language): CateringT {
  return cateringTranslations[language] || cateringTranslations.English;
}
