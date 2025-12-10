"use client";

import React, { useEffect, useMemo, useState } from "react";
import { createPortal } from "react-dom";
import { SoftCard } from "./atoms";
import { RiStarFill } from "react-icons/ri";
import { SiKinopoisk, SiImdb, SiShikimori, SiMyanimelist } from "react-icons/si";
import { useSession, signIn } from "next-auth/react";
import { usePathname, useSearchParams } from "next/navigation";

/* ============ helpers ============ */
type Props = {
  materialId: string;
  kp?: number | null;
  imdb?: number | null;
  shiki?: number | null;
  mdl?: number | null;
  aki?: number | null;
  akiVotes?: number | null;
  updatedAt: string;
  total?: number | null;
  aired?: number | null;
  status?: string | null;
};
function isNum(v: unknown): v is number { return typeof v === "number" && Number.isFinite(v); }
function fmtDate(d: string | number | Date) { try { return new Date(d).toLocaleDateString(); } catch { return ""; } }
function toneFor(value: number) {
  if (value >= 8.5) return { ring: "ring-1 ring-[color:var(--accent)]/60", text: "text-[var(--accent)]", badge: "bg-[var(--accent)] text-[var(--accent-foreground)]" };
  if (value >= 7.0) return { ring: "ring-1 ring-emerald-500/40", text: "text-emerald-400", badge: "bg-emerald-500 text-white" };
  if (value >= 5.0) return { ring: "ring-1 ring-amber-500/40", text: "text-amber-400", badge: "bg-amber-500 text-black" };
  return { ring: "ring-1 ring-rose-500/40", text: "text-rose-400", badge: "bg-rose-500 text-white" };
}

type TileProps = { label: string; value?: number | null; icon?: React.ReactNode; sub?: React.ReactNode };
function RatingTile({ label, value, icon, sub }: TileProps) {
  if (!isNum(value)) return null;
  const t = toneFor(value);
  return (
    <div className={["relative rounded-xl border border-[var(--border)] p-3 sm:p-4 shadow-[0_8px_30px_-20px_rgba(0,0,0,.35)] bg-[var(--secondary)]", t.ring].join(" ")}>
      <div className="flex items-center justify-between mb-1.5">
        <div className="flex items-center gap-2 text-[11px] opacity-80">
          {icon ? <span className="text-base opacity-90">{icon}</span> : null}
          <span className="uppercase tracking-wide">{label}</span>
        </div>
        <span className={["inline-flex items-center gap-1 px-1.5 py-[2px] rounded-md text-[10px] font-semibold", t.badge].join(" ")}>
          <RiStarFill className="text-[12px]" /> /10
        </span>
      </div>
      <div className={["text-3xl font-extrabold tabular-nums", t.text].join(" ")}>{value.toFixed(1)}</div>
      {sub ? <div className="mt-1 text-[10px] opacity-70">{sub}</div> : null}
    </div>
  );
}

/* ============ STAR PICKER (портал, только целые 1–10, hover-превью) ============ */

function StarFull({ filled }: { filled: boolean }) {
  return (
    <svg viewBox="0 0 24 24" className="h-9 w-9">
      <path
        d="M12 17.27 18.18 21 16.54 13.97 22 9.24l-7.19-.61L12 2 9.19 8.63 2 9.24l5.46 4.73L5.82 21z"
        fill={filled ? "currentColor" : "none"}
        stroke="currentColor"
        strokeOpacity={filled ? 0 : 0.35}
      />
    </svg>
  );
}

