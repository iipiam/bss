// Property Management business logic: chart-of-accounts + double-entry posting,
// rental invoice schedule generation, and sample-data seeding.
import { pool } from "./db";
import {
  coaStore, journalStore, invoicesStore,
  propertiesStore, unitsStore, tenantsStore, contractsStore, expensesStore, maintenanceStore,
} from "./realEstateStorage";

// ===== Accounting =====
// Standard real estate chart of accounts + double-entry posting helpers.

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

// ===== Invoice schedule generation =====
// Auto-generate the full invoice schedule for a contract on activation.

function addMonths(date: Date, months: number): Date {
  const d = new Date(date.getTime());
  d.setUTCMonth(d.getUTCMonth() + months);
  return d;
}

function frequencyToMonths(freq: string): number {
  switch (freq) {
    case "monthly": return 1;
    case "quarterly": return 3;
    case "biannual": return 6;
    case "annual": return 12;
    default: return 1;
  }
}

function toIsoDate(d: Date): string {
  return d.toISOString().slice(0, 10);
}

/**
 * Generate the full invoice schedule for a rental contract.
 * Each invoice covers `paymentFrequency` worth of rent, with VAT (default 15%) applied.
 * Returns the created invoices (also posts to journal).
 */
export async function generateInvoiceSchedule(restaurantId: string, contract: any): Promise<any[]> {
  const startDate = new Date(contract.startDate);
  const endDate = new Date(contract.endDate);
  const periodMonths = frequencyToMonths(contract.paymentFrequency);
  const monthlyRent: number = contract.monthlyRent;
  const periodAmount = monthlyRent * periodMonths;
  const vatRate = contract.vatRate ?? 15;

  const issueDate = toIsoDate(new Date());
  const created: any[] = [];

  let cursor = startDate;
  let safety = 200; // hard cap

  while (cursor < endDate && safety-- > 0) {
    const next = addMonths(cursor, periodMonths);
    // due date: use payment_day in cursor month
    const due = new Date(cursor.getTime());
    due.setUTCDate(Math.min(contract.paymentDay || 1, 28));
    const dueIso = toIsoDate(due);

    const taxAmount = Math.round((periodAmount * vatRate) / 100);
    const totalAmount = periodAmount + taxAmount;

    const invoiceNumber = await invoicesStore.nextInvoiceNumber(restaurantId);
    const invoice = await invoicesStore.create(restaurantId, {
      contractId: contract.id,
      unitId: contract.unitId,
      tenantId: contract.tenantId,
      invoiceNumber,
      type: "rent",
      amount: periodAmount,
      taxAmount,
      totalAmount,
      dueDate: dueIso,
      issueDate,
      status: "pending",
      notes: `Auto-generated for period ${toIsoDate(cursor)} → ${toIsoDate(next)}`,
    });
    created.push(invoice);
    try {
      await postInvoiceIssued(restaurantId, invoice);
    } catch (err) {
      console.error("[realEstate] postInvoiceIssued failed", err);
    }
    cursor = next;
  }

  // Also generate a deposit invoice (if security_deposit > 0) and the standalone payment will close it.
  if (contract.securityDeposit && contract.securityDeposit > 0) {
    const invoiceNumber = await invoicesStore.nextInvoiceNumber(restaurantId);
    const deposit = await invoicesStore.create(restaurantId, {
      contractId: contract.id,
      unitId: contract.unitId,
      tenantId: contract.tenantId,
      invoiceNumber,
      type: "deposit",
      amount: contract.securityDeposit,
      taxAmount: 0,
      totalAmount: contract.securityDeposit,
      dueDate: toIsoDate(startDate),
      issueDate,
      status: "pending",
      notes: "Security deposit",
    });
    created.push(deposit);
  }

  return created;
}

// ===== Seed sample data =====
// Seed sample data for Property Management (one-off, per restaurant).

