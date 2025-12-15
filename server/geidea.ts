// Geidea Payment Gateway Integration
// Stub file for Geidea payment processing

export async function createPaymentSession(params: {
  amount: number;
  orderId: string;
  returnUrl: string;
  restaurantId: string;
}): Promise<{ sessionId: string; checkoutUrl: string }> {
  throw new Error('Geidea payment integration not configured. Please contact support to set up payment processing.');
}

export function isPaymentSuccessful(status: string): boolean {
  return status === 'SUCCESS' || status === 'CAPTURED';
}

export function isPaymentFailed(status: string): boolean {
  return status === 'FAILED' || status === 'CANCELLED' || status === 'DECLINED';
}

export async function getOrderDetails(orderId: string): Promise<{
  status: string;
  amount: number;
  transactionId?: string;
}> {
  throw new Error('Geidea payment integration not configured. Please contact support to set up payment processing.');
}
