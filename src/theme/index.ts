export const colors = {
  primary: '#2E7D32',
  primaryDark: '#1B5E20',
  primaryLight: '#E8F5E9',
  primaryMuted: '#E8F5E9',
  secondary: '#8BC34A',
  background: '#F0FAF0',
  surface: '#FFFFFF',
  surfaceSecondary: '#E8F0E8',
  text: '#1A202C',
  textSecondary: '#64748B',
  textMuted: '#94A3B8',
  border: '#D7E3D7',
  borderLight: '#E8F5E9',
  success: '#2E7D32',
  successLight: '#E8F5E9',
  warning: '#689F38',
  warningLight: '#F1F8E9',
  danger: '#C62828',
  dangerLight: '#FFEBEE',
  info: '#689F38',
  infoLight: '#F1F8E9',
  overlay: 'rgba(27, 94, 32, 0.45)',
  white: '#FFFFFF',
  black: '#000000',
  orderNew: '#2E7D32',
  orderAccepted: '#8BC34A',
  orderPreparing: '#689F38',
  orderReady: '#2E7D32',
  orderCompleted: '#64748B',
  orderCancelled: '#C62828',
};

export const gradients = {
  primary: ['#8BC34A', '#2E7D32', '#1B5E20'] as const,
  hero: ['#E8F5E9', '#F0FAF0'] as const,
  promo: ['#2E7D32', '#8BC34A'] as const,
};

export const metricAccents = {
  sales: { bg: '#E8F5E9', icon: '#2E7D32' },
  orders: { bg: '#F1F8E9', icon: '#689F38' },
  pending: { bg: '#F1F8E9', icon: '#689F38' },
  earnings: { bg: '#E8F5E9', icon: '#1B5E20' },
  default: { bg: '#E8F5E9', icon: '#2E7D32' },
};

export const spacing = {
  xs: 4,
  sm: 8,
  md: 12,
  lg: 16,
  xl: 20,
  xxl: 24,
  xxxl: 32,
  huge: 48,
};

export const radius = {
  sm: 8,
  md: 12,
  lg: 16,
  xl: 20,
  full: 9999,
};

export const typography = {
  display: { fontSize: 32, fontWeight: '700' as const, lineHeight: 40 },
  h1: { fontSize: 28, fontWeight: '700' as const, lineHeight: 36 },
  h2: { fontSize: 22, fontWeight: '600' as const, lineHeight: 28 },
  h3: { fontSize: 18, fontWeight: '600' as const, lineHeight: 24 },
  body: { fontSize: 16, fontWeight: '400' as const, lineHeight: 24 },
  bodyMedium: { fontSize: 16, fontWeight: '500' as const, lineHeight: 24 },
  bodySmall: { fontSize: 14, fontWeight: '400' as const, lineHeight: 20 },
  caption: { fontSize: 12, fontWeight: '400' as const, lineHeight: 16 },
  label: { fontSize: 14, fontWeight: '500' as const, lineHeight: 20 },
  button: { fontSize: 16, fontWeight: '600' as const, lineHeight: 24 },
};

export const shadows = {
  sm: {
    shadowColor: '#1B5E20',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.06,
    shadowRadius: 2,
    elevation: 1,
  },
  md: {
    shadowColor: '#1B5E20',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.08,
    shadowRadius: 8,
    elevation: 3,
  },
  lg: {
    shadowColor: '#1B5E20',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.12,
    shadowRadius: 16,
    elevation: 6,
  },
};

export const theme = { colors, gradients, metricAccents, spacing, radius, typography, shadows };

export type Theme = typeof theme;
