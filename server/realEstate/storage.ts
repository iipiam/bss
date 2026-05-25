// Property Management storage helpers - direct pg queries, snake_case <-> camelCase mapping.
import { pool } from "../db";

// ---------- snake_case <-> camelCase ----------
const toCamel = (s: string) => s.replace(/_([a-z])/g, (_, c) => c.toUpperCase());
function rowToCamel<T = any>(row: any): T {
  if (!row || typeof row !== "object") return row;
  const out: any = {};
  for (const k of Object.keys(row)) out[toCamel(k)] = row[k];
  return out as T;
}
function rowsToCamel<T = any>(rows: any[]): T[] {
  return rows.map((r) => rowToCamel<T>(r));
}

// ---------- helpers ----------
function buildInsert(table: string, fields: Record<string, any>) {
  const keys = Object.keys(fields).filter((k) => fields[k] !== undefined);
  const cols = keys.map((k) => k.replace(/([A-Z])/g, "_$1").toLowerCase());
  const placeholders = keys.map((_, i) => `$${i + 1}`);
  const values = keys.map((k) => fields[k]);
  const sql = `INSERT INTO ${table} (${cols.join(",")}) VALUES (${placeholders.join(",")}) RETURNING *`;
  return { sql, values };
}

function buildUpdate(table: string, id: string, restaurantId: string, fields: Record<string, any>) {
  const keys = Object.keys(fields).filter((k) => fields[k] !== undefined && k !== "id" && k !== "restaurantId" && k !== "createdAt");
  if (keys.length === 0) return null;
  const cols = keys.map((k) => k.replace(/([A-Z])/g, "_$1").toLowerCase());
  const setExpr = cols.map((c, i) => `${c} = $${i + 1}`).join(", ");
  const values = keys.map((k) => fields[k]);
  values.push(id, restaurantId);
  const sql = `UPDATE ${table} SET ${setExpr} WHERE id = $${values.length - 1} AND restaurant_id = $${values.length} RETURNING *`;
  return { sql, values };
}

async function listByRestaurant(table: string, restaurantId: string, where: string = "", params: any[] = []) {
  const q = `SELECT * FROM ${table} WHERE restaurant_id = $1 ${where} ORDER BY created_at DESC`;
  const r = await pool.query(q, [restaurantId, ...params]);
  return rowsToCamel(r.rows);
}

async function getOne(table: string, id: string, restaurantId: string) {
  const r = await pool.query(`SELECT * FROM ${table} WHERE id = $1 AND restaurant_id = $2`, [id, restaurantId]);
  return r.rows[0] ? rowToCamel(r.rows[0]) : null;
}

async function deleteOne(table: string, id: string, restaurantId: string) {
  const r = await pool.query(`DELETE FROM ${table} WHERE id = $1 AND restaurant_id = $2`, [id, restaurantId]);
  return (r.rowCount ?? 0) > 0;
}

// ==================== Properties ====================
export const propertiesStore = {
  list: (restaurantId: string) => listByRestaurant("properties", restaurantId),
  get: (id: string, restaurantId: string) => getOne("properties", id, restaurantId),
  create: async (restaurantId: string, data: any) => {
    const { sql, values } = buildInsert("properties", { ...data, restaurantId });
    const r = await pool.query(sql, values);
    return rowToCamel(r.rows[0]);
  },
  update: async (id: string, restaurantId: string, data: any) => {
    const built = buildUpdate("properties", id, restaurantId, { ...data, updatedAt: new Date() });
    if (!built) return getOne("properties", id, restaurantId);
    const r = await pool.query(built.sql, built.values);
    return r.rows[0] ? rowToCamel(r.rows[0]) : null;
  },
  remove: async (id: string, restaurantId: string) => {
    // guard: no active contracts on any unit of this property (tenant-scoped)
    const guard = await pool.query(
      `SELECT 1 FROM rental_contracts rc JOIN property_units u ON u.id = rc.unit_id
       WHERE u.property_id = $1 AND rc.status = 'active' AND rc.restaurant_id = $2 LIMIT 1`,
      [id, restaurantId],
    );
    if (guard.rowCount && guard.rowCount > 0) throw new Error("Cannot delete property with active contracts");
    await pool.query(`DELETE FROM property_units WHERE property_id = $1 AND restaurant_id = $2`, [id, restaurantId]);
    return deleteOne("properties", id, restaurantId);
  },
  countByStatus: async (restaurantId: string) => {
    const r = await pool.query(`SELECT status, COUNT(*)::int as c FROM properties WHERE restaurant_id = $1 GROUP BY status`, [restaurantId]);
    return r.rows.reduce((acc: any, row: any) => ({ ...acc, [row.status]: row.c }), {});
  },
};

