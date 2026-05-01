export const Theme = {
  colors: {
    primary: '#f2994a', // Primary Orange
    onPrimary: '#ffffff',
    secondary: '#2f80ed', // Secondary Blue
    onSecondary: '#ffffff',
    success: '#27ae60', // Success Green
    onSuccess: '#ffffff',
    background: '#f8f9fa', // Neutral Background
    surface: '#ffffff', // Cards and Containers
    onSurface: '#1b1c1c', // Primary Text
    onSurfaceVariant: '#544438', // Secondary Text
    outline: '#e0e0e0', // Borders
    placeholder: '#9e9e9e', // Placeholder Text
    divider: '#f2f2f2', // List Dividers
    error: '#ba1a1a',
    onError: '#ffffff',
    errorContainer: '#ffdad6',
    onErrorContainer: '#93000a',
    surfaceVariant: '#e4e2e1',
    // Status Tints
    successTint: '#e8f5e9',
    successTintText: '#1b5e20',
    pendingTint: '#fff8e1',
    pendingTintText: '#f57f17',
  },
  typography: {
    headlineLg: {
      fontFamily: 'Inter',
      fontSize: 24,
      fontWeight: '700' as const,
      lineHeight: 32,
    },
    headlineMd: {
      fontFamily: 'Inter',
      fontSize: 20,
      fontWeight: '600' as const,
      lineHeight: 28,
    },
    headlineSm: {
      fontFamily: 'Inter',
      fontSize: 16,
      fontWeight: '600' as const,
      lineHeight: 24,
    },
    bodyLg: {
      fontFamily: 'Inter',
      fontSize: 16,
      fontWeight: '400' as const,
      lineHeight: 24,
    },
    bodyMd: {
      fontFamily: 'Inter',
      fontSize: 14,
      fontWeight: '400' as const,
      lineHeight: 20,
    },
    bodySm: {
      fontFamily: 'Inter',
      fontSize: 12,
      fontWeight: '400' as const,
      lineHeight: 18,
    },
    labelLg: {
      fontFamily: 'Inter',
      fontSize: 14,
      fontWeight: '600' as const,
      lineHeight: 20,
      letterSpacing: 0.28,
    },
    labelMd: {
      fontFamily: 'Inter',
      fontSize: 12,
      fontWeight: '500' as const,
      lineHeight: 16,
    },
    labelSm: {
      fontFamily: 'Inter',
      fontSize: 10,
      fontWeight: '700' as const,
      lineHeight: 14,
      letterSpacing: 0.5,
    },
  },
  spacing: {
    base: 4,
    xs: 4,
    sm: 8,
    gutter: 12,
    md: 16,
    lg: 24,
    xl: 32,
    marginMobile: 16,
  },
  rounded: {
    sm: 4,
    base: 8, // Buttons & Inputs
    md: 12,
    lg: 16, // Cards
    xl: 24,
    full: 9999, // Status Pills
  },
  elevation: {
    level1: {
      shadowColor: '#000000',
      shadowOffset: { width: 0, height: 4 },
      shadowOpacity: 0.1,
      shadowRadius: 10,
      elevation: 2,
    },
    level2: {
      shadowColor: '#000000',
      shadowOffset: { width: 0, height: 8 },
      shadowOpacity: 0.2,
      shadowRadius: 20,
      elevation: 5,
    },
  },
};
