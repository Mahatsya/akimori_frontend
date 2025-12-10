"use client";

import Link from "next/link";
import { useEffect, useMemo } from "react";
import type { Category, Tag } from "@/types/blog";
import { buildQuery } from "@/lib/query";
import { FiFilter, FiSearch, FiFolder, FiTag, FiX, FiChevronDown } from "react-icons/fi";

function usePreline() {
  useEffect(() => {
    if (typeof window === "undefined") return;
    import("preline/dist/preline")
      .then(() => {
        // @ts-ignore
        window?.HSStaticMethods?.autoInit?.();
      })
      .catch(() => {});
  }, []);
}

function hrefWith(base: string, params: Record<string, string | string[] | undefined>) {
  return base + buildQuery(params);
}

export default function FiltersSidebar({
  base = "/news",
  q,
  category,
  tag,
  page_size,
  cats,
  tags,
  total,
}: {
  base?: string;
  q: string;
  category: string;
  tag: string;
  page_size: number;
  cats: Category[];
  tags: Tag[];
  total: number;
}) {
  usePreline();
  const common = useMemo(() => ({ page: "1", page_size: String(page_size) }), [page_size]);

  const card =
    "rounded-3xl border border-[var(--border)] bg-[color:var(--card)]/75 backdrop-blur-xl shadow-[0_10px_40px_-15px_rgba(0,0,0,.25)]";
  const chip =
    "inline-flex items-center gap-2 rounded-full border border-[var(--border)] px-2.5 py-1 text-[11px] transition hover:bg-[color:var(--secondary)]/40 hover:border-[color:var(--accent)]/30 focus:outline-none focus:ring-2 focus:ring-[color:var(--accent)]/30";
  const item =
    "block rounded-xl border border-[var(--border)]/50 hover:border-[color:var(--accent)]/40 hover:bg-[color:var(--secondary)]/30 transition px-2.5 py-2 text-sm";
  const active =
    "border-[color:var(--accent)]/60 bg-transparent ring-1 ring-[color:var(--accent)]/25 text-[color:var(--foreground)]";

  return (
    <aside className="lg:sticky lg:top-24 lg:self-start lg:max-h-[calc(100vh-8rem)] lg:overflow-y-auto thin-scroll">
      <div className="space-y-4">
        {/* Summary */}
        <section className={`${card} p-4`}>
          <div className="flex items-center justify-between">
            <h3 className="font-semibold flex items-center gap-2">
              <span className="inline-grid place-items-center h-7 w-7 rounded-lg bg-[color:var(--secondary)]/60">
                <FiFilter />
              </span>
              Фильтры
            </h3>
            <span className="text-xs opacity-70">
              Найдено: <b>{total}</b>
            </span>
          </div>

          {(q || category || tag) ? (
            <div className="mt-3 flex flex-wrap gap-2">
              {q && (
                <Link className={chip} href={hrefWith(base, { ...common, q: "", category, tag })}>
                  <span className="opacity-70">Поиск:</span>
                  <span className="truncate max-w-[140px]">{q}</span>
                  <FiX className="opacity-80" />
                </Link>
              )}
              {category && (
                <Link className={chip} href={hrefWith(base, { ...common, q, category: "", tag })}>
                  <span className="opacity-70">Категория:</span>
                  <span className="truncate max-w-[140px]">{category}</span>
                  <FiX className="opacity-80" />
                </Link>
              )}
              {tag && (
                <Link className={chip} href={hrefWith(base, { ...common, q, category, tag: "" })}>
                  <span className="opacity-70">Тег:</span>
                  <span className="truncate max-w-[140px]">#{tag}</span>
                  <FiX className="opacity-80" />
                </Link>
              )}
              <Link
                href={hrefWith(base, { ...common, q: "", category: "", tag: "" })}
                className="inline-flex items-center gap-2 rounded-full border border-[var(--border)] px-3 py-1 text-xs hover:bg-[color:var(--secondary)]/40 transition"
              >
                Сбросить всё
              </Link>
            </div>
          ) : (
            <p className="mt-3 text-sm opacity-70">Выберите категорию/тег или выполните поиск.</p>
          )}
        </section>

        {/* Search */}
        <section className={`${card} p-4`}>
          <div className="flex items-center justify-between mb-3">
            <h3 className="font-semibold flex items-center gap-2">
              <span className="inline-grid place-items-center h-7 w-7 rounded-lg bg-[color:var(--secondary)]/60">
                <FiSearch />
              </span>
              Поиск
            </h3>
            {q && (
              <Link href={hrefWith(base, { ...common, q: "", category, tag })} className="text-xs link">
                Сбросить
              </Link>
            )}
          </div>

          <form action={base} className="space-y-2">
            <div className="relative">         
              <input
                type="text"
                name="q"
                defaultValue={q}
                className="input input--with-icon w-full"
                placeholder="Поиск новостей"
                aria-label="Поиск"
              />
              {/* фиксированный «карман» под иконку */}
            </div>
            <input type="hidden" name="category" value={category} />
            <input type="hidden" name="tag" value={tag} />
            <input type="hidden" name="page_size" value={page_size} />
            <button
              className="w-full rounded-xl border border-[var(--border)] px-3 py-2 hover:bg-[color:var(--secondary)]/40 transition focus:outline-none focus:ring-2 focus:ring-[color:var(--accent)]/30"
              type="submit"
            >
              Найти
            </button>
          </form>
        </section>

        {/* Categories — Preline accordion */}
        <section className={`${card} p-2 hs-accordion-group`} data-hs-accordion-always-open>
          <div className="hs-accordion active rounded-xl" id="cat-acc">
            <button
              type="button"
              className="hs-accordion-toggle w-full flex items-center justify-between px-3 py-3 rounded-xl hover:bg-[color:var(--secondary)]/30 transition"
              aria-controls="cat-pane"
            >
              <span className="font-semibold flex items-center gap-2">
                <span className="inline-grid place-items-center h-7 w-7 rounded-lg bg-[color:var(--secondary)]/60">
                  <FiFolder />
                </span>
                Категории
              </span>
              <FiChevronDown className="opacity-70 hs-accordion-active:rotate-180 transition" />
            </button>

            <div id="cat-pane" className="hs-accordion-content w-full px-3 pb-3 pt-0">
              <ul className="space-y-1.5">
                <li>
                  <Link
                    href={hrefWith(base, { ...common, q, category: "", tag })}
                    className={`${item} ${category ? "" : active}`}
                  >
                    Все категории
                  </Link>
                </li>
                {cats.map((c) => (
                  <li key={c.id}>
                    <Link
                      href={hrefWith(base, { ...common, q, category: c.slug, tag })}
                      className={`${item} ${category === c.slug ? active : ""}`}
                    >
                      <div className="flex items-center justify-between gap-3">
                        <span className="truncate">{c.name}</span>
                        {"posts_count" in c && (c as any).posts_count != null && (
                          <span className="text-[10px] rounded-md border border-[var(--border)] px-1.5 py-0.5 opacity-80">
                            {(c as any).posts_count}
                          </span>
                        )}
                      </div>
                    </Link>
                  </li>
                ))}
              </ul>
            </div>
          </div>
        </section>

        {/* Tags */}
        <section className={`${card} p-4`}>
          <div className="flex items-center justify-between">
            <h3 className="font-semibold flex items-center gap-2">
              <span className="inline-grid place-items-center h-7 w-7 rounded-lg bg-[color:var(--secondary)]/60">
                <FiTag />
              </span>
              Теги
            </h3>
            {tag && (
              <Link href={hrefWith(base, { ...common, q, category, tag: "" })} className="text-xs link">
                Сбросить
              </Link>
            )}
          </div>

          <div className="mt-3 flex flex-wrap gap-2">
            <Link
              href={hrefWith(base, { ...common, q, category, tag: "" })}
              className={`px-3 py-1 rounded-full border transition text-xs ${
                tag
                  ? "border-[var(--border)] hover:border-[color:var(--accent)]/30 hover:bg-[color:var(--secondary)]/30"
                  : "border-[color:var(--accent)]/60 bg-transparent ring-1 ring-[color:var(--accent)]/25"
              }`}
            >
              Все теги
            </Link>
            {tags.map((t) => (
              <Link
                key={t.id}
                href={hrefWith(base, { ...common, q, category, tag: t.slug })}
                className={`px-3 py-1 rounded-full border transition text-xs hover:border-[color:var(--accent)]/30 hover:bg-[color:var(--secondary)]/30 ${
                  tag === t.slug
                    ? "border-[color:var(--accent)]/60 bg-transparent ring-1 ring-[color:var(--accent)]/25"
                    : "border-[var(--border)]"
                }`}
                title={`#${t.name}`}
              >
                #{t.name}
              </Link>
            ))}
          </div>
        </section>
      </div>
    </aside>
  );
}