// ==================== Units ====================
export const unitsStore = {
  list: (restaurantId: string, propertyId?: string) =>
    propertyId
      ? listByRestaurant("property_units", restaurantId, "AND property_id = $2", [propertyId])
      : listByRestaurant("property_units", restaurantId),
  get: (id: string, restaurantId: string) => getOne("property_units", id, restaurantId),
  create: async (restaurantId: string, data: any) => {
    const { sql, values } = buildInsert("property_units", { ...data, restaurantId });
    const r = await pool.query(sql, values);
    return rowToCamel(r.rows[0]);
  },
  update: async (id: string, restaurantId: string, data: any) => {
    const built = buildUpdate("property_units", id, restaurantId, data);
    if (!built) return getOne("property_units", id, restaurantId);
    const r = await pool.query(built.sql, built.values);
    return r.rows[0] ? rowToCamel(r.rows[0]) : null;
  },
  setStatus: async (id: string, restaurantId: string, status: string) => {
    const r = await pool.query(
      `UPDATE property_units SET status = $1 WHERE id = $2 AND restaurant_id = $3 RETURNING *`,
      [status, id, restaurantId],
    );
    return r.rows[0] ? rowToCamel(r.rows[0]) : null;
  },
  remove: async (id: string, restaurantId: string) => {
    const guard = await pool.query(`SELECT 1 FROM rental_contracts WHERE unit_id = $1 AND status = 'active' AND restaurant_id = $2 LIMIT 1`, [id, restaurantId]);
    if (guard.rowCount && guard.rowCount > 0) throw new Error("Cannot delete unit with active contract");
    return deleteOne("property_units", id, restaurantId);
  },
};

// ==================== Tenants ====================
export const tenantsStore = {
  list: (restaurantId: string) => listByRestaurant("property_tenants", restaurantId),
  get: (id: string, restaurantId: string) => getOne("property_tenants", id, restaurantId),
  create: async (restaurantId: string, data: any) => {
    const { sql, values } = buildInsert("property_tenants", { ...data, restaurantId });
    const r = await pool.query(sql, values);
    return rowToCamel(r.rows[0]);
  },
  update: async (id: string, restaurantId: string, data: any) => {
    const built = buildUpdate("property_tenants", id, restaurantId, data);
    if (!built) return getOne("property_tenants", id, restaurantId);
    const r = await pool.query(built.sql, built.values);
    return r.rows[0] ? rowToCamel(r.rows[0]) : null;
  },
  remove: async (id: string, restaurantId: string) => {
    const guard = await pool.query(`SELECT 1 FROM rental_contracts WHERE tenant_id = $1 AND status IN ('active','draft') AND restaurant_id = $2 LIMIT 1`, [id, restaurantId]);
    if (guard.rowCount && guard.rowCount > 0) throw new Error("Cannot delete tenant with active or draft contracts");
    return deleteOne("property_tenants", id, restaurantId);
  },
  outstandingBalance: async (tenantId: string, restaurantId: string) => {
    const r = await pool.query(
      `SELECT COALESCE(SUM(total_amount - amount_paid), 0)::bigint as bal
       FROM rental_invoices WHERE tenant_id = $1 AND restaurant_id = $2 AND status IN ('pending','partial','overdue')`,
      [tenantId, restaurantId],
    );
    return Number(r.rows[0]?.bal || 0);
  },
};

