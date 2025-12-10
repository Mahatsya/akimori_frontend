// src/app/api/proxy/blog/[...path]/route.ts
import { NextRequest, NextResponse } from "next/server";
import { getToken } from "next-auth/jwt";

const API_BASE =
  process.env.API_BASE || process.env.API_BASE || "http://127.0.0.1:8000";
const API_PREFIX = (process.env.API_PREFIX || "/api").replace(/\/+$/, "");
const AUTH_SECRET = process.env.AUTH_SECRET || process.env.NEXTAUTH_SECRET || "";

function buildTarget(req: NextRequest, pathParts: string[]) {
  let tail = (pathParts || []).join("/");
  if (!tail.endsWith("/")) tail += "/"; // DRF trailing slash
  const qs = req.nextUrl.search || "";
  return `${API_BASE.replace(/\/$/, "")}${API_PREFIX}/blog/${tail}${qs}`;
}

async function proxy(
  req: NextRequest,
  ctx: { params: Promise<{ path?: string[] }> }
) {
  try {
    const { path = [] } = await ctx.params;
    const target = buildTarget(req, path);

    // ---- auth (как было) ----
    let bearer: string | null = null;
    if (AUTH_SECRET) {
      try {
        const t = await getToken({ req, secret: AUTH_SECRET });
        const token = (t as any)?.accessToken || (t as any)?.access || null;
        if (token) bearer = `Bearer ${token}`;
      } catch {/* ignore */}
    }
    const incomingAuth = req.headers.get("authorization");
    if (!bearer && incomingAuth) bearer = incomingAuth;

    // ---- пробрасываем заголовки ----
    const headers: Record<string, string> = { accept: "application/json" };
    if (bearer) headers.authorization = bearer;

    // ВАЖНО: отдать исходный content-type (JSON / multipart и т.д.)
    const incomingCT = req.headers.get("content-type");
    if (incomingCT) headers["content-type"] = incomingCT;

    const hasBody = !["GET", "HEAD", "OPTIONS"].includes(req.method);
    const body = hasBody ? await req.arrayBuffer() : undefined;

    const upstream = await fetch(target, {
      method: req.method,
      cache: "no-store",
      headers,
      body,
      redirect: "follow",
    });

    const ct = upstream.headers.get("content-type") || "";
    const raw = await upstream.text();
    const payload = ct.includes("application/json")
      ? raw
      : JSON.stringify({ detail: raw.slice(0, 400) });

    return new NextResponse(payload, {
      status: upstream.status,
      headers: { "content-type": "application/json" },
    });
  } catch (err: any) {
    return NextResponse.json({ detail: err?.message || "Proxy error" }, { status: 500 });
  }
}

export const GET = proxy;
export const POST = proxy;
export const PUT = proxy;
export const PATCH = proxy;
export const DELETE = proxy;
