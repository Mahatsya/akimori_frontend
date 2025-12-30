"use client";

import { useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { signIn } from "next-auth/react";
import { HiUser, HiLockClosed, HiArrowRight } from "react-icons/hi";

export default function LoginPageClient() {
  const router = useRouter();
  const sp = useSearchParams();
  const callbackUrl = sp.get("callbackUrl") || "/";

  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function onSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    setLoading(true);

    const res = await signIn("credentials", {
      username,
      password,
      redirect: false, // ⬅️ ВАЖНО
      callbackUrl,
    });

    setLoading(false);

    if (!res || res.error) {
      setError("Неверный логин или пароль");
      return;
    }

    router.replace(res.url || "/");
  }

  return (
    <div className="min-h-screen flex items-center justify-center px-4">
      <div className="w-full max-w-md rounded-2xl border border-[color:var(--border)] bg-[color:var(--card)] p-6 shadow-xl">
        
        {/* HEADER */}
        <div className="mb-6 flex items-center justify-between">
          <h1 className="text-lg font-semibold">Вход</h1>
          <span className="text-xs text-[color:var(--muted-foreground)]">
            Akimori
          </span>
        </div>

        {/* FORM */}
        <form onSubmit={onSubmit} className="space-y-4">
          
          {/* USERNAME */}
          <div>
            <label className="block text-xs mb-1 text-[color:var(--muted-foreground)]">
              Username
            </label>
            <div className="relative">
              <span className="pointer-events-none absolute left-4 top-1/2 -translate-y-1/2 text-[color:var(--muted-foreground)]">
                <HiUser size={18} />
              </span>
              <input
                className="w-full rounded-xl border border-[color:var(--border)]
                           bg-[color:var(--secondary)] px-4 py-3 pl-12
                           outline-none focus:ring-2 focus:ring-[color:var(--accent)]/40"
                placeholder="mori_user"
                value={username}
                onChange={(e) => setUsername(e.target.value)}
                autoComplete="username"
                required
              />
            </div>
          </div>

          {/* PASSWORD */}
          <div>
            <label className="block text-xs mb-1 text-[color:var(--muted-foreground)]">
              Password
            </label>
            <div className="relative">
              <span className="pointer-events-none absolute left-4 top-1/2 -translate-y-1/2 text-[color:var(--muted-foreground)]">
                <HiLockClosed size={18} />
              </span>
              <input
                type="password"
                className="w-full rounded-xl border border-[color:var(--border)]
                           bg-[color:var(--secondary)] px-4 py-3 pl-12
                           outline-none focus:ring-2 focus:ring-[color:var(--accent)]/40"
                placeholder="••••••••"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                autoComplete="current-password"
                required
              />
            </div>
          </div>

          {/* ERROR */}
          {error && (
            <div className="rounded-lg border border-red-500/30 bg-red-500/10 px-3 py-2 text-sm text-red-400">
              {error}
            </div>
          )}

          {/* BUTTON */}
          <button
            type="submit"
            disabled={loading}
            className="group flex w-full items-center justify-between
                       rounded-xl bg-[color:var(--accent)] px-4 py-3
                       text-sm font-medium text-[color:var(--accent-foreground)]
                       disabled:opacity-60"
          >
            <span>{loading ? "Входим…" : "Войти"}</span>
            <HiArrowRight className="opacity-80" />
          </button>
        </form>

        {/* FOOTER */}
        <div className="mt-5 flex justify-between text-xs">
          <a href="/auth/register" className="link">
            Регистрация
          </a>
        </div>
      </div>
    </div>
  );
}
