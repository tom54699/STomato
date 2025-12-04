// Design tokens extracted from current Tailwind theme (index.css) for reuse and Flutter parity.
// Not wired into components yet — safe to import when refactoring UI.

export const colors = {
  primary: '#030213',
  primaryForeground: '#FFFFFF',
  secondary: '#f2f2f6',
  secondaryForeground: '#030213',
  accent: '#e9ebef',
  accentForeground: '#030213',
  destructive: '#d4183d',
  destructiveForeground: '#ffffff',
  gray: {
    50: '#f8f9fb',
    100: '#f0f1f7',
    200: '#e5e7ee',
    300: '#d1d5dc',
    400: '#a4acb8',
    500: '#75849a',
    600: '#5b6478',
    700: '#3f4560',
    800: '#2d3043',
  },
  blue: {
    50: '#f2f6ff',
    100: '#e4ecff',
    400: '#5f8dff',
    500: '#4b6dff',
    600: '#4557ff',
  },
  indigo: { 50: '#f3f2ff', 400: '#5f73ff', 500: '#4c63ff' },
  purple: { 50: '#f8f4ff', 100: '#f1e8ff', 400: '#7b63ff', 500: '#6840ff', 600: '#5937f4' },
  pink: { 50: '#f9f2f8', 400: '#eb5fa0', 500: '#e94a9e' },
  orange: { 50: '#fdf6ed', 100: '#f8ebd8', 400: '#ec8a4d', 500: '#e0723a' },
  yellow: { 50: '#fdf9ed', 200: '#f3e2a6', 400: '#eecb5c', 500: '#e6b74f', 700: '#b3862f', 800: '#986c27' },
  green: { 400: '#5fdb87', 500: '#3fcf82', 600: '#28b36f' },
  teal: { 400: '#59d2d0', 500: '#48bebd' },
  white: '#ffffff',
  black: '#000000',
};

export const spacing = {
  xs: 4,
  sm: 8,
  md: 12,
  lg: 16,
  xl: 20,
  '2xl': 24,
  '3xl': 32,
};

export const radius = {
  sm: 8, // approx var(--radius-sm)
  md: 10, // approx var(--radius-md)
  lg: 12, // var(--radius)
  xl: 16, // var(--radius) + 4
  '2xl': 16, // tailwind rounded-2xl ~ 1rem
  '3xl': 24, // tailwind rounded-3xl ~ 1.5rem
};

export const shadow = {
  card: '0 10px 30px rgba(0,0,0,0.08)',
  soft: '0 6px 20px rgba(0,0,0,0.06)',
};

export const typography = {
  fontFamily: 'Inter, system-ui, -apple-system, sans-serif',
  sizes: {
    xs: 12,
    sm: 14,
    base: 16,
    lg: 18,
    xl: 20,
    '2xl': 24,
    '4xl': 36,
    '6xl': 60,
  },
  weight: { normal: 400, medium: 500 },
};

// Settlement performance levels (logic-only mirror; UI currently hardcoded in Settlement.tsx)
export const performanceLevels = [
  { min: 150, label: '完美！', emoji: '⭐', gradient: ['#facc15', '#fb923c'] }, // yellow to orange
  { min: 100, label: '太棒了！', emoji: '🌟', gradient: ['#fb923c', '#ec4899'] }, // orange to pink
  { min: 50, label: '不錯喔', emoji: '👍', gradient: ['#60a5fa', '#6366f1'] }, // blue to indigo
  { min: 0, label: '加油！', emoji: '💪', gradient: ['#4ade80', '#10b981'] }, // green
];
