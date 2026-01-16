/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,jsx}",
  ],
  darkMode: 'class',
  theme: {
    extend: {
      colors: {
        // Official Presearch brand colors
        presearch: {
          DEFAULT: '#0190FF',
          hover: '#0177D6',
          light: '#E6F4FF',
          dark: '#80BAFF',
        },
        // Dark mode backgrounds
        dark: {
          900: '#191919',
          800: '#1e1e1e',
          700: '#2e2e2e',
          600: '#383838',
          500: '#5f5f5f',
        },
        // PreSocial accent (purple for social)
        social: {
          DEFAULT: '#8B5CF6',
          hover: '#7C3AED',
          light: '#EDE9FE',
        },
      },
      fontFamily: {
        sans: ['Inter', 'system-ui', '-apple-system', 'Segoe UI', 'Roboto', 'Helvetica', 'Arial', 'sans-serif'],
      },
      backdropBlur: {
        xs: '2px',
      },
    },
  },
  plugins: [],
};
