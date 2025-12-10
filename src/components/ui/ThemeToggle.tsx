"use client";

import { useTheme } from "next-themes";
import { useEffect, useState, useCallback } from "react";

export default function ThemeToggle() {
  const { theme, resolvedTheme, setTheme } = useTheme();
  const [mounted, setMounted] = useState(false);

  // 1) После монтирования один раз фиксируем систему в явный light/dark
  useEffect(() => {
    setMounted(true);
  }, []);
  useEffect(() => {
    if (!mounted) return;
    // если у пользователя было "system" (или ничего), превращаем в явный light/dark
    if (!theme || theme === "system") {
      const sys = resolvedTheme === "dark" ? "dark" : "light";
      setTheme(sys);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [mounted, resolvedTheme]);

  // 2) Клик всегда переключает только light/dark
  const toggle = useCallback(() => {
    const curr = (theme === "dark" || resolvedTheme === "dark") ? "dark" : "light";
    setTheme(curr === "dark" ? "light" : "dark");
  }, [theme, resolvedTheme, setTheme]);

  if (!mounted) {
    return (
      <button
        type="button"
        className="inline-flex items-center gap-2 rounded-xl border px-3 py-2 bg-[var(--secondary)] text-[var(--foreground)] border-[var(--border)] text-sm opacity-70"
        aria-disabled
      >
        …
      </button>
    );
  }

  const label = (theme === "dark" || resolvedTheme === "dark") ? "Тёмная" : "Светлая";

  return (
    <button
      onClick={toggle}
      type="button"
      className="inline-flex items-center gap-2 rounded-xl border px-3 py-2 bg-[var(--secondary)] text-[var(--foreground)] border-[var(--border)] hover:opacity-90 transition text-sm"
      title={`Тема: ${label}`}
      aria-pressed={label === "Тёмная"}
    >
      <span className="opacity-80">{label}</span>
      <span aria-hidden>⟳</span>
    </button>
  );
}
