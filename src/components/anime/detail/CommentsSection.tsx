// src/components/anime/detail/CommentsSection.tsx
"use client";

import React, { useCallback, useEffect, useMemo, useRef, useState } from "react";
import {
  FiRefreshCw, FiSend, FiThumbsUp, FiThumbsDown, FiMessageCircle,
  FiChevronDown, FiChevronUp, FiX, FiMoreVertical, FiEdit2, FiTrash2, FiCheck,
} from "react-icons/fi";
import { useSession, signIn } from "next-auth/react";
import { usePathname, useSearchParams } from "next/navigation";
import UserAvatar from "@/components/profile/UserAvatar";

const COMMENTS_ENDPOINT = "/api/proxy/kodik/aki/comments";

/* ================== types ================== */

type CommentItem = {
  id: number;
  material: string;
  user: { id: number; username: string; display_name: string };
  parent: number | null;
  body: string;
  status: string;
  is_deleted: boolean;
  is_pinned: boolean;
  likes_count: number;
  replies_count: number;
  created_at: string;
  updated_at: string;
};

type ListResponse = { results: CommentItem[]; count: number };

/* ================== utils ================== */

function humanizeError(e: any) {
  const s = String(e?.message || e);
  if (s.includes("401")) return "Нужно войти в аккаунт.";
  if (s.includes("403")) return "Недостаточно прав.";
  if (s.includes("429")) return "Слишком много запросов. Попробуйте позже.";
  return "Что-то пошло не так. Попробуйте позже.";
}

function getCSRFCookie() {
  if (typeof document === "undefined") return undefined;
  return document.cookie.split("; ").find((c) => c.startsWith("csrftoken="))?.split("=")[1];
}

type FetchOpts = {
  signal?: AbortSignal;
  etag?: string | null;
  lastModified?: string | null;
  retries?: number;
  retryDelayMs?: number;
};

async function sleep(ms: number) { await new Promise((r) => setTimeout(r, ms)); }

async function fetchJSON<T>(
  url: string,
  init: RequestInit & FetchOpts = {}
): Promise<{ status: number; data: T | null; etag?: string | null; lastModified?: string | null }> {
  const { etag, lastModified, retries = 2, retryDelayMs = 350, signal, ...baseInit } = init;
  const headers = new Headers(baseInit.headers || {});
  headers.set("Accept", "application/json");
  headers.set("Cache-Control", "no-store");
  if (etag) headers.set("If-None-Match", etag);
  if (lastModified) headers.set("If-Modified-Since", lastModified);

  let attempt = 0;
  while (true) {
    try {
      const r = await fetch(url, { ...baseInit, headers, credentials: "include", cache: "no-store", signal });

      const et = r.headers.get("etag");
      const lm = r.headers.get("last-modified");

      if (r.status === 204) return { status: 204, data: null, etag: et, lastModified: lm };
      if (r.status === 304) return { status: 304, data: null, etag: et, lastModified: lm };

      if (r.ok) {
        const text = await r.text();
        const data = text ? (JSON.parse(text) as T) : (null as any);
        return { status: r.status, data, etag: et, lastModified: lm };
      }

      const body = await r.text();
      const err = new Error(body || `HTTP ${r.status}`);
      (err as any).status = r.status;
      throw err;
    } catch (err: any) {
      if (err?.name === "AbortError") throw err;
      const st = err?.status as number | undefined;
      const transient = !st || (st >= 500 && st <= 599);
      if (attempt < retries && transient) {
        attempt++;
        const delay = retryDelayMs * Math.pow(2, attempt - 1);
        await sleep(delay);
        continue;
      }
      throw err;
    }
  }
}

