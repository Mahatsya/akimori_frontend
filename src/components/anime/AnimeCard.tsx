"use client";

import Image from "next/image";
import Link from "next/link";
import { useEffect, useRef, useState } from "react";
import RatingCircle from "./RatingCircle";
import MetaBadges from "./MetaBadges";

export type Material = {
  kodik_id: string;
  slug: string;
  title: string;
  type: "anime" | "anime-serial" | string;
  year?: number | null;
  poster_url?: string | null;
  updated_at: string;
  shikimori_rating?: number | null;
};

function useInView<T extends HTMLElement>(rootMargin = "200px") {
  const ref = useRef<T | null>(null);
  const [inView, setInView] = useState(false);

  useEffect(() => {
    if (!ref.current || inView) return;
    const el = ref.current;

    if ("IntersectionObserver" in window) {
      const io = new IntersectionObserver(
        (entries) => {
          entries.forEach((e) => {
            if (e.isIntersecting) {
              setInView(true);
              io.disconnect();
            }
          });
        },
        { root: null, rootMargin, threshold: 0.01 }
      );
      io.observe(el);
      return () => io.disconnect();
    } else {
      // старые браузеры — грузим сразу
      setInView(true);
    }
  }, [inView, rootMargin]);

  return { ref, inView };
}

export default function AnimeCard({
  m,
  priority = false,
}: {
  m: Material;
  priority?: boolean;
}) {
  const rating = m.shikimori_rating;
  const hasRating = typeof rating === "number" && Number.isFinite(rating);
  const typeLabel = m.type === "anime-serial" ? "Сериал" : "Фильм/OVA";

  // наблюдаем за всей карточкой (не только за img)
  const { ref, inView } = useInView<HTMLAnchorElement>("300px");
  const [imgLoaded, setImgLoaded] = useState(false);

  return (
    <div className="group block">
      {/* --- Карточка постера --- */}
      <Link
        href={`/anime/${m.slug}`}
        ref={ref}
        className="relative block rounded-[22px] overflow-hidden bg-[color:var(--card)] border border-[var(--border)] backdrop-blur-xl shadow-[0_10px_40px_-15px_rgba(0,0,0,.3)] transition-transform duration-200 hover:-translate-y-[2px]"
      >
        <div className="relative aspect-[2.8/4] overflow-hidden">
          {/* Скелет пока не в вьюпорте/не загружено */}
          <div
            className={
              "absolute inset-0 bg-[color:var(--secondary)] animate-pulse " +
              (imgLoaded ? "opacity-0" : "opacity-100")
            }
          />

          {/* Ленивая отрисовка: картинку монтируем только после inView */}
          {inView && m.poster_url ? (
            <Image
              src={m.poster_url}
              alt={m.title}
              fill
              className={
                "object-cover transition-opacity duration-500 " +
                (imgLoaded ? "opacity-100" : "opacity-0")
              }
              // Next Image: по умолчанию lazy, но явно укажем
              loading={priority ? "eager" : "lazy"}
              priority={priority}
              sizes="(max-width: 640px) 50vw, (max-width: 1024px) 25vw, 16vw"
              onLoad={() => setImgLoaded(true)}
            />
          ) : (
            // Плейсхолдер, пока карточка не в вьюпорте или нет постера
            <div className="absolute inset-0 bg-gradient-to-br from-[color:var(--accent)]/20 to-[color:var(--accent)]/20" />
          )}

          <MetaBadges year={m.year} typeLabel={typeLabel} />

          {hasRating && (
            <div className="absolute top-2 right-2">
              <RatingCircle value={rating as number} />
            </div>
          )}
        </div>
      </Link>

      {/* --- Текстовый блок --- */}
      <div className="mt-2 px-1">
        <Link
          href={`/anime/${m.slug}`}
          className="block hover:underline underline-offset-4"
        >
          <h2 className="text-balance md:text-sm font-semibold leading-snug line-clamp-2">
            {m.title}
          </h2>
        </Link>
      </div>
    </div>
  );
}
