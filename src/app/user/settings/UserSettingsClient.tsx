// src/app/user/settings/UserSettingsClient.tsx
"use client";

import React, { useEffect, useMemo, useRef, useState } from "react";
import { useSession } from "next-auth/react";
import { useRouter } from "next/navigation";

/** === Конфиг === */
const API_BASE = process.env.API_BASE || "http://127.0.0.1:8000";

/** === Хелперы === */
function authHeaders(token?: string | null): HeadersInit {
  const h: Record<string, string> = { Accept: "application/json" };
  if (token) h.Authorization = `Bearer ${token}`;
  return h;
}

async function api<T>(path: string, opts: RequestInit = {}): Promise<T> {
  const res = await fetch(`${API_BASE}${path}`, {
    ...opts,
    headers: {
      Accept: "application/json",
      ...(opts.headers as Record<string, string> | undefined),
    },
    credentials: "include",
    cache: "no-store",
  });
  if (!res.ok) {
    const text = await res.text().catch(() => "");
    throw new Error(text || `${res.status} ${res.statusText}`);
  }
  return (await res.json()) as T;
}

/** === Типы === */
type AvatarHistoryItem = { id: number; url: string; created_at: string };

interface ProfileData {
  user: { id: number; username: string; email: string; role: string };
  display_name: string;
  bio: string;
  avatar_url: string | null;
  xp: number;
  level: number;
  max_level: number;
  next_level_total_xp: number;
  need_for_next: number;
  progress: number; // 0..1
  frame_item_id: number | null;
  header_item_id: number | null;
}

interface SettingsPayload {
  profile: ProfileData;
  applied: {
    avatar_item_id: number | null;
    frame_item_id: number | null;
    header_item_id: number | null;
  };
  avatars: { history: AvatarHistoryItem[] };
}

interface Item {
  id: number;
  type: "avatar_static" | "avatar_anim" | "header_anim" | "theme" | "avatar_frame";
  slug: string;
  title: string;
  description: string;
  file?: string | null;
  file_url?: string | null;
  preview?: string | null;
  is_animated: boolean;
  mime: string;
  width?: number | null;
  height?: number | null;
  price_aki: number;
  is_active: boolean;
}

interface AppliedState {
  avatar_item: number | null;
  frame_item: number | null;
  header_item: number | null;
  theme_item?: number | null;
}

/* ===================== Базовые UI атомы ===================== */
function Card({
  children,
  className = "",
}: {
  children: React.ReactNode;
  className?: string;
}) {
  return (
    <div
      className={`rounded-2xl border border-[var(--border)] bg-[color:var(--card)] shadow-sm ${className}`}
    >
      {children}
    </div>
  );
}

function Section({
  title,
  subtitle,
  right,
  children,
}: {
  title: string;
  subtitle?: string;
  right?: React.ReactNode;
  children: React.ReactNode;
}) {
  return (
    <section className="mb-6">
      <div className="mb-2 flex items-end justify-between gap-3">
        <div>
          <h2 className="text-base sm:text-lg font-semibold text-[var(--foreground)]">
            {title}
          </h2>
          {subtitle ? (
            <div className="text-[13px] text-[color:var(--foreground)]/65">
              {subtitle}
            </div>
          ) : null}
        </div>
        {right}
      </div>
      <Card className="p-4 sm:p-5">{children}</Card>
    </section>
  );
}

function Field({
  label,
  hint,
  children,
}: {
  label: string;
  hint?: string;
  children: React.ReactNode;
}) {
  return (
    <div>
      <label className="block text-sm font-medium text-[var(--foreground)] mb-1">
        {label}
      </label>
      {children}
      {hint ? (
        <p className="mt-1 text-xs text-[color:var(--foreground)]/60">
          {hint}
        </p>
      ) : null}
    </div>
  );
}

const Input = React.forwardRef<
  HTMLInputElement,
  React.InputHTMLAttributes<HTMLInputElement>
>(function InputComponent({ className, ...props }, ref) {
  return (
    <input
      ref={ref}
      {...props}
      className={[
        "block w-full rounded-xl border bg-[color:var(--secondary)]",
        "border-[var(--border)] text-[var(--foreground)] placeholder-[color:var(--foreground)]/45",
        "focus:outline-none focus:ring-2 focus:ring-[var(--accent)] focus:border-[var(--accent)]",
        className || "",
      ].join(" ")}
    />
  );
});

const Textarea = React.forwardRef<
  HTMLTextAreaElement,
  React.TextareaHTMLAttributes<HTMLTextAreaElement>
>(function TextareaComponent({ className, ...props }, ref) {

  return (
    <textarea
      ref={ref}
      {...props}
      className={[
        "block w-full min-h-[120px] rounded-xl border bg-[color:var(--secondary)]",
        "border-[var(--border)] text-[var(--foreground)] placeholder-[color:var(--foreground)]/45",
        "focus:outline-none focus:ring-2 focus:ring-[var(--accent)] focus:border-[var(--accent)]",
        className || "",
      ].join(" ")}
    />
  );
});

