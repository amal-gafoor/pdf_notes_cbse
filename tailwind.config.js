/** @type {import('tailwindcss').Config} */
module.exports = {
  content: ["./app/**/*.{js,jsx}", "./components/**/*.{js,jsx}"],
  theme: {
    extend: {
      colors: {
        brand: {
          DEFAULT: "#FF6518",
          600: "#F05509",
          700: "#C63F00",
          50: "#FFF3EC",
          100: "#FFE2D2",
        },
        ink: {
          DEFAULT: "#141416",
          70: "#5A5A60",
          50: "#8A8A90",
          10: "#E8E8EA",
        },
        paper: "#FBF8F5",
      },
      fontFamily: {
        display: ["var(--font-display)", "system-ui", "sans-serif"],
        sans: ["var(--font-body)", "system-ui", "sans-serif"],
      },
      boxShadow: {
        card: "0 1px 2px rgba(20,20,22,.04), 0 12px 32px -12px rgba(20,20,22,.12)",
      },
    },
  },
  plugins: [],
};