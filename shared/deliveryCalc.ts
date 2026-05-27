// Canonical delivery-app fee formula used by both POS (client) and
// Delivery-App Profitability (server). Keeping a single implementation
// guarantees the POS Cart total and the profitability "Restaurant Net"
// column produce identical numbers down to the halala.
//
// Formula (per owner spec):
//   subsidizedPrice = gross - subsidy
//   commission      = subsidizedPrice * commission%
//   banking         = gross * banking%
//   vat             = (commission + subsidy + banking) * 15%
//   net             = gross - commission - subsidy - banking - vat - posFees

export interface DeliveryCalcInput {
  gross: number;
  subsidy: number;
  commissionPercent: number;
  bankingFeesPercent: number;
  posFees: number;
}

export interface DeliveryCalcResult {
  gross: number;
  subsidy: number;
  subsidizedPrice: number;
  commission: number;
  banking: number;
  vat: number;
  posFees: number;
  net: number;
}

export const DELIVERY_VAT_RATE = 0.15;

export function roundHalala(n: number): number {
  // Round to 2 decimals (SAR halala) with safe binary-rounding nudge.
  if (!isFinite(n)) return 0;
  return Math.round((n + Number.EPSILON) * 100) / 100;
}

export function calcDeliveryBreakdown(input: DeliveryCalcInput): DeliveryCalcResult {
  const gross = Number(input.gross) || 0;
  const subsidy = Number(input.subsidy) || 0;
  const commissionPercent = Number(input.commissionPercent) || 0;
  const bankingFeesPercent = Number(input.bankingFeesPercent) || 0;
  const posFees = Number(input.posFees) || 0;

  const subsidizedPrice = gross - subsidy;
  const commission = subsidizedPrice * (commissionPercent / 100);
  const banking = gross * (bankingFeesPercent / 100);
  const vat = (commission + subsidy + banking) * DELIVERY_VAT_RATE;
  const net = gross - commission - subsidy - banking - vat - posFees;

  return {
    gross: roundHalala(gross),
    subsidy: roundHalala(subsidy),
    subsidizedPrice: roundHalala(subsidizedPrice),
    commission: roundHalala(commission),
    banking: roundHalala(banking),
    vat: roundHalala(vat),
    posFees: roundHalala(posFees),
    net: roundHalala(net),
  };
}

// Resolve subsidy SAR from a delivery app's tier list for a given gross.
// Mirrors the tier-matching used by POS so the parity check can compute
// subsidy from the same inputs.
export interface SubsidyTier {
  minAmount: number | string;
  maxAmount: number | string | null | undefined;
  subsidy: number | string;
}

export function resolveSubsidy(gross: number, tiers: SubsidyTier[] | null | undefined): number {
  if (!Array.isArray(tiers)) return 0;
  const g = Number(gross) || 0;
  const tier = tiers.find((t) => {
    const min = Number(t.minAmount) || 0;
    const max = t.maxAmount === null || t.maxAmount === undefined ? Infinity : Number(t.maxAmount);
    return g >= min && g <= max;
  });
  return tier ? Number(tier.subsidy) || 0 : 0;
}
