/** @type {import('tailwindcss').Config} */
export default {
  content: ["./index.html", "./src/**/*.{js,ts,jsx,tsx}"],
  theme: {
    extend: {
      colors: {
        // Surfaces — deeper blacks, more refined steps
        bg:        "#070809",     // page background, almost-black
        elevated:  "#0d0f12",     // section background
        surface:   "#14171c",     // card background
        raised:    "#1c2128",     // hovered card / popover
        border:    "#23272f",     // default 1px line
        "border-strong": "#2e333c",

        // Text
        text:      "#f1f3f6",
        subtle:    "#c9ccd3",
        muted:     "#8a8f99",
        faint:     "#5a5f6a",

        // Accents per category — calibrated for AA contrast on bg
        folder:    "#7aa2ff",     // refined blue
        photo:     "#5ec48b",     // refined green
        video:     "#b08bff",     // refined purple
        audio:     "#f0a868",     // refined amber
        doc:       "#7fbfd4",     // refined cyan
        archive:   "#d49075",     // refined terracotta

        // Semantic
        accent:    "#7aa2ff",     // primary action = folder blue
        danger:    "#ff6b6b",
        warn:      "#f0a868",
        ok:        "#5ec48b",
      },
      fontFamily: {
        sans: ['"Inter"', "system-ui", "-apple-system", "sans-serif"],
        display: ['"Fraunces"', '"Inter"', "system-ui", "serif"],
        mono: ['"JetBrains Mono"', "ui-monospace", "monospace"],
      },
      fontSize: {
        // Tighter, more editorial scale
        "xs":   ["0.75rem", { lineHeight: "1rem", letterSpacing: "0.01em" }],
        "sm":   ["0.875rem", { lineHeight: "1.35rem" }],
        "base": ["0.9375rem", { lineHeight: "1.5rem" }],
        "lg":   ["1.0625rem", { lineHeight: "1.6rem" }],
        "xl":   ["1.25rem", { lineHeight: "1.75rem", letterSpacing: "-0.01em" }],
        "2xl":  ["1.625rem", { lineHeight: "2rem", letterSpacing: "-0.02em" }],
        "3xl":  ["2.125rem", { lineHeight: "2.4rem", letterSpacing: "-0.025em" }],
      },
      letterSpacing: {
        tightest: "-0.04em",
      },
      borderRadius: {
        "lg":  "0.625rem",
        "xl":  "0.875rem",
        "2xl": "1.125rem",
      },
      boxShadow: {
        "soft":   "0 1px 2px rgba(0,0,0,0.4), 0 1px 1px rgba(0,0,0,0.3)",
        "raised": "0 4px 16px rgba(0,0,0,0.45), 0 2px 4px rgba(0,0,0,0.3)",
        "lift":   "0 12px 40px rgba(0,0,0,0.55), 0 4px 12px rgba(0,0,0,0.4)",
        // Inner highlight for that subtle "etched glass" Linear feel
        "inset-hi": "inset 0 1px 0 rgba(255,255,255,0.04)",
      },
      backgroundImage: {
        "subtle-grain":
          "radial-gradient(circle at 1px 1px, rgba(255,255,255,0.025) 1px, transparent 0)",
      },
      animation: {
        "fade-in": "fadeIn 200ms ease-out",
        "slide-up": "slideUp 250ms cubic-bezier(0.2, 0.8, 0.2, 1)",
      },
      keyframes: {
        fadeIn: { "0%": { opacity: "0" }, "100%": { opacity: "1" } },
        slideUp: {
          "0%": { opacity: "0", transform: "translateY(8px)" },
          "100%": { opacity: "1", transform: "translateY(0)" },
        },
      },
    },
  },
  plugins: [],
};
