// src/app/anime/[slug]/page.tsx
export const dynamic = "force-dynamic"; // это перекрывает revalidate
export const revalidate = 120;

import { notFound } from "next/navigation";
import type { Metadata } from "next";
import { auth } from "@/auth";
import { serverApi } from "@/lib/api";

import PlayerSection from "@/components/PlayerSection";
import BookmarkButton from "@/components/BookmarkButton";

import Background from "@/components/anime/detail/Background";
import PosterCard from "@/components/anime/detail/PosterCard";
import InfoCard from "@/components/anime/detail/InfoCard";
import CreditsCard from "@/components/anime/detail/CreditsCard";
import RatingsCard from "@/components/anime/detail/RatingsCard";
import CommentsSection from "@/components/anime/detail/CommentsSection";

import type {
  MaterialDetail,
  Translation,
  MaterialVersion,
  Season,
  Episode,
  Country,
} from "@/types/DB/kodik";

// ───────────────── helpers ─────────────────
type PageProps = { params: Promise<{ slug: string }> };

function pickLinkFromEpisode(e?: Partial<Episode> | null): string | null {
  if (!e) return null;
  const c = [e.link, (e as any)?.iframe, (e as any)?.iframe_src, (e as any)?.url]
    .find((v) => typeof v === "string" && v.length);
  if (!c) return null;
  return (c as string).startsWith("//") ? "https:" + c : (c as string);
}

function normalizeVersions(m: MaterialDetail): MaterialVersion[] {
  if (Array.isArray(m.versions) && m.versions.length) {
    return m.versions.map((v) => {
      const translation: Translation =
        typeof v.translation === "object"
          ? (v.translation as Translation)
          : ({
              id: v.translation,
              ext_id: 0,
              title: "Озвучка",
              type: "voice",
              slug: "unknown",
              poster_url: "",
              avatar_url: "",
              banner_url: "",
              description: "",
              website_url: "",
              aliases: [],
              country: null,
              founded_year: null,
            } as any);
      return { ...v, translation };
    });
  }
  const seasons: Season[] = (m as any).seasons || [];
  if (seasons.length) {
    const original: Translation = {
      id: 0,
      ext_id: 0,
      title: "Оригинал",
      type: "voice",
      slug: "original",
      poster_url: "",
      avatar_url: "",
      banner_url: "",
      description: "",
      website_url: "",
      aliases: [],
      country: null,
      founded_year: null,
    };
    return [
      ({
        id: 0 as any,
        material: m.kodik_id,
        translation: original,
        movie_link: "",
        seasons,
      } as unknown) as MaterialVersion,
    ];
  }
  return [];
}

function firstLink(versions: MaterialVersion[]): string | null {
  for (const v of versions)
    for (const s of (v as any).seasons || [])
      for (const e of (s as any).episodes || []) {
        const l = pickLinkFromEpisode(e);
        if (l) return l;
      }
  return null;
}

// ──────────────── SEO / metadata ────────────────
export async function generateMetadata({ params }: PageProps): Promise<Metadata> {
  const { slug } = await params;
  try {
    const api = await serverApi();
    // ⬇️ proxy + безопасный slug
    const { data: m } = await api.get<MaterialDetail>(
      `/api/kodik/materials/${encodeURIComponent(slug)}/`,
      { headers: { "x-client": "anime-meta" } }
    );

    const poster =
      m.poster_url ||
      m.extra?.poster_url ||
      m.extra?.anime_poster_url ||
      m.extra?.drama_poster_url ||
      undefined;

    const title = m.title + (m.year ? ` (${m.year})` : "");
    const description =
      (m.extra?.description || "")
        .replace(/\s+/g, " ")
        .slice(0, 180) ||
      `${m.title_orig ? m.title_orig + " — " : ""}${(m.genres || [])
        .slice(0, 3)
        .map((g) =>
          typeof g === "object" && g && "name" in g ? (g as any).name : String(g)
        )
        .join(", ")}`;

    return {
      title,
      description,
      openGraph: {
        title,
        description,
        images: poster ? [{ url: poster }] : undefined,
        type: "video.other",
      },
      twitter: {
        card: "summary_large_image",
        title,
        description,
        images: poster ? [poster] : undefined,
      },
    };
  } catch {
    // Не роняем метаданные — пусть останутся дефолтными
    return {};
  }
}

