// src/app/anime/page.tsx
import FiltersBarClient from "./page.client";
import type { Material } from "@/components/anime/AnimeCard";
import { http } from "@/lib/http";

export const revalidate = 120;

// --- Жанры ---
async function fetchGenres() {
  const BACKEND = (process.env.API_BASE ?? "http://localhost:8000").replace(
    /\/+$/,
    "",
  );
  const url = `${BACKEND}/api/kodik/materials/genres/?source=shikimori`;
  try {
    const res = await http.get(url).json<any[]>();
    return Array.isArray(res) ? res : [];
  } catch {
    return [];
  }
}

// --- Список материалов ---
async function fetchList(params: Record<string, any>) {
  const BACKEND = (process.env.API_BASE ?? "http://localhost:8000").replace(
    /\/+$/,
    "",
  );
  const url = `${BACKEND}/api/kodik/materials/`;
  try {
    const res = await http.get(url, { searchParams: params }).json<any>();
    if (Array.isArray(res)) {
      return { items: res as Material[], total: res.length };
    }
    return { items: res?.results ?? [], total: res?.count ?? 0 };
  } catch {
    return { items: [], total: 0 };
  }
}

// --- утилита: берём нужные query из URL ---
function baseFromSearchParams(
  sp: Record<string, string | string[] | undefined>,
) {
  const out: Record<string, string> = {};
  if (sp.type) out.type = String(sp.type);
  if (sp.anime_status) out.anime_status = String(sp.anime_status);
  if (sp.genre) out.genre = String(sp.genre);
  if (sp.year_from) out.year_from = String(sp.year_from);
  if (sp.year_to) out.year_to = String(sp.year_to);
  if (sp.q) out.q = String(sp.q);
  return out;
}

export default async function AnimeCatalogPage({
  // ВАЖНО: в Next 15 searchParams — асинхронный
  searchParams,
}: {
  searchParams: Promise<Record<string, string | string[] | undefined>>;
}) {
  const sp = await searchParams;

  const page = Math.max(1, parseInt(String(sp.page ?? "1"), 10));
  const page_size = Math.min(
    100,
    Math.max(1, parseInt(String(sp.page_size ?? "30"), 10)),
  );

  const baseQuery = {
    type: String(sp.type ?? "anime,anime-serial"),
    anime_status: sp.anime_status ? String(sp.anime_status) : undefined,
    genre: sp.genre ? String(sp.genre) : undefined,
    year_from: sp.year_from ? String(sp.year_from) : undefined,
    year_to: sp.year_to ? String(sp.year_to) : undefined,
    q: sp.q ? String(sp.q) : undefined,
  };

  const [genres, list] = await Promise.all([
    fetchGenres(),
    fetchList({ page, page_size, ...baseQuery }),
  ]);

  return (
    <main className="min-h-screen">
      <div className="mx-auto max-w-7xl px-4 md:px-6 py-8 md:py-10">
        <FiltersBarClient
          genres={genres}
          initialBaseQuery={baseFromSearchParams(sp)}
          initialPage={page}
          pageSize={page_size}
          initialItems={list.items}
          total={list.total}
        />
      </div>
    </main>
  );
}
