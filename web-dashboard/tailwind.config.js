/** @type {import('tailwindcss').Config} */
module.exports = {
  content: [
    "./src/pages/**/*.{js,ts,jsx,tsx,mdx}",
    "./src/components/**/*.{js,ts,jsx,tsx,mdx}",
    "./src/app/**/*.{js,ts,jsx,tsx,mdx}",
  ],
  theme: {
    extend: {
      colors: {
        background: "var(--background)",
        foreground: "var(--foreground)",
        farm: {
          green: {
            50: "#f2f7f4",
            100: "#e2ede7",
            200: "#c7dcd0",
            600: "#2d5a3f",
            700: "#234631",
            800: "#1c3727",
            900: "#12241a",
            950: "#09140f",
          },
          amber: {
            50: "#fffbeb",
            100: "#fef3c7",
            500: "#d97706",
            600: "#b45309",
            700: "#a16207",
          },
          terracotta: {
            50: "#fff5f2",
            100: "#ffe4dc",
            500: "#c2410c",
            600: "#9a3412",
            700: "#7c2d12",
          },
          cream: {
            50: "#fafaf9",
            100: "#f5f5f4",
            200: "#e7e5e4",
            300: "#d6d3d1",
          },
          tosca: {
            50: "#f0fdfa",
            100: "#ccfbf1",
            200: "#99f6e4",
            500: "#14b8a6",
            600: "#0d9488",
            700: "#0f766e",
            950: "#042f2e",
          }
        }
      },
    },
  },
  plugins: [],
};
