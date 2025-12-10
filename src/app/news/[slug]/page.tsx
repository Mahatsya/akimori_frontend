import { BlogApi } from "@/lib/blogApi";
import type { Post } from "@/types/blog";
import Link from "next/link";
import { notFound } from "next/navigation";
import { formatDateTime, isFresh36h } from "@/lib/date";
import Badge from "@/components/ui/Badge";

export const dynamic = "force-dynamic";

// Удаляем HTML-теги
function stripTags(input: string): string {
  if (!input) return "";
  return input.replace(/<[^>]*>/g, " ");
}

// Декодируем HTML-сущности (именованные + числовые)
function decodeHtml(input: string): string {
  if (!input) return "";
  const named: Record<string, string> = {
    nbsp: " ",
    amp: "&",
    lt: "<",
    gt: ">",
    quot: '"',
    apos: "'",
    laquo: "«",
    raquo: "»",
    mdash: "—",
    ndash: "–",
    hellip: "…",
    copy: "©",
    reg: "®",
    trade: "™",
    times: "×",
    euro: "€",
    rub: "₽",
  };

  // сначала простые самые частые
  let s = input
    .replace(/&nbsp;/g, " ")
    .replace(/&amp;/g, "&")
    .replace(/&lt;/g, "<")
    .replace(/&gt;/g, ">")
    .replace(/&quot;/g, '"')
    .replace(/&#39;|&apos;/g, "'");

  // именованные сущности общего вида
  s = s.replace(/&([a-zA-Z]+);/g, (_, name: string) => {
    const key = name.toLowerCase();
    return Object.prototype.hasOwnProperty.call(named, key) ? named[key] : `&${name};`;
  });

  // числовые десятичные &#DDD;
  s = s.replace(/&#(\d+);/g, (_, d: string) =>
    String.fromCharCode(parseInt(d, 10))
  );

  // числовые шестнадцатеричные &#xHHH;
  s = s.replace(/&#x([0-9a-fA-F]+);/g, (_, h: string) =>
    String.fromCharCode(parseInt(h, 16))
  );

  // нормализуем пробелы
  return s.replace(/\s{2,}/g, " ").trim();
}

export default async function NewsDetailPage(props: {
  params: Promise<{ slug: string }>;
}) {
  const { slug } = await props.params;

  let post: Post | null = null;
  try {
    post = await BlogApi.get(slug);
  } catch {
    notFound();
  }
  if (!post) notFound();

  const when = post.published_at || post.created_at;
  const fresh = isFresh36h(when);

  // 1) убираем теги, 2) декодируем сущности
  const safeExcerpt = decodeHtml(stripTags(post.excerpt || ""));

  return (
    <main className="mx-auto max-w-4xl p-4 sm:p-6 space-y-6">
      <nav className="text-sm opacity-70">
        <Link href="/news" className="link">Новости</Link>
        <span className="mx-2">/</span>
        <span className="opacity-90">{post.title}</span>
      </nav>

      <header className="space-y-3">
        <h1 className="text-2xl sm:text-3xl font-semibold">{post.title}</h1>

        <div className="flex flex-wrap gap-2">
          {post.pinned && <Badge tone="accent">Закреплено</Badge>}
          <Badge>{formatDateTime(when)}</Badge>
          {fresh && (
            <Badge tone="success" className="inline-flex items-center gap-1">
              <span aria-hidden>✨</span>
              Новое
            </Badge>
          )}
          {(post.categories || []).map((c) => (
            <Badge key={c.id} href={`/news?category=${c.slug}`}>{c.name}</Badge>
          ))}
          {(post.tags || []).map((t) => (
            <Badge key={t.id} href={`/news?tag=${t.slug}`}>#{t.name}</Badge>
          ))}
        </div>

        {safeExcerpt && (
          <p className="text-sm sm:text-base opacity-80">{safeExcerpt}</p>
        )}

        {post.poster && (
          <div className="overflow-hidden rounded-2xl border border-[var(--border)]">
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img
              src={post.poster}
              alt={post.title}
              className="w-full h-auto object-cover"
            />
          </div>
        )}
      </header>

      {post.content_html ? (
        <article
          className="leading-relaxed space-y-4
          [&_h2]:text-xl [&_h2]:mt-6
          [&_h3]:text-lg [&_h3]:mt-5
          [&_a]:text-[color:var(--accent)] hover:[&_a]:underline
          [&_img]:max-w-full [&_img]:h-auto
          [&_table]:w-full [&_table]:border-collapse
          [&_th]:border [&_td]:border
          [&_th]:px-2 [&_td]:px-2
          [&_th]:py-2 [&_td]:py-2
          [&_th]:border-[color:var(--border)]
          [&_td]:border-[color:var(--border)]"
          dangerouslySetInnerHTML={{ __html: post.content_html }}
        />
      ) : (
        <div className="rounded-xl border border-[var(--border)] bg-[color:var(--secondary)]/50 p-4 text-sm opacity-75">
          Контент отсутствует.
        </div>
      )}

      <div className="pt-4">
        <Link
          href="/news"
          className="inline-flex items-center gap-2 rounded-xl border border-[var(--border)] px-4 py-2 hover:bg-white/5 transition"
        >
          ← Ко всем новостям
        </Link>
      </div>
    </main>
  );
}
