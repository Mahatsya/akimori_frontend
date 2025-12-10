// app/(catalog)/config/materialFilters.ts
export type UiControl =
  | { kind: "search"; field: "title"; placeholder?: string }
  | { kind: "range";  field: "year" | "shiki"; min?: number; max?: number; step?: number }
  | { kind: "chips";  field: "type" | "genre" | "country"; options?: string[]; facet?: boolean }
  | { kind: "dateRange"; field: "aired_at" }
  ;

export type PageFilterConfig = {
  controls: UiControl[];
  defaultSort?: Array<{ field: "shiki"|"aired_at"|"year"|"title"; dir: "asc"|"desc" }>;
  pageSize?: number;
};

export const animeConfig: PageFilterConfig = {
  controls: [
    { kind: "search", field: "title", placeholder: "Название…" },
    { kind: "range",  field: "year",  min: 1970, max: new Date().getFullYear(), step: 1 },
    { kind: "chips",  field: "type",  options: ["anime", "anime-serial"] },
    { kind: "chips",  field: "genre", facet: true },           // подтянем из facets
    { kind: "dateRange", field: "aired_at" },
    { kind: "range", field: "shiki", min: 0, max: 10, step: 0.1 },
  ],
  defaultSort: [{ field: "shiki", dir: "desc" }, { field: "aired_at", dir: "desc" }],
  pageSize: 30,
};
