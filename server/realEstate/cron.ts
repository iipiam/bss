// Daily sweep for Property Management:
//   - Mark overdue invoices and notify
//   - Send 90d / 30d expiry alerts
//   - Auto-expire contracts past end_date (auto-renew when enabled)
import { pool } from "../db";
import { invoicesStore, notificationsStore, contractsStore, unitsStore } from "./storage";
import { generateInvoiceSchedule } from "./invoiceGen";

const DAY_MS = 24 * 60 * 60 * 1000;
let timer: NodeJS.Timeout | null = null;

async function sweepOverdueInvoices() {
  const overdue = await invoicesStore.markOverdueSweep();
  for (const inv of overdue) {
    try {
      await notificationsStore.create(inv.restaurantId, {
        type: "overdue_invoice",
        title: `Overdue invoice ${inv.invoiceNumber}`,
        message: `Invoice ${inv.invoiceNumber} is now overdue.`,
        relatedType: "invoice",
        relatedId: inv.id,
      });
    } catch (err) {
      console.error("[realEstateCron] notification create failed", err);
    }
  }
  return overdue.length;
}

async function notifyOnce(restaurantId: string, type: string, relatedId: string, title: string, message: string) {
  // Idempotent: only create if no notification of same (type, relatedId) exists for this restaurant today.
  const dupe = await pool.query(
    `SELECT 1 FROM property_notifications
     WHERE restaurant_id = $1 AND type = $2 AND related_type = 'contract' AND related_id = $3
       AND created_at::date = CURRENT_DATE LIMIT 1`,
    [restaurantId, type, relatedId],
  );
  if (dupe.rowCount && dupe.rowCount > 0) return;
  await notificationsStore.create(restaurantId, { type, title, message, relatedType: "contract", relatedId });
}

async function sweepContractExpiry() {
  // 90-day soon warning (idempotent per day)
  const soon = await pool.query(
    `SELECT id, restaurant_id, contract_number, end_date
     FROM rental_contracts
     WHERE status = 'active' AND end_date - CURRENT_DATE = 90`,
  );
  for (const c of soon.rows) {
    await notifyOnce(c.restaurant_id, "contract_expiring_soon", c.id,
      `Contract ${c.contract_number || c.id.slice(0, 8)} expires in 90 days`, `End date: ${c.end_date}`);
  }
  // 30-day critical
  const crit = await pool.query(
    `SELECT id, restaurant_id, contract_number, end_date
     FROM rental_contracts
     WHERE status = 'active' AND end_date - CURRENT_DATE = 30`,
  );
  for (const c of crit.rows) {
    await notifyOnce(c.restaurant_id, "contract_expiring_critical", c.id,
      `Contract ${c.contract_number || c.id.slice(0, 8)} expires in 30 days`, `End date: ${c.end_date}`);
  }
  // expire today
  const expiring = await pool.query(
    `SELECT * FROM rental_contracts WHERE status = 'active' AND end_date <= CURRENT_DATE`,
  );
  let expiredCount = 0;
  let renewedCount = 0;
  for (const row of expiring.rows) {
    const c = {
      id: row.id, restaurantId: row.restaurant_id, unitId: row.unit_id, tenantId: row.tenant_id,
      startDate: row.start_date, endDate: row.end_date, durationMonths: row.duration_months,
      monthlyRent: row.monthly_rent, totalValue: row.total_value, securityDeposit: row.security_deposit,
      paymentFrequency: row.payment_frequency, paymentDay: row.payment_day, vatRate: row.vat_rate,
      autoRenew: row.auto_renew,
    };
    if (c.autoRenew) {
      // mark current as renewed
      await contractsStore.setStatus(c.id, c.restaurantId, "renewed");
      // create new contract with same terms starting day after old end_date
      const newStart = new Date(new Date(c.endDate).getTime() + DAY_MS);
      const newEnd = new Date(newStart.getTime());
      newEnd.setUTCMonth(newEnd.getUTCMonth() + c.durationMonths);
      const newContract = await contractsStore.create(c.restaurantId, {
        unitId: c.unitId,
        tenantId: c.tenantId,
        startDate: newStart.toISOString().slice(0, 10),
        endDate: newEnd.toISOString().slice(0, 10),
        durationMonths: c.durationMonths,
        monthlyRent: c.monthlyRent,
        totalValue: c.totalValue,
        securityDeposit: 0,
        paymentFrequency: c.paymentFrequency,
        paymentDay: c.paymentDay,
        vatRate: c.vatRate,
        autoRenew: true,
        status: "active",
      });
      // contract number
      const yr = new Date().getUTCFullYear();
      const cnt = await pool.query(
        `SELECT COUNT(*)::int as c FROM rental_contracts WHERE restaurant_id = $1 AND contract_number LIKE $2`,
        [c.restaurantId, `RC-${yr}-%`],
      );
      const num = `RC-${yr}-${String((cnt.rows[0]?.c || 0)).padStart(4, "0")}`;
      await contractsStore.setContractNumber(newContract.id, num);
      await generateInvoiceSchedule(c.restaurantId, newContract);
      await notificationsStore.create(c.restaurantId, {
        type: "contract_renewed",
        title: `Contract auto-renewed`,
        message: `New contract ${num} created from previous contract.`,
        relatedType: "contract",
        relatedId: newContract.id,
      });
      renewedCount++;
    } else {
      await contractsStore.setStatus(c.id, c.restaurantId, "expired");
      await unitsStore.setStatus(c.unitId, c.restaurantId, "available");
      await notificationsStore.create(c.restaurantId, {
        type: "contract_expired",
        title: `Contract expired`,
        message: `Contract ${row.contract_number || row.id.slice(0, 8)} has expired.`,
        relatedType: "contract",
        relatedId: c.id,
      });
      expiredCount++;
    }
  }
  return { soon: soon.rowCount, crit: crit.rowCount, expiredCount, renewedCount };
}

export async function runDailySweep() {
  try {
    const overdue = await sweepOverdueInvoices();
    const expiry = await sweepContractExpiry();
    console.log(`[realEstateCron] sweep complete: overdue=${overdue} expiry=${JSON.stringify(expiry)}`);
  } catch (err) {
    console.error("[realEstateCron] sweep failed", err);
  }
}

export function startRealEstateCron() {
  if (timer) return;
  // run once at boot (after small delay to let DB warm up), then every 24h
  setTimeout(() => { runDailySweep(); }, 30_000);
  timer = setInterval(runDailySweep, DAY_MS);
  console.log("[realEstateCron] daily sweep scheduler started");
}
