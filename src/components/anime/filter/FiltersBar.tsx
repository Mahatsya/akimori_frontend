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
  genres: string[];
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
  // ==== genres
  const genres = useMemo<Genre[]>(() => {
    const arr = toArray<Genre>(genreList)
      .map((g) => ({ ...g, name: (g?.name ?? "").trim() }))
      .filter((g) => g.name);
    const onlyShiki = arr.filter((g) => !g.source || String(g.source).toLowerCase() === "shikimori");
    return onlyShiki.sort((a, b) => a.name.localeCompare(b.name, "ru"));
  }, [genreList]);

  // ==== filters state
  const [types, setTypes] = useState<string[]>(initial?.types ?? []);
  const [statuses, setStatuses] = useState<string[]>(initial?.statuses ?? []);
  const [ratings, setRatings] = useState<string[]>(initial?.ratings ?? []);
  const [years, setYears] = useState<[number, number] | null>(initial?.years ?? null);
  const [selectedGenres, setSelectedGenres] = useState<string[]>(initial?.genres ?? []);
  const [genreSearch, setGenreSearch] = useState("");
  const [query, setQuery] = useState(initial?.query ?? "");

  const payload: FiltersPayload = useMemo(
    () => ({ types, statuses, ratings, years, genres: selectedGenres, query: query.trim() || undefined }),
    [types, statuses, ratings, years, selectedGenres, query]
  );

  useDebouncedEffect(() => {
    if (autoApply) onChange?.(payload);
  }, [payload, autoApply], 180);

  const toggle = (list: string[], v: string, setter: (x: string[]) => void) =>
    setter(list.includes(v) ? list.filter((x) => x !== v) : [...list, v]);

  const clearAll = () => {
    setTypes([]); setStatuses([]); setRatings([]); setYears(null); setSelectedGenres([]);
    if (!autoApply) onChange?.({ ...payload, types: [], statuses: [], ratings: [], years: null, genres: [] });
  };

  const filteredGenres = useMemo(() => {
    const q = genreSearch.trim().toLowerCase();
    if (!q) return genres;
    return genres.filter((g) => g.name.toLowerCase().includes(q));
  }, [genres, genreSearch]);

  // ==== MOBILE TOGGLE (десктоп всегда открыт)
  const [isOpen, setIsOpen] = useState(false);
  // при переходе на md+ – всегда открыт визуально; но оставим состояние для возврата на мобилу
  // никаких сторонних плагинов/вариантов не нужно.

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

  return (
    <div className="mb-5 rounded-3xl border border-[var(--border)] bg-[color:var(--card)]/75 backdrop-blur-xl shadow-[0_10px_40px_-15px_rgba(0,0,0,.25)] overflow-visible">
      {/* header row (только мобилка) */}
      <div className="md:hidden p-3 border-b border-[var(--border)] flex items-center justify-between">
        <button
          type="button"
          onClick={() => setIsOpen(v => !v)}
          className="inline-flex items-center gap-2 rounded-xl border border-[var(--border)] bg-[color:var(--secondary)] px-3 py-2 text-sm hover:bg-[color:var(--secondary)]/80"
          aria-expanded={isOpen}
        >
          <span className="grid place-items-center size-6 rounded-lg bg-black/20">
            <svg width="14" height="14" viewBox="0 0 24 24"><path fill="currentColor" d="M3 4h18v2l-7 7v5l-4 2v-7L3 6z"/></svg>
          </span>
          {isOpen ? "Скрыть фильтры" : "Показать фильтры"}
        </button>
        <span className="text-xs text-[color:var(--foreground)/0.7]">{activeCount ? `Активно: ${activeCount}` : "Не выбраны"}</span>
      </div>

      {/* content: скрываем на мобилке по isOpen, на md+ всегда показываем */}
      <div className={`${isOpen ? "block" : "hidden"} md:block p-3 md:p-4 space-y-3`}>
        {/* Верхняя панель */}
        <div className="flex flex-col gap-2 md:flex-row md:items-center md:gap-3">
          <div className="relative flex-1">
            <input
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              placeholder="Поиск по названию…"
              className="w-full rounded-xl border border-[var(--border)] bg-[var(--secondary)] px-3 py-2 pr-9 text-sm outline-none focus:ring-2 focus:ring-[color:var(--accent)/.35]"
            />
            <svg viewBox="0 0 24 24" className="pointer-events-none absolute right-2.5 top-1/2 -translate-y-1/2 h-4 w-4 opacity-70">
              <path fill="currentColor" d="M15.5 14h-.79l-.28-.27a6.471 6.471 0 001.57-4.23A6.5 6.5 0 109.5 16a6.471 6.471 0 004.23-1.57l.27.28v.79L20 21.5 21.5 20 15.5 14zm-6 0C7.01 14 5 11.99 5 9.5S7.01 5 9.5 5 14 7.01 14 9.5 11.99 14 9.5 14z"/>
            </svg>
          </div>

          <div className="flex items-center gap-2">
            {!autoApply && (
              <button
                onClick={() => onChange?.(payload)}
                className="px-3 py-2 rounded-xl text-sm font-medium bg-[var(--accent)] text-[var(--accent-foreground)] shadow hover:opacity-95"
              >
                Применить
              </button>
            )}
            <button
              onClick={clearAll}
              className="px-3 py-2 rounded-xl text-sm border border-[var(--border)] bg-[var(--secondary)] hover:bg-[color:var(--secondary)]/80"
            >
              Сбросить всё
            </button>
          </div>
        </div>

        {/* Секции */}
        <Section title="Тип">
          <MultiToggle
            items={[{ v: "anime", label: "Аниме" }, { v: "anime-serial", label: "Сериал" }]}
            values={types}
            onToggle={(v) => toggle(types, v, setTypes)}
          />
        </Section>

        <Section title="Статус">
          <MultiToggle
            items={[
              { v: "anons", label: "Анонс" },
              { v: "ongoing", label: "Онгоинг" },
              { v: "released", label: "Вышел" },
            ]}
            values={statuses}
            onToggle={(v) => toggle(statuses, v, setStatuses)}
          />
        </Section>

        <Section title="Возрастной рейтинг">
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
        </Section>

        <Section title="Годы">
          <YearsPresets
            years={years}
            onPick={(rng) => setYears(rng && years?.[0] === rng[0] && years?.[1] === rng[1] ? null : rng)}
          />
        </Section>

        <Section title={`Жанры${filteredGenres.length ? ` • ${filteredGenres.length}` : ""}`}>
          <div className="mb-2">
            <input
              value={genreSearch}
              onChange={(e) => setGenreSearch(e.target.value)}
              placeholder="Найти жанр…"
              className="w-full rounded-lg border border-[var(--border)] bg-[var(--secondary)] px-2.5 py-1.5 text-sm outline-none"
            />
          </div>
          <div className="flex flex-wrap gap-1.5 max-h-48 overflow-auto pr-1">
            {filteredGenres.length ? filteredGenres.map((g) => {
              const val = g.name;
              const active = selectedGenres.includes(val);
              return (
                <button
                  key={val}
                  onClick={() => toggle(selectedGenres, val, setSelectedGenres)}
                  className={
                    "px-2.5 py-1 rounded-lg text-xs border transition " +
                    (active
                      ? "bg-[var(--accent)] text-[var(--accent-foreground)] border-transparent"
                      : "bg-[var(--secondary)] border-[var(--border)] hover:bg-[var(--secondary)]/80")
                  }
                  title={g.name}
                >
                  {g.name}
                </button>
              );
            }) : (
              <span className="text-xs text-[color:var(--foreground)/0.6]">Жанры не найдены</span>
            )}
          </div>
        </Section>
      </div>
    </div>
  );
}

