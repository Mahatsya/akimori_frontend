import Link from "next/link";
import ProfileHeader from "@/components/profile/ProfileHeader";
import AnimeCard, { Material as CardMaterial } from "@/components/anime/AnimeCard";

export const revalidate = 0;
export const dynamic = "force-dynamic";

/* === Типы API === */
type PublicUser = { id: number; username: string; role?: string; date_joined?: string };
type PublicProfile = {
  user: PublicUser;
  display_name?: string;
  bio?: string;
  avatar_url?: string | null;
  header_url?: string | null;
  frame_url?: string | null;
  xp: number; level: number; max_level: number;
  next_level_total_xp: number; need_for_next: number; progress: number;
};
type Entry = { id: number; status: string; status_display: string; material: CardMaterial };

const STATUSES: { value: string; label: string }[] = [
  { value: "",           label: "Все" },
  { value: "watching",   label: "Смотрю" },
  { value: "planned",    label: "Запланировано" },
  { value: "completed",  label: "Завершено" },
  { value: "on_hold",    label: "Отложено" },
  { value: "dropped",    label: "Брошено" },
];

/* === Утилиты === */
function hrefFor(basePath: string, current: URLSearchParams, patch: Record<string, string | undefined>) {
  const p = new URLSearchParams(current);
  for (const [k, v] of Object.entries(patch)) {
    if (v === undefined || v === "") p.delete(k);
    else p.set(k, v);
  }
  if ("status" in patch || "search" in patch || "page_size" in patch) p.set("page", "1");
  const qs = p.toString();
  return qs ? `${basePath}?${qs}` : basePath;
}
function formatInt(n: number) { return new Intl.NumberFormat("ru-RU").format(n); }
function percent(n: number) { return `${Math.max(0, Math.min(100, Math.round(n * 100)))}%`; }

