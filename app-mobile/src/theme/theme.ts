import { MD3LightTheme, MD3DarkTheme } from 'react-native-paper';
import { COLORS } from '../constants/colors';

// Custom theme based on your green color scheme
const lightTheme = {
  ...MD3LightTheme,
  colors: {
    ...MD3LightTheme.colors,
    // Primary colors (Green theme)
    primary: COLORS.PRIMARY,              // #10B981
    primaryContainer: COLORS.PRIMARY_LIGHT, // #D1FAE5
    secondary: COLORS.SECONDARY,          // #3B82F6
    tertiary: COLORS.ACCENT,              // #F59E0B

    // Error colors
    error: COLORS.DANGER,                 // #EF4444
    errorContainer: '#FEE2E2',

    // Background colors
    background: COLORS.BACKGROUND,        // #F9FAFB
    surface: COLORS.CARD,                 // #FFFFFF
    surfaceVariant: '#F3F4F6',

    // On colors (text on colored backgrounds)
    onPrimary: COLORS.TEXT_WHITE,         // #FFFFFF
    onPrimaryContainer: COLORS.PRIMARY_DARK, // #059669
    onSecondary: COLORS.TEXT_WHITE,
    onSecondaryContainer: '#1E3A8A',
    onTertiary: COLORS.TEXT_WHITE,
    onTertiaryContainer: '#92400E',
    onError: COLORS.TEXT_WHITE,
    onErrorContainer: '#7F1D1D',
    onBackground: COLORS.TEXT_PRIMARY,    // #111827
    onSurface: COLORS.TEXT_PRIMARY,
    onSurfaceVariant: COLORS.TEXT_SECONDARY, // #6B7280

    // Outline colors
    outline: COLORS.BORDER,               // #E5E7EB
    outlineVariant: COLORS.DIVIDER,

    // Additional custom colors
    success: COLORS.SUCCESS,
    warning: COLORS.WARNING,
    info: COLORS.INFO,
  },
};

const darkTheme = {
  ...MD3DarkTheme,
  colors: {
    ...MD3DarkTheme.colors,
    // Primary colors (Green theme - darker variants)
    primary: '#34D399',                   // Lighter green for dark mode
    primaryContainer: '#065F46',          // Dark green
    secondary: '#60A5FA',                 // Lighter blue
    tertiary: '#FBBF24',                  // Lighter orange

    // Error colors
    error: '#F87171',                     // Lighter red
    errorContainer: '#7F1D1D',

    // Background colors
    background: '#111827',                // Dark background
    surface: '#1F2937',                   // Dark surface
    surfaceVariant: '#374151',

    // On colors
    onPrimary: '#022C22',
    onPrimaryContainer: '#A7F3D0',
    onSecondary: '#1E3A8A',
    onSecondaryContainer: '#DBEAFE',
    onTertiary: '#78350F',
    onTertiaryContainer: '#FDE68A',
    onError: '#7F1D1D',
    onErrorContainer: '#FEE2E2',
    onBackground: '#F9FAFB',
    onSurface: '#F9FAFB',
    onSurfaceVariant: '#D1D5DB',

    // Outline colors
    outline: '#4B5563',
    outlineVariant: '#374151',

    // Additional custom colors
    success: '#34D399',
    warning: '#FBBF24',
    info: '#60A5FA',
  },
};

// Export light theme as default
export default lightTheme;
export { lightTheme, darkTheme };
