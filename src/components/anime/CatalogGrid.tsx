"use client";

import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import qs from "qs";
import ky from "ky";
import Fuse from "fuse.js";
import type { Material } from "@/components/anime/AnimeCard";
import AnimeCard from "@/components/anime/AnimeCard";
import GridHeader from "@/components/anime/GridHeader";
import LoadMoreButton from "@/components/anime/LoadMoreButton";

type Paginated<T> = { count: number; next: string | null; previous: string | null; results: T[] };

export default function CatalogPage({
  initialItems,
  total,
  pageSize,
  baseQuery = {},
  fetchPath = "/api/proxy/kodik/materials",
  fuzzyLocal = true,
  hasFilters = true, // ← просто флаг: есть ли фильтры сбоку
}: {
  initialItems: Material[];
  total: number;
  pageSize: number;
  baseQuery?: Record<string, string | number | undefined>;
  fetchPath?: string;
  fuzzyLocal?: boolean;
  hasFilters?: boolean;
}) {
  const [items, setItems] = useState<Material[]>(initialItems);
  const [page, setPage] = useState<number>(1);
  const [loading, setLoading] = useState(false);
  const [done, setDone] = useState(initialItems.length >= total);
  const [error, setError] = useState<string | null>(null);
  const abortRef = useRef<AbortController | null>(null);

  const totalPages = useMemo(() => Math.max(1, Math.ceil(total / pageSize)), [total, pageSize]);

  const buildQuery = useCallback(
    (p: number) => {
      const q = { page: p, page_size: pageSize, type: "anime,anime-serial", ...baseQuery };
      return qs.stringify(q, { encodeValuesOnly: true });
    },
    [baseQuery, pageSize]
  );

  const http = useMemo(() => ky.create({ timeout: 15000, retry: { limit: 2 } }), []);

  const fetchPage = useCallback(
    async (p: number, replace = false) => {
      if (loading) return;
      if (abortRef.current) abortRef.current.abort();
      const controller = new AbortController();
      abortRef.current = controller;

      setLoading(true);
      setError(null);

      try {
        const url = `${fetchPath}?${buildQuery(p)}`;
        const res = await http.get(url, { signal: controller.signal });
        if (!res.ok) {
          if (res.status === 404 || res.status === 410) {
            setDone(true);
            return;
          }
          throw new Error(`${res.status} ${res.statusText}`);
        }

        const data: Paginated<Material> | Material[] = await res.json();
        const chunk = Array.isArray(data) ? data : data.results ?? [];

        setItems((prev) => (replace ? chunk : [...prev, ...chunk]));
        setPage(p);
        setDone(Array.isArray(data) ? (replace ? chunk.length >= total : items.length + chunk.length >= total) : !data.next);
      } catch (e: any) {
        if (e?.name !== "AbortError") setError(e?.message ?? "Fetch error");
      } finally {
        setLoading(false);
      }
    },
    [buildQuery, fetchPath, http, loading, total, items.length]
  );

  useEffect(() => {
    setDone(false);
    fetchPage(1, true);
  }, [JSON.stringify(baseQuery)]); // eslint-disable-line react-hooks/exhaustive-deps

  const viewItems = useMemo(() => {
    const q = (baseQuery.q as string | undefined)?.trim();
    if (!fuzzyLocal || !q) return items;
    const fuse = new Fuse(items, {
      keys: ["title", "title_orig"],
      threshold: 0.35,
      ignoreLocation: true,
      minMatchCharLength: 2,
    });
    return fuse.search(q).map((x) => x.item);
  }, [items, baseQuery, fuzzyLocal]);

  return (
    <main className="min-h-screen">
      <div className="max-w-7xl mx-auto px-4 md:px-6 py-8 md:py-10">
        <h1 className="text-3xl md:text-4xl font-extrabold tracking-tight mb-4">
          Каталог аниме.
        </h1>

        <GridHeader total={total} page={page} totalPages={totalPages} />

        {viewItems.length === 0 ? (
          <div className="rounded-3xl border border-[var(--border)] bg-[color:var(--card)] backdrop-blur-xl p-8 text-[color:var(--foreground)/0.7]">
            Ничего не найдено.
          </div>
        ) : (
          <div
            className={`grid gap-5 transition-all ${
              hasFilters
                ? "grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-4 2xl:grid-cols-4"
                : "grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6 2xl:grid-cols-6"
            }`}
          >
            {viewItems.map((m, idx) => (
              <AnimeCard key={`${m.kodik_id}-${idx}`} m={m} priority={idx < 6} />
            ))}
          </div>
        )}

        <LoadMoreButton
          onLoadMore={() => fetchPage(page + 1)}
          loading={loading}
          hasMore={!done}
          nextPage={page + 1}
        />
              
        {error && (
          <p className="mt-3 text-center text-xs text-red-300/90">
            Ошибка загрузки: {error}
          </p>
        )}
      </div>
    </main>
  );
}
