import type { Config } from "tailwindcss";

export default {
  content: ["./index.html", "./src/**/*.{ts,tsx}"],
  theme: {
    extend: {
      colors: {
        maroon: {
          50: "#fbf0f2",
          100: "#f4d9dd",
          600: "#9b2f3f",
          700: "#7b1e2b",
          800: "#5f1822",
          900: "#3f1017"
        },
        saffron: {
          50: "#fff7e6",
          100: "#ffe8b3",
          400: "#f2a93b",
          500: "#d99022",
          600: "#b87313"
        },
        communityGreen: {
          50: "#edf7ef",
          100: "#d7eadb",
          600: "#4b7f58",
          700: "#386646"
        },
        cream: {
          50: "#fffdf8",
          100: "#fbf5e7",
          200: "#f4ead2",
          300: "#ead8b7"
        },
        brown: {
          700: "#3e3028",
          800: "#2f241e",
          900: "#221915"
        }
      },
      fontFamily: {
        sans: [
          "Noto Sans Devanagari",
          "Mukta",
          "Hind",
          "system-ui",
          "-apple-system",
          "BlinkMacSystemFont",
          "Segoe UI",
          "sans-serif"
        ]
      },
      boxShadow: {
        soft: "0 12px 30px rgba(63, 16, 23, 0.08)",
        subtle: "0 4px 14px rgba(63, 16, 23, 0.06)"
      }
    }
  },
  plugins: []
} satisfies Config;
