/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        slate: {
          900: '#0F1A2B',
          700: '#2C3E55',
          500: '#5A6B82',
          400: '#8995A8',
          300: '#C2CCD9',
          200: '#DDE3EC',
          100: '#EDF1F6',
        },
        warm: {
          white: '#FBF8F3',
          'white-2': '#F5F1EA',
        },
        green: {
          600: '#4A7C5C',
          400: '#7FA98E',
          100: '#E6EFE8',
        },
        amber: {
          500: '#C68B3C',
          100: '#F5E9D7',
        },
        rose: {
          500: '#B5687A',
        },
        info: '#4A6FA5',
      },
      fontFamily: {
        sans: ['Inter', 'system-ui', 'sans-serif'],
      },
      fontSize: {
        'display-xl': ['2.5rem', { lineHeight: '3rem', fontWeight: '600' }],
        'display-lg': ['2rem', { lineHeight: '2.5rem', fontWeight: '600' }],
        'title-lg': ['1.5rem', { lineHeight: '2rem', fontWeight: '600' }],
        'title-md': ['1.25rem', { lineHeight: '1.75rem', fontWeight: '600' }],
        'body-lg': ['1.0625rem', { lineHeight: '1.625rem', fontWeight: '400' }],
        'body-md': ['0.9375rem', { lineHeight: '1.375rem', fontWeight: '400' }],
        'body-sm': ['0.8125rem', { lineHeight: '1.25rem', fontWeight: '400' }],
        'label': ['0.8125rem', { lineHeight: '1rem', fontWeight: '500', letterSpacing: '0.025em' }],
      },
      borderRadius: {
        sm: '8px',
        md: '12px',
        lg: '20px',
        pill: '999px',
      },
      boxShadow: {
        'elevation-1': '0 1px 2px rgba(15,26,43,0.06)',
        'elevation-2': '0 4px 12px rgba(15,26,43,0.08)',
        'elevation-3': '0 12px 32px rgba(15,26,43,0.12)',
      },
      spacing: {
        '0': '0',
        '1': '4px',
        '2': '8px',
        '3': '12px',
        '4': '16px',
        '5': '24px',
        '6': '32px',
        '7': '48px',
        '8': '64px',
      },
    },
  },
  plugins: [],
}