// ==================== Rental Contracts ====================
export const contractsStore = {
  list: (restaurantId: string, status?: string) =>
    status
      ? listByRestaurant("rental_contracts", restaurantId, "AND status = $2", [status])
      : listByRestaurant("rental_contracts", restaurantId),
  get: (id: string, restaurantId: string) => getOne("rental_contracts", id, restaurantId),
  create: async (restaurantId: string, data: any) => {
    // tenant boundary: unitId and tenantId must belong to this restaurant
    if (!data.unitId || !data.tenantId) throw new Error("unitId and tenantId required");
    const own = await pool.query(
      `SELECT
         (SELECT 1 FROM property_units WHERE id = $1 AND restaurant_id = $3) as unit_ok,
         (SELECT 1 FROM property_tenants WHERE id = $2 AND restaurant_id = $3) as tenant_ok`,
      [data.unitId, data.tenantId, restaurantId],
    );
    const row = own.rows[0] || {};
    if (!row.unit_ok) throw new Error("Unit not found in this account");
    if (!row.tenant_ok) throw new Error("Tenant not found in this account");
    if (data.status === "active") {
      const conflict = await pool.query(
        `SELECT 1 FROM rental_contracts WHERE unit_id = $1 AND status = 'active' AND restaurant_id = $2 LIMIT 1`,
        [data.unitId, restaurantId],
      );
      if (conflict.rowCount && conflict.rowCount > 0) throw new Error("Unit already has an active contract");
    }
    const { sql, values } = buildInsert("rental_contracts", { ...data, restaurantId });
    const r = await pool.query(sql, values);
    return rowToCamel(r.rows[0]);
  },
  update: async (id: string, restaurantId: string, data: any) => {
    const built = buildUpdate("rental_contracts", id, restaurantId, data);
    if (!built) return getOne("rental_contracts", id, restaurantId);
    const r = await pool.query(built.sql, built.values);
    return r.rows[0] ? rowToCamel(r.rows[0]) : null;
  },
  setStatus: async (id: string, restaurantId: string, status: string, extra: Record<string, any> = {}) => {
    const fields: Record<string, any> = { status, ...extra };
    const built = buildUpdate("rental_contracts", id, restaurantId, fields);
    if (!built) return null;
    const r = await pool.query(built.sql, built.values);
    return r.rows[0] ? rowToCamel(r.rows[0]) : null;
  },
  remove: async (id: string, restaurantId: string) => {
    const guard = await pool.query(
      `SELECT 1 FROM rental_invoices WHERE contract_id = $1 AND status IN ('pending','partial','overdue') LIMIT 1`,
      [id],
    );
    if (guard.rowCount && guard.rowCount > 0) throw new Error("Cannot delete contract with unpaid invoices");
    return deleteOne("rental_contracts", id, restaurantId);
  },
  setContractNumber: async (id: string, contractNumber: string) => {
    await pool.query(`UPDATE rental_contracts SET contract_number = $1 WHERE id = $2`, [contractNumber, id]);
  },
};

