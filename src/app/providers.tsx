"use client";

import { useEffect } from "react";
import { usePathname, useSearchParams } from "next/navigation";
import { SessionProvider } from "next-auth/react";
import { ThemeProvider } from "next-themes";

export default function Providers({ children }: { children: React.ReactNode }) {
  // Загружаем Готовый бандл Preline (НЕ "preline" и не "preline/src")
  useEffect(() => {
    import("preline/preline")
      .then(() => {
        (window as any).HSStaticMethods?.autoInit?.();
      })
      .catch((e) => console.error("Preline load failed:", e));
  }, []);

  // Переинициализация после навигации
  const pathname = usePathname();
  const search = useSearchParams();
  useEffect(() => {
    const id = setTimeout(() => (window as any).HSStaticMethods?.autoInit?.(), 0);
    return () => clearTimeout(id);
  }, [pathname, search]);

  return (
    <ThemeProvider
      attribute="class"
      defaultTheme="system"
      enableSystem
      value={{ light: "theme-light", dark: "theme-dark" }}
    >
      <SessionProvider>{children}</SessionProvider>
    </ThemeProvider>
  );
}
