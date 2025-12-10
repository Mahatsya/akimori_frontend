// src/app/shop/actions.ts
"use server";

import { serverApi } from "@/lib/api";

const ROUTES = {
  purchase: "/api/shop/purchase/",
};

/** Покупка по item_slug (совместимо с бэком) */
export async function purchaseByItemSlug(itemSlug: string) {
  const api = await serverApi();
  try {
    const r = await api.post(ROUTES.purchase, { item_slug: itemSlug });
    return { ok: true, data: r.data };
  } catch (e: any) {
    const status = e?.response?.status;
    const detail =
      e?.response?.data?.detail ||
      e?.response?.data?.message ||
      e?.message ||
      "Ошибка покупки";
    return { ok: false, status, error: detail };
  }
}

/** Покупка по offer_id (предпочтительно и точнее) */
export async function purchaseByOfferId(offerId: number) {
  const api = await serverApi();
  try {
    const r = await api.post(ROUTES.purchase, { offer_id: offerId });
    return { ok: true, data: r.data };
  } catch (e: any) {
    const status = e?.response?.status;
    const detail =
      e?.response?.data?.detail ||
      e?.response?.data?.message ||
      e?.message ||
      "Ошибка покупки";
    return { ok: false, status, error: detail };
  }
}
