/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        dark: {
          950: "#030303",
          900: "#080810",
          850: "#0f0f1c",
          800: "#14142b",
          700: "#1c1c3a",
          600: "#2c2c54",
        },
        brand: {
          purple: "#a855f7",
          pink: "#ec4899",
          cyan: "#06b6d4",
          blue: "#3b82f6",
        }
      },
      fontFamily: {
        sans: ["Outfit", "Inter", "sans-serif"],
      },
      boxShadow: {
        'glass': '0 8px 32px 0 rgba(0, 0, 0, 0.37)',
        'glass-glow': '0 8px 32px 0 rgba(168, 85, 247, 0.15)',
        'neon-purple': '0 0 20px rgba(168, 85, 247, 0.5)',
        'neon-cyan': '0 0 20px rgba(6, 182, 212, 0.5)',
      }
    },
  },
  plugins: [],
}
