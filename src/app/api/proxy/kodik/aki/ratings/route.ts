export const runtime = "nodejs";
export const dynamic = "force-dynamic";

import { NextRequest } from "next/server";
import { proxyToBackend } from "@/app/api/proxy/kodik/_utils";

/**
 * Маршруты фронтового прокси:
 *  GET    /api/proxy/kodik/aki/ratings/me?material=ID
 *  DELETE /api/proxy/kodik/aki/ratings/clear?material=ID
 *  POST   /api/proxy/kodik/aki/ratings        (body: {material, score})
 */
export async function GET(req: NextRequest) {
  const url = new URL(req.url);
  if (url.pathname.endsWith("/me")) {
    return proxyToBackend(req, "/api/aki/ratings/me/");
  }
  // если случайно дернули GET на корень — 404
  return new Response(JSON.stringify({ detail: "Not Found" }), {
    status: 404,
    headers: { "Content-Type": "application/json" },
  });
}

export async function POST(req: NextRequest) {
  // апсерт
  return proxyToBackend(req, "/api/aki/ratings/");
}

export async function DELETE(req: NextRequest) {
  const url = new URL(req.url);
  if (url.pathname.endsWith("/clear")) {
    return proxyToBackend(req, "/api/aki/ratings/clear/");
  }
  return new Response(JSON.stringify({ detail: "Not Found" }), {
    status: 404,
    headers: { "Content-Type": "application/json" },
  });
}
