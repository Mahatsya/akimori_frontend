// src/auth.ts
import NextAuth, { type NextAuthConfig, type Session } from "next-auth";
import Credentials from "next-auth/providers/credentials";
import type { JWT } from "next-auth/jwt";

/** ==== API BASE ==== */
const API_BASE =
  process.env.API_BASE ||
  "http://127.0.0.1:8000";

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
              .call(atob(b64), (c: string) =>
                "%" + ("00" + c.charCodeAt(0).toString(16)).slice(-2),
              )
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
  return payload.exp <= now + 60;
}

/** ==== Backend auth calls (DRF SimpleJWT) ==== */
async function obtainToken(username: string, password: string) {
  const r = await fetch(`${API_BASE}/api/auth/token/`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ username, password }),
  });
  if (!r.ok) throw new Error("Invalid credentials");
  return (await r.json()) as { access: string; refresh: string };
}

async function refreshToken(refresh: string) {
  const r = await fetch(`${API_BASE}/api/auth/token/refresh/`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ refresh }),
  });
  if (!r.ok) return null;
  return (await r.json()) as { access?: string; refresh?: string } | null;
}

async function fetchMe(access: string) {
  const r = await fetch(`${API_BASE}/api/auth/me/`, {
    headers: { Authorization: `Bearer ${access}` },
    cache: "no-store",
  });
  if (!r.ok) throw new Error("me failed");
  return (await r.json()) as {
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
        const username = String(creds?.username || "");
        const password = String(creds?.password || "");
        const tokens = await obtainToken(username, password);
        const me = await fetchMe(tokens.access);
        return {
          id: String(me.id),
          username: me.username,
          email: me.email,
          role: me.role,
          access: tokens.access,
          refresh: tokens.refresh,
        } as any;
      },
    }),
  ],

  callbacks: {
    async jwt({ token, user, trigger, session }) {
      if (user) {
        token.user = {
          id: (user as any).id,
          username: (user as any).username,
          email: (user as any).email,
          role: (user as any).role,
        };
        (token as any).access = (user as any).access;
        (token as any).refresh = (user as any).refresh;
      }

      if (trigger === "update" && session?.user) {
        token.user = { ...(token.user ?? {}), ...(session.user as any) };
      }

      if (isJwtExpired((token as any).access) && (token as any).refresh) {
        const refreshed = await refreshToken((token as any).refresh);
        if (refreshed?.access) (token as any).access = refreshed.access;
        if (refreshed?.refresh) (token as any).refresh = refreshed.refresh;
        if (!refreshed?.access) {
          delete (token as any).access;
          delete (token as any).refresh;
          (token as any).authError = "RefreshExpired";
        }
      }

      return token as JWT;
    },

    async session({ session, token }) {
      session.user = token.user as any;
      (session as any).access = (token as any).access ?? null;
      (session as any).refresh = (token as any).refresh ? "present" : null;
      (session as any).backendTokens = {
        access: (token as any).access ?? null,
        refresh: (token as any).refresh ?? null,
      };
      (session as any).authError = (token as any).authError ?? null;
      return session as Session;
    },
  },
};

// ⬇️ ВАЖНО: эти ИМЕНОВАННЫЕ экспорты должны существовать
export const { handlers, auth, signIn, signOut } = NextAuth(authConfig);
