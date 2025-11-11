/**
 * Security utility: Sanitize PATCH request body to prevent tenant field hijacking
 * 
 * This helper removes protected multi-tenant fields (restaurantId, branchId, userId)
 * from update request bodies before schema validation. This prevents malicious users
 * from moving records between tenants/branches by including these fields in PATCH requests.
 * 
 * @example
 * ```typescript
 * // VULNERABLE - allows restaurantId manipulation
 * const data = insertDeliveryAppSchema.partial().parse(req.body);
 * 
 * // SECURE - strips protected fields first
 * const data = sanitizePatchBody(req.body, insertDeliveryAppSchema.partial());
 * ```
 */

import { ZodSchema } from 'zod';

/**
 * Protected fields that should never be updated via PATCH requests
 * 
 * IMPORTANT: Only restaurantId is protected by default for multi-tenant isolation.
 * Other fields like branchId and userId may be legitimately updated (e.g., moving
 * inventory between branches, reassigning salaries), so they should only be
 * blocked via additionalProtectedFields when business rules forbid changes.
 */
const PROTECTED_TENANT_FIELDS = [
  'restaurantId',  // Multi-tenant isolation - NEVER allow changes
] as const;

/**
 * Sanitize a PATCH request body by removing protected tenant fields
 * 
 * @param body - The raw request body from req.body
 * @param schema - The Zod schema to validate against (typically insertXyzSchema.partial())
 * @param additionalProtectedFields - Optional array of extra fields to strip
 * @returns Validated and sanitized data
 * 
 * @throws ZodError if the sanitized body doesn't match the schema
 */
export function sanitizePatchBody<T>(
  body: any,
  schema: ZodSchema<T>,
  additionalProtectedFields: string[] = []
): T {
  if (!body || typeof body !== 'object') {
    return schema.parse(body);
  }

  // Create a new object without protected fields
  const allProtectedFields = [
    ...PROTECTED_TENANT_FIELDS,
    ...additionalProtectedFields
  ];

  const sanitized = Object.keys(body).reduce((acc, key) => {
    if (!allProtectedFields.includes(key)) {
      acc[key] = body[key];
    }
    return acc;
  }, {} as any);

  return schema.parse(sanitized);
}

/**
 * Alternative destructuring approach for simpler cases
 * @deprecated Use sanitizePatchBody instead for consistency
 */
export function stripRestaurantId<T extends Record<string, any>>(body: T): Omit<T, 'restaurantId'> {
  const { restaurantId, ...sanitized } = body;
  return sanitized;
}
