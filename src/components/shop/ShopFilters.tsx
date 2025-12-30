"use client";

import * as React from "react";
import { usePathname, useRouter, useSearchParams } from "next/navigation";

type PriceFilter = "" | "cheap" | "expensive";

export default function ShopFilters() {
  const router = useRouter();
  const pathname = usePathname();
  const sp = useSearchParams();

  const [price, setPrice] = React.useState<PriceFilter>(
    (sp.get("price") as PriceFilter) || ""
  );

  React.useEffect(() => {
    const next = new URLSearchParams(sp.toString());
    price ? next.set("price", price) : next.delete("price");
    router.replace(`${pathname}?${next.toString()}`, { scroll: false });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [price]);

  return (
    <div className="flex items-center gap-2">
      <button
        type="button"
        onClick={() => setPrice(price === "cheap" ? "" : "cheap")}
        className={
          "h-9 rounded-xl px-4 text-sm border transition " +
          (price === "cheap"
            ? "bg-[var(--accent)] text-[var(--accent-foreground)] border-transparent"
            : "border-[var(--border)] bg-[color:var(--secondary)] hover:bg-[color:var(--secondary)]/80")
        }
      >
        Дешёвое
      </button>

      <button
        type="button"
        onClick={() => setPrice(price === "expensive" ? "" : "expensive")}
        className={
          "h-9 rounded-xl px-4 text-sm border transition " +
          (price === "expensive"
            ? "bg-[var(--accent)] text-[var(--accent-foreground)] border-transparent"
            : "border-[var(--border)] bg-[color:var(--secondary)] hover:bg-[color:var(--secondary)]/80")
        }
      >
        Дорогое
      </button>

      {price && (
        <button
          type="button"
          onClick={() => setPrice("")}
          className="h-9 rounded-xl px-4 text-sm border border-[var(--border)] bg-[color:var(--background)]/30 hover:bg-[color:var(--background)]/45 transition"
          title="Сбросить фильтр"
        >
          Сброс
        </button>
      )}
    </div>
  );
}
