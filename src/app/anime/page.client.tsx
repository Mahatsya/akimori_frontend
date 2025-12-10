"use client";
import { FiFilter, FiX } from "react-icons/fi";
import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { usePathname, useRouter, useSearchParams } from "next/navigation";
import qs from "qs";
import ky from "ky";
import Fuse from "fuse.js";

import type { Material } from "@/components/anime/AnimeCard";
import AnimeCard from "@/components/anime/AnimeCard";
import GridHeader from "@/components/anime/GridHeader";
import LoadMoreButton from "@/components/anime/LoadMoreButton";

/* -------------------------- types -------------------------- */
type Paginated<T> = { count: number; next: string | null; previous: string | null; results: T[] };
type Genre = { id?: number; name: string; slug?: string; source?: string };

type FiltersState = {
  types: string[];
  statuses: string[];
  ratings: string[];
  years: [number, number] | null;
  genres: string[];
  q: string;
};

type Props = {
  initialItems: Material[];
  total: number;
  pageSize: number;
  initialBaseQuery: Record<string, string | number | undefined>;
  genres?: Genre[];
  fetchPath?: string;
  fuzzyLocal?: boolean;
  initialPage?: number;
};

/* ------------------- helpers ------------------- */
const toArray = <T,>(v: unknown): T[] => (Array.isArray(v) ? (v as T[]) : v ? Object.values(v as any) : []);
const splitList = (s?: string | number) => String(s ?? "").split(",").map((x) => x.trim()).filter(Boolean);

function baseToFilters(bq: Record<string, any>): FiltersState {
  const types = splitList(bq.type || "anime,anime-serial");
  const statuses = splitList(bq.anime_status);
  const ratings = splitList(bq.rating_mpaa);
  const years: [number, number] | null = bq.year_from && bq.year_to ? [Number(bq.year_from), Number(bq.year_to)] : null;
  const genres = splitList(bq.genre);
  const q = String(bq.q ?? "");
  return { types, statuses, ratings, years, genres, q };
}
function filtersToBase(f: FiltersState): Record<string, string | number | undefined> {
  return {
    type: f.types.join(",") || "anime,anime-serial",
    anime_status: f.statuses.join(",") || undefined,
    rating_mpaa: f.ratings.join(",") || undefined,
    year_from: f.years?.[0],
    year_to: f.years?.[1],
    genre: f.genres.join(",") || undefined,
    q: f.q || undefined,
  };
}

