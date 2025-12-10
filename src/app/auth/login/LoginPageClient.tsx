"use client";

import { useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { signIn } from "next-auth/react";

export default function LoginPageClient() {
  const router = useRouter();
  const sp = useSearchParams();
  const callbackUrl = sp.get("callbackUrl") || "/";
  const [username, setU] = useState("");
  const [password, setP] = useState("");
  const [loading, setLoading] = useState(false);
  const [err, setErr] = useState<string | null>(null);

  async function onSubmit(e: React.FormEvent) {
    e.preventDefault();
    setErr(null);
    setLoading(true);
    const res = await signIn("credentials", {
      username,
      password,
      redirect: false,
      callbackUrl,
    });
    setLoading(false);
    if (res?.ok) router.push(res.url || "/");
    else setErr("Неверный логин или пароль");
  }

  return (
    <div className="min-h-screen relative overflow-hidden">
      <div className="absolute inset-0 -z-10 bg-gradient-to-br from-purple-700 via-indigo-700 to-slate-900" />
      <div className="absolute -top-24 -left-24 h-80 w-80 rounded-full blur-3xl opacity-30 bg-fuchsia-500" />
      <div className="absolute -bottom-24 -right-24 h-80 w-80 rounded-full blur-3xl opacity-30 bg-cyan-400" />

      <div className="mx-auto max-w-md px-6 pt-20">
        <div className="rounded-3xl bg-white/10 backdrop-blur-xl border border-white/20 shadow-2xl p-8">
          <h1 className="text-white text-3xl font-bold tracking-tight">
            Вход в Akimori
          </h1>
          <p className="text-white/70 mt-2 text-sm">
            Добро пожаловать обратно.
          </p>

          <form onSubmit={onSubmit} className="mt-8 space-y-4">
            <div>
              <label className="block text-sm text-white/80">Username</label>
              <input
                className="mt-1 w-full rounded-xl bg-white/10 text-white placeholder-white/40 border border-white/20 focus:outline-none focus:ring-2 focus:ring-fuchsia-400 px-4 py-3"
                placeholder="mori_user"
                value={username}
                onChange={(e) => setU(e.target.value)}
                autoComplete="username"
              />
            </div>
            <div>
              <label className="block text-sm text-white/80">Пароль</label>
              <input
                type="password"
                className="mt-1 w-full rounded-xl bg-white/10 text-white placeholder-white/40 border border-white/20 focus:outline-none focus:ring-2 focus:ring-fuchsia-400 px-4 py-3"
                placeholder="••••••••"
                value={password}
                onChange={(e) => setP(e.target.value)}
                autoComplete="current-password"
              />
            </div>

            {err && (
              <div className="text-sm text-red-300 bg-red-500/20 border border-red-400/40 rounded-lg px-3 py-2">
                {err}
              </div>
            )}

            <button
              type="submit"
              disabled={loading}
              className="w-full rounded-xl bg-gradient-to-r from-fuchsia-500 to-violet-500 text-white font-medium py-3 hover:opacity-95 active:opacity-90 transition disabled:opacity-60"
            >
              {loading ? "Входим…" : "Войти"}
            </button>
          </form>

          <div className="text-center mt-6 text-white/70 text-sm">
            Нет аккаунта?{" "}
            <a
              href="/auth/register"
              className="text-white underline underline-offset-4"
            >
              Зарегистрируйтесь
            </a>
          </div>
        </div>

        <p className="text-center text-white/60 text-xs mt-6">
          © {new Date().getFullYear()} Akimori
        </p>
      </div>
    </div>
  );
}