// ==================== Rental Invoices ====================
export const invoicesStore = {
  list: (restaurantId: string, filters: { status?: string; contractId?: string; tenantId?: string } = {}) => {
    const wh: string[] = [];
    const params: any[] = [];
    let idx = 2;
    if (filters.status) { wh.push(`status = $${idx++}`); params.push(filters.status); }
    if (filters.contractId) { wh.push(`contract_id = $${idx++}`); params.push(filters.contractId); }
    if (filters.tenantId) { wh.push(`tenant_id = $${idx++}`); params.push(filters.tenantId); }
    const where = wh.length ? "AND " + wh.join(" AND ") : "";
    return listByRestaurant("rental_invoices", restaurantId, where, params);
  },
  get: (id: string, restaurantId: string) => getOne("rental_invoices", id, restaurantId),
  create: async (restaurantId: string, data: any) => {
    const { sql, values } = buildInsert("rental_invoices", { ...data, restaurantId });
    const r = await pool.query(sql, values);
    return rowToCamel(r.rows[0]);
  },
  update: async (id: string, restaurantId: string, data: any) => {
    const built = buildUpdate("rental_invoices", id, restaurantId, data);
    if (!built) return getOne("rental_invoices", id, restaurantId);
    const r = await pool.query(built.sql, built.values);
    return r.rows[0] ? rowToCamel(r.rows[0]) : null;
  },
  remove: (id: string, restaurantId: string) => deleteOne("rental_invoices", id, restaurantId),
  applyPayment: async (id: string, restaurantId: string, additionalPaid: number) => {
    const r = await pool.query(
      `UPDATE rental_invoices
       SET amount_paid = amount_paid + $1,
           status = CASE
             WHEN amount_paid + $1 >= total_amount THEN 'paid'
             WHEN amount_paid + $1 > 0 THEN 'partial'
             ELSE status
           END
       WHERE id = $2 AND restaurant_id = $3 RETURNING *`,
      [additionalPaid, id, restaurantId],
    );
    return r.rows[0] ? rowToCamel(r.rows[0]) : null;
  },
  markOverdueSweep: async () => {
    // global sweep across tenants; cron also creates notifications
    const r = await pool.query(
      `UPDATE rental_invoices SET status = 'overdue'
       WHERE status = 'pending' AND due_date < CURRENT_DATE RETURNING id, restaurant_id, tenant_id, invoice_number, total_amount, amount_paid`,
    );
    return rowsToCamel(r.rows);
  },
  nextInvoiceNumber: async (restaurantId: string): Promise<string> => {
    const year = new Date().getUTCFullYear();
    const prefix = `INV-${year}-`;
    const r = await pool.query(
      `SELECT invoice_number FROM rental_invoices
       WHERE restaurant_id = $1 AND invoice_number LIKE $2
       ORDER BY invoice_number DESC LIMIT 1`,
      [restaurantId, `${prefix}%`],
    );
    let next = 1;
    if (r.rows[0]) {
      const m = String(r.rows[0].invoice_number).match(/INV-\d{4}-(\d+)/);
      if (m) next = parseInt(m[1], 10) + 1;
    }
    return `${prefix}${String(next).padStart(4, "0")}`;
  },
};

// ==================== Rental Payments ====================
export const paymentsStore = {
  list: (restaurantId: string) => listByRestaurant("rental_payments", restaurantId),
  listByInvoice: async (invoiceId: string, restaurantId: string) => {
    const r = await pool.query(
      `SELECT * FROM rental_payments WHERE invoice_id = $1 AND restaurant_id = $2 ORDER BY payment_date DESC`,
      [invoiceId, restaurantId],
    );
    return rowsToCamel(r.rows);
  },
  get: (id: string, restaurantId: string) => getOne("rental_payments", id, restaurantId),
  create: async (restaurantId: string, data: any) => {
    const { sql, values } = buildInsert("rental_payments", { ...data, restaurantId });
    const r = await pool.query(sql, values);
    return rowToCamel(r.rows[0]);
  },
  remove: (id: string, restaurantId: string) => deleteOne("rental_payments", id, restaurantId),
};

