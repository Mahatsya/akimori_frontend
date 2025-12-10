// src/lib/economyApi.ts
export type Currency = "RUB" | "AKI";

export type Wallet = {
  id: number | string;
  currency: Currency;
  balance: number;           // минорные единицы (у тебя сейчас просто целое)
  balance_display: string;   // строка с бэка, у тебя = balance как строка
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
  wallet: number | string;      // id кошелька
  tx_type: TxType;
  amount: number;               // минорные единицы
  description: string;
  related_tx: string | null;
  idempotency_key: string | null;
  created_at: string;
};

const API_BASE =
  process.env.NEXT_PUBLIC_API_BASE ||
  "http://127.0.0.1:8000";

function apiBaseUrl() {
  return API_BASE.replace(/\/$/, "");
}

/**
 * Список кошельков текущего пользователя.
 */
export async function listMyWallets(
  access: string | null | undefined,
  signal?: AbortSignal
): Promise<Wallet[]> {
  if (!access) return [];

  const r = await fetch(`${apiBaseUrl()}/api/economy/wallets/me/`, {
    method: "GET",
    cache: "no-store",
    credentials: "include",
    signal,
    headers: {
      accept: "application/json",
      Authorization: `Bearer ${access}`,
    },
  });

  if (!r.ok) {
    const body = await r.text().catch(() => "");
    console.error("wallets fetch failed:", r.status, body);
    throw new Error(`wallets fetch failed: ${r.status} ${body}`);
  }

  const data = (await r.json()) as Wallet[] | { results?: Wallet[] };
  return Array.isArray(data) ? data : data.results ?? [];
}

/**
 * Журнал транзакций пользователя.
 * Можно передать currency, page, page_size (если включена пагинация DRF).
 */
export async function listMyTransactions(
  access: string | null | undefined,
  params?: {
    currency?: Currency;
    page?: number;
    page_size?: number;
  },
  signal?: AbortSignal
): Promise<Transaction[]> {
  if (!access) return [];

  const qs = new URLSearchParams();
  if (params?.currency) qs.set("currency", params.currency);
  if (params?.page) qs.set("page", String(params.page));
  if (params?.page_size) qs.set("page_size", String(params.page_size));

  const url = `${apiBaseUrl()}/api/economy/transactions/me/${
    qs.toString() ? `?${qs.toString()}` : ""
  }`;

  const r = await fetch(url, {
    method: "GET",
    cache: "no-store",
    credentials: "include",
    signal,
    headers: {
      accept: "application/json",
      Authorization: `Bearer ${access}`,
    },
  });

  if (!r.ok) {
    const body = await r.text().catch(() => "");
    console.error("transactions fetch failed:", r.status, body);
    throw new Error(`transactions fetch failed: ${r.status} ${body}`);
  }

  const data = (await r.json()) as Transaction[] | { results?: Transaction[] };
  return Array.isArray(data) ? data : data.results ?? [];
}

export function fmtWallet(w: Wallet): string {
  return w.currency === "RUB"
    ? `${w.balance_display} ₽`
    : `${w.balance_display} AKI`;
}
