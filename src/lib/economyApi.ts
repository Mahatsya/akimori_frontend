// src/lib/economyApi.ts

export type Currency = "RUB" | "AKI";

export type Wallet = {
  id: number | string;
  currency: Currency;
  balance: number;           // минорные единицы (у тебя сейчас просто целое)
  balance_display: string;   // строка с бэка
  created_at: string;
  updated_at: string;
};

export type TxType =
  | "deposit"
  | "withdraw"
  | "transfer_out"
  | "transfer_in"
  | "adjust";

export type Transaction = {
  id: string;
  wallet: number | string;
  tx_type: TxType;
  amount: number;
  description: string;
  related_tx: string | null;
  idempotency_key: string | null;
  created_at: string;
};

async function bffGet<T>(path: string, signal?: AbortSignal): Promise<T> {
  const r = await fetch(`/api/bff${path}`, {
    method: "GET",
    cache: "no-store",
    signal,
    // на всякий случай (same-origin и так отправляет cookies, но пусть будет явно)
    credentials: "include",
    headers: { accept: "application/json" },
  });

  if (r.status === 401) throw new Error("auth_required");

  if (!r.ok) {
    const body = await r.text().catch(() => "");
    console.error("BFF fetch failed:", r.status, body);
    throw new Error(`bff fetch failed: ${r.status} ${body}`);
  }

  return (await r.json()) as T;
}

/**
 * Список кошельков текущего пользователя.
 * Django: /api/economy/wallets/me/
 */
export async function listMyWallets(signal?: AbortSignal): Promise<Wallet[]> {
  const data = await bffGet<Wallet[] | { results?: Wallet[] }>(
    `/api/economy/wallets/me/`,
    signal
  );
  return Array.isArray(data) ? data : data.results ?? [];
}

/**
 * Журнал транзакций пользователя.
 * Django: /api/economy/transactions/me/
 */
export async function listMyTransactions(
  params?: { currency?: Currency; page?: number; page_size?: number },
  signal?: AbortSignal
): Promise<Transaction[]> {
  const qs = new URLSearchParams();
  if (params?.currency) qs.set("currency", params.currency);
  if (params?.page) qs.set("page", String(params.page));
  if (params?.page_size) qs.set("page_size", String(params.page_size));

  const url = `/api/economy/transactions/me/${qs.toString() ? `?${qs}` : ""}`;

  const data = await bffGet<Transaction[] | { results?: Transaction[] }>(url, signal);
  return Array.isArray(data) ? data : data.results ?? [];
}

export function fmtWallet(w: Wallet): string {
  return w.currency === "RUB"
    ? `${w.balance_display} ₽`
    : `${w.balance_display} AKI`;
}
