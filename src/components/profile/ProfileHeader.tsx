"use client";

import React, { useMemo } from "react";
import UserAvatar from "@/components/profile/UserAvatar";

type PublicUser = { id: number; username: string; role?: string; date_joined?: string };
type PublicProfile = {
  user: PublicUser;
  display_name?: string;
  bio?: string;
  avatar_url?: string | null;
  header_url?: string | null;
  header_item_url?: string | null;
  frame_url?: string | null;
  xp: number;
  level: number;
  max_level: number;
  next_level_total_xp: number;
  need_for_next: number;
  progress: number; // 0..1
};

export default function ProfileHeader({
  data,
  isOwner = false,
  headerUrl,
  frameUrl,
}: {
  data: PublicProfile;
  isOwner?: boolean;
  headerUrl?: string | null; // можем принести снаружи
  frameUrl?: string | null;
}) {
  // ЕДИНЫЙ резолвер шапки
  const cover =
    headerUrl ??
    (data as any).header_url ??
    (data as any).header_item_url ??
    null;

  const hasCover = !!cover;
  const progressPercent = Math.max(0, Math.min(100, Math.round((data?.progress || 0) * 100)));

  const joined = useMemo(() => {
    if (!data?.user?.date_joined) return null;
    return new Date(data.user.date_joined).toLocaleDateString("ru-RU", {
      year: "numeric",
      month: "long",
      day: "numeric",
    });
  }, [data?.user?.date_joined]);

  return (
    <div className="w-full">
      {/* Шапка — только если есть */}
      {hasCover ? <Cover headerUrl={cover!} /> : null}

      {/* Контейнер: если шапки нет — без отрицательного отступа */}
      <div className={hasCover ? "relative -mt-14" : "relative mt-0"}>
        <div className="rounded-2xl border border-[var(--border)] bg-[color:var(--card)]/80 p-5 md:p-6 backdrop-blur supports-[backdrop-filter]:bg-[color:var(--card)]/60 shadow-[0_10px_40px_-20px_rgba(0,0,0,.35)]">
          <div className="flex flex-col gap-4 md:flex-row md:items-center md:gap-6">
            <UserAvatar
              src={data.avatar_url || undefined}
              username={data.user.username}
              frameUrl={frameUrl ?? data.frame_url ?? undefined}
              size={112}
              rounded="full"
            />

            <div className="min-w-0 flex-1">
              <h1 className="text-2xl font-extrabold tracking-tight">
                {data.display_name || data.user.username}
              </h1>
              <div className="mt-1 text-sm text-[color:var(--foreground)]/70">
                @{data.user.username}
                {joined && <span className="ml-2">с {joined}</span>}
                {data.user.role ? <span className="ml-2 opacity-80">• {data.user.role}</span> : null}
              </div>

              <div className="mt-4">
                <div className="flex items-center justify-between text-xs text-[color:var(--foreground)]/70">
                  <span>
                    Уровень {data.level} / {data.max_level}
                  </span>
                  <span>{progressPercent}%</span>
                </div>
                <div className="mt-1 h-2 w-full overflow-hidden rounded-full bg-[color:var(--secondary)]">
                  <div
                    className="h-2 animate-[grow_1.2s_ease-out] rounded-full"
                    style={{
                      width: `${progressPercent}%`,
                      background: "linear-gradient(90deg,var(--accent),var(--primary))",
                    }}
                  />
                </div>
                <div className="mt-1 text-xs text-[color:var(--foreground)]/70">
                  XP: <b className="text-[color:var(--foreground)]">{data.xp}</b>
                  {" • "}До след. уровня:{" "}
                  <b className="text-[color:var(--foreground)]">{data.need_for_next}</b>
                </div>
              </div>
            </div>

            <div className="shrink-0">
              {isOwner ? (
                <a
                  href="/user/settings"
                  className="inline-flex items-center rounded-xl border border-[var(--border)] bg-[color:var(--secondary)] px-4 py-2 text-sm transition hover:bg-[color:var(--card)]/60"
                >
                  Настройки
                </a>
              ) : (
                <button className="inline-flex items-center rounded-xl border border-[var(--primary)] bg-[var(--primary)] px-4 py-2 text-sm text-[var(--primary-foreground)] transition hover:opacity-95">
                  Подписаться
                </button>
              )}
            </div>
          </div>

          {data.bio && (
            <p className="mt-4 whitespace-pre-line text-sm text-[color:var(--foreground)]/85">
              {data.bio}
            </p>
          )}

          <div className="mt-4 grid grid-cols-2 gap-3 md:grid-cols-4">
            <StatCard label="Текущий уровень" value={String(data.level)} />
            <StatCard label="Макс. уровень" value={String(data.max_level)} />
            <StatCard label="Текущий XP" value={String(data.xp)} />
            <StatCard label="До следующего" value={String(data.need_for_next)} />
          </div>
        </div>
      </div>

      <style jsx global>{`
        @keyframes grow {
          from { width: 0; }
          to {}
        }
      `}</style>
    </div>
  );
}

/* ====== Локальные компоненты ====== */

function Cover({ headerUrl }: { headerUrl: string }) {
  const lower = headerUrl.toLowerCase();
  const isVideo = lower.endsWith(".webm") || lower.endsWith(".mp4");
  const isImage = !isVideo;

  return (
    <div className="relative w-full overflow-hidden rounded-2xl">
      {isVideo ? (
        <>
          <video
            src={headerUrl}
            autoPlay
            loop
            muted
            playsInline
            preload="metadata"
            className="absolute inset-0 h-full w-full object-cover"
          />
          <div className="absolute inset-0 bg-[linear-gradient(to_top,rgba(0,0,0,.35),transparent)]" />
          <div className="aspect-[16/5] w-full opacity-0" aria-hidden />
        </>
      ) : (
        <>
          <div
            className="absolute inset-0 bg-cover bg-center"
            style={{ backgroundImage: `url("${headerUrl}")` }}
            aria-hidden="true"
          />
          <div className="absolute inset-0 bg-[linear-gradient(to_top,rgba(0,0,0,.35),transparent)]" />
          <div className="aspect-[16/5] w-full opacity-0" aria-hidden />
        </>
      )}
    </div>
  );
}

function StatCard({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded-xl border border-[var(--border)] bg-[color:var(--secondary)] px-3 py-2">
      <div className="text-[11px] uppercase tracking-wide text-[color:var(--foreground)]/60">{label}</div>
      <div className="mt-0.5 text-lg font-semibold">{value}</div>
    </div>
  );
}
