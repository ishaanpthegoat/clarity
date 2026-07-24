import type { Config } from "tailwindcss";

export default {
  darkMode: ["class"],
  content: ["./pages/**/*.{ts,tsx}", "./components/**/*.{ts,tsx}", "./app/**/*.{ts,tsx}", "./src/**/*.{ts,tsx}"],
  prefix: "",
  theme: {
    container: {
      center: true,
      padding: "2rem",
      screens: {
        "2xl": "1400px",
      },
    },
    extend: {
      colors: {
        border: "hsl(var(--border))",
        input: "hsl(var(--input))",
        ring: "hsl(var(--ring))",
        background: "hsl(var(--background))",
        foreground: "hsl(var(--foreground))",
        primary: {
          DEFAULT: "hsl(var(--primary))",
          foreground: "hsl(var(--primary-foreground))",
        },
        secondary: {
          DEFAULT: "hsl(var(--secondary))",
          foreground: "hsl(var(--secondary-foreground))",
        },
        destructive: {
          DEFAULT: "hsl(var(--destructive))",
          foreground: "hsl(var(--destructive-foreground))",
        },
        muted: {
          DEFAULT: "hsl(var(--muted))",
          foreground: "hsl(var(--muted-foreground))",
        },
        accent: {
          DEFAULT: "hsl(var(--accent))",
          foreground: "hsl(var(--accent-foreground))",
        },
        popover: {
          DEFAULT: "hsl(var(--popover))",
          foreground: "hsl(var(--popover-foreground))",
        },
        card: {
          DEFAULT: "hsl(var(--card))",
          foreground: "hsl(var(--card-foreground))",
        },
        gold: "hsl(var(--gold))",
        "gold-glow": "hsl(var(--gold-glow))",
        navy: "hsl(var(--navy))",
        charcoal: "hsl(var(--charcoal))",
        clarity: {
          50: "hsl(var(--clarity-50))",
          200: "hsl(var(--clarity-200))",
          300: "hsl(var(--clarity-300))",
          400: "hsl(var(--clarity-400))",
          500: "hsl(var(--clarity-500))",
          600: "hsl(var(--clarity-600))",
          700: "hsl(var(--clarity-700))",
        },
      },
      fontFamily: {
        sans: [
          "-apple-system", "BlinkMacSystemFont", "SF Pro Display", "SF Pro Text",
          "Inter", "system-ui", "sans-serif",
        ],
      },
      boxShadow: {
        "clarity-glow": "0 14px 40px -8px rgba(139,107,255,.5)",
        "clarity-glow-lg": "0 12px 36px -8px rgba(139,107,255,.6)",
        "clarity-card": "0 6px 16px -6px rgba(0,0,0,.6)",
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
        "fade-in": {
          "0%": { opacity: "0", transform: "translateY(10px)" },
          "100%": { opacity: "1", transform: "translateY(0)" },
        },
        "slide-up": {
          "0%": { opacity: "0", transform: "translateY(40px)" },
          "100%": { opacity: "1", transform: "translateY(0)" },
        },
        "pulse-gold": {
          "0%, 100%": { boxShadow: "0 0 20px hsl(43 72% 52% / 0.2)" },
          "50%": { boxShadow: "0 0 40px hsl(43 72% 52% / 0.5)" },
        },
        "streak-pop": {
          "0%": { transform: "scale(0.5)", opacity: "0" },
          "50%": { transform: "scale(1.3)" },
          "100%": { transform: "scale(1)", opacity: "1" },
        },
        shimmer: {
          "0%": { backgroundPosition: "-200% 0" },
          "100%": { backgroundPosition: "200% 0" },
        },
        "card-up": {
          from: { opacity: "0", transform: "translateY(28px)" },
          to: { opacity: "1", transform: "none" },
        },
        "pop-in": {
          from: { opacity: "0", transform: "scale(.86)" },
          to: { opacity: "1", transform: "scale(1)" },
        },
        floaty: {
          "0%, 100%": { transform: "translateY(0)" },
          "50%": { transform: "translateY(-5px)" },
        },
        "clarity-glow": {
          "0%, 100%": { boxShadow: "0 14px 40px -8px rgba(139,107,255,.5)" },
          "50%": { boxShadow: "0 14px 52px -6px rgba(139,107,255,.75)" },
        },
      },
      animation: {
        "accordion-down": "accordion-down 0.2s ease-out",
        "accordion-up": "accordion-up 0.2s ease-out",
        "fade-in": "fade-in 0.5s ease-out forwards",
        "slide-up": "slide-up 0.6s ease-out forwards",
        "pulse-gold": "pulse-gold 2s ease-in-out infinite",
        "streak-pop": "streak-pop 0.6s ease-out forwards",
        shimmer: "shimmer 2s linear infinite",
        "card-up": "card-up 0.6s cubic-bezier(.2,.7,.2,1) both",
        "pop-in": "pop-in 0.6s cubic-bezier(.2,.8,.2,1) both",
        floaty: "floaty 5s ease-in-out infinite",
        "clarity-glow": "clarity-glow 3.5s ease-in-out infinite",
      },
    },
  },
  plugins: [require("tailwindcss-animate")],
} satisfies Config;
