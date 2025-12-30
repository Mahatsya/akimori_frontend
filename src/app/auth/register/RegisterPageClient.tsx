"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { HiMail, HiUser, HiLockClosed, HiArrowRight } from "react-icons/hi";
import { FiCheckCircle } from "react-icons/fi";

export default function RegisterPageClient() {
  const router = useRouter();

  const [email, setEmail] = useState("");
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [password2, setPassword2] = useState("");

  const [code, setCode] = useState("");
  const [step, setStep] = useState<"form" | "verify">("form");

  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);

  function resetAlerts() {
    setError(null);
    setSuccess(null);
  }

  async function handleRegister(e: React.FormEvent) {
    e.preventDefault();
    resetAlerts();

    if (password !== password2) {
      setError("Пароли не совпадают");
      return;
    }

    if (password.length < 8) {
      setError("Пароль должен быть минимум 8 символов");
      return;
    }

    setLoading(true);

    try {
      const res = await fetch("/api/auth/register", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email, username, password }),
      });

      const data = await res.json().catch(() => ({}));
      if (!res.ok) throw new Error(data?.error || "Ошибка регистрации");

      setStep("verify");
      setSuccess("Код отправлен на почту. Введите его ниже.");
    } catch (err: any) {
      setError(err?.message || "Ошибка регистрации");
    } finally {
      setLoading(false);
    }
  }

  async function handleVerify(e: React.FormEvent) {
    e.preventDefault();
    resetAlerts();
    setLoading(true);

    try {
      const res = await fetch("/api/auth/verify", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email, code }),
      });

      const data = await res.json().catch(() => ({}));
      if (!res.ok) throw new Error(data?.error || "Ошибка проверки кода");

      setSuccess("Почта подтверждена! Перенаправляем на вход…");
      setTimeout(() => router.push("/auth/login"), 900);
    } catch (err: any) {
      setError(err?.message || "Ошибка проверки кода");
    } finally {
      setLoading(false);
    }
  }

  const inputBase =
    "w-full rounded-xl border border-[color:var(--border)] bg-[color:var(--secondary)] px-4 py-3 pl-12 outline-none focus:ring-2 focus:ring-[color:var(--accent)]/40";

  return (
    <div className="min-h-screen flex items-center justify-center px-4">
      <div className="w-full max-w-md rounded-2xl border border-[color:var(--border)] bg-[color:var(--card)] p-6 shadow-xl">
        {/* HEADER */}
        <div className="mb-6 flex items-center justify-between">
          <div>
            <h1 className="text-lg font-semibold">
              {step === "form" ? "Регистрация" : "Подтверждение почты"}
            </h1>
            {step === "verify" && (
              <div className="text-xs text-[color:var(--muted-foreground)] mt-1">
                {email}
              </div>
            )}
          </div>
          <span className="text-xs text-[color:var(--muted-foreground)]">
            Akimori
          </span>
        </div>

        {step === "form" ? (
          <form onSubmit={handleRegister} className="space-y-4">
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
                  className={inputBase}
                  placeholder="mori_user"
                  value={username}
                  onChange={(e) => setUsername(e.target.value)}
                  autoComplete="username"
                  required
                />
              </div>
            </div>

            {/* EMAIL */}
            <div>
              <label className="block text-xs mb-1 text-[color:var(--muted-foreground)]">
                Email
              </label>
              <div className="relative">
                <span className="pointer-events-none absolute left-4 top-1/2 -translate-y-1/2 text-[color:var(--muted-foreground)]">
                  <HiMail size={18} />
                </span>
                <input
                  type="email"
                  className={inputBase}
                  placeholder="you@example.com"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  autoComplete="email"
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
                  className={inputBase}
                  placeholder="••••••••"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  autoComplete="new-password"
                  required
                />
              </div>
            </div>

            {/* PASSWORD CONFIRM */}
            <div>
              <label className="block text-xs mb-1 text-[color:var(--muted-foreground)]">
                Повторите пароль
              </label>
              <div className="relative">
                <span className="pointer-events-none absolute left-4 top-1/2 -translate-y-1/2 text-[color:var(--muted-foreground)]">
                  <HiLockClosed size={18} />
                </span>
                <input
                  type="password"
                  className={inputBase}
                  placeholder="••••••••"
                  value={password2}
                  onChange={(e) => setPassword2(e.target.value)}
                  autoComplete="new-password"
                  required
                />
              </div>

              {password2.length > 0 && password !== password2 && (
                <div className="mt-2 text-xs text-red-400">
                  Пароли должны совпадать
                </div>
              )}
            </div>

            {/* ERROR / SUCCESS */}
            {error && (
              <div className="rounded-lg border border-red-500/30 bg-red-500/10 px-3 py-2 text-sm text-red-400">
                {error}
              </div>
            )}
            {success && (
              <div className="rounded-lg border border-emerald-500/30 bg-emerald-500/10 px-3 py-2 text-sm text-emerald-400">
                {success}
              </div>
            )}

            {/* BUTTON */}
            <button
              type="submit"
              disabled={loading || (password2.length > 0 && password !== password2)}
              className="group flex w-full items-center justify-between rounded-xl
                         bg-[color:var(--accent)] px-4 py-3 text-sm font-medium
                         text-[color:var(--accent-foreground)] disabled:opacity-60"
            >
              <span>{loading ? "Создаём…" : "Создать аккаунт"}</span>
              <HiArrowRight className="opacity-80" />
            </button>
          </form>
        ) : (
          <form onSubmit={handleVerify} className="space-y-4">
            <div>
              <label className="block text-xs mb-1 text-[color:var(--muted-foreground)]">
                Код из письма
              </label>
              <div className="relative">
                <span className="pointer-events-none absolute left-4 top-1/2 -translate-y-1/2 text-[color:var(--muted-foreground)]">
                  <FiCheckCircle size={18} />
                </span>
                <input
                  className={`${inputBase} tracking-widest text-center`}
                  placeholder="123456"
                  value={code}
                  onChange={(e) => setCode(e.target.value)}
                  inputMode="numeric"
                  maxLength={6}
                  required
                />
              </div>
            </div>

            {error && (
              <div className="rounded-lg border border-red-500/30 bg-red-500/10 px-3 py-2 text-sm text-red-400">
                {error}
              </div>
            )}
            {success && (
              <div className="rounded-lg border border-emerald-500/30 bg-emerald-500/10 px-3 py-2 text-sm text-emerald-400">
                {success}
              </div>
            )}

            <button
              type="submit"
              disabled={loading}
              className="group flex w-full items-center justify-between rounded-xl
                         bg-[color:var(--accent)] px-4 py-3 text-sm font-medium
                         text-[color:var(--accent-foreground)] disabled:opacity-60"
            >
              <span>{loading ? "Проверяем…" : "Подтвердить"}</span>
              <HiArrowRight className="opacity-80" />
            </button>

            <button
              type="button"
              disabled={loading}
              onClick={() => {
                resetAlerts();
                setStep("form");
                setCode("");
              }}
              className="w-full rounded-xl border border-[color:var(--border)] bg-transparent px-4 py-3 text-sm
                         text-[color:var(--muted-foreground)] hover:bg-[color:var(--secondary)] disabled:opacity-60"
            >
              Назад
            </button>
          </form>
        )}

        {/* FOOTER */}
        <div className="mt-5 flex justify-between text-xs">
          <a href="/auth/login" className="link">
            Уже есть аккаунт? Войти
          </a>
        </div>
      </div>
    </div>
  );
}
