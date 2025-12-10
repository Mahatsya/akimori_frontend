import Link from "next/link";
import { buildQuery } from "@/lib/query";

/**
 * Серверный компонент. Не принимает функции. Сам строит href.
 */
export default function Pagination({
  page,
  pageSize,
  total,
  hrefBase,
  currentSearch,
}: {
  page: number;
  pageSize: number;
  total: number;
  hrefBase: string; // например, "/news"
  currentSearch?: Record<string, string | string[] | undefined>;
}) {
  const pages = Math.max(1, Math.ceil(total / Math.max(1, pageSize)));
  if (pages <= 1) return null;

  const prev = Math.max(1, page - 1);
  const next = Math.min(pages, page + 1);

  const href = (p: number) =>
    hrefBase +
    buildQuery({
      ...(currentSearch || {}),
      page: String(p),
    });

  const around = 2;
  const start = Math.max(1, page - around);
  const end = Math.min(pages, page + around);
  const nums: number[] = [];
  for (let i = start; i <= end; i++) nums.push(i);

  return (
    <nav className="flex items-center justify-between gap-2 pt-2">
      <Link
        href={href(prev)}
        className="rounded-xl border border-[var(--border)] px-3 py-2 hover:bg-white/5 transition aria-disabled:opacity-50"
        aria-disabled={page === 1}
      >
        ← Назад
      </Link>

      <div className="flex items-center gap-2">
        {start > 1 && (
          <>
            <Link
              href={href(1)}
              className="rounded-lg border border-[var(--border)] px-3 py-1 hover:bg-white/5 transition"
            >
              1
            </Link>
            {start > 2 && <span className="px-1 opacity-60">…</span>}
          </>
        )}
        {nums.map((n) => (
          <Link
            key={n}
            href={href(n)}
            className={
              "rounded-lg border px-3 py-1 transition " +
              (n === page
                ? "border-[color:var(--accent)]/50 bg-[color:var(--accent)]/15"
                : "border-[var(--border)] hover:bg-white/5")
            }
            aria-current={n === page ? "page" : undefined}
          >
            {n}
          </Link>
        ))}
        {end < pages && (
          <>
            {end < pages - 1 && <span className="px-1 opacity-60">…</span>}
            <Link
              href={href(pages)}
              className="rounded-lg border border-[var(--border)] px-3 py-1 hover:bg-white/5 transition"
            >
              {pages}
            </Link>
          </>
        )}
      </div>

      <Link
        href={href(next)}
        className="rounded-xl border border-[var(--border)] px-3 py-2 hover:bg-white/5 transition aria-disabled:opacity-50"
        aria-disabled={page === pages}
      >
        Вперёд →
      </Link>
    </nav>
  );
}
