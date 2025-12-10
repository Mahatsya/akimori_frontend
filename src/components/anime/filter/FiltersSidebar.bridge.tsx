// src/app/anime/FiltersSidebar.bridge.tsx
"use client";

import FiltersSidebar from "./FiltersSidebar";
import { useRouter, usePathname, useSearchParams } from "next/navigation";
import type { FiltersPayload } from "./FiltersBar";
import { useCallback } from "react";

function buildQuery(p: FiltersPayload, pageSize: number) {
  const q: Record<string, string> = {};
  if (p.types.length) q.type = p.types.join(",");
  if (p.statuses.length) q.anime_status = p.statuses.join(",");
  if (p.genres.length) q.genre = p.genres.join(",");
  if (p.years) { q.year_from = String(p.years[0]); q.year_to = String(p.years[1]); }
  if (p.query?.trim()) q.q = p.query.trim();

  const usp = new URLSearchParams();
  usp.set("page", "1");
  usp.set("page_size", String(pageSize));
  Object.entries(q).forEach(([k, v]) => usp.set(k, v));
  return usp.toString();
}

export default function FiltersSidebarBridge(props: {
  initial?: Partial<FiltersPayload>;
  genreList?: { name: string; source?: string }[];
  minYear?: number;
  maxYear?: number;
  pageSize: number;
}) {
  const router = useRouter();
  const pathname = usePathname() || "/anime";
  const sp = useSearchParams();

  const handleChange = useCallback((p: FiltersPayload) => {
    const next = buildQuery(p, props.pageSize);

    // нормализуем текущий URL
    const curr = new URLSearchParams(sp?.toString() ?? "");
    const currentPageSize = curr.get("page_size") || String(props.pageSize);
    curr.set("page", "1");
    curr.set("page_size", currentPageSize);

    const allowed = new Set(["page","page_size","type","anime_status","genre","year_from","year_to","q"]);
    for (const k of Array.from(curr.keys())) {
      if (!allowed.has(k)) curr.delete(k);
    }

    if (curr.toString() === next) return; // ничего не меняем — избегаем цикла
    router.replace(`${pathname}?${next}`, { scroll: true });
  }, [pathname, router, sp, props.pageSize]);

  return (
    <FiltersSidebar
      initial={props.initial}
      genreList={props.genreList}
      minYear={props.minYear}
      maxYear={props.maxYear}
      onChange={handleChange}
    />
  );
}
