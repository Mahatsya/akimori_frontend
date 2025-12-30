"use client";

import { useMemo, useState } from "react";
import { signIn, useSession } from "next-auth/react";
import Link from "next/link";
import { promoRedeem, promoValidate, type PromoOut } from "@/lib/promoApi";

function cn(...a: Array<string | false | null | undefined>) {
  return a.filter(Boolean).join(" ");
}

/** -------------------- TOASTS -------------------- */
type ToastType = "success" | "error" | "info";
type Toast = { id: string; type: ToastType; title: string; message?: string };

function uid() {
  return Math.random().toString(36).slice(2) + Date.now().toString(36);
}

function Toasts({ items, onClose }: { items: Toast[]; onClose: (id: string) => void }) {
  return (
    <div className="fixed right-4 top-4 z-[9999] flex flex-col gap-2 w-[min(420px,calc(100vw-2rem))]">
      {items.map((t) => (
        <div
          key={t.id}
          className={cn(
            "rounded-2xl border px-4 py-3 backdrop-blur bg-[color:var(--background)]/70 shadow-lg",
            t.type === "success" && "border-emerald-500/30",
            t.type === "error" && "border-red-500/30",
            t.type === "info" && "border-white/10"
          )}
        >
          <div className="flex items-start justify-between gap-3">
            <div>
              <div
                className={cn(
                  "text-sm font-semibold",
                  t.type === "success" && "text-emerald-200",
                  t.type === "error" && "text-red-200",
                  t.type === "info" && "text-white"
                )}
              >
                {t.title}
              </div>
              {t.message && <div className="text-xs opacity-80 mt-1 whitespace-pre-wrap">{t.message}</div>}
            </div>
            <button
              onClick={() => onClose(t.id)}
              className="shrink-0 rounded-full border border-[var(--border)] px-2 py-1 text-xs opacity-80 hover:opacity-100 hover:bg-[color:var(--secondary)] transition"
              aria-label="Close"
              title="Закрыть"
            >
              ✕
            </button>
          </div>
        </div>
      ))}
    </div>
  );
}
/** ------------------------------------------------ */

function EffectBadge({ promo }: { promo: PromoOut }) {
  const t = promo.effect?.type || "none";
  const map: Record<string, { label: string; cls: string }> = {
    balance_bonus: { label: "Бонус на баланс", cls: "bg-emerald-500/10 text-emerald-300 border-emerald-500/30" },
    item_grant: { label: "Подарок предмета", cls: "bg-sky-500/10 text-sky-300 border-sky-500/30" },
    none: { label: "Без эффекта", cls: "bg-white/5 text-white/70 border-white/10" },
  };
  const m = map[t] || map.none;
  return <span className={cn("inline-flex items-center px-2 py-0.5 rounded-full border text-[11px]", m.cls)}>{m.label}</span>;
}

function humanError(code: string) {
  const m: Record<string, string> = {
    auth_required: "Нужен вход в аккаунт.",
    promo_not_found: "Промокод не найден.",
    promo_inactive: "Промокод отключён.",
    promo_expired_or_not_started: "Промокод ещё не начался или уже закончился.",
    promo_limit_reached: "Лимит использования промокода исчерпан.",
    already_redeemed: "Вы уже использовали этот промокод.",
    promo_has_no_effect: "У промокода нет эффекта.",
    invalid_promo: "Некорректный промокод.",
    request_failed: "Ошибка запроса.",
  };
  return m[code] || "Ошибка. Попробуйте ещё раз.";
}

