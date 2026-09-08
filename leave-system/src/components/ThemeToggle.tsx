"use client";
import { useEffect, useState } from "react";
type Theme = "theme-dark" | "theme-light";

function getSystemPref(): Theme {
  if (typeof window === "undefined") return "theme-dark";
  return window.matchMedia("(prefers-color-scheme: light)").matches
    ? "theme-light" : "theme-dark";
}

export default function ThemeToggle({ className="" }: { className?: string }) {
  const [theme, setTheme] = useState<Theme>("theme-dark");

  useEffect(() => {
    const saved = (localStorage.getItem("theme") as Theme) || getSystemPref();
    setTheme(saved);
    document.documentElement.classList.remove("theme-dark","theme-light");
    document.documentElement.classList.add(saved);
  }, []);

  const toggle = () => {
    const next: Theme = theme === "theme-dark" ? "theme-light" : "theme-dark";
    setTheme(next);
    document.documentElement.classList.remove("theme-dark","theme-light");
    document.documentElement.classList.add(next);
    localStorage.setItem("theme", next);
  };

  return (
    <button
      onClick={toggle}
      aria-label="Toggle theme"
      title={theme === "theme-dark" ? "Switch to Light" : "Switch to Dark"}
      className={`rounded-xl px-3 py-2 font-semibold bg-[var(--cyan)] text-[#001418]
                  shadow-[0_8px_26px_rgba(8,247,254,.35)] hover:brightness-110 cursor-pointer ${className}`}
    >
      {theme === "theme-dark" ? "☀️ Light" : "🌙 Dark"}
    </button>
  );
}
