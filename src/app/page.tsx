// src/app/page.tsx
import Link from "next/link";
import Image from "next/image";
import { serverApi } from "@/lib/api";
import SliderRow from "@/components/home/SliderRow";
import MediaCard, { type MediaItem } from "@/components/home/MediaCard";
import GenreNav from "@/components/home/GenreNav";
import HeroHeaderSlider, {
  type HeaderMaterial,
} from "@/components/home/HeroHeaderSlider";

type ApiList = { results: any[] };
type HeaderApiList = { results: HeaderMaterial[] };

async function fetchList(params: Record<string, any>): Promise<MediaItem[]> {
  const api = await serverApi();
  const { data } = await api.get<ApiList>("/api/kodik/materials/", {
    params: { page_size: 20, ...params },
  });

  return (data.results || []).map((m: any) => ({
    slug: m.slug,
    title: m.title,
    year: m.year,
    poster_url: m.poster_url || m?.extra?.poster_url,
    shikimori_rating:
      m.shikimori_rating ?? m?.extra?.shikimori_rating ?? null,
    type: m.type,
    aired_at: m.aired_at || m?.extra?.aired_at || null,
    next_episode_at: m.next_episode_at || m?.extra?.next_episode_at || null,
    updated_at: m.updated_at || null,
  }));
}

async function fetchHeaders(): Promise<HeaderMaterial[]> {
  const api = await serverApi();
  const { data } = await api.get<HeaderApiList>(
    "/api/craft/header-materials/",
  );

  const list = (data as any).results ?? data;
  if (!Array.isArray(list)) return [];
  return list as HeaderMaterial[];
}

function formatDate(d: Date): string {
  return d.toISOString().slice(0, 10); // YYYY-MM-DD
}

// формат даты выхода серии (aired_at) — «21.11.2025»
function formatNextEpisodeDate(iso: string | null | undefined) {
  if (!iso) return null;
  const d = new Date(iso);
  if (Number.isNaN(d.getTime())) return null;
  return d.toLocaleDateString("ru-RU", {
    timeZone: "Europe/Moscow",
    day: "2-digit",
    month: "2-digit",
    year: "numeric",
  });
}

// формат даты для updated_at — «21.11.2025»
function formatUpdatedDate(iso: string | null | undefined) {
  if (!iso) return null;
  const d = new Date(iso);
  if (Number.isNaN(d.getTime())) return null;
  return d.toLocaleDateString("ru-RU", {
    timeZone: "Europe/Moscow",
    day: "2-digit",
    month: "2-digit",
    year: "numeric",
  });
}