export default function PromoPageClient() {
  const { status } = useSession();

  const [code, setCode] = useState("");
  const [promo, setPromo] = useState<PromoOut | null>(null);
  const [loading, setLoading] = useState<null | "validate" | "redeem">(null);

  const [toasts, setToasts] = useState<Toast[]>([]);
  function notify(type: ToastType, title: string, message?: string) {
    const id = uid();
    setToasts((prev) => [{ id, type, title, message }, ...prev].slice(0, 4));
    window.setTimeout(() => setToasts((prev) => prev.filter((x) => x.id !== id)), 4500);
  }
  function closeToast(id: string) {
    setToasts((prev) => prev.filter((x) => x.id !== id));
  }

  const normalizedCode = useMemo(() => code.trim().toUpperCase(), [code]);

  async function onValidate() {
    setLoading("validate");
    try {
      const p = await promoValidate(normalizedCode);
      setPromo(p);
      notify("success", "Промокод активен", `Код: ${p.code}`);
    } catch (e: any) {
      setPromo(null);
      notify("error", "Не удалось проверить", humanError(e?.code || e?.message || "request_failed"));
    } finally {
      setLoading(null);
    }
  }

  async function onRedeem() {
    setLoading("redeem");
    try {
      const r = await promoRedeem(normalizedCode);

      // Успешная активация — перезапросим validate, чтобы обновить uses_count/эффект
      try {
        const p = await promoValidate(normalizedCode);
        setPromo(p);
      } catch {}

      const type = r?.payload?.type;
      if (type === "balance_bonus") {
        notify("success", "Начислено на баланс", `+${r.payload.amount_minor} ${r.payload.currency}`);
      } else if (type === "item_grant") {
        notify("success", "Подарок получен", `Предмет ID: ${r.payload.item_id}`);
      } else {
        notify("success", "Промокод применён", "Готово ✅");
      }
    } catch (e: any) {
      notify("error", "Ошибка активации", humanError(e?.code || e?.message || "request_failed"));
    } finally {
      setLoading(null);
    }
  }

  if (status === "loading") {
    return (
      <main className="max-w-4xl mx-auto px-4 py-10">
        <div className="h-8 w-56 rounded bg-[color:var(--secondary)] animate-pulse mb-6" />
        <div className="h-72 rounded-3xl bg-[color:var(--secondary)] animate-pulse" />
      </main>
    );
  }

  // ✅ FIX: не проверяем access/backendTokens вообще. Достаточно NextAuth authenticated.
  if (status !== "authenticated") {
    return (
      <main className="max-w-3xl mx-auto px-4 py-12 text-center">
        <h1 className="text-2xl font-semibold mb-3">Промокоды</h1>
        <p className="text-sm opacity-75 mb-6">Войдите, чтобы активировать промокод.</p>
        <button
          onClick={() => signIn(undefined, { callbackUrl: "/promo" })}
          className="px-5 py-2.5 rounded-full bg-[var(--accent)] text-[var(--accent-foreground)] text-sm font-medium hover:opacity-95 transition"
        >
          Войти
        </button>
      </main>
    );
  }

  return (
    <main className="max-w-4xl mx-auto px-4 py-8 space-y-6">
      <Toasts items={toasts} onClose={closeToast} />

      <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-2xl font-semibold">Промокоды</h1>
          <p className="text-sm opacity-70">Активируйте бонус или получите предмет.</p>
        </div>
        <div className="flex gap-2">
          <Link
            href="/wallet"
            className="inline-flex items-center justify-center px-4 py-2 rounded-full border border-[var(--border)] text-sm hover:bg-[color:var(--secondary)] transition"
          >
            ← К кошельку
          </Link>
        </div>
      </div>

      <section className="rounded-3xl border border-[var(--border)] bg-[color:var(--secondary)]/40 p-5 sm:p-6 space-y-4">
        <div className="grid gap-3 sm:grid-cols-3">
          <div className="sm:col-span-3">
            <label className="text-xs opacity-70">Промокод</label>
            <input
              value={code}
              onChange={(e) => setCode(e.target.value)}
              placeholder="NY2026"
              className="mt-1 w-full rounded-2xl border border-[var(--border)] bg-[color:var(--background)]/60 px-4 py-3 text-sm outline-none focus:border-[var(--accent)]"
            />
          </div>
        </div>

        <div className="flex flex-wrap gap-2">
          <button
            onClick={onValidate}
            disabled={!normalizedCode || !!loading}
            className="px-4 py-2 rounded-full border border-[var(--border)] text-sm hover:bg-[color:var(--secondary)] transition disabled:opacity-50"
          >
            {loading === "validate" ? "Проверяю..." : "Проверить"}
          </button>

          <button
            onClick={onRedeem}
            disabled={!normalizedCode || !!loading}
            className="px-4 py-2 rounded-full bg-[var(--accent)] text-[var(--accent-foreground)] text-sm font-medium hover:opacity-95 transition disabled:opacity-50"
          >
            {loading === "redeem" ? "Активирую..." : "Активировать"}
          </button>
        </div>
      </section>

      {promo && (
        <section className="rounded-3xl border border-[var(--border)] bg-[color:var(--secondary)]/30 p-5 sm:p-6 space-y-3">
          <div className="flex items-center justify-between gap-3 flex-wrap">
            <div className="text-sm">
              <div className="text-xs opacity-70">Промокод</div>
              <div className="font-semibold">{promo.code}</div>
            </div>
            <EffectBadge promo={promo} />
          </div>

          <div className="grid gap-2 sm:grid-cols-2 text-sm">
            <div className="rounded-2xl border border-[var(--border)] bg-[color:var(--background)]/50 p-4">
              <div className="text-xs opacity-70">Окно действия</div>
              <div className="mt-1">
                {new Date(promo.starts_at).toLocaleString("ru-RU")} →{" "}
                {new Date(promo.ends_at).toLocaleString("ru-RU")}
              </div>
            </div>
            <div className="rounded-2xl border border-[var(--border)] bg-[color:var(--background)]/50 p-4">
              <div className="text-xs opacity-70">Лимиты</div>
              <div className="mt-1">
                Использовано: <b>{promo.uses_count}</b> / {promo.max_total_uses} • На пользователя: {promo.max_uses_per_user}
              </div>
            </div>
          </div>
        </section>
      )}
    </main>
  );
}
