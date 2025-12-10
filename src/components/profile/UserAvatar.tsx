"use client";

import Image from "next/image";
import { useMemo, useState } from "react";
import clsx from "clsx";

/** Нормализуем URL (поддержка //, data:, blob:, относительных путей) */
/** Нормализуем URL (поддержка //, data:, blob:, относительных путей) */
function normalizeMediaUrl(url?: string | null) {
  if (!url) return null;
  if (/^(data:|blob:)/i.test(url)) return url;
  if (url.startsWith("//")) return "https:" + url;
  // ⬇️ ВАЖНО: относительный путь оставляем относительным, чтобы не получить http://localhost на SSR
  if (url.startsWith("/")) return url;

  try {
    const base = typeof window !== "undefined" ? window.location.origin : "http://localhost";
    const u = new URL(url, base);
    // для наших локальных путей тоже возвращаем относительный
    if (u.origin === base && u.pathname.startsWith("/")) {
      return u.pathname + u.search;
    }
    return u.toString();
  } catch {
    return url.startsWith("/") ? url : `/${url}`;
  }
}


/** безопасно добавляем v=... в query */
function withVersion(u: string, ver?: string | number | null) {
  if (!ver) return u;
  try {
    const base = typeof window !== "undefined" ? window.location.origin : "http://localhost";
    const url = new URL(u, base);
    url.searchParams.set("v", String(ver));
    return url.origin === base ? url.pathname + url.search : url.toString();
  } catch {
    return u + (u.includes("?") ? `&v=${ver}` : `?v=${ver}`);
  }
}

/** map https://dev.mysite.ru:3443/api/... → /api/... (чтобы обойти dev-TLS) */
function mapDevApiToLocal(u?: string | null) {
  if (!u) return null;
  try {
    const url = new URL(
      u,
      typeof window !== "undefined" ? window.location.origin : "http://localhost"
    );
    if (url.hostname === "dev.mysite.ru" && (url.port === "3443" || url.port === "")) {
      if (url.pathname.startsWith("/api/")) {
        return url.pathname + url.search; // локальный API-роут
      }
    }
    return u;
  } catch {
    return u;
  }
}

// цвет фона по нику
function hashHue(s: string) {
  let h = 0;
  for (let i = 0; i < s.length; i++) h = (h * 31 + s.charCodeAt(i)) | 0;
  return Math.abs(h) % 360;
}

type Props = {
  src?: string | null;
  username: string;
  frameUrl?: string | null;
  ver?: string | number | null;
  size?: number;
  frameScale?: number;
  framePad?: number;
  rounded?: "full" | "xl" | "none";
  className?: string;
};

export default function UserAvatar({
  src,
  username,
  frameUrl,
  ver,
  size = 112,
  frameScale = 1.23,
  framePad = 0,
  rounded = "full",
  className,
}: Props) {
  const [imgError, setImgError] = useState(false);
  const [frameError, setFrameError] = useState(false); // скрываем слой рамки при ошибке

  const initial = useMemo(
    () => (username || "?").trim().charAt(0).toUpperCase() || "?",
    [username]
  );
  const roundedClass = rounded === "full" ? "rounded-full" : rounded === "xl" ? "rounded-xl" : "";
  const isVideoFrame = !!frameUrl && /\.webm($|\?)/i.test(frameUrl);

  // 1) нормализация
  const safeSrc = normalizeMediaUrl(src);
  const safeFrame = normalizeMediaUrl(frameUrl ?? undefined);

  // 2) добавляем версию
  const srcWithVer = safeSrc ? withVersion(safeSrc, ver ?? null) : null;
  const frameWithVer = safeFrame ? withVersion(safeFrame, ver ?? null) : null;

  // 3) маппим дев-хост на локальный API для аватарки И рамки
  const srcClient = mapDevApiToLocal(srcWithVer);
  const frameClient = mapDevApiToLocal(frameWithVer);

  // 4) любой локальный /api/** не оптимизируем (без /_next/image)
  const isLocalAvatar = !!srcClient && srcClient.startsWith("/api/");
  const isLocalFrame  = !!frameClient && frameClient.startsWith("/api/");

  const hue = hashHue(username || "?");
  const fallbackBg = `linear-gradient(135deg, hsl(${hue} 50% 22%) 0%, hsl(${hue} 60% 32%) 100%)`;

  return (
    <div
      className={clsx("relative inline-block", roundedClass, "select-none", className)}
      style={{ width: size, height: size }}
      aria-label={username}
    >
      {/* --- Аватар --- */}
      {srcClient && !imgError ? (
        <Image
          src={srcClient}
          alt={username}
          fill
          sizes={`${size}px`}
          priority={size >= 64}
          loading={size < 64 ? "lazy" : undefined}
          className={clsx("object-cover", roundedClass, "ring-1 ring-[color:var(--border)]")}
          onError={() => setImgError(true)}
          draggable={false}
          unoptimized={isLocalAvatar}
        />
      ) : (
        <div
          className={clsx(
            "flex h-full w-full items-center justify-center",
            roundedClass,
            "ring-1 ring-[color:var(--border)]"
          )}
          style={{ background: fallbackBg, boxShadow: "inset 0 0 32px rgba(0,0,0,.12)" }}
        >
          <span
            className="font-semibold"
            style={{ fontSize: Math.round(size * 0.44), lineHeight: 1, color: "var(--foreground)", opacity: 0.9 }}
          >
            {initial}
          </span>
        </div>
      )}

      {/* --- Рамка (БОЛЬШЕ аватара) --- */}
      {frameClient && !frameError ? (
        <div
          className="pointer-events-none absolute inset-0 z-20"
          style={{
            transform: `scale(${frameScale})`,
            transformOrigin: "center",
            filter: "drop-shadow(0 2px 6px rgba(0,0,0,.25))", // ← исправлено: обычные кавычки
            margin: framePad ? `-${framePad}px` : undefined,
          }}
          aria-hidden="true"
        >
          {isVideoFrame ? (
            <video
              src={frameClient}
              autoPlay
              loop
              muted
              playsInline
              preload="metadata"
              disablePictureInPicture
              controls={false}
              className="h-full w-full object-cover"
              draggable={false}
              onError={() => setFrameError(true)}
            />
          ) : (
            <Image
              src={frameClient}
              alt=""
              fill
              sizes={`${Math.round(size * frameScale)}px`}
              loading="lazy"
              className="object-cover"
              draggable={false}
              unoptimized={isLocalFrame}
              onError={() => setFrameError(true)}
            />
          )}
        </div>
      ) : null}
    </div>
  );
}
