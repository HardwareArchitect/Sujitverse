/** @type {import('tailwindcss').Config} */
export default {
  content: ["./index.html", "./src/**/*.{js,ts,jsx,tsx}"],
  theme: {
    extend: {
      colors: {
        bg: "#0b0d10",
        surface: "#15181d",
        border: "#262a31",
        text: "#e8eaed",
        muted: "#9aa0a6",
        accent: "#7c9cff",
        danger: "#ef4444",
      },
    },
  },
  plugins: [],
};
