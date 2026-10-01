import type { Config } from "tailwindcss";

const config: Config = {
  content: ["./src/**/*.{ts,tsx}"],
  theme: {
    extend: {
      colors: {
        ink: "#1b2430",
        paper: "#f6f1e7",
        ruled: "#e7dcc8",
        highlight: "#ffe08a",
        correct: "#1f7a4d",
        wrong: "#b42318",
      },
      boxShadow: {
        sheet: "0 18px 50px rgba(27, 36, 48, 0.12)",
      },
      fontFamily: {
        display: ["Georgia", "Cambria", "Times New Roman", "serif"],
        sans: ["Segoe UI", "system-ui", "sans-serif"],
      },
    },
  },
  plugins: [],
};

export default config;
