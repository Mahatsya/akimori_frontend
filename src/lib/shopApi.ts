// src/lib/shopApi.ts
import { serverApi } from "@/lib/api";
import { toArray } from "@/lib/paginate";

// 👉 если у тебя уже есть свои типы в "@/types/shop",
// можешь их использовать вместо этих.
import type { InventoryEntry, AppliedCustomization } from "@/types/DB/shop";

/** ----- Типы под сериалайзеры бэка ----- */
export type ItemBrief = {
  id: number;
  slug: string;
  title: string;
  type: string;
  rarity: string;
  is_animated: boolean;
  mime: string | null;
  width: number | null;
  height: number | null;
  duration_ms: number | null;
  price_aki: number | null;
  limited_total: number | null;
  limited_sold: number | null;
  preview_url: string | null; // уже абсолютный URL
};

export type Offer = {
  id: number;
  is_active: boolean;
  price_override_aki: number | null;
  starts_at: string | null;
  ends_at: string | null;
  updated_at: string;
  current_price: number; // вычисляет сервер
  selling_now: boolean;  // вычисляет сервер
  item: ItemBrief | null;
};

/** Нормализация одной записи */
function normalizeOffer(raw: any): Offer {
  const item: ItemBrief | null = raw?.item
    ? {
        id: Number(raw.item.id),
        slug: String(raw.item.slug),
        title: String(raw.item.title ?? ""),
        type: String(raw.item.type ?? ""),
        rarity: String(raw.item.rarity ?? ""),
        is_animated: !!raw.item.is_animated,
        mime: raw.item.mime ?? null,
        width: raw.item.width ?? null,
        height: raw.item.height ?? null,
        duration_ms: raw.item.duration_ms ?? null,
        price_aki: raw.item.price_aki ?? null,
        limited_total: raw.item.limited_total ?? null,
        limited_sold: raw.item.limited_sold ?? null,
        preview_url: raw.item.preview_url ?? null,
      }
    : null;

  return {
    id: Number(raw.id),
    is_active: !!raw.is_active,
    price_override_aki: raw.price_override_aki ?? null,
    starts_at: raw.starts_at ?? null,
    ends_at: raw.ends_at ?? null,
    updated_at: String(raw.updated_at ?? ""),
    current_price: Number(raw.current_price ?? 0),
    selling_now: !!raw.selling_now,
    item,
  };
}

/** Список офферов (поддержка DRF-пагинации) */
export async function getOffers(activeOnly = true): Promise<Offer[]> {
  const api = await serverApi();
  try {
    const res = await api.get("/api/shop/offers/", {
      params: activeOnly ? { active: 1 } : {},
    });

    const list = toArray<any>(res.data);
    const arr = Array.isArray(list)
      ? list
      : Array.isArray((res.data as any)?.results)
      ? (res.data as any).results
      : Array.isArray((res.data as any)?.items)
      ? (res.data as any).items
      : [];

    return arr.map(normalizeOffer);
  } catch (e) {
    console.error("getOffers failed:", e);
    return [];
  }
}

/** Один оффер (по id или item.slug — см. бековый lookup) */
export async function getOffer(slugOrId: string): Promise<Offer | null> {
  const api = await serverApi();
  try {
    const res = await api.get(`/api/shop/offers/${encodeURIComponent(slugOrId)}/`);
    return normalizeOffer(res.data);
  } catch (e: any) {
    if (e?.response?.status === 404) return null;
    console.error("getOffer failed:", e);
    return null;
  }
}

/** Единые константы роутов магазина */
export const SHOP_ROUTES = {
  offers: "/api/shop/offers/",
  purchase: "/api/shop/purchase/",
  // 🔹 новые роуты под инвентарь/кастомизацию
  inventoryMe: "/api/shop/inventory/me/",
  appliedMe: "/api/shop/customization/me/",
};

/** --- МОЙ ИНВЕНТАРЬ --- */
export async function getMyInventory(): Promise<InventoryEntry[]> {
  const api = await serverApi();
  try {
    const res = await api.get(SHOP_ROUTES.inventoryMe);

    // ждём от бекенда либо plain-list, либо DRF results
    const list = toArray<any>(res.data);
    const arr = Array.isArray(list)
      ? list
      : Array.isArray((res.data as any)?.results)
      ? (res.data as any).results
      : [];

    return arr as InventoryEntry[];
  } catch (e) {
    console.error("getMyInventory failed:", e);
    return [];
  }
}

/** --- МОЯ ТЕКУЩАЯ КАСТОМИЗАЦИЯ (аватар/шапка/тема) --- */
export async function getMyApplied(): Promise<AppliedCustomization | null> {
  const api = await serverApi();
  try {
    const res = await api.get(SHOP_ROUTES.appliedMe);
    return res.data as AppliedCustomization;
  } catch (e: any) {
    if (e?.response?.status === 404) {
      // ещё ничего не применено — нормальная ситуация
      return null;
    }
    console.error("getMyApplied failed:", e);
    return null;
  }
}
