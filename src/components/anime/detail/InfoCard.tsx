// src/components/anime/detail/InfoCard.tsx
"use client";

import { useEffect, useMemo, useState } from "react";
import dayjs from "dayjs";
import durationPlugin from "dayjs/plugin/duration";
dayjs.extend(durationPlugin);

import { SoftCard, Badge } from "./atoms";

// ⬇️ ЕДИНЫЕ типы (DRF-совместимые)
import type {
  Country,
  Genre,
  Studio,
  MaterialDetail,
  MaterialDetailPopulated,
  MaterialVersion,
  MaterialVersionPopulated,
} from "@/types/DB/kodik";

import type { IconType } from "react-icons";
import {
  FiCalendar,
  FiClock,
  FiMic,
  FiTag,
  FiShield,
  FiGlobe,
  FiFilm,
  FiTv,
} from "react-icons/fi";

/* helpers */
const MONTHS_RU = [
  "января", "февраля", "марта", "апреля", "мая", "июня",
  "июля", "августа", "сентября", "октября", "ноября", "декабря",
];

const nonEmpty = (v: unknown) =>
  !(v === null ||
    v === undefined ||
    (typeof v === "string" && !v.trim()) ||
    (Array.isArray(v) && v.length === 0));

function fmtDateRu(d?: string | null) {
  if (!d) return "";
  const x = new Date(d);
  if (isNaN(x.getTime())) return d || "";
  return `${x.getDate()} ${MONTHS_RU[x.getMonth()]} ${x.getFullYear()}`;
}

function seasonFromDate(d?: string | null) {
  if (!d) return "";
  const x = new Date(d);
  if (isNaN(x.getTime())) return "";
  const m = x.getMonth() + 1;
  const y = x.getFullYear();
  const q = m <= 2 || m === 12 ? "Зима" : m <= 5 ? "Весна" : m <= 8 ? "Лето" : "Осень";
  return `${q} ${y}`;
}

function joinLimited(items: string[], limit = 4) {
  if (!items?.length) return "";
  if (items.length <= limit) return items.join(", ");
  const head = items.slice(0, limit).join(", ");
  return `${head} +${items.length - limit}`;
}

/** список тегов-ссылок с лимитом и +N */
function TagLinks({
  items,
  limit = 6,
  hrefBase = "/studios",
}: {
  items: { id?: number | string; name: string; slug?: string }[];
  limit?: number;
  hrefBase?: string;
}) {
  if (!items?.length) return null;
  const head = items.slice(0, limit);
  const rest = items.length - head.length;
  return (
    <div className="flex flex-wrap gap-1.5">
      {head.map((s) =>
        s.slug ? (
          <a
            key={s.id ?? s.slug}
            href={`${hrefBase}/${encodeURIComponent(s.slug)}`}
            className="inline-flex items-center rounded-md border border-[var(--border)] bg-[var(--secondary)] px-2 py-[3px] text-[11px] hover:border-[var(--accent)]/60 transition"
          >
            {s.name}
          </a>
        ) : (
          <span
            key={s.id ?? s.name}
            className="inline-flex items-center rounded-md border border-[var(--border)] bg-[var(--secondary)] px-2 py-[3px] text-[11px]"
          >
            {s.name}
          </span>
        )
      )}
      {rest > 0 ? (
        <span className="inline-flex items-center rounded-md border border-[var(--border)] bg-[var(--secondary)] px-2 py-[3px] text-[11px]">
          +{rest}
        </span>
      ) : null}
    </div>
  );
}

/* строка инфо-таблицы */
function Row({
  icon: Icon,
  k,
  v,
}: {
  icon?: IconType;
  k: string;
  v?: React.ReactNode;
}) {
  if (!nonEmpty(v)) return null;
  return (
    <div className="grid grid-cols-[1fr,2.4fr] md:grid-cols-[160px,1fr] gap-3 py-2">
      <div className="text-[14px] leading-[1.35] flex items-center gap-1.5">
        {Icon ? <Icon className="h-3.5 w-3.5 opacity-80" /> : null}
        {k}
      </div>
      <div className="opacity-95 text-[12px] leading-[1.35] text-[color:var(--foreground)]/90">{v}</div>
    </div>
  );
}

/* форматирование обратного отсчёта: DD:HH:MM:SS (для текста) */
function fmtCountdown(msLeft: number) {
  if (msLeft <= 0) return null;
  const d = dayjs.duration(msLeft, "milliseconds");
  const days = Math.floor(d.asDays());
  const hh = String(d.hours()).padStart(2, "0");
  const mm = String(d.minutes()).padStart(2, "0");
  const ss = String(d.seconds()).padStart(2, "0");
  return days > 0 ? `${days}д ${hh}:${mm}:${ss}` : `${hh}:${mm}:${ss}`;
}

/* разложить миллисекунды на d/h/m/s (для табло) */
function getCountdownParts(msLeft: number) {
  if (msLeft <= 0) return null;
  const d = dayjs.duration(msLeft, "milliseconds");
  const days = Math.floor(d.asDays());
  const hours = d.hours();
  const minutes = d.minutes();
  const seconds = d.seconds();
  return { days, hours, minutes, seconds };
}

