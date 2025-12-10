"use client";

import React from "react";
import type { Season } from "@/components/PlayerSection";

export function SeasonSwitcher({
  seasons, activeIndex, onChoose,
}: { seasons: Season[]; activeIndex: number; onChoose: (i: number) => void }) {
  if (seasons.length <= 1) return null;

  return (
    <div className="flex flex-wrap gap-2">
      {seasons.map((s, i) => {
        const active = i === activeIndex;
        return (
          <button
            key={s.id}
            type="button"
            onClick={() => onChoose(i)}
            className={`px-3 py-1.5 rounded-full border text-sm transition ${
              active
                ? "bg-[var(--primary)] text-[var(--primary-foreground)] border-[var(--primary)] shadow"
                : "bg-[color:var(--secondary)] text-[color:var(--foreground)/0.9] border-[var(--border)] hover:opacity-95"
            }`}
          >
            Сезон {s.number || i + 1}
          </button>
        );
      })}
    </div>
  );
}