const SAMPLE_PROPERTIES = [
  { name: "Al Olaya Residential Compound", type: "compound", city: "Riyadh", district: "Al Olaya", address: "King Fahd Rd", areaSqm: "12500", floors: 4, yearBuilt: 2018, currentValue: 4_500_000_00, status: "rented" },
  { name: "Tahliyah Commercial Tower", type: "commercial", city: "Jeddah", district: "Tahliyah", address: "Tahliyah St", areaSqm: "8000", floors: 12, yearBuilt: 2020, currentValue: 8_200_000_00, status: "rented" },
  { name: "Al Nakheel Villa", type: "villa", city: "Riyadh", district: "Al Nakheel", address: "Villa 24, Block 3", areaSqm: "550", floors: 2, yearBuilt: 2019, currentValue: 1_900_000_00, status: "rented" },
  { name: "King Abdullah Industrial Warehouse", type: "warehouse", city: "Dammam", district: "Industrial 2", address: "Block 7", areaSqm: "3500", floors: 1, yearBuilt: 2017, currentValue: 2_300_000_00, status: "available" },
  { name: "Diplomatic Quarter Offices", type: "office", city: "Riyadh", district: "DQ", address: "Building 8", areaSqm: "1800", floors: 3, yearBuilt: 2021, currentValue: 3_100_000_00, status: "rented" },
];

const TENANT_NAMES = [
  "Ahmed Al-Saud", "Fatimah Al-Qahtani", "Mohammed Al-Otaibi", "Sara Al-Harbi",
  "Khalid Al-Mutairi", "Layla Al-Ghamdi", "Yousef Al-Zahrani", "Noura Al-Dosari",
  "Ali Al-Shehri", "Amal Al-Najdi",
];

function randomChoice<T>(arr: T[]): T { return arr[Math.floor(Math.random() * arr.length)]; }

