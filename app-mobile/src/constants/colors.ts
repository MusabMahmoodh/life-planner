// src/constants/colors.ts
// 🎨 Color theme for the entire app (Green theme matching your UI)

export const COLORS = {
  // Primary Colors (Green Theme)
  PRIMARY: '#10B981',          // Teal Green (main color)
  PRIMARY_DARK: '#059669',     // Darker Green
  PRIMARY_LIGHT: '#D1FAE5',    // Light Green (backgrounds)

  // Secondary Colors
  SECONDARY: '#3B82F6',        // Blue
  ACCENT: '#F59E0B',           // Warm Orange

  // Status Colors
  SUCCESS: '#10B981',          // Green (success)
  WARNING: '#F59E0B',          // Amber (warning)
  DANGER: '#EF4444',           // Red (error/danger)
  INFO: '#3B82F6',             // Blue (info)

  // Background Colors
  BACKGROUND: '#F9FAFB',       // Light Gray (main background)
  CARD: '#FFFFFF',             // White (card backgrounds)
  BORDER: '#E5E7EB',           // Light Border
  DIVIDER: '#E5E7EB',          // Divider line

  // Text Colors
  TEXT_PRIMARY: '#111827',     // Dark Gray (main text)
  TEXT_SECONDARY: '#6B7280',   // Medium Gray (secondary text)
  TEXT_TERTIARY: '#9CA3AF',    // Light Gray (tertiary text)
  TEXT_WHITE: '#FFFFFF',       // White text
  TEXT_MUTED: '#D1D5DB',       // Muted text

  // Special Colors
  STREAK: '#F59E0B',           // Amber (for streak indicators 🔥)
  BADGE: '#10B981',            // Green (for badges)
  OVERLAY: 'rgba(0, 0, 0, 0.5)', // Black overlay (50% opacity)
} as const;

// Category Colors (for different goal categories)
export const CATEGORY_COLORS: Record<string, string> = {
  Fitness: '#F59E0B',      // Orange
  Career: '#10B981',       // Green
  Health: '#EF4444',       // Red
  Personal: '#8B5CF6',     // Purple
  Finance: '#3B82F6',      // Blue
  Education: '#EC4899',    // Pink
  Learning: '#3B82F6',     // Blue
};

// Gradient Colors (for future use)
export const GRADIENTS = {
  PRIMARY: ['#10B981', '#059669'],
  SECONDARY: ['#3B82F6', '#2563EB'],
  WARM: ['#F59E0B', '#EF4444'],
} as const;

export default COLORS;