/* ------- helpers UI ------- */

function Section({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <div className="mb-3">
      <div className="mb-2 font-semibold text-sm tracking-wide text-[color:var(--foreground)]/85">{title}</div>
      {children}
    </div>
  );
}

function MultiToggle({
  items, values, onToggle, size = "sm",
}: {
  items: { v: string; label: string }[];
  values: string[];
  onToggle: (v: string) => void;
  size?: "xs" | "sm";
}) {
  const clsBase = (size === "xs" ? "px-2 py-1 text-xs" : "px-3 py-1.5 text-sm") + " rounded-xl border transition";
  return (
    <div className="flex flex-wrap gap-2">
      {items.map((it) => {
        const active = values.includes(it.v);
        return (
          <button
            key={it.v}
            onClick={() => onToggle(it.v)}
            className={
              clsBase + " " + (active
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
  years, onPick,
}: { years: [number, number] | null; onPick: (rng: [number, number]) => void; }) {
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
            onClick={() => onPick([a, b])}
            className={
              "px-2.5 py-1 rounded-lg text-xs border transition " +
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
          onClick={() => onPick(years)}
          className="ml-1 px-2 py-1 rounded-lg text-xs border border-[var(--border)] bg-[var(--secondary)]"
        >
          Сбросить годы
        </button>
      )}
    </div>
  );
}
