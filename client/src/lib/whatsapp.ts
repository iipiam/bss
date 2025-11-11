/**
 * WhatsApp Deep Linking Utilities
 * Formats phone numbers and creates bilingual WhatsApp message templates
 */

/**
 * Normalizes phone number to international format for WhatsApp
 * Ensures +966 country code for Saudi numbers
 */
export function formatPhoneForWhatsApp(phone: string): string {
  // Remove all non-numeric characters
  let cleaned = phone.replace(/\D/g, '');
  
  // Handle international prefix "00" (e.g., 00966512345678)
  if (cleaned.startsWith('00')) {
    cleaned = cleaned.substring(2); // Remove "00"
    return `+${cleaned}`;
  }
  
  // If starts with 966, add +
  if (cleaned.startsWith('966')) {
    return `+${cleaned}`;
  }
  
  // If starts with single 0, replace with +966 (local Saudi format)
  if (cleaned.startsWith('0')) {
    return `+966${cleaned.substring(1)}`;
  }
  
  // If no country code, assume Saudi and add +966
  if (cleaned.length === 9 || cleaned.length === 10) {
    return `+966${cleaned}`;
  }
  
  // International number without prefix
  return `+${cleaned}`;
}

/**
 * Creates bilingual WhatsApp message for invoice delivery
 */
export function createWhatsAppInvoiceMessage(params: {
  invoiceNumber: string;
  total: string;
  paymentMethod: string;
  invoiceUrl: string;
  restaurantName?: string;
}): string {
  const { invoiceNumber, total, paymentMethod, invoiceUrl, restaurantName = "Restaurant" } = params;
  
  const message = `
*${restaurantName}*
Invoice | فاتورة

*Invoice Number | رقم الفاتورة:*
${invoiceNumber}

*Total | الإجمالي:*
${total} SAR (including 15% VAT | شامل ضريبة القيمة المضافة 15%)

*Payment | الدفع:*
${paymentMethod}

*Download Invoice | تحميل الفاتورة:*
${invoiceUrl}

ZATCA Compliant E-Invoice
فاتورة إلكترونية متوافقة مع هيئة الزكاة والضريبة والجمارك

Thank you for your business! | شكراً لتعاملكم معنا
`.trim();
  
  return message;
}

/**
 * Opens WhatsApp with pre-filled message
 * Returns true if successful, false if failed
 */
export function openWhatsAppWithMessage(phone: string, message: string): boolean {
  try {
    const formattedPhone = formatPhoneForWhatsApp(phone);
    const encodedMessage = encodeURIComponent(message);
    const whatsappUrl = `https://wa.me/${formattedPhone.replace('+', '')}?text=${encodedMessage}`;
    
    // Try to open WhatsApp
    const opened = window.open(whatsappUrl, '_blank');
    
    return opened !== null;
  } catch (error) {
    console.error('Failed to open WhatsApp:', error);
    return false;
  }
}

/**
 * Validates if a phone number is suitable for WhatsApp
 */
export function isValidWhatsAppPhone(phone: string): boolean {
  if (!phone || phone.trim() === '') {
    return false;
  }
  
  const cleaned = phone.replace(/\D/g, '');
  // Saudi numbers are 9 digits (without country code) or 12 with 966
  // Allow international numbers with 10-15 digits
  return cleaned.length >= 9 && cleaned.length <= 15;
}
