// Geidea Payment Gateway Integration
// Documentation: https://docs.geidea.net/

interface CreateSessionParams {
  amount: number;
  merchantReferenceId: string;
  callbackUrl: string;
  customerEmail?: string;
  language?: string;
  cardOnFile?: boolean;
  initiatedBy?: 'Internet' | 'Merchant';
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

interface ChargeWithTokenParams {
  tokenId: string;
  amount: number;
  currency?: string;
  merchantReferenceId: string;
  callbackUrl?: string;
}

interface PayByTokenResponse {
  order?: {
    orderId: string;
    status: string;
    detailedStatus: string;
    amount: number;
    currency: string;
    merchantReferenceId: string;
    tokenId?: string;
  };
  responseCode?: string;
  responseMessage?: string;
  detailedResponseCode?: string;
  detailedResponseMessage?: string;
}

function getCredentials(): string {
  const publicKey = process.env.GEIDEA_PUBLIC_KEY;
  const apiPassword = process.env.GEIDEA_API_PASSWORD;
  
  if (!publicKey || !apiPassword) {
    throw new Error('Geidea credentials not configured (GEIDEA_PUBLIC_KEY, GEIDEA_API_PASSWORD)');
  }
  
  return Buffer.from(`${publicKey}:${apiPassword}`).toString('base64');
}

export async function createPaymentSession(params: CreateSessionParams): Promise<SessionResponse> {
  const credentials = getCredentials();
  
  const requestBody: any = {
    amount: params.amount,
    currency: 'SAR',
    merchantReferenceId: params.merchantReferenceId,
    callbackUrl: params.callbackUrl,
    returnUrl: params.callbackUrl,
    language: params.language || 'en',
  };

  if (params.customerEmail) {
    requestBody.customer = { email: params.customerEmail };
  }

  // Enable card tokenization for recurring payments
  if (params.cardOnFile) {
    requestBody.cardOnFile = true;
    requestBody.initiatedBy = params.initiatedBy || 'Internet';
  }
  
  const response = await fetch('https://api.merchant.geidea.net/pgw/api/v1/direct/session', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Basic ${credentials}`,
    },
    body: JSON.stringify(requestBody),
  });
  
  if (!response.ok) {
    const errorText = await response.text();
    console.error('[Geidea] Session creation failed:', errorText);
    throw new Error(`Geidea API error: ${response.status}`);
  }
  
  return response.json();
}

export async function chargeWithToken(params: ChargeWithTokenParams): Promise<PayByTokenResponse> {
  const credentials = getCredentials();
  
  const requestBody = {
    tokenId: params.tokenId,
    amount: params.amount,
    currency: params.currency || 'SAR',
    merchantReferenceId: params.merchantReferenceId,
    initiatedBy: 'Merchant',
    agreementId: params.merchantReferenceId,
    agreementType: 'Recurring',
  };

  console.log(`[Geidea] Charging token ${params.tokenId} for ${params.amount} ${params.currency || 'SAR'}`);
  
  const response = await fetch('https://api.merchant.geidea.net/pgw/api/v1/direct/pay/token', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Basic ${credentials}`,
    },
    body: JSON.stringify(requestBody),
  });
  
  const result = await response.json();
  
  if (!response.ok) {
    console.error('[Geidea] Token charge failed:', JSON.stringify(result));
    throw new Error(result.detailedResponseMessage || result.responseMessage || `Geidea API error: ${response.status}`);
  }
  
  console.log(`[Geidea] Token charge successful: orderId=${result.order?.orderId}, status=${result.order?.status}`);
  return result;
}

export async function getOrderDetails(orderId: string): Promise<any> {
  const credentials = getCredentials();
  
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

export function extractTokenFromOrder(order: any): string | null {
  // Check direct tokenId on order
  if (order?.tokenId) {
    return order.tokenId;
  }
  
  // Check paymentMethod.tokenId
  if (order?.paymentMethod?.tokenId) {
    return order.paymentMethod.tokenId;
  }
  
  // Check all transactions (starting from most recent) for tokenId
  if (order?.transactions && Array.isArray(order.transactions) && order.transactions.length > 0) {
    // Scan from last (most recent) to first
    for (let i = order.transactions.length - 1; i >= 0; i--) {
      const tx = order.transactions[i];
      if (tx?.tokenId) {
        return tx.tokenId;
      }
      if (tx?.paymentMethod?.tokenId) {
        return tx.paymentMethod.tokenId;
      }
    }
  }
  
  return null;
}