// ──────────────── PAGE (server component) ────────────────
export default async function AnimeDetailPage({ params }: PageProps) {
  const { slug } = await params;
  const api = await serverApi();

  let m: MaterialDetail | null = null;
  try {
    // ⬇️ proxy + безопасный slug
    const resp = await api.get<MaterialDetail>(
      `/api/kodik/materials/${encodeURIComponent(slug)}/`,
      { headers: { "x-client": "anime-detail" } }
    );
    m = resp.data;
  } catch (e: any) {
    const s = e?.response?.status;
    if (s === 404) notFound();
    // Мягкий фолбэк, чтобы не падать 500 на странице
    return (
      <main className="relative min-h-screen bg-transparent text-[var(--foreground)]">
        <div className="mx-auto max-w-3xl px-4 py-16">
          <h1 className="text-2xl font-semibold mb-2">Ошибка загрузки материала</h1>
          <p className="opacity-80">
            Сервер вернул {s || 500}. Попробуйте обновить страницу позже.
          </p>
        </div>
      </main>
    );
  }

  const session = await auth();
  const currentUserId = (session as any)?.user?.id ?? null;
  const isStaff =
    (session as any)?.user?.is_staff === true ||
    (session as any)?.user?.role === "staff" ||
    (session as any)?.user?.isAdmin === true;

  const poster =
    m!.poster_url ||
    m!.extra?.poster_url ||
    m!.extra?.anime_poster_url ||
    m!.extra?.drama_poster_url ||
    null;

  const versions = normalizeVersions(m!);
  const initialLink = firstLink(versions) || "";

  const jsonLd = {
    "@context": "https://schema.org",
    "@type": m!.type === "anime-serial" ? "TVSeries" : "CreativeWork",
    name: m!.title,
    inLanguage: "ru",
    datePublished: m!.year ? `${m!.year}-01-01` : undefined,
    image: poster || undefined,
    genre: (m!.genres || []).map((g) =>
      typeof g === "object" && g && "name" in g ? (g as any).name : String(g)
    ),
    countryOfOrigin: (m!.production_countries || [])
      .map((c) =>
        typeof c === "object" && c ? (c as Country).name : null
      )
      .filter(Boolean),
  };

  return (
    <main className="relative min-h-screen bg-transparent text-[var(--foreground)] selection:bg-[color:var(--accent)/0.3]">
      <script
        type="application/ld+json"
        suppressHydrationWarning
        dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }}
      />

      <Background poster={poster} title={m!.title} />
      <div className="relative z-10 mx-auto max-w-7xl px-4 md:px-6 pt-[8vh] md:pt-[10vh] pb-10">


        <section className="relative z-10 grid grid-cols-1 gap-6 items-start md:flex md:items-start md:gap-6 -mt-[12vh] md:-mt-[35vh]">
          
          <PosterCard
            poster={poster}
            title={m!.title}
            link={m!.link || `https://kodik.cc`}
            actions={<BookmarkButton slug={m!.slug} initialStatus={null} />}
          />
          <div className="space-y-4 md:flex-1">
            <InfoCard data={m!} />
            <CreditsCard credits={m!.credits} />
          </div>
          <RatingsCard
            materialId={m!.kodik_id} 
            kp={m!.extra?.kinopoisk_rating}
            imdb={m!.extra?.imdb_rating}
            shiki={m!.extra?.shikimori_rating}
            mdl={m!.extra?.mydramalist_rating}
            aki={(m!.extra as any)?.aki_rating ?? null}
            akiVotes={(m!.extra as any)?.aki_votes ?? null}
            updatedAt={m!.updated_at}
            total={m!.extra?.episodes_total ?? null}
            aired={m!.extra?.episodes_aired ?? null}
            status={(m!.extra?.anime_status ?? m!.extra?.all_status ?? "").toLowerCase()}
          />
        </section>

        {/* Смотреть */}
        <section id="watch" className="mt-8">
          <div className="rounded-2xl border border-[var(--border)] bg-[color:var(--card)] backdrop-blur-md shadow-[0_10px_40px_-15px_rgba(0,0,0,.3)] p-4 md:p-6">
            <div className="flex items-center justify-between gap-3 mb-4">
              <h2 className="text-xl md:text-2xl font-bold">Смотреть</h2>
              <span className="text-xs text-[color:var(--foreground)/0.6]">
                Источник: {m!.slug}
              </span>
            </div>
            <PlayerSection
              versions={versions as any}
              initialLink={initialLink}
              storageKey={m!.slug}
            />
          </div>
        </section>

        {/* Комментарии */}
        <section id="comments" className="mt-6">
          <CommentsSection
            materialId={m!.kodik_id}
            currentUserId={currentUserId ?? undefined}
            isStaff={!!isStaff}
          />
        </section>

        <footer className="py-8 text-center text-[color:var(--foreground)/0.4] text-xs">
          Обновлено: {new Date(m!.updated_at).toLocaleDateString()}
        </footer>
      </div>
    </main>
  );
}
