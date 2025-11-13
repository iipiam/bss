export const VAT_RATE = 0.15;

export type SubscriptionPlan = 'weekly' | 'monthly' | 'yearly';

export interface PricingBreakdown {
  basePrice: number;
  perBranchPrice: number;
  netAmount: number;
  vatAmount: number;
  grossAmount: number;
  branches: number;
}

const NET_BASE_PRICES: Record<SubscriptionPlan, number> = {
  weekly: 66.33,
  monthly: 199,
  yearly: 1990
};

const NET_PER_BRANCH_PRICES: Record<SubscriptionPlan, number> = {
  weekly: 11.63,
  monthly: 33.23,
  yearly: 398.63
};

export function getPlanPricing(plan: SubscriptionPlan, branchesCount: number = 1): PricingBreakdown {
  const basePrice = NET_BASE_PRICES[plan];
  const perBranchPrice = NET_PER_BRANCH_PRICES[plan];
  const additionalBranches = Math.max(0, branchesCount - 1);
  
  const netAmount = basePrice + (perBranchPrice * additionalBranches);
  const vatAmount = netAmount * VAT_RATE;
  const grossAmount = netAmount + vatAmount;
  
  return {
    basePrice,
    perBranchPrice,
    netAmount,
    vatAmount,
    grossAmount,
    branches: branchesCount
  };
}

export function formatPricing(breakdown: PricingBreakdown): string {
  return breakdown.grossAmount.toFixed(2);
}

export function getPlanDisplayName(plan: SubscriptionPlan): string {
  const names: Record<SubscriptionPlan, string> = {
    weekly: 'Weekly',
    monthly: 'Monthly',
    yearly: 'Yearly'
  };
  return names[plan];
}
