import { radixThemePreset } from 'radix-themes-tw';
import type { Config } from 'tailwindcss';

const config: Config = {
  content: [
    './src/app/**/*.{js,ts,jsx,tsx,mdx}',
    './src/components/**/*.{js,ts,jsx,tsx,mdx}',
    './src/app/**/*.{js,ts,jsx,tsx,mdx}',
  ],
  theme: {
    extend: {
      backgroundImage: {
        'gradient-radial': 'radial-gradient(var(--tw-gradient-stops))',
        'gradient-conic': 'conic-gradient(from 180deg at 50% 50%, var(--tw-gradient-stops))',
      },
      keyframes: {
        heartPulse: {
          '0%, 100%': {
            transform: 'scale(1)',
          },
          '10%': {
            transform: 'scale(1.1)',
          },
          '25%': {
            transform: 'scale(1)',
          },
          '40%': {
            transform: 'scale(1.2)',
          },
        },
      },
    },
    animation: {
      heartPulse: 'heartPulse 1s ease-in-out infinite',
    },
  },
  presets: [radixThemePreset],
};

export default config;
