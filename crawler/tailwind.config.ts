import type { Config } from 'tailwindcss'

const config: Config = {
  darkMode: ['class'],
  content: [
    './src/pages/**/*.{js,ts,jsx,tsx,mdx}',
    './src/components/**/*.{js,ts,jsx,tsx,mdx}',
    './src/app/**/*.{js,ts,jsx,tsx,mdx}',
  ],
  theme: {
    extend: {
      colors: {
        brand: {
          50:  '#f0f4ff',
          100: '#e0e9ff',
          200: '#c7d7fe',
          300: '#a5bafc',
          400: '#8098f9',
          500: '#3b5bdb',
          600: '#3451c7',
          700: '#2b42a8',
          800: '#253688',
          900: '#1a2b6d',
          950: '#111d4a',
        },
        neutral: {
          50:  '#f8f9fa',
          100: '#f1f3f5',
          200: '#e9ecef',
          300: '#dee2e6',
          400: '#ced4da',
          500: '#adb5bd',
          600: '#868e96',
          700: '#495057',
          800: '#343a40',
          900: '#212529',
          950: '#0d0f12',
        },
      },
      fontFamily: {
        sans:    ['var(--font-inter)', 'system-ui', 'sans-serif'],
        heading: ['var(--font-manrope)', 'system-ui', 'sans-serif'],
        mono:    ['var(--font-jetbrains-mono)', 'monospace'],
      },
      fontSize: {
        'display-xl': ['3.5rem',  { lineHeight: '1.1',  letterSpacing: '-0.02em' }],
        'display-lg': ['2.8rem',  { lineHeight: '1.15', letterSpacing: '-0.02em' }],
        'display':    ['2.25rem', { lineHeight: '1.2',  letterSpacing: '-0.015em' }],
        'heading-xl': ['1.75rem', { lineHeight: '1.3',  letterSpacing: '-0.01em' }],
        'heading-lg': ['1.5rem',  { lineHeight: '1.35', letterSpacing: '-0.01em' }],
        'heading':    ['1.25rem', { lineHeight: '1.4' }],
        'body-lg':    ['1.125rem',{ lineHeight: '1.7' }],
        'body':       ['1rem',    { lineHeight: '1.6' }],
        'body-sm':    ['0.875rem',{ lineHeight: '1.5' }],
        'caption':    ['0.75rem', { lineHeight: '1.5' }],
      },
      borderRadius: {
        lg:   '0.75rem',
        xl:   '1rem',
        '2xl':'1.5rem',
      },
      boxShadow: {
        card:  '0 1px 3px 0 rgb(0 0 0 / 0.08), 0 1px 2px -1px rgb(0 0 0 / 0.08)',
        'card-hover': '0 4px 12px 0 rgb(0 0 0 / 0.12)',
        'brand-glow': '0 0 0 3px rgb(59 91 219 / 0.15)',
      },
      animation: {
        'fade-in':    'fadeIn 0.2s ease-in-out',
        'slide-up':   'slideUp 0.3s ease-out',
        'slide-down': 'slideDown 0.3s ease-out',
      },
      keyframes: {
        fadeIn: {
          '0%':   { opacity: '0' },
          '100%': { opacity: '1' },
        },
        slideUp: {
          '0%':   { transform: 'translateY(8px)', opacity: '0' },
          '100%': { transform: 'translateY(0)',   opacity: '1' },
        },
        slideDown: {
          '0%':   { transform: 'translateY(-8px)', opacity: '0' },
          '100%': { transform: 'translateY(0)',    opacity: '1' },
        },
      },
    },
  },
  plugins: [require('tailwindcss-animate')],
}

export default config
