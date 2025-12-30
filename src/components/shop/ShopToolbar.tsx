"use client";

import * as React from "react";
import { usePathname, useRouter, useSearchParams } from "next/navigation";

type Cat = "avatar" | "header" | "avatar_frame" | "theme";
type Price = "" | "cheap" | "expensive";

const TABS: { key: Cat; label: string }[] = [
  { key: "avatar", label: "Аватары" },
  { key: "header", label: "Шапки" },
  { key: "avatar_frame", label: "Рамки" },
  { key: "theme", label: "Темы" },
];

export default function ShopToolbar() {
  const router = useRouter();
  const pathname = usePathname();
  const sp = useSearchParams();

  const cat = (sp.get("cat") as Cat) || "avatar";
  const price = (sp.get("price") as Price) || "";

  function setParam(key: string, val?: string) {
    const next = new URLSearchParams(sp.toString());
    if (!val) next.delete(key);
    else next.set(key, val);
    router.replace(`${pathname}?${next.toString()}`, { scroll: false });
  }

  return (
    <div className="flex flex-col gap-3">
      <div className="flex flex-wrap items-center justify-between gap-3">
        {/* Tabs */}
        <div className="flex flex-wrap items-center gap-2">
          {TABS.map((t) => {
            const active = cat === t.key;
            return (
              <button
                key={t.key}
                type="button"
                onClick={() => setParam("cat", t.key)}
                className={
                  "h-9 rounded-full px-4 text-sm border transition " +
                  (active
                    ? "bg-[var(--accent)] text-[var(--accent-foreground)] border-transparent"
                    : "border-[var(--border)] bg-[color:var(--card)]/30 hover:bg-[color:var(--secondary)]/60")
                }
              >
                {t.label}
              </button>
            );
          })}
        </div>

        {/* Price filter */}
        <select
          value={price}
          onChange={(e) => setParam("price", e.target.value || undefined)}
          className="h-9 rounded-full border border-[var(--border)] bg-[color:var(--card)]/30 px-4 text-sm outline-none"
          title="Фильтр по цене"
        >
          <option value="">По умолчанию</option>
          <option value="cheap">Дешевые</option>
          <option value="expensive">Дорогие</option>
        </select>
      </div>
    </div>
  );
}