function Button({
  children,
  onClick,
  type = "button",
  disabled,
  variant = "default",
}: {
  children: React.ReactNode;
  onClick?: () => void;
  type?: "button" | "submit" | "reset";
  disabled?: boolean;
  variant?: "default" | "primary" | "danger" | "ghost";
}) {
  const base =
    "py-2 px-3 inline-flex items-center gap-x-2 text-sm font-medium rounded-xl focus:outline-none focus:ring-2 focus:ring-[var(--accent)] transition disabled:opacity-50";
  const variants: Record<string, string> = {
    default: `${base} border border-[var(--border)] bg-[color:var(--secondary)] text-[var(--foreground)] hover:opacity-95`,
    primary: `${base} border border-[var(--primary)] bg-[var(--primary)] text-[var(--primary-foreground)] hover:opacity-95`,
    danger: `${base} border border-transparent bg-[color:var(--danger,#ef4444)] text-white hover:opacity-95`,
    ghost: `${base} border border-transparent text-[var(--foreground)]/85 hover:bg-[color:var(--secondary)]`,
  };
  return (
    <button
      type={type}
      onClick={onClick}
      disabled={disabled}
      className={variants[variant]}
    >
      {children}
    </button>
  );
}

function Alert({
  tone = "danger",
  children,
}: {
  tone?: "danger" | "info" | "success";
  children: React.ReactNode;
}) {
  const map: Record<string, { bg: string; border: string; text: string }> = {
    danger: {
      bg: "bg-[color:var(--danger,#ef4444)]/10",
      border: "border-[color:var(--danger,#ef4444)]/35",
      text: "text-[color:var(--danger,#ef4444)]",
    },
    info: {
      bg: "bg-[color:var(--accent)]/10",
      border: "border-[color:var(--accent)]/35",
      text: "text-[var(--accent)]",
    },
    success: {
      bg: "bg-[color:var(--success,#10b981)]/10",
      border: "border-[color:var(--success,#10b981)]/35",
      text: "text-[color:var(--success,#10b981)]",
    },
  };
  const s = map[tone];
  return (
    <div
      className={`rounded-xl border ${s.bg} ${s.border} ${s.text} p-3 text-sm`}
    >
      {children}
    </div>
  );
}

function InventoryGrid({ children }: { children: React.ReactNode }) {
  return (
    <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-6 gap-4">
      {children}
    </div>
  );
}

function ItemCard({
  item,
  selected,
  onSelect,
  badge,
}: {
  item: Item;
  selected?: boolean;
  onSelect?: (id: number | null) => void;
  badge?: string;
}) {
  const src = item.file_url || item.file || item.preview || "";
  return (
    <button
      onClick={() => onSelect?.(item.id)}
      aria-pressed={!!selected}
      className={[
        "group relative overflow-hidden rounded-xl border bg-[color:var(--card)] shadow-sm",
        "border-[var(--border)] hover:shadow-md transition focus:outline-none focus:ring-2 focus:ring-[var(--accent)]",
        selected ? "ring-2 ring-[var(--accent)]" : "",
      ].join(" ")}
    >
      {src ? (
        <img src={src} alt={item.title} className="w-full h-28 object-cover" />
      ) : (
        <div className="w-full h-28 bg-[color:var(--secondary)]" />
      )}
      <div className="p-2">
        <div
          className="text-sm font-medium text-[var(--foreground)] line-clamp-1"
          title={item.title}
        >
          {item.title}
        </div>
        {item.price_aki > 0 && (
          <div className="mt-0.5 text-[11px] text-[color:var(--foreground)]/65">
            Цена: {item.price_aki} AKI
          </div>
        )}
      </div>
      {badge ? (
        <span className="absolute top-2 left-2 inline-flex items-center gap-x-1 rounded-full border border-[var(--border)] bg-[color:var(--secondary)]/90 px-2 py-0.5 text-[11px] font-medium text-[var(--foreground)]/85">
          {badge}
        </span>
      ) : null}
    </button>
  );
}

function Skeleton({ className = "" }: { className?: string }) {
  return (
    <div
      className={`animate-pulse rounded-xl bg-[color:var(--secondary)]/60 ${className}`}
    />
  );
}

