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
          bg: "#0a0a0a",
          "bg-secondary": "#111111",
          border: "#222222",
          "border-hover": "#333333",
          text: "#ffffff",
          muted: "#888888",
          faded: "#555555",
          accent: "#00ff41",
        },
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
