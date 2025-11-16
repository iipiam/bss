import { useMemo } from 'react';
import { useAuth } from '@/lib/auth';
import { useLanguage } from '@/contexts/LanguageContext';

/**
 * Custom hook to access business type and provide conditional terminology
 * for factory vs restaurant accounts across the application
 */
export function useBusinessType() {
  const { restaurant } = useAuth();
  const { t } = useLanguage();

  // Get businessType from restaurant data (defaults to 'restaurant')
  const businessType: 'restaurant' | 'factory' = (restaurant?.businessType as 'restaurant' | 'factory') || 'restaurant';
  const isFactory = businessType === 'factory';
  const isRestaurant = businessType === 'restaurant';

  // Memoized labels for conditional terminology
  const labels = useMemo(() => ({
    // Kitchen / Workshop
    kitchen: isFactory ? t.workshop : t.kitchen,
    
    // Menu / Products
    menu: isFactory ? t.products : t.menu,
    
    // Shop / Factory
    shop: isFactory ? t.factory : t.shop,
    
    // Location Type (for descriptions like "restaurant locations" or "factory locations")
    // Uses dedicated lowercase translations for "restaurant" and "factory"
    locationType: isFactory ? t.factoryLowercase : t.restaurant,
    
    // Additional derived labels (singular and plural forms)
    menuItem: isFactory ? t.product : t.menuItem,
    menuItems: isFactory ? t.products : t.menuItems,  // Proper plural forms for both modes
  }), [isFactory, t]);

  return {
    businessType,
    isFactory,
    isRestaurant,
    labels,
    restaurant,
  };
}
