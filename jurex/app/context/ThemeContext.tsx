"use client";

import { createContext, useContext, useState, useEffect, ReactNode } from "react";

export type Mode = "human" | "agent";

interface ThemeContextValue {
  mode: Mode;
  toggle: () => void;
}

const ThemeContext = createContext<ThemeContextValue>({
  mode: "agent",
  toggle: () => {},
});

export function ThemeProvider({ children }: { children: ReactNode }) {
  const [mode, setMode] = useState<Mode>("agent");

  useEffect(() => {
    const root = document.documentElement;
    if (mode === "human") {
      root.classList.remove("dark");
      root.classList.add("light");
    } else {
      root.classList.remove("light");
      root.classList.add("dark");
    }
  }, [mode]);

  const toggle = () => setMode(m => m === "agent" ? "human" : "agent");

  return (
    <ThemeContext.Provider value={{ mode, toggle }}>
      {children}
    </ThemeContext.Provider>
  );
}

export const useTheme = () => useContext(ThemeContext);
