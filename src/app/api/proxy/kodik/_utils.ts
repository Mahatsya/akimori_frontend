// src/app/api/proxy/kodik/_utils.ts
export const runtime = "nodejs";
export const dynamic = "force-dynamic";

import { NextRequest, NextResponse } from "next/server";
import { getToken } from "next-auth/jwt";
import { auth } from "@/auth";

const API_BASE =
  process.env.API_BASE ||
  "http://127.0.0.1:8000";

export async function proxyToBackend(req: NextRequest, upstreamPath: string) {
  const url = new URL(upstreamPath, API_BASE);
  const qp = new URL(req.url).searchParams;
  qp.forEach((v, k) => url.searchParams.set(k, v));

  // ⚠️ ВАЖНО: getToken с secret, иначе на prod/edge вернётся null
  let access: string | null = null;
  try {
    const token = await getToken({ req, secret: process.env.NEXTAUTH_SECRET });
    access =
      (token as any)?.access ||
      (token as any)?.backendTokens?.access ||
      null;
  } catch {
    access = null;
  }

  if (!access) {
    try {
      const session = await auth();
      access =
        (session as any)?.backendTokens?.access ||
        (session as any)?.access ||
        null;
    } catch {}
  }

  // Фолбэк: берём Authorization от клиента, если есть
  if (!access) {
    const clientAuth = req.headers.get("authorization");
    if (clientAuth?.toLowerCase().startsWith("bearer ")) {
      access = clientAuth.split(/\s+/)[1] || null;
    }
  }

  // Для защищённых путей — сразу 401, чтобы не ловить IntegrityError
  const needsAuth = url.pathname.startsWith("/api/aki/ratings");
  if (needsAuth && !access) {
    return new NextResponse(JSON.stringify({ detail: "Unauthorized" }), {
      status: 401,
      headers: { "Content-Type": "application/json" },
    });
  }

  const headers: Record<string, string> = {
    Accept: "application/json",
  };
  const ct = req.headers.get("content-type");
  if (ct) headers["Content-Type"] = ct;
  const csrf = req.headers.get("x-csrftoken");
  if (csrf) headers["X-CSRFToken"] = csrf;
  const cookies = req.headers.get("cookie");
  if (cookies) headers["Cookie"] = cookies;
  if (access) headers["Authorization"] = `Bearer ${access}`;

  let body: string | undefined = undefined;
  if (req.method !== "GET" && req.method !== "HEAD") {
    const raw = await req.text();
    body = raw || undefined;
  }

  const upstream = await fetch(url.toString(), {
    method: req.method,
    headers,
    body,
    redirect: "manual",
    cache: "no-store",
  });

  const resBody = await upstream.text();
  return new NextResponse(resBody, {
    status: upstream.status,
    headers: {
      "Content-Type":
        upstream.headers.get("content-type") || "application/json",
    },
  });
}
