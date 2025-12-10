"use client";

import React from "react";
import PlyrHlsPlayer from "./players/PlyrHlsPlayer";

export function VideoArea({
  tab,
  link,
  directUrl,
  directKind,
  qualities,
  segments,
  loading,
  err,
  onEnded,
}: {
  tab: "iframe" | "direct";
  link: string;
  directUrl: string | null;
  directKind: "hls" | "mp4" | "unknown";
  qualities?: Array<{ label: 720 | 480 | 360; url: string }>;
  segments?: Array<{ type: "ad" | "skip"; start: number; end: number }>;
  loading: boolean;
  err: string | null;
  onEnded?: () => void;
}) {
  if (!link) {
    return (
      <div className="aspect-video grid place-items-center text-[color:var(--foreground)/0.7]">
        Серий с ссылками пока нет.
      </div>
    );
  }

  if (tab === "iframe") {
    return (
      <iframe
        key={`iframe-${link}`}
        src={link}
        className="w-full aspect-video rounded-lg overflow-hidden border border-[var(--border)]"
        allowFullScreen
        referrerPolicy="no-referrer-when-downgrade"
      />
    );
  }

  if (loading || !directUrl) {
    return (
      <div className="aspect-video relative overflow-hidden rounded-lg">
        <div className="absolute inset-0 bg-[color:var(--secondary)]/70" />
        <div className="absolute inset-0 animate-pulse bg-gradient-to-r from-transparent via-white/10 to-transparent" />
        <div className="relative z-10 h-full w-full grid place-items-center text-[color:var(--foreground)/0.75]">
          {err ? <span className="text-red-400">{err}</span> : "Загружаем видео…"}
        </div>
      </div>
    );
  }

  return (
    <PlyrHlsPlayer
      src={directUrl}
      kind={directKind}
      qualities={qualities}
      segments={segments}
      onEnded={onEnded}
    />
  );
}
