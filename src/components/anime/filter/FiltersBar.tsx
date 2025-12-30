"use client";

import React, { useEffect, useMemo, useState } from "react";

type Genre = { id?: number; name: string; slug?: string; source?: string };

function toArray<T>(v: unknown): T[] {
  if (Array.isArray(v)) return v as T[];
  if (v && typeof v === "object") return Object.values(v as Record<string, T>);
  return [];
}

function useDebouncedEffect(fn: () => void, deps: any[], delay = 150) {
  useEffect(() => {
    const t = setTimeout(fn, delay);
    return () => clearTimeout(t);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, deps);
}

export type FiltersPayload = {
  types: string[];
  statuses: string[];
  ratings: string[];
  years: [number, number] | null;
  genres: string[]; // slugs
  query?: string;
};

export default function FiltersBar({
  genreList,
  autoApply = true,
  onChange,
  initial,
}: {
  genreList?: unknown;
  autoApply?: boolean;
  initial?: Partial<FiltersPayload>;
  onChange?: (filters: FiltersPayload) => void;
}) {
  /* ===================== data ===================== */
  const genres = useMemo<Genre[]>(() => {
    const arr = toArray<Genre>(genreList)
      .map((g) => ({ ...g, name: (g?.name ?? "").trim() }))
      .filter((g) => g.name);
    const onlyShiki = arr.filter(
      (g) => !g.source || String(g.source).toLowerCase() === "shikimori",
    );
    return onlyShiki.sort((a, b) => a.name.localeCompare(b.name, "ru"));
  }, [genreList]);

  /* ===================== state ===================== */
  const [types, setTypes] = useState<string[]>(initial?.types ?? []);
  const [statuses, setStatuses] = useState<string[]>(initial?.statuses ?? []);
  const [ratings, setRatings] = useState<string[]>(initial?.ratings ?? []);
  const [years, setYears] = useState<[number, number] | null>(
    initial?.years ?? null,
  );
  const [selectedGenres, setSelectedGenres] = useState<string[]>(
    initial?.genres ?? [],
  );
  const [genreSearch, setGenreSearch] = useState("");
  const [query, setQuery] = useState(initial?.query ?? "");

  const payload: FiltersPayload = useMemo(
    () => ({
      types,
      statuses,
      ratings,
      years,
      genres: selectedGenres,
      query: query.trim() || undefined,
    }),
    [types, statuses, ratings, years, selectedGenres, query],
  );

  useDebouncedEffect(() => {
    if (autoApply) onChange?.(payload);
  }, [payload, autoApply], 180);

  const toggle = (list: string[], v: string, setter: (x: string[]) => void) =>
    setter(list.includes(v) ? list.filter((x) => x !== v) : [...list, v]);

  const clearAll = () => {
    setTypes([]);
    setStatuses([]);
    setRatings([]);
    setYears(null);
    setSelectedGenres([]);
    setQuery("");
    setGenreSearch("");
    if (!autoApply)
      onChange?.({
        ...payload,
        types: [],
        statuses: [],
        ratings: [],
        years: null,
        genres: [],
        query: undefined,
      });
  };

  const filteredGenres = useMemo(() => {
    const q = genreSearch.trim().toLowerCase();
    if (!q) return genres;
    return genres.filter((g) => g.name.toLowerCase().includes(q));
  }, [genres, genreSearch]);

  const selectedGenreNames = useMemo(() => {
    if (!selectedGenres.length) return [];
    const bySlug = new Map<string, string>();
    for (const g of genres) {
      const s = g.slug ?? g.name;
      bySlug.set(s, g.name);
    }
    return selectedGenres
      .map((s) => ({ slug: s, name: bySlug.get(s) ?? s }))
      .sort((a, b) => a.name.localeCompare(b.name, "ru"));
  }, [selectedGenres, genres]);

  const activeCount = useMemo(() => {
    let c = 0;
    if (query.trim()) c++;
    if (types.length) c++;
    if (statuses.length) c++;
    if (ratings.length) c++;
    if (years) c++;
    if (selectedGenres.length) c++;
    return c;
  }, [query, types, statuses, ratings, years, selectedGenres]);

  /* ======== mobile open state (md+ always visible) ======== */
  const [isOpen, setIsOpen] = useState(false);

  /* ===================== UI ===================== */
  return (
    <section className="mb-6">
      <div className="rounded-3xl border border-[var(--border)] bg-[color:var(--card)]/70 backdrop-blur-xl shadow-[0_18px_55px_-28px_rgba(0,0,0,.55)] overflow-hidden">
        {/* ===== header (mobile) ===== */}
        <div className="md:hidden px-4 py-3 border-b border-[var(--border)] flex items-center justify-between">
          <button
            type="button"
            onClick={() => setIsOpen((v) => !v)}
            className="inline-flex items-center gap-2 rounded-2xl border border-[var(--border)] bg-[color:var(--secondary)] px-3 py-2 text-sm hover:bg-[color:var(--secondary)]/80"
            aria-expanded={isOpen}
          >
            <span className="grid place-items-center size-8 rounded-xl bg-black/15">
              <svg width="16" height="16" viewBox="0 0 24 24">
                <path
                  fill="currentColor"
                  d="M3 4h18v2l-7 7v5l-4 2v-7L3 6z"
                />
              </svg>
            </span>
            {isOpen ? "Скрыть фильтры" : "Показать фильтры"}
          </button>

          <span className="text-xs text-[color:var(--foreground)/0.65]">
            {activeCount ? `Активно: ${activeCount}` : "Не выбраны"}
          </span>
        </div>

        {/* ===== content ===== */}
        <div className={`${isOpen ? "block" : "hidden"} md:block p-4 md:p-5`}>
          {/* top row */}
          <div className="flex flex-col gap-3 md:flex-row md:items-center md:gap-4">
            {/* search */}
            <div className="relative flex-1">
              <input
                value={query}
                onChange={(e) => setQuery(e.target.value)}
                placeholder="Поиск по названию…"
                className="w-full rounded-2xl border border-[var(--border)] bg-[var(--secondary)] px-4 py-3 pr-12 text-sm outline-none focus:ring-2 focus:ring-[color:var(--accent)/.35]"
              />
              <span className="pointer-events-none absolute right-3 top-1/2 -translate-y-1/2 opacity-70">
                <svg width="18" height="18" viewBox="0 0 24 24">
                  <path
                    fill="currentColor"
                    d="M15.5 14h-.79l-.28-.27A6.47 6.47 0 0016 9.5A6.5 6.5 0 109.5 16c1.61 0 3.09-.59 4.23-1.57l.27.28v.79L20 21.5 21.5 20 15.5 14zM9.5 14A4.5 4.5 0 119.5 5a4.5 4.5 0 010 9z"
                  />
                </svg>
              </span>
            </div>

            {/* actions */}
            <div className="flex items-center gap-2">
              {!autoApply && (
                <button
                  onClick={() => onChange?.(payload)}
                  className="px-4 py-3 rounded-2xl text-sm font-semibold bg-[var(--accent)] text-[var(--accent-foreground)] shadow hover:opacity-95"
                >
                  Применить
                </button>
              )}
              <button
                onClick={clearAll}
                className="px-4 py-3 rounded-2xl text-sm border border-[var(--border)] bg-[var(--secondary)] hover:bg-[color:var(--secondary)]/80"
              >
                Сбросить
              </button>
            </div>
          </div>

          {/* selected chips row */}
          {selectedGenreNames.length > 0 && (
            <div className="mt-4 rounded-2xl border border-[var(--border)] bg-[color:var(--secondary)]/60 p-3">
              <div className="flex items-center justify-between gap-3 mb-2">
                <div className="text-xs font-semibold tracking-wide text-[color:var(--foreground)/0.75]">
                  Выбрано жанров: {selectedGenreNames.length}
                </div>
                <button
                  type="button"
                  onClick={() => setSelectedGenres([])}
                  className="text-xs px-2.5 py-1 rounded-xl border border-[var(--border)] bg-[color:var(--card)] hover:bg-[color:var(--card)]/80"
                >
                  Очистить жанры
                </button>
              </div>
              <div className="flex flex-wrap gap-1.5">
                {selectedGenreNames.slice(0, 24).map((g) => (
                  <button
                    key={g.slug}
                    onClick={() => toggle(selectedGenres, g.slug, setSelectedGenres)}
                    className="px-2.5 py-1 rounded-xl text-xs border border-transparent bg-[var(--accent)] text-[var(--accent-foreground)] hover:opacity-95"
                    title="Убрать жанр"
                  >
                    {g.name}
                  </button>
                ))}
                {selectedGenreNames.length > 24 && (
                  <span className="text-xs opacity-70 px-2 py-1">
                    +{selectedGenreNames.length - 24}
                  </span>
                )}
              </div>
            </div>
          )}

          {/* grid layout */}
          <div className="mt-4 grid grid-cols-1 md:grid-cols-2 gap-4">
            {/* left column */}
            <div className="space-y-4">
              <Card title="Тип">
                <MultiToggle
                  items={[
                    { v: "anime", label: "Аниме" },
                    { v: "anime-serial", label: "Сериал" },
                  ]}
                  values={types}
                  onToggle={(v) => toggle(types, v, setTypes)}
                />
              </Card>

              <Card title="Статус">
                <MultiToggle
                  items={[
                    { v: "anons", label: "Анонс" },
                    { v: "ongoing", label: "Онгоинг" },
                    { v: "released", label: "Вышел" },
                  ]}
                  values={statuses}
                  onToggle={(v) => toggle(statuses, v, setStatuses)}
                />
              </Card>

              <Card title="Возрастной рейтинг">
                <MultiToggle
                  items={[
                    { v: "G", label: "G" },
                    { v: "PG", label: "PG" },
                    { v: "PG-13", label: "PG-13" },
                    { v: "R-17", label: "R-17" },
                    { v: "R+", label: "R+" },
                  ]}
                  values={ratings}
                  onToggle={(v) => toggle(ratings, v, setRatings)}
                  size="xs"
                />
              </Card>

              <Card title="Годы">
                <YearsPresets
                  years={years}
                  onPick={(rng) =>
                    setYears(
                      rng && years?.[0] === rng[0] && years?.[1] === rng[1]
                        ? null
                        : rng,
                    )
                  }
                />
              </Card>
            </div>

            {/* right column: genres */}
            <div className="space-y-4">
              <Card
                title={
                  <div className="flex items-center justify-between">
                    <span>Жанры</span>
                    <span className="text-xs font-normal opacity-70">
                      {filteredGenres.length ? filteredGenres.length : 0}
                    </span>
                  </div>
                }
              >
                <div className="mb-3">
                  <input
                    value={genreSearch}
                    onChange={(e) => setGenreSearch(e.target.value)}
                    placeholder="Найти жанр…"
                    className="w-full rounded-2xl border border-[var(--border)] bg-[var(--secondary)] px-3 py-2 text-sm outline-none"
                  />
                </div>

                <div className="max-h-[320px] overflow-auto pr-1">
                  <div className="flex flex-wrap gap-2">
                    {filteredGenres.length ? (
                      filteredGenres.map((g) => {
                        const val = g.slug;
                          if (!val) return null; // или пропускай жанр
                        const active = selectedGenres.includes(val);
                        return (
                          <button
                            key={val}
                            onClick={() =>
                              toggle(selectedGenres, val, setSelectedGenres)
                            }
                            className={
                              "px-3 py-1.5 rounded-2xl text-xs border transition select-none " +
                              (active
                                ? "bg-[var(--accent)] text-[var(--accent-foreground)] border-transparent shadow"
                                : "bg-[var(--secondary)] border-[var(--border)] hover:bg-[var(--secondary)]/80")
                            }
                            title={g.name}
                          >
                            {g.name}
                          </button>
                        );
                      })
                    ) : (
                      <div className="text-xs text-[color:var(--foreground)/0.6]">
                        Жанры не найдены
                      </div>
                    )}
                  </div>
                </div>

                {selectedGenres.length > 0 && (
                  <div className="mt-3 flex items-center justify-between gap-3">
                    <div className="text-xs opacity-70">
                      Выбрано: {selectedGenres.length}
                    </div>
                    <button
                      type="button"
                      onClick={() => setSelectedGenres([])}
                      className="text-xs px-3 py-1.5 rounded-2xl border border-[var(--border)] bg-[color:var(--card)] hover:bg-[color:var(--card)]/80"
                    >
                      Очистить
                    </button>
                  </div>
                )}
              </Card>

              {/* tiny hint */}
              <div className="text-xs text-[color:var(--foreground)/0.55] px-1">
                {autoApply
                  ? "Фильтры применяются автоматически."
                  : "Нажми «Применить», чтобы обновить каталог."}
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}

/* ===================== UI bits ===================== */

function Card({
  title,
  children,
}: {
  title: React.ReactNode;
  children: React.ReactNode;
}) {
  return (
    <div className="rounded-3xl border border-[var(--border)] bg-[color:var(--card)]/55 backdrop-blur p-4">
      <div className="mb-3 text-sm font-semibold tracking-wide text-[color:var(--foreground)]/85">
        {title}
      </div>
      {children}
    </div>
  );
}

function MultiToggle({
  items,
  values,
  onToggle,
  size = "sm",
}: {
  items: { v: string; label: string }[];
  values: string[];
  onToggle: (v: string) => void;
  size?: "xs" | "sm";
}) {
  const clsBase =
    (size === "xs" ? "px-3 py-1.5 text-xs" : "px-4 py-2 text-sm") +
    " rounded-2xl border transition";

  return (
    <div className="flex flex-wrap gap-2">
      {items.map((it) => {
        const active = values.includes(it.v);
        return (
          <button
            key={it.v}
            type="button"
            onClick={() => onToggle(it.v)}
            className={
              clsBase +
              " " +
              (active
                ? "bg-[var(--accent)] text-[var(--accent-foreground)] border-transparent shadow"
                : "bg-[var(--secondary)] border-[var(--border)] hover:bg-[var(--secondary)]/80")
            }
          >
            {it.label}
          </button>
        );
      })}
    </div>
  );
}

function YearsPresets({
  years,
  onPick,
}: {
  years: [number, number] | null;
  onPick: (rng: [number, number]) => void;
}) {
  const presets: [number, number][] = [
    [1980, 1999],
    [2000, 2009],
    [2010, 2019],
    [2020, 2025],
  ];

  return (
    <div className="flex flex-wrap items-center gap-2">
      {presets.map(([a, b]) => {
        const act = years?.[0] === a && years?.[1] === b;
        return (
          <button
            key={`${a}-${b}`}
            type="button"
            onClick={() => onPick([a, b])}
            className={
              "px-3 py-1.5 rounded-2xl text-xs border transition " +
              (act
                ? "bg-[var(--accent)] text-[var(--accent-foreground)] border-transparent shadow"
                : "bg-[var(--secondary)] border-[var(--border)] hover:bg-[var(--secondary)]/80")
            }
          >
            {a}–{b}
          </button>
        );
      })}

      {years && (
        <button
          type="button"
          onClick={() => onPick(years)}
          className="ml-1 px-3 py-1.5 rounded-2xl text-xs border border-[var(--border)] bg-[color:var(--card)] hover:bg-[color:var(--card)]/80"
          title="Сбросить годы"
        >
          Сбросить
        </button>
      )}
    </div>
  );
}
