/**
 * Centralized Color System
 * Based on DigitalOcean's sophisticated blue palette
 * 
 * Color Palette:
 * - #003d82: Deep navy blue (primary branding, headers)
 * - #0080ff: Bright blue (primary actions, highlights)
 * - #a7c5ff: Light blue (secondary elements, soft accents)
 * - #f0f7ff: Very light blue (subtle backgrounds)
 * - #ffffff: Pure white (cards, contrast)
 */

export const colorScheme = {
  // Base color values (hex)
  hex: {
    deepNavy: '#003d82',
    brightBlue: '#0080ff', 
    lightBlue: '#a7c5ff',
    veryLightBlue: '#f0f7ff',
    white: '#ffffff',
  },

  // HSL values for CSS custom properties
  hsl: {
    deepNavy: '214 100% 25%',         // #003d82
    brightBlue: '210 100% 50%',       // #0080ff
    lightBlue: '218 100% 83%',        // #a7c5ff
    veryLightBlue: '214 100% 97%',    // #f0f7ff
    white: '0 0% 100%',               // #ffffff
  },

  // Semantic color mappings
  semantic: {
    // Primary brand colors - DigitalOcean inspired
    primary: '210 100% 50%',          // Bright blue for primary actions
    primaryForeground: '0 0% 100%',   // White for contrast
    
    // Secondary colors
    secondary: '218 100% 83%',        // Light blue for secondary elements
    secondaryForeground: '214 100% 25%', // Deep navy for contrast
    
    // Accent colors
    accent: '214 100% 25%',           // Deep navy for accents
    accentForeground: '0 0% 100%',    // White for contrast
    
    // Background colors
    background: '214 100% 97%',       // Very light blue for main background
    foreground: '214 100% 25%',       // Deep navy for main text
    
    // Card colors
    card: '0 0% 100%',               // Pure white for cards
    cardForeground: '214 100% 25%',  // Deep navy for card text
    
    // Muted colors
    muted: '218 100% 90%',           // Very light blue for muted backgrounds
    mutedForeground: '214 100% 35%', // Lighter navy for muted text
    
    // Border colors
    border: '218 100% 85%',          // Light blue for borders
    input: '218 100% 95%',           // Very light blue for inputs
    ring: '210 100% 50%',            // Bright blue for focus rings
    
    // Interactive states
    destructive: '0 70% 60%',        // Red for destructive actions
    destructiveForeground: '0 0% 100%', // White for contrast
    
    success: '140 70% 45%',          // Green for success states
    successForeground: '0 0% 100%',  // White for contrast
    
    warning: '45 90% 60%',           // Orange for warnings
    warningForeground: '0 0% 100%',  // White for contrast
    
    // Popover colors
    popover: '0 0% 100%',            // White for popovers
    popoverForeground: '214 100% 25%', // Deep navy for popover text
  },

  // Gradient definitions - DigitalOcean inspired
  gradients: {
    primary: 'linear-gradient(135deg, hsl(210 100% 50%), hsl(218 100% 83%))',
    secondary: 'linear-gradient(135deg, hsl(218 100% 83%), hsl(214 100% 25%))',
    accent: 'linear-gradient(135deg, hsl(214 100% 25%), hsl(210 100% 50%))',
    hero: 'linear-gradient(135deg, hsl(214 100% 25%), hsl(210 100% 50%), hsl(218 100% 83%))',
    subtle: 'linear-gradient(135deg, hsl(214 100% 97%), hsl(218 100% 90%))',
  },

  // Shadow definitions - Blue themed
  shadows: {
    sm: '0 2px 8px -2px hsl(214 100% 25% / 0.1)',
    md: '0 4px 16px -4px hsl(214 100% 25% / 0.15)',
    lg: '0 8px 24px -6px hsl(214 100% 25% / 0.2)',
    glow: '0 0 20px hsl(210 100% 50% / 0.4)',
    card: '0 4px 20px -2px hsl(210 100% 50% / 0.1)',
    battle: '0 8px 30px -4px hsl(214 100% 25% / 0.2)',
  },

  // Dark mode overrides - Deep blue theme
  dark: {
    background: '214 100% 8%',       // Very dark navy
    foreground: '214 100% 95%',      // Very light blue
    card: '214 100% 12%',            // Dark navy for cards
    cardForeground: '214 100% 95%',  // Light blue for card text
    muted: '214 100% 18%',           // Darker navy for muted backgrounds
    mutedForeground: '214 100% 70%', // Medium blue for muted text
    border: '214 100% 20%',          // Dark navy for borders
    input: '214 100% 20%',           // Dark navy for inputs
    popover: '214 100% 12%',         // Dark navy for popovers
    popoverForeground: '214 100% 95%', // Light blue for popover text
  },
} as const;

// Export individual color categories for easy access
export const { hex, hsl, semantic, gradients, shadows, dark } = colorScheme;

// Utility function to get CSS custom property format
export const getCSSVar = (colorKey: keyof typeof semantic) => {
  return `hsl(var(--${colorKey.replace(/([A-Z])/g, '-$1').toLowerCase()}))`;
};

// Utility function to generate CSS custom properties
export const generateCSSVars = (isDark = false) => {
  const colors = isDark ? { ...semantic, ...dark } : semantic;
  return Object.entries(colors).reduce((acc, [key, value]) => {
    const cssVar = `--${key.replace(/([A-Z])/g, '-$1').toLowerCase()}`;
    acc[cssVar] = value;
    return acc;
  }, {} as Record<string, string>);
};

export default colorScheme;
