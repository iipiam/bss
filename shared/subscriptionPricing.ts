export const VAT_RATE = 0.15;

export type SubscriptionPlan = 'weekly' | 'monthly' | 'yearly';
export type BusinessType = 'restaurant' | 'factory';

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
const GROSS_PER_BRANCH_PRICES_FACTORY: Record<SubscriptionPlan, number> = {
  weekly: 0,       // Not available for factory
  monthly: 28800,  // +28800 SAR/month per branch (VAT included)
  yearly: 0        // Yearly uses monthly rate * 12
};

export function getPlanPricing(plan: SubscriptionPlan, branchesCount: number = 1, businessType: BusinessType = 'restaurant'): PricingBreakdown {
  // Select pricing tables based on business type
  const GROSS_BASE_PRICES = businessType === 'factory' 
    ? GROSS_BASE_PRICES_FACTORY 
    : GROSS_BASE_PRICES_RESTAURANT;
  const GROSS_PER_BRANCH_PRICES = businessType === 'factory' 
    ? GROSS_PER_BRANCH_PRICES_FACTORY 
    : GROSS_PER_BRANCH_PRICES_RESTAURANT;
  
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
