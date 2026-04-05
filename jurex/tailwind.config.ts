import type { Config } from "tailwindcss";

const config: Config = {
  content: [
    "./pages/**/*.{js,ts,jsx,tsx,mdx}",
    "./components/**/*.{js,ts,jsx,tsx,mdx}",
    "./app/**/*.{js,ts,jsx,tsx,mdx}",
  ],
  theme: {
    extend: {
      colors: {
        synth: {
          bg: "#0a0e1a",
          "bg-secondary": "#0f1219",
          border: "#1A2130",
          "border-hover": "#2A3545",
          text: "#ffffff",
          muted: "#8899AA",
          faded: "#4A5568",
          accent: "#C9A84C",
          "accent-dim": "#a8823a",
        },
        gold: "#C9A84C",
      },
      fontFamily: {
        mono: ["'SF Mono'", "Monaco", "Inconsolata", "'Roboto Mono'", "'Courier New'", "monospace"],
      },
      letterSpacing: {
        widest: "0.3em",
      },
    },
  },
  plugins: [],
};

export default config;
