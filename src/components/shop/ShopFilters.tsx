// src/components/shop/ShopFilters.tsx
"use client";

import * as React from "react";
import { usePathname, useRouter, useSearchParams } from "next/navigation";

const TYPES = [
  { value: "",              label: "Все типы" },
  { value: "avatar_static", label: "Аватар" },
  { value: "avatar_anim",   label: "Аватар (аним.)" },
  { value: "avatar_frame",  label: "Рамка" },
  { value: "header_anim",   label: "Шапка (аним.)" },
  { value: "theme",         label: "Тема" },
] as const;

const RARITIES = [
  { value: "",        label: "Любая редкость" },
  { value: "common",  label: "Обычный" },
  { value: "rare",    label: "Редкий" },
  { value: "epic",    label: "Эпический" },
  { value: "legend",  label: "Легендарный" },
] as const;

export default function ShopFilters() {
  const router = useRouter();
  const pathname = usePathname();
  const sp = useSearchParams();

  const [q, setQ] = React.useState(sp.get("q") || "");
  const [type, setType] = React.useState(sp.get("type") || "");
  const [rarity, setRarity] = React.useState(sp.get("rarity") || "");
  const [onlyAnim, setOnlyAnim] = React.useState(sp.get("anim") === "1");

  // sync URL on change (debounce for search)
  React.useEffect(() => {
    const t = setTimeout(() => {
      const next = new URLSearchParams(sp.toString());
      q ? next.set("q", q) : next.delete("q");
      type ? next.set("type", type) : next.delete("type");
      rarity ? next.set("rarity", rarity) : next.delete("rarity");
      onlyAnim ? next.set("anim", "1") : next.delete("anim");
      router.replace(`${pathname}?${next.toString()}`, { scroll: false });
    }, 200);
    return () => clearTimeout(t);
  }, [q, type, rarity, onlyAnim, pathname, router, sp]);

  return (
    <div className="flex flex-wrap items-center gap-2">
      <input
        className="h-9 min-w-[220px] rounded-lg border border-white/15 bg-white/5 px-3 text-sm placeholder-white/50 outline-none focus:ring-2 focus:ring-indigo-400"
        placeholder="Поиск…"
        value={q}
        onChange={(e) => setQ(e.target.value)}
      />
      <select
        className="h-9 rounded-lg border border-white/15 bg-white/5 px-2 text-sm"
        value={type}
        onChange={(e) => setType(e.target.value)}
        title="Тип"
      >
        {TYPES.map(t => <option key={t.value} value={t.value}>{t.label}</option>)}
      </select>
      <select
        className="h-9 rounded-lg border border-white/15 bg-white/5 px-2 text-sm"
        value={rarity}
        onChange={(e) => setRarity(e.target.value)}
        title="Редкость"
      >
        {RARITIES.map(r => <option key={r.value} value={r.value}>{r.label}</option>)}
      </select>
      <label className="inline-flex items-center gap-2 text-sm">
        <input
          type="checkbox"
          className="size-4 rounded border-white/20 bg-white/5"
          checked={onlyAnim}
          onChange={(e) => setOnlyAnim(e.target.checked)}
        />
        Только анимированные
      </label>
    </div>
  );
}
