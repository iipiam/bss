import { useDevice } from "@/contexts/DeviceContext";
import type { ReactNode } from "react";

// Device layout tokens and utilities
export function useDeviceLayout() {
  const { device } = useDevice();
  const isMobile = device === 'iphone';
  const isTablet = device === 'ipad';

  return {
    isMobile,
    isTablet,
    isDesktop: device === 'laptop',
    device,
    
    // Spacing tokens
    padding: isMobile ? 'p-4' : 'p-8',
    gap: isMobile ? 'gap-3' : 'gap-6',
    spaceY: isMobile ? 'space-y-4' : 'space-y-8',
    
    // Grid utilities
    gridCols: ({ desktop = 4, tablet = 3, mobile = 2 }: { desktop?: number; tablet?: number; mobile?: number }) => {
      if (isMobile) return `grid-cols-${mobile}`;
      if (isTablet) return `grid-cols-${tablet}`;
      return `md:grid-cols-2 lg:grid-cols-${desktop}`;
    },
    
    // Card padding
    cardPadding: isMobile ? 'p-3' : 'p-6',
    cardHeaderPadding: isMobile ? 'p-3' : 'p-6',
    
    // Text sizes
    textXl: isMobile ? 'text-lg' : 'text-xl',
    text2Xl: isMobile ? 'text-xl' : 'text-2xl',
    text3Xl: isMobile ? 'text-2xl' : 'text-3xl',
    
    // Chart height
    chartHeight: isMobile ? 250 : 350,
  };
}

// Compact chart configuration for mobile
export function useCompactChartConfig() {
  const { isMobile } = useDeviceLayout();
  
  return {
    fontSize: isMobile ? 10 : 12,
    tickMargin: isMobile ? 5 : 10,
    axisStroke: isMobile ? 0.5 : 1,
    showLegend: !isMobile,
    legendFontSize: isMobile ? 10 : 12,
    cartesianGrid: {
      strokeDasharray: "3 3",
      opacity: isMobile ? 0.3 : 0.5,
    },
  };
}

// Table to Card adapter interface
export interface TableColumn<T> {
  key: keyof T | string;
  header: string;
  render?: (item: T) => ReactNode;
  mobileLabel?: string;
  hideOnMobile?: boolean;
}

export interface TableListProps<T> {
  data: T[];
  columns: TableColumn<T>[];
  keyExtractor: (item: T) => string;
  onRowClick?: (item: T) => void;
  mobileCardRender?: (item: T) => ReactNode;
}

// Get responsive container class
export function getContainerClass(device: string) {
  if (device === 'iphone') return 'container-mobile';
  if (device === 'ipad') return 'container-tablet';
  return 'container-desktop';
}

// Get responsive button size
export function getButtonSize(device: string) {
  if (device === 'iphone') return 'sm';
  return 'default';
}

// Get responsive input height
export function getInputHeight(device: string) {
  if (device === 'iphone') return 'h-9';
  return 'h-10';
}
