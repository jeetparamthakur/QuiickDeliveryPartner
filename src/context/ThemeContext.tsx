import React, { createContext, useContext, useMemo } from 'react';
import { useColorScheme } from 'react-native';
import {
  lightColors,
  darkColors,
  spacing,
  radius,
  typography,
  shadows,
  motion,
  layout,
  fontFamily,
  type ThemeColors,
} from '@/theme';

type ThemeContextValue = {
  colors: ThemeColors;
  spacing: typeof spacing;
  radius: typeof radius;
  typography: typeof typography;
  shadows: typeof shadows;
  motion: typeof motion;
  layout: typeof layout;
  fontFamily: typeof fontFamily;
  isDark: boolean;
};

const ThemeContext = createContext<ThemeContextValue | null>(null);

export function ThemeProvider({ children }: { children: React.ReactNode }) {
  const systemScheme = useColorScheme();
  const isDark = systemScheme === 'dark';

  const value = useMemo(
    () => ({
      colors: isDark ? darkColors : lightColors,
      spacing,
      radius,
      typography,
      shadows,
      motion,
      layout,
      fontFamily,
      isDark,
    }),
    [isDark],
  );

  return <ThemeContext.Provider value={value}>{children}</ThemeContext.Provider>;
}

export function useTheme() {
  const context = useContext(ThemeContext);
  if (!context) {
    throw new Error('useTheme must be used within ThemeProvider');
  }
  return context;
}
