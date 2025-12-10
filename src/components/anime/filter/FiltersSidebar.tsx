"use client";

import { useEffect, useMemo, useState } from "react";
import YearRange from "@/components/ui/anime/YearRange";
import type { FiltersPayload } from "./FiltersBar";

type Genre = { name: string; source?: string };

export default function FiltersSidebar({
  initial,
  onChange,
  genreList = [],
  minYear = 1980,
  maxYear = new Date().getFullYear(),
}: {
  initial?: Partial<FiltersPayload>;
  onChange?: (filters: FiltersPayload) => void;
  genreList?: Genre[];
  minYear?: number;
  maxYear?: number;
}) {
  const [types, setTypes] = useState<string[]>(initial?.types ?? []);
  const [statuses, setStatuses] = useState<string[]>(initial?.statuses ?? []);
  const [ratings, setRatings] = useState<string[]>(initial?.ratings ?? []);
  const [years, setYears] = useState<[number, number]>(
    initial?.years ?? [minYear, maxYear]
  );
  const [query, setQuery] = useState(initial?.query ?? "");
  const [selectedGenres, setSelectedGenres] = useState<string[]>(
    initial?.genres ?? []
  );
  const [genreSearch, setGenreSearch] = useState("");

  const genres = useMemo(
    () =>
      (genreList || [])
        .filter((g) => !g.source || String(g.source).toLowerCase() === "shikimori")
        .sort((a, b) => a.name.localeCompare(b.name, "ru")),
    [genreList]
  );

  const filteredGenres = useMemo(() => {
    const q = genreSearch.trim().toLowerCase();
    if (!q) return genres;
    return genres.filter((g) => g.name.toLowerCase().includes(q));
  }, [genres, genreSearch]);

  useEffect(() => {
    onChange?.({
      types,
      statuses,
      ratings,
      years,
      genres: selectedGenres,
      query: query.trim() || undefined,
    });
  }, [types, statuses, ratings, years, selectedGenres, query, onChange]);

  const toggle = (list: string[], v: string, setter: (x: string[]) => void) => {
    setter(list.includes(v) ? list.filter((x) => x !== v) : [...list, v]);
  };

  const clearAll = () => {
    setTypes([]);
    setStatuses([]);
    setRatings([]);
    setYears([minYear, maxYear]);
    setSelectedGenres([]);
    setQuery("");
  };

  return (
    <aside className="sticky top-4 h-fit w-full rounded-3xl border border-[var(--border)] bg-[color:var(--card)]/75 p-4 backdrop-blur-xl">
      {/* Поиск */}
      <div className="mb-4">
        <div className="text-xs font-semibold mb-1 opacity-80">Поиск</div>
        <input
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          placeholder="Название…"
          className="w-full rounded-xl border border-[var(--border)] bg-[var(--secondary)] px-3 py-2 text-sm outline-none focus:ring-2 focus:ring-[color:var(--accent)/.35]"
        />
      </div>

      {/* Тип */}
      <Section title="Тип">
        <MultiToggle
          items={[{ v: "anime", label: "Аниме" }, { v: "anime-serial", label: "Сериал" }]}
          values={types}
          onToggle={(v) => toggle(types, v, setTypes)}
        />
      </Section>

      {/* Статус */}
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

      {/* Возрастной рейтинг (визуально; подключишь фильтр — добавим маппинг) */}
      <Section title="Возрастной рейтинг">
        <MultiToggle
          size="xs"
          items={[
            { v: "G", label: "G" },
            { v: "PG", label: "PG" },
            { v: "PG-13", label: "PG-13" },
            { v: "R-17", label: "R-17" },
            { v: "R+", label: "R+" },
          ]}
          values={ratings}
          onToggle={(v) => toggle(ratings, v, setRatings)}
        />
      </Section>

      {/* Годы */}
      <Section title="Годы">
        <YearRange
          min={minYear}
          max={maxYear}
          value={years}
          onChange={setYears}
          format={(n) => String(n)}
        />
      </Section>

      {/* Жанры */}
      <Section title="Жанры">
        <input
          value={genreSearch}
          onChange={(e) => setGenreSearch(e.target.value)}
          placeholder="Найти жанр…"
          className="mb-2 w-full rounded-lg border border-[var(--border)] bg-[var(--secondary)] px-2.5 py-1.5 text-sm outline-none"
        />
        <div className="flex max-h-48 flex-wrap gap-1.5 overflow-auto pr-1">
          {filteredGenres.length ? (
            filteredGenres.map((g) => {
              const val = g.name;
              const active = selectedGenres.includes(val);
              return (
                <button
                  key={val}
                  onClick={() => toggle(selectedGenres, val, setSelectedGenres)}
                  className={
                    "px-2.5 py-1 rounded-lg text-xs border transition " +
                    (active
                      ? "bg-[var(--accent)] text-white border-transparent"
                      : "bg-[var(--secondary)] border-[var(--border)] hover:bg-[var(--secondary)]/80")
                  }
                  title={g.name}
                >
                  {g.name}
                </button>
              );
            })
          ) : (
            <span className="text-xs text-[color:var(--foreground)/.6]">Жанры не найдены</span>
          )}
        </div>
      </Section>

      <div className="mt-4 flex justify-between">
        <button
          onClick={clearAll}
          className="px-3 py-2 rounded-xl text-sm border border-[var(--border)] bg-[var(--secondary)] hover:bg-[color:var(--secondary)]/80"
        >
          Сбросить всё
        </button>
      </div>
    </aside>
  );
}

function Section({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <div className="mb-4">
      <div className="mb-1 font-semibold text-xs tracking-wide text-[color:var(--foreground)]/85">
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
    (size === "xs" ? "px-2 py-1 text-xs" : "px-3 py-1.5 text-sm") +
    " rounded-xl border transition";
  return (
    <div className="flex flex-wrap gap-2">
      {items.map((it) => {
        const active = values.includes(it.v);
        return (
          <button
            key={it.v}
            onClick={() => onToggle(it.v)}
            className={
              clsBase +
              " " +
              (active
                ? "bg-[var(--accent)] text-white border-transparent shadow"
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
