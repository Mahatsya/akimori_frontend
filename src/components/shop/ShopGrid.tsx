// src/components/shop/ShopGrid.tsx
"use client";

import Image from "next/image";
import Link from "next/link";
import { useState } from "react";
import type { Offer } from "@/lib/shopApi";
import { purchaseByOfferId /* , purchaseByItemSlug */ } from "@/app/shop/actions";

export default function ShopGrid({ offers }: { offers: Offer[] }) {
  return (
    <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
      {offers.map((o) => (
        <OfferCard key={o.id} offer={o} />
      ))}
    </div>
  );
}

function OfferCard({ offer }: { offer: Offer }) {
  const item = offer.item;
  const preview = item?.preview_url ?? null;
  const isVideo =
    !!(item?.mime?.startsWith("video/") || (preview && preview.endsWith(".webm")));

  const [busy, setBusy] = useState(false);
  const [err, setErr] = useState<string | null>(null);

  async function buy() {
    if (!offer.selling_now || busy) return;
    setBusy(true);
    setErr(null);

    // Вариант А — по offer_id:
    const res = await purchaseByOfferId(offer.id);

    // Вариант Б — по item_slug:
    // const res = await purchaseByItemSlug(item?.slug ?? "");

    setBusy(false);
    if (!res.ok) {
      setErr(res.error || "Ошибка покупки");
      return;
    }
    // TODO: обновить баланс, показать тост и т.п.
  }

  return (
    <div className="rounded-2xl border border-[var(--border)] bg-[color:var(--card)] overflow-hidden">
      <div className="relative aspect-[4/3] bg-[color:var(--secondary)]">
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
              alt={item?.title ?? ""}
              fill
              sizes="300px"
              className="object-cover"
              unoptimized
            />
          )
        ) : null}
      </div>

      <div className="p-4">
        <div className="flex items-start justify-between gap-3">
          <div className="min-w-0">
            <div className="truncate font-semibold">{item?.title ?? "Предмет"}</div>
            <div className="text-xs text-white/60">
              {item?.rarity ?? "—"} • {item?.type ?? ""}
            </div>
          </div>
          <div className="text-right">
            <div className="font-bold">{offer.current_price} AKI</div>
            {!offer.selling_now && (
              <div className="text-[10px] uppercase text-white/60">Скоро</div>
            )}
          </div>
        </div>

        <div className="mt-3 flex items-center gap-2">
          <button
            onClick={buy}
            disabled={busy || !offer.selling_now}
            className="rounded-xl border border-[var(--primary)] bg-[var(--primary)] px-3 py-1.5 text-sm text-[var(--primary-foreground)] hover:opacity-95 disabled:opacity-50"
          >
            {busy ? "Покупаем..." : "Купить"}
          </button>

          <Link
            href={`/shop/${item?.slug ?? offer.id}`}
            className="rounded-xl border border-[var(--border)] bg-[color:var(--secondary)] px-3 py-1.5 text-sm hover:bg-[color:var(--card)]/60"
          >
            Подробнее
          </Link>

          {err && <span className="text-xs text-red-500">{err}</span>}
        </div>
      </div>
    </div>
  );
}
