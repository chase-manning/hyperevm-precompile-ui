import { useEffect, useState } from "react";
import { safeGetItem, safeSetItem, STORAGE_KEYS } from "@/lib/local-storage";

export type Theme = "light" | "dark";

function isValidTheme(value: string | null): value is Theme {
  return value === "light" || value === "dark";
}

function getInitialTheme(): Theme {
  const stored = safeGetItem(STORAGE_KEYS.THEME);
  return isValidTheme(stored) ? stored : "light";
}

export function useTheme() {
  const [theme, setTheme] = useState<Theme>(getInitialTheme);

  useEffect(() => {
    const root = document.documentElement;
    if (theme === "dark") {
      root.classList.add("dark");
    } else {
      root.classList.remove("dark");
    }
    safeSetItem(STORAGE_KEYS.THEME, theme);
  }, [theme]);

  const toggleTheme = () => {
    setTheme((prev) => (prev === "dark" ? "light" : "dark"));
  };

  return { theme, toggleTheme };
}
