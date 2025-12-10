// src/app/api/bff/_utils.ts
import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/auth";

const BACKEND_ORIGIN =
  process.env.API_BASE?.replace(/\/+$/, "") ||
  "http://127.0.0.1:8000";

// Никогда не импортируй этот файл в клиентский код
export async function proxyToBackend(req: NextRequest, path: string) {
  const url = new URL(`${BACKEND_ORIGIN}${path}`);
  const srcUrl = new URL(req.url);
  srcUrl.searchParams.forEach((v, k) => url.searchParams.set(k, v));

  const session = await auth(); // server-only
  const access = (session as any)?.backendTokens?.access ?? null;

  const headers = new Headers(req.headers);
  headers.set("host", url.host);
  headers.delete("cookie");
  headers.delete("origin");

  if (access) headers.set("Authorization", `Bearer ${access}`);

  let body: BodyInit | undefined = undefined;
  if (req.method !== "GET" && req.method !== "HEAD") {
    body = req.body as any;
    // duplex обязателен, если передаём стрим тела
    (headers as any).duplex = "half";
  }

  const backendResp = await fetch(url.toString(), {
    method: req.method,
    headers,
    body,
    // @ts-ignore — для node-fetch stream duplex
    duplex: body ? "half" : undefined,
    cache: "no-store",
  });

  const respHeaders = new Headers(backendResp.headers);
  respHeaders.delete("set-cookie");
  return new NextResponse(backendResp.body, {
    status: backendResp.status,
    headers: respHeaders,
  });
}
