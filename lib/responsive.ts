import { useWindowDimensions } from 'react-native';

const TABLET = 768;

export function useResponsive() {
  const { width, height } = useWindowDimensions();
  const isTablet = width >= TABLET;
  const isLandscape = width > height;

  /** Scale a spacing/size value (1.4× on tablet by default) */
  const sp = (phone: number, tablet?: number): number =>
    isTablet ? (tablet ?? Math.round(phone * 1.4)) : phone;

  /** Scale a font-size value (1.15× on tablet by default) */
  const fs = (phone: number, tablet?: number): number =>
    isTablet ? (tablet ?? Math.round(phone * 1.15)) : phone;

  return {
    isTablet,
    isLandscape,
    sp,
    fs,
    numColumns: (isTablet ? 2 : 1) as 1 | 2,
    contentMaxWidth: isTablet ? 680 : (undefined as number | undefined),
  };
}
