export type PromoOut = {
  code: string;
  is_active: boolean;
  starts_at: string;
  ends_at: string;
  max_total_uses: number;
  max_uses_per_user: number;
  uses_count: number;
  effect: { type: "balance_bonus" | "item_grant" | "none"; [k: string]: any };
};

async function apiPost<T>(path: string, body: any): Promise<T> {
  const r = await fetch(path, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(body),
    cache: "no-store",
  });

  if (r.status === 401) {
    const err: any = new Error("auth_required");
    err.code = "auth_required";
    throw err;
  }

  const data = await r.json().catch(() => ({}));
  if (!r.ok) {
    const msg = (data?.detail as string) || "request_failed";
    const err: any = new Error(msg);
    err.code = msg;
    throw err;
  }

  return data as T;
}

export async function promoValidate(code: string) {
  return apiPost<PromoOut>("/api/bff/promo/validate", { code });
}

export async function promoRedeem(code: string) {
  return apiPost<{ ok: boolean; redeemed_at?: string; payload?: any }>(
    "/api/bff/promo/redeem",
    { code }
  );
}
