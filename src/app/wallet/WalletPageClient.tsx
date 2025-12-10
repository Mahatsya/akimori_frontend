"use client";

import { useEffect, useMemo, useState } from "react";
import { useSession, signIn } from "next-auth/react";
import Link from "next/link";
import {
  listMyWallets,
  listMyTransactions,
  type Wallet,
  type Transaction,
} from "@/lib/economyApi";

type TxWithWallet = Transaction & {
  walletCurrency?: "RUB" | "AKI";
};

function formatDate(iso: string) {
  const d = new Date(iso);
  if (Number.isNaN(d.getTime())) return iso;
  return d.toLocaleString("ru-RU", {
    dateStyle: "short",
    timeStyle: "short",
  });
}

function formatAmount(amount: number) {
  return amount.toLocaleString("ru-RU");
}

function isIncome(tx: Transaction) {
  return (
    tx.tx_type === "deposit" ||
    tx.tx_type === "transfer_in" ||
    tx.tx_type === "adjust"
  );
}

export default function WalletPageClient() {
  const { data: session, status } = useSession();

  const access =
    session && (session as any)?.backendTokens?.access
      ? (session as any).backendTokens.access
      : null;

  const [wallets, setWallets] = useState<Wallet[] | null>(null);
  const [txs, setTxs] = useState<TxWithWallet[] | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Загрузка кошельков и транзакций
  useEffect(() => {
    if (status === "loading") return;
    if (status !== "authenticated" || !access) {
      setLoading(false);
      return;
    }

    const ctrl = new AbortController();
    setLoading(true);
    setError(null);

    Promise.all([
      listMyWallets(access, ctrl.signal),
      listMyTransactions(access, undefined, ctrl.signal),
    ])
      .then(([ws, ts]) => {
        const walletById = new Map<string | number, Wallet>();
        ws.forEach((w) => walletById.set(w.id, w));

        const enriched: TxWithWallet[] = ts.map((tx) => ({
          ...tx,
          walletCurrency: walletById.get(tx.wallet)?.currency,
        }));

        setWallets(ws);
        setTxs(enriched);
      })
      .catch((e: any) => {
        console.error(e);
        setError(e?.message || "Не удалось загрузить данные кошелька");
      })
      .finally(() => setLoading(false));

    return () => ctrl.abort();
  }, [status, access]);

  const totalAKI = useMemo(
    () =>
      (wallets || [])
        .filter((w) => w.currency === "AKI")
        .reduce((s, w) => s + w.balance, 0),
    [wallets],
  );

  const totalRUB = useMemo(
    () =>
      (wallets || [])
        .filter((w) => w.currency === "RUB")
        .reduce((s, w) => s + w.balance, 0),
    [wallets],
  );

  if (status === "loading") {
    return (
      <main className="max-w-5xl mx-auto px-4 py-8">
        <div className="h-8 w-40 rounded bg-[color:var(--secondary)] animate-pulse mb-6" />
        <div className="grid gap-4 md:grid-cols-3 mb-8">
          <div className="h-32 rounded-xl bg-[color:var(--secondary)] animate-pulse" />
          <div className="h-32 rounded-xl bg-[color:var(--secondary)] animate-pulse" />
          <div className="h-32 rounded-xl bg-[color:var(--secondary)] animate-pulse" />
        </div>
        <div className="h-64 rounded-xl bg-[color:var(--secondary)] animate-pulse" />
      </main>
    );
  }

  if (status !== "authenticated" || !access) {
    return (
      <main className="max-w-2xl mx-auto px-4 py-12 text-center">
        <h1 className="text-2xl font-semibold mb-4">Кошелёк</h1>
        <p className="text-sm opacity-80 mb-6">
          Для просмотра кошелька необходимо войти в аккаунт.
        </p>
        <button
          type="button"
          onClick={() => signIn(undefined, { callbackUrl: "/wallet" })}
          className="px-4 py-2 rounded-full bg-[var(--accent)] text-[var(--accent-foreground)] text-sm hover:opacity-95"
        >
          Войти
        </button>
      </main>
    );
  }

  return (
    <main className="max-w-5xl mx-auto px-4 py-8 space-y-6">
      {/* Заголовок */}
      <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-2xl font-semibold">Кошелёк</h1>
          <p className="text-sm opacity-70">
            Баланс аккаунта и история пополнений / списаний.
          </p>
        </div>
        <div className="flex gap-2">
          <Link
            href="/wallet/deposit"
            className="inline-flex items-center justify-center px-4 py-2 rounded-full bg-[var(--accent)] text-[var(--accent-foreground)] text-sm font-medium hover:opacity-95"
          >
            Пополнить
          </Link>
          <Link
            href="/shop"
            className="inline-flex items-center justify-center px-4 py-2 rounded-full border border-[var(--border)] text-sm hover:bg-[color:var(--secondary)]"
          >
            Магазин
          </Link>
        </div>
      </div>

      {/* Сводка по кошелькам */}
      <section className="grid gap-4 md:grid-cols-3">
        <div className="relative overflow-hidden rounded-2xl border border-[var(--border)] bg-gradient-to-br from-[var(--accent)]/90 via-[var(--accent)] to-amber-500 px-4 py-4 text-white shadow-sm">
          <div className="text-xs opacity-90">Итого по кошелькам</div>
          <div className="mt-1 text-3xl font-extrabold tracking-wide">
            {totalAKI.toLocaleString("ru-RU")} AKI
          </div>
          <div className="mt-1 text-sm opacity-95">
            · {totalRUB.toLocaleString("ru-RU")} ₽
          </div>
          <div className="absolute right-4 bottom-3 text-[10px] opacity-70">
            {wallets?.length ? `${wallets.length} кошелька` : "Кошельков нет"}
          </div>
        </div>

        <div className="rounded-2xl border border-[var(--border)] bg-[color:var(--secondary)]/70 px-4 py-4 flex flex-col justify-between">
          <div className="flex items-center justify-between">
            <div className="text-xs uppercase tracking-wide opacity-70">
              AkiCoin
            </div>
            <span className="inline-flex items-center gap-1 rounded-full bg-emerald-500/10 text-emerald-400 text-[11px] px-2 py-0.5">
              AKI
            </span>
          </div>
          <div className="mt-2 text-2xl font-bold">
            {totalAKI.toLocaleString("ru-RU")}
          </div>
          <div className="mt-1 text-xs opacity-70">
            Внутриигровая валюта для бонусов и фишек.
          </div>
        </div>

        <div className="rounded-2xl border border-[var(--border)] bg-[color:var(--secondary)]/70 px-4 py-4 flex flex-col justify-between">
          <div className="flex items-center justify-between">
            <div className="text-xs uppercase tracking-wide opacity-70">
              Рубли
            </div>
            <span className="inline-flex items-center gap-1 rounded-full bg-sky-500/10 text-sky-400 text-[11px] px-2 py-0.5">
              ₽
            </span>
          </div>
          <div className="mt-2 text-2xl font-bold">
            {totalRUB.toLocaleString("ru-RU")}
          </div>
          <div className="mt-1 text-xs opacity-70">
            Реальный баланс (может конвертироваться в AKI).
          </div>
        </div>
      </section>

      {error && (
        <div className="rounded-xl border border-red-500/40 bg-red-500/5 px-4 py-3 text-sm text-red-200">
          {error}
        </div>
      )}

      <section className="rounded-2xl border border-[var(--border)] bg-[color:var(--secondary)]/40">
        <div className="flex items-center justify-between px-4 py-3 border-b border-[var(--border)]">
          <div>
            <h2 className="text-sm font-semibold">История операций</h2>
            <p className="text-xs opacity-70">
              Пополнения, списания и переводы по всем кошелькам.
            </p>
          </div>
        </div>

        <div className="overflow-x-auto">
          <table className="min-w-full text-sm">
            <thead className="bg-[color:var(--background)]/60 text-xs uppercase tracking-wide">
              <tr>
                <th className="px-4 py-2 text-left">Дата</th>
                <th className="px-4 py-2 text-left">Тип</th>
                <th className="px-4 py-2 text-left">Описание</th>
                <th className="px-4 py-2 text-right">Сумма</th>
                <th className="px-4 py-2 text-right">Валюта</th>
              </tr>
            </thead>
            <tbody>
              {loading && !txs && (
                <tr>
                  <td
                    colSpan={5}
                    className="px-4 py-6 text-center text-xs opacity-70"
                  >
                    Загрузка операций…
                  </td>
                </tr>
              )}

              {!loading && (!txs || txs.length === 0) && (
                <tr>
                  <td
                    colSpan={5}
                    className="px-4 py-6 text-center text-xs opacity-70"
                  >
                    Операций пока нет.
                  </td>
                </tr>
              )}

              {txs?.map((tx) => {
                const income = isIncome(tx);
                const sign = income ? "+" : "-";
                const color = income ? "text-emerald-400" : "text-red-400";
                const currency =
                  tx.walletCurrency === "RUB"
                    ? "₽"
                    : tx.walletCurrency === "AKI"
                    ? "AKI"
                    : "—";

                let label = "";
                switch (tx.tx_type) {
                  case "deposit":
                    label = "Пополнение";
                    break;
                  case "withdraw":
                    label = "Списание";
                    break;
                  case "transfer_in":
                    label = "Перевод входящий";
                    break;
                  case "transfer_out":
                    label = "Перевод исходящий";
                    break;
                  case "adjust":
                    label = "Корректировка";
                    break;
                  default:
                    label = tx.tx_type;
                }

                return (
                  <tr
                    key={tx.id}
                    className="border-t border-[var(--border)]/60 hover:bg-[color:var(--background)]/40"
                  >
                    <td className="px-4 py-2 align-middle whitespace-nowrap">
                      {formatDate(tx.created_at)}
                    </td>
                    <td className="px-4 py-2 align-middle whitespace-nowrap">
                      <span className="inline-flex items-center rounded-full bg-[color:var(--background)]/70 px-2 py-0.5 text-[11px]">
                        {label}
                      </span>
                    </td>
                    <td className="px-4 py-2 align-middle">
                      {tx.description || "—"}
                    </td>
                    <td className="px-4 py-2 align-middle text-right whitespace-nowrap">
                      <span className={color}>
                        {sign}
                        {formatAmount(tx.amount)}
                      </span>
                    </td>
                    <td className="px-4 py-2 align-middle text-right whitespace-nowrap">
                      {currency}
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </section>
    </main>
  );
}
