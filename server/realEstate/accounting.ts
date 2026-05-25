// Standard real estate chart of accounts + double-entry posting helpers.
import { coaStore, journalStore } from "./storage";

export const STANDARD_ACCOUNTS = [
  // Assets
  { code: "1010", name: "Cash on Hand", nameAr: "النقدية في الصندوق", type: "asset" },
  { code: "1020", name: "Bank Account", nameAr: "الحساب البنكي", type: "asset" },
  { code: "1100", name: "Accounts Receivable", nameAr: "الذمم المدينة", type: "asset" },
  { code: "1500", name: "Property Assets", nameAr: "أصول عقارية", type: "asset" },
  // Liabilities
  { code: "2010", name: "Accounts Payable", nameAr: "الذمم الدائنة", type: "liability" },
  { code: "2020", name: "Security Deposits Held", nameAr: "تأمينات مستلمة", type: "liability" },
  { code: "2110", name: "VAT Payable", nameAr: "ضريبة القيمة المضافة المستحقة", type: "liability" },
  // Equity
  { code: "3010", name: "Owner Equity", nameAr: "حقوق الملكية", type: "equity" },
  { code: "3020", name: "Retained Earnings", nameAr: "الأرباح المحتجزة", type: "equity" },
  // Revenue
  { code: "4010", name: "Rent Revenue", nameAr: "إيرادات الإيجار", type: "revenue" },
  { code: "4020", name: "Late Fee Revenue", nameAr: "إيرادات غرامات التأخير", type: "revenue" },
  { code: "4030", name: "Other Revenue", nameAr: "إيرادات أخرى", type: "revenue" },
  // Expenses
  { code: "5010", name: "Maintenance Expense", nameAr: "مصاريف الصيانة", type: "expense" },
  { code: "5020", name: "Utilities Expense", nameAr: "مصاريف المرافق", type: "expense" },
  { code: "5030", name: "Insurance Expense", nameAr: "مصاريف التأمين", type: "expense" },
  { code: "5040", name: "Tax Expense", nameAr: "مصاريف الضرائب", type: "expense" },
  { code: "5050", name: "Management Fee Expense", nameAr: "مصاريف إدارة", type: "expense" },
  { code: "5060", name: "Salary Expense", nameAr: "مصاريف الرواتب", type: "expense" },
  { code: "5070", name: "Marketing Expense", nameAr: "مصاريف التسويق", type: "expense" },
  { code: "5080", name: "Renovation Expense", nameAr: "مصاريف ترميم", type: "expense" },
  { code: "5090", name: "Legal Expense", nameAr: "مصاريف قانونية", type: "expense" },
  { code: "5099", name: "Other Expense", nameAr: "مصاريف أخرى", type: "expense" },
];

export async function ensureStandardChartOfAccounts(restaurantId: string) {
  for (const acc of STANDARD_ACCOUNTS) {
    await coaStore.upsert(restaurantId, acc);
  }
}

export function expenseCategoryToAccount(category: string) {
  const map: Record<string, { code: string; name: string }> = {
    maintenance: { code: "5010", name: "Maintenance Expense" },
    utilities: { code: "5020", name: "Utilities Expense" },
    insurance: { code: "5030", name: "Insurance Expense" },
    tax: { code: "5040", name: "Tax Expense" },
    management_fee: { code: "5050", name: "Management Fee Expense" },
    salary: { code: "5060", name: "Salary Expense" },
    marketing: { code: "5070", name: "Marketing Expense" },
    renovation: { code: "5080", name: "Renovation Expense" },
    legal: { code: "5090", name: "Legal Expense" },
    other: { code: "5099", name: "Other Expense" },
  };
  return map[category] || map.other;
}

// Invoice issued: DR Accounts Receivable, CR Rent Revenue (and CR VAT Payable)
export async function postInvoiceIssued(restaurantId: string, invoice: any) {
  const lines: any[] = [
    { accountCode: "1100", accountName: "Accounts Receivable", debit: invoice.totalAmount, credit: 0 },
    { accountCode: "4010", accountName: invoice.type === "rent" ? "Rent Revenue" : "Other Revenue", debit: 0, credit: invoice.amount },
  ];
  if (invoice.taxAmount > 0) {
    lines.push({ accountCode: "2110", accountName: "VAT Payable", debit: 0, credit: invoice.taxAmount });
  }
  await journalStore.createEntry(
    restaurantId,
    {
      description: `Invoice ${invoice.invoiceNumber} issued`,
      referenceType: "invoice",
      referenceId: invoice.id,
    },
    lines,
  );
}

// Payment received: DR Cash/Bank, CR Accounts Receivable
export async function postPaymentReceived(restaurantId: string, payment: any, invoiceNumber: string) {
  const cashAccount = payment.method === "cash" ? { code: "1010", name: "Cash on Hand" } : { code: "1020", name: "Bank Account" };
  const lines = [
    { accountCode: cashAccount.code, accountName: cashAccount.name, debit: payment.amountPaid, credit: 0 },
    { accountCode: "1100", accountName: "Accounts Receivable", debit: 0, credit: payment.amountPaid },
  ];
  await journalStore.createEntry(
    restaurantId,
    {
      description: `Payment received for invoice ${invoiceNumber}`,
      referenceType: "payment",
      referenceId: payment.id,
    },
    lines,
  );
}

// Security deposit collected: DR Cash, CR Security Deposits Held
export async function postSecurityDeposit(restaurantId: string, paymentId: string, amount: number, method: string) {
  const cashAccount = method === "cash" ? { code: "1010", name: "Cash on Hand" } : { code: "1020", name: "Bank Account" };
  const lines = [
    { accountCode: cashAccount.code, accountName: cashAccount.name, debit: amount, credit: 0 },
    { accountCode: "2020", accountName: "Security Deposits Held", debit: 0, credit: amount },
  ];
  await journalStore.createEntry(
    restaurantId,
    { description: "Security deposit received", referenceType: "payment", referenceId: paymentId },
    lines,
  );
}

// Expense paid: DR Expense Account, CR Cash/Bank
export async function postExpensePaid(restaurantId: string, expense: any) {
  const acc = expenseCategoryToAccount(expense.category);
  const cashAccount = { code: "1020", name: "Bank Account" };
  const lines = [
    { accountCode: acc.code, accountName: acc.name, debit: expense.amount, credit: 0 },
    { accountCode: cashAccount.code, accountName: cashAccount.name, debit: 0, credit: expense.amount },
  ];
  await journalStore.createEntry(
    restaurantId,
    { description: expense.description, referenceType: "expense", referenceId: expense.id },
    lines,
  );
}
