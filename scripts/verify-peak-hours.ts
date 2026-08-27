import assert from "node:assert/strict";
import {
  calculatePeakHours,
  getPeakWindowStart,
  getRiyadhHour,
} from "../server/peak-hours";

const at = (iso: string) => new Date(iso);
const now = at("2026-08-27T12:00:00.000Z");

assert.equal(getRiyadhHour(at("2026-08-27T00:30:00.000Z")), 3);
assert.equal(getRiyadhHour(at("2026-08-27T21:30:00.000Z")), 0);
assert.equal(
  getPeakWindowStart(now).toISOString(),
  "2026-07-28T12:00:00.000Z",
);

const result = calculatePeakHours(
  [
    { orderId: "pending-cash", createdAt: "2026-08-27T09:15:00.000Z", total: "100" },
    { orderId: "completed", createdAt: "2026-08-27T09:45:00.000Z", total: "50" },
    { orderId: "cancelled", createdAt: "2026-08-27T09:30:00.000Z", total: "999" },
    { orderId: "refunded", createdAt: "2026-08-27T10:00:00.000Z", total: "777" },
    { orderId: null, createdAt: "2026-08-27T21:30:00.000Z", total: "20" },
    { orderId: "old", createdAt: "2026-07-20T09:00:00.000Z", total: "500" },
    { orderId: "invalid", createdAt: "2026-08-27T09:00:00.000Z", total: "-1" },
  ],
  [
    { id: "pending-cash", status: "Pending", paymentStatus: "Unpaid" },
    { id: "completed", status: "Completed", paymentStatus: "Paid" },
    { id: "cancelled", status: "Cancelled", paymentStatus: "Paid" },
    { id: "refunded", status: "Completed", paymentStatus: "Refunded" },
    { id: "old", status: "Completed", paymentStatus: "Paid" },
    { id: "invalid", status: "Completed", paymentStatus: "Paid" },
  ],
  now,
);

assert.equal(result.timezone, "Asia/Riyadh");
assert.equal(result.hourlyData.length, 24);
assert.equal(result.hourlyData[12].sales, 150);
assert.equal(result.hourlyData[0].sales, 20);
assert.equal(result.peakHour, 12);
assert.equal(result.peakSales, 150);

const empty = calculatePeakHours([], [], now);
assert.equal(empty.peakHour, -1);
assert.equal(empty.peakSales, 0);

console.log("Peak-hours verifier passed: Riyadh timezone, live cash, exclusions, window, and empty state.");