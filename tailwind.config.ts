import type { Config } from 'tailwindcss'

const config: Config = {
  darkMode: ['class'],
  content: [
    './src/**/*.{js,ts,jsx,tsx,mdx}',
    './stitch/**/*.{html,md}'
  ],
  theme: {
    extend: {
      colors: {
        brand: {
          50: '#f0f4ff',
          100: '#e0e9ff',
          500: '#3b5bdb',
          600: '#3451c7',
          700: '#2b42a8',
          900: '#1a2b6d'
        },
        neutral: {
          50: '#f8f9fa',
          100: '#f1f3f5',
          200: '#e9ecef',
          300: '#dee2e6',
          400: '#ced4da',
          500: '#adb5bd',
          600: '#868e96',
          700: '#495057',
          800: '#343a40',
          900: '#212529'
        },
        success: '#2f9e44',
        warning: '#e67700',
        error: '#c92a2a',

        // Surface tokens (light/dark via CSS variables)
        surface: 'var(--tm-surface)',
        'surface-container-lowest': 'var(--tm-surface-container-lowest)',
        'surface-container-low': 'var(--tm-surface-container-low)',
        'surface-container': 'var(--tm-surface-container)',
        'surface-container-high': 'var(--tm-surface-container-high)',
        'surface-container-highest': 'var(--tm-surface-container-highest)',
        'surface-bright': 'var(--tm-surface-bright)',
        outline: 'var(--tm-outline)',
        'outline-variant': 'var(--tm-outline-variant)',

        background: 'var(--tm-background)',
        'on-surface': 'var(--tm-on-surface)',
        'on-surface-variant': 'var(--tm-on-surface-variant)',
        primary: '#1a40c2',
        'primary-fixed': '#dde1ff',
        'on-primary-fixed-variant': '#0736ba',
        'primary-container': '#3b5bdb',
        'on-primary': '#ffffff',

        // Additional template compatibility
        'secondary-container': '#bcc6ff',
        secondary: '#515b8e',
        'on-secondary-container': '#475183',
        'on-secondary': '#ffffff',
        'error-container': '#ffdad6',
        'on-error': '#ffffff',

        // Stitch M3 tertiary accents (admin login background blob, etc.)
        tertiary: '#863700',
        'tertiary-fixed': '#ffdbcb',
        'on-tertiary-fixed-variant': '#793100'
      },
      borderRadius: {
        xl: '0.75rem',
        '2xl': '1rem',
        '3xl': '1.5rem',
        full: '9999px'
      },
      fontFamily: {
        sans: ['var(--font-inter)', 'system-ui', 'sans-serif'],
        heading: ['var(--font-manrope)', 'system-ui', 'sans-serif'],
        mono: ['var(--font-jetbrains-mono)', 'monospace'],
      },
      fontSize: {
        // Minimal scale used for marketing + cards
        'display-xl': ['3.5rem', { lineHeight: '1.1', letterSpacing: '-0.02em' }],
        'display-lg': ['2.8rem', { lineHeight: '1.15', letterSpacing: '-0.02em' }],
        display: ['2.25rem', { lineHeight: '1.2', letterSpacing: '-0.015em' }],
        'heading-xl': ['1.75rem', { lineHeight: '1.3', letterSpacing: '-0.01em' }],
        heading: ['1.25rem', { lineHeight: '1.4' }],
        'body-lg': ['1.125rem', { lineHeight: '1.7' }],
        body: ['1rem', { lineHeight: '1.6' }],
        'body-sm': ['0.875rem', { lineHeight: '1.5' }],
        caption: ['0.75rem', { lineHeight: '1.5' }],
        label: ['0.75rem', { lineHeight: '1.5' }]
      },
      boxShadow: {
        // Soft ambient shadow
        soft: '0 20px 50px rgba(24, 28, 32, 0.06)'
      }
    }
  },
  plugins: [require('tailwindcss-animate')]
}

export default config

