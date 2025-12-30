// src/auth.ts
import NextAuth, { type NextAuthConfig, type Session } from "next-auth";
import Credentials from "next-auth/providers/credentials";
import type { JWT } from "next-auth/jwt";

/** ==== API BASE ==== */
const API_BASE = (process.env.API_BASE || "http://127.0.0.1:8000").replace(/\/+$/, "");

/** ==== JWT helpers (без Buffer для Edge/Node) ==== */
function decodeJwtPayload<T = any>(token: string): T | null {
  try {
    const payloadB64 = token.split(".")[1];
    if (!payloadB64) return null;
    const b64 = payloadB64.replace(/-/g, "+").replace(/_/g, "/");
    const json =
      typeof atob === "function"
        ? decodeURIComponent(
            Array.prototype.map
              .call(atob(b64), (c: string) => "%" + ("00" + c.charCodeAt(0).toString(16)).slice(-2))
              .join(""),
          )
        : Buffer.from(b64, "base64").toString("utf8");
    return JSON.parse(json) as T;
  } catch {
    return null;
  }
}

function isJwtExpired(token?: string) {
  if (!token) return true;
  const payload = decodeJwtPayload<{ exp?: number }>(token);
  if (!payload?.exp) return true;
  const now = Math.floor(Date.now() / 1000);
  // обновляем за минуту до истечения
  return payload.exp <= now + 60;
}

/** ==== Backend auth calls (DRF SimpleJWT) ==== */
async function obtainToken(username: string, password: string) {
  const r = await fetch(`${API_BASE}/api/auth/token/`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ username, password }),
    cache: "no-store",
  });

  const data = await r.json().catch(() => ({} as any));

  if (!r.ok) {
    // чтобы видеть “Email is not verified” и т.п.
    const msg = (data?.detail as string) || "Invalid credentials";
    throw new Error(msg);
  }

  return data as { access: string; refresh: string };
}

async function refreshAccessToken(refresh: string) {
  const r = await fetch(`${API_BASE}/api/auth/token/refresh/`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ refresh }),
    cache: "no-store",
  });
  if (!r.ok) return null;
  return (await r.json()) as { access?: string; refresh?: string } | null;
}

async function fetchMe(access: string) {
  const r = await fetch(`${API_BASE}/api/auth/me/`, {
    headers: { Authorization: `Bearer ${access}` },
    cache: "no-store",
  });

  const data = await r.json().catch(() => ({} as any));
  if (!r.ok) throw new Error((data?.detail as string) || "me failed");

  return data as {
    id: number;
    username: string;
    email: string;
    role: string;
  };
}

/** ==== NextAuth v5 config ==== */
export const authConfig: NextAuthConfig = {
  trustHost: true,
  session: { strategy: "jwt" },
  pages: { signIn: "/auth/login" },

  providers: [
    Credentials({
      name: "Credentials",
      credentials: {
        username: { label: "Username", type: "text" },
        password: { label: "Password", type: "password" },
      },
      async authorize(creds) {
        const username = String(creds?.username || "").trim();
        const password = String(creds?.password || "");
        if (!username || !password) return null;

        const tokens = await obtainToken(username, password);
        const me = await fetchMe(tokens.access);

        return {
          id: String(me.id),
          username: me.username,
          email: me.email,
          role: me.role,
          access: tokens.access,
          refresh: tokens.refresh, // ✅ сюда, но НЕ в session
        } as any;
      },
    }),
  ],

  callbacks: {
    async jwt({ token, user, trigger, session }) {
      // 1) Первый логин
      if (user) {
        token.user = {
          id: (user as any).id,
          username: (user as any).username,
          email: (user as any).email,
          role: (user as any).role,
        };
        (token as any).access = (user as any).access;
        (token as any).refresh = (user as any).refresh; // ✅ хранится server-only в JWT NextAuth
        delete (token as any).authError;
        return token as JWT;
      }

      // 2) Обновление user данных через session.update(...)
      if (trigger === "update" && session?.user) {
        token.user = { ...(token.user ?? {}), ...(session.user as any) };
      }

      // 3) Refresh access при истечении
      const access = (token as any).access as string | undefined;
      const refresh = (token as any).refresh as string | undefined;

      if (isJwtExpired(access) && refresh) {
        const refreshed = await refreshAccessToken(refresh);

        if (refreshed?.access) {
          (token as any).access = refreshed.access;
        }

        // Если бэк иногда возвращает новый refresh — обновим в token (но всё равно не в session)
        if (refreshed?.refresh) {
          (token as any).refresh = refreshed.refresh;
        }

        if (!refreshed?.access) {
          // refresh протух — разлогиниваем логически
          delete (token as any).access;
          delete (token as any).refresh;
          (token as any).authError = "RefreshExpired";
        }
      }

      return token as JWT;
    },

    async session({ session, token }) {
      // ✅ В session отдаём только user и access
      session.user = token.user as any;

      (session as any).access = (token as any).access ?? null;
      // ❌ НИКАКИХ refresh, backendTokens и “present”
      (session as any).authError = (token as any).authError ?? null;

      return session as Session;
    },
  },
};

// ⬇️ ВАЖНО: эти ИМЕНОВАННЫЕ экспорты должны существовать
export const { handlers, auth, signIn, signOut } = NextAuth(authConfig);
