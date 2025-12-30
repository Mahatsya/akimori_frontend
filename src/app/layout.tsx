// src/app/layout.tsx

// Порядок важен: сначала Froala, потом твои globals
import "froala-editor/css/froala_style.min.css";
import "froala-editor/css/froala_editor.pkgd.min.css";
import "./globals.css";
import "plyr/dist/plyr.css";

import { Exo_2 } from "next/font/google";

import Providers from "./providers";
import SiteHeader from "@/components/layout/SiteHeader";
import SiteFooter from "@/components/layout/SiteFooter";
import { Suspense } from "react";

const exo2 = Exo_2({
  subsets: ["cyrillic", "latin"],
  weight: ["300", "400", "500", "600", "700", "800"],
  variable: "--font-exo2",
  display: "swap",
});

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html
      lang="ru"
      className={`theme-dark ${exo2.variable}`}  // ✅ сюда
      suppressHydrationWarning
    >
      <body className="bg-[var(--background)] text-[var(--foreground)] font-sans">
        <Suspense
          fallback={
            <div className="min-h-screen flex items-center justify-center text-sm text-[color:var(--foreground)]/70">
              Загрузка…
            </div>
          }
        >
          <Providers>
            <SiteHeader />
            <main className="min-h-[calc(100vh-180px)]">{children}</main>
            <SiteFooter />
          </Providers>
        </Suspense>
      </body>
    </html>
  );
}
