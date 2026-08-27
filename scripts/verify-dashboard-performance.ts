import assert from "node:assert/strict";
import {
  calculateDashboardPerformance,
  calculateDashboardWeeklySales,
} from "../server/dashboard-performance";

const now = new Date("2026-08-27T12:00:00.000Z"); // 15:00 in Riyadh
const sale = (createdAt: string, total: number, orderId?: string) => ({
  createdAt,
  total,
  orderId,
});

const result = calculateDashboardPerformance([
  sale("2026-08-27T10:00:00.000Z", 100, "active"),
  sale("2026-08-26T10:00:00.000Z", 80, "active"),
  sale("2026-08-20T11:00:00.000Z", 60, "active"),
  sale("2026-07-27T10:00:00.000Z", 50, "active"),
  sale("2025-08-27T10:00:00.000Z", 40, "active"),
  sale("2026-08-28T10:00:00.000Z", 9999, "active"),
  sale("2026-08-27T09:00:00.000Z", 500, "cancelled"),
  sale("2026-08-27T09:30:00.000Z", 600, "refunded"),
], [
  { id: "active", status: "Completed", paymentStatus: "Paid" },
  { id: "cancelled", status: "Cancelled", paymentStatus: "Paid" },
  { id: "refunded", status: "Completed", paymentStatus: "Refunded" },
], now);

assert.equal(result.dod.current, 100, "future, cancelled, and refunded sales must not count today");
assert.equal(result.dod.previous, 80, "DoD must compare the same elapsed Riyadh-day window");
assert.equal(result.wow.current, 180, "WoW current period must use the current Riyadh calendar week");
assert.equal(result.wow.previous, 60, "WoW previous period must use the same elapsed prior-week window");
assert.equal(result.mom.current, 240, "MoM current period must stop at now");
assert.equal(result.mom.previous, 50, "MoM must compare against the same point last month");
assert.equal(result.yoy.current, 290, "YoY current period must include valid YTD sales but exclude future-dated sales");
assert.equal(result.yoy.previous, 40, "YoY must compare against the same point last year");

const midnight = calculateDashboardPerformance([
  sale("2026-08-26T20:59:59.999Z", 10),
  sale("2026-08-26T21:00:00.000Z", 20),
], [], new Date("2026-08-26T21:30:00.000Z"));
assert.equal(midnight.dod.current, 20, "Riyadh midnight is 21:00 UTC");
assert.equal(midnight.dod.previous, 0);

const weeklySales = calculateDashboardWeeklySales([
  sale("2026-08-23T10:00:00.000Z", 12.25, "active"),
  sale("2026-08-27T10:00:00.000Z", 7.75, "active"),
  sale("2026-08-27T09:00:00.000Z", 500, "cancelled"),
  sale("2026-08-27T09:30:00.000Z", 600, "refunded"),
  sale("2026-08-28T10:00:00.000Z", 9999, "active"),
], [
  { id: "active", status: "Completed", paymentStatus: "Paid" },
  { id: "cancelled", status: "Cancelled", paymentStatus: "Paid" },
  { id: "refunded", status: "Completed", paymentStatus: "Refunded" },
], now);

assert.deepEqual(weeklySales, [
  { date: "Sun", sales: 12.25 },
  { date: "Mon", sales: 0 },
  { date: "Tue", sales: 0 },
  { date: "Wed", sales: 0 },
  { date: "Thu", sales: 7.75 },
  { date: "Fri", sales: 0 },
  { date: "Sat", sales: 0 },
], "weekly chart must use Riyadh dates and the same valid-sale rules as performance analysis");

console.log("Dashboard performance checks passed");