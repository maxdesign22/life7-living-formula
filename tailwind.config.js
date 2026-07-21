/** @type {import('tailwindcss').Config} */
module.exports = {
  darkMode: ["class"],
  content: ['./index.html', './src/**/*.{js,ts,jsx,tsx}'],
  theme: {
    extend: {
      colors: {
        // ---- LIFE7 Living Formula palette (design.md §2) ----
        ivory: '#FAF6EC',
        cream: '#F3EBDA',
        'soft-white': '#FFFDF7',
        sand: '#E9DFC8',
        champagne: '#D9B26A',
        'gold-deep': '#B08A3E',
        sunlight: '#F2C14E',
        sunrise: '#F7DFA7',
        sage: '#C9D6C0',
        'sage-mist': '#E4ECDD',
        green: '#5C7A54',
        forest: '#2E4630',
        burgundy: '#7E3B46',
        ink: '#2B2620',
        'ink-soft': '#6E6659',
        'ink-faint': '#A79C8A',
        line: 'rgba(46,70,48,0.10)',
        // ---- shadcn template tokens (kept for ui primitives) ----
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
          DEFAULT: "hsl(var(--destructive) / <alpha-value>)",
          foreground: "hsl(var(--destructive-foreground) / <alpha-value>)",
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
      },
      fontFamily: {
        display: ['Fraunces', 'Georgia', 'serif'],
        sans: ['Manrope', 'ui-sans-serif', 'system-ui', 'sans-serif'],
      },
      borderRadius: {
        xl: "calc(var(--radius) + 4px)",
        lg: "var(--radius)",
        md: "calc(var(--radius) - 2px)",
        sm: "calc(var(--radius) - 4px)",
        xs: "calc(var(--radius) - 6px)",
        // LIFE7 radii (design.md §4)
        'r-sm': '10px',
        'r-md': '16px',
        'r-lg': '22px',
        'r-xl': '28px',
        'r-pill': '999px',
      },
      boxShadow: {
        xs: "0 1px 2px 0 rgb(0 0 0 / 0.05)",
        // LIFE7 warm elevations (design.md §4)
        'e-1': '0 1px 2px rgba(59,48,26,0.05), 0 4px 16px rgba(59,48,26,0.06)',
        'e-2': '0 2px 6px rgba(59,48,26,0.06), 0 18px 44px -12px rgba(59,48,26,0.16)',
        'e-3': '0 8px 24px rgba(46,70,48,0.10), 0 32px 80px -16px rgba(46,70,48,0.22)',
        'gold-glow': '0 0 0 1px rgba(217,178,106,0.5), 0 8px 30px -6px rgba(217,178,106,0.45)',
      },
      transitionTimingFunction: {
        glide: 'cubic-bezier(0.22, 1, 0.36, 1)',
        soft: 'cubic-bezier(0.4, 0, 0.2, 1)',
      },
      transitionDuration: {
        160: '160ms',
        180: '180ms',
        220: '220ms',
        260: '260ms',
        380: '380ms',
        420: '420ms',
        480: '480ms',
        560: '560ms',
        620: '620ms',
        640: '640ms',
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
        "caret-blink": {
          "0%,70%,100%": { opacity: "1" },
          "20%,50%": { opacity: "0" },
        },
        breathe: {
          "0%,100%": { transform: "scale(1)" },
          "50%": { transform: "scale(1.025)" },
        },
        heartbeat: {
          "0%": { transform: "scale(1)" },
          "12%": { transform: "scale(1.09)" },
          "24%": { transform: "scale(1)" },
          "36%": { transform: "scale(1.05)" },
          "48%": { transform: "scale(1)" },
          "100%": { transform: "scale(1)" },
        },
        "halo-ping": {
          "0%": { transform: "scale(1)", opacity: "0.45" },
          "80%,100%": { transform: "scale(1.55)", opacity: "0" },
        },
        "spin-slow": {
          from: { transform: "rotate(0deg)" },
          to: { transform: "rotate(360deg)" },
        },
        "spin-slow-rev": {
          from: { transform: "rotate(360deg)" },
          to: { transform: "rotate(0deg)" },
        },
        kenburns: {
          "0%": { transform: "scale(1)" },
          "100%": { transform: "scale(1.06)" },
        },
        "dash-drift": {
          to: { strokeDashoffset: "-80" },
        },
        "wave-sweep": {
          "0%": { transform: "translateX(-120%)" },
          "100%": { transform: "translateX(320%)" },
        },
        swing: {
          "0%,100%": { transform: "rotate(-3deg)" },
          "50%": { transform: "rotate(3deg)" },
        },
        "gold-pulse": {
          "0%,100%": { opacity: "1", transform: "scale(1)" },
          "50%": { opacity: "0.45", transform: "scale(0.82)" },
        },
      },
      animation: {
        "accordion-down": "accordion-down 0.2s ease-out",
        "accordion-up": "accordion-up 0.2s ease-out",
        "caret-blink": "caret-blink 1.25s ease-out infinite",
        breathe: "breathe 4.5s ease-in-out infinite",
        heartbeat: "heartbeat 1.15s ease-in-out infinite",
        "halo-ping": "halo-ping 1.15s ease-out infinite",
        "orbit-24": "spin-slow 24s linear infinite",
        "orbit-36": "spin-slow-rev 36s linear infinite",
        "orbit-48": "spin-slow 48s linear infinite",
        kenburns: "kenburns 24s ease-in-out infinite alternate",
        "dash-drift": "dash-drift 8s linear infinite",
        "wave-sweep": "wave-sweep 950ms cubic-bezier(0.22,1,0.36,1) 1",
        swing: "swing 6s ease-in-out infinite",
        "gold-pulse": "gold-pulse 1.8s ease-in-out infinite",
      },
    },
  },
  plugins: [require("tailwindcss-animate")],
}
