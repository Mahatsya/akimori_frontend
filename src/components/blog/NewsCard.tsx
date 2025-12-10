import Link from "next/link";
import Badge from "@/components/ui/Badge";
import type { Category, Tag } from "@/types/blog";
import { formatDateTime, isFresh36h } from "@/lib/date";
import { FiClock, FiThumbsUp } from "react-icons/fi";

export default function NewsCard({
  href, title, excerpt, poster, pinned, date, categories, tags, hero,
}: {
  href: string;
  title: string;
  excerpt?: string | null;
  poster?: string | null;
  pinned?: boolean;
  date?: string | null;
  categories: Category[];
  tags: Tag[];
  hero?: boolean;
}) {
  const fresh = isFresh36h(date);

  // ---- helpers: strip tags + decode entities ----
  function stripTags(input: string): string {
    if (!input) return "";
    return input.replace(/<[^>]*>/g, " ");
  }

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

    let s = input
      .replace(/&nbsp;/g, " ")
      .replace(/&amp;/g, "&")
      .replace(/&lt;/g, "<")
      .replace(/&gt;/g, ">")
      .replace(/&quot;/g, '"')
      .replace(/&#39;|&apos;/g, "'");

    s = s.replace(/&([a-zA-Z]+);/g, (_, name: string) => {
      const key = name.toLowerCase();
      return Object.prototype.hasOwnProperty.call(named, key) ? named[key] : `&${name};`;
    });

    s = s.replace(/&#(\d+);/g, (_, d: string) => String.fromCharCode(parseInt(d, 10)));
    s = s.replace(/&#x([0-9a-fA-F]+);/g, (_, h: string) => String.fromCharCode(parseInt(h, 16)));

    return s.replace(/\s{2,}/g, " ").trim();
  }

  const safeExcerpt = excerpt ? decodeHtml(stripTags(excerpt)) : "";

  return (
    <article
      className={
        "group overflow-hidden rounded-3xl border border-[var(--border)] " +
        "bg-[color:var(--card)]/75 backdrop-blur-xl " +
        "hover:border-[color:var(--accent)]/40 transition shadow-[0_10px_40px_-15px_rgba(0,0,0,.25)]"
      }
    >
      {/* COVER */}
      {poster ? (
        <Link href={href} className={hero ? "block aspect-[21/9] overflow-hidden" : "block aspect-[16/9] overflow-hidden"}>
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img
            src={poster}
            alt={title}
            className="h-full w-full object-cover transition group-hover:scale-[1.02]"
            loading="lazy"
          />
        </Link>
      ) : (
        <Link
          href={href}
          className={hero ? "block aspect-[21/9] bg-[color:var(--secondary)]" : "block aspect-[16/9] bg-[color:var(--secondary)]"}
          aria-label={title}
        />
      )}

      {/* BODY */}
      <div className={hero ? "p-5 sm:p-6 space-y-3" : "p-4 sm:p-5 space-y-3"}>
        <div className="flex flex-wrap gap-2 items-center">
          {pinned && (
            <Badge tone="accent" className="inline-flex items-center gap-1">
              <FiThumbsUp /> Закреплено
            </Badge>
          )}
          {date && (
            <Badge className="inline-flex items-center gap-1">
              <FiClock className="shrink-0" /> {formatDateTime(date)}
            </Badge>
          )}
          {fresh && (
            <Badge tone="success" className="inline-flex items-center gap-1">
              ✨ Новое
            </Badge>
          )}
        </div>

        <h3 className={hero ? "text-2xl sm:text-3xl font-bold" : "text-lg sm:text-xl font-semibold"}>
          <Link href={href} className="text-[color:var(--foreground)] hover:opacity-90 transition">
            {title}
          </Link>
        </h3>

        {safeExcerpt && (
          <p className={hero ? "text-base opacity-85" : "text-sm opacity-80 line-clamp-3"}>
            {safeExcerpt}
          </p>
        )}

        <div className="flex flex-wrap gap-2 pt-1">
          {categories.slice(0, hero ? 3 : 2).map((c) => (
            <Badge key={c.id} href={`/news?category=${c.slug}`}>{c.name}</Badge>
          ))}
          {tags.slice(0, hero ? 4 : 3).map((t) => (
            <Badge key={t.id} href={`/news?tag=${t.slug}`}>#{t.name}</Badge>
          ))}
        </div>
      </div>
    </article>
  );
}
