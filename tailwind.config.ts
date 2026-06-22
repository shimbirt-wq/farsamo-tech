import type { Config } from "tailwindcss";

const config: Config = {
  darkMode: "class",
  content: ["./src/**/*.{js,ts,jsx,tsx,mdx}"],
  theme: {
    extend: {
      colors: {
        brand: {
          dark: "#0F172A",
          "dark-hover": "#1E293B",
          blue: "#1D4ED8",
          "blue-hover": "#1E40AF",
          "blue-light": "#93C5FD",
        }
      }
    }
  },
  plugins: []
};

export default config;
