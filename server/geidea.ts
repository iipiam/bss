import crypto from 'crypto';

const GEIDEA_BASE_URL = 'https://api.ksamerchant.geidea.net';

interface GeideaConfig {
  publicKey: string;
  apiPassword: string;
  merchantKey: string;
}

interface CreateSessionParams {
  amount: number;
  currency?: string;
  merchantReferenceId: string;
  callbackUrl: string;
  customerEmail?: string;
  language?: 'en' | 'ar';
}

interface CreatePaymentLinkParams {
  amount: number;
  currency?: string;
  merchantReferenceId: string;
  callbackUrl: string;
  customerName?: string;
  customerEmail?: string;
  customerPhone?: string;
  description?: string;
  expiryDate?: string;
}

interface GeideaSession {
  session: {
    id: string;
    redirectUrl?: string;
  };
}

interface GeideaPaymentLink {
  paymentIntent: {
    link: string;
    paymentIntentId: string;
  };
}

interface GeideaOrder {
  order: {
    orderId: string;
    status: string;
    detailedStatus: string;
    merchantReferenceId: string;
    amount: string;
    currency: string;
    transactions?: Array<{
      transactionId: string;
      status: string;
      paymentMethod?: {
        brand: string;
        maskedCardNumber: string;
      };
    }>;
  };
}

function getConfig(): GeideaConfig {
  const publicKey = process.env.GEIDEA_PUBLIC_KEY;
  const apiPassword = process.env.GEIDEA_API_PASSWORD;
  const merchantKey = process.env.GEIDEA_MERCHANT_KEY;

  if (!publicKey || !apiPassword || !merchantKey) {
    throw new Error('Geidea credentials not configured. Set GEIDEA_PUBLIC_KEY, GEIDEA_API_PASSWORD, and GEIDEA_MERCHANT_KEY environment variables.');
  }

  return { publicKey, apiPassword, merchantKey };
}

function getAuthHeader(): string {
  const { publicKey, apiPassword } = getConfig();
  return 'Basic ' + Buffer.from(`${publicKey}:${apiPassword}`).toString('base64');
}

function calculateSignature(amount: number, currency: string, merchantReferenceId: string): string {
  const { merchantKey, apiPassword } = getConfig();
  const amountStr = amount.toFixed(2);
  const dataString = `${merchantKey}${amountStr}${currency}${merchantReferenceId}`;
  
  const signature = crypto
    .createHmac('sha256', apiPassword)
    .update(dataString)
    .digest('base64');
  
  return signature;
}

export async function createPaymentSession(params: CreateSessionParams): Promise<GeideaSession> {
  const { amount, currency = 'SAR', merchantReferenceId, callbackUrl, customerEmail, language = 'en' } = params;
  
  const signature = calculateSignature(amount, currency, merchantReferenceId);
  
  const response = await fetch(`${GEIDEA_BASE_URL}/payment-intent/api/v2/direct/session`, {
    method: 'POST',
    headers: {
      'Authorization': getAuthHeader(),
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      amount: parseFloat(amount.toFixed(2)),
      currency,
      merchantReferenceId,
      callbackUrl,
      signature,
      language,
      cardOnFile: false,
      ...(customerEmail && { customerEmail }),
    }),
  });

  if (!response.ok) {
    const errorText = await response.text();
    console.error('[Geidea] Session creation failed:', errorText);
    throw new Error(`Geidea session creation failed: ${response.status} - ${errorText}`);
  }

  return response.json();
}

export async function createPaymentLink(params: CreatePaymentLinkParams): Promise<GeideaPaymentLink> {
  const { 
    amount, 
    currency = 'SAR', 
    merchantReferenceId, 
    callbackUrl, 
    customerName,
    customerEmail, 
    customerPhone,
    description,
    expiryDate
  } = params;

  const requestBody: any = {
    amount: parseFloat(amount.toFixed(2)),
    currency,
    merchantReferenceId,
    callbackUrl,
    language: 'en',
  };

  if (customerName || customerEmail || customerPhone) {
    requestBody.customer = {};
    if (customerName) requestBody.customer.name = customerName;
    if (customerEmail) requestBody.customer.email = customerEmail;
    if (customerPhone) {
      requestBody.customer.phoneCountryCode = '+966';
      requestBody.customer.phoneNumber = customerPhone.replace(/^\+?966/, '');
    }
  }

  if (description) {
    requestBody.eInvoiceDetails = {
      subtotal: parseFloat(amount.toFixed(2)),
      grandTotal: parseFloat(amount.toFixed(2)),
      extraChargesType: 'Amount',
      invoiceDiscountType: 'Amount',
      eInvoiceItems: [{
        description,
        price: parseFloat(amount.toFixed(2)),
        quantity: 1,
        total: parseFloat(amount.toFixed(2)),
      }],
      callbackurl: callbackUrl,
    };
  }

  if (expiryDate) {
    requestBody.expiryDate = expiryDate;
  }

  const response = await fetch(`${GEIDEA_BASE_URL}/payment-intent/api/v1/direct/eInvoice`, {
    method: 'POST',
    headers: {
      'Authorization': getAuthHeader(),
      'Content-Type': 'application/json',
      'Accept': 'application/json',
    },
    body: JSON.stringify(requestBody),
  });

  if (!response.ok) {
    const errorText = await response.text();
    console.error('[Geidea] Payment link creation failed:', errorText);
    throw new Error(`Geidea payment link creation failed: ${response.status} - ${errorText}`);
  }

  return response.json();
}

export async function getOrderDetails(orderId: string): Promise<GeideaOrder> {
  const response = await fetch(`${GEIDEA_BASE_URL}/payment-intent/api/v1/orders/${orderId}`, {
    method: 'GET',
    headers: {
      'Authorization': getAuthHeader(),
      'Accept': 'application/json',
    },
  });

  if (!response.ok) {
    const errorText = await response.text();
    console.error('[Geidea] Get order failed:', errorText);
    throw new Error(`Geidea get order failed: ${response.status} - ${errorText}`);
  }

  return response.json();
}

export function verifyWebhookSignature(payload: string, receivedSignature: string): boolean {
  const { apiPassword } = getConfig();
  const calculatedSignature = crypto
    .createHmac('sha256', apiPassword)
    .update(payload)
    .digest('base64');
  
  return calculatedSignature === receivedSignature;
}

export function isPaymentSuccessful(status: string): boolean {
  return status === 'Success' || status === 'Paid';
}

export function isPaymentPending(status: string): boolean {
  return status === 'Pending' || status === 'InProgress';
}

export function isPaymentFailed(status: string): boolean {
  return status === 'Failed' || status === 'Cancelled' || status === 'Declined';
}
