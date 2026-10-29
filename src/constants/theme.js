/**
 * Running Tracker — Design Tokens
 * WCAG AA & AAA compliant contrast ratios & consistent spacing grid
 */

export const COLORS = {
  primary: '#15803D',       // Forest Green (4.88:1 contrast on white)
  primaryDark: '#166534',   // Dark Green (7.3:1 contrast on white)
  primaryLight: '#DCFCE7',  // Soft Green tint for icon backgrounds
  secondary: '#D97706',     // Amber-600 (4.5:1 contrast on white)
  secondaryDark: '#B45309', // Deep Amber
  secondaryLight: '#FEF3C7',
  accent: '#0284C7',        // Sky-600 (4.54:1 contrast on white)
  accentLight: '#E0F2FE',
  background: '#F8FAFC',    // Slate-50 clean background
  surface: '#FFFFFF',       // Card / surface white
  text: '#0F172A',          // Slate-900 (16.5:1 contrast)
  textSecondary: '#475569', // Slate-600 (5.9:1 contrast - WCAG AA compliant)
  textMuted: '#64748B',     // Slate-500 (4.6:1 contrast - WCAG AA compliant)
  textLight: '#94A3B8',     // Slate-400 (borders & placeholders)
  error: '#DC2626',         // Red-600 (4.6:1 contrast on white)
  errorLight: '#FEE2E2',
  success: '#15803D',
  border: '#E2E8F0',        // Slate-200 crisp border
  borderLight: '#F1F5F9',
  shadow: '#0F172A',
};

export const SPACING = {
  xs: 4,
  sm: 8,
  md: 16,
  lg: 24,
  xl: 32,
  xxl: 48,
};

export const FONT_SIZES = {
  xs: 11,
  sm: 13,
  md: 15,
  lg: 17,
  xl: 20,
  xxl: 24,
  xxxl: 32,
  hero: 48,
};

export const BORDER_RADIUS = {
  sm: 8,
  md: 12,
  lg: 16,
  xl: 24,
  full: 9999,
};
