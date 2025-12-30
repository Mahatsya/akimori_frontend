// src/components/layout/SiteHeader.tsx
"use client";

import Link from "next/link";
import Image from "next/image";
import { usePathname, useRouter } from "next/navigation";
import { useSession, signIn, signOut } from "next-auth/react";
import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { useTheme } from "next-themes";
import UserAvatar from "@/components/profile/UserAvatar";
import {
  FiMenu,
  FiSearch,
  FiBell,
  FiBookmark,
  FiChevronRight,
  FiRefreshCw,
  FiSettings,
  FiLogOut,
  FiShoppingBag,
  FiPlusCircle,
  FiCoffee,
  FiFeather,
  FiClock,
} from "react-icons/fi";
import { FaBrain, FaRegComment } from "react-icons/fa";
import { listMyWallets, type Wallet } from "@/lib/economyApi";

const NAV = [
  { href: "/anime", label: "Аниме" },
  { href: "/manga", label: "Манга" },
  { href: "/forum", label: "Форум" },
  { href: "/news", label: "Новости" },
] as const;

function clsx(...a: Array<string | false | null | undefined>) {
  return a.filter(Boolean).join(" ");
}

export function useClickOutside(
  ref: React.RefObject<HTMLElement | null>,
  handler: (event: MouseEvent | TouchEvent) => void
) {
  useEffect(() => {
    function listener(event: MouseEvent | TouchEvent) {
      const el = ref?.current;
      if (!el || el.contains(event.target as Node)) return;
      handler(event);
    }
    document.addEventListener("mousedown", listener);
    document.addEventListener("touchstart", listener);
    return () => {
      document.removeEventListener("mousedown", listener);
      document.removeEventListener("touchstart", listener);
    };
  }, [ref, handler]);
}

