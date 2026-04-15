/**
 * Minimalist Monochrome — design tokens (strict B/W, sharp geometry, editorial type).
 * Font family strings match @expo-google-fonts/* after useFonts() in root layout.
 */
export const MW_COLORS = {
  background: '#FFFFFF',
  foreground: '#000000',
  muted: '#F5F5F5',
  mutedForeground: '#525252',
  accent: '#000000',
  accentForeground: '#FFFFFF',
  border: '#000000',
  borderLight: '#E5E5E5',
  card: '#FFFFFF',
  cardForeground: '#000000',
  ring: '#000000',
  /** Inverted surfaces (stats bar, emphasis) */
  invertedBackground: '#000000',
  invertedForeground: '#FFFFFF',
} as const;

/** All radii are 0 — architectural sharp corners. */
export const MW_RADIUS = {
  sm: 0,
  md: 0,
  lg: 0,
  pill: 0,
} as const;

/** No elevation — depth via borders and inversion only. */
export const MW_SHADOWS = {
  none: {} as Record<string, never>,
};

export const MW_BORDER = {
  hairline: 1,
  thin: 1,
  medium: 2,
  thick: 4,
  ultra: 8,
} as const;

export const MW_SPACE = {
  xs: 6,
  sm: 10,
  md: 14,
  lg: 20,
  xl: 32,
} as const;

/** Loaded via expo-google-fonts; use after fonts are ready. */
export const MW_FONTS = {
  display: 'PlayfairDisplay_700Bold',
  displayItalic: 'PlayfairDisplay_400Regular_Italic',
  displayRegular: 'PlayfairDisplay_400Regular',
  body: 'SourceSerif4_400Regular',
  bodySemi: 'SourceSerif4_600SemiBold',
  mono: 'JetBrainsMono_400Regular',
} as const;

export const MW_TYPE = {
  /** Mobile-first; tune toward 5xl–7xl on larger breakpoints via maxFontSizeMultiplier */
  hero: 44,
  pageTitle: 32,
  section: 22,
  body: 17,
  bodySm: 15,
  label: 14,
  kicker: 11,
  mono: 12,
} as const;