type Detail = MaterialDetail | MaterialDetailPopulated;

export default function InfoCard({ data }: { data?: Detail | null }) {
  // 🔒 защита от undefined/null
  if (!data) {
    return (
      <SoftCard className="p-4 md:p-5 select-text">
        <div className="animate-pulse space-y-3">
          <div className="h-5 w-40 rounded bg-[var(--secondary)]" />
          <div className="h-8 w-2/3 rounded bg-[var(--secondary)]" />
          <div className="h-4 w-1/2 rounded bg-[var(--secondary)]" />
          <div className="mt-3 grid grid-cols-1 md:grid-cols-2 gap-2">
            <div className="h-4 rounded bg-[var(--secondary)]" />
            <div className="h-4 rounded bg-[var(--secondary)]" />
            <div className="h-4 rounded bg-[var(--secondary)]" />
            <div className="h-4 rounded bg-[var(--secondary)]" />
          </div>
        </div>
      </SoftCard>
    );
  }

  // ====== распаковка ======
  const {
    type,
    year,
    title,
    title_orig,
    genres = [],
    studios = [],
    production_countries = [],
    episodes_total,
    episodes_aired,
    next_episode_at,
    extra,
    versions = [],
  } = data;

  const isSerial = type === "anime-serial";

  // даты из extra
  const airedAt       = extra?.aired_at ?? null;
  const releasedAt    = extra?.released_at ?? null;
  const premiereWorld = extra?.premiere_world ?? null;
  const premiereRu    = extra?.premiere_ru ?? null;

  const seasonDate = airedAt || premiereWorld || releasedAt || premiereRu || null;
  const seasonStr  = seasonFromDate(seasonDate || undefined);

  const startDate = airedAt || premiereWorld || premiereRu || null;
  const endDate   =
    releasedAt && startDate && new Date(releasedAt) > new Date(startDate)
      ? releasedAt
      : null;

  const episodesStr =
    isSerial
      ? nonEmpty(episodes_total)
        ? String(episodes_total)
        : nonEmpty(episodes_aired)
          ? `${episodes_aired}+`
          : ""
      : undefined;

  const durationMin = extra?.duration ?? null;
  const durationStr =
    nonEmpty(durationMin)
      ? isSerial
        ? `${durationMin} мин. ~ серия`
        : `${durationMin} мин.`
      : "";

  // статус
  const rawStatus = (extra?.anime_status || extra?.all_status || "").toLowerCase();
  const statusMap: Record<string, string> = { anons: "Анонс", ongoing: "Онгоинг", released: "Вышел" };
  const statusStr = statusMap[rawStatus] || (extra?.anime_status || extra?.all_status || "");

  const genreNames = (genres as Genre[])
    .filter((g) => (g.source || "").toLowerCase() === "shikimori")
    .map((g) => g.name);

  const countryNames = (production_countries as (number | string | Country)[])
    .map((c) => (typeof c === "object" && c ? c.name : null))
    .filter(Boolean) as string[];

  // список переводов из versions[*].translation.title
  const trNames = Array.from(
    new Set(
      (versions as (MaterialVersion | MaterialVersionPopulated)[])
        .map((v) => (typeof v.translation === "object" ? v.translation.title : null))
        .filter(Boolean) as string[]
    )
  );

  const ratingMpaa = extra?.rating_mpaa || undefined;
  const minimalAge = extra?.minimal_age ?? null;
  const kind       = extra?.anime_kind || null;

  const TypeIcon   = isSerial ? FiTv : FiFilm;

  // ── Обратный отсчёт (без гидрации на сервере) ────────────────────────────────
  const nextAtISO = useMemo<string | null>(() => {
    const raw = next_episode_at ?? null;
    if (!raw) return null;
    const d = dayjs(raw);
    return d.isValid() ? d.toISOString() : null;
  }, [next_episode_at]);

  // Важно: не считаем время на сервере, включаем только после mount
  const [mounted, setMounted] = useState(false);
  const [msLeft, setMsLeft] = useState<number>(0);

  useEffect(() => {
    setMounted(true);
  }, []);

  useEffect(() => {
    if (!mounted || !nextAtISO) return;
    // начальная установка на клиенте
    setMsLeft(Math.max(0, dayjs(nextAtISO).diff(dayjs())));
    const id = setInterval(() => {
      setMsLeft((prev) => {
        const next = Math.max(0, dayjs(nextAtISO).diff(dayjs()));
        return next === prev ? prev : next;
      });
    }, 1000);
    return () => clearInterval(id);
  }, [mounted, nextAtISO]);

  const countdownStr = useMemo(() => (msLeft > 0 ? fmtCountdown(msLeft) : null), [msLeft]);
  const parts = useMemo(() => getCountdownParts(msLeft), [msLeft]);
  const showCountdown = Boolean(mounted && nextAtISO && countdownStr && parts);

  return (
    <SoftCard className="p-4 md:p-5 select-text">
      {/* верхняя строка бейджей */}
      <div className="flex flex-wrap items-center gap-1.5 text-[11px] text-[color:var(--foreground)/0.75]">
        <span className="inline-flex items-center gap-1 rounded-lg border border-[var(--border)] bg-[var(--secondary)] px-2 py-1">
          <TypeIcon className="h-3.5 w-3.5" />
          {isSerial ? "ТВ Сериал" : "Аниме"}
        </span>
        {year ? <Badge>{year}</Badge> : null}
        {kind ? <Badge>{kind}</Badge> : null}
        {countryNames.slice(0, 2).map((n, i) => (<Badge key={i}>{n}</Badge>))}
        {countryNames.length > 2 ? <Badge>+{countryNames.length - 2}</Badge> : null}
        {statusStr ? <Badge>{statusStr}</Badge> : null}
      </div>

      {/* заголовок */}
      <h1 className="mt-1.5 text-2xl sm:text-3xl md:text-4xl font-extrabold tracking-tight leading-tight">
        {title}
      </h1>
      {title_orig ? (
        <p className="text-[color:var(--foreground)/0.7] mt-0.5 text-base sm:text-lg">
          {title_orig}
        </p>
      ) : null}

      {/* описание (из extra) */}
      {extra?.description ? (
        <details className="group mt-3">
          <summary className="list-none cursor-pointer leading-relaxed">
            <span className="line-clamp-3 group-open:line-clamp-none">{extra.description}</span>
            <span className="mt-1 block text-[color:var(--accent)]/90 text-[12px]">
              ↓ Показать полностью
            </span>
          </summary>
        </details>
      ) : null}

      {/* инфо-сетка */}
      <div className="mt-4 grid grid-cols-1 md:grid-cols-2 gap-y-2 md:gap-x-8 text-[11px]">
        <Row icon={TypeIcon} k="Тип" v={isSerial ? "ТВ Сериал" : "Аниме"} />
        <Row icon={FiTag} k="Жанры" v={joinLimited(genreNames, 4)} />
        <Row icon={FiCalendar} k="Сезон" v={seasonStr || undefined} />
        {nonEmpty(startDate) || nonEmpty(endDate) ? (
          <Row
            icon={FiCalendar}
            k="Выпуск"
            v={endDate ? `с ${fmtDateRu(startDate!)} по ${fmtDateRu(endDate)}` : fmtDateRu(startDate!)}
          />
        ) : null}
        <Row icon={FiClock} k="Длительность" v={durationStr} />
        <Row icon={FiMic} k="Озвучка" v={joinLimited(trNames, 6)} />
        <Row icon={FiShield} k="Рейтинг MPAA" v={ratingMpaa || undefined} />
        <Row icon={FiGlobe} k="Страны" v={joinLimited(countryNames, 3)} />
        <Row icon={FiCalendar} k="Эпизоды" v={episodesStr} />

        {/* Студии — кликабельные теги */}
        <Row
          icon={FiTag}
          k="Студии"
          v={
            (studios as Studio[])?.length
              ? <TagLinks items={(studios as Studio[]).map(s => ({ id: s.id, name: s.name, slug: s.slug }))} limit={6} hrefBase="/studios" />
              : undefined
          }
        />

        <Row icon={FiShield} k="Возраст" v={nonEmpty(minimalAge) ? `${minimalAge}+` : undefined} />
      </div>

      {/* Обратный отсчёт — ТАБЛО */}
      {showCountdown && parts ? (
        <div className="mt-5 border-t border-[var(--border)] pt-4">
          <div className="text-center text-sm md:text-base font-semibold mb-3">
            До новой серии осталось:
          </div>

          <div className="flex justify-center items-end gap-3 sm:gap-4">
            {[
              { v: parts.days,    label: "дней"   },
              { v: parts.hours,   label: "часов"  },
              { v: parts.minutes, label: "минут"  },
              { v: parts.seconds, label: "секунд" },
            ].map((u, i) => {
              const val = String(u.v).padStart(2, "0");
              return (
                <div key={i} className="flex flex-col items-center">
                  <div
                    className="
                      rounded-xl border border-[var(--border)]
                      bg-[var(--secondary)] text-[color:var(--foreground)]
                      px-3 py-2 md:px-4 md:py-3
                      text-2xl md:text-3xl font-extrabold tabular-nums tracking-widest
                      shadow-[inset_0_-6px_12px_rgba(0,0,0,0.06)]
                      min-w-[3.25rem] md:min-w-[3.75rem] text-center
                    "
                    aria-live="polite"
                    suppressHydrationWarning
                  >
                    {val}
                  </div>
                  <div className="mt-1 text-[10px] md:text-xs opacity-70">
                    {u.label}
                  </div>
                </div>
              );
            })}
          </div>

          <div className="mt-2 text-center text-xs opacity-60">
            ({fmtDateRu(nextAtISO!)})
          </div>
        </div>
      ) : null}
    </SoftCard>
  );
}
