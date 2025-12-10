export type FilterExpr = { field: string; op: string; value: any };
export type SortExpr = { field: "shiki"|"aired_at"|"year"|"title"; dir: "asc"|"desc" };

export type SearchPayload = {
  filters: FilterExpr[];
  sort?: SortExpr[];
  page?: number;
  page_size?: number;
  facets?: string[];
};

export type Material = {
  kodik_id: string;
  slug: string;
  title: string;
  type: "anime" | "anime-serial" | string;
  year?: number | null;
  poster_url?: string | null;
  updated_at: string;
  shikimori_rating?: number | null;
};

export type SearchResponse = {
  total: number;
  page: number;
  page_size: number;
  items: Material[];
  facets?: {
    genre?: { name: string; count: number }[];
    year?: { year: number; count: number }[];
    type?: { type: string; count: number }[];
  };
};

export async function searchMaterials(payload: SearchPayload, useProxy = true): Promise<SearchResponse> {
  const base = (process.env.API_BASE || "").replace(/\/+$/, "");
  const url = useProxy
    ? "/api/proxy/kodik/materials/search"
    : `${base}/api/kodik/materials/search/`;
  const r = await fetch(url, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    cache: "no-store",
    body: JSON.stringify(payload),
  });
  if (!r.ok) throw new Error(await r.text());
  return r.json();
}
