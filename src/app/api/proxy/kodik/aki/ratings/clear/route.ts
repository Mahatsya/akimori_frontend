export const runtime = "nodejs";
export const dynamic = "force-dynamic";

import { NextRequest } from "next/server";
import { proxyToBackend } from "@/app/api/proxy/kodik/_utils";

// DELETE /api/proxy/kodik/aki/ratings/clear?material=<id>
export async function DELETE(req: NextRequest) {
  return proxyToBackend(req, "/api/aki/ratings/clear/");
}

// На GET/POST отдаём 405
export async function GET() {
  return new Response(JSON.stringify({ detail: "Method Not Allowed" }), {
    status: 405,
    headers: { "Content-Type": "application/json" },
  });
}
export async function POST() {
  return new Response(JSON.stringify({ detail: "Method Not Allowed" }), {
    status: 405,
    headers: { "Content-Type": "application/json" },
  });
}
