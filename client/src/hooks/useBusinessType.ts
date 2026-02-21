import { useMemo } from 'react';
import { useAuth } from '@/lib/auth';
import { useLanguage } from '@/contexts/LanguageContext';

export type BusinessTypeValue = 'restaurant' | 'factory' | 'real_estate' | 'design_services' | 'installation_services' | 'it_services';

export const SERVICE_BUSINESS_TYPES: BusinessTypeValue[] = ['design_services', 'installation_services', 'it_services'];

export function useBusinessType() {
  const { restaurant } = useAuth();
  const { t } = useLanguage();

  const businessType: BusinessTypeValue = (restaurant?.businessType as BusinessTypeValue) || 'restaurant';
  const isFactory = businessType === 'factory';
  const isRestaurant = businessType === 'restaurant';
  const isRealEstate = businessType === 'real_estate';
  const isServiceBusiness = SERVICE_BUSINESS_TYPES.includes(businessType);
  const isDesignServices = businessType === 'design_services';
  const isInstallationServices = businessType === 'installation_services';
  const isITServices = businessType === 'it_services';

  const labels = useMemo(() => ({
    kitchen: isFactory ? t.workshop : isRealEstate ? (t as any).officeOperations || 'Office Operations' : isServiceBusiness ? (t as any).workspace || 'Workspace' : t.kitchen,
    
    menu: isFactory ? t.products : isRealEstate ? (t as any).properties || 'Properties' : isServiceBusiness ? (t as any).serviceCatalog || 'Service Catalog' : t.menu,
    
    shop: isFactory ? t.factory : isRealEstate ? (t as any).office || 'Office' : isServiceBusiness ? (t as any).company || 'Company' : t.shop,
    
    locationType: isFactory ? t.factoryLowercase : isRealEstate ? (t as any).realEstateLowercase || 'real estate office' : isServiceBusiness ? (t as any).serviceCompany || 'service company' : t.restaurant,
    
    menuItem: isFactory ? t.product : isRealEstate ? (t as any).property || 'Property' : isServiceBusiness ? (t as any).service || 'Service' : t.menuItem,
    menuItems: isFactory ? t.products : isRealEstate ? (t as any).properties || 'Properties' : isServiceBusiness ? (t as any).services || 'Services' : t.menuItems,
  }), [isFactory, isRealEstate, isServiceBusiness, t]);

  return {
    businessType,
    isFactory,
    isRestaurant,
    isRealEstate,
    isServiceBusiness,
    isDesignServices,
    isInstallationServices,
    isITServices,
    labels,
    restaurant,
  };
}
