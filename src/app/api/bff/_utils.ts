// src/app/api/bff/_utils.ts
import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/auth";

const BACKEND_ORIGIN =
  (process.env.API_BASE?.replace(/\/+$/, "") || "http://127.0.0.1:8000");

export async function proxyToBackend(req: NextRequest, path: string) {
  const url = new URL(`${BACKEND_ORIGIN}${path}`);

  // пробрасываем querystring
  const srcUrl = new URL(req.url);
  srcUrl.searchParams.forEach((v, k) => url.searchParams.set(k, v));

  const session = await auth(); // server-only
  const access = (session as any)?.access ?? null;

  const headers = new Headers(req.headers);
  // Чистим лишнее
  headers.delete("cookie");
  headers.delete("origin");
  headers.delete("host");
  headers.delete("authorization");

  if (access) headers.set("authorization", `Bearer ${access}`);

  let body: BodyInit | undefined = undefined;
  const method = req.method.toUpperCase();

  if (method !== "GET" && method !== "HEAD") {
    body = req.body as any;
  }

  const backendResp = await fetch(url.toString(), {
    method,
    headers,
    body,
    // @ts-ignore duplex нужен в Node при стриме body
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
