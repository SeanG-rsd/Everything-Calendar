/** @type {import('tailwindcss').Config} */
module.exports = {
  content: ['./src/**/*.{js,jsx,ts,tsx}'],
  presets: [require('nativewind/preset')],
  darkMode: 'class',
  theme: {
    extend: {
      colors: {
        background: '#0E1116',
        surface: '#171B22',
        'surface-raised': '#1F242D',
        border: '#2B3140',
        'border-subtle': '#232833',
        ink: { DEFAULT: '#EDEFF4', muted: '#98A2B3', faint: '#626B7A' },
        'on-accent': '#12141A',
        danger: { DEFAULT: '#F2555A', subtle: '#33191C', fg: '#FFC9C9' },
        module: {
          tasks: { DEFAULT: '#7EB6FF', strong: '#4A90E2', subtle: '#16233A' },
          goals: { DEFAULT: '#C4A7F2', strong: '#9C6ADE', subtle: '#241B36' },
          health: { DEFAULT: '#FF9E7A', strong: '#F4784E', subtle: '#33221B' },
          'daily-goals': { DEFAULT: '#F5D67A', strong: '#E0B94A', subtle: '#332B15' },
          financial: { DEFAULT: '#8FDCA6', strong: '#4FBF77', subtle: '#17301F' },
        },
      },
    },
  },
  plugins: [],
};
