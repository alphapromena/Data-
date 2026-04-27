/** @type {import('tailwindcss').Config} */
export default {
  content: ['./index.html', './src/**/*.{ts,tsx}'],
  theme: {
    extend: {
      colors: {
        bg: '#0b1020',
        surface: '#131a30',
        'surface-2': '#1a2240',
        border: '#243056',
        text: '#e8ecf7',
        muted: '#8a93b2',
        accent: '#4f8cff',
        'accent-soft': 'rgba(79,140,255,0.12)',
        // DMI grade colors
        critical: '#ef4444',
        developing: '#f97316',
        managed: '#eab308',
        optimized: '#22c55e',
      },
      fontFamily: {
        sans: ['Inter', 'Segoe UI', 'Tahoma', 'Arial', 'system-ui', 'sans-serif'],
        arabic: ['Tajawal', 'Cairo', 'Inter', 'system-ui', 'sans-serif'],
      },
      borderRadius: {
        DEFAULT: '10px',
      },
    },
  },
  plugins: [],
};
