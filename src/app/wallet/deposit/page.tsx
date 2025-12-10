// src/app/wallet/deposit/page.tsx
"use client";

import { useState, useMemo, Suspense } from "react";
import { useSession, signIn } from "next-auth/react";
import Link from "next/link";

export const dynamic = "force-dynamic";
export const fetchCache = "force-no-store";

type CurrencyTab = "AKI" | "RUB";

const API_BASE =
  process.env.NEXT_PUBLIC_API_BASE || "http://127.0.0.1:8000";

function apiBaseUrl() {
  return API_BASE.replace(/\/$/, "");
}

type DepositState = "idle" | "loading" | "success" | "error";

/* ================== ВНУТРЕННИЙ КОНТЕНТ СТРАНИЦЫ ================== */

function DepositContent() {
  const { data: session, status } = useSession();

  const access =
    session && (session as any)?.backendTokens?.access
      ? (session as any).backendTokens.access
      : null;

  const [currency, setCurrency] = useState<CurrencyTab>("AKI");
  const [amountStr, setAmountStr] = useState("");
  const [state, setState] = useState<DepositState>("idle");
  const [message, setMessage] = useState<string | null>(null);

  const [txId, setTxId] = useState<string | null>(null);
  const [txCreated, setTxCreated] = useState<string | null>(null);

  const disabled = state === "loading";

  const currentStep = useMemo<1 | 2 | 3>(() => {
    if (state === "success") return 3;
    if (amountStr.trim().length > 0) return 2;
    return 1;
  }, [state, amountStr]);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!access) {
      setMessage("Нет токена авторизации.");
      setState("error");
      return;
    }

    let raw = amountStr.replace(",", ".").trim();
    if (!raw) {
      setMessage("Введите сумму.");
      setState("error");
      return;
    }

    const val = Number(raw);
    if (!Number.isFinite(val) || val <= 0) {
      setMessage("Сумма должна быть положительным числом.");
      setState("error");
      return;
    }

    let amountBackend: number;

    if (currency === "AKI") {
      // AKI — целые коины
      amountBackend = Math.round(val);
      if (amountBackend <= 0) {
        setMessage("Минимум 1 AKI.");
        setState("error");
        return;
      }
    } else {
      // RUB — вводим в рублях, на бэк отправляем в копейках
      amountBackend = Math.round(val * 100);
      if (amountBackend <= 0) {
        setMessage("Минимум 1 копейка.");
        setState("error");
        return;
      }
    }

    setState("loading");
    setMessage(null);
    setTxId(null);
    setTxCreated(null);

    try {
      const url =
        currency === "AKI"
          ? `${apiBaseUrl()}/api/economy/demo/deposit-aki/`
          : `${apiBaseUrl()}/api/economy/demo/deposit-rub/`;

      const r = await fetch(url, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${access}`,
          accept: "application/json",
        },
        body: JSON.stringify({ amount: amountBackend }),
      });

      const data = await r.json().catch(() => ({}));

      if (!r.ok) {
        const detail =
          (data && (data.detail || data.error)) ||
          `Ошибка ${r.status}`;
        setMessage(String(detail));
        setState("error");
        return;
      }

      setState("success");
      setMessage(
        currency === "AKI"
          ? `Баланс AKI успешно пополнен на ${Math.round(
              amountBackend,
            ).toLocaleString("ru-RU")} AKI.`
          : `Баланс RUB успешно пополнен на ${(
              amountBackend / 100
            ).toLocaleString("ru-RU", {
              minimumFractionDigits: 0,
              maximumFractionDigits: 2,
            })} ₽.`,
      );
      setTxId(data.id ?? null);
      setTxCreated(data.created_at ?? null);
      setAmountStr("");
    } catch (e: any) {
      setMessage(e?.message || "Не удалось выполнить запрос.");
      setState("error");
    }
  }

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
        <h1 className="text-2xl font-semibold mb-3">Пополнение кошелька</h1>
        <p className="text-sm opacity-75 mb-6">
          Войдите в аккаунт, чтобы пополнить баланс.
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
          <h1 className="text-2xl font-semibold">Пополнение кошелька</h1>
          <p className="text-sm opacity-75">
            Выберите валюту, введите сумму и подтвердите пополнение.
          </p>
        </div>
        <Link
          href="/wallet"
          className="text-xs sm:text-sm rounded-full border border-[var(--border)] px-4 py-1.5 hover:bg-[color:var(--secondary)] transition"
        >
          ← К кошельку
        </Link>
      </div>

      {/* Основная карточка пополнения */}
      <section className="relative overflow-hidden rounded-3xl border border-[var(--border)] bg-gradient-to-br from-[var(--background)]/90 via-[var(--secondary)]/95 to-[var(--background)]/95 shadow-[0_18px_45px_rgba(0,0,0,0.4)]">
        {/* мягкий фон с «подсветкой» */}
        <div className="pointer-events-none absolute inset-0 opacity-50 bg-[radial-gradient(circle_at_0%_0%,rgba(251,146,60,0.28),transparent_60%),radial-gradient(circle_at_100%_100%,rgba(59,130,246,0.25),transparent_55%)]" />

        <div className="relative p-5 sm:p-7 space-y-6">
          {/* Верхняя часть: табы + steps */}
          <div className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
            {/* Табы валют */}
            <div className="inline-flex rounded-full bg-[color:var(--background)]/60 border border-[var(--border)] p-1 backdrop-blur">
              <button
                type="button"
                onClick={() => {
                  setCurrency("AKI");
                  setState("idle");
                  setMessage(null);
                }}
                className={
                  "px-4 py-1.5 text-xs sm:text-sm rounded-full transition flex items-center gap-1.5 " +
                  (currency === "AKI"
                    ? "bg-[var(--accent)] text-[var(--accent-foreground)] shadow-sm shadow-[var(--accent)]/60"
                    : "text-[color:var(--foreground)]/75 hover:bg-[color:var(--secondary)]/70")
                }
              >
                <span className="inline-block size-2 rounded-full bg-emerald-400 animate-pulse" />
                AkiCoin
              </button>
              <button
                type="button"
                onClick={() => {
                  setCurrency("RUB");
                  setState("idle");
                  setMessage(null);
                }}
                className={
                  "px-4 py-1.5 text-xs sm:text-sm rounded-full transition flex items-center gap-1.5 " +
                  (currency === "RUB"
                    ? "bg-[var(--accent)] text-[var(--accent-foreground)] shadow-sm shadow-[var(--accent)]/60"
                    : "text-[color:var(--foreground)]/75 hover:bg-[color:var(--secondary)]/70")
                }
              >
                <span className="inline-block size-2 rounded-full bg-sky-400" />
                Рубли
              </button>
            </div>

            {/* Step-bar (3 шага) */}
            <div className="flex items-center gap-3 text-[11px] sm:text-xs">
              <StepDot label="Валюта" index={1} current={currentStep} />
              <div className="h-px flex-1 bg-gradient-to-r from-[var(--accent)]/60 via-[var(--accent)]/20 to-transparent" />
              <StepDot label="Сумма" index={2} current={currentStep} />
              <div className="h-px flex-1 bg-gradient-to-r from-[var(--accent)]/20 via-[var(--accent)]/60 to-transparent" />
              <StepDot label="Подтверждение" index={3} current={currentStep} />
            </div>
          </div>

          {/* Описание валюты */}
          <div className="text-xs sm:text-sm opacity-80 max-w-xl">
            {currency === "AKI" ? (
              <p>
                Пополнение баланса{" "}
                <span className="font-semibold">AkiCoin</span>. 1 AKI = 1
                внутриигровая единица. Введите сумму в целых AKI.
              </p>
            ) : (
              <p>
                Пополнение рублёвого кошелька. Введите сумму в рублях — мы
                автоматически переведём её в копейки для бэкенда.
              </p>
            )}
          </div>

          {/* Форма */}
          <form
            onSubmit={handleSubmit}
            className="grid gap-6 lg:grid-cols-[minmax(0,2.2fr)_minmax(0,2.3fr)] lg:items-start"
          >
            {/* Левая колонка: поле суммы + быстрые варианты + CTA */}
            <div className="space-y-4">
              <div>
                <label className="block text-xs uppercase tracking-wide opacity-70 mb-1">
                  Сумма пополнения
                </label>
                <div className="relative group">
                  {/* анимированный контур при фокусе */}
                  <div className="absolute inset-0 rounded-2xl bg-[conic-gradient(from_140deg,rgba(251,146,60,0.15),rgba(56,189,248,0.12),rgba(251,146,60,0.15))] opacity-0 group-focus-within:opacity-100 transition-opacity" />
                  <div className="relative rounded-2xl border border-[var(--border)] bg-[color:var(--background)]/85 px-4 py-3 flex items-center gap-2 shadow-sm shadow-black/30">
                    <span className="text-sm opacity-70 select-none">
                      {currency === "AKI" ? "AKI" : "₽"}
                    </span>
                    <input
                      type="number"
                      min={currency === "AKI" ? 1 : 0.01}
                      step={currency === "AKI" ? 1 : 0.01}
                      value={amountStr}
                      onChange={(e) => setAmountStr(e.target.value)}
                      placeholder={
                        currency === "AKI" ? "Например, 100" : "Например, 250"
                      }
                      className="flex-1 bg-transparent border-none outline-none text-lg sm:text-xl font-semibold text-[var(--foreground)] placeholder:text-[color:var(--foreground)/0.4]"
                    />
                  </div>
                </div>
              </div>

              {/* Быстрые суммы */}
              <div className="space-y-2">
                <p className="text-[11px] uppercase tracking-wide opacity-60">
                  Быстрый выбор суммы
                </p>
                <div className="flex flex-wrap gap-2">
                  {currency === "AKI"
                    ? [50, 100, 250, 500].map((v) => (
                        <button
                          key={v}
                          type="button"
                          onClick={() => setAmountStr(String(v))}
                          className="px-3 py-1.5 rounded-full text-xs border border-[var(--border)] bg-[color:var(--secondary)]/65 hover:bg-[color:var(--secondary)] hover:-translate-y-[1px] transition-transform transition-colors"
                        >
                          {v.toLocaleString("ru-RU")} AKI
                        </button>
                      ))
                    : [100, 250, 500, 1000].map((v) => (
                        <button
                          key={v}
                          type="button"
                          onClick={() => setAmountStr(String(v))}
                          className="px-3 py-1.5 rounded-full text-xs border border-[var(--border)] bg-[color:var(--secondary)]/65 hover:bg-[color:var(--secondary)] hover:-translate-y-[1px] transition-transform transition-colors"
                        >
                          {v.toLocaleString("ru-RU")} ₽
                        </button>
                      ))}
                </div>
              </div>

              {/* Кнопка */}
              <div className="pt-1 space-y-2">
                <button
                  type="submit"
                  disabled={disabled}
                  className="inline-flex items-center justify-center gap-2 rounded-2xl px-6 py-2.5 text-sm font-semibold bg-[var(--accent)] text-[var(--accent-foreground)] shadow-[0_10px_30px_rgba(0,0,0,0.5)] hover:translate-y-[1px] hover:shadow-[0_6px_18px_rgba(0,0,0,0.6)] disabled:opacity-60 disabled:hover:translate-y-0 disabled:hover:shadow-[0_10px_30px_rgba(0,0,0,0.5)] transition-all"
                >
                  {state === "loading" && (
                    <span className="inline-block size-4 border-2 border-[var(--accent-foreground)]/70 border-t-transparent rounded-full animate-spin" />
                  )}
                  {state === "loading"
                    ? "Обрабатываем…"
                    : currency === "AKI"
                    ? "Пополнить AKI"
                    : "Пополнить рубли"}
                </button>

                <p className="text-[11px] opacity-60">
                  DEMO-режим: реальных оплат нет. Запрос идёт на{" "}
                  <code className="px-1 py-0.5 rounded bg-black/40 text-[10px]">
                    /api/economy/demo/deposit-{currency === "AKI" ? "aki" : "rub"}/
                  </code>
                </p>
              </div>
            </div>

            {/* Правая колонка: статус / объяснение */}
            <div className="space-y-4">
              {/* SUCCESS */}
              {state === "success" && (
                <div className="relative overflow-hidden rounded-2xl border border-emerald-500/50 bg-gradient-to-br from-emerald-500/15 via-emerald-500/8 to-emerald-400/10 px-4 py-4 text-sm text-emerald-100 shadow-[0_12px_35px_rgba(16,185,129,0.35)]">
                  {/* световые пятна */}
                  <div className="pointer-events-none absolute -top-10 -right-10 size-24 rounded-full bg-emerald-400/30 blur-2xl animate-pulse" />
                  <div className="pointer-events-none absolute -bottom-10 -left-6 size-24 rounded-full bg-emerald-300/20 blur-2xl animate-pulse" />
                  <div className="relative space-y-2">
                    <div className="flex items-center gap-3">
                      <div className="relative">
                        <div className="size-8 rounded-full bg-emerald-500/90 flex items-center justify-center shadow-lg shadow-emerald-500/60 animate-bounce">
                          <span className="text-xs font-black text-emerald-950">
                            ✓
                          </span>
                        </div>
                        <span className="pointer-events-none absolute inset-0 rounded-full border border-emerald-200/60 animate-[ping_1.4s_ease-out_1]" />
                      </div>
                      <div>
                        <div className="text-xs uppercase tracking-wide text-emerald-200/80">
                          Успешное пополнение
                        </div>
                        <div className="text-sm font-semibold">
                          Баланс обновлён
                        </div>
                      </div>
                    </div>

                    <div className="text-xs sm:text-sm pt-1">
                      {message || "Транзакция выполнена успешно."}
                    </div>

                    {txId && (
                      <div className="mt-2 text-[11px] opacity-85">
                        ID транзакции:{" "}
                        <span className="font-mono break-all">{txId}</span>
                      </div>
                    )}
                    {txCreated && (
                      <div className="text-[11px] opacity-75">
                        Время:{" "}
                        {new Date(txCreated).toLocaleString("ru-RU", {
                          dateStyle: "short",
                          timeStyle: "short",
                        })}
                      </div>
                    )}

                    <div className="pt-2 flex flex-wrap gap-2">
                      <Link
                        href="/wallet"
                        className="inline-flex items-center rounded-full border border-emerald-300/80 px-3 py-1.5 text-[11px] hover:bg-emerald-300/10 transition"
                      >
                        Открыть кошелёк
                      </Link>
                      <button
                        type="button"
                        onClick={() => {
                          setState("idle");
                          setMessage(null);
                        }}
                        className="inline-flex items-center rounded-full border border-emerald-200/40 px-3 py-1.5 text-[11px] hover:bg-emerald-200/5 transition"
                      >
                        Пополнить ещё
                      </button>
                    </div>
                  </div>
                </div>
              )}

              {/* ERROR */}
              {state === "error" && (
                <div className="rounded-2xl border border-red-500/60 bg-red-500/10 px-4 py-3 text-xs sm:text-sm text-red-100 shadow-[0_10px_30px_rgba(239,68,68,0.35)] animate-[pulse_1.1s_ease-in-out_1]">
                  <div className="flex items-center gap-2 mb-1.5">
                    <span className="inline-flex size-6 rounded-full bg-red-500/90 items-center justify-center text-xs text-red-50">
                      !
                    </span>
                    <span className="font-semibold text-red-100">
                      Ошибка пополнения
                    </span>
                  </div>
                  <div>{message || "Что-то пошло не так."}</div>
                </div>
              )}

              {/* IDLE (подсказка) */}
              {state === "idle" && (
                <div className="rounded-2xl border border-[var(--border)]/85 bg-[color:var(--background)]/70 px-4 py-3 text-xs sm:text-sm opacity-85">
                  <div className="font-semibold mb-1.5">
                    Как работает пополнение
                  </div>
                  <ul className="space-y-1.5 list-disc list-inside">
                    <li>Выберите валюту AKI или RUB выше.</li>
                    <li>Введите сумму или используйте быстрые пресеты.</li>
                    <li>
                      Мы отправляем запрос на бэкенд в сервис{" "}
                      <code className="px-1 py-0.5 rounded bg-black/40 text-[10px]">
                        deposit(...)
                      </code>
                      , создаётся транзакция.
                    </li>
                    <li>Историю можно посмотреть на странице кошелька.</li>
                  </ul>
                </div>
              )}
            </div>
          </form>
        </div>
      </section>
    </main>
  );
}

/* ───────── SMALL SUBCOMPONENTS ───────── */

function StepDot({
  label,
  index,
  current,
}: {
  label: string;
  index: 1 | 2 | 3;
  current: 1 | 2 | 3;
}) {
  const active = index <= current;
  return (
    <div className="flex items-center gap-2">
      <div
        className={[
          "flex items-center justify-center rounded-full size-5 text-[10px] font-semibold border transition-all",
          active
            ? "border-[var(--accent)] bg-[var(--accent)]/90 text-[var(--accent-foreground)] shadow-[0_0_0_1px_rgba(0,0,0,0.4)]"
            : "border-[var(--border)] bg-[color:var(--background)]/80 text-[color:var(--foreground)]/70",
        ].join(" ")}
      >
        {index}
      </div>
      <span
        className={
          "whitespace-nowrap transition-colors " +
          (active ? "opacity-90" : "opacity-55")
        }
      >
        {label}
      </span>
    </div>
  );
}

/* ================== ОБЁРТКА ДЛЯ Suspense ================== */

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
