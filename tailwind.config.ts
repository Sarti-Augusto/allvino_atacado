import type { Config } from 'tailwindcss';

// Allvino - Design System
// Cores extraidas do logo: vinho escuro no acento do "I", neutros stone
// Tipografia: Cinzel (display, serif classica) + Inter (sans, corpo)
const config: Config = {
  content: ['./src/**/*.{ts,tsx}'],
  theme: {
    extend: {
      fontFamily: {
        sans: ['var(--font-inter)', 'system-ui', 'sans-serif'],
        display: ['var(--font-cinzel)', 'serif'],
      },
      colors: {
        // Cor de marca Allvino - vermelho vinho oficial do design system
        allvino: {
          50:  '#FDF2F4',
          100: '#FAD1D8',
          200: '#F4A4B3',
          300: '#EC7089',
          400: '#E03D60',
          500: '#A61C3C',  // tom acento principal (Burgundy)
          600: '#8B132E',
          700: '#6B0B20',
          800: '#4B0513',
          900: '#2C0007',
        },
        // Ouro de luxo para botoes secundários e detalhes premium
        gold: {
          50:  'rgb(var(--color-gold-50) / <alpha-value>)',
          100: 'rgb(var(--color-gold-100) / <alpha-value>)',
          200: 'rgb(var(--color-gold-200) / <alpha-value>)',
          300: 'rgb(var(--color-gold-300) / <alpha-value>)',
          400: 'rgb(var(--color-gold-400) / <alpha-value>)',
          500: 'rgb(var(--color-gold-500) / <alpha-value>)',
          600: 'rgb(var(--color-gold-600) / <alpha-value>)',
          700: 'rgb(var(--color-gold-700) / <alpha-value>)',
          800: 'rgb(var(--color-gold-800) / <alpha-value>)',
          900: 'rgb(var(--color-gold-900) / <alpha-value>)',
        },
        // Neutros adaptados para o tema escuro premium e clean mode
        stone: {
          50:  'rgb(var(--color-stone-50) / <alpha-value>)',
          100: 'rgb(var(--color-stone-100) / <alpha-value>)',
          200: 'rgb(var(--color-stone-200) / <alpha-value>)',
          300: 'rgb(var(--color-stone-300) / <alpha-value>)',
          400: 'rgb(var(--color-stone-400) / <alpha-value>)',
          500: 'rgb(var(--color-stone-500) / <alpha-value>)',
          600: 'rgb(var(--color-stone-600) / <alpha-value>)',
          700: 'rgb(var(--color-stone-700) / <alpha-value>)',
          800: 'rgb(var(--color-stone-800) / <alpha-value>)',
          850: 'rgb(var(--color-stone-850) / <alpha-value>)',
          900: 'rgb(var(--color-stone-900) / <alpha-value>)',
          950: 'rgb(var(--color-stone-950) / <alpha-value>)',
        },
      },
      letterSpacing: {
        'display': '0.08em',
        'display-wide': '0.18em',
      },
      boxShadow: {
        'soft': '0 4px 12px rgba(0, 0, 0, 0.5), 0 1px 3px rgba(0, 0, 0, 0.3)',
        'lift': '0 10px 25px -5px rgba(166, 28, 60, 0.25), 0 8px 10px -6px rgba(166, 28, 60, 0.15)',
        'gold-glow': '0 0 15px rgba(212, 175, 55, 0.2)',
      },
    },
  },
  plugins: [],
};
export default config;
