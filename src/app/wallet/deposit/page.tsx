// src/app/wallet/deposit/page.tsx
"use client";

import { Suspense } from "react";
import { useSession, signIn } from "next-auth/react";
import Link from "next/link";

export const dynamic = "force-dynamic";
export const fetchCache = "force-no-store";

/* ================== ВНУТРЕННИЙ КОНТЕНТ ================== */

function DepositContent() {
  const { data: session, status } = useSession();

  const access =
    session && (session as any)?.backendTokens?.access
      ? (session as any).backendTokens.access
      : null;

  if (status === "loading") {
    return (
      <main className="max-w-3xl mx-auto px-4 py-10">
        <div className="h-8 w-48 rounded-full bg-[color:var(--secondary)] animate-pulse mb-6" />
        <div className="h-64 rounded-3xl bg-[color:var(--secondary)] animate-pulse" />
      </main>
    );
  }

  if (status !== "authenticated" || !access) {
    return (
      <main className="max-w-3xl mx-auto px-4 py-12 text-center">
        <h1 className="text-2xl font-semibold mb-3">Пополнение AkiCoin</h1>
        <p className="text-sm opacity-75 mb-6">
          Войдите в аккаунт, чтобы увидеть доступные способы пополнения.
        </p>
        <button
          type="button"
          onClick={() => signIn(undefined, { callbackUrl: "/wallet/deposit" })}
          className="px-5 py-2.5 rounded-full bg-[var(--accent)] text-[var(--accent-foreground)] text-sm font-medium hover:opacity-95 transition"
        >
          Войти
        </button>
      </main>
    );
  }

  return (
    <main className="max-w-4xl mx-auto px-4 py-8 space-y-6">
      {/* Заголовок */}
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-2xl font-semibold">Пополнение AkiCoin</h1>
          <p className="text-sm opacity-75">
            Сейчас пополнение временно отключено. Мы скоро подключим оплату.
          </p>
        </div>
        <Link
          href="/wallet"
          className="text-xs sm:text-sm rounded-full border border-[var(--border)] px-4 py-1.5 hover:bg-[color:var(--secondary)] transition"
        >
          ← К кошельку
        </Link>
      </div>

      {/* Карточка статуса */}
      <section className="relative overflow-hidden rounded-3xl border border-[var(--border)] bg-gradient-to-br from-[var(--background)]/90 via-[var(--secondary)]/95 to-[var(--background)]/95 shadow-[0_18px_45px_rgba(0,0,0,0.4)]">
        <div className="pointer-events-none absolute inset-0 opacity-50 bg-[radial-gradient(circle_at_0%_0%,rgba(251,146,60,0.22),transparent_60%),radial-gradient(circle_at_100%_100%,rgba(59,130,246,0.18),transparent_55%)]" />

        <div className="relative p-6 sm:p-8">
          <div className="flex items-start gap-4">
            <div className="size-11 rounded-2xl border border-[var(--border)] bg-[color:var(--background)]/70 flex items-center justify-center">
              <span className="text-lg">🛠️</span>
            </div>

            <div className="space-y-2">
              <div className="text-xs uppercase tracking-wide opacity-70">
                В разработке
              </div>
              <div className="text-lg font-semibold">
                Пополнение временно недоступно
              </div>
              <p className="text-sm opacity-80 max-w-2xl">
                Мы готовим нормальную систему пополнения AkiCoin.
                Как только подключим платёжные методы — кнопка станет активной.
              </p>

              <div className="pt-3 flex flex-wrap gap-2">
                <Link
                  href="/wallet"
                  className="inline-flex items-center rounded-full border border-[var(--border)] bg-[color:var(--secondary)] px-4 py-2 text-xs hover:bg-[color:var(--secondary)]/80 transition"
                >
                  Вернуться в кошелёк
                </Link>

                <Link
                  href="/feedback"
                  className="inline-flex items-center rounded-full bg-[var(--accent)] px-4 py-2 text-xs font-semibold text-[var(--accent-foreground)] hover:opacity-95 transition"
                >
                  Написать в поддержку
                </Link>
              </div>

              <div className="pt-2 text-[11px] opacity-60">
                Валюта на сайте сейчас: <b>AKI</b>. RUB временно отключены.
              </div>
            </div>
          </div>
        </div>
      </section>
    </main>
  );
}

/* ================== ОБЁРТКА Suspense ================== */

export default function DepositPage() {
  return (
    <Suspense
      fallback={
        <main className="max-w-3xl mx-auto px-4 py-10">
          <div className="h-8 w-48 rounded-full bg-[color:var(--secondary)] animate-pulse mb-6" />
          <div className="h-64 rounded-3xl bg-[color:var(--secondary)] animate-pulse" />
        </main>
      }
    >
      <DepositContent />
    </Suspense>
  );
}
