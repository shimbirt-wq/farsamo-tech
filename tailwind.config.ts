import type { Config } from "tailwindcss";

const config: Config = {
  content: ["./src/**/*.{js,ts,jsx,tsx,mdx}"],
  theme: {
    extend: {
      colors: {
        brand: {
          50: "#eef7ff",
          100: "#d9edff",
          500: "#2476d8",
          600: "#1f64b8",
          700: "#1f5594"
        }
      }
    }
  },
  plugins: []
};

export default config;
