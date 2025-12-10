"use client";

import React from "react";

export function EpisodeFilters({
  q, setQ, total,
}: { q: string; setQ: (v: string) => void; total: number }) {
  return (
    <div className="flex items-center gap-2">
      <input
        value={q}
        onChange={(e) => setQ(e.target.value)}
        placeholder="Поиск эпизода по номеру или названию…"
        className="flex-1 rounded-lg px-3 py-2 bg-[color:var(--secondary)] border border-[var(--border)] text-sm outline-none focus:ring-2 focus:ring-[var(--accent)]"
      />
      {q && (
        <button
          type="button"
          onClick={() => setQ("")}
          className="px-3 py-2 rounded-lg border border-[var(--border)] bg-[color:var(--secondary)] hover:opacity-95 text-sm"
          title="Сбросить"
        >
          Сброс
        </button>
      )}
      <span className="text-xs text-[color:var(--foreground)/0.65]">Найдено: {total}</span>
    </div>
  );
}