export default function SiteHeader() {
  const pathname = usePathname();
  const router = useRouter();
  const { data: session, status } = useSession();
  const [q, setQ] = useState("");

  const [mounted, setMounted] = useState(false);
  useEffect(() => setMounted(true), []);

  const isActive = (href: string) =>
    mounted && (pathname === href || pathname.startsWith(href + "/"));
  const user = mounted ? (session as any)?.user : null;

  // access-токен для SimpleJWT
  const access =
    mounted && session
      ? (session as any)?.backendTokens?.access ?? null
      : null;

  // avatar urls (единый эндпоинт /api/avatar)
  const { avatarSrc, frameSrc, avatarUsername } = useMemo(() => {
    const id: number | string | undefined =
      user?.id ?? user?.user_id ?? undefined;
    const usernameSeed: string =
      (user?.username as string) ||
      (user?.name as string) ||
      (user?.email as string) ||
      "guest";

    const avatarQuery = id
      ? `id=${encodeURIComponent(String(id))}`
      : `seed=${encodeURIComponent(usernameSeed)}`;

    return {
      avatarSrc: `/api/avatar?${avatarQuery}`,
      frameSrc: `/api/avatar?${avatarQuery}&kind=frame`,
      avatarUsername: usernameSeed,
    };
  }, [user]);

  // ссылка в профиль
  const profileHref = useMemo(() => {
    if (!user) return "/user/profile";
    const uname = (user.username || "").trim();
    return uname
      ? `/user/${encodeURIComponent(uname)}`
      : `/user/${user.id ?? "me"}`;
  }, [user]);

  // поиск
  const onSubmit = useCallback(
    (e: React.FormEvent) => {
      e.preventDefault();
      const s = q.trim();
      router.push(s ? `/anime?search=${encodeURIComponent(s)}` : "/anime");
    },
    [q, router]
  );

  // меню пользователя
  const [openUser, setOpenUser] = useState(false);
  const userRef = useRef<HTMLDivElement>(null);
  useClickOutside(userRef, () => setOpenUser(false));
  useEffect(() => setOpenUser(false), [pathname]);

  // мобильное меню
  const [openMobile, setOpenMobile] = useState(false);
  const mobileRef = useRef<HTMLDivElement>(null);
  useClickOutside(mobileRef, () => setOpenMobile(false));
  useEffect(() => setOpenMobile(false), [pathname]);

  // ─────────────────────────────────────────
  // Баланс (ленивая загрузка при открытии меню)
  const [wallets, setWallets] = useState<Wallet[] | null>(null);
  const [wLoading, setWLoading] = useState(false);
  const [wError, setWError] = useState<string | null>(null);

  useEffect(() => {
    if (!openUser || wallets || status !== "authenticated" || !access) return;
    const ctrl = new AbortController();
    setWLoading(true);
    setWError(null);

    listMyWallets(access, ctrl.signal)
      .then((ws) => {
        // сортировка: AKI первым
        ws.sort(
          (a, b) =>
            (a.currency === "AKI" ? -1 : 1) -
            (b.currency === "AKI" ? -1 : 1)
        );
        setWallets(ws);
      })
      .catch((e: any) =>
        setWError(e?.message || "Не удалось загрузить баланс")
      )
      .finally(() => setWLoading(false));

    return () => ctrl.abort();
  }, [openUser, wallets, status, access]);
  // ─────────────────────────────────────────

  return (
    <header className="sticky top-0 z-40 w-full border-b border-[var(--border)] bg-[color:var(--background)/0.7] backdrop-blur supports-[backdrop-filter]:bg-[color:var(--background)/0.6]">
      <div className="mx-auto max-w-7xl px-4 sm:px-5">
        <div className="h-20 flex items-center gap-2">
          {/* mobile menu */}
          <button
            type="button"
            aria-label="Меню"
            className="md:hidden grid place-items-center size-10 rounded-full border border-[var(--border)] bg-[color:var(--secondary)] hover:opacity-90"
            onClick={() => setOpenMobile((v) => !v)}
            title="Меню"
          >
            <FiMenu className="text-[var(--foreground)]/85" size={20} />
          </button>

          {/* logo */}
          <Link
            href="/"
            className="flex items-center gap-2 shrink-0"
            aria-label="На главную"
          >
            <div className="relative">
              <div className="relative size-9 rounded-full overflow-hidden bg-[color:var(--card)] hover:ring-indigo-500/60 transition-all">
                <Image
                  src="/logo.png"
                  alt="AKI"
                  fill
                  sizes="(max-width: 640px) 36px, (max-width: 1024px) 36px, 36px"
                  priority
                  unoptimized
                />
              </div>

              {/* Beta badge */}
              <span
                className="
                  absolute -right-2 -bottom-2
                  text-[10px] font-semibold tracking-wide
                  text-[color:var(--foreground)/1]
                "
              >
                Beta
              </span>
            </div>
          </Link>


          {/* nav */}
          <nav className="hidden md:flex items-center gap-2">
            {NAV.map((i) => (
              <Link
                key={i.href}
                href={i.href}
                className={clsx(
                  "px-3.5 py-2 rounded-full border text-[14px] transition",
                  isActive(i.href)
                    ? "bg-[var(--primary)] text-[var(--primary-foreground)] border-[var(--primary)]"
                    : "text-[color:var(--foreground)/0.85] border-[var(--border)] hover:bg-[color:var(--secondary)]"
                )}
              >
                {i.label}
              </Link>
            ))}
          </nav>

          {/* search */}
          <form
            onSubmit={onSubmit}
            className="mx-auto w-full max-w-2xl hidden sm:block"
          >
            <div className="relative">
              <input
                value={q}
                onChange={(e) => setQ(e.target.value)}
                placeholder="Что ищем, сенпай?"
                className="w-full rounded-full bg-[color:var(--secondary)] border border-[var(--border)] pl-11 pr-4 h-10 text-[14px] text-[var(--foreground)] placeholder-[color:var(--foreground)/0.55] focus:outline-none focus:ring-2 focus:ring-[var(--accent)]"
              />
              <FiSearch
                className="pointer-events-none absolute left-3.5 top-1/2 -translate-y-1/2 opacity-70"
                size={18}
              />
            </div>
          </form>

          {/* actions */}
          <div className="ml-auto flex items-center gap-2.5">
            <Link
              href="/bookmarks"
              className="relative grid place-items-center size-10 rounded-full border border-[var(--border)] bg-[color:var(--secondary)] hover:opacity-90"
              title="Закладки"
            >
              <FiBookmark size={20} className="text-[var(--foreground)]/85" />
            </Link>

            <Link
              href="/notifications"
              className="relative grid place-items-center size-10 rounded-full border border-[var(--border)] bg-[color:var(--secondary)] hover:opacity-90"
              title="Уведомления"
            >
              <FiBell size={20} className="text-[var(--foreground)]/85" />
            </Link>

            <Link
              href="/chats"
              className="relative grid place-items-center size-10 rounded-full border border-[var(--border)] bg-[color:var(--secondary)] hover:opacity-90"
              title="Сообщения"
            >
              <FaRegComment
                size={20}
                className="text-[var(--foreground)]/85"
              />
            </Link>

            {mounted && status !== "authenticated" ? (
              <button
                type="button"
                onClick={() => signIn(undefined, { callbackUrl: "/" })}
                className="px-3.5 h-10 rounded-full border border-[var(--primary)] bg-[var(--primary)] text-[var(--primary-foreground)] text-[14px] hover:opacity-95"
              >
                Войти
              </button>
            ) : (
              <div ref={userRef} className="relative">
                <button
                  type="button"
                  aria-haspopup="menu"
                  aria-expanded={openUser}
                  onClick={() => setOpenUser((v) => !v)}
                  className="grid place-items-center"
                  id="user-menu-button"
                >
                  <span className="sr-only">Меню пользователя</span>
                  <UserAvatar
                    src={avatarSrc}
                    frameUrl={frameSrc}
                    username={avatarUsername}
                    size={40}
                    rounded="full"
                  />
                </button>

                {openUser && (
                  <div
                    role="menu"
                    aria-labelledby="user-menu-button"
                    className="absolute right-0 mt-2 z-50 w-80 bg-[color:var(--background)] border border-[var(--border)] rounded-xl p-3 shadow-lg"
                  >
                    {/* Профиль (кликабельный хедер) */}
                    <Link
                      href={profileHref}
                      onClick={() => setOpenUser(false)}
                      className="flex items-center gap-3 p-2 rounded-lg hover:bg-[color:var(--secondary)]
                                 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--accent)]"
                      role="menuitem"
                      aria-label="Перейти в профиль"
                      title="Профиль"
                    >
                      <UserAvatar
                        src={avatarSrc}
                        frameUrl={frameSrc}
                        username={avatarUsername}
                        size={44}
                        rounded="full"
                      />
                      <div className="min-w-0">
                        <div className="font-semibold truncate">
                          {user?.display_name ||
                            user?.username ||
                            user?.email}
                        </div>
                        <div className="text-xs opacity-60 truncate">
                          @{user?.username || "user"}
                        </div>
                      </div>
                    </Link>

                    <div className="h-px bg-[var(--border)] my-2" />

                    {/* БАЛАНС */}
                    <UserBalances
                      wallets={wallets}
                      loading={wLoading}
                      error={wError}
                      onOpenWallet={() => setOpenUser(false)}
                    />

                    <div className="h-px bg-[var(--border)] my-2" />

                    <ul className="text-sm space-y-1">
                      <MenuItem
                        href="/feedback"
                        label="Обратная связь"
                        icon={<FiCoffee />}
                        onSelect={() => setOpenUser(false)}
                      />
                      <div className="h-px bg-[var(--border)] my-2" />
                      <MenuItem
                        href="/shop"
                        label="Магазин"
                        icon={<FiShoppingBag />}
                        onSelect={() => setOpenUser(false)}
                      />
                      <MenuItem
                        href="/user/settings"
                        label="Настройки"
                        icon={<FiSettings />}
                        onSelect={() => setOpenUser(false)}
                      />
                      <div className="h-px bg-[var(--border)] my-2" />
                      <MenuItem
                        href="/ai"
                        label="Akimori Ai"
                        icon={<FaBrain />}
                        onSelect={() => setOpenUser(false)}
                      />
                      <MenuItem
                        href="/promo"
                        label="Промокоды"
                        onSelect={() => setOpenUser(false)}
                      />
                      <ThemeMenuItem />
                    </ul>

                    <div className="h-px bg-[var(--border)] my-2" />

                    <button
                      onClick={() => {
                        setOpenUser(false);
                        signOut({ callbackUrl: "/" });
                      }}
                      className="w-full text-left px-3 py-2 rounded-lg text-red-300 hover:bg-[color:var(--secondary)] flex items-center gap-2"
                    >
                      <FiLogOut /> Выйти
                    </button>
                  </div>
                )}
              </div>
            )}
          </div>
        </div>

        {/* mobile nav */}
        {openMobile && (
          <div
            ref={mobileRef}
            className="md:hidden pt-2 pb-3 space-y-1.5 border-top border-[var(--border)]"
          >
            <form onSubmit={onSubmit} className="px-1.5">
              <input
                value={q}
                onChange={(e) => setQ(e.target.value)}
                placeholder="Поиск…"
                className="w-full rounded-xl bg-[color:var(--secondary)] border border-[var(--border)] px-3.5 py-2.5 text-[14px] text-[var(--foreground)] placeholder-[color:var(--foreground)/0.5] focus:outline-none focus:ring-2 focus:ring-[var(--accent)]"
              />
            </form>
            {NAV.map((i) => (
              <Link
                key={i.href}
                href={i.href}
                className={clsx(
                  "block mx-1.5 px-3.5 py-2.5 rounded-lg border text-[14px]",
                  isActive(i.href)
                    ? "bg-[var(--primary)] text-[var(--primary-foreground)] border-[var(--primary)]"
                    : "text-[color:var(--foreground)/0.9] border-[var(--border)] hover:bg-[color:var(--secondary)]"
                )}
              >
                {i.label}
              </Link>
            ))}
          </div>
        )}
      </div>
    </header>
  );
}

