// Seed sample data for Property Management (one-off, per restaurant).
import { pool } from "../db";
import { propertiesStore, unitsStore, tenantsStore, contractsStore, expensesStore, maintenanceStore } from "./storage";
import { generateInvoiceSchedule } from "./invoiceGen";
import { ensureStandardChartOfAccounts, postPaymentReceived } from "./accounting";

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
