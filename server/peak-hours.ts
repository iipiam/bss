export const PEAK_HOURS_TIMEZONE = "Asia/Riyadh";
export const PEAK_HOURS_WINDOW_DAYS = 30;

type PeakTransaction = {
  orderId?: string | null;
  createdAt: Date | string;
  total: string | number;
};

type PeakOrder = {
  id: string;
  status?: string | null;
  paymentStatus?: string | null;
};

const hourFormatter = new Intl.DateTimeFormat("en-US", {
  timeZone: PEAK_HOURS_TIMEZONE,
  hour: "2-digit",
  hourCycle: "h23",
});

export function getPeakWindowStart(now: Date = new Date()): Date {
  return new Date(now.getTime() - PEAK_HOURS_WINDOW_DAYS * 24 * 60 * 60 * 1000);
}

export function getRiyadhHour(value: Date | string): number {
  return Number(hourFormatter.format(new Date(value)));
}

export function isCountedPeakSale(
  transaction: PeakTransaction,
  order: PeakOrder | undefined,
  windowStart: Date,
): boolean {
  const createdAt = new Date(transaction.createdAt);
  const total = Number(transaction.total);
  if (!Number.isFinite(createdAt.getTime()) || createdAt < windowStart) return false;
  if (!Number.isFinite(total) || total <= 0) return false;

  const orderStatus = order?.status?.trim().toLowerCase();
  const paymentStatus = order?.paymentStatus?.trim().toLowerCase();
  return orderStatus !== "cancelled"
    && orderStatus !== "canceled"
    && orderStatus !== "refunded"
    && paymentStatus !== "refunded";
}

export function calculatePeakHours(
  transactions: PeakTransaction[],
  orders: PeakOrder[],
  now: Date = new Date(),
) {
  const windowStart = getPeakWindowStart(now);
  const orderMap = new Map(orders.map((order) => [order.id, order]));
  const salesByHour = Array.from({ length: 24 }, () => 0);

  for (const transaction of transactions) {
    const order = transaction.orderId ? orderMap.get(transaction.orderId) : undefined;
    if (!isCountedPeakSale(transaction, order, windowStart)) continue;
    salesByHour[getRiyadhHour(transaction.createdAt)] += Number(transaction.total);
  }

  const hourlyData = salesByHour.map((sales, hour) => ({
    hour,
    sales: Number(sales.toFixed(2)),
  }));
  const peak = hourlyData.reduce(
    (best, current) => current.sales > best.sales ? current : best,
    { hour: -1, sales: 0 },
  );

  return {
    hourlyData,
    peakHour: peak.hour,
    peakSales: peak.sales,
    timezone: PEAK_HOURS_TIMEZONE,
    windowStart,
  };
}