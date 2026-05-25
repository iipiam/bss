// Auto-generate the full invoice schedule for a contract on activation.
import { invoicesStore } from "./storage";
import { postInvoiceIssued } from "./accounting";

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