// ==================== Property Expenses ====================
export const expensesStore = {
  list: (restaurantId: string, propertyId?: string) =>
    propertyId
      ? listByRestaurant("property_expenses", restaurantId, "AND property_id = $2", [propertyId])
      : listByRestaurant("property_expenses", restaurantId),
  get: (id: string, restaurantId: string) => getOne("property_expenses", id, restaurantId),
  create: async (restaurantId: string, data: any) => {
    const { sql, values } = buildInsert("property_expenses", { ...data, restaurantId });
    const r = await pool.query(sql, values);
    return rowToCamel(r.rows[0]);
  },
  update: async (id: string, restaurantId: string, data: any) => {
    const built = buildUpdate("property_expenses", id, restaurantId, data);
    if (!built) return getOne("property_expenses", id, restaurantId);
    const r = await pool.query(built.sql, built.values);
    return r.rows[0] ? rowToCamel(r.rows[0]) : null;
  },
  remove: (id: string, restaurantId: string) => deleteOne("property_expenses", id, restaurantId),
};

// ==================== Maintenance Requests ====================
export const maintenanceStore = {
  list: (restaurantId: string) => listByRestaurant("maintenance_requests", restaurantId),
  get: (id: string, restaurantId: string) => getOne("maintenance_requests", id, restaurantId),
  create: async (restaurantId: string, data: any) => {
    const { sql, values } = buildInsert("maintenance_requests", { ...data, restaurantId });
    const r = await pool.query(sql, values);
    return rowToCamel(r.rows[0]);
  },
  update: async (id: string, restaurantId: string, data: any) => {
    const built = buildUpdate("maintenance_requests", id, restaurantId, data);
    if (!built) return getOne("maintenance_requests", id, restaurantId);
    const r = await pool.query(built.sql, built.values);
    return r.rows[0] ? rowToCamel(r.rows[0]) : null;
  },
  remove: (id: string, restaurantId: string) => deleteOne("maintenance_requests", id, restaurantId),
};

// ==================== Chart of Accounts ====================
export const coaStore = {
  list: async (restaurantId: string) => {
    const r = await pool.query(`SELECT * FROM chart_of_accounts WHERE restaurant_id = $1 ORDER BY code`, [restaurantId]);
    return rowsToCamel(r.rows);
  },
  get: (id: string, restaurantId: string) => getOne("chart_of_accounts", id, restaurantId),
  getByCode: async (restaurantId: string, code: string) => {
    const r = await pool.query(
      `SELECT * FROM chart_of_accounts WHERE restaurant_id = $1 AND code = $2 LIMIT 1`,
      [restaurantId, code],
    );
    return r.rows[0] ? rowToCamel(r.rows[0]) : null;
  },
  create: async (restaurantId: string, data: any) => {
    const { sql, values } = buildInsert("chart_of_accounts", { ...data, restaurantId });
    const r = await pool.query(sql, values);
    return rowToCamel(r.rows[0]);
  },
  upsert: async (restaurantId: string, data: any) => {
    const existing = await coaStore.getByCode(restaurantId, data.code);
    if (existing) return existing;
    return coaStore.create(restaurantId, data);
  },
};

