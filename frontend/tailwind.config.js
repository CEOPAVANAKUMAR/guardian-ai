/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        obsidian: {
          DEFAULT: "#050608",
          deep: "#030406",
          carbon: "#0A0D12",
          surface: "#11151C",
          slate: "#151A24",
          border: "#1E2433",
        },
        carbon: {
          DEFAULT: "#0A0D12",
          light: "#0F131A",
          surface: "#131822",
        },
        graphite: {
          DEFAULT: "#11151C",
          subtle: "#161C26",
          light: "#1F2633",
          border: "#283244",
        },
        slate: {
          deep: "#151A24",
          card: "#19202C",
        },
        silver: {
          soft: "#C8D0DC",
          DEFAULT: "#C8D0DC",
          offwhite: "#F3F5F7",
        },
        semantic: {
          emerald: "#18C985",
          gold: "#E6A93D",
          amber: "#F5A623",
          crimson: "#FF4D5F",
          violet: "#8B6CFF",
          cyan: "#40D9FF",
          teal: "#14B8A6",
          copper: "#D97706",
          burgundy: "#991B1B",
        },
      },
      fontFamily: {
        mono: ['JetBrains Mono', 'Fira Code', 'Courier New', 'monospace'],
        sans: ['Inter', 'system-ui', 'sans-serif'],
      },
      animation: {
        'spin-slow': 'spin 18s linear infinite',
        'pulse-subtle': 'pulse 3s cubic-bezier(0.4, 0, 0.6, 1) infinite',
        'fadeIn': 'fadeIn 0.3s ease-out forwards',
        'float': 'float 6s ease-in-out infinite',
        'radar-sweep': 'radarSweep 4s linear infinite',
      },
      keyframes: {
        fadeIn: {
          '0%': { opacity: '0', transform: 'translateY(6px)' },
          '100%': { opacity: '1', transform: 'translateY(0)' },
        },
        float: {
          '0%, 100%': { transform: 'translateY(0px)' },
          '50%': { transform: 'translateY(-6px)' },
        },
        radarSweep: {
          '0%': { transform: 'rotate(0deg)' },
          '100%': { transform: 'rotate(360deg)' },
        },
      },
    },
  },
  plugins: [],
}
