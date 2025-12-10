"use client";

import React, { useEffect, useMemo, useState } from "react";
import type { Episode } from "@/components/PlayerSection";
import { FiPlay } from "react-icons/fi";

type Props = {
  episodes: Episode[];
  currentIndex: number;
  onChoose: (i: number) => void;
  /** стартовое количество отображаемых эпизодов (по умолчанию 50) */
  initialBatch?: number;
  /** шаг «Показать ещё» (по умолчанию 50) */
  step?: number;
};

export function EpisodeGrid({
  episodes,
  currentIndex,
  onChoose,
  initialBatch = 50,
  step = 50,
}: Props) {
  // сколько эпизодов показываем сейчас
  const [visible, setVisible] = useState(() =>
    Math.min(initialBatch, episodes.length)
  );

  // если пришёл новый список — корректируем видимое количество (не меньше initialBatch, не больше длины)
  useEffect(() => {
    setVisible((prev) => {
      const baseline = Math.max(prev, initialBatch);
      return Math.min(baseline, episodes.length);
    });
  }, [episodes.length, initialBatch]);

  // если выбранная серия за пределами видимых — расширим, чтобы была видна
  useEffect(() => {
    if (currentIndex >= 0 && currentIndex >= visible) {
      setVisible((v) =>
        Math.min(episodes.length, Math.ceil((currentIndex + 1) / step) * step)
      );
    }
  }, [currentIndex, visible, episodes.length, step]);

  const hasMore = visible < episodes.length;
  const shown = useMemo(
    () => episodes.slice(0, visible),
    [episodes, visible]
  );

  // Хак: если всего один эпизод и он номер 1 — считаем, что это фильм
  const isSingleMovie =
    episodes.length === 1 && (episodes[0]?.number ?? 1) === 1;

  return (
    <div className="space-y-4">
      <div className="grid sm:grid-cols-2 xl:grid-cols-5 gap-4">
        {shown.map((ep, i) => {
          const cover =
            (ep.screenshots &&
              ep.screenshots.find((s) => typeof s === "string" && s)) ||
            "";
          const active = i === currentIndex;

          return (
            <button
              key={ep.id}
              type="button"
              onClick={() => onChoose(i)}
              className={`group relative h-40 rounded-2xl overflow-hidden text-left border transition transform ${
                active
                  ? "border-[var(--accent)] ring-2 ring-[color:var(--accent)/0.45] shadow-lg"
                  : "border-[var(--border)] hover:-translate-y-[2px] hover:shadow-lg"
              }`}
            >
              <div
                className="absolute inset-0 bg-center bg-cover transition group-hover:scale-[1.02]"
                style={{
                  backgroundImage: cover
                    ? `url(${cover})`
                    : "linear-gradient(135deg, color-mix(in oklab, var(--accent) 18%, transparent), color-mix(in oklab, var(--primary) 18%, transparent))",
                  filter: cover ? "brightness(.9)" : "none",
                }}
              />

              <div className="absolute inset-0 bg-gradient-to-t from-[color:var(--background)/0.75] via-[color:var(--background)/0.25] to-transparent" />

              <div className="absolute inset-0 flex items-center justify-center opacity-0 group-hover:opacity-100 transition">
                <div className="w-10 h-10 rounded-full bg-[var(--primary)] text-[var(--primary-foreground)] grid place-items-center shadow-md">
                  <FiPlay />
                </div>
              </div>

              <div className="absolute left-0 bottom-0 right-0 p-3">
                <div className="text-[var(--foreground)] font-semibold text-lg drop-shadow">
                  {isSingleMovie ? "Фильм" : `Серия ${ep.number}`}
                </div>
                {ep.title ? (
                  <div className="text-[color:var(--foreground)/0.85] text-sm line-clamp-1">
                    {ep.title}
                  </div>
                ) : null}
              </div>

              {active && (
                <span className="absolute top-2 left-2 text-[10px] px-2 py-0.5 rounded-full bg-[var(--accent)]/90 text-[var(--accent-foreground)] border border-[var(--accent)]">
                  Текущая
                </span>
              )}
            </button>
          );
        })}

        {!episodes.length && (
          <div className="text-[color:var(--foreground)/0.7] py-10 col-span-full">
            По запросу эпизоды не найдены
          </div>
        )}
      </div>

      {hasMore && (
        <div className="flex justify-center">
          <button
            type="button"
            onClick={() =>
              setVisible((v) => Math.min(episodes.length, v + step))
            }
            className="px-4 py-2 text-sm rounded-lg border border-[var(--border)] hover:border-[var(--accent)]/60"
          >
            Показать ещё {Math.min(step, episodes.length - visible)}
          </button>
        </div>
      )}
    </div>
  );
}
