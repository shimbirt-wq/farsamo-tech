"use client";

import { useEffect, useState } from "react";

const THEME_STORAGE_KEY = "xeeltech-theme";

type Theme = "light" | "dark";

function applyTheme(theme: Theme) {
  document.documentElement.dataset.theme = theme;
  document.documentElement.classList.toggle("dark", theme === "dark");
}

export function ThemeToggle() {
  const [theme, setTheme] = useState<Theme>("light");
  const [ready, setReady] = useState(false);

  useEffect(() => {
    const storedTheme = window.localStorage.getItem(THEME_STORAGE_KEY);
    const nextTheme: Theme = storedTheme === "dark" ? "dark" : "light";
    setTheme(nextTheme);
    applyTheme(nextTheme);
    setReady(true);
  }, []);

  const toggleTheme = () => {
    const nextTheme: Theme = theme === "light" ? "dark" : "light";
    setTheme(nextTheme);
    applyTheme(nextTheme);
    window.localStorage.setItem(THEME_STORAGE_KEY, nextTheme);
  };

  return (
    <button
      type="button"
      onClick={toggleTheme}
      aria-label={theme === "light" ? "Switch to dark mode" : "Switch to light mode"}
      aria-pressed={theme === "dark"}
      className="group inline-flex h-12 items-center gap-2 rounded-full border border-slate-200/80 bg-white/85 px-3 text-sm font-medium text-slate-700 shadow-[0_10px_24px_rgba(15,23,42,0.06)] backdrop-blur transition duration-200 hover:border-slate-300 hover:bg-slate-50 dark:border-slate-700/80 dark:bg-slate-900/85 dark:text-slate-200 dark:hover:border-slate-600 dark:hover:bg-slate-800"
    >
      <span className="relative flex h-7 w-12 items-center rounded-full bg-slate-200 transition duration-200 dark:bg-slate-700">
        <span
          className={`absolute top-1 flex h-5 w-5 items-center justify-center rounded-full bg-white text-amber-500 shadow-sm transition-all duration-200 dark:bg-slate-950 dark:text-cyan-300 ${
            ready && theme === "dark" ? "translate-x-6" : "translate-x-1"
          }`}
        >
          {theme === "light" ? (
            <svg viewBox="0 0 20 20" aria-hidden="true" className="h-3.5 w-3.5">
              <path
                d="M10 3.2V1.5m0 17v-1.7M5.19 5.19 3.98 3.98m12.04 12.04-1.21-1.21M3.2 10H1.5m17 0h-1.7M5.19 14.81l-1.21 1.21m12.04-12.04-1.21 1.21M13.2 10A3.2 3.2 0 1 1 6.8 10a3.2 3.2 0 0 1 6.4 0Z"
                fill="none"
                stroke="currentColor"
                strokeLinecap="round"
                strokeWidth="1.6"
              />
            </svg>
          ) : (
            <svg viewBox="0 0 20 20" aria-hidden="true" className="h-3.5 w-3.5">
              <path
                d="M15.4 12.6A6.9 6.9 0 0 1 7.4 4.6a7.2 7.2 0 1 0 8 8Z"
                fill="currentColor"
              />
            </svg>
          )}
        </span>
      </span>
      <span className="hidden min-[1180px]:inline">{theme === "light" ? "Light Mode" : "Dark Mode"}</span>
      <span className="min-[1180px]:hidden">{theme === "light" ? "Light" : "Dark"}</span>
    </button>
  );
}
