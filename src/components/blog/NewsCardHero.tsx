import Link from "next/link";
import Badge from "@/components/ui/Badge";
import type { Category, Tag } from "@/types/blog";
import { formatDateTime, isFresh36h } from "@/lib/date";

export default function NewsCardHero(props: {
  href: string;
  title: string;
  excerpt?: string | null;
  poster?: string | null;
  pinned?: boolean;
  date?: string | null;
  categories: Category[];
  tags: Tag[];
}) {
  const { href, title, excerpt, poster, pinned, date, categories, tags } = props;
  const fresh = isFresh36h(date);

  return (
    <article className="relative overflow-hidden rounded-2xl border border-[var(--border)] bg-[color:var(--card)]">
      {/* Media */}
      <Link href={href} className="block relative">
        {/* eslint-disable-next-line @next/next/no-img-element */}
        {poster ? (
          <img
            src={poster}
            alt={title}
            className="aspect-[16/7] w-full object-cover"
            loading="lazy"
          />
        ) : (
          <div className="aspect-[16/7] w-full bg-[color:var(--secondary)]" />
        )}

        {/* лёгкий градиент вниз для читаемости заголовка на постере */}
        <div className="pointer-events-none absolute inset-0 bg-gradient-to-t from-black/50 via-black/10 to-transparent" />
      </Link>

      {/* Content overlay (на больших — на постере, на малых — под) */}
      <div className="p-5 sm:p-6 lg:p-7">
        <div className="flex flex-wrap gap-2 items-center mb-3">
          {pinned && <Badge tone="accent">Закреплено</Badge>}
          {date && <Badge>{formatDateTime(date)}</Badge>}
          {fresh && (
            <Badge tone="success" className="inline-flex items-center gap-1">
              <span aria-hidden="true">✨</span>
              Новое
            </Badge>
          )}
        </div>

        <h2 className="text-2xl sm:text-3xl font-semibold leading-tight">
          <Link href={href} className="link">{title}</Link>
        </h2>

        {excerpt && (
          <p className="mt-3 text-sm sm:text-base opacity-85 max-w-3xl">{excerpt}</p>
        )}

        <div className="mt-4 flex flex-wrap gap-2">
          {categories.slice(0, 3).map((c) => (
            <Badge key={c.id} href={`/news?category=${c.slug}`}>{c.name}</Badge>
          ))}
          {tags.slice(0, 4).map((t) => (
            <Badge key={t.id} href={`/news?tag=${t.slug}`}>#{t.name}</Badge>
          ))}
        </div>
      </div>
    </article>
  );
}
