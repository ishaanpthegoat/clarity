import type { Config } from "tailwindcss";
import animate from "tailwindcss-animate";

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
        /* Arrakis surfaces — so no screen hand-rolls its own brown */
        void: "hsl(var(--void))",
        sietch: {
          DEFAULT: "hsl(var(--sietch))",
          raised: "hsl(var(--sietch-raised))",
        },
        sand: {
          line: "hsl(var(--sand-line))",
        },
        /* The spice ramp — the app's only accent ladder */
        spice: {
          50: "hsl(var(--spice-50))",
          100: "hsl(var(--spice-100))",
          200: "hsl(var(--spice-200))",
          300: "hsl(var(--spice-300))",
          400: "hsl(var(--spice-400))",
          500: "hsl(var(--spice-500))",
          600: "hsl(var(--spice-600))",
          700: "hsl(var(--spice-700))",
          800: "hsl(var(--spice-800))",
        },
      },
      fontFamily: {
        sans: ["Barlow", "system-ui", "-apple-system", "BlinkMacSystemFont", "sans-serif"],
        display: ["Barlow Condensed", "Barlow", "system-ui", "sans-serif"],
        epigraph: ["Cormorant Garamond", "Georgia", "Times New Roman", "serif"],
      },
      boxShadow: {
        "spice-glow": "0 14px 40px -10px rgba(240,144,43,.45)",
        "spice-glow-lg": "0 16px 48px -10px rgba(240,144,43,.6)",
        "sietch-card": "0 6px 16px -6px rgba(0,0,0,.7)",
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
        "pulse-spice": {
          "0%, 100%": { boxShadow: "0 0 20px hsl(31 87% 55% / 0.2)" },
          "50%": { boxShadow: "0 0 40px hsl(31 87% 55% / 0.5)" },
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
        "spice-glow": {
          "0%, 100%": { boxShadow: "0 14px 40px -10px rgba(240,144,43,.45)" },
          "50%": { boxShadow: "0 14px 52px -8px rgba(240,144,43,.7)" },
        },
      },
      animation: {
        "accordion-down": "accordion-down 0.2s ease-out",
        "accordion-up": "accordion-up 0.2s ease-out",
        "fade-in": "fade-in 0.5s ease-out forwards",
        "slide-up": "slide-up 0.6s ease-out forwards",
        "pulse-spice": "pulse-spice 2s ease-in-out infinite",
        "streak-pop": "streak-pop 0.6s ease-out forwards",
        shimmer: "shimmer 2s linear infinite",
        "card-up": "card-up 0.6s cubic-bezier(.2,.7,.2,1) both",
        "pop-in": "pop-in 0.6s cubic-bezier(.2,.8,.2,1) both",
        floaty: "floaty 5s ease-in-out infinite",
        "spice-glow": "spice-glow 3.5s ease-in-out infinite",
      },
    },
  },
  plugins: [animate],
} satisfies Config;
