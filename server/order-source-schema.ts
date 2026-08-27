import { z } from "zod";

/** Restaurant POS submits identities/quantities only. Financial values are
 * accepted only for backwards-compatible parsing and are intentionally omitted
 * from the canonical order construction. */
export const restaurantSourceOrderSchema = z.object({
  orderNumber: z.string().trim().min(1).max(200),
  branchId: z.string().min(1),
  orderType: z.string().trim().min(1).max(100),
  table: z.string().max(200).optional().nullable(),
  address: z.string().max(4000).optional().nullable(),
  customerId: z.string().min(1).optional().nullable(),
  customerName: z.string().max(500).optional().nullable(),
  customerPhone: z.string().max(100).optional().nullable(),
  deliveryAppId: z.string().min(1).optional().nullable(),
  earningsDecreaseApplied: z.boolean().optional(),
  discountCode: z.string().max(200).optional().nullable(),
  paymentMethod: z.string().max(100).optional(),
  moyasarPaymentId: z.string().trim().min(1).max(300).optional().nullable(),
  paymentStatus: z.enum(["Unpaid", "Paid", "Refunded"]).optional(),
  status: z.string().max(100).optional(),
  items: z.array(z.object({
    id: z.string().min(1),
    quantity: z.number().int().positive().max(1000),
    addonIds: z.array(z.string().min(1)).max(100).optional(),
    addons: z.array(z.object({ id: z.string().min(1) }).passthrough()).max(100).optional(),
    name: z.unknown().optional(),
    price: z.unknown().optional(),
  }).strict()).min(1).max(500),
  subtotal: z.unknown().optional(), tax: z.unknown().optional(), total: z.unknown().optional(),
  discountAmount: z.unknown().optional(), promotionPreview: z.unknown().optional(),
}).strict();