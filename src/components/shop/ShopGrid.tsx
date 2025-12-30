"use client";

import Image from "next/image";
import Link from "next/link";
import { useMemo, useState } from "react";
import { useSearchParams } from "next/navigation";
import type { Offer } from "@/lib/shopApi";
import PurchaseModal from "@/components/shop/PurchaseModal";

type Cat = "avatar" | "header" | "avatar_frame" | "theme";
type Price = "" | "cheap" | "expensive";

function median(values: number[]) {
  if (!values.length) return 0;
  const a = [...values].sort((x, y) => x - y);
  const mid = Math.floor(a.length / 2);
  return a.length % 2 ? a[mid] : (a[mid - 1] + a[mid]) / 2;
}

export default function ShopGrid({ offers }: { offers: Offer[] }) {
  const sp = useSearchParams();
  const cat = (sp.get("cat") as Cat) || "avatar";
  const price = (sp.get("price") as Price) || "";

  const [open, setOpen] = useState(false);
  const [selected, setSelected] = useState<Offer | null>(null);

  const prices = useMemo(
    () => offers.map((o) => Number(o.current_price || 0)).filter(Number.isFinite),
    [offers],
  );
  const med = useMemo(() => median(prices), [prices]);

  const filtered = useMemo(() => {
    let list = offers.filter((o) => (o.item?.type || "") === cat);

    if (price) {
      list = list.filter((o) => {
        const p = Number(o.current_price || 0);
        return price === "cheap" ? p <= med : p > med;
      });

      list.sort((a, b) =>
        price === "cheap"
          ? (a.current_price ?? 0) - (b.current_price ?? 0)
          : (b.current_price ?? 0) - (a.current_price ?? 0),
      );
    }

    return list;
  }, [offers, cat, price, med]);

  function openBuy(offer: Offer) {
    setSelected(offer);
    setOpen(true);
  }
  function close() {
    setOpen(false);
    setSelected(null);
  }

  if (filtered.length === 0) {
    return (
      <div className="rounded-2xl border border-[var(--border)] bg-[color:var(--card)]/25 p-6 text-sm opacity-70">
        В этой категории пока нет товаров.
      </div>
    );
  }

  return (
    <>
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-6">
        {filtered.map((o) => (
          <OfferCard key={o.id} offer={o} onBuy={() => openBuy(o)} />
        ))}
      </div>

      <PurchaseModal open={open} offer={selected} onClose={close} />
    </>
  );
}

function OfferCard({ offer, onBuy }: { offer: Offer; onBuy: () => void }) {
  const item = offer.item;
  const preview = item?.preview_url ?? null;
  const isVideo =
    !!(item?.mime?.startsWith("video/") || (preview && preview.endsWith(".webm")));

  return (
    <div className="rounded-2xl border border-[var(--border)] bg-[color:var(--card)]/25 overflow-hidden hover:bg-[color:var(--card)]/35 transition">
      <div className="relative aspect-square bg-[color:var(--secondary)]/40">
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
              sizes="240px"
              className="object-cover"
              unoptimized
            />
          )
        ) : null}

        {!offer.selling_now && (
          <div className="absolute left-3 bottom-3 rounded-full bg-black/60 px-3 py-1 text-xs">
            Недоступно
          </div>
        )}
      </div>

      <div className="p-3">
        <div className="flex items-center justify-between gap-2">
          <div className="min-w-0">
            <div className="truncate text-sm font-semibold">
              {item?.title ?? "Предмет"}
            </div>
            <div className="text-xs opacity-60">{item?.rarity ?? "—"}</div>
          </div>
          <div className="text-sm font-bold whitespace-nowrap">
            {offer.current_price} AKI
          </div>
        </div>

        <div className="mt-3 flex items-center gap-2">
          <button
            onClick={onBuy}
            disabled={!offer.selling_now}
            className="h-9 rounded-xl px-3 text-sm font-medium bg-[var(--accent)] text-[var(--accent-foreground)] hover:opacity-95 disabled:opacity-50"
          >
            Купить
          </button>
        </div>
      </div>
    </div>
  );
}