async function apiGet<T>(url: string, opts: FetchOpts = {}) {
  return fetchJSON<T>(url, { method: "GET", ...opts });
}
async function apiPost<T>(url: string, body: any, opts: FetchOpts = {}) {
  const headers: Record<string, string> = { "Content-Type": "application/json" };
  const token = getCSRFCookie();
  if (token) headers["X-CSRFToken"] = token;
  return fetchJSON<T>(url, { method: "POST", headers, body: JSON.stringify(body), ...opts });
}
async function apiPatch<T>(url: string, body: any, opts: FetchOpts = {}) {
  const headers: Record<string, string> = { "Content-Type": "application/json" };
  const token = getCSRFCookie();
  if (token) headers["X-CSRFToken"] = token;
  return fetchJSON<T>(url, { method: "PATCH", headers, body: JSON.stringify(body), ...opts });
}
async function apiDelete(url: string, opts: FetchOpts = {}) {
  const headers: Record<string, string> = {};
  const token = getCSRFCookie();
  if (token) headers["X-CSRFToken"] = token;
  return fetchJSON(url, { method: "DELETE", headers, ...opts });
}

function formatRu(iso: string) {
  try {
    const d = new Date(iso);
    return d.toLocaleString("ru-RU", { day: "2-digit", month: "short", year: "numeric", hour: "2-digit", minute: "2-digit" });
  } catch { return iso; }
}

function buildAvatarUrls(user: { id?: number; username?: string; display_name?: string }) {
  const hasId = typeof user?.id === "number" && user.id > 0;
  const usernameLabel = (user?.username?.trim() || user?.display_name?.trim() || (hasId ? `id:${user.id}` : "user")) as string;
  if (!hasId) return { src: undefined, frame: undefined, username: usernameLabel };
  const query = `id=${encodeURIComponent(String(user.id))}`;
  return { src: `/api/avatar?${query}`, frame: `/api/avatar?${query}&kind=frame`, username: usernameLabel };
}

/* ================== root ================== */

