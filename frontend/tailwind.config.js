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
        priority: {
          high: { DEFAULT: '#F2555A', subtle: '#33191C' },
          medium: { DEFAULT: '#F5D67A', subtle: '#332B15' },
          low: { DEFAULT: '#8FDCA6', subtle: '#17301F' },
        },
        module: {
          tasks: { DEFAULT: '#7EB6FF', strong: '#4A90E2', subtle: '#16233A' },
          goals: { DEFAULT: '#C4A7F2', strong: '#9C6ADE', subtle: '#241B36' },
          health: { DEFAULT: '#FF9E7A', strong: '#F4784E', subtle: '#33221B' },
          'daily-goals': { DEFAULT: '#F5D67A', strong: '#E0B94A', subtle: '#332B15' },
          financial: { DEFAULT: '#8FDCA6', strong: '#4FBF77', subtle: '#17301F' },
          projects: { DEFAULT: '#5FD4C4', strong: '#33B39E', subtle: '#173330' },
          weight: { DEFAULT: '#F28FB5', strong: '#D9628F', subtle: '#332030' },
          diet: { DEFAULT: '#F2555A', strong: '#D6484D', subtle: '#33191C' },
          water: { DEFAULT: '#4FC3F7', strong: '#0288D1', subtle: '#122A38' },
          workout: { DEFAULT: '#F2925A', strong: '#D5814F', subtle: '#332419' },
          other: { DEFAULT: '#9AA5B8', strong: '#7C8AA3', subtle: '#232838' },
        },
        progress: {
          red: '#F2555A',
          orange: '#F2925A',
          yellow: '#F5D67A',
          green: '#8FDCA6',
          gray: '#3A4152',
        },
      },
    },
  },
  plugins: [],
};
