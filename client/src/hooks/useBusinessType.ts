import { useMemo } from 'react';
import { useAuth } from '@/lib/auth';
import { useLanguage } from '@/contexts/LanguageContext';

export type BusinessTypeValue = 'restaurant' | 'factory' | 'real_estate';

export function useBusinessType() {
  const { restaurant } = useAuth();
  const { t } = useLanguage();

  const businessType: BusinessTypeValue = (restaurant?.businessType as BusinessTypeValue) || 'restaurant';
  const isFactory = businessType === 'factory';
  const isRestaurant = businessType === 'restaurant';
  const isRealEstate = businessType === 'real_estate';

  const labels = useMemo(() => ({
    kitchen: isFactory ? t.workshop : isRealEstate ? (t as any).officeOperations || 'Office Operations' : t.kitchen,
    
    menu: isFactory ? t.products : isRealEstate ? (t as any).properties || 'Properties' : t.menu,
    
    shop: isFactory ? t.factory : isRealEstate ? (t as any).office || 'Office' : t.shop,
    
    locationType: isFactory ? t.factoryLowercase : isRealEstate ? (t as any).realEstateLowercase || 'real estate office' : t.restaurant,
    
    menuItem: isFactory ? t.product : isRealEstate ? (t as any).property || 'Property' : t.menuItem,
    menuItems: isFactory ? t.products : isRealEstate ? (t as any).properties || 'Properties' : t.menuItems,
  }), [isFactory, isRealEstate, t]);

  return {
    businessType,
    isFactory,
    isRestaurant,
    isRealEstate,
    labels,
    restaurant,
  };
}
