"use client";

import React from "react";
import type { Version } from "@/components/PlayerSection";
import { trName } from "./utils";

export function VersionList({
  versions, activeIndex, onChoose, q, setQ,
}: {
  versions: Version[];
  activeIndex: number;
  onChoose: (i: number) => void;
  q: string;
  setQ: (v: string) => void;
}) {
  return (
    <>
      <div className="sticky top-0 z-10 px-4 py-3 border-b border-[var(--border)] bg-[color:var(--card)]/85 backdrop-blur font-semibold">
        Озвучка
      </div>

      <div className="p-3 border-b border-[var(--border)] bg-[color:var(--secondary)]/50">
        <input
          value={q}
          onChange={(e) => setQ(e.target.value)}
          placeholder="Поиск перевода…"
          className="w-full rounded-lg px-3 py-2 bg-[color:var(--card)] border border-[var(--border)] text-sm outline-none focus:ring-2 focus:ring-[var(--accent)]"
        />
      </div>

      <ul className="px-2 pb-2 max-h-[460px] overflow-auto thin-scroll">
        {versions.map((v, i) => {
          const active = i === activeIndex;
          const label = trName(v);
          const t = v.translation?.type;

          // цветные бейджи
          const badge =
            t === "voice"
              ? "bg-emerald-500/15 text-emerald-400 border-emerald-500/30"
              : t === "subtitles"
                ? "bg-amber-500/15 text-amber-400 border-amber-500/30"
                : "bg-[color:var(--secondary)] text-[color:var(--foreground)] border-[var(--border)]";

          return (
            <li key={v.id}>
              <button
                type="button"
                onClick={() => onChoose(i)}
                className={`w-full text-left px-3 py-2 rounded-xl mb-1 border transition ${
                  active
                    ? "bg-[var(--accent)]/90 border-[var(--accent)] text-[var(--accent-foreground)] shadow-md"
                    : "bg-transparent border-[var(--border)] text-[color:var(--foreground)/0.95] hover:bg-[color:var(--secondary)]/60"
                }`}
              >
                <div className="flex items-center justify-between gap-3">
                  <span className="truncate">{label}</span>
                  {t && (
                    <span
                      className={`ml-2 text-[10px] uppercase px-1.5 py-0.5 rounded border ${badge}`}
                      title={t === "voice" ? "Озвучка" : "Субтитры"}
                    >
                      {t === "voice" ? "Голос" : "Субтитры"}
                    </span>
                  )}
                </div>
              </button>
            </li>
          );
        })}
        {!versions.length && (
          <li className="px-3 py-2 text-[color:var(--foreground)/0.7]">
            Ничего не найдено
          </li>
        )}
      </ul>
    </>
  );
}
