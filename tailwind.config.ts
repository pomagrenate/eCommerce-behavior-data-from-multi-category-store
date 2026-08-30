/** @type {import('tailwindcss').Config} */
module.exports = {
  content: [
    "./app/**/*.{js,ts,jsx,tsx,mdx}",
    "./components/**/*.{js,ts,jsx,tsx,mdx}",
  ],
  theme: {
    extend: {
      colors: {
        bg: {
          primary: "#060b14",
          secondary: "#0d1526",
          card: "#111c32",
          border: "#1e2d4a",
        },
        accent: {
          blue:   "#3b82f6",
          indigo: "#6366f1",
          violet: "#8b5cf6",
          cyan:   "#06b6d4",
          emerald:"#10b981",
          amber:  "#f59e0b",
          rose:   "#f43f5e",
        },
      },
      fontFamily: {
        sans: ["Inter", "system-ui", "sans-serif"],
        mono: ["JetBrains Mono", "monospace"],
      },
    },
  },
  plugins: [],
};
