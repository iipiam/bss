export interface PaymentVerificationInput {
  requestedId?: string | null;
  paymentMethod?: string | null;
  expectedAmountHalalas: number;
  restaurantId: string;
  record?: { id: string; restaurantId: string; moyasarId: string; orderId?: string | null } | null;
  provider?: { id: string; status: string; currency: string; amount: number };
}

export function verifyOnlinePayment(input: PaymentVerificationInput) {
  const online = input.paymentMethod === "Online" || !!input.requestedId;
  if (!online) return { paymentStatus: "Unpaid" as const, moyasarPaymentId: undefined, paymentRecordId: undefined };
  if (!input.requestedId || !input.record || !input.provider) throw new Error("A verified online payment is required");
  if (input.record.restaurantId !== input.restaurantId || input.record.moyasarId !== input.requestedId) throw new Error("Payment does not belong to this restaurant");
  if (input.record.orderId) throw new Error("Payment is already linked to another order");
  if (input.provider.id !== input.requestedId || input.provider.status !== "paid") throw new Error("Payment is not paid");
  if (input.provider.currency.toUpperCase() !== "SAR") throw new Error("Payment currency must be SAR");
  if (Number(input.provider.amount) !== input.expectedAmountHalalas) throw new Error("Payment amount does not match order total");
  return { paymentStatus: "Paid" as const, moyasarPaymentId: input.requestedId, paymentRecordId: input.record.id };
}