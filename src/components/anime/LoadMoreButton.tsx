"use client";
import React, { useEffect, useRef } from "react";

type Props = {
  onLoadMore: () => Promise<void> | void; // функция загрузки следующей страницы
  loading: boolean;                        // сейчас грузим
  hasMore: boolean;                        // есть ещё страницы
  nextPage: number;                        // номер следующей страницы (для подписи)
  autoLoad?: boolean;                      // автоподгрузка при входе в вьюпорт (по умолчанию true)
  onClick?: () => void;   // ← добавили

};

export default function LoadMoreButton({
  onLoadMore,
  loading,
  hasMore,
  nextPage,
  autoLoad = true,
}: Props) {
  const btnRef = useRef<HTMLButtonElement | null>(null);
  const ioRef = useRef<IntersectionObserver | null>(null);

  // автоподгрузка, когда кнопка попадает во вьюпорт
  useEffect(() => {
    if (!autoLoad || !hasMore || loading) return;
    const el = btnRef.current;
    if (!el) return;

    if ("IntersectionObserver" in window) {
      ioRef.current?.disconnect?.();
      const io = new IntersectionObserver(
        (entries) => {
          const e = entries[0];
          if (e && e.isIntersecting && !loading && hasMore) {
            onLoadMore();
          }
        },
        { root: null, rootMargin: "300px", threshold: 0.01 }
      );
      io.observe(el);
      ioRef.current = io;
      return () => io.disconnect();
    }
  }, [autoLoad, hasMore, loading, onLoadMore]);

  const disabled = loading || !hasMore;

  return (
    <div className="mt-6 flex justify-center">
      <button
        ref={btnRef}
        onClick={() => {
          if (!disabled) onLoadMore();
        }}
        disabled={disabled}
        className="inline-flex items-center gap-2 rounded-xl border border-[var(--border)] bg-[color:var(--secondary)] px-4 py-2 text-sm hover:opacity-95 backdrop-blur transition disabled:opacity-40"
        aria-busy={loading}
        aria-disabled={disabled}
      >
        {loading && (
          <svg viewBox="0 0 24 24" className="size-4 animate-spin" aria-hidden="true">
            <circle cx="12" cy="12" r="10" className="stroke-[color:var(--foreground)/0.2]" strokeWidth="4" fill="none" />
            <path d="M22 12a10 10 0 0 1-10 10" className="stroke-[var(--foreground)]" strokeWidth="4" fill="none" />
          </svg>
        )}

        {hasMore ? (loading ? "Загрузка…" : "Показать ещё") : "Больше нет"}

        {hasMore && !loading && (
          <span className="ml-1 inline-flex items-center rounded-lg bg-[color:var(--secondary)] border border-[var(--border)] px-1.5 py-0.5 text-[11px]">
            стр. {nextPage}
          </span>
        )}
      </button>
    </div>
  );
}
