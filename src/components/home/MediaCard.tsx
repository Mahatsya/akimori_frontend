// src/components/home/MediaCard.tsx
"use client";

import Image from "next/image";
import Link from "next/link";

export type MediaItem = {
  slug: string;
  title: string;
  year?: number | null;
  poster_url?: string | null;
  shikimori_rating?: number | null;
  type: string;
  updated_at?: string | null;

  // --- добавили для колонок на главной ---
  aired_at?: string | null;         // когда вышла серия / релиз
  next_episode_at?: string | null;  // когда выйдет следующая серия
};

function getTypeLabel(type: string): string {
  if (!type) return "";
  if (type.includes("serial")) return "Сериал";
  if (type.includes("movie")) return "Фильм";
  if (type.includes("anime")) return "Аниме";
  return "";
}

export default function MediaCard({
  item,
  className = "",
}: {
  item: MediaItem;
  className?: string;
}) {
  const typeLabel = getTypeLabel(item.type);

  return (
    <Link
      href={`/anime/${item.slug}`}
      className={`group relative w-[160px] sm:w-[180px] shrink-0 ${className}`}
      aria-label={item.title}
    >
      <div className="relative aspect-[3/4] overflow-hidden rounded-xl border border-[var(--border)] bg-[color:var(--secondary)]">
        {item.poster_url ? (
          <Image
            src={item.poster_url}
            alt={item.title}
            fill
            unoptimized
            sizes="180px"
            className="object-cover transition-[transform,opacity] duration-300 group-hover:scale-[1.03] group-active:scale-[0.99]"
          />
        ) : (
          <div className="absolute inset-0 grid place-items-center text-sm opacity-60 px-2 text-center">
            {item.title}
          </div>
        )}

        {item.shikimori_rating != null && (
          <div className="absolute right-1.5 top-1.5 rounded-md px-1.5 py-0.5 text-[11px] font-semibold bg-black/70 text-white/95">
            {item.shikimori_rating.toFixed(1)}
          </div>
        )}

        {typeLabel && (
          <div className="absolute left-1.5 top-1.5 rounded-full px-2 py-0.5 text-[10px] font-medium bg-black/60 text-white/90">
            {typeLabel}
          </div>
        )}

        <div className="pointer-events-none absolute inset-x-0 bottom-0 h-16 bg-gradient-to-t from-black/80 via-black/20 to-transparent" />
      </div>

      <div className="mt-2">
        <div className="line-clamp-2 text-sm font-medium leading-snug group-hover:text-[var(--accent)] transition-colors">
          {item.title}
        </div>
        <div className="text-[11px] opacity-60 mt-0.5 flex items-center gap-1.5">
          {item.year && <span>{item.year}</span>}
          {item.year && typeLabel && <span>•</span>}
          {typeLabel && <span>{typeLabel}</span>}
        </div>
      </div>
    </Link>
  );
}