export default async function HomePage() {
  // --- данные для хиро и подборок ---
  const [headers, topAki, topShiki, leaders, hot] = await Promise.all([
    fetchHeaders(),
    fetchList({
      ordering: "-aki_rating,-aki_votes,-views_count",
      "extra__aki_votes_from": 1,
    }),
    fetchList({ ordering: "-shiki" }),
    fetchList({ ordering: "-views_count" }),
    fetchList({ aired_from: "2024-01-01" }),
  ]);

  // --- жанровые подборки по Shikimori slug ---
  const genreConfigs = [
    { key: "isekai", title: "Исекай", slug: "isekai" },
    { key: "romance", title: "Романтика", slug: "romantika" },
    { key: "shounen", title: "Сёнен", slug: "shounen" },
    { key: "sport", title: "Спорт", slug: "sport" },
    { key: "psychology", title: "Психология", slug: "psikhologicheskoe" },
    { key: "comedy", title: "Комедия", slug: "komediia" },
  ];

  const genreLists = await Promise.all(
    genreConfigs.map((g) =>
      fetchList({
        ordering: "-aired_at,-shiki",
        genre: g.slug,
      }),
    ),
  );

  const genreSections = genreConfigs.map((g, idx) => ({
    id: `genre-${g.key}`,
    title: g.title,
    items: genreLists[idx],
    hrefMore: `/anime?genre=${encodeURIComponent(
      g.slug,
    )}&ordering=-aired_at,-shiki`,
  }));

  // --- три специальных столбца ---
  const now = new Date();
  const todayStr = formatDate(now);

  const weekAgo = new Date(now.getTime());
  weekAgo.setDate(weekAgo.getDate() - 7);
  const weekAgoStr = formatDate(weekAgo);

  const tomorrow = new Date(now.getTime());
  tomorrow.setDate(tomorrow.getDate() + 1);
  const tomorrowStr = formatDate(tomorrow);

  const [todayList, weekList, upcomingList] = await Promise.all([
    fetchList({
      updated_at_from: todayStr,
      updated_at_to: tomorrowStr,
      ordering: "-updated_at",
    }),
    fetchList({
      updated_at_from: weekAgoStr,
      updated_at_to: tomorrowStr,
      ordering: "-updated_at",
    }),
    fetchList({
      "extra__next_episode_at__gte": now.toISOString(),
      ordering: "next_episode_at",
    }),
  ]);

  return (
    <main className="relative min-h-screen bg-[var(--background)] text-[var(--foreground)]">
      {/* общий фон */}
      <div className="pointer-events-none absolute inset-0 -z-10">
        <div className="absolute inset-0 opacity-10 [background:linear-gradient(to_right,rgba(255,255,255,.06)_1px,transparent_1px),linear-gradient(to_bottom,rgba(255,255,255,.06)_1px,transparent_1px)] [background-size:40px_40px]" />
        <div className="absolute inset-0 bg-gradient-to-b from-[color:var(--accent)/0.18] via-[color:var(--background)] to-[color:var(--background)]" />
        <div className="absolute inset-x-0 top-0 h-64 bg-radial from-[color:var(--accent)/0.25] via-transparent to-transparent blur-3xl opacity-70" />
      </div>

      {/* HERO-слайдер как на скрине */}
      <HeroHeaderSlider items={headers} />

      {/* остальная часть страницы */}
      <div className="mx-auto max-w-[1400px] px-4 md:px-6 py-6 md:py-8 space-y-8 md:space-y-10">
        {/* навигация по жанрам */}
        <section className="rounded-3xl border border-[var(--border)] bg-[color:var(--card)]/80 backdrop-blur-xl px-5 py-4 md:px-7 md:py-5">
          <div className="flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
            <div>
              <h2 className="text-lg md:text-xl font-semibold tracking-tight">
                Подборки по жанрам
              </h2>
              <p className="text-xs md:text-sm opacity-70">
                Выбирай любимый жанр и смотри свежие тайтлы.
              </p>
            </div>
            <GenreNav
              items={genreSections.map((g) => ({
                id: g.id,
                label: g.title,
              }))}
            />
          </div>
        </section>

        {/* ряды-слайдеры */}
        <div className="space-y-8 md:space-y-10">
          <SliderRow
            title="Топ по оценкам пользователей Akimori"
            hrefMore="/anime?ordering=-aki_rating,-aki_votes,-views_count&extra__aki_votes_from=1"
          >
            {topAki.map((m) => (
              <MediaCard key={m.slug} item={m} className="snap-start" />
            ))}
          </SliderRow>

          <SliderRow
            title="Топ по оценкам пользователей Shikimori"
            hrefMore="/anime?ordering=-shiki"
          >
            {topShiki.map((m) => (
              <MediaCard key={m.slug} item={m} className="snap-start" />
            ))}
          </SliderRow>

          <SliderRow
            title="Лидеры просмотров"
            hrefMore="/anime?ordering=-views_count"
          >
            {leaders.map((m) => (
              <MediaCard key={m.slug} item={m} className="snap-start" />
            ))}
          </SliderRow>

          <SliderRow
            title="Горячие новинки"
            hrefMore="/anime?aired_from=2024-01-01"
          >
            {hot.map((m) => (
              <MediaCard key={m.slug} item={m} className="snap-start" />
            ))}
          </SliderRow>

          {/* три столбца */}
          <section className="grid gap-4 lg:gap-6 lg:grid-cols-3">
            {[
              {
                key: "today" as const,
                title: "Новые серии сегодня",
                items: todayList,
              },
              {
                key: "week" as const,
                title: "Новые серии за неделю",
                items: weekList,
              },
              {
                key: "upcoming" as const,
                title: "Скоро выйдет",
                items: upcomingList,
              },
            ].map((col) => (
              <div
                key={col.key}
                className="rounded-3xl border border-[var(--border)] bg-[color:var(--card)]/80 px-4 py-4 md:px-5 md:py-5 space-y-3"
              >
                <div className="flex items-center justify-between gap-2">
                  <h2 className="text-lg md:text-xl font-semibold tracking-tight">
                    {col.title}
                  </h2>
                </div>

                <div className="space-y-2 max-h-80 overflow-y-auto pr-1">
                  {col.items.map((m) => {
                    let topLine: string;
                    let extraLine: string | null = null;

                    if (col.key === "upcoming") {
                      const date = formatNextEpisodeDate(m.next_episode_at);
                      topLine = date
                        ? `Выйдет ${date}`
                        : m.year
                        ? String(m.year)
                        : "—";
                    } else {
                      topLine = m.year ? String(m.year) : "—";
                      const updated = formatUpdatedDate(m.updated_at);
                      if (updated) {
                        extraLine = `Обновлено ${updated}`;
                      }
                    }

                    return (
                      <Link
                        key={m.slug}
                        href={`/anime/${m.slug}`}
                        className="flex items-center gap-3 rounded-2xl border border-white/5 bg-black/10 px-2 py-2 hover:border-[var(--accent)]/70 hover:bg-white/5 transition"
                      >
                        <div className="relative h-14 w-10 rounded-xl overflow-hidden bg-black/40 flex-shrink-0">
                          {m.poster_url ? (
                            <Image
                              src={m.poster_url}
                              alt={m.title}
                              fill
                              unoptimized
                              sizes="80px"
                              className="object-cover"
                            />
                          ) : (
                            <div className="absolute inset-0 grid place-items-center text-[9px] text-white/70 text-center px-1">
                              {m.title}
                            </div>
                          )}
                        </div>
                        <div className="flex-1 min-w-0">
                          <div className="text-xs opacity-70">{topLine}</div>
                          <div className="text-sm font-medium truncate">
                            {m.title}
                          </div>
                          {extraLine && (
                            <div className="text-[11px] opacity-70">
                              {extraLine}
                            </div>
                          )}
                        </div>
                      </Link>
                    );
                  })}

                  {!col.items.length && (
                    <div className="text-xs opacity-60">Пока пусто.</div>
                  )}
                </div>
              </div>
            ))}
          </section>

          {/* жанровые секции */}
          {genreSections.map((g) =>
            g.items.length ? (
              <SliderRow
                key={g.id}
                id={g.id}
                title={g.title}
                hrefMore={g.hrefMore}
              >
                {g.items.map((m) => (
                  <MediaCard key={m.slug} item={m} className="snap-start" />
                ))}
              </SliderRow>
            ) : null,
          )}
        </div>
      </div>
    </main>
  );
}
