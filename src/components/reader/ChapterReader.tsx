"use client";

import Image from "next/image";
import { useEffect, useMemo, useState } from "react";

type Page = { id: string | number; order: number; url: string };

export default function ChapterReader({
  title,
  pages,
}: {
  title: string;
  pages: Page[];
}) {
  const [fit, setFit] = useState<"width" | "natural">("width");

  // простая предзагрузка
  useEffect(() => {
    pages.slice(0, 3).forEach((p) => {
      const img = new window.Image();
      img.src = p.url;
    });
  }, [pages]);

  // навигация по клавишам
  useEffect(() => {
    function onKey(e: KeyboardEvent) {
      if (e.key === "w") setFit("width");
      if (e.key === "n") setFit("natural");
    }
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, []);

  const sorted = useMemo(
    () => [...pages].sort((a, b) => a.order - b.order),
    [pages]
  );

  return (
    <div className="min-h-screen bg-slate-950 text-white">
      <header className="sticky top-0 z-20 backdrop-blur border-b border-white/10 bg-black/30">
        <div className="mx-auto max-w-6xl px-4 py-3 flex items-center justify-between gap-3">
          <h1 className="text-sm md:text-base font-semibold truncate">{title}</h1>
          <div className="flex items-center gap-2 text-xs">
            <button
              onClick={() => setFit("width")}
              className={`rounded-md px-2 py-1 border ${
                fit === "width" ? "bg-white/15 border-white/30" : "bg-white/5 border-white/10"
              }`}
              title="Подгон по ширине (W)"
            >
              Под ширину
            </button>
            <button
              onClick={() => setFit("natural")}
              className={`rounded-md px-2 py-1 border ${
                fit === "natural" ? "bg-white/15 border-white/30" : "bg-white/5 border-white/10"
              }`}
              title="Оригинальный размер (N)"
            >
              Ориг. размер
            </button>
          </div>
        </div>
      </header>

      <main className="mx-auto max-w-6xl px-2 md:px-4 py-6">
        {sorted.length === 0 ? (
          <div className="text-center text-white/70 py-20">
            В этой главе пока нет страниц.
          </div>
        ) : (
          <div className="flex flex-col items-center gap-4">
            {sorted.map((p) => (
              <figure
                key={p.id}
                className="rounded-xl overflow-hidden border border-white/10 bg-white/5"
                style={{ width: fit === "width" ? "100%" : "auto" }}
              >
                {/* Для remote картинок включён patterns в next.config.js */}
                <Image
                  src={p.url}
                  alt=""
                  width={1200}
                  height={1700}
                  className={`block ${fit === "width" ? "w-full h-auto" : ""}`}
                  unoptimized
                />
              </figure>
            ))}
          </div>
        )}
      </main>
    </div>
  );
}
