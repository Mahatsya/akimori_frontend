import Link from "next/link";
import { BlogApi } from "@/lib/blogApi";
import type { Post, Category, Tag } from "@/types/blog";
import FiltersSidebar from "@/components/blog/FiltersSidebar";
import NewsCard from "@/components/blog/NewsCard";
import Pagination from "@/components/ui/Pagination";

function toInt(v: unknown, d = 1) {
  const n = Number(v);
  return Number.isFinite(n) ? n : d;
}

export const dynamic = "force-dynamic";

export default async function NewsListPage(props: {
  searchParams: Promise<Record<string, string | string[] | undefined>>;
}) {
  const sp = await props.searchParams;

  const page = toInt(sp?.page, 1);
  const page_size = toInt(sp?.page_size, 12);
  const q = (sp?.q as string) || "";
  const category = (sp?.category as string) || "";
  const tag = (sp?.tag as string) || "";
  const ordering =
    (sp?.ordering as string) ||
    "-pinned,-published_at,-created_at";

  const [list, cats, tags] = await Promise.all([
    BlogApi.list({
      page,
      page_size,
      q,
      category,
      tag,
      ordering,
      status: "published",
    }),
    BlogApi.categories(),
    BlogApi.tags(),
  ]);


  const total = list.count ?? 0;
  const results = list.results ?? [];

  return (
    <main className="min-h-screen">
      <div className="max-w-7xl mx-auto px-4 md:px-6 py-8 md:py-10 grid grid-cols-12 gap-6">
        {/* CONTENT */}
        <section className="col-span-12 lg:col-span-8 xl:col-span-9 order-1">
          <header className="mb-5 flex items-center justify-between gap-3">
            <div>
              <h1 className="text-3xl md:text-4xl font-extrabold tracking-tight">
                Новости
              </h1>
              <p className="mt-1 text-sm opacity-70">Всего: {total}</p>
            </div>
            <Link
              href="/news"
              className="hidden sm:inline-flex rounded-xl border border-[var(--border)] px-3 py-2 bg-[var(--secondary)] hover:bg-[var(--secondary)]/80 text-sm"
            >
              Сбросить фильтры
            </Link>
          </header>

          {results.length === 0 ? (
            <div className="rounded-3xl border border-[var(--border)] bg-[color:var(--card)]/75 backdrop-blur-xl p-8 text-[color:var(--foreground)/0.7]">
              Ничего не найдено.
            </div>
          ) : (
            <ul className="grid gap-5 md:gap-6 grid-cols-1 sm:grid-cols-2">
              {results.map((p, idx) => (
                <li key={p.id} className={idx === 0 ? "sm:col-span-2" : ""}>
                  <NewsCard
                    href={`/news/${p.slug}`}
                    title={p.title}
                    excerpt={p.excerpt}
                    poster={p.poster}
                    pinned={!!p.pinned}
                    date={p.published_at || p.created_at}
                    categories={p.categories || []}
                    tags={p.tags || []}
                    hero={idx === 0}
                  />
                </li>
              ))}
            </ul>
          )}

          <div className="mt-6">
            <Pagination
              page={page}
              pageSize={page_size}
              total={total}
              hrefBase="/news"
              currentSearch={sp}
            />
          </div>
        </section>

        {/* SIDEBAR */}
        <aside className="col-span-12 lg:col-span-4 xl:col-span-3 lg:order-2">
          <FiltersSidebar
            base="/news"
            q={q}
            category={category}
            tag={tag}
            page_size={page_size}
            cats={cats}
            tags={tags}
            total={total}
          />
        </aside>
      </div>
    </main>
  );
}
