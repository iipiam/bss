// Geidea Payment Gateway Integration
// Documentation: https://docs.geidea.net/
// KSA Merchant API: https://api.ksamerchant.geidea.net

import crypto from 'crypto';

const GEIDEA_KSA_BASE_URL = 'https://api.ksamerchant.geidea.net';
const GEIDEA_KSA_HPP_URL = 'https://www.ksamerchant.geidea.net/hpp/checkout';

// Generate HMAC-SHA256 signature for Geidea API requests
function generateSignature(
  merchantPublicKey: string,
  amount: number,
  currency: string,
  merchantReferenceId: string,
  timestamp: string,
  apiPassword: string
): string {
  // Format amount with exactly 2 decimal places
  const amountStr = amount.toFixed(2);
  // Concatenate in the exact order required by Geidea
  const data = `${merchantPublicKey}${amountStr}${currency}${merchantReferenceId}${timestamp}`;
  // Create HMAC-SHA256 hash using API password
  const hmac = crypto.createHmac('sha256', apiPassword);
  hmac.update(data);
  // Return base64 encoded signature
  return hmac.digest('base64');
}

interface CreateSessionParams {
  amount: number;
  merchantReferenceId: string;
  callbackUrl: string;
  currency?: string;
  customerEmail?: string;
  customerName?: string;
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
  const publicKey = process.env.GEIDEA_PUBLIC_KEY;
  const apiPassword = process.env.GEIDEA_API_PASSWORD;
  
  if (!publicKey || !apiPassword) {
    throw new Error('Geidea credentials not configured (GEIDEA_PUBLIC_KEY, GEIDEA_API_PASSWORD)');
  }
  
  const credentials = Buffer.from(`${publicKey}:${apiPassword}`).toString('base64');
  
  // Round amount to 2 decimal places to avoid floating point issues
  const roundedAmount = Math.round(params.amount * 100) / 100;
  
  // Generate timestamp in ISO format
  const timestamp = new Date().toISOString();
  
  // Generate signature using HMAC-SHA256
  const signature = generateSignature(
    publicKey,
    roundedAmount,
    'SAR',
    params.merchantReferenceId,
    timestamp,
    apiPassword
  );
  
  const requestBody: any = {
    amount: roundedAmount,
    currency: 'SAR',
    merchantReferenceId: params.merchantReferenceId,
    callbackUrl: params.callbackUrl,
    returnUrl: params.callbackUrl,
    language: params.language || 'en',
    timestamp: timestamp,
    signature: signature,
  };
  
  // Log the request for debugging
  console.log('[Geidea] Creating session with request:', JSON.stringify(requestBody, null, 2));

  if (params.customerEmail) {
    requestBody.customer = { email: params.customerEmail };
  }

  // Enable card tokenization for recurring payments
  if (params.cardOnFile) {
    requestBody.cardOnFile = true;
    requestBody.initiatedBy = params.initiatedBy || 'Internet';
  }
  
  const response = await fetch(`${GEIDEA_KSA_BASE_URL}/payment-intent/api/v2/direct/session`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Basic ${credentials}`,
    },
    body: JSON.stringify(requestBody),
  });
  
  const responseData = await response.json();
  
  // Log the full response for debugging
  console.log('[Geidea] Session response:', JSON.stringify(responseData, null, 2));
  
  if (!response.ok) {
    console.error('[Geidea] Session creation failed:', responseData);
    throw new Error(responseData.detailedResponseMessage || responseData.responseMessage || `Geidea API error: ${response.status}`);
  }
  
  // Handle different response structures from Geidea API
  // Some responses have 'session' wrapper, others have the data directly
  if (responseData.session) {
    // Construct the HPP checkout URL using the session ID
    const sessionId = responseData.session.id;
    responseData.session.paymentUrl = `${GEIDEA_KSA_HPP_URL}?sessionId=${sessionId}`;
    return responseData;
  } else if (responseData.id || responseData.sessionId) {
    // If the session data is at the root level, wrap it
    const sessionId = responseData.sessionId || responseData.id;
    return {
      session: {
        id: sessionId,
        paymentUrl: `${GEIDEA_KSA_HPP_URL}?sessionId=${sessionId}`,
        paymentIntent: responseData.paymentIntent,
      }
    };
  } else {
    console.error('[Geidea] Unexpected response structure:', responseData);
    throw new Error(responseData.detailedResponseMessage || responseData.responseMessage || 'Invalid Geidea response structure');
  }
}

export async function chargeWithToken(params: ChargeWithTokenParams): Promise<PayByTokenResponse> {
  const credentials = getCredentials();
  
  // Round amount to 2 decimal places to avoid floating point issues
  const roundedAmount = Math.round(params.amount * 100) / 100;
  
  const requestBody = {
    tokenId: params.tokenId,
    amount: roundedAmount,
    currency: params.currency || 'SAR',
    merchantReferenceId: params.merchantReferenceId,
    initiatedBy: 'Merchant',
    agreementId: params.merchantReferenceId,
    agreementType: 'Recurring',
  };

  console.log(`[Geidea] Charging token ${params.tokenId} for ${params.amount} ${params.currency || 'SAR'}`);
  
  const response = await fetch(`${GEIDEA_KSA_BASE_URL}/pgw/api/v2/direct/pay/token`, {
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
  
  const response = await fetch(`${GEIDEA_KSA_BASE_URL}/pgw/api/v2/direct/order/${orderId}`, {
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
