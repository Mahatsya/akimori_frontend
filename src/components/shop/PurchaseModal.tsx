// src/components/shop/PurchaseModal.tsx
"use client";

import * as React from "react";
import Image from "next/image";
import { useRouter } from "next/navigation";
import type { Offer } from "@/lib/shopApi";
import { purchaseByOfferId } from "@/app/shop/actions";
import { FiX } from "react-icons/fi";


type Props = {
  open: boolean;
  offer: Offer | null;
  onClose: () => void;
};

function cls(...a: Array<string | false | null | undefined>) {
  return a.filter(Boolean).join(" ");
}

function sizeLabel(type?: string | null) {
  switch (type) {
    case "avatar":
      return "1:1 • 512×512";
    case "avatar_frame":
      return "1:1 • рамка";
    case "header":
      return "3:1 • шапка";
    case "theme":
      return "тема • настройки";
    default:
      return "—";
  }
}

export default function PurchaseModal({ open, offer, onClose }: Props) {
  const router = useRouter();

  const [step, setStep] = React.useState<"idle" | "confirm" | "success" | "error">("idle");
  const [busy, setBusy] = React.useState(false);
  const [err, setErr] = React.useState<string | null>(null);

  // Reset when open/offer changes
  React.useEffect(() => {
    if (!open) return;
    setStep("confirm");
    setBusy(false);
    setErr(null);
  }, [open, offer?.id]);

  // ESC closes
  React.useEffect(() => {
    if (!open) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") onClose();
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [open, onClose]);

  // Lock body scroll
  React.useEffect(() => {
    if (!open) return;
    const prev = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    return () => {
      document.body.style.overflow = prev;
    };
  }, [open]);

  async function buy() {
    if (!offer || busy) return;
    if (!offer.selling_now) return;

    setBusy(true);
    setErr(null);

    const res = await purchaseByOfferId(offer.id);

    setBusy(false);
    if (!res.ok) {
      setErr(res.error || "Не удалось выполнить покупку");
      setStep("error");
      return;
    }

    setStep("success");
    // Обновим данные страницы (SSR/Server Components) — удобно для баланса/инвентаря
    router.refresh();
  }

  if (!open || !offer) return null;

  const item = offer.item;
  const title = item?.title || "Предмет";
  const rarity = item?.rarity || "—";
  const type = item?.type || "—";
  const price = offer.current_price ?? 0;

  const preview = item?.preview_url ?? null;
  const isVideo =
    !!(item?.mime?.startsWith("video/") || (preview && preview.endsWith(".webm")));

  const canBuy = !!offer.selling_now && price > 0;

  return (
    <div
      className="fixed inset-0 z-[60] flex items-center justify-center p-4"
      role="dialog"
      aria-modal="true"
      aria-label="Покупка предмета"
    >
      {/* Backdrop */}
      <button
        type="button"
        aria-label="Закрыть"
        onClick={onClose}
        className="absolute inset-0 bg-black/70 backdrop-blur-[2px]"
      />

      {/* Panel */}
      <div
        className={cls(
          "relative w-full max-w-[860px] overflow-hidden rounded-3xl",
          "border border-[var(--border)] bg-[color:var(--background)]/95",
          "shadow-[0_30px_90px_rgba(0,0,0,0.6)]"
        )}
      >
        {/* Top bar */}
        <div className="flex items-center justify-between gap-3 px-5 py-4 border-b border-[var(--border)] bg-[color:var(--card)]/30">
          <div className="min-w-0">
            <div className="text-sm font-semibold truncate">{title}</div>
            <div className="text-xs opacity-70">
              {type} • {rarity} • {sizeLabel(item?.type)}
            </div>
          </div>

            <button
            type="button"
            onClick={onClose}
            className="h-9 w-9 rounded-full border border-[var(--border)] bg-[color:var(--secondary)]/40 hover:bg-[color:var(--secondary)]/70 transition
                        inline-flex items-center justify-center"
            aria-label="Закрыть"
            >
            <span className="flex items-center justify-center">
                <FiX className="h-5 w-5" />
            </span>
            </button>

        </div>

        {/* Body */}
        <div className="grid gap-0 md:grid-cols-[360px_1fr]">
          {/* Preview */}
          <div className="relative bg-[color:var(--secondary)]/35 border-b md:border-b-0 md:border-r border-[var(--border)]">
            <div className="relative aspect-square md:aspect-[4/5]">
              {preview ? (
                isVideo ? (
                  <video
                    src={preview}
                    className="absolute inset-0 h-full w-full object-cover"
                    autoPlay
                    loop
                    muted
                    playsInline
                  />
                ) : (
                  <Image
                    src={preview}
                    alt={title}
                    fill
                    sizes="360px"
                    className="object-cover"
                    unoptimized
                  />
                )
              ) : (
                <div className="absolute inset-0 flex items-center justify-center text-sm opacity-60">
                  Нет превью
                </div>
              )}

              {/* Price pill */}
              <div className="absolute left-4 bottom-4 rounded-full border border-[var(--border)] bg-black/55 px-3 py-1 text-xs">
                <span className="font-semibold">{price}</span> AKI
              </div>

              {/* Availability */}
              {!offer.selling_now && (
                <div className="absolute right-4 top-4 rounded-full bg-black/55 px-3 py-1 text-xs">
                  Недоступно
                </div>
              )}
            </div>
          </div>

          {/* Info + Actions */}
          <div className="p-5 md:p-6">
            {/* Description block */}
            <div className="space-y-3">
              <div className="rounded-2xl border border-[var(--border)] bg-[color:var(--card)]/25 p-4">
                <div className="text-xs font-semibold opacity-80 mb-2">Что вы покупаете</div>
                <ul className="text-sm space-y-1.5 opacity-90">
                  <li className="flex items-center justify-between gap-3">
                    <span className="opacity-70">Название</span>
                    <span className="font-medium truncate">{title}</span>
                  </li>
                  <li className="flex items-center justify-between gap-3">
                    <span className="opacity-70">Категория</span>
                    <span className="font-medium">{type}</span>
                  </li>
                  <li className="flex items-center justify-between gap-3">
                    <span className="opacity-70">Редкость</span>
                    <span className="font-medium">{rarity}</span>
                  </li>
                  <li className="flex items-center justify-between gap-3">
                    <span className="opacity-70">Размер</span>
                    <span className="font-medium">{sizeLabel(item?.type)}</span>
                  </li>
                </ul>
              </div>

              {/* Status messages */}
              {step === "success" && (
                <div className="rounded-2xl border border-emerald-500/40 bg-emerald-500/10 p-4">
                  <div className="text-sm font-semibold text-emerald-200">Покупка успешна</div>
                  <div className="mt-1 text-sm opacity-90">
                    Предмет добавлен в инвентарь. Баланс обновлён.
                  </div>
                </div>
              )}

              {step === "error" && (
                <div className="rounded-2xl border border-red-500/40 bg-red-500/10 p-4">
                  <div className="text-sm font-semibold text-red-200">Не удалось купить</div>
                  <div className="mt-1 text-sm opacity-90">{err || "Ошибка покупки"}</div>
                </div>
              )}

              {canBuy && step !== "success" && (
                <div className="rounded-2xl border border-[var(--border)] bg-[color:var(--secondary)]/30 p-4">
                  <div className="text-xs font-semibold opacity-80 mb-2">Оплата</div>
                  <div className="flex items-center justify-between">
                    <div className="text-sm opacity-80">Списать</div>
                    <div className="text-lg font-bold">{price} AKI</div>
                  </div>
                  <div className="mt-2 text-xs opacity-60">
                    В демо-режиме покупка может зависеть от настроек бэкенда (баланс/разрешения).
                  </div>
                </div>
              )}
            </div>

            {/* Actions */}
            <div className="mt-5 flex flex-col sm:flex-row gap-2 sm:items-center sm:justify-end">
              <button
                type="button"
                onClick={onClose}
                className="h-10 rounded-2xl px-4 text-sm border border-[var(--border)] bg-[color:var(--secondary)]/35 hover:bg-[color:var(--secondary)]/55 transition"
              >
                Закрыть
              </button>

              {step !== "success" && (
                <button
                  type="button"
                  onClick={buy}
                  disabled={!canBuy || busy}
                  className={cls(
                    "h-10 rounded-2xl px-5 text-sm font-semibold transition",
                    "bg-[var(--accent)] text-[var(--accent-foreground)] hover:opacity-95",
                    (!canBuy || busy) && "opacity-60 cursor-not-allowed"
                  )}
                >
                  {busy ? (
                    <span className="inline-flex items-center gap-2">
                      <span className="inline-block size-4 rounded-full border-2 border-[var(--accent-foreground)]/70 border-t-transparent animate-spin" />
                      Покупаем…
                    </span>
                  ) : (
                    "Подтвердить покупку"
                  )}
                </button>
              )}

              {step === "success" && (
                <button
                  type="button"
                  onClick={() => {
                    onClose();
                    // можно вести на инвентарь, если он у тебя есть
                    // router.push("/profile/inventory");
                  }}
                  className="h-10 rounded-2xl px-5 text-sm font-semibold bg-[var(--accent)] text-[var(--accent-foreground)] hover:opacity-95 transition"
                >
                  Готово
                </button>
              )}
            </div>

            {/* Secondary hint */}
            <div className="mt-3 text-[11px] opacity-55">
              Подсказка: клик по фону или клавиша <span className="opacity-80">Esc</span> закрывает окно.
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
