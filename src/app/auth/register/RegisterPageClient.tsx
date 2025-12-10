"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { HiMail, HiUser, HiLockClosed } from "react-icons/hi";
import { FiCheckCircle } from "react-icons/fi";

export default function RegisterPageClient() {
  const router = useRouter();

  const [email, setEmail] = useState("");
  const [username, setUser] = useState("");
  const [password, setPass] = useState("");
  const [code, setCode] = useState("");
  const [step, setStep] = useState<"form" | "verify">("form");

  const [loading, setLoading] = useState(false);
  const [error, setErr] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);

  async function handleRegister(e: React.FormEvent) {
    e.preventDefault();
    setErr(null);
    setLoading(true);

    try {
      const res = await fetch("http://127.0.0.1:8000/api/auth/register/", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email, username, password }),
      });

      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Ошибка регистрации");

      setStep("verify");
      setSuccess("Код отправлен на почту. Введите его ниже.");
    } catch (err: any) {
      setErr(err.message);
    } finally {
      setLoading(false);
    }
  }

  async function handleVerify(e: React.FormEvent) {
    e.preventDefault();
    setErr(null);
    setLoading(true);
    try {
      const res = await fetch("http://127.0.0.1:8000/api/auth/verify/", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email, code }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Ошибка проверки кода");

      setSuccess("Почта подтверждена! Сейчас перенаправим на вход…");
      setTimeout(() => router.push("/auth/login"), 1500);
    } catch (err: any) {
      setErr(err.message);
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="min-h-screen relative overflow-hidden">
      {/* фон */}
      <div className="absolute inset-0 -z-10 bg-gradient-to-br from-fuchsia-700 via-violet-700 to-slate-900" />
      <div className="absolute -top-24 -left-24 h-80 w-80 rounded-full blur-3xl opacity-30 bg-cyan-400" />
      <div className="absolute -bottom-24 -right-24 h-80 w-80 rounded-full blur-3xl opacity-30 bg-pink-500" />

      <div className="mx-auto max-w-md px-6 pt-20">
        <div className="rounded-3xl bg-white/10 backdrop-blur-xl border border-white/20 shadow-2xl p-8">
          <h1 className="text-white text-3xl font-bold tracking-tight">
            Регистрация Akimori
          </h1>
          <p className="text-white/70 mt-2 text-sm">
            Создайте аккаунт, чтобы начать путешествие.
          </p>

          {step === "form" ? (
            <form onSubmit={handleRegister} className="mt-8 space-y-4">
              <div className="relative">
                <HiUser className="absolute left-3 top-3.5 text-white/50" />
                <input
                  className="pl-10 w-full rounded-xl bg-white/10 text-white placeholder-white/40 border border-white/20 focus:outline-none focus:ring-2 focus:ring-fuchsia-400 px-4 py-3"
                  placeholder="Имя пользователя"
                  value={username}
                  onChange={(e) => setUser(e.target.value)}
                  autoComplete="username"
                />
              </div>

              <div className="relative">
                <HiMail className="absolute left-3 top-3.5 text-white/50" />
                <input
                  type="email"
                  className="pl-10 w-full rounded-xl bg-white/10 text-white placeholder-white/40 border border-white/20 focus:outline-none focus:ring-2 focus:ring-fuchsia-400 px-4 py-3"
                  placeholder="Почта"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  autoComplete="email"
                />
              </div>

              <div className="relative">
                <HiLockClosed className="absolute left-3 top-3.5 text-white/50" />
                <input
                  type="password"
                  className="pl-10 w-full rounded-xl bg-white/10 text-white placeholder-white/40 border border-white/20 focus:outline-none focus:ring-2 focus:ring-fuchsia-400 px-4 py-3"
                  placeholder="Пароль"
                  value={password}
                  onChange={(e) => setPass(e.target.value)}
                  autoComplete="new-password"
                />
              </div>

              {error && (
                <div className="text-sm text-red-300 bg-red-500/20 border border-red-400/40 rounded-lg px-3 py-2">
                  {error}
                </div>
              )}
              {success && (
                <div className="text-sm text-emerald-300 bg-emerald-500/20 border border-emerald-400/40 rounded-lg px-3 py-2">
                  {success}
                </div>
              )}

              <button
                type="submit"
                disabled={loading}
                className="w-full rounded-xl bg-gradient-to-r from-fuchsia-500 to-violet-500 text-white font-medium py-3 hover:opacity-95 active:opacity-90 transition disabled:opacity-60"
              >
                {loading ? "Создаём…" : "Создать аккаунт"}
              </button>
            </form>
          ) : (
            <form onSubmit={handleVerify} className="mt-8 space-y-4">
              <div>
                <label className="block text-sm text-white/80">
                  Введите код из письма
                </label>
                <div className="relative mt-1">
                  <FiCheckCircle className="absolute left-3 top-3.5 text-white/50" />
                  <input
                    className="pl-10 w-full rounded-xl bg-white/10 text-white placeholder-white/40 border border-white/20 focus:outline-none focus:ring-2 focus:ring-fuchsia-400 px-4 py-3 tracking-widest text-center"
                    placeholder="123456"
                    value={code}
                    onChange={(e) => setCode(e.target.value)}
                    maxLength={6}
                  />
                </div>
              </div>

              {error && (
                <div className="text-sm text-red-300 bg-red-500/20 border border-red-400/40 rounded-lg px-3 py-2">
                  {error}
                </div>
              )}
              {success && (
                <div className="text-sm text-emerald-300 bg-emerald-500/20 border border-emerald-400/40 rounded-lg px-3 py-2">
                  {success}
                </div>
              )}

              <button
                type="submit"
                disabled={loading}
                className="w-full rounded-xl bg-gradient-to-r from-fuchsia-500 to-violet-500 text-white font-medium py-3 hover:opacity-95 active:opacity-90 transition disabled:opacity-60"
              >
                {loading ? "Проверяем…" : "Подтвердить код"}
              </button>
            </form>
          )}

          <div className="text-center mt-6 text-white/70 text-sm">
            Уже есть аккаунт?{" "}
            <a
              href="/auth/login"
              className="text-white underline underline-offset-4"
            >
              Войти
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
