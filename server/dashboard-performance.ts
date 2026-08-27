export const DASHBOARD_TIMEZONE = "Asia/Riyadh";

type PerformanceTransaction = {
  orderId?: string | null;
  createdAt: Date | string;
  total: string | number;
};

type PerformanceOrder = {
  id: string;
  status?: string | null;
  paymentStatus?: string | null;
};

export type PerformanceMetric = {
  current: number;
  previous: number;
  change: number;
};

const RIYADH_OFFSET_MS = 3 * 60 * 60 * 1000;

type RiyadhParts = {
  year: number;
  month: number;
  day: number;
  hour: number;
  minute: number;
  second: number;
  millisecond: number;
  weekday: number;
};

function getRiyadhParts(value: Date): RiyadhParts {
  const shifted = new Date(value.getTime() + RIYADH_OFFSET_MS);
  return {
    year: shifted.getUTCFullYear(),
    month: shifted.getUTCMonth(),
    day: shifted.getUTCDate(),
    hour: shifted.getUTCHours(),
    minute: shifted.getUTCMinutes(),
    second: shifted.getUTCSeconds(),
    millisecond: shifted.getUTCMilliseconds(),
    weekday: shifted.getUTCDay(),
  };
}

function fromRiyadhParts(
  year: number,
  month: number,
  day: number,
  hour = 0,
  minute = 0,
  second = 0,
  millisecond = 0,
) {
  return new Date(Date.UTC(year, month, day, hour, minute, second, millisecond) - RIYADH_OFFSET_MS);
}

function daysInMonth(year: number, month: number) {
  return new Date(Date.UTC(year, month + 1, 0)).getUTCDate();
}

function previousMonthPoint(parts: RiyadhParts) {
  const month = (parts.month + 11) % 12;
  const year = parts.month === 0 ? parts.year - 1 : parts.year;
  return fromRiyadhParts(
    year,
    month,
    Math.min(parts.day, daysInMonth(year, month)),
    parts.hour,
    parts.minute,
    parts.second,
    parts.millisecond,
  );
}

function previousYearPoint(parts: RiyadhParts) {
  const year = parts.year - 1;
  return fromRiyadhParts(
    year,
    parts.month,
    Math.min(parts.day, daysInMonth(year, parts.month)),
    parts.hour,
    parts.minute,
    parts.second,
    parts.millisecond,
  );
}

function isCountedSale(transaction: PerformanceTransaction, order: PerformanceOrder | undefined) {
  const total = Number(transaction.total);
  if (!Number.isFinite(total) || total <= 0) return false;
  const orderStatus = order?.status?.trim().toLowerCase();
  const paymentStatus = order?.paymentStatus?.trim().toLowerCase();
  return orderStatus !== "cancelled"
    && orderStatus !== "canceled"
    && orderStatus !== "refunded"
    && paymentStatus !== "refunded";
}

function calculateChange(current: number, previous: number) {
  return previous === 0 ? 0 : ((current - previous) / previous) * 100;
}

export function calculateDashboardPerformance(
  transactions: PerformanceTransaction[],
  orders: PerformanceOrder[],
  now: Date = new Date(),
) {
  const parts = getRiyadhParts(now);
  const todayStart = fromRiyadhParts(parts.year, parts.month, parts.day);
  const yesterdayStart = fromRiyadhParts(parts.year, parts.month, parts.day - 1);
  const yesterdaySamePoint = new Date(yesterdayStart.getTime() + (now.getTime() - todayStart.getTime()));

  // Saudi business calendars use Sunday as the first day of the week.
  const weekStart = fromRiyadhParts(parts.year, parts.month, parts.day - parts.weekday);
  const lastWeekStart = fromRiyadhParts(parts.year, parts.month, parts.day - parts.weekday - 7);
  const lastWeekSamePoint = new Date(lastWeekStart.getTime() + (now.getTime() - weekStart.getTime()));

  const monthStart = fromRiyadhParts(parts.year, parts.month, 1);
  const lastMonthYear = parts.month === 0 ? parts.year - 1 : parts.year;
  const lastMonth = (parts.month + 11) % 12;
  const lastMonthStart = fromRiyadhParts(lastMonthYear, lastMonth, 1);

  const yearStart = fromRiyadhParts(parts.year, 0, 1);
  const lastYearStart = fromRiyadhParts(parts.year - 1, 0, 1);

  const orderMap = new Map(orders.map(order => [order.id, order]));
  const counted = transactions.flatMap(transaction => {
    const date = new Date(transaction.createdAt);
    const order = transaction.orderId ? orderMap.get(transaction.orderId) : undefined;
    return Number.isFinite(date.getTime()) && isCountedSale(transaction, order)
      ? [{ date, total: Number(transaction.total) }]
      : [];
  });

  const sum = (start: Date, end: Date) => Number(counted
    .filter(transaction => transaction.date >= start && transaction.date <= end)
    .reduce((total, transaction) => total + transaction.total, 0)
    .toFixed(2));

  const metric = (currentStart: Date, currentEnd: Date, previousStart: Date, previousEnd: Date): PerformanceMetric => {
    const current = sum(currentStart, currentEnd);
    const previous = sum(previousStart, previousEnd);
    return { current, previous, change: calculateChange(current, previous) };
  };

  return {
    dod: metric(todayStart, now, yesterdayStart, yesterdaySamePoint),
    wow: metric(weekStart, now, lastWeekStart, lastWeekSamePoint),
    mom: metric(monthStart, now, lastMonthStart, previousMonthPoint(parts)),
    yoy: metric(yearStart, now, lastYearStart, previousYearPoint(parts)),
  };
}