// Màu sắc chính xác theo ui-ux-design-spec.md
export const DARK = {
  background: '#0D0D11',      // --bg-primary dark
  bgSurface: '#16161F',       // --bg-surface dark (cards, nav bar)
  backgroundAlt: '#1A1A24',
  card: '#16161F',
  accentPurple: '#9D4EDD',    // --accent-color stop 1
  accentPurple2: '#7B2CBF',   // --accent-color stop 2
  accentBlue: '#00B4D8',
  foreground: '#FFFFFF',      // --text-primary dark
  foregroundSecondary: '#8E8E93', // --text-secondary dark
  border: 'rgba(255,255,255,0.08)',
  glass: 'rgba(255,255,255,0.05)',
};

export const LIGHT = {
  background: '#F8F9FA',      // --bg-primary light
  bgSurface: '#FFFFFF',       // --bg-surface light
  backgroundAlt: '#F0F0F5',
  card: '#FFFFFF',
  accentPurple: '#9D4EDD',
  accentPurple2: '#7B2CBF',
  accentBlue: '#00B4D8',
  foreground: '#111111',      // --text-primary light
  foregroundSecondary: '#6C757D', // --text-secondary light
  border: 'rgba(0,0,0,0.08)',
  glass: 'rgba(0,0,0,0.03)',
};

// Default export: dark mode (app mặc định dark theo spec)
export const COLORS = DARK;