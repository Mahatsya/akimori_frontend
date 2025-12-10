"use client";

import { useEffect, useState, useCallback } from "react";
import Link from "next/link";
import Image from "next/image";

// React Icons
import { FiChevronLeft, FiChevronRight } from "react-icons/fi";

export type HeaderMaterial = {
  id: number;
  slug: string;
  title: string;
  year: number | null;
  type: string | null;
  poster_url: string;
  description: string | null;
};

type Props = {
  items: HeaderMaterial[];
};

function formatTypeLabel(t?: string | null): string {
  if (!t) return "Аниме";
  const v = t.toLowerCase();
  if (v === "movie" || v === "film") return "Фильм";
  if (v === "cartoon") return "Мультфильм";
  if (v === "tv" || v === "series") return "Сериал";
  return "Аниме";
}

export default function HeroHeaderSlider({ items }: Props) {
  const [index, setIndex] = useState(0);

  const length = items.length;
  const safeIndex = length > 0 ? index % length : 0;

  const goTo = useCallback(
    (i: number) => {
      if (!length) return;
      if (i < 0) setIndex(length - 1);
      else if (i >= length) setIndex(0);
      else setIndex(i);
    },
    [length],
  );

  const next = useCallback(() => goTo(safeIndex + 1), [goTo, safeIndex]);
  const prev = useCallback(() => goTo(safeIndex - 1), [goTo, safeIndex]);

  // авто-слайд каждые 15 сек
  useEffect(() => {
    if (!length) return;
    const id = setInterval(next, 15000);
    return () => clearInterval(id);
  }, [length, next]);

  if (!length) return null;

  return (
    <section className="relative h-[340px] md:h-[420px] lg:h-[480px] overflow-hidden select-none">
      {/* Лента */}
      <div
        className="flex h-full w-full transition-transform duration-700 ease-out"
        style={{ transform: `translateX(-${safeIndex * 100}%)` }}
      >
        {items.map((current) => (
          <div key={current.id} className="relative h-full w-full flex-shrink-0">
            <Image
              src={current.poster_url}
              alt={current.title}
              fill
              unoptimized
              sizes="100vw"
              className="object-cover"
            />

            {/* затемнения */}
            <div className="absolute inset-0 bg-gradient-to-r from-black/90 via-black/70 to-black/20" />
            <div className="absolute inset-0 bg-gradient-to-t from-black/85 via-black/40 to-transparent" />

            {/* Текстовый блок */}
            <div className="relative h-full mx-auto max-w-[1400px] px-4 md:px-6 flex items-end">
              <div className="pb-8 md:pb-10 lg:pb-12 max-w-xl space-y-3 md:space-y-4 text-white">
                <div className="flex flex-wrap items-center gap-2 text-xs md:text-[13px]">
                  <span className="inline-flex items-center rounded-full bg-red-600/90 px-2.5 py-1 font-semibold shadow">
                    {formatTypeLabel(current.type)}
                  </span>
                  {current.year && (
                    <span className="inline-flex items-center rounded-full bg-white/10 px-2.5 py-1">
                      {current.year} г.
                    </span>
                  )}
                  <span className="inline-flex items-center rounded-full bg-white/10 px-2.5 py-1">
                    HD
                  </span>
                  <span className="inline-flex items-center rounded-full bg-white/10 px-2.5 py-1">
                    Скоро в 4K
                  </span>
                </div>

                <Link href={`/anime/${current.slug}`}>
                  <h1 className="text-2xl md:text-3xl lg:text-4xl font-extrabold tracking-tight drop-shadow-md">
                    {current.title}
                  </h1>
                </Link>

                {current.description && (
                  <p className="text-xs md:text-sm text-white/80 max-w-xl line-clamp-3 md:line-clamp-4">
                    {current.description}
                  </p>
                )}

                <div className="flex flex-wrap gap-2 pt-1">
                  <Link
                    href={`/anime/${current.slug}`}
                    className="px-4 py-2.5 rounded-xl bg-[var(--primary)] text-[var(--primary-foreground)] text-sm md:text-base font-semibold hover:opacity-90 active:scale-[0.98] transition shadow-md shadow-black/40"
                  >
                    Смотреть
                  </Link>
                </div>
              </div>
            </div>
          </div>
        ))}
      </div>

      {/* Лево */}
      <button
        onClick={prev}
        className="absolute left-3 md:left-5 top-1/2 -translate-y-1/2 bg-black/40 hover:bg-black/60 text-white p-2 md:p-3 rounded-full shadow-lg transition"
      >
        <FiChevronLeft className="w-6 h-6 md:w-7 md:h-7" />
      </button>

      {/* Право */}
      <button
        onClick={next}
        className="absolute right-3 md:right-5 top-1/2 -translate-y-1/2 bg-black/40 hover:bg-black/60 text-white p-2 md:p-3 rounded-full shadow-lg transition"
      >
        <FiChevronRight className="w-6 h-6 md:w-7 md:h-7" />
      </button>

      {/* индикаторы */}
      <div className="absolute inset-x-0 bottom-3 md:bottom-4 flex justify-center">
        <div className="flex gap-2 rounded-full bg-black/40 px-3 py-1 backdrop-blur">
          {items.map((item, i) => (
            <button
              key={item.id}
              onClick={() => goTo(i)}
              className={`h-2 w-2 rounded-full border border-white/70 transition ${
                i === safeIndex ? "bg-white" : "bg-white/20"
              }`}
            />
          ))}
        </div>
      </div>
    </section>
  );
}
