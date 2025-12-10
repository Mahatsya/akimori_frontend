"use client";

import { useState, useRef, useEffect } from "react";
import { usePathname, useRouter } from "next/navigation";
import { useSession, signIn } from "next-auth/react";

type Props = {
  slug: string;
  /** watching | planned | completed | on_hold | dropped | null */
  initialStatus?: string | null;
};

const STATUSES: { value: "" | "watching" | "planned" | "completed" | "on_hold" | "dropped"; label: string }[] = [
  { value: "",           label: "Не выбрано" },
  { value: "watching",   label: "Смотрю" },
  { value: "planned",    label: "Запланировано" },
  { value: "completed",  label: "Завершено" },
  { value: "on_hold",    label: "Отложено" },
  { value: "dropped",    label: "Брошено" },
];

export default function BookmarkButton({ slug, initialStatus = null }: Props) {
  const { data } = useSession();
  const access = (data as any)?.access as string | undefined;

  const router = useRouter();
  const pathname = usePathname();

  const [open, setOpen] = useState(false);
  const [status, setStatus] = useState<string | null>(initialStatus);
  const [loading, setLoading] = useState(false);
  const [err, setErr] = useState<string | null>(null);
  const boxRef = useRef<HTMLDivElement | null>(null);

  useEffect(() => {
    function onDoc(e: MouseEvent) {
      if (!boxRef.current) return;
      if (!boxRef.current.contains(e.target as Node)) setOpen(false);
    }
    document.addEventListener("mousedown", onDoc);
    return () => document.removeEventListener("mousedown", onDoc);
  }, []);

  // Догрузка текущего статуса после монтирования/логина
  useEffect(() => {
    let ignore = false;
    async function load() {
      if (!access || !slug) return;
      if (status && status !== "") return; // уже знаем

      const base =
        (process.env.API_BASE as string | undefined) ||
        (typeof window !== "undefined" ? window.location.origin : "");
      const API = base.replace(/\/+$/, "");

      try {
        const r = await fetch(
          `${API}/api/users/me/anime/?search=${encodeURIComponent(slug)}&page_size=1`,
          { headers: { Authorization: `Bearer ${access}` } }
        );
        if (!r.ok) return;
        const data = await r.json().catch(() => ({}));
        const item = Array.isArray(data)
          ? data.find((x: any) => x?.material?.slug === slug)
          : (data?.results ?? []).find((x: any) => x?.material?.slug === slug);
        if (!ignore && item?.status) setStatus(item.status);
      } catch {
        // молча игнорируем
      }
    }
    load();
    return () => { ignore = true; };
  }, [access, slug, status]);

  async function choose(next: string) {
    if (!access) {
      await signIn(undefined, { callbackUrl: pathname || "/" });
      return;
    }
    if (!slug) {
      setErr("Нет slug материала");
      return;
    }

    try {
      setLoading(true);
      setErr(null);

      const base =
        (process.env.API_BASE as string | undefined) ||
        (typeof window !== "undefined" ? window.location.origin : "");
      const API = base.replace(/\/+$/, "");

      const res = await fetch(`${API}/api/users/me/anime/upsert_by_slug/`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${access}`,
        },
        body: JSON.stringify({ material_slug: slug, status: next }),
      });

      if (!res.ok) {
        const data = await res.json().catch(() => ({}));
        throw new Error(data?.detail || "Не удалось сохранить");
      }

      setStatus(next || null);
      setOpen(false);
      router.refresh();
    } catch (e: any) {
      setErr(e?.message || "Ошибка");
    } finally {
      setLoading(false);
    }
  }

  const current = (status && STATUSES.find((s) => s.value === status)?.label) || "Не выбрано";

  return (
    <div className="relative" ref={boxRef}>
      <button
        type="button"
        onClick={() => setOpen((v) => !v)}
        disabled={loading}
        className="group w-full justify-center flex items-center flex-col text-left rounded-xl py-2.5 px-3 border border-[var(--border)] bg-[color:var(--secondary)] hover:opacity-95 transition text-sm focus:outline-none focus:ring-2 focus:ring-[var(--accent)]"
        title="Добавить в закладки / сменить статус"
      >
        <span className="block font-medium">{status ? "В закладках:" : "В закладки"}</span>
        <span className="block text-xs text-[color:var(--foreground)/0.7]">{current}</span>
      </button>

      {open && (
        <div className="absolute z-10 mt-2 w-[220px] rounded-xl border border-[var(--border)] bg-[color:var(--background)/0.95] backdrop-blur p-1 shadow-xl">
          {STATUSES.map((s) => (
            <button
              key={s.value || "none"}
              onClick={() => choose(s.value)}
              className={`w-full text-left px-3 py-2 rounded-lg text-sm transition
                ${s.value === status
                  ? "bg-[var(--primary)] text-[var(--primary-foreground)] border border-[var(--primary)]"
                  : "text-[var(--foreground)] hover:bg-[color:var(--secondary)] border border-transparent"}`}
              disabled={loading}
            >
              {s.label}
            </button>
          ))}
          {err && <div className="px-3 py-2 text-xs text-red-400">{err}</div>}
        </div>
      )}
    </div>
  );
}
