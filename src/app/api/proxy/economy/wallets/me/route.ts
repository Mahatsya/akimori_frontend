// src/app/api/proxy/economy/wallets/me/route.ts
import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/auth";

const API_BASE =
  process.env.API_BASE ||
  process.env.NEXT_PUBLIC_API_BASE ||
  "http://127.0.0.1:8000";

const API_PREFIX = (process.env.API_PREFIX || "/api").replace(/\/+$/, "");

function buildTarget(req: NextRequest) {
  const qs = req.nextUrl.search || "";
  // Django: /api/economy/wallets/me/
  return `${API_BASE.replace(/\/$/, "")}${API_PREFIX}/economy/wallets/me/${qs}`;
}

export async function GET(req: NextRequest) {
  const target = buildTarget(req);

  // 1) Берём сессию через NextAuth (auth() из src/auth.ts)
  const session = await auth();

  // access лежит у тебя здесь:
  const access =
    (session as any)?.backendTokens?.access ??
    (session as any)?.access ??
    null;

  // Если нет access-токена — не толкаем запрос дальше, просто 401
  if (!access) {
    return NextResponse.json({ detail: "Unauthorized" }, { status: 401 });
  }

  // 2) Собираем заголовки для Django
  const headers: Record<string, string> = {
    accept: "application/json",
    Authorization: `Bearer ${access}`, // <-- ВАЖНО: именно так SimpleJWT и ждёт
  };

  const contentType = req.headers.get("content-type");
  if (contentType) headers["content-type"] = contentType;

  // Куки пробрасывать не обязательно, но можно — вдруг ещё что-то понадобится
  const cookie = req.headers.get("cookie");
  if (cookie) {
    headers["cookie"] = cookie;
  }

  // 3) Делаем запрос к Django
  const upstream = await fetch(target, {
    method: "GET",
    headers,
    redirect: "manual",
  });

  const text = await upstream.text();
  const resp = new NextResponse(text, { status: upstream.status });

  const ct = upstream.headers.get("content-type");
  if (ct) resp.headers.set("content-type", ct);

  return resp;
}