/* === Страница профиля === */
export default async function Page(props: {
  params: Promise<{ handle: string }>;
  searchParams: Promise<Record<string, string | string[] | undefined>>;
}) {
  const { handle } = await props.params;
  const rawSP = await props.searchParams;

  const apiBase = process.env.API_BASE || process.env.API_BASE;
  if (!apiBase) {
    return (
      <main className="p-6">
        <div className="rounded-xl border border-[var(--border)] bg-[color:var(--secondary)] p-4 text-[var(--foreground)]">
          ❌ Не задан API_BASE / API_BASE в .env.local
        </div>
      </main>
    );
  }
  const API = apiBase.replace(/\/+$/, "");

  // normalize search params
  const sp = new URLSearchParams();
  for (const [k, v] of Object.entries(rawSP)) {
    if (Array.isArray(v)) sp.set(k, v[0] ?? "");
    else if (typeof v === "string") sp.set(k, v);
  }
  const tab = (sp.get("tab") || "overview") as "overview" | "list" | "about";
  const status = sp.get("status") || "";
  const search = sp.get("search") || "";
  const page = Math.max(1, parseInt(sp.get("page") || "1", 10));
  const page_size = Math.min(60, Math.max(6, parseInt(sp.get("page_size") || "24", 10)));

  // 1) Профиль
  let profile: PublicProfile | null = null;
  try {
    const r = await fetch(`${API}/api/users/${encodeURIComponent(handle)}/profile/`, { cache: "no-store" });
    if (r.ok) profile = await r.json();
  } catch {}
  if (!profile) {
    return (
      <main className="container mx-auto px-4 py-8">
        <div className="rounded-xl border border-[var(--border)] bg-[color:var(--secondary)] p-4 text-[var(--foreground)]">
          Не удалось получить профиль. Проверь доступность API: <code>{API}</code>.
        </div>
      </main>
    );
  }

  // 2) Закладки
  let entries: Entry[] = [];
  let count = 0;
  try {
    const url = new URL(`${API}/api/users/${encodeURIComponent(handle)}/anime/`);
    if (status) url.searchParams.set("status", status);
    if (search) url.searchParams.set("search", search);
    url.searchParams.set("page", String(page));
    url.searchParams.set("page_size", String(page_size));
    const r = await fetch(url.toString(), { cache: "no-store" });
    const data = await r.json().catch(() => ({}));
    entries = Array.isArray(data) ? data : data?.results ?? [];
    count   = Array.isArray(data) ? entries.length : data?.count ?? entries.length;
  } catch {}

  const totalPages = Math.max(1, Math.ceil(count / page_size));
  const basePath = `/user/${handle}`;
  const start = Math.max(1, page - 2);
  const end = Math.min(totalPages, page + 2);
  const pages = Array.from({ length: end - start + 1 }, (_, i) => start + i);
  const recent = entries.slice(0, 6);

  return (
    <main className="min-h-screen bg-[color:var(--background)] text-[var(--foreground)]">
      {/* Шапка профиля */}
      <section className="border-b border-[var(--border)] bg-[color:var(--card)]">
        <div className="mx-auto max-w-7xl px-4 py-8">
          <ProfileHeader
            data={profile}
            isOwner={false}
            headerUrl={profile.header_url ?? null}
            frameUrl={profile.frame_url ?? null}
          />
        </div>
      </section>

      {/* Липкая навигация по вкладкам */}
      <div className="sticky top-0 z-10 border-b border-[var(--border)] bg-[color:var(--card)]/75 backdrop-blur supports-[backdrop-filter]:bg-[color:var(--card)]/60">
        <div className="mx-auto max-w-7xl px-4">
          <nav className="flex flex-wrap items-center gap-2 py-2">
            {[
              { key: "overview", label: "Обзор" },
              { key: "list",     label: "Список" },
              { key: "about",    label: "О пользователе" },
            ].map(t => {
              const active = tab === (t.key as typeof tab);
              return (
                <Link
                  key={t.key}
                  href={hrefFor(basePath, sp, { tab: t.key })}
                  className={`rounded-xl border px-3 py-1.5 text-sm transition
                    ${active
                      ? "bg-[var(--primary)] text-[var(--primary-foreground)] border-[var(--primary)]"
                      : "text-[var(--foreground)]/85 border-[var(--border)] hover:bg-[color:var(--secondary)]"}`}
                >
                  {t.label}
                </Link>
              );
            })}
            <span className="ml-auto hidden items-center gap-2 text-xs text-[color:var(--foreground)]/60 sm:flex">
              <span className="h-1.5 w-1.5 rounded-full bg-[var(--accent)]" />
              Обновлено в реальном времени
            </span>
          </nav>
        </div>
      </div>

      {/* Контент вкладок */}
      <section className="mx-auto max-w-7xl px-4 pb-10">
        {tab === "overview" && (
          <div className="mt-6 grid gap-6 lg:grid-cols-3">
            {/* Статус */}
            <div className="rounded-2xl border border-[var(--border)] bg-[color:var(--card)] p-5 shadow-[0_10px_40px_-20px_rgba(0,0,0,.35)]">
              <h3 className="mb-3 text-lg font-semibold tracking-tight">Статус профиля</h3>
              <div className="space-y-3 text-sm text-[color:var(--foreground)]/85">
                <div className="flex items-center justify-between">
                  <span>Уровень</span>
                  <span className="font-medium">{profile.level} / {profile.max_level}</span>
                </div>
                <div>
                  <div className="mb-1 flex items-center justify-between text-xs text-[color:var(--foreground)]/65">
                    <span>Опыт</span>
                    <span>{formatInt(profile.xp)} XP</span>
                  </div>
                  <div className="h-2 overflow-hidden rounded-full bg-[color:var(--secondary)]">
                    <div
                      className="h-full animate-[grow_1.2s_ease-out] rounded-full"
                      style={{ width: percent(profile.progress), background: "linear-gradient(90deg,var(--accent),var(--primary))" }}
                    />
                  </div>
                  <div className="mt-1 text-xs text-[color:var(--foreground)]/65">
                    До следующего уровня: {formatInt(profile.need_for_next)} XP
                  </div>
                </div>
              </div>
            </div>

            {/* О пользователе */}
            <div className="rounded-2xl border border-[var(--border)] bg-[color:var(--card)] p-5 lg:col-span-2 shadow-[0_10px_40px_-20px_rgba(0,0,0,.35)]">
              <h3 className="mb-3 text-lg font-semibold tracking-tight">О пользователе</h3>
              {profile.bio?.trim()
                ? <p className="whitespace-pre-wrap text-[color:var(--foreground)]/90">{profile.bio}</p>
                : <p className="text-[color:var(--foreground)]/60">Пока нет описания.</p>}
            </div>

            {/* Недавние */}
            <div className="rounded-2xl border border-[var(--border)] bg-[color:var(--card)] p-5 lg:col-span-3 shadow-[0_10px_40px_-20px_rgba(0,0,0,.35)]">
              <div className="mb-4 flex items-center justify-between">
                <h3 className="text-lg font-semibold tracking-tight">Недавние</h3>
                <Link
                  href={hrefFor(basePath, sp, { tab: "list" })}
                  className="text-sm underline underline-offset-4 text-[color:var(--foreground)]/75 hover:text-[color:var(--foreground)]"
                >
                  Перейти к списку →
                </Link>
              </div>
              {recent.length === 0 ? (
                <div className="rounded-xl border border-[var(--border)] bg-[color:var(--secondary)] p-6 text-[color:var(--foreground)]/80">
                  Пусто. Добавляйте тайтлы в закладки со страницы аниме.
                </div>
              ) : (
                <ul className="grid grid-cols-2 gap-4 sm:grid-cols-3 md:grid-cols-4 xl:grid-cols-6">
                  {recent.map((e) => (
                    <li key={e.id}><AnimeCard m={e.material} /></li>
                  ))}
                </ul>
              )}
            </div>
          </div>
        )}

        {tab === "list" && (
          <div className="mt-6">
            {/* Фильтры */}
            <div className="rounded-2xl border border-[var(--border)] bg-[color:var(--secondary)]/80 p-4 backdrop-blur supports-[backdrop-filter]:bg-[color:var(--secondary)]/60">
              <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
                <div className="flex flex-wrap gap-2">
                  {STATUSES.map((s) => {
                    const active = (status || "") === s.value;
                    return (
                      <Link
                        key={s.value || "all"}
                        href={hrefFor(basePath, sp, { tab: "list", status: s.value || undefined })}
                        className={`rounded-full border px-3 py-1.5 text-sm transition
                          ${active
                            ? "border-[var(--primary)] bg-[var(--primary)] text-[var(--primary-foreground)]"
                            : "border-[var(--border)] text-[var(--foreground)]/85 hover:bg-[color:var(--card)]/60"}`}
                      >
                        {s.label}
                      </Link>
                    );
                  })}
                </div>
                <form method="get" className="flex flex-wrap gap-2">
                  <input type="hidden" name="tab" value="list" />
                  {status && <input type="hidden" name="status" value={status} />}
                  <input
                    name="search"
                    defaultValue={search}
                    placeholder="Поиск по названию…"
                    className="min-w-[220px] rounded-xl border border-[var(--border)] bg-[color:var(--secondary)] px-3 py-2 text-[var(--foreground)] placeholder-[color:var(--foreground)]/50 focus:outline-none focus:ring-2 focus:ring-[var(--accent)]"
                  />
                  <select
                    name="page_size"
                    defaultValue={String(page_size)}
                    className="rounded-xl border border-[var(--border)] bg-[color:var(--secondary)] px-3 py-2 text-[var(--foreground)]"
                  >
                    {[12, 24, 36, 48].map((n) => (<option key={n} value={n}>{n}/стр.</option>))}
                  </select>
                  <button
                    type="submit"
                    className="rounded-xl border border-[var(--primary)] bg-[var(--primary)] px-4 py-2 text-[var(--primary-foreground)] transition hover:opacity-95"
                  >
                    Применить
                  </button>
                </form>
              </div>
            </div>

            {/* Список */}
            <div className="mt-6">
              <div className="mb-4 flex items-center justify-between">
                <h2 className="text-xl font-semibold tracking-tight">Закладки</h2>
                <div className="text-sm text-[color:var(--foreground)]/65">{count} позиций</div>
              </div>

              {entries.length === 0 ? (
                <div className="rounded-xl border border-[var(--border)] bg-[color:var(--secondary)] p-6 text-[color:var(--foreground)]/80">
                  По заданным условиям ничего не найдено.
                </div>
              ) : (
                <>
                  <ul className="grid grid-cols-2 gap-4 sm:grid-cols-3 md:grid-cols-4 xl:grid-cols-6">
                    {entries.map((e) => (<li key={e.id}><AnimeCard m={e.material} /></li>))}
                  </ul>

                  <nav className="mt-6 flex items-center justify-center gap-2">
                    <Link
                      aria-disabled={page <= 1}
                      className={`rounded-lg border px-3 py-1.5 ${page <= 1
                        ? "pointer-events-none border-[var(--border)]/60 text-[color:var(--foreground)]/35"
                        : "border-[var(--border)] hover:bg-[color:var(--secondary)]"}`}
                      href={hrefFor(basePath, sp, { tab: "list", page: String(Math.max(1, page - 1)) })}
                    >
                      ← Назад
                    </Link>
                    {pages.map((p) => (
                      <Link
                        key={p}
                        className={`rounded-lg border px-3 py-1.5 text-sm ${p === page
                          ? "border-[var(--primary)] bg-[var(--primary)] text-[var(--primary-foreground)]"
                          : "border-[var(--border)] hover:bg-[color:var(--secondary)]"}`}
                        href={hrefFor(basePath, sp, { tab: "list", page: String(p) })}
                      >
                        {p}
                      </Link>
                    ))}
                    <Link
                      aria-disabled={page >= totalPages}
                      className={`rounded-lg border px-3 py-1.5 ${page >= totalPages
                        ? "pointer-events-none border-[var(--border)]/60 text-[color:var(--foreground)]/35"
                        : "border-[var(--border)] hover:bg-[color:var(--secondary)]"}`}
                      href={hrefFor(basePath, sp, { tab: "list", page: String(Math.min(totalPages, page + 1)) })}
                    >
                      Вперёд →
                    </Link>
                  </nav>
                </>
              )}
            </div>
          </div>
        )}

        {tab === "about" && (
          <div className="mt-6 grid gap-6 lg:grid-cols-3">
            <div className="rounded-2xl border border-[var(--border)] bg-[color:var(--card)] p-5 lg:col-span-2 shadow-[0_10px_40px_-20px_rgba(0,0,0,.35)]">
              <h3 className="mb-3 text-lg font-semibold tracking-tight">О пользователе</h3>
              {profile.bio?.trim()
                ? <p className="whitespace-pre-wrap text-[color:var(--foreground)]/90">{profile.bio}</p>
                : <p className="text-[color:var(--foreground)]/60">Пока нет описания.</p>}
            </div>
            <div className="rounded-2xl border border-[var(--border)] bg-[color:var(--card)] p-5 shadow-[0_10px_40px_-20px_rgba(0,0,0,.35)]">
              <h3 className="mb-3 text-lg font-semibold tracking-tight">Статистика</h3>
              <ul className="space-y-2 text-sm text-[color:var(--foreground)]/85">
                <li className="flex items-center justify-between"><span>Уровень</span><span className="font-medium">{profile.level}</span></li>
                <li className="flex items-center justify-between"><span>Опыт</span><span className="font-medium">{formatInt(profile.xp)} XP</span></li>
                <li className="flex items-center justify-between"><span>Прогресс</span><span className="font-medium">{percent(profile.progress)}</span></li>
                <li className="flex items-center justify-between"><span>До след. уровня</span><span className="font-medium">{formatInt(profile.need_for_next)} XP</span></li>
              </ul>
            </div>
          </div>
        )}
      </section>
    </main>
  );
}
