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

// GROSS prices (VAT-inclusive) for base plan (1 branch)
const GROSS_BASE_PRICES: Record<SubscriptionPlan, number> = {
  weekly: 66.33,
  monthly: 199,
  yearly: 1990
};

// GROSS prices (VAT-inclusive) per additional branch
const GROSS_PER_BRANCH_PRICES: Record<SubscriptionPlan, number> = {
  weekly: 13.37,   // Calculated to maintain pricing consistency
  monthly: 38.21,  // Calculated to maintain pricing consistency
  yearly: 398.00   // Calculated to maintain pricing consistency
};

export function getPlanPricing(plan: SubscriptionPlan, branchesCount: number = 1): PricingBreakdown {
  const grossBasePrice = GROSS_BASE_PRICES[plan];
  const grossPerBranchPrice = GROSS_PER_BRANCH_PRICES[plan];
  const additionalBranches = Math.max(0, branchesCount - 1);
  
  // Calculate total gross amount
  const grossAmount = grossBasePrice + (grossPerBranchPrice * additionalBranches);
  
  // Calculate net amount (removing VAT)
  const netAmount = grossAmount / (1 + VAT_RATE);
  
  // Calculate VAT amount
  const vatAmount = grossAmount - netAmount;
  
  // For invoice line-item breakdown
  const basePrice = grossBasePrice / (1 + VAT_RATE);  // NET base price
  const perBranchPrice = grossPerBranchPrice / (1 + VAT_RATE);  // NET per-branch price
  
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