type StarPickerProps = {
  value: number | null;
  onChange: (v: number | null) => void;           // обновить в карточке (после submit)
  onSubmit: (v: number | null) => Promise<void>;  // POST/DELETE
  onClose: () => void;
};
function StarPickerPortal({ value, onChange, onSubmit, onClose }: StarPickerProps) {
  const [local, setLocal] = useState<number | null>(value);
  const [hover, setHover] = useState<number | null>(null);
  const [busy, setBusy] = useState(false);
  const [mounted, setMounted] = useState(false);
  const steps = useMemo(() => Array.from({ length: 10 }, (_, i) => i + 1), []);

  useEffect(() => {
    setMounted(true);
    const onEsc = (e: KeyboardEvent) => { if (e.key === "Escape") onClose(); };
    const prev = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    window.addEventListener("keydown", onEsc);
    return () => {
      document.body.style.overflow = prev;
      window.removeEventListener("keydown", onEsc);
    };
  }, [onClose]);

  async function handleSave() {
    setBusy(true);
    try {
      await onSubmit(local);
      onChange(local); // сразу показать «Моя оценка: N»
      onClose();
    } finally { setBusy(false); }
  }

  if (!mounted) return null;

  const visual = hover ?? local ?? 0;

  return createPortal(
    <div
      role="dialog"
      aria-modal="true"
      className="fixed inset-0 z-[100] flex items-center justify-center bg-transparent"
      onMouseDown={(e) => { if (e.target === e.currentTarget) onClose(); }}
    >
      <div className="w-[min(92vw,560px)] rounded-2xl border border-white/15
                      bg-black/45 backdrop-blur-md text-white p-6
                      shadow-[0_20px_80px_-20px_rgba(0,0,0,.6)]">
        <div className="flex items-center justify-between mb-4">
          <h4 className="text-base font-semibold">Выберите целую оценку</h4>
          <button className="text-xs px-2 py-1 rounded-md border border-white/15 hover:bg-white/10" onClick={onClose}>
            Закрыть
          </button>
        </div>

        {/* звезды с hover-превью */}
        <div className="mt-1 flex items-center justify-center gap-2">
          {steps.map((v) => {
            const active = visual >= v;
            return (
              <button
                key={v}
                type="button"
                aria-label={`${v} из 10`}
                className={["text-[var(--accent)] transition-opacity", active ? "" : "opacity-30 hover:opacity-70"].join(" ")}
                onMouseEnter={() => setHover(v)}
                onMouseLeave={() => setHover(null)}
                onClick={() => setLocal(v)}
              >
                <StarFull filled={active} />
              </button>
            );
          })}
        </div>

        <div className="mt-5 flex items-center justify-between">
          <button
            className="text-xs px-3 py-1.5 rounded-md border border-white/15 hover:bg-white/10"
            onClick={() => setLocal(null)}
            disabled={busy}
            title="Сбросить оценку"
          >
            Сбросить
          </button>
          <div className="flex items-center gap-3">
            <div className="text-xs opacity-80">Текущая: {local ?? "—"}</div>
            <button
              className="text-xs px-3 py-1.5 rounded-md bg-[var(--accent)] text-[var(--accent-foreground)] hover:opacity-90 disabled:opacity-60"
              onClick={handleSave}
              disabled={busy}
            >
              Сохранить
            </button>
          </div>
        </div>
      </div>
    </div>,
    document.body
  );
}

/* ============ MAIN CARD ============ */

