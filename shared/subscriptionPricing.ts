export const VAT_RATE = 0.15;

export type SubscriptionPlan = 'weekly' | 'monthly' | 'yearly';
export type BusinessType = 'restaurant' | 'factory' | 'real_estate';

export interface PricingBreakdown {
  basePrice: number;
  perBranchPrice: number;
  netAmount: number;
  vatAmount: number;
  grossAmount: number;
  branches: number;
}

// GROSS prices (VAT-inclusive) for base plan (1 branch) - RESTAURANT
const GROSS_BASE_PRICES_RESTAURANT: Record<SubscriptionPlan, number> = {
  weekly: 66.33,
  monthly: 199,
  yearly: 1990
};

// GROSS prices (VAT-inclusive) per additional branch - RESTAURANT
const GROSS_PER_BRANCH_PRICES_RESTAURANT: Record<SubscriptionPlan, number> = {
  weekly: 13.37,   // Calculated to maintain pricing consistency
  monthly: 38.21,  // Calculated to maintain pricing consistency
  yearly: 398.00   // Calculated to maintain pricing consistency
};

// GROSS prices (VAT-inclusive) for base plan (1 branch) - FACTORY
const GROSS_BASE_PRICES_FACTORY: Record<SubscriptionPlan, number> = {
  weekly: 0,       // Not available for factory
  monthly: 15000,
  yearly: 150000
};

// GROSS prices (VAT-inclusive) per additional branch - FACTORY
const FACTORY_MONTHLY_PER_BRANCH = 2400; // Base monthly rate per additional branch
const GROSS_PER_BRANCH_PRICES_FACTORY: Record<SubscriptionPlan, number> = {
  weekly: 0,       // Not available for factory - must be blocked in signup validation
  monthly: FACTORY_MONTHLY_PER_BRANCH,  // +2,400 SAR/month per branch (VAT included)
  yearly: FACTORY_MONTHLY_PER_BRANCH * 12   // Auto-calculated: 2,400 × 12 = 28,800 SAR/year per branch
};

// GROSS prices (VAT-inclusive) for base plan (1 branch) - REAL ESTATE
const GROSS_BASE_PRICES_REAL_ESTATE: Record<SubscriptionPlan, number> = {
  weekly: 299,
  monthly: 399,
  yearly: 2499
};

// GROSS prices (VAT-inclusive) per additional branch - REAL ESTATE
const GROSS_PER_BRANCH_PRICES_REAL_ESTATE: Record<SubscriptionPlan, number> = {
  weekly: 59.80,   // ~20% of base weekly price per additional branch
  monthly: 79.80,  // ~20% of base monthly price per additional branch
  yearly: 499.80   // ~20% of base yearly price per additional branch
};

function getBasePrices(businessType: BusinessType): Record<SubscriptionPlan, number> {
  switch (businessType) {
    case 'factory': return GROSS_BASE_PRICES_FACTORY;
    case 'real_estate': return GROSS_BASE_PRICES_REAL_ESTATE;
    default: return GROSS_BASE_PRICES_RESTAURANT;
  }
}

function getBranchPrices(businessType: BusinessType): Record<SubscriptionPlan, number> {
  switch (businessType) {
    case 'factory': return GROSS_PER_BRANCH_PRICES_FACTORY;
    case 'real_estate': return GROSS_PER_BRANCH_PRICES_REAL_ESTATE;
    default: return GROSS_PER_BRANCH_PRICES_RESTAURANT;
  }
}

export function getPlanPricing(plan: SubscriptionPlan, branchesCount: number = 1, businessType: BusinessType = 'restaurant'): PricingBreakdown {
  const GROSS_BASE_PRICES = getBasePrices(businessType);
  const GROSS_PER_BRANCH_PRICES = getBranchPrices(businessType);
  
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
