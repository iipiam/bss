// Geidea Payment Gateway Integration
// Documentation: https://docs.geidea.net/

interface CreateSessionParams {
  amount: number;
  merchantReferenceId: string;
  callbackUrl: string;
  customerEmail?: string;
  language?: string;
}

interface SessionResponse {
  session: {
    id: string;
    paymentUrl?: string;
    paymentIntent?: {
      redirectUrl?: string;
    };
  };
}

export async function createPaymentSession(params: CreateSessionParams): Promise<SessionResponse> {
  const merchantKey = process.env.GEIDEA_MERCHANT_KEY;
  const apiPassword = process.env.GEIDEA_API_PASSWORD;
  
  if (!merchantKey || !apiPassword) {
    throw new Error('Geidea credentials not configured');
  }
  
  const credentials = Buffer.from(`${merchantKey}:${apiPassword}`).toString('base64');
  
  const response = await fetch('https://api.merchant.geidea.net/pgw/api/v1/direct/session', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Basic ${credentials}`,
    },
    body: JSON.stringify({
      amount: params.amount,
      currency: 'SAR',
      merchantReferenceId: params.merchantReferenceId,
      callbackUrl: params.callbackUrl,
      returnUrl: params.callbackUrl,
      language: params.language || 'en',
      customer: params.customerEmail ? { email: params.customerEmail } : undefined,
    }),
  });
  
  if (!response.ok) {
    const errorText = await response.text();
    console.error('[Geidea] Session creation failed:', errorText);
    throw new Error(`Geidea API error: ${response.status}`);
  }
  
  return response.json();
}

export async function getOrderDetails(orderId: string): Promise<any> {
  const merchantKey = process.env.GEIDEA_MERCHANT_KEY;
  const apiPassword = process.env.GEIDEA_API_PASSWORD;
  
  if (!merchantKey || !apiPassword) {
    throw new Error('Geidea credentials not configured');
  }
  
  const credentials = Buffer.from(`${merchantKey}:${apiPassword}`).toString('base64');
  
  const response = await fetch(`https://api.merchant.geidea.net/pgw/api/v1/direct/order/${orderId}`, {
    method: 'GET',
    headers: {
      'Authorization': `Basic ${credentials}`,
    },
  });
  
  if (!response.ok) {
    const errorText = await response.text();
    console.error('[Geidea] Get order failed:', errorText);
    throw new Error(`Geidea API error: ${response.status}`);
  }
  
  return response.json();
}

export function isPaymentSuccessful(status: string): boolean {
  const successStatuses = ['Success', 'Captured', 'Paid'];
  return successStatuses.includes(status);
}

export function isPaymentFailed(status: string): boolean {
  const failedStatuses = ['Failed', 'Cancelled', 'Declined', 'Expired', 'TimedOut'];
  return failedStatuses.includes(status);
}
