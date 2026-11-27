import type { Config } from "tailwindcss";

const config: Config = {
  content: [
    "./src/pages/**/*.{js,ts,jsx,tsx,mdx}",
    "./src/components/**/*.{js,ts,jsx,tsx,mdx}",
    "./src/app/**/*.{js,ts,jsx,tsx,mdx}",
  ],
  theme: {
    extend: {
      colors: {
        brand: {
          50: "#ECFDF5",
          100: "#D1FAE5",
          200: "#A7F3D0",
          400: "#34D399",
          500: "#10B981",
          600: "#059669",
          700: "#047857",
          800: "#065F46",
          900: "#064E3B",
        },
        surface: {
          canvas: "#F5FBF7",
          card: "#FFFFFF",
          border: "#DCEBE2",
          muted: "#EFF7F2",
        },
      },
      boxShadow: {
        bento: "0 10px 30px -14px rgba(5, 150, 105, 0.16)",
        "bento-hover": "0 16px 36px -14px rgba(5, 150, 105, 0.25)",
      },
    },
  },
  plugins: [],
};

export default config;
