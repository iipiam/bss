// @ts-ignore - Moyasar doesn't have TypeScript definitions
import Moyasar from 'moyasar';

// Initialize Moyasar with secret key
const moyasarSecretKey = process.env.MOYASAR_SECRET_KEY || '';
const moyasarPublishableKey = process.env.MOYASAR_PUBLISHABLE_KEY || '';

if (!moyasarSecretKey) {
  console.warn('⚠️  MOYASAR_SECRET_KEY not configured. Payment processing will not work.');
}

if (!moyasarPublishableKey) {
  console.warn('⚠️  MOYASAR_PUBLISHABLE_KEY not configured. Payment form will not work.');
}

// Initialize Moyasar
Moyasar.setApiKey(moyasarSecretKey);

export interface CreatePaymentParams {
  amount: number; // Amount in SAR
  currency?: string;
  description: string;
  callbackUrl?: string;
  source?: {
    type: 'token' | 'creditcard';
    token?: string;
    name?: string;
    number?: string;
    cvc?: string;
    month?: string;
    year?: string;
  };
  metadata?: Record<string, any>;
}

export interface MoyasarPaymentResponse {
  id: string;
  status: 'paid' | 'failed' | 'initiated' | 'authorized';
  amount: number; // Amount in halalas
  fee: number;
  currency: string;
  refunded: number;
  refunded_at: string | null;
  captured: number;
  captured_at: string | null;
  voided_at: string | null;
  description: string;
  amount_format: string;
  fee_format: string;
  refunded_format: string;
  captured_format: string;
  invoice_id: string | null;
  ip: string;
  callback_url: string;
  created_at: string;
  updated_at: string;
  metadata: Record<string, any>;
  source: {
    type: string;
    company: string;
    name: string;
    number: string;
    gateway_id: string;
    reference_number: string;
    token: string;
    message: string;
    transaction_url: string;
  };
}

export interface CreateInvoiceParams {
  amount: number; // Amount in SAR
  currency?: string;
  description: string;
  callbackUrl: string;
  expiredAt?: string;
  metadata?: Record<string, any>;
}

/**
 * Create a payment using Moyasar API
 * Note: For credit card payments, use Moyasar Payment Form on frontend to tokenize cards
 * This method is for server-side payment creation with tokens or other payment methods
 */
export async function createPayment(params: CreatePaymentParams): Promise<MoyasarPaymentResponse> {
  try {
    const amountHalalas = Math.round(params.amount * 100); // Convert SAR to halalas

    const paymentData: any = {
      amount: amountHalalas,
      currency: params.currency || 'SAR',
      description: params.description,
      callback_url: params.callbackUrl,
      metadata: params.metadata || {},
    };

    // Add source if provided (token from frontend)
    if (params.source) {
      paymentData.source = params.source;
    }

    const payment = await Moyasar.payment.create(paymentData);
    return payment as MoyasarPaymentResponse;
  } catch (error: any) {
    console.error('Moyasar payment creation failed:', error);
    throw new Error(error.message || 'Payment creation failed');
  }
}

/**
 * Fetch payment details by ID
 */
export async function fetchPayment(paymentId: string): Promise<MoyasarPaymentResponse> {
  try {
    const payment = await Moyasar.payment.fetch(paymentId);
    return payment as MoyasarPaymentResponse;
  } catch (error: any) {
    console.error('Failed to fetch Moyasar payment:', error);
    throw new Error(error.message || 'Failed to fetch payment');
  }
}

/**
 * Refund a payment (full or partial)
 */
export async function refundPayment(paymentId: string, amount?: number): Promise<MoyasarPaymentResponse> {
  try {
    const payment = await Moyasar.payment.fetch(paymentId);
    
    const refundData: any = {};
    if (amount) {
      refundData.amount = Math.round(amount * 100); // Convert SAR to halalas
    }

    const refundedPayment = await payment.refund(refundData);
    return refundedPayment as MoyasarPaymentResponse;
  } catch (error: any) {
    console.error('Moyasar refund failed:', error);
    throw new Error(error.message || 'Refund failed');
  }
}

/**
 * Capture an authorized payment
 */
export async function capturePayment(paymentId: string, amount?: number): Promise<MoyasarPaymentResponse> {
  try {
    const payment = await Moyasar.payment.fetch(paymentId);
    
    const captureData: any = {};
    if (amount) {
      captureData.amount = Math.round(amount * 100); // Convert SAR to halalas
    }

    const capturedPayment = await payment.capture(captureData);
    return capturedPayment as MoyasarPaymentResponse;
  } catch (error: any) {
    console.error('Moyasar capture failed:', error);
    throw new Error(error.message || 'Capture failed');
  }
}

/**
 * Create a payment invoice (hosted payment page)
 * This is useful for sending payment links to customers
 */
export async function createInvoice(params: CreateInvoiceParams): Promise<any> {
  try {
    const amountHalalas = Math.round(params.amount * 100);

    const invoiceData: any = {
      amount: amountHalalas,
      currency: params.currency || 'SAR',
      description: params.description,
      callback_url: params.callbackUrl,
      metadata: params.metadata || {},
    };

    if (params.expiredAt) {
      invoiceData.expired_at = params.expiredAt;
    }

    const invoice = await Moyasar.invoice.create(invoiceData);
    return invoice;
  } catch (error: any) {
    console.error('Moyasar invoice creation failed:', error);
    throw new Error(error.message || 'Invoice creation failed');
  }
}

/**
 * Get publishable key for frontend
 */
export function getPublishableKey(): string {
  return moyasarPublishableKey;
}

/**
 * Verify webhook signature (if Moyasar implements webhook signatures)
 * For now, verify by fetching payment from Moyasar API
 */
export async function verifyWebhookPayment(paymentId: string): Promise<boolean> {
  try {
    const payment = await fetchPayment(paymentId);
    return payment.status === 'paid';
  } catch (error) {
    return false;
  }
}

export default {
  createPayment,
  fetchPayment,
  refundPayment,
  capturePayment,
  createInvoice,
  getPublishableKey,
  verifyWebhookPayment,
};
