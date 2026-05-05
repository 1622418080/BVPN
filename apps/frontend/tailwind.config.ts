import type { Config } from "tailwindcss";

const config: Config = {
  content: ["./src/**/*.{js,ts,jsx,tsx,mdx}"],
  theme: {
    extend: {
      colors: {
        brand: {
          50: "#eef5ff",
          500: "#3478f6",
          600: "#2563eb",
          900: "#0b1533"
        }
      }
    }
  },
  plugins: []
};

export default config;
