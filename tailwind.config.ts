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
      fontFamily: {
        sans: ['Inter', 'sans-serif'],
      },
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
          DEFAULT: "hsl(var(--accent-gold))",
          bright: "hsl(var(--accent-gold-bright))",
          dim: "hsl(var(--accent-gold-dim))",
          foreground: "hsl(260 80% 10%)",
        },
        popover: {
          DEFAULT: "hsl(var(--popover))",
          foreground: "hsl(var(--popover-foreground))",
        },
        card: {
          DEFAULT: "hsl(var(--card))",
          foreground: "hsl(var(--card-foreground))",
        },
        sidebar: {
          DEFAULT: "hsl(var(--sidebar-background))",
          foreground: "hsl(var(--sidebar-foreground))",
          primary: "hsl(var(--sidebar-primary))",
          "primary-foreground": "hsl(var(--sidebar-primary-foreground))",
          accent: "hsl(var(--sidebar-accent))",
          "accent-foreground": "hsl(var(--sidebar-accent-foreground))",
          border: "hsl(var(--sidebar-border))",
          ring: "hsl(var(--sidebar-ring))",
        },
        // Game-specific colors
        correct: {
          DEFAULT: "hsl(var(--correct))",
          foreground: "hsl(var(--correct-foreground))",
        },
        wrong: {
          DEFAULT: "hsl(var(--wrong))",
          foreground: "hsl(var(--wrong-foreground))",
        },
        timer: {
          safe: "hsl(var(--timer-safe))",
          warning: "hsl(var(--timer-warning))",
          danger: "hsl(var(--timer-danger))",
        },
        ladder: {
          active: "hsl(var(--ladder-active))",
          milestone: "hsl(var(--ladder-milestone))",
          passed: "hsl(var(--ladder-passed))",
          upcoming: "hsl(var(--ladder-upcoming))",
        },
        stage: {
          purple: "hsl(var(--stage-purple))",
          "purple-dark": "hsl(var(--stage-purple-dark))",
          blue: "hsl(var(--stage-blue))",
          "blue-dark": "hsl(var(--stage-blue-dark))",
        },
        spotlight: {
          primary: "hsl(var(--spotlight-primary))",
          secondary: "hsl(var(--spotlight-secondary))",
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
        "fade-in": {
          "0%": { opacity: "0", transform: "translateY(10px)" },
          "100%": { opacity: "1", transform: "translateY(0)" },
        },
        "fade-out": {
          "0%": { opacity: "1", transform: "translateY(0)" },
          "100%": { opacity: "0", transform: "translateY(10px)" },
        },
        "scale-in": {
          "0%": { transform: "scale(0.95)", opacity: "0" },
          "100%": { transform: "scale(1)", opacity: "1" },
        },
        "slide-up": {
          "0%": { transform: "translateY(20px)", opacity: "0" },
          "100%": { transform: "translateY(0)", opacity: "1" },
        },
        "slide-in-right": {
          "0%": { transform: "translateX(100%)" },
          "100%": { transform: "translateX(0)" },
        },
        "pulse-glow": {
          "0%, 100%": { opacity: "0.4", transform: "scale(1)" },
          "50%": { opacity: "0.7", transform: "scale(1.1)" },
        },
        "float": {
          "0%, 100%": { transform: "translateY(0)" },
          "50%": { transform: "translateY(-20px)" },
        },
        "shimmer": {
          "0%": { backgroundPosition: "-200% 0" },
          "100%": { backgroundPosition: "200% 0" },
        },
        "count-up": {
          "0%": { transform: "translateY(100%)", opacity: "0" },
          "50%": { transform: "translateY(-10%)", opacity: "1" },
          "100%": { transform: "translateY(0)", opacity: "1" },
        },
      },
      animation: {
        "accordion-down": "accordion-down 0.2s ease-out",
        "accordion-up": "accordion-up 0.2s ease-out",
        "fade-in": "fade-in 0.5s ease-out",
        "fade-out": "fade-out 0.3s ease-out",
        "scale-in": "scale-in 0.3s ease-out",
        "slide-up": "slide-up 0.5s ease-out",
        "slide-in-right": "slide-in-right 0.3s ease-out",
        "pulse-glow": "pulse-glow 4s ease-in-out infinite",
        "float": "float 6s ease-in-out infinite",
        "shimmer": "shimmer 2s linear infinite",
        "count-up": "count-up 0.5s ease-out",
      },
      backgroundImage: {
        "gradient-radial": "radial-gradient(var(--tw-gradient-stops))",
        "stage-gradient": "linear-gradient(180deg, hsl(var(--stage-purple-dark)) 0%, hsl(var(--stage-blue-dark)) 50%, hsl(260 80% 5%) 100%)",
        "gold-gradient": "linear-gradient(135deg, hsl(var(--accent-gold)) 0%, hsl(var(--accent-gold-bright)) 50%, hsl(var(--accent-gold)) 100%)",
        "purple-gradient": "linear-gradient(135deg, hsl(var(--primary)) 0%, hsl(263 80% 50%) 100%)",
      },
      boxShadow: {
        "gold-glow": "0 0 20px hsl(var(--accent-gold) / 0.4), 0 0 40px hsl(var(--accent-gold) / 0.2)",
        "purple-glow": "0 0 20px hsl(var(--primary) / 0.4), 0 0 40px hsl(var(--primary) / 0.2)",
        "correct-glow": "0 0 20px hsl(var(--correct) / 0.5)",
        "wrong-glow": "0 0 20px hsl(var(--wrong) / 0.5)",
      },
    },
  },
  plugins: [require("tailwindcss-animate")],
} satisfies Config;
