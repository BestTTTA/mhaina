import type { Config } from 'tailwindcss';

const config: Config = {
  content: [
    './app/**/*.{js,ts,jsx,tsx,mdx}',
    './components/**/*.{js,ts,jsx,tsx,mdx}',
  ],
  theme: {
    extend: {
      colors: {
        primary: '#FF4444',
        secondary: '#1E1E1E',
        accent: '#0066FF',
        dark: '#0D0D0D',
        light: '#FFFFFF',
        'dark-gray': '#2A2A2A',
      },
      fontFamily: {
        'noto-sans': 'Noto Sans Thai, sans-serif',
        'thai-sans': 'ThaiSans, sans-serif',
      },
      spacing: {
        'safe-bottom': 'env(safe-area-inset-bottom)',
      },
    },
  },
  plugins: [],
  darkMode: 'class',
};

export default config;