export async function seedRealEstate(restaurantId: string) {
  // chart of accounts
  await ensureStandardChartOfAccounts(restaurantId);

  // properties
  const properties: any[] = [];
  for (const p of SAMPLE_PROPERTIES) properties.push(await propertiesStore.create(restaurantId, p));

  // 20+ units (~4-5 per property)
  const units: any[] = [];
  let unitCounter = 100;
  for (const p of properties) {
    const count = p.type === "warehouse" ? 2 : p.type === "villa" ? 1 : 6;
    for (let i = 0; i < count; i++) {
      unitCounter++;
      units.push(
        await unitsStore.create(restaurantId, {
          propertyId: p.id,
          unitNumber: `${p.type[0].toUpperCase()}-${unitCounter}`,
          type: p.type === "office" ? "office" : p.type === "warehouse" ? "warehouse" : p.type === "villa" ? "villa" : i % 2 ? "studio" : "apartment",
          floor: (i % 4) + 1,
          areaSqm: String(60 + Math.floor(Math.random() * 200)),
          bedrooms: p.type === "office" || p.type === "warehouse" ? null : 1 + (i % 3),
          bathrooms: 1 + (i % 2),
          parkingSpaces: 1,
          monthlyRent: (3000 + Math.floor(Math.random() * 7000)) * 100,
          status: "available",
        }),
      );
    }
  }

  // 10 tenants
  const tenants: any[] = [];
  for (let i = 0; i < TENANT_NAMES.length; i++) {
    tenants.push(
      await tenantsStore.create(restaurantId, {
        fullName: TENANT_NAMES[i],
        idNumber: `1${String(1000000000 + Math.floor(Math.random() * 99999999))}`.slice(0, 10),
        idType: "national_id",
        phone: `+9665${String(10000000 + Math.floor(Math.random() * 89999999))}`,
        email: `${TENANT_NAMES[i].toLowerCase().replace(/[^a-z]/g, ".")}@example.sa`,
        nationality: "Saudi",
      }),
    );
  }

  // active contracts on ~70% of units
  const occupied = units.slice(0, Math.ceil(units.length * 0.7));
  const yr = new Date().getUTCFullYear();
  let cnum = 0;
  for (const u of occupied) {
    cnum++;
    const tenant = randomChoice(tenants);
    const startDate = new Date(Date.now() - 1000 * 60 * 60 * 24 * (30 + Math.floor(Math.random() * 150)));
    const durationMonths = 12;
    const endDate = new Date(startDate.getTime());
    endDate.setUTCMonth(endDate.getUTCMonth() + durationMonths);
    const monthlyRent = u.monthlyRent;
    const totalValue = monthlyRent * durationMonths;
    const contract = await contractsStore.create(restaurantId, {
      unitId: u.id,
      tenantId: tenant.id,
      startDate: startDate.toISOString().slice(0, 10),
      endDate: endDate.toISOString().slice(0, 10),
      durationMonths,
      monthlyRent,
      totalValue,
      securityDeposit: monthlyRent,
      paymentFrequency: "monthly",
      paymentDay: 1,
      vatRate: 15,
      status: "active",
      autoRenew: true,
      signedDate: startDate.toISOString().slice(0, 10),
    });
    await contractsStore.setContractNumber(contract.id, `RC-${yr}-${String(cnum).padStart(4, "0")}`);
    await unitsStore.setStatus(u.id, restaurantId, "rented");
    const invoices = await generateInvoiceSchedule(restaurantId, contract);
    // mark ~60% past-due invoices as paid (simulate 6 months payment history)
    const now = Date.now();
    for (const inv of invoices) {
      if (inv.type === "deposit") continue;
      const dueTime = new Date(inv.dueDate).getTime();
      if (dueTime < now && Math.random() < 0.8) {
        await pool.query(
          `UPDATE rental_invoices SET amount_paid = total_amount, status = 'paid' WHERE id = $1`,
          [inv.id],
        );
        const pay = await pool.query(
          `INSERT INTO rental_payments (restaurant_id, invoice_id, contract_id, tenant_id, amount_paid, payment_date, method)
           VALUES ($1,$2,$3,$4,$5,$6,'bank_transfer') RETURNING *`,
          [restaurantId, inv.id, contract.id, tenant.id, inv.totalAmount, inv.dueDate],
        );
        try { await postPaymentReceived(restaurantId, { id: pay.rows[0].id, amountPaid: inv.totalAmount, method: "bank_transfer" }, inv.invoiceNumber); } catch {}
      }
    }
  }

  // expenses
  const expenseCats = ["maintenance", "utilities", "insurance", "tax", "management_fee"];
  for (let i = 0; i < 12; i++) {
    await expensesStore.create(restaurantId, {
      propertyId: randomChoice(properties).id,
      category: randomChoice(expenseCats),
      description: `Sample expense #${i + 1}`,
      amount: (200 + Math.floor(Math.random() * 5000)) * 100,
      vendorName: "Sample Vendor",
      expenseDate: new Date(Date.now() - 1000 * 60 * 60 * 24 * Math.floor(Math.random() * 180)).toISOString().slice(0, 10),
      status: Math.random() > 0.3 ? "paid" : "pending",
    });
  }

  // maintenance requests
  const titles = ["AC not cooling", "Plumbing leak", "Door lock issue", "Paint touchup", "Electrical fault"];
  for (let i = 0; i < 8; i++) {
    const u = randomChoice(units);
    await maintenanceStore.create(restaurantId, {
      propertyId: u.propertyId,
      unitId: u.id,
      title: randomChoice(titles),
      description: "Reported by tenant",
      category: "general",
      priority: randomChoice(["low", "medium", "high", "urgent"]),
      status: randomChoice(["open", "assigned", "in_progress", "completed"]),
      estimatedCost: (100 + Math.floor(Math.random() * 2000)) * 100,
    });
  }

  return {
    properties: properties.length, units: units.length, tenants: tenants.length, contracts: occupied.length,
  };
}