export default function RatingsCard({
  materialId, kp, imdb, shiki, mdl, aki, akiVotes, updatedAt, total, aired, status,
}: Props) {
  const [ourAvg, setOurAvg] = useState<number | null>(isNum(aki) ? aki! : null);
  const [ourVotes, setOurVotes] = useState<number | null>(isNum(akiVotes) ? akiVotes! : null);

  const tiles = [
    { key: "AKI", value: ourAvg, icon: <RiStarFill />, sub: isNum(ourVotes) ? `${ourVotes} голосов` : null },
    { key: "KP", value: kp, icon: <SiKinopoisk /> },
    { key: "IMDb", value: imdb, icon: <SiImdb /> },
    { key: "SHIKI", value: shiki, icon: <SiShikimori /> },
    { key: "MDL", value: mdl, icon: <SiMyanimelist /> },
  ].filter((t) => isNum(t.value));

  // прогресс
  const totalEff = isNum(total) && total > 0 ? total : null;
  let airedEff: number | null =
    isNum(aired) ? Math.max(0, aired) : status?.toLowerCase() === "released" && totalEff !== null ? totalEff : null;
  if (totalEff !== null && airedEff !== null) airedEff = Math.min(airedEff, totalEff);
  const showProgress = totalEff !== null && airedEff !== null;
  const progress = showProgress && totalEff! > 0 ? Math.round((airedEff! / totalEff!) * 100) : 0;

  // auth/session & callback
  const { status: authStatus } = useSession(); // 'authenticated' | 'unauthenticated' | 'loading'
  const pathname = usePathname();
  const search = useSearchParams();
  const callbackUrl = useMemo(() => {
    const qs = search?.toString();
    return qs ? `${pathname}?${qs}` : pathname;
  }, [pathname, search]);

  // guard
  function requireAuth(run: () => void) {
    if (authStatus !== "authenticated") {
      signIn(undefined, { callbackUrl });
      return;
    }
    run();
  }

  // модалка
  const [openPicker, setOpenPicker] = useState(false);
  const [myScore, setMyScore] = useState<number | null>(null);

  // загрузка моей текущей оценки (только когда авторизован)
  useEffect(() => {
    if (authStatus !== "authenticated") { setMyScore(null); return; }
    let aborted = false;
    (async () => {
      try {
        const r = await fetch(
          `/api/proxy/kodik/aki/ratings/me?material=${encodeURIComponent(materialId)}`,
          { method: "GET", credentials: "include", headers: { "x-client": "aki-my-rating" } }
        );
        if (!r.ok) return;
        const data = await r.json();
        const item = Array.isArray(data?.results) ? data.results[0] : data;
        if (!aborted && item && typeof item.score === "number") setMyScore(item.score);
      } catch {}
    })();
    return () => { aborted = true; };
  }, [materialId, authStatus]);

  async function submitScore(score: number | null) {
    if (authStatus !== "authenticated") {
      signIn(undefined, { callbackUrl });
      throw new Error("save-failed");
    }
    const prev = myScore;
    setMyScore(score); // оптимистично
    try {
      let res: Response;
      if (score === null) {
        res = await fetch(`/api/proxy/kodik/aki/ratings/clear?material=${encodeURIComponent(materialId)}`, {
          method: "DELETE",
          credentials: "include",
          headers: { "x-client": "aki-rating-clear" },
        });
      } else {
        res = await fetch(`/api/proxy/kodik/aki/ratings`, {
          method: "POST",
          credentials: "include",
          headers: { "Content-Type": "application/json", "x-client": "aki-rating-set" },
          body: JSON.stringify({ material: materialId, score }),
        });
      }
      if (!res.ok) throw new Error(String(res.status));
      const payload = await res.json().catch(() => ({}));
      if (typeof payload.avg === "number") setOurAvg(payload.avg);
      if (typeof payload.votes === "number") setOurVotes(payload.votes);
    } catch {
      setMyScore(prev); // откат
      throw new Error("save-failed");
    }
  }

  const hasMyScore = isNum(myScore);

  return (
    <SoftCard className="relative p-4 md:w-[260px] md:shrink-0 lg:sticky lg:top-6 rounded-2xl border border-[var(--border)] bg-[color:var(--card)]/90 backdrop-blur-md">
      {/* Заголовок */}
      <div className="flex items-center justify-between mb-3">
        <h3 className="text-sm font-semibold tracking-wide opacity-90">Рейтинги</h3>
        <span className="text-[10px] opacity-60">Обновлено: {fmtDate(updatedAt)}</span>
      </div>

      {/* Сетка рейтингов */}
      {tiles.length ? (
        <div className="grid grid-cols-2 gap-3">
          {tiles.map((t) => (
            <RatingTile key={t.key} label={t.key} value={t.value as number} icon={t.icon} sub={t.sub} />
          ))}
        </div>
      ) : (
        <div className="text-xs opacity-60 text-center py-4 border border-dashed border-[var(--border)] rounded-lg">
          Нет данных о рейтингах
        </div>
      )}

      {/* Прогресс */}
      <div className="mt-4">
        <div className="flex items-baseline justify-between mb-1">
          <span className="text-[11px] opacity-80">Эпизоды</span>
          <span className="text-[11px] font-semibold opacity-80">
            {showProgress ? `${airedEff}/${totalEff} • ${progress}%` : "—"}
          </span>
        </div>
        <div className="h-2 rounded-md bg-black/10 overflow-hidden">
          <div className="h-full rounded-md bg-[var(--accent)] transition-all" style={{ width: `${progress}%` }} />
        </div>
      </div>

      {/* Моя оценка + кнопки */}
      <div className="mt-4 flex items-center justify-between">
        <div className="text-xs opacity-70">
          Моя оценка: <span className="font-semibold">{hasMyScore ? myScore : "—"}</span>
        </div>
        <div className="flex items-center gap-2">
          {hasMyScore ? (
            <button
              type="button"
              onClick={() => requireAuth(() => submitScore(null))}
              className="text-[11px] px-2 py-1 rounded-md border border-[var(--border)] hover:bg-white/5"
              title="Сбросить оценку"
            >
              Сбросить
            </button>
          ) : null}
          <button
            type="button"
            onClick={() => requireAuth(() => setOpenPicker(true))}
            className="text-xs px-3 py-1.5 rounded-md bg-[var(--accent)] text-[var(--accent-foreground)] hover:opacity-90"
          >
            {hasMyScore ? "Изменить" : "Дать оценку"}
          </button>
        </div>
      </div>

      {/* Подсказка */}
      {hasMyScore ? (
        <div className="mt-2 text-[11px] opacity-70">
          Оценка уже указана. Нажмите «Изменить», чтобы поменять.
        </div>
      ) : (
        <div className="mt-2 text-[11px] opacity-60">Вы ещё не оценивали этот тайтл.</div>
      )}

      {/* Портальная модалка */}
      {openPicker && (
        <StarPickerPortal
          value={myScore}
          onChange={(v) => setMyScore(v)}
          onSubmit={submitScore}
          onClose={() => setOpenPicker(false)}
        />
      )}
    </SoftCard>
  );
}
