// FILE: frontend/tailwind.config.js
export default {
  darkMode: "class",
  content: ["./index.html", "./src/**/*.{js,ts,jsx,tsx}"],
  theme: {
    extend: {
      colors: {
        brand: {
          purple: "#7c3aed",
          indigo: "#5b21b6",
          teal: "#0ea5e9",
        },
      },
    },
  },
  plugins: [],
};

