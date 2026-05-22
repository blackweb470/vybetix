import type { Config } from 'tailwindcss';

const config: Config = {
  content: [
    './src/pages/**/*.{js,ts,jsx,tsx,mdx}',
    './src/components/**/*.{js,ts,jsx,tsx,mdx}',
    './src/app/**/*.{js,ts,jsx,tsx,mdx}',
  ],
  theme: {
    extend: {
      fontFamily: {
        syne: ['var(--font-syne)', 'sans-serif'],
        outfit: ['var(--font-outfit)', 'sans-serif'],
      },
      backgroundImage: {
        'gradient-radial': 'radial-gradient(var(--tw-gradient-stops))',
        'gradient-conic': 'conic-gradient(from 180deg at 50% 50%, var(--tw-gradient-stops))',
      },
      colors: {
        dark: {
          900: '#030712',
          800: '#0B0F19',
          700: '#1F2937',
        },
        brand: {
          purple: '#8B5CF6',
          pink: '#EC4899',
          blue: '#3B82F6',
        }
      }
    },
  },
  plugins: [],
};
export default config;
