import type { Config } from "tailwindcss";
import tailwindcssAnimate from "tailwindcss-animate";

const config: Config = {
  darkMode: "class",
  content: [
    "./src/pages/**/*.{js,ts,jsx,tsx,mdx}",
    "./src/components/**/*.{js,ts,jsx,tsx,mdx}",
    "./src/app/**/*.{js,ts,jsx,tsx,mdx}",
  ],
  theme: {
    extend: {
      screens: {
        'xs': '475px',
      },
      colors: {
        // Cores do sistema HP Marcas
        gold: {
          50: "#fffdf7",
          100: "#fff9e6",
          200: "#fef2cc",
          300: "#fde68a",
          400: "#f0b100", // yellow2
          500: "#d4af37", // yellow1 - Base
          600: "#b7950b", // yellow3
          700: "#a16207",
          800: "#854d0e",
          900: "#713f12",
          950: "#422006",
        },

        // Shadcn/ui theme mapping
        border: "hsl(var(--border))",
        input: "hsl(var(--input))",
        ring: "hsl(var(--ring))",
        background: "hsl(var(--background))",
        foreground: "hsl(var(--foreground))",

        primary: {
          DEFAULT: "#d4af37", // gold-500
          foreground: "#0a0a0a", // neutral-950
          50: "#fffdf7",
          100: "#fff9e6",
          200: "#fef2cc",
          300: "#fde68a",
          400: "#f0b100",
          500: "#d4af37",
          600: "#b7950b",
          700: "#a16207",
          800: "#854d0e",
          900: "#713f12",
          950: "#422006",
        },

        secondary: {
          DEFAULT: "#f5f5f5", // neutral-100
          foreground: "#171717", // neutral-900
        },

        destructive: {
          DEFAULT: "#ef4444",
          foreground: "#fef2f2",
        },

        muted: {
          DEFAULT: "#f5f5f5", // neutral-100
          foreground: "#737373", // neutral-500
        },

        accent: {
          DEFAULT: "#f5f5f5", // neutral-100
          foreground: "#171717", // neutral-900
        },

        popover: {
          DEFAULT: "#ffffff",
          foreground: "#171717",
        },

        card: {
          DEFAULT: "#ffffff",
          foreground: "#171717",
        },
      },

      borderRadius: {
        lg: "var(--radius)",
        md: "calc(var(--radius) - 2px)",
        sm: "calc(var(--radius) - 4px)",
      },

      keyframes: {
        "accordion-down": {
          from: { height: "0" },
          to: { height: "var(--radix-accordion-content-height)" },
        },
        "accordion-up": {
          from: { height: "var(--radix-accordion-content-height)" },
          to: { height: "0" },
        },
      },

      animation: {
        "accordion-down": "accordion-down 0.2s ease-out",
        "accordion-up": "accordion-up 0.2s ease-out",
      },
    },
  },
  plugins: [tailwindcssAnimate],
};

export default config;
