export async function orchestrateZatcaInvoice<T extends {
  submissionStatus: string; signedXml?: string | null; invoiceHash?: string | null; invoiceCounter?: number | null;
}>(
  existing: T | undefined,
  sign: () => Promise<any>,
  retry: () => Promise<any>,
  retrySigned = false,
) {
  if (!existing) return sign();
  const final = ["submitted", "cleared", "reported", "warning"].includes(existing.submissionStatus);
  if (retrySigned && !final && ["pending", "rejected"].includes(existing.submissionStatus) && existing.signedXml) return retry();
  return { success: existing.submissionStatus !== "rejected", submissionStatus: existing.submissionStatus, reused: true };
}