export default function CommentsSection({
  materialId,
  currentUserId,
  isStaff = false,
}: {
  materialId: string;
  currentUserId?: number;
  isStaff?: boolean;
}) {
  const [roots, setRoots] = useState<CommentItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [err, setErr] = useState<string | null>(null);
  const [text, setText] = useState("");
  const [posting, setPosting] = useState(false);

  const [replies, setReplies] = useState<Record<number, CommentItem[]>>({});
  const [repliesLoading, setRepliesLoading] = useState<Record<number, boolean>>({});

  // auth + callback URL (чтобы вернуть пользователя назад после логина)
  const { status: authStatus } = useSession(); // 'authenticated' | 'unauthenticated' | 'loading'
  const pathname = usePathname();
  const search = useSearchParams();
  const callbackUrl = useMemo(() => {
    const qs = search?.toString();
    return qs ? `${pathname}?${qs}` : pathname;
  }, [pathname, search]);

  // быстрый guard
  const requireAuth = useCallback((): boolean => {
    if (authStatus !== "authenticated") {
      signIn(undefined, { callbackUrl });
      return false;
    }
    return true;
  }, [authStatus, callbackUrl]);

  // ETag/Last-Modified и технические refs
  const etagRef = useRef<string | null>(null);
  const lmRef = useRef<string | null>(null);
  const mountedRef = useRef(true);
  const inflightRef = useRef<AbortController | null>(null);
  const pollingRef = useRef<ReturnType<typeof setInterval> | null>(null);

  const listUrl = useMemo(
    () => `${COMMENTS_ENDPOINT}?material=${encodeURIComponent(materialId)}&parent=`,
    [materialId]
  );

  const cancelInflight = useCallback(() => {
    inflightRef.current?.abort();
    inflightRef.current = null;
  }, []);

  // загрузка корня
  const fetchRoots = useCallback(
    async ({ showSpinner }: { showSpinner: boolean }) => {
      cancelInflight();
      const ctrl = new AbortController();
      inflightRef.current = ctrl;
      showSpinner ? setLoading(true) : setRefreshing(true);
      setErr(null);
      try {
        const { status, data, etag, lastModified } = await apiGet<ListResponse>(listUrl, {
          signal: ctrl.signal,
          etag: etagRef.current,
          lastModified: lmRef.current,
          retries: 2,
          retryDelayMs: 400,
        });
        if (!mountedRef.current) return;

        if (status === 304) {
          // unchanged
        } else if (status === 204) {
          setRoots([]);
        } else if (data?.results) {
          setRoots(data.results);
        }
        if (etag !== undefined) etagRef.current = etag ?? null;
        if (lastModified !== undefined) lmRef.current = lastModified ?? null;
      } catch (e: any) {
        if (e?.name !== "AbortError") setErr(humanizeError(e));
      } finally {
        if (!mountedRef.current) return;
        showSpinner ? setLoading(false) : setRefreshing(false);
        inflightRef.current = null;
      }
    },
    [cancelInflight, listUrl]
  );

  const fetchReplies = useCallback(
    async (parentId: number) => {
      setRepliesLoading((m) => ({ ...m, [parentId]: true }));
      try {
        const url = `${COMMENTS_ENDPOINT}?material=${encodeURIComponent(materialId)}&parent=${parentId}`;
        const { data } = await apiGet<ListResponse>(url, { retries: 2, retryDelayMs: 400 });
        setReplies((m) => ({ ...m, [parentId]: data?.results ?? [] }));
      } finally {
        setRepliesLoading((m) => ({ ...m, [parentId]: false }));
      }
    },
    [materialId]
  );

  // первичная загрузка
  useEffect(() => {
    mountedRef.current = true;
    fetchRoots({ showSpinner: true });
    return () => {
      mountedRef.current = false;
      cancelInflight();
      if (pollingRef.current) clearInterval(pollingRef.current);
    };
  }, [fetchRoots, cancelInflight]);

  // поллинг
  useEffect(() => {
    function startPolling() {
      if (!pollingRef.current) {
        pollingRef.current = setInterval(() => {
          if (document.visibilityState === "visible" && navigator.onLine) {
            fetchRoots({ showSpinner: false });
          }
        }, 20000);
      }
    }
    function stopPolling() {
      if (pollingRef.current) {
        clearInterval(pollingRef.current);
        pollingRef.current = null;
      }
    }
    function onVisibility() {
      if (document.visibilityState === "visible") {
        fetchRoots({ showSpinner: false });
        startPolling();
      } else {
        stopPolling();
      }
    }
    function onOnline() { fetchRoots({ showSpinner: false }); startPolling(); }
    function onOffline() { stopPolling(); }

    document.addEventListener("visibilitychange", onVisibility);
    window.addEventListener("online", onOnline);
    window.addEventListener("offline", onOffline);

    if (document.visibilityState === "visible" && navigator.onLine) startPolling();

    return () => {
      document.removeEventListener("visibilitychange", onVisibility);
      window.removeEventListener("online", onOnline);
      window.removeEventListener("offline", onOffline);
      stopPolling();
    };
  }, [fetchRoots]);

  async function onSubmitTop(e: React.FormEvent) {
    e.preventDefault();
    if (!requireAuth()) return;

    const body = text.trim();
    if (!body) return;

    setPosting(true);
    setErr(null);

    // optimistic
    const tempId = -Math.floor(Math.random() * 1e9);
    const optimistic: CommentItem = {
      id: tempId,
      material: materialId,
      user: { id: currentUserId || 0, username: "", display_name: "Вы" },
      parent: null,
      body,
      status: "published",
      is_deleted: false,
      is_pinned: false,
      likes_count: 0,
      replies_count: 0,
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
    };
    setRoots((prev) => [optimistic, ...prev]);
    setText("");

    try {
      await apiPost<CommentItem>(COMMENTS_ENDPOINT, { material: materialId, body }, { retries: 1 });
      await fetchRoots({ showSpinner: false });
    } catch (e: any) {
      setRoots((prev) => prev.filter((c) => c.id !== tempId));
      setErr(humanizeError(e));
      // если 401 пришёл с сервера — откроем логин
      if (String(e?.message || "").includes("401")) signIn(undefined, { callbackUrl });
    } finally {
      setPosting(false);
    }
  }

  async function like(id: number, undo = false) {
    if (!requireAuth()) return;

    const adj = (arr: CommentItem[]) =>
      arr.map((c) =>
        c.id === id ? { ...c, likes_count: Math.max(0, c.likes_count + (undo ? -1 : 1)) } : c
      );
    setRoots((arr) => adj(arr));
    setReplies((m) =>
      Object.fromEntries(Object.entries(m).map(([k, arr]) => [Number(k), adj(arr)]))
    );

    try {
      await apiPost(`${COMMENTS_ENDPOINT}/${id}/${undo ? "unlike" : "like"}`, {}, { retries: 1 });
      fetchRoots({ showSpinner: false });
    } catch (e: any) {
      const roll = (arr: CommentItem[]) =>
        arr.map((c) =>
          c.id === id ? { ...c, likes_count: Math.max(0, c.likes_count + (undo ? 1 : -1)) } : c
        );
      setRoots((arr) => roll(arr));
      setReplies((m) =>
        Object.fromEntries(Object.entries(m).map(([k, arr]) => [Number(k), roll(arr)]))
      );
      if (String(e?.message || "").includes("401")) signIn(undefined, { callbackUrl });
    }
  }

  const isAuthed = authStatus === "authenticated";

  return (
    <div className="rounded-2xl border border-[var(--border)] bg-[color:var(--card)]/90 backdrop-blur p-4 md:p-6">
      <div className="mb-3 flex items-center justify-between gap-3">
        <h2 className="text-xl md:text-2xl font-bold">Комментарии</h2>
        <button
          onClick={() => fetchRoots({ showSpinner: false })}
          className="flex items-center gap-1 text-xs px-2 py-1 rounded-md border border-[var(--border)] hover:border-[var(--accent)]/60 transition disabled:opacity-50"
          disabled={refreshing}
          aria-label="Обновить"
          type="button"
        >
          <FiRefreshCw className={refreshing ? "animate-spin" : ""} />
          <span>{refreshing ? "Обновление…" : "Обновить"}</span>
        </button>
      </div>

      {/* форма нового сообщения */}
      <form onSubmit={onSubmitTop} className="mb-4">
        <textarea
          value={text}
          onChange={(e) => setText(e.target.value)}
          placeholder={isAuthed ? "Оставьте комментарий…" : "Войдите, чтобы комментировать"}
          className="w-full min-h-[84px] rounded-lg border border-[var(--border)] bg-[color:var(--secondary)] p-3 text-sm outline-none focus:border-[var(--accent)]/70"
          disabled={posting || !isAuthed}
          onFocus={() => { if (!isAuthed) signIn(undefined, { callbackUrl }); }}
        />
        <div className="mt-2 flex items-center justify-between">
          <span className="text-[11px] opacity-70">Соблюдайте правила площадки.</span>
          <button
            type="submit"
            disabled={posting || !text.trim() || !isAuthed}
            className="inline-flex items-center gap-2 px-3 py-1.5 text-sm rounded-lg bg-[var(--accent)] text-[var(--accent-foreground)] disabled:opacity-60"
            onClick={(e) => { if (!isAuthed) { e.preventDefault(); signIn(undefined, { callbackUrl }); } }}
          >
            <FiSend />
            {posting ? "Отправка…" : isAuthed ? "Отправить" : "Войти"}
          </button>
        </div>
        {err ? <div className="mt-2 text-xs text-rose-400 break-all">{err}</div> : null}
      </form>

      {loading ? (
        <div className="text-sm opacity-70">Загрузка…</div>
      ) : roots.length === 0 ? (
        <div className="text-sm opacity-60">Пока нет комментариев.</div>
      ) : (
        <ul className="space-y-4">
          {roots.map((n) => (
            <li key={n.id}>
              <CommentNode
                node={n}
                depth={0}
                rootId={n.id}
                materialId={materialId}
                onLike={like}
                onReplied={() => {
                  fetchRoots({ showSpinner: false });
                  fetchReplies(n.id);
                }}
                replies={replies[n.id]}
                repliesLoading={!!repliesLoading[n.id]}
                loadReplies={() => fetchReplies(n.id)}
                currentUserId={currentUserId}
                isStaff={isStaff}
                onChanged={() => fetchRoots({ showSpinner: false })}
                onDeleted={() => fetchRoots({ showSpinner: false })}
                requireAuth={requireAuth}
                callbackUrl={callbackUrl}
              />
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}

/* ================== one node ================== */

function CommentNode({
  node,
  materialId,
  onLike,
  onReplied,
  replies,
  repliesLoading,
  loadReplies,
  currentUserId,
  isStaff,
  onChanged,
  onDeleted,
  depth = 0,
  rootId,
  requireAuth,
  callbackUrl,
}: {
  node: CommentItem;
  materialId: string;
  onLike: (id: number, undo?: boolean) => void;
  onReplied: () => void;
  replies?: CommentItem[];
  repliesLoading: boolean;
  loadReplies: () => void;
  currentUserId?: number;
  isStaff?: boolean;
  onChanged: () => void;
  onDeleted: () => void;
  depth?: 0 | 1;
  rootId?: number;
  requireAuth: () => boolean;
  callbackUrl: string;
}) {
  const [replyOpen, setReplyOpen] = useState(false);
  const [childrenOpen, setChildrenOpen] = useState(true);
  const [menuOpen, setMenuOpen] = useState(false);
  const [editing, setEditing] = useState(false);
  const [editText, setEditText] = useState(node.body);
  const [busy, setBusy] = useState(false);
  const canEdit = !!(currentUserId && currentUserId === node.user.id) || !!isStaff;

  const { src: avatarSrc, frame: avatarFrame, username: avatarUsername } = useMemo(
    () => buildAvatarUrls(node.user),
    [node.user]
  );

  const isChild = depth === 1;
  const targetParentId = isChild ? (rootId ?? node.id) : node.id;
  const mentionLabel = (node.user.username || node.user.display_name || `id:${node.user.id}`).trim();
  const mentionText = `@${mentionLabel} `;

  const menuRef = useRef<HTMLDivElement | null>(null);
  useEffect(() => {
    function onDocClick(e: MouseEvent) {
      if (!menuRef.current) return;
      if (!menuRef.current.contains(e.target as Node)) setMenuOpen(false);
    }
    function onEsc(e: KeyboardEvent) { if (e.key === "Escape") setMenuOpen(false); }
    if (menuOpen) {
      document.addEventListener("mousedown", onDocClick);
      document.addEventListener("keydown", onEsc);
    }
    return () => {
      document.removeEventListener("mousedown", onDocClick);
      document.removeEventListener("keydown", onEsc);
    };
  }, [menuOpen]);

  async function saveEdit() {
    if (!requireAuth()) return;
    const body = editText.trim();
    if (!body) return;
    try {
      setBusy(true);
      await apiPatch<CommentItem>(`${COMMENTS_ENDPOINT}/${node.id}/`, { body }, { retries: 1 });
      setEditing(false);
      onChanged();
    } catch (e: any) {
      alert(humanizeError(e));
      if (String(e?.message || "").includes("401")) signIn(undefined, { callbackUrl });
    } finally {
      setBusy(false);
    }
  }

  async function deleteComment() {
    if (!requireAuth()) return;
    if (!confirm("Удалить комментарий?")) return;
    try {
      setBusy(true);
      await apiDelete(`${COMMENTS_ENDPOINT}/${node.id}/`, { retries: 1 });
      onDeleted();
    } catch (e: any) {
      alert(humanizeError(e));
      if (String(e?.message || "").includes("401")) signIn(undefined, { callbackUrl });
    } finally {
      setBusy(false);
    }
  }

  return (
    <div className="flex gap-3">
      <div className="mt-1 h-10 w-10 shrink-0">
        <UserAvatar
          src={avatarSrc}
          frameUrl={avatarFrame}
          username={avatarUsername}
          size={40}
          rounded="full"
          className="ring-1 ring-[color:var(--border)]"
        />
      </div>

      <div className="min-w-0 flex-1">
        <div className="relative rounded-xl border border-[var(--border)] bg-[var(--secondary)] p-3 shadow-[0_4px_15px_-8px_rgba(0,0,0,0.3)] overflow-visible">
          {canEdit && (
            <div ref={menuRef} className="absolute right-2 top-2">
              <button
                className="h-8 w-8 grid place-items-center rounded-md border border-[var(--border)] hover:border-[var(--accent)]/60"
                onClick={() => setMenuOpen((v) => !v)}
                title="Действия"
                type="button"
                aria-haspopup="menu"
                aria-expanded={menuOpen}
              >
                <FiMoreVertical />
              </button>
              {menuOpen && (
                <div role="menu" className="absolute right-0 mt-1 w-40 rounded-lg border border-[var(--border)] bg-[color:var(--card)] shadow-xl z-20">
                  <button
                    role="menuitem"
                    className="flex w-full items-center gap-2 px-3 py-2 text-sm hover:bg-[color:var(--secondary)]"
                    onClick={() => { setEditing(true); setEditText(node.body); setMenuOpen(false); }}
                    type="button"
                  >
                    <FiEdit2 /> Изменить
                  </button>
                  <button
                    role="menuitem"
                    className="flex w-full items-center gap-2 px-3 py-2 text-sm text-red-500 hover:bg-red-500/10"
                    onClick={() => { setMenuOpen(false); deleteComment(); }}
                    type="button"
                  >
                    <FiTrash2 /> Удалить
                  </button>
                </div>
              )}
            </div>
          )}

          <div className="flex items-center justify-between gap-3 pr-10">
            <div className="text-sm font-semibold">
              {node.user.display_name || node.user.username || `id:${node.user.id}`}
            </div>
            <div className="text-[11px] opacity-60">{formatRu(node.created_at)}</div>
          </div>

          {editing ? (
            <div className="mt-2">
              <textarea
                className="w-full rounded-lg border border-[var(--border)] bg-[color:var(--card)] px-3 py-2 text-sm outline-none focus:ring-2 focus:ring-[var(--accent)]"
                rows={3}
                value={editText}
                onChange={(e) => setEditText(e.target.value)}
                disabled={busy}
              />
              <div className="mt-2 flex items-center gap-2 text-sm">
                <button
                  onClick={saveEdit}
                  disabled={busy || !editText.trim()}
                  className="inline-flex items-center gap-2 rounded-lg border border-[var(--primary)] bg-[var(--primary)] px-3 py-1.5 text-[var(--primary-foreground)] hover:opacity-95 disabled:opacity-50"
                  type="button"
                >
                  <FiCheck /> Сохранить
                </button>
                <button
                  onClick={() => setEditing(false)}
                  className="inline-flex items-center gap-2 rounded-lg border border-[var(--border)] px-3 py-1.5 hover:bg-[color:var(--card)]/60"
                  type="button"
                >
                  <FiX /> Отмена
                </button>
              </div>
            </div>
          ) : (
            <div className="mt-1 text-sm whitespace-pre-wrap leading-relaxed">
              {node.is_deleted ? <i>Комментарий удалён</i> : node.body}
            </div>
          )}

          {!editing && (
            <div className="mt-2 flex flex-wrap items-center gap-2 text-[12px] opacity-90">
              <button
                onClick={() => onLike(node.id, false)}
                className="inline-flex items-center gap-1 px-2 py-[3px] rounded-md border border-[var(--border)] hover:border-[var(--accent)]/60 transition"
                title="Нравится"
                type="button"
              >
                <FiThumbsUp /> {node.likes_count}
              </button>
              <button
                onClick={() => onLike(node.id, true)}
                className="inline-flex items-center gap-1 px-2 py-[3px] rounded-md border border-[var(--border)] hover:border-[var(--accent)]/60 transition"
                title="Снять лайк"
                type="button"
              >
                <FiThumbsDown />
              </button>

              <button
                onClick={() => {
                  if (!requireAuth()) return;
                  setReplyOpen((v) => !v);
                }}
                className="inline-flex items-center gap-1 px-2 py-[3px] rounded-md border border-[var(--border)] hover:border-[var(--accent)]/60 transition"
                title="Ответить"
                type="button"
              >
                <FiMessageCircle />
                Ответить
              </button>

              {node.replies_count > 0 && depth === 0 && (
                <button
                  onClick={() => {
                    const next = !childrenOpen;
                    setChildrenOpen(next);
                    if (next && (!replies || replies.length === 0) && !repliesLoading) {
                      loadReplies();
                    }
                  }}
                  className="ml-1 inline-flex items-center gap-1 px-2 py-[3px] rounded-md border border-[var(--border)] hover:border-[var(--accent)]/60 transition"
                  type="button"
                >
                  {childrenOpen ? <FiChevronUp /> : <FiChevronDown />}
                  {childrenOpen ? `Скрыть ответы (${node.replies_count})` : `Показать ответы (${node.replies_count})`}
                </button>
              )}

              {node.is_pinned ? (
                <span className="ml-auto text-[10px] px-2 py-[2px] rounded bg-amber-500/20 border border-amber-500/30">
                  📌 Закреплён
                </span>
              ) : null}
            </div>
          )}
        </div>

        {replyOpen && !editing && (
          <div className="mt-2">
            <ReplyForm
              materialId={materialId}
              parentId={targetParentId}
              defaultText={isChild ? mentionText : ""}
              onClose={() => setReplyOpen(false)}
              onSuccess={() => {
                onReplied();
                if (childrenOpen && depth === 0) loadReplies();
              }}
              requireAuth={requireAuth}
              callbackUrl={callbackUrl}
            />
          </div>
        )}

        {depth === 0 && childrenOpen && node.replies_count > 0 && (
          <div className="mt-3 border-l border-[var(--border)] pl-3">
            {repliesLoading && <div className="text-xs opacity-70">Загрузка ответов…</div>}
            {replies && (
              <ul className="space-y-3">
                {replies.map((child) => (
                  <li key={child.id}>
                    <CommentNode
                      node={child}
                      depth={1}
                      rootId={rootId ?? node.id}
                      materialId={materialId}
                      onLike={onLike}
                      onReplied={onReplied}
                      replies={[]}
                      repliesLoading={false}
                      loadReplies={() => {}}
                      currentUserId={currentUserId}
                      isStaff={isStaff}
                      onChanged={onChanged}
                      onDeleted={onDeleted}
                      requireAuth={requireAuth}
                      callbackUrl={callbackUrl}
                    />
                  </li>
                ))}
              </ul>
            )}
          </div>
        )}
      </div>
    </div>
  );
}

/* ================== reply form ================== */

function ReplyForm({
  materialId,
  parentId,
  onClose,
  onSuccess,
  defaultText = "",
  requireAuth,
  callbackUrl,
}: {
  materialId: string;
  parentId: number;
  onClose?: () => void;
  onSuccess?: () => void;
  defaultText?: string;
  requireAuth: () => boolean;
  callbackUrl: string;
}) {
  const [text, setText] = useState(defaultText);
  const [busy, setBusy] = useState(false);
  const [err, setErr] = useState<string | null>(null);

  useEffect(() => { setText(defaultText); }, [defaultText]);

  async function submit() {
    if (!requireAuth()) return;
    const body = text.trim();
    if (!body) return;

    try {
      setBusy(true);
      setErr(null);
      await apiPost<CommentItem>(COMMENTS_ENDPOINT, { material: materialId, parent: parentId, body }, { retries: 1 });
      setText("");
      onClose?.();
      onSuccess?.();
    } catch (e: any) {
      setErr(humanizeError(e));
      if (String(e?.message || "").includes("401")) signIn(undefined, { callbackUrl });
    } finally {
      setBusy(false);
    }
  }

  return (
    <div className="rounded-xl border border-[var(--border)] bg-[color:var(--secondary)]/70 p-2">
      <div className="flex items-start gap-2">
        <textarea
          className="w-full resize-y rounded-lg border border-[var(--border)] bg-[color:var(--card)] px-3 py-2 text-sm outline-none focus:ring-2 focus:ring-[var(--accent)]"
          rows={3}
          placeholder="Ваш ответ…"
          value={text}
          onChange={(e) => setText(e.target.value)}
          disabled={busy}
          onFocus={() => { /* доп.страховка: */ if (!requireAuth()) return; }}
        />
        <button
          onClick={onClose}
          className="mt-1 h-8 w-8 shrink-0 rounded-md border border-[var(--border)] hover:border-[var(--accent)]/60 grid place-items-center"
          title="Закрыть"
          type="button"
        >
          <FiX />
        </button>
      </div>
      <div className="mt-2 flex items-center gap-2">
        <button
          onClick={submit}
          disabled={busy || !text.trim()}
          className="inline-flex items-center gap-2 rounded-lg border border-[var(--primary)] bg-[var(--primary)] px-3 py-1.5 text-sm text-[var(--primary-foreground)] hover:opacity-95 disabled:opacity-50"
          type="button"
        >
          <FiSend />
          Отправить
        </button>
        {err && <span className="text-xs text-red-500">{err}</span>}
      </div>
    </div>
  );
}
