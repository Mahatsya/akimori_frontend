// src/components/anime/detail/PosterCard.tsx
import Image from "next/image";
import { SoftCard } from "./atoms";

export default function PosterCard({
  poster,
  title,
  link,
  actions,
}: {
  poster: string | null;
  title: string;
  link?: string | null;
  actions?: React.ReactNode;
}) {
  return (
    <SoftCard
      allowOverflow   // <-- разрешаем выходить за границы карточки
      className="md:w-[260px] md:shrink-0 lg:sticky lg:top-6 p-0"
    >
      {/* Постер */}
      <a href="#watch" className="group block" aria-label="Смотреть">
        {/* Обрезаем ТОЛЬКО постер, а не всю карточку */}
        <div className="relative aspect-[3/4] overflow-hidden rounded-t-2xl">
          {/* скелетон */}
          <div className="absolute inset-0 bg-[var(--secondary)] animate-pulse" />
          {poster ? (
            <Image
              src={poster}
              alt={title}
              fill
              priority
              unoptimized
              sizes="(min-width:768px) 260px, 100vw"
              className="object-cover transition-transform duration-500 group-hover:scale-[1.03]"
            />
          ) : null}

          {/* виньетка */}
          <div
            className="pointer-events-none absolute inset-0"
            style={{
              background:
                "linear-gradient(to bottom, rgba(0,0,0,.35) 0%, rgba(0,0,0,0) 25%, rgba(0,0,0,0) 70%, rgba(0,0,0,.35) 100%)",
            }}
          />
          {/* глянец */}
          <div
            className="pointer-events-none absolute inset-0 opacity-40 transition-opacity duration-500 group-hover:opacity-55"
            style={{
              background:
                "linear-gradient(130deg, rgba(255,255,255,.12) 0%, rgba(255,255,255,0) 35%)",
              mixBlendMode: "overlay",
            }}
          />
        </div>
      </a>

      {/* CTA + экшены */}
      <div className="p-3 md:p-4 space-y-2 relative">
        <a
          href="#watch"
          className="block w-full text-center rounded-xl py-2.5 bg-[var(--accent)] text-white font-semibold
                     shadow-[0_8px_30px_-12px_rgba(99,102,241,.55)] hover:opacity-95 transition"
        >
          Смотреть сейчас
        </a>

        <div className="grid gap-2">
          {actions /* тут поповеры/меню/тултипы теперь могут выходить за рамки */}
        </div>
      </div>
    </SoftCard>
  );
}
