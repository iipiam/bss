export const VAT_RATE = 0.15;

export type SubscriptionPlan = 'weekly' | 'monthly' | 'yearly';
export type BusinessType = 'restaurant' | 'factory' | 'real_estate' | 'design_services' | 'installation_services' | 'it_services';

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

// GROSS prices (VAT-inclusive) for base plan (1 branch) - REAL ESTATE / PROPERTY MANAGEMENT
// Used when restaurantType === "Property Management".
const GROSS_BASE_PRICES_REAL_ESTATE_PM: Record<SubscriptionPlan, number> = {
  weekly: 299,
  monthly: 999,
  yearly: 8400
};

// GROSS prices (VAT-inclusive) per additional branch - REAL ESTATE / PROPERTY MANAGEMENT
const GROSS_PER_BRANCH_PRICES_REAL_ESTATE_PM: Record<SubscriptionPlan, number> = {
  weekly: 59.80,   // ~20% of base weekly price per additional branch
  monthly: 79.80,  // ~20% of base monthly price per additional branch
  yearly: 1680     // 20% of base yearly price per additional branch
};

// GROSS prices (VAT-inclusive) for base plan (1 branch) - REAL ESTATE / BROKERAGE OFFICE
// Used when restaurantType === "Brokerage Office" (or any non-Property-Management real_estate subtype).
// Brokerage offices keep the original real_estate pricing (yearly 4,900 SAR) since the
// Property Management vertical's extra features are what justify the 8,400 SAR yearly fee.
const GROSS_BASE_PRICES_REAL_ESTATE_BROKERAGE: Record<SubscriptionPlan, number> = {
  weekly: 299,
  monthly: 999,
  yearly: 4900
};

const GROSS_PER_BRANCH_PRICES_REAL_ESTATE_BROKERAGE: Record<SubscriptionPlan, number> = {
  weekly: 59.80,
  monthly: 79.80,
  yearly: 499.80
};

// GROSS prices (VAT-inclusive) for base plan (1 branch) - SERVICE BUSINESSES
const GROSS_BASE_PRICES_SERVICES: Record<SubscriptionPlan, number> = {
  weekly: 0,       // Not available for service businesses
  monthly: 399,
  yearly: 2499
};

// GROSS prices (VAT-inclusive) per additional branch - SERVICE BUSINESSES
const GROSS_PER_BRANCH_PRICES_SERVICES: Record<SubscriptionPlan, number> = {
  weekly: 0,       // Not available for service businesses
  monthly: 79.80,  // ~20% of base monthly price per additional branch
  yearly: 499.80   // ~20% of base yearly price per additional branch
};

// Real-estate is split into two pricing profiles: Property Management (PM) gets
// the full vertical (rental contracts, accounting, etc.) at the higher yearly
// fee. Brokerage Office keeps the original lower fee. Detection is case- and
// whitespace-insensitive so old DB rows still resolve to the right ladder.
function isPropertyManagement(restaurantType?: string | null): boolean {
  if (!restaurantType) return false;
  return restaurantType.trim().toLowerCase() === 'property management';
}

function getBasePrices(businessType: BusinessType, restaurantType?: string | null): Record<SubscriptionPlan, number> {
  switch (businessType) {
    case 'factory': return GROSS_BASE_PRICES_FACTORY;
    case 'real_estate':
      return isPropertyManagement(restaurantType)
        ? GROSS_BASE_PRICES_REAL_ESTATE_PM
        : GROSS_BASE_PRICES_REAL_ESTATE_BROKERAGE;
    case 'design_services':
    case 'installation_services':
    case 'it_services':
      return GROSS_BASE_PRICES_SERVICES;
    default: return GROSS_BASE_PRICES_RESTAURANT;
  }
}

function getBranchPrices(businessType: BusinessType, restaurantType?: string | null): Record<SubscriptionPlan, number> {
  switch (businessType) {
    case 'factory': return GROSS_PER_BRANCH_PRICES_FACTORY;
    case 'real_estate':
      return isPropertyManagement(restaurantType)
        ? GROSS_PER_BRANCH_PRICES_REAL_ESTATE_PM
        : GROSS_PER_BRANCH_PRICES_REAL_ESTATE_BROKERAGE;
    case 'design_services':
    case 'installation_services':
    case 'it_services':
      return GROSS_PER_BRANCH_PRICES_SERVICES;
    default: return GROSS_PER_BRANCH_PRICES_RESTAURANT;
  }
}

export function getPlanPricing(
  plan: SubscriptionPlan,
  branchesCount: number = 1,
  businessType: BusinessType = 'restaurant',
  restaurantType?: string | null
): PricingBreakdown {
  const GROSS_BASE_PRICES = getBasePrices(businessType, restaurantType);
  const GROSS_PER_BRANCH_PRICES = getBranchPrices(businessType, restaurantType);
  
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
