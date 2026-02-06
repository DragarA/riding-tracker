import type { Config } from "tailwindcss";

const config: Config = {
  content: [
    "./app/**/*.{ts,tsx}",
    "./components/**/*.{ts,tsx}",
    "./lib/**/*.{ts,tsx}"
  ],
  theme: {
    extend: {
      colors: {
        "stable-ink": "#1d1a16",
        "stable-sand": "#f6f0e6",
        "stable-saddle": "#8a5b2e",
        "stable-hay": "#d9b469",
        "stable-forest": "#2f4b3a"
      },
      borderRadius: {
        lg: "0.85rem",
        md: "0.6rem",
        sm: "0.35rem"
      },
      boxShadow: {
        "stable": "0 18px 50px -25px rgba(29, 26, 22, 0.35)"
      }
    }
  },
  plugins: []
};

export default config;