/* ================================================================ */
export default function CatalogPage({
  initialItems, total, pageSize, initialBaseQuery, genres = [],
  fetchPath = "/api/proxy/kodik/materials", fuzzyLocal = true, initialPage = 1,
}: Props) {
  /* URL / router */
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();

  /* listing */
  const [items, setItems] = useState<Material[]>(initialItems);
  const [page, setPage] = useState<number>(initialPage);
  const [loading, setLoading] = useState(false);
  const [done, setDone] = useState(initialItems.length >= total);
  const [error, setError] = useState<string | null>(null);
  const abortRef = useRef<AbortController | null>(null);

  /* filters state */
  const [filters, setFilters] = useState<FiltersState>(() => baseToFilters(initialBaseQuery));
  const [showFilters, setShowFilters] = useState<boolean>(false); // <-- мобилка: закрыто по умолчанию

  // локальные поля контролов
  const [genreSearch, setGenreSearch] = useState("");
  const filteredGenres = useMemo(() => {
    const q = genreSearch.trim().toLowerCase();
    const shiki = toArray<Genre>(genres).filter(
      (g) => !g.source || String(g.source).toLowerCase() === "shikimori"
    );
    const list = shiki.map((g) => ({ ...g, name: (g.name ?? "").trim() })).filter((g) => g.name);
    return q ? list.filter((g) => g.name.toLowerCase().includes(q)) : list;
  }, [genres, genreSearch]);

  /* fetchers */
  const http = useMemo(() => ky.create({ timeout: 15000, retry: { limit: 2 } }), []);
  const buildQuery = useCallback((p: number, baseQ?: Record<string, any>) => {
    const bq = baseQ ?? filtersToBase(filters);
    const q = {
      page: p, page_size: pageSize,
      type: bq.type || "anime,anime-serial",
      anime_status: bq.anime_status,
      rating_mpaa: bq.rating_mpaa,
      year_from: bq.year_from, year_to: bq.year_to,
      genre: bq.genre, q: bq.q,
    };
    return qs.stringify(q, { encodeValuesOnly: true });
  }, [filters, pageSize]);

  const fetchPage = useCallback(async (p: number, baseQ?: Record<string, any>, replace = false) => {
    if (loading) return;
    if (abortRef.current) abortRef.current.abort();
    const controller = new AbortController();
    abortRef.current = controller;

    setLoading(true); setError(null);
    try {
      const query = buildQuery(p, baseQ);
      const url = `${fetchPath}?${query}`;
      const res = await http.get(url, { signal: controller.signal });
      if (!res.ok) {
        if (res.status === 404 || res.status === 410) { setDone(true); return; }
        throw new Error(`${res.status} ${res.statusText}`);
      }
      const data: Paginated<Material> | Material[] = await res.json();
      const chunk = Array.isArray(data) ? data : data.results ?? [];
      setItems((prev) => (replace ? chunk : [...prev, ...chunk]));
      setPage(p);
      if (Array.isArray(data)) {
        const newLen = (replace ? 0 : items.length) + chunk.length;
        setDone(newLen >= total);
      } else {
        setDone(!data.next);
      }
    } catch (e: any) {
      if (e?.name !== "AbortError") setError(e?.message ?? "Fetch error");
    } finally {
      setLoading(false);
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [buildQuery, fetchPath, http, loading, total, items.length]);

  /* sync URL <- filters */
  const applyFilters = useCallback((next: FiltersState, opts?: { replaceHistory?: boolean }) => {
    setFilters(next);
    const bq = filtersToBase(next);
    const url = `${pathname}?${qs.stringify({ ...bq, page: 1, page_size: pageSize }, { encodeValuesOnly: true })}`;
    opts?.replaceHistory ? router.replace(url) : router.replace(url);
    setDone(false);
    fetchPage(1, bq, true);
  }, [pathname, pageSize, router, fetchPage]);

  /* back/forward URL watcher */
  useEffect(() => {
    const entries = Object.fromEntries(searchParams.entries());
    const incoming = baseToFilters(entries as any);
    if (JSON.stringify(incoming) !== JSON.stringify(filters)) {
      setFilters(incoming);
      setDone(false);
      fetchPage(1, filtersToBase(incoming), true);
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [searchParams.toString()]);

  /* local fuzzy */
  const viewItems = useMemo(() => {
    const q = filters.q.trim();
    if (!fuzzyLocal || !q) return items;
    const fuse = new Fuse(items, { keys: ["title", "title_orig"], threshold: 0.35, ignoreLocation: true, minMatchCharLength: 2 });
    return fuse.search(q).map((x) => x.item);
  }, [items, filters.q, fuzzyLocal]);

  /* setters */
  const setTypes = (upd: (x: string[]) => string[] | string[]) =>
    setFilters((f) => ({ ...f, types: typeof upd === "function" ? (upd as any)(f.types) : (upd as any) }));
  const setStatuses = (upd: any) => setFilters((f) => ({ ...f, statuses: typeof upd === "function" ? upd(f.statuses) : upd }));
  const setRatings  = (upd: any) => setFilters((f) => ({ ...f, ratings:  typeof upd === "function" ? upd(f.ratings)  : upd }));
  const setYears = (rng: [number, number] | null) => setFilters((f) => ({ ...f, years: rng }));
  const setSelectedGenres = (upd: any) => setFilters((f) => ({ ...f, genres: typeof upd === "function" ? upd(f.genres) : upd }));
  const setQuery = (s: string) => setFilters((f) => ({ ...f, q: s }));

  const applyNow = () => { applyFilters(filters, { replaceHistory: true }); setShowFilters(false); };
  const clearAll = () => {
    const cleared: FiltersState = { types: ["anime","anime-serial"], statuses: [], ratings: [], years: null, genres: [], q: "" };
    applyFilters(cleared, { replaceHistory: true });
  };

  /* ============================== UI ============================== */
  const FiltersPanel = (
    <div className="space-y-4">
      {/* Поиск */}
      <div className="relative">
        <input
          value={filters.q}
          onChange={(e) => setQuery(e.target.value)}
          onKeyDown={(e) => e.key === "Enter" && applyNow()}
          placeholder="Поиск по названию…"
          className="w-full rounded-xl border border-[var(--border)] bg-[var(--secondary)] px-3 py-2 pr-9 text-sm outline-none focus:ring-2 focus:ring-[color:var(--accent)/.35]"
        />
        <svg viewBox="0 0 24 24" className="pointer-events-none absolute right-2.5 top-1/2 -translate-y-1/2 h-4 w-4 opacity-70">
          <path fill="currentColor" d="M15.5 14h-.79l-.28-.27a6.471 6.471 0 001.57-4.23A6.5 6.5 0 109.5 16a6.471 6.471 0 004.23-1.57l.27.28v.79L20 21.5 21.5 20 15.5 14zm-6 0C7.01 14 5 11.99 5 9.5S7.01 5 9.5 5 14 7.01 14 9.5 11.99 14 9.5 14z"/>
        </svg>
      </div>

      <Section title="Тип">
        <MultiToggle
          items={[{ v:"anime", label:"Аниме" }, { v:"anime-serial", label:"Сериал" }]}
          values={filters.types}
          onToggle={(v) => setTypes((prev) => prev.includes(v) ? prev.filter(x=>x!==v) : [...prev, v])}
        />
      </Section>

      <Section title="Статус">
        <MultiToggle
          items={[{v:"anons",label:"Анонс"},{v:"ongoing",label:"Онгоинг"},{v:"released",label:"Вышел"}]}
          values={filters.statuses}
          onToggle={(v) => setStatuses((prev:string[]) => prev.includes(v)?prev.filter(x=>x!==v):[...prev,v])}
        />
      </Section>

      <Section title="Возрастной рейтинг">
        <MultiToggle
          size="xs"
          items={[{v:"G",label:"G"},{v:"PG",label:"PG"},{v:"PG-13",label:"PG-13"},{v:"R-17",label:"R-17"},{v:"R+",label:"R+"}]}
          values={filters.ratings}
          onToggle={(v) => setRatings((prev:string[]) => prev.includes(v)?prev.filter(x=>x!==v):[...prev,v])}
        />
      </Section>

      <Section title="Годы">
        <YearsPresets
          years={filters.years}
          onPick={(rng) => setYears(filters.years && rng && filters.years[0]===rng[0] && filters.years[1]===rng[1] ? null : rng)}
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
            const val = g.name; const active = filters.genres.includes(val);
            return (
              <button
                key={val}
                onClick={() => setSelectedGenres((prev:string[]) => prev.includes(val) ? prev.filter(x=>x!==val) : [...prev,val])}
                className={"px-2.5 py-1 rounded-lg text-xs border transition " +
                  (active ? "bg-[var(--accent)] text-white border-transparent"
                          : "bg-[var(--secondary)] border-[var(--border)] hover:bg-[var(--secondary)]/80")}
                title={g.name}
              >{g.name}</button>
            );
          }) : <span className="text-xs text-[color:var(--foreground)/0.6]">Жанры не найдены</span>}
        </div>
      </Section>

      {/* действия */}
      <div className="flex items-center gap-2 pt-2">
        <button onClick={applyNow} className="px-3 py-2 rounded-xl text-sm font-medium bg-[var(--accent)] text-white shadow hover:opacity-95">
          Применить
        </button>
        <button onClick={clearAll} className="px-3 py-2 rounded-xl text-sm border border-[var(--border)] bg-[var(--secondary)] hover:bg-[color:var(--secondary)]/80">
          Сбросить всё
        </button>
      </div>
    </div>
  );

  return (
    <main className="min-h-screen">
      <div className="max-w-7xl mx-auto px-4 md:px-6 py-8 md:py-10">
        {/* Заголовок + кнопка */}
        <div className="flex items-center justify-between mb-4">
          <h1 className="text-3xl md:text-4xl font-extrabold tracking-tight">Каталог аниме!</h1>
          <button
            onClick={() => setShowFilters((p) => !p)}
            className="px-3 py-2 text-sm rounded-xl border border-[var(--border)] bg-[var(--secondary)] hover:bg-[var(--secondary)]/80 flex items-center gap-2"
          >
            <FiFilter />
            <span className="hidden sm:inline">{showFilters ? "Скрыть фильтры" : "Показать фильтры"}</span>
            <span className="sm:hidden">{showFilters ? "Скрыть" : "Фильтры"}</span>
          </button>
        </div>

        <GridHeader total={total} page={page} totalPages={Math.max(1, Math.ceil(total / pageSize))} />

        <div className="flex gap-6">
          {/* DESKTOP SIDEBAR (липкий) */}
          <aside
            aria-label="Панель фильтров"
            className={`${showFilters ? "hidden lg:block" : "hidden"} lg:order-last w-full lg:w-[320px] xl:w-[360px] shrink-0
                        lg:sticky lg:top-24 lg:self-start lg:max-h-[calc(100vh-8rem)] lg:overflow-y-auto`}
          >
            <div className="mb-5 rounded-3xl border border-[var(--border)] bg-[color:var(--card)]/75 backdrop-blur-xl p-4 shadow-[0_10px_40px_-15px_rgba(0,0,0,.25)]">
              {FiltersPanel}
            </div>
          </aside>

          {/* CONTENT GRID */}
          <div className="flex-1">
            {viewItems.length === 0 ? (
              <div className="rounded-3xl border border-[var(--border)] bg-[color:var(--card)] backdrop-blur-xl p-8 text-[color:var(--foreground)/0.7]">
                Ничего не найдено.
              </div>
            ) : (
              <div className={`grid gap-5 transition-all ${
                showFilters ? "grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-4 2xl:grid-cols-4"
                            : "grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6 2xl:grid-cols-6"
              }`}>
                {viewItems.map((m, idx) => (
                  <AnimeCard key={`${m.kodik_id}-${idx}`} m={m} priority={idx < 6} />
                ))}
              </div>
            )}

            {!done && (
              <LoadMoreButton
                onLoadMore={() => fetchPage(page + 1)}
                loading={loading}
                hasMore={!done}
                nextPage={page + 1}
              />
            )}
            {error && <p className="mt-3 text-center text-xs text-red-300/90">Ошибка загрузки: {error}</p>}
          </div>
        </div>
      </div>

      {/* MOBILE SHEET */}
      <div
        className={`lg:hidden fixed inset-0 z-50 ${showFilters ? "pointer-events-auto" : "pointer-events-none"}`}
        aria-hidden={!showFilters}
      >
        {/* backdrop */}
        <div
          className={`absolute inset-0 bg-black/50 transition-opacity ${showFilters ? "opacity-100" : "opacity-0"}`}
          onClick={() => setShowFilters(false)}
        />
        {/* panel */}
        <div
          className={`absolute right-0 top-0 h-full w-[92%] sm:w-[420px] max-w-[92%]
                      bg-[color:var(--background)] border-l border-[var(--border)]
                      rounded-l-2xl shadow-2xl overflow-y-auto thin-scroll
                      transition-transform duration-300 ${showFilters ? "translate-x-0" : "translate-x-full"}`}
          role="dialog" aria-label="Фильтры"
        >
          <div className="sticky top-0 z-10 flex items-center justify-between p-3 border-b border-[var(--border)] bg-[color:var(--background)]/90 backdrop-blur">
            <div className="font-semibold">Фильтры</div>
            <button
              onClick={() => setShowFilters(false)}
              className="grid place-items-center size-9 rounded-xl border border-[var(--border)] bg-[var(--secondary)] hover:opacity-90"
              aria-label="Закрыть фильтры"
            >
              <FiX />
            </button>
          </div>

          <div className="p-4">{FiltersPanel}</div>

          {/* sticky footer */}
          <div className="sticky bottom-0 p-3 bg-[color:var(--background)]/90 backdrop-blur border-t border-[var(--border)] flex gap-2">
            <button
              onClick={applyNow}
              className="flex-1 px-3 py-2 rounded-xl text-sm font-semibold bg-[var(--accent)] text-white shadow hover:opacity-95"
            >
              Применить
            </button>
            <button
              onClick={clearAll}
              className="px-3 py-2 rounded-xl text-sm border border-[var(--border)] bg-[var(--secondary)] hover:bg-[color:var(--secondary)]/80"
            >
              Сбросить
            </button>
          </div>
        </div>
      </div>
    </main>
  );
}

/* ========================= Мелкие UI блоки ========================= */
function Section({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <div>
      <div className="mb-2 font-semibold text-sm tracking-wide text-[color:var(--foreground)]/85">{title}</div>
      {children}
    </div>
  );
}
function MultiToggle({ items, values, onToggle, size = "sm" }:{
  items:{v:string;label:string}[]; values:string[]; onToggle:(v:string)=>void; size?:"xs"|"sm";
}) {
  const clsBase = (size==="xs"?"px-2 py-1 text-xs":"px-3 py-1.5 text-sm")+" rounded-xl border transition";
  return (
    <div className="flex flex-wrap gap-2">
      {items.map((it)=> {
        const active = values.includes(it.v);
        return (
          <button key={it.v} onClick={()=>onToggle(it.v)}
            className={clsBase+" "+(active
              ? "bg-[var(--accent)] text-white border-transparent shadow"
              : "bg-[var(--secondary)] border-[var(--border)] hover:bg-[var(--secondary)]/80")}>
            {it.label}
          </button>
        );
      })}
    </div>
  );
}
function YearsPresets({ years, onPick }:{ years:[number,number]|null; onPick:(rng:[number,number])=>void }) {
  const presets:[number,number][] = [[1980,1999],[2000,2009],[2010,2019],[2020,2025]];
  return (
    <div className="flex flex-wrap items-center gap-2">
      {presets.map(([a,b])=>{
        const act = years?.[0]===a && years?.[1]===b;
        return (
          <button key={`${a}-${b}`} onClick={()=>onPick([a,b])}
            className={"px-2.5 py-1 rounded-lg text-xs border transition " +
              (act ? "bg-[var(--accent)] text-white border-transparent shadow"
                   : "bg-[var(--secondary)] border-[var(--border)] hover:bg-[var(--secondary)]/80")}>
            {a}–{b}
          </button>
        );
      })}
      {years && <span className="ml-1 text-xs opacity-70">Повторно нажми по активному пресету — сбросится сверху</span>}
    </div>
  );
}