/* ---------- Подкомпоненты ---------- */

function MenuItem({
  href,
  label,
  chevron,
  icon,
  trailing,
  onSelect,
}: {
  href: string;
  label: string;
  chevron?: boolean;
  icon?: React.ReactNode;
  trailing?: React.ReactNode;
  onSelect?: () => void;
}) {
  return (
    <li>
      <Link
        href={href}
        onClick={onSelect}
        className="flex items-center justify-between gap-2 px-3 py-2 rounded-lg hover:bg-[color:var(--secondary)]"
      >
        <span className="truncate flex items-center gap-2">
          {icon ? <span className="opacity-80">{icon}</span> : null}
          {label}
        </span>
        {trailing ?? (chevron ? <FiChevronRight className="opacity-70" /> : null)}
      </Link>
    </li>
  );
}

function ThemeMenuItem() {
  const { theme, resolvedTheme, setTheme } = useTheme();
  const [mounted, setMounted] = useState(false);
  useEffect(() => setMounted(true), []);
  useEffect(() => {
    if (!mounted) return;
    if (!theme || theme === "system") {
      setTheme(resolvedTheme === "dark" ? "dark" : "light");
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [mounted, resolvedTheme]);
  const isDark =
    theme === "dark" || (theme === "system" && resolvedTheme === "dark");
  const label = !mounted
    ? "Тема: …"
    : isDark
    ? "Тема: Тёмная"
    : "Тема: Светлая";
  return (
    <li>
      <button
        type="button"
        onClick={() => setTheme(isDark ? "light" : "dark")}
        className="w-full flex items-center justify-between gap-2 px-3 py-2 rounded-lg hover:bg-[color:var(--secondary)]"
        title={label}
        aria-pressed={isDark}
      >
        <span className="truncate">{label}</span>
        <FiRefreshCw className="opacity-70" />
      </button>
    </li>
  );
}

/* ---------- Баланс ---------- */

function UserBalances({
  wallets,
  loading,
  error,
  onOpenWallet,
}: {
  wallets: Wallet[] | null;
  loading: boolean;
  error: string | null;
  onOpenWallet: () => void;
}) {
  const aki = (wallets || []).find((w) => w.currency === "AKI");
  const rub = (wallets || []).find((w) => w.currency === "RUB");

  return (
    <div className="px-3 pb-2">
      <div className="text-sm opacity-75 mb-2">Мой баланс</div>

      <div className="rounded-xl border border-[var(--border)] overflow-hidden bg-[color:var(--secondary)]/60">
        {/* Шапка итога — оранжевый градиент с мягким паттерном */}
        <div className="p-3 md:p-4 relative bg-accent-pane">
          {loading ? (
            <div className="space-y-2">
              <div className="h-7 w-40 rounded-lg bg-white/10 animate-pulse" />
              <div className="h-5 w-28 rounded-lg bg-white/10 animate-pulse" />
            </div>
          ) : error ? (
            <div className="text-xs text-red-400">{error}</div>
          ) : (
            <div>
              <div className="text-xs opacity-90 text-white">
                Итого по кошелькам
              </div>
              <div className="mt-0.5 flex items-baseline gap-2">
                <span className="text-[26px] leading-7 font-extrabold tracking-wide text:white text-white">
                  {aki ? `${aki.balance_display} AKI` : "0 AKI"}
                </span>
                <span className="text-base font-semibold text-white/95">
                  {rub ? `· ${rub.balance_display} ₽` : null}
                </span>
              </div>
            </div>
          )}
        </div>

        {/* Валюты */}
        <div className="p-3 md:p-4 grid gap-2">
          {!loading && (
            <>
              <BalancePill
                label="AkiCoin"
                value={aki ? `${aki.balance_display} AKI` : "0 AKI"}
                accent
              />
              <BalancePill
                label="Рубли"
                value={rub ? `${rub.balance_display} ₽` : "0 ₽"}
              />
            </>
          )}

          {/* Действия */}
          <div className="mt-1 flex items-center gap-2">
            <Link
              href="/wallet/deposit"
              className="inline-flex items-center gap-2 px-3 py-1.5 rounded-lg bg-[var(--accent)] text-[var(--accent-foreground)] text-xs hover:opacity-95 transition"
              onClick={onOpenWallet}
            >
              Пополнить
            </Link>
            <Link
              href="/wallet"
              className="ml-auto inline-flex px-3 py-1.5 rounded-lg border border-[var(--border)] text-xs hover:bg-[color:var(--secondary)] transition"
              onClick={onOpenWallet}
            >
              Открыть кошелёк
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
}

function BalancePill({
  label,
  value,
  accent = false,
}: {
  label: string;
  value: string;
  accent?: boolean;
}) {
  return (
    <div
      className={[
        "flex items-center justify-between rounded-xl px-3 py-2 border",
        accent
          ? "border-[color:var(--ring)]/40 bg-[var(--accent)]/10"
          : "border-[var(--border)] bg-[color:var(--background)]/40",
      ].join(" ")}
    >
      <span
        className={
          accent
            ? "text-xs text-[var(--accent)]/95 font-medium"
            : "text-xs opacity-75"
        }
      >
        {label}
      </span>
      <span
        className={
          accent
            ? "text-sm font-semibold text-[var(--accent)]"
            : "text-sm font-semibold"
        }
      >
        {value}
      </span>
    </div>
  );
}