// ==================== Journal Entries / Lines ====================
export const journalStore = {
  listEntries: async (restaurantId: string) => {
    const r = await pool.query(
      `SELECT * FROM journal_entries WHERE restaurant_id = $1 ORDER BY entry_date DESC, created_at DESC`,
      [restaurantId],
    );
    return rowsToCamel(r.rows);
  },
  getEntryWithLines: async (id: string, restaurantId: string) => {
    const e = await pool.query(
      `SELECT * FROM journal_entries WHERE id = $1 AND restaurant_id = $2`,
      [id, restaurantId],
    );
    if (!e.rows[0]) return null;
    const lines = await pool.query(`SELECT * FROM journal_lines WHERE journal_entry_id = $1 ORDER BY id`, [id]);
    return { ...rowToCamel(e.rows[0]), lines: rowsToCamel(lines.rows) };
  },
  createEntry: async (restaurantId: string, entry: any, lines: any[]) => {
    const client = await pool.connect();
    try {
      await client.query("BEGIN");
      // entry number
      const yr = new Date().getUTCFullYear();
      const cnt = await client.query(
        `SELECT COUNT(*)::int as c FROM journal_entries WHERE restaurant_id = $1 AND entry_number LIKE $2`,
        [restaurantId, `JE-${yr}-%`],
      );
      const entryNumber = `JE-${yr}-${String((cnt.rows[0]?.c || 0) + 1).padStart(5, "0")}`;
      const e = await client.query(
        `INSERT INTO journal_entries (restaurant_id, entry_number, entry_date, description, reference_type, reference_id, created_by_user_id)
         VALUES ($1, $2, COALESCE($3, CURRENT_DATE), $4, $5, $6, $7) RETURNING *`,
        [
          restaurantId, entryNumber, entry.entryDate || null, entry.description || null,
          entry.referenceType || null, entry.referenceId || null, entry.createdByUserId || null,
        ],
      );
      const entryId = e.rows[0].id;
      for (const ln of lines) {
        await client.query(
          `INSERT INTO journal_lines (journal_entry_id, account_code, account_name, debit, credit, notes)
           VALUES ($1, $2, $3, $4, $5, $6)`,
          [entryId, ln.accountCode, ln.accountName, ln.debit || 0, ln.credit || 0, ln.notes || null],
        );
      }
      await client.query("COMMIT");
      return { ...rowToCamel(e.rows[0]), lines };
    } catch (err) {
      await client.query("ROLLBACK");
      throw err;
    } finally {
      client.release();
    }
  },
  trialBalance: async (restaurantId: string) => {
    const r = await pool.query(
      `SELECT jl.account_code, jl.account_name,
              SUM(jl.debit)::bigint as debit, SUM(jl.credit)::bigint as credit
       FROM journal_lines jl
       JOIN journal_entries je ON je.id = jl.journal_entry_id
       WHERE je.restaurant_id = $1
       GROUP BY jl.account_code, jl.account_name
       ORDER BY jl.account_code`,
      [restaurantId],
    );
    return r.rows.map((row: any) => ({
      accountCode: row.account_code,
      accountName: row.account_name,
      debit: Number(row.debit || 0),
      credit: Number(row.credit || 0),
      balance: Number(row.debit || 0) - Number(row.credit || 0),
    }));
  },
};

// ==================== Notifications ====================
export const notificationsStore = {
  list: async (restaurantId: string, onlyUnread = false) => {
    const r = await pool.query(
      `SELECT * FROM property_notifications WHERE restaurant_id = $1 ${onlyUnread ? "AND is_read = false" : ""} ORDER BY created_at DESC LIMIT 100`,
      [restaurantId],
    );
    return rowsToCamel(r.rows);
  },
  unreadCount: async (restaurantId: string) => {
    const r = await pool.query(
      `SELECT COUNT(*)::int as c FROM property_notifications WHERE restaurant_id = $1 AND is_read = false`,
      [restaurantId],
    );
    return r.rows[0]?.c || 0;
  },
  create: async (restaurantId: string, data: any) => {
    const r = await pool.query(
      `INSERT INTO property_notifications (restaurant_id, user_id, type, title, message, related_type, related_id)
       VALUES ($1,$2,$3,$4,$5,$6,$7) RETURNING *`,
      [restaurantId, data.userId || null, data.type, data.title, data.message || null, data.relatedType || null, data.relatedId || null],
    );
    return rowToCamel(r.rows[0]);
  },
  markRead: async (id: string, restaurantId: string) => {
    await pool.query(`UPDATE property_notifications SET is_read = true WHERE id = $1 AND restaurant_id = $2`, [id, restaurantId]);
  },
  markAllRead: async (restaurantId: string) => {
    await pool.query(`UPDATE property_notifications SET is_read = true WHERE restaurant_id = $1`, [restaurantId]);
  },
};

export { rowToCamel, rowsToCamel };
