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
        gw: {
          primary: "var(--gw-bg-primary)",
          cell: "var(--gw-bg-cell)",
          header: "var(--gw-bg-header)",
          border: "var(--gw-border-color)",
          text: "var(--gw-text-primary)",
          muted: "var(--gw-text-secondary)",
          accent: "var(--gw-accent)",
        },
      },
      fontFamily: {
        display: ["var(--gw-font-display)", "monospace"],
        body: ["var(--gw-font-body)", "sans-serif"],
      },
      borderRadius: {
        cell: "var(--gw-cell-radius)",
      },
      borderWidth: {
        cell: "var(--gw-border-width)",
      },
    },
  },
  plugins: [],
}