/* ===================== Живой превью-панель профиля ===================== */
function ProfilePreview({
  avatarUrl,
  frameUrl,
  headerUrl,
  displayName,
  username,
  level,
  progress,
  role,
}: {
  avatarUrl?: string | null;
  frameUrl?: string | null;
  headerUrl?: string | null;
  displayName?: string;
  username?: string;
  level?: number;
  progress?: number;
  role?: string;
}) {
  const pct = Math.max(0, Math.min(100, Math.round((progress ?? 0) * 100)));
  const isVideoHeader =
    !!headerUrl && /\.webm($|\?)|\.mp4($|\?)/i.test(headerUrl);
  const isVideoFrame = !!frameUrl && /\.webm($|\?)|\.mp4($|\?)/i.test(frameUrl);

  return (
    <Card className="overflow-hidden">
      <div className="relative">
        <div className="aspect-[16/6] w-full bg-[radial-gradient(ellipse_at_top,_var(--tw-gradient-stops))] from-[var(--accent)]/35 via-[var(--primary)]/25 to-transparent" />
        {headerUrl &&
          (isVideoHeader ? (
            <video
              src={headerUrl}
              autoPlay
              loop
              muted
              playsInline
              preload="metadata"
              className="absolute inset-0 h-full w-full object-cover"
            />
          ) : (
            <div
              className="absolute inset-0 bg-center bg-cover"
              style={{ backgroundImage: `url("${headerUrl}")` }}
            />
          ))}
        <div className="absolute inset-0 bg-gradient-to-t from-[color:var(--background)]/85 via-[color:var(--background)]/25 to-transparent" />
      </div>

      <div className="p-4 sm:p-5 -mt-10 relative">
        <div className="flex items-center gap-4">
          <div className="relative" style={{ width: 96, height: 96 }}>
            {frameUrl && (
              <div
                className="absolute -inset-3 z-20 pointer-events-none"
                style={{ transform: "scale(1.05)" }}
              >
                {isVideoFrame ? (
                  <video
                    src={frameUrl}
                    autoPlay
                    loop
                    muted
                    playsInline
                    className="h-full w-full object-cover"
                  />
                ) : (
                  <img
                    src={frameUrl}
                    alt=""
                    className="h-full w-full object-cover"
                  />
                )}
              </div>
            )}
            <div className="relative z-10 rounded-full size-24 overflow-hidden border border-[var(--border)] bg-[color:var(--secondary)]">
              {avatarUrl ? (
                <img
                  src={avatarUrl}
                  alt="avatar"
                  className="size-24 object-cover"
                />
              ) : null}
            </div>
            {typeof level === "number" && (
              <span className="absolute -bottom-1 left-1/2 -translate-x-1/2 z-30 rounded-md border border-[var(--border)] bg-[color:var(--secondary)] px-2 py-0.5 text-xs text-[var(--foreground)]">
                Lv. {level}
              </span>
            )}
          </div>

          <div className="min-w-0">
            <div className="text-lg font-semibold truncate">
              {displayName || username}
            </div>
            <div className="text-sm text-[color:var(--foreground)]/70 truncate">
              @{username}
              {role ? ` • ${role}` : ""}
            </div>

            <div className="mt-3">
              <div className="flex items-center justify-between text-[11px] text-[color:var(--foreground)]/70">
                <span>Прогресс уровня</span>
                <span>{pct}%</span>
              </div>
              <div className="mt-1 h-2 w-full rounded-full bg-[color:var(--secondary)] overflow-hidden">
                <div
                  className="h-2 bg-[var(--primary)]"
                  style={{ width: `${pct}%` }}
                />
              </div>
            </div>
          </div>
        </div>
      </div>
    </Card>
  );
}

