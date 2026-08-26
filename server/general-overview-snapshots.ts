import { sql } from "drizzle-orm";
import { db } from "./db";

/** Rebuilds a bounded, branch-owned daily sales cache.  It is deliberately
 * independent from invoice retry work and is safe to call repeatedly. */
export async function rebuildOverviewDailySnapshots(restaurantId?: string) {
  const tenant = restaurantId ? sql`and o.restaurant_id = ${restaurantId}` : sql``;
  await db.execute(sql`
    insert into overview_daily_snapshots
      (restaurant_id, branch_id, snapshot_date, revenue, order_count, calculated_at)
    select o.restaurant_id, o.branch_id, o.created_at::date,
      coalesce(sum(o.total), 0), count(*), now()
    from orders o
    where o.branch_id is not null
      and lower(o.status) not in ('cancelled', 'canceled', 'refunded')
      and o.created_at >= current_date - interval '93 days' ${tenant}
    group by o.restaurant_id, o.branch_id, o.created_at::date
    on conflict (restaurant_id, branch_id, snapshot_date) do update set
      revenue = excluded.revenue, order_count = excluded.order_count,
      calculated_at = excluded.calculated_at`);
}

export async function overviewSnapshotFreshness(restaurantId: string, branchId?: string) {
  const result = await db.execute(sql`
    select max(calculated_at) as calculated_at, count(*)::int as snapshot_count
    from overview_daily_snapshots
    where restaurant_id=${restaurantId} ${branchId ? sql`and branch_id=${branchId}` : sql``}`);
  return result.rows[0] || { calculated_at: null, snapshot_count: 0 };
}