import { z } from "zod";
import qs from "qs";
import { isDeepEqual } from "remeda";

// 1) Схема фильтров (то, что понимает твой DRF MaterialFilter)
export const filterSchema = z.object({
  page: z.coerce.number().int().min(1).default(1),
  page_size: z.coerce.number().int().min(1).max(100).default(30),

  type: z.string().optional(),          // "anime,anime-serial"
  anime_status: z.string().optional(),  // "anons,ongoing,released"
  genre: z.string().optional(),         // "боевик,комедия"
  year_from: z.coerce.number().int().optional(),
  year_to: z.coerce.number().int().optional(),
  q: z.string().trim().optional(),
})
.strict();

export type Filters = z.infer<typeof filterSchema>;

// 2) Парсинг из URL
export function parseFilters(search: string): Filters {
  const parsed = qs.parse(search.replace(/^\?/, ""));
  return filterSchema.parse(parsed);
}

// 3) Сборка в querystring — компактно, без пустых значений
export function stringifyFilters(f: Partial<Filters>): string {
  // удаляем пустые/undefined
  const cleaned: Record<string, any> = {};
  for (const [k, v] of Object.entries(f)) {
    if (v === undefined || v === "" || v === null) continue;
    cleaned[k] = v;
  }
  return qs.stringify(cleaned, { encodeValuesOnly: true, addQueryPrefix: true });
}

// 4) Хелпер сравнения — чтобы не дёргать сетевые вызовы без нужды
export function equalFilters(a: Partial<Filters>, b: Partial<Filters>) {
  return isDeepEqual(a, b);
}