/* ===================== ВНУТРЕННЯЯ СТРАНИЦА ===================== */
function UserSettingsContent() {
  const router = useRouter();
  const { data: session, status } = useSession();
  const token =
    (session as any)?.access ??
    (session as any)?.backendTokens?.access ??
    null;

  const [activeTab, setActiveTab] = useState<"profile" | "account">("profile");

  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const [profile, setProfile] = useState<ProfileData | null>(null);
  const [applied, setApplied] = useState<AppliedState>({
    avatar_item: null,
    frame_item: null,
    header_item: null,
  });
  const [history, setHistory] = useState<AvatarHistoryItem[]>([]);
  const [inv, setInv] = useState<Item[]>([]);

  const frames = useMemo(
    () => inv.filter((i) => i.type === "avatar_frame"),
    [inv],
  );
  const avatars = useMemo(
    () =>
      inv.filter(
        (i) => i.type === "avatar_static" || i.type === "avatar_anim",
      ),
    [inv],
  );
  const headers = useMemo(
    () => inv.filter((i) => i.type === "header_anim"),
    [inv],
  );

  const displayNameRef = useRef<HTMLInputElement>(null);
  const bioRef = useRef<HTMLTextAreaElement>(null);
  const uploadRef = useRef<HTMLInputElement>(null);

  const [savingDisplay, setSavingDisplay] = useState(false);
  const [applying, setApplying] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [notice, setNotice] = useState<string | null>(null);

  // account-tab states
  const [cpOld, setCpOld] = useState(""); // change password
  const [cpNew, setCpNew] = useState("");
  const [cpNew2, setCpNew2] = useState("");
  const [cpPending, setCpPending] = useState(false);
  const [cpOk, setCpOk] = useState<string | null>(null);

  const [ceNewEmail, setCeNewEmail] = useState(""); // change email
  const [ceCode, setCeCode] = useState("");
  const [ceStage, setCeStage] = useState<"idle" | "sent">("idle");
  const [cePending, setCePending] = useState(false);
  const [ceOk, setCeOk] = useState<string | null>(null);

  const [delPwd, setDelPwd] = useState(""); // delete account
  const [delCode, setDelCode] = useState("");
  const [delPending, setDelPending] = useState(false);
  const [delOk, setDelOk] = useState<string | null>(null);

  /** Preline (dist) */
  useEffect(() => {
    import("preline/dist/index.js");
  }, []);

  // Гостей — на логин
  useEffect(() => {
    if (status === "unauthenticated") router.push("/auth/login");
  }, [status, router]);

  // Загрузка данных
  useEffect(() => {
    if (status !== "authenticated" || !token) return;
    let cancelled = false;

    async function load() {
      setLoading(true);
      setError(null);
      try {
        const settings = await api<SettingsPayload>(
          "/api/users/me/profile/settings/",
          { headers: authHeaders(token) },
        );
        if (cancelled) return;

        setProfile(settings.profile);
        setApplied({
          avatar_item: settings.applied.avatar_item_id,
          frame_item: settings.applied.frame_item_id,
          header_item: settings.applied.header_item_id,
        });
        setHistory(settings.avatars.history);

        const invRes = await api<{ results?: any } | Item[]>(
          "/api/customitems/me/inventory/",
          { headers: authHeaders(token) },
        );
        const items: Item[] = Array.isArray(invRes)
          ? (invRes as any).map((x: any) => x.item)
          : ((invRes as any).results || []).map((x: any) => x.item);
        setInv(items.filter(Boolean));
      } catch (e: any) {
        if (!cancelled) setError(e.message || "Ошибка загрузки");
      } finally {
        if (!cancelled) setLoading(false);
      }
    }

    load();
    return () => {
      cancelled = true;
    };
  }, [status, token]);

  function flash(msg: string) {
    setNotice(msg);
    setTimeout(() => setNotice(null), 1800);
  }

  async function saveProfileBasics() {
    if (!profile || status !== "authenticated" || !token) return;
    const display_name = displayNameRef.current?.value?.trim() ?? "";
    const bio = bioRef.current?.value ?? "";

    setSavingDisplay(true);
    setError(null);
    try {
      const res = await fetch(`${API_BASE}/api/users/me/profile/settings/`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json", ...authHeaders(token) },
        body: JSON.stringify({ display_name, bio }),
        credentials: "include",
      });
      if (!res.ok) throw new Error(await res.text());
      const data = await res.json();
      const updated = (data as any).profile || data;
      setProfile(updated as ProfileData);
      flash("Сохранено");
    } catch (e: any) {
      setError(e.message || "Не удалось сохранить");
    } finally {
      setSavingDisplay(false);
    }
  }

  async function applyItems(next: Partial<AppliedState>) {
    if (status !== "authenticated" || !token) return;
    setApplying(true);
    setError(null);
    try {
      const body: AppliedState = {
        avatar_item: next.avatar_item ?? applied.avatar_item ?? null,
        frame_item: next.frame_item ?? applied.frame_item ?? null,
        header_item: next.header_item ?? applied.header_item ?? null,
        theme_item: null,
      };
      await api(`/api/customitems/me/applied/`, {
        method: "PUT",
        headers: { "Content-Type": "application/json", ...authHeaders(token) },
        body: JSON.stringify(body),
      });
      setApplied(body);
      flash("Применено");
    } catch (e: any) {
      setError(e.message || "Не удалось применить");
    } finally {
      setApplying(false);
    }
  }

  async function useOldAvatar(mediaId: number) {
    if (status !== "authenticated" || !token) return;
    setApplying(true);
    setError(null);
    try {
      await api(`/api/users/me/profile/avatar/select/`, {
        method: "POST",
        headers: { "Content-Type": "application/json", ...authHeaders(token) },
        body: JSON.stringify({ media_id: mediaId }),
      });
      const s = await api<SettingsPayload>("/api/users/me/profile/settings/", {
        headers: authHeaders(token),
      });
      setProfile(s.profile);
      setApplied({
        avatar_item: s.applied.avatar_item_id,
        frame_item: s.applied.frame_item_id,
        header_item: s.applied.header_item_id,
      });
      flash("Аватар установлен");
    } catch (e: any) {
      setError(e.message || "Не удалось выбрать аватар");
    } finally {
      setApplying(false);
    }
  }

  async function uploadAvatarFile() {
    if (status !== "authenticated" || !token) return;
    const file = uploadRef.current?.files?.[0];
    if (!file) return;

    setUploading(true);
    setError(null);
    try {
      const fd = new FormData();
      fd.append("file", file);
      const res = await fetch(
        `${API_BASE}/api/users/me/profile/avatar/upload/`,
        {
          method: "POST",
          headers: authHeaders(token),
          body: fd,
          credentials: "include",
        },
      );
      if (!res.ok) throw new Error(await res.text());

      const s = await api<SettingsPayload>("/api/users/me/profile/settings/", {
        headers: authHeaders(token),
      });
      setProfile(s.profile);
      setHistory(s.avatars.history);
      if (uploadRef.current) uploadRef.current.value = "";
      flash("Аватар загружен");
    } catch (e: any) {
      setError(e.message || "Не удалось загрузить аватар");
    } finally {
      setUploading(false);
    }
  }

  // === Account tab handlers ===

  // 1) Смена пароля
  async function changePassword() {
    if (status !== "authenticated" || !token) return;
    if (cpNew !== cpNew2) {
      setCpOk(null);
      setError("Новый пароль и подтверждение не совпадают");
      return;
    }
    setCpPending(true);
    setError(null);
    setCpOk(null);
    try {
      await api("/api/users/me/account/change-password/", {
        method: "POST",
        headers: { "Content-Type": "application/json", ...authHeaders(token) },
        body: JSON.stringify({ old_password: cpOld, new_password: cpNew }),
      });
      setCpOk("Пароль изменён");
      setCpOld("");
      setCpNew("");
      setCpNew2("");
    } catch (e: any) {
      setError(e.message || "Не удалось изменить пароль");
    } finally {
      setCpPending(false);
    }
  }

  // 2) Смена почты: шаг 1 — запрос кода на новую почту
  async function requestEmailChangeCode() {
    if (status !== "authenticated" || !token) return;
    setCePending(true);
    setError(null);
    setCeOk(null);
    try {
      await api("/api/users/me/account/change-email/request/", {
        method: "POST",
        headers: { "Content-Type": "application/json", ...authHeaders(token) },
        body: JSON.stringify({ new_email: ceNewEmail }),
      });
      setCeStage("sent");
      setCeOk("Код отправлен на новую почту");
    } catch (e: any) {
      setError(e.message || "Не удалось отправить код");
    } finally {
      setCePending(false);
    }
  }

  // 2) Смена почты: шаг 2 — подтверждение кодом
  async function confirmEmailChange() {
    if (status !== "authenticated" || !token) return;
    setCePending(true);
    setError(null);
    setCeOk(null);
    try {
      await api("/api/users/me/account/change-email/confirm/", {
        method: "POST",
        headers: { "Content-Type": "application/json", ...authHeaders(token) },
        body: JSON.stringify({ new_email: ceNewEmail, code: ceCode }),
      });
      setCeOk("Почта изменена");
      setCeStage("idle");
      setCeCode("");
      // обновим профиль
      const s = await api<SettingsPayload>("/api/users/me/profile/settings/", {
        headers: authHeaders(token),
      });
      setProfile(s.profile);
    } catch (e: any) {
      setError(e.message || "Не удалось подтвердить почту");
    } finally {
      setCePending(false);
    }
  }

  // 3) Удаление аккаунта: пароль + код из писем на текущую почту
  async function requestDeleteCode() {
    if (status !== "authenticated" || !token) return;
    setDelPending(true);
    setError(null);
    setDelOk(null);
    try {
      await api("/api/users/me/account/delete/request/", {
        method: "POST",
        headers: authHeaders(token),
      });
      setDelOk("Код отправлен на вашу почту");
    } catch (e: any) {
      setError(e.message || "Не удалось отправить код");
    } finally {
      setDelPending(false);
    }
  }

  async function confirmDeleteAccount() {
    if (status !== "authenticated" || !token) return;
    setDelPending(true);
    setError(null);
    setDelOk(null);
    try {
      await api("/api/users/me/account/delete/confirm/", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          ...authHeaders(token),
        },
        body: JSON.stringify({ password: delPwd, code: delCode }),
      });
      setDelOk("Аккаунт удалён");
      // выходим из сессии
      router.push("/auth/logout");
    } catch (e: any) {
      setError(e.message || "Не удалось удалить аккаунт");
    } finally {
      setDelPending(false);
    }
  }

  const username = profile?.user.username || "";

  return (
    <main className="mx-auto max-w-7xl px-4 md:px-6 py-8 text-[var(--foreground)]">
      <div className="mb-4 flex items-center justify-between gap-3">
        <h1 className="text-2xl md:text-3xl font-extrabold tracking-tight">
          Настройки
        </h1>
        {notice && (
          <div className="rounded-full border border-[var(--border)] bg-[color:var(--secondary)] px-3 py-1 text-sm">
            {notice}
          </div>
        )}
      </div>

      {/* Tabs */}
      <Card className="mb-6 p-1">
        <div className="flex gap-1">
          <button
            onClick={() => setActiveTab("profile")}
            className={[
              "flex-1 rounded-xl px-3 py-2 text-sm",
              activeTab === "profile"
                ? "bg-[color:var(--secondary)]"
                : "hover:bg-[color:var(--secondary)]/60",
            ].join(" ")}
          >
            Профиль
          </button>
          <button
            onClick={() => setActiveTab("account")}
            className={[
              "flex-1 rounded-xl px-3 py-2 text-sm",
              activeTab === "account"
                ? "bg-[color:var(--secondary)]"
                : "hover:bg-[color:var(--secondary)]/60",
            ].join(" ")}
          >
            Учётная запись
          </button>
        </div>
      </Card>

      {error && <Alert tone="danger">{error}</Alert>}
      {delOk && activeTab === "account" && <Alert tone="info">{delOk}</Alert>}
      {cpOk && activeTab === "account" && <Alert tone="success">{cpOk}</Alert>}
      {ceOk && activeTab === "account" && <Alert tone="success">{ceOk}</Alert>}

      {activeTab === "profile" ? (
        // ====== TAB: Профиль ======
        <div className="grid lg:grid-cols-[360px_minmax(0,1fr)] gap-6">
          {/* Левая колонка: превью */}
          <div className="lg:sticky lg:top-6 h-fit">
            {loading || !profile ? (
              <Card className="p-4">
                <Skeleton className="aspect-[16/6] w-full mb-4" />
                <div className="flex items-center gap-4">
                  <Skeleton className="size-24 rounded-full" />
                  <div className="flex-1">
                    <Skeleton className="h-4 w-40 mb-2" />
                    <Skeleton className="h-3 w-24 mb-4" />
                    <Skeleton className="h-2 w-full rounded-full" />
                  </div>
                </div>
              </Card>
            ) : (
              <ProfilePreview
                avatarUrl={profile.avatar_url ?? undefined}
                frameUrl={
                  applied.frame_item
                    ? frames.find((f) => f.id === applied.frame_item)?.file_url ||
                      undefined
                    : undefined
                }
                headerUrl={
                  applied.header_item
                    ? headers.find((h) => h.id === applied.header_item)
                        ?.file_url || undefined
                    : undefined
                }
                displayName={profile.display_name}
                username={username}
                level={profile.level}
                progress={profile.progress}
                role={profile.user.role}
              />
            )}

            <Card className="mt-4 p-4 flex items-center justify-between gap-3">
              <div className="text-sm text-[color:var(--foreground)]/70">
                {applying || uploading
                  ? "Сохраняем изменения…"
                  : "Подсказка: изменения видны в превью слева"}
              </div>
              <div className="flex items-center gap-2">
                <Button
                  variant="ghost"
                  onClick={() =>
                    window.scrollTo({ top: 0, behavior: "smooth" })
                  }
                >
                  Наверх
                </Button>
              </div>
            </Card>
          </div>

          {/* Правая колонка: контент */}
          <div>
            {/* Общие */}
            <Section
              title="Общие"
              subtitle="Имя, био, базовые сведения"
              right={
                <Button
                  onClick={saveProfileBasics}
                  disabled={savingDisplay || loading}
                  variant="primary"
                >
                  Сохранить
                </Button>
              }
            >
              {loading || !profile ? (
                <div className="grid md:grid-cols-2 gap-5">
                  <Skeleton className="h-24" />
                  <Skeleton className="h-24" />
                  <Skeleton className="h-28 md:col-span-2" />
                </div>
              ) : (
                <div className="grid md:grid-cols-2 gap-5">
                  <Field label="Username" hint="Нельзя менять">
                    <Input value={username} disabled />
                  </Field>
                  <Field
                    label="Отображаемое имя"
                    hint="Это увидят другие пользователи"
                  >
                    <Input
                      ref={displayNameRef}
                      defaultValue={profile.display_name || ""}
                      placeholder="Введите имя…"
                    />
                  </Field>
                  <div className="md:col-span-2">
                    <Field label="О себе" hint="Коротко расскажите о себе">
                      <Textarea
                        ref={bioRef}
                        defaultValue={profile.bio || ""}
                        placeholder="Ваше био…"
                      />
                    </Field>
                  </div>
                </div>
              )}
            </Section>

            {/* Аватар: загрузка и история */}
            <Section
              title="Аватар"
              subtitle="Загрузите свой или используйте купленные варианты"
            >
              <div className="flex flex-wrap items-start gap-6">
                <div className="flex items-center gap-4">
                  <div className="size-24 rounded-full overflow-hidden border border-[var(--border)] bg-[color:var(--secondary)] shadow-sm">
                    {profile?.avatar_url ? (
                      <img
                        src={profile.avatar_url}
                        alt="avatar"
                        className="size-24 object-cover"
                      />
                    ) : null}
                  </div>
                  <div>
                    <input
                      ref={uploadRef}
                      type="file"
                      accept="image/png,image/jpeg,image/webp"
                      className="block w-full text-sm text-[var(--foreground)] file:mr-3 file:rounded-xl file:border-0 file:bg-[var(--primary)] file:px-3 file:py-2 file:text-sm file:font-medium file:text-[var(--primary-foreground)] hover:file:opacity-95"
                    />
                    <div className="mt-2 flex gap-2">
                      <Button
                        onClick={uploadAvatarFile}
                        disabled={uploading || loading}
                      >
                        Загрузить
                      </Button>
                    </div>
                    <p className="mt-2 text-xs text-[color:var(--foreground)]/60">
                      Поддерживаются PNG/JPEG/WEBP. Анимированные аватары — через
                      магазин.
                    </p>
                  </div>
                </div>

                <div className="min-w-[280px] flex-1">
                  <h3 className="mb-2 font-medium text-[var(--foreground)]">
                    Мои загруженные (история)
                  </h3>
                  {!history?.length ? (
                    <Card className="p-4 text-sm text-[color:var(--foreground)]/60">
                      Пока пусто
                    </Card>
                  ) : (
                    <InventoryGrid>
                      {history.map((h) => (
                        <button
                          key={h.id}
                          onClick={() => useOldAvatar(h.id)}
                          className="rounded-xl overflow-hidden border border-[var(--border)] bg-[color:var(--card)] hover:shadow-sm focus:outline-none focus:ring-2 focus:ring-[var(--accent)]"
                          title={new Date(h.created_at).toLocaleString()}
                        >
                          <img
                            src={h.url}
                            alt="prev"
                            className="w-full h-28 object-cover"
                          />
                        </button>
                      ))}
                    </InventoryGrid>
                  )}
                </div>
              </div>
            </Section>

            {/* Инвентарь: Аватары */}
            <Section
              title="Аватары из инвентаря"
              subtitle="Статичные и анимированные"
            >
              {!avatars.length ? (
                <Card className="p-4 text-sm text-[color:var(--foreground)]/60">
                  Нет купленных аватаров
                </Card>
              ) : (
                <>
                  <InventoryGrid>
                    {avatars.map((it) => (
                      <ItemCard
                        key={it.id}
                        item={it}
                        badge={it.type === "avatar_anim" ? "аним" : undefined}
                        selected={applied.avatar_item === it.id}
                        onSelect={(id) => applyItems({ avatar_item: id })}
                      />
                    ))}
                  </InventoryGrid>
                  {applied.avatar_item ? (
                    <div className="mt-3">
                      <button
                        onClick={() => applyItems({ avatar_item: null })}
                        className="text-sm text-[color:var(--foreground)] underline underline-offset-4 hover:opacity-90"
                      >
                        Снять покупной аватар (вернуться к загруженному)
                      </button>
                    </div>
                  ) : null}
                </>
              )}
            </Section>

            {/* Рамки */}
            <Section
              title="Рамка для аватара"
              subtitle="Поверх аватара — статичная или анимированная рамка"
            >
              {!frames.length ? (
                <Card className="p-4 text-sm text-[color:var(--foreground)]/60">
                  Нет купленных рамок
                </Card>
              ) : (
                <>
                  <InventoryGrid>
                    {frames.map((it) => (
                      <ItemCard
                        key={it.id}
                        item={it}
                        selected={applied.frame_item === it.id}
                        onSelect={(id) => applyItems({ frame_item: id })}
                      />
                    ))}
                  </InventoryGrid>
                  {applied.frame_item ? (
                    <div className="mt-3">
                      <button
                        onClick={() => applyItems({ frame_item: null })}
                        className="text-sm text-[color:var(--foreground)] underline underline-offset-4 hover:opacity-90"
                      >
                        Снять рамку
                      </button>
                    </div>
                  ) : null}
                </>
              )}
            </Section>

            {/* Шапки */}
            <Section
              title="Шапка профиля"
              subtitle="Фон карточки профиля: gif/webm/png"
            >
              {!headers.length ? (
                <Card className="p-4 text-sm text-[color:var(--foreground)]/60">
                  Нет шапок
                </Card>
              ) : (
                <>
                  <InventoryGrid>
                    {headers.map((it) => (
                      <ItemCard
                        key={it.id}
                        item={it}
                        selected={applied.header_item === it.id}
                        onSelect={(id) => applyItems({ header_item: id })}
                      />
                    ))}
                  </InventoryGrid>
                  {applied.header_item ? (
                    <div className="mt-3">
                      <button
                        onClick={() => applyItems({ header_item: null })}
                        className="text-sm text-[color:var(--foreground)] underline underline-offset-4 hover:opacity-90"
                      >
                        Снять шапку
                      </button>
                    </div>
                  ) : null}
                </>
              )}
            </Section>

            {(applying || uploading || savingDisplay) && (
              <div className="mt-2 text-xs text-[color:var(--foreground)]/60">
                Сохраняем…
              </div>
            )}
          </div>
        </div>
      ) : (
        // ====== TAB: Учётная запись ======
        <div className="max-w-3xl">
          {/* Смена пароля */}
          <Section
            title="Смена пароля"
            subtitle="Введите текущий пароль и новый пароль"
          >
            <div className="grid sm:grid-cols-2 gap-4">
              <Field label="Текущий пароль">
                <Input
                  type="password"
                  value={cpOld}
                  onChange={(e) => setCpOld(e.target.value)}
                  placeholder="••••••••"
                />
              </Field>
              <div className="grid grid-cols-1 gap-4">
                <Field label="Новый пароль">
                  <Input
                    type="password"
                    value={cpNew}
                    onChange={(e) => setCpNew(e.target.value)}
                    placeholder="Минимум 8 символов"
                  />
                </Field>
                <Field label="Повторите новый пароль">
                  <Input
                    type="password"
                    value={cpNew2}
                    onChange={(e) => setCpNew2(e.target.value)}
                    placeholder="Ещё раз"
                  />
                </Field>
              </div>
            </div>
            <div className="mt-3">
              <Button
                variant="primary"
                disabled={cpPending}
                onClick={changePassword}
              >
                {cpPending ? "Сохраняем…" : "Изменить пароль"}
              </Button>
            </div>
          </Section>

          {/* Смена почты */}
          <Section
            title="Смена почты"
            subtitle="Двухшаговая процедура: код придёт на новую почту"
          >
            <div className="grid sm:grid-cols-2 gap-4">
              <Field label="Новая почта">
                <Input
                  type="email"
                  value={ceNewEmail}
                  onChange={(e) => setCeNewEmail(e.target.value)}
                  placeholder="new@example.com"
                />
              </Field>
              {ceStage === "sent" && (
                <Field
                  label="Код подтверждения"
                  hint="Проверьте входящие/спам"
                >
                  <Input
                    value={ceCode}
                    onChange={(e) => setCeCode(e.target.value)}
                    placeholder="123456"
                  />
                </Field>
              )}
            </div>
            <div className="mt-3 flex gap-2">
              {ceStage === "idle" ? (
                <Button
                  variant="primary"
                  disabled={cePending || !ceNewEmail}
                  onClick={requestEmailChangeCode}
                >
                  {cePending ? "Отправляем…" : "Отправить код"}
                </Button>
              ) : (
                <>
                  <Button
                    variant="primary"
                    disabled={cePending || !ceCode}
                    onClick={confirmEmailChange}
                  >
                    {cePending ? "Проверяем…" : "Подтвердить"}
                  </Button>
                  <Button
                    variant="ghost"
                    onClick={() => {
                      setCeStage("idle");
                      setCeCode("");
                      setCeOk(null);
                    }}
                  >
                    Сбросить
                  </Button>
                </>
              )}
            </div>
          </Section>

          {/* Удаление аккаунта */}
          <Section
            title="Удаление аккаунта"
            subtitle="Безопасность: потребуется ваш пароль и код, отправленный на текущую почту"
          >
            <Alert tone="danger">
              Внимание: удаление необратимо. Все данные профиля и инвентарь будут
              удалены.
            </Alert>
            <div className="mt-3 grid sm:grid-cols-2 gap-4">
              <Field label="Пароль">
                <Input
                  type="password"
                  value={delPwd}
                  onChange={(e) => setDelPwd(e.target.value)}
                  placeholder="••••••••"
                />
              </Field>
              <div className="grid grid-cols-1 gap-4">
                <Field label="Код из письма" hint="Сначала запросите код">
                  <Input
                    value={delCode}
                    onChange={(e) => setDelCode(e.target.value)}
                    placeholder="6 цифр"
                  />
                </Field>
                <div className="flex gap-2">
                  <Button disabled={delPending} onClick={requestDeleteCode}>
                    Отправить код
                  </Button>
                  <Button
                    variant="danger"
                    disabled={delPending || !delPwd || !delCode}
                    onClick={confirmDeleteAccount}
                  >
                    {delPending ? "Проверяем…" : "Удалить аккаунт"}
                  </Button>
                </div>
              </div>
            </div>
          </Section>
        </div>
      )}
    </main>
  );
}

// Делаем этот компонент дефолтным экспортом
export default UserSettingsContent